/* ================= game.js · 跑局主控 ================= */
(function () {
  'use strict';
  const S = window.STS;

  S.CHARS = [
    {
      id: 'ironclad', name: '铁甲战士', color: 'red', art: '🛡️', hp: 80, gold: 99,
      relic: 'burning_blood',
      desc: '身经百战的老兵。依靠力量与格挡硬碰硬，能通过战斗回复生命。',
      deck: () => ['strike', 'strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'bash']
    },
    {
      id: 'silent', name: '静默猎手', color: 'green', art: '🗡️', hp: 70, gold: 99,
      relic: 'ring_of_the_snake',
      desc: '来自森林的刺客。以毒素、飞刀与快速抽牌淹没敌人。',
      deck: () => ['strike_g', 'strike_g', 'strike_g', 'strike_g', 'strike_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g', 'defend_g', 'neutralize', 'survivor']
    }
  ];

  class Game {
    constructor() {
      this.rng = new S.RNG(Date.now());
      this.relicCounters = {};
      this.flags = {};
    }

    /* ================= 新跑局 ================= */
    newRun(charId, seed, ascension) {
      const ch = S.CHARS.find((c) => c.id === charId) || S.CHARS[0];
      this.char = ch;
      this.charColor = ch.color;
      this.seedStr = seed || String(Math.floor(Math.random() * 1e12));
      this.rng = new S.RNG(this.seedStr);
      this.cardRng = new S.RNG(this.seedStr + 'card');
      this.ascension = ascension || 0;
      this.act = 0;                 // 索引 0..3
      this.floor = 0;
      this.gold = ch.gold;
      this.relics = [];
      this.relicCounters = {};
      this.potions = [];
      this.potionSlots = 3;
      this.flags = {};
      this.removeCount = 0;
      this.rareChanceBonus = 0;
      this.deck = ch.deck().map((id) => S.makeCard(id));
      this.pc = {
        isPlayer: true, name: ch.name, art: ch.art,
        hp: ch.hp, maxHp: ch.hp, block: 0, powers: {}
      };
      if (this.ascension >= 6) this.pc.hp = Math.floor(this.pc.maxHp * 0.9);
      if (this.ascension >= 14) { this.pc.maxHp = Math.floor(this.pc.maxHp * 0.95); this.pc.hp = Math.min(this.pc.hp, this.pc.maxHp); }
      if (this.ascension >= 10) this.deck.push(S.makeCard('ascenders_bane'));
      this.gainRelic(ch.relic, true);
      this.bossPool = this.rng.shuffle(S.ACTS.map((a) => this.rng.shuffle(a.bosses.slice())));
      this.eventsSeen = {};
      this.encWeakLeft = 3;
      this.encPool = {};
      this.buildEncounterPools();
      this.map = S.genMap(this.rng, this.act);
      this.curNode = null;
      this.combat = null;
      this.history = [];
      const st = S.getStats(); st.runs++; S.setStats(st);
      this.save();
    }

    buildEncounterPools() {
      const a = S.ACTS[this.act];
      this.encPool = {
        weak: this.rng.shuffle(a.weak.slice()),
        strong: this.rng.shuffle(a.strong.slice()),
        elite: this.rng.shuffle(a.elites.slice())
      };
      this.weakLeft = this.act === 0 ? 3 : 2;
      this.lastEnc = null;
    }

    /* ================= 属性计算 ================= */
    energyPerTurn() {
      let e = 5;
      this.relics.forEach((r) => {
        const d = S.relics[r];
        if (d && d.energy) e += d.energy;
      });
      if (this.hasRelic('slavers_collar') && this.combat && (this.combat.isBoss || this.combat.isElite)) e += 1;
      if (this.flags.teaSetActive) { e += 2; }
      return e;
    }
    extraDraw() {
      let n = 0;
      this.relics.forEach((r) => { const d = S.relics[r]; if (d && d.draw) n += d.draw; });
      return n;
    }
    naturalEnergyCap() {
      let c = 5;
      this.relics.forEach((r) => { const d = S.relics[r]; if (d && d.naturalCap) c += d.naturalCap; });
      return c;
    }
    triggerRelics(hook) {
      const args = Array.prototype.slice.call(arguments, 1);
      this.relics.slice().forEach((id) => {
        const d = S.relics[id];
        if (d && d[hook]) {
          try { d[hook].apply(null, [this].concat(args)); } catch (e) { console.error('relic ' + id + '.' + hook, e); }
        }
      });
    }
    modifyDamageGive(cmb, dmg, ctx) {
      let d = dmg;
      this.relics.forEach((id) => {
        const r = S.relics[id];
        if (r && r.atDamageGive) d = r.atDamageGive(this, cmb, d, ctx);
      });
      if (this.hasRelic('the_boot') && ctx.isAttack && ctx.fromCard && d > 0 && d <= 4) d = 5;
      return d;
    }
    modifyDamageReceive(cmb, dmg, ctx) {
      let d = dmg;
      this.relics.forEach((id) => {
        const r = S.relics[id];
        if (r && r.atDamageReceive) d = r.atDamageReceive(this, cmb, d, ctx);
      });
      if (this.hasRelic('torii') && ctx.isAttack && d <= 5 && d > 0) d = 1;
      return d;
    }
    modifyBlockGain(cmb, amt) {
      let a = amt;
      this.relics.forEach((id) => {
        const r = S.relics[id];
        if (r && r.atBlockGain) a = r.atBlockGain(this, cmb, a);
      });
      return a;
    }

    /* ================= 遗物 ================= */
    hasRelic(id) { return this.relics.indexOf(id) >= 0; }
    relicCount(id) { return this.relicCounters[id] || 0; }
    gainRelic(id, silent) {
      const d = S.relics[id];
      if (!d || this.hasRelic(id)) return null;
      if (d.replaces && this.hasRelic(d.replaces)) this.removeRelic(d.replaces);
      this.relics.push(id);
      if (d.counter) this.relicCounters[id] = 0;
      if (d.onEquip) d.onEquip(this);
      if (d.bottle) this.chooseBottle(id, d.bottle);
      if (!silent && S.UI) S.UI.toast('获得遗物：' + d.name);
      // 特殊获得效果
      if (id === 'cauldron') { for (let i = 0; i < 5; i++) this.gainRandomPotion(); }
      if (id === 'empty_cage') this.pendingRemove = 2;
      if (id === 'tiny_house') {
        this.addMaxHp(5); this.gainGold(50); this.gainRandomPotion();
        this.pendingCardReward = true; this.pendingUpgrade = 1;
      }
      if (id === 'calling_bell') {
        this.addCardToDeck('curse_of_the_bell');
        for (let i = 0; i < 3; i++) this.gainRandomRelic();
      }
      if (id === 'astrolabe') this.pendingTransformUp = 3;
      if (id === 'orrery') this.pendingOrrery = 5;
      if (id === 'dollys_mirror') this.pendingDuplicate = 1;
      this.save();
      return d;
    }
    removeRelic(id) {
      const i = this.relics.indexOf(id);
      if (i >= 0) this.relics.splice(i, 1);
      this.save();
    }
    async chooseBottle(relicId, type) {
      const pool = this.deck.filter((c) => S.cards[c.id].type === type);
      if (!pool.length) return;
      const sel = await S.UI.chooseCards(null, {
        from: pool, n: 1, deckView: true,
        prompt: S.relics[relicId].name + '：选择要装入瓶中的' + ({ attack: '攻击', skill: '技能', power: '能力' }[type]) + '牌'
      });
      if (sel[0]) {
        this.flags.bottles = this.flags.bottles || {};
        this.flags.bottles[relicId] = sel[0].uid;
        S.UI.toast(S.cardName(sel[0]) + ' 已装入瓶中');
        this.save();
      }
    }
    relicPool(tier) {
      const owned = this.relics;
      return Object.keys(S.relics).filter((id) => {
        const d = S.relics[id];
        if (owned.indexOf(id) >= 0) return false;
        if (d.tier !== tier) return false;
        if (d.char && d.char !== this.charColor) return false;
        if (d.tier === 'starter') return false;
        return true;
      });
    }
    gainRandomRelic(tier) {
      let t = tier;
      if (!t) {
        const r = this.rng.int(100);
        t = r < 50 ? 'common' : r < 83 ? 'uncommon' : 'rare';
      }
      let pool = this.relicPool(t);
      if (!pool.length) pool = this.relicPool('common').concat(this.relicPool('uncommon'), this.relicPool('rare'), this.relicPool('shop'), this.relicPool('event'));
      if (!pool.length) return null;
      return this.gainRelic(this.rng.pick(pool));
    }
    bossRelicChoices() {
      const pool = this.relicPool('boss');
      return this.rng.sample(pool, Math.min(3, pool.length));
    }

    /* ================= 生命 / 金币 ================= */
    healPlayer(n) {
      if (this.hasRelic('mark_of_the_bloom')) return;
      let amt = n;
      if (this.combat && !this.combat.over && this.hasRelic('magic_flower')) amt = Math.floor(amt * 1.5);
      this.pc.hp = Math.min(this.pc.maxHp, this.pc.hp + amt);
      this.save(); this.refresh();
    }
    damagePlayer(n) {
      let amt = n;
      if (this.hasRelic('tungsten_rod')) amt = Math.max(0, amt - 1);
      this.pc.hp -= amt;
      if (this.pc.hp <= 0) { this.pc.hp = 0; this.gameOver(false); }
      this.save(); this.refresh();
    }
    addMaxHp(n) { this.pc.maxHp += n; this.pc.hp += n; this.save(); this.refresh(); }
    loseMaxHp(n) {
      this.pc.maxHp = Math.max(1, this.pc.maxHp - n);
      this.pc.hp = Math.min(this.pc.hp, this.pc.maxHp);
      if (this.pc.hp <= 0) this.gameOver(false);
      this.save(); this.refresh();
    }
    gainGold(n) {
      if (this.hasRelic('ectoplasm')) return;
      let amt = n;
      if (this.hasRelic('golden_idol')) amt = Math.floor(amt * 1.25);
      this.gold += amt;
      this.triggerRelics('onGainGold', null, amt);
      this.save(); this.refresh();
    }
    spendGold(n) {
      this.gold = Math.max(0, this.gold - n);
      this.save(); this.refresh();
    }
    stealGold(n) {
      const amt = Math.min(this.gold, n);
      if (amt > 0) { this.gold -= amt; if (S.UI) S.UI.toast('被偷走了 ' + amt + ' 金币！'); }
      this.refresh();
    }

    /* ================= 牌组操作 ================= */
    cardPool(type, includeSpecial) {
      const out = [];
      Object.keys(S.cards).forEach((id) => {
        const d = S.cards[id];
        if (d.color !== this.charColor && d.color !== 'neutral') return;
        if (d.rarity === 'basic' || d.rarity === 'special') return;
        if (d.noPool || d.phantom) return;
        if (type && d.type !== type) return;
        out.push(id);
      });
      return out;
    }
    colorlessPool() {
      return Object.keys(S.cards).filter((id) => {
        const d = S.cards[id];
        return d.color === 'colorless' && !d.noPool && !d.phantom && (d.rarity === 'uncommon' || d.rarity === 'rare');
      });
    }
    addCardToDeck(id, upg) {
      const d = S.cards[id];
      if (!d) return null;
      if (d.type === 'curse' && this.relicCounters.omamori > 0) {
        this.relicCounters.omamori--;
        if (S.UI) S.UI.toast('御守抵挡了诅咒！');
        return null;
      }
      let up = upg ? 1 : 0;
      if (!up) {
        if (d.type === 'power' && this.hasRelic('frozen_egg')) up = 1;
        if (d.type === 'attack' && this.hasRelic('molten_egg')) up = 1;
        if (d.type === 'skill' && this.hasRelic('toxic_egg')) up = 1;
      }
      const c = S.makeCard(id, up);
      this.deck.push(c);
      if (d.type === 'curse' && this.hasRelic('darkstone_periapt')) this.addMaxHp(6);
      this.triggerRelics('onAddCard', null, c);
      this.save();
      return c;
    }
    removeCardFromDeck(c) {
      const i = this.deck.indexOf(c);
      if (i >= 0) {
        const d = S.cards[c.id];
        this.lastRemovedRarity = d.rarity;
        if (c.id === 'parasite') this.loseMaxHp(3);
        this.deck.splice(i, 1);
        this.save();
        return S.cardName(c);
      }
      return null;
    }
    removableDeck() { return this.deck.filter((c) => !S.cards[c.id].noRemove); }
    removeRandomCard() {
      const pool = this.removableDeck();
      if (!pool.length) return null;
      return this.removeCardFromDeck(this.rng.pick(pool));
    }
    removeAllCurses() {
      const curses = this.deck.filter((c) => S.cards[c.id].type === 'curse' && !S.cards[c.id].noRemove);
      curses.forEach((c) => this.removeCardFromDeck(c));
      return curses.length;
    }
    upgradeRandom(type, n) {
      const pool = this.deck.filter((c) => S.canUpgrade(c) && (!type || S.cards[c.id].type === type));
      this.rng.shuffle(pool);
      const list = pool.slice(0, n);
      list.forEach((c) => S.upgradeCard(c));
      this.save();
      return list.length;
    }
    upgradeAll() {
      this.deck.forEach((c) => { if (S.canUpgrade(c)) S.upgradeCard(c); });
      this.save();
    }
    replaceStrikes(newId) {
      let n = 0;
      this.deck.forEach((c) => {
        if (S.cards[c.id].name.indexOf('打击') >= 0) { c.id = newId; c.upg = 0; delete c.bonus; n++; }
      });
      this.save();
      return n;
    }
    transformCard(c) {
      const name = S.cardName(c);
      this.removeCardFromDeck(c);
      let pool = this.cardPool();
      pool = pool.filter((id) => id !== c.id);
      const id = this.rng.pick(pool);
      this.addCardToDeck(id);
      this.lastTransformed = S.cards[id].name;
      return name;
    }
    async removeCardUI(prompt) {
      const pool = this.removableDeck();
      if (!pool.length) return null;
      const sel = await S.UI.chooseCards(null, { from: pool, n: 1, prompt: prompt || '选择要移除的卡牌', canSkip: true, deckView: true });
      if (!sel[0]) return null;
      return this.removeCardFromDeck(sel[0]);
    }
    async upgradeCardUI(prompt) {
      const pool = this.deck.filter((c) => S.canUpgrade(c));
      if (!pool.length) { if (S.UI) S.UI.toast('没有可升级的卡牌'); return null; }
      const sel = await S.UI.chooseCards(null, { from: pool, n: 1, prompt: prompt || '选择要升级的卡牌', canSkip: true, deckView: true });
      if (!sel[0]) return null;
      S.upgradeCard(sel[0]);
      this.save();
      return S.cardName(sel[0]);
    }
    async transformCardUI() {
      const pool = this.removableDeck();
      if (!pool.length) return null;
      const sel = await S.UI.chooseCards(null, { from: pool, n: 1, prompt: '选择要转化的卡牌', canSkip: true, deckView: true });
      if (!sel[0]) return null;
      return this.transformCard(sel[0]);
    }
    async duplicateCardUI() {
      if (!this.deck.length) return null;
      const sel = await S.UI.chooseCards(null, { from: this.deck.slice(), n: 1, prompt: '选择要复制的卡牌', canSkip: true, deckView: true });
      if (!sel[0]) return null;
      const c = S.makeCard(sel[0].id, sel[0].upg);
      if (sel[0].bonus) c.bonus = Object.assign({}, sel[0].bonus);
      this.deck.push(c);
      this.save();
      return S.cardName(sel[0]);
    }
    async pickCardFromList(ids, prompt) {
      const cards = ids.map((id) => S.makeCard(id));
      const sel = await S.UI.chooseCards(null, { from: cards, n: 1, prompt: prompt || '选择一张卡牌', canSkip: true, virtual: true });
      if (!sel[0]) return null;
      this.addCardToDeck(sel[0].id, sel[0].upg);
      return S.cardName(sel[0]);
    }

    /* ================= 药水 ================= */
    potionPool() {
      return Object.keys(S.potions).filter((id) => {
        const d = S.potions[id];
        if (d.char && d.char !== this.charColor) return false;
        return true;
      });
    }
    gainRandomPotion(silent) {
      if (this.hasRelic('sozu')) return null;
      if (this.potions.length >= this.potionSlots) { if (!silent && S.UI) S.UI.toast('药水栏已满'); return null; }
      const r = this.rng.int(100);
      const tier = r < 65 ? 'common' : r < 90 ? 'uncommon' : 'rare';
      let pool = this.potionPool().filter((id) => S.potions[id].tier === tier);
      if (!pool.length) pool = this.potionPool();
      const id = this.rng.pick(pool);
      this.potions.push(id);
      this.save(); this.refresh();
      return S.potions[id];
    }
    gainPotion(id) {
      if (this.hasRelic('sozu')) return false;
      if (this.potions.length >= this.potionSlots) { if (S.UI) S.UI.toast('药水栏已满'); return false; }
      this.potions.push(id);
      this.save(); this.refresh();
      return true;
    }
    discardPotion(idx) { this.potions.splice(idx, 1); this.save(); this.refresh(); }
    async usePotion(idx, target) {
      const id = this.potions[idx];
      const d = S.potions[id];
      if (!d) return;
      if (d.combatOnly && (!this.combat || this.combat.over)) { if (S.UI) S.UI.toast('只能在战斗中使用'); return; }
      if (d.passive) { if (S.UI) S.UI.toast('该药水会自动生效'); return; }
      const m = this.hasRelic('sacred_bark') ? 2 : 1;
      this.potions.splice(idx, 1);
      const r = d.use(this, this.combat, target, m);
      if (r && r.then) await r;
      this.triggerRelics('onUsePotion', this.combat, id);
      this.save(); this.refresh();
      if (this.combat) this.combat.dirty();
    }
    tryRevive(cmb) {
      // 瓶中仙子
      const fi = this.potions.indexOf('fairy_in_a_bottle');
      if (fi >= 0) {
        this.potions.splice(fi, 1);
        const m = this.hasRelic('sacred_bark') ? 2 : 1;
        this.pc.hp = Math.max(1, Math.floor(this.pc.maxHp * 0.3 * m));
        if (S.UI) { S.UI.toast('瓶中仙子救了你！'); }
        this.refresh();
        return true;
      }
      if (this.relicCounters.lizard_tail > 0) {
        this.relicCounters.lizard_tail = 0;
        this.pc.hp = Math.max(1, Math.floor(this.pc.maxHp * 0.5));
        if (S.UI) S.UI.toast('蜥蜴尾救了你！');
        this.refresh();
        return true;
      }
      return false;
    }

    /* ================= 地图 / 房间 ================= */
    availableNodes() {
      if (!this.curNode) return this.map.rows[0].slice();
      return this.curNode.next.slice();
    }
    canGoTo(node) {
      return this.availableNodes().indexOf(node) >= 0;
    }
    enterNode(node) {
      this.curNode = node;
      node.visited = true;
      this.floor = node.row + 1;
      this.triggerRelics('onFloor', null);
      this.save();
      switch (node.type) {
        case S.NODE.MONSTER: this.startFight(this.pickMonster()); break;
        case S.NODE.ELITE: this.startFight(this.pickElite()); break;
        case S.NODE.BOSS: this.startFight(this.pickBoss()); break;
        case S.NODE.TREASURE: S.UI.showTreasure(); break;
        case S.NODE.SHOP: S.UI.showShop(); break;
        case S.NODE.REST: S.UI.showRest(); break;
        case S.NODE.EVENT: this.enterEvent(); break;
      }
    }
    enterEvent() {
      if (this.hasRelic('ssserpent_head')) this.gainGold(50);
      // 小宝箱
      this.flags.qRooms = (this.flags.qRooms || 0) + 1;
      if (this.hasRelic('tiny_chest') && this.flags.qRooms % 4 === 0) { S.UI.showTreasure(); return; }
      const roll = this.rng.int(100);
      const eventChance = this.hasRelic('juzu_bracelet') ? 100 : 75;
      if (roll >= eventChance) {
        // 变成普通战斗 / 商店 / 宝箱
        const r2 = this.rng.int(100);
        if (r2 < 50) { this.startFight(this.pickMonster()); return; }
        if (r2 < 85) { S.UI.showTreasure(); return; }
        S.UI.showShop(); return;
      }
      const pool = Object.keys(S.events).filter((id) => {
        const d = S.events[id];
        if (this.eventsSeen[id]) return false;
        if (d.acts && d.acts.indexOf(this.act + 1) < 0) return false;
        if (d.requires && !d.requires(this)) return false;
        return true;
      });
      if (!pool.length) { this.startFight(this.pickMonster()); return; }
      const id = this.rng.pick(pool);
      this.eventsSeen[id] = true;
      S.UI.showEvent(S.events[id]);
    }

    pickMonster() {
      let pool;
      if (this.weakLeft > 0) { pool = this.encPool.weak; this.weakLeft--; }
      else pool = this.encPool.strong;
      if (!pool || !pool.length) pool = (S.ACTS[this.act].strong || []).slice();
      if (!pool.length) pool = (S.ACTS[this.act].weak || []).slice();
      if (!pool.length) return this.pickElite();
      let e = pool.shift();
      if (this.lastEnc && e && e.name === this.lastEnc && pool.length) { pool.push(e); e = pool.shift(); }
      pool.push(e);
      this.lastEnc = e.name;
      return e;
    }
    pickElite() {
      let pool = this.encPool.elite;
      if (!pool || !pool.length) pool = S.ACTS[this.act].elites.slice();
      const e = pool.shift();
      pool.push(e);
      return e;
    }
    pickBoss() {
      const list = S.ACTS[this.act].bosses;
      if (!this.chosenBoss) this.chosenBoss = {};
      if (!this.chosenBoss[this.act]) this.chosenBoss[this.act] = this.rng.pick(list);
      return this.chosenBoss[this.act];
    }

    startFight(encounter, opts) {
      this.fightOpts = opts || {};
      const cmb = new S.Combat(this, encounter);
      this.combat = cmb;
      // 尼奥的悲叹
      if (this.relicCounters.neows_lament > 0) {
        this.relicCounters.neows_lament--;
        cmb.neowLament = true;
      }
      S.UI.show('combat');
      cmb.setup();
      if (cmb.neowLament) cmb.enemyList.forEach((e) => { e.hp = 1; });
      // 保存瓶装遗物起始手牌
      cmb.dirty();
      S.UI.startCombatUI(cmb);
    }

    onCombatWon(cmb) {
      this.combat = null;
      const enc = cmb.enc;
      const rewards = [];
      const kind = cmb.isBoss ? 'boss' : cmb.isElite ? 'elite' : 'weak';
      const gr = S.GOLD_REWARD[kind];
      let gold = this.rng.range(gr[0], gr[1]);
      if (cmb.isBoss) gold = this.rng.range(95, 105);
      rewards.push({ type: 'gold', amount: gold });
      // 药水
      let potionChance = 40 + (this.flags.potionLuck || 0);
      if (this.hasRelic('white_beast_statue')) potionChance = 100;
      if (this.rng.int(100) < potionChance) {
        rewards.push({ type: 'potion' });
        this.flags.potionLuck = (this.flags.potionLuck || 0) - 10;
      } else this.flags.potionLuck = (this.flags.potionLuck || 0) + 10;
      // 卡牌
      rewards.push({ type: 'card', cards: this.makeCardReward(cmb) });
      if (this.hasRelic('prayer_wheel') && !cmb.isElite && !cmb.isBoss) rewards.push({ type: 'card', cards: this.makeCardReward(cmb) });
      // 遗物
      if (cmb.isElite) {
        rewards.push({ type: 'relic', tier: this.fightOpts.relicTier });
        if (this.hasRelic('black_star')) rewards.push({ type: 'relic' });
      }
      if (this.fightOpts.relic) rewards.push({ type: 'relic', id: this.fightOpts.relic });
      else if (this.fightOpts.relicTier) rewards.push({ type: 'relic', tier: this.fightOpts.relicTier });
      if (cmb.isBoss && this.act < 3) rewards.push({ type: 'boss_relic' });
      if (cmb.isBoss) rewards.push({ type: 'potion' });
      const st = S.getStats();
      st.kills += cmb.deadThisCombat;
      if (this.floor > (st.best || 0)) st.best = this.floor;
      S.setStats(st);
      this.flags.teaSetActive = false;
      this.save();
      S.UI.showRewards(rewards, cmb.isBoss);
    }
    makeCardReward(cmb) {
      let n = 3;
      if (this.hasRelic('question_card')) n++;
      if (this.hasRelic('busted_crown')) n -= 2;
      n = Math.max(1, n);
      const out = [];
      const usedIds = {};
      const upChance = this.act === 0 ? 0 : this.act === 1 ? 12 : 25;
      for (let i = 0; i < n; i++) {
        let rare = 3 + this.rareChanceBonus, unc = 37;
        if (this.hasRelic('nloths_gift') && !this.flags.nlothUsed) rare *= 3;
        if (cmb && cmb.isElite) { rare += 7; unc += 5; }
        const r = this.rng.int(100);
        let tier = r < rare ? 'rare' : r < rare + unc ? 'uncommon' : 'common';
        let pool = this.cardPool().filter((id) => S.cards[id].rarity === tier && !usedIds[id]);
        if (this.hasRelic('prismatic_shard')) {
          const extra = Object.keys(S.cards).filter((id) => {
            const d = S.cards[id];
            return d.rarity === tier && !d.noPool && d.color !== 'colorless' && d.color !== 'curse' && d.color !== 'status' && !usedIds[id];
          });
          pool = pool.concat(extra);
        }
        if (!pool.length) pool = this.cardPool().filter((id) => !usedIds[id]);
        if (!pool.length) break;
        const id = this.rng.pick(pool);
        usedIds[id] = true;
        out.push(S.makeCard(id, this.rng.int(100) < upChance ? 1 : 0));
      }
      if (this.hasRelic('nloths_gift')) { this.flags.nlothUsed = true; this.removeRelic('nloths_gift'); }
      return out;
    }

    onCombatLost() {
      this.combat = null;
      this.gameOver(false);
    }
    escapeCombat() {
      this.combat = null;
      S.UI.show('map');
      S.UI.renderMap();
    }
    checkAllFledStub() { }

    /* ================= 幕切换 ================= */
    nextAct() {
      this.act++;
      if (this.act >= S.ACTS.length) { this.gameOver(true); return; }
      if (this.act === 3 && !this.flags.wantHeart) { this.gameOver(true); return; }
      this.floor = 0;
      this.buildEncounterPools();
      this.map = S.genMap(this.rng, this.act);
      this.curNode = null;
      this.healPlayer(Math.floor(this.pc.maxHp * 0.0));
      this.save();
      S.UI.showActIntro();
    }
    jumpToBoss() {
      // 秘密传送门：直达首领
      this.curNode = this.map.rows[14][0];
      this.enterNode(this.map.boss);
    }
    nextBossChallenge() {
      // 挑战模式：击败首领后立即迎接下一幕首领
      this.act = (this.act + 1) % S.ACTS.length;
      this.floor++;
      this.chosenBoss = {};
      this.save();
      S.UI.show('combat');
      this.startFight(this.pickBoss());
    }
    gameOver(win) {
      const st = S.getStats();
      if (win) st.wins++;
      S.setStats(st);
      S.clearSave();
      S.UI.showGameOver(win);
    }

    /* ================= 存档 ================= */
    save() {
      if (this.noSave || !this.map || !this.char) return;
      try {
        const data = {
          v: 1, charId: this.char.id, seed: this.seedStr, asc: this.ascension,
          act: this.act, floor: this.floor, gold: this.gold,
          relics: this.relics, relicCounters: this.relicCounters,
          potions: this.potions, potionSlots: this.potionSlots,
          deck: this.deck.map((c) => ({ id: c.id, upg: c.upg, bonus: c.bonus, upTimes: c.upTimes })),
          pc: { hp: this.pc.hp, maxHp: this.pc.maxHp },
          flags: this.flags, eventsSeen: this.eventsSeen,
          removeCount: this.removeCount,
          weakLeft: this.weakLeft,
          mapSeedAct: this.act,
          map: this.serializeMap(),
          curNode: this.curNode ? this.curNode.id : null,
          inCombat: !!this.combat
        };
        S.saveGame(data);
      } catch (e) { console.warn('存档失败', e); }
    }
    serializeMap() {
      const m = this.map;
      const nodes = {};
      Object.keys(m.nodes).forEach((k) => {
        const n = m.nodes[k];
        nodes[k] = { r: n.row, c: n.col, t: n.type, v: n.visited, nx: n.next.map((x) => x.id), x: n.x, y: n.y };
      });
      return { nodes: nodes, boss: { v: m.boss.visited, x: m.boss.x, y: m.boss.y }, width: m.width, height: m.height };
    }
    loadFrom(data) {
      const ch = S.CHARS.find((c) => c.id === data.charId) || S.CHARS[0];
      this.char = ch; this.charColor = ch.color;
      this.seedStr = data.seed;
      this.rng = new S.RNG(data.seed + '_' + (data.floor || 0));
      this.ascension = data.asc || 0;
      this.act = data.act; this.floor = data.floor; this.gold = data.gold;
      this.relics = data.relics || []; this.relicCounters = data.relicCounters || {};
      this.potions = data.potions || []; this.potionSlots = data.potionSlots || 3;
      this.deck = (data.deck || []).map((c) => {
        const card = S.makeCard(c.id, c.upg);
        if (c.bonus) card.bonus = c.bonus;
        if (c.upTimes) card.upTimes = c.upTimes;
        return card;
      });
      this.pc = { isPlayer: true, name: ch.name, art: ch.art, hp: data.pc.hp, maxHp: data.pc.maxHp, block: 0, powers: {} };
      this.flags = data.flags || {}; this.eventsSeen = data.eventsSeen || {};
      this.removeCount = data.removeCount || 0;
      this.weakLeft = data.weakLeft || 0;
      this.buildEncounterPools();
      this.weakLeft = data.weakLeft || 0;
      // 还原地图
      const sm = data.map;
      const nodes = {};
      const rows = [];
      for (let i = 0; i < 15; i++) rows.push([]);
      Object.keys(sm.nodes).forEach((k) => {
        const s = sm.nodes[k];
        const n = { row: s.r, col: s.c, id: k, type: s.t, visited: s.v, next: [], prev: [], x: s.x, y: s.y };
        nodes[k] = n;
        if (rows[s.r]) rows[s.r].push(n);
      });
      const boss = { row: 15, col: 3, id: 'boss', type: S.NODE.BOSS, next: [], prev: [], visited: sm.boss.v, x: sm.boss.x, y: sm.boss.y };
      Object.keys(sm.nodes).forEach((k) => {
        sm.nodes[k].nx.forEach((nk) => {
          const a = nodes[k], b = nk === 'boss' ? boss : nodes[nk];
          if (a && b) { a.next.push(b); b.prev.push(a); }
        });
      });
      rows.forEach((rw) => rw.sort((a, b) => a.col - b.col));
      this.map = { rows: rows, nodes: nodes, boss: boss, width: sm.width, height: sm.height, act: this.act };
      this.curNode = data.curNode ? (data.curNode === 'boss' ? boss : nodes[data.curNode]) : null;
      this.combat = null;
      this.chosenBoss = null;
    }

    refresh() { if (S.UI) S.UI.renderTop(); }
  }

  S.Game = Game;
})();
