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
    document.querySelectorAll('.single-panel.is-open, .multi-panel.is-open, .date-panel.is-open, .compare-panel.is-open, .batch-menu.is-open').forEach(function (p) {
      p.classList.remove('is-open');
      p.classList.remove('is-dropup');
      p.classList.remove('is-align-right');
    });
    document.querySelectorAll('.select-trigger.is-open, .date-range-trigger.is-open, .btn--dropdown.is-open').forEach(function (t) {
      t.classList.remove('is-open');
    });
  }

  /** 下拉超出视口时：右侧溢出则右对齐，下方空间不足则向上展开 */
  function adjustDropdownPlacement(panel, anchor) {
    if (!panel) return;
    panel.classList.remove('is-align-right', 'is-dropup');
    var anchorEl = anchor || panel.parentElement;
    if (!anchorEl) return;
    var aRect = anchorEl.getBoundingClientRect();
    var pRect = panel.getBoundingClientRect();
    var pad = 8;
    if (pRect.right > window.innerWidth - pad) {
      panel.classList.add('is-align-right');
    }
    var spaceBelow = window.innerHeight - aRect.bottom - pad;
    var spaceAbove = aRect.top - pad;
    if (pRect.height > spaceBelow && spaceAbove > spaceBelow) {
      panel.classList.add('is-dropup');
    }
  }

  function bindBatchMenu(cfg) {
    var wrap = $(cfg.wrapId);
    var btn = $(cfg.btnId);
    var menu = $(cfg.menuId);
    if (!wrap || !btn || !menu) return null;

    function close() {
      menu.classList.remove('is-open');
      btn.classList.remove('is-open');
    }

    function open() {
      if (btn.disabled) return;
      closePanels();
      menu.classList.add('is-open');
      btn.classList.add('is-open');
    }

    function toggle() {
      if (menu.classList.contains('is-open')) close();
      else open();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = e.target.closest('[data-batch]');
      if (!item) return;
      var action = item.getAttribute('data-batch') || '';
      close();
      if (cfg.onAction) cfg.onAction(action, item);
    });

    wrap.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    return {
      close: close,
      open: open,
      toggle: toggle,
      setDisabled: function (disabled) {
        btn.disabled = !!disabled;
        if (disabled) close();
      }
    };
  }

  function fitDropdownPanel(panel, anchor) {
    adjustDropdownPlacement(panel, anchor);
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
    var drawer = drawerId ? $(drawerId) : (mask && mask.querySelector('.drawer'));
    if (mask) {
      mask.classList.add('is-open');
      mask.setAttribute('aria-hidden', 'false');
    }
    if (drawer) drawer.classList.add('is-open');
    document.body.classList.add('modal-open', 'drawer-open');
    requestAnimationFrame(function () {
      var root = drawer || mask;
      if (global.ColResize && root) global.ColResize.initAll(root);
    });
  }

  function closeDrawer(maskId, drawerId) {
    var mask = $(maskId);
    var drawer = drawerId ? $(drawerId) : (mask && mask.querySelector('.drawer'));
    if (mask) {
      mask.classList.remove('is-open');
      mask.setAttribute('aria-hidden', 'true');
    }
    if (drawer) drawer.classList.remove('is-open');
    if (!document.querySelector('.modal-mask.is-open, .drawer-mask.is-open')) {
      document.body.classList.remove('modal-open', 'drawer-open');
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

    function getOptions() {
      if (cfg.getOptions) return cfg.getOptions() || [];
      return cfg.options || [];
    }

    function optionLabel(value) {
      return cfg.getLabel ? cfg.getLabel(value) : value;
    }

    function optionIcon(value) {
      return cfg.getIconHtml ? cfg.getIconHtml(value) : '';
    }

    function optionContentHtml(value) {
      var icon = optionIcon(value);
      var textLabel = optionLabel(value);
      var text = escapeHtml(textLabel);
      var title = ' title="' + escapeHtml(textLabel) + '"';
      if (!icon) return '<span' + title + '>' + text + '</span>';
      return icon + '<span' + title + '>' + text + '</span>';
    }

    function matchesKeyword(value, kw) {
      if (!kw) return true;
      return String(optionLabel(value)).toLowerCase().indexOf(kw) !== -1;
    }

    function syncLabel() {
      var selected = getSelected();
      var prefix = cfg.prefix || '';
      if (!selected.length) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        wrap.classList.remove('has-value');
      } else if (selected.length === 1 && !cfg.getIconHtml) {
        label.innerHTML = prefix + escapeHtml(optionLabel(selected[0]));
        wrap.classList.add('has-value');
      } else {
        label.innerHTML = prefix + '已选 ' + selected.length + ' 项';
        wrap.classList.add('has-value');
      }
      if (countEl) countEl.textContent = '已选择 ' + selected.length + ' 项';
    }

    function render() {
      var kw = ((search && search.value) || '').trim().toLowerCase();
      var options = getOptions();
      var selected = getSelected();
      var visible = options.filter(function (name) {
        return matchesKeyword(name, kw);
      });
      if (!list) return;
      if (!visible.length) {
        list.innerHTML = '<div class="multi-panel__empty">暂无数据</div>';
      } else {
        list.innerHTML = visible.map(function (name) {
          var checked = selected.indexOf(name) !== -1 ? ' checked' : '';
          return '<label class="multi-option"><input type="checkbox" value="' + escapeHtml(name) + '"' + checked + '/><span class="multi-option__label">' + optionContentHtml(name) + '</span></label>';
        }).join('');
      }
      if (selectedEl) {
        if (!selected.length) {
          selectedEl.innerHTML = '<div class="multi-panel__empty">暂无已选</div>';
        } else {
          selectedEl.innerHTML = selected.map(function (name) {
            return '<div class="multi-selected"><span class="multi-selected__name">' + optionContentHtml(name) + '</span><button class="multi-selected__remove" type="button" data-remove="' + escapeHtml(name) + '" aria-label="移除"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2L2 10"/></svg></button></div>';
          }).join('');
        }
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
        adjustDropdownPlacement(panel, trigger);
      }
    });

    if (search) {
      search.addEventListener('input', render);
    }

    if (list) {
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
    }

    if (selectedEl) {
      selectedEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-remove]');
        if (!btn) return;
        var name = btn.getAttribute('data-remove');
        setSelected(getSelected().filter(function (n) { return n !== name; }));
        render();
      });
    }

    if (cfg.selectAllId) {
      $(cfg.selectAllId).addEventListener('click', function () {
        var kw = ((search && search.value) || '').trim().toLowerCase();
        var options = getOptions();
        var visible = options.filter(function (name) {
          return matchesKeyword(name, kw);
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

  /* 表格内复制按钮图标（与 TikTok 账户页账户 ID 一致，全局统一） */
  var COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  function statusTag(status) {
    var enabled = status === '启用';
    return '<span class="tag tag--' + (enabled ? 'enabled' : 'disabled') + '">' + escapeHtml(status) + '</span>';
  }

  var TASK_STATUS_DOT = {
    '待处理': 'status-dot--pending',
    '处理中': 'status-dot--processing',
    '已处理': 'status-dot--done',
    '不处理': 'status-dot--ignored'
  };

  var TASK_STATUS_TAG = {
    '待处理': 'tag--pending',
    '处理中': 'tag--processing',
    '已处理': 'tag--done',
    '不处理': 'tag--ignored'
  };

  function taskStatusDot(status) {
    return '<span class="status-dot ' + (TASK_STATUS_DOT[status] || '') + '">' + escapeHtml(status) + '</span>';
  }

  function taskStatusTag(status) {
    return '<span class="tag ' + (TASK_STATUS_TAG[status] || '') + '">' + escapeHtml(status) + '</span>';
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateYMD(d) {
    if (!d) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function bindDateRange(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var label = $(cfg.labelId);
    var panel = $(cfg.panelId);
    var shortcutsEl = $(cfg.shortcutsId);
    var calLeft = $(cfg.calLeftId);
    var calRight = $(cfg.calRightId);
    if (!wrap || !trigger || !panel || !label) return null;

    var prefix = cfg.prefix != null ? cfg.prefix : '日期：';
    var rangeStart = null;
    var rangeEnd = null;
    var pickingStart = null;
    var activeShortcut = cfg.defaultShortcut || 'last7';
    var viewMonth = null;

    function startOfDay(d) {
      var x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    }

    function addDays(d, n) {
      var x = startOfDay(d);
      x.setDate(x.getDate() + n);
      return x;
    }

    function sameDay(a, b) {
      return !!(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
    }

    function dayKey(d) {
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }

    function parseDate(str) {
      if (!str) return null;
      var parts = String(str).split('-');
      if (parts.length !== 3) return null;
      return startOfDay(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    }

    function mondayOf(d) {
      var x = startOfDay(d);
      var day = x.getDay();
      var diff = day === 0 ? -6 : 1 - day;
      return addDays(x, diff);
    }

    function getShortcutRange(key) {
      var today = startOfDay(new Date());
      if (key === 'today') return [today, today];
      if (key === 'yesterday') {
        var y = addDays(today, -1);
        return [y, y];
      }
      if (key === 'last7') return [addDays(today, -6), today];
      if (key === 'last30') return [addDays(today, -29), today];
      if (key === 'thisWeek') return [mondayOf(today), today];
      if (key === 'lastWeek') {
        var thisMon = mondayOf(today);
        var lastMon = addDays(thisMon, -7);
        return [lastMon, addDays(lastMon, 6)];
      }
      if (key === 'thisMonth') {
        return [new Date(today.getFullYear(), today.getMonth(), 1), today];
      }
      if (key === 'lastMonth') {
        var first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        var last = new Date(today.getFullYear(), today.getMonth(), 0);
        return [first, last];
      }
      return [addDays(today, -6), today];
    }

    function matchShortcut(start, end) {
      var keys = ['today', 'yesterday', 'last7', 'last30', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'];
      var i;
      for (i = 0; i < keys.length; i++) {
        var r = getShortcutRange(keys[i]);
        if (sameDay(start, r[0]) && sameDay(end, r[1])) return keys[i];
      }
      return '';
    }

    function syncDateLabel() {
      if (!rangeStart) {
        label.innerHTML = prefix + '<span class="muted">请选择</span>';
        return;
      }
      if (!rangeEnd) {
        label.textContent = prefix + formatDateYMD(rangeStart) + ' - ...';
        return;
      }
      label.textContent = prefix + formatDateYMD(rangeStart) + ' - ' + formatDateYMD(rangeEnd);
    }

    function syncShortcutActive() {
      if (!shortcutsEl) return;
      shortcutsEl.querySelectorAll('.date-shortcut').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-shortcut') === activeShortcut);
      });
    }

    function renderOneCalendar(el, year, month, navLeft, navRight) {
      if (!el) return;
      var weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
      var first = new Date(year, month, 1);
      var startOffset = (first.getDay() + 6) % 7;
      var gridStart = addDays(first, -startOffset);
      var today = startOfDay(new Date());
      var selStart = rangeStart;
      var selEnd = rangeEnd;
      if (pickingStart && !rangeEnd) {
        selStart = pickingStart;
        selEnd = pickingStart;
      }

      var daysHtml = '';
      var i;
      for (i = 0; i < 42; i++) {
        var d = addDays(gridStart, i);
        var out = d.getMonth() !== month;
        var key = dayKey(d);
        var isStart = selStart && sameDay(d, selStart);
        var isEnd = selEnd && sameDay(d, selEnd);
        var inRange = selStart && selEnd && d >= selStart && d <= selEnd && !sameDay(selStart, selEnd);
        var cls = [
          'date-cal__day',
          out ? 'is-out' : '',
          sameDay(d, today) ? 'is-today' : '',
          isStart ? 'is-range-start' : '',
          isEnd ? 'is-range-end' : '',
          inRange || isStart || isEnd ? 'is-in-range' : ''
        ].filter(Boolean).join(' ');
        daysHtml += '<button class="' + cls + '" type="button" data-day="' + key + '"><span class="date-cal__day-num">' + d.getDate() + '</span></button>';
      }

      var leftNav = navLeft
        ? '<div class="date-cal__nav">' +
            '<button class="date-cal__btn" type="button" data-nav="prev-year" aria-label="上一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2L2 6l4 4M10 2L6 6l4 4"/></svg></button>' +
            '<button class="date-cal__btn" type="button" data-nav="prev-month" aria-label="上一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2L4 6l4 4"/></svg></button>' +
          '</div>'
        : '<div class="date-cal__nav" style="width:52px"></div>';
      var rightNav = navRight
        ? '<div class="date-cal__nav">' +
            '<button class="date-cal__btn" type="button" data-nav="next-month" aria-label="下一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 2l4 4-4 4"/></svg></button>' +
            '<button class="date-cal__btn" type="button" data-nav="next-year" aria-label="下一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l4 4-4 4M6 2l4 4-4 4"/></svg></button>' +
          '</div>'
        : '<div class="date-cal__nav" style="width:52px"></div>';

      el.innerHTML =
        '<div class="date-cal__header">' + leftNav +
          '<div class="date-cal__title">' + year + ' 年 ' + (month + 1) + ' 月</div>' + rightNav +
        '</div>' +
        '<div class="date-cal__week">' + weekLabels.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
        '<div class="date-cal__grid">' + daysHtml + '</div>';
    }

    function renderCalendars() {
      if (!viewMonth) viewMonth = new Date();
      var left = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
      var right = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      renderOneCalendar(calLeft, left.getFullYear(), left.getMonth(), true, false);
      renderOneCalendar(calRight, right.getFullYear(), right.getMonth(), false, true);
    }

    function notifyChange() {
      if (cfg.onChange) cfg.onChange(rangeStart, rangeEnd, activeShortcut);
    }

    function setRange(start, end, shortcut, silent) {
      rangeStart = startOfDay(start);
      rangeEnd = startOfDay(end);
      if (rangeStart > rangeEnd) {
        var t = rangeStart;
        rangeStart = rangeEnd;
        rangeEnd = t;
      }
      pickingStart = null;
      activeShortcut = shortcut == null ? matchShortcut(rangeStart, rangeEnd) : shortcut;
      viewMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() - 1, 1);
      syncDateLabel();
      syncShortcutActive();
      renderCalendars();
      if (!silent) notifyChange();
    }

    function closeDatePanel() {
      panel.classList.remove('is-open');
      trigger.classList.remove('is-open');
    }

    function openDatePanel() {
      closePanels();
      panel.classList.add('is-open');
      trigger.classList.add('is-open');
      renderCalendars();
      fitDropdownPanel(panel);
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.classList.contains('is-open')) closeDatePanel();
      else openDatePanel();
    });

    wrap.addEventListener('click', function (e) { e.stopPropagation(); });

    if (shortcutsEl) {
      shortcutsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-shortcut]');
        if (!btn) return;
        var key = btn.getAttribute('data-shortcut');
        var r = getShortcutRange(key);
        setRange(r[0], r[1], key);
        closeDatePanel();
      });
    }

    panel.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        var type = nav.getAttribute('data-nav');
        if (type === 'prev-month') viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
        if (type === 'next-month') viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
        if (type === 'prev-year') viewMonth = new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1);
        if (type === 'next-year') viewMonth = new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1);
        renderCalendars();
        return;
      }
      var dayBtn = e.target.closest('[data-day]');
      if (!dayBtn) return;
      var d = parseDate(dayBtn.getAttribute('data-day'));
      if (!d) return;
      if (!pickingStart) {
        pickingStart = startOfDay(d);
        rangeStart = pickingStart;
        rangeEnd = null;
        activeShortcut = '';
        syncShortcutActive();
        syncDateLabel();
        renderCalendars();
        return;
      }
      setRange(pickingStart, d, null);
      closeDatePanel();
    });

    if (cfg.defaultShortcut) {
      var init = getShortcutRange(cfg.defaultShortcut);
      setRange(init[0], init[1], cfg.defaultShortcut, true);
    } else {
      syncDateLabel();
    }

    return {
      getStart: function () { return rangeStart; },
      getEnd: function () { return rangeEnd; },
      setRange: setRange,
      open: openDatePanel,
      close: closeDatePanel
    };
  }

  function bindThSort(cfg) {
    var root = typeof cfg.root === 'string' ? document.querySelector(cfg.root) : cfg.root;
    if (!root) return null;

    function sync() {
      var state = cfg.getState ? cfg.getState() : {};
      root.querySelectorAll('.th-sort').forEach(function (btn) {
        var key = btn.getAttribute('data-key');
        var active = !!state.key && state.key === key;
        btn.classList.toggle('is-asc', active && state.dir === 'asc');
        btn.classList.toggle('is-desc', active && state.dir === 'desc');
      });
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.th-sort');
      if (!btn || !root.contains(btn)) return;
      var key = btn.getAttribute('data-key');
      var state = cfg.getState ? cfg.getState() : {};
      var next;
      if (state.key === key) {
        next = { key: key, dir: state.dir === 'desc' ? 'asc' : 'desc' };
      } else {
        next = { key: key, dir: cfg.defaultDir || 'desc' };
      }
      if (cfg.setState) cfg.setState(next);
      if (cfg.onChange) cfg.onChange(next);
      sync();
    });

    sync();
    return { sync: sync };
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

  /** 表单输入框清除按钮 */
  function bindInputClearable(cfg) {
    var wrap = typeof cfg === 'string' ? $(cfg) : (cfg.wrapId ? $(cfg.wrapId) : cfg.wrap);
    if (!wrap) return null;
    var input = wrap.querySelector('input.input, textarea.textarea') || (cfg.inputId ? $(cfg.inputId) : null);
    var clearBtn = wrap.querySelector('.select-clear, .input-clear') || (cfg.clearId ? $(cfg.clearId) : null);
    if (!input) return null;

    function sync() {
      var has = !!(input.value || '').trim() && !input.disabled;
      wrap.classList.toggle('has-value', has);
    }

    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (input.disabled) return;
        input.value = '';
        sync();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        if (cfg.onClear) cfg.onClear();
      });
    }
    sync();
    return { sync: sync, clear: function () { input.value = ''; sync(); } };
  }

  /** Label 旁 ? 帮助气泡：fixed 挂到 body，可浮出弹窗；不改系统光标 */
  function bindFormHelp(root) {
    var scope = root || document;
    var tip = document.getElementById('formHelpTip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'formHelpTip';
      tip.className = 'form-help-tip';
      tip.setAttribute('role', 'tooltip');
      tip.innerHTML = '<span class="form-help-tip__text"></span><span class="form-help-tip__arrow" aria-hidden="true"></span>';
      document.body.appendChild(tip);
    }
    var textEl = tip.querySelector('.form-help-tip__text');

    function hide() {
      tip.classList.remove('is-open');
    }

    function show(anchor) {
      var msg = anchor.getAttribute('data-tip') || '';
      if (!msg || !textEl) return;
      textEl.textContent = msg;
      tip.classList.add('is-open');
      tip.style.left = '0px';
      tip.style.top = '0px';
      var a = anchor.getBoundingClientRect();
      var t = tip.getBoundingClientRect();
      var gap = 8;
      var pad = 8;
      var left = a.left + a.width / 2 - t.width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - t.width - pad));
      var top = a.top - t.height - gap;
      if (top < pad) {
        top = a.bottom + gap;
        tip.classList.add('is-below');
      } else {
        tip.classList.remove('is-below');
      }
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
      var arrowX = a.left + a.width / 2 - left;
      tip.style.setProperty('--arrow-left', arrowX + 'px');
    }

    scope.querySelectorAll('.form-help[data-tip]').forEach(function (el) {
      if (el.getAttribute('data-help-bound') === '1') return;
      el.setAttribute('data-help-bound', '1');
      el.addEventListener('mouseenter', function () { show(el); });
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
    });

    return { hide: hide };
  }

  global.ProductUI = {
    $,
    escapeHtml: escapeHtml,
    showToast: showToast,
    copyText: copyText,
    closePanels: closePanels,
    fitDropdownPanel: fitDropdownPanel,
    adjustDropdownPlacement: adjustDropdownPlacement,
    openModal: openModal,
    closeModal: closeModal,
    openDrawer: openDrawer,
    enableColumnResize: enableColumnResize,
    initColumnResizeAll: initColumnResizeAll,
    closeDrawer: closeDrawer,
    bindSidebar: bindSidebar,
    bindBatchMenu: bindBatchMenu,
    bindSingleSelect: bindSingleSelect,
    bindMultiSelect: bindMultiSelect,
    bindDateRange: bindDateRange,
    bindInputClearable: bindInputClearable,
    bindFormHelp: bindFormHelp,
    bindThSort: bindThSort,
    bindSeg: bindSeg,
    getSegValue: getSegValue,
    setSegValue: setSegValue,
    renderPagination: renderPagination,
    bindPagination: bindPagination,
    COPY_ICON: COPY_ICON,
    statusTag: statusTag,
    taskStatusDot: taskStatusDot,
    taskStatusTag: taskStatusTag,
    downloadText: downloadText,
    uid: uid
  };
})(window);
