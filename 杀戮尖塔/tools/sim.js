/* 无头模拟器：加载引擎与数据，自动跑局，捕获运行时错误 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'js/util.js', 'js/powers.js',
  'js/data/cards_ironclad.js', 'js/data/cards_silent.js', 'js/data/cards_colorless.js',
  'js/data/cards_expansion.js',
  'js/data/relics.js', 'js/data/potions.js',
  'js/data/enemies_act1.js', 'js/data/enemies_act2.js', 'js/data/enemies_act3.js',
  'js/data/encounters.js', 'js/data/events.js',
  'js/combat.js', 'js/map.js', 'js/game.js'
];

/* ---- 极简环境 ---- */
const store = {};
const sandbox = {
  console: console,
  setTimeout: setTimeout, clearTimeout: clearTimeout,
  Math: Math, Date: Date, JSON: JSON,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  document: {
    createElement: () => ({ className: '', innerHTML: '', style: {}, appendChild() { }, setAttribute() { }, addEventListener() { }, classList: { add() { }, remove() { }, toggle() { } } }),
    createElementNS: () => ({ setAttribute() { }, classList: { add() { } } }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => { }
  },
  window: null
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

const errors = [];
FILES.forEach((f) => {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try { vm.runInContext(code, ctx, { filename: f }); }
  catch (e) { errors.push('加载 ' + f + ' 失败: ' + e.message); }
});
if (errors.length) { errors.forEach((e) => console.error(e)); process.exit(1); }

const S = sandbox.STS;
S.wait = () => Promise.resolve();

/* ---- UI 桩 ---- */
let roomDone = false, gameEnded = null;
const logs = [];
S.UI = {
  show() { }, renderTop() { }, renderMap() { }, renderCombat() { }, startCombatUI() { },
  floatNum() { }, hitFx() { }, enemyAct() { }, shake() { }, layoutHand() { },
  toast(m) { logs.push(m); },
  panel() { }, closePanel() { }, closeCardView() { }, showCardList() { },
  chooseCards(cmb, opts) {
    const list = (opts.from || []).slice();
    if (opts.canSkip && !opts.mustPick && Math.random() < 0.25) return Promise.resolve([]);
    return Promise.resolve(list.slice(0, Math.max(0, Math.min(opts.n || 1, list.length))));
  },
  chooseOption() { return Promise.resolve(0); },
  showActIntro() { roomDone = true; },
  showGameOver(win) { gameEnded = win ? 'win' : 'lose'; roomDone = true; },
  showTreasure() { const g = S.game; g.gainRandomRelic('common'); roomDone = true; },
  showShop() { roomDone = true; },
  showRest() { const g = S.game; g.healPlayer(Math.floor(g.pc.maxHp * 0.3)); roomDone = true; },
  showEvent(evt) {
    const g = S.game;
    const opts = evt.options(g).filter((o) => !o.disabled);
    const o = opts[Math.floor(Math.random() * opts.length)];
    Promise.resolve()
      .then(() => o.act(g))
      .then((res) => { if (res !== null && res !== undefined) roomDone = true; })
      .catch((e) => { errors.push('事件 ' + evt.name + ' 出错: ' + e.stack); roomDone = true; });
  },
  showRewards(rewards, isBoss) {
    const g = S.game;
    rewards.forEach((r) => {
      try {
        if (r.type === 'gold') g.gainGold(r.amount);
        else if (r.type === 'potion') g.gainRandomPotion();
        else if (r.type === 'relic') { if (r.id) g.gainRelic(r.id); else g.gainRandomRelic(r.tier); }
        else if (r.type === 'boss_relic') { const l = g.bossRelicChoices(); if (l.length) g.gainRelic(l[0]); }
        else if (r.type === 'card') { if (r.cards.length && Math.random() < 0.85) g.addCardToDeck(r.cards[0].id, r.cards[0].upg); }
      } catch (e) { errors.push('奖励 ' + r.type + ' 出错: ' + e.stack); }
    });
    if (isBoss) { g.flags.wantHeart = true; g.nextAct(); }
    else roomDone = true;
  }
};

/* ---- 自动战斗 ---- */
const GOD = process.argv.indexOf('god') >= 0;
const SMART = process.argv.indexOf('smart') >= 0;

/** 预计本回合会受到的伤害 */
function incoming(cmb) {
  let t = 0;
  cmb.enemies().forEach((e) => {
    const it = e.move && e.move.intent;
    if (!it || it.type.indexOf('attack') !== 0) return;
    const base = it.dmgFn ? it.dmgFn(cmb, e) : it.dmg;
    const times = it.timesFn ? it.timesFn(cmb, e) : (it.times || 1);
    t += cmb.calcDamage(e, cmb.player, base, { isAttack: true }) * times;
  });
  return t;
}
/** 启发式排序：受威胁时优先技能（防御），否则优先攻击 */
function orderHand(cmb) {
  const threat = incoming(cmb) - cmb.player.block;
  const hand = cmb.hand.slice();
  return hand.sort((a, b) => score(b) - score(a));
  function score(c) {
    const d = S.cards[c.id];
    const cost = cmb.cost(c);
    let s = 0;
    if (d.type === 'power') s += 60;
    if (d.type === 'skill') s += threat > 0 ? 50 : 10;
    if (d.type === 'attack') s += threat > 0 ? 20 : 45;
    if (cost === 0) s += 15;
    if (d.rarity === 'rare') s += 6;
    return s + Math.random() * 8;
  }
}
async function runCombat(g) {
  const cmb = g.combat;
  let guard = 0;
  while (cmb && !cmb.over && guard++ < 400) {
    if (GOD) { g.pc.hp = g.pc.maxHp; if (!cmb.player.powers.strength || cmb.player.powers.strength < 12) cmb.addPower(cmb.player, 'strength', 12); }
    let played = true, inner = 0;
    while (played && !cmb.over && inner++ < 40) {
      played = false;
      const hand = SMART ? orderHand(cmb) : cmb.hand.slice().sort(() => Math.random() - 0.5);
      for (const c of hand) {
        if (cmb.over) break;
        if (!cmb.canPlay(c)) continue;
        const def = S.cards[c.id];
        let t = null;
        if (def.target === 'enemy') {
          const l = cmb.enemies();
          t = SMART ? l.reduce((a, b) => (a.hp <= b.hp ? a : b)) : l[Math.floor(Math.random() * l.length)];
        }
        await cmb.playCard(c, t);
        played = true;
        break;
      }
    }
    // 偶尔喝药
    if (g.potions.length && Math.random() < 0.25) {
      const idx = Math.floor(Math.random() * g.potions.length);
      const d = S.potions[g.potions[idx]];
      if (d && !d.passive && !(d.combatOnly && !g.combat)) {
        let t = null;
        if (d.target === 'enemy') { const l = cmb.enemies(); t = l[0]; }
        try { await g.usePotion(idx, t); } catch (e) { errors.push('药水 ' + d.name + ' 出错: ' + e.stack); }
      }
    }
    if (cmb.over) break;
    await cmb.endTurn();
    if (cmb.turn > 200) { errors.push('战斗超时: ' + cmb.enc.name); break; }
  }
  // 等待结算 setTimeout
  await new Promise((r) => setTimeout(r, 30));
  fightLog.push({ enc: cmb.enc.name, turns: cmb.turn, lost: cmb.hpLostCombat, won: cmb.won });
}
const fightLog = [];

async function runOne(charId, seed) {
  const g = new S.Game();
  S.game = g;
  g.noSave = true;
  g.newRun(charId, seed, 0);
  if (GOD) { g.pc.maxHp = 9999; g.pc.hp = 9999; g.gold = 9999; }
  gameEnded = null;
  let floors = 0;
  while (!gameEnded && floors++ < 100) {
    const avail = g.availableNodes();
    if (!avail.length) {
      if (g.curNode && g.curNode.row === 14) { roomDone = false; g.enterNode(g.map.boss); }
      else break;
    } else {
      roomDone = false;
      const node = avail[Math.floor(Math.random() * avail.length)];
      g.enterNode(node);
    }
    if (g.combat) await runCombat(g);
    // 等待房间结束（事件里可能又开战）
    let w = 0;
    while (!roomDone && !gameEnded && w++ < 60) {
      await new Promise((r) => setTimeout(r, 5));
      if (g.combat) { await runCombat(g); }
    }
    if (g.pc.hp <= 0) break;
  }
  return { act: g.act, floor: g.floor, hp: g.pc.hp, maxHp: g.pc.maxHp, deck: g.deck.length, relics: g.relics.length, end: gameEnded };
}

(async () => {
  process.on('unhandledRejection', (e) => { errors.push('未处理的 Promise 拒绝: ' + (e && e.stack || e)); });

  /* ---- 存档往返测试 ---- */
  try {
    const g = new S.Game();
    S.game = g;
    g.newRun('ironclad', 'savetest', 0);
    g.gainRelic('anchor'); g.gainRandomPotion(); g.addCardToDeck('bash', 1);
    const first = g.map.rows[0][0];
    g.curNode = first; first.visited = true; g.floor = 1;
    g.save();
    const data = S.loadSave();
    if (!data) throw new Error('存档为空');
    const g2 = new S.Game();
    g2.loadFrom(data);
    const ok = g2.deck.length === g.deck.length &&
      g2.relics.length === g.relics.length &&
      g2.potions.length === g.potions.length &&
      Object.keys(g2.map.nodes).length === Object.keys(g.map.nodes).length &&
      g2.curNode && g2.curNode.id === g.curNode.id &&
      g2.map.boss.prev.length === g.map.boss.prev.length &&
      g2.pc.hp === g.pc.hp;
    console.log(ok ? '存档往返测试：✅ 通过' : '存档往返测试：❌ 数据不一致');
    if (!ok) {
      errors.push('存档往返不一致: deck ' + g.deck.length + '/' + g2.deck.length +
        ' relic ' + g.relics.length + '/' + g2.relics.length +
        ' nodes ' + Object.keys(g.map.nodes).length + '/' + Object.keys(g2.map.nodes).length +
        ' node ' + g.curNode.id + '/' + (g2.curNode && g2.curNode.id));
    }
    // 可用节点应一致
    if (g.availableNodes().length !== g2.availableNodes().length) errors.push('存档后可前往节点数不一致');
  } catch (e) { errors.push('存档往返测试崩溃: ' + e.stack); }

  const N = parseInt(process.argv[2] || '6', 10);
  const results = [];
  for (let i = 0; i < N; i++) {
    const charId = i % 2 === 0 ? 'ironclad' : 'silent';
    try {
      const r = await runOne(charId, 'sim' + i);
      results.push(charId + ' → 幕' + (r.act + 1) + ' 层' + r.floor + ' HP' + r.hp + '/' + r.maxHp +
        ' 牌' + r.deck + ' 遗物' + r.relics + ' ' + (r.end || '中断'));
    } catch (e) {
      errors.push('跑局 ' + i + ' 崩溃: ' + e.stack);
    }
  }
  console.log('\n=== 模拟结果 ===');
  results.forEach((r) => console.log('  ' + r));
  console.log('\n卡牌 ' + Object.keys(S.cards).length + ' / 遗物 ' + Object.keys(S.relics).length +
    ' / 药水 ' + Object.keys(S.potions).length + ' / 敌人 ' + Object.keys(S.enemies).length +
    ' / 事件 ' + Object.keys(S.events).length);
  // 战斗统计
  const agg = {};
  fightLog.forEach((f) => {
    const a = (agg[f.enc] = agg[f.enc] || { n: 0, lost: 0, turns: 0, lose: 0 });
    a.n++; a.lost += f.lost; a.turns += f.turns; if (!f.won) a.lose++;
  });
  console.log('\n=== 战斗损耗（平均掉血 / 平均回合 / 失败次数）===');
  Object.keys(agg).sort((a, b) => agg[b].lost / agg[b].n - agg[a].lost / agg[a].n).forEach((k) => {
    const a = agg[k];
    console.log('  ' + k.padEnd(14, '　') + ' ×' + String(a.n).padStart(3) +
      '  掉血 ' + (a.lost / a.n).toFixed(1).padStart(5) +
      '  回合 ' + (a.turns / a.n).toFixed(1).padStart(4) +
      '  失败 ' + a.lose);
  });
  if (errors.length) {
    console.log('\n=== 错误 ' + errors.length + ' 条 ===');
    const uniq = {};
    errors.forEach((e) => { const k = e.split('\n')[0]; uniq[k] = (uniq[k] || 0) + 1; });
    Object.keys(uniq).slice(0, 40).forEach((k) => console.log('  x' + uniq[k] + ' ' + k));
    console.log('\n首个完整堆栈:\n' + errors[0]);
    process.exit(1);
  }
  console.log('\n✅ 无运行时错误');
})();
