/* 产品板块共用交互工具 */
(function (global) {
  'use strict';

  var msgTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(text, type) {
    var el = $('pageMsg');
    if (!el) return;
    type = type || 'success';
    var icon = type === 'error'
      ? '<svg class="page-msg__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
      : '<svg class="page-msg__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>';
    el.className = 'page-msg page-msg--' + type + ' is-show';
    el.innerHTML = icon + '<span>' + escapeHtml(text) + '</span>';
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function copyText(text) {
    var value = String(text || '');
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast('复制成功', 'success');
      }).catch(function () {
        fallbackCopy(value);
      });
    } else {
      fallbackCopy(value);
    }
  }

  function fallbackCopy(value) {
    var ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('复制成功', 'success');
    } catch (e) {
      showToast('复制失败', 'error');
    }
    document.body.removeChild(ta);
  }

  function closePanels() {
    document.querySelectorAll('.single-panel.is-open, .multi-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open');
      p.classList.remove('is-dropup');
    });
    document.querySelectorAll('.select-trigger.is-open').forEach(function (t) {
      t.classList.remove('is-open');
    });
  }

  function openModal(id) {
    var mask = $(id);
    if (!mask) return;
    mask.classList.add('is-open');
    mask.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () {
      if (global.ColResize) global.ColResize.initAll(mask);
    });
  }

  function closeModal(id) {
    var mask = $(id);
    if (!mask) return;
    mask.classList.remove('is-open');
    mask.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-mask.is-open, .drawer-mask.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function openDrawer(maskId, drawerId) {
    var mask = $(maskId);
    var drawer = $(drawerId);
    if (mask) {
      mask.classList.add('is-open');
      mask.setAttribute('aria-hidden', 'false');
    }
    if (drawer) drawer.classList.add('is-open');
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () {
      var root = drawer || mask;
      if (global.ColResize && root) global.ColResize.initAll(root);
    });
  }

  function closeDrawer(maskId, drawerId) {
    var mask = $(maskId);
    var drawer = $(drawerId);
    if (mask) {
      mask.classList.remove('is-open');
      mask.setAttribute('aria-hidden', 'true');
    }
    if (drawer) drawer.classList.remove('is-open');
    if (!document.querySelector('.modal-mask.is-open, .drawer-mask.is-open')) {
      document.body.classList.remove('modal-open');
    }
  }

  function bindSidebar() {
    var toggle = $('sidebarToggle');
    var sidebar = $('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('is-collapsed');
      });
    }
    document.querySelectorAll('[data-group-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('[data-group]').classList.toggle('is-collapsed');
      });
    });
  }

  function bindSingleSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    if (!wrap || !trigger || !panel) return;

    function syncLabel(value) {
      var prefix = cfg.prefix || '';
      if (!value) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else {
        label.innerHTML = prefix + escapeHtml(cfg.formatValue ? cfg.formatValue(value) : value);
        wrap.classList.add('has-value');
      }
      panel.querySelectorAll('.single-option').forEach(function (opt) {
        opt.classList.toggle('is-active', (opt.getAttribute('data-value') || '') === String(value || ''));
      });
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (trigger.disabled || trigger.classList.contains('is-disabled')) return;
      var open = !panel.classList.contains('is-open');
      closePanels();
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
      }
    });

    panel.addEventListener('click', function (e) {
      e.stopPropagation();
      var opt = e.target.closest('.single-option');
      if (!opt) return;
      var value = opt.getAttribute('data-value') || '';
      if (cfg.onChange) cfg.onChange(value);
      syncLabel(value);
      closePanels();
    });

    if (cfg.clearId) {
      var clearBtn = $(cfg.clearId);
      if (clearBtn) {
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (cfg.onChange) cfg.onChange('');
          syncLabel('');
          closePanels();
        });
      }
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    syncLabel(cfg.getValue ? cfg.getValue() : '');
    return { syncLabel: syncLabel };
  }

  function bindMultiSelect(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var panel = $(cfg.panelId);
    var label = $(cfg.labelId);
    var list = $(cfg.listId);
    var selectedEl = $(cfg.selectedId);
    var search = $(cfg.searchId);
    var countEl = cfg.countId ? $(cfg.countId) : null;
    if (!wrap || !trigger || !panel) return;

    function getSelected() {
      return cfg.getSelected ? cfg.getSelected() : [];
    }

    function setSelected(arr) {
      if (cfg.setSelected) cfg.setSelected(arr);
    }

    function syncLabel() {
      var selected = getSelected();
      var prefix = cfg.prefix || '';
      if (!selected.length) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else if (selected.length === 1) {
        label.innerHTML = prefix + escapeHtml(selected[0]);
        wrap.classList.add('has-value');
      } else {
        label.innerHTML = prefix + '已选 ' + selected.length + ' 项';
        wrap.classList.add('has-value');
      }
      if (countEl) countEl.textContent = '已选择 ' + selected.length + ' 项';
    }

    function render() {
      var kw = ((search && search.value) || '').trim().toLowerCase();
      var options = cfg.getOptions ? cfg.getOptions() : [];
      var selected = getSelected();
      var visible = options.filter(function (name) {
        return !kw || String(name).toLowerCase().indexOf(kw) !== -1;
      });
      if (!visible.length) {
        list.innerHTML = '<div class="multi-panel__empty">暂无数据</div>';
      } else {
        list.innerHTML = visible.map(function (name) {
          var checked = selected.indexOf(name) !== -1 ? ' checked' : '';
          return '<label class="multi-option"><input type="checkbox" value="' + escapeHtml(name) + '"' + checked + '/><span>' + escapeHtml(name) + '</span></label>';
        }).join('');
      }
      if (!selected.length) {
        selectedEl.innerHTML = '<div class="multi-panel__empty">暂无已选</div>';
      } else {
        selectedEl.innerHTML = selected.map(function (name) {
          return '<div class="multi-selected"><span class="multi-selected__name">' + escapeHtml(name) + '</span><button class="multi-selected__remove" type="button" data-remove="' + escapeHtml(name) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button></div>';
        }).join('');
      }
      syncLabel();
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !panel.classList.contains('is-open');
      closePanels();
      if (open) {
        panel.classList.add('is-open');
        trigger.classList.add('is-open');
        render();
      }
    });

    if (search) {
      search.addEventListener('input', render);
    }

    list.addEventListener('change', function (e) {
      var input = e.target.closest('input[type="checkbox"]');
      if (!input) return;
      var name = input.value;
      var selected = getSelected().slice();
      if (input.checked) {
        if (selected.indexOf(name) === -1) selected.push(name);
      } else {
        selected = selected.filter(function (n) { return n !== name; });
      }
      setSelected(selected);
      render();
    });

    selectedEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      var name = btn.getAttribute('data-remove');
      setSelected(getSelected().filter(function (n) { return n !== name; }));
      render();
    });

    if (cfg.selectAllId) {
      $(cfg.selectAllId).addEventListener('click', function () {
        var kw = ((search && search.value) || '').trim().toLowerCase();
        var options = cfg.getOptions ? cfg.getOptions() : [];
        var visible = options.filter(function (name) {
          return !kw || String(name).toLowerCase().indexOf(kw) !== -1;
        });
        var selected = getSelected().slice();
        visible.forEach(function (name) {
          if (selected.indexOf(name) === -1) selected.push(name);
        });
        setSelected(selected);
        render();
      });
    }

    if (cfg.clearId) {
      $(cfg.clearId).addEventListener('click', function () {
        setSelected([]);
        render();
      });
    }

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    render();
    return { render: render, syncLabel: syncLabel };
  }

  function bindSeg(segId, onChange) {
    var seg = $(segId);
    if (!seg) return;
    seg.addEventListener('click', function (e) {
      if (seg.classList.contains('is-readonly')) return;
      var item = e.target.closest('.seg__item');
      if (!item) return;
      seg.querySelectorAll('.seg__item').forEach(function (el) {
        el.classList.toggle('is-active', el === item);
      });
      if (onChange) onChange(item.getAttribute('data-value') || '');
    });
  }

  function getSegValue(segId) {
    var active = document.querySelector('#' + segId + ' .seg__item.is-active');
    return active ? (active.getAttribute('data-value') || '') : '';
  }

  function setSegValue(segId, value) {
    document.querySelectorAll('#' + segId + ' .seg__item').forEach(function (el) {
      el.classList.toggle('is-active', (el.getAttribute('data-value') || '') === String(value));
    });
  }

  function renderPagination(cfg) {
    var el = $(cfg.containerId);
    if (!el) return;
    var total = cfg.total || 0;
    var page = cfg.page || 1;
    var pageSize = cfg.pageSize || 20;
    var totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) page = totalPages;

    var pages = [];
    var i;
    for (i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i);
      else if (pages[pages.length - 1] !== '…') pages.push('…');
    }

    var pageBtns = pages.map(function (p) {
      if (p === '…') return '<span style="padding:0 4px;color:var(--color-text-3)">…</span>';
      return '<button class="pager__btn' + (p === page ? ' is-active' : '') + '" type="button" data-page="' + p + '">' + p + '</button>';
    }).join('');

    el.innerHTML =
      '<span class="pagination__total">共 ' + total + ' 条</span>' +
      '<div class="page-size-wrap" id="pageSizeWrap">' +
        '<button class="select-trigger" type="button" id="pageSizeTrigger">' +
          '<span class="select-trigger__text">' + pageSize + ' 条/页</span>' +
          '<svg class="select-trigger__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>' +
        '</button>' +
        '<div class="single-panel" id="pageSizePanel">' +
          [10, 20, 50, 100].map(function (n) {
            return '<div class="single-option' + (n === pageSize ? ' is-active' : '') + '" data-size="' + n + '">' + n + ' 条/页</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="pager">' +
        '<button class="pager__btn" type="button" data-page="1" ' + (page <= 1 ? 'disabled' : '') + ' title="首页">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2L5 6l4 4M3 2v8"/></svg>' +
        '</button>' +
        '<button class="pager__btn" type="button" data-page="prev" ' + (page <= 1 ? 'disabled' : '') + '>' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2L4 6l4 4"/></svg>' +
        '</button>' +
        pageBtns +
        '<button class="pager__btn" type="button" data-page="next" ' + (page >= totalPages ? 'disabled' : '') + '>' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2l4 4-4 4"/></svg>' +
        '</button>' +
        '<button class="pager__btn" type="button" data-page="' + totalPages + '" ' + (page >= totalPages ? 'disabled' : '') + ' title="尾页">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2l4 4-4 4M9 2v8"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="page-jump">前往 <input id="pageJumpInput" type="text" value="' + page + '" /> 页</div>';
  }

  function bindPagination(cfg) {
    var el = $(cfg.containerId);
    if (!el) return;
    el.addEventListener('click', function (e) {
      var sizeOpt = e.target.closest('[data-size]');
      if (sizeOpt) {
        cfg.onPageSizeChange(Number(sizeOpt.getAttribute('data-size')) || 20);
        return;
      }
      var sizeTrigger = e.target.closest('#pageSizeTrigger');
      if (sizeTrigger) {
        e.stopPropagation();
        var panel = $('pageSizePanel');
        var open = !panel.classList.contains('is-open');
        closePanels();
        if (open) {
          var rect = sizeTrigger.getBoundingClientRect();
          if (window.innerHeight - rect.bottom < 180) panel.classList.add('is-dropup');
          panel.classList.add('is-open');
          sizeTrigger.classList.add('is-open');
        }
        return;
      }
      if (e.target.closest('#pageSizeWrap')) {
        e.stopPropagation();
        return;
      }
      var btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      var val = btn.getAttribute('data-page');
      var totalPages = Math.max(1, Math.ceil((cfg.getTotal() || 0) / cfg.getPageSize()) || 1);
      var page = cfg.getPage();
      if (val === 'prev') page = Math.max(1, page - 1);
      else if (val === 'next') page = Math.min(totalPages, page + 1);
      else page = Number(val) || 1;
      cfg.onPageChange(page);
    });

    el.addEventListener('keydown', function (e) {
      if (e.target.id !== 'pageJumpInput' || e.key !== 'Enter') return;
      var totalPages = Math.max(1, Math.ceil((cfg.getTotal() || 0) / cfg.getPageSize()) || 1);
      var n = parseInt(e.target.value, 10);
      if (!Number.isFinite(n)) n = 1;
      cfg.onPageChange(Math.min(totalPages, Math.max(1, n)));
    });
  }

  function statusTag(status) {
    var enabled = status === '启用';
    return '<span class="tag tag--' + (enabled ? 'enabled' : 'disabled') + '">' + escapeHtml(status) + '</span>';
  }

  function downloadText(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function enableColumnResize(table, options) {
    if (global.ColResize) global.ColResize.enable(table, options);
  }

  function initColumnResizeAll(root, options) {
    if (global.ColResize) global.ColResize.initAll(root, options);
  }

  document.addEventListener('click', closePanels);

  global.ProductUI = {
    $,
    escapeHtml: escapeHtml,
    showToast: showToast,
    copyText: copyText,
    closePanels: closePanels,
    openModal: openModal,
    closeModal: closeModal,
    openDrawer: openDrawer,
    enableColumnResize: enableColumnResize,
    initColumnResizeAll: initColumnResizeAll,
    closeDrawer: closeDrawer,
    bindSidebar: bindSidebar,
    bindSingleSelect: bindSingleSelect,
    bindMultiSelect: bindMultiSelect,
    bindSeg: bindSeg,
    getSegValue: getSegValue,
    setSegValue: setSegValue,
    renderPagination: renderPagination,
    bindPagination: bindPagination,
    statusTag: statusTag,
    downloadText: downloadText,
    uid: uid
  };
})(window);
