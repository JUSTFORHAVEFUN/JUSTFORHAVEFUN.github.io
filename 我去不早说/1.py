#!/usr/bin/env python3
"""
星际跳跃 · ASTRO HOP 16-BIT
纯 Python 标准库生成 WAV
运行: python3 astro_hop.py
"""

import wave, struct, math, random, sys

# ══════════════════════════════════════════
# 1. 基础参数
# ══════════════════════════════════════════
SR = 22050            # 采样率（16-bit 时代 SNES 常用 32kHz，这里降到 22k 加快生成）
BPM = 132
BEAT = 60.0 / BPM
BAR_BEATS = 4
BAR = BEAT * BAR_BEATS

NOTES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def nn(s):
    """音名 → MIDI 音高，如 'C#5' / 'E5' / 'Bb4'"""
    c, acc = s[0], s[1]
    if acc in '#b':
        semi = NOTES[c] + (1 if acc == '#' else -1)
        oct_str = s[2:]
    else:
        semi = NOTES[c]
        oct_str = s[1:]
    return 12 * (int(oct_str) + 1) + semi

def mtof(m):
    """MIDI 音高 → 频率"""
    return 440.0 * (2.0 ** ((m - 69) / 12.0))

# ══════════════════════════════════════════
# 2. 和弦库
# ══════════════════════════════════════════
CHORDS = {
    'C':  {'root': 48, 'ivs': [0, 4, 7]},
    'G':  {'root': 43, 'ivs': [0, 4, 7]},
    'Am': {'root': 45, 'ivs': [0, 3, 7]},
    'F':  {'root': 41, 'ivs': [0, 4, 7]},
    'Em': {'root': 40, 'ivs': [0, 3, 7]},
    'Dm': {'root': 38, 'ivs': [0, 3, 7]},
}

# ══════════════════════════════════════════
# 3. 旋律数据 [起拍, 音名, 时值(拍)]
# ══════════════════════════════════════════
MEL_A = [
    (0, 'E5', 0.5), (0.5, 'G5', 0.5), (1, 'C6', 1),
    (2, 'B5', 0.5), (2.5, 'G5', 0.5), (3, 'E5', 1),
    (4, 'D6', 1), (5, 'B5', 0.5), (5.5, 'G5', 0.5), (6, 'B5', 2),
    (8, 'A5', 1), (9, 'C6', 0.5), (9.5, 'E6', 0.5),
    (10, 'D6', 0.5), (10.5, 'C6', 0.5), (11, 'A5', 1),
    (12, 'F5', 1), (13, 'A5', 1), (14, 'C6', 2),
    (16, 'E6', 1), (17, 'C6', 0.5), (17.5, 'G5', 0.5), (18, 'E5', 1), (19, 'G5', 1),
    (20, 'D6', 1), (21, 'B5', 0.5), (21.5, 'G5', 0.5), (22, 'D6', 2),
    (24, 'C6', 1), (25, 'A5', 1), (26, 'F5', 1), (27, 'A5', 1),
    (28, 'G5', 0.5), (28.5, 'B5', 0.5), (29, 'D6', 0.5), (29.5, 'G6', 0.5), (30, 'D6', 2),
]

MEL_B = [
    (0, 'A4', 0.5), (0.5, 'C5', 0.5), (1, 'E5', 0.5), (1.5, 'A5', 0.5), (2, 'C6', 2),
    (4, 'A5', 0.5), (4.5, 'G5', 0.5), (5, 'F5', 0.5), (5.5, 'A5', 0.5), (6, 'C6', 2),
    (8, 'G5', 0.5), (8.5, 'C6', 0.5), (9, 'E6', 0.5), (9.5, 'C6', 0.5), (10, 'G5', 2),
    (12, 'F#5', 0.5), (12.5, 'A5', 0.5), (13, 'D6', 0.5), (13.5, 'F#6', 0.5), (14, 'A6', 2),
    (16, 'E6', 1), (17, 'C6', 0.5), (17.5, 'A5', 0.5), (18, 'E5', 2),
    (20, 'F5', 0.5), (20.5, 'A5', 0.5), (21, 'C6', 1), (22, 'A5', 1), (23, 'F5', 1),
    (24, 'G5', 0.5), (24.5, 'B5', 0.5), (25, 'D6', 1), (26, 'B5', 1), (27, 'G5', 1),
    (28, 'E6', 1), (29, 'C6', 1), (30, 'G5', 1), (31, 'E5', 1),
]

MEL_B2 = [
    (0, 'E5', 1), (1, 'A5', 1), (2, 'C6', 1), (3, 'E6', 1),
    (4, 'D6', 1), (5, 'C6', 1), (6, 'A5', 2),
    (8, 'G5', 1), (9, 'C6', 1), (10, 'E6', 1), (11, 'G6', 1),
    (12, 'F#6', 1), (13, 'D6', 1), (14, 'B5', 2),
    (16, 'A5', 1), (17, 'C6', 0.5), (17.5, 'E6', 0.5), (18, 'A6', 2),
    (20, 'G6', 1), (21, 'E6', 1), (22, 'C6', 2),
    (24, 'F#6', 1), (25, 'A6', 1), (26, 'G6', 1), (27, 'D6', 1),
    (28, 'E6', 0.5), (28.5, 'G6', 0.5), (29, 'C7', 1), (30, 'G6', 2),
]

MEL_OUTRO = [
    (0, 'C6', 1), (1, 'G5', 1), (2, 'E5', 2),
    (4, 'F5', 1), (5, 'A5', 1), (6, 'C6', 2),
    (8, 'D6', 1.5), (9.5, 'B5', 0.5), (10, 'G5', 2),
    (12, 'C6', 4),
]

# ══════════════════════════════════════════
# 4. 曲式结构
# ══════════════════════════════════════════
SECTIONS = [
    {'name': '前奏',        'bars': 2, 'chords': ['C', 'G'],                          'mel': None,       'drums': 2},
    {'name': '主部 · 起航', 'bars': 8, 'chords': ['C','G','Am','F','C','G','F','G'],  'mel': MEL_A,      'drums': 1},
    {'name': '副部 · 星际', 'bars': 8, 'chords': ['Am','F','C','G','Am','F','G','C'], 'mel': MEL_B,      'drums': 1},
    {'name': '主部 · 再临', 'bars': 8, 'chords': ['C','G','Am','F','C','G','F','G'],  'mel': MEL_A,      'drums': 1},
    {'name': '副部 · 高翔', 'bars': 8, 'chords': ['Am','F','C','G','Am','F','G','C'], 'mel': MEL_B2,     'drums': 1},
    {'name': '尾声',        'bars': 4, 'chords': ['C','F','G','C'],                   'mel': MEL_OUTRO,  'drums': 1},
]

TOTAL_BARS = sum(s['bars'] for s in SECTIONS)
TOTAL_BEATS = TOTAL_BARS * BAR_BEATS
TOTAL_TIME = TOTAL_BEATS * BEAT
TOTAL_SAMPLES = int(TOTAL_TIME * SR) + SR  # 尾部余量

print(f"总时长: {TOTAL_TIME:.1f} 秒, 共 {TOTAL_BARS} 小节")
print(f"总采样: {TOTAL_SAMPLES}")

# ══════════════════════════════════════════
# 5. 波形生成工具
# ══════════════════════════════════════════
MIN_V = 1e-4

def clamp(x):
    return max(-1.0, min(1.0, x))

def adsr(t, dur, peak, a, d, s, r):
    """ADSR 包络，t 为相对音符起点的秒数"""
    if t < 0 or t > dur:
        return 0.0
    a = min(a, dur * 0.20)
    d = min(d, dur * 0.25)
    r = min(r, dur * 0.35)
    if t < a:
        return peak * (t / a) if a > 0 else peak
    if t < a + d:
        return peak * (1 - (1 - s) * (t - a) / d) if d > 0 else peak * s
    if t < dur - r:
        return peak * s
    return peak * s * (dur - t) / r if r > 0 else 0.0

# 预计算波形查找表（一个周期 512 点）
def make_square_table():
    return [1.0 if i < 256 else -1.0 for i in range(512)]

def make_triangle_table():
    return [4.0 * abs((i / 512.0) - 0.5) - 1.0 for i in range(512)]

SQUARE_TABLE = make_square_table()
TRI_TABLE = make_triangle_table()

def sample_wave(table, phase):
    idx = int(phase * 512) & 511
    return table[idx]

# 谐波加权的"温暖方波"（用于主音）—— 近似 16-bit 采样音色
def make_warm_table(harmonics):
    """harmonics: [(倍数, 振幅), ...]"""
    table = [0.0] * 512
    for h, amp in harmonics:
        for i in range(512):
            table[i] += amp * math.sin(2 * math.pi * h * i / 512)
    # 归一化
    peak = max(abs(v) for v in table) or 1
    return [v / peak for v in table]

WARM_LEAD = make_warm_table([(1, 1.0), (2, 0.45), (3, 0.18), (4, 0.08), (5, 0.04), (6, 0.018)])
WARM_BASS = make_warm_table([(1, 1.0), (2, 0.18), (3, 0.04), (4, 0.01)])
WARM_PAD  = make_warm_table([(1, 1.0), (2, 0.35), (3, 0.14), (4, 0.06), (5, 0.025)])
WARM_ARP  = make_warm_table([(1, 1.0), (2, 0.12), (3, 0.05), (4, 0.02)])

# ══════════════════════════════════════════
# 6. 声部渲染函数（把音符混入缓冲区）
# ══════════════════════════════════════════

def render_lead(buf, freq, start_s, dur_s, vel, pan=0.0):
    """主音：谐波方波 + 5Hz 颤音"""
    n_start = int(start_s * SR)
    n_len = int(dur_s * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    # 立体声左右增益
    lg = math.sqrt(0.5 * (1 - pan)) if pan > 0 else math.sqrt(0.5)
    rg = math.sqrt(0.5 * (1 + pan)) if pan < 0 else math.sqrt(0.5)
    lg = math.cos((pan + 1) * math.pi / 4)
    rg = math.sin((pan + 1) * math.pi / 4)

    phase = 0.0
    lfo_phase = 0.0
    lfo_rate = 5.2
    for i in range(n_len):
        t = i / SR
        # 颤音：±4 cents ≈ ±0.23% 频率
        lfo = math.sin(2 * math.pi * lfo_rate * t)
        f = freq * (1 + lfo * 0.0023)
        phase += f / SR
        if phase >= 1.0:
            phase -= 1.0
        raw = sample_wave(WARM_LEAD, phase)
        env = adsr(t, dur_s, vel * 0.55, 0.018, 0.10, 0.65, 0.14)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * lg
        buf[idx + 1] += s * rg


def render_bass(buf, freq, start_s, dur_s, vel):
    n_start = int(start_s * SR)
    n_len = int(dur_s * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    phase = 0.0
    for i in range(n_len):
        t = i / SR
        phase += freq / SR
        if phase >= 1.0:
            phase -= 1.0
        raw = sample_wave(WARM_BASS, phase)
        env = adsr(t, dur_s, vel, 0.010, 0.08, 0.70, 0.10)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * 0.707
        buf[idx + 1] += s * 0.707


def render_pad(buf, freq, start_s, dur_s, vel, pan=0.2):
    n_start = int(start_s * SR)
    n_len = int(dur_s * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    lg = math.cos((pan + 1) * math.pi / 4)
    rg = math.sin((pan + 1) * math.pi / 4)
    phase = 0.0
    # 轻微失谐以制造厚度
    detune = 1.0015
    phase2 = 0.0
    for i in range(n_len):
        t = i / SR
        phase += freq / SR
        phase2 += (freq * detune) / SR
        if phase >= 1.0: phase -= 1.0
        if phase2 >= 1.0: phase2 -= 1.0
        raw = (sample_wave(WARM_PAD, phase) + sample_wave(WARM_PAD, phase2)) * 0.5
        env = adsr(t, dur_s, vel, 0.10, 0.20, 0.75, 0.30)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * lg
        buf[idx + 1] += s * rg


def render_arp(buf, freq, start_s, dur_s, vel, pan=0.3):
    n_start = int(start_s * SR)
    n_len = int(dur_s * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    lg = math.cos((pan + 1) * math.pi / 4)
    rg = math.sin((pan + 1) * math.pi / 4)
    phase = 0.0
    for i in range(n_len):
        t = i / SR
        phase += freq / SR
        if phase >= 1.0: phase -= 1.0
        raw = sample_wave(WARM_ARP, phase)
        env = adsr(t, dur_s, vel, 0.006, 0.04, 0.35, 0.06)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * lg
        buf[idx + 1] += s * rg


def render_kick(buf, start_s, vel=0.55):
    n_start = int(start_s * SR)
    n_len = int(0.30 * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    phase = 0.0
    for i in range(n_len):
        t = i / SR
        # 音高从 150Hz 指数下滑到 48Hz
        freq = 48 + (150 - 48) * math.exp(-t / 0.025)
        phase += freq / SR
        if phase >= 1.0: phase -= 1.0
        raw = math.sin(2 * math.pi * phase)
        # 包络：5ms 起音，之后指数衰减
        if t < 0.005:
            env = vel * (t / 0.005)
        else:
            env = vel * math.exp(-(t - 0.005) / 0.06)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * 0.707
        buf[idx + 1] += s * 0.707


def render_snare(buf, start_s, vel=0.16):
    n_start = int(start_s * SR)
    n_len = int(0.22 * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    for i in range(n_len):
        t = i / SR
        # 噪声 + 音体
        noise = random.random() * 2 - 1
        body_freq = 190 * math.exp(-t / 0.03) + 140
        body = math.sin(2 * math.pi * body_freq * t) if t < 0.08 else 0
        raw = noise * 0.7 + body * 0.5
        if t < 0.005:
            env = vel * (t / 0.005)
        else:
            env = vel * math.exp(-(t - 0.005) / 0.04)
        s = raw * env
        idx = (n_start + i) * 2
        buf[idx]     += s * 0.707
        buf[idx + 1] += s * 0.707


def render_hat(buf, start_s, vel=0.04):
    n_start = int(start_s * SR)
    n_len = int(0.06 * SR)
    if n_start + n_len > len(buf):
        n_len = len(buf) - n_start
    if n_len <= 0:
        return
    prev = 0.0
    for i in range(n_len):
        t = i / SR
        # 简易高通：对白噪声做差分
        noise = random.random() * 2 - 1
        hp = noise - prev
        prev = noise
        if t < 0.002:
            env = vel * (t / 0.002)
        else:
            env = vel * math.exp(-(t - 0.002) / 0.012)
        s = hp * env
        idx = (n_start + i) * 2
        buf[idx]     += s * 0.707
        buf[idx + 1] += s * 0.707

# ══════════════════════════════════════════
# 7. 分块调度（把每个音符渲染进缓冲区）
# ══════════════════════════════════════════
buf = [0.0] * (TOTAL_SAMPLES * 2)   # 立体声

print("调度中...")

cursor = 0
for sec in SECTIONS:
    # 主旋律
    if sec['mel']:
        for off, name, dur in sec['mel']:
            start_s = (cursor * BAR_BEATS + off) * BEAT
            dur_s = dur * BEAT * 0.92
            render_lead(buf, mtof(nn(name)), start_s, dur_s, 0.20)

    # 逐小节
    for i in range(sec['bars']):
        chord_name = sec['chords'][i % len(sec['chords'])]
        ch = CHORDS[chord_name]
        bar_start = (cursor + i) * BAR

        # 铺底
        for k in range(len(ch['ivs'])):
            f = mtof(ch['root'] + 12 + ch['ivs'][k])
            render_pad(buf, f, bar_start, BAR * 0.95, 0.055)

        # 贝斯
        for beat_off, iv, d in [(0,0,0.85),(1.5,7,0.32),(2,0,0.85),(3.5,12,0.32)]:
            render_bass(buf, mtof(ch['root'] + iv),
                       bar_start + beat_off * BEAT, d * BEAT, 0.26)

        # 琶音（16 分音符）
        arp_order = [0, 1, 2, 1]
        for s in range(16):
            idx = arp_order[s & 3]
            note = ch['root'] + 24 + ch['ivs'][idx]
            render_arp(buf, mtof(note),
                      bar_start + s * 0.25 * BEAT, 0.22 * BEAT, 0.045)

        # 鼓
        if sec['drums'] == 1:
            render_kick(buf, bar_start, 0.55)
            render_kick(buf, bar_start + 2 * BEAT, 0.48)
            render_snare(buf, bar_start + 1 * BEAT, 0.16)
            render_snare(buf, bar_start + 3 * BEAT, 0.16)
            for h in range(8):
                render_hat(buf, bar_start + h * 0.5 * BEAT,
                          0.022 if (h & 1) else 0.042)
        elif sec['drums'] == 2:
            render_kick(buf, bar_start, 0.42)
            render_kick(buf, bar_start + 2 * BEAT, 0.36)
            for h in range(8):
                render_hat(buf, bar_start + h * 0.5 * BEAT, 0.020)

    cursor += sec['bars']
    print(f"  完成 {sec['name']}")

# ══════════════════════════════════════════
# 8. 母带处理
# ══════════════════════════════════════════
print("母带处理...")

# 8.1 简单混响（梳状延迟 + 衰减）
def add_reverb(buf, delay_s=0.06, decay=0.35, wet=0.22):
    delay_n = int(delay_s * SR) * 2
    n = len(buf)
    out = buf[:]
    for i in range(delay_n, n):
        out[i] += out[i - delay_n] * decay * wet
    return out

buf = add_reverb(buf, 0.055, 0.32, 0.20)
buf = add_reverb(buf, 0.089, 0.28, 0.15)

# 8.2 软削波（tanh）
def soft_clip(x):
    return math.tanh(x * 1.4) / math.tanh(1.4)

# 8.3 母带音量包络（渐入 + 尾部淡出）
fade_in_n = int(0.20 * SR) * 2
fade_out_n = int(2 * BAR * SR) * 2
end_n = int(TOTAL_TIME * SR) * 2

for i in range(0, min(fade_in_n, len(buf))):
    buf[i] *= i / fade_in_n

for i in range(max(0, end_n - fade_out_n), end_n):
    k = (end_n - i) / fade_out_n
    buf[i] *= k

# 8.4 全局峰值归一化 + 软削波
peak = max(abs(v) for v in buf) or 1.0
print(f"  峰值: {peak:.3f}")

max_val = 32767
frames = bytearray()
for i in range(0, len(buf), 2):
    l = soft_clip(buf[i] / peak * 0.95)
    r = soft_clip(buf[i + 1] / peak * 0.95)
    frames += struct.pack('<hh', int(l * max_val), int(r * max_val))

# ══════════════════════════════════════════
# 9. 写 WAV
# ══════════════════════════════════════════
OUT = 'astro_hop_16bit.wav'
print(f"写入 {OUT} ...")
with wave.open(OUT, 'wb') as f:
    f.setnchannels(2)      # 立体声
    f.setsampwidth(2)      # 16-bit
    f.setframerate(SR)
    f.writeframes(bytes(frames))

duration = len(frames) / 4 / SR
print(f"✅ 完成: {OUT}")
print(f"   时长: {duration:.1f} 秒")
print(f"   采样率: {SR} Hz / 16-bit / 立体声")

# 可选：如果装了 ffmpeg，自动转 MP3
try:
    import subprocess
    subprocess.run(['ffmpeg', '-y', '-i', OUT, '-b:a', '192k', 'astro_hop_16bit.mp3'],
                   check=True, capture_output=True)
    print("✅ 已转 MP3: astro_hop_16bit.mp3")
except Exception:
    print("ℹ️  未检测到 ffmpeg，跳过 MP3 转换")