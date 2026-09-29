/* 场景管理 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var KEY_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
  var ALL_ROWS = Store.scenes();

  var state = {
    draft: { keyword: '', sceneType: '', adSwitch: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editFields: [],
    editSceneType: '自定义',
    editStatus: '启用',
    editAdSwitch: false,
    fieldDragIndex: null,
    rowDragId: null,
    arrayPresetIndex: null
  };

  function applyFilters() {
    state.applied = {
      keyword: (state.draft.keyword || '').trim(),
      sceneType: state.draft.sceneType || '',
      adSwitch: state.draft.adSwitch || '',
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice();
    if (!f) return rows;
    return rows.filter(function (row) {
      if (f.keyword) {
        var kw = f.keyword.toLowerCase();
        var nameHit = String(row.name || '').toLowerCase().indexOf(kw) !== -1;
        var keyHit = String(row.key || '').toLowerCase().indexOf(kw) !== -1;
        if (!nameHit && !keyHit) return false;
      }
      if (f.sceneType && row.sceneType !== f.sceneType) return false;
      if (f.adSwitch === '开' && row.adSwitch !== true) return false;
      if (f.adSwitch === '关' && row.adSwitch === true) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function adSwitchDot(on) {
    return '<span class="status-dot status-dot--' + (on ? 'done' : 'error') + '">' + (on ? '开' : '关') + '</span>';
  }

  var sceneTypeFilter = UI.bindSingleSelect({
    wrapId: 'sceneTypeWrap', triggerId: 'sceneTypeTrigger', panelId: 'sceneTypePanel',
    labelId: 'sceneTypeLabel', clearId: 'sceneTypeClear', prefix: '场景类型：',
    getValue: function () { return state.draft.sceneType; },
    onChange: function (v) { state.draft.sceneType = v || ''; }
  });

  var adSwitchFilter = UI.bindSingleSelect({
    wrapId: 'adSwitchWrap', triggerId: 'adSwitchTrigger', panelId: 'adSwitchPanel',
    labelId: 'adSwitchLabel', clearId: 'adSwitchClear', prefix: '广告开关：',
    getValue: function () { return state.draft.adSwitch; },
    onChange: function (v) { state.draft.adSwitch = v || ''; }
  });

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
    labelId: 'statusLabel', clearId: 'statusClear', prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
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
    getSelected: function () {
      return state.editFields.map(function (c) { return c.fieldId; });
    },
    setSelected: function (arr) { syncEditFields(arr || []); }
  });

  $('editFieldPanelClear').addEventListener('click', function () {
    syncEditFields([]);
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
  });

  UI.bindSeg('editSceneTypeSeg', function (v) { state.editSceneType = v || '自定义'; });

  function resetFieldPanel() {
    var panel = $('editFieldPanel');
    var host = panel && panel.__sceneHost;
    if (!panel) return;
    panel.style.position = '';
    panel.style.margin = '';
    panel.style.zIndex = '';
    panel.style.width = '';
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.top = '';
    panel.style.bottom = '';
    if (host && panel.parentElement !== host) host.appendChild(panel);
  }

  function placeFieldPanel() {
    var panel = $('editFieldPanel');
    var trigger = $('editFieldTrigger');
    var host = $('editFieldWrap');
    if (!panel || !trigger || !host) return;
    if (!panel.classList.contains('is-open')) {
      resetFieldPanel();
      return;
    }
    var rect = trigger.getBoundingClientRect();
    var modalBody = document.querySelector('#editModal .modal__body');
    var bodyRect = modalBody ? modalBody.getBoundingClientRect() : null;
    var triggerVisible = !bodyRect || (rect.bottom > bodyRect.top && rect.top < bodyRect.bottom);
    if (!triggerVisible) {
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
      resetFieldPanel();
      return;
    }
    panel.__sceneHost = host;
    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    var pad = 8;
    var gap = 4;
    var want = 296;
    var spaceBelow = Math.max(0, window.innerHeight - rect.bottom - gap - pad);
    var spaceAbove = Math.max(0, rect.top - gap - pad);
    var below = spaceBelow >= want || spaceBelow >= spaceAbove;
    var height = Math.min(want, below ? spaceBelow : spaceAbove, window.innerHeight - pad * 2);
    var width = Math.min(480, window.innerWidth - pad * 2);
    var left = rect.left;
    if (left + width > window.innerWidth - pad) left = window.innerWidth - pad - width;
    if (left < pad) left = pad;
    var top = below ? rect.bottom + gap : rect.top - gap - height;
    if (top < pad) top = pad;
    if (top + height > window.innerHeight - pad) top = Math.max(pad, window.innerHeight - pad - height);
    panel.style.position = 'fixed';
    panel.style.margin = '0';
    panel.style.zIndex = '1200';
    panel.style.width = width + 'px';
    panel.style.height = height + 'px';
    panel.style.maxHeight = height + 'px';
    panel.style.left = left + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.top = top + 'px';
  }

  $('editFieldTrigger').addEventListener('click', placeFieldPanel);
  $('editFieldPanel').addEventListener('click', function (e) { e.stopPropagation(); });
  document.addEventListener('click', placeFieldPanel);
  document.querySelector('#editModal .modal__body').addEventListener('scroll', placeFieldPanel);
  window.addEventListener('resize', placeFieldPanel);
  UI.bindSeg('editStatusSeg', function (v) { state.editStatus = v || '启用'; });
  UI.bindInputClearable({ wrapId: 'filterKeywordWrap', clearId: 'filterKeywordClear' });
  UI.bindInputClearable({ wrapId: 'editNameClearWrap', clearId: 'editNameClear' });
  UI.bindInputClearable({ wrapId: 'editKeyClearWrap', clearId: 'editKeyClear' });
  UI.bindInputClearable({ wrapId: 'editRemarkClearWrap', clearId: 'editRemarkClear' });

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
    ['editNameItem', 'editKeyItem', 'editFieldItem'].forEach(function (id) {
      setItemError(id, false);
    });
  }

  var DRAG_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
    '<circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>' +
    '<circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>' +
    '<circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>' +
    '</svg>';

  function fieldIds() {
    return state.editFields.map(function (c) { return c.fieldId; });
  }

  function presetDefault(field) {
    if (!field) return '';
    if (field.componentType === '开关') return true;
    if (field.componentType === '下拉选择' && field.selectMode === '多选') return [];
    if (field.componentType === 'Array') return { values: {}, required: {} };
    return '';
  }

  function emptyChildDefault(field) {
    if (!field) return '';
    if (field.componentType === '开关') return false;
    if (field.componentType === '下拉选择' && field.selectMode === '多选') return [];
    return '';
  }

  function arrayPresetMap(value) {
    if (value && value.values && typeof value.values === 'object' && !Array.isArray(value.values)) return value.values;
    if (value && !Array.isArray(value) && typeof value === 'object') return value;
    if (Array.isArray(value) && value[0] && typeof value[0] === 'object') return value[0];
    return {};
  }

  function arrayPresetState(value) {
    var required = value && value.required && typeof value.required === 'object' ? value.required : {};
    return { values: arrayPresetMap(value), required: required };
  }

  function presetFilled(field, value) {
    var type = field ? field.componentType : '';
    if (type === '开关') return value === true || value === 'true' || value === '是';
    if (type === '下拉选择' && field.selectMode === '多选') return multiValues(value).length > 0;
    if (type === '数字输入') return value != null && value !== '';
    return value != null && value !== '';
  }

  function arrayPresetText(field, value) {
    var children = (field && field.children) || [];
    var map = arrayPresetState(value).values;
    var filled = children.filter(function (child) {
      var key = child.key || child.name || '';
      return Object.prototype.hasOwnProperty.call(map, key) && presetFilled(child, map[key]);
    }).length;
    return '预设子字段 (' + filled + '/' + children.length + ')';
  }

  function multiValues(value) {
    if (Array.isArray(value)) return value.map(function (v) { return String(v); });
    if (value == null || value === '') return [];
    return [String(value)];
  }

  function syncEditFields(ids) {
    collectFieldConfigs();
    var map = {};
    state.editFields.forEach(function (c) { map[c.fieldId] = c; });
    var next = state.editFields.filter(function (c) { return ids.indexOf(c.fieldId) !== -1; });
    ids.forEach(function (id) {
      if (map[id]) return;
      next.push({
        fieldId: id,
        defaultValue: presetDefault(Store.fieldById(id)),
        required: false
      });
    });
    state.editFields = next;
    renderFieldConfigs();
  }

  var SELECT_ARROW = '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  var SELECT_CLEAR = '<button class="select-clear" type="button" aria-label="清除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>';

  function syncDefSelect(wrap, value, labelText) {
    if (!wrap) return;
    var next = value == null ? '' : String(value);
    wrap.setAttribute('data-value', next);
    wrap.classList.toggle('has-value', !!next);
    var text = wrap.querySelector('.select-trigger__text');
    if (text) {
      if (next) text.textContent = labelText != null ? labelText : next;
      else text.innerHTML = '<span class="muted">请选择</span>';
    }
    var panel = getDefPanel(wrap);
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (el) {
        el.classList.toggle('is-active', (el.getAttribute('data-value') || '') === next);
      });
    }
  }

  function singleSelectHtml(field, value, attrs) {
    var opts = (field && field.options) || [];
    if (!opts.length) return '<span class="scene-def-hint">未配置可选项</span>';
    var current = value == null ? '' : String(value);
    var hit = opts.filter(function (o) { return String(o.value) === current; })[0];
    if (!hit) current = '';
    var label = hit ? escapeHtml(hit.label) : '<span class="muted">请选择</span>';
    var items = opts.map(function (o) {
      var active = String(o.value) === current ? ' is-active' : '';
      return '<button type="button" class="single-option' + active + '" data-value="' + escapeHtml(String(o.value)) + '">' + escapeHtml(o.label) + '</button>';
    }).join('');
    return '<div class="scene-def-select' + (current ? ' has-value' : '') + '" ' + attrs + ' data-value="' + escapeHtml(current) + '">' +
      '<button type="button" class="select-trigger scene-def-trigger"><span class="select-trigger__text">' + label + '</span>' + SELECT_ARROW + '</button>' +
      SELECT_CLEAR +
      '<div class="scene-def-panel">' + items + '</div></div>';
  }

  function getDefPanel(wrap) {
    if (!wrap) return null;
    if (wrap.__defPanel && document.contains(wrap.__defPanel)) return wrap.__defPanel;
    var nested = wrap.querySelector('.scene-def-panel');
    if (nested) {
      wrap.__defPanel = nested;
      nested.__defHost = wrap;
      return nested;
    }
    var found = null;
    document.querySelectorAll('body > .scene-def-panel').forEach(function (panel) {
      if (panel.__defHost === wrap) found = panel;
    });
    if (found) wrap.__defPanel = found;
    return found;
  }

  function closeDefPanels() {
    document.querySelectorAll('.scene-def-panel.is-open, body > .scene-def-panel').forEach(function (panel) {
      panel.classList.remove('is-open');
      panel.style.position = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.bottom = '';
      panel.style.width = '';
      panel.style.margin = '';
      panel.style.zIndex = '';
      panel.style.maxHeight = '';
      var host = panel.__defHost;
      if (host && host.isConnected && panel.parentElement !== host) host.appendChild(panel);
    });
    document.querySelectorAll('.scene-def-trigger.is-open').forEach(function (btn) {
      btn.classList.remove('is-open');
    });
  }

  function openDefPanel(trigger) {
    var wrap = trigger.closest('.scene-def-select');
    var panel = getDefPanel(wrap);
    if (!wrap || !panel) return;
    var wasOpen = panel.classList.contains('is-open');
    closeDefPanels();
    if (wasOpen) return;
    wrap.__defPanel = panel;
    panel.__defHost = wrap;
    document.body.appendChild(panel);
    panel.classList.add('is-open');
    trigger.classList.add('is-open');
    var rect = trigger.getBoundingClientRect();
    var pad = 8;
    var gap = 4;
    panel.style.position = 'fixed';
    panel.style.zIndex = '2100';
    panel.style.margin = '0';
    panel.style.left = Math.max(pad, rect.left) + 'px';
    panel.style.width = Math.max(rect.width, 120) + 'px';
    panel.style.right = 'auto';
    var height = panel.offsetHeight || 120;
    var spaceBelow = window.innerHeight - rect.bottom - gap - pad;
    var below = spaceBelow >= height || spaceBelow >= rect.top - gap - pad;
    if (below) {
      var top = rect.bottom + gap;
      var maxH = Math.max(80, window.innerHeight - top - pad);
      panel.style.maxHeight = maxH + 'px';
      panel.style.top = top + 'px';
      panel.style.bottom = 'auto';
    } else {
      var maxUp = Math.max(80, rect.top - gap - pad);
      panel.style.maxHeight = maxUp + 'px';
      panel.style.top = 'auto';
      panel.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
    }
  }

  function scalarControlHtml(field, value, attrs) {
    var type = field ? field.componentType : '';
    if (type === '开关') {
      var on = value === true || value === 'true' || value === '是';
      return '<button class="switch' + (on ? ' is-on' : '') + '" type="button" ' + attrs + ' aria-label="预设默认值" aria-pressed="' + (on ? 'true' : 'false') + '"></button>';
    }
    if (type === '下拉选择' && field.selectMode === '多选') {
      var picked = multiValues(value);
      var options = field.options || [];
      if (!options.length) return '<span class="scene-def-hint">未配置可选项</span>';
      return '<div class="scene-def-checks">' + options.map(function (o) {
        var checked = picked.indexOf(String(o.value)) !== -1 ? ' checked' : '';
        return '<label class="multi-option scene-def-check"><input type="checkbox" ' + attrs + ' data-field-multi="1" value="' + escapeHtml(String(o.value)) + '"' + checked + ' /><span>' + escapeHtml(o.label) + '</span></label>';
      }).join('') + '</div>';
    }
    if (type === '下拉选择') {
      return singleSelectHtml(field, value, attrs);
    }
    var shown = value == null || Array.isArray(value) || (typeof value === 'object') ? '' : String(value);
    var maxLen = type !== '数字输入' && field && field.maxLength != null ? ' maxlength="' + escapeHtml(String(field.maxLength)) + '"' : '';
    var mode = type === '数字输入' ? ' inputmode="decimal"' : '';
    var placeholder = type !== '数字输入' && field && field.placeholder ? field.placeholder : '请输入';
    return '<input class="input" ' + attrs + ' value="' + escapeHtml(shown) + '" placeholder="' + escapeHtml(placeholder) + '"' + maxLen + mode + ' autocomplete="off" />';
  }

  function defaultControlHtml(row, i) {
    var field = Store.fieldById(row.fieldId);
    if (field && field.componentType === 'Array') {
      var children = field.children || [];
      if (!children.length) return '<span class="scene-def-hint">未配置子字段</span>';
      return '<button class="link" type="button" data-array-preset="' + i + '">' + escapeHtml(arrayPresetText(field, row.defaultValue)) + '</button>';
    }
    return scalarControlHtml(field, row.defaultValue, 'data-field-def="' + i + '"');
  }

  function renderFieldConfigs() {
    closeDefPanels();
    var block = $('editFieldConfig');
    var body = $('editFieldConfigBody');
    if (!state.editFields.length) {
      block.hidden = true;
      body.innerHTML = '';
      return;
    }
    block.hidden = false;
    body.innerHTML = state.editFields.map(function (row, i) {
      var reqOn = !!row.required;
      var field = Store.fieldById(row.fieldId);
      var typeName = field && field.componentType ? field.componentType : '-';
      var name = Store.fieldName(row.fieldId);
      return '<tr data-field-row="' + i + '">' +
        '<td class="col-drag"><span class="option-drag" draggable="true" title="拖拽排序" data-field-drag="' + i + '">' + DRAG_SVG + '</span></td>' +
        '<td class="col-name" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</td>' +
        '<td class="col-type">' + escapeHtml(typeName) + '</td>' +
        '<td class="col-def">' + defaultControlHtml(row, i) + '</td>' +
        '<td class="col-req"><button class="switch' + (reqOn ? ' is-on' : '') + '" type="button" data-field-req="' + i + '" aria-label="是否必填" aria-pressed="' + (reqOn ? 'true' : 'false') + '"></button></td>' +
        '<td class="col-op"><button class="link link--danger" type="button" data-field-del="' + i + '">删除</button></td>' +
      '</tr>';
    }).join('');
  }

  function readScalar(el, field) {
    var type = field ? field.componentType : '';
    if (!el) return presetDefault(field);
    if (type === '开关') return el.classList.contains('is-on');
    if (type === '下拉选择') {
      if (el.classList && el.classList.contains('scene-def-select')) return el.getAttribute('data-value') || '';
      return el.value || '';
    }
    if (type === '数字输入') {
      var raw = (el.value || '').trim();
      if (!raw) return null;
      var n = Number(raw);
      return isFinite(n) ? n : raw;
    }
    return (el.value || '').trim();
  }

  function collectFieldConfigs() {
    state.editFields.forEach(function (row, i) {
      var field = Store.fieldById(row.fieldId);
      var type = field ? field.componentType : '';
      if (type === 'Array') {
        var preset = arrayPresetState(row.defaultValue);
        row.defaultValue = { values: preset.values, required: preset.required };
      } else if (type === '下拉选择' && field.selectMode === '多选') {
        var picked = [];
        document.querySelectorAll('#editFieldConfig [data-field-def="' + i + '"][data-field-multi]').forEach(function (el) {
          if (el.checked) picked.push(el.value);
        });
        row.defaultValue = picked;
      } else {
        var defEl = document.querySelector('#editFieldConfig [data-field-def="' + i + '"]');
        if (defEl) row.defaultValue = readScalar(defEl, field);
      }
      var reqEl = document.querySelector('#editFieldConfig [data-field-req="' + i + '"]');
      if (reqEl) row.required = reqEl.classList.contains('is-on');
    });
  }

  function removeEditField(index) {
    collectFieldConfigs();
    state.editFields.splice(index, 1);
    renderFieldConfigs();
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
  }

  function syncAdSwitch() {
    var btn = $('editAdSwitch');
    btn.classList.toggle('is-on', !!state.editAdSwitch);
    btn.setAttribute('aria-pressed', state.editAdSwitch ? 'true' : 'false');
  }

  $('editAdSwitch').addEventListener('click', function () {
    state.editAdSwitch = !state.editAdSwitch;
    syncAdSwitch();
  });

  function openArrayPreset(index) {
    collectFieldConfigs();
    var row = state.editFields[index];
    var field = row ? Store.fieldById(row.fieldId) : null;
    if (!row || !field) return;
    closeDefPanels();
    document.querySelectorAll('body > .scene-def-panel').forEach(function (panel) {
      if (!panel.__defHost || !panel.__defHost.isConnected) panel.remove();
    });
    state.arrayPresetIndex = index;
    var preset = arrayPresetState(row.defaultValue);
    var children = field.children || [];
    var rows = children.map(function (child) {
      var key = child.key || child.name || '';
      var childName = (child.name && String(child.name).trim()) || '-';
      var val = Object.prototype.hasOwnProperty.call(preset.values, key) ? preset.values[key] : emptyChildDefault(child);
      var reqOn = !!preset.required[key];
      return '<tr>' +
        '<td class="col-name" title="' + escapeHtml(childName) + '">' + escapeHtml(childName) + '</td>' +
        '<td class="col-type">' + escapeHtml(child.componentType || '-') + '</td>' +
        '<td class="col-def">' + scalarControlHtml(child, val, 'data-preset-key="' + escapeHtml(key) + '"') + '</td>' +
        '<td class="col-req"><button class="switch' + (reqOn ? ' is-on' : '') + '" type="button" data-preset-req="' + escapeHtml(key) + '" aria-label="是否必填" aria-pressed="' + (reqOn ? 'true' : 'false') + '"></button></td>' +
      '</tr>';
    }).join('');
    $('arrayPresetBody').innerHTML = children.length
      ? '<table class="param-table scene-field-table scene-child-table">' +
          '<colgroup><col class="col-name" /><col class="col-type" /><col class="col-def" /><col class="col-req" /></colgroup>' +
          '<thead><tr><th class="col-name">子字段名称</th><th class="col-type">控件类型</th><th class="col-def">预设默认值</th><th class="col-req">是否必填</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>'
      : '<div class="form-item__hint">未配置子字段</div>';
    UI.openModal('arrayPresetModal');
  }

  function submitArrayPreset() {
    var row = state.editFields[state.arrayPresetIndex];
    var field = row ? Store.fieldById(row.fieldId) : null;
    if (!row || !field) return;
    var map = {};
    var required = {};
    (field.children || []).forEach(function (child) {
      var key = child.key || child.name || '';
      var el = null;
      document.querySelectorAll('#arrayPresetBody [data-preset-key]').forEach(function (node) {
        if (!el && node.getAttribute('data-preset-key') === key) el = node;
      });
      map[key] = readScalar(el, child);
      var req = document.querySelector('#arrayPresetBody [data-preset-req="' + key + '"]');
      required[key] = !!(req && req.classList.contains('is-on'));
    });
    row.defaultValue = { values: map, required: required };
    state.arrayPresetIndex = null;
    UI.closeModal('arrayPresetModal');
    renderFieldConfigs();
  }

  $('arrayPresetSubmit').addEventListener('click', submitArrayPreset);
  $('arrayPresetBody').addEventListener('click', function (e) {
    var sw = e.target.closest('.switch');
    if (!sw) return;
    sw.classList.toggle('is-on');
    sw.setAttribute('aria-pressed', sw.classList.contains('is-on') ? 'true' : 'false');
  });
  $('arrayPresetBody').addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('select')) {
      e.target.classList.toggle('is-placeholder', !e.target.value);
    }
  });

  $('editFieldConfigBody').addEventListener('click', function (e) {
    var fieldDel = e.target.closest('[data-field-del]');
    if (fieldDel) {
      removeEditField(Number(fieldDel.getAttribute('data-field-del')));
      return;
    }
    var preset = e.target.closest('[data-array-preset]');
    if (preset) {
      openArrayPreset(Number(preset.getAttribute('data-array-preset')));
      return;
    }
    var sw = e.target.closest('.switch');
    if (!sw) return;
    sw.classList.toggle('is-on');
    sw.setAttribute('aria-pressed', sw.classList.contains('is-on') ? 'true' : 'false');
  });
  $('editFieldConfigBody').addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('select[data-field-def]')) {
      e.target.classList.toggle('is-placeholder', !e.target.value);
    }
  });

  $('editFieldConfigBody').addEventListener('dragstart', function (e) {
    var handle = e.target.closest('[data-field-drag]');
    if (!handle) { e.preventDefault(); return; }
    collectFieldConfigs();
    state.fieldDragIndex = Number(handle.getAttribute('data-field-drag'));
    var row = handle.closest('tr');
    if (row) row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(state.fieldDragIndex));
  });
  $('editFieldConfigBody').addEventListener('dragover', function (e) {
    if (state.fieldDragIndex == null) return;
    e.preventDefault();
    var row = e.target.closest('tr[data-field-row]');
    if (!row) return;
    $('editFieldConfigBody').querySelectorAll('tr').forEach(function (el) {
      el.classList.toggle('is-drop-target', el === row);
    });
  });
  $('editFieldConfigBody').addEventListener('drop', function (e) {
    e.preventDefault();
    var row = e.target.closest('tr[data-field-row]');
    var from = state.fieldDragIndex;
    state.fieldDragIndex = null;
    $('editFieldConfigBody').querySelectorAll('tr').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
    if (!row || from == null) return;
    collectFieldConfigs();
    var to = Number(row.getAttribute('data-field-row'));
    if (to === from) return;
    var item = state.editFields.splice(from, 1)[0];
    state.editFields.splice(to, 0, item);
    renderFieldConfigs();
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
  });
  $('editFieldConfigBody').addEventListener('dragend', function () {
    state.fieldDragIndex = null;
    $('editFieldConfigBody').querySelectorAll('tr').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
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
        var count = (row.fieldIds || []).length;
        var locked = Store.isSdkBuiltinScene(row);
        var drag = locked
          ? '<span class="option-drag is-locked" title="内置场景顺序固定">' + DRAG_SVG + '</span>'
          : '<span class="option-drag" draggable="true" title="拖拽排序" data-row-drag="' + escapeHtml(row.id) + '">' + DRAG_SVG + '</span>';
        return '<tr data-id="' + escapeHtml(row.id) + '"' + (locked ? ' data-locked="1"' : '') + '>' +
          '<td class="col-check col-drag">' + drag + '</td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(row.key || '') + '">' + escapeHtml(row.key || '') + '</td>' +
          '<td>' + escapeHtml(row.sceneType || '') + '</td>' +
          '<td>' + adSwitchDot(row.adSwitch === true) + '</td>' +
          '<td>' + count + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt || '') + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link" type="button" data-action="copy">复制</button>' +
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

  function fillForm(row) {
    $('editName').value = row ? row.name : '';
    $('editKey').value = row ? (row.key || '') : '';
    $('editRemark').value = row ? (row.remark || '') : '';
    state.editFields = row && row.fieldConfigs ? Store.clone(row.fieldConfigs) : [];
    state.editSceneType = row ? (row.sceneType || '自定义') : '自定义';
    state.editStatus = row ? (row.status || '启用') : '启用';
    state.editAdSwitch = row ? row.adSwitch === true : false;
    $('editKey').disabled = state.editMode === 'edit';
    $('editKey').readOnly = state.editMode === 'edit';
    if (fieldMulti && fieldMulti.render) fieldMulti.render();
    renderFieldConfigs();
    syncAdSwitch();
    UI.setSegValue('editSceneTypeSeg', state.editSceneType);
    UI.setSegValue('editStatusSeg', state.editStatus);
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    clearEditErrors();
    $('editModalTitle').textContent = '添加场景';
    fillForm(null);
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    clearEditErrors();
    $('editModalTitle').textContent = '编辑场景';
    fillForm(row);
    UI.openModal('editModal');
  }

  function nextCopyName(base) {
    var name = base + '副本';
    var i = 2;
    while (ALL_ROWS.some(function (r) { return r.name === name; })) {
      name = base + '副本' + i;
      i += 1;
    }
    return name;
  }

  function nextCopyKey(base) {
    var key = base + '_COPY';
    var i = 2;
    while (ALL_ROWS.some(function (r) { return r.key === key; })) {
      key = base + '_COPY' + i;
      i += 1;
    }
    return key;
  }

  function copyRow(row) {
    ALL_ROWS.unshift(Store.touch({
      id: UI.uid('s'),
      name: nextCopyName(row.name),
      key: nextCopyKey(row.key || 'SCENE'),
      adType: row.adType || '',
      fieldIds: (row.fieldIds || []).slice(),
      fieldConfigs: Store.clone(row.fieldConfigs || []),
      adSwitch: row.adSwitch === true,
      sceneType: row.sceneType || '自定义',
      remark: row.remark || '',
      status: row.status || '启用'
    }));
    Store.saveScenes(ALL_ROWS);
    state.page = 1;
    UI.showToast('复制成功', 'success');
    renderTable();
  }

  function submitEdit() {
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var key = ($('editKey').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var ok = true;
    if (!name) {
      setItemError('editNameItem', true, '请输入场景名称');
      ok = false;
    }
    if (state.editMode === 'add') {
      if (!key) {
        setItemError('editKeyItem', true, '请输入场景Key');
        ok = false;
      } else if (!KEY_RE.test(key)) {
        setItemError('editKeyItem', true, '仅支持字母开头的字母、数字、下划线');
        ok = false;
      }
    }
    collectFieldConfigs();
    if (!state.editFields.length) {
      setItemError('editFieldItem', true, '请选择关联字段');
      ok = false;
    }
    var duplicatedName = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (name && duplicatedName) {
      setItemError('editNameItem', true, '场景名称已存在');
      ok = false;
    }
    var duplicatedKey = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.key === key;
    });
    if (state.editMode === 'add' && key && duplicatedKey) {
      setItemError('editKeyItem', true, '场景Key已存在');
      ok = false;
    }
    if (!ok) return;

    if (state.editMode === 'add') {
      ALL_ROWS.unshift(Store.touch({
        id: UI.uid('s'),
        name: name,
        key: key,
        adType: '',
        fieldIds: fieldIds(),
        fieldConfigs: Store.clone(state.editFields),
        adSwitch: !!state.editAdSwitch,
        sceneType: state.editSceneType || '自定义',
        remark: remark,
        status: state.editStatus || '启用'
      }));
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.name = name;
      row.fieldIds = fieldIds();
      row.fieldConfigs = Store.clone(state.editFields);
      row.adSwitch = !!state.editAdSwitch;
      row.sceneType = state.editSceneType || '自定义';
      row.remark = remark;
      row.status = state.editStatus || '启用';
      Store.touch(row);
    }
    Store.saveScenes(ALL_ROWS);
    UI.closeModal('editModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () { applyFilters(); renderTable(); });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { keyword: '', sceneType: '', adSwitch: '', status: '' };
    $('filterKeyword').value = '';
    if (sceneTypeFilter && sceneTypeFilter.syncLabel) sceneTypeFilter.syncLabel('');
    if (adSwitchFilter && adSwitchFilter.syncLabel) adSwitchFilter.syncLabel('');
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('editSubmit').addEventListener('click', submitEdit);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row);
    else if (action === 'copy') copyRow(row);
  });

  function clearRowDragState() {
    state.rowDragId = null;
    $('tableBody').querySelectorAll('tr').forEach(function (el) {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
  }

  function moveSceneRow(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    var from = ALL_ROWS.findIndex(function (r) { return r.id === fromId; });
    var to = ALL_ROWS.findIndex(function (r) { return r.id === toId; });
    if (from < 0 || to < 0) return;
    if (Store.isSdkBuiltinScene(ALL_ROWS[from]) || Store.isSdkBuiltinScene(ALL_ROWS[to])) return;
    var item = ALL_ROWS.splice(from, 1)[0];
    ALL_ROWS.splice(to, 0, item);
    Store.saveScenes(ALL_ROWS);
    renderTable();
  }

  $('tableBody').addEventListener('dragstart', function (e) {
    var handle = e.target.closest('[data-row-drag]');
    if (!handle) { e.preventDefault(); return; }
    var id = handle.getAttribute('data-row-drag');
    state.rowDragId = id;
    var row = handle.closest('tr[data-id]');
    if (row) row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  });
  $('tableBody').addEventListener('dragover', function (e) {
    if (!state.rowDragId) return;
    e.preventDefault();
    var row = e.target.closest('tr[data-id]');
    if (!row) return;
    $('tableBody').querySelectorAll('tr').forEach(function (el) {
      el.classList.toggle('is-drop-target', el === row);
    });
  });
  $('tableBody').addEventListener('drop', function (e) {
    e.preventDefault();
    var row = e.target.closest('tr[data-id]');
    var fromId = state.rowDragId;
    clearRowDragState();
    if (!row || !fromId) return;
    moveSceneRow(fromId, row.getAttribute('data-id'));
  });
  $('tableBody').addEventListener('dragend', clearRowDragState);

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeDefPanels();
      UI.closeModal('editModal');
    });
  });
  document.querySelectorAll('[data-close="arrayPresetModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeDefPanels();
      state.arrayPresetIndex = null;
      UI.closeModal('arrayPresetModal');
    });
  });
  document.addEventListener('click', function (e) {
    var clearBtn = e.target.closest('.scene-def-select > .select-clear');
    if (clearBtn) {
      e.stopPropagation();
      syncDefSelect(clearBtn.closest('.scene-def-select'), '');
      closeDefPanels();
      return;
    }
    var opt = e.target.closest('.single-option');
    if (opt && opt.closest('.scene-def-panel')) {
      e.stopPropagation();
      var panel = opt.closest('.scene-def-panel');
      var wrap = panel && panel.__defHost;
      if (!wrap) return;
      syncDefSelect(wrap, opt.getAttribute('data-value') || '', opt.textContent.trim());
      closeDefPanels();
      return;
    }
    var trigger = e.target.closest('.scene-def-trigger');
    if (trigger) {
      e.stopPropagation();
      openDefPanel(trigger);
      return;
    }
    if (e.target.closest('.scene-def-panel')) {
      e.stopPropagation();
      return;
    }
    closeDefPanels();
  });

  renderTable();
})();
