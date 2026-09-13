/* ================= enemies_act1.js · 第一幕 ================= */
(function () {
  'use strict';
  const S = window.STS, E = S.defEnemy;

  /* 通用工具 */
  function split(g, e, ids) {
    const hp = e.hp;
    ids.forEach((id) => { const n = g.spawnEnemy(id, { hp: hp }); if (n) g.pickMove(n); });
    e.dead = true; e.splitDone = true;
    g.toast(e.name + ' 分裂了！');
    g.dirty();
  }
  S.enemySplit = split;

  /* ---------------- 颚虫 ---------------- */
  E('jaw_worm', {
    name: '颚虫', hp: [40, 44], art: '🪱',
    moves: {
      chomp: { intent: { type: 'attack', dmg: 11 }, act: (g, e) => g.enemyAttackAnim(e, 11) },
      thrash: { intent: { type: 'attack_defend', dmg: 7 }, act: (g, e) => { g.enemyAttack(e, 7); g.gainBlock(e, 5, { noPower: true }); } },
      bellow: { intent: { type: 'defend_buff' }, act: (g, e) => { g.addPower(e, 'strength', 3); g.gainBlock(e, 6, { noPower: true }); } }
    },
    nextMove: (g, e, rng) => {
      if (!e.moveHistory.length) return 'chomp';
      const r = rng.int(100);
      if (r < 25) { if (g.lastMove(e, 'chomp')) return rng.chance(0.5625) ? 'thrash' : 'bellow'; return 'chomp'; }
      if (r < 55) { if (g.lastMoves(e, 'thrash', 2)) return rng.chance(0.357) ? 'chomp' : 'bellow'; return 'thrash'; }
      if (g.lastMove(e, 'bellow')) return rng.chance(0.416) ? 'chomp' : 'thrash';
      return 'bellow';
    }
  });

  /* ---------------- 信徒 ---------------- */
  E('cultist', {
    name: '信徒', hp: [48, 54], art: '🧙',
    moves: {
      incantation: { intent: { type: 'buff' }, act: (g, e) => { g.addPower(e, 'ritual', g.game.ascension >= 17 ? 5 : g.game.ascension >= 2 ? 4 : 3); e._ritualSkip = true; } },
      dark_strike: { intent: { type: 'attack', dmg: 6 }, act: (g, e) => g.enemyAttackAnim(e, 6) }
    },
    nextMove: (g, e) => (e.moveHistory.length === 0 ? 'incantation' : 'dark_strike')
  });

  /* ---------------- 虱子 ---------------- */
  function louseAI(g, e, rng) {
    const r = rng.int(100);
    if (r < 25) { if (g.lastMoves(e, 'special', 2)) return 'bite'; return 'special'; }
    if (g.lastMoves(e, 'bite', 2)) return 'special';
    return 'bite';
  }
  E('red_louse', {
    name: '红虱', hp: [10, 15], art: '🐞',
    onStart: (g, e) => {
      e.extra.bite = g.game.rng.range(5, 7);
      g.addPower(e, 'curl_up', g.game.rng.range(3, 7));
    },
    moves: {
      bite: { intent: { type: 'attack', dmg: 6, dmgFn: (g, e) => e.extra.bite || 6 }, act: (g, e) => g.enemyAttackAnim(e, e.extra.bite || 6) },
      special: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'strength', g.game.ascension >= 17 ? 4 : 3) }
    },
    nextMove: louseAI
  });
  E('green_louse', {
    name: '绿虱', hp: [11, 17], art: '🐛',
    onStart: (g, e) => {
      e.extra.bite = g.game.rng.range(5, 7);
      g.addPower(e, 'curl_up', g.game.rng.range(3, 7));
    },
    moves: {
      bite: { intent: { type: 'attack', dmg: 6, dmgFn: (g, e) => e.extra.bite || 6 }, act: (g, e) => g.enemyAttackAnim(e, e.extra.bite || 6) },
      special: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'weak', 2) }
    },
    nextMove: louseAI
  });

  /* ---------------- 酸液怪 ---------------- */
  E('acid_slime_l', {
    name: '酸液怪（大）', hp: [65, 69], art: '🟢', size: 2,
    moves: {
      corrosive_spit: {
        intent: { type: 'attack_debuff', dmg: 11 },
        act: (g, e) => { g.enemyAttack(e, 11); g.addCardTo('slimed', 'discard', { count: 2 }); }
      },
      lick: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'weak', 2) },
      tackle: { intent: { type: 'attack', dmg: 16 }, act: (g, e) => g.enemyAttackAnim(e, 16) },
      split: { intent: { type: 'unknown' }, act: (g, e) => split(g, e, ['acid_slime_m', 'acid_slime_m']) }
    },
    onDamaged: (g, e, dmg, hpLoss) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) { e.moveKey = 'split'; e.move = e.def.moves.split; g.dirty(); }
    },
    nextMove: (g, e, rng) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) return 'split';
      const r = rng.int(100);
      if (r < 30) { if (g.lastMoves(e, 'corrosive_spit', 2)) return rng.chance(0.5) ? 'tackle' : 'lick'; return 'corrosive_spit'; }
      if (r < 70) { if (g.lastMoves(e, 'tackle', 2)) return rng.chance(0.5) ? 'corrosive_spit' : 'lick'; return 'tackle'; }
      if (g.lastMove(e, 'lick')) return rng.chance(0.4) ? 'corrosive_spit' : 'tackle';
      return 'lick';
    }
  });
  E('acid_slime_m', {
    name: '酸液怪（中）', hp: [28, 32], art: '🟩',
    moves: {
      corrosive_spit: { intent: { type: 'attack_debuff', dmg: 7 }, act: (g, e) => { g.enemyAttack(e, 7); g.addCardTo('slimed', 'discard'); } },
      lick: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'weak', 1) },
      tackle: { intent: { type: 'attack', dmg: 10 }, act: (g, e) => g.enemyAttackAnim(e, 10) }
    },
    nextMove: (g, e, rng) => {
      const r = rng.int(100);
      if (r < 30) { if (g.lastMoves(e, 'corrosive_spit', 2)) return rng.chance(0.5) ? 'tackle' : 'lick'; return 'corrosive_spit'; }
      if (r < 70) { if (g.lastMoves(e, 'tackle', 2)) return rng.chance(0.5) ? 'corrosive_spit' : 'lick'; return 'tackle'; }
      if (g.lastMove(e, 'lick')) return rng.chance(0.4) ? 'corrosive_spit' : 'tackle';
      return 'lick';
    }
  });
  E('acid_slime_s', {
    name: '酸液怪（小）', hp: [8, 12], art: '🫧',
    moves: {
      lick: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'weak', 1) },
      tackle: { intent: { type: 'attack', dmg: 3 }, act: (g, e) => g.enemyAttackAnim(e, 3) }
    },
    nextMove: (g, e, rng) => {
      if (!e.moveHistory.length) return rng.chance(0.5) ? 'lick' : 'tackle';
      return g.lastMove(e, 'lick') ? 'tackle' : 'lick';
    }
  });

  /* ---------------- 尖刺怪 ---------------- */
  E('spike_slime_l', {
    name: '尖刺怪（大）', hp: [64, 70], art: '🔵', size: 2,
    moves: {
      flame_tackle: { intent: { type: 'attack_debuff', dmg: 16 }, act: (g, e) => { g.enemyAttack(e, 16); g.addCardTo('slimed', 'discard', { count: 2 }); } },
      lick: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'frail', 2) },
      split: { intent: { type: 'unknown' }, act: (g, e) => split(g, e, ['spike_slime_m', 'spike_slime_m']) }
    },
    onDamaged: (g, e) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) { e.moveKey = 'split'; e.move = e.def.moves.split; g.dirty(); }
    },
    nextMove: (g, e, rng) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) return 'split';
      if (rng.int(100) < 30) { if (g.lastMoves(e, 'flame_tackle', 2)) return 'lick'; return 'flame_tackle'; }
      if (g.lastMoves(e, 'lick', 2)) return 'flame_tackle';
      return 'lick';
    }
  });
  E('spike_slime_m', {
    name: '尖刺怪（中）', hp: [28, 32], art: '🔷',
    moves: {
      flame_tackle: { intent: { type: 'attack_debuff', dmg: 8 }, act: (g, e) => { g.enemyAttack(e, 8); g.addCardTo('slimed', 'discard'); } },
      lick: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'frail', 1) }
    },
    nextMove: (g, e, rng) => {
      if (rng.int(100) < 30) { if (g.lastMoves(e, 'flame_tackle', 2)) return 'lick'; return 'flame_tackle'; }
      if (g.lastMoves(e, 'lick', 2)) return 'flame_tackle';
      return 'lick';
    }
  });
  E('spike_slime_s', {
    name: '尖刺怪（小）', hp: [10, 14], art: '🔹',
    moves: { tackle: { intent: { type: 'attack', dmg: 5 }, act: (g, e) => g.enemyAttackAnim(e, 5) } },
    nextMove: () => 'tackle'
  });

  /* ---------------- 真菌兽 ---------------- */
  E('fungi_beast', {
    name: '真菌兽', hp: [22, 28], art: '🍄',
    powers: { spore_cloud: 2 },
    moves: {
      bite: { intent: { type: 'attack', dmg: 6 }, act: (g, e) => g.enemyAttackAnim(e, 6) },
      grow: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'strength', g.game.ascension >= 2 ? 5 : 3) }
    },
    nextMove: (g, e, rng) => {
      if (rng.int(100) < 60) { if (g.lastMoves(e, 'bite', 2)) return 'grow'; return 'bite'; }
      if (g.lastMove(e, 'grow')) return 'bite';
      return 'grow';
    }
  });

  /* ---------------- 掠夺者 / 劫掠者 ---------------- */
  E('looter', {
    name: '掠夺者', hp: [44, 48], art: '🥷',
    moves: {
      mug: { intent: { type: 'attack', dmg: 10 }, act: (g, e) => { g.enemyAttack(e, 10); g.game.stealGold(15); } },
      lunge: { intent: { type: 'attack', dmg: 12 }, act: (g, e) => { g.enemyAttack(e, 12); g.game.stealGold(15); } },
      smoke_bomb: { intent: { type: 'defend' }, act: (g, e) => g.gainBlock(e, 6, { noPower: true }) },
      escape: { intent: { type: 'escape' }, act: (g, e) => { e.dead = true; e.fled = true; g.toast(e.name + ' 逃跑了！'); g.checkAllFled(); } }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n < 2) return 'mug';
      if (n === 2) return rng.chance(0.5) ? 'lunge' : 'smoke_bomb';
      if (g.lastMove(e, 'smoke_bomb')) return 'escape';
      if (g.lastMove(e, 'lunge')) return 'smoke_bomb';
      return 'escape';
    }
  });

  /* ---------------- 奴隶主 ---------------- */
  E('slaver_blue', {
    name: '蓝色奴隶主', hp: [46, 50], art: '👤',
    moves: {
      stab: { intent: { type: 'attack', dmg: 12 }, act: (g, e) => g.enemyAttackAnim(e, 12) },
      rake: { intent: { type: 'attack_debuff', dmg: 7 }, act: (g, e) => { g.enemyAttack(e, 7); g.applyDebuff(g.player, 'weak', g.game.ascension >= 17 ? 2 : 1); } }
    },
    nextMove: (g, e, rng) => {
      if (rng.int(100) < 40) { if (g.lastMoves(e, 'rake', 2)) return 'stab'; return 'rake'; }
      if (g.lastMoves(e, 'stab', 2)) return 'rake';
      return 'stab';
    }
  });
  E('slaver_red', {
    name: '红色奴隶主', hp: [46, 50], art: '🧕',
    moves: {
      stab: { intent: { type: 'attack', dmg: 13 }, act: (g, e) => g.enemyAttackAnim(e, 13) },
      scrape: { intent: { type: 'attack_debuff', dmg: 8 }, act: (g, e) => { g.enemyAttack(e, 8); g.applyDebuff(g.player, 'vulnerable', g.game.ascension >= 17 ? 2 : 1); } },
      entangle: { intent: { type: 'strong_debuff' }, act: (g, e) => { g.applyDebuff(g.player, 'entangled', 1); e.extra.usedEntangle = true; } }
    },
    nextMove: (g, e, rng) => {
      if (!e.moveHistory.length) return 'stab';
      if (!e.extra.usedEntangle && rng.int(100) < 25) return 'entangle';
      if (rng.int(100) < 55) { if (g.lastMoves(e, 'scrape', 2)) return 'stab'; return 'scrape'; }
      if (g.lastMoves(e, 'stab', 2)) return 'scrape';
      return 'stab';
    }
  });
  E('taskmaster', {
    name: '奴隶总管', hp: [54, 60], art: '👹',
    moves: {
      scouring_whip: {
        intent: { type: 'attack_debuff', dmg: 7 },
        act: (g, e) => {
          g.enemyAttack(e, 7);
          const n = g.game.ascension >= 18 ? 3 : g.game.ascension >= 3 ? 2 : 1;
          g.addCardTo('wound', 'discard', { count: n });
        }
      }
    },
    nextMove: () => 'scouring_whip'
  });

  /* ---------------- 哥布林 ---------------- */
  E('mad_gremlin', {
    name: '疯狂哥布林', hp: [20, 24], art: '👺',
    powers: { angry: 1 },
    moves: { scratch: { intent: { type: 'attack', dmg: 4 }, act: (g, e) => g.enemyAttackAnim(e, 4) } },
    nextMove: () => 'scratch'
  });
  E('sneaky_gremlin', {
    name: '狡诈哥布林', hp: [10, 14], art: '🥸',
    moves: { puncture: { intent: { type: 'attack', dmg: 9 }, act: (g, e) => g.enemyAttackAnim(e, 9) } },
    nextMove: () => 'puncture'
  });
  E('fat_gremlin', {
    name: '肥胖哥布林', hp: [13, 17], art: '👶',
    moves: {
      smash: {
        intent: { type: 'attack_debuff', dmg: 4 },
        act: (g, e) => { g.enemyAttack(e, 4); g.applyDebuff(g.player, 'weak', 1); if (g.game.ascension >= 18) g.applyDebuff(g.player, 'frail', 1); }
      }
    },
    nextMove: () => 'smash'
  });
  E('shield_gremlin', {
    name: '盾牌哥布林', hp: [12, 15], art: '🛡️',
    moves: {
      protect: {
        intent: { type: 'defend' },
        act: (g, e) => {
          const others = g.enemies().filter((x) => x !== e);
          const t = others.length ? g.game.rng.pick(others) : e;
          g.gainBlock(t, g.game.ascension >= 17 ? 11 : 7, { noPower: true });
        }
      },
      shield_bash: { intent: { type: 'attack', dmg: 6 }, act: (g, e) => g.enemyAttackAnim(e, 6) }
    },
    nextMove: (g, e) => (g.enemies().filter((x) => x !== e).length ? 'protect' : 'shield_bash')
  });
  E('gremlin_wizard', {
    name: '哥布林巫师', hp: [21, 25], art: '🧝',
    moves: {
      charging: { intent: { type: 'unknown' }, act: (g, e) => { e.extra.charge = (e.extra.charge || 0) + 1; } },
      ultimate_blast: { intent: { type: 'attack', dmg: 25 }, act: (g, e) => { g.enemyAttackAnim(e, 25); e.extra.charge = 0; } }
    },
    nextMove: (g, e) => ((e.extra.charge || 0) >= 3 ? 'ultimate_blast' : 'charging')
  });

  /* ================= 精英 ================= */
  E('gremlin_nob', {
    name: '哥布林头目', hp: [82, 86], art: '👹', size: 2, elite: true,
    moves: {
      bellow: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'enrage', g.game.ascension >= 18 ? 3 : 2) },
      rush: { intent: { type: 'attack', dmg: 14 }, act: (g, e) => g.enemyAttackAnim(e, 14) },
      skull_bash: { intent: { type: 'attack_debuff', dmg: 6 }, act: (g, e) => { g.enemyAttack(e, 6); g.applyDebuff(g.player, 'vulnerable', 2); } }
    },
    nextMove: (g, e, rng) => {
      if (!e.moveHistory.length) return 'bellow';
      if (g.game.ascension >= 18) {
        if (!g.lastMove(e, 'skull_bash') && e.moveHistory.length % 3 === 2) return 'skull_bash';
        return 'rush';
      }
      if (rng.int(100) < 33) return 'skull_bash';
      if (g.lastMoves(e, 'rush', 2)) return 'skull_bash';
      return 'rush';
    }
  });
  E('lagavulin', {
    name: '拉加维林', hp: [109, 111], art: '🦀', size: 2, elite: true,
    powers: { metallicize: 8 },
    onStart: (g, e) => { e.extra.asleep = true; e.extra.sleepTurns = 0; },
    onDamaged: (g, e, dmg, hpLoss) => {
      if (e.extra.asleep && hpLoss > 0) {
        e.extra.asleep = false;
        e.extra.woke = true;
        g.toast('拉加维林被惊醒了！');
        e.moveKey = 'attack'; e.move = e.def.moves.attack;
        g.dirty();
      }
    },
    moves: {
      sleep: { intent: { type: 'sleep' }, act: (g, e) => { e.extra.sleepTurns++; if (e.extra.sleepTurns >= 3) { e.extra.asleep = false; g.toast('拉加维林醒了！'); } } },
      attack: { intent: { type: 'attack', dmg: 18 }, act: (g, e) => g.enemyAttackAnim(e, 18) },
      siphon_soul: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => {
          const n = g.game.ascension >= 18 ? 2 : 1;
          g.applyDebuff(g.player, 'strength', -n);
          g.applyDebuff(g.player, 'dexterity', -n);
        }
      }
    },
    nextMove: (g, e) => {
      if (e.extra.asleep) return 'sleep';
      const awake = e.moveHistory.filter((m) => m !== 'sleep').length;
      if (awake > 0 && awake % 3 === 2) return 'siphon_soul';
      return 'attack';
    }
  });
  E('sentry', {
    name: '哨卫', hp: [38, 42], art: '🗿', elite: true,
    powers: { artifact: 1 },
    onStart: (g, e) => { e.extra.idx = g.enemyList.indexOf(e); },
    moves: {
      beam: { intent: { type: 'attack', dmg: 9 }, act: (g, e) => g.enemyAttackAnim(e, 9) },
      bolt: {
        intent: { type: 'debuff' },
        act: (g, e) => g.addCardTo('dazed', 'discard', { count: g.game.ascension >= 18 ? 3 : 2 })
      }
    },
    nextMove: (g, e) => {
      const odd = (e.extra.idx || 0) % 2 === 1;
      const n = e.moveHistory.length;
      const startBolt = !odd;
      return (n % 2 === 0) === startBolt ? 'bolt' : 'beam';
    }
  });

  /* ================= 首领 ================= */
  E('the_guardian', {
    name: '守卫者', hp: [240, 240], art: '🤖', size: 3, boss: true,
    powers: { mode_shift: 30 },
    onStart: (g, e) => { e.extra.mode = 'off'; e.extra.threshold = 30; e.extra.seq = 0; },
    onDamaged: (g, e) => {
      if (e.shiftReady && e.extra.mode === 'off') {
        e.shiftReady = false;
        e.extra.mode = 'def';
        e.extra.threshold += 10;
        g.gainBlock(e, 20, { noPower: true });
        g.addPower(e, 'sharp_hide', 3);
        e.moveKey = 'roll_attack'; e.move = e.def.moves.roll_attack;
        g.toast('守卫者进入防御模式！');
        g.dirty();
      }
    },
    moves: {
      charging_up: { intent: { type: 'defend' }, act: (g, e) => g.gainBlock(e, 9, { noPower: true }) },
      fierce_bash: { intent: { type: 'attack', dmg: 32 }, act: (g, e) => g.enemyAttackAnim(e, 32) },
      vent_steam: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => { g.applyDebuff(g.player, 'vulnerable', 2); g.applyDebuff(g.player, 'weak', 2); }
      },
      whirlwind: { intent: { type: 'attack', dmg: 5, times: 4 }, act: (g, e) => g.enemyAttackAnim(e, 5, 4) },
      roll_attack: { intent: { type: 'attack', dmg: 9 }, act: (g, e) => { g.enemyAttackAnim(e, 9); } },
      twin_slam: {
        intent: { type: 'attack', dmg: 8, times: 2 },
        act: (g, e) => {
          g.enemyAttackAnim(e, 8, 2);
          e.extra.mode = 'off'; e.extra.seq = 0;
          g.removePower(e, 'sharp_hide');
          g.setPower(e, 'mode_shift', e.extra.threshold);
          g.toast('守卫者回到攻击模式！');
        }
      }
    },
    nextMove: (g, e) => {
      if (e.extra.mode === 'def') return g.lastMove(e, 'roll_attack') ? 'twin_slam' : 'roll_attack';
      const seq = ['charging_up', 'fierce_bash', 'vent_steam', 'whirlwind'];
      const k = seq[(e.extra.seq || 0) % 4];
      e.extra.seq = (e.extra.seq || 0) + 1;
      return k;
    }
  });

  E('hexaghost', {
    name: '六火幽鬼', hp: [250, 250], art: '👻', size: 3, boss: true,
    onStart: (g, e) => { e.extra.seq = 0; e.extra.burnUp = 0; },
    moves: {
      activate: { intent: { type: 'unknown' }, act: () => { } },
      divider: {
        intent: { type: 'attack', times: 6, dmgFn: (g) => Math.floor(g.player.hp / 12) + 1 },
        act: (g, e) => g.enemyAttackAnim(e, Math.floor(g.player.hp / 12) + 1, 6)
      },
      sear: {
        intent: { type: 'attack_debuff', dmg: 6 },
        act: (g, e) => { g.enemyAttack(e, 6); g.addCardTo('burn', 'discard', { count: g.game.ascension >= 19 ? 2 : 1, upg: e.extra.burnUp }); }
      },
      tackle: { intent: { type: 'attack', dmg: 5, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 4 ? 6 : 5, 2) },
      inflame: { intent: { type: 'defend_buff' }, act: (g, e) => { g.addPower(e, 'strength', 2); g.gainBlock(e, 12, { noPower: true }); } },
      inferno: {
        intent: { type: 'attack_debuff', dmg: 2, times: 6 },
        act: (g, e) => {
          g.enemyAttackAnim(e, g.game.ascension >= 4 ? 3 : 2, 6);
          g.addCardTo('burn', 'discard', { count: 3, upg: 1 });
          e.extra.burnUp = 1;
        }
      }
    },
    nextMove: (g, e) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'activate';
      if (n === 1) return 'divider';
      const seq = ['sear', 'tackle', 'sear', 'inflame', 'tackle', 'sear', 'inferno'];
      return seq[(n - 2) % 7];
    }
  });

  E('slime_boss', {
    name: '史莱姆之王', hp: [140, 140], art: '🟩', size: 3, boss: true,
    onStart: (g, e) => { e.extra.seq = 0; },
    onDamaged: (g, e) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) { e.moveKey = 'split'; e.move = e.def.moves.split; g.dirty(); }
    },
    moves: {
      goop_spray: { intent: { type: 'debuff' }, act: (g, e) => g.addCardTo('slimed', 'discard', { count: g.game.ascension >= 19 ? 5 : 3 }) },
      preparing: { intent: { type: 'unknown' }, act: () => { } },
      slam: { intent: { type: 'attack', dmg: 35 }, act: (g, e) => g.enemyAttackAnim(e, 35) },
      split: { intent: { type: 'unknown' }, act: (g, e) => split(g, e, ['spike_slime_l', 'acid_slime_l']) }
    },
    nextMove: (g, e) => {
      if (!e.splitDone && e.hp > 0 && e.hp <= e.maxHp / 2) return 'split';
      const seq = ['goop_spray', 'preparing', 'slam'];
      const k = seq[(e.extra.seq || 0) % 3];
      e.extra.seq = (e.extra.seq || 0) + 1;
      return k;
    }
  });
})();
