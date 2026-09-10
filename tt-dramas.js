/* 短剧 */
(function () {
  'use strict';

  ProductShell.mount('tt-dramas');

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var SEED = [
    ['Vivid Minis', 'Three Beauties One Savior', '三美唯一的救世主'],
    ['Vivid Minis', 'Tackled Into You', '擒你入怀'],
    ['Vivid Minis', 'Dissecting the Don: Deal with the Devil', '与魔鬼的交易'],
    ['Vivid Minis', 'The Lone Lamb Rules the Wolves', '孤羊镇群狼'],
    ['Vivid Minis', 'Retired Hero：Delivery of Justice', '退隐英雄：正义速递'],
    ['Vivid Minis', 'All In：The Don\'s Collateral Bride', '孤注一掷'],
    ['Vivid Minis', 'Called Her Fat. Made Them Kneel', '胖妻归来，全员下跪'],
    ['Vivid Minis', 'Dragonless：Born to Reign', '失格之龙：生而为王'],
    ['Vivid Minis', 'No Mercy：The Husband\'s Reckoning', '绝不原谅'],
    ['Vivid Minis', 'They Mocked the Wrong Mother', '他们嘲笑错了妈妈'],
    ['Vivid Minis', 'Rejected Luna, Destined Queen: Season 1', '被拒的露娜：命定女王：第一季'],
    ['Vivid Minis', 'Rejected Luna, Destined Queen：Final Season', '被拒的露娜：命定女王：最终季'],
    ['Vivid Minis', 'Neon Hidden Cards', '霓虹底牌'],
    ['Vivid Minis', 'His Hidden Devotion', '挚爱'],
    ['Vivid Minis', 'Above the Ashes', '灰烬之上'],
    ['Vivid Minis', 'Day Four Calamity’s Nemesis', '天灾宿敌'],
    ['Vivid Minis', 'Customer Service Marvin', '客服马文'],
    ['Vivid Minis', 'The Mountain Wolf Cub', '山中狼崽'],
    ['Vivid Minis', 'Heist for My Daughter Season 1', '魔城夺女：第一季'],
    ['Vivid Minis', 'Heist for My Daughter：Final Season', '魔城夺女：最终季'],
    ['Vivid Minis', 'Never Yours, Mr. Weston', '韦斯顿先生，你永远得不到我'],
    ['Vivid Minis', 'When the Golden Boy Breaks', '骄子坠落'],
    ['Vivid Minis', 'The King of Stray Dogs', '流浪狗王'],
    ['Vivid Minis', 'Tomorrows Headlines', '明日头条'],
    ['Vivid Minis', 'CLEANER', '清洁工'],
    ['Vivid Minis', 'Little Genius, Big Trouble', '小天才，大麻烦'],
    ['Vivid Minis', 'Ava\'s Monster Notebook', '艾娃的怪物笔记本'],
    ['Vivid Minis', 'Spin Cycle Queens', '洗衣女王们'],
    ['Vivid Minis', 'The Substitute Maid', '代班女佣'],
    ['Vivid Minis', 'The Ironwife From Dirt Farm to Empire', '铁娘子：从农场到帝国'],
    ['Vivid Minis', 'The Maid Heiress', '女佣千金'],
    ['Vivid Minis', 'The curse of the red moon', '红月诅咒：最后的猩红公主'],
    ['Vivid Minis', 'The Playboy\'s Decoy', '花花公子的替身未婚妻'],
    ['Vivid Minis', 'The Billionaire Beneath the Hoodie', '卫衣之下的亿万富翁'],
    ['Vivid Minis', 'A Rose for the Exiled King', '玫瑰陨落之夜']
  ];

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function formatDateTime(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function formatDisplayTime(str) {
    if (!str) return '-';
    return String(str).replace('T', ' ').slice(0, 19);
  }

  var ALL_ROWS = SEED.map(function (item, i) {
    var created = new Date(2026, 3, 1, 10, 0, 0);
    created.setDate(created.getDate() + i * 12);
    created.setHours(9 + (i % 6), (i * 11) % 60, (i * 7) % 60, 0);
    var updated = new Date(created.getTime());
    if (i % 3 === 0) updated.setDate(updated.getDate() + 4);
    return {
      id: 'tt-' + (i + 1),
      miniName: item[0],
      title: item[1],
      zhName: item[2],
      platform: 'TikTok',
      remark: '',
      status: i % 9 === 3 ? '禁用' : '启用',
      icon: '',
      createdAt: formatDateTime(created),
      updatedAt: formatDateTime(updated)
    };
  });

  var state = {
    draft: { miniName: '', title: '', zhName: '', platform: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    formIcon: ''
  };

  var clearApis = {};

  function applyFilters() {
    state.applied = {
      miniName: (state.draft.miniName || '').trim(),
      title: (state.draft.title || '').trim(),
      zhName: (state.draft.zhName || '').trim(),
      platform: state.draft.platform || '',
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var list = !f
      ? ALL_ROWS.slice()
      : ALL_ROWS.filter(function (row) {
        if (f.miniName && String(row.miniName).toLowerCase().indexOf(f.miniName.toLowerCase()) === -1) return false;
        if (f.title && String(row.title).toLowerCase().indexOf(f.title.toLowerCase()) === -1) return false;
        if (f.zhName && String(row.zhName).toLowerCase().indexOf(f.zhName.toLowerCase()) === -1) return false;
        if (f.platform && row.platform !== f.platform) return false;
        if (f.status && row.status !== f.status) return false;
        return true;
      });
    return list.sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
  }

  function nextId() {
    var max = 0;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(String(r.id).replace(/^tt-/, ''), 10);
      if (isFinite(n) && n > max) max = n;
    });
    return 'tt-' + (max + 1);
  }

  UI.bindInputClearable({
    wrapId: 'filterMiniWrap',
    clearId: 'filterMiniClear',
    onClear: function () { state.draft.miniName = ''; }
  });
  UI.bindInputClearable({
    wrapId: 'filterTitleWrap',
    clearId: 'filterTitleClear',
    onClear: function () { state.draft.title = ''; }
  });
  UI.bindInputClearable({
    wrapId: 'filterZhWrap',
    clearId: 'filterZhClear',
    onClear: function () { state.draft.zhName = ''; }
  });

  UI.bindSingleSelect({
    wrapId: 'platformWrap',
    triggerId: 'platformTrigger',
    panelId: 'platformPanel',
    labelId: 'platformLabel',
    clearId: 'platformClear',
    prefix: '平台：',
    getValue: function () { return state.draft.platform; },
    onChange: function (v) { state.draft.platform = v || ''; }
  });
  UI.bindSingleSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    clearId: 'statusClear',
    prefix: '状态：',
    getValue: function () { return state.draft.status; },
    onChange: function (v) { state.draft.status = v || ''; }
  });

  ['editMini', 'editTitle', 'editZh', 'editRemark'].forEach(function (id) {
    clearApis[id] = UI.bindInputClearable({
      wrapId: id + 'Wrap',
      onClear: function () {
        if (id === 'editMini') clearItemError('editMiniItem');
        if (id === 'editTitle') clearItemError('editTitleItem');
        if (id === 'editZh') clearItemError('editZhItem');
      }
    });
  });

  UI.bindSeg('platformSeg');
  UI.bindSeg('statusSeg');

  function on(id, event, fn) {
    var el = $(id);
    if (!el) return;
    el.addEventListener(event, fn);
  }

  on('filterMini', 'input', function () { state.draft.miniName = this.value || ''; });
  on('filterTitle', 'input', function () { state.draft.title = this.value || ''; });
  on('filterZh', 'input', function () { state.draft.zhName = this.value || ''; });
  ['filterMini', 'filterTitle', 'filterZh'].forEach(function (id) {
    on(id, 'keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
        renderTable();
      }
    });
  });

  function clearItemError(id) {
    var el = $(id);
    if (el) el.classList.remove('is-error');
  }

  function clearEditErrors() {
    ['editMiniItem', 'editTitleItem', 'editZhItem'].forEach(clearItemError);
  }

  function setItemError(id, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.add('is-error');
    var err = el.querySelector('.form-item__error');
    if (err && msg) err.textContent = msg;
  }

  function titleCell(row) {
    return '<span class="product-cell">' +
      (row.icon
        ? '<img class="product-cell__icon product-cell__icon--img" src="' + escapeHtml(row.icon) + '" alt="" />'
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
          '<td title="' + escapeHtml(row.title) + '">' + titleCell(row) + '</td>' +
          '<td title="' + escapeHtml(row.zhName) + '">' + escapeHtml(row.zhName) + '</td>' +
          '<td>' + escapeHtml(row.platform || 'TikTok') + '</td>' +
          '<td title="' + escapeHtml(row.miniName) + '">' + escapeHtml(row.miniName) + '</td>' +
          '<td title="' + escapeHtml(row.remark || '') + '">' + escapeHtml(row.remark || '') + '</td>' +
          '<td>' + UI.statusTag(row.status || '启用') + '</td>' +
          '<td title="' + escapeHtml(formatDisplayTime(row.createdAt)) + '">' + escapeHtml(formatDisplayTime(row.createdAt)) + '</td>' +
          '<td title="' + escapeHtml(formatDisplayTime(row.updatedAt)) + '">' + escapeHtml(formatDisplayTime(row.updatedAt)) + '</td>' +
          '<td class="col-action"><span class="action-links">' +
            '<button class="link" type="button" data-action="edit">编辑</button>' +
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
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function syncClearables() {
    Object.keys(clearApis).forEach(function (key) {
      if (clearApis[key] && clearApis[key].sync) clearApis[key].sync();
    });
  }

  function syncIconPreview() {
    var box = $('iconUploadBox');
    var preview = $('iconPreview');
    if (!box || !preview) return;
    if (state.formIcon) {
      box.classList.add('has-file');
      preview.src = state.formIcon;
    } else {
      box.classList.remove('has-file');
      preview.removeAttribute('src');
    }
  }

  function fillForm(row) {
    UI.setSegValue('platformSeg', (row && row.platform) || 'TikTok');
    UI.setSegValue('statusSeg', (row && row.status) || '启用');
    $('editMini').value = row ? (row.miniName || '') : '';
    $('editTitle').value = row ? (row.title || '') : '';
    $('editZh').value = row ? (row.zhName || '') : '';
    $('editRemark').value = row ? (row.remark || '') : '';
    state.formIcon = row ? (row.icon || '') : '';
    var fileInput = $('iconFileInput');
    if (fileInput) fileInput.value = '';
    syncIconPreview();
    syncClearables();
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    clearEditErrors();
    $('editModalTitle').textContent = '添加短剧';
    fillForm(null);
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    clearEditErrors();
    $('editModalTitle').textContent = '编辑短剧';
    fillForm(row);
    UI.openModal('editModal');
  }

  function submitEdit() {
    clearEditErrors();
    var miniName = ($('editMini').value || '').trim();
    var title = ($('editTitle').value || '').trim();
    var zhName = ($('editZh').value || '').trim();
    var remark = ($('editRemark').value || '').trim();
    var platform = UI.getSegValue('platformSeg') || 'TikTok';
    var status = UI.getSegValue('statusSeg') || '启用';
    var hasError = false;

    if (!miniName) {
      setItemError('editMiniItem', '请输入小程序');
      hasError = true;
    }
    if (!title) {
      setItemError('editTitleItem', '请输入剧目名称');
      hasError = true;
    }
    if (!zhName) {
      setItemError('editZhItem', '请输入中文名称');
      hasError = true;
    }
    if (hasError) return;

    var duplicated = ALL_ROWS.some(function (r) {
      if (state.editMode === 'edit' && r.id === state.editId) return false;
      return String(r.title).toLowerCase() === title.toLowerCase();
    });
    if (duplicated) {
      setItemError('editTitleItem', '剧目名称已存在');
      return;
    }

    var now = formatDateTime(new Date());
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextId(),
        miniName: miniName,
        title: title,
        zhName: zhName,
        platform: platform,
        remark: remark,
        status: status,
        icon: state.formIcon || '',
        createdAt: now,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.miniName = miniName;
      row.title = title;
      row.zhName = zhName;
      row.platform = platform;
      row.remark = remark;
      row.status = status;
      row.icon = state.formIcon || '';
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  (function bindIconUpload() {
    var box = $('iconUploadBox');
    var input = $('iconFileInput');
    var removeBtn = $('iconRemoveBtn');
    if (!box || !input) return;

    function pick() { input.click(); }

    box.addEventListener('click', function (e) {
      if (e.target.closest('#iconRemoveBtn')) return;
      pick();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    if (removeBtn) {
      removeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        state.formIcon = '';
        input.value = '';
        syncIconPreview();
      });
    }
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/\.jpe?g$|\.png$/i.test(file.name) && file.type !== 'image/jpeg' && file.type !== 'image/png') {
        UI.showToast('请上传 jpg 或 png 图片', 'error');
        input.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        UI.showToast('图片需小于 2M', 'error');
        input.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        state.formIcon = String(e.target.result || '');
        syncIconPreview();
      };
      reader.readAsDataURL(file);
    });
  })();

  try {
    on('queryBtn', 'click', function () {
      applyFilters();
      renderTable();
    });
    on('addBtn', 'click', openAdd);

    on('tableBody', 'click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var tr = btn.closest('tr[data-id]');
      if (!tr) return;
      var row = findRow(tr.getAttribute('data-id'));
      if (row && btn.getAttribute('data-action') === 'edit') openEdit(row);
    });

    document.querySelectorAll('[data-close="editModal"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        UI.closeModal('editModal');
      });
    });
    on('editSubmit', 'click', submitEdit);
    on('editMini', 'input', function () { clearItemError('editMiniItem'); });
    on('editTitle', 'input', function () { clearItemError('editTitleItem'); });
    on('editZh', 'input', function () { clearItemError('editZhItem'); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var editModal = $('editModal');
      if (editModal && editModal.classList.contains('is-open')) UI.closeModal('editModal');
    });
  } finally {
    applyFilters();
    renderTable();
  }
})();
