/* ================= potions.js · 药水 ================= */
(function () {
  'use strict';
  const S = window.STS, P = S.defPotion;
  /* use(game, cmb, target, m)  m = 效果倍率（神圣树皮 = 2） */

  /* ---------------- 普通 ---------------- */
  P('block_potion', {
    name: '格挡药水', tier: 'common', icon: '🔵', combatOnly: true,
    desc: (m) => `获得 ${12 * m} 点格挡。`,
    use: (g, c, t, m) => c.block(12 * m)
  });
  P('fire_potion', {
    name: '火焰药水', tier: 'common', icon: '🔥', combatOnly: true, target: 'enemy',
    desc: (m) => `对目标造成 ${20 * m} 点伤害。`,
    use: (g, c, t, m) => c.dealDamage(c.player, t, 20 * m, { isAttack: true })
  });
  P('explosive_potion', {
    name: '爆炸药水', tier: 'common', icon: '💥', combatOnly: true,
    desc: (m) => `对所有敌人造成 ${10 * m} 点伤害。`,
    use: (g, c, t, m) => c.dealDamageAll(c.player, 10 * m, { isAttack: true })
  });
  P('energy_potion', {
    name: '能量药水', tier: 'common', icon: '🔋', combatOnly: true,
    desc: (m) => `获得 ${2 * m} 点能量。`,
    use: (g, c, t, m) => c.gainEnergy(2 * m)
  });
  P('swift_potion', {
    name: '迅捷药水', tier: 'common', icon: '🌬️', combatOnly: true,
    desc: (m) => `抽 ${3 * m} 张牌。`,
    use: (g, c, t, m) => c.draw(3 * m)
  });
  P('strength_potion', {
    name: '力量药水', tier: 'common', icon: '💪', combatOnly: true,
    desc: (m) => `获得 ${2 * m} 点力量。`,
    use: (g, c, t, m) => c.addPower(c.player, 'strength', 2 * m)
  });
  P('dexterity_potion', {
    name: '敏捷药水', tier: 'common', icon: '🏃', combatOnly: true,
    desc: (m) => `获得 ${2 * m} 点敏捷。`,
    use: (g, c, t, m) => c.addPower(c.player, 'dexterity', 2 * m)
  });
  P('flex_potion', {
    name: '屈伸药水', tier: 'common', icon: '🦾', combatOnly: true,
    desc: (m) => `获得 ${5 * m} 点力量，回合结束时失去同样数值。`,
    use: (g, c, t, m) => { c.addPower(c.player, 'strength', 5 * m); c.addPower(c.player, 'str_down', 5 * m, { silent: true }); }
  });
  P('speed_potion', {
    name: '迅疾药水', tier: 'common', icon: '👟', combatOnly: true,
    desc: (m) => `获得 ${5 * m} 点敏捷，回合结束时失去同样数值。`,
    use: (g, c, t, m) => { c.addPower(c.player, 'dexterity', 5 * m); c.addPower(c.player, 'dex_down', 5 * m, { silent: true }); }
  });
  P('weak_potion', {
    name: '虚弱药水', tier: 'common', icon: '🥀', combatOnly: true, target: 'enemy',
    desc: (m) => `给予目标 ${3 * m} 层虚弱。`,
    use: (g, c, t, m) => c.applyDebuff(t, 'weak', 3 * m)
  });
  P('fear_potion', {
    name: '恐惧药水', tier: 'common', icon: '😱', combatOnly: true, target: 'enemy',
    desc: (m) => `给予目标 ${3 * m} 层易伤。`,
    use: (g, c, t, m) => c.applyDebuff(t, 'vulnerable', 3 * m)
  });
  P('ancient_potion', {
    name: '远古药水', tier: 'common', icon: '🏺', combatOnly: true,
    desc: (m) => `获得 ${1 * m} 层神器。`,
    use: (g, c, t, m) => c.addPower(c.player, 'artifact', 1 * m)
  });
  P('blood_potion', {
    name: '鲜血药水', tier: 'common', icon: '🩸', char: 'red',
    desc: (m) => `恢复 ${20 * m}% 最大生命。`,
    use: (g, c, t, m) => g.healPlayer(Math.floor(g.pc.maxHp * 0.2 * m))
  });
  P('blessing_of_the_forge', {
    name: '锻造祝福', tier: 'common', icon: '⚒️', combatOnly: true,
    desc: () => '升级你手中的所有卡牌（本场战斗）。',
    use: (g, c) => { c.hand.forEach((h) => { if (S.canUpgrade(h)) { h.tempUpg = true; S.upgradeCard(h); } }); }
  });
  P('attack_potion', {
    name: '攻击药水', tier: 'common', icon: '⚔️', combatOnly: true,
    desc: () => '从 3 张随机攻击牌中选 1 张加入手牌，本回合消耗为 0。',
    use: async (g, c) => {
      const pool = g.rng.sample(g.cardPool('attack', true), 3).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(c, { from: pool, n: 1, prompt: '选择一张攻击牌', virtual: true });
      if (sel[0]) c.addCardTo(sel[0].id, 'hand', { costTurn: 0 });
    }
  });
  P('skill_potion', {
    name: '技能药水', tier: 'common', icon: '📜', combatOnly: true,
    desc: () => '从 3 张随机技能牌中选 1 张加入手牌，本回合消耗为 0。',
    use: async (g, c) => {
      const pool = g.rng.sample(g.cardPool('skill', true), 3).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(c, { from: pool, n: 1, prompt: '选择一张技能牌', virtual: true });
      if (sel[0]) c.addCardTo(sel[0].id, 'hand', { costTurn: 0 });
    }
  });
  P('power_potion', {
    name: '能力药水', tier: 'common', icon: '🔮', combatOnly: true,
    desc: () => '从 3 张随机能力牌中选 1 张加入手牌，本回合消耗为 0。',
    use: async (g, c) => {
      const pool = g.rng.sample(g.cardPool('power', true), 3).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(c, { from: pool, n: 1, prompt: '选择一张能力牌', virtual: true });
      if (sel[0]) c.addCardTo(sel[0].id, 'hand', { costTurn: 0 });
    }
  });
  P('colorless_potion', {
    name: '无色药水', tier: 'common', icon: '⚪', combatOnly: true,
    desc: () => '从 3 张随机无色牌中选 1 张加入手牌，本回合消耗为 0。',
    use: async (g, c) => {
      const pool = g.rng.sample(g.colorlessPool(), 3).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(c, { from: pool, n: 1, prompt: '选择一张无色牌', virtual: true });
      if (sel[0]) c.addCardTo(sel[0].id, 'hand', { costTurn: 0 });
    }
  });

  /* ---------------- 罕见 ---------------- */
  P('poison_potion', {
    name: '毒药', tier: 'uncommon', icon: '☠️', combatOnly: true, target: 'enemy',
    desc: (m) => `给予目标 ${6 * m} 层中毒。`,
    use: (g, c, t, m) => c.applyDebuff(t, 'poison', 6 * m)
  });
  P('regen_potion', {
    name: '再生药水', tier: 'uncommon', icon: '💗', combatOnly: true,
    desc: (m) => `获得 ${5 * m} 层再生。`,
    use: (g, c, t, m) => c.addPower(c.player, 'regen', 5 * m)
  });
  P('liquid_bronze', {
    name: '液态青铜', tier: 'uncommon', icon: '🥉', combatOnly: true,
    desc: (m) => `获得 ${3 * m} 点荆棘。`,
    use: (g, c, t, m) => c.addPower(c.player, 'thorns', 3 * m)
  });
  P('essence_of_steel', {
    name: '钢铁精华', tier: 'uncommon', icon: '🔩', combatOnly: true,
    desc: (m) => `获得 ${4 * m} 层镀层。`,
    use: (g, c, t, m) => c.addPower(c.player, 'plated_armor', 4 * m)
  });
  P('duplication_potion', {
    name: '复制药水', tier: 'uncommon', icon: '🔁', combatOnly: true,
    desc: (m) => `本回合接下来的 ${1 * m} 张牌打出两次。`,
    use: (g, c, t, m) => { c.addPower(c.player, 'double_tap', m); c.addPower(c.player, 'burst', m); }
  });
  P('distilled_chaos', {
    name: '蒸馏混沌', tier: 'uncommon', icon: '🌀', combatOnly: true,
    desc: (m) => `打出抽牌堆顶部的 ${3 * m} 张牌。`,
    use: async (g, c, t, m) => {
      for (let i = 0; i < 3 * m; i++) {
        if (!c.drawPile.length) c.reshuffle();
        const top = c.drawPile.pop();
        if (!top) break;
        c.hand.push(top);
        await c.autoPlay(top);
        await S.wait(180);
      }
    }
  });
  P('liquid_memories', {
    name: '液态回忆', tier: 'uncommon', icon: '💭', combatOnly: true,
    desc: (m) => `将弃牌堆中的 ${1 * m} 张牌返回手中，本回合消耗为 0。`,
    use: async (g, c, t, m) => {
      if (!c.discardPile.length) return;
      const sel = await S.UI.chooseCards(c, { from: c.discardPile.slice(), n: Math.min(m, c.discardPile.length), prompt: '选择返回手中的牌' });
      sel.forEach((x) => { x.costTurn = 0; c.moveCard(x, 'hand'); });
    }
  });
  P('gamblers_brew', {
    name: '赌徒酿造', tier: 'uncommon', icon: '🎰', combatOnly: true,
    desc: () => '弃掉任意数量的牌，然后抽取等量的牌。',
    use: async (g, c) => {
      if (!c.hand.length) return;
      const sel = await S.UI.chooseCards(c, { from: c.hand.slice(), n: c.hand.length, prompt: '选择要弃掉的牌', canSkip: true, upTo: true });
      sel.forEach((x) => c.discardCard(x));
      c.draw(sel.length);
    }
  });
  P('elixir', {
    name: '万灵酒', tier: 'uncommon', icon: '🍷', combatOnly: true, char: 'red',
    desc: () => '消耗手中任意数量的牌。',
    use: async (g, c) => {
      if (!c.hand.length) return;
      const sel = await S.UI.chooseCards(c, { from: c.hand.slice(), n: c.hand.length, prompt: '选择要消耗的牌', canSkip: true, upTo: true });
      sel.forEach((x) => c.exhaustCard(x));
    }
  });
  P('cunning_potion', {
    name: '狡诈药水', tier: 'uncommon', icon: '🔪', combatOnly: true, char: 'green',
    desc: (m) => `将 ${3 * m} 张升级后的“飞刀”加入手牌。`,
    use: (g, c, t, m) => c.addCardTo('shiv', 'hand', { count: 3 * m, upg: 1 })
  });

  /* ---------------- 稀有 ---------------- */
  P('fruit_juice', {
    name: '果汁', tier: 'rare', icon: '🧃',
    desc: (m) => `最大生命提高 ${5 * m} 点。`,
    use: (g, c, t, m) => g.addMaxHp(5 * m)
  });
  P('cultist_potion', {
    name: '教徒药水', tier: 'rare', icon: '🕯️', combatOnly: true,
    desc: (m) => `获得 ${1 * m} 层仪式（每回合结束时获得力量）。`,
    use: (g, c, t, m) => c.addPower(c.player, 'ritual', 1 * m)
  });
  P('entropic_brew', {
    name: '熵酿造', tier: 'rare', icon: '🌌',
    desc: () => '用随机药水填满你所有空的药水栏位。',
    use: (g) => { while (g.potions.length < g.potionSlots) { if (!g.gainRandomPotion(true)) break; } }
  });
  P('fairy_in_a_bottle', {
    name: '瓶中仙子', tier: 'rare', icon: '🧚', passive: true,
    desc: (m) => `当你死亡时自动使用，恢复 ${30 * m}% 最大生命。`,
    use: () => { }
  });
  P('smoke_bomb', {
    name: '烟雾弹', tier: 'rare', icon: '💨', combatOnly: true,
    desc: () => '从非首领战斗中逃跑（不获得奖励）。',
    use: (g, c) => {
      if (c.isBoss) { c.toast('无法从首领战中逃跑！'); return false; }
      c.over = true; c.won = false;
      setTimeout(() => g.escapeCombat(), 400);
    }
  });
  P('snecko_oil', {
    name: '蛇油', tier: 'rare', icon: '🛢️', combatOnly: true,
    desc: (m) => `抽 ${5 * m} 张牌，并随机化手中所有牌的消耗。`,
    use: (g, c, t, m) => {
      c.draw(5 * m);
      c.hand.forEach((h) => { const cc = S.cardCost(h); if (typeof cc === 'number' && cc >= 0) h.costCombat = g.rng.int(4); });
    }
  });
  P('heart_of_iron', {
    name: '钢铁之心', tier: 'rare', icon: '❤️‍🔥', combatOnly: true, char: 'red',
    desc: (m) => `获得 ${6 * m} 层金属化。`,
    use: (g, c, t, m) => c.addPower(c.player, 'metallicize', 6 * m)
  });
  P('ghost_in_a_jar', {
    name: '罐中之魂', tier: 'rare', icon: '👻', combatOnly: true, char: 'green',
    desc: (m) => `获得 ${3 * m} 层无形。`,
    use: (g, c, t, m) => c.addPower(c.player, 'intangible', 3 * m)
  });
})();
