/* ================= main.js · 入口 ================= */
(function () {
  'use strict';
  const S = window.STS;
  const UI = S.UI;
  const el = S.el, $ = S.$;

  let selectedChar = 'ironclad';

  function buildCharSelect() {
    const box = $('#char-select');
    box.innerHTML = '';
    S.CHARS.forEach((c) => {
      const d = el('div', 'char-card' + (c.id === selectedChar ? ' sel' : ''));
      d.innerHTML = '<div class="cface">' + c.art + '</div><h4>' + c.name + '</h4><p>' + c.desc + '</p>' +
        '<div class="cstat">生命 ' + c.hp + '　金币 ' + c.gold + '　遗物：' + S.relics[c.relic].name + '</div>';
      d.addEventListener('click', () => { selectedChar = c.id; buildCharSelect(); });
      box.appendChild(d);
    });
  }

  function startNew() {
    const seed = $('#seed-input').value.trim();
    const asc = parseInt($('#ascension-input').value, 10) || 0;
    const g = new S.Game();
    S.game = g;
    g.newRun(selectedChar, seed || null, Math.max(0, Math.min(20, asc)));
    UI.show('map');
    UI.renderTop();
    UI.renderMap();
    UI.toast('旅程开始：' + g.char.name + '　种子 ' + g.seedStr);
    UI.showNeow(() => { UI.renderMap(); });
  }

  function continueRun() {
    const data = S.loadSave();
    if (!data) { UI.toast('没有可用的存档'); return; }
    const g = new S.Game();
    S.game = g;
    try {
      g.loadFrom(data);
    } catch (e) {
      console.error(e); UI.toast('存档已损坏'); S.clearSave(); return;
    }
    UI.show('map');
    UI.renderTop();
    UI.renderMap();
    UI.toast('已读取存档 · 第 ' + g.floor + ' 层');
  }

  async function startChallenge() {
    const seed = $('#seed-input').value.trim();
    const asc = parseInt($('#ascension-input').value, 10) || 0;
    // 挑战模式：从所有可用的攻击/技能/能力牌中自选 25 张
    const ids = Object.keys(S.cards).filter((id) => {
      const d = S.cards[id];
      if (d.noPool || d.phantom || d.rarity === 'basic' || d.rarity === 'special') return false;
      if (d.type !== 'attack' && d.type !== 'skill' && d.type !== 'power') return false;
      return true;
    });
    const cards = ids.map((id) => S.makeCard(id));
    const sel = await UI.chooseCards(null, {
      from: cards, n: 25, prompt: '挑战模式：选择 25 张牌作为卡组（可重复选同一张）', upTo: true, mustPick: true, virtual: true, allowDuplicate: true
    });
    if (sel.length !== 25) { UI.toast('挑战模式需要选择 25 张牌'); return; }
    const g = new S.Game();
    S.game = g;
    g.newRun(selectedChar, seed || null, Math.max(0, Math.min(20, asc)));
    g.deck = sel.map((c) => S.makeCard(c.id, c.upg));
    g.flags.challenge = true;
    g.act = 0;
    g.floor = 0;
    g.chosenBoss = {};
    g.save();
    UI.renderTop();
    UI.toast('挑战模式：' + g.char.name + ' 自选卡组，首领连战开始！');
    g.startFight(g.pickBoss());
  }

  function bind() {
    $('#btn-start').addEventListener('click', startNew);
    $('#btn-continue').addEventListener('click', continueRun);
    $('#btn-challenge').addEventListener('click', startChallenge);
    $('#btn-pvp').addEventListener('click', () => { if (S.pvpUI) S.pvpUI.start(); });
    $('#btn-continue').disabled = !S.loadSave();

    $('#btn-deck').addEventListener('click', () => {
      if (!S.game) return;
      UI.showDeckManager();
    });
    $('#btn-map').addEventListener('click', () => {
      if (!S.game) return;
      if (S.game.combat && !S.game.combat.over) { UI.toast('战斗中无法查看地图'); return; }
      UI.closeCardView(); UI.closePanel();
      UI.show('map'); UI.renderMap();
    });
    $('#btn-menu').addEventListener('click', () => {
      const st = S.getStats();
      UI.panel('菜单',
        '<p class="center">当前进度：' + (S.game ? S.ACTS[S.game.act].short + ' 第 ' + S.game.floor + ' 层' : '-') + '</p>' +
        '<p class="center" style="color:#8b8171;font-size:12px">累计挑战 ' + st.runs + ' 次 · 胜利 ' + st.wins + ' 次 · 最深 ' + (st.best || 0) + ' 层</p>',
        [
          { label: '查看遗物', center: true, onClick: () => { UI.closePanel(); showRelics(); } },
          { label: '放弃本次挑战', center: true, onClick: () => { if (S.game) { S.clearSave(); S.game.gameOver(false); } } },
          { label: '关闭', center: true, onClick: () => UI.closePanel() }
        ]);
    });

    document.addEventListener('keydown', (e) => {
      const g = S.game;
      if (e.key === 'Escape') { UI.closeCardView(); UI.closePanel(); return; }
      if (!g) return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (g.combat && !g.combat.busy && !g.combat.over) g.combat.endTurn();
        return;
      }
      if (e.key === 'e' || e.key === 'E') { UI.showDeckManager(); return; }
      if (g.combat && !g.combat.over && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const c = g.combat.hand[idx];
        if (c && g.combat.canPlay(c)) {
          const def = S.cards[c.id];
          const t = def.target === 'enemy' ? g.combat.firstEnemy() : null;
          g.combat.playCard(c, t).then(() => g.combat && g.combat.dirty());
        }
      }
    });
  }

  function showRelics() {
    const g = S.game;
    if (!g) return;
    const body = g.relics.map((id) => {
      const d = S.relics[id];
      return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px">' +
        '<div style="font-size:22px">' + d.icon + '</div><div><b class="gold-t">' + d.name + '</b>' +
        '<div style="font-size:12px;color:#9d9280">' + d.desc + '</div></div></div>';
    }).join('') || '<p class="center">你还没有任何遗物。</p>';
    UI.panel('遗物（' + g.relics.length + '）', body, [{ label: '关闭', center: true, onClick: () => UI.closePanel() }]);
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    // 全局错误上报（便于排查）
    window.__stsErrors = [];
    function report(msg) {
      window.__stsErrors.push(String(msg));
      try { document.body.setAttribute('data-jserr', window.__stsErrors.slice(0, 6).join(' ｜ ')); } catch (e) { }
      if (UI && UI.toast) UI.toast('脚本错误：' + String(msg).slice(0, 80));
    }
    window.addEventListener('error', (e) => report(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
    window.addEventListener('unhandledrejection', (e) => report('Promise: ' + ((e.reason && e.reason.message) || e.reason)));

    buildCharSelect();
    bind();
    UI.bindTips();
    UI.bindCombatUI();
    UI.show('title');
    console.log('[杀戮尖塔 Web] 卡牌 ' + Object.keys(S.cards).length +
      ' 张 · 遗物 ' + Object.keys(S.relics).length +
      ' 个 · 药水 ' + Object.keys(S.potions).length +
      ' 种 · 敌人 ' + Object.keys(S.enemies).length +
      ' 种 · 事件 ' + Object.keys(S.events).length + ' 个');

    /* 开发用：?auto=1 直接开局，&combat=1 进入首个战斗，&play=1 自动战斗 */
    window.__stsDev = { startNew: startNew, continueRun: continueRun, autoPlay: autoPlay };
    const q = location.search;
    if (/[?&]auto/.test(q)) {
      const m = q.match(/char=(\w+)/);
      if (m) selectedChar = m[1];
      setTimeout(() => {
        startNew();
        UI.closePanel();   // 跳过尼奥的祝福
        if (/[?&]combat/.test(q)) {
          setTimeout(() => {
            const g = S.game;
            const n = g.availableNodes()[0];
            if (n) g.enterNode(n);
            if (/[?&]play/.test(q)) setTimeout(autoPlay, 200);
          }, 60);
        }
        if (/[?&]geom/.test(q)) setTimeout(dumpGeom, 1400);
      }, 30);
    }
  });

  /** 布局量测（调试用）：把关键元素的位置写入 body[data-geom] */
  function dumpGeom() {
    const sel = ['#topbar', '#enemies', '#player-creature', '#energy-orb', '#btn-end-turn',
      '#pile-draw', '#pile-discard', '#hand-area', '#map-canvas',
      '.hand-card:first-child', '.hand-card:last-child',
      '.creature.enemy:first-child .intent', '.creature.enemy:last-child'];
    const out = { win: [window.innerWidth, window.innerHeight] };
    sel.forEach((s) => {
      const e = document.querySelector(s);
      if (!e) return;
      const r = e.getBoundingClientRect();
      out[s] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    });
    document.body.setAttribute('data-geom', JSON.stringify(out));
  }

  /** 自动战斗（调试用） */
  function autoPlay() {
    const step = () => {
      const g = S.game;
      const c = g && g.combat;
      if (!c || c.over) return;
      if (c.busy) { setTimeout(step, 120); return; }
      const playable = c.hand.filter((x) => c.canPlay(x));
      if (playable.length) {
        const card = playable[0];
        const t = S.cards[card.id].target === 'enemy' ? c.firstEnemy() : null;
        c.playCard(card, t).then(() => { c.dirty(); setTimeout(step, 160); });
      } else {
        c.endTurn().then(() => setTimeout(step, 160));
      }
    };
    step();
  }
})();
