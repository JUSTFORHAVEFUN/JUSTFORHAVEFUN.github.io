/* ================= cards_silent.js · 静默猎手 ================= */
(function () {
  'use strict';
  const S = window.STS, C = S.defCard;
  const G = 'green';

  async function discardN(g, n, forced) {
    const avail = g.hand.slice();
    if (!avail.length) return [];
    const k = Math.min(n, avail.length);
    const sel = await S.UI.chooseCards(g, { from: avail, n: k, prompt: '选择 ' + k + ' 张牌弃掉', mustPick: true, cancellable: false });
    sel.forEach((c) => g.discardCard(c));
    return sel;
  }
  S.discardN = discardN;

  /* ---------------- 基础牌 ---------------- */
  C('strike_g', {
    name: '打击', color: G, type: 'attack', rarity: 'basic', cost: 1, art: '🗡️',
    base: { dmg: 6 }, up: { dmg: 9 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('defend_g', {
    name: '防御', color: G, type: 'skill', rarity: 'basic', cost: 1, art: '🛡️',
    base: { blk: 5 }, up: { blk: 8 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('neutralize', {
    name: '中和', color: G, type: 'attack', rarity: 'basic', cost: 0, art: '🌫️',
    base: { dmg: 3, weak: 1 }, up: { dmg: 4, weak: 2 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('weak')} 层<span class="kw">虚弱</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'weak', v.weak); }
  });
  C('survivor', {
    name: '生存者', color: G, type: 'skill', rarity: 'basic', cost: 1, art: '🎴',
    base: { blk: 8 }, up: { blk: 11 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，弃 1 张牌。`,
    play: async (g, c, t, v) => { g.block(v.blk); await discardN(g, 1); }
  });
  C('shiv', {
    name: '飞刀', color: G, type: 'attack', rarity: 'special', cost: 0, exhaust: true, noPool: true, art: '🔪',
    base: { dmg: 4 }, up: { dmg: 6 },
    desc: (v, p) => `造成 ${p.dn(v.dmg + (p.g ? p.g.getPower(p.g.player, 'accuracy') : 0))} 点伤害。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.attack(t, v.dmg + g.getPower(g.player, 'accuracy'))
  });

  /* ---------------- 普通攻击 ---------------- */
  C('bane', {
    name: '毒刃', color: G, type: 'attack', rarity: 'common', cost: 1, art: '🐍',
    base: { dmg: 7 }, up: { dmg: 10 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若目标处于<span class="kw">中毒</span>，再造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => { const poi = t && t.powers.poison; g.attack(t, v.dmg); if (poi) g.attack(t, v.dmg); }
  });
  C('dagger_spray', {
    name: '匕首飞舞', color: G, type: 'attack', rarity: 'common', cost: 1, target: 'none', art: '🎏',
    base: { dmg: 4 }, up: { dmg: 6 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害 2 次。`,
    play: (g, c, t, v) => { g.attackAll(v.dmg); g.attackAll(v.dmg); }
  });
  C('dagger_throw', {
    name: '飞刀投掷', color: G, type: 'attack', rarity: 'common', cost: 1, art: '🎯',
    base: { dmg: 9 }, up: { dmg: 12 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，抽 1 张牌，弃 1 张牌。`,
    play: async (g, c, t, v) => { g.attack(t, v.dmg); g.draw(1); await discardN(g, 1); }
  });
  C('flying_knee', {
    name: '飞膝', color: G, type: 'attack', rarity: 'common', cost: 1, art: '🦵',
    base: { dmg: 8 }, up: { dmg: 11 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。下个回合获得 1 点能量。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.addPower(g.player, 'energy_next', 1); }
  });
  C('poisoned_stab', {
    name: '淬毒之刺', color: G, type: 'attack', rarity: 'common', cost: 1, art: '☠️',
    base: { dmg: 6, poi: 3 }, up: { dmg: 8, poi: 4 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('poi')} 层<span class="kw">中毒</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'poison', v.poi); }
  });
  C('quick_slash', {
    name: '快速斩', color: G, type: 'attack', rarity: 'common', cost: 1, art: '⚡',
    base: { dmg: 8 }, up: { dmg: 12 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，抽 1 张牌。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.draw(1); }
  });
  C('slice', {
    name: '切割', color: G, type: 'attack', rarity: 'common', cost: 0, art: '✂️',
    base: { dmg: 6 }, up: { dmg: 9 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('sneaky_strike', {
    name: '偷袭', color: G, type: 'attack', rarity: 'common', cost: 2, art: '🥷',
    base: { dmg: 12 }, up: { dmg: 16 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若你本回合弃过牌，获得 2 点能量。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); if (g.discardedThisTurn > 0) g.gainEnergy(2); }
  });
  C('sucker_punch', {
    name: '阴招', color: G, type: 'attack', rarity: 'common', cost: 1, art: '👊',
    base: { dmg: 7, weak: 1 }, up: { dmg: 9, weak: 2 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('weak')} 层<span class="kw">虚弱</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'weak', v.weak); }
  });

  /* ---------------- 罕见攻击 ---------------- */
  C('all_out_attack', {
    name: '全力攻击', color: G, type: 'attack', rarity: 'uncommon', cost: 1, target: 'none', art: '💣',
    base: { dmg: 10 }, up: { dmg: 14 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害，随机弃 1 张牌。`,
    play: (g, c, t, v) => { g.attackAll(v.dmg); if (g.hand.length) g.discardCard(g.game.rng.pick(g.hand)); }
  });
  C('backstab', {
    name: '背刺', color: G, type: 'attack', rarity: 'uncommon', cost: 0, innate: true, exhaust: true, art: '🔪',
    base: { dmg: 11 }, up: { dmg: 15 },
    desc: (v, p) => `<span class="kw">天生</span>。造成 ${p.d('dmg')} 点伤害。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('choke', {
    name: '窒息', color: G, type: 'attack', rarity: 'uncommon', cost: 2, art: '🫁',
    base: { dmg: 12, hp: 3 }, up: { dmg: 12, hp: 5 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。本回合内你每打出一张牌，目标失去 ${p.n('hp')} 点生命。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); if (t && !t.dead) g.addPower(t, 'choke', v.hp); }
  });
  C('dash', {
    name: '冲刺', color: G, type: 'attack', rarity: 'uncommon', cost: 2, art: '💨',
    base: { dmg: 10, blk: 10 }, up: { dmg: 13, blk: 13 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => { g.block(v.blk); g.attack(t, v.dmg); }
  });
  C('endless_agony', {
    name: '无尽痛苦', color: G, type: 'attack', rarity: 'uncommon', cost: 0, exhaust: true, art: '😖',
    base: { dmg: 4 }, up: { dmg: 6 },
    desc: (v, p) => `每当你抽到此牌，将它的一个复制加入手牌。造成 ${p.d('dmg')} 点伤害。<span class="kw">消耗</span>。`,
    onDraw: (g, c) => { if (g.hand.length < 10) { const cp = S.makeCard('endless_agony', c.upg); cp.temp = true; g.hand.push(cp); } },
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('eviscerate', {
    name: '切除', color: G, type: 'attack', rarity: 'uncommon', cost: 3, art: '🩸',
    base: { dmg: 7 }, up: { dmg: 9 },
    dynCost: (g, c) => Math.max(0, 3 - (g.discardedThisTurn || 0)),
    desc: (v, p) => `本回合每弃 1 张牌，此牌能量消耗降低 1 点。造成 ${p.d('dmg')} 点伤害 3 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < 3; i++) g.attack(t, v.dmg); }
  });
  C('finisher', {
    name: '终结技', color: G, type: 'attack', rarity: 'uncommon', cost: 1, art: '🏁',
    base: { dmg: 6 }, up: { dmg: 8 },
    desc: (v, p) => `本回合每打出一张攻击牌，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => { const n = Math.max(0, g.attacksPlayedTurn); for (let i = 0; i < n; i++) g.attack(t, v.dmg); }
  });
  C('flechettes', {
    name: '飞镖', color: G, type: 'attack', rarity: 'uncommon', cost: 1, art: '🏹',
    base: { dmg: 4 }, up: { dmg: 6 },
    desc: (v, p) => `手中每有一张技能牌，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => {
      const n = g.hand.filter((h) => S.cards[h.id].type === 'skill').length;
      for (let i = 0; i < n; i++) g.attack(t, v.dmg);
    }
  });
  C('heel_hook', {
    name: '脚跟钩', color: G, type: 'attack', rarity: 'uncommon', cost: 1, art: '🦶',
    base: { dmg: 5 }, up: { dmg: 8 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若目标处于<span class="kw">虚弱</span>，获得 1 点能量并抽 1 张牌。`,
    play: (g, c, t, v) => { const w = t && t.powers.weak; g.attack(t, v.dmg); if (w) { g.gainEnergy(1); g.draw(1); } }
  });
  C('masterful_stab', {
    name: '熟练之刺', color: G, type: 'attack', rarity: 'uncommon', cost: 3, art: '🗡️',
    base: { dmg: 12 }, up: { dmg: 16 },
    dynCost: (g, c) => Math.max(0, 3 - (g.hpLostCombat || 0)),
    desc: (v, p) => `本场战斗每失去 1 点生命，此牌消耗降低 1 点。造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('predator', {
    name: '掠食者', color: G, type: 'attack', rarity: 'uncommon', cost: 2, art: '🐆',
    base: { dmg: 15 }, up: { dmg: 20 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。下个回合额外抽 2 张牌。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.addPower(g.player, 'draw_next', 2); }
  });
  C('riddle_with_holes', {
    name: '千疮百孔', color: G, type: 'attack', rarity: 'uncommon', cost: 2, art: '🕳️',
    base: { dmg: 3 }, up: { dmg: 4 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害 5 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < 5; i++) g.attack(t, v.dmg); }
  });
  C('skewer', {
    name: '穿刺', color: G, type: 'attack', rarity: 'uncommon', cost: 'X', art: '🍢',
    base: { dmg: 7 }, up: { dmg: 10 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害 X 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < (v.X || 0); i++) g.attack(t, v.dmg); }
  });

  /* ---------------- 稀有攻击 ---------------- */
  C('die_die_die', {
    name: '死死死', color: G, type: 'attack', rarity: 'rare', cost: 1, target: 'none', exhaust: true, art: '💀',
    base: { dmg: 13 }, up: { dmg: 17 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.attackAll(v.dmg)
  });
  C('glass_knife', {
    name: '玻璃刀', color: G, type: 'attack', rarity: 'rare', cost: 1, art: '🔷',
    base: { dmg: 8 }, up: { dmg: 12 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害 2 次。本场战斗中此牌伤害每次降低 2 点。`,
    play: (g, c, t, v) => {
      g.attack(t, Math.max(0, v.dmg)); g.attack(t, Math.max(0, v.dmg));
      c.bonusCombat = c.bonusCombat || {}; c.bonusCombat.dmg = (c.bonusCombat.dmg || 0) - 2;
    }
  });
  C('grand_finale', {
    name: '盛大终章', color: G, type: 'attack', rarity: 'rare', cost: 0, target: 'none', art: '🎆',
    base: { dmg: 50 }, up: { dmg: 60 },
    desc: (v, p) => `只有抽牌堆为空时才能打出。对所有敌人造成 ${p.d('dmg')} 点伤害。`,
    canPlay: (g) => g.drawPile.length === 0,
    play: (g, c, t, v) => g.attackAll(v.dmg)
  });
  C('unload', {
    name: '卸货', color: G, type: 'attack', rarity: 'rare', cost: 1, art: '🔫',
    base: { dmg: 14 }, up: { dmg: 18 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。弃掉手中所有非攻击牌。`,
    play: (g, c, t, v) => {
      g.attack(t, v.dmg);
      g.hand.slice().forEach((h) => { if (S.cards[h.id].type !== 'attack') g.discardCard(h); });
    }
  });

  /* ---------------- 技能 ---------------- */
  C('acrobatics', {
    name: '杂技', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🤸',
    base: { draw: 3 }, up: { draw: 4 },
    desc: (v, p) => `抽 ${p.n('draw')} 张牌，弃 1 张牌。`,
    play: async (g, c, t, v) => { g.draw(v.draw); await discardN(g, 1); }
  });
  C('backflip', {
    name: '后空翻', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🤾',
    base: { blk: 5 }, up: { blk: 8 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，抽 2 张牌。`,
    play: (g, c, t, v) => { g.block(v.blk); g.draw(2); }
  });
  C('blade_dance', {
    name: '刀舞', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🔪',
    base: { n: 3 }, up: { n: 4 },
    desc: (v, p) => `将 ${p.n('n')} 张“飞刀”加入手牌。`,
    play: (g, c, t, v) => g.addCardTo('shiv', 'hand', { count: v.n, upg: g.game.hasRelic('ritual_dagger_x') })
  });
  C('cloak_and_dagger', {
    name: '斗篷与匕首', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🥷',
    base: { blk: 6, n: 1 }, up: { blk: 6, n: 2 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，将 ${p.n('n')} 张“飞刀”加入手牌。`,
    play: (g, c, t, v) => { g.block(v.blk); g.addCardTo('shiv', 'hand', { count: v.n }); }
  });
  C('deadly_poison', {
    name: '致命毒药', color: G, type: 'skill', rarity: 'common', cost: 1, target: 'enemy', art: '🧪',
    base: { poi: 5 }, up: { poi: 7 },
    desc: (v, p) => `给予 ${p.n('poi')} 层<span class="kw">中毒</span>。`,
    play: (g, c, t, v) => g.applyDebuff(t, 'poison', v.poi)
  });
  C('deflect', {
    name: '闪避', color: G, type: 'skill', rarity: 'common', cost: 0, art: '🌀',
    base: { blk: 4 }, up: { blk: 7 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('dodge_and_roll', {
    name: '翻滚', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🎳',
    base: { blk: 4 }, up: { blk: 6 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。下回合获得 ${p.n('blk')} 点格挡。`,
    play: (g, c, t, v) => { g.block(v.blk); g.addPower(g.player, 'next_turn_block', v.blk); }
  });
  C('outmaneuver', {
    name: '调虎离山', color: G, type: 'skill', rarity: 'common', cost: 1, art: '🐅',
    base: { en: 2 }, up: { en: 3 },
    desc: (v, p) => `下个回合获得 ${p.n('en')} 点能量。`,
    play: (g, c, t, v) => g.addPower(g.player, 'energy_next', v.en)
  });
  C('piercing_wail', {
    name: '刺耳尖啸', color: G, type: 'skill', rarity: 'common', cost: 1, exhaust: true, art: '📢',
    base: { str: 6 }, up: { str: 8 },
    desc: (v, p) => `本回合内所有敌人失去 ${p.n('str')} 点<span class="kw">力量</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.enemies().forEach((e) => {
      if (g.applyDebuff(e, 'strength', -v.str)) g.addPower(e, 'shackled', v.str, { silent: true });
    })
  });
  C('prepared', {
    name: '准备', color: G, type: 'skill', rarity: 'common', cost: 0, art: '📋',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `抽 ${p.n('n')} 张牌，弃 ${p.n('n')} 张牌。`,
    play: async (g, c, t, v) => { g.draw(v.n); await discardN(g, v.n); }
  });
  C('blur_card', {
    name: '模糊', color: G, type: 'skill', rarity: 'uncommon', cost: 1, art: '💨',
    base: { blk: 5 }, up: { blk: 8 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。下回合开始时格挡不会消失。`,
    play: (g, c, t, v) => { g.block(v.blk); g.addPower(g.player, 'blur', 1); }
  });
  C('bouncing_flask', {
    name: '弹跳药瓶', color: G, type: 'skill', rarity: 'uncommon', cost: 2, target: 'none', art: '⚗️',
    base: { poi: 3, times: 3 }, up: { poi: 3, times: 4 },
    desc: (v, p) => `随机给予敌人 ${p.n('poi')} 层<span class="kw">中毒</span>，共 ${p.n('times')} 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < v.times; i++) { const e = g.randomEnemy(); if (e) g.applyDebuff(e, 'poison', v.poi); } }
  });
  C('calculated_gamble', {
    name: '精心算计', color: G, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true,
    upFlags: { exhaust: false }, art: '🎲',
    desc: (v, p, c) => `弃掉你的所有手牌，然后抽等量的牌。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: (g) => { const n = g.hand.length; g.hand.slice().forEach((h) => g.discardCard(h)); g.draw(n); }
  });
  C('catalyst', {
    name: '催化剂', color: G, type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', exhaust: true, art: '🧫',
    base: { mult: 2 }, up: { mult: 3 },
    desc: (v, p) => `将目标的<span class="kw">中毒</span>层数变为 ${p.n('mult')} 倍。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { if (t && t.powers.poison) g.applyDebuff(t, 'poison', t.powers.poison * (v.mult - 1)); }
  });
  C('concentrate', {
    name: '专注', color: G, type: 'skill', rarity: 'uncommon', cost: 0, art: '🧘',
    base: { n: 3 }, up: { n: 2 },
    desc: (v, p) => `弃 ${p.n('n')} 张牌，获得 2 点能量。`,
    play: async (g, c, t, v) => { await discardN(g, v.n); g.gainEnergy(2); }
  });
  C('crippling_cloud', {
    name: '致残毒云', color: G, type: 'skill', rarity: 'uncommon', cost: 2, target: 'none', exhaust: true, art: '☁️',
    base: { poi: 4, weak: 2 }, up: { poi: 7, weak: 2 },
    desc: (v, p) => `给予所有敌人 ${p.n('poi')} 层<span class="kw">中毒</span>和 ${p.n('weak')} 层<span class="kw">虚弱</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.enemies().forEach((e) => { g.applyDebuff(e, 'poison', v.poi); g.applyDebuff(e, 'weak', v.weak); })
  });
  C('distraction', {
    name: '分散注意', color: G, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, exhaust: true, art: '🎭',
    desc: () => '将一张随机技能牌加入手牌，本回合它的消耗为 0。<span class="kw">消耗</span>。',
    play: (g) => {
      const pool = Object.keys(S.cards).filter((k) => {
        const d = S.cards[k];
        return d.type === 'skill' && d.color === g.game.charColor && d.rarity !== 'basic' && d.rarity !== 'special' && !d.noPool;
      });
      g.addCardTo(g.game.rng.pick(pool), 'hand', { costTurn: 0 });
    }
  });
  C('escape_plan', {
    name: '逃跑计划', color: G, type: 'skill', rarity: 'uncommon', cost: 0, art: '🚪',
    base: { blk: 3 }, up: { blk: 5 },
    desc: (v, p) => `抽 1 张牌。若抽到的是技能牌，获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => {
      const d = g.draw(1);
      if (d[0] && S.cards[d[0].id].type === 'skill') g.block(v.blk);
    }
  });
  C('expertise', {
    name: '专精', color: G, type: 'skill', rarity: 'uncommon', cost: 1, art: '📚',
    base: { n: 6 }, up: { n: 7 },
    desc: (v, p) => `抽牌直到手中有 ${p.n('n')} 张牌。`,
    play: (g, c, t, v) => { const need = v.n - g.hand.length; if (need > 0) g.draw(need); }
  });
  C('leg_sweep', {
    name: '扫腿', color: G, type: 'skill', rarity: 'uncommon', cost: 2, target: 'enemy', art: '🦿',
    base: { weak: 2, blk: 11 }, up: { weak: 3, blk: 14 },
    desc: (v, p) => `给予 ${p.n('weak')} 层<span class="kw">虚弱</span>，获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => { g.applyDebuff(t, 'weak', v.weak); g.block(v.blk); }
  });
  C('reflex', {
    name: '反射', color: G, type: 'skill', rarity: 'uncommon', cost: -2, unplayable: true, art: '🪞',
    base: { draw: 2 }, up: { draw: 3 },
    desc: (v, p) => `无法打出。若此牌被弃掉，抽 ${p.n('draw')} 张牌。`,
    onDiscard: (g, c) => { g.draw(S.cardVals(c).draw); }
  });
  C('setup', {
    name: '布置', color: G, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, art: '🎬',
    desc: () => '将手中一张牌置于抽牌堆顶部，在打出前它的消耗为 0。',
    play: async (g, c, t, v) => {
      if (!g.hand.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌置于抽牌堆顶（消耗变为 0）' });
      if (sel[0]) { sel[0].costCombat = 0; g.moveCard(sel[0], 'draw'); }
    }
  });
  C('tactician', {
    name: '战术家', color: G, type: 'skill', rarity: 'uncommon', cost: -2, unplayable: true, art: '🎖️',
    base: { en: 1 }, up: { en: 2 },
    desc: (v, p) => `无法打出。若此牌被弃掉，获得 ${p.n('en')} 点能量。`,
    onDiscard: (g, c) => { g.gainEnergy(S.cardVals(c).en); }
  });
  C('terror', {
    name: '恐惧', color: G, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, target: 'enemy', exhaust: true, art: '😱',
    desc: () => '给予目标 99 层<span class="kw">易伤</span>。<span class="kw">消耗</span>。',
    play: (g, c, t) => g.applyDebuff(t, 'vulnerable', 99)
  });
  C('adrenaline', {
    name: '肾上腺素', color: G, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, art: '💉',
    base: { en: 1 }, up: { en: 2 },
    desc: (v, p) => `获得 ${p.n('en')} 点能量，抽 2 张牌。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { g.gainEnergy(v.en); g.draw(2); }
  });
  C('alchemize', {
    name: '炼金', color: G, type: 'skill', rarity: 'rare', cost: 1, upCost: 0, exhaust: true, art: '⚗️',
    desc: () => '获得一瓶随机药水。<span class="kw">消耗</span>。',
    play: (g) => { g.game.gainRandomPotion(); }
  });
  C('bullet_time', {
    name: '弹幕时间', color: G, type: 'skill', rarity: 'rare', cost: 3, upCost: 2, art: '⏱️',
    desc: () => '本回合无法抽牌，手中所有牌的消耗变为 0。',
    play: (g) => {
      g.hand.forEach((h) => { h.costTurn = 0; });
      g.addPower(g.player, 'no_draw', 1, { silent: true });
    }
  });
  C('burst_card', {
    name: '爆发', color: G, type: 'skill', rarity: 'rare', cost: 1, art: '🔂',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `本回合内接下来的 ${p.n('n')} 张技能牌打出两次。`,
    play: (g, c, t, v) => g.addPower(g.player, 'burst', v.n)
  });
  C('corpse_explosion', {
    name: '尸爆', color: G, type: 'skill', rarity: 'rare', cost: 2, target: 'enemy', art: '💥',
    base: { poi: 6 }, up: { poi: 9 },
    desc: (v, p) => `给予 ${p.n('poi')} 层<span class="kw">中毒</span>。目标死亡时对所有敌人造成等同于其最大生命的伤害。`,
    play: (g, c, t, v) => { g.applyDebuff(t, 'poison', v.poi); if (t) g.addPower(t, 'corpse_explosion', 1); }
  });
  C('doppelganger', {
    name: '二重身', color: G, type: 'skill', rarity: 'rare', cost: 'X', art: '👥',
    base: { plus: 0 }, up: { plus: 1 },
    desc: (v, p) => `下个回合抽 X${v.plus ? '+1' : ''} 张牌并获得 X${v.plus ? '+1' : ''} 点能量。`,
    play: (g, c, t, v) => {
      const n = (v.X || 0) + (v.plus || 0);
      if (n > 0) { g.addPower(g.player, 'draw_next', n); g.addPower(g.player, 'energy_next', n); }
    }
  });
  C('malaise', {
    name: '萎靡', color: G, type: 'skill', rarity: 'rare', cost: 'X', target: 'enemy', exhaust: true, art: '🤢',
    base: { plus: 0 }, up: { plus: 1 },
    desc: (v, p) => `目标失去 X${v.plus ? '+1' : ''} 点<span class="kw">力量</span>并获得 X${v.plus ? '+1' : ''} 层<span class="kw">虚弱</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const n = (v.X || 0) + (v.plus || 0);
      if (n > 0 && t) { g.applyDebuff(t, 'strength', -n); g.applyDebuff(t, 'weak', n); }
    }
  });
  C('nightmare', {
    name: '噩梦', color: G, type: 'skill', rarity: 'rare', cost: 3, upCost: 2, exhaust: true, art: '🌙',
    desc: () => '选择一张牌，下个回合将它的 3 个复制加入手牌。<span class="kw">消耗</span>。',
    play: async (g, c, t, v) => {
      if (!g.hand.length) { g.toast('手牌为空'); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌（下回合获得 3 个复制）' });
      if (sel[0]) { g.nightmareId = sel[0].id; g.nightmareUpg = sel[0].upg; g.addPower(g.player, 'nightmare', 3); }
    }
  });
  S.powers.nightmare.onTurnStart = function (g, o, n) {
    if (g.nightmareId) {
      for (let i = 0; i < n; i++) g.addCardTo(g.nightmareId, 'hand', { upg: g.nightmareUpg });
      g.nightmareId = null;
    }
    g.removePower(o, 'nightmare');
  };
  C('phantasmal_killer', {
    name: '幻影杀手', color: G, type: 'skill', rarity: 'rare', cost: 1, upCost: 0, art: '🎭',
    desc: () => '下个回合，你的攻击造成双倍伤害。',
    play: (g) => g.addPower(g.player, 'phantasmal', 1)
  });
  C('storm_of_steel', {
    name: '钢铁风暴', color: G, type: 'skill', rarity: 'rare', cost: 1, art: '🌪️',
    desc: (v, p, c) => `弃掉你的所有手牌，每弃 1 张牌就将 1 张${c && c.upg ? '<b class="up">升级后的</b>' : ''}“飞刀”加入手牌。`,
    play: (g, c, t, v) => {
      const n = g.hand.length;
      g.hand.slice().forEach((h) => g.discardCard(h));
      g.addCardTo('shiv', 'hand', { count: n, upg: c.upg });
    }
  });

  /* ---------------- 能力牌 ---------------- */
  C('accuracy_card', {
    name: '精准', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '🎯',
    base: { n: 4 }, up: { n: 6 },
    desc: (v, p) => `“飞刀”额外造成 ${p.n('n')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'accuracy', v.n)
  });
  C('caltrops', {
    name: '铁蒺藜', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '🌵',
    base: { n: 3 }, up: { n: 5 },
    desc: (v, p) => `每当你受到攻击，对攻击者造成 ${p.n('n')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'thorns', v.n)
  });
  C('footwork', {
    name: '步法', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '👣',
    base: { n: 2 }, up: { n: 3 },
    desc: (v, p) => `获得 ${p.n('n')} 点<span class="kw">敏捷</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'dexterity', v.n)
  });
  C('infinite_blades_card', {
    name: '无限之刃', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '🗡️',
    upFlags: { innate: true },
    desc: (v, p, c) => `${c && c.upg ? '<b class="up">天生</b>。' : ''}每回合开始时将 1 张“飞刀”加入手牌。`,
    play: (g) => g.addPower(g.player, 'infinite_blades', 1)
  });
  C('noxious_fumes_card', {
    name: '毒气', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '🌫️',
    base: { n: 2 }, up: { n: 3 },
    desc: (v, p) => `每回合开始时给予所有敌人 ${p.n('n')} 层<span class="kw">中毒</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'noxious_fumes', v.n)
  });
  C('well_laid_plans_card', {
    name: '妙计', color: G, type: 'power', rarity: 'uncommon', cost: 1, art: '📜',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `每回合结束时最多保留 ${p.n('n')} 张手牌。`,
    play: (g, c, t, v) => g.addPower(g.player, 'well_laid_plans', v.n)
  });
  C('a_thousand_cuts', {
    name: '千刀万剐', color: G, type: 'power', rarity: 'rare', cost: 2, art: '🔪',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `每当你打出一张牌，对所有敌人造成 ${p.n('n')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'thousand_cuts', v.n)
  });
  C('after_image_card', {
    name: '残影', color: G, type: 'power', rarity: 'rare', cost: 1, art: '🌘',
    upFlags: { innate: true },
    desc: (v, p, c) => `${c && c.upg ? '<b class="up">天生</b>。' : ''}每当你打出一张牌，获得 1 点格挡。`,
    play: (g) => g.addPower(g.player, 'after_image', 1)
  });
  C('envenom_card', {
    name: '剧毒', color: G, type: 'power', rarity: 'rare', cost: 2, upCost: 1, art: '🧪',
    desc: () => '每当你的攻击造成未被格挡的伤害，给予 1 层<span class="kw">中毒</span>。',
    play: (g) => g.addPower(g.player, 'envenom', 1)
  });
  C('tools_of_the_trade_card', {
    name: '行业工具', color: G, type: 'power', rarity: 'rare', cost: 1, upCost: 0, art: '🧰',
    desc: () => '每回合开始时抽 1 张牌并弃 1 张牌。',
    play: (g) => g.addPower(g.player, 'tools_of_the_trade', 1)
  });
  C('wraith_form_card', {
    name: '幽灵形态', color: G, type: 'power', rarity: 'rare', cost: 3, art: '🌫️',
    base: { n: 2 }, up: { n: 3 },
    desc: (v, p) => `获得 ${p.n('n')} 层<span class="kw">无形</span>。每回合结束时失去 1 点<span class="kw">敏捷</span>。`,
    play: (g, c, t, v) => { g.addPower(g.player, 'intangible', v.n); g.addPower(g.player, 'wraith_form', 1); }
  });

  /* 附加能力：窒息 / 尸爆 */
  S.defPower('choke', {
    name: '窒息', type: 'debuff', icon: '🫁',
    desc: (n) => `本回合你每打出一张牌，此敌人失去 ${n} 点生命。`,
    onTurnEnd: (g, o) => g.removePower(o, 'choke')
  });
  S.defPower('corpse_explosion', {
    name: '尸爆', type: 'debuff', icon: '💥',
    desc: () => '死亡时对所有敌人造成等同于其最大生命的伤害。',
    onDeath: (g, o, n) => {
      g.enemies().forEach((e) => g.dealDamage(null, e, o.maxHp, { fromPower: true, raw: false }));
    }
  });
})();
