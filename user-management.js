/* 用户管理 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var DEPARTMENTS = ['奇异果', '国内发行', '无花果', '硕果组', '苹果组', '人力行政部', '海外发行', '财务部'];
  var ROLES = [
    '研发测试', '海外素材', '创新中心', '研发负责人', '财务审计', '数据管理',
    'SDK开发', '海外投放', '海外运营', '海外负责人', '管理员'
  ];
  var DATA_GROUPS = [
    '开发测试', 'APP-无花果', 'APP-奇异果', 'TikTok微短剧', 'TikTok小游戏',
    'APP投放组', '小游戏投放组', 'APP运营组', '小游戏运营组', '全产品'
  ];
  /* 部门 / 角色组合示例（来自业务样本，随机分配到用户） */
  var DEPT_ROLE_SAMPLES = [
    { departments: ['奇异果'], roles: ['研发测试'] },
    { departments: ['国内发行'], roles: [] },
    { departments: ['无花果', '硕果组'], roles: [] },
    { departments: ['人力行政部'], roles: [] },
    { departments: ['无花果'], roles: [] },
    { departments: ['硕果组', '苹果组'], roles: [] },
    { departments: ['海外发行'], roles: ['海外投放'] },
    { departments: ['无花果', '硕果组'], roles: [] },
    { departments: ['奇异果'], roles: [] },
    { departments: ['财务部'], roles: ['财务审计'] },
    { departments: ['海外发行'], roles: ['海外投放'] },
    { departments: ['苹果组'], roles: [] },
    { departments: ['奇异果'], roles: [] },
    { departments: ['硕果组', '苹果组'], roles: [] },
    { departments: ['海外发行'], roles: ['海外素材'] },
    { departments: ['国内发行'], roles: [] }
  ];
  var NICKNAMES = Array.from({ length: 24 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });
  var OPERATORS = NICKNAMES.slice(0, 8);

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function pick(arr, i) {
    return arr[i % arr.length];
  }

  /** 账号：参考截图，16～18 位、以 01 开头 */
  function makeAccount(i) {
    var base = String(100033445740015 + i * 137 + (i % 9) * 1000003);
    if (base.length < 14) base = (base + '00000000000000').slice(0, 14);
    if (base.length > 16) base = base.slice(0, 16);
    return '01' + base;
  }

  function joinList(list) {
    return (list && list.length) ? list.join(', ') : '-';
  }

  function sameList(a, b) {
    var left = (a || []).slice().sort().join('\u0001');
    var right = (b || []).slice().sort().join('\u0001');
    return left === right;
  }

  function displayList(list) {
    return (list && list.length) ? list.join(', ') : '空';
  }

  function buildMockRows(count) {
    var list = [];
    var pool = DEPT_ROLE_SAMPLES.slice();
    var i;
    /* 打乱样本池后循环分配，保证分布接近随机 */
    for (i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    for (i = 0; i < count; i++) {
      var sample = pool[i % pool.length];
      var depts = (sample.departments || []).slice();
      var roles = (sample.roles || []).slice();
      var groups = i % 4 === 0 ? [] : [pick(DATA_GROUPS, i)];
      if (i % 19 === 0) groups = [DATA_GROUPS[0], DATA_GROUPS[2]];
      var updated = new Date(2026, 7, 10, 9, 30, 4);
      updated.setMinutes(updated.getMinutes() - i * 17);
      updated.setSeconds(updated.getSeconds() - (i % 40));
      var status = i % 9 === 0 ? '禁用' : '启用';
      /* 禁用用户不保留部门 / 角色 / 数据组关联 */
      if (status === '禁用') {
        depts = [];
        roles = [];
        groups = [];
      }
      list.push({
        id: 'u-' + (i + 1),
        nickname: pick(NICKNAMES, i),
        account: makeAccount(i),
        departments: depts,
        roles: roles,
        dataGroups: groups,
        status: status,
        updatedAt: formatDateTime(updated)
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows(24);
  var EDIT_LOGS = {};

  function pushEditLog(userId, type, from, to, operator, time) {
    if (!EDIT_LOGS[userId]) EDIT_LOGS[userId] = [];
    EDIT_LOGS[userId].unshift({
      time: time || formatDateTime(new Date()),
      operator: operator || pick(OPERATORS, Date.now() % 100),
      type: type,
      from: from,
      to: to
    });
  }

  function seedEditLogs(row, count, seedOffset) {
    var types = ['修改角色', '修改数据组', '修改状态'];
    var i;
    for (i = count - 1; i >= 0; i--) {
      var t = new Date(Date.now() - seedOffset * 3600000 - i * 240000 - (i % 5) * 1000);
      var op = OPERATORS[(seedOffset + i) % OPERATORS.length];
      var type = types[i % 3];
      if (type === '修改角色') {
        var fromR = pick(ROLES, i + seedOffset);
        var toR = pick(ROLES, i + seedOffset + 1);
        pushEditLog(row.id, type, fromR, toR, op, formatDateTime(t));
      } else if (type === '修改数据组') {
        var fromG = pick(DATA_GROUPS, i + seedOffset);
        var toG = pick(DATA_GROUPS, i + seedOffset + 2);
        pushEditLog(row.id, type, fromG, toG, op, formatDateTime(t));
      } else {
        var on = i % 2 === 0;
        pushEditLog(row.id, type, on ? '禁用' : '启用', on ? '启用' : '禁用', op, formatDateTime(t));
      }
    }
  }

  if (ALL_ROWS[0]) seedEditLogs(ALL_ROWS[0], 12, 1);
  if (ALL_ROWS[1]) seedEditLogs(ALL_ROWS[1], 5, 2);
  if (ALL_ROWS[2]) seedEditLogs(ALL_ROWS[2], 3, 3);

  var state = {
    draft: {
      nickname: '',
      departments: [],
      roles: [],
      dataGroups: [],
      status: ''
    },
    applied: null,
    page: 1,
    pageSize: 20,
    editId: null,
    editRoles: [],
    editDataGroups: [],
    editStatus: '启用',
    impersonateId: null,
    logUserId: null,
    logPage: 1,
    logPageSize: 20,
    paginationBound: false,
    logPaginationBound: false
  };

  function applyFilters() {
    state.applied = {
      nickname: (state.draft.nickname || '').trim(),
      departments: (state.draft.departments || []).slice(),
      roles: (state.draft.roles || []).slice(),
      dataGroups: (state.draft.dataGroups || []).slice(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f) return ALL_ROWS.slice();
    return ALL_ROWS.filter(function (row) {
      if (f.nickname && row.nickname.indexOf(f.nickname) === -1) return false;
      if (f.departments.length && !f.departments.some(function (d) { return row.departments.indexOf(d) !== -1; })) return false;
      if (f.roles.length && !f.roles.some(function (r) { return row.roles.indexOf(r) !== -1; })) return false;
      if (f.dataGroups.length && !f.dataGroups.some(function (g) { return row.dataGroups.indexOf(g) !== -1; })) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  var deptFilter = UI.bindMultiSelect({
    wrapId: 'deptWrap',
    triggerId: 'deptTrigger',
    panelId: 'deptPanel',
    labelId: 'deptLabel',
    listId: 'deptList',
    clearId: 'deptClear',
    prefix: '部门：',
    getOptions: function () { return DEPARTMENTS; },
    getSelected: function () { return state.draft.departments; },
    setSelected: function (arr) { state.draft.departments = arr; }
  });

  var roleFilter = UI.bindMultiSelect({
    wrapId: 'roleWrap',
    triggerId: 'roleTrigger',
    panelId: 'rolePanel',
    labelId: 'roleLabel',
    listId: 'roleList',
    clearId: 'roleClear',
    prefix: '角色：',
    getOptions: function () { return ROLES; },
    getSelected: function () { return state.draft.roles; },
    setSelected: function (arr) { state.draft.roles = arr; }
  });

  var dataGroupFilter = UI.bindMultiSelect({
    wrapId: 'dataGroupWrap',
    triggerId: 'dataGroupTrigger',
    panelId: 'dataGroupPanel',
    labelId: 'dataGroupLabel',
    listId: 'dataGroupList',
    clearId: 'dataGroupClear',
    prefix: '数据组：',
    getOptions: function () { return DATA_GROUPS; },
    getSelected: function () { return state.draft.dataGroups; },
    setSelected: function (arr) { state.draft.dataGroups = arr; }
  });

  var statusFilter = UI.bindSingleSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    clearId: 'statusClear',
    prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  var editRoleSelect = UI.bindMultiSelect({
    wrapId: 'editRoleWrap',
    triggerId: 'editRoleTrigger',
    panelId: 'editRolePanel',
    labelId: 'editRoleLabel',
    listId: 'editRoleList',
    clearId: 'editRoleClear',
    getOptions: function () { return ROLES; },
    getSelected: function () { return state.editRoles; },
    setSelected: function (arr) { state.editRoles = arr; }
  });

  var editDataGroupSelect = UI.bindMultiSelect({
    wrapId: 'editDataGroupWrap',
    triggerId: 'editDataGroupTrigger',
    panelId: 'editDataGroupPanel',
    labelId: 'editDataGroupLabel',
    listId: 'editDataGroupList',
    clearId: 'editDataGroupClear',
    getOptions: function () { return DATA_GROUPS; },
    getSelected: function () { return state.editDataGroups; },
    setSelected: function (arr) { state.editDataGroups = arr; }
  });

  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
    if (state.editStatus === '禁用') {
      state.editRoles = [];
      state.editDataGroups = [];
      if ($('editDept')) $('editDept').value = '';
      if (editRoleSelect && editRoleSelect.render) editRoleSelect.render();
      if (editDataGroupSelect && editDataGroupSelect.render) editDataGroupSelect.render();
    } else {
      var row = findRow(state.editId);
      if (row && row.status !== '禁用') {
        if ($('editDept')) $('editDept').value = (row.departments || []).join(', ');
        state.editRoles = (row.roles || []).slice();
        state.editDataGroups = (row.dataGroups || []).slice();
        if (editRoleSelect && editRoleSelect.render) editRoleSelect.render();
        if (editDataGroupSelect && editDataGroupSelect.render) editDataGroupSelect.render();
      }
    }
  });

  $('filterNickname').addEventListener('input', function () {
    state.draft.nickname = this.value || '';
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
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td><span class="user-cell"><span class="user-cell__avatar" aria-hidden="true"></span><span class="user-cell__name">' + escapeHtml(row.nickname) + '</span></span></td>' +
          '<td class="col-account">' + escapeHtml(row.account) + '</td>' +
          '<td title="' + escapeHtml(joinList(row.departments)) + '">' + escapeHtml(joinList(row.departments)) + '</td>' +
          '<td title="' + escapeHtml(joinList(row.roles)) + '">' + escapeHtml(joinList(row.roles)) + '</td>' +
          '<td title="' + escapeHtml(joinList(row.dataGroups)) + '">' + escapeHtml(joinList(row.dataGroups)) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link" type="button" data-action="impersonate">扮演</button>' +
            '<button class="link" type="button" data-action="log">日志</button>' +
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
        onPageChange: function (p) {
          state.page = p;
          renderTable();
        },
        onPageSizeChange: function (size) {
          state.pageSize = size;
          state.page = 1;
          renderTable();
        }
      });
    }

    if (window.ColResize) ColResize.refresh($('userTable'));
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function openEdit(row) {
    if (!row) return;
    state.editId = row.id;
    state.editRoles = (row.roles || []).slice();
    state.editDataGroups = (row.dataGroups || []).slice();
    state.editStatus = row.status || '启用';
    $('editAccount').value = row.account;
    $('editNickname').value = row.nickname;
    $('editDept').value = (row.departments || []).join(', ');
    if (editRoleSelect && editRoleSelect.render) editRoleSelect.render();
    if (editDataGroupSelect && editDataGroupSelect.render) editDataGroupSelect.render();
    UI.setSegValue('editStatusSeg', state.editStatus);
    UI.openModal('editModal');
  }

  function submitEdit() {
    var row = findRow(state.editId);
    if (!row) return;
    var nextStatus = state.editStatus || '启用';
    var nextRoles = nextStatus === '禁用' ? [] : (state.editRoles || []).slice();
    var nextGroups = nextStatus === '禁用' ? [] : (state.editDataGroups || []).slice();
    var nextDepts = nextStatus === '禁用' ? [] : (row.departments || []).slice();
    var operator = '用户A';
    var now = formatDateTime(new Date());
    var changed = false;

    if (!sameList(row.roles, nextRoles)) {
      pushEditLog(row.id, '修改角色', displayList(row.roles), displayList(nextRoles), operator, now);
      row.roles = nextRoles;
      changed = true;
    }
    if (!sameList(row.dataGroups, nextGroups)) {
      pushEditLog(row.id, '修改数据组', displayList(row.dataGroups), displayList(nextGroups), operator, now);
      row.dataGroups = nextGroups;
      changed = true;
    }
    if (!sameList(row.departments, nextDepts)) {
      row.departments = nextDepts;
      changed = true;
    }
    if (row.status !== nextStatus) {
      pushEditLog(row.id, '修改状态', row.status, nextStatus, operator, now);
      row.status = nextStatus;
      changed = true;
    }

    if (changed) {
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    } else {
      UI.showToast('未修改任何内容', 'info');
    }
    UI.closeModal('editModal');
    renderTable();
  }

  function openImpersonate(row) {
    if (!row) return;
    state.impersonateId = row.id;
    $('impersonateBody').textContent = '确认扮演用户「' + row.nickname + '」吗？扮演后将以该用户权限访问系统。';
    UI.openModal('impersonateModal');
  }

  function confirmImpersonate() {
    var row = findRow(state.impersonateId);
    state.impersonateId = null;
    UI.closeModal('impersonateModal');
    if (!row) return;
    UI.showToast('已切换为扮演「' + row.nickname + '」', 'success');
  }

  function renderLogDrawer() {
    var body = $('logDrawerBody');
    var pager = $('logPagination');
    var userId = state.logUserId;
    var row = findRow(userId);
    var logs = userId ? (EDIT_LOGS[userId] || []) : [];
    $('logDrawerTitle').textContent = row ? ('编辑日志 · ' + row.nickname) : '编辑日志';

    if (!logs.length) {
      body.innerHTML = '<div class="log-table__empty">暂无编辑日志</div>';
      if (pager) {
        pager.hidden = true;
        pager.innerHTML = '';
      }
      return;
    }

    var total = logs.length;
    var totalPages = Math.max(1, Math.ceil(total / state.logPageSize));
    if (state.logPage > totalPages) state.logPage = totalPages;
    var start = (state.logPage - 1) * state.logPageSize;
    var pageLogs = logs.slice(start, start + state.logPageSize);

    body.innerHTML =
      '<div class="log-table-shell"><table class="log-table">' +
        '<colgroup><col style="width:168px"/><col style="width:88px"/><col style="width:120px"/><col/></colgroup>' +
        '<thead><tr><th>操作时间</th><th>操作人</th><th>类型</th><th>变更内容</th></tr></thead>' +
        '<tbody>' +
        pageLogs.map(function (log) {
          return '<tr>' +
            '<td>' + escapeHtml(log.time) + '</td>' +
            '<td>' + escapeHtml(log.operator) + '</td>' +
            '<td>' + escapeHtml(log.type) + '</td>' +
            '<td><div class="log-table__change"><div class="log-table__change-item">' +
              escapeHtml(log.from) + ' → ' + escapeHtml(log.to) +
            '</div></div></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';

    if (pager) {
      pager.hidden = false;
      UI.renderPagination({
        containerId: 'logPagination',
        total: total,
        page: state.logPage,
        pageSize: state.logPageSize
      });
      if (!state.logPaginationBound) {
        state.logPaginationBound = true;
        UI.bindPagination({
          containerId: 'logPagination',
          getPage: function () { return state.logPage; },
          getPageSize: function () { return state.logPageSize; },
          getTotal: function () {
            return state.logUserId ? (EDIT_LOGS[state.logUserId] || []).length : 0;
          },
          onPageChange: function (p) {
            state.logPage = p;
            renderLogDrawer();
          },
          onPageSizeChange: function (size) {
            state.logPageSize = size;
            state.logPage = 1;
            renderLogDrawer();
          }
        });
      }
    }
  }

  function openLogDrawer(row) {
    if (!row) return;
    state.logUserId = row.id;
    state.logPage = 1;
    renderLogDrawer();
    UI.openDrawer('logDrawer');
  }

  function closeLogDrawer() {
    UI.closeDrawer('logDrawer');
    state.logUserId = null;
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('resetBtn').addEventListener('click', function () {
    state.draft = {
      nickname: '',
      departments: [],
      roles: [],
      dataGroups: [],
      status: ''
    };
    $('filterNickname').value = '';
    if (deptFilter && deptFilter.render) deptFilter.render();
    if (roleFilter && roleFilter.render) roleFilter.render();
    if (dataGroupFilter && dataGroupFilter.render) dataGroupFilter.render();
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row);
    else if (action === 'impersonate') openImpersonate(row);
    else if (action === 'log') openLogDrawer(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      UI.closeModal('editModal');
    });
  });
  $('editSubmit').addEventListener('click', submitEdit);

  document.querySelectorAll('[data-close="impersonateModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.impersonateId = null;
      UI.closeModal('impersonateModal');
    });
  });
  $('impersonateOk').addEventListener('click', confirmImpersonate);

  $('logDrawerClose').addEventListener('click', closeLogDrawer);

  if (UI.bindSidebar) UI.bindSidebar();

  applyFilters();
  renderTable();
})();
