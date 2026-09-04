/* JSON文件 · 示例数据.xlsx JSON文件分表 */
(function () {
  'use strict';

  ProductShell.mount('json-files');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var COPY_ICON = UI.COPY_ICON;
  var LS_JSON_KEY = 'hwzt_json_files';

  /* 来自 示例数据.xlsx · JSON文件；创建人已脱敏 */
  var JSON_SEED = [
    { name: 'Screw Pin Jam Puzzle (拦不住我)', platform: 'iOS', productId: 'ywjmmkcoxapyilti', packageName: 'com.screw.pin.jam.ios', sdkVersion: '3.1.0', appVersion: '1.3.4', creator: '用户A', createdAt: '2026-09-03 10:52:47' },
    { name: 'Girl Rescue: Dragon Out! (营救女孩)', platform: 'Android', productId: 'yw8axztjbc1ytney', packageName: 'com.save.princess.girl.dragon.out.and', sdkVersion: '3.0.13', appVersion: '1.1.1.8', creator: '用户B', createdAt: '2026-09-02 18:00:33' },
    { name: 'Screw Away: 3D Pin Puzzle', platform: 'iOS', productId: 'ywc6chqlqou3rrmv', packageName: 'com.screw.away.pin.puzzle.ios', sdkVersion: '3.1.0', appVersion: '2.0.6', creator: '用户C', createdAt: '2026-09-02 14:33:47' },
    { name: '超玩美派对', platform: 'iOS', productId: '44759133', packageName: 'com.fun.beautyparty.ios', sdkVersion: '3.1.0', appVersion: '1.0.0', creator: '用户D', createdAt: '2026-09-01 17:53:01' },
    { name: '超玩美派對', platform: 'iOS', productId: '44759133', packageName: 'com.fun.beautyparty.ios', sdkVersion: '3.1.0', appVersion: '1.0.0', creator: '用户D', createdAt: '2026-09-01 11:44:59' },
    { name: 'Gem Loop Match: Coloring Sort', platform: 'Android', productId: '44759563', packageName: 'com.gem.loop.match.coloring.sort.and', sdkVersion: '3.0.9', appVersion: '1.0.0.0', creator: '用户A', createdAt: '2026-08-28 15:34:39' },
    { name: 'Clues Card Sort', platform: 'Android', productId: '44760299', packageName: 'com.clues.card.sort.and', sdkVersion: '3.0.9', appVersion: '1.0.0', creator: '用户B', createdAt: '2026-08-28 14:16:56' },
    { name: '超玩美派對', platform: 'iOS', productId: '44759133', packageName: 'com.fun.beautyparty.ios', sdkVersion: '3.1.0', appVersion: '1.0.0', creator: '用户C', createdAt: '2026-08-26 14:42:05' },
    { name: '超玩美派對', platform: 'iOS', productId: '44759133', packageName: 'com.fun.beautyparty.ios', sdkVersion: '3.1.0', appVersion: '1.0.0', creator: '用户C', createdAt: '2026-08-26 10:28:00' },
    { name: 'Cube Out 3D :Jam Puzzle', platform: 'iOS', productId: 'ywypo3rm81gevebx', packageName: 'com.cubeout3d.ios', sdkVersion: '3.1.0', appVersion: '4.1.8', creator: '用户C', createdAt: '2026-08-25 11:12:02' },
    { name: '腦洞諧音梗', platform: 'iOS', productId: '44758852', packageName: 'com.brain.out.find.word.ios', sdkVersion: '3.1.0', appVersion: '1.0.0', creator: '用户A', createdAt: '2026-08-21 16:26:16' },
    { name: 'Traffic Jam: Hop On! (老司機帶帶我！)', platform: 'iOS', productId: 'yw0yqjwcunjjc2e9', packageName: 'com.traffic.jam.hop.on.ios', sdkVersion: '3.1.0', appVersion: '1.1.0', creator: '用户D', createdAt: '2026-08-21 10:13:16' },
    { name: 'Unravel Yarn 3D: Screw Puzzle (拆线大师)', platform: 'Android', productId: 'ywlfly3hpsal404h', packageName: 'com.unravel.yarn.screw.puzzle', sdkVersion: '3.0.2', appVersion: '1.11.0', creator: '用户C', createdAt: '2026-08-20 19:50:17' },
    { name: 'Hotpot Match 3D', platform: 'iOS', productId: 'ywvt69aoqfdgyti2', packageName: 'com.hotpot.match3d.ios', sdkVersion: '3.0.6', appVersion: '1.0.2', creator: '用户D', createdAt: '2026-08-19 16:26:44' },
    { name: '砍價大偵探（Haggle Sleuth）', platform: 'iOS', productId: 'yw8eztowurntwckb', packageName: 'com.jigsaw.master.horror.ios', sdkVersion: '3.0.6', appVersion: '1.1.1', creator: '用户D', createdAt: '2026-08-19 16:12:00' },
    { name: 'Girl Rescue: Dragon Out! (营救女孩)', platform: 'Android', productId: 'yw8axztjbc1ytney', packageName: 'com.save.princess.girl.dragon.out.and', sdkVersion: '3.0.6', appVersion: '1.1.1.6', creator: '用户E', createdAt: '2026-08-19 15:27:39' },
    { name: 'Cube Out 3D :Jam Puzzle', platform: 'Android', productId: 'yw2dxsamb89oufmk', packageName: 'com.cube.out.jam.puzzle', sdkVersion: '3.0.2', appVersion: '4.1.8', creator: '用户C', createdAt: '2026-08-18 20:13:15' },
    { name: 'Marble Drop: Yarn Sort 3D', platform: 'Android', productId: '44759012', packageName: 'com.marbledrop.yarnsort.and', sdkVersion: '3.0.2', appVersion: '1.0.0', creator: '用户C', createdAt: '2026-08-18 17:27:34' },
    { name: 'Tree Forest: Detective Words (梗界名侦探)', platform: 'Android', productId: 'ywe6yu9jijpdaqny', packageName: 'com.spellbound.hidden.letters.word.puzzle.and', sdkVersion: '3.0.2', appVersion: '1.0.0.4', creator: '用户A', createdAt: '2026-08-18 09:54:32' },
    { name: 'Traffic Jam: Hop On! (老司機帶帶我！)', platform: 'iOS', productId: 'yw0yqjwcunjjc2e9', packageName: 'com.traffic.jam.hop.on.ios', sdkVersion: '3.1.0', appVersion: '1.1.0', creator: '用户D', createdAt: '2026-08-17 17:01:44' }
  ];

  function formatStamp(str) {
    if (!str) return '-';
    return String(str).replace('T', ' ').slice(0, 19);
  }

  function cloneSample() {
    var src = window.JSON_FILE_SAMPLE;
    if (!src) return {};
    return JSON.parse(JSON.stringify(src));
  }

  function buildPayload(row) {
    if (row.json) return row.json;
    var payload = cloneSample();
    payload.sdk_app_id = row.productId;
    payload.app_name = row.name;
    payload.package_name = row.packageName;
    payload.sdk_version = row.sdkVersion;
    payload.app_version = row.appVersion;
    if (payload.tiktok_config) payload.tiktok_config.app_id = row.packageName;
    return payload;
  }

  function highlightJson(text) {
    var src = String(text || '');
    var re = /("(?:\\.|[^"\\])*")\s*(:)?|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b|([{\[\]},])/g;
    var html = '';
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      html += escapeHtml(src.slice(last, m.index));
      if (m[1] != null) {
        if (m[2]) {
          html += '<span class="json-key">' + escapeHtml(m[1]) + '</span><span class="json-punct">:</span>';
        } else {
          html += '<span class="json-str">' + escapeHtml(m[1]) + '</span>';
        }
      } else if (m[3] != null) {
        html += '<span class="json-num">' + escapeHtml(m[3]) + '</span>';
      } else if (m[4] != null) {
        html += '<span class="json-kw">' + escapeHtml(m[4]) + '</span>';
      } else {
        html += '<span class="json-punct">' + escapeHtml(m[5]) + '</span>';
      }
      last = re.lastIndex;
    }
    html += escapeHtml(src.slice(last));
    return html;
  }

  function copyCell(value, title) {
    return '<span class="cell-id">' +
      '<button class="copy-btn" type="button" data-copy="' + escapeHtml(value) + '" title="' + escapeHtml(title) + '" aria-label="复制">' + COPY_ICON + '</button>' +
      '<span class="cell-id__text" title="' + escapeHtml(value) + '">' + escapeHtml(value) + '</span>' +
    '</span>';
  }

  function jsonText(row) {
    try {
      return JSON.stringify(buildPayload(row), null, 4);
    } catch (e) {
      return '{}';
    }
  }

  function loadLocalRecords() {
    var stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(LS_JSON_KEY) || '[]');
      if (!Array.isArray(stored)) stored = [];
    } catch (e) {
      stored = [];
    }
    return stored.map(function (item, i) {
      return {
        id: item.id || ('ls-' + i),
        name: item.productName || item.name || '',
        platform: item.platform || '',
        productId: String(item.productId || ''),
        packageName: item.packageName || '',
        sdkVersion: item.sdkVersion || '',
        appVersion: item.appVersion || '',
        creator: '用户A',
        createdAt: formatStamp(item.createdAt),
        json: item.json || null
      };
    });
  }

  var ALL_ROWS = loadLocalRecords().concat(JSON_SEED.map(function (item, i) {
    return {
      id: 'seed-' + (i + 1),
      name: item.name,
      platform: item.platform,
      productId: String(item.productId),
      packageName: item.packageName,
      sdkVersion: item.sdkVersion,
      appVersion: item.appVersion,
      creator: item.creator,
      createdAt: item.createdAt,
      json: null
    };
  }));

  var state = {
    draft: { keyword: '', packageKw: '', platform: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false
  };

  function applyFilters() {
    state.applied = {
      keyword: (state.draft.keyword || '').trim(),
      packageKw: (state.draft.packageKw || '').trim(),
      platform: state.draft.platform || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    if (!f) return ALL_ROWS.slice();
    var kw = f.keyword.toLowerCase();
    var pkg = f.packageKw.toLowerCase();
    return ALL_ROWS.filter(function (row) {
      if (kw && String(row.name).toLowerCase().indexOf(kw) === -1 && String(row.productId).toLowerCase().indexOf(kw) === -1) return false;
      if (pkg && String(row.packageName).toLowerCase().indexOf(pkg) === -1) return false;
      if (f.platform && row.platform !== f.platform) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
  }

  var platformFilter = UI.bindSingleSelect({
    wrapId: 'platformWrap',
    triggerId: 'platformTrigger',
    panelId: 'platformPanel',
    labelId: 'platformLabel',
    clearId: 'platformClear',
    prefix: '平台：',
    getValue: function () { return state.draft.platform; },
    onChange: function (v) { state.draft.platform = v || ''; }
  });

  $('filterKeyword').addEventListener('input', function () {
    state.draft.keyword = this.value || '';
  });
  $('filterPackage').addEventListener('input', function () {
    state.draft.packageKw = this.value || '';
  });
  ['filterKeyword', 'filterPackage'].forEach(function (id) {
    $(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
        renderTable();
      }
    });
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
          '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>' +
          '<td>' + escapeHtml(row.platform) + '</td>' +
          '<td>' + copyCell(row.productId, '复制产品ID') + '</td>' +
          '<td>' + copyCell(row.packageName, '复制包名') + '</td>' +
          '<td>' + escapeHtml(row.sdkVersion) + '</td>' +
          '<td>' + escapeHtml(row.appVersion) + '</td>' +
          '<td>' + escapeHtml(row.creator) + '</td>' +
          '<td title="' + escapeHtml(row.createdAt) + '">' + escapeHtml(row.createdAt) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="view">查看</button>' +
            '<button class="link" type="button" data-action="download">下载</button>' +
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
    if (window.ColResize) ColResize.refresh($('jsonTable'));
  }

  var viewRaw = '';

  function openView(row) {
    $('viewModalTitle').textContent = '查看JSON';
    viewRaw = jsonText(row);
    var lines = viewRaw.split('\n');
    var gutter = $('codeGutter');
    if (gutter) {
      gutter.innerHTML = lines.map(function (_, i) {
        return '<span>' + (i + 1) + '</span>';
      }).join('');
    }
    $('jsonView').innerHTML = highlightJson(viewRaw);
    UI.openModal('viewModal');
  }

  function safeFilename(row) {
    var base = (row.packageName || row.productId || 'config') + '_' + (row.sdkVersion || '') + '_' + (row.appVersion || '');
    return base.replace(/[\\/:*?"<>|]+/g, '_') + '.json';
  }

  function downloadRow(row) {
    UI.downloadText(safeFilename(row), jsonText(row));
    UI.showToast('下载成功', 'success');
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });

  $('resetBtn').addEventListener('click', function () {
    state.draft = { keyword: '', packageKw: '', platform: '' };
    $('filterKeyword').value = '';
    $('filterPackage').value = '';
    if (platformFilter && platformFilter.syncLabel) platformFilter.syncLabel('');
    applyFilters();
    renderTable();
  });

  $('tableBody').addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      UI.copyText(copyBtn.getAttribute('data-copy'));
      return;
    }
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var tr = btn.closest('tr[data-id]');
    if (!tr) return;
    var row = findRow(tr.getAttribute('data-id'));
    if (!row) return;
    var action = btn.getAttribute('data-action');
    if (action === 'view') openView(row);
    else if (action === 'download') downloadRow(row);
  });

  document.querySelectorAll('[data-close="viewModal"]').forEach(function (btn) {
    btn.addEventListener('click', function () { UI.closeModal('viewModal'); });
  });

  var codeCopyBtn = $('codeCopyBtn');
  if (codeCopyBtn) {
    codeCopyBtn.addEventListener('click', function () {
      if (viewRaw) UI.copyText(viewRaw);
    });
  }

  applyFilters();
  renderTable();
})();
