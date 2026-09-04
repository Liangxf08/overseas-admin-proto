/* 字段配置 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var KEY_RE = /^[a-z][a-z0-9_]*$/;
  var CHILD_TYPES = Store.CHILD_COMPONENT_TYPES || ['数字输入', '文本输入', '开关'];

  var ALL_ROWS = Store.fields();

  var state = {
    draft: { name: '', key: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editComponentType: '数字输入',
    editStatus: '启用',
    editOptions: [],
    editChildren: [],
    deleteId: null
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      key: (state.draft.key || '').trim(),
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
      if (f.key && String(row.key).indexOf(f.key) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
    labelId: 'statusLabel', clearId: 'statusClear', prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindSeg('editTypeSeg', function (v) {
    state.editComponentType = v || '数字输入';
    if (v === '下拉选择' && !state.editOptions.length) state.editOptions = [{ label: '', value: '' }];
    if (v === 'Array' && !state.editChildren.length) {
      state.editChildren = [{ name: '', key: '', componentType: '数字输入' }];
    }
    syncTypeUi();
  });

  UI.bindInputClearable({ wrapId: 'filterNameWrap', clearId: 'filterNameClear' });
  UI.bindInputClearable({ wrapId: 'filterKeyWrap', clearId: 'filterKeyClear' });
  UI.bindInputClearable({ wrapId: 'editNameClearWrap', clearId: 'editNameClear' });
  UI.bindInputClearable({ wrapId: 'editKeyClearWrap', clearId: 'editKeyClear' });
  UI.bindFormHelp();

  $('filterName').addEventListener('input', function () { state.draft.name = this.value || ''; });
  $('filterKey').addEventListener('input', function () { state.draft.key = this.value || ''; });

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
    ['editNameItem', 'editKeyItem', 'editTypeItem', 'editMinItem', 'editMaxItem', 'editOptionsItem', 'editChildrenItem'].forEach(function (id) {
      setItemError(id, false);
    });
  }

  function parseNumber(raw) {
    var t = String(raw || '').trim();
    if (!t) return { empty: true };
    var n = Number(t);
    if (!isFinite(n)) return { error: true };
    return { value: n };
  }

  function syncTypeUi() {
    var type = state.editComponentType;
    $('editMinItem').hidden = type !== '数字输入';
    $('editMaxItem').hidden = type !== '数字输入';
    $('editOptionsItem').hidden = type !== '下拉选择';
    $('editChildrenItem').hidden = type !== 'Array';
    if (type === '下拉选择') renderOptions();
    if (type === 'Array') renderChildren();
  }

  function renderOptions() {
    var body = $('optionBody');
    if (!state.editOptions.length) state.editOptions = [{ label: '', value: '' }];
    body.innerHTML = state.editOptions.map(function (row, i) {
      var del = state.editOptions.length > 1
        ? '<button class="link link--danger" type="button" data-opt-del="' + i + '">删除</button>'
        : '-';
      return '<tr>' +
        '<td><input class="input" data-opt-label="' + i + '" value="' + escapeHtml(row.label || '') + '" placeholder="请输入" /></td>' +
        '<td><input class="input" data-opt-value="' + i + '" value="' + escapeHtml(row.value || '') + '" placeholder="请输入" /></td>' +
        '<td class="col-op">' + del + '</td>' +
      '</tr>';
    }).join('');
  }

  function collectOptions() {
    state.editOptions.forEach(function (row, i) {
      var labelEl = document.querySelector('[data-opt-label="' + i + '"]');
      var valueEl = document.querySelector('[data-opt-value="' + i + '"]');
      if (labelEl) row.label = (labelEl.value || '').trim();
      if (valueEl) row.value = (valueEl.value || '').trim();
    });
  }

  function renderChildren() {
    var body = $('childBody');
    if (!state.editChildren.length) {
      state.editChildren = [{ name: '', key: '', componentType: '数字输入' }];
    }
    body.innerHTML = state.editChildren.map(function (row, i) {
      var typeOpts = CHILD_TYPES.map(function (t) {
        return '<option value="' + escapeHtml(t) + '"' + (row.componentType === t ? ' selected' : '') + '>' + escapeHtml(t) + '</option>';
      }).join('');
      var del = state.editChildren.length > 1
        ? '<button class="link link--danger" type="button" data-child-del="' + i + '">删除</button>'
        : '-';
      return '<tr>' +
        '<td><input class="input" data-child-name="' + i + '" value="' + escapeHtml(row.name || '') + '" placeholder="请输入" /></td>' +
        '<td><input class="input" data-child-key="' + i + '" value="' + escapeHtml(row.key || '') + '" placeholder="请输入" /></td>' +
        '<td><select class="input" data-child-type="' + i + '">' + typeOpts + '</select></td>' +
        '<td class="col-op">' + del + '</td>' +
      '</tr>';
    }).join('');
  }

  function collectChildren() {
    state.editChildren.forEach(function (row, i) {
      var nameEl = document.querySelector('[data-child-name="' + i + '"]');
      var keyEl = document.querySelector('[data-child-key="' + i + '"]');
      var typeEl = document.querySelector('[data-child-type="' + i + '"]');
      if (nameEl) row.name = (nameEl.value || '').trim();
      if (keyEl) row.key = (keyEl.value || '').trim();
      if (typeEl) row.componentType = typeEl.value || '数字输入';
    });
  }

  $('optionBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-opt-del]');
    if (!btn) return;
    collectOptions();
    var i = Number(btn.getAttribute('data-opt-del'));
    if (state.editOptions.length > 1) state.editOptions.splice(i, 1);
    renderOptions();
  });

  $('childBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-child-del]');
    if (!btn) return;
    collectChildren();
    var i = Number(btn.getAttribute('data-child-del'));
    if (state.editChildren.length > 1) state.editChildren.splice(i, 1);
    renderChildren();
  });

  $('addOptionBtn').addEventListener('click', function () {
    collectOptions();
    state.editOptions.push({ label: '', value: '' });
    renderOptions();
  });

  $('addChildBtn').addEventListener('click', function () {
    collectChildren();
    state.editChildren.push({ name: '', key: '', componentType: '数字输入' });
    renderChildren();
  });

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
        var desc = row.desc || '';
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td class="code-cell" title="' + escapeHtml(row.key) + '">' + escapeHtml(row.key) + '</td>' +
          '<td>' + escapeHtml(row.componentType || '-') + '</td>' +
          '<td title="' + escapeHtml(desc) + '"><span class="cell-ellipsis">' + escapeHtml(desc || '-') + '</span></td>' +
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

  function resetForm() {
    clearEditErrors();
    $('editName').value = '';
    $('editKey').value = '';
    $('editDesc').value = '';
    $('editMin').value = '';
    $('editMax').value = '';
    state.editComponentType = '数字输入';
    state.editStatus = '启用';
    state.editOptions = [{ label: '', value: '' }];
    state.editChildren = [{ name: '', key: '', componentType: '数字输入' }];
    UI.setSegValue('editStatusSeg', '启用');
    UI.setSegValue('editTypeSeg', '数字输入');
    $('editKey').disabled = false;
    $('editKey').readOnly = false;
    syncTypeUi();
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    $('editModalTitle').textContent = '添加字段';
    resetForm();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editComponentType = row.componentType || '数字输入';
    state.editStatus = row.status || '启用';
    state.editOptions = Store.clone(row.options && row.options.length ? row.options : [{ label: '', value: '' }]);
    state.editChildren = Store.clone(row.children && row.children.length ? row.children : [{ name: '', key: '', componentType: '数字输入' }]);
    clearEditErrors();
    $('editModalTitle').textContent = '编辑字段';
    $('editName').value = row.name;
    $('editKey').value = row.key;
    $('editKey').disabled = true;
    $('editKey').readOnly = true;
    $('editDesc').value = row.desc || '';
    $('editMin').value = row.min == null ? '' : String(row.min);
    $('editMax').value = row.max == null ? '' : String(row.max);
    UI.setSegValue('editStatusSeg', state.editStatus);
    UI.setSegValue('editTypeSeg', state.editComponentType);
    syncTypeUi();
    UI.openModal('editModal');
  }

  function submitEdit() {
    collectOptions();
    collectChildren();
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var key = ($('editKey').value || '').trim();
    var desc = ($('editDesc').value || '').trim();
    var type = state.editComponentType;
    var ok = true;

    if (state.editMode === 'add') {
      if (!key) {
        setItemError('editKeyItem', true, '请输入字段Key');
        ok = false;
      } else if (!KEY_RE.test(key)) {
        setItemError('editKeyItem', true, '仅支持小写字母开头的字母、数字、下划线');
        ok = false;
      }
    }
    if (!name) {
      setItemError('editNameItem', true, '请输入字段名称');
      ok = false;
    }
    if (!type) {
      setItemError('editTypeItem', true, '请选择组件类型');
      ok = false;
    }

    var minRes = parseNumber($('editMin').value);
    var maxRes = parseNumber($('editMax').value);
    var minVal = null;
    var maxVal = null;
    if (type === '数字输入') {
      if (minRes.error) {
        setItemError('editMinItem', true, '请输入有效数字');
        ok = false;
      } else if (!minRes.empty) minVal = minRes.value;
      if (maxRes.error) {
        setItemError('editMaxItem', true, '请输入有效数字');
        ok = false;
      } else if (!maxRes.empty) maxVal = maxRes.value;
      if (minVal != null && maxVal != null && maxVal < minVal) {
        setItemError('editMaxItem', true, '最大值须大于等于最小值');
        ok = false;
      }
    }

    var options = [];
    if (type === '下拉选择') {
      options = state.editOptions.filter(function (o) { return o.label && o.value; });
      if (!options.length) {
        setItemError('editOptionsItem', true, '请至少添加一个完整选项');
        ok = false;
      }
    }

    var children = [];
    if (type === 'Array') {
      children = state.editChildren.filter(function (c) { return c.name && c.key; });
      if (!children.length) {
        setItemError('editChildrenItem', true, '请至少添加一个完整子项');
        ok = false;
      }
      var badKey = children.some(function (c) { return !KEY_RE.test(c.key); });
      if (children.length && badKey) {
        setItemError('editChildrenItem', true, '子项Key仅支持小写字母开头的字母、数字、下划线');
        ok = false;
      }
    }

    var duplicatedName = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (name && duplicatedName) {
      setItemError('editNameItem', true, '字段名称已存在');
      ok = false;
    }
    var duplicatedKey = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.key === key;
    });
    if (state.editMode === 'add' && key && duplicatedKey) {
      setItemError('editKeyItem', true, '字段Key已存在');
      ok = false;
    }
    if (!ok) return;

    var payload = {
      name: name,
      componentType: type,
      desc: desc,
      min: type === '数字输入' ? minVal : null,
      max: type === '数字输入' ? maxVal : null,
      options: type === '下拉选择' ? options : [],
      children: type === 'Array' ? children : [],
      status: state.editStatus || '启用'
    };

    if (state.editMode === 'add') {
      payload.id = UI.uid('f');
      payload.key = key;
      ALL_ROWS.unshift(Store.touch(payload));
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
      Store.touch(row);
    }
    Store.saveFields(ALL_ROWS);
    UI.closeModal('editModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function openDelete(row) {
    var used = Store.fieldUsedByScenes(row.id);
    if (used.length) {
      UI.showToast('该字段已被场景引用，请先解除关联。', 'error');
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
    Store.saveFields(ALL_ROWS);
    state.deleteId = null;
    UI.closeModal('deleteModal');
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', key: '', status: '' };
    $('filterName').value = '';
    $('filterKey').value = '';
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
