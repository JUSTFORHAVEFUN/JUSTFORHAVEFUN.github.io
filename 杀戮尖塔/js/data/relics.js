/* ================= relics.js · 遗物 =================
 * 钩子签名统一为 (game, cmb, ...args)
 * 常用钩子：onEquip / onCombatStart / onTurnStart / onTurnStartPostDraw / onTurnEnd
 *   onCardPlayed / onAttacked / onLoseHp / onEnemyKilled / onShuffle / onCardDrawn
 *   onCardDiscarded / onExhaust / onCombatEnd / onUnblockedDamage / onRest / onFloor
 * 修正钩子：atDamageGive / atDamageReceive / atBlockGain / energy / draw
 * ============================================================= */
(function () {
  'use strict';
  const S = window.STS, R = S.defRelic;
  const cnt = (g, id) => (g.relicCounters[id] = g.relicCounters[id] || 0);
  const inc = (g, id, n) => (g.relicCounters[id] = (g.relicCounters[id] || 0) + (n === undefined ? 1 : n));

  /* ================= 初始遗物 ================= */
  R('burning_blood', {
    name: '燃烧之血', tier: 'starter', icon: '🩸', char: 'red',
    desc: '战斗结束时恢复 6 点生命。', flavor: '你的血液在燃烧。',
    onCombatEnd: (g, c) => g.healPlayer(6)
  });
  R('ring_of_the_snake', {
    name: '蛇之戒', tier: 'starter', icon: '💍', char: 'green',
    desc: '每场战斗开始时，额外抽 2 张牌。', flavor: '蛇之环。',
    draw: 2
  });

  /* ================= 普通遗物 ================= */
  R('akabeko', {
    name: '赤牛玩具', tier: 'common', icon: '🐮',
    desc: '你每场战斗打出的第一张攻击牌额外造成 8 点伤害。',
    onCombatStart: (g, c) => { g.relicCounters.akabeko = 1; },
    atDamageGive: (g, c, dmg, ctx) => (ctx.isAttack && ctx.fromCard && g.relicCounters.akabeko ? dmg + 8 : dmg),
    onCardPlayed: (g, c, card, def) => { if (def.type === 'attack') g.relicCounters.akabeko = 0; }
  });
  R('anchor', {
    name: '锚', tier: 'common', icon: '⚓',
    desc: '每场战斗开始时获得 10 点格挡。',
    onCombatStart: (g, c) => c.gainBlock(c.player, 10, { noPower: true })
  });
  R('ancient_tea_set', {
    name: '古董茶具', tier: 'common', icon: '🫖',
    desc: '每当你在营火休息后，下一场战斗开始时获得 2 点额外能量。',
    onRest: (g) => { g.flags.teaSet = true; },
    onCombatStart: (g, c) => { if (g.flags.teaSet) { g.flags.teaSet = false; g.flags.teaSetActive = true; } }
  });
  R('art_of_war', {
    name: '战争的艺术', tier: 'common', icon: '📕',
    desc: '若你在某个回合内没有打出攻击牌，下个回合获得 1 点额外能量。',
    onCombatStart: (g) => { g.relicCounters.art_of_war = 1; },
    onCardPlayed: (g, c, card, def) => { if (def.type === 'attack') g.relicCounters.art_of_war = 0; },
    onTurnStart: (g, c) => {
      if (g.relicCounters.art_of_war && c.turn > 1) { c.energy++; c.toast('战争的艺术：+1 能量'); }
      g.relicCounters.art_of_war = 1;
    }
  });
  R('bag_of_marbles', {
    name: '弹珠袋', tier: 'common', icon: '🔮',
    desc: '每场战斗开始时，给予所有敌人 1 层易伤。',
    onCombatStart: (g, c) => c.enemies().forEach((e) => c.applyDebuff(e, 'vulnerable', 1))
  });
  R('bag_of_preparation', {
    name: '准备行囊', tier: 'common', icon: '🎒',
    desc: '每场战斗开始时，额外抽 2 张牌。', draw: 2
  });
  R('blood_vial', {
    name: '血瓶', tier: 'common', icon: '🧫',
    desc: '每场战斗开始时恢复 2 点生命。',
    onCombatStart: (g, c) => c.heal(c.player, 2)
  });
  R('bronze_scales', {
    name: '青铜鳞片', tier: 'common', icon: '🥉',
    desc: '每场战斗开始时获得 3 点荆棘。',
    onCombatStart: (g, c) => c.addPower(c.player, 'thorns', 3)
  });
  R('centennial_puzzle', {
    name: '百年拼图', tier: 'common', icon: '🧩',
    desc: '每场战斗中你第一次失去生命时，抽 3 张牌。',
    onCombatStart: (g) => { g.relicCounters.centennial_puzzle = 1; },
    onLoseHp: (g, c) => { if (g.relicCounters.centennial_puzzle) { g.relicCounters.centennial_puzzle = 0; c.draw(3); } }
  });
  R('ceramic_fish', {
    name: '陶瓷鱼', tier: 'common', icon: '🐟',
    desc: '每当你将一张卡牌加入牌组，获得 9 金币。',
    onAddCard: (g) => g.gainGold(9)
  });
  R('dream_catcher', {
    name: '捕梦网', tier: 'common', icon: '🕸️',
    desc: '每当你在营火休息，可以获得一张卡牌。'
  });
  R('happy_flower', {
    name: '快乐之花', tier: 'common', icon: '🌻', counter: 3,
    desc: '每 3 个回合获得 1 点能量。',
    onTurnStart: (g, c) => {
      inc(g, 'happy_flower');
      if (g.relicCounters.happy_flower >= 3) { g.relicCounters.happy_flower = 0; c.energy++; c.toast('快乐之花：+1 能量'); }
    }
  });
  R('juzu_bracelet', {
    name: '念珠手链', tier: 'common', icon: '📿',
    desc: '“？”房间不会再出现普通战斗。'
  });
  R('lantern', {
    name: '提灯', tier: 'common', icon: '🏮',
    desc: '每场战斗的第一个回合获得 1 点能量。',
    onTurnStart: (g, c) => { if (c.turn === 1) c.energy++; }
  });
  R('maw_bank', {
    name: '大嘴银行', tier: 'common', icon: '🏦',
    desc: '每当你爬上一层，获得 12 金币。在商店消费后失效。',
    onFloor: (g) => { if (!g.flags.mawBankDead) g.gainGold(12); }
  });
  R('meal_ticket', {
    name: '餐券', tier: 'common', icon: '🎫',
    desc: '每当你进入商店，恢复 15 点生命。'
  });
  R('nunchaku', {
    name: '双节棍', tier: 'common', icon: '🥢', counter: 10,
    desc: '每打出 10 张攻击牌，获得 1 点能量。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'attack') return;
      inc(g, 'nunchaku');
      if (g.relicCounters.nunchaku >= 10) { g.relicCounters.nunchaku = 0; c.energy++; c.toast('双节棍：+1 能量'); }
    }
  });
  R('oddly_smooth_stone', {
    name: '异常光滑的石头', tier: 'common', icon: '⚪',
    desc: '每场战斗开始时获得 1 点敏捷。',
    onCombatStart: (g, c) => c.addPower(c.player, 'dexterity', 1)
  });
  R('omamori', {
    name: '御守', tier: 'common', icon: '🧿', counter: 2,
    desc: '抵挡接下来获得的 2 个诅咒。',
    onEquip: (g) => { g.relicCounters.omamori = 2; }
  });
  R('orichalcum', {
    name: '山铜', tier: 'common', icon: '🟡',
    desc: '若你在回合结束时没有格挡，获得 6 点格挡。',
    onTurnEnd: (g, c) => { if (c.player.block === 0) c.gainBlock(c.player, 6, { noPower: true }); }
  });
  R('pen_nib', {
    name: '笔尖', tier: 'common', icon: '🖊️', counter: 10,
    desc: '你打出的第 10 张攻击牌造成双倍伤害。',
    atDamageGive: (g, c, dmg, ctx) => (ctx.isAttack && ctx.fromCard && (g.relicCounters.pen_nib || 0) >= 9 ? dmg * 2 : dmg),
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'attack') return;
      inc(g, 'pen_nib');
      if (g.relicCounters.pen_nib >= 10) g.relicCounters.pen_nib = 0;
    }
  });
  R('potion_belt', {
    name: '药水腰带', tier: 'common', icon: '🎽',
    desc: '获得时，药水栏位增加 2 个。',
    onEquip: (g) => { g.potionSlots += 2; }
  });
  R('preserved_insect', {
    name: '保存的昆虫', tier: 'common', icon: '🦗',
    desc: '精英房间中的敌人生命值降低 25%。'
  });
  R('regal_pillow', {
    name: '豪华枕头', tier: 'common', icon: '🛏️',
    desc: '在营火休息时额外恢复 15 点生命。'
  });
  R('smiling_mask', {
    name: '微笑面具', tier: 'common', icon: '😊',
    desc: '商人的移除卡牌服务永远只需 50 金币。'
  });
  R('strawberry', {
    name: '草莓', tier: 'common', icon: '🍓',
    desc: '最大生命值提高 7 点。',
    onEquip: (g) => g.addMaxHp(7)
  });
  R('the_boot', {
    name: '靴子', tier: 'common', icon: '🥾',
    desc: '当你造成 4 点或更少的未被格挡攻击伤害时，将其提高至 5 点。'
  });
  R('tiny_chest', {
    name: '小宝箱', tier: 'common', icon: '📦', counter: 4,
    desc: '每 4 个“？”房间中的第 4 个会是宝箱房间。'
  });
  R('toy_ornithopter', {
    name: '玩具扑翼机', tier: 'common', icon: '🚁',
    desc: '每当你使用药水，恢复 5 点生命。',
    onUsePotion: (g) => g.healPlayer(5)
  });
  R('vajra', {
    name: '金刚杵', tier: 'common', icon: '🔱',
    desc: '每场战斗开始时获得 1 点力量。',
    onCombatStart: (g, c) => c.addPower(c.player, 'strength', 1)
  });
  R('war_paint', {
    name: '战争涂装', tier: 'common', icon: '🎨',
    desc: '获得时，升级 2 张随机技能牌。',
    onEquip: (g) => g.upgradeRandom('skill', 2)
  });
  R('whetstone', {
    name: '磨刀石', tier: 'common', icon: '🪨',
    desc: '获得时，升级 2 张随机攻击牌。',
    onEquip: (g) => g.upgradeRandom('attack', 2)
  });

  /* ================= 罕见遗物 ================= */
  R('blue_candle', {
    name: '蓝色蜡烛', tier: 'uncommon', icon: '🕯️',
    desc: '诅咒牌现在可以被打出。打出诅咒牌会使你失去 1 点生命并消耗该牌。'
  });
  R('bottled_flame', {
    name: '瓶装火焰', tier: 'uncommon', icon: '🔥',
    desc: '选择一张攻击牌。每场战斗开始时它都会在你的起始手牌中。', bottle: 'attack'
  });
  R('bottled_lightning', {
    name: '瓶装闪电', tier: 'uncommon', icon: '⚡',
    desc: '选择一张技能牌。每场战斗开始时它都会在你的起始手牌中。', bottle: 'skill'
  });
  R('bottled_tornado', {
    name: '瓶装旋风', tier: 'uncommon', icon: '🌪️',
    desc: '选择一张能力牌。每场战斗开始时它都会在你的起始手牌中。', bottle: 'power'
  });
  R('darkstone_periapt', {
    name: '暗石护符', tier: 'uncommon', icon: '🔺',
    desc: '每当你获得一个诅咒，最大生命值提高 6 点。'
  });
  R('eternal_feather', {
    name: '永恒之羽', tier: 'uncommon', icon: '🪶',
    desc: '你牌组中每 5 张牌，在营火处恢复 3 点生命。'
  });
  R('frozen_egg', {
    name: '冰冻蛋', tier: 'uncommon', icon: '🥚',
    desc: '每当你获得一张能力牌，它会自动升级。'
  });
  R('gremlin_horn', {
    name: '哥布林之角', tier: 'uncommon', icon: '📯',
    desc: '每当一个敌人死亡，获得 1 点能量并抽 1 张牌。',
    onEnemyKilled: (g, c) => { c.energy++; c.draw(1); }
  });
  R('horn_cleat', {
    name: '号角挂钩', tier: 'uncommon', icon: '🪝',
    desc: '在你的第 2 个回合开始时，获得 14 点格挡。',
    onTurnStart: (g, c) => { if (c.turn === 2) c.gainBlock(c.player, 14, { noPower: true }); }
  });
  R('ink_bottle', {
    name: '墨水瓶', tier: 'uncommon', icon: '🖋️', counter: 10,
    desc: '每当你打出 10 张牌，抽 1 张牌。',
    onCardPlayed: (g, c) => {
      inc(g, 'ink_bottle');
      if (g.relicCounters.ink_bottle >= 10) { g.relicCounters.ink_bottle = 0; c.draw(1); }
    }
  });
  R('kunai', {
    name: '苦无', tier: 'uncommon', icon: '🗡️',
    desc: '每当你在一个回合内打出 3 张攻击牌，获得 1 点敏捷。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'attack') return;
      if (c.attacksPlayedTurn > 0 && c.attacksPlayedTurn % 3 === 0) c.addPower(c.player, 'dexterity', 1);
    }
  });
  R('letter_opener', {
    name: '开信刀', tier: 'uncommon', icon: '✉️',
    desc: '每当你在一个回合内打出 3 张技能牌，对所有敌人造成 5 点伤害。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'skill') return;
      if (c.skillsPlayedTurn > 0 && c.skillsPlayedTurn % 3 === 0) c.dealDamageAll(c.player, 5, { fromPower: true });
    }
  });
  R('matryoshka', {
    name: '套娃', tier: 'uncommon', icon: '🪆', counter: 2,
    desc: '接下来打开的 2 个非首领宝箱会包含 2 个遗物。',
    onEquip: (g) => { g.relicCounters.matryoshka = 2; }
  });
  R('meat_on_the_bone', {
    name: '骨上之肉', tier: 'uncommon', icon: '🍖',
    desc: '战斗结束时，若你的生命值低于 50%，恢复 12 点生命。',
    onCombatEnd: (g, c) => { if (g.pc.hp <= g.pc.maxHp / 2) g.healPlayer(12); }
  });
  R('mercury_hourglass', {
    name: '水银沙漏', tier: 'uncommon', icon: '⏳',
    desc: '每回合开始时对所有敌人造成 3 点伤害。',
    onTurnStart: (g, c) => c.dealDamageAll(c.player, 3, { fromPower: true })
  });
  R('molten_egg', {
    name: '熔岩蛋', tier: 'uncommon', icon: '🍳',
    desc: '每当你获得一张攻击牌，它会自动升级。'
  });
  R('mummified_hand', {
    name: '木乃伊之手', tier: 'uncommon', icon: '🤚',
    desc: '每当你打出一张能力牌，手中一张随机牌的消耗在本回合变为 0。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'power' || !c.hand.length) return;
      const pool = c.hand.filter((h) => { const cc = c.cost(h); return typeof cc === 'number' && cc > 0; });
      if (pool.length) g.rng.pick(pool).costTurn = 0;
    }
  });
  R('ornamental_fan', {
    name: '装饰折扇', tier: 'uncommon', icon: '🪭',
    desc: '每当你在一个回合内打出 3 张攻击牌，获得 4 点格挡。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'attack') return;
      if (c.attacksPlayedTurn > 0 && c.attacksPlayedTurn % 3 === 0) c.gainBlock(c.player, 4, { noPower: true });
    }
  });
  R('pantograph', {
    name: '缩放仪', tier: 'uncommon', icon: '📐',
    desc: '首领战开始时恢复 25 点生命。',
    onCombatStart: (g, c) => { if (c.isBoss) g.healPlayer(25); }
  });
  R('pear', {
    name: '梨', tier: 'uncommon', icon: '🍐',
    desc: '最大生命值提高 10 点。',
    onEquip: (g) => g.addMaxHp(10)
  });
  R('question_card', {
    name: '问号卡', tier: 'uncommon', icon: '❓',
    desc: '卡牌奖励额外多出 1 个选项。'
  });
  R('shuriken', {
    name: '手里剑', tier: 'uncommon', icon: '🌟',
    desc: '每当你在一个回合内打出 3 张攻击牌，获得 1 点力量。',
    onCardPlayed: (g, c, card, def) => {
      if (def.type !== 'attack') return;
      if (c.attacksPlayedTurn > 0 && c.attacksPlayedTurn % 3 === 0) c.addPower(c.player, 'strength', 1);
    }
  });
  R('singing_bowl', {
    name: '颂钵', tier: 'uncommon', icon: '🔔',
    desc: '在卡牌奖励处可以选择“+2 最大生命”而不拿牌。'
  });
  R('strike_dummy', {
    name: '打击假人', tier: 'uncommon', icon: '🎯',
    desc: '含有“打击”的卡牌额外造成 3 点伤害。',
    atDamageGive: (g, c, dmg, ctx) => (ctx.card && S.cards[ctx.card.id].name.indexOf('打击') >= 0 ? dmg + 3 : dmg)
  });
  R('sundial', {
    name: '日晷', tier: 'uncommon', icon: '🕰️', counter: 3,
    desc: '每洗牌 3 次，获得 2 点能量。',
    onShuffle: (g, c) => {
      inc(g, 'sundial');
      if (g.relicCounters.sundial >= 3) { g.relicCounters.sundial = 0; c.energy += 2; c.toast('日晷：+2 能量'); }
    }
  });
  R('the_courier', {
    name: '信使', tier: 'uncommon', icon: '📮',
    desc: '商店的商品会补货，且价格降低 20%。'
  });
  R('toxic_egg', {
    name: '剧毒蛋', tier: 'uncommon', icon: '🧪',
    desc: '每当你获得一张技能牌，它会自动升级。'
  });
  R('white_beast_statue', {
    name: '白色野兽雕像', tier: 'uncommon', icon: '🗿',
    desc: '战斗后必定获得药水。'
  });

  /* ================= 稀有遗物 ================= */
  R('bird_faced_urn', {
    name: '鸟面壶', tier: 'rare', icon: '🏺',
    desc: '每当你打出一张能力牌，恢复 2 点生命。',
    onCardPlayed: (g, c, card, def) => { if (def.type === 'power') c.heal(c.player, 2); }
  });
  R('calipers', {
    name: '卡钳', tier: 'rare', icon: '📏',
    desc: '回合开始时你只失去 15 点格挡，而不是全部。'
  });
  R('captains_wheel', {
    name: '船长之轮', tier: 'rare', icon: '☸️',
    desc: '在你的第 3 个回合开始时，获得 18 点格挡。',
    onTurnStart: (g, c) => { if (c.turn === 3) c.gainBlock(c.player, 18, { noPower: true }); }
  });
  R('champion_belt', {
    name: '冠军腰带', tier: 'rare', icon: '🏆',
    desc: '每当你给予敌人易伤，同时给予 1 层虚弱。'
  });
  R('charons_ashes', {
    name: '卡隆的骨灰', tier: 'rare', icon: '⚱️',
    desc: '每当你消耗一张牌，对所有敌人造成 3 点伤害。',
    onExhaust: (g, c) => c.dealDamageAll(c.player, 3, { fromPower: true })
  });
  R('dead_branch', {
    name: '枯枝', tier: 'rare', icon: '🌿',
    desc: '每当你消耗一张牌，将一张随机牌加入手牌。',
    onExhaust: (g, c) => {
      const pool = g.cardPool(null, true);
      c.addCardTo(g.rng.pick(pool), 'hand');
    }
  });
  R('du_vu_doll', {
    name: '巫毒娃娃', tier: 'rare', icon: '🪡',
    desc: '你牌组中每有一张诅咒牌，战斗开始时获得 1 点力量。',
    onCombatStart: (g, c) => {
      const n = g.deck.filter((x) => S.cards[x.id].type === 'curse').length;
      if (n) c.addPower(c.player, 'strength', n);
    }
  });
  R('fossilized_helix', {
    name: '石化螺旋', tier: 'rare', icon: '🐚',
    desc: '每场战斗中第一次失去生命时，抵挡该次伤害。',
    onCombatStart: (g) => { g.relicCounters.fossilized_helix = 1; }
  });
  R('gambling_chip', {
    name: '赌博芯片', tier: 'rare', icon: '🎰',
    desc: '每场战斗开始时，你可以弃掉任意数量的牌，然后抽取等量的牌。'
  });
  R('ginger', {
    name: '姜', tier: 'rare', icon: '🫚',
    desc: '你不再会被施加虚弱。'
  });
  R('girya', {
    name: '举重壶铃', tier: 'rare', icon: '🏋️', counter: 3,
    desc: '你可以在营火处锻炼以获得力量（最多 3 次）。'
  });
  R('ice_cream', {
    name: '冰淇淋', tier: 'rare', icon: '🍦',
    desc: '能量在回合之间会被保留。'
  });
  R('incense_burner', {
    name: '香炉', tier: 'rare', icon: '🕉️', counter: 6,
    desc: '每 6 个回合获得 1 层无形。',
    onTurnStart: (g, c) => {
      inc(g, 'incense_burner');
      if (g.relicCounters.incense_burner >= 6) { g.relicCounters.incense_burner = 0; c.addPower(c.player, 'intangible', 1); }
    }
  });
  R('lizard_tail', {
    name: '蜥蜴尾', tier: 'rare', icon: '🦎',
    desc: '当你即将死亡时，恢复到 50% 生命（仅一次）。',
    onEquip: (g) => { g.relicCounters.lizard_tail = 1; }
  });
  R('magic_flower', {
    name: '魔法花', tier: 'rare', icon: '🌺',
    desc: '战斗中的治疗效果提高 50%。'
  });
  R('mango', {
    name: '芒果', tier: 'rare', icon: '🥭',
    desc: '最大生命值提高 14 点。',
    onEquip: (g) => g.addMaxHp(14)
  });
  R('old_coin', {
    name: '旧硬币', tier: 'rare', icon: '🪙',
    desc: '获得 300 金币。',
    onEquip: (g) => g.gainGold(300)
  });
  R('peace_pipe', {
    name: '和平烟斗', tier: 'rare', icon: '🚬',
    desc: '你可以在营火处移除牌组中的卡牌。'
  });
  R('pocketwatch', {
    name: '怀表', tier: 'rare', icon: '⌚',
    desc: '若你在一个回合内打出 3 张或更少的牌，下个回合额外抽 3 张牌。',
    onTurnEnd: (g, c) => { g.flags.pocketwatch = c.cardsPlayedTurn <= 3; },
    onTurnStart: (g, c) => { if (g.flags.pocketwatch && c.turn > 1) { c.addPower(c.player, 'draw_next', 3, { silent: true }); } }
  });
  R('prayer_wheel', {
    name: '祈祷之轮', tier: 'rare', icon: '☯️',
    desc: '普通敌人会额外掉落一次卡牌奖励。'
  });
  R('self_forming_clay', {
    name: '自成型黏土', tier: 'rare', icon: '🧱',
    desc: '每当你在战斗中失去生命，下个回合获得 3 点格挡。',
    onLoseHp: (g, c) => c.addPower(c.player, 'next_turn_block', 3, { silent: true })
  });
  R('shovel', {
    name: '铲子', tier: 'rare', icon: '⛏️',
    desc: '你可以在营火处挖掘以获得遗物。'
  });
  R('stone_calendar', {
    name: '石制日历', tier: 'rare', icon: '📅',
    desc: '在第 7 回合结束时，对所有敌人造成 52 点伤害。',
    onTurnEnd: (g, c) => { if (c.turn === 7) { c.toast('石制日历！'); c.dealDamageAll(c.player, 52, { fromPower: true }); } }
  });
  R('thread_and_needle', {
    name: '针与线', tier: 'rare', icon: '🧵',
    desc: '每场战斗开始时获得 4 层镀层。',
    onCombatStart: (g, c) => c.addPower(c.player, 'plated_armor', 4)
  });
  R('torii', {
    name: '鸟居', tier: 'rare', icon: '⛩️',
    desc: '当你受到 5 点或更少的未格挡攻击伤害时，将其降低至 1 点。'
  });
  R('tungsten_rod', {
    name: '钨钢棒', tier: 'rare', icon: '🔗',
    desc: '每当你失去生命，少失去 1 点。'
  });
  R('turnip', {
    name: '芜菁', tier: 'rare', icon: '🥬',
    desc: '你不再会被施加脆弱。'
  });
  R('unceasing_top', {
    name: '不停转的陀螺', tier: 'rare', icon: '🌀',
    desc: '在你的回合中，若手牌为空则抽 1 张牌。'
  });
  R('wing_boots', {
    name: '飞翼靴', tier: 'rare', icon: '👢', counter: 3,
    desc: '你可以无视地图路径连线移动 3 次。',
    onEquip: (g) => { g.relicCounters.wing_boots = 3; }
  });

  /* ================= 首领遗物 ================= */
  R('black_blood', {
    name: '黑血', tier: 'boss', icon: '🖤', char: 'red', replaces: 'burning_blood',
    desc: '战斗结束时恢复 12 点生命。',
    onCombatEnd: (g) => g.healPlayer(12)
  });
  R('ring_of_the_serpent', {
    name: '蛇之环', tier: 'boss', icon: '🐍', char: 'green', replaces: 'ring_of_the_snake',
    desc: '每回合开始时额外抽 1 张牌。',
    onTurnStart: (g, c) => { if (c.turn > 1) c.addPower(c.player, 'draw_next', 1, { silent: true }); }
  });
  R('black_star', { name: '黑星', tier: 'boss', icon: '⭐', desc: '精英敌人会掉落 2 个遗物。' });
  R('busted_crown', { name: '破损王冠', tier: 'boss', icon: '👑', energy: 1, desc: '获得 1 点额外能量。卡牌奖励少 2 个选项。' });
  R('coffee_dripper', { name: '咖啡滴滤器', tier: 'boss', icon: '☕', energy: 1, desc: '获得 1 点额外能量。你无法再在营火处休息。' });
  R('cursed_key', { name: '诅咒钥匙', tier: 'boss', icon: '🗝️', energy: 1, desc: '获得 1 点额外能量。每次打开非首领宝箱都会获得一个诅咒。' });
  R('ectoplasm', { name: '灵质', tier: 'boss', icon: '👻', energy: 1, desc: '获得 1 点额外能量。你无法再获得金币。' });
  R('empty_cage', {
    name: '空笼', tier: 'boss', icon: '🪤', desc: '获得时，从牌组中移除 2 张卡牌。'
  });
  R('fusion_hammer', { name: '熔铸锤', tier: 'boss', icon: '🔨', energy: 1, desc: '获得 1 点额外能量。你无法再在营火处锻造。' });
  R('philosophers_stone', {
    name: '贤者之石', tier: 'boss', icon: '💎', energy: 1,
    desc: '获得 1 点额外能量。所有敌人开局获得 1 点力量。',
    onCombatStart: (g, c) => c.enemies().forEach((e) => c.addPower(e, 'strength', 1))
  });
  R('runic_dome', { name: '符文穹顶', tier: 'boss', icon: '🛕', energy: 1, desc: '获得 1 点额外能量。你无法再看到敌人的意图。' });
  R('runic_pyramid', { name: '符文金字塔', tier: 'boss', icon: '🔺', desc: '回合结束时不再弃掉手牌。' });
  R('sacred_bark', { name: '神圣树皮', tier: 'boss', icon: '🌳', desc: '药水效果翻倍。' });
  R('slavers_collar', {
    name: '奴隶主项圈', tier: 'boss', icon: '🔗',
    desc: '在首领和精英战斗中获得 1 点额外能量。'
  });
  R('snecko_eye', {
    name: '蛇眼', tier: 'boss', icon: '👁️', draw: 2,
    desc: '每回合额外抽 2 张牌。战斗开始时陷入困惑（手牌消耗随机）。',
    onCombatStart: (g, c) => c.addPower(c.player, 'confused', 1)
  });
  R('sozu', { name: '酒枡', tier: 'boss', icon: '🍶', energy: 1, desc: '获得 1 点额外能量。你无法再获得药水。' });
  R('tiny_house', {
    name: '小房子', tier: 'boss', icon: '🏠',
    desc: '最大生命 +5、金币 +50，获得 1 瓶药水、1 张卡牌，并升级一张卡牌。'
  });
  R('velvet_choker', {
    name: '天鹅绒项圈', tier: 'boss', icon: '🎀', energy: 1,
    desc: '获得 1 点额外能量。每回合最多只能打出 6 张牌。'
  });
  R('astrolabe', { name: '星盘', tier: 'boss', icon: '🔭', desc: '获得时，转化并升级 3 张卡牌。' });
  R('calling_bell', { name: '呼唤铃', tier: 'boss', icon: '🔔', desc: '获得 3 个诅咒和 3 个遗物。' });
  R('mark_of_pain', {
    name: '痛苦印记', tier: 'boss', icon: '💢', char: 'red', energy: 1,
    desc: '获得 1 点额外能量。战斗开始时将 2 张“伤口”加入抽牌堆。',
    onCombatStart: (g, c) => c.addCardTo('wound', 'draw', { count: 2, random: true })
  });
  R('runic_cube', {
    name: '符文方块', tier: 'boss', icon: '🎲', char: 'red',
    desc: '每当你失去生命，抽 1 张牌。',
    onLoseHp: (g, c) => c.draw(1)
  });
  R('hovering_kite', {
    name: '悬浮风筝', tier: 'boss', icon: '🪁', char: 'green',
    desc: '每回合第一次弃牌时，获得 1 点能量。',
    onCardDiscarded: (g, c) => {
      if (!g.flags.kiteTurn) { g.flags.kiteTurn = true; c.energy++; c.toast('悬浮风筝：+1 能量'); }
    },
    onTurnStart: (g) => { g.flags.kiteTurn = false; }
  });

  /* ================= 商店遗物 ================= */
  R('cauldron', { name: '大锅', tier: 'shop', icon: '🍲', desc: '获得时，获得 5 瓶随机药水。' });
  R('chemical_x', { name: '化学 X', tier: 'shop', icon: '⚗️', desc: 'X 消耗的卡牌效果提高 2 点。' });
  R('clockwork_souvenir', {
    name: '发条纪念品', tier: 'shop', icon: '⚙️',
    desc: '每场战斗开始时获得 1 层神器。',
    onCombatStart: (g, c) => c.addPower(c.player, 'artifact', 1)
  });
  R('dollys_mirror', { name: '多莉的镜子', tier: 'shop', icon: '🪞', desc: '获得时，复制牌组中的一张卡牌。' });
  R('frozen_eye', { name: '冰冻之眼', tier: 'shop', icon: '❄️', desc: '你可以查看抽牌堆的顺序。' });
  R('hand_drill', {
    name: '手钻', tier: 'shop', icon: '🪛',
    desc: '每当你击破敌人的格挡，给予其 2 层易伤。'
  });
  R('lees_waffle', {
    name: '李氏华夫饼', tier: 'shop', icon: '🧇',
    desc: '最大生命提高 7 点，并完全恢复生命。',
    onEquip: (g) => { g.addMaxHp(7); g.pc.hp = g.pc.maxHp; }
  });
  R('medical_kit', { name: '医疗包', tier: 'shop', icon: '⛑️', desc: '状态牌可以被打出，打出后消耗。' });
  R('membership_card', { name: '会员卡', tier: 'shop', icon: '💳', desc: '商店所有商品降价 50%。' });
  R('orange_pellets', {
    name: '橙色药丸', tier: 'shop', icon: '💊',
    desc: '当你在同一回合打出攻击、技能和能力牌时，移除自身所有负面效果。'
  });
  R('orrery', { name: '天球仪', tier: 'shop', icon: '🔮', desc: '获得时，选择 5 张卡牌加入牌组。' });
  R('prismatic_shard', { name: '棱彩碎片', tier: 'shop', icon: '💠', desc: '卡牌奖励中会出现其他角色的卡牌。' });
  R('sling_of_courage', {
    name: '勇气之弹', tier: 'shop', icon: '🎯',
    desc: '精英战斗开始时获得 2 点力量。',
    onCombatStart: (g, c) => { if (c.isElite) c.addPower(c.player, 'strength', 2); }
  });
  R('strange_spoon', { name: '奇怪的勺子', tier: 'shop', icon: '🥄', desc: '会被消耗的卡牌有 50% 概率被弃掉而非消耗。' });
  R('the_abacus', {
    name: '算盘', tier: 'shop', icon: '🧮',
    desc: '每当你洗牌，获得 6 点格挡。',
    onShuffle: (g, c) => c.gainBlock(c.player, 6, { noPower: true })
  });
  R('toolbox', {
    name: '工具箱', tier: 'shop', icon: '🧰',
    desc: '每场战斗开始时，将一张随机无色牌加入手牌。',
    onCombatStart: (g, c) => c.addCardTo(g.rng.pick(g.colorlessPool()), 'hand')
  });

  /* ================= 事件遗物 ================= */
  R('bloody_idol', {
    name: '血腥雕像', tier: 'event', icon: '🗿',
    desc: '每当你获得金币，恢复 5 点生命。',
    onGainGold: (g) => g.healPlayer(5)
  });
  R('cultist_headpiece', { name: '教徒头饰', tier: 'event', icon: '🎩', desc: '奇怪的低语声萦绕在你耳边……' });
  R('enchiridion', {
    name: '魔法书', tier: 'event', icon: '📕',
    desc: '每场战斗开始时，将一张随机能力牌加入手牌，其消耗为 0。',
    onCombatStart: (g, c) => {
      const pool = g.cardPool('power', true);
      if (pool.length) c.addCardTo(g.rng.pick(pool), 'hand', { costCombat: 0 });
    }
  });
  R('face_of_cleric', {
    name: '神职者之面', tier: 'event', icon: '😇',
    desc: '每场战斗结束后，最大生命提高 1 点。',
    onCombatEnd: (g) => g.addMaxHp(1)
  });
  R('golden_idol', { name: '金色雕像', tier: 'event', icon: '🏆', desc: '敌人掉落的金币增加 25%。' });
  R('gremlin_visage', {
    name: '哥布林面容', tier: 'event', icon: '👺',
    desc: '每场战斗开始时陷入 1 层虚弱。',
    onCombatStart: (g, c) => c.addPower(c.player, 'weak', 1)
  });
  R('mark_of_the_bloom', { name: '绽放印记', tier: 'event', icon: '🌸', desc: '你无法再恢复生命。' });
  R('mutagenic_strength', {
    name: '变异力量', tier: 'event', icon: '🧬',
    desc: '每场战斗开始时获得 3 点力量，在第一个回合结束时失去 3 点力量。',
    onCombatStart: (g, c) => { c.addPower(c.player, 'strength', 3); c.addPower(c.player, 'str_down', 3, { silent: true }); }
  });
  R('nloths_gift', { name: '恩洛斯的礼物', tier: 'event', icon: '🎁', desc: '下一次卡牌奖励中稀有牌的概率提高三倍。' });
  R('nloths_hungry_face', { name: '恩洛斯饥饿的面容', tier: 'event', icon: '👄', desc: '下一个非首领宝箱是空的。' });
  R('necronomicon', {
    name: '死灵之书', tier: 'event', icon: '📗',
    desc: '每回合第一张消耗 2 点及以上能量的攻击牌会被打出两次。',
    onTurnStart: (g, c) => { c.necroUsed = false; }
  });
  R('neows_lament', {
    name: '尼奥的悲叹', tier: 'event', icon: '🌌', counter: 3,
    desc: '接下来 3 场战斗中的敌人生命值都变为 1。',
    onEquip: (g) => { g.relicCounters.neows_lament = 3; }
  });
  R('nilrys_codex', { name: '尼尔莉的书', tier: 'event', icon: '📘', desc: '每回合结束时，从 3 张牌中选 1 张洗入抽牌堆。' });
  R('odd_mushroom', { name: '奇怪的蘑菇', tier: 'event', icon: '🍄', desc: '易伤时受到的伤害只提高 25%。' });
  R('red_mask', {
    name: '红面具', tier: 'event', icon: '🎭',
    desc: '每场战斗开始时给予所有敌人 1 层虚弱。',
    onCombatStart: (g, c) => c.enemies().forEach((e) => c.applyDebuff(e, 'weak', 1))
  });
  R('spirit_poop', { name: '精神便便', tier: 'event', icon: '💩', desc: '……真恶心。' });
  R('ssserpent_head', {
    name: '蛇头', tier: 'event', icon: '🐲',
    desc: '每当你进入“？”房间，获得 50 金币。'
  });
  R('warped_tongs', {
    name: '变形钳', tier: 'event', icon: '🔧',
    desc: '每回合开始时，升级手中一张随机卡牌。',
    onTurnStartPostDraw: (g, c) => {
      const pool = c.hand.filter((h) => S.canUpgrade(h));
      if (pool.length) { const x = g.rng.pick(pool); x.tempUpg = true; S.upgradeCard(x); c.toast('变形钳：' + S.cardName(x)); }
    }
  });

  /* ================= 扩展遗物：自然行动点上限 ================= */
  R('capacitor_core', {
    name: '电容核心', tier: 'rare', icon: '🔋', naturalCap: 1,
    desc: '自然行动点上限 +1。'
  });
  R('overdrive_chip', {
    name: '超频芯片', tier: 'boss', icon: '⚡', naturalCap: 1,
    desc: '自然行动点上限 +1。'
  });
})();
