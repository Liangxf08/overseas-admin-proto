/* 看板监控 · 工具一级页
 * 看板目录对齐中台看板（dashboard.js）现有四条看板，按类型匹配维度 / 筛选项 / 指标。
 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var CURRENT_USER = '用户A';
  var PERIODS = ['今天', '昨天', '近3天', '近7天', '近30天', '本周', '上周', '上月'];
  var OPS = ['大于', '大于等于', '小于', '小于等于', '等于'];
  var BASIS = ['固定值', '昨日环比', '周期环比'];
  var VALUE_TYPES = ['数值', '百分比'];
  var WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  var RECEIVERS = Array.from({ length: 12 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var PRODUCTS = [
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
  var PLATFORMS = ['Android', 'iOS'];
  var PRODUCT_GROUPS = ['奇异果', '苹果组', '无花果', '坚果组', '硕果组', '外部联运'];
  var PRODUCT_TYPES = ['分类', '塔防', '益智', '逆袭', '难度', '消除', '找茬', '其他'];
  var COUNTRIES = [
    'United States (US)', 'China (CN)', 'Japan (JP)', 'United Kingdom (GB)', 'Germany (DE)',
    'Brazil (BR)', 'India (IN)', 'South Korea (KR)', 'Indonesia (ID)', 'France (FR)',
    'Canada (CA)', 'Australia (AU)', 'Mexico (MX)', 'Italy (IT)', 'Spain (ES)',
    'Turkey (TR)', 'Russia (RU)', 'Saudi Arabia (SA)', 'Thailand (TH)', 'Vietnam (VN)'
  ];
  var CHANNELS = [
    'Appier', 'Apple', 'Applovin', 'Bigo Ads', 'Chartboost', 'Facebook', 'Google Ads',
    'Google Organic Search', 'ironSource', 'Miniclip Ad Network', 'Mintegral', 'MOLOCO',
    'NewsBreak Ads', 'Organic', 'Pangle', 'Snapchat', 'Tapjoy', 'Tec-do',
    'TikTok for Business', 'Twitter', 'Unity Ads', 'Unknown Devices', 'Untrusted Devices'
  ];

  var FILTERS = {
    product: { label: '产品', type: 'multi' },
    platform: { label: '平台', type: 'multi' },
    productGroup: { label: '产品组', type: 'multi' },
    productType: { label: '产品类型', type: 'multi' },
    country: { label: '国家地区', type: 'multi' },
    channel: { label: '渠道', type: 'multi' },
    campaign: { label: '推广活动', type: 'text' }
  };

  /* 与看板列表一致：系统 / 共享 / 我的 / 示例文件夹 */
  var BOARDS = [
    {
      id: 'sys_demo',
      name: '示例看板',
      folder: '系统看板',
      type: 'Adjust',
      dimensions: ['按日', '按周', '按月', '平台', '产品', '国家地区', '渠道', '优化师'],
      filters: ['product', 'platform', 'country', 'channel', 'campaign'],
      metrics: ['总收入', '花费', '利润', '当日ROAS', '累计ROAS', 'DAU', 'ARPU', '新用户', '新增单价', '展示', '点击', '安装', 'CTR', 'CVR']
    },
    {
      id: 'shared_demo',
      name: '示例看板',
      folder: '共享看板',
      type: '广告聚合',
      dimensions: ['按日', '按周', '按月', '平台', '产品', '国家地区', '渠道'],
      filters: ['product', 'platform', 'country', 'channel'],
      metrics: ['广告收入', '广告展示', '广告IPU', '广告ARPU', '广告eCPM', '内购收入']
    },
    {
      id: 'mine_demo',
      name: '示例看板',
      folder: '我的看板',
      type: '双端 SDK',
      dimensions: ['按日', '按周', '平台', '产品', '国家地区'],
      filters: ['product', 'platform', 'productGroup', 'productType', 'country'],
      metrics: ['DAU', '新用户', '总收入', 'ARPU', '广告收入', '广告展示', '广告eCPM']
    },
    {
      id: 'example_demo',
      name: '示例看板',
      folder: '示例文件夹',
      type: 'TikTok 开平',
      dimensions: ['按日', '按周', '产品', '国家地区', '账户'],
      filters: ['product', 'country', 'channel'],
      metrics: ['花费', '展示', '点击', '安装', 'CTR', 'CVR', 'eCPI', '当日ROAS']
    }
  ];

  var ARROW = '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  var SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 1.5v9M1.5 6h9"/></svg>';

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function nowText() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function boardById(id) {
    for (var i = 0; i < BOARDS.length; i++) if (BOARDS[i].id === id) return BOARDS[i];
    return null;
  }

  function boardLabel(board) {
    if (!board) return '';
    return board.folder + ' / ' + board.name;
  }

  function currentBoard() { return boardById(state.form.boardId); }

  function iconHtml(platform) {
    var file = platform === 'iOS' ? 'iOS' : platform === 'Android' ? 'Android' : '';
    if (!file) return '';
    return '<span class="select-option-icon"><img src="assets/' + file + '.png" alt="" /></span>';
  }

  function rowById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function emptyMetric() {
    return { id: UI.uid('m'), metric: '', op: '大于', basis: '固定值', valueType: '数值', value: '' };
  }

  function emptyQuery() {
    return { name: '', boardId: '', creator: '', status: '' };
  }

  function defaultForm() {
    return {
      mode: 'add',
      id: '',
      boardId: '',
      period: '',
      dimensions: [],
      filters: [],
      logic: 'any',
      metrics: [emptyMetric()],
      name: '',
      schedule: 'daily',
      weekdays: [],
      time: '09:00:00',
      pushMethod: 'feishu',
      receivers: [CURRENT_USER],
      webhook: ''
    };
  }

  function metricRow(metric, op, basis, valueType, value) {
    return { id: UI.uid('m'), metric: metric, op: op, basis: basis, valueType: valueType, value: value };
  }

  function filterRow(field, values, keyword) {
    return { id: UI.uid('f'), field: field, values: values || [], keyword: keyword || '' };
  }

  function seed() {
    return [
      {
        id: 'bm-1', name: '花费异常预警', status: '启用', boardId: 'sys_demo', period: '近7天',
        dimensions: ['按日', '渠道'],
        filters: [filterRow('channel', ['Facebook', 'Google Ads'])],
        logic: 'any',
        metrics: [metricRow('花费', '大于', '固定值', '数值', '10000')],
        schedule: 'daily', weekdays: [], time: '09:00:00',
        pushMethod: 'feishu', receivers: ['用户A', '用户B'], webhook: '',
        triggerCount: 12, lastTrigger: '2026-10-18 09:00:12', createdAt: '2026-10-12 10:20:00', creator: '用户A'
      },
      {
        id: 'bm-2', name: 'DAU 下跌', status: '启用', boardId: 'mine_demo', period: '昨天',
        dimensions: ['按日', '产品'],
        filters: [filterRow('platform', ['Android'])],
        logic: 'all',
        metrics: [
          metricRow('DAU', '小于', '昨日环比', '百分比', '-20'),
          metricRow('新用户', '小于', '昨日环比', '百分比', '-15')
        ],
        schedule: 'weekly', weekdays: ['周一', '周五'], time: '10:30:00',
        pushMethod: 'feishu', receivers: ['用户B'], webhook: '',
        triggerCount: 3, lastTrigger: '2026-10-17 10:30:08', createdAt: '2026-10-08 14:12:33', creator: '用户B'
      },
      {
        id: 'bm-3', name: '广告 eCPM 波动', status: '禁用', boardId: 'shared_demo', period: '近30天',
        dimensions: ['国家地区'],
        filters: [],
        logic: 'any',
        metrics: [metricRow('广告eCPM', '小于', '周期环比', '百分比', '-10')],
        schedule: 'daily', weekdays: [], time: '18:00:00',
        pushMethod: 'bot', receivers: [], webhook: 'https://open.feishu.cn/open-apis/bot/v2/hook/ecpm',
        triggerCount: 0, lastTrigger: '', createdAt: '2026-10-06 09:40:18', creator: '用户C'
      },
      {
        id: 'bm-4', name: '安装量异常', status: '启用', boardId: 'example_demo', period: '今天',
        dimensions: ['账户'],
        filters: [filterRow('channel', ['TikTok for Business'])],
        logic: 'any',
        metrics: [metricRow('安装', '小于', '固定值', '数值', '100')],
        schedule: 'daily', weekdays: [], time: '08:00:00',
        pushMethod: 'feishu', receivers: ['用户A', '用户C', '用户D'], webhook: '',
        triggerCount: 8, lastTrigger: '2026-10-19 08:00:21', createdAt: '2026-10-02 16:05:44', creator: '用户A'
      },
      {
        id: 'bm-5', name: '当日 ROAS 过低', status: '启用', boardId: 'sys_demo', period: '本周',
        dimensions: ['平台', '产品'],
        filters: [filterRow('country', ['United States (US)', 'Japan (JP)'])],
        logic: 'all',
        metrics: [metricRow('当日ROAS', '小于', '固定值', '百分比', '30')],
        schedule: 'weekly', weekdays: ['周一'], time: '09:30:00',
        pushMethod: 'feishu', receivers: ['用户D'], webhook: '',
        triggerCount: 2, lastTrigger: '2026-10-13 09:30:02', createdAt: '2026-09-28 11:18:09', creator: '用户D'
      },
      {
        id: 'bm-6', name: '新增单价偏高', status: '禁用', boardId: 'mine_demo', period: '上周',
        dimensions: ['产品'],
        filters: [filterRow('productGroup', ['奇异果', '苹果组'])],
        logic: 'any',
        metrics: [metricRow('新增单价', '大于', '周期环比', '百分比', '25')],
        schedule: 'daily', weekdays: [], time: '11:00:00',
        pushMethod: 'feishu', receivers: ['用户E'], webhook: '',
        triggerCount: 1, lastTrigger: '2026-10-05 11:00:40', createdAt: '2026-09-20 08:22:51', creator: '用户E'
      },
      {
        id: 'bm-7', name: '点击率下滑', status: '启用', boardId: 'example_demo', period: '近3天',
        dimensions: ['按日', '国家地区'],
        filters: [filterRow('campaign', [], 'US_android_install')],
        logic: 'any',
        metrics: [metricRow('CTR', '小于', '昨日环比', '百分比', '-8')],
        schedule: 'daily', weekdays: [], time: '20:00:00',
        pushMethod: 'bot', receivers: [], webhook: 'https://open.feishu.cn/open-apis/bot/v2/hook/ctr',
        triggerCount: 5, lastTrigger: '2026-10-18 20:00:11', createdAt: '2026-09-16 19:33:27', creator: '用户C'
      },
      {
        id: 'bm-8', name: '广告收入环比', status: '启用', boardId: 'shared_demo', period: '上月',
        dimensions: ['按周', '渠道'],
        filters: [filterRow('platform', ['iOS'])],
        logic: 'any',
        metrics: [metricRow('广告收入', '小于', '周期环比', '百分比', '-12')],
        schedule: 'weekly', weekdays: ['周三', '周日'], time: '09:15:00',
        pushMethod: 'feishu', receivers: ['用户B', '用户F'], webhook: '',
        triggerCount: 4, lastTrigger: '2026-10-15 09:15:36', createdAt: '2026-09-08 13:47:02', creator: '用户B'
      }
    ];
  }

  var state = {
    rows: seed(),
    draft: emptyQuery(),
    applied: emptyQuery(),
    page: 1,
    pageSize: 20,
    form: defaultForm(),
    deleteId: '',
    statusPending: null
  };

  function valueOptions(field) {
    if (field === 'product') {
      return PRODUCTS.map(function (item) {
        return {
          value: item.product + '@@' + item.platform,
          label: item.product,
          icon: iconHtml(item.platform)
        };
      });
    }
    if (field === 'platform') {
      return PLATFORMS.map(function (name) {
        return { value: name, label: name, icon: iconHtml(name) };
      });
    }
    var list = field === 'productGroup' ? PRODUCT_GROUPS
      : field === 'productType' ? PRODUCT_TYPES
      : field === 'country' ? COUNTRIES
      : field === 'channel' ? CHANNELS
      : [];
    return list.map(function (name) { return { value: name, label: name }; });
  }

  function labelOfOptions(options, value) {
    for (var i = 0; i < options.length; i++) {
      if (options[i].value === value) return options[i].label;
    }
    return value;
  }

  function specOf(box) {
    if (!box) return null;
    var kind = box.getAttribute('data-kind');
    var rowId = box.getAttribute('data-row');

    if (kind === 'board') {
      return {
        mode: 'single',
        get: function () { return state.form.boardId; },
        set: function (v) {
          state.form.boardId = v;
          pruneBoardDeps();
          syncBoardLabel();
          syncDim();
          renderFilters();
          renderMetrics();
          syncAddButtons();
        },
        options: function () {
          return BOARDS.map(function (b) { return { value: b.id, label: boardLabel(b) }; });
        }
      };
    }
    if (kind === 'period') {
      return {
        mode: 'single',
        get: function () { return state.form.period; },
        set: function (v) { state.form.period = v; syncBoxLabel(box); },
        options: function () { return PERIODS.map(function (n) { return { value: n, label: n }; }); }
      };
    }
    if (kind === 'schedule') {
      return {
        mode: 'single',
        get: function () { return state.form.schedule || 'daily'; },
        set: function (v) {
          state.form.schedule = v || 'daily';
          syncSchedule();
          syncBoxLabel(box);
        },
        options: function () {
          return [
            { value: 'daily', label: '每天' },
            { value: 'weekly', label: '每周' }
          ];
        }
      };
    }
    if (kind === 'dimensions') {
      return {
        mode: 'multi',
        getSelected: function () { return state.form.dimensions.slice(); },
        setSelected: function (arr) { state.form.dimensions = arr.slice(); syncDim(); },
        options: function () {
          var board = currentBoard();
          return board ? board.dimensions.map(function (d) { return { value: d, label: d }; }) : [];
        }
      };
    }
    if (kind === 'weekdays') {
      return {
        mode: 'multi',
        getSelected: function () { return state.form.weekdays.slice(); },
        setSelected: function (arr) {
          state.form.weekdays = WEEKDAYS.filter(function (day) { return arr.indexOf(day) >= 0; });
          syncWeek();
        },
        options: function () { return WEEKDAYS.map(function (d) { return { value: d, label: d }; }); }
      };
    }
    if (kind === 'push') {
      return {
        mode: 'single',
        get: function () { return state.form.pushMethod || 'feishu'; },
        set: function (v) {
          state.form.pushMethod = v || 'feishu';
          if (state.form.pushMethod === 'feishu' && !state.form.receivers.length) {
            state.form.receivers = [CURRENT_USER];
          }
          syncPush();
        },
        options: function () {
          return [
            { value: 'feishu', label: '飞书消息' },
            { value: 'bot', label: '飞书机器人' }
          ];
        }
      };
    }
    if (kind === 'receivers') {
      return {
        mode: 'multi',
        getSelected: function () { return state.form.receivers.slice(); },
        setSelected: function (arr) { state.form.receivers = arr.slice(); syncReceivers(); },
        options: function () { return RECEIVERS.map(function (n) { return { value: n, label: n }; }); }
      };
    }
    if (kind === 'filter-field') {
      return {
        mode: 'single',
        get: function () {
          var row = rowById(state.form.filters, rowId);
          return row ? row.field : '';
        },
        set: function (v) {
          var row = rowById(state.form.filters, rowId);
          if (!row || row.field === v) return;
          row.field = v;
          row.values = [];
          row.keyword = '';
          renderFilters();
        },
        options: function () { return filterFieldOptions(rowId); }
      };
    }
    if (kind === 'filter-values') {
      return {
        mode: 'multi',
        getSelected: function () {
          var row = rowById(state.form.filters, rowId);
          return row ? row.values.slice() : [];
        },
        setSelected: function (arr) {
          var row = rowById(state.form.filters, rowId);
          if (row) row.values = arr.slice();
        },
        options: function () {
          var row = rowById(state.form.filters, rowId);
          return row ? valueOptions(row.field) : [];
        }
      };
    }
    if (kind === 'metric' || kind === 'metric-op' || kind === 'metric-basis' || kind === 'metric-vtype') {
      return {
        mode: 'single',
        get: function () {
          var row = rowById(state.form.metrics, rowId);
          if (!row) return '';
          if (kind === 'metric') return row.metric;
          if (kind === 'metric-op') return row.op;
          if (kind === 'metric-basis') return row.basis;
          return row.valueType;
        },
        set: function (v) {
          var row = rowById(state.form.metrics, rowId);
          if (!row) return;
          if (kind === 'metric') row.metric = v;
          else if (kind === 'metric-op') row.op = v;
          else if (kind === 'metric-basis') {
            row.basis = v;
            row.valueType = v === '固定值' ? '数值' : '百分比';
            renderMetrics();
            return;
          } else {
            row.valueType = v;
            renderMetrics();
            return;
          }
          syncBoxLabel(box);
        },
        options: function () {
          if (kind === 'metric') {
            var board = currentBoard();
            return board ? board.metrics.map(function (n) { return { value: n, label: n }; }) : [];
          }
          var list = kind === 'metric-op' ? OPS : kind === 'metric-basis' ? BASIS : VALUE_TYPES;
          return list.map(function (n) { return { value: n, label: n }; });
        }
      };
    }
    if (kind === 'time') return { mode: 'time' };
    return null;
  }

  function filterFieldOptions(rowId) {
    var board = currentBoard();
    if (!board) return [];
    var used = {};
    state.form.filters.forEach(function (row) {
      if (row.id !== rowId && row.field) used[row.field] = true;
    });
    return board.filters.filter(function (key) {
      return FILTERS[key] && !used[key];
    }).map(function (key) {
      return { value: key, label: FILTERS[key].label };
    });
  }

  function optionLabel(spec, value) {
    if (!spec || !spec.options) return value;
    return labelOfOptions(spec.options(), value);
  }

  function syncBoxLabel(box) {
    if (!box) return;
    var spec = specOf(box);
    var text = box.querySelector('.select-trigger__text');
    if (!text || !spec || spec.mode === 'time') return;
    if (spec.mode === 'multi') {
      var selected = spec.getSelected();
      if (!selected.length) text.innerHTML = '<span class="muted">请选择</span>';
      else if (selected.length === 1) text.textContent = optionLabel(spec, selected[0]);
      else text.textContent = '已选 ' + selected.length + ' 项';
      return;
    }
    var value = spec.get();
    if (!value) text.innerHTML = '<span class="muted">请选择</span>';
    else text.textContent = optionLabel(spec, value);
  }

  function syncBoardLabel() { syncBoxLabel($('boardBox')); }

  function syncDim() {
    var box = $('dimBox');
    var trigger = $('dimTrigger');
    var board = currentBoard();
    var disabled = !board;
    trigger.disabled = disabled;
    trigger.classList.toggle('is-disabled', disabled);
    if (disabled) {
      $('dimLabel').innerHTML = '<span class="muted">请先选择监控看板</span>';
      return;
    }
    syncBoxLabel(box);
  }

  function syncWeek() { syncBoxLabel($('weekBox')); }
  function syncReceivers() { syncBoxLabel($('receiverBox')); }

  function syncTimeLabel() {
    $('timeLabel').textContent = state.form.time || '09:00:00';
  }

  function syncSchedule() {
    var weekly = state.form.schedule === 'weekly';
    $('weekBox').hidden = !weekly;
    $('scheduleRow').classList.toggle('is-weekly', weekly);
    $('pushRow').classList.toggle('is-weekly', weekly);
    syncWeek();
  }

  function syncPush() {
    var method = state.form.pushMethod || 'feishu';
    $('feishuExtra').hidden = method !== 'feishu';
    $('botExtra').hidden = method !== 'bot';
    syncBoxLabel($('pushBox'));
    syncReceivers();
  }

  function syncAddButtons() {
    $('addFilterBtn').disabled = !currentBoard();
  }

  function pruneBoardDeps() {
    var board = currentBoard();
    var dims = board ? board.dimensions : [];
    var fields = board ? board.filters : [];
    var metrics = board ? board.metrics : [];
    state.form.dimensions = state.form.dimensions.filter(function (d) { return dims.indexOf(d) >= 0; });
    state.form.filters = state.form.filters.filter(function (row) { return fields.indexOf(row.field) >= 0; });
    state.form.metrics.forEach(function (row) {
      if (metrics.indexOf(row.metric) < 0) row.metric = '';
    });
    if (!state.form.metrics.length) state.form.metrics.push(emptyMetric());
  }

  function unportal(panel) {
    if (!panel) return;
    panel.classList.remove('is-open', 'bm-panel-portal');
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.margin = '';
    panel.style.zIndex = '';
    var host = panel.__host;
    if (host && panel.parentElement !== host) host.appendChild(panel);
    var trigger = host && host.querySelector('.select-trigger');
    if (trigger) trigger.classList.remove('is-open');
  }

  function closeFloating() {
    UI.closePanels();
    document.querySelectorAll('.bm-panel-portal, .bm-time-panel.is-open').forEach(unportal);
  }

  function portal(panel, trigger) {
    if (!panel.__host) panel.__host = panel.parentElement;
    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    panel.classList.add('bm-panel-portal');
    var rect = trigger.getBoundingClientRect();
    var dual = panel.classList.contains('multi-panel') && !panel.classList.contains('multi-panel--simple');
    var time = panel.classList.contains('bm-time-panel');
    var w = time ? 216 : dual ? 480 : Math.max(rect.width, 160);
    panel.style.position = 'fixed';
    panel.style.width = w + 'px';
    panel.style.right = 'auto';
    panel.style.margin = '0';
    panel.style.zIndex = '1200';
    var ph = panel.offsetHeight || 200;
    var left = rect.left;
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    var top = rect.bottom + 4;
    if (top + ph > window.innerHeight - 8 && rect.top - ph - 4 > 8) top = rect.top - ph - 4;
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  function bindPanelOnce(panel) {
    if (!panel || panel.__bound) return;
    panel.__bound = true;
    panel.__host = panel.parentElement;
    panel.addEventListener('click', onPanelClick);
    panel.addEventListener('input', onPanelInput);
    panel.addEventListener('change', onPanelChange);
  }

  function paintSingleList(panel) {
    var spec = specOf(panel.__host);
    if (!spec) return;
    var options = spec.options();
    var value = spec.get();
    var kw = (panel.__kw || '').trim().toLowerCase();
    var visible = options.filter(function (opt) {
      return !kw || String(opt.label).toLowerCase().indexOf(kw) >= 0;
    });
    var html = visible.length ? visible.map(function (opt) {
      var active = opt.value === value ? ' is-active' : '';
      return '<button class="single-option' + active + '" type="button" data-value="' + escapeHtml(opt.value) + '">' +
        (opt.icon || '') + escapeHtml(opt.label) + '</button>';
    }).join('') : '<div class="single-panel__empty">暂无数据</div>';
    var list = panel.querySelector('.single-panel__list');
    if (list) list.innerHTML = html;
    else panel.innerHTML = html;
  }

  function fillSingle(panel) {
    var spec = specOf(panel.__host);
    var options = spec ? spec.options() : [];
    var searchable = options.length > 7;
    panel.__kw = '';
    panel.classList.toggle('single-panel--search', searchable);
    if (searchable) {
      panel.innerHTML = '<div class="single-panel__search">' + SEARCH_ICON +
        '<input class="js-search" type="text" placeholder="搜索" autocomplete="off" /></div>' +
        '<div class="single-panel__list"></div>';
    }
    paintSingleList(panel);
  }

  function paintMultiLists(panel) {
    var spec = specOf(panel.__host);
    if (!spec) return;
    var options = spec.options();
    var selected = spec.getSelected();
    var kw = (panel.__kw || '').trim().toLowerCase();
    var visible = options.filter(function (opt) {
      return !kw || String(opt.label).toLowerCase().indexOf(kw) >= 0;
    });
    var list = panel.querySelector('[data-list]');
    var selectedEl = panel.querySelector('[data-selected]');
    var countEl = panel.querySelector('[data-count]');
    if (list) {
      list.innerHTML = visible.length ? visible.map(function (opt) {
        var checked = selected.indexOf(opt.value) >= 0 ? ' checked' : '';
        return '<label class="multi-option"><input type="checkbox" value="' + escapeHtml(opt.value) + '"' + checked +
          ' /><span class="multi-option__label">' + (opt.icon || '') +
          '<span title="' + escapeHtml(opt.label) + '">' + escapeHtml(opt.label) + '</span></span></label>';
      }).join('') : '<div class="multi-panel__empty">暂无数据</div>';
    }
    if (selectedEl) {
      selectedEl.innerHTML = selected.length ? selected.map(function (value) {
        var label = optionLabel(spec, value);
        var icon = '';
        for (var i = 0; i < options.length; i++) {
          if (options[i].value === value) { icon = options[i].icon || ''; break; }
        }
        return '<div class="multi-selected"><span class="multi-selected__name">' + icon +
          '<span title="' + escapeHtml(label) + '">' + escapeHtml(label) + '</span></span>' +
          '<button class="multi-selected__remove" type="button" data-action="remove" data-value="' + escapeHtml(value) +
          '" aria-label="移除">' + CLOSE_ICON + '</button></div>';
      }).join('') : '<div class="multi-panel__empty">暂无已选</div>';
    }
    if (countEl) countEl.textContent = '已选择 ' + selected.length + ' 项';
  }

  function fillMulti(panel) {
    var spec = specOf(panel.__host);
    var options = spec ? spec.options() : [];
    var dual = options.length > 7;
    panel.__kw = '';
    panel.className = 'multi-panel' + (dual ? '' : ' multi-panel--simple');
    if (dual) {
      panel.innerHTML =
        '<div class="multi-panel__left">' +
          '<div class="multi-panel__search">' + SEARCH_ICON + '<input class="js-search" type="text" placeholder="搜索" autocomplete="off" /></div>' +
          '<div class="multi-panel__toolbar"><button class="multi-panel__link" type="button" data-action="all">全选</button></div>' +
          '<div class="multi-panel__list" data-list></div>' +
        '</div>' +
        '<div class="multi-panel__right">' +
          '<div class="multi-panel__toolbar multi-panel__toolbar--right"><span data-count>已选择 0 项</span>' +
          '<button class="multi-panel__link" type="button" data-action="clear">清空</button></div>' +
          '<div class="multi-panel__list" data-selected></div>' +
        '</div>';
    } else {
      panel.innerHTML = '<div class="multi-panel__list" data-list></div>';
    }
    paintMultiLists(panel);
  }

  function fillTime(panel) {
    var parts = (state.form.time || '09:00:00').split(':');
    while (parts.length < 3) parts.push('00');
    panel.innerHTML = ['h', 'm', 's'].map(function (part, idx) {
      var max = part === 'h' ? 24 : 60;
      var html = '<div class="bm-time-col" data-part="' + part + '">';
      for (var i = 0; i < max; i++) {
        var val = pad(i);
        html += '<button type="button" class="bm-time-opt' + (val === parts[idx] ? ' is-active' : '') +
          '" data-part="' + part + '" data-value="' + val + '">' + val + '</button>';
      }
      return html + '</div>';
    }).join('');
    requestAnimationFrame(function () {
      panel.querySelectorAll('.bm-time-col').forEach(function (col) {
        var active = col.querySelector('.is-active');
        if (!active) return;
        col.scrollTop = Math.max(0, active.offsetTop - col.clientHeight / 2 + active.offsetHeight / 2);
      });
    });
  }

  function toggleFromTrigger(trigger) {
    var box = trigger.closest('.bm-select');
    var panel = box && box.querySelector('.single-panel, .multi-panel, .bm-time-panel');
    if (!box || !panel) return;
    if (trigger.disabled || trigger.classList.contains('is-disabled')) {
      closeFloating();
      return;
    }
    var opening = !panel.classList.contains('is-open');
    closeFloating();
    if (!opening) return;
    bindPanelOnce(panel);
    var spec = specOf(box);
    if (spec && spec.mode === 'multi') fillMulti(panel);
    else if (spec && spec.mode === 'single') fillSingle(panel);
    else fillTime(panel);
    panel.classList.add('is-open');
    trigger.classList.add('is-open');
    portal(panel, trigger);
  }

  function onPanelClick(e) {
    var panel = e.currentTarget;
    e.stopPropagation();
    var timeOpt = e.target.closest('.bm-time-opt');
    if (timeOpt) {
      var part = timeOpt.getAttribute('data-part');
      var val = timeOpt.getAttribute('data-value');
      var parts = (state.form.time || '09:00:00').split(':');
      while (parts.length < 3) parts.push('00');
      var map = { h: 0, m: 1, s: 2 };
      parts[map[part]] = val;
      state.form.time = parts.join(':');
      timeOpt.parentElement.querySelectorAll('.bm-time-opt').forEach(function (el) {
        el.classList.toggle('is-active', el === timeOpt);
      });
      syncTimeLabel();
      return;
    }
    var single = e.target.closest('.single-option');
    if (single && panel.classList.contains('single-panel')) {
      var spec = specOf(panel.__host);
      if (spec) spec.set(single.getAttribute('data-value') || '');
      closeFloating();
      hideFilledErrors();
      return;
    }
    var actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    var multiSpec = specOf(panel.__host);
    if (!multiSpec || multiSpec.mode !== 'multi') return;
    var action = actionEl.getAttribute('data-action');
    var selected = multiSpec.getSelected();
    if (action === 'clear') {
      multiSpec.setSelected([]);
    } else if (action === 'remove') {
      var removeValue = actionEl.getAttribute('data-value');
      multiSpec.setSelected(selected.filter(function (v) { return v !== removeValue; }));
    } else if (action === 'all') {
      var kw = (panel.__kw || '').trim().toLowerCase();
      var next = selected.slice();
      multiSpec.options().forEach(function (opt) {
        if (kw && String(opt.label).toLowerCase().indexOf(kw) < 0) return;
        if (next.indexOf(opt.value) < 0) next.push(opt.value);
      });
      multiSpec.setSelected(next);
    }
    if (panel.isConnected) {
      paintMultiLists(panel);
      syncBoxLabel(panel.__host);
    }
    hideFilledErrors();
  }

  function onPanelInput(e) {
    var input = e.target;
    if (!input.classList || !input.classList.contains('js-search')) return;
    var panel = e.currentTarget;
    panel.__kw = input.value || '';
    if (panel.classList.contains('single-panel')) paintSingleList(panel);
    else paintMultiLists(panel);
  }

  function onPanelChange(e) {
    var input = e.target;
    if (!input || input.type !== 'checkbox') return;
    var panel = e.currentTarget;
    var spec = specOf(panel.__host);
    if (!spec || spec.mode !== 'multi') return;
    var selected = spec.getSelected();
    var value = input.value;
    if (input.checked) {
      if (selected.indexOf(value) < 0) selected.push(value);
    } else {
      selected = selected.filter(function (v) { return v !== value; });
    }
    spec.setSelected(selected);
    if (panel.isConnected) {
      paintMultiLists(panel);
      syncBoxLabel(panel.__host);
    }
    hideFilledErrors();
  }

  function triggerHtml(label, opts) {
    opts = opts || {};
    var placeholder = opts.placeholder || '请选择';
    var inner = label ? escapeHtml(label) : '<span class="muted">' + escapeHtml(placeholder) + '</span>';
    return '<button class="select-trigger' + (opts.disabled ? ' is-disabled' : '') + '" type="button"' +
      (opts.disabled ? ' disabled' : '') + '><span class="select-trigger__text">' + inner + '</span>' + ARROW + '</button>';
  }

  function selectShell(kind, rowId, extraClass, label, opts) {
    return '<div class="bm-select ' + (extraClass || '') + '" data-kind="' + kind + '" data-row="' + escapeHtml(rowId) + '">' +
      triggerHtml(label, opts) +
      (opts && opts.multi ? '<div class="multi-panel"></div>' : '<div class="single-panel"></div>') +
      '</div>';
  }

  function renderFilters() {
    closeFloating();
    var host = $('filterRows');
    host.innerHTML = state.form.filters.map(function (row) {
      var def = FILTERS[row.field];
      var valueHtml = '';
      if (!def) {
        valueHtml = triggerHtml('', { disabled: true, placeholder: '请选择' });
      } else if (def.type === 'text') {
        valueHtml = '<input class="input' + '" data-keyword="' + escapeHtml(row.id) + '" type="text" placeholder="请输入' +
          escapeHtml(def.label) + '" value="' + escapeHtml(row.keyword || '') + '" autocomplete="off" />';
      } else {
        var valueLabel = '';
        if (row.values.length === 1) valueLabel = labelOfOptions(valueOptions(row.field), row.values[0]);
        else if (row.values.length > 1) valueLabel = '已选 ' + row.values.length + ' 项';
        valueHtml = selectShell('filter-values', row.id, '', valueLabel, { multi: true, placeholder: '请选择' });
      }
      var fieldLabel = def ? def.label : '';
      return '<div class="bm-line">' +
        selectShell('filter-field', row.id, 'bm-select--field', fieldLabel, {}) +
        '<div class="bm-line__value">' + valueHtml + '</div>' +
        '<button class="bm-icon-btn" type="button" data-remove-filter="' + escapeHtml(row.id) + '" aria-label="删除">' + CLOSE_ICON + '</button>' +
        '</div>';
    }).join('');
    syncAddButtons();
    hideFilledErrors();
  }

  function renderMetrics() {
    closeFloating();
    var board = currentBoard();
    $('metricRows').innerHTML = state.form.metrics.map(function (row) {
      var disabled = !board;
      var unit = row.valueType === '百分比';
      return '<div class="bm-rule">' +
        selectShell('metric', row.id, 'bm-select--metric', row.metric, { disabled: disabled, placeholder: disabled ? '请先选择监控看板' : '请选择' }) +
        selectShell('metric-op', row.id, 'bm-select--op', row.op, {}) +
        selectShell('metric-basis', row.id, 'bm-select--basis', row.basis, {}) +
        selectShell('metric-vtype', row.id, 'bm-select--vtype', row.valueType, {}) +
        '<div class="bm-value' + (unit ? ' bm-value--unit' : '') + '">' +
          '<input class="input" data-metric-value="' + escapeHtml(row.id) + '" type="text" inputmode="decimal" placeholder="请输入" value="' + escapeHtml(row.value || '') + '" autocomplete="off" />' +
          (unit ? '<span class="bm-value__unit">%</span>' : '') +
        '</div>' +
        (state.form.metrics.length > 1
          ? '<button class="bm-icon-btn" type="button" data-remove-metric="' + escapeHtml(row.id) + '" aria-label="删除">' + CLOSE_ICON + '</button>'
          : '') +
        '</div>';
    }).join('');
    hideFilledErrors();
  }

  function clearFieldErrors() {
    document.querySelectorAll('#formDrawer .is-error, #formDrawer .bm-item-error').forEach(function (el) {
      el.classList.remove('is-error', 'bm-item-error');
    });
  }

  function clearItem(id) {
    var el = $(id);
    if (!el) return;
    el.classList.remove('is-error', 'bm-item-error');
    el.querySelectorAll('.is-error').forEach(function (node) {
      node.classList.remove('is-error');
    });
  }

  function itemHasError(id) {
    var el = $(id);
    return !!(el && (el.classList.contains('is-error') || el.classList.contains('bm-item-error')));
  }

  function hideFilledErrors() {
    var f = state.form;
    if (f.boardId) clearItem('itemBoard');
    if (f.period) clearItem('itemPeriod');
    if (f.dimensions.length) clearItem('itemDim');

    if (itemHasError('itemFilters')) {
      var filterBad = false;
      f.filters.forEach(function (row) {
        var fieldTrigger = document.querySelector('[data-kind="filter-field"][data-row="' + row.id + '"] .select-trigger');
        if (!row.field) {
          filterBad = true;
          if (fieldTrigger) fieldTrigger.classList.add('is-error');
          return;
        }
        if (fieldTrigger) fieldTrigger.classList.remove('is-error');
        var def = FILTERS[row.field];
        if (def && def.type === 'text') {
          var input = document.querySelector('[data-keyword="' + row.id + '"]');
          if ((row.keyword || '').trim()) {
            if (input) input.classList.remove('is-error');
          } else {
            filterBad = true;
            if (input) input.classList.add('is-error');
          }
        } else if (row.values.length) {
          var filledTrigger = document.querySelector('[data-kind="filter-values"][data-row="' + row.id + '"] .select-trigger');
          if (filledTrigger) filledTrigger.classList.remove('is-error');
        } else {
          filterBad = true;
          var valueTrigger = document.querySelector('[data-kind="filter-values"][data-row="' + row.id + '"] .select-trigger');
          if (valueTrigger) valueTrigger.classList.add('is-error');
        }
      });
      if (!filterBad) clearItem('itemFilters');
    }

    if (itemHasError('itemMetrics')) {
      var metricBad = !f.metrics.length;
      f.metrics.forEach(function (row) {
        var metricTrigger = document.querySelector('[data-kind="metric"][data-row="' + row.id + '"] .select-trigger');
        if (row.metric) {
          if (metricTrigger) metricTrigger.classList.remove('is-error');
        } else {
          metricBad = true;
          if (metricTrigger) metricTrigger.classList.add('is-error');
        }
        var valueInput = document.querySelector('[data-metric-value="' + row.id + '"]');
        if (String(row.value == null ? '' : row.value).trim()) {
          if (valueInput) valueInput.classList.remove('is-error');
        } else {
          metricBad = true;
          if (valueInput) valueInput.classList.add('is-error');
        }
      });
      if (!metricBad) clearItem('itemMetrics');
    }

    var name = String(f.name || '').trim();
    if (itemHasError('itemName')) {
      var nameMsg = $('nameError').textContent;
      if ((nameMsg === '请输入预警名称' && name) || (name && !nameTaken(name, f.mode === 'edit' ? f.id : ''))) {
        clearItem('itemName');
      }
    }

    if (itemHasError('itemSchedule') && !(f.schedule === 'weekly' && !f.weekdays.length)) {
      clearItem('itemSchedule');
    }

    if (itemHasError('itemPush')) {
      var pushMsg = $('pushError').textContent;
      var hook = String(f.webhook || '').trim();
      if (f.pushMethod === 'feishu' && f.receivers.length) clearItem('itemPush');
      else if (f.pushMethod === 'bot' && pushMsg === '请输入 Webhook 地址' && hook) clearItem('itemPush');
      else if (f.pushMethod === 'bot' && /^https?:\/\/\S+$/i.test(hook)) clearItem('itemPush');
    }
  }

  function markItem(id) {
    var el = $(id);
    if (el) el.classList.add('is-error');
  }

  function markBox(id, cls) {
    var el = $(id);
    if (el) el.classList.add(cls || 'bm-item-error');
  }

  function isNumber(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text || text === '-' || text === '.' || text === '-.') return false;
    return Number.isFinite(Number(text));
  }

  function nameTaken(name, excludeId) {
    return state.rows.some(function (row) {
      return row.id !== excludeId && row.name === name;
    });
  }

  function readInputs() {
    state.form.name = $('formName').value;
    state.form.webhook = $('webhookInput').value;
    document.querySelectorAll('[data-metric-value]').forEach(function (input) {
      var row = rowById(state.form.metrics, input.getAttribute('data-metric-value'));
      if (row) row.value = input.value;
    });
    document.querySelectorAll('[data-keyword]').forEach(function (input) {
      var row = rowById(state.form.filters, input.getAttribute('data-keyword'));
      if (row) row.keyword = input.value;
    });
  }

  function validate() {
    readInputs();
    clearFieldErrors();
    var ok = true;
    var f = state.form;
    if (!f.boardId) { markItem('itemBoard'); ok = false; }
    if (!f.period) { markItem('itemPeriod'); ok = false; }
    if (f.boardId && !f.dimensions.length) { markItem('itemDim'); ok = false; }

    var filterBad = false;
    f.filters.forEach(function (row) {
      var fieldTrigger = document.querySelector('[data-kind="filter-field"][data-row="' + row.id + '"] .select-trigger');
      if (!row.field) {
        filterBad = true;
        if (fieldTrigger) fieldTrigger.classList.add('is-error');
        return;
      }
      var def = FILTERS[row.field];
      if (def && def.type === 'text') {
        if (!(row.keyword || '').trim()) {
          filterBad = true;
          var input = document.querySelector('[data-keyword="' + row.id + '"]');
          if (input) input.classList.add('is-error');
        }
      } else if (!row.values.length) {
        filterBad = true;
        var valueTrigger = document.querySelector('[data-kind="filter-values"][data-row="' + row.id + '"] .select-trigger');
        if (valueTrigger) valueTrigger.classList.add('is-error');
      }
    });
    if (filterBad) { markBox('itemFilters'); ok = false; }

    var metricBad = false;
    if (!f.metrics.length) metricBad = true;
    f.metrics.forEach(function (row) {
      if (!row.metric) {
        metricBad = true;
        var metricTrigger = document.querySelector('[data-kind="metric"][data-row="' + row.id + '"] .select-trigger');
        if (metricTrigger) metricTrigger.classList.add('is-error');
      }
      if (!isNumber(row.value)) {
        metricBad = true;
        var valueInput = document.querySelector('[data-metric-value="' + row.id + '"]');
        if (valueInput) valueInput.classList.add('is-error');
      }
    });
    if (metricBad) { markBox('itemMetrics'); ok = false; }

    var name = f.name.trim();
    if (!name) {
      markItem('itemName');
      $('nameError').textContent = '请输入预警名称';
      ok = false;
    } else if (nameTaken(name, f.mode === 'edit' ? f.id : '')) {
      markItem('itemName');
      $('nameError').textContent = '预警名称已存在';
      ok = false;
    }

    if (f.schedule === 'weekly' && !f.weekdays.length) {
      markBox('itemSchedule');
      $('scheduleError').textContent = '请选择星期';
      var weekTrigger = $('weekBox').querySelector('.select-trigger');
      if (weekTrigger) weekTrigger.classList.add('is-error');
      ok = false;
    }

    if (f.pushMethod !== 'feishu' && f.pushMethod !== 'bot') {
      markBox('itemPush');
      $('pushError').textContent = '请选择推送方式';
      var pushTrigger = $('pushBox').querySelector('.select-trigger');
      if (pushTrigger) pushTrigger.classList.add('is-error');
      ok = false;
    } else if (f.pushMethod === 'feishu' && !f.receivers.length) {
      markBox('itemPush');
      $('pushError').textContent = '请选择接收人';
      var receiverTrigger = $('receiverBox').querySelector('.select-trigger');
      if (receiverTrigger) receiverTrigger.classList.add('is-error');
      ok = false;
    } else if (f.pushMethod === 'bot' && !f.webhook.trim()) {
      markBox('itemPush');
      $('pushError').textContent = '请输入 Webhook 地址';
      $('webhookInput').classList.add('is-error');
      ok = false;
    } else if (f.pushMethod === 'bot' && !/^https?:\/\/\S+$/i.test(f.webhook.trim())) {
      markBox('itemPush');
      $('pushError').textContent = 'Webhook 地址须为 http(s)';
      $('webhookInput').classList.add('is-error');
      ok = false;
    }

    if (!ok) {
      var first = document.querySelector('#formDrawer .form-item.is-error, #formDrawer .form-item.bm-item-error');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'nearest' });
    }
    return ok;
  }

  function applyForm(target, isNew) {
    var f = state.form;
    target.name = f.name.trim();
    target.boardId = f.boardId;
    target.period = f.period;
    target.dimensions = f.dimensions.slice();
    target.filters = f.filters.map(function (row) {
      return { field: row.field, values: (row.values || []).slice(), keyword: (row.keyword || '').trim() };
    });
    target.logic = f.logic || 'any';
    target.metrics = f.metrics.map(function (row) {
      return {
        metric: row.metric,
        op: row.op,
        basis: row.basis,
        valueType: row.valueType,
        value: String(row.value).trim()
      };
    });
    target.schedule = f.schedule;
    target.weekdays = f.schedule === 'weekly' ? f.weekdays.slice() : [];
    target.time = f.time || '09:00:00';
    target.pushMethod = f.pushMethod === 'bot' ? 'bot' : 'feishu';
    target.receivers = target.pushMethod === 'feishu' ? f.receivers.slice() : [];
    target.webhook = target.pushMethod === 'bot' ? f.webhook.trim() : '';
    if (isNew) {
      target.id = UI.uid('bm');
      target.status = '启用';
      target.triggerCount = 0;
      target.lastTrigger = '';
      target.createdAt = nowText();
      target.creator = CURRENT_USER;
    }
  }

  function sortedRows(list) {
    return list.slice().sort(function (a, b) {
      if (a.createdAt === b.createdAt) return 0;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  }

  function filteredRows() {
    var q = state.applied;
    var name = (q.name || '').trim();
    return sortedRows(state.rows).filter(function (row) {
      if (name && row.name.indexOf(name) < 0) return false;
      if (q.boardId && row.boardId !== q.boardId) return false;
      if (q.creator && row.creator !== q.creator) return false;
      if (q.status && row.status !== q.status) return false;
      return true;
    });
  }

  function renderTable() {
    var rows = filteredRows();
    var pages = Math.max(1, Math.ceil(rows.length / state.pageSize) || 1);
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    var body = $('tableBody');
    var empty = $('emptyTip');
    if (!pageRows.length) {
      body.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      body.innerHTML = pageRows.map(function (row) {
        var board = boardById(row.boardId);
        var boardText = board ? boardLabel(board) : '-';
        var dims = (row.dimensions || []).join('、') || '-';
        var last = row.lastTrigger ? escapeHtml(row.lastTrigger) : '<span class="bm-dash">-</span>';
        var on = row.status === '启用';
        return '<tr>' +
          '<td><button class="switch switch--small' + (on ? ' is-on' : '') + '" type="button" data-status="' +
            escapeHtml(row.id) + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="状态"></button></td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(boardText) + '">' + escapeHtml(boardText) + '</td>' +
          '<td>' + escapeHtml(row.period || '-') + '</td>' +
          '<td title="' + escapeHtml(dims) + '">' + escapeHtml(dims) + '</td>' +
          '<td>' + escapeHtml(row.triggerCount) + '</td>' +
          '<td>' + last + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td><div class="action-links">' +
            '<button class="link" type="button" data-edit="' + escapeHtml(row.id) + '">编辑</button>' +
            '<button class="link" type="button" data-copy="' + escapeHtml(row.id) + '">复制</button>' +
            '<button class="link" type="button" data-del="' + escapeHtml(row.id) + '">删除</button>' +
          '</div></td></tr>';
      }).join('');
    }
    UI.renderPagination({
      containerId: 'pagination',
      total: rows.length,
      page: state.page,
      pageSize: state.pageSize
    });
  }

  function uniqueCopyName(name) {
    var base = name + '-副本';
    if (!nameTaken(base, '')) return base;
    var i = 2;
    while (nameTaken(base + i, '')) i += 1;
    return base + i;
  }

  function openForm(mode, source) {
    closeFloating();
    if (mode === 'add') state.form = defaultForm();
    else {
      state.form = clone(source);
      state.form.mode = mode;
      if (!state.form.metrics.length) state.form.metrics.push(emptyMetric());
      if (mode === 'copy') state.form.name = uniqueCopyName(source.name);
    }
    var titles = { add: '添加预警', edit: '编辑预警', copy: '复制预警' };
    $('formTitle').textContent = titles[state.form.mode] || '添加预警';
    $('formName').value = state.form.name || '';
    $('webhookInput').value = state.form.webhook || '';
    UI.setSegValue('logicSeg', state.form.logic || 'any');
    var nameApi = $('formNameWrap').querySelector('input');
    if (nameApi) $('formNameWrap').classList.toggle('has-value', !!$('formName').value.trim());
    $('webhookWrap').classList.toggle('has-value', !!$('webhookInput').value.trim());
    clearFieldErrors();
    syncBoardLabel();
    syncBoxLabel($('periodBox'));
    syncBoxLabel($('scheduleBox'));
    syncDim();
    syncTimeLabel();
    syncSchedule();
    syncPush();
    renderFilters();
    renderMetrics();
    UI.openDrawer('formDrawer');
    $('formBody').scrollTop = 0;
  }

  function closeForm() {
    closeFloating();
    UI.closeDrawer('formDrawer');
  }

  function submitForm() {
    if (!validate()) return;
    if (state.form.mode === 'edit') {
      var target = rowById(state.rows, state.form.id);
      if (target) applyForm(target, false);
    } else {
      var created = {};
      applyForm(created, true);
      state.rows.unshift(created);
    }
    closeForm();
    state.page = 1;
    renderTable();
    UI.showToast('提交成功', 'success');
  }

  function addFilter() {
    var board = currentBoard();
    if (!board) return;
    var used = {};
    state.form.filters.forEach(function (row) { if (row.field) used[row.field] = true; });
    var next = board.filters.filter(function (key) { return FILTERS[key] && !used[key]; })[0];
    if (!next) {
      UI.showToast('已添加该看板的全部筛选项', 'warning');
      return;
    }
    state.form.filters.push(filterRow(next, [], ''));
    renderFilters();
  }

  function addMetric() {
    state.form.metrics.push(emptyMetric());
    renderMetrics();
  }

  function query() {
    state.applied = {
      name: $('filterName').value,
      boardId: state.draft.boardId,
      creator: state.draft.creator,
      status: state.draft.status
    };
    state.page = 1;
    renderTable();
  }

  function resetQuery() {
    state.draft = emptyQuery();
    state.applied = emptyQuery();
    $('filterName').value = '';
    $('filterNameWrap').classList.remove('has-value');
    filterApis.board.syncLabel('');
    filterApis.creator.syncLabel('');
    filterApis.status.syncLabel('');
    state.page = 1;
    renderTable();
  }

  var filterApis = {};

  function bindPage() {
    $('filterBoardPanel').innerHTML = '<button class="single-option" type="button" data-value="">全部</button>' +
      BOARDS.map(function (board) {
        return '<button class="single-option" type="button" data-value="' + escapeHtml(board.id) + '">' +
          escapeHtml(boardLabel(board)) + '</button>';
      }).join('');

    filterApis.board = UI.bindSingleSelect({
      wrapId: 'filterBoardWrap',
      triggerId: 'filterBoardTrigger',
      panelId: 'filterBoardPanel',
      labelId: 'filterBoardLabel',
      clearId: 'filterBoardClear',
      prefix: '看板：',
      getValue: function () { return state.draft.boardId; },
      formatValue: function (value) {
        var board = boardById(value);
        return board ? boardLabel(board) : value;
      },
      onChange: function (value) { state.draft.boardId = value; }
    });
    filterApis.creator = UI.bindSingleSelect({
      wrapId: 'filterCreatorWrap',
      triggerId: 'filterCreatorTrigger',
      panelId: 'filterCreatorPanel',
      labelId: 'filterCreatorLabel',
      clearId: 'filterCreatorClear',
      prefix: '创建人：',
      getValue: function () { return state.draft.creator; },
      onChange: function (value) { state.draft.creator = value; }
    });
    filterApis.status = UI.bindSingleSelect({
      wrapId: 'filterStatusWrap',
      triggerId: 'filterStatusTrigger',
      panelId: 'filterStatusPanel',
      labelId: 'filterStatusLabel',
      clearId: 'filterStatusClear',
      prefix: '状态：',
      getValue: function () { return state.draft.status; },
      onChange: function (value) { state.draft.status = value; }
    });
    UI.bindInputClearable({ wrapId: 'filterNameWrap' });
    UI.bindInputClearable({ wrapId: 'formNameWrap' });
    UI.bindInputClearable({ wrapId: 'webhookWrap' });
    UI.bindFormHelp($('formDrawer'));

    UI.bindSeg('logicSeg', function (value) { state.form.logic = value || 'any'; });

    $('resetBtn').addEventListener('click', resetQuery);
    $('queryBtn').addEventListener('click', query);
    $('addBtn').addEventListener('click', function () { openForm('add'); });
    $('addFilterBtn').addEventListener('click', addFilter);
    $('addMetricBtn').addEventListener('click', addMetric);
    $('formClose').addEventListener('click', closeForm);
    $('formCancel').addEventListener('click', closeForm);
    $('formSubmit').addEventListener('click', submitForm);

    $('formBody').addEventListener('click', function (e) {
      var removeFilter = e.target.closest('[data-remove-filter]');
      if (removeFilter) {
        var fid = removeFilter.getAttribute('data-remove-filter');
        state.form.filters = state.form.filters.filter(function (row) { return row.id !== fid; });
        renderFilters();
        return;
      }
      var removeMetric = e.target.closest('[data-remove-metric]');
      if (removeMetric) {
        var mid = removeMetric.getAttribute('data-remove-metric');
        state.form.metrics = state.form.metrics.filter(function (row) { return row.id !== mid; });
        if (!state.form.metrics.length) state.form.metrics.push(emptyMetric());
        renderMetrics();
        return;
      }
      var trigger = e.target.closest('.bm-select > .select-trigger');
      if (trigger && $('formBody').contains(trigger)) {
        e.stopPropagation();
        toggleFromTrigger(trigger);
      }
    });

    $('formBody').addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'formName') state.form.name = t.value;
      if (t.id === 'webhookInput') state.form.webhook = t.value;
      if (t.hasAttribute('data-metric-value')) {
        var metric = rowById(state.form.metrics, t.getAttribute('data-metric-value'));
        if (metric) metric.value = t.value;
      }
      if (t.hasAttribute('data-keyword')) {
        var filter = rowById(state.form.filters, t.getAttribute('data-keyword'));
        if (filter) filter.keyword = t.value;
      }
      hideFilledErrors();
    });

    $('formBody').addEventListener('scroll', closeFloating);

    $('tableBody').addEventListener('click', function (e) {
      var statusBtn = e.target.closest('[data-status]');
      if (statusBtn) {
        openStatusConfirm(statusBtn.getAttribute('data-status'));
        return;
      }
      var edit = e.target.closest('[data-edit]');
      var copy = e.target.closest('[data-copy]');
      var del = e.target.closest('[data-del]');
      if (edit) openForm('edit', rowById(state.rows, edit.getAttribute('data-edit')));
      else if (copy) openForm('copy', rowById(state.rows, copy.getAttribute('data-copy')));
      else if (del) {
        state.deleteId = del.getAttribute('data-del');
        UI.openModal('confirmModal');
      }
    });

    function openStatusConfirm(id) {
      var row = rowById(state.rows, id);
      if (!row) return;
      var turningOn = row.status !== '启用';
      state.statusPending = { id: id, next: turningOn ? '启用' : '禁用' };
      $('statusConfirmTitle').textContent = turningOn ? '启用确认' : '禁用确认';
      $('statusConfirmBody').textContent = turningOn ? '确认启用该预警吗？' : '确认禁用该预警吗？';
      UI.openModal('statusConfirmModal');
    }

    function closeStatusConfirm() {
      state.statusPending = null;
      UI.closeModal('statusConfirmModal');
    }

    $('statusConfirmCancel').addEventListener('click', closeStatusConfirm);
    $('statusConfirmClose').addEventListener('click', closeStatusConfirm);
    $('statusConfirmOk').addEventListener('click', function () {
      var pending = state.statusPending;
      if (!pending) return;
      var row = rowById(state.rows, pending.id);
      if (row) row.status = pending.next;
      closeStatusConfirm();
      renderTable();
    });

    $('confirmCancel').addEventListener('click', function () { UI.closeModal('confirmModal'); });
    $('confirmClose').addEventListener('click', function () { UI.closeModal('confirmModal'); });
    $('confirmOk').addEventListener('click', function () {
      state.rows = state.rows.filter(function (row) { return row.id !== state.deleteId; });
      state.deleteId = '';
      UI.closeModal('confirmModal');
      renderTable();
      UI.showToast('删除成功', 'success');
    });

    UI.bindPagination({
      containerId: 'pagination',
      getTotal: function () { return filteredRows().length; },
      getPage: function () { return state.page; },
      getPageSize: function () { return state.pageSize; },
      onPageChange: function (page) { state.page = page; renderTable(); },
      onPageSizeChange: function (size) { state.pageSize = size; state.page = 1; renderTable(); }
    });

    document.addEventListener('click', function () {
      document.querySelectorAll('.bm-panel-portal, .bm-time-panel.is-open').forEach(unportal);
    });
  }

  bindPage();
  renderTable();
})();
