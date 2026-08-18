/* 下载任务共享存储：看板报表 / 素材打包 */
(function (global) {
  'use strict';

  var KEY = 'overseas-admin-download-tasks-v4';
  var USERS = Array.from({ length: 6 }, function (_, i) {
    return '用户' + String.fromCharCode(65 + i);
  });
  var CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateYMD(d) {
    if (!d) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function formatDateTime(d) {
    if (!d) return '';
    return formatDateYMD(d) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function nameStamp(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '_' +
      pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
  }

  function randomCode() {
    var out = '';
    var i;
    for (i = 0; i < 6; i++) out += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    return out;
  }

  function buildTaskName(prefix, d, code) {
    return String(prefix || '') + '_' + nameStamp(d || new Date()) + '_' + (code || randomCode());
  }

  function formatSize(n) {
    var bytes = Number(n);
    if (!isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return Math.round(bytes) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function minutesAgo(m) {
    return new Date(Date.now() - m * 60 * 1000);
  }

  function hoursAgo(h) {
    return new Date(Date.now() - h * 3600 * 1000);
  }

  function makeRow(partial, seq) {
    var created = partial.created instanceof Date ? partial.created : new Date();
    var updated = partial.updated instanceof Date ? partial.updated : created;
    var status = partial.status || '进行中';
    var name = partial.name || '';
    var isPack = (partial.type || '') === '素材打包';
    return {
      id: String(partial.id || seq),
      type: partial.type || '报表下载',
      source: partial.source || '看板',
      name: name,
      fileName: partial.fileName || (name ? name + (isPack ? '.zip' : '.csv') : ''),
      fileSize: partial.fileSize || 0,
      count: partial.count || 0,
      status: status,
      progress: partial.progress != null ? partial.progress : (status === '已完成' ? 100 : 0),
      failReason: partial.failReason || '',
      autoProgress: !!partial.autoProgress,
      creator: partial.creator || '用户A',
      createdAt: formatDateTime(created),
      createdDate: formatDateYMD(created),
      updatedAt: formatDateTime(updated)
    };
  }

  function buildSeed() {
    var seq = 1001;
    var items = [
      { type: '素材打包', source: '本地素材', prefix: '素材下载', code: 'k2M9aB', status: '待开始', creator: '用户A', created: minutesAgo(3), count: 12, fileSize: 186 * 1024 * 1024 },
      { type: '报表下载', source: '看板', prefix: '投放看板', code: 'xY8p1Q', status: '进行中', progress: 46, creator: '用户A', created: minutesAgo(8), updated: minutesAgo(1), fileSize: 428 * 1024 },
      { type: '素材打包', source: '模板中心', prefix: '素材下载', code: 'n4T7cD', status: '已完成', creator: '用户B', created: minutesAgo(22), updated: minutesAgo(18), count: 8, fileSize: 64 * 1024 * 1024 },
      { type: '报表下载', source: '看板', prefix: '素材效果', code: 'q9H2eF', status: '已失败', failReason: '导出失败', creator: '用户C', created: minutesAgo(48), updated: minutesAgo(40), fileSize: 1.2 * 1024 * 1024 },
      { type: '素材打包', source: '本地素材', prefix: '素材下载', code: 'r6W3gH', status: '已取消', creator: '用户A', created: minutesAgo(90), updated: minutesAgo(85), count: 6, fileSize: 48 * 1024 * 1024 },
      { type: '报表下载', source: '看板', prefix: '收入分析', code: 's1L5jK', status: '已完成', creator: '用户D', created: hoursAgo(6), updated: hoursAgo(5.9), fileSize: 256 * 1024 },
      { type: '素材打包', source: '模板中心', prefix: '素材下载', code: 't8P4mN', status: '已完成', creator: '用户E', created: hoursAgo(18), updated: hoursAgo(17.8), count: 20, fileSize: 96 * 1024 * 1024 },
      { type: '报表下载', source: '看板', prefix: '投放看板', code: 'u3C7pQ', status: '已完成', creator: '用户F', created: hoursAgo(30), updated: hoursAgo(29.9), fileSize: 512 * 1024 }
    ];
    var rows = items.map(function (item) {
      var created = item.created;
      item.name = buildTaskName(item.prefix, created, item.code);
      var row = makeRow(item, seq);
      seq += 1;
      return row;
    });
    return { seq: seq, rows: rows };
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.rows)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function persist(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) { /* ignore quota */ }
  }

  function load() {
    var data = readRaw();
    if (!data) {
      data = buildSeed();
      persist(data);
    }
    if (!data.seq) {
      var maxId = 1000;
      data.rows.forEach(function (row) {
        var n = Number(row.id);
        if (n > maxId) maxId = n;
      });
      data.seq = maxId + 1;
    }
    return data;
  }

  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      if (a.createdAt === b.createdAt) return Number(b.id) - Number(a.id);
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  }

  function list() {
    return sortRows(load().rows);
  }

  function add(payload) {
    var data = load();
    var id = String(data.seq++);
    var row = makeRow(payload || {}, id);
    row.id = id;
    data.rows.unshift(row);
    persist(data);
    return row;
  }

  function update(id, patch) {
    var data = load();
    var found = null;
    data.rows.forEach(function (row) {
      if (row.id !== String(id)) return;
      Object.keys(patch || {}).forEach(function (key) {
        row[key] = patch[key];
      });
      row.updatedAt = formatDateTime(new Date());
      found = row;
    });
    if (found) persist(data);
    return found;
  }

  function find(id) {
    return load().rows.find(function (row) { return row.id === String(id); }) || null;
  }

  function createPack(opts) {
    opts = opts || {};
    var created = new Date();
    var source = opts.source || '本地素材';
    var count = Number(opts.count) || 0;
    var avgMb = source === '模板中心' ? 3.8 : 8.6;
    var name = buildTaskName('素材下载', created);
    return add({
      type: '素材打包',
      source: source,
      name: name,
      fileName: name + '.zip',
      fileSize: Math.max(1, count) * avgMb * 1024 * 1024,
      count: count,
      status: '进行中',
      progress: 0,
      autoProgress: true,
      creator: opts.creator || '用户A',
      created: created
    });
  }

  function createReport(opts) {
    opts = opts || {};
    var created = new Date();
    var reportName = String(opts.reportName || opts.name || '看板').replace(/导出$/, '');
    var name = buildTaskName(reportName, created);
    var status = opts.status || '已完成';
    return add({
      type: '报表下载',
      source: opts.source || '看板',
      name: name,
      fileName: name + '.csv',
      fileSize: opts.fileSize || 0,
      status: status,
      progress: status === '已完成' ? 100 : 0,
      autoProgress: status === '进行中',
      creator: opts.creator || '用户A',
      created: created
    });
  }

  global.DownloadTaskStore = {
    KEY: KEY,
    USERS: USERS,
    list: list,
    add: add,
    update: update,
    find: find,
    createPack: createPack,
    createReport: createReport,
    buildTaskName: buildTaskName,
    formatSize: formatSize,
    formatDateYMD: formatDateYMD,
    formatDateTime: formatDateTime
  };
})(window);
