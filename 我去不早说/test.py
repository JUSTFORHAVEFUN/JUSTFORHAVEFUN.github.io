from manim import *
import numpy as np

# ===== 中文 LaTeX 模板 =====
tex_template = TexTemplate()
tex_template.add_to_preamble(r"\usepackage{ctex}")
tex_template.tex_compiler = "xelatex"
tex_template.output_format = ".xdv"
MathTex.set_default(tex_template=tex_template)

FONT = "Source Han Sans CN"
BOTTOM_POS = np.array([0, -3.3, 0])


# ===== 通用过渡工具函数 =====
def swap_slide(scene, old, new, direction=DOWN, run_time=0.7):
    new.move_to(BOTTOM_POS)
    scene.play(
        FadeOut(old, run_time=run_time, shift=direction * 0.3),
        FadeIn(new, run_time=run_time, shift=-direction * 0.3)
    )
    scene.remove(old)
    return new


class Scene3_MetQIntro(Scene):
    """场景3：引入 q 与 MetQ，逐步推导，修复排版"""

    def construct(self):
        title = Text("引入新维度 q：模长公式的逐步推导", font_size=28, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.7)
        self.play(Write(title))
        self.wait(2)

        desc1 = Text("先回顾复数的模长是怎么算出来的。", font_size=22, font=FONT, color=BLUE)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(2)

        # ===== 用 VGroup 统一排列公式，防重叠 =====
        # 第一部分：复数公式
        z_def = MathTex(r"z = a + bi \quad (a, b \in \mathbb{R})", font_size=40, color=BLUE)
        z_conj = MathTex(r"\bar{z} = a - bi", font_size=40, color=BLUE)
        z_prod = MathTex(r"z \cdot \bar{z} = (a + bi)(a - bi)", font_size=36, color=BLUE)
        z_expand = MathTex(r"= a^2 - abi + abi - b^2 i^2", font_size=36, color=BLUE)
        z_simplify = MathTex(r"= a^2 - b^2(-1) = a^2 + b^2", font_size=40, color=GREEN)

        group_z = VGroup(z_def, z_conj, z_prod, z_expand, z_simplify).arrange(DOWN, buff=0.4).move_to([0, 0.8, 0])

        self.play(Write(z_def))
        self.wait(1)
        self.play(Write(z_conj))
        self.wait(1)
        
        desc2 = Text("乘以共轭复数：", font_size=20, font=FONT, color=GRAY)
        desc1 = swap_slide(self, desc1, desc2)
        self.wait(1)

        self.play(Write(z_prod))
        self.wait(1)
        self.play(Write(z_expand))
        self.wait(1)

        desc3 = Text("注意 i² = -1，所以中间项相消：", font_size=20, font=FONT, color=YELLOW)
        desc2 = swap_slide(self, desc2, desc3)
        self.wait(2)

        self.play(Write(z_simplify))
        self.wait(3)

        desc4 = Text("所以复数模长的平方是 a² + b²，两项都是正贡献。", font_size=20, font=FONT, color=GREEN)
        desc3 = swap_slide(self, desc3, desc4)
        self.wait(3)

        # 清场
        self.play(FadeOut(group_z))

        # 第二部分：R(q) 的模长
        desc5 = Text("现在把 i 换成 q，但关键区别是 —— q² = +1。", font_size=22, font=FONT, color=RED)
        desc4 = swap_slide(self, desc4, desc5)
        self.wait(2)

        w_def = MathTex(r"w = a + bq \quad (a, b \in \mathbb{R})", font_size=40, color=RED)
        w_conj = MathTex(r"\bar{w} = a - bq", font_size=40, color=RED)
        w_prod = MathTex(r"w \cdot \bar{w} = (a + bq)(a - bq)", font_size=36, color=RED)
        w_expand = MathTex(r"= a^2 - b^2 q^2 = a^2 - b^2", font_size=40, color=ORANGE)

        group_w = VGroup(w_def, w_conj, w_prod, w_expand).arrange(DOWN, buff=0.4).move_to([0, 0.8, 0])

        self.play(Write(w_def))
        self.wait(1)
        self.play(Write(w_conj))
        self.wait(1)
        self.play(Write(w_prod))
        self.wait(1)

        desc6 = Text("展开，并且注意 q² = +1（不是 -1）：", font_size=20, font=FONT, color=YELLOW)
        desc5 = swap_slide(self, desc5, desc6)
        self.wait(2)

        self.play(Write(w_expand))
        self.wait(3)

        desc7 = Text("这就是 MetQ 的定义：a² 和 b² 贡献相反。", font_size=20, font=FONT, color=ORANGE)
        desc6 = swap_slide(self, desc6, desc7)
        self.wait(3)

        self.play(FadeOut(group_w))

        met_q = MathTex(r"\mathrm{MetQ}(a + bq) = a^2 - b^2", font_size=50, color=ORANGE).move_to([0, 0.5, 0])
        self.play(Write(met_q))
        self.play(Indicate(met_q, color=ORANGE, scale_factor=1.15))
        self.wait(3)

        # 清场
        self.play(FadeOut(met_q))

        # 第三部分：四维拓展
        desc8 = Text("同时引入 i 和 q，就得到四维空间 R(q, i)：", font_size=22, font=FONT, color=PURPLE)
        desc7 = swap_slide(self, desc7, desc8)
        self.wait(2)

        rqi = MathTex(r"R(q, i) = \{\, a + bi + cq + diq \;\mid\; a,b,c,d \in \mathbb{R} \,\}", font_size=26, color=PURPLE).move_to([0, 1.5, 0])
        self.play(Write(rqi))
        self.wait(2)

        desc9 = Text("对应的 MetQ，四项符号依次是 +, +, −, −：", font_size=20, font=FONT, color=GRAY)
        desc8 = swap_slide(self, desc8, desc9)
        self.wait(2)

        met_rqi = MathTex(r"\mathrm{MetQ} = a^2 + b^2 - c^2 - d^2", font_size=50, color=ORANGE).move_to([0, -0.5, 0])
        self.play(Write(met_rqi))
        self.wait(3)

        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)


class Scene4_ZeroCone(Scene):
    """场景4：零锥与非平凡零点，修复排版"""

    def construct(self):
        title = Text("退回到二维 R(q)：零锥与非平凡零点", font_size=28, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.7)
        self.play(Write(title))
        self.wait(2)

        desc1 = Text("四维空间 R(q, i) 无法直接可视化，先退回二维 R(q)。", font_size=22, font=FONT, color=YELLOW)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(3)

        # 坐标系（稍微向上移动，给底部留出文字空间）
        axes = Axes(
            x_range=[-3, 3, 1], y_range=[-2.5, 2.5, 1],
            axis_config={"color": GRAY},
            x_length=9, y_length=5.5
        ).move_to([0, 0.5, 0])

        x_label = MathTex(r"a", font_size=28, color=GREEN).next_to(axes.x_axis, RIGHT, buff=0.2)
        y_label = MathTex(r"b", font_size=28, color=BLUE).next_to(axes.y_axis, UP, buff=0.2)

        self.play(Create(axes), Write(x_label), Write(y_label))
        self.wait(2)

        # 将公式放在左下角，避免遮挡中心曲线
        met_q = MathTex(r"\mathrm{MetQ} = a^2 - b^2", font_size=34, color=ORANGE).to_corner(UL, buff=1.5)
        self.play(Write(met_q))
        self.wait(2)

        desc2 = Text("第一步：令 MetQ = 0，寻找模长为零的点。", font_size=20, font=FONT, color=YELLOW)
        desc1 = swap_slide(self, desc1, desc2)
        self.wait(2)

        # 在坐标系旁边显示推导
        eq1 = MathTex(r"a^2 - b^2 = 0", font_size=36, color=YELLOW).to_corner(UR, buff=1.5)
        self.play(Write(eq1))
        self.wait(2)

        desc3 = Text("第二步：平方差公式因式分解。", font_size=20, font=FONT, color=YELLOW)
        desc2 = swap_slide(self, desc2, desc3)
        self.wait(2)

        eq2 = MathTex(r"(a - b)(a + b) = 0", font_size=36, color=YELLOW).to_corner(UR, buff=1.5)
        self.play(Transform(eq1, eq2))
        self.wait(2)

        desc4 = Text("第三步：得到两条直线 a = b 和 a = -b。", font_size=20, font=FONT, color=YELLOW)
        desc3 = swap_slide(self, desc3, desc4)
        self.wait(2)

        eq3 = MathTex(r"a = b \quad \text{或} \quad a = -b", font_size=36, color=YELLOW).to_corner(UR, buff=1.5)
        self.play(Transform(eq1, eq3))
        self.wait(2)

        line1 = axes.plot(lambda x: x, x_range=[-2.4, 2.4], color=YELLOW, stroke_width=5)
        line2 = axes.plot(lambda x: -x, x_range=[-2.4, 2.4], color=YELLOW, stroke_width=5)

        self.play(Create(line1), Create(line2))
        self.wait(2)

        desc5 = Text("这两条线称为零锥，它们把平面分成四个区域。", font_size=20, font=FONT, color=GREEN)
        desc4 = swap_slide(self, desc4, desc5)
        self.wait(2)

        pos_right = Polygon(axes.c2p(0, 0), axes.c2p(2.5, 2.5), axes.c2p(2.5, -2.5), color=GREEN, fill_opacity=0.25, stroke_width=0)
        pos_left = Polygon(axes.c2p(0, 0), axes.c2p(-2.5, 2.5), axes.c2p(-2.5, -2.5), color=GREEN, fill_opacity=0.25, stroke_width=0)
        neg_top = Polygon(axes.c2p(0, 0), axes.c2p(-2.5, 2.5), axes.c2p(2.5, 2.5), color=RED, fill_opacity=0.25, stroke_width=0)
        neg_bot = Polygon(axes.c2p(0, 0), axes.c2p(-2.5, -2.5), axes.c2p(2.5, -2.5), color=RED, fill_opacity=0.25, stroke_width=0)

        self.play(FadeIn(pos_right), FadeIn(pos_left))
        self.play(FadeIn(neg_top), FadeIn(neg_bot))
        self.wait(2)

        pos_label = Text("MetQ > 0", font_size=18, font=FONT, color=GREEN).move_to(axes.c2p(3.5, 0))
        neg_label = Text("MetQ < 0", font_size=18, font=FONT, color=RED).move_to(axes.c2p(0, 2.8))
        self.play(Write(pos_label), Write(neg_label))
        self.wait(3)

        desc6 = Text("沿对角线移动：点位置在变，但 MetQ 始终为零。", font_size=20, font=FONT, color=YELLOW)
        desc5 = swap_slide(self, desc5, desc6)
        self.wait(2)

        dot_tracker = ValueTracker(-2.2)
        moving_dot = always_redraw(lambda: Dot(axes.c2p(dot_tracker.get_value(), dot_tracker.get_value()), color=ORANGE, radius=0.12))
        met_value = always_redraw(lambda: MathTex(r"\mathrm{MetQ} = 0", font_size=30, color=ORANGE).to_corner(DL, buff=1.5))
        
        self.play(FadeIn(moving_dot), FadeIn(met_value))
        self.play(dot_tracker.animate.set_value(2.2), run_time=4, rate_func=linear)
        self.wait(2)
        self.play(dot_tracker.animate.set_value(0), run_time=1.5)
        self.wait(1)

        desc7 = Text("这些点在几何上远离原点，但模长却为零。", font_size=20, font=FONT, color=YELLOW)
        desc6 = swap_slide(self, desc6, desc7)
        self.wait(2)

        desc8 = Text("它们被称为“非平凡零点”，是负贡献独有的现象。", font_size=20, font=FONT, color=GRAY)
        desc7 = swap_slide(self, desc7, desc8)
        self.wait(4)

        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)


class Scene5_MetSDefinition(Scene):
    """场景5：MetS 完整推导（13步超详细版，为第6章零路长做铺垫）"""

    def construct(self):
        # ==========================================
        # 步骤 0：标题与问题引入
        # ==========================================
        title = Text("定义 MetS：沿路径累积的“路程”", font_size=28, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.7)
        self.play(Write(title))
        self.wait(2)

        # 底部文字区域固定：BOTTOM_POS = [0, -3.3, 0]
        desc1 = Text("我们已经有了 MetQ，它描述一个点的“位移模长”。", font_size=22, font=FONT, color=GRAY)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(3)

        desc2 = Text("但 MetQ 可能是负数，无法描述真正的“路程”。", font_size=22, font=FONT, color=YELLOW)
        desc1 = swap_slide(self, desc1, desc2)
        self.wait(3)

        desc3 = Text("所以，我们需要一个新的量 —— MetS。", font_size=22, font=FONT, color=GREEN)
        desc2 = swap_slide(self, desc2, desc3)
        self.wait(3)

        # ==========================================
        # 步骤 1：画出函数曲线
        # ==========================================
        desc4 = Text("第一步：先看一条函数曲线。", font_size=22, font=FONT, color=GREEN)
        desc3 = swap_slide(self, desc3, desc4)
        self.wait(2)

        # 坐标轴：中部区域，y 范围严格控制
        axes = Axes(
            x_range=[-3, 3, 1], y_range=[-1, 2.5, 1],
            axis_config={"color": GRAY},
            x_length=9, y_length=4.0
        ).move_to([0, 0.5, 0])
        self.play(Create(axes))

        curve = axes.plot(lambda x: 0.5 * x**2, color=BLUE, stroke_width=5)
        self.play(Create(curve))
        self.wait(2)

        p1 = Dot(axes.c2p(-2, 2), color=RED, radius=0.1)
        p2 = Dot(axes.c2p(2, 2), color=RED, radius=0.1)
        p1_label = MathTex(r"f(t_0)", font_size=22, color=RED).next_to(p1, UL, buff=0.1)
        p2_label = MathTex(r"f(t_1)", font_size=22, color=RED).next_to(p2, UR, buff=0.1)

        self.play(FadeIn(p1), Write(p1_label), FadeIn(p2), Write(p2_label))
        self.wait(3)

        # ==========================================
        # 步骤 2：动态离散化 —— 疯狂切碎
        # ==========================================
        desc5 = Text("第二步：把整条路径切成许多小线段。", font_size=22, font=FONT, color=GREEN)
        desc4 = swap_slide(self, desc4, desc5)
        self.wait(2)

        n_tracker = ValueTracker(3)

        def get_segmented_curve():
            n = int(n_tracker.get_value())
            x_vals = np.linspace(-2, 2, n)
            points = [axes.c2p(x, 0.5 * x**2) for x in x_vals]
            segments = VGroup()
            for i in range(n - 1):
                seg = Line(points[i], points[i+1], color=YELLOW, stroke_width=3)
                segments.add(seg)
            dots = VGroup(*[Dot(p, color=RED, radius=0.05) for p in points])
            return VGroup(segments, dots)

        dynamic_segments = always_redraw(get_segmented_curve)
        self.play(FadeOut(curve), FadeIn(dynamic_segments))
        self.wait(1)

        self.play(n_tracker.animate.set_value(50), run_time=6, rate_func=linear)
        self.wait(2)

        desc6 = Text("切得越细，线段越贴近原曲线。", font_size=20, font=FONT, color=GRAY)
        desc5 = swap_slide(self, desc5, desc6)
        self.wait(3)

        # ==========================================
        # 步骤 3：高亮第 i 个小线段
        # ==========================================
        desc7 = Text("第三步：取出第 i 个小线段，连接两个相邻点。", font_size=22, font=FONT, color=GREEN)
        desc6 = swap_slide(self, desc6, desc7)
        self.wait(2)

        t_i = -0.3
        t_i_plus = -0.1
        point_i = axes.c2p(t_i, 0.5 * t_i**2)
        point_ip1 = axes.c2p(t_i_plus, 0.5 * t_i_plus**2)

        highlight_seg = Line(point_i, point_ip1, color=ORANGE, stroke_width=7)
        dot_i = Dot(point_i, color=ORANGE, radius=0.1)
        dot_ip1 = Dot(point_ip1, color=ORANGE, radius=0.1)
        label_i = MathTex(r"f(\tau_i)", font_size=22, color=ORANGE).next_to(dot_i, LEFT, buff=0.15)
        label_ip1 = MathTex(r"f(\tau_{i+1})", font_size=22, color=ORANGE).next_to(dot_ip1, RIGHT, buff=0.15)

        self.play(FadeIn(highlight_seg), FadeIn(dot_i), Write(label_i), FadeIn(dot_ip1), Write(label_ip1))
        self.wait(3)

        # ==========================================
        # 步骤 4：计算差值向量
        # ==========================================
        desc8 = Text("第四步：两点相减，得到差值向量 Δfᵢ。", font_size=22, font=FONT, color=GREEN)
        desc7 = swap_slide(self, desc7, desc8)
        self.wait(2)

        # 公式在底部上方固定位置
        formula_pos = np.array([0, -2.3, 0])

        eq_delta = MathTex(
            r"\Delta f_i = f(\tau_{i+1}) - f(\tau_i)",
            font_size=34, color=YELLOW
        ).move_to(formula_pos)
        self.play(Write(eq_delta))
        self.wait(3)

        # ==========================================
        # 步骤 5：分解差值向量
        # ==========================================
        desc9 = Text("第五步：这个差值向量可以分解为两个方向。", font_size=22, font=FONT, color=GREEN)
        desc8 = swap_slide(self, desc8, desc9)
        self.wait(2)

        # 在图上画虚线分解
        delta_a_line = DashedLine(point_i, axes.c2p(t_i_plus, 0.5 * t_i**2), color=GREEN, dash_length=0.1)
        delta_b_line = DashedLine(axes.c2p(t_i_plus, 0.5 * t_i**2), point_ip1, color=BLUE, dash_length=0.1)
        delta_a_label = MathTex(r"\Delta a", font_size=22, color=GREEN).next_to(delta_a_line, DOWN, buff=0.05)
        delta_b_label = MathTex(r"\Delta b", font_size=22, color=BLUE).next_to(delta_b_line, RIGHT, buff=0.05)

        self.play(Create(delta_a_line), Create(delta_b_line))
        self.play(Write(delta_a_label), Write(delta_b_label))
        self.wait(3)

        eq_decomp = MathTex(
            r"\Delta f_i = \Delta a + \Delta b \, q",
            font_size=32, color=YELLOW
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_decomp))
        self.wait(3)

        # 清掉图上的分解虚线
        self.play(FadeOut(delta_a_line), FadeOut(delta_b_line),
                  FadeOut(delta_a_label), FadeOut(delta_b_label))
        self.wait(1)

        # ==========================================
        # 步骤 6：计算 MetQ
        # ==========================================
        desc10 = Text("第六步：用 MetQ 计算差值向量的“模长平方”。", font_size=22, font=FONT, color=GREEN)
        desc9 = swap_slide(self, desc9, desc10)
        self.wait(2)

        eq_metq = MathTex(
            r"\mathrm{MetQ}(\Delta f_i) = (\Delta a)^2 - (\Delta b)^2",
            font_size=34, color=ORANGE
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_metq))
        self.wait(3)

        # ==========================================
        # 步骤 7：数值例子，突出负数
        # ==========================================
        desc11 = Text("第七步：代入具体数值，看看会发生什么。", font_size=22, font=FONT, color=GREEN)
        desc10 = swap_slide(self, desc10, desc11)
        self.wait(2)

        eq_num = MathTex(
            r"\Delta a = 0.5,\; \Delta b = 0.8",
            font_size=32, color=GRAY
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_num))
        self.wait(2)

        eq_num2 = MathTex(
            r"\mathrm{MetQ} = 0.5^2 - 0.8^2 = 0.25 - 0.64 = -0.39",
            font_size=32, color=RED
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_num2))
        self.wait(3)

        desc12 = Text("注意！MetQ 得到的是负数，这不是合法的“路程”。", font_size=22, font=FONT, color=RED)
        desc11 = swap_slide(self, desc11, desc12)
        self.wait(2)

        self.play(Indicate(eq_delta, color=RED, scale_factor=1.1))
        self.wait(2)

        # ==========================================
        # 步骤 8：取绝对值
        # ==========================================
        desc13 = Text("第八步：取绝对值，保证“路程”非负。", font_size=22, font=FONT, color=YELLOW)
        desc12 = swap_slide(self, desc12, desc13)
        self.wait(2)

        eq_abs = MathTex(
            r"\bigl|\mathrm{MetQ}\bigr| = |-0.39| = 0.39",
            font_size=34, color=ORANGE
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_abs))
        self.wait(3)

        # ==========================================
        # 步骤 9：开根号
        # ==========================================
        desc14 = Text("第九步：开平方根，把“平方”还原成“长度”。", font_size=22, font=FONT, color=YELLOW)
        desc13 = swap_slide(self, desc13, desc14)
        self.wait(2)

        eq_sqrt = MathTex(
            r"\sqrt{\bigl|\mathrm{MetQ}\bigr|} = \sqrt{0.39} \approx 0.6245",
            font_size=34, color=ORANGE
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_sqrt))
        self.wait(3)

        desc15 = Text("这个结果，就是这一小段的路程 Δsᵢ。", font_size=22, font=FONT, color=GREEN)
        desc14 = swap_slide(self, desc14, desc15)
        self.wait(2)

        # 同时给出抽象公式
        eq_ds = MathTex(
            r"\Delta s_i = \sqrt{\bigl|\mathrm{MetQ}(\Delta f_i)\bigr|}",
            font_size=36, color=ORANGE
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_ds))
        self.wait(4)

        # ==========================================
        # 步骤 10：求和
        # ==========================================
        desc16 = Text("第十步：把每一小段的 Δsᵢ 累加起来。", font_size=22, font=FONT, color=GREEN)
        desc15 = swap_slide(self, desc15, desc16)
        self.wait(2)

        eq_sum = MathTex(
            r"S_n = \sum_{i=1}^{n} \sqrt{\bigl|\mathrm{MetQ}(\Delta f_i)\bigr|}",
            font_size=34, color=ORANGE
        ).move_to(formula_pos)
        self.play(Transform(eq_delta, eq_sum))
        self.wait(4)

        desc17 = Text("整条路径的路程，就是所有小段贡献的总和。", font_size=20, font=FONT, color=GRAY)
        desc16 = swap_slide(self, desc16, desc17)
        self.wait(3)

        # ==========================================
        # 步骤 11：取极限 → 积分
        # ==========================================
        desc18 = Text("第十一步：令 n → ∞，离散求和变成连续积分。", font_size=22, font=FONT, color=YELLOW)
        desc17 = swap_slide(self, desc17, desc18)
        self.wait(3)

        self.play(
            FadeOut(eq_delta),
            FadeOut(highlight_seg), FadeOut(dot_i), FadeOut(dot_ip1),
            FadeOut(label_i), FadeOut(label_ip1)
        )

        integral = MathTex(
            r"S = \int_{t_0}^{t_1} \sqrt{\bigl|\mathrm{MetQ}(df)\bigr|}",
            font_size=48, color=ORANGE
        ).move_to(formula_pos)
        self.play(Write(integral))
        self.wait(3)

        self.play(Indicate(integral, color=ORANGE, scale_factor=1.1))
        self.wait(3)

        # ==========================================
        # 步骤 12：核心性质总结
        # ==========================================
        desc19 = Text("MetS 恒为正，是路程量；MetQ 可正可负，是位移量。", font_size=22, font=FONT, color=YELLOW)
        desc18 = swap_slide(self, desc18, desc19)
        self.wait(3)

        desc20 = Text("绝对值保证非负，开根号还原长度 —— 这就是路程的本质。", font_size=20, font=FONT, color=GRAY)
        desc19 = swap_slide(self, desc19, desc20)
        self.wait(4)

        # ==========================================
        # 步骤 13：为第 6 章做预告 —— 悬念钩子
        # ==========================================
        desc21 = Text("但这引出一个奇特的问题：", font_size=24, font=FONT, color=PURPLE)
        desc20 = swap_slide(self, desc20, desc21)
        self.wait(3)

        # 清掉图像，留出空间给预告
        self.play(
            FadeOut(axes), FadeOut(p1), FadeOut(p2),
            FadeOut(p1_label), FadeOut(p2_label),
            FadeOut(dynamic_segments)
        )
        self.wait(1)

        hook1 = MathTex(
            r"\text{如果 } |\mathrm{MetQ}| = 0 \text{ 处处成立，}",
            font_size=36, color=PURPLE
        ).move_to([0, 1, 0])
        self.play(Write(hook1))
        self.wait(2)

        hook2 = MathTex(
            r"\text{那么 } S = 0 \text{，但函数仍在移动？}",
            font_size=36, color=PURPLE
        ).move_to([0, -0.5, 0])
        self.play(Write(hook2))
        self.wait(3)

        desc22 = Text("这就是下一章的主题 —— 零路长，正位移。", font_size=26, font=FONT, weight=BOLD, color=YELLOW)
        desc21 = swap_slide(self, desc21, desc22)
        self.wait(5)

        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)

class Scene6_ZeroPathPositiveDisplacement(Scene):
    """
    场景6：零路长，正位移（深度推导 + 严格清理版）
    """

    def construct(self):
        # ============ 工具函数 ============
        def swap_slide(old, new):
            new.move_to(BOTTOM_POS)
            self.play(
                FadeOut(old, run_time=0.6, shift=DOWN * 0.3),
                FadeIn(new, run_time=0.6, shift=UP * 0.3)
            )
            return new

        def cleanup(*mobs):
            self.play(*[FadeOut(m) for m in mobs], run_time=0.5)

        # ==========================================
        # 阶段 1：MetS 与 MetQ 的关系
        # ==========================================
        title = Text("MetS 与 MetQ 的关系", font_size=32, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=0.6)
        self.play(Write(title))
        self.wait(1)

        desc1 = Text("MetQ 只看起点与终点，它是一个“端点量”。", font_size=22, font=FONT, color=GREEN)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(1.5)

        axes0 = Axes(
            x_range=[-0.3, 4.3, 1], y_range=[-0.5, 1, 1],
            axis_config={"color": GRAY},
            x_length=9, y_length=3
        ).move_to([0, 0.8, 0])
        dot_P = Dot(axes0.c2p(0, 0), color=GREEN, radius=0.1)
        dot_Q = Dot(axes0.c2p(4, 0), color=RED, radius=0.1)
        lbl_P = MathTex(r"P", font_size=24, color=GREEN).next_to(dot_P, DOWN, buff=0.15)
        lbl_Q = MathTex(r"Q", font_size=24, color=RED).next_to(dot_Q, DOWN, buff=0.15)
        arrow_PQ = Arrow(axes0.c2p(0, 0), axes0.c2p(4, 0), color=YELLOW, buff=0, stroke_width=4)

        self.play(Create(axes0), FadeIn(dot_P), Write(lbl_P), FadeIn(dot_Q), Write(lbl_Q))
        self.play(Create(arrow_PQ))
        self.wait(1)

        eq_metq = MathTex(
            r"\mathrm{MetQ}(Q - P) = \mathrm{MetQ}(\Delta a + \Delta b \cdot q)",
            font_size=30, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(Write(eq_metq))
        self.wait(1.5)

        desc2 = Text("MetS 则要看整条路径，它是一个“路径量”。", font_size=22, font=FONT, color=GREEN)
        desc2 = swap_slide(desc1, desc2)
        self.wait(1)

        eq_mets = MathTex(
            r"\mathrm{MetS}(\gamma) = \int \sqrt{\bigl|\mathrm{MetQ}(d\gamma)\bigr|}",
            font_size=32, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(FadeOut(eq_metq), FadeIn(eq_mets))
        self.wait(1.5)

        desc3 = Text("核心问题：MetS 能否小于 MetQ？", font_size=24, font=FONT, weight=BOLD, color=PURPLE)
        desc3 = swap_slide(desc2, desc3)
        self.wait(1.5)

        cleanup(title, desc3, axes0, dot_P, dot_Q, lbl_P, lbl_Q, arrow_PQ, eq_mets)

        # ==========================================
        # 阶段 2：欧几里得空间的三角不等式
        # ==========================================
        title = Text("欧几里得空间：路程 ≥ 位移", font_size=28, font=FONT, weight=BOLD, color=BLUE).to_edge(UP, buff=0.6)
        self.play(Write(title))
        self.wait(1)

        desc = Text("在欧氏空间，路径长度永远 ≥ 端点距离。", font_size=22, font=FONT, color=GRAY)
        desc.move_to(BOTTOM_POS)
        self.play(Write(desc))
        self.wait(1.5)

        axes_e = Axes(
            x_range=[0, 4, 1], y_range=[0, 3, 1],
            axis_config={"color": GRAY},
            x_length=7, y_length=4
        ).move_to([0, 0.7, 0])
        dot_A = Dot(axes_e.c2p(0.5, 0.5), color=GREEN, radius=0.1)
        dot_B = Dot(axes_e.c2p(3.5, 2.5), color=RED, radius=0.1)
        line_AB = Line(dot_A, dot_B, color=BLUE, stroke_width=5)

        self.play(Create(axes_e), FadeIn(dot_A), FadeIn(dot_B), Create(line_AB))
        self.wait(1)

        zigzag_pts = [
            axes_e.c2p(0.5, 0.5), axes_e.c2p(1.2, 1.8), axes_e.c2p(1.8, 1.2),
            axes_e.c2p(2.5, 2.2), axes_e.c2p(3.0, 1.5), axes_e.c2p(3.5, 2.5),
        ]
        zigzag_e = VGroup(*[
            Line(zigzag_pts[i], zigzag_pts[i+1], color=ORANGE, stroke_width=4)
            for i in range(len(zigzag_pts) - 1)
        ])
        self.play(Create(zigzag_e), run_time=2)
        self.wait(1.5)

        euclid_ineq = MathTex(
            r"\text{欧氏：} \quad L_{\text{路}} \;\geq\; |AB|",
            font_size=36, color=BLUE
        ).move_to([0, -2.2, 0])
        self.play(Write(euclid_ineq))
        self.wait(1.5)

        desc2 = Text("根源是正定性：任意非零向量，长度平方为正。", font_size=20, font=FONT, color=GRAY)
        desc2 = swap_slide(desc, desc2)
        self.wait(1.5)

        cleanup(title, desc2, axes_e, dot_A, dot_B, line_AB, zigzag_e, euclid_ineq)

        # ==========================================
        # 阶段 3：R(q) 分裂复数平面与零锥
        # ==========================================
        title = Text("R(q) 分裂复数平面", font_size=28, font=FONT, weight=BOLD, color=RED).to_edge(UP, buff=0.6)
        self.play(Write(title))
        self.wait(1)

        desc = Text("在 R(q) 里，元数形式是 a + bq，且 q² = +1。", font_size=22, font=FONT, color=GREEN)
        desc.move_to(BOTTOM_POS)
        self.play(Write(desc))
        self.wait(1.5)

        axes_q = Axes(
            x_range=[-2.5, 2.5, 1], y_range=[-2, 2, 1],
            axis_config={"color": GRAY},
            x_length=6, y_length=4.5
        ).move_to([0, 0.5, 0])
        xl = MathTex(r"a", font_size=24, color=GREEN).next_to(axes_q.x_axis, RIGHT, buff=0.2)
        yl = MathTex(r"b", font_size=24, color=BLUE).next_to(axes_q.y_axis, UP, buff=0.2)
        self.play(Create(axes_q), Write(xl), Write(yl))
        self.wait(1)

        metq_def = MathTex(
            r"\mathrm{MetQ}(a + bq) = a^2 - b^2",
            font_size=32, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(Write(metq_def))
        self.wait(1.5)

        desc2 = Text("令 MetQ = 0，得到零锥：两条对角线 a = b 和 a = -b。", font_size=20, font=FONT, color=YELLOW)
        desc2 = swap_slide(desc, desc2)
        self.wait(1)

        line1 = axes_q.plot(lambda x: x, x_range=[-2, 2], color=YELLOW, stroke_width=5)
        line2 = axes_q.plot(lambda x: -x, x_range=[-2, 2], color=YELLOW, stroke_width=5)
        self.play(Create(line1), Create(line2))
        self.wait(1)

        cone_lbl = MathTex(r"\text{零锥：} a = \pm b", font_size=24, color=YELLOW).move_to([3.2, 1.8, 0])
        self.play(Write(cone_lbl))
        self.wait(1)

        pos_R = Polygon(axes_q.c2p(0, 0), axes_q.c2p(2, 2), axes_q.c2p(2, -2),
                        color=GREEN, fill_opacity=0.2, stroke_width=0)
        pos_L = Polygon(axes_q.c2p(0, 0), axes_q.c2p(-2, 2), axes_q.c2p(-2, -2),
                        color=GREEN, fill_opacity=0.2, stroke_width=0)
        neg_T = Polygon(axes_q.c2p(0, 0), axes_q.c2p(-2, 2), axes_q.c2p(2, 2),
                        color=RED, fill_opacity=0.2, stroke_width=0)
        neg_B = Polygon(axes_q.c2p(0, 0), axes_q.c2p(-2, -2), axes_q.c2p(2, -2),
                        color=RED, fill_opacity=0.2, stroke_width=0)
        self.play(FadeIn(pos_R), FadeIn(pos_L), FadeIn(neg_T), FadeIn(neg_B))
        self.wait(1)

        desc3 = Text("左右两侧 MetQ > 0，上下两侧 MetQ < 0。", font_size=20, font=FONT, color=GRAY)
        desc3 = swap_slide(desc2, desc3)
        self.wait(1.5)

        cleanup(cone_lbl, pos_R, pos_L, neg_T, neg_B)

        # ==========================================
        # 阶段 4：零锥的普遍性与特性（核心）
        # ==========================================
        title2 = Text("零锥的普遍性", font_size=28, font=FONT, weight=BOLD, color=PURPLE).to_edge(UP, buff=0.6)
        self.play(Transform(title, title2))
        self.wait(1)

        desc4 = Text("关键观察：对平面上任意一点 P，都有零锥直线通过它。", font_size=20, font=FONT, color=YELLOW)
        desc4 = swap_slide(desc3, desc4)
        self.wait(1.5)

        # 循环创建零锥线，收集到 VGroup 里
        test_points = [(-1.2, -0.6), (0, 1), (1.5, 0.5)]
        cone_visuals = VGroup()
        for (a0, b0) in test_points:
            p_dot = Dot(axes_q.c2p(a0, b0), color=GREEN, radius=0.1)
            end1 = axes_q.c2p(a0 + 1.5, b0 + 1.5)
            end2 = axes_q.c2p(a0 - 1.5, b0 - 1.5)
            end3 = axes_q.c2p(a0 + 1.5, b0 - 1.5)
            end4 = axes_q.c2p(a0 - 1.5, b0 + 1.5)
            line_a = Line(end2, end1, color=GREEN, stroke_width=3, stroke_opacity=0.7)
            line_b = Line(end4, end3, color=GREEN, stroke_width=3, stroke_opacity=0.7)
            cone_visuals.add(p_dot, line_a, line_b)
            self.play(FadeIn(p_dot), Create(line_a), Create(line_b), run_time=1.2)
            self.wait(0.8)

        desc5 = Text("每条零锥线上的点，MetQ 都为零。", font_size=20, font=FONT, color=GREEN)
        desc5 = swap_slide(desc4, desc5)
        self.wait(1.5)

        desc6 = Text("但如果 P 本身不在零锥上呢？", font_size=20, font=FONT, color=YELLOW)
        desc6 = swap_slide(desc5, desc6)
        self.wait(1.5)

        # 清掉循环创建的视觉
        self.play(FadeOut(cone_visuals))
        self.wait(0.5)

        # 取一个不在零锥上的点 P
        P_a, P_b = 1.2, -0.3
        P_dot = Dot(axes_q.c2p(P_a, P_b), color=ORANGE, radius=0.12)
        P_lbl = MathTex(r"P = 1.2 - 0.3q", font_size=22, color=ORANGE).next_to(P_dot, UR, buff=0.15)
        self.play(FadeIn(P_dot), Write(P_lbl))
        self.wait(1)

        # 沿零锥方向移动
        v_dir = 1.5
        Q_dot = Dot(axes_q.c2p(P_a + v_dir, P_b + v_dir), color=RED, radius=0.12)
        Q_lbl = MathTex(r"P + t(1+q)", font_size=22, color=RED).next_to(Q_dot, UR, buff=0.15)
        move_arrow = Arrow(P_dot, Q_dot, color=GREEN, buff=0.1, stroke_width=4)
        self.play(Create(move_arrow), FadeIn(Q_dot), Write(Q_lbl))
        self.wait(1)

        desc7 = Text("沿零锥方向移动，MetQ 会线性变化：", font_size=20, font=FONT, color=GREEN)
        desc7 = swap_slide(desc6, desc7)
        self.wait(1)

        calc1 = MathTex(
            r"\mathrm{MetQ}(P + t(1+q)) = (1.2+t)^2 - (-0.3+t)^2",
            font_size=24, color=YELLOW
        ).move_to([0, -2.2, 0])
        self.play(FadeOut(metq_def), FadeIn(calc1))
        self.wait(1.5)

        calc2 = MathTex(
            r"= 1.44 + 2.4t + t^2 - (0.09 - 0.6t + t^2)",
            font_size=24, color=YELLOW
        ).move_to([0, -2.2, 0])
        self.play(Transform(calc1, calc2))
        self.wait(1.5)

        calc3 = MathTex(
            r"= 1.35 + 3.0\,t",
            font_size=32, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(Transform(calc1, calc3))
        self.wait(1.5)

        desc8 = Text("关键推论：只有 P 本身在零锥上，MetQ 才恒为零。", font_size=20, font=FONT, color=YELLOW)
        desc8 = swap_slide(desc7, desc8)
        self.wait(1.5)

        cleanup(title, desc8, calc1, P_dot, P_lbl, Q_dot, Q_lbl, move_arrow, cone_visuals)

        # ==========================================
        # 阶段 5：构造反例——锯齿路径
        # ==========================================
        title = Text("构造反例：锯齿路径", font_size=28, font=FONT, weight=BOLD, color=PURPLE).to_edge(UP, buff=0.6)
        self.play(Write(title))
        self.wait(1)

        desc = Text("取 P 在原点（零锥上），沿 ±1 斜率交替前进。", font_size=22, font=FONT, color=GREEN)
        desc.move_to(BOTTOM_POS)
        self.play(Write(desc))
        self.wait(1.5)

        N = 8
        seg = 0.5
        saw_pts = []
        for i in range(N + 1):
            x = i * seg
            y = 0.5 if i % 2 == 1 else 0.0
            saw_pts.append(axes_q.c2p(x, y))

        saw_segs = VGroup(*[
            Line(saw_pts[i], saw_pts[i+1], color=ORANGE, stroke_width=4)
            for i in range(N)
        ])
        self.play(Create(saw_segs), run_time=3)
        self.wait(1)

        saw_dots = VGroup(*[Dot(p, color=RED, radius=0.06) for p in saw_pts])
        self.play(FadeIn(saw_dots))
        self.wait(1)

        desc2 = Text("每段斜率 ±1，也就是 |Δa| = |Δb|。", font_size=20, font=FONT, color=YELLOW)
        desc2 = swap_slide(desc, desc2)
        self.wait(1.5)

        metq_seg = MathTex(
            r"\mathrm{MetQ}(\Delta_i) = (\Delta a_i)^2 - (\Delta b_i)^2 = 0",
            font_size=30, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(Write(metq_seg))
        self.wait(1.5)

        # 逐段标 0
        zero_labels = VGroup()
        for i in range(N):
            mid = (saw_pts[i] + saw_pts[i+1]) / 2
            offset = UP * 0.25 if i % 2 == 0 else DOWN * 0.3
            lbl = MathTex(r"0", font_size=18, color=RED).move_to(mid + offset)
            zero_labels.add(lbl)
        self.play(LaggedStart(*[FadeIn(l) for l in zero_labels], lag_ratio=0.1), run_time=2.5)
        self.wait(1.5)

        desc3 = Text("所以每段的 MetQ 都是 0，整条路径 MetS = 0。", font_size=20, font=FONT, color=RED)
        desc3 = swap_slide(desc2, desc3)
        self.wait(1.5)

        mets_zero = MathTex(
            r"\mathrm{MetS} = \sum_{i=1}^{8} \sqrt{|0|} = 0",
            font_size=38, color=RED
        ).move_to([0, -2.2, 0])
        self.play(Transform(metq_seg, mets_zero))
        self.play(Indicate(metq_seg, color=RED, scale_factor=1.1))
        self.wait(2)

        cleanup(metq_seg, zero_labels)

        # ==========================================
        # 阶段 6：位移与 MetQ
        # ==========================================
        desc4 = Text("但终点呢？ΣΔaᵢ = 4，ΣΔbᵢ = 0（正负相消）。", font_size=20, font=FONT, color=GREEN)
        desc4 = swap_slide(desc3, desc4)
        self.wait(1.5)

        start_dot = Dot(axes_q.c2p(0, 0), color=GREEN, radius=0.12)
        end_dot = Dot(axes_q.c2p(4, 0), color=RED, radius=0.12)
        disp_arrow = Arrow(axes_q.c2p(0, 0), axes_q.c2p(4, 0), color=YELLOW, buff=0, stroke_width=5)
        self.play(FadeIn(start_dot), FadeIn(end_dot), Create(disp_arrow))
        self.wait(1)

        disp_eq = MathTex(
            r"\gamma(1) - \gamma(0) = 4 + 0 \cdot q",
            font_size=36, color=YELLOW
        ).move_to([0, -2.2, 0])
        self.play(Write(disp_eq))
        self.wait(1.5)

        disp_metq = MathTex(
            r"\mathrm{MetQ}(4 + 0 \cdot q) = 4^2 - 0^2 = 16",
            font_size=36, color=ORANGE
        ).move_to([0, -2.2, 0])
        self.play(Transform(disp_eq, disp_metq))
        self.wait(2)

        # ==========================================
        # 阶段 7：核心结论
        # ==========================================
        conclusion = MathTex(
            r"\mathrm{MetS} = 0 \;\; < \;\; \mathrm{MetQ} = 16",
            font_size=46, color=YELLOW
        ).move_to([0, -2.2, 0])
        self.play(Transform(disp_eq, conclusion))
        self.play(Indicate(disp_eq, color=YELLOW, scale_factor=1.15))
        self.wait(2)

        desc5 = Text("这是欧几里得空间里不可能的事。", font_size=22, font=FONT, color=GRAY)
        desc5 = swap_slide(desc4, desc5)
        self.wait(1.5)

        cleanup(title, desc5, disp_eq, disp_arrow, start_dot, end_dot, saw_segs, saw_dots)

        # ==========================================
        # 阶段 8：零锥对 MetQ/MetS 的深层影响
        # ==========================================
        title = Text("零锥对 MetQ/MetS 的深层影响", font_size=26, font=FONT, weight=BOLD, color=PURPLE).to_edge(UP, buff=0.6)
        self.play(Write(title))
        self.wait(1)

        desc = Text("推论 1：MetS 沿零锥方向的累积贡献为零。", font_size=22, font=FONT, weight=BOLD, color=GREEN)
        desc.move_to([0, 2, 0])
        self.play(Write(desc))
        self.wait(1.5)

        eq_r1 = MathTex(
            r"\text{若 } \Delta_i \in \text{零锥}, \quad \mathrm{MetQ}(\Delta_i) = 0 \;\Rightarrow\; \Delta \mathrm{MetS} = 0",
            font_size=26, color=ORANGE
        ).move_to([0, 0.5, 0])
        self.play(Write(eq_r1))
        self.wait(2)

        self.play(FadeOut(desc), FadeOut(eq_r1))

        desc2 = Text("推论 2：MetQ 不具备三角不等式。", font_size=22, font=FONT, weight=BOLD, color=GREEN)
        desc2.move_to([0, 2, 0])
        self.play(Write(desc2))
        self.wait(1.5)

        eq_r2 = MathTex(
            r"\mathrm{MetQ}\Bigl(\sum_i \Delta_i\Bigr) \not\leq \sum_i \mathrm{MetQ}(\Delta_i)",
            font_size=30, color=RED
        ).move_to([0, 0.5, 0])
        self.play(Write(eq_r2))
        self.wait(1.5)

        eq_r2b = MathTex(
            r"16 \not\leq 0",
            font_size=40, color=RED
        ).move_to([0, -1, 0])
        self.play(Write(eq_r2b))
        self.wait(2)

        self.play(FadeOut(desc2), FadeOut(eq_r2), FadeOut(eq_r2b))

        desc3 = Text("推论 3：零锥的存在，正是 MetS < MetQ 的根源。", font_size=22, font=FONT, weight=BOLD, color=YELLOW)
        desc3.move_to([0, 2, 0])
        self.play(Write(desc3))
        self.wait(1.5)

        eq_r3 = MathTex(
            r"\text{零锥方向} \;\Longrightarrow\; \Delta \mathrm{MetS} = 0 \;\text{但}\; \Delta \text{位置} \neq 0",
            font_size=24, color=YELLOW
        ).move_to([0, 0.5, 0])
        self.play(Write(eq_r3))
        self.wait(2.5)

        self.play(FadeOut(desc3), FadeOut(eq_r3))

        # ==========================================
        # 收尾
        # ==========================================
        final = Text("零路长，正位移 —— 这就是零锥的奇迹。", font_size=26, font=FONT, weight=BOLD, color=YELLOW).move_to([0, 0, 0])
        self.play(Write(final))
        self.wait(3)

        cleanup(title, final, axes_q, xl, yl, line1, line2)

        self.wait(0.5)
        
import numpy as np
from manim import *

class Scene7_AntOnMetricLine(Scene):
    """
    场景7：扭曲的线性世界 —— 数轴自身的拉伸、收缩与自交
    核心：数轴上的刻度根据 MetQ 实时变形，穿过零锥时产生平台与自交
    """

    def construct(self):
        # ============ 工具函数 ============
        def swap_slide(old, new):
            new.move_to(BOTTOM_POS)
            self.play(
                FadeOut(old, run_time=0.6, shift=DOWN * 0.3),
                FadeIn(new, run_time=0.6, shift=UP * 0.3)
            )
            return new

        # ==========================================
        # 阶段 1：普通数轴
        # ==========================================
        title = Text("扭曲的线性世界：数轴的自交", font_size=30, font=FONT,
                     weight=BOLD, color=YELLOW).to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.wait(2)

        desc1 = Text("第一步：先看一条普通的数轴。", font_size=22, font=FONT, color=GRAY)
        desc1.move_to(BOTTOM_POS)
        self.play(Write(desc1))
        self.wait(2)

        normal_axis = NumberLine(
            x_range=[0, 10, 1], length=10, color=WHITE,
            include_numbers=True, font_size=18
        ).move_to([0, 0, 0])
        normal_lbl = Text("普通数轴（刻度均匀）", font_size=18, color=WHITE).next_to(normal_axis, UP, buff=0.3)
        self.play(Create(normal_axis), Write(normal_lbl))
        self.wait(3)

        desc2 = Text("普通数轴的定义：每个刻度之间的距离相等。", font_size=20, font=FONT, color=GRAY)
        desc2 = swap_slide(desc1, desc2)
        self.wait(3)

        # ==========================================
        # 阶段 2：物理路径与 MetQ 值
        # ==========================================
        desc3 = Text("第二步：在 R(q) 平面中放置一条物理路径。", font_size=22, font=FONT, color=GREEN)
        desc3 = swap_slide(desc2, desc3)
        self.wait(2)

        axes = Axes(
            x_range=[-0.5, 4.5, 1], y_range=[-2.5, 2.5, 1],
            axis_config={"color": GRAY},
            x_length=8, y_length=4.5
        ).move_to([0, 0.5, 0])
        xl = MathTex(r"a", font_size=22, color=GREEN).next_to(axes.x_axis, RIGHT, buff=0.1)
        yl = MathTex(r"b", font_size=22, color=BLUE).next_to(axes.y_axis, UP, buff=0.1)
        self.play(Create(axes), Write(xl), Write(yl))
        self.wait(2)

        cone1 = axes.plot(lambda x: x, x_range=[0, 4.2], color=YELLOW,
                          stroke_width=2, stroke_opacity=0.5)
        cone2 = axes.plot(lambda x: -x, x_range=[0, 4.2], color=YELLOW,
                          stroke_width=2, stroke_opacity=0.5)
        self.play(Create(cone1), Create(cone2))
        self.wait(2)

        desc4 = Text("物理路径是一条连续函数，会反复穿越零锥。", font_size=20, font=FONT, color=YELLOW)
        desc4 = swap_slide(desc3, desc4)
        self.wait(2)

        # 物理路径：a(t) = t, b(t) = 1.8 * sin(pi * t / 1.5)，t ∈ [0, 4]
        t_vals = np.linspace(0, 4, 800)
        a_vals = t_vals
        b_vals = 1.8 * np.sin(np.pi * t_vals / 1.5)
        metq_vals = a_vals**2 - b_vals**2
        integrand = np.sqrt(np.abs(metq_vals))
        dt = t_vals[1] - t_vals[0]
        mets_vals = np.cumsum(integrand) * dt
        mets_vals -= mets_vals[0]

        path_points = [axes.c2p(a_vals[i], b_vals[i]) for i in range(len(t_vals))]
        path_vm = VMobject()
        path_vm.set_points_smoothly(path_points)
        path_vm.set_color(BLUE)
        path_vm.set_stroke(width=3)
        self.play(Create(path_vm), run_time=4)
        self.wait(2)

        # ==========================================
        # 阶段 3：MetS 数轴的动态变形
        # ==========================================
        desc5 = Text("第三步：数轴上的刻度根据 MetQ 实时变形。", font_size=22, font=FONT, color=GREEN)
        desc5 = swap_slide(desc4, desc5)
        self.wait(2)

        self.play(FadeOut(normal_axis), FadeOut(normal_lbl))
        self.wait(1)

        # 数轴参数
        axis_y = -2.8
        axis_x_start = -6
        axis_x_end = 6
        mets_max = mets_vals[-1]
        scale = (axis_x_end - axis_x_start) / mets_max

        # 刻度：基于 MetS 的原始长度
        tick_count = 40
        tick_positions = []
        tick_metq = []
        for i in range(tick_count + 1):
            t = i / tick_count * 4
            idx = int(t / 4 * (len(t_vals) - 1))
            idx = min(idx, len(t_vals) - 1)
            tick_positions.append(mets_vals[idx])
            tick_metq.append(metq_vals[idx])

        max_mets_tracker = ValueTracker(0)

        def get_warped_axis():
            current_max = max_mets_tracker.get_value()
            if current_max < 0.001:
                return VGroup()

            group = VGroup()
            # 轴线
            line = Line(
                start=np.array([axis_x_start, axis_y, 0]),
                end=np.array([axis_x_end, axis_y, 0]),
                color=GRAY, stroke_width=1, stroke_opacity=0.3
            )
            group.add(line)

            for i, s in enumerate(tick_positions):
                if s > current_max:
                    continue
                x_pos = axis_x_start + s * scale
                local_metq = abs(tick_metq[i])
                # 刻度高度：MetQ 越大，刻度越高
                tick_height = 0.08 + min(local_metq / 6, 0.35)
                # 颜色：MetQ > 0 绿色，< 0 红色，= 0 黄色
                if tick_metq[i] > 0.05:
                    tick_color = GREEN
                elif tick_metq[i] < -0.05:
                    tick_color = RED
                else:
                    tick_color = YELLOW

                tick = Line(
                    start=np.array([x_pos, axis_y - tick_height, 0]),
                    end=np.array([x_pos, axis_y + tick_height, 0]),
                    color=tick_color, stroke_width=2
                )
                group.add(tick)

            return group

        warped_axis = always_redraw(get_warped_axis)
        self.play(FadeIn(warped_axis))
        self.wait(2)

        desc6 = Text("刻度高度代表 MetQ 的局部强度，颜色代表符号。", font_size=20, font=FONT, color=GRAY)
        desc6 = swap_slide(desc5, desc6)
        self.wait(3)

        # ==========================================
        # 阶段 4：蚂蚁爬行，数轴同步生长
        # ==========================================
        desc7 = Text("第四步：蚂蚁沿路径爬行，数轴同步生长。", font_size=22, font=FONT, color=GREEN)
        desc7 = swap_slide(desc6, desc7)
        self.wait(2)

        ant_tracker = ValueTracker(0)

        def get_ant():
            idx = int(ant_tracker.get_value() / 4 * (len(t_vals) - 1))
            idx = min(idx, len(t_vals) - 1)
            return Dot(axes.c2p(a_vals[idx], b_vals[idx]), color=RED, radius=0.12)

        ant = always_redraw(get_ant)
        self.play(FadeIn(ant))
        self.wait(1)

        self.play(
            ant_tracker.animate.set_value(4),
            max_mets_tracker.animate.set_value(mets_max),
            run_time=12,
            rate_func=linear
        )
        self.wait(2)

        desc8 = Text("注意：MetQ=0 的地方，刻度停留 —— 形成“平台”。", font_size=20, font=FONT, color=YELLOW)
        desc8 = swap_slide(desc7, desc8)
        self.wait(3)

        # ==========================================
        # 阶段 5：数轴的自交
        # ==========================================
        desc9 = Text("第五步：当路径反复穿越零锥，数轴会自我折叠。", font_size=22, font=FONT, color=GREEN)
        desc9 = swap_slide(desc8, desc9)
        self.wait(2)

        # 高亮零锥穿越点
        zero_crossings = []
        for i in range(1, len(t_vals)):
            if metq_vals[i-1] * metq_vals[i] < 0:
                zero_crossings.append(i)

        cross_dots = VGroup()
        for idx in zero_crossings[:8]:
            dot = Dot(axes.c2p(a_vals[idx], b_vals[idx]), color=YELLOW, radius=0.1)
            cross_dots.add(dot)

        self.play(FadeIn(cross_dots, lag_ratio=0.15), run_time=2)
        self.wait(2)

        desc10 = Text("每个穿越点，数轴上的刻度停留。", font_size=20, font=FONT, color=YELLOW)
        desc10 = swap_slide(desc9, desc10)
        self.wait(2)

        # ==========================================
        # 阶段 6：映射图像 —— 数轴的“真实形状”
        # ==========================================
        desc11 = Text("第六步：把 MetS 当作横轴，a 坐标当作纵轴。", font_size=22, font=FONT, color=GREEN)
        desc11 = swap_slide(desc10, desc11)
        self.wait(2)

        # 清场
        self.play(
            FadeOut(cone1), FadeOut(cone2), FadeOut(path_vm),
            FadeOut(ant), FadeOut(cross_dots), FadeOut(warped_axis),
            FadeOut(axes), FadeOut(xl), FadeOut(yl)
        )
        self.wait(1)

        # 映射坐标系
        map_axes = Axes(
            x_range=[-0.5, 6, 1], y_range=[-0.5, 4.5, 1],
            axis_config={"color": GRAY},
            x_length=9, y_length=4.5
        ).move_to([0, 0.3, 0])
        map_xl = MathTex(r"\mathrm{MetS}", font_size=22, color=ORANGE).next_to(map_axes.x_axis, RIGHT, buff=0.1)
        map_yl = MathTex(r"a", font_size=22, color=GREEN).next_to(map_axes.y_axis, UP, buff=0.1)
        self.play(Create(map_axes), Write(map_xl), Write(map_yl))
        self.wait(2)

        desc12 = Text("这条曲线，就是数轴在度量空间中的“真实形状”。", font_size=20, font=FONT, color=GRAY)
        desc12 = swap_slide(desc11, desc12)
        self.wait(2)

        # 归一化 MetS 到 [0, 5.5]
        mets_norm = mets_vals * (5.5 / mets_max)

        map_curve_pts = [
            map_axes.c2p(mets_norm[i], a_vals[i])
            for i in range(len(t_vals))
        ]
        map_curve = VMobject()
        map_curve.set_points_smoothly(map_curve_pts)
        map_curve.set_color(ORANGE)
        map_curve.set_stroke(width=4)
        self.play(Create(map_curve), run_time=5)
        self.wait(3)

        # ==========================================
        # 阶段 7：自交的数学定义与标记
        # ==========================================
        desc13 = Text("第七步：寻找自交 —— 相同 MetS，不同位置。", font_size=22, font=FONT, color=GREEN)
        desc13 = swap_slide(desc12, desc13)
        self.wait(2)

        # 寻找自交点：MetS 相近但 a 不同的点
        intersections = []
        for i in range(0, len(t_vals) - 10, 10):
            for j in range(i + 20, len(t_vals), 10):
                if abs(mets_norm[i] - mets_norm[j]) < 0.08 and abs(a_vals[i] - a_vals[j]) > 0.3:
                    intersections.append((mets_norm[i], a_vals[i]))
                    break

        # 去重
        unique_intersections = []
        for pt in intersections:
            if not any(abs(pt[0] - u[0]) < 0.2 and abs(pt[1] - u[1]) < 0.3 for u in unique_intersections):
                unique_intersections.append(pt)

        int_dots = VGroup()
        int_labels = VGroup()
        for (s, a) in unique_intersections[:5]:
            d = Dot(map_axes.c2p(s, a), color=YELLOW, radius=0.1)
            int_dots.add(d)
            lbl = MathTex(rf"({s:.1f}, {a:.1f})", font_size=16, color=YELLOW).next_to(d, UR, buff=0.1)
            int_labels.add(lbl)

        if len(int_dots) > 0:
            self.play(FadeIn(int_dots, lag_ratio=0.2), FadeIn(int_labels, lag_ratio=0.2), run_time=2)
            self.wait(2)

        desc14 = Text("同一个 MetS 值，对应多个不同的 a 坐标。", font_size=20, font=FONT, color=YELLOW)
        desc14 = swap_slide(desc13, desc14)
        self.wait(3)

        # 水平参考线
        hlines = VGroup()
        for s_val in [1.5, 3.0, 4.5]:
            hl = DashedLine(
                map_axes.c2p(0, s_val), map_axes.c2p(5.8, s_val),
                color=GREEN, dash_length=0.1, stroke_opacity=0.5
            )
            hlines.add(hl)
        self.play(Create(hlines), run_time=2)
        self.wait(2)

        desc15 = Text("一根水平线，与曲线相交于多个点 —— 这就是自交。", font_size=20, font=FONT, color=GREEN)
        desc15 = swap_slide(desc14, desc15)
        self.wait(3)

        # ==========================================
        # 阶段 8：结论
        # ==========================================
        self.play(FadeOut(map_curve), FadeOut(int_dots), FadeOut(int_labels), FadeOut(hlines))

        desc16 = Text("结论：在 R(q) 度量空间中，", font_size=22, font=FONT, color=GREEN)
        desc16 = swap_slide(desc15, desc16)
        self.wait(2)

        desc17 = Text("“数轴”不再是均匀的直线，而是一条会拉伸、收缩、折叠的曲线。", font_size=22, font=FONT, weight=BOLD, color=RED)
        desc17 = swap_slide(desc16, desc17)
        self.wait(3)

        final_eq = MathTex(
            r"\text{刻度} \;\longmapsto\; \text{扭曲的曲线}",
            font_size=36, color=YELLOW
        ).move_to([0, 1.5, 0])
        self.play(Write(final_eq))
        self.wait(2)

        desc18 = Text("这就是“零路长，正位移”在几何上的完整图像。", font_size=22, font=FONT, weight=BOLD, color=YELLOW)
        desc18 = swap_slide(desc17, desc18)
        self.wait(5)

        # ==========================================
        # 收尾清理
        # ==========================================
        self.play(
            FadeOut(title), FadeOut(desc18), FadeOut(final_eq),
            FadeOut(map_axes), FadeOut(map_xl), FadeOut(map_yl)
        )
        self.wait(0.5)