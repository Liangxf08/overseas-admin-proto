/* 素材板块侧栏：素材采集（目录）/ 本地素材·模板管理·标签管理（一级页） */
(function (global) {
  'use strict';

  var ICONS = {
    collection: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    library: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    template: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    tag: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></svg>',
    page: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>',
    arrow: '<svg class="menu-group__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>'
  };

  /**
   * type: group = 可展开目录；leaf = 一级页面（无子目录）
   */
  var MENUS = [
    {
      type: 'group',
      key: 'collection',
      title: '素材采集',
      icon: ICONS.collection,
      children: [
        { key: 'collection-tasks', label: '采集任务', href: 'collection-tasks.html' },
        { key: 'material-list', label: '采集素材', href: 'material-list.html' }
      ]
    },
    {
      type: 'leaf',
      key: 'material-library',
      label: '本地素材',
      href: 'material-library.html',
      icon: ICONS.library
    },
    {
      type: 'leaf',
      key: 'template-library',
      label: '模板管理',
      href: 'template-library.html',
      icon: ICONS.template
    },
    {
      type: 'leaf',
      key: 'tag-library',
      label: '标签管理',
      href: 'tag-library.html',
      icon: ICONS.tag
    }
  ];

  function normalizeActiveKey(activeKey) {
    if (activeKey === 'template-compose') return 'template-library';
    return activeKey;
  }

  function isGroupActive(group, activeKey) {
    return (group.children || []).some(function (c) { return c.key === activeKey; });
  }

  function renderSidebar(activeKey) {
    activeKey = normalizeActiveKey(activeKey);
    var html = MENUS.map(function (item) {
      if (item.type === 'leaf') {
        var leafActive = item.key === activeKey ? ' is-active' : '';
        return (
          '<a href="' + item.href + '" class="menu-item menu-item--root' + leafActive + '" data-menu-key="' + item.key + '">' +
            item.icon +
            '<span class="menu-item__text">' + item.label + '</span>' +
          '</a>'
        );
      }

      var childActive = isGroupActive(item, activeKey);
      var collapsed = childActive ? '' : ' is-collapsed';
      var children = (item.children || []).map(function (child) {
        var active = child.key === activeKey ? ' is-active' : '';
        return (
          '<li>' +
            '<a href="' + child.href + '" class="menu-item' + active + '" data-menu-key="' + child.key + '">' +
              ICONS.page +
              '<span class="menu-item__text">' + child.label + '</span>' +
            '</a>' +
          '</li>'
        );
      }).join('');

      return (
        '<div class="menu-group' + collapsed + '" data-group>' +
          '<button class="menu-group__title" type="button" data-group-toggle>' +
            item.icon +
            '<span class="menu-group__title-text">' + item.title + '</span>' +
            ICONS.arrow +
          '</button>' +
          '<ul class="menu-children">' + children + '</ul>' +
        '</div>'
      );
    }).join('');

    return (
      '<aside class="sidebar" id="sidebar">' +
        '<nav class="sidebar-nav" aria-label="侧边栏导航">' + html + '</nav>' +
        '<div class="sidebar-footer">' +
          '<button class="sidebar-collapse-btn" type="button" id="sidebarToggle" title="折叠菜单" aria-label="折叠侧边栏">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/><path d="M15 9l-3 3 3 3"/></svg>' +
          '</button>' +
        '</div>' +
      '</aside>'
    );
  }

  function renderHeader() {
    return (
      '<header class="header">' +
        '<div class="header-left">' +
          '<img class="logo" src="assets/logo.png" width="32" height="32" alt="海外中台" onerror="this.style.background=\'var(--color-fill-4)\';this.removeAttribute(\'src\')" />' +
          '<span class="brand-name">海外中台</span>' +
        '</div>' +
        '<nav class="header-nav" aria-label="顶部导航">' +
          '<a href="#" class="header-nav__item">首页</a>' +
          '<a href="dashboard.html" class="header-nav__item">看板</a>' +
          '<a href="tiktok-accounts.html" class="header-nav__item">产品</a>' +
          '<a href="collection-tasks.html" class="header-nav__item is-active">素材</a>' +
          '<a href="feedback-tickets.html" class="header-nav__item">工具</a>' +
          '<a href="menu-management.html" class="header-nav__item">管理</a>' +
        '</nav>' +
        '<div class="header-right">' +
          '<button class="header-icon" type="button" title="下载" aria-label="下载"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg></button>' +
          '<button class="header-icon" type="button" title="消息" aria-label="消息"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>' +
          '<a class="header-icon" href="https://m0v1x0i131y.feishu.cn/wiki/P7WcwmPrdigKg6keQbycBtYgn3d" target="_blank" rel="noopener noreferrer" title="帮助中心" aria-label="帮助中心"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></a>' +
          '<button class="user-chip" type="button" aria-label="用户菜单"><img class="user-avatar" src="assets/avatar.jpg" width="32" height="32" alt="" onerror="this.style.background=\'var(--color-fill-4)\';this.removeAttribute(\'src\')" /><span class="user-name">小风</span><svg class="chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg></button>' +
        '</div>' +
      '</header>'
    );
  }

  function mountShell(activeKey) {
    var root = document.getElementById('appShell');
    if (!root) return;
    var menuKey = normalizeActiveKey(activeKey);
    var main = root.querySelector('[data-main]') || root.querySelector('main');
    var mainHtml = main ? main.outerHTML : '<main class="main"></main>';
    root.innerHTML = renderHeader() + '<div class="body">' + renderSidebar(menuKey) + mainHtml + '</div>';
    if (global.ProductUI && global.ProductUI.bindSidebar) {
      global.ProductUI.bindSidebar();
    }
    /* 素材库 / 模板库为一级工作台页，进入后自动收起侧栏腾出横向空间 */
    if (menuKey === 'material-library' || menuKey === 'template-library') {
      var sidebar = document.getElementById('sidebar');
      var toggle = document.getElementById('sidebarToggle');
      if (sidebar) sidebar.classList.add('is-collapsed');
      if (toggle) {
        toggle.setAttribute('title', '展开菜单');
        toggle.setAttribute('aria-label', '展开侧边栏');
      }
    }
  }

  global.MaterialShell = {
    mount: mountShell,
    renderSidebar: renderSidebar,
    renderHeader: renderHeader,
    MENUS: MENUS
  };
})(window);
