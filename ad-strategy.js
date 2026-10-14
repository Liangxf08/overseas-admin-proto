/* 广告策略 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var ALL_ROWS = Store.policies();
  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png'
  };
  var NUMBER_OPS = [
    { value: 'gte', label: '大于等于', symbol: '≥' },
    { value: 'lte', label: '小于等于', symbol: '≤' },
    { value: 'eq', label: '等于', symbol: '=' }
  ];
  var DEFAULT_NUMBER_OP = 'gte';

  function fieldNumberOp(field) {
    var op = field && field.numberOp;
    return NUMBER_OPS.some(function (o) { return o.value === op; }) ? op : DEFAULT_NUMBER_OP;
  }

  function numberOpMeta(op) {
    var i;
    for (i = 0; i < NUMBER_OPS.length; i++) {
      if (NUMBER_OPS[i].value === op) return NUMBER_OPS[i];
    }
    return NUMBER_OPS[0];
  }

  var COL_PREFS_KEY = 'hwzt_ad_strategy_cols_v4';
  var COLUMN_GROUPS = ['属性', '条件', '数据'];
  var FORCE_FROZEN_KEYS = ['scene', 'versions', 'countries', 'userType', 'abSwitch'];
  var BASE_COLUMNS = [
    { key: 'scene', name: '广告场景', width: 160, group: '属性' },
    { key: 'versions', name: 'APP版本', width: 100, group: '属性' },
    { key: 'countries', name: '国家地区', width: 100, group: '属性' },
    { key: 'userType', name: '用户类型', width: 100, group: '属性' },
    { key: 'abSwitch', name: '分流开关', width: 100, group: '属性' },
    { key: 'id', name: '策略ID', width: 100, group: '属性' },
    { key: 'splitRatio', name: '分流比例', width: 100, group: '属性' },
    { key: 'adSwitch', name: '广告开关', width: 100, group: '属性' }
  ];
  var DATA_COLUMNS = [
    { key: 'dau', name: '触达用户', width: 100, group: '数据', format: 'int' },
    { key: 'ad_show_request', name: '展示请求', width: 100, group: '数据', format: 'int' },
    { key: 'ad_show_success', name: '展示成功', width: 100, group: '数据', format: 'int' },
    { key: 'ad_show_rate', name: '展示率', width: 100, group: '数据', format: 'percent' },
    { key: 'ad_show_click', name: '点击数', width: 100, group: '数据', format: 'int' },
    { key: 'ad_click_rate', name: '点击率', width: 100, group: '数据', format: 'percent' },
    { key: 'ad_revenue', name: '预估收益', width: 112, group: '数据', format: 'num2' },
    { key: 'ad_ecpm', name: 'eCPM', width: 100, group: '数据', format: 'num4' },
    { key: 'ad_arpdau', name: 'ARPDAU', width: 100, group: '数据', format: 'num4' },
    { key: 'ad_ipeu', name: 'IPEU', width: 100, group: '数据', format: 'num2' }
  ];
  var DEFAULT_FROZEN_COUNT = FORCE_FROZEN_KEYS.length;

  var state = {
    draft: { productId: '', sceneId: '', dateStart: null, dateEnd: null },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    columns: BASE_COLUMNS.map(function (c) { return c.key; }),
    frozenCount: DEFAULT_FROZEN_COUNT,
    metricDraft: [],
    metricFrozenCount: DEFAULT_FROZEN_COUNT,
    metricCat: COLUMN_GROUPS[0],
    dragMetricKey: null,
    editMode: 'add',
    editId: null,
    editProductId: '',
    editSceneId: '',
    editUserType: '全用户',
    editCountries: [],
    editVersions: [],
    editAbOn: false,
    editSplits: [],
    deleteId: null
  };

  function platformIconHtml(platform) {
    var src = platform && PLATFORM_ICONS[platform];
    if (!src) return '';
    return '<span class="select-option-icon"><img src="' + src + '" alt="" /></span>';
  }

  function appProductOptions() {
    var seen = {};
    var out = [];
    Store.apps().forEach(function (a) {
      if (seen[a.productId]) return;
      seen[a.productId] = true;
      var p = Store.productById(a.productId);
      if (p) out.push(p);
    });
    return out;
  }

  function sceneOptionsForProduct(productId) {
    if (productId) {
      return Store.scenesForProduct(productId).map(function (s) {
        return { value: s.id, label: s.name };
      });
    }
    return Store.scenes().map(function (s) {
      return { value: s.id, label: s.name };
    });
  }

  function fillProductPanel(panelId, products, selectedId) {
    var el = $(panelId);
    if (!el) return;
    el.innerHTML = (products || []).map(function (p) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(p.id) + '" title="' + escapeHtml(p.name) + '">' +
        platformIconHtml(p.platform) +
        '<span class="select-option-text">' + escapeHtml(p.name) + '</span>' +
      '</button>';
    }).join('');
    el.querySelectorAll('.single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(selectedId || ''));
    });
  }

  function fillScenePanel(panelId, productId, selectedId) {
    var el = $(panelId);
    if (!el) return;
    var items = sceneOptionsForProduct(productId);
    el.innerHTML = items.map(function (it) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(it.value) + '" title="' + escapeHtml(it.label) + '">' +
        '<span class="select-option-text">' + escapeHtml(it.label) + '</span></button>';
    }).join('');
    el.querySelectorAll('.single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(selectedId || ''));
    });
  }

  function syncProductLabel(labelId, wrapId, panelId, value, placeholder) {
    var label = $(labelId);
    var wrap = $(wrapId);
    var panel = $(panelId);
    if (!label) return;
    if (!value) {
      label.innerHTML = (placeholder || '') + '<span class="muted">请选择</span>';
      if (wrap) wrap.classList.remove('has-value');
    } else {
      var p = Store.productById(value);
      var name = p ? p.name : value;
      label.innerHTML = (placeholder || '') +
        '<span class="select-option-text" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</span>';
      if (wrap) wrap.classList.add('has-value');
    }
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }
  }

  function applyFilters() {
    state.applied = {
      productId: state.draft.productId || '',
      sceneId: state.draft.sceneId || '',
      dateStart: state.draft.dateStart,
      dateEnd: state.draft.dateEnd
    };
    state.page = 1;
  }

  function byPriorityAsc(a, b) {
    var pa = Number(a.priority);
    var pb = Number(b.priority);
    if (!isFinite(pa)) pa = 9999;
    if (!isFinite(pb)) pb = 9999;
    if (pa !== pb) return pa - pb;
    if (a.updatedAt > b.updatedAt) return -1;
    if (a.updatedAt < b.updatedAt) return 1;
    return 0;
  }

  function sceneOrderIndex(productId, sceneId) {
    var scenes = Store.scenesForProduct(productId);
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === sceneId) return i;
    }
    return 9999;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f || !f.productId) return [];
    var productId = f.productId;
    return ALL_ROWS.filter(function (row) {
      if (row.productId !== productId) return false;
      if (f.sceneId && row.sceneId !== f.sceneId) return false;
      return true;
    }).sort(function (a, b) {
      var ia = sceneOrderIndex(productId, a.sceneId);
      var ib = sceneOrderIndex(productId, b.sceneId);
      if (ia !== ib) return ia - ib;
      return byPriorityAsc(a, b);
    });
  }

  function formatDateLabel(d) {
    if (!d) return '';
    var x = d instanceof Date ? d : new Date(d);
    if (isNaN(x.getTime())) return '';
    var m = x.getMonth() + 1;
    var day = x.getDate();
    return x.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function pickDefaultContext() {
    var products = appProductOptions();
    if (!products.length) return;
    var preferred = null;
    products.some(function (p) {
      var hit = ALL_ROWS.some(function (r) { return r.productId === p.id; });
      if (hit) { preferred = p; return true; }
      return false;
    });
    var product = preferred || products[0];
    state.draft.productId = product.id;
    state.draft.sceneId = '';
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function normalizeUserType(v) {
    if (v === '全部' || !v) return '全用户';
    return v;
  }

  function targetingText(row) {
    var parts = [];
    if (row.countries && row.countries.length) parts.push(row.countries.join('、'));
    var ut = normalizeUserType(row.userType);
    if (ut && ut !== '全用户') parts.push(ut);
    if (row.versions && row.versions.length) parts.push('版本 ' + row.versions.join('/'));
    return parts.length ? parts.join(' · ') : '全用户';
  }

  function splitText(row) {
    return (row.splits || []).map(function (g) {
      return (g.name || '分流组') + ' ' + g.percent + '%';
    }).join(' / ') || '-';
  }

  function isFrozenKey(key) {
    return FORCE_FROZEN_KEYS.indexOf(key) !== -1;
  }

  function fieldColKey(fieldId) {
    return 'f:' + fieldId;
  }

  function parseFieldColKey(key) {
    return key.indexOf('f:') === 0 ? key.slice(2) : '';
  }

  function currentConditionCols() {
    var f = state.applied || state.draft;
    if (!f || !f.productId) return [];
    var sceneIds = [];
    if (f.sceneId) {
      sceneIds = [f.sceneId];
    } else {
      sceneIds = Store.scenesForProduct(f.productId).map(function (s) { return s.id; });
    }
    var seen = {};
    var cols = [];
    sceneIds.forEach(function (sid) {
      Store.sceneFieldModels(Store.sceneById(sid)).forEach(function (field) {
        if (seen[field.id]) return;
        seen[field.id] = true;
        cols.push({
          key: fieldColKey(field.id),
          name: field.name,
          width: 140,
          group: '条件',
          fieldId: field.id,
          defaultSelected: Store.strategyFieldDefaultSelected(field.id)
        });
      });
    });
    cols.sort(function (a, b) {
      return Store.strategyFieldIndex(a.fieldId) - Store.strategyFieldIndex(b.fieldId);
    });
    return cols;
  }

  function defaultVisibleKeys() {
    var keys = BASE_COLUMNS.map(function (c) { return c.key; });
    currentConditionCols().forEach(function (c) {
      if (c.defaultSelected) keys.push(c.key);
    });
    return keys;
  }

  function insertByDefaultOrder(list, key, indexOf) {
    var at = list.length;
    var target = indexOf(key);
    for (var i = 0; i < list.length; i++) {
      if (indexOf(list[i]) > target) { at = i; break; }
    }
    list.splice(at, 0, key);
  }

  function allColumnItems() {
    return BASE_COLUMNS.concat(currentConditionCols(), DATA_COLUMNS);
  }

  function columnMap() {
    var map = {};
    allColumnItems().forEach(function (c) { map[c.key] = c; });
    return map;
  }

  function minFrozenCount(keys) {
    var n = 0;
    (keys || []).forEach(function (k) {
      if (isFrozenKey(k)) n += 1;
    });
    return Math.max(n, FORCE_FROZEN_KEYS.length);
  }

  function normalizeColumns(keys, known) {
    var items = allColumnItems();
    var indexOf = {};
    items.forEach(function (c, i) { indexOf[c.key] = i; });
    var knownSet = {};
    (known || keys || []).forEach(function (k) { knownSet[k] = true; });
    var out = [];
    var seen = {};
    (keys || []).forEach(function (k) {
      if (indexOf[k] == null || seen[k]) return;
      out.push(k);
      seen[k] = true;
    });
    function place(key) {
      if (seen[key] || indexOf[key] == null) return;
      insertByDefaultOrder(out, key, function (k) { return indexOf[k]; });
      seen[key] = true;
    }
    FORCE_FROZEN_KEYS.forEach(place);
    items.forEach(function (c) {
      if (knownSet[c.key]) return;
      if (c.defaultSelected || isFrozenKey(c.key)) place(c.key);
    });
    return out;
  }

  function loadColumnPrefs() {
    try {
      var raw = localStorage.getItem(COL_PREFS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveColumnPrefs() {
    try {
      var known = {};
      var prev = loadColumnPrefs();
      (prev && prev.known || []).forEach(function (k) { known[k] = true; });
      allColumnItems().forEach(function (c) { known[c.key] = true; });
      localStorage.setItem(COL_PREFS_KEY, JSON.stringify({
        columns: state.columns,
        frozenCount: state.frozenCount,
        known: Object.keys(known)
      }));
    } catch (e) { /* ignore */ }
  }

  function syncColumnsForScene() {
    var prefs = loadColumnPrefs();
    if (!prefs || !prefs.columns) {
      state.columns = defaultVisibleKeys();
      state.frozenCount = FORCE_FROZEN_KEYS.length;
      return;
    }
    state.columns = normalizeColumns(prefs.columns, prefs.known);
    state.frozenCount = Math.max(
      minFrozenCount(state.columns),
      Math.min(prefs.frozenCount != null ? prefs.frozenCount : DEFAULT_FROZEN_COUNT, state.columns.length)
    );
  }

  function onOffTag(on, onText, offText) {
    return '<span class="tag tag--' + (on ? 'enabled' : 'disabled') + '">' +
      (on ? (onText || '开') : (offText || '关')) + '</span>';
  }

  var TARGET_MERGE_COL_KEYS = {
    countries: true,
    versions: true,
    userType: true,
    abSwitch: true
  };

  function isAbRow(row) {
    return (row.splits || []).length > 1;
  }

  function formatMatchList(list, all) {
    var items = list || [];
    if (!items.length) return '全部';
    if (all && all.length && items.length >= all.length) {
      var set = {};
      items.forEach(function (c) { set[c] = true; });
      if (all.every(function (c) { return set[c]; })) return '全部';
    }
    return items.join('、');
  }

  function formatCountriesText(row) {
    return formatMatchList(row.countries, Store.COUNTRIES);
  }

  function formatVersionsText(row) {
    return formatMatchList(row.versions, Store.APP_VERSIONS);
  }

  function formatConditionValue(field, value, op, style) {
    if (!field) return value == null || value === '' ? '-' : String(value);
    if (Store.isSwitchField(field)) {
      var on = value === true || value === 'true' || value === '是';
      return on ? '是' : '否';
    }
    if (field.componentType === 'Array') {
      return Array.isArray(value) ? ('Array(' + value.length + ')') : (value == null || value === '' ? '-' : 'Array');
    }
    if (field.componentType === '下拉选择' && field.options) {
      var hit = field.options.filter(function (o) { return String(o.value) === String(value); })[0];
      if (hit) return hit.label;
    }
    if (value == null || value === '') return '-';
    if (field.componentType === '数字输入') {
      var meta = numberOpMeta(NUMBER_OPS.some(function (o) { return o.value === op; }) ? op : fieldNumberOp(field));
      return (style === 'full' ? meta.label : meta.symbol) + ' ' + value;
    }
    return String(value);
  }

  function conditionParts(field, g) {
    var value = g && g.values && field ? g.values[field.id] : undefined;
    var op = g && g.numberOps && field ? g.numberOps[field.id] : '';
    return {
      text: formatConditionValue(field, value, op),
      full: formatConditionValue(field, value, op, 'full')
    };
  }

  function conditionCellHtml(row, fieldId, splitIndex) {
    var field = Store.fieldById(fieldId);
    var splits = row.splits || [];
    if (!splits.length) return '-';
    function span(g) {
      var part = conditionParts(field, g);
      return '<span title="' + escapeHtml(part.full) + '">' + escapeHtml(part.text) + '</span>';
    }
    if (splitIndex != null) return span(splits[splitIndex]);
    if (splits.length === 1) return span(splits[0]);
    var parts = splits.map(function (g) { return conditionParts(field, g); });
    var text = parts.map(function (p) { return p.text; }).join(' / ');
    var full = parts.map(function (p) { return p.full; }).join(' / ');
    return '<span title="' + escapeHtml(full) + '">' + escapeHtml(text) + '</span>';
  }

  function metricSeed(row, splitIndex, key) {
    var s = splitStrategyId(row, splitIndex) + '|' + (row.sceneId || '') + '|' + key;
    var h = 0;
    var i;
    for (i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function metricBundle(row, splitIndex) {
    var h = metricSeed(row, splitIndex, 'base');
    var dau = 800 + (h % 4200);
    var request = dau * (3 + (h % 5));
    var success = Math.round(request * (0.62 + (h % 28) / 100));
    var clicks = Math.max(1, Math.round(success * (0.012 + (h % 18) / 1000)));
    var revenue = clicks * (0.03 + (h % 12) / 100);
    return {
      dau: dau,
      ad_show_request: request,
      ad_show_success: success,
      ad_show_click: clicks,
      ad_revenue: revenue,
      ad_show_rate: request ? success / request * 100 : 0,
      ad_click_rate: success ? clicks / success * 100 : 0,
      ad_ecpm: success ? revenue / success * 1000 : 0,
      ad_arpdau: dau ? revenue / dau : 0,
      ad_ipeu: dau ? success / dau : 0
    };
  }

  function formatMetric(col, row, splitIndex) {
    var pack = metricBundle(row, splitIndex);
    var n = pack[col.key];
    if (n == null || !isFinite(n)) return '-';
    if (col.format === 'int') return String(Math.round(n));
    if (col.format === 'percent') return n.toFixed(2) + '%';
    if (col.format === 'num4') return n.toFixed(4);
    return n.toFixed(2);
  }

  function cellHtml(col, row, splitIndex) {
    var scene = Store.sceneById(row.sceneId);
    if (col.key === 'scene') {
      var sn = Store.sceneName(row.sceneId);
      return '<span title="' + escapeHtml(sn) + '">' + escapeHtml(sn) + '</span>';
    }
    if (col.key === 'countries') {
      var countries = formatCountriesText(row);
      return '<span class="cell-ellipsis" title="' + escapeHtml(countries) + '">' + escapeHtml(countries) + '</span>';
    }
    if (col.key === 'versions') {
      var vers = formatVersionsText(row);
      return '<span class="cell-ellipsis" title="' + escapeHtml(vers) + '">' + escapeHtml(vers) + '</span>';
    }
    if (col.key === 'userType') {
      return escapeHtml(normalizeUserType(row.userType));
    }
    if (col.key === 'abSwitch') {
      return onOffTag(isAbRow(row));
    }
    if (col.key === 'id') {
      var strategyId = splitStrategyId(row, splitIndex);
      return '<span class="cell-ellipsis" title="' + escapeHtml(strategyId) + '">' + escapeHtml(strategyId) + '</span>';
    }
    if (col.key === 'splitRatio') {
      var splits = row.splits || [];
      var ratio;
      if (splitIndex != null) {
        var g = splits[splitIndex];
        ratio = g ? ((g.percent == null ? 0 : g.percent) + '%') : '-';
      } else {
        ratio = splits.map(function (x) { return (x.percent == null ? 0 : x.percent) + '%'; }).join(' / ') || '-';
      }
      return '<span title="' + escapeHtml(ratio) + '">' + escapeHtml(ratio) + '</span>';
    }
    if (col.key === 'adSwitch') {
      return onOffTag(scene && scene.adSwitch === true);
    }
    if (col.group === '数据') {
      var metric = formatMetric(col, row, splitIndex);
      return '<span class="cell-num" title="' + escapeHtml(metric) + '">' + escapeHtml(metric) + '</span>';
    }
    var fid = parseFieldColKey(col.key);
    if (fid) return conditionCellHtml(row, fid, splitIndex);
    return '-';
  }

  function tdAttrs(col, idx, freezeCount, freezeOffsets, rowspan) {
    var frozen = idx < freezeCount;
    var cls = [];
    if (frozen) cls.push('is-freeze');
    if (col.group === '数据') cls.push('col-num');
    var style = frozen ? 'left:' + freezeOffsets[col.key] + 'px' : '';
    var html = '<td';
    if (cls.length) html += ' class="' + cls.join(' ') + '"';
    if (rowspan && rowspan > 1) html += ' rowspan="' + rowspan + '"';
    if (style) html += ' style="' + style + '"';
    return html + '>';
  }

  function actionCellHtml(rowspan) {
    return '<td class="col-action"' + (rowspan > 1 ? ' rowspan="' + rowspan + '"' : '') + '>' +
      '<span class="action-links">' +
        '<button class="link" type="button" data-action="edit">编辑</button>' +
        '<button class="link" type="button" data-action="copy">复制</button>' +
        '<button class="link link--danger" type="button" data-action="delete">删除</button>' +
      '</span></td>';
  }

  pickDefaultContext();
  fillProductPanel('productPanel', appProductOptions(), state.draft.productId);
  fillScenePanel('scenePanel', state.draft.productId, state.draft.sceneId);

  var dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '日期：',
    defaultShortcut: 'last7',
    onChange: function (start, end) {
      state.draft.dateStart = start;
      state.draft.dateEnd = end;
    }
  });
  if (dateApi) {
    state.draft.dateStart = dateApi.getStart();
    state.draft.dateEnd = dateApi.getEnd();
  }

  var productFilter = UI.bindSingleSelect({
    wrapId: 'productWrap', triggerId: 'productTrigger', panelId: 'productPanel',
    labelId: 'productLabel', clearId: 'productClear', prefix: '产品：',
    getValue: function () { return state.draft.productId; },
    formatValue: function (id) { return Store.productName(id); },
    onChange: function (v) {
      state.draft.productId = v || '';
      state.draft.sceneId = '';
      fillScenePanel('scenePanel', state.draft.productId, state.draft.sceneId);
      if (sceneFilter && sceneFilter.syncLabel) sceneFilter.syncLabel('');
      setTimeout(function () {
        syncProductLabel('productLabel', 'productWrap', 'productPanel', state.draft.productId, '产品：');
      }, 0);
      applyFilters();
      renderTable();
    }
  });
  setTimeout(function () {
    syncProductLabel('productLabel', 'productWrap', 'productPanel', state.draft.productId, '产品：');
  }, 0);

  var sceneFilter = UI.bindSingleSelect({
    wrapId: 'sceneWrap', triggerId: 'sceneTrigger', panelId: 'scenePanel',
    labelId: 'sceneLabel', clearId: 'sceneClear', prefix: '场景：',
    getValue: function () { return state.draft.sceneId; },
    formatValue: function (id) { return Store.sceneName(id); },
    onChange: function (v) {
      state.draft.sceneId = v || '';
      applyFilters();
      renderTable();
    }
  });
  if (sceneFilter && sceneFilter.syncLabel) sceneFilter.syncLabel(state.draft.sceneId);

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap', triggerId: 'editProductTrigger', panelId: 'editProductPanel',
    labelId: 'editProductLabel', clearId: 'editProductClear',
    getValue: function () { return state.editProductId; },
    formatValue: function (id) { return Store.productName(id); },
    onChange: function (v) {
      collectSplitsFromDom();
      state.editProductId = v || '';
      var allowed = sceneOptionsForProduct(state.editProductId).some(function (s) { return s.value === state.editSceneId; });
      if (!allowed) {
        state.editSceneId = '';
        resetSplitsForScene();
      }
      fillScenePanel('editScenePanel', state.editProductId, state.editSceneId);
      if (editSceneSelect && editSceneSelect.syncLabel) editSceneSelect.syncLabel(state.editSceneId);
      setTimeout(function () {
        syncProductLabel('editProductLabel', 'editProductWrap', 'editProductPanel', state.editProductId, '');
      }, 0);
      renderSplits();
    }
  });

  var editSceneSelect = UI.bindSingleSelect({
    wrapId: 'editSceneWrap', triggerId: 'editSceneTrigger', panelId: 'editScenePanel',
    labelId: 'editSceneLabel', clearId: 'editSceneClear',
    getValue: function () { return state.editSceneId; },
    formatValue: function (id) { return Store.sceneName(id); },
    onChange: function (v) {
      collectSplitsFromDom();
      state.editSceneId = v || '';
      resetSplitsForScene();
      renderSplits();
    }
  });

  var versionMulti = UI.bindMultiSelect({
    wrapId: 'editVersionWrap',
    triggerId: 'editVersionTrigger',
    panelId: 'editVersionPanel',
    labelId: 'editVersionLabel',
    listId: 'editVersionList',
    selectedId: 'editVersionSelected',
    searchId: 'editVersionSearch',
    countId: 'editVersionCount',
    selectAllId: 'editVersionSelectAll',
    clearId: 'editVersionClear',
    getOptions: function () { return Store.APP_VERSIONS; },
    getSelected: function () { return state.editVersions; },
    setSelected: function (arr) { state.editVersions = arr || []; }
  });

  $('editVersionPanelClear').addEventListener('click', function () {
    state.editVersions = [];
    if (versionMulti && versionMulti.render) versionMulti.render();
  });

  var countryMulti = UI.bindMultiSelect({
    wrapId: 'editCountryWrap',
    triggerId: 'editCountryTrigger',
    panelId: 'editCountryPanel',
    labelId: 'editCountryLabel',
    listId: 'editCountryList',
    selectedId: 'editCountrySelected',
    searchId: 'editCountrySearch',
    countId: 'editCountryCount',
    selectAllId: 'editCountrySelectAll',
    clearId: 'editCountryClear',
    getOptions: function () { return Store.COUNTRIES; },
    getSelected: function () { return state.editCountries; },
    setSelected: function (arr) { state.editCountries = arr || []; }
  });

  $('editCountryPanelClear').addEventListener('click', function () {
    state.editCountries = [];
    if (countryMulti && countryMulti.render) countryMulti.render();
  });

  UI.bindSeg('editUserTypeSeg', function (v) { state.editUserType = v || '全用户'; });
  UI.bindFormHelp();

  function setItemError(id, on, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle('is-error', !!on);
    if (on && msg) {
      var err = el.querySelector('.form-item__error');
      if (err) err.textContent = msg;
    }
  }

  function clearEditErrors() {
    ['editProductItem', 'editSceneItem', 'editSplitItem'].forEach(function (id) {
      setItemError(id, false);
    });
    var splitErr = $('editSplitError');
    if (splitErr) splitErr.style.display = 'none';
  }

  function currentSceneFields() {
    return Store.sceneFieldModels(Store.sceneById(state.editSceneId));
  }

  function defaultValues() {
    var values = {};
    currentSceneFields().forEach(function (f) {
      values[f.id] = Store.defaultFieldValue(f);
    });
    return values;
  }

  function emptySplit(name, percent) {
    return {
      id: UI.uid('g'),
      strategyId: String(nextPolicyId()),
      name: name || '默认组',
      percent: percent == null ? 100 : percent,
      values: defaultValues()
    };
  }

  function ensureStrategyIds(groups) {
    (groups || []).forEach(function (g) {
      if (g.strategyId && /^\d+$/.test(String(g.strategyId))) return;
      g.strategyId = String(nextPolicyId());
    });
  }

  function ensureSplitValues(g) {
    var defaults = defaultValues();
    var next = {};
    var ops = {};
    Object.keys(defaults).forEach(function (fid) {
      next[fid] = g.values && g.values[fid] != null ? g.values[fid] : defaults[fid];
    });
    g.values = next;
    currentSceneFields().forEach(function (f) {
      if (f.componentType !== '数字输入') return;
      var prev = g.numberOps && g.numberOps[f.id];
      ops[f.id] = NUMBER_OPS.some(function (o) { return o.value === prev; }) ? prev : fieldNumberOp(f);
    });
    g.numberOps = ops;
  }

  function resetSplitsForScene() {
    if (!state.editSceneId) {
      state.editSplits = [];
      return;
    }
    if (state.editAbOn) {
      if (state.editSplits.length >= 2) {
        state.editSplits = state.editSplits.slice(0, 2);
        state.editSplits[0].name = state.editSplits[0].name || '对照组';
        state.editSplits[1].name = state.editSplits[1].name || '实验组';
      } else if (state.editSplits.length === 1) {
        var base = state.editSplits[0];
        base.name = '对照组';
        base.percent = 50;
        state.editSplits = [base, emptySplit('实验组', 50)];
      } else {
        var first = emptySplit('对照组', 50);
        state.editSplits = [first];
        state.editSplits.push(emptySplit('实验组', 50));
      }
    } else {
      if (state.editSplits.length) {
        state.editSplits = [state.editSplits[0]];
        state.editSplits[0].name = state.editSplits[0].name || '默认组';
        state.editSplits[0].percent = 100;
      } else {
        state.editSplits = [emptySplit('默认组', 100)];
      }
    }
    state.editSplits.forEach(ensureSplitValues);
    ensureStrategyIds(state.editSplits);
  }

  function syncAbSwitch() {
    var btn = $('editAbSwitch');
    if (!btn) return;
    btn.classList.toggle('is-on', !!state.editAbOn);
    btn.setAttribute('aria-pressed', state.editAbOn ? 'true' : 'false');
  }

  function setAbOn(on) {
    collectSplitsFromDom();
    state.editAbOn = !!on;
    syncAbSwitch();
    resetSplitsForScene();
    renderSplits();
  }

  $('editAbSwitch').addEventListener('click', function () {
    setAbOn(!state.editAbOn);
  });

  function splitPercentSum() {
    return state.editSplits.reduce(function (s, g) { return s + (Number(g.percent) || 0); }, 0);
  }

  function updateSplitSum() {
    var sum = splitPercentSum();
    var el = $('splitSum');
    if (!el) return;
    el.hidden = !state.editSceneId || !state.editAbOn;
    el.textContent = '流量合计需为 100%，当前 ' + sum + '%';
    el.classList.toggle('is-error', sum !== 100);
  }

  function collectSplitsFromDom() {
    state.editSplits.forEach(function (g, i) {
      var nameEl = document.querySelector('[data-split-name="' + i + '"]');
      var pctEl = document.querySelector('[data-split-pct="' + i + '"]');
      if (nameEl) g.name = (nameEl.value || '').trim();
      if (pctEl) g.percent = parseInt(pctEl.value, 10);
      if (!isFinite(g.percent)) g.percent = 0;
      document.querySelectorAll('[data-split-val="' + i + '"]').forEach(function (inp) {
        var fid = inp.getAttribute('data-field');
        var field = Store.fieldById(fid);
        if (field && field.componentType === '数字输入') {
          var n = Number(inp.value);
          g.values[fid] = inp.value === '' || !isFinite(n) ? inp.value : n;
        } else {
          g.values[fid] = inp.value;
        }
      });
      document.querySelectorAll('[data-split-op="' + i + '"]').forEach(function (box) {
        var fid = box.getAttribute('data-field');
        if (!g.numberOps) g.numberOps = {};
        var op = box.getAttribute('data-value');
        g.numberOps[fid] = NUMBER_OPS.some(function (o) { return o.value === op; }) ? op : fieldNumberOp(Store.fieldById(fid));
      });
      document.querySelectorAll('[data-split-switch="' + i + '"]').forEach(function (btn) {
        var fid = btn.getAttribute('data-field');
        g.values[fid] = btn.classList.contains('is-on');
      });
      document.querySelectorAll('[data-split-select="' + i + '"]').forEach(function (box) {
        var fid = box.getAttribute('data-field');
        g.values[fid] = box.getAttribute('data-value') || '';
      });
    });
  }

  function fieldControlHtml(f, g, i) {
    var val = g.values && g.values[f.id] != null ? g.values[f.id] : Store.defaultFieldValue(f);
    if (Store.isSwitchField(f)) {
      var on = val === true || val === 'true' || val === '是';
      return '<button class="switch' + (on ? ' is-on' : '') + '" type="button" data-split-switch="' + i + '" data-field="' + escapeHtml(f.id) + '" aria-label="' + escapeHtml(f.name) + '" aria-pressed="' + (on ? 'true' : 'false') + '"></button>';
    }
    if (f.componentType === '下拉选择') {
      var current = (f.options || []).filter(function (o) { return String(o.value) === String(val); })[0];
      var currentLabel = current ? current.label : '请选择';
      var options = (f.options || []).map(function (o) {
        var active = String(o.value) === String(val) ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' + escapeHtml(String(o.value)) + '">' + escapeHtml(o.label) + '</button>';
      }).join('');
      return '<div class="split-select" data-split-select="' + i + '" data-field="' + escapeHtml(f.id) + '" data-value="' + escapeHtml(String(val == null ? '' : val)) + '">' +
        '<button class="select-trigger" type="button">' +
          '<span class="select-trigger__text' + (current ? '' : ' muted') + '">' + escapeHtml(currentLabel) + '</span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<div class="single-panel">' + options + '</div>' +
      '</div>';
    }
    if (f.componentType === 'Array') {
      var n = Array.isArray(val) ? val.length : 0;
      return '<button class="link split-array-btn" type="button" data-array-open="' + i + '" data-field="' + escapeHtml(f.id) + '">配置（' + n + '）</button>';
    }
    if (f.componentType === '数字输入') return numberOpControlHtml(f, g, i, val);
    return '<input class="input" data-split-val="' + i + '" data-field="' + escapeHtml(f.id) + '" value="' + escapeHtml(String(val == null ? '' : val)) + '" placeholder="请输入" />';
  }

  function numberOpControlHtml(f, g, i, val) {
    var op = g && g.numberOps && NUMBER_OPS.some(function (o) { return o.value === g.numberOps[f.id]; })
      ? g.numberOps[f.id]
      : fieldNumberOp(f);
    var meta = numberOpMeta(op);
    var options = NUMBER_OPS.map(function (o) {
      var active = o.value === op ? ' is-active' : '';
      return '<button class="single-option' + active + '" type="button" data-value="' + o.value + '">' + escapeHtml(o.label) + '</button>';
    }).join('');
    return '<div class="number-op">' +
      '<div class="split-select split-select--op" data-split-op="' + i + '" data-field="' + escapeHtml(f.id) + '" data-value="' + op + '">' +
        '<button class="select-trigger" type="button" aria-label="计算方式">' +
          '<span class="select-trigger__text">' + escapeHtml(meta.label) + '</span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<div class="single-panel">' + options + '</div>' +
      '</div>' +
      '<input class="input" data-split-val="' + i + '" data-field="' + escapeHtml(f.id) + '" value="' + escapeHtml(String(val == null ? '' : val)) + '" placeholder="请输入" />' +
    '</div>';
  }

  function currentStrategyId() {
    if (state.editMode === 'edit' && state.editId) return String(state.editId);
    if (!state.previewPolicyId) state.previewPolicyId = String(nextPolicyId());
    return state.previewPolicyId;
  }

  function renderSplits() {
    closeSplitPanels();
    var el = $('splitList');
    var sumEl = $('splitSum');
    if (!state.editSceneId) {
      el.innerHTML = '<div class="form-item__hint">请先选择产品与场景，条件将按场景关联字段生成</div>';
      if (sumEl) sumEl.hidden = true;
      return;
    }
    var fields = currentSceneFields();
    var groups = state.editSplits;
    var multi = !!state.editAbOn && groups.length > 1;
    var heads = groups.map(function (g, i) {
      var pctDisabled = !state.editAbOn ? ' readonly' : '';
      ensureStrategyIds(groups);
      var title = (g.name || '分流组') + '（' + (g.strategyId || '') + '）';
      return '<div class="split-compare__head">' +
        '<span class="split-compare__name" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</span>' +
        '<div class="split-card__pct"><input class="input" data-split-pct="' + i + '" value="' + escapeHtml(String(g.percent == null ? '' : g.percent)) + '"' + pctDisabled + ' /><span class="split-card__pct-unit">%</span></div>' +
      '</div>';
    }).join('');
    var rows = fields.length
      ? fields.map(function (f) {
        var cells = groups.map(function (g, i) {
          return '<div class="split-compare__cell">' + fieldControlHtml(f, g, i) + '</div>';
        }).join('');
        return '<div class="split-compare__label" title="' + escapeHtml(f.desc || f.name) + '">' + escapeHtml(f.name) + '</div>' + cells;
      }).join('')
      : '<div class="split-compare__empty">该场景暂无关联条件</div>';
    el.innerHTML = '<div class="split-compare' + (multi ? '' : ' is-single') + '">' +
      '<div class="split-compare__corner">条件</div>' + heads + rows +
    '</div>';
    updateSplitSum();
  }

  $('splitList').addEventListener('input', function (e) {
    var pct = e.target.getAttribute('data-split-pct');
    if (pct != null) {
      var i = Number(pct);
      if (state.editSplits[i]) state.editSplits[i].percent = parseInt(e.target.value, 10) || 0;
      updateSplitSum();
    }
  });

  $('splitList').addEventListener('click', function (e) {
    var sw = e.target.closest('button.switch[data-split-switch]');
    if (sw) {
      var on = !sw.classList.contains('is-on');
      sw.classList.toggle('is-on', on);
      sw.setAttribute('aria-pressed', on ? 'true' : 'false');
      return;
    }
    var arrayBtn = e.target.closest('[data-array-open]');
    if (arrayBtn) openArrayModal(Number(arrayBtn.getAttribute('data-array-open')), arrayBtn.getAttribute('data-field'));
  });

  function splitPanelOf(box) {
    if (!box) return null;
    if (box._openPanel && box._openPanel._splitHome === box) return box._openPanel;
    return box.querySelector('.single-panel');
  }

  function clearSplitPanelStyle(panel) {
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.bottom = '';
    panel.style.width = '';
    panel.style.right = '';
    panel.style.zIndex = '';
    panel.style.margin = '';
  }

  function closeSplitPanels() {
    document.querySelectorAll('.single-panel').forEach(function (panel) {
      if (!panel._splitHome) return;
      panel.classList.remove('is-open', 'is-dropup');
      clearSplitPanelStyle(panel);
      if (panel._splitHome.isConnected) panel._splitHome.appendChild(panel);
      else panel.remove();
    });
    document.querySelectorAll('.split-select .select-trigger.is-open').forEach(function (btn) {
      btn.classList.remove('is-open');
    });
  }

  function placeSplitPanel(trigger, panel) {
    var box = trigger.closest('.split-select');
    panel._splitHome = box;
    box._openPanel = panel;
    document.body.appendChild(panel);
    panel.classList.add('is-open');
    panel.style.position = 'fixed';
    panel.style.zIndex = '1300';
    panel.style.margin = '0';
    panel.style.right = 'auto';
    var rect = trigger.getBoundingClientRect();
    panel.style.width = rect.width + 'px';
    panel.style.left = rect.left + 'px';
    var h = panel.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var dropup = spaceBelow < h + 8 && rect.top > h + 8;
    panel.classList.toggle('is-dropup', dropup);
    panel.style.bottom = 'auto';
    panel.style.top = (dropup ? rect.top - h - 4 : rect.bottom + 4) + 'px';
  }

  function toggleSplitPanel(trig) {
    var box = trig.closest('.split-select');
    var panel = splitPanelOf(box);
    var willOpen = !(panel && panel.classList.contains('is-open'));
    closeSplitPanels();
    if (willOpen && panel) {
      trig.classList.add('is-open');
      placeSplitPanel(trig, panel);
    }
  }

  function applySplitOption(box, opt, panel) {
    var value = opt.getAttribute('data-value') || '';
    box.setAttribute('data-value', value);
    var text = box.querySelector('.select-trigger__text');
    if (text) {
      text.textContent = (opt.textContent || '').trim();
      text.classList.remove('muted');
    }
    panel.querySelectorAll('.single-option').forEach(function (item) {
      item.classList.toggle('is-active', item === opt);
    });
  }

  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.single-option');
    var optPanel = opt && opt.closest('.single-panel');
    if (opt && optPanel && optPanel._splitHome) {
      applySplitOption(optPanel._splitHome, opt, optPanel);
      closeSplitPanels();
      return;
    }
    var trig = e.target.closest('.split-select .select-trigger');
    if (trig) {
      toggleSplitPanel(trig);
      return;
    }
    var openPanel = e.target.closest('.single-panel');
    if (openPanel && openPanel._splitHome) return;
    closeSplitPanels();
  });

  var editDrawerBody = document.querySelector('#editDrawer .drawer__body');
  if (editDrawerBody) editDrawerBody.addEventListener('scroll', closeSplitPanels);
  window.addEventListener('resize', closeSplitPanels);

  var arrayEdit = { splitIndex: -1, fieldId: '', rows: [] };

  var ARRAY_COLS = [
    { key: 'eventName', name: '事件名' },
    { key: 'code', name: '识别码' }
  ];

  function emptyArrayRow() {
    return { eventName: '', code: '' };
  }

  function collectArrayFromDom() {
    arrayEdit.rows.forEach(function (row, index) {
      ARRAY_COLS.forEach(function (col) {
        var input = document.querySelector('[data-array-val="' + index + '"][data-key="' + col.key + '"]');
        if (input) row[col.key] = input.value;
      });
    });
  }

  function renderArrayModal() {
    var head = $('arrayHead');
    var body = $('arrayBody');
    if (head) {
      head.innerHTML = '<tr>' + ARRAY_COLS.map(function (col) {
        return '<th>' + escapeHtml(col.name) + '</th>';
      }).join('') + '<th class="array-op">操作</th></tr>';
    }
    if (!body) return;
    if (!arrayEdit.rows.length) {
      body.innerHTML = '<tr><td class="array-empty" colspan="' + (ARRAY_COLS.length + 1) + '">暂无数据，可添加或导入</td></tr>';
      return;
    }
    body.innerHTML = arrayEdit.rows.map(function (row, index) {
      return '<tr>' + ARRAY_COLS.map(function (col) {
        return '<td><input class="input" data-array-val="' + index + '" data-key="' + col.key + '" value="' + escapeHtml(String(row[col.key] == null ? '' : row[col.key])) + '" placeholder="请输入" autocomplete="off" /></td>';
      }).join('') + '<td class="array-op"><button class="link link--danger" type="button" data-array-del="' + index + '">删除</button></td></tr>';
    }).join('');
  }

  function openArrayModal(splitIndex, fieldId) {
    collectSplitsFromDom();
    var field = Store.fieldById(fieldId);
    var g = state.editSplits[splitIndex];
    var raw = g && g.values ? g.values[fieldId] : [];
    arrayEdit = {
      splitIndex: splitIndex,
      fieldId: fieldId,
      rows: Array.isArray(raw) ? Store.clone(raw) : []
    };
    if ($('arrayModalTitle')) $('arrayModalTitle').textContent = field && field.name ? field.name : '配置数组子字段';
    renderArrayModal();
    UI.openModal('arrayModal');
  }

  function parseCsv(text) {
    return String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (line) {
      return line.trim();
    }).map(function (line) {
      return line.split(',').map(function (cell) { return cell.trim().replace(/^"|"$/g, ''); });
    });
  }

  $('arrayAdd').addEventListener('click', function () {
    collectArrayFromDom();
    arrayEdit.rows.push(emptyArrayRow());
    renderArrayModal();
  });

  $('arrayBody').addEventListener('click', function (e) {
    var del = e.target.closest('[data-array-del]');
    if (!del) return;
    collectArrayFromDom();
    arrayEdit.rows.splice(Number(del.getAttribute('data-array-del')), 1);
    renderArrayModal();
  });

  $('arrayTemplate').addEventListener('click', function () {
    var field = Store.fieldById(arrayEdit.fieldId);
    var header = ARRAY_COLS.map(function (col) {
      return '"' + col.name + '"';
    }).join(',');
    UI.downloadText((field && field.name ? field.name : '数组') + '_模板.csv', '\ufeff' + header + '\n', 'text/csv;charset=utf-8');
  });

  $('arrayImportBtn').addEventListener('click', function () { $('arrayFile').click(); });
  $('arrayFile').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var table = parseCsv(String(reader.result || ''));
      if (table.length < 2) {
        UI.showToast('未识别到可导入的数据行', 'warning');
        return;
      }
      var header = table[0];
      var indexByKey = {};
      ARRAY_COLS.forEach(function (col) {
        var at = header.indexOf(col.name);
        if (at >= 0) indexByKey[col.key] = at;
      });
      if (indexByKey.eventName == null && indexByKey.code == null) {
        UI.showToast('模板列应为：事件名、识别码', 'warning');
        return;
      }
      collectArrayFromDom();
      table.slice(1).forEach(function (line) {
        var row = emptyArrayRow();
        ARRAY_COLS.forEach(function (col) {
          var at = indexByKey[col.key];
          if (at != null && line[at] != null) row[col.key] = line[at];
        });
        arrayEdit.rows.push(row);
      });
      renderArrayModal();
      UI.showToast('已导入 ' + (table.length - 1) + ' 行', 'success');
    };
    reader.readAsText(file, 'utf-8');
  });

  $('arraySubmit').addEventListener('click', function () {
    collectArrayFromDom();
    var g = state.editSplits[arrayEdit.splitIndex];
    if (g) {
      if (!g.values) g.values = {};
      g.values[arrayEdit.fieldId] = Store.clone(arrayEdit.rows);
    }
    UI.closeModal('arrayModal');
    renderSplits();
  });

  function renderTable() {
    if (!state.applied) applyFilters();
    syncColumnsForScene();
    var map = columnMap();
    var cols = state.columns.map(function (k) { return map[k]; }).filter(Boolean);
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
    if (colgroup) {
      colgroup.innerHTML = cols.map(function (col) {
        return '<col data-col-width="' + (col.width || 112) + '" />';
      }).join('') + '<col data-col-width="160" />';
    }
    if (thead) {
      thead.innerHTML = '<tr>' + cols.map(function (col, idx) {
        var frozen = idx < freezeCount;
        var cls = [];
        if (frozen) cls.push('is-freeze');
        if (col.group === '数据') cls.push('col-num');
        var style = frozen ? ' style="left:' + freezeOffsets[col.key] + 'px"' : '';
        return '<th class="' + cls.join(' ') + '"' + style + '>' + escapeHtml(col.name) + '</th>';
      }).join('') + '<th class="col-action">操作</th></tr>';
    }

    var rows = getFilteredRows();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    var body = $('tableBody');
    var empty = $('emptyTip');
    var f = state.applied;

    if (!f || !f.productId) {
      body.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.textContent = '请选择产品';
      }
    } else if (!pageRows.length) {
      body.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.textContent = '该产品下暂无策略，可点击「添加」';
      }
    } else {
      if (empty) empty.hidden = true;
      var visualRows = [];
      pageRows.forEach(function (row) {
        var splits = row.splits || [];
        var ab = splits.length > 1;
        var span = ab ? splits.length : 1;
        var si;
        for (si = 0; si < span; si++) {
          visualRows.push({
            row: row,
            splitIndex: ab ? si : null,
            ab: ab,
            policySpan: span,
            isPolicyFirst: si === 0
          });
        }
      });
      visualRows.forEach(function (vr, i) {
        if (i > 0 && visualRows[i - 1].row.sceneId === vr.row.sceneId) {
          vr.isSceneFirst = false;
          vr.sceneSpan = 0;
          return;
        }
        var span = 1;
        var j = i + 1;
        while (j < visualRows.length && visualRows[j].row.sceneId === vr.row.sceneId) {
          span += 1;
          j += 1;
        }
        vr.isSceneFirst = true;
        vr.sceneSpan = span;
      });
      body.innerHTML = visualRows.map(function (vr) {
        var row = vr.row;
        var cells = cols.map(function (col, idx) {
          if (col.key === 'scene') {
            if (!vr.isSceneFirst) return '';
            return tdAttrs(col, idx, freezeCount, freezeOffsets, vr.sceneSpan) + cellHtml(col, row) + '</td>';
          }
          if (TARGET_MERGE_COL_KEYS[col.key]) {
            if (!vr.isPolicyFirst) return '';
            return tdAttrs(col, idx, freezeCount, freezeOffsets, vr.policySpan) + cellHtml(col, row) + '</td>';
          }
          return tdAttrs(col, idx, freezeCount, freezeOffsets, 1) + cellHtml(col, row, vr.splitIndex) + '</td>';
        }).join('');
        var action = vr.isPolicyFirst ? actionCellHtml(vr.policySpan) : '';
        return '<tr data-id="' + escapeHtml(row.id) + '"' +
          (vr.splitIndex != null ? ' data-split="' + vr.splitIndex + '"' : '') + '>' +
          cells + action +
          '</tr>';
      }).join('');
    }

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });
    if (!state.paginationBound) {
      state.paginationBound = true;
      UI.bindPagination({
        containerId: 'pagination',
        getPage: function () { return state.page; },
        getPageSize: function () { return state.pageSize; },
        getTotal: function () { return getFilteredRows().length; },
        onPageChange: function (p) { state.page = p; renderTable(); },
        onPageSizeChange: function (size) { state.pageSize = size; state.page = 1; renderTable(); }
      });
    }
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function setContextReadonly(readonly) {
    ['editProduct', 'editScene'].forEach(function (prefix) {
      var trigger = $(prefix + 'Trigger');
      var clear = $(prefix + 'Clear');
      var wrap = $(prefix + 'Wrap');
      if (trigger) {
        trigger.disabled = !!readonly;
        trigger.classList.toggle('is-disabled', !!readonly);
      }
      if (clear) clear.hidden = !!readonly;
      if (wrap) wrap.classList.toggle('is-readonly', !!readonly);
    });
  }

  function fillForm(row, isCopy) {
    clearEditErrors();
    state.editProductId = row.productId || '';
    state.editSceneId = row.sceneId || '';
    state.editUserType = normalizeUserType(row.userType);
    state.editCountries = (row.countries || []).slice();
    state.editVersions = (row.versions || []).slice();
    state.editSplits = Store.clone(row.splits || []);
    state.editAbOn = state.editSplits.length > 1;
    if (!state.editSplits.length) resetSplitsForScene();
    else {
      state.editSplits = state.editSplits.slice(0, state.editAbOn ? 2 : 1);
      state.editSplits.forEach(ensureSplitValues);
    }
    if (isCopy) state.editSplits.forEach(function (g) { delete g.strategyId; });
    ensureStrategyIds(state.editSplits);
    fillProductPanel('editProductPanel', appProductOptions(), state.editProductId);
    fillScenePanel('editScenePanel', state.editProductId, state.editSceneId);
    syncProductLabel('editProductLabel', 'editProductWrap', 'editProductPanel', state.editProductId, '');
    if (editSceneSelect && editSceneSelect.syncLabel) editSceneSelect.syncLabel(state.editSceneId);
    if (versionMulti && versionMulti.render) versionMulti.render();
    if (countryMulti && countryMulti.render) countryMulti.render();
    UI.setSegValue('editUserTypeSeg', state.editUserType);
    setContextReadonly(state.editMode === 'edit' && !isCopy);
    syncAbSwitch();
    renderSplits();
  }

  function nextPolicyId() {
    var max = 10000;
    function consider(id) {
      var n = parseInt(String(id), 10);
      if (isFinite(n) && n > max) max = n;
    }
    ALL_ROWS.forEach(function (r) {
      consider(r.id);
      (r.splits || []).forEach(function (g) { consider(g.strategyId); });
    });
    (state.editSplits || []).forEach(function (g) { consider(g.strategyId); });
    return max + 1;
  }

  function splitStrategyId(row, splitIndex) {
    var splits = (row && row.splits) || [];
    var g = splitIndex != null ? splits[splitIndex] : splits[0];
    if (g && g.strategyId) return String(g.strategyId);
    return row && row.id ? String(row.id) : '';
  }

  function openAdd() {
    if (!Store.apps().length) {
      UI.showToast('请先在聚合应用中关联产品与场景', 'warning');
      return;
    }
    var f = state.applied || state.draft;
    if (!f.productId) {
      UI.showToast('请先选择产品', 'warning');
      return;
    }
    state.editMode = 'add';
    state.editId = null;
    state.previewPolicyId = String(nextPolicyId());
    $('editDrawerTitle').textContent = '添加策略';
    fillForm({
      name: '', productId: f.productId, sceneId: f.sceneId || '', priority: 10, status: '启用',
      countries: [], userType: '全用户', versions: [], splits: []
    }, false);
    UI.openDrawer('editDrawer');
  }

  function openEdit(row, isCopy) {
    state.editMode = isCopy ? 'add' : 'edit';
    state.editId = isCopy ? null : row.id;
    state.previewPolicyId = isCopy ? String(nextPolicyId()) : '';
    $('editDrawerTitle').textContent = isCopy ? '添加策略' : '编辑策略';
    fillForm(row, isCopy);
    UI.openDrawer('editDrawer');
  }

  function closeEdit() {
    UI.closeDrawer('editDrawer');
  }

  function submitEdit() {
    collectSplitsFromDom();
    clearEditErrors();
    var ok = true;
    if (!state.editProductId) {
      setItemError('editProductItem', true, '请选择产品');
      ok = false;
    }
    if (!state.editSceneId) {
      setItemError('editSceneItem', true, '请选择场景');
      ok = false;
    }
    if (!state.editSplits.length) {
      setItemError('editSplitItem', true, '请至少配置一个分流组');
      var se = $('editSplitError');
      if (se) { se.textContent = '请至少配置一个分流组'; se.style.display = ''; }
      ok = false;
    } else {
      var missingName = state.editSplits.some(function (g) { return !g.name; });
      if (missingName) {
        setItemError('editSplitItem', true, '请填写分流组名称');
        var se2 = $('editSplitError');
        if (se2) { se2.textContent = '请填写分流组名称'; se2.style.display = ''; }
        ok = false;
      } else if (state.editAbOn && state.editSplits.length !== 2) {
        setItemError('editSplitItem', true, 'AB测试须配置对照组与实验组');
        ok = false;
      } else if (splitPercentSum() !== 100) {
        setItemError('editSplitItem', true, '分流组流量合计须为 100%');
        var se3 = $('editSplitError');
        if (se3) { se3.textContent = '分流组流量合计须为 100%'; se3.style.display = ''; }
        ok = false;
      }
    }
    if (!ok) return;

    var duplicate = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.productId === state.editProductId && r.sceneId === state.editSceneId &&
        targetingSame(r, {
          versions: state.editVersions,
          countries: state.editCountries,
          userType: state.editUserType
        });
    });
    if (duplicate) {
      UI.showToast('该产品场景下已存在相同用户定向', 'warning');
      return;
    }

    var existing = state.editMode === 'edit' ? findRow(state.editId) : null;
    var payload = {
      name: existing ? existing.name : (Store.sceneName(state.editSceneId) + ' · ' + (state.editUserType || '全用户')),
      productId: state.editMode === 'edit' && existing ? existing.productId : state.editProductId,
      sceneId: state.editMode === 'edit' && existing ? existing.sceneId : state.editSceneId,
      countries: state.editCountries.slice(),
      countryMatch: 'include',
      channels: [],
      userType: state.editUserType || '全用户',
      versions: state.editVersions.slice(),
      versionMatch: 'include',
      priority: existing && existing.priority != null ? existing.priority : 10,
      status: existing && existing.status ? existing.status : '启用',
      splits: Store.clone(state.editSplits)
    };

    if (state.editMode === 'add') {
      ensureStrategyIds(state.editSplits);
      payload.id = state.editSplits[0] && state.editSplits[0].strategyId
        ? state.editSplits[0].strategyId
        : String(nextPolicyId());
      ALL_ROWS.unshift(Store.touch(payload));
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
      Store.touch(row);
    }
    Store.savePolicies(ALL_ROWS);
    closeEdit();
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function sortedJoin(list) {
    return (list || []).slice().sort().join('\n');
  }

  function targetingSame(row, draft) {
    var rowUser = row.userType === '全部' || !row.userType ? '全用户' : row.userType;
    var draftUser = draft.userType === '全部' || !draft.userType ? '全用户' : draft.userType;
    return sortedJoin(row.versions) === sortedJoin(draft.versions) &&
      sortedJoin(row.countries) === sortedJoin(draft.countries) &&
      rowUser === draftUser;
  }

  function openDelete(row) {
    state.deleteId = row.id;
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var id = state.deleteId;
    if (!id) return;
    var idx = ALL_ROWS.findIndex(function (r) { return r.id === id; });
    if (idx !== -1) ALL_ROWS.splice(idx, 1);
    Store.savePolicies(ALL_ROWS);
    state.deleteId = null;
    UI.closeModal('deleteModal');
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () {
    if (dateApi) {
      state.draft.dateStart = dateApi.getStart();
      state.draft.dateEnd = dateApi.getEnd();
    }
    applyFilters();
    renderTable();
  });
  $('resetBtn').addEventListener('click', function () {
    pickDefaultContext();
    fillProductPanel('productPanel', appProductOptions(), state.draft.productId);
    fillScenePanel('scenePanel', state.draft.productId, state.draft.sceneId);
    syncProductLabel('productLabel', 'productWrap', 'productPanel', state.draft.productId, '产品：');
    if (sceneFilter && sceneFilter.syncLabel) sceneFilter.syncLabel(state.draft.sceneId);
    if (dateApi && dateApi.setRange) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var start = new Date(today);
      start.setDate(start.getDate() - 6);
      dateApi.setRange(start, today, 'last7', true);
      state.draft.dateStart = start;
      state.draft.dateEnd = today;
    }
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitEdit);
  $('deleteOk').addEventListener('click', confirmDelete);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row, false);
    else if (action === 'copy') openEdit(row, true);
    else if (action === 'delete') openDelete(row);
  });

  /* —— 自定义列 —— */
  function filteredColumnItems() {
    var kw = ($('metricSearch').value || '').trim().toLowerCase();
    return allColumnItems().filter(function (item) {
      if (!kw) return true;
      return item.name.toLowerCase().indexOf(kw) >= 0 || item.key.toLowerCase().indexOf(kw) >= 0;
    });
  }

  function renderMetricModal() {
    var items = filteredColumnItems();
    var grouped = {};
    COLUMN_GROUPS.forEach(function (g) { grouped[g] = []; });
    items.forEach(function (item) {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });
    var searching = !!($('metricSearch') && ($('metricSearch').value || '').trim());
    var visibleGroups = searching
      ? COLUMN_GROUPS.filter(function (g) { return (grouped[g] || []).length; })
      : COLUMN_GROUPS.slice();
    if (visibleGroups.indexOf(state.metricCat) < 0) state.metricCat = visibleGroups[0] || COLUMN_GROUPS[0];

    $('metricCatList').innerHTML = visibleGroups.map(function (cat) {
      return '<button class="metric-cat' + (cat === state.metricCat ? ' is-active' : '') + '" type="button" data-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
    }).join('') || '<div class="transfer__empty">无匹配</div>';

    $('metricOptions').innerHTML = visibleGroups.map(function (cat) {
      var list = grouped[cat] || [];
      var selectable = list.filter(function (item) { return !isFrozenKey(item.key); });
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      var grid = list.length
        ? list.map(function (item) {
            var checked = state.metricDraft.indexOf(item.key) >= 0;
            var disabled = isFrozenKey(item.key);
            return '<label class="metric-option' + (disabled ? ' is-disabled' : '') + '">' +
              '<input class="metric-check" type="checkbox" value="' + escapeHtml(item.key) + '"' +
                (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />' +
              '<span class="metric-option__name">' + escapeHtml(item.name) + '</span>' +
            '</label>';
          }).join('')
        : '<div class="transfer__empty">暂无列</div>';
      return '<section class="metric-group" data-group="' + escapeHtml(cat) + '">' +
        '<div class="metric-group__head">' +
          '<input class="metric-check" type="checkbox" data-group-check="' + escapeHtml(cat) + '"' +
            (allChecked ? ' checked' : '') + (selectable.length === 0 ? ' disabled' : '') + ' />' +
          '<span>' + escapeHtml(cat) + '</span>' +
        '</div>' +
        '<div class="metric-group__grid">' + grid +
        '</div></section>';
    }).join('') || '<div class="transfer__empty">无匹配</div>';

    $('metricOptions').querySelectorAll('[data-group-check]').forEach(function (input) {
      var cat = input.getAttribute('data-group-check');
      var list = grouped[cat] || [];
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      input.indeterminate = checkedCount > 0 && !allChecked;
    });

    $('metricSelectedCount').textContent = '已选 ' + state.metricDraft.length + ' 列';
    var freezeAt = Math.min(Math.max(state.metricFrozenCount, minFrozenCount(state.metricDraft)), state.metricDraft.length);
    state.metricFrozenCount = freezeAt;
    var map = columnMap();
    var listHtml = '';
    if (!state.metricDraft.length) {
      listHtml = '<div class="transfer__empty">请添加列</div>';
    } else {
      state.metricDraft.forEach(function (key, idx) {
        if (idx === freezeAt) {
          listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
        }
        var item = map[key] || { name: key };
        var forced = isFrozenKey(key);
        var frozen = idx < freezeAt;
        var icon = frozen
          ? '<svg class="metric-selected__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
          : '<svg class="metric-selected__drag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        var remove = forced ? '' :
          '<button class="metric-selected__remove" type="button" data-remove-metric="' + escapeHtml(key) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button>';
        listHtml +=
          '<div class="metric-selected__item' + (frozen ? ' is-frozen' : '') + '" draggable="' + (forced ? 'false' : 'true') + '" data-metric="' + escapeHtml(key) + '" data-index="' + idx + '">' +
            icon + '<span class="metric-selected__name">' + escapeHtml(item.name) + '</span>' + remove +
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
    if (checked && idx < 0) state.metricDraft.push(key);
    else if (!checked && idx >= 0) {
      state.metricDraft.splice(idx, 1);
      if (idx < state.metricFrozenCount) {
        state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), state.metricFrozenCount - 1);
      }
    }
    state.metricFrozenCount = Math.max(state.metricFrozenCount, minFrozenCount(state.metricDraft));
  }

  function openMetricModal() {
    syncColumnsForScene();
    state.metricDraft = state.columns.slice();
    state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), Math.min(state.frozenCount, state.metricDraft.length));
    state.metricCat = COLUMN_GROUPS[0];
    if ($('metricSearch')) $('metricSearch').value = '';
    renderMetricModal();
    UI.openModal('metricModal');
  }

  $('metricsBtn').addEventListener('click', openMetricModal);
  $('refreshBtn').addEventListener('click', function () {
    renderTable();
    UI.showToast('已刷新', 'success');
  });
  $('fullscreenBtn').addEventListener('click', function () {
    var panel = $('dataPanel');
    var on = !panel.classList.contains('is-fullscreen');
    panel.classList.toggle('is-fullscreen', on);
    document.body.classList.toggle('ad-strategy-fs-open', on);
    var label = on ? '退出全屏' : '全屏';
    $('fullscreenBtn').setAttribute('aria-label', label);
    var tip = $('fullscreenTip');
    if (tip) tip.setAttribute('data-tip', label);
    if (window.ColResize) ColResize.refresh($('dataTable'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('dataPanel') && $('dataPanel').classList.contains('is-fullscreen')) {
      $('dataPanel').classList.remove('is-fullscreen');
      document.body.classList.remove('ad-strategy-fs-open');
      $('fullscreenBtn').setAttribute('aria-label', '全屏');
      var tip = $('fullscreenTip');
      if (tip) tip.setAttribute('data-tip', '全屏');
    }
  });
  $('exportBtn').addEventListener('click', function () {
    var map = columnMap();
    var cols = state.columns.map(function (k) { return map[k]; }).filter(Boolean);
    var rows = getFilteredRows();
    function csvCell(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    function plainCell(col, row, splitIndex) {
      var scene = Store.sceneById(row.sceneId);
      if (col.key === 'scene') return Store.sceneName(row.sceneId);
      if (col.key === 'countries') return formatCountriesText(row);
      if (col.key === 'versions') return formatVersionsText(row);
      if (col.key === 'userType') return normalizeUserType(row.userType);
      if (col.key === 'abSwitch') return isAbRow(row) ? '开' : '关';
      if (col.key === 'id') return splitStrategyId(row, splitIndex);
      if (col.key === 'splitRatio') {
        var splits = row.splits || [];
        if (splitIndex != null) {
          var g = splits[splitIndex];
          return g ? ((g.percent == null ? 0 : g.percent) + '%') : '';
        }
        return splits.map(function (x) { return (x.percent == null ? 0 : x.percent) + '%'; }).join(' / ');
      }
      if (col.key === 'adSwitch') return scene && scene.adSwitch === true ? '开' : '关';
      if (col.group === '数据') return formatMetric(col, row, splitIndex);
      var fid = parseFieldColKey(col.key);
      if (fid) {
        var field = Store.fieldById(fid);
        var list = row.splits || [];
        if (!list.length) return '';
        if (splitIndex != null) {
          var sg = list[splitIndex];
          return formatConditionValue(field, sg && sg.values && sg.values[fid], sg && sg.numberOps && sg.numberOps[fid], 'full');
        }
        return list.map(function (g) {
          return formatConditionValue(field, g.values && g.values[fid], g.numberOps && g.numberOps[fid], 'full');
        }).join(' / ');
      }
      return '';
    }
    var header = cols.map(function (c) { return csvCell(c.name); }).join(',');
    var lines = [header];
    rows.forEach(function (row) {
      var splits = row.splits || [];
      var ab = splits.length > 1;
      var span = ab ? splits.length : 1;
      var si;
      for (si = 0; si < span; si++) {
        var splitIndex = ab ? si : null;
        lines.push(cols.map(function (col) { return csvCell(plainCell(col, row, splitIndex)); }).join(','));
      }
    });
    var stamp = Store.nowText ? Store.nowText().slice(0, 10).replace(/-/g, '') : String(Date.now());
    UI.downloadText('广告策略_' + stamp + '.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
    UI.showToast('已导出当前列表', 'success');
  });
  $('metricSubmit').addEventListener('click', function () {
    state.columns = normalizeColumns(state.metricDraft, allColumnItems().map(function (c) { return c.key; }));
    state.frozenCount = Math.max(minFrozenCount(state.columns), Math.min(state.metricFrozenCount, state.columns.length));
    saveColumnPrefs();
    UI.closeModal('metricModal');
    UI.showToast('自定义列已更新', 'success');
    renderTable();
  });
  $('metricClear').addEventListener('click', function () {
    state.metricDraft = FORCE_FROZEN_KEYS.slice();
    state.metricFrozenCount = FORCE_FROZEN_KEYS.length;
    renderMetricModal();
  });
  $('metricSearch').addEventListener('input', renderMetricModal);
  $('metricCatList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.metricCat = btn.getAttribute('data-cat');
    renderMetricModal();
  });
  $('metricOptions').addEventListener('change', function (e) {
    var input = e.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.hasAttribute('data-group-check')) {
      var cat = input.getAttribute('data-group-check');
      allColumnItems().filter(function (it) { return it.group === cat && !isFrozenKey(it.key); }).forEach(function (it) {
        toggleMetricKey(it.key, input.checked);
      });
      renderMetricModal();
      return;
    }
    if (input.classList.contains('metric-check')) {
      toggleMetricKey(input.value, input.checked);
      renderMetricModal();
    }
  });
  $('metricSelectedList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-metric]');
    if (!btn) return;
    toggleMetricKey(btn.getAttribute('data-remove-metric'), false);
    renderMetricModal();
  });

  (function bindMetricDrag() {
    var list = $('metricSelectedList');
    if (!list) return;
    list.addEventListener('dragstart', function (e) {
      var item = e.target.closest('[data-metric]');
      if (!item || item.getAttribute('draggable') === 'false') { e.preventDefault(); return; }
      state.dragMetricKey = item.getAttribute('data-metric');
      e.dataTransfer.effectAllowed = 'move';
    });
    list.addEventListener('dragover', function (e) {
      if (!state.dragMetricKey) return;
      e.preventDefault();
      var line = e.target.closest('[data-freeze-line]');
      var item = e.target.closest('[data-metric]');
      list.querySelectorAll('.metric-freeze').forEach(function (el) {
        el.classList.toggle('is-drag-over', el === line);
      });
      list.querySelectorAll('.metric-selected__item').forEach(function (el) {
        el.classList.toggle('is-drop-target', el === item);
      });
    });
    list.addEventListener('drop', function (e) {
      e.preventDefault();
      var fromKey = state.dragMetricKey;
      state.dragMetricKey = null;
      list.querySelectorAll('.is-drag-over, .is-drop-target').forEach(function (el) {
        el.classList.remove('is-drag-over', 'is-drop-target');
      });
      if (!fromKey || isFrozenKey(fromKey)) return;
      var from = state.metricDraft.indexOf(fromKey);
      if (from < 0) return;
      var line = e.target.closest('[data-freeze-line]');
      var item = e.target.closest('[data-metric]');
      var to;
      if (line) {
        to = state.metricFrozenCount;
      } else if (item) {
        to = Number(item.getAttribute('data-index'));
      } else return;
      if (to === from) return;
      state.metricDraft.splice(from, 1);
      if (to > from) to -= 1;
      state.metricDraft.splice(to, 0, fromKey);
      /* adjust freeze: if dropped above freeze line, ensure freeze covers it? keep freezeAt as line position */
      if (line) state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), to);
      state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft), Math.min(state.metricFrozenCount, state.metricDraft.length));
      renderMetricModal();
    });
    list.addEventListener('dragend', function () {
      state.dragMetricKey = null;
      list.querySelectorAll('.is-drag-over, .is-drop-target').forEach(function (el) {
        el.classList.remove('is-drag-over', 'is-drop-target');
      });
    });
  })();

  document.querySelectorAll('[data-close="arrayModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('arrayModal'); });
  });
  document.querySelectorAll('[data-close="metricModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('metricModal'); });
  });
  document.querySelectorAll('[data-close="editDrawer"]').forEach(function (btn) {
    btn.addEventListener('click', closeEdit);
  });
  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('deleteModal'); });
  });

  if (window.ColResize) ColResize.initAll(document);
  renderTable();
})();
