/* ================= util.js · 基础设施 ================= */
(function () {
  'use strict';
  const STS = (window.STS = window.STS || {});

  /* ---------- 随机数（可复现种子） ---------- */
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  class RNG {
    constructor(seed) {
      this.setSeed(seed);
    }
    setSeed(seed) {
      const s = xmur3(String(seed == null ? Math.random() : seed));
      this.a = s();
      this.counter = 0;
    }
    next() {
      // mulberry32
      this.counter++;
      let t = (this.a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /** [0,n) 整数 */
    int(n) { return Math.floor(this.next() * n); }
    /** [a,b] 含端点 */
    range(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[this.int(arr.length)]; }
    chance(p) { return this.next() < p; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
    /** 不重复取 n 个 */
    sample(arr, n) {
      const c = arr.slice();
      this.shuffle(c);
      return c.slice(0, n);
    }
  }
  STS.RNG = RNG;
  STS.rng = new RNG(Date.now());

  /* ---------- 注册表 ---------- */
  STS.cards = {};
  STS.powers = {};
  STS.relics = {};
  STS.potions = {};
  STS.enemies = {};
  STS.events = {};
  STS.encounters = {};

  let cardOrder = 0;
  STS.defCard = function (id, def) {
    def.id = id;
    def.order = cardOrder++;
    def.base = def.base || {};
    def.up = def.up || {};
    if (!def.color) def.color = 'colorless';
    if (def.cost === undefined) def.cost = 1;
    if (!def.target) def.target = def.type === 'attack' ? 'enemy' : 'none';
    STS.cards[id] = def;
    return def;
  };
  STS.defPower = function (id, def) { def.id = id; STS.powers[id] = def; return def; };
  STS.defRelic = function (id, def) { def.id = id; STS.relics[id] = def; return def; };
  STS.defPotion = function (id, def) { def.id = id; STS.potions[id] = def; return def; };
  STS.defEnemy = function (id, def) { def.id = id; STS.enemies[id] = def; return def; };
  STS.defEvent = function (id, def) { def.id = id; STS.events[id] = def; return def; };

  /* ---------- 卡牌实例 ---------- */
  let uidSeq = 1;
  STS.makeCard = function (id, upg) {
    const def = STS.cards[id];
    if (!def) { console.warn('未知卡牌', id); return null; }
    const c = { id: id, uid: uidSeq++, upg: upg ? 1 : 0 };
    if (def.phantom) c.phantom = true;
    return c;
  };
  STS.cardDef = function (c) { return STS.cards[c.id]; };
  /** 结算卡牌数值（考虑升级 / 额外升级次数） */
  STS.cardVals = function (c) {
    const d = STS.cards[c.id];
    const v = Object.assign({}, d.base);
    if (c.upg) Object.assign(v, d.up);
    if (c.bonus) for (const k in c.bonus) v[k] = (v[k] || 0) + c.bonus[k];
    if (c.bonusCombat) for (const k in c.bonusCombat) v[k] = (v[k] || 0) + c.bonusCombat[k];
    return v;
  };
  STS.cardName = function (c) {
    const d = STS.cards[c.id];
    if (!c.upg) return d.name;
    if (d.upNameFn) return d.upNameFn(c);
    if (d.upName) return d.upName;
    return d.name + '+';
  };
  STS.cardCost = function (c) {
    const d = STS.cards[c.id];
    let cost = d.cost;
    if (c.upg && d.upCost !== undefined) cost = d.upCost;
    if (c.costMod !== undefined) cost = c.costMod;   // 永久改变（如厄运/无形）
    if (c.costTurn !== undefined) cost = c.costTurn; // 本回合改变
    return cost;
  };
  STS.canUpgrade = function (c) {
    const d = STS.cards[c.id];
    if (d.type === 'curse' || d.type === 'status') return false;
    if (d.noUpgrade) return false;
    if (d.multiUpgrade) return true;
    return !c.upg;
  };
  STS.upgradeCard = function (c) {
    const d = STS.cards[c.id];
    if (d.multiUpgrade) {
      c.upg = 1;
      c.bonus = c.bonus || {};
      if (c.upTimes === undefined) c.upTimes = 0;
      c.upTimes++;
      if (d.onUpgrade) d.onUpgrade(c);
    } else {
      c.upg = 1;
    }
    return c;
  };

  /* ---------- 小工具 ---------- */
  STS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  STS.sum = (a) => a.reduce((x, y) => x + y, 0);
  STS.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  STS.$ = (s) => document.querySelector(s);
  STS.$$ = (s) => Array.prototype.slice.call(document.querySelectorAll(s));
  STS.esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));

  /* 数值高亮：与基础值不同则标绿 */
  STS.hl = function (val, base) {
    if (base !== undefined && val !== base) return '<b class="up">' + val + '</b>';
    return '<b>' + val + '</b>';
  };

  /* ---------- 关键词说明（tooltip） ---------- */
  STS.KEYWORDS = {
    '易伤': '受到的攻击伤害提高 50%。每回合结束时减少 1 层。',
    '虚弱': '造成的攻击伤害降低 25%。每回合结束时减少 1 层。',
    '脆弱': '获得的格挡降低 25%。每回合结束时减少 1 层。',
    '力量': '每层使攻击伤害提高 1 点。',
    '敏捷': '每层使获得的格挡提高 1 点。',
    '中毒': '回合开始时失去等同层数的生命，然后层数减 1。',
    '格挡': '抵挡伤害，回合开始时清空（除非有壁垒等效果）。',
    '虚无': '抽到时打出，无法打出的牌抽到即消耗。',
    '消耗': '打出后移入消耗堆，本场战斗不再出现。',
    '灵魂虚体': '若回合结束时仍在手中，则消耗此牌。',
    '天生': '战斗开始时必定在起始手牌中。',
    '保留': '回合结束时不会被弃掉。',
    '幻影': '不会出现在普通卡池中；本局对战结束后会彻底消失。',
    '反制': '可在战斗中选择布置；根据敌方意图或下回合出的牌触发，敌方看不到你布置了哪张。',
    '神器': '每层可抵挡 1 个负面效果。',
    '荆棘': '受到攻击时对攻击者造成等量伤害。',
    '金属化': '回合结束时获得等量格挡。',
    '镀层': '回合结束时获得等量格挡；受到攻击伤害时层数减 1。',
    '再生': '回合结束时恢复等量生命，然后层数减 1。',
    '壁垒': '回合开始时不再失去格挡。',
    '暴怒': '每当你打出技能牌，获得等量力量。',
    '双重施法': '下一张打出的攻击牌打出两次。',
    '进化': '每当你抽到状态牌，抽等量的牌。',
    '黑暗拥抱': '每当有卡牌被消耗，抽等量的牌。',
    '感觉不到痛': '每当有卡牌被消耗，获得等量格挡。',
    '喷火': '每当你抽到状态牌或诅咒牌，对所有敌人造成等量伤害。',
    '恶魔之型': '每回合开始时获得等量力量。',
    '重生之火': '受到攻击伤害时，失去 1 层并抽 1 张牌。',
    '破裂': '每当你因卡牌失去生命，获得等量力量。',
    '缠绕': '本回合无法打出攻击牌。',
    '无法抽牌': '本回合无法抽牌。',
    '仪式': '每回合结束时获得等量力量。',
    '卷曲': '首次受到攻击伤害时获得等量格挡。',
    '愤怒(敌)': '每当受到攻击牌伤害时获得等量力量。',
    '分裂': '生命值低于一半时分裂为两个同等生命的个体。',
    '孢子云': '死亡时给予玩家等量易伤。',
    '刺痛之皮': '每当你打出攻击牌，受到等量伤害。',
    '可塑': '每次受到攻击获得 3(递增) 格挡，回合开始重置。',
    '死亡节拍': '每当你打出一张牌，受到等量伤害。',
    '无敌': '本回合最多只能受到等量伤害。',
    '时间扭曲': '你打出 12 张牌后，敌人立刻行动且获得 2 层力量。',
    '好奇心': '每当你打出能力牌，敌人获得等量力量。',
    '不察': '若你在一回合内造成超过 30 点伤害，则……',
    '飞行': '受到的攻击伤害减半；受到 4 次攻击后落地。',
    '强化': '受到的攻击伤害提高。',
    '虚弱化': '……',
    '灼烧': '回合结束时受到伤害。',
    '专注': '影响法球的效果。',
    '模式切换': '格挡被击破后切换为攻击模式。'
  };
  STS.kwHtml = function (text) {
    return String(text);
  };

  /* ---------- 通用队列动画计时 ---------- */
  STS.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- 本地存档 ---------- */
  const SAVE_KEY = 'sts_web_save_v1';
  const STAT_KEY = 'sts_web_stats_v1';
  STS.saveGame = function (data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { }
  };
  STS.loadSave = function () {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  };
  STS.clearSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } };
  STS.getStats = function () {
    try { return JSON.parse(localStorage.getItem(STAT_KEY)) || { runs: 0, wins: 0, kills: 0, best: 0 }; }
    catch (e) { return { runs: 0, wins: 0, kills: 0, best: 0 }; }
  };
  STS.setStats = function (s) { try { localStorage.setItem(STAT_KEY, JSON.stringify(s)); } catch (e) { } };
})();
