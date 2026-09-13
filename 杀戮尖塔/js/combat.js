/* ================= combat.js · 战斗引擎 ================= */
(function () {
  'use strict';
  const S = window.STS;

  const ORDER = S.POWER_ORDER;
  function powerIds(cre) {
    const ids = Object.keys(cre.powers || {});
    ids.sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    return ids;
  }

  class Combat {
    constructor(game, encounter) {
      this.game = game;
      this.enc = encounter;
      this.isElite = !!encounter.elite;
      this.isBoss = !!encounter.boss;
      this.isPvp = !!encounter.pvp;
      this.pvpActive = false;
      this.pendingCounters = [];
      this.player = game.pc;                 // 持久角色对象
      this.player.block = 0;
      this.player.powers = {};
      this.enemyList = [];
      this.drawPile = [];
      this.hand = [];
      this.discardPile = [];
      this.exhaustPile = [];
      this.energy = 0;
      this.energyMax = game.energyPerTurn();
      this.turn = 0;
      this.over = false;
      this.won = false;
      this.busy = false;
      this.cardsPlayedTurn = 0;
      this.attacksPlayedTurn = 0;
      this.skillsPlayedTurn = 0;
      this.cardsPlayedCombat = 0;
      this.discardedThisTurn = 0;
      this.exhaustedThisTurn = 0;
      this.timesShuffled = 0;
      this.damageTakenTurn = 0;
      this.hpLostCombat = 0;
      this.panacheCount = 0;
      this.uidPool = 1;
      this.cardQueue = [];
      this.deadThisCombat = 0;
      this._logs = [];
    }

    /* ================= 初始化 ================= */
    setup() {
      const g = this.game;
      // 生成敌人
      this.enc.enemies.forEach((entry, i) => {
        const id = typeof entry === 'string' ? entry : entry.id;
        this.spawnEnemy(id, typeof entry === 'object' ? entry : null, i);
      });
      this.layoutEnemies();
      // 构建抽牌堆（直接引用主牌组对象，战斗内的临时修饰在战斗结束时清理）
      this.masterRefs = g.deck;
      this.drawPile = g.deck.map((c) => c);
      this.drawPile.forEach((c) => { c.costTurn = undefined; c.costCombat = undefined; c.bonusCombat = undefined; });
      g.rng.shuffle(this.drawPile);
      // 瓶装遗物 → 起始手牌
      const bottled = [];
      (g.flags.bottles ? Object.keys(g.flags.bottles) : []).forEach((rid) => {
        if (!g.hasRelic(rid)) return;
        const uid = g.flags.bottles[rid];
        const c = this.drawPile.find((x) => x.uid === uid);
        if (c) bottled.push(c);
      });
      // 天生牌置顶
      const innate = this.drawPile.filter((c) => this.cardHas(c, 'innate') || bottled.indexOf(c) >= 0);
      if (innate.length) {
        this.drawPile = this.drawPile.filter((c) => innate.indexOf(c) < 0).concat(innate);
      }
      // 遗物：战斗开始
      g.triggerRelics('onCombatStart', this);
      if (g.flags.giryaStr) this.addPower(this.player, 'strength', g.flags.giryaStr);
      this.enemyList.forEach((e) => { if (e.def.onStart) e.def.onStart(this, e); });
      if (!this.isPvp) {
        // 每个敌人决定首个行动
        this.enemyList.forEach((e) => this.pickMove(e));
        this.startTurn();
      }
    }

    spawnEnemy(id, over, idx) {
      const def = S.enemies[id];
      if (!def) { console.warn('未知敌人', id); return null; }
      const g = this.game;
      const asc = g.ascension;
      let hp;
      if (over && over.hp) hp = over.hp;
      else {
        let lo = def.hp[0], hi = def.hp[1];
        if (asc >= 7 && !this.isBoss) { lo = Math.ceil(lo * 1.05); hi = Math.ceil(hi * 1.05); }
        if (asc >= 9 && this.isBoss) { lo = Math.ceil(lo * 1.08); hi = Math.ceil(hi * 1.08); }
        // 自然上限提高到 5 后，敌方生命整体提高 15% 以平衡
        lo = Math.ceil(lo * 1.15); hi = Math.ceil(hi * 1.15);
        hp = g.rng.range(lo, hi);
        if (this.isElite && g.hasRelic('preserved_insect')) hp = Math.max(1, Math.round(hp * 0.75));
      }
      const e = {
        uid: 'e' + (this.uidPool++), id: id, def: def, isPlayer: false,
        name: def.name, art: def.art || '👾', size: def.size || 1,
        hp: hp, maxHp: hp, block: 0, powers: {},
        moveHistory: [], move: null, turnCount: 0, x: 0, dead: false,
        extra: over && over.extra ? Object.assign({}, over.extra) : {}
      };
      if (def.powers) for (const k in def.powers) e.powers[k] = def.powers[k];
      if (def.ascPowers && asc >= 2) for (const k in def.ascPowers) e.powers[k] = (e.powers[k] || 0) + def.ascPowers[k];
      this.enemyList.push(e);
      return e;
    }

    layoutEnemies() { /* UI 负责布局 */ }

    /* ================= 查询 ================= */
    enemies() { return this.enemyList.filter((e) => !e.dead && e.hp > 0); }
    allEnemies() { return this.enemyList; }
    randomEnemy() { const l = this.enemies(); return l.length ? this.game.rng.pick(l) : null; }
    firstEnemy() { const l = this.enemies(); return l[0] || null; }
    cardHas(c, flag) {
      const d = S.cards[c.id];
      if (c[flag]) return true;
      if (flag === 'exhaust' && this.player.powers.corruption && d.type === 'skill') return true;
      if (d.upFlags && c.upg && d.upFlags[flag] !== undefined) return d.upFlags[flag];
      return !!d[flag];
    }
    cost(c) {
      const d = S.cards[c.id];
      if (c.costTurn !== undefined) return c.costTurn;
      if (c.costCombat !== undefined) return c.costCombat;
      if (this.player.powers.corruption && d.type === 'skill') return 0;
      if (d.dynCost) return d.dynCost(this, c);
      return S.cardCost(c);
    }
    /* ================= 能力操作 ================= */
    getPower(cre, id) { return cre.powers[id] || 0; }
    setPower(cre, id, n) {
      if (n === 0) delete cre.powers[id]; else cre.powers[id] = n;
      this.dirty();
    }
    addPower(cre, id, n, opts) {
      opts = opts || {};
      const def = S.powers[id];
      if (!def || n === 0) return;
      if (def.noStack) { cre.powers[id] = Math.max(cre.powers[id] || 0, n); }
      else cre.powers[id] = (cre.powers[id] || 0) + n;
      if (cre.powers[id] <= 0 && !def.allowNeg) delete cre.powers[id];
      if (cre.powers[id] === 0) delete cre.powers[id];
      if (!opts.silent && n > 0) this.fx(cre, def.name + (def.noStack ? '' : ' +' + n), 'buff');
      if (!opts.silent && n < 0 && def.allowNeg) this.fx(cre, def.name + ' ' + n, 'buff');
      this.dirty();
    }
    removePower(cre, id) { delete cre.powers[id]; this.dirty(); }

    /** 施加负面效果（会被神器抵挡） */
    applyDebuff(cre, id, n, opts) {
      opts = opts || {};
      if (!cre || cre.dead) return false;
      const def = S.powers[id];
      if (!def) return false;
      const isDebuff = def.type === 'debuff' || n < 0;
      if (isDebuff && cre.powers.artifact) {
        this.addPower(cre, 'artifact', -1, { silent: true });
        this.fx(cre, '神器抵挡', 'buff');
        return false;
      }
      if (cre.isPlayer && this.game.hasRelic('ginger') && id === 'weak') { this.fx(cre, '免疫虚弱', 'buff'); return false; }
      if (cre.isPlayer && this.game.hasRelic('turnip') && id === 'frail') { this.fx(cre, '免疫脆弱', 'buff'); return false; }
      if (!cre.isPlayer && id === 'vulnerable' && this.game.hasRelic('champion_belt')) this.addPower(cre, 'weak', 1);
      this.addPower(cre, id, n, opts);
      // 虐待狂天性
      if (!cre.isPlayer && this.player.powers.sadistic && isDebuff) {
        this.dealDamage(this.player, cre, this.player.powers.sadistic, { fromPower: true });
      }
      return true;
    }

    /* ================= 伤害计算 ================= */
    calcDamage(src, target, base, ctx) {
      ctx = ctx || {};
      let d = base;
      if (src) {
        powerIds(src).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.atDamageGive) d = pd.atDamageGive(this, src, src.powers[id], d, ctx);
        });
        if (src.isPlayer) d = this.game.modifyDamageGive(this, d, ctx);
        if (!src.isPlayer && this.game.ascension >= 2 && ctx.isAttack) d = Math.ceil(d * 1.1);
      }
      if (target) {
        powerIds(target).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.atDamageReceive) d = pd.atDamageReceive(this, target, target.powers[id], d, ctx);
        });
        if (target.isPlayer) d = this.game.modifyDamageReceive(this, d, ctx);
      }
      return Math.max(0, Math.floor(d));
    }

    /** 预览伤害（用于卡面显示 / 意图显示） */
    preview(base, target) {
      return this.calcDamage(this.player, target || (this.enemies().length === 1 ? this.enemies()[0] : null), base, { isAttack: true, fromCard: true });
    }
    previewBlock(base) {
      let amt = base;
      powerIds(this.player).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.atBlockGain) amt = pd.atBlockGain(this, this.player, this.player.powers[id], amt);
      });
      return Math.max(0, Math.floor(amt));
    }

    /** 实际造成伤害 */
    dealDamage(src, target, base, ctx) {
      ctx = ctx || {};
      if (!target || target.dead || this.over) return 0;
      if (target.hp <= 0 && !target.isPlayer) return 0;
      const isAttack = ctx.isAttack !== undefined ? ctx.isAttack : !(ctx.fromPower || ctx.thorns || ctx.poison || ctx.self);
      ctx.isAttack = isAttack;
      let dmg = ctx.raw ? base : this.calcDamage(src, target, base, ctx);
      // 无敌
      if (target.powers.invincible !== undefined) {
        dmg = Math.min(dmg, target.powers.invincible);
        this.addPower(target, 'invincible', -dmg, { silent: true });
        if (!target.powers.invincible) this.setPower(target, 'invincible', 0);
      }
      let blocked = Math.min(target.block, dmg);
      const hadBlock = target.block;
      target.block -= blocked;
      let hpLoss = dmg - blocked;
      if (hadBlock > 0 && target.block === 0 && !target.isPlayer && src && src.isPlayer && this.game.hasRelic('hand_drill')) {
        this.applyDebuff(target, 'vulnerable', 2);
      }
      if (hpLoss > 0 && target.isPlayer) {
        if (this.game.relicCounters.fossilized_helix) {
          this.game.relicCounters.fossilized_helix = 0;
          this.fx(target, '石化螺旋', 'blk');
          hpLoss = 0;
        } else if (this.game.hasRelic('tungsten_rod')) hpLoss = Math.max(0, hpLoss - 1);
      }
      if (hpLoss > 0 && target.powers.buffer) {
        this.addPower(target, 'buffer', -1, { silent: true });
        this.fx(target, '缓冲', 'blk');
        hpLoss = 0;
      }
      if (hpLoss > 0) {
        // 模式切换（守卫者）
        if (target.powers.mode_shift) {
          const left = target.powers.mode_shift - hpLoss;
          if (left <= 0) { this.setPower(target, 'mode_shift', 0); target.shiftReady = true; }
          else this.setPower(target, 'mode_shift', left);
        }
        this.applyHpLoss(target, hpLoss, ctx);
      }
      if (dmg > 0) this.fx(target, blocked > 0 && hpLoss === 0 ? '格挡 ' + blocked : String(hpLoss > 0 ? hpLoss : 0), hpLoss > 0 ? 'dmg' : 'blk');
      if (dmg === 0 && !ctx.silent) this.fx(target, '免疫', 'blk');
      S.UI && S.UI.hitFx && S.UI.hitFx(target, isAttack);

      // 受击触发
      if (isAttack) {
        powerIds(target).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.onAttacked && !target.dead) pd.onAttacked(this, target, target.powers[id], dmg, src, ctx);
        });
        if (target.isPlayer) this.game.triggerRelics('onAttacked', this, dmg, src);
      }
      powerIds(target).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onDamaged && !target.dead) pd.onDamaged(this, target, target.powers[id], dmg, src, ctx);
      });
      if (target.def && target.def.onDamaged && !target.dead) target.def.onDamaged(this, target, dmg, hpLoss, ctx);

      // 剧毒 / 未被格挡触发
      if (hpLoss > 0) {
        if (src && src.isPlayer && isAttack && !ctx.thorns) {
          if (this.player.powers.envenom) this.applyDebuff(target, 'poison', this.player.powers.envenom);
          this.game.triggerRelics('onUnblockedDamage', this, target, hpLoss);
        }
        if (src && !src.isPlayer && src.powers && src.powers.painful_stabs && target.isPlayer) {
          this.addCardTo('wound', 'discard');
        }
      }
      if (target.hp <= 0) this.checkDeath(target);
      this.dirty();
      return hpLoss;
    }

    dealDamageAll(src, base, ctx) {
      this.enemies().forEach((e) => this.dealDamage(src, e, base, Object.assign({}, ctx)));
    }

    /** 无视格挡直接失去生命 */
    loseHp(cre, n, ctx) {
      ctx = ctx || {};
      if (n <= 0 || !cre || cre.dead) return;
      if (cre.powers.buffer) { this.addPower(cre, 'buffer', -1, { silent: true }); this.fx(cre, '缓冲', 'blk'); return; }
      if (cre.powers.intangible) n = Math.min(n, 1);
      this.applyHpLoss(cre, n, ctx);
      this.fx(cre, String(n), 'dmg');
      if (cre.isPlayer && ctx.self && this.player.powers.rupture) this.addPower(cre, 'strength', this.player.powers.rupture);
      if (cre.hp <= 0) this.checkDeath(cre);
      this.dirty();
    }

    applyHpLoss(target, hpLoss, ctx) {
      target.hp -= hpLoss;
      if (target.isPlayer) {
        this.damageTakenTurn += hpLoss;
        this.hpLostCombat += hpLoss;
        this.hpLossTimes = (this.hpLossTimes || 0) + 1;
        this.game.triggerRelics('onLoseHp', this, hpLoss);
        S.UI && S.UI.shake && S.UI.shake();
      }
      if (target.hp < 0) target.hp = 0;
    }

    heal(cre, n) {
      if (n <= 0 || !cre) return;
      let amt = n;
      if (cre.isPlayer) {
        if (this.game.hasRelic('mark_of_the_bloom')) return;
        if (this.game.hasRelic('magic_flower')) amt = Math.floor(amt * 1.5);
      }
      const before = cre.hp;
      cre.hp = Math.min(cre.maxHp, cre.hp + amt);
      if (cre.hp > before) this.fx(cre, '+' + (cre.hp - before), 'heal');
      this.dirty();
    }

    gainBlock(cre, amt, opts) {
      opts = opts || {};
      if (!cre || cre.dead) return 0;
      let a = amt;
      if (!opts.noPower) {
        powerIds(cre).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.atBlockGain) a = pd.atBlockGain(this, cre, cre.powers[id], a);
        });
        if (cre.isPlayer) a = this.game.modifyBlockGain(this, a);
      }
      a = Math.max(0, Math.floor(a));
      if (a <= 0) return 0;
      cre.block += a;
      this.fx(cre, '+' + a, 'blk');
      if (cre.isPlayer && this.player.powers.juggernaut) {
        const t = this.randomEnemy();
        if (t) this.dealDamage(this.player, t, this.player.powers.juggernaut, { fromPower: true });
      }
      this.dirty();
      return a;
    }

    /* ================= 死亡 ================= */
    checkDeath(cre) {
      if (cre.isPlayer) {
        if (cre.hp <= 0) {
          if (this.game.tryRevive(this)) return;
          this.over = true; this.won = false;
          setTimeout(() => this.game.onCombatLost(), 500);
        }
        return;
      }
      if (cre.dead || cre.hp > 0) return;
      // 未觉醒（觉醒者）
      if (cre.powers.unawakened) {
        this.removePower(cre, 'unawakened');
        cre.hp = cre.maxHp;
        cre.revived = true;
        if (cre.def.onRevive) cre.def.onRevive(this, cre);
        this.toast(cre.name + ' 觉醒了！');
        return;
      }
      cre.dead = true;
      cre.hp = 0;
      this.deadThisCombat++;
      powerIds(cre).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onDeath) pd.onDeath(this, cre, cre.powers[id]);
      });
      if (cre.def.onDeath) cre.def.onDeath(this, cre);
      this.game.triggerRelics('onEnemyKilled', this, cre);
      // 仆从随首领消失
      if (cre.def.isLeader) {
        this.enemies().forEach((e) => { if (e.powers.minion) { e.dead = true; e.fled = true; } });
      }
      this.dirty();
      if (this.enemies().length === 0 && !this.over) {
        this.over = true; this.won = true;
        setTimeout(() => this.finishCombat(), 700);
      }
    }

    /** 敌人逃跑 / 自爆后检查战斗是否结束 */
    checkAllFled() {
      this.dirty();
      if (this.enemies().length === 0 && !this.over) {
        this.over = true; this.won = true;
        setTimeout(() => this.finishCombat(), 600);
      }
    }

    /* ================= 牌堆操作 ================= */
    reshuffle() {
      if (this.discardPile.length === 0) return;
      this.timesShuffled++;
      this.drawPile = this.drawPile.concat(this.discardPile);
      this.discardPile = [];
      this.game.rng.shuffle(this.drawPile);
      this.game.triggerRelics('onShuffle', this);
      this.dirty();
    }

    draw(n, opts) {
      opts = opts || {};
      let drawn = [];
      for (let i = 0; i < n; i++) {
        if (this.player.powers.no_draw) { this.toast('本回合无法抽牌'); break; }
        if (this.hand.length >= 10) { this.toast('手牌已满'); break; }
        if (this.drawPile.length === 0) this.reshuffle();
        if (this.drawPile.length === 0) break;
        const c = this.drawPile.pop();
        this.hand.push(c);
        drawn.push(c);
        this.onCardDrawn(c);
      }
      this.dirty();
      return drawn;
    }

    onCardDrawn(c) {
      const d = S.cards[c.id];
      if (this.player.powers.confused) {
        c.costTurn = undefined;
        c.costCombat = this.game.rng.int(4);
      }
      if (d.type === 'status' && this.player.powers.evolve) this.draw(this.player.powers.evolve);
      if ((d.type === 'status' || d.type === 'curse') && this.player.powers.fire_breathing) {
        this.dealDamageAll(this.player, this.player.powers.fire_breathing, { fromPower: true });
      }
      if (d.onDraw) d.onDraw(this, c);
      this.game.triggerRelics('onCardDrawn', this, c);
    }

    discardCard(c, opts) {
      opts = opts || {};
      const i = this.hand.indexOf(c);
      if (i >= 0) this.hand.splice(i, 1);
      this.discardPile.push(c);
      this.discardedThisTurn++;
      const d = S.cards[c.id];
      if (!opts.noTrigger && d.onDiscard) d.onDiscard(this, c);
      if (!opts.noTrigger) this.game.triggerRelics('onCardDiscarded', this, c);
      this.dirty();
    }

    exhaustCard(c, opts) {
      opts = opts || {};
      if (!opts.force && this.game.hasRelic('strange_spoon') && this.game.rng.chance(0.5)) {
        this.toast('奇怪的勺子：改为弃牌');
        ['hand', 'drawPile'].forEach((p) => { const i = this[p].indexOf(c); if (i >= 0) this[p].splice(i, 1); });
        if (this.discardPile.indexOf(c) < 0) this.discardPile.push(c);
        this.dirty();
        return;
      }
      ['hand', 'drawPile', 'discardPile'].forEach((p) => {
        const i = this[p].indexOf(c);
        if (i >= 0) this[p].splice(i, 1);
      });
      this.exhaustPile.push(c);
      this.exhaustedThisTurn++;
      const d = S.cards[c.id];
      if (d.onExhaust) d.onExhaust(this, c);
      powerIds(this.player).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onExhausted) pd.onExhausted(this, this.player, this.player.powers[id], c);
      });
      this.game.triggerRelics('onExhaust', this, c);
      this.dirty();
    }

    /** 生成一张牌放入指定堆 */
    addCardTo(id, pile, opts) {
      opts = opts || {};
      const n = opts.count || 1;
      const out = [];
      for (let i = 0; i < n; i++) {
        const c = S.makeCard(id, opts.upg);
        if (!c) continue;
        c.temp = true;
        if (opts.costTurn !== undefined) c.costTurn = opts.costTurn;
        if (opts.costCombat !== undefined) c.costCombat = opts.costCombat;
        if (opts.exhaust) c.exhaust = true;
        if (pile === 'hand') {
          if (this.hand.length >= 10) { this.discardPile.push(c); this.toast('手牌已满，' + S.cards[id].name + ' 进入弃牌堆'); }
          else { this.hand.push(c); if (opts.trigger) this.onCardDrawn(c); }
        } else if (pile === 'draw') {
          if (opts.random) this.drawPile.splice(this.game.rng.int(this.drawPile.length + 1), 0, c);
          else if (opts.bottom) this.drawPile.unshift(c);
          else this.drawPile.push(c);
        } else if (pile === 'discard') this.discardPile.push(c);
        else if (pile === 'exhaust') this.exhaustPile.push(c);
        out.push(c);
      }
      this.dirty();
      return out;
    }

    /** 把已有卡牌实例放进某个堆 */
    moveCard(c, pile, opts) {
      opts = opts || {};
      ['hand', 'drawPile', 'discardPile', 'exhaustPile'].forEach((p) => {
        const i = this[p].indexOf(c);
        if (i >= 0) this[p].splice(i, 1);
      });
      if (pile === 'hand') { if (this.hand.length < 10) this.hand.push(c); else this.discardPile.push(c); }
      else if (pile === 'draw') {
        if (opts.random) this.drawPile.splice(this.game.rng.int(this.drawPile.length + 1), 0, c);
        else this.drawPile.push(c);
      } else if (pile === 'discard') this.discardPile.push(c);
      else if (pile === 'exhaust') this.exhaustPile.push(c);
      this.dirty();
    }

    /* ================= 回合流程 ================= */
    startTurn() {
      if (this.over) return;
      this.turn++;
      const p = this.player;
      this.cardsPlayedTurn = 0;
      this.attacksPlayedTurn = 0;
      this.skillsPlayedTurn = 0;
      this.discardedThisTurn = 0;
      this.exhaustedThisTurn = 0;
      this.damageTakenTurn = 0;
      this.turnCardIndex = 0;
      // 失去格挡
      if (p.powers.blur) {
        this.addPower(p, 'blur', -1, { silent: true });
      } else if (!p.powers.barricade) {
        if (this.game.hasRelic('calipers')) p.block = Math.max(0, p.block - 15);
        else p.block = 0;
      }
      // 中毒等回合开始前效果
      powerIds(p).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onTurnStartPre) pd.onTurnStartPre(this, p, p.powers[id]);
      });
      if (this.over) return;
      // 能量：基础上限 5 + 遗物/修正
      this.energyMax = this.game.energyPerTurn() + (p.powers.energy_cap || 0);
      if (this.energyMax < 0) this.energyMax = 0;
      const keep = this.game.hasRelic('ice_cream') ? this.energy : 0;
      this.energy = keep + this.energyMax + (p.powers.berserk || 0) + (p.powers.energy_next || 0);
      if (p.powers.energy_next) this.removePower(p, 'energy_next');
      this.orangeTypes = {};
      // 回合开始能力
      powerIds(p).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onTurnStart) pd.onTurnStart(this, p, p.powers[id]);
      });
      this.game.triggerRelics('onTurnStart', this);
      // 抽牌
      let n = 5 + this.game.extraDraw();
      if (p.powers.draw_next) { n += p.powers.draw_next; this.removePower(p, 'draw_next'); }
      this.draw(n);
      // 混乱
      if (p.powers.mayhem) {
        for (let i = 0; i < p.powers.mayhem; i++) {
          if (this.drawPile.length === 0) this.reshuffle();
          const c = this.drawPile[this.drawPile.length - 1];
          if (c) { this.drawPile.pop(); this.hand.push(c); this.autoPlay(c); }
        }
      }
      if (p.powers.tools_of_the_trade) this.pendingTools = p.powers.tools_of_the_trade;
      this.game.triggerRelics('onTurnStartPostDraw', this);
      // 敌人回合开始附加钩子
      this.enemies().forEach((e) => { if (e.def.onTurnStartExtra) e.def.onTurnStartExtra(this, e); });
      this.dirty();
      if (this.pendingTools) this.doToolsOfTrade();
      else if (this.turn === 1 && this.game.hasRelic('gambling_chip')) this.doGamblingChip();
    }

    async doGamblingChip() {
      if (!this.hand.length) return;
      this.busy = true;
      const sel = await S.UI.chooseCards(this, { from: this.hand.slice(), n: this.hand.length, prompt: '赌博芯片：选择要弃掉的牌', canSkip: true, upTo: true });
      sel.forEach((c) => this.discardCard(c));
      this.draw(sel.length);
      this.busy = false;
      this.dirty();
    }

    async doToolsOfTrade() {
      const n = this.pendingTools; this.pendingTools = 0;
      this.draw(n);
      const sel = await S.UI.chooseCards(this, { from: this.hand, n: n, prompt: '行业工具：选择要弃掉的牌', mustPick: true, cancellable: false });
      sel.forEach((c) => this.discardCard(c));
    }

    async endTurn(fromEffect) {
      if (this.over || this.busy) return;
      if (this.isPvp && !this.pvpActive) return;
      this.busy = true;
      const p = this.player;
      // 手牌回合结束效果
      const handCopy = this.hand.slice();
      for (const c of handCopy) {
        const d = S.cards[c.id];
        if (d.onTurnEndInHand) await d.onTurnEndInHand(this, c);
      }
      if (this.over) { this.busy = false; return; }
      // 妙计 / 保留
      let retained = [];
      if (p.powers.well_laid_plans) {
        const keep = Math.min(p.powers.well_laid_plans, this.hand.length);
        if (keep > 0) {
          const sel = await S.UI.chooseCards(this, { from: this.hand, n: keep, prompt: '妙计：选择保留的手牌', canSkip: true });
          retained = sel;
        }
      }
      // 灵魂虚体 & 弃牌
      const keepAll = this.game.hasRelic('runic_pyramid');
      const hand = this.hand.slice();
      for (const c of hand) {
        if (this.cardHas(c, 'ethereal')) { this.exhaustCard(c, { force: true }); continue; }
        // 已激活的反制牌留在手牌中
        if (c.counterActive && this.pendingCounters.indexOf(c) >= 0) {
          c.retainedOnce = true;
          continue;
        }
        if (keepAll || this.cardHas(c, 'retain') || retained.indexOf(c) >= 0) {
          c.retainedOnce = true;
          const d = S.cards[c.id];
          if (d.onRetain) d.onRetain(this, c);
          continue;
        }
        this.discardCard(c, { noTrigger: false, endOfTurn: true });
      }
      this.game.triggerRelics('onTurnEnd', this);
      // 尼尔莉的书
      if (this.game.hasRelic('nilrys_codex')) {
        const three = this.game.rng.sample(this.game.cardPool(null, true), 3).map((id) => S.makeCard(id));
        const sel = await S.UI.chooseCards(this, { from: three, n: 1, prompt: '尼尔莉的书：选择一张洗入抽牌堆', virtual: true, canSkip: true });
        if (sel[0]) this.addCardTo(sel[0].id, 'draw', { random: true });
      }
      // 炸弹等回合结束能力
      powerIds(p).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onTurnEnd) pd.onTurnEnd(this, p, p.powers[id]);
      });
      // 持续时间递减
      this.tickDurations(p);
      // 临时消耗修正清理
      this.hand.concat(this.drawPile, this.discardPile).forEach((c) => { c.costTurn = undefined; });
      // 自然回复：每回合结束后恢复 1 点行动点上限（不超过自然上限 5 + 遗物加成）
      this.restoreCap();
      this.dirty();
      await S.wait(180);
      if (this.over) { this.busy = false; return; }
      if (this.isPvp) {
        this.busy = false;
        this.pvpActive = false;
        if (S.pvpClient) S.pvpClient.sendTurnEnd(this);
        return;
      }
      await this.enemyPhase();
      this.busy = false;
      if (!this.over) this.startTurn();
    }

    restoreCap() {
      const p = this.player;
      const natural = this.game.naturalEnergyCap();
      const cur = this.game.energyPerTurn() + (p.powers.energy_cap || 0);
      if (cur < natural) {
        this.addPower(p, 'energy_cap', 1, { silent: true });
        this.energyMax = this.game.energyPerTurn() + (p.powers.energy_cap || 0);
        if (this.energyMax < 0) this.energyMax = 0;
        this.toast('自然回复：行动点上限 +1');
      }
    }

    tickDurations(cre) {
      powerIds(cre).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.dur && cre.powers[id]) {
          if (cre.isPlayer && id === 'vulnerable' && this.game.hasRelic('ancient_tea_set_x')) { }
          cre.powers[id]--;
          if (cre.powers[id] <= 0) delete cre.powers[id];
        }
      });
      this.dirty();
    }

    async enemyPhase() {
      for (const e of this.enemyList.slice()) {
        if (this.over) break;
        if (e.dead || e.hp <= 0) continue;
        e.turnCount++;
        // 敌人回合开始
        if (!e.powers.barricade) e.block = 0;
        powerIds(e).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.onTurnStartPre) pd.onTurnStartPre(this, e, e.powers[id]);
        });
        if (e.dead || e.hp <= 0) { this.dirty(); continue; }
        powerIds(e).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.onTurnStart) pd.onTurnStart(this, e, e.powers[id]);
        });
        this.dirty();
        await S.wait(230);
        // PvE 反制：根据敌方意图触发隐藏反制牌
        if (this.pendingCounters && this.pendingCounters.length) {
          const info = { type: e.move && e.move.intent ? e.move.intent.type : 'unknown', intent: e.move && e.move.intent };
          const used = [];
          this.pendingCounters.slice().forEach((c) => {
            const dc = S.cards[c.id];
            if (dc && dc.counterPlay && dc.counterPlay(this, c, e, info)) used.push(c);
          });
          used.forEach((c) => {
            const i = this.pendingCounters.indexOf(c);
            if (i >= 0) this.pendingCounters.splice(i, 1);
            this.discardCard(c);
          });
          if (e.dead || e.hp <= 0) { this.dirty(); continue; }
        }
        // 执行行动
        const mv = e.move;
        if (mv && mv.act) {
          S.UI && S.UI.enemyAct && S.UI.enemyAct(e);
          await S.wait(120);
          await mv.act(this, e);
        }
        e.moveHistory.push(e.moveKey);
        if (this.over) break;
        // 回合结束
        powerIds(e).forEach((id) => {
          const pd = S.powers[id];
          if (pd && pd.onTurnEnd) pd.onTurnEnd(this, e, e.powers[id]);
        });
        this.tickDurations(e);
        if (e.def.powers && e.def.powers.slow !== undefined) e.powers.slow = 0;
        if (e.powers.explosive !== undefined && e.powers.explosive > 0) this.addPower(e, 'explosive', -1, { silent: true });
        this.dirty();
        await S.wait(160);
      }
      // 决定下个行动
      this.enemies().forEach((e) => this.pickMove(e));
      this.dirty();
    }

    /* ---------- 敌人行动选择 ---------- */
    pickMove(e) {
      if (e.dead) return;
      const key = e.def.nextMove(this, e, this.game.rng);
      e.moveKey = key;
      e.move = e.def.moves[key];
      if (!e.move) { console.warn('未知行动', e.id, key); e.move = { intent: { type: 'unknown' }, act: () => { } }; }
      this.dirty();
    }
    /** 最近 n 次是否都是该行动 */
    lastMoves(e, key, n) {
      const h = e.moveHistory;
      if (h.length < n) return false;
      for (let i = 1; i <= n; i++) if (h[h.length - i] !== key) return false;
      return true;
    }
    lastMove(e, key) { return e.moveHistory[e.moveHistory.length - 1] === key; }

    /* ---------- 敌人攻击 ---------- */
    enemyAttack(e, base, times, ctx) {
      times = times || 1;
      for (let i = 0; i < times; i++) {
        if (this.over) return;
        this.dealDamage(e, this.player, base, Object.assign({ isAttack: true }, ctx));
      }
    }
    async enemyAttackAnim(e, base, times, ctx) {
      times = times || 1;
      for (let i = 0; i < times; i++) {
        if (this.over) return;
        this.dealDamage(e, this.player, base, Object.assign({ isAttack: true }, ctx));
        this.dirty();
        if (times > 1) await S.wait(140);
      }
    }

    /* ================= 反制 ================= */
    toggleCounter(c) {
      if (!c || !S.cards[c.id] || !S.cards[c.id].counter) return false;
      const i = this.pendingCounters.indexOf(c);
      if (i >= 0) {
        this.pendingCounters.splice(i, 1);
        c.counterActive = false;
        this.toast('反制已取消');
      } else {
        if (this.hand.indexOf(c) < 0) return false;
        this.pendingCounters.push(c);
        c.counterActive = true;
        this.toast('反制已布置（再次拖起取消）');
      }
      this.dirty();
      return true;
    }

    /* ================= 出牌 ================= */
    canPlay(c) {
      const d = S.cards[c.id];
      if (this.isPvp && !this.pvpActive) return false;
      if (this.over || this.busy) return false;
      const g = this.game;
      const statusOk = d.type === 'status' && g.hasRelic('medical_kit');
      const curseOk = d.type === 'curse' && g.hasRelic('blue_candle');
      if (d.unplayable && !statusOk && !curseOk) return false;
      if (d.type === 'attack' && this.player.powers.entangled) return false;
      let cost = this.cost(c);
      if (statusOk || curseOk) cost = 0;
      if (cost === -2) return false;
      if (this.hand.some((h) => h.id === 'normality') && this.cardsPlayedTurn >= 3) return false;
      if (g.hasRelic('velvet_choker') && this.cardsPlayedTurn >= 6) return false;
      if (typeof cost === 'number' && !c.freeOnce && cost > this.energy) return false;
      if (d.canPlay && !d.canPlay(this, c, S.cardVals(c))) return false;
      if (d.type === 'attack' && this.enemies().length === 0) return false;
      return true;
    }

    async playCard(c, target) {
      if (!this.canPlay(c)) return false;
      const d = S.cards[c.id];
      if (d.counter) { this.toggleCounter(c); return true; }
      const g = this.game;
      const v = S.cardVals(c);
      const forced = (d.type === 'status' && g.hasRelic('medical_kit')) || (d.type === 'curse' && g.hasRelic('blue_candle'));
      let cost = forced ? 0 : this.cost(c);
      if (cost === 'X') {
        v.X = this.energy + (g.hasRelic('chemical_x') ? 2 : 0);
        this.energy = 0;
      } else if (!c.freeOnce) {
        this.energy -= cost;
      }
      if (c.freeOnce) c.freeOnce = false;
      this.busy = true;
      // 从手牌移除
      const i = this.hand.indexOf(c);
      if (i >= 0) this.hand.splice(i, 1);
      this.cardInPlay = c;
      this.cardsPlayedTurn++;
      this.cardsPlayedCombat++;
      this.turnCardIndex = (this.turnCardIndex || 0) + 1;
      if (d.type === 'attack') this.attacksPlayedTurn++;
      if (d.type === 'skill') this.skillsPlayedTurn++;
      this.orangeTypes = this.orangeTypes || {};
      this.orangeTypes[d.type] = true;
      this.dirty();

      // 打出次数
      let times = 1;
      if (d.type === 'attack' && this.player.powers.double_tap) { times++; this.addPower(this.player, 'double_tap', -1, { silent: true }); }
      if (d.type === 'skill' && this.player.powers.burst) { times++; this.addPower(this.player, 'burst', -1, { silent: true }); }
      if (this.player.powers.echo_form && this.turnCardIndex <= (this.player.powers.echo_form || 0)) times++;
      if (g.hasRelic('necronomicon') && d.type === 'attack' && (typeof cost === 'number' && cost >= 2) && !this.necroUsed) {
        times++; this.necroUsed = true; this.toast('死灵之书');
      }

      if (forced) {
        // 医疗包 / 蓝色蜡烛
        if (d.type === 'curse') this.loseHp(this.player, 1, { self: true });
        if (d.play) { const r = d.play(this, c, target, v); if (r && r.then) await r; }
        this.afterCardPlayed(c, d);
        this.cardInPlay = null;
        this.exhaustCard(c, { force: true });
        this.dirty();
        this.busy = false;
        return true;
      }

      for (let t = 0; t < times; t++) {
        if (this.over) break;
        if (d.type === 'attack' && this.enemies().length === 0) break;
        let tg = target;
        if (d.target === 'enemy' && (!tg || tg.dead)) tg = this.firstEnemy();
        if (d.target === 'random') tg = this.randomEnemy();
        const r = d.play(this, c, tg, v);
        if (r && r.then) await r;
        this.dirty();
        if (t < times - 1) await S.wait(150);
      }
      // 活力在攻击后消耗
      if (d.type === 'attack' && this.player.powers.vigor) this.removePower(this.player, 'vigor');

      // 打出后触发
      this.afterCardPlayed(c, d);

      // PvP 同步公开信息与反制事件
      if (this.isPvp && S.pvpClient && this.pvpActive) {
        S.pvpClient.sendCardPlayed(this, c, d);
        S.pvpClient.sendSnapshot(this);
      }

      // 处理归属
      this.cardInPlay = null;
      if (c.dontDispose) { c.dontDispose = false; }
      else if (this.cardHas(c, 'exhaust')) this.exhaustCard(c);
      else if (d.type === 'power') { /* 能力牌消失 */ }
      else this.discardPile.push(c);
      // 不停转的陀螺
      if (g.hasRelic('unceasing_top') && this.hand.length === 0 && !this.over) this.draw(1);
      this.dirty();
      this.busy = false;
      return true;
    }

    afterCardPlayed(c, d) {
      const p = this.player;
      powerIds(p).forEach((id) => {
        const pd = S.powers[id];
        if (pd && pd.onCardPlayed) pd.onCardPlayed(this, p, p.powers[id], c, d);
      });
      // 华丽
      if (p.powers.panache) {
        this.panacheCount++;
        if (this.panacheCount >= 5) { this.panacheCount = 0; this.dealDamageAll(p, p.powers.panache, { fromPower: true }); }
      }
      // 敌人反应
      this.enemies().forEach((e) => {
        if (e.powers.enrage && d.type === 'skill') this.addPower(e, 'strength', e.powers.enrage);
        if (e.powers.curiosity && d.type === 'power') this.addPower(e, 'strength', e.powers.curiosity);
        if (e.powers.sharp_hide && d.type === 'attack') this.dealDamage(e, p, e.powers.sharp_hide, { fromPower: true });
        if (e.powers.beat_of_death) this.dealDamage(e, p, e.powers.beat_of_death, { fromPower: true });
        if (e.powers.choke) this.loseHp(e, e.powers.choke, {});
        if (e.powers.slow !== undefined) this.addPower(e, 'slow', 1, { silent: true });
        if (e.powers.time_warp !== undefined) {
          this.addPower(e, 'time_warp', 1, { silent: true });
          if (e.powers.time_warp >= 12) {
            this.setPower(e, 'time_warp', 0);
            this.addPower(e, 'strength', 2);
            this.toast('时间扭曲！回合被强制结束');
            this.forceEndTurn = true;
          }
        }
      });
      // 橙色药丸
      if (this.game.hasRelic('orange_pellets') && this.orangeTypes &&
        this.orangeTypes.attack && this.orangeTypes.skill && this.orangeTypes.power) {
        this.orangeTypes = {};
        Object.keys(p.powers).forEach((k) => {
          const pd = S.powers[k];
          if (pd && (pd.type === 'debuff' || (pd.allowNeg && p.powers[k] < 0))) this.removePower(p, k);
        });
        this.toast('橙色药丸：移除所有负面效果');
      }
      this.game.triggerRelics('onCardPlayed', this, c, d);
      if (this.forceEndTurn) { this.forceEndTurn = false; setTimeout(() => { this.busy = false; this.endTurn(true); }, 260); }
    }

    /** 自动打出（不消耗能量，用于混乱/浩劫等） */
    async autoPlay(c, target) {
      const d = S.cards[c.id];
      const v = S.cardVals(c);
      const i = this.hand.indexOf(c);
      if (i >= 0) this.hand.splice(i, 1);
      this.cardsPlayedTurn++; this.cardsPlayedCombat++;
      let tg = target;
      if (d.target === 'enemy' && !tg) tg = this.firstEnemy();
      if (d.target === 'random') tg = this.randomEnemy();
      if (!d.unplayable) {
        const r = d.play(this, c, tg, v);
        if (r && r.then) await r;
        this.afterCardPlayed(c, d);
      }
      if (this.cardHas(c, 'exhaust') || d.autoExhaust) this.exhaustCard(c);
      else if (d.type !== 'power') this.discardPile.push(c);
      this.dirty();
    }

    /* ================= 结算 ================= */
    finishCombat() {
      if (this.finished) return;
      this.finished = true;
      // 清理临时修饰
      this.game.deck.forEach((c) => {
        c.costTurn = undefined; c.costCombat = undefined; delete c.bonusCombat;
        delete c.retainedOnce; delete c.exhaust; delete c.temp;
        if (c.tempUpg) { c.upg = 0; delete c.tempUpg; delete c.bonus; delete c.upTimes; }
      });
      // 幻影牌本局对战结束后彻底消失
      this.game.deck = this.game.deck.filter((c) => !c.phantom);
      this.player.block = 0;
      this.player.powers = {};
      this.game.triggerRelics('onCombatEnd', this);
      if (this.isPvp) {
        if (S.pvpClient) S.pvpClient.onBattleEnd(this);
        return;
      }
      this.game.onCombatWon(this);
    }

    /* ================= 工具 ================= */
    fx(cre, text, cls) { if (S.UI && S.UI.floatNum) S.UI.floatNum(cre, text, cls); }
    toast(msg) { if (S.UI && S.UI.toast) S.UI.toast(msg); this._logs.push(msg); }
    dirty() { if (S.UI && S.UI.renderCombat) S.UI.renderCombat(this); }

    /* 供卡牌使用的便捷方法 */
    attack(target, dmg, ctx) { return this.dealDamage(this.player, target, dmg, Object.assign({ isAttack: true, fromCard: true }, ctx)); }
    attackAll(dmg, ctx) { this.enemies().forEach((e) => this.dealDamage(this.player, e, dmg, Object.assign({ isAttack: true, fromCard: true }, ctx))); }
    block(n) { return this.gainBlock(this.player, n); }
    gainEnergy(n) { this.energy += n; this.dirty(); }
    handSize() { return this.hand.length; }
    countInPile(pile, pred) { return this[pile].filter(pred).length; }
    deckAll() { return this.hand.concat(this.drawPile, this.discardPile); }
  }

  S.Combat = Combat;
})();
