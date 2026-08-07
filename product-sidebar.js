/* 产品板块侧栏：产品管理 / 平台管理 / 资产管理 */
(function (global) {
  'use strict';

  var ICONS = {
    platform: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    product: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/></svg>',
    asset: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    page: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>',
    arrow: '<svg class="menu-group__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>'
  };

  var MENUS = [
    {
      key: 'product',
      title: '产品管理',
      icon: ICONS.product,
      children: [
        { key: 'app-apps', label: 'APP应用', href: 'app-apps.html' },
        { key: 'json-files', label: 'JSON文件', href: 'json-files.html' }
      ]
    },
    {
      key: 'platform',
      title: '平台管理',
      icon: ICONS.platform,
      children: [
        { key: 'platform-config', label: '平台配置', href: 'platform-config.html' },
        { key: 'plugin-config', label: '插件配置', href: 'plugin-config.html' },
        { key: 'developer-account', label: '开发者账号', href: 'developer-account.html' }
      ]
    },
    {
      key: 'asset',
      title: '资产管理',
      icon: ICONS.asset,
      children: [
        { key: 'tiktok-accounts', label: 'Tiktok账户', href: 'tiktok-accounts.html' },
        { key: 'tiktok-grant', label: 'TikTok赠款', href: 'tiktok-grant.html' }
      ]
    }
  ];

  function renderSidebar(activeKey) {
    var html = MENUS.map(function (group) {
      var childActive = group.children.some(function (c) { return c.key === activeKey; });
      var collapsed = childActive ? '' : ' is-collapsed';
      var children = group.children.map(function (item) {
        var active = item.key === activeKey ? ' is-active' : '';
        return '<li><a href="' + item.href + '" class="menu-item' + active + '">' + ICONS.page + '<span class="menu-item__text">' + item.label + '</span></a></li>';
      }).join('');
      return (
        '<div class="menu-group' + collapsed + '" data-group>' +
          '<button class="menu-group__title" type="button" data-group-toggle>' +
            group.icon +
            '<span class="menu-group__title-text">' + group.title + '</span>' +
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
          '<button class="sidebar-collapse-btn" id="sidebarToggle" type="button" title="折叠菜单" aria-label="折叠侧边栏">' +
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
          '<a href="platform-config.html" class="header-nav__item is-active">产品</a>' +
          '<a href="feedback-tickets.html" class="header-nav__item">工具</a>' +
          '<a href="menu-management.html" class="header-nav__item">管理</a>' +
        '</nav>' +
        '<div class="header-right">' +
          '<button class="header-icon" type="button" title="下载" aria-label="下载"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg></button>' +
          '<button class="header-icon" type="button" title="消息" aria-label="消息"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>' +
          '<a class="header-icon" href="https://m0v1x0i131y.feishu.cn/wiki/P7WcwmPrdigKg6keQbycBtYgn3d" target="_blank" rel="noopener noreferrer" title="帮助中心" aria-label="帮助中心"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></a>' +
          '<button class="user-chip" type="button" aria-label="用户菜单"><img class="user-avatar" src="assets/avatar.jpg" width="32" height="32" alt="" /><span class="user-name">小风</span><svg class="chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg></button>' +
        '</div>' +
      '</header>'
    );
  }

  function mountShell(activeKey) {
    var root = document.getElementById('appShell');
    if (!root) return;
    var main = root.querySelector('[data-main]') || root.querySelector('main');
    var mainHtml = main ? main.outerHTML : '<main class="main"></main>';
    root.innerHTML = renderHeader() + '<div class="body">' + renderSidebar(activeKey) + mainHtml + '</div>';
    if (global.ProductUI && global.ProductUI.bindSidebar) {
      global.ProductUI.bindSidebar();
    }
  }

  global.ProductShell = {
    mount: mountShell,
    renderSidebar: renderSidebar,
    renderHeader: renderHeader
  };
})(window);
