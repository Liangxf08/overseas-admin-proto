/* 表格列宽拖拽：主表 / 弹窗子表通用 */
(function (global) {
  'use strict';

  var SELECTOR = 'table.data-table, table.param-table, table.plugin-table, table.import-table, table.tree-table';
  var DEFAULT_MIN = 72;

  function enable(table, options) {
    options = options || {};
    if (!table || table.getAttribute('data-col-resize') === '1') return;
    var minWidth = options.minWidth || DEFAULT_MIN;
    var includeLast = !!options.includeLast;

    if (table.clientWidth < 1) return;

    table.setAttribute('data-col-resize', '1');
    table.classList.add('is-col-resizable');

    var ths = table.querySelectorAll('thead th');
    if (!ths.length) return;

    var colgroup = table.querySelector('colgroup');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < ths.length) {
      colgroup.appendChild(document.createElement('col'));
    }
    while (colgroup.children.length > ths.length) {
      colgroup.removeChild(colgroup.lastChild);
    }

    Array.prototype.forEach.call(ths, function (th, i) {
      var w = Math.round(th.getBoundingClientRect().width);
      colgroup.children[i].style.width = Math.max(minWidth, w) + 'px';
    });

    var available = Math.floor(table.clientWidth);
    var sum = 0;
    Array.prototype.forEach.call(colgroup.children, function (col) {
      sum += parseFloat(col.style.width) || 0;
    });
    if (available > 0 && sum !== available) {
      var last = colgroup.children[colgroup.children.length - 1];
      var lastW = parseFloat(last.style.width) || minWidth;
      last.style.width = Math.max(minWidth, lastW + (available - sum)) + 'px';
    }
    syncTableWidth(table);

    Array.prototype.forEach.call(ths, function (th, i) {
      if (!includeLast && i === ths.length - 1) return;
      if (th.querySelector('.col-resize-handle')) return;
      th.classList.add('is-resizable');
      var handle = document.createElement('span');
      handle.className = 'col-resize-handle';
      handle.setAttribute('aria-hidden', 'true');
      th.appendChild(handle);
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        startResize(table, i, e.clientX, handle, minWidth);
      });
    });
  }

  function syncTableWidth(table) {
    var colgroup = table.querySelector('colgroup');
    if (!colgroup) return;
    var sum = 0;
    Array.prototype.forEach.call(colgroup.children, function (col) {
      sum += parseFloat(col.style.width) || 0;
    });
    if (sum > 0) {
      table.style.width = '100%';
      table.style.minWidth = sum + 'px';
    }
  }

  function startResize(table, index, startX, handle, minWidth) {
    var colgroup = table.querySelector('colgroup');
    var col = colgroup && colgroup.children[index];
    if (!col) return;
    var startW = parseFloat(col.style.width) || minWidth;
    handle.classList.add('is-active');
    document.body.classList.add('is-col-resizing');

    function onMove(e) {
      var next = Math.max(minWidth, Math.round(startW + (e.clientX - startX)));
      col.style.width = next + 'px';
      syncTableWidth(table);
    }
    function onUp() {
      handle.classList.remove('is-active');
      document.body.classList.remove('is-col-resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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
    initAll: initAll,
    selector: SELECTOR
  };
})(window);
