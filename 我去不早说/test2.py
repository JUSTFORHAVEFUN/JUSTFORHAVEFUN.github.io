import numpy as np
from manim import *

tex_template = TexTemplate()
tex_template.add_to_preamble(r"\usepackage{ctex}")
tex_template.tex_compiler = "xelatex"
tex_template.output_format = ".xdv"
MathTex.set_default(tex_template=tex_template)

FONT = "Source Han Sans CN"
BOTTOM_POS = np.array([0, -3.6, 0])


class Scene7_AntOnMetricLine(Scene):
    """
    场景7：数轴的真实自交
    物理曲线 a(t)=2.5+1.2sin(t), b(t)=1.5sin(2t), t∈[0, 4π]
    自动搜索自交点：MetQ 相近且 a 相近的点对
    """

    def construct(self):
        def swap_slide(old, new):
            new.move_to(BOTTOM_POS)
            self.play(
                FadeOut(old, run_time=0.5, shift=DOWN * 0.3),
                FadeIn(new, run_time=0.5, shift=UP * 0.3)
            )
            return new

        # ============================================
        # 标题
        # ============================================
        title = Text("数轴的自交：一维线段的度量扭曲",
                     font_size=26, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.35)
        self.play(Write(title))
        self.wait(1.5)

        desc1 = Text("在 R(q) 度量空间中，一条数轴会发生什么？", font_size=22, font=FONT, color=GRAY)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(1.5)

        desc2 = Text("它会拉伸、收缩、扭曲，甚至自我相交。", font_size=22, font=FONT, color=YELLOW)
        desc2 = swap_slide(desc1, desc2)
        self.wait(2)

        # ============================================
        # 参数
        # ============================================
        t_max = 4 * np.pi
        N = 3000
        t_vals = np.linspace(0, t_max, N)
        a_vals = 2.5 + 1.2 * np.sin(t_vals)
        b_vals = 1.5 * np.sin(2 * t_vals)
        metq_vals = a_vals**2 - b_vals**2

        # ============================================
        # 自动搜索自交点
        # ============================================
        grid = {}
        self_intersections = []
        for i in range(0, N, 3):
            key = (round(metq_vals[i], 1), round(a_vals[i], 1))
            if key in grid:
                j = grid[key]
                if i - j > 50:
                    self_intersections.append((i, j))
            else:
                grid[key] = i

        # 去重
        unique_ints = []
        for (i, j) in self_intersections:
            pt = (metq_vals[i], a_vals[i])
            if not any(abs(pt[0]-u[0]) < 0.3 and abs(pt[1]-u[1]) < 0.1 for u in unique_ints):
                unique_ints.append(pt)

        # ============================================
        # 阶段 1：物理曲线（左上角小图）
        # ============================================
        desc3 = Text("第一步：让蚂蚁沿一条物理曲线爬行。", font_size=22, font=FONT, color=GREEN)
        desc3 = swap_slide(desc2, desc3)
        self.wait(1)

        phys_axes = Axes(
            x_range=[1, 4, 1], y_range=[-2, 2, 1],
            axis_config={"color": GRAY, "stroke_width": 1.5},
            x_length=2.8, y_length=2.0
        ).move_to([-5.0, 1.5, 0])
        phys_xl = MathTex(r"a", font_size=16, color=GREEN).next_to(phys_axes.x_axis, RIGHT, buff=0.1)
        phys_yl = MathTex(r"b", font_size=16, color=BLUE).next_to(phys_axes.y_axis, UP, buff=0.1)
        self.play(Create(phys_axes), Write(phys_xl), Write(phys_yl))

        cone1 = phys_axes.plot(lambda x: x, x_range=[1, 2], color=YELLOW,
                               stroke_width=1, stroke_opacity=0.5)
        cone2 = phys_axes.plot(lambda x: -x, x_range=[1, 2], color=YELLOW,
                               stroke_width=1, stroke_opacity=0.5)
        self.play(Create(cone1), Create(cone2))
        self.wait(0.5)

        precomputed_phys_pts = [phys_axes.c2p(a_vals[i], b_vals[i]) for i in range(N)]
        phys_path = VMobject()
        phys_path.set_points_smoothly(precomputed_phys_pts)
        phys_path.set_color(BLUE)
        phys_path.set_stroke(width=2)
        self.play(Create(phys_path), run_time=3)
        self.wait(0.8)

        ant_tracker = ValueTracker(0.001)
        precomputed_phys_pts_arr = precomputed_phys_pts

        def get_ant():
            idx = int(ant_tracker.get_value() * (N - 1))
            idx = max(0, min(idx, N - 1))
            return Dot(precomputed_phys_pts_arr[idx], color=RED, radius=0.09)

        ant = always_redraw(get_ant)
        self.play(FadeIn(ant))

        # ============================================
        # 阶段 2：度量空间（主舞台）
        # ============================================
        desc4 = Text("第二步：把 (MetQ, a) 作为坐标系，这是“度量数轴”。", font_size=20, font=FONT, color=GREEN)
        desc4 = swap_slide(desc3, desc4)
        self.wait(1)

        metric_axes = Axes(
            x_range=[-1, 15, 2], y_range=[1, 4, 0.5],
            axis_config={"color": GRAY, "stroke_width": 1.5},
            x_length=11, y_length=4.0
        ).move_to([0.3, -1.2, 0])
        metric_xl = MathTex(r"\mathrm{MetQ}", font_size=20, color=ORANGE).next_to(metric_axes.x_axis, RIGHT, buff=0.1)
        metric_yl = MathTex(r"a", font_size=20, color=GREEN).next_to(metric_axes.y_axis, UP, buff=0.1)
        self.play(Create(metric_axes), Write(metric_xl), Write(metric_yl))
        self.wait(0.5)

        precomputed_metric_pts = [metric_axes.c2p(metq_vals[i], a_vals[i]) for i in range(N)]

        # ============================================
        # 阶段 3：轨迹实时绘制
        # ============================================
        desc5 = Text("第三步：数轴随蚂蚁的爬行实时生长。", font_size=20, font=FONT, color=GRAY)
        desc5 = swap_slide(desc4, desc5)
        self.wait(1)

        metric_trail = VMobject()
        metric_trail.set_color(ORANGE)
        metric_trail.set_stroke(width=4)
        start_pt = precomputed_metric_pts[0]
        metric_trail.set_points_as_corners([start_pt, start_pt])

        def update_trail(mob):
            p = ant_tracker.get_value()
            idx_max = max(1, int(p * (N - 1)))
            step = max(1, idx_max // 400)
            pts = [precomputed_metric_pts[i] for i in range(0, idx_max + 1, step)]
            end_pt = precomputed_metric_pts[idx_max]
            if len(pts) < 2:
                pts = [end_pt, end_pt]
            elif np.linalg.norm(pts[-1] - end_pt) > 0.01:
                pts.append(end_pt)
            mob.set_points_as_corners(pts)

        metric_trail.add_updater(update_trail)
        self.add(metric_trail)

        self.play(FadeIn(metric_trail))
        self.wait(0.3)

        # 蚂蚁爬行，轨迹生长
        self.play(
            ant_tracker.animate.set_value(1.0),
            run_time=15,
            rate_func=linear
        )
        self.wait(2)

        # ============================================
        # 阶段 4：高亮自交点
        # ============================================
        desc6 = Text("注意！轨迹回到了之前经过的位置 —— 它自己穿过自己！", font_size=20, font=FONT, color=YELLOW)
        desc6 = swap_slide(desc5, desc6)
        self.wait(1)

        # 初始化（防止 unique_ints 为空时报错）
        phys_si1 = phys_si2 = metric_si = pulse = lbl1 = lbl2 = si_lbl = None

        if unique_ints:
            target_metq, target_a = unique_ints[0]

            # 寻找最早和最晚到达该点的索引
            idx1 = 0
            idx2 = N - 1
            for i in range(N):
                if abs(metq_vals[i] - target_metq) < 0.1 and abs(a_vals[i] - target_a) < 0.1:
                    idx1 = i
                    break
            for i in range(N - 1, -1, -1):
                if abs(metq_vals[i] - target_metq) < 0.1 and abs(a_vals[i] - target_a) < 0.1:
                    idx2 = i
                    break

            si_metq = metq_vals[idx1]
            si_a = a_vals[idx1]

            phys_si1 = Dot(precomputed_phys_pts[idx1], color=YELLOW, radius=0.1)
            phys_si2 = Dot(precomputed_phys_pts[idx2], color=YELLOW, radius=0.1)
            metric_si = Dot(metric_axes.c2p(si_metq, si_a), color=YELLOW, radius=0.14)

            pulse = Circle(radius=0.3, color=YELLOW, stroke_width=3).move_to(
                metric_axes.c2p(si_metq, si_a)
            )

            self.play(FadeIn(phys_si1), FadeIn(phys_si2), FadeIn(metric_si))
            self.play(Create(pulse))
            self.play(pulse.animate.scale(1.8).set_stroke(opacity=0), run_time=1.5)
            self.wait(1)

            lbl1 = Text("物理点 1", font_size=14, color=YELLOW).next_to(phys_si1, UP, buff=0.1)
            lbl2 = Text("物理点 2", font_size=14, color=YELLOW).next_to(phys_si2, DOWN, buff=0.1)
            self.play(Write(lbl1), Write(lbl2))
            self.wait(1)

            si_lbl = MathTex(
                rf"\mathrm{{MetQ}} \approx {si_metq:.2f},\; a \approx {si_a:.2f}",
                font_size=18, color=YELLOW
            ).next_to(metric_si, UP, buff=0.25)
            self.play(Write(si_lbl))
            self.wait(2)

        desc7 = Text("两个完全不同的物理点，被映射到数轴上的同一点。", font_size=20, font=FONT, color=YELLOW)
        desc7 = swap_slide(desc6, desc7)
        self.wait(2)

        # ============================================
        # 阶段 5：数学推导
        # ============================================
        desc8 = Text("第四步：为什么必然自交？", font_size=22, font=FONT, color=GREEN)
        desc8 = swap_slide(desc7, desc8)
        self.wait(1.2)

        reason1 = MathTex(
            r"\text{对于 } t' = \pi - t:",
            font_size=26, color=WHITE
        ).move_to([0, 0.5, 0])
        self.play(Write(reason1))
        self.wait(1)

        reason2 = MathTex(
            r"a(t) = a(t') \;\Rightarrow\; a \text{ 相同}",
            font_size=24, color=GREEN
        ).move_to([0, -0.6, 0])
        self.play(Write(reason2))
        self.wait(1)

        reason3 = MathTex(
            r"b(t) = -b(t') \;\Rightarrow\; \mathrm{MetQ}(t) = \mathrm{MetQ}(t')",
            font_size=24, color=ORANGE
        ).move_to([0, -1.7, 0])
        self.play(Write(reason3))
        self.wait(2)

        desc9 = Text("所以任意 t 与 π-t 是一对自交原像。", font_size=20, font=FONT, color=GRAY)
        desc9 = swap_slide(desc8, desc9)
        self.wait(2)

        self.play(FadeOut(reason1), FadeOut(reason2), FadeOut(reason3))
        self.wait(0.5)

        # ============================================
        # 阶段 6：结论
        # ============================================
        desc10 = Text("结论：在 R(q) 度量空间中，", font_size=22, font=FONT, color=GREEN)
        desc10 = swap_slide(desc9, desc10)
        self.wait(1.2)

        desc11 = Text("一维数轴被扭曲、折叠，并且真实地自我相交。", font_size=22, font=FONT, weight=BOLD, color=RED)
        desc11 = swap_slide(desc10, desc11)
        self.wait(2)

        desc12 = Text("这就是“零路长，正位移”的几何图像。", font_size=22, font=FONT, weight=BOLD, color=YELLOW)
        desc12 = swap_slide(desc11, desc12)
        self.wait(2.5)

        # ============================================
        # 收尾清理
        # ============================================
        cleanup_mobs = [
            title, desc12,
            phys_axes, phys_xl, phys_yl,
            cone1, cone2, phys_path, ant,
            metric_axes, metric_xl, metric_yl,
            metric_trail
        ]
        if unique_ints:
            cleanup_mobs += [phys_si1, phys_si2, metric_si, pulse, lbl1, lbl2, si_lbl]

        self.play(*[FadeOut(m) for m in cleanup_mobs])
        self.wait(0.5)