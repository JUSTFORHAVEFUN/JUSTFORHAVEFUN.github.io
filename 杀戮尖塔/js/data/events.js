/* ================= events.js · 事件房间 ================= */
(function () {
  'use strict';
  const S = window.STS, EV = S.defEvent;

  /* ============ 第一幕 ============ */
  EV('big_fish', {
    name: '大鱼', acts: [1], art: '🐟',
    text: () => '你在一条湍急的溪流边停下，三样东西漂在水面上：一根香蕉、一个甜甜圈，还有一个被绳子紧紧捆住的木箱。',
    options: (g) => [
      {
        label: '香蕉', sub: '恢复 ' + Math.floor(g.pc.maxHp / 3) + ' 点生命',
        act: (g) => { g.healPlayer(Math.floor(g.pc.maxHp / 3)); return '香蕉出乎意料地美味，你感觉伤口愈合了不少。'; }
      },
      {
        label: '甜甜圈', sub: '最大生命 +5',
        act: (g) => { g.addMaxHp(5); return '甜甜圈甜得发腻，但你感到身体更加坚韧了。'; }
      },
      {
        label: '木箱', sub: '获得一个遗物与「悔恨」诅咒',
        act: async (g) => {
          const r = g.gainRandomRelic();
          g.addCardToDeck('regret');
          return '箱子里有一件宝物：' + (r ? r.name : '？') + '。但打开它时，某种阴影钻进了你的牌组。';
        }
      }
    ]
  });

  EV('the_cleric', {
    name: '神职者', acts: [1], art: '🙏',
    text: () => '一位神情慈和的神职者走近你：“旅人，需要我的帮助吗？我的服务需要一点报酬。”',
    options: (g) => [
      {
        label: '治疗（35 金币）', sub: '恢复 25% 最大生命', disabled: g.gold < 35,
        act: (g) => { g.spendGold(35); g.healPlayer(Math.floor(g.pc.maxHp * 0.25)); return '温暖的光辉包裹着你的身体。'; }
      },
      {
        label: '净化（50 金币）', sub: '移除牌组中的一张卡牌', disabled: g.gold < 50,
        act: async (g) => { g.spendGold(50); const c = await g.removeCardUI(); return c ? '「' + c + '」化为尘埃。' : '你改变了主意。'; }
      },
      { label: '离开', act: () => '神职者向你行了一礼，消失在雾中。' }
    ]
  });

  EV('dead_adventurer', {
    name: '死去的冒险者', acts: [1], art: '💀',
    text: () => '一具冒险者的尸体倚在墙边，装备散落一地。空气中弥漫着某种危险的气息……',
    options: (g) => {
      const risk = (g.flags.deadAdvRisk = g.flags.deadAdvRisk || 25);
      return [
        {
          label: '搜寻遗物', sub: risk + '% 概率遭遇精英',
          act: async (g) => {
            if (g.rng.int(100) < g.flags.deadAdvRisk) {
              g.flags.deadAdvRisk = 25;
              g.startFight(g.pickElite(), { reward: true });
              return null;
            }
            g.flags.deadAdvRisk += 25;
            const r = g.gainRandomRelic();
            return '你找到了 ' + (r ? r.name : '一件遗物') + '！还可以继续搜寻……';
          }
        },
        {
          label: '搜寻金币', sub: risk + '% 概率遭遇精英',
          act: async (g) => {
            if (g.rng.int(100) < g.flags.deadAdvRisk) {
              g.flags.deadAdvRisk = 25;
              g.startFight(g.pickElite(), { reward: true });
              return null;
            }
            g.flags.deadAdvRisk += 25;
            const n = g.rng.range(50, 80);
            g.gainGold(n);
            return '你找到了 ' + n + ' 金币！';
          }
        },
        { label: '离开', act: () => { g.flags.deadAdvRisk = 25; return '你决定不惊扰死者。'; } }
      ];
    }
  });

  EV('golden_idol', {
    name: '金色雕像', acts: [1], art: '🏆',
    text: () => '一座纯金的雕像静静地立在祭坛上，仿佛在等待有人将它取走。',
    options: (g) => [
      {
        label: '拿走雕像', sub: '获得金色雕像，但会触发陷阱',
        act: async (g) => {
          g.gainRelic('golden_idol');
          const pick = await S.UI.chooseOption('轰隆——巨石从天花板滚落！', [
            { label: '向前冲刺', sub: '失去 ' + Math.floor(g.pc.maxHp * 0.25) + ' 点生命' },
            { label: '向后跳跃', sub: '最大生命降低 8%' },
            { label: '闪身躲避', sub: '获得 2 张「损伤」诅咒' }
          ]);
          if (pick === 0) { g.damagePlayer(Math.floor(g.pc.maxHp * 0.25)); return '你带着雕像和满身伤痕冲了出去。'; }
          if (pick === 1) { g.loseMaxHp(Math.floor(g.pc.maxHp * 0.08)); return '你狼狈地翻滚出去，身体受了永久的损伤。'; }
          g.addCardToDeck('injury'); g.addCardToDeck('injury');
          return '你侥幸躲过巨石，但恐惧在牌组中留下了痕迹。';
        }
      },
      { label: '离开', act: () => '你压下了贪欲，转身离开。' }
    ]
  });

  EV('wing_statue', {
    name: '飞翼雕像', acts: [1, 2], art: '🕊️',
    text: () => '一座长着翅膀的石像矗立在此，底座上刻着古老的祷文。',
    options: (g) => [
      {
        label: '祈祷', sub: '失去 7 点生命，移除一张卡牌',
        act: async (g) => { g.damagePlayer(7); const c = await g.removeCardUI(); return c ? '「' + c + '」被神明取走了。' : '神明没有回应。'; }
      },
      {
        label: '砸碎它', sub: '获得飞翼靴',
        act: (g) => { g.gainRelic('wing_boots'); return '雕像碎裂，一双羽翼之靴从中掉落。'; }
      },
      { label: '离开', act: () => '你恭敬地绕过雕像。' }
    ]
  });

  EV('ssserpent', {
    name: '蛇', acts: [1, 2], art: '🐍',
    text: () => '“想要金币吗？”一个人形的蛇低声说，“只需要接受我的一点小礼物……”',
    options: (g) => [
      {
        label: '同意', sub: '获得 175 金币与「怀疑」诅咒',
        act: (g) => { g.gainGold(175); g.addCardToDeck('doubt'); return '金币叮当作响，某种怀疑也悄悄扎根。'; }
      },
      { label: '拒绝', act: () => '蛇嘶嘶叫着消失在阴影里。' }
    ]
  });

  EV('living_wall', {
    name: '活墙', acts: [1], art: '🧱',
    text: () => '走廊的尽头，一面墙壁正在缓慢地呼吸。它似乎能改变你携带的东西。',
    options: (g) => [
      { label: '遗忘', sub: '移除一张卡牌', act: async (g) => { const c = await g.removeCardUI(); return c ? '你忘记了「' + c + '」。' : '什么也没发生。'; } },
      { label: '改变', sub: '转化一张卡牌', act: async (g) => { const c = await g.transformCardUI(); return c ? '「' + c + '」变成了别的东西。' : '什么也没发生。'; } },
      { label: '成长', sub: '升级一张卡牌', act: async (g) => { const c = await g.upgradeCardUI(); return c ? '「' + c + '」变强了！' : '什么也没发生。'; } }
    ]
  });

  EV('mushrooms', {
    name: '巨大蘑菇', acts: [1], art: '🍄',
    text: () => '一片巨大的蘑菇丛拦住了道路，它们似乎在缓慢地移动……',
    options: (g) => [
      {
        label: '战斗', sub: '击败真菌兽，获得奇怪的蘑菇',
        act: (g) => {
          g.startFight({ name: '真菌兽群', enemies: ['fungi_beast', 'fungi_beast', 'fungi_beast'] }, { relic: 'odd_mushroom', reward: true });
          return null;
        }
      },
      {
        label: '食用', sub: '恢复 25% 生命，获得「寄生虫」',
        act: (g) => { g.healPlayer(Math.floor(g.pc.maxHp * 0.25)); g.addCardToDeck('parasite'); return '味道不错……但有什么东西在你体内蠕动。'; }
      }
    ]
  });

  EV('scrap_ooze', {
    name: '废料软泥', acts: [1, 2], art: '🟤',
    text: () => '一团粘稠的软泥中似乎埋着什么金属物件。伸手进去可能会受伤。',
    options: (g) => {
      const chance = (g.flags.oozeChance = g.flags.oozeChance || 25);
      return [
        {
          label: '伸手进去', sub: '失去 3~5 点生命，' + chance + '% 概率获得遗物',
          act: async (g) => {
            g.damagePlayer(g.rng.range(3, 5));
            if (g.rng.int(100) < g.flags.oozeChance) {
              g.flags.oozeChance = 25;
              const r = g.gainRandomRelic();
              return '你摸到了 ' + (r ? r.name : '一件遗物') + '！';
            }
            g.flags.oozeChance += 10;
            g.eventRepeat = true;
            return '只有黏液……也许再试一次？';
          }
        },
        { label: '离开', act: (g) => { g.flags.oozeChance = 25; return '你擦掉手上的黏液离开了。'; } }
      ];
    }
  });

  EV('shining_light', {
    name: '闪光', acts: [1, 2], art: '💡',
    text: () => '前方的洞窟中射出刺目的光芒，靠近它似乎会带来痛苦与启示。',
    options: (g) => [
      {
        label: '进入光中', sub: '失去 ' + Math.floor(g.pc.maxHp * 0.2) + ' 点生命，随机升级 2 张卡牌',
        act: (g) => { g.damagePlayer(Math.floor(g.pc.maxHp * 0.2)); const n = g.upgradeRandom(null, 2); return '灼热的光穿透你的身体，' + n + ' 张卡牌得到了升华。'; }
      },
      { label: '离开', act: () => '你遮住眼睛退了回去。' }
    ]
  });

  EV('world_of_goop', {
    name: '黏液世界', acts: [1], art: '🟡',
    text: () => '地面上布满金色的黏液，里面似乎混着不少金币。',
    options: (g) => [
      {
        label: '捡起金币', sub: '失去 11 点生命，获得 75 金币',
        act: (g) => { g.damagePlayer(11); g.gainGold(75); return '黏液腐蚀着你的皮肤，但金币是真的。'; }
      },
      {
        label: '离开', sub: '失去 ' + Math.min(g.gold, 35) + ' 金币',
        act: (g) => { const n = Math.min(g.gold, 35); g.spendGold(n); return '黏液粘走了你的一些金币。'; }
      }
    ]
  });

  EV('bonfire_spirits', {
    name: '篝火精灵', acts: [1, 2, 3], art: '🔥',
    text: () => '一群小小的精灵围着篝火跳舞。它们似乎想要你献上一张卡牌。',
    options: (g) => [
      {
        label: '献上一张卡牌', sub: '根据卡牌稀有度获得奖励',
        act: async (g) => {
          const c = await g.removeCardUI('选择要献祭的卡牌');
          if (!c) return '精灵们失望地散去了。';
          const rar = g.lastRemovedRarity;
          if (rar === 'basic' || rar === 'special') { g.healPlayer(5); return '火焰吞下了「' + c + '」，你恢复了少量生命。'; }
          if (rar === 'common') { g.healPlayer(Math.floor(g.pc.maxHp * 0.25)); return '火焰高涨，你恢复了 25% 生命。'; }
          if (rar === 'uncommon') { g.pc.hp = g.pc.maxHp; return '火焰爆发，你的生命完全恢复！'; }
          g.addMaxHp(10); g.pc.hp = g.pc.maxHp;
          return '一道金色的火柱升起，你的最大生命提高了 10 点并完全恢复！';
        }
      },
      { label: '离开', act: () => '你没有可以割舍的东西。' }
    ]
  });

  /* ============ 通用神龛 ============ */
  EV('match_and_keep', {
    name: '记忆游戏', acts: [1], art: '🃏',
    text: () => '一个神秘的身影摆开一排卡牌：“找出配对的两张，它们就归你了。”',
    options: (g) => [
      {
        label: '开始游戏', sub: '获得 1~2 张随机卡牌',
        act: (g) => {
          const n = g.rng.range(1, 2);
          const names = [];
          for (let i = 0; i < n; i++) { const id = g.rng.pick(g.cardPool(null, true)); g.addCardToDeck(id); names.push(S.cards[id].name); }
          return '你配对成功，获得了：' + names.join('、');
        }
      },
      { label: '离开', act: () => '你对赌博不感兴趣。' }
    ]
  });
  EV('purification_shrine', {
    name: '净化神龛', acts: [1, 2, 3], art: '⛩️',
    text: () => '一座朴素的神龛，能够洗去你的负担。',
    options: () => [
      { label: '净化', sub: '移除一张卡牌', act: async (g) => { const c = await g.removeCardUI(); return c ? '「' + c + '」被净化了。' : '你没有选择。'; } },
      { label: '离开', act: () => '你向神龛鞠了一躬。' }
    ]
  });
  EV('upgrade_shrine', {
    name: '铁匠神龛', acts: [1, 2, 3], art: '⚒️',
    text: () => '锻炉中的火焰依旧炽热，仿佛在等待被锤炼的钢铁。',
    options: () => [
      { label: '锻造', sub: '升级一张卡牌', act: async (g) => { const c = await g.upgradeCardUI(); return c ? '「' + c + '」被强化了！' : '你没有选择。'; } },
      { label: '离开', act: () => '你离开了锻炉。' }
    ]
  });
  EV('transmogrifier', {
    name: '变形神龛', acts: [1, 2, 3], art: '🌀',
    text: () => '一团扭曲的能量在神龛中翻涌，它能把一样东西变成另一样。',
    options: () => [
      { label: '转化', sub: '转化一张卡牌', act: async (g) => { const c = await g.transformCardUI(); return c ? '「' + c + '」被彻底改变了。' : '你没有选择。'; } },
      { label: '离开', act: () => '你不想被改变。' }
    ]
  });
  EV('duplicator', {
    name: '复制神龛', acts: [2, 3], art: '👥',
    text: () => '神龛前的镜子会映出你携带的一切——并让它成真。',
    options: () => [
      { label: '祈祷', sub: '复制一张卡牌', act: async (g) => { const c = await g.duplicateCardUI(); return c ? '你获得了第二张「' + c + '」。' : '镜面归于平静。'; } },
      { label: '离开', act: () => '你避开了镜子。' }
    ]
  });
  EV('golden_shrine', {
    name: '金色神龛', acts: [1, 2, 3], art: '🪙',
    text: () => '神龛上堆满了金币，但取走它们似乎需要代价。',
    options: () => [
      { label: '祈祷', sub: '获得 100 金币', act: (g) => { g.gainGold(100); return '金币落入你的口袋。'; } },
      { label: '亵渎', sub: '获得 275 金币与「后悔」诅咒', act: (g) => { g.gainGold(275); g.addCardToDeck('regret'); return '你带走了所有金币，也带走了神明的怒火。'; } },
      { label: '离开', act: () => '你不为所动。' }
    ]
  });
  EV('lab', {
    name: '实验室', acts: [1, 2, 3], art: '⚗️',
    text: () => '一间废弃的炼金实验室，架子上还留着几瓶完好的药水。',
    options: () => [
      {
        label: '搜寻', sub: '获得 3 瓶随机药水',
        act: (g) => { const names = []; for (let i = 0; i < 3; i++) { const p = g.gainRandomPotion(); if (p) names.push(p.name); } return '你找到了：' + (names.join('、') || '什么都没有（药水栏已满）'); }
      }
    ]
  });
  EV('fountain_of_cleansing', {
    name: '净化喷泉', acts: [1, 2, 3], art: '⛲', requires: (g) => g.deck.some((c) => S.cards[c.id].type === 'curse'),
    text: () => '一座清澈的喷泉在此涌动，泉水散发着圣洁的气息。',
    options: () => [
      {
        label: '饮下泉水', sub: '移除牌组中所有诅咒',
        act: (g) => { const n = g.removeAllCurses(); return n ? '你洗净了 ' + n + ' 个诅咒。' : '你身上并没有诅咒。'; }
      },
      { label: '离开', act: () => '你没有痛饮的心情。' }
    ]
  });
  EV('woman_in_blue', {
    name: '蓝衣女子', acts: [1, 2, 3], art: '🧕',
    text: () => '“药水，最好的药水。”蓝衣女子摊开她的货摊。',
    options: (g) => [
      { label: '买 1 瓶药水（20 金币）', disabled: g.gold < 20, act: (g) => { g.spendGold(20); const p = g.gainRandomPotion(); return '你买下了 ' + (p ? p.name : '一瓶药水') + '。'; } },
      { label: '买 2 瓶药水（30 金币）', disabled: g.gold < 30, act: (g) => { g.spendGold(30); const a = g.gainRandomPotion(), b = g.gainRandomPotion(); return '你买下了 2 瓶药水。'; } },
      { label: '买 3 瓶药水（40 金币）', disabled: g.gold < 40, act: (g) => { g.spendGold(40); for (let i = 0; i < 3; i++) g.gainRandomPotion(); return '你买下了 3 瓶药水。'; } },
      { label: '离开', act: () => '你摇了摇头。' }
    ]
  });
  EV('knowing_skull', {
    name: '会说话的骷髅', acts: [2], art: '💀',
    text: () => '“问吧，”骷髅咧嘴笑道，“不过每个答案都要用生命来付。”',
    options: (g) => {
      const cost = (g.flags.skullCost = g.flags.skullCost || 6);
      return [
        { label: '要一瓶药水', sub: '失去 ' + cost + ' 点生命', disabled: g.pc.hp <= cost, act: (g) => { g.damagePlayer(g.flags.skullCost); g.flags.skullCost += 1; g.gainRandomPotion(); g.eventRepeat = true; return '骷髅吐出一瓶药水。'; } },
        { label: '要金币', sub: '失去 ' + cost + ' 点生命', disabled: g.pc.hp <= cost, act: (g) => { g.damagePlayer(g.flags.skullCost); g.flags.skullCost += 1; g.gainGold(90); g.eventRepeat = true; return '骷髅吐出 90 金币。'; } },
        { label: '要一张卡牌', sub: '失去 ' + cost + ' 点生命', disabled: g.pc.hp <= cost, act: (g) => { g.damagePlayer(g.flags.skullCost); g.flags.skullCost += 1; const id = g.rng.pick(g.cardPool(null, true)); g.addCardToDeck(id); g.eventRepeat = true; return '骷髅递给你一张「' + S.cards[id].name + '」。'; } },
        { label: '离开', sub: '获得一个遗物', act: (g) => { g.flags.skullCost = 6; const r = g.gainRandomRelic(); return '骷髅大笑：“聪明！”并给了你 ' + (r ? r.name : '一件遗物') + '。'; } }
      ];
    }
  });

  /* ============ 第二幕 ============ */
  EV('the_library', {
    name: '图书馆', acts: [2], art: '📚',
    text: () => '一座巨大的图书馆，书架高不见顶。你也可以在这里好好休息一下。',
    options: () => [
      {
        label: '阅读', sub: '从 20 张卡牌中选择 1 张',
        act: async (g) => {
          const ids = g.rng.sample(g.cardPool(null, true), 20);
          const c = await g.pickCardFromList(ids, '选择一张卡牌带走');
          return c ? '你抄录下了「' + c + '」。' : '你什么也没找到。';
        }
      },
      { label: '睡觉', sub: '恢复 33% 最大生命', act: (g) => { g.healPlayer(Math.floor(g.pc.maxHp / 3)); return '你在书堆里睡了个好觉。'; } }
    ]
  });
  EV('cursed_tome', {
    name: '诅咒之书', acts: [2], art: '📕',
    text: () => '一本用锁链缠住的厚重典籍摆在讲台上，书页间渗出黑色的雾气。',
    options: () => [
      {
        label: '阅读', sub: '失去大量生命，获得死灵之书',
        act: (g) => {
          const dmg = 1 + 2 + 3 + (g.pc.maxHp >= 40 ? 10 : 5);
          g.damagePlayer(dmg);
          g.gainRelic('necronomicon');
          g.addCardToDeck('necronomicurse');
          return '你读完了最后一页，代价是 ' + dmg + ' 点生命与一个无法摆脱的诅咒。';
        }
      },
      { label: '离开', act: () => '你合上了书。' }
    ]
  });
  EV('forgotten_altar', {
    name: '被遗忘的祭坛', acts: [2], art: '🗿',
    text: () => '一座沾满干涸血迹的祭坛，似乎渴望着某种献祭。',
    options: (g) => [
      {
        label: '献祭', sub: '失去 25% 最大生命，获得血腥雕像',
        act: (g) => { g.loseMaxHp(Math.floor(g.pc.maxHp * 0.25)); g.gainRelic('bloody_idol'); return '祭坛满意地接受了你的血肉。'; }
      },
      {
        label: '亵渎', sub: '获得「腐朽」诅咒',
        act: (g) => { g.addCardToDeck('decay'); return '你砸碎了祭坛，某种东西缠上了你。'; }
      },
      { label: '离开', act: () => '你不想惹麻烦。' }
    ]
  });
  EV('masked_bandits', {
    name: '蒙面强盗', acts: [2], art: '🎭',
    text: () => '三个蒙面强盗跳了出来：“把钱交出来！”',
    options: (g) => [
      { label: '战斗', sub: '击败他们并获得红面具', act: (g) => { g.startFight({ name: '蒙面强盗', enemies: ['mugger', 'mugger', 'mugger'] }, { relic: 'red_mask', reward: true }); return null; } },
      { label: '交出全部金币', sub: '失去所有金币', act: (g) => { const n = g.gold; g.spendGold(n); return '你失去了 ' + n + ' 金币，但保住了性命。'; } }
    ]
  });
  EV('nest', {
    name: '巢穴', acts: [2], art: '🕳️',
    text: () => '一群戴着兜帽的信徒围着某种东西低声吟唱。',
    options: () => [
      { label: '抢夺后逃跑', sub: '获得 50~99 金币', act: (g) => { const n = g.rng.range(50, 99); g.gainGold(n); return '你抓起金币逃走了（+' + n + '）。'; } },
      { label: '坐下聆听', sub: '失去 6 点生命，获得仪式匕首', act: (g) => { g.damagePlayer(6); g.addCardToDeck('ritual_dagger'); return '你割开手掌，加入了他们的仪式。'; } }
    ]
  });
  EV('vampires', {
    name: '吸血鬼', acts: [2], art: '🧛',
    text: () => '“加入我们吧，”苍白的身影低语，“你的打击将变得永恒。”',
    options: (g) => [
      {
        label: '接受', sub: '失去 30% 最大生命，所有「打击」变为「咬」',
            act: (g) => {
          if (!g.hasRelic('blood_vial')) g.loseMaxHp(Math.floor(g.pc.maxHp * 0.3));
          else { g.removeRelic('blood_vial'); }
          const n = g.replaceStrikes('bite');
          return n + ' 张「打击」变成了「咬」。';
        }
      },
      { label: '拒绝', sub: '获得「悔恨」诅咒', act: (g) => { g.addCardToDeck('regret'); return '你逃离了他们，但心中充满悔意。'; } }
    ]
  });
  EV('beggar', {
    name: '乞丐', acts: [2], art: '🥣',
    text: () => '“行行好吧，”蜷缩在角落的乞丐说，“我可以帮你除掉一些烦恼。”',
    options: (g) => [
      { label: '给 75 金币', sub: '移除一张卡牌', disabled: g.gold < 75, act: async (g) => { g.spendGold(75); const c = await g.removeCardUI(); return c ? '乞丐拿走了「' + c + '」。' : '乞丐只拿走了钱。'; } },
      { label: '离开', act: () => '你径直走过。' }
    ]
  });
  EV('council_of_ghosts', {
    name: '幽灵议会', acts: [2], art: '👻',
    text: () => '半透明的身影们围成一圈：“成为我们的一员吧，你将不再受肉体所困。”',
    options: (g) => [
      {
        label: '接受', sub: '最大生命减半，获得 5 张「幻影」',
        act: (g) => { g.loseMaxHp(Math.floor(g.pc.maxHp * 0.5)); for (let i = 0; i < 5; i++) g.addCardToDeck('apparition'); return '你的身体变得虚幻，牌组中出现了 5 张「幻影」。'; }
      },
      { label: '拒绝', act: () => '你还想继续做个活人。' }
    ]
  });

  /* ============ 第三幕 ============ */
  EV('falling', {
    name: '坠落', acts: [3], art: '🕳️',
    text: () => '你脚下的石板突然塌陷，为了保住性命，你必须丢下一些东西。',
    options: (g) => [
      { label: '丢下一张卡牌', sub: '移除牌组中一张牌', act: async (g) => { const c = await g.removeCardUI('选择要丢下的卡牌'); return c ? '「' + c + '」消失在深渊中。' : '你什么也没丢。'; } }
    ]
  });
  EV('mind_bloom', {
    name: '心灵绽放', acts: [3], art: '🌸',
    text: () => '一朵散发幻光的花朵在此绽放，它似乎能实现你的愿望。',
    options: (g) => [
      { label: '战斗！', sub: '与第一幕的首领战斗，获得稀有遗物', act: (g) => { g.startFight(g.rng.pick(S.ACTS[0].bosses), { reward: true, relicTier: 'rare' }); return null; } },
      { label: '我要财富', sub: '获得 999 金币与 2 个诅咒', act: (g) => { g.gainGold(999); g.addCardToDeck('normality'); g.addCardToDeck('doubt'); return '金山出现在你面前，代价是灵魂的重量。'; } },
      { label: '我要力量', sub: '升级所有卡牌，最大生命减少 ' + Math.floor(g.pc.maxHp * 0.1), act: (g) => { g.upgradeAll(); g.loseMaxHp(Math.floor(g.pc.maxHp * 0.1)); return '你的所有卡牌都被强化了！'; } }
    ]
  });
  EV('moai_head', {
    name: '摩艾头像', acts: [3], art: '🗿',
    text: () => '一颗巨大的石头脑袋张着嘴，里面似乎通向别处。',
    options: (g) => [
      { label: '跳进去', sub: '恢复所有生命，最大生命降低 ' + Math.floor(g.pc.maxHp * 0.1), act: (g) => { g.loseMaxHp(Math.floor(g.pc.maxHp * 0.1)); g.pc.hp = g.pc.maxHp; return '你从另一侧掉出来，浑身舒畅却略显虚弱。'; } },
      { label: '献上金色雕像', sub: '获得 333 金币', disabled: !g.hasRelic('golden_idol'), act: (g) => { g.removeRelic('golden_idol'); g.gainGold(333); return '石像吞下雕像，吐出了成堆的金币。'; } },
      { label: '离开', act: () => '你绕过了石像。' }
    ]
  });
  EV('mysterious_sphere', {
    name: '神秘球体', acts: [3], art: '🔮',
    text: () => '一个漂浮的金属球体缓缓旋转，内部似乎封着什么。',
    options: () => [
      { label: '打开它', sub: '与 2 个法球行者战斗，获得稀有遗物', act: (g) => { g.startFight({ name: '法球行者', enemies: ['orb_walker', 'orb_walker'] }, { reward: true, relicTier: 'rare' }); return null; } },
      { label: '离开', act: () => '你决定不要好奇。' }
    ]
  });
  EV('winding_halls', {
    name: '蜿蜒长廊', acts: [3], art: '🌀',
    text: () => '走廊仿佛没有尽头，理智在其中逐渐消磨。',
    options: (g) => [
      { label: '拥抱疯狂', sub: '获得 2 张「疯狂」，失去 ' + Math.floor(g.pc.maxHp * 0.05) + ' 点生命', act: (g) => { g.addCardToDeck('madness'); g.addCardToDeck('madness'); g.damagePlayer(Math.floor(g.pc.maxHp * 0.05)); return '你在低语中前行。'; } },
      { label: '专注前行', sub: '恢复 ' + Math.floor(g.pc.maxHp * 0.25) + ' 点生命，最大生命 -' + Math.floor(g.pc.maxHp * 0.08), act: (g) => { g.healPlayer(Math.floor(g.pc.maxHp * 0.25)); g.loseMaxHp(Math.floor(g.pc.maxHp * 0.08)); return '你压下杂念，伤势好转但身体虚弱。'; } },
      { label: '原路返回', sub: '失去 ' + Math.floor(g.pc.maxHp * 0.1) + ' 点生命', act: (g) => { g.damagePlayer(Math.floor(g.pc.maxHp * 0.1)); return '你退了回来，白费了力气。'; } }
    ]
  });
  EV('sensory_stone', {
    name: '感官石', acts: [3], art: '💠',
    text: () => '一块水晶石漂浮着，触碰它似乎会让你回忆起不属于自己的记忆。',
    options: (g) => [
      { label: '回忆 1 段记忆', sub: '获得 1 张无色牌，失去 ' + Math.floor(g.pc.maxHp * 0.05) + ' 点生命', act: (g) => { g.damagePlayer(Math.floor(g.pc.maxHp * 0.05)); const id = g.rng.pick(g.colorlessPool()); g.addCardToDeck(id); return '你获得了「' + S.cards[id].name + '」。'; } },
      { label: '回忆 2 段记忆', sub: '获得 2 张无色牌，失去 ' + Math.floor(g.pc.maxHp * 0.1) + ' 点生命', act: (g) => { g.damagePlayer(Math.floor(g.pc.maxHp * 0.1)); const a = g.rng.sample(g.colorlessPool(), 2); a.forEach((id) => g.addCardToDeck(id)); return '你获得了 2 张无色牌。'; } },
      { label: '离开', act: () => '你把手收了回来。' }
    ]
  });
  EV('wheel_of_change', {
    name: '命运之轮', acts: [3], art: '☸️',
    text: () => '一个巨大的轮盘缓缓转动，上面刻着六种命运。',
    options: () => [
      {
        label: '转动轮盘',
        act: (g) => {
          const r = g.rng.int(6);
          if (r === 0) { const n = 100 + g.act * 50; g.gainGold(n); return '轮盘指向金币：+' + n + '。'; }
          if (r === 1) { const rel = g.gainRandomRelic(); return '轮盘指向遗物：' + (rel ? rel.name : '？') + '。'; }
          if (r === 2) { const c = g.removeRandomCard(); return '轮盘指向净化：「' + c + '」被移除。'; }
          if (r === 3) { g.pc.hp = g.pc.maxHp; return '轮盘指向治疗：你的生命完全恢复。'; }
          if (r === 4) { g.addCardToDeck('decay'); return '轮盘指向诅咒：你获得了「腐朽」。'; }
          g.damagePlayer(Math.floor(g.pc.maxHp * 0.1));
          return '轮盘指向伤害：你受到了打击。';
        }
      }
    ]
  });
  EV('secret_portal', {
    name: '秘密传送门', acts: [3], art: '🌀',
    text: () => '空气中裂开一道缝隙，似乎可以直接通往尖塔顶端。',
    options: () => [
      { label: '进入传送门', sub: '立刻前往首领', act: (g) => { g.jumpToBoss(); return null; } },
      { label: '离开', act: () => '你不信任这种捷径。' }
    ]
  });
  EV('designer', {
    name: '设计师', acts: [2, 3], art: '🎨',
    text: () => '“我可以为你重新设计牌组，”神秘的身影说，“当然，要收费。”',
    options: (g) => [
      { label: '升级一张卡牌（40 金币）', disabled: g.gold < 40, act: async (g) => { g.spendGold(40); const c = await g.upgradeCardUI(); return c ? '「' + c + '」被重新设计。' : '你改变了主意。'; } },
      { label: '移除一张卡牌（60 金币）', disabled: g.gold < 60, act: async (g) => { g.spendGold(60); const c = await g.removeCardUI(); return c ? '「' + c + '」被删除。' : '你改变了主意。'; } },
      { label: '转化一张卡牌（75 金币）', disabled: g.gold < 75, act: async (g) => { g.spendGold(75); const c = await g.transformCardUI(); return c ? '「' + c + '」被重构。' : '你改变了主意。'; } },
      { label: '离开', act: () => '你付不起这个价。' }
    ]
  });
  EV('note_for_yourself', {
    name: '给自己的笔记', acts: [2, 3], art: '📝',
    text: () => '地上有一张写给“未来的你”的字条，旁边放着一张卡牌。',
    options: (g) => [
      { label: '交换一张卡牌', sub: '用牌组中一张牌换一张随机牌', act: async (g) => { const c = await g.removeCardUI('选择要交换出去的卡牌'); if (!c) return '你什么也没做。'; const id = g.rng.pick(g.cardPool(null, true)); g.addCardToDeck(id); return '你用「' + c + '」换到了「' + S.cards[id].name + '」。'; } },
      { label: '离开', act: () => '你收起了字条。' }
    ]
  });
  EV('the_joust', {
    name: '比武大会', acts: [2], art: '🐎',
    text: () => '斗兽场中正在举行一场骑士比武，赌注已经开出。',
    options: (g) => [
      { label: '押平民（50 金币，赔率 7:1）', disabled: g.gold < 50, act: (g) => { g.spendGold(50); if (g.rng.chance(0.3)) { g.gainGold(350); return '平民出人意料地赢了！你获得 350 金币。'; } return '平民被一击落马，你输掉了赌注。'; } },
      { label: '押勇士（50 金币，赔率 2:1）', disabled: g.gold < 50, act: (g) => { g.spendGold(50); if (g.rng.chance(0.7)) { g.gainGold(100); return '勇士轻松取胜，你获得 100 金币。'; } return '勇士意外落败，你输掉了赌注。'; } },
      { label: '离开', act: () => '你对流血游戏不感兴趣。' }
    ]
  });
})();
