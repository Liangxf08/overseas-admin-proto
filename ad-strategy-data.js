/* 广告策略 · 四页共享数据（字段 / 场景 / 聚合应用 / 策略） */
(function (global) {
  'use strict';

  var KEY = 'hwzt_ad_strategy_v2';
  var CURRENT_USER = '用户A';
  var USERS = Array.from({ length: 8 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var COMPONENT_TYPES = ['数字输入', '文本输入', '开关', '下拉选择', 'Array'];
  var CHILD_COMPONENT_TYPES = ['数字输入', '文本输入', '开关'];
  var AD_TYPES = ['插屏', 'Banner', '开屏', '激励视频'];
  var PLATFORMS = ['Android', 'iOS'];
  var CHANNELS = ['Organic', 'TikTok', 'Facebook', 'Google', 'Unity', 'Apple Search Ads'];
  var USER_TYPES = ['全部', '新用户', '老用户'];
  var COUNTRIES = [
    '美国', '日本', '韩国', '英国', '德国', '法国', '巴西', '墨西哥',
    '印度', '印度尼西亚', '越南', '泰国', '菲律宾', '马来西亚',
    '台湾地区', '香港地区', '沙特阿拉伯', '阿联酋', '澳大利亚', '加拿大'
  ];

  var PRODUCTS = [
    { id: 'ywvt69aoqfdgyti2', name: 'Hotpot Match 3D', platform: 'iOS', packageName: 'com.hotpot.match3d.ios' },
    { id: 'yw1abauttjsdlfid', name: 'Pixel Bounce Jam (解压弹球馆)', platform: 'Android', packageName: 'com.jam.blast.pixel.bounce.puzzle.and' },
    { id: 'ywdazzlejewel001a', name: 'Dazzle Jewel: Color by Number', platform: 'Android', packageName: 'com.dazzle.jewel.an' },
    { id: 'ywbrainsortcard02', name: 'Brain Sort: Card Matching (再闯多一关)', platform: 'iOS', packageName: 'com.brain.sort.card.ios' },
    { id: 'ywtilesort3d0003x', name: 'Tile Sort 3D (王牌分拣师)', platform: 'Android', packageName: 'com.tilesort.puzzle.and' },
    { id: 'ywhagglesleuth04k', name: 'Haggle Sleuth (砍价大侦探)', platform: 'Android', packageName: 'com.haggle.sleuth.and' },
    { id: 'ywperfectcare05as', name: 'Perfect Care: Cleaning ASMR', platform: 'iOS', packageName: 'com.perfect.care.asmr.ios' },
    { id: 'ywstorymatch06pz', name: 'Story Match: Associate Puzzle', platform: 'Android', packageName: 'com.story.match.puzzle.and' },
    { id: 'ywjigwordsearch7w', name: 'Jigword:Word Search Games', platform: 'iOS', packageName: 'com.jigword.search.ios' },
    { id: 'ywcaptainwave08xx', name: '船长先别浪', platform: 'Android', packageName: 'com.captain.dont.wave.and' }
  ];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function nowText() { return formatDateTime(new Date()); }

  function daysAgo(n, h, m) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h || 10, m || 0, 0, 0);
    return formatDateTime(d);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function seedFields() {
    var rows = [
      { id: 'f_iap', name: 'Firebase收入上报比例', key: 'iap_revenue_sdk', componentType: '数字输入', desc: '取值范围[0,1]', min: 0, max: 1 },
      { id: 'f_test', name: '测试字段', key: 'test_field', componentType: 'Array', desc: '', children: [
        { name: '参数Key', key: 'param_key', componentType: '文本输入' },
        { name: '参数值', key: 'param_value', componentType: '文本输入' }
      ] },
      { id: 'f_report', name: '中台日志上报', key: 'woder_report_config', componentType: 'Array', desc: '批量数量、上报间隔(s)', children: [
        { name: '批量数量', key: 'batch_count', componentType: '数字输入' },
        { name: '上报间隔(s)', key: 'interval_sec', componentType: '数字输入' }
      ] },
      { id: 'f_wait', name: '单关停留时长(s)', key: 'online_time', componentType: '数字输入', desc: '停留时长>=n秒则触发广告', min: 0 },
      { id: 'f_pos', name: '广告展示位置', key: 'ad_impression_pos', componentType: '下拉选择', desc: 'Banner、原生广告的对齐方式', options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' }
      ] },
      { id: 'f_banner_short', name: '短屏展示Banner', key: 'ad_banner_short_show', componentType: '开关', desc: '屏幕宽高比>0.5622的手机是否展示Banner' },
      { id: 'f_admob', name: 'AdMob优先', key: 'ad_mob_first', componentType: '开关', desc: '是否强制优先请求AdMob', status: '禁用' },
      { id: 'f_gap_n', name: '关卡展示间隔 (关)', key: 'ad_level_interval', componentType: '数字输入', desc: '间隔 n 关展示一次，如 n=2 则第4关展示后，第7关再展示', min: 0 },
      { id: 'f_start', name: '广告起始关卡', key: 'cur_level', componentType: '数字输入', desc: '从第 n 关(含)开始允许请求广告', min: 1 },
      { id: 'f_gap_sec', name: '广告展示间隔 (秒)', key: 'ad_impression_interval', componentType: '数字输入', desc: '关闭上一次广告后间隔 n 秒才允许再次展示', min: 0 },
      { id: 'f_daily', name: '每日展示上限 (次)', key: 'daily_show_cap', componentType: '数字输入', desc: '单用户单日广告展示上限', min: 0 },
      { id: 'f_session', name: '单局展示上限 (次)', key: 'session_show_cap', componentType: '数字输入', desc: '单局对局内展示上限', min: 0 },
      { id: 'f_cool', name: '冷却时长 (秒)', key: 'cooldown_sec', componentType: '数字输入', desc: '关闭广告后的冷却时间', min: 0 },
      { id: 'f_skip', name: '跳过首次展示', key: 'skip_first', componentType: '开关', desc: '新用户首次进入不展示广告' },
      { id: 'f_rv_cool', name: '激励视频冷却 (秒)', key: 'rv_cooldown', componentType: '数字输入', desc: '激励视频关闭后的冷却时间', min: 0 },
      { id: 'f_banner_refresh', name: 'Banner刷新间隔 (秒)', key: 'banner_refresh_interval', componentType: '数字输入', desc: 'Banner 自动刷新间隔，0 表示不刷新', min: 0 },
      { id: 'f_splash_timeout', name: '开屏超时 (秒)', key: 'splash_timeout', componentType: '数字输入', desc: '开屏广告请求超时时间', min: 1, max: 10 },
      { id: 'f_native', name: '原生广告开关', key: 'native_enable', componentType: '开关', desc: '是否启用原生广告' },
      { id: 'f_fill', name: '广告填充超时 (秒)', key: 'fill_timeout', componentType: '数字输入', desc: '广告填充等待超时', min: 1 },
      { id: 'f_style', name: '广告样式', key: 'ad_style', componentType: '下拉选择', desc: '插屏展示样式', options: [
        { label: '常规', value: 'normal' },
        { label: '沉浸', value: 'immersive' }
      ] },
      { id: 'f_debug', name: '调试模式', key: 'debug_mode', componentType: '开关', desc: '开启后输出广告调试日志', status: '禁用' },
      { id: 'f_sample', name: '上报采样率', key: 'report_sample', componentType: '数字输入', desc: '取值范围[0,1]', min: 0, max: 1 },
      { id: 'f_retry', name: '失败重试次数', key: 'retry_count', componentType: '数字输入', desc: '请求失败后的重试次数', min: 0, max: 5 },
      { id: 'f_user_tag', name: '用户标签', key: 'user_tag', componentType: '文本输入', desc: '用于定向分流的自定义标签' },
      { id: 'f_channel_tag', name: '渠道标识', key: 'channel_flag', componentType: '文本输入', desc: '覆盖默认渠道标识' }
    ];
    return rows.map(function (r, i) {
      r.status = r.status || '启用';
      r.updater = USERS[i % USERS.length];
      r.updatedAt = daysAgo(Math.max(1, 40 - i), 9 + (i % 8), (i * 11) % 60);
      if (r.min == null) r.min = null;
      if (r.max == null) r.max = null;
      r.options = r.options || [];
      r.children = r.children || [];
      r.desc = r.desc || '';
      return r;
    });
  }

  function seedScenes() {
    var inter = ['f_wait', 'f_daily', 'f_start', 'f_gap_sec', 'f_gap_n'];
    return [
      { id: 's_int_replay', name: '插屏-关卡重玩', adType: '插屏', fieldIds: inter.slice(), remark: '重玩关卡时调起插屏', status: '启用', updater: '用户A', updatedAt: daysAgo(30, 10, 0) },
      { id: 's_int_fail', name: '插屏-关卡失败', adType: '插屏', fieldIds: inter.slice(), remark: '关卡失败结算调起', status: '启用', updater: '用户B', updatedAt: daysAgo(29, 11, 20) },
      { id: 's_int_win', name: '插屏-关卡胜利', adType: '插屏', fieldIds: inter.slice(), remark: '关卡胜利结算调起', status: '启用', updater: '用户A', updatedAt: daysAgo(28, 14, 10) },
      { id: 's_ban_enter', name: 'Banner-进入关卡', adType: 'Banner', fieldIds: ['f_start', 'f_daily'], remark: '进入关卡展示 Banner', status: '启用', updater: '用户C', updatedAt: daysAgo(22, 9, 15) },
      { id: 's_open_hot', name: '开屏-热启动', adType: '开屏', fieldIds: ['f_wait', 'f_daily'], remark: '应用热启动开屏', status: '启用', updater: '用户D', updatedAt: daysAgo(16, 16, 40) },
      { id: 's_open_cold', name: '开屏-冷启动', adType: '开屏', fieldIds: ['f_wait', 'f_daily'], remark: '应用冷启动开屏', status: '启用', updater: '用户A', updatedAt: daysAgo(15, 17, 5) },
      { id: 's_rv_revive', name: '激励视频-复活', adType: '激励视频', fieldIds: ['f_daily', 'f_start'], remark: '失败后看广告复活', status: '启用', updater: '用户E', updatedAt: daysAgo(10, 12, 28) }
    ];
  }

  function seedApps() {
    return [
      { id: 'a1', productId: 'ywvt69aoqfdgyti2', sceneIds: ['s_int_replay', 's_int_fail', 's_int_win', 's_ban_enter', 's_open_hot', 's_open_cold'], status: '启用', updater: '用户A', updatedAt: daysAgo(20, 10, 10) },
      { id: 'a2', productId: 'yw1abauttjsdlfid', sceneIds: ['s_int_replay', 's_int_win', 's_ban_enter'], status: '启用', updater: '用户C', updatedAt: daysAgo(18, 11, 0) },
      { id: 'a3', productId: 'ywdazzlejewel001a', sceneIds: ['s_int_replay', 's_int_fail', 's_open_hot', 's_open_cold'], status: '启用', updater: '用户B', updatedAt: daysAgo(14, 15, 22) },
      { id: 'a4', productId: 'ywbrainsortcard02', sceneIds: ['s_int_replay', 's_int_fail', 's_int_win', 's_ban_enter', 's_open_hot', 's_open_cold', 's_rv_revive'], status: '启用', updater: '用户D', updatedAt: daysAgo(12, 9, 48) },
      { id: 'a5', productId: 'ywtilesort3d0003x', sceneIds: ['s_int_replay', 's_int_fail', 's_int_win', 's_rv_revive'], status: '启用', updater: '用户E', updatedAt: daysAgo(9, 13, 6) },
      { id: 'a6', productId: 'ywcaptainwave08xx', sceneIds: ['s_int_replay', 's_int_win', 's_ban_enter', 's_open_hot'], status: '启用', updater: '用户B', updatedAt: daysAgo(6, 16, 33) }
    ];
  }

  function vals(map) { return map; }

  function seedPolicies() {
    return [
      {
        id: 'p1', name: 'Hotpot 胜利插屏-美日实验', productId: 'ywvt69aoqfdgyti2', sceneId: 's_int_win',
        countries: ['美国', '日本'], channels: [], userType: '全部', versions: [],
        priority: 10, status: '启用', updater: '用户A', updatedAt: daysAgo(7, 10, 20),
        splits: [
          { id: 'g1', name: '对照组', percent: 50, values: vals({ f_wait: 3, f_daily: 20, f_start: 3, f_gap_sec: 30, f_gap_n: 2 }) },
          { id: 'g2', name: '实验组', percent: 50, values: vals({ f_wait: 1, f_daily: 30, f_start: 2, f_gap_sec: 15, f_gap_n: 1 }) }
        ]
      },
      {
        id: 'p2', name: 'Hotpot 失败插屏-默认', productId: 'ywvt69aoqfdgyti2', sceneId: 's_int_fail',
        countries: [], channels: [], userType: '全部', versions: [],
        priority: 20, status: '启用', updater: '用户A', updatedAt: daysAgo(6, 11, 8),
        splits: [
          { id: 'g1', name: '默认组', percent: 100, values: vals({ f_wait: 3, f_daily: 15, f_start: 3, f_gap_sec: 30, f_gap_n: 2 }) }
        ]
      },
      {
        id: 'p3', name: 'Brain Sort Banner-新用户', productId: 'ywbrainsortcard02', sceneId: 's_ban_enter',
        countries: [], channels: [], userType: '新用户', versions: [],
        priority: 10, status: '启用', updater: '用户D', updatedAt: daysAgo(5, 14, 42),
        splits: [
          { id: 'g1', name: '对照组', percent: 70, values: vals({ f_start: 3, f_daily: 20 }) },
          { id: 'g2', name: '实验组', percent: 30, values: vals({ f_start: 1, f_daily: 40 }) }
        ]
      },
      {
        id: 'p4', name: 'Tile Sort 重玩-印度分流', productId: 'ywtilesort3d0003x', sceneId: 's_int_replay',
        countries: ['印度'], channels: ['TikTok', 'Google'], userType: '全部', versions: [],
        priority: 15, status: '启用', updater: '用户E', updatedAt: daysAgo(4, 9, 18),
        splits: [
          { id: 'g1', name: '低频', percent: 40, values: vals({ f_wait: 5, f_daily: 10, f_start: 5, f_gap_sec: 45, f_gap_n: 3 }) },
          { id: 'g2', name: '标准', percent: 40, values: vals({ f_wait: 3, f_daily: 20, f_start: 3, f_gap_sec: 30, f_gap_n: 2 }) },
          { id: 'g3', name: '高频', percent: 20, values: vals({ f_wait: 1, f_daily: 40, f_start: 2, f_gap_sec: 10, f_gap_n: 1 }) }
        ]
      },
      {
        id: 'p5', name: 'Dazzle 冷启动开屏', productId: 'ywdazzlejewel001a', sceneId: 's_open_cold',
        countries: [], channels: [], userType: '全部', versions: [],
        priority: 5, status: '启用', updater: '用户B', updatedAt: daysAgo(3, 16, 55),
        splits: [
          { id: 'g1', name: '默认组', percent: 100, values: vals({ f_wait: 2, f_daily: 8 }) }
        ]
      },
      {
        id: 'p6', name: '船长胜利插屏-拉美', productId: 'ywcaptainwave08xx', sceneId: 's_int_win',
        countries: ['巴西', '墨西哥'], channels: ['TikTok'], userType: '老用户', versions: ['1.4.0', '1.5.2'],
        priority: 12, status: '禁用', updater: '用户B', updatedAt: daysAgo(2, 10, 6),
        splits: [
          { id: 'g1', name: '对照组', percent: 50, values: vals({ f_wait: 3, f_daily: 20, f_start: 3, f_gap_sec: 30, f_gap_n: 2 }) },
          { id: 'g2', name: '实验组', percent: 50, values: vals({ f_wait: 2, f_daily: 25, f_start: 2, f_gap_sec: 20, f_gap_n: 1 }) }
        ]
      }
    ];
  }

  function seed() {
    return {
      fields: seedFields(),
      scenes: seedScenes(),
      apps: seedApps(),
      policies: seedPolicies()
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      var data = JSON.parse(raw);
      if (!data || !data.fields || !data.scenes || !data.apps || !data.policies) return seed();
      return data;
    } catch (e) {
      return seed();
    }
  }

  var db = load();

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) { /* ignore quota */ }
  }

  function byUpdatedDesc(a, b) {
    if (a.updatedAt > b.updatedAt) return -1;
    if (a.updatedAt < b.updatedAt) return 1;
    return 0;
  }

  function findById(list, id) {
    return (list || []).find(function (x) { return x.id === id; }) || null;
  }

  function fieldById(id) { return findById(db.fields, id); }
  function sceneById(id) { return findById(db.scenes, id); }
  function appById(id) { return findById(db.apps, id); }
  function policyById(id) { return findById(db.policies, id); }
  function productById(id) { return findById(PRODUCTS, id); }

  function fieldName(id) {
    var f = fieldById(id);
    return f ? f.name : id;
  }

  function sceneName(id) {
    var s = sceneById(id);
    return s ? s.name : id;
  }

  function productName(id) {
    var p = productById(id);
    return p ? p.name : id;
  }

  function isSwitchField(field) {
    return !!(field && field.componentType === '开关');
  }

  function formatFieldValue(field, value) {
    if (!field) return String(value == null ? '' : value);
    if (isSwitchField(field)) return value === true || value === 'true' || value === '是' ? '是' : '否';
    if (field.componentType === '下拉选择' && field.options) {
      var hit = field.options.find(function (o) { return String(o.value) === String(value); });
      if (hit) return hit.label;
    }
    if (value == null || value === '') return '-';
    if (field.componentType === 'Array') return 'Array';
    return String(value);
  }

  function defaultFieldValue(field) {
    if (!field) return '';
    if (isSwitchField(field)) return false;
    if (field.componentType === '下拉选择') {
      return field.options && field.options[0] ? field.options[0].value : '';
    }
    if (field.componentType === 'Array') return [];
    if (field.componentType === '数字输入') return field.min != null ? field.min : 0;
    return '';
  }

  function sceneFieldModels(scene) {
    var ids = (scene && scene.fieldIds) || [];
    return ids.map(fieldById).filter(Boolean);
  }

  function appByProduct(productId) {
    return db.apps.find(function (a) { return a.productId === productId; }) || null;
  }

  function scenesForProduct(productId) {
    var app = appByProduct(productId);
    if (!app) return [];
    return (app.sceneIds || []).map(sceneById).filter(Boolean);
  }

  function fieldUsedByScenes(fieldId) {
    return db.scenes.filter(function (s) {
      return (s.fieldIds || []).indexOf(fieldId) !== -1;
    });
  }

  function sceneUsedByApps(sceneId) {
    return db.apps.filter(function (a) {
      return (a.sceneIds || []).indexOf(sceneId) !== -1;
    });
  }

  function sceneUsedByPolicies(sceneId) {
    return db.policies.filter(function (p) { return p.sceneId === sceneId; });
  }

  function productUsedByPolicies(productId) {
    return db.policies.filter(function (p) { return p.productId === productId; });
  }

  function touch(row) {
    row.updater = CURRENT_USER;
    row.updatedAt = nowText();
    return row;
  }

  function nextId(prefix, list) {
    var max = 0;
    (list || []).forEach(function (x) {
      var m = String(x.id || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return prefix + (max + 1);
  }

  var Store = {
    CURRENT_USER: CURRENT_USER,
    USERS: USERS,
    COMPONENT_TYPES: COMPONENT_TYPES,
    CHILD_COMPONENT_TYPES: CHILD_COMPONENT_TYPES,
    AD_TYPES: AD_TYPES,
    PLATFORMS: PLATFORMS,
    CHANNELS: CHANNELS,
    USER_TYPES: USER_TYPES,
    COUNTRIES: COUNTRIES,
    PRODUCTS: PRODUCTS,
    nowText: nowText,
    formatDateTime: formatDateTime,
    clone: clone,
    persist: persist,
    byUpdatedDesc: byUpdatedDesc,
    fieldById: fieldById,
    sceneById: sceneById,
    appById: appById,
    policyById: policyById,
    productById: productById,
    fieldName: fieldName,
    sceneName: sceneName,
    productName: productName,
    isSwitchField: isSwitchField,
    formatFieldValue: formatFieldValue,
    defaultFieldValue: defaultFieldValue,
    sceneFieldModels: sceneFieldModels,
    appByProduct: appByProduct,
    scenesForProduct: scenesForProduct,
    fieldUsedByScenes: fieldUsedByScenes,
    sceneUsedByApps: sceneUsedByApps,
    sceneUsedByPolicies: sceneUsedByPolicies,
    productUsedByPolicies: productUsedByPolicies,
    touch: touch,
    nextId: nextId,
    fields: function () { return db.fields; },
    scenes: function () { return db.scenes; },
    apps: function () { return db.apps; },
    policies: function () { return db.policies; },
    saveFields: function (list) { db.fields = list; persist(); },
    saveScenes: function (list) { db.scenes = list; persist(); },
    saveApps: function (list) { db.apps = list; persist(); },
    savePolicies: function (list) { db.policies = list; persist(); }
  };

  global.AdStrategyStore = Store;
})(window);
