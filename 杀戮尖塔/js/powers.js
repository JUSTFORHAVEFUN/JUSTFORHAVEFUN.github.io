/* ================= powers.js · Buff / Debuff 系统 =================
 * 每个能力定义：
 *   name  显示名        type 'buff' | 'debuff'
 *   icon  图标字符      desc(n) 说明
 *   dur   true = 回合结束时层数 -1（易伤/虚弱/脆弱等）
 *   钩子（均为可选，第一参数固定为 combat 实例）：
 *     atDamageGive(cmb,owner,n,dmg,ctx)     -> 修改造成的伤害
 *     atDamageReceive(cmb,owner,n,dmg,ctx)  -> 修改受到的伤害
 *     atBlockGain(cmb,owner,n,amt)          -> 修改获得的格挡
 *     onTurnStartPre / onTurnStart / onTurnEnd(cmb,owner,n)
 *     onAttacked(cmb,owner,n,dmg,src)       -> 受到攻击伤害后
 *     onDamaged(cmb,owner,n,dmg,ctx)        -> 受到任何伤害后
 *     onCardPlayed(cmb,owner,n,card,def)
 *     onExhausted(cmb,owner,n,card)
 *     onDeath(cmb,owner,n)
 * ================================================================ */
(function () {
  'use strict';
  const S = window.STS, P = S.defPower;

  /* ---------------- 通用增益 ---------------- */
  P('strength', {
    name: '力量', type: 'buff', icon: '💪',
    desc: (n) => `攻击造成的伤害 ${n >= 0 ? '增加' : '降低'} ${Math.abs(n)} 点。`,
    allowNeg: true,
    atDamageGive: (c, o, n, dmg, ctx) => (ctx.isAttack ? dmg + n : dmg)
  });
  P('dexterity', {
    name: '敏捷', type: 'buff', icon: '🏃',
    desc: (n) => `获得的格挡 ${n >= 0 ? '增加' : '降低'} ${Math.abs(n)} 点。`,
    allowNeg: true,
    atBlockGain: (c, o, n, amt) => amt + n
  });
  P('vigor', {
    name: '活力', type: 'buff', icon: '⚡',
    desc: (n) => `下一张攻击牌额外造成 ${n} 点伤害。`,
    atDamageGive: (c, o, n, dmg, ctx) => (ctx.isAttack && ctx.fromCard ? dmg + n : dmg)
  });
  P('vulnerable', {
    name: '易伤', type: 'debuff', icon: '💥', dur: true,
    desc: (n) => `受到的攻击伤害提高 50%，持续 ${n} 回合。`,
    atDamageReceive: (c, o, n, dmg, ctx) => (ctx.isAttack ? Math.floor(dmg * (o.isPlayer && c.game.hasRelic('odd_mushroom') ? 1.25 : 1.5)) : dmg)
  });
  P('weak', {
    name: '虚弱', type: 'debuff', icon: '🥀', dur: true,
    desc: (n) => `造成的攻击伤害降低 25%，持续 ${n} 回合。`,
    atDamageGive: (c, o, n, dmg, ctx) => (ctx.isAttack ? Math.floor(dmg * (!o.isPlayer && c.game.hasRelic('paper_crane') ? 0.6 : 0.75)) : dmg)
  });
  P('frail', {
    name: '脆弱', type: 'debuff', icon: '🍂', dur: true,
    desc: (n) => `获得的格挡降低 25%，持续 ${n} 回合。`,
    atBlockGain: (c, o, n, amt) => Math.floor(amt * 0.75)
  });
  P('poison', {
    name: '中毒', type: 'debuff', icon: '☠️',
    desc: (n) => `回合开始时失去 ${n} 点生命，然后层数减少 1。`,
    onTurnStartPre: (c, o, n) => {
      c.loseHp(o, n, { poison: true });
      c.addPower(o, 'poison', -1, { silent: true });
    }
  });
  P('artifact', {
    name: '神器', type: 'buff', icon: '🔮',
    desc: (n) => `可以抵挡接下来 ${n} 次负面效果。`
  });
  P('thorns', {
    name: '荆棘', type: 'buff', icon: '🌵',
    desc: (n) => `受到攻击时对攻击者造成 ${n} 点伤害。`,
    onAttacked: (c, o, n, dmg, src) => { if (src && src.hp > 0) c.dealDamage(o, src, n, { thorns: true }); }
  });
  P('flame_barrier', {
    name: '烈焰屏障', type: 'buff', icon: '🔥',
    desc: (n) => `受到攻击时对攻击者造成 ${n} 点伤害，回合开始时移除。`,
    onAttacked: (c, o, n, dmg, src) => { if (src && src.hp > 0) c.dealDamage(o, src, n, { thorns: true }); },
    onTurnStart: (c, o, n) => c.removePower(o, 'flame_barrier')
  });
  P('metallicize', {
    name: '金属化', type: 'buff', icon: '🛡️',
    desc: (n) => `回合结束时获得 ${n} 点格挡。`,
    onTurnEnd: (c, o, n) => c.gainBlock(o, n, { noPower: true })
  });
  P('plated_armor', {
    name: '镀层', type: 'buff', icon: '🔩',
    desc: (n) => `回合结束时获得 ${n} 点格挡；受到攻击伤害时层数减 1。`,
    onTurnEnd: (c, o, n) => c.gainBlock(o, n, { noPower: true }),
    onAttacked: (c, o, n, dmg) => { if (dmg > 0) c.addPower(o, 'plated_armor', -1, { silent: true }); }
  });
  P('regen', {
    name: '再生', type: 'buff', icon: '💗',
    desc: (n) => `回合结束时恢复 ${n} 点生命，然后层数减少 1。`,
    onTurnEnd: (c, o, n) => { c.heal(o, n); c.addPower(o, 'regen', -1, { silent: true }); }
  });
  P('regen_flat', {
    name: '再生(持续)', type: 'buff', icon: '💗',
    desc: (n) => `每回合结束时恢复 ${n} 点生命。`,
    onTurnEnd: (c, o, n) => c.heal(o, n)
  });
  P('barricade', {
    name: '壁垒', type: 'buff', icon: '🧱', noStack: true,
    desc: () => '回合开始时不再失去格挡。'
  });
  P('blur', {
    name: '模糊', type: 'buff', icon: '💨', dur: true,
    desc: (n) => `格挡不会在回合开始时消失，持续 ${n} 回合。`
  });
  P('buffer', {
    name: '缓冲', type: 'buff', icon: '🌀',
    desc: (n) => `防止接下来 ${n} 次生命值losing。`
  });
  P('intangible', {
    name: '无形', type: 'buff', icon: '👻', dur: true,
    desc: (n) => `受到的所有伤害降为 1，持续 ${n} 回合。`,
    atDamageReceive: (c, o, n, dmg) => (dmg > 0 ? 1 : 0)
  });
  P('double_damage', {
    name: '伤害翻倍', type: 'buff', icon: '✖️', dur: true,
    desc: (n) => `攻击造成的伤害翻倍，持续 ${n} 回合。`,
    atDamageGive: (c, o, n, dmg, ctx) => (ctx.isAttack ? dmg * 2 : dmg)
  });
  P('next_turn_block', {
    name: '下回合格挡', type: 'buff', icon: '🔷',
    desc: (n) => `下回合开始时获得 ${n} 点格挡。`,
    onTurnStart: (c, o, n) => { c.gainBlock(o, n); c.removePower(o, 'next_turn_block'); }
  });
  P('draw_next', {
    name: '额外抽牌', type: 'buff', icon: '🎴',
    desc: (n) => `下个回合额外抽 ${n} 张牌。`
  });
  P('energy_next', {
    name: '额外能量', type: 'buff', icon: '🔵',
    desc: (n) => `下个回合额外获得 ${n} 点能量。`
  });
  P('no_draw', {
    name: '无法抽牌', type: 'debuff', icon: '🚫',
    desc: () => '本回合无法抽牌。', noStack: true,
    onTurnEnd: (c, o) => c.removePower(o, 'no_draw')
  });
  P('entangled', {
    name: '缠绕', type: 'debuff', icon: '🕸️', noStack: true,
    desc: () => '本回合无法打出攻击牌。',
    onTurnEnd: (c, o) => c.removePower(o, 'entangled')
  });
  P('confused', {
    name: '困惑', type: 'debuff', icon: '❓', noStack: true,
    desc: () => '抽到的卡牌能量消耗随机。'
  });
  P('hex', {
    name: '诅咒印记', type: 'debuff', icon: '🔯',
    desc: (n) => `每当你打出一张非攻击牌，将 ${n} 张迷乱置入抽牌堆。`,
    onCardPlayed: (c, o, n, card, def) => {
      if (def.type !== 'attack' && def.type !== 'status' && def.type !== 'curse') {
        for (let i = 0; i < n; i++) c.addCardTo('dazed', 'draw', { random: true });
      }
    }
  });
  P('str_down', {
    name: '力量流失', type: 'debuff', icon: '📉',
    desc: (n) => `回合结束时失去 ${n} 点力量。`,
    onTurnEnd: (c, o, n) => { c.addPower(o, 'strength', -n); c.removePower(o, 'str_down'); }
  });
  P('dex_down', {
    name: '敏捷流失', type: 'debuff', icon: '📉',
    desc: (n) => `回合结束时失去 ${n} 点敏捷。`,
    onTurnEnd: (c, o, n) => { c.addPower(o, 'dexterity', -n); c.removePower(o, 'dex_down'); }
  });
  P('shackled', {
    name: '被束缚', type: 'debuff', icon: '⛓️',
    desc: (n) => `回合结束时恢复 ${n} 点力量。`,
    onTurnEnd: (c, o, n) => { c.addPower(o, 'strength', n); c.removePower(o, 'shackled'); }
  });

  /* ---------------- 铁甲战士能力 ---------------- */
  P('rage', {
    name: '暴怒', type: 'buff', icon: '😡',
    desc: (n) => `每当你打出攻击牌，获得 ${n} 点格挡。`,
    onCardPlayed: (c, o, n, card, def) => { if (def.type === 'attack') c.gainBlock(o, n); }
  });
  P('double_tap', {
    name: '双重施法', type: 'buff', icon: '🔁',
    desc: (n) => `接下来 ${n} 张攻击牌打出两次。`
  });
  P('burst', {
    name: '爆发', type: 'buff', icon: '🔂',
    desc: (n) => `接下来 ${n} 张技能牌打出两次。`
  });
  P('corruption', {
    name: '腐化', type: 'buff', icon: '🕳️', noStack: true,
    desc: () => '技能牌消耗 0 点能量，但打出后被消耗。'
  });
  P('evolve', {
    name: '进化', type: 'buff', icon: '🧬',
    desc: (n) => `每当你抽到状态牌，抽 ${n} 张牌。`
  });
  P('fire_breathing', {
    name: '喷火', type: 'buff', icon: '🐲',
    desc: (n) => `每当你抽到状态牌或诅咒牌，对所有敌人造成 ${n} 点伤害。`
  });
  P('dark_embrace', {
    name: '黑暗拥抱', type: 'buff', icon: '🖤',
    desc: (n) => `每当有一张牌被消耗，抽 ${n} 张牌。`,
    onExhausted: (c, o, n) => c.draw(n)
  });
  P('feel_no_pain', {
    name: '感觉不到痛', type: 'buff', icon: '😐',
    desc: (n) => `每当有一张牌被消耗，获得 ${n} 点格挡。`,
    onExhausted: (c, o, n) => c.gainBlock(o, n)
  });
  P('juggernaut', {
    name: '势不可挡', type: 'buff', icon: '🚂',
    desc: (n) => `每当你获得格挡，对随机敌人造成 ${n} 点伤害。`
  });
  P('demon_form', {
    name: '恶魔之型', type: 'buff', icon: '👹',
    desc: (n) => `每回合开始时获得 ${n} 点力量。`,
    onTurnStart: (c, o, n) => c.addPower(o, 'strength', n)
  });
  P('brutality', {
    name: '残暴', type: 'buff', icon: '🩸',
    desc: (n) => `每回合开始时失去 ${n} 点生命并抽 ${n} 张牌。`,
    onTurnStart: (c, o, n) => { c.loseHp(o, n, { self: true }); c.draw(n); }
  });
  P('berserk', {
    name: '狂暴', type: 'buff', icon: '🔺',
    desc: (n) => `每回合开始时额外获得 ${n} 点能量。`
  });
  P('combust', {
    name: '燃烧', type: 'buff', icon: '💀',
    desc: (n) => `回合结束时失去 1 点生命，并对所有敌人造成 ${n} 点伤害。`,
    onTurnEnd: (c, o, n) => {
      c.loseHp(o, (o._combustHp || 1), { self: true });
      c.dealDamageAll(o, n, { fromPower: true });
    }
  });
  P('rupture', {
    name: '破裂', type: 'buff', icon: '🔻',
    desc: (n) => `每当你因自己的卡牌失去生命，获得 ${n} 点力量。`
  });
  P('mayhem', {
    name: '混乱', type: 'buff', icon: '🎲',
    desc: (n) => `每回合开始时，自动打出抽牌堆顶的 ${n} 张牌。`
  });
  P('panache', {
    name: '华丽', type: 'buff', icon: '🎺',
    desc: (n) => `每打出 5 张牌，对所有敌人造成 ${n} 点伤害。`
  });
  P('sadistic', {
    name: '虐待狂天性', type: 'buff', icon: '😈',
    desc: (n) => `每当你给予敌人一个负面效果，该敌人受到 ${n} 点伤害。`
  });
  P('magnetism', { name: '磁力', type: 'buff', icon: '🧲', desc: (n) => `每回合开始时随机加入 ${n} 张无色牌。` });
  P('devotion', { name: '虔诚', type: 'buff', icon: '🙏', desc: (n) => `每回合开始获得 ${n} 点专注。` });
  P('the_bomb', { name: '炸弹', type: 'buff', icon: '💣', desc: (n) => `3 回合后对所有敌人造成 ${n} 点伤害。` });

  /* ---------------- 静默猎手能力 ---------------- */
  P('envenom', {
    name: '剧毒', type: 'buff', icon: '🧪',
    desc: (n) => `攻击造成未被格挡的伤害时，给予 ${n} 层中毒。`
  });
  P('noxious_fumes', {
    name: '毒气', type: 'buff', icon: '🌫️',
    desc: (n) => `每回合开始时给予所有敌人 ${n} 层中毒。`,
    onTurnStart: (c, o, n) => { c.enemies().forEach((e) => c.applyDebuff(e, 'poison', n)); }
  });
  P('accuracy', {
    name: '精准', type: 'buff', icon: '🎯',
    desc: (n) => `飞刀额外造成 ${n} 点伤害。`
  });
  P('after_image', {
    name: '残影', type: 'buff', icon: '🌘',
    desc: (n) => `每当你打出一张牌，获得 ${n} 点格挡。`,
    onCardPlayed: (c, o, n) => c.gainBlock(o, n)
  });
  P('infinite_blades', {
    name: '无限之刃', type: 'buff', icon: '🗡️',
    desc: (n) => `每回合开始时将 ${n} 张飞刀加入手牌。`,
    onTurnStart: (c, o, n) => { for (let i = 0; i < n; i++) c.addCardTo('shiv', 'hand'); }
  });
  P('thousand_cuts', {
    name: '千刀万剐', type: 'buff', icon: '🔪',
    desc: (n) => `每当你打出一张牌，对所有敌人造成 ${n} 点伤害。`,
    onCardPlayed: (c, o, n) => c.dealDamageAll(o, n, { fromPower: true })
  });
  P('wraith_form', {
    name: '幽灵形态', type: 'buff', icon: '🌫️',
    desc: (n) => `每回合结束时失去 ${n} 点敏捷。`,
    onTurnEnd: (c, o, n) => c.addPower(o, 'dexterity', -n)
  });
  P('tools_of_the_trade', {
    name: '行业工具', type: 'buff', icon: '🧰',
    desc: (n) => `每回合抽 ${n} 张牌并弃 ${n} 张牌。`
  });
  P('well_laid_plans', {
    name: '妙计', type: 'buff', icon: '📜',
    desc: (n) => `每回合结束时保留最多 ${n} 张手牌。`
  });
  P('phantasmal', {
    name: '幻影杀手', type: 'buff', icon: '🎭',
    desc: (n) => `接下来 ${n} 个回合造成双倍伤害。`,
    onTurnStart: (c, o, n) => { c.addPower(o, 'double_damage', 1); c.addPower(o, 'phantasmal', -1, { silent: true }); }
  });
  P('echo_form', {
    name: '回响形态', type: 'buff', icon: '📢',
    desc: (n) => `每回合的第 1 张牌打出两次。`
  });
  P('nightmare', { name: '噩梦', type: 'buff', icon: '🌙', desc: (n) => `下回合将 ${n} 张指定牌加入手牌。` });

  /* ---------------- 敌人专属能力 ---------------- */
  P('ritual', {
    name: '仪式', type: 'buff', icon: '🕯️',
    desc: (n) => `每回合结束时获得 ${n} 点力量。`,
    onTurnEnd: (c, o, n) => { if (o._ritualSkip) { o._ritualSkip = false; return; } c.addPower(o, 'strength', n); }
  });
  P('curl_up', {
    name: '卷曲', type: 'buff', icon: '🐚',
    desc: (n) => `首次受到攻击伤害时获得 ${n} 点格挡。`,
    onAttacked: (c, o, n, dmg) => {
      if (dmg > 0 && o.hp > 0) { c.gainBlock(o, n); c.removePower(o, 'curl_up'); }
    }
  });
  P('angry', {
    name: '愤怒', type: 'buff', icon: '💢',
    desc: (n) => `每当受到攻击牌伤害时获得 ${n} 点力量。`,
    onAttacked: (c, o, n, dmg, src, ctx) => { if (dmg > 0) c.addPower(o, 'strength', n); }
  });
  P('enrage', {
    name: '激怒', type: 'buff', icon: '🔥',
    desc: (n) => `每当你打出一张技能牌，此敌人获得 ${n} 点力量。`
  });
  P('spore_cloud', {
    name: '孢子云', type: 'buff', icon: '🍄',
    desc: (n) => `死亡时给予玩家 ${n} 层易伤。`,
    onDeath: (c, o, n) => c.applyDebuff(c.player, 'vulnerable', n)
  });
  P('painful_stabs', {
    name: '刺痛之伤', type: 'buff', icon: '🩹',
    desc: (n) => '此敌人造成未被格挡的伤害时，将一张伤口置入你的弃牌堆。'
  });
  P('sharp_hide', {
    name: '锋利外皮', type: 'buff', icon: '🦔',
    desc: (n) => `每当你打出攻击牌，受到 ${n} 点伤害。`
  });
  P('malleable', {
    name: '可塑', type: 'buff', icon: '🪨',
    desc: (n) => `受到攻击伤害时获得 ${n} 点格挡，该数值随之提高 1，回合开始时重置为 3。`,
    onAttacked: (c, o, n, dmg) => {
      if (dmg > 0) { c.gainBlock(o, n, { noPower: true }); c.addPower(o, 'malleable', 1, { silent: true }); }
    },
    onTurnStart: (c, o, n) => { if (n !== 3) c.setPower(o, 'malleable', 3); }
  });
  P('mode_shift', {
    name: '模式切换', type: 'buff', icon: '🔄',
    desc: (n) => `再受到 ${n} 点伤害后进入防御模式。`
  });
  P('beat_of_death', {
    name: '死亡节拍', type: 'buff', icon: '🥁',
    desc: (n) => `每当你打出一张牌，受到 ${n} 点伤害。`
  });
  P('invincible', {
    name: '无敌', type: 'buff', icon: '🛑',
    desc: (n) => `本回合最多只能再受到 ${n} 点伤害。`
  });
  P('time_warp', {
    name: '时间扭曲', type: 'buff', icon: '⏳',
    desc: (n) => `你打出 12 张牌后，敌人结束你的回合并获得 2 点力量。（${n}/12）`
  });
  P('curiosity', {
    name: '好奇心', type: 'buff', icon: '🧿',
    desc: (n) => `每当你打出一张能力牌，此敌人获得 ${n} 点力量。`
  });
  P('unawakened', {
    name: '未觉醒', type: 'buff', icon: '🥚', noStack: true,
    desc: () => '此敌人第一次死亡后会复活。'
  });
  P('flight', {
    name: '飞行', type: 'buff', icon: '🪽',
    desc: (n) => `受到的攻击伤害减半；受到 ${n} 次攻击后落地。`,
    atDamageReceive: (c, o, n, dmg, ctx) => (ctx.isAttack ? Math.floor(dmg / 2) : dmg),
    onAttacked: (c, o, n, dmg, src, ctx) => {
      c.addPower(o, 'flight', -1, { silent: true });
      if (!o.powers.flight) { o.grounded = true; c.toast(o.name + ' 落地了！'); }
    }
  });
  P('minion', { name: '仆从', type: 'buff', icon: '🐁', noStack: true, desc: () => '首领的仆从，首领死亡后逃跑。' });
  P('life_link', { name: '生命链接', type: 'buff', icon: '🔗', noStack: true, desc: () => '若还有同伴存活，则会在 2 回合后复活。' });
  P('explosive', {
    name: '自爆', type: 'buff', icon: '💥',
    desc: (n) => `${n} 回合后爆炸，造成 30 点伤害。`
  });
  P('reactive', { name: '反应', type: 'buff', icon: '⚙️', noStack: true, desc: () => '受到攻击伤害时改变行动。' });
  P('slow', {
    name: '缓慢', type: 'debuff', icon: '🐌',
    desc: (n) => `本回合每打出一张牌，此敌人受到的伤害提高 10%（当前 +${n * 10}%）。`,
    atDamageReceive: (c, o, n, dmg, ctx) => (ctx.isAttack ? Math.floor(dmg * (1 + n * 0.1)) : dmg)
  });
  P('stasis', { name: '停滞', type: 'buff', icon: '🧊', noStack: true, desc: () => '偷走了你的一张牌，死亡时归还。' });
  P('shifting', {
    name: '变形', type: 'buff', icon: '🌀', noStack: true,
    desc: () => '受到攻击伤害时，随机将你的一张牌变为诅咒。'
  });

  /* ---------- 排序：显示顺序 ---------- */
  S.POWER_ORDER = ['strength', 'dexterity', 'vigor', 'artifact', 'intangible', 'barricade', 'buffer',
    'thorns', 'flame_barrier', 'metallicize', 'plated_armor', 'regen', 'regen_flat',
    'demon_form', 'juggernaut', 'rage', 'double_tap', 'burst', 'corruption', 'evolve',
    'fire_breathing', 'dark_embrace', 'feel_no_pain', 'brutality', 'berserk', 'combust',
    'rupture', 'mayhem', 'panache', 'sadistic', 'envenom', 'noxious_fumes', 'accuracy',
    'after_image', 'infinite_blades', 'thousand_cuts', 'wraith_form', 'echo_form',
    'ritual', 'curl_up', 'angry', 'enrage', 'spore_cloud', 'painful_stabs', 'sharp_hide',
    'malleable', 'mode_shift', 'beat_of_death', 'invincible', 'time_warp', 'curiosity',
    'unawakened', 'flight', 'minion', 'life_link', 'explosive', 'stasis', 'shifting',
    'vulnerable', 'weak', 'frail', 'poison', 'no_draw', 'entangled', 'confused', 'hex',
    'str_down', 'dex_down', 'shackled', 'slow'];
})();
