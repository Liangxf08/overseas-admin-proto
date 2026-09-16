/* 试玩广告 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var PRODUCTS = Store.PRODUCTS || [];

  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png'
  };

  var ALL_ROWS = [
    { id: '100001', productId: 'ywvt69aoqfdgyti2', url: 'https://playable.example.com/hotpot-match-3d', status: '启用', updatedAt: '2026-09-12 14:20:08' },
    { id: '100002', productId: 'yw1abauttjsdlfid', url: 'https://playable.example.com/pixel-bounce-jam', status: '启用', updatedAt: '2026-09-10 11:06:41' },
    { id: '100003', productId: 'ywdazzlejewel001a', url: 'https://playable.example.com/dazzle-jewel', status: '启用', updatedAt: '2026-09-08 16:42:19' },
    { id: '100004', productId: 'ywbrainsortcard02', url: 'https://playable.example.com/brain-sort-card', status: '禁用', updatedAt: '2026-09-03 09:18:55' },
    { id: '100005', productId: 'ywtilesort3d0003x', url: 'https://playable.example.com/tile-sort-3d', status: '启用', updatedAt: '2026-08-28 19:03:12' },
    { id: '100006', productId: 'ywcaptainwave08xx', url: 'https://playable.example.com/captain-wave', status: '禁用', updatedAt: '2026-08-21 10:27:33' }
  ];

  var state = {
    draft: { product: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editProductId: '',
    editStatus: '启用'
  };

  function applyFilters() {
    state.applied = {
      product: (state.draft.product || '').trim(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice();
    if (!f) return rows;
    return rows.filter(function (row) {
      var product = Store.productById(row.productId);
      var name = product ? product.name : '';
      if (f.product && name.indexOf(f.product) === -1 && row.productId.indexOf(f.product) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
  }

  function pad6(n) {
    var s = String(n);
    while (s.length < 6) s = '0' + s;
    return s.slice(-6);
  }

  function nextId() {
    var max = 100000;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(r.id, 10);
      if (isFinite(n) && n > max) max = n;
    });
    return pad6(max + 1);
  }

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    clearId: 'statusClear',
    prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  function productOptionLabel(productId) {
    var p = Store.productById(productId);
    return p ? p.name : productId;
  }

  function productOptionIconHtml(productId) {
    var p = Store.productById(productId);
    var platform = p && p.platform;
    var src = platform && PLATFORM_ICONS[platform];
    if (!src) return '';
    return '<span class="select-option-icon"><img src="' + src + '" alt="" /></span>';
  }

  function syncEditProductLabel(value) {
    var label = $('editProductLabel');
    var wrap = $('editProductWrap');
    var panel = $('editProductPanel');
    if (!label) return;
    if (!value) {
      label.innerHTML = '<span class="muted">请选择</span>';
      if (wrap) wrap.classList.remove('has-value');
    } else {
      label.innerHTML = productOptionIconHtml(value) +
        '<span class="select-option-text">' + escapeHtml(productOptionLabel(value)) + '</span>';
      if (wrap) wrap.classList.add('has-value');
    }
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }
  }

  function fillProductPanel() {
    var panel = $('editProductPanel');
    if (!panel) return;
    panel.innerHTML = PRODUCTS.map(function (p) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(p.id) + '">' +
        productOptionIconHtml(p.id) +
        '<span class="select-option-text">' + escapeHtml(p.name) + '</span>' +
      '</button>';
    }).join('');
  }

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap',
    triggerId: 'editProductTrigger',
    panelId: 'editProductPanel',
    labelId: 'editProductLabel',
    getValue: function () { return state.editProductId; },
    onChange: function (v) {
      state.editProductId = v || '';
      setItemError('editProductItem', false);
    }
  });
  if (editProductSelect) {
    editProductSelect.syncLabel = function (v) {
      var val = (v !== undefined && v !== null) ? v : (state.editProductId || '');
      syncEditProductLabel(val);
    };
    editProductSelect.syncLabel(state.editProductId);
  }

  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
  });

  var filterProductClear = UI.bindInputClearable({
    wrapId: 'filterProductWrap',
    clearId: 'filterProductClear',
    onClear: function () { state.draft.product = ''; }
  });
  var editUrlClear = UI.bindInputClearable({
    wrapId: 'editUrlWrap',
    clearId: 'editUrlClear',
    onClear: function () { setItemError('editUrlItem', false); }
  });

  $('filterProduct').addEventListener('input', function () {
    state.draft.product = this.value || '';
  });
  $('filterProduct').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      renderTable();
    }
  });

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
    ['editProductItem', 'editUrlItem'].forEach(function (id) {
      setItemError(id, false);
    });
  }

  function productName(id) {
    return Store.productName ? Store.productName(id) : ((Store.productById(id) || {}).name || id);
  }

  function productPlatform(id) {
    var p = Store.productById(id);
    return (p && p.platform) ? p.platform : '-';
  }

  function renderTable() {
    if (!state.applied) applyFilters();
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
        var name = productName(row.productId);
        var platform = productPlatform(row.productId);
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td>' + escapeHtml(row.id) + '</td>' +
          '<td title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</td>' +
          '<td>' + escapeHtml(platform) + '</td>' +
          '<td title="' + escapeHtml(row.url) + '">' +
            '<a class="playable-link" href="' + escapeHtml(row.url) + '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml(row.url) +
            '</a>' +
          '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td title="' + escapeHtml(row.updatedAt) + '">' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
          '</span></td>' +
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
    }
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editProductId = '';
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加试玩广告';
    $('editUrl').value = '';
    UI.setSegValue('editStatusSeg', '启用');
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel('');
    if (editUrlClear) editUrlClear.sync();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editProductId = row.productId;
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑试玩广告';
    $('editUrl').value = row.url || '';
    UI.setSegValue('editStatusSeg', state.editStatus);
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel(state.editProductId);
    if (editUrlClear) editUrlClear.sync();
    UI.openModal('editModal');
  }

  function isValidUrl(value) {
    return /^https?:\/\/\S+$/i.test(value);
  }

  function submitEdit() {
    clearEditErrors();
    var productId = state.editProductId || '';
    var url = ($('editUrl').value || '').trim();
    var status = state.editStatus || '启用';
    var hasError = false;

    if (!productId) {
      setItemError('editProductItem', true, '请选择产品');
      hasError = true;
    }
    if (!url) {
      setItemError('editUrlItem', true, '请输入试玩链接');
      hasError = true;
    } else if (!isValidUrl(url)) {
      setItemError('editUrlItem', true, '请输入有效的 http(s) 链接');
      hasError = true;
    }
    if (hasError) return;

    var now = Store.nowText();
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextId(),
        productId: productId,
        url: url,
        status: status,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.productId = productId;
      row.url = url;
      row.status = status;
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { product: '', status: '' };
    $('filterProduct').value = '';
    if (filterProductClear) filterProductClear.sync();
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitEdit);
  $('editUrl').addEventListener('input', function () { setItemError('editUrlItem', false); });

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="edit"]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (row) openEdit(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });

  fillProductPanel();
  applyFilters();
  renderTable();
})();
