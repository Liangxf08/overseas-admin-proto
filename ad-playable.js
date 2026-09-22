/* 试玩广告 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  var Store = window.AdStrategyStore;
  if (!UI || !Store) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;
  var PRODUCTS = Store.PRODUCTS || [];

  var PLATFORM_ICONS = {
    Android: 'assets/Android.png',
    iOS: 'assets/iOS.png'
  };

  var ALL_ROWS = [
    { id: '100001', productId: 'ywvt69aoqfdgyti2', url: 'https://playable.example.com/hotpot-match-3d', status: '启用', updatedAt: '2026-09-12 14:20:08' },
    { id: '100002', productId: 'yw1abauttjsdlfid', url: 'https://playable.example.com/pixel-bounce-jam', status: '启用', updatedAt: '2026-09-10 11:06:41' },
    { id: '100003', productId: 'ywdazzlejewel001a', url: 'https://playable.example.com/dazzle-jewel', status: '启用', updatedAt: '2026-09-08 16:42:19' },
    { id: '100004', productId: 'ywbrainsortcard02', url: 'https://playable.example.com/brain-sort-card', status: '禁用', updatedAt: '2026-09-03 09:18:55' },
    { id: '100005', productId: 'ywtilesort3d0003x', url: 'https://playable.example.com/tile-sort-3d', status: '启用', updatedAt: '2026-08-28 19:03:12' },
    { id: '100006', productId: 'ywcaptainwave08xx', url: 'https://playable.example.com/captain-wave', status: '禁用', updatedAt: '2026-08-21 10:27:33' }
  ];

  var state = {
    draft: { product: '', status: '' },
    applied: null,
    page: 1,
    pageSize: 20,
    paginationBound: false,
    editMode: 'add',
    editId: null,
    editProductId: '',
    editStatus: '启用',
    selected: {},
    batchIds: [],
    batchStatus: '启用',
    deleteIds: [],
    importRows: []
  };

  function applyFilters() {
    state.applied = {
      product: (state.draft.product || '').trim(),
      status: state.draft.status || ''
    };
    state.page = 1;
  }

  function getFilteredRows() {
    var f = state.applied;
    var rows = ALL_ROWS.slice();
    if (!f) return rows;
    return rows.filter(function (row) {
      var product = Store.productById(row.productId);
      var name = product ? product.name : '';
      if (f.product && name.indexOf(f.product) === -1 && row.productId.indexOf(f.product) === -1) return false;
      if (f.status && row.status !== f.status) return false;
      return true;
    });
  }

  function findRow(id) {
    return ALL_ROWS.find(function (r) { return r.id === String(id); });
  }

  function pad6(n) {
    var s = String(n);
    while (s.length < 6) s = '0' + s;
    return s.slice(-6);
  }

  function nextId() {
    var max = 100000;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(r.id, 10);
      if (isFinite(n) && n > max) max = n;
    });
    return pad6(max + 1);
  }

  var batchMenuApi = null;

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

  function productOptionLabel(productId) {
    var p = Store.productById(productId);
    return p ? p.name : productId;
  }

  function productOptionIconHtml(productId) {
    var p = Store.productById(productId);
    var platform = p && p.platform;
    var src = platform && PLATFORM_ICONS[platform];
    if (!src) return '';
    return '<span class="select-option-icon"><img src="' + src + '" alt="" /></span>';
  }

  function syncEditProductLabel(value) {
    var label = $('editProductLabel');
    var wrap = $('editProductWrap');
    var panel = $('editProductPanel');
    if (!label) return;
    if (!value) {
      label.innerHTML = '<span class="muted">请选择</span>';
      if (wrap) wrap.classList.remove('has-value');
    } else {
      label.innerHTML = productOptionIconHtml(value) +
        '<span class="select-option-text">' + escapeHtml(productOptionLabel(value)) + '</span>';
      if (wrap) wrap.classList.add('has-value');
    }
    if (panel) {
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }
  }

  function fillProductPanel() {
    var panel = $('editProductPanel');
    if (!panel) return;
    panel.innerHTML = PRODUCTS.map(function (p) {
      return '<button class="single-option" type="button" data-value="' + escapeHtml(p.id) + '">' +
        productOptionIconHtml(p.id) +
        '<span class="select-option-text">' + escapeHtml(p.name) + '</span>' +
      '</button>';
    }).join('');
  }

  var editProductSelect = UI.bindSingleSelect({
    wrapId: 'editProductWrap',
    triggerId: 'editProductTrigger',
    panelId: 'editProductPanel',
    labelId: 'editProductLabel',
    getValue: function () { return state.editProductId; },
    onChange: function (v) {
      state.editProductId = v || '';
      setItemError('editProductItem', false);
    }
  });
  if (editProductSelect) {
    editProductSelect.syncLabel = function (v) {
      var val = (v !== undefined && v !== null) ? v : (state.editProductId || '');
      syncEditProductLabel(val);
    };
    editProductSelect.syncLabel(state.editProductId);
  }

  UI.bindSeg('editStatusSeg', function (v) {
    state.editStatus = v || '启用';
  });

  var filterProductClear = UI.bindInputClearable({
    wrapId: 'filterProductWrap',
    clearId: 'filterProductClear',
    onClear: function () { state.draft.product = ''; }
  });
  var editUrlClear = UI.bindInputClearable({
    wrapId: 'editUrlWrap',
    clearId: 'editUrlClear',
    onClear: function () { setItemError('editUrlItem', false); }
  });

  $('filterProduct').addEventListener('input', function () {
    state.draft.product = this.value || '';
  });
  $('filterProduct').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters();
      renderTable();
    }
  });

  function setItemError(id, on, msg) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle('is-error', !!on);
    if (on && msg) {
      var err = el.querySelector('.form-item__error');
      if (err) err.textContent = msg;
    }
  }

  function clearEditErrors() {
    ['editProductItem', 'editUrlItem'].forEach(function (id) {
      setItemError(id, false);
    });
  }

  function productName(id) {
    return Store.productName ? Store.productName(id) : ((Store.productById(id) || {}).name || id);
  }

  function productPlatform(id) {
    var p = Store.productById(id);
    return (p && p.platform) ? p.platform : '-';
  }

  function selectedIds() {
    return Object.keys(state.selected).filter(function (id) {
      return state.selected[id] && findRow(id);
    });
  }

  function updateBatchBtn() {
    var api = batchMenuApi;
    var empty = selectedIds().length === 0;
    if (api && api.setDisabled) api.setDisabled(empty);
    else {
      var btn = $('batchBtn');
      if (btn) btn.disabled = empty;
    }
  }

  function syncCheckAll(pageRows) {
    var checkAll = $('checkAll');
    if (!checkAll) return;
    if (!pageRows.length) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
      checkAll.disabled = true;
      return;
    }
    checkAll.disabled = false;
    var checked = 0;
    pageRows.forEach(function (row) {
      if (state.selected[row.id]) checked += 1;
    });
    checkAll.checked = checked === pageRows.length;
    checkAll.indeterminate = checked > 0 && checked < pageRows.length;
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
        var name = productName(row.productId);
        var platform = productPlatform(row.productId);
        var checked = state.selected[row.id] ? ' checked' : '';
        return '<tr data-id="' + escapeHtml(row.id) + '">' +
          '<td class="col-check"><label class="cell-check">' +
            '<input type="checkbox" data-row-check="' + escapeHtml(row.id) + '"' + checked + ' aria-label="选择" />' +
          '</label></td>' +
          '<td>' + escapeHtml(row.id) + '</td>' +
          '<td title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</td>' +
          '<td>' + escapeHtml(platform) + '</td>' +
          '<td title="' + escapeHtml(row.url) + '">' +
            '<a class="playable-link" href="' + escapeHtml(row.url) + '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml(row.url) +
            '</a>' +
          '</td>' +
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
    syncCheckAll(pageRows);
    updateBatchBtn();
    if (window.ColResize) ColResize.refresh($('dataTable'));
  }

  function openAdd() {
    state.editMode = 'add';
    state.editId = null;
    state.editProductId = '';
    state.editStatus = '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '添加试玩广告';
    $('editUrl').value = '';
    UI.setSegValue('editStatusSeg', '启用');
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel('');
    if (editUrlClear) editUrlClear.sync();
    UI.openModal('editModal');
  }

  function openEdit(row) {
    state.editMode = 'edit';
    state.editId = row.id;
    state.editProductId = row.productId;
    state.editStatus = row.status || '启用';
    clearEditErrors();
    $('editModalTitle').textContent = '编辑试玩广告';
    $('editUrl').value = row.url || '';
    UI.setSegValue('editStatusSeg', state.editStatus);
    fillProductPanel();
    if (editProductSelect && editProductSelect.syncLabel) editProductSelect.syncLabel(state.editProductId);
    if (editUrlClear) editUrlClear.sync();
    UI.openModal('editModal');
  }

  function isValidUrl(value) {
    return /^https?:\/\/\S+$/i.test(value);
  }

  function submitEdit() {
    clearEditErrors();
    var productId = state.editProductId || '';
    var url = ($('editUrl').value || '').trim();
    var status = state.editStatus || '启用';
    var hasError = false;

    if (!productId) {
      setItemError('editProductItem', true, '请选择产品');
      hasError = true;
    }
    if (!url) {
      setItemError('editUrlItem', true, '请输入试玩链接');
      hasError = true;
    } else if (!isValidUrl(url)) {
      setItemError('editUrlItem', true, '请输入有效的 http(s) 链接');
      hasError = true;
    }
    if (hasError) return;

    var now = Store.nowText();
    if (state.editMode === 'add') {
      ALL_ROWS.unshift({
        id: nextId(),
        productId: productId,
        url: url,
        status: status,
        updatedAt: now
      });
      UI.showToast('添加成功', 'success');
    } else {
      var row = findRow(state.editId);
      if (!row) return;
      row.productId = productId;
      row.url = url;
      row.status = status;
      row.updatedAt = now;
      UI.showToast('提交成功', 'success');
    }
    UI.closeModal('editModal');
    applyFilters();
    renderTable();
  }

  function openBatchStatus() {
    var ids = selectedIds();
    if (!ids.length) {
      UI.showToast('请先勾选数据', 'error');
      return;
    }
    state.batchIds = ids.slice();
    state.batchStatus = '启用';
    UI.setSegValue('batchStatusSeg', '启用');
    UI.openModal('batchStatusModal');
  }

  function submitBatchStatus() {
    var status = state.batchStatus || '启用';
    var now = Store.nowText();
    var n = 0;
    state.batchIds.forEach(function (id) {
      var row = findRow(id);
      if (!row) return;
      row.status = status;
      row.updatedAt = now;
      n += 1;
    });
    state.batchIds = [];
    UI.closeModal('batchStatusModal');
    renderTable();
    UI.showToast(n ? '批量修改状态成功' : '没有可修改的数据', n ? 'success' : 'error');
  }

  function openDelete(ids) {
    ids = (ids && ids.length) ? ids : selectedIds();
    if (!ids.length) {
      UI.showToast('请先勾选数据', 'error');
      return;
    }
    state.deleteIds = ids.slice();
    UI.openModal('deleteModal');
  }

  function confirmDelete() {
    var idSet = {};
    state.deleteIds.forEach(function (id) { idSet[id] = true; });
    var before = ALL_ROWS.length;
    for (var i = ALL_ROWS.length - 1; i >= 0; i--) {
      if (idSet[ALL_ROWS[i].id]) ALL_ROWS.splice(i, 1);
    }
    var removed = before - ALL_ROWS.length;
    state.deleteIds.forEach(function (id) { delete state.selected[id]; });
    state.deleteIds = [];
    UI.closeModal('deleteModal');
    renderTable();
    UI.showToast(removed ? '已删除 ' + removed + ' 条' : '没有可删除的数据', removed ? 'success' : 'error');
  }

  UI.bindSeg('batchStatusSeg', function (v) {
    state.batchStatus = v || '启用';
  });

  batchMenuApi = UI.bindBatchMenu({
    wrapId: 'batchWrap',
    btnId: 'batchBtn',
    menuId: 'batchMenu',
    onAction: function (action) {
      if (action === 'status') openBatchStatus();
      else if (action === 'delete') openDelete();
    }
  });

  /* —— 导入 —— */
  function showImportAlert(text) {
    var alert = $('importAlert');
    if ($('importAlertText')) $('importAlertText').textContent = text;
    if (alert) alert.classList.add('is-show');
  }

  function hideImportAlert() {
    var alert = $('importAlert');
    if (alert) alert.classList.remove('is-show');
    if ($('importAlertText')) $('importAlertText').textContent = '';
  }

  function renderImportTable() {
    var body = $('importBody');
    var empty = $('importEmpty');
    if (!body) return;
    if (!state.importRows.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    body.innerHTML = state.importRows.map(function (row) {
      return '<tr>' +
        '<td title="' + escapeHtml(row.productText) + '">' + escapeHtml(row.productText || '-') + '</td>' +
        '<td>' + escapeHtml(row.platform || '-') + '</td>' +
        '<td title="' + escapeHtml(row.url) + '">' + escapeHtml(row.url || '-') + '</td>' +
        '<td>' + escapeHtml(row.status || '-') + '</td>' +
        '<td class="col-error">' + escapeHtml(row.error || '') + '</td>' +
      '</tr>';
    }).join('');
  }

  function openImportModal() {
    state.importRows = [];
    hideImportAlert();
    renderImportTable();
    if ($('importFile')) $('importFile').value = '';
    UI.openModal('importModal');
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function downloadTemplate() {
    var sample = PRODUCTS[0] || { name: 'Hotpot Match 3D', platform: 'iOS' };
    var colW = '210';
    var emptyRows = '';
    var i;
    for (i = 0; i < 20; i++) {
      emptyRows +=
        '<Row>' +
        '<Cell ss:StyleID="sCell"><Data ss:Type="String"></Data></Cell>' +
        '<Cell ss:StyleID="sCell"><Data ss:Type="String"></Data></Cell>' +
        '<Cell ss:StyleID="sCell"><Data ss:Type="String"></Data></Cell>' +
        '<Cell ss:StyleID="sCell"><Data ss:Type="String"></Data></Cell>' +
        '</Row>';
    }
    var xml =
      '<?xml version="1.0"?>' +
      '<?mso-application progid="Excel.Sheet"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
      'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
      'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ' +
      'xmlns:html="http://www.w3.org/TR/REC-html40">' +
      '<Styles>' +
      '<Style ss:ID="Default" ss:Name="Normal">' +
      '<Alignment ss:Vertical="Center"/>' +
      '<Borders/>' +
      '<Font ss:FontName="微软雅黑" x:CharSet="134" ss:Size="10"/>' +
      '<Interior/>' +
      '<NumberFormat/>' +
      '<Protection/>' +
      '</Style>' +
      '<Style ss:ID="sCell">' +
      '<Alignment ss:Vertical="Center"/>' +
      '<Borders/>' +
      '<Font ss:FontName="微软雅黑" x:CharSet="134" ss:Size="10"/>' +
      '<Interior ss:Pattern="None"/>' +
      '</Style>' +
      '</Styles>' +
      '<Worksheet ss:Name="导入模板">' +
      '<Table ss:DefaultRowHeight="18">' +
      '<Column ss:StyleID="sCell" ss:AutoFitWidth="0" ss:Width="' + colW + '"/>' +
      '<Column ss:StyleID="sCell" ss:AutoFitWidth="0" ss:Width="' + colW + '"/>' +
      '<Column ss:StyleID="sCell" ss:AutoFitWidth="0" ss:Width="' + colW + '"/>' +
      '<Column ss:StyleID="sCell" ss:AutoFitWidth="0" ss:Width="' + colW + '"/>' +
      '<Row>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">产品名称</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">平台</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">试玩链接</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">状态</Data></Cell>' +
      '</Row>' +
      '<Row>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">' + xmlEscape(sample.name) + '</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">' + xmlEscape(sample.platform || 'iOS') + '</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">https://playable.example.com/sample</Data></Cell>' +
      '<Cell ss:StyleID="sCell"><Data ss:Type="String">启用</Data></Cell>' +
      '</Row>' +
      emptyRows +
      '</Table>' +
      '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">' +
      '<DisplayGridlines/>' +
      '</WorksheetOptions>' +
      '</Worksheet>' +
      '</Workbook>';
    var blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '试玩广告导入模板.xls';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    UI.showToast('模板已下载', 'success');
  }

  function parseCsvLine(line) {
    var result = [];
    var cur = '';
    var inQuotes = false;
    var i;
    for (i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === '\t') {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function normalizeHeader(h) {
    return String(h || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  function mapHeaderIndex(headers) {
    var map = { product: -1, platform: -1, url: -1, status: -1 };
    headers.forEach(function (h, i) {
      var key = normalizeHeader(h);
      if (key === '产品名称' || key === '产品' || key === '产品名' || key === 'productname' || key === 'product_name' || key === '产品id' || key === 'productid' || key === 'product_id') {
        map.product = i;
      } else if (key === '平台' || key === 'platform') {
        map.platform = i;
      } else if (key === '试玩链接' || key === '链接' || key === 'url' || key === 'link' || key === 'playableurl') {
        map.url = i;
      } else if (key === '状态' || key === 'status') {
        map.status = i;
      }
    });
    return map;
  }

  function resolveProduct(raw) {
    var value = String(raw || '').trim();
    if (!value) return null;
    var byId = Store.productById(value);
    if (byId) return byId;
    var lower = value.toLowerCase();
    var i;
    for (i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].name === value || PRODUCTS[i].name.toLowerCase() === lower || PRODUCTS[i].id === value) {
        return PRODUCTS[i];
      }
    }
    return null;
  }

  function normalizePlatform(raw) {
    var value = String(raw || '').trim();
    var lower = value.toLowerCase();
    if (lower === 'ios') return 'iOS';
    if (lower === 'android') return 'Android';
    return value;
  }

  function validateImportRow(row) {
    var errors = [];
    if (!row.productText) {
      errors.push('产品名称不能为空');
    } else if (!row.productId) {
      errors.push('产品不存在');
    }
    if (!row.platformRaw) {
      errors.push('平台不能为空');
    } else if (row.platform !== 'Android' && row.platform !== 'iOS') {
      errors.push('平台仅支持：Android、iOS');
    } else if (row.productPlatform && row.platform !== row.productPlatform) {
      errors.push('平台与产品不匹配');
    }
    if (!row.url) {
      errors.push('试玩链接不能为空');
    } else if (!isValidUrl(row.url)) {
      errors.push('请输入有效的 http(s) 链接');
    }
    if (row.statusRaw && row.statusRaw !== '启用' && row.statusRaw !== '禁用') {
      errors.push('状态仅支持：启用、禁用');
    }
    return errors.join('；');
  }

  function buildImportRows(headers, dataLines, splitLine) {
    var col = mapHeaderIndex(headers);
    if (col.product < 0 || col.platform < 0 || col.url < 0) {
      return { error: '表头不正确，需包含：产品名称、平台、试玩链接' };
    }
    var rows = [];
    var i;
    for (i = 0; i < dataLines.length; i++) {
      var cols = splitLine(dataLines[i]);
      var productText = String(cols[col.product] == null ? '' : cols[col.product]).trim();
      var product = resolveProduct(productText);
      var platformRaw = String(cols[col.platform] == null ? '' : cols[col.platform]).trim();
      var statusRaw = col.status < 0 ? '' : String(cols[col.status] == null ? '' : cols[col.status]).trim();
      var row = {
        productText: product ? product.name : productText,
        productId: product ? product.id : '',
        productPlatform: product ? (product.platform || '') : '',
        platformRaw: platformRaw,
        platform: normalizePlatform(platformRaw),
        url: String(cols[col.url] == null ? '' : cols[col.url]).trim(),
        statusRaw: statusRaw,
        status: statusRaw || '启用',
        error: ''
      };
      row.error = validateImportRow(row);
      rows.push(row);
    }
    if (!rows.length) return { error: '未解析到有效数据行，请检查文件内容' };
    return { rows: rows };
  }

  function xmlTagList(doc, name) {
    var list = doc.getElementsByTagName(name);
    if (list && list.length) return Array.prototype.slice.call(list);
    if (doc.getElementsByTagNameNS) {
      list = doc.getElementsByTagNameNS('*', name);
      if (list && list.length) return Array.prototype.slice.call(list);
    }
    return [];
  }

  function parseImportSpreadsheetML(xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return { error: '无法解析模板表格，请使用下载的导入模板' };
    }
    var rows = xmlTagList(doc, 'Row');
    if (!rows.length) return { error: '文件内容为空，请使用下载的模板填写后重新上传' };

    function cellIndex(cell, fallback) {
      var raw = cell.getAttribute('ss:Index') || cell.getAttribute('Index');
      if (!raw && cell.getAttributeNS) {
        raw = cell.getAttributeNS('urn:schemas-microsoft-com:office:spreadsheet', 'Index');
      }
      var n = Number(raw);
      return n > 0 ? n : fallback;
    }

    function rowCells(row) {
      var cells = xmlTagList(row, 'Cell');
      var cols = [];
      var nextIndex = 1;
      cells.forEach(function (cell) {
        var idx = cellIndex(cell, nextIndex);
        while (nextIndex < idx) {
          cols.push('');
          nextIndex += 1;
        }
        var dataNodes = xmlTagList(cell, 'Data');
        cols.push(dataNodes[0] ? String(dataNodes[0].textContent || '').trim() : '');
        nextIndex += 1;
      });
      return cols;
    }

    var headers = rowCells(rows[0]);
    var dataLines = rows.slice(1).map(rowCells).filter(function (cols) {
      return cols.some(function (c) { return String(c).trim() !== ''; });
    });
    return buildImportRows(headers, dataLines, function (cols) { return cols; });
  }

  function parseImportHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var table = doc.querySelector('table');
    if (!table) return { error: '无法解析模板表格，请使用下载的导入模板' };
    var trs = Array.prototype.slice.call(table.querySelectorAll('tr'));
    if (!trs.length) return { error: '文件内容为空，请使用下载的模板填写后重新上传' };
    var headers = Array.prototype.map.call(trs[0].querySelectorAll('td,th'), function (cell) {
      return (cell.textContent || '').trim();
    });
    var dataLines = trs.slice(1).map(function (tr) {
      return Array.prototype.map.call(tr.querySelectorAll('td,th'), function (cell) {
        return (cell.textContent || '').trim();
      });
    }).filter(function (cols) {
      return cols.some(function (c) { return String(c).trim() !== ''; });
    });
    return buildImportRows(headers, dataLines, function (cols) { return cols; });
  }

  function parseImportText(text) {
    var raw = String(text || '');
    if (
      /<Workbook[\s>]/i.test(raw) ||
      /urn:schemas-microsoft-com:office:spreadsheet/i.test(raw) ||
      /ss:Workbook/i.test(raw)
    ) {
      return parseImportSpreadsheetML(raw);
    }
    if (/<html[\s>]/i.test(raw) || /<table[\s>]/i.test(raw)) {
      return parseImportHtml(raw);
    }
    var lines = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(function (line) { return line.trim() !== ''; });
    if (!lines.length) return { error: '文件内容为空，请使用下载的模板填写后重新上传' };
    return buildImportRows(parseCsvLine(lines[0]), lines.slice(1), parseCsvLine);
  }

  function handleImportFile(file) {
    hideImportAlert();
    if (!file) return;
    var name = (file.name || '').toLowerCase();
    if (name.endsWith('.xlsx')) {
      state.importRows = [];
      renderImportTable();
      showImportAlert('暂不支持 .xlsx，请下载模板（.xls）填写后上传，或另存为 CSV');
      UI.showToast('导入失败：请上传 .xls 或 .csv 文件', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var result = parseImportText(e.target.result);
      if (result.error) {
        state.importRows = [];
        renderImportTable();
        showImportAlert(result.error);
        UI.showToast('导入失败：' + result.error, 'error');
        return;
      }
      state.importRows = result.rows;
      renderImportTable();
      var errCount = state.importRows.filter(function (r) { return r.error; }).length;
      if (errCount) {
        showImportAlert('共 ' + state.importRows.length + ' 行，其中 ' + errCount + ' 行校验失败；确认提交后将默认移除失败数据');
        UI.showToast('有 ' + errCount + ' 行校验失败，确认后将自动移除', 'error');
      } else {
        hideImportAlert();
        UI.showToast('文件解析成功，共 ' + state.importRows.length + ' 行', 'success');
      }
    };
    reader.onerror = function () {
      state.importRows = [];
      renderImportTable();
      showImportAlert('文件读取失败，请重试');
      UI.showToast('导入失败：文件读取失败', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function confirmImport() {
    if (!state.importRows.length) {
      showImportAlert('请先上传文件');
      UI.showToast('请先上传导入文件', 'error');
      return;
    }
    var validRows = state.importRows.filter(function (r) { return !r.error; });
    var removedCount = state.importRows.length - validRows.length;
    if (!validRows.length) {
      showImportAlert('全部数据校验失败，已无可提交内容');
      UI.showToast('导入失败：没有可提交的有效数据', 'error');
      return;
    }
    var now = Store.nowText();
    var seq = 100000;
    ALL_ROWS.forEach(function (r) {
      var n = parseInt(r.id, 10);
      if (isFinite(n) && n > seq) seq = n;
    });
    var created = validRows.map(function (row) {
      seq += 1;
      return {
        id: pad6(seq),
        productId: row.productId,
        url: row.url,
        status: row.status || '启用',
        updatedAt: now
      };
    });
    ALL_ROWS = created.concat(ALL_ROWS);
    state.importRows = [];
    UI.closeModal('importModal');
    state.page = 1;
    renderTable();
    if (removedCount) {
      UI.showToast('导入成功：已新增 ' + created.length + ' 条，已移除失败数据 ' + removedCount + ' 条', 'success');
    } else {
      UI.showToast('导入成功：已新增 ' + created.length + ' 条', 'success');
    }
  }

  $('queryBtn').addEventListener('click', function () {
    applyFilters();
    renderTable();
  });
  $('resetBtn').addEventListener('click', function () {
    state.draft = { product: '', status: '' };
    $('filterProduct').value = '';
    if (filterProductClear) filterProductClear.sync();
    if (statusFilter && statusFilter.syncLabel) statusFilter.syncLabel('');
    applyFilters();
    renderTable();
  });
  $('addBtn').addEventListener('click', openAdd);
  $('importBtn').addEventListener('click', openImportModal);
  $('editSubmit').addEventListener('click', submitEdit);
  $('batchStatusSubmit').addEventListener('click', submitBatchStatus);
  $('deleteOk').addEventListener('click', confirmDelete);
  $('uploadBtn').addEventListener('click', function () {
    if ($('importFile')) $('importFile').click();
  });
  $('downloadTemplateBtn').addEventListener('click', downloadTemplate);
  $('importSubmit').addEventListener('click', confirmImport);
  $('importFile').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    handleImportFile(file);
  });
  $('editUrl').addEventListener('input', function () { setItemError('editUrlItem', false); });

  $('checkAll').addEventListener('change', function () {
    var checked = !!$('checkAll').checked;
    var rows = getFilteredRows();
    var start = (state.page - 1) * state.pageSize;
    var pageRows = rows.slice(start, start + state.pageSize);
    pageRows.forEach(function (row) {
      if (checked) state.selected[row.id] = true;
      else delete state.selected[row.id];
    });
    renderTable();
  });

  $('tableBody').addEventListener('change', function (e) {
    var input = e.target.closest('[data-row-check]');
    if (!input) return;
    var id = input.getAttribute('data-row-check');
    if (input.checked) state.selected[id] = true;
    else delete state.selected[id];
    var rows = getFilteredRows();
    var start = (state.page - 1) * state.pageSize;
    syncCheckAll(rows.slice(start, start + state.pageSize));
    updateBatchBtn();
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
    else if (action === 'delete') openDelete([row.id]);
  });

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close');
      if (id) UI.closeModal(id);
    });
  });

  fillProductPanel();
  applyFilters();
  renderTable();
})();
