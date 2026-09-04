/* 产品系列 · 示例数据.xlsx 产品系列分表 */
(function () {
  'use strict';

  ProductShell.mount('product-series');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  /* 来自 示例数据.xlsx · 产品系列 */
  var SERIES_SEED = [
    { id: 212, name: "Life Simulator", remark: "Life Simulator-马甲包", products: 3, status: "启用", updatedAt: "2026-09-03 09:58:59" },
    { id: 211, name: "Logic Link", remark: "Logic Link-马甲包", products: 3, status: "启用", updatedAt: "2026-09-03 09:56:55" },
    { id: 210, name: "Water Sort-Color Sort Game", remark: "Water Sort-Color Sort Game-马甲包", products: 3, status: "启用", updatedAt: "2026-09-03 09:38:12" },
    { id: 209, name: "Doctor ASMR", remark: "Doctor ASMR-马甲包", products: 3, status: "启用", updatedAt: "2026-09-03 09:33:09" },
    { id: 208, name: "Frozen to Death", remark: "Frozen to Death-马甲包", products: 3, status: "启用", updatedAt: "2026-09-03 09:27:32" },
    { id: 207, name: "From Nothing", remark: "From Nothing-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:22:33" },
    { id: 206, name: "Hospital Game - Doctor Hero", remark: "Hospital Game - Doctor Hero-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:21:46" },
    { id: 205, name: "Mahjong Treasure Quest", remark: "Mahjong Treasure Quest-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:21:26" },
    { id: 204, name: "Polysphere: Art Puzzle", remark: "Polysphere: Art Puzzle-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:20:33" },
    { id: 203, name: "One Line: Drawing Puzzle Game", remark: "One Line: Drawing Puzzle Game-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:20:09" },
    { id: 202, name: "Color Maze: Paintdog Puzzles", remark: "Color Maze: Paintdog Puzzles-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:18:38" },
    { id: 201, name: "Rotate the Rings", remark: "Rotate the Rings-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:18:19" },
    { id: 200, name: "Line Puzzle: String Art", remark: "Line Puzzle: String Art-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:18:01" },
    { id: 199, name: "Alien Finder", remark: "Alien Finder-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:17:42" },
    { id: 198, name: "Crazy Mahjong", remark: "Crazy Mahjong-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:17:20" },
    { id: 197, name: "Brain Test: Tricky Puzzle", remark: "Brain Test: Tricky Puzzle-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:16:34" },
    { id: 196, name: "Psychic Dust: Sandbox World", remark: "Psychic Dust: Sandbox World-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:16:13" },
    { id: 195, name: "Bubble Pop Dream", remark: "Bubble Pop Dream-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:15:46" },
    { id: 194, name: "Art of Puzzles", remark: "Art of Puzzles-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:15:24" },
    { id: 193, name: "Smart Puzzles Collection", remark: "Smart Puzzles Collection-马甲包", products: 1, status: "启用", updatedAt: "2026-09-03 09:15:01" },
    { id: 192, name: "Card Classification", remark: "Card Classification-马甲包", products: 4, status: "启用", updatedAt: "2026-09-03 09:14:25" },
    { id: 191, name: "Find The Cat - Spot It!", remark: "Find The Cat - Spot It!-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:21:20" },
    { id: 190, name: "Jigsaw Explorer: Puzzle Game", remark: "Jigsaw Explorer: Puzzle Game-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:20:55" },
    { id: 189, name: "Snake Escape! Snake Defense", remark: "Snake Escape! Snake Defense-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:20:33" },
    { id: 188, name: "Penguin Number Logic", remark: "Penguin Number Logic-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:20:10" },
    { id: 187, name: "Capybara Defense", remark: "Capybara Defense-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:19:49" },
    { id: 186, name: "Hero Rescue", remark: "Hero Rescue-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:19:30" },
    { id: 185, name: "Unblock Pipes", remark: "Unblock Pipes-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:19:01" },
    { id: 184, name: "Tidy Color", remark: "Tidy Color-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:17:43" },
    { id: 183, name: "Line Linker", remark: "Line Linker-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:16:52" },
    { id: 182, name: "IQ Power", remark: "IQ Power-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:15:45" },
    { id: 181, name: "Line It Up", remark: "Line It Up-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 15:14:44" },
    { id: 180, name: "The ASMR Lab", remark: "The ASMR Lab-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:14:05" },
    { id: 179, name: "Glow Solver", remark: "Glow Solver-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:13:46" },
    { id: 178, name: "Crazy Brain", remark: "Crazy Brain-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:12:55" },
    { id: 177, name: "Drift Line", remark: "Drift Line-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:11:02" },
    { id: 176, name: "Water Sort Quest", remark: "Water Sort Quest-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:10:33" },
    { id: 175, name: "Master of Water", remark: "Master of Water-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:09:41" },
    { id: 174, name: "Shelf Water Sort", remark: "Shelf Water Sort-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:08:55" },
    { id: 173, name: "Brain Test 99%", remark: "Brain Test 99%-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 15:08:21" },
    { id: 172, name: "Survive 100 Nights", remark: "Survive 100 Nights-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:06:56" },
    { id: 171, name: "My Boba Shop", remark: "My Boba Shop-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:06:28" },
    { id: 170, name: "Brain Crunch 100", remark: "Brain Crunch 100-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:06:01" },
    { id: 169, name: "Line Sort", remark: "Line Sort-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:05:05" },
    { id: 168, name: "Sort Sync", remark: "Sort Sync-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:02:02" },
    { id: 167, name: "Scrub That Fruit!", remark: "Scrub That Fruit!-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:01:17" },
    { id: 166, name: "Flow ASMR", remark: "Flow ASMR-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 15:00:08" },
    { id: 165, name: "Color Sort Now", remark: "Color Sort Now-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:58:20" },
    { id: 164, name: "No Cap Liquid Sort", remark: "No Cap Liquid Sort-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:57:43" },
    { id: 163, name: "Arrow Fitness", remark: "Arrow Fitness-马甲包", products: 2, status: "启用", updatedAt: "2026-09-03 09:54:43" },
    { id: 162, name: "Let Him Cook", remark: "Let Him Cook-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:53:48" },
    { id: 161, name: "Sand Crush", remark: "Sand Crush-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:48:51" },
    { id: 160, name: "Word Search Explorer", remark: "Word Search Explorer-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:48:24" },
    { id: 159, name: "天天拼詞王", remark: "天天拼詞王-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:47:02" },
    { id: 158, name: "Catch Penguin", remark: "Catch Penguin-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:45:49" },
    { id: 157, name: "Eliminate Tetris", remark: "Eliminate Tetris-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:43:20" },
    { id: 156, name: "Card Group", remark: "Card Group-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:41:50" },
    { id: 155, name: "Find The Pet", remark: "Find The Pet-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 14:39:19" },
    { id: 154, name: "Ball Craft", remark: "Ball Craft-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:35:04" },
    { id: 153, name: "Find It Out", remark: "Find It Out-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 14:33:41" },
    { id: 152, name: "Plot Twist", remark: "Plot Twist-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:32:59" },
    { id: 151, name: "Dual Gun Clash", remark: "Dual Gun Clash-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:32:26" },
    { id: 150, name: "Diamond Match", remark: "Diamond Match-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:30:52" },
    { id: 149, name: "Numbers Merge", remark: "Numbers Merge-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:30:30" },
    { id: 148, name: "文字の中に文字!", remark: "文字の中に文字!-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:29:45" },
    { id: 147, name: "Brain Power King", remark: "Brain Power King-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:28:27" },
    { id: 146, name: "Sand balls", remark: "Sand balls-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 14:25:28" },
    { id: 145, name: "Sort Coin", remark: "Sort Coin-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:24:49" },
    { id: 144, name: "Hyper Desh", remark: "Hyper Desh-马甲包", products: 1, status: "启用", updatedAt: "2026-09-02 14:24:26" },
    { id: 143, name: "Save Wukong", remark: "Save Wukong-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:23:26" },
    { id: 142, name: "Tidy Hotpot", remark: "Tidy Hotpot-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:22:37" },
    { id: 141, name: "Dot to Dot", remark: "Dot to Dot-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:17:30" },
    { id: 140, name: "Path Maze", remark: "Path Maze-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:16:41" },
    { id: 139, name: "Flow Quest", remark: "Flow Quest-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:15:38" },
    { id: 138, name: "Mind Mix Up", remark: "Mind Mix Up-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:14:07" },
    { id: 137, name: "Brainy Escape Quest", remark: "Brainy Escape Quest-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:12:44" },
    { id: 136, name: "Can You Pass?", remark: "Can You Pass?-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:11:49" },
    { id: 135, name: "Too Much Fun!", remark: "Too Much Fun!-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 14:08:40" },
    { id: 134, name: "Water Sort Delivery", remark: "Water Sort Delivery-马甲包", products: 4, status: "启用", updatedAt: "2026-09-02 11:50:42" },
    { id: 133, name: "ASMR Makeover", remark: "ASMR Makeover-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 11:49:14" },
    { id: 132, name: "Pressure Eliminator Puzzle", remark: "Pressure Eliminator Puzzle-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:48:31" },
    { id: 131, name: "Arrow Party", remark: "Arrow Party-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:48:00" },
    { id: 130, name: "IQ Spot", remark: "IQ Spot-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:47:12" },
    { id: 129, name: "Meme Detective", remark: "Meme Detective-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:46:47" },
    { id: 128, name: "Bus Go", remark: "Bus Go-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:46:23" },
    { id: 127, name: "Car Sorting", remark: "Car Sorting-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:46:00" },
    { id: 126, name: "Block Remove", remark: "Block Remove-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:45:12" },
    { id: 125, name: "Just Sort It", remark: "Just Sort It-马甲包", products: 2, status: "启用", updatedAt: "2026-09-02 11:39:57" },
    { id: 124, name: "Hotpot Go", remark: "Hotpot Go-马甲包", products: 8, status: "启用", updatedAt: "2026-09-02 11:36:43" },
    { id: 123, name: "諧音梗大師", remark: "諧音梗大師-马甲包", products: 3, status: "启用", updatedAt: "2026-09-02 11:28:27" },
    { id: 122, name: "Reborn For Revenge", remark: "Reborn For Revenge-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:17:40" },
    { id: 121, name: "Dark Fantasy Jigsaw", remark: "Dark Fantasy Jigsaw-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:17:29" },
    { id: 120, name: "Fantasy Jigsaw - HD Puzzle", remark: "Fantasy Jigsaw - HD Puzzle-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:17:19" },
    { id: 119, name: "Jigsaw Puzzles Epic", remark: "Jigsaw Puzzles Epic-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:17:09" },
    { id: 118, name: "Magic Jigsaw Puzzles", remark: "Magic Jigsaw Puzzles-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:16:59" },
    { id: 117, name: "Brain Tricky Jigsaw", remark: "Brain Tricky Jigsaw-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:16:49" },
    { id: 116, name: "Jigsaw King :Miserable Story", remark: "Jigsaw King :Miserable Story-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:16:39" },
    { id: 115, name: "Sheepy Puzzle Panic", remark: "Sheepy Puzzle Panic-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:16:25" },
    { id: 114, name: "Rescue Wukong", remark: "Rescue Wukong-马甲包", products: 5, status: "启用", updatedAt: "2026-07-22 18:16:10" },
    { id: 113, name: "Small Town Mess", remark: "Small Town Mess-马甲包", products: 1, status: "启用", updatedAt: "2026-07-22 18:15:45" }
  ];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  var ALL_ROWS = SERIES_SEED.map(function (item) {
    return {
      id: String(item.id),
      name: item.name,
      remark: item.remark || '',
      products: item.products,
      status: item.status,
      updatedAt: item.updatedAt
    };
  });

  var state = {
    draft: { name: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editStatus: '启用',
    deleteId: null,
    deleteBlocked: false
  };

  function applyFilters() {
    state.applied = {
      name: (state.draft.name || '').trim(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f) return ALL_ROWS.slice();
    return ALL_ROWS.filter(function (row) {
      if (f.name && row.name.toLowerCase().indexOf(f.name.toLowerCase()) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
  }

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

  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
  });

  var filterNameClear = UI.bindInputClearable({
    wrapId: 'filterNameWrap',
    clearId: 'filterNameClear',
    onClear: function () { state.draft.name = ''; }
  });
  var editNameClear = UI.bindInputClearable({
    wrapId: 'editNameWrap',
    clearId: 'editNameClear',
    onClear: function () { clearEditErrors(); }
  });
  var editRemarkClear = UI.bindInputClearable({
    wrapId: 'editRemarkWrap',
    clearId: 'editRemarkClear'
  });

  $('filterName').addEventListener('input', function () {
    state.draft.name = this.value || '';
  });
  $('filterName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      renderTable();
    }
  });

  function clearEditErrors() {
    var el = $('editNameItem');
    if (el) el.classList.remove('is-error');
  }

  function setItemError(id, on, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle('is-error', !!on);
    if (on && msg) {
      var err = el.querySelector('.form-item__error');
      if (err) err.textContent = msg;
    }
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
          '<td>' + escapeHtml(row.id) + '</td>' +
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(row.remark || '') + '">' + escapeHtml(row.remark || '-') + '</td>' +
          '<td>' + (row.products || 0) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td title="' + escapeHtml(row.updatedAt) + '">' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link link--danger" type="button" data-action="delete">删除</button>' +
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
    if (window.ColResize) ColResize.refresh($('seriesTable'));
  }

  function nextSeriesId() {
    var max = 0;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(r.id, 10);
      if (isFinite(n) && n > max) max = n;
    });
    return String(max + 1);
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加产品系列';
    $('editName').value = '';
    $('editRemark').value = '';
    UI.setSegValue('editStatusSeg', '启用');
    if (editNameClear) editNameClear.sync();
    if (editRemarkClear) editRemarkClear.sync();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑产品系列';
    $('editName').value = row.name;
    $('editRemark').value = row.remark || '';
    UI.setSegValue('editStatusSeg', state.editStatus);
    if (editNameClear) editNameClear.sync();
    if (editRemarkClear) editRemarkClear.sync();
    UI.openModal('editModal');
  }

  function submitEdit() {
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var status = state.editStatus || '启用';

    if (!name) {
      setItemError('editNameItem', true, '请输入产品系列');
      return;
    }

    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (duplicated) {
      setItemError('editNameItem', true, '产品系列已存在');
      return;
    }

    var now = formatDateTime(new Date());
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextSeriesId(),
        name: name,
        remark: remark,
        products: 0,
        status: status,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.name = name;
      row.remark = remark;
      row.status = status;
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  function openDelete(row) {
    state.deleteId = row.id;
    var count = row.products || 0;
    state.deleteBlocked = count > 0;
    $('deleteTitle').textContent = '删除确认';
    if (state.deleteBlocked) {
      $('deleteBody').textContent = '当前系列存在关联产品，请移除后再执行删除。';
    } else {
      $('deleteBody').textContent = '此操作不可撤销，确认删除吗？';
    }
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var id = state.deleteId;
    var blocked = state.deleteBlocked;
    state.deleteId = null;
    state.deleteBlocked = false;
    UI.closeModal('deleteModal');
    if (!id) return;
    if (blocked) {
      UI.showToast('请先移除关联产品', 'warning');
      return;
    }
    ALL_ROWS = ALL_ROWS.filter(function (r) { return r.id !== id; });
    UI.showToast('删除成功', 'success');
    renderTable();
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('addBtn').addEventListener('click', openAdd);

  $('tableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'edit') openEdit(row);
    else if (action === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });
  $('editSubmit').addEventListener('click', submitEdit);
  $('editName').addEventListener('input', function () { clearEditErrors(); });

  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.deleteId = null;
      state.deleteBlocked = false;
      UI.closeModal('deleteModal');
    });
  });
  $('deleteOk').addEventListener('click', confirmDelete);

  applyFilters();
  renderTable();
})();
