/* 下载任务 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.DownloadTaskStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  function emptyDraft() {
    return { type: '', status: '', creator: '', start: null, end: null };
  }

  var state = {
    draft: emptyDraft(),
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    retryId: null,
    cancelId: null
  };

  function last7() {
    var end = new Date();
    end.setHours(0, 0, 0, 0);
    var start = new Date(end);
    start.setDate(start.getDate() - 6);
    return [start, end];
  }

  var dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '创建时间：',
    defaultShortcut: 'last7',
    onChange: function (start, end) {
      state.draft.start = start;
      state.draft.end = end;
    }
  });

  if (dateApi) {
    state.draft.start = dateApi.getStart();
    state.draft.end = dateApi.getEnd();
  }

  var typeApi = UI.bindSingleSelect({
    wrapId: 'typeWrap',
    triggerId: 'typeTrigger',
    panelId: 'typePanel',
    labelId: 'typeLabel',
    clearId: 'typeClear',
    prefix: '任务类型：',
    getValue: function () { return state.draft.type; },
    onChange: function (v) { state.draft.type = v; }
  });

  var statusApi = UI.bindSingleSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    clearId: 'statusClear',
    prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v; }
  });

  var creatorApi = UI.bindSingleSelect({
    wrapId: 'creatorWrap',
    triggerId: 'creatorTrigger',
    panelId: 'creatorPanel',
    labelId: 'creatorLabel',
    clearId: 'creatorClear',
    prefix: '创建人：',
    getValue: function () { return state.draft.creator; },
    onChange: function (v) { state.draft.creator = v; }
  });

  function applyFilters() {
    var start = dateApi ? dateApi.getStart() : state.draft.start;
    var end = dateApi ? dateApi.getEnd() : state.draft.end;
    state.draft.start = start;
    state.draft.end = end;
    state.applied = {
      type: state.draft.type || '',
      status: state.draft.status || '',
      creator: state.draft.creator || '',
      start: start,
      end: end
    };
    state.page = 1;
  }

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = row.createdDate;
    var s = Store.formatDateYMD(start);
    var e = Store.formatDateYMD(end);
    return d >= s && d <= e;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = Store.list();
    if (!f) return rows;
    return rows.filter(function (row) {
      if (f.type && row.type !== f.type) return false;
      if (f.status && row.status !== f.status) return false;
      if (f.creator && row.creator !== f.creator) return false;
      if (!inDateRange(row, f.start, f.end)) return false;
      return true;
    });
  }

  function actionHtml(row) {
    var canDownload = row.status === '已完成';
    var canCancel = row.status === '待开始' || row.status === '进行中';
    var canRetry = row.status === '已失败' || row.status === '已取消';
    return '<div class="action-links">' +
      '<button class="link"' + (canDownload ? '' : ' disabled') + ' type="button" data-act="download" data-id="' + escapeHtml(row.id) + '">下载</button>' +
      '<button class="link"' + (canCancel ? '' : ' disabled') + ' type="button" data-act="cancel" data-id="' + escapeHtml(row.id) + '">取消</button>' +
      '<button class="link"' + (canRetry ? '' : ' disabled') + ' type="button" data-act="retry" data-id="' + escapeHtml(row.id) + '">重试</button>' +
      '</div>';
  }

  function renderTable() {
    var rows = getFilteredRows();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    var body = $('tableBody');
    var empty = $('emptyTip');
    if (!pageRows.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      body.innerHTML = pageRows.map(function (row) {
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td class="col-id">' + escapeHtml(row.id) + '</td>' +
          '<td><span class="name-cell" title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</span></td>' +
          '<td>' + escapeHtml(row.type) + '</td>' +
          '<td>' + UI.taskStatusDot(row.status) + '</td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt || row.createdAt) + '</td>' +
          '<td class="col-action">' + actionHtml(row) + '</td>' +
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
        getState: function () {
          return { page: state.page, pageSize: state.pageSize, total: getFilteredRows().length };
        },
        setPage: function (p) { state.page = p; renderTable(); },
        setPageSize: function (s) { state.pageSize = s; state.page = 1; renderTable(); }
      });
    }

    if (window.ColResize) window.ColResize.initAll(document);
  }

  function triggerDownload(row) {
    var name = row.fileName || (row.name + (row.type === '素材打包' ? '.zip' : '.csv'));
    var isZip = /\.zip$/i.test(name);
    var content = isZip
      ? 'PK\x03\x04 prototype zip: ' + name
      : '\ufeff任务名称,' + (row.name || '') + '\n来源,' + (row.source || '') + '\n文件,' + name + '\n';
    if (UI.downloadText) {
      UI.downloadText(name, content, isZip ? 'application/zip' : 'text/csv;charset=utf-8');
    }
    UI.showToast('开始下载', 'success');
  }

  function tickInProgress() {
    var rows = Store.list();
    var changed = false;
    rows.forEach(function (row) {
      if (row.status !== '进行中' || !row.autoProgress) return;
      var next = Math.min(100, (row.progress || 0) + 14 + Math.round(Math.random() * 18));
      if (next >= 100) {
        Store.update(row.id, { status: '已完成', progress: 100, failReason: '' });
      } else {
        Store.update(row.id, { progress: next });
      }
      changed = true;
    });
    if (changed) renderTable();
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('resetBtn').addEventListener('click', function () {
    state.draft = emptyDraft();
    var range = last7();
    if (dateApi) dateApi.setRange(range[0], range[1], 'last7');
    state.draft.start = dateApi ? dateApi.getStart() : range[0];
    state.draft.end = dateApi ? dateApi.getEnd() : range[1];
    if (typeApi && typeApi.syncLabel) typeApi.syncLabel('');
    if (statusApi && statusApi.syncLabel) statusApi.syncLabel('');
    if (creatorApi && creatorApi.syncLabel) creatorApi.syncLabel('');
    applyFilters();
    renderTable();
  });

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    var id = btn.getAttribute('data-id');
    var row = Store.find(id);
    if (!row) return;
    var act = btn.getAttribute('data-act');
    if (act === 'download') {
      triggerDownload(row);
      return;
    }
    if (act === 'retry') {
      state.retryId = id;
      UI.openModal('retryModal');
      return;
    }
    if (act === 'cancel') {
      state.cancelId = id;
      UI.openModal('cancelModal');
    }
  });

  document.querySelectorAll('[data-close="retryModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.retryId = null;
      UI.closeModal('retryModal');
    });
  });
  document.querySelectorAll('[data-close="cancelModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.cancelId = null;
      UI.closeModal('cancelModal');
    });
  });

  $('retryOk').addEventListener('click', function () {
    var id = state.retryId;
    state.retryId = null;
    UI.closeModal('retryModal');
    if (!id) return;
    Store.update(id, { status: '进行中', progress: 0, failReason: '', autoProgress: true });
    renderTable();
    UI.showToast('已重新执行', 'success');
  });

  $('cancelOk').addEventListener('click', function () {
    var id = state.cancelId;
    state.cancelId = null;
    UI.closeModal('cancelModal');
    if (!id) return;
    Store.update(id, { status: '已取消', autoProgress: false });
    renderTable();
    UI.showToast('任务已取消', 'success');
  });

  window.addEventListener('storage', function (e) {
    if (e.key !== Store.KEY) return;
    renderTable();
  });

  applyFilters();
  renderTable();
  setInterval(tickInProgress, 900);
})();
