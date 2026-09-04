/* 场景管理 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var ALL_ROWS = Store.scenes();

  var AD_TYPE_TAG = {
    '插屏': 'tag--info',
    'Banner': 'tag--warning',
    '开屏': 'tag--processing',
    '激励视频': 'tag--done'
  };

  var state = {
    draft: { name: '', adType: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editAdType: '',
    editFieldIds: [],
    editStatus: '启用',
    deleteId: null
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      adType: state.draft.adType || '',
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice().sort(Store.byUpdatedDesc);
    if (!f) return rows;
    return rows.filter(function (row) {
      if (f.name && row.name.indexOf(f.name) === -1) return false;
      if (f.adType && row.adType !== f.adType) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function adTypeTag(type) {
    return '<span class="tag ' + (AD_TYPE_TAG[type] || 'tag--ignored') + '">' + escapeHtml(type || '-') + '</span>';
  }

  function fieldTagsHtml(ids) {
    var names = (ids || []).map(Store.fieldName).filter(Boolean);
    if (!names.length) return '-';
    var max = 3;
    var shown = names.slice(0, max);
    var extra = names.length - shown.length;
    var html = '<div class="cell-tags">' + shown.map(function (n) {
      return '<span class="tag tag--info">' + escapeHtml(n) + '</span>';
    }).join('');
    if (extra > 0) html += '<span class="cell-more">等 ' + extra + ' 项</span>';
    html += '</div>';
    return html;
  }

  var adTypeFilter = UI.bindSingleSelect({
    wrapId: 'adTypeWrap', triggerId: 'adTypeTrigger', panelId: 'adTypePanel',
    labelId: 'adTypeLabel', clearId: 'adTypeClear', prefix: '广告类型：',
    getValue: function () { return state.draft.adType; },
    onChange: function (v) { state.draft.adType = v || ''; }
  });

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
    labelId: 'statusLabel', clearId: 'statusClear', prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  var editAdTypeSelect = UI.bindSingleSelect({
    wrapId: 'editAdTypeWrap', triggerId: 'editAdTypeTrigger', panelId: 'editAdTypePanel',
    labelId: 'editAdTypeLabel',
    getValue: function () { return state.editAdType; },
    onChange: function (v) { state.editAdType = v || ''; }
  });

  var fieldMulti = UI.bindMultiSelect({
    wrapId: 'editFieldWrap',
    triggerId: 'editFieldTrigger',
    panelId: 'editFieldPanel',
    labelId: 'editFieldLabel',
    listId: 'editFieldList',
    selectedId: 'editFieldSelected',
    searchId: 'editFieldSearch',
    countId: 'editFieldCount',
    selectAllId: 'editFieldSelectAll',
    clearId: 'editFieldClear',
    getOptions: function () {
      return Store.fields().map(function (f) { return f.id; });
    },
    getLabel: function (id) { return Store.fieldName(id); },
    getSelected: function () { return state.editFieldIds; },
    setSelected: function (arr) { state.editFieldIds = arr || []; }
  });

  $('editFieldPanelClear').addEventListener('click', function () {
    state.editFieldIds = [];
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
  });

  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindInputClearable({ wrapId: 'filterNameWrap', clearId: 'filterNameClear' });
  UI.bindInputClearable({ wrapId: 'editNameClearWrap', clearId: 'editNameClear' });
  UI.bindFormHelp();

  $('filterName').addEventListener('input', function () { state.draft.name = this.value || ''; });

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
    ['editNameItem', 'editAdTypeItem', 'editFieldItem'].forEach(function (id) {
      setItemError(id, false);
    });
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
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td>' + adTypeTag(row.adType) + '</td>' +
          '<td>' + fieldTagsHtml(row.fieldIds) + '</td>' +
          '<td title="' + escapeHtml(row.remark || '') + '">' + escapeHtml(row.remark || '-') + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
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
        onPageChange: function (p) { state.page = p; renderTable(); },
        onPageSizeChange: function (size) { state.pageSize = size; state.page = 1; renderTable(); }
      });
    }
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editAdType = '';
    state.editFieldIds = [];
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加场景';
    $('editName').value = '';
    $('editRemark').value = '';
    if (editAdTypeSelect && editAdTypeSelect.syncLabel) editAdTypeSelect.syncLabel('');
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
    UI.setSegValue('editStatusSeg', '启用');
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editAdType = row.adType || '';
    state.editFieldIds = (row.fieldIds || []).slice();
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑场景';
    $('editName').value = row.name;
    $('editRemark').value = row.remark || '';
    if (editAdTypeSelect && editAdTypeSelect.syncLabel) editAdTypeSelect.syncLabel(state.editAdType);
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
    UI.setSegValue('editStatusSeg', state.editStatus);
    UI.openModal('editModal');
  }

  function submitEdit() {
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var ok = true;
    if (!name) {
      setItemError('editNameItem', true, '请输入场景名称');
      ok = false;
    }
    if (!state.editAdType) {
      setItemError('editAdTypeItem', true, '请选择广告类型');
      ok = false;
    }
    if (!state.editFieldIds.length) {
      setItemError('editFieldItem', true, '请选择关联条件');
      ok = false;
    }
    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (name && duplicated) {
      setItemError('editNameItem', true, '场景名称已存在');
      ok = false;
    }
    if (!ok) return;

    if (state.editMode === 'add') {
      ALL_ROWS.unshift(Store.touch({
        id: UI.uid('s'),
        name: name,
        adType: state.editAdType,
        fieldIds: state.editFieldIds.slice(),
        remark: remark,
        status: state.editStatus || '启用'
      }));
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.name = name;
      row.adType = state.editAdType;
      row.fieldIds = state.editFieldIds.slice();
      row.remark = remark;
      row.status = state.editStatus || '启用';
      Store.touch(row);
    }
    Store.saveScenes(ALL_ROWS);
    UI.closeModal('editModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function openDelete(row) {
    if (Store.sceneUsedByApps(row.id).length || Store.sceneUsedByPolicies(row.id).length) {
      UI.showToast('该场景已被聚合应用或策略引用，请先解除关联。', 'error');
      return;
    }
    state.deleteId = row.id;
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var id = state.deleteId;
    if (!id) return;
    var idx = ALL_ROWS.findIndex(function (r) { return r.id === id; });
    if (idx !== -1) ALL_ROWS.splice(idx, 1);
    Store.saveScenes(ALL_ROWS);
    state.deleteId = null;
    UI.closeModal('deleteModal');
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', adType: '', status: '' };
    $('filterName').value = '';
    if (adTypeFilter && adTypeFilter.syncLabel) adTypeFilter.syncLabel('');
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitEdit);
  $('deleteOk').addEventListener('click', confirmDelete);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    if (btn.getAttribute('data-action') === 'edit') openEdit(row);
    else if (btn.getAttribute('data-action') === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });
  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('deleteModal'); });
  });

  renderTable();
})();
