/* ================= map.js · 地图生成 ================= */
(function () {
  'use strict';
  const S = window.STS;

  const ROWS = 15, COLS = 7, PATHS = 6;

  const T = { MONSTER: 'monster', ELITE: 'elite', EVENT: 'event', REST: 'rest', SHOP: 'shop', TREASURE: 'treasure', BOSS: 'boss' };
  S.NODE = T;
  S.NODE_ICON = {
    monster: '👾', elite: '🔥', event: '❓', rest: '🏕️', shop: '🛒', treasure: '🎁', boss: '💀'
  };
  S.NODE_NAME = {
    monster: '敌人', elite: '精英', event: '未知', rest: '营火', shop: '商店', treasure: '宝箱', boss: '首领'
  };

  function key(r, c) { return r + ',' + c; }

  S.genMap = function (rng, actIndex) {
    /* ---- 第四幕：固定的三层线性路线 ---- */
    if (actIndex === 3) {
      const mk = (r, c, t) => ({ row: r, col: c, id: r + ',' + c, type: t, next: [], prev: [], visited: false, x: 300, y: 0 });
      const n1 = mk(0, 3, T.ELITE), n2 = mk(1, 3, T.REST);
      const bs = { row: 2, col: 3, id: 'boss', type: T.BOSS, next: [], prev: [], visited: false, x: 300, y: 60 };
      n1.next = [n2]; n2.prev = [n1]; n2.next = [bs]; bs.prev = [n2];
      n1.y = 300; n2.y = 180; bs.y = 60;
      const nodes = {}; nodes[n1.id] = n1; nodes[n2.id] = n2;
      return { rows: [[n1], [n2]], nodes: nodes, boss: bs, width: 600, height: 380, act: actIndex };
    }
    const nodes = {};
    const rows = [];
    for (let r = 0; r < ROWS; r++) rows.push([]);

    function getNode(r, c) {
      const k = key(r, c);
      if (!nodes[k]) {
        const n = { row: r, col: c, id: k, type: null, next: [], prev: [], visited: false };
        nodes[k] = n;
        rows[r].push(n);
      }
      return nodes[k];
    }

    /* --- 生成 6 条路径 --- */
    const starts = [];
    for (let p = 0; p < PATHS; p++) {
      let c;
      if (p === 0) c = rng.int(COLS);
      else if (p === 1) {
        // 保证至少两个不同起点
        do { c = rng.int(COLS); } while (c === starts[0] && PATHS > 1);
      } else c = rng.int(COLS);
      starts.push(c);
      let cur = getNode(0, c);
      for (let r = 0; r < ROWS - 1; r++) {
        const options = [];
        for (let d = -1; d <= 1; d++) {
          const nc = cur.col + d;
          if (nc < 0 || nc >= COLS) continue;
          options.push(nc);
        }
        // 防止连线交叉：若左右邻居已有交叉边则剔除
        const filtered = options.filter((nc) => {
          if (nc === cur.col) return true;
          const side = nc > cur.col ? cur.col + 1 : cur.col - 1;
          const sideNode = nodes[key(r, side)];
          if (sideNode) {
            // 若相邻节点已经有一条指向 cur.col 的边，则会交叉
            if (sideNode.next.some((x) => x.col === cur.col)) return false;
          }
          return true;
        });
        const pick = (filtered.length ? filtered : options)[rng.int((filtered.length ? filtered : options).length)];
        const nxt = getNode(r + 1, pick);
        if (cur.next.indexOf(nxt) < 0) { cur.next.push(nxt); nxt.prev.push(cur); }
        cur = nxt;
      }
    }
    rows.forEach((rw) => rw.sort((a, b) => a.col - b.col));

    /* --- 分配房间类型 --- */
    const W = [
      { t: T.MONSTER, w: 45 }, { t: T.EVENT, w: 22 }, { t: T.ELITE, w: 16 },
      { t: T.REST, w: 12 }, { t: T.SHOP, w: 5 }
    ];
    function weighted() {
      const tot = W.reduce((a, b) => a + b.w, 0);
      let r = rng.next() * tot;
      for (const x of W) { r -= x.w; if (r <= 0) return x.t; }
      return T.MONSTER;
    }
    function invalid(n, t) {
      // 前 5 层不出现精英 / 营火
      if ((t === T.ELITE || t === T.REST) && n.row < 5) return true;
      // 营火不出现在倒数第二层
      if (t === T.REST && n.row === ROWS - 2) return true;
      // 与父节点同类型的特殊房间不重复
      const bad = [T.REST, T.SHOP, T.ELITE];
      if (bad.indexOf(t) >= 0) {
        for (const p of n.prev) if (p.type === t) return true;
        // 同一父节点的兄弟不重复
        for (const p of n.prev) for (const s of p.next) if (s !== n && s.type === t) return true;
      }
      return false;
    }
    rows.forEach((rw, r) => {
      rw.forEach((n) => {
        if (r === 0) { n.type = T.MONSTER; return; }
        if (r === 8) { n.type = T.TREASURE; return; }
        if (r === ROWS - 1) { n.type = T.REST; return; }
        let t, guard = 0;
        do { t = weighted(); guard++; } while (invalid(n, t) && guard < 40);
        if (guard >= 40) t = T.MONSTER;
        n.type = t;
      });
    });

    /* --- 首领节点 --- */
    const boss = { row: ROWS, col: 3, id: 'boss', type: T.BOSS, next: [], prev: [], visited: false };
    rows[ROWS - 1].forEach((n) => { n.next.push(boss); boss.prev.push(n); });

    /* --- 坐标 --- */
    const CW = 84, RH = 92, PAD = 46;
    Object.keys(nodes).forEach((k) => {
      const n = nodes[k];
      n.x = PAD + n.col * CW + (rng.next() * 22 - 11);
      n.y = PAD + (ROWS - n.row) * RH + (rng.next() * 14 - 7);
    });
    boss.x = PAD + 3 * CW;
    boss.y = PAD - 6;

    return {
      rows: rows, nodes: nodes, boss: boss,
      width: PAD * 2 + (COLS - 1) * CW,
      height: PAD * 2 + ROWS * RH,
      act: actIndex
    };
  };

  /** 当前可前往的节点 */
  S.availableNodes = function (map, curNode) {
    if (!curNode) return map.rows[0].slice();
    return curNode.next.slice();
  };
})();
