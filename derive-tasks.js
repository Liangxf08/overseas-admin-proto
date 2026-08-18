/* 衍生任务 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var DROPDOWN_PANEL_SEL = '.single-panel, .multi-panel, .date-panel, .search-select-panel, .folder-tree-panel, .size-cascade-panel';

  function unportalDropdown(panel) {
    if (!panel || !panel.classList.contains('dropdown-portal')) return;
    panel.classList.remove('dropdown-portal');
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.style.bottom = '';
    panel.style.margin = '';
    panel.style.zIndex = '';
    panel.style.width = '';
    panel.style.minWidth = '';
    panel.style.maxHeight = '';
    panel.style.overflow = '';
    panel.style.height = '';
    panel.style.removeProperty('--size-cascade-col-width');
    var host = panel.__dropdownHost;
    if (host && panel.parentElement !== host) host.appendChild(panel);
  }

  function unportalAllDropdowns() {
    document.querySelectorAll('.dropdown-portal').forEach(unportalDropdown);
  }

  function portalDropdown(panel, trigger) {
    if (!panel || !trigger) return;
    if (!trigger.closest('.cfg-page, .pick-drawer')) return;
    if (trigger.closest('.pagination, .page-size-wrap')) return;
    if (!panel.__dropdownHost) panel.__dropdownHost = panel.parentElement;

    var rect = trigger.getBoundingClientRect();
    var pad = 8;
    var gap = 4;
    var triggerW = rect.width;
    var isOverlay = panel.classList.contains('date-panel') || panel.classList.contains('cascade-panel');
    var isFolderTree = panel.classList.contains('folder-tree-panel');
    var isSizeCascade = panel.classList.contains('size-cascade-panel');
    var pw = triggerW;
    if (isSizeCascade) {
      pw = triggerW * 2;
      panel.style.setProperty('--size-cascade-col-width', triggerW + 'px');
    } else if (!isOverlay && !isFolderTree && panel.parentElement !== document.body) {
      pw = Math.max(panel.offsetWidth || 0, triggerW);
    }

    if (panel.parentElement !== document.body) document.body.appendChild(panel);
    panel.classList.add('dropdown-portal');
    panel.classList.remove('is-dropup', 'is-align-right');
    if (!isOverlay) {
      panel.style.minWidth = pw + 'px';
      panel.style.width = pw + 'px';
    }

    var spaceBelow = window.innerHeight - rect.bottom - pad;
    var spaceAbove = rect.top - pad;
    var cap = 0;
    if (isFolderTree) {
      cap = parseInt((getComputedStyle(document.documentElement).getPropertyValue('--select-panel-height') || '').trim(), 10) || 296;
    } else if (isSizeCascade) {
      cap = 240;
    }
    var ph = isSizeCascade ? 240 : (panel.scrollHeight || panel.offsetHeight || 280);
    if (cap) ph = Math.min(ph, cap);
    var openDown = spaceBelow >= Math.min(ph, 200) || spaceBelow >= spaceAbove;
    var avail = (openDown ? spaceBelow : spaceAbove) - gap;
    if (avail < 120) avail = Math.max(spaceBelow, spaceAbove, 120) - gap;
    if (cap) avail = Math.min(avail, cap);
    var usedH = Math.min(ph, avail);
    var left = rect.left;
    if (left + pw > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - pw - pad);
    var top = openDown ? rect.bottom + gap : Math.max(pad, rect.top - usedH - gap);

    panel.style.position = 'fixed';
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.margin = '0';
    panel.style.zIndex = '1200';
    if (isFolderTree) panel.style.maxHeight = avail + 'px';
    if (isSizeCascade) {
      panel.style.height = '240px';
      panel.style.maxHeight = '240px';
    }
  }

  var _closePanels = UI.closePanels;
  UI.closePanels = function () {
    document.querySelectorAll('.size-cascade-panel.is-open, .folder-tree-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open', 'is-dropup', 'is-align-right');
      unportalDropdown(p);
    });
    unportalAllDropdowns();
    if (_closePanels) _closePanels();
  };

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.select-trigger, .date-range-trigger');
    if (!trigger || !trigger.closest('.cfg-page, .pick-drawer')) return;
    if (trigger.closest('.pagination, .page-size-wrap')) return;
    setTimeout(function () {
      var wrap = trigger.closest('.filter-item, .inherit-extra, .form-item__control, .size-select-wrap, .date-range-wrap');
      var panel = wrap ? wrap.querySelector(DROPDOWN_PANEL_SEL + '.is-open') : null;
      if (!panel && trigger.parentElement) {
        panel = trigger.parentElement.querySelector(DROPDOWN_PANEL_SEL + '.is-open');
      }
      if (panel) portalDropdown(panel, trigger);
    }, 0);
  }, true);

  document.addEventListener('scroll', function (e) {
    var el = e.target;
    if (el && el.closest && el.closest(DROPDOWN_PANEL_SEL)) return;
    if (!document.querySelector('.dropdown-portal, ' + DROPDOWN_PANEL_SEL + '.is-open')) return;
    UI.closePanels();
  }, true);

  var CURRENT_USER = '用户A';
  var USERS = Array.from({ length: 16 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var SELECT_LIMIT = 100;
  var LAYER_TAB_MAX = 5;
  var layerGroupSeq = 0;
  var DERIVE_LIMIT = 1000;
  var SYSTEM_TAG = '衍生';
  var DEFAULT_NAME = '{原素材名}_衍生';
  var DEFAULT_FOLDER_NAME = '{创意人}_{YYYYMMDD}';
  var XMP_FOLDERS = [
    '短剧/竖版',
    '短剧/横版',
    '投放素材',
    '测试文件夹',
    '品牌素材',
    '竞品参考',
    '海外投放/TT',
    '海外投放/FB'
  ];
  function pathsToFolderTree(paths) {
    var roots = [];
    function ensure(nodes, name, id) {
      var i;
      for (i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) return nodes[i];
      }
      var node = { id: id, name: name, children: [] };
      nodes.push(node);
      return node;
    }
    (paths || []).forEach(function (p) {
      var parts = String(p).split('/');
      var acc = '';
      var cur = roots;
      parts.forEach(function (part) {
        acc = acc ? acc + '/' + part : part;
        var node = ensure(cur, part, acc);
        cur = node.children;
      });
    });
    return roots;
  }
  var XMP_FOLDER_TREE = pathsToFolderTree(XMP_FOLDERS);
  var FOLDER_ICON = '<img class="tree-node__icon" src="assets/文件夹.png" width="16" height="16" alt="" />';
  var TOGGLE_SVG = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  var PLAY_ICON = '<span class="thumb__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z"/></svg></span>';
  var SIZE_FILTER_TREE = [
    { id: 'portrait', label: '竖版 (9:16)', children: ['1080x1920', '720x1280'] },
    { id: 'landscape', label: '横版 (16:9)', children: ['1920x1080', '1280x720'] },
    { id: 'square', label: '方形 (1:1)', children: ['1080x1080', '800x800', '512x512'] }
  ];
  var FORMAT_FILTER_TREE = [
    { id: 'image', label: '图片', children: ['jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif'] },
    { id: 'video', label: '视频', children: ['mp4', 'mov', 'avi', 'mpeg'] },
    { id: 'audio', label: '音频', children: ['mp3', 'wav', 'aac', 'm4a'] }
  ];
  var TASK_STATUSES = ['待开始', '进行中', '已完成', '已取消', '已失败'];
  var FAIL_REASON = '合成失败：模板与主片尺寸不匹配';

  var TAG_TREE = [
    { id: 'sys', label: '系统标签', children: ['衍生'] },
    { id: 'lang', label: '语言', children: ['英语', '日语', '繁中'] },
    { id: 'mix', label: '混合玩法', children: ['消消乐', '清理', '保护系列'] },
    { id: 'feat', label: '素材特点', children: ['CTR', '副玩法', 'DOGE'] },
    { id: 'fest', label: '节日限定', children: ['圣诞节', '夏日'] }
  ];
  var FORM_TAG_TREE = TAG_TREE.filter(function (g) { return g.id !== 'sys'; });
  var DURATION_OPTIONS = ['0-6s', '7-15s', '16-30s', '31-60s', '>60s'];
  var CASCADE_ARROW = '<svg class="cascade-option__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 3L7.5 6L4.5 9"/></svg>';
  var CLEAR_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg>';
  var AUDIO_ICON = '<span class="thumb__audio-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>';

  var SIZE_TREE = [
    { group: '竖版(9:16)', values: ['1080x1920', '720x1280'] },
    { group: '横版(16:9)', values: ['1920x1080', '1280x720'] },
    { group: '方形(1:1)', values: ['1080x1080', '800x800', '512x512', '300x300', '180x180'] }
  ];

  var FolderData = window.MaterialFolderData || {};
  var SYSTEM_FOLDER = FolderData.SYSTEM_FOLDER || { id: 'system_all', name: '全部素材', system: true, children: [] };
  var CUSTOM_FOLDERS = FolderData.CUSTOM_FOLDERS || [];
  var STORAGE_FOLDERS = CUSTOM_FOLDERS.slice();
  var PICK_MATERIAL_FOLDERS = [SYSTEM_FOLDER].concat(CUSTOM_FOLDERS);
  var getLocalFolderPath = FolderData.getFolderPath || function (id) {
    if (id === SYSTEM_FOLDER.id) return SYSTEM_FOLDER.name;
    return '';
  };
  var findFolderNode = FolderData.findFolderNode || function () { return null; };
  var walkFolders = FolderData.walkFolders || function (nodes, prefix, fn) {
    (nodes || []).forEach(function (node) {
      var path = prefix ? (prefix + ' / ' + node.name) : node.name;
      fn(node, path);
      if (node.children && node.children.length) walkFolders(node.children, path, fn);
    });
  };

  function flattenTreeLeaves(tree) {
    var out = [];
    (tree || []).forEach(function (g) {
      (g.children || []).forEach(function (c) {
        if (out.indexOf(c) === -1) out.push(c);
      });
    });
    return out;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = '0' + s;
    return s.slice(-4);
  }
  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }
  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function formatDuration(sec) {
    var s = Math.max(0, Math.floor(sec));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(r);
  }
  function pick(arr, i) { return arr[i % arr.length]; }
  function stripExt(name) {
    return String(name || '').replace(/\.[^.]+$/, '');
  }
  function cloneList(arr) {
    return (arr || []).map(function (x) { return Object.assign({}, x); });
  }

  function listFolderIds(nodes, out) {
    out = out || [];
    (nodes || []).forEach(function (n) {
      out.push(n.id);
      if (n.children && n.children.length) listFolderIds(n.children, out);
    });
    return out;
  }

  function collectDescendantIds(node) {
    var ids = [node.id];
    (node.children || []).forEach(function (c) {
      ids = ids.concat(collectDescendantIds(c));
    });
    return ids;
  }

  function findInTree(id, nodes) {
    if (!id) return null;
    var i;
    for (i = 0; i < (nodes || []).length; i++) {
      if (nodes[i].id === id) return nodes[i];
      if (nodes[i].children && nodes[i].children.length) {
        var found = findInTree(id, nodes[i].children);
        if (found) return found;
      }
    }
    return null;
  }

  function getTreePath(id, nodes, systemNode) {
    if (!id) return '';
    if (systemNode && id === systemNode.id) return systemNode.name;
    var found = '';
    walkFolders(nodes, '', function (node, path) {
      if (node.id === id) found = path;
    });
    return found;
  }

  /* ---------- 模板库文件夹（与模板中心对齐） ---------- */
  var TPL_SYSTEM = { id: 'tpl_all', name: '全部模板', system: true, children: [] };
  function buildPlatformTemplateChildren(prefix) {
    return [
      {
        id: prefix + '_bgm',
        name: 'BGM',
        children: [
          { id: prefix + '_bgm_puzzle', name: '益智', children: [] },
          { id: prefix + '_bgm_casual', name: '休闲', children: [] },
          { id: prefix + '_bgm_suspense', name: '悬疑', children: [] }
        ]
      },
      {
        id: prefix + '_voice',
        name: '口播',
        children: [
          { id: prefix + '_voice_en', name: '英语', children: [] },
          { id: prefix + '_voice_ja', name: '日语', children: [] }
        ]
      },
      {
        id: prefix + '_sticker',
        name: '贴纸',
        children: [
          { id: prefix + '_sticker_meme', name: 'MEME', children: [] },
          { id: prefix + '_sticker_gui', name: 'GUI', children: [] },
          { id: prefix + '_sticker_comment', name: '评论', children: [] },
          { id: prefix + '_sticker_cta', name: '引导点击', children: [] }
        ]
      },
      {
        id: prefix + '_border',
        name: '边框',
        children: [
          { id: prefix + '_border_ud', name: '上下边框', children: [] },
          { id: prefix + '_border_full', name: '全包边', children: [] }
        ]
      },
      {
        id: prefix + '_intro',
        name: '片头',
        children: [
          { id: prefix + '_intro_hook', name: 'Hook 爆点', children: [] },
          { id: prefix + '_intro_ai', name: 'AI真人', children: [] },
          { id: prefix + '_intro_story', name: '剧情', children: [] }
        ]
      }
    ];
  }
  var TPL_CUSTOM = [
    { id: 'ttminigame', name: 'TTminigame', children: buildPlatformTemplateChildren('tt') },
    { id: 'app', name: 'APP', children: buildPlatformTemplateChildren('app') },
    { id: 'common_bgm', name: '通用BGM', children: [] },
    { id: 'common_sticker', name: '通用贴纸', children: [] },
    { id: 'common_intro', name: '通用片头', children: [] },
    { id: 'scale_tpl', name: '跑量模板', children: [] }
  ];
  var TPL_FOLDERS = [TPL_SYSTEM].concat(TPL_CUSTOM);

  function tplCategoryForFolder(folderId) {
    var path = getTreePath(folderId, TPL_CUSTOM, TPL_SYSTEM) || '';
    var node = findInTree(folderId, TPL_CUSTOM);
    var name = (node && node.name) || '';
    if (folderId === 'common_bgm' || name === '通用BGM' ||
        /(^| \/ )BGM( \/ |$)/.test(path) || /(^| \/ )口播( \/ |$)/.test(path)) {
      return '音频替换';
    }
    if (folderId === 'common_sticker' || name === '通用贴纸' ||
        /(^| \/ )贴纸( \/ |$)/.test(path) || /(^| \/ )边框( \/ |$)/.test(path)) {
      return '图层叠加';
    }
    if (folderId === 'common_intro' || name === '通用片头' || name === '跑量模板' ||
        folderId === 'scale_tpl' || /(^| \/ )片头( \/ |$)/.test(path)) {
      return '片段拼接';
    }
    return '片段拼接';
  }

  function sourceForFolder(folderId) {
    if (!folderId) return '本地上传';
    if (folderId === 'tt_collected') return '外部采集';
    var collected = findFolderNode('tt_collected') || findInTree('tt_collected', CUSTOM_FOLDERS);
    if (collected && collectDescendantIds(collected).indexOf(folderId) !== -1) return '外部采集';
    return '本地上传';
  }

  function listAllFolderIds(nodes) {
    var ids = [];
    walkFolders(nodes, '', function (node) { ids.push(node.id); });
    return ids;
  }

  function matchDurationBuckets(sec, buckets) {
    if (!buckets || !buckets.length) return true;
    var s = Math.max(0, Number(sec) || 0);
    return buckets.some(function (b) {
      if (b === '0-6s') return s <= 6;
      if (b === '7-15s') return s >= 7 && s <= 15;
      if (b === '16-30s') return s >= 16 && s <= 30;
      if (b === '31-60s') return s >= 31 && s <= 60;
      if (b === '>60s') return s > 60;
      return false;
    });
  }

  /* ---------- 示例数据 ---------- */
  var MATERIAL_POOL = [];
  var TEMPLATE_POOL = [];

  (function buildPools() {
    var matNames = ['跑量成片', '竞品竖版', '口播混剪', '试玩主片', '剧情片头', '玩法演示'];
    var matTypes = ['视频', '视频', '视频', '图片'];
    var videoFormats = ['mp4', 'mov'];
    var imageFormats = ['png', 'jpg', 'gif'];
    var matSizes = ['1080x1920', '720x1280', '1920x1080', '1080x1080'];
    var durations = [3, 5, 10, 12, 20, 28, 40, 55, 75, 90];
    var folderIds = listAllFolderIds(CUSTOM_FOLDERS);
    if (!folderIds.length) folderIds = ['cube_derived'];
    var i = 0;
    folderIds.forEach(function (fid, fi) {
      var n = 8 + (fi % 8);
      var c;
      for (c = 0; c < n; c++, i++) {
        var type = pick(matTypes, i);
        var format = type === '视频' ? pick(videoFormats, i) : pick(imageFormats, i);
        var created = new Date();
        created.setDate(created.getDate() - (i % 18));
        created.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);
        var tags = [];
        if (fid === 'cube_derived') tags.push('衍生');
        if (i % 2 === 0) tags.push(pick(['英语', '繁中', '日语'], i));
        if (i % 3 === 0) tags.push(pick(['消消乐', '清理', 'CTR'], i + 1));
        if (!tags.length) tags.push('英语');
        MATERIAL_POOL.push({
          id: String(1000001 + i),
          name: pick(matNames, i) + '_' + (2000 + i) + '.' + format,
          folderId: fid,
          type: type,
          format: format,
          size: pick(matSizes, i),
          durationSec: type === '视频' ? pick(durations, i) : 0,
          creator: pick(USERS, i),
          tags: tags,
          source: sourceForFolder(fid),
          createdAt: formatDateTime(created),
          createdDate: formatDateYMD(created),
          createdTs: created.getTime()
        });
      }
    });

    var SPECS = {
      '片段拼接': { type: '视频', formats: ['mp4', 'mov'], names: ['片头拼接', '片尾拼接', '前后拼接', '转场拼接', '片段合集'] },
      '图层叠加': { formats: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'mov'], names: ['边框贴纸', '角标挂件', '装饰文字', '引导点击', '动态挂件'] },
      '音频替换': { type: '音频', formats: ['mp3', 'wav', 'm4a'], names: ['BGM替换', '口播替换', '音效混音', '背景音轨', '音频模板'] }
    };
    var tplIds = listAllFolderIds(TPL_CUSTOM);
    var ti = 0;
    tplIds.forEach(function (fid) {
      var category = tplCategoryForFolder(fid);
      var spec = SPECS[category];
      if (!spec) return;
      var extra = (fid.indexOf('common_') === 0 || fid === 'scale_tpl') ? 24 : 8;
      var c;
      for (c = 0; c < extra; c++, ti++) {
        var format = pick(spec.formats, ti);
        var type = spec.type || (String(format).toLowerCase() === 'mov' ? '视频' : '图片');
        var tCreated = new Date();
        tCreated.setDate(tCreated.getDate() - (ti % 14));
        tCreated.setHours(10, (ti * 5) % 60, 0, 0);
        TEMPLATE_POOL.push({
          id: String(2000001 + ti),
          name: pick(spec.names, ti) + '_' + (1000 + ti) + '.' + format,
          folderId: fid,
          type: type,
          format: format,
          size: type === '音频' ? '—' : pick(['1080x1920', '720x1280', '1080x1080'], ti),
          durationSec: (type === '视频' || type === '音频') ? pick(durations, ti) : 0,
          category: category,
          creator: pick(USERS, ti + 1),
          tags: [pick(['英语', '竖版', '高消耗'], ti)],
          source: '本地上传',
          createdAt: formatDateTime(tCreated),
          createdDate: formatDateYMD(tCreated),
          createdTs: tCreated.getTime()
        });
      }
    });
  })();

  var PICK_KINDS = {
    materials: { title: '选择素材', key: 'materials', source: 'material', gridId: 'selMaterials', countId: 'materialCount', clearId: 'clearMaterialsBtn', allLabel: '全部素材' },
    clips: { title: '选择片段', key: 'clips', source: 'template', category: '片段拼接', gridId: 'selClips', countId: 'clipCount', clearId: 'clearClipsBtn', allLabel: '全部模板' },
    layers: { title: '选择图层', key: 'layers', source: 'template', category: '图层叠加', gridId: 'selLayers', countId: 'layerCount', clearId: 'clearLayersBtn', allLabel: '全部模板' },
    audios: { title: '选择音频', key: 'audios', source: 'template', category: '音频替换', gridId: 'selAudios', countId: 'audioCount', clearId: 'clearAudiosBtn', allLabel: '全部模板' }
  };

  function makeLayerGroup(index) {
    layerGroupSeq += 1;
    return {
      id: 'lg_' + layerGroupSeq,
      name: '图层' + index,
      order: index,
      insertMode: '开场',
      insertSec: 0,
      insertStart: 0,
      insertEnd: 0,
      items: []
    };
  }

  function normalizeInsertMode(mode) {
    if (mode === '贯穿') return '贯穿全场';
    return mode || '开场';
  }

  function normalizeClipGroups(clips) {
    if (clips && !Array.isArray(clips)) {
      return {
        intro: Array.isArray(clips.intro) ? clips.intro : [],
        outro: Array.isArray(clips.outro) ? clips.outro : []
      };
    }
    if (Array.isArray(clips) && clips.length) {
      return { intro: clips.slice(), outro: [] };
    }
    return { intro: [], outro: [] };
  }

  function isLayerGroup(x) {
    return x && typeof x === 'object' && Array.isArray(x.items) && !x.category;
  }

  function normalizeLayerGroups(layers) {
    if (!Array.isArray(layers) || !layers.length) return [makeLayerGroup(1)];
    if (isLayerGroup(layers[0])) {
      return layers.map(function (g, i) {
        return {
          id: g.id || ('lg_' + (i + 1)),
          name: g.name || ('图层' + (i + 1)),
          order: g.order != null ? Number(g.order) : (i + 1),
          insertMode: normalizeInsertMode(g.insertMode),
          insertSec: Number(g.insertSec) || 0,
          insertStart: Number(g.insertStart) || 0,
          insertEnd: Number(g.insertEnd) || 0,
          items: Array.isArray(g.items) ? g.items : []
        };
      }).slice(0, LAYER_TAB_MAX);
    }
    var g = makeLayerGroup(1);
    g.items = layers.slice();
    return [g];
  }

  function allClipItems(cfg) {
    var c = (cfg || {}).clips;
    if (Array.isArray(c)) return c;
    return ((c && c.intro) || []).concat((c && c.outro) || []);
  }

  function allLayerItems(cfg) {
    var layers = (cfg || {}).layers || [];
    if (layers[0] && Array.isArray(layers[0].items)) {
      var out = [];
      layers.forEach(function (g) {
        (g.items || []).forEach(function (it) { out.push(it); });
      });
      return out;
    }
    return layers;
  }

  function clipLen(cfg, key) {
    var c = (cfg || {}).clips;
    if (Array.isArray(c)) return key === 'intro' ? dimLen(c) : 0;
    return dimLen(c && c[key]);
  }

  function clipCount(cfg) {
    return dimLen(allClipItems(cfg || state.cfg));
  }

  function layerItemCount(cfg) {
    return dimLen(allLayerItems(cfg || state.cfg));
  }

  function snapshotClipGroups(clips) {
    var c = normalizeClipGroups(clips);
    return { intro: snapshotItems(c.intro), outro: snapshotItems(c.outro) };
  }

  function snapshotLayerGroups(groups) {
    return (groups || []).map(function (g) {
      return {
        id: g.id,
        name: g.name,
        order: g.order,
        insertMode: normalizeInsertMode(g.insertMode),
        insertSec: g.insertSec,
        insertStart: g.insertStart,
        insertEnd: g.insertEnd,
        items: snapshotItems(g.items)
      };
    });
  }

  function defaultConfig() {
    return {
      materialType: '视频',
      materials: [],
      clips: { intro: [], outro: [] },
      layers: [makeLayerGroup(1)],
      audios: [],
      countMode: 'fixed',
      fixedCount: 10,
      md5: true,
      resize: true,
      size: '1080x1920',
      sizeGroup: '竖版(9:16)',
      trim: false,
      trimMode: '剪掉片尾',
      trimSec: 4,
      trimStart: 0,
      trimEnd: 10,
      folderMode: 'inherit',
      localFolderId: '',
      creativeMode: 'inherit',
      creative: '',
      nameTpl: DEFAULT_NAME,
      tagMode: 'inherit',
      tags: [],
      uploadXmp: '是',
      filterDup: true,
      xmpFolderMode: '已有文件夹',
      targetFolder: '',
      parentFolder: '',
      folderName: DEFAULT_FOLDER_NAME
    };
  }

  function dimLen(arr) { return (arr && arr.length) ? arr.length : 0; }

  function deriveCountMin(cfg) {
    return dimLen((cfg || state.cfg).materials);
  }

  function clampDeriveCount(n, cfg) {
    var min = deriveCountMin(cfg);
    var max = DERIVE_LIMIT;
    n = Math.floor(Number(n) || 0);
    if (n > max) n = max;
    if (min > 0 && n < min) n = min;
    if (n < 0) n = 0;
    return n;
  }

  function deriveQty(cfg) {
    return clampDeriveCount((cfg || state.cfg).fixedCount, cfg);
  }

  function perMaterialShare(m, n) {
    if (!m || n < 1) return { lo: 0, hi: 0, text: '0' };
    var lo = Math.floor(n / m);
    var hi = Math.ceil(n / m);
    return { lo: lo, hi: hi, text: lo === hi ? String(lo) : (lo + '～' + hi) };
  }

  function deriveTotal(cfg) {
    if (!dimLen(cfg.materials)) return 0;
    return deriveQty(cfg);
  }

  function summaryText(cfg) {
    var m = dimLen(cfg.materials);
    var n = deriveTotal(cfg);
    var share = perMaterialShare(m, n);
    return '衍生 ' + n + ' 条：已选素材' + m + '，每条约均分' + share.text;
  }

  function ensureSystemTag(tags) {
    var next = (tags || []).filter(function (t) { return t; });
    if (next.indexOf(SYSTEM_TAG) === -1) next.unshift(SYSTEM_TAG);
    return next;
  }

  function itemById(id, pool) {
    var i;
    for (i = 0; i < pool.length; i++) {
      if (pool[i].id === id) return pool[i];
    }
    return null;
  }

  function resolveItems(list, pool) {
    return (list || []).map(function (it) {
      if (it && it.id && it.name) return it;
      return itemById(typeof it === 'string' ? it : (it && it.id), pool);
    }).filter(Boolean);
  }

  /* ---------- mock tasks ---------- */
  function snapshotItems(list) {
    return (list || []).map(function (it) {
      return {
        id: it.id,
        name: it.name,
        type: it.type,
        format: it.format,
        size: it.size,
        durationSec: it.durationSec,
        category: it.category || '',
        folderId: it.folderId || '',
        creator: it.creator || '',
        tags: (it.tags || []).slice(),
        source: it.source || '',
        createdAt: it.createdAt || ''
      };
    });
  }

  function pickSlice(pool, start, n) {
    var out = [];
    var i;
    if (!pool || !pool.length) return out;
    for (i = 0; i < n; i++) out.push(pool[(start + i) % pool.length]);
    return snapshotItems(out);
  }

  function templatesByCategory(cat) {
    return TEMPLATE_POOL.filter(function (t) { return t.category === cat; });
  }

  function buildSubs(task, count) {
    var cfg = task.config || defaultConfig();
    var list = [];
    var i;
    var mats = cfg.materials || [];
    var clips = allClipItems(cfg);
    var layers = allLayerItems(cfg);
    var audios = cfg.audios || [];
    for (i = 0; i < count; i++) {
      var st;
      if (task.status === '已完成') {
        st = (i === 1 || i % 13 === 8) ? '已失败' : '已完成';
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
      var mat = mats[i % Math.max(1, mats.length)];
      var clip = clips.length ? clips[i % clips.length] : null;
      var layer = layers.length ? layers[i % layers.length] : null;
      var audio = audios.length ? audios[i % audios.length] : null;
      var parts = [];
      if (mat) parts.push(stripExt(mat.name));
      if (clip) parts.push(stripExt(clip.name));
      if (layer) parts.push(stripExt(layer.name));
      if (audio) parts.push(stripExt(audio.name));
      var base = (cfg.nameTpl || '衍生').replace(/\{[^}]+\}/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '') || '衍生';
      list.push({
        id: task.id + '-s' + (i + 1),
        name: base + '_' + pad4(i + 1),
        combo: parts.join(' + ') || '—',
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
    var statuses = [
      '待开始', '进行中', '已完成', '已取消', '已失败'
    ];
    var clipPool = templatesByCategory('片段拼接');
    var layerPool = templatesByCategory('图层叠加');
    var audioPool = templatesByCategory('音频替换');
    var videoPool = MATERIAL_POOL.filter(function (it) { return it.type === '视频'; });
    var i;
    for (i = 0; i < 14; i++) {
      var status = i < statuses.length ? statuses[i] : '已完成';
      var cfg = defaultConfig();
      cfg.materialType = '视频';
      cfg.materials = pickSlice(videoPool.length ? videoPool : MATERIAL_POOL, i * 3, 4 + (i % 5));
      cfg.clips = {
        intro: pickSlice(clipPool, i * 2, 1 + (i % 3)),
        outro: i % 2 ? pickSlice(clipPool, i + 3, 1 + (i % 2)) : []
      };
      cfg.layers[0].items = i % 3 === 0 ? [] : pickSlice(layerPool, i, 1 + (i % 3));
      if (i % 5 === 1) {
        var extraLayer = makeLayerGroup(2);
        extraLayer.insertMode = '结尾';
        extraLayer.insertSec = 2;
        extraLayer.items = pickSlice(layerPool, i + 2, 1);
        cfg.layers.push(extraLayer);
      }
      cfg.audios = i % 4 === 0 ? [] : pickSlice(audioPool, i, 1 + (i % 2));
      cfg.creative = pick(USERS, i);
      cfg.targetFolder = XMP_FOLDERS[i % XMP_FOLDERS.length];
      cfg.countMode = 'fixed';
      cfg.fixedCount = 24 + (i % 6) * 8;
      cfg.trim = true;
      if (i === 2) {
        cfg.materials = pickSlice(videoPool.length ? videoPool : MATERIAL_POOL, 0, 20);
        cfg.clips = { intro: pickSlice(clipPool, 0, 6), outro: pickSlice(clipPool, 6, 4) };
        cfg.layers[0].items = pickSlice(layerPool, 0, 5);
        cfg.layers[0].insertMode = '开场';
        cfg.layers[0].insertSec = 1;
        var layerB = makeLayerGroup(2);
        layerB.insertMode = '自定义';
        layerB.insertStart = 2;
        layerB.insertEnd = 8;
        layerB.items = pickSlice(layerPool, 5, 3);
        cfg.layers = [cfg.layers[0], layerB];
        cfg.audios = pickSlice(audioPool, 0, 5);
      }
      var total = deriveTotal(cfg);
      var success = 0;
      var fail = 0;
      var processing = 0;
      if (status === '待开始') {
        processing = total;
      } else if (status === '进行中') {
        success = Math.floor(total * 0.35);
        fail = Math.floor(total * 0.05);
        processing = total - success - fail;
      } else if (status === '已完成') {
        success = total;
      } else if (status === '已取消') {
        success = Math.floor(total / 3);
        fail = total - success;
      } else {
        success = Math.floor(total / 5);
        fail = Math.max(1, total - success);
      }
      var created = new Date();
      created.setHours(created.getHours() - i * 5 - (i % 3));
      var updated = new Date(created);
      if (status === '已完成' || status === '已失败' || status === '已取消') {
        updated.setMinutes(updated.getMinutes() + 18 + (i % 20));
      } else if (status === '进行中') {
        updated.setMinutes(updated.getMinutes() + 6 + (i % 10));
      }
      var task = {
        id: pad4(5201 - i),
        creator: pick(USERS, i),
        total: total,
        status: status,
        success: success,
        fail: fail,
        processing: processing,
        createdAt: formatDateTime(created),
        createdDate: formatDateYMD(created),
        updatedAt: formatDateTime(status === '待开始' ? created : updated),
        config: cfg,
        summary: summaryText(cfg)
      };
      task.subs = buildSubs(task, Math.min(total, 48));
      list.push(task);
    }
    return list;
  }

  var ALL_ROWS = buildMockTasks();
  var nextId = 5210;

  var state = {
    draft: { creator: '', status: '', start: null, end: null },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    confirmId: null,
    detailId: null,
    subDraft: { status: '' },
    subApplied: { status: '' },
    subPage: 1,
    subPageSize: 20,
    subPaginationBound: false,
    subSelected: {},
    cfg: defaultConfig(),
    clipTab: 'intro',
    layerTab: 0,
    sizeGroup: '竖版(9:16)',
    picker: {
      kind: 'materials',
      folderId: '',
      folderKw: '',
      showSub: false,
      draft: { creator: '', tags: [], sizes: [], formats: [], durations: [], source: '', name: '', start: null, end: null },
      applied: { creator: '', tags: [], sizes: [], formats: [], durations: [], source: '', name: '', start: null, end: null },
      page: 1,
      pageSize: 50,
      view: 'list',
      paginationBound: false,
      draftIds: [],
      collapsed: {},
      dateCleared: false
    }
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
        }
        portalDropdown(panel, trigger);
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      if (cfg.onChange) cfg.onChange(opt.getAttribute('data-value') || '');
      syncLabel();
      panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
      trigger.classList.remove('is-open');
      unportalDropdown(panel);
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
          unportalDropdown(panel);
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
      unportalDropdown(p);
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
    return d >= formatDateYMD(start) && d <= formatDateYMD(end);
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

  function actionHtml(row) {
    var canCancel = row.status === '待开始' || row.status === '进行中';
    var canRetry = row.status === '已取消' || row.status === '已失败';
    return '<div class="action-links">' +
      '<button class="link" type="button" data-act="detail" data-id="' + escapeHtml(row.id) + '">详情</button>' +
      '<button class="link" type="button" data-act="cancel" data-id="' + escapeHtml(row.id) + '"' + (canCancel ? '' : ' disabled') + '>取消</button>' +
      '<button class="link" type="button" data-act="retry" data-id="' + escapeHtml(row.id) + '"' + (canRetry ? '' : ' disabled') + '>重试</button>' +
      '</div>';
  }

  function findTask(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
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
          '<td><span class="summary-cell" title="' + escapeHtml(row.summary || '') + '">' + escapeHtml(row.summary || '—') + '</span></td>' +
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
        getPage: function () { return state.page; },
        getPageSize: function () { return state.pageSize; },
        getTotal: function () { return getFilteredRows().length; },
        onPageChange: function (p) { state.page = p; renderTable(); },
        onPageSizeChange: function (s) { state.pageSize = s; state.page = 1; renderTable(); }
      });
    }
    if (window.ColResize) window.ColResize.initAll(document);
  }

  /* ---------- folder tree select ---------- */
  function bindFolderTreeSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    var list = $(cfg.listId);
    var search = $(cfg.searchId);
    var clearBtn = $(cfg.clearId);
    if (!wrap || !trigger || !panel || !label || !list) return null;

    var roots = cfg.getRoots ? cfg.getRoots() : STORAGE_FOLDERS;
    var collapsed = {};
    roots.forEach(function (n) {
      if (n.children && n.children.length) collapsed[n.id] = true;
    });

    function getValue() { return cfg.getValue ? cfg.getValue() : ''; }
    function setValue(v) { if (cfg.setValue) cfg.setValue(v || ''); }

    function syncLabel() {
      var id = getValue();
      if (!id) {
        label.innerHTML = '<span class="muted">' + (cfg.placeholder || '请选择') + '</span>';
        wrap.classList.remove('has-value');
        return;
      }
      label.textContent = (cfg.getPath ? cfg.getPath(id) : getLocalFolderPath(id)) || id;
      wrap.classList.add('has-value');
    }

    function nodeMatches(node, kw) {
      if (!kw) return true;
      if ((node.name || '').toLowerCase().indexOf(kw) !== -1) return true;
      return (node.children || []).some(function (c) { return nodeMatches(c, kw); });
    }

    function renderNode(node, depth) {
      var kw = search ? (search.value || '').trim().toLowerCase() : '';
      if (kw && !nodeMatches(node, kw)) return '';
      var hasChildren = !!(node.children && node.children.length);
      var isCollapsed = !!collapsed[node.id] && !kw;
      var active = node.id === getValue() ? ' is-active' : '';
      var pad = 12 + depth * 16;
      var toggle = hasChildren
        ? ('<button class="folder-tree-node__toggle' + (isCollapsed ? '' : ' is-open') + '" type="button" data-toggle="' +
          escapeHtml(node.id) + '" aria-label="展开/收起">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg></button>')
        : '<span class="folder-tree-node__toggle is-empty" aria-hidden="true"></span>';
      var html = '<div class="folder-tree-node' + active + '" style="padding-left:' + pad + 'px">' +
        toggle +
        '<button class="folder-tree-node__label" type="button" data-folder-id="' + escapeHtml(node.id) + '">' +
          escapeHtml(node.name) +
        '</button></div>';
      if (hasChildren && !isCollapsed) {
        node.children.forEach(function (child) {
          html += renderNode(child, depth + 1);
        });
      }
      return html;
    }

    function render() {
      var currentRoots = cfg.getRoots ? cfg.getRoots() : roots;
      list.innerHTML = currentRoots.map(function (n) { return renderNode(n, 0); }).join('') ||
        '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
      if (panel.classList.contains('is-open')) portalDropdown(panel, trigger);
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
        if (search) {
          search.value = '';
          search.focus();
        }
        if (UI.adjustDropdownPlacement) UI.adjustDropdownPlacement(panel, trigger);
        portalDropdown(panel, trigger);
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var toggleBtn = e.target.closest('[data-toggle]');
      if (toggleBtn) {
        var tid = toggleBtn.getAttribute('data-toggle');
        collapsed[tid] = !collapsed[tid];
        render();
        return;
      }
      var opt = e.target.closest('[data-folder-id]');
      if (!opt) return;
      setValue(opt.getAttribute('data-folder-id') || '');
      if (cfg.onChange) cfg.onChange(getValue());
      syncLabel();
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
      unportalDropdown(panel);
    });

    if (search) {
      search.addEventListener('input', function () { render(); });
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setValue('');
        if (cfg.onChange) cfg.onChange('');
        syncLabel();
        panel.classList.remove('is-open');
        trigger.classList.remove('is-open');
        unportalDropdown(panel);
      });
    }
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel, render: render };
  }

  function bindCascadeMultiSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    var groupList = $(cfg.groupListId);
    var childList = $(cfg.childListId);
    var selectedEl = $(cfg.selectedId);
    var search = cfg.searchId ? $(cfg.searchId) : null;
    var countEl = cfg.countId ? $(cfg.countId) : null;
    if (!wrap || !trigger || !panel || !groupList || !childList) return null;

    var tree = cfg.tree || [];
    var frozen = cfg.frozenLeaves || [];
    var activeGroupId = tree[0] ? tree[0].id : '';

    function getSelected() {
      return ensureFrozen(cfg.getSelected ? cfg.getSelected() : []);
    }
    function setSelected(arr) {
      if (cfg.setSelected) cfg.setSelected(ensureFrozen(arr));
    }
    function ensureFrozen(arr) {
      var next = (arr || []).slice();
      frozen.forEach(function (t) {
        if (next.indexOf(t) === -1) next.unshift(t);
      });
      return next;
    }
    function isFrozen(name) { return frozen.indexOf(name) !== -1; }
    function allLeaves() { return flattenTreeLeaves(tree); }
    function findGroup(id) {
      var i;
      for (i = 0; i < tree.length; i++) {
        if (tree[i].id === id) return tree[i];
      }
      return null;
    }
    function groupState(group, selected) {
      var children = group.children || [];
      var hit = 0;
      children.forEach(function (c) {
        if (selected.indexOf(c) !== -1) hit += 1;
      });
      return { all: children.length > 0 && hit === children.length, some: hit > 0 && hit < children.length };
    }
    function syncLabel() {
      var selected = getSelected();
      var prefix = cfg.prefix || '';
      var emptyText = cfg.placeholder || (prefix ? '请选择' : '请选择标签');
      if (!selected.length) {
        label.innerHTML = prefix + '<span class="muted">' + emptyText + '</span>';
        wrap.classList.remove('has-value');
      } else {
        label.innerHTML = prefix + '已选 ' + selected.length + ' 项';
        wrap.classList.add('has-value');
      }
      if (countEl) countEl.textContent = '已选 ' + selected.length + ' 项';
    }
    function matchesKw(text, kw) {
      if (!kw) return true;
      return String(text).toLowerCase().indexOf(kw) !== -1;
    }
    function render() {
      var kw = ((search && search.value) || '').trim().toLowerCase();
      var selected = getSelected();
      var visibleGroups = tree.filter(function (g) {
        if (matchesKw(g.label, kw)) return true;
        return (g.children || []).some(function (c) { return matchesKw(c, kw); });
      });
      if (!activeGroupId || !visibleGroups.some(function (g) { return g.id === activeGroupId; })) {
        activeGroupId = visibleGroups[0] ? visibleGroups[0].id : '';
      }
      if (!visibleGroups.length) {
        groupList.innerHTML = '<div class="cascade-panel__empty">暂无数据</div>';
      } else {
        groupList.innerHTML = visibleGroups.map(function (g) {
          var st = groupState(g, selected);
          var active = g.id === activeGroupId ? ' is-active' : '';
          return '<label class="cascade-option' + active + '" data-group="' + escapeHtml(g.id) + '">' +
            '<input type="checkbox" data-group-check="' + escapeHtml(g.id) + '"' + (st.all ? ' checked' : '') + ' />' +
            '<span class="cascade-option__label">' + escapeHtml(g.label) + '</span>' +
            CASCADE_ARROW +
          '</label>';
        }).join('');
        groupList.querySelectorAll('input[data-group-check]').forEach(function (input) {
          var g = findGroup(input.getAttribute('data-group-check'));
          if (!g) return;
          input.indeterminate = groupState(g, selected).some;
        });
      }
      var activeGroup = findGroup(activeGroupId);
      var children = ((activeGroup && activeGroup.children) || []).filter(function (c) { return matchesKw(c, kw); });
      if (!activeGroup || !children.length) {
        childList.innerHTML = '<div class="cascade-panel__empty">' + (activeGroup ? '暂无数据' : '请选择分组') + '</div>';
      } else {
        childList.innerHTML = children.map(function (c) {
          var checked = selected.indexOf(c) !== -1 ? ' checked' : '';
          var disabled = isFrozen(c) ? ' disabled' : '';
          return '<label class="cascade-option">' +
            '<input type="checkbox" data-leaf="' + escapeHtml(c) + '"' + checked + disabled + ' />' +
            '<span class="cascade-option__label">' + escapeHtml(c) + '</span>' +
          '</label>';
        }).join('');
      }
      if (selectedEl) {
        selectedEl.innerHTML = selected.map(function (name) {
          var remove = isFrozen(name)
            ? ''
            : ('<button class="multi-selected__remove" type="button" data-remove="' + escapeHtml(name) + '" aria-label="移除">' + CLEAR_ICON + '</button>');
          return '<div class="multi-selected"><span class="multi-selected__name"><span title="' + escapeHtml(name) + '">' +
            escapeHtml(name) + '</span></span>' + remove + '</div>';
        }).join('');
      }
      syncLabel();
    }
    function needsPortal() {
      return !!(wrap.closest('.drawer') || wrap.closest('.modal-mask') || wrap.closest('.cfg-page'));
    }
    function unportalPanel() {
      panel.classList.remove('cascade-panel--portal');
      panel.style.position = '';
      panel.style.left = '';
      panel.style.top = '';
      panel.style.right = '';
      panel.style.bottom = '';
      panel.style.margin = '';
      panel.style.zIndex = '';
      var host = panel.__cascadeHost;
      if (host && panel.parentElement !== host) host.appendChild(panel);
    }
    function portalPanel() {
      if (!needsPortal()) return;
      if (!panel.__cascadeHost) panel.__cascadeHost = panel.parentElement;
      if (panel.parentElement !== document.body) document.body.appendChild(panel);
      panel.classList.add('cascade-panel--portal');
      var rect = trigger.getBoundingClientRect();
      var pw = panel.offsetWidth || 640;
      var ph = panel.offsetHeight || 280;
      var pad = 8;
      var left = rect.left;
      if (left + pw > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - pw - pad);
      var top = rect.bottom + 4;
      if (top + ph > window.innerHeight - pad && rect.top - ph - 4 >= pad) top = rect.top - ph - 4;
      panel.style.position = 'fixed';
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      panel.style.right = 'auto';
      panel.style.margin = '0';
      panel.style.zIndex = '1200';
    }
    function closeCascadePanel() {
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
      unportalPanel();
    }
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      if (UI.closePanels) UI.closePanels();
      document.querySelectorAll('.cascade-panel.is-open').forEach(function (p) {
        if (p !== panel) {
          p.classList.remove('is-open');
          if (p.__cascadeHost && p.parentElement !== p.__cascadeHost) p.__cascadeHost.appendChild(p);
          p.classList.remove('cascade-panel--portal');
        }
      });
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
        portalPanel();
        if (!panel.classList.contains('cascade-panel--portal') && UI.adjustDropdownPlacement) {
          UI.adjustDropdownPlacement(panel, trigger);
        }
      } else {
        closeCascadePanel();
      }
    });
    if (search) {
      search.addEventListener('input', render);
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    groupList.addEventListener('click', function (e) {
      var row = e.target.closest('[data-group]');
      if (!row || e.target.closest('input[type="checkbox"]')) return;
      activeGroupId = row.getAttribute('data-group');
      render();
    });
    groupList.addEventListener('change', function (e) {
      var input = e.target.closest('input[data-group-check]');
      if (!input) return;
      var group = findGroup(input.getAttribute('data-group-check'));
      if (!group) return;
      activeGroupId = group.id;
      var selected = getSelected();
      var children = group.children || [];
      if (input.checked) {
        children.forEach(function (c) {
          if (selected.indexOf(c) === -1) selected.push(c);
        });
      } else {
        selected = selected.filter(function (c) { return children.indexOf(c) === -1 || isFrozen(c); });
      }
      setSelected(selected);
      render();
    });
    childList.addEventListener('change', function (e) {
      var input = e.target.closest('input[data-leaf]');
      if (!input) return;
      var name = input.getAttribute('data-leaf');
      if (isFrozen(name)) {
        input.checked = true;
        return;
      }
      var selected = getSelected();
      if (input.checked) {
        if (selected.indexOf(name) === -1) selected.push(name);
      } else {
        selected = selected.filter(function (n) { return n !== name; });
      }
      setSelected(selected);
      render();
    });
    if (selectedEl) {
      selectedEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-remove]');
        if (!btn) return;
        var name = btn.getAttribute('data-remove');
        if (isFrozen(name)) return;
        setSelected(getSelected().filter(function (n) { return n !== name; }));
        render();
      });
    }
    if (cfg.selectAllId && $(cfg.selectAllId)) {
      $(cfg.selectAllId).addEventListener('click', function (e) {
        e.stopPropagation();
        var kw = ((search && search.value) || '').trim().toLowerCase();
        var selected = getSelected();
        allLeaves().forEach(function (name) {
          if (!matchesKw(name, kw)) return;
          if (selected.indexOf(name) === -1) selected.push(name);
        });
        setSelected(selected);
        render();
      });
    }
    if (cfg.clearAllId && $(cfg.clearAllId)) {
      $(cfg.clearAllId).addEventListener('click', function (e) {
        e.stopPropagation();
        setSelected(frozen.slice());
        render();
      });
    }
    if (cfg.clearId && $(cfg.clearId)) {
      $(cfg.clearId).addEventListener('click', function (e) {
        e.stopPropagation();
        setSelected(frozen.slice());
        render();
        closeCascadePanel();
      });
    }
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { render: render, syncLabel: syncLabel, close: closeCascadePanel };
  }

  var cfgLocalFolderApi = bindFolderTreeSelect({
    wrapId: 'cfgLocalFolderWrap',
    triggerId: 'cfgLocalFolderTrigger',
    panelId: 'cfgLocalFolderPanel',
    labelId: 'cfgLocalFolderLabel',
    listId: 'cfgLocalFolderList',
    searchId: 'cfgLocalFolderSearch',
    clearId: 'cfgLocalFolderClear',
    placeholder: '请选择本地素材库文件夹',
    getRoots: function () { return STORAGE_FOLDERS; },
    getPath: function (id) { return getLocalFolderPath(id); },
    getValue: function () { return state.cfg.localFolderId; },
    setValue: function (v) { state.cfg.localFolderId = v || ''; },
    onChange: function () { clearError('cfgLocalFolderItem'); }
  });

  var cfgTagSelect = bindCascadeMultiSelect({
    wrapId: 'cfgTagWrap',
    triggerId: 'cfgTagTrigger',
    panelId: 'cfgTagPanel',
    labelId: 'cfgTagLabel',
    groupListId: 'cfgTagGroupList',
    childListId: 'cfgTagChildList',
    selectedId: 'cfgTagSelected',
    searchId: 'cfgTagSearch',
    countId: 'cfgTagCount',
    selectAllId: 'cfgTagSelectAll',
    clearAllId: 'cfgTagClearAll',
    clearId: 'cfgTagClear',
    tree: FORM_TAG_TREE,
    frozenLeaves: [],
    getSelected: function () { return (state.cfg.tags || []).filter(function (t) { return t !== SYSTEM_TAG; }); },
    setSelected: function (arr) { state.cfg.tags = (arr || []).filter(function (t) { return t !== SYSTEM_TAG; }); }
  });

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

  var cfgTargetApi = bindFolderTreeSelect({
    wrapId: 'cfgTargetFolderWrap',
    triggerId: 'cfgTargetFolderTrigger',
    panelId: 'cfgTargetFolderPanel',
    labelId: 'cfgTargetFolderLabel',
    listId: 'cfgTargetFolderList',
    searchId: 'cfgTargetFolderSearch',
    clearId: 'cfgTargetFolderClear',
    placeholder: '请选择',
    getRoots: function () { return XMP_FOLDER_TREE; },
    getPath: function (id) { return id || ''; },
    getValue: function () { return state.cfg.targetFolder; },
    setValue: function (v) { state.cfg.targetFolder = v || ''; },
    onChange: function () { clearError('cfgTargetFolderItem'); }
  });

  var cfgParentApi = bindFolderTreeSelect({
    wrapId: 'cfgParentFolderWrap',
    triggerId: 'cfgParentFolderTrigger',
    panelId: 'cfgParentFolderPanel',
    labelId: 'cfgParentFolderLabel',
    listId: 'cfgParentFolderList',
    searchId: 'cfgParentFolderSearch',
    clearId: 'cfgParentFolderClear',
    placeholder: '请选择',
    getRoots: function () { return XMP_FOLDER_TREE; },
    getPath: function (id) { return id || ''; },
    getValue: function () { return state.cfg.parentFolder; },
    setValue: function (v) { state.cfg.parentFolder = v || ''; }
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

  var layerInsertApi = UI.bindSingleSelect({
    wrapId: 'layerInsertWrap',
    triggerId: 'layerInsertTrigger',
    panelId: 'layerInsertPanel',
    labelId: 'layerInsertLabel',
    getValue: function () {
      var g = currentLayerGroup();
      return (g && g.insertMode) || '开场';
    },
    onChange: function (v) {
      var g = currentLayerGroup();
      if (g) g.insertMode = v || '开场';
      syncLayerInsertFields();
    }
  });

  function renderSizeCascade() {
    var groupList = $('cfgSizeGroupList');
    var valueList = $('cfgSizeValueList');
    if (!groupList || !valueList) return;
    groupList.innerHTML = SIZE_TREE.map(function (g) {
      var active = g.group === state.sizeGroup ? ' is-active' : '';
      return '<button class="size-cascade__item' + active + '" type="button" data-group="' + escapeHtml(g.group) + '">' +
        '<span class="size-cascade__label">' + escapeHtml(g.group) + '</span>' + CASCADE_ARROW +
      '</button>';
    }).join('');
    var current = SIZE_TREE.find(function (g) { return g.group === state.sizeGroup; }) || SIZE_TREE[0];
    valueList.innerHTML = current.values.map(function (v) {
      var active = v === state.cfg.size ? ' is-active' : '';
      return '<button class="size-cascade__item' + active + '" type="button" data-size="' + escapeHtml(v) + '">' +
        '<span class="size-cascade__label">' + escapeHtml(v) + '</span>' +
      '</button>';
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
        portalDropdown(panel, trigger);
      }
    });
    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var groupBtn = e.target.closest('[data-group]');
      if (groupBtn) {
        state.sizeGroup = groupBtn.getAttribute('data-group');
        renderSizeCascade();
        portalDropdown(panel, trigger);
        return;
      }
      var sizeBtn = e.target.closest('[data-size]');
      if (sizeBtn) {
        state.cfg.size = sizeBtn.getAttribute('data-size');
        state.cfg.sizeGroup = state.sizeGroup;
        syncSizeLabel();
        panel.classList.remove('is-open', 'is-dropup', 'is-align-right');
        trigger.classList.remove('is-open');
        unportalDropdown(panel);
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
  bindSwitch('cfgTrimSwitch', 'trim', function () { syncTrimFields(); });
  bindSwitch('cfgDupSwitch', 'filterDup');

  function syncInheritExtras() {
    var folderWrap = $('cfgLocalFolderWrap');
    var creativeWrap = $('cfgCreativeWrap');
    var tagWrap = $('cfgTagWrap');
    if (folderWrap) folderWrap.classList.toggle('is-hidden', state.cfg.folderMode !== 'custom');
    if (creativeWrap) creativeWrap.classList.toggle('is-hidden', state.cfg.creativeMode !== 'custom');
    if (tagWrap) tagWrap.classList.toggle('is-hidden', state.cfg.tagMode !== 'custom');
  }

  function syncXmpBlock() {
    var show = state.cfg.uploadXmp === '是';
    var block = $('cfgXmpBlock');
    var dupItem = $('cfgDupItem');
    if (block) block.classList.toggle('is-hidden', !show);
    if (dupItem) dupItem.classList.toggle('is-hidden', !show);
    syncXmpFolderMode();
  }

  function syncXmpFolderMode() {
    var create = state.cfg.xmpFolderMode === '创建文件夹';
    var existing = $('cfgTargetFolderItem');
    var createBlock = $('cfgCreateFolderBlock');
    if (existing) existing.classList.toggle('is-hidden', create);
    if (createBlock) createBlock.classList.toggle('is-hidden', !create);
  }

  function isImageType(cfg) {
    return ((cfg || state.cfg).materialType === '图片');
  }

  function setTrimSwitch(on) {
    state.cfg.trim = !!on;
    var el = $('cfgTrimSwitch');
    if (el) {
      el.classList.toggle('is-on', !!on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    syncTrimFields();
  }

  function syncMaterialTypeUi() {
    var image = isImageType();
    UI.setSegValue('cfgMaterialTypeSeg', image ? '图片' : '视频');
    var trimItem = $('cfgTrimItem');
    if (trimItem) trimItem.classList.toggle('is-hidden', image);
    var clipItem = $('cfgClipItem');
    var audioItem = $('cfgAudioItem');
    if (clipItem) clipItem.classList.toggle('is-hidden', image);
    if (audioItem) audioItem.classList.toggle('is-hidden', image);
    var subform = $('layerSubform');
    if (subform) subform.classList.toggle('is-hidden', image);
    if (image) setTrimSwitch(false);
    else syncTrimFields();
  }

  function setMaterialType(type) {
    type = type === '图片' ? '图片' : '视频';
    var prev = state.cfg.materialType === '图片' ? '图片' : '视频';
    if (prev === type) {
      syncMaterialTypeUi();
      return;
    }
    var hadMaterials = dimLen(state.cfg.materials);
    state.cfg.materialType = type;
    state.cfg.materials = [];
    if (type === '图片') {
      state.cfg.clips = { intro: [], outro: [] };
      state.cfg.audios = [];
    }
    syncPickField('materials');
    syncPickField('clips');
    syncPickField('audios');
    syncDeriveCountInput(true);
    syncMaterialTypeUi();
    updateFissionHint();
    if (hadMaterials) UI.showToast('已切换类型，请重新添加素材', 'warning');
  }

  UI.bindSeg('cfgMaterialTypeSeg', function (v) {
    setMaterialType(v);
  });
  UI.bindSeg('cfgFolderInheritSeg', function (v) {
    state.cfg.folderMode = v;
    clearError('cfgLocalFolderItem');
    syncInheritExtras();
  });
  UI.bindSeg('cfgCreativeInheritSeg', function (v) {
    state.cfg.creativeMode = v;
    clearError('cfgCreativeItem');
    syncInheritExtras();
  });
  UI.bindSeg('cfgTagInheritSeg', function (v) {
    state.cfg.tagMode = v;
    syncInheritExtras();
  });
  UI.bindSeg('cfgXmpSeg', function (v) {
    state.cfg.uploadXmp = v;
    syncXmpBlock();
  });
  UI.bindSeg('cfgXmpFolderSeg', function (v) {
    state.cfg.xmpFolderMode = v;
    clearError('cfgTargetFolderItem');
    clearError('cfgFolderNameItem');
    syncXmpFolderMode();
  });

  function syncTrimFields() {
    var trimOn = state.cfg.trim;
    var mode = state.cfg.trimMode;
    var simple = $('cfgTrimSimple');
    var range = $('cfgTrimRange');
    var modeWrap = $('cfgTrimModeWrap');
    if (modeWrap) {
      modeWrap.classList.toggle('is-hidden', !trimOn);
      modeWrap.style.display = '';
    }
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

  var fixedInput = $('cfgFixedCount');
  if (fixedInput) {
    fixedInput.max = String(DERIVE_LIMIT);
    fixedInput.addEventListener('input', function () {
      state.cfg.fixedCount = Number(fixedInput.value) || 0;
      state.cfg.countMode = 'fixed';
      clearError('cfgCountItem');
      updateFissionHint();
    });
    fixedInput.addEventListener('blur', function () {
      syncDeriveCountInput(true);
      updateFissionHint();
    });
  }

  function syncDeriveCountInput(clamp) {
    var input = $('cfgFixedCount');
    if (!input) return;
    var min = deriveCountMin();
    input.min = String(min);
    input.max = String(DERIVE_LIMIT);
    if (!clamp) return;
    var next = clampDeriveCount(input.value);
    input.value = next ? String(next) : (min ? String(min) : '');
    state.cfg.fixedCount = Number(input.value) || 0;
    state.cfg.countMode = 'fixed';
  }

  function updateFissionHint() {
    var el = $('cfgFissionHint');
    if (!el) return;
    var cfg = state.cfg;
    var m = dimLen(cfg.materials);
    var min = deriveCountMin(cfg);
    var raw = Math.floor(Number(cfg.fixedCount) || 0);
    var n = deriveQty(cfg);
    var share = perMaterialShare(m, n);
    el.classList.remove('is-warn');
    if (min > 0 && raw > 0 && raw < min) {
      el.classList.add('is-warn');
      el.innerHTML = '不能低于已选素材数，失焦后将重置为 <strong>' + min + '</strong> 条。单次上限 ' + DERIVE_LIMIT + ' 条。';
      return;
    }
    if (raw < 1) {
      el.classList.add('is-warn');
      el.textContent = '请输入 ' + (min || 1) + '～' + DERIVE_LIMIT + ' 的整数。单次上限 ' + DERIVE_LIMIT + ' 条。';
      return;
    }
    if (raw > DERIVE_LIMIT) {
      el.classList.add('is-warn');
      el.innerHTML = '单次上限 ' + DERIVE_LIMIT + ' 条，超出将按 <strong>' + DERIVE_LIMIT + '</strong> 条生成。已选 <strong>' + m + '</strong> 条素材，将随机组合模板，预计每条素材均分衍生 <strong>' + share.text + '</strong> 条。';
      return;
    }
    el.innerHTML = '单次上限 ' + DERIVE_LIMIT + ' 条。已选 <strong>' + m + '</strong> 条素材，将随机组合模板，预计每条素材均分衍生 <strong>' + share.text + '</strong> 条。';
  }

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
      insertToken($(wrap.getAttribute('data-target')), btn.getAttribute('data-token') || '', btn.getAttribute('data-repeat') === '1');
    });
  });

  ['cfgNameInput', 'cfgFolderNameInput'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () {
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

  function scrollToCfgAnchor(el) {
    if (!el) return;
    var body = document.querySelector('#configView .cfg-page__body');
    if (!body) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
    body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  /* ---------- pick fields ---------- */
  function poolForKind(kind) {
    return kind === 'materials' ? MATERIAL_POOL : TEMPLATE_POOL;
  }

  function ensureClipGroups() {
    state.cfg.clips = normalizeClipGroups(state.cfg.clips);
  }

  function ensureLayerGroups() {
    state.cfg.layers = normalizeLayerGroups(state.cfg.layers);
    if (state.layerTab == null || state.layerTab < 0 || state.layerTab >= state.cfg.layers.length) {
      state.layerTab = 0;
    }
  }

  function currentLayerGroup() {
    ensureLayerGroups();
    return state.cfg.layers[state.layerTab] || state.cfg.layers[0] || null;
  }

  function nextLayerNameIndex() {
    var max = 0;
    (state.cfg.layers || []).forEach(function (g) {
      var m = String(g.name || '').match(/^图层(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return max + 1;
  }

  function getCfgList(kind) {
    if (kind === 'clips') {
      ensureClipGroups();
      var tab = state.clipTab === 'outro' ? 'outro' : 'intro';
      return state.cfg.clips[tab] || [];
    }
    if (kind === 'layers') {
      var g = currentLayerGroup();
      return (g && g.items) || [];
    }
    return state.cfg[PICK_KINDS[kind].key] || [];
  }

  function setCfgList(kind, list) {
    list = list || [];
    if (kind === 'clips') {
      ensureClipGroups();
      var tab = state.clipTab === 'outro' ? 'outro' : 'intro';
      state.cfg.clips[tab] = list;
    } else if (kind === 'layers') {
      var g = currentLayerGroup();
      if (g) g.items = list;
    } else {
      state.cfg[PICK_KINDS[kind].key] = list;
    }
    if (kind === 'materials') {
      clearError('cfgMaterialItem');
      syncDeriveCountInput(true);
    }
    syncPickField(kind);
    updateFissionHint();
  }

  function pickCardHtml(it, kind) {
    var audio = it.type === '音频';
    var video = it.type === '视频';
    var stageCls = audio ? ' is-audio' : '';
    var stageInner = audio
      ? AUDIO_ICON
      : ('<span class="sel-card__preview" aria-hidden="true"></span>' + (video ? PLAY_ICON : ''));
    var previewLabel = audio ? '音频' : (video ? '播放预览' : '预览');
    return '<div class="sel-card" data-id="' + escapeHtml(it.id) + '">' +
      '<button class="sel-card__stage' + stageCls + '" type="button"' +
        (audio ? '' : ' data-preview="' + escapeHtml(stripExt(it.name)) + '"') +
        ' aria-label="' + previewLabel + '">' + stageInner + '</button>' +
      '<div class="sel-card__name" title="' + escapeHtml(stripExt(it.name)) + '">' + escapeHtml(stripExt(it.name)) + '</div>' +
      '<button class="sel-card__remove" type="button" data-sel-remove="' + escapeHtml(kind) + '" data-id="' + escapeHtml(it.id) + '" aria-label="移除">' + CLEAR_ICON + '</button>' +
    '</div>';
  }

  function syncPickField(kind) {
    var meta = PICK_KINDS[kind];
    var list = getCfgList(kind);
    var grid = $(meta.gridId);
    var count = $(meta.countId);
    var clearBtn = meta.clearId ? $(meta.clearId) : null;
    if (count) count.textContent = '已选 ' + list.length + '/' + SELECT_LIMIT;
    if (grid) grid.innerHTML = list.map(function (it) { return pickCardHtml(it, kind); }).join('');
    if (clearBtn) clearBtn.disabled = !list.length;
  }

  function syncAllPickFields() {
    Object.keys(PICK_KINDS).forEach(syncPickField);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sel-remove]');
    if (!btn) return;
    var kind = btn.getAttribute('data-sel-remove');
    var id = btn.getAttribute('data-id');
    setCfgList(kind, getCfgList(kind).filter(function (it) { return it.id !== id; }));
  });

  [['addMaterialBtn', 'materials'], ['addClipBtn', 'clips'], ['addLayerBtn', 'layers'], ['addAudioBtn', 'audios']].forEach(function (pair) {
    var el = $(pair[0]);
    if (el) el.addEventListener('click', function () { openPicker(pair[1]); });
  });
  [['clearMaterialsBtn', 'materials'], ['clearClipsBtn', 'clips'], ['clearLayersBtn', 'layers'], ['clearAudiosBtn', 'audios']].forEach(function (pair) {
    var el = $(pair[0]);
    if (el) el.addEventListener('click', function () { setCfgList(pair[1], []); });
  });

  function syncClipTabs() {
    document.querySelectorAll('#clipTabs [data-clip-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-clip-tab') === (state.clipTab === 'outro' ? 'outro' : 'intro');
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function readLayerFields() {
    var g = currentLayerGroup();
    if (!g) return;
    var sec = $('layerInsertSec');
    if (sec) g.insertSec = Number(sec.value) || 0;
    var start = $('layerInsertStart');
    if (start) g.insertStart = Number(start.value) || 0;
    var end = $('layerInsertEnd');
    if (end) g.insertEnd = Number(end.value) || 0;
  }

  function syncLayerOrders() {
    (state.cfg.layers || []).forEach(function (g, i) {
      g.order = i + 1;
    });
  }

  function syncLayerInsertFields() {
    var g = currentLayerGroup();
    var mode = (g && g.insertMode) || '开场';
    var simple = $('layerInsertSimple');
    var range = $('layerInsertRange');
    if (mode === '贯穿全场' || mode === '贯穿') {
      if (simple) simple.classList.add('is-hidden');
      if (range) range.classList.add('is-hidden');
    } else if (mode === '自定义') {
      if (simple) simple.classList.add('is-hidden');
      if (range) range.classList.remove('is-hidden');
    } else {
      if (simple) simple.classList.remove('is-hidden');
      if (range) range.classList.add('is-hidden');
    }
  }

  function syncLayerFields() {
    var g = currentLayerGroup();
    if (!g) return;
    var sec = $('layerInsertSec');
    if (sec) sec.value = String(g.insertSec || 0);
    var start = $('layerInsertStart');
    if (start) start.value = String(g.insertStart || 0);
    var end = $('layerInsertEnd');
    if (end) end.value = String(g.insertEnd || 0);
    if (layerInsertApi && layerInsertApi.syncLabel) layerInsertApi.syncLabel(g.insertMode || '开场');
    syncLayerInsertFields();
  }

  function renderLayerTabs() {
    var host = $('layerTabs');
    if (!host) return;
    ensureLayerGroups();
    var layers = state.cfg.layers;
    var canDrag = layers.length > 1;
    var html = layers.map(function (g, i) {
      var active = i === state.layerTab ? ' is-active' : '';
      var close = layers.length > 1
        ? '<button class="cfg-subtabs__close" type="button" draggable="false" data-layer-remove="' + i + '" aria-label="删除' + escapeHtml(g.name) + '">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg></button>'
        : '';
      return '<div class="cfg-subtabs__item' + active + '" role="tab" aria-selected="' + (i === state.layerTab ? 'true' : 'false') + '" data-layer-tab="' + i + '"' +
        (canDrag ? ' draggable="true" title="拖拽调整叠加顺序"' : '') + '>' +
        '<span>' + escapeHtml(g.name) + '</span>' + close +
      '</div>';
    }).join('');
    if (layers.length < LAYER_TAB_MAX) {
      html += '<button class="cfg-subtabs__add" type="button" data-layer-add="1" aria-label="添加图层">' +
        '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2v8M2 6h8"/></svg></button>';
    }
    host.innerHTML = html;
  }

  function addLayerGroup() {
    readLayerFields();
    ensureLayerGroups();
    if (state.cfg.layers.length >= LAYER_TAB_MAX) {
      UI.showToast('最多添加 5 层', 'warning');
      return;
    }
    var idx = nextLayerNameIndex();
    state.cfg.layers.push(makeLayerGroup(idx));
    state.layerTab = state.cfg.layers.length - 1;
    syncLayerOrders();
    renderLayerTabs();
    syncLayerFields();
    syncPickField('layers');
  }

  function removeLayerGroup(idx) {
    ensureLayerGroups();
    if (state.cfg.layers.length <= 1) return;
    readLayerFields();
    state.cfg.layers.splice(idx, 1);
    if (idx < state.layerTab) state.layerTab -= 1;
    if (state.layerTab >= state.cfg.layers.length) state.layerTab = state.cfg.layers.length - 1;
    if (state.layerTab < 0) state.layerTab = 0;
    syncLayerOrders();
    renderLayerTabs();
    syncLayerFields();
    syncPickField('layers');
  }

  var clipTabsEl = $('clipTabs');
  if (clipTabsEl) {
    clipTabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-clip-tab]');
      if (!btn || !clipTabsEl.contains(btn)) return;
      var tab = btn.getAttribute('data-clip-tab');
      if (tab !== 'intro' && tab !== 'outro') return;
      if (state.clipTab === tab) return;
      state.clipTab = tab;
      syncClipTabs();
      syncPickField('clips');
    });
  }

  var layerTabsEl = $('layerTabs');
  if (layerTabsEl) {
    layerTabsEl.addEventListener('click', function (e) {
      var close = e.target.closest('[data-layer-remove]');
      if (close) {
        e.preventDefault();
        e.stopPropagation();
        removeLayerGroup(Number(close.getAttribute('data-layer-remove')));
        return;
      }
      if (e.target.closest('[data-layer-add]')) {
        addLayerGroup();
        return;
      }
      var tab = e.target.closest('[data-layer-tab]');
      if (!tab || !layerTabsEl.contains(tab)) return;
      var idx = Number(tab.getAttribute('data-layer-tab'));
      if (idx === state.layerTab) return;
      readLayerFields();
      state.layerTab = idx;
      renderLayerTabs();
      syncLayerFields();
      syncPickField('layers');
    });

    var layerDragFrom = null;

    function clearLayerDragOver() {
      layerTabsEl.querySelectorAll('.is-drag-over-before, .is-drag-over-after').forEach(function (el) {
        el.classList.remove('is-drag-over-before', 'is-drag-over-after');
      });
    }

    function moveLayerGroup(from, insertAt) {
      ensureLayerGroups();
      var arr = state.cfg.layers;
      if (from < 0 || from >= arr.length) return;
      if (insertAt === from || insertAt === from + 1) return;
      readLayerFields();
      var item = arr.splice(from, 1)[0];
      if (insertAt > from) insertAt -= 1;
      insertAt = Math.max(0, Math.min(insertAt, arr.length));
      arr.splice(insertAt, 0, item);
      state.layerTab = insertAt;
      syncLayerOrders();
      renderLayerTabs();
      syncLayerFields();
      syncPickField('layers');
    }

    layerTabsEl.addEventListener('dragstart', function (e) {
      if (e.target.closest('[data-layer-remove], [data-layer-add]')) {
        e.preventDefault();
        return;
      }
      var tab = e.target.closest('[data-layer-tab]');
      if (!tab || tab.getAttribute('draggable') !== 'true') {
        e.preventDefault();
        return;
      }
      layerDragFrom = Number(tab.getAttribute('data-layer-tab'));
      tab.classList.add('is-dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(layerDragFrom));
      } catch (err) { /* ignore */ }
    });
    layerTabsEl.addEventListener('dragend', function () {
      layerDragFrom = null;
      layerTabsEl.querySelectorAll('.is-dragging').forEach(function (el) {
        el.classList.remove('is-dragging');
      });
      clearLayerDragOver();
    });
    layerTabsEl.addEventListener('dragover', function (e) {
      if (layerDragFrom == null) return;
      var tab = e.target.closest('[data-layer-tab]');
      if (!tab || !layerTabsEl.contains(tab)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var rect = tab.getBoundingClientRect();
      var after = e.clientX > rect.left + rect.width / 2;
      clearLayerDragOver();
      tab.classList.add(after ? 'is-drag-over-after' : 'is-drag-over-before');
    });
    layerTabsEl.addEventListener('drop', function (e) {
      e.preventDefault();
      var tab = e.target.closest('[data-layer-tab]');
      if (!tab || layerDragFrom == null) {
        clearLayerDragOver();
        return;
      }
      var rect = tab.getBoundingClientRect();
      var idx = Number(tab.getAttribute('data-layer-tab'));
      var insertAt = e.clientX > rect.left + rect.width / 2 ? idx + 1 : idx;
      moveLayerGroup(layerDragFrom, insertAt);
      layerDragFrom = null;
      clearLayerDragOver();
    });
  }

  ['layerInsertSec', 'layerInsertStart', 'layerInsertEnd'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', readLayerFields);
  });

  /* ---------- picker drawer ---------- */
  function emptyPickFilter() {
    return { creator: '', tags: [], sizes: [], formats: [], durations: [], source: '', name: '', start: null, end: null };
  }

  var pickDateApi = UI.bindDateRange({
    wrapId: 'pickDateWrap',
    triggerId: 'pickDateTrigger',
    labelId: 'pickDateLabel',
    panelId: 'pickDatePanel',
    shortcutsId: 'pickDateShortcuts',
    calLeftId: 'pickDateCalLeft',
    calRightId: 'pickDateCalRight',
    prefix: '上传时间：',
    defaultShortcut: 'last7',
    onChange: function (start, end) {
      state.picker.dateCleared = false;
      state.picker.draft.start = start;
      state.picker.draft.end = end;
      var wrap = $('pickDateWrap');
      if (wrap) wrap.classList.add('has-value');
    }
  });

  function pickLast7Range() {
    var end = new Date();
    end.setHours(0, 0, 0, 0);
    var start = new Date(end);
    start.setDate(start.getDate() - 6);
    return [start, end];
  }

  function clearPickDateFilter() {
    state.picker.dateCleared = true;
    state.picker.draft.start = null;
    state.picker.draft.end = null;
    var wrap = $('pickDateWrap');
    var label = $('pickDateLabel');
    if (label) label.innerHTML = '上传时间：<span class="muted">请选择</span>';
    if (wrap) wrap.classList.remove('has-value');
    if (UI.closePanels) UI.closePanels();
  }

  var pickDateClear = $('pickDateClear');
  if (pickDateClear) {
    pickDateClear.addEventListener('click', function (e) {
      e.stopPropagation();
      clearPickDateFilter();
    });
  }

  bindSearchSelect({
    wrapId: 'pickCreatorWrap',
    triggerId: 'pickCreatorTrigger',
    panelId: 'pickCreatorPanel',
    labelId: 'pickCreatorLabel',
    listId: 'pickCreatorList',
    searchId: 'pickCreatorSearch',
    clearId: 'pickCreatorClear',
    prefix: '创意人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.picker.draft.creator; },
    onChange: function (v) { state.picker.draft.creator = v; }
  });

  var pickTagSelect = bindCascadeMultiSelect({
    wrapId: 'pickTagWrap',
    triggerId: 'pickTagTrigger',
    panelId: 'pickTagPanel',
    labelId: 'pickTagLabel',
    groupListId: 'pickTagGroupList',
    childListId: 'pickTagChildList',
    selectedId: 'pickTagSelected',
    searchId: 'pickTagSearch',
    countId: 'pickTagCount',
    selectAllId: 'pickTagSelectAll',
    clearAllId: 'pickTagClearAll',
    clearId: 'pickTagClear',
    prefix: '标签：',
    placeholder: '请选择',
    tree: TAG_TREE,
    frozenLeaves: [],
    getSelected: function () { return state.picker.draft.tags || []; },
    setSelected: function (arr) { state.picker.draft.tags = arr || []; }
  });

  var pickSizeSelect = bindCascadeMultiSelect({
    wrapId: 'pickSizeWrap',
    triggerId: 'pickSizeTrigger',
    panelId: 'pickSizePanel',
    labelId: 'pickSizeLabel',
    groupListId: 'pickSizeGroupList',
    childListId: 'pickSizeChildList',
    selectedId: 'pickSizeSelected',
    searchId: 'pickSizeSearch',
    countId: 'pickSizeCount',
    selectAllId: 'pickSizeSelectAll',
    clearAllId: 'pickSizeClearAll',
    clearId: 'pickSizeClear',
    prefix: '尺寸：',
    placeholder: '请选择',
    tree: SIZE_FILTER_TREE,
    frozenLeaves: [],
    getSelected: function () { return state.picker.draft.sizes || []; },
    setSelected: function (arr) { state.picker.draft.sizes = arr || []; }
  });

  var pickFormatSelect = bindCascadeMultiSelect({
    wrapId: 'pickFormatWrap',
    triggerId: 'pickFormatTrigger',
    panelId: 'pickFormatPanel',
    labelId: 'pickFormatLabel',
    groupListId: 'pickFormatGroupList',
    childListId: 'pickFormatChildList',
    selectedId: 'pickFormatSelected',
    searchId: 'pickFormatSearch',
    countId: 'pickFormatCount',
    selectAllId: 'pickFormatSelectAll',
    clearAllId: 'pickFormatClearAll',
    clearId: 'pickFormatClear',
    prefix: '格式：',
    placeholder: '请选择',
    tree: FORMAT_FILTER_TREE,
    frozenLeaves: [],
    getSelected: function () { return state.picker.draft.formats || []; },
    setSelected: function (arr) { state.picker.draft.formats = arr || []; }
  });

  var pickDurationSelect = UI.bindMultiSelect({
    wrapId: 'pickDurationWrap',
    triggerId: 'pickDurationTrigger',
    panelId: 'pickDurationPanel',
    labelId: 'pickDurationLabel',
    listId: 'pickDurationList',
    clearId: 'pickDurationClear',
    prefix: '时长：',
    getOptions: function () { return DURATION_OPTIONS; },
    getSelected: function () { return state.picker.draft.durations || []; },
    setSelected: function (arr) { state.picker.draft.durations = arr || []; }
  });

  UI.bindSingleSelect({
    wrapId: 'pickSourceWrap',
    triggerId: 'pickSourceTrigger',
    panelId: 'pickSourcePanel',
    labelId: 'pickSourceLabel',
    clearId: 'pickSourceClear',
    prefix: '来源：',
    getValue: function () { return state.picker.draft.source || ''; },
    onChange: function (v) { state.picker.draft.source = v || ''; }
  });

  function syncPickNameClear() {
    var wrap = $('pickNameWrap');
    var input = $('pickNameInput');
    if (wrap && input) wrap.classList.toggle('has-value', !!(input.value || '').trim());
  }

  var pickNameInput = $('pickNameInput');
  if (pickNameInput) {
    pickNameInput.addEventListener('input', function () {
      state.picker.draft.name = pickNameInput.value || '';
      syncPickNameClear();
    });
  }
  var pickNameClear = $('pickNameClear');
  if (pickNameClear) {
    pickNameClear.addEventListener('click', function (e) {
      e.stopPropagation();
      if (pickNameInput) pickNameInput.value = '';
      state.picker.draft.name = '';
      syncPickNameClear();
    });
  }

  function pickerRoots() {
    return state.picker.kind === 'materials' ? PICK_MATERIAL_FOLDERS : TPL_FOLDERS;
  }

  function pickerCustomRoots() {
    return state.picker.kind === 'materials' ? CUSTOM_FOLDERS : TPL_CUSTOM;
  }

  function pickerSystemId() {
    return state.picker.kind === 'materials' ? SYSTEM_FOLDER.id : TPL_SYSTEM.id;
  }

  function pickerFolderPath(id) {
    if (state.picker.kind === 'materials') return getLocalFolderPath(id);
    return getTreePath(id, TPL_CUSTOM, TPL_SYSTEM);
  }

  function getPickerPool() {
    var kind = state.picker.kind;
    var meta = PICK_KINDS[kind];
    var pool = poolForKind(kind);
    if (kind === 'materials') {
      var type = isImageType() ? '图片' : '视频';
      pool = pool.filter(function (it) { return it.type === type; });
    }
    if (meta.category) {
      return pool.filter(function (it) { return it.category === meta.category; });
    }
    return pool;
  }

  function findPickerFolderNode(id) {
    if (!id) return null;
    if (id === SYSTEM_FOLDER.id) return SYSTEM_FOLDER;
    if (id === TPL_SYSTEM.id) return TPL_SYSTEM;
    return findInTree(id, pickerRoots()) || findInTree(id, pickerCustomRoots());
  }

  function folderFilterIds() {
    var fid = state.picker.folderId || pickerSystemId();
    var node = findPickerFolderNode(fid);
    if (!node || node.system) {
      if (state.picker.showSub) return null;
      return [fid];
    }
    if (state.picker.showSub) return collectDescendantIds(node);
    return [node.id];
  }

  function getPickerChildFolders() {
    if (state.picker.showSub) return [];
    var fid = state.picker.folderId || pickerSystemId();
    if (fid === pickerSystemId()) return pickerCustomRoots().slice();
    var node = findPickerFolderNode(fid);
    return (node && node.children) ? node.children.slice() : [];
  }

  function countPoolInFolder(folderId) {
    var pool = getPickerPool();
    var node = findPickerFolderNode(folderId);
    var ids = node ? collectDescendantIds(node) : [folderId];
    var set = {};
    ids.forEach(function (id) { set[id] = true; });
    return pool.filter(function (it) { return set[it.folderId]; }).length;
  }

  function folderCountBadgeHtml(folderId) {
    var n = countPoolInFolder(folderId);
    var text = n > 99 ? '99+' : String(n);
    return '<span class="folder-count-badge" title="素材数：' + n + '">' + escapeHtml(text) + '</span>';
  }

  function getPickerFiltered() {
    var f = state.picker.applied || emptyPickFilter();
    var ids = folderFilterIds();
    var kw = (f.name || '').trim().toLowerCase();
    return getPickerPool().filter(function (it) {
      if (ids && ids.indexOf(it.folderId) === -1) return false;
      if (f.creator && it.creator !== f.creator) return false;
      if (kw && stripExt(it.name).toLowerCase().indexOf(kw) === -1) return false;
      if (f.tags && f.tags.length) {
        var tags = it.tags || [];
        var hit = f.tags.some(function (t) { return tags.indexOf(t) !== -1; });
        if (!hit) return false;
      }
      if (f.sizes && f.sizes.length && f.sizes.indexOf(it.size) === -1) return false;
      if (f.formats && f.formats.length) {
        var fmt = String(it.format || '').toLowerCase();
        if (!f.formats.some(function (x) { return String(x).toLowerCase() === fmt; })) return false;
      }
      if (!matchDurationBuckets(it.durationSec, f.durations)) return false;
      if (f.source && (it.source || sourceForFolder(it.folderId)) !== f.source) return false;
      if (!inDateRange(it, f.start, f.end)) return false;
      return true;
    });
  }

  function getPickerEntries() {
    var folders = getPickerChildFolders();
    var materials = getPickerFiltered();
    return folders.map(function (folder) {
      return { kind: 'folder', folder: folder };
    }).concat(materials.map(function (row) {
      return { kind: 'material', row: row };
    }));
  }

  function getPickerPageRows() {
    var entries = getPickerEntries();
    var total = entries.length;
    var totalPages = Math.max(1, Math.ceil(total / state.picker.pageSize) || 1);
    if (state.picker.page > totalPages) state.picker.page = totalPages;
    var start = (state.picker.page - 1) * state.picker.pageSize;
    return { entries: entries, total: total, pageRows: entries.slice(start, start + state.picker.pageSize) };
  }

  function pageMaterialRows(pageRows) {
    return (pageRows || []).filter(function (entry) {
      return entry && entry.kind === 'material' && entry.row;
    }).map(function (entry) { return entry.row; });
  }

  function pickTagsHtml(it) {
    var tags = (it.tags || []).slice(0, 3);
    if (!tags.length) return '';
    return '<div class="tag-list">' + tags.map(function (t) {
      return '<span class="mat-tag">' + escapeHtml(t) + '</span>';
    }).join('') + '</div>';
  }

  function pickXmpHtml(it) {
    if (state.picker.kind !== 'materials') return '—';
    var n = Number(String(it.id).replace(/\D/g, '')) || 0;
    var yes = n % 4 !== 3;
    return '<span class="tag tag--' + (yes ? 'enabled' : 'disabled') + '">' + (yes ? '是' : '否') + '</span>';
  }

  function openPickerFolder(fid) {
    if (!fid) return;
    state.picker.folderId = fid;
    state.picker.page = 1;
    renderPicker();
  }

  function pickerFolderCardHtml(folder) {
    return '<div class="grid-card grid-card--folder" data-folder-id="' + escapeHtml(folder.id) + '">' +
      '<div class="grid-card__stage">' +
        '<button class="grid-card__thumb grid-card__thumb--folder" type="button"' +
          ' data-folder-open="' + escapeHtml(folder.id) + '" title="进入文件夹" aria-label="进入文件夹">' +
          '<span class="grid-card__folder-wrap">' +
            '<img class="grid-card__folder-icon" src="assets/文件夹.png" width="64" height="64" alt="" />' +
            folderCountBadgeHtml(folder.id) +
          '</span>' +
        '</button>' +
      '</div>' +
      '<div class="grid-card__body">' +
        '<div class="grid-card__title-row">' +
          '<span class="grid-card__name" title="' + escapeHtml(folder.name) + '">' + escapeHtml(folder.name) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function pickerMaterialCardHtml(it, draft) {
    var checked = draft.indexOf(it.id) !== -1 ? ' checked' : '';
    var audio = it.type === '音频';
    var play = it.type === '视频' ? PLAY_ICON : '';
    var sizeText = it.size && it.size !== '—' ? it.size : (it.format || '—');
    var durationText = (it.type === '视频' || it.type === '音频') ? formatDuration(it.durationSec || 0) : '';
    var thumbInner = audio
      ? ('<span class="grid-card__preview grid-card__preview--audio" aria-hidden="true">' + AUDIO_ICON + '</span>')
      : ('<span class="grid-card__preview" aria-hidden="true"></span>' + play);
    return '<div class="grid-card" data-id="' + escapeHtml(it.id) + '">' +
      '<span class="grid-card__check cell-check">' +
        '<input type="checkbox" data-pick-id="' + escapeHtml(it.id) + '"' + checked + ' aria-label="选择" />' +
      '</span>' +
      '<div class="grid-card__stage">' +
        '<button class="grid-card__thumb' + (audio ? ' grid-card__thumb--audio' : '') + '" type="button"' +
          (audio ? '' : ' data-preview="' + escapeHtml(stripExt(it.name)) + '"') +
          ' aria-label="' + (audio ? '音频' : (it.type === '视频' ? '播放预览' : '预览')) + '">' + thumbInner + '</button>' +
        '<div class="grid-card__meta-bar" aria-hidden="true">' +
          '<span class="grid-card__meta-size">' + escapeHtml(sizeText) + '</span>' +
          (durationText ? '<span class="grid-card__meta-duration">' + escapeHtml(durationText) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="grid-card__body">' +
        '<div class="grid-card__name-wrap">' +
          '<span class="grid-card__name" title="' + escapeHtml(stripExt(it.name)) + '">' + escapeHtml(stripExt(it.name)) + '</span>' +
        '</div>' +
        '<div class="grid-card__tags tag-cell">' + pickTagsHtml(it) + '</div>' +
      '</div>' +
    '</div>';
  }

  function pickerFolderRowHtml(folder) {
    var ph = '-';
    return '<tr class="is-folder-row" data-folder-id="' + escapeHtml(folder.id) + '" title="进入文件夹">' +
      '<td class="col-check is-freeze"><span class="cell-check"><input type="checkbox" disabled aria-label="文件夹不可选" /></span></td>' +
      '<td class="col-id is-freeze">' + ph + '</td>' +
      '<td class="col-material is-freeze"><div class="folder-cell">' +
        '<span class="folder-cell__media">' +
          '<img class="folder-cell__icon" src="assets/文件夹.png" width="40" height="40" alt="" />' +
          folderCountBadgeHtml(folder.id) +
        '</span>' +
        '<div class="folder-cell__meta">' +
          '<span class="folder-cell__name" title="' + escapeHtml(folder.name) + '">' + escapeHtml(folder.name) + '</span>' +
        '</div>' +
      '</div></td>' +
      '<td>' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td class="col-duration">' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td>' + ph + '</td>' +
      '<td class="col-uploaded">' + ph + '</td>' +
    '</tr>';
  }

  function pickerMaterialRowHtml(it, draft) {
    var checked = draft.indexOf(it.id) !== -1 ? ' checked' : '';
    var isAudio = it.type === '音频';
    var playIcon = it.type === '视频' ? PLAY_ICON : '';
    var durationText = (it.type === '视频' || isAudio) ? String(it.durationSec || 0) : '—';
    var nameNoExt = stripExt(it.name);
    var thumbInner = isAudio
      ? AUDIO_ICON
      : ('<span class="thumb__preview" aria-hidden="true"></span>' + playIcon);
    return '<tr data-id="' + escapeHtml(it.id) + '">' +
      '<td class="col-check is-freeze"><span class="cell-check"><input type="checkbox" data-pick-id="' + escapeHtml(it.id) + '"' + checked + ' aria-label="选择" /></span></td>' +
      '<td class="col-id is-freeze">' + escapeHtml(it.id) + '</td>' +
      '<td class="col-material is-freeze"><div class="material-cell">' +
        '<button class="thumb' + (isAudio ? ' thumb--audio' : '') + '" type="button"' +
          (isAudio ? '' : ' data-preview="' + escapeHtml(nameNoExt) + '"') +
          ' aria-label="' + (isAudio ? '音频' : '打开素材') + '">' +
          thumbInner +
        '</button>' +
        '<div class="material-cell__meta">' +
          '<div class="material-cell__name-wrap">' +
            '<span class="material-cell__name" title="' + escapeHtml(nameNoExt) + '">' + escapeHtml(nameNoExt) + '</span>' +
          '</div>' +
        '</div>' +
      '</div></td>' +
      '<td class="col-tags"><div class="tag-cell">' + pickTagsHtml(it) + '</div></td>' +
      '<td>' + escapeHtml(it.creator || '—') + '</td>' +
      '<td>' + escapeHtml(it.type || '—') + '</td>' +
      '<td>' + escapeHtml(it.format || '—') + '</td>' +
      '<td>' + escapeHtml(it.size && it.size !== '—' ? it.size : '—') + '</td>' +
      '<td class="col-duration">' + escapeHtml(durationText) + '</td>' +
      '<td>' + escapeHtml(it.source || sourceForFolder(it.folderId) || '—') + '</td>' +
      '<td>' + pickXmpHtml(it) + '</td>' +
      '<td class="col-uploaded">' + escapeHtml(it.createdAt || '—') + '</td>' +
    '</tr>';
  }

  function renderPickerTree() {
    var root = $('pickFolderTree');
    if (!root) return;
    var kw = (state.picker.folderKw || '').trim().toLowerCase();
    var collapsed = state.picker.collapsed;
    var activeId = state.picker.folderId || pickerSystemId();
    var system = pickerRoots()[0];

    function nodeMatches(node) {
      if (!kw) return true;
      if ((node.name || '').toLowerCase().indexOf(kw) !== -1) return true;
      return (node.children || []).some(nodeMatches);
    }

    function renderNode(node, depth) {
      if (kw && !nodeMatches(node)) return '';
      var hasChild = !!(node.children && node.children.length);
      var isCollapsed = !!collapsed[node.id] && !kw;
      var active = node.id === activeId ? ' is-active' : '';
      var collapsedCls = isCollapsed ? ' is-collapsed' : '';
      var systemCls = node.system ? ' is-system' : '';
      var toggleCls = hasChild ? '' : ' is-leaf';
      return '<div class="tree-node' + collapsedCls + systemCls + '" data-id="' + escapeHtml(node.id) + '">' +
        '<div class="tree-node__row' + active + '" data-pick-folder="' + escapeHtml(node.id) + '" data-depth="' + depth + '"' +
          ' style="padding-left:' + (8 + depth * 20) + 'px">' +
          '<button class="tree-node__toggle' + toggleCls + '" type="button" data-pick-toggle="' + escapeHtml(node.id) + '" aria-label="展开">' +
            TOGGLE_SVG +
          '</button>' +
          FOLDER_ICON +
          '<span class="tree-node__name" title="' + escapeHtml(node.name) + '">' + escapeHtml(node.name) + '</span>' +
        '</div>' +
        (hasChild ? '<div class="tree-node__children">' + (node.children || []).map(function (c) {
          return renderNode(c, depth + 1);
        }).join('') + '</div>' : '') +
      '</div>';
    }

    var customHtml = pickerCustomRoots().map(function (n) { return renderNode(n, 0); }).join('');
    root.innerHTML =
      renderNode(system, 0) +
      '<div class="tree-section-label">自定义文件夹</div>' +
      (customHtml || '<div class="tree-empty">暂无自定义文件夹</div>');
  }

  function syncPickCount() {
    var count = $('pickCount');
    if (count) count.textContent = '已选：' + state.picker.draftIds.length + ' / ' + SELECT_LIMIT;
  }

  function syncPickCheckAll(pageRows) {
    var disabled = !state.picker.showSub;
    var ids = disabled ? [] : pageMaterialRows(pageRows).map(function (it) { return it.id; });
    var draft = state.picker.draftIds;
    var all = ids.length > 0 && ids.every(function (id) { return draft.indexOf(id) !== -1; });
    var some = !all && ids.some(function (id) { return draft.indexOf(id) !== -1; });
    ['pickCheckAll', 'pickListCheckAll'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.disabled = disabled;
      if (disabled) {
        el.checked = false;
        el.indeterminate = false;
        return;
      }
      el.checked = all;
      el.indeterminate = some;
    });
    var label = $('pickCheckAllLabel');
    if (label) label.classList.toggle('is-disabled', disabled);
  }

  function renderPickerList(pageRows, draft) {
    var body = $('pickListBody');
    var listView = $('pickListView');
    if (!body) return;
    body.innerHTML = (pageRows || []).map(function (entry) {
      if (entry.kind === 'folder') return pickerFolderRowHtml(entry.folder);
      return pickerMaterialRowHtml(entry.row, draft);
    }).join('');
    if (listView) listView.hidden = state.picker.view !== 'list';
    layoutPickListTable();
  }

  function layoutPickListTable() {
    var table = $('pickListTable');
    var listView = $('pickListView');
    if (!table || !listView || listView.hidden || !window.ColResize || !window.ColResize.enable) return;
    window.ColResize.enable(table, { force: true });
  }

  function syncPickView() {
    var grid = $('pickGrid');
    var listView = $('pickListView');
    var isList = state.picker.view === 'list';
    if (grid) grid.hidden = isList;
    if (listView) listView.hidden = !isList;
    var listBtn = $('pickViewListBtn');
    var gridBtn = $('pickViewGridBtn');
    if (listBtn) listBtn.classList.toggle('is-active', isList);
    if (gridBtn) gridBtn.classList.toggle('is-active', !isList);
    var checkLabel = $('pickCheckAllLabel');
    if (checkLabel) checkLabel.hidden = isList;
    if (isList) {
      requestAnimationFrame(layoutPickListTable);
    }
  }

  function renderPickerGrid() {
    var pack = getPickerPageRows();
    var pageRows = pack.pageRows;
    var grid = $('pickGrid');
    var empty = $('pickEmpty');
    var draft = state.picker.draftIds;
    if (!grid) return;
    if (!pageRows.length) {
      grid.innerHTML = '';
      renderPickerList([], draft);
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      grid.innerHTML = pageRows.map(function (entry) {
        if (entry.kind === 'folder') return pickerFolderCardHtml(entry.folder);
        return pickerMaterialCardHtml(entry.row, draft);
      }).join('');
      renderPickerList(pageRows, draft);
    }
    syncPickView();
    syncPickCount();
    syncPickCheckAll(pageRows);
    UI.renderPagination({
      containerId: 'pickPagination',
      total: pack.total,
      page: state.picker.page,
      pageSize: state.picker.pageSize
    });
    if (!state.picker.paginationBound) {
      state.picker.paginationBound = true;
      UI.bindPagination({
        containerId: 'pickPagination',
        getPage: function () { return state.picker.page; },
        getPageSize: function () { return state.picker.pageSize; },
        getTotal: function () { return getPickerEntries().length; },
        onPageChange: function (p) { state.picker.page = p; renderPickerGrid(); },
        onPageSizeChange: function (s) { state.picker.pageSize = s; state.picker.page = 1; renderPickerGrid(); }
      });
    }
  }

  function renderPicker() {
    var crumb = $('pickBreadcrumb');
    if (crumb) crumb.textContent = pickerFolderPath(state.picker.folderId || pickerSystemId()) || PICK_KINDS[state.picker.kind].allLabel;
    renderPickerTree();
    renderPickerGrid();
  }

  function syncPickFilterVisibility() {
    var isMaterial = state.picker.kind === 'materials';
    var image = isMaterial && isImageType();
    var tagWrap = $('pickTagWrap');
    if (tagWrap) tagWrap.classList.toggle('is-hidden', !isMaterial);
    var durationWrap = $('pickDurationWrap');
    if (durationWrap) durationWrap.classList.toggle('is-hidden', image);
    var nameInput = $('pickNameInput');
    if (nameInput) nameInput.placeholder = isMaterial ? '素材名称' : '模板名称';
    var showSubLabel = $('pickShowSubLabel');
    if (showSubLabel) showSubLabel.textContent = isMaterial ? '显示子文件夹素材' : '显示子文件夹模板';
  }

  function resetPickFiltersUi() {
    state.picker.draft = emptyPickFilter();
    state.picker.applied = emptyPickFilter();
    state.picker.dateCleared = false;
    if (pickDateApi && pickDateApi.setRange) {
      var last7 = pickLast7Range();
      pickDateApi.setRange(last7[0], last7[1], 'last7', true);
    }
    var dateWrap = $('pickDateWrap');
    if (dateWrap) dateWrap.classList.add('has-value');
    if (pickDateApi && pickDateApi.getStart && pickDateApi.getEnd) {
      state.picker.draft.start = pickDateApi.getStart();
      state.picker.draft.end = pickDateApi.getEnd();
      state.picker.applied.start = pickDateApi.getStart();
      state.picker.applied.end = pickDateApi.getEnd();
    }
    if (pickNameInput) pickNameInput.value = '';
    syncPickNameClear();
    if (pickTagSelect && pickTagSelect.render) pickTagSelect.render();
    if (pickSizeSelect && pickSizeSelect.render) pickSizeSelect.render();
    if (pickFormatSelect && pickFormatSelect.render) pickFormatSelect.render();
    if (pickDurationSelect && pickDurationSelect.render) pickDurationSelect.render();
    var creatorLabel = $('pickCreatorLabel');
    if (creatorLabel) creatorLabel.innerHTML = '创意人：<span class="muted">请选择</span>';
    var creatorWrap = $('pickCreatorWrap');
    if (creatorWrap) creatorWrap.classList.remove('has-value');
    var sourceLabel = $('pickSourceLabel');
    if (sourceLabel) sourceLabel.innerHTML = '来源：<span class="muted">请选择</span>';
    var sourceWrap = $('pickSourceWrap');
    if (sourceWrap) sourceWrap.classList.remove('has-value');
    var durationWrap = $('pickDurationWrap');
    if (durationWrap) durationWrap.classList.remove('has-value');
    var showSub = $('pickShowSub');
    if (showSub) showSub.checked = false;
    state.picker.showSub = false;
    var folderKw = $('pickFolderKw');
    if (folderKw) folderKw.value = '';
    state.picker.folderKw = '';
  }

  function openPicker(kind) {
    var meta = PICK_KINDS[kind];
    state.picker.kind = kind;
    state.picker.folderId = pickerSystemId();
    state.picker.page = 1;
    state.picker.pageSize = state.picker.pageSize || 50;
    state.picker.view = 'list';
    state.picker.draftIds = getCfgList(kind).map(function (it) { return it.id; });
    state.picker.collapsed = {};
    walkFolders(pickerCustomRoots(), '', function (node) {
      if (node.children && node.children.length) state.picker.collapsed[node.id] = true;
    });
    var title = $('pickTitle');
    if (title) {
      if (kind === 'clips') {
        title.textContent = state.clipTab === 'outro' ? '选择片尾' : '选择片头';
      } else if (kind === 'layers') {
        var g = currentLayerGroup();
        title.textContent = '选择' + ((g && g.name) || '图层');
      } else {
        title.textContent = meta.title;
      }
    }
    resetPickFiltersUi();
    syncPickFilterVisibility();
    renderPicker();
    UI.openDrawer('pickDrawer');
    requestAnimationFrame(layoutPickListTable);
  }

  function closePicker() {
    UI.closeDrawer('pickDrawer');
  }

  function commitPicker() {
    var kind = state.picker.kind;
    var pool = getPickerPool();
    var selected = [];
    state.picker.draftIds.forEach(function (id) {
      var it = itemById(id, pool);
      if (it) selected.push(snapshotItems([it])[0]);
    });
    setCfgList(kind, selected);
    closePicker();
  }

  function togglePickId(id, checked, input) {
    var draft = state.picker.draftIds;
    if (checked) {
      if (draft.indexOf(id) !== -1) return;
      if (draft.length >= SELECT_LIMIT) {
        if (input) input.checked = false;
        UI.showToast('最多选择 ' + SELECT_LIMIT + ' 条', 'warning');
        return;
      }
      draft.push(id);
    } else {
      state.picker.draftIds = draft.filter(function (x) { return x !== id; });
    }
    syncPickCount();
    syncPickCheckAll(getPickerPageRows().pageRows);
  }

  var pickGridEl = $('pickGrid');
  if (pickGridEl) {
    pickGridEl.addEventListener('change', function (e) {
      var input = e.target.closest('[data-pick-id]');
      if (!input) return;
      togglePickId(input.getAttribute('data-pick-id'), input.checked, input);
    });
    pickGridEl.addEventListener('click', function (e) {
      var folderCard = e.target.closest('.grid-card--folder');
      if (folderCard) {
        openPickerFolder(folderCard.getAttribute('data-folder-id'));
        return;
      }
      if (e.target.closest('[data-pick-id]')) return;
      if (e.target.closest('[data-preview]')) return;
      var card = e.target.closest('.grid-card');
      if (!card) return;
      var input = card.querySelector('[data-pick-id]');
      if (!input) return;
      input.checked = !input.checked;
      togglePickId(input.getAttribute('data-pick-id'), input.checked, input);
    });
  }

  var pickTreeEl = $('pickFolderTree');
  if (pickTreeEl) {
    pickTreeEl.addEventListener('click', function (e) {
      var toggleBtn = e.target.closest('[data-pick-toggle]');
      if (toggleBtn && !toggleBtn.classList.contains('is-leaf')) {
        e.stopPropagation();
        var tid = toggleBtn.getAttribute('data-pick-toggle');
        state.picker.collapsed[tid] = !state.picker.collapsed[tid];
        renderPickerTree();
        return;
      }
      var row = e.target.closest('[data-pick-folder]');
      if (!row) return;
      state.picker.folderId = row.getAttribute('data-pick-folder') || pickerSystemId();
      state.picker.page = 1;
      renderPicker();
    });
  }

  var pickFolderKw = $('pickFolderKw');
  if (pickFolderKw) {
    pickFolderKw.addEventListener('input', function () {
      state.picker.folderKw = pickFolderKw.value || '';
      renderPickerTree();
    });
  }

  var pickQueryBtn = $('pickQueryBtn');
  if (pickQueryBtn) {
    pickQueryBtn.addEventListener('click', function () {
      state.picker.applied = {
        creator: state.picker.draft.creator || '',
        tags: (state.picker.draft.tags || []).slice(),
        sizes: (state.picker.draft.sizes || []).slice(),
        formats: (state.picker.draft.formats || []).slice(),
        durations: (state.picker.draft.durations || []).slice(),
        source: state.picker.draft.source || '',
        name: (pickNameInput && pickNameInput.value ? pickNameInput.value : '').trim(),
        start: (!state.picker.dateCleared && pickDateApi) ? pickDateApi.getStart() : null,
        end: (!state.picker.dateCleared && pickDateApi) ? pickDateApi.getEnd() : null
      };
      state.picker.page = 1;
      renderPickerGrid();
    });
  }

  function applyPickCheckAll(on) {
    if (!state.picker.showSub) return;
    var mats = pageMaterialRows(getPickerPageRows().pageRows);
    var draft = state.picker.draftIds;
    if (on) {
      var i;
      for (i = 0; i < mats.length; i++) {
        if (draft.indexOf(mats[i].id) !== -1) continue;
        if (draft.length >= SELECT_LIMIT) {
          UI.showToast('最多选择 ' + SELECT_LIMIT + ' 条', 'warning');
          break;
        }
        draft.push(mats[i].id);
      }
    } else {
      var pageIds = {};
      mats.forEach(function (it) { pageIds[it.id] = true; });
      state.picker.draftIds = draft.filter(function (id) { return !pageIds[id]; });
    }
    renderPickerGrid();
  }

  ['pickCheckAll', 'pickListCheckAll'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('change', function () {
      if (el.disabled) return;
      applyPickCheckAll(el.checked);
    });
  });

  var pickShowSub = $('pickShowSub');
  if (pickShowSub) {
    pickShowSub.addEventListener('change', function () {
      state.picker.showSub = !!pickShowSub.checked;
      state.picker.page = 1;
      renderPickerGrid();
    });
  }

  var pickOkBtn = $('pickOkBtn');
  if (pickOkBtn) pickOkBtn.addEventListener('click', commitPicker);
  ['pickCancelBtn', 'pickDrawerClose'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('click', closePicker);
  });

  ['pickViewListBtn', 'pickViewGridBtn'].forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('click', function () {
      state.picker.view = el.getAttribute('data-view') || 'grid';
      syncPickView();
    });
  });

  var pickListBody = $('pickListBody');
  if (pickListBody) {
    pickListBody.addEventListener('change', function (e) {
      var input = e.target.closest('[data-pick-id]');
      if (!input) return;
      togglePickId(input.getAttribute('data-pick-id'), input.checked, input);
    });
    pickListBody.addEventListener('click', function (e) {
      if (e.target.closest('[data-pick-id]') || e.target.closest('[data-preview]')) return;
      var row = e.target.closest('tr.is-folder-row');
      if (!row) return;
      openPickerFolder(row.getAttribute('data-folder-id'));
    });
    pickListBody.addEventListener('mouseover', function (e) {
      var btn = e.target.closest('[data-preview]');
      if (!btn) return;
      showPreview(btn);
    });
    pickListBody.addEventListener('mouseout', function (e) {
      if (e.target.closest('[data-preview]')) hidePreview();
    });
  }

  var previewPop = $('previewPop');
  function showPreview(anchor) {
    if (!previewPop || !anchor) return;
    var rect = anchor.getBoundingClientRect();
    var popW = 280;
    var popH = 480;
    var left = rect.right + 12;
    var top = rect.top;
    if (left + popW > window.innerWidth - 16) left = rect.left - popW - 12;
    if (top + popH > window.innerHeight - 16) top = window.innerHeight - popH - 16;
    if (top < 16) top = 16;
    if (left < 16) left = 16;
    previewPop.style.left = left + 'px';
    previewPop.style.top = top + 'px';
    previewPop.classList.add('is-open');
    previewPop.setAttribute('aria-hidden', 'false');
  }
  function hidePreview() {
    if (!previewPop) return;
    previewPop.classList.remove('is-open');
    previewPop.setAttribute('aria-hidden', 'true');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-preview]');
    if (!btn) {
      hidePreview();
      return;
    }
    if (btn.closest('#pickListBody')) return;
    e.stopPropagation();
    if (previewPop && previewPop.classList.contains('is-open')) hidePreview();
    else showPreview(btn);
  });

  /* ---------- fill / validate / submit ---------- */
  function fillConfigForm(cfg) {
    state.cfg = Object.assign(defaultConfig(), cfg || {});
    state.cfg.tags = (state.cfg.tags || []).filter(function (t) { return t !== SYSTEM_TAG; });
    ['materials', 'audios'].forEach(function (k) {
      if (!Array.isArray(state.cfg[k])) state.cfg[k] = [];
    });
    state.cfg.clips = normalizeClipGroups(state.cfg.clips);
    state.cfg.layers = normalizeLayerGroups(state.cfg.layers);
    state.cfg.materialType = state.cfg.materialType === '图片' ? '图片' : '视频';
    if (state.cfg.materialType === '图片') state.cfg.trim = false;
    state.clipTab = 'intro';
    state.layerTab = 0;
    state.sizeGroup = state.cfg.sizeGroup || '竖版(9:16)';
    $('cfgNameInput').value = state.cfg.nameTpl || DEFAULT_NAME;
    var folderNameInput = $('cfgFolderNameInput');
    if (folderNameInput) folderNameInput.value = state.cfg.folderName || DEFAULT_FOLDER_NAME;
    $('cfgTrimSec').value = state.cfg.trimSec;
    $('cfgTrimStart').value = state.cfg.trimStart;
    $('cfgTrimEnd').value = state.cfg.trimEnd;
    $('cfgFixedCount').value = state.cfg.fixedCount || 10;
    state.cfg.countMode = 'fixed';
    syncDeriveCountInput(true);

    ['cfgMd5Switch', 'cfgSizeSwitch', 'cfgTrimSwitch', 'cfgDupSwitch'].forEach(function (id) {
      var key = id === 'cfgMd5Switch' ? 'md5' : id === 'cfgSizeSwitch' ? 'resize' : id === 'cfgTrimSwitch' ? 'trim' : 'filterDup';
      var el = $(id);
      var on = !!state.cfg[key];
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    UI.setSegValue('cfgFolderInheritSeg', state.cfg.folderMode || 'inherit');
    UI.setSegValue('cfgCreativeInheritSeg', state.cfg.creativeMode || 'inherit');
    UI.setSegValue('cfgTagInheritSeg', state.cfg.tagMode || 'inherit');
    UI.setSegValue('cfgXmpSeg', state.cfg.uploadXmp || '是');
    UI.setSegValue('cfgXmpFolderSeg', state.cfg.xmpFolderMode || '已有文件夹');
    $('cfgSizeWrap').classList.toggle('is-hidden', !state.cfg.resize);
    syncSizeLabel();
    syncMaterialTypeUi();
    syncTrimFields();
    syncInheritExtras();
    syncXmpBlock();
    syncClipTabs();
    renderLayerTabs();
    syncLayerFields();
    syncAllPickFields();
    if (cfgLocalFolderApi) cfgLocalFolderApi.syncLabel();
    if (cfgCreativeApi) cfgCreativeApi.syncLabel();
    if (cfgTargetApi) cfgTargetApi.syncLabel();
    if (cfgParentApi) cfgParentApi.syncLabel();
    if (cfgTagSelect && cfgTagSelect.render) cfgTagSelect.render();
    var trimModeLabel = $('cfgTrimModeLabel');
    if (trimModeLabel) trimModeLabel.textContent = state.cfg.trimMode;
    document.querySelectorAll('#cfgTrimModePanel .single-option').forEach(function (opt) {
      opt.classList.toggle('is-active', opt.getAttribute('data-value') === state.cfg.trimMode);
    });
    syncMetaTags('cfgNameInput');
    syncMetaTags('cfgFolderNameInput');
    ['cfgLocalFolderItem', 'cfgCreativeItem', 'cfgNameItem', 'cfgMaterialItem', 'cfgCountItem', 'cfgTargetFolderItem', 'cfgFolderNameItem'].forEach(clearError);
    updateFissionHint();
  }

  function showConfigView() {
    var list = $('listView');
    var page = $('configView');
    if (list) list.hidden = true;
    if (page) page.hidden = false;
    if (page && page.scrollTop != null) page.querySelector('.cfg-page__body') && (page.querySelector('.cfg-page__body').scrollTop = 0);
    window.scrollTo(0, 0);
  }

  function showListView() {
    closePicker();
    var list = $('listView');
    var page = $('configView');
    if (page) page.hidden = true;
    if (list) list.hidden = false;
  }

  function openConfig() {
    fillConfigForm(defaultConfig());
    showConfigView();
  }

  function closeConfig() {
    showListView();
  }

  function validateConfig() {
    var ok = true;
    var firstAnchor = null;
    function mark(id) {
      setError(id, true);
      if (!firstAnchor) firstAnchor = $(id);
      ok = false;
    }
    if (!dimLen(state.cfg.materials)) {
      mark('cfgMaterialItem');
    }
    if (isImageType()) {
      if (!layerItemCount(state.cfg)) {
        UI.showToast('请添加图层', 'warning');
        if (!firstAnchor) firstAnchor = $('cardTemplates');
        ok = false;
      }
    } else if (!clipCount(state.cfg) && !layerItemCount(state.cfg) && !dimLen(state.cfg.audios)) {
      UI.showToast('请至少选择片段、图层或音频中的一类模板', 'warning');
      if (!firstAnchor) firstAnchor = $('cardTemplates');
      ok = false;
    }
    var n = Number($('cfgFixedCount').value);
    var min = deriveCountMin();
    if (!n || n < min || n > DERIVE_LIMIT) {
      mark('cfgCountItem');
    }
    if (state.cfg.folderMode === 'custom' && !state.cfg.localFolderId) {
      mark('cfgLocalFolderItem');
    }
    var name = ($('cfgNameInput').value || '').trim();
    if (!name) {
      mark('cfgNameItem');
    }
    if (state.cfg.creativeMode === 'custom' && !state.cfg.creative) {
      mark('cfgCreativeItem');
    }
    if (state.cfg.uploadXmp === '是') {
      if (state.cfg.xmpFolderMode === '已有文件夹' && !state.cfg.targetFolder) {
        mark('cfgTargetFolderItem');
      }
      if (state.cfg.xmpFolderMode === '创建文件夹' && !($('cfgFolderNameInput').value || '').trim()) {
        mark('cfgFolderNameItem');
      }
    }
    if (!ok) scrollToCfgAnchor(firstAnchor);
    return ok;
  }

  function collectConfig() {
    state.cfg.nameTpl = ($('cfgNameInput').value || '').trim();
    state.cfg.folderName = ($('cfgFolderNameInput').value || '').trim();
    state.cfg.trimSec = Number($('cfgTrimSec').value) || 0;
    state.cfg.trimStart = Number($('cfgTrimStart').value) || 0;
    state.cfg.trimEnd = Number($('cfgTrimEnd').value) || 0;
    state.cfg.fixedCount = clampDeriveCount($('cfgFixedCount').value);
    if ($('cfgFixedCount')) $('cfgFixedCount').value = String(state.cfg.fixedCount || '');
    state.cfg.countMode = 'fixed';
    state.cfg.tags = ensureSystemTag(state.cfg.tags);
    readLayerFields();
    if (isImageType()) {
      state.cfg.trim = false;
      state.cfg.clips = { intro: [], outro: [] };
      state.cfg.audios = [];
    }
    return {
      materialType: isImageType() ? '图片' : '视频',
      materials: snapshotItems(state.cfg.materials),
      clips: snapshotClipGroups(state.cfg.clips),
      layers: snapshotLayerGroups(state.cfg.layers),
      audios: snapshotItems(state.cfg.audios),
      countMode: state.cfg.countMode,
      fixedCount: state.cfg.fixedCount,
      md5: !!state.cfg.md5,
      resize: !!state.cfg.resize,
      size: state.cfg.size,
      sizeGroup: state.cfg.sizeGroup,
      trim: !!state.cfg.trim,
      trimMode: state.cfg.trimMode,
      trimSec: state.cfg.trimSec,
      trimStart: state.cfg.trimStart,
      trimEnd: state.cfg.trimEnd,
      folderMode: state.cfg.folderMode,
      localFolderId: state.cfg.localFolderId,
      creativeMode: state.cfg.creativeMode,
      creative: state.cfg.creative,
      nameTpl: state.cfg.nameTpl,
      tagMode: state.cfg.tagMode,
      tags: state.cfg.tags.slice(),
      uploadXmp: state.cfg.uploadXmp,
      filterDup: !!state.cfg.filterDup,
      xmpFolderMode: state.cfg.xmpFolderMode,
      targetFolder: state.cfg.targetFolder,
      parentFolder: state.cfg.parentFolder,
      folderName: state.cfg.folderName
    };
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

  function detailEditOps(cfg) {
    var parts = [];
    if (cfg.md5) parts.push('修改MD5');
    if (cfg.resize && cfg.size) parts.push(cfg.size);
    if (cfg.trim && cfg.materialType !== '图片') {
      if (cfg.trimMode === '片段截取') {
        parts.push('片段截取' + cfg.trimStart + '-' + cfg.trimEnd + '秒');
      } else {
        parts.push((cfg.trimMode || '剪掉片尾') + (cfg.trimSec || 0) + '秒');
      }
    }
    return parts.length ? parts.join('、') : '—';
  }
  function detailComposeOps(cfg) {
    if (cfg.materialType === '图片') {
      return '图层叠加' + layerItemCount(cfg);
    }
    return '片段拼接' + clipCount(cfg) +
      '、图层叠加' + layerItemCount(cfg) +
      '、音频替换' + dimLen(cfg.audios);
  }
  function detailInherit(mode, customText) {
    if (mode !== 'custom') return '原有值';
    return customText || '—';
  }
  function detailXmpFolder(cfg) {
    if (cfg.uploadXmp !== '是') return '—';
    if (cfg.xmpFolderMode === '创建文件夹') {
      var parent = cfg.parentFolder ? cfg.parentFolder + ' / ' : '';
      return parent + (cfg.folderName || '—');
    }
    return cfg.targetFolder || '—';
  }

  function openDetail(task) {
    state.detailId = task.id;
    state.subDraft = { status: '' };
    state.subApplied = { status: '' };
    state.subPage = 1;
    state.subSelected = {};
    var cfg = task.config || defaultConfig();
    var grid = $('detailConfigGrid');
    var items = [
      ['ID', task.id],
      ['衍生数量', String(deriveTotal(cfg))],
      ['创意人', detailInherit(cfg.creativeMode, cfg.creative || '—')],
      ['素材名称', cfg.nameTpl || '—'],
      ['本地文件夹', detailInherit(cfg.folderMode, cfg.localFolderId ? (getLocalFolderPath(cfg.localFolderId) || cfg.localFolderId) : '—')],
      ['XMP文件夹', detailXmpFolder(cfg)],
      ['编辑操作', detailEditOps(cfg)],
      ['合成操作', detailComposeOps(cfg)]
    ];
    grid.innerHTML = items.map(function (it) {
      var cls = it[2] === 'full' ? ' detail-kv--full' : '';
      return '<div class="detail-kv' + cls + '"><div class="detail-kv__label">' + escapeHtml(it[0]) + '</div><div class="detail-kv__value">' + escapeHtml(String(it[1])) + '</div></div>';
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
          '<td><span class="sub-name" title="' + escapeHtml(s.combo || '') + '">' + escapeHtml(s.combo || '—') + '</span></td>' +
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
        getPage: function () { return state.subPage; },
        getPageSize: function () { return state.subPageSize; },
        getTotal: function () {
          var t = findTask(state.detailId);
          return t ? getFilteredSubs(t).length : 0;
        },
        onPageChange: function (p) { state.subPage = p; renderSubTable(); },
        onPageSizeChange: function (s) { state.subPageSize = s; state.subPage = 1; renderSubTable(); }
      });
    }
  }

  /* ---------- events ---------- */
  UI.bindSidebar();
  if (UI.bindFormHelp) UI.bindFormHelp(document);

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openConfig);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    var task = findTask(btn.getAttribute('data-id'));
    if (!task) return;
    var act = btn.getAttribute('data-act');
    if (act === 'detail') openDetail(task);
    else if (act === 'cancel') {
      state.confirmId = task.id;
      UI.openModal('cancelModal');
    } else if (act === 'retry') {
      state.confirmId = task.id;
      UI.openModal('retryModal');
    }
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal(btn.getAttribute('data-close'));
    });
  });

  $('detailDrawerClose').addEventListener('click', function () {
    UI.closeDrawer('detailDrawer');
    state.detailId = null;
    state.subSelected = {};
  });
  var configBackBtn = $('configBackBtn');
  if (configBackBtn) configBackBtn.addEventListener('click', closeConfig);
  var configCancelBtn = $('configCancelBtn');
  if (configCancelBtn) configCancelBtn.addEventListener('click', closeConfig);

  $('configSubmit').addEventListener('click', function () {
    if (!validateConfig()) return;
    var cfg = collectConfig();
    var created = new Date();
    var total = deriveTotal(cfg);
    var task = {
      id: pad4(nextId++),
      creator: CURRENT_USER,
      total: total,
      status: '待开始',
      success: 0,
      fail: 0,
      processing: total,
      createdAt: formatDateTime(created),
      createdDate: formatDateYMD(created),
      updatedAt: formatDateTime(created),
      config: cfg,
      summary: summaryText(cfg)
    };
    task.subs = buildSubs(task, Math.min(total, 48));
    ALL_ROWS.unshift(task);
    closeConfig();
    UI.showToast('提交成功，任务已进入列表', 'success');
    applyFilters();
    renderTable();
  });

  $('cancelOk').addEventListener('click', function () {
    var task = findTask(state.confirmId);
    if (task && (task.status === '待开始' || task.status === '进行中')) {
      var done = (task.subs || []).filter(function (s) { return s.status === '已完成'; }).length;
      task.success = done;
      task.fail = task.total - done;
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

  applyFilters();
  renderTable();
})();
