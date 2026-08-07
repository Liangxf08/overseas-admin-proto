/* 海外中台 · 看板模块交互 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var showToast = UI.showToast;
  var openModal = UI.openModal;
  var closeModal = UI.closeModal;

  var USERS = Array.from({ length: 24 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var BOARD_TYPES = ['Adjust', '双端 SDK', 'APP 新用户', '广告聚合', 'IS Cohort', 'MAX Cohort', 'SDK 初始化', 'TikTok 开平'];

  var ALL_DIMENSIONS = ['日期', '按周', '按月', '平台', '产品', '国家地区', '渠道', '优化师', '账户'];

  var ALL_FILTERS = [
    { key: 'date', label: '日期', locked: true },
    { key: 'compare', label: '对比' },
    { key: 'product', label: '产品' },
    { key: 'platform', label: '平台' },
    { key: 'productGroup', label: '产品组' },
    { key: 'productType', label: '产品类型' },
    { key: 'country', label: '国家地区' },
    { key: 'channel', label: '渠道' },
    { key: 'campaign', label: '推广活动' }
  ];

  /**
   * 自定义列数据（ColumnItem）
   * key 与看板 metrics 存值一致，便于表格取值
   */
  var COLUMN_ITEMS = (function () {
    var items = [];
    function add(group, name, definition, opts) {
      opts = opts || {};
      items.push({
        key: opts.key || name,
        name: name,
        group: group,
        definition: definition || undefined,
        defaultChecked: !!opts.defaultChecked,
        defaultFrozen: !!opts.defaultFrozen
      });
    }

    /* 示例分组 · 冻结指标演示 */
    add('示例分组', '冻结指标', '此列为示例冻结指标，不可取消勾选或移出冻结区', { defaultChecked: true, defaultFrozen: true });
    add('示例分组', '示例指标');

    /* 核心概览 · 默认全选 */
    add('核心概览', '总收入', '计算公式：广告收入+内购收入', { defaultChecked: true });
    add('核心概览', '花费', '投放广告花费的金额', { defaultChecked: true });
    add('核心概览', '利润', '计算公式：总收入-花费', { defaultChecked: true });
    add('核心概览', '当日ROAS', '计算公式：总收入/花费', { defaultChecked: true });
    add('核心概览', '累计ROAS', '取已更新的同期群 Dn ROAS 最大值', { defaultChecked: true });
    add('核心概览', 'DAU', '当日有启动应用的用户即记为活跃用户（去重）', { defaultChecked: true });
    add('核心概览', 'ARPU', '计算公式：总收入/DAU', { defaultChecked: true });
    add('核心概览', '新用户', '计算公式：安装+再归因', { defaultChecked: true });
    add('核心概览', '新增单价', '计算公式：花费/新用户', { defaultChecked: true });

    /* 用户获取 · 全不选 */
    [
      '展示', '点击', '安装', '自然安装', '自然安装率', '再归因',
      'CTR', 'CVR', 'IVR', 'IPM', 'eCPI', 'eCPC', 'eCPM'
    ].forEach(function (name) { add('用户获取', name); });

    /* 广告变现 · 全不选 */
    [
      '广告收入', '广告展示', '广告IPU', '广告ARPU', '广告eCPM', '内购收入', '内购ARPU'
    ].forEach(function (name) {
      add('广告变现', name, null, {
        key: name === '内购收入' ? '广告变现_内购收入' : name
      });
    });

    /* 内购变现 · 全不选 */
    [
      '付费用户', '付费率', '内购收入', 'ARPU', 'ARPPU'
    ].forEach(function (name) {
      var key = name;
      if (name === '内购收入') key = '内购变现_内购收入';
      if (name === 'ARPU') key = '内购变现_ARPU';
      add('内购变现', name, null, { key: key });
    });

    /* 总LTV / 总ROAS · D0–D30 */
    for (var d = 0; d <= 30; d++) {
      add('总LTV', 'D' + d + ' 总LTV');
      add('总ROAS', 'D' + d + ' 总ROAS');
    }

    return items;
  })();

  var COLUMN_MAP = COLUMN_ITEMS.reduce(function (acc, item) {
    acc[item.key] = item;
    return acc;
  }, {});

  var COLUMN_GROUPS = COLUMN_ITEMS.reduce(function (acc, item) {
    if (acc.indexOf(item.group) < 0) acc.push(item.group);
    return acc;
  }, []);

  function inferMetricMeta(key, name) {
    var label = name || key || '';
    if (/ROAS|CTR|CVR|IVR|率$|付费率|自然安装率/.test(label)) {
      return { type: 'percent', digits: 2, aggregate: 'avg' };
    }
    if (/ARPU|ARPPU|IPU|IPM|eCPI|eCPC|eCPM|单价/.test(label)) {
      return { type: 'decimal', digits: 4, aggregate: 'avg' };
    }
    if (/收入|花费|利润|LTV/.test(label)) {
      return { type: 'decimal', digits: 2, aggregate: 'sum' };
    }
    if (/DAU|用户|展示|点击|安装|再归因/.test(label)) {
      return { type: 'int', aggregate: 'sum' };
    }
    return { type: 'decimal', digits: 2, aggregate: 'sum' };
  }

  var METRIC_META = COLUMN_ITEMS.reduce(function (acc, item) {
    acc[item.key] = inferMetricMeta(item.key, item.name);
    return acc;
  }, {});

  /* 覆盖核心指标的展示精度 */
  METRIC_META['ARPU'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['新增单价'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['内购变现_ARPU'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['内购ARPU'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['广告ARPU'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['广告IPU'] = { type: 'decimal', digits: 4, aggregate: 'avg' };
  METRIC_META['广告eCPM'] = { type: 'decimal', digits: 2, aggregate: 'avg' };

  var PRODUCT_CATALOG = [
    { product: 'Tile Sort 3D (王牌分揀師)', platform: 'iOS' },
    { product: 'Tile Sort 3D (王牌分揀師)', platform: 'Android' },
    { product: 'Haggle Sleuth (砍價大偵探)', platform: 'Android' },
    { product: 'Pixel Bounce Jam (解壓彈球館)', platform: 'Android' },
    { product: 'Story Match: Associate Puzzle (腦洞故事會)', platform: 'Android' },
    { product: 'Hotpot Match 3D (做道拿手菜)', platform: 'Android' },
    { product: '文字の中に文字!', platform: 'iOS' },
    { product: '文字の中に文字!', platform: 'Android' },
    { product: 'Perfect Care: Cleaning ASMR (完美護理師)', platform: 'Android' },
    { product: 'Jigword:Word Search Games', platform: 'Android' },
    { product: '我要當學霸', platform: 'Android' }
  ];
  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png',
    TikTok: 'assets/TikTok.png'
  };
  var PRODUCT_OPTIONS = PRODUCT_CATALOG.map(function (item) {
    return item.product + '@@' + item.platform;
  });
  var PLATFORMS = ['全部', 'Android', 'iOS'];
  var PRODUCT_GROUPS = ['奇异果', '苹果组', '无花果', '坚果组', '硕果组', '外部联运'];
  var PRODUCT_TYPES = ['分类', '塔防', '益智', '逆袭', '难度', '消除', '找茬', '其他'];
  var COMPARE_OPTIONS = [
    { value: 'yesterday_dod', label: '昨日环比' },
    { value: 'period_pop', label: '周期环比' },
    { value: 'week_ago', label: '一周前' },
    { value: 'month_ago', label: '一月前' },
    { value: 'quarter_ago', label: '一季度前' },
    { value: 'custom', label: '自定义时间', custom: true },
    { value: 'none', label: '无对比' }
  ];
  var EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var COUNTRIES = [
    'United States (US)',
    'China (CN)',
    'Japan (JP)',
    'United Kingdom (GB)',
    'Germany (DE)',
    'Brazil (BR)',
    'India (IN)',
    'South Korea (KR)',
    'Indonesia (ID)',
    'France (FR)',
    'Canada (CA)',
    'Australia (AU)',
    'Mexico (MX)',
    'Italy (IT)',
    'Spain (ES)',
    'Turkey (TR)',
    'Russia (RU)',
    'Saudi Arabia (SA)',
    'Thailand (TH)',
    'Vietnam (VN)'
  ];
  var CHANNELS = [
    'Appier',
    'Apple',
    'Applovin',
    'Bigo Ads',
    'Chartboost',
    'Facebook',
    'Google Ads',
    'Google Organic Search',
    'ironSource',
    'Miniclip Ad Network',
    'Mintegral',
    'MOLOCO',
    'NewsBreak Ads',
    'Organic',
    'Pangle',
    'Snapchat',
    'Tapjoy',
    'Tec-do',
    'TikTok for Business',
    'Twitter',
    'Unity Ads',
    'Unknown Devices',
    'Untrusted Devices'
  ];
  var OPTIMIZERS = USERS.slice(0, 8);

  var DEMO_METRICS = COLUMN_ITEMS.filter(function (item) {
    return item.defaultChecked;
  }).map(function (item) { return item.key; });
  var DEMO_FILTERS = ['date', 'compare', 'product', 'channel'];
  var DEMO_DIMENSIONS = ['日期'];
  var DIM_COL_WIDTH = 120;
  var METRIC_COL_WIDTH = 112;

  var state = {
    treeKeyword: '',
    activeBoardId: null,
    page: 1,
    pageSize: 20,
    draft: null,
    saved: null,
    folderModalMode: 'create',
    folderTargetId: null,
    confirmAction: null,
    boardFormMode: 'add',
    boardFormSourceId: null,
    addTargetFolderId: 'mine',
    addBoardType: '',
    metricCat: '示例分组',
    metricDraft: [],
    metricFrozenCount: 0,
    metricAnchorLock: false,
    shareAvailChecked: [],
    shareSelectedChecked: [],
    shareDraft: [],
    dateStart: null,
    dateEnd: null,
    dateShortcut: 'last7',
    dateViewMonth: null,
    pickingStart: null,
    filterValues: { compare: 'none', platform: '全部' },
    dimSelected: [],
    filterVisibleDraft: [],
    compareCustomStart: null,
    compareCustomEnd: null,
    compareCustomViewMonth: null,
    comparePickingStart: null,
    sortSpecs: [],
    sortKey: null,
    sortDir: 'desc',
    sortInteractive: false,
    colWidths: {}
  };

  var store = {
    folders: [
      {
        id: 'system',
        name: '系统看板',
        kind: 'system',
        expanded: true,
        children: [
          boardTpl('sys_demo', '示例看板', 'Adjust', 'system')
        ]
      },
      {
        id: 'shared',
        name: '共享看板',
        kind: 'shared',
        expanded: false,
        children: [
          boardTpl('shared_demo', '示例看板', '广告聚合', 'shared', { sharedBy: '用户B' })
        ]
      },
      {
        id: 'mine',
        name: '我的看板',
        kind: 'mine',
        expanded: true,
        children: [
          boardTpl('mine_demo', '示例看板', '双端 SDK', 'mine', {
            sharedUsers: ['用户C', '用户D']
          })
        ]
      },
      {
        id: 'folder_example',
        name: '示例文件夹',
        kind: 'folder',
        expanded: true,
        children: [
          boardTpl('example_demo', '示例看板', 'TikTok 开平', 'folder')
        ]
      }
    ]
  };

  function boardTpl(id, name, type, owner, extra) {
    extra = extra || {};
    return {
      id: id,
      name: name,
      kind: 'board',
      owner: owner,
      type: type,
      tag: extra.tag || '',
      sharedBy: extra.sharedBy || '',
      dimensions: (extra.dimensions || DEMO_DIMENSIONS).slice(),
      filters: (extra.filters || DEMO_FILTERS).slice(),
      metrics: (extra.metrics || DEMO_METRICS).slice(),
      lockedMetric: extra.lockedMetric || '冻结指标',
      frozenMetricCount: extra.frozenMetricCount != null ? extra.frozenMetricCount : 1,
      sharedUsers: (extra.sharedUsers || []).slice(),
      updatedAt: extra.updatedAt || '2026-08-06 12:47:01'
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function findNode(id, nodes) {
    nodes = nodes || store.folders;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes[i];
      if (nodes[i].children) {
        var found = findNode(id, nodes[i].children);
        if (found) return found;
      }
    }
    return null;
  }

  function findParent(id, nodes, parent) {
    nodes = nodes || store.folders;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return parent || null;
      if (nodes[i].children) {
        var found = findParent(id, nodes[i].children, nodes[i]);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }

  function nodeContains(node, id) {
    if (!node) return false;
    if (node.id === id) return true;
    return (node.children || []).some(function (c) { return nodeContains(c, id); });
  }

  function removeNode(id, nodes) {
    nodes = nodes || store.folders;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && removeNode(id, nodes[i].children)) return true;
    }
    return false;
  }

  function listWritableFolders() {
    var list = [{ id: 'mine', name: '我的看板' }];
    store.folders.forEach(function (f) {
      if (f.kind === 'folder') list.push({ id: f.id, name: f.name });
    });
    return list;
  }

  function listCustomFolders() {
    return listWritableFolders();
  }

  function getBoardScope(board) {
    if (!board) return '';
    var parent = findParent(board.id);
    if (parent) return parent.kind;
    return board.owner || '';
  }

  function canEditBoard(board) {
    var scope = getBoardScope(board);
    return scope === 'mine' || scope === 'folder';
  }

  function canDeleteBoard(board) {
    return canEditBoard(board);
  }

  function canSaveAsBoard(board) {
    var scope = getBoardScope(board);
    return scope === 'system' || scope === 'mine' || scope === 'folder';
  }

  function canManageConfig(board) {
    return canSaveBoardConfig(board);
  }

  function canSaveBoardConfig(board) {
    var scope = getBoardScope(board);
    return scope === 'system' || scope === 'mine' || scope === 'folder';
  }

  function isEditableBoard(board) {
    return canEditBoard(board);
  }

  function syncBoardActionUI(board) {
    var card = $('boardCard');
    var scope = getBoardScope(board);
    card.classList.remove('is-readonly-board', 'is-system-board', 'is-shared-board', 'is-editable-board');
    if (scope === 'shared') card.classList.add('is-shared-board', 'is-readonly-board');
    else if (scope === 'system') card.classList.add('is-system-board');
    else if (scope === 'mine' || scope === 'folder') card.classList.add('is-editable-board');
    else card.classList.add('is-readonly-board');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDate(d) {
    if (!d) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatDateTime(d) {
    return formatDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function addMonths(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    if (x.getDate() !== d.getDate()) {
      x = new Date(x.getFullYear(), x.getMonth() + 1, 0);
    }
    return x;
  }

  function getActiveDateRange() {
    var start = state.dateStart ? startOfDay(state.dateStart) : addDays(startOfDay(new Date()), -6);
    var end = state.dateEnd ? startOfDay(state.dateEnd) : startOfDay(new Date());
    if (end.getTime() < start.getTime()) {
      var tmp = start;
      start = end;
      end = tmp;
    }
    return [start, end];
  }

  function formatEnDay(d, withYear) {
    return EN_MONTHS[d.getMonth()] + ' ' + d.getDate() + (withYear ? ', ' + d.getFullYear() : '');
  }

  function formatEnRange(start, end) {
    if (!start || !end) return '';
    if (start.getFullYear() === end.getFullYear()) {
      return formatEnDay(start, false) + ' – ' + formatEnDay(end, true);
    }
    return formatEnDay(start, true) + ' – ' + formatEnDay(end, true);
  }

  function getCompareRangeByType(type) {
    var range = getActiveDateRange();
    var start = range[0];
    var end = range[1];
    var span = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (type === 'yesterday_dod') return [addDays(start, -1), addDays(end, -1)];
    if (type === 'period_pop') {
      var end2 = addDays(start, -1);
      return [addDays(end2, -span), end2];
    }
    if (type === 'week_ago') return [addDays(start, -7), addDays(end, -7)];
    if (type === 'month_ago') return [addMonths(start, -1), addMonths(end, -1)];
    if (type === 'quarter_ago') return [addMonths(start, -3), addMonths(end, -3)];
    if (type === 'custom' && state.compareCustomStart && state.compareCustomEnd) {
      return [startOfDay(state.compareCustomStart), startOfDay(state.compareCustomEnd)];
    }
    return null;
  }

  function getCompareMeta(value) {
    return COMPARE_OPTIONS.find(function (o) { return o.value === value; }) || COMPARE_OPTIONS[COMPARE_OPTIONS.length - 1];
  }

  function isCompareEnabled() {
    var filters = (state.draft && state.draft.filters) || [];
    if (filters.indexOf('compare') < 0) return false;
    var v = state.filterValues.compare || 'none';
    return v && v !== 'none';
  }

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dayKey(d) {
    return formatDate(d);
  }

  function parseDay(key) {
    var p = key.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function getShortcutRange(key) {
    var today = startOfDay(new Date());
    var dow = (today.getDay() + 6) % 7;
    if (key === 'today') return [today, today];
    if (key === 'yesterday') {
      var y = addDays(today, -1);
      return [y, y];
    }
    if (key === 'last7') return [addDays(today, -6), today];
    if (key === 'last30') return [addDays(today, -29), today];
    if (key === 'thisWeek') return [addDays(today, -dow), today];
    if (key === 'lastWeek') {
      var end = addDays(today, -dow - 1);
      return [addDays(end, -6), end];
    }
    if (key === 'thisMonth') return [new Date(today.getFullYear(), today.getMonth(), 1), today];
    if (key === 'lastMonth') {
      var start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      var endM = new Date(today.getFullYear(), today.getMonth(), 0);
      return [start, endM];
    }
    return [addDays(today, -6), today];
  }

  function setDateRange(start, end, shortcut) {
    state.dateStart = start;
    state.dateEnd = end;
    state.dateShortcut = shortcut || null;
    state.pickingStart = null;
    state.dateViewMonth = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    syncDateLabel();
    syncShortcutActive();
    renderCalendars();
    renderFsCalendars();
    if ($('filterPanel_compare') && $('filterPanel_compare').classList.contains('is-open')) {
      renderComparePanel();
    }
    if ($('fsPanel_compare') && $('fsPanel_compare').classList.contains('is-open')) {
      renderComparePanel('fs');
    }
  }

  function syncDateLabel() {
    var text;
    if (!state.dateStart || !state.dateEnd) {
      text = null;
    } else {
      text = '日期：' + formatDate(state.dateStart) + ' - ' + formatDate(state.dateEnd);
    }
    ['dateRangeLabel', 'fsDateLabel'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      if (!text) el.innerHTML = '日期：<span class="muted">请选择</span>';
      else el.textContent = text;
    });
  }

  function syncShortcutActive() {
    document.querySelectorAll('#dateShortcuts .date-shortcut, #fsDateShortcuts .date-shortcut').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-shortcut') === state.dateShortcut);
    });
  }

  function renderOneCalendar(el, year, month, navLeft, navRight, opts) {
    opts = opts || {};
    var weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
    var first = new Date(year, month, 1);
    var startOffset = (first.getDay() + 6) % 7;
    var gridStart = addDays(first, -startOffset);
    var today = startOfDay(new Date());
    var selStart = opts.selStart !== undefined
      ? opts.selStart
      : (state.pickingStart && !state.dateEnd ? state.pickingStart : state.dateStart);
    var selEnd = opts.selEnd !== undefined
      ? opts.selEnd
      : (state.pickingStart && !state.dateEnd ? state.pickingStart : state.dateEnd);
    var dayAttr = opts.dayAttr || 'data-day';
    var navAttr = opts.navAttr || 'data-nav';

    var daysHtml = '';
    for (var i = 0; i < 42; i++) {
      var d = addDays(gridStart, i);
      var out = d.getMonth() !== month;
      var isStart = selStart && sameDay(d, selStart);
      var isEnd = selEnd && sameDay(d, selEnd);
      var inRange = selStart && selEnd && d >= selStart && d <= selEnd && !sameDay(selStart, selEnd);
      var cls = [
        'date-cal__day',
        out ? 'is-out' : '',
        sameDay(d, today) ? 'is-today' : '',
        isStart ? 'is-range-start' : '',
        isEnd ? 'is-range-end' : '',
        inRange || isStart || isEnd ? 'is-in-range' : ''
      ].filter(Boolean).join(' ');
      daysHtml += '<button class="' + cls + '" type="button" ' + dayAttr + '="' + dayKey(d) + '"><span class="date-cal__day-num">' + d.getDate() + '</span></button>';
    }

    var leftNav = navLeft
      ? '<div class="date-cal__nav">' +
          '<button class="date-cal__btn" type="button" ' + navAttr + '="prev-year" aria-label="上一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2L2 6l4 4M10 2L6 6l4 4"/></svg></button>' +
          '<button class="date-cal__btn" type="button" ' + navAttr + '="prev-month" aria-label="上一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2L4 6l4 4"/></svg></button>' +
        '</div>'
      : '<div class="date-cal__nav" style="width:52px"></div>';
    var rightNav = navRight
      ? '<div class="date-cal__nav">' +
          '<button class="date-cal__btn" type="button" ' + navAttr + '="next-month" aria-label="下一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 2l4 4-4 4"/></svg></button>' +
          '<button class="date-cal__btn" type="button" ' + navAttr + '="next-year" aria-label="下一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l4 4-4 4M6 2l4 4-4 4"/></svg></button>' +
        '</div>'
      : '<div class="date-cal__nav" style="width:52px"></div>';

    el.innerHTML =
      '<div class="date-cal__header">' + leftNav +
        '<div class="date-cal__title">' + year + ' 年 ' + (month + 1) + ' 月</div>' + rightNav +
      '</div>' +
      '<div class="date-cal__week">' + weekLabels.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="date-cal__grid">' + daysHtml + '</div>';
  }

  function renderCalendars() {
    if (!$('dateCalLeft')) return;
    if (!state.dateViewMonth) state.dateViewMonth = new Date();
    var left = new Date(state.dateViewMonth.getFullYear(), state.dateViewMonth.getMonth(), 1);
    var right = new Date(state.dateViewMonth.getFullYear(), state.dateViewMonth.getMonth() + 1, 1);
    renderOneCalendar($('dateCalLeft'), left.getFullYear(), left.getMonth(), true, false);
    renderOneCalendar($('dateCalRight'), right.getFullYear(), right.getMonth(), false, true);
  }

  function renderFsCalendars() {
    if (!$('fsDateCalLeft')) return;
    if (!state.dateViewMonth) state.dateViewMonth = new Date();
    var left = new Date(state.dateViewMonth.getFullYear(), state.dateViewMonth.getMonth(), 1);
    var right = new Date(state.dateViewMonth.getFullYear(), state.dateViewMonth.getMonth() + 1, 1);
    renderOneCalendar($('fsDateCalLeft'), left.getFullYear(), left.getMonth(), true, false);
    renderOneCalendar($('fsDateCalRight'), right.getFullYear(), right.getMonth(), false, true);
  }

  /* ========== Tree ========== */
  function iconFolder() {
    return '<span class="board-tree__icon board-tree__icon--folder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6.5A1.5 1.5 0 014.5 5H9l2 2h8.5A1.5 1.5 0 0121 8.5v9A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-11z"/></svg></span>';
  }

  function iconBoard() {
    return '<span class="board-tree__icon board-tree__icon--board"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span>';
  }

  function matchKeyword(name) {
    var kw = (state.treeKeyword || '').trim().toLowerCase();
    return !kw || String(name).toLowerCase().indexOf(kw) !== -1;
  }

  function renderTree() {
    var html = store.folders.map(function (folder) {
      return renderTreeFolder(folder, 0);
    }).join('');
    $('boardTree').innerHTML = html || '<div class="transfer__empty">无匹配结果</div>';
  }

  function renderTreeFolder(node, depth) {
    var children = (node.children || []).filter(function (c) { return c.kind === 'board'; });
    var visibleChildren = children.filter(function (c) { return matchKeyword(c.name); });
    if (state.treeKeyword && !matchKeyword(node.name) && !visibleChildren.length) return '';

    var isFolder = node.kind !== 'board';
    var collapsed = !node.expanded;
    var rowClass = 'board-tree__row' +
      (depth > 0 ? ' board-tree__row--child' : '') +
      (collapsed ? ' is-collapsed' : '');

    var arrow = isFolder
      ? '<svg class="board-tree__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>'
      : '<svg class="board-tree__arrow is-spacer" viewBox="0 0 12 12"></svg>';

    var actions = '';
    if (node.kind === 'mine' || node.kind === 'folder') {
      actions =
        '<span class="board-tree__actions">' +
          '<button class="board-tree__action" type="button" data-tree-add="' + node.id + '" aria-label="添加看板"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>' +
          (node.kind === 'folder'
            ? '<button class="board-tree__action" type="button" data-tree-more="' + node.id + '" aria-label="更多"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18" r="1.2"/></svg></button>'
            : '') +
        '</span>';
    }

    var html =
      '<div class="board-tree__group' + (collapsed ? ' is-collapsed' : '') + '" data-node-id="' + node.id + '">' +
        '<div class="' + rowClass + '" role="button" tabindex="0" data-tree-id="' + node.id + '" data-tree-kind="' + node.kind + '">' +
          arrow + (isFolder ? iconFolder() : iconBoard()) +
          '<span class="board-tree__label">' + escapeHtml(node.name) + '</span>' +
          actions +
        '</div>';

    if (isFolder) {
      html += '<div class="board-tree__children">';
      visibleChildren.forEach(function (child) {
        html += renderTreeBoard(child, node.kind);
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderTreeBoard(board, parentKind) {
    if (!matchKeyword(board.name)) return '';
    var active = board.id === state.activeBoardId;
    var rowClass = 'board-tree__row board-tree__row--child' +
      (active ? ' is-active' : '');
    var actions = '';
    if (parentKind === 'mine' || parentKind === 'folder' || parentKind === 'system') {
      actions =
        '<span class="board-tree__actions">' +
          '<button class="board-tree__action" type="button" data-tree-board-more="' + board.id + '" aria-label="更多">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18" r="1.2"/></svg>' +
          '</button>' +
        '</span>';
    }
    return '<div class="' + rowClass + '" role="button" tabindex="0" data-tree-id="' + board.id + '" data-tree-kind="board">' +
      '<svg class="board-tree__arrow is-spacer" viewBox="0 0 12 12"></svg>' +
      iconBoard() +
      '<span class="board-tree__label">' + escapeHtml(board.name) + '</span>' +
      actions +
    '</div>';
  }

  /* ========== Board view ========== */
  function setBoardVisible(show) {
    var empty = $('boardEmpty');
    var view = $('boardView');
    if (!empty || !view) return;
    if (show) {
      empty.setAttribute('hidden', '');
      empty.hidden = true;
      view.removeAttribute('hidden');
      view.hidden = false;
    } else {
      empty.removeAttribute('hidden');
      empty.hidden = false;
      view.setAttribute('hidden', '');
      view.hidden = true;
    }
  }

  function loadBoard(boardId) {
    var board = findNode(boardId);
    if (!board || board.kind !== 'board') {
      state.activeBoardId = null;
      state.draft = null;
      state.saved = null;
      setBoardVisible(false);
      renderTree();
      return;
    }

    state.activeBoardId = boardId;
    state.saved = {
      dimensions: board.dimensions.slice(),
      filters: board.filters.slice(),
      metrics: board.metrics.slice(),
      sharedUsers: (board.sharedUsers || []).slice()
    };
    state.draft = clone(state.saved);
    state.draft.filters = (state.draft.filters || []).filter(function (key) {
      return ALL_FILTERS.some(function (f) { return f.key === key; });
    });
    if (state.draft.filters.indexOf('date') < 0) state.draft.filters.unshift('date');
    state.dimSelected = state.draft.dimensions.slice();
    state.filterValues = defaultFilterValues();
    state.page = 1;
    state.sortSpecs = [];
    state.sortKey = null;
    state.sortDir = 'desc';
    state.sortInteractive = false;

    setBoardVisible(true);

    /* 展开所属文件夹，确保侧栏可见选中项 */
    var parent = findParent(boardId);
    while (parent) {
      parent.expanded = true;
      parent = findParent(parent.id);
    }

    syncBoardActionUI(board);

    $('boardTitle').textContent = board.name;
    $('boardTitleEdit').value = board.name;
    $('boardHeader').classList.remove('is-editing');
    $('boardUpdated').textContent = board.updatedAt || formatDateTime(new Date());

    var tag = $('boardTypeTag');
    if (board.type) {
      tag.hidden = false;
      tag.removeAttribute('hidden');
      tag.textContent = board.type;
    } else {
      tag.hidden = true;
      tag.setAttribute('hidden', '');
    }

    var r = getShortcutRange('last7');
    setDateRange(r[0], r[1], 'last7');

    renderDynamicFilters();
    syncDimLabel();
    renderTable();
    renderTree();
  }

  function syncDimLabel() {
    var label = $('dimLabel');
    var wrap = $('dimWrap');
    var selected = state.dimSelected;
    if (!selected.length) {
      label.innerHTML = '维度：<span class="muted">请选择</span>';
      wrap.classList.remove('has-value');
    } else if (selected.length === 1) {
      label.innerHTML = '维度：' + escapeHtml(selected[0]);
      wrap.classList.add('has-value');
    } else {
      label.innerHTML = '维度：已选 ' + selected.length + ' 项';
      wrap.classList.add('has-value');
    }
  }

  function isMultiFilter(key) {
    return key === 'product' || key === 'productGroup' || key === 'productType' || key === 'country' || key === 'channel';
  }

  function useDualMulti(key) {
    /* 设计规范：多选 >7 才双栏；≤7 单栏 */
    return filterOptions(key).length > 7;
  }

  function multiPanelHtml(key, dual, idPrefix) {
    var p = idPrefix || 'filter';
    var allAttr = idPrefix === 'fs' ? 'data-fs-all' : 'data-filter-all';
    var clearAttr = idPrefix === 'fs' ? 'data-fs-clear' : 'data-filter-clear';
    if (dual) {
      return '<div class="multi-panel" id="' + p + 'Panel_' + key + '">' +
        '<div class="multi-panel__left">' +
          '<div class="multi-panel__search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg><input type="text" id="' + p + 'Search_' + key + '" placeholder="搜索" autocomplete="off" /></div>' +
          '<div class="multi-panel__toolbar"><button class="multi-panel__link" type="button" ' + allAttr + '="' + key + '">全选</button></div>' +
          '<div class="multi-panel__list" id="' + p + 'List_' + key + '"></div>' +
        '</div>' +
        '<div class="multi-panel__right">' +
          '<div class="multi-panel__toolbar multi-panel__toolbar--right"><span id="' + p + 'Count_' + key + '">已选择 0 项</span><button class="multi-panel__link" type="button" ' + clearAttr + '="' + key + '">清空</button></div>' +
          '<div class="multi-panel__list" id="' + p + 'Selected_' + key + '"></div>' +
        '</div>' +
      '</div>';
    }
    return '<div class="multi-panel multi-panel--simple" id="' + p + 'Panel_' + key + '">' +
      '<div class="multi-panel__list" id="' + p + 'List_' + key + '"></div>' +
    '</div>';
  }

  function renderDynamicFilters() {
    var container = $('dynamicFilters');
    var visible = (state.draft && state.draft.filters) || [];
    var html = '';

    visible.forEach(function (key) {
      if (key === 'date') {
        html +=
          '<div class="filter-item filter-item--date" id="dateRangeWrap" style="display:inline-block;vertical-align:top">' +
            '<button class="date-range-trigger" type="button" id="dateRangeTrigger">' +
              '<span class="date-range-trigger__text" id="dateRangeLabel">日期：-</span>' +
            '</button>' +
            '<div class="date-panel" id="datePanel">' +
              '<div class="date-panel__shortcuts" id="dateShortcuts">' +
                '<button class="date-shortcut" type="button" data-shortcut="today">今天</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="yesterday">昨天</button>' +
                '<button class="date-shortcut is-active" type="button" data-shortcut="last7">近7天</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="last30">近30天</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="thisWeek">本周</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="lastWeek">上周</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="thisMonth">本月</button>' +
                '<button class="date-shortcut" type="button" data-shortcut="lastMonth">上月</button>' +
              '</div>' +
              '<div class="date-panel__calendars">' +
                '<div class="date-cal" id="dateCalLeft"></div>' +
                '<div class="date-cal" id="dateCalRight"></div>' +
              '</div>' +
            '</div>' +
          '</div>';
        return;
      }

      var meta = ALL_FILTERS.find(function (f) { return f.key === key; });
      if (!meta) return;

      if (key === 'campaign') {
        var campaignVal = state.filterValues.campaign || '';
        html +=
          '<div class="filter-item' + (campaignVal ? ' has-value' : '') + '" id="filterWrap_campaign" data-filter-key="campaign" style="display:inline-block;vertical-align:top;position:relative">' +
            '<label class="select-trigger select-trigger--input" for="filter_campaign">' +
              '<span class="select-trigger__prefix">推广活动：</span>' +
              '<input class="select-trigger__field" type="text" id="filter_campaign" placeholder="请输入" value="' + escapeHtml(campaignVal) + '" autocomplete="off" />' +
            '</label>' +
            '<button class="select-clear" type="button" id="filterClear_campaign" data-clear-filter="campaign" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
          '</div>';
        return;
      }

      if (key === 'compare') {
        html +=
          '<div class="filter-item filter-item--compare" id="filterWrap_compare" data-filter-key="compare" style="display:inline-block;vertical-align:top;position:relative">' +
            '<button class="select-trigger" type="button" id="filterTrigger_compare">' +
              '<span class="select-trigger__text" id="filterLabel_compare">对比：<span class="muted">请选择对比</span></span>' +
              '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
            '</button>' +
            '<div class="compare-panel" id="filterPanel_compare"></div>' +
            '<div class="date-panel compare-custom-panel" id="compareCustomPanel">' +
              '<div class="date-panel__calendars">' +
                '<div class="date-cal" id="compareCalLeft"></div>' +
                '<div class="date-cal" id="compareCalRight"></div>' +
              '</div>' +
            '</div>' +
          '</div>';
        return;
      }

      var options = filterOptions(key);
      if (isMultiFilter(key)) {
        var dual = useDualMulti(key);
        html +=
          '<div class="filter-item" id="filterWrap_' + key + '" data-filter-key="' + key + '" style="display:inline-block;vertical-align:top;position:relative">' +
            '<button class="select-trigger" type="button" id="filterTrigger_' + key + '">' +
              '<span class="select-trigger__text" id="filterLabel_' + key + '">' + meta.label + '：<span class="muted">请选择</span></span>' +
              '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
            '</button>' +
            '<button class="select-clear" type="button" data-clear-filter="' + key + '" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
            multiPanelHtml(key, dual) +
          '</div>';
      } else {
        html +=
          '<div class="filter-item" id="filterWrap_' + key + '" data-filter-key="' + key + '" style="display:inline-block;vertical-align:top;position:relative">' +
            '<button class="select-trigger" type="button" id="filterTrigger_' + key + '">' +
              '<span class="select-trigger__text" id="filterLabel_' + key + '">' + meta.label + '：<span class="muted">请选择</span></span>' +
              '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
            '</button>' +
            '<button class="select-clear" type="button" data-clear-filter="' + key + '" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
            '<div class="single-panel" id="filterPanel_' + key + '">' +
              options.map(function (o) {
                return '<div class="single-option" data-value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</div>';
              }).join('') +
            '</div>' +
          '</div>';
      }
    });

    container.innerHTML = html;
    syncDateLabel();
    syncShortcutActive();
    renderCalendars();
    bindDynamicFilterControls();
    bindMainDateFilter();
  }

  function bindMainDateFilter() {
    var wrap = $('dateRangeWrap');
    if (!wrap) return;
    /* 开合由 document capture 统一处理；此处仅阻止冒泡以免点空白处误关其它面板 */
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('#dateRangeTrigger, #datePanel')) e.stopPropagation();
    });
  }

  function toggleMainDatePanel() {
    var trigger = $('dateRangeTrigger');
    var panel = $('datePanel');
    if (!trigger || !panel) return;
    var willOpen = !panel.classList.contains('is-open');
    closeAddMenu();
    closeCtx();
    closeFsDatePanel();
    closeComparePanels();
    UI.closePanels();
    closeDatePanel();
    if (willOpen) {
      panel.classList.add('is-open');
      trigger.classList.add('is-open');
      renderCalendars();
      if (UI.adjustDropdownPlacement) UI.adjustDropdownPlacement(panel, trigger);
    }
  }

  function toggleFsDatePanel() {
    var trigger = $('fsDateTrigger');
    var panel = $('fsDatePanel');
    if (!trigger || !panel) return;
    var willOpen = !panel.classList.contains('is-open');
    closeDatePanel();
    closeComparePanels();
    UI.closePanels();
    closeFsDatePanel();
    if (willOpen) {
      panel.classList.add('is-open');
      trigger.classList.add('is-open');
      renderFsCalendars();
      if (UI.adjustDropdownPlacement) UI.adjustDropdownPlacement(panel, trigger);
    }
  }

  function closeComparePanels() {
    ['filterPanel_compare', 'fsPanel_compare', 'compareCustomPanel', 'fsCompareCustomPanel'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.remove('is-open', 'is-dropup', 'is-align-right');
    });
    ['filterTrigger_compare', 'fsTrigger_compare'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.remove('is-open');
    });
  }

  function parseProductOption(key) {
    var idx = String(key).lastIndexOf('@@');
    if (idx === -1) return { product: key, platform: '' };
    return { product: key.slice(0, idx), platform: key.slice(idx + 2) };
  }

  function productOptionLabel(key) {
    return parseProductOption(key).product;
  }

  function productOptionIconHtml(key) {
    var platform = parseProductOption(key).platform;
    var src = PLATFORM_ICONS[platform];
    if (!src) return '';
    return '<span class="select-option-icon"><img src="' + src + '" alt="" /></span>';
  }

  function filterOptions(key) {
    if (key === 'platform') return PLATFORMS;
    if (key === 'product') return PRODUCT_OPTIONS;
    if (key === 'productGroup') return PRODUCT_GROUPS;
    if (key === 'productType') return PRODUCT_TYPES;
    if (key === 'country') return COUNTRIES;
    if (key === 'channel') return CHANNELS;
    return [];
  }

  function syncCompareLabel(prefix) {
    var p = prefix || 'filter';
    var label = $(p + 'Label_compare');
    var wrap = $(p + 'Wrap_compare');
    if (!label) return;
    var value = state.filterValues.compare || 'none';
    var meta = getCompareMeta(value);
    label.innerHTML = '对比：' + escapeHtml(meta.label);
    if (wrap) wrap.classList.add('has-value');
  }

  function renderComparePanel(prefix) {
    var p = prefix || 'filter';
    var panel = $(p + 'Panel_compare');
    if (!panel) return;
    var current = state.filterValues.compare || 'none';
    panel.innerHTML = COMPARE_OPTIONS.map(function (opt) {
      var cls = 'compare-option' + (opt.value === current ? ' is-active' : '') + (opt.custom ? ' compare-option--custom' : '');
      var rangeHtml = '';
      if (opt.custom) {
        rangeHtml = '<svg class="compare-option__chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 3L7.5 6L4.5 9"/></svg>';
      } else if (opt.value !== 'none') {
        var range = getCompareRangeByType(opt.value);
        rangeHtml = range ? '<span class="compare-option__range">' + escapeHtml(formatEnRange(range[0], range[1])) + '</span>' : '';
      }
      return '<button class="' + cls + '" type="button" data-compare="' + opt.value + '">' +
        '<span class="compare-option__label">' + escapeHtml(opt.label) + '</span>' + rangeHtml +
      '</button>';
    }).join('');
  }

  function renderCompareCustomCalendars(prefix) {
    var p = prefix || '';
    var leftId = p ? p + 'CompareCalLeft' : 'compareCalLeft';
    var rightId = p ? p + 'CompareCalRight' : 'compareCalRight';
    var left = $(leftId);
    var right = $(rightId);
    if (!left || !right) return;
    if (!state.compareCustomViewMonth) {
      var base = state.compareCustomEnd || state.dateEnd || new Date();
      state.compareCustomViewMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    }
    var leftMonth = state.compareCustomViewMonth;
    var rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);
    var selStart = state.comparePickingStart && !state.compareCustomEnd ? state.comparePickingStart : state.compareCustomStart;
    var selEnd = state.comparePickingStart && !state.compareCustomEnd ? state.comparePickingStart : state.compareCustomEnd;
    var opts = {
      selStart: selStart,
      selEnd: selEnd,
      dayAttr: 'data-compare-day',
      navAttr: 'data-compare-nav'
    };
    renderOneCalendar(left, leftMonth.getFullYear(), leftMonth.getMonth(), true, false, opts);
    renderOneCalendar(right, rightMonth.getFullYear(), rightMonth.getMonth(), false, true, opts);
  }

  function bindCompareFilter(prefix) {
    var p = prefix || 'filter';
    var wrap = $(p + 'Wrap_compare');
    var trigger = $(p + 'Trigger_compare');
    var panel = $(p + 'Panel_compare');
    var customPanel = $(p === 'fs' ? 'fsCompareCustomPanel' : 'compareCustomPanel');
    if (!wrap || !trigger || !panel) return;

    if (!state.filterValues.compare) state.filterValues.compare = 'none';
    syncCompareLabel(p);
    renderComparePanel(p);

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      closeFsDatePanel();
      closeComparePanels();
      if (customPanel) customPanel.classList.remove('is-open');
      if (open) {
        renderComparePanel(p);
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        if (UI.adjustDropdownPlacement) UI.adjustDropdownPlacement(panel, trigger);
      }
    });

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-compare]');
      if (!btn) return;
      var value = btn.getAttribute('data-compare');
      if (value === 'custom') {
        if (!state.compareCustomViewMonth) {
          var base = state.compareCustomEnd || state.dateEnd || new Date();
          state.compareCustomViewMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
        }
        renderCompareCustomCalendars(p === 'fs' ? 'fs' : '');
        if (customPanel) {
          customPanel.classList.add('is-open');
          if (UI.adjustDropdownPlacement) UI.adjustDropdownPlacement(customPanel, trigger);
        }
        return;
      }
      state.filterValues.compare = value;
      if (customPanel) customPanel.classList.remove('is-open');
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
      syncCompareLabel('filter');
      syncCompareLabel('fs');
    });

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });

    if (customPanel) {
      customPanel.addEventListener('click', function (e) {
        var nav = e.target.closest('[data-compare-nav]');
        if (nav) {
          var action = nav.getAttribute('data-compare-nav');
          var vm = state.compareCustomViewMonth || new Date();
          if (action === 'prev-month') state.compareCustomViewMonth = new Date(vm.getFullYear(), vm.getMonth() - 1, 1);
          if (action === 'next-month') state.compareCustomViewMonth = new Date(vm.getFullYear(), vm.getMonth() + 1, 1);
          if (action === 'prev-year') state.compareCustomViewMonth = new Date(vm.getFullYear() - 1, vm.getMonth(), 1);
          if (action === 'next-year') state.compareCustomViewMonth = new Date(vm.getFullYear() + 1, vm.getMonth(), 1);
          renderCompareCustomCalendars(p === 'fs' ? 'fs' : '');
          return;
        }
        var dayBtn = e.target.closest('[data-compare-day]');
        if (!dayBtn) return;
        var day = parseDay(dayBtn.getAttribute('data-compare-day'));
        if (!state.comparePickingStart || (state.compareCustomStart && state.compareCustomEnd && !state.comparePickingStart)) {
          state.comparePickingStart = day;
          state.compareCustomStart = day;
          state.compareCustomEnd = null;
          renderCompareCustomCalendars(p === 'fs' ? 'fs' : '');
          return;
        }
        var start = state.comparePickingStart;
        var end = day;
        if (end.getTime() < start.getTime()) {
          var tmp = start;
          start = end;
          end = tmp;
        }
        state.compareCustomStart = start;
        state.compareCustomEnd = end;
        state.comparePickingStart = null;
        state.filterValues.compare = 'custom';
        customPanel.classList.remove('is-open');
        panel.classList.remove('is-open');
        trigger.classList.remove('is-open');
        syncCompareLabel('filter');
        syncCompareLabel('fs');
      });
    }
  }

  function syncCampaignHasValue(prefix) {
    var p = prefix || 'filter';
    var wrap = $(p === 'fs' ? 'fsWrap_campaign' : 'filterWrap_campaign');
    var input = $(p === 'fs' ? 'fs_campaign' : 'filter_campaign');
    if (!wrap) return;
    var has = !!(input && String(input.value || '').trim());
    wrap.classList.toggle('has-value', has);
  }

  function bindDynamicFilterControls() {
    (state.draft.filters || []).forEach(function (key) {
      if (key === 'date') return;

      if (key === 'campaign') {
        var input = $('filter_campaign');
        if (!input) return;
        if (state.filterValues.campaign == null) state.filterValues.campaign = '';
        syncCampaignHasValue('filter');
        input.addEventListener('input', function () {
          state.filterValues.campaign = input.value;
          syncCampaignHasValue('filter');
          var fsInput = $('fs_campaign');
          if (fsInput) {
            fsInput.value = input.value;
            syncCampaignHasValue('fs');
          }
        });
        var clearBtn = $('filterClear_campaign');
        if (clearBtn) {
          clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            state.filterValues.campaign = '';
            syncCampaignHasValue('filter');
            var fsInput = $('fs_campaign');
            if (fsInput) {
              fsInput.value = '';
              syncCampaignHasValue('fs');
            }
            input.focus();
          });
        }
        return;
      }

      if (key === 'compare') {
        bindCompareFilter();
        return;
      }

      var isMulti = isMultiFilter(key);
      if (key === 'platform' && !state.filterValues[key]) state.filterValues[key] = '全部';
      if (state.filterValues[key] == null) state.filterValues[key] = isMulti ? [] : '';

      if (isMulti) {
        var dual = useDualMulti(key);
        var multiCfg = {
          wrapId: 'filterWrap_' + key,
          triggerId: 'filterTrigger_' + key,
          panelId: 'filterPanel_' + key,
          labelId: 'filterLabel_' + key,
          listId: 'filterList_' + key,
          selectedId: dual ? 'filterSelected_' + key : null,
          searchId: dual ? 'filterSearch_' + key : null,
          countId: dual ? 'filterCount_' + key : null,
          selectAllId: null,
          clearId: null,
          prefix: (ALL_FILTERS.find(function (f) { return f.key === key; }) || {}).label + '：',
          getOptions: function () { return filterOptions(key); },
          getSelected: function () { return state.filterValues[key] || []; },
          setSelected: function (arr) { state.filterValues[key] = arr; }
        };
        if (key === 'product') {
          multiCfg.getLabel = productOptionLabel;
          multiCfg.getIconHtml = productOptionIconHtml;
        }
        UI.bindMultiSelect(multiCfg);
        var allBtn = document.querySelector('[data-filter-all="' + key + '"]');
        var clearBtn = document.querySelector('[data-filter-clear="' + key + '"]');
        var clearIcon = document.querySelector('[data-clear-filter="' + key + '"]');
        if (allBtn) {
          allBtn.addEventListener('click', function () {
            state.filterValues[key] = filterOptions(key).slice();
            renderDynamicFilters();
          });
        }
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            state.filterValues[key] = [];
            renderDynamicFilters();
          });
        }
        if (clearIcon) {
          clearIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            state.filterValues[key] = [];
            renderDynamicFilters();
          });
        }
      } else {
        UI.bindSingleSelect({
          wrapId: 'filterWrap_' + key,
          triggerId: 'filterTrigger_' + key,
          panelId: 'filterPanel_' + key,
          labelId: 'filterLabel_' + key,
          clearId: null,
          prefix: (ALL_FILTERS.find(function (f) { return f.key === key; }) || {}).label + '：',
          getValue: function () { return state.filterValues[key] || ''; },
          onChange: function (v) { state.filterValues[key] = v; }
        });
        var clearIcon2 = document.querySelector('[data-clear-filter="' + key + '"]');
        if (clearIcon2) {
          clearIcon2.addEventListener('click', function (e) {
            e.stopPropagation();
            state.filterValues[key] = key === 'platform' ? '全部' : '';
            renderDynamicFilters();
          });
        }
      }
    });
  }

  /* ========== Table ========== */
  function seeded(n) {
    var x = Math.sin(n) * 10000;
    return x - Math.floor(x);
  }

  function formatPlainNumber(num, digits) {
    if (!isFinite(num)) return '—';
    var fixed = Number(num).toFixed(digits);
    return fixed;
  }

  function formatMetricValue(name, raw) {
    var meta = METRIC_META[name] || { type: 'decimal', digits: 2 };
    var num = typeof raw === 'number' ? raw : Number(String(raw).replace(/%/g, ''));
    if (!isFinite(num)) return '—';
    if (meta.type === 'int') return String(Math.round(num));
    if (meta.type === 'percent') return formatPlainNumber(num, meta.digits) + '%';
    return formatPlainNumber(num, meta.digits == null ? 2 : meta.digits);
  }

  function genMetricRaw(name, i, mi) {
    var base = seeded(i * 17 + mi * 3 + 1);
    if (name === '总收入' || name === '广告收入' || name === '内购收入' || name === '广告变现_内购收入' || name === '内购变现_内购收入') {
      return base * 8000 + 1200;
    }
    if (name === '花费') return base * 5000 + 800;
    if (name === '利润') return base * 2800 + 200;
    if (name === '当日ROAS' || /总ROAS$/.test(name) || name === '累计ROAS') return base * 180 + 20;
    if (name === 'DAU' || name === '付费用户') return Math.floor(base * 40000 + 5000);
    if (name === 'ARPU' || name === '内购变现_ARPU' || name === '内购ARPU' || name === '广告ARPU') return base * 2.5 + 0.12;
    if (name === '新用户') return Math.floor(base * 8000 + 300);
    if (name === '新增单价') return base * 3.8 + 0.05;
    if (/总LTV$/.test(name)) return base * 12 + 0.5;
    var meta = METRIC_META[name];
    if (meta) {
      if (meta.type === 'int') return Math.floor(base * 50000 + 100);
      if (meta.type === 'percent') return base * 100;
      return base * 1000;
    }
    return Math.floor(base * 50000 + 100);
  }

  function formatDelta(pct) {
    if (!isFinite(pct)) return '—';
    var body = formatPlainNumber(Math.abs(pct), 2) + '%';
    if (pct > 0) return body + ' ↑';
    if (pct < 0) return '-' + body + ' ↓';
    return '0.00%';
  }

  function formatDeltaPlain(pct) {
    if (!isFinite(pct)) return '—';
    return formatPlainNumber(pct, 2) + '%';
  }

  function deltaClassName(pct) {
    if (!isFinite(pct)) return 'change-cell';
    if (pct > 0) return 'change-cell is-up';
    if (pct < 0) return 'change-cell is-down';
    return 'change-cell';
  }

  function buildDisplayCols(dims, metrics, showCompare) {
    var cols = [];
    dims.forEach(function (d) {
      cols.push({ key: d, label: d, kind: 'dim' });
    });
    metrics.forEach(function (m) {
      var item = COLUMN_MAP[m];
      var label = item ? item.name : m;
      cols.push({ key: m, label: label, kind: 'metric', metric: m });
      if (showCompare) {
        cols.push({ key: '__delta_' + m, label: '% 变化', kind: 'delta', metric: m });
      }
    });
    return cols;
  }

  function getRangeDays() {
    var start = state.dateStart ? startOfDay(state.dateStart) : addDays(startOfDay(new Date()), -6);
    var end = state.dateEnd ? startOfDay(state.dateEnd) : startOfDay(new Date());
    if (end.getTime() < start.getTime()) {
      var tmp = start;
      start = end;
      end = tmp;
    }
    var days = [];
    var cur = start;
    while (cur.getTime() <= end.getTime()) {
      days.push(new Date(cur.getTime()));
      cur = addDays(cur, 1);
    }
    return days.length ? days : [startOfDay(new Date())];
  }

  function genRows() {
    var dims = state.dimSelected.length ? state.dimSelected : ['日期'];
    var metrics = (state.draft && state.draft.metrics) || [];
    var days = getRangeDays();
    var showCompare = isCompareEnabled();
    var cmpRange = showCompare ? getCompareRangeByType(state.filterValues.compare) : null;
    var rows = [];
    days.forEach(function (day, i) {
      var row = { _i: i, _day: day, __curDay: formatDate(day) };
      if (cmpRange) {
        var cmpSpan = Math.max(0, Math.round((cmpRange[1].getTime() - cmpRange[0].getTime()) / 86400000));
        var cmpOffset = days.length > 1 ? Math.round(i * cmpSpan / (days.length - 1)) : 0;
        var cmpDay = addDays(cmpRange[0], cmpOffset);
        row.__cmpDay = formatDate(cmpDay);
        row._cmpOffset = cmpOffset;
      }
      dims.forEach(function (d) {
        if (d === '日期') row[d] = formatDate(day);
        else if (d === '按周') {
          var dow = (day.getDay() + 6) % 7;
          var weekStart = addDays(day, -dow);
          var weekEnd = addDays(weekStart, 6);
          row[d] = formatDate(weekStart) + ' ~ ' + formatDate(weekEnd);
        } else if (d === '按月') {
          row[d] = day.getFullYear() + '-' + pad(day.getMonth() + 1);
        } else if (d === '平台') row[d] = PLATFORMS[(i % 2) + 1];
        else if (d === '产品') row[d] = productOptionLabel(PRODUCT_OPTIONS[i % PRODUCT_OPTIONS.length]);
        else if (d === '国家地区') row[d] = COUNTRIES[i % COUNTRIES.length];
        else if (d === '优化师') row[d] = OPTIMIZERS[i % OPTIMIZERS.length];
        else if (d === '账户') row[d] = 'ACC' + (1000 + i);
        else if (d === '渠道') row[d] = CHANNELS[i % CHANNELS.length];
        else row[d] = d + (i + 1);
      });
      metrics.forEach(function (m, mi) {
        row[m] = genMetricRaw(m, i, mi);
        if (cmpRange) {
          var cmpVal = genMetricRaw(m, 1000 + (row._cmpOffset || 0), mi);
          row['__cmp_' + m] = cmpVal;
          row['__delta_' + m] = Math.abs(cmpVal) < 1e-9
            ? NaN
            : ((row[m] - cmpVal) / Math.abs(cmpVal)) * 100;
        } else {
          row['__cmp_' + m] = null;
          row['__delta_' + m] = null;
        }
      });
      rows.push(row);
    });
    return rows;
  }

  function compareSortValues(a, b, key) {
    var av = a[key];
    var bv = b[key];
    if (String(key).indexOf('__delta_') === 0) {
      var ad = Number(av);
      var bd = Number(bv);
      if (!isFinite(ad) && !isFinite(bd)) return 0;
      if (!isFinite(ad)) return 1;
      if (!isFinite(bd)) return -1;
      return ad - bd;
    }
    if (key === '日期' || (/^\d{4}-\d{2}-\d{2}$/.test(String(av)) && /^\d{4}-\d{2}-\d{2}$/.test(String(bv)))) {
      return String(av).localeCompare(String(bv));
    }
    if (METRIC_META[key] || typeof av === 'number' || typeof bv === 'number') {
      var an = Number(av);
      var bn = Number(bv);
      if (isFinite(an) && isFinite(bn)) return an - bn;
    }
    return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv), 'zh');
  }

  function getDefaultSortKey(cols) {
    if (cols.indexOf('日期') >= 0) return '日期';
    return cols[0] || '';
  }

  function applySort(rows, cols) {
    var specs = (state.sortSpecs || []).filter(function (s) {
      return s && s.key && cols.indexOf(s.key) >= 0 && (s.dir === 'asc' || s.dir === 'desc');
    });
    if (specs.length) {
      state.sortInteractive = true;
      return UI.sortRowsBySpecs(rows, specs, function (a, b, key) {
        return compareSortValues(a, b, key);
      });
    }
    /* 全不选：恢复默认排序 */
    state.sortInteractive = false;
    state.sortSpecs = [];
    var key = getDefaultSortKey(cols);
    if (!key) return rows.slice();
    return rows.slice().sort(function (a, b) {
      var cmp = compareSortValues(a, b, key);
      return -cmp; /* 默认 desc */
    });
  }

  function thSortHtml(label, key) {
    var spec = null;
    (state.sortSpecs || []).some(function (s) {
      if (s.key === key) { spec = s; return true; }
      return false;
    });
    var cls = 'th-sort';
    if (spec && spec.dir === 'asc') cls += ' is-asc is-active';
    else if (spec && spec.dir === 'desc') cls += ' is-desc is-active';
    var icons = UI.TH_SORT_ICONS_HTML || (
      '<span class="th-sort__icons">' +
        '<button type="button" class="th-sort__dir asc" data-sort-dir="asc" aria-label="升序">' +
          '<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M5 1L9 7H1Z" fill="currentColor"/></svg>' +
        '</button>' +
        '<button type="button" class="th-sort__dir desc" data-sort-dir="desc" aria-label="降序">' +
          '<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M5 7L1 1h8Z" fill="currentColor"/></svg>' +
        '</button>' +
      '</span>'
    );
    if (spec) {
      icons = icons
        .replace('class="th-sort__dir asc"', 'class="th-sort__dir asc' + (spec.dir === 'asc' ? ' is-on' : '') + '"')
        .replace('class="th-sort__dir desc"', 'class="th-sort__dir desc' + (spec.dir === 'desc' ? ' is-on' : '') + '"');
    }
    return '<span class="' + cls + '" data-sort-key="' + escapeHtml(key) + '">' +
      escapeHtml(label) + icons + '</span>';
  }

  function renderTable() {
    var dims = state.dimSelected.length ? state.dimSelected : ['日期'];
    var metrics = (state.draft && state.draft.metrics) || [];
    var showCompare = isCompareEnabled();
    var displayCols = buildDisplayCols(dims, metrics, showCompare);
    var sortKeys = displayCols.map(function (c) { return c.key; });
    if (state.sortSpecs && state.sortSpecs.length) {
      state.sortSpecs = state.sortSpecs.filter(function (s) {
        return s && sortKeys.indexOf(s.key) >= 0;
      });
    }
    var rows = applySort(genRows(), sortKeys);
    var total = rows.length;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    var freezeLeft = 0;
    var freezeOffsets = {};
    state._displayCols = displayCols;

    var widthList = displayCols.map(function (c) {
      return getColWidthPx(c);
    });

    dims.forEach(function (d, idx) {
      var col = displayCols[idx];
      freezeOffsets[d] = freezeLeft;
      freezeLeft += widthList[idx] || DIM_COL_WIDTH;
    });

    var widthSum = widthList.reduce(function (s, w) { return s + w; }, 0);
    var table = $('dataTable');
    table.style.width = '100%';
    table.style.minWidth = widthSum + 'px';

    $('tableColgroup').innerHTML = displayCols.map(function (c, idx) {
      return '<col data-col-key="' + escapeHtml(c.key) + '" style="width:' + widthList[idx] + 'px" />';
    }).join('');

    $('tableHead').innerHTML = '<tr>' + displayCols.map(function (c) {
      var cls = [];
      if (c.kind !== 'dim') cls.push('is-num', 'col-num');
      if (c.kind === 'dim') cls.push('is-freeze');
      if (c.kind === 'delta') cls.push('col-change');
      var style = c.kind === 'dim' ? ' style="left:' + freezeOffsets[c.key] + 'px"' : '';
      return '<th class="' + cls.join(' ') + '"' + style + '>' + thSortHtml(c.label, c.key) + '</th>';
    }).join('') + '</tr>';

    hideCompareTip();

    if (!pageRows.length) {
      $('tableBody').innerHTML = '';
      $('tableFoot').innerHTML = '';
      $('tableEmpty').hidden = false;
    } else {
      $('tableEmpty').hidden = true;
      $('tableBody').innerHTML = pageRows.map(function (row) {
        return '<tr>' + displayCols.map(function (c) {
          var cls = [];
          var style = '';
          var text = '';
          if (c.kind === 'dim') {
            cls.push('is-freeze');
            style = ' style="left:' + freezeOffsets[c.key] + 'px"';
            text = escapeHtml(String(row[c.key] == null ? '' : row[c.key]));
            return '<td class="' + cls.join(' ') + '"' + style + '>' + text + '</td>';
          }
          cls.push('is-num');
          if (c.kind === 'metric') {
            text = escapeHtml(formatMetricValue(c.metric, row[c.metric]));
            return '<td class="' + cls.join(' ') + '">' + text + '</td>';
          }
          /* delta */
          cls.push('col-change');
          var delta = row[c.key];
          var tipPayload = {
            metric: c.metric,
            cmpDay: row.__cmpDay || '',
            curDay: row.__curDay || '',
            cmpVal: formatMetricValue(c.metric, row['__cmp_' + c.metric]),
            curVal: formatMetricValue(c.metric, row[c.metric]),
            delta: formatDeltaPlain(delta),
            deltaNum: isFinite(delta) ? delta : null
          };
          return '<td class="' + cls.join(' ') + '">' +
            '<span class="' + deltaClassName(delta) + '" data-compare-tip="' + encodeURIComponent(JSON.stringify(tipPayload)) + '">' +
              escapeHtml(formatDelta(delta)) +
            '</span>' +
          '</td>';
        }).join('') + '</tr>';
      }).join('');

      var totals = {};
      metrics.forEach(function (m) {
        var meta = METRIC_META[m] || { type: 'decimal', digits: 2, aggregate: 'sum' };
        var sum = 0;
        var cmpSum = 0;
        var n = 0;
        var cn = 0;
        rows.forEach(function (r) {
          var v = Number(r[m]);
          if (isFinite(v)) {
            sum += v;
            n += 1;
          }
          var cv = Number(r['__cmp_' + m]);
          if (isFinite(cv)) {
            cmpSum += cv;
            cn += 1;
          }
        });
        if (!n) {
          totals[m] = '—';
          totals['__delta_' + m] = '—';
          return;
        }
        var raw = meta.aggregate === 'avg' ? (sum / n) : sum;
        totals[m] = formatMetricValue(m, raw);
        if (showCompare && cn) {
          var cmpRaw = meta.aggregate === 'avg' ? (cmpSum / cn) : cmpSum;
          var dlt = Math.abs(cmpRaw) < 1e-9 ? NaN : ((raw - cmpRaw) / Math.abs(cmpRaw)) * 100;
          totals['__delta_' + m] = formatDelta(dlt);
          totals['__deltaNum_' + m] = dlt;
        } else {
          totals['__delta_' + m] = '—';
        }
      });

      $('tableFoot').innerHTML = '<tr>' + displayCols.map(function (c, idx) {
        var cls = [];
        var style = '';
        if (c.kind === 'dim') {
          cls.push('is-freeze');
          style = ' style="left:' + freezeOffsets[c.key] + 'px"';
          if (idx === 0) return '<td class="' + cls.join(' ') + '"' + style + '>合计</td>';
          return '<td class="' + cls.join(' ') + '"' + style + '></td>';
        }
        cls.push('is-num');
        if (c.kind === 'metric') {
          return '<td class="' + cls.join(' ') + '">' + escapeHtml(String(totals[c.key] || '')) + '</td>';
        }
        cls.push('col-change');
        var dlt = totals['__deltaNum_' + c.metric];
        return '<td class="' + cls.join(' ') + '"><span class="' + deltaClassName(dlt) + '">' +
          escapeHtml(String(totals[c.key] || '—')) +
        '</span></td>';
      }).join('') + '</tr>';
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
        getTotal: function () {
          var dims2 = state.dimSelected.length ? state.dimSelected : ['日期'];
          var metrics2 = (state.draft && state.draft.metrics) || [];
          var keys = buildDisplayCols(dims2, metrics2, isCompareEnabled()).map(function (c) { return c.key; });
          return applySort(genRows(), keys).length;
        },
        onPageChange: function (p) {
          state.page = p;
          renderTable();
        },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }

    bindBoardTableColResize(widthList);
  }

  function getColWidthPx(col) {
    if (state.colWidths[col.key] != null) return state.colWidths[col.key];
    if (col.kind === 'dim') return DIM_COL_WIDTH;
    return METRIC_COL_WIDTH;
  }

  function syncBoardFreezeOffsets(table) {
    var cols = state._displayCols || [];
    var colgroup = table && table.querySelector('colgroup');
    if (!colgroup) return;
    var left = 0;
    cols.forEach(function (c, i) {
      if (c.kind !== 'dim') return;
      var colEl = colgroup.children[i];
      var w = colEl ? (parseFloat(colEl.style.width) || DIM_COL_WIDTH) : DIM_COL_WIDTH;
      var th = table.querySelectorAll('thead th')[i];
      if (th) th.style.left = left + 'px';
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        var td = tr.children[i];
        if (td) td.style.left = left + 'px';
      });
      var footRow = table.querySelector('tfoot tr');
      if (footRow && footRow.children[i]) footRow.children[i].style.left = left + 'px';
      left += w;
    });
  }

  function bindBoardTableColResize(widthList) {
    var table = $('dataTable');
    if (!table || !window.ColResize) return;
    var cols = state._displayCols || [];
    requestAnimationFrame(function () {
      ColResize.refresh(table, {
        force: true,
        includeLast: true,
        minWidth: 72,
        widths: widthList,
        onLayout: function () {
          syncBoardFreezeOffsets(table);
        },
        onResize: function (index, width) {
          var col = cols[index];
          if (!col) return;
          state.colWidths[col.key] = width;
          syncBoardFreezeOffsets(table);
        }
      });
    });
  }

  function ensureCompareTip() {
    var tip = $('compareTip');
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'compareTip';
    tip.className = 'compare-tip';
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tip);
    return tip;
  }

  function hideCompareTip() {
    var tip = $('compareTip');
    if (!tip) return;
    tip.hidden = true;
    tip.setAttribute('aria-hidden', 'true');
    tip.classList.remove('is-show');
  }

  function showCompareTip(anchor, payload) {
    var tip = ensureCompareTip();
    var deltaValCls = 'compare-tip__val';
    if (isFinite(payload.deltaNum)) {
      if (payload.deltaNum > 0) deltaValCls += ' is-up';
      else if (payload.deltaNum < 0) deltaValCls += ' is-down';
    }
    tip.innerHTML =
      '<div class="compare-tip__title">' + escapeHtml(payload.metric || '') + '</div>' +
      '<div class="compare-tip__row compare-tip__row--muted">' +
        '<span class="compare-tip__label">' + escapeHtml(payload.cmpDay) + '</span>' +
        '<span class="compare-tip__val">' + escapeHtml(payload.cmpVal) + '</span>' +
      '</div>' +
      '<div class="compare-tip__row compare-tip__row--strong">' +
        '<span class="compare-tip__label">' + escapeHtml(payload.curDay) + '</span>' +
        '<span class="compare-tip__val">' + escapeHtml(payload.curVal) + '</span>' +
      '</div>' +
      '<div class="compare-tip__row">' +
        '<span class="compare-tip__label compare-tip__label--muted">%变更</span>' +
        '<span class="' + deltaValCls + '">' + escapeHtml(payload.delta) + '</span>' +
      '</div>';
    tip.hidden = false;
    tip.setAttribute('aria-hidden', 'false');
    tip.classList.add('is-show');
    var rect = anchor.getBoundingClientRect();
    var tipRect = tip.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - tipRect.width / 2;
    var top = rect.top - tipRect.height - 8;
    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
    if (top < 8) top = rect.bottom + 8;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  /* ========== Modals ========== */
  function openAddBoard(folderId) {
    openBoardForm('add', null, folderId || 'mine');
  }

  function openBoardForm(mode, sourceBoard, folderId) {
    state.boardFormMode = mode || 'add';
    state.boardFormSourceId = sourceBoard ? sourceBoard.id : null;
    var titleMap = { add: '添加看板', edit: '编辑看板', saveAs: '另存为看板' };
    var submitMap = { add: '提交', edit: '保存', saveAs: '保存' };
    $('addBoardTitle').textContent = titleMap[state.boardFormMode] || '添加看板';
    $('addBoardSubmit').textContent = submitMap[state.boardFormMode] || '提交';

    var name = '';
    var type = '';
    var loc = folderId || 'mine';
    if (sourceBoard) {
      name = sourceBoard.name || '';
      type = sourceBoard.type || '';
      if (mode === 'edit') {
        var parent = findParent(sourceBoard.id);
        loc = parent ? parent.id : 'mine';
      } else if (mode === 'saveAs') {
        name = (sourceBoard.name || '').slice(0, 16);
        if (name.length >= 16) name = name.slice(0, 16);
        loc = 'mine';
      }
    }
    state.addTargetFolderId = loc;
    state.addBoardType = type;
    $('addBoardName').value = name;
    $('addBoardNameCount').textContent = name.length + '/20';
    $('addBoardNameItem').classList.remove('is-error');
    $('addBoardLocItem').classList.remove('is-error');
    $('addBoardTypeItem').classList.remove('is-error');
    refreshAddBoardLocOptions();
    if (state.addBoardTypeSelect) state.addBoardTypeSelect.syncLabel(type);

    var typeTrigger = $('addBoardTypeTrigger');
    var locTrigger = $('addBoardLocTrigger');
    if (mode === 'edit' || mode === 'saveAs') {
      typeTrigger.classList.add('is-disabled');
      typeTrigger.disabled = true;
    } else {
      typeTrigger.classList.remove('is-disabled');
      typeTrigger.disabled = false;
    }
    locTrigger.classList.remove('is-disabled');
    locTrigger.disabled = false;
    openModal('addBoardModal');
  }

  function refreshAddBoardLocOptions() {
    var folders = listCustomFolders();
    var panel = $('addBoardLocPanel');
    panel.innerHTML = folders.map(function (f) {
      return '<div class="single-option' + (f.id === state.addTargetFolderId ? ' is-active' : '') + '" data-value="' + f.id + '">' + escapeHtml(f.name) + '</div>';
    }).join('');
    var current = folders.find(function (f) { return f.id === state.addTargetFolderId; }) || folders[0];
    state.addTargetFolderId = current.id;
    if (state.addBoardLocSelect) state.addBoardLocSelect.syncLabel(current.id);
    else $('addBoardLocLabel').textContent = current.name;
  }

  function submitAddBoard() {
    var name = ($('addBoardName').value || '').trim();
    var type = state.addBoardType || '';
    var loc = state.addTargetFolderId || '';
    var ok = true;
    if (!name) {
      $('addBoardNameItem').classList.add('is-error');
      ok = false;
    } else {
      $('addBoardNameItem').classList.remove('is-error');
    }
    if (!loc || !findNode(loc) || (findNode(loc).kind !== 'mine' && findNode(loc).kind !== 'folder')) {
      $('addBoardLocItem').classList.add('is-error');
      ok = false;
    } else {
      $('addBoardLocItem').classList.remove('is-error');
    }
    if (!type) {
      $('addBoardTypeItem').classList.add('is-error');
      ok = false;
    } else {
      $('addBoardTypeItem').classList.remove('is-error');
    }
    if (!ok) return;

    var parent = findNode(state.addTargetFolderId) || findNode('mine');
    if (!parent || (parent.kind !== 'mine' && parent.kind !== 'folder')) {
      $('addBoardLocItem').classList.add('is-error');
      showToast('请选择「我的看板」或示例文件夹', 'error');
      return;
    }
    if (!parent.children) parent.children = [];

    if (state.boardFormMode === 'edit' && state.boardFormSourceId) {
      var editing = findNode(state.boardFormSourceId);
      if (!editing || !canEditBoard(editing)) {
        showToast('当前看板不可编辑', 'error');
        return;
      }
      editing.name = name;
      var oldParent = findParent(editing.id);
      if (oldParent && oldParent.id !== parent.id) {
        oldParent.children = (oldParent.children || []).filter(function (c) { return c.id !== editing.id; });
        editing.owner = parent.kind === 'folder' ? 'folder' : 'mine';
        parent.children.push(editing);
        parent.expanded = true;
      }
      editing.updatedAt = formatDateTime(new Date());
      closeModal('addBoardModal');
      showToast('看板已保存');
      loadBoard(editing.id);
      return;
    }

    if (state.boardFormMode === 'saveAs' && state.boardFormSourceId) {
      var source = findNode(state.boardFormSourceId);
      var boardFrom = boardTpl(UI.uid('board'), name, type, parent.kind === 'folder' ? 'folder' : 'mine', {
        tag: source ? source.tag : '',
        dimensions: source ? source.dimensions.slice() : DEMO_DIMENSIONS.slice(),
        filters: source ? source.filters.slice() : DEMO_FILTERS.slice(),
        metrics: source ? source.metrics.slice() : DEMO_METRICS.slice(),
        updatedAt: formatDateTime(new Date())
      });
      parent.children.push(boardFrom);
      parent.expanded = true;
      closeModal('addBoardModal');
      showToast('已另存为看板');
      loadBoard(boardFrom.id);
      return;
    }

    var board = boardTpl(UI.uid('board'), name, type, parent.kind === 'folder' ? 'folder' : 'mine', {
      updatedAt: formatDateTime(new Date())
    });
    parent.children.push(board);
    parent.expanded = true;
    closeModal('addBoardModal');
    showToast('看板已创建');
    loadBoard(board.id);
  }

  function openFolderModal(mode, id) {
    state.folderModalMode = mode;
    state.folderTargetId = id || null;
    $('folderModalTitle').textContent = mode === 'rename' ? '重命名文件夹' : '新建文件夹';
    var name = '';
    if (mode === 'rename' && id) {
      var node = findNode(id);
      name = node ? node.name : '';
    }
    $('folderNameInput').value = name;
    $('folderNameCount').textContent = name.length + '/20';
    $('folderNameItem').classList.remove('is-error');
    openModal('folderModal');
  }

  function submitFolder() {
    var name = ($('folderNameInput').value || '').trim();
    if (!name) {
      $('folderNameItem').classList.add('is-error');
      return;
    }
    if (state.folderModalMode === 'rename' && state.folderTargetId) {
      var node = findNode(state.folderTargetId);
      if (node) node.name = name;
      showToast('已重命名');
    } else {
      // 文件夹仅支持一级：挂在根目录，不可嵌套
      store.folders.push({
        id: UI.uid('folder'),
        name: name,
        kind: 'folder',
        expanded: true,
        children: []
      });
      showToast('文件夹已创建');
    }
    closeModal('folderModal');
    renderTree();
  }

  function defaultFilterValues() {
    return { compare: 'none', platform: '全部', campaign: '' };
  }

  function cloneFilterValues(values) {
    var out = {};
    Object.keys(values || {}).forEach(function (k) {
      out[k] = Array.isArray(values[k]) ? values[k].slice() : values[k];
    });
    return out;
  }

  function closeFsDatePanel() {
    var panel = $('fsDatePanel');
    var trigger = $('fsDateTrigger');
    if (panel) panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
    if (trigger) trigger.classList.remove('is-open');
  }

  function filterSettingControlHtml(f) {
    var key = f.key;
    var meta = f;
    if (key === 'date') {
      return '<div class="filter-setting-control filter-setting-control--date" id="fsDateWrap">' +
        '<button class="date-range-trigger" type="button" id="fsDateTrigger">' +
          '<span class="date-range-trigger__text" id="fsDateLabel">日期：-</span>' +
        '</button>' +
        '<div class="date-panel" id="fsDatePanel">' +
          '<div class="date-panel__shortcuts" id="fsDateShortcuts">' +
            '<button class="date-shortcut" type="button" data-shortcut="today">今天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="yesterday">昨天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="last7">近7天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="last30">近30天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="thisWeek">本周</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="lastWeek">上周</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="thisMonth">本月</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="lastMonth">上月</button>' +
          '</div>' +
          '<div class="date-panel__calendars">' +
            '<div class="date-cal" id="fsDateCalLeft"></div>' +
            '<div class="date-cal" id="fsDateCalRight"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    if (key === 'campaign') {
      var campaignVal = state.filterValues.campaign || '';
      return '<div class="filter-setting-control' + (campaignVal ? ' has-value' : '') + '" id="fsWrap_campaign">' +
        '<label class="select-trigger select-trigger--input" for="fs_campaign">' +
          '<span class="select-trigger__prefix">推广活动：</span>' +
          '<input class="select-trigger__field" type="text" id="fs_campaign" placeholder="请输入" value="' + escapeHtml(campaignVal) + '" autocomplete="off" />' +
        '</label>' +
        '<button class="select-clear" type="button" id="fsClear_campaign" data-fs-clear-icon="campaign" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
      '</div>';
    }
    if (key === 'compare') {
      return '<div class="filter-setting-control" id="fsWrap_compare">' +
        '<button class="select-trigger" type="button" id="fsTrigger_compare">' +
          '<span class="select-trigger__text" id="fsLabel_compare">对比：<span class="muted">请选择对比</span></span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<div class="compare-panel" id="fsPanel_compare"></div>' +
        '<div class="date-panel compare-custom-panel" id="fsCompareCustomPanel">' +
          '<div class="date-panel__calendars">' +
            '<div class="date-cal" id="fsCompareCalLeft"></div>' +
            '<div class="date-cal" id="fsCompareCalRight"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    if (isMultiFilter(key)) {
      var dual = useDualMulti(key);
      return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
        '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
          '<span class="select-trigger__text" id="fsLabel_' + key + '">' + meta.label + '：<span class="muted">请选择</span></span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<button class="select-clear" type="button" data-fs-clear-icon="' + key + '" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
        multiPanelHtml(key, dual, 'fs') +
      '</div>';
    }
    var options = filterOptions(key);
    return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
      '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
        '<span class="select-trigger__text" id="fsLabel_' + key + '">' + meta.label + '：<span class="muted">请选择</span></span>' +
        '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
      '</button>' +
      '<button class="select-clear" type="button" data-fs-clear-icon="' + key + '" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>' +
      '<div class="single-panel" id="fsPanel_' + key + '">' +
        options.map(function (o) {
          return '<div class="single-option" data-value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function bindFilterSettingsControls() {
    ALL_FILTERS.forEach(function (f) {
      var key = f.key;
      if (key === 'date') return;

      if (key === 'campaign') {
        var input = $('fs_campaign');
        if (!input) return;
        if (state.filterValues.campaign == null) state.filterValues.campaign = '';
        syncCampaignHasValue('fs');
        input.addEventListener('input', function () {
          state.filterValues.campaign = input.value;
          syncCampaignHasValue('fs');
          var mainInput = $('filter_campaign');
          if (mainInput) {
            mainInput.value = input.value;
            syncCampaignHasValue('filter');
          }
        });
        input.addEventListener('click', function (e) { e.stopPropagation(); });
        var clearBtn = $('fsClear_campaign');
        if (clearBtn) {
          clearBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            state.filterValues.campaign = '';
            syncCampaignHasValue('fs');
            syncCampaignHasValue('filter');
            var mainInput = $('filter_campaign');
            if (mainInput) mainInput.value = '';
            input.focus();
          });
        }
        return;
      }

      if (key === 'compare') {
        bindCompareFilter('fs');
        return;
      }

      var isMulti = isMultiFilter(key);
      if (key === 'platform' && !state.filterValues[key]) state.filterValues[key] = '全部';
      if (state.filterValues[key] == null) state.filterValues[key] = isMulti ? [] : '';

      if (isMulti) {
        var dual = useDualMulti(key);
        var multiCfg = {
          wrapId: 'fsWrap_' + key,
          triggerId: 'fsTrigger_' + key,
          panelId: 'fsPanel_' + key,
          labelId: 'fsLabel_' + key,
          listId: 'fsList_' + key,
          selectedId: dual ? 'fsSelected_' + key : null,
          searchId: dual ? 'fsSearch_' + key : null,
          countId: dual ? 'fsCount_' + key : null,
          selectAllId: null,
          clearId: null,
          prefix: f.label + '：',
          getOptions: function () { return filterOptions(key); },
          getSelected: function () { return state.filterValues[key] || []; },
          setSelected: function (arr) { state.filterValues[key] = arr; }
        };
        if (key === 'product') {
          multiCfg.getLabel = productOptionLabel;
          multiCfg.getIconHtml = productOptionIconHtml;
        }
        UI.bindMultiSelect(multiCfg);
        var allBtn = document.querySelector('[data-fs-all="' + key + '"]');
        var clearBtn = document.querySelector('[data-fs-clear="' + key + '"]');
        var clearIcon = document.querySelector('[data-fs-clear-icon="' + key + '"]');
        if (allBtn) {
          allBtn.addEventListener('click', function () {
            state.filterValues[key] = filterOptions(key).slice();
            openFilterSettings();
          });
        }
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            state.filterValues[key] = [];
            openFilterSettings();
          });
        }
        if (clearIcon) {
          clearIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            state.filterValues[key] = [];
            openFilterSettings();
          });
        }
      } else {
        UI.bindSingleSelect({
          wrapId: 'fsWrap_' + key,
          triggerId: 'fsTrigger_' + key,
          panelId: 'fsPanel_' + key,
          labelId: 'fsLabel_' + key,
          clearId: null,
          prefix: f.label + '：',
          getValue: function () { return state.filterValues[key] || ''; },
          onChange: function (v) { state.filterValues[key] = v; }
        });
        var clearIcon2 = document.querySelector('[data-fs-clear-icon="' + key + '"]');
        if (clearIcon2) {
          clearIcon2.addEventListener('click', function (e) {
            e.stopPropagation();
            state.filterValues[key] = key === 'platform' ? '全部' : '';
            openFilterSettings();
          });
        }
      }
    });

    syncDateLabel();
    syncShortcutActive();
    renderFsCalendars();
  }

  function openFilterSettings() {
    var board = findNode(state.activeBoardId);
    if (!canManageConfig(board)) return;
    if (!state.filterSettingsSnapshot) {
      state.filterSettingsSnapshot = {
        filters: (state.draft.filters || []).slice(),
        filterValues: cloneFilterValues(state.filterValues),
        dateStart: state.dateStart ? new Date(state.dateStart.getTime()) : null,
        dateEnd: state.dateEnd ? new Date(state.dateEnd.getTime()) : null,
        dateShortcut: state.dateShortcut,
        compareCustomStart: state.compareCustomStart ? new Date(state.compareCustomStart.getTime()) : null,
        compareCustomEnd: state.compareCustomEnd ? new Date(state.compareCustomEnd.getTime()) : null
      };
    }

    var grid = $('filterCheckGrid');
    var preserveChecked = grid && grid.querySelector('input[type="checkbox"]');
    if (preserveChecked) {
      state.filterVisibleDraft = [];
      grid.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
        if (input.checked || input.disabled) state.filterVisibleDraft.push(input.value);
      });
    } else {
      state.filterVisibleDraft = (state.draft.filters || []).slice();
    }

    function renderFilterSettingItem(f) {
      var checked = state.filterVisibleDraft.indexOf(f.key) >= 0;
      return '<div class="filter-setting-item" data-fs-key="' + f.key + '">' +
        '<input type="checkbox" value="' + f.key + '"' + (checked ? ' checked' : '') + (f.locked ? ' disabled' : '') + ' />' +
        filterSettingControlHtml(f) +
      '</div>';
    }

    var dateFilter = ALL_FILTERS.find(function (f) { return f.key === 'date'; });
    var otherFilters = ALL_FILTERS.filter(function (f) { return f.key !== 'date'; });
    var rowsHtml = '<div class="filter-setting-row filter-setting-row--date">' +
      renderFilterSettingItem(dateFilter) +
    '</div>';
    for (var i = 0; i < otherFilters.length; i += 3) {
      rowsHtml += '<div class="filter-setting-row">' +
        otherFilters.slice(i, i + 3).map(renderFilterSettingItem).join('') +
      '</div>';
    }
    $('filterCheckGrid').innerHTML = rowsHtml;
    bindFilterSettingsControls();
    openModal('filterModal');
  }

  function restoreFilterSettingsSnapshot() {
    var snap = state.filterSettingsSnapshot;
    if (!snap) return;
    state.filterValues = cloneFilterValues(snap.filterValues);
    state.dateStart = snap.dateStart ? new Date(snap.dateStart.getTime()) : null;
    state.dateEnd = snap.dateEnd ? new Date(snap.dateEnd.getTime()) : null;
    state.dateShortcut = snap.dateShortcut;
    state.compareCustomStart = snap.compareCustomStart ? new Date(snap.compareCustomStart.getTime()) : null;
    state.compareCustomEnd = snap.compareCustomEnd ? new Date(snap.compareCustomEnd.getTime()) : null;
    state.filterSettingsSnapshot = null;
  }

  function submitFilterSettings() {
    var selected = [];
    $('filterCheckGrid').querySelectorAll('input[type="checkbox"]').forEach(function (input) {
      if (input.checked || input.disabled) selected.push(input.value);
    });
    selected = ALL_FILTERS.map(function (f) { return f.key; }).filter(function (key) {
      return selected.indexOf(key) >= 0;
    });
    if (selected.indexOf('date') < 0) selected.unshift('date');
    state.draft.filters = selected;
    state.filterSettingsSnapshot = null;
    closeFsDatePanel();
    UI.closePanels();
    closeModal('filterModal');
    renderDynamicFilters();
    renderTable();
    showToast('筛选项已更新，保存看板后生效');
  }

  function cancelFilterSettings() {
    restoreFilterSettingsSnapshot();
    closeFsDatePanel();
    UI.closePanels();
    closeModal('filterModal');
    renderDynamicFilters();
    renderTable();
  }

  function getColumnItem(key) {
    return COLUMN_MAP[key] || { key: key, name: key, group: '基础指标' };
  }

  function isDefaultFrozenKey(key, board) {
    var item = COLUMN_MAP[key];
    if (item && item.defaultFrozen) return true;
    if (board && board.lockedMetric && board.lockedMetric === key) return true;
    return false;
  }

  function minFrozenCount(draft, board) {
    var n = 0;
    draft.forEach(function (key) {
      if (isDefaultFrozenKey(key, board)) n += 1;
    });
    return n;
  }

  function normalizeMetricDraft(draft, board) {
    var seen = {};
    var list = [];
    (draft || []).forEach(function (key) {
      if (!key || seen[key]) return;
      seen[key] = true;
      list.push(key);
    });
    COLUMN_ITEMS.forEach(function (item) {
      if (item.defaultFrozen && !seen[item.key]) {
        list.unshift(item.key);
        seen[item.key] = true;
      }
    });
    if (board && board.lockedMetric && !seen[board.lockedMetric]) {
      list.unshift(board.lockedMetric);
    }
    var locked = [];
    var free = [];
    list.forEach(function (key) {
      if (isDefaultFrozenKey(key, board)) locked.push(key);
      else free.push(key);
    });
    return locked.concat(free);
  }

  function openMetricModal() {
    var board = findNode(state.activeBoardId);
    if (!canManageConfig(board)) return;
    state.metricDraft = normalizeMetricDraft(state.draft.metrics || [], board);
    state.metricFrozenCount = Math.max(
      minFrozenCount(state.metricDraft, board),
      board && board.frozenMetricCount != null ? Math.min(board.frozenMetricCount, state.metricDraft.length) : 0
    );
    if (state.metricFrozenCount < minFrozenCount(state.metricDraft, board)) {
      state.metricFrozenCount = minFrozenCount(state.metricDraft, board);
    }
    if (!state.metricFrozenCount && state.metricDraft.length) state.metricFrozenCount = 1;
    state.metricCat = COLUMN_GROUPS[0];
    $('metricSearch').value = '';
    renderMetricModal();
    openModal('metricModal');
    hideMetricDefTip();
  }

  function filteredColumnItems() {
    var kw = ($('metricSearch').value || '').trim().toLowerCase();
    return COLUMN_ITEMS.filter(function (item) {
      if (!kw) return true;
      return item.name.toLowerCase().indexOf(kw) >= 0 ||
        item.key.toLowerCase().indexOf(kw) >= 0 ||
        (item.definition || '').toLowerCase().indexOf(kw) >= 0;
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
    var board = findNode(state.activeBoardId);
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
      var selectable = list.filter(function (item) { return !isDefaultFrozenKey(item.key, board); });
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      var groupDisabled = selectable.length === 0;

      return '<section class="metric-group" id="metric-group-' + escapeHtml(cat) + '" data-group="' + escapeHtml(cat) + '">' +
        '<div class="metric-group__head">' +
          '<input class="metric-check" type="checkbox" data-group-check="' + escapeHtml(cat) + '"' +
            (allChecked ? ' checked' : '') +
            (groupDisabled ? ' disabled' : '') +
            ' aria-label="全选' + escapeHtml(cat) + '" />' +
          '<span>' + escapeHtml(cat) + '</span>' +
        '</div>' +
        '<div class="metric-group__grid">' +
          list.map(function (item) {
            var checked = state.metricDraft.indexOf(item.key) >= 0;
            var disabled = isDefaultFrozenKey(item.key, board);
            return '<label class="metric-option' + (disabled ? ' is-disabled' : '') + '"' +
              (item.definition ? ' data-definition="' + escapeHtml(item.definition) + '"' : '') + '>' +
              '<input class="metric-check" type="checkbox" value="' + escapeHtml(item.key) + '"' +
                (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />' +
              '<span class="metric-option__name">' + escapeHtml(item.name) + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
      '</section>';
    }).join('') || '<div class="transfer__empty">无匹配指标</div>';

    /* indeterminate for group checkboxes */
    $('metricOptions').querySelectorAll('[data-group-check]').forEach(function (input) {
      var cat = input.getAttribute('data-group-check');
      var list = grouped[cat] || [];
      var checkedCount = list.filter(function (item) { return state.metricDraft.indexOf(item.key) >= 0; }).length;
      var allChecked = list.length > 0 && checkedCount === list.length;
      input.indeterminate = checkedCount > 0 && !allChecked;
    });

    bindMetricDefinitionTips();

    $('metricSelectedCount').textContent = '已选 ' + state.metricDraft.length + ' 列';
    var freezeAt = Math.min(Math.max(state.metricFrozenCount, 0), state.metricDraft.length);
    state.metricFrozenCount = Math.max(freezeAt, minFrozenCount(state.metricDraft, board));
    freezeAt = state.metricFrozenCount;

    var listHtml = '';
    if (!state.metricDraft.length) {
      listHtml = '<div class="transfer__empty">请添加指标</div>';
    } else {
      state.metricDraft.forEach(function (key, idx) {
        if (idx === freezeAt) {
          listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
        }
        var item = getColumnItem(key);
        var forced = isDefaultFrozenKey(key, board);
        var frozen = idx < freezeAt;
        var canDrag = !forced;
        var icon = frozen
          ? '<svg class="metric-selected__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
          : '<svg class="metric-selected__drag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        var remove = forced
          ? ''
          : '<button class="metric-selected__remove" type="button" data-remove-metric="' + escapeHtml(key) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button>';
        listHtml +=
          '<div class="metric-selected__item' + (frozen ? ' is-frozen' : '') + '" draggable="' + (canDrag ? 'true' : 'false') + '" data-metric="' + escapeHtml(key) + '" data-index="' + idx + '">' +
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
    var board = findNode(state.activeBoardId);
    if (isDefaultFrozenKey(key, board)) return;
    var idx = state.metricDraft.indexOf(key);
    if (checked && idx < 0) {
      state.metricDraft.push(key);
    } else if (!checked && idx >= 0) {
      state.metricDraft.splice(idx, 1);
      if (idx < state.metricFrozenCount) {
        state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft, board), state.metricFrozenCount - 1);
      }
    }
    state.metricFrozenCount = Math.max(state.metricFrozenCount, minFrozenCount(state.metricDraft, board));
  }

  function submitMetrics() {
    var board = findNode(state.activeBoardId);
    if (!state.metricDraft.length) {
      showToast('请至少选择 1 个指标', 'error');
      return;
    }
    state.draft.metrics = state.metricDraft.slice();
    if (board) board.frozenMetricCount = state.metricFrozenCount;
    closeModal('metricModal');
    renderTable();
    showToast('自定义列已更新，保存看板后生效');
    /* 对外抛出排好序的 Key 列表，便于业务接入 */
    try {
      document.dispatchEvent(new CustomEvent('dashboard:columns-confirm', {
        detail: { keys: state.metricDraft.slice(), frozenCount: state.metricFrozenCount }
      }));
    } catch (err) { /* ignore */ }
  }

  function scrollToMetricGroup(cat) {
    var el = document.getElementById('metric-group-' + cat);
    var scroller = $('metricOptions');
    if (!el || !scroller) return;
    state.metricAnchorLock = true;
    state.metricCat = cat;
    Array.prototype.forEach.call($('metricCatList').querySelectorAll('.metric-cat'), function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-cat') === cat);
    });
    scroller.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' });
    window.setTimeout(function () { state.metricAnchorLock = false; }, 400);
  }

  function syncMetricAnchorOnScroll() {
    if (state.metricAnchorLock) return;
    var scroller = $('metricOptions');
    if (!scroller) return;
    var groups = scroller.querySelectorAll('.metric-group');
    if (!groups.length) return;
    var top = scroller.scrollTop + 24;
    var active = groups[0].getAttribute('data-group');
    Array.prototype.forEach.call(groups, function (g) {
      if (g.offsetTop <= top) active = g.getAttribute('data-group');
    });
    if (active && active !== state.metricCat) {
      state.metricCat = active;
      Array.prototype.forEach.call($('metricCatList').querySelectorAll('.metric-cat'), function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-cat') === active);
      });
    }
  }

  var metricDefTipTimer = null;
  var metricDefTipEl = null;

  function ensureMetricDefTip() {
    if (metricDefTipEl) return metricDefTipEl;
    metricDefTipEl = document.createElement('div');
    metricDefTipEl.id = 'metricDefTip';
    metricDefTipEl.className = 'form-help-tip';
    metricDefTipEl.setAttribute('role', 'tooltip');
    metricDefTipEl.innerHTML = '<span class="form-help-tip__text"></span><span class="form-help-tip__arrow" aria-hidden="true"></span>';
    document.body.appendChild(metricDefTipEl);
    return metricDefTipEl;
  }

  function hideMetricDefTip() {
    if (metricDefTipTimer) {
      clearTimeout(metricDefTipTimer);
      metricDefTipTimer = null;
    }
    if (metricDefTipEl) metricDefTipEl.classList.remove('is-open', 'is-below');
  }

  function showMetricDefTip(anchor) {
    var msg = anchor.getAttribute('data-definition') || '';
    if (!msg) return;
    var tip = ensureMetricDefTip();
    var textEl = tip.querySelector('.form-help-tip__text');
    if (textEl) textEl.textContent = msg;

    /* 对齐指标名称，而非整行（含复选框的宽单元格） */
    var target = anchor.querySelector('.metric-option__name') || anchor;

    tip.classList.remove('is-below');
    tip.classList.add('is-open');
    tip.style.left = '0px';
    tip.style.top = '0px';

    function place() {
      var a = target.getBoundingClientRect();
      var t = tip.getBoundingClientRect();
      if (!t.width || !t.height) return;
      var gap = 6;
      var pad = 8;
      var left = a.left + a.width / 2 - t.width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - t.width - pad));
      var top = a.top - t.height - gap;
      if (top < pad) {
        top = a.bottom + gap;
        tip.classList.add('is-below');
      } else {
        tip.classList.remove('is-below');
      }
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
      tip.style.setProperty('--arrow-left', (a.left + a.width / 2 - left) + 'px');
    }

    place();
    requestAnimationFrame(place);
  }

  function bindMetricDefinitionTips() {
    var root = $('metricOptions');
    if (!root) return;
    root.querySelectorAll('.metric-option[data-definition]').forEach(function (el) {
      if (el.getAttribute('data-def-bound') === '1') return;
      el.setAttribute('data-def-bound', '1');
      el.addEventListener('mouseenter', function () {
        hideMetricDefTip();
        metricDefTipTimer = setTimeout(function () {
          metricDefTipTimer = null;
          showMetricDefTip(el);
        }, 1000);
      });
      el.addEventListener('mouseleave', hideMetricDefTip);
    });
  }

  function openShareModal() {
    var board = findNode(state.activeBoardId);
    if (!canEditBoard(board)) return;
    state.shareDraft = (board.sharedUsers || []).slice();
    state.shareAvailChecked = [];
    state.shareSelectedChecked = [];
    $('shareAvailSearch').value = '';
    $('shareSelectedSearch').value = '';
    renderShare();
    openModal('shareModal');
  }

  function getShareLists() {
    var availKw = ($('shareAvailSearch').value || '').trim().toLowerCase();
    var selKw = ($('shareSelectedSearch').value || '').trim().toLowerCase();
    var selected = state.shareDraft;
    var available = USERS.filter(function (u) { return selected.indexOf(u) < 0; });
    var availVisible = available.filter(function (u) { return !availKw || u.toLowerCase().indexOf(availKw) >= 0; });
    var selVisible = selected.filter(function (u) { return !selKw || u.toLowerCase().indexOf(selKw) >= 0; });
    return {
      selected: selected,
      available: available,
      availVisible: availVisible,
      selVisible: selVisible
    };
  }

  function syncShareCheckAll(el, visible, checkedArr) {
    if (!el) return;
    if (!visible.length) {
      el.checked = false;
      el.indeterminate = false;
      el.disabled = true;
      return;
    }
    el.disabled = false;
    var n = 0;
    visible.forEach(function (u) {
      if (checkedArr.indexOf(u) >= 0) n += 1;
    });
    el.checked = n === visible.length;
    el.indeterminate = n > 0 && n < visible.length;
  }

  function renderShare() {
    var lists = getShareLists();
    var available = lists.available;
    var selected = lists.selected;
    var availVisible = lists.availVisible;
    var selVisible = lists.selVisible;

    $('shareAvailCount').textContent = state.shareAvailChecked.length + ' / ' + available.length;
    $('shareSelectedCount').textContent = state.shareSelectedChecked.length + ' / ' + selected.length;

    $('shareAvailList').innerHTML = availVisible.length
      ? availVisible.map(function (u) {
          var checked = state.shareAvailChecked.indexOf(u) >= 0;
          return '<label class="transfer__item' + (checked ? ' is-checked' : '') + '"><input type="checkbox" value="' + escapeHtml(u) + '"' + (checked ? ' checked' : '') + '/><span>' + escapeHtml(u) + '</span></label>';
        }).join('')
      : '<div class="transfer__empty">暂无用户</div>';

    $('shareSelectedList').innerHTML = selVisible.length
      ? selVisible.map(function (u) {
          var checked = state.shareSelectedChecked.indexOf(u) >= 0;
          return '<label class="transfer__item' + (checked ? ' is-checked' : '') + '"><input type="checkbox" value="' + escapeHtml(u) + '"' + (checked ? ' checked' : '') + '/><span>' + escapeHtml(u) + '</span></label>';
        }).join('')
      : '<div class="transfer__empty">暂无已选</div>';

    syncShareCheckAll($('shareAvailCheckAll'), availVisible, state.shareAvailChecked);
    syncShareCheckAll($('shareSelectedCheckAll'), selVisible, state.shareSelectedChecked);

    $('shareMoveRight').disabled = !state.shareAvailChecked.length;
    $('shareMoveLeft').disabled = !state.shareSelectedChecked.length;
  }

  function submitShare() {
    var board = findNode(state.activeBoardId);
    if (!board) return;
    board.sharedUsers = state.shareDraft.slice();
    state.saved.sharedUsers = board.sharedUsers.slice();
    closeModal('shareModal');
    showToast('分享设置已保存');
  }

  function saveBoardConfig() {
    var board = findNode(state.activeBoardId);
    if (!canSaveBoardConfig(board)) return;
    board.dimensions = state.dimSelected.slice();
    board.filters = state.draft.filters.slice();
    board.metrics = state.draft.metrics.slice();
    if (board.frozenMetricCount == null) board.frozenMetricCount = minFrozenCount(board.metrics, board);
    board.updatedAt = formatDateTime(new Date());
    state.saved = {
      dimensions: board.dimensions.slice(),
      filters: board.filters.slice(),
      metrics: board.metrics.slice(),
      sharedUsers: (board.sharedUsers || []).slice()
    };
    state.draft = clone(state.saved);
    $('boardUpdated').textContent = board.updatedAt;
    showToast('看板配置已保存');
  }

  function resetFilters() {
    state.filterValues = defaultFilterValues();
    state.compareCustomStart = null;
    state.compareCustomEnd = null;
    state.comparePickingStart = null;
    var r = getShortcutRange('last7');
    setDateRange(r[0], r[1], 'last7');
    renderDynamicFilters();
    state.page = 1;
    renderTable();
    showToast('已重置筛选条件');
  }

  function queryTable() {
    state.page = 1;
    renderTable();
    showToast('查询完成');
  }

  /* ========== Events ========== */
  function closeCtx() {
    $('folderCtx').classList.remove('is-open');
    var boardOps = $('boardOpsCtx');
    if (boardOps) boardOps.classList.remove('is-open');
    document.querySelectorAll('.board-tree__row.is-menu-open').forEach(function (el) {
      el.classList.remove('is-menu-open');
    });
  }

  function openBoardOpsMenu(anchorEl, boardId) {
    var board = findNode(boardId || state.activeBoardId);
    if (!board || getBoardScope(board) === 'shared') return;
    var ctx = $('boardOpsCtx');
    ctx.setAttribute('data-board-id', board.id);
    var editBtn = ctx.querySelector('[data-board-op="edit"]');
    var saveAsBtn = ctx.querySelector('[data-board-op="saveAs"]');
    var delBtn = ctx.querySelector('[data-board-op="delete"]');
    editBtn.hidden = !canEditBoard(board);
    saveAsBtn.hidden = !canSaveAsBoard(board);
    delBtn.hidden = !canDeleteBoard(board);
    if (editBtn.hidden && saveAsBtn.hidden && delBtn.hidden) return;
    var rect = anchorEl.getBoundingClientRect();
    ctx.style.left = Math.min(rect.left, window.innerWidth - 140) + 'px';
    ctx.style.top = (rect.bottom + 4) + 'px';
    ctx.classList.add('is-open');
  }

  function closeAddMenu() {
    $('addMenu').classList.remove('is-open');
  }

  function closeDatePanel() {
    var panel = $('datePanel');
    var trigger = $('dateRangeTrigger');
    if (panel) {
      panel.classList.remove('is-open', 'is-align-right', 'is-dropup');
    }
    if (trigger) trigger.classList.remove('is-open');
  }

  document.addEventListener('click', function () {
    closeCtx();
    closeAddMenu();
    closeDatePanel();
    closeFsDatePanel();
    closeComparePanels();
  });

  $('sidebarToggle').addEventListener('click', function () {
    $('sidebar').classList.toggle('is-collapsed');
  });

  $('treeSearch').addEventListener('input', function () {
    state.treeKeyword = this.value;
    renderTree();
  });

  $('addMenuBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var menu = $('addMenu');
    var open = !menu.classList.contains('is-open');
    closeCtx();
    UI.closePanels();
    closeDatePanel();
    menu.classList.toggle('is-open', open);
  });

  $('addMenu').addEventListener('click', function (e) {
    e.stopPropagation();
    var item = e.target.closest('[data-add]');
    if (!item) return;
    closeAddMenu();
    if (item.getAttribute('data-add') === 'board') openAddBoard('mine');
    else openFolderModal('create');
  });

  $('boardTree').addEventListener('click', function (e) {
    e.stopPropagation();
    var addBtn = e.target.closest('[data-tree-add]');
    if (addBtn) {
      openAddBoard(addBtn.getAttribute('data-tree-add'));
      return;
    }
    var moreBtn = e.target.closest('[data-tree-more]');
    if (moreBtn) {
      var id = moreBtn.getAttribute('data-tree-more');
      var folderCtx = $('folderCtx');
      var folderAlreadyOpen = folderCtx.classList.contains('is-open') && folderCtx.getAttribute('data-folder-id') === id;
      closeAddMenu();
      UI.closePanels();
      closeDatePanel();
      closeCtx();
      if (!folderAlreadyOpen) {
        var rect = moreBtn.getBoundingClientRect();
        folderCtx.setAttribute('data-folder-id', id);
        folderCtx.style.left = Math.min(rect.left, window.innerWidth - 140) + 'px';
        folderCtx.style.top = (rect.bottom + 4) + 'px';
        folderCtx.classList.add('is-open');
        moreBtn.closest('.board-tree__row').classList.add('is-menu-open');
      }
      return;
    }
    var boardMoreBtn = e.target.closest('[data-tree-board-more]');
    if (boardMoreBtn) {
      var boardId = boardMoreBtn.getAttribute('data-tree-board-more');
      var opsCtx = $('boardOpsCtx');
      var alreadyOpen = opsCtx.classList.contains('is-open') && opsCtx.getAttribute('data-board-id') === boardId;
      closeAddMenu();
      UI.closePanels();
      closeDatePanel();
      closeCtx();
      if (!alreadyOpen) {
        openBoardOpsMenu(boardMoreBtn, boardId);
        boardMoreBtn.closest('.board-tree__row').classList.add('is-menu-open');
      }
      return;
    }
    var row = e.target.closest('[data-tree-id]');
    if (!row) return;
    var nodeId = row.getAttribute('data-tree-id');
    var kind = row.getAttribute('data-tree-kind');
    var node = findNode(nodeId);
    if (!node) return;
    if (kind === 'board') {
      loadBoard(nodeId);
      return;
    }
    node.expanded = !node.expanded;
    renderTree();
  });

  $('folderCtx').addEventListener('click', function (e) {
    e.stopPropagation();
    var item = e.target.closest('[data-ctx]');
    if (!item) return;
    var folderId = $('folderCtx').getAttribute('data-folder-id');
    closeCtx();
    if (item.getAttribute('data-ctx') === 'rename') {
      openFolderModal('rename', folderId);
    } else {
      state.confirmAction = { type: 'deleteFolder', id: folderId };
      var folder = findNode(folderId);
      var hasKids = folder && folder.children && folder.children.length;
      $('confirmModalBody').textContent = hasKids
        ? '文件夹内含有看板，删除后看板将一并移除，确定删除吗？'
        : '确定删除该文件夹吗？删除后不可恢复。';
      openModal('confirmModal');
    }
  });

  $('confirmOk').addEventListener('click', function () {
    if (state.confirmAction && state.confirmAction.type === 'deleteFolder') {
      var id = state.confirmAction.id;
      var folderNode = findNode(id);
      var removedActive = folderNode && nodeContains(folderNode, state.activeBoardId);
      removeNode(id);
      if (removedActive) loadBoard(null);
      else renderTree();
      showToast('文件夹已删除');
    } else if (state.confirmAction && state.confirmAction.type === 'deleteBoard') {
      var boardId = state.confirmAction.id;
      var wasActive = state.activeBoardId === boardId;
      removeNode(boardId);
      if (wasActive) loadBoard(null);
      else renderTree();
      showToast('看板已删除');
    }
    state.confirmAction = null;
    closeModal('confirmModal');
  });

  $('boardOpsCtx').addEventListener('click', function (e) {
    e.stopPropagation();
    var item = e.target.closest('[data-board-op]');
    if (!item || item.hidden) return;
    var op = item.getAttribute('data-board-op');
    var boardId = $('boardOpsCtx').getAttribute('data-board-id') || state.activeBoardId;
    var board = findNode(boardId);
    closeCtx();
    if (!board) return;
    if (op === 'edit' && canEditBoard(board)) {
      openBoardForm('edit', board);
    } else if (op === 'saveAs' && canSaveAsBoard(board)) {
      openBoardForm('saveAs', board);
    } else if (op === 'delete' && canDeleteBoard(board)) {
      state.confirmAction = { type: 'deleteBoard', id: board.id };
      $('confirmModalTitle').textContent = '删除确认';
      $('confirmModalBody').textContent = '此操作不可撤销，确定删除吗？';
      openModal('confirmModal');
    }
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close');
      if (id === 'filterModal') {
        cancelFilterSettings();
        return;
      }
      closeModal(id);
    });
  });

  document.querySelectorAll('.modal-mask').forEach(function (mask) {
    mask.addEventListener('click', function (e) {
      if (e.target !== mask) return;
      /* 弹窗点击遮罩不关闭 */
    });
  });

  $('addBoardName').addEventListener('input', function () {
    $('addBoardNameCount').textContent = this.value.length + '/20';
    if (this.value.trim()) $('addBoardNameItem').classList.remove('is-error');
  });

  $('folderNameInput').addEventListener('input', function () {
    $('folderNameCount').textContent = this.value.length + '/20';
    if (this.value.trim()) $('folderNameItem').classList.remove('is-error');
  });

  $('addBoardSubmit').addEventListener('click', submitAddBoard);
  $('folderSubmit').addEventListener('click', submitFolder);
  $('filterSettingBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    openFilterSettings();
  });
  $('filterSubmit').addEventListener('click', submitFilterSettings);
  $('metricsBtn').addEventListener('click', openMetricModal);
  $('metricSubmit').addEventListener('click', submitMetrics);
  $('shareBoardBtn').addEventListener('click', openShareModal);
  $('shareSubmit').addEventListener('click', submitShare);
  $('saveBoardBtn').addEventListener('click', saveBoardConfig);
  $('resetBtn').addEventListener('click', resetFilters);
  $('queryBtn').addEventListener('click', queryTable);
  $('refreshBtn').addEventListener('click', function () { queryTable(); });

  function setBoardFullscreen(on) {
    var panel = $('boardData');
    var btn = $('fullscreenBtn');
    var tip = $('fullscreenTip');
    if (!panel) return;
    panel.classList.toggle('is-fullscreen', !!on);
    var label = on ? '退出全屏' : '全屏';
    if (btn) btn.setAttribute('aria-label', label);
    if (tip) tip.setAttribute('data-tip', label);
    if (window.ColResize && $('dataTable')) {
      ColResize.refresh($('dataTable'));
    }
  }

  function exportCurrentBoardList() {
    var dims = state.dimSelected.length ? state.dimSelected : ['日期'];
    var metrics = (state.draft && state.draft.metrics) || [];
    var showCompare = isCompareEnabled();
    var displayCols = buildDisplayCols(dims, metrics, showCompare);
    var sortKeys = displayCols.map(function (c) { return c.key; });
    var rows = applySort(genRows(), sortKeys);
    if (!rows.length) {
      showToast('暂无数据可导出', 'error');
      return;
    }
    function csvCell(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    function cellText(col, row) {
      if (col.kind === 'dim') return row[col.key] == null ? '' : row[col.key];
      if (col.kind === 'metric') return formatMetricValue(col.metric, row[col.metric]);
      return formatDeltaPlain(row[col.key]);
    }
    var header = displayCols.map(function (c) { return csvCell(c.label); }).join(',');
    var lines = [header].concat(rows.map(function (row) {
      return displayCols.map(function (col) { return csvCell(cellText(col, row)); }).join(',');
    }));
    var activeBoard = findNode(state.activeBoardId);
    var boardName = (activeBoard && activeBoard.name) || '看板';
    var stamp = formatDate(new Date()).replace(/-/g, '');
    var safeName = String(boardName).replace(/[\\/:*?"<>|]/g, '_');
    UI.downloadText(safeName + '_' + stamp + '.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
    showToast('已导出当前列表');
  }

  $('fullscreenBtn').addEventListener('click', function () {
    setBoardFullscreen(!$('boardData').classList.contains('is-fullscreen'));
  });
  $('exportBtn').addEventListener('click', exportCurrentBoardList);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('boardData') && $('boardData').classList.contains('is-fullscreen')) {
      setBoardFullscreen(false);
    }
  });

  $('tableHead').addEventListener('click', function (e) {
    var dirBtn = e.target.closest('[data-sort-dir]');
    if (!dirBtn) return;
    var wrap = dirBtn.closest('[data-sort-key]');
    if (!wrap) return;
    var key = wrap.getAttribute('data-sort-key');
    var dir = dirBtn.getAttribute('data-sort-dir');
    if (!key || (dir !== 'asc' && dir !== 'desc')) return;
    e.preventDefault();
    e.stopPropagation();
    state.sortSpecs = UI.toggleSortDir(state.sortSpecs || [], key, dir);
    state.sortInteractive = state.sortSpecs.length > 0;
    state.page = 1;
    renderTable();
  });

  $('tableBody').addEventListener('mouseover', function (e) {
    var cell = e.target.closest('[data-compare-tip]');
    if (!cell || !$('tableBody').contains(cell)) return;
    if (e.relatedTarget && cell.contains(e.relatedTarget)) return;
    try {
      var payload = JSON.parse(decodeURIComponent(cell.getAttribute('data-compare-tip') || ''));
      showCompareTip(cell, payload);
    } catch (err) {
      hideCompareTip();
    }
  });

  $('tableBody').addEventListener('mouseout', function (e) {
    var cell = e.target.closest('[data-compare-tip]');
    if (!cell) return;
    if (e.relatedTarget && cell.contains(e.relatedTarget)) return;
    hideCompareTip();
  });

  window.addEventListener('scroll', hideCompareTip, true);

  $('renameBoardBtn').addEventListener('click', function () {
    var board = findNode(state.activeBoardId);
    if (!canEditBoard(board)) return;
    openBoardForm('edit', board);
  });

  $('moreBoardBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    closeAddMenu();
    UI.closePanels();
    closeDatePanel();
    var open = !$('boardOpsCtx').classList.contains('is-open');
    closeCtx();
    if (open) openBoardOpsMenu(e.currentTarget, state.activeBoardId);
  });

  function commitBoardRename() {
    var board = findNode(state.activeBoardId);
    if (!board || !isEditableBoard(board)) return;
    var name = ($('boardTitleEdit').value || '').trim();
    if (name) {
      board.name = name.slice(0, 20);
      $('boardTitle').textContent = board.name;
      renderTree();
    }
    $('boardHeader').classList.remove('is-editing');
  }

  $('boardTitleEdit').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') commitBoardRename();
    if (e.key === 'Escape') $('boardHeader').classList.remove('is-editing');
  });
  $('boardTitleEdit').addEventListener('blur', commitBoardRename);

  UI.bindMultiSelect({
    wrapId: 'dimWrap',
    triggerId: 'dimTrigger',
    panelId: 'dimPanel',
    labelId: 'dimLabel',
    listId: 'dimList',
    selectedId: 'dimSelected',
    searchId: 'dimSearch',
    countId: 'dimCount',
    selectAllId: 'dimSelectAll',
    clearId: 'dimClearAll',
    prefix: '维度：',
    getOptions: function () { return ALL_DIMENSIONS; },
    getSelected: function () { return state.dimSelected; },
    setSelected: function (arr) {
      state.dimSelected = arr;
      syncDimLabel();
    }
  });

  $('dimClear').addEventListener('click', function (e) {
    e.stopPropagation();
    state.dimSelected = [];
    syncDimLabel();
    UI.closePanels();
  });

  /* Date panel：触发器开合 + 面板内操作（capture，先读开合状态再 closePanels） */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#dateRangeTrigger')) {
      e.stopPropagation();
      toggleMainDatePanel();
      return;
    }

    if (e.target.closest('#fsDateTrigger')) {
      e.stopPropagation();
      toggleFsDatePanel();
      return;
    }

    var shortcut = e.target.closest('#dateShortcuts .date-shortcut, #fsDateShortcuts .date-shortcut');
    if (shortcut) {
      e.stopPropagation();
      var key = shortcut.getAttribute('data-shortcut');
      var range = getShortcutRange(key);
      setDateRange(range[0], range[1], key);
      closeDatePanel();
      closeFsDatePanel();
      return;
    }

    var nav = e.target.closest('#datePanel [data-nav], #fsDatePanel [data-nav]');
    if (nav) {
      e.stopPropagation();
      var action = nav.getAttribute('data-nav');
      var vm = state.dateViewMonth || new Date();
      if (action === 'prev-month') state.dateViewMonth = new Date(vm.getFullYear(), vm.getMonth() - 1, 1);
      if (action === 'next-month') state.dateViewMonth = new Date(vm.getFullYear(), vm.getMonth() + 1, 1);
      if (action === 'prev-year') state.dateViewMonth = new Date(vm.getFullYear() - 1, vm.getMonth(), 1);
      if (action === 'next-year') state.dateViewMonth = new Date(vm.getFullYear() + 1, vm.getMonth(), 1);
      renderCalendars();
      renderFsCalendars();
      return;
    }

    var dayBtn = e.target.closest('#datePanel [data-day], #fsDatePanel [data-day]');
    if (dayBtn) {
      e.stopPropagation();
      var day = parseDay(dayBtn.getAttribute('data-day'));
      if (!state.pickingStart || (state.dateStart && state.dateEnd && !state.pickingStart)) {
        state.pickingStart = day;
        state.dateStart = day;
        state.dateEnd = null;
        state.dateShortcut = null;
        syncDateLabel();
        syncShortcutActive();
        renderCalendars();
        renderFsCalendars();
      } else {
        var start = state.pickingStart;
        var end = day;
        if (end < start) { var t = start; start = end; end = t; }
        setDateRange(start, end, null);
        closeDatePanel();
        closeFsDatePanel();
      }
      return;
    }

    /* 仅面板内部点击阻止关闭，勿包含触发器父级 wrap（否则会阻断开合） */
    if (e.target.closest('#datePanel, #fsDatePanel')) e.stopPropagation();
  }, true);

  /* Metric modal events */
  $('metricCatList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    scrollToMetricGroup(btn.getAttribute('data-cat'));
  });

  $('metricSearch').addEventListener('input', renderMetricModal);

  $('metricOptions').addEventListener('scroll', function () {
    hideMetricDefTip();
    syncMetricAnchorOnScroll();
  });

  $('metricOptions').addEventListener('change', function (e) {
    var groupInput = e.target.closest('[data-group-check]');
    if (groupInput) {
      var board = findNode(state.activeBoardId);
      var cat = groupInput.getAttribute('data-group-check');
      var checked = groupInput.checked;
      COLUMN_ITEMS.forEach(function (item) {
        if (item.group !== cat) return;
        if (isDefaultFrozenKey(item.key, board)) return;
        toggleMetricKey(item.key, checked);
      });
      renderMetricModal();
      return;
    }
    var input = e.target.closest('input.metric-check[type="checkbox"]');
    if (!input || input.disabled || input.hasAttribute('data-group-check')) return;
    toggleMetricKey(input.value, input.checked);
    renderMetricModal();
  });

  $('metricSelectedList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-metric]');
    if (!btn) return;
    toggleMetricKey(btn.getAttribute('data-remove-metric'), false);
    renderMetricModal();
  });

  $('metricClear').addEventListener('click', function () {
    var board = findNode(state.activeBoardId);
    state.metricDraft = state.metricDraft.filter(function (key) {
      return isDefaultFrozenKey(key, board);
    });
    state.metricFrozenCount = state.metricDraft.length;
    renderMetricModal();
  });

  /* drag reorder metrics + freeze line */
  var dragMetric = null;
  $('metricSelectedList').addEventListener('dragstart', function (e) {
    var item = e.target.closest('[data-metric]');
    if (!item || item.getAttribute('draggable') === 'false') {
      e.preventDefault();
      return;
    }
    dragMetric = item.getAttribute('data-metric');
    item.classList.add('is-dragging');
    try { e.dataTransfer.setData('text/plain', dragMetric); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
  });
  $('metricSelectedList').addEventListener('dragend', function (e) {
    var item = e.target.closest('[data-metric]');
    if (item) item.classList.remove('is-dragging');
    Array.prototype.forEach.call($('metricSelectedList').querySelectorAll('.is-drag-over'), function (el) {
      el.classList.remove('is-drag-over');
    });
    dragMetric = null;
  });
  $('metricSelectedList').addEventListener('dragover', function (e) {
    e.preventDefault();
    if (!dragMetric) return;
    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    Array.prototype.forEach.call($('metricSelectedList').querySelectorAll('.is-drag-over'), function (el) {
      el.classList.remove('is-drag-over');
    });
    if (line) line.classList.add('is-drag-over');
    else if (item) item.classList.add('is-drag-over');
  });
  $('metricSelectedList').addEventListener('drop', function (e) {
    e.preventDefault();
    if (!dragMetric) return;
    var board = findNode(state.activeBoardId);
    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    var from = state.metricDraft.indexOf(dragMetric);
    if (from < 0) return;

    if (line) {
      /* drop on freeze line → become last frozen */
      state.metricDraft.splice(from, 1);
      var insertAt = from < state.metricFrozenCount
        ? Math.max(0, state.metricFrozenCount - 1)
        : state.metricFrozenCount;
      insertAt = Math.max(0, Math.min(insertAt, state.metricDraft.length));
      state.metricDraft.splice(insertAt, 0, dragMetric);
      state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft, board), insertAt + 1);
    } else if (item) {
      var target = item.getAttribute('data-metric');
      if (target === dragMetric) return;
      var to = state.metricDraft.indexOf(target);
      if (to < 0) return;
      var wasFrozen = from < state.metricFrozenCount;
      var toFrozen = to < state.metricFrozenCount;
      if (isDefaultFrozenKey(dragMetric, board) && !toFrozen) return;

      state.metricDraft.splice(from, 1);
      state.metricDraft.splice(to, 0, dragMetric);

      if (!wasFrozen && toFrozen) {
        state.metricFrozenCount = Math.max(state.metricFrozenCount, minFrozenCount(state.metricDraft, board));
      } else if (wasFrozen && !toFrozen && !isDefaultFrozenKey(dragMetric, board)) {
        state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft, board), state.metricFrozenCount - 1);
      }
      state.metricFrozenCount = Math.max(minFrozenCount(state.metricDraft, board), Math.min(state.metricFrozenCount, state.metricDraft.length));
    }

    /* keep defaultFrozen in frozen zone */
    var forced = [];
    var rest = [];
    state.metricDraft.forEach(function (key) {
      if (isDefaultFrozenKey(key, board)) forced.push(key);
      else rest.push(key);
    });
    var userFrozen = rest.splice(0, Math.max(0, state.metricFrozenCount - forced.length));
    state.metricDraft = forced.concat(userFrozen, rest);
    state.metricFrozenCount = forced.length + userFrozen.length;
    renderMetricModal();
  });

  /* Share transfer */
  $('shareAvailCheckAll').addEventListener('change', function () {
    var visible = getShareLists().availVisible;
    if (this.checked) {
      visible.forEach(function (u) {
        if (state.shareAvailChecked.indexOf(u) < 0) state.shareAvailChecked.push(u);
      });
    } else {
      state.shareAvailChecked = state.shareAvailChecked.filter(function (u) {
        return visible.indexOf(u) < 0;
      });
    }
    renderShare();
  });

  $('shareSelectedCheckAll').addEventListener('change', function () {
    var visible = getShareLists().selVisible;
    if (this.checked) {
      visible.forEach(function (u) {
        if (state.shareSelectedChecked.indexOf(u) < 0) state.shareSelectedChecked.push(u);
      });
    } else {
      state.shareSelectedChecked = state.shareSelectedChecked.filter(function (u) {
        return visible.indexOf(u) < 0;
      });
    }
    renderShare();
  });

  $('shareAvailList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) {
      if (state.shareAvailChecked.indexOf(input.value) < 0) state.shareAvailChecked.push(input.value);
    } else {
      state.shareAvailChecked = state.shareAvailChecked.filter(function (u) { return u !== input.value; });
    }
    renderShare();
  });

  $('shareSelectedList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) {
      if (state.shareSelectedChecked.indexOf(input.value) < 0) state.shareSelectedChecked.push(input.value);
    } else {
      state.shareSelectedChecked = state.shareSelectedChecked.filter(function (u) { return u !== input.value; });
    }
    renderShare();
  });

  $('shareMoveRight').addEventListener('click', function () {
    state.shareAvailChecked.forEach(function (u) {
      if (state.shareDraft.indexOf(u) < 0) state.shareDraft.push(u);
    });
    state.shareAvailChecked = [];
    renderShare();
  });

  $('shareMoveLeft').addEventListener('click', function () {
    state.shareDraft = state.shareDraft.filter(function (u) {
      return state.shareSelectedChecked.indexOf(u) < 0;
    });
    state.shareSelectedChecked = [];
    renderShare();
  });

  $('shareAvailSearch').addEventListener('input', renderShare);
  $('shareSelectedSearch').addEventListener('input', renderShare);

  $('filterCheckGrid').addEventListener('change', function () {});

  /* Init */
  state.addBoardLocSelect = UI.bindSingleSelect({
    wrapId: 'addBoardLocWrap',
    triggerId: 'addBoardLocTrigger',
    panelId: 'addBoardLocPanel',
    labelId: 'addBoardLocLabel',
    getValue: function () { return state.addTargetFolderId; },
    formatValue: function (id) {
      var f = listCustomFolders().find(function (x) { return x.id === id; });
      return f ? f.name : id;
    },
    onChange: function (v) {
      state.addTargetFolderId = v;
      if (v) $('addBoardLocItem').classList.remove('is-error');
    }
  });

  state.addBoardTypeSelect = UI.bindSingleSelect({
    wrapId: 'addBoardTypeWrap',
    triggerId: 'addBoardTypeTrigger',
    panelId: 'addBoardTypePanel',
    labelId: 'addBoardTypeLabel',
    getValue: function () { return state.addBoardType || ''; },
    onChange: function (v) {
      state.addBoardType = v;
      $('addBoardTypeItem').classList.remove('is-error');
    }
  });

  refreshAddBoardLocOptions();
  renderTree();
  loadBoard('sys_demo');
})();
