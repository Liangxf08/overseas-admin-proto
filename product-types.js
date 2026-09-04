/* 产品类型 · 示例数据.xlsx 产品类型分表 */
(function () {
  'use strict';

  ProductShell.mount('product-types');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  /* 来自 示例数据.xlsx · 产品类型 */
  var TYPE_SEED = [
    { id: 20, name: '水排序/Sort分类', remark: '', products: 49, status: '启用', updatedAt: '2026-07-16 17:57:16' },
    { id: 19, name: '数独/数字', remark: '', products: 1, status: '启用', updatedAt: '2026-07-09 10:14:15' },
    { id: 18, name: '拼图', remark: '', products: 3, status: '启用', updatedAt: '2026-07-09 10:14:03' },
    { id: 17, name: '跑酷', remark: '', products: 3, status: '启用', updatedAt: '2026-07-09 10:13:53' },
    { id: 16, name: '挪车/挪箭头', remark: '', products: 23, status: '启用', updatedAt: '2026-07-09 10:13:44' },
    { id: 15, name: '竞速', remark: '', products: 0, status: '启用', updatedAt: '2026-07-09 10:13:21' },
    { id: 14, name: '模拟人生', remark: '', products: 7, status: '启用', updatedAt: '2026-07-09 10:12:35' },
    { id: 13, name: '画线', remark: '', products: 30, status: '启用', updatedAt: '2026-06-24 17:35:28' },
    { id: 12, name: '字词', remark: '', products: 13, status: '启用', updatedAt: '2026-06-24 17:35:19' },
    { id: 11, name: '清洁', remark: '', products: 17, status: '启用', updatedAt: '2026-06-24 17:35:10' },
    { id: 10, name: '分类', remark: '', products: 1, status: '启用', updatedAt: '2026-06-24 17:34:59' },
    { id: 9, name: '模拟', remark: '', products: 8, status: '启用', updatedAt: '2026-04-07 09:38:10' },
    { id: 8, name: '合集', remark: '', products: 58, status: '启用', updatedAt: '2026-01-28 06:59:36' },
    { id: 7, name: '塔防', remark: '', products: 18, status: '启用', updatedAt: '2026-01-28 06:59:31' },
    { id: 6, name: '益智', remark: '', products: 175, status: '启用', updatedAt: '2026-01-28 06:59:25' },
    { id: 5, name: '逆袭', remark: '', products: 25, status: '启用', updatedAt: '2026-01-28 06:59:08' },
    { id: 4, name: '难度', remark: '', products: 104, status: '启用', updatedAt: '2026-01-28 06:59:02' },
    { id: 3, name: '消除', remark: '', products: 35, status: '启用', updatedAt: '2026-01-28 06:58:53' },
    { id: 2, name: '找茬', remark: '', products: 116, status: '启用', updatedAt: '2026-01-28 02:38:51' },
    { id: 1, name: '其他', remark: '', products: 10, status: '启用', updatedAt: '2026-01-27 07:58:59' }
  ];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  var ALL_ROWS = TYPE_SEED.map(function (item) {
    return {
      id: String(item.id),
      name: item.name,
      remark: item.remark || '',
      products: item.products,
      status: item.status,
      updatedAt: item.updatedAt
    };
  });

  var state = {
    draft: { name: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editStatus: '启用',
    deleteId: null,
    deleteBlocked: false
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f) return ALL_ROWS.slice();
    return ALL_ROWS.filter(function (row) {
      if (f.name && row.name.toLowerCase().indexOf(f.name.toLowerCase()) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
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

  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
  });

  var filterNameClear = UI.bindInputClearable({
    wrapId: 'filterNameWrap',
    clearId: 'filterNameClear',
    onClear: function () { state.draft.name = ''; }
  });
  var editNameClear = UI.bindInputClearable({
    wrapId: 'editNameWrap',
    clearId: 'editNameClear',
    onClear: function () { clearEditErrors(); }
  });
  var editRemarkClear = UI.bindInputClearable({
    wrapId: 'editRemarkWrap',
    clearId: 'editRemarkClear'
  });

  $('filterName').addEventListener('input', function () {
    state.draft.name = this.value || '';
  });
  $('filterName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      renderTable();
    }
  });

  function clearEditErrors() {
    var el = $('editNameItem');
    if (el) el.classList.remove('is-error');
  }

  function setItemError(id, on, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle('is-error', !!on);
    if (on && msg) {
      var err = el.querySelector('.form-item__error');
      if (err) err.textContent = msg;
    }
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
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td>' + escapeHtml(row.id) + '</td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(row.remark || '') + '">' + escapeHtml(row.remark || '-') + '</td>' +
          '<td>' + (row.products || 0) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td title="' + escapeHtml(row.updatedAt) + '">' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link link--danger" type="button" data-action="delete">删除</button>' +
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
    if (window.ColResize) ColResize.refresh($('typeTable'));
  }

  function nextTypeId() {
    var max = 0;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(r.id, 10);
      if (isFinite(n) && n > max) max = n;
    });
    return String(max + 1);
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加产品类型';
    $('editName').value = '';
    $('editRemark').value = '';
    UI.setSegValue('editStatusSeg', '启用');
    if (editNameClear) editNameClear.sync();
    if (editRemarkClear) editRemarkClear.sync();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑产品类型';
    $('editName').value = row.name;
    $('editRemark').value = row.remark || '';
    UI.setSegValue('editStatusSeg', state.editStatus);
    if (editNameClear) editNameClear.sync();
    if (editRemarkClear) editRemarkClear.sync();
    UI.openModal('editModal');
  }

  function submitEdit() {
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var status = state.editStatus || '启用';

    if (!name) {
      setItemError('editNameItem', true, '请输入产品类型');
      return;
    }

    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (duplicated) {
      setItemError('editNameItem', true, '产品类型已存在');
      return;
    }

    var now = formatDateTime(new Date());
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextTypeId(),
        name: name,
        remark: remark,
        products: 0,
        status: status,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.name = name;
      row.remark = remark;
      row.status = status;
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  function openDelete(row) {
    state.deleteId = row.id;
    var count = row.products || 0;
    state.deleteBlocked = count > 0;
    $('deleteTitle').textContent = '删除确认';
    if (state.deleteBlocked) {
      $('deleteBody').textContent = '当前类型存在关联产品，请移除后再执行删除。';
    } else {
      $('deleteBody').textContent = '此操作不可撤销，确认删除吗？';
    }
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var id = state.deleteId;
    var blocked = state.deleteBlocked;
    state.deleteId = null;
    state.deleteBlocked = false;
    UI.closeModal('deleteModal');
    if (!id) return;
    if (blocked) {
      UI.showToast('请先移除关联产品', 'warning');
      return;
    }
    ALL_ROWS = ALL_ROWS.filter(function (r) { return r.id !== id; });
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('addBtn').addEventListener('click', openAdd);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row);
    else if (action === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });
  $('editSubmit').addEventListener('click', submitEdit);
  $('editName').addEventListener('input', function () { clearEditErrors(); });

  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.deleteId = null;
      state.deleteBlocked = false;
      UI.closeModal('deleteModal');
    });
  });
  $('deleteOk').addEventListener('click', confirmDelete);

  applyFilters();
  renderTable();
})();
