/* TikTok托管 · 工具一级页 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var CURRENT_USER = '用户A';
  var CHANNEL = 'TikTok';

  var PRODUCTS = [
    { name: 'Fun Overload', asset: '小游戏' },
    { name: 'Mind Block', asset: '小游戏' },
    { name: 'Brain Mix', asset: '小游戏' },
    { name: '闪婚当天', asset: '短剧' },
    { name: '重生豪门', asset: '短剧' },
    { name: '隐婚甜妻', asset: '短剧' },
    { name: 'Life Story', asset: 'APP' },
    { name: 'Flow Master', asset: 'APP' },
    { name: 'Path Flow', asset: 'APP' }
  ];
  var ASSETS = ['小游戏', '短剧', 'APP'];
  var OPTIMIZERS = ['用户A', '用户B', '用户C', '用户D', '用户E', '用户F'];
  var ACCOUNT_PREFIXES = ['CWSM_TT_BV', 'TMJ_TT_US', 'WP_TT_EU', 'SM_TT_SEA', 'OM_TT_NA', 'PF_TT_JP'];
  function padAccountId(n) {
    return String(7000000000000000000n + BigInt(n)).slice(0, 19);
  }
  function pad3(n) {
    var text = String(n);
    while (text.length < 3) text = '0' + text;
    return text;
  }
  var ACCOUNTS = (function () {
    var list = [];
    var i;
    for (i = 0; i < 58; i++) {
      var isDrama = i % 3 === 0;
      var prefix = ACCOUNT_PREFIXES[i % ACCOUNT_PREFIXES.length];
      list.push({
        name: i === 0
          ? 'BT_TT_BV_minigame_01'
          : i === 1
            ? 'NJSS_TT_TD_minigame_01'
            : prefix + (isDrama ? '_drama_' : '_minigame_') + pad3(i + 1),
        id: i === 0
          ? '7595510834332368897'
          : i === 1
            ? '7602217642383049840'
            : padAccountId(i * 137 + 8295792517141)
      });
    }
    return list;
  })();
  var CAMPAIGN_SUFFIX = ['安装-通投', '安装-相似受众', '再营销-7日', '再营销-付费', '覆盖-品牌', '转化-注册', '转化-付费', 'AEO-安装'];
  var CAMPAIGNS = (function () {
    var list = [];
    var i;
    for (i = 0; i < 24; i++) {
      var product = PRODUCTS[i % PRODUCTS.length];
      var account = ACCOUNTS[i % ACCOUNTS.length];
      list.push({
        id: String(1805523000000100 + i),
        name: product.name + '-' + CAMPAIGN_SUFFIX[i % CAMPAIGN_SUFFIX.length],
        accountId: account.id,
        asset: product.asset,
        product: product.name,
        optimizer: OPTIMIZERS[i % OPTIMIZERS.length]
      });
    }
    return list;
  })();
  var METRICS = ['消耗', '展示量', '点击量', '点击率', '平均点击成本', '千次展示成本', '转化量', '平均转化成本', '转化率', '累计总收入', '累计总ROAS', '覆盖人数', '频次', '广告 ROAS', '付费 ROAS'];
  var OPS = ['大于', '大于等于', '小于', '小于等于', '等于'];
  var PERIODS = ['今天', '昨天', '近2天(含今天)', '近3天(含今天)', '近7天(含今天)', '过去2天', '过去3天', '过去7天'];
  var ACTION_LABEL = { feishu: '飞书消息推送', bot: '飞书机器人推送', status: '修改状态', daily: '调整日预算', total: '调整总预算' };
  var ACTION_ORDER = ['feishu', 'bot', 'status', 'daily', 'total'];
  var MODE_LABEL = { set: '调整至', inc: '增加数值', dec: '减少数值' };
  var MODE_ORDER = ['set', 'inc', 'dec'];
  var FREQ_LABEL = { m30: '每30分钟', hour: '每小时', daily: '每天', weekly: '每周' };
  var FREQ_ORDER = ['m30', 'hour', 'daily', 'weekly'];
  var WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  var RUN_STATUS = ['开启', '暂停'];
  var TIMEZONES = (function () {
    var list = [];
    var h;
    for (h = -12; h <= 14; h++) {
      if (h === 0) list.push('UTC+0');
      else if (h > 0) list.push('UTC+' + h);
      else list.push('UTC' + h);
    }
    return list;
  })();

  var ARROW = '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  var SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg>';
  var dateApi = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function nowText() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function logItem(time, operator, content) {
    return { time: time, operator: operator, content: content };
  }

  function dateShift(text, minutes) {
    var parts = String(text || '').split(/[- :]/);
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), Number(parts[3]) || 0, Number(parts[4]) || 0, Number(parts[5]) || 0);
    if (isNaN(d.getTime())) return text;
    d.setMinutes(d.getMinutes() - minutes);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function makeRuns(count, lastRun, stepMin, build) {
    var runs = [];
    var i;
    for (i = 0; i < count; i++) {
      var record = build(dateShift(lastRun, i * stepMin), CAMPAIGNS[i % CAMPAIGNS.length], i % 5 === 4, i);
      if (record) runs.push(record);
    }
    return runs;
  }

  function runRecord(time, campaign, action, ok, detail) {
    return {
      time: time,
      accountName: accountName(campaign.accountId),
      accountId: campaign.accountId,
      campaignName: campaign.name,
      campaignId: campaign.id,
      action: action,
      ok: ok,
      detail: detail
    };
  }

  function attachRuns(rows) {
    var plan = {
      'th-1': { step: 1440, action: '调整日预算', ok: function (i) { var from = 100 + (i % 4) * 50; return '日预算 ' + from + ' → ' + (from + 50) + ' USD'; } },
      'th-2': { step: 1440, action: '修改状态', ok: function () { return '开启 → 暂停'; } },
      'th-3': { step: 1440, action: '调整日预算', ok: function (i) { var from = 200 + (i % 3) * 50; return '日预算 ' + from + ' → ' + Math.min(from + 50, 500) + ' USD'; } },
      'th-5': { step: 1440, action: '调整日预算', ok: function (i) { var from = 80 + (i % 3) * 20; return '日预算 ' + from + ' → ' + (from + 20) + ' USD'; } },
      'th-6': { step: 60, action: '飞书消息推送', ok: function () { return '已推送给 用户A'; }, fail: '推送失败' },
      'th-7': { step: 1440, action: '调整日预算', ok: function () { return '日预算调整至 50 USD'; } },
      'th-9': { step: 60, action: '调整日预算', ok: function (i) { var from = 160 - (i % 3) * 20; return '日预算 ' + from + ' → ' + (from - 20) + ' USD'; } },
      'th-10': { step: 10080, action: '调整总预算', ok: function () { return '总预算 500 → 420 USD'; } }
    };
    rows.forEach(function (row) {
      if (row.id === 'th-8') {
        row.runs = makeRuns(row.runCount, row.lastRun, 30, function (time, campaign, skipped, i) {
          var notify = i % 2 === 0;
          if (skipped && !notify) return null;
          return runRecord(
            time,
            campaign,
            notify ? '飞书消息推送' : '调整日预算',
            !skipped,
            skipped ? '推送失败' : (notify ? '已推送给 用户A、用户B' : '日预算调整至 300 USD')
          );
        });
        row.runCount = row.runs.length;
        return;
      }
      var item = plan[row.id];
      row.runs = item ? makeRuns(row.runCount, row.lastRun, item.step, function (time, campaign, skipped, i) {
        if (skipped && !item.fail) return null;
        return runRecord(time, campaign, item.action, !skipped, skipped ? item.fail : item.ok(i));
      }) : [];
      row.runCount = row.runs.length;
    });
  }

  function seed() {
    var rows = [
      {
        id: 'th-1', runCount: 18, name: '系列日预算托管', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户A', lastRun: '2026-10-27 09:00:12', createdAt: '2026-10-20 10:20:00',
        logs: [
          logItem('2026-10-22 11:06:18', '用户A', '修改状态：禁用 → 启用'),
          logItem('2026-10-21 16:40:02', '用户B', '修改名称：系列预算管控 → 系列日预算托管'),
          logItem('2026-10-20 10:20:00', '用户A', '创建托管')
        ]
      },
      {
        id: 'th-2', runCount: 6, name: '低消耗系列暂停', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户B', lastRun: '2026-10-27 18:30:08', createdAt: '2026-10-18 14:12:33',
        logs: [
          logItem('2026-10-19 09:12:44', '用户B', '修改状态：禁用 → 启用'),
          logItem('2026-10-18 14:12:33', '用户B', '创建托管')
        ]
      },
      {
        id: 'th-3', runCount: 24, name: '系列预算上调', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户A', lastRun: '2026-10-28 08:00:21', createdAt: '2026-10-16 09:40:18',
        logs: [logItem('2026-10-16 09:40:18', '用户A', '创建托管')],
        config: {
          filters: [
            { id: 'f-3a', field: 'accounts', values: ['7595510834332368897'] },
            { id: 'f-3b', field: 'campaigns', values: ['1805523000000100'] },
            { id: 'f-3c', field: 'products', values: ['Fun Overload'] },
            { id: 'f-3d', field: 'optimizers', values: ['用户A'] }
          ],
          logic: 'all',
          metrics: [{ id: 'm-3', metric: '消耗', period: '今天', op: '大于', value: '500' }],
          actions: [{ id: 'a-3', type: 'daily', receivers: ['用户A'], webhook: '', status: '', mode: 'inc', amount: '50', cap: '500' }],
          timezone: 'UTC+0', effect: 'long', effectStart: '', effectEnd: '', frequency: 'daily', weekdays: [], time: '09:00:00'
        }
      },
      {
        id: 'th-4', runCount: 0, name: '空耗系列关停', status: '禁用', channel: CHANNEL, target: '推广系列',
        creator: '用户C', lastRun: '', createdAt: '2026-10-12 16:05:44',
        logs: [
          logItem('2026-10-15 10:18:09', '用户C', '修改状态：启用 → 禁用'),
          logItem('2026-10-12 16:05:44', '用户C', '创建托管')
        ],
        config: {
          filters: [
            { id: 'f-4a', field: 'assets', values: ['短剧'] },
            { id: 'f-4b', field: 'optimizers', values: ['用户C'] }
          ],
          logic: 'any',
          metrics: [
            { id: 'm-4a', metric: '消耗', period: '今天', op: '大于', value: '100' },
            { id: 'm-4b', metric: '转化量', period: '今天', op: '小于等于', value: '0' }
          ],
          actions: [{ id: 'a-4', type: 'status', receivers: ['用户A'], webhook: '', status: '暂停', mode: 'set', amount: '', cap: '' }],
          timezone: 'UTC+8', effect: 'long', effectStart: '', effectEnd: '', frequency: 'hour', weekdays: [], time: '09:00:00'
        }
      },
      {
        id: 'th-5', runCount: 11, name: '达标系列加预算', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户D', lastRun: '2026-10-27 20:15:36', createdAt: '2026-10-09 11:18:09',
        logs: [logItem('2026-10-09 11:18:09', '用户D', '创建托管')]
      },
      {
        id: 'th-6', runCount: 9, name: '学习期保护', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户B', lastRun: '2026-10-26 11:00:40', createdAt: '2026-10-06 08:22:51',
        logs: [logItem('2026-10-06 08:22:51', '用户B', '创建托管')]
      },
      {
        id: 'th-7', runCount: 3, name: '新系列冷启动', status: '禁用', channel: CHANNEL, target: '推广系列',
        creator: '用户E', lastRun: '2026-10-10 09:30:02', createdAt: '2026-09-28 19:33:27',
        logs: [
          logItem('2026-10-11 13:22:16', '用户E', '修改状态：启用 → 禁用'),
          logItem('2026-09-28 19:33:27', '用户E', '创建托管')
        ]
      },
      {
        id: 'th-8', runCount: 15, name: '高ROAS系列放量', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户A', lastRun: '2026-10-28 09:15:11', createdAt: '2026-09-22 13:47:02',
        logs: [logItem('2026-09-22 13:47:02', '用户A', '创建托管')],
        config: {
          filters: [],
          logic: 'all',
          metrics: [{ id: 'm-8', metric: '累计总ROAS', period: '近7天(含今天)', op: '大于', value: '1.2' }],
          actions: [
            { id: 'a-8a', type: 'feishu', receivers: ['用户A', '用户B'], webhook: '', status: '', mode: 'set', amount: '', cap: '' },
            { id: 'a-8b', type: 'daily', receivers: ['用户A'], webhook: '', status: '', mode: 'set', amount: '300', cap: '' }
          ],
          timezone: 'UTC+0', effect: 'long', effectStart: '', effectEnd: '', frequency: 'm30', weekdays: [], time: '09:00:00'
        }
      },
      {
        id: 'th-9', runCount: 7, name: '素材疲劳降价', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户F', lastRun: '2026-10-25 21:08:44', createdAt: '2026-09-16 10:05:18',
        logs: [logItem('2026-09-16 10:05:18', '用户F', '创建托管')]
      },
      {
        id: 'th-10', runCount: 4, name: '周末预算收缩', status: '启用', channel: CHANNEL, target: '推广系列',
        creator: '用户C', lastRun: '2026-10-26 00:05:00', createdAt: '2026-09-08 15:28:41',
        logs: [logItem('2026-09-08 15:28:41', '用户C', '创建托管')],
        config: {
          filters: [
            { id: 'f-10', field: 'optimizers', values: ['用户C'] }
          ],
          logic: 'any',
          metrics: [{ id: 'm-10', metric: '消耗', period: '过去7天', op: '大于等于', value: '200' }],
          actions: [{ id: 'a-10', type: 'total', receivers: ['用户A'], webhook: '', status: '', mode: 'dec', amount: '80', cap: '100' }],
          timezone: 'UTC+0', effect: 'custom', effectStart: '2026-10-01', effectEnd: '2026-12-31',
          frequency: 'weekly', weekdays: ['周一'], time: '09:00:00'
        }
      }
    ];
    attachRuns(rows);
    return rows;
  }

  function emptyQuery() {
    return { name: '', creator: '', status: '' };
  }

  function emptyRunQuery() {
    return { start: '', end: '', account: '', campaign: '', result: '' };
  }

  function cloneRunQuery(q) {
    return {
      start: q.start,
      end: q.end,
      account: q.account,
      campaign: q.campaign,
      result: q.result
    };
  }

  var state = {
    rows: seed(),
    draft: emptyQuery(),
    applied: emptyQuery(),
    page: 1,
    pageSize: 20,
    form: { mode: 'add', id: '', target: '广告账户', name: '' },
    deleteId: '',
    statusPending: null,
    logId: '',
    runId: '',
    cfg: null,
    logPage: 1,
    logPageSize: 20,
    runPage: 1,
    runPageSize: 20,
    runDraft: emptyRunQuery(),
    runApplied: emptyRunQuery(),
    logPaginationBound: false
  };

  var runResultApi = null;

  function rowById(id) {
    for (var i = 0; i < state.rows.length; i++) {
      if (state.rows[i].id === id) return state.rows[i];
    }
    return null;
  }

  function nameTaken(name, excludeId) {
    var key = (name || '').trim();
    return state.rows.some(function (row) {
      return row.id !== excludeId && row.name === key;
    });
  }

  function pushLog(row, content) {
    if (!row.logs) row.logs = [];
    row.logs.unshift(logItem(nowText(), CURRENT_USER, content));
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
      if (q.creator && row.creator !== q.creator) return false;
      if (q.status && row.status !== q.status) return false;
      return true;
    });
  }

  function frequencyText(row) {
    var cfg = row.config || {};
    var freq = cfg.frequency || 'daily';
    var label = FREQ_LABEL[freq] || '每天';
    var time = cfg.time || '09:00:00';
    if (freq === 'weekly') {
      var days = (cfg.weekdays && cfg.weekdays.length) ? cfg.weekdays.join('、') : '周一';
      return label + ' ' + days + ' ' + time;
    }
    if (freq === 'daily') return label + ' ' + time;
    return label;
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
        var on = row.status === '启用';
        var last = row.lastRun ? escapeHtml(row.lastRun) : '<span class="th-dash">-</span>';
        return '<tr>' +
          '<td><button class="switch' + (on ? ' is-on' : '') + '" type="button" data-status="' +
            escapeHtml(row.id) + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="状态"></button></td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td>推广系列</td>' +
          '<td title="' + escapeHtml(frequencyText(row)) + '">' + escapeHtml(frequencyText(row)) + '</td>' +
          '<td>' + escapeHtml(String(row.runCount || 0)) + '</td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td>' + last + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td class="col-action"><div class="action-links">' +
            '<button class="link" type="button" data-run="' + escapeHtml(row.id) + '">执行记录</button>' +
            '<button class="link" type="button" data-edit="' + escapeHtml(row.id) + '">编辑</button>' +
            '<button class="link" type="button" data-duplicate="' + escapeHtml(row.id) + '">复制</button>' +
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
    if (window.ColResize) window.ColResize.refresh($('dataTable'));
  }

  function setNameError(message) {
    var item = $('itemName');
    if (!message) {
      item.classList.remove('is-error');
      return;
    }
    $('nameError').textContent = message;
    item.classList.add('is-error');
  }

  function setCreateError(message) {
    var item = $('createNameItem');
    if (!message) {
      item.classList.remove('is-error');
      return;
    }
    $('createNameError').textContent = message;
    item.classList.add('is-error');
  }

  function closeCreateMenu() {
    $('createMenu').hidden = true;
    $('createSplit').classList.remove('is-open');
    $('createCaret').setAttribute('aria-expanded', 'false');
  }

  function toggleCreateMenu() {
    var open = $('createMenu').hidden;
    $('createMenu').hidden = !open;
    $('createSplit').classList.toggle('is-open', open);
    $('createCaret').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openCreate(target, row, asCopy) {
    closeCreateMenu();
    closeFloating();
    var campaign = target === '推广系列';
    var copying = !!asCopy && !!(row && row.id);
    var editing = !copying && !!(row && row.id);
    state.form = {
      mode: editing ? 'edit' : 'add',
      id: editing ? row.id : '',
      target: target,
      name: copying ? uniqueCopyName(row.name) : (editing ? row.name : '')
    };
    state.cfg = campaign ? cloneCfg((editing || copying) && row && row.config ? row.config : null) : null;
    $('ruleCard').hidden = !campaign;
    $('campaignCfg').hidden = !campaign;
    $('createTitle').textContent = (copying ? '复制' : editing ? '编辑' : '') + target + '托管';
    $('createName').value = state.form.name;
    $('createNameWrap').classList.toggle('has-value', !!state.form.name);
    setCreateError('');
    clearCfgErrors();
    if (campaign) paintCampaign();
    $('listView').hidden = true;
    $('createView').hidden = false;
    $('createBody').scrollTop = 0;
    if (!campaign) $('createName').focus();
  }

  function closeCreate() {
    closeFloating();
    $('createView').hidden = true;
    $('listView').hidden = false;
    setCreateError('');
    clearCfgErrors();
    state.cfg = null;
  }

  function submitCreate() {
    var name = $('createName').value.trim();
    var excludeId = state.form.mode === 'edit' ? state.form.id : '';
    var nameOk = true;
    if (!name) {
      setCreateError('请输入托管名称');
      nameOk = false;
    } else if (nameTaken(name, excludeId)) {
      setCreateError('托管名称已存在');
      nameOk = false;
    } else {
      setCreateError('');
    }
    var cfgOk = state.form.target === '推广系列' ? validateCfg() : true;
    if (!nameOk || !cfgOk) {
      var first = document.querySelector('#createView .form-item.is-error, #createView .form-item.th-item-error');
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (state.form.mode === 'edit') {
      var row = rowById(state.form.id);
      if (!row) {
        closeCreate();
        return;
      }
      var nextCfg = snapshotCfg();
      var nameChanged = row.name !== name;
      var cfgChanged = JSON.stringify(row.config || null) !== JSON.stringify(nextCfg);
      if (!nameChanged && !cfgChanged) {
        closeCreate();
        UI.showToast('未修改任何内容', 'info');
        return;
      }
      if (nameChanged) {
        pushLog(row, '修改名称：' + row.name + ' → ' + name);
        row.name = name;
      }
      if (cfgChanged) {
        row.config = nextCfg;
        pushLog(row, '修改托管配置');
      }
      closeCreate();
      renderTable();
      UI.showToast('提交成功', 'success');
      return;
    }
    var created = {
      id: UI.uid('th'),
      name: name,
      status: '启用',
      channel: CHANNEL,
      target: '推广系列',
      creator: CURRENT_USER,
      runCount: 0,
      lastRun: '',
      createdAt: nowText(),
      logs: [],
      config: state.form.target === '推广系列' ? snapshotCfg() : null
    };
    pushLog(created, '创建托管');
    state.rows.unshift(created);
    state.page = 1;
    closeCreate();
    renderTable();
    UI.showToast('提交成功', 'success');
  }

  function openForm(mode, target, row) {
    state.form = {
      mode: mode,
      id: row ? row.id : '',
      target: row ? row.target : target,
      name: row ? row.name : ''
    };
    $('formTitle').textContent = mode === 'edit' ? '编辑托管' : (state.form.target + '托管');
    $('formName').value = state.form.name;
    $('formTarget').value = state.form.target;
    $('formNameWrap').classList.toggle('has-value', !!state.form.name);
    setNameError('');
    UI.openModal('formModal');
  }

  function closeForm() {
    UI.closeModal('formModal');
  }

  function submitForm() {
    var name = $('formName').value.trim();
    if (!name) {
      setNameError('请输入托管名称');
      return;
    }
    if (nameTaken(name, state.form.id)) {
      setNameError('托管名称已存在');
      return;
    }
    var row = rowById(state.form.id);
    if (!row) {
      closeForm();
      return;
    }
    if (row.name === name) {
      closeForm();
      UI.showToast('未修改任何内容', 'info');
      return;
    }
    pushLog(row, '修改名称：' + row.name + ' → ' + name);
    row.name = name;
    closeForm();
    renderTable();
    UI.showToast('提交成功', 'success');
  }

  function uniqueCopyName(name) {
    var base = name + '-副本';
    if (!nameTaken(base, '')) return base;
    var n = 2;
    while (nameTaken(base + n, '')) n += 1;
    return base + n;
  }

  function entityCell(name, id, copyLabel) {
    return '<div class="run-entity">' +
      '<div class="run-entity__name" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</div>' +
      '<div class="run-entity__id">' +
        '<span class="cell-id__text" title="' + escapeHtml(id) + '">' + escapeHtml(id) + '</span>' +
        '<button class="copy-btn" type="button" data-copy="' + escapeHtml(id) + '" title="' + escapeHtml(copyLabel) + '" aria-label="' + escapeHtml(copyLabel) + '">' + UI.COPY_ICON + '</button>' +
      '</div></div>';
  }

  function hostingRuns() {
    var row = rowById(state.runId);
    return row && row.runs ? row.runs : [];
  }

  function hitKeyword(keyword, values) {
    var kw = String(keyword || '').trim().toLowerCase();
    if (!kw) return true;
    return values.some(function (value) {
      return String(value || '').toLowerCase().indexOf(kw) >= 0;
    });
  }

  function filteredRuns() {
    var q = state.runApplied;
    return hostingRuns().filter(function (item) {
      var day = String(item.time || '').slice(0, 10);
      if (q.start && day < q.start) return false;
      if (q.end && day > q.end) return false;
      if (!hitKeyword(q.account, [item.accountName, item.accountId])) return false;
      if (!hitKeyword(q.campaign, [item.campaignName, item.campaignId])) return false;
      if (q.result === '成功' && !item.ok) return false;
      if (q.result === '失败' && item.ok) return false;
      return true;
    });
  }

  var RUN_DATE_HTML =
    '<div class="th-date" id="runDateWrap">' +
      '<button class="date-range-trigger" type="button" id="runDateTrigger">' +
        '<span class="date-range-trigger__text" id="runDateLabel"><span class="muted">请选择</span></span>' +
      '</button>' +
      '<div class="date-panel" id="runDatePanel">' +
        '<div class="date-panel__shortcuts" id="runDateShortcuts">' +
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
          '<div class="date-cal" id="runDateCalLeft"></div>' +
          '<div class="date-cal" id="runDateCalRight"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function mountRunDate() {
    var host = $('runDateHost');
    if (!host) return;
    host.innerHTML = RUN_DATE_HTML;
    UI.bindDateRange({
      wrapId: 'runDateWrap',
      triggerId: 'runDateTrigger',
      labelId: 'runDateLabel',
      panelId: 'runDatePanel',
      shortcutsId: 'runDateShortcuts',
      calLeftId: 'runDateCalLeft',
      calRightId: 'runDateCalRight',
      prefix: '日期：',
      onChange: function (startDate, endDate) {
        state.runDraft.start = startDate ? ymd(startDate) : '';
        state.runDraft.end = endDate ? ymd(endDate) : '';
        var item = $('runDateItem');
        if (item) item.classList.toggle('has-value', !!(startDate && endDate));
      }
    });
  }

  function clearRunDateDraft() {
    state.runDraft.start = '';
    state.runDraft.end = '';
    UI.closePanels();
    mountRunDate();
    var item = $('runDateItem');
    if (item) item.classList.remove('has-value');
  }

  function syncRunFilterControls() {
    var account = $('runAccountInput');
    var campaign = $('runCampaignInput');
    if (account) account.value = state.runDraft.account;
    if (campaign) campaign.value = state.runDraft.campaign;
    var accountWrap = $('runAccountWrap');
    var campaignWrap = $('runCampaignWrap');
    if (accountWrap) accountWrap.classList.toggle('has-value', !!state.runDraft.account);
    if (campaignWrap) campaignWrap.classList.toggle('has-value', !!state.runDraft.campaign);
    if (runResultApi) runResultApi.syncLabel(state.runDraft.result);
  }

  function resetRunFilters() {
    state.runDraft = emptyRunQuery();
    state.runApplied = emptyRunQuery();
    UI.closePanels();
    mountRunDate();
    var item = $('runDateItem');
    if (item) item.classList.remove('has-value');
    syncRunFilterControls();
  }

  function applyRunFilters() {
    UI.closePanels();
    state.runApplied = cloneRunQuery(state.runDraft);
    state.runPage = 1;
    renderRunDrawer();
  }

  function renderRunDrawer() {
    var body = $('runDrawerBody');
    var pager = $('runPagination');
    var row = rowById(state.runId);
    var runs = filteredRuns();
    $('runDrawerTitle').textContent = row ? ('执行记录 · ' + row.name) : '执行记录';
    if (!runs.length) {
      body.innerHTML = '<div class="log-table__empty">暂无执行记录</div>';
      pager.hidden = true;
      pager.innerHTML = '';
      return;
    }
    var total = runs.length;
    var totalPages = Math.max(1, Math.ceil(total / state.runPageSize));
    if (state.runPage > totalPages) state.runPage = totalPages;
    var start = (state.runPage - 1) * state.runPageSize;
    var pageRuns = runs.slice(start, start + state.runPageSize);
    body.innerHTML =
      '<div class="log-table-shell run-table-shell"><table class="log-table run-table">' +
        '<colgroup><col style="width:128px"/><col style="width:240px"/><col style="width:240px"/><col style="width:128px"/><col style="width:88px"/><col/></colgroup>' +
        '<thead><tr><th>执行时间</th><th>广告账户名称</th><th>推广系列名称</th><th>执行动作</th><th>执行结果</th><th>说明</th></tr></thead><tbody>' +
        pageRuns.map(function (item) {
          return '<tr>' +
            '<td>' + escapeHtml(item.time) + '</td>' +
            '<td>' + entityCell(item.accountName, item.accountId, '复制账户ID') + '</td>' +
            '<td>' + entityCell(item.campaignName, item.campaignId, '复制推广系列ID') + '</td>' +
            '<td>' + escapeHtml(item.action) + '</td>' +
            '<td><span class="tag tag--' + (item.ok ? 'enabled' : 'disabled') + '">' + (item.ok ? '成功' : '失败') + '</span></td>' +
            '<td><div class="log-table__change">' + escapeHtml(item.detail) + '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    pager.hidden = false;
    UI.renderPagination({
      containerId: 'runPagination',
      total: total,
      page: state.runPage,
      pageSize: state.runPageSize
    });
  }

  function openRun(row) {
    if (!row) return;
    state.runId = row.id;
    state.runPage = 1;
    resetRunFilters();
    renderRunDrawer();
    UI.openDrawer('runDrawer');
  }

  function closeRun() {
    UI.closeDrawer('runDrawer');
    state.runId = '';
  }

  function renderLogDrawer() {
    var body = $('logDrawerBody');
    var pager = $('logPagination');
    var row = rowById(state.logId);
    var logs = row && row.logs ? row.logs : [];
    $('logDrawerTitle').textContent = row ? ('日志 · ' + row.name) : '日志';
    if (!logs.length) {
      body.innerHTML = '<div class="log-table__empty">暂无日志</div>';
      pager.hidden = true;
      pager.innerHTML = '';
      return;
    }
    var total = logs.length;
    var totalPages = Math.max(1, Math.ceil(total / state.logPageSize));
    if (state.logPage > totalPages) state.logPage = totalPages;
    var start = (state.logPage - 1) * state.logPageSize;
    var pageLogs = logs.slice(start, start + state.logPageSize);
    body.innerHTML =
      '<div class="log-table-shell"><table class="log-table">' +
        '<colgroup><col style="width:180px"/><col style="width:88px"/><col/></colgroup>' +
        '<thead><tr><th>操作时间</th><th>操作人</th><th>变更内容</th></tr></thead><tbody>' +
        pageLogs.map(function (log) {
          return '<tr>' +
            '<td>' + escapeHtml(log.time) + '</td>' +
            '<td>' + escapeHtml(log.operator) + '</td>' +
            '<td><div class="log-table__change">' + escapeHtml(log.content) + '</div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    pager.hidden = false;
    UI.renderPagination({
      containerId: 'logPagination',
      total: total,
      page: state.logPage,
      pageSize: state.logPageSize
    });
  }

  function openLog(row) {
    if (!row) return;
    state.logId = row.id;
    state.logPage = 1;
    renderLogDrawer();
    UI.openDrawer('logDrawer');
  }

  function closeLog() {
    UI.closeDrawer('logDrawer');
    state.logId = '';
  }

  function query() {
    state.applied = {
      name: $('filterName').value,
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
    filterApis.creator.syncLabel('');
    filterApis.status.syncLabel('');
    state.page = 1;
    renderTable();
  }

  var filterApis = {};

  function cloneCfg(src) {
    if (!src) return defaultCfg();
    var copy = JSON.parse(JSON.stringify(src));
    if (!copy.filters) {
      copy.filters = [];
      ['accounts', 'campaigns', 'assets', 'products', 'optimizers'].forEach(function (key) {
        if (copy[key] && copy[key].length) copy.filters.push({ id: UI.uid('f'), field: key, values: copy[key].slice() });
      });
    }
    if (!copy.metrics || !copy.metrics.length) copy.metrics = [emptyMetric()];
    copy.metrics.forEach(function (row) {
      if (!row.period) row.period = '今天';
    });
    if (!copy.actions || !copy.actions.length) copy.actions = [emptyAction()];
    return copy;
  }

  function defaultCfg() {
    return {
      filters: [{ id: UI.uid('f'), field: 'accounts', values: [] }],
      logic: 'any',
      metrics: [emptyMetric()],
      actions: [emptyAction()],
      timezone: 'UTC+0',
      effect: 'long',
      effectStart: '',
      effectEnd: '',
      frequency: 'daily',
      weekdays: [],
      time: '09:00:00'
    };
  }

  function emptyMetric() {
    return { id: UI.uid('m'), metric: '', period: '今天', op: '大于', value: '' };
  }

  function emptyAction() {
    return {
      id: UI.uid('a'),
      type: 'feishu',
      receivers: [CURRENT_USER],
      webhook: '',
      status: '',
      mode: 'set',
      amount: '',
      cap: ''
    };
  }

  function snapshotCfg() {
    var copy = JSON.parse(JSON.stringify(state.cfg));
    if (copy.effect !== 'custom') {
      copy.effectStart = '';
      copy.effectEnd = '';
    }
    if (copy.frequency !== 'weekly') copy.weekdays = [];
    return copy;
  }

  function accountName(id) {
    var i;
    for (i = 0; i < ACCOUNTS.length; i++) if (ACCOUNTS[i].id === id) return ACCOUNTS[i].name;
    return id;
  }

  function campaignById(id) {
    var i;
    for (i = 0; i < CAMPAIGNS.length; i++) if (CAMPAIGNS[i].id === id) return CAMPAIGNS[i];
    return null;
  }

  function campaignName(id) {
    var row = campaignById(id);
    return row ? row.name : id;
  }

  function campaignVisible(row) {
    if (!state.cfg) return true;
    var accounts = valuesOf('accounts');
    var assets = valuesOf('assets');
    var products = valuesOf('products');
    var optimizers = valuesOf('optimizers');
    if (accounts.length && accounts.indexOf(row.accountId) < 0) return false;
    if (assets.length && assets.indexOf(row.asset) < 0) return false;
    if (products.length && products.indexOf(row.product) < 0) return false;
    if (optimizers.length && optimizers.indexOf(row.optimizer) < 0) return false;
    return true;
  }

  function pruneCampaigns() {
    var row = filterByField('campaigns');
    if (!row) return;
    row.values = row.values.filter(function (id) {
      var item = campaignById(id);
      return item && campaignVisible(item);
    });
    var box = document.querySelector('[data-kind="filter-values"][data-row="' + row.id + '"]');
    if (box) syncMultiBox(box);
  }

  function findCfgRow(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function opts(list) {
    return list.map(function (item) { return { value: item, label: item }; });
  }

  function multiText(values, labelOf) {
    if (!values || !values.length) return '';
    if (values.length === 1) return labelOf(values[0]);
    return '已选 ' + values.length + ' 项';
  }

  function isNumber(value) {
    return /^-?\d+(\.\d+)?$/.test(String(value == null ? '' : value).trim());
  }

  var FILTER_FIELDS = [
    { key: 'accounts', label: '广告账户' },
    { key: 'campaigns', label: '推广系列' },
    { key: 'assets', label: '资产类型' },
    { key: 'products', label: '产品名称' },
    { key: 'optimizers', label: '优化师' }
  ];

  function valuesOf(field) {
    if (!state.cfg || !state.cfg.filters) return [];
    var i;
    for (i = 0; i < state.cfg.filters.length; i++) {
      if (state.cfg.filters[i].field === field) return state.cfg.filters[i].values || [];
    }
    return [];
  }

  function filterByField(field) {
    if (!state.cfg || !state.cfg.filters) return null;
    var i;
    for (i = 0; i < state.cfg.filters.length; i++) {
      if (state.cfg.filters[i].field === field) return state.cfg.filters[i];
    }
    return null;
  }
  var TIKTOK_ICON = 'assets/TikTok.png';
  var DAILY_MIN = 50;
  var DAILY_MAX = 9999999.99;

  function sanitizeMoney(raw) {
    var text = String(raw == null ? '' : raw).replace(/[^\d.]/g, '');
    var dot = text.indexOf('.');
    if (dot >= 0) text = text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, '').slice(0, 2);
    return text;
  }

  function moneyNumber(value) {
    var text = String(value == null ? '' : value).trim();
    if (text.charAt(text.length - 1) === '.') text = text.slice(0, -1);
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
    var n = Number(text);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }

  function budgetAllowed(row, field, value) {
    var n = moneyNumber(value);
    if (n == null) return false;
    if (row.type !== 'daily') return true;
    var bounded = field === 'cap' || (field === 'amount' && row.mode === 'set');
    if (!bounded) return true;
    var cents = Math.round(n * 100);
    return cents >= Math.round(DAILY_MIN * 100) && cents <= Math.round(DAILY_MAX * 100);
  }

  function isWebhook(value) {
    return /^https?:\/\/\S+$/i.test(String(value || '').trim());
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseYmd(str) {
    var parts = String(str || '').split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function setTriggerLabel(box, text, placeholder, title, prefix) {
    if (!box) return;
    var el = box.querySelector('.select-trigger__text');
    var btn = box.querySelector('.select-trigger');
    if (!el) return;
    prefix = prefix || '';
    if (text) {
      el.innerHTML = prefix + escapeHtml(text);
      if (btn) btn.title = title || text;
      box.classList.add('has-value');
    } else {
      el.innerHTML = prefix + '<span class="muted">' + escapeHtml(placeholder || '请选择') + '</span>';
      if (btn) btn.removeAttribute('title');
      box.classList.remove('has-value');
    }
  }

  function joinedTitle(values, labelOf) {
    return (values || []).map(labelOf).join('、');
  }

  function syncSeg(id, attr, value) {
    var root = $(id);
    if (!root) return;
    root.querySelectorAll('.seg__item').forEach(function (btn) {
      var on = btn.getAttribute(attr) === value;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function syncStatic() {
    var cfg = state.cfg;
    if (!cfg) return;
    setTriggerLabel($('tzBox'), cfg.timezone || 'UTC+0', '请选择');
    setTriggerLabel($('freqBox'), FREQ_LABEL[cfg.frequency] || '', '请选择');
    setTriggerLabel($('weekBox'), multiText(cfg.weekdays, function (v) { return v; }), '请选择星期', cfg.weekdays.join('、'));
    setTriggerLabel($('timeBox'), cfg.time || '09:00:00', '请选择');
    syncSeg('logicSeg', 'data-logic', cfg.logic);
    syncSeg('effectSeg', 'data-effect', cfg.effect);
    $('weekBox').hidden = cfg.frequency !== 'weekly';
    $('timeBox').hidden = cfg.frequency !== 'daily' && cfg.frequency !== 'weekly';
    $('effectDateHost').hidden = cfg.effect !== 'custom';
  }

  function specOf(box) {
    if (!box || !state.cfg) return null;
    var kind = box.getAttribute('data-kind');
    var rowId = box.getAttribute('data-row') || '';
    var cfg = state.cfg;
    if (kind === 'filter-field') {
      var fieldRow = findCfgRow(cfg.filters, rowId);
      return singleSpec(function () { return filterFieldOptions(rowId); }, function () { return fieldRow ? fieldRow.field : ''; }, function (v) {
        if (!fieldRow || fieldRow.field === v) return;
        fieldRow.field = v;
        fieldRow.values = [];
        renderFilters();
        pruneCampaigns();
      });
    }
    if (kind === 'filter-values') {
      var valueRow = findCfgRow(cfg.filters, rowId);
      var valueField = valueRow ? valueRow.field : '';
      var valueSpec = multiSpec(function () { return filterValueOptions(valueField); }, function () { return valueRow ? valueRow.values : []; }, function (arr) {
        if (!valueRow) return;
        valueRow.values = arr;
        if (valueRow.field !== 'campaigns') pruneCampaigns();
      });
      if (valueField === 'accounts' || valueField === 'optimizers' || valueField === 'campaigns') valueSpec.dual = true;
      return valueSpec;
    }
    if (kind === 'timezone') return singleSpec(function () { return opts(TIMEZONES); }, function () { return cfg.timezone; }, function (v) { cfg.timezone = v; });
    if (kind === 'frequency') return singleSpec(function () { return FREQ_ORDER.map(function (key) { return { value: key, label: FREQ_LABEL[key] }; }); }, function () { return cfg.frequency; }, function (v) { cfg.frequency = v; });
    if (kind === 'weekdays') return multiSpec(function () { return opts(WEEKDAYS); }, function () { return cfg.weekdays; }, function (arr) { cfg.weekdays = arr; });
    if (kind === 'time') return { mode: 'time' };
    if (kind === 'metric-period') {
      var periodRow = findCfgRow(cfg.metrics, rowId);
      return singleSpec(function () { return opts(PERIODS); }, function () { return periodRow ? periodRow.period : '今天'; }, function (v) { if (periodRow) periodRow.period = v; });
    }
    if (kind === 'metric') {
      var metricRow = findCfgRow(cfg.metrics, rowId);
      return singleSpec(function () { return opts(METRICS); }, function () { return metricRow ? metricRow.metric : ''; }, function (v) { if (metricRow) metricRow.metric = v; });
    }
    if (kind === 'metric-op') {
      var opRow = findCfgRow(cfg.metrics, rowId);
      return singleSpec(function () { return opts(OPS); }, function () { return opRow ? opRow.op : '大于'; }, function (v) { if (opRow) opRow.op = v; });
    }
    if (kind === 'action-type') {
      var typeAction = findCfgRow(cfg.actions, rowId);
      return singleSpec(function () {
        return ACTION_ORDER.map(function (key) { return { value: key, label: ACTION_LABEL[key] }; });
      }, function () { return typeAction ? typeAction.type : 'feishu'; }, function (v) {
        if (!typeAction || typeAction.type === v) return;
        typeAction.type = v;
        renderActions();
      });
    }
    if (kind === 'receivers') {
      var recv = findCfgRow(cfg.actions, rowId);
      var recvSpec = multiSpec(function () { return opts(OPTIMIZERS); }, function () { return recv ? recv.receivers : []; }, function (arr) { if (recv) recv.receivers = arr; });
      recvSpec.dual = true;
      return recvSpec;
    }
    if (kind === 'action-status') {
      var statusRow = findCfgRow(cfg.actions, rowId);
      return singleSpec(function () { return opts(RUN_STATUS); }, function () { return statusRow ? statusRow.status : ''; }, function (v) { if (statusRow) statusRow.status = v; });
    }
    if (kind === 'budget-mode') {
      var budgetRow = findCfgRow(cfg.actions, rowId);
      return singleSpec(function () {
        return MODE_ORDER.map(function (key) { return { value: key, label: MODE_LABEL[key] }; });
      }, function () { return budgetRow ? budgetRow.mode : 'set'; }, function (v) {
        if (!budgetRow || budgetRow.mode === v) return;
        budgetRow.mode = v;
        renderActions();
      });
    }
    return null;
  }

  function singleSpec(options, get, set) {
    return { mode: 'single', options: options, get: get, set: set };
  }

  function multiSpec(options, getSelected, setSelected) {
    return { mode: 'multi', options: options, getSelected: getSelected, setSelected: setSelected };
  }

  function optionLabel(spec, value) {
    var opt = optionByValue(spec, value);
    return opt ? opt.label : value;
  }

  function optionByValue(spec, value) {
    if (!spec || !spec.options) return null;
    var options = spec.options();
    var i;
    for (i = 0; i < options.length; i++) if (options[i].value === value) return options[i];
    return null;
  }

  function optionMarkHtml(opt) {
    var icon = opt.icon ? '<span class="select-option-icon"><img src="' + escapeHtml(opt.icon) + '" alt="" /></span>' : '';
    var sub = opt.sub ? '<span class="th-opt-sub">' + escapeHtml(opt.sub) + '</span>' : '';
    return icon + '<span title="' + escapeHtml(opt.label) + '">' + escapeHtml(opt.label) + '</span>' + sub;
  }

  function optionMatches(opt, kw) {
    if (!kw) return true;
    var blob = (opt.label + ' ' + (opt.sub || '') + ' ' + (opt.search || '') + ' ' + opt.value).toLowerCase();
    return blob.indexOf(kw) >= 0;
  }

  function triggerHtml(label, placeholder, title, html) {
    var inner = html || (label ? escapeHtml(label) : '<span class="muted">' + escapeHtml(placeholder || '请选择') + '</span>');
    var tip = title || label;
    var titleAttr = tip ? ' title="' + escapeHtml(tip) + '"' : '';
    return '<button class="select-trigger" type="button"' + titleAttr + '><span class="select-trigger__text">' + inner + '</span>' + ARROW + '</button>';
  }

  function selectBox(kind, rowId, cls, label, opts) {
    opts = opts || {};
    var rowAttr = rowId ? ' data-row="' + escapeHtml(rowId) + '"' : '';
    var panel = opts.multi ? '<div class="multi-panel"></div>' : '<div class="single-panel"></div>';
    var clear = opts.multi && opts.clear !== false
      ? '<button class="select-clear" type="button" data-clear="1" aria-label="清除">' + CLOSE_ICON + '</button>'
      : '';
    return '<div class="th-select ' + cls + (label ? ' has-value' : '') + '" data-kind="' + kind + '"' + rowAttr + '>' +
      triggerHtml(label, opts.placeholder, opts.title, opts.html) + clear + panel + '</div>';
  }

  function numBox(field, rowId, value) {
    return '<div class="th-num"><input class="input" data-num="' + field + '" data-row="' + escapeHtml(rowId) +
      '" type="text" inputmode="decimal" placeholder="请输入" value="' + escapeHtml(value || '') + '" autocomplete="off" />' +
      '<span class="th-num__unit">USD</span></div>';
  }

  function thresholdBox(row) {
    return '<div class="th-num th-num--plain">' +
      '<input class="input" data-metric-value="' + escapeHtml(row.id) + '" type="text" inputmode="decimal" placeholder="请输入" value="' +
      escapeHtml(row.value || '') + '" autocomplete="off" />' +
      '</div>';
  }

  function filterFieldOptions(rowId) {
    var used = {};
    state.cfg.filters.forEach(function (row) {
      if (row.id !== rowId && row.field) used[row.field] = true;
    });
    return FILTER_FIELDS.filter(function (item) { return !used[item.key]; }).map(function (item) {
      return { value: item.key, label: item.label };
    });
  }

  function filterValueOptions(field) {
    if (field === 'accounts') {
      return ACCOUNTS.map(function (a) { return { value: a.id, label: a.name, search: a.id }; });
    }
    if (field === 'campaigns') return CAMPAIGNS.filter(campaignVisible).map(function (c) { return { value: c.id, label: c.name }; });
    if (field === 'assets') return opts(ASSETS);
    if (field === 'products') return PRODUCTS.map(function (p) { return { value: p.name, label: p.name, icon: TIKTOK_ICON }; });
    if (field === 'optimizers') return opts(OPTIMIZERS);
    return [];
  }

  function filterValueText(row) {
    if (!row || !row.values.length) return '';
    if (row.values.length === 1) {
      if (row.field === 'accounts') return accountName(row.values[0]);
      if (row.field === 'campaigns') return campaignName(row.values[0]);
      return row.values[0];
    }
    return '已选 ' + row.values.length + ' 项';
  }

  function filterValueHtml(row) {
    if (!row || row.values.length !== 1 || row.field !== 'products') return '';
    return '<span class="select-option-icon"><img src="' + TIKTOK_ICON + '" alt="" /></span>' + escapeHtml(row.values[0]);
  }

  function filterValueTitle(row) {
    return (row.values || []).map(function (value) {
      if (row.field === 'accounts') return accountName(value);
      if (row.field === 'campaigns') return campaignName(value);
      return value;
    }).join('、');
  }

  function fieldLabel(key) {
    var i;
    for (i = 0; i < FILTER_FIELDS.length; i++) if (FILTER_FIELDS[i].key === key) return FILTER_FIELDS[i].label;
    return '';
  }

  function renderFilters() {
    if (!state.cfg) return;
    closeFloating();
    $('filterRows').innerHTML = state.cfg.filters.map(function (row) {
      return '<div class="th-filter-line">' +
        selectBox('filter-field', row.id, 'th-filter-field', fieldLabel(row.field), { placeholder: '请选择' }) +
        '<div class="th-filter-value">' +
          selectBox('filter-values', row.id, '', filterValueText(row), { multi: true, clear: false, placeholder: '请选择', title: filterValueTitle(row), html: filterValueHtml(row) }) +
        '</div>' +
        '<button class="th-icon-btn" type="button" data-remove-filter="' + escapeHtml(row.id) + '" aria-label="删除">' + CLOSE_ICON + '</button>' +
        '</div>';
    }).join('');
    if ($('itemFilters').classList.contains('th-item-error')) markFilters();
  }

  function addFilter() {
    if (!state.cfg) return;
    var used = {};
    state.cfg.filters.forEach(function (row) { if (row.field) used[row.field] = true; });
    var next = '';
    FILTER_FIELDS.forEach(function (item) { if (!next && !used[item.key]) next = item.key; });
    if (!next) {
      UI.showToast('已添加全部筛选项', 'warning');
      return;
    }
    state.cfg.filters.push({ id: UI.uid('f'), field: next, values: [] });
    renderFilters();
  }

  function renderMetrics() {
    if (!state.cfg) return;
    closeFloating();
    $('metricRows').innerHTML = state.cfg.metrics.map(function (row) {
      var remove = state.cfg.metrics.length > 1
        ? '<button class="th-icon-btn" type="button" data-remove-metric="' + escapeHtml(row.id) + '" aria-label="删除">' + CLOSE_ICON + '</button>'
        : '';
      return '<div class="th-row">' +
        selectBox('metric', row.id, 'th-w168', row.metric, { placeholder: '请选择' }) +
        selectBox('metric-period', row.id, 'th-w168', row.period || '今天') +
        selectBox('metric-op', row.id, 'th-w168', row.op || '大于') +
        thresholdBox(row) +
        remove +
        '</div>';
    }).join('');
    if ($('itemMetrics').classList.contains('th-item-error')) markMetrics();
  }

  function actionExtra(row) {
    if (row.type === 'feishu') {
      return selectBox('receivers', row.id, 'th-w168', multiText(row.receivers, function (v) { return v; }), {
        multi: true,
        placeholder: '请选择接收人',
        title: row.receivers.join('、')
      });
    }
    if (row.type === 'bot') {
      var hook = row.webhook || '';
      return '<div class="input-clearable th-webhook' + (hook ? ' has-value' : '') + '">' +
        '<input class="input" data-webhook="' + escapeHtml(row.id) + '" type="text" placeholder="请输入 Webhook 地址" value="' + escapeHtml(hook) + '" autocomplete="off" />' +
        '<button class="select-clear" type="button" data-clear-input="1" aria-label="清除">' + CLOSE_ICON + '</button></div>';
    }
    if (row.type === 'status') {
      return '<span class="th-inline-label">设置为</span>' +
        selectBox('action-status', row.id, 'th-w168', row.status, { placeholder: '请选择' });
    }
    if (row.type === 'daily' || row.type === 'total') {
      var cap = '';
      if (row.mode === 'inc' || row.mode === 'dec') {
        cap = '<span class="th-inline-label">' + (row.mode === 'inc' ? '最高预算' : '最低预算') + '</span>' +
          numBox('cap', row.id, row.cap);
      }
      return selectBox('budget-mode', row.id, 'th-w168', MODE_LABEL[row.mode] || '调整至') +
        numBox('amount', row.id, row.amount) + cap;
    }
    return '';
  }

  function renderActions() {
    if (!state.cfg) return;
    closeFloating();
    $('actionRows').innerHTML = state.cfg.actions.map(function (row) {
      var remove = state.cfg.actions.length > 1
        ? '<button class="th-icon-btn" type="button" data-remove-action="' + escapeHtml(row.id) + '" aria-label="删除">' + CLOSE_ICON + '</button>'
        : '';
      return '<div class="th-row">' +
        selectBox('action-type', row.id, 'th-w168', ACTION_LABEL[row.type] || '飞书消息推送') +
        actionExtra(row) +
        remove +
        '</div>';
    }).join('');
    if ($('itemActions').classList.contains('th-item-error')) markActions();
  }

  function paintCampaign() {
    syncStatic();
    renderFilters();
    renderMetrics();
    renderActions();
    mountEffectDate(state.cfg.effectStart, state.cfg.effectEnd);
    syncStatic();
  }

  var EFFECT_DATE_HTML =
    '<div class="th-date" id="effectDateWrap">' +
      '<button class="date-range-trigger" type="button" id="effectDateTrigger">' +
        '<span class="date-range-trigger__text" id="effectDateLabel"><span class="muted">请选择</span></span>' +
      '</button>' +
      '<div class="date-panel" id="effectDatePanel">' +
        '<div class="date-panel__shortcuts" id="effectDateShortcuts">' +
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
          '<div class="date-cal" id="effectDateCalLeft"></div>' +
          '<div class="date-cal" id="effectDateCalRight"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function mountEffectDate(start, end) {
    var old = $('effectDatePanel');
    if (old) unportal(old);
    $('effectDateHost').innerHTML = EFFECT_DATE_HTML;
    dateApi = UI.bindDateRange({
      wrapId: 'effectDateWrap',
      triggerId: 'effectDateTrigger',
      labelId: 'effectDateLabel',
      panelId: 'effectDatePanel',
      shortcutsId: 'effectDateShortcuts',
      calLeftId: 'effectDateCalLeft',
      calRightId: 'effectDateCalRight',
      prefix: '日期：',
      onChange: function (startDate, endDate) {
        if (!state.cfg) return;
        state.cfg.effectStart = startDate ? ymd(startDate) : '';
        state.cfg.effectEnd = endDate ? ymd(endDate) : '';
        refreshLiveErrors();
      }
    });
    var panel = $('effectDatePanel');
    if (panel && !panel.__thStop) {
      panel.__thStop = true;
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    if (start && end && dateApi) dateApi.setRange(parseYmd(start), parseYmd(end), '', true);
  }

  function unportal(panel) {
    if (!panel) return;
    panel.classList.remove('is-open', 'th-panel-portal');
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.margin = '';
    panel.style.zIndex = '';
    var host = panel.__host;
    if (host && panel.parentElement !== host) host.appendChild(panel);
    var trigger = host && host.querySelector('.select-trigger, .date-range-trigger');
    if (trigger) trigger.classList.remove('is-open');
  }

  function closeFloating() {
    document.querySelectorAll('.th-panel-portal').forEach(unportal);
    var datePanel = $('effectDatePanel');
    if (datePanel && datePanel.classList.contains('is-open')) {
      datePanel.classList.remove('is-open');
      var trig = $('effectDateTrigger');
      if (trig) trig.classList.remove('is-open');
      unportal(datePanel);
    }
  }

  function portal(panel, trigger, opts) {
    opts = opts || {};
    if (!panel.__host) panel.__host = panel.parentElement;
    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    panel.classList.add('th-panel-portal');
    var rect = trigger.getBoundingClientRect();
    panel.classList.remove('is-dropup', 'is-align-right');
    panel.style.position = 'fixed';
    panel.style.margin = '0';
    panel.style.bottom = 'auto';
    panel.style.zIndex = '1200';
    panel.style.right = 'auto';
    if (opts.natural) panel.style.width = 'auto';
    else panel.style.width = (opts.width || rect.width) + 'px';
    placeFloating(panel, trigger);
    requestAnimationFrame(function () {
      if (panel.classList.contains('is-open') && panel.classList.contains('th-panel-portal')) placeFloating(panel, trigger);
    });
  }

  function placeFloating(panel, trigger) {
    var rect = trigger.getBoundingClientRect();
    var pw = panel.offsetWidth || rect.width || 160;
    var ph = panel.offsetHeight || 200;
    var left = rect.left;
    if (left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
    var below = rect.bottom + 4;
    var above = rect.top - ph - 4;
    var top = below;
    if (below + ph > window.innerHeight - 8 && above > 8) top = above;
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
    var value = spec.get();
    var kw = (panel.__kw || '').trim().toLowerCase();
    var visible = spec.options().filter(function (opt) {
      return !kw || String(opt.label).toLowerCase().indexOf(kw) >= 0;
    });
    var html = visible.length ? visible.map(function (opt) {
      return '<button class="single-option' + (opt.value === value ? ' is-active' : '') + '" type="button" data-value="' +
        escapeHtml(opt.value) + '" title="' + escapeHtml(opt.label) + '">' + escapeHtml(opt.label) + '</button>';
    }).join('') : '<div class="single-panel__empty">暂无数据</div>';
    var list = panel.querySelector('.single-panel__list');
    if (list) list.innerHTML = html;
    else panel.innerHTML = html;
  }

  function fillSingle(panel) {
    var spec = specOf(panel.__host);
    var searchable = spec && spec.options().length > 7;
    panel.__kw = '';
    panel.classList.toggle('single-panel--search', !!searchable);
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
    var visible = options.filter(function (opt) { return optionMatches(opt, kw); });
    var list = panel.querySelector('[data-list]');
    var selectedEl = panel.querySelector('[data-selected]');
    var countEl = panel.querySelector('[data-count]');
    if (list) {
      list.innerHTML = visible.length ? visible.map(function (opt) {
        var checked = selected.indexOf(opt.value) >= 0 ? ' checked' : '';
        return '<label class="multi-option"><input type="checkbox" value="' + escapeHtml(opt.value) + '"' + checked +
          ' /><span class="multi-option__label">' + optionMarkHtml(opt) + '</span></label>';
      }).join('') : '<div class="multi-panel__empty">暂无数据</div>';
    }
    if (selectedEl) {
      selectedEl.innerHTML = selected.length ? selected.map(function (value) {
        var opt = optionByValue(spec, value) || { label: optionLabel(spec, value), value: value };
        return '<div class="multi-selected"><span class="multi-selected__name">' + optionMarkHtml(opt) +
          '</span><button class="multi-selected__remove" type="button" data-action="remove" data-value="' +
          escapeHtml(value) + '" aria-label="移除">' + CLOSE_ICON + '</button></div>';
      }).join('') : '<div class="multi-panel__empty">暂无已选</div>';
    }
    if (countEl) countEl.textContent = '已选择 ' + selected.length + ' 项';
  }

  function fillMulti(panel) {
    var spec = specOf(panel.__host);
    var dual = spec && (spec.dual || spec.options().length > 7);
    panel.__kw = '';
    panel.className = 'multi-panel th-panel-portal' + (dual ? '' : ' multi-panel--simple');
    if (panel.classList.contains('is-open')) panel.classList.add('is-open');
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
    var parts = (state.cfg.time || '09:00:00').split(':');
    while (parts.length < 3) parts.push('00');
    panel.innerHTML = ['h', 'm', 's'].map(function (part, idx) {
      var max = part === 'h' ? 24 : 60;
      var html = '<div class="th-time-col" data-part="' + part + '">';
      var i;
      for (i = 0; i < max; i++) {
        var val = pad(i);
        html += '<button type="button" class="th-time-opt' + (val === parts[idx] ? ' is-active' : '') +
          '" data-part="' + part + '" data-value="' + val + '">' + val + '</button>';
      }
      return html + '</div>';
    }).join('');
    requestAnimationFrame(function () {
      panel.querySelectorAll('.th-time-col').forEach(function (col) {
        var active = col.querySelector('.is-active');
        if (!active) return;
        col.scrollTop = Math.max(0, active.offsetTop - col.clientHeight / 2 + active.offsetHeight / 2);
      });
    });
  }

  function panelOf(box) {
    if (!box) return null;
    var inner = box.querySelector('.single-panel, .multi-panel, .th-time-panel');
    if (inner) return inner;
    var nodes = document.querySelectorAll('.single-panel, .multi-panel, .th-time-panel');
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].__host === box) return nodes[i];
    }
    return null;
  }

  function toggleFromTrigger(trigger) {
    var box = trigger.closest('.th-select');
    if (!box) return;
    var panel = panelOf(box);
    var opening = !(panel && panel.classList.contains('is-open'));
    closeFloating();
    UI.closePanels();
    if (!opening) return;
    panel = box.querySelector('.single-panel, .multi-panel, .th-time-panel');
    if (!panel) return;
    bindPanelOnce(panel);
    var spec = specOf(box);
    if (!spec) return;
    if (spec.mode === 'multi') fillMulti(panel);
    else if (spec.mode === 'single') fillSingle(panel);
    else fillTime(panel);
    panel.classList.add('is-open');
    trigger.classList.add('is-open');
    var rect = trigger.getBoundingClientRect();
    var width = 0;
    if (spec.mode === 'time') width = 216;
    else if (spec.mode === 'multi' && (spec.dual || spec.options().length > 7)) width = 480;
    else width = rect.width;
    portal(panel, trigger, { width: width || undefined });
  }

  function afterSpecChange(box) {
    syncStatic();
    var kind = box.getAttribute('data-kind');
    if (kind === 'metric' || kind === 'metric-op' || kind === 'metric-period' || kind === 'action-status') {
      var text = '';
      var spec = specOf(box);
      if (spec && spec.mode === 'single') text = optionLabel(spec, spec.get());
      setTriggerLabel(box, text, kind === 'action-status' ? '请选择' : '请选择');
    }
    refreshLiveErrors();
  }

  function onPanelClick(e) {
    var panel = e.currentTarget;
    e.stopPropagation();
    var timeOpt = e.target.closest('.th-time-opt');
    if (timeOpt) {
      var part = timeOpt.getAttribute('data-part');
      var val = timeOpt.getAttribute('data-value');
      var parts = (state.cfg.time || '09:00:00').split(':');
      while (parts.length < 3) parts.push('00');
      var map = { h: 0, m: 1, s: 2 };
      parts[map[part]] = val;
      state.cfg.time = parts.join(':');
      timeOpt.parentElement.querySelectorAll('.th-time-opt').forEach(function (el) {
        el.classList.toggle('is-active', el === timeOpt);
      });
      setTriggerLabel($('timeBox'), state.cfg.time, '请选择');
      return;
    }
    var single = e.target.closest('.single-option');
    if (single && panel.classList.contains('single-panel')) {
      var spec = specOf(panel.__host);
      if (spec) spec.set(single.getAttribute('data-value') || '');
      var host = panel.__host;
      closeFloating();
      if (host && host.isConnected) afterSpecChange(host);
      else refreshLiveErrors();
      return;
    }
    var actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    var multi = specOf(panel.__host);
    if (!multi) return;
    var action = actionEl.getAttribute('data-action');
    var selected = multi.getSelected().slice();
    if (action === 'clear') selected = [];
    else if (action === 'remove') {
      var removeValue = actionEl.getAttribute('data-value');
      selected = selected.filter(function (v) { return v !== removeValue; });
    } else if (action === 'all') {
      var kw = (panel.__kw || '').trim().toLowerCase();
      multi.options().forEach(function (opt) {
        if (kw && String(opt.label).toLowerCase().indexOf(kw) < 0) return;
        if (selected.indexOf(opt.value) < 0) selected.push(opt.value);
      });
    }
    multi.setSelected(selected);
    paintMultiLists(panel);
    syncMultiBox(panel.__host);
    syncStatic();
    refreshLiveErrors();
  }

  function syncMultiBox(box) {
    var spec = specOf(box);
    if (!spec || spec.mode !== 'multi') return;
    var values = spec.getSelected();
    var text = '';
    if (values.length === 1) text = optionLabel(spec, values[0]);
    else if (values.length > 1) text = '已选 ' + values.length + ' 项';
    var kind = box.getAttribute('data-kind');
    var placeholder = kind === 'weekdays' ? '请选择星期' : (kind === 'receivers' ? '请选择接收人' : '请选择');
    setTriggerLabel(box, text, placeholder, values.map(function (v) { return optionLabel(spec, v); }).join('、'));
    if (kind !== 'filter-values' || values.length !== 1) return;
    var row = findCfgRow(state.cfg.filters, box.getAttribute('data-row'));
    var html = filterValueHtml(row);
    var textEl = box.querySelector('.select-trigger__text');
    if (html && textEl) textEl.innerHTML = html;
  }

  function onPanelInput(e) {
    if (!e.target.classList.contains('js-search')) return;
    var panel = e.currentTarget;
    panel.__kw = e.target.value || '';
    if (panel.classList.contains('multi-panel')) paintMultiLists(panel);
    else paintSingleList(panel);
  }

  function onPanelChange(e) {
    var input = e.target;
    if (!input || input.type !== 'checkbox') return;
    var panel = e.currentTarget;
    var spec = specOf(panel.__host);
    if (!spec) return;
    var selected = spec.getSelected().slice();
    var value = input.value;
    if (input.checked) {
      if (selected.indexOf(value) < 0) selected.push(value);
    } else {
      selected = selected.filter(function (v) { return v !== value; });
    }
    spec.setSelected(selected);
    paintMultiLists(panel);
    syncMultiBox(panel.__host);
    syncStatic();
    refreshLiveErrors();
  }

  function commitInput(input) {
    if (!state.cfg || !input) return;
    if (input.hasAttribute('data-metric-value')) {
      var metric = findCfgRow(state.cfg.metrics, input.getAttribute('data-metric-value'));
      if (metric) metric.value = input.value;
    } else if (input.hasAttribute('data-webhook')) {
      var hookRow = findCfgRow(state.cfg.actions, input.getAttribute('data-webhook'));
      if (hookRow) hookRow.webhook = input.value;
    } else if (input.hasAttribute('data-num')) {
      var numRow = findCfgRow(state.cfg.actions, input.getAttribute('data-row'));
      if (numRow) numRow[input.getAttribute('data-num')] = input.value;
    }
    refreshLiveErrors();
  }

  function clearCfgErrors() {
    ['itemFilters', 'itemMetrics', 'itemActions', 'itemEffect', 'itemFreq'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.classList.remove('th-item-error');
      el.querySelectorAll('.is-error').forEach(function (node) { node.classList.remove('is-error'); });
    });
  }

  function markFilters() {
    var bad = false;
    state.cfg.filters.forEach(function (row) {
      var fieldTrigger = document.querySelector('[data-kind="filter-field"][data-row="' + row.id + '"] .select-trigger');
      var valueTrigger = document.querySelector('[data-kind="filter-values"][data-row="' + row.id + '"] .select-trigger');
      var fieldBad = !row.field;
      var valueBad = !fieldBad && !(row.values && row.values.length);
      if (fieldTrigger) fieldTrigger.classList.toggle('is-error', fieldBad);
      if (valueTrigger) valueTrigger.classList.toggle('is-error', valueBad);
      if (fieldBad || valueBad) bad = true;
    });
    return bad;
  }

  function markMetrics() {
    var bad = !state.cfg.metrics.length;
    state.cfg.metrics.forEach(function (row) {
      var periodTrigger = document.querySelector('[data-kind="metric-period"][data-row="' + row.id + '"] .select-trigger');
      var trigger = document.querySelector('[data-kind="metric"][data-row="' + row.id + '"] .select-trigger');
      var input = document.querySelector('[data-metric-value="' + row.id + '"]');
      var periodBad = PERIODS.indexOf(row.period) < 0;
      var metricBad = !row.metric;
      var valueBad = !isNumber(row.value);
      if (periodTrigger) periodTrigger.classList.toggle('is-error', periodBad);
      if (trigger) trigger.classList.toggle('is-error', metricBad);
      if (input) input.classList.toggle('is-error', valueBad);
      if (periodBad || metricBad || valueBad) bad = true;
    });
    return bad;
  }

  function markActions() {
    var bad = !state.cfg.actions.length;
    state.cfg.actions.forEach(function (row) {
      if (row.type === 'feishu') {
        var recv = document.querySelector('[data-kind="receivers"][data-row="' + row.id + '"] .select-trigger');
        var recvBad = !row.receivers.length;
        if (recv) recv.classList.toggle('is-error', recvBad);
        if (recvBad) bad = true;
      } else if (row.type === 'bot') {
        var hook = document.querySelector('[data-webhook="' + row.id + '"]');
        var hookBad = !isWebhook(row.webhook);
        if (hook) hook.classList.toggle('is-error', hookBad);
        if (hookBad) bad = true;
      } else if (row.type === 'status') {
        var status = document.querySelector('[data-kind="action-status"][data-row="' + row.id + '"] .select-trigger');
        var statusBad = row.status !== '开启' && row.status !== '暂停';
        if (status) status.classList.toggle('is-error', statusBad);
        if (statusBad) bad = true;
      } else if (row.type === 'daily' || row.type === 'total') {
        var amount = document.querySelector('[data-num="amount"][data-row="' + row.id + '"]');
        var amountBad = !budgetAllowed(row, 'amount', row.amount);
        if (amount) amount.classList.toggle('is-error', amountBad);
        if (amountBad) bad = true;
        if (row.mode === 'inc' || row.mode === 'dec') {
          var cap = document.querySelector('[data-num="cap"][data-row="' + row.id + '"]');
          var capBad = !budgetAllowed(row, 'cap', row.cap);
          if (cap) cap.classList.toggle('is-error', capBad);
          if (capBad) bad = true;
        }
      }
    });
    return bad;
  }

  function markEffect() {
    var trigger = $('effectDateTrigger');
    var bad = state.cfg.effect === 'custom' && !(state.cfg.effectStart && state.cfg.effectEnd);
    if (trigger) trigger.classList.toggle('is-error', bad);
    return bad;
  }

  function markFreq() {
    var trigger = $('weekBox') && $('weekBox').querySelector('.select-trigger');
    var bad = state.cfg.frequency === 'weekly' && !state.cfg.weekdays.length;
    if (trigger) trigger.classList.toggle('is-error', bad);
    $('freqError').textContent = '请选择星期';
    return bad;
  }

  function refreshLiveErrors() {
    if (!state.cfg) return;
    if ($('itemFilters').classList.contains('th-item-error') && !markFilters()) $('itemFilters').classList.remove('th-item-error');
    if ($('itemMetrics').classList.contains('th-item-error') && !markMetrics()) $('itemMetrics').classList.remove('th-item-error');
    if ($('itemActions').classList.contains('th-item-error') && !markActions()) $('itemActions').classList.remove('th-item-error');
    if ($('itemEffect').classList.contains('th-item-error') && !markEffect()) $('itemEffect').classList.remove('th-item-error');
    if ($('itemFreq').classList.contains('th-item-error') && !markFreq()) $('itemFreq').classList.remove('th-item-error');
  }

  function validateCfg() {
    document.querySelectorAll('#actionRows [data-num]').forEach(function (input) {
      input.dispatchEvent(new Event('focusout', { bubbles: true }));
    });
    var filterBad = markFilters();
    var metricBad = markMetrics();
    var actionBad = markActions();
    var effectBad = markEffect();
    var freqBad = markFreq();
    $('itemFilters').classList.toggle('th-item-error', filterBad);
    $('itemMetrics').classList.toggle('th-item-error', metricBad);
    $('itemActions').classList.toggle('th-item-error', actionBad);
    $('itemEffect').classList.toggle('th-item-error', effectBad);
    $('itemFreq').classList.toggle('th-item-error', freqBad);
    return !filterBad && !metricBad && !actionBad && !effectBad && !freqBad;
  }

  function clearSelect(box) {
    var spec = specOf(box);
    if (!spec) return;
    closeFloating();
    if (spec.mode === 'multi') spec.setSelected([]);
    else if (spec.set) spec.set('');
    syncStatic();
    refreshLiveErrors();
  }

  function bindCampaign() {
    $('createView').addEventListener('click', function (e) {
      if (!state.cfg && !e.target.closest('#campaignCfg') && !e.target.closest('[data-logic]') && !e.target.closest('[data-effect]')) {
        /* 非推广系列页没有动态行，仍允许基础信息操作 */
      }
      var clearInput = e.target.closest('[data-clear-input]');
      if (clearInput) {
        e.stopPropagation();
        var wrap = clearInput.closest('.input-clearable');
        var input = wrap && wrap.querySelector('input');
        if (input) {
          input.value = '';
          wrap.classList.remove('has-value');
          commitInput(input);
          input.focus();
        }
        return;
      }
      var clearBtn = e.target.closest('.th-select [data-clear]');
      if (clearBtn) {
        e.stopPropagation();
        clearSelect(clearBtn.closest('.th-select'));
        return;
      }
      var trigger = e.target.closest('.th-select .select-trigger');
      if (trigger) {
        e.stopPropagation();
        toggleFromTrigger(trigger);
        return;
      }
      if (e.target.closest('#addFilterBtn')) {
        addFilter();
        return;
      }
      if (e.target.closest('#addMetricBtn')) {
        state.cfg.metrics.push(emptyMetric());
        renderMetrics();
        return;
      }
      if (e.target.closest('#addActionBtn')) {
        state.cfg.actions.push(emptyAction());
        renderActions();
        return;
      }
      var removeFilter = e.target.closest('[data-remove-filter]');
      if (removeFilter) {
        var filterId = removeFilter.getAttribute('data-remove-filter');
        state.cfg.filters = state.cfg.filters.filter(function (row) { return row.id !== filterId; });
        renderFilters();
        pruneCampaigns();
        refreshLiveErrors();
        return;
      }
      var removeMetric = e.target.closest('[data-remove-metric]');
      if (removeMetric) {
        var metricId = removeMetric.getAttribute('data-remove-metric');
        state.cfg.metrics = state.cfg.metrics.filter(function (row) { return row.id !== metricId; });
        if (!state.cfg.metrics.length) state.cfg.metrics.push(emptyMetric());
        renderMetrics();
        refreshLiveErrors();
        return;
      }
      var removeAction = e.target.closest('[data-remove-action]');
      if (removeAction) {
        var actionId = removeAction.getAttribute('data-remove-action');
        state.cfg.actions = state.cfg.actions.filter(function (row) { return row.id !== actionId; });
        if (!state.cfg.actions.length) state.cfg.actions.push(emptyAction());
        renderActions();
        refreshLiveErrors();
        return;
      }
      var logicBtn = e.target.closest('[data-logic]');
      if (logicBtn && state.cfg) {
        state.cfg.logic = logicBtn.getAttribute('data-logic');
        syncSeg('logicSeg', 'data-logic', state.cfg.logic);
        return;
      }
      var effectBtn = e.target.closest('[data-effect]');
      if (effectBtn && state.cfg) {
        state.cfg.effect = effectBtn.getAttribute('data-effect');
        syncSeg('effectSeg', 'data-effect', state.cfg.effect);
        $('effectDateHost').hidden = state.cfg.effect !== 'custom';
        refreshLiveErrors();
      }
    });

    $('createView').addEventListener('input', function (e) {
      var input = e.target;
      if (!input.matches('[data-metric-value], [data-webhook], [data-num]')) return;
      if (input.hasAttribute('data-num')) {
        var next = sanitizeMoney(input.value);
        if (next !== input.value) input.value = next;
      }
      var wrap = input.closest('.input-clearable');
      if (wrap) wrap.classList.toggle('has-value', !!String(input.value || '').trim());
      commitInput(input);
    });

    $('createView').addEventListener('focusout', function (e) {
      var input = e.target;
      if (!input.matches || !input.matches('[data-num]')) return;
      var row = findCfgRow(state.cfg ? state.cfg.actions : [], input.getAttribute('data-row'));
      var field = input.getAttribute('data-num');
      if (!row) return;
      if (!input.value) {
        commitInput(input);
        return;
      }
      var text = String(input.value).trim();
      if (text.charAt(text.length - 1) === '.') text = text.slice(0, -1);
      var parts = text.split('.');
      if (parts.length) parts[0] = String(Number(parts[0] || '0'));
      if (parts[1]) parts[1] = parts[1].replace(/0+$/, '');
      text = parts[1] ? parts[0] + '.' + parts[1] : parts[0];
      input.value = budgetAllowed(row, field, text) ? text : '';
      commitInput(input);
    });

    $('effectDateHost').addEventListener('click', function (e) {
      if (!e.target.closest('#effectDateTrigger')) return;
      setTimeout(function () {
        var panel = $('effectDatePanel');
        var trigger = $('effectDateTrigger');
        if (!panel || !trigger) return;
        if (panel.classList.contains('is-open')) portal(panel, trigger, { natural: true });
        else unportal(panel);
      }, 0);
    }, true);

    $('createBody').addEventListener('scroll', function () {
      closeFloating();
      UI.closePanels();
    });

    document.addEventListener('click', function () {
      closeFloating();
    });
  }

  function bindPage() {
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
    UI.bindInputClearable({ wrapId: 'createNameWrap' });

    $('resetBtn').addEventListener('click', resetQuery);
    $('queryBtn').addEventListener('click', query);
    $('filterName').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') query();
    });
    $('createBtn').addEventListener('click', function () { openCreate('推广系列'); });
    $('createCaret').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCreateMenu();
    });
    $('createMenu').addEventListener('click', function (e) {
      var item = e.target.closest('[data-create]');
      if (!item) return;
      openCreate(item.getAttribute('data-create'));
    });
    document.addEventListener('click', function (e) {
      if (!$('createSplit').contains(e.target)) closeCreateMenu();
    });
    $('createBack').addEventListener('click', closeCreate);
    $('createCancel').addEventListener('click', closeCreate);
    $('createSubmit').addEventListener('click', submitCreate);
    $('createName').addEventListener('input', function () {
      var value = $('createName').value.trim();
      var excludeId = state.form.mode === 'edit' ? state.form.id : '';
      if (!value) return;
      if ($('createNameError').textContent === '请输入托管名称' || !nameTaken(value, excludeId)) setCreateError('');
    });
    $('formClose').addEventListener('click', closeForm);
    $('formCancel').addEventListener('click', closeForm);
    $('formSubmit').addEventListener('click', submitForm);
    $('formName').addEventListener('input', function () {
      if ($('formName').value.trim()) setNameError('');
    });

    $('tableBody').addEventListener('click', function (e) {
      var statusBtn = e.target.closest('[data-status]');
      if (statusBtn) {
        openStatusConfirm(statusBtn.getAttribute('data-status'));
        return;
      }
      var runBtn = e.target.closest('[data-run]');
      var edit = e.target.closest('[data-edit]');
      var dup = e.target.closest('[data-duplicate]');
      var del = e.target.closest('[data-del]');
      if (runBtn) openRun(rowById(runBtn.getAttribute('data-run')));
      else if (edit) {
        var editRow = rowById(edit.getAttribute('data-edit'));
        if (editRow && editRow.target === '推广系列') openCreate(editRow.target, editRow);
        else openForm('edit', '', editRow);
      }
      else if (dup) {
        var source = rowById(dup.getAttribute('data-duplicate'));
        if (!source) return;
        if (source.target === '推广系列') openCreate(source.target, source, true);
        else {
          openForm('add', source.target);
          state.form.name = uniqueCopyName(source.name);
          $('formTitle').textContent = '复制' + source.target + '托管';
          $('formName').value = state.form.name;
          $('formNameWrap').classList.add('has-value');
        }
      }
      else if (del) {
        state.deleteId = del.getAttribute('data-del');
        UI.openModal('confirmModal');
      }
    });

    function openStatusConfirm(id) {
      var row = rowById(id);
      if (!row) return;
      var turningOn = row.status !== '启用';
      state.statusPending = { id: id, next: turningOn ? '启用' : '禁用' };
      $('statusConfirmTitle').textContent = turningOn ? '启用确认' : '禁用确认';
      $('statusConfirmBody').textContent = turningOn ? '确认启用该托管吗？' : '确认禁用该托管吗？';
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
      var row = rowById(pending.id);
      if (row && row.status !== pending.next) {
        pushLog(row, '修改状态：' + row.status + ' → ' + pending.next);
        row.status = pending.next;
      }
      closeStatusConfirm();
      renderTable();
      if (state.logId && row && state.logId === row.id) renderLogDrawer();
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

    $('logDrawerClose').addEventListener('click', closeLog);
    $('runDrawerClose').addEventListener('click', closeRun);
    mountRunDate();
    UI.bindInputClearable({ wrapId: 'runAccountWrap' });
    UI.bindInputClearable({ wrapId: 'runCampaignWrap' });
    $('runAccountInput').addEventListener('input', function () {
      state.runDraft.account = this.value.trim();
    });
    $('runCampaignInput').addEventListener('input', function () {
      state.runDraft.campaign = this.value.trim();
    });
    runResultApi = UI.bindSingleSelect({
      wrapId: 'runResultWrap',
      triggerId: 'runResultTrigger',
      panelId: 'runResultPanel',
      labelId: 'runResultLabel',
      clearId: 'runResultClear',
      prefix: '执行结果：',
      getValue: function () { return state.runDraft.result; },
      onChange: function (value) { state.runDraft.result = value || ''; }
    });
    $('runDateClear').addEventListener('click', function (e) {
      e.stopPropagation();
      clearRunDateDraft();
    });
    $('runFilterReset').addEventListener('click', function () {
      state.runPage = 1;
      resetRunFilters();
      renderRunDrawer();
    });
    $('runFilterQuery').addEventListener('click', applyRunFilters);
    $('runDrawerBody').addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-copy]');
      if (!copyBtn) return;
      UI.copyText(copyBtn.getAttribute('data-copy') || '');
    });
    UI.bindPagination({
      containerId: 'logPagination',
      getPage: function () { return state.logPage; },
      getPageSize: function () { return state.logPageSize; },
      getTotal: function () {
        var row = rowById(state.logId);
        return row && row.logs ? row.logs.length : 0;
      },
      onPageChange: function (page) {
        state.logPage = page;
        renderLogDrawer();
      },
      onPageSizeChange: function (size) {
        state.logPageSize = size;
        state.logPage = 1;
        renderLogDrawer();
      }
    });
    state.logPaginationBound = true;

    UI.bindPagination({
      containerId: 'runPagination',
      getPage: function () { return state.runPage; },
      getPageSize: function () { return state.runPageSize; },
      getTotal: function () { return filteredRuns().length; },
      onPageChange: function (page) {
        state.runPage = page;
        renderRunDrawer();
      },
      onPageSizeChange: function (size) {
        state.runPageSize = size;
        state.runPage = 1;
        renderRunDrawer();
      }
    });

    UI.bindPagination({
      containerId: 'pagination',
      getTotal: function () { return filteredRows().length; },
      getPage: function () { return state.page; },
      getPageSize: function () { return state.pageSize; },
      onPageChange: function (page) { state.page = page; renderTable(); },
      onPageSizeChange: function (size) { state.pageSize = size; state.page = 1; renderTable(); }
    });
    bindCampaign();
  }

  bindPage();
  renderTable();
})();
