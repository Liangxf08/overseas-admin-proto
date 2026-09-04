/* 产品组 · 示例数据.xlsx 产品组分表 */
(function () {
  'use strict';

  ProductShell.mount('product-groups');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  /* 来自 示例数据.xlsx · 产品组 */
  var GROUP_SEED = [
    { id: 13, name: '其他', remark: '', products: 1, status: '启用', updatedAt: '2026-02-04 09:34:57' },
    { id: 12, name: '外部联运', remark: '', products: 75, status: '启用', updatedAt: '2026-01-04 07:17:34' },
    { id: 11, name: '硕果组', remark: '', products: 3, status: '启用', updatedAt: '2026-01-04 07:17:07' },
    { id: 10, name: '坚果组', remark: '', products: 0, status: '启用', updatedAt: '2026-01-04 07:16:59' },
    { id: 9, name: '苹果组', remark: '', products: 9, status: '启用', updatedAt: '2026-01-04 07:16:52' },
    { id: 8, name: '无花果', remark: '', products: 69, status: '启用', updatedAt: '2026-01-04 07:16:44' },
    { id: 7, name: '奇异果', remark: '', products: 538, status: '启用', updatedAt: '2026-01-04 07:16:37' }
  ];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  var ALL_ROWS = GROUP_SEED.map(function (item) {
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
    if (window.ColResize) ColResize.refresh($('groupTable'));
  }

  function nextGroupId() {
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
    $('editModalTitle').textContent = '添加产品组';
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
    $('editModalTitle').textContent = '编辑产品组';
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
      setItemError('editNameItem', true, '请输入产品组名称');
      return;
    }

    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (duplicated) {
      setItemError('editNameItem', true, '产品组名称已存在');
      return;
    }

    var now = formatDateTime(new Date());
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextGroupId(),
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
      $('deleteBody').textContent = '当前产品组存在关联产品，请移除后再执行删除。';
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

  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', status: '' };
    $('filterName').value = '';
    if (filterNameClear) filterNameClear.sync();
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
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
