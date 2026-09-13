from manim import *
import numpy as np

# ===== 强制设置支持中文的 LaTeX 模板 =====
tex_template = TexTemplate()
tex_template.add_to_preamble(r"\usepackage{ctex}")
tex_template.tex_compiler = "xelatex"
tex_template.output_format = ".xdv"
MathTex.set_default(tex_template=tex_template)
# =======================================

# ==================== 通用工具函数 ====================
BOTTOM_POS = np.array([0, -3.2, 0])  # 底部文字统一位置

def update_bottom_text(scene, old_text, new_text, position=None):
    """
    二维场景安全更新文字（防重影，双向滑动淡入淡出，丝滑过渡）
    """
    pos = position if position is not None else BOTTOM_POS
    new_text.move_to(pos)
    # 旧文字向下滑出 + 新文字向上滑入，两个动画同时进行
    scene.play(
        FadeOut(old_text, run_time=0.8, shift=DOWN * 0.4),
        FadeIn(new_text, run_time=0.8, shift=UP * 0.4)
    )
    scene.remove(old_text)
    return new_text

def update_bottom_text_3d(scene, old_text, new_text, position=None):
    """
    三维场景安全更新文字。
    关键：不用 FadeTransform，避免固定帧文字控制点飞到三维空间。
    改用位移 + Fade 的组合，保证丝滑。
    """
    pos = position if position is not None else BOTTOM_POS
    new_text.move_to(pos)
    scene.add_fixed_in_frame_mobjects(new_text)
    # 旧文字向下滑出，新文字向上滑入
    scene.play(
        FadeOut(old_text, run_time=0.8, shift=DOWN * 0.4),
        FadeIn(new_text, run_time=0.8, shift=UP * 0.4)
    )
    scene.remove(old_text)
    return new_text
# =======================================================

FONT = "Source Han Sans CN"


class Scene0_Intro(Scene):
    """场景0：详尽的片头引入，从数系扩张引出集合扩张（防重叠版）"""
    def construct(self):
        title = Text("数学中的“生长”：集合与空间的扩张", font_size=36, font=FONT, weight=BOLD, color=YELLOW).to_edge(UP, buff=1)
        self.play(Write(title))
        self.wait(3)

        desc1 = Text("回顾数学史，我们认知的数系一直在“生长”。", font_size=24, font=FONT, color=GREEN)
        chain = MathTex(r"\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}", font_size=48, color=BLUE)
        desc2 = Text("但是，有理数域 Q 并不完美。", font_size=24, font=FONT, color=ORANGE)
        eq = MathTex(r"x^2 = 2 \quad \text{在 } \mathbb{Q} \text{ 中无解}", font_size=36, color=RED)
        desc3 = Text("为了突破系统的封闭性，数学家引入了外部的新元素。", font_size=24, font=FONT, color=GREEN)
        desc4 = MathTex(r"\text{由此诞生了扩张集合：} A(c)", font_size=32, color=YELLOW)

        content_group = VGroup(desc1, chain, desc2, eq, desc3, desc4).arrange(DOWN, buff=0.6)
        content_group.move_to([0, -0.5, 0])

        self.play(Write(desc1))
        self.wait(2)
        self.play(Write(chain))
        self.wait(3)
        self.play(Write(desc2))
        self.wait(2)
        self.play(Write(eq))
        self.wait(4)
        self.play(Write(desc3))
        self.wait(2)
        self.play(Write(desc4))
        self.wait(4)

        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)


class Scene1_SetExtension(Scene):
    """场景1：极尽详细的集合扩张 A(c) 与 A(c,d)"""
    def construct(self):
        # --- 1. 基础集合 A ---
        title = Text("第一步：我们拥有一个封闭集合 A", font_size=28, font=FONT, color=BLUE).to_edge(UP)
        self.play(Write(title))

        set_A = Circle(radius=1.2, color=BLUE, fill_opacity=0.4, stroke_width=3).move_to([-3, 0, 0])
        label_A = MathTex(r"A", font_size=48, color=BLUE).move_to(set_A.get_center())
        
        desc_A = VGroup(
            MathTex(r"\text{A 是一个封闭系统}", font_size=24, color=GRAY),
            MathTex(r"\text{例如：有理数域 } \mathbb{Q}", font_size=24, color=GRAY),
            MathTex(r"\text{它对加减乘除是封闭的}", font_size=24, color=GRAY)
        ).arrange(DOWN, buff=0.4).move_to([3, 0, 0])

        self.play(GrowFromCenter(set_A), Write(label_A))
        self.play(Write(desc_A))
        self.wait(4)

        # --- 2. 引入外部元素 c ---
        title_C = Text("第二步：引入一个不属于 A 的外部新元素 c", font_size=28, font=FONT, color=YELLOW).to_edge(UP)
        self.play(Transform(title, title_C), FadeOut(desc_A))
        
        point_c = Dot(point=[-1.8, 1.8, 0], color=YELLOW, radius=0.1)
        label_c = MathTex(r"c", font_size=36, color=YELLOW).next_to(point_c, RIGHT, buff=0.2)
        
        desc_c = VGroup(
            MathTex(r"\text{例如：} c = \sqrt{2}", font_size=28, color=YELLOW),
            MathTex(r"\text{引入它，就是为了让 } x^2 = 2 \text{ 有解}", font_size=22, color=GRAY)
        ).arrange(DOWN, buff=0.4).move_to([3, 0, 0])
        
        self.play(FadeIn(point_c), Write(label_c))
        self.play(Write(desc_c))
        self.wait(4)

        # --- 3. 形成最小封闭集合 A(c)，详细推导代数结构 ---
        title_Ac = Text("第三步：包含 A 和 c 的最小封闭集合，记作 A(c)", font_size=28, font=FONT, color=RED).to_edge(UP)
        self.play(Transform(title, title_Ac), FadeOut(desc_c))

        set_Ac = Circle(radius=2.4, color=RED, fill_opacity=0.2, stroke_width=3).move_to([-3, 0.2, 0])
        label_Ac = MathTex(r"A(c)", font_size=48, color=RED).move_to([-3, -1.8, 0])
        
        desc_Ac1 = MathTex(r"\text{既然加入了 } c \text{，为了保持封闭，}", font_size=22, color=GRAY)
        desc_Ac2 = MathTex(r"\text{必须包含所有 } a + bc \text{ 的形式}", font_size=26, color=YELLOW)
        desc_Ac3 = MathTex(r"\text{其中 } a, b \in A", font_size=22, color=GRAY)
        
        group_Ac = VGroup(desc_Ac1, desc_Ac2, desc_Ac3).arrange(DOWN, buff=0.3).move_to([3, 0, 0])

        self.play(GrowFromCenter(set_Ac))
        self.play(Write(label_Ac))
        self.play(Write(group_Ac))
        self.wait(3)
        
        formula_Ac = MathTex(r"\therefore A(c) = \{ a + bc \mid a, b \in A \}", font_size=36, color=GREEN)
        formula_Ac.move_to([3, -1.5, 0])
        self.play(Write(formula_Ac))
        self.wait(5)

        # --- 4. 深度图解关系式 A ⊆ A(c) ---
        title_Rel = Text("第四步：深入理解 A 与 A(c) 的关系", font_size=28, font=FONT, color=GREEN).to_edge(UP)
        self.play(Transform(title, title_Rel), FadeOut(group_Ac), FadeOut(formula_Ac))

        self.play(set_A.animate.set_fill(BLUE, opacity=0.8), Indicate(set_Ac, color=RED, scale_factor=1.05))
        self.wait(2)

        logic1 = MathTex(r"\text{对于任意 } x \in A", font_size=28, color=WHITE).move_to([3, 1.5, 0])
        logic2 = MathTex(r"\text{令 } b = 0 \text{，则 } x = x + 0 \cdot c", font_size=28, color=WHITE).next_to(logic1, DOWN, buff=0.4)
        logic3 = MathTex(r"\text{因为 } x + 0 \cdot c \in A(c)", font_size=28, color=WHITE).next_to(logic2, DOWN, buff=0.4)
        logic4 = MathTex(r"\text{所以 } x \in A(c)", font_size=28, color=YELLOW).next_to(logic3, DOWN, buff=0.4)
        
        group_logic = VGroup(logic1, logic2, logic3, logic4).move_to([3, 0, 0])
        
        # 修改：使用子集符号 ⊆ 表达包含关系
        formula = MathTex(r"\therefore A \subseteq A(c)", font_size=48, color=YELLOW).move_to([-3, -2, 0])
        explain_formula = Text("A 中的每个元素都躺在 A(c) 里面，原有元素一个都没少。", font_size=20, font=FONT, color=GRAY).next_to(formula, DOWN, buff=0.3)

        self.play(Write(group_logic))
        self.wait(3)
        self.play(Write(formula))
        self.play(Write(explain_formula))
        self.wait(5)

        # --- 5. 引入 A(c, d) ---
        title_Cd = Text("第五步：继续引入新元素 d，形成 A(c, d)", font_size=28, font=FONT, color=PURPLE).to_edge(UP)
        self.play(Transform(title, title_Cd), FadeOut(group_logic), FadeOut(formula), FadeOut(explain_formula))

        set_Acd = Circle(radius=3.2, color=PURPLE, fill_opacity=0.1, stroke_width=3).move_to([-3, 0.2, 0])
        label_Acd = MathTex(r"A(c, d)", font_size=48, color=PURPLE).move_to([-3, -2.5, 0])
        
        desc_Acd = VGroup(
            MathTex(r"\text{类似地，引入 } d \text{ 后系统进一步扩张}", font_size=22, color=GRAY),
            MathTex(r"A(c, d) = \{ a + bc + ed + fcd \mid a,b,e,f \in A \}", font_size=28, color=PURPLE),
            Text("这就是数学系统的不断生长。", font_size=22, font=FONT, color=GREEN)
        ).arrange(DOWN, buff=0.4).move_to([3, 0, 0])

        self.play(GrowFromCenter(set_Acd))
        self.play(Write(label_Acd))
        self.play(Write(desc_Acd))
        self.wait(6)

        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)


class Scene2_Combined(ThreeDScene):
    """场景2：二维详细讲解 + 三维马鞍面 + 相机旋转（最终丝滑版）"""
    def construct(self):
        # ==========================================
        # 1. 初始设置：二维视角，固定标题
        # ==========================================
        self.set_camera_orientation(phi=0 * DEGREES, theta=-90 * DEGREES)
        
        title = Text("几何视角：为什么任何 A(c) 都是二维的？", font_size=30, font=FONT, weight=BOLD, color=YELLOW)
        title.to_corner(UL, buff=0.5)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(2)

        # ==========================================
        # 2. 阶段一：二维坐标系（详细讲解）
        # ==========================================
        desc1 = Text("从代数学的视角，A(c) 中的每个元素由两个 A 中的数决定：a 和 b。", font_size=22, font=FONT, color=GRAY)
        desc1.move_to(BOTTOM_POS)
        self.add_fixed_in_frame_mobjects(desc1)
        self.play(Write(desc1))
        self.wait(2)

        axes_2d = Axes(
            x_range=[-3, 3, 1], y_range=[-2, 3, 1],
            axis_config={"color": GRAY},
            x_length=8, y_length=5
        ).move_to([0, 0.2, 0])
        
        x_label = MathTex(r"\text{基底 } 1 \text{ (对应 } a \text{)}", font_size=24, color=GREEN).next_to(axes_2d.x_axis, RIGHT, buff=0.2)
        y_label = MathTex(r"\text{基底 } c \text{ (对应 } b \text{)}", font_size=24, color=BLUE).next_to(axes_2d.y_axis, UP, buff=0.2)
        
        self.play(Create(axes_2d), Write(x_label), Write(y_label))
        self.wait(3)

        # 阶段二：点的对应关系
        desc2 = Text("任意元素 a + bc 都唯一对应坐标系中的一个点 (a, b)。", font_size=22, font=FONT, color=YELLOW)
        desc2.move_to(BOTTOM_POS)
        desc1 = update_bottom_text(self, desc1, desc2)
        self.wait(2)
        
        a_val, b_val = 1.5, 1.0
        point = Dot(axes_2d.c2p(a_val, b_val), color=RED)
        label = MathTex(r"a + bc", font_size=32, color=RED).next_to(point, UP, buff=0.2)
        vector = Arrow(axes_2d.c2p(0, 0), axes_2d.c2p(a_val, b_val), color=RED, buff=0, stroke_width=5)

        self.play(FadeIn(point), Write(label))
        self.play(Create(vector))
        self.wait(3)

        # 阶段三：代入 c = i，转化为复平面
        desc3 = Text("当 c = i 时（即复数单位），这个抽象的二维平面，就变成了复平面 C。", font_size=22, font=FONT, color=GREEN)
        desc3.move_to(BOTTOM_POS)
        desc2 = update_bottom_text(self, desc2, desc3)
        self.wait(2)
        
        new_x_label = Text("实轴 (Real)", font_size=20, font=FONT, color=GREEN).next_to(axes_2d.x_axis, RIGHT, buff=0.2)
        new_y_label = Text("虚轴 (Imaginary)", font_size=20, font=FONT, color=BLUE).next_to(axes_2d.y_axis, UP, buff=0.2)
        
        self.play(
            FadeOut(vector), FadeOut(point), FadeOut(label),
            Transform(x_label, new_x_label), 
            Transform(y_label, new_y_label)
        )
        self.wait(3)

        # ==========================================
        # 3. 阶段四：二维视角下解决 x^2 = -1 的困境
        # ==========================================
        desc4 = Text("回到最初的问题：为什么在二维复平面里，x² = -1 就有解了？", font_size=22, font=FONT, color=ORANGE)
        desc4.move_to(BOTTOM_POS)
        desc3 = update_bottom_text(self, desc3, desc4)
        self.wait(2)

        parabola = axes_2d.plot(lambda x: x**2, color=BLUE, stroke_width=4)
        line_neg1 = axes_2d.plot(lambda x: -1, color=RED, stroke_width=4)
        para_label = MathTex(r"y = x^2", font_size=24, color=BLUE).next_to(axes_2d.c2p(1.5, 2.25), RIGHT, buff=0.1)
        line_label = MathTex(r"y = -1", font_size=24, color=RED).next_to(axes_2d.c2p(2, -1), RIGHT, buff=0.1)

        self.play(Create(parabola), Write(para_label))
        self.play(Create(line_neg1), Write(line_label))
        self.wait(3)

        desc5 = Text("在实轴上，曲线与直线没有交点。这让我们不得不引入三维视角。", font_size=22, font=FONT, color=YELLOW)
        desc5.move_to(BOTTOM_POS)
        desc4 = update_bottom_text(self, desc4, desc5)
        self.wait(3)

        # ==========================================
        # 4. 阶段五：平滑切换到三维视角
        # ==========================================
        self.play(
            FadeOut(parabola), FadeOut(line_neg1), FadeOut(para_label), FadeOut(line_label),
            FadeOut(axes_2d), FadeOut(x_label), FadeOut(y_label)
        )
        self.wait(1)

        # 切换相机角度
        self.move_camera(phi=70 * DEGREES, theta=-45 * DEGREES, run_time=3)
        self.wait(2)

        axes_3d = ThreeDAxes(
            x_range=[-3, 3, 1], y_range=[-3, 3, 1], z_range=[-2, 4, 1],
            x_length=8, y_length=6, z_length=5
        )
        
        x_label_3d = MathTex(r"\text{实部 } a", font_size=24, color=GREEN).next_to(axes_3d.x_axis.get_end(), RIGHT)
        y_label_3d = MathTex(r"\text{虚部 } b", font_size=24, color=BLUE).next_to(axes_3d.y_axis.get_end(), UP)
        z_label_3d = MathTex(r"\text{函数值 } z", font_size=24, color=RED).next_to(axes_3d.z_axis.get_end(), RIGHT)
        
        self.play(Create(axes_3d))
        self.play(Write(x_label_3d), Write(y_label_3d), Write(z_label_3d))
        self.wait(2)

        desc6 = Text("在三维空间中，复变量的平方实部是一个马鞍面：z = u² - v²。", font_size=22, font=FONT, color=YELLOW)
        desc6.move_to(BOTTOM_POS)
        desc5 = update_bottom_text_3d(self, desc5, desc6)
        self.wait(2)

        # 绘制马鞍面
        surface = axes_3d.plot_surface(
            lambda u, v: u**2 - v**2,
            u_range=[-2, 2], v_range=[-2, 2],
            color=BLUE, fill_opacity=0.5, resolution=(20, 20)
        )
        self.play(Create(surface))
        
        # === 关键：开启相机自动旋转，展示立体感 ===
        self.begin_ambient_camera_rotation(rate=0.15)
        self.wait(5)
        self.stop_ambient_camera_rotation()

        desc7 = Text("此时再放入平面 z = -1，它们的交线将清晰可见。", font_size=22, font=FONT, color=ORANGE)
        desc7.move_to(BOTTOM_POS)
        desc6 = update_bottom_text_3d(self, desc6, desc7)
        self.wait(2)

        plane = axes_3d.plot_surface(
            lambda u, v: -1,
            u_range=[-2, 2], v_range=[-2, 2],
            color=RED, fill_opacity=0.4, resolution=(20, 20)
        )
        self.play(Create(plane))
        self.wait(2)

        # 再次开启旋转，展示交线
        self.begin_ambient_camera_rotation(rate=0.12)
        self.wait(4)
        self.stop_ambient_camera_rotation()

        # ==========================================
        # 5. 阶段六：展示交线，引出 i 和 -i
        # ==========================================
        desc8 = Text("交线是一条双曲线，在 u=0 处的两个交点，正是我们寻找的解。", font_size=22, font=FONT, color=GREEN)
        desc8.move_to(BOTTOM_POS)
        desc7 = update_bottom_text_3d(self, desc7, desc8)
        self.wait(2)

        curve1 = axes_3d.plot_parametric_curve(
            lambda t: [np.sinh(t), np.cosh(t), -1],
            t_range=[-2, 2], color=YELLOW, stroke_width=6
        )
        curve2 = axes_3d.plot_parametric_curve(
            lambda t: [-np.sinh(t), np.cosh(t), -1],
            t_range=[-2, 2], color=YELLOW, stroke_width=6
        )
        self.play(Create(curve1), Create(curve2))
        self.wait(2)

        i_dot = Dot3D(axes_3d.c2p(0, 1, -1), color=ORANGE, radius=0.15)
        neg_i_dot = Dot3D(axes_3d.c2p(0, -1, -1), color=ORANGE, radius=0.15)
        i_label = MathTex(r"i", font_size=36, color=ORANGE).next_to(i_dot, RIGHT, buff=0.2)
        neg_i_label = MathTex(r"-i", font_size=36, color=ORANGE).next_to(neg_i_dot, RIGHT, buff=0.2)
        
        self.play(FadeIn(i_dot), Write(i_label), FadeIn(neg_i_dot), Write(neg_i_label))
        self.wait(3)

        desc9 = Text(r"这两个点 (0, 1, -1) 和 (0, -1, -1)，就是复平面上的解 i 和 -i。", font_size=22, font=FONT, color=GREEN)
        desc9.move_to(BOTTOM_POS)
        desc8 = update_bottom_text_3d(self, desc8, desc9)
        self.wait(4)

        # ==========================================
        # 6. 阶段七：最终总结
        # ==========================================
        desc10 = Text("空间扩张的本质，是引入新的维度或基底。", font_size=24, font=FONT, color=GREEN)
        desc10.move_to(BOTTOM_POS)
        desc9 = update_bottom_text_3d(self, desc9, desc10)
        
        formula = MathTex(r"A \subseteq A(c)", font_size=48, color=YELLOW).to_corner(UR, buff=0.5)
        self.add_fixed_in_frame_mobjects(formula)
        self.play(Write(formula))
        
        # 最后一次缓慢旋转，给总结留视觉冲击
        self.begin_ambient_camera_rotation(rate=0.08)
        self.wait(6)
        self.stop_ambient_camera_rotation()

        self.play(*[FadeOut(mob) for mob in self.mobjects])