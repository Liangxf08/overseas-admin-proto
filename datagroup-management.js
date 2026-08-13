/* 数据组管理 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var PLATFORMS = ['Android', 'iOS', 'TikTok'];
  var PRODUCT_GROUPS = ['奇异果', '无花果', '苹果组', '坚果组', '硕果组', '外部联运'];
  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png',
    TikTok: 'assets/TikTok.png'
  };

  var PRODUCT_LEAF = [{"id": "p-app-44759427", "name": "船长先别浪", "platform": "Android", "group": "苹果组"}, {"id": "p-app-44759012", "name": "Marble Drop: Yarn Sort 3D", "platform": "Android", "group": "无花果"}, {"id": "p-app-44760299", "name": "Clues Card Sort", "platform": "Android", "group": "外部联运"}, {"id": "p-app-44758959", "name": "Dazzle Jewel: Color by Number", "platform": "iOS", "group": "无花果"}, {"id": "p-app-44759420", "name": "腦洞諧音梗", "platform": "Android", "group": "奇异果"}, {"id": "p-app-44758533", "name": "超玩美派对", "platform": "Android", "group": "外部联运"}, {"id": "p-app-yw9lshrbidpfdn5r", "name": "Dazzle Jewel: Color by Number", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywvt69aoqfdgyti2", "name": "Hotpot Match 3D", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywllomnwrelksbqf", "name": "Brain Sort: Card Matching (再闯多一关)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywe6yu9jijpdaqny", "name": "Tree Forest: Detective Words (梗界名侦探)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywdlqalcjufrrnvf", "name": "别崩人设啊", "platform": "Android", "group": "外部联运"}, {"id": "p-app-ywpdfc6dubzicufk", "name": "找到算你赢", "platform": "Android", "group": "外部联运"}, {"id": "p-app-yw0dgvhiainhcmkh", "name": "Tile Sort 3D (王牌分揀師)", "platform": "iOS", "group": "无花果"}, {"id": "p-app-yweifjjmicf9p6nb", "name": "Tile Sort 3D (王牌分揀師)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywfoiwggjwparxeg", "name": "砍價大偵探 (Haggle Sleuth)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-yw1abauttjsdlfid", "name": "Pixel Bounce Jam (解壓彈球館)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywtxo3h35gdorhhy", "name": "Story Match: Associate Puzzle (腦洞故事會)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywaqguiga4atkiys", "name": "Hotpot Match 3D (做道拿手菜)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywz81voqjnqdro6k", "name": "文字の中に文字!", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywcmqyno7op0saj6", "name": "文字の中に文字!", "platform": "Android", "group": "奇异果"}, {"id": "p-app-yws1vlet5pzl2jfz", "name": "Perfect Care: Cleaning ASMR (完美護理師)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywf1njgrzfd8rbug", "name": "Jigword:Word Search Games", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywaetwpisalt2c3m", "name": "我要當學霸", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywyiiamni7g8qgem", "name": "天天拼詞王", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywunnomrkqca7ssx", "name": "Yarn Link: Cozy Knitting ASMR (連線織物)", "platform": "iOS", "group": "无花果"}, {"id": "p-app-ywz6rn4ssw0p9l65", "name": "Arrow Away 3D: Escape Puzzle (箭指3D)", "platform": "iOS", "group": "无花果"}, {"id": "p-app-ywrgqyro4r8ddnfx", "name": "Yarn Link: Cozy Knitting ASMR (連線織物)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywqfugfl092yucgw", "name": "Glow Sort: Diamond ASMR (钻石排序)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywqdjn4vhue13tfl", "name": "天天拼詞王", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywcwonmybbkpxejf", "name": "Yarn Link (連線織物)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywrz2gdol8rvkgnm", "name": "Gems Match: Art Jigsaw (钻石拼图)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywhwt6jmqhpvjk4x", "name": "Drop Crush: Match Mart", "platform": "Android", "group": "苹果组"}, {"id": "p-app-ywdk06nyrxqyeh1t", "name": "Go! Food God (我要当食神)", "platform": "Android", "group": "外部联运"}, {"id": "p-app-ywiae05mgkty0z2y", "name": "Go! Food God (我要当食神)", "platform": "iOS", "group": "外部联运"}, {"id": "p-app-ywxbh2lzgfqbj6fs", "name": "腦洞找茬王", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywbwuuq0oubyznrs", "name": "腦洞找茬王", "platform": "Android", "group": "奇异果"}, {"id": "p-app-yw8eztowurntwckb", "name": "砍價大偵探（Haggle Sleuth）", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywxoryx6oqrwgidv", "name": "Jigsaw Master：Horror Story (难倒大侦探)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-yw6sgl94knuw4q4w", "name": "Gems Match: Color Puzzle (钻石拼图)", "platform": "iOS", "group": "无花果"}, {"id": "p-app-yw0yqjwcunjjc2e9", "name": "Traffic Jam: Hop On! (老司機帶帶我！)", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywc76fkxfgydmsu8", "name": "Traffic Jam: Hop On! (老司機帶帶我！)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywjmmkcoxapyilti", "name": "Screw Pin Jam Puzzle (拦不住我)", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-yw8b2wpcbslfxpsg", "name": "Screw Pin Jam Puzzle (拦不住我)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywc6chqlqou3rrmv", "name": "Screw Away: 3D Pin Puzzle", "platform": "iOS", "group": "无花果"}, {"id": "p-app-ywwldpgkohfwiaxg", "name": "Screw Away: 3D Pin Puzzle", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywjwtqxvh4njgggt", "name": "Girl Rescue: Dragon Out! (营救女孩)", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-yw8axztjbc1ytney", "name": "Girl Rescue: Dragon Out! (营救女孩)", "platform": "Android", "group": "奇异果"}, {"id": "p-app-ywp2r8z4tnmqxjse", "name": "Dragon Fever TD (恶龙守不住)", "platform": "iOS", "group": "苹果组"}, {"id": "p-app-ywriymiitgfwxb0p", "name": "Dragon Fever TD (恶龙守不住)", "platform": "Android", "group": "苹果组"}, {"id": "p-app-ywxv4rpzjhi5wb8r", "name": "Diamond Flow: Color Puzzle (钻石拼图)", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywypo3rm81gevebx", "name": "Cube Out 3D :Jam Puzzle", "platform": "iOS", "group": "无花果"}, {"id": "p-app-yw2dxsamb89oufmk", "name": "Cube Out 3D :Jam Puzzle", "platform": "Android", "group": "无花果"}, {"id": "p-app-ywobechndfzhncdm", "name": "Cat Defenders: Shelling Snake (吃不到我)", "platform": "iOS", "group": "奇异果"}, {"id": "p-app-ywsvsxdlmq0fgap5", "name": "Cat Defenders: Shelling Snake (吃不到我)", "platform": "Android", "group": "奇异果"}, {"id": "p-mini-44760363", "name": "Fun Overload", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760156", "name": "Mind Block", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760356", "name": "Brainy Find", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760195", "name": "Life Story", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760190", "name": "Brain Mix", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758636", "name": "Flow Mix", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759962", "name": "Life Choice", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759891", "name": "Life Path", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760174", "name": "Brainy Breakout", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760164", "name": "Mind Escape", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759426", "name": "Flow Master", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759081", "name": "Brainy Win", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758892", "name": "Path Flow", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760064", "name": "Wukong Out", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759538", "name": "Help Wukong", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758558", "name": "Draw Rescue Wukong", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759245", "name": "Save Wukong", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760080", "name": "Tidy Hotpot", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760005", "name": "Food Sort", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759186", "name": "Hotpot Master", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758887", "name": "Hyper Desh", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44760172", "name": "Sort Coin", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759899", "name": "Sort Coin Master", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758632", "name": "Piggy Coin Sort", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759913", "name": "Sand Ball Drop", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759682", "name": "Ball Sand", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759628", "name": "Ball Run", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759541", "name": "Brain Queen", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758400", "name": "Brain Power Queen", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758366", "name": "Eye Track", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760215", "name": "言葉を探す", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759979", "name": "文字の宝探し！", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759157", "name": "文字の奥に小文字", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760160", "name": "文字の中に文字!", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760022", "name": "Count Sprint", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44759917", "name": "Digit Merge", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44759513", "name": "Diamond Match", "platform": "TikTok", "group": "无花果"}, {"id": "p-mini-44758889", "name": "Diamond ASMR", "platform": "TikTok", "group": "无花果"}, {"id": "p-mini-44758476", "name": "Gems Color Puzzle", "platform": "TikTok", "group": "无花果"}, {"id": "p-mini-44759278", "name": "Brain Power King", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760120", "name": "Word Dig", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759570", "name": "Cute Gun Bump", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44758408", "name": "Word Player", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759961", "name": "Card Group", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759636", "name": "Dual Gun Clash", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44758881", "name": "Card Assort", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44759773", "name": "Tile Stack!", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44758456", "name": "Sort Stack", "platform": "TikTok", "group": "奇异果"}, {"id": "p-mini-44760310", "name": "Mad Moto", "platform": "TikTok", "group": "外部联运"}, {"id": "p-mini-44760203", "name": "Color Tetris", "platform": "TikTok", "group": "奇异果"}];

  var GROUP_SEED = [
    { name: '开发测试', remark: '', scope: 'partial', products: 2, users: 1 },
    { name: 'APP-无花果', remark: '', scope: 'partial', products: 8, users: 2 },
    { name: 'APP-奇异果', remark: '', scope: 'partial', products: 12, users: 3 },
    { name: 'TikTok微短剧', remark: '', scope: 'partial', products: 0, users: 0 },
    { name: 'TikTok小游戏', remark: '', scope: 'partial', products: 6, users: 2 },
    { name: 'APP投放组', remark: '', scope: 'partial', products: 5, users: 2 },
    { name: '小游戏投放组', remark: '', scope: 'partial', products: 4, users: 1 },
    { name: 'APP运营组', remark: '', scope: 'partial', products: 7, users: 3 },
    { name: '小游戏运营组', remark: '', scope: 'partial', products: 5, users: 2 },
    { name: '全产品', remark: '全量授权', scope: 'all', products: 0, users: 1 }
  ];

  var ALL_USER_POOL = Array.from({ length: 24 }, function (_, i) {
    return { id: 'user-' + (i + 1), name: '用户' + String.fromCharCode(65 + i) };
  });

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function platformIconHtml(platform) {
    var src = PLATFORM_ICONS[platform];
    if (!src) {
      return '<span class="perm-node__icon perm-node__icon--placeholder" aria-hidden="true"></span>';
    }
    return '<img class="perm-node__icon" src="' + src + '" alt="" width="16" height="16" onerror="this.classList.add(\'perm-node__icon--placeholder\');this.removeAttribute(\'src\')" />';
  }

  function buildPermTree() {
    return PLATFORMS.map(function (plat) {
      return {
        id: 'plat:' + plat,
        name: plat,
        kind: 'platform',
        children: PRODUCT_GROUPS.map(function (g) {
          var leaves = PRODUCT_LEAF.filter(function (p) {
            return p.platform === plat && p.group === g;
          }).map(function (p) {
            return {
              id: p.id,
              name: p.name,
              kind: 'product',
              platform: p.platform
            };
          });
          return {
            id: 'group:' + plat + ':' + g,
            name: g,
            kind: 'group',
            children: leaves
          };
        })
      };
    });
  }

  var PERM_TREE = buildPermTree();
  var ALL_PRODUCT_IDS = PRODUCT_LEAF.map(function (p) { return p.id; });

  function walkPerm(nodes, fn) {
    (nodes || []).forEach(function (n) {
      fn(n);
      if (n.children) walkPerm(n.children, fn);
    });
  }

  function findPermNode(nodes, id) {
    var found = null;
    walkPerm(nodes, function (n) {
      if (n.id === id) found = n;
    });
    return found;
  }

  function collectLeafIds(nodes, out) {
    out = out || [];
    (nodes || []).forEach(function (n) {
      if (n.children && n.children.length) collectLeafIds(n.children, out);
      else if (n.kind === 'product') out.push(n.id);
    });
    return out;
  }

  function getDescendantLeafIds(node) {
    if (node.kind === 'product' || !node.children || !node.children.length) {
      return node.kind === 'product' ? [node.id] : [];
    }
    return collectLeafIds(node.children);
  }

  function buildRows() {
    return GROUP_SEED.map(function (item, i) {
      var updated = new Date(2026, 7, 10, 10, 25, 0);
      updated.setMinutes(updated.getMinutes() - i * 11);
      var productIds = [];
      if (item.scope === 'all') {
        productIds = ALL_PRODUCT_IDS.slice();
      } else {
        var count = Math.min(item.products, ALL_PRODUCT_IDS.length);
        var j;
        for (j = 0; j < count; j++) {
          productIds.push(ALL_PRODUCT_IDS[(i * 3 + j) % ALL_PRODUCT_IDS.length]);
        }
      }
      var userIds = [];
      var u;
      for (u = 0; u < item.users; u++) {
        userIds.push(ALL_USER_POOL[(i + u) % ALL_USER_POOL.length].id);
      }
      return {
        id: 'dg-' + (i + 1),
        name: item.name,
        remark: item.remark || '',
        scope: item.scope,
        productIds: productIds,
        userIds: userIds,
        status: i === 11 ? '禁用' : '启用',
        updatedAt: formatDateTime(updated)
      };
    });
  }

  var ALL_ROWS = buildRows();

  var state = {
    draft: { name: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'edit',
    editId: null,
    editScope: 'partial',
    editStatus: '启用',
    permId: null,
    permSelectedIds: [],
    permAvailChecked: {},
    permSelectedChecked: {},
    permAvailKw: '',
    permSelectedKw: '',
    permAvailCollapsed: {},
    permSelectedCollapsed: {},
    userId: null,
    selectedIds: [],
    availChecked: {},
    selectedChecked: {},
    availKw: '',
    selectedKw: '',
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
      if (f.name && row.name.indexOf(f.name) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === id; });
  }

  function productCount(row) {
    if (!row) return 0;
    if (row.scope === 'all') return ALL_PRODUCT_IDS.length;
    return row.productIds ? row.productIds.length : 0;
  }

  function syncScopeHint() {
    var hint = $('editScopeHint');
    if (!hint) return;
    hint.hidden = state.editScope !== 'all';
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

  UI.bindSeg('editScopeSeg', function (v) {
    state.editScope = v || 'partial';
    syncScopeHint();
  });
  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
  });

  $('filterName').addEventListener('input', function () {
    state.draft.name = this.value || '';
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
          '<td>' + escapeHtml(row.name) + '</td>' +
          '<td title="' + escapeHtml(row.remark || '') + '">' + escapeHtml(row.remark || '-') + '</td>' +
          '<td>' + productCount(row) + '</td>' +
          '<td>' + (row.userIds ? row.userIds.length : 0) + '</td>' +
          '<td>' + UI.statusTag(row.status) + '</td>' +
          '<td>' + escapeHtml(row.updatedAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
            '<button class="link" type="button" data-action="perm">权限</button>' +
            '<button class="link" type="button" data-action="users">用户</button>' +
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
    if (window.ColResize) ColResize.refresh($('groupTable'));
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editScope = 'partial';
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加数据组';
    $('editName').value = '';
    $('editRemark').value = '';
    UI.setSegValue('editScopeSeg', 'partial');
    UI.setSegValue('editStatusSeg', '启用');
    syncScopeHint();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editScope = row.scope || 'partial';
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑数据组';
    $('editName').value = row.name;
    $('editRemark').value = row.remark || '';
    UI.setSegValue('editScopeSeg', state.editScope);
    UI.setSegValue('editStatusSeg', state.editStatus);
    syncScopeHint();
    UI.openModal('editModal');
  }

  function submitEdit() {
    clearEditErrors();
    var name = ($('editName').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var scope = state.editScope || 'partial';
    var status = state.editStatus || '启用';

    if (!name) {
      setItemError('editNameItem', true, '请输入数据组名称');
      return;
    }
    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return r.name === name;
    });
    if (duplicated) {
      setItemError('editNameItem', true, '数据组名称已存在');
      return;
    }

    var now = formatDateTime(new Date());
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: 'dg-' + Date.now(),
        name: name,
        remark: remark,
        scope: scope,
        productIds: scope === 'all' ? ALL_PRODUCT_IDS.slice() : [],
        userIds: [],
        status: status,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.name = name;
      row.remark = remark;
      row.scope = scope;
      if (scope === 'all') row.productIds = ALL_PRODUCT_IDS.slice();
      row.status = status;
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  function nodeVisible(node, kw, leafFilter, forceShow) {
    if (node.kind === 'product') {
      if (leafFilter && !leafFilter(node.id)) return false;
      if (forceShow || !kw) return true;
      return String(node.name).toLowerCase().indexOf(kw) !== -1;
    }
    var selfMatch = !!(kw && String(node.name).toLowerCase().indexOf(kw) !== -1);
    var nextForce = forceShow || selfMatch;
    var kids = (node.children || []).filter(function (c) {
      return nodeVisible(c, kw, leafFilter, nextForce);
    });
    if (!kids.length) return false;
    if (!kw || forceShow || selfMatch) return true;
    return true;
  }

  function visibleLeaves(node, kw, leafFilter, out, forceShow) {
    out = out || [];
    if (node.kind === 'product') {
      if (nodeVisible(node, kw, leafFilter, forceShow)) out.push(node.id);
      return out;
    }
    var selfMatch = !!(kw && String(node.name).toLowerCase().indexOf(kw) !== -1);
    var nextForce = forceShow || selfMatch;
    (node.children || []).forEach(function (c) {
      visibleLeaves(c, kw, leafFilter, out, nextForce);
    });
    return out;
  }

  function panelCheckState(node, kw, leafFilter, checkedMap) {
    var leaves = visibleLeaves(node, kw, leafFilter);
    if (!leaves.length) return { checked: false, indeterminate: false };
    var n = leaves.filter(function (id) { return !!checkedMap[id]; }).length;
    return {
      checked: n === leaves.length,
      indeterminate: n > 0 && n < leaves.length
    };
  }

  function setCheckedLeaves(leafIds, checked, checkedMap) {
    leafIds.forEach(function (id) {
      if (checked) checkedMap[id] = true;
      else delete checkedMap[id];
    });
  }

  function renderPermSide(cfg) {
    var listEl = $(cfg.listId);
    var countEl = $(cfg.countId);
    var checkAllEl = $(cfg.checkAllId);
    var kw = (cfg.kw || '').trim().toLowerCase();
    var leafFilter = cfg.leafFilter;
    var checkedMap = cfg.checkedMap;
    var collapsedMap = cfg.collapsedMap;
    var side = cfg.side;
    var emptyText = cfg.emptyText;

    var allLeaves = ALL_PRODUCT_IDS.filter(leafFilter);
    var visibleAll = [];
    PERM_TREE.forEach(function (n) {
      visibleLeaves(n, kw, leafFilter, visibleAll);
    });
    var checkedCount = visibleAll.filter(function (id) { return !!checkedMap[id]; }).length;
    countEl.textContent = checkedCount + ' / ' + allLeaves.length;
    checkAllEl.checked = visibleAll.length > 0 && checkedCount === visibleAll.length;
    checkAllEl.indeterminate = checkedCount > 0 && checkedCount < visibleAll.length;

    function renderNode(node, forceShow) {
      if (!nodeVisible(node, kw, leafFilter, forceShow)) return '';
      var hasChildren = !!(node.children && node.children.length);
      var collapsed = !!collapsedMap[node.id];
      var st = panelCheckState(node, kw, leafFilter, checkedMap);
      var toggleCls = hasChildren ? '' : ' is-leaf';
      var nodeCls = 'perm-node' + (collapsed ? ' is-collapsed' : '');
      var icon = node.kind === 'product' ? platformIconHtml(node.platform) : '';
      var selfMatch = !!(kw && String(node.name).toLowerCase().indexOf(kw) !== -1);
      var nextForce = forceShow || selfMatch;
      var childrenHtml = '';
      if (hasChildren) {
        childrenHtml = '<ul class="perm-node__children">' +
          node.children.map(function (c) { return renderNode(c, nextForce); }).join('') +
        '</ul>';
      }
      return '<li class="' + nodeCls + '" data-id="' + escapeHtml(node.id) + '">' +
        '<div class="perm-node__row">' +
          '<button class="perm-node__toggle' + toggleCls + '" type="button" data-perm-toggle="' + escapeHtml(node.id) + '" data-side="' + side + '" aria-label="展开收起">' +
            '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
          '</button>' +
          '<label class="perm-node__label">' +
            '<input type="checkbox" data-perm-node="' + escapeHtml(node.id) + '" data-side="' + side + '"' +
              (st.checked ? ' checked' : '') + ' />' +
            icon +
            '<span class="perm-node__text" title="' + escapeHtml(node.name) + '">' + escapeHtml(node.name) + '</span>' +
          '</label>' +
        '</div>' +
        childrenHtml +
      '</li>';
    }

    var html = PERM_TREE.map(function (n) { return renderNode(n, false); }).join('');
    if (!html) {
      listEl.innerHTML = '<div class="perm-tree__empty">' + emptyText + '</div>';
      return { visibleLeaves: visibleAll };
    }
    listEl.innerHTML = '<ul class="perm-node">' + html + '</ul>';
    listEl.querySelectorAll('input[data-perm-node]').forEach(function (input) {
      var node = findPermNode(PERM_TREE, input.getAttribute('data-perm-node'));
      if (!node) return;
      var st = panelCheckState(node, kw, leafFilter, checkedMap);
      input.checked = st.checked;
      input.indeterminate = st.indeterminate;
    });
    return { visibleLeaves: visibleAll };
  }

  function renderPermTransfer() {
    var selectedSet = {};
    state.permSelectedIds.forEach(function (id) { selectedSet[id] = true; });

    var availMeta = renderPermSide({
      listId: 'permAvailList',
      countId: 'permAvailCount',
      checkAllId: 'permAvailCheckAll',
      kw: state.permAvailKw,
      leafFilter: function (id) { return !selectedSet[id]; },
      checkedMap: state.permAvailChecked,
      collapsedMap: state.permAvailCollapsed,
      side: 'avail',
      emptyText: '暂无数据'
    });

    var selectedMeta = renderPermSide({
      listId: 'permSelectedList',
      countId: 'permSelectedCount',
      checkAllId: 'permSelectedCheckAll',
      kw: state.permSelectedKw,
      leafFilter: function (id) { return !!selectedSet[id]; },
      checkedMap: state.permSelectedChecked,
      collapsedMap: state.permSelectedCollapsed,
      side: 'selected',
      emptyText: '暂无已选'
    });

    var availCheckedCount = availMeta.visibleLeaves.filter(function (id) {
      return !!state.permAvailChecked[id];
    }).length;
    var selectedCheckedCount = selectedMeta.visibleLeaves.filter(function (id) {
      return !!state.permSelectedChecked[id];
    }).length;
    $('permMoveToSelected').disabled = availCheckedCount === 0;
    $('permMoveToAvail').disabled = selectedCheckedCount === 0;
  }

  function openPerm(row) {
    state.permId = row.id;
    if (row.scope === 'all') {
      state.permSelectedIds = ALL_PRODUCT_IDS.slice();
    } else {
      state.permSelectedIds = (row.productIds || []).slice();
    }
    state.permAvailChecked = {};
    state.permSelectedChecked = {};
    state.permAvailKw = '';
    state.permSelectedKw = '';
    state.permAvailCollapsed = {};
    state.permSelectedCollapsed = {};
    walkPerm(PERM_TREE, function (n) {
      if (n.kind === 'group' && (!n.children || !n.children.length)) {
        state.permAvailCollapsed[n.id] = true;
        state.permSelectedCollapsed[n.id] = true;
      }
    });
    $('permAvailSearch').value = '';
    $('permSelectedSearch').value = '';
    renderPermTransfer();
    UI.openModal('permModal');
  }

  function submitPerm() {
    var row = findRow(state.permId);
    if (!row) return;
    var selected = state.permSelectedIds.slice();
    row.productIds = selected;
    row.scope = selected.length === ALL_PRODUCT_IDS.length && ALL_PRODUCT_IDS.length ? 'all' : 'partial';
    row.updatedAt = formatDateTime(new Date());
    UI.closeModal('permModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  function onPermListClick(e) {
    var toggle = e.target.closest('[data-perm-toggle]');
    if (!toggle) return;
    var id = toggle.getAttribute('data-perm-toggle');
    var side = toggle.getAttribute('data-side');
    var map = side === 'selected' ? state.permSelectedCollapsed : state.permAvailCollapsed;
    map[id] = !map[id];
    renderPermTransfer();
  }

  function onPermListChange(e) {
    var input = e.target.closest('input[data-perm-node]');
    if (!input) return;
    var side = input.getAttribute('data-side');
    var node = findPermNode(PERM_TREE, input.getAttribute('data-perm-node'));
    if (!node) return;
    var selectedSet = {};
    state.permSelectedIds.forEach(function (id) { selectedSet[id] = true; });
    var kw = side === 'selected' ? state.permSelectedKw : state.permAvailKw;
    var leafFilter = side === 'selected'
      ? function (id) { return !!selectedSet[id]; }
      : function (id) { return !selectedSet[id]; };
    var checkedMap = side === 'selected' ? state.permSelectedChecked : state.permAvailChecked;
    var leaves = visibleLeaves(node, (kw || '').trim().toLowerCase(), leafFilter);
    setCheckedLeaves(leaves, input.checked, checkedMap);
    renderPermTransfer();
  }

  $('permAvailList').addEventListener('click', onPermListClick);
  $('permSelectedList').addEventListener('click', onPermListClick);
  $('permAvailList').addEventListener('change', onPermListChange);
  $('permSelectedList').addEventListener('change', onPermListChange);

  $('permAvailCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var selectedSet = {};
    state.permSelectedIds.forEach(function (id) { selectedSet[id] = true; });
    var kw = (state.permAvailKw || '').trim().toLowerCase();
    var leaves = [];
    PERM_TREE.forEach(function (n) {
      visibleLeaves(n, kw, function (id) { return !selectedSet[id]; }, leaves);
    });
    setCheckedLeaves(leaves, checked, state.permAvailChecked);
    renderPermTransfer();
  });

  $('permSelectedCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var selectedSet = {};
    state.permSelectedIds.forEach(function (id) { selectedSet[id] = true; });
    var kw = (state.permSelectedKw || '').trim().toLowerCase();
    var leaves = [];
    PERM_TREE.forEach(function (n) {
      visibleLeaves(n, kw, function (id) { return !!selectedSet[id]; }, leaves);
    });
    setCheckedLeaves(leaves, checked, state.permSelectedChecked);
    renderPermTransfer();
  });

  $('permAvailSearch').addEventListener('input', function () {
    state.permAvailKw = this.value || '';
    renderPermTransfer();
  });
  $('permSelectedSearch').addEventListener('input', function () {
    state.permSelectedKw = this.value || '';
    renderPermTransfer();
  });

  $('permMoveToSelected').addEventListener('click', function () {
    var moving = Object.keys(state.permAvailChecked).filter(function (id) {
      return state.permAvailChecked[id];
    });
    moving.forEach(function (id) {
      if (state.permSelectedIds.indexOf(id) === -1) state.permSelectedIds.push(id);
      delete state.permAvailChecked[id];
    });
    renderPermTransfer();
  });

  $('permMoveToAvail').addEventListener('click', function () {
    var moving = Object.keys(state.permSelectedChecked).filter(function (id) {
      return state.permSelectedChecked[id];
    });
    state.permSelectedIds = state.permSelectedIds.filter(function (id) {
      return moving.indexOf(id) === -1;
    });
    moving.forEach(function (id) { delete state.permSelectedChecked[id]; });
    renderPermTransfer();
  });

  function getUserById(id) {
    return ALL_USER_POOL.find(function (u) { return u.id === id; });
  }

  function renderTransfer() {
    var selectedSet = {};
    state.selectedIds.forEach(function (id) { selectedSet[id] = true; });
    var availAll = ALL_USER_POOL.filter(function (u) { return !selectedSet[u.id]; });
    var selectedAll = state.selectedIds.map(getUserById).filter(Boolean);
    var availKw = (state.availKw || '').trim().toLowerCase();
    var selectedKw = (state.selectedKw || '').trim().toLowerCase();
    var availVisible = availAll.filter(function (u) {
      return !availKw || u.name.toLowerCase().indexOf(availKw) !== -1;
    });
    var selectedVisible = selectedAll.filter(function (u) {
      return !selectedKw || u.name.toLowerCase().indexOf(selectedKw) !== -1;
    });
    var availCheckedCount = availVisible.filter(function (u) { return state.availChecked[u.id]; }).length;
    var selectedCheckedCount = selectedVisible.filter(function (u) { return state.selectedChecked[u.id]; }).length;

    $('availCount').textContent = availCheckedCount + ' / ' + availAll.length;
    $('selectedCount').textContent = selectedCheckedCount + ' / ' + selectedAll.length;

    var availAllBox = $('availCheckAll');
    availAllBox.checked = availVisible.length > 0 && availCheckedCount === availVisible.length;
    availAllBox.indeterminate = availCheckedCount > 0 && availCheckedCount < availVisible.length;
    var selectedAllBox = $('selectedCheckAll');
    selectedAllBox.checked = selectedVisible.length > 0 && selectedCheckedCount === selectedVisible.length;
    selectedAllBox.indeterminate = selectedCheckedCount > 0 && selectedCheckedCount < selectedVisible.length;

    function listHtml(list, checkedMap, emptyText) {
      if (!list.length) return '<div class="transfer__empty">' + emptyText + '</div>';
      return list.map(function (u) {
        return '<label class="transfer__item">' +
          '<input type="checkbox" value="' + escapeHtml(u.id) + '"' + (checkedMap[u.id] ? ' checked' : '') + ' />' +
          '<span title="' + escapeHtml(u.name) + '">' + escapeHtml(u.name) + '</span>' +
        '</label>';
      }).join('');
    }

    $('availList').innerHTML = listHtml(availVisible, state.availChecked, '暂无数据');
    $('selectedList').innerHTML = listHtml(selectedVisible, state.selectedChecked, '暂无已选');
    $('moveToSelected').disabled = availCheckedCount === 0;
    $('moveToAvail').disabled = selectedCheckedCount === 0;
  }

  function openUsers(row) {
    state.userId = row.id;
    state.selectedIds = (row.userIds || []).slice();
    state.availChecked = {};
    state.selectedChecked = {};
    state.availKw = '';
    state.selectedKw = '';
    $('availSearch').value = '';
    $('selectedSearch').value = '';
    renderTransfer();
    UI.openModal('userModal');
  }

  function submitUsers() {
    var row = findRow(state.userId);
    if (!row) return;
    row.userIds = state.selectedIds.slice();
    row.updatedAt = formatDateTime(new Date());
    UI.closeModal('userModal');
    UI.showToast('提交成功', 'success');
    renderTable();
  }

  $('availList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) state.availChecked[input.value] = true;
    else delete state.availChecked[input.value];
    renderTransfer();
  });
  $('selectedList').addEventListener('change', function (e) {
    var input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    if (input.checked) state.selectedChecked[input.value] = true;
    else delete state.selectedChecked[input.value];
    renderTransfer();
  });
  $('availCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var selectedSet = {};
    state.selectedIds.forEach(function (id) { selectedSet[id] = true; });
    var availKw = (state.availKw || '').trim().toLowerCase();
    ALL_USER_POOL.forEach(function (u) {
      if (selectedSet[u.id]) return;
      if (availKw && u.name.toLowerCase().indexOf(availKw) === -1) return;
      if (checked) state.availChecked[u.id] = true;
      else delete state.availChecked[u.id];
    });
    renderTransfer();
  });
  $('selectedCheckAll').addEventListener('change', function () {
    var checked = this.checked;
    var selectedKw = (state.selectedKw || '').trim().toLowerCase();
    state.selectedIds.forEach(function (id) {
      var u = getUserById(id);
      if (!u) return;
      if (selectedKw && u.name.toLowerCase().indexOf(selectedKw) === -1) return;
      if (checked) state.selectedChecked[id] = true;
      else delete state.selectedChecked[id];
    });
    renderTransfer();
  });
  $('availSearch').addEventListener('input', function () {
    state.availKw = this.value || '';
    renderTransfer();
  });
  $('selectedSearch').addEventListener('input', function () {
    state.selectedKw = this.value || '';
    renderTransfer();
  });
  $('moveToSelected').addEventListener('click', function () {
    Object.keys(state.availChecked).forEach(function (id) {
      if (!state.availChecked[id]) return;
      if (state.selectedIds.indexOf(id) === -1) state.selectedIds.push(id);
      delete state.availChecked[id];
    });
    renderTransfer();
  });
  $('moveToAvail').addEventListener('click', function () {
    var moving = Object.keys(state.selectedChecked).filter(function (id) { return state.selectedChecked[id]; });
    state.selectedIds = state.selectedIds.filter(function (id) { return moving.indexOf(id) === -1; });
    moving.forEach(function (id) { delete state.selectedChecked[id]; });
    renderTransfer();
  });

  function openDelete(row) {
    state.deleteId = row.id;
    var count = row.userIds ? row.userIds.length : 0;
    state.deleteBlocked = count > 0;
    if (state.deleteBlocked) {
      $('deleteBody').textContent = '当前数据组存在关联用户，请移除后再执行删除。';
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
      UI.showToast('请先移除关联用户', 'warning');
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
  $('resetBtn').addEventListener('click', function () {
    state.draft = { name: '', status: '' };
    $('filterName').value = '';
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
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
    else if (action === 'perm') openPerm(row);
    else if (action === 'users') openUsers(row);
    else if (action === 'delete') openDelete(row);
  });

  document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('editModal'); });
  });
  $('editSubmit').addEventListener('click', submitEdit);

  document.querySelectorAll('[data-close="permModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('permModal'); });
  });
  $('permSubmit').addEventListener('click', submitPerm);

  document.querySelectorAll('[data-close="userModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('userModal'); });
  });
  $('userSubmit').addEventListener('click', submitUsers);

  document.querySelectorAll('[data-close="deleteModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.deleteId = null;
      state.deleteBlocked = false;
      UI.closeModal('deleteModal');
    });
  });
  $('deleteOk').addEventListener('click', confirmDelete);

  if (UI.bindSidebar) UI.bindSidebar();
  applyFilters();
  renderTable();
})();
