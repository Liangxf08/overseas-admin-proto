/* 小游戏 */
(function () {
  'use strict';

  ProductShell.mount('mini-games');

  var UI = window.ProductUI;
  if (!UI) return;

  var escapeHtml = UI.escapeHtml;
  var COPY_ICON = UI.COPY_ICON;

  var GROUPS = ['奇异果', '苹果组', '无花果', '坚果组', '硕果组', '外部联运', '其他'];
  var TYPES = ['分类', '塔防', '益智', '逆袭', '难度', '消除', '找茬', '其他'];
  var SERIES = ['Jam系列', 'Sort系列', 'Match系列', 'ASMR系列', 'Word系列', 'unknown'];
  var CATEGORIES = ['动作', '匹配', '解谜', '竞速', '角色扮演', '射击', '模拟', '体育', '策略', '派对', '桌面', '其它'];
  var OWNERS = Array.from({ length: 8 }, function (_, i) { return '用户' + String.fromCharCode(65 + i); });

  /* 来自示例数据.xlsx · 小游戏 / TikTok 产品树 */
  var SEED = [
    ['44760363', 'Fun Overload', '奇异果'],
    ['44760156', 'Mind Block', '奇异果'],
    ['44760356', 'Brainy Find', '奇异果'],
    ['44760195', 'Life Story', '奇异果'],
    ['44760190', 'Brain Mix', '奇异果'],
    ['44758636', 'Flow Mix', '奇异果'],
    ['44759962', 'Life Choice', '奇异果'],
    ['44759891', 'Life Path', '奇异果'],
    ['44760174', 'Brainy Breakout', '奇异果'],
    ['44760164', 'Mind Escape', '奇异果'],
    ['44759426', 'Flow Master', '奇异果'],
    ['44759081', 'Brainy Win', '奇异果'],
    ['44758892', 'Path Flow', '奇异果'],
    ['44760064', 'Wukong Out', '奇异果'],
    ['44759538', 'Help Wukong', '奇异果'],
    ['44758558', 'Draw Rescue Wukong', '奇异果'],
    ['44759245', 'Save Wukong', '奇异果'],
    ['44760080', 'Tidy Hotpot', '奇异果'],
    ['44760005', 'Food Sort', '奇异果'],
    ['44759186', 'Hotpot Master', '奇异果'],
    ['44758887', 'Hyper Desh', '外部联运'],
    ['44760172', 'Sort Coin', '奇异果'],
    ['44759899', 'Sort Coin Master', '奇异果'],
    ['44758632', 'Piggy Coin Sort', '奇异果'],
    ['44759913', 'Sand Ball Drop', '奇异果'],
    ['44759682', 'Ball Sand', '奇异果'],
    ['44759628', 'Ball Run', '奇异果'],
    ['44759541', 'Brain Queen', '奇异果'],
    ['44758400', 'Brain Power Queen', '奇异果'],
    ['44758366', 'Eye Track', '奇异果'],
    ['44760215', '言葉を探す', '奇异果'],
    ['44759979', '文字の宝探し！', '奇异果'],
    ['44759157', '文字の奥に小文字', '奇异果'],
    ['44760160', '文字の中に文字!', '奇异果'],
    ['44760022', 'Count Sprint', '外部联运'],
    ['44759917', 'Digit Merge', '外部联运'],
    ['44759513', 'Diamond Match', '无花果'],
    ['44758889', 'Diamond ASMR', '无花果'],
    ['44758476', 'Gems Color Puzzle', '无花果'],
    ['44759278', 'Brain Power King', '奇异果'],
    ['44760120', 'Word Dig', '奇异果'],
    ['44759570', 'Cute Gun Bump', '外部联运'],
    ['44758408', 'Word Player', '奇异果'],
    ['44759961', 'Card Group', '奇异果'],
    ['44759636', 'Dual Gun Clash', '外部联运'],
    ['44758881', 'Card Assort', '奇异果'],
    ['44759773', 'Tile Stack!', '奇异果'],
    ['44758456', 'Sort Stack', '奇异果'],
    ['44760310', 'Mad Moto', '外部联运'],
    ['44760203', 'Color Tetris', '奇异果']
  ];

  function inferCategory(name) {
    var n = String(name).toLowerCase();
    if (/wukong|rescue|save|draw/.test(n)) return '动作';
    if (/gun|clash/.test(n)) return '射击';
    if (/match/.test(n)) return '匹配';
    if (/moto|sprint|run/.test(n)) return '竞速';
    if (/hotpot|food|tidy/.test(n)) return '模拟';
    if (/^life\b/.test(n)) return '角色扮演';
    if (/word|文字|言葉|dig|player/.test(n)) return '解谜';
    if (/card|tile|tetris|stack|coin|piggy/.test(n)) return '桌面';
    if (/ball|sand/.test(n)) return '体育';
    if (/fun|hyper|overload/.test(n)) return '派对';
    if (/diamond|gems|asmr|color/.test(n)) return '策略';
    if (/brain|mind|flow|path|escape|find|eye|queen|king|mix|block|merge|count/.test(n)) return '解谜';
    return '其它';
  }

  function inferSeries(name) {
    var n = String(name).toLowerCase();
    if (/sort|stack|tile|tetris/.test(n)) return 'Sort系列';
    if (/match/.test(n)) return 'Match系列';
    if (/word|文字|言葉|dig/.test(n)) return 'Word系列';
    if (/asmr/.test(n)) return 'ASMR系列';
    if (/jam/.test(n)) return 'Jam系列';
    return 'unknown';
  }

  function makeAppId(productId) {
    return ('74' + String(productId) + '000000000').slice(0, 19);
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatStamp(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  var rows = SEED.map(function (item, i) {
    var created = new Date(2026, 7, 28, 18, 40, 0);
    created.setDate(created.getDate() - i);
    created.setHours(9 + (i % 8), (i * 7) % 60, (i * 13) % 60, 0);
    var updated = new Date(created.getTime());
    if (i % 5 === 0) updated.setDate(updated.getDate() + 2);
    return {
      id: item[0],
      name: item[1],
      platform: 'TikTok',
      appId: makeAppId(item[0]),
      bizType: '小游戏',
      group: item[2],
      category: inferCategory(item[1]),
      type: TYPES[i % TYPES.length],
      series: inferSeries(item[1]),
      owner: OWNERS[i % OWNERS.length],
      status: i % 9 === 3 ? '禁用' : '启用',
      clientKey: 'ck_' + item[0],
      clientSecret: 'cs_' + item[0],
      icon: '',
      createdAt: formatStamp(created),
      updatedAt: formatStamp(updated)
    };
  });

  rows.unshift({
    id: '44761001',
    name: 'Vivid Minis',
    platform: 'TikTok',
    appId: makeAppId('44761001'),
    bizType: '短剧',
    group: '其他',
    category: '',
    type: '其他',
    series: 'unknown',
    owner: OWNERS[0],
    status: '启用',
    clientKey: 'ck_44761001',
    clientSecret: 'cs_44761001',
    icon: '',
    createdAt: '2026-09-10 10:00:00',
    updatedAt: '2026-09-10 10:00:00'
  });

  var state = {
    keyword: '',
    appIdKw: '',
    platform: '',
    bizType: '',
    groups: [],
    types: [],
    series: [],
    owners: [],
    status: '',
    page: 1,
    pageSize: 20,
    selectedIds: new Set(),
    editingId: null,
    formGroup: '',
    formType: '',
    formSeries: '',
    formOwner: '',
    formIcon: '',
    batchGroup: '',
    batchType: '',
    batchSeries: '',
    batchOwner: '',
    batchStatus: '启用'
  };
  var batchMenuApi = null;
  var filterMultis = {};
  var filterSingles = {};
  var formSelects = {};
  var batchSelects = {};
  var formClearApis = {};

  function nowText() {
    return formatStamp(new Date());
  }

  function formatDisplayTime(str) {
    if (!str) return '-';
    return String(str).replace('T', ' ').slice(0, 19);
  }

  function syncBatchBtn() {
    if (batchMenuApi) batchMenuApi.setDisabled(state.selectedIds.size === 0);
    else {
      var btn = UI.$('batchBtn');
      if (btn) btn.disabled = state.selectedIds.size === 0;
    }
  }

  function getFiltered() {
    var kw = state.keyword.trim().toLowerCase();
    var appKw = state.appIdKw.trim().toLowerCase();
    return rows
      .filter(function (r) {
        if (kw && String(r.name).toLowerCase().indexOf(kw) === -1 && String(r.id).toLowerCase().indexOf(kw) === -1) return false;
        if (appKw && String(r.appId).toLowerCase().indexOf(appKw) === -1) return false;
        if (state.platform && r.platform !== state.platform) return false;
        if (state.bizType && r.bizType !== state.bizType) return false;
        if (state.groups.length && state.groups.indexOf(r.group) === -1) return false;
        if (state.types.length && state.types.indexOf(r.type) === -1) return false;
        if (state.series.length && state.series.indexOf(r.series) === -1) return false;
        if (state.owners.length && state.owners.indexOf(r.owner) === -1) return false;
        if (state.status && r.status !== state.status) return false;
        return true;
      })
      .slice()
      .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  }

  function platformCell(platform) {
    return escapeHtml(platform);
  }

  function idCell(value, title) {
    return (
      '<span class="cell-id">' +
        '<button class="copy-btn" type="button" data-copy="' + escapeHtml(value) + '" title="' + escapeHtml(title) + '" aria-label="复制">' + COPY_ICON + '</button>' +
        '<span class="cell-id__text" title="' + escapeHtml(value) + '">' + escapeHtml(value) + '</span>' +
      '</span>'
    );
  }

  function renderTable() {
    var list = getFiltered();
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageRows = list.slice(start, start + state.pageSize);
    var tbody = UI.$('tableBody');
    var emptyTip = UI.$('emptyTip');

    if (!pageRows.length) {
      tbody.innerHTML = '';
      emptyTip.hidden = false;
      UI.$('checkAll').checked = false;
      UI.$('checkAll').indeterminate = false;
    } else {
      emptyTip.hidden = true;
      tbody.innerHTML = pageRows.map(function (r) {
        var checked = state.selectedIds.has(r.id);
        return (
          '<tr data-id="' + escapeHtml(r.id) + '">' +
            '<td class="col-check is-freeze"><span class="cell-check"><input type="checkbox" data-check="' + escapeHtml(r.id) + '"' + (checked ? ' checked' : '') + ' aria-label="选择" /></span></td>' +
            '<td class="col-name is-freeze" title="' + escapeHtml(r.name) + '">' +
              '<span class="product-cell">' +
                (r.icon
                  ? '<img class="product-cell__icon product-cell__icon--img" src="' + escapeHtml(r.icon) + '" alt="" />'
                  : '<span class="product-cell__icon" aria-hidden="true"></span>') +
                '<span class="product-cell__name">' + escapeHtml(r.name) + '</span>' +
              '</span>' +
            '</td>' +
            '<td class="col-platform">' + platformCell(r.platform) + '</td>' +
            '<td class="col-id">' + idCell(r.id, '复制产品ID') + '</td>' +
            '<td class="col-appid">' + idCell(r.appId, '复制APPID') + '</td>' +
            '<td class="col-biz">' + escapeHtml(r.bizType || '-') + '</td>' +
            '<td>' + escapeHtml(r.category || '-') + '</td>' +
            '<td>' + escapeHtml(r.group) + '</td>' +
            '<td>' + escapeHtml(r.type) + '</td>' +
            '<td>' + escapeHtml(r.series) + '</td>' +
            '<td>' + escapeHtml(r.owner) + '</td>' +
            '<td>' + UI.statusTag(r.status) + '</td>' +
            '<td title="' + escapeHtml(formatDisplayTime(r.createdAt)) + '">' + escapeHtml(formatDisplayTime(r.createdAt)) + '</td>' +
            '<td title="' + escapeHtml(formatDisplayTime(r.updatedAt || r.createdAt)) + '">' + escapeHtml(formatDisplayTime(r.updatedAt || r.createdAt)) + '</td>' +
            '<td class="col-action"><div class="action-links">' +
              '<button class="link" type="button" data-action="edit" data-id="' + escapeHtml(r.id) + '">编辑</button>' +
            '</div></td>' +
          '</tr>'
        );
      }).join('');

      var pageIds = pageRows.map(function (r) { return r.id; });
      var checkedCount = pageIds.filter(function (id) { return state.selectedIds.has(id); }).length;
      UI.$('checkAll').checked = pageIds.length > 0 && checkedCount === pageIds.length;
      UI.$('checkAll').indeterminate = checkedCount > 0 && checkedCount < pageIds.length;
    }

    syncBatchBtn();
    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });
    if (window.ColResize) ColResize.refresh(UI.$('dataTable'));
  }

  function fillSinglePanel(panelId, options) {
    UI.$(panelId).innerHTML = options.map(function (opt) {
      return '<div class="single-option" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</div>';
    }).join('');
  }

  function bindMulti(cfg) {
    return UI.bindMultiSelect({
      wrapId: cfg.wrapId,
      triggerId: cfg.triggerId,
      panelId: cfg.panelId,
      labelId: cfg.labelId,
      listId: cfg.listId,
      selectedId: cfg.selectedId || null,
      searchId: cfg.searchId || null,
      countId: cfg.countId || null,
      selectAllId: cfg.selectAllId || null,
      clearId: cfg.clearId || null,
      prefix: cfg.prefix,
      getOptions: cfg.getOptions,
      getSelected: cfg.getSelected,
      setSelected: cfg.setSelected
    });
  }

  function refreshFilterSingleLabel(cfg, value) {
    var allToken = cfg.allToken || '';
    var v = value || allToken;
    var label = UI.$(cfg.labelId);
    var wrap = UI.$(cfg.wrapId);
    var panel = UI.$(cfg.panelId);
    if (label) {
      if (!v) label.innerHTML = cfg.prefix + '<span class="muted">请选择</span>';
      else label.innerHTML = cfg.prefix + escapeHtml(v);
    }
    if (wrap) wrap.classList.toggle('has-value', !!value && value !== allToken);
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }
  }

  function bindFilterSingle(cfg) {
    var allToken = cfg.allToken || '';
    var api = UI.bindSingleSelect({
      wrapId: cfg.wrapId,
      triggerId: cfg.triggerId,
      panelId: cfg.panelId,
      labelId: cfg.labelId,
      clearId: cfg.clearId,
      prefix: cfg.prefix,
      getValue: function () {
        var v = cfg.getValue() || '';
        return allToken && v === allToken ? '' : v;
      },
      onChange: function (v) {
        cfg.onChange(v || allToken || '');
      },
      formatValue: allToken ? function (v) { return v || allToken; } : undefined
    });
    if (allToken) refreshFilterSingleLabel(cfg, cfg.getValue());
    return {
      syncLabel: function (v) {
        if (allToken) refreshFilterSingleLabel(cfg, v || allToken);
        else if (api && api.syncLabel) api.syncLabel(v || '');
      }
    };
  }

  function clearFormItemError(itemId) {
    var item = UI.$(itemId);
    if (item) item.classList.remove('is-error');
  }

  function syncIconPreview() {
    var box = UI.$('iconUploadBox');
    var preview = UI.$('iconPreview');
    if (!box || !preview) return;
    if (state.formIcon) {
      box.classList.add('has-file');
      preview.src = state.formIcon;
    } else {
      box.classList.remove('has-file');
      preview.removeAttribute('src');
    }
  }

  function clearFormErrors() {
    ['formGroupItem', 'formTypeItem', 'formSeriesItem', 'formOwnerItem'].forEach(clearFormItemError);
  }

  function setFormError(itemId, message) {
    var item = UI.$(itemId);
    if (!item) return;
    item.classList.add('is-error');
    var err = item.querySelector('.form-item__error');
    if (err && message) err.textContent = message;
  }

  function openForm(row) {
    state.editingId = row.id;
    UI.$('formModalTitle').textContent = '编辑产品';
    UI.setSegValue('platformSeg', row.platform || 'TikTok');
    UI.setSegValue('statusSeg', row.status || '启用');
    UI.$('formName').value = row.name || '';
    UI.$('formAppId').value = row.appId || '';
    UI.$('formClientKey').value = row.clientKey || '';
    UI.$('formClientSecret').value = row.clientSecret || '';
    UI.$('formBizType').value = row.bizType || '';
    UI.$('formCategory').value = row.category || '-';
    state.formGroup = row.group || '';
    state.formType = row.type || '';
    state.formSeries = row.series || '';
    state.formOwner = row.owner || '';
    state.formIcon = row.icon || '';
    formSelects.group.syncLabel(state.formGroup);
    formSelects.type.syncLabel(state.formType);
    formSelects.series.syncLabel(state.formSeries);
    formSelects.owner.syncLabel(state.formOwner);
    syncIconPreview();
    var fileInput = UI.$('iconFileInput');
    if (fileInput) fileInput.value = '';
    clearFormErrors();
    if (formClearApis.secret) formClearApis.secret.sync();
    UI.openModal('formModal');
  }

  function closeForm() {
    UI.closeModal('formModal');
    state.editingId = null;
    UI.closePanels();
    restoreFormPortals();
  }

  function submitForm() {
    var secret = UI.$('formClientSecret').value.trim();
    clearFormErrors();
    if (!state.formGroup) {
      setFormError('formGroupItem', '请选择产品组');
      return;
    }
    if (!state.formType) {
      setFormError('formTypeItem', '请选择产品类型');
      return;
    }
    if (!state.formSeries) {
      setFormError('formSeriesItem', '请选择产品系列');
      return;
    }
    if (!state.formOwner) {
      setFormError('formOwnerItem', '请选择负责人');
      return;
    }
    var target = rows.find(function (r) { return r.id === state.editingId; });
    if (target) {
      target.clientSecret = secret;
      target.group = state.formGroup;
      target.type = state.formType;
      target.series = state.formSeries;
      target.owner = state.formOwner;
      target.icon = state.formIcon || '';
      target.status = UI.getSegValue('statusSeg') || '启用';
      target.updatedAt = nowText();
    }
    UI.showToast('保存成功');
    closeForm();
    renderTable();
  }

  function openBatchModal(kind) {
    if (!state.selectedIds.size) {
      UI.showToast('请先选择产品', 'error');
      return;
    }
    if (kind === 'group') {
      state.batchGroup = '';
      batchSelects.group.syncLabel('');
      UI.openModal('batchGroupModal');
    } else if (kind === 'type') {
      state.batchType = '';
      batchSelects.type.syncLabel('');
      UI.openModal('batchTypeModal');
    } else if (kind === 'series') {
      state.batchSeries = '';
      batchSelects.series.syncLabel('');
      UI.openModal('batchSeriesModal');
    } else if (kind === 'owner') {
      state.batchOwner = '';
      batchSelects.owner.syncLabel('');
      UI.openModal('batchOwnerModal');
    } else if (kind === 'status') {
      state.batchStatus = '启用';
      UI.setSegValue('batchStatusSeg', '启用');
      UI.openModal('batchStatusModal');
    }
  }

  function applyBatch(mutator, successMsg) {
    var ts = nowText();
    rows.forEach(function (row) {
      if (!state.selectedIds.has(row.id)) return;
      mutator(row);
      row.updatedAt = ts;
    });
    state.selectedIds.clear();
    UI.showToast(successMsg);
    renderTable();
  }

  filterMultis = {
    group: bindMulti({
      wrapId: 'groupWrap', triggerId: 'groupTrigger', panelId: 'groupPanel',
      labelId: 'groupLabel', listId: 'groupList', clearId: 'groupClear',
      prefix: '产品组：', getOptions: function () { return GROUPS; },
      getSelected: function () { return state.groups; },
      setSelected: function (arr) { state.groups = arr; }
    }),
    type: bindMulti({
      wrapId: 'typeWrap', triggerId: 'typeTrigger', panelId: 'typePanel',
      labelId: 'typeLabel', listId: 'typeList', selectedId: 'typeSelected',
      searchId: 'typeSearch', countId: 'typeCount', selectAllId: 'typeSelectAll', clearId: 'typeClear',
      prefix: '产品类型：', getOptions: function () { return TYPES; },
      getSelected: function () { return state.types; },
      setSelected: function (arr) { state.types = arr; }
    }),
    series: bindMulti({
      wrapId: 'seriesWrap', triggerId: 'seriesTrigger', panelId: 'seriesPanel',
      labelId: 'seriesLabel', listId: 'seriesList', clearId: 'seriesClear',
      prefix: '产品系列：', getOptions: function () { return SERIES; },
      getSelected: function () { return state.series; },
      setSelected: function (arr) { state.series = arr; }
    }),
    owner: bindMulti({
      wrapId: 'ownerWrap', triggerId: 'ownerTrigger', panelId: 'ownerPanel',
      labelId: 'ownerLabel', listId: 'ownerList', selectedId: 'ownerSelected',
      searchId: 'ownerSearch', countId: 'ownerCount', selectAllId: 'ownerSelectAll', clearId: 'ownerClear',
      prefix: '负责人：', getOptions: function () { return OWNERS; },
      getSelected: function () { return state.owners; },
      setSelected: function (arr) { state.owners = arr; }
    })
  };

  [
    { id: 'typePanelClear', key: 'type', field: 'types' },
    { id: 'ownerPanelClear', key: 'owner', field: 'owners' }
  ].forEach(function (item) {
    var btn = UI.$(item.id);
    if (!btn || !filterMultis[item.key]) return;
    btn.addEventListener('click', function () {
      state[item.field] = [];
      filterMultis[item.key].render();
    });
  });

  ['groupClear', 'typeClear', 'seriesClear', 'ownerClear'].forEach(function (id) {
    var el = UI.$(id);
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      UI.closePanels();
    });
  });

  filterSingles = {
    platform: bindFilterSingle({
      wrapId: 'platformWrap', triggerId: 'platformTrigger', panelId: 'platformPanel',
      labelId: 'platformLabel', clearId: 'platformClear',
      prefix: '平台：',
      getValue: function () { return state.platform; },
      onChange: function (v) { state.platform = v; }
    }),
    bizType: bindFilterSingle({
      wrapId: 'bizTypeWrap', triggerId: 'bizTypeTrigger', panelId: 'bizTypePanel',
      labelId: 'bizTypeLabel', clearId: 'bizTypeClear',
      prefix: '业务类型：',
      getValue: function () { return state.bizType; },
      onChange: function (v) { state.bizType = v; }
    }),
    status: bindFilterSingle({
      wrapId: 'statusWrap', triggerId: 'statusTrigger', panelId: 'statusPanel',
      labelId: 'statusLabel', clearId: 'statusClear',
      prefix: '状态：',
      getValue: function () { return state.status; },
      onChange: function (v) { state.status = v; }
    })
  };

  function restoreFormPortals() {
    document.querySelectorAll('.single-panel.single-panel--portal').forEach(function (p) {
      var homeId = p.getAttribute('data-home');
      var home = homeId ? document.getElementById(homeId) : null;
      if (home) home.appendChild(p);
      p.classList.remove('single-panel--portal', 'is-dropup');
      p.style.position = '';
      p.style.left = '';
      p.style.top = '';
      p.style.width = '';
      p.style.zIndex = '';
      p.style.right = '';
      p.style.bottom = '';
    });
  }

  function positionFormPortal(panel, trigger) {
    var rect = trigger.getBoundingClientRect();
    var gap = 4;
    var pad = 8;
    panel.style.position = 'fixed';
    panel.style.left = rect.left + 'px';
    panel.style.width = Math.max(rect.width, 200) + 'px';
    panel.style.right = 'auto';
    panel.style.zIndex = '1200';
    panel.style.top = (rect.bottom + gap) + 'px';
    panel.style.bottom = 'auto';
    panel.classList.remove('is-dropup');
    var pRect = panel.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom - pad;
    var spaceAbove = rect.top - pad;
    if (pRect.height > spaceBelow && spaceAbove > spaceBelow) {
      panel.classList.add('is-dropup');
      panel.style.top = Math.max(pad, rect.top - pRect.height - gap) + 'px';
    }
  }

  function bindSearchSingleSelect(cfg) {
    var wrap = UI.$(cfg.wrapId);
    var trigger = UI.$(cfg.triggerId);
    var panel = UI.$(cfg.panelId);
    var label = UI.$(cfg.labelId);
    var list = UI.$(cfg.listId);
    var search = UI.$(cfg.searchId);
    if (!wrap || !trigger || !panel || !label || !list || !search) return null;
    panel.setAttribute('data-home', cfg.wrapId);

    function syncLabel(value) {
      if (!value) {
        label.innerHTML = '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.textContent = value;
        wrap.classList.add('has-value');
      }
    }

    function renderList(kw) {
      var q = String(kw || '').trim().toLowerCase();
      var selected = cfg.getValue() || '';
      var opts = (cfg.getOptions() || []).filter(function (opt) {
        return !q || String(opt).toLowerCase().indexOf(q) !== -1;
      });
      if (!opts.length) {
        list.innerHTML = '<div class="single-panel__empty">暂无数据</div>';
        return;
      }
      list.innerHTML = opts.map(function (opt) {
        var active = opt === selected ? ' is-active' : '';
        return '<div class="single-option' + active + '" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</div>';
      }).join('');
    }

    function openPanel() {
      UI.closePanels();
      restoreFormPortals();
      search.value = '';
      renderList('');
      panel.classList.add('is-open', 'single-panel--portal');
      trigger.classList.add('is-open');
      document.body.appendChild(panel);
      positionFormPortal(panel, trigger);
      setTimeout(function () { search.focus(); }, 0);
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (trigger.disabled || trigger.classList.contains('is-disabled')) return;
      if (panel.classList.contains('is-open')) {
        UI.closePanels();
        restoreFormPortals();
        return;
      }
      openPanel();
    });

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      var value = opt.getAttribute('data-value') || '';
      if (cfg.onChange) cfg.onChange(value);
      syncLabel(value);
      UI.closePanels();
      restoreFormPortals();
    });

    search.addEventListener('input', function () {
      renderList(search.value);
    });
    search.addEventListener('click', function (e) { e.stopPropagation(); });

    if (cfg.clearId) {
      var clearBtn = UI.$(cfg.clearId);
      if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (cfg.onChange) cfg.onChange('');
          syncLabel('');
          UI.closePanels();
          restoreFormPortals();
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel(cfg.getValue ? cfg.getValue() : '');
    return { syncLabel: syncLabel, renderList: renderList };
  }

  fillSinglePanel('formGroupPanel', GROUPS);
  fillSinglePanel('batchGroupPanel', GROUPS);
  fillSinglePanel('batchTypePanel', TYPES);
  fillSinglePanel('batchSeriesPanel', SERIES);
  fillSinglePanel('batchOwnerPanel', OWNERS);

  formClearApis = {
    secret: UI.bindInputClearable({ wrapId: 'formClientSecretWrap' })
  };

  formSelects = {
    group: UI.bindSingleSelect({
      wrapId: 'formGroupWrap', triggerId: 'formGroupTrigger', panelId: 'formGroupPanel', labelId: 'formGroupLabel', clearId: 'formGroupClear',
      getValue: function () { return state.formGroup; },
      onChange: function (v) { state.formGroup = v; clearFormItemError('formGroupItem'); }
    }),
    type: bindSearchSingleSelect({
      wrapId: 'formTypeWrap', triggerId: 'formTypeTrigger', panelId: 'formTypePanel',
      labelId: 'formTypeLabel', listId: 'formTypeList', searchId: 'formTypeSearch', clearId: 'formTypeClear',
      getOptions: function () { return TYPES; },
      getValue: function () { return state.formType; },
      onChange: function (v) { state.formType = v; clearFormItemError('formTypeItem'); }
    }),
    series: bindSearchSingleSelect({
      wrapId: 'formSeriesWrap', triggerId: 'formSeriesTrigger', panelId: 'formSeriesPanel',
      labelId: 'formSeriesLabel', listId: 'formSeriesList', searchId: 'formSeriesSearch', clearId: 'formSeriesClear',
      getOptions: function () { return SERIES; },
      getValue: function () { return state.formSeries; },
      onChange: function (v) { state.formSeries = v; clearFormItemError('formSeriesItem'); }
    }),
    owner: bindSearchSingleSelect({
      wrapId: 'formOwnerWrap', triggerId: 'formOwnerTrigger', panelId: 'formOwnerPanel',
      labelId: 'formOwnerLabel', listId: 'formOwnerList', searchId: 'formOwnerSearch', clearId: 'formOwnerClear',
      getOptions: function () { return OWNERS; },
      getValue: function () { return state.formOwner; },
      onChange: function (v) { state.formOwner = v; clearFormItemError('formOwnerItem'); }
    })
  };

  ['formGroupTrigger'].forEach(function (id) {
    var el = UI.$(id);
    if (!el) return;
    el.addEventListener('click', function () { restoreFormPortals(); });
  });
  document.addEventListener('click', function () { restoreFormPortals(); });

  batchSelects = {
    group: UI.bindSingleSelect({
      wrapId: 'batchGroupWrap', triggerId: 'batchGroupTrigger', panelId: 'batchGroupPanel', labelId: 'batchGroupLabel',
      getValue: function () { return state.batchGroup; },
      onChange: function (v) { state.batchGroup = v; }
    }),
    type: UI.bindSingleSelect({
      wrapId: 'batchTypeWrap', triggerId: 'batchTypeTrigger', panelId: 'batchTypePanel', labelId: 'batchTypeLabel',
      getValue: function () { return state.batchType; },
      onChange: function (v) { state.batchType = v; }
    }),
    series: UI.bindSingleSelect({
      wrapId: 'batchSeriesWrap', triggerId: 'batchSeriesTrigger', panelId: 'batchSeriesPanel', labelId: 'batchSeriesLabel',
      getValue: function () { return state.batchSeries; },
      onChange: function (v) { state.batchSeries = v; }
    }),
    owner: UI.bindSingleSelect({
      wrapId: 'batchOwnerWrap', triggerId: 'batchOwnerTrigger', panelId: 'batchOwnerPanel', labelId: 'batchOwnerLabel',
      getValue: function () { return state.batchOwner; },
      onChange: function (v) { state.batchOwner = v; }
    })
  };
  UI.bindSeg('batchStatusSeg', function (v) { state.batchStatus = v; });
  UI.bindSeg('statusSeg');

  (function bindIconUpload() {
    var box = UI.$('iconUploadBox');
    var input = UI.$('iconFileInput');
    var removeBtn = UI.$('iconRemoveBtn');
    if (!box || !input) return;

    function pick() { input.click(); }

    box.addEventListener('click', function (e) {
      if (e.target.closest('#iconRemoveBtn')) return;
      pick();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    if (removeBtn) {
      removeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        state.formIcon = '';
        input.value = '';
        syncIconPreview();
      });
    }
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/\.jpe?g$|\.png$/i.test(file.name) && file.type !== 'image/jpeg' && file.type !== 'image/png') {
        UI.showToast('请上传 jpg 或 png 图片', 'error');
        input.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        UI.showToast('图片需小于 2M', 'error');
        input.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        state.formIcon = String(e.target.result || '');
        syncIconPreview();
      };
      reader.readAsDataURL(file);
    });
  })();

  batchMenuApi = UI.bindBatchMenu({
    wrapId: 'batchWrap',
    btnId: 'batchBtn',
    menuId: 'batchMenu',
    onAction: function (action) { openBatchModal(action); }
  });
  syncBatchBtn();

  UI.bindPagination({
    containerId: 'pagination',
    getTotal: function () { return getFiltered().length; },
    getPage: function () { return state.page; },
    getPageSize: function () { return state.pageSize; },
    onPageChange: function (page) { state.page = page; renderTable(); },
    onPageSizeChange: function (size) { state.pageSize = size; state.page = 1; renderTable(); }
  });

  function doSearch() {
    state.keyword = UI.$('filterKeyword').value || '';
    state.appIdKw = UI.$('filterAppId').value || '';
    state.page = 1;
    state.selectedIds.clear();
    renderTable();
  }

  function doReset() {
    UI.$('filterKeyword').value = '';
    UI.$('filterAppId').value = '';
    state.keyword = '';
    state.appIdKw = '';
    state.platform = '';
    state.bizType = '';
    state.groups = [];
    state.types = [];
    state.series = [];
    state.owners = [];
    state.status = '';
    state.page = 1;
    state.selectedIds.clear();
    ['group', 'type', 'series', 'owner'].forEach(function (key) {
      var api = filterMultis[key];
      if (api && api.render) api.render();
    });
    filterSingles.platform.syncLabel('');
    filterSingles.bizType.syncLabel('');
    filterSingles.status.syncLabel('');
    renderTable();
  }

  UI.$('searchBtn').addEventListener('click', doSearch);
  UI.$('resetBtn').addEventListener('click', doReset);
  UI.$('filterKeyword').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
  UI.$('filterAppId').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
  UI.$('formCancelBtn').addEventListener('click', closeForm);
  UI.$('formModalClose').addEventListener('click', closeForm);
  UI.$('formSubmitBtn').addEventListener('click', submitForm);

  UI.$('tableBody').addEventListener('change', function (e) {
    var input = e.target.closest('[data-check]');
    if (!input) return;
    var id = input.getAttribute('data-check');
    if (input.checked) state.selectedIds.add(id);
    else state.selectedIds.delete(id);
    renderTable();
  });

  UI.$('checkAll').addEventListener('change', function () {
    var checked = this.checked;
    var list = getFiltered();
    var start = (state.page - 1) * state.pageSize;
    var pageRows = list.slice(start, start + state.pageSize);
    pageRows.forEach(function (row) {
      if (checked) state.selectedIds.add(row.id);
      else state.selectedIds.delete(row.id);
    });
    renderTable();
  });

  UI.$('tableBody').addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      UI.copyText(copyBtn.getAttribute('data-copy'));
      return;
    }
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var row = rows.find(function (r) { return r.id === id; });
    if (row && btn.getAttribute('data-action') === 'edit') openForm(row);
  });

  function bindBatchModal(prefix, saveFn) {
    UI.$(prefix + 'Close').addEventListener('click', function () { UI.closeModal(prefix + 'Modal'); });
    UI.$(prefix + 'Cancel').addEventListener('click', function () { UI.closeModal(prefix + 'Modal'); });
    UI.$(prefix + 'Save').addEventListener('click', saveFn);
  }

  bindBatchModal('batchGroup', function () {
    if (!state.batchGroup) {
      UI.showToast('请选择产品组', 'error');
      return;
    }
    applyBatch(function (row) { row.group = state.batchGroup; }, '批量修改产品组成功');
    UI.closeModal('batchGroupModal');
  });
  bindBatchModal('batchType', function () {
    if (!state.batchType) {
      UI.showToast('请选择产品类型', 'error');
      return;
    }
    applyBatch(function (row) { row.type = state.batchType; }, '批量修改产品类型成功');
    UI.closeModal('batchTypeModal');
  });
  bindBatchModal('batchSeries', function () {
    if (!state.batchSeries) {
      UI.showToast('请选择产品系列', 'error');
      return;
    }
    applyBatch(function (row) { row.series = state.batchSeries; }, '批量修改产品系列成功');
    UI.closeModal('batchSeriesModal');
  });
  bindBatchModal('batchOwner', function () {
    if (!state.batchOwner) {
      UI.showToast('请选择负责人', 'error');
      return;
    }
    applyBatch(function (row) { row.owner = state.batchOwner; }, '批量修改负责人成功');
    UI.closeModal('batchOwnerModal');
  });
  bindBatchModal('batchStatus', function () {
    var status = UI.getSegValue('batchStatusSeg') || state.batchStatus || '启用';
    applyBatch(function (row) { row.status = status; }, '批量修改状态成功');
    UI.closeModal('batchStatusModal');
  });

  UI.$('formModal').addEventListener('click', function (e) {
    if (e.target === UI.$('formModal')) e.stopPropagation();
  });

  var BATCH_MODALS = ['batchGroupModal', 'batchTypeModal', 'batchSeriesModal', 'batchOwnerModal', 'batchStatusModal'];
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (UI.$('formModal').classList.contains('is-open')) closeForm();
    else {
      BATCH_MODALS.forEach(function (id) {
        if (UI.$(id) && UI.$(id).classList.contains('is-open')) UI.closeModal(id);
      });
    }
  });

  renderTable();
})();
