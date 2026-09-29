/* 聚合应用 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var ALL_ROWS = Store.apps();
  var SCENE_POOL = Store.scenes();

  var state = {
    draft: { name: '', packageName: '', platform: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editId: null,
    editProductId: '',
    editSceneOn: {}
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      packageName: (state.draft.packageName || '').trim().toLowerCase(),
      platform: state.draft.platform || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice();
    if (!f) return rows;
    return rows.filter(function (row) {
      var product = Store.productById(row.productId) || {};
      var name = product.name || '';
      var platform = product.platform || '';
      var pkg = (product.packageName || '').toLowerCase();
      if (f.name && name.indexOf(f.name) === -1 && row.productId.indexOf(f.name) === -1) return false;
      if (f.packageName && pkg.indexOf(f.packageName) === -1) return false;
      if (f.platform && platform !== f.platform) return false;
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

  function enabledSceneCount(row) {
    return (row.sceneIds || []).length;
  }

  var platformFilter = UI.bindSingleSelect({
    wrapId: 'platformWrap',
    triggerId: 'platformTrigger',
    panelId: 'platformPanel',
    labelId: 'platformLabel',
    clearId: 'platformClear',
    prefix: '平台：',
    getValue: function () { return state.draft.platform; },
    onChange: function (v) { state.draft.platform = v || ''; }
  });

  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png'
  };

  function platformIconHtml(platform) {
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
      label.innerHTML = '<span class="muted">请选择产品名称</span>';
      if (wrap) wrap.classList.remove('has-value');
    } else {
      var p = Store.productById(value);
      label.innerHTML = platformIconHtml(p && p.platform) +
        '<span class="select-option-text">' + escapeHtml(p ? p.name : value) + '</span>';
      if (wrap) wrap.classList.add('has-value');
    }
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }
  }

  function fillProductPanel() {
    var items = unusedProducts();
    $('editProductPanel').innerHTML = items.length
      ? items.map(function (p) {
          return '<button class="single-option" type="button" data-value="' + escapeHtml(p.id) + '">' +
            platformIconHtml(p.platform) +
            '<span class="select-option-text">' + escapeHtml(p.name) + '</span>' +
          '</button>';
        }).join('')
      : '<div class="single-option is-disabled" style="cursor:default;color:var(--color-text-3)">暂无可选产品</div>';
  }

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap',
    triggerId: 'editProductTrigger',
    panelId: 'editProductPanel',
    labelId: 'editProductLabel',
    clearId: 'editProductClear',
    getValue: function () { return state.editProductId; },
    onChange: function (v) {
      state.editProductId = v || '';
      if (v) setItemError('editProductItem', false);
      setTimeout(function () { syncEditProductLabel(v || ''); }, 0);
    }
  });
  if (editProductSelect) {
    editProductSelect.syncLabel = function (v) {
      var val = (v !== undefined && v !== null) ? v : (state.editProductId || '');
      syncEditProductLabel(val);
    };
  }

  UI.bindInputClearable({ wrapId: 'filterNameWrap', clearId: 'filterNameClear' });
  UI.bindInputClearable({ wrapId: 'filterPackageWrap', clearId: 'filterPackageClear' });

  $('filterName').addEventListener('input', function () { state.draft.name = this.value || ''; });
  $('filterPackage').addEventListener('input', function () { state.draft.packageName = this.value || ''; });

  function setItemError(id, on, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle('is-error', !!on);
    if (on && msg) {
      var err = el.querySelector('.form-item__error');
      if (err) err.textContent = msg;
    }
  }

  function setProductDisabled(disabled) {
    var trigger = $('editProductTrigger');
    var clear = $('editProductClear');
    trigger.disabled = !!disabled;
    trigger.classList.toggle('is-disabled', !!disabled);
    if (clear) clear.hidden = !!disabled;
    $('editProductWrap').classList.toggle('is-readonly', !!disabled);
  }

  function renderSceneTable() {
    $('editSceneBody').innerHTML = SCENE_POOL.map(function (s) {
      var on = !!state.editSceneOn[s.id];
      var type = s.sceneType || '-';
      var adOn = s.adSwitch === true;
      return '<tr data-scene-id="' + escapeHtml(s.id) + '">' +
        '<td class="col-switch"><button class="switch' + (on ? ' is-on' : '') + '" type="button" data-scene-switch="' + escapeHtml(s.id) + '" aria-label="场景开关" aria-pressed="' + (on ? 'true' : 'false') + '"></button></td>' +
        '<td class="col-name" title="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</td>' +
        '<td class="col-type" title="' + escapeHtml(type) + '">' + escapeHtml(type) + '</td>' +
        '<td class="col-ad"><span class="tag tag--' + (adOn ? 'enabled' : 'disabled') + '">' + (adOn ? '开' : '关') + '</span></td>' +
      '</tr>';
    }).join('');
  }

  function collectEnabledSceneIds() {
    return SCENE_POOL.filter(function (s) { return state.editSceneOn[s.id]; }).map(function (s) { return s.id; });
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
        var on = row.status !== '禁用';
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td><button class="switch' + (on ? ' is-on' : '') + '" type="button" data-action="toggle" aria-label="策略开关" aria-pressed="' + (on ? 'true' : 'false') + '"></button></td>' +
          '<td title="' + escapeHtml(product.name || '') + '">' + escapeHtml(product.name || '-') + '</td>' +
          '<td title="' + escapeHtml(row.productId) + '">' + escapeHtml(row.productId) + '</td>' +
          '<td>' + escapeHtml(product.platform || '-') + '</td>' +
          '<td title="' + escapeHtml(product.packageName || '') + '">' + escapeHtml(product.packageName || '-') + '</td>' +
          '<td>' + enabledSceneCount(row) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt || '-') + '</td>' +
          '<td class="col-action"><button class="link" type="button" data-action="scenes">场景管理</button></td>' +
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
    state.editId = null;
    state.editProductId = '';
    state.editSceneOn = {};
    SCENE_POOL.forEach(function (s) { state.editSceneOn[s.id] = true; });
    setItemError('editProductItem', false);
    setProductDisabled(false);
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel('');
    $('editModalTitle').textContent = '添加应用';
    renderSceneTable();
    UI.openModal('editModal');
  }

  function openScenes(row) {
    var product = Store.productById(row.productId);
    state.editId = row.id;
    state.editProductId = row.productId;
    state.editSceneOn = {};
    SCENE_POOL.forEach(function (s) {
      state.editSceneOn[s.id] = (row.sceneIds || []).indexOf(s.id) !== -1;
    });
    setItemError('editProductItem', false);
    setProductDisabled(true);
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel(row.productId);
    $('editModalTitle').textContent = '场景管理' + (product ? ' · ' + product.name : '');
    renderSceneTable();
    UI.openModal('editModal');
  }

  function submitEdit() {
    setItemError('editProductItem', false);
    if (!state.editId && !state.editProductId) {
      setItemError('editProductItem', true, '请选择产品名称');
      return;
    }
    var sceneIds = collectEnabledSceneIds();
    if (state.editId) {
      var row = findRow(state.editId);
      if (!row) return;
      row.sceneIds = sceneIds;
      Store.touch(row);
    } else {
      ALL_ROWS.unshift(Store.touch({
        id: UI.uid('a'),
        productId: state.editProductId,
        sceneIds: sceneIds,
        status: '启用'
      }));
    }
    Store.saveApps(ALL_ROWS);
    UI.closeModal('editModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function toggleStrategy(row) {
    row.status = row.status === '禁用' ? '启用' : '禁用';
    Store.touch(row);
    Store.saveApps(ALL_ROWS);
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', packageName: '', platform: '' };
    $('filterName').value = '';
    $('filterPackage').value = '';
    if (platformFilter && platformFilter.syncLabel) platformFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitEdit);

  $('editSceneBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-scene-switch]');
    if (!btn) return;
    var id = btn.getAttribute('data-scene-switch');
    state.editSceneOn[id] = !state.editSceneOn[id];
    btn.classList.toggle('is-on', !!state.editSceneOn[id]);
    btn.setAttribute('aria-pressed', state.editSceneOn[id] ? 'true' : 'false');
  });

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'toggle') toggleStrategy(row);
    else if (action === 'scenes') openScenes(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });

  renderTable();
})();
