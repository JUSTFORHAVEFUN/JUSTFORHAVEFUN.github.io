/* ================= enemies_act2.js · 第二幕 ================= */
(function () {
  'use strict';
  const S = window.STS, E = S.defEnemy;

  /* ---------------- 鸟怪 ---------------- */
  E('byrd', {
    name: '鸟怪', hp: [25, 31], art: '🦅',
    powers: { flight: 3 },
    moves: {
      peck: { intent: { type: 'attack', dmg: 1, times: 5 }, act: (g, e) => g.enemyAttackAnim(e, 1, g.game.ascension >= 2 ? 6 : 5) },
      swoop: { intent: { type: 'attack', dmg: 14 }, act: (g, e) => g.enemyAttackAnim(e, 14) },
      caw: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'strength', 1) },
      fly: { intent: { type: 'buff' }, act: (g, e) => { g.addPower(e, 'flight', 3); e.grounded = false; } },
      headbutt: { intent: { type: 'attack', dmg: 3 }, act: (g, e) => g.enemyAttackAnim(e, 3) },
      stunned: { intent: { type: 'stun' }, act: () => { } }
    },
    nextMove: (g, e, rng) => {
      if (e.grounded) {
        if (g.lastMove(e, 'stunned')) return 'fly';
        if (g.lastMove(e, 'headbutt')) return 'fly';
        return 'stunned';
      }
      if (!e.moveHistory.length) return rng.chance(0.375) ? 'peck' : 'swoop';
      const r = rng.int(100);
      if (r < 50) { if (g.lastMoves(e, 'peck', 2)) return rng.chance(0.4) ? 'swoop' : 'caw'; return 'peck'; }
      if (r < 70) { if (g.lastMove(e, 'caw')) return 'peck'; return 'caw'; }
      if (g.lastMoves(e, 'swoop', 2)) return 'peck';
      return 'swoop';
    }
  });

  /* ---------------- 被选中者 ---------------- */
  E('chosen', {
    name: '被选中者', hp: [95, 99], art: '🧟', size: 2,
    moves: {
      poke: { intent: { type: 'attack', dmg: 5, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 6 : 5, 2) },
      zap: { intent: { type: 'attack', dmg: 18 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 21 : 18) },
      debilitate: {
        intent: { type: 'attack_debuff', dmg: 10 },
        act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 2 ? 12 : 10); g.applyDebuff(g.player, 'vulnerable', 2); }
      },
      drain: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => { g.applyDebuff(g.player, 'weak', 3); g.applyDebuff(g.player, 'strength', -3); g.addPower(e, 'strength', 3); }
      },
      hex: { intent: { type: 'strong_debuff' }, act: (g, e) => g.applyDebuff(g.player, 'hex', 1) }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'hex';
      if (n === 1) return 'zap';
      if (g.lastMove(e, 'debilitate')) return 'drain';
      if (rng.chance(0.4)) return 'debilitate';
      if (g.lastMoves(e, 'poke', 2)) return 'zap';
      return rng.chance(0.5) ? 'poke' : 'zap';
    }
  });

  /* ---------------- 带壳寄生虫 ---------------- */
  E('shelled_parasite', {
    name: '带壳寄生虫', hp: [68, 72], art: '🦂', size: 2,
    powers: { plated_armor: 14 },
    moves: {
      double_strike: { intent: { type: 'attack', dmg: 6, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, 6, 2) },
      suck: {
        intent: { type: 'attack', dmg: 10 },
        act: (g, e) => { const d = g.enemyAttack(e, g.game.ascension >= 2 ? 12 : 10); g.heal(e, 10); }
      },
      fell: {
        intent: { type: 'attack_debuff', dmg: 18 },
        act: (g, e) => { g.enemyAttack(e, 18); g.applyDebuff(g.player, 'frail', 2); }
      },
      stunned: { intent: { type: 'stun' }, act: () => { } }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'double_strike';
      if (n === 1) return 'suck';
      const r = rng.int(100);
      if (r < 40 && !g.lastMoves(e, 'double_strike', 2)) return 'double_strike';
      if (r < 70 && !g.lastMove(e, 'suck')) return 'suck';
      if (!g.lastMove(e, 'fell')) return 'fell';
      return 'double_strike';
    }
  });

  /* ---------------- 球形守卫 ---------------- */
  E('spheric_guardian', {
    name: '球形守卫', hp: [20, 20], art: '⚙️',
    powers: { barricade: 1, artifact: 3 },
    onStart: (g, e) => { e.block = 40; },
    moves: {
      activate: { intent: { type: 'defend' }, act: (g, e) => g.gainBlock(e, 25, { noPower: true }) },
      attack_debuff: {
        intent: { type: 'attack_debuff', dmg: 10 },
        act: (g, e) => { g.enemyAttack(e, 10); g.addCardTo('dazed', 'draw', { count: 2, random: true }); }
      },
      slam: { intent: { type: 'attack', dmg: 10, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, 10, 2) },
      harden: { intent: { type: 'attack_defend', dmg: 10 }, act: (g, e) => { g.enemyAttack(e, 10); g.gainBlock(e, 15, { noPower: true }); } }
    },
    nextMove: (g, e) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'activate';
      if (n === 1) return 'attack_debuff';
      const seq = ['slam', 'harden', 'slam', 'attack_debuff'];
      return seq[(n - 2) % 4];
    }
  });

  /* ---------------- 蛇颈怪 ---------------- */
  E('snecko', {
    name: '蛇颈怪', hp: [114, 120], art: '🐍', size: 3,
    moves: {
      perplexing_glare: { intent: { type: 'strong_debuff' }, act: (g, e) => g.applyDebuff(g.player, 'confused', 1) },
      tail_whip: {
        intent: { type: 'attack_debuff', dmg: 8 },
        act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 2 ? 10 : 8); g.applyDebuff(g.player, 'vulnerable', g.game.ascension >= 17 ? 2 : 1); }
      },
      bite: { intent: { type: 'attack', dmg: 15 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 18 : 15) }
    },
    nextMove: (g, e, rng) => {
      if (!e.moveHistory.length) return 'perplexing_glare';
      if (rng.int(100) < 60) { if (g.lastMoves(e, 'bite', 2)) return 'tail_whip'; return 'bite'; }
      if (g.lastMove(e, 'tail_whip')) return 'bite';
      return 'tail_whip';
    }
  });

  /* ---------------- 百夫长 & 秘术师 ---------------- */
  E('centurion', {
    name: '百夫长', hp: [76, 80], art: '🛡️', size: 2,
    moves: {
      slash: { intent: { type: 'attack', dmg: 12 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 14 : 12) },
      fury: { intent: { type: 'attack', dmg: 6, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 7 : 6, 3) },
      defend: {
        intent: { type: 'defend' },
        act: (g, e) => {
          const others = g.enemies().filter((x) => x !== e);
          g.gainBlock(e, 15, { noPower: true });
          if (others.length) g.gainBlock(g.game.rng.pick(others), 15, { noPower: true });
        }
      }
    },
    nextMove: (g, e, rng) => {
      const hasAlly = g.enemies().length > 1;
      if (!e.moveHistory.length) return 'slash';
      if (hasAlly && !g.lastMove(e, 'defend') && rng.chance(0.35)) return 'defend';
      if (g.lastMove(e, 'slash')) return 'fury';
      return 'slash';
    }
  });
  E('mystic', {
    name: '秘术师', hp: [48, 56], art: '🔮',
    moves: {
      heal: {
        intent: { type: 'buff' },
        act: (g, e) => g.enemies().forEach((x) => g.heal(x, g.game.ascension >= 2 ? 20 : 16))
      },
      buff: {
        intent: { type: 'buff' },
        act: (g, e) => g.enemies().forEach((x) => g.addPower(x, 'strength', g.game.ascension >= 2 ? 3 : 2))
      },
      attack_debuff: {
        intent: { type: 'attack_debuff', dmg: 8 },
        act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 2 ? 9 : 8); g.applyDebuff(g.player, 'frail', 2); }
      }
    },
    nextMove: (g, e, rng) => {
      const hurt = g.enemies().some((x) => x.hp < x.maxHp * 0.7);
      if (hurt && !g.lastMove(e, 'heal')) return 'heal';
      if (!g.lastMove(e, 'buff') && rng.chance(0.4)) return 'buff';
      return 'attack_debuff';
    }
  });

  /* ---------------- 蛇形植物 ---------------- */
  E('snake_plant', {
    name: '蛇形植物', hp: [75, 79], art: '🪴', size: 2,
    powers: { malleable: 3 },
    moves: {
      chomp: { intent: { type: 'attack', dmg: 7, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 8 : 7, 3) },
      enfeebling_spores: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => { g.applyDebuff(g.player, 'weak', 2); g.applyDebuff(g.player, 'frail', 2); }
      }
    },
    nextMove: (g, e, rng) => {
      if (g.lastMoves(e, 'chomp', 2)) return 'enfeebling_spores';
      if (g.lastMove(e, 'enfeebling_spores')) return 'chomp';
      return rng.chance(0.65) ? 'chomp' : 'enfeebling_spores';
    }
  });

  /* ---------------- 劫掠者 ---------------- */
  E('mugger', {
    name: '劫掠者', hp: [48, 52], art: '🥷',
    moves: {
      mug: { intent: { type: 'attack', dmg: 10 }, act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 2 ? 11 : 10); g.game.stealGold(20); } },
      lunge: { intent: { type: 'attack', dmg: 16 }, act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 2 ? 18 : 16); g.game.stealGold(20); } },
      smoke_bomb: { intent: { type: 'defend' }, act: (g, e) => g.gainBlock(e, 11, { noPower: true }) },
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

  /* ================= 精英 ================= */
  E('gremlin_leader', {
    name: '哥布林首领', hp: [140, 148], art: '👺', size: 2, elite: true, isLeader: true,
    onStart: (g, e) => { e.extra.rallied = 0; },
    moves: {
      encourage: {
        intent: { type: 'buff' },
        act: (g, e) => {
          const n = g.game.ascension >= 18 ? 5 : g.game.ascension >= 3 ? 4 : 3;
          g.enemies().forEach((x) => { if (x !== e) g.addPower(x, 'strength', n); g.gainBlock(x, 6, { noPower: true }); });
          g.addPower(e, 'strength', n);
        }
      },
      rally: {
        intent: { type: 'unknown' },
        act: (g, e) => {
          const pool = ['mad_gremlin', 'sneaky_gremlin', 'fat_gremlin', 'shield_gremlin', 'gremlin_wizard'];
          for (let i = 0; i < 2; i++) {
            if (g.enemyList.filter((x) => !x.dead).length >= 4) break;
            const n = g.spawnEnemy(g.game.rng.pick(pool));
            if (n) { g.addPower(n, 'minion', 1); g.pickMove(n); }
          }
          e.extra.rallied++;
          g.toast('哥布林首领召唤了援军！');
        }
      },
      stab: { intent: { type: 'attack', dmg: 6, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, 6, 3) }
    },
    nextMove: (g, e, rng) => {
      const minions = g.enemies().filter((x) => x !== e).length;
      if (minions === 0 && e.extra.rallied < 3) return 'rally';
      if (minions >= 2 && !g.lastMove(e, 'encourage') && rng.chance(0.5)) return 'encourage';
      if (g.lastMoves(e, 'stab', 2)) return minions ? 'encourage' : 'rally';
      return 'stab';
    }
  });

  E('book_of_stabbing', {
    name: '穿刺之书', hp: [160, 164], art: '📕', size: 2, elite: true,
    powers: { painful_stabs: 1 },
    onStart: (g, e) => { e.extra.stabs = g.game.ascension >= 18 ? 2 : 1; },
    moves: {
      multi_stab: {
        intent: { type: 'attack', dmg: 6, times: 2, timesFn: (g, e) => e.extra.stabs + 1 },
        act: (g, e) => { e.extra.stabs++; g.enemyAttackAnim(e, g.game.ascension >= 3 ? 7 : 6, e.extra.stabs); }
      },
      single_stab: { intent: { type: 'attack', dmg: 21 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 24 : 21) }
    },
    nextMove: (g, e, rng) => {
      if (rng.int(100) < 15 && !g.lastMove(e, 'single_stab')) return 'single_stab';
      return 'multi_stab';
    }
  });

  /* ================= 首领 ================= */
  E('bronze_orb', {
    name: '青铜法球', hp: [52, 58], art: '🔶',
    powers: { minion: 1 },
    moves: {
      beam: { intent: { type: 'attack', dmg: 8 }, act: (g, e) => g.enemyAttackAnim(e, 8) },
      support_beam: {
        intent: { type: 'defend' },
        act: (g, e) => {
          const boss = g.enemies().find((x) => x.id === 'bronze_automaton');
          g.gainBlock(boss || e, 12, { noPower: true });
        }
      },
      stasis: {
        intent: { type: 'unknown' },
        act: (g, e) => {
          const pool = g.hand.concat(g.drawPile).filter((c) => S.cards[c.id].type !== 'status' && S.cards[c.id].type !== 'curse');
          if (pool.length) {
            const c = g.game.rng.pick(pool);
            e.extra.stolen = c;
            ['hand', 'drawPile', 'discardPile'].forEach((p) => { const i = g[p].indexOf(c); if (i >= 0) g[p].splice(i, 1); });
            g.addPower(e, 'stasis', 1);
            g.toast('青铜法球偷走了 ' + S.cardName(c));
            g.dirty();
          }
        }
      }
    },
    onDeath: (g, e) => {
      if (e.extra.stolen) { g.hand.length < 10 ? g.hand.push(e.extra.stolen) : g.discardPile.push(e.extra.stolen); g.toast('你取回了 ' + S.cardName(e.extra.stolen)); e.extra.stolen = null; g.dirty(); }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'beam';
      if (n === 1) return 'stasis';
      return rng.chance(0.5) ? 'beam' : 'support_beam';
    }
  });
  E('bronze_automaton', {
    name: '青铜自动机', hp: [300, 300], art: '🤖', size: 3, boss: true, isLeader: false,
    powers: { artifact: 3 },
    onStart: (g, e) => { e.extra.seq = 0; },
    moves: {
      spawn_orbs: {
        intent: { type: 'unknown' },
        act: (g, e) => {
          for (let i = 0; i < 2; i++) { const o = g.spawnEnemy('bronze_orb'); if (o) g.pickMove(o); }
          g.toast('青铜自动机召唤了法球！');
        }
      },
      flail: { intent: { type: 'attack', dmg: 7, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 4 ? 8 : 7, 2) },
      boost: { intent: { type: 'defend_buff' }, act: (g, e) => { g.gainBlock(e, g.game.ascension >= 9 ? 12 : 9, { noPower: true }); g.addPower(e, 'strength', 3); } },
      hyper_beam: { intent: { type: 'attack', dmg: 45 }, act: (g, e) => { g.enemyAttackAnim(e, g.game.ascension >= 4 ? 50 : 45); e.extra.stunNext = true; } },
      stunned: { intent: { type: 'stun' }, act: (g, e) => { e.extra.stunNext = false; } }
    },
    nextMove: (g, e) => {
      if (e.extra.stunNext) return 'stunned';
      const n = e.moveHistory.length;
      if (n === 0) return 'spawn_orbs';
      const seq = ['flail', 'boost', 'flail', 'boost', 'hyper_beam'];
      const idx = e.moveHistory.filter((m) => m !== 'stunned' && m !== 'spawn_orbs').length;
      return seq[idx % 5];
    }
  });

  E('the_champ', {
    name: '冠军', hp: [420, 420], art: '🗡️', size: 3, boss: true,
    onStart: (g, e) => { e.extra.seq = 0; e.extra.angered = false; e.extra.taunts = 0; },
    onDamaged: (g, e) => {
      if (!e.extra.angered && e.hp > 0 && e.hp <= e.maxHp / 2) {
        e.extra.angered = true;
        e.moveKey = 'anger'; e.move = e.def.moves.anger;
        g.dirty();
      }
    },
    moves: {
      defensive_stance: {
        intent: { type: 'defend_buff' },
        act: (g, e) => { g.gainBlock(e, g.game.ascension >= 9 ? 20 : 15, { noPower: true }); g.addPower(e, 'metallicize', g.game.ascension >= 9 ? 7 : 5); }
      },
      face_slap: {
        intent: { type: 'attack_debuff', dmg: 12 },
        act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 4 ? 14 : 12); g.applyDebuff(g.player, 'frail', 2); g.applyDebuff(g.player, 'vulnerable', 2); }
      },
      taunt: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => { g.applyDebuff(g.player, 'weak', 2); g.applyDebuff(g.player, 'vulnerable', 2); e.extra.taunts++; }
      },
      heavy_slash: { intent: { type: 'attack', dmg: 16 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 4 ? 18 : 16) },
      gloat: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'strength', g.game.ascension >= 9 ? 4 : 2) },
      execute: { intent: { type: 'attack', dmg: 10, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, 10, 2) },
      anger: {
        intent: { type: 'buff' },
        act: (g, e) => {
          g.addPower(e, 'strength', g.game.ascension >= 9 ? 9 : 6);
          Object.keys(e.powers).forEach((k) => { if (S.powers[k] && S.powers[k].type === 'debuff') g.removePower(e, k); });
          g.toast('冠军愤怒了！');
        }
      }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.filter((m) => m !== 'anger').length;
      if (e.extra.angered && !e.moveHistory.includes('anger')) return 'anger';
      const cycle = ['defensive_stance', 'face_slap', 'heavy_slash', 'gloat', 'defensive_stance', 'execute', 'taunt', 'heavy_slash'];
      if (e.extra.angered) {
        // 愤怒后更凶猛
        const cyc2 = ['execute', 'heavy_slash', 'face_slap', 'execute', 'gloat'];
        return cyc2[n % 5];
      }
      return cycle[n % 8];
    }
  });

  E('torch_head', {
    name: '火炬头', hp: [38, 40], art: '🔥',
    powers: { minion: 1 },
    moves: { tackle: { intent: { type: 'attack', dmg: 7 }, act: (g, e) => g.enemyAttackAnim(e, 7) } },
    nextMove: () => 'tackle'
  });
  E('the_collector', {
    name: '收藏家', hp: [282, 282], art: '👑', size: 3, boss: true, isLeader: true,
    onStart: (g, e) => { e.extra.seq = 0; e.extra.spawned = 0; },
    moves: {
      spawn: {
        intent: { type: 'unknown' },
        act: (g, e) => {
          const need = 2 - g.enemies().filter((x) => x.id === 'torch_head').length;
          for (let i = 0; i < need; i++) { const o = g.spawnEnemy('torch_head'); if (o) g.pickMove(o); }
          e.extra.spawned++;
          g.toast('收藏家召唤了火炬头！');
        }
      },
      fireball: { intent: { type: 'attack', dmg: 18 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 4 ? 21 : 18) },
      buff: { intent: { type: 'defend_buff' }, act: (g, e) => { g.addPower(e, 'strength', g.game.ascension >= 19 ? 5 : 3); g.gainBlock(e, 15, { noPower: true }); } },
      mega_debuff: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => {
          const n = g.game.ascension >= 19 ? 5 : 3;
          g.applyDebuff(g.player, 'weak', n); g.applyDebuff(g.player, 'vulnerable', n); g.applyDebuff(g.player, 'frail', n);
        }
      }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'spawn';
      if (n === 3) return 'mega_debuff';
      const torches = g.enemies().filter((x) => x.id === 'torch_head').length;
      if (torches < 2 && n % 4 === 0) return 'spawn';
      if (rng.chance(0.25)) return 'buff';
      return 'fireball';
    }
  });
})();
