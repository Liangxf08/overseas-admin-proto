/* 聚合应用 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var COPY_ICON = UI.COPY_ICON;
  var ALL_ROWS = Store.apps();
  var SCENE_POOL = Store.scenes();

  var state = {
    draft: { name: '', platform: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editProductId: '',
    editSceneIds: [],
    editStatus: '启用',
    transferAppId: null,
    selectedIds: [],
    availChecked: {},
    selectedChecked: {},
    availKw: '',
    selectedKw: '',
    deleteId: null
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      platform: state.draft.platform || '',
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice().sort(Store.byUpdatedDesc);
    if (!f) return rows;
    return rows.filter(function (row) {
      var product = Store.productById(row.productId);
      var name = product ? product.name : '';
      var platform = product ? product.platform : '';
      if (f.name && name.indexOf(f.name) === -1 && row.productId.indexOf(f.name) === -1) return false;
      if (f.platform && platform !== f.platform) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function unusedProducts() {
    var used = {};
    ALL_ROWS.forEach(function (a) { used[a.productId] = true; });
    return Store.PRODUCTS.filter(function (p) { return !used[p.id]; });
  }

  function sceneTagsHtml(ids) {
    var names = (ids || []).map(Store.sceneName);
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

  var platformFilter = UI.bindSingleSelect({
    wrapId: 'platformWrap', triggerId: 'platformTrigger', panelId: 'platformPanel',
    labelId: 'platformLabel', clearId: 'platformClear', prefix: '平台：',
    getValue: function () { return state.draft.platform; },
    onChange: function (v) { state.draft.platform = v || ''; }
  });

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
    labelId: 'statusLabel', clearId: 'statusClear', prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  function fillProductPanel() {
    var items = unusedProducts();
    $('editProductPanel').innerHTML = items.map(function (p) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(p.id) + '">' +
        escapeHtml(p.name) + '（' + escapeHtml(p.platform) + '）</button>';
    }).join('');
  }

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap', triggerId: 'editProductTrigger', panelId: 'editProductPanel',
    labelId: 'editProductLabel',
    getValue: function () { return state.editProductId; },
    formatValue: function (id) {
      var p = Store.productById(id);
      return p ? p.name : id;
    },
    onChange: function (v) { state.editProductId = v || ''; }
  });

  var sceneMulti = UI.bindMultiSelect({
    wrapId: 'editSceneWrap',
    triggerId: 'editSceneTrigger',
    panelId: 'editScenePanel',
    labelId: 'editSceneLabel',
    listId: 'editSceneList',
    selectedId: 'editSceneSelected',
    searchId: 'editSceneSearch',
    countId: 'editSceneCount',
    selectAllId: 'editSceneSelectAll',
    clearId: 'editSceneClear',
    getOptions: function () { return SCENE_POOL.map(function (s) { return s.id; }); },
    getLabel: function (id) { return Store.sceneName(id); },
    getSelected: function () { return state.editSceneIds; },
    setSelected: function (arr) { state.editSceneIds = arr || []; }
  });

  $('editScenePanelClear').addEventListener('click', function () {
    state.editSceneIds = [];
    if (sceneMulti && sceneMulti.render) sceneMulti.render();
  });

  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindInputClearable({ wrapId: 'filterNameWrap', clearId: 'filterNameClear' });

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
        var product = Store.productById(row.productId) || {};
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td title="' + escapeHtml(product.name || '') + '">' + escapeHtml(product.name || '-') + '</td>' +
          '<td>' + escapeHtml(product.platform || '-') + '</td>' +
          '<td><span class="cell-id">' +
            '<button class="copy-btn" type="button" data-copy="' + escapeHtml(row.productId) + '" title="复制产品ID" aria-label="复制">' + COPY_ICON + '</button>' +
            '<span class="cell-id__text" title="' + escapeHtml(row.productId) + '">' + escapeHtml(row.productId) + '</span>' +
          '</span></td>' +
          '<td>' + sceneTagsHtml(row.sceneIds) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="scenes">关联场景</button>' +
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
    var unused = unusedProducts();
    if (!unused.length) {
      UI.showToast('暂无可添加的产品', 'warning');
      return;
    }
    state.editProductId = '';
    state.editSceneIds = [];
    state.editStatus = '启用';
    setItemError('editProductItem', false);
    setItemError('editSceneItem', false);
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel('');
    if (sceneMulti && sceneMulti.render) sceneMulti.render();
    UI.setSegValue('editStatusSeg', '启用');
    UI.openModal('editModal');
  }

  function submitAdd() {
    setItemError('editProductItem', false);
    setItemError('editSceneItem', false);
    var ok = true;
    if (!state.editProductId) {
      setItemError('editProductItem', true, '请选择产品');
      ok = false;
    }
    if (!state.editSceneIds.length) {
      setItemError('editSceneItem', true, '请选择关联场景');
      ok = false;
    }
    if (!ok) return;
    ALL_ROWS.unshift(Store.touch({
      id: UI.uid('a'),
      productId: state.editProductId,
      sceneIds: state.editSceneIds.slice(),
      status: state.editStatus || '启用'
    }));
    Store.saveApps(ALL_ROWS);
    UI.closeModal('editModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function getSceneById(id) {
    return SCENE_POOL.find(function (s) { return s.id === id; });
  }

  function renderTransfer() {
    var selectedSet = {};
    state.selectedIds.forEach(function (id) { selectedSet[id] = true; });
    var availAll = SCENE_POOL.filter(function (s) { return !selectedSet[s.id]; });
    var selectedAll = state.selectedIds.map(getSceneById).filter(Boolean);

    var availKw = (state.availKw || '').trim().toLowerCase();
    var selectedKw = (state.selectedKw || '').trim().toLowerCase();
    var availVisible = availAll.filter(function (s) {
      return !availKw || s.name.toLowerCase().indexOf(availKw) !== -1;
    });
    var selectedVisible = selectedAll.filter(function (s) {
      return !selectedKw || s.name.toLowerCase().indexOf(selectedKw) !== -1;
    });

    var availCheckedCount = availVisible.filter(function (s) { return state.availChecked[s.id]; }).length;
    var selectedCheckedCount = selectedVisible.filter(function (s) { return state.selectedChecked[s.id]; }).length;

    $('availCount').textContent = availCheckedCount + ' / ' + availAll.length;
    $('selectedCount').textContent = selectedCheckedCount + ' / ' + selectedAll.length;

    var availAllBox = $('availCheckAll');
    availAllBox.checked = availVisible.length > 0 && availCheckedCount === availVisible.length;
    availAllBox.indeterminate = availCheckedCount > 0 && availCheckedCount < availVisible.length;

    var selectedAllBox = $('selectedCheckAll');
    selectedAllBox.checked = selectedVisible.length > 0 && selectedCheckedCount === selectedVisible.length;
    selectedAllBox.indeterminate = selectedCheckedCount > 0 && selectedCheckedCount < selectedVisible.length;

    function listHtml(list, checkedMap, emptyText) {
      if (!list.length) return '<div class="transfer__empty">' + emptyText + '</div>';
      return list.map(function (s) {
        return '<label class="transfer__item">' +
          '<input type="checkbox" value="' + escapeHtml(s.id) + '"' + (checkedMap[s.id] ? ' checked' : '') + ' />' +
          '<span title="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</span>' +
        '</label>';
      }).join('');
    }

    $('availList').innerHTML = listHtml(availVisible, state.availChecked, '暂无数据');
    $('selectedList').innerHTML = listHtml(selectedVisible, state.selectedChecked, '暂无已选');
    $('moveToSelected').disabled = availCheckedCount === 0;
    $('moveToAvail').disabled = selectedCheckedCount === 0;
  }

  function openScenes(row) {
    var product = Store.productById(row.productId);
    $('sceneModalTitle').textContent = '关联场景' + (product ? ' · ' + product.name : '');
    state.transferAppId = row.id;
    state.selectedIds = (row.sceneIds || []).slice();
    state.availChecked = {};
    state.selectedChecked = {};
    state.availKw = '';
    state.selectedKw = '';
    $('availSearch').value = '';
    $('selectedSearch').value = '';
    renderTransfer();
    UI.openModal('sceneModal');
  }

  function submitScenes() {
    var row = findRow(state.transferAppId);
    if (!row) return;
    if (!state.selectedIds.length) {
      UI.showToast('请至少关联一个场景', 'error');
      return;
    }
    row.sceneIds = state.selectedIds.slice();
    Store.touch(row);
    Store.saveApps(ALL_ROWS);
    UI.closeModal('sceneModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  $('availList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) state.availChecked[input.value] = true;
    else delete state.availChecked[input.value];
    renderTransfer();
  });
  $('selectedList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) state.selectedChecked[input.value] = true;
    else delete state.selectedChecked[input.value];
    renderTransfer();
  });
  $('availCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var selectedSet = {};
    state.selectedIds.forEach(function (id) { selectedSet[id] = true; });
    var kw = (state.availKw || '').trim().toLowerCase();
    SCENE_POOL.forEach(function (s) {
      if (selectedSet[s.id]) return;
      if (kw && s.name.toLowerCase().indexOf(kw) === -1) return;
      if (checked) state.availChecked[s.id] = true;
      else delete state.availChecked[s.id];
    });
    renderTransfer();
  });
  $('selectedCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var kw = (state.selectedKw || '').trim().toLowerCase();
    state.selectedIds.forEach(function (id) {
      var s = getSceneById(id);
      if (!s) return;
      if (kw && s.name.toLowerCase().indexOf(kw) === -1) return;
      if (checked) state.selectedChecked[id] = true;
      else delete state.selectedChecked[id];
    });
    renderTransfer();
  });
  $('availSearch').addEventListener('input', function () { state.availKw = this.value || ''; renderTransfer(); });
  $('selectedSearch').addEventListener('input', function () { state.selectedKw = this.value || ''; renderTransfer(); });
  $('moveToSelected').addEventListener('click', function () {
    Object.keys(state.availChecked).forEach(function (id) {
      if (!state.availChecked[id]) return;
      if (state.selectedIds.indexOf(id) === -1) state.selectedIds.push(id);
      delete state.availChecked[id];
    });
    renderTransfer();
  });
  $('moveToAvail').addEventListener('click', function () {
    var moving = Object.keys(state.selectedChecked).filter(function (id) { return state.selectedChecked[id]; });
    state.selectedIds = state.selectedIds.filter(function (id) { return moving.indexOf(id) === -1; });
    moving.forEach(function (id) { delete state.selectedChecked[id]; });
    renderTransfer();
  });

  function openDelete(row) {
    if (Store.productUsedByPolicies(row.productId).length) {
      UI.showToast('该应用下存在广告策略，请先删除策略。', 'error');
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
    Store.saveApps(ALL_ROWS);
    state.deleteId = null;
    UI.closeModal('deleteModal');
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', platform: '', status: '' };
    $('filterName').value = '';
    if (platformFilter && platformFilter.syncLabel) platformFilter.syncLabel('');
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitAdd);
  $('sceneSubmit').addEventListener('click', submitScenes);
  $('deleteOk').addEventListener('click', confirmDelete);

  $('tableBody').addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
      UI.copyText(copyBtn.getAttribute('data-copy') || '');
      return;
    }
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    if (btn.getAttribute('data-action') === 'scenes') openScenes(row);
    else if (btn.getAttribute('data-action') === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });
  document.querySelectorAll('[data-close="sceneModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('sceneModal'); });
  });
  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('deleteModal'); });
  });

  renderTable();
})();
