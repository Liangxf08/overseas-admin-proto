/* 素材库 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var USERS = Array.from({ length: 10 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var FOLDERS = [
    '企业素材库/短剧/竖版',
    '企业素材库/短剧/横版',
    '企业素材库/投放素材',
    '企业素材库/测试文件夹',
    '企业素材库/品牌素材',
    '企业素材库/竞品参考',
    '企业素材库/海外投放/TT',
    '企业素材库/海外投放/FB'
  ];

  var SIZES = ['1080x1920', '720x1280', '1920x1080', '1280x720', '1080x1080'];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function pick(arr, i) { return arr[i % arr.length]; }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function buildMockRows() {
    var list = [];
    var today = startOfDay(new Date());
    var i;
    for (i = 0; i < 32; i++) {
      var updated = new Date(today);
      updated.setDate(updated.getDate() - (i % 14));
      updated.setHours(9 + (i % 8), (i * 9) % 60, (i * 13) % 60, 0);
      list.push({
        id: 'L' + String(30001 + i),
        name: pick(['品牌片头', '投放竖版', '剧情混剪', '口播成片', '竞品参考'], i) +
          '_' + (2000 + i) + '.mp4',
        folder: pick(FOLDERS, i),
        uploader: pick(USERS, i + 2),
        size: pick(SIZES, i),
        duration: (8 + (i % 36)) + 's',
        updatedAt: formatDateTime(updated),
        updatedDate: formatDateYMD(updated),
        updatedDateObj: updated
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows();

  var state = {
    draft: { folder: '', uploader: '', name: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false
  };

  function bindSearchSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    var list = $(cfg.listId);
    var search = cfg.searchId ? $(cfg.searchId) : null;
    if (!wrap || !trigger || !panel || !label || !list) return null;

    function getValue() { return cfg.getValue ? cfg.getValue() : ''; }

    function syncLabel() {
      var value = getValue();
      var prefix = cfg.prefix || '';
      if (!value) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.innerHTML = prefix + escapeHtml(value);
        wrap.classList.add('has-value');
      }
    }

    function render() {
      var kw = search ? (search.value || '').trim().toLowerCase() : '';
      var options = (cfg.getOptions ? cfg.getOptions() : []) || [];
      var value = getValue();
      list.innerHTML = options.filter(function (opt) {
        return !kw || String(opt).toLowerCase().indexOf(kw) !== -1;
      }).map(function (opt) {
        var active = opt === value ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' +
          escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      }).join('') || '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
        p.classList.remove('is-open');
      });
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
        if (search) {
          search.value = '';
          search.focus();
        }
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      if (cfg.onChange) cfg.onChange(opt.getAttribute('data-value') || '');
      syncLabel();
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
    });

    if (search) {
      search.addEventListener('input', function () { render(); });
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    if (cfg.clearId) {
      var clearBtn = $(cfg.clearId);
      if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (cfg.onChange) cfg.onChange('');
          syncLabel();
          panel.classList.remove('is-open');
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel };
  }

  document.addEventListener('click', function () {
    document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open');
    });
  });

  var dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '更新时间：',
    defaultShortcut: 'last7'
  });

  var folderSelect = bindSearchSelect({
    wrapId: 'folderWrap',
    triggerId: 'folderTrigger',
    panelId: 'folderPanel',
    labelId: 'folderLabel',
    listId: 'folderList',
    searchId: 'folderSearch',
    clearId: 'folderClear',
    prefix: '文件夹：',
    getOptions: function () { return FOLDERS; },
    getValue: function () { return state.draft.folder; },
    onChange: function (v) { state.draft.folder = v; }
  });

  var uploaderSelect = bindSearchSelect({
    wrapId: 'uploaderWrap',
    triggerId: 'uploaderTrigger',
    panelId: 'uploaderPanel',
    labelId: 'uploaderLabel',
    listId: 'uploaderList',
    searchId: 'uploaderSearch',
    clearId: 'uploaderClear',
    prefix: '上传人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.draft.uploader; },
    onChange: function (v) { state.draft.uploader = v; }
  });

  function applyFilters() {
    state.applied = {
      folder: state.draft.folder,
      uploader: state.draft.uploader,
      name: (($('filterName') && $('filterName').value) || '').trim(),
      start: dateApi ? dateApi.getStart() : null,
      end: dateApi ? dateApi.getEnd() : null
    };
    state.page = 1;
    renderTable();
  }

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = row.updatedDate;
    function ymd(x) {
      return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
    }
    return d >= ymd(start) && d <= ymd(end);
  }

  function getFilteredRows() {
    var f = state.applied || {
      folder: '',
      uploader: '',
      name: '',
      start: dateApi ? dateApi.getStart() : null,
      end: dateApi ? dateApi.getEnd() : null
    };
    return ALL_ROWS.filter(function (row) {
      if (f.folder && row.folder !== f.folder) return false;
      if (f.uploader && row.uploader !== f.uploader) return false;
      if (f.name && row.name.toLowerCase().indexOf(f.name.toLowerCase()) === -1) return false;
      if (!inDateRange(row, f.start, f.end)) return false;
      return true;
    });
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
    if (!body) return;

    body.innerHTML = pageRows.map(function (row) {
      return (
        '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td><button class="thumb" type="button" data-preview="' + escapeHtml(row.id) + '" aria-label="预览"></button></td>' +
          '<td>' + escapeHtml(row.name) + '</td>' +
          '<td><span class="folder-path">' + escapeHtml(row.folder) + '</span></td>' +
          '<td>' + escapeHtml(row.uploader) + '</td>' +
          '<td>' + escapeHtml(row.size) + '</td>' +
          '<td>' + escapeHtml(row.duration) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-act="preview">预览</button>' +
            '<button class="link" type="button" data-act="download">下载</button>' +
          '</span></td>' +
        '</tr>'
      );
    }).join('');

    if (empty) empty.hidden = total > 0;

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });

    if (!state.paginationBound && UI.bindPagination) {
      UI.bindPagination({
        containerId: 'pagination',
        getPage: function () { return state.page; },
        getPageSize: function () { return state.pageSize; },
        getTotal: function () { return getFilteredRows().length; },
        onPageChange: function (p) { state.page = p; renderTable(); },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
      state.paginationBound = true;
    }

    if (window.ColResize) window.ColResize.initAll(document);
  }

  var previewPop = $('previewPop');
  var previewName = $('previewName');

  function showPreview(row, anchor) {
    if (!previewPop || !row) return;
    if (previewName) previewName.textContent = row.name;
    previewPop.classList.add('is-open');
    previewPop.setAttribute('aria-hidden', 'false');
    if (anchor) {
      var rect = anchor.getBoundingClientRect();
      var left = Math.min(rect.right + 8, window.innerWidth - 296);
      var top = Math.min(rect.top, window.innerHeight - 220);
      previewPop.style.left = Math.max(8, left) + 'px';
      previewPop.style.top = Math.max(8, top) + 'px';
    }
  }

  function hidePreview() {
    if (!previewPop) return;
    previewPop.classList.remove('is-open');
    previewPop.setAttribute('aria-hidden', 'true');
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  var tableBody = $('tableBody');
  if (tableBody) {
    tableBody.addEventListener('mouseover', function (e) {
      var btn = e.target.closest('[data-preview]');
      if (!btn) return;
      showPreview(findRow(btn.getAttribute('data-preview')), btn);
    });
    tableBody.addEventListener('mouseout', function (e) {
      if (e.target.closest('[data-preview]')) hidePreview();
    });
    tableBody.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var tr = act.closest('tr');
      var row = tr ? findRow(tr.getAttribute('data-id')) : null;
      if (!row) return;
      if (act.getAttribute('data-act') === 'preview') {
        showPreview(row, act);
        UI.showToast('预览：' + row.name);
      } else if (act.getAttribute('data-act') === 'download') {
        UI.showToast('已开始下载：' + row.name);
      }
    });
  }

  $('queryBtn').addEventListener('click', applyFilters);

  $('resetBtn').addEventListener('click', function () {
    state.draft.folder = '';
    state.draft.uploader = '';
    if ($('filterName')) $('filterName').value = '';
    if (dateApi && dateApi.setRange) {
      var end = new Date();
      end.setHours(0, 0, 0, 0);
      var start = new Date(end);
      start.setDate(start.getDate() - 6);
      dateApi.setRange(start, end, 'last7');
    }
    if (folderSelect) folderSelect.syncLabel();
    if (uploaderSelect) uploaderSelect.syncLabel();
    applyFilters();
  });

  $('refreshBtn').addEventListener('click', function () {
    applyFilters();
    UI.showToast('已刷新');
  });

  $('uploadBtn').addEventListener('click', function () {
    UI.showToast('上传功能开发中');
  });

  applyFilters();
})();
