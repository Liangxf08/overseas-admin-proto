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

  /* Arco Message 状态图标（Icon*CircleFill） */
  var MSG_ICON_PATHS = {
    success: 'M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20Zm10.207-24.379a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0L22 26.172l-4.878-4.88a1 1 0 0 0-1.415 0l-1.414 1.415a1 1 0 0 0 0 1.414l7 7a1 1 0 0 0 1.414 0l11.5-11.5Z',
    error: 'M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20Zm4.955-27.771-4.95 4.95-4.95-4.95a1 1 0 0 0-1.414 0l-1.414 1.414a1 1 0 0 0 0 1.414l4.95 4.95-4.95 4.95a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l4.95-4.95 4.95 4.95a1 1 0 0 0 1.414 0l1.414-1.414a1 1 0 0 0 0-1.414l-4.95-4.95 4.95-4.95a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0Z',
    warning: 'M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20Zm-2-11a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v2Zm4-18a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V15Z',
    info: 'M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20Zm2-30a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2Zm0 17h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1v-8a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v11Z'
  };

  function msgIconHtml(type) {
    var key = type === 'error' || type === 'warning' || type === 'info' || type === 'normal'
      ? (type === 'normal' ? 'info' : type)
      : 'success';
    return '<svg class="page-msg__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      '<path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="' + MSG_ICON_PATHS[key] + '"/>' +
      '</svg>';
  }

  function showToast(text, type) {
    var el = $('pageMsg');
    if (!el) return;
    type = type || 'success';
    if (type !== 'success' && type !== 'error' && type !== 'warning' && type !== 'info' && type !== 'normal') {
      type = 'success';
    }
    el.className = 'page-msg page-msg--' + type + ' is-show';
    el.innerHTML = msgIconHtml(type) + '<span>' + escapeHtml(text) + '</span>';
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
    document.querySelectorAll('.datetime-panel.is-open').forEach(function (p) {
      p.classList.remove('is-open', 'is-fixed', 'is-dropup', 'is-align-right');
      p.style.left = '';
      p.style.top = '';
      p.style.right = '';
      p.style.bottom = '';
      var host = p.__datetimeHost;
      if (host && p.parentElement !== host) host.appendChild(p);
    });
    document.querySelectorAll('.datetime-trigger-wrap.is-panel-open').forEach(function (w) {
      w.classList.remove('is-panel-open');
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

  /**
   * 日期时间选择器（定版）
   * 左月历 + 右 HH:mm:ss；面板挂 body + fixed 定位（适配弹窗 transform）
   * 值格式：YYYY-MM-DD HH:mm:ss
   *
   * DOM：.datetime-trigger-wrap > .select-trigger + .select-clear + .datetime-panel
   *      .datetime-panel__main > .date-cal + .time-panel(.time-panel__display + .time-col[data-unit=h|m|s])
   */
  function bindDateTime(cfg) {
    var wrap = $(cfg.wrapId);
    var trigger = $(cfg.triggerId);
    var label = $(cfg.labelId);
    var panel = $(cfg.panelId);
    var cal = $(cfg.calId);
    var hourEl = $(cfg.hourId);
    var minuteEl = $(cfg.minuteId);
    var secondEl = $(cfg.secondId);
    var displayEl = $(cfg.displayId);
    var clearBtn = cfg.clearId ? $(cfg.clearId) : null;
    if (!wrap || !trigger || !panel || !label || !cal) return null;

    var placeholder = cfg.placeholder != null ? cfg.placeholder : '请选择日期时间';
    var value = '';
    var timeParts = { h: 0, m: 0, s: 0 };
    var viewMonth = null;

    panel.__datetimeHost = wrap;

    function parseDateTime(str) {
      if (!str) return null;
      var m = String(str).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
      if (!m) {
        var d = new Date(String(str).replace(/-/g, '/'));
        return isNaN(d.getTime()) ? null : d;
      }
      return new Date(
        Number(m[1]), Number(m[2]) - 1, Number(m[3]),
        Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
      );
    }

    function formatHMS(h, m, s) {
      return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    }

    function composeValue(dateObj) {
      if (!dateObj) return '';
      return formatDateYMD(dateObj) + ' ' + formatHMS(timeParts.h, timeParts.m, timeParts.s);
    }

    function syncLabel() {
      if (!value) {
        label.innerHTML = '<span class="muted">' + escapeHtml(placeholder) + '</span>';
        wrap.classList.remove('has-value');
      } else {
        label.textContent = value;
        wrap.classList.add('has-value');
      }
      if (displayEl) displayEl.textContent = formatHMS(timeParts.h, timeParts.m, timeParts.s);
    }

    function setFromDate(dateObj, silent) {
      if (!dateObj) {
        value = '';
      } else {
        value = composeValue(dateObj);
      }
      syncLabel();
      if (!silent && typeof cfg.onChange === 'function') cfg.onChange(value);
    }

    function setValue(str, silent) {
      value = str ? String(str) : '';
      var dt = parseDateTime(value);
      if (dt) {
        timeParts = { h: dt.getHours(), m: dt.getMinutes(), s: dt.getSeconds() };
        viewMonth = new Date(dt.getFullYear(), dt.getMonth(), 1);
      } else {
        timeParts = { h: 0, m: 0, s: 0 };
        viewMonth = null;
        if (value && !dt) value = '';
      }
      syncLabel();
      if (!silent && typeof cfg.onChange === 'function') cfg.onChange(value);
    }

    function renderCalendar() {
      if (!viewMonth) {
        var base = parseDateTime(value) || new Date();
        viewMonth = new Date(base.getFullYear(), base.getMonth(), 1);
      }
      var year = viewMonth.getFullYear();
      var month = viewMonth.getMonth();
      var selected = parseDateTime(value);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var first = new Date(year, month, 1);
      var startOffset = (first.getDay() + 6) % 7;
      var start = new Date(first);
      start.setDate(first.getDate() - startOffset);
      var weeks = ['一', '二', '三', '四', '五', '六', '日'];
      var leftNav =
        '<div class="date-cal__nav">' +
          '<button class="date-cal__btn" type="button" data-nav="prev-year" aria-label="上一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2L2 6l4 4M10 2L6 6l4 4"/></svg></button>' +
          '<button class="date-cal__btn" type="button" data-nav="prev-month" aria-label="上一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2L4 6l4 4"/></svg></button>' +
        '</div>';
      var rightNav =
        '<div class="date-cal__nav">' +
          '<button class="date-cal__btn" type="button" data-nav="next-month" aria-label="下一月"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 2l4 4-4 4"/></svg></button>' +
          '<button class="date-cal__btn" type="button" data-nav="next-year" aria-label="下一年"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l4 4-4 4M6 2l4 4-4 4"/></svg></button>' +
        '</div>';
      var html = '<div class="date-cal__header">' + leftNav +
        '<div class="date-cal__title">' + year + ' 年 ' + (month + 1) + ' 月</div>' + rightNav +
        '</div><div class="date-cal__week">' + weeks.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div><div class="date-cal__grid">';
      var i;
      for (i = 0; i < 42; i++) {
        var day = new Date(start);
        day.setDate(start.getDate() + i);
        var out = day.getMonth() !== month;
        var ymd = formatDateYMD(day);
        var cls = 'date-cal__day';
        if (out) cls += ' is-out';
        if (selected && formatDateYMD(selected) === ymd) cls += ' is-range-start is-range-end';
        var dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        if (dayOnly.getTime() === today.getTime()) cls += ' is-today';
        html += '<button class="' + cls + '" type="button" data-day="' + ymd + '"><span class="date-cal__day-num">' + day.getDate() + '</span></button>';
      }
      html += '</div>';
      cal.innerHTML = html;
    }

    function renderTimeCol(el, max, active) {
      if (!el) return;
      var html = '';
      var i;
      for (i = 0; i <= max; i++) {
        html += '<button class="time-col__item' + (i === active ? ' is-active' : '') +
          '" type="button" data-val="' + i + '">' + pad2(i) + '</button>';
      }
      el.innerHTML = html;
      var activeEl = el.querySelector('.is-active');
      if (activeEl) {
        el.scrollTop = Math.max(0, activeEl.offsetTop - el.clientHeight / 2 + activeEl.clientHeight / 2);
      }
    }

    function renderTimeCols() {
      renderTimeCol(hourEl, 23, timeParts.h);
      renderTimeCol(minuteEl, 59, timeParts.m);
      renderTimeCol(secondEl, 59, timeParts.s);
      if (displayEl) displayEl.textContent = formatHMS(timeParts.h, timeParts.m, timeParts.s);
    }

    function positionPanel() {
      if (!panel.classList.contains('is-open')) return;
      var gap = 4;
      var pad = 8;
      var rect = trigger.getBoundingClientRect();
      panel.classList.add('is-fixed');
      panel.style.left = rect.left + 'px';
      panel.style.top = (rect.bottom + gap) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';

      var pRect = panel.getBoundingClientRect();
      var top = rect.bottom + gap;
      var left = rect.left;
      if (pRect.height > window.innerHeight - rect.bottom - pad && rect.top - pad > window.innerHeight - rect.bottom - pad) {
        top = Math.max(pad, rect.top - pRect.height - gap);
      } else if (top + pRect.height > window.innerHeight - pad) {
        top = Math.max(pad, window.innerHeight - pRect.height - pad);
      }
      if (left + pRect.width > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - pRect.width - pad);
      }
      panel.style.top = top + 'px';
      panel.style.left = left + 'px';
    }

    function closePanel() {
      panel.classList.remove('is-open', 'is-fixed');
      panel.style.left = '';
      panel.style.top = '';
      panel.style.right = '';
      panel.style.bottom = '';
      trigger.classList.remove('is-open');
      wrap.classList.remove('is-panel-open');
      if (panel.parentElement !== wrap) wrap.appendChild(panel);
    }

    function openPanel() {
      closePanels();
      if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
      }
      panel.classList.add('is-open');
      trigger.classList.add('is-open');
      wrap.classList.add('is-panel-open');
      renderCalendar();
      renderTimeCols();
      positionPanel();
      requestAnimationFrame(positionPanel);
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });
    wrap.addEventListener('click', function (e) { e.stopPropagation(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    window.addEventListener('resize', function () {
      if (panel.classList.contains('is-open')) positionPanel();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        value = '';
        timeParts = { h: 0, m: 0, s: 0 };
        viewMonth = null;
        syncLabel();
        closePanel();
        if (typeof cfg.onChange === 'function') cfg.onChange('');
      });
    }

    cal.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        var type = nav.getAttribute('data-nav');
        if (!viewMonth) viewMonth = new Date();
        if (type === 'prev-month') viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
        if (type === 'next-month') viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
        if (type === 'prev-year') viewMonth = new Date(viewMonth.getFullYear() - 1, viewMonth.getMonth(), 1);
        if (type === 'next-year') viewMonth = new Date(viewMonth.getFullYear() + 1, viewMonth.getMonth(), 1);
        renderCalendar();
        return;
      }
      var dayBtn = e.target.closest('[data-day]');
      if (!dayBtn) return;
      var parts = dayBtn.getAttribute('data-day').split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      setFromDate(d);
      renderCalendar();
    });

    panel.querySelectorAll('.time-col').forEach(function (col) {
      col.addEventListener('click', function (e) {
        var item = e.target.closest('[data-val]');
        if (!item) return;
        var unit = col.getAttribute('data-unit');
        var val = Number(item.getAttribute('data-val'));
        if (unit === 'h') timeParts.h = val;
        if (unit === 'm') timeParts.m = val;
        if (unit === 's') timeParts.s = val;
        var base = parseDateTime(value) || new Date();
        setFromDate(base);
        renderTimeCols();
      });
    });

    if (typeof cfg.getValue === 'function') {
      setValue(cfg.getValue(), true);
    } else {
      syncLabel();
    }

    return {
      getValue: function () { return value; },
      setValue: function (v) { setValue(v, true); },
      open: openPanel,
      close: closePanel,
      syncLabel: syncLabel
    };
  }

  /**
   * 表头多列排序
   * 升序 / 降序为独立按钮：点击选中，再点同向取消；点另一向则切换方向（保持优先级）
   * 多列同时选中时，按选中先后作为优先级（先选优先）
   * getState/setState 使用 { specs: [{ key, dir }, ...] }；兼容旧的 { key, dir }
   */
  var TH_SORT_ICONS_HTML =
    '<span class="th-sort__icons">' +
      '<button type="button" class="th-sort__dir asc" data-sort-dir="asc" aria-label="升序">' +
        '<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M5 1L9 7H1Z" fill="currentColor"/></svg>' +
      '</button>' +
      '<button type="button" class="th-sort__dir desc" data-sort-dir="desc" aria-label="降序">' +
        '<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M5 7L1 1h8Z" fill="currentColor"/></svg>' +
      '</button>' +
    '</span>';

  function resolveSortSpecs(state) {
    if (!state) return [];
    if (Array.isArray(state.specs)) {
      return state.specs.filter(function (s) { return s && s.key && (s.dir === 'asc' || s.dir === 'desc'); });
    }
    if (state.key && (state.dir === 'asc' || state.dir === 'desc')) {
      return [{ key: state.key, dir: state.dir }];
    }
    return [];
  }

  /** 独立方向按钮：同向再点取消；异向切换；未选则追加 */
  function toggleSortDir(specs, key, dir) {
    if (dir !== 'asc' && dir !== 'desc') return (specs || []).slice();
    var list = (specs || []).slice();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) { idx = i; break; }
    }
    if (idx < 0) {
      list.push({ key: key, dir: dir });
    } else if (list[idx].dir === dir) {
      list.splice(idx, 1);
    } else {
      list[idx] = { key: key, dir: dir };
    }
    return list;
  }

  /** @deprecated 列级循环，保留兼容；新交互请用 toggleSortDir */
  function toggleSortSpec(specs, key, defaultDir) {
    var list = (specs || []).slice();
    var dir0 = defaultDir === 'asc' ? 'asc' : 'desc';
    var existing = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) { existing = list[i]; break; }
    }
    if (!existing) return toggleSortDir(list, key, dir0);
    if (existing.dir === dir0) return toggleSortDir(list, key, dir0 === 'asc' ? 'desc' : 'asc');
    return toggleSortDir(list, key, existing.dir);
  }

  function packSortState(specs) {
    var list = resolveSortSpecs({ specs: specs });
    if (!list.length) return { specs: [], key: '', dir: '' };
    return { specs: list, key: list[0].key, dir: list[0].dir };
  }

  function sortRowsBySpecs(rows, specs, compareFn) {
    var list = resolveSortSpecs({ specs: specs });
    if (!list.length) return rows.slice();
    var cmp = compareFn || function (a, b, key) {
      var av = a[key];
      var bv = b[key];
      if (typeof av === 'number' || typeof bv === 'number') {
        var an = Number(av);
        var bn = Number(bv);
        if (!isFinite(an) && !isFinite(bn)) return 0;
        if (!isFinite(an)) return 1;
        if (!isFinite(bn)) return -1;
        return an - bn;
      }
      return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv), 'zh');
    };
    return rows.slice().sort(function (a, b) {
      for (var i = 0; i < list.length; i++) {
        var c = cmp(a, b, list[i].key);
        if (c !== 0) return list[i].dir === 'asc' ? c : -c;
      }
      return 0;
    });
  }

  function bindThSort(cfg) {
    var root = typeof cfg.root === 'string' ? document.querySelector(cfg.root) : cfg.root;
    if (!root) return null;

    function getWrapKey(wrap) {
      return wrap.getAttribute('data-key') || wrap.getAttribute('data-sort-key') || '';
    }

    function sync() {
      var specs = resolveSortSpecs(cfg.getState ? cfg.getState() : null);
      var map = {};
      specs.forEach(function (s) { map[s.key] = s.dir; });
      root.querySelectorAll('.th-sort').forEach(function (wrap) {
        var key = getWrapKey(wrap);
        var dir = map[key];
        wrap.classList.toggle('is-asc', dir === 'asc');
        wrap.classList.toggle('is-desc', dir === 'desc');
        wrap.classList.toggle('is-active', !!dir);
        wrap.querySelectorAll('.th-sort__dir').forEach(function (btn) {
          var d = btn.getAttribute('data-sort-dir');
          btn.classList.toggle('is-on', !!dir && d === dir);
        });
      });
    }

    root.addEventListener('click', function (e) {
      var dirBtn = e.target.closest('[data-sort-dir]');
      if (!dirBtn || !root.contains(dirBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      var wrap = dirBtn.closest('.th-sort');
      if (!wrap) return;
      var key = getWrapKey(wrap);
      var dir = dirBtn.getAttribute('data-sort-dir');
      if (!key || (dir !== 'asc' && dir !== 'desc')) return;
      var specs = resolveSortSpecs(cfg.getState ? cfg.getState() : null);
      var next = packSortState(toggleSortDir(specs, key, dir));
      if (cfg.setState) cfg.setState(next);
      if (cfg.onChange) cfg.onChange(next);
      sync();
    });

    sync();
    return {
      sync: sync,
      resolveSpecs: function () { return resolveSortSpecs(cfg.getState ? cfg.getState() : null); }
    };
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
      tip.classList.remove('is-below');
      tip.classList.add('is-open');
      tip.style.left = '0px';
      tip.style.top = '0px';
      function place() {
        var a = anchor.getBoundingClientRect();
        var t = tip.getBoundingClientRect();
        if (!t.width || !t.height) return;
        var gap = 6;
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
        tip.style.setProperty('--arrow-left', (a.left + a.width / 2 - left) + 'px');
      }
      place();
      requestAnimationFrame(place);
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
    bindDateTime: bindDateTime,
    bindInputClearable: bindInputClearable,
    bindFormHelp: bindFormHelp,
    bindThSort: bindThSort,
    resolveSortSpecs: resolveSortSpecs,
    sortRowsBySpecs: sortRowsBySpecs,
    toggleSortSpec: toggleSortSpec,
    toggleSortDir: toggleSortDir,
    packSortState: packSortState,
    TH_SORT_ICONS_HTML: TH_SORT_ICONS_HTML,
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
