#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""杀戮尖塔网页版：HTTP 静态服务 + 局域网 PvP WebSocket 中继。

用法：
    python3 server.py
然后局域网内访问：
    http://<本机IP>:8000/index.html
PvP 使用 WebSocket 端口 8765，客户端会自动连接。
"""
import base64
import hashlib
import json
import os
import socket
import struct
import threading
import time
import http.server
import socketserver

HTTP_PORT = 8000
WS_PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- HTTP
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)
    def log_message(self, fmt, *args):
        pass


# ---------------------------------------------------------------- WebSocket
class WebSocket:
    def __init__(self, sock):
        self.sock = sock
        self.buf = b''

    def _recv_exact(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError('closed')
            self.buf += chunk
        data = self.buf[:n]
        self.buf = self.buf[n:]
        return data

    def send_text(self, text):
        payload = text.encode('utf-8')
        header = bytearray([0x81])
        n = len(payload)
        if n < 126:
            header.append(n)
        elif n < 65536:
            header.append(126)
            header += struct.pack('!H', n)
        else:
            header.append(127)
            header += struct.pack('!Q', n)
        self.sock.sendall(bytes(header) + payload)

    def recv_text(self):
        while True:
            b = self._recv_exact(2)
            opcode = b[0] & 0x0f
            masked = b[1] & 0x80
            length = b[1] & 0x7f
            if length == 126:
                length = struct.unpack('!H', self._recv_exact(2))[0]
            elif length == 127:
                length = struct.unpack('!Q', self._recv_exact(8))[0]
            if masked:
                mask = self._recv_exact(4)
            else:
                mask = None
            payload = self._recv_exact(length)
            if mask:
                payload = bytes(x ^ mask[i % 4] for i, x in enumerate(payload))
            if opcode == 0x8:
                return None
            if opcode == 0x1:
                return payload.decode('utf-8')
            # 忽略其它帧，继续循环


class WSConnection:
    def __init__(self, sock):
        self.ws = WebSocket(sock)
        self.room = None
        self.player = 0


ROOMS = {}
ROOM_LOCK = threading.Lock()
CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def gen_code():
    import random
    while True:
        code = ''.join(random.choices(CODE_CHARS, k=4))
        with ROOM_LOCK:
            if code not in ROOMS:
                return code


def send_json(conn, obj):
    try:
        conn.ws.send_text(json.dumps(obj, ensure_ascii=False))
    except Exception:
        pass


def other(conn):
    return 2 if conn.player == 1 else 1


class WSHandler(socketserver.BaseRequestHandler):
    def handle(self):
        conn = None
        try:
            # ---- WebSocket 握手 ----
            req = b''
            while b'\r\n\r\n' not in req:
                chunk = self.request.recv(4096)
                if not chunk:
                    return
                req += chunk
            headers = {}
            for line in req.split(b'\r\n')[1:]:
                if b':' in line:
                    k, v = line.split(b':', 1)
                    headers[k.strip().lower().decode()] = v.strip().decode()
            key = headers.get('sec-websocket-key', '')
            accept = base64.b64encode(hashlib.sha1(
                (key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()
            ).digest()).decode()
            self.request.sendall(
                b'HTTP/1.1 101 Switching Protocols\r\n'
                b'Upgrade: websocket\r\n'
                b'Connection: Upgrade\r\n'
                b'Sec-WebSocket-Accept: ' + accept.encode() + b'\r\n\r\n'
            )
            conn = WSConnection(self.request)
            self._loop(conn)
        except Exception as e:
            print('[ws] error:', e)
        finally:
            if conn is not None and conn.room:
                with ROOM_LOCK:
                    room = ROOMS.get(conn.room)
                    if room and room['clients'][conn.player - 1] is conn:
                        room['clients'][conn.player - 1] = None
                        room['decks'][conn.player - 1] = None
                        if room['clients'][other(conn) - 1]:
                            send_json(room['clients'][other(conn) - 1], {'type': 'opponent_left'})

    def _loop(self, conn):
        while True:
            text = conn.ws.recv_text()
            if text is None:
                return
            try:
                msg = json.loads(text)
                self._route(conn, msg)
            except Exception as e:
                print('[ws] msg error:', e)

    def _route(self, conn, msg):
        typ = msg.get('type')
        if typ == 'create':
            code = gen_code()
            with ROOM_LOCK:
                ROOMS[code] = {'clients': [conn, None], 'decks': [None, None], 'lock': threading.Lock()}
            conn.room = code
            conn.player = 1
            send_json(conn, {'type': 'room', 'code': code, 'player': 1})
            return
        if typ == 'join':
            code = (msg.get('code') or '').upper()
            with ROOM_LOCK:
                room = ROOMS.get(code)
                if not room or room['clients'][1] is not None:
                    send_json(conn, {'type': 'error', 'error': '房间不存在或已满'})
                    return
                room['clients'][1] = conn
                conn.room = code
                conn.player = 2
            send_json(conn, {'type': 'room', 'code': code, 'player': 2})
            send_json(room['clients'][0], {'type': 'opponent_ready'})
            return
        if not conn.room:
            return
        room = ROOMS.get(conn.room)
        if not room:
            return
        if typ == 'ready':
            with room['lock']:
                room['decks'][conn.player - 1] = msg.get('deck', [])
                ready = room['decks'][0] is not None and room['decks'][1] is not None
            if ready:
                send_json(room['clients'][0], {'type': 'battle_start', 'firstPlayer': 1})
                send_json(room['clients'][1], {'type': 'battle_start', 'firstPlayer': 1})
            else:
                o = other(conn)
                if room['clients'][o - 1] is not None:
                    send_json(room['clients'][o - 1], {'type': 'opponent_ready'})
            return
        if typ in ('pvp_snapshot', 'pvp_card', 'turn_end'):
            o = other(conn)
            target = room['clients'][o - 1]
            if target is not None:
                msg['from'] = conn.player
                send_json(target, msg)
            return
        if typ == 'ping':
            send_json(conn, {'type': 'pong'})


def start_ws_server():
    server = socketserver.ThreadingTCPServer(('0.0.0.0', WS_PORT), WSHandler)
    server.allow_reuse_address = True
    print('[ws] PvP WebSocket 监听 %d' % WS_PORT)
    server.serve_forever()


def start_http_server():
    try:
        httpd = http.server.ThreadingHTTPServer(('0.0.0.0', HTTP_PORT), QuietHandler)
        httpd.allow_reuse_address = True
        print('[http] 静态服务  http://0.0.0.0:%d/index.html' % HTTP_PORT)
        httpd.serve_forever()
    except Exception as e:
        print('[http] 启动失败:', e)


if __name__ == '__main__':
    threading.Thread(target=start_http_server, daemon=True).start()
    start_ws_server()
