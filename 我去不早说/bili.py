#!/usr/bin/env python3
"""
bili2mp3.py — 输入BV号，只下音频，转MP3
依赖: pip install yt-dlp  +  ffmpeg
用法: python3 bili2mp3.py BV1xx411c7mD
"""

import sys, os, subprocess, shutil, re

def check_deps():
    if shutil.which('ffmpeg') is None:
        print("❌ 找不到 ffmpeg，请先: pkg install ffmpeg")
        sys.exit(1)
    try:
        import yt_dlp
        return yt_dlp
    except ImportError:
        print("❌ 找不到 yt-dlp，请先: pip install yt-dlp")
        sys.exit(1)

def parse_bv(user_input):
    s = user_input.strip()
    m = re.search(r'[Bb][Vv][0-9A-Za-z]{10}', s)
    if m:
        return 'https://www.bilibili.com/video/' + m.group(0)
    if s.startswith('http'):
        return s
    print(f"❌ 无法识别的输入: {user_input}")
    sys.exit(1)

def sanitize(name):
    name = re.sub(r'[\\/:*?"<>|]', '_', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:100] if len(name) > 100 else name

_last_pct = {'v': -1}

def progress_hook(d):
    if d['status'] == 'downloading':
        pct_str = d.get('_percent_str', '?').strip()
        speed = d.get('_speed_str', '?').strip()
        eta = d.get('_eta_str', '?').strip()
        try:
            pct = float(pct_str.rstrip('%'))
        except ValueError:
            pct = -1
        if int(pct) == _last_pct['v']:
            return
        _last_pct['v'] = int(pct)
        bar_len = 30
        filled = int(bar_len * max(0, pct) / 100)
        bar = '█' * filled + '░' * (bar_len - filled)
        print(f"\r   [{bar}] {pct_str:>6}  {speed:>10}  ETA {eta:>6}",
              end='', flush=True)
    elif d['status'] == 'finished':
        print("\r" + " " * 70, end='\r')
        print("   ✓ 音频流下载完成")

def download_and_extract(bv_input):
    yt_dlp = check_deps()
    url = parse_bv(bv_input)

    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    print(f"📁 输出目录: {here}")
    print(f"🔗 目标链接: {url}\n")

    print("🔍 正在解析视频信息...")
    probe_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'noplaylist': True,
    }
    try:
        with yt_dlp.YoutubeDL(probe_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        print(f"❌ 解析失败: {e}")
        sys.exit(1)

    title = sanitize(info.get('title', 'bilibili_video'))
    uploader = sanitize(info.get('uploader', ''))
    duration = info.get('duration', 0)

    print(f"   标题: {title}")
    if uploader:
        print(f"   UP主: {uploader}")
    if duration:
        m, s = divmod(duration, 60)
        print(f"   时长: {m}分{s}秒")
    print()

    if uploader:
        base = f"{uploader} - {title}"
    else:
        base = title
    base = sanitize(base)

    # ★ 只下载音频流，不下载视频流
    print("⬇️  开始下载音频（仅音频流）...")
    dl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio',
        'outtmpl': f'{base}.%(ext)s',
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
        'progress_hooks': [progress_hook],
    }
    try:
        with yt_dlp.YoutubeDL(dl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"\n❌ 下载失败: {e}")
        sys.exit(1)

    # 找下载的音频文件（可能是 .m4a / .webm / .mp4）
    audio_path = None
    for f in os.listdir(here):
        if f.startswith(base) and not f.endswith('.mp3'):
            if f.endswith(('.m4a', '.webm', '.mp4', '.aac', '.opus')):
                audio_path = os.path.join(here, f)
                break

    if not audio_path:
        print("❌ 找不到下载的音频文件")
        sys.exit(1)

    size_mb = os.path.getsize(audio_path) / 1024 / 1024
    print(f"\n✅ 音频流: {os.path.basename(audio_path)} ({size_mb:.1f} MB)")

    # ── 转 MP3 ──
    print("\n🎵 正在转 MP3...")
    mp3_path = os.path.join(here, f'{base}.mp3')
    cmd = [
        'ffmpeg', '-y',
        '-i', audio_path,
        '-vn',
        '-acodec', 'libmp3lame',
        '-b:a', '192k',
        '-ar', '44100',
        mp3_path
    ]
    try:
        subprocess.run(cmd, check=True,
                       stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as e:
        print(f"❌ MP3 转换失败: {e}")
        sys.exit(1)

    mp3_mb = os.path.getsize(mp3_path) / 1024 / 1024
    print(f"✅ MP3: {os.path.basename(mp3_path)} ({mp3_mb:.1f} MB)")
    print(f"\n🎉 完成，文件在: {here}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 bili2mp3.py <BV号>")
        print("示例: python3 bili2mp3.py BV1xx411c7mD")
        sys.exit(1)
    download_and_extract(sys.argv[1])