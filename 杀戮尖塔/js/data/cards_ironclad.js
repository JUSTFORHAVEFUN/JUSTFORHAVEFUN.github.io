/* ================= cards_ironclad.js · 铁甲战士 ================= */
(function () {
  'use strict';
  const S = window.STS, C = S.defCard;
  const R = 'red';

  /* ---------------- 基础牌 ---------------- */
  C('strike', {
    name: '打击', color: R, type: 'attack', rarity: 'basic', cost: 1, art: '🗡️',
    base: { dmg: 6 }, up: { dmg: 9 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('defend', {
    name: '防御', color: R, type: 'skill', rarity: 'basic', cost: 1, art: '🛡️',
    base: { blk: 5 }, up: { blk: 8 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('bash', {
    name: '痛击', color: R, type: 'attack', rarity: 'basic', cost: 2, art: '🔨',
    base: { dmg: 8, vuln: 2 }, up: { dmg: 10, vuln: 3 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('vuln')} 层<span class="kw">易伤</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'vulnerable', v.vuln); }
  });

  /* ---------------- 普通攻击 ---------------- */
  C('anger', {
    name: '愤怒', color: R, type: 'attack', rarity: 'common', cost: 0, art: '😠',
    base: { dmg: 6 }, up: { dmg: 8 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。将此牌的一个复制加入弃牌堆。`,
    play: (g, c, t, v) => {
      g.attack(t, v.dmg);
      const copy = S.makeCard('anger', c.upg); copy.temp = true; g.discardPile.push(copy);
    }
  });
  C('body_slam', {
    name: '重殴', color: R, type: 'attack', rarity: 'common', cost: 1, upCost: 0, art: '🧱',
    base: {}, up: {},
    desc: (v, p) => `造成等同于你当前<span class="kw">格挡</span>值 ( ${p.dn(p.g ? p.g.player.block : 0)} ) 的伤害。`,
    play: (g, c, t, v) => g.attack(t, g.player.block)
  });
  C('clash', {
    name: '交锋', color: R, type: 'attack', rarity: 'common', cost: 0, art: '⚔️',
    base: { dmg: 14 }, up: { dmg: 18 },
    desc: (v, p) => `只有手牌全为攻击牌时才能打出。造成 ${p.d('dmg')} 点伤害。`,
    canPlay: (g) => g.hand.every((h) => S.cards[h.id].type === 'attack'),
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('cleave', {
    name: '顺劈斩', color: R, type: 'attack', rarity: 'common', cost: 1, target: 'none', art: '🌪️',
    base: { dmg: 8 }, up: { dmg: 11 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attackAll(v.dmg)
  });
  C('clothesline', {
    name: '铁臂勾', color: R, type: 'attack', rarity: 'common', cost: 2, art: '💪',
    base: { dmg: 12, weak: 2 }, up: { dmg: 14, weak: 3 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('weak')} 层<span class="kw">虚弱</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'weak', v.weak); }
  });
  C('headbutt', {
    name: '头槌', color: R, type: 'attack', rarity: 'common', cost: 1, art: '🤕',
    base: { dmg: 9 }, up: { dmg: 12 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。将弃牌堆中的一张牌置于抽牌堆顶部。`,
    play: async (g, c, t, v) => {
      g.attack(t, v.dmg);
      if (!g.discardPile.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.discardPile.slice(), n: 1, prompt: '选择一张牌置于抽牌堆顶' });
      if (sel[0]) g.moveCard(sel[0], 'draw');
    }
  });
  C('heavy_blade', {
    name: '重刃', color: R, type: 'attack', rarity: 'common', cost: 2, art: '🗡️',
    base: { dmg: 14, mult: 3 }, up: { dmg: 14, mult: 5 },
    desc: (v, p) => `造成 ${p.dn(p.heavyBlade(v))} 点伤害。<span class="kw">力量</span>对此牌的效果提高至 ${p.n('mult')} 倍。`,
    play: (g, c, t, v) => {
      const str = g.getPower(g.player, 'strength');
      g.attack(t, v.dmg + str * (v.mult - 1));
    }
  });
  C('iron_wave', {
    name: '铁浪', color: R, type: 'attack', rarity: 'common', cost: 1, art: '🌊',
    base: { dmg: 5, blk: 5 }, up: { dmg: 7, blk: 7 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => { g.block(v.blk); g.attack(t, v.dmg); }
  });
  C('perfected_strike', {
    name: '完美打击', color: R, type: 'attack', rarity: 'common', cost: 2, art: '✨',
    base: { dmg: 6, per: 2 }, up: { dmg: 6, per: 3 },
    desc: (v, p) => `造成 ${p.dn(p.perfected(v))} 点伤害。每张带有“打击”的牌使此牌伤害提高 ${p.n('per')} 点。`,
    play: (g, c, t, v) => {
      const n = g.deckAll().concat(g.exhaustPile).filter((x) => S.cards[x.id].name.indexOf('打击') >= 0).length;
      g.attack(t, v.dmg + n * v.per);
    }
  });
  C('pommel_strike', {
    name: '剑柄打击', color: R, type: 'attack', rarity: 'common', cost: 1, art: '🔩',
    base: { dmg: 9, draw: 1 }, up: { dmg: 10, draw: 2 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，抽 ${p.n('draw')} 张牌。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.draw(v.draw); }
  });
  C('sword_boomerang', {
    name: '回旋剑', color: R, type: 'attack', rarity: 'common', cost: 1, target: 'random', art: '🪃',
    base: { dmg: 3, times: 3 }, up: { dmg: 3, times: 4 },
    desc: (v, p) => `随机对敌人造成 ${p.d('dmg')} 点伤害 ${p.n('times')} 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < v.times; i++) g.attack(g.randomEnemy(), v.dmg); }
  });
  C('thunderclap', {
    name: '雷霆之怒', color: R, type: 'attack', rarity: 'common', cost: 1, target: 'none', art: '⚡',
    base: { dmg: 4, vuln: 1 }, up: { dmg: 7, vuln: 1 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害并给予 ${p.n('vuln')} 层<span class="kw">易伤</span>。`,
    play: (g, c, t, v) => { g.enemies().forEach((e) => { g.attack(e, v.dmg); g.applyDebuff(e, 'vulnerable', v.vuln); }); }
  });
  C('twin_strike', {
    name: '双重打击', color: R, type: 'attack', rarity: 'common', cost: 1, art: '🗡️',
    base: { dmg: 5 }, up: { dmg: 7 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害 2 次。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.attack(t, v.dmg); }
  });
  C('wild_strike', {
    name: '狂野打击', color: R, type: 'attack', rarity: 'common', cost: 1, art: '💥',
    base: { dmg: 12 }, up: { dmg: 17 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。将一张“伤口”洗入抽牌堆。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.addCardTo('wound', 'draw', { random: true }); }
  });

  /* ---------------- 稀有度：罕见攻击 ---------------- */
  C('blood_for_blood', {
    name: '血债血偿', color: R, type: 'attack', rarity: 'uncommon', cost: 4, upCost: 3, art: '🩸',
    base: { dmg: 18 }, up: { dmg: 22 },
    dynCost: (g, c) => Math.max(0, (c.upg ? 3 : 4) - (g.hpLossTimes || 0)),
    desc: (v, p) => `你本场战斗每失去一次生命，此牌能量消耗降低 1 点。造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('carnage', {
    name: '杀戮', color: R, type: 'attack', rarity: 'uncommon', cost: 2, ethereal: true, art: '☠️',
    base: { dmg: 20 }, up: { dmg: 28 },
    desc: (v, p) => `<span class="kw">灵魂虚体</span>。造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('dropkick', {
    name: '垫步踢', color: R, type: 'attack', rarity: 'uncommon', cost: 1, art: '🦵',
    base: { dmg: 5 }, up: { dmg: 8 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若目标处于<span class="kw">易伤</span>，获得 1 点能量并抽 1 张牌。`,
    play: (g, c, t, v) => {
      const vuln = t && t.powers.vulnerable;
      g.attack(t, v.dmg);
      if (vuln) { g.gainEnergy(1); g.draw(1); }
    }
  });
  C('hemokinesis', {
    name: '血液动能', color: R, type: 'attack', rarity: 'uncommon', cost: 1, art: '🫀',
    base: { dmg: 15, hp: 2 }, up: { dmg: 20, hp: 2 },
    desc: (v, p) => `失去 ${p.n('hp')} 点生命，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => { g.loseHp(g.player, v.hp, { self: true }); g.attack(t, v.dmg); }
  });
  C('pummel', {
    name: '痛击连打', color: R, type: 'attack', rarity: 'uncommon', cost: 1, exhaust: true, art: '👊',
    base: { dmg: 2, times: 4 }, up: { dmg: 2, times: 5 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害 ${p.n('times')} 次。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { for (let i = 0; i < v.times; i++) g.attack(t, v.dmg); }
  });
  C('rampage', {
    name: '暴走', color: R, type: 'attack', rarity: 'uncommon', cost: 1, art: '📈',
    base: { dmg: 8, inc: 5 }, up: { dmg: 8, inc: 8 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。本场战斗中此牌伤害永久提高 ${p.n('inc')} 点。`,
    play: (g, c, t, v) => {
      g.attack(t, v.dmg);
      c.bonusCombat = c.bonusCombat || {};
      c.bonusCombat.dmg = (c.bonusCombat.dmg || 0) + v.inc;
    }
  });
  C('reckless_charge', {
    name: '莽撞冲锋', color: R, type: 'attack', rarity: 'uncommon', cost: 0, art: '🏃',
    base: { dmg: 7 }, up: { dmg: 10 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。将一张“迷乱”洗入抽牌堆。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.addCardTo('dazed', 'draw', { random: true }); }
  });
  C('searing_blow', {
    name: '灼烧打击', color: R, type: 'attack', rarity: 'uncommon', cost: 2, art: '🔥',
    multiUpgrade: true,
    base: { dmg: 12 }, up: { dmg: 12 },
    onUpgrade: (c) => { const n = c.upTimes || 1; c.bonus = { dmg: (n * (n + 7)) / 2 }; },
    upNameFn: (c) => '灼烧打击+' + (c.upTimes || 1),
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。可以被升级任意次数。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('sever_soul', {
    name: '斩魂', color: R, type: 'attack', rarity: 'uncommon', cost: 2, art: '👻',
    base: { dmg: 16 }, up: { dmg: 22 },
    desc: (v, p) => `消耗手中所有非攻击牌，造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => {
      g.hand.slice().forEach((h) => { if (S.cards[h.id].type !== 'attack') g.exhaustCard(h); });
      g.attack(t, v.dmg);
    }
  });
  C('uppercut', {
    name: '上勾拳', color: R, type: 'attack', rarity: 'uncommon', cost: 2, art: '🥊',
    base: { dmg: 13, n: 1 }, up: { dmg: 13, n: 2 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害，给予 ${p.n('n')} 层<span class="kw">虚弱</span>和 ${p.n('n')} 层<span class="kw">易伤</span>。`,
    play: (g, c, t, v) => { g.attack(t, v.dmg); g.applyDebuff(t, 'weak', v.n); g.applyDebuff(t, 'vulnerable', v.n); }
  });
  C('whirlwind', {
    name: '旋风斩', color: R, type: 'attack', rarity: 'uncommon', cost: 'X', target: 'none', art: '🌀',
    base: { dmg: 5 }, up: { dmg: 8 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害 X 次。`,
    play: (g, c, t, v) => { for (let i = 0; i < (v.X || 0); i++) g.attackAll(v.dmg); }
  });

  /* ---------------- 稀有攻击 ---------------- */
  C('bludgeon', {
    name: '巨力挥舞', color: R, type: 'attack', rarity: 'rare', cost: 3, art: '🔨',
    base: { dmg: 32 }, up: { dmg: 42 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.attack(t, v.dmg)
  });
  C('feed', {
    name: '进食', color: R, type: 'attack', rarity: 'rare', cost: 1, exhaust: true, art: '🍖',
    base: { dmg: 10, hp: 3 }, up: { dmg: 12, hp: 4 },
    desc: (v, p) => `造成 ${p.d('dmg')} 点伤害。若此牌杀死非仆从敌人，最大生命提高 ${p.n('hp')} 点。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const alive = t && !t.dead;
      g.attack(t, v.dmg);
      if (alive && t.hp <= 0 && !t.powers.minion) {
        g.player.maxHp += v.hp; g.player.hp += v.hp;
        g.toast('最大生命 +' + v.hp);
      }
    }
  });
  C('fiend_fire', {
    name: '邪火', color: R, type: 'attack', rarity: 'rare', cost: 2, exhaust: true, art: '🔥',
    base: { dmg: 7 }, up: { dmg: 10 },
    desc: (v, p) => `消耗你的所有手牌。每消耗一张牌，造成 ${p.d('dmg')} 点伤害。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      const n = g.hand.length;
      g.hand.slice().forEach((h) => g.exhaustCard(h));
      for (let i = 0; i < n; i++) g.attack(t, v.dmg);
    }
  });
  C('immolate', {
    name: '献祭', color: R, type: 'attack', rarity: 'rare', cost: 2, target: 'none', art: '🌋',
    base: { dmg: 21 }, up: { dmg: 28 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害。将一张“燃烧”置入你的弃牌堆。`,
    play: (g, c, t, v) => { g.attackAll(v.dmg); g.addCardTo('burn', 'discard'); }
  });
  C('reaper', {
    name: '收割', color: R, type: 'attack', rarity: 'rare', cost: 2, target: 'none', exhaust: true, art: '💀',
    base: { dmg: 4 }, up: { dmg: 5 },
    desc: (v, p) => `对所有敌人造成 ${p.d('dmg')} 点伤害。恢复等同于未被格挡伤害的生命。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => {
      let total = 0;
      g.enemies().forEach((e) => { total += g.attack(e, v.dmg); });
      if (total > 0) g.heal(g.player, total);
    }
  });

  /* ---------------- 技能 ---------------- */
  C('armaments', {
    name: '整备', color: R, type: 'skill', rarity: 'common', cost: 1, art: '⚒️',
    base: { blk: 5 }, up: { blk: 5 },
    desc: (v, p, c) => `获得 ${p.b('blk')} 点格挡。${c && c.upg ? '升级手中<b class="up">所有</b>牌' : '升级手中一张牌'}（本场战斗）。`,
    play: async (g, c, t, v) => {
      g.block(v.blk);
      const upable = g.hand.filter((h) => S.canUpgrade(h));
      if (!upable.length) return;
      if (c.upg) { upable.forEach((h) => { h.tempUpg = true; S.upgradeCard(h); }); return; }
      const sel = await S.UI.chooseCards(g, { from: upable, n: 1, prompt: '选择一张牌升级（本场战斗）' });
      if (sel[0]) { sel[0].tempUpg = true; S.upgradeCard(sel[0]); }
    }
  });
  C('flex', {
    name: '屈伸', color: R, type: 'skill', rarity: 'common', cost: 0, art: '💪',
    base: { str: 2 }, up: { str: 4 },
    desc: (v, p) => `获得 ${p.n('str')} 点<span class="kw">力量</span>。本回合结束时失去 ${p.n('str')} 点力量。`,
    play: (g, c, t, v) => { g.addPower(g.player, 'strength', v.str); g.addPower(g.player, 'str_down', v.str, { silent: true }); }
  });
  C('havoc', {
    name: '浩劫', color: R, type: 'skill', rarity: 'common', cost: 1, upCost: 0, art: '🎯',
    desc: () => '打出抽牌堆顶部的牌，然后消耗它。',
    play: async (g, c, t, v) => {
      if (!g.drawPile.length) g.reshuffle();
      const top = g.drawPile[g.drawPile.length - 1];
      if (!top) return;
      g.drawPile.pop();
      g.hand.push(top);
      const d = S.cards[top.id];
      top.forceExhaust = true;
      await g.autoPlay(top);
      if (g.hand.indexOf(top) >= 0 || g.discardPile.indexOf(top) >= 0) g.exhaustCard(top);
    }
  });
  C('shrug_it_off', {
    name: '甩脱', color: R, type: 'skill', rarity: 'common', cost: 1, art: '🤷',
    base: { blk: 8 }, up: { blk: 11 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡，抽 1 张牌。`,
    play: (g, c, t, v) => { g.block(v.blk); g.draw(1); }
  });
  C('true_grit', {
    name: '真正的勇气', color: R, type: 'skill', rarity: 'common', cost: 1, art: '🦾',
    base: { blk: 7 }, up: { blk: 9 },
    desc: (v, p, c) => `获得 ${p.b('blk')} 点格挡。${c && c.upg ? '消耗手中一张<b class="up">指定</b>牌' : '随机消耗手中一张牌'}。`,
    play: async (g, c, t, v) => {
      g.block(v.blk);
      if (!g.hand.length) return;
      if (!c.upg) { g.exhaustCard(g.game.rng.pick(g.hand)); return; }
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌消耗' });
      if (sel[0]) g.exhaustCard(sel[0]);
    }
  });
  C('warcry', {
    name: '战吼', color: R, type: 'skill', rarity: 'common', cost: 0, exhaust: true, art: '📢',
    base: { draw: 1 }, up: { draw: 2 },
    desc: (v, p) => `抽 ${p.n('draw')} 张牌，将手中一张牌置于抽牌堆顶部。<span class="kw">消耗</span>。`,
    play: async (g, c, t, v) => {
      g.draw(v.draw);
      if (!g.hand.length) return;
      const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌置于抽牌堆顶' });
      if (sel[0]) g.moveCard(sel[0], 'draw');
    }
  });
  C('battle_trance', {
    name: '战斗恍惚', color: R, type: 'skill', rarity: 'uncommon', cost: 0, art: '🌀',
    base: { draw: 3 }, up: { draw: 4 },
    desc: (v, p) => `抽 ${p.n('draw')} 张牌。本回合无法再抽牌。`,
    play: (g, c, t, v) => { g.draw(v.draw); g.addPower(g.player, 'no_draw', 1, { silent: true }); }
  });
  C('bloodletting', {
    name: '放血', color: R, type: 'skill', rarity: 'uncommon', cost: 0, art: '🩸',
    base: { en: 2 }, up: { en: 3 },
    desc: (v, p) => `失去 3 点生命，获得 ${p.n('en')} 点能量。`,
    play: (g, c, t, v) => { g.loseHp(g.player, 3, { self: true }); g.gainEnergy(v.en); }
  });
  C('burning_pact', {
    name: '燃烧契约', color: R, type: 'skill', rarity: 'uncommon', cost: 1, art: '📜',
    base: { draw: 2 }, up: { draw: 3 },
    desc: (v, p) => `消耗手中一张牌，抽 ${p.n('draw')} 张牌。`,
    play: async (g, c, t, v) => {
      if (g.hand.length) {
        const sel = await S.UI.chooseCards(g, { from: g.hand.slice(), n: 1, prompt: '选择一张牌消耗' });
        if (sel[0]) g.exhaustCard(sel[0]);
      }
      g.draw(v.draw);
    }
  });
  C('disarm', {
    name: '卸甲', color: R, type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', exhaust: true, art: '🔻',
    base: { str: 2 }, up: { str: 3 },
    desc: (v, p) => `目标失去 ${p.n('str')} 点<span class="kw">力量</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { if (t) g.applyDebuff(t, 'strength', -v.str); }
  });
  C('dual_wield', {
    name: '双持', color: R, type: 'skill', rarity: 'uncommon', cost: 1, art: '✌️',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `复制手中一张攻击牌或能力牌 ${p.n('n')} 次，副本加入手牌。`,
    play: async (g, c, t, v) => {
      const pool = g.hand.filter((h) => ['attack', 'power'].indexOf(S.cards[h.id].type) >= 0);
      if (!pool.length) return;
      const sel = await S.UI.chooseCards(g, { from: pool, n: 1, prompt: '选择要复制的牌' });
      if (!sel[0]) return;
      for (let i = 0; i < v.n; i++) {
        const cp = S.makeCard(sel[0].id, sel[0].upg); cp.temp = true;
        if (sel[0].bonus) cp.bonus = Object.assign({}, sel[0].bonus);
        if (g.hand.length < 10) g.hand.push(cp); else g.discardPile.push(cp);
      }
      g.dirty();
    }
  });
  C('entrench', {
    name: '固守', color: R, type: 'skill', rarity: 'uncommon', cost: 2, upCost: 1, art: '🏰',
    desc: () => '将你的<span class="kw">格挡</span>值翻倍。',
    play: (g) => { g.gainBlock(g.player, g.player.block, { noPower: true }); }
  });
  C('flame_barrier_card', {
    name: '烈焰屏障', color: R, type: 'skill', rarity: 'uncommon', cost: 2, art: '🔥',
    base: { blk: 12, dmg: 4 }, up: { blk: 16, dmg: 6 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。本回合内每次受到攻击，对攻击者造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => { g.block(v.blk); g.addPower(g.player, 'flame_barrier', v.dmg); }
  });
  C('ghostly_armor', {
    name: '幽灵护甲', color: R, type: 'skill', rarity: 'uncommon', cost: 1, ethereal: true, art: '👻',
    base: { blk: 10 }, up: { blk: 13 },
    desc: (v, p) => `<span class="kw">灵魂虚体</span>。获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('infernal_blade', {
    name: '地狱之刃', color: R, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, exhaust: true, art: '🗡️',
    desc: () => '将一张随机攻击牌加入手牌，本回合它的消耗为 0。<span class="kw">消耗</span>。',
    play: (g, c, t, v) => {
      const pool = Object.keys(S.cards).filter((k) => {
        const d = S.cards[k];
        return d.type === 'attack' && d.color === g.game.charColor && d.rarity !== 'basic' && !d.noPool;
      });
      const id = g.game.rng.pick(pool);
      g.addCardTo(id, 'hand', { costTurn: 0 });
    }
  });
  C('intimidate', {
    name: '威吓', color: R, type: 'skill', rarity: 'uncommon', cost: 0, exhaust: true, art: '😱',
    base: { weak: 1 }, up: { weak: 2 },
    desc: (v, p) => `给予所有敌人 ${p.n('weak')} 层<span class="kw">虚弱</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.enemies().forEach((e) => g.applyDebuff(e, 'weak', v.weak))
  });
  C('power_through', {
    name: '强行突破', color: R, type: 'skill', rarity: 'uncommon', cost: 1, art: '🚪',
    base: { blk: 15 }, up: { blk: 20 },
    desc: (v, p) => `将 2 张“伤口”加入手牌，获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => { g.addCardTo('wound', 'hand', { count: 2 }); g.block(v.blk); }
  });
  C('rage_card', {
    name: '暴怒', color: R, type: 'skill', rarity: 'uncommon', cost: 0, art: '😡',
    base: { blk: 3 }, up: { blk: 5 },
    desc: (v, p) => `本回合内每当你打出攻击牌，获得 ${p.n('blk')} 点格挡。`,
    play: (g, c, t, v) => g.addPower(g.player, 'rage', v.blk)
  });
  C('second_wind', {
    name: '振作', color: R, type: 'skill', rarity: 'uncommon', cost: 1, art: '🌬️',
    base: { blk: 5 }, up: { blk: 7 },
    desc: (v, p) => `消耗手中所有非攻击牌。每消耗一张，获得 ${p.b('blk')} 点格挡。`,
    play: (g, c, t, v) => {
      const list = g.hand.slice().filter((h) => S.cards[h.id].type !== 'attack');
      list.forEach((h) => g.exhaustCard(h));
      for (let i = 0; i < list.length; i++) g.block(v.blk);
    }
  });
  C('seeing_red', {
    name: '见红', color: R, type: 'skill', rarity: 'uncommon', cost: 1, upCost: 0, exhaust: true, art: '🟥',
    desc: () => '获得 2 点能量。<span class="kw">消耗</span>。',
    play: (g) => g.gainEnergy(2)
  });
  C('sentinel', {
    name: '哨兵', color: R, type: 'skill', rarity: 'uncommon', cost: 1, art: '🗿',
    base: { blk: 5, en: 2 }, up: { blk: 8, en: 3 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。若此牌被消耗，获得 ${p.n('en')} 点能量。`,
    play: (g, c, t, v) => g.block(v.blk),
    onExhaust: (g, c) => { const v = S.cardVals(c); g.gainEnergy(v.en); g.toast('哨兵：+' + v.en + ' 能量'); }
  });
  C('shockwave', {
    name: '震荡波', color: R, type: 'skill', rarity: 'uncommon', cost: 2, exhaust: true, art: '💫',
    base: { n: 3 }, up: { n: 5 },
    desc: (v, p) => `给予所有敌人 ${p.n('n')} 层<span class="kw">虚弱</span>和 ${p.n('n')} 层<span class="kw">易伤</span>。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.enemies().forEach((e) => { g.applyDebuff(e, 'weak', v.n); g.applyDebuff(e, 'vulnerable', v.n); })
  });
  C('spot_weakness', {
    name: '识破弱点', color: R, type: 'skill', rarity: 'uncommon', cost: 1, target: 'enemy', art: '🔍',
    base: { str: 3 }, up: { str: 4 },
    desc: (v, p) => `若目标意图攻击，获得 ${p.n('str')} 点<span class="kw">力量</span>。`,
    play: (g, c, t, v) => {
      if (t && t.move && t.move.intent && t.move.intent.type === 'attack') g.addPower(g.player, 'strength', v.str);
      else g.toast('目标并未打算攻击');
    }
  });
  C('impervious', {
    name: '坚不可摧', color: R, type: 'skill', rarity: 'rare', cost: 2, exhaust: true, art: '🛡️',
    base: { blk: 30 }, up: { blk: 40 },
    desc: (v, p) => `获得 ${p.b('blk')} 点格挡。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => g.block(v.blk)
  });
  C('limit_break', {
    name: '突破极限', color: R, type: 'skill', rarity: 'rare', cost: 1, exhaust: true,
    upFlags: { exhaust: false }, art: '📊',
    desc: (v, p, c) => `将你的<span class="kw">力量</span>翻倍。${c && c.upg ? '' : '<span class="kw">消耗</span>。'}`,
    play: (g) => { const s = g.getPower(g.player, 'strength'); if (s > 0) g.addPower(g.player, 'strength', s); }
  });
  C('offering', {
    name: '奉献', color: R, type: 'skill', rarity: 'rare', cost: 0, exhaust: true, art: '🕯️',
    base: { draw: 3 }, up: { draw: 5 },
    desc: (v, p) => `失去 6 点生命，获得 2 点能量，抽 ${p.n('draw')} 张牌。<span class="kw">消耗</span>。`,
    play: (g, c, t, v) => { g.loseHp(g.player, 6, { self: true }); g.gainEnergy(2); g.draw(v.draw); }
  });
  C('exhume', {
    name: '掘出', color: R, type: 'skill', rarity: 'rare', cost: 1, upCost: 0, exhaust: true, art: '⚰️',
    desc: () => '将消耗堆中的一张牌加入手牌。<span class="kw">消耗</span>。',
    play: async (g, c, t, v) => {
      const pool = g.exhaustPile.filter((x) => x !== c);
      if (!pool.length) { g.toast('消耗堆为空'); return; }
      const sel = await S.UI.chooseCards(g, { from: pool, n: 1, prompt: '选择一张牌加入手牌' });
      if (sel[0]) g.moveCard(sel[0], 'hand');
    }
  });
  C('double_tap_card', {
    name: '双重施法', color: R, type: 'skill', rarity: 'rare', cost: 1, art: '🔁',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `本回合内接下来的 ${p.n('n')} 张攻击牌打出两次。`,
    play: (g, c, t, v) => g.addPower(g.player, 'double_tap', v.n)
  });

  /* ---------------- 能力牌 ---------------- */
  C('combust_card', {
    name: '自燃', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '💀',
    base: { dmg: 5 }, up: { dmg: 7 },
    desc: (v, p) => `每回合结束时失去 1 点生命，并对所有敌人造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => {
      g.player._combustHp = (g.player._combustHp || 0) + 1;
      g.addPower(g.player, 'combust', v.dmg);
    }
  });
  C('dark_embrace_card', {
    name: '黑暗拥抱', color: R, type: 'power', rarity: 'uncommon', cost: 2, upCost: 1, art: '🖤',
    desc: () => '每当有一张牌被<span class="kw">消耗</span>，抽 1 张牌。',
    play: (g) => g.addPower(g.player, 'dark_embrace', 1)
  });
  C('evolve_card', {
    name: '进化', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '🧬',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `每当你抽到状态牌，抽 ${p.n('n')} 张牌。`,
    play: (g, c, t, v) => g.addPower(g.player, 'evolve', v.n)
  });
  C('feel_no_pain_card', {
    name: '感觉不到痛', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '😐',
    base: { n: 3 }, up: { n: 4 },
    desc: (v, p) => `每当有一张牌被<span class="kw">消耗</span>，获得 ${p.n('n')} 点格挡。`,
    play: (g, c, t, v) => g.addPower(g.player, 'feel_no_pain', v.n)
  });
  C('fire_breathing_card', {
    name: '喷火', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '🐲',
    base: { dmg: 6 }, up: { dmg: 10 },
    desc: (v, p) => `每当你抽到状态牌或诅咒牌，对所有敌人造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'fire_breathing', v.dmg)
  });
  C('inflame', {
    name: '燃火', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '🔥',
    base: { str: 2 }, up: { str: 3 },
    desc: (v, p) => `获得 ${p.n('str')} 点<span class="kw">力量</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'strength', v.str)
  });
  C('metallicize_card', {
    name: '金属化', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '🔩',
    base: { n: 3 }, up: { n: 4 },
    desc: (v, p) => `每回合结束时获得 ${p.n('n')} 点格挡。`,
    play: (g, c, t, v) => g.addPower(g.player, 'metallicize', v.n)
  });
  C('rupture_card', {
    name: '破裂', color: R, type: 'power', rarity: 'uncommon', cost: 1, art: '🔻',
    base: { n: 1 }, up: { n: 2 },
    desc: (v, p) => `每当你因自己的卡牌失去生命，获得 ${p.n('n')} 点<span class="kw">力量</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'rupture', v.n)
  });
  C('barricade_card', {
    name: '壁垒', color: R, type: 'power', rarity: 'rare', cost: 3, upCost: 2, art: '🧱',
    desc: () => '回合开始时<span class="kw">格挡</span>不再消失。',
    play: (g) => g.addPower(g.player, 'barricade', 1)
  });
  C('berserk_card', {
    name: '狂暴', color: R, type: 'power', rarity: 'rare', cost: 0, art: '🔺',
    base: { vuln: 2 }, up: { vuln: 1 },
    desc: (v, p) => `获得 ${p.n('vuln')} 层<span class="kw">易伤</span>。每回合开始时额外获得 1 点能量。`,
    play: (g, c, t, v) => { g.addPower(g.player, 'vulnerable', v.vuln); g.addPower(g.player, 'berserk', 1); }
  });
  C('brutality_card', {
    name: '残暴', color: R, type: 'power', rarity: 'rare', cost: 0, art: '🩸',
    upFlags: { innate: true },
    desc: (v, p, c) => `${c && c.upg ? '<b class="up">天生</b>。' : ''}每回合开始时失去 1 点生命并抽 1 张牌。`,
    play: (g) => g.addPower(g.player, 'brutality', 1)
  });
  C('corruption_card', {
    name: '腐化', color: R, type: 'power', rarity: 'rare', cost: 3, upCost: 2, art: '🕳️',
    desc: () => '技能牌消耗 0 点能量，但打出后会被<span class="kw">消耗</span>。',
    play: (g) => g.addPower(g.player, 'corruption', 1)
  });
  C('demon_form_card', {
    name: '恶魔之型', color: R, type: 'power', rarity: 'rare', cost: 3, art: '👹',
    base: { str: 2 }, up: { str: 3 },
    desc: (v, p) => `每回合开始时获得 ${p.n('str')} 点<span class="kw">力量</span>。`,
    play: (g, c, t, v) => g.addPower(g.player, 'demon_form', v.str)
  });
  C('juggernaut_card', {
    name: '势不可挡', color: R, type: 'power', rarity: 'rare', cost: 2, art: '🚂',
    base: { dmg: 5 }, up: { dmg: 7 },
    desc: (v, p) => `每当你获得<span class="kw">格挡</span>，对随机敌人造成 ${p.n('dmg')} 点伤害。`,
    play: (g, c, t, v) => g.addPower(g.player, 'juggernaut', v.dmg)
  });
})();
