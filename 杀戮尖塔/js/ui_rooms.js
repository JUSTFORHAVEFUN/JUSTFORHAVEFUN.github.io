/* ================= ui_rooms.js · 地图与各类房间界面 ================= */
(function () {
  'use strict';
  const S = window.STS;
  const UI = S.UI;
  const el = S.el, $ = S.$, $$ = S.$$;

  /* ================= 地图 ================= */
  UI.renderMap = function () {
    const g = S.game;
    const map = g.map;
    const canvas = $('#map-canvas');
    const svg = $('#map-lines');
    const nodesBox = $('#map-nodes');
    $('#map-act-name').textContent = S.ACTS[g.act].name;
    canvas.style.width = map.width + 'px';
    canvas.style.height = map.height + 'px';
    svg.setAttribute('viewBox', '0 0 ' + map.width + ' ' + map.height);
    svg.setAttribute('width', map.width);
    svg.setAttribute('height', map.height);
    svg.innerHTML = '';
    nodesBox.innerHTML = '';

    const avail = g.availableNodes();
    const all = [];
    map.rows.forEach((rw) => rw.forEach((n) => all.push(n)));
    all.push(map.boss);

    // 连线
    all.forEach((n) => {
      n.next.forEach((m) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mx = (n.x + m.x) / 2, my = (n.y + m.y) / 2;
        path.setAttribute('d', 'M ' + n.x + ' ' + n.y + ' Q ' + (mx + 6) + ' ' + my + ' ' + m.x + ' ' + m.y);
        if (n.visited && m.visited) path.classList.add('taken');
        else if (n === g.curNode && avail.indexOf(m) >= 0) path.classList.add('avail');
        svg.appendChild(path);
      });
    });

    // 节点
    all.forEach((n) => {
      const d = el('div', 'mnode');
      d.textContent = S.NODE_ICON[n.type];
      d.style.left = n.x + 'px';
      d.style.top = n.y + 'px';
      const canGo = g.canGoTo(n);
      if (n.visited) d.classList.add('visited');
      if (n === g.curNode) d.classList.add('cur');
      if (canGo) {
        d.classList.add('avail');
        d.addEventListener('click', () => {
          UI.show('map');
          g.enterNode(n);
        });
      }
      d.setAttribute('data-tip', '<h5>' + S.NODE_NAME[n.type] + '</h5>' + nodeDesc(n));
      nodesBox.appendChild(d);
    });
    // 楼层标签
    for (let r = 0; r < map.rows.length; r++) {
      if (!map.rows[r].length) continue;
      const t = el('div', 'floor-tag', String(r + 1));
      t.style.left = '6px';
      t.style.top = map.rows[r][0].y + 'px';
      nodesBox.appendChild(t);
    }
    // 滚动到当前位置
    setTimeout(() => {
      const sc = $('#map-scroll');
      const target = g.curNode || map.rows[0][0];
      sc.scrollTop = Math.max(0, target.y - sc.clientHeight * 0.62);
    }, 20);
  };
  function nodeDesc(n) {
    const m = {
      monster: '与普通敌人战斗，获得金币与卡牌奖励。',
      elite: '强大的敌人，但会掉落遗物。',
      event: '未知事件，可能是机遇也可能是陷阱。',
      rest: '休息恢复生命，或锻造升级一张卡牌。',
      shop: '用金币购买卡牌、遗物与药水。',
      treasure: '打开宝箱获得遗物。',
      boss: '本幕的首领，击败后前进到下一幕。'
    };
    return m[n.type] || '';
  }

  /* ================= 幕过场 ================= */
  UI.showActIntro = function () {
    const g = S.game;
    const a = S.ACTS[g.act];
    UI.panel(a.name, '<p class="center" style="font-size:16px;line-height:2">' +
      ['尖塔的低语在你耳边回响……', '城市的废墟在你脚下延展……', '尖塔深处，光线开始扭曲……', '心跳的声音越来越近……'][g.act] +
      '</p><p class="center" style="color:#8b8171">当前生命 ' + g.pc.hp + ' / ' + g.pc.maxHp + '　金币 ' + g.gold + '</p>',
      [{ label: '继续攀登', center: true, onClick: () => { UI.closePanel(); UI.show('map'); UI.renderMap(); } }]);
  };

  /* ================= 战斗奖励 ================= */
  UI.showRewards = function (rewards, isBoss) {
    const g = S.game;
    let bossWin = isBoss;
    function render() {
      const body = el('div', 'reward-list');
      rewards.forEach((r, i) => {
        const item = el('div', 'reward-item' + (r.done ? ' done' : ''));
        let ico = '❔', txt = '', sub = '';
        if (r.type === 'gold') { ico = '🪙'; txt = r.amount + ' 金币'; }
        if (r.type === 'potion') { ico = '🧪'; txt = '一瓶药水'; sub = '随机药水'; }
        if (r.type === 'card') { ico = '🎴'; txt = '卡牌奖励'; sub = r.cards.length + ' 张可选'; }
        if (r.type === 'relic') { ico = '💎'; txt = r.id ? S.relics[r.id].name : '遗物'; }
        if (r.type === 'boss_relic') { ico = '👑'; txt = '首领遗物'; sub = '从 3 个中选择 1 个'; }
        item.innerHTML = '<div class="reward-ico">' + ico + '</div><div class="reward-txt"><b>' + txt + '</b>' +
          (sub ? '<div>' + sub + '</div>' : '') + '</div>';
        item.addEventListener('click', async () => {
          if (r.done) return;
          if (r.type === 'gold') { g.gainGold(r.amount); r.done = true; }
          else if (r.type === 'potion') { const p = g.gainRandomPotion(); if (!p) return; r.done = true; }
          else if (r.type === 'relic') {
            if (r.id) g.gainRelic(r.id); else g.gainRandomRelic(r.tier);
            r.done = true;
          } else if (r.type === 'card') {
            const ok = await UI.cardRewardPick(r.cards);
            if (!ok) return;
            r.done = true;
          } else if (r.type === 'boss_relic') {
            const ok = await UI.bossRelicPick();
            if (!ok) return;
            r.done = true;
          }
          UI.renderTop();
          render();
        });
        body.appendChild(item);
      });
      UI.panel('战斗胜利', '', [{
        label: bossWin && g.flags.challenge ? '迎接下一场首领战' : '继续前进', center: true,
        onClick: () => {
          UI.closePanel();
          if (bossWin) {
            if (g.flags.challenge) g.nextBossChallenge();
            else if (g.act === 2 && !g.flags.wantHeart) UI.askHeart();
            else g.nextAct();
          } else { UI.show('map'); UI.renderMap(); }
        }
      }]);
      $('#ov-body').innerHTML = '';
      $('#ov-body').appendChild(body);
    }
    render();
  };

  UI.cardRewardPick = function (cards) {
    return new Promise(async (resolve) => {
      const g = S.game;
      const opts = { from: cards, n: 1, prompt: '选择一张卡牌', canSkip: true, virtual: true };
      const sel = await UI.chooseCards(null, opts);
      if (!sel[0]) {
        if (g.hasRelic('singing_bowl')) {
          const i = await UI.chooseOption('你跳过了卡牌奖励。', [
            { label: '颂钵：最大生命 +2' }, { label: '什么都不要' }
          ]);
          if (i === 0) { g.addMaxHp(2); UI.toast('最大生命 +2'); }
        }
        resolve(true);
        return;
      }
      g.addCardToDeck(sel[0].id, sel[0].upg);
      UI.toast('获得卡牌：' + S.cardName(sel[0]));
      resolve(true);
    });
  };

  UI.bossRelicPick = function () {
    return new Promise((resolve) => {
      const g = S.game;
      const list = g.bossRelicChoices();
      if (!list.length) { resolve(true); return; }
      UI.panel('选择首领遗物', '', list.map((id) => {
        const d = S.relics[id];
        return {
          label: d.icon + ' ' + d.name, sub: d.desc,
          onClick: () => { g.gainRelic(id); UI.closePanel(); resolve(true); }
        };
      }).concat([{ label: '全都不要', center: true, onClick: () => { UI.closePanel(); resolve(true); } }]));
    });
  };

  UI.askHeart = function () {
    const g = S.game;
    UI.panel('尖塔之心', '<p>你击败了尖塔的第三位守卫。前方的裂缝中，某种庞大的心跳正在回响。</p>' +
      '<p style="color:#c98">继续深入将面对尖塔真正的核心——腐化之心。这是一条极其危险的道路。</p>',
      [
        { label: '进入尖塔之心（第四幕）', sub: '挑战最终首领', onClick: () => { UI.closePanel(); g.flags.wantHeart = true; g.act = 2; g.nextAct(); } },
        { label: '就此结束旅程', sub: '以胜利结算', onClick: () => { UI.closePanel(); g.gameOver(true); } }
      ]);
  };

  /* ================= 宝箱 ================= */
  UI.showTreasure = function () {
    const g = S.game;
    const roll = g.rng.int(100);
    const size = roll < 50 ? 'small' : roll < 83 ? 'medium' : 'large';
    let tier;
    const r2 = g.rng.int(100);
    if (size === 'small') tier = r2 < 75 ? 'common' : 'uncommon';
    else if (size === 'medium') tier = r2 < 35 ? 'common' : r2 < 85 ? 'uncommon' : 'rare';
    else tier = r2 < 75 ? 'uncommon' : 'rare';
    const goldChance = size === 'small' ? 50 : size === 'medium' ? 35 : 50;
    const goldAmt = size === 'small' ? g.rng.range(23, 27) : size === 'medium' ? g.rng.range(45, 55) : g.rng.range(68, 82);
    const hasGold = g.rng.int(100) < goldChance;
    const empty = g.hasRelic('nloths_hungry_face');
    if (empty) g.removeRelic('nloths_hungry_face');

    const items = [];
    if (!empty) {
      items.push({ type: 'relic', tier: tier });
      if ((g.relicCounters.matryoshka || 0) > 0) { items.push({ type: 'relic', tier: tier }); g.relicCounters.matryoshka--; }
      if (hasGold) items.push({ type: 'gold', amount: goldAmt });
      if (g.hasRelic('cursed_key')) items.push({ type: 'curse' });
    }
    const names = { small: '小宝箱', medium: '中宝箱', large: '大宝箱' };
    function render() {
      const body = el('div', 'reward-list');
      if (!items.length) body.appendChild(el('p', 'center', empty ? '宝箱里空空如也……' : '你已拿走了所有东西。'));
      items.forEach((r) => {
        const item = el('div', 'reward-item' + (r.done ? ' done' : ''));
        let ico = '💎', txt = '遗物';
        if (r.type === 'gold') { ico = '🪙'; txt = r.amount + ' 金币'; }
        if (r.type === 'curse') { ico = '🌑'; txt = '诅咒钥匙的代价'; }
        item.innerHTML = '<div class="reward-ico">' + ico + '</div><div class="reward-txt"><b>' + txt + '</b></div>';
        item.addEventListener('click', () => {
          if (r.done) return;
          if (r.type === 'gold') g.gainGold(r.amount);
          else if (r.type === 'relic') g.gainRandomRelic(r.tier);
          else if (r.type === 'curse') {
            const curses = Object.keys(S.cards).filter((id) => S.cards[id].type === 'curse' && !S.cards[id].noRemove);
            g.addCardToDeck(g.rng.pick(curses));
          }
          r.done = true;
          UI.renderTop();
          render();
        });
        body.appendChild(item);
      });
      UI.panel('🎁 ' + names[size], '', [{
        label: '离开', center: true,
        onClick: () => { UI.closePanel(); UI.show('map'); UI.renderMap(); }
      }]);
      $('#ov-body').innerHTML = '';
      $('#ov-body').appendChild(body);
    }
    render();
  };

  /* ================= 营火 ================= */
  UI.showRest = function () {
    const g = S.game;
    const heal = Math.floor(g.pc.maxHp * 0.3) + (g.hasRelic('regal_pillow') ? 15 : 0);
    const opts = [];
    if (!g.hasRelic('coffee_dripper')) {
      opts.push({
        label: '🔥 休息', sub: '恢复 ' + heal + ' 点生命',
        onClick: () => { g.healPlayer(heal); finish(); }
      });
    }
    if (!g.hasRelic('fusion_hammer')) {
      opts.push({
        label: '⚒️ 锻造', sub: '升级一张卡牌',
        onClick: async () => { const c = await g.upgradeCardUI(); if (c) { UI.toast('升级了 ' + c); finish(); } }
      });
    }
    if (g.hasRelic('girya') && (g.relicCounters.girya || 0) < 3) {
      opts.push({
        label: '🏋️ 锻炼', sub: '永久获得 1 点力量（剩余 ' + (3 - (g.relicCounters.girya || 0)) + ' 次）',
        onClick: () => { g.relicCounters.girya = (g.relicCounters.girya || 0) + 1; g.flags.giryaStr = (g.flags.giryaStr || 0) + 1; UI.toast('力量永久 +1'); finish(); }
      });
    }
    if (g.hasRelic('shovel')) {
      opts.push({ label: '⛏️ 挖掘', sub: '获得一个随机遗物', onClick: () => { g.gainRandomRelic(); finish(); } });
    }
    if (g.hasRelic('peace_pipe')) {
      opts.push({ label: '🚬 吸烟', sub: '移除一张卡牌', onClick: async () => { const c = await g.removeCardUI(); if (c) { UI.toast('移除了 ' + c); finish(); } } });
    }
    if (g.hasRelic('dream_catcher')) {
      opts.push({ label: '🕸️ 做梦', sub: '休息并获得一张卡牌', onClick: async () => { g.healPlayer(heal); await UI.cardRewardPick(g.makeCardReward(null)); finish(); } });
    }
    if (g.hasRelic('eternal_feather')) {
      const n = Math.floor(g.deck.length / 5) * 3;
      opts.push({ label: '🪶 永恒之羽', sub: '恢复 ' + n + ' 点生命（自动）', disabled: true });
      g.healPlayer(n);
    }
    UI.panel('🏕️ 营火', '<p class="center">篝火温暖而安静，你可以在这里稍作休整。</p>', opts.concat([
      { label: '直接离开', center: true, onClick: () => finish() }
    ]));
    function finish() {
      g.triggerRelics('onRest', null);
      UI.closePanel();
      UI.show('map');
      UI.renderMap();
    }
  };

  /* ================= 事件 ================= */
  UI.showEvent = function (evt) {
    const g = S.game;
    g.eventRepeat = false;
    function render() {
      const opts = evt.options(g).map((o) => ({
        label: o.label, sub: o.sub, disabled: o.disabled,
        onClick: async () => {
          UI.closePanel();
          let res = null;
          try { res = await o.act(g); } catch (e) { console.error(e); }
          UI.renderTop();
          if (res === null || res === undefined) {
            // 由事件自己接管（例如进入战斗）
            if (!g.combat) { /* nothing */ }
            return;
          }
          const repeat = g.eventRepeat;
          g.eventRepeat = false;
          UI.panel(evt.art + ' ' + evt.name, '<p>' + res + '</p>',
            repeat ? evt.options(g).map((o2) => ({
              label: o2.label, sub: o2.sub, disabled: o2.disabled,
              onClick: async () => { UI.closePanel(); const r2 = await o2.act(g); UI.renderTop(); if (r2) { UI.panel(evt.art + ' ' + evt.name, '<p>' + r2 + '</p>', [{ label: '离开', center: true, onClick: leave }]); } else leave(); }
            })).concat([{ label: '离开', center: true, onClick: leave }])
              : [{ label: '离开', center: true, onClick: leave }]);
        }
      }));
      UI.panel(evt.art + ' ' + evt.name, '<p>' + evt.text(g) + '</p>', opts);
    }
    function leave() { UI.closePanel(); UI.show('map'); UI.renderMap(); }
    render();
  };

  /* ================= 商店 ================= */
  UI.showShop = function () {
    const g = S.game;
    if (g.hasRelic('meal_ticket')) g.healPlayer(15);
    if (!g.shopStock || g.shopFloor !== g.floor) {
      g.shopStock = makeShop(g);
      g.shopFloor = g.floor;
    }
    render();

    function priceMul() {
      let m = 1;
      if (g.hasRelic('membership_card')) m *= 0.5;
      if (g.hasRelic('the_courier')) m *= 0.8;
      return m;
    }
    function render() {
      const st = g.shopStock;
      const wrap = el('div', 'shop-wrap');
      // 卡牌
      const s1 = el('div', 'shop-sec');
      s1.appendChild(el('h4', null, '卡牌'));
      const cardBox = el('div', 'shop-cards');
      st.cards.forEach((it) => {
        const price = Math.max(1, Math.round(it.price * priceMul()));
        const slot = el('div', 'shop-slot' + (it.bought ? ' bought' : (g.gold < price ? ' poor' : '')));
        const holder = el('div', 'cv-card pick');
        holder.style.width = 'var(--card-w)'; holder.style.height = 'var(--card-h)';
        holder.appendChild(UI.cardEl(it.card, { noPreview: true }));
        slot.appendChild(holder);
        slot.appendChild(el('div', 'price', '🪙 ' + price));
        slot.addEventListener('click', () => {
          if (it.bought || g.gold < price) return;
          g.spendGold(price); g.flags.mawBankDead = true;
          g.addCardToDeck(it.card.id, it.card.upg);
          it.bought = true;
          UI.toast('购买了 ' + S.cardName(it.card));
          render();
        });
        cardBox.appendChild(slot);
      });
      s1.appendChild(cardBox);
      wrap.appendChild(s1);
      // 遗物
      const s2 = el('div', 'shop-sec');
      s2.appendChild(el('h4', null, '遗物'));
      const rBox = el('div', 'shop-items');
      st.relics.forEach((it) => {
        const price = Math.max(1, Math.round(it.price * priceMul()));
        const d = S.relics[it.id];
        const item = el('div', 'shop-item' + (it.bought ? ' bought' : ''));
        item.innerHTML = '<div class="si-ico">' + d.icon + '</div><div class="si-name">' + d.name + '</div><div class="si-price">🪙 ' + price + '</div>';
        item.setAttribute('data-tip', UI.relicTip(it.id));
        if (it.bought) item.style.opacity = '.25';
        item.addEventListener('click', () => {
          if (it.bought || g.gold < price) { if (g.gold < price) UI.toast('金币不足'); return; }
          g.spendGold(price); g.flags.mawBankDead = true;
          g.gainRelic(it.id);
          it.bought = true;
          render();
        });
        rBox.appendChild(item);
      });
      s2.appendChild(rBox);
      wrap.appendChild(s2);
      // 药水
      const s3 = el('div', 'shop-sec');
      s3.appendChild(el('h4', null, '药水'));
      const pBox = el('div', 'shop-items');
      st.potions.forEach((it) => {
        const price = Math.max(1, Math.round(it.price * priceMul()));
        const d = S.potions[it.id];
        const item = el('div', 'shop-item' + (it.bought ? ' bought' : ''));
        item.innerHTML = '<div class="si-ico">' + d.icon + '</div><div class="si-name">' + d.name + '</div><div class="si-price">🪙 ' + price + '</div>';
        item.setAttribute('data-tip', UI.potionTip(it.id));
        if (it.bought) item.style.opacity = '.25';
        item.addEventListener('click', () => {
          if (it.bought || g.gold < price) { if (g.gold < price) UI.toast('金币不足'); return; }
          if (g.potions.length >= g.potionSlots) { UI.toast('药水栏已满'); return; }
          g.spendGold(price); g.flags.mawBankDead = true;
          g.gainPotion(it.id);
          it.bought = true;
          render();
        });
        pBox.appendChild(item);
      });
      s3.appendChild(pBox);
      wrap.appendChild(s3);
      // 移除卡牌
      const removePrice = g.hasRelic('smiling_mask') ? 50 : (75 + 25 * g.removeCount);
      const s4 = el('div', 'shop-sec');
      s4.appendChild(el('h4', null, '服务'));
      const svc = el('div', 'shop-items');
      const rm = el('div', 'shop-item');
      rm.innerHTML = '<div class="si-ico">✂️</div><div class="si-name">移除卡牌</div><div class="si-price">🪙 ' + removePrice + '</div>';
      if (st.removed) rm.style.opacity = '.25';
      rm.addEventListener('click', async () => {
        if (st.removed) return;
        if (g.gold < removePrice) { UI.toast('金币不足'); return; }
        UI.closePanel();
        const c = await g.removeCardUI('选择要移除的卡牌');
        if (c) { g.spendGold(removePrice); g.removeCount++; st.removed = true; g.flags.mawBankDead = true; UI.toast('移除了 ' + c); }
        render();
      });
      svc.appendChild(rm);
      s4.appendChild(svc);
      wrap.appendChild(s4);

      UI.panel('🛒 商店', '', [{ label: '离开商店', center: true, onClick: () => { UI.closePanel(); UI.show('map'); UI.renderMap(); } }]);
      $('#ov-body').innerHTML = '';
      $('#ov-body').appendChild(wrap);
    }
  };

  function makeShop(g) {
    const rng = g.rng;
    const price = { common: [45, 55], uncommon: [68, 82], rare: [135, 165] };
    const cpriceCol = { uncommon: [81, 99], rare: [162, 198] };
    const cards = [];
    const used = {};
    function addCard(type, tierForce) {
      let tier = tierForce;
      if (!tier) { const r = rng.int(100); tier = r < 9 ? 'rare' : r < 46 ? 'uncommon' : 'common'; }
      let pool = g.cardPool(type).filter((id) => S.cards[id].rarity === tier && !used[id]);
      if (!pool.length) pool = g.cardPool(type).filter((id) => !used[id]);
      if (!pool.length) return;
      const id = rng.pick(pool);
      used[id] = true;
      const pr = price[S.cards[id].rarity] || price.common;
      cards.push({ card: S.makeCard(id), price: rng.range(pr[0], pr[1]) });
    }
    addCard('attack'); addCard('attack');
    addCard('skill'); addCard('skill');
    addCard('power');
    // 无色
    for (let i = 0; i < 2; i++) {
      const tier = rng.chance(0.7) ? 'uncommon' : 'rare';
      let pool = g.colorlessPool().filter((id) => S.cards[id].rarity === tier && !used[id]);
      if (!pool.length) pool = g.colorlessPool().filter((id) => !used[id]);
      if (!pool.length) continue;
      const id = rng.pick(pool);
      used[id] = true;
      const pr = cpriceCol[S.cards[id].rarity] || cpriceCol.uncommon;
      cards.push({ card: S.makeCard(id), price: rng.range(pr[0], pr[1]) });
    }
    // 遗物
    const relicPrice = { common: [143, 157], uncommon: [238, 262], rare: [285, 315], shop: [143, 157] };
    const relics = [];
    ['common', 'uncommon', 'shop'].forEach((t) => {
      const pool = g.relicPool(t).filter((id) => !relics.some((x) => x.id === id));
      if (!pool.length) return;
      const id = rng.pick(pool);
      const pr = relicPrice[t] || relicPrice.common;
      relics.push({ id: id, price: rng.range(pr[0], pr[1]) });
    });
    // 药水
    const potionPrice = { common: [48, 52], uncommon: [72, 78], rare: [95, 105] };
    const potions = [];
    for (let i = 0; i < 3; i++) {
      const r = rng.int(100);
      const tier = r < 65 ? 'common' : r < 90 ? 'uncommon' : 'rare';
      let pool = g.potionPool().filter((id) => S.potions[id].tier === tier && !potions.some((x) => x.id === id));
      if (!pool.length) pool = g.potionPool();
      const id = rng.pick(pool);
      const pr = potionPrice[S.potions[id].tier] || potionPrice.common;
      potions.push({ id: id, price: rng.range(pr[0], pr[1]) });
    }
    return { cards: cards, relics: relics, potions: potions, removed: false };
  }

  /* ================= 尼奥的祝福（开局） ================= */
  const NEOW_SMALL = [
    { label: '最大生命 +8', act: (g) => g.addMaxHp(8) },
    { label: '获得 100 金币', act: (g) => g.gainGold(100) },
    { label: '移除牌组中的一张卡牌', act: (g) => g.removeCardUI() },
    { label: '转化牌组中的一张卡牌', act: (g) => g.transformCardUI() },
    { label: '升级牌组中的一张卡牌', act: (g) => g.upgradeCardUI() },
    { label: '获得 2 瓶随机药水', act: (g) => { g.gainRandomPotion(); g.gainRandomPotion(); } }
  ];
  const NEOW_MED = [
    { label: '获得一个随机普通遗物', act: (g) => g.gainRandomRelic('common') },
    { label: '从 3 张随机卡牌中选择 1 张', act: async (g) => { await UI.cardRewardPick(g.makeCardReward(null)); } },
    { label: '获得 250 金币', act: (g) => g.gainGold(250) },
    { label: '最大生命 +16', act: (g) => g.addMaxHp(16) }
  ];
  const NEOW_RISK = [
    { label: '获得一个首领遗物', sub: '代价：最大生命 -7', act: async (g) => { g.loseMaxHp(7); await UI.bossRelicPick(); } },
    { label: '获得 350 金币', sub: '代价：获得一个诅咒', act: (g) => { g.gainGold(350); g.addCardToDeck(g.rng.pick(['injury', 'clumsy', 'doubt', 'shame', 'decay', 'regret', 'pain', 'writhe'])); } },
    { label: '移除牌组中的 2 张卡牌', sub: '代价：最大生命 -' + 0, act: async (g) => { await g.removeCardUI(); await g.removeCardUI(); } },
    { label: '获得一个随机稀有遗物', sub: '代价：最大生命 -10', act: async (g) => { g.loseMaxHp(10); g.gainRandomRelic('rare'); } }
  ];

  UI.showNeow = function (onDone) {
    const g = S.game;
    const picks = g.rng.sample(NEOW_SMALL, 2)
      .concat([g.rng.pick(NEOW_MED)])
      .concat([g.rng.pick(NEOW_RISK)]);
    UI.panel('👁️ 尼奥的祝福',
      '<p>“又一个灵魂来到了尖塔之下。”巨大的蓝色身影俯视着你。</p><p style="color:#9d9280">“接受我的赠礼吧，然后去攀登吧。”</p>',
      picks.map((o) => ({
        label: o.label, sub: o.sub,
        onClick: async () => {
          UI.closePanel();
          try { await o.act(g); } catch (e) { console.error(e); }
          g.save();
          UI.renderTop();
          if (onDone) onDone();
        }
      })));
  };

  /* ================= 结算 ================= */
  UI.showGameOver = function (win) {
    const g = S.game;
    const st = S.getStats();
    const html =
      '<p class="center" style="font-size:20px;color:' + (win ? '#ffe08a' : '#e08a7a') + '">' +
      (win ? '你征服了尖塔！' : '你的旅程终止于此……') + '</p>' +
      '<p class="center">角色：' + g.char.name + '　层数：' + g.floor + '　幕：' + (g.act + 1) + '</p>' +
      '<p class="center">金币：' + g.gold + '　牌组：' + g.deck.length + ' 张　遗物：' + g.relics.length + ' 个</p>' +
      '<p class="center" style="color:#8b8171;font-size:12px">种子 ' + g.seedStr + '　·　累计 ' + st.runs + ' 次挑战 / ' + st.wins + ' 次胜利</p>';
    UI.panel(win ? '胜利' : '失败', html, [
      { label: '查看牌组', center: true, onClick: () => UI.showCardList('最终牌组', g.deck) },
      { label: '返回标题', center: true, onClick: () => { UI.closePanel(); location.reload(); } }
    ]);
  };
})();
