/* 采集任务 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var USERS = Array.from({ length: 16 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var FOLDERS = [
    '企业素材库/短剧/竖版',
    '企业素材库/短剧/横版',
    '企业素材库/投放素材',
    '企业素材库/测试文件夹',
    '企业素材库/品牌素材',
    '企业素材库/竞品参考',
    '企业素材库/海外投放/TT',
    '企业素材库/海外投放/FB'
  ];

  var SIZE_TREE = [
    { group: '竖版(9:16)', values: ['1080x1920', '720x1280'] },
    { group: '横版(16:9)', values: ['1920x1080', '1280x720'] },
    { group: '方形(1:1)', values: ['1080x1080', '800x800', '512x512', '300x300', '180x180'] }
  ];

  var DEFAULT_NAME = '{序号}_{创意人}_{尺寸}_{时长}_{YYYYMMDD}';
  var DEFAULT_FOLDER_NAME = '{创意人}_{YYYYMMDD}';
  var TASK_STATUSES = ['待开始', '进行中', '已完成', '已取消', '已失败'];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function pick(arr, i) { return arr[i % arr.length]; }

  var SAMPLE_URLS = [
    'https://adx-game-material.dataeye.com/playlet/material/detail?id=8821',
    'https://adx-game-material.dataeye.com/playlet/material/detail?id=8834',
    'https://appgrowing-global.youcloud.com/leaflet?purpose=1&viewType=material',
    'https://oversea-v2.dataeye.com/product/380?type=2',
    'https://www.tiktok.com/@caseoh_/video/7123456789012345678',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.douyin.com/video/7123456789012345678'
  ];

  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = '0' + s;
    return s.slice(-4);
  }

  function buildUrls(i, count) {
    var n = Math.max(1, count || 1);
    var list = [];
    var j;
    for (j = 0; j < n; j++) {
      list.push(pick(SAMPLE_URLS, i + j) + '&t=' + (1000 + i * 10 + j));
    }
    return list;
  }

  function defaultConfig() {
    return {
      creative: '',
      nameTpl: DEFAULT_NAME,
      md5: true,
      resize: true,
      size: '1080x1920',
      sizeGroup: '竖版(9:16)',
      trim: true,
      trimMode: '剪掉片尾',
      trimSec: 4,
      trimStart: 0,
      trimEnd: 10,
      uploadXmp: '是',
      filterDup: true,
      folderMode: '已有文件夹',
      targetFolder: FOLDERS[0],
      parentFolder: '',
      folderName: DEFAULT_FOLDER_NAME,
      configured: false
    };
  }

  var PLATFORMS = ['adxray', 'appgrowing', 'tiktok', 'youtube', 'douyin'];

  var FAIL_REASON = '视频流损坏(0x0),重新下载';

  function buildSubs(task, count) {
    var list = [];
    var i;
    var baseName = (task.config && task.config.nameTpl)
      ? String(task.config.nameTpl).replace(/\{[^}]+\}/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '') || '素材'
      : '素材';
    if (baseName.indexOf('{') !== -1) baseName = '素材';
    for (i = 0; i < count; i++) {
      var st;
      if (task.status === '已完成') {
        /* 主任务已完成时仍插入少量失败示例，便于详情演示 */
        st = (i === 1 || i === 5 || i % 13 === 8) ? '已失败' : '已完成';
      } else if (task.status === '待开始') {
        st = '待开始';
      } else if (task.status === '进行中') {
        if (i === 2 || i === 7) st = '已失败';
        else st = i < Math.floor(count / 2) ? '已完成' : '进行中';
      } else if (task.status === '已取消') {
        st = i < task.success ? '已完成' : '已取消';
      } else {
        st = i < task.success ? '已完成' : '已失败';
      }
      var updated = new Date();
      if (task.updatedAt && task.updatedAt.indexOf('-') !== -1) {
        updated = new Date(String(task.updatedAt).replace(/-/g, '/'));
        if (isNaN(updated.getTime())) updated = new Date();
      }
      updated.setSeconds(updated.getSeconds() + i * 3);
      list.push({
        id: task.id + '-s' + (i + 1),
        name: baseName + '_' + (400 + i) + '_' + (1786330079705 + i * 17) + '_' + (1500 + i),
        platform: pick(PLATFORMS, i + (task.id ? Number(task.id) : 0)),
        url: (task.urls && task.urls[i % Math.max(1, (task.urls || []).length)]) || ('https://example.com/material/' + task.id + '/' + (i + 1)),
        status: st,
        failReason: st === '已失败' ? FAIL_REASON : '',
        updatedAt: st === '待开始' ? (task.createdAt || formatDateTime(updated)) : formatDateTime(updated)
      });
    }
    return list;
  }

  function calcProcessing(row) {
    return Math.max(0, (row.total || 0) - (row.success || 0) - (row.fail || 0));
  }

  function buildMockTasks() {
    var list = [];
    var statuses = ['已完成', '已失败', '进行中', '已完成', '已取消', '待开始', '进行中', '已完成'];
    var i;
    for (i = 0; i < 18; i++) {
      var status = statuses[i % statuses.length];
      var total = status === '进行中' && i % 4 === 2 ? 1000 : (12 + (i % 6) * 5);
      var success = 0;
      var fail = 0;
      var processing = 0;
      if (status === '待开始') {
        success = 0;
        fail = 0;
        processing = total;
      } else if (status === '进行中') {
        success = Math.floor(total * 0.35);
        fail = Math.floor(total * 0.05);
        processing = total - success - fail;
      } else if (status === '已完成') {
        success = total;
        fail = 0;
        processing = 0;
      } else if (status === '已取消') {
        success = Math.floor(total / 3);
        fail = total - success;
        processing = 0;
      } else {
        success = Math.floor(total / 5);
        fail = total - success;
        if (fail < 1) fail = 1;
        processing = 0;
      }
      var created = new Date();
      created.setHours(created.getHours() - i * 5 - (i % 3));
      var updated = new Date(created);
      if (status === '已完成' || status === '已失败' || status === '已取消') {
        updated.setMinutes(updated.getMinutes() + 18 + (i % 20));
      } else if (status === '进行中') {
        updated.setMinutes(updated.getMinutes() + 6 + (i % 10));
      }
      var urlCount = Math.min(4, 1 + (i % 4));
      var cfg = defaultConfig();
      cfg.creative = pick(USERS, i);
      cfg.configured = true;
      cfg.nameTpl = pick(['塔防打蛇_{编号}', '竞品竖版_{编号}_{创意人}', '口播混剪_{编号}'], i);
      if (i % 3 === 0) cfg.trim = false;
      var task = {
        id: pad4(3301 - i),
        creator: pick(USERS, i),
        total: total,
        status: status,
        success: success,
        fail: fail,
        processing: processing,
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        updatedAt: formatDateTime(status === '待开始' ? created : updated),
        urls: buildUrls(i, urlCount),
        config: cfg
      };
      task.subs = buildSubs(task, Math.min(total, 48));
      list.push(task);
    }
    return list;
  }

  function buildPendingDrafts() {
    var list = [];
    var i;
    for (i = 0; i < 9; i++) {
      var created = new Date();
      created.setMinutes(created.getMinutes() - i * 17);
      var total = 6 + i * 2;
      var cfg = defaultConfig();
      list.push({
        id: pad4(3401 + i),
        creator: pick(USERS, i + 3),
        total: total,
        status: '待提交',
        success: 0,
        fail: 0,
        processing: total,
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        updatedAt: formatDateTime(created),
        urls: buildUrls(20 + i, 1 + (i % 3)),
        config: cfg,
        isPending: true
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockTasks();
  var PENDING_DRAFTS = buildPendingDrafts();
  var nextId = 3410;

  var state = {
    draft: { creator: '', status: '', start: null, end: null },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    activeId: null,
    confirmId: null,
    pendingDeleteId: null,
    detailId: null,
    subDraft: { status: '' },
    subApplied: { status: '' },
    subPage: 1,
    subPageSize: 20,
    subPaginationBound: false,
    subSelected: {},
    cfg: defaultConfig(),
    sizeGroup: '竖版(9:16)'
  };

  /* ---------- searchable single select ---------- */
  function bindSearchSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    var list = $(cfg.listId);
    var search = cfg.searchId ? $(cfg.searchId) : null;
    if (!wrap || !trigger || !panel || !label || !list) return null;

    function getValue() { return cfg.getValue ? cfg.getValue() : ''; }

    function syncLabel() {
      var value = getValue();
      var prefix = cfg.prefix || '';
      if (!value) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.innerHTML = prefix + escapeHtml(value);
        wrap.classList.add('has-value');
      }
    }

    function render() {
      var kw = search ? (search.value || '').trim().toLowerCase() : '';
      var options = (cfg.getOptions ? cfg.getOptions() : []) || [];
      var value = getValue();
      var html = options.filter(function (opt) {
        return !kw || String(opt).toLowerCase().indexOf(kw) !== -1;
      }).map(function (opt) {
        var active = opt === value ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      }).join('');
      list.innerHTML = html || '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
        p.classList.remove('is-open', 'is-dropup', 'is-align-right');
      });
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
        if (search) {
          search.value = '';
          search.focus();
        }
        if (UI.adjustDropdownPlacement) {
          UI.adjustDropdownPlacement(panel, trigger);
          requestAnimationFrame(function () {
            UI.adjustDropdownPlacement(panel, trigger);
          });
        }
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      var value = opt.getAttribute('data-value') || '';
      if (cfg.onChange) cfg.onChange(value);
      syncLabel();
      panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
      trigger.classList.remove('is-open');
    });

    if (search) {
      search.addEventListener('input', function () { render(); });
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    if (cfg.clearId) {
      var clearBtn = $(cfg.clearId);
      if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (cfg.onChange) cfg.onChange('');
          syncLabel();
          panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel, render: render };
  }

  document.addEventListener('click', function () {
    document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open', 'is-dropup', 'is-align-right');
    });
  });

  /* ---------- filters ---------- */
  var dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '创建时间：',
    defaultShortcut: 'last7',
    onChange: function (start, end) {
      state.draft.start = start;
      state.draft.end = end;
    }
  });

  if (dateApi) {
    state.draft.start = dateApi.getStart();
    state.draft.end = dateApi.getEnd();
  }

  bindSearchSelect({
    wrapId: 'creatorWrap',
    triggerId: 'creatorTrigger',
    panelId: 'creatorPanel',
    labelId: 'creatorLabel',
    listId: 'creatorList',
    searchId: 'creatorSearch',
    clearId: 'creatorClear',
    prefix: '创建人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.draft.creator; },
    onChange: function (v) { state.draft.creator = v; }
  });

  UI.bindSingleSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    clearId: 'statusClear',
    prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v; }
  });

  function applyFilters() {
    var start = dateApi ? dateApi.getStart() : state.draft.start;
    var end = dateApi ? dateApi.getEnd() : state.draft.end;
    state.draft.start = start;
    state.draft.end = end;
    state.applied = {
      creator: state.draft.creator || '',
      status: state.draft.status || '',
      start: start,
      end: end
    };
    state.page = 1;
  }

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = row.createdDate;
    var s = formatDateYMD(start);
    var e = formatDateYMD(end);
    return d >= s && d <= e;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f) return ALL_ROWS.slice();
    return ALL_ROWS.filter(function (row) {
      if (f.creator && row.creator !== f.creator) return false;
      if (f.status && row.status !== f.status) return false;
      if (!inDateRange(row, f.start, f.end)) return false;
      return true;
    });
  }

  function resultText(row) {
    var success = row.success || 0;
    var fail = row.fail || 0;
    var processing = row.processing != null ? row.processing : calcProcessing(row);
    if (row.status === '待开始' || row.status === '进行中') {
      return '成功：' + success + '；失败：' + fail + '；进行中：' + processing;
    }
    return '成功：' + success + '；失败：' + fail;
  }

  function summaryDisplay(urls) {
    if (!urls || !urls.length) return '—';
    return urls[0];
  }

  function summaryTipText(urls) {
    return (urls || []).join('\n');
  }

  function actionHtml(row) {
    var canCancel = row.status === '待开始' || row.status === '进行中';
    var canRetry = row.status === '已取消' || row.status === '已失败';
    var html = '<div class="action-links">';
    html += '<button class="link" type="button" data-act="detail" data-id="' + escapeHtml(row.id) + '">详情</button>';
    html += '<button class="link"' + (canCancel ? '' : ' disabled') + ' type="button" data-act="cancel" data-id="' + escapeHtml(row.id) + '"' + (canCancel ? '' : ' disabled') + '>取消</button>';
    html += '<button class="link"' + (canRetry ? '' : ' disabled') + ' type="button" data-act="retry" data-id="' + escapeHtml(row.id) + '"' + (canRetry ? '' : ' disabled') + '>重试</button>';
    html += '</div>';
    return html;
  }

  function findTask(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; }) ||
      PENDING_DRAFTS.find(function (r) { return r.id === id; });
  }

  function findPending(id) {
    return PENDING_DRAFTS.find(function (r) { return r.id === id; });
  }

  function syncPendingBadge() {
    var badge = $('pendingBadge');
    if (!badge) return;
    var n = PENDING_DRAFTS.length;
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }

  function renderPendingList() {
    var list = $('pendingList');
    var empty = $('pendingEmpty');
    if (!list) return;
    if (!PENDING_DRAFTS.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = PENDING_DRAFTS.map(function (row) {
      return '<div class="pending-item" data-id="' + escapeHtml(row.id) + '">' +
        '<div class="pending-item__main">' +
          '<div class="pending-item__id">ID ' + escapeHtml(row.id) + ' · ' + row.total + ' 个素材</div>' +
          '<div class="pending-item__summary" title="' + escapeHtml(summaryDisplay(row.urls)) + '">' + escapeHtml(summaryDisplay(row.urls)) + '</div>' +
          '<div class="pending-item__meta">' + escapeHtml(row.creator) + ' · ' + escapeHtml(row.createdAt) + '</div>' +
        '</div>' +
        '<div class="pending-item__action">' +
          '<button class="btn btn--primary btn--sm" type="button" data-pending-config="' + escapeHtml(row.id) + '">配置任务</button>' +
          '<button class="btn btn--default btn--sm" type="button" data-pending-delete="' + escapeHtml(row.id) + '">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderTable() {
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
        return '<tr>' +
          '<td>' + escapeHtml(row.id) + '</td>' +
          '<td><span class="summary-cell" data-summary-id="' + escapeHtml(row.id) + '">' + escapeHtml(summaryDisplay(row.urls)) + '</span></td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt || row.createdAt) + '</td>' +
          '<td>' + UI.taskStatusDot(row.status) + '</td>' +
          '<td><span class="result-text">' + escapeHtml(resultText(row)) + '</span></td>' +
          '<td class="col-action">' + actionHtml(row) + '</td>' +
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
        getState: function () {
          return { page: state.page, pageSize: state.pageSize, total: getFilteredRows().length };
        },
        setPage: function (p) { state.page = p; renderTable(); },
        setPageSize: function (s) { state.pageSize = s; state.page = 1; renderTable(); }
      });
    }

    syncPendingBadge();
    if (window.ColResize) window.ColResize.initAll(document);
  }

  /* ---------- config form ---------- */
  var cfgCreativeApi = bindSearchSelect({
    wrapId: 'cfgCreativeWrap',
    triggerId: 'cfgCreativeTrigger',
    panelId: 'cfgCreativePanel',
    labelId: 'cfgCreativeLabel',
    listId: 'cfgCreativeList',
    searchId: 'cfgCreativeSearch',
    clearId: 'cfgCreativeClear',
    getOptions: function () { return USERS; },
    getValue: function () { return state.cfg.creative; },
    onChange: function (v) {
      state.cfg.creative = v;
      clearError('cfgCreativeItem');
    }
  });

  var cfgTargetApi = bindSearchSelect({
    wrapId: 'cfgTargetFolderWrap',
    triggerId: 'cfgTargetFolderTrigger',
    panelId: 'cfgTargetFolderPanel',
    labelId: 'cfgTargetFolderLabel',
    listId: 'cfgTargetFolderList',
    searchId: 'cfgTargetFolderSearch',
    clearId: 'cfgTargetFolderClear',
    getOptions: function () { return FOLDERS; },
    getValue: function () { return state.cfg.targetFolder; },
    onChange: function (v) {
      state.cfg.targetFolder = v;
      clearError('cfgTargetFolderItem');
    }
  });

  var cfgParentApi = bindSearchSelect({
    wrapId: 'cfgParentFolderWrap',
    triggerId: 'cfgParentFolderTrigger',
    panelId: 'cfgParentFolderPanel',
    labelId: 'cfgParentFolderLabel',
    listId: 'cfgParentFolderList',
    searchId: 'cfgParentFolderSearch',
    clearId: 'cfgParentFolderClear',
    getOptions: function () { return FOLDERS; },
    getValue: function () { return state.cfg.parentFolder; },
    onChange: function (v) { state.cfg.parentFolder = v; }
  });

  UI.bindSingleSelect({
    wrapId: 'cfgTrimModeWrap',
    triggerId: 'cfgTrimModeTrigger',
    panelId: 'cfgTrimModePanel',
    labelId: 'cfgTrimModeLabel',
    getValue: function () { return state.cfg.trimMode; },
    onChange: function (v) {
      state.cfg.trimMode = v;
      syncTrimFields();
    }
  });

  function renderSizeCascade() {
    var groupList = $('cfgSizeGroupList');
    var valueList = $('cfgSizeValueList');
    if (!groupList || !valueList) return;
    groupList.innerHTML = SIZE_TREE.map(function (g) {
      var active = g.group === state.sizeGroup ? ' is-active' : '';
      return '<button class="size-cascade__item' + active + '" type="button" data-group="' + escapeHtml(g.group) + '">' + escapeHtml(g.group) + '</button>';
    }).join('');
    var current = SIZE_TREE.find(function (g) { return g.group === state.sizeGroup; }) || SIZE_TREE[0];
    valueList.innerHTML = current.values.map(function (v) {
      var active = v === state.cfg.size ? ' is-active' : '';
      return '<button class="size-cascade__item' + active + '" type="button" data-size="' + escapeHtml(v) + '">' + escapeHtml(v) + '</button>';
    }).join('');
  }

  function syncSizeLabel() {
    var label = $('cfgSizeLabel');
    if (label) label.textContent = state.cfg.size || '请选择';
  }

  (function bindSizeCascade() {
    var wrap = $('cfgSizeWrap');
    var trigger = $('cfgSizeTrigger');
    var panel = $('cfgSizePanel');
    if (!wrap || !trigger || !panel) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        renderSizeCascade();
        if (UI.adjustDropdownPlacement) {
          UI.adjustDropdownPlacement(panel, trigger);
          requestAnimationFrame(function () {
            UI.adjustDropdownPlacement(panel, trigger);
          });
        }
      }
    });
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var groupBtn = e.target.closest('[data-group]');
      if (groupBtn) {
        state.sizeGroup = groupBtn.getAttribute('data-group');
        renderSizeCascade();
        return;
      }
      var sizeBtn = e.target.closest('[data-size]');
      if (sizeBtn) {
        state.cfg.size = sizeBtn.getAttribute('data-size');
        state.cfg.sizeGroup = state.sizeGroup;
        syncSizeLabel();
        panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
        trigger.classList.remove('is-open');
      }
    });
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
  })();

  function bindSwitch(id, key, onToggle) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('click', function () {
      var on = !el.classList.contains('is-on');
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      state.cfg[key] = on;
      if (onToggle) onToggle(on);
    });
  }

  bindSwitch('cfgMd5Switch', 'md5');
  bindSwitch('cfgSizeSwitch', 'resize', function (on) {
    var wrap = $('cfgSizeWrap');
    if (wrap) wrap.classList.toggle('is-hidden', !on);
  });
  bindSwitch('cfgTrimSwitch', 'trim', function (on) {
    $('cfgTrimModeWrap').style.display = on ? '' : 'none';
    syncTrimFields();
  });
  bindSwitch('cfgDupSwitch', 'filterDup');

  function syncTrimFields() {
    var trimOn = state.cfg.trim;
    var mode = state.cfg.trimMode;
    var simple = $('cfgTrimSimple');
    var range = $('cfgTrimRange');
    var modeWrap = $('cfgTrimModeWrap');
    if (modeWrap) modeWrap.style.display = trimOn ? '' : 'none';
    if (!trimOn) {
      if (simple) simple.classList.add('is-hidden');
      if (range) range.classList.add('is-hidden');
      return;
    }
    if (mode === '片段截取') {
      if (simple) simple.classList.add('is-hidden');
      if (range) range.classList.remove('is-hidden');
    } else {
      if (simple) simple.classList.remove('is-hidden');
      if (range) range.classList.add('is-hidden');
    }
  }

  function syncXmpBlock() {
    var show = state.cfg.uploadXmp === '是';
    var block = $('cfgXmpBlock');
    var dupItem = $('cfgDupItem');
    if (block) block.classList.toggle('is-hidden', !show);
    if (dupItem) dupItem.classList.toggle('is-hidden', !show);
    syncFolderMode();
  }

  function syncFolderMode() {
    var create = state.cfg.folderMode === '创建文件夹';
    var existing = $('cfgTargetFolderItem');
    var createBlock = $('cfgCreateFolderBlock');
    if (existing) existing.classList.toggle('is-hidden', create);
    if (createBlock) createBlock.classList.toggle('is-hidden', !create);
  }

  UI.bindSeg('cfgXmpSeg', function (v) {
    state.cfg.uploadXmp = v;
    syncXmpBlock();
  });
  UI.bindSeg('cfgFolderSeg', function (v) {
    state.cfg.folderMode = v;
    syncFolderMode();
  });

  function insertToken(input, token, repeatable) {
    if (!input) return;
    var val = input.value || '';
    if (!repeatable && val.indexOf(token) !== -1) return;
    var start = input.selectionStart != null ? input.selectionStart : val.length;
    var end = input.selectionEnd != null ? input.selectionEnd : val.length;
    input.value = val.slice(0, start) + token + val.slice(end);
    var pos = start + token.length;
    input.focus();
    if (input.setSelectionRange) input.setSelectionRange(pos, pos);
    syncMetaTags(input.id);
  }

  function syncMetaTags(inputId) {
    var input = $(inputId);
    if (!input) return;
    var tags = document.querySelector('.meta-tags[data-target="' + inputId + '"]');
    if (!tags) return;
    var val = input.value || '';
    tags.querySelectorAll('.meta-tag').forEach(function (btn) {
      var token = btn.getAttribute('data-token') || '';
      var repeat = btn.getAttribute('data-repeat') === '1';
      btn.classList.toggle('is-used', !repeat && val.indexOf(token) !== -1);
    });
  }

  document.querySelectorAll('.meta-tags').forEach(function (wrap) {
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.meta-tag');
      if (!btn || btn.classList.contains('is-used')) return;
      var inputId = wrap.getAttribute('data-target');
      insertToken($(inputId), btn.getAttribute('data-token') || '', btn.getAttribute('data-repeat') === '1');
    });
  });

  ['cfgNameInput', 'cfgFolderNameInput'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', function () {
      syncMetaTags(id);
      if (id === 'cfgNameInput') clearError('cfgNameItem');
      if (id === 'cfgFolderNameInput') clearError('cfgFolderNameItem');
    });
  });

  function clearError(itemId) {
    var item = $(itemId);
    if (item) item.classList.remove('is-error');
  }

  function setError(itemId, on) {
    var item = $(itemId);
    if (item) item.classList.toggle('is-error', !!on);
  }

  function fillConfigForm(cfg) {
    state.cfg = Object.assign(defaultConfig(), cfg || {});
    state.sizeGroup = state.cfg.sizeGroup || '竖版(9:16)';
    $('cfgNameInput').value = state.cfg.nameTpl || DEFAULT_NAME;
    $('cfgFolderNameInput').value = state.cfg.folderName || DEFAULT_FOLDER_NAME;
    $('cfgTrimSec').value = state.cfg.trimSec;
    $('cfgTrimStart').value = state.cfg.trimStart;
    $('cfgTrimEnd').value = state.cfg.trimEnd;

    ['cfgMd5Switch', 'cfgSizeSwitch', 'cfgTrimSwitch', 'cfgDupSwitch'].forEach(function (id) {
      var key = id === 'cfgMd5Switch' ? 'md5' : id === 'cfgSizeSwitch' ? 'resize' : id === 'cfgTrimSwitch' ? 'trim' : 'filterDup';
      var el = $(id);
      var on = !!state.cfg[key];
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    UI.setSegValue('cfgXmpSeg', state.cfg.uploadXmp);
    UI.setSegValue('cfgFolderSeg', state.cfg.folderMode);
    $('cfgSizeWrap').classList.toggle('is-hidden', !state.cfg.resize);
    syncSizeLabel();
    syncTrimFields();
    syncXmpBlock();
    if (cfgCreativeApi) cfgCreativeApi.syncLabel();
    if (cfgTargetApi) cfgTargetApi.syncLabel();
    if (cfgParentApi) cfgParentApi.syncLabel();
    var trimModeLabel = $('cfgTrimModeLabel');
    if (trimModeLabel) trimModeLabel.textContent = state.cfg.trimMode;
    document.querySelectorAll('#cfgTrimModePanel .single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', opt.getAttribute('data-value') === state.cfg.trimMode);
    });
    syncMetaTags('cfgNameInput');
    syncMetaTags('cfgFolderNameInput');
    ['cfgCreativeItem', 'cfgNameItem', 'cfgTargetFolderItem', 'cfgFolderNameItem'].forEach(clearError);
  }

  function openConfig(task) {
    state.activeId = task.id;
    var cfg = Object.assign(defaultConfig(), task.config || {});
    if (!cfg.creative) cfg.creative = task.creator || '';
    fillConfigForm(cfg);
    UI.openDrawer('configDrawer');
  }

  function closeConfigDrawer() {
    UI.closeDrawer('configDrawer');
    syncPendingBadge();
    renderPendingList();
  }

  function validateConfig() {
    var ok = true;
    if (!state.cfg.creative) {
      setError('cfgCreativeItem', true);
      ok = false;
    }
    var name = ($('cfgNameInput').value || '').trim();
    if (!name) {
      setError('cfgNameItem', true);
      ok = false;
    }
    if (state.cfg.uploadXmp === '是') {
      if (state.cfg.folderMode === '已有文件夹' && !state.cfg.targetFolder) {
        setError('cfgTargetFolderItem', true);
        ok = false;
      }
      if (state.cfg.folderMode === '创建文件夹' && !($('cfgFolderNameInput').value || '').trim()) {
        setError('cfgFolderNameItem', true);
        ok = false;
      }
    }
    return ok;
  }

  function collectConfig() {
    state.cfg.nameTpl = ($('cfgNameInput').value || '').trim();
    state.cfg.folderName = ($('cfgFolderNameInput').value || '').trim();
    state.cfg.trimSec = Number($('cfgTrimSec').value) || 0;
    state.cfg.trimStart = Number($('cfgTrimStart').value) || 0;
    state.cfg.trimEnd = Number($('cfgTrimEnd').value) || 0;
    state.cfg.configured = true;
    return Object.assign({}, state.cfg);
  }

  /* ---------- detail ---------- */
  UI.bindSingleSelect({
    wrapId: 'subStatusWrap',
    triggerId: 'subStatusTrigger',
    panelId: 'subStatusPanel',
    labelId: 'subStatusLabel',
    clearId: 'subStatusClear',
    prefix: '状态：',
    getValue: function () { return state.subDraft.status; },
    onChange: function (v) { state.subDraft.status = v; }
  });

  function onOff(v) { return v ? '开' : '关'; }

  function detailTargetFolder(cfg) {
    if (cfg.uploadXmp !== '是') return '—';
    if (cfg.folderMode === '创建文件夹') return cfg.folderName || '—';
    var folder = cfg.targetFolder || '';
    var parts = folder.split('/');
    return parts[parts.length - 1] || folder || '—';
  }

  function detailStorage(cfg) {
    if (cfg.uploadXmp !== '是') return '—';
    return cfg.folderMode || '—';
  }

  function detailResize(cfg) {
    if (!cfg.resize) return '关';
    return '开; ' + (cfg.size || '—');
  }

  function detailTrim(cfg) {
    if (!cfg.trim) return '关';
    if (cfg.trimMode === '片段截取') return '开; 片段截取 ' + cfg.trimStart + '-' + cfg.trimEnd + ' 秒';
    return '开; ' + cfg.trimMode + ' ' + cfg.trimSec + ' 秒';
  }

  function openDetail(task) {
    state.detailId = task.id;
    state.subDraft = { status: '' };
    state.subApplied = { status: '' };
    state.subPage = 1;
    state.subSelected = {};
    var cfg = task.config || defaultConfig();
    var grid = $('detailConfigGrid');
    /* 两列按行填充：左 ID/素材名称/修改尺寸/上传XMP/目标文件夹；右 创意人/修改MD5/剪辑时长/存储位置/创建时间 */
    var items = [
      ['ID', task.id],
      ['创意人', cfg.creative || task.creator || '—'],
      ['素材名称', cfg.nameTpl || '—'],
      ['修改MD5', onOff(!!cfg.md5)],
      ['修改尺寸', detailResize(cfg)],
      ['剪辑时长', detailTrim(cfg)],
      ['上传XMP', cfg.uploadXmp || '—'],
      ['存储位置', detailStorage(cfg)],
      ['目标文件夹', detailTargetFolder(cfg)],
      ['创建时间', task.createdAt]
    ];
    grid.innerHTML = items.map(function (it) {
      return '<div class="detail-kv"><div class="detail-kv__label">' + escapeHtml(it[0]) + '</div><div class="detail-kv__value">' + escapeHtml(String(it[1])) + '</div></div>';
    }).join('');
    var subStatusLabel = $('subStatusLabel');
    if (subStatusLabel) subStatusLabel.innerHTML = '状态：<span class="muted">请选择</span>';
    $('subStatusWrap').classList.remove('has-value');
    document.querySelectorAll('#subStatusPanel .single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === '');
    });
    renderSubTable();
    UI.openDrawer('detailDrawer');
  }

  function getFilteredSubs(task) {
    var f = state.subApplied;
    return (task.subs || []).filter(function (s) {
      if (f.status && s.status !== f.status) return false;
      return true;
    });
  }

  function syncSubBatchBtns() {
    var n = Object.keys(state.subSelected).length;
    var cancelBtn = $('subBatchCancelBtn');
    var retryBtn = $('subBatchRetryBtn');
    if (cancelBtn) cancelBtn.disabled = n === 0;
    if (retryBtn) retryBtn.disabled = n === 0;
  }

  function renderSubTable() {
    var task = findTask(state.detailId);
    if (!task) return;
    var rows = getFilteredSubs(task);
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.subPageSize) || 1);
    if (state.subPage > totalPages) state.subPage = totalPages;
    var start = (state.subPage - 1) * state.subPageSize;
    var pageRows = rows.slice(start, start + state.subPageSize);
    var body = $('subTableBody');
    var empty = $('subEmptyTip');
    var pageIds = pageRows.map(function (r) { return r.id; });
    var checkAll = $('subCheckAll');
    if (checkAll) {
      var allChecked = pageIds.length > 0 && pageIds.every(function (id) { return state.subSelected[id]; });
      checkAll.checked = allChecked;
      checkAll.indeterminate = !allChecked && pageIds.some(function (id) { return state.subSelected[id]; });
    }
    if (!pageRows.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      body.innerHTML = pageRows.map(function (s) {
        var canRetry = s.status === '已失败' || s.status === '已取消';
        var checked = state.subSelected[s.id] ? ' checked' : '';
        var err = s.failReason || '-';
        return '<tr>' +
          '<td class="col-check"><span class="cell-check"><input type="checkbox" data-sub-check="' + escapeHtml(s.id) + '"' + checked + ' aria-label="选择" /></span></td>' +
          '<td><span class="sub-name" title="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</span></td>' +
          '<td>' + escapeHtml(s.platform || '—') + '</td>' +
          '<td>' + UI.taskStatusDot(s.status) + '</td>' +
          '<td class="sub-fail' + (s.failReason ? ' has-error' : '') + '">' + escapeHtml(err) + '</td>' +
          '<td>' + escapeHtml(s.updatedAt || '—') + '</td>' +
          '<td class="col-action"><div class="action-links">' +
          '<button class="link" type="button" data-sub-retry="' + escapeHtml(s.id) + '"' + (canRetry ? '' : ' disabled') + '>重试</button>' +
          '</div></td></tr>';
      }).join('');
    }
    syncSubBatchBtns();
    UI.renderPagination({
      containerId: 'subPagination',
      total: total,
      page: state.subPage,
      pageSize: state.subPageSize
    });
    if (!state.subPaginationBound) {
      state.subPaginationBound = true;
      UI.bindPagination({
        containerId: 'subPagination',
        getState: function () {
          var t = findTask(state.detailId);
          return { page: state.subPage, pageSize: state.subPageSize, total: t ? getFilteredSubs(t).length : 0 };
        },
        setPage: function (p) { state.subPage = p; renderSubTable(); },
        setPageSize: function (s) { state.subPageSize = s; state.subPage = 1; renderSubTable(); }
      });
    }
  }

  /* ---------- events ---------- */
  UI.bindSidebar();

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  (function bindPendingPanel() {
    var wrap = $('pendingWrap');
    var btn = $('pendingBtn');
    var panel = $('pendingPanel');
    if (!wrap || !btn || !panel) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      panel.classList.toggle('is-open', open);
      if (open) renderPendingList();
    });

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var cfgBtn = e.target.closest('[data-pending-config]');
      if (cfgBtn) {
        var task = findPending(cfgBtn.getAttribute('data-pending-config'));
        if (!task) return;
        panel.classList.remove('is-open');
        openConfig(task);
        return;
      }
      var delBtn = e.target.closest('[data-pending-delete]');
      if (delBtn) {
        state.pendingDeleteId = delBtn.getAttribute('data-pending-delete');
        panel.classList.remove('is-open');
        UI.openModal('pendingDeleteModal');
      }
    });

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () {
      panel.classList.remove('is-open');
    });
  })();

  (function bindSummaryTip() {
    var tip = $('summaryTip');
    if (!tip) return;
    var hideTimer = null;

    function show(el) {
      var task = findTask(el.getAttribute('data-summary-id'));
      if (!task || !task.urls || !task.urls.length) return;
      tip.textContent = summaryTipText(task.urls);
      tip.hidden = false;
      var rect = el.getBoundingClientRect();
      var left = rect.left;
      var top = rect.bottom + 8;
      tip.style.left = '0px';
      tip.style.top = '0px';
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;
      if (left + tw > window.innerWidth - 16) left = window.innerWidth - tw - 16;
      if (top + th > window.innerHeight - 16) top = rect.top - th - 8;
      if (left < 16) left = 16;
      if (top < 16) top = 16;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }

    function hide() {
      tip.hidden = true;
    }

    $('tableBody').addEventListener('mouseover', function (e) {
      var cell = e.target.closest('[data-summary-id]');
      if (!cell) return;
      clearTimeout(hideTimer);
      show(cell);
    });
    $('tableBody').addEventListener('mouseout', function (e) {
      var cell = e.target.closest('[data-summary-id]');
      if (!cell) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, 60);
    });
  })();

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-act');
    var task = findTask(id);
    if (!task || task.isPending) return;
    if (act === 'detail') openDetail(task);
    else if (act === 'cancel') {
      state.confirmId = id;
      UI.openModal('cancelModal');
    } else if (act === 'retry') {
      state.confirmId = id;
      UI.openModal('retryModal');
    }
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal(btn.getAttribute('data-close'));
    });
  });

  function closeDetailDrawer() {
    UI.closeDrawer('detailDrawer');
    state.detailId = null;
    state.subSelected = {};
  }

  $('detailDrawerClose').addEventListener('click', closeDetailDrawer);
  $('detailDrawer').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeDetailDrawer();
  });

  $('configDrawerClose').addEventListener('click', closeConfigDrawer);
  $('configCancelBtn').addEventListener('click', closeConfigDrawer);
  $('configDrawer').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeConfigDrawer();
  });

  $('configSubmit').addEventListener('click', function () {
    if (!validateConfig()) return;
    var pending = findPending(state.activeId);
    var task = pending || findTask(state.activeId);
    if (!task) return;
    task.config = collectConfig();
    task.config.configured = true;
    if (pending) {
      var pIdx = PENDING_DRAFTS.findIndex(function (r) { return r.id === pending.id; });
      if (pIdx >= 0) PENDING_DRAFTS.splice(pIdx, 1);
      task.isPending = false;
      task.status = '待开始';
      task.success = 0;
      task.fail = 0;
      task.processing = task.total;
      task.updatedAt = task.createdAt;
      task.subs = buildSubs(task, Math.min(task.total, 20));
      ALL_ROWS.unshift(task);
    }
    UI.closeDrawer('configDrawer');
    UI.showToast('提交成功，任务已进入列表', 'success');
    syncPendingBadge();
    renderPendingList();
    applyFilters();
    renderTable();
  });

  $('cancelOk').addEventListener('click', function () {
    var task = findTask(state.confirmId);
    if (task && (task.status === '待开始' || task.status === '进行中')) {
      var done = (task.subs || []).filter(function (s) { return s.status === '已完成'; }).length;
      var rest = task.total - done;
      task.success = done;
      task.fail = rest;
      task.processing = 0;
      task.status = '已取消';
      task.updatedAt = formatDateTime(new Date());
      (task.subs || []).forEach(function (s) {
        if (s.status !== '已完成') s.status = '已取消';
      });
      UI.showToast('任务已取消', 'success');
      renderTable();
      if (state.detailId === task.id) openDetail(task);
    }
    UI.closeModal('cancelModal');
  });

  $('retryOk').addEventListener('click', function () {
    var task = findTask(state.confirmId);
    if (task && (task.status === '已取消' || task.status === '已失败')) {
      task.status = '进行中';
      task.processing = Math.max(0, task.total - task.success);
      task.fail = 0;
      task.updatedAt = formatDateTime(new Date());
      (task.subs || []).forEach(function (s) {
        if (s.status === '已失败' || s.status === '已取消') {
          s.status = '进行中';
          s.failReason = '';
        }
      });
      UI.showToast('已重新投入调度队列', 'success');
      renderTable();
      if (state.detailId === task.id) openDetail(task);
    }
    UI.closeModal('retryModal');
  });

  $('pendingDeleteOk').addEventListener('click', function () {
    var id = state.pendingDeleteId;
    var idx = PENDING_DRAFTS.findIndex(function (r) { return r.id === id; });
    if (idx >= 0) {
      PENDING_DRAFTS.splice(idx, 1);
      if (state.activeId === id) {
        UI.closeDrawer('configDrawer');
        state.activeId = null;
      }
      UI.showToast('已删除待提交任务', 'success');
      syncPendingBadge();
      renderPendingList();
    }
    state.pendingDeleteId = null;
    UI.closeModal('pendingDeleteModal');
  });

  $('subQueryBtn').addEventListener('click', function () {
    state.subApplied = { status: state.subDraft.status || '' };
    state.subPage = 1;
    state.subSelected = {};
    renderSubTable();
  });

  $('subCheckAll').addEventListener('change', function () {
    var task = findTask(state.detailId);
    if (!task) return;
    var rows = getFilteredSubs(task);
    var start = (state.subPage - 1) * state.subPageSize;
    var pageRows = rows.slice(start, start + state.subPageSize);
    var checked = this.checked;
    pageRows.forEach(function (r) {
      if (checked) state.subSelected[r.id] = true;
      else delete state.subSelected[r.id];
    });
    renderSubTable();
  });

  $('subTableBody').addEventListener('change', function (e) {
    var input = e.target.closest('[data-sub-check]');
    if (!input) return;
    var id = input.getAttribute('data-sub-check');
    if (input.checked) state.subSelected[id] = true;
    else delete state.subSelected[id];
    syncSubBatchBtns();
    renderSubTable();
  });

  function getSelectedSubs(task) {
    return (task.subs || []).filter(function (s) { return state.subSelected[s.id]; });
  }

  $('subBatchCancelBtn').addEventListener('click', function () {
    var task = findTask(state.detailId);
    if (!task) return;
    var selected = getSelectedSubs(task).filter(function (s) {
      return s.status === '待开始' || s.status === '进行中';
    });
    if (!selected.length) {
      UI.showToast('请选择待开始或进行中的素材', 'warning');
      return;
    }
    selected.forEach(function (s) {
      s.status = '已取消';
      s.failReason = '';
      s.updatedAt = formatDateTime(new Date());
    });
    state.subSelected = {};
    UI.showToast('已批量取消 ' + selected.length + ' 条', 'success');
    renderSubTable();
  });

  $('subBatchRetryBtn').addEventListener('click', function () {
    var task = findTask(state.detailId);
    if (!task) return;
    var selected = getSelectedSubs(task).filter(function (s) {
      return s.status === '已失败' || s.status === '已取消';
    });
    if (!selected.length) {
      UI.showToast('请选择已失败或已取消的素材', 'warning');
      return;
    }
    selected.forEach(function (s) {
      s.status = '进行中';
      s.failReason = '';
      s.updatedAt = formatDateTime(new Date());
    });
    if (task.status === '已失败' || task.status === '已取消') {
      task.status = '进行中';
      task.updatedAt = formatDateTime(new Date());
    }
    state.subSelected = {};
    UI.showToast('已批量重试 ' + selected.length + ' 条', 'success');
    renderSubTable();
    renderTable();
  });

  $('subTableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sub-retry]');
    if (!btn || btn.disabled) return;
    var task = findTask(state.detailId);
    if (!task) return;
    var sub = task.subs.find(function (s) { return s.id === btn.getAttribute('data-sub-retry'); });
    if (!sub) return;
    sub.status = '进行中';
    sub.failReason = '';
    sub.updatedAt = formatDateTime(new Date());
    if (task.status === '已失败' || task.status === '已取消') {
      task.status = '进行中';
      task.processing = calcProcessing(task);
      task.fail = (task.subs || []).filter(function (s) { return s.status === '已失败'; }).length;
      task.updatedAt = formatDateTime(new Date());
    }
    UI.showToast('子任务已重试', 'success');
    renderSubTable();
    renderTable();
  });

  /* deep link: ?config=xxxxxx → 待提交草稿并打开配置 */
  (function handleDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var configId = params.get('config');
    if (!configId) return;
    var id = /^\d+$/.test(configId) ? pad4(configId) : pad4(nextId++);
    var task = findPending(id);
    if (!task) {
      var created = new Date();
      task = {
        id: id,
        creator: USERS[0],
        total: 12,
        status: '待提交',
        success: 0,
        fail: 0,
        processing: 12,
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        updatedAt: formatDateTime(created),
        urls: buildUrls(99, 2),
        config: defaultConfig(),
        isPending: true,
        subs: []
      };
      PENDING_DRAFTS.unshift(task);
    }
    syncPendingBadge();
    applyFilters();
    renderTable();
    openConfig(task);
  })();

  applyFilters();
  syncPendingBadge();
  renderTable();
})();
