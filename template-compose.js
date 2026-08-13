/* 模板合成画布 · 一期最小闭环 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var FOLDERS = [
    '投放/短剧/竖版',
    '投放/短剧/横版',
    '投放/海外/TT',
    '品牌素材',
    '测试'
  ];

  var MAIN_ASSETS = [
    { id: 'M1', name: '投放竖版_2001.mp4', duration: 15, folder: '投放/短剧/竖版' },
    { id: 'M2', name: '口播成片_2008.mp4', duration: 22, folder: '投放/短剧/竖版' },
    { id: 'M3', name: '剧情混剪_2012.mp4', duration: 18, folder: '投放/海外/TT' },
    { id: 'M4', name: '品牌片头_2003.mp4', duration: 12, folder: '品牌素材' },
    { id: 'M5', name: '合成底片_2019.mp4', duration: 20, folder: '测试' }
  ];

  var PARTS = {
    hook: [
      { id: 'H1', name: '开场冲击_100', usage: '片头拼接', duration: 3 },
      { id: 'H2', name: '悬念钩子_102', usage: '片头拼接', duration: 2 },
      { id: 'H3', name: '倒计时片尾_103', usage: '片尾拼接', duration: 3 },
      { id: 'H4', name: '品牌片头_101', usage: '片头拼接', duration: 4 }
    ],
    border: [
      { id: 'B1', name: '霓虹竖框_110', usage: '画面叠加', duration: 0 },
      { id: 'B2', name: '复古胶片_111', usage: '画面叠加', duration: 0 },
      { id: 'B3', name: '节日边框_112', usage: '画面叠加', duration: 0 }
    ],
    voice: [
      { id: 'V1', name: '男声解说A_120', usage: '音轨叠加', duration: 12 },
      { id: 'V2', name: '女声种草_121', usage: '音轨叠加', duration: 18 },
      { id: 'V3', name: '英文旁白_122', usage: '音轨叠加', duration: 10 }
    ],
    sticker: [
      { id: 'S1', name: '点赞爆炸_130', usage: '画面叠加', duration: 4 },
      { id: 'S2', name: '价格标签_131', usage: '画面叠加', duration: 5 },
      { id: 'S3', name: '箭头指引_132', usage: '画面叠加', duration: 3 }
    ]
  };

  var PANEL_TIP = {
    main: '主片仅可选素材库成片',
    hook: '钩子按用法自动接到片头或片尾',
    border: '边框默认覆盖主片区间，可在属性中调整',
    voice: '口播叠加音轨，可开启覆盖原声',
    sticker: '贴纸默认出现在主片 5–9 秒，可调整'
  };

  var state = {
    panel: 'main',
    search: '',
    dirty: false,
    exportFolder: FOLDERS[0],
    selectedClipId: null,
    project: {
      main: null,
      hookHead: null,
      hookTail: null,
      border: null,
      voice: null,
      sticker: null
    }
  };

  var clipSeq = 1;

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function defaultExportName() {
    var d = new Date();
    return '合成_' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
      '_' + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds()) + '.mp4';
  }

  function mainDuration() {
    return state.project.main ? state.project.main.duration : 0;
  }

  function headDuration() {
    return state.project.hookHead ? state.project.hookHead.duration : 0;
  }

  function tailDuration() {
    return state.project.hookTail ? state.project.hookTail.duration : 0;
  }

  function totalDuration() {
    return headDuration() + mainDuration() + tailDuration();
  }

  function mainStartOnTimeline() {
    return headDuration();
  }

  function markDirty() {
    state.dirty = true;
  }

  function setError(id, on) {
    var el = $(id);
    if (el) el.classList.toggle('is-error', !!on);
  }

  function currentList() {
    var kw = (state.search || '').toLowerCase();
    var list;
    if (state.panel === 'main') list = MAIN_ASSETS;
    else list = PARTS[state.panel] || [];
    return list.filter(function (item) {
      return !kw || item.name.toLowerCase().indexOf(kw) !== -1;
    });
  }

  function isAssetUsed(id) {
    var p = state.project;
    return [p.main, p.hookHead, p.hookTail, p.border, p.voice, p.sticker].some(function (c) {
      return c && c.assetId === id;
    });
  }

  function renderAssetList() {
    var box = $('assetList');
    var tip = $('assetTip');
    if (tip) tip.textContent = PANEL_TIP[state.panel] || '';
    if (!box) return;
    var list = currentList();
    if (!list.length) {
      box.innerHTML = '<div class="empty-tip" style="display:block;padding:12px">无匹配项</div>';
      return;
    }
    box.innerHTML = list.map(function (item) {
      var used = isAssetUsed(item.id) ? ' is-used' : '';
      var sub = state.panel === 'main'
        ? (item.folder + ' · ' + item.duration + 's')
        : ((item.usage || '') + (item.duration ? ' · ' + item.duration + 's' : ''));
      return (
        '<button class="asset-card' + used + '" type="button" data-add="' + escapeHtml(item.id) + '">' +
          '<span class="asset-card__thumb"></span>' +
          '<span class="asset-card__meta">' +
            '<div class="asset-card__name">' + escapeHtml(item.name) + '</div>' +
            '<div class="asset-card__sub">' + escapeHtml(sub) + '</div>' +
          '</span>' +
        '</button>'
      );
    }).join('');
  }

  function addAsset(id) {
    var item;
    if (state.panel === 'main') {
      item = MAIN_ASSETS.find(function (x) { return x.id === id; });
      if (!item) return;
      state.project.main = {
        clipId: 'c' + (clipSeq++),
        assetId: item.id,
        name: item.name,
        type: 'main',
        duration: item.duration,
        start: 0,
        end: item.duration
      };
      /* 边框默认跟随主片 */
      if (state.project.border) {
        state.project.border.start = 0;
        state.project.border.end = item.duration;
      }
      markDirty();
      renderAll();
      return;
    }

    if (!state.project.main) {
      UI.showToast('请先选择主片');
      return;
    }

    item = (PARTS[state.panel] || []).find(function (x) { return x.id === id; });
    if (!item) return;

    if (state.panel === 'hook') {
      var isHead = item.usage.indexOf('片头') !== -1;
      var clip = {
        clipId: 'c' + (clipSeq++),
        assetId: item.id,
        name: item.name,
        type: 'hook',
        duration: item.duration,
        start: 0,
        end: item.duration,
        hookPos: isHead ? 'head' : 'tail'
      };
      if (isHead) state.project.hookHead = clip;
      else state.project.hookTail = clip;
    } else if (state.panel === 'border') {
      state.project.border = {
        clipId: 'c' + (clipSeq++),
        assetId: item.id,
        name: item.name,
        type: 'border',
        duration: mainDuration(),
        start: 0,
        end: mainDuration()
      };
    } else if (state.panel === 'voice') {
      var vd = Math.min(item.duration || mainDuration(), mainDuration());
      state.project.voice = {
        clipId: 'c' + (clipSeq++),
        assetId: item.id,
        name: item.name,
        type: 'voice',
        duration: vd,
        start: 0,
        end: vd,
        coverAudio: false
      };
    } else if (state.panel === 'sticker') {
      var sStart = Math.min(5, Math.max(0, mainDuration() - 1));
      var sEnd = Math.min(sStart + (item.duration || 4), mainDuration());
      state.project.sticker = {
        clipId: 'c' + (clipSeq++),
        assetId: item.id,
        name: item.name,
        type: 'sticker',
        duration: sEnd - sStart,
        start: sStart,
        end: sEnd
      };
    }

    markDirty();
    renderAll();
  }

  function findClip(clipId) {
    var p = state.project;
    var all = [p.main, p.hookHead, p.hookTail, p.border, p.voice, p.sticker];
    return all.find(function (c) { return c && c.clipId === clipId; }) || null;
  }

  function removeClip(clipId) {
    var p = state.project;
    ['main', 'hookHead', 'hookTail', 'border', 'voice', 'sticker'].forEach(function (key) {
      if (p[key] && p[key].clipId === clipId) p[key] = null;
    });
    if (state.selectedClipId === clipId) state.selectedClipId = null;
    markDirty();
    renderAll();
  }

  function renderCanvas() {
    var ph = $('canvasPlaceholder');
    var layers = $('canvasLayers');
    if (!state.project.main) {
      if (ph) ph.hidden = false;
      if (layers) {
        layers.hidden = true;
        layers.innerHTML = '';
      }
      return;
    }
    if (ph) ph.hidden = true;
    if (!layers) return;
    layers.hidden = false;
    var html = '<div class="canvas-layer canvas-layer--main">' + escapeHtml(state.project.main.name) + '</div>';
    if (state.project.border) {
      html += '<div class="canvas-layer canvas-layer--border">边框</div>';
    }
    if (state.project.sticker) {
      html += '<div class="canvas-layer canvas-layer--sticker">贴纸</div>';
    }
    if (state.project.hookHead) {
      html += '<div class="canvas-layer canvas-layer--hook" style="inset:auto;left:8px;top:8px;right:8px;height:28px;border-radius:2px">片头钩子</div>';
    }
    layers.innerHTML = html;
  }

  function clipStyle(start, end, baseStart, total) {
    if (!total) return 'display:none';
    var left = ((baseStart + start) / total) * 100;
    var width = ((end - start) / total) * 100;
    return 'left:' + left + '%;width:' + Math.max(width, 1.5) + '%';
  }

  function renderTimeline() {
    var meta = $('timelineMeta');
    var total = totalDuration();
    if (meta) meta.textContent = total ? ('总时长 ' + total.toFixed(1) + 's') : '总时长 —';

    var tracks = $('timelineTracks');
    if (!tracks) return;

    function clipBtn(clip, cls, baseStart) {
      if (!clip) {
        return '<div class="tl-track__lane"></div>';
      }
      var active = state.selectedClipId === clip.clipId ? ' is-active' : '';
      return (
        '<div class="tl-track__lane">' +
          '<button class="tl-clip tl-clip--' + cls + active + '" type="button" data-clip="' + escapeHtml(clip.clipId) + '" style="' +
            clipStyle(clip.start, clip.end, baseStart, total) + '">' +
            escapeHtml(clip.name) +
          '</button>' +
        '</div>'
      );
    }

    var mStart = mainStartOnTimeline();
    var html = '';
    html += '<div class="tl-track"><div class="tl-track__label">钩子·头</div>' + clipBtn(state.project.hookHead, 'hook', 0) + '</div>';
    html += '<div class="tl-track"><div class="tl-track__label">主片</div>' +
      (state.project.main
        ? '<div class="tl-track__lane"><button class="tl-clip tl-clip--main' +
          (state.selectedClipId === state.project.main.clipId ? ' is-active' : '') +
          '" type="button" data-clip="' + escapeHtml(state.project.main.clipId) + '" style="' +
          clipStyle(0, state.project.main.duration, mStart, total) + '">' +
          escapeHtml(state.project.main.name) + '</button></div>'
        : '<div class="tl-track__lane"></div>') +
      '</div>';
    html += '<div class="tl-track"><div class="tl-track__label">钩子·尾</div>' +
      clipBtn(state.project.hookTail, 'hook', mStart + mainDuration()) + '</div>';
    html += '<div class="tl-track"><div class="tl-track__label">边框</div>' +
      clipBtn(state.project.border, 'border', mStart) + '</div>';
    html += '<div class="tl-track"><div class="tl-track__label">贴纸</div>' +
      clipBtn(state.project.sticker, 'sticker', mStart) + '</div>';
    html += '<div class="tl-track"><div class="tl-track__label">口播</div>' +
      clipBtn(state.project.voice, 'voice', mStart) + '</div>';

    tracks.innerHTML = html;
  }

  function renderProps() {
    var empty = $('propsEmpty');
    var form = $('propsForm');
    var clip = state.selectedClipId ? findClip(state.selectedClipId) : null;
    if (!clip) {
      if (empty) empty.hidden = false;
      if (form) form.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (form) form.hidden = false;
    $('propName').textContent = clip.name;
    var typeLabel = {
      main: '主片',
      hook: '钩子',
      border: '边框',
      voice: '口播',
      sticker: '贴纸'
    };
    $('propType').textContent = typeLabel[clip.type] || clip.type;

    var rangeRow = $('propRangeRow');
    var coverRow = $('propCoverRow');
    var canEditRange = clip.type === 'border' || clip.type === 'sticker' || clip.type === 'voice';
    if (rangeRow) rangeRow.hidden = !canEditRange;
    if (coverRow) coverRow.hidden = clip.type !== 'voice';

    if (canEditRange) {
      $('propStart').value = clip.start;
      $('propEnd').value = clip.end;
      $('propStart').disabled = false;
      $('propEnd').disabled = false;
    }
    if (clip.type === 'voice') {
      $('propCoverAudio').checked = !!clip.coverAudio;
    }
  }

  function renderAll() {
    renderAssetList();
    renderCanvas();
    renderTimeline();
    renderProps();
  }

  /* folder select for export */
  function bindFolderSelect() {
    var wrap = $('exFolderControl');
    var trigger = $('exFolderTrigger');
    var panel = $('exFolderPanel');
    var label = $('exFolderLabel');
    var list = $('exFolderList');
    if (!wrap || !trigger || !panel || !label || !list) return;

    function syncLabel() {
      if (!state.exportFolder) {
        label.innerHTML = '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.textContent = state.exportFolder;
        wrap.classList.add('has-value');
      }
    }

    function render() {
      list.innerHTML = FOLDERS.map(function (opt) {
        var active = opt === state.exportFolder ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' +
          escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      }).join('');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      UI.closePanels();
      document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
        p.classList.remove('is-open');
      });
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      state.exportFolder = opt.getAttribute('data-value') || '';
      setError('exFolderItem', false);
      syncLabel();
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
    });

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () {
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
    });
    syncLabel();
  }

  /* events */
  if (UI.bindSidebar) UI.bindSidebar();

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal(btn.getAttribute('data-close'));
    });
  });

  document.querySelector('.compose-assets__tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('[data-panel]');
    if (!tab) return;
    state.panel = tab.getAttribute('data-panel');
    document.querySelectorAll('.compose-assets__tab').forEach(function (el) {
      el.classList.toggle('is-active', el === tab);
    });
    renderAssetList();
  });

  $('assetSearch').addEventListener('input', function () {
    state.search = ($('assetSearch').value || '').trim();
    renderAssetList();
  });

  $('assetList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    addAsset(btn.getAttribute('data-add'));
  });

  $('timelineTracks').addEventListener('click', function (e) {
    var clip = e.target.closest('[data-clip]');
    if (!clip) return;
    state.selectedClipId = clip.getAttribute('data-clip');
    renderTimeline();
    renderProps();
  });

  $('propStart').addEventListener('change', function () {
    var clip = findClip(state.selectedClipId);
    if (!clip || clip.type === 'main' || clip.type === 'hook') return;
    var v = parseFloat($('propStart').value);
    if (isNaN(v) || v < 0) v = 0;
    if (v >= clip.end) v = Math.max(0, clip.end - 0.1);
    clip.start = Math.round(v * 10) / 10;
    clip.duration = clip.end - clip.start;
    markDirty();
    renderAll();
  });

  $('propEnd').addEventListener('change', function () {
    var clip = findClip(state.selectedClipId);
    if (!clip || clip.type === 'main' || clip.type === 'hook') return;
    var v = parseFloat($('propEnd').value);
    var max = mainDuration();
    if (isNaN(v)) v = clip.end;
    if (v > max) v = max;
    if (v <= clip.start) v = clip.start + 0.1;
    clip.end = Math.round(v * 10) / 10;
    clip.duration = clip.end - clip.start;
    markDirty();
    renderAll();
  });

  $('propCoverAudio').addEventListener('change', function () {
    var clip = findClip(state.selectedClipId);
    if (!clip || clip.type !== 'voice') return;
    clip.coverAudio = $('propCoverAudio').checked;
    markDirty();
  });

  $('propRemove').addEventListener('click', function () {
    if (!state.selectedClipId) return;
    removeClip(state.selectedClipId);
  });

  $('previewPlayBtn').addEventListener('click', function () {
    if (!state.project.main) {
      UI.showToast('请先选择主片');
      return;
    }
    UI.showToast('播放合成预览（原型占位）· 总时长 ' + totalDuration().toFixed(1) + 's', 'success');
  });

  $('exportBtn').addEventListener('click', function () {
    if (!state.project.main) {
      UI.showToast('请先选择主片');
      return;
    }
    $('exNameInput').value = defaultExportName();
    state.exportFolder = FOLDERS[0];
    setError('exNameItem', false);
    setError('exFolderItem', false);
    var label = $('exFolderLabel');
    if (label) label.textContent = state.exportFolder;
    UI.openModal('exportModal');
  });

  $('exNameInput').addEventListener('input', function () {
    if (($('exNameInput').value || '').trim()) setError('exNameItem', false);
  });

  $('exSubmit').addEventListener('click', function () {
    var name = ($('exNameInput').value || '').trim();
    var ok = true;
    if (!name) {
      setError('exNameItem', true);
      ok = false;
    }
    if (!state.exportFolder) {
      setError('exFolderItem', true);
      ok = false;
    }
    if (!ok) return;
    UI.closeModal('exportModal');
    state.dirty = false;
    UI.showToast('已导出到素材库「' + state.exportFolder + '」，正在同步 XMP…', 'success');
    setTimeout(function () {
      if (window.confirm('导出成功。是否前往素材库查看？')) {
        window.location.href = 'material-library.html';
      }
    }, 400);
  });

  document.querySelector('.compose-back').addEventListener('click', function (e) {
    if (!state.dirty) return;
    e.preventDefault();
    UI.openModal('leaveModal');
  });

  $('leaveOk').addEventListener('click', function () {
    state.dirty = false;
    window.location.href = 'template-library.html';
  });

  window.addEventListener('beforeunload', function (e) {
    if (!state.dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  bindFolderSelect();
  renderAll();
})();
