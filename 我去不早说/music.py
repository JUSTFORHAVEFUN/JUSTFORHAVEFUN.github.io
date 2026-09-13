import numpy as np
import wave

# ================= 配置参数 =================
SAMPLE_RATE = 44100
LOOP_DURATION = 16.0     # 最终循环的时长 (4个和弦，每个4秒)
TEMPO = 60               # 慢速，60 BPM
BEAT_DUR = 60 / TEMPO    

def note_to_freq(note):
    return 440.0 * (2.0 ** ((note - 69) / 12.0))

# ================= 钢琴音色合成 =================
def generate_piano_note(freq, duration, volume=0.5):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    
    # 泛音叠加
    wave_data = np.sin(freq * t * 2 * np.pi) * 0.7
    wave_data += np.sin(freq * 2 * t * 2 * np.pi) * 0.2
    wave_data += np.sin(freq * 3 * t * 2 * np.pi) * 0.07
    wave_data += np.sin(freq * 4 * t * 2 * np.pi) * 0.03
    
    # 包络：慢起音，长衰减（模拟踏板钢琴）
    attack = int(0.05 * SAMPLE_RATE)
    decay = int(duration * SAMPLE_RATE) - attack
    envelope = np.concatenate([
        np.linspace(0, 1, attack),
        np.exp(-np.linspace(0, 2.5, decay))
    ])
    
    if len(envelope) < len(wave_data):
        envelope = np.pad(envelope, (0, len(wave_data) - len(envelope)), 'constant')
    else:
        envelope = envelope[:len(wave_data)]
        
    return wave_data * envelope * volume

# ================= 和弦进行 Cmaj7 -> Am7 -> Fmaj7 -> G6 =================
chords = [
    [48, 55, 60, 64, 67, 71], # Cmaj7
    [45, 52, 57, 60, 64, 67], # Am7
    [41, 48, 53, 57, 60, 64], # Fmaj7
    [43, 50, 55, 59, 62, 64]  # G6
]

chord_duration = 4.0
# 我们多生成 2 秒的尾巴，用于环绕叠加
EXTRA_TAIL = 2.0 
total_audio_duration = LOOP_DURATION + EXTRA_TAIL

audio_data = np.zeros(int(SAMPLE_RATE * total_audio_duration))

for i, chord in enumerate(chords):
    start_time = i * chord_duration
    start_sample = int(start_time * SAMPLE_RATE)
    
    root_note = chord[0]
    root_audio = generate_piano_note(note_to_freq(root_note), chord_duration * 1.2, volume=0.4)
    end_sample = min(start_sample + len(root_audio), len(audio_data))
    audio_data[start_sample:end_sample] += root_audio[:end_sample - start_sample]
    
    for j, note in enumerate(chord[1:]):
        offset = j * 0.2
        note_start_sample = int((start_time + offset) * SAMPLE_RATE)
        note_audio = generate_piano_note(note_to_freq(note), chord_duration * 1.5, volume=0.25)
        end_sample = min(note_start_sample + len(note_audio), len(audio_data))
        audio_data[note_start_sample:end_sample] += note_audio[:end_sample - note_start_sample]

# ================= 核心：无缝循环处理 =================
# 将多出来的 2 秒尾巴，直接叠加到开头的 2 秒上
tail_length_samples = int(EXTRA_TAIL * SAMPLE_RATE)
tail_audio = audio_data[-tail_length_samples:]
audio_data[:tail_length_samples] += tail_audio

# 截断回 16 秒
final_audio_data = audio_data[:int(LOOP_DURATION * SAMPLE_RATE)]

# ================= 后期处理 =================
# 归一化（去除淡入淡出，让声音在边界自然衔接）
max_val = np.max(np.abs(final_audio_data))
if max_val > 0:
    final_audio_data = final_audio_data / max_val * 0.7

# 写入文件
audio_data_int = np.int16(final_audio_data * 32767)
with wave.open("bgm_slow_loop.wav", "w") as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(audio_data_int.tobytes())

print("🎹 无缝循环钢琴曲 bgm_slow_loop.wav 生成成功！")