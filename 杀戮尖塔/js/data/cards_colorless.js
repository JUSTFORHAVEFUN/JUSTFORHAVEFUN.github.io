/* ================= cards_colorless.js · 无色牌 / 状态 / 诅咒 ================= */
(function () {
  'use strict';
  const S = window.STS, C = S.defCard;

  /* ================= 状态牌 ================= */
  C('burn', {
    name: '燃烧', color: 'status', type: 'status', rarity: 'special', cost: -2, unplayable: true, noPool: true, art: '🔥',
    base: { dmg: 2 }, up: { dmg: 4 },
    desc: (v, p) => `无法打出。回合结束时受到 ${p.n('dmg')} 点伤害。`,
    onTurnEndInHand: (g, c) => { g.dealDamage(null, g.player, S.cardVals(c).dmg, { fromPower: true }); }
  });
  C('dazed', {
    name: '迷乱', color: 'status', type: 'status', rarity: 'special', cost: -2, unplayable: true, ethereal: true, noPool: true, art: '💫',
    desc: () => '无法打出。<span class="kw">灵魂虚体</span>。'
  });
  C('wound', {
    name: '伤口', color: 'status', type: 'status', rarity: 'special', cost: -2, unplayable: true, noPool: true, art: '🩹',
    desc: () => '无法打出。'
  });
  C('slimed', {
    name: '黏液', color: 'status', type: 'status', rarity: 'special', cost: 1, exhaust: true, noPool: true, art: '🟢',
    desc: () => '<span class="kw">消耗</span>。',
    play: () => { }
  });
  C('void', {
    name: '虚空', color: 'status', type: 'status', rarity: 'special', cost: -2, unplayable: true, ethereal: true, noPool: true, art: '⚫',
    desc: () => '无法打出。<span class="kw">灵魂虚体</span>。当你抽到此牌时，失去 1 点能量。',
    onDraw: (g) => { if (g.energy > 0) { g.energy--; g.toast('虚空：-1 能量'); } }
  });

  /* ================= 诅咒 ================= */
  const curse = (id, name, opt) => C(id, Object.assign({
    name: name, color: 'curse', type: 'curse', rarity: 'special', cost: -2, unplayable: true, noPool: true, art: '🌑'
  }, opt));

  curse('ascenders_bane', '登顶者之殇', {
    ethereal: true, noRemove: true,
    desc: () => '无法打出。<span class="kw">灵魂虚体</span>。无法被移除。'
  });
  curse('clumsy', '笨拙', { ethereal: true, desc: () => '无法打出。<span class="kw">灵魂虚体</span>。' });
  curse('curse_of_the_bell', '铃之诅咒', { noRemove: true, desc: () => '无法打出，且无法被移除。' });
  curse('decay', '腐朽', {
    desc: () => '无法打出。回合结束时受到 2 点伤害。',
    onTurnEndInHand: (g) => g.dealDamage(null, g.player, 2, { fromPower: true })
  });
  curse('doubt', '怀疑', {
    desc: () => '无法打出。回合结束时获得 1 层<span class="kw">虚弱</span>。',
    onTurnEndInHand: (g) => g.applyDebuff(g.player, 'weak', 1)
  });
  curse('injury', '损伤', { desc: () => '无法打出。' });
  curse('necronomicurse', '死灵诅咒', {
    noRemove: true,
    desc: () => '无法打出，无法被移除。此牌被消耗时，会有一张新的加入手牌。',
    onExhaust: (g) => g.addCardTo('necronomicurse', 'hand')
  });
  curse('normality', '常态', { desc: () => '无法打出。你本回合无法打出超过 3 张牌。' });
  curse('pain', '痛苦', { desc: () => '无法打出。只要此牌在手中，你每打出一张牌就失去 1 点生命。' });
  curse('parasite', '寄生虫', { desc: () => '无法打出。若在转化或移除时，最大生命降低 3 点。' });
  curse('regret', '悔恨', {
    desc: () => '无法打出。回合结束时，每有一张手牌就失去 1 点生命。',
    onTurnEndInHand: (g) => g.loseHp(g.player, g.hand.length, {})
  });
  curse('shame', '羞耻', {
    desc: () => '无法打出。回合结束时获得 1 层<span class="kw">脆弱</span>。',
    onTurnEndInHand: (g) => g.applyDebuff(g.player, 'frail', 1)
  });
  curse('writhe', '蠕动', { innate: true, desc: () => '<span class="kw">天生</span>。无法打出。' });

  /* ================= 无色牌 ================= */
  const N = 'colorless';
  C('bandage_up', {
    name: '包扎', color: N, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '🩹',
    base: { hp: 4 }, up: { hp: 6 },
    desc: (v, p) => `恢复 ${p.n('hp')} 点生命。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.heal(g.player, v.hp)
  });
  C('blind', {
    name: '盲目', color: N, type: 'skill', rarity: 'uncommon', cost: 0, target: 'enemy', art: '🕶️',
    base: { weak: 2 }, up: { weak: 2 },
    desc: (v, p, c) => `给予${c && c.upg ? '<b class="up">所有敌人</b>' : '目标'} ${p.n('weak')} 层<span class="kw">虚弱</span>。`,
    play: (g, c, t, v) => { if (c.upg) g.enemies().forEach((e) => g.applyDebuff(e, 'weak', v.weak)); else g.applyDebuff(t, 'weak', v.weak); }
  });
  C('dark_shackles', {
    name: '黑暗镣铐', color: N, type: 'skill', rarity: 'uncommon', cost: 0, target: 'enemy', exhaust: true, art: '⛓️',
    base: { str: 9 }, up: { str: 15 },
    desc: (v, p) => `目标本回合失去 ${p.n('str')} 点<span class="kw">力量</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { if (t && g.applyDebuff(t, 'strength', -v.str)) g.addPower(t, 'shackled', v.str, { silent: true }); }
  });
  C('deep_breath', {
    name: '深呼吸', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🌬️',
    base: { draw: 1 }, up: { draw: 2 },
    desc: (v, p) => `将弃牌堆洗入抽牌堆，抽 ${p.n('draw')} 张牌。`,
    play: (g, c, t, v) => { g.reshuffle(); g.draw(v.draw); }
  });
  C('discovery', {
    name: '发现', color: N, type: 'skill', rarity: 'uncommon', cost: 1, exhaust: true, upFlags: { exhaust: false }, art: '🔎',
    desc: (v, p, c) => `从 3 张随机卡牌中选择 1 张加入手牌，本回合它的消耗为 0。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: async (g, c, t, v) => {
      const pool = g.game.cardPool(null, true);
      const three = g.game.rng.sample(pool, 3).map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(g, { from: three, n: 1, prompt: '选择一张牌加入手牌', virtual: true });
      if (sel[0]) g.addCardTo(sel[0].id, 'hand', { costTurn: 0 });
    }
  });
  C('dramatic_entrance', {
    name: '华丽登场', color: N, type: 'attack', rarity: 'uncommon', cost: 0, target: 'none', innate: true, exhaust: true, art: '🚪',
    base: { dmg: 8 }, up: { dmg: 12 },
    desc: (v, p) => `<span class="kw">天生</span>。对所有敌人造成 ${p.d('dmg')} 点伤害。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.attackAll(v.dmg)
  });
  C('enlightenment', {
    name: '启迪', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '💡',
    desc: (v, p, c) => `将手中所有牌的消耗降低至 1（${c && c.upg ? '<b class="up">本场战斗</b>' : '本回合'}）。`,
    play: (g, c) => {
      g.hand.forEach((h) => {
        const cost = g.cost(h);
        if (typeof cost === 'number' && cost > 1) { if (c.upg) h.costCombat = 1; else h.costTurn = 1; }
      });
    }
  });
  C('finesse', {
    name: '熟练', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🎩',
    base: { blk: 2 }, up: { blk: 4 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，抽 1 张牌。`,
    play: (g, c, t, v) => { g.block(v.blk); g.draw(1); }
  });
  C('flash_of_steel', {
    name: '钢铁闪光', color: N, type: 'attack', rarity: 'uncommon', cost: 0, art: '✨',
    base: { dmg: 3 }, up: { dmg: 6 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，抽 1 张牌。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.draw(1); }
  });
  C('forethought', {
    name: '深思', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🧠',
    desc: (v, p, c) => `将手中${c && c.upg ? '<b class="up">任意数量</b>的' : '一张'}牌置于抽牌堆底部，在打出前消耗为 0。`,
    play: async (g, c, t, v) => {
      if (!g.hand.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: c.upg ? g.hand.length : 1, prompt: '选择要置底的牌', canSkip: true, upTo: true });
      sel.forEach((x) => { x.costCombat = 0; g.moveCard(x, 'draw'); g.drawPile.splice(g.drawPile.indexOf(x), 1); g.drawPile.unshift(x); });
    }
  });
  C('good_instincts', {
    name: '良好直觉', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '🫧',
    base: { blk: 6 }, up: { blk: 9 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('impatience', {
    name: '急躁', color: N, type: 'skill', rarity: 'uncommon', cost: 0, art: '⏰',
    base: { draw: 2 }, up: { draw: 3 },
    desc: (v, p) => `若手中没有攻击牌，抽 ${p.n('draw')} 张牌。`,
    play: (g, c, t, v) => { if (!g.hand.some((h) => S.cards[h.id].type === 'attack')) g.draw(v.draw); }
  });
  C('jack_of_all_trades', {
    name: '万事通', color: N, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '🃏',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `将 ${p.n('n')} 张随机无色牌加入手牌。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const pool = g.game.colorlessPool();
      for (let i = 0; i < v.n; i++) g.addCardTo(g.game.rng.pick(pool), 'hand');
    }
  });
  C('madness', {
    name: '疯狂', color: N, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, exhaust: true, art: '🤪',
    desc: () => '将手中一张随机牌的消耗降为 0（本场战斗）。<span class="kw">消耗</span>。',
    play: (g) => {
      const pool = g.hand.filter((h) => { const cc = g.cost(h); return typeof cc === 'number' && cc > 0; });
      if (!pool.length) return;
      const c2 = g.game.rng.pick(pool);
      c2.costCombat = 0;
      g.toast(S.cardName(c2) + ' 的消耗变为 0');
    }
  });
  C('mind_blast', {
    name: '心灵冲击', color: N, type: 'attack', rarity: 'uncommon', cost: 2, upCost: 1, innate: true, art: '🧠',
    desc: (v, p) => `<span class="kw">天生</span>。造成等同于抽牌堆牌数 ( ${p.dn(p.g ? p.g.drawPile.length : 0)} ) 的伤害。`,
    play: (g, c, t, v) => g.attack(t, g.drawPile.length)
  });
  C('panacea', {
    name: '万灵药', color: N, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '🧴',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `获得 ${p.n('n')} 层<span class="kw">神器</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'artifact', v.n)
  });
  C('panic_button', {
    name: '紧急按钮', color: N, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '🔴',
    base: { blk: 30 }, up: { blk: 40 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。接下来 2 回合无法通过卡牌获得格挡。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { g.block(v.blk); g.addPower(g.player, 'no_block', 2); }
  });
  C('purity', {
    name: '纯净', color: N, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '🕊️',
    base: { n: 3 }, up: { n: 5 },
    desc: (v, p) => `消耗手中最多 ${p.n('n')} 张牌。<span class="kw">消耗</span>。`,
    play: async (g, c, t, v) => {
      if (!g.hand.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: Math.min(v.n, g.hand.length), prompt: '选择要消耗的牌', canSkip: true, upTo: true });
      sel.forEach((x) => g.exhaustCard(x));
    }
  });
  C('swift_strike', {
    name: '迅捷打击', color: N, type: 'attack', rarity: 'uncommon', cost: 0, art: '🗡️',
    base: { dmg: 7 }, up: { dmg: 10 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('trip', {
    name: '绊倒', color: N, type: 'skill', rarity: 'uncommon', cost: 0, target: 'enemy', art: '🦶',
    base: { vuln: 2 }, up: { vuln: 2 },
    desc: (v, p, c) => `给予${c && c.upg ? '<b class="up">所有敌人</b>' : '目标'} ${p.n('vuln')} 层<span class="kw">易伤</span>。`,
    play: (g, c, t, v) => { if (c.upg) g.enemies().forEach((e) => g.applyDebuff(e, 'vulnerable', v.vuln)); else g.applyDebuff(t, 'vulnerable', v.vuln); }
  });
  C('bite', {
    name: '咬', color: N, type: 'attack', rarity: 'special', cost: 1, noPool: true, art: '🦷',
    base: { dmg: 7, hp: 2 }, up: { dmg: 8, hp: 3 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，恢复 ${p.n('hp')} 点生命。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.heal(g.player, v.hp); }
  });
  C('ritual_dagger', {
    name: '仪式匕首', color: N, type: 'attack', rarity: 'special', cost: 1, exhaust: true, noPool: true, art: '🗡️',
    base: { dmg: 15, inc: 3 }, up: { dmg: 15, inc: 5 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若杀死目标，此牌伤害永久提高 ${p.n('inc')} 点。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const alive = t && !t.dead;
      g.attack(t, v.dmg);
      if (alive && t.hp <= 0) {
        c.bonus = c.bonus || {}; c.bonus.dmg = (c.bonus.dmg || 0) + v.inc;
        g.toast('仪式匕首伤害提高 ' + v.inc);
      }
    }
  });
  C('apparition', {
    name: '幻影', color: N, type: 'skill', rarity: 'special', cost: 1, ethereal: true, exhaust: true, noPool: true,
    upFlags: { ethereal: false }, art: '👻',
    desc: (v, p, c) => `${c && c.upg ? '' : '<span class="kw">灵魂虚体</span>。'}获得 1 层<span class="kw">无形</span>。<span class="kw">消耗</span>。`,
    play: (g) => g.addPower(g.player, 'intangible', 1)
  });

  /* ---------- 稀有无色 ---------- */
  C('apotheosis', {
    name: '神化', color: N, type: 'skill', rarity: 'rare', cost: 2, upCost: 1, exhaust: true, art: '🌟',
    desc: () => '升级你的所有卡牌（本场战斗）。<span class="kw">消耗</span>。',
    play: (g) => {
      g.deckAll().forEach((h) => { if (S.canUpgrade(h)) { h.tempUpg = true; S.upgradeCard(h); } });
      g.toast('所有卡牌已升级！');
    }
  });
  C('chrysalis', {
    name: '蝶蛹', color: N, type: 'skill', rarity: 'rare', cost: 2, upCost: 2, exhaust: true, art: '🦋',
    base: { n: 3 }, up: { n: 5 },
    desc: (v, p) => `将 ${p.n('n')} 张随机技能牌置入抽牌堆，本场战斗它们的消耗为 0。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const pool = g.game.cardPool('skill');
      for (let i = 0; i < v.n; i++) g.addCardTo(g.game.rng.pick(pool), 'draw', { random: true, costCombat: 0 });
    }
  });
  C('hand_of_greed', {
    name: '贪婪之手', color: N, type: 'attack', rarity: 'rare', cost: 2, art: '🤑',
    base: { dmg: 20, gold: 25 }, up: { dmg: 25, gold: 30 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若杀死目标，获得 ${p.n('gold')} 金币。`,
    play: (g, c, t, v) => {
      const alive = t && !t.dead;
      g.attack(t, v.dmg);
      if (alive && t.hp <= 0) { g.game.gainGold(v.gold); g.toast('+' + v.gold + ' 金币'); }
    }
  });
  C('magnetism_card', {
    name: '磁力', color: N, type: 'power', rarity: 'rare', cost: 2, upCost: 1, art: '🧲',
    desc: () => '每回合开始时，将 1 张随机无色牌加入手牌。',
    play: (g) => g.addPower(g.player, 'magnetism', 1)
  });
  C('master_of_strategy', {
    name: '战略大师', color: N, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, art: '📖',
    base: { draw: 3 }, up: { draw: 4 },
    desc: (v, p) => `抽 ${p.n('draw')} 张牌。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.draw(v.draw)
  });
  C('mayhem_card', {
    name: '混乱', color: N, type: 'power', rarity: 'rare', cost: 2, upCost: 1, art: '🎲',
    desc: () => '每回合开始时，打出抽牌堆顶部的牌。',
    play: (g) => g.addPower(g.player, 'mayhem', 1)
  });
  C('metamorphosis', {
    name: '变形', color: N, type: 'skill', rarity: 'rare', cost: 2, exhaust: true, art: '🔮',
    base: { n: 3 }, up: { n: 5 },
    desc: (v, p) => `将 ${p.n('n')} 张随机攻击牌置入抽牌堆，本场战斗它们的消耗为 0。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const pool = g.game.cardPool('attack');
      for (let i = 0; i < v.n; i++) g.addCardTo(g.game.rng.pick(pool), 'draw', { random: true, costCombat: 0 });
    }
  });
  C('panache_card', {
    name: '华丽', color: N, type: 'power', rarity: 'rare', cost: 0, art: '🎺',
    base: { dmg: 10 }, up: { dmg: 14 },
    desc: (v, p) => `每当你在一回合内打出 5 张牌，对所有敌人造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'panache', v.dmg)
  });
  C('sadistic_nature', {
    name: '虐待狂天性', color: N, type: 'power', rarity: 'rare', cost: 0, art: '😈',
    base: { dmg: 5 }, up: { dmg: 7 },
    desc: (v, p) => `每当你给敌人施加负面效果，对其造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'sadistic', v.dmg)
  });
  C('secret_technique', {
    name: '秘密技巧', color: N, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, upFlags: { exhaust: false }, art: '📜',
    desc: (v, p, c) => `从抽牌堆中选择一张技能牌加入手牌。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: async (g, c) => {
      const pool = g.drawPile.filter((h) => S.cards[h.id].type === 'skill');
      if (!pool.length) { g.toast('抽牌堆中没有技能牌'); return; }
      const sel = await S.UI.chooseCards(g, { from: pool, n: 1, prompt: '选择一张技能牌' });
      if (sel[0]) g.moveCard(sel[0], 'hand');
    }
  });
  C('secret_weapon', {
    name: '秘密武器', color: N, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, upFlags: { exhaust: false }, art: '🗡️',
    desc: (v, p, c) => `从抽牌堆中选择一张攻击牌加入手牌。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: async (g, c) => {
      const pool = g.drawPile.filter((h) => S.cards[h.id].type === 'attack');
      if (!pool.length) { g.toast('抽牌堆中没有攻击牌'); return; }
      const sel = await S.UI.chooseCards(g, { from: pool, n: 1, prompt: '选择一张攻击牌' });
      if (sel[0]) g.moveCard(sel[0], 'hand');
    }
  });
  C('the_bomb_card', {
    name: '炸弹', color: N, type: 'skill', rarity: 'rare', cost: 2, art: '💣',
    base: { dmg: 40 }, up: { dmg: 50 },
    desc: (v, p) => `在 3 回合结束时对所有敌人造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => { g.player._bombT = 3; g.addPower(g.player, 'the_bomb', v.dmg); }
  });
  C('thinking_ahead', {
    name: '提前思考', color: N, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, upFlags: { exhaust: false }, art: '💭',
    desc: (v, p, c) => `抽 2 张牌，将手中一张牌置于抽牌堆顶。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: async (g, c) => {
      g.draw(2);
      if (!g.hand.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌置于抽牌堆顶' });
      if (sel[0]) g.moveCard(sel[0], 'draw');
    }
  });
  C('transmutation', {
    name: '转化', color: N, type: 'skill', rarity: 'rare', cost: 'X', exhaust: true, art: '♻️',
    desc: (v, p, c) => `将 X 张${c && c.upg ? '<b class="up">升级后的</b>' : ''}随机无色牌加入手牌，它们本回合消耗为 0。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const pool = g.game.colorlessPool();
      for (let i = 0; i < (v.X || 0); i++) g.addCardTo(g.game.rng.pick(pool), 'hand', { costTurn: 0, upg: c.upg });
    }
  });
  C('violence', {
    name: '暴力', color: N, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, art: '🩸',
    base: { n: 3 }, up: { n: 4 },
    desc: (v, p) => `从抽牌堆中随机将 ${p.n('n')} 张攻击牌加入手牌。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const pool = g.drawPile.filter((h) => S.cards[h.id].type === 'attack');
      g.game.rng.shuffle(pool);
      pool.slice(0, v.n).forEach((x) => g.moveCard(x, 'hand'));
    }
  });

  /* 附加能力：不能获得格挡 / 炸弹 */
  S.defPower('no_block', {
    name: '无法格挡', type: 'debuff', icon: '🚷', dur: true,
    desc: (n) => `无法通过卡牌获得格挡，持续 ${n} 回合。`,
    atBlockGain: (g, o, n, amt) => 0
  });
  S.powers.the_bomb.onTurnEnd = function (g, o, n) {
    o._bombT = (o._bombT || 1) - 1;
    if (o._bombT <= 0) {
      g.toast('炸弹爆炸了！');
      g.dealDamageAll(o, n, { fromPower: true });
      g.removePower(o, 'the_bomb');
    } else g.toast('炸弹倒计时 ' + o._bombT);
  };
  S.powers.magnetism.onTurnStart = function (g, o, n) {
    const pool = g.game.colorlessPool();
    for (let i = 0; i < n; i++) g.addCardTo(g.game.rng.pick(pool), 'hand');
  };
})();
