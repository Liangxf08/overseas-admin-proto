/* 模板库 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var USERS = Array.from({ length: 8 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var TYPE_META = {
    '钩子': {
      tip: '主要用于在原视频的片头或片尾拼接',
      accept: '.mp4,.mov,video/mp4,video/quicktime',
      desc: '支持 mp4 / mov',
      usageDefault: '片头拼接',
      media: 'video',
      tagClass: 'type-tag--hook'
    },
    '边框': {
      tip: '直接盖在原视频上（画面叠加）',
      accept: '.mp4,.mov,.png,.webp,video/mp4,video/quicktime,image/png,image/webp',
      desc: '支持 mp4 / mov / png / webp',
      usageDefault: '画面叠加',
      media: 'overlay',
      tagClass: 'type-tag--border'
    },
    '口播': {
      tip: '为原视频叠加音轨',
      accept: '.mp3,.wav,.aac,audio/mpeg,audio/wav,audio/aac',
      desc: '支持 mp3 / wav / aac',
      usageDefault: '音轨叠加',
      media: 'audio',
      tagClass: 'type-tag--voice'
    },
    '贴纸': {
      tip: '直接盖在原视频上（画面叠加）',
      accept: '.png,.webp,.gif,image/png,image/webp,image/gif',
      desc: '支持 png / webp / gif',
      usageDefault: '画面叠加',
      media: 'image',
      tagClass: 'type-tag--sticker'
    }
  };

  var HINT_ALL = '钩子用于片头/片尾拼接；边框、贴纸盖在原视频上；口播叠加音轨。';

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function pick(arr, i) { return arr[i % arr.length]; }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function buildMockRows() {
    var types = ['钩子', '边框', '口播', '贴纸'];
    var names = {
      '钩子': ['开场冲击', '品牌片头', '悬念钩子', '倒计时片尾'],
      '边框': ['霓虹竖框', '复古胶片', '节日边框', '圆角遮罩'],
      '口播': ['男声解说A', '女声种草', '英文旁白', '节奏口播'],
      '贴纸': ['点赞爆炸', '价格标签', '箭头指引', '表情包组']
    };
    var specs = {
      '钩子': ['1080x1920 · 3s', '1080x1920 · 2s', '720x1280 · 4s', '1920x1080 · 3s'],
      '边框': ['1080x1920', '1080x1920 · 透明', '720x1280', '1080x1080'],
      '口播': ['128kbps · 12s', '192kbps · 18s', '128kbps · 8s', '256kbps · 25s'],
      '贴纸': ['512x512 · png', '320x320 · webp', '640x360 · png', '256x256 · gif']
    };
    var list = [];
    var today = startOfDay(new Date());
    var i;
    for (i = 0; i < 28; i++) {
      var type = pick(types, i);
      var created = new Date(today);
      created.setDate(created.getDate() - (i % 10));
      created.setHours(9 + (i % 9), (i * 11) % 60, (i * 17) % 60, 0);
      var usage = type === '钩子'
        ? (i % 2 === 0 ? '片头拼接' : '片尾拼接')
        : TYPE_META[type].usageDefault;
      list.push({
        id: 'T' + String(86001 + i),
        name: pick(names[type], i) + '_' + (100 + i),
        type: type,
        usage: usage,
        spec: pick(specs[type], i),
        uploader: pick(USERS, i + 2),
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        remark: ''
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows();

  var state = {
    tabType: '',
    draft: { uploader: '', name: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    upload: {
      type: '钩子',
      hookPos: '片头',
      name: '',
      remark: '',
      fileName: ''
    },
    deleteId: null,
    previewId: null
  };

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
      if (cfg.onChange) cfg.onChange(opt.getAttribute('data-value') || '');
      syncLabel();
      panel.classList.remove('is-open', 'is-dropup');
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
          panel.classList.remove('is-open', 'is-dropup');
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel };
  }

  var dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    prefix: '上传时间：',
    defaultShortcut: 'last7',
    onChange: function () {}
  });

  var uploaderApi = bindSearchSelect({
    wrapId: 'uploaderWrap',
    triggerId: 'uploaderTrigger',
    panelId: 'uploaderPanel',
    labelId: 'uploaderLabel',
    listId: 'uploaderList',
    searchId: 'uploaderSearch',
    clearId: 'uploaderClear',
    prefix: '上传人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.draft.uploader; },
    onChange: function (v) { state.draft.uploader = v; }
  });

  function syncTypeHint() {
    var text = $('typeHintText');
    if (!text) return;
    if (!state.tabType) {
      text.textContent = HINT_ALL;
      return;
    }
    var meta = TYPE_META[state.tabType];
    text.textContent = meta ? meta.tip : HINT_ALL;
  }

  function applyFilters() {
    state.applied = {
      type: state.tabType,
      uploader: state.draft.uploader,
      name: ($('filterName').value || '').trim(),
      start: dateApi ? dateApi.getStart() : null,
      end: dateApi ? dateApi.getEnd() : null
    };
    state.page = 1;
  }

  function getFiltered() {
    var f = state.applied || {
      type: state.tabType,
      uploader: '',
      name: '',
      start: dateApi ? dateApi.getStart() : null,
      end: dateApi ? dateApi.getEnd() : null
    };
    var startStr = f.start ? formatDateYMD(f.start) : '';
    var endStr = f.end ? formatDateYMD(f.end) : '';
    return ALL_ROWS.filter(function (row) {
      if (f.type && row.type !== f.type) return false;
      if (f.uploader && row.uploader !== f.uploader) return false;
      if (f.name && row.name.indexOf(f.name) === -1) return false;
      if (startStr && row.createdDate < startStr) return false;
      if (endStr && row.createdDate > endStr) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function renderTable() {
    var rows = getFiltered();
    var total = rows.length;
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
        var meta = TYPE_META[row.type] || {};
        var thumbClass = 'thumb' + (meta.media === 'audio' ? ' thumb--audio' : '');
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td><span class="thumb-cell"><button class="' + thumbClass + '" type="button" data-preview="' + escapeHtml(row.id) + '" aria-label="预览"></button></span></td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td><span class="type-tag ' + (meta.tagClass || '') + '">' + escapeHtml(row.type) + '</span></td>' +
          '<td>' + escapeHtml(row.usage) + '</td>' +
          '<td>' + escapeHtml(row.spec) + '</td>' +
          '<td>' + escapeHtml(row.uploader) + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td><div class="action-links">' +
            '<button class="link" type="button" data-preview="' + escapeHtml(row.id) + '">预览</button>' +
            '<button class="link" type="button" data-download="' + escapeHtml(row.id) + '">下载</button>' +
            '<button class="link link--danger" type="button" data-delete="' + escapeHtml(row.id) + '">删除</button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
    }
    renderPagination(total);
    if (window.ColResize) window.ColResize.initAll(document);
  }

  function renderPagination(total) {
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
        getTotal: function () { return getFiltered().length; },
        onPageChange: function (p) { state.page = p; renderTable(); },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }
  }

  function setError(id, on) {
    var el = $(id);
    if (el) el.classList.toggle('is-error', !!on);
  }

  function clearUploadErrors() {
    ['upTypeItem', 'upHookPosItem', 'upNameItem', 'upFileItem'].forEach(function (id) {
      setError(id, false);
    });
  }

  function syncUploadTypeUI() {
    var type = state.upload.type;
    var meta = TYPE_META[type] || TYPE_META['钩子'];
    var tip = $('upTypeTip');
    var desc = $('upFileDesc');
    var input = $('upFileInput');
    var hookItem = $('upHookPosItem');
    if (tip) tip.textContent = meta.tip;
    if (desc) desc.textContent = meta.desc;
    if (input) input.setAttribute('accept', meta.accept);
    if (hookItem) hookItem.classList.toggle('is-hidden', type !== '钩子');
  }

  function resetUploadForm(preferType) {
    state.upload = {
      type: preferType && TYPE_META[preferType] ? preferType : (state.tabType && TYPE_META[state.tabType] ? state.tabType : '钩子'),
      hookPos: '片头',
      name: '',
      remark: '',
      fileName: ''
    };
    UI.setSegValue('upTypeSeg', state.upload.type);
    UI.setSegValue('upHookPosSeg', state.upload.hookPos);
    $('upNameInput').value = '';
    $('upRemarkInput').value = '';
    $('upFileInput').value = '';
    var fileName = $('upFileName');
    if (fileName) {
      fileName.textContent = '';
      fileName.hidden = true;
    }
    clearUploadErrors();
    syncUploadTypeUI();
  }

  function openUpload() {
    resetUploadForm(state.tabType);
    UI.openModal('uploadModal');
  }

  function validateUpload() {
    var ok = true;
    if (!state.upload.type) {
      setError('upTypeItem', true);
      ok = false;
    }
    if (state.upload.type === '钩子' && !state.upload.hookPos) {
      setError('upHookPosItem', true);
      ok = false;
    }
    var name = ($('upNameInput').value || '').trim();
    if (!name) {
      setError('upNameItem', true);
      ok = false;
    }
    if (!state.upload.fileName) {
      setError('upFileItem', true);
      ok = false;
    }
    return ok;
  }

  function guessSpec(type, fileName) {
    var ext = (fileName.split('.').pop() || '').toLowerCase();
    if (type === '钩子') return '1080x1920 · 3s';
    if (type === '边框') return ext === 'png' || ext === 'webp' ? '1080x1920 · 透明' : '1080x1920';
    if (type === '口播') return '128kbps · 15s';
    if (type === '贴纸') return '512x512 · ' + (ext || 'png');
    return '—';
  }

  function openPreview(row) {
    state.previewId = row.id;
    $('previewTitle').textContent = '预览 · ' + row.name;
    var stage = $('previewStage');
    var meta = TYPE_META[row.type] || {};
    var placeholder = '「' + row.type + '」原型预览占位';
    if (meta.media === 'audio') placeholder = '音频波形预览占位 · ' + row.spec;
    stage.innerHTML = '<div class="preview-stage__placeholder">' + escapeHtml(placeholder) + '</div>';
    $('previewMeta').innerHTML =
      '<div><strong>类型</strong>　' + escapeHtml(row.type) +
      '　·　<strong>用法</strong>　' + escapeHtml(row.usage) +
      '　·　<strong>规格</strong>　' + escapeHtml(row.spec) + '</div>';
    UI.openModal('previewModal');
  }

  /* events */
  UI.bindSidebar();

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal(btn.getAttribute('data-close'));
    });
  });

  $('typeTabs').addEventListener('click', function (e) {
    var tab = e.target.closest('[data-type]');
    if (!tab) return;
    state.tabType = tab.getAttribute('data-type') || '';
    document.querySelectorAll('#typeTabs .page-tabs__item').forEach(function (el) {
      var on = el === tab;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    syncTypeHint();
    applyFilters();
    renderTable();
  });

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('resetBtn').addEventListener('click', function () {
    state.draft.uploader = '';
    if (uploaderApi) uploaderApi.syncLabel();
    $('filterName').value = '';
    if (dateApi && dateApi.setRange) {
      var end = new Date();
      end.setHours(0, 0, 0, 0);
      var start = new Date(end);
      start.setDate(start.getDate() - 6);
      dateApi.setRange(start, end, 'last7');
    }
    applyFilters();
    renderTable();
  });

  $('uploadBtn').addEventListener('click', openUpload);

  UI.bindSeg('upTypeSeg', function (v) {
    state.upload.type = v;
    state.upload.fileName = '';
    $('upFileInput').value = '';
    var fileName = $('upFileName');
    if (fileName) {
      fileName.textContent = '';
      fileName.hidden = true;
    }
    clearUploadErrors();
    syncUploadTypeUI();
  });

  UI.bindSeg('upHookPosSeg', function (v) {
    state.upload.hookPos = v;
    setError('upHookPosItem', false);
  });

  $('upNameInput').addEventListener('input', function () {
    if (($('upNameInput').value || '').trim()) setError('upNameItem', false);
  });

  (function bindUploadZone() {
    var zone = $('upFileZone');
    var input = $('upFileInput');
    var nameEl = $('upFileName');
    if (!zone || !input) return;

    function takeFile(file) {
      if (!file) return;
      state.upload.fileName = file.name;
      if (nameEl) {
        nameEl.textContent = file.name;
        nameEl.hidden = false;
      }
      if (!$('upNameInput').value.trim()) {
        $('upNameInput').value = file.name.replace(/\.[^.]+$/, '');
        setError('upNameItem', false);
      }
      setError('upFileItem', false);
    }

    input.addEventListener('change', function () {
      takeFile(input.files && input.files[0]);
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('is-dragover');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      takeFile(file);
    });
  })();

  $('upSubmit').addEventListener('click', function () {
    if (!validateUpload()) return;
    var type = state.upload.type;
    var name = ($('upNameInput').value || '').trim();
    var now = new Date();
    var row = {
      id: 'T' + String(90000 + ALL_ROWS.length),
      name: name,
      type: type,
      usage: type === '钩子' ? (state.upload.hookPos + '拼接') : TYPE_META[type].usageDefault,
      spec: guessSpec(type, state.upload.fileName),
      uploader: '用户A',
      createdAt: formatDateTime(now),
      createdDate: formatDateYMD(now),
      remark: ($('upRemarkInput').value || '').trim()
    };
    ALL_ROWS.unshift(row);
    UI.closeModal('uploadModal');
    UI.showToast('上传成功', 'success');
    applyFilters();
    renderTable();
  });

  $('tableBody').addEventListener('click', function (e) {
    var previewBtn = e.target.closest('[data-preview]');
    if (previewBtn) {
      var prow = findRow(previewBtn.getAttribute('data-preview'));
      if (prow) openPreview(prow);
      return;
    }
    var dlBtn = e.target.closest('[data-download]');
    if (dlBtn) {
      var drow = findRow(dlBtn.getAttribute('data-download'));
      if (drow) UI.showToast('已开始下载「' + drow.name + '」（原型）', 'success');
      return;
    }
    var delBtn = e.target.closest('[data-delete]');
    if (delBtn) {
      state.deleteId = delBtn.getAttribute('data-delete');
      UI.openModal('deleteModal');
    }
  });

  $('deleteOk').addEventListener('click', function () {
    var id = state.deleteId;
    var idx = ALL_ROWS.findIndex(function (r) { return r.id === id; });
    if (idx >= 0) {
      ALL_ROWS.splice(idx, 1);
      UI.showToast('已删除', 'success');
      renderTable();
    }
    state.deleteId = null;
    UI.closeModal('deleteModal');
  });

  syncTypeHint();
  applyFilters();
  renderTable();
})();
