/* ================= pvp.js · 局域网实时对战与反制 ================= */
(function () {
  'use strict';
  const S = window.STS, UI = S.UI;

  /* ---------- PvP 对手敌人定义 ---------- */
  S.defEnemy('pvp_opponent', {
    name: '对手', art: '🎭', hp: [100, 100],
    nextMove: () => 'idle',
    moves: { idle: { intent: { type: 'unknown' }, act: () => { } } }
  });

  function publicEntity(e) {
    return { hp: e.hp, maxHp: e.maxHp, block: e.block, powers: Object.assign({}, e.powers) };
  }
  function applyEntity(dst, src) {
    if (!dst || !src) return;
    dst.hp = src.hp;
    dst.maxHp = src.maxHp;
    dst.block = src.block;
    dst.powers = Object.assign({}, src.powers);
  }

  class PvpClient {
    constructor(ws) {
      this.ws = ws;
      this.room = null;
      this.playerNo = 0;
      this.combat = null;
      this.opponentName = '对手';
      ws.addEventListener('message', (ev) => this.onMessage(JSON.parse(ev.data)));
      ws.addEventListener('close', () => { UI.toast('PvP 连接已断开'); });
    }
    send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }

    onMessage(msg) {
      if (msg.type === 'room') {
        this.room = msg.code;
        this.playerNo = msg.player;
        UI.closePanel();
        UI.panel('局域网对战', '<p class="center">房间：<b style="font-size:22px">' + msg.code + '</b>' +
          '<br>你是玩家 ' + msg.player + '，等待对方选择卡组…</p>',
          [{ label: '选择 30 张卡组', center: true, onClick: () => { UI.closePanel(); this.chooseDeck(); } }]);
        return;
      }
      if (msg.type === 'opponent_ready') {
        UI.toast('对手已选好卡组');
        return;
      }
      if (msg.type === 'opponent_left') {
        UI.toast('对手已离开房间');
        UI.closePanel();
        return;
      }
      if (msg.type === 'battle_start') {
        UI.closePanel();
        this.startBattle(msg.firstPlayer);
        return;
      }
      if (!this.combat) return;
      if (msg.type === 'pvp_snapshot') {
        const foe = this.combat.enemyList[0];
        applyEntity(foe, msg.p);
        applyEntity(this.combat.player, msg.e);
        if (this.combat.player.hp <= 0 && !this.combat.over) {
          this.combat.over = true;
          this.combat.won = false;
          this.combat.busy = false;
          this.combat.dirty();
          this.onBattleEnd(this.combat);
          return;
        }
        this.combat.dirty();
        return;
      }
      if (msg.type === 'pvp_card') {
        this.onOpponentCard(msg);
        return;
      }
      if (msg.type === 'turn_end') {
        if (this.combat && this.combat.isPvp && !this.combat.pvpActive && !this.combat.over) {
          this.combat.pvpActive = true;
          this.combat.startTurn();
        }
      }
    }

    chooseDeck() {
      const ids = Object.keys(S.cards).filter((id) => {
        const d = S.cards[id];
        if (d.noPool || d.phantom || d.rarity === 'basic' || d.rarity === 'special') return false;
        if (d.type !== 'attack' && d.type !== 'skill' && d.type !== 'power') return false;
        return true;
      });
      const cards = ids.map((id) => S.makeCard(id));
      UI.chooseCards(null, {
        from: cards, n: 30, prompt: 'PvP：选择 30 张牌作为卡组', upTo: true, mustPick: true, virtual: true
      }).then((sel) => {
        if (sel.length !== 30) { UI.toast('请选择 30 张牌'); return; }
        this.deck = sel.map((c) => ({ id: c.id, upg: c.upg }));
        this.send({ type: 'ready', deck: this.deck });
        UI.panel('已就绪', '<p class="center">卡组已选定，等待对手开始…</p>', [{ label: '返回标题', center: true, onClick: () => UI.closePanel() }]);
      });
    }

    startBattle(firstPlayer) {
      const g = new S.Game();
      S.game = g;
      g.newRun('ironclad', null, 0);
      g.deck = (this.deck || []).map((c) => S.makeCard(c.id, c.upg));
      g.relics = [];
      g.potions = [];
      g.flags.pvp = true;
      g.char.name = '玩家' + this.playerNo;
      g.pc.maxHp = 100;
      g.pc.hp = 100;
      g.pc.name = '玩家' + this.playerNo;
      const enc = { name: '玩家对战', pvp: true, enemies: [{ id: 'pvp_opponent', hp: 100 }] };
      const cmb = new S.Combat(g, enc);
      this.combat = cmb;
      cmb.pvpActive = firstPlayer === this.playerNo;
      cmb.setup();
      UI.show('combat');
      UI.startCombatUI(cmb);
      UI.toast('PvP 开始！你是玩家' + this.playerNo + (cmb.pvpActive ? '，先手回合' : '，等待对手回合'));
      if (cmb.pvpActive) cmb.startTurn();
    }

    /* 本地行动后同步公开状态 */
    sendSnapshot(cmb) {
      const foe = cmb.enemyList[0];
      this.send({
        type: 'pvp_snapshot',
        p: publicEntity(cmb.player),
        e: publicEntity(foe),
        counts: {
          hand: cmb.hand.length, draw: cmb.drawPile.length,
          discard: cmb.discardPile.length, exhaust: cmb.exhaustPile.length,
          energy: cmb.energy, energyMax: cmb.energyMax
        }
      });
    }

    sendCardPlayed(cmb, card, def) {
      const v = S.cardVals(card);
      let desc = '';
      try { desc = def.desc ? def.desc(v, { d: () => v, n: (k) => v[k] }, card) : ''; } catch (e) { desc = ''; }
      const extraDraw = !!(v.draw || def.base.draw) || /抽/.test(desc);
      this.send({ type: 'pvp_card', kind: def.type, extraDraw: extraDraw, power: def.type === 'power', card: card.id, upg: card.upg });
    }

    sendTurnEnd(cmb) {
      this.sendSnapshot(cmb);
      this.send({ type: 'turn_end' });
    }

    onBattleEnd(cmb) {
      const win = !!(cmb && cmb.won);
      if (cmb && cmb.game && cmb.game.flags.pvp) {
        UI.panel(win ? '🏆 你赢了' : '💀 你输了',
          '<p class="center">' + (win ? '对手生命归零，你赢得了这场 PvP！' : '你的生命归零，对手获胜。') + '</p>',
          [{ label: '返回标题', center: true, onClick: () => location.reload() }]);
      }
    }

    /* 收到对手打出卡牌：触发己方隐藏反制 */
    onOpponentCard(msg) {
      const cmb = this.combat;
      if (!cmb || !cmb.isPvp || cmb.pvpActive) return;
      const info = { kind: msg.kind, extraDraw: !!msg.extraDraw };
      const used = [];
      cmb.pendingCounters.slice().forEach((c) => {
        const d = S.cards[c.id];
        if (d && d.counterPlay && d.counterPlay(cmb, c, cmb.enemyList[0], info)) used.push(c);
      });
      used.forEach((c) => {
        const i = cmb.pendingCounters.indexOf(c);
        if (i >= 0) cmb.pendingCounters.splice(i, 1);
        cmb.discardCard(c);
      });
      if (used.length) {
        UI.toast('反制触发！');
        this.sendSnapshot(cmb);
      }
      this.showOppCard(msg);
    }

    showOppCard(msg) {
      if (!msg.card || !S.cards[msg.card]) return;
      const holder = document.getElementById('player-creature');
      const fx = document.getElementById('fx-layer');
      if (!holder || !fx) return;
      const r = holder.getBoundingClientRect();
      const card = S.makeCard(msg.card, msg.upg);
      const fly = document.createElement('div');
      fly.className = 'pvp-card-fly';
      fly.style.left = (r.left + r.width / 2 - 55) + 'px';
      fly.style.top = (r.top - 170) + 'px';
      fly.appendChild(UI.cardEl(card, { noPreview: true }));
      fx.appendChild(fly);
      setTimeout(() => fly.remove(), 1000);
    }

    /* 设置一张隐藏反制 */
    async setCounter() {
      const cmb = this.combat;
      if (!cmb || !cmb.isPvp || cmb.over) return;
      if (!cmb.pvpActive) { UI.toast('只能在你的回合设置反制'); return; }
      const pool = cmb.hand.filter((c) => S.cards[c.id].counter);
      if (!pool.length) { UI.toast('手牌中没有反制牌'); return; }
      const sel = await UI.chooseCards(cmb, { from: pool, n: 1, prompt: '选择一张反制牌（敌方不可见）' });
      if (!sel[0]) return;
      const i = cmb.hand.indexOf(sel[0]);
      if (i >= 0) cmb.hand.splice(i, 1);
      cmb.pendingCounters.push(sel[0]);
      cmb.dirty();
      UI.toast('反制已布置');
    }
  }

  /* ---------- 大厅入口 ---------- */
  function openLobby() {
    if (S.pvpClient && S.pvpClient.ws && S.pvpClient.ws.readyState === 1) {
      UI.toast('已连接 PvP 服务'); return;
    }
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = proto + '//' + location.hostname + ':8765';
    UI.panel('局域网对战', '<p class="center">正在连接 ' + url + ' …</p>', []);
    UI.toast('请先运行 python3 server.py 启动局域网服务');
    let ws;
    try { ws = new WebSocket(url); }
    catch (e) { UI.toast('WebSocket 不受支持：' + e.message); return; }
    const client = new PvpClient(ws);
    S.pvpClient = client;
    ws.onopen = () => {
      UI.closePanel();
      UI.panel('局域网对战',
        '<p class="center">已连接到 PvP 服务。创建房间或输入房间号加入。</p>' +
        '<div class="pvp-row"><input id="pvp-code" placeholder="房间号" style="width:140px"><button class="big-btn" id="pvp-join">加入</button></div>',
        [
          { label: '创建房间', center: true, onClick: () => { UI.closePanel(); client.send({ type: 'create' }); } },
          { label: '关闭', center: true, onClick: () => UI.closePanel() }
        ]);
      const join = document.getElementById('pvp-join');
      if (join) join.addEventListener('click', () => {
        const code = document.getElementById('pvp-code').value.trim().toUpperCase();
        if (code) { UI.closePanel(); client.send({ type: 'join', code: code }); }
      });
    };
    ws.onerror = () => UI.toast('连接失败：请确认 server.py 已运行');
  }

  S.pvpUI = { start: openLobby };
  S.pvpClient = null;

  /* 反制按钮 */
  function bindCounterButton() {
    const b = document.getElementById('btn-counter');
    if (!b) return;
    b.addEventListener('click', () => {
      const c = S.pvpClient && S.pvpClient.combat;
      if (S.pvpClient) S.pvpClient.setCounter();
      else if (S.game && S.game.combat && S.game.combat.pendingCounters) {
        // PvE 也可布置反制
        setPveCounter(S.game.combat);
      }
    });
    function setPveCounter(cmb) {
      if (!cmb || cmb.over || cmb.busy) return;
      const pool = cmb.hand.filter((x) => S.cards[x.id].counter);
      if (!pool.length) { UI.toast('手牌中没有反制牌'); return; }
      UI.chooseCards(cmb, { from: pool, n: 1, prompt: '选择一张反制牌' }).then((sel) => {
        if (!sel[0]) return;
        const i = cmb.hand.indexOf(sel[0]);
        if (i >= 0) cmb.hand.splice(i, 1);
        cmb.pendingCounters.push(sel[0]);
        cmb.dirty();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindCounterButton);
  else bindCounterButton();
})();
