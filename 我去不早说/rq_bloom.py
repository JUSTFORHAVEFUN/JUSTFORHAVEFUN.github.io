import numpy as np
from manim import *

tex_template = TexTemplate()
tex_template.add_to_preamble(r"\usepackage{ctex}")
tex_template.tex_compiler = "xelatex"
tex_template.output_format = ".xdv"
MathTex.set_default(tex_template=tex_template)

config.frame_rate = 30
FONT = "Source Han Sans CN"
BOTTOM_POS = np.array([0, -3.5, 0])


class RqToBloom(Scene):
    def construct(self):
        def swap_slide(old, new):
            new.move_to(BOTTOM_POS)
            self.play(
                FadeOut(old, run_time=0.4, shift=DOWN * 0.25),
                FadeIn(new, run_time=0.4, shift=UP * 0.25)
            )
            return new

        # ===== 核心参数 =====
        N_DIR = 72
        N_SAMPLE = 80
        R_PHYS = 1.5          # 物理采样半径
        SCALE = 1.0

        def a_of(t):
            return 1 + np.sin(t)

        def b_of(t):
            return 1.2 * np.sin(2 * t)

        def metq_of(a, b):
            return a ** 2 - b ** 2

        # ==========================================
        # 第一幕：R(q) 空间
        # ==========================================
        title = Text("第一步：在 R(q) 空间中放置一条物理曲线",
                     font_size=26, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=0.8)
        self.wait(0.5)

        rq_axes = Axes(
            x_range=[-0.5, 2.5, 0.5], y_range=[-1.5, 1.5, 0.5],
            axis_config={"color": GRAY, "stroke_width": 1.5},
            x_length=5, y_length=5
        ).move_to([-3.5, 0, 0])
        rq_xl = MathTex(r"a", font_size=22, color=GREEN).next_to(rq_axes.x_axis, RIGHT, buff=0.1)
        rq_yl = MathTex(r"b", font_size=22, color=BLUE).next_to(rq_axes.y_axis, UP, buff=0.1)
        self.play(Create(rq_axes), Write(rq_xl), Write(rq_yl), run_time=0.8)

        cone1 = rq_axes.plot(lambda x: x, x_range=[-0.3, 2.3], color=YELLOW,
                             stroke_width=1.5, stroke_opacity=0.5)
        cone2 = rq_axes.plot(lambda x: -x, x_range=[-0.3, 2.3], color=YELLOW,
                             stroke_width=1.5, stroke_opacity=0.5)
        self.play(Create(cone1), Create(cone2), run_time=0.8)
        cone_lbl = Text("零锥 a = ±b", font_size=14, color=YELLOW).move_to(rq_axes.c2p(2.0, 1.3))
        self.play(Write(cone_lbl), run_time=0.4)

        # 物理曲线
        t_all = np.linspace(0, 8 * np.pi, 2000)
        a_all = a_of(t_all)
        b_all = b_of(t_all)
        phys_pts = [rq_axes.c2p(a_all[i], b_all[i]) for i in range(len(t_all))]
        phys_curve = VMobject()
        phys_curve.set_points_smoothly(phys_pts)
        phys_curve.set_color(BLUE)
        phys_curve.set_stroke(width=2.5)
        self.play(Create(phys_curve), run_time=3)
        self.wait(1)

        desc = Text("物理曲线：a(t) = 1 + sin(t),  b(t) = 1.2 sin(2t)",
                    font_size=18, font=FONT, color=GRAY).move_to(BOTTOM_POS)
        self.play(Write(desc), run_time=0.6)
        self.wait(1.5)

        # ==========================================
        # 第二幕：6 个采样点
        # ==========================================
        title2 = Text("第二步：均匀 + 抖动地取出 6 个采样点",
                      font_size=26, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.4)
        self.play(Transform(title, title2), run_time=0.5)

        np.random.seed(20260913)
        base_ts = np.linspace(0.5, 3.7, 6)
        jitter = np.random.uniform(-0.15, 0.15, 6)
        sample_ts = base_ts + jitter

        sample_dots = VGroup()
        for t_s in sample_ts:
            a_s = a_of(t_s)
            b_s = b_of(t_s)
            d = Dot(rq_axes.c2p(a_s, b_s), color=RED, radius=0.1)
            sample_dots.add(d)
        self.play(LaggedStart(*[FadeIn(d) for d in sample_dots], lag_ratio=0.2),
                  run_time=1.5)
        self.wait(1.5)

        desc2 = Text("这 6 个点将各自生成一朵花瓣", font_size=18,
                     font=FONT, color=GRAY).move_to(BOTTOM_POS)
        desc2 = swap_slide(desc, desc2)
        self.wait(1)

        # ==========================================
        # 第三幕：映射规则推导
        # ==========================================
        title3 = Text("第三步：建立从 R(q) 到显示平面的映射",
                      font_size=26, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.4)
        self.play(Transform(title, title3), run_time=0.5)
        self.wait(0.3)

        step1 = MathTex(r"P_0 = a_0 + b_0\, q", font_size=32, color=YELLOW).move_to([3.5, 1.8, 0])
        self.play(Write(step1), run_time=0.6)
        step2 = MathTex(r"\mathrm{MetQ}(P_0) = a_0^2 - b_0^2",
                        font_size=30, color=ORANGE).move_to([3.5, 0.9, 0])
        self.play(Write(step2), run_time=0.6)
        step3 = MathTex(r"r = \sqrt{|\mathrm{MetQ}(P)|}",
                        font_size=30, color=GREEN).move_to([3.5, 0, 0])
        self.play(Write(step3), run_time=0.6)
        step4 = MathTex(r"\theta = \operatorname{atan2}(b, a) - \operatorname{atan2}(b_0, a_0)",
                        font_size=26, color=PURPLE).move_to([3.5, -0.9, 0])
        self.play(Write(step4), run_time=0.8)
        self.wait(1.5)

        desc3 = Text("每个采样点被映射成 (r·cosθ, r·sinθ)",
                     font_size=18, font=FONT, color=GRAY).move_to(BOTTOM_POS)
        desc3 = swap_slide(desc2, desc3)
        self.wait(1)

        self.play(FadeOut(step1), FadeOut(step2),
                  FadeOut(step3), FadeOut(step4), run_time=0.5)
        self.wait(0.3)

        # ==========================================
        # 第四幕：点滑动演示
        # ==========================================
        title4 = Text("第四步：让蚂蚁沿物理曲线滑动，映射轨迹同步生长",
                      font_size=24, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.4)
        self.play(Transform(title, title4), run_time=0.5)
        self.wait(0.3)

        # 右边显示平面
        disp_axes = Axes(
            x_range=[-3, 3, 1], y_range=[-3, 3, 1],
            axis_config={"color": GRAY, "stroke_width": 1.5},
            x_length=5, y_length=5
        ).move_to([3.5, 0, 0])
        disp_xl = MathTex(r"x", font_size=22, color=GREEN).next_to(disp_axes.x_axis, RIGHT, buff=0.1)
        disp_yl = MathTex(r"y", font_size=22, color=BLUE).next_to(disp_axes.y_axis, UP, buff=0.1)
        self.play(Create(disp_axes), Write(disp_xl), Write(disp_yl), run_time=0.8)

        # 显示平面上的参考圆
        for rr in [1.0, 2.0]:
            circ = Circle(radius=rr * (disp_axes.x_length / 6), color=GRAY,
                          stroke_width=0.5, stroke_opacity=0.3).move_to(disp_axes.get_origin())
            self.add(circ)
        self.wait(0.3)

        # 蚂蚁
        N_DEMO = 1500
        t_demo = np.linspace(0, 8 * np.pi, N_DEMO)
        a_demo = a_of(t_demo)
        b_demo = b_of(t_demo)
        metq_demo = a_demo ** 2 - b_demo ** 2
        m_demo = np.sqrt(np.abs(metq_demo))

        dt_demo = t_demo[1] - t_demo[0]
        S_demo = np.cumsum(m_demo) * dt_demo
        S_demo = S_demo - S_demo[0]
        theta_demo = S_demo % (2 * np.pi)

        x_demo = m_demo * np.cos(theta_demo)
        y_demo = m_demo * np.sin(theta_demo)

        demo_pts_disp = [disp_axes.c2p(x_demo[i], y_demo[i]) for i in range(N_DEMO)]
        demo_pts_phys = [rq_axes.c2p(a_demo[i], b_demo[i]) for i in range(N_DEMO)]

        # 蚂蚁在物理曲线上
        ant_tracker = ValueTracker(0)

        def get_ant():
            idx = int(ant_tracker.get_value() * (N_DEMO - 1))
            idx = max(0, min(idx, N_DEMO - 1))
            return Dot(demo_pts_phys[idx], color=RED, radius=0.12)

        def get_trail():
            idx_max = max(1, int(ant_tracker.get_value() * (N_DEMO - 1)))
            step = max(1, idx_max // 800)
            pts = [demo_pts_disp[i] for i in range(0, idx_max + 1, step)]
            if len(pts) < 2:
                pts = [disp_axes.get_origin(), disp_axes.get_origin()]
            trail = VMobject()
            trail.set_points_as_corners(pts)
            trail.set_stroke(color=ORANGE, width=1.8, opacity=0.9)
            return trail

        ant = always_redraw(get_ant)
        trail = always_redraw(get_trail)
        self.add(ant, trail)
        self.wait(0.3)

        desc4 = Text("物理曲线上的蚂蚁 → 显示平面上的轨迹",
                     font_size=18, font=FONT, color=GRAY).move_to(BOTTOM_POS)
        desc4 = swap_slide(desc3, desc4)
        self.wait(0.5)

        self.play(ant_tracker.animate.set_value(1.0), run_time=10, rate_func=linear)
        self.wait(1)

        self.play(
            FadeOut(ant), FadeOut(trail), FadeOut(phys_curve),
            FadeOut(rq_axes), FadeOut(rq_xl), FadeOut(rq_yl),
            FadeOut(cone1), FadeOut(cone2), FadeOut(cone_lbl),
            FadeOut(sample_dots),
            run_time=1
        )
        self.wait(0.5)

        # ==========================================
        # 第五幕：6 个采样点各自生成花瓣
        # ==========================================
        title5 = Text("第五步：6 个采样点各自生成一朵花瓣",
                      font_size=26, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.4)
        self.play(Transform(title, title5), run_time=0.5)
        self.wait(0.5)

        desc5 = Text("颜色：绿=MetQ>0，红=MetQ<0，黄=MetQ≈0",
                     font_size=16, font=FONT, color=GRAY).move_to(BOTTOM_POS)
        self.play(Write(desc5), run_time=0.5)
        self.wait(0.5)

        # 逐一生成每朵花
        for idx, t_s in enumerate(sample_ts):
            a0 = a_of(t_s)
            b0 = b_of(t_s)
            metq0 = metq_of(a0, b0)
            theta0 = np.arctan2(b0, a0)

            if metq0 > 0.05:
                color = "#00e88f"
            elif metq0 < -0.05:
                color = "#ff3060"
            else:
                color = "#ffd93d"

            petals = VGroup()
            for k in range(N_DIR):
                phi = 2 * np.pi * k / N_DIR
                pts = []
                for i in range(N_SAMPLE + 1):
                    r_phys = R_PHYS * i / N_SAMPLE
                    a_p = a0 + r_phys * np.cos(phi)
                    b_p = b0 + r_phys * np.sin(phi)
                    mq = a_p ** 2 - b_p ** 2
                    R_disp = np.sqrt(np.abs(mq))
                    # 关键：显示角度由物理点的 atan2 决定
                    psi = np.arctan2(b_p, a_p) - theta0
                    x = R_disp * np.cos(psi) * SCALE
                    y = R_disp * np.sin(psi) * SCALE
                    pts.append(disp_axes.c2p(x, y))
                line = VMobject()
                line.set_points_as_corners(pts)
                line.set_stroke(color=color, width=1.0, opacity=0.75)
                petals.add(line)

            info = Text(
                f"采样点 {idx + 1}/6    t = {t_s:.2f}    "
                f"a = {a0:.2f}    b = {b0:.2f}    MetQ = {metq0:.2f}",
                font_size=16, font=FONT, color=color
            ).move_to(BOTTOM_POS)

            self.play(
                FadeIn(petals, shift=UP * 0.5, scale=0.85),
                Transform(desc5, info),
                run_time=0.8
            )
            self.wait(1.2)
            self.play(FadeOut(petals, shift=UP * 0.3, scale=1.1), run_time=0.5)
            self.wait(0.3)

        # ==========================================
        # 收尾
        # ==========================================
        end_text = Text("R(q) 度量空间中的花瓣", font_size=26,
                        font=FONT, weight=BOLD, color=YELLOW).move_to(BOTTOM_POS)
        self.play(Transform(desc5, end_text), run_time=0.6)
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects])
        self.wait(0.3)