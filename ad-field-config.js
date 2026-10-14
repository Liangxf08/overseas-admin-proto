/* 字段配置 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var KEY_RE = /^[a-z][a-z0-9_]*$/;
  var CHILD_TYPES = Store.CHILD_COMPONENT_TYPES || ['数字输入', '文本输入', '开关', '下拉选择'];
  var NUMBER_OP_LABEL = { gte: '大于等于', lte: '小于等于', eq: '等于' };

  function normalizeNumberOp(op) {
    return NUMBER_OP_LABEL[op] ? op : 'gte';
  }

  var ALL_ROWS = Store.fields();

  var state = {
    draft: { keyword: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editComponentType: '数字输入',
    editStatus: '启用',
    editSelectMode: '单选',
    editNumberOp: 'gte',
    editOptions: [],
    editChildren: [],
    optionDragIndex: null,
    childOptionsIndex: null,
    childOptionsDraft: [],
    deleteId: null
  };

  function applyFilters() {
    state.applied = {
      keyword: (state.draft.keyword || '').trim(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice().sort(Store.byUpdatedDesc);
    if (!f) return rows;
    return rows.filter(function (row) {
      if (f.keyword) {
        var kw = f.keyword.toLowerCase();
        var nameHit = String(row.name || '').toLowerCase().indexOf(kw) !== -1;
        var keyHit = String(row.key || '').toLowerCase().indexOf(kw) !== -1;
        if (!nameHit && !keyHit) return false;
      }
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

  var opSelect = UI.bindSingleSelect({
    wrapId: 'editOpWrap',
    triggerId: 'editOpTrigger',
    panelId: 'editOpPanel',
    labelId: 'editOpLabel',
    getValue: function () { return state.editNumberOp; },
    formatValue: function (v) { return NUMBER_OP_LABEL[v] || '大于等于'; },
    onChange: function (v) { state.editNumberOp = normalizeNumberOp(v); }
  });

  function restoreOpPanel() {
    var panel = $('editOpPanel');
    var wrap = $('editOpWrap');
    if (!panel || !wrap) return;
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.width = '';
    panel.style.right = '';
    panel.style.zIndex = '';
    panel.style.margin = '';
    if (panel.parentNode !== wrap) wrap.appendChild(panel);
  }

  function placeOpPanel() {
    var panel = $('editOpPanel');
    var trigger = $('editOpTrigger');
    if (!panel || !trigger || !panel.classList.contains('is-open')) return;
    var rect = trigger.getBoundingClientRect();
    document.body.appendChild(panel);
    panel.style.position = 'fixed';
    panel.style.zIndex = '1300';
    panel.style.margin = '0';
    panel.style.right = 'auto';
    panel.style.left = rect.left + 'px';
    panel.style.width = rect.width + 'px';
    var h = panel.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var dropup = spaceBelow < h + 8 && rect.top > h + 8;
    panel.style.top = (dropup ? rect.top - h - 4 : rect.bottom + 4) + 'px';
  }

  $('editOpTrigger').addEventListener('click', function () {
    var panel = $('editOpPanel');
    if (panel && panel.classList.contains('is-open')) placeOpPanel();
    else restoreOpPanel();
  });
  $('editOpPanel').addEventListener('click', function () { setTimeout(restoreOpPanel, 0); });
  document.addEventListener('click', function () {
    var panel = $('editOpPanel');
    if (panel && !panel.classList.contains('is-open') && panel.parentNode === document.body) restoreOpPanel();
  });
  var editModalBody = document.querySelector('#editModal .modal__body');
  if (editModalBody) {
    editModalBody.addEventListener('scroll', function () {
      var panel = $('editOpPanel');
      var trigger = $('editOpTrigger');
      if (!panel || !panel.classList.contains('is-open')) return;
      panel.classList.remove('is-open');
      if (trigger) trigger.classList.remove('is-open');
      restoreOpPanel();
    });
  }

  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindSeg('editTypeSeg', function (v) {
    state.editComponentType = v || '数字输入';
    if (v === '下拉选择' && !state.editOptions.length) state.editOptions = [{ label: '', value: '' }];
    if (v === '下拉选择' && !state.editSelectMode) state.editSelectMode = '单选';
    if (v === 'Array' && !state.editChildren.length) {
      state.editChildren = [emptyChild()];
    }
    syncTypeUi();
  });

  UI.bindSeg('editSelectModeSeg', function (v) { state.editSelectMode = v || '单选'; });

  UI.bindInputClearable({ wrapId: 'filterKeywordWrap', clearId: 'filterKeywordClear' });
  UI.bindInputClearable({ wrapId: 'editNameClearWrap', clearId: 'editNameClear' });
  UI.bindInputClearable({ wrapId: 'editKeyClearWrap', clearId: 'editKeyClear' });
  UI.bindInputClearable({ wrapId: 'editDescClearWrap', clearId: 'editDescClear' });

  $('filterKeyword').addEventListener('input', function () { state.draft.keyword = this.value || ''; });

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
    ['editNameItem', 'editKeyItem', 'editTypeItem', 'editMinItem', 'editMaxItem', 'editMaxLenItem', 'editMaxRowsItem', 'editOptionsItem', 'editChildrenItem'].forEach(function (id) {
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
    $('editOpItem').hidden = type !== '数字输入';
    $('editPlaceholderItem').hidden = type !== '文本输入';
    $('editMaxLenItem').hidden = type !== '文本输入';
    $('editOnValueItem').hidden = type !== '开关';
    $('editOffValueItem').hidden = type !== '开关';
    $('editSelectModeItem').hidden = type !== '下拉选择';
    $('editOptionsItem').hidden = type !== '下拉选择';
    $('editMaxRowsItem').hidden = type !== 'Array';
    $('editChildrenItem').hidden = type !== 'Array';
    if (type === '下拉选择') {
      UI.setSegValue('editSelectModeSeg', state.editSelectMode || '单选');
      renderOptions();
    }
    if (type === 'Array') renderChildren();
  }

  var DRAG_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
    '<circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>' +
    '<circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>' +
    '<circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>' +
    '</svg>';

  function renderOptions() {
    var list = $('optionList');
    if (!state.editOptions.length) state.editOptions = [{ label: '', value: '' }];
    list.innerHTML = state.editOptions.map(function (row, i) {
      return '<div class="option-row" data-opt-row="' + i + '">' +
        '<span class="option-drag" draggable="true" title="拖拽排序" data-opt-drag="' + i + '">' + DRAG_SVG + '</span>' +
        '<input class="input" data-opt-value="' + i + '" value="' + escapeHtml(row.value || '') + '" placeholder="选项值" autocomplete="off" />' +
        '<input class="input" data-opt-label="' + i + '" value="' + escapeHtml(row.label || '') + '" placeholder="选项名" autocomplete="off" />' +
        '<button class="link link--danger" type="button" data-opt-del="' + i + '">删除</button>' +
      '</div>';
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

  function emptyChild() {
    return {
      name: '',
      key: nextChildKey(),
      componentType: '数字输入',
      min: null,
      max: null,
      numberOp: 'gte',
      placeholder: '',
      maxLength: null,
      onValue: '',
      offValue: '',
      options: []
    };
  }

  function nextChildKey() {
    var max = 0;
    state.editChildren.forEach(function (c) {
      var m = String(c.key || '').match(/^row_(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'row_' + (max + 1);
  }

  function normalizeChild(row) {
    var c = row || {};
    return {
      name: c.name || '',
      key: c.key || '',
      componentType: c.componentType || '数字输入',
      min: c.min == null ? null : c.min,
      max: c.max == null ? null : c.max,
      numberOp: c.componentType === '数字输入' ? normalizeNumberOp(c.numberOp) : '',
      placeholder: c.placeholder || '',
      maxLength: c.maxLength == null ? null : c.maxLength,
      onValue: c.onValue || '',
      offValue: c.offValue || '',
      options: Store.clone(c.options && c.options.length ? c.options : [])
    };
  }

  function childOptionCount(row) {
    return (row.options || []).filter(function (o) { return o.label && o.value; }).length;
  }

  function childOpHtml(row, i) {
    var op = normalizeNumberOp(row.numberOp);
    var meta = NUMBER_OP_LABEL[op];
    var options = ['gte', 'lte', 'eq'].map(function (value) {
      var active = value === op ? ' is-active' : '';
      return '<button class="single-option' + active + '" type="button" data-value="' + value + '">' + escapeHtml(NUMBER_OP_LABEL[value]) + '</button>';
    }).join('');
    return '<div class="child-op" data-child-op="' + i + '" data-value="' + op + '">' +
      '<button class="select-trigger" type="button" aria-label="运算符">' +
        '<span class="select-trigger__text">' + escapeHtml(meta) + '</span>' +
        '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
      '</button>' +
      '<div class="single-panel child-op-panel">' + options + '</div>' +
    '</div>';
  }

  function renderChildConfig(row, i) {
    var t = row.componentType || '数字输入';
    if (t === '数字输入') {
      return '<div class="child-config">' +
        '<input class="input" data-child-min="' + i + '" value="' + escapeHtml(row.min == null ? '' : String(row.min)) + '" placeholder="最小值" autocomplete="off" />' +
        '<input class="input" data-child-max="' + i + '" value="' + escapeHtml(row.max == null ? '' : String(row.max)) + '" placeholder="最大值" autocomplete="off" />' +
        childOpHtml(row, i) +
      '</div>';
    }
    if (t === '文本输入') {
      return '<div class="child-config">' +
        '<input class="input" data-child-placeholder="' + i + '" value="' + escapeHtml(row.placeholder || '') + '" placeholder="占位文本" autocomplete="off" />' +
        '<input class="input" data-child-maxlen="' + i + '" value="' + escapeHtml(row.maxLength == null ? '' : String(row.maxLength)) + '" placeholder="最大长度" autocomplete="off" />' +
      '</div>';
    }
    if (t === '开关') {
      return '<div class="child-config">' +
        '<input class="input" data-child-on="' + i + '" value="' + escapeHtml(row.onValue || '') + '" placeholder="开启值" autocomplete="off" />' +
        '<input class="input" data-child-off="' + i + '" value="' + escapeHtml(row.offValue || '') + '" placeholder="关闭值" autocomplete="off" />' +
      '</div>';
    }
    return '<button class="child-opt-btn" type="button" data-child-opts="' + i + '">配置可选项 (' + childOptionCount(row) + ')</button>';
  }

  function renderChildren() {
    closeChildOpPanels();
    var body = $('childBody');
    if (!state.editChildren.length) {
      body.innerHTML = '<tr><td colspan="5" class="array-empty">暂无子字段</td></tr>';
      return;
    }
    body.innerHTML = state.editChildren.map(function (row, i) {
      var typeOpts = CHILD_TYPES.map(function (t) {
        return '<option value="' + escapeHtml(t) + '"' + (row.componentType === t ? ' selected' : '') + '>' + escapeHtml(t) + '</option>';
      }).join('');
      return '<tr data-child-row="' + i + '">' +
        '<td><input class="input" data-child-key="' + i + '" value="' + escapeHtml(row.key || '') + '" placeholder="子字段Key" autocomplete="off" /></td>' +
        '<td><input class="input" data-child-name="' + i + '" value="' + escapeHtml(row.name || '') + '" placeholder="子字段名称" autocomplete="off" /></td>' +
        '<td><select class="input" data-child-type="' + i + '">' + typeOpts + '</select></td>' +
        '<td>' + renderChildConfig(row, i) + '</td>' +
        '<td class="col-op"><button class="link link--danger" type="button" data-child-del="' + i + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  function collectChildren() {
    state.editChildren.forEach(function (row, i) {
      var nameEl = document.querySelector('[data-child-name="' + i + '"]');
      var keyEl = document.querySelector('[data-child-key="' + i + '"]');
      var typeEl = document.querySelector('[data-child-type="' + i + '"]');
      var minEl = document.querySelector('[data-child-min="' + i + '"]');
      var maxEl = document.querySelector('[data-child-max="' + i + '"]');
      var phEl = document.querySelector('[data-child-placeholder="' + i + '"]');
      var lenEl = document.querySelector('[data-child-maxlen="' + i + '"]');
      var onEl = document.querySelector('[data-child-on="' + i + '"]');
      var offEl = document.querySelector('[data-child-off="' + i + '"]');
      if (nameEl) row.name = (nameEl.value || '').trim();
      if (keyEl) row.key = (keyEl.value || '').trim();
      if (typeEl) row.componentType = typeEl.value || '数字输入';
      if (row.componentType === '数字输入') {
        var opEl = document.querySelector('[data-child-op="' + i + '"]');
        var op = opEl ? opEl.getAttribute('data-value') : row.numberOp;
        row.numberOp = normalizeNumberOp(op);
      } else {
        row.numberOp = '';
      }
      if (minEl) {
        var minRes = parseNumber(minEl.value);
        row.min = minRes.empty || minRes.error ? null : minRes.value;
      }
      if (maxEl) {
        var maxRes = parseNumber(maxEl.value);
        row.max = maxRes.empty || maxRes.error ? null : maxRes.value;
      }
      if (phEl) row.placeholder = (phEl.value || '').trim();
      if (lenEl) {
        var lenRes = parseNumber(lenEl.value);
        row.maxLength = lenRes.empty || lenRes.error ? null : lenRes.value;
      }
      if (onEl) row.onValue = (onEl.value || '').trim();
      if (offEl) row.offValue = (offEl.value || '').trim();
    });
  }

  $('optionList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-opt-del]');
    if (!btn) return;
    collectOptions();
    var i = Number(btn.getAttribute('data-opt-del'));
    if (state.editOptions.length > 1) state.editOptions.splice(i, 1);
    else state.editOptions = [{ label: '', value: '' }];
    renderOptions();
  });

  $('optionList').addEventListener('dragstart', function (e) {
    var handle = e.target.closest('[data-opt-drag]');
    if (!handle) { e.preventDefault(); return; }
    collectOptions();
    state.optionDragIndex = Number(handle.getAttribute('data-opt-drag'));
    var row = handle.closest('[data-opt-row]');
    if (row) row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(state.optionDragIndex));
  });
  $('optionList').addEventListener('dragover', function (e) {
    if (state.optionDragIndex == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var row = e.target.closest('[data-opt-row]');
    if (!row) return;
    $('optionList').querySelectorAll('.option-row').forEach(function (el) {
      el.classList.toggle('is-drop-target', el === row);
    });
  });
  $('optionList').addEventListener('drop', function (e) {
    e.preventDefault();
    var row = e.target.closest('[data-opt-row]');
    var from = state.optionDragIndex;
    state.optionDragIndex = null;
    $('optionList').querySelectorAll('.option-row').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
    if (!row || from == null) return;
    collectOptions();
    var to = Number(row.getAttribute('data-opt-row'));
    if (to === from) return;
    var item = state.editOptions.splice(from, 1)[0];
    state.editOptions.splice(to, 0, item);
    renderOptions();
  });
  $('optionList').addEventListener('dragend', function () {
    state.optionDragIndex = null;
    $('optionList').querySelectorAll('.option-row').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
  });

  function clearChildOpPanelStyle(panel) {
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.width = '';
    panel.style.right = '';
    panel.style.zIndex = '';
    panel.style.margin = '';
  }

  function restoreChildOpPanel(panel) {
    if (!panel) return;
    clearChildOpPanelStyle(panel);
    var home = panel._opHome;
    if (home && home.isConnected) home.appendChild(panel);
    else if (panel.parentNode === document.body) panel.remove();
  }

  function closeChildOpPanels() {
    document.querySelectorAll('.child-op-panel').forEach(function (panel) {
      if (!panel._opHome) return;
      panel.classList.remove('is-open');
      restoreChildOpPanel(panel);
    });
    document.querySelectorAll('.child-op .select-trigger.is-open').forEach(function (btn) {
      btn.classList.remove('is-open');
    });
  }

  function placeChildOpPanel(trigger) {
    var box = trigger.closest('.child-op');
    var panel = box && (box._openPanel && box._openPanel._opHome === box ? box._openPanel : box.querySelector('.child-op-panel'));
    if (!box || !panel) return;
    panel._opHome = box;
    box._openPanel = panel;
    document.body.appendChild(panel);
    panel.classList.add('is-open');
    panel.style.position = 'fixed';
    panel.style.zIndex = '1300';
    panel.style.margin = '0';
    panel.style.right = 'auto';
    var rect = trigger.getBoundingClientRect();
    panel.style.left = rect.left + 'px';
    panel.style.width = rect.width + 'px';
    var h = panel.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom;
    var dropup = spaceBelow < h + 8 && rect.top > h + 8;
    panel.style.top = (dropup ? rect.top - h - 4 : rect.bottom + 4) + 'px';
  }

  $('childBody').addEventListener('click', function (e) {
    var trig = e.target.closest('.child-op .select-trigger');
    if (trig) {
      e.stopPropagation();
      var box = trig.closest('.child-op');
      var panel = box._openPanel && box._openPanel._opHome === box ? box._openPanel : box.querySelector('.child-op-panel');
      var willOpen = !(panel && panel.classList.contains('is-open'));
      closeChildOpPanels();
      if (willOpen && panel) {
        trig.classList.add('is-open');
        placeChildOpPanel(trig);
      }
      return;
    }
    var del = e.target.closest('[data-child-del]');
    if (del) {
      collectChildren();
      var i = Number(del.getAttribute('data-child-del'));
      state.editChildren.splice(i, 1);
      renderChildren();
      return;
    }
    var opts = e.target.closest('[data-child-opts]');
    if (opts) {
      collectChildren();
      openChildOptions(Number(opts.getAttribute('data-child-opts')));
    }
  });

  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.child-op-panel .single-option');
    if (opt) {
      var panel = opt.closest('.child-op-panel');
      var box = panel && panel._opHome;
      if (box) {
        box.setAttribute('data-value', opt.getAttribute('data-value') || 'gte');
        var text = box.querySelector('.select-trigger__text');
        if (text) text.textContent = (opt.textContent || '').trim();
        panel.querySelectorAll('.single-option').forEach(function (item) {
          item.classList.toggle('is-active', item === opt);
        });
      }
      closeChildOpPanels();
      return;
    }
    if (e.target.closest('.child-op') || e.target.closest('.child-op-panel')) return;
    closeChildOpPanels();
  });

  var childTableWrap = document.querySelector('#editChildrenItem .param-table-wrap');
  if (childTableWrap) childTableWrap.addEventListener('scroll', closeChildOpPanels);

  $('childBody').addEventListener('change', function (e) {
    var sel = e.target.closest('[data-child-type]');
    if (!sel) return;
    collectChildren();
    renderChildren();
  });

  $('addOptionBtn').addEventListener('click', function () {
    collectOptions();
    state.editOptions.push({ label: '', value: '' });
    renderOptions();
  });

  $('addChildBtn').addEventListener('click', function () {
    collectChildren();
    state.editChildren.push(emptyChild());
    renderChildren();
  });

  function renderChildOptions() {
    var list = $('childOptionList');
    if (!state.childOptionsDraft.length) state.childOptionsDraft = [{ label: '', value: '' }];
    list.innerHTML = state.childOptionsDraft.map(function (row, i) {
      return '<div class="option-row" data-child-opt-row="' + i + '">' +
        '<input class="input" data-child-opt-value="' + i + '" value="' + escapeHtml(row.value || '') + '" placeholder="选项值" autocomplete="off" />' +
        '<input class="input" data-child-opt-label="' + i + '" value="' + escapeHtml(row.label || '') + '" placeholder="选项名" autocomplete="off" />' +
        '<button class="link link--danger" type="button" data-child-opt-del="' + i + '">删除</button>' +
      '</div>';
    }).join('');
  }

  function collectChildOptionsDraft() {
    state.childOptionsDraft.forEach(function (row, i) {
      var labelEl = document.querySelector('[data-child-opt-label="' + i + '"]');
      var valueEl = document.querySelector('[data-child-opt-value="' + i + '"]');
      if (labelEl) row.label = (labelEl.value || '').trim();
      if (valueEl) row.value = (valueEl.value || '').trim();
    });
  }

  function openChildOptions(index) {
    var row = state.editChildren[index];
    if (!row) return;
    state.childOptionsIndex = index;
    state.childOptionsDraft = Store.clone(row.options && row.options.length ? row.options : [{ label: '', value: '' }]);
    setItemError('childOptionsItem', false);
    renderChildOptions();
    UI.openModal('childOptionsModal');
  }

  $('childOptionList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-child-opt-del]');
    if (!btn) return;
    collectChildOptionsDraft();
    var i = Number(btn.getAttribute('data-child-opt-del'));
    if (state.childOptionsDraft.length > 1) state.childOptionsDraft.splice(i, 1);
    else state.childOptionsDraft = [{ label: '', value: '' }];
    renderChildOptions();
  });

  $('addChildOptionBtn').addEventListener('click', function () {
    collectChildOptionsDraft();
    state.childOptionsDraft.push({ label: '', value: '' });
    renderChildOptions();
  });

  $('childOptionsSubmit').addEventListener('click', function () {
    collectChildOptionsDraft();
    var options = state.childOptionsDraft.filter(function (o) { return o.label && o.value; });
    var idx = state.childOptionsIndex;
    if (idx != null && state.editChildren[idx]) {
      state.editChildren[idx].options = options;
    }
    state.childOptionsIndex = null;
    UI.closeModal('childOptionsModal');
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
          '<td title="' + escapeHtml(row.key) + '">' + escapeHtml(row.key) + '</td>' +
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
    state.editNumberOp = 'gte';
    if (opSelect && opSelect.syncLabel) opSelect.syncLabel('gte');
    $('editPlaceholder').value = '';
    $('editMaxLen').value = '';
    $('editOnValue').value = '';
    $('editOffValue').value = '';
    $('editMaxRows').value = '';
    state.editComponentType = '数字输入';
    state.editStatus = '启用';
    state.editSelectMode = '单选';
    state.editOptions = [{ label: '', value: '' }];
    state.editChildren = [];
    state.editChildren = [emptyChild()];
    UI.setSegValue('editStatusSeg', '启用');
    UI.setSegValue('editTypeSeg', '数字输入');
    UI.setSegValue('editSelectModeSeg', '单选');
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
    state.editSelectMode = row.selectMode || '单选';
    state.editOptions = Store.clone(row.options && row.options.length ? row.options : [{ label: '', value: '' }]);
    state.editChildren = Store.clone(row.children && row.children.length ? row.children : [emptyChild()]).map(normalizeChild);
    clearEditErrors();
    $('editModalTitle').textContent = '编辑字段';
    $('editName').value = row.name;
    $('editKey').value = row.key;
    $('editKey').disabled = true;
    $('editKey').readOnly = true;
    $('editDesc').value = row.desc || '';
    $('editMin').value = row.min == null ? '' : String(row.min);
    $('editMax').value = row.max == null ? '' : String(row.max);
    state.editNumberOp = normalizeNumberOp(row.numberOp);
    if (opSelect && opSelect.syncLabel) opSelect.syncLabel(state.editNumberOp);
    $('editPlaceholder').value = row.placeholder || '';
    $('editMaxLen').value = row.maxLength == null ? '' : String(row.maxLength);
    $('editOnValue').value = row.onValue || '';
    $('editOffValue').value = row.offValue || '';
    $('editMaxRows').value = row.maxRows == null ? '' : String(row.maxRows);
    UI.setSegValue('editStatusSeg', state.editStatus);
    UI.setSegValue('editTypeSeg', state.editComponentType);
    UI.setSegValue('editSelectModeSeg', state.editSelectMode);
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

    var placeholder = ($('editPlaceholder').value || '').trim();
    var maxLenVal = null;
    if (type === '文本输入') {
      var maxLenRes = parseNumber($('editMaxLen').value);
      if (maxLenRes.error || (!maxLenRes.empty && (maxLenRes.value < 0 || maxLenRes.value % 1 !== 0))) {
        setItemError('editMaxLenItem', true, '请输入有效整数');
        ok = false;
      } else if (!maxLenRes.empty) maxLenVal = maxLenRes.value;
    }
    var onValue = ($('editOnValue').value || '').trim();
    var offValue = ($('editOffValue').value || '').trim();

    var options = [];
    if (type === '下拉选择') {
      options = state.editOptions.filter(function (o) { return o.label && o.value; });
      if (!options.length) {
        setItemError('editOptionsItem', true, '请至少添加一个完整选项');
        ok = false;
      }
    }

    var maxRowsVal = null;
    if (type === 'Array') {
      var maxRowsRes = parseNumber($('editMaxRows').value);
      if (maxRowsRes.error || (!maxRowsRes.empty && (maxRowsRes.value < 1 || maxRowsRes.value % 1 !== 0))) {
        setItemError('editMaxRowsItem', true, '请输入大于 0 的整数');
        ok = false;
      } else if (!maxRowsRes.empty) maxRowsVal = maxRowsRes.value;
    }

    var children = [];
    if (type === 'Array') {
      children = state.editChildren.filter(function (c) { return c.name && c.key; });
      if (!children.length) {
        setItemError('editChildrenItem', true, '请至少添加一个完整子字段');
        ok = false;
      }
      var badKey = children.some(function (c) { return !KEY_RE.test(c.key); });
      if (children.length && badKey) {
        setItemError('editChildrenItem', true, '子字段Key仅支持小写字母开头的字母、数字、下划线');
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
      numberOp: type === '数字输入' ? normalizeNumberOp(state.editNumberOp) : '',
      placeholder: type === '文本输入' ? placeholder : '',
      maxLength: type === '文本输入' ? maxLenVal : null,
      onValue: type === '开关' ? onValue : '',
      offValue: type === '开关' ? offValue : '',
      selectMode: type === '下拉选择' ? (state.editSelectMode || '单选') : '',
      options: type === '下拉选择' ? options : [],
      maxRows: type === 'Array' ? maxRowsVal : null,
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
    state.draft = { keyword: '', status: '' };
    $('filterKeyword').value = '';
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
  document.querySelectorAll('[data-close="childOptionsModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.childOptionsIndex = null;
      UI.closeModal('childOptionsModal');
    });
  });
  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('deleteModal'); });
  });

  renderTable();
})();
