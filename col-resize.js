/* 表格列宽拖拽：主表 / 弹窗子表通用 */
(function (global) {
  'use strict';

  var SELECTOR = 'table.data-table, table.param-table, table.plugin-table, table.import-table, table.tree-table, table.config-table';
  var DEFAULT_MIN = 72;
  var CHECK_COL_WIDTH = 48;

  function isCheckCol(th) {
    return !!(th && th.classList && th.classList.contains('col-check'));
  }

  function colMinWidth(th, minWidth) {
    if (!isCheckCol(th)) return minWidth;
    /* 复选框首列统一 48（对齐用户反馈） */
    return CHECK_COL_WIDTH;
  }

  function syncColgroup(table, thCount) {
    var colgroup = table.querySelector('colgroup');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < thCount) {
      colgroup.appendChild(document.createElement('col'));
    }
    while (colgroup.children.length > thCount) {
      colgroup.removeChild(colgroup.lastChild);
    }
    return colgroup;
  }

  function getAvailableWidth(table) {
    var parent = table.parentElement;
    if (parent && parent.clientWidth > 0) return Math.floor(parent.clientWidth);
    return Math.floor(table.clientWidth);
  }

  function getPreferredWidth(col, fallback) {
    var raw = parseFloat(col.getAttribute('data-col-width'));
    if (isFinite(raw) && raw > 0) return raw;
    var styleW = parseFloat(col.style.width);
    if (isFinite(styleW) && styleW > 0) return styleW;
    return fallback || DEFAULT_MIN;
  }

  function setPreferredWidth(col, width) {
    col.setAttribute('data-col-width', String(Math.round(width)));
  }

  /**
   * 用「偏好宽度」布局：
   * - 合计 < 容器：按比例拉满可变列（复选框首列固定 48，不参与拉伸）
   * - 合计 >= 容器：保持 px，表格 minWidth = 合计
   */
  function syncTableWidth(table, minWidth) {
    minWidth = minWidth || DEFAULT_MIN;
    var colgroup = table.querySelector('colgroup');
    if (!colgroup || !colgroup.children.length) return;

    var cols = Array.prototype.slice.call(colgroup.children);
    var ths = table.querySelectorAll('thead th');
    var prefs = cols.map(function (col) {
      var w = getPreferredWidth(col, minWidth);
      setPreferredWidth(col, w);
      return w;
    });
    var fixed = cols.map(function (col, i) {
      return col.classList.contains('col-check') || isCheckCol(ths[i]);
    });

    /* 复选列强制固定偏好宽 */
    prefs.forEach(function (w, i) {
      if (fixed[i]) {
        prefs[i] = CHECK_COL_WIDTH;
        setPreferredWidth(cols[i], CHECK_COL_WIDTH);
      }
    });

    var sum = prefs.reduce(function (a, b) { return a + b; }, 0);
    if (sum <= 0) return;

    var available = getAvailableWidth(table);
    var fixedSum = 0;
    var flexSum = 0;
    prefs.forEach(function (w, i) {
      if (fixed[i]) fixedSum += w;
      else flexSum += w;
    });

    if (available > 0 && sum < available && flexSum > 0) {
      var flexAvailable = Math.max(0, available - fixedSum);
      var allocated = 0;
      var flexLast = -1;
      var i;
      for (i = 0; i < cols.length; i++) {
        if (!fixed[i]) flexLast = i;
      }
      cols.forEach(function (col, idx) {
        var w;
        if (fixed[idx]) {
          w = CHECK_COL_WIDTH;
        } else if (idx === flexLast) {
          w = Math.max(minWidth, available - allocated);
        } else {
          w = Math.max(minWidth, Math.floor((prefs[idx] / flexSum) * flexAvailable));
        }
        allocated += w;
        col.style.width = w + 'px';
        if (fixed[idx]) {
          col.style.minWidth = CHECK_COL_WIDTH + 'px';
          col.style.maxWidth = CHECK_COL_WIDTH + 'px';
        } else {
          col.style.minWidth = '';
          col.style.maxWidth = '';
        }
      });
      table.style.width = '100%';
      table.style.minWidth = '100%';
    } else {
      cols.forEach(function (col, idx) {
        col.style.width = prefs[idx] + 'px';
        if (fixed[idx]) {
          col.style.minWidth = CHECK_COL_WIDTH + 'px';
          col.style.maxWidth = CHECK_COL_WIDTH + 'px';
        } else {
          col.style.minWidth = '';
          col.style.maxWidth = '';
        }
      });
      table.style.width = '100%';
      table.style.minWidth = sum + 'px';
    }

    var opts = table._colResizeOpts || {};
    if (typeof opts.onLayout === 'function') {
      opts.onLayout(table);
    }
  }

  function startResize(table, index, startX, handle, minWidth) {
    var colgroup = table.querySelector('colgroup');
    var col = colgroup && colgroup.children[index];
    if (!col) return;

    var prefs = Array.prototype.map.call(colgroup.children, function (c) {
      return getPreferredWidth(c, minWidth);
    });
    var sum = prefs.reduce(function (a, b) { return a + b; }, 0);
    var available = getAvailableWidth(table);
    var scale = (available > 0 && sum > 0 && sum < available) ? (available / sum) : 1;
    var startPref = prefs[index];

    handle.classList.add('is-active');
    document.body.classList.add('is-col-resizing');

    function onMove(e) {
      var next = Math.max(minWidth, Math.round(startPref + (e.clientX - startX) / scale));
      setPreferredWidth(col, next);
      syncTableWidth(table, minWidth);
    }
    function onUp() {
      handle.classList.remove('is-active');
      document.body.classList.remove('is-col-resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      var opts = table._colResizeOpts || {};
      if (opts.onResize) {
        opts.onResize(index, getPreferredWidth(col, minWidth), table);
      }
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function bindResizeObserver(table) {
    if (table._colResizeRo || typeof ResizeObserver === 'undefined') return;
    var parent = table.parentElement;
    if (!parent) return;
    table._colResizeRo = new ResizeObserver(function () {
      var opts = table._colResizeOpts || {};
      syncTableWidth(table, opts.minWidth || DEFAULT_MIN);
    });
    table._colResizeRo.observe(parent);
  }

  function enable(table, options) {
    options = options || {};
    if (!table) return;
    if (table.clientWidth < 1 && !options.force) return;

    var minWidth = options.minWidth || DEFAULT_MIN;
    var includeLast = !!options.includeLast;
    var widths = options.widths || null;

    table.setAttribute('data-col-resize', '1');
    table.classList.add('is-col-resizable');
    table._colResizeOpts = options;

    var ths = table.querySelectorAll('thead th');
    if (!ths.length) return;

    var colgroup = syncColgroup(table, ths.length);

    Array.prototype.forEach.call(ths, function (th, i) {
      var col = colgroup.children[i];
      if (isCheckCol(th)) {
        setPreferredWidth(col, CHECK_COL_WIDTH);
        col.style.width = CHECK_COL_WIDTH + 'px';
        col.style.minWidth = CHECK_COL_WIDTH + 'px';
        col.style.maxWidth = CHECK_COL_WIDTH + 'px';
        col.classList.add('col-check');
        return;
      }
      if (widths && widths[i] != null) {
        setPreferredWidth(col, Math.max(colMinWidth(th, minWidth), Math.round(widths[i])));
      } else if (!col.getAttribute('data-col-width')) {
        var measured = Math.round(th.getBoundingClientRect().width);
        setPreferredWidth(col, Math.max(minWidth, measured || minWidth));
      }
    });

    syncTableWidth(table, minWidth);
    bindResizeObserver(table);

    Array.prototype.forEach.call(ths, function (th, i) {
      if (!includeLast && i === ths.length - 1) return;
      if (isCheckCol(th)) return;
      th.classList.add('is-resizable');
      var handle = th.querySelector('.col-resize-handle');
      if (handle) return;
      handle = document.createElement('span');
      handle.className = 'col-resize-handle';
      handle.setAttribute('aria-hidden', 'true');
      th.appendChild(handle);
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        startResize(table, i, e.clientX, handle, colMinWidth(th, minWidth));
      });
    });
  }

  function refresh(table, options) {
    if (!table) return;
    table.querySelectorAll('.col-resize-handle').forEach(function (el) {
      el.remove();
    });
    table.querySelectorAll('thead th.is-resizable').forEach(function (th) {
      th.classList.remove('is-resizable');
    });
    table.removeAttribute('data-col-resize');
    enable(table, options || table._colResizeOpts || {});
  }

  function initAll(root, options) {
    root = root || document;
    root.querySelectorAll(SELECTOR).forEach(function (table) {
      enable(table, options);
    });
  }

  function boot() {
    initAll(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.ColResize = {
    enable: enable,
    refresh: refresh,
    initAll: initAll,
    syncTableWidth: syncTableWidth,
    selector: SELECTOR
  };
})(window);
