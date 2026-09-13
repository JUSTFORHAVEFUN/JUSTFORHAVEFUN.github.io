/* ================= ui_card.js · 卡牌渲染 / 选牌 / 提示 ================= */
(function () {
  'use strict';
  const S = window.STS;
  const UI = (S.UI = S.UI || {});
  const el = S.el, $ = S.$;

  const TYPE_NAME = { attack: '攻击', skill: '技能', power: '能力', status: '状态', curse: '诅咒' };

  /* ---------------- 数值预览 ---------------- */
  function fmt(cur, baseline) {
    if (baseline === undefined || cur === baseline) return '<b>' + cur + '</b>';
    if (cur > baseline) return '<b class="up">' + cur + '</b>';
    return '<u>' + cur + '</u>';
  }
  UI.previewer = function (card, cmb) {
    const def = S.cards[card.id], v = S.cardVals(card), base = def.base || {};
    const g = cmb && !cmb.over ? cmb : null;
    return {
      g: g, v: v,
      d: (k) => fmt(g ? g.preview(v[k]) : v[k], base[k]),
      b: (k) => fmt(g ? g.previewBlock(v[k]) : v[k], base[k]),
      n: (k) => fmt(v[k], base[k]),
      dn: (val) => fmt(g ? g.preview(val) : val),
      bn: (val) => fmt(g ? g.previewBlock(val) : val),
      raw: (k) => v[k],
      heavyBlade: (vv) => vv.dmg + (g ? g.getPower(g.player, 'strength') * (vv.mult - 1) : 0),
      perfected: (vv) => {
        let n = 0;
        if (g) n = g.deckAll().concat(g.exhaustPile).filter((x) => S.cards[x.id].name.indexOf('打击') >= 0).length;
        else if (S.game) n = S.game.deck.filter((x) => S.cards[x.id].name.indexOf('打击') >= 0).length;
        return vv.dmg + n * vv.per;
      }
    };
  };

  /* ---------------- 卡牌 DOM ---------------- */
  UI.cardEl = function (card, opts) {
    opts = opts || {};
    const def = S.cards[card.id];
    const cmb = opts.cmb || (S.game && S.game.combat && !S.game.combat.over ? S.game.combat : null);
    const p = UI.previewer(card, opts.noPreview ? null : cmb);
    const v = p.v;
    const cost = cmb ? cmb.cost(card) : S.cardCost(card);
    const wrap = el('div', 'card ' + def.type + (card.upg ? ' upgraded' : ''));
    if (def.unplayable) wrap.classList.add('unplayable');

    if (cost !== -2) {
      const cs = el('div', 'card-cost' + (cost === 0 ? ' free' : '') + (cost === 'X' ? ' x' : ''), String(cost));
      wrap.appendChild(cs);
    }
    wrap.appendChild(el('div', 'card-name', S.esc(S.cardName(card))));
    wrap.appendChild(el('div', 'card-art', def.art || '✦'));
    wrap.appendChild(el('div', 'card-type', TYPE_NAME[def.type] || ''));
    let txt = '';
    try { txt = def.desc ? def.desc(v, p, card) : ''; } catch (e) { txt = '(描述错误)'; console.error(card.id, e); }
    wrap.appendChild(el('div', 'card-text', txt));

    const badges = [];
    if (cmb ? cmb.cardHas(card, 'exhaust') : (def.exhaust || card.exhaust)) badges.push('消耗');
    if (cmb ? cmb.cardHas(card, 'ethereal') : def.ethereal) badges.push('灵魂虚体');
    if (cmb ? cmb.cardHas(card, 'innate') : def.innate) badges.push('天生');
    if (cmb ? cmb.cardHas(card, 'retain') : def.retain) badges.push('保留');
    if (def.counter) badges.push('反制');
    if (card.phantom || def.phantom) badges.push('幻影');
    if (badges.length) wrap.appendChild(el('div', 'card-badges', badges.join(' · ')));
    return wrap;
  };

  /* ---------------- 选牌界面 ---------------- */
  let pendingChoose = null;
  UI.chooseCards = function (cmb, opts) {
    return new Promise((resolve) => {
      const box = $('#cardview');
      const grid = $('#cv-grid');
      const foot = $('#cv-foot');
      const list = opts.from.slice();
      const need = opts.n || 1;
      const chosen = [];
      const allowDup = !!opts.allowDuplicate;
      const cancellable = opts.cancellable !== false;   // 默认可取消（手机友好）
      $('#cv-title').textContent = opts.prompt || '选择卡牌';
      $('#cv-sub').innerHTML = opts.upTo ? ('最多选择 ' + need + ' 张（已选 <b>0</b>）') : ('选择 ' + need + ' 张');
      $('#cv-close').classList.toggle('hidden', !(cancellable && (opts.canSkip || !opts.mustPick)));
      grid.innerHTML = '';
      foot.innerHTML = '';
      if (opts.deckView) list.sort(sortDeck);

      const cells = [];
      const countEls = new Map(); // 重复计数角标（仅 allowDuplicate 时）
      list.forEach((c) => {
        const holder = el('div', 'cv-card pick');
        if (allowDup) {
          const cnt = el('div', 'cv-count', '0');
          holder.style.position = 'relative';
          holder.appendChild(cnt);
          countEls.set(holder, cnt);
        }
        holder.appendChild(UI.cardEl(c, { cmb: cmb }));
        holder.addEventListener('click', () => {
          if (allowDup) {
            if (chosen.length >= need) return;                 // 已选满
            chosen.push(c);
            holder.classList.add('chosen');
            const cnt = countEls.get(holder);
            cnt.textContent = String(chosen.filter((x) => x === c).length);
          } else {
            const i = chosen.indexOf(c);
            if (i >= 0) { chosen.splice(i, 1); holder.classList.remove('chosen'); }
            else {
              if (chosen.length >= need) {
                if (need === 1) { chosen.length = 0; cells.forEach((x) => x.classList.remove('chosen')); }
                else return;
              }
              chosen.push(c); holder.classList.add('chosen');
            }
          }
          update();
          if (!opts.upTo && chosen.length >= need) setTimeout(done, 130);
        });
        cells.push(holder);
        grid.appendChild(holder);
      });

      const btn = el('button', 'big-btn', '确定');
      btn.addEventListener('click', done);
      const ckBtn = el('button', 'big-btn ghost', '清空已选');
      ckBtn.addEventListener('click', () => {
        chosen.length = 0;
        cells.forEach((x) => { x.classList.remove('chosen'); if (countEls.has(x)) countEls.get(x).textContent = '0'; });
        update();
      });
      if (opts.upTo || need > 1) {
        foot.appendChild(btn);
        // 多选时可一键清空已选（尤其适用于 allowDuplicate 重复选牌，方便取消）
        if (allowDup || need > 1) foot.appendChild(ckBtn);
      }
      if (opts.canSkip) {
        const sk = el('button', 'big-btn ghost', '跳过');
        sk.addEventListener('click', () => { chosen.length = 0; done(); });
        foot.appendChild(sk);
      }
      // 统一取消按钮：任何可取消的选卡界面都能点此退出（手机无键盘也能用）
      if (cancellable && (opts.canSkip || !opts.mustPick)) {
        const cxl = el('button', 'big-btn ghost', '取消');
        cxl.addEventListener('click', cancel);
        foot.appendChild(cxl);
      }

      function update() {
        const selected = chosen.length;
        $('#cv-sub').innerHTML = opts.upTo
          ? ('最多选择 ' + need + ' 张（已选 <b>' + selected + '</b>）')
          : ('选择 ' + need + ' 张（已选 <b>' + selected + '</b>）');
        btn.disabled = opts.mustPick && selected === 0;
        ckBtn.disabled = selected === 0;
      }
      function done() {
        if (opts.mustPick && chosen.length === 0) return;
        box.classList.add('hidden');
        pendingChoose = null;
        resolve(chosen.slice());
      }
      function cancel() {
        chosen.length = 0;
        box.classList.add('hidden');
        pendingChoose = null;
        resolve(chosen.slice());   // 解析为空 = 取消
      }
      pendingChoose = done;
      $('#cv-close').onclick = () => { if (cancellable && (opts.canSkip || !opts.mustPick)) cancel(); };
      update();
      box.classList.remove('hidden');
    });
  };

  function rarityOrder(r) { return { basic: 0, common: 1, uncommon: 2, rare: 3, special: 4 }[r] || 5; }
  function typeOrder(t) { return { attack: 0, skill: 1, power: 2, status: 3, curse: 4 }[t] || 5; }
  function sortDeck(a, b) {
    const da = S.cards[a.id], db = S.cards[b.id];
    if (typeOrder(da.type) !== typeOrder(db.type)) return typeOrder(da.type) - typeOrder(db.type);
    if (rarityOrder(da.rarity) !== rarityOrder(db.rarity)) return rarityOrder(da.rarity) - rarityOrder(db.rarity);
    return da.order - db.order;
  }
  UI.sortDeck = sortDeck;

  /* ---------------- 只读卡牌列表 ---------------- */
  UI.showCardList = function (title, cards, sub) {
    const box = $('#cardview');
    const grid = $('#cv-grid');
    $('#cv-title').textContent = title;
    $('#cv-sub').textContent = sub || (cards.length + ' 张');
    $('#cv-close').classList.remove('hidden');
    $('#cv-foot').innerHTML = '';
    grid.innerHTML = '';
    const list = cards.slice().sort(sortDeck);
    list.forEach((c) => {
      const holder = el('div', 'cv-card');
      holder.appendChild(UI.cardEl(c, { noPreview: !S.game.combat }));
      grid.appendChild(holder);
    });
    $('#cv-close').onclick = () => box.classList.add('hidden');
    box.classList.remove('hidden');
  };
  UI.closeCardView = function () { $('#cardview').classList.add('hidden'); };

  /* ---------------- 牌组管理：导出 / 导入 ---------------- */
  function encodeDeck(deck) {
    return deck.map((c) => c.id + (c.id && c.upg ? '+' : '')).join(' ');
  }
  /** 解析字符串为卡牌 id 列表。支持 "strike strike+ defend" 或用逗号/换行分隔。 */
  function parseDeck(str) {
    const tokens = String(str || '').split(/[\s,，、;；\n\r]+/).filter(Boolean);
    const out = [];
    const known = Object.keys(S.cards);
    tokens.forEach((t) => {
      let id = t, upg = 0;
      if (t.endsWith('+') || t.endsWith('＋')) { id = t.slice(0, -1); upg = 1; }
      if (!known.includes(id)) return; // 忽略未知卡牌
      out.push({ id: id, upg: upg });
    });
    return out;
  }
  UI.encodeDeck = encodeDeck;
  UI.parseDeck = parseDeck;

  UI.showDeckManager = function () {
    const g = S.game;
    if (!g) return;
    const box = $('#cardview');
    const grid = $('#cv-grid');
    const foot = $('#cv-foot');
    $('#cv-title').textContent = '牌组（' + g.deck.length + ' 张）';
    $('#cv-sub').textContent = '点击卡牌可查看';
    $('#cv-close').classList.remove('hidden');
    foot.innerHTML = '';

    function renderDeck() {
      grid.innerHTML = '';
      const list = g.deck.slice().sort(sortDeck);
      list.forEach((c) => {
        const holder = el('div', 'cv-card');
        holder.appendChild(UI.cardEl(c, { noPreview: !S.game.combat }));
        grid.appendChild(holder);
      });
    }
    function renderButtons() {
      foot.innerHTML = '';
      const exp = el('button', 'big-btn', '📋 导出卡组字符串');
      exp.addEventListener('click', () => {
        const code = encodeDeck(g.deck);
        UI.panel('导出卡组', '<p style="color:#cfc8ba;font-family:monospace;word-break:break-all;line-height:1.6">' + S.esc(code) + '</p>' +
          '<p style="color:#8b8171;font-size:12px;margin-top:8px">复制这段字符串，可在其他局导入。</p>',
          [{ label: '复制', center: true, onClick: () => { try { navigator.clipboard.writeText(code).then(() => UI.toast('已复制')).catch(() => {}); } catch (e) {} UI.closePanel(); } },
           { label: '关闭', center: true, onClick: () => UI.closePanel() }]);
      });
      const imp = el('button', 'big-btn ghost', '⌨️ 导入卡组');
      imp.addEventListener('click', () => {
        UI.panel('导入卡组',
          '<p>粘贴卡组字符串（例如：<code>strike strike+ defend bash</code>）。导入将<u>替换</u>当前牌组。</p>' +
          '<textarea id="deck-import-input" rows="5" style="width:100%;box-sizing:border-box;background:#1a1714;color:#efe7d4;border:1px solid #3a322a;border-radius:8px;padding:8px;font-family:monospace;font-size:12px"></textarea>',
          [{ label: '替换卡组', center: true, onClick: () => {
            const inp = document.getElementById('deck-import-input');
            const items = parseDeck(inp ? inp.value : '');
            if (!items.length) { UI.toast('没有解析到任何卡牌'); return; }
            const built = items.map((x) => S.makeCard(x.id, x.upg)).filter(Boolean);
            if (built.length !== items.length) { UI.toast('部分卡牌无法创建'); return; }
            g.deck = built;
            g.save(); UI.renderTop();
            UI.closePanel();
            UI.toast('已导入卡组：' + built.length + ' 张');
            renderDeck();
            renderButtons();
            $('#cv-title').textContent = '牌组（' + g.deck.length + ' 张）';
          } },
           { label: '取消', center: true, onClick: () => UI.closePanel() }]);
      });
      foot.appendChild(exp);
      foot.appendChild(imp);
      $('#cv-close').onclick = () => box.classList.add('hidden');
    }
    renderDeck();
    renderButtons();
    box.classList.remove('hidden');
  };

  /* ---------------- 通用弹层 ---------------- */
  UI.panel = function (title, bodyHtml, actions, opts) {
    opts = opts || {};
    const ov = $('#overlay');
    $('#ov-title').innerHTML = title;
    $('#ov-body').innerHTML = bodyHtml || '';
    const act = $('#ov-actions');
    act.innerHTML = '';
    (actions || []).forEach((a) => {
      const b = el('button', 'ov-btn' + (a.center ? ' center' : ''));
      b.innerHTML = S.esc(a.label) + (a.sub ? '<span class="ob-sub">' + a.sub + '</span>' : '');
      if (a.disabled) b.disabled = true;
      b.addEventListener('click', () => { if (!a.disabled) a.onClick(); });
      act.appendChild(b);
    });
    ov.classList.remove('hidden');
    return ov;
  };
  UI.closePanel = function () { $('#overlay').classList.add('hidden'); };

  UI.chooseOption = function (text, options) {
    return new Promise((resolve) => {
      UI.panel('选择', '<p>' + text + '</p>', options.map((o, i) => ({
        label: o.label, sub: o.sub, disabled: o.disabled,
        onClick: () => { UI.closePanel(); resolve(i); }
      })));
    });
  };

  /* ---------------- 工具提示 ---------------- */
  const tip = () => $('#tooltip');
  function showTip(html, x, y) {
    const t = tip();
    t.innerHTML = html;
    t.classList.remove('hidden');
    const w = t.offsetWidth, h = t.offsetHeight;
    let px = x + 16, py = y + 10;
    if (px + w > window.innerWidth - 8) px = x - w - 16;
    if (py + h > window.innerHeight - 8) py = window.innerHeight - h - 8;
    if (py < 4) py = 4;
    t.style.left = px + 'px';
    t.style.top = py + 'px';
  }
  UI.hideTip = function () { tip().classList.add('hidden'); };
  UI.bindTips = function () {
    document.addEventListener('mousemove', (e) => {
      const target = e.target.closest && e.target.closest('[data-tip],.kw');
      if (!target) { UI.hideTip(); return; }
      let html = target.getAttribute('data-tip');
      if (!html) {
        const kw = target.textContent.trim();
        const d = S.KEYWORDS[kw];
        if (!d) { UI.hideTip(); return; }
        html = '<h5>' + kw + '</h5>' + d;
      }
      showTip(html, e.clientX, e.clientY);
    });
    document.addEventListener('mouseleave', UI.hideTip);
  };

  UI.relicTip = function (id) {
    const d = S.relics[id];
    if (!d) return '';
    const tierName = { starter: '初始', common: '普通', uncommon: '罕见', rare: '稀有', boss: '首领', shop: '商店', event: '事件' }[d.tier] || '';
    let s = '<h5>' + d.name + ' <span style="color:#8b8171;font-size:11px">[' + tierName + ']</span></h5>' + d.desc;
    if (d.counter !== undefined && S.game) {
      s += '<div class="tt-kw">计数：' + (S.game.relicCounters[id] || 0) + ' / ' + d.counter + '</div>';
    }
    if (d.flavor) s += '<div class="tt-flavor">' + d.flavor + '</div>';
    return s;
  };
  UI.powerTip = function (id, n) {
    const d = S.powers[id];
    if (!d) return '';
    return '<h5>' + d.name + (d.noStack ? '' : ' ' + n) + '</h5>' + d.desc(n);
  };
  UI.potionTip = function (id) {
    const d = S.potions[id];
    if (!d) return '';
    const m = S.game && S.game.hasRelic('sacred_bark') ? 2 : 1;
    const tierName = { common: '普通', uncommon: '罕见', rare: '稀有' }[d.tier] || '';
    return '<h5>' + d.name + ' <span style="color:#8b8171;font-size:11px">[' + tierName + ']</span></h5>' + d.desc(m);
  };
})();
