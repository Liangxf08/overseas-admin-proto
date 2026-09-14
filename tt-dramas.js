/* 短剧 */
(function () {
  'use strict';

  ProductShell.mount('tt-dramas');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var DRAMA_LIST_API = 'tt-dramas-data.json';

  var SEED = [
    { id: '10001', title: 'Three Beauties One Savior', language: '英语', cover: '', createdAt: '2026-04-01 09:00:00', updatedAt: '2026-04-05 09:00:00' },
    { id: '10002', title: 'Tackled Into You', language: '英语', cover: '', createdAt: '2026-04-13 10:11:07', updatedAt: '2026-04-13 10:11:07' },
    { id: '10003', title: 'Dissecting the Don: Deal with the Devil', language: '英语', cover: '', createdAt: '2026-04-25 11:22:14', updatedAt: '2026-04-25 11:22:14' },
    { id: '10004', title: 'The Lone Lamb Rules the Wolves', language: '英语', cover: '', createdAt: '2026-05-07 12:33:21', updatedAt: '2026-05-11 12:33:21' },
    { id: '10005', title: 'Retired Hero：Delivery of Justice', language: '英语', cover: '', createdAt: '2026-05-19 13:44:28', updatedAt: '2026-05-19 13:44:28' },
    { id: '10006', title: 'All In：The Don\'s Collateral Bride', language: '英语', cover: '', createdAt: '2026-05-31 14:55:35', updatedAt: '2026-05-31 14:55:35' },
    { id: '10007', title: 'Called Her Fat. Made Them Kneel', language: '英语', cover: '', createdAt: '2026-06-12 09:06:42', updatedAt: '2026-06-16 09:06:42' },
    { id: '10008', title: 'Dragonless：Born to Reign', language: '英语', cover: '', createdAt: '2026-06-24 10:17:49', updatedAt: '2026-06-24 10:17:49' },
    { id: '10009', title: 'No Mercy：The Husband\'s Reckoning', language: '英语', cover: '', createdAt: '2026-07-06 11:28:56', updatedAt: '2026-07-06 11:28:56' },
    { id: '10010', title: 'They Mocked the Wrong Mother', language: '英语', cover: '', createdAt: '2026-07-18 12:39:03', updatedAt: '2026-07-22 12:39:03' },
    { id: '10011', title: 'Rejected Luna, Destined Queen: Season 1', language: '英语', cover: '', createdAt: '2026-07-30 13:50:10', updatedAt: '2026-07-30 13:50:10' },
    { id: '10012', title: 'Rejected Luna, Destined Queen：Final Season', language: '英语', cover: '', createdAt: '2026-08-11 14:01:17', updatedAt: '2026-08-11 14:01:17' },
    { id: '10013', title: 'Neon Hidden Cards', language: '英语', cover: '', createdAt: '2026-08-23 09:12:24', updatedAt: '2026-08-27 09:12:24' },
    { id: '10014', title: 'His Hidden Devotion', language: '英语', cover: '', createdAt: '2026-09-04 10:23:31', updatedAt: '2026-09-04 10:23:31' },
    { id: '10015', title: 'Above the Ashes', language: '英语', cover: '', createdAt: '2026-09-16 11:34:38', updatedAt: '2026-09-16 11:34:38' },
    { id: '10016', title: 'Day Four Calamity’s Nemesis', language: '英语', cover: '', createdAt: '2026-09-28 12:45:45', updatedAt: '2026-10-02 12:45:45' },
    { id: '10017', title: 'Customer Service Marvin', language: '英语', cover: '', createdAt: '2026-10-10 13:56:52', updatedAt: '2026-10-10 13:56:52' },
    { id: '10018', title: 'The Mountain Wolf Cub', language: '英语', cover: '', createdAt: '2026-10-22 14:07:59', updatedAt: '2026-10-22 14:07:59' },
    { id: '10019', title: 'Heist for My Daughter Season 1', language: '英语', cover: '', createdAt: '2026-11-03 09:18:06', updatedAt: '2026-11-07 09:18:06' },
    { id: '10020', title: 'Heist for My Daughter：Final Season', language: '英语', cover: '', createdAt: '2026-11-15 10:29:13', updatedAt: '2026-11-15 10:29:13' },
    { id: '10021', title: 'Never Yours, Mr. Weston', language: '英语', cover: '', createdAt: '2026-11-27 11:40:20', updatedAt: '2026-11-27 11:40:20' },
    { id: '10022', title: 'When the Golden Boy Breaks', language: '英语', cover: '', createdAt: '2026-12-09 12:51:27', updatedAt: '2026-12-13 12:51:27' },
    { id: '10023', title: 'The King of Stray Dogs', language: '英语', cover: '', createdAt: '2026-12-21 13:02:34', updatedAt: '2026-12-21 13:02:34' },
    { id: '10024', title: 'Tomorrows Headlines', language: '英语', cover: '', createdAt: '2027-01-02 14:13:41', updatedAt: '2027-01-02 14:13:41' },
    { id: '10025', title: 'CLEANER', language: '英语', cover: '', createdAt: '2027-01-14 09:24:48', updatedAt: '2027-01-18 09:24:48' },
    { id: '10026', title: 'Little Genius, Big Trouble', language: '英语', cover: '', createdAt: '2027-01-26 10:35:55', updatedAt: '2027-01-26 10:35:55' },
    { id: '10027', title: 'Ava\'s Monster Notebook', language: '英语', cover: '', createdAt: '2027-02-07 11:46:02', updatedAt: '2027-02-07 11:46:02' },
    { id: '10028', title: 'Spin Cycle Queens', language: '英语', cover: '', createdAt: '2027-02-19 12:57:09', updatedAt: '2027-02-23 12:57:09' },
    { id: '10029', title: 'The Substitute Maid', language: '英语', cover: '', createdAt: '2027-03-03 13:08:16', updatedAt: '2027-03-03 13:08:16' },
    { id: '10030', title: 'The Ironwife From Dirt Farm to Empire', language: '英语', cover: '', createdAt: '2027-03-15 14:19:23', updatedAt: '2027-03-15 14:19:23' },
    { id: '10031', title: 'The Maid Heiress', language: '英语', cover: '', createdAt: '2027-03-27 09:30:30', updatedAt: '2027-03-31 09:30:30' },
    { id: '10032', title: 'The curse of the red moon', language: '英语', cover: '', createdAt: '2027-04-08 10:41:37', updatedAt: '2027-04-08 10:41:37' },
    { id: '10033', title: 'The Playboy\'s Decoy', language: '英语', cover: '', createdAt: '2027-04-20 11:52:44', updatedAt: '2027-04-20 11:52:44' },
    { id: '10034', title: 'The Billionaire Beneath the Hoodie', language: '英语', cover: '', createdAt: '2027-05-02 12:03:51', updatedAt: '2027-05-06 12:03:51' },
    { id: '10035', title: 'A Rose for the Exiled King', language: '英语', cover: '', createdAt: '2027-05-14 13:14:58', updatedAt: '2027-05-14 13:14:58' }
  ];

  var ALL_ROWS = normalizeRows(SEED);

  var state = {
    draft: { title: '', language: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    syncing: false
  };

  function formatDisplayTime(str) {
    if (!str) return '-';
    return String(str).replace('T', ' ').slice(0, 19);
  }

  function normalizeRows(list) {
    if (!Array.isArray(list)) return [];
    return list.map(function (item, i) {
      return {
        id: String(item.id != null ? item.id : i + 1),
        title: item.title || item.name || '',
        language: item.language || item.lang || '英语',
        cover: item.cover || item.coverUrl || item.icon || '',
        createdAt: item.createdAt || item.createTime || item.created_at || '',
        updatedAt: item.updatedAt || item.updateTime || item.updated_at || ''
      };
    });
  }

  function fetchDramaList() {
    return fetch(DRAMA_LIST_API, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('sync failed');
      return res.json();
    }).then(function (payload) {
      var list = Array.isArray(payload) ? payload : (payload && (payload.data || payload.list || payload.records));
      var rows = normalizeRows(list);
      if (!rows.length) throw new Error('empty');
      return rows;
    }).catch(function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(normalizeRows(SEED));
        }, 300);
      });
    });
  }

  function applyFilters() {
    state.applied = {
      title: (state.draft.title || '').trim(),
      language: state.draft.language || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var list = !f
      ? ALL_ROWS.slice()
      : ALL_ROWS.filter(function (row) {
        if (f.title && String(row.title).toLowerCase().indexOf(f.title.toLowerCase()) === -1) return false;
        if (f.language && row.language !== f.language) return false;
        return true;
      });
    return list.sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }

  UI.bindInputClearable({
    wrapId: 'filterTitleWrap',
    clearId: 'filterTitleClear',
    onClear: function () { state.draft.title = ''; }
  });
  UI.bindSingleSelect({
    wrapId: 'langWrap',
    triggerId: 'langTrigger',
    panelId: 'langPanel',
    labelId: 'langLabel',
    clearId: 'langClear',
    prefix: '语种：',
    getValue: function () { return state.draft.language; },
    onChange: function (v) { state.draft.language = v || ''; }
  });

  function on(id, event, fn) {
    var el = $(id);
    if (!el) return;
    el.addEventListener(event, fn);
  }

  on('filterTitle', 'input', function () { state.draft.title = this.value || ''; });
  on('filterTitle', 'keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      renderTable();
    }
  });

  function titleCell(row) {
    return '<span class="product-cell">' +
      (row.cover
        ? '<img class="product-cell__icon product-cell__icon--img" src="' + escapeHtml(row.cover) + '" alt="" />'
        : '<span class="product-cell__icon" aria-hidden="true"></span>') +
      '<span class="product-cell__name">' + escapeHtml(row.title) + '</span>' +
    '</span>';
  }

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
          '<td title="' + escapeHtml(row.id) + '">' + escapeHtml(row.id) + '</td>' +
          '<td title="' + escapeHtml(row.title) + '">' + titleCell(row) + '</td>' +
          '<td>' + escapeHtml(row.language || '英语') + '</td>' +
          '<td title="' + escapeHtml(formatDisplayTime(row.createdAt)) + '">' + escapeHtml(formatDisplayTime(row.createdAt)) + '</td>' +
          '<td title="' + escapeHtml(formatDisplayTime(row.updatedAt)) + '">' + escapeHtml(formatDisplayTime(row.updatedAt)) + '</td>' +
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
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function setSyncing(on) {
    state.syncing = !!on;
    var btn = $('syncBtn');
    if (!btn) return;
    btn.disabled = state.syncing;
    btn.textContent = state.syncing ? '同步中...' : '同步';
  }

  function syncList() {
    if (state.syncing) return;
    setSyncing(true);
    fetchDramaList().then(function (rows) {
      ALL_ROWS = rows;
      applyFilters();
      renderTable();
      UI.showToast('同步成功', 'success');
    }).catch(function () {
      UI.showToast('同步失败', 'error');
    }).then(function () {
      setSyncing(false);
    });
  }

  try {
    on('queryBtn', 'click', function () {
      applyFilters();
      renderTable();
    });
    on('syncBtn', 'click', syncList);
  } finally {
    applyFilters();
    renderTable();
  }
})();
