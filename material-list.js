/* 素材列表 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var USERS = Array.from({ length: 12 }, function (_, i) {
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
  var FORMATS = ['mp4', 'mov', 'avi', 'mpeg'];
  var NAME_STEMS = ['竞品竖版', '投放混剪', '片头测试', '口播素材', '剧情切片', '跑酷'];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatDateCompact(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }

  function pick(arr, i) { return arr[i % arr.length]; }

  function stripExt(name) {
    return String(name || '').replace(/\.[^.\/\\]+$/, '');
  }

  function daysBetween(a, b) {
    var ms = startOfDay(b) - startOfDay(a);
    return Math.floor(ms / 86400000);
  }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function buildOssUrl(stem, created, materialId, format, seed) {
    var day = formatDateCompact(created);
    var file = encodeURIComponent(stem) + '_' + seed + '_' + materialId + '.' + format;
    return 'https://static-oss-us.wondergame.net/materials/' + day + '/' + file;
  }

  function buildMockRows() {
    var list = [];
    var today = startOfDay(new Date());
    var i;
    for (i = 0; i < 24; i++) {
      var created = new Date(today);
      if (i < 3) created.setDate(created.getDate() - (32 + i));
      else created.setDate(created.getDate() - (i % 6));
      created.setHours(10 + (i % 8), (i * 7) % 60, (i * 13) % 60, 0);
      var expired = daysBetween(created, today) > 30;
      var format = pick(FORMATS, i);
      var stem = pick(NAME_STEMS, i);
      var name = stem + '_' + (1000 + i) + '_' + pick(USERS, i).replace('用户', 'YH') + '.' + format;
      var materialId = String(140689 - i);
      var seed = String(1786443138597 + i * 97);
      list.push({
        id: 'row-' + materialId,
        materialId: materialId,
        name: name,
        type: '视频',
        format: format,
        creative: pick(USERS, i + 1),
        size: pick(SIZES, i),
        duration: 12 + (i % 40),
        uploadXmp: i % 3 === 0 ? '否' : '是',
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        createdTs: created.getTime(),
        expired: expired,
        ossUrl: buildOssUrl(stem, created, materialId, format, seed)
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows();
  var selectedIds = new Set();

  var state = {
    draft: { creative: '', xmp: '', name: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    /* 默认按创建时间降序，图标未选中；主动点击后才高亮 */
    sortKey: 'createdAt',
    sortDir: 'desc',
    sortActive: false,
    batchDup: true,
    batchFolderMode: '已有文件夹',
    batchTarget: FOLDERS[0],
    batchParent: '',
    batchFolderName: '{创意人}_{YYYYMMDD}'
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
      var html = options.filter(function (opt) {
        return !kw || String(opt).toLowerCase().indexOf(kw) !== -1;
      }).map(function (opt) {
        var active = opt === value ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      }).join('');
      list.innerHTML = html || '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
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
      var value = opt.getAttribute('data-value') || '';
      if (cfg.onChange) cfg.onChange(value);
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
    prefix: '创建时间：',
    defaultShortcut: 'last7'
  });

  bindSearchSelect({
    wrapId: 'creativeWrap',
    triggerId: 'creativeTrigger',
    panelId: 'creativePanel',
    labelId: 'creativeLabel',
    listId: 'creativeList',
    searchId: 'creativeSearch',
    clearId: 'creativeClear',
    prefix: '创意人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.draft.creative; },
    onChange: function (v) { state.draft.creative = v; }
  });

  UI.bindSingleSelect({
    wrapId: 'xmpWrap',
    triggerId: 'xmpTrigger',
    panelId: 'xmpPanel',
    labelId: 'xmpLabel',
    clearId: 'xmpClear',
    prefix: '上传XMP：',
    getValue: function () { return state.draft.xmp; },
    onChange: function (v) { state.draft.xmp = v; }
  });

  function applyFilters() {
    state.applied = {
      creative: state.draft.creative || '',
      xmp: state.draft.xmp || '',
      name: (state.draft.name || '').trim(),
      start: dateApi ? dateApi.getStart() : null,
      end: dateApi ? dateApi.getEnd() : null
    };
    state.page = 1;
    selectedIds.clear();
  }

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = row.createdDate;
    return d >= formatDateYMD(start) && d <= formatDateYMD(end);
  }

  function syncSortIcons() {
    var wrap = $('createdSort');
    if (!wrap) return;
    wrap.classList.remove('is-asc', 'is-desc', 'is-active');
    wrap.querySelectorAll('.th-sort__dir').forEach(function (btn) {
      btn.classList.remove('is-on');
    });
    if (!state.sortActive) return;
    wrap.classList.add('is-active');
    wrap.classList.add(state.sortDir === 'asc' ? 'is-asc' : 'is-desc');
    var onBtn = wrap.querySelector('.th-sort__dir.' + state.sortDir);
    if (onBtn) onBtn.classList.add('is-on');
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = !f ? ALL_ROWS.slice() : ALL_ROWS.filter(function (row) {
      if (f.creative && row.creative !== f.creative) return false;
      if (f.xmp && row.uploadXmp !== f.xmp) return false;
      if (f.name && row.name.indexOf(f.name) === -1) return false;
      if (!inDateRange(row, f.start, f.end)) return false;
      return true;
    });

    rows.sort(function (a, b) {
      var av = a.createdTs || 0;
      var bv = b.createdTs || 0;
      return state.sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }

  function syncBatchBtn() {
    var btn = $('batchBtn');
    if (btn) btn.disabled = selectedIds.size === 0;
  }

  var PLAY_ICON = '<span class="thumb__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z"/></svg></span>';

  function xmpTag(val) {
    var ok = val === '是';
    return '<span class="tag tag--' + (ok ? 'enabled' : 'disabled') + '">' + escapeHtml(val) + '</span>';
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
    var pageIds = pageRows.map(function (r) { return r.id; });
    var allChecked = pageIds.length > 0 && pageIds.every(function (id) { return selectedIds.has(id); });
    var checkAll = $('checkAll');
    if (checkAll) {
      checkAll.checked = allChecked;
      checkAll.indeterminate = !allChecked && pageIds.some(function (id) { return selectedIds.has(id); });
    }

    syncSortIcons();

    if (!pageRows.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      body.innerHTML = pageRows.map(function (row) {
        var checked = selectedIds.has(row.id) ? ' checked' : '';
        var expiredBadge = row.expired ? '<span class="material-cell__badge">已失效</span>' : '';
        var nameNoExt = stripExt(row.name);
        var playIcon = row.type === '视频' ? PLAY_ICON : '';
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td class="col-check"><span class="cell-check"><input type="checkbox" data-check="' + escapeHtml(row.id) + '"' + checked + (row.expired ? ' disabled' : '') + ' aria-label="选择" /></span></td>' +
          '<td class="col-id">' + escapeHtml(row.materialId) + '</td>' +
          '<td class="col-material"><div class="material-cell">' +
            '<button class="thumb' + (row.expired ? ' is-expired' : '') + '" type="button" data-oss="' + escapeHtml(row.ossUrl) + '" data-name="' + escapeHtml(nameNoExt) + '" data-expired="' + (row.expired ? '1' : '0') + '" aria-label="预览并打开OSS"><span class="thumb__preview" aria-hidden="true"></span>' + playIcon + '</button>' +
            '<div class="material-cell__meta">' +
              '<span class="material-cell__name" title="' + escapeHtml(nameNoExt) + '">' + escapeHtml(nameNoExt) + '</span>' +
              expiredBadge +
            '</div>' +
          '</div></td>' +
          '<td>' + escapeHtml(row.type) + '</td>' +
          '<td>' + escapeHtml(row.format) + '</td>' +
          '<td>' + escapeHtml(row.size) + '</td>' +
          '<td class="col-duration">' + escapeHtml(String(row.duration)) + '</td>' +
          '<td>' + escapeHtml(row.creative) + '</td>' +
          '<td>' + xmpTag(row.uploadXmp) + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td class="col-action"><div class="action-links">' +
          '<button class="link" type="button" data-download="' + escapeHtml(row.id) + '"' + (row.expired ? ' disabled' : '') + '>下载</button>' +
          '</div></td></tr>';
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
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }

    syncBatchBtn();
    if (window.ColResize) window.ColResize.initAll(document);
  }

  /* preview */
  var previewPop = $('previewPop');
  var previewName = $('previewName');
  var previewTimer = null;

  function showPreview(btn) {
    if (!previewPop || btn.getAttribute('data-expired') === '1') return;
    previewName.textContent = btn.getAttribute('data-name') || '';
    var rect = btn.getBoundingClientRect();
    var popW = 280;
    var popH = 520;
    var left = rect.right + 12;
    var top = rect.top;
    if (left + popW > window.innerWidth - 16) left = rect.left - popW - 12;
    if (top + popH > window.innerHeight - 16) top = window.innerHeight - popH - 16;
    if (top < 16) top = 16;
    if (left < 16) left = 16;
    previewPop.style.left = left + 'px';
    previewPop.style.top = top + 'px';
    previewPop.classList.add('is-open');
    previewPop.setAttribute('aria-hidden', 'false');
  }

  function hidePreview() {
    if (!previewPop) return;
    previewPop.classList.remove('is-open');
    previewPop.setAttribute('aria-hidden', 'true');
  }

  /* batch xmp form */
  var batchTargetApi = bindSearchSelect({
    wrapId: 'batchTargetWrap',
    triggerId: 'batchTargetTrigger',
    panelId: 'batchTargetPanel',
    labelId: 'batchTargetLabel',
    listId: 'batchTargetList',
    searchId: 'batchTargetSearch',
    clearId: 'batchTargetClear',
    getOptions: function () { return FOLDERS; },
    getValue: function () { return state.batchTarget; },
    onChange: function (v) {
      state.batchTarget = v;
      $('batchTargetItem').classList.remove('is-error');
    }
  });

  var batchParentApi = bindSearchSelect({
    wrapId: 'batchParentWrap',
    triggerId: 'batchParentTrigger',
    panelId: 'batchParentPanel',
    labelId: 'batchParentLabel',
    listId: 'batchParentList',
    searchId: 'batchParentSearch',
    clearId: 'batchParentClear',
    getOptions: function () { return FOLDERS; },
    getValue: function () { return state.batchParent; },
    onChange: function (v) { state.batchParent = v; }
  });

  function syncBatchFolderMode() {
    var create = state.batchFolderMode === '创建文件夹';
    $('batchTargetItem').classList.toggle('is-hidden', create);
    $('batchCreateBlock').classList.toggle('is-hidden', !create);
  }

  UI.bindSeg('batchFolderSeg', function (v) {
    state.batchFolderMode = v;
    syncBatchFolderMode();
  });

  $('batchDupSwitch').addEventListener('click', function () {
    var on = !this.classList.contains('is-on');
    this.classList.toggle('is-on', on);
    this.setAttribute('aria-pressed', on ? 'true' : 'false');
    state.batchDup = on;
  });

  document.querySelectorAll('.meta-tags').forEach(function (wrap) {
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.meta-tag');
      if (!btn || btn.classList.contains('is-used')) return;
      var input = $(wrap.getAttribute('data-target'));
      if (!input) return;
      var token = btn.getAttribute('data-token') || '';
      var repeat = btn.getAttribute('data-repeat') === '1';
      var val = input.value || '';
      if (!repeat && val.indexOf(token) !== -1) return;
      var start = input.selectionStart != null ? input.selectionStart : val.length;
      var end = input.selectionEnd != null ? input.selectionEnd : val.length;
      input.value = val.slice(0, start) + token + val.slice(end);
      input.focus();
      wrap.querySelectorAll('.meta-tag').forEach(function (t) {
        var tk = t.getAttribute('data-token') || '';
        var rp = t.getAttribute('data-repeat') === '1';
        t.classList.toggle('is-used', !rp && input.value.indexOf(tk) !== -1);
      });
    });
  });

  function openXmpModal() {
    state.batchDup = true;
    state.batchFolderMode = '已有文件夹';
    state.batchTarget = FOLDERS[0];
    state.batchParent = '';
    state.batchFolderName = '{创意人}_{YYYYMMDD}';
    UI.setSegValue('batchFolderSeg', '已有文件夹');
    $('batchDupSwitch').classList.add('is-on');
    $('batchFolderNameInput').value = state.batchFolderName;
    $('batchTargetItem').classList.remove('is-error');
    $('batchFolderNameItem').classList.remove('is-error');
    if (batchTargetApi) batchTargetApi.syncLabel();
    if (batchParentApi) batchParentApi.syncLabel();
    syncBatchFolderMode();
    UI.openModal('xmpModal');
  }

  function getSelectedRows() {
    return ALL_ROWS.filter(function (r) { return selectedIds.has(r.id); });
  }

  /* events */
  UI.bindSidebar();

  UI.bindBatchMenu({
    wrapId: 'batchWrap',
    btnId: 'batchBtn',
    menuId: 'batchMenu',
    onAction: function (action) {
      var rows = getSelectedRows().filter(function (r) { return !r.expired; });
      if (!rows.length) {
        UI.showToast('请选择有效素材', 'warning');
        return;
      }
      if (action === 'download') {
        UI.showToast('已开始打包下载 ' + rows.length + ' 个素材', 'success');
      } else if (action === 'xmp') {
        openXmpModal();
      }
    }
  });

  var createdSort = $('createdSort');
  if (createdSort) {
    createdSort.addEventListener('click', function (e) {
      var dirBtn = e.target.closest('[data-sort-dir]');
      if (!dirBtn) return;
      e.stopPropagation();
      var dir = dirBtn.getAttribute('data-sort-dir');
      if (state.sortActive && state.sortDir === dir) {
        /* 同向再点取消选中，仍保持默认降序数据 */
        state.sortActive = false;
        state.sortDir = 'desc';
      } else {
        state.sortActive = true;
        state.sortDir = dir;
      }
      state.page = 1;
      renderTable();
    });
  }

  $('resetBtn').addEventListener('click', function () {
    state.draft.creative = '';
    state.draft.xmp = '';
    state.draft.name = '';
    $('filterName').value = '';
    if (dateApi && dateApi.setRange) {
      var end = new Date();
      end.setHours(0, 0, 0, 0);
      var start = new Date(end);
      start.setDate(start.getDate() - 6);
      dateApi.setRange(start, end, 'last7');
    }
    $('creativeLabel').innerHTML = '创意人：<span class="muted">请选择</span>';
    $('creativeWrap').classList.remove('has-value');
    $('xmpLabel').innerHTML = '上传XMP：<span class="muted">请选择</span>';
    $('xmpWrap').classList.remove('has-value');
    document.querySelectorAll('#xmpPanel .single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === '');
    });
    state.sortActive = false;
    state.sortDir = 'desc';
    applyFilters();
    renderTable();
  });

  $('queryBtn').addEventListener('click', function () {
    state.draft.name = $('filterName').value || '';
    applyFilters();
    renderTable();
  });

  $('checkAll').addEventListener('change', function () {
    var rows = getFilteredRows();
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    var checked = this.checked;
    pageRows.forEach(function (r) {
      if (r.expired) return;
      if (checked) selectedIds.add(r.id);
      else selectedIds.delete(r.id);
    });
    renderTable();
  });

  $('tableBody').addEventListener('change', function (e) {
    var input = e.target.closest('[data-check]');
    if (!input) return;
    var id = input.getAttribute('data-check');
    if (input.checked) selectedIds.add(id);
    else selectedIds.delete(id);
    syncBatchBtn();
    renderTable();
  });

  $('tableBody').addEventListener('click', function (e) {
    var thumb = e.target.closest('[data-oss]');
    if (thumb) {
      if (thumb.getAttribute('data-expired') === '1') {
        UI.showToast('素材已失效，无法打开', 'warning');
        return;
      }
      window.open(thumb.getAttribute('data-oss'), '_blank', 'noopener,noreferrer');
      return;
    }
    var dl = e.target.closest('[data-download]');
    if (dl && !dl.disabled) {
      UI.showToast('已开始下载', 'success');
    }
  });

  $('tableBody').addEventListener('mouseover', function (e) {
    var thumb = e.target.closest('.thumb');
    if (!thumb) return;
    clearTimeout(previewTimer);
    showPreview(thumb);
  });

  $('tableBody').addEventListener('mouseout', function (e) {
    var thumb = e.target.closest('.thumb');
    if (!thumb) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(hidePreview, 80);
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal(btn.getAttribute('data-close'));
    });
  });

  $('xmpSubmit').addEventListener('click', function () {
    if (state.batchFolderMode === '已有文件夹' && !state.batchTarget) {
      $('batchTargetItem').classList.add('is-error');
      return;
    }
    if (state.batchFolderMode === '创建文件夹') {
      var name = ($('batchFolderNameInput').value || '').trim();
      if (!name) {
        $('batchFolderNameItem').classList.add('is-error');
        return;
      }
    }
    var count = getSelectedRows().filter(function (r) { return !r.expired; }).length;
    getSelectedRows().forEach(function (r) {
      if (!r.expired) r.uploadXmp = '是';
    });
    UI.closeModal('xmpModal');
    UI.showToast('已提交 ' + count + ' 个素材上传 XMP', 'success');
    selectedIds.clear();
    renderTable();
  });

  applyFilters();
  renderTable();
})();
