/* ================= enemies_act3.js · 第三幕 & 心脏 ================= */
(function () {
  'use strict';
  const S = window.STS, E = S.defEnemy;

  /* ---------------- 暗影兽 ---------------- */
  E('darkling', {
    name: '暗影兽', hp: [48, 56], art: '🦑',
    powers: { life_link: 1 },
    onStart: (g, e) => { e.extra.nip = g.game.rng.range(7, 11); },
    moves: {
      nip: { intent: { type: 'attack', dmg: 9, dmgFn: (g, e) => e.extra.nip || 9 }, act: (g, e) => g.enemyAttackAnim(e, e.extra.nip || 9) },
      chomp: { intent: { type: 'attack', dmg: 8, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 9 : 8, 2) },
      harden: { intent: { type: 'defend_buff' }, act: (g, e) => { g.gainBlock(e, 12, { noPower: true }); g.addPower(e, 'strength', 2); } },
      reincarnate: { intent: { type: 'buff' }, act: (g, e) => { e.hp = Math.floor(e.maxHp / 2); g.toast('暗影兽重生了！'); } },
      regrow: { intent: { type: 'unknown' }, act: () => { } }
    },
    onDeath: (g, e) => {
      const allies = g.enemies().filter((x) => x.id === 'darkling');
      if (allies.length > 0) { e.extra.reviveIn = 2; e.canRevive = true; }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'chomp';
      if (rng.chance(0.4)) return 'harden';
      return rng.chance(0.5) ? 'nip' : 'chomp';
    }
  });

  /* ---------------- 法球行者 ---------------- */
  E('orb_walker', {
    name: '法球行者', hp: [90, 96], art: '🔮', size: 2,
    onStart: (g, e) => { g.addPower(e, 'strength', 0); },
    moves: {
      laser: {
        intent: { type: 'attack_debuff', dmg: 10 },
        act: (g, e) => {
          g.enemyAttack(e, g.game.ascension >= 2 ? 11 : 10);
          g.addCardTo('burn', 'discard', { upg: 1 });
          g.addPower(e, 'strength', g.game.ascension >= 17 ? 6 : 5);
        }
      },
      claw: {
        intent: { type: 'attack', dmg: 15 },
        act: (g, e) => { g.enemyAttackAnim(e, g.game.ascension >= 2 ? 16 : 15); g.addPower(e, 'strength', g.game.ascension >= 17 ? 6 : 5); }
      }
    },
    nextMove: (g, e, rng) => (rng.chance(0.5) ? 'laser' : 'claw')
  });

  /* ---------------- 尖刺者 / 爆破者 / 排斥者 ---------------- */
  E('spiker', {
    name: '尖刺者', hp: [42, 56], art: '🦔',
    powers: { thorns: 2 },
    moves: {
      cut: { intent: { type: 'attack', dmg: 7 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 9 : 7) },
      spike: { intent: { type: 'buff' }, act: (g, e) => g.addPower(e, 'thorns', g.game.ascension >= 17 ? 3 : 2) }
    },
    nextMove: (g, e, rng) => (e.moveHistory.length === 0 ? 'spike' : (rng.chance(0.6) ? 'cut' : 'spike'))
  });
  E('exploder', {
    name: '爆破者', hp: [30, 35], art: '💣',
    powers: { explosive: 3 },
    moves: {
      slam: { intent: { type: 'attack', dmg: 9 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 11 : 9) },
      explode: {
        intent: { type: 'attack', dmg: 30 },
        act: (g, e) => { g.enemyAttackAnim(e, 30); e.dead = true; e.hp = 0; g.toast('爆破者自爆了！'); g.checkAllFled(); }
      }
    },
    nextMove: (g, e) => {
      const t = e.powers.explosive;
      if (t !== undefined && t <= 1) return 'explode';
      return 'slam';
    },
    onTurnEndCustom: () => { }
  });
  E('repulsor', {
    name: '排斥者', hp: [29, 35], art: '🛸',
    moves: {
      bash: { intent: { type: 'attack', dmg: 11 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 2 ? 13 : 11) },
      repulse: { intent: { type: 'debuff' }, act: (g, e) => g.addCardTo('dazed', 'draw', { count: 2, random: true }) }
    },
    nextMove: (g, e, rng) => (rng.chance(0.2) ? 'bash' : 'repulse')
  });

  /* ---------------- 蠕动之物 ---------------- */
  E('writhing_mass', {
    name: '蠕动之物', hp: [160, 160], art: '🫧', size: 3,
    powers: { malleable: 3 },
    moves: {
      implant: { intent: { type: 'strong_debuff' }, act: (g, e) => { g.game.addCardToDeck('parasite'); g.toast('你的牌组中出现了寄生虫！'); e.extra.implanted = true; } },
      flail: { intent: { type: 'attack', dmg: 15 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 16 : 15) },
      wither: { intent: { type: 'attack_debuff', dmg: 7 }, act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 3 ? 9 : 7); g.applyDebuff(g.player, 'weak', 2); g.applyDebuff(g.player, 'vulnerable', 2); } },
      multi_strike: { intent: { type: 'attack', dmg: 7, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 9 : 7, 3) },
      strong_strike: { intent: { type: 'attack', dmg: 32 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 38 : 32) }
    },
    nextMove: (g, e, rng) => {
      const r = rng.int(100);
      if (r < 10 && !e.extra.implanted) return 'implant';
      if (r < 32) return 'flail';
      if (r < 55) return 'multi_strike';
      if (r < 78) return 'wither';
      return 'strong_strike';
    }
  });

  /* ---------------- 巨口 ---------------- */
  E('maw', {
    name: '巨口', hp: [300, 300], art: '👄', size: 3,
    onStart: (g, e) => { e.extra.seq = 0; },
    moves: {
      roar: { intent: { type: 'strong_debuff' }, act: (g, e) => { g.applyDebuff(g.player, 'weak', 5); g.applyDebuff(g.player, 'frail', 5); } },
      slam: { intent: { type: 'attack', dmg: 25 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 30 : 25) },
      nom: { intent: { type: 'attack', dmg: 5, times: 5 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 6 : 5, 5) },
      terrify: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'vulnerable', 5) }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'roar';
      if (n === 1) return 'terrify';
      return rng.chance(0.5) ? 'slam' : 'nom';
    }
  });

  /* ---------------- 短暂之物 ---------------- */
  E('transient', {
    name: '短暂之物', hp: [999, 999], art: '🌫️', size: 2,
    onStart: (g, e) => { e.extra.fade = 5; g.addPower(e, 'shifting', 1); },
    moves: {
      attack: {
        intent: { type: 'attack', dmg: 30, dmgFn: (g, e) => 30 + 10 * (e.moveHistory.length) },
        act: (g, e) => {
          g.enemyAttackAnim(e, 30 + 10 * e.moveHistory.length);
          e.extra.fade--;
          if (e.extra.fade <= 0) { e.dead = true; e.fled = true; g.toast('短暂之物消散了。'); g.checkAllFled(); }
        }
      }
    },
    nextMove: () => 'attack'
  });

  /* ================= 精英 ================= */
  E('nemesis', {
    name: '复仇女神', hp: [185, 185], art: '😈', size: 3, elite: true,
    onStart: (g, e) => { g.addPower(e, 'intangible', 2); e.extra.seq = 0; },
    moves: {
      debuff: { intent: { type: 'debuff' }, act: (g, e) => g.addCardTo('burn', 'discard', { count: 3, upg: g.game.ascension >= 18 ? 1 : 0 }) },
      scythe: { intent: { type: 'attack', dmg: 45 }, act: (g, e) => g.enemyAttackAnim(e, 45) },
      attack: { intent: { type: 'attack', dmg: 6, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 7 : 6, 3) }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n % 2 === 1) { /* 每隔一回合恢复无形 */ }
      if (n === 0) return 'debuff';
      if (n % 3 === 0) return 'scythe';
      return 'attack';
    },
    onTurnStartHook: (g, e) => { }
  });
  E('giant_head', {
    name: '巨大头颅', hp: [500, 500], art: '🗿', size: 3, elite: true,
    powers: { slow: 0 },
    onStart: (g, e) => { e.extra.turns = 0; },
    moves: {
      count: { intent: { type: 'attack', dmg: 13 }, act: (g, e) => g.enemyAttackAnim(e, 13) },
      glare: { intent: { type: 'debuff' }, act: (g, e) => g.applyDebuff(g.player, 'weak', 1) },
      it_is_time: {
        intent: { type: 'attack', dmg: 30, dmgFn: (g, e) => Math.min(70, 30 + 5 * Math.max(0, e.moveHistory.length - 5)) },
        act: (g, e) => g.enemyAttackAnim(e, Math.min(70, 30 + 5 * Math.max(0, e.moveHistory.length - 5)))
      }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n >= 4) return 'it_is_time';
      return rng.chance(0.5) ? 'count' : 'glare';
    }
  });
  E('snake_dagger', {
    name: '匕首蛇', hp: [20, 25], art: '🗡️',
    powers: { minion: 1 },
    moves: {
      stab: { intent: { type: 'attack', dmg: 9 }, act: (g, e) => g.enemyAttackAnim(e, 9) },
      explode: {
        intent: { type: 'attack', dmg: 25 },
        act: (g, e) => { g.enemyAttackAnim(e, 25); e.dead = true; e.hp = 0; g.checkAllFled(); }
      }
    },
    nextMove: (g, e) => (e.moveHistory.length === 0 ? 'stab' : 'explode')
  });
  E('reptomancer', {
    name: '蜥蜴法师', hp: [180, 190], art: '🐲', size: 3, elite: true, isLeader: true,
    onStart: (g, e) => { e.extra.seq = 0; },
    moves: {
      summon: {
        intent: { type: 'unknown' },
        act: (g, e) => {
          const cur = g.enemies().filter((x) => x.id === 'snake_dagger').length;
          for (let i = 0; i < (g.game.ascension >= 18 ? 2 : 1); i++) {
            if (cur + i >= 4) break;
            const d = g.spawnEnemy('snake_dagger'); if (d) g.pickMove(d);
          }
          g.toast('蜥蜴法师召唤了匕首蛇！');
        }
      },
      snake_strike: {
        intent: { type: 'attack_debuff', dmg: 13, times: 2 },
        act: (g, e) => { g.enemyAttackAnim(e, g.game.ascension >= 3 ? 16 : 13, 2); g.applyDebuff(g.player, 'weak', 1); }
      },
      big_bite: { intent: { type: 'attack', dmg: 30 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 3 ? 34 : 30) }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'summon';
      if (g.enemies().filter((x) => x.id === 'snake_dagger').length === 0 && rng.chance(0.5)) return 'summon';
      if (rng.chance(0.33)) return 'big_bite';
      return 'snake_strike';
    }
  });

  /* ================= 首领 ================= */
  E('awakened_one', {
    name: '觉醒者', hp: [300, 300], art: '👼', size: 3, boss: true,
    powers: { curiosity: 1, unawakened: 1 },
    onStart: (g, e) => { e.extra.phase = 1; e.extra.seq = 0; if (g.game.ascension >= 4) g.addPower(e, 'strength', 2); },
    onRevive: (g, e) => {
      e.extra.phase = 2;
      e.maxHp = g.game.ascension >= 9 ? 320 : 300;
      e.hp = e.maxHp;
      g.addPower(e, 'strength', 0);
      g.addPower(e, 'regen_flat', 10);
      g.toast('觉醒者的真正形态显现了！');
    },
    moves: {
      slash: { intent: { type: 'attack', dmg: 20 }, act: (g, e) => g.enemyAttackAnim(e, 20) },
      soul_strike: { intent: { type: 'attack', dmg: 6, times: 4 }, act: (g, e) => g.enemyAttackAnim(e, 6, 4) },
      dark_echo: { intent: { type: 'attack', dmg: 40 }, act: (g, e) => g.enemyAttackAnim(e, 40) },
      sludge: { intent: { type: 'attack_debuff', dmg: 18 }, act: (g, e) => { g.enemyAttack(e, 18); g.addCardTo('void', 'discard'); } },
      tackle: { intent: { type: 'attack', dmg: 10, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, 10, 3) }
    },
    nextMove: (g, e, rng) => {
      if (e.extra.phase === 1) {
        if (!e.moveHistory.length) return 'slash';
        return rng.chance(0.5) ? 'slash' : 'soul_strike';
      }
      const n = e.moveHistory.length;
      if (n % 4 === 0) return 'dark_echo';
      if (rng.chance(0.4)) return 'sludge';
      return 'tackle';
    }
  });

  E('time_eater', {
    name: '时间吞噬者', hp: [456, 456], art: '⏳', size: 3, boss: true,
    powers: { time_warp: 0 },
    onStart: (g, e) => { e.extra.hasted = false; },
    onDamaged: (g, e) => {
      if (!e.extra.hasted && e.hp > 0 && e.hp <= e.maxHp / 2) {
        e.extra.hasted = true;
        e.moveKey = 'haste'; e.move = e.def.moves.haste;
        g.dirty();
      }
    },
    moves: {
      reverberate: { intent: { type: 'attack', dmg: 7, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, g.game.ascension >= 4 ? 8 : 7, 3) },
      head_slam: {
        intent: { type: 'attack_debuff', dmg: 26 },
        act: (g, e) => { g.enemyAttack(e, g.game.ascension >= 4 ? 32 : 26); g.applyDebuff(g.player, 'frail', 3); }
      },
      ripple: {
        intent: { type: 'defend_debuff' },
        act: (g, e) => { g.gainBlock(e, 20, { noPower: true }); g.applyDebuff(g.player, 'weak', 1); g.applyDebuff(g.player, 'vulnerable', 1); }
      },
      haste: {
        intent: { type: 'buff' },
        act: (g, e) => {
          e.hp = Math.floor(e.maxHp / 2);
          Object.keys(e.powers).forEach((k) => { if (S.powers[k] && S.powers[k].type === 'debuff') g.removePower(e, k); });
          g.toast('时间吞噬者加速了！');
        }
      }
    },
    nextMove: (g, e, rng) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'reverberate';
      if (rng.chance(0.45)) return 'reverberate';
      if (rng.chance(0.5)) return 'head_slam';
      return 'ripple';
    }
  });

  E('deca', {
    name: '德卡', hp: [250, 250], art: '⬜', size: 2, boss: true,
    moves: {
      beam: { intent: { type: 'attack_debuff', dmg: 10, times: 2 }, act: (g, e) => { g.enemyAttackAnim(e, 10, 2); g.addCardTo('dazed', 'discard', { count: 2 }); } },
      square_of_protection: {
        intent: { type: 'defend' },
        act: (g, e) => { g.enemies().forEach((x) => { g.gainBlock(x, 16, { noPower: true }); if (g.game.ascension >= 19) g.addPower(x, 'artifact', 1); }); }
      }
    },
    nextMove: (g, e) => (e.moveHistory.length % 2 === 0 ? 'beam' : 'square_of_protection')
  });
  E('donu', {
    name: '多努', hp: [250, 250], art: '⬛', size: 2, boss: true,
    moves: {
      circle_of_power: { intent: { type: 'buff' }, act: (g, e) => g.enemies().forEach((x) => g.addPower(x, 'strength', 3)) },
      beam: { intent: { type: 'attack', dmg: 10, times: 2 }, act: (g, e) => g.enemyAttackAnim(e, 10, 2) }
    },
    nextMove: (g, e) => (e.moveHistory.length % 2 === 0 ? 'circle_of_power' : 'beam')
  });

  /* ================= 心脏（第四幕） ================= */
  E('shield_spire', {
    name: '尖塔之盾', hp: [125, 125], art: '🛡️', size: 2, boss: true,
    powers: { artifact: 1 },
    moves: {
      fortify: { intent: { type: 'defend' }, act: (g, e) => g.enemies().forEach((x) => g.gainBlock(x, 30, { noPower: true })) },
      smash: { intent: { type: 'attack', dmg: 34 }, act: (g, e) => g.enemyAttackAnim(e, 34) }
    },
    nextMove: (g, e) => (e.moveHistory.length === 0 ? 'fortify' : 'smash')
  });
  E('spear_spire', {
    name: '尖塔之矛', hp: [160, 160], art: '🗡️', size: 2, boss: true,
    powers: { artifact: 1, painful_stabs: 1 },
    moves: {
      burn_strike: { intent: { type: 'attack_debuff', dmg: 5, times: 2 }, act: (g, e) => { g.enemyAttackAnim(e, 5, 2); g.addCardTo('burn', 'discard', { count: 2 }); } },
      skewer: { intent: { type: 'attack', dmg: 10, times: 3 }, act: (g, e) => g.enemyAttackAnim(e, 10, 3) }
    },
    nextMove: (g, e) => (e.moveHistory.length % 2 === 0 ? 'burn_strike' : 'skewer')
  });
  E('corrupt_heart', {
    name: '腐化之心', hp: [750, 750], art: '❤️‍🔥', size: 3, boss: true,
    powers: { beat_of_death: 1, invincible: 300 },
    onStart: (g, e) => { e.extra.seq = 0; e.extra.buffs = 0; },
    moves: {
      debilitate: {
        intent: { type: 'strong_debuff' },
        act: (g, e) => {
          g.applyDebuff(g.player, 'vulnerable', 2); g.applyDebuff(g.player, 'weak', 2); g.applyDebuff(g.player, 'frail', 2);
          g.addCardTo('dazed', 'discard', { count: 2 }); g.addCardTo('slimed', 'discard', { count: 2 });
        }
      },
      blood_shots: { intent: { type: 'attack', dmg: 2, times: 12 }, act: (g, e) => g.enemyAttackAnim(e, 2, 12) },
      echo: { intent: { type: 'attack', dmg: 40 }, act: (g, e) => g.enemyAttackAnim(e, 40) },
      buff: {
        intent: { type: 'buff' },
        act: (g, e) => {
          e.extra.buffs++;
          const seq = ['artifact', 'beat_of_death', 'painful_stabs', 'strength', 'thorns'];
          const k = seq[Math.min(e.extra.buffs - 1, 4)];
          if (k === 'strength') g.addPower(e, 'strength', 10);
          else g.addPower(e, k, k === 'beat_of_death' ? 1 : 2);
        }
      }
    },
    onTurnStartExtra: (g, e) => { g.setPower(e, 'invincible', 300); },
    nextMove: (g, e) => {
      const n = e.moveHistory.length;
      if (n === 0) return 'debilitate';
      const seq = ['blood_shots', 'echo', 'buff'];
      return seq[(n - 1) % 3];
    }
  });
})();
