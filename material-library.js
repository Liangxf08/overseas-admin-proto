/* 素材库 · 参考结构：左树 + 右工作区 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var CURRENT_USER = '用户A';
  var USERS = Array.from({ length: 10 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  /** 与标签管理定版示例数据对齐（素材迭代组无标签，筛选树不展示） */
  var TAG_TREE = [
    { id: 'sys', label: '系统标签', system: true, children: ['衍生'] },
    { id: 'lang', label: '语言', children: ['英语', '日语', '繁中'] },
    { id: 'mix', label: '混合玩法', children: ['消消乐', '清理', '保护系列'] },
    { id: 'feat', label: '素材特点', children: ['CTR', '副玩法', 'DOGE'] },
    { id: 'fest', label: '节日限定', children: ['圣诞节', '夏日'] }
  ];
  var FORM_TAG_TREE = TAG_TREE.filter(function (g) { return g.id !== 'sys'; });

  var FORMAT_TREE = [
    { id: 'image', label: '图片', children: ['jpg', 'jpeg', 'png', 'bmp', 'gif'] },
    { id: 'video', label: '视频', children: ['mp4', 'mov', 'avi', 'mpeg'] }
  ];

  var SIZE_TREE = [
    { id: 'portrait', label: '竖版 (16:9)', children: ['1080x1920', '720x1280'] },
    { id: 'landscape', label: '横版 (9:16)', children: ['1920x1080', '1280x720'] },
    { id: 'square', label: '方形 (1:1)', children: ['1080x1080', '800x800', '512x512'] },
    { id: 'other', label: '其他', children: ['300x300', '180x180'] }
  ];

  function flattenTreeLeaves(tree) {
    var out = [];
    (tree || []).forEach(function (g) {
      (g.children || []).forEach(function (c) {
        if (out.indexOf(c) === -1) out.push(c);
      });
    });
    return out;
  }

  var TAG_OPTIONS = flattenTreeLeaves(TAG_TREE);

  var SYSTEM_TAG_NAMES = [];
  TAG_TREE.forEach(function (g) {
    if (!g.system) return;
    (g.children || []).forEach(function (c) {
      if (SYSTEM_TAG_NAMES.indexOf(c) === -1) SYSTEM_TAG_NAMES.push(c);
    });
  });

  function isSystemTagName(name) {
    return SYSTEM_TAG_NAMES.indexOf(name) !== -1;
  }

  function withoutSystemTags(arr) {
    return (arr || []).filter(function (t) { return !isSystemTagName(t); });
  }

  function keepSystemTags(next, prev) {
    var sys = (prev || []).filter(isSystemTagName);
    return sys.concat(withoutSystemTags(next).filter(function (t) { return sys.indexOf(t) === -1; }));
  }

  function sortTagsForDisplay(tags) {
    var list = (tags || []).slice();
    list.sort(function (a, b) {
      var ia = SYSTEM_TAG_NAMES.indexOf(a);
      var ib = SYSTEM_TAG_NAMES.indexOf(b);
      var aSys = ia !== -1;
      var bSys = ib !== -1;
      if (aSys && bSys) return ia - ib;
      if (aSys) return -1;
      if (bSys) return 1;
      return 0;
    });
    return list;
  }

  var ALL_FILTERS = [
    { key: 'date', label: '上传时间', kind: 'date' },
    { key: 'creator', label: '创意人', kind: 'search' },
    { key: 'tag', label: '标签', kind: 'cascade', tree: TAG_TREE },
    { key: 'type', label: '类型', kind: 'single' },
    { key: 'format', label: '格式', kind: 'cascade', tree: FORMAT_TREE },
    { key: 'size', label: '尺寸', kind: 'cascade', tree: SIZE_TREE },
    { key: 'duration', label: '时长', kind: 'multi', options: ['0-6s', '7-15s', '16-30s', '31-60s', '>60s'] },
    { key: 'source', label: '来源', kind: 'single', options: ['本地上传', '外部采集'] },
    { key: 'xmp', label: '同步XMP', kind: 'single' },
    { key: 'name', label: '素材名称', kind: 'keyword' }
  ];
  var DEFAULT_VISIBLE_FILTERS = ['date', 'creator', 'tag', 'xmp', 'name'];
  var DURATION_OPTIONS = ['0-6s', '7-15s', '16-30s', '31-60s', '>60s'];
  var SOURCE_OPTIONS = ['本地上传', '外部采集'];
  var TT_COLLECTED_FOLDER_ID = 'tt_collected';

  var CASCADE_ARROW = '<svg class="cascade-option__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 3L7.5 6L4.5 9"/></svg>';
  var CLEAR_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg>';

  var SYNC_CLASS = {
    '未同步': 'sync-tag--pending',
    '同步中': 'sync-tag--syncing',
    '已同步': 'sync-tag--done',
    '同步失败': 'sync-tag--fail'
  };

  var PLATFORMS = [
    { key: 'tt', label: 'TT' },
    { key: 'fb', label: 'FB' },
    { key: 'gg', label: 'GG' },
    { key: 'ap', label: 'AP' }
  ];

  var folderSeq = 200;
  var materialSeq = 1000001;

  var FOLDER_ICON = '<img class="tree-node__icon" src="assets/文件夹.png" width="16" height="16" alt="" />';
  var TOGGLE_SVG = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';
  var EDIT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  var MORE_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>';

  /** 系统文件夹：存放/展示全部素材，不可删改 */
  var SYSTEM_FOLDER = (window.MaterialFolderData && window.MaterialFolderData.SYSTEM_FOLDER) || {
    id: 'system_all',
    name: '全部素材',
    system: true,
    children: []
  };

  /**
   * 自定义文件夹树（与 XMP 无关）
   * 与「全部素材」平级 · 真源：material-folder-data.js
   */
  var CUSTOM_FOLDERS = (window.MaterialFolderData && window.MaterialFolderData.CUSTOM_FOLDERS) || [];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDateYMD(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatDateCompact(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }

  function stripExt(name) {
    var s = String(name || '');
    var i = s.lastIndexOf('.');
    return i > 0 ? s.slice(0, i) : s;
  }

  function fileExt(name) {
    var s = String(name || '');
    var i = s.lastIndexOf('.');
    return i > 0 ? s.slice(i + 1).toLowerCase() : '';
  }

  function buildOssUrl(name, created, id, format) {
    var stem = stripExt(name);
    var day = formatDateCompact(created instanceof Date ? created : new Date());
    var seed = String(1786526512228 + ((Number(id) || 0) % 900000000));
    var ext = format || fileExt(name) || 'mp4';
    return 'https://static-oss-us.wondergame.net/materials/' + day + '/' +
      encodeURIComponent(stem) + '_' + seed + '_' + id + '.' + ext;
  }

  function formatDuration(sec) {
    var s = Math.max(0, Math.floor(sec));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(r);
  }

  function pick(arr, i) { return arr[i % arr.length]; }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function isSystemFolder(id) {
    return id === SYSTEM_FOLDER.id;
  }

  function walkFolders(nodes, parentPath, fn) {
    (nodes || []).forEach(function (node) {
      var path = parentPath ? parentPath + ' / ' + node.name : node.name;
      fn(node, path);
      if (node.children && node.children.length) walkFolders(node.children, path, fn);
    });
  }

  function findFolderNode(id, nodes) {
    if (id === SYSTEM_FOLDER.id) return SYSTEM_FOLDER;
    var list = nodes || CUSTOM_FOLDERS;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
      var found = findFolderNode(id, list[i].children || []);
      if (found) return found;
    }
    return null;
  }

  function getFolderPath(id) {
    if (isSystemFolder(id)) return SYSTEM_FOLDER.name;
    var result = '';
    walkFolders(CUSTOM_FOLDERS, '', function (node, path) {
      if (node.id === id) result = path;
    });
    return result;
  }

  /** 从根到当前的文件夹链路（不含系统库） */
  function getFolderTrail(id) {
    if (isSystemFolder(id)) return [{ id: SYSTEM_FOLDER.id, name: SYSTEM_FOLDER.name }];
    var trail = [];
    function walk(nodes, stack) {
      var i;
      for (i = 0; i < (nodes || []).length; i++) {
        var n = nodes[i];
        var next = stack.concat([{ id: n.id, name: n.name }]);
        if (n.id === id) {
          trail = next;
          return true;
        }
        if (walk(n.children || [], next)) return true;
      }
      return false;
    }
    walk(CUSTOM_FOLDERS, []);
    if (trail.length) return trail;
    var node = findFolderNode(id);
    return node ? [{ id: node.id, name: node.name }] : [];
  }

  /** 收集某节点及全部子孙 id */
  function collectFolderIds(node, out) {
    out = out || [];
    if (!node || isSystemFolder(node.id)) return out;
    out.push(node.id);
    (node.children || []).forEach(function (c) { collectFolderIds(c, out); });
    return out;
  }

  function listCustomFolderIds() {
    var ids = [];
    walkFolders(CUSTOM_FOLDERS, '', function (node) { ids.push(node.id); });
    return ids;
  }

  function getSiblingNames(parentId) {
    if (!parentId || isSystemFolder(parentId)) {
      return CUSTOM_FOLDERS.map(function (n) { return n.name; });
    }
    var parent = findFolderNode(parentId);
    return (parent && parent.children ? parent.children : []).map(function (n) { return n.name; });
  }

  /** 同级重名时自动加 (1)(2)…；不同父级可同名 */
  function allocateSiblingFolderName(desiredName, occupiedNames) {
    var names = occupiedNames || [];
    var base = String(desiredName || '').trim();
    if (!base) return base;
    if (names.indexOf(base) === -1) return base;
    var n = 1;
    var candidate;
    do {
      candidate = base + '(' + n + ')';
      n += 1;
    } while (names.indexOf(candidate) !== -1);
    return candidate;
  }

  function notifyFolderAutoRename(desiredName, finalName) {
    if (!finalName || finalName === desiredName) return;
    UI.showToast('已存在同名文件夹，已命名为 ' + finalName, 'success');
  }

  function isDescendantFolder(childId, ancestorId) {
    if (!childId || !ancestorId || isSystemFolder(ancestorId) || isSystemFolder(childId)) return false;
    var path = getFolderPath(childId);
    var ancestorPath = getFolderPath(ancestorId);
    if (!path || !ancestorPath) return false;
    return path.indexOf(ancestorPath + ' / ') === 0;
  }

  function isTtCollectedFolder(folderId) {
    if (!folderId) return false;
    if (folderId === TT_COLLECTED_FOLDER_ID) return true;
    return isDescendantFolder(folderId, TT_COLLECTED_FOLDER_ID);
  }

  function sourceForFolder(folderId) {
    return isTtCollectedFolder(folderId) ? '外部采集' : '本地上传';
  }

  function rowSource(row) {
    return (row && row.source) || sourceForFolder(row && row.folderId) || '本地上传';
  }

  function countMaterialsInFolder(folderId) {
    if (isSystemFolder(folderId)) return ALL_ROWS.length;
    return ALL_ROWS.filter(function (r) {
      return r.folderId === folderId || isDescendantFolder(r.folderId, folderId);
    }).length;
  }

  function folderCountBadgeHtml(folderId) {
    var n = countMaterialsInFolder(folderId);
    var text = n > 99 ? '99+' : String(n);
    return '<span class="folder-count-badge" title="素材数：' + n + '">' + escapeHtml(text) + '</span>';
  }

  function isFolderEmpty(nodeId) {
    if (isSystemFolder(nodeId)) return false;
    var node = findFolderNode(nodeId);
    if (!node) return true;
    if (node.children && node.children.length) return false;
    return countMaterialsInFolder(nodeId) === 0;
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function buildMockRows() {
    var folderIds = listCustomFolderIds();
    var syncCycle = ['已同步', '已同步', '未同步', '同步失败', '已同步'];
    var types = ['视频', '视频', '视频', '图片'];
    var list = [];
    var today = startOfDay(new Date());
    var i = 0;
    folderIds.forEach(function (folderId) {
      var isDerivedFolder = folderId === 'cube_derived';
      var count = isDerivedFolder ? 20 : randInt(10, 50);
      var c;
      for (c = 0; c < count; c++, i++) {
        var created = new Date(today);
        created.setDate(created.getDate() - (i % 20));
        created.setHours(9 + (i % 8), (i * 7) % 60, (i * 11) % 60, 0);
        var type = pick(types, i);
        var format = type === '视频' ? pick(['mp4', 'mov'], i) : pick(['png', 'jpg', 'gif'], i);
        var size = pick(['1080x1920', '720x1280', '1920x1080', '1080x1080', '800x800', '1280x720'], i);
        var durationSec = type === '视频'
          ? pick([3, 5, 10, 12, 20, 28, 40, 55, 75, 90], i)
          : 0;
        var tags = [];
        /* 仅 Cube Out「衍生」文件夹打系统标签「衍生」 */
        if (isDerivedFolder) tags.push('衍生');
        if (i % 2 === 0) tags.push(pick(['英语', '繁中', '日语'], i));
        if (i % 3 === 0) tags.push(pick(['消消乐', '清理', '保护系列'], i + 1));
        if (i % 5 === 0) tags.push(pick(['CTR', '副玩法', 'DOGE'], i + 2));
        if (i % 7 === 0) tags.push(pick(['圣诞节', '夏日'], i + 3));
        if (!tags.length) tags.push(pick(['英语', 'CTR', '副玩法'], i));
        tags = tags.filter(function (t, idx) { return tags.indexOf(t) === idx; });
        var sync = pick(syncCycle, i);
        var delivery = [];
        if (i % 2 === 0) delivery.push('tt');
        if (i % 3 === 0) delivery.push('fb');
        if (i % 4 === 0) delivery.push('gg');
        if (i % 7 === 0) delivery.push('ap');
        var row = {
          id: String(materialSeq++),
          name: (isDerivedFolder
            ? pick(['衍生混剪', '衍生竖版', '衍生片头', '衍生口播', '衍生示例'], i)
            : pick(['品牌片头', '投放竖版', '剧情混剪', '口播成片', '素材示例'], i)
          ) + '_' + (1000 + i) + '.' + format,
          folderId: folderId,
          type: type,
          format: format,
          size: size,
          durationSec: durationSec,
          tags: tags,
          creator: pick(USERS, i + 2),
          createdAt: formatDateTime(created),
          createdDate: formatDateYMD(created),
          createdTs: created.getTime(),
          status: i % 11 === 0 ? '禁用' : '启用',
          syncStatus: sync,
          xmpId: sync === '已同步' ? 'XMP' + (5000 + i) : '',
          failReason: sync === '同步失败' ? 'XMP 限流' : '',
          delivery: delivery,
          source: sourceForFolder(folderId),
          ossUrl: ''
        };
        row.ossUrl = buildOssUrl(row.name, created, row.id, format);
        list.push(row);
      }
    });
    return list;
  }

  var ALL_ROWS = buildMockRows();

  function buildDefaultCollapsed() {
    var map = {};
    walkFolders(CUSTOM_FOLDERS, '', function (node) {
      if (node.children && node.children.length) map[node.id] = true;
    });
    return map;
  }

  var state = {
    folderId: SYSTEM_FOLDER.id,
    folderKw: '',
    collapsed: buildDefaultCollapsed(),
    draft: { tag: [], creator: '', xmp: '', type: '', format: [], size: [], duration: [], source: '', name: '' },
    dateCleared: false,
    visibleFilters: DEFAULT_VISIBLE_FILTERS.slice(),
    filterVisibleDraft: null,
    filterSettingsSnapshot: null,
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    selected: {},
    view: 'list',
    /** false：仅当前文件夹素材 + 子文件夹行；true：含子文件夹素材平铺 */
    showSubfolderMaterials: false,
    upload: {
      folderId: '',
      creator: CURRENT_USER,
      tags: [],
      deriveDup: true,
      items: [],
      selected: {},
      uploading: false
    },
    nameEditId: null,
    deleteIds: [],
    batchTagIds: [],
    batchTags: [],
    detail: {
      id: null,
      nameBase: '',
      format: '',
      folderId: '',
      tags: [],
      creator: ''
    },
    folderModal: {
      mode: 'create', /* create | rename */
      parentId: '',
      targetId: null
    },
    deleteFolderId: null,
    folderMoreId: null,
    materialMoreId: null,
    moveFolderId: null,
    moveFolderParentId: '',
    dragFolderId: null
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
      list.innerHTML = options.filter(function (opt) {
        return !kw || String(opt).toLowerCase().indexOf(kw) !== -1;
      }).map(function (opt) {
        var active = opt === value ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' +
          escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
      }).join('') || '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
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
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      if (cfg.onChange) cfg.onChange(opt.getAttribute('data-value') || '');
      syncLabel();
      panel.classList.remove('is-open');
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
          panel.classList.remove('is-open');
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel };
  }

  document.addEventListener('click', function () {
    document.querySelectorAll('.search-select-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open');
    });
  });

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
    var activeGroupId = tree[0] ? tree[0].id : '';
    var CHEVRON = CASCADE_ARROW;

    function getSelected() {
      return (cfg.getSelected ? cfg.getSelected() : []).slice();
    }

    function setSelected(arr) {
      if (cfg.setSelected) cfg.setSelected(arr);
    }

    function allLeaves() {
      return flattenTreeLeaves(tree);
    }

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
      return {
        all: children.length > 0 && hit === children.length,
        some: hit > 0 && hit < children.length,
        hit: hit
      };
    }

    function syncLabel() {
      var selected = getSelected();
      var prefix = cfg.prefix || '';
      if (!selected.length) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
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
            CHEVRON +
          '</label>';
        }).join('');
        groupList.querySelectorAll('input[data-group-check]').forEach(function (input) {
          var g = findGroup(input.getAttribute('data-group-check'));
          if (!g) return;
          var st = groupState(g, selected);
          input.indeterminate = st.some;
        });
      }

      var activeGroup = findGroup(activeGroupId);
      var children = ((activeGroup && activeGroup.children) || []).filter(function (c) {
        return matchesKw(c, kw);
      });
      if (!activeGroup || !children.length) {
        childList.innerHTML = '<div class="cascade-panel__empty">' + (activeGroup ? '暂无数据' : '请选择分组') + '</div>';
      } else {
        childList.innerHTML = children.map(function (c) {
          var checked = selected.indexOf(c) !== -1 ? ' checked' : '';
          return '<label class="cascade-option">' +
            '<input type="checkbox" data-leaf="' + escapeHtml(c) + '"' + checked + ' />' +
            '<span class="cascade-option__label">' + escapeHtml(c) + '</span>' +
          '</label>';
        }).join('');
      }

      if (selectedEl) {
        if (!selected.length) {
          selectedEl.innerHTML = '';
        } else {
          selectedEl.innerHTML = selected.map(function (name) {
            return '<div class="multi-selected"><span class="multi-selected__name"><span title="' + escapeHtml(name) + '">' +
              escapeHtml(name) + '</span></span><button class="multi-selected__remove" type="button" data-remove="' +
              escapeHtml(name) + '" aria-label="移除">' + CLEAR_ICON + '</button></div>';
          }).join('');
        }
      }
      syncLabel();
    }

    function needsPortal() {
      return !!(wrap.closest('.drawer') || wrap.closest('.modal-mask'));
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
      if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
      }
      panel.classList.add('cascade-panel--portal');
      var rect = trigger.getBoundingClientRect();
      var pw = panel.offsetWidth || 640;
      var ph = panel.offsetHeight || 280;
      var pad = 8;
      var left = rect.left;
      if (left + pw > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - pw - pad);
      }
      var top = rect.bottom + 4;
      if (top + ph > window.innerHeight - pad && rect.top - ph - 4 >= pad) {
        top = rect.top - ph - 4;
      }
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
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
        portalPanel();
        if (!panel.classList.contains('cascade-panel--portal') && UI.adjustDropdownPlacement) {
          UI.adjustDropdownPlacement(panel, trigger);
        }
      }
    });

    if (search) {
      search.addEventListener('input', render);
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    groupList.addEventListener('click', function (e) {
      var row = e.target.closest('[data-group]');
      if (!row) return;
      var gid = row.getAttribute('data-group');
      if (e.target.closest('input[type="checkbox"]')) return;
      activeGroupId = gid;
      render();
    });

    groupList.addEventListener('change', function (e) {
      var input = e.target.closest('input[data-group-check]');
      if (!input) return;
      var gid = input.getAttribute('data-group-check');
      var group = findGroup(gid);
      if (!group) return;
      activeGroupId = gid;
      var selected = getSelected();
      var children = group.children || [];
      if (input.checked) {
        children.forEach(function (c) {
          if (selected.indexOf(c) === -1) selected.push(c);
        });
      } else {
        selected = selected.filter(function (c) { return children.indexOf(c) === -1; });
      }
      setSelected(selected);
      render();
    });

    childList.addEventListener('change', function (e) {
      var input = e.target.closest('input[data-leaf]');
      if (!input) return;
      var name = input.getAttribute('data-leaf');
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
        setSelected([]);
        render();
      });
    }

    if (cfg.clearId && $(cfg.clearId)) {
      $(cfg.clearId).addEventListener('click', function (e) {
        e.stopPropagation();
        setSelected([]);
        render();
        closeCascadePanel();
      });
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { render: render, syncLabel: syncLabel, close: closeCascadePanel };
  }

  function cascadePanelHtml(prefix) {
    return '<div class="cascade-panel" id="fsPanel_' + prefix + '">' +
      '<div class="cascade-panel__left">' +
        '<div class="cascade-panel__search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>' +
          '<input type="text" id="fsSearch_' + prefix + '" placeholder="搜索" autocomplete="off" />' +
        '</div>' +
        '<div class="cascade-panel__toolbar">' +
          '<button class="cascade-panel__link" type="button" id="fsSelectAll_' + prefix + '">全选</button>' +
        '</div>' +
        '<div class="cascade-panel__list" id="fsGroup_' + prefix + '"></div>' +
      '</div>' +
      '<div class="cascade-panel__mid">' +
        '<div class="cascade-panel__list" id="fsChild_' + prefix + '"></div>' +
      '</div>' +
      '<div class="cascade-panel__right">' +
        '<div class="cascade-panel__toolbar cascade-panel__toolbar--right">' +
          '<span id="fsCount_' + prefix + '">已选 0 项</span>' +
          '<button class="cascade-panel__link" type="button" id="fsClearAll_' + prefix + '">清空</button>' +
        '</div>' +
        '<div class="cascade-panel__list" id="fsSelected_' + prefix + '"></div>' +
      '</div>' +
    '</div>';
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
    onChange: function () {
      state.dateCleared = false;
      var wrap = $('dateRangeWrap');
      if (wrap) wrap.classList.add('has-value');
    }
  });

  function clearDateFilter() {
    state.dateCleared = true;
    var wrap = $('dateRangeWrap');
    var label = $('dateRangeLabel');
    if (label) label.innerHTML = '上传时间：<span class="muted">请选择</span>';
    if (wrap) wrap.classList.remove('has-value');
    if (UI.closePanels) UI.closePanels();
  }

  if ($('dateRangeClear')) {
    $('dateRangeClear').addEventListener('click', function (e) {
      e.stopPropagation();
      clearDateFilter();
    });
  }

  var tagSelect = bindCascadeMultiSelect({
    wrapId: 'tagWrap',
    triggerId: 'tagTrigger',
    panelId: 'tagPanel',
    labelId: 'tagLabel',
    groupListId: 'tagGroupList',
    childListId: 'tagChildList',
    selectedId: 'tagSelected',
    searchId: 'tagSearch',
    countId: 'tagCount',
    selectAllId: 'tagSelectAll',
    clearAllId: 'tagClearAll',
    clearId: 'tagClear',
    prefix: '标签：',
    tree: TAG_TREE,
    getSelected: function () { return state.draft.tag; },
    setSelected: function (arr) { state.draft.tag = arr; }
  });

  var formatSelect = bindCascadeMultiSelect({
    wrapId: 'formatWrap',
    triggerId: 'formatTrigger',
    panelId: 'formatPanel',
    labelId: 'formatLabel',
    groupListId: 'formatGroupList',
    childListId: 'formatChildList',
    selectedId: 'formatSelected',
    searchId: 'formatSearch',
    countId: 'formatCount',
    selectAllId: 'formatSelectAll',
    clearAllId: 'formatClearAll',
    clearId: 'formatClear',
    prefix: '格式：',
    tree: FORMAT_TREE,
    getSelected: function () { return state.draft.format; },
    setSelected: function (arr) { state.draft.format = arr; }
  });

  var sizeSelect = bindCascadeMultiSelect({
    wrapId: 'sizeWrap',
    triggerId: 'sizeTrigger',
    panelId: 'sizePanel',
    labelId: 'sizeLabel',
    groupListId: 'sizeGroupList',
    childListId: 'sizeChildList',
    selectedId: 'sizeSelected',
    searchId: 'sizeSearch',
    countId: 'sizeCount',
    selectAllId: 'sizeSelectAll',
    clearAllId: 'sizeClearAll',
    clearId: 'sizeClear',
    prefix: '尺寸：',
    tree: SIZE_TREE,
    getSelected: function () { return state.draft.size; },
    setSelected: function (arr) { state.draft.size = arr; }
  });

  var durationSelect = null;
  if (UI.bindMultiSelect) {
    durationSelect = UI.bindMultiSelect({
      wrapId: 'durationWrap',
      triggerId: 'durationTrigger',
      panelId: 'durationPanel',
      labelId: 'durationLabel',
      listId: 'durationList',
      clearId: 'durationClear',
      prefix: '时长：',
      getOptions: function () { return DURATION_OPTIONS; },
      getSelected: function () { return state.draft.duration || []; },
      setSelected: function (arr) { state.draft.duration = arr || []; }
    });
  }

  var creatorSelect = bindSearchSelect({
    wrapId: 'creatorWrap',
    triggerId: 'creatorTrigger',
    panelId: 'creatorPanel',
    labelId: 'creatorLabel',
    listId: 'creatorList',
    searchId: 'creatorSearch',
    clearId: 'creatorClear',
    prefix: '创意人：',
    getOptions: function () { return USERS; },
    getValue: function () { return state.draft.creator; },
    onChange: function (v) { state.draft.creator = v; }
  });

  var nameClearApi = null;
  if (UI.bindInputClearable) {
    nameClearApi = UI.bindInputClearable({ wrapId: 'nameWrap', clearId: 'filterNameClear' });
  }

  if (UI.bindSingleSelect) {
    UI.bindSingleSelect({
      wrapId: 'xmpWrap',
      triggerId: 'xmpTrigger',
      panelId: 'xmpPanel',
      labelId: 'xmpLabel',
      clearId: 'xmpClear',
      prefix: '同步XMP：',
      getValue: function () { return state.draft.xmp; },
      onChange: function (v) { state.draft.xmp = v; }
    });
    UI.bindSingleSelect({
      wrapId: 'typeWrap',
      triggerId: 'typeTrigger',
      panelId: 'typePanel',
      labelId: 'typeLabel',
      clearId: 'typeClear',
      prefix: '类型：',
      getValue: function () { return state.draft.type; },
      onChange: function (v) { state.draft.type = v; }
    });
    UI.bindSingleSelect({
      wrapId: 'sourceWrap',
      triggerId: 'sourceTrigger',
      panelId: 'sourcePanel',
      labelId: 'sourceLabel',
      clearId: 'sourceClear',
      prefix: '来源：',
      getValue: function () { return state.draft.source; },
      onChange: function (v) { state.draft.source = v; }
    });
  }

  function isFilterVisible(key) {
    return state.visibleFilters.indexOf(key) >= 0;
  }

  function syncFilterBarVisibility() {
    ALL_FILTERS.forEach(function (f) {
      var el = document.querySelector('[data-filter-key="' + f.key + '"]');
      if (!el) return;
      if (isFilterVisible(f.key)) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function syncMainFilterLabels() {
    if (tagSelect && tagSelect.syncLabel) tagSelect.syncLabel();
    if (formatSelect && formatSelect.syncLabel) formatSelect.syncLabel();
    if (sizeSelect && sizeSelect.syncLabel) sizeSelect.syncLabel();
    if (durationSelect && durationSelect.syncLabel) durationSelect.syncLabel();
    if (creatorSelect && creatorSelect.syncLabel) creatorSelect.syncLabel();
    ['xmp', 'type', 'source'].forEach(function (key) {
      var wrap = $(key + 'Wrap');
      var label = $(key + 'Label');
      if (!wrap || !label) return;
      var map = { xmp: '同步XMP：', type: '类型：', source: '来源：' };
      var val = state.draft[key] || '';
      if (!val) {
        label.innerHTML = map[key] + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.innerHTML = map[key] + escapeHtml(val);
        wrap.classList.add('has-value');
      }
    });
    var dateWrap = $('dateRangeWrap');
    var dateLabel = $('dateRangeLabel');
    if (state.dateCleared) {
      if (dateLabel) dateLabel.innerHTML = '上传时间：<span class="muted">请选择</span>';
      if (dateWrap) dateWrap.classList.remove('has-value');
    } else if (dateWrap && dateApi && dateApi.getStart()) {
      dateWrap.classList.add('has-value');
    }
  }

  function filterSettingControlHtml(f) {
    var key = f.key;
    if (key === 'date') {
      return '<div class="filter-setting-control filter-setting-control--date filter-item--date has-value" id="fsDateWrap">' +
        '<button class="date-range-trigger" type="button" id="fsDateTrigger">' +
          '<span class="date-range-trigger__text" id="fsDateLabel">上传时间：-</span>' +
        '</button>' +
        '<button class="select-clear" type="button" id="fsDateClear" aria-label="清除">' + CLEAR_ICON + '</button>' +
        '<div class="date-panel" id="fsDatePanel">' +
          '<div class="date-panel__shortcuts" id="fsDateShortcuts">' +
            '<button class="date-shortcut" type="button" data-shortcut="today">今天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="yesterday">昨天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="last7">近7天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="last30">近30天</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="thisWeek">本周</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="lastWeek">上周</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="thisMonth">本月</button>' +
            '<button class="date-shortcut" type="button" data-shortcut="lastMonth">上月</button>' +
          '</div>' +
          '<div class="date-panel__calendars">' +
            '<div class="date-cal" id="fsDateCalLeft"></div>' +
            '<div class="date-cal" id="fsDateCalRight"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    if (f.kind === 'cascade') {
      return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
        '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
          '<span class="select-trigger__text" id="fsLabel_' + key + '">' + f.label + '：<span class="muted">请选择</span></span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
        cascadePanelHtml(key) +
      '</div>';
    }
    if (f.kind === 'multi') {
      var opts = f.options || DURATION_OPTIONS;
      return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
        '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
          '<span class="select-trigger__text" id="fsLabel_' + key + '">' + f.label + '：<span class="muted">请选择</span></span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
        '<div class="multi-panel multi-panel--simple" id="fsPanel_' + key + '">' +
          '<div class="multi-panel__list" id="fsList_' + key + '"></div>' +
        '</div>' +
      '</div>';
    }
    if (f.kind === 'search') {
      return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
        '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
          '<span class="select-trigger__text" id="fsLabel_' + key + '">' + f.label + '：<span class="muted">请选择</span></span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
        '<div class="search-select-panel" id="fsPanel_' + key + '">' +
          '<div class="search-select-panel__search">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>' +
            '<input type="text" id="fsSearch_' + key + '" placeholder="搜索" autocomplete="off" />' +
          '</div>' +
          '<div class="search-select-panel__list" id="fsList_' + key + '"></div>' +
        '</div>' +
      '</div>';
    }
    if (f.kind === 'keyword') {
      var nameVal = (($('filterName') && $('filterName').value) || '');
      return '<div class="filter-setting-control filter-item' + (nameVal ? ' has-value' : '') + '" id="fsWrap_' + key + '">' +
        '<input class="input input-clearable" type="text" id="fs_' + key + '" placeholder="' + escapeHtml(f.label) + '" value="' + escapeHtml(nameVal) + '" autocomplete="off" />' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
      '</div>';
    }
    var options = [];
    if (key === 'type') options = ['视频', '图片'];
    else if (key === 'xmp') options = ['是', '否'];
    else if (key === 'source') options = SOURCE_OPTIONS.slice();
    return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
      '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
        '<span class="select-trigger__text" id="fsLabel_' + key + '">' + f.label + '：<span class="muted">请选择</span></span>' +
        '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
      '</button>' +
      '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
      '<div class="single-panel" id="fsPanel_' + key + '">' +
        options.map(function (o) {
          return '<button class="single-option" type="button" data-value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function bindFilterSettingsControls() {
    ALL_FILTERS.forEach(function (f) {
      var key = f.key;
      if (key === 'date') {
        var fsDate = UI.bindDateRange({
          wrapId: 'fsDateWrap',
          triggerId: 'fsDateTrigger',
          labelId: 'fsDateLabel',
          panelId: 'fsDatePanel',
          shortcutsId: 'fsDateShortcuts',
          calLeftId: 'fsDateCalLeft',
          calRightId: 'fsDateCalRight',
          prefix: '上传时间：',
          onChange: function (start, end, shortcut) {
            state.dateCleared = false;
            if (dateApi) dateApi.setRange(start, end, shortcut, true);
            var mainWrap = $('dateRangeWrap');
            if (mainWrap) mainWrap.classList.add('has-value');
            var fsWrap = $('fsDateWrap');
            if (fsWrap) fsWrap.classList.add('has-value');
          }
        });
        if (state.dateCleared) {
          var fsLabel = $('fsDateLabel');
          var fsWrapCleared = $('fsDateWrap');
          if (fsLabel) fsLabel.innerHTML = '上传时间：<span class="muted">请选择</span>';
          if (fsWrapCleared) fsWrapCleared.classList.remove('has-value');
        } else if (fsDate && dateApi && dateApi.getStart() && dateApi.getEnd()) {
          fsDate.setRange(dateApi.getStart(), dateApi.getEnd(), null, true);
        }
        if ($('fsDateClear')) {
          $('fsDateClear').addEventListener('click', function (e) {
            e.stopPropagation();
            clearDateFilter();
            var fsLabel2 = $('fsDateLabel');
            var fsWrap2 = $('fsDateWrap');
            if (fsLabel2) fsLabel2.innerHTML = '上传时间：<span class="muted">请选择</span>';
            if (fsWrap2) fsWrap2.classList.remove('has-value');
          });
        }
        return;
      }
      if (f.kind === 'cascade') {
        bindCascadeMultiSelect({
          wrapId: 'fsWrap_' + key,
          triggerId: 'fsTrigger_' + key,
          panelId: 'fsPanel_' + key,
          labelId: 'fsLabel_' + key,
          groupListId: 'fsGroup_' + key,
          childListId: 'fsChild_' + key,
          selectedId: 'fsSelected_' + key,
          searchId: 'fsSearch_' + key,
          countId: 'fsCount_' + key,
          selectAllId: 'fsSelectAll_' + key,
          clearAllId: 'fsClearAll_' + key,
          clearId: 'fsClear_' + key,
          prefix: f.label + '：',
          tree: f.tree,
          getSelected: function () { return state.draft[key] || []; },
          setSelected: function (arr) {
            state.draft[key] = arr;
            syncMainFilterLabels();
            if (key === 'tag' && tagSelect && tagSelect.render) tagSelect.render();
            if (key === 'format' && formatSelect && formatSelect.render) formatSelect.render();
            if (key === 'size' && sizeSelect && sizeSelect.render) sizeSelect.render();
          }
        });
        return;
      }
      if (f.kind === 'multi') {
        if (UI.bindMultiSelect) {
          UI.bindMultiSelect({
            wrapId: 'fsWrap_' + key,
            triggerId: 'fsTrigger_' + key,
            panelId: 'fsPanel_' + key,
            labelId: 'fsLabel_' + key,
            listId: 'fsList_' + key,
            clearId: 'fsClear_' + key,
            prefix: f.label + '：',
            getOptions: function () { return f.options || DURATION_OPTIONS; },
            getSelected: function () { return state.draft[key] || []; },
            setSelected: function (arr) {
              state.draft[key] = arr || [];
              syncMainFilterLabels();
              if (key === 'duration' && durationSelect && durationSelect.render) durationSelect.render();
            }
          });
        }
        return;
      }
      if (f.kind === 'search') {
        bindSearchSelect({
          wrapId: 'fsWrap_' + key,
          triggerId: 'fsTrigger_' + key,
          panelId: 'fsPanel_' + key,
          labelId: 'fsLabel_' + key,
          listId: 'fsList_' + key,
          searchId: 'fsSearch_' + key,
          clearId: 'fsClear_' + key,
          prefix: f.label + '：',
          getOptions: function () { return USERS; },
          getValue: function () { return state.draft[key] || ''; },
          onChange: function (v) {
            state.draft[key] = v;
            syncMainFilterLabels();
          }
        });
        return;
      }
      if (f.kind === 'keyword') {
        var fsInput = $('fs_' + key);
        var mainInput = $('filterName');
        if (fsInput) {
          fsInput.addEventListener('input', function () {
            if (mainInput) mainInput.value = fsInput.value;
            if (nameClearApi && nameClearApi.sync) nameClearApi.sync();
          });
          fsInput.addEventListener('click', function (e) { e.stopPropagation(); });
        }
        if (UI.bindInputClearable) {
          UI.bindInputClearable({
            wrapId: 'fsWrap_' + key,
            clearId: 'fsClear_' + key,
            onClear: function () {
              if (mainInput) mainInput.value = '';
              if (nameClearApi && nameClearApi.sync) nameClearApi.sync();
            }
          });
        }
        return;
      }
      if (UI.bindSingleSelect) {
        UI.bindSingleSelect({
          wrapId: 'fsWrap_' + key,
          triggerId: 'fsTrigger_' + key,
          panelId: 'fsPanel_' + key,
          labelId: 'fsLabel_' + key,
          clearId: 'fsClear_' + key,
          prefix: f.label + '：',
          getValue: function () { return state.draft[key] || ''; },
          onChange: function (v) {
            state.draft[key] = v;
            syncMainFilterLabels();
          }
        });
      }
    });
  }

  function openFilterSettings() {
    if (!state.filterSettingsSnapshot) {
      state.filterSettingsSnapshot = {
        draft: {
          tag: (state.draft.tag || []).slice(),
          creator: state.draft.creator,
          xmp: state.draft.xmp,
          type: state.draft.type,
          format: (state.draft.format || []).slice(),
          size: (state.draft.size || []).slice(),
          duration: (state.draft.duration || []).slice(),
          source: state.draft.source,
          name: (($('filterName') && $('filterName').value) || '')
        },
        dateStart: dateApi && dateApi.getStart() ? new Date(dateApi.getStart().getTime()) : null,
        dateEnd: dateApi && dateApi.getEnd() ? new Date(dateApi.getEnd().getTime()) : null,
        dateCleared: state.dateCleared
      };
    }

    var grid = $('filterCheckGrid');
    var preserveChecked = grid && grid.querySelector('.filter-setting-item > input[type="checkbox"]');
    if (preserveChecked) {
      state.filterVisibleDraft = [];
      grid.querySelectorAll('.filter-setting-item > input[type="checkbox"]').forEach(function (input) {
        if (input.checked) state.filterVisibleDraft.push(input.value);
      });
    } else {
      state.filterVisibleDraft = state.visibleFilters.slice();
    }

    function renderFilterSettingItem(f) {
      var checked = state.filterVisibleDraft.indexOf(f.key) >= 0;
      return '<div class="filter-setting-item" data-fs-key="' + f.key + '">' +
        '<input type="checkbox" value="' + f.key + '"' + (checked ? ' checked' : '') + ' />' +
        filterSettingControlHtml(f) +
      '</div>';
    }

    var dateFilter = ALL_FILTERS.find(function (f) { return f.key === 'date'; });
    var otherFilters = ALL_FILTERS.filter(function (f) { return f.key !== 'date'; });
    var rowsHtml = '<div class="filter-setting-row filter-setting-row--date">' +
      renderFilterSettingItem(dateFilter) +
    '</div>';
    for (var i = 0; i < otherFilters.length; i += 3) {
      rowsHtml += '<div class="filter-setting-row">' +
        otherFilters.slice(i, i + 3).map(renderFilterSettingItem).join('') +
      '</div>';
    }
    grid.innerHTML = rowsHtml;
    bindFilterSettingsControls();
    UI.openModal('filterModal');
  }

  function restoreFilterSettingsSnapshot() {
    var snap = state.filterSettingsSnapshot;
    if (!snap) return;
    state.draft.tag = (snap.draft.tag || []).slice();
    state.draft.creator = snap.draft.creator;
    state.draft.xmp = snap.draft.xmp;
    state.draft.type = snap.draft.type;
    state.draft.format = (snap.draft.format || []).slice();
    state.draft.size = (snap.draft.size || []).slice();
    state.draft.duration = (snap.draft.duration || []).slice();
    state.draft.source = snap.draft.source || '';
    if ($('filterName')) {
      $('filterName').value = snap.draft.name || '';
      if (nameClearApi && nameClearApi.sync) nameClearApi.sync();
    }
    state.dateCleared = !!snap.dateCleared;
    if (!state.dateCleared && dateApi && snap.dateStart && snap.dateEnd) {
      dateApi.setRange(snap.dateStart, snap.dateEnd, null, true);
    }
    syncMainFilterLabels();
    if (tagSelect && tagSelect.render) tagSelect.render();
    if (formatSelect && formatSelect.render) formatSelect.render();
    if (sizeSelect && sizeSelect.render) sizeSelect.render();
    if (durationSelect && durationSelect.render) durationSelect.render();
    state.filterSettingsSnapshot = null;
  }

  function submitFilterSettings() {
    var selected = [];
    $('filterCheckGrid').querySelectorAll('.filter-setting-item > input[type="checkbox"]').forEach(function (input) {
      if (input.checked) selected.push(input.value);
    });
    selected = ALL_FILTERS.map(function (f) { return f.key; }).filter(function (key) {
      return selected.indexOf(key) >= 0;
    });
    state.visibleFilters = selected;
    state.filterSettingsSnapshot = null;
    state.filterVisibleDraft = null;
    if (UI.closePanels) UI.closePanels();
    UI.closeModal('filterModal');
    syncFilterBarVisibility();
    syncMainFilterLabels();
    UI.showToast('筛选项已更新', 'success');
  }

  function cancelFilterSettings() {
    restoreFilterSettingsSnapshot();
    state.filterVisibleDraft = null;
    if (UI.closePanels) UI.closePanels();
    UI.closeModal('filterModal');
  }

  function syncXmpYesNo(row) {
    return row.syncStatus === '已同步' ? '是' : '否';
  }

  function xmpTag(val) {
    var ok = val === '是';
    return '<span class="tag tag--' + (ok ? 'enabled' : 'disabled') + '">' + escapeHtml(val) + '</span>';
  }

  function applyFilters() {
    var useDate = isFilterVisible('date') && !state.dateCleared;
    state.applied = {
      folderId: state.folderId,
      tag: isFilterVisible('tag') ? (state.draft.tag || []).slice() : [],
      creator: isFilterVisible('creator') ? state.draft.creator : '',
      xmp: isFilterVisible('xmp') ? (state.draft.xmp || '') : '',
      type: isFilterVisible('type') ? (state.draft.type || '') : '',
      format: isFilterVisible('format') ? (state.draft.format || []).slice() : [],
      size: isFilterVisible('size') ? (state.draft.size || []).slice() : [],
      duration: isFilterVisible('duration') ? (state.draft.duration || []).slice() : [],
      source: isFilterVisible('source') ? (state.draft.source || '') : '',
      name: isFilterVisible('name') ? (($('filterName') && $('filterName').value) || '').trim() : '',
      start: useDate && dateApi ? dateApi.getStart() : null,
      end: useDate && dateApi ? dateApi.getEnd() : null
    };
    state.page = 1;
    state.selected = {};
    renderAll();
  }

  function inDateRange(row, start, end) {
    if (!start || !end) return true;
    var d = row.createdDate;
    function ymd(x) {
      return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
    }
    return d >= ymd(start) && d <= ymd(end);
  }

  function getCurrentFolderId() {
    var f = state.applied;
    return (f && f.folderId) ? f.folderId : state.folderId;
  }

  /** 当前目录下的直接子文件夹（默认库 → 自定义一级） */
  function getChildFolders(folderId) {
    if (!folderId || isSystemFolder(folderId)) return CUSTOM_FOLDERS.slice();
    var node = findFolderNode(folderId);
    return (node && node.children) ? node.children.slice() : [];
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

  function getFilteredRows() {
    var f = state.applied || {
      folderId: state.folderId,
      tag: [],
      creator: '',
      xmp: '',
      type: '',
      format: [],
      size: [],
      duration: [],
      source: '',
      name: '',
      start: (!state.dateCleared && dateApi) ? dateApi.getStart() : null,
      end: (!state.dateCleared && dateApi) ? dateApi.getEnd() : null
    };
    var folderId = f.folderId || state.folderId;
    var includeDesc = !!state.showSubfolderMaterials;
    return ALL_ROWS.filter(function (row) {
      if (folderId) {
        if (isSystemFolder(folderId)) {
          if (!includeDesc && row.folderId !== SYSTEM_FOLDER.id) return false;
        } else if (includeDesc) {
          if (row.folderId !== folderId && !isDescendantFolder(row.folderId, folderId)) return false;
        } else if (row.folderId !== folderId) {
          return false;
        }
      }
      if (f.tag && f.tag.length) {
        if (!f.tag.some(function (t) { return row.tags.indexOf(t) !== -1; })) return false;
      }
      if (f.creator && row.creator !== f.creator) return false;
      if (f.xmp && syncXmpYesNo(row) !== f.xmp) return false;
      if (f.type && row.type !== f.type) return false;
      if (f.format && f.format.length) {
        var fmt = String(row.format || '').toLowerCase();
        if (!f.format.some(function (x) { return String(x).toLowerCase() === fmt; })) return false;
      }
      if (f.size && f.size.length && f.size.indexOf(row.size) === -1) return false;
      if (f.duration && f.duration.length && !matchDurationBuckets(row.durationSec, f.duration)) return false;
      if (f.source && rowSource(row) !== f.source) return false;
      if (f.name) {
        var kw = f.name.toLowerCase();
        if (row.name.toLowerCase().indexOf(kw) === -1) return false;
      }
      if (!inDateRange(row, f.start, f.end)) return false;
      return true;
    }).sort(function (a, b) { return b.createdTs - a.createdTs; });
  }

  /** 列表条目：子文件夹行（可选）+ 素材行 */
  function getListEntries() {
    var materials = getFilteredRows();
    var folders = [];
    if (!state.showSubfolderMaterials) {
      folders = getChildFolders(getCurrentFolderId());
    }
    return folders.map(function (folder) {
      return { kind: 'folder', folder: folder };
    }).concat(materials.map(function (row) {
      return { kind: 'material', row: row };
    }));
  }

  function getPageEntries() {
    var entries = getListEntries();
    var total = entries.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    return {
      entries: entries,
      pageEntries: entries.slice(start, start + state.pageSize),
      total: total
    };
  }

  function getPageMaterialRows() {
    return getPageEntries().pageEntries
      .filter(function (e) { return e.kind === 'material'; })
      .map(function (e) { return e.row; });
  }

  function expandFolderAncestors(folderId) {
    if (!folderId || isSystemFolder(folderId)) return;
    var trail = getFolderTrail(folderId);
    var i;
    for (i = 0; i < trail.length - 1; i++) {
      state.collapsed[trail[i].id] = false;
    }
  }

  function scrollActiveFolderIntoView() {
    var root = $('folderTree');
    if (!root) return;
    var active = root.querySelector('.tree-node__row.is-active');
    if (!active || typeof active.scrollIntoView !== 'function') return;
    active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /** 切换当前文件夹：展开祖先、刷新列表，并定位左侧树选中项 */
  function navigateToFolder(folderId, opts) {
    opts = opts || {};
    if (!folderId) return;
    state.folderId = folderId;
    if (opts.clearFolderKw !== false && (state.folderKw || '').trim()) {
      state.folderKw = '';
      if ($('folderKw')) $('folderKw').value = '';
    }
    expandFolderAncestors(folderId);
    applyFilters();
    requestAnimationFrame(function () {
      scrollActiveFolderIntoView();
    });
  }

  function drillIntoFolder(folderId) {
    navigateToFolder(folderId);
  }

  function updateBreadcrumb() {
    var el = $('breadcrumb');
    if (!el) return;
    if (isSystemFolder(state.folderId)) {
      el.innerHTML =
        '<strong class="lib-breadcrumb__current">' + escapeHtml(SYSTEM_FOLDER.name) + '</strong>';
      return;
    }
    var trail = getFolderTrail(state.folderId);
    if (!trail.length) {
      el.innerHTML = '<strong class="lib-breadcrumb__current">' + escapeHtml(SYSTEM_FOLDER.name) + '</strong>';
      return;
    }
    el.innerHTML = trail.map(function (node, i) {
      var isLast = i === trail.length - 1;
      var item = isLast
        ? '<strong class="lib-breadcrumb__current">' + escapeHtml(node.name) + '</strong>'
        : '<button type="button" class="lib-breadcrumb__link" data-crumb="' + escapeHtml(node.id) + '">' +
            escapeHtml(node.name) +
          '</button>';
      if (i === 0) return item;
      return '<span class="lib-breadcrumb__sep" aria-hidden="true">/</span>' + item;
    }).join('');
  }

  function matchFolderKw(node) {
    var kw = (state.folderKw || '').trim().toLowerCase();
    if (!kw) return true;
    if (node.name.toLowerCase().indexOf(kw) !== -1) return true;
    return (node.children || []).some(matchFolderKw);
  }

  function renderFolderTree() {
    closeFolderMoreMenu();
    var root = $('folderTree');
    if (!root) return;

    function actionsHtml(node) {
      if (node.system) return '';
      return (
        '<button class="tree-node__more" type="button" data-folder-more="' + escapeHtml(node.id) + '"' +
          ' title="更多" aria-label="更多" aria-haspopup="menu">' + MORE_SVG + '</button>'
      );
    }

    function renderNode(node, depth, isCustom) {
      if (isCustom && !matchFolderKw(node)) return '';
      var hasChild = !!(node.children && node.children.length);
      var collapsed = !!state.collapsed[node.id];
      var active = state.folderId === node.id ? ' is-active' : '';
      var collapsedCls = collapsed ? ' is-collapsed' : '';
      var systemCls = node.system ? ' is-system' : '';
      var toggleCls = hasChild ? '' : ' is-leaf';
      var canDrag = isCustom && !(state.folderKw || '').trim();
      return (
        '<div class="tree-node' + collapsedCls + systemCls + '" data-id="' + escapeHtml(node.id) + '">' +
          '<div class="tree-node__row' + active + '" data-select="' + escapeHtml(node.id) + '" data-depth="' + depth + '"' +
            (canDrag ? ' draggable="true" data-folder-drag="' + escapeHtml(node.id) + '"' : '') +
            ' style="padding-left:' + (8 + depth * 20) + 'px">' +
            '<button class="tree-node__toggle' + toggleCls + '" type="button" data-toggle="' + escapeHtml(node.id) + '" aria-label="展开">' +
              TOGGLE_SVG +
            '</button>' +
            FOLDER_ICON +
            '<span class="tree-node__name" title="' + escapeHtml(node.name) + (node.system ? '（系统）' : '') + '">' +
              escapeHtml(node.name) +
            '</span>' +
            actionsHtml(node) +
          '</div>' +
          (hasChild ? '<div class="tree-node__children">' + (node.children || []).map(function (c) {
            return renderNode(c, depth + 1, true);
          }).join('') + '</div>' : '') +
        '</div>'
      );
    }

    var customHtml = CUSTOM_FOLDERS.map(function (n) {
      return renderNode(n, 0, true);
    }).join('');

    root.innerHTML =
      renderNode(SYSTEM_FOLDER, 0, false) +
      '<div class="tree-section-label">自定义文件夹</div>' +
      (customHtml || '<div class="tree-empty">暂无自定义文件夹</div>');
  }

  function metaText(row) {
    if (row.type === '视频') {
      return row.format + ' | ' + row.size + ' | ' + formatDuration(row.durationSec);
    }
    return row.format + ' | ' + row.size;
  }

  function tagsHtml(row, max) {
    var tags = sortTagsForDisplay(row.tags || []);
    if (typeof max === 'number') tags = tags.slice(0, max);
    return '<div class="tag-list">' + tags.map(function (t) {
      var cls = isSystemTagName(t) ? 'mat-tag mat-tag--system' : 'mat-tag';
      return '<span class="' + cls + '">' + escapeHtml(t) + '</span>';
    }).join('') + '</div>';
  }

  function gridMoreBtnHtml(attr, id) {
    return (
      '<button class="grid-card__more" type="button" ' + attr + '="' + escapeHtml(id) + '"' +
        ' title="更多" aria-label="更多" aria-haspopup="menu">' + MORE_SVG + '</button>'
    );
  }

  function cellEditBtnHtml(kind) {
    return '<button class="cell-edit-btn" type="button" data-quick="' + kind + '" aria-label="编辑" title="编辑">' +
      EDIT_SVG +
    '</button>';
  }

  function deliveryHtml(row) {
    if (!row.delivery.length) return '—';
    return '<span class="delivery-icons">' + row.delivery.map(function (k) {
      var p = PLATFORMS.find(function (x) { return x.key === k; });
      return '<span class="delivery-icon delivery-icon--' + k + '" title="' + escapeHtml((p && p.label) || k) + '">' +
        escapeHtml((p && p.label) || k) + '</span>';
    }).join('') + '</span>';
  }

  function syncHtml(row) {
    var tip = row.syncStatus === '同步失败' && row.failReason
      ? ' title="' + escapeHtml(row.failReason) + '"'
      : (row.xmpId ? ' title="XMP ID: ' + escapeHtml(row.xmpId) + '"' : '');
    return '<span class="sync-tag ' + (SYNC_CLASS[row.syncStatus] || '') + '"' + tip + '>' +
      escapeHtml(row.syncStatus) + '</span>';
  }

  var PLAY_ICON = '<span class="thumb__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z"/></svg></span>';

  function updateBatchBtn() {
    var btn = $('batchBtn');
    if (!btn) return;
    btn.disabled = getSelectedIds().length === 0;
  }

  function renderTable() {
    var page = getPageEntries();
    var pageEntries = page.pageEntries;
    var total = page.total;
    var body = $('tableBody');
    var empty = $('emptyTip');
    if (!body) return;

    var PH = '-';
    body.innerHTML = pageEntries.map(function (entry) {
      if (entry.kind === 'folder') {
        var folder = entry.folder;
        return (
          '<tr class="is-folder-row" data-folder-id="' + escapeHtml(folder.id) + '" title="进入文件夹">' +
            '<td class="col-check is-freeze"><span class="cell-check"><input type="checkbox" disabled aria-label="文件夹不可选" /></span></td>' +
            '<td class="col-id is-freeze">' + PH + '</td>' +
            '<td class="col-material is-freeze"><div class="folder-cell">' +
              '<span class="folder-cell__media">' +
                '<img class="folder-cell__icon" src="assets/文件夹.png" width="40" height="40" alt="" />' +
                folderCountBadgeHtml(folder.id) +
              '</span>' +
              '<div class="folder-cell__meta">' +
                '<span class="folder-cell__name" title="' + escapeHtml(folder.name) + '">' + escapeHtml(folder.name) + '</span>' +
              '</div>' +
            '</div></td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td class="col-duration">' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td>' + PH + '</td>' +
            '<td class="col-action">' + PH + '</td>' +
          '</tr>'
        );
      }
      var row = entry.row;
      var checked = state.selected[row.id] ? ' checked' : '';
      var playIcon = row.type === '视频' ? PLAY_ICON : '';
      var durationText = row.type === '视频' ? String(row.durationSec || 0) : '—';
      var nameNoExt = stripExt(row.name);
      var oss = row.ossUrl || buildOssUrl(row.name, new Date(row.createdTs || Date.now()), row.id, row.format);
      return (
        '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td class="col-check is-freeze"><span class="cell-check"><input type="checkbox" data-check="' + escapeHtml(row.id) + '"' + checked + ' aria-label="选择" /></span></td>' +
          '<td class="col-id is-freeze">' + escapeHtml(row.id) + '</td>' +
          '<td class="col-material is-freeze"><div class="material-cell">' +
            '<button class="thumb" type="button" data-preview="' + escapeHtml(row.id) + '" data-oss="' + escapeHtml(oss) + '" aria-label="打开素材">' +
              '<span class="thumb__preview" aria-hidden="true"></span>' + playIcon +
            '</button>' +
            '<div class="material-cell__meta">' +
              '<div class="material-cell__name-wrap">' +
                '<span class="material-cell__name" title="' + escapeHtml(nameNoExt) + '">' + escapeHtml(nameNoExt) + '</span>' +
                cellEditBtnHtml('name') +
              '</div>' +
            '</div>' +
          '</div></td>' +
          '<td class="col-tags"><div class="tag-cell">' + tagsHtml(row) + cellEditBtnHtml('tag') + '</div></td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td>' + escapeHtml(row.type) + '</td>' +
          '<td>' + escapeHtml(row.format) + '</td>' +
          '<td>' + escapeHtml(row.size) + '</td>' +
          '<td class="col-duration">' + escapeHtml(durationText) + '</td>' +
          '<td>' + escapeHtml(rowSource(row)) + '</td>' +
          '<td>' + xmpTag(syncXmpYesNo(row)) + '</td>' +
          '<td>' + escapeHtml(row.createdAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-act="detail">编辑</button>' +
            '<button class="link" type="button" data-act="download">下载</button>' +
            '<button class="link link--danger" type="button" data-act="delete">删除</button>' +
          '</span></td>' +
        '</tr>'
      );
    }).join('');

    if (empty) empty.hidden = total > 0;

    var checkAll = $('checkAll');
    if (checkAll) {
      var pageMats = getPageMaterialRows();
      var allChecked = pageMats.length > 0 && pageMats.every(function (r) { return state.selected[r.id]; });
      checkAll.checked = allChecked;
      checkAll.indeterminate = !allChecked && pageMats.some(function (r) { return state.selected[r.id]; });
    }

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });

    if (!state.paginationBound && UI.bindPagination) {
      UI.bindPagination({
        containerId: 'pagination',
        getPage: function () { return state.page; },
        getPageSize: function () { return state.pageSize; },
        getTotal: function () { return getListEntries().length; },
        onPageChange: function (p) { state.page = p; renderAll(); },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderAll();
        }
      });
      state.paginationBound = true;
    }

    if (window.ColResize) window.ColResize.initAll(document);
    updateBatchBtn();
  }

  function renderGrid() {
    var page = getPageEntries();
    var pageEntries = page.pageEntries;
    var total = page.total;
    var list = $('gridList');
    var empty = $('gridEmpty');
    if (!list) return;

    list.innerHTML = pageEntries.map(function (entry) {
      if (entry.kind === 'folder') {
        var folder = entry.folder;
        return (
          '<div class="grid-card grid-card--folder" data-folder-id="' + escapeHtml(folder.id) + '">' +
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
                gridMoreBtnHtml('data-folder-more', folder.id) +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }
      var row = entry.row;
      var checked = state.selected[row.id] ? ' checked' : '';
      var nameNoExt = stripExt(row.name);
      var oss = row.ossUrl || buildOssUrl(row.name, new Date(row.createdTs || Date.now()), row.id, row.format);
      var playIcon = row.type === '视频' ? PLAY_ICON : '';
      var sizeText = row.size || '—';
      var durationText = row.type === '视频' ? formatDuration(row.durationSec || 0) : '';
      return (
        '<div class="grid-card" data-id="' + escapeHtml(row.id) + '">' +
          '<span class="grid-card__check cell-check">' +
            '<input type="checkbox" data-check="' + escapeHtml(row.id) + '"' + checked + ' aria-label="选择" />' +
          '</span>' +
          '<div class="grid-card__stage">' +
            '<button class="grid-card__thumb" type="button" data-oss="' + escapeHtml(oss) + '" aria-label="打开素材">' +
              '<span class="grid-card__preview" aria-hidden="true"></span>' + playIcon +
            '</button>' +
            '<div class="grid-card__meta-bar" aria-hidden="true">' +
              '<span class="grid-card__meta-size">' + escapeHtml(sizeText) + '</span>' +
              (durationText
                ? '<span class="grid-card__meta-duration">' + escapeHtml(durationText) + '</span>'
                : '') +
            '</div>' +
          '</div>' +
          '<div class="grid-card__body">' +
            '<div class="grid-card__name-wrap">' +
              '<span class="grid-card__name" title="' + escapeHtml(nameNoExt) + '">' + escapeHtml(nameNoExt) + '</span>' +
              cellEditBtnHtml('name') +
            '</div>' +
            '<div class="grid-card__tags tag-cell">' +
              tagsHtml(row, 3) +
              gridMoreBtnHtml('data-material-more', row.id) +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    if (empty) empty.hidden = total > 0;

    UI.renderPagination({
      containerId: 'pagination',
      total: total,
      page: state.page,
      pageSize: state.pageSize
    });
    updateBatchBtn();
  }

  function syncViewMode() {
    var listView = $('listView');
    var gridView = $('gridView');
    if (listView) listView.hidden = state.view !== 'list';
    if (gridView) gridView.hidden = state.view !== 'grid';
    document.querySelectorAll('.view-switch__btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-view') === state.view);
    });
  }

  function syncNewFolderButtons() {
    var siderBtn = $('newFolderBtn');
    if (siderBtn) {
      siderBtn.disabled = false;
      siderBtn.title = '新建一级文件夹';
    }
    var toolbarBtn = $('newFolderToolbarBtn');
    if (toolbarBtn) {
      var disabled = isSystemFolder(state.folderId);
      toolbarBtn.disabled = disabled;
      toolbarBtn.title = disabled ? '全部素材不支持新建文件夹' : '新建文件夹';
    }
  }

  function renderAll() {
    updateBreadcrumb();
    renderFolderTree();
    syncNewFolderButtons();
    syncViewMode();
    if (state.view === 'grid') renderGrid();
    else renderTable();
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function getSelectedIds() {
    return Object.keys(state.selected).filter(function (id) {
      return state.selected[id] && !!findRow(id);
    });
  }

  /** 单行下载：调起浏览器本地下载 */
  function triggerBrowserDownload(filename, content) {
    var name = filename || 'material.bin';
    var blob = new Blob([content || ('prototype download: ' + name)], { type: 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadRow(row) {
    if (!row) return;
    triggerBrowserDownload(row.name || ('material_' + row.id + '.bin'));
  }

  function pushRows(ids, opts) {
    opts = opts || {};
    var targets = ids.map(findRow).filter(function (r) {
      return r && (r.syncStatus === '未同步' || r.syncStatus === '同步失败' || opts.force);
    });
    if (!targets.length) {
      if (!opts.silent) UI.showToast('没有可同步的素材');
      return;
    }
    targets.forEach(function (r) {
      r.syncStatus = '同步中';
      r.failReason = '';
    });
    renderAll();
    setTimeout(function () {
      targets.forEach(function (r, i) {
        if ((Number(r.id) + i) % 5 === 0) {
          r.syncStatus = '同步失败';
          r.failReason = 'XMP 限流';
          r.xmpId = '';
        } else {
          r.syncStatus = '已同步';
          r.xmpId = 'XMP' + String(80000 + Math.floor(Math.random() * 1000));
          r.failReason = '';
        }
      });
      renderAll();
      if (!opts.silent) {
        var ok = targets.filter(function (r) { return r.syncStatus === '已同步'; }).length;
        var fail = targets.length - ok;
        UI.showToast('同步完成：成功 ' + ok + (fail ? '，失败 ' + fail : ''), fail ? 'warning' : 'success');
      }
    }, 700);
  }

  function deleteRows(ids) {
    ALL_ROWS = ALL_ROWS.filter(function (r) { return ids.indexOf(r.id) === -1; });
    ids.forEach(function (id) { delete state.selected[id]; });
    renderAll();
    UI.showToast('删除成功', 'success');
  }

  function mockFileSizeText(row) {
    if (!row) return '—';
    var n = 1.2 + ((Number(row.id) || 0) % 80) / 10;
    return n.toFixed(2) + 'MB';
  }

  function closeDetailDrawer() {
    UI.closeDrawer('detailDrawer');
  }

  function openDetail(row) {
    if (!row) return;
    state.detail.id = row.id;
    state.detail.nameBase = stripExt(row.name);
    state.detail.format = row.format || fileExt(row.name) || '';
    state.detail.folderId = row.folderId || SYSTEM_FOLDER.id;
    state.detail.tags = (row.tags || []).slice();
    state.detail.creator = row.creator || '';

    if ($('detailId')) $('detailId').textContent = row.id;
    if ($('detailName')) $('detailName').value = state.detail.nameBase;
    if ($('detailCreatedAt')) $('detailCreatedAt').textContent = row.createdAt || '—';
    if ($('detailSource')) $('detailSource').textContent = row.source || '本地上传';
    if ($('detailFileSize')) $('detailFileSize').textContent = mockFileSizeText(row);
    if ($('detailType')) $('detailType').textContent = row.type || '—';
    if ($('detailFormat')) $('detailFormat').textContent = row.format || '—';
    if ($('detailDim')) $('detailDim').textContent = row.size || '—';
    if ($('detailDuration')) {
      $('detailDuration').textContent = row.type === '视频' ? (String(row.durationSec || 0) + ' 秒') : '—';
    }
    var play = $('detailPreviewPlay');
    if (play) play.hidden = row.type !== '视频';

    ['detailNameItem', 'detailFolderItem', 'detailCreatorItem'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.remove('is-error');
    });

    if (detailFolderSelect && detailFolderSelect.syncLabel) detailFolderSelect.syncLabel();
    if (detailCreatorSelect && detailCreatorSelect.syncLabel) detailCreatorSelect.syncLabel();
    if (detailTagSelect && detailTagSelect.render) detailTagSelect.render();
    else if (detailTagSelect && detailTagSelect.syncLabel) detailTagSelect.syncLabel();

    UI.openDrawer('detailDrawer');
  }

  function submitDetail() {
    var row = findRow(state.detail.id);
    if (!row) {
      closeDetailDrawer();
      return;
    }
    var nameBase = (($('detailName') && $('detailName').value) || '').trim();
    state.detail.nameBase = nameBase;
    var ok = true;
    if (!nameBase) {
      if ($('detailNameItem')) $('detailNameItem').classList.add('is-error');
      ok = false;
    } else if ($('detailNameItem')) {
      $('detailNameItem').classList.remove('is-error');
    }
    if (!state.detail.folderId) {
      if ($('detailFolderItem')) $('detailFolderItem').classList.add('is-error');
      ok = false;
    } else if ($('detailFolderItem')) {
      $('detailFolderItem').classList.remove('is-error');
    }
    if (!state.detail.creator) {
      if ($('detailCreatorItem')) $('detailCreatorItem').classList.add('is-error');
      ok = false;
    } else if ($('detailCreatorItem')) {
      $('detailCreatorItem').classList.remove('is-error');
    }
    if (!ok) return;

    var ext = state.detail.format || fileExt(row.name) || 'mp4';
    row.name = nameBase + (ext ? ('.' + ext) : '');
    row.folderId = state.detail.folderId;
    row.source = sourceForFolder(state.detail.folderId);
    row.tags = state.detail.tags.slice();
    row.creator = state.detail.creator;
    closeDetailDrawer();
    renderAll();
    UI.showToast('保存成功', 'success');
  }

  /* preview（浮层尺寸对齐采集素材） */
  var previewPop = $('previewPop');

  function showPreview(displayName, anchor) {
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

  /* events */
  if (UI.bindSidebar) UI.bindSidebar();

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close');
      if (id === 'filterModal') {
        cancelFilterSettings();
        return;
      }
      UI.closeModal(id);
    });
  });

  if ($('filterSettingBtn')) {
    $('filterSettingBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      openFilterSettings();
    });
  }
  if ($('filterSubmit')) {
    $('filterSubmit').addEventListener('click', submitFilterSettings);
  }

  syncFilterBarVisibility();

  $('folderTree').addEventListener('click', function (e) {
    var moreBtn = e.target.closest('[data-folder-more]');
    if (moreBtn) {
      e.stopPropagation();
      openFolderMoreMenu(moreBtn);
      return;
    }
    closeFolderMoreMenu();
    var toggle = e.target.closest('[data-toggle]');
    if (toggle && !toggle.classList.contains('is-leaf')) {
      e.stopPropagation();
      var tid = toggle.getAttribute('data-toggle');
      state.collapsed[tid] = !state.collapsed[tid];
      renderFolderTree();
      return;
    }
    var row = e.target.closest('[data-select]');
    if (!row) return;
    navigateToFolder(row.getAttribute('data-select') || SYSTEM_FOLDER.id, { clearFolderKw: false });
  });

  function clearFolderDropMarks() {
    document.querySelectorAll('.tree-node__row.is-drop-before, .tree-node__row.is-drop-after, .tree-node__row.is-dragging').forEach(function (el) {
      el.classList.remove('is-drop-before', 'is-drop-after', 'is-dragging');
    });
  }

  function sameParentList(aId, bId) {
    var aList = findParentList(aId);
    var bList = findParentList(bId);
    return !!(aList && bList && aList === bList);
  }

  function reorderSibling(dragId, targetId, place) {
    if (!dragId || !targetId || dragId === targetId) return false;
    var list = findParentList(dragId);
    if (!list || findParentList(targetId) !== list) return false;
    var from = list.findIndex(function (n) { return n.id === dragId; });
    if (from < 0) return false;
    var item = list.splice(from, 1)[0];
    var to = list.findIndex(function (n) { return n.id === targetId; });
    if (to < 0) {
      list.splice(from, 0, item);
      return false;
    }
    var insertAt = place === 'before' ? to : to + 1;
    list.splice(insertAt, 0, item);
    return true;
  }

  $('folderTree').addEventListener('dragstart', function (e) {
    var row = e.target.closest('[data-folder-drag]');
    if (!row || e.target.closest('[data-folder-more], [data-toggle]')) {
      e.preventDefault();
      return;
    }
    var id = row.getAttribute('data-folder-drag');
    if (!id || isSystemFolder(id)) {
      e.preventDefault();
      return;
    }
    closeFolderMoreMenu();
    state.dragFolderId = id;
    row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  });

  $('folderTree').addEventListener('dragend', function () {
    state.dragFolderId = null;
    clearFolderDropMarks();
  });

  $('folderTree').addEventListener('dragover', function (e) {
    var dragId = state.dragFolderId;
    if (!dragId) return;
    var row = e.target.closest('[data-folder-drag]');
    if (!row) return;
    var targetId = row.getAttribute('data-folder-drag');
    if (!targetId || targetId === dragId || !sameParentList(dragId, targetId)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearFolderDropMarks();
    var dragging = document.querySelector('.tree-node__row[data-folder-drag="' + dragId + '"]');
    if (dragging) dragging.classList.add('is-dragging');
    var rect = row.getBoundingClientRect();
    var place = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    row.classList.add(place === 'before' ? 'is-drop-before' : 'is-drop-after');
    row.setAttribute('data-drop-place', place);
  });

  $('folderTree').addEventListener('dragleave', function (e) {
    var row = e.target.closest('[data-folder-drag]');
    if (!row) return;
    if (row.contains(e.relatedTarget)) return;
    row.classList.remove('is-drop-before', 'is-drop-after');
    row.removeAttribute('data-drop-place');
  });

  $('folderTree').addEventListener('drop', function (e) {
    var dragId = state.dragFolderId;
    var row = e.target.closest('[data-folder-drag]');
    if (!dragId || !row) {
      clearFolderDropMarks();
      state.dragFolderId = null;
      return;
    }
    e.preventDefault();
    var targetId = row.getAttribute('data-folder-drag');
    var place = row.getAttribute('data-drop-place') ||
      (e.clientY < row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2 ? 'before' : 'after');
    clearFolderDropMarks();
    state.dragFolderId = null;
    if (reorderSibling(dragId, targetId, place)) {
      renderFolderTree();
    }
  });

  $('folderKw').addEventListener('input', function () {
    state.folderKw = ($('folderKw').value || '').trim();
    renderFolderTree();
  });

  function clearFolderFormError() {
    var item = $('folderNameItem');
    if (item) item.classList.remove('is-error');
    var err = $('folderNameError');
    if (err) err.textContent = '请输入文件夹名称';
  }

  function closeFolderMoreMenu() {
    var menu = $('folderMoreMenu');
    if (menu) {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.tree-node__more.is-open, .grid-card__more.is-open').forEach(function (btn) {
      btn.classList.remove('is-open');
    });
    state.folderMoreId = null;
  }

  function closeMaterialMoreMenu() {
    var menu = $('materialMoreMenu');
    if (menu) {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.grid-card__more[data-material-more].is-open').forEach(function (btn) {
      btn.classList.remove('is-open');
    });
    state.materialMoreId = null;
  }

  function positionMoreMenu(menu, btn) {
    var rect = btn.getBoundingClientRect();
    var mw = menu.offsetWidth || 120;
    var mh = menu.offsetHeight || 140;
    var left = Math.min(rect.right - mw, window.innerWidth - mw - 8);
    left = Math.max(8, left);
    var top = rect.bottom + 4;
    if (top + mh > window.innerHeight - 8) {
      top = Math.max(8, rect.top - mh - 4);
    }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function openFolderMoreMenu(btn) {
    var id = btn.getAttribute('data-folder-more');
    var menu = $('folderMoreMenu');
    if (!menu || !id || isSystemFolder(id)) return;
    if (state.folderMoreId === id && menu.classList.contains('is-open')) {
      closeFolderMoreMenu();
      return;
    }
    closeMaterialMoreMenu();
    closeFolderMoreMenu();
    state.folderMoreId = id;
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    positionMoreMenu(menu, btn);
  }

  function openMaterialMoreMenu(btn) {
    var id = btn.getAttribute('data-material-more');
    var menu = $('materialMoreMenu');
    if (!menu || !id) return;
    if (state.materialMoreId === id && menu.classList.contains('is-open')) {
      closeMaterialMoreMenu();
      return;
    }
    closeFolderMoreMenu();
    closeMaterialMoreMenu();
    state.materialMoreId = id;
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    positionMoreMenu(menu, btn);
  }

  function openFolderCreate(parentId) {
    parentId = parentId || state.folderId || SYSTEM_FOLDER.id;
    state.folderModal = { mode: 'create', parentId: parentId, targetId: null };
    if ($('folderTitle')) $('folderTitle').textContent = '新建文件夹';
    var parentItem = $('folderParentItem');
    if (parentItem) parentItem.hidden = false;
    if ($('folderParentLabel')) {
      $('folderParentLabel').value = isSystemFolder(parentId)
        ? '自定义文件夹（根级）'
        : (getFolderPath(parentId) || '自定义文件夹');
    }
    if ($('folderNameInput')) $('folderNameInput').value = '';
    clearFolderFormError();
    UI.openModal('folderModal');
  }

  function openFolderRename(id) {
    if (isSystemFolder(id)) {
      UI.showToast('系统文件夹不可编辑');
      return;
    }
    var node = findFolderNode(id);
    if (!node) return;
    state.folderModal = { mode: 'rename', parentId: '', targetId: id };
    if ($('folderTitle')) $('folderTitle').textContent = '编辑文件夹';
    var parentItem = $('folderParentItem');
    if (parentItem) parentItem.hidden = true;
    if ($('folderNameInput')) $('folderNameInput').value = node.name;
    clearFolderFormError();
    UI.openModal('folderModal');
  }

  function openFolderDelete(id) {
    if (isSystemFolder(id)) {
      UI.showToast('系统文件夹不可删除');
      return;
    }
    var node = findFolderNode(id);
    if (!node) return;
    state.deleteFolderId = id;
    if ($('deleteFolderText')) {
      $('deleteFolderText').textContent = '此操作不可撤销，确认删除文件夹及文件夹下所有的素材？';
    }
    UI.openModal('deleteFolderModal');
  }

  function getMoveParentOptions(excludeId) {
    var opts = [{ value: SYSTEM_FOLDER.id, label: '自定义文件夹（根级）' }];
    function walk(nodes, parentPath) {
      (nodes || []).forEach(function (node) {
        if (node.id === excludeId) return;
        var path = parentPath ? parentPath + ' / ' + node.name : node.name;
        opts.push({ value: node.id, label: path });
        walk(node.children || [], path);
      });
    }
    walk(CUSTOM_FOLDERS, '');
    return opts;
  }

  function getFolderParentId(id) {
    if (!id || isSystemFolder(id)) return null;
    if (CUSTOM_FOLDERS.some(function (n) { return n.id === id; })) return SYSTEM_FOLDER.id;
    var found = null;
    walkFolders(CUSTOM_FOLDERS, '', function (node) {
      (node.children || []).forEach(function (c) {
        if (c.id === id) found = node.id;
      });
    });
    return found;
  }

  var moveFolderParentApi = null;

  function openFolderMove(id) {
    if (isSystemFolder(id)) {
      UI.showToast('系统文件夹不可移动');
      return;
    }
    var node = findFolderNode(id);
    if (!node) return;
    state.moveFolderId = id;
    state.moveFolderParentId = getFolderParentId(id) || SYSTEM_FOLDER.id;
    var item = $('moveFolderParentItem');
    if (item) item.classList.remove('is-error');
    renderMoveParentOptions(id);
    if (moveFolderParentApi && moveFolderParentApi.syncLabel) {
      moveFolderParentApi.syncLabel(state.moveFolderParentId);
    }
    UI.openModal('moveFolderModal');
  }

  function renderMoveParentOptions(excludeId) {
    var panel = $('moveFolderParentPanel');
    if (!panel) return;
    panel.innerHTML = getMoveParentOptions(excludeId).map(function (o) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(o.value) + '">' +
        escapeHtml(o.label) + '</button>';
    }).join('');
  }

  function formatMoveParentLabel(value) {
    var opts = getMoveParentOptions(state.moveFolderId);
    var hit = opts.find(function (o) { return String(o.value) === String(value); });
    return hit ? hit.label : (value || '');
  }

  function moveFolderToParent(id, newParentId) {
    var node = findFolderNode(id);
    var list = findParentList(id);
    if (!node || !list) return { ok: false };
    var curParent = getFolderParentId(id);
    if (curParent === newParentId) return { ok: true, name: node.name, autoRenamed: false };
    var siblingNames = getSiblingNames(newParentId);
    var desiredName = node.name;
    var finalName = allocateSiblingFolderName(desiredName, siblingNames);
    var idx = list.findIndex(function (n) { return n.id === id; });
    if (idx < 0) return { ok: false };
    list.splice(idx, 1);
    if (isSystemFolder(newParentId)) {
      CUSTOM_FOLDERS.push(node);
    } else {
      var parent = findFolderNode(newParentId);
      if (!parent || parent.system) {
        list.splice(idx, 0, node);
        UI.showToast('目标父级目录不存在', 'error');
        return { ok: false };
      }
      parent.children = parent.children || [];
      parent.children.push(node);
      state.collapsed[parent.id] = false;
    }
    node.name = finalName;
    return { ok: true, name: finalName, autoRenamed: finalName !== desiredName };
  }

  $('folderMoreMenu').addEventListener('click', function (e) {
    var item = e.target.closest('[data-folder-menu]');
    if (!item) return;
    e.stopPropagation();
    var act = item.getAttribute('data-folder-menu');
    var fid = state.folderMoreId;
    closeFolderMoreMenu();
    if (!fid) return;
    if (act === 'add') openFolderCreate(fid);
    else if (act === 'edit') openFolderRename(fid);
    else if (act === 'move') openFolderMove(fid);
    else if (act === 'delete') openFolderDelete(fid);
  });

  if ($('materialMoreMenu')) {
    $('materialMoreMenu').addEventListener('click', function (e) {
      var item = e.target.closest('[data-material-menu]');
      if (!item) return;
      e.stopPropagation();
      var act = item.getAttribute('data-material-menu');
      var mid = state.materialMoreId;
      closeMaterialMoreMenu();
      if (!mid) return;
      var row = findRow(mid);
      if (!row) return;
      if (act === 'edit') openDetail(row);
      else if (act === 'download') downloadRow(row);
      else if (act === 'delete') {
        state.deleteIds = [row.id];
        if ($('deleteText')) {
          $('deleteText').textContent = '此操作不可撤销，确认删除吗？';
        }
        UI.openModal('deleteModal');
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#folderMoreMenu') || e.target.closest('[data-folder-more]')) return;
    closeFolderMoreMenu();
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('#materialMoreMenu') || e.target.closest('[data-material-more]')) return;
    closeMaterialMoreMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeFolderMoreMenu();
      closeMaterialMoreMenu();
    }
  });

  window.addEventListener('scroll', function () {
    closeFolderMoreMenu();
    closeMaterialMoreMenu();
  }, true);
  window.addEventListener('resize', function () {
    closeFolderMoreMenu();
    closeMaterialMoreMenu();
  });

  function openNewFolderAtRoot() {
    openFolderCreate(SYSTEM_FOLDER.id);
  }

  function openNewFolder() {
    if (isSystemFolder(state.folderId)) {
      UI.showToast('全部素材不支持新建文件夹');
      return;
    }
    openFolderCreate(state.folderId);
  }

  $('newFolderBtn').addEventListener('click', openNewFolderAtRoot);
  $('newFolderToolbarBtn').addEventListener('click', openNewFolder);

  if (UI.bindSingleSelect && $('moveFolderParentWrap')) {
    moveFolderParentApi = UI.bindSingleSelect({
      wrapId: 'moveFolderParentWrap',
      triggerId: 'moveFolderParentTrigger',
      panelId: 'moveFolderParentPanel',
      labelId: 'moveFolderParentLabel',
      getValue: function () { return state.moveFolderParentId; },
      formatValue: formatMoveParentLabel,
      onChange: function (v) {
        state.moveFolderParentId = v || '';
        var item = $('moveFolderParentItem');
        if (item) item.classList.remove('is-error');
      }
    });
  }

  if ($('moveFolderSubmit')) {
    $('moveFolderSubmit').addEventListener('click', function () {
      var id = state.moveFolderId;
      var parentId = state.moveFolderParentId;
      if (!id) {
        UI.closeModal('moveFolderModal');
        return;
      }
      if (!parentId) {
        var item = $('moveFolderParentItem');
        if (item) item.classList.add('is-error');
        return;
      }
      var moved = moveFolderToParent(id, parentId);
      if (!moved.ok) return;
      state.moveFolderId = null;
      UI.closeModal('moveFolderModal');
      expandFolderAncestors(state.folderId);
      renderAll();
      if (moved.autoRenamed) {
        UI.showToast('文件夹已移动，因同名已命名为 ' + moved.name, 'success');
      } else {
        UI.showToast('文件夹已移动', 'success');
      }
    });
  }

  function findParentList(id) {
    function walk(list) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === id) return list;
        var found = walk(list[i].children || []);
        if (found) return found;
      }
      return null;
    }
    return walk(CUSTOM_FOLDERS);
  }

  $('folderSubmit').addEventListener('click', function () {
    var name = (($('folderNameInput') && $('folderNameInput').value) || '').trim();
    var item = $('folderNameItem');
    if (!name) {
      if (item) item.classList.add('is-error');
      return;
    }
    var mode = state.folderModal.mode;

    if (mode === 'rename') {
      var targetId = state.folderModal.targetId;
      var node = findFolderNode(targetId);
      if (!node || node.system) {
        UI.showToast('文件夹不存在');
        return;
      }
      var siblings = findParentList(targetId) || [];
      var occupied = siblings
        .filter(function (s) { return s.id !== targetId; })
        .map(function (s) { return s.name; });
      var finalRename = allocateSiblingFolderName(name, occupied);
      node.name = finalRename;
      UI.closeModal('folderModal');
      renderAll();
      notifyFolderAutoRename(name, finalRename);
      if (finalRename === name) UI.showToast('文件夹已重命名', 'success');
      return;
    }

    var parentId = state.folderModal.parentId || SYSTEM_FOLDER.id;
    var finalName = allocateSiblingFolderName(name, getSiblingNames(parentId));
    var neo = { id: 'f' + (++folderSeq), name: finalName, children: [] };
    if (isSystemFolder(parentId)) {
      CUSTOM_FOLDERS.push(neo);
    } else {
      var parent = findFolderNode(parentId);
      if (!parent || parent.system) {
        UI.showToast('父级目录不存在');
        return;
      }
      parent.children = parent.children || [];
      parent.children.push(neo);
      state.collapsed[parent.id] = false;
    }
    UI.closeModal('folderModal');
    renderFolderTree();
    notifyFolderAutoRename(name, finalName);
    if (finalName === name) UI.showToast('文件夹已创建', 'success');
  });

  $('deleteFolderOk').addEventListener('click', function () {
    var id = state.deleteFolderId;
    if (!id || isSystemFolder(id)) {
      UI.closeModal('deleteFolderModal');
      return;
    }
    var node = findFolderNode(id);
    if (!node) {
      UI.closeModal('deleteFolderModal');
      return;
    }
    var removedIds = collectFolderIds(node);
    ALL_ROWS = ALL_ROWS.filter(function (r) {
      return removedIds.indexOf(r.folderId) === -1;
    });
    Object.keys(state.selected).forEach(function (mid) {
      if (!ALL_ROWS.some(function (r) { return r.id === mid; })) {
        delete state.selected[mid];
      }
    });
    var list = findParentList(id);
    if (list) {
      var idx = list.findIndex(function (n) { return n.id === id; });
      if (idx >= 0) list.splice(idx, 1);
    }
    if (removedIds.indexOf(state.folderId) !== -1) {
      state.folderId = SYSTEM_FOLDER.id;
    }
    state.deleteFolderId = null;
    UI.closeModal('deleteFolderModal');
    applyFilters();
    UI.showToast('文件夹已删除', 'success');
  });

  $('queryBtn').addEventListener('click', applyFilters);

  if ($('breadcrumb')) {
    $('breadcrumb').addEventListener('click', function (e) {
      var link = e.target.closest('[data-crumb]');
      if (!link || !$('breadcrumb').contains(link)) return;
      var id = link.getAttribute('data-crumb');
      if (!id || id === state.folderId) return;
      navigateToFolder(id);
    });
  }

  document.querySelectorAll('.view-switch__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.view = btn.getAttribute('data-view') || 'list';
      renderAll();
    });
  });

  if ($('showSubfolderMaterials')) {
    $('showSubfolderMaterials').checked = !!state.showSubfolderMaterials;
    $('showSubfolderMaterials').addEventListener('change', function () {
      state.showSubfolderMaterials = !!$('showSubfolderMaterials').checked;
      state.page = 1;
      state.selected = {};
      renderAll();
    });
  }

  if (UI.bindBatchMenu) {
    UI.bindBatchMenu({
      wrapId: 'batchWrap',
      btnId: 'batchBtn',
      menuId: 'batchMenu',
      onAction: function (action) {
        var ids = getSelectedIds();
        if (!ids.length) {
          UI.showToast('请先勾选素材');
          return;
        }
        if (action === 'download') {
          if (window.DownloadTaskStore && DownloadTaskStore.createPack) {
            DownloadTaskStore.createPack({ source: '本地素材', count: ids.length });
          }
          UI.showToast('下载任务已创建，请到任务中心查看', 'success');
          return;
        }
        if (action === 'push') pushRows(ids);
        if (action === 'tag') {
          openBatchTagModal(ids);
          return;
        }
        if (action === 'delete') {
          state.deleteIds = ids;
          if ($('deleteText')) {
            $('deleteText').textContent = '此操作不可撤销，确认删除吗？';
          }
          UI.openModal('deleteModal');
        }
      }
    });
  }

  function onCheckChange(id, checked) {
    state.selected[id] = checked;
    updateBatchBtn();
    if (state.view === 'list') {
      var checkAll = $('checkAll');
      if (checkAll) {
        var pageMats = getPageMaterialRows();
        var allChecked = pageMats.length > 0 && pageMats.every(function (r) { return state.selected[r.id]; });
        checkAll.checked = allChecked;
        checkAll.indeterminate = !allChecked && pageMats.some(function (r) { return state.selected[r.id]; });
      }
    }
  }

  $('libContent').addEventListener('change', function (e) {
    var check = e.target.closest('[data-check]');
    if (!check) return;
    onCheckChange(check.getAttribute('data-check'), check.checked);
  });

  $('checkAll').addEventListener('change', function () {
    var on = $('checkAll').checked;
    getPageMaterialRows().forEach(function (r) { state.selected[r.id] = on; });
    renderAll();
  });

  function closeNameEditPop() {
    var pop = $('nameEditPop');
    if (!pop) return;
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    state.nameEditId = null;
  }

  function startQuickNameEdit(row, btn) {
    if (!row || !btn) return;
    hidePreview();
    var pop = $('nameEditPop');
    var input = $('nameEditInput');
    if (!pop || !input) return;
    state.nameEditId = row.id;
    input.value = stripExt(row.name);
    pop.classList.add('is-open');
    pop.setAttribute('aria-hidden', 'false');

    var rect = btn.getBoundingClientRect();
    var popW = 320;
    var left = rect.left;
    var top = rect.bottom + 4;
    if (left + popW > window.innerWidth - 16) left = window.innerWidth - popW - 16;
    if (left < 16) left = 16;
    if (top + 120 > window.innerHeight - 16) top = Math.max(16, rect.top - 120);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';

    setTimeout(function () {
      input.focus();
      input.select();
    }, 0);
  }

  function commitNameEdit() {
    var id = state.nameEditId;
    var row = id ? findRow(id) : null;
    var input = $('nameEditInput');
    if (!row || !input) {
      closeNameEditPop();
      return;
    }
    var v = (input.value || '').trim();
    if (!v) {
      UI.showToast('请输入素材名称', 'error');
      input.focus();
      return;
    }
    var ext = row.format || fileExt(row.name) || '';
    row.name = v + (ext ? ('.' + ext) : '');
    row.ossUrl = buildOssUrl(row.name, new Date(row.createdTs || Date.now()), row.id, row.format);
    closeNameEditPop();
    renderAll();
    UI.showToast('修改成功', 'success');
  }

  function openQuickTagEdit(row) {
    if (!row) return;
    hidePreview();
    closeNameEditPop();
    state.batchTagIds = [row.id];
    state.batchTags = (row.tags || []).slice();
    if (batchTagSelect && batchTagSelect.render) batchTagSelect.render();
    else if (batchTagSelect && batchTagSelect.syncLabel) batchTagSelect.syncLabel();
    UI.openModal('batchTagModal');
  }

  if ($('nameEditOk')) {
    $('nameEditOk').addEventListener('click', function (e) {
      e.stopPropagation();
      commitNameEdit();
    });
  }
  if ($('nameEditCancel')) {
    $('nameEditCancel').addEventListener('click', function (e) {
      e.stopPropagation();
      closeNameEditPop();
    });
  }
  if ($('nameEditInput')) {
    $('nameEditInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitNameEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeNameEditPop();
      }
    });
    $('nameEditInput').addEventListener('click', function (e) { e.stopPropagation(); });
  }
  if ($('nameEditPop')) {
    $('nameEditPop').addEventListener('click', function (e) { e.stopPropagation(); });
  }
  document.addEventListener('click', function (e) {
    if (!$('nameEditPop') || !$('nameEditPop').classList.contains('is-open')) return;
    if (e.target.closest('#nameEditPop') || e.target.closest('[data-quick="name"]')) return;
    closeNameEditPop();
  });

  $('tableBody').addEventListener('mouseover', function (e) {
    var btn = e.target.closest('[data-preview]');
    if (!btn) return;
    if ($('nameEditPop') && $('nameEditPop').classList.contains('is-open')) return;
    var row = findRow(btn.getAttribute('data-preview'));
    if (!row) return;
    showPreview(stripExt(row.name), btn);
  });
  $('tableBody').addEventListener('mouseout', function (e) {
    if (e.target.closest('[data-preview]')) hidePreview();
  });

  $('tableBody').addEventListener('click', function (e) {
    var folderTr = e.target.closest('tr[data-folder-id]');
    if (folderTr) {
      if (e.target.closest('input[type="checkbox"]')) return;
      drillIntoFolder(folderTr.getAttribute('data-folder-id'));
      return;
    }
    var quick = e.target.closest('[data-quick]');
    if (quick) {
      e.preventDefault();
      e.stopPropagation();
      var qTr = quick.closest('tr');
      var qRow = qTr ? findRow(qTr.getAttribute('data-id')) : null;
      if (!qRow) return;
      var kind = quick.getAttribute('data-quick');
      if (kind === 'name') startQuickNameEdit(qRow, quick);
      else if (kind === 'tag') openQuickTagEdit(qRow);
      return;
    }
    var thumb = e.target.closest('[data-oss]');
    if (thumb) {
      var oss = thumb.getAttribute('data-oss');
      if (oss) window.open(oss, '_blank', 'noopener,noreferrer');
      return;
    }
    var act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    var tr = act.closest('tr');
    var row = tr ? findRow(tr.getAttribute('data-id')) : null;
    if (!row) return;
    var a = act.getAttribute('data-act');
    if (a === 'detail') openDetail(row);
    else if (a === 'download') {
      downloadRow(row);
    } else if (a === 'delete') {
      state.deleteIds = [row.id];
      if ($('deleteText')) {
        $('deleteText').textContent = '此操作不可撤销，确认删除吗？';
      }
      UI.openModal('deleteModal');
    }
  });

  $('gridList').addEventListener('click', function (e) {
    if (e.target.closest('[data-check]')) {
      e.stopPropagation();
      return;
    }
    var folderMore = e.target.closest('[data-folder-more]');
    if (folderMore) {
      e.preventDefault();
      e.stopPropagation();
      openFolderMoreMenu(folderMore);
      return;
    }
    var materialMore = e.target.closest('[data-material-more]');
    if (materialMore) {
      e.preventDefault();
      e.stopPropagation();
      openMaterialMoreMenu(materialMore);
      return;
    }
    var quick = e.target.closest('[data-quick]');
    if (quick) {
      e.preventDefault();
      e.stopPropagation();
      var qCard = quick.closest('[data-id]');
      var qRow = qCard ? findRow(qCard.getAttribute('data-id')) : null;
      if (!qRow) return;
      if (quick.getAttribute('data-quick') === 'name') startQuickNameEdit(qRow, quick);
      return;
    }
    var ossBtn = e.target.closest('[data-oss]');
    if (ossBtn && ossBtn.closest('#gridList')) {
      var oss = ossBtn.getAttribute('data-oss');
      if (oss) window.open(oss, '_blank', 'noopener,noreferrer');
      return;
    }
    var folderOpen = e.target.closest('[data-folder-open]');
    if (folderOpen) {
      drillIntoFolder(folderOpen.getAttribute('data-folder-open'));
    }
  });

  $('deleteOk').addEventListener('click', function () {
    deleteRows(state.deleteIds.slice());
    state.deleteIds = [];
    UI.closeModal('deleteModal');
  });

  /* upload drawer */
  var UPLOAD_MAX = 500;
  var uploadUid = 1;
  var uploadProgressTimer = null;

  function canRetryItem(item) {
    return item && item.status === 'failed';
  }

  function canDeleteItem(item) {
    return item && (item.status === 'failed' || item.status === 'pending');
  }

  function isUploadBusyItem(item) {
    return item && item.status === 'uploading';
  }

  function hasUploadingItems() {
    return state.upload.items.some(isUploadBusyItem);
  }

  function countUploadingItems() {
    return state.upload.items.filter(isUploadBusyItem).length;
  }

  function getSelectedUploadItems() {
    return state.upload.items.filter(function (it) { return state.upload.selected[it.uid]; });
  }

  function uploadProgressHtml(item) {
    if (item.status === 'failed') {
      return UI.taskStatusDot ? UI.taskStatusDot('已失败') : '<span class="status-dot status-dot--error">已失败</span>';
    }
    if (item.status === 'done') {
      return UI.taskStatusDot ? UI.taskStatusDot('已完成') : '<span class="status-dot status-dot--done">已完成</span>';
    }
    var pct = Math.max(0, Math.min(100, Math.round(Number(item.progress) || 0)));
    return (
      '<div class="upload-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
        '<div class="upload-progress__track" aria-hidden="true"><span class="upload-progress__fill" style="width:' + pct + '%"></span></div>' +
        '<span class="upload-progress__text">' + pct + '%</span>' +
      '</div>'
    );
  }

  function uploadActionHtml(item) {
    var retryOff = !canRetryItem(item);
    var delOff = !canDeleteItem(item);
    return (
      '<span class="action-links">' +
        '<button class="link' + (retryOff ? ' is-disabled' : '') + '" type="button" data-up-act="retry" data-uid="' + item.uid + '"' +
          (retryOff ? ' disabled' : '') + '>重试</button>' +
        '<button class="link link--danger' + (delOff ? ' is-disabled' : '') + '" type="button" data-up-act="delete" data-uid="' + item.uid + '"' +
          (delOff ? ' disabled' : '') + '>删除</button>' +
      '</span>'
    );
  }

  function syncUploadBusy() {
    var uploading = hasUploadingItems();
    var transferring = !!uploadProgressTimer;
    state.upload.uploading = transferring;
    var panel = document.querySelector('#uploadDrawer .drawer');
    if (panel) panel.classList.toggle('is-uploading', transferring);
    var submit = $('upSubmit');
    if (submit) submit.disabled = uploading;
  }

  function stopUploadProgressTimer() {
    if (uploadProgressTimer) {
      clearInterval(uploadProgressTimer);
      uploadProgressTimer = null;
    }
  }

  function patchUploadProgressCells() {
    state.upload.items.forEach(function (item) {
      var cell = document.querySelector('#upFileBody tr[data-uid="' + item.uid + '"] td[data-col="progress"]');
      if (cell) cell.innerHTML = uploadProgressHtml(item);
    });
  }

  function ensureUploadProgressTimer() {
    if (uploadProgressTimer) return;
    uploadProgressTimer = setInterval(function () {
      var anyUploading = false;
      var statusChanged = false;
      state.upload.items.forEach(function (item) {
        if (item.status !== 'uploading') return;
        anyUploading = true;
        item.progress = Math.min(100, (Number(item.progress) || 0) + (item.progressSpeed || 8));
        if (item.failAt != null && item.progress >= item.failAt) {
          item.status = 'failed';
          item.progress = item.failAt;
          item.failAt = null;
          statusChanged = true;
          return;
        }
        if (item.progress >= 100) {
          item.progress = 100;
          item.status = 'done';
          statusChanged = true;
        }
      });
      patchUploadProgressCells();
      if (statusChanged) {
        syncUploadBusy();
        renderUploadTable();
      }
      if (!anyUploading) {
        stopUploadProgressTimer();
        syncUploadBusy();
      }
    }, 220);
  }

  function retryUploadItems(items) {
    var targets = (items || []).filter(canRetryItem);
    if (!targets.length) {
      UI.showToast('请选择上传失败的素材');
      return;
    }
    targets.forEach(function (item, i) {
      item.status = 'uploading';
      item.progress = 0;
      item.failAt = null;
      item.progressSpeed = 8 + ((i * 5) % 10);
    });
    renderUploadTable();
    ensureUploadProgressTimer();
    syncUploadBusy();
  }

  function startPendingUploads() {
    var started = 0;
    state.upload.items.forEach(function (item, i) {
      if (item.status === 'pending') {
        item.status = 'uploading';
        item.failAt = (i % 5 === 4) ? (35 + (i % 4) * 12) : null;
        item.progressSpeed = 6 + ((i * 7) % 11);
        started++;
        return;
      }
      if (item.status === 'uploading') {
        if (!item.progressSpeed) item.progressSpeed = 6 + ((i * 7) % 11);
        started++;
      }
    });
    if (!started) {
      if (state.upload.items.some(canRetryItem)) {
        UI.showToast('存在上传失败的素材，请重试');
      } else {
        UI.showToast('没有待上传的素材');
      }
      return false;
    }
    renderUploadTable();
    ensureUploadProgressTimer();
    syncUploadBusy();
    return true;
  }

  function getUploadSummary() {
    var total = state.upload.items.length;
    var done = 0;
    var failed = 0;
    state.upload.items.forEach(function (it) {
      if (it.status === 'done') done++;
      else if (it.status === 'failed') failed++;
    });
    return { total: total, done: done, failed: failed };
  }

  function openSubmitUploadConfirm() {
    var s = getUploadSummary();
    var text = $('submitUploadText');
    if (text) {
      text.textContent = '上传素材共' + s.total + '个，已完成' + s.done + '个，已失败' + s.failed + '个。';
    }
    UI.openModal('submitUploadModal');
  }

  function commitUploadedItems() {
    var now = new Date();
    var newIds = [];
    var targetFolder = state.upload.folderId;
    var tags = withoutSystemTags(state.upload.tags).length ? withoutSystemTags(state.upload.tags) : ['英语'];
    var ready = state.upload.items.filter(function (item) { return item.status === 'done'; });
    ready.forEach(function (item, i) {
      var id = String(materialSeq++);
      newIds.push(id);
      var ext = item.format && item.format !== '—' ? item.format : fileExt(item.name) || 'mp4';
      var isImage = item.mediaType === '图片' || ['png', 'jpg', 'jpeg', 'webp', 'gif'].indexOf(ext) !== -1;
      var fullName = item.name.indexOf('.') > 0 ? item.name : (item.name + '.' + ext);
      ALL_ROWS.unshift({
        id: id,
        name: fullName,
        folderId: targetFolder,
        type: isImage ? '图片' : '视频',
        format: ext,
        size: item.sizeDim && item.sizeDim !== '—' ? item.sizeDim : '1080x1920',
        durationSec: isImage ? 0 : 12 + i,
        tags: tags,
        creator: state.upload.creator,
        createdAt: formatDateTime(now),
        createdDate: formatDateYMD(now),
        createdTs: now.getTime() + i,
        status: '启用',
        syncStatus: '未同步',
        xmpId: '',
        failReason: '',
        delivery: [],
        source: sourceForFolder(targetFolder),
        ossUrl: buildOssUrl(fullName, now, id, ext)
      });
    });
    syncUploadBusy();
    if (UI.closeModal) UI.closeModal('submitUploadModal');
    closeUploadDrawer();
    UI.showToast('已上传 ' + newIds.length + ' 个素材', 'success');
    applyFilters();
    pushRows(newIds, { force: true, silent: true });
  }

  function listFolderSelectOptions() {
    var opts = [{ id: SYSTEM_FOLDER.id, name: SYSTEM_FOLDER.name }];
    walkFolders(CUSTOM_FOLDERS, '', function (node, path) {
      opts.push({ id: node.id, name: path });
    });
    return opts;
  }

  function formatFileSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + 'B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 2 : 0) + 'KB';
    return (n / (1024 * 1024)).toFixed(2) + 'MB';
  }

  function getUploadFolderLabel(id) {
    if (!id) return '';
    if (isSystemFolder(id)) return SYSTEM_FOLDER.name;
    return getFolderPath(id) || '';
  }

  function bindFolderSelect(cfg) {
    cfg = cfg || {};
    var wrap = $(cfg.wrapId || 'upFolderWrap');
    var trigger = $(cfg.triggerId || 'upFolderTrigger');
    var panel = $(cfg.panelId || 'upFolderPanel');
    var label = $(cfg.labelId || 'upFolderLabel');
    var list = $(cfg.listId || 'upFolderList');
    var search = $(cfg.searchId || 'upFolderSearch');
    var clearBtn = $(cfg.clearId || 'upFolderClear');
    var errorItemId = cfg.errorItemId || 'upFolderItem';
    if (!wrap || !trigger || !panel || !label || !list) return null;

    function getValue() {
      return cfg.getValue ? cfg.getValue() : state.upload.folderId;
    }

    function setValue(v) {
      if (cfg.setValue) cfg.setValue(v || '');
      else state.upload.folderId = v || '';
    }

    function syncLabel() {
      var value = getValue();
      if (!value) {
        label.innerHTML = '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.textContent = getUploadFolderLabel(value);
        wrap.classList.add('has-value');
      }
    }

    function render() {
      var kw = search ? (search.value || '').trim().toLowerCase() : '';
      var options = listFolderSelectOptions().filter(function (o) {
        return !kw || o.name.toLowerCase().indexOf(kw) !== -1;
      });
      var value = getValue();
      list.innerHTML = options.map(function (o) {
        var active = o.id === value ? ' is-active' : '';
        return '<button class="single-option' + active + '" type="button" data-value="' +
          escapeHtml(o.id) + '">' + escapeHtml(o.name) + '</button>';
      }).join('') || '<div class="empty-tip" style="padding:12px;display:block">无匹配项</div>';
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
      }
    });

    list.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      setValue(opt.getAttribute('data-value') || '');
      if (getValue()) {
        var item = $(errorItemId);
        if (item) item.classList.remove('is-error');
      }
      syncLabel();
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
    });

    if (search) {
      search.addEventListener('input', function () { render(); });
      search.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setValue('');
        syncLabel();
        panel.classList.remove('is-open');
      });
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel();
    return { syncLabel: syncLabel };
  }

  var upFolderSelect = bindFolderSelect({
    wrapId: 'upFolderWrap',
    triggerId: 'upFolderTrigger',
    panelId: 'upFolderPanel',
    labelId: 'upFolderLabel',
    listId: 'upFolderList',
    searchId: 'upFolderSearch',
    clearId: 'upFolderClear',
    errorItemId: 'upFolderItem',
    getValue: function () { return state.upload.folderId; },
    setValue: function (v) { state.upload.folderId = v || ''; }
  });

  var detailFolderSelect = bindFolderSelect({
    wrapId: 'detailFolderWrap',
    triggerId: 'detailFolderTrigger',
    panelId: 'detailFolderPanel',
    labelId: 'detailFolderLabel',
    listId: 'detailFolderList',
    searchId: 'detailFolderSearch',
    clearId: 'detailFolderClear',
    errorItemId: 'detailFolderItem',
    getValue: function () { return state.detail.folderId; },
    setValue: function (v) { state.detail.folderId = v || ''; }
  });

  var upCreatorSelect = bindSearchSelect({
    wrapId: 'upCreatorWrap',
    triggerId: 'upCreatorTrigger',
    panelId: 'upCreatorPanel',
    labelId: 'upCreatorLabel',
    listId: 'upCreatorList',
    searchId: 'upCreatorSearch',
    clearId: 'upCreatorClear',
    prefix: '',
    getOptions: function () { return USERS; },
    getValue: function () { return state.upload.creator; },
    onChange: function (v) {
      state.upload.creator = v || '';
      if (v) {
        var item = $('upCreatorItem');
        if (item) item.classList.remove('is-error');
      }
    }
  });

  var detailCreatorSelect = bindSearchSelect({
    wrapId: 'detailCreatorWrap',
    triggerId: 'detailCreatorTrigger',
    panelId: 'detailCreatorPanel',
    labelId: 'detailCreatorLabel',
    listId: 'detailCreatorList',
    searchId: 'detailCreatorSearch',
    clearId: 'detailCreatorClear',
    prefix: '',
    getOptions: function () { return USERS; },
    getValue: function () { return state.detail.creator; },
    onChange: function (v) {
      state.detail.creator = v || '';
      if (v) {
        var item = $('detailCreatorItem');
        if (item) item.classList.remove('is-error');
      }
    }
  });

  var upTagSelect = bindCascadeMultiSelect({
    wrapId: 'upTagWrap',
    triggerId: 'upTagTrigger',
    panelId: 'upTagPanel',
    labelId: 'upTagLabel',
    groupListId: 'upTagGroupList',
    childListId: 'upTagChildList',
    selectedId: 'upTagSelected',
    searchId: 'upTagSearch',
    countId: 'upTagCount',
    selectAllId: 'upTagSelectAll',
    clearAllId: 'upTagClearAll',
    clearId: 'upTagClear',
    prefix: '',
    tree: FORM_TAG_TREE,
    getSelected: function () { return withoutSystemTags(state.upload.tags); },
    setSelected: function (arr) { state.upload.tags = withoutSystemTags(arr); }
  });

  var detailTagSelect = bindCascadeMultiSelect({
    wrapId: 'detailTagWrap',
    triggerId: 'detailTagTrigger',
    panelId: 'detailTagPanel',
    labelId: 'detailTagLabel',
    groupListId: 'detailTagGroupList',
    childListId: 'detailTagChildList',
    selectedId: 'detailTagSelected',
    searchId: 'detailTagSearch',
    countId: 'detailTagCount',
    selectAllId: 'detailTagSelectAll',
    clearAllId: 'detailTagClearAll',
    clearId: 'detailTagClear',
    prefix: '',
    tree: FORM_TAG_TREE,
    getSelected: function () { return withoutSystemTags(state.detail.tags); },
    setSelected: function (arr) { state.detail.tags = keepSystemTags(arr, state.detail.tags); }
  });

  var batchTagSelect = bindCascadeMultiSelect({
    wrapId: 'batchTagWrap',
    triggerId: 'batchTagTrigger',
    panelId: 'batchTagPanel',
    labelId: 'batchTagLabel',
    groupListId: 'batchTagGroupList',
    childListId: 'batchTagChildList',
    selectedId: 'batchTagSelected',
    searchId: 'batchTagSearch',
    countId: 'batchTagCount',
    selectAllId: 'batchTagSelectAll',
    clearAllId: 'batchTagClearAll',
    clearId: 'batchTagClear',
    prefix: '',
    tree: FORM_TAG_TREE,
    getSelected: function () { return withoutSystemTags(state.batchTags); },
    setSelected: function (arr) { state.batchTags = keepSystemTags(arr, state.batchTags); }
  });

  function openBatchTagModal(ids) {
    state.batchTagIds = ids.slice();
    state.batchTags = [];
    if (batchTagSelect && batchTagSelect.render) batchTagSelect.render();
    else if ($('batchTagLabel')) {
      $('batchTagLabel').innerHTML = '<span class="muted">请选择标签</span>';
      if ($('batchTagWrap')) $('batchTagWrap').classList.remove('has-value');
    }
    UI.openModal('batchTagModal');
  }

  if ($('batchTagSubmit')) {
    $('batchTagSubmit').addEventListener('click', function () {
      var ids = state.batchTagIds || [];
      var tags = withoutSystemTags(state.batchTags);
      ids.forEach(function (id) {
        var row = findRow(id);
        if (row) row.tags = keepSystemTags(tags, row.tags);
      });
      state.batchTagIds = [];
      state.batchTags = [];
      UI.closeModal('batchTagModal');
      renderAll();
      UI.showToast('修改标签成功', 'success');
    });
  }

  if (UI.bindFormHelp) UI.bindFormHelp($('uploadDrawer'));

  if ($('detailDrawerClose')) {
    $('detailDrawerClose').addEventListener('click', closeDetailDrawer);
  }
  if ($('detailDrawerCancel')) {
    $('detailDrawerCancel').addEventListener('click', closeDetailDrawer);
  }
  if ($('detailSubmit')) {
    $('detailSubmit').addEventListener('click', submitDetail);
  }
  if ($('detailName')) {
    $('detailName').addEventListener('input', function () {
      var v = ($('detailName').value || '').trim();
      if (v && $('detailNameItem')) $('detailNameItem').classList.remove('is-error');
    });
  }

  function syncUpBatchBtn() {
    var selected = getSelectedUploadItems();
    var retryBtn = $('upBatchRetryBtn');
    var delBtn = $('upBatchDeleteBtn');
    if (retryBtn) retryBtn.disabled = !selected.some(canRetryItem);
    if (delBtn) delBtn.disabled = !selected.some(canDeleteItem);
  }

  function syncUpCount() {
    var el = $('upFileCount');
    if (el) el.textContent = '已添加：' + state.upload.items.length + '/' + UPLOAD_MAX;
  }

  function probeLocalMeta(item) {
    var file = item.file;
    if (!file) return;
    var url = URL.createObjectURL(file);
    var isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].indexOf(item.format) !== -1;
    function done(w, h) {
      try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ }
      if (!state.upload.items.some(function (x) { return x.uid === item.uid; })) return;
      if (w > 0 && h > 0) item.sizeDim = w + 'x' + h;
      if (state.upload.uploading) return;
      renderUploadTable();
    }
    if (isImage) {
      var img = new Image();
      img.onload = function () { done(img.naturalWidth, img.naturalHeight); };
      img.onerror = function () { try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ } };
      img.src = url;
      return;
    }
    var video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = function () { done(video.videoWidth || 0, video.videoHeight || 0); };
    video.onerror = function () { try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ } };
    video.src = url;
  }

  function renderUploadTable() {
    var body = $('upFileBody');
    if (!body) return;
    var items = state.upload.items;
    body.innerHTML = items.map(function (item) {
      var checked = state.upload.selected[item.uid] ? ' checked' : '';
      var checkDisabled = isUploadBusyItem(item) ? ' disabled' : '';
      var displayName = stripExt(item.name);
      var playIcon = item.mediaType === '视频' ? PLAY_ICON : '';
      return (
        '<tr data-uid="' + item.uid + '">' +
          '<td class="col-check"><span class="cell-check"><input type="checkbox" data-up-check="' + item.uid + '"' + checked + checkDisabled + ' /></span></td>' +
          '<td class="col-material"><div class="material-cell">' +
            '<button class="thumb" type="button" data-up-preview="' + item.uid + '" aria-label="预览">' +
              '<span class="thumb__preview" aria-hidden="true"></span>' + playIcon +
            '</button>' +
            '<div class="material-cell__meta">' +
              '<span class="material-cell__name" title="' + escapeHtml(displayName) + '">' + escapeHtml(displayName) + '</span>' +
            '</div>' +
          '</div></td>' +
          '<td>' + escapeHtml(item.sizeText) + '</td>' +
          '<td>' + escapeHtml(item.format || '—') + '</td>' +
          '<td class="col-up-progress" data-col="progress">' + uploadProgressHtml(item) + '</td>' +
          '<td class="col-action">' + uploadActionHtml(item) + '</td>' +
        '</tr>'
      );
    }).join('');

    var checkAll = $('upCheckAll');
    if (checkAll) {
      var operable = items.filter(function (it) { return !isUploadBusyItem(it); });
      var allChecked = operable.length > 0 && operable.every(function (it) { return state.upload.selected[it.uid]; });
      checkAll.checked = allChecked;
      checkAll.indeterminate = !allChecked && operable.some(function (it) { return state.upload.selected[it.uid]; });
      checkAll.disabled = operable.length === 0;
    }
    syncUpCount();
    syncUpBatchBtn();
    syncUploadBusy();
  }

  function addUploadFiles(fileList) {
    if (uploadProgressTimer) return;
    var arr = Array.prototype.slice.call(fileList || []);
    if (!arr.length) return;
    var remain = UPLOAD_MAX - state.upload.items.length;
    if (remain <= 0) {
      UI.showToast('单次最多上传 ' + UPLOAD_MAX + ' 个文件');
      return;
    }
    if (arr.length > remain) {
      UI.showToast('超出上限，仅添加前 ' + remain + ' 个');
      arr = arr.slice(0, remain);
    }
    arr.forEach(function (file) {
      var ext = fileExt(file.name);
      var isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].indexOf(ext) !== -1;
      var idx = state.upload.items.length;
      var item = {
        uid: uploadUid++,
        name: file.name,
        displayName: stripExt(file.name),
        format: ext || '—',
        mediaType: isImage ? '图片' : '视频',
        size: file.size || 0,
        sizeText: formatFileSize(file.size),
        sizeDim: '—',
        file: file,
        progress: 0,
        status: 'uploading',
        failAt: (idx % 5 === 4) ? (35 + (idx % 4) * 12) : null,
        progressSpeed: 6 + ((idx * 7) % 11)
      };
      state.upload.items.push(item);
      probeLocalMeta(item);
    });
    renderUploadTable();
    ensureUploadProgressTimer();
    syncUploadBusy();
  }

  function abortUploadAndClose() {
    stopUploadProgressTimer();
    state.upload.items = [];
    state.upload.selected = {};
    syncUploadBusy();
    if (UI.closeModal) UI.closeModal('abortUploadModal');
    UI.closeDrawer('uploadDrawer');
  }

  function closeUploadDrawer() {
    var n = countUploadingItems();
    if (n > 0) {
      var text = $('abortUploadText');
      if (text) text.textContent = '有' + n + '个文件正在上传，确认终止任务并删除上传文件吗？';
      UI.openModal('abortUploadModal');
      return;
    }
    stopUploadProgressTimer();
    UI.closeDrawer('uploadDrawer');
  }

  function openUpload() {
    stopUploadProgressTimer();
    state.upload.folderId = state.folderId || SYSTEM_FOLDER.id;
    state.upload.creator = CURRENT_USER;
    state.upload.tags = [];
    state.upload.deriveDup = true;
    state.upload.items = [];
    state.upload.selected = {};
    syncUploadBusy();
    if ($('upDeriveDup')) $('upDeriveDup').checked = true;
    if ($('upFileInput')) $('upFileInput').value = '';
    ['upFolderItem', 'upCreatorItem'].forEach(function (id) {
      var el = $(id);
      if (el) el.classList.remove('is-error');
    });
    if (upFolderSelect && upFolderSelect.syncLabel) upFolderSelect.syncLabel();
    if (upCreatorSelect && upCreatorSelect.syncLabel) upCreatorSelect.syncLabel();
    if (upTagSelect && upTagSelect.render) upTagSelect.render();
    else if ($('upTagLabel')) {
      $('upTagLabel').innerHTML = '<span class="muted">请选择标签</span>';
      if ($('upTagWrap')) $('upTagWrap').classList.remove('has-value');
    }
    renderUploadTable();
    UI.openDrawer('uploadDrawer');
  }

  $('uploadBtn').addEventListener('click', openUpload);
  $('uploadDrawerClose').addEventListener('click', closeUploadDrawer);
  $('uploadDrawerCancel').addEventListener('click', closeUploadDrawer);
  if ($('abortUploadOk')) {
    $('abortUploadOk').addEventListener('click', abortUploadAndClose);
  }
  if ($('submitUploadOk')) {
    $('submitUploadOk').addEventListener('click', commitUploadedItems);
  }

  (function bindUploadZone() {
    var zone = $('upFileZone');
    var input = $('upFileInput');
    if (!zone || !input) return;
    input.addEventListener('change', function () {
      addUploadFiles(input.files);
      input.value = '';
    });
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-dragover'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      addUploadFiles(e.dataTransfer && e.dataTransfer.files);
    });
  })();

  if ($('upDeriveDup')) {
    $('upDeriveDup').addEventListener('change', function () {
      state.upload.deriveDup = !!$('upDeriveDup').checked;
    });
  }

  if ($('upCheckAll')) {
    $('upCheckAll').addEventListener('change', function () {
      var on = $('upCheckAll').checked;
      state.upload.items.forEach(function (it) {
        if (isUploadBusyItem(it)) return;
        state.upload.selected[it.uid] = on;
      });
      renderUploadTable();
    });
  }

  if ($('upFileBody')) {
    $('upFileBody').addEventListener('change', function (e) {
      var box = e.target.closest('[data-up-check]');
      if (!box) return;
      var uid = Number(box.getAttribute('data-up-check'));
      state.upload.selected[uid] = box.checked;
      syncUpBatchBtn();
      var checkAll = $('upCheckAll');
      if (checkAll) {
        var items = state.upload.items.filter(function (it) { return !isUploadBusyItem(it); });
        var allChecked = items.length > 0 && items.every(function (it) { return state.upload.selected[it.uid]; });
        checkAll.checked = allChecked;
        checkAll.indeterminate = !allChecked && items.some(function (it) { return state.upload.selected[it.uid]; });
      }
    });
    $('upFileBody').addEventListener('mouseover', function (e) {
      var btn = e.target.closest('[data-up-preview]');
      if (!btn) return;
      var uid = Number(btn.getAttribute('data-up-preview'));
      var item = state.upload.items.find(function (it) { return it.uid === uid; });
      if (!item) return;
      showPreview(stripExt(item.name), btn);
    });
    $('upFileBody').addEventListener('mouseout', function (e) {
      if (e.target.closest('[data-up-preview]')) hidePreview();
    });
    $('upFileBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-up-act]');
      if (!btn || btn.disabled) return;
      var uid = Number(btn.getAttribute('data-uid'));
      var act = btn.getAttribute('data-up-act');
      var idx = state.upload.items.findIndex(function (it) { return it.uid === uid; });
      if (idx < 0) return;
      var item = state.upload.items[idx];
      if (act === 'retry') {
        retryUploadItems([item]);
        return;
      }
      if (act === 'delete') {
        if (!canDeleteItem(item)) return;
        hidePreview();
        state.upload.items.splice(idx, 1);
        delete state.upload.selected[uid];
        renderUploadTable();
      }
    });
  }

  if ($('upBatchRetryBtn')) {
    $('upBatchRetryBtn').addEventListener('click', function () {
      var targets = getSelectedUploadItems().filter(canRetryItem);
      if (!targets.length) {
        UI.showToast('请先勾选上传失败的素材');
        return;
      }
      retryUploadItems(targets);
    });
  }

  if ($('upBatchDeleteBtn')) {
    $('upBatchDeleteBtn').addEventListener('click', function () {
      var targets = getSelectedUploadItems().filter(canDeleteItem);
      if (!targets.length) {
        UI.showToast('请先勾选可删除的素材');
        return;
      }
      var uids = targets.map(function (it) { return it.uid; });
      state.upload.items = state.upload.items.filter(function (it) { return uids.indexOf(it.uid) === -1; });
      uids.forEach(function (u) { delete state.upload.selected[u]; });
      renderUploadTable();
    });
  }

  $('upSubmit').addEventListener('click', function () {
    if (hasUploadingItems()) return;
    var ok = true;
    if (!state.upload.folderId) {
      if ($('upFolderItem')) $('upFolderItem').classList.add('is-error');
      ok = false;
    }
    if (!state.upload.creator) {
      if ($('upCreatorItem')) $('upCreatorItem').classList.add('is-error');
      ok = false;
    }
    if (!state.upload.items.length) {
      UI.showToast('请先添加素材文件');
      ok = false;
    }
    if (!ok) return;
    openSubmitUploadConfirm();
  });

  window.addEventListener('beforeunload', function (e) {
    if (!hasUploadingItems()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  /* 去掉 HTML 里无效的全部时间快捷，避免落到近7天歧义 */
  var allBtn = document.querySelector('#dateShortcuts [data-shortcut="all"]');
  if (allBtn) allBtn.remove();

  applyFilters();
})();
