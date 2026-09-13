/* ================= ui_combat.js · 战斗界面 ================= */
(function () {
  'use strict';
  const S = window.STS;
  const UI = S.UI;
  const el = S.el, $ = S.$, $$ = S.$$;

  const INTENT = {
    attack: { ico: '⚔️', cls: 'attack' },
    attack_defend: { ico: '⚔️🛡️', cls: 'attack' },
    attack_debuff: { ico: '⚔️⬇️', cls: 'attack' },
    attack_buff: { ico: '⚔️⬆️', cls: 'attack' },
    defend: { ico: '🛡️', cls: 'defend' },
    defend_buff: { ico: '🛡️⬆️', cls: 'buff' },
    defend_debuff: { ico: '🛡️⬇️', cls: 'debuff' },
    buff: { ico: '⬆️', cls: 'buff' },
    debuff: { ico: '⬇️', cls: 'debuff' },
    strong_debuff: { ico: '☠️', cls: 'debuff' },
    unknown: { ico: '❓', cls: 'unknown' },
    sleep: { ico: '💤', cls: 'unknown' },
    stun: { ico: '💫', cls: 'unknown' },
    escape: { ico: '🏃', cls: 'unknown' }
  };

  /* ================= 屏幕切换 ================= */
  UI.show = function (name) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    const s = $('#screen-' + name);
    if (s) s.classList.add('active');
    $('#topbar').classList.toggle('hidden', name === 'title');
    UI.curScreen = name;
  };

  /* ================= 顶栏 ================= */
  UI.renderTop = function () {
    const g = S.game;
    if (!g || !g.char) return;
    $('#tb-char').textContent = g.char.name + (g.ascension ? ' · 进化' + g.ascension : '');
    const pct = Math.max(0, (g.pc.hp / g.pc.maxHp) * 100);
    $('#tb-hp-fill').style.width = pct + '%';
    $('#tb-hp-text').textContent = g.pc.hp + '/' + g.pc.maxHp;
    $('#tb-gold').querySelector('span').textContent = g.gold;
    $('#tb-floor').textContent = S.ACTS[g.act].short + ' · 第 ' + g.floor + ' 层';
    // 遗物
    const rw = $('#tb-relics');
    rw.innerHTML = '';
    g.relics.forEach((id) => {
      const d = S.relics[id];
      if (!d) return;
      const r = el('div', 'relic' + (d.tier === 'boss' ? ' boss' : ''), d.icon || '◆');
      r.setAttribute('data-tip', UI.relicTip(id));
      rw.appendChild(r);
    });
    // 药水
    const pw = $('#tb-potions');
    pw.innerHTML = '';
    for (let i = 0; i < g.potionSlots; i++) {
      const id = g.potions[i];
      const slot = el('div', 'potion-slot' + (id ? ' filled' : ''), id ? (S.potions[id].icon || '🧪') : '');
      if (id) {
        slot.setAttribute('data-tip', UI.potionTip(id));
        slot.addEventListener('click', () => UI.potionMenu(i));
      }
      pw.appendChild(slot);
    }
  };

  UI.potionMenu = function (idx) {
    const g = S.game;
    const id = g.potions[idx];
    const d = S.potions[id];
    if (!d) return;
    const m = g.hasRelic('sacred_bark') ? 2 : 1;
    UI.panel(d.name, '<p>' + d.desc(m) + '</p>', [
      {
        label: '使用', disabled: d.passive || (d.combatOnly && (!g.combat || g.combat.over)),
        onClick: async () => {
          UI.closePanel();
          if (d.target === 'enemy' && g.combat) {
            const t = await UI.pickEnemy();
            if (!t) return;
            await g.usePotion(idx, t);
          } else await g.usePotion(idx, null);
          UI.renderTop();
        }
      },
      { label: '丢弃', onClick: () => { UI.closePanel(); g.discardPotion(idx); UI.renderTop(); } },
      { label: '取消', center: true, onClick: () => UI.closePanel() }
    ]);
  };

  /* 选择敌人（用于药水） */
  UI.pickEnemy = function () {
    return new Promise((resolve) => {
      const cmb = S.game.combat;
      if (!cmb) return resolve(null);
      const live = cmb.enemies();
      if (live.length === 1) return resolve(live[0]);
      UI.toast('选择一个目标');
      UI.targetPicker = (e) => { UI.targetPicker = null; resolve(e); };
    });
  };

  /* ================= 战斗渲染 ================= */
  let curCombat = null;
  UI.startCombatUI = function (cmb) {
    curCombat = cmb;
    $('#battle-bg').style.background = S.ACTS[S.game.act].bg;
    $('#player-art').textContent = S.game.pc.art;
    UI.renderCombat(cmb);
    UI.renderTop();
  };

  UI.renderCombat = function (cmb) {
    if (!cmb) return;
    curCombat = cmb;
    const g = S.game;
    /* --- 敌人 --- */
    const box = $('#enemies');
    const seen = {};
    cmb.enemyList.forEach((e) => {
      let node = box.querySelector('[data-uid="' + e.uid + '"]');
      if (!node) {
        node = el('div', 'creature enemy');
        node.setAttribute('data-uid', e.uid);
        node.innerHTML =
          '<div class="intent"></div>' +
          '<div class="cre-body"><div class="cre-art"></div><div class="cre-block hidden"><i></i><span>0</span></div></div>' +
          '<div class="cre-bar"><div class="hp-bar"><div class="hp-fill"></div><span class="hp-text"></span></div></div>' +
          '<div class="powers"></div>';
        node.addEventListener('click', () => {
          if (UI.targetPicker) { UI.targetPicker(e); return; }
          if (UI.selectedCard) UI.playSelected(e);
        });
        node.addEventListener('mouseenter', () => { UI.hoverEnemy = e; });
        node.addEventListener('mouseleave', () => { if (UI.hoverEnemy === e) UI.hoverEnemy = null; });
        box.appendChild(node);
      }
      seen[e.uid] = 1;
      node.classList.toggle('dead', !!e.dead);
      node.querySelector('.cre-art').textContent = e.art;
      node.querySelector('.cre-art').style.fontSize = (52 + (e.size || 1) * 12) + 'px';
      const hpf = node.querySelector('.hp-fill');
      hpf.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
      node.querySelector('.hp-text').textContent = e.hp + '/' + e.maxHp;
      const blk = node.querySelector('.cre-block');
      blk.classList.toggle('hidden', e.block <= 0);
      blk.querySelector('span').textContent = e.block;
      // 意图
      const it = node.querySelector('.intent');
      it.className = 'intent';
      if (e.dead || cmb.over) { it.innerHTML = ''; }
      else if (g.hasRelic('runic_dome')) { it.innerHTML = '<span class="i-ico">❔</span>'; it.classList.add('unknown'); }
      else it.innerHTML = intentHtml(cmb, e);
      // 能力
      const pw = node.querySelector('.powers');
      pw.innerHTML = '';
      renderPowers(pw, e);
      node.setAttribute('data-tip', enemyTip(e));
    });
    Array.prototype.slice.call(box.children).forEach((n) => {
      if (!seen[n.getAttribute('data-uid')]) n.remove();
    });

    /* --- 玩家 --- */
    const p = cmb.player;
    $('#p-hp-fill').style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
    $('#p-hp-text').textContent = p.hp + '/' + p.maxHp;
    const pb = $('#player-block');
    pb.classList.toggle('hidden', p.block <= 0);
    pb.querySelector('span').textContent = p.block;
    const ppw = $('#player-powers');
    ppw.innerHTML = '';
    renderPowers(ppw, p);

    /* --- HUD --- */
    // 始终以当前行动点上限修正实时重算，避免显示陈旧
    if (cmb.game && cmb.game.energyPerTurn) {
      cmb.energyMax = Math.max(0, cmb.game.energyPerTurn() + (cmb.getPower(cmb.player, 'energy_cap') || 0));
    }
    const orb = $('#energy-orb');
    const ec = $('#energy-cur'), em = $('#energy-max');
    if (cmb._prevEnergy !== undefined && (cmb._prevEnergy !== cmb.energy || cmb._prevMax !== cmb.energyMax)) {
      if (orb) { orb.classList.remove('roll'); void orb.offsetWidth; orb.classList.add('roll'); }
      setTimeout(() => { if (orb) orb.classList.remove('roll'); }, 400);
    }
    cmb._prevEnergy = cmb.energy; cmb._prevMax = cmb.energyMax;
    ec.textContent = cmb.energy;
    em.textContent = cmb.energyMax;
    $('#pile-draw').querySelector('.pile-n').textContent = cmb.drawPile.length;
    $('#pile-discard').querySelector('.pile-n').textContent = cmb.discardPile.length;
    $('#pile-exhaust').querySelector('.pile-n').textContent = cmb.exhaustPile.length;
    $('#end-turn-sub').textContent = '回合 ' + cmb.turn;
    const et = $('#btn-end-turn');
    et.classList.toggle('disabled', cmb.busy || cmb.over);
    et.classList.toggle('ready', !cmb.busy && !cmb.over && cmb.energy === 0);
    if ($('#counter-sub')) $('#counter-sub').textContent = (cmb.pendingCounters || []).length + ' 已布置';

    /* --- 手牌 --- */
    renderHand(cmb);
    UI.renderTop();
  };

  function intentHtml(cmb, e) {
    const mv = e.move;
    if (!mv || !mv.intent) return '';
    const it = mv.intent;
    const info = INTENT[it.type] || INTENT.unknown;
    let s = '<span class="i-ico">' + info.ico + '</span>';
    if (it.type.indexOf('attack') === 0) {
      let base = it.dmgFn ? it.dmgFn(cmb, e) : it.dmg;
      const times = it.timesFn ? it.timesFn(cmb, e) : (it.times || 1);
      const dmg = cmb.calcDamage(e, cmb.player, base, { isAttack: true });
      s += '<b>' + dmg + (times > 1 ? ' × ' + times : '') + '</b>';
    }
    return '<span class="' + info.cls + '" style="display:flex;gap:3px;align-items:center">' + s + '</span>';
  }

  function renderPowers(container, cre) {
    const ids = Object.keys(cre.powers);
    ids.sort((a, b) => {
      const ia = S.POWER_ORDER.indexOf(a), ib = S.POWER_ORDER.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    ids.forEach((id) => {
      const d = S.powers[id];
      if (!d) return;
      const n = cre.powers[id];
      if (n === 0 && !d.noStack) return;
      const e = el('div', 'pw ' + (d.type === 'debuff' ? 'debuff' : 'buff'));
      e.innerHTML = '<span>' + (d.icon || '●') + '</span>' + (d.noStack ? '' : '<b>' + n + '</b>');
      e.setAttribute('data-tip', UI.powerTip(id, n));
      container.appendChild(e);
    });
  }

  function enemyTip(e) {
    let s = '<h5>' + e.name + '</h5>生命：' + e.hp + ' / ' + e.maxHp;
    if (e.block) s += '　格挡：' + e.block;
    if (e.move && e.move.intent && !S.game.hasRelic('runic_dome')) {
      const t = e.move.intent.type;
      const names = {
        attack: '攻击', attack_defend: '攻击并防御', attack_debuff: '攻击并施加负面效果',
        attack_buff: '攻击并强化自身', defend: '防御', buff: '强化', debuff: '施加负面效果',
        strong_debuff: '强力负面效果', unknown: '未知', sleep: '睡眠', stun: '眩晕', escape: '逃跑'
      };
      s += '<div class="tt-kw">意图：' + (names[t] || t) + '</div>';
    }
    return s;
  }

  /* ================= 手牌布局 ================= */
  function renderHand(cmb) {
    const area = $('#hand-area');
    const existing = {};
    Array.prototype.slice.call(area.children).forEach((n) => { existing[n.getAttribute('data-uid')] = n; });
    const frag = [];
    cmb.hand.forEach((c) => {
      let node = existing[c.uid];
      if (node) { node.innerHTML = ''; }
      else {
        node = el('div', 'hand-card');
        node.setAttribute('data-uid', c.uid);
        bindCard(node, c, cmb);
      }
      node.appendChild(UI.cardEl(c, { cmb: cmb }));
      node._card = c;
      const playable = cmb.canPlay(c);
      node.classList.toggle('playable', playable && !cmb.busy);
      node.classList.toggle('unaffordable', !playable);
      node.classList.toggle('selected', UI.selectedCard === c);
      node.classList.toggle('counter-active', cmb.pendingCounters.indexOf(c) >= 0);
      delete existing[c.uid];
      frag.push(node);
    });
    // 弃牌动画：从手牌中移除、且现已进入弃牌堆的牌，飞向弃牌堆圆标
    Object.keys(existing).forEach((k) => {
      const node = existing[k];
      const card = node._card;
      const dead = !cmb.over && card && cmb.discardPile.indexOf(card) >= 0 && cmb.hand.indexOf(card) < 0;
      if (dead) UI.discardFly(node); else node.remove();
    });
    frag.forEach((n) => { if (n.parentNode !== area) area.appendChild(n); });
    layoutHand();
  }

  function layoutHand() {
    const area = $('#hand-area');
    const cards = Array.prototype.slice.call(area.children);
    const n = cards.length;
    const maxW = Math.min(window.innerWidth - 260, 780);
    const spread = n > 1 ? Math.min(96, maxW / n) : 0;
    const total = (n - 1) * spread;
    cards.forEach((c, i) => {
      if (c.classList.contains('dragging')) return;
      const off = i * spread - total / 2;
      const t = n > 1 ? i / (n - 1) - 0.5 : 0;
      const rot = t * Math.min(16, n * 3.2);
      const lift = -(1 - Math.abs(t) * 2) * 8 - 0;
      const base = 'translate(calc(-50% + ' + off.toFixed(1) + 'px), ' + lift.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
      c.dataset.base = base;
      c.style.zIndex = String(10 + i);
      if (!c.classList.contains('hover')) c.style.transform = base;
      else c.style.transform = 'translate(calc(-50% + ' + off.toFixed(1) + 'px), -76px) rotate(0deg) scale(1.16)';
    });
  }
  UI.layoutHand = layoutHand;
  window.addEventListener('resize', () => { if (curCombat) layoutHand(); });

  /* ================= 出牌交互 ================= */
  let drag = null;
  function bindCard(node, card, cmb) {
    node.addEventListener('mouseenter', () => {
      if (drag) return;
      node.classList.add('hover');
      layoutHand();
    });
    node.addEventListener('mouseleave', () => {
      node.classList.remove('hover');
      layoutHand();
    });
    node.addEventListener('pointerdown', (ev) => {
      const c = node._card;
      const cb = curCombat;
      if (!cb || cb.busy || cb.over) return;
      if (!cb.canPlay(c)) { flashCard(node); return; }
      ev.preventDefault();
      if (node.style) node.style.touchAction = 'none';
      drag = {
        node: node, card: c, startX: ev.clientX, startY: ev.clientY, moved: false,
        pointerId: ev.pointerId,
        needTarget: S.cards[c.id].target === 'enemy'
      };
      node.classList.add('dragging');
      node.setPointerCapture && node.setPointerCapture(ev.pointerId);
    });
  }
  document.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    ev.preventDefault();
    const dx = ev.clientX - drag.startX, dy = ev.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    if (drag.needTarget) {
      drag.node.style.transform = drag.node.dataset.base + '';
      showArrow(drag.startX, drag.startY, ev.clientX, ev.clientY);
      highlightTarget(ev.clientX, ev.clientY);
    } else {
      drag.node.style.transform = 'translate(calc(-50% + ' + (drag.startX - window.innerWidth / 2 + dx) + 'px), ' + (dy - 40) + 'px) rotate(0deg) scale(1.05)';
    }
  });
  function endDrag(ev) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!ev) { d.node.classList.remove('dragging'); hideArrow(); clearTargetHighlight(); layoutHand(); return; }
    finishDrag(ev, d);
  }
  document.addEventListener('pointercancel', (ev) => endDrag());
  document.addEventListener('pointerup', (ev) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    finishDrag(ev, d);
  });
  function finishDrag(ev, d) {
    hideArrow();
    d.node.classList.remove('dragging');
    clearTargetHighlight();
    const cmb = curCombat;
    if (!cmb) { layoutHand(); return; }
    if (d.needTarget) {
      const t = enemyAt(ev.clientX, ev.clientY);
      if (t) { doPlay(d.card, t); return; }
      const live = cmb.enemies();
      if (d.moved && live.length === 1 && ev.clientY < window.innerHeight - 200) { doPlay(d.card, live[0]); return; }
      if (!d.moved) {
        if (live.length === 1) { doPlay(d.card, live[0]); return; }
        UI.selectedCard = d.card;
        UI.toast('选择一个目标');
        layoutHand();
        renderSel();
        return;
      }
    } else {
      const threshold = window.innerHeight - 258;
      if (d.moved && ev.clientY < threshold) { doPlay(d.card, null); return; }
      if (!d.moved) { doPlay(d.card, null); return; }
    }
    layoutHand();
  }
  function renderSel() {
    $$('.hand-card').forEach((n) => n.classList.toggle('selected', n._card === UI.selectedCard));
  }
  function flashCard(node) {
    node.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.9)' }, { filter: 'brightness(1)' }], { duration: 240 });
  }
  async function doPlay(card, target) {
    UI.selectedCard = null;
    const cmb = curCombat;
    if (!cmb) return;
    await cmb.playCard(card, target);
    cmb.dirty();
  }
  UI.playSelected = function (enemy) {
    const c = UI.selectedCard;
    UI.selectedCard = null;
    if (c) doPlay(c, enemy);
  };

  function enemyAt(x, y) {
    const els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
    for (const e of els) {
      const n = e && e.closest && e.closest('.creature.enemy');
      if (n) {
        const uid = n.getAttribute('data-uid');
        const t = curCombat.enemyList.find((z) => z.uid === uid && !z.dead);
        if (t) return t;
      }
    }
    // 距离最近的敌人（宽容判定）
    let best = null, bd = 1e9;
    $$('.creature.enemy').forEach((n) => {
      if (n.classList.contains('dead')) return;
      const r = n.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dd = Math.hypot(cx - x, cy - y);
      if (dd < bd) { bd = dd; best = n; }
    });
    if (best && bd < 140) {
      const uid = best.getAttribute('data-uid');
      return curCombat.enemyList.find((z) => z.uid === uid && !z.dead) || null;
    }
    return null;
  }
  function highlightTarget(x, y) {
    clearTargetHighlight();
    const t = enemyAt(x, y);
    if (!t) return;
    const n = $('#enemies').querySelector('[data-uid="' + t.uid + '"]');
    if (n) n.classList.add('targeted');
  }
  function clearTargetHighlight() { $$('.creature.targeted').forEach((n) => n.classList.remove('targeted')); }

  function showArrow(x1, y1, x2, y2) {
    const wrap = $('#target-arrow');
    wrap.classList.remove('hidden');
    const cx = (x1 + x2) / 2 + (x2 - x1) * 0.1;
    const cy = Math.min(y1, y2) - 120;
    $('#arrow-path').setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + cx + ' ' + cy + ' ' + x2 + ' ' + y2);
    const head = $('#arrow-head');
    head.style.left = x2 + 'px';
    head.style.top = y2 + 'px';
    const ang = Math.atan2(y2 - cy, x2 - cx) * 180 / Math.PI + 90;
    head.style.transform = 'rotate(' + ang + 'deg)';
  }
  function hideArrow() { $('#target-arrow').classList.add('hidden'); }

  /* ================= 特效 ================= */
  function creatureEl(cre) {
    if (!cre) return null;
    if (cre.isPlayer) return $('#player-creature');
    return $('#enemies').querySelector('[data-uid="' + cre.uid + '"]');
  }
  UI.floatNum = function (cre, text, cls) {
    const n = creatureEl(cre);
    if (!n) return;
    const r = n.getBoundingClientRect();
    const f = el('div', 'float-num ' + (cls || ''), text);
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top + r.height * 0.3) + 'px';
    $('#fx-layer').appendChild(f);
    setTimeout(() => f.remove(), 1000);
  };
  /** 弃牌动画：把一张从手牌移除的卡飞向弃牌堆圆标后删除 */
  UI.discardFly = function (node) {
    const target = $('#pile-discard');
    let tx, ty;
    if (target) { const r = target.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
    else { ty = window.innerHeight + 60; tx = window.innerWidth / 2; }
    const rect = node.getBoundingClientRect();
    const dx = tx - (rect.left + rect.width / 2);
    const dy = ty - (rect.top + rect.height / 2);
    node.classList.add('discarding');
    const d = node.dataset.base || '';
    node.style.transition = 'transform 0.22s ease-in, opacity 0.22s ease-in';
    requestAnimationFrame(() => {
      node.style.transform = 'translate(calc(-50% + ' + (dx) + 'px), ' + dy + 'px) rotate(8deg) scale(0.55)';
      node.style.opacity = '0';
    });
    setTimeout(() => node.remove(), 230);
  };
  UI.hitFx = function (cre, isAttack) {
    const n = creatureEl(cre);
    if (!n || !isAttack) return;
    const r = n.getBoundingClientRect();
    const f = el('div', 'slash');
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top + r.height * 0.4) + 'px';
    $('#fx-layer').appendChild(f);
    setTimeout(() => f.remove(), 320);
    n.classList.remove('shake');
    void n.offsetWidth;
    n.classList.add('shake');
    setTimeout(() => n.classList.remove('shake'), 320);
  };
  UI.enemyAct = function (e) {
    const n = creatureEl(e);
    if (!n) return;
    n.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 260 });
  };
  UI.shake = function () {
    const s = $('#screen-combat');
    s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
    setTimeout(() => s.classList.remove('shake'), 320);
  };
  let toastTimer = null;
  UI.toast = function (msg) {
    const box = $('#combat-toast');
    const t = el('div', 'ctoast', S.esc(msg));
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 420); }, 1600);
    while (box.children.length > 4) box.firstChild.remove();
  };

  /* ================= 牌堆查看 ================= */
  UI.bindCombatUI = function () {
    $('#btn-end-turn').addEventListener('click', () => {
      const c = curCombat;
      if (c && !c.busy && !c.over) c.endTurn();
    });
    $('#pile-draw').addEventListener('click', () => {
      const c = curCombat; if (!c) return;
      const list = S.game.hasRelic('frozen_eye') ? c.drawPile.slice().reverse() : c.drawPile;
      UI.showCardList('抽牌堆' + (S.game.hasRelic('frozen_eye') ? '（按顺序）' : '（随机顺序）'), list);
    });
    $('#pile-discard').addEventListener('click', () => { const c = curCombat; if (c) UI.showCardList('弃牌堆', c.discardPile); });
    $('#pile-exhaust').addEventListener('click', () => { const c = curCombat; if (c) UI.showCardList('消耗堆', c.exhaustPile); });
    $('#player-creature').addEventListener('click', () => { if (UI.targetPicker) UI.targetPicker(S.game.pc); });
    // 点击空白处取消选中
    $('#screen-combat').addEventListener('pointerdown', (e) => {
      if (!UI.selectedCard) return;
      if (e.target.closest && e.target.closest('.hand-card,.creature')) return;
      UI.selectedCard = null;
      renderSel();
    });
  };
})();
