/* TikTok 交易
 * 列表金额含合计行。示例数据覆盖 2026-01-01 至今（对应后台：每日 10:00 拉取近 7 天）。
 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  window.ProductShell.mount('tiktok-transactions');

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var COPY_ICON = UI.COPY_ICON;

  var TXN_TYPES = [
    { code: 'BILL_PAYMENT', label: '账单支付' },
    { code: 'ADD_BALANCE', label: '充值' },
    { code: 'CANCELLATION', label: '取消' },
    { code: 'PROMOTION_ISSUED', label: '广告赠款发放' },
    { code: 'PROMOTION_EXPIRED', label: '广告赠款过期' },
    { code: 'INCREASE_BALANCE', label: '增加余额' },
    { code: 'DECREASE_BALANCE', label: '扣减余额' },
    { code: 'CARD_VERIFICATION', label: '银行卡验证' },
    { code: 'CARD_VERIFICATION_REFUND', label: '银行卡验证扣费退款' },
    { code: 'ORDER_CREATION_PAYMENT', label: '订单创建支付' },
    { code: 'ORDER_EDIT_PAYMENT', label: '订单修改支付' },
    { code: 'RETURN_OF_REMAINING_BUDGET', label: '剩余预算返还' },
    { code: 'REFUND', label: '退款' }
  ];
  var TYPE_LABELS = TXN_TYPES.map(function (t) { return t.label; });
  var TYPE_BY_LABEL = {};
  TXN_TYPES.forEach(function (t) { TYPE_BY_LABEL[t.label] = t; });

  var BILLING = {
    CASH: { code: 'CASH', label: '现金' },
    CREDIT: { code: 'CREDIT', label: '广告赠款' }
  };

  var ACCOUNTS = [
    { name: 'Help Wukong_TT_FS_minigame_01', id: '7663327640459837448', tz: 'UTC+00:00' },
    { name: 'TMF_TT_FS_minigame_01', id: '6934938043514093569', tz: 'UTC+08:00' },
    { name: 'CPT_TT_TD_minigame_01', id: '7595920415051202561', tz: 'UTC+08:00' },
    { name: 'CWSM_TT_BV_minigame_01', id: '7450123987654321098', tz: 'UTC+00:00' },
    { name: 'TMJ_TT_US_drama_01', id: '7310987654321098765', tz: 'UTC+00:00' }
  ];

  var CREDIT_TYPES = {
    '广告赠款发放': 1,
    '广告赠款过期': 1,
    '增加余额': 1
  };

  /* 过期 / 扣减类记支出，金额为负 */
  var NEGATIVE_TYPES = {
    '广告赠款过期': 1,
    '扣减余额': 1
  };

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatDateTime(d) {
    return formatYMD(d) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function addDays(d, n) {
    var x = startOfDay(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function last7() {
    var end = startOfDay(new Date());
    return [addDays(end, -6), end];
  }

  function num(v) {
    var n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function formatNum(v) {
    return num(v).toFixed(2);
  }

  function amountClass(v) {
    return num(v) < 0 ? 'col-num is-negative' : 'col-num';
  }

  function signedAmount(typeLabel, amount) {
    var n = Math.abs(num(amount));
    return NEGATIVE_TYPES[typeLabel] ? -n : n;
  }

  function billingOf(typeLabel) {
    return CREDIT_TYPES[typeLabel] ? BILLING.CREDIT : BILLING.CASH;
  }

  function makeRow(account, typeLabel, amount, createTime) {
    var type = TYPE_BY_LABEL[typeLabel] || TXN_TYPES[0];
    var billing = billingOf(typeLabel);
    return {
      account_name: account.name,
      account_id: account.id,
      transaction_type: type.code,
      transaction_type_label: type.label,
      amount: Number(signedAmount(typeLabel, amount).toFixed(2)),
      billing_type: billing.code,
      billing_type_label: billing.label,
      create_time: createTime,
      timezone: account.tz
    };
  }

  /* 截图表数据 + 2026-01-01 至今补齐，近 7 天更密，保证默认筛选有内容 */
  function buildList() {
    var rows = [];
    var wukong = ACCOUNTS[0];
    var shot = [
      ['2026-09-15 09:36:00', '广告赠款发放', 55.94],
      ['2026-09-14 01:25:00', '增加余额', 5000],
      ['2026-09-14 01:09:00', '增加余额', 5000],
      ['2026-09-13 18:29:00', '广告赠款发放', 10.12],
      ['2026-09-11 02:44:00', '增加余额', 5000],
      ['2026-09-10 06:10:00', '广告赠款发放', 45],
      ['2026-09-09 18:04:00', '广告赠款发放', 35.99],
      ['2026-09-09 10:45:00', '广告赠款发放', 9.72],
      ['2026-09-08 15:58:00', '广告赠款发放', 11.39],
      ['2026-09-08 07:45:00', '增加余额', 2000],
      ['2026-09-07 02:41:00', '广告赠款发放', 30.81],
      ['2026-09-07 01:18:00', '增加余额', 5000],
      ['2026-09-03 08:16:00', '增加余额', 2000],
      ['2026-09-02 07:11:00', '增加余额', 2000]
    ];
    shot.forEach(function (item) {
      rows.push(makeRow(wukong, item[1], item[2], item[0]));
    });
    rows.push(makeRow(wukong, '扣减余额', 7633.39, '2026-09-19 08:26:28'));
    rows.push(makeRow(wukong, '广告赠款过期', 200, '2026-09-16 04:54:00'));
    rows.push(makeRow(ACCOUNTS[1], '账单支付', 15.03, '2026-07-31 06:02:15'));

    var today = startOfDay(new Date());
    var typeCycle = [
      '广告赠款发放', '增加余额', '充值', '账单支付', '扣减余额',
      '广告赠款过期', '订单创建支付', '退款', '剩余预算返还', '取消',
      '银行卡验证', '银行卡验证扣费退款', '订单修改支付'
    ];
    var amountCycle = [55.94, 5000, 1000, 15.03, 128.5, 200, 36.8, 80, 12.6, 9.72, 0.01, 0.01, 22.4];
    var i;
    for (i = 0; i < 42; i += 1) {
      var day = addDays(today, -(i % 7));
      day.setHours(8 + (i % 12), (i * 7) % 60, (i * 13) % 60, 0);
      var acc = ACCOUNTS[i % ACCOUNTS.length];
      var typeLabel = typeCycle[i % typeCycle.length];
      var amount = amountCycle[i % amountCycle.length];
      if (typeLabel === '增加余额') amount = i % 2 === 0 ? 5000 : 2000;
      if (typeLabel === '充值') amount = 1000 + (i % 5) * 500;
      rows.push(makeRow(acc, typeLabel, amount, formatDateTime(day)));
    }
    for (i = 0; i < 48; i += 1) {
      var hist = addDays(today, -8 - i * 5);
      if (hist < new Date(2026, 0, 1)) break;
      hist.setHours(2 + (i % 20), (i * 11) % 60, (i * 17) % 60, 0);
      rows.push(makeRow(
        ACCOUNTS[(i + 1) % ACCOUNTS.length],
        typeCycle[i % typeCycle.length],
        amountCycle[i % amountCycle.length],
        formatDateTime(hist)
      ));
    }
    return rows;
  }

  var ALL_ROWS = buildList();

  var state = {
    draftKeyword: '',
    draftTypes: [],
    appliedKeyword: '',
    appliedTypes: [],
    appliedStart: null,
    appliedEnd: null,
    page: 1,
    pageSize: 20,
    sortState: { specs: [{ key: 'create_time', dir: 'desc' }], key: 'create_time', dir: 'desc' }
  };

  var dateApi = null;
  var typeMulti = null;
  var keywordClear = null;

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = String(row.create_time || '').slice(0, 10);
    return d >= formatYMD(start) && d <= formatYMD(end);
  }

  function getFilteredRows() {
    var kw = (state.appliedKeyword || '').trim().toLowerCase();
    var types = state.appliedTypes || [];
    return ALL_ROWS.filter(function (row) {
      if (!inDateRange(row, state.appliedStart, state.appliedEnd)) return false;
      if (kw) {
        var hitName = String(row.account_name).toLowerCase().indexOf(kw) !== -1;
        var hitId = String(row.account_id).toLowerCase().indexOf(kw) !== -1;
        if (!hitName && !hitId) return false;
      }
      if (types.length && types.indexOf(row.transaction_type_label) === -1) return false;
      return true;
    });
  }

  function applySort(rows) {
    var specs = UI.resolveSortSpecs(state.sortState);
    if (!specs.length) return rows.slice();
    return UI.sortRowsBySpecs(rows, specs, function (a, b, key) {
      if (key === 'amount') return num(a.amount) - num(b.amount);
      return String(a[key] || '').localeCompare(String(b[key] || ''), 'zh');
    });
  }

  function applyFilters() {
    state.draftKeyword = ($('accountKeyword').value || '').trim();
    state.appliedKeyword = state.draftKeyword;
    state.appliedTypes = (state.draftTypes || []).slice();
    state.appliedStart = dateApi ? dateApi.getStart() : state.appliedStart;
    state.appliedEnd = dateApi ? dateApi.getEnd() : state.appliedEnd;
    state.page = 1;
  }

  function renderTable() {
    var body = $('txnBody');
    var foot = $('txnFoot');
    var empty = $('emptyTip');
    var sorted = applySort(getFilteredRows());
    var total = sorted.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var rows = sorted.slice(start, start + state.pageSize);
    var sum = sorted.reduce(function (acc, row) { return acc + num(row.amount); }, 0);

    if (!total) {
      body.innerHTML = '';
      foot.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      body.innerHTML = rows.map(function (row) {
        return '<tr>' +
          '<td title="' + escapeHtml(row.account_name) + '">' + escapeHtml(row.account_name) + '</td>' +
          '<td>' +
            '<span class="cell-id">' +
              '<button class="copy-btn" type="button" data-copy="' + escapeHtml(row.account_id) + '" title="复制账户ID">' + COPY_ICON + '</button>' +
              '<span class="cell-id__text" title="' + escapeHtml(row.account_id) + '">' + escapeHtml(row.account_id) + '</span>' +
            '</span>' +
          '</td>' +
          '<td title="' + escapeHtml(row.transaction_type_label) + '">' + escapeHtml(row.transaction_type_label) + '</td>' +
          '<td class="' + amountClass(row.amount) + '">' + formatNum(row.amount) + '</td>' +
          '<td>' + escapeHtml(row.billing_type_label) + '</td>' +
          '<td title="' + escapeHtml(row.create_time) + '">' + escapeHtml(row.create_time) + '</td>' +
          '<td>' + escapeHtml(row.timezone) + '</td>' +
        '</tr>';
      }).join('');
      foot.innerHTML =
        '<tr class="summary-row">' +
          '<td>合计</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
          '<td class="' + amountClass(sum) + '">' + formatNum(sum) + '</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
          '<td>-</td>' +
        '</tr>';
    }

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });
    if (window.ColResize) window.ColResize.initAll(document);
  }

  function csvCell(v) {
    var s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCsv() {
    var rows = applySort(getFilteredRows());
    if (!rows.length) {
      UI.showToast('暂无数据可导出', 'error');
      return;
    }
    var header = ['账户名称', '账户ID', '交易类型', '金额', '账单类型', '交易时间', '交易时区'];
    var lines = [header.map(csvCell).join(',')].concat(rows.map(function (row) {
      return [
        row.account_name,
        row.account_id,
        row.transaction_type_label,
        formatNum(row.amount),
        row.billing_type_label,
        row.create_time,
        row.timezone
      ].map(csvCell).join(',');
    }));
    var name = 'TikTok交易导出.csv';
    if (UI.downloadText) {
      UI.downloadText(name, '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
    }
    UI.showToast('导出成功');
  }

  function resetFilters() {
    $('accountKeyword').value = '';
    if (keywordClear && keywordClear.sync) keywordClear.sync();
    state.draftTypes = [];
    if (typeMulti && typeMulti.render) typeMulti.render();
    var range = last7();
    if (dateApi) dateApi.setRange(range[0], range[1], 'last7', true);
    applyFilters();
    renderTable();
  }

  dateApi = UI.bindDateRange({
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

  typeMulti = UI.bindMultiSelect({
    wrapId: 'typeWrap',
    triggerId: 'typeTrigger',
    panelId: 'typePanel',
    listId: 'typeList',
    selectedId: 'typeSelected',
    countId: 'typeCount',
    labelId: 'typeLabel',
    searchId: 'typeSearch',
    selectAllId: 'typeSelectAll',
    clearId: 'typeClear',
    prefix: '交易类型：',
    getOptions: function () { return TYPE_LABELS; },
    getSelected: function () { return state.draftTypes; },
    setSelected: function (v) { state.draftTypes = v; }
  });

  keywordClear = UI.bindInputClearable({
    wrapId: 'accountKeywordWrap',
    clearId: 'accountKeywordClear'
  });

  UI.bindPagination({
    containerId: 'pagination',
    getTotal: function () { return getFilteredRows().length; },
    getPage: function () { return state.page; },
    getPageSize: function () { return state.pageSize; },
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

  UI.bindThSort({
    root: '#txnTable',
    defaultDir: 'desc',
    getState: function () { return state.sortState; },
    setState: function (next) { state.sortState = next; },
    onChange: function () {
      state.page = 1;
      renderTable();
    }
  });

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });
  $('resetBtn').addEventListener('click', resetFilters);
  $('exportBtn').addEventListener('click', exportCsv);
  $('accountKeyword').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      applyFilters();
      renderTable();
    }
  });
  $('txnBody').addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-copy]');
    if (!copyBtn) return;
    UI.copyText(copyBtn.getAttribute('data-copy') || '');
  });

  applyFilters();
  renderTable();
})();
