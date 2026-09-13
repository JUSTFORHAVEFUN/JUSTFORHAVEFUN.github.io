/* ================= cards_expansion.js · 扩展包：自炸 / 电表倒转 / 跳槽 / 回血 / 过牌 / 开发 =================
 * 新卡统一使用 neutral 颜色，可在铁甲战士与静默猎手的普通卡池中出现。
 * 新增能力：
 *   energy_cap        行动点上限修正（可为负）
 *   energy_cap_regen  自炸体系特性：上限不满 4 时每回合恢复 1 点
 *   overclock         每回合开始时获得额外当前行动点（可超过上限）
 *   overclock_hp      低血量时每回合获得额外行动点
 *   meter_energy      受到伤害时获得行动点
 */
(function () {
  'use strict';
  const S = window.STS, C = S.defCard;
  const N = 'neutral';

  /* ---------- 通用工具 ---------- */
  function refreshCap(g) {
    if (g.energyMax !== undefined) {
      g.energyMax = g.game.energyPerTurn() + (g.getPower(g.player, 'energy_cap') || 0);
      if (g.energyMax < 0) g.energyMax = 0;
      if (g.energy > g.energyMax) g.energy = g.energyMax;
    }
    g.dirty();
  }
  function cap(g, n) {
    if (n > 0) g.addPower(g.player, 'energy_cap', n);
    else if (n < 0) g.addPower(g.player, 'energy_cap', n);
    refreshCap(g);
  }
  function reduceCap(g, n) {
    g.addPower(g.player, 'energy_cap', -n);
    g.toast('行动点上限 -' + n);
    refreshCap(g);
  }
  /* 全卡池开发：从「全部卡牌」中返回可开发的卡牌 id 列表。
   * 与普通卡池不同，这里包含基础牌 / 特殊牌 / 诅咒 / 状态牌 / 不计池牌 / 幻影牌，
   * 真正做到从整个牌池中随机抽取。 */
  function poolDevPool(g, filter) {
    return Object.keys(S.cards).filter((id) => {
      const d = S.cards[id];
      if (filter && !filter(d, id)) return false;
      return true;
    });
  }
  /* 自己卡组开发：返回当前战斗中的实际牌实例（手牌/抽牌堆/弃牌堆） */
  function deckDevPool(g, filter) {
    return g.deckAll().filter((c) => {
      const d = S.cards[c.id];
      if (!d || d.noPool || d.rarity === 'basic' || d.rarity === 'special') return false;
      if (d.type !== 'attack' && d.type !== 'skill' && d.type !== 'power') return false;
      if (d.color === 'curse' || d.color === 'status') return false;
      if (filter && !filter(d, c.id)) return false;
      return true;
    });
  }
  /* 开发·卡组（非复制）：不消耗，未选中的回弃牌堆，选中的进手牌 */
  async function doDeckDev(g, filter, prompt) {
    const pool = deckDevPool(g, filter);
    if (!pool.length) { g.toast('卡组中没有可开发的牌'); return; }
    const three = g.game.rng.sample(pool, Math.min(3, pool.length));
    const sel = await S.UI.chooseCards(g, {
      from: three, n: 1, prompt: prompt || '开发·卡组：选择一张牌加入手牌', canSkip: true
    });
    if (!sel[0]) return;
    three.forEach((c) => {
      if (c === sel[0]) {
        if (g.hand.indexOf(c) < 0 && !c.phantom) g.moveCard(c, 'hand');
      } else if (!c.phantom) {
        // 未选中的回到弃牌堆
        g.moveCard(c, 'discard');
      }
    });
    g.toast('开发·卡组获得：' + S.cardName(sel[0]));
  }
  /* 开发·卡组复制：选中的加入手牌（临时复制），未选中的复制视为消耗 */
  async function doDeckCopy(g, filter, prompt) {
    const pool = deckDevPool(g, filter);
    if (!pool.length) { g.toast('卡组中没有可复制的牌'); return; }
    const three = g.game.rng.sample(pool, Math.min(3, pool.length));
    const cards = three.map((c) => S.makeCard(c.id, c.upg));
    const sel = await S.UI.chooseCards(g, {
      from: cards, n: 1, prompt: prompt || '开发·复制：选择一张牌加入手牌', virtual: true, canSkip: true
    });
    if (sel[0]) {
      const copy = g.addCardTo(sel[0].id, 'hand', { upg: sel[0].upg })[0];
      if (copy) { copy.temp = true; copy.phantom = true; }
      g.toast('复制获得：' + S.cardName(sel[0]));
    }
    // 未选中的两张复制视为被消耗，不加入任何牌堆
  }
  /* 开发·全卡池：选中的具有幻影，未选中的不属于你，直接消耗 */
  async function doPoolDev(g, filter, prompt) {
    const pool = poolDevPool(g, filter);
    if (!pool.length) { g.toast('没有可开发的牌'); return; }
    const three = g.game.rng.sample(pool, Math.min(3, pool.length)).map((id) => S.makeCard(id));
    const sel = await S.UI.chooseCards(g, {
      from: three, n: 1, prompt: prompt || '开发·全卡池：选择一张牌加入手牌', virtual: true, canSkip: true
    });
    if (sel[0]) {
      const copy = g.addCardTo(sel[0].id, 'hand', { upg: sel[0].upg })[0];
      if (copy) { copy.temp = true; copy.phantom = true; }
      g.toast('全卡池开发获得幻影牌：' + S.cardName(sel[0]));
    }
    // 未选中的不属于你，自然视为消耗
  }

  /* ================= 自炸体系（15-20 张） ================= */
  C('sd_burst', {
    name: '自爆冲击', color: N, type: 'attack', rarity: 'common', cost: 1, art: '💥', series: 'self_destruct',
    base: { dmg: 14, cap: 1 }, up: { dmg: 18 },
    desc: (v) => `造成 ${v.dmg} 点伤害。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); reduceCap(g, v.cap); }
  });
  C('sd_megaton', {
    name: '兆吨爆炸', color: N, type: 'attack', rarity: 'common', cost: 2, target: 'none', art: '🧨', series: 'self_destruct',
    base: { dmg: 24, cap: 2 }, up: { dmg: 30 },
    desc: (v) => `对所有敌人造成 ${v.dmg} 点伤害。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.attackAll(v.dmg); reduceCap(g, v.cap); }
  });
  C('sd_coin', {
    name: '燃尽硬币', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🪙', series: 'self_destruct',
    base: { blk: 8, cap: 1 }, up: { blk: 11 },
    desc: (v) => `获得 ${v.blk} 点格挡。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.block(v.blk); reduceCap(g, v.cap); }
  });
  C('sd_fuel', {
    name: '自毁燃料', color: N, type: 'skill', rarity: 'common', cost: 1, art: '⛽', series: 'self_destruct',
    base: { energy: 2, cap: 1 }, up: { energy: 3 },
    desc: (v) => `获得 ${v.energy} 点能量。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.gainEnergy(v.energy); reduceCap(g, v.cap); }
  });
  C('sd_radar', {
    name: '燃烧雷达', color: N, type: 'skill', rarity: 'common', cost: 1, art: '📡', series: 'self_destruct',
    base: { draw: 2, cap: 1 }, up: { draw: 3 },
    desc: (v) => `抽 ${v.draw} 张牌。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.draw(v.draw); reduceCap(g, v.cap); }
  });
  C('sd_ignition', {
    name: '点火', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '🔥', series: 'self_destruct',
    base: { str: 2, cap: 1 }, up: { str: 3 },
    desc: (v) => `获得 ${v.str} 点<span class="kw">力量</span>。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.addPower(g.player, 'strength', v.str); reduceCap(g, v.cap); }
  });
  C('sd_contract', {
    name: '自毁契约', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '📜', series: 'self_destruct',
    desc: () => '获得「自毁」特性：自然行动点上限不满 5 时，每回合结束后恢复 1 点。',
    play: (g) => { g.addPower(g.player, 'energy_cap_regen', 1); g.toast('自毁契约生效'); }
  });
  C('sd_afterglow', {
    name: '余烬微光', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🌅', series: 'self_destruct',
    base: { hp: 6, cap: 1 }, up: { hp: 9 },
    desc: (v) => `恢复 ${v.hp} 点生命。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.heal(g.player, v.hp); reduceCap(g, v.cap); }
  });
  C('sd_limit_break', {
    name: '极限突破', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '📈', series: 'self_destruct',
    base: { cap: 1 }, up: { cap: 1 },
    desc: (v) => `力量翻倍。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => {
      const str = g.getPower(g.player, 'strength');
      if (str > 0) g.addPower(g.player, 'strength', str);
      reduceCap(g, v.cap);
    }
  });
  C('sd_volatile', {
    name: '不稳定化合物', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🧪', series: 'self_destruct',
    base: { energy: 3, cap: 1 }, up: { energy: 4 },
    desc: (v) => `获得 ${v.energy} 点能量。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.gainEnergy(v.energy); reduceCap(g, v.cap); }
  });
  C('sd_fuse', {
    name: '引信', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '🧯', series: 'self_destruct',
    base: { dmg: 10, cap: 1 }, up: { dmg: 13 },
    desc: (v) => `造成 ${v.dmg} 点伤害。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => {
      g.attack(t, v.dmg);
      reduceCap(g, v.cap);
      if (g.energyMax < 4 && g.getPower(g.player, 'strength')) g.addPower(g.player, 'strength', 1);
    }
  });
  C('sd_tempest', {
    name: '风暴核心', color: N, type: 'attack', rarity: 'rare', cost: 2, art: '⚡', series: 'self_destruct',
    base: { dmg: 20, draw: 2, cap: 1 }, up: { dmg: 26, draw: 2 },
    desc: (v) => `造成 ${v.dmg} 点伤害，抽 ${v.draw} 张牌。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.draw(v.draw); reduceCap(g, v.cap); }
  });
  C('sd_overvolt', {
    name: '超压', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🔋', series: 'self_destruct',
    base: { energy: 1, cap: 1 }, up: { energy: 2 },
    desc: (v) => `获得 ${v.energy} 点能量。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.gainEnergy(v.energy); reduceCap(g, v.cap); }
  });
  C('sd_chain_blast', {
    name: '链式爆破', color: N, type: 'attack', rarity: 'rare', cost: 2, art: '🧶', series: 'self_destruct',
    base: { dmg: 6, times: 4, cap: 1 }, up: { dmg: 6, times: 5 },
    desc: (v) => `造成 ${v.dmg} 点伤害 ${v.times} 次。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => {
      for (let i = 0; i < v.times; i++) g.attack(t, v.dmg);
      reduceCap(g, v.cap);
    }
  });
  C('sd_meltdown', {
    name: '熔毁', color: N, type: 'attack', rarity: 'rare', cost: 3, art: '☢️', series: 'self_destruct',
    base: { dmg: 40, cap: 2 }, up: { dmg: 48, cap: 2 },
    desc: (v) => `造成 ${v.dmg} 点伤害。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); reduceCap(g, v.cap); }
  });
  C('sd_annihilation', {
    name: '湮灭', color: N, type: 'attack', rarity: 'rare', cost: 3, target: 'none', art: '💫', series: 'self_destruct',
    base: { dmg: 32, cap: 3 }, up: { dmg: 40, cap: 2 },
    desc: (v) => `对所有敌人造成 ${v.dmg} 点伤害。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.attackAll(v.dmg); reduceCap(g, v.cap); }
  });

  /* ================= 电表倒转（15-18 张） ================= */
  C('el_rewire', {
    name: '电路重接', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🔌', series: 'electric',
    base: { hp: 1, energy: 1 }, up: { hp: 1, energy: 2 },
    desc: (v) => `失去 ${v.hp} 点生命，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.loseHp(g.player, v.hp, { self: true }); g.gainEnergy(v.energy); }
  });
  C('el_turbine', {
    name: '涡轮', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🌀', series: 'electric',
    base: { energy: 2 }, up: { energy: 3 },
    desc: (v) => `获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => g.gainEnergy(v.energy)
  });
  C('el_spark', {
    name: '过载火花', color: N, type: 'attack', rarity: 'common', cost: 1, art: '⚡', series: 'electric',
    base: { dmg: 8, energy: 1 }, up: { dmg: 11, energy: 1 },
    desc: (v) => `造成 ${v.dmg} 点伤害。本回合打出至少 2 张牌时，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); if (g.cardsPlayedTurn >= 2) g.gainEnergy(v.energy); }
  });
  C('el_overload', {
    name: '超载', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '💢', series: 'electric',
    base: { hp: 2, energy: 2, dmg: 12 }, up: { hp: 2, energy: 2, dmg: 15 },
    desc: (v) => `造成 ${v.dmg} 点伤害，失去 ${v.hp} 点生命，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.loseHp(g.player, v.hp, { self: true }); g.gainEnergy(v.energy); }
  });
  C('el_siphon', {
    name: '虹吸', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🫗', series: 'electric',
    base: { per: 3 }, up: { per: 4 },
    desc: (v) => `每缺少 3 点生命，获得 1 点能量（最多 3 点）。`,
    play: (g, c, t, v) => {
      const miss = Math.max(0, g.player.maxHp - g.player.hp);
      const n = Math.min(3, Math.floor(miss / v.per));
      if (n > 0) g.gainEnergy(n);
    }
  });
  C('el_capacitor', {
    name: '电容', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '🔋', series: 'electric',
    base: { n: 1 }, up: { n: 2 },
    desc: (v) => `每回合开始时获得 ${v.n} 点额外能量（可超过行动点上限）。`,
    play: (g, c, t, v) => g.addPower(g.player, 'overclock', v.n)
  });
  C('el_meter', {
    name: '电量计', color: N, type: 'power', rarity: 'rare', cost: 2, art: '📟', series: 'electric',
    base: { n: 1 }, up: { n: 2 },
    desc: (v) => `每当你受到伤害，获得 ${v.n} 点能量。`,
    play: (g, c, t, v) => g.addPower(g.player, 'meter_energy', v.n)
  });
  C('el_short_circuit', {
    name: '短路', color: N, type: 'skill', rarity: 'common', cost: 0, art: '⚡', series: 'electric',
    base: { hp: 2, energy: 2 }, up: { hp: 2, energy: 2 },
    desc: (v) => `失去 ${v.hp} 点生命，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.loseHp(g.player, v.hp, { self: true }); g.gainEnergy(v.energy); }
  });
  C('el_blackout', {
    name: '停电补偿', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🌑', series: 'electric',
    base: { energy: 3 }, up: { energy: 4 },
    desc: (v) => `若你没有能量，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { if (g.energy === 0) g.gainEnergy(v.energy); }
  });
  C('el_recharge', {
    name: '回充', color: N, type: 'power', rarity: 'rare', cost: 1, art: '🔋', series: 'electric',
    desc: () => '每回合开始时额外获得 1 点能量。',
    play: (g) => g.addPower(g.player, 'berserk', 1)
  });
  C('el_overflow', {
    name: '溢出', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🌊', series: 'electric',
    desc: () => '获得 2 点能量。',
    play: (g) => g.gainEnergy(2)
  });
  C('el_power_surge', {
    name: '功率突增', color: N, type: 'attack', rarity: 'rare', cost: 2, art: '⚡', series: 'electric',
    base: { dmg: 12, cap: 1 }, up: { dmg: 15, cap: 1 },
    desc: (v) => `造成 ${v.dmg} 点伤害。每点已损失的<span class="kw">行动点上限</span>，获得 1 点能量。`,
    play: (g, c, t, v) => {
      g.attack(t, v.dmg);
      const lost = Math.max(0, -(g.getPower(g.player, 'energy_cap') || 0));
      if (lost > 0) g.gainEnergy(lost);
    }
  });
  C('el_induction', {
    name: '感应充能', color: N, type: 'skill', rarity: 'common', cost: 2, art: '🧲', series: 'electric',
    base: { draw: 1, energy: 2 }, up: { draw: 2, energy: 2 },
    desc: (v) => `抽 ${v.draw} 张牌，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.draw(v.draw); g.gainEnergy(v.energy); }
  });
  C('el_breaker', {
    name: '断路器', color: N, type: 'attack', rarity: 'uncommon', cost: 2, art: '🔨', series: 'electric',
    base: { dmg: 16, energy: 2 }, up: { dmg: 20, energy: 2 },
    desc: (v) => `造成 ${v.dmg} 点伤害。若目标处于<span class="kw">易伤</span>，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => {
      const vuln = t && t.powers && t.powers.vulnerable;
      g.attack(t, v.dmg);
      if (vuln) g.gainEnergy(v.energy);
    }
  });
  C('el_redline', {
    name: '红线', color: N, type: 'power', rarity: 'rare', cost: 3, art: '🔴', series: 'electric',
    desc: () => '每回合开始时，若生命低于 50%，获得 2 点能量。',
    play: (g) => g.addPower(g.player, 'overclock_hp', 1)
  });
  C('el_metronome', {
    name: '节拍充能', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🎼', series: 'electric',
    base: { cards: 3, energy: 2 }, up: { cards: 2, energy: 2 },
    desc: (v) => `若本回合已打出至少 ${v.cards} 张牌，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { if (g.cardsPlayedTurn >= v.cards) g.gainEnergy(v.energy); }
  });

  /* ================= 跳槽：额外行动点上限（10 张） ================= */
  C('jp_promotion', {
    name: '升职', color: N, type: 'power', rarity: 'rare', cost: 2, art: '🚀', series: 'jump',
    desc: () => '行动点上限 +1（可超过 4）。',
    play: (g) => cap(g, 1)
  });
  C('jp_boss_salary', {
    name: '高管待遇', color: N, type: 'power', rarity: 'rare', cost: 3, art: '👔', series: 'jump',
    desc: () => '行动点上限 +2（可超过 4）。',
    play: (g) => cap(g, 2)
  });
  C('jp_side_hustle', {
    name: '兼职', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '💼', series: 'jump',
    base: { draw: 1 }, up: { draw: 2 },
    desc: (v) => `行动点上限 +1。抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => { cap(g, 1); g.draw(v.draw); }
  });
  C('jp_benefits', {
    name: '福利', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🎁', series: 'jump',
    base: { hp: 2 }, up: { hp: 4 },
    desc: (v) => `行动点上限 +1，恢复 ${v.hp} 点生命。`,
    play: (g, c, t, v) => { cap(g, 1); g.heal(g.player, v.hp); }
  });
  C('jp_lateral_move', {
    name: '跳槽', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '↔️', series: 'jump',
    desc: () => '行动点上限 +1。弃一张手牌，抽一张牌。',
    play: async (g) => {
      cap(g, 1);
      if (!g.hand.length) { g.draw(1); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '跳槽：弃一张牌' });
      if (sel[0]) { g.discardCard(sel[0]); g.draw(1); }
      else g.draw(1);
    }
  });
  C('jp_recruiter', {
    name: '猎头', color: N, type: 'attack', rarity: 'uncommon', cost: 2, art: '🕴️', series: 'jump',
    base: { dmg: 10 }, up: { dmg: 13 },
    desc: (v) => `造成 ${v.dmg} 点伤害。行动点上限 +1。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); cap(g, 1); }
  });
  C('jp_headhunt', {
    name: '挖角', color: N, type: 'attack', rarity: 'rare', cost: 1, art: '🎯', series: 'jump',
    base: { dmg: 14 }, up: { dmg: 18 },
    desc: (v) => `造成 ${v.dmg} 点伤害。若杀死目标，行动点上限 +1。`,
    play: (g, c, t, v) => {
      const alive = t && !t.dead;
      g.attack(t, v.dmg);
      if (alive && t.hp <= 0) cap(g, 1);
    }
  });
  C('jp_second_job', {
    name: '第二职业', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '📚', series: 'jump',
    base: { hp: 3 }, up: { hp: 2 },
    desc: (v) => `行动点上限 +1，最大生命 -${v.hp}。`,
    play: (g, c, t, v) => { cap(g, 1); g.game.loseMaxHp(v.hp); }
  });
  C('jp_negotiation', {
    name: '谈判加薪', color: N, type: 'skill', rarity: 'rare', cost: 0, art: '🗣️', series: 'jump',
    base: { hp: 1 }, up: { hp: 1 },
    desc: (v) => `行动点上限 +1，失去 ${v.hp} 点生命。`,
    play: (g, c, t, v) => { cap(g, 1); g.loseHp(g.player, v.hp, { self: true }); }
  });
  C('jp_ceo', {
    name: '大老板', color: N, type: 'power', rarity: 'rare', cost: 4, art: '👑', series: 'jump',
    desc: () => '行动点上限 +3（可超过 4）。',
    play: (g) => cap(g, 3)
  });

  /* ================= 回血（10 张） ================= */
  C('heal_bandage', {
    name: '绷带', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🩹', series: 'heal',
    base: { hp: 2 }, up: { hp: 4 },
    desc: (v) => `恢复 ${v.hp} 点生命。`,
    play: (g, c, t, v) => g.heal(g.player, v.hp)
  });
  C('heal_meal', {
    name: '便当', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🍱', series: 'heal',
    base: { hp: 5 }, up: { hp: 7 },
    desc: (v) => `恢复 ${v.hp} 点生命。`,
    play: (g, c, t, v) => g.heal(g.player, v.hp)
  });
  C('heal_restore', {
    name: '修补', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🔧', series: 'heal',
    base: { hp: 6, draw: 1 }, up: { hp: 8, draw: 1 },
    desc: (v) => `恢复 ${v.hp} 点生命，抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => { g.heal(g.player, v.hp); g.draw(v.draw); }
  });
  C('heal_transfusion', {
    name: '输血', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '🩸', series: 'heal',
    base: { dmg: 7, hp: 2 }, up: { dmg: 10, hp: 3 },
    desc: (v) => `造成 ${v.dmg} 点伤害，恢复 ${v.hp} 点生命。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.heal(g.player, v.hp); }
  });
  C('heal_donation', {
    name: '生命交换', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🔄', series: 'heal',
    base: { hp: 2, heal: 6 }, up: { hp: 2, heal: 9 },
    desc: (v) => `失去 ${v.hp} 点生命，恢复 ${v.heal} 点生命。`,
    play: (g, c, t, v) => { g.loseHp(g.player, v.hp, { self: true }); g.heal(g.player, v.heal); }
  });
  C('heal_song', {
    name: '安魂曲', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '🎵', series: 'heal',
    base: { n: 2 }, up: { n: 3 },
    desc: (v) => `每回合结束时恢复 ${v.n} 点生命。`,
    play: (g, c, t, v) => g.addPower(g.player, 'regen_flat', v.n)
  });
  C('heal_lotus', {
    name: '生命莲花', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🌸', series: 'heal',
    base: { hp: 10 }, up: { hp: 14 },
    desc: (v) => `恢复 ${v.hp} 点生命。行动点上限 +1。`,
    play: (g, c, t, v) => { g.heal(g.player, v.hp); cap(g, 1); }
  });
  C('heal_blood_pact', {
    name: '血之盟约', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🧛', series: 'heal',
    base: { hp: 15, cap: 1 }, up: { hp: 20, cap: 1 },
    desc: (v) => `恢复 ${v.hp} 点生命。行动点上限 -${v.cap}。`,
    play: (g, c, t, v) => { g.heal(g.player, v.hp); reduceCap(g, v.cap); }
  });
  C('heal_regeneration', {
    name: '再生蒸汽', color: N, type: 'power', rarity: 'rare', cost: 2, art: '♻️', series: 'heal',
    base: { n: 3 }, up: { n: 4 },
    desc: (v) => `获得 ${v.n} 层<span class="kw">再生</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'regen', v.n)
  });
  C('heal_feast', {
    name: '吞噬盛宴', color: N, type: 'skill', rarity: 'rare', cost: 1, art: '🍗', series: 'heal',
    base: { per: 3 }, up: { per: 4 },
    desc: (v) => `每有一个敌人，恢复 ${v.per} 点生命。`,
    play: (g, c, t, v) => g.heal(g.player, v.per * g.enemies().length)
  });

  /* ================= 过牌（5 张） ================= */
  C('draw_quick', {
    name: '快速思考', color: N, type: 'skill', rarity: 'common', cost: 0, art: '💭', series: 'draw',
    base: { draw: 2 }, up: { draw: 3 },
    desc: (v) => `抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => g.draw(v.draw)
  });
  C('draw_breathe', {
    name: '深呼吸', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🫁', series: 'draw',
    base: { draw: 3 }, up: { draw: 4 },
    desc: (v) => `抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => g.draw(v.draw)
  });
  C('draw_momentum', {
    name: '顺势', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🌊', series: 'draw',
    base: { draw: 2, energy: 1 }, up: { draw: 3, energy: 1 },
    desc: (v) => `抽 ${v.draw} 张牌，获得 ${v.energy} 点能量。`,
    play: (g, c, t, v) => { g.draw(v.draw); g.gainEnergy(v.energy); }
  });
  C('draw_insight', {
    name: '洞见', color: N, type: 'skill', rarity: 'rare', cost: 1, art: '🔮', series: 'draw',
    base: { draw: 5 }, up: { draw: 6 },
    desc: (v) => `抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => g.draw(v.draw)
  });
  C('draw_rewind', {
    name: '读档', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '⏪', series: 'draw',
    base: { draw: 3 }, up: { draw: 4 },
    desc: (v) => `抽 ${v.draw} 张牌。`,
    play: (g, c, t, v) => g.draw(v.draw)
  });

  /* ================= 开发（卡组开发 / 全卡池开发 / 复制） ================= */
  C('dev_scout', {
    name: '开发：灵感', color: N, type: 'skill', rarity: 'common', cost: 1, art: '💡', series: 'dev',
    desc: () => '从自己卡组中随机 3 张，选择 1 张加入手牌；未选中的回到弃牌堆，不消耗。',
    play: async (g) => doDeckDev(g, null, '开发·卡组：选择一张牌加入手牌')
  });
  C('dev_attack', {
    name: '开发：兵器', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '⚔️', series: 'dev',
    desc: () => '从自己卡组的攻击牌中随机 3 张，选择 1 张加入手牌；未选中的回到弃牌堆。',
    play: async (g) => doDeckDev(g, (d) => d.type === 'attack', '开发·卡组攻击牌')
  });
  C('dev_skill', {
    name: '开发：战术', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '📖', series: 'dev',
    desc: () => '从自己卡组的技能牌中随机 3 张，选择 1 张加入手牌；未选中的回到弃牌堆。',
    play: async (g) => doDeckDev(g, (d) => d.type === 'skill', '开发·卡组技能牌')
  });
  C('dev_power', {
    name: '开发：原理', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🔬', series: 'dev',
    desc: () => '从自己卡组的能力牌中随机 3 张，选择 1 张加入手牌；未选中的回到弃牌堆。',
    play: async (g) => doDeckDev(g, (d) => d.type === 'power', '开发·卡组能力牌')
  });
  C('dev_master', {
    name: '开发：大师', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🎓', series: 'dev',
    desc: () => '连续开发卡组两次：每次选择 1 张加入手牌，未选中的回到弃牌堆。',
    play: async (g) => { await doDeckDev(g, null, '开发·卡组（1/2）'); await doDeckDev(g, null, '开发·卡组（2/2）'); }
  });
  C('dev_limit', {
    name: '开发：限定调查', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🗂️', series: 'dev',
    desc: () => '从自己卡组的开发系列牌中随机 3 张，选择 1 张加入手牌。',
    play: async (g) => doDeckDev(g, (d) => d.series === 'dev', '开发·卡组限定')
  });
  C('dev_zero', {
    name: '开发：零费', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🎁', series: 'dev',
    desc: () => '从自己卡组中开发一张：选择 1 张加入手牌，未选中的回到弃牌堆。',
    play: async (g) => doDeckDev(g, null, '零费开发：选择一张牌加入手牌')
  });
  C('dev_copy', {
    name: '开发：复制', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '📸', series: 'dev',
    desc: () => '从自己卡组中复制 3 张牌，选择 1 张加入手牌；其余两张复制视为消耗。',
    play: async (g) => doDeckCopy(g, null, '开发·复制：选择一张牌加入手牌')
  });

  /* 全卡池开发：选中的加入手牌并具有幻影，未选中的自然消耗 */
  C('dev_pool', {
    name: '开发·全卡池', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🌌', series: 'dev',
    desc: () => '从所有牌中随机 3 张，选中的 1 张以<span class="kw">幻影</span>加入手牌；未选中的消耗。',
    play: async (g) => doPoolDev(g, null, '全卡池开发：选择一张幻影牌')
  });
  C('dev_pool_attack', {
    name: '开发·全卡池兵器', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🌌', series: 'dev',
    desc: () => '从所有攻击牌中随机 3 张，选中的 1 张以幻影加入手牌。',
    play: async (g) => doPoolDev(g, (d) => d.type === 'attack', '全卡池开发：选择幻影攻击牌')
  });
  C('dev_pool_skill', {
    name: '开发·全卡池战术', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🌌', series: 'dev',
    desc: () => '从所有技能牌中随机 3 张，选中的 1 张以幻影加入手牌。',
    play: async (g) => doPoolDev(g, (d) => d.type === 'skill', '全卡池开发：选择幻影技能牌')
  });
  /* 新增：全卡池精炼 —— 从全部牌中挑选，选中的以幻影+升级加入手牌 */
  C('dev_pool_quality', {
    name: '开发·全卡池精炼', color: N, type: 'skill', rarity: 'rare', cost: 3, art: '✨', series: 'dev',
    desc: () => '从所有牌中随机 3 张，选中的 1 张以幻影并以<span class="kw">升级</span>形式加入手牌。',
    play: async (g) => {
      const pool = poolDevPool(g, null);
      if (!pool.length) { g.toast('没有可开发的牌'); return; }
      const three = g.game.rng.sample(pool, Math.min(3, pool.length)).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(g, {
        from: three, n: 1, prompt: '全卡池精炼：选择一张升级幻影牌', virtual: true, canSkip: true
      });
      if (!sel[0]) return;
      const copy = g.addCardTo(sel[0].id, 'hand', { upg: 1 })[0];
      if (copy) { copy.temp = true; copy.phantom = true; }
      g.toast('精炼获得升级幻影牌：' + S.cardName(copy || sel[0]));
    }
  });
  /* 新增：全卡池转运 —— 从全部牌中挑选 3 张，选择 2 张以幻影加入手牌 */
  C('dev_pool_lucky', {
    name: '开发·全卡池转运', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🍀', series: 'dev',
    desc: () => '从所有牌中随机 3 张，选择 2 张以幻影加入手牌。',
    play: async (g) => {
      const pool = poolDevPool(g, null);
      if (!pool.length) { g.toast('没有可开发的牌'); return; }
      const three = g.game.rng.sample(pool, Math.min(3, pool.length)).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(g, {
        from: three, n: 2, prompt: '全卡池转运：选择 2 张幻影牌', virtual: true, canSkip: true
      });
      sel.forEach((s) => {
        const copy = g.addCardTo(s.id, 'hand', { upg: s.upg })[0];
        if (copy) { copy.temp = true; copy.phantom = true; }
      });
      if (sel.length) g.toast('转运获得 ' + sel.length + ' 张幻影牌');
    }
  });

  /* 自炸+开发联合：零费，只消耗 1 点行动点上限，连续两次卡组复制 */
  C('sd_dev_cycle', {
    name: '自毁开发循环', color: N, type: 'skill', rarity: 'rare', cost: 0, art: '🧪', series: 'self_destruct',
    desc: () => '行动点上限 -1。连续开发两次复制：每次从自己卡组复制 3 张，选择 1 张加入手牌。',
    play: async (g) => {
      reduceCap(g, 1);
      await doDeckCopy(g, null, '自毁开发循环（1/2）');
      await doDeckCopy(g, null, '自毁开发循环（2/2）');
    }
  });
  C('deck_top', {
    name: '卡组顶注入', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🎯', series: 'deck',
    desc: () => '将弃牌堆中的一张牌置于卡组顶，然后抽 1 张牌。',
    play: async (g) => {
      if (!g.discardPile.length) { g.draw(1); return; }
      const sel = await S.UI.chooseCards(g, { from: g.discardPile.slice(), n: 1, prompt: '选择一张牌置于卡组顶' });
      if (sel[0]) g.moveCard(sel[0], 'draw');
      g.draw(1);
    }
  });
  C('bulk_produce', {
    name: '批量生产', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🏭', series: 'deck',
    desc: () => '选择一张手牌，把最多 3 张它的临时复制加入手牌（直到手牌已满），复制具有<span class="kw">消耗</span>。',
    play: async (g) => {
      if (!g.hand.length) { g.toast('手牌为空'); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '批量生产：选择一张牌' });
      if (!sel[0]) return;
      const n = Math.min(3, 10 - g.hand.length);
      for (let i = 0; i < n; i++) g.addCardTo(sel[0].id, 'hand', { upg: sel[0].upg, exhaust: true });
      g.toast('批量生产 +' + n + ' 张');
    }
  });

  /* ================= 反制卡（可设置，敌方看不到具体哪张） ================= */
  C('counter_pierce', {
    name: '反制·贯穿', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🏹', series: 'counter', counter: true,
    desc: () => '反制：当敌方意图为攻击/使用攻击牌时，对敌方造成 12 点伤害。',
    play: (g) => { },
    counterPlay: (g, c, enemy, info) => {
      if (info && ((info.type ? info.type.indexOf('attack') === 0 : false) || info.kind === 'attack')) { g.attack(enemy, 12); return true; }
      return false;
    }
  });
  C('counter_drain', {
    name: '反制·抽干', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🧹', series: 'counter', counter: true,
    desc: () => '反制：当敌方额外抽牌时，对敌方造成 15 点伤害。',
    play: (g) => { },
    counterPlay: (g, c, enemy, info) => {
      if (info && (info.extraDraw || info.type === 'draw')) { g.attack(enemy, 15); return true; }
      return false;
    }
  });
  C('counter_guard', {
    name: '反制·护壁', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🛡️', series: 'counter', counter: true,
    desc: () => '反制：当敌方意图为攻击/使用攻击牌时，获得 10 点格挡。',
    play: (g) => { },
    counterPlay: (g, c, enemy, info) => {
      if (info && ((info.type ? info.type.indexOf('attack') === 0 : false) || info.kind === 'attack')) { g.block(10); return true; }
      return false;
    }
  });
  C('counter_power', {
    name: '反制·过载', color: N, type: 'skill', rarity: 'rare', cost: 0, art: '⚡', series: 'counter', counter: true,
    desc: () => '反制：当敌方使用能力牌/强化自己时，对敌方造成 10 点伤害。',
    play: (g) => { },
    counterPlay: (g, c, enemy, info) => {
      if (info && (info.type === 'power' || info.type === 'buff' || info.kind === 'power')) { g.attack(enemy, 10); return true; }
      return false;
    }
  });

  /* ================= 特殊配合：交换 / 自杀式袭击 ================= */
  C('swap_deal', {
    name: '交换', color: N, type: 'skill', rarity: 'uncommon', cost: 2, art: '♻️', series: 'special',
    desc: () => '选择一张手牌，获得一张随机相同种类的牌，随后弃掉选中的牌。',
    play: async (g) => {
      if (!g.hand.length) { g.toast('手牌为空'); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '交换：选择一张手牌' });
      if (!sel[0]) return;
      const d = S.cards[sel[0].id];
      const pool = g.game.cardPool(d.type) || [];
      if (pool.length) g.addCardTo(g.game.rng.pick(pool), 'hand');
      else g.toast('没有同类型卡牌');
      g.discardCard(sel[0]);
    }
  });
  C('suicide_attack', {
    name: '自杀式袭击', color: N, type: 'attack', rarity: 'rare', cost: 3, art: '💣', series: 'special',
    desc: () => '消耗一张手牌，对目标造成该牌花费 ×15 的伤害。',
    play: async (g, c, t) => {
      if (!g.hand.length) { g.toast('没有可消耗的手牌'); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '自杀式袭击：消耗一张手牌' });
      if (!sel[0]) return;
      const cost = g.cost(sel[0]);
      const dmg = (typeof cost === 'number' && cost > 0 ? cost : 0) * 15;
      g.exhaustCard(sel[0]);
      if (t) g.attack(t, dmg);
    }
  });

  /* ================= 幻影牌（30 张，不出现在普通卡池，战斗结束消失） ================= */
  C('ph_flicker', { name: '幻影闪烁', color: N, type: 'attack', rarity: 'uncommon', cost: 0, art: '✨', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 4 }, up: { dmg: 7 }, desc: (v) => `造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attack(t, v.dmg) });
  C('ph_mirage_guard', { name: '海市蜃楼', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🛡️', ethereal: true, exhaust: true, series: 'phantom', base: { blk: 9 }, up: { blk: 12 }, desc: (v) => `获得 ${v.blk} 点格挡。`, play: (g,c,t,v) => g.block(v.blk) });
  C('ph_echo_strike', { name: '回响斩', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '🔊', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 7, draw: 1 }, up: { dmg: 9, draw: 1 }, desc: (v) => `造成 ${v.dmg} 点伤害，抽 ${v.draw} 张牌。`, play: (g,c,t,v) => { g.attack(t, v.dmg); g.draw(v.draw); } });
  C('ph_phantom_brew', { name: '幻影药水', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🧪', ethereal: true, exhaust: true, series: 'phantom', base: { energy: 1, hp: 2 }, up: { energy: 2, hp: 2 }, desc: (v) => `获得 ${v.energy} 点能量，恢复 ${v.hp} 点生命。`, play: (g,c,t,v) => { g.gainEnergy(v.energy); g.heal(g.player, v.hp); } });
  C('ph_ghost_fire', { name: '鬼火', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '👻', ethereal: true, exhaust: true, series: 'phantom', base: { str: 2 }, up: { str: 3 }, desc: (v) => `获得 ${v.str} 点力量。`, play: (g,c,t,v) => g.addPower(g.player, 'strength', v.str) });
  C('ph_silent_needle', { name: '无声之针', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '🪡', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 8, weak: 1 }, up: { dmg: 10, weak: 1 }, desc: (v) => `造成 ${v.dmg} 点伤害，给予 ${v.weak} 层虚弱。`, play: (g,c,t,v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'weak', v.weak); } });
  C('ph_mist_wall', { name: '迷雾之墙', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🌫️', ethereal: true, exhaust: true, series: 'phantom', base: { blk: 6 }, up: { blk: 8 }, desc: (v) => `获得 ${v.blk} 点格挡。`, play: (g,c,t,v) => g.block(v.blk) });
  C('ph_void_bolt', { name: '虚空箭', color: N, type: 'attack', rarity: 'common', cost: 1, art: '🕳️', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 10, vuln: 1 }, up: { dmg: 13, vuln: 1 }, desc: (v) => `造成 ${v.dmg} 点伤害，给予 ${v.vuln} 层易伤。`, play: (g,c,t,v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'vulnerable', v.vuln); } });
  C('ph_ephemeral_mend', { name: '短暂修复', color: N, type: 'skill', rarity: 'uncommon', cost: 1, art: '🩹', ethereal: true, exhaust: true, series: 'phantom', base: { hp: 5, draw: 1 }, up: { hp: 7, draw: 1 }, desc: (v) => `恢复 ${v.hp} 点生命，抽 ${v.draw} 张牌。`, play: (g,c,t,v) => { g.heal(g.player, v.hp); g.draw(v.draw); } });
  C('ph_phantom_step', { name: '幻影步', color: N, type: 'skill', rarity: 'common', cost: 0, art: '👣', ethereal: true, exhaust: true, series: 'phantom', base: { draw: 2 }, up: { draw: 3 }, desc: (v) => `抽 ${v.draw} 张牌。`, play: (g,c,t,v) => g.draw(v.draw) });
  C('ph_spectral_sword', { name: '幽灵剑', color: N, type: 'attack', rarity: 'rare', cost: 2, art: '⚔️', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 18 }, up: { dmg: 24 }, desc: (v) => `造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attack(t, v.dmg) });
  C('ph_ghostly_armor', { name: '幽魂甲', color: N, type: 'skill', rarity: 'uncommon', cost: 2, art: '👘', ethereal: true, exhaust: true, series: 'phantom', base: { blk: 12 }, up: { blk: 15 }, desc: (v) => `获得 ${v.blk} 点格挡。`, play: (g,c,t,v) => g.block(v.blk) });
  C('ph_fading_light', { name: '残光', color: N, type: 'power', rarity: 'uncommon', cost: 2, art: '💡', ethereal: true, exhaust: true, series: 'phantom', base: { n: 2 }, up: { n: 3 }, desc: (v) => `每回合结束时恢复 ${v.n} 点生命。`, play: (g,c,t,v) => g.addPower(g.player, 'regen_flat', v.n) });
  C('ph_specter_invite', { name: '招魂', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🔮', ethereal: true, exhaust: true, series: 'phantom', base: { energy: 2 }, up: { energy: 3 }, desc: (v) => `获得 ${v.energy} 点能量。`, play: (g,c,t,v) => g.gainEnergy(v.energy) });
  C('ph_phantom_bullet', { name: '幻影弹', color: N, type: 'attack', rarity: 'common', cost: 0, art: '🔫', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 5 }, up: { dmg: 8 }, desc: (v) => `造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attack(t, v.dmg) });
  C('ph_apparition_gift', { name: '幽灵礼赠', color: N, type: 'skill', rarity: 'rare', cost: 1, art: '🎁', ethereal: true, exhaust: true, series: 'phantom', base: { n: 1 }, up: { n: 2 }, desc: (v) => `获得 ${v.n} 层无形。`, play: (g,c,t,v) => g.addPower(g.player, 'intangible', v.n) });
  C('ph_ghost_wind', { name: '幽灵之风', color: N, type: 'attack', rarity: 'uncommon', cost: 2, target: 'none', art: '🌪️', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 8 }, up: { dmg: 11 }, desc: (v) => `对所有敌人造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attackAll(v.dmg) });
  C('ph_lifespan_borrow', { name: '借寿', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '⏳', ethereal: true, exhaust: true, series: 'phantom', base: { hp: 2, heal: 10 }, up: { hp: 2, heal: 14 }, desc: (v) => `失去 ${v.hp} 点生命，恢复 ${v.heal} 点生命。`, play: (g,c,t,v) => { g.loseHp(g.player, v.hp, { self: true }); g.heal(g.player, v.heal); } });
  C('ph_void_echo', { name: '虚空回声', color: N, type: 'attack', rarity: 'common', cost: 1, art: '🔊', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 6, draw: 1 }, up: { dmg: 8, draw: 1 }, desc: (v) => `造成 ${v.dmg} 点伤害，抽 ${v.draw} 张牌。`, play: (g,c,t,v) => { g.attack(t, v.dmg); g.draw(v.draw); } });
  C('ph_soul_tap', { name: '灵魂虹吸', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🩸', ethereal: true, exhaust: true, series: 'phantom', base: { hp: 1, energy: 1, draw: 1 }, up: { hp: 1, energy: 2, draw: 1 }, desc: (v) => `失去 ${v.hp} 点生命，获得 ${v.energy} 点能量，抽 ${v.draw} 张牌。`, play: (g,c,t,v) => { g.loseHp(g.player, v.hp, { self: true }); g.gainEnergy(v.energy); g.draw(v.draw); } });
  C('ph_dream_walk', { name: '梦游', color: N, type: 'power', rarity: 'uncommon', cost: 2, art: '🌙', ethereal: true, exhaust: true, series: 'phantom', base: { dex: 2 }, up: { dex: 3 }, desc: (v) => `获得 ${v.dex} 点敏捷。`, play: (g,c,t,v) => g.addPower(g.player, 'dexterity', v.dex) });
  C('ph_night_phantom', { name: '夜魅', color: N, type: 'attack', rarity: 'uncommon', cost: 1, art: '🌑', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 9 }, up: { dmg: 12 }, desc: (v) => `造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attack(t, v.dmg) });
  C('ph_mirage_coin', { name: '幻影金币', color: N, type: 'skill', rarity: 'common', cost: 0, art: '🪙', ethereal: true, exhaust: true, series: 'phantom', base: { energy: 2 }, up: { energy: 3 }, desc: (v) => `获得 ${v.energy} 点能量。`, play: (g,c,t,v) => g.gainEnergy(v.energy) });
  C('ph_shadow_bound', { name: '影缚', color: N, type: 'power', rarity: 'uncommon', cost: 1, art: '⛓️', ethereal: true, exhaust: true, series: 'phantom', base: { n: 1 }, up: { n: 2 }, desc: (v) => `下回合额外抽 ${v.n} 张牌。`, play: (g,c,t,v) => g.addPower(g.player, 'draw_next', v.n) });
  C('ph_phantom_whisper', { name: '幻影低语', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '🗣️', ethereal: true, exhaust: true, series: 'phantom', base: { vuln: 3, poison: 3 }, up: { vuln: 4, poison: 4 }, desc: (v) => `给予目标 ${v.vuln} 层易伤和 ${v.poison} 层中毒。`, play: (g,c,t,v) => { if (t) { g.applyDebuff(t, 'vulnerable', v.vuln); g.applyDebuff(t, 'poison', v.poison); } } });
  C('ph_ghost_scale', { name: '幽灵鳞', color: N, type: 'skill', rarity: 'common', cost: 1, art: '🐉', ethereal: true, exhaust: true, series: 'phantom', base: { blk: 7 }, up: { blk: 10 }, desc: (v) => `获得 ${v.blk} 点格挡。`, play: (g,c,t,v) => g.block(v.blk) });
  C('ph_haunted_strike', { name: '附身打击', color: N, type: 'attack', rarity: 'uncommon', cost: 2, art: '👿', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 14 }, up: { dmg: 18 }, desc: (v) => `造成 ${v.dmg} 点伤害。`, play: (g,c,t,v) => g.attack(t, v.dmg) });
  C('ph_ephemeral_gift', { name: '转瞬之礼', color: N, type: 'power', rarity: 'rare', cost: 1, art: '🎴', ethereal: true, exhaust: true, series: 'phantom', base: { n: 1 }, up: { n: 2 }, desc: (v) => `每回合开始时将 ${v.n} 张随机幻影牌加入手牌。`, play: (g,c,t,v) => g.addPower(g.player, 'phantom_gift', v.n) });
  C('ph_disappear', { name: '消散', color: N, type: 'skill', rarity: 'rare', cost: 1, art: '🌫️', ethereal: true, exhaust: true, series: 'phantom', desc: () => '移除自身所有负面效果。', play: (g) => { Object.keys(g.player.powers).forEach((k) => { const d = S.powers[k]; if (d && (d.type === 'debuff' || (d.allowNeg && g.player.powers[k] < 0))) g.removePower(g.player, k); }); } });
  C('ph_last_illusion', { name: '最后幻象', color: N, type: 'attack', rarity: 'rare', cost: 1, art: '🌠', ethereal: true, exhaust: true, series: 'phantom', base: { dmg: 11 }, up: { dmg: 15 }, desc: (v) => `造成 ${v.dmg} 点伤害，本回合无法再打出幻影牌。`, play: (g,c,t,v) => { g.attack(t, v.dmg); c.lastPhantom = true; } });

  /* 幻影礼能力：每回合开始获得随机幻影牌 */
  S.defPower('phantom_gift', {
    name: '幻影之礼', type: 'buff', icon: '🎴',
    desc: (n) => `每回合开始时将 ${n} 张随机幻影牌加入手牌。`,
    onTurnStart: (c, o, n) => {
      const pool = Object.keys(S.cards).filter((id) => S.cards[id].series === 'phantom');
      if (!pool.length) return;
      for (let i = 0; i < n; i++) {
        const id = c.game.rng.pick(pool);
        const x = c.addCardTo(id, 'hand', {})[0];
        if (x) { x.temp = true; x.phantom = true; x.ethereal = true; x.exhaust = true; }
      }
    }
  });

  /* ================= 新增能力定义 ================= */
  S.defPower('energy_cap', {
    name: '行动点上限', type: 'buff', icon: '🔷', allowNeg: true,
    desc: (n) => `行动点上限 ${n >= 0 ? '+' : ''}${n} 点。`
  });
  S.defPower('energy_cap_regen', {
    name: '自毁', type: 'buff', icon: '🔄', noStack: true,
    desc: () => '自然行动点上限不满 5 时，每回合结束后恢复 1 点上限。'
  });
  S.defPower('overclock', {
    name: '过载', type: 'buff', icon: '⚡',
    desc: (n) => `每回合开始时获得 ${n} 点额外能量（可超过上限）。`,
    onTurnStart: (c, o, n) => c.gainEnergy(n)
  });
  S.defPower('meter_energy', {
    name: '受伤充能', type: 'buff', icon: '🔌',
    desc: (n) => `每当你受到伤害，获得 ${n} 点能量。`,
    onDamaged: (c, o, n, dmg) => { if (dmg > 0) c.gainEnergy(n); }
  });
  S.defPower('overclock_hp', {
    name: '低血过载', type: 'buff', icon: '🩸', noStack: true,
    desc: () => '每回合开始时，若生命低于 50%，获得 2 点能量。',
    onTurnStart: (c, o) => {
      if (o.hp * 2 < o.maxHp) { c.gainEnergy(2); c.toast('低血过载 +2 能量'); }
    }
  });
})();
