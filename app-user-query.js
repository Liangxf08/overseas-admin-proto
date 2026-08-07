/* 海外中台 · APP用户查询 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var showToast = UI.showToast;
  var COPY_ICON = UI.COPY_ICON;

  ProductShell.mount('app-user-query');

  /* ========== 指标定义（图二） ========== */
  var COLUMN_ITEMS = [
    { key: 'sandbox', name: '沙箱', group: '用户属性', format: 'switch', defaultChecked: true, defaultFrozen: true, width: 80 },
    { key: 'uuid', name: 'UUID', group: '用户属性', format: 'text', defaultChecked: true, defaultFrozen: true, allowCopy: true, width: 180 },
    { key: 'device_uuid', name: '设备ID', group: '用户属性', format: 'text', defaultChecked: true, allowCopy: true, width: 180 },
    { key: 'open_id', name: '账号ID', group: '用户属性', format: 'text', width: 112 },
    { key: 'distinct_id', name: 'TA访客ID', group: '用户属性', format: 'text', width: 112 },
    { key: 'adjust_id', name: 'AdjustID', group: '用户属性', format: 'text', width: 112 },
    { key: 'install_time', name: '安装时间', group: '用户属性', format: 'datetime', defaultChecked: true, width: 180 },
    { key: 'app_name', name: '产品名称', group: '应用信息', format: 'text', defaultChecked: true, width: 180 },
    { key: 'platform', name: '平台', group: '应用信息', format: 'text', defaultChecked: true, width: 112 },
    { key: 'app_id', name: '产品ID', group: '应用信息', format: 'text', defaultChecked: true, allowCopy: true, width: 140 },
    { key: 'bundle_id', name: '包名', group: '应用信息', format: 'text', defaultChecked: true, allowCopy: true, width: 140 },
    { key: 'app_version', name: 'APP版本', group: '应用信息', format: 'text', defaultChecked: true, width: 112 },
    { key: 'sdk_version', name: 'SDK版本', group: '应用信息', format: 'text', width: 112 },
    { key: 'sdk_type', name: 'SDK类型', group: '应用信息', format: 'text', width: 112 },
    { key: 'network', name: '来源渠道', group: '渠道归因', format: 'text', defaultChecked: true, width: 112 },
    { key: 'campaign', name: '推广活动', group: '渠道归因', format: 'text', width: 112 },
    { key: 'adgroup', name: '广告组', group: '渠道归因', format: 'text', width: 112 },
    { key: 'creative', name: '素材', group: '渠道归因', format: 'text', width: 112 },
    { key: 'gaid', name: 'GAID', group: '设备信息', format: 'text', width: 112 },
    { key: 'ios_uuid', name: 'iOS_UUID', group: '设备信息', format: 'text', width: 112 },
    { key: 'android_id', name: 'AndroidID', group: '设备信息', format: 'text', width: 112 },
    { key: 'idfv', name: 'IDFV', group: '设备信息', format: 'text', width: 112 },
    { key: 'idfa', name: 'IDFA', group: '设备信息', format: 'text', width: 112 },
    { key: 'os_version', name: '系统版本', group: '设备信息', format: 'text', width: 112 },
    { key: 'manufacturer', name: '生产商', group: '设备信息', format: 'text', width: 112 },
    { key: 'device_model', name: '设备型号', group: '设备信息', format: 'text', width: 112 },
    { key: 'screen_height', name: '屏幕高度', group: '设备信息', format: 'text', width: 112 },
    { key: 'screen_width', name: '屏幕宽度', group: '设备信息', format: 'text', width: 112 },
    { key: 'language', name: '设备语言', group: '设备信息', format: 'text', width: 112 },
    { key: 'timezone', name: '设备时区', group: '设备信息', format: 'text', width: 112 },
    { key: 'ip', name: 'IP地址', group: '地理位置', format: 'text', width: 112 },
    { key: 'country_code', name: '地区代码', group: '地理位置', format: 'text', defaultChecked: true, width: 112 },
    { key: 'country', name: '地区名称', group: '地理位置', format: 'text', width: 112 }
  ];

  var COLUMN_MAP = COLUMN_ITEMS.reduce(function (acc, item) {
    acc[item.key] = item;
    return acc;
  }, {});

  var COLUMN_GROUPS = COLUMN_ITEMS.reduce(function (acc, item) {
    if (acc.indexOf(item.group) < 0) acc.push(item.group);
    return acc;
  }, []);

  var DEFAULT_COLUMNS = COLUMN_ITEMS.filter(function (item) {
    return item.defaultChecked;
  }).map(function (item) { return item.key; });

  var DEFAULT_FROZEN_COUNT = COLUMN_ITEMS.filter(function (item) {
    return item.defaultFrozen;
  }).length;

  /* ========== 筛选项假数据 ========== */
  var PRODUCT_CATALOG = [
    { product: 'Tile Sort 3D', platform: 'iOS', appId: 'app_1001', bundleId: 'com.demo.tilesort' },
    { product: 'Tile Sort 3D', platform: 'Android', appId: 'app_1002', bundleId: 'com.demo.tilesort' },
    { product: 'Haggle Sleuth', platform: 'Android', appId: 'app_1003', bundleId: 'com.demo.haggle' },
    { product: 'Pixel Bounce Jam', platform: 'Android', appId: 'app_1004', bundleId: 'com.demo.pixelbounce' },
    { product: 'Story Match', platform: 'Android', appId: 'app_1005', bundleId: 'com.demo.storymatch' },
    { product: 'Hotpot Match 3D', platform: 'Android', appId: 'app_1006', bundleId: 'com.demo.hotpot' },
    { product: '文字の中に文字!', platform: 'iOS', appId: 'app_1007', bundleId: 'com.demo.moji' },
    { product: '文字の中に文字!', platform: 'Android', appId: 'app_1008', bundleId: 'com.demo.moji' },
    { product: 'Perfect Care', platform: 'Android', appId: 'app_1009', bundleId: 'com.demo.perfectcare' },
    { product: 'Jigword', platform: 'Android', appId: 'app_1010', bundleId: 'com.demo.jigword' },
    { product: '我要當學霸', platform: 'iOS', appId: 'app_1011', bundleId: 'com.demo.xueba' }
  ];
  var VERSIONS = ['1.0.0', '1.1.0', '1.1.2', '1.2.0', '1.3.0', '1.3.5', '2.0.0', '2.1.0', '2.1.1', '2.2.0'];
  var SDK_VERSIONS = ['3.2.1', '3.2.0', '3.1.8', '3.1.0', '3.0.5', '3.0.0', '2.9.0', '2.8.3', '2.8.0', '2.7.1'];
  var PLATFORM_ICONS = { Android: 'assets/Android.png', iOS: 'assets/iOS.png' };
  var NETWORKS = ['Organic', 'Google Ads', 'Facebook', 'TikTok', 'Unity Ads', 'AppLovin'];
  var COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'Korea' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'SG', name: 'Singapore' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' }
  ];
  var MANUFACTURERS = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo', 'Huawei', 'Google'];
  var MODELS = {
    Apple: ['iPhone 13', 'iPhone 14', 'iPhone 15'],
    Samsung: ['Galaxy S22', 'Galaxy S23', 'Galaxy A54'],
    Xiaomi: ['Redmi Note 12', 'Mi 13'],
    OPPO: ['Find X5', 'Reno 10'],
    vivo: ['X90', 'Y78'],
    Huawei: ['P50', 'Mate 50'],
    Google: ['Pixel 7', 'Pixel 8']
  };
  var SDK_TYPES = ['Adjust', 'AppsFlyer', 'Firebase'];
  var LANGUAGES = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'de'];
  var TIMEZONES = ['UTC+8', 'UTC+9', 'UTC-5', 'UTC+0', 'UTC+1'];
  var OPERATORS = Array.from({ length: 6 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });
  var ACTION_COL_WIDTH = 120;
  var COUNTRY_OPTIONS = COUNTRIES.map(function (c) { return c.code; });
  var COUNTRY_MAP = COUNTRIES.reduce(function (acc, c) {
    acc[c.code] = c;
    return acc;
  }, {});

  var PRODUCT_OPTIONS = PRODUCT_CATALOG.map(function (item) {
    return item.product + '@@' + item.platform;
  });

  function parseProductOption(key) {
    var idx = String(key).lastIndexOf('@@');
    if (idx === -1) return { product: key, platform: '' };
    return { product: key.slice(0, idx), platform: key.slice(idx + 2) };
  }

  function productOptionIconHtml(key) {
    var platform = parseProductOption(key).platform;
    var src = PLATFORM_ICONS[platform];
    if (!src) return '';
    return '<span class="select-option-icon"><img src="' + src + '" alt="" /></span>';
  }

  function productOptionLabel(key) {
    return parseProductOption(key).product;
  }

  /* ========== 工具 ========== */
  function pad(n) { return String(n).padStart(2, '0'); }

  function formatDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatDateTime(d) {
    return formatDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function hashHex(seed, len) {
    var s = String(seed);
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var out = '';
    while (out.length < len) {
      h ^= h >>> 13;
      h = Math.imul(h, 1274126177);
      out += (h >>> 0).toString(16);
    }
    return out.slice(0, len);
  }

  function pick(arr, seed) {
    return arr[Math.abs(seed) % arr.length];
  }

  /* ========== Mock 数据 ========== */
  function buildMockRows(count) {
    var list = [];
    var now = Date.now();
    for (var i = 0; i < count; i++) {
      var catalog = PRODUCT_CATALOG[i % PRODUCT_CATALOG.length];
      var isIos = catalog.platform === 'iOS';
      var manufacturer = isIos ? 'Apple' : pick(MANUFACTURERS.filter(function (m) { return m !== 'Apple'; }), i);
      var model = pick(MODELS[manufacturer] || ['Generic'], i + 3);
      var country = pick(COUNTRIES, i + 5);
      var install = new Date(now - (i % 40) * 86400000 - (i % 24) * 3600000 - (i % 60) * 60000);
      var uuid = hashHex('uuid-' + i, 32);
      var deviceId = hashHex('device-' + i, 32);
      list.push({
        uuid: uuid,
        device_uuid: deviceId,
        open_id: i % 3 === 0 ? '' : 'oid_' + hashHex('open-' + i, 12),
        distinct_id: 'ta_' + hashHex('ta-' + i, 16),
        adjust_id: hashHex('adj-' + i, 16),
        install_time: formatDateTime(install),
        installTs: install.getTime(),
        sandbox: i < 2,
        app_name: catalog.product,
        platform: catalog.platform,
        app_id: catalog.appId,
        bundle_id: catalog.bundleId,
        app_version: pick(VERSIONS, i),
        sdk_version: pick(SDK_VERSIONS, i + 1),
        sdk_type: pick(SDK_TYPES, i),
        network: pick(NETWORKS, i + 2),
        campaign: 'camp_' + pick(['spring', 'summer', 'launch', 'retarget'], i),
        adgroup: 'adg_' + ((i % 8) + 1),
        creative: 'crt_' + ((i % 12) + 1),
        gaid: isIos ? '' : hashHex('gaid-' + i, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
        ios_uuid: isIos ? uuid : '',
        android_id: isIos ? '' : hashHex('and-' + i, 16),
        idfv: isIos ? hashHex('idfv-' + i, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : '',
        idfa: isIos ? hashHex('idfa-' + i, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : '',
        os_version: isIos ? pick(['16.5', '17.0', '17.2', '18.0'], i) : pick(['12', '13', '14', '15'], i),
        manufacturer: manufacturer,
        device_model: model,
        screen_height: isIos ? pick(['2532', '2556', '2796'], i) : pick(['2400', '2340', '2412'], i),
        screen_width: isIos ? pick(['1170', '1179', '1290'], i) : pick(['1080', '1080', '1200'], i),
        language: pick(LANGUAGES, i),
        timezone: pick(TIMEZONES, i),
        ip: ((i % 200) + 20) + '.' + ((i * 3) % 255) + '.' + ((i * 7) % 255) + '.' + ((i * 11) % 255),
        country_code: country.code,
        country: country.name,
        productKey: catalog.product + '@@' + catalog.platform
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows(86);

  /* uuid -> 编辑日志 */
  var EDIT_LOGS = {};

  function pushEditLog(uuid, changes, operator, time) {
    if (!EDIT_LOGS[uuid]) EDIT_LOGS[uuid] = [];
    EDIT_LOGS[uuid].unshift({
      time: time || formatDateTime(new Date()),
      operator: operator || pick(OPERATORS, Date.now() % 100),
      changes: changes
    });
  }

  /* 沙箱用户预置日志：覆盖沙箱开关 / 国家地区 / 安装时间 */
  ALL_ROWS.slice(0, 2).forEach(function (row, idx) {
    var base = new Date(Date.now() - (idx + 1) * 3600000);
    var prevInstall = new Date(row.installTs - 86400000 * (idx + 2) - 3600000);
    var otherCountry = COUNTRIES[(idx + 3) % COUNTRIES.length];
    var otherLabel = otherCountry.name + ' (' + otherCountry.code + ')';
    /* unshift 后时间倒序：先压旧、后压新 */
    pushEditLog(row.uuid, [{
      field: '沙箱',
      from: '关闭',
      to: '开启'
    }], OPERATORS[idx % OPERATORS.length], formatDateTime(new Date(base.getTime() - 7200000)));
    pushEditLog(row.uuid, [{
      field: '国家地区',
      from: otherLabel,
      to: countryLabel(row.country_code)
    }], OPERATORS[(idx + 1) % OPERATORS.length], formatDateTime(new Date(base.getTime() - 3600000)));
    pushEditLog(row.uuid, [{
      field: '安装时间',
      from: formatDateTime(prevInstall),
      to: row.install_time
    }], OPERATORS[(idx + 2) % OPERATORS.length], formatDateTime(base));
  });

  /* ========== 状态 ========== */
  var state = {
    draft: {
      products: [],
      versions: [],
      sdkVersions: [],
      sandboxEnv: '全部',
      appId: '',
      bundleId: '',
      uuid: '',
      deviceId: ''
    },
    columns: DEFAULT_COLUMNS.slice(),
    frozenCount: DEFAULT_FROZEN_COUNT,
    page: 1,
    pageSize: 20,
    metricDraft: [],
    metricFrozenCount: DEFAULT_FROZEN_COUNT,
    metricCat: COLUMN_GROUPS[0],
    dragMetricKey: null,
    applied: null,
    editUuid: null,
    editCountry: '',
    editInstallTime: ''
  };

  /* ========== 筛选绑定 ========== */
  var dateRange = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '日期：',
    defaultShortcut: 'last7'
  });

  function cloneFilters() {
    return {
      products: state.draft.products.slice(),
      versions: state.draft.versions.slice(),
      sdkVersions: state.draft.sdkVersions.slice(),
      sandboxEnv: state.draft.sandboxEnv || '全部',
      appId: state.draft.appId,
      bundleId: state.draft.bundleId,
      uuid: state.draft.uuid,
      deviceId: state.draft.deviceId,
      dateStart: dateRange ? dateRange.getStart() : null,
      dateEnd: dateRange ? dateRange.getEnd() : null
    };
  }

  var productMulti = UI.bindMultiSelect({
    wrapId: 'productWrap',
    triggerId: 'productTrigger',
    panelId: 'productPanel',
    listId: 'productList',
    selectedId: 'productSelected',
    countId: 'productCount',
    labelId: 'productLabel',
    searchId: 'productSearch',
    selectAllId: 'productSelectAll',
    clearId: 'productClear',
    prefix: '产品：',
    options: PRODUCT_OPTIONS,
    getLabel: productOptionLabel,
    getIconHtml: productOptionIconHtml,
    getSelected: function () { return state.draft.products; },
    setSelected: function (v) { state.draft.products = v; }
  });

  var versionMulti = UI.bindMultiSelect({
    wrapId: 'versionWrap',
    triggerId: 'versionTrigger',
    panelId: 'versionPanel',
    listId: 'versionList',
    selectedId: 'versionSelected',
    countId: 'versionCount',
    labelId: 'versionLabel',
    searchId: 'versionSearch',
    selectAllId: 'versionSelectAll',
    clearId: 'versionClear',
    prefix: 'APP版本：',
    options: VERSIONS,
    getSelected: function () { return state.draft.versions; },
    setSelected: function (v) { state.draft.versions = v; }
  });

  var sdkMulti = UI.bindMultiSelect({
    wrapId: 'sdkVersionWrap',
    triggerId: 'sdkVersionTrigger',
    panelId: 'sdkVersionPanel',
    listId: 'sdkVersionList',
    selectedId: 'sdkVersionSelected',
    countId: 'sdkVersionCount',
    labelId: 'sdkVersionLabel',
    searchId: 'sdkVersionSearch',
    selectAllId: 'sdkVersionSelectAll',
    clearId: 'sdkVersionClear',
    prefix: 'SDK版本：',
    options: SDK_VERSIONS,
    getSelected: function () { return state.draft.sdkVersions; },
    setSelected: function (v) { state.draft.sdkVersions = v; }
  });

  var sandboxEnvSelect = UI.bindSingleSelect({
    wrapId: 'sandboxEnvWrap',
    triggerId: 'sandboxEnvTrigger',
    panelId: 'sandboxEnvPanel',
    labelId: 'sandboxEnvLabel',
    prefix: '沙箱：',
    getValue: function () { return state.draft.sandboxEnv || '全部'; },
    onChange: function (v) { state.draft.sandboxEnv = v || '全部'; }
  });

  function bindClearIcon(id, onClear) {
    var btn = $(id);
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      onClear();
    });
  }

  bindClearIcon('productClearIcon', function () {
    state.draft.products = [];
    if (productMulti) productMulti.render();
  });
  bindClearIcon('versionClearIcon', function () {
    state.draft.versions = [];
    if (versionMulti) versionMulti.render();
  });
  bindClearIcon('sdkVersionClearIcon', function () {
    state.draft.sdkVersions = [];
    if (sdkMulti) sdkMulti.render();
  });

  function readKeywordFilters() {
    state.draft.appId = ($('filterAppId').value || '').trim();
    state.draft.bundleId = ($('filterBundleId').value || '').trim();
    state.draft.uuid = ($('filterUuid').value || '').trim();
    state.draft.deviceId = ($('filterDeviceId').value || '').trim();
  }

  function applyQuery() {
    readKeywordFilters();
    state.applied = cloneFilters();
    state.page = 1;
    renderTable();
  }

  function doReset() {
    state.draft.products = [];
    state.draft.versions = [];
    state.draft.sdkVersions = [];
    state.draft.sandboxEnv = '全部';
    state.draft.appId = '';
    state.draft.bundleId = '';
    state.draft.uuid = '';
    state.draft.deviceId = '';
    $('filterAppId').value = '';
    $('filterBundleId').value = '';
    $('filterUuid').value = '';
    $('filterDeviceId').value = '';
    if (productMulti) productMulti.render();
    if (versionMulti) versionMulti.render();
    if (sdkMulti) sdkMulti.render();
    if (sandboxEnvSelect && sandboxEnvSelect.syncLabel) sandboxEnvSelect.syncLabel('全部');
    if (dateRange && dateRange.setRange) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var start7 = new Date(today);
      start7.setDate(start7.getDate() - 6);
      dateRange.setRange(start7, today, 'last7');
    }
    applyQuery();
  }

  /* ========== 过滤 / 表格 ========== */
  function getFilteredRows() {
    var f = state.applied || cloneFilters();
    var startTs = f.dateStart ? f.dateStart.getTime() : null;
    var endTs = f.dateEnd ? f.dateEnd.getTime() + 86400000 - 1 : null;
    return ALL_ROWS.filter(function (row) {
      if (startTs != null && row.installTs < startTs) return false;
      if (endTs != null && row.installTs > endTs) return false;
      if (f.products.length && f.products.indexOf(row.productKey) < 0) return false;
      if (f.appId && String(row.app_id).indexOf(f.appId) < 0) return false;
      if (f.bundleId && String(row.bundle_id).toLowerCase().indexOf(f.bundleId.toLowerCase()) < 0) return false;
      if (f.versions.length && f.versions.indexOf(row.app_version) < 0) return false;
      if (f.sdkVersions.length && f.sdkVersions.indexOf(row.sdk_version) < 0) return false;
      if (f.sandboxEnv === '开启' && !row.sandbox) return false;
      if (f.sandboxEnv === '关闭' && row.sandbox) return false;
      if (f.uuid && String(row.uuid).toLowerCase().indexOf(f.uuid.toLowerCase()) < 0) return false;
      if (f.deviceId && String(row.device_uuid).toLowerCase().indexOf(f.deviceId.toLowerCase()) < 0) return false;
      return true;
    });
  }

  function isFrozenKey(key) {
    var item = COLUMN_MAP[key];
    return !!(item && item.defaultFrozen);
  }

  function minFrozenCount(draft) {
    var n = 0;
    (draft || []).forEach(function (key) {
      if (isFrozenKey(key)) n += 1;
    });
    return n;
  }

  function normalizeColumns(draft) {
    var seen = {};
    var list = [];
    (draft || []).forEach(function (key) {
      if (!key || !COLUMN_MAP[key] || seen[key]) return;
      seen[key] = true;
      list.push(key);
    });
    COLUMN_ITEMS.forEach(function (item) {
      if (item.defaultFrozen && !seen[item.key]) {
        list.unshift(item.key);
        seen[item.key] = true;
      }
    });
    var locked = [];
    var free = [];
    list.forEach(function (key) {
      if (isFrozenKey(key)) locked.push(key);
      else free.push(key);
    });
    return locked.concat(free);
  }

  function visibleColumns() {
    return normalizeColumns(state.columns);
  }

  function countryLabel(code) {
    var c = COUNTRY_MAP[code];
    if (!c) return code || '';
    return c.name + ' (' + c.code + ')';
  }

  function actionCellHtml(row) {
    var canEdit = !!row.sandbox;
    return '<div class="action-links">' +
      '<button class="link' + (canEdit ? '' : ' is-disabled') + '" type="button" data-action="edit" data-uuid="' +
        escapeHtml(row.uuid) + '"' + (canEdit ? '' : ' disabled') + '>编辑</button>' +
      '<button class="link" type="button" data-action="log" data-uuid="' + escapeHtml(row.uuid) + '">日志</button>' +
    '</div>';
  }

  function cellHtml(col, row) {
    if (col.key === 'sandbox') {
      var on = !!row.sandbox;
      return '<button class="switch switch--small' + (on ? ' is-on' : '') + '" type="button" data-sandbox-toggle="' +
        escapeHtml(row.uuid) + '" aria-label="沙箱" aria-checked="' + (on ? 'true' : 'false') + '" role="switch"></button>';
    }
    var raw = row[col.key];
    var text = raw == null || raw === '' ? '-' : String(raw);
    if (!col.allowCopy || text === '-') {
      return '<span title="' + escapeHtml(text) + '">' + escapeHtml(text) + '</span>';
    }
    return '<span class="cell-id">' +
      '<button class="copy-btn" type="button" data-copy="' + escapeHtml(text) + '" aria-label="复制' + escapeHtml(col.name) + '">' + COPY_ICON + '</button>' +
      '<span class="cell-id__text" title="' + escapeHtml(text) + '">' + escapeHtml(text) + '</span>' +
      '</span>';
  }

  function renderTable() {
    var cols = visibleColumns().map(function (key) { return COLUMN_MAP[key]; }).filter(Boolean);
    var freezeCount = Math.max(minFrozenCount(state.columns), Math.min(state.frozenCount, cols.length));
    state.frozenCount = freezeCount;

    var freezeLeft = 0;
    var freezeOffsets = {};
    cols.forEach(function (col, idx) {
      if (idx < freezeCount) {
        freezeOffsets[col.key] = freezeLeft;
        freezeLeft += col.width || 112;
      }
    });

    var colgroup = $('tableColgroup');
    var thead = $('tableHead');
    var tbody = $('tableBody');
    var tip = $('emptyTip');

    colgroup.innerHTML = cols.map(function (col) {
      return '<col data-col-width="' + (col.width || 112) + '" />';
    }).join('') + '<col class="col-action" data-col-width="' + ACTION_COL_WIDTH + '" />';

    thead.innerHTML = '<tr>' + cols.map(function (col, idx) {
      var frozen = idx < freezeCount;
      var style = frozen ? ' style="left:' + freezeOffsets[col.key] + 'px"' : '';
      return '<th class="' + (frozen ? 'is-freeze' : '') + '"' + style + '>' + escapeHtml(col.name) + '</th>';
    }).join('') + '<th class="col-action">操作</th></tr>';

    var rows = getFilteredRows();
    var total = rows.length;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);

    if (!pageRows.length) {
      tbody.innerHTML = '';
      if (tip) tip.hidden = false;
    } else {
      if (tip) tip.hidden = true;
      tbody.innerHTML = pageRows.map(function (row) {
        return '<tr>' + cols.map(function (col, idx) {
          var frozen = idx < freezeCount;
          var style = frozen ? ' style="left:' + freezeOffsets[col.key] + 'px"' : '';
          return '<td class="' + (frozen ? 'is-freeze' : '') + '"' + style + '>' + cellHtml(col, row) + '</td>';
        }).join('') + '<td class="col-action">' + actionCellHtml(row) + '</td></tr>';
      }).join('');
    }

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize,
      onPageChange: function (p) {
        state.page = p;
        renderTable();
      },
      onPageSizeChange: function (size) {
        state.pageSize = size;
        state.page = 1;
        renderTable();
      }
    });

    if (window.ColResize) ColResize.refresh($('userTable'));
  }

  /* ========== 自定义列弹窗 ========== */
  function filteredColumnItems() {
    var kw = ($('metricSearch').value || '').trim().toLowerCase();
    return COLUMN_ITEMS.filter(function (item) {
      if (!kw) return true;
      return item.name.toLowerCase().indexOf(kw) >= 0 || item.key.toLowerCase().indexOf(kw) >= 0;
    });
  }

  function groupItems(items) {
    var map = {};
    COLUMN_GROUPS.forEach(function (g) { map[g] = []; });
    items.forEach(function (item) {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    });
    return map;
  }

  function renderMetricModal() {
    var items = filteredColumnItems();
    var grouped = groupItems(items);
    var visibleGroups = COLUMN_GROUPS.filter(function (g) { return (grouped[g] || []).length; });

    if (visibleGroups.indexOf(state.metricCat) < 0) {
      state.metricCat = visibleGroups[0] || COLUMN_GROUPS[0];
    }

    $('metricCatList').innerHTML = visibleGroups.map(function (cat) {
      return '<button class="metric-cat' + (cat === state.metricCat ? ' is-active' : '') + '" type="button" data-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
    }).join('') || '<div class="transfer__empty">无匹配</div>';

    $('metricOptions').innerHTML = visibleGroups.map(function (cat) {
      var list = grouped[cat] || [];
      var selectable = list.filter(function (item) { return !isFrozenKey(item.key); });
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      var groupDisabled = selectable.length === 0;
      return '<section class="metric-group" id="metric-group-' + escapeHtml(cat) + '" data-group="' + escapeHtml(cat) + '">' +
        '<div class="metric-group__head">' +
          '<input class="metric-check" type="checkbox" data-group-check="' + escapeHtml(cat) + '"' +
            (allChecked ? ' checked' : '') + (groupDisabled ? ' disabled' : '') +
            ' aria-label="全选' + escapeHtml(cat) + '" />' +
          '<span>' + escapeHtml(cat) + '</span>' +
        '</div>' +
        '<div class="metric-group__grid">' +
          list.map(function (item) {
            var checked = state.metricDraft.indexOf(item.key) >= 0;
            var disabled = isFrozenKey(item.key);
            return '<label class="metric-option' + (disabled ? ' is-disabled' : '') + '">' +
              '<input class="metric-check" type="checkbox" value="' + escapeHtml(item.key) + '"' +
                (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />' +
              '<span class="metric-option__name">' + escapeHtml(item.name) + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
      '</section>';
    }).join('') || '<div class="transfer__empty">无匹配指标</div>';

    $('metricOptions').querySelectorAll('[data-group-check]').forEach(function (input) {
      var cat = input.getAttribute('data-group-check');
      var list = grouped[cat] || [];
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      input.indeterminate = checkedCount > 0 && !allChecked;
    });

    $('metricSelectedCount').textContent = '已选 ' + state.metricDraft.length + ' 列';
    var freezeAt = Math.min(Math.max(state.metricFrozenCount, 0), state.metricDraft.length);
    state.metricFrozenCount = Math.max(freezeAt, minFrozenCount(state.metricDraft));
    freezeAt = state.metricFrozenCount;

    var listHtml = '';
    if (!state.metricDraft.length) {
      listHtml = '<div class="transfer__empty">请添加指标</div>';
    } else {
      state.metricDraft.forEach(function (key, idx) {
        if (idx === freezeAt) {
          listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
        }
        var item = COLUMN_MAP[key] || { name: key };
        var forced = isFrozenKey(key);
        var frozen = idx < freezeAt;
        var icon = frozen
          ? '<svg class="metric-selected__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
          : '<svg class="metric-selected__drag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        var remove = forced
          ? ''
          : '<button class="metric-selected__remove" type="button" data-remove-metric="' + escapeHtml(key) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button>';
        listHtml +=
          '<div class="metric-selected__item' + (frozen ? ' is-frozen' : '') + '" draggable="' + (forced ? 'false' : 'true') + '" data-metric="' + escapeHtml(key) + '" data-index="' + idx + '">' +
            icon +
            '<span class="metric-selected__name">' + escapeHtml(item.name) + '</span>' +
            remove +
          '</div>';
      });
      if (freezeAt >= state.metricDraft.length) {
        listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
      }
    }
    $('metricSelectedList').innerHTML = listHtml;
  }

  function toggleMetricKey(key, checked) {
    if (isFrozenKey(key)) return;
    var idx = state.metricDraft.indexOf(key);
    if (checked && idx < 0) {
      state.metricDraft.push(key);
    } else if (!checked && idx >= 0) {
      state.metricDraft.splice(idx, 1);
      if (idx < state.metricFrozenCount) {
        state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), state.metricFrozenCount - 1);
      }
    }
    state.metricFrozenCount = Math.max(state.metricFrozenCount, minFrozenCount(state.metricDraft));
  }

  function openMetricModal() {
    state.metricDraft = normalizeColumns(state.columns);
    state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), Math.min(state.frozenCount, state.metricDraft.length));
    state.metricCat = COLUMN_GROUPS[0];
    $('metricSearch').value = '';
    renderMetricModal();
    UI.openModal('metricModal');
  }

  function submitMetrics() {
    if (!state.metricDraft.length) {
      showToast('请至少选择 1 个指标', 'error');
      return;
    }
    state.columns = state.metricDraft.slice();
    state.frozenCount = state.metricFrozenCount;
    UI.closeModal('metricModal');
    renderTable();
    showToast('自定义列已更新');
  }

  function scrollToMetricGroup(cat) {
    var el = document.getElementById('metric-group-' + cat);
    var scroller = $('metricOptions');
    if (!el || !scroller) return;
    state.metricCat = cat;
    renderMetricModal();
    var target = document.getElementById('metric-group-' + cat);
    if (target) {
      scroller.scrollTop = target.offsetTop - 8;
    }
  }

  /* metric modal events */
  $('metricCatList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    scrollToMetricGroup(btn.getAttribute('data-cat'));
  });

  $('metricSearch').addEventListener('input', function () {
    renderMetricModal();
  });

  $('metricOptions').addEventListener('change', function (e) {
    var input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
    var group = input.getAttribute('data-group-check');
    if (group) {
      var items = filteredColumnItems().filter(function (item) { return item.group === group; });
      items.forEach(function (item) {
        if (!isFrozenKey(item.key)) toggleMetricKey(item.key, input.checked);
      });
      state.metricDraft = normalizeColumns(state.metricDraft);
      renderMetricModal();
      return;
    }
    toggleMetricKey(input.value, input.checked);
    state.metricDraft = normalizeColumns(state.metricDraft);
    renderMetricModal();
  });

  $('metricSelectedList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-metric]');
    if (!btn) return;
    toggleMetricKey(btn.getAttribute('data-remove-metric'), false);
    state.metricDraft = normalizeColumns(state.metricDraft);
    renderMetricModal();
  });

  $('metricClear').addEventListener('click', function () {
    state.metricDraft = COLUMN_ITEMS.filter(function (item) { return item.defaultFrozen; }).map(function (item) { return item.key; });
    state.metricFrozenCount = state.metricDraft.length;
    renderMetricModal();
  });

  $('metricSubmit').addEventListener('click', submitMetrics);

  document.querySelectorAll('[data-close="metricModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal('metricModal');
    });
  });

  /* drag reorder + freeze line */
  var selectedList = $('metricSelectedList');
  selectedList.addEventListener('dragstart', function (e) {
    var item = e.target.closest('[data-metric]');
    if (!item || item.getAttribute('draggable') === 'false') return;
    state.dragMetricKey = item.getAttribute('data-metric');
    item.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  selectedList.addEventListener('dragend', function () {
    state.dragMetricKey = null;
    selectedList.querySelectorAll('.is-dragging, .is-drag-over').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drag-over');
    });
  });
  selectedList.addEventListener('dragover', function (e) {
    if (!state.dragMetricKey) return;
    e.preventDefault();
    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    selectedList.querySelectorAll('.is-drag-over').forEach(function (el) { el.classList.remove('is-drag-over'); });
    if (line) line.classList.add('is-drag-over');
    else if (item) item.classList.add('is-drag-over');
  });
  selectedList.addEventListener('drop', function (e) {
    if (!state.dragMetricKey) return;
    e.preventDefault();
    var key = state.dragMetricKey;
    var from = state.metricDraft.indexOf(key);
    if (from < 0 || isFrozenKey(key)) return;

    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    var minFrozen = minFrozenCount(state.metricDraft);

    state.metricDraft.splice(from, 1);
    if (line) {
      state.metricDraft.splice(state.metricFrozenCount > from ? state.metricFrozenCount - 1 : state.metricFrozenCount, 0, key);
      state.metricFrozenCount = Math.max(minFrozen, state.metricDraft.indexOf(key) + 1);
    } else if (item) {
      var toKey = item.getAttribute('data-metric');
      var to = state.metricDraft.indexOf(toKey);
      if (to < 0) to = state.metricDraft.length;
      if (isFrozenKey(toKey)) to = Math.max(to + 1, minFrozen);
      state.metricDraft.splice(to, 0, key);
      var newIdx = state.metricDraft.indexOf(key);
      if (newIdx < state.metricFrozenCount) {
        /* keep freeze count */
      } else if (from < state.metricFrozenCount) {
        state.metricFrozenCount = Math.max(minFrozen, state.metricFrozenCount - 1);
      }
    } else {
      state.metricDraft.push(key);
      if (from < state.metricFrozenCount) {
        state.metricFrozenCount = Math.max(minFrozen, state.metricFrozenCount - 1);
      }
    }
    state.metricDraft = normalizeColumns(state.metricDraft);
    state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), Math.min(state.metricFrozenCount, state.metricDraft.length));
    renderMetricModal();
  });

  function setDataFullscreen(on) {
    var panel = $('dataPanel');
    var btn = $('fullscreenBtn');
    var tip = $('fullscreenTip');
    if (!panel) return;
    panel.classList.toggle('is-fullscreen', !!on);
    var label = on ? '退出全屏' : '全屏';
    if (btn) btn.setAttribute('aria-label', label);
    if (tip) tip.setAttribute('data-tip', label);
    if (window.ColResize) ColResize.refresh($('userTable'));
  }

  function exportCurrentList() {
    var cols = visibleColumns().map(function (key) { return COLUMN_MAP[key]; }).filter(Boolean);
    var rows = getFilteredRows();
    function csvCell(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    var header = cols.map(function (c) { return csvCell(c.name); }).join(',');
    var lines = [header].concat(rows.map(function (row) {
      return cols.map(function (col) {
        if (col.key === 'sandbox') return csvCell(row.sandbox ? '开启' : '关闭');
        var raw = row[col.key];
        return csvCell(raw == null || raw === '' ? '' : raw);
      }).join(',');
    }));
    var stamp = formatDate(new Date()).replace(/-/g, '');
    UI.downloadText('APP用户查询_' + stamp + '.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
    showToast('已导出当前列表');
  }

  /* ========== 事件 ========== */
  $('queryBtn').addEventListener('click', applyQuery);
  $('resetBtn').addEventListener('click', doReset);
  $('refreshBtn').addEventListener('click', function () {
    renderTable();
    showToast('已刷新');
  });
  $('fullscreenBtn').addEventListener('click', function () {
    setDataFullscreen(!$('dataPanel').classList.contains('is-fullscreen'));
  });
  $('exportBtn').addEventListener('click', exportCurrentList);
  $('metricsBtn').addEventListener('click', openMetricModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('dataPanel') && $('dataPanel').classList.contains('is-fullscreen')) {
      setDataFullscreen(false);
    }
  });

  ['filterAppId', 'filterBundleId', 'filterUuid', 'filterDeviceId'].forEach(function (id) {
    $(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyQuery();
    });
  });

  /* ========== 编辑 / 日志 ========== */
  var editCountrySelect = null;
  var editInstallPicker = null;

  function clearEditErrors() {
    $('editInstallItem').classList.remove('is-error');
    $('editCountryItem').classList.remove('is-error');
  }

  function bindEditInstallPicker() {
    editInstallPicker = UI.bindDateTime({
      wrapId: 'editInstallWrap',
      triggerId: 'editInstallTrigger',
      labelId: 'editInstallLabel',
      panelId: 'editInstallPanel',
      calId: 'editInstallCal',
      hourId: 'editTimeHour',
      minuteId: 'editTimeMinute',
      secondId: 'editTimeSecond',
      displayId: 'editTimeDisplay',
      clearId: 'editInstallClear',
      placeholder: '请选择日期时间',
      onChange: function (v) {
        state.editInstallTime = v || '';
        $('editInstallItem').classList.remove('is-error');
      }
    });
  }

  function renderCountryPanel(active) {
    var panel = $('editCountryPanel');
    if (!panel) return;
    panel.innerHTML = COUNTRY_OPTIONS.map(function (code) {
      return '<button class="single-option' + (code === active ? ' is-active' : '') +
        '" type="button" data-value="' + escapeHtml(code) + '">' + escapeHtml(countryLabel(code)) + '</button>';
    }).join('');
  }

  function bindEditCountrySelect() {
    editCountrySelect = UI.bindSingleSelect({
      wrapId: 'editCountryWrap',
      triggerId: 'editCountryTrigger',
      panelId: 'editCountryPanel',
      labelId: 'editCountryLabel',
      prefix: '',
      getValue: function () { return state.editCountry || ''; },
      formatValue: countryLabel,
      onChange: function (v) {
        state.editCountry = v || '';
        $('editCountryItem').classList.remove('is-error');
        renderCountryPanel(state.editCountry);
      }
    });
    $('editCountryTrigger').addEventListener('click', function () {
      var panel = $('editCountryPanel');
      var trigger = $('editCountryTrigger');
      if (panel && panel.classList.contains('is-open') && UI.adjustDropdownPlacement) {
        requestAnimationFrame(function () {
          UI.adjustDropdownPlacement(panel, trigger);
        });
      }
    });
  }

  bindEditInstallPicker();
  bindEditCountrySelect();

  function openEditModal(row) {
    if (!row || !row.sandbox) return;
    state.editUuid = row.uuid;
    state.editCountry = row.country_code || '';
    state.editInstallTime = row.install_time || '';
    $('editUuid').value = row.uuid || '';
    $('editDeviceId').value = row.device_uuid || '';
    if (editInstallPicker) editInstallPicker.setValue(state.editInstallTime);
    renderCountryPanel(state.editCountry);
    if (editCountrySelect && editCountrySelect.syncLabel) editCountrySelect.syncLabel(state.editCountry);
    clearEditErrors();
    if (editInstallPicker) editInstallPicker.close();
    UI.openModal('editModal');
  }

  function submitEdit() {
    var row = ALL_ROWS.find(function (r) { return r.uuid === state.editUuid; });
    if (!row) {
      UI.closeModal('editModal');
      return;
    }
    if (!row.sandbox) {
      showToast('仅沙箱开启时可编辑', 'error');
      UI.closeModal('editModal');
      renderTable();
      return;
    }
    var installTime = (state.editInstallTime || '').trim();
    var countryCode = state.editCountry || '';
    var ok = true;
    clearEditErrors();
    if (!installTime) {
      $('editInstallItem').classList.add('is-error');
      ok = false;
    }
    if (!countryCode || !COUNTRY_MAP[countryCode]) {
      $('editCountryItem').classList.add('is-error');
      ok = false;
    }
    if (!ok) return;

    var changes = [];
    if (installTime !== row.install_time) {
      changes.push({ field: '安装时间', from: row.install_time || '-', to: installTime });
      row.install_time = installTime;
      var parsedTs = Date.parse(String(installTime).replace(/-/g, '/'));
      if (!isNaN(parsedTs)) row.installTs = parsedTs;
    }
    if (countryCode !== row.country_code) {
      changes.push({
        field: '国家地区',
        from: countryLabel(row.country_code) || '-',
        to: countryLabel(countryCode)
      });
      row.country_code = countryCode;
      row.country = COUNTRY_MAP[countryCode].name;
    }

    if (editInstallPicker) editInstallPicker.close();
    UI.closeModal('editModal');
    if (changes.length) {
      pushEditLog(row.uuid, changes, pick(OPERATORS, Date.now() % 97));
      showToast('提交成功');
    } else {
      showToast('未修改任何内容');
    }
    renderTable();
  }

  function openLogDrawer(row) {
    if (!row) return;
    var logs = EDIT_LOGS[row.uuid] || [];
    var body = $('logDrawerBody');
    $('logDrawerTitle').textContent = '编辑日志';
    if (!logs.length) {
      body.innerHTML = '<div class="log-table__empty">暂无编辑日志</div>';
    } else {
      body.innerHTML =
        '<div class="log-table-shell"><table class="log-table">' +
          '<colgroup><col style="width:168px"/><col style="width:88px"/><col style="width:200px"/><col/></colgroup>' +
          '<thead><tr><th>操作时间</th><th>操作人</th><th>UUID</th><th>变更内容</th></tr></thead>' +
          '<tbody>' +
          logs.map(function (log) {
            var changeHtml = (log.changes || []).map(function (c) {
              return '<div class="log-table__change-item">' +
                escapeHtml(c.field) + '：' + escapeHtml(c.from) + ' → ' + escapeHtml(c.to) +
              '</div>';
            }).join('') || '-';
            return '<tr>' +
              '<td>' + escapeHtml(log.time) + '</td>' +
              '<td>' + escapeHtml(log.operator) + '</td>' +
              '<td class="log-table__uuid" title="' + escapeHtml(row.uuid) + '">' + escapeHtml(row.uuid) + '</td>' +
              '<td><div class="log-table__change">' + changeHtml + '</div></td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>';
    }
    UI.openDrawer('logDrawer');
  }

  function closeLogDrawer() {
    UI.closeDrawer('logDrawer');
  }

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (editInstallPicker) editInstallPicker.close();
      UI.closeModal('editModal');
    });
  });
  $('editSubmit').addEventListener('click', submitEdit);
  $('logDrawerClose').addEventListener('click', closeLogDrawer);
  $('logDrawerCancel').addEventListener('click', closeLogDrawer);
  $('logDrawer').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeLogDrawer();
  });

  var sandboxConfirmPending = null;

  function openSandboxConfirm(row) {
    var turningOn = !row.sandbox;
    sandboxConfirmPending = { uuid: row.uuid, next: turningOn };
    $('sandboxConfirmTitle').textContent = turningOn ? '开启确认' : '关闭确认';
    $('sandboxConfirmBody').textContent = turningOn ? '确认开启沙箱状态吗？' : '确认关闭沙箱状态吗？';
    UI.openModal('sandboxConfirmModal');
  }

  function confirmSandboxToggle() {
    if (!sandboxConfirmPending) return;
    var uid = sandboxConfirmPending.uuid;
    var next = sandboxConfirmPending.next;
    var row = ALL_ROWS.find(function (r) { return r.uuid === uid; });
    sandboxConfirmPending = null;
    UI.closeModal('sandboxConfirmModal');
    if (!row) return;
    var prev = !!row.sandbox;
    row.sandbox = next;
    pushEditLog(row.uuid, [{
      field: '沙箱',
      from: prev ? '开启' : '关闭',
      to: next ? '开启' : '关闭'
    }]);
    renderTable();
    showToast(next ? '已开启沙箱环境' : '已关闭沙箱环境');
  }

  document.querySelectorAll('[data-close="sandboxConfirmModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      sandboxConfirmPending = null;
      UI.closeModal('sandboxConfirmModal');
    });
  });

  $('sandboxConfirmOk').addEventListener('click', confirmSandboxToggle);

  document.addEventListener('click', function (e) {
    var actionBtn = e.target.closest('[data-action]');
    if (actionBtn && $('userTable') && $('userTable').contains(actionBtn)) {
      if (actionBtn.disabled || actionBtn.classList.contains('is-disabled')) return;
      var action = actionBtn.getAttribute('data-action');
      var actionUuid = actionBtn.getAttribute('data-uuid');
      var actionRow = ALL_ROWS.find(function (r) { return r.uuid === actionUuid; });
      if (!actionRow) return;
      if (action === 'edit') openEditModal(actionRow);
      else if (action === 'log') openLogDrawer(actionRow);
      return;
    }

    var sandboxBtn = e.target.closest('[data-sandbox-toggle]');
    if (sandboxBtn) {
      var uid = sandboxBtn.getAttribute('data-sandbox-toggle');
      var row = ALL_ROWS.find(function (r) { return r.uuid === uid; });
      if (!row) return;
      openSandboxConfirm(row);
      return;
    }
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var text = btn.getAttribute('data-copy') || '';
    if (!text) return;
    UI.copyText(text);
  });

  applyQuery();
})();
