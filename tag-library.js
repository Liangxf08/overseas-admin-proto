/* 标签管理 · Tabs：标签 / 标签组 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var CURRENT_USER = '用户A';
  var USERS = Array.from({ length: 8 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });

  var GROUP_SEED = [
    { id: 'g_sys', name: '系统标签', system: true },
    { id: 'g_lang', name: '语言' },
    { id: 'g_mix', name: '混合玩法' },
    { id: 'g_feat', name: '素材特点' },
    { id: 'g_fest', name: '节日限定' },
    { id: 'g_iter', name: '素材迭代' }
  ];

  /* 每组保留 2～3 个示例标签，便于看出分组；素材迭代组无标签供删除示例 */
  var TAG_SEED = [
    { name: '衍生', groupId: 'g_sys', materialCount: 86 },

    { name: '英语', groupId: 'g_lang', materialCount: 156 },
    { name: '日语', groupId: 'g_lang', materialCount: 0 },
    { name: '繁中', groupId: 'g_lang', materialCount: 64 },

    { name: '消消乐', groupId: 'g_mix', materialCount: 52 },
    { name: '清理', groupId: 'g_mix', materialCount: 0 },
    { name: '保护系列', groupId: 'g_mix', materialCount: 12 },

    { name: 'CTR', groupId: 'g_feat', materialCount: 91 },
    { name: '副玩法', groupId: 'g_feat', materialCount: 44 },
    { name: 'DOGE', groupId: 'g_feat', materialCount: 0 },

    { name: '圣诞节', groupId: 'g_fest', materialCount: 31 },
    { name: '夏日', groupId: 'g_fest', materialCount: 0 }
  ];

  var tagSeq = 10001;
  var groupSeq = 100;

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function nowText() {
    return formatDateTime(new Date());
  }

  function buildGroups() {
    return GROUP_SEED.map(function (g, i) {
      var created = new Date();
      /* 系统标签最早；素材迭代最新；其余按序介于中间 */
      var daysAgo = g.id === 'g_sys' ? 120 : (g.id === 'g_iter' ? 1 : (100 - i * 12));
      created.setDate(created.getDate() - daysAgo);
      created.setHours(10 + (i % 6), (i * 11) % 60, 0, 0);
      return {
        id: g.id,
        name: g.name,
        system: !!g.system,
        updater: USERS[i % USERS.length],
        updatedAt: formatDateTime(created)
      };
    }).sort(byUpdatedAtDesc);
  }

  function buildTags() {
    return TAG_SEED.map(function (t, i) {
      var created = new Date();
      /* 衍生最早创建 */
      var daysAgo = t.name === '衍生' ? 120 : (90 - i * 5);
      created.setDate(created.getDate() - Math.max(2, daysAgo));
      created.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);
      var id = 't' + (tagSeq++);
      return {
        id: id,
        name: t.name,
        groupId: t.groupId,
        groupName: '',
        materialCount: t.materialCount || 0,
        updater: USERS[(i + 2) % USERS.length],
        updatedAt: formatDateTime(created)
      };
    }).sort(byUpdatedAtDesc);
  }

  /* 创建/更新时间降序：最新在前，系统标签 / 衍生（最早）在末行 */
  function byUpdatedAtDesc(a, b) {
    if (a.updatedAt > b.updatedAt) return -1;
    if (a.updatedAt < b.updatedAt) return 1;
    return 0;
  }

  var ALL_GROUPS = buildGroups();
  var ALL_TAGS = buildTags();

  function findGroup(id) {
    return ALL_GROUPS.find(function (g) { return g.id === id; }) || null;
  }

  function findTag(id) {
    return ALL_TAGS.find(function (t) { return t.id === id; }) || null;
  }

  function groupNameById(id) {
    var hit = findGroup(id);
    return hit ? hit.name : '-';
  }

  function isSystemGroup(id) {
    var g = findGroup(id);
    return !!(g && g.system);
  }

  function isSystemTag(row) {
    return !!(row && isSystemGroup(row.groupId));
  }

  function customGroups() {
    return ALL_GROUPS.filter(function (g) { return !g.system; });
  }

  function syncTagGroupNames() {
    ALL_TAGS.forEach(function (t) {
      t.groupName = groupNameById(t.groupId);
    });
  }

  syncTagGroupNames();

  var state = {
    tab: 'tag',
    tag: {
      draft: { name: '', groupId: '' },
      applied: { name: '', groupId: '' },
      page: 1,
      pageSize: 20,
      selected: {}
    },
    group: {
      draft: { name: '' },
      applied: { name: '' },
      page: 1,
      pageSize: 20
    },
    groupForm: { mode: 'add', id: null },
    tagForm: { mode: 'add', id: null, groupId: '' },
    batchGroupId: '',
    deleteCtx: null
  };

  var tagPaginationBound = false;
  var groupPaginationBound = false;
  var tagFormGroupApi = null;
  var batchGroupApi = null;
  var tagGroupApi = null;

  function countTagsInGroup(groupId) {
    return ALL_TAGS.filter(function (t) { return t.groupId === groupId; }).length;
  }

  function filteredTags() {
    var f = state.tag.applied;
    var kw = (f.name || '').trim().toLowerCase();
    return ALL_TAGS.filter(function (row) {
      if (kw && row.name.toLowerCase().indexOf(kw) === -1) return false;
      if (f.groupId && row.groupId !== f.groupId) return false;
      return true;
    }).sort(byUpdatedAtDesc);
  }

  function filteredGroups() {
    var f = state.group.applied;
    var kw = (f.name || '').trim().toLowerCase();
    return ALL_GROUPS.filter(function (row) {
      if (kw && row.name.toLowerCase().indexOf(kw) === -1) return false;
      return true;
    }).sort(byUpdatedAtDesc);
  }

  function selectedTagIds() {
    return Object.keys(state.tag.selected).filter(function (id) {
      return state.tag.selected[id];
    });
  }

  function updateBatchBtn() {
    var btn = $('tagBatchBtn');
    if (!btn) return;
    btn.disabled = selectedTagIds().length === 0;
    if (btn.disabled) {
      btn.classList.remove('is-open');
      var menu = $('tagBatchMenu');
      if (menu) menu.classList.remove('is-open');
    }
  }

  function syncTagCheckAll(pageRows) {
    var checkAll = $('tagCheckAll');
    if (!checkAll) return;
    if (!pageRows.length) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
      return;
    }
    var checked = 0;
    pageRows.forEach(function (row) {
      if (state.tag.selected[row.id]) checked += 1;
    });
    checkAll.checked = checked === pageRows.length;
    checkAll.indeterminate = checked > 0 && checked < pageRows.length;
  }

  function actionLinksHtml(opts) {
    var editDis = opts.editDisabled;
    var delDis = opts.deleteDisabled;
    var editCls = 'link' + (editDis ? ' is-disabled' : '');
    var delCls = 'link link--danger' + (delDis ? ' is-disabled' : '');
    return '<span class="action-links">' +
      '<button class="' + editCls + '" type="button" data-' + opts.prefix + '-act="edit"' +
        (editDis ? ' disabled' : '') +
        (opts.editTitle ? ' title="' + escapeHtml(opts.editTitle) + '"' : '') +
      '>编辑</button>' +
      '<button class="' + delCls + '" type="button" data-' + opts.prefix + '-act="delete"' +
        (delDis ? ' disabled' : '') +
        (opts.deleteTitle ? ' title="' + escapeHtml(opts.deleteTitle) + '"' : '') +
      '>删除</button>' +
    '</span>';
  }

  function setFormError(itemId, errorId, msg) {
    var item = $(itemId);
    var err = $(errorId);
    if (item) item.classList.toggle('is-error', !!msg);
    if (err && msg) err.textContent = msg;
  }

  function clearFormError(itemId) {
    var item = $(itemId);
    if (item) item.classList.remove('is-error');
  }

  function renderCustomGroupOptions(panelId, includeEmpty) {
    var panel = $(panelId);
    if (!panel) return;
    var html = includeEmpty
      ? '<button class="single-option" type="button" data-value="">全部</button>'
      : '';
    html += (includeEmpty ? ALL_GROUPS : customGroups()).map(function (g) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(g.id) + '">' +
        escapeHtml(g.name) + '</button>';
    }).join('');
    panel.innerHTML = html;
  }

  function refreshFilterGroupPanel() {
    renderCustomGroupOptions('filterTagGroupPanel', true);
    if (tagGroupApi && tagGroupApi.syncLabel) {
      tagGroupApi.syncLabel(state.tag.draft.groupId || '');
    }
  }

  function renderTagTable() {
    var rows = filteredTags();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.tag.pageSize) || 1);
    if (state.tag.page > totalPages) state.tag.page = totalPages;
    var start = (state.tag.page - 1) * state.tag.pageSize;
    var pageRows = rows.slice(start, start + state.tag.pageSize);
    var body = $('tagTableBody');
    var empty = $('tagEmptyTip');
    if (!body) return;
    body.innerHTML = pageRows.map(function (row) {
      var checked = state.tag.selected[row.id] ? ' checked' : '';
      var system = isSystemTag(row);
      var canDelete = !system && !(row.materialCount > 0);
      var editDisabled = system;
      return '<tr data-id="' + escapeHtml(row.id) + '">' +
        '<td class="col-check">' +
          '<label class="cell-check">' +
            '<input type="checkbox" data-tag-check="' + escapeHtml(row.id) + '"' + checked + ' />' +
          '</label>' +
        '</td>' +
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td class="num-cell">' + row.materialCount + '</td>' +
        '<td>' + escapeHtml(row.groupName) + '</td>' +
        '<td>' + escapeHtml(row.updater) + '</td>' +
        '<td>' + escapeHtml(row.updatedAt) + '</td>' +
        '<td class="col-action">' +
          actionLinksHtml({
            prefix: 'tag',
            editDisabled: editDisabled,
            editTitle: editDisabled ? '系统标签不可编辑' : '',
            deleteDisabled: !canDelete,
            deleteTitle: system
              ? '系统标签不可删除'
              : (row.materialCount > 0 ? '已关联素材，不可删除' : '')
          }) +
        '</td>' +
      '</tr>';
    }).join('');
    if (empty) empty.hidden = pageRows.length > 0;
    syncTagCheckAll(pageRows);
    updateBatchBtn();
    UI.renderPagination({
      containerId: 'tagPagination',
      total: total,
      page: state.tag.page,
      pageSize: state.tag.pageSize
    });
    if (!tagPaginationBound) {
      tagPaginationBound = true;
      UI.bindPagination({
        containerId: 'tagPagination',
        getPage: function () { return state.tag.page; },
        getPageSize: function () { return state.tag.pageSize; },
        getTotal: function () { return filteredTags().length; },
        onPageChange: function (page) {
          state.tag.page = page;
          renderTagTable();
        },
        onPageSizeChange: function (size) {
          state.tag.pageSize = size;
          state.tag.page = 1;
          renderTagTable();
        }
      });
    }
    if (window.ColResize) ColResize.refresh($('tagTable'));
  }

  function renderGroupTable() {
    var rows = filteredGroups();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / state.group.pageSize) || 1);
    if (state.group.page > totalPages) state.group.page = totalPages;
    var start = (state.group.page - 1) * state.group.pageSize;
    var pageRows = rows.slice(start, start + state.group.pageSize);
    var body = $('groupTableBody');
    var empty = $('groupEmptyTip');
    if (!body) return;
    body.innerHTML = pageRows.map(function (row) {
      var count = countTagsInGroup(row.id);
      var system = !!row.system;
      var canDelete = !system && !(count > 0);
      return '<tr data-id="' + escapeHtml(row.id) + '">' +
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td class="num-cell">' + count + '</td>' +
        '<td>' + escapeHtml(row.updater) + '</td>' +
        '<td>' + escapeHtml(row.updatedAt) + '</td>' +
        '<td class="col-action">' +
          actionLinksHtml({
            prefix: 'group',
            editDisabled: system,
            editTitle: system ? '系统标签组不可编辑' : '',
            deleteDisabled: !canDelete,
            deleteTitle: system
              ? '系统标签组不可删除'
              : (count > 0 ? '已关联标签，不可删除' : '')
          }) +
        '</td>' +
      '</tr>';
    }).join('');
    if (empty) empty.hidden = pageRows.length > 0;
    UI.renderPagination({
      containerId: 'groupPagination',
      total: total,
      page: state.group.page,
      pageSize: state.group.pageSize
    });
    if (!groupPaginationBound) {
      groupPaginationBound = true;
      UI.bindPagination({
        containerId: 'groupPagination',
        getPage: function () { return state.group.page; },
        getPageSize: function () { return state.group.pageSize; },
        getTotal: function () { return filteredGroups().length; },
        onPageChange: function (page) {
          state.group.page = page;
          renderGroupTable();
        },
        onPageSizeChange: function (size) {
          state.group.pageSize = size;
          state.group.page = 1;
          renderGroupTable();
        }
      });
    }
    if (window.ColResize) ColResize.refresh($('groupTable'));
  }

  function switchTab(tab) {
    state.tab = tab === 'group' ? 'group' : 'tag';
    document.querySelectorAll('.page-tabs__item').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === state.tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if ($('filterBarTag')) $('filterBarTag').hidden = state.tab !== 'tag';
    if ($('filterBarGroup')) $('filterBarGroup').hidden = state.tab !== 'group';
    if ($('dataPanelTag')) $('dataPanelTag').hidden = state.tab !== 'tag';
    if ($('dataPanelGroup')) $('dataPanelGroup').hidden = state.tab !== 'group';
    if (state.tab === 'tag') renderTagTable();
    else renderGroupTable();
  }

  /* —— 标签组表单 —— */
  function openGroupForm(mode, row) {
    state.groupForm = { mode: mode, id: row ? row.id : null };
    clearFormError('groupNameItem');
    if ($('groupFormTitle')) {
      $('groupFormTitle').textContent = mode === 'edit' ? '编辑标签组' : '添加标签组';
    }
    if ($('groupNameInput')) $('groupNameInput').value = row ? row.name : '';
    UI.openModal('groupFormModal');
    if ($('groupNameInput')) $('groupNameInput').focus();
  }

  function submitGroupForm() {
    var name = (($('groupNameInput') && $('groupNameInput').value) || '').trim();
    if (!name) {
      setFormError('groupNameItem', 'groupNameError', '请输入标签组名称');
      return;
    }
    var dup = ALL_GROUPS.some(function (g) {
      return g.name === name && g.id !== state.groupForm.id;
    });
    if (dup) {
      setFormError('groupNameItem', 'groupNameError', '标签组名称已存在');
      return;
    }
    if (state.groupForm.mode === 'edit') {
      var row = findGroup(state.groupForm.id);
      if (!row || row.system) {
        UI.showToast('系统标签组不可编辑', 'error');
        return;
      }
      row.name = name;
      row.updater = CURRENT_USER;
      row.updatedAt = nowText();
      syncTagGroupNames();
      UI.closeModal('groupFormModal');
      refreshFilterGroupPanel();
      renderGroupTable();
      renderTagTable();
      UI.showToast('标签组已更新', 'success');
      return;
    }
    ALL_GROUPS.push({
      id: 'g_custom_' + (++groupSeq),
      name: name,
      system: false,
      updater: CURRENT_USER,
      updatedAt: nowText()
    });
    UI.closeModal('groupFormModal');
    refreshFilterGroupPanel();
    renderGroupTable();
    UI.showToast('标签组已创建', 'success');
  }

  /* —— 标签表单 —— */
  function openTagForm(mode, row) {
    state.tagForm = {
      mode: mode,
      id: row ? row.id : null,
      groupId: row ? row.groupId : ''
    };
    clearFormError('tagNameItem');
    clearFormError('tagGroupItem');
    if ($('tagFormTitle')) {
      $('tagFormTitle').textContent = mode === 'edit' ? '编辑标签' : '添加标签';
    }
    if ($('tagNameInput')) $('tagNameInput').value = row ? row.name : '';
    renderCustomGroupOptions('tagFormGroupPanel', false);
    if (tagFormGroupApi && tagFormGroupApi.syncLabel) {
      tagFormGroupApi.syncLabel(state.tagForm.groupId || '');
    }
    UI.openModal('tagFormModal');
    if ($('tagNameInput')) $('tagNameInput').focus();
  }

  function submitTagForm() {
    var name = (($('tagNameInput') && $('tagNameInput').value) || '').trim();
    var groupId = state.tagForm.groupId || '';
    var ok = true;
    if (!name) {
      setFormError('tagNameItem', 'tagNameError', '请输入标签名称');
      ok = false;
    } else {
      clearFormError('tagNameItem');
    }
    if (!groupId || isSystemGroup(groupId)) {
      setFormError('tagGroupItem', 'tagGroupError', '请选择所属标签组');
      ok = false;
    } else {
      clearFormError('tagGroupItem');
    }
    if (!ok) return;

    var dup = ALL_TAGS.some(function (t) {
      return t.groupId === groupId && t.name === name && t.id !== state.tagForm.id;
    });
    if (dup) {
      setFormError('tagNameItem', 'tagNameError', '同组下已存在同名标签');
      return;
    }

    if (state.tagForm.mode === 'edit') {
      var row = findTag(state.tagForm.id);
      if (!row || isSystemTag(row)) {
        UI.showToast('系统标签不可编辑', 'error');
        return;
      }
      row.name = name;
      row.groupId = groupId;
      row.groupName = groupNameById(groupId);
      row.updater = CURRENT_USER;
      row.updatedAt = nowText();
      UI.closeModal('tagFormModal');
      renderTagTable();
      renderGroupTable();
      UI.showToast('标签已更新', 'success');
      return;
    }

    ALL_TAGS.unshift({
      id: 't' + (tagSeq++),
      name: name,
      groupId: groupId,
      groupName: groupNameById(groupId),
      materialCount: 0,
      updater: CURRENT_USER,
      updatedAt: nowText()
    });
    UI.closeModal('tagFormModal');
    state.tag.page = 1;
    renderTagTable();
    renderGroupTable();
    UI.showToast('标签已创建', 'success');
  }

  /* —— 删除 —— */
  function openDelete(ctx) {
    state.deleteCtx = ctx;
    if ($('deleteTitle')) $('deleteTitle').textContent = '删除确认';
    if ($('deleteBody')) {
      $('deleteBody').textContent = '此操作不可撤销，确认删除吗？';
    }
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var ctx = state.deleteCtx;
    if (!ctx) {
      UI.closeModal('deleteModal');
      return;
    }
    if (ctx.type === 'tag') {
      ALL_TAGS = ALL_TAGS.filter(function (t) { return ctx.ids.indexOf(t.id) === -1; });
      ctx.ids.forEach(function (id) { delete state.tag.selected[id]; });
      UI.closeModal('deleteModal');
      renderTagTable();
      renderGroupTable();
      UI.showToast(ctx.ids.length > 1 ? '已批量删除标签' : '标签已删除', 'success');
    } else if (ctx.type === 'group') {
      ALL_GROUPS = ALL_GROUPS.filter(function (g) { return g.id !== ctx.id; });
      if (state.tag.draft.groupId === ctx.id) state.tag.draft.groupId = '';
      if (state.tag.applied.groupId === ctx.id) state.tag.applied.groupId = '';
      UI.closeModal('deleteModal');
      refreshFilterGroupPanel();
      renderGroupTable();
      UI.showToast('标签组已删除', 'success');
    }
    state.deleteCtx = null;
  }

  /* —— 批量改组 —— */
  function openBatchGroup() {
    var ids = selectedTagIds();
    if (!ids.length) {
      UI.showToast('请先勾选标签', 'error');
      return;
    }
    var hasSystem = ids.some(function (id) {
      return isSystemTag(findTag(id));
    });
    if (hasSystem) {
      UI.showToast('所选包含系统标签，不可修改标签组', 'error');
      return;
    }
    state.batchGroupId = '';
    clearFormError('batchGroupItem');
    renderCustomGroupOptions('batchGroupPanel', false);
    if (batchGroupApi && batchGroupApi.syncLabel) batchGroupApi.syncLabel('');
    UI.openModal('batchGroupModal');
  }

  function submitBatchGroup() {
    if (!state.batchGroupId || isSystemGroup(state.batchGroupId)) {
      setFormError('batchGroupItem', 'batchGroupError', '请选择标签组');
      return;
    }
    var ids = selectedTagIds();
    var gName = groupNameById(state.batchGroupId);
    ids.forEach(function (id) {
      var row = findTag(id);
      if (!row || isSystemTag(row)) return;
      row.groupId = state.batchGroupId;
      row.groupName = gName;
      row.updater = CURRENT_USER;
      row.updatedAt = nowText();
    });
    UI.closeModal('batchGroupModal');
    renderTagTable();
    renderGroupTable();
    UI.showToast('已修改标签组', 'success');
  }

  /* —— 绑定 —— */
  if (UI.bindSingleSelect && $('filterTagGroupWrap')) {
    renderCustomGroupOptions('filterTagGroupPanel', true);
    tagGroupApi = UI.bindSingleSelect({
      wrapId: 'filterTagGroupWrap',
      triggerId: 'filterTagGroupTrigger',
      panelId: 'filterTagGroupPanel',
      labelId: 'filterTagGroupLabel',
      clearId: 'filterTagGroupClear',
      prefix: '标签组：',
      getValue: function () { return state.tag.draft.groupId; },
      formatValue: function (v) { return v ? groupNameById(v) : ''; },
      onChange: function (v) { state.tag.draft.groupId = v || ''; }
    });
  }

  if (UI.bindSingleSelect && $('tagFormGroupWrap')) {
    tagFormGroupApi = UI.bindSingleSelect({
      wrapId: 'tagFormGroupWrap',
      triggerId: 'tagFormGroupTrigger',
      panelId: 'tagFormGroupPanel',
      labelId: 'tagFormGroupLabel',
      clearId: 'tagFormGroupClear',
      getValue: function () { return state.tagForm.groupId; },
      formatValue: function (v) { return v ? groupNameById(v) : ''; },
      onChange: function (v) {
        state.tagForm.groupId = v || '';
        clearFormError('tagGroupItem');
      }
    });
  }

  if (UI.bindSingleSelect && $('batchGroupWrap')) {
    batchGroupApi = UI.bindSingleSelect({
      wrapId: 'batchGroupWrap',
      triggerId: 'batchGroupTrigger',
      panelId: 'batchGroupPanel',
      labelId: 'batchGroupLabel',
      clearId: 'batchGroupClear',
      getValue: function () { return state.batchGroupId; },
      formatValue: function (v) { return v ? groupNameById(v) : ''; },
      onChange: function (v) {
        state.batchGroupId = v || '';
        clearFormError('batchGroupItem');
      }
    });
  }

  if (UI.bindInputClearable) {
    UI.bindInputClearable({ wrapId: 'filterTagNameWrap', clearId: 'filterTagNameClear' });
    UI.bindInputClearable({ wrapId: 'filterGroupNameWrap', clearId: 'filterGroupNameClear' });
    UI.bindInputClearable({ wrapId: 'groupNameClearWrap', clearId: 'groupNameClear' });
    UI.bindInputClearable({ wrapId: 'tagNameClearWrap', clearId: 'tagNameClear' });
  }

  if (UI.bindBatchMenu) {
    UI.bindBatchMenu({
      wrapId: 'tagBatchWrap',
      btnId: 'tagBatchBtn',
      menuId: 'tagBatchMenu',
      onAction: function (act) {
        var ids = selectedTagIds();
        if (!ids.length) {
          UI.showToast('请先勾选标签', 'error');
          return;
        }
        if (act === 'group') {
          openBatchGroup();
          return;
        }
        if (act === 'delete') {
          var blocked = ids.filter(function (id) {
            var row = findTag(id);
            return !row || isSystemTag(row) || row.materialCount > 0;
          });
          if (blocked.length) {
            UI.showToast('所选含系统标签或已关联素材的项，不可批量删除', 'error');
            return;
          }
          openDelete({
            type: 'tag',
            ids: ids.slice()
          });
        }
      }
    });
  }

  document.querySelectorAll('.page-tabs__item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  if ($('queryTagBtn')) {
    $('queryTagBtn').addEventListener('click', function () {
      state.tag.draft.name = (($('filterTagName') && $('filterTagName').value) || '').trim();
      state.tag.applied = {
        name: state.tag.draft.name,
        groupId: state.tag.draft.groupId
      };
      state.tag.page = 1;
      renderTagTable();
    });
  }
  if ($('addTagBtn')) {
    $('addTagBtn').addEventListener('click', function () { openTagForm('add'); });
  }
  if ($('queryGroupBtn')) {
    $('queryGroupBtn').addEventListener('click', function () {
      state.group.draft.name = (($('filterGroupName') && $('filterGroupName').value) || '').trim();
      state.group.applied = { name: state.group.draft.name };
      state.group.page = 1;
      renderGroupTable();
    });
  }
  if ($('addGroupBtn')) {
    $('addGroupBtn').addEventListener('click', function () { openGroupForm('add'); });
  }

  if ($('groupFormSubmit')) $('groupFormSubmit').addEventListener('click', submitGroupForm);
  if ($('tagFormSubmit')) $('tagFormSubmit').addEventListener('click', submitTagForm);
  if ($('batchGroupSubmit')) $('batchGroupSubmit').addEventListener('click', submitBatchGroup);
  if ($('deleteOk')) $('deleteOk').addEventListener('click', confirmDelete);

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close');
      if (id) UI.closeModal(id);
    });
  });

  if ($('groupNameInput')) {
    $('groupNameInput').addEventListener('input', function () { clearFormError('groupNameItem'); });
  }
  if ($('tagNameInput')) {
    $('tagNameInput').addEventListener('input', function () { clearFormError('tagNameItem'); });
  }

  if ($('tagCheckAll')) {
    $('tagCheckAll').addEventListener('change', function () {
      var checked = !!$('tagCheckAll').checked;
      var rows = filteredTags();
      var start = (state.tag.page - 1) * state.tag.pageSize;
      var pageRows = rows.slice(start, start + state.tag.pageSize);
      pageRows.forEach(function (row) {
        if (checked) state.tag.selected[row.id] = true;
        else delete state.tag.selected[row.id];
      });
      renderTagTable();
    });
  }

  if ($('tagTableBody')) {
    $('tagTableBody').addEventListener('change', function (e) {
      var input = e.target.closest('[data-tag-check]');
      if (!input) return;
      var id = input.getAttribute('data-tag-check');
      if (input.checked) state.tag.selected[id] = true;
      else delete state.tag.selected[id];
      var rows = filteredTags();
      var start = (state.tag.page - 1) * state.tag.pageSize;
      syncTagCheckAll(rows.slice(start, start + state.tag.pageSize));
      updateBatchBtn();
    });
    $('tagTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tag-act]');
      if (!btn || btn.disabled || btn.classList.contains('is-disabled')) return;
      var act = btn.getAttribute('data-tag-act');
      var tr = btn.closest('tr');
      var id = tr && tr.getAttribute('data-id');
      var row = findTag(id);
      if (!row) return;
      if (act === 'edit') {
        if (isSystemTag(row)) {
          UI.showToast('系统标签不可编辑', 'error');
          return;
        }
        openTagForm('edit', row);
        return;
      }
      if (act === 'delete') {
        if (isSystemTag(row)) {
          UI.showToast('系统标签不可删除', 'error');
          return;
        }
        if (row.materialCount > 0) {
          UI.showToast('已关联素材，不可删除', 'error');
          return;
        }
        openDelete({
          type: 'tag',
          ids: [row.id]
        });
      }
    });
  }

  if ($('groupTableBody')) {
    $('groupTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-group-act]');
      if (!btn || btn.disabled || btn.classList.contains('is-disabled')) return;
      var act = btn.getAttribute('data-group-act');
      var tr = btn.closest('tr');
      var id = tr && tr.getAttribute('data-id');
      var row = findGroup(id);
      if (!row) return;
      if (act === 'edit') {
        if (row.system) {
          UI.showToast('系统标签组不可编辑', 'error');
          return;
        }
        openGroupForm('edit', row);
        return;
      }
      if (act === 'delete') {
        if (row.system) {
          UI.showToast('系统标签组不可删除', 'error');
          return;
        }
        if (countTagsInGroup(id) > 0) {
          UI.showToast('已关联标签，不可删除', 'error');
          return;
        }
        openDelete({
          type: 'group',
          id: row.id
        });
      }
    });
  }

  if (window.ColResize) {
    ColResize.refresh($('tagTable'));
    ColResize.refresh($('groupTable'));
  }

  switchTab('tag');
})();
