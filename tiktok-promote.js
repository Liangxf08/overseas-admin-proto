/* TikTok推广 · 推广系列 */
(function () {
  'use strict';

  var UI = window.ProductUI;
  if (!UI) return;

  var $ = UI.$;
  var escapeHtml = UI.escapeHtml;

  var PRODUCTS = [
    { name: 'Fun Overload', asset: '小游戏' },
    { name: 'Mind Block', asset: '小游戏' },
    { name: 'Brain Mix', asset: '小游戏' },
    { name: '闪婚当天', asset: '短剧' },
    { name: '重生豪门', asset: '短剧' },
    { name: '隐婚甜妻', asset: '短剧' },
    { name: 'Life Story', asset: 'APP' },
    { name: 'Flow Master', asset: 'APP' },
    { name: 'Path Flow', asset: 'APP' }
  ];

  var STATUSES = ['投放中', '未全部投放', '未投放', '已暂停', '已完成', '审核未通过'];
  var OPTIMIZERS = ['用户A', '用户B', '用户C', '用户D', '用户E', '用户F'];
  var ACCOUNTS = [
    { name: 'WG-US-01', id: '7341008800001001' },
    { name: 'WG-JP-02', id: '7341008800001002' },
    { name: 'WG-KR-03', id: '7341008800001003' },
    { name: 'WG-BR-04', id: '7341008800001004' }
  ];

  var FILTER_DEFS = [
    { key: 'date', name: '日期', def: true },
    { key: 'campaign', name: '推广系列', def: true },
    { key: 'advertiser', name: '广告账户', def: true },
    { key: 'operation_status', name: '开关' },
    { key: 'effective_status', name: '状态' },
    { key: 'asset_type', name: '资产类型' },
    { key: 'app_name', name: '产品名称' },
    { key: 'optimizer_name', name: '优化师' }
  ];

  var COHORT_DAYS = [0, 1, 2, 3, 4, 5, 6, 13, 20, 27, 29, 31];
  var DEFAULT_METRIC_KEYS = [
    'operation_status', 'campaign_name', 'campaign_id', 'budget_mode', 'budget',
    'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'ad_total', 'ad_roas_d0'
  ];

  function metricCol(key, name, group, kind, width) {
    return {
      key: key,
      name: name,
      group: group,
      kind: kind,
      width: width || 112,
      def: DEFAULT_METRIC_KEYS.indexOf(key) >= 0,
      defaultFrozen: key === 'operation_status' || key === 'campaign_name' || key === 'campaign_id'
    };
  }

  function cohortCols(prefix, label, group, kind) {
    return COHORT_DAYS.map(function (day) {
      return metricCol(prefix + '_d' + day, 'D' + day + ' ' + label, group, kind, 128);
    });
  }

  var COLUMNS = [
    metricCol('operation_status', '开关', '属性指标', 'switch', 88),
    metricCol('campaign_name', '推广系列名称', '属性指标', 'text', 220),
    metricCol('campaign_id', '推广系列ID', '属性指标', 'text', 180),
    metricCol('objective_type', '推广目标', '属性指标', 'text', 120),
    metricCol('app_promotion_type', '推广类型', '属性指标', 'text', 120),
    metricCol('budget_optimize_on', '预算优化', '属性指标', 'text', 112),
    metricCol('budget_mode', '预算类型', '属性指标', 'text', 112),
    metricCol('budget', '预算', '属性指标', 'money', 112),
    metricCol('effective_status', '状态', '属性指标', 'text', 120),
    metricCol('advertiser_name', '广告账户名称', '属性指标', 'text', 160),
    metricCol('advertiser_id', '广告账户ID', '属性指标', 'text', 180),
    metricCol('asset_type', '资产类型', '属性指标', 'text', 112),
    metricCol('app_name', '产品名称', '属性指标', 'text', 140),
    metricCol('optimizer_name', '优化师', '属性指标', 'text', 100),

    metricCol('spend', '消耗', '核心指标', 'money'),
    metricCol('total_revenue', '累计总收入', '核心指标', 'money', 120),
    metricCol('total_roas', '累计总ROAS', '核心指标', 'rate', 120),
    metricCol('impressions', '展示量', '核心指标', 'int'),
    metricCol('clicks', '点击量', '核心指标', 'int'),
    metricCol('ctr', '点击率', '核心指标', 'rate'),
    metricCol('cpc', '平均点击成本', '核心指标', 'money', 128),
    metricCol('cpm', '千次展示成本', '核心指标', 'money', 128),
    metricCol('reach', '覆盖人数', '核心指标', 'int'),
    metricCol('reach_cpm', '覆盖千人成本', '核心指标', 'money', 128),
    metricCol('frequency', '频次', '核心指标', 'dec'),
    metricCol('conversion', '转化量', '核心指标', 'int'),
    metricCol('cost_per_conversion', '平均转化成本', '核心指标', 'money', 128),
    metricCol('conversion_rate', '转化率', '核心指标', 'rate'),

    metricCol('active', '活跃度', '转化指标', 'int'),
    metricCol('active_cost', '活跃平均成本', '转化指标', 'money', 128),
    metricCol('unique_open', '去重打开次数', '转化指标', 'int', 128),
    metricCol('unique_open_cost', '去重打开成本', '转化指标', 'money', 128),
    metricCol('open_rate', '打开率', '转化指标', 'rate'),
    metricCol('total_open', '总打开次数', '转化指标', 'int', 120),
    metricCol('open_cost', '单次打开成本', '转化指标', 'money', 128),

    metricCol('unique_ad', '去重广告展示数', '广告曝光', 'int', 140),
    metricCol('unique_ad_cost', '去重广告展示成本', '广告曝光', 'money', 148),
    metricCol('ad_rate', '广告展示率', '广告曝光', 'rate', 120),
    metricCol('ad_total', '广告展示总数', '广告曝光', 'int', 128),
    metricCol('ad_cost', '广告展示成本', '广告曝光', 'money', 128),
    metricCol('ad_value', '广告总价值', '广告曝光', 'money', 120),
    metricCol('ad_value_per', '单次广告价值', '广告曝光', 'money', 128),
    metricCol('ad_roas', '广告 ROAS', '广告曝光', 'rate', 120),
    metricCol('ad_impr_d0', 'D0 广告展示数', '广告曝光', 'int', 128)
  ].concat(cohortCols('ad_revenue', '广告收入', '广告曝光', 'money'))
    .concat(cohortCols('ad_roas', '广告ROAS', '广告曝光', 'rate'))
    .concat([
      metricCol('unique_pay', '去重付费量', '付费价值', 'int', 120),
      metricCol('unique_pay_cost', '去重付费成本', '付费价值', 'money', 128),
      metricCol('pay_rate', '付费率', '付费价值', 'rate'),
      metricCol('pay_count', '付费数', '付费价值', 'int'),
      metricCol('pay_cost', '平均付费成本', '付费价值', 'money', 128),
      metricCol('pay_value', '付费总价值', '付费价值', 'money', 120),
      metricCol('pay_value_per', '单次付费价值', '付费价值', 'money', 128),
      metricCol('pay_roas', '付费 ROAS', '付费价值', 'rate', 120),
      metricCol('pay_count_d0', 'D0 付费量', '付费价值', 'int', 120)
    ])
    .concat(cohortCols('pay_value', '付费价值', '付费价值', 'money'))
    .concat(cohortCols('pay_roas', '付费ROAS', '付费价值', 'rate'));

  var COLUMN_MAP = {};
  COLUMNS.forEach(function (col) { COLUMN_MAP[col.key] = col; });
  var GROUPS = [];
  COLUMNS.forEach(function (col) {
    if (GROUPS.indexOf(col.group) < 0) GROUPS.push(col.group);
  });

  var CAMPAIGN_SUFFIX = ['安装-通投', '安装-相似受众', '再营销-7日', '再营销-付费', '覆盖-品牌', '转化-注册', '转化-付费', 'AEO-安装'];

  function buildRows() {
    var rows = [];
    var i;
    for (i = 0; i < 24; i++) {
      var product = PRODUCTS[i % PRODUCTS.length];
      var account = ACCOUNTS[i % ACCOUNTS.length];
      var on = i % 5 !== 0;
      var impressions = 18000 + i * 2460;
      var clicks = Math.round(impressions * (0.012 + (i % 7) * 0.004));
      var spend = Math.round((420 + i * 86) * (on ? 1 : 0.2));
      rows.push({
        operation_status: on ? '开启' : '关闭',
        campaign_name: product.name + '-' + CAMPAIGN_SUFFIX[i % CAMPAIGN_SUFFIX.length],
        campaign_id: String(1805523000000100 + i),
        objective_type: i % 4 === 0 ? '覆盖人数' : '应用推广',
        app_promotion_type: i % 3 === 0 ? '应用再营销' : '应用安装',
        budget_optimize_on: i % 2 === 0 ? '开启' : '关闭',
        budget_mode: i % 2 === 0 ? '日预算' : '总预算',
        budget: i % 2 === 0 ? 200 + (i % 6) * 100 : 3000 + i * 200,
        effective_status: STATUSES[i % STATUSES.length],
        advertiser_name: account.name,
        advertiser_id: account.id,
        asset_type: product.asset,
        app_name: product.name,
        optimizer_name: OPTIMIZERS[i % OPTIMIZERS.length],
        seed: i,
        spend: spend,
        impressions: impressions,
        clicks: clicks,
        reach: Math.round(impressions * 0.62),
        conversion: Math.round(clicks * (0.08 + (i % 5) * 0.02)),
        active: Math.round(clicks * 0.55),
        unique_open: Math.round(clicks * 0.42),
        total_open: Math.round(clicks * 0.76),
        unique_ad: Math.round(impressions * 0.28),
        ad_total: Math.round(impressions * 0.72),
        ad_value: Math.round(spend * 0.46),
        unique_pay: Math.round(clicks * 0.04),
        pay_count: Math.round(clicks * 0.07),
        pay_value: Math.round(spend * (0.62 + (i % 4) * 0.12))
      });
    }
    return rows;
  }

  function emptyDraft() {
    return {
      operation_status: '',
      effective_status: [],
      asset_type: '',
      app_name: [],
      optimizer_name: []
    };
  }

  var rows = buildRows();
  var draft = emptyDraft();
  var applied = emptyDraft();
  var appliedCampaign = '';
  var appliedAdvertiser = '';
  var visibleFilters = FILTER_DEFS.filter(function (item) { return item.def; }).map(function (item) { return item.key; });
  var filterSettingsSnapshot = null;
  var columns = COLUMNS.filter(function (col) { return col.def; }).map(function (col) { return col.key; });
  var frozenCount = columns.filter(function (key) { return isDefaultFrozenKey(key); }).length;
  var columnDraft = columns.slice();
  var draftFrozenCount = frozenCount;
  var metricCat = GROUPS[0];
  var metricAnchorLock = false;
  var sortState = { specs: [] };
  var page = 1;
  var pageSize = 20;
  var dateApi = null;
  var productMulti = null;
  var campaignClear = null;
  var advertiserClear = null;
  var appliedScale = 1;

  function currentScale() {
    if (!dateApi) return 1;
    var start = dateApi.getStart();
    var end = dateApi.getEnd();
    if (!start || !end) return 1;
    var days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(days, 1) / 7;
  }

  function ratio(a, b) { return b ? a / b : 0; }

  function cohortFactor(row, day) {
    var weights = { 0: 0.42, 1: 0.51, 2: 0.58, 3: 0.64, 4: 0.7, 5: 0.75, 6: 0.8, 13: 0.9, 20: 0.96, 27: 1.02, 29: 1.05, 31: 1.08 };
    return (weights[day] || 1) * (0.92 + (row.seed % 5) * 0.03);
  }

  function metricNumber(row, key, scale) {
    var spend = row.spend * scale;
    var impressions = row.impressions * scale;
    var clicks = row.clicks * scale;
    var reach = row.reach * scale;
    var conversion = row.conversion * scale;
    var active = row.active * scale;
    var uniqueOpen = row.unique_open * scale;
    var totalOpen = row.total_open * scale;
    var uniqueAd = row.unique_ad * scale;
    var adTotal = row.ad_total * scale;
    var adValue = row.ad_value * scale;
    var uniquePay = row.unique_pay * scale;
    var payCount = row.pay_count * scale;
    var payValue = row.pay_value * scale;
    var totalRevenue = adValue + payValue;
    var dayMatch = /_d(\d+)$/.exec(key);
    var factor = dayMatch ? cohortFactor(row, Number(dayMatch[1])) : 1;

    if (key === 'spend') return spend;
    if (key === 'total_revenue') return totalRevenue;
    if (key === 'total_roas') return ratio(totalRevenue, spend);
    if (key === 'impressions') return impressions;
    if (key === 'clicks') return clicks;
    if (key === 'ctr') return ratio(clicks, impressions);
    if (key === 'cpc') return clicks ? spend / clicks : 0;
    if (key === 'cpm') return impressions ? spend / impressions * 1000 : 0;
    if (key === 'reach') return reach;
    if (key === 'reach_cpm') return reach ? spend / reach * 1000 : 0;
    if (key === 'frequency') return ratio(impressions, reach);
    if (key === 'conversion') return conversion;
    if (key === 'cost_per_conversion') return conversion ? spend / conversion : 0;
    if (key === 'conversion_rate') return ratio(conversion, clicks);
    if (key === 'active') return active;
    if (key === 'active_cost') return active ? spend / active : 0;
    if (key === 'unique_open') return uniqueOpen;
    if (key === 'unique_open_cost') return uniqueOpen ? spend / uniqueOpen : 0;
    if (key === 'open_rate') return ratio(uniqueOpen, clicks);
    if (key === 'total_open') return totalOpen;
    if (key === 'open_cost') return totalOpen ? spend / totalOpen : 0;
    if (key === 'unique_ad') return uniqueAd;
    if (key === 'unique_ad_cost') return uniqueAd ? spend / uniqueAd : 0;
    if (key === 'ad_rate') return ratio(uniqueAd, uniqueOpen);
    if (key === 'ad_total') return adTotal;
    if (key === 'ad_cost') return adTotal ? spend / adTotal : 0;
    if (key === 'ad_value') return adValue;
    if (key === 'ad_value_per') return adTotal ? adValue / adTotal : 0;
    if (key === 'ad_roas') return ratio(adValue, spend);
    if (key === 'ad_impr_d0') return adTotal * cohortFactor(row, 0);
    if (key.indexOf('ad_revenue_d') === 0) return adValue * factor;
    if (key.indexOf('ad_roas_d') === 0) return ratio(adValue * factor, spend);
    if (key === 'unique_pay') return uniquePay;
    if (key === 'unique_pay_cost') return uniquePay ? spend / uniquePay : 0;
    if (key === 'pay_rate') return ratio(uniquePay, clicks);
    if (key === 'pay_count') return payCount;
    if (key === 'pay_cost') return payCount ? spend / payCount : 0;
    if (key === 'pay_value') return payValue;
    if (key === 'pay_value_per') return payCount ? payValue / payCount : 0;
    if (key === 'pay_roas') return ratio(payValue, spend);
    if (key === 'pay_count_d0') return payCount * cohortFactor(row, 0);
    if (key.indexOf('pay_value_d') === 0) return payValue * factor;
    if (key.indexOf('pay_roas_d') === 0) return ratio(payValue * factor, spend);
    if (key === 'budget') return row.budget;
    return 0;
  }

  function formatNumber(n, digits) {
    var value = Number(n || 0);
    if (!isFinite(value)) value = 0;
    return value.toFixed(digits);
  }

  function formatByKind(n, kind) {
    if (kind === 'money') return formatNumber(n, 2);
    if (kind === 'int') return formatNumber(n, 0);
    if (kind === 'dec') return formatNumber(n, 2);
    if (kind === 'rate') return formatNumber(n * 100, 2) + '%';
    if (kind === 'sec') return formatNumber(n, 2);
    return '';
  }

  function displayValue(row, col, scale) {
    if (col.kind === 'text' || col.kind === 'switch') return row[col.key] || '';
    return formatByKind(metricNumber(row, col.key, scale), col.kind);
  }

  function isNumericMetric(col) {
    return !!(col && col.group !== '属性指标' && col.kind !== 'text' && col.kind !== 'switch');
  }

  function isRatioMetric(key) {
    if (key === 'total_roas' || key === 'ctr' || key === 'cpc' || key === 'cpm' || key === 'reach_cpm' || key === 'frequency' || key === 'cost_per_conversion' || key === 'conversion_rate' || key === 'active_cost' || key === 'unique_open_cost' || key === 'open_rate' || key === 'open_cost' || key === 'unique_ad_cost' || key === 'ad_rate' || key === 'ad_cost' || key === 'ad_value_per' || key === 'ad_roas' || key === 'unique_pay_cost' || key === 'pay_rate' || key === 'pay_cost' || key === 'pay_value_per' || key === 'pay_roas') return true;
    return key.indexOf('ad_roas_d') === 0 || key.indexOf('pay_roas_d') === 0;
  }

  function firstNumericKey() {
    var key = '';
    columns.some(function (colKey) {
      if (!isNumericMetric(COLUMN_MAP[colKey])) return false;
      key = colKey;
      return true;
    });
    return key;
  }

  function effectiveSortSpecs() {
    var visible = {};
    columns.forEach(function (key) { visible[key] = true; });
    var specs = (sortState.specs || []).filter(function (spec) {
      return spec && visible[spec.key] && (spec.dir === 'asc' || spec.dir === 'desc');
    });
    if (specs.length) return specs;
    var key = firstNumericKey();
    return key ? [{ key: key, dir: 'desc' }] : [];
  }

  function summedMetrics(list, scale) {
    var sums = {};
    COLUMNS.forEach(function (col) {
      if (!isNumericMetric(col) || isRatioMetric(col.key)) return;
      var total = 0;
      list.forEach(function (row) { total += metricNumber(row, col.key, scale); });
      sums[col.key] = total;
    });
    return sums;
  }

  function summaryNumber(sums, key) {
    if (!isRatioMetric(key)) return sums[key] || 0;
    var spend = sums.spend || 0;
    var impressions = sums.impressions || 0;
    var clicks = sums.clicks || 0;
    var reach = sums.reach || 0;
    var conversion = sums.conversion || 0;
    var active = sums.active || 0;
    var uniqueOpen = sums.unique_open || 0;
    var totalOpen = sums.total_open || 0;
    var uniqueAd = sums.unique_ad || 0;
    var adTotal = sums.ad_total || 0;
    var adValue = sums.ad_value || 0;
    var uniquePay = sums.unique_pay || 0;
    var payCount = sums.pay_count || 0;
    var payValue = sums.pay_value || 0;
    if (key === 'total_roas') return ratio(sums.total_revenue || 0, spend);
    if (key === 'ctr') return ratio(clicks, impressions);
    if (key === 'cpc') return clicks ? spend / clicks : 0;
    if (key === 'cpm') return impressions ? spend / impressions * 1000 : 0;
    if (key === 'reach_cpm') return reach ? spend / reach * 1000 : 0;
    if (key === 'frequency') return ratio(impressions, reach);
    if (key === 'cost_per_conversion') return conversion ? spend / conversion : 0;
    if (key === 'conversion_rate') return ratio(conversion, clicks);
    if (key === 'active_cost') return active ? spend / active : 0;
    if (key === 'unique_open_cost') return uniqueOpen ? spend / uniqueOpen : 0;
    if (key === 'open_rate') return ratio(uniqueOpen, clicks);
    if (key === 'open_cost') return totalOpen ? spend / totalOpen : 0;
    if (key === 'unique_ad_cost') return uniqueAd ? spend / uniqueAd : 0;
    if (key === 'ad_rate') return ratio(uniqueAd, uniqueOpen);
    if (key === 'ad_cost') return adTotal ? spend / adTotal : 0;
    if (key === 'ad_value_per') return adTotal ? adValue / adTotal : 0;
    if (key === 'ad_roas') return ratio(adValue, spend);
    if (key.indexOf('ad_roas_d') === 0) return ratio(sums[key.replace('ad_roas_', 'ad_revenue_')] || 0, spend);
    if (key === 'unique_pay_cost') return uniquePay ? spend / uniquePay : 0;
    if (key === 'pay_rate') return ratio(uniquePay, clicks);
    if (key === 'pay_cost') return payCount ? spend / payCount : 0;
    if (key === 'pay_value_per') return payCount ? payValue / payCount : 0;
    if (key === 'pay_roas') return ratio(payValue, spend);
    if (key.indexOf('pay_roas_d') === 0) return ratio(sums[key.replace('pay_roas_', 'pay_value_')] || 0, spend);
    return 0;
  }

  function sortValue(row, key, scale) {
    var col = COLUMN_MAP[key];
    if (!col) return '';
    if (col.kind === 'text' || col.kind === 'switch') return row[key] || '';
    return metricNumber(row, key, scale);
  }

  function includesText(value, keyword) {
    return String(value || '').toLowerCase().indexOf(keyword) !== -1;
  }

  function filteredRows() {
    var campaignKw = appliedCampaign.trim().toLowerCase();
    var advertiserKw = appliedAdvertiser.trim().toLowerCase();
    var scale = appliedScale;
    var list = rows.filter(function (row) {
      if (campaignKw && !includesText(row.campaign_name, campaignKw) && !includesText(row.campaign_id, campaignKw)) return false;
      if (advertiserKw && !includesText(row.advertiser_name, advertiserKw) && !includesText(row.advertiser_id, advertiserKw)) return false;
      if (visibleFilters.indexOf('operation_status') >= 0 && applied.operation_status && row.operation_status !== applied.operation_status) return false;
      if (visibleFilters.indexOf('effective_status') >= 0 && applied.effective_status.length && applied.effective_status.indexOf(row.effective_status) < 0) return false;
      if (visibleFilters.indexOf('asset_type') >= 0 && applied.asset_type && row.asset_type !== applied.asset_type) return false;
      if (visibleFilters.indexOf('app_name') >= 0 && applied.app_name.length && applied.app_name.indexOf(row.app_name) < 0) return false;
      if (visibleFilters.indexOf('optimizer_name') >= 0 && applied.optimizer_name.length && applied.optimizer_name.indexOf(row.optimizer_name) < 0) return false;
      return true;
    });
    return UI.sortRowsBySpecs(list, effectiveSortSpecs(), function (a, b, key) {
      var av = sortValue(a, key, scale);
      var bv = sortValue(b, key, scale);
      if (typeof av === 'number' || typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), 'zh');
    });
  }

  function visibleColumns() {
    return columns.map(function (key) { return COLUMN_MAP[key]; }).filter(Boolean);
  }

  function isDefaultFrozenKey(key) {
    var col = COLUMN_MAP[key];
    return !!(col && col.defaultFrozen);
  }

  function minFrozenCount(draft) {
    var n = 0;
    (draft || []).forEach(function (key) {
      if (isDefaultFrozenKey(key)) n += 1;
    });
    return n;
  }

  function syncFreezeLeft() {
    var table = $('campaignTable');
    if (!table) return;
    var cols = table.querySelectorAll('colgroup col');
    var ths = table.querySelectorAll('thead th');
    var bodyRows = table.querySelectorAll('tbody tr, tfoot tr');
    var left = 0;
    var count = Math.min(frozenCount, cols.length);
    Array.prototype.forEach.call(cols, function (col, index) {
      var frozen = index < count;
      var width = parseFloat(col.style.width) || 0;
      if (ths[index]) {
        ths[index].classList.toggle('is-freeze', frozen);
        ths[index].style.left = frozen ? left + 'px' : '';
      }
      Array.prototype.forEach.call(bodyRows, function (tr) {
        var cell = tr.children[index];
        if (!cell) return;
        cell.classList.toggle('is-freeze', frozen);
        cell.style.left = frozen ? left + 'px' : '';
      });
      if (frozen) left += width;
    });
  }

  function renderTable() {
    var scale = appliedScale;
    var list = filteredRows();
    var totalPages = Math.max(1, Math.ceil(list.length / pageSize) || 1);
    if (page > totalPages) page = totalPages;
    var pageRows = list.slice((page - 1) * pageSize, page * pageSize);
    var cols = visibleColumns();

    $('tableColgroup').innerHTML = cols.map(function (col) {
      return '<col data-col-width="' + col.width + '" />';
    }).join('');

    $('tableHead').innerHTML =
      '<tr>' + cols.map(function (col, index) {
        var cls = [];
        if (col.kind !== 'text' && col.kind !== 'switch') cls.push('num');
        if (index < frozenCount) cls.push('is-freeze');
        return '<th class="' + cls.join(' ') + '"><div class="th-sort' + (cls.indexOf('num') >= 0 ? ' th-sort--num' : '') + '" data-key="' + col.key + '">' +
          '<span>' + escapeHtml(col.name) + '</span>' + UI.TH_SORT_ICONS_HTML +
        '</div></th>';
      }).join('') + '</tr>';

    $('tableBody').innerHTML = pageRows.map(function (row) {
      return '<tr>' + cols.map(function (col, index) {
        var cls = [];
        if (index < frozenCount) cls.push('is-freeze');
        if (col.kind === 'switch') {
          var on = row.operation_status === '开启';
          return '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '><button class="switch' + (on ? ' is-on' : '') + '" type="button" disabled aria-label="' + (on ? '开启' : '关闭') + '" aria-pressed="' + (on ? 'true' : 'false') + '"></button></td>';
        }
        if (col.kind !== 'text') cls.push('num');
        return '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + escapeHtml(displayValue(row, col, scale)) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var foot = $('tableFoot');
    if (!list.length) {
      foot.innerHTML = '';
    } else {
      var sums = summedMetrics(list, scale);
      var labelPlaced = false;
      foot.innerHTML = '<tr>' + cols.map(function (col, index) {
        var cls = [];
        var text = '';
        if (index < frozenCount) cls.push('is-freeze');
        if (!isNumericMetric(col)) {
          if (!labelPlaced) {
            text = '合计';
            labelPlaced = true;
          }
        } else {
          cls.push('num');
          text = formatByKind(summaryNumber(sums, col.key), col.kind);
        }
        return '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + escapeHtml(text) + '</td>';
      }).join('') + '</tr>';
    }

    $('emptyTip').hidden = list.length > 0;
    $('campaignTable').hidden = list.length === 0;
    UI.renderPagination({ containerId: 'pagination', total: list.length, page: page, pageSize: pageSize });
    if (window.ColResize) {
      ColResize.refresh($('campaignTable'), { onLayout: syncFreezeLeft });
    } else {
      syncFreezeLeft();
    }
    if (sortApi) sortApi.sync();
  }

  function applyQuery() {
    appliedScale = visibleFilters.indexOf('date') >= 0 ? currentScale() : 1;
    applied = {
      operation_status: draft.operation_status,
      effective_status: draft.effective_status.slice(),
      asset_type: draft.asset_type,
      app_name: draft.app_name.slice(),
      optimizer_name: draft.optimizer_name.slice()
    };
    appliedCampaign = visibleFilters.indexOf('campaign') >= 0 ? ($('campaignKeyword').value || '') : '';
    appliedAdvertiser = visibleFilters.indexOf('advertiser') >= 0 ? ($('advertiserKeyword').value || '') : '';
    page = 1;
    renderTable();
  }

  function todayRange() {
    var day = new Date();
    day.setHours(0, 0, 0, 0);
    return [day, new Date(day.getTime())];
  }

  function resetFilters() {
    draft = emptyDraft();
    $('campaignKeyword').value = '';
    $('advertiserKeyword').value = '';
    if (campaignClear) campaignClear.sync();
    if (advertiserClear) advertiserClear.sync();
    if (dateApi) {
      var range = todayRange();
      dateApi.setRange(range[0], range[1], 'today', true);
    }
    operationApi.syncLabel('');
    statusMulti.render();
    assetApi.syncLabel('');
    productMulti.render();
    optimizerMulti.render();
    applyQuery();
  }

  function syncOptionalVisibility() {
    document.querySelectorAll('[data-filter]').forEach(function (el) {
      var key = el.getAttribute('data-filter');
      el.hidden = visibleFilters.indexOf(key) < 0;
    });
  }

  function clearHiddenDraft() {
    if (visibleFilters.indexOf('campaign') < 0) setKeyword('campaign', '');
    if (visibleFilters.indexOf('advertiser') < 0) setKeyword('advertiser', '');
    if (visibleFilters.indexOf('date') < 0 && dateApi) {
      var range = todayRange();
      dateApi.setRange(range[0], range[1], 'today', true);
    }
    if (visibleFilters.indexOf('operation_status') < 0) draft.operation_status = '';
    if (visibleFilters.indexOf('effective_status') < 0) draft.effective_status = [];
    if (visibleFilters.indexOf('asset_type') < 0) draft.asset_type = '';
    if (visibleFilters.indexOf('app_name') < 0) draft.app_name = [];
    if (visibleFilters.indexOf('optimizer_name') < 0) draft.optimizer_name = [];
    operationApi.syncLabel(draft.operation_status);
    statusMulti.render();
    assetApi.syncLabel(draft.asset_type);
    productMulti.render();
    optimizerMulti.render();
  }

  function productOptions() {
    return PRODUCTS.filter(function (item) {
      return !draft.asset_type || item.asset === draft.asset_type;
    }).map(function (item) { return item.name; });
  }

  function productUsesDual() {
    return productOptions().length > 7;
  }

  function pruneProducts() {
    var allowed = productOptions();
    draft.app_name = draft.app_name.filter(function (name) { return allowed.indexOf(name) >= 0; });
  }

  function cloneDraft(src) {
    return {
      operation_status: src.operation_status,
      effective_status: src.effective_status.slice(),
      asset_type: src.asset_type,
      app_name: src.app_name.slice(),
      optimizer_name: src.optimizer_name.slice()
    };
  }

  function keywordInputId(key) {
    return key === 'campaign' ? 'campaignKeyword' : 'advertiserKeyword';
  }

  function keywordValue(key) {
    var input = $(keywordInputId(key));
    return input ? input.value : '';
  }

  function setKeyword(key, value) {
    var input = $(keywordInputId(key));
    if (input) input.value = value;
    if (key === 'campaign' && campaignClear) campaignClear.sync();
    if (key === 'advertiser' && advertiserClear) advertiserClear.sync();
  }

  function syncBarFilters() {
    if (operationApi) operationApi.syncLabel(draft.operation_status);
    if (statusMulti) statusMulti.render();
    if (assetApi) assetApi.syncLabel(draft.asset_type);
    if (productMulti) productMulti.render();
    if (optimizerMulti) optimizerMulti.render();
  }

  var CLEAR_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l6 6M9 3L3 9"/></svg>';
  var ARROW_ICON = '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>';

  function dateShortcutHtml() {
    return [
      ['today', '今天'], ['yesterday', '昨天'], ['last7', '近7天'], ['last30', '近30天'],
      ['thisWeek', '本周'], ['lastWeek', '上周'], ['thisMonth', '本月'], ['lastMonth', '上月']
    ].map(function (item) {
      return '<button class="date-shortcut" type="button" data-shortcut="' + item[0] + '">' + item[1] + '</button>';
    }).join('');
  }

  function multiPanelHtml(key, dual) {
    if (dual) {
      return '<div class="multi-panel" id="fsPanel_' + key + '">' +
        '<div class="multi-panel__left">' +
          '<div class="multi-panel__search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg><input type="text" id="fsSearch_' + key + '" placeholder="搜索" autocomplete="off" /></div>' +
          '<div class="multi-panel__toolbar"><button class="multi-panel__link" type="button" data-fs-all="' + key + '">全选</button></div>' +
          '<div class="multi-panel__list" id="fsList_' + key + '"></div>' +
        '</div>' +
        '<div class="multi-panel__right">' +
          '<div class="multi-panel__toolbar multi-panel__toolbar--right"><span id="fsCount_' + key + '">已选择 0 项</span><button class="multi-panel__link" type="button" data-fs-clear="' + key + '">清空</button></div>' +
          '<div class="multi-panel__list" id="fsSelected_' + key + '"></div>' +
        '</div></div>';
    }
    return '<div class="multi-panel multi-panel--simple" id="fsPanel_' + key + '"><div class="multi-panel__list" id="fsList_' + key + '"></div></div>';
  }

  function filterSettingControlHtml(item) {
    var key = item.key;
    if (key === 'date') {
      return '<div class="filter-setting-control filter-setting-control--date" id="fsDateWrap">' +
        '<button class="date-range-trigger" type="button" id="fsDateTrigger"><span class="date-range-trigger__text" id="fsDateLabel">日期：-</span></button>' +
        '<div class="date-panel" id="fsDatePanel">' +
          '<div class="date-panel__shortcuts" id="fsDateShortcuts">' + dateShortcutHtml() + '</div>' +
          '<div class="date-panel__calendars"><div class="date-cal" id="fsDateCalLeft"></div><div class="date-cal" id="fsDateCalRight"></div></div>' +
        '</div></div>';
    }
    if (key === 'campaign' || key === 'advertiser') {
      var value = keywordValue(key);
      var prefix = key === 'campaign' ? '推广系列：' : '广告账户：';
      return '<div class="filter-setting-control' + (value ? ' has-value' : '') + '" id="fsWrap_' + key + '">' +
        '<label class="select-trigger select-trigger--input" for="fs_' + key + '">' +
          '<span class="select-trigger__prefix">' + prefix + '</span>' +
          '<input class="select-trigger__field" type="text" id="fs_' + key + '" placeholder="请输入" value="' + escapeHtml(value) + '" autocomplete="off" />' +
        '</label>' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
      '</div>';
    }
    var singleOptions = key === 'operation_status' ? ['开启', '关闭'] : (key === 'asset_type' ? ['小游戏', '短剧', 'APP'] : null);
    if (singleOptions) {
      return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
        '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
          '<span class="select-trigger__text" id="fsLabel_' + key + '">' + escapeHtml(item.name) + '：<span class="muted">请选择</span></span>' +
          ARROW_ICON +
        '</button>' +
        '<button class="select-clear" type="button" id="fsClear_' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
        '<div class="single-panel" id="fsPanel_' + key + '">' +
          singleOptions.map(function (option) {
            return '<div class="single-option" data-value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</div>';
          }).join('') +
        '</div></div>';
    }
    var dual = key === 'app_name' && productUsesDual();
    return '<div class="filter-setting-control" id="fsWrap_' + key + '">' +
      '<button class="select-trigger" type="button" id="fsTrigger_' + key + '">' +
        '<span class="select-trigger__text" id="fsLabel_' + key + '">' + escapeHtml(item.name) + '：<span class="muted">请选择</span></span>' +
        ARROW_ICON +
      '</button>' +
      '<button class="select-clear" type="button" data-fs-clear-icon="' + key + '" aria-label="清除">' + CLEAR_ICON + '</button>' +
      multiPanelHtml(key, dual) +
    '</div>';
  }

  function bindFilterSettingsControls() {
    var fsDate = UI.bindDateRange({
      wrapId: 'fsDateWrap',
      triggerId: 'fsDateTrigger',
      labelId: 'fsDateLabel',
      panelId: 'fsDatePanel',
      shortcutsId: 'fsDateShortcuts',
      calLeftId: 'fsDateCalLeft',
      calRightId: 'fsDateCalRight',
      onChange: function (start, end, shortcut) {
        if (dateApi) dateApi.setRange(start, end, shortcut, true);
      }
    });
    if (fsDate && dateApi && dateApi.getStart() && dateApi.getEnd()) {
      fsDate.setRange(dateApi.getStart(), dateApi.getEnd(), null, true);
    }

    ['campaign', 'advertiser'].forEach(function (key) {
      var input = $('fs_' + key);
      var wrap = $('fsWrap_' + key);
      if (!input || !wrap) return;
      function syncHas() { wrap.classList.toggle('has-value', !!input.value); }
      input.addEventListener('input', function () {
        setKeyword(key, input.value);
        syncHas();
      });
      input.addEventListener('click', function (e) { e.stopPropagation(); });
      var clearBtn = $('fsClear_' + key);
      if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          input.value = '';
          setKeyword(key, '');
          syncHas();
          input.focus();
        });
      }
    });

    UI.bindSingleSelect({
      wrapId: 'fsWrap_operation_status',
      triggerId: 'fsTrigger_operation_status',
      panelId: 'fsPanel_operation_status',
      labelId: 'fsLabel_operation_status',
      clearId: 'fsClear_operation_status',
      prefix: '开关：',
      getValue: function () { return draft.operation_status; },
      onChange: function (value) {
        draft.operation_status = value;
        syncBarFilters();
      }
    });

    UI.bindSingleSelect({
      wrapId: 'fsWrap_asset_type',
      triggerId: 'fsTrigger_asset_type',
      panelId: 'fsPanel_asset_type',
      labelId: 'fsLabel_asset_type',
      clearId: 'fsClear_asset_type',
      prefix: '资产类型：',
      getValue: function () { return draft.asset_type; },
      onChange: function (value) {
        draft.asset_type = value;
        pruneProducts();
        syncBarFilters();
        var panel = $('fsPanel_app_name');
        var dualNow = panel && !panel.classList.contains('multi-panel--simple');
        if (panel && dualNow !== productUsesDual()) openFilterSettings();
      }
    });

    function bindFsMulti(key, prefix, getOptions) {
      var dual = key === 'app_name' && productUsesDual();
      var api = UI.bindMultiSelect({
        wrapId: 'fsWrap_' + key,
        triggerId: 'fsTrigger_' + key,
        panelId: 'fsPanel_' + key,
        labelId: 'fsLabel_' + key,
        listId: 'fsList_' + key,
        selectedId: dual ? 'fsSelected_' + key : null,
        searchId: dual ? 'fsSearch_' + key : null,
        countId: dual ? 'fsCount_' + key : null,
        selectAllId: null,
        clearId: null,
        prefix: prefix,
        getOptions: getOptions,
        getSelected: function () { return draft[key]; },
        setSelected: function (arr) {
          draft[key] = arr;
          syncBarFilters();
        }
      });
      var clearIcon = document.querySelector('[data-fs-clear-icon="' + key + '"]');
      if (clearIcon) {
        clearIcon.addEventListener('click', function (e) {
          e.stopPropagation();
          draft[key] = [];
          if (api) api.render();
          syncBarFilters();
        });
      }
      var allBtn = document.querySelector('[data-fs-all="' + key + '"]');
      if (allBtn) {
        allBtn.addEventListener('click', function () {
          draft[key] = getOptions().slice();
          if (api) api.render();
          syncBarFilters();
        });
      }
      var clearBtn = document.querySelector('[data-fs-clear="' + key + '"]');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          draft[key] = [];
          if (api) api.render();
          syncBarFilters();
        });
      }
    }

    bindFsMulti('effective_status', '状态：', function () { return STATUSES; });
    bindFsMulti('app_name', '产品名称：', productOptions);
    bindFsMulti('optimizer_name', '优化师：', function () { return OPTIMIZERS; });
  }

  function openFilterSettings() {
    if (!filterSettingsSnapshot) {
      filterSettingsSnapshot = {
        draft: cloneDraft(draft),
        campaign: keywordValue('campaign'),
        advertiser: keywordValue('advertiser'),
        dateStart: dateApi && dateApi.getStart() ? new Date(dateApi.getStart().getTime()) : null,
        dateEnd: dateApi && dateApi.getEnd() ? new Date(dateApi.getEnd().getTime()) : null
      };
    }
    var grid = $('filterSettingGrid');
    var visibleDraft;
    if (grid && grid.querySelector('input[type="checkbox"]')) {
      visibleDraft = [];
      grid.querySelectorAll('.filter-setting-item > input[type="checkbox"]').forEach(function (input) {
        if (input.checked) visibleDraft.push(input.value);
      });
    } else {
      visibleDraft = visibleFilters.slice();
    }
    function itemHtml(item) {
      var checked = visibleDraft.indexOf(item.key) >= 0;
      return '<div class="filter-setting-item" data-fs-key="' + item.key + '">' +
        '<input type="checkbox" value="' + item.key + '"' + (checked ? ' checked' : '') + ' />' +
        filterSettingControlHtml(item) +
      '</div>';
    }
    var dateFilter = FILTER_DEFS.filter(function (item) { return item.key === 'date'; })[0];
    var others = FILTER_DEFS.filter(function (item) { return item.key !== 'date'; });
    var rowsHtml = '<div class="filter-setting-row filter-setting-row--date">' + itemHtml(dateFilter) + '</div>';
    var i;
    for (i = 0; i < others.length; i += 3) {
      rowsHtml += '<div class="filter-setting-row">' + others.slice(i, i + 3).map(itemHtml).join('') + '</div>';
    }
    grid.innerHTML = rowsHtml;
    bindFilterSettingsControls();
    UI.openModal('filterSettingModal');
  }

  function cancelFilterSettings() {
    var snap = filterSettingsSnapshot;
    filterSettingsSnapshot = null;
    if (snap) {
      draft = cloneDraft(snap.draft);
      setKeyword('campaign', snap.campaign);
      setKeyword('advertiser', snap.advertiser);
      if (dateApi && snap.dateStart && snap.dateEnd) dateApi.setRange(snap.dateStart, snap.dateEnd, null, true);
      syncBarFilters();
    }
    UI.closePanels();
    UI.closeModal('filterSettingModal');
  }

  function submitFilterSettings() {
    var selected = [];
    $('filterSettingGrid').querySelectorAll('.filter-setting-item > input[type="checkbox"]').forEach(function (input) {
      if (input.checked) selected.push(input.value);
    });
    visibleFilters = FILTER_DEFS.map(function (item) { return item.key; }).filter(function (key) {
      return selected.indexOf(key) >= 0;
    });
    filterSettingsSnapshot = null;
    syncOptionalVisibility();
    clearHiddenDraft();
    UI.closePanels();
    UI.closeModal('filterSettingModal');
    applyQuery();
  }

  function normalizeMetricDraft(draft) {
    var seen = {};
    var list = [];
    (draft || []).forEach(function (key) {
      if (!key || seen[key] || !COLUMN_MAP[key]) return;
      seen[key] = true;
      list.push(key);
    });
    COLUMNS.forEach(function (col) {
      if (col.defaultFrozen && !seen[col.key]) {
        list.unshift(col.key);
        seen[col.key] = true;
      }
    });
    var locked = [];
    var free = [];
    list.forEach(function (key) {
      if (isDefaultFrozenKey(key)) locked.push(key);
      else free.push(key);
    });
    return locked.concat(free);
  }

  function renderMetricModal() {
    var kw = ($('metricSearch').value || '').trim().toLowerCase();
    var grouped = {};
    GROUPS.forEach(function (group) { grouped[group] = []; });
    COLUMNS.forEach(function (col) {
      if (kw && col.name.toLowerCase().indexOf(kw) < 0 && col.key.toLowerCase().indexOf(kw) < 0) return;
      if (!grouped[col.group]) grouped[col.group] = [];
      grouped[col.group].push(col);
    });
    var visibleGroups = GROUPS.filter(function (group) { return (grouped[group] || []).length; });
    if (visibleGroups.indexOf(metricCat) < 0) metricCat = visibleGroups[0] || GROUPS[0];

    $('metricCats').innerHTML = visibleGroups.map(function (group) {
      return '<button class="metric-cat' + (group === metricCat ? ' is-active' : '') + '" type="button" data-group="' + escapeHtml(group) + '">' + escapeHtml(group) + '</button>';
    }).join('') || '<div class="transfer__empty">无匹配</div>';

    $('metricOptions').innerHTML = visibleGroups.map(function (group) {
      var cols = grouped[group] || [];
      var selectable = cols.filter(function (col) { return !isDefaultFrozenKey(col.key); });
      var checkedCount = cols.filter(function (col) { return columnDraft.indexOf(col.key) >= 0; }).length;
      var allOn = cols.length > 0 && checkedCount === cols.length;
      return '<section class="metric-group" id="metricGroup-' + escapeHtml(group) + '" data-group="' + escapeHtml(group) + '">' +
        '<div class="metric-group__head">' +
          '<input class="metric-check" type="checkbox" data-group-check="' + escapeHtml(group) + '"' + (allOn ? ' checked' : '') + (selectable.length ? '' : ' disabled') + ' aria-label="全选' + escapeHtml(group) + '" />' +
          '<span>' + escapeHtml(group) + '</span>' +
        '</div>' +
        '<div class="metric-group__grid">' + cols.map(function (col) {
          var on = columnDraft.indexOf(col.key) >= 0;
          var locked = isDefaultFrozenKey(col.key);
          return '<label class="metric-option' + (locked ? ' is-disabled' : '') + '">' +
            '<input class="metric-check" type="checkbox" value="' + col.key + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + ' />' +
            '<span class="metric-option__name" title="' + escapeHtml(col.name) + '">' + escapeHtml(col.name) + '</span>' +
          '</label>';
        }).join('') + '</div></section>';
    }).join('') || '<div class="transfer__empty">无匹配指标</div>';

    $('metricOptions').querySelectorAll('[data-group-check]').forEach(function (input) {
      var group = input.getAttribute('data-group-check');
      var cols = grouped[group] || [];
      var checkedCount = cols.filter(function (col) { return columnDraft.indexOf(col.key) >= 0; }).length;
      var allOn = cols.length > 0 && checkedCount === cols.length;
      input.indeterminate = checkedCount > 0 && !allOn;
    });

    var freezeAt = Math.min(Math.max(draftFrozenCount, 0), columnDraft.length);
    draftFrozenCount = Math.max(freezeAt, minFrozenCount(columnDraft));
    freezeAt = draftFrozenCount;
    var listHtml = '';
    if (!columnDraft.length) {
      listHtml = '<div class="transfer__empty">请添加指标</div>';
    } else {
      columnDraft.forEach(function (key, idx) {
        if (idx === freezeAt) {
          listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
        }
        var col = COLUMN_MAP[key];
        var forced = isDefaultFrozenKey(key);
        var frozen = idx < freezeAt;
        var icon = frozen
          ? '<svg class="metric-selected__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
          : '<svg class="metric-selected__drag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
        var remove = forced
          ? ''
          : '<button class="metric-selected__remove" type="button" data-remove-col="' + escapeHtml(key) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button>';
        listHtml += '<div class="metric-selected__item' + (frozen ? ' is-frozen' : '') + '" draggable="' + (forced ? 'false' : 'true') + '" data-metric="' + escapeHtml(key) + '" data-index="' + idx + '">' +
          icon +
          '<span class="metric-selected__name">' + escapeHtml(col.name) + '</span>' +
          remove +
        '</div>';
      });
      if (freezeAt >= columnDraft.length) {
        listHtml += '<div class="metric-freeze" data-freeze-line="1">拖到上方的列将冻结显示</div>';
      }
    }
    $('metricSelectedList').innerHTML = listHtml;
    $('metricSelectedCount').textContent = '已选 ' + columnDraft.length + ' 列';
  }

  function toggleMetricKey(key, checked) {
    if (isDefaultFrozenKey(key)) return;
    var idx = columnDraft.indexOf(key);
    if (checked && idx < 0) {
      columnDraft.push(key);
    } else if (!checked && idx >= 0) {
      columnDraft.splice(idx, 1);
      if (idx < draftFrozenCount) {
        draftFrozenCount = Math.max(minFrozenCount(columnDraft), draftFrozenCount - 1);
      }
    }
    draftFrozenCount = Math.max(draftFrozenCount, minFrozenCount(columnDraft));
  }

  function scrollToMetricGroup(group) {
    var el = document.getElementById('metricGroup-' + group);
    var scroller = $('metricOptions');
    if (!el || !scroller) return;
    metricAnchorLock = true;
    metricCat = group;
    Array.prototype.forEach.call($('metricCats').querySelectorAll('.metric-cat'), function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-group') === group);
    });
    scroller.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' });
    window.setTimeout(function () { metricAnchorLock = false; }, 400);
  }

  function syncMetricAnchorOnScroll() {
    if (metricAnchorLock) return;
    var scroller = $('metricOptions');
    if (!scroller) return;
    var groups = scroller.querySelectorAll('.metric-group');
    if (!groups.length) return;
    var top = scroller.scrollTop + 24;
    var active = groups[0].getAttribute('data-group');
    Array.prototype.forEach.call(groups, function (group) {
      if (group.offsetTop <= top) active = group.getAttribute('data-group');
    });
    if (active && active !== metricCat) {
      metricCat = active;
      Array.prototype.forEach.call($('metricCats').querySelectorAll('.metric-cat'), function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-group') === active);
      });
    }
  }

  var operationApi;
  var statusMulti;
  var assetApi;
  var optimizerMulti;
  var sortApi;

  dateApi = UI.bindDateRange({
    wrapId: 'dateRangeWrap',
    triggerId: 'dateRangeTrigger',
    labelId: 'dateRangeLabel',
    panelId: 'datePanel',
    shortcutsId: 'dateShortcuts',
    calLeftId: 'dateCalLeft',
    calRightId: 'dateCalRight',
    defaultShortcut: 'today'
  });

  campaignClear = UI.bindInputClearable({ wrapId: 'campaignKeywordWrap', inputId: 'campaignKeyword' });
  advertiserClear = UI.bindInputClearable({ wrapId: 'advertiserKeywordWrap', inputId: 'advertiserKeyword' });

  operationApi = UI.bindSingleSelect({
    wrapId: 'operationWrap',
    triggerId: 'operationTrigger',
    panelId: 'operationPanel',
    labelId: 'operationLabel',
    clearId: 'operationClear',
    prefix: '开关：',
    getValue: function () { return draft.operation_status; },
    onChange: function (value) { draft.operation_status = value; }
  });

  statusMulti = UI.bindMultiSelect({
    wrapId: 'statusWrap',
    triggerId: 'statusTrigger',
    panelId: 'statusPanel',
    labelId: 'statusLabel',
    listId: 'statusList',
    clearId: 'statusClear',
    prefix: '状态：',
    options: STATUSES,
    getSelected: function () { return draft.effective_status; },
    setSelected: function (arr) { draft.effective_status = arr; }
  });

  assetApi = UI.bindSingleSelect({
    wrapId: 'assetWrap',
    triggerId: 'assetTrigger',
    panelId: 'assetPanel',
    labelId: 'assetLabel',
    clearId: 'assetClear',
    prefix: '资产类型：',
    getValue: function () { return draft.asset_type; },
    onChange: function (value) {
      draft.asset_type = value;
      pruneProducts();
      productMulti.render();
    }
  });

  productMulti = UI.bindMultiSelect({
    wrapId: 'productWrap',
    triggerId: 'productTrigger',
    panelId: 'productPanel',
    labelId: 'productLabel',
    listId: 'productList',
    selectedId: 'productSelected',
    searchId: 'productSearch',
    countId: 'productCount',
    selectAllId: 'productSelectAll',
    clearId: 'productClear',
    prefix: '产品名称：',
    getOptions: productOptions,
    getSelected: function () { return draft.app_name; },
    setSelected: function (arr) { draft.app_name = arr; }
  });

  optimizerMulti = UI.bindMultiSelect({
    wrapId: 'optimizerWrap',
    triggerId: 'optimizerTrigger',
    panelId: 'optimizerPanel',
    labelId: 'optimizerLabel',
    listId: 'optimizerList',
    clearId: 'optimizerClear',
    prefix: '优化师：',
    options: OPTIMIZERS,
    getSelected: function () { return draft.optimizer_name; },
    setSelected: function (arr) { draft.optimizer_name = arr; }
  });

  sortApi = UI.bindThSort({
    root: '#campaignTable',
    getState: function () { return sortState; },
    setState: function (next) { sortState = next; },
    onChange: function () {
      page = 1;
      renderTable();
    }
  });

  UI.bindPagination({
    containerId: 'pagination',
    onPageChange: function (next) {
      page = next;
      renderTable();
    },
    onPageSizeChange: function (size) {
      pageSize = size;
      page = 1;
      renderTable();
    }
  });

  $('queryBtn').addEventListener('click', applyQuery);
  $('resetBtn').addEventListener('click', resetFilters);
  $('filterSettingBtn').addEventListener('click', openFilterSettings);
  $('filterSettingSubmit').addEventListener('click', submitFilterSettings);
  function stampUpdated() {
    var now = new Date();
    function pad2(n) { return n < 10 ? '0' + n : String(n); }
    $('dataUpdated').textContent = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()) + ' ' + pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
  }

  $('refreshBtn').addEventListener('click', function () {
    stampUpdated();
    renderTable();
    UI.showToast('已刷新');
  });
  $('fullscreenBtn').addEventListener('click', function () {
    var panel = $('dataPanel');
    var on = !panel.classList.contains('is-fullscreen');
    panel.classList.toggle('is-fullscreen', on);
    var label = on ? '退出全屏' : '全屏';
    $('fullscreenBtn').setAttribute('aria-label', label);
    $('fullscreenTip').setAttribute('data-tip', label);
    if (window.ColResize) ColResize.refresh($('campaignTable'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('dataPanel').classList.contains('is-fullscreen')) {
      $('fullscreenBtn').click();
    }
  });

  $('exportBtn').addEventListener('click', function () {
    var cols = visibleColumns();
    var scale = appliedScale;
    function cell(value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; }
    var lines = [cols.map(function (col) { return cell(col.name); }).join(',')];
    filteredRows().forEach(function (row) {
      lines.push(cols.map(function (col) { return cell(displayValue(row, col, scale)); }).join(','));
    });
    var now = new Date();
    function pad2(n) { return n < 10 ? '0' + n : String(n); }
    var stamp = now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate());
    UI.downloadText('TikTok推广_' + stamp + '.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
    UI.showToast('已导出当前列表');
  });

  $('metricsBtn').addEventListener('click', function () {
    columnDraft = normalizeMetricDraft(columns);
    draftFrozenCount = Math.max(minFrozenCount(columnDraft), Math.min(frozenCount, columnDraft.length));
    metricCat = GROUPS[0];
    $('metricSearch').value = '';
    renderMetricModal();
    UI.openModal('metricModal');
  });
  $('metricSearch').addEventListener('input', renderMetricModal);
  $('metricOptions').addEventListener('scroll', syncMetricAnchorOnScroll);
  $('metricClear').addEventListener('click', function () {
    columnDraft = columnDraft.filter(function (key) { return isDefaultFrozenKey(key); });
    draftFrozenCount = columnDraft.length;
    renderMetricModal();
  });
  $('metricSubmit').addEventListener('click', function () {
    if (!columnDraft.length) {
      UI.showToast('请至少选择 1 个指标', 'error');
      return;
    }
    columns = columnDraft.slice();
    frozenCount = draftFrozenCount;
    UI.closeModal('metricModal');
    renderTable();
    UI.showToast('自定义列已更新');
  });
  $('metricOptions').addEventListener('change', function (e) {
    var groupInput = e.target.closest('[data-group-check]');
    if (groupInput) {
      var group = groupInput.getAttribute('data-group-check');
      var checked = groupInput.checked;
      COLUMNS.forEach(function (col) {
        if (col.group !== group || isDefaultFrozenKey(col.key)) return;
        toggleMetricKey(col.key, checked);
      });
      renderMetricModal();
      return;
    }
    var input = e.target.closest('input.metric-check[type="checkbox"]');
    if (!input || input.disabled || input.hasAttribute('data-group-check')) return;
    toggleMetricKey(input.value, input.checked);
    renderMetricModal();
  });
  $('metricCats').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-group]');
    if (!btn) return;
    scrollToMetricGroup(btn.getAttribute('data-group'));
  });
  $('metricSelectedList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-col]');
    if (!btn) return;
    toggleMetricKey(btn.getAttribute('data-remove-col'), false);
    renderMetricModal();
  });

  var dragMetric = null;
  $('metricSelectedList').addEventListener('dragstart', function (e) {
    var item = e.target.closest('[data-metric]');
    if (!item || item.getAttribute('draggable') === 'false') {
      e.preventDefault();
      return;
    }
    dragMetric = item.getAttribute('data-metric');
    item.classList.add('is-dragging');
    try { e.dataTransfer.setData('text/plain', dragMetric); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* ignore */ }
  });
  $('metricSelectedList').addEventListener('dragend', function () {
    var item = $('metricSelectedList').querySelector('.is-dragging');
    if (item) item.classList.remove('is-dragging');
    Array.prototype.forEach.call($('metricSelectedList').querySelectorAll('.is-drag-over'), function (el) {
      el.classList.remove('is-drag-over');
    });
    dragMetric = null;
  });
  $('metricSelectedList').addEventListener('dragover', function (e) {
    e.preventDefault();
    if (!dragMetric) return;
    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    Array.prototype.forEach.call($('metricSelectedList').querySelectorAll('.is-drag-over'), function (el) {
      el.classList.remove('is-drag-over');
    });
    if (line) line.classList.add('is-drag-over');
    else if (item) item.classList.add('is-drag-over');
  });
  $('metricSelectedList').addEventListener('drop', function (e) {
    e.preventDefault();
    if (!dragMetric) return;
    var line = e.target.closest('[data-freeze-line]');
    var item = e.target.closest('[data-metric]');
    var from = columnDraft.indexOf(dragMetric);
    if (from < 0) return;

    if (line) {
      columnDraft.splice(from, 1);
      var insertAt = from < draftFrozenCount
        ? Math.max(0, draftFrozenCount - 1)
        : draftFrozenCount;
      insertAt = Math.max(0, Math.min(insertAt, columnDraft.length));
      columnDraft.splice(insertAt, 0, dragMetric);
      draftFrozenCount = Math.max(minFrozenCount(columnDraft), insertAt + 1);
    } else if (item) {
      var target = item.getAttribute('data-metric');
      if (target === dragMetric) return;
      var to = columnDraft.indexOf(target);
      if (to < 0) return;
      var wasFrozen = from < draftFrozenCount;
      var toFrozen = to < draftFrozenCount;
      if (isDefaultFrozenKey(dragMetric) && !toFrozen) return;
      columnDraft.splice(from, 1);
      columnDraft.splice(to, 0, dragMetric);
      if (!wasFrozen && toFrozen) {
        draftFrozenCount = Math.max(draftFrozenCount, minFrozenCount(columnDraft));
      } else if (wasFrozen && !toFrozen && !isDefaultFrozenKey(dragMetric)) {
        draftFrozenCount = Math.max(minFrozenCount(columnDraft), draftFrozenCount - 1);
      }
      draftFrozenCount = Math.max(minFrozenCount(columnDraft), Math.min(draftFrozenCount, columnDraft.length));
    }

    var forced = [];
    var rest = [];
    columnDraft.forEach(function (key) {
      if (isDefaultFrozenKey(key)) forced.push(key);
      else rest.push(key);
    });
    var userFrozen = rest.splice(0, Math.max(0, draftFrozenCount - forced.length));
    columnDraft = forced.concat(userFrozen, rest);
    draftFrozenCount = forced.length + userFrozen.length;
    renderMetricModal();
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-close]');
    if (!btn) return;
    var id = btn.getAttribute('data-close');
    if (id === 'filterSettingModal') {
      cancelFilterSettings();
      return;
    }
    UI.closeModal(id);
  });

  syncOptionalVisibility();
  stampUpdated();
  applyQuery();
})();
