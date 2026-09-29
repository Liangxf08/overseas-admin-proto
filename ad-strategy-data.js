/* 广告策略 · 四页共享数据（字段 / 场景 / 聚合应用 / 策略） */
(function (global) {
  'use strict';

  var KEY = 'hwzt_ad_strategy_v4';
  var CURRENT_USER = '用户A';
  var USERS = Array.from({ length: 8 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var COMPONENT_TYPES = ['数字输入', '文本输入', '开关', '下拉选择', 'Array'];
  var CHILD_COMPONENT_TYPES = ['数字输入', '文本输入', '开关', '下拉选择'];
  var AD_TYPES = ['插屏', 'Banner', '开屏', '激励视频'];
  var PLATFORMS = ['Android', 'iOS'];
  var CHANNELS = ['Organic', 'TikTok', 'Facebook', 'Google', 'Unity', 'Apple Search Ads'];
  var USER_TYPES = ['全用户', '新用户', '老用户'];
  var APP_VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '1.2.2', '1.3.0', '1.4.0', '1.5.0', '1.5.2', '1.6.0', '2.0.0'];
  var COUNTRIES = [
    'US', 'JP', 'KR', 'GB', 'DE', 'FR', 'BR', 'MX',
    'IN', 'ID', 'VN', 'TH', 'PH', 'MY',
    'TW', 'HK', 'SA', 'AE', 'AU', 'CA'
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
    { id: 'ywcaptainwave08xx', name: '船长先别浪', platform: 'Android', packageName: 'com.captain.dont.wave.and' },
    { id: 'ywgemsmatchart01', name: 'Gems Match: Art Jigsaw', platform: 'Android', packageName: 'com.gems.match.art.jigsaw' },
    { id: 'ywgemloopcolor02', name: 'Gem Loop Match: Coloring Book', platform: 'iOS', packageName: 'com.gem.loop.match.coloring' },
    { id: 'ywjewelblast03xx', name: 'Jewel Blast Puzzle Saga', platform: 'Android', packageName: 'com.jewel.blast.puzzle.saga' },
    { id: 'ywblockpuzzle04a', name: 'Block Puzzle Classic Wood', platform: 'Android', packageName: 'com.block.puzzle.classic.wood' },
    { id: 'ywwaterSort05ios', name: 'Water Sort Puzzle Relax', platform: 'iOS', packageName: 'com.water.sort.puzzle.relax' },
    { id: 'ywmahjongtile06a', name: 'Mahjong Tile Connect Solitaire', platform: 'Android', packageName: 'com.mahjong.tile.connect' },
    { id: 'ywcarparking07xx', name: 'Car Parking Jam Escape', platform: 'Android', packageName: 'com.car.parking.jam.escape' },
    { id: 'ywnumbermatch08i', name: 'Number Match: 2048 Merge', platform: 'iOS', packageName: 'com.number.match.merge2048' },
    { id: 'ywfruitmerge09an', name: 'Fruit Merge Farm Tycoon', platform: 'Android', packageName: 'com.fruit.merge.farm.tycoon' },
    { id: 'ywsudokudaily10x', name: 'Sudoku Daily Challenge', platform: 'iOS', packageName: 'com.sudoku.daily.challenge' },
    { id: 'ywwordcross11and', name: 'Word Cross Search Quest', platform: 'Android', packageName: 'com.word.cross.search.quest' },
    { id: 'ywbubblepop12ios', name: 'Bubble Pop Shooter Fun', platform: 'iOS', packageName: 'com.bubble.pop.shooter.fun' },
    { id: 'ywsolitairekl13a', name: 'Solitaire Klondike Pro', platform: 'Android', packageName: 'com.solitaire.klondike.pro' },
    { id: 'ywjigsawart14ios', name: 'Jigsaw Art Gallery HD', platform: 'iOS', packageName: 'com.jigsaw.art.gallery.hd' },
    { id: 'ywcolorbynum15a', name: 'Color by Number Happy', platform: 'Android', packageName: 'com.color.by.number.happy' },
    { id: 'ywtrafficjam16xx', name: 'Traffic Jam Car Puzzle', platform: 'Android', packageName: 'com.traffic.jam.car.puzzle' },
    { id: 'ywhexasort17ios', name: 'Hexa Sort Color Puzzle', platform: 'iOS', packageName: 'com.hexa.sort.color.puzzle' },
    { id: 'ywballsort18and', name: 'Ball Sort Puzzle Water', platform: 'Android', packageName: 'com.ball.sort.puzzle.water' },
    { id: 'ywdrawpuzzle19i', name: 'Draw Puzzle Brain Test', platform: 'iOS', packageName: 'com.draw.puzzle.brain.test' },
    { id: 'ywfinddiff20and', name: 'Find the Difference Spot', platform: 'Android', packageName: 'com.find.diff.spot.it' },
    { id: 'ywpinball21xxxx', name: 'Pinball Arcade Classic', platform: 'Android', packageName: 'com.pinball.arcade.classic' },
    { id: 'ywknitting22ios', name: 'Knitting ASMR Craft', platform: 'iOS', packageName: 'com.knitting.asmr.craft' },
    { id: 'ywcooking23andr', name: 'Cooking Fever Restaurant', platform: 'Android', packageName: 'com.cooking.fever.restaurant' },
    { id: 'ywgarden24iosxx', name: 'Garden Match Bloom', platform: 'iOS', packageName: 'com.garden.match.bloom' },
    { id: 'ywmonster25andx', name: 'Monster Merge Idle', platform: 'Android', packageName: 'com.monster.merge.idle' },
    { id: 'ywspaceraid26io', name: 'Space Raid Shooter', platform: 'iOS', packageName: 'com.space.raid.shooter' }
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
    var exampleChildren = [
      { name: '文本输入', key: 'demo_text', componentType: '文本输入', placeholder: '请输入' },
      { name: '数字输入', key: 'demo_number', componentType: '数字输入' },
      { name: '开关', key: 'demo_switch', componentType: '开关' },
      { name: '下拉选择', key: 'demo_select', componentType: '下拉选择', options: [
        { label: '选项一', value: 'option_1' },
        { label: '选项二', value: 'option_2' },
        { label: '选项三', value: 'option_3' }
      ] }
    ];
    var rows = [
      { id: 'f_iap', name: 'Firebase内购上报比例', key: 'iap_revenue_sdk', componentType: '数字输入', desc: '取值范围[0,1]', min: 0, max: 1 },
      { id: 'f_test', name: '测试字段-勿删', key: 'test_field', componentType: 'Array', children: exampleChildren },
      { id: 'f_report', name: '中台埋点上报', key: 'woder_report_config', componentType: 'Array', desc: '批量条数, 上报间隔 (秒)', children: exampleChildren },
      { id: 'f_wait', name: '单关停留时长 (秒)', key: 'online_time', componentType: '数字输入', desc: '当前关卡停留时长 ≥ n 秒，触发广告', min: 0 },
      { id: 'f_pad_tb', name: '原生上下边距 (1334px)', key: 'ad_top_bottom_padding', componentType: '数字输入', desc: '原生广告距离顶部或底部的间距（按 1334 尺寸换算）', min: 0 },
      { id: 'f_pad_se', name: '原生左右边距 (750px)', key: 'ad_start_end_padding', componentType: '数字输入', desc: '原生广告左右边距总和（按 750 尺寸等分换算）', min: 0 },
      { id: 'f_pos', name: '广告显示位置', key: 'ad_impression_pos', componentType: '下拉选择', desc: 'BN 和原生广告在游戏中的对齐位置（上/中/下）', options: [
        { label: '上', value: 'top' },
        { label: '中', value: 'center' },
        { label: '下', value: 'bottom' }
      ] },
      { id: 'f_banner_short', name: '短屏手机展示BN', key: 'ad_banner_short_show', componentType: '开关', desc: '宽高比 > 0.5622 的短屏幕手机是否展示 BN 广告' },
      { id: 'f_admob', name: 'AdMob广告优先', key: 'ad_mob_first', componentType: '开关', desc: 'BN 场景强制优先请求并展示 AdMob 广告', status: '禁用' },
      { id: 'f_gap_n', name: '关卡展示间隔 (关)', key: 'ad_level_interval', componentType: '数字输入', desc: '若 n = 2, 第 4 关展示了广告，第 7 关才会再次请求', min: 0 },
      { id: 'f_start', name: '广告起始关卡', key: 'cur_level', componentType: '数字输入', desc: '从第 n 关（含）开始允许请求广告', min: 1 },
      { id: 'f_gap_sec', name: '广告展示间隔 (秒)', key: 'ad_impression_interval', componentType: '数字输入', desc: '距上次广告关闭隔 n 秒方可再次请求（广告关闭时重置计时）', min: 0 },
      { id: 'f_times', name: '广告展示间隔 (次)', key: 'ad_times_interval', componentType: '数字输入', desc: '若 n = 2, 每 3 次展示 1 次（即第1、4、7、10次展示）', min: 0 },
      { id: 'f_total_days', name: '累计活跃天数', key: 'total_active_days', componentType: '数字输入', min: 0 },
      { id: 'f_streak', name: '连续活跃天数', key: 'streak_active_days', componentType: '数字输入', min: 0 },
      { id: 'f_launch', name: '当日启动次数', key: 'launch_times', componentType: '数字输入', desc: '当日 APP 累计启动次数 ≥ n，触发广告', min: 0 },
      { id: 'f_day', name: '安装N天起展示', key: 'ad_day_interval', componentType: '数字输入', desc: '从安装第 n 天（含）起触发广告', min: 0 },
      { id: 'f_daily', name: '每日展示上限 (次)', key: 'ad_daily_limit', componentType: '数字输入', desc: '当日累计广告展示次数 ≥ n，当日不再触发广告', min: 0 },
      { id: 'f_wait_ad', name: '广告等待时长 (秒)', key: 'ad_wait_time', componentType: '数字输入', desc: '广告请求 ≥ n 秒无展示，跳过广告', min: 0 },
      { id: 'f_net', name: '弱网状态弹窗', key: 'sdk_confhg_net_check', componentType: '开关' },
      { id: 'f_apl_churn', name: 'APL老用户切流比例', key: 'applovin_old_user_churn', componentType: '数字输入', desc: 'Applovin老用户分流到多聚合的比例', min: 0, max: 1 },
      { id: 'f_apl_win', name: 'APL新用户窗口期', key: 'campaignid_new_user_day', componentType: 'Array', children: exampleChildren },
      { id: 'f_ver_tip', name: '版本提示公告', key: 'version Tip', componentType: 'Array', status: '禁用', children: exampleChildren },
      { id: 'f_fb_evt', name: 'FB关卡买量事件', key: 'sdk_confg_fb_lv_event', componentType: 'Array', desc: 'fb_level_win_关卡', children: exampleChildren },
      { id: 'f_fb_fire', name: 'Firebase买量事件', key: 'sdk_confg_firebase_event', componentType: 'Array', desc: 'level_win_关卡、purchase_商品', children: exampleChildren },
      { id: 'f_adjust', name: 'Adjust买量事件', key: 'sdk_confg_adjust_event', componentType: 'Array', desc: 'playtime_min_时长、ad_reward_times_次数、purchase_商品ID、level_win_关卡', children: exampleChildren },
      { id: 'f_inter_ctl', name: '插屏全局间隔 (秒)', key: 'sdk_confg_inter_time_ctl', componentType: '文本输入', desc: '参数一 (0:关 / 1:开); 参数二 (间隔秒数)。例: 1:30' },
      { id: 'f_sdk_type', name: '启动聚合类型', key: 'sdk_confg_sdk_type', componentType: '下拉选择', options: [
        { label: 'AppLovin', value: 'applovin' },
        { label: 'MAX', value: 'max' },
        { label: 'AdMob', value: 'admob' },
        { label: '多聚合', value: 'mediation' }
      ] },
      { id: 'f_ad_track', name: '广告展示行为上报', key: 'sdk_confg_ad_track', componentType: '开关', desc: 'SDK_ad_show 事件是否上报数数' },
      { id: 'f_load_track', name: '广告加载事件上报', key: 'sdk_confg_ad_load_track', componentType: '开关', desc: 'SDK_init、SDK_ad_fill 事件是否上报数数' },
      { id: 'f_sdk_log', name: 'SDK日志开关', key: 'sdk_confg_log', componentType: '开关' }
    ];
    return rows.map(function (r, i) {
      r.status = r.status || '启用';
      r.updater = USERS[i % USERS.length];
      r.updatedAt = daysAgo(i + 1, 9 + (i % 8), (i * 11) % 60);
      if (r.min == null) r.min = null;
      if (r.max == null) r.max = null;
      r.options = clone(r.options || []);
      r.desc = r.desc || '';
      r.placeholder = r.placeholder || '';
      r.maxLength = r.maxLength == null ? null : r.maxLength;
      r.onValue = r.onValue || '';
      r.offValue = r.offValue || '';
      r.selectMode = r.componentType === '下拉选择' ? (r.selectMode || '单选') : '';
      r.maxRows = r.componentType === 'Array' && r.maxRows != null ? r.maxRows : null;
      r.children = (r.children || []).map(function (child) {
        var c = clone(child);
        c.name = c.name || '';
        c.key = c.key || '';
        c.componentType = c.componentType || '文本输入';
        c.desc = c.desc || '';
        c.placeholder = c.placeholder || '';
        c.maxLength = c.maxLength == null ? null : c.maxLength;
        c.min = c.min == null ? null : c.min;
        c.max = c.max == null ? null : c.max;
        c.onValue = c.onValue || '';
        c.offValue = c.offValue || '';
        c.options = clone(c.options || []);
        c.selectMode = c.componentType === '下拉选择' ? (c.selectMode || '单选') : '';
        return c;
      });
      return r;
    });
  }

  function seedScenes() {
    var inter8 = ['f_wait', 'f_daily', 'f_start', 'f_gap_sec', 'f_gap_n', 'f_times', 'f_day', 'f_wait_ad'];
    var inter6 = inter8.slice(0, 6);
    var inter5 = inter8.slice(0, 5);
    var native7 = ['f_pad_tb', 'f_pad_se', 'f_pos', 'f_start', 'f_daily', 'f_wait', 'f_gap_sec'];
    var banner7 = ['f_start', 'f_daily', 'f_pos', 'f_banner_short', 'f_wait', 'f_gap_sec', 'f_day'];
    var splash7 = ['f_wait', 'f_daily', 'f_start', 'f_gap_sec', 'f_day', 'f_wait_ad', 'f_launch'];
    var sdk14 = ['f_iap', 'f_report', 'f_net', 'f_apl_churn', 'f_apl_win', 'f_fb_evt', 'f_fb_fire', 'f_adjust', 'f_inter_ctl', 'f_sdk_type', 'f_ad_track', 'f_load_track', 'f_sdk_log', 'f_ver_tip'];
    function row(id, name, key, adType, fieldIds, sceneType, updatedAt) {
      return {
        id: id, name: name, key: key, adType: adType,
        fieldIds: fieldIds.slice(), sceneType: sceneType, remark: '', status: '启用',
        adSwitch: defaultAdSwitch({ id: id, name: name }),
        updater: '用户A', updatedAt: updatedAt
      };
    }
    return [
      row('s_sdk', 'SDK启动配置', 'SCENE_SDK_CONFIG', '', sdk14, 'SDK内置', '2026-09-21 18:53:44'),
      row('s_open_cold', '开屏-冷启动', 'SCENE_SPLASH_COOL', '开屏', splash7, 'SDK内置', '2026-07-10 18:22:25'),
      row('s_open_hot', '开屏-热启动', 'SCENE_SPLASH_HOT', '开屏', splash7, 'SDK内置', '2026-07-10 17:44:46'),
      row('s_ban_enter', 'Banner-进入关卡', 'SCENE_BANNER_LEVEL_ENTER', 'Banner', banner7, 'SDK内置', '2026-08-04 09:32:06'),
      row('s_int_win', '插屏-关卡胜利', 'SCENE_INTER_LEVEL_WIN', '插屏', inter8, 'SDK内置', '2026-07-10 17:54:38'),
      row('s_int_fail', '插屏-关卡失败', 'SCENE_INTER_LEVEL_FAIL', '插屏', inter8, 'SDK内置', '2026-07-10 17:55:15'),
      row('s_int_replay', '插屏-关卡重玩', 'SCENE_INTER_LEVEL_RETRY', '插屏', inter8, 'SDK内置', '2026-07-10 17:56:04'),
      row('s_lose_retry', '插屏-关卡失败重玩', 'SCENE_INTER_LEVEL_LOSE_RETRY', '插屏', inter8, 'SDK内置', '2026-08-11 15:31:14'),
      row('s_lose_exit', '插屏-关卡失败退出', 'SCENE_INTER_LEVEL_LOSE_EXIT', '插屏', inter8, 'SDK内置', '2026-08-11 15:30:06'),
      row('s_level_wait', '插屏-关卡停留时长', 'SCENE_INTER_LEVEL_WAIT', '插屏', inter8, 'SDK内置', '2026-07-10 17:59:44'),
      row('s_native', '原生广告-结算页', 'SCENE_NATIVE_SETTLEMENT', '', native7, 'SDK内置', '2026-07-10 18:00:27'),
      row('s_test', '测试场景-勿删', 'SCENE_TEST', '', ['f_test'], '自定义', '2026-08-07 14:16:09'),
      row('s_level_start', '插屏-关卡开始', 'SCENE_INTER_LEVEL_START', '插屏', inter6, '自定义', '2026-08-11 15:31:44'),
      row('s_level_exit', '插屏-返回主界面', 'SCENE_INTER_LEVEL_EXIT', '插屏', inter6, '自定义', '2026-08-11 15:31:52'),
      row('s_setting_exit', '插屏-返回主界面2', 'SCENE_INTER_SETTING_EXIT', '插屏', inter5, '自定义', '2026-08-13 14:20:51'),
      row('s_sec_win', '插屏-副玩法胜利', 'SCENE_INTER_SECONDARY', '插屏', inter8, '自定义', '2026-08-11 15:32:20'),
      row('s_sec_fail', '插屏-副玩法失败', 'SCENE_INTER_SECONDARY_FAIL', '插屏', inter8, '自定义', '2026-08-11 15:32:13'),
      row('s_sec_retry', '插屏-副玩法重玩', 'SCENE_INTER_SECONDARY_RETRY', '插屏', inter8, '自定义', '2026-08-11 15:32:05')
    ];
  }

  var SDK_SCENE_IDS = [
    's_sdk', 's_open_cold', 's_open_hot', 's_ban_enter',
    's_int_win', 's_int_fail', 's_int_replay', 's_lose_retry', 's_lose_exit',
    's_level_wait', 's_native'
  ];

  function seedApps() {
    var customExtras = [
      [],
      ['s_test'],
      ['s_level_start', 's_level_exit'],
      ['s_test', 's_sec_win'],
      ['s_setting_exit'],
      ['s_level_start', 's_level_exit', 's_sec_win', 's_sec_fail', 's_sec_retry']
    ];
    var users = ['用户A', '用户B', '用户C', '用户D', '用户E'];
    return PRODUCTS.map(function (p, i) {
      var extras = customExtras[i % customExtras.length];
      var seen = {};
      var scenes = [];
      SDK_SCENE_IDS.concat(extras).forEach(function (id) {
        if (seen[id]) return;
        seen[id] = true;
        scenes.push(id);
      });
      return {
        id: 'a' + (i + 1),
        productId: p.id,
        sceneIds: scenes,
        status: '启用',
        updater: users[i % users.length],
        updatedAt: daysAgo((i % 20) + 1, 9 + (i % 10), (i * 7) % 60)
      };
    }).slice(0, 32);
  }

  function vals(map) { return map; }

  function defaultFieldValues(fieldIds, variant) {
    var v = variant || 0;
    var map = {};
    (fieldIds || []).forEach(function (fid) {
      if (fid === 'f_wait') map[fid] = 3 - (v % 2);
      else if (fid === 'f_daily') map[fid] = 15 + v * 5;
      else if (fid === 'f_start') map[fid] = 2 + (v % 3);
      else if (fid === 'f_gap_sec') map[fid] = 20 + v * 5;
      else if (fid === 'f_gap_n') map[fid] = 1 + (v % 3);
      else if (fid === 'f_times') map[fid] = 2;
      else if (fid === 'f_day') map[fid] = v % 2;
      else if (fid === 'f_wait_ad') map[fid] = 5;
      else if (fid === 'f_launch') map[fid] = 1;
      else if (fid === 'f_pos') map[fid] = v % 2 ? 'bottom' : 'top';
      else if (fid === 'f_banner_short') map[fid] = true;
      else if (fid === 'f_pad_tb') map[fid] = 24;
      else if (fid === 'f_pad_se') map[fid] = 16;
      else if (fid === 'f_sdk_type') map[fid] = 'max';
      else if (fid === 'f_net' || fid === 'f_ad_track' || fid === 'f_load_track' || fid === 'f_sdk_log') map[fid] = true;
      else if (fid === 'f_apl_churn' || fid === 'f_iap') map[fid] = 0.5;
      else if (fid === 'f_inter_ctl') map[fid] = '1:30';
    });
    return map;
  }

  function seedPolicies() {
    var sceneMap = {};
    seedScenes().forEach(function (s) { sceneMap[s.id] = s; });
    var productMap = {};
    PRODUCTS.forEach(function (p) { productMap[p.id] = p; });
    /* 仅 SDK启动配置、插屏-关卡胜利 开分流 */
    var AB_SCENE_IDS = { s_sdk: true, s_int_win: true };
    var expandIds = {};
    seedApps().slice(0, 6).forEach(function (a) { expandIds[a.productId] = true; });
    expandIds.ywcaptainwave08xx = true;
    var apps = seedApps().filter(function (a) { return expandIds[a.productId]; });
    var idSeq = 10001;
    var out = [];

    function pushPolicy(opt) {
      var scene = sceneMap[opt.sceneId];
      if (!scene) return;
      var fieldIds = (scene.fieldIds || []).slice();
      var ab = !!opt.ab;
      var baseVals = defaultFieldValues(fieldIds, opt.variant || 0);
      var expVals = defaultFieldValues(fieldIds, (opt.variant || 0) + 1);
      var policyId = String(idSeq++);
      var controlId = policyId;
      var experimentId = ab ? String(idSeq++) : '';
      out.push({
        id: policyId,
        name: opt.name,
        productId: opt.productId,
        sceneId: opt.sceneId,
        countries: (opt.countries || []).slice(),
        channels: [],
        userType: opt.userType || '全用户',
        versions: (opt.versions || []).slice(),
        priority: opt.priority != null ? opt.priority : 10,
        status: opt.status || '启用',
        updater: opt.updater || '用户A',
        updatedAt: opt.updatedAt || daysAgo(3, 10, 0),
        splits: ab
          ? [
              { id: 'g1', strategyId: controlId, name: '对照组', percent: opt.abRatio ? opt.abRatio[0] : 50, values: vals(baseVals) },
              { id: 'g2', strategyId: experimentId, name: '实验组', percent: opt.abRatio ? opt.abRatio[1] : 50, values: vals(expVals) }
            ]
          : [
              { id: 'g1', strategyId: controlId, name: '默认组', percent: 100, values: vals(baseVals) }
            ]
      });
    }

    apps.forEach(function (app, ai) {
      var product = productMap[app.productId];
      var shortName = product ? product.name.split(/[:(]/)[0].trim() : '产品';
      var isHotpot = app.productId === 'ywvt69aoqfdgyti2';
      (app.sceneIds || []).forEach(function (sid, si) {
        var scene = sceneMap[sid];
        if (!scene) return;
        var ab = !!AB_SCENE_IDS[sid];

        /* SDK启动配置：2 条用户定向（版本全部 / 1.2.2），均开分流 */
        if (sid === 's_sdk') {
          pushPolicy({
            name: shortName + ' · SDK启动配置 · 全部版本',
            productId: app.productId,
            sceneId: sid,
            countries: [],
            versions: [],
            userType: '全用户',
            priority: 10,
            ab: true,
            updater: USERS[ai % USERS.length],
            updatedAt: daysAgo(2, 10, 20),
            variant: 0
          });
          pushPolicy({
            name: shortName + ' · SDK启动配置 · 1.2.2',
            productId: app.productId,
            sceneId: sid,
            countries: [],
            versions: ['1.2.2'],
            userType: '全用户',
            priority: 20,
            ab: true,
            updater: USERS[ai % USERS.length],
            updatedAt: daysAgo(2, 11, 8),
            variant: 1
          });
          return;
        }

        var countries = [];
        var versions = [];
        var userType = '全用户';
        var name = shortName + ' · ' + scene.name;
        var priority = 10 + si * 5;
        var status = '启用';
        var abRatio;

        if (sid === 's_int_win') {
          if (isHotpot) {
            name = 'Hotpot 胜利插屏-美日实验';
            countries = ['US', 'JP'];
            abRatio = [50, 50];
          } else if (app.productId === 'ywcaptainwave08xx') {
            name = '船长胜利插屏-拉美';
            countries = ['BR', 'MX'];
            userType = '老用户';
            versions = ['1.4.0', '1.5.2'];
            priority = 12;
            status = '禁用';
          }
        }

        pushPolicy({
          name: name,
          productId: app.productId,
          sceneId: sid,
          countries: countries,
          versions: versions,
          userType: userType,
          priority: priority,
          status: status,
          ab: ab,
          abRatio: abRatio,
          updater: USERS[(ai + si) % USERS.length],
          updatedAt: daysAgo(3 + (si % 5), 9 + (si % 8), (si * 11) % 60),
          variant: si % 3
        });
      });
    });
    return out;
  }

  function seed() {
    var data = {
      fields: seedFields(),
      scenes: seedScenes(),
      apps: seedApps(),
      policies: seedPolicies()
    };
    normalizeScenes(data.scenes, data.fields);
    return data;
  }

  var SDK_BUILTIN_NAMES = {
    'SDK启动配置': true,
    '开屏-冷启动': true,
    '开屏-热启动': true,
    'Banner-进入关卡': true,
    '插屏-关卡胜利': true,
    '插屏-关卡失败': true,
    '插屏-关卡重玩': true,
    '插屏-关卡失败重玩': true,
    '插屏-关卡失败退出': true,
    '插屏-关卡停留时长': true,
    '原生广告-结算页': true
  };

  function isSdkBuiltinScene(scene) {
    return !!(scene && SDK_BUILTIN_NAMES[scene.name]);
  }

  function defaultSceneType(scene) {
    return isSdkBuiltinScene(scene) ? 'SDK内置' : '自定义';
  }

  function defaultAdSwitch(scene) {
    if (!scene) return false;
    if (scene.id === 's_int_replay' || scene.id === 's_int_fail' || scene.id === 's_int_win') return true;
    var name = scene.name || '';
    return name === '插屏-关卡重玩' || name === '插屏-关卡失败' || name === '插屏-关卡胜利';
  }

  function applySceneTypeDefaults(list) {
    var changed = false;
    (list || []).forEach(function (s) {
      var next = defaultSceneType(s);
      if (s.sceneType !== next) {
        s.sceneType = next;
        changed = true;
      }
    });
    return changed;
  }

  var DEFAULT_SCENE_ORDER = [
    's_sdk', 's_open_cold', 's_open_hot', 's_ban_enter',
    's_int_win', 's_int_fail', 's_int_replay',
    's_lose_retry', 's_lose_exit', 's_level_wait', 's_native',
    's_test', 's_level_start', 's_level_exit', 's_setting_exit',
    's_sec_win', 's_sec_fail', 's_sec_retry'
  ];

  function applySceneDefaultOrder(list) {
    if (!Array.isArray(list) || !list.length) return false;
    var map = {};
    list.forEach(function (s) { map[s.id] = s; });
    var next = [];
    DEFAULT_SCENE_ORDER.forEach(function (id) {
      if (map[id]) {
        next.push(map[id]);
        delete map[id];
      }
    });
    list.forEach(function (s) {
      if (map[s.id]) next.push(s);
    });
    var changed = next.length !== list.length;
    if (!changed) {
      for (var i = 0; i < next.length; i++) {
        if (next[i] !== list[i]) { changed = true; break; }
      }
    }
    if (!changed) return false;
    list.length = 0;
    next.forEach(function (s) { list.push(s); });
    return true;
  }

  function applyPolicyUserTypeDefaults(list) {
    var changed = false;
    (list || []).forEach(function (p) {
      if (p.userType === '全部' || !p.userType) {
        p.userType = '全用户';
        changed = true;
      }
      if (Array.isArray(p.splits) && p.splits.length > 2) {
        p.splits = p.splits.slice(0, 2);
        var sum = p.splits.reduce(function (s, g) { return s + (Number(g.percent) || 0); }, 0);
        if (sum !== 100 && p.splits.length === 2) {
          p.splits[0].percent = 50;
          p.splits[1].percent = 50;
          p.splits[0].name = p.splits[0].name || '对照组';
          p.splits[1].name = p.splits[1].name || '实验组';
        }
        changed = true;
      }
      if (!Array.isArray(p.channels)) {
        p.channels = [];
        changed = true;
      } else if (p.channels.length) {
        p.channels = [];
        changed = true;
      }
    });
    return changed;
  }

  function normalizeScenes(list, fields) {
    var changed = false;
    var fieldMap = {};
    (fields || []).forEach(function (f) { fieldMap[f.id] = f; });
    (list || []).forEach(function (s) {
      if (!s.sceneType) {
        s.sceneType = defaultSceneType(s);
        changed = true;
      }
      if (s.remark === 'SDK内置场景' || s.remark === '自定义场景') {
        s.remark = '';
        changed = true;
      }
      if (!Array.isArray(s.fieldConfigs)) {
        s.fieldConfigs = (s.fieldIds || []).map(function (id) {
          return {
            fieldId: id,
            defaultValue: defaultFieldValue(fieldMap[id]),
            required: false
          };
        });
        changed = true;
      }
      if (s.adSwitch == null) {
        s.adSwitch = defaultAdSwitch(s);
        changed = true;
      }
      var ids = s.fieldConfigs.map(function (c) { return c.fieldId; });
      var prev = s.fieldIds || [];
      if (ids.length !== prev.length || ids.some(function (id, i) { return id !== prev[i]; })) {
        s.fieldIds = ids;
        changed = true;
      }
    });
    return changed;
  }

  function applyAdSwitchDefaults(list) {
    var changed = false;
    (list || []).forEach(function (s) {
      var next = defaultAdSwitch(s);
      if (s.adSwitch !== next) {
        s.adSwitch = next;
        changed = true;
      }
    });
    return changed;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      var data = JSON.parse(raw);
      if (!data || !data.fields || !data.scenes || !data.apps || !data.policies) return seed();
      data._scenesNormalized = normalizeScenes(data.scenes, data.fields);
      if (!data._adSwitchDefaultsV1) {
        if (applyAdSwitchDefaults(data.scenes)) data._scenesNormalized = true;
        data._adSwitchDefaultsV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._sceneTypeSdkV1) {
        if (applySceneTypeDefaults(data.scenes)) data._scenesNormalized = true;
        data._sceneTypeSdkV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._sceneOrderV1) {
        if (applySceneDefaultOrder(data.scenes)) data._scenesNormalized = true;
        data._sceneOrderV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._policyUserTypeV1) {
        if (applyPolicyUserTypeDefaults(data.policies)) data._scenesNormalized = true;
        data._policyUserTypeV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._policyExpandScenesV1) {
        data.policies = seedPolicies();
        data._policyExpandScenesV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._sdkScenesFullV1) {
        data.apps = seedApps();
        data.policies = seedPolicies();
        data._sdkScenesFullV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._policySeedAbTargetV1) {
        data.policies = seedPolicies();
        data._policySeedAbTargetV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._sceneCatalogLockV1) {
        if (pinSdkSceneCatalog(data.scenes)) data._scenesNormalized = true;
        data._sceneCatalogLockV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._splitStrategyIdV1) {
        if (applyUniqueSplitStrategyIds(data.policies)) data._scenesNormalized = true;
        data._splitStrategyIdV1 = true;
        data._scenesNormalized = true;
      }
      if (!data._matchIncludeOnlyV1) {
        (data.policies || []).forEach(function (p) {
          if (p.countryMatch === 'exclude' || p.versionMatch === 'exclude') {
            p.countryMatch = 'include';
            p.versionMatch = 'include';
            data._scenesNormalized = true;
          }
        });
        data._matchIncludeOnlyV1 = true;
      }
      if (!data._dedupeTargetingV1) {
        if (dedupeIdenticalTargeting(data.policies)) data._scenesNormalized = true;
        data._dedupeTargetingV1 = true;
        data._scenesNormalized = true;
      }
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

  if (db._scenesNormalized) {
    delete db._scenesNormalized;
    persist();
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
    var linked = {};
    (app.sceneIds || []).forEach(function (id) { linked[id] = true; });
    return db.scenes.filter(function (s) { return linked[s.id]; });
  }

  /* 策略列表条件列默认顺序与默认选中（图二）。未列入的新字段排在条件组末尾，默认不选中。 */
  var STRATEGY_CONDITION_ORDER = [
    ['f_sdk_log', false],
    ['f_load_track', false],
    ['f_ad_track', false],
    ['f_sdk_type', false],
    ['f_inter_ctl', false],
    ['f_adjust', false],
    ['f_fb_fire', false],
    ['f_fb_evt', false],
    ['f_ver_tip', false],
    ['f_apl_win', false],
    ['f_apl_churn', false],
    ['f_net', false],
    ['f_wait_ad', true],
    ['f_daily', true],
    ['f_day', true],
    ['f_launch', false],
    ['f_streak', false],
    ['f_total_days', true],
    ['f_times', true],
    ['f_gap_sec', true],
    ['f_start', true],
    ['f_gap_n', true],
    ['f_admob', false],
    ['f_banner_short', false],
    ['f_pos', false],
    ['f_pad_se', false],
    ['f_pad_tb', false],
    ['f_wait', false],
    ['f_report', false],
    ['f_test', false],
    ['f_iap', false]
  ];
  var STRATEGY_CONDITION_INDEX = {};
  var STRATEGY_CONDITION_SELECTED = {};
  STRATEGY_CONDITION_ORDER.forEach(function (pair, i) {
    STRATEGY_CONDITION_INDEX[pair[0]] = i;
    STRATEGY_CONDITION_SELECTED[pair[0]] = pair[1];
  });

  function strategyFieldIndex(fieldId) {
    if (STRATEGY_CONDITION_INDEX[fieldId] != null) return STRATEGY_CONDITION_INDEX[fieldId];
    var extra = 0;
    (db.fields || []).some(function (f, i) {
      if (f.id === fieldId) { extra = i; return true; }
      return false;
    });
    return 10000 + extra;
  }

  function strategyFieldDefaultSelected(fieldId) {
    return STRATEGY_CONDITION_SELECTED[fieldId] === true;
  }

  function applyUniqueSplitStrategyIds(list) {
    var used = {};
    function claim(id) {
      var s = String(id || '');
      if (!/^\d+$/.test(s) || used[s]) return '';
      used[s] = true;
      return s;
    }
    function alloc() {
      var n = 10000;
      Object.keys(used).forEach(function (id) {
        var v = parseInt(id, 10);
        if (isFinite(v) && v > n) n = v;
      });
      var next = String(n + 1);
      used[next] = true;
      return next;
    }
    var changed = false;
    (list || []).forEach(function (p) {
      var splits = p.splits || [];
      if (!splits.length) return;
      splits.forEach(function (g, i) {
        var sid = String(g.strategyId || '');
        if (i === 0 && (!sid || sid === String(p.id)) && claim(p.id)) {
          if (g.strategyId !== String(p.id)) {
            g.strategyId = String(p.id);
            changed = true;
          } else if (!used[sid]) {
            claim(sid);
          }
          return;
        }
        if (claim(sid)) return;
        g.strategyId = alloc();
        changed = true;
      });
    });
    return changed;
  }

  function targetingSignature(row) {
    var versions = (row.versions || []).slice().sort().join('\n');
    var countries = (row.countries || []).slice().sort().join('\n');
    var user = row.userType === '全部' || !row.userType ? '全用户' : row.userType;
    return [row.productId || '', row.sceneId || '', versions, countries, user].join('|');
  }

  function policyOrderId(row) {
    var n = parseInt(String((row.splits && row.splits[0] && row.splits[0].strategyId) || row.id), 10);
    return isFinite(n) ? n : 99999999;
  }

  function dedupeIdenticalTargeting(list) {
    if (!Array.isArray(list) || !list.length) return false;
    var best = {};
    list.forEach(function (row) {
      var key = targetingSignature(row);
      var cur = best[key];
      if (!cur || policyOrderId(row) < policyOrderId(cur)) best[key] = row;
    });
    var keep = {};
    Object.keys(best).forEach(function (key) { keep[best[key].id] = true; });
    var next = list.filter(function (row) { return keep[row.id]; });
    if (next.length === list.length) return false;
    list.length = 0;
    next.forEach(function (row) { list.push(row); });
    return true;
  }

  function pinSdkSceneCatalog(list) {
    if (!Array.isArray(list) || !list.length) return false;
    var sdkIds = DEFAULT_SCENE_ORDER.slice(0, 11);
    var map = {};
    list.forEach(function (s) { map[s.id] = s; });
    var next = [];
    sdkIds.forEach(function (id) {
      if (map[id]) {
        next.push(map[id]);
        delete map[id];
      }
    });
    list.forEach(function (s) {
      if (map[s.id] && isSdkBuiltinScene(s)) {
        next.push(s);
        delete map[s.id];
      }
    });
    list.forEach(function (s) {
      if (map[s.id]) next.push(s);
    });
    var changed = next.length !== list.length;
    if (!changed) {
      for (var i = 0; i < next.length; i++) {
        if (next[i] !== list[i]) { changed = true; break; }
      }
    }
    if (!changed) return false;
    list.length = 0;
    next.forEach(function (s) { list.push(s); });
    return true;
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
    APP_VERSIONS: APP_VERSIONS,
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
    strategyFieldIndex: strategyFieldIndex,
    strategyFieldDefaultSelected: strategyFieldDefaultSelected,
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
    isSdkBuiltinScene: isSdkBuiltinScene,
    defaultSceneType: defaultSceneType,
    saveFields: function (list) { db.fields = list; persist(); },
    saveScenes: function (list) { db.scenes = list; persist(); },
    saveApps: function (list) { db.apps = list; persist(); },
    savePolicies: function (list) { db.policies = list; persist(); }
  };

  global.AdStrategyStore = Store;
})(window);
