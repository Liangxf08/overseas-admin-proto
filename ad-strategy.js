/* 广告策略 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var ALL_ROWS = Store.policies();

  var state = {
    draft: { name: '', productId: '', sceneId: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editProductId: '',
    editSceneId: '',
    editStatus: '启用',
    editUserType: '全部',
    editCountries: [],
    editChannels: [],
    editSplits: [],
    deleteId: null
  };

  function fillSingle(panelId, items, withAll) {
    var html = withAll ? '<button class="single-option" type="button" data-value="">全部</button>' : '';
    html += (items || []).map(function (it) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(it.value) + '">' +
        escapeHtml(it.label) + '</button>';
    }).join('');
    var el = $(panelId);
    if (el) el.innerHTML = html;
  }

  function appProductOptions() {
    var seen = {};
    var out = [];
    Store.apps().forEach(function (a) {
      if (seen[a.productId]) return;
      seen[a.productId] = true;
      var p = Store.productById(a.productId);
      if (p) out.push({ value: p.id, label: p.name });
    });
    return out;
  }

  function sceneOptionsForProduct(productId) {
    var scenes = productId ? Store.scenesForProduct(productId) : Store.scenes();
    return scenes.map(function (s) { return { value: s.id, label: s.name }; });
  }

  function fillFilterPanels() {
    fillSingle('productPanel', appProductOptions(), true);
    fillSingle('scenePanel', sceneOptionsForProduct(state.draft.productId), true);
  }

  function fillEditPanels() {
    fillSingle('editProductPanel', appProductOptions(), false);
    fillSingle('editScenePanel', sceneOptionsForProduct(state.editProductId), false);
  }

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      productId: state.draft.productId || '',
      sceneId: state.draft.sceneId || '',
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
      if (f.productId && row.productId !== f.productId) return false;
      if (f.sceneId && row.sceneId !== f.sceneId) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function targetingText(row) {
    var parts = [];
    if (row.countries && row.countries.length) parts.push(row.countries.join('、'));
    if (row.channels && row.channels.length) parts.push(row.channels.join('、'));
    if (row.userType && row.userType !== '全部') parts.push(row.userType);
    if (row.versions && row.versions.length) parts.push('版本 ' + row.versions.join('/'));
    return parts.length ? parts.join(' · ') : '全部用户';
  }

  function splitText(row) {
    return (row.splits || []).map(function (g) {
      return (g.name || '分流组') + ' ' + g.percent + '%';
    }).join(' / ') || '-';
  }

  fillFilterPanels();

  var productFilter = UI.bindSingleSelect({
    wrapId: 'productWrap', triggerId: 'productTrigger', panelId: 'productPanel',
    labelId: 'productLabel', clearId: 'productClear', prefix: '产品：',
    getValue: function () { return state.draft.productId; },
    formatValue: function (id) { return Store.productName(id); },
    onChange: function (v) {
      state.draft.productId = v || '';
      var allowed = sceneOptionsForProduct(state.draft.productId).some(function (s) { return s.value === state.draft.sceneId; });
      if (!allowed) state.draft.sceneId = '';
      fillSingle('scenePanel', sceneOptionsForProduct(state.draft.productId), true);
      if (sceneFilter && sceneFilter.syncLabel) sceneFilter.syncLabel(state.draft.sceneId);
    }
  });

  var sceneFilter = UI.bindSingleSelect({
    wrapId: 'sceneWrap', triggerId: 'sceneTrigger', panelId: 'scenePanel',
    labelId: 'sceneLabel', clearId: 'sceneClear', prefix: '场景：',
    getValue: function () { return state.draft.sceneId; },
    formatValue: function (id) { return Store.sceneName(id); },
    onChange: function (v) { state.draft.sceneId = v || ''; }
  });

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
    labelId: 'statusLabel', clearId: 'statusClear', prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap', triggerId: 'editProductTrigger', panelId: 'editProductPanel',
    labelId: 'editProductLabel',
    getValue: function () { return state.editProductId; },
    formatValue: function (id) { return Store.productName(id); },
    onChange: function (v) {
      collectSplitsFromDom();
      state.editProductId = v || '';
      var allowed = sceneOptionsForProduct(state.editProductId).some(function (s) { return s.value === state.editSceneId; });
      if (!allowed) {
        state.editSceneId = '';
        resetSplitsForScene();
      }
      fillSingle('editScenePanel', sceneOptionsForProduct(state.editProductId), false);
      if (editSceneSelect && editSceneSelect.syncLabel) editSceneSelect.syncLabel(state.editSceneId);
      renderSplits();
    }
  });

  var editSceneSelect = UI.bindSingleSelect({
    wrapId: 'editSceneWrap', triggerId: 'editSceneTrigger', panelId: 'editScenePanel',
    labelId: 'editSceneLabel',
    getValue: function () { return state.editSceneId; },
    formatValue: function (id) { return Store.sceneName(id); },
    onChange: function (v) {
      collectSplitsFromDom();
      state.editSceneId = v || '';
      resetSplitsForScene();
      renderSplits();
    }
  });

  var countryMulti = UI.bindMultiSelect({
    wrapId: 'editCountryWrap', triggerId: 'editCountryTrigger', panelId: 'editCountryPanel',
    labelId: 'editCountryLabel', listId: 'editCountryList', selectedId: 'editCountrySelected',
    searchId: 'editCountrySearch', countId: 'editCountryCount',
    selectAllId: 'editCountrySelectAll', clearId: 'editCountryClear',
    getOptions: function () { return Store.COUNTRIES; },
    getSelected: function () { return state.editCountries; },
    setSelected: function (arr) { state.editCountries = arr || []; }
  });

  $('editCountryPanelClear').addEventListener('click', function () {
    state.editCountries = [];
    if (countryMulti && countryMulti.render) countryMulti.render();
  });

  var channelMulti = UI.bindMultiSelect({
    wrapId: 'editChannelWrap', triggerId: 'editChannelTrigger', panelId: 'editChannelPanel',
    labelId: 'editChannelLabel', listId: 'editChannelList',
    clearId: 'editChannelClear',
    getOptions: function () { return Store.CHANNELS; },
    getSelected: function () { return state.editChannels; },
    setSelected: function (arr) { state.editChannels = arr || []; }
  });

  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindSeg('editUserTypeSeg', function (v) { state.editUserType = v || '全部'; });
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
    ['editNameItem', 'editProductItem', 'editSceneItem', 'editPriorityItem', 'editSplitItem'].forEach(function (id) {
      setItemError(id, false);
    });
  }

  function currentSceneFields() {
    return Store.sceneFieldModels(Store.sceneById(state.editSceneId));
  }

  function defaultValues() {
    var values = {};
    currentSceneFields().forEach(function (f) {
      values[f.id] = Store.defaultFieldValue(f);
    });
    return values;
  }

  function emptySplit(name, percent) {
    return { id: UI.uid('g'), name: name || '默认组', percent: percent == null ? 100 : percent, values: defaultValues() };
  }

  function resetSplitsForScene() {
    if (!state.editSceneId) {
      state.editSplits = [];
      return;
    }
    if (!state.editSplits.length) {
      state.editSplits = [emptySplit('默认组', 100)];
      return;
    }
    var defaults = defaultValues();
    state.editSplits.forEach(function (g) {
      var next = {};
      Object.keys(defaults).forEach(function (fid) {
        next[fid] = g.values && g.values[fid] != null ? g.values[fid] : defaults[fid];
      });
      g.values = next;
    });
  }

  function splitPercentSum() {
    return state.editSplits.reduce(function (s, g) { return s + (Number(g.percent) || 0); }, 0);
  }

  function updateSplitSum() {
    var sum = splitPercentSum();
    var el = $('splitSum');
    el.textContent = '流量合计需为 100%，当前 ' + sum + '%';
    el.classList.toggle('is-error', sum !== 100);
  }

  function collectSplitsFromDom() {
    state.editSplits.forEach(function (g, i) {
      var nameEl = document.querySelector('[data-split-name="' + i + '"]');
      var pctEl = document.querySelector('[data-split-pct="' + i + '"]');
      if (nameEl) g.name = (nameEl.value || '').trim();
      if (pctEl) g.percent = parseInt(pctEl.value, 10);
      if (!isFinite(g.percent)) g.percent = 0;
      document.querySelectorAll('[data-split-val="' + i + '"]').forEach(function (inp) {
        var fid = inp.getAttribute('data-field');
        g.values[fid] = inp.value;
      });
      document.querySelectorAll('[data-split-switch="' + i + '"]').forEach(function (seg) {
        var fid = seg.getAttribute('data-field');
        var active = seg.querySelector('.seg__item.is-active');
        g.values[fid] = !!(active && active.getAttribute('data-value') === 'true');
      });
    });
  }

  function renderSplits() {
    var el = $('splitList');
    var addBtn = $('splitAdd');
    var sumEl = $('splitSum');
    if (!state.editSceneId) {
      el.innerHTML = '<div class="form-item__hint">请先选择产品与场景，分流组将按场景关联条件生成</div>';
      addBtn.hidden = true;
      sumEl.hidden = true;
      return;
    }
    addBtn.hidden = false;
    sumEl.hidden = false;
    var fields = currentSceneFields();
    el.innerHTML = state.editSplits.map(function (g, i) {
      var fieldsHtml = fields.map(function (f) {
        var val = g.values && g.values[f.id] != null ? g.values[f.id] : Store.defaultFieldValue(f);
        if (Store.isSwitchField(f)) {
          var on = val === true || val === 'true' || val === '是';
          return '<div class="split-field">' +
            '<div class="split-field__label">' + escapeHtml(f.name) + '</div>' +
            '<div class="seg" data-split-switch="' + i + '" data-field="' + escapeHtml(f.id) + '">' +
              '<button type="button" class="seg__item' + (on ? '' : ' is-active') + '" data-value="false">否</button>' +
              '<button type="button" class="seg__item' + (on ? ' is-active' : '') + '" data-value="true">是</button>' +
            '</div></div>';
        }
        if (f.componentType === '下拉选择') {
          var opts = (f.options || []).map(function (o) {
            var selected = String(o.value) === String(val) ? ' selected' : '';
            return '<option value="' + escapeHtml(String(o.value)) + '"' + selected + '>' + escapeHtml(o.label) + '</option>';
          }).join('');
          return '<div class="split-field">' +
            '<div class="split-field__label">' + escapeHtml(f.name) + '</div>' +
            '<select class="input" data-split-val="' + i + '" data-field="' + escapeHtml(f.id) + '">' + opts + '</select>' +
          '</div>';
        }
        if (f.componentType === 'Array') {
          return '<div class="split-field">' +
            '<div class="split-field__label">' + escapeHtml(f.name) + '</div>' +
            '<span class="form-item__hint split-field__hint">Array 结构由字段配置定义</span>' +
          '</div>';
        }
        return '<div class="split-field">' +
          '<div class="split-field__label">' + escapeHtml(f.name) + '</div>' +
          '<input class="input" data-split-val="' + i + '" data-field="' + escapeHtml(f.id) + '" value="' + escapeHtml(String(val == null ? '' : val)) + '" placeholder="请输入" />' +
        '</div>';
      }).join('');
      var del = state.editSplits.length > 1
        ? '<button class="link link--danger" type="button" data-split-del="' + i + '">删除</button>'
        : '';
      return '<div class="split-card">' +
        '<div class="split-card__head">' +
          '<input class="input" data-split-name="' + i + '" value="' + escapeHtml(g.name || '') + '" placeholder="分流组名称" />' +
          '<div class="split-card__pct"><input class="input" data-split-pct="' + i + '" value="' + escapeHtml(String(g.percent == null ? '' : g.percent)) + '" /><span class="split-card__pct-unit">%</span></div>' +
          del +
        '</div>' +
        '<div class="split-card__fields">' + (fieldsHtml || '<div class="form-item__hint">该场景暂无关联条件</div>') + '</div>' +
      '</div>';
    }).join('');
    updateSplitSum();
  }

  $('splitList').addEventListener('input', function (e) {
    var pct = e.target.getAttribute('data-split-pct');
    if (pct != null) {
      var i = Number(pct);
      if (state.editSplits[i]) state.editSplits[i].percent = parseInt(e.target.value, 10) || 0;
      updateSplitSum();
    }
  });

  $('splitList').addEventListener('click', function (e) {
    var del = e.target.closest('[data-split-del]');
    if (del) {
      collectSplitsFromDom();
      var idx = Number(del.getAttribute('data-split-del'));
      if (state.editSplits.length > 1) state.editSplits.splice(idx, 1);
      renderSplits();
      return;
    }
    var segBtn = e.target.closest('[data-split-switch] .seg__item');
    if (segBtn) {
      var seg = segBtn.parentElement;
      seg.querySelectorAll('.seg__item').forEach(function (b) { b.classList.remove('is-active'); });
      segBtn.classList.add('is-active');
    }
  });

  $('splitAdd').addEventListener('click', function () {
    collectSplitsFromDom();
    var n = state.editSplits.length + 1;
    state.editSplits.push(emptySplit('实验组' + (n - 1), 0));
    renderSplits();
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
        var target = targetingText(row);
        var splits = splitText(row);
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(Store.productName(row.productId)) + '">' + escapeHtml(Store.productName(row.productId)) + '</td>' +
          '<td>' + escapeHtml(Store.sceneName(row.sceneId)) + '</td>' +
          '<td title="' + escapeHtml(target) + '"><span class="cell-ellipsis">' + escapeHtml(target) + '</span></td>' +
          '<td title="' + escapeHtml(splits) + '"><span class="cell-ellipsis">' + escapeHtml(splits) + '</span></td>' +
          '<td class="col-num">' + escapeHtml(String(row.priority)) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link" type="button" data-action="copy">复制</button>' +
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

  function parseVersions(text) {
    return String(text || '').split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function fillForm(row, isCopy) {
    clearEditErrors();
    state.editProductId = row.productId || '';
    state.editSceneId = row.sceneId || '';
    state.editStatus = row.status || '启用';
    state.editUserType = row.userType || '全部';
    state.editCountries = (row.countries || []).slice();
    state.editChannels = (row.channels || []).slice();
    state.editSplits = Store.clone(row.splits || []);
    if (!state.editSplits.length) resetSplitsForScene();
    $('editName').value = isCopy ? (row.name || '') + '_副本' : (row.name || '');
    $('editPriority').value = row.priority == null ? '10' : String(row.priority);
    $('editVersions').value = (row.versions || []).join(', ');
    fillEditPanels();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel(state.editProductId);
    if (editSceneSelect && editSceneSelect.syncLabel) editSceneSelect.syncLabel(state.editSceneId);
    if (countryMulti && countryMulti.render) countryMulti.render();
    if (channelMulti && channelMulti.render) channelMulti.render();
    UI.setSegValue('editStatusSeg', state.editStatus);
    UI.setSegValue('editUserTypeSeg', state.editUserType);
    renderSplits();
  }

  function openAdd() {
    if (!Store.apps().length) {
      UI.showToast('请先在聚合应用中关联产品与场景', 'warning');
      return;
    }
    state.editMode = 'add';
    state.editId = null;
    $('editDrawerTitle').textContent = '添加策略';
    fillForm({
      name: '', productId: '', sceneId: '', priority: 10, status: '启用',
      countries: [], channels: [], userType: '全部', versions: [], splits: []
    }, false);
    UI.openDrawer('editDrawer');
  }

  function openEdit(row, isCopy) {
    state.editMode = isCopy ? 'add' : 'edit';
    state.editId = isCopy ? null : row.id;
    $('editDrawerTitle').textContent = isCopy ? '添加策略' : '编辑策略';
    fillForm(row, isCopy);
    UI.openDrawer('editDrawer');
  }

  function closeEdit() {
    UI.closeDrawer('editDrawer');
  }

  function submitEdit() {
    collectSplitsFromDom();
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var priorityRaw = ($('editPriority').value || '').trim();
    var ok = true;
    if (!name) {
      setItemError('editNameItem', true, '请输入策略名称');
      ok = false;
    }
    if (!state.editProductId) {
      setItemError('editProductItem', true, '请选择产品');
      ok = false;
    }
    if (!state.editSceneId) {
      setItemError('editSceneItem', true, '请选择场景');
      ok = false;
    }
    if (!/^-?\d+$/.test(priorityRaw)) {
      setItemError('editPriorityItem', true, '请输入整数');
      ok = false;
    }
    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (name && duplicated) {
      setItemError('editNameItem', true, '策略名称已存在');
      ok = false;
    }
    if (!state.editSplits.length) {
      setItemError('editSplitItem', true, '请至少配置一个分流组');
      ok = false;
    } else {
      var missingName = state.editSplits.some(function (g) { return !g.name; });
      if (missingName) {
        setItemError('editSplitItem', true, '请填写分流组名称');
        ok = false;
      } else if (splitPercentSum() !== 100) {
        setItemError('editSplitItem', true, '分流组流量合计须为 100%');
        ok = false;
      }
    }
    if (!ok) return;

    var payload = {
      name: name,
      productId: state.editProductId,
      sceneId: state.editSceneId,
      countries: state.editCountries.slice(),
      channels: state.editChannels.slice(),
      userType: state.editUserType || '全部',
      versions: parseVersions($('editVersions').value),
      priority: parseInt(priorityRaw, 10),
      status: state.editStatus || '启用',
      splits: Store.clone(state.editSplits)
    };

    if (state.editMode === 'add') {
      payload.id = UI.uid('p');
      ALL_ROWS.unshift(Store.touch(payload));
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      Object.keys(payload).forEach(function (k) { row[k] = payload[k]; });
      Store.touch(row);
    }
    Store.savePolicies(ALL_ROWS);
    closeEdit();
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function openDelete(row) {
    state.deleteId = row.id;
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var id = state.deleteId;
    if (!id) return;
    var idx = ALL_ROWS.findIndex(function (r) { return r.id === id; });
    if (idx !== -1) ALL_ROWS.splice(idx, 1);
    Store.savePolicies(ALL_ROWS);
    state.deleteId = null;
    UI.closeModal('deleteModal');
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', productId: '', sceneId: '', status: '' };
    $('filterName').value = '';
    fillFilterPanels();
    if (productFilter && productFilter.syncLabel) productFilter.syncLabel('');
    if (sceneFilter && sceneFilter.syncLabel) sceneFilter.syncLabel('');
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
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row, false);
    else if (action === 'copy') openEdit(row, true);
    else if (action === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editDrawer"]').forEach(function (btn) {
    btn.addEventListener('click', closeEdit);
  });
  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('deleteModal'); });
  });

  renderTable();
})();
