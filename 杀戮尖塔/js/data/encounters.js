/* ================= encounters.js · 遭遇表 & 幕定义 ================= */
(function () {
  'use strict';
  const S = window.STS;

  const enc = (name, enemies, extra) => Object.assign({ name: name, enemies: enemies }, extra || {});

  S.ACTS = [
    /* ---------------- 第一幕 ---------------- */
    {
      id: 1, name: '第一幕 · 城市之外', short: '城市之外',
      bg: 'linear-gradient(180deg,#1a1f2b 0%,#232a35 45%,#2f2a24 100%)',
      floors: 15,
      weak: [
        enc('信徒', ['cultist']),
        enc('颚虫', ['jaw_worm']),
        enc('两只虱子', ['red_louse', 'green_louse']),
        enc('小史莱姆', ['spike_slime_s', 'acid_slime_m']),
        enc('小史莱姆', ['acid_slime_s', 'spike_slime_m'])
      ],
      strong: [
        enc('哥布林小队', ['fat_gremlin', 'mad_gremlin', 'sneaky_gremlin', 'shield_gremlin']),
        enc('大史莱姆', ['acid_slime_l']),
        enc('大史莱姆', ['spike_slime_l']),
        enc('史莱姆群', ['spike_slime_s', 'spike_slime_s', 'acid_slime_s', 'acid_slime_s', 'spike_slime_s']),
        enc('蓝色奴隶主', ['slaver_blue']),
        enc('红色奴隶主', ['slaver_red']),
        enc('三只虱子', ['red_louse', 'green_louse', 'red_louse']),
        enc('两只真菌兽', ['fungi_beast', 'fungi_beast']),
        enc('恶徒', ['looter', 'slaver_blue']),
        enc('野生生物', ['fungi_beast', 'jaw_worm']),
        enc('掠夺者', ['looter'])
      ],
      elites: [
        enc('哥布林头目', ['gremlin_nob'], { elite: true }),
        enc('拉加维林', ['lagavulin'], { elite: true }),
        enc('三个哨卫', ['sentry', 'sentry', 'sentry'], { elite: true })
      ],
      bosses: [
        enc('守卫者', ['the_guardian'], { boss: true }),
        enc('六火幽鬼', ['hexaghost'], { boss: true }),
        enc('史莱姆之王', ['slime_boss'], { boss: true })
      ]
    },
    /* ---------------- 第二幕 ---------------- */
    {
      id: 2, name: '第二幕 · 城市', short: '城市',
      bg: 'linear-gradient(180deg,#241826 0%,#33202c 45%,#3a2a22 100%)',
      floors: 15,
      weak: [
        enc('球形守卫', ['spheric_guardian']),
        enc('被选中者', ['chosen']),
        enc('带壳寄生虫', ['shelled_parasite']),
        enc('三只鸟怪', ['byrd', 'byrd', 'byrd']),
        enc('两个劫掠者', ['mugger', 'mugger'])
      ],
      strong: [
        enc('被选中者与鸟怪', ['chosen', 'byrd']),
        enc('哨卫与球形守卫', ['sentry', 'spheric_guardian']),
        enc('信徒与被选中者', ['cultist', 'chosen']),
        enc('三个信徒', ['cultist', 'cultist', 'cultist']),
        enc('寄生虫与真菌兽', ['shelled_parasite', 'fungi_beast']),
        enc('蛇颈怪', ['snecko']),
        enc('蛇形植物', ['snake_plant']),
        enc('百夫长与秘术师', ['centurion', 'mystic']),
        enc('四只鸟怪', ['byrd', 'byrd', 'byrd', 'byrd'])
      ],
      elites: [
        enc('哥布林首领', ['gremlin_leader'], { elite: true }),
        enc('奴隶主们', ['slaver_blue', 'taskmaster', 'slaver_red'], { elite: true }),
        enc('穿刺之书', ['book_of_stabbing'], { elite: true })
      ],
      bosses: [
        enc('青铜自动机', ['bronze_automaton'], { boss: true }),
        enc('冠军', ['the_champ'], { boss: true }),
        enc('收藏家', ['the_collector'], { boss: true })
      ]
    },
    /* ---------------- 第三幕 ---------------- */
    {
      id: 3, name: '第三幕 · 深处', short: '深处',
      bg: 'linear-gradient(180deg,#0f1a1c 0%,#1b2b26 45%,#20211c 100%)',
      floors: 15,
      weak: [
        enc('三只暗影兽', ['darkling', 'darkling', 'darkling']),
        enc('法球行者', ['orb_walker']),
        enc('三个形体', ['spiker', 'repulsor', 'exploder']),
        enc('形体与尖刺', ['spiker', 'spiker', 'repulsor'])
      ],
      strong: [
        enc('巨口', ['maw']),
        enc('蠕动之物', ['writhing_mass']),
        enc('短暂之物', ['transient']),
        enc('四个形体', ['spiker', 'repulsor', 'exploder', 'spiker']),
        enc('球体与形体', ['spheric_guardian', 'repulsor', 'spiker']),
        enc('颚虫大军', ['jaw_worm', 'jaw_worm', 'jaw_worm']),
        enc('暗影兽群', ['darkling', 'darkling', 'darkling'])
      ],
      elites: [
        enc('巨大头颅', ['giant_head'], { elite: true }),
        enc('复仇女神', ['nemesis'], { elite: true }),
        enc('蜥蜴法师', ['reptomancer'], { elite: true })
      ],
      bosses: [
        enc('觉醒者', ['awakened_one'], { boss: true }),
        enc('时间吞噬者', ['time_eater'], { boss: true }),
        enc('德卡与多努', ['deca', 'donu'], { boss: true })
      ]
    },
    /* ---------------- 第四幕 ---------------- */
    {
      id: 4, name: '第四幕 · 尖塔之心', short: '尖塔之心',
      bg: 'linear-gradient(180deg,#2a0d12 0%,#3d1218 45%,#170a0c 100%)',
      floors: 3,
      weak: [], strong: [],
      elites: [enc('盾与矛', ['shield_spire', 'spear_spire'], { elite: true })],
      bosses: [enc('腐化之心', ['corrupt_heart'], { boss: true })]
    }
  ];

  /* 战斗金币奖励区间 */
  S.GOLD_REWARD = {
    weak: [10, 20], strong: [15, 25], elite: [25, 35], boss: [95, 105]
  };
})();
