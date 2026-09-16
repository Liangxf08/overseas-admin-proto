/* 海外中台 · 顶部导航 / 侧边栏公共组件
 * 仅负责把与现网一致的 Header / Sidebar HTML 注入到原位置。
 * 折叠、分组展开等交互仍走 ProductUI.bindSidebar，不改业务页逻辑。
 */
(function (global) {
  'use strict';

  var IMG_ONERROR = "this.style.background='var(--color-fill-4)';this.removeAttribute('src')";
  var HELP_HREF = 'https://m0v1x0i131y.feishu.cn/wiki/P7WcwmPrdigKg6keQbycBtYgn3d';
  var HEADER_LABELS = ['首页', '看板', '产品', '素材', '工具', '管理'];

  var ICONS = {
    platform: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    product: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/></svg>',
    tool: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    ops: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    asset: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    page: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>',
    collection: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    library: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    template: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    tag: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></svg>',
    tasks: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    derive: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7 7"/><path d="M3 3l7 7"/><path d="M12 14v7"/><path d="M8 18h8"/></svg>',
    task: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    system: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    shield: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    ad: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M16.5 8.5a4.5 4.5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>',
    menu: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    user: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    role: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    datagroup: '<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
    arrow: '<svg class="menu-group__arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/><path d="M15 9l-3 3 3 3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    chevron: '<svg class="chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>'
  };

  /* 顶部一级入口 href 按板块保持现网差异，避免改跳转落地页 */
  var HEADER_HREFS = {
    board: { 首页: '#', 看板: 'dashboard.html', 产品: 'platform-config.html', 素材: 'collection-tasks.html', 工具: 'download-tasks.html', 管理: 'menu-management.html' },
    product: { 首页: '#', 看板: 'dashboard.html', 产品: 'platform-config.html', 素材: 'collection-tasks.html', 工具: 'download-tasks.html', 管理: 'menu-management.html' },
    material: { 首页: '#', 看板: 'dashboard.html', 产品: 'tiktok-accounts.html', 素材: 'material-library.html', 工具: 'download-tasks.html', 管理: 'menu-management.html' },
    tool: { 首页: '#', 看板: 'dashboard.html', 产品: 'platform-config.html', 素材: 'collection-tasks.html', 工具: 'download-tasks.html', 管理: 'menu-management.html' },
    admin: { 首页: '#', 看板: 'dashboard.html', 产品: 'tiktok-accounts.html', 素材: 'collection-tasks.html', 工具: 'download-tasks.html', 管理: 'menu-management.html' }
  };

  var HEADER_OPTS = {
    board: { dataMenuName: false, logoOnerror: false, avatarOnerror: false },
    product: { dataMenuName: false, logoOnerror: true, avatarOnerror: false },
    material: { dataMenuName: false, logoOnerror: true, avatarOnerror: true },
    tool: { dataMenuName: false, logoOnerror: true, avatarOnerror: true },
    admin: { dataMenuName: true, logoOnerror: true, avatarOnerror: true }
  };

  var MENUS = {
    product: [
      {
        key: 'app',
        title: '产品管理',
        icon: ICONS.product,
        children: [
          { key: 'app-apps', label: 'APP应用', href: 'app-apps.html' },
          { key: 'mini-games', label: '小游戏', href: 'mini-games.html' },
          { key: 'tt-dramas', label: '短剧', href: 'tt-dramas.html' },
          { key: 'product-types', label: '产品类型', href: 'product-types.html' },
          { key: 'product-series', label: '产品系列', href: 'product-series.html' },
          { key: 'product-groups', label: '产品组', href: 'product-groups.html' },
          { key: 'json-files', label: 'JSON文件', href: 'json-files.html' }
        ]
      },
      {
        key: 'ops-tools',
        title: '运营工具',
        icon: ICONS.ops,
        children: [
          { key: 'feedback-tickets', label: '用户反馈', href: 'feedback-tickets.html' }
        ]
      },
      {
        key: 'platform-tools',
        title: '平台工具',
        icon: ICONS.tool,
        children: [
          { key: 'app-user-query', label: 'APP用户查询', href: 'app-user-query.html' }
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
        key: 'ad-strategy-dir',
        title: '广告策略',
        icon: ICONS.ad,
        children: [
          { key: 'ad-playable', label: '试玩广告', href: 'ad-playable.html' },
          { key: 'ad-strategy', label: '广告策略', href: 'ad-strategy.html' },
          { key: 'ad-agg-app', label: '聚合应用', href: 'ad-agg-app.html' },
          { key: 'ad-scene', label: '场景管理', href: 'ad-scene.html' },
          { key: 'ad-field-config', label: '字段配置', href: 'ad-field-config.html' }
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
    ],
    material: [
      { type: 'leaf', key: 'material-library', label: '本地素材', href: 'material-library.html', icon: ICONS.library },
      { type: 'leaf', key: 'template-library', label: '模板中心', href: 'template-library.html', icon: ICONS.template },
      { type: 'leaf', key: 'tag-library', label: '标签管理', href: 'tag-library.html', icon: ICONS.tag },
      { type: 'leaf', key: 'collection-tasks', label: '采集任务', href: 'collection-tasks.html', icon: ICONS.tasks },
      { type: 'leaf', key: 'derive-tasks', label: '衍生任务', href: 'derive-tasks.html', icon: ICONS.derive }
    ],
    tool: [
      {
        key: 'task-center',
        title: '任务中心',
        icon: ICONS.task,
        children: [
          { key: 'download-tasks', label: '下载任务', href: 'download-tasks.html' }
        ]
      }
    ],
    admin: [
      {
        key: 'system',
        title: '系统管理',
        icon: ICONS.system,
        collapseInactive: false,
        children: [
          { key: 'menu-management', label: '菜单管理', href: 'menu-management.html', icon: ICONS.menu }
        ]
      },
      {
        key: 'perm',
        title: '权限管理',
        icon: ICONS.shield,
        collapseInactive: false,
        children: [
          { key: 'user-management', label: '用户管理', href: 'user-management.html', icon: ICONS.user },
          { key: 'role-management', label: '角色管理', href: 'role-management.html', icon: ICONS.role },
          { key: 'datagroup-management', label: '数据组管理', href: 'datagroup-management.html', icon: ICONS.datagroup }
        ]
      }
    ]
  };

  var PAGES = {
    dashboard: { module: 'board', header: '看板' },

    'app-apps': { module: 'product', header: '产品' },
    'mini-games': { module: 'product', header: '产品' },
    'tt-dramas': { module: 'product', header: '产品' },
    'product-types': { module: 'product', header: '产品' },
    'product-series': { module: 'product', header: '产品' },
    'product-groups': { module: 'product', header: '产品' },
    'json-files': { module: 'product', header: '产品' },
    'feedback-tickets': { module: 'product', header: '产品' },
    'app-user-query': { module: 'product', header: '产品' },
    'platform-config': { module: 'product', header: '产品' },
    'plugin-config': { module: 'product', header: '产品' },
    'developer-account': { module: 'product', header: '产品' },
    'ad-playable': { module: 'product', header: '产品' },
    'ad-strategy': { module: 'product', header: '产品' },
    'ad-agg-app': { module: 'product', header: '产品' },
    'ad-scene': { module: 'product', header: '产品' },
    'ad-field-config': { module: 'product', header: '产品' },
    'tiktok-accounts': { module: 'product', header: '产品' },
    'tiktok-grant': { module: 'product', header: '产品' },

    'material-library': { module: 'material', header: '素材' },
    'template-library': { module: 'material', header: '素材' },
    'template-compose': { module: 'material', header: '素材', sidebarKey: 'template-library' },
    'tag-library': { module: 'material', header: '素材' },
    'collection-tasks': { module: 'material', header: '素材' },
    'derive-tasks': { module: 'material', header: '素材' },

    'download-tasks': { module: 'tool', header: '工具' },
    'batch-tasks': { module: 'tool', header: '工具' },

    'menu-management': { module: 'admin', header: '管理' },
    'user-management': { module: 'admin', header: '管理' },
    'role-management': { module: 'admin', header: '管理' },
    'datagroup-management': { module: 'admin', header: '管理' }
  };

  function fileKeyFromLocation() {
    var file = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
    return file || 'dashboard';
  }

  function resolvePage(activeKey) {
    var key = activeKey || fileKeyFromLocation();
    if (HEADER_HREFS[key] && !PAGES[key]) {
      return { key: key, module: key, header: '', sidebarKey: key };
    }
    var meta = PAGES[key] || { module: 'product', header: '产品' };
    return {
      key: key,
      module: meta.module,
      header: meta.header,
      sidebarKey: meta.sidebarKey || key
    };
  }

  function imgTag(className, src, alt, useOnerror) {
    var html = '<img class="' + className + '" src="' + src + '" width="32" height="32" alt="' + alt + '"';
    if (useOnerror) html += " onerror=\"" + IMG_ONERROR + "\"";
    html += ' />';
    return html;
  }

  function renderHeader(pageOrKey) {
    var page = typeof pageOrKey === 'string' ? resolvePage(pageOrKey) : pageOrKey;
    var module = page.module || 'product';
    var hrefs = HEADER_HREFS[module] || HEADER_HREFS.product;
    var opts = HEADER_OPTS[module] || HEADER_OPTS.product;
    var active = page.header;
    var nav = HEADER_LABELS.map(function (name) {
      var cls = 'header-nav__item' + (name === active ? ' is-active' : '');
      var nameAttr = opts.dataMenuName ? ' data-menu-name="' + name + '"' : '';
      return '<a href="' + hrefs[name] + '" class="' + cls + '"' + nameAttr + '>' + name + '</a>';
    }).join('');

    return (
      '<header class="header">' +
        '<div class="header-left">' +
          imgTag('logo', 'assets/logo.png', '海外中台', opts.logoOnerror) +
          '<span class="brand-name">海外中台</span>' +
        '</div>' +
        '<nav class="header-nav" aria-label="顶部导航">' + nav + '</nav>' +
        '<div class="header-right">' +
          '<a class="header-icon" href="download-tasks.html" target="_blank" rel="noopener noreferrer" data-tip="任务中心" aria-label="任务中心">' + ICONS.download + '</a>' +
          '<a class="header-icon" href="' + HELP_HREF + '" target="_blank" rel="noopener noreferrer" data-tip="帮助中心" aria-label="帮助中心">' + ICONS.help + '</a>' +
          '<button class="user-chip" type="button" aria-label="用户菜单">' +
            imgTag('user-avatar', 'assets/avatar.jpg', '', opts.avatarOnerror) +
            '<span class="user-name">小风</span>' +
            ICONS.chevron +
          '</button>' +
        '</div>' +
      '</header>'
    );
  }

  function childHref(item, sidebarKey) {
    if (item.key === 'menu-management' && sidebarKey === 'menu-management') return '#';
    return item.href;
  }

  function renderGroup(group, sidebarKey) {
    var childActive = (group.children || []).some(function (c) { return c.key === sidebarKey; });
    var collapseInactive = group.collapseInactive !== false;
    var collapsed = collapseInactive && !childActive ? ' is-collapsed' : '';
    var children = (group.children || []).map(function (item) {
      var active = item.key === sidebarKey ? ' is-active' : '';
      var icon = item.icon || ICONS.page;
      return (
        '<li>' +
          '<a href="' + childHref(item, sidebarKey) + '" class="menu-item' + active + '">' +
            icon +
            '<span class="menu-item__text">' + item.label + '</span>' +
          '</a>' +
        '</li>'
      );
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
  }

  function renderLeaf(item, sidebarKey) {
    var active = item.key === sidebarKey ? ' is-active' : '';
    return (
      '<a href="' + item.href + '" class="menu-item menu-item--root' + active + '" data-menu-key="' + item.key + '">' +
        item.icon +
        '<span class="menu-item__text">' + item.label + '</span>' +
      '</a>'
    );
  }

  function renderSidebarNav(pageOrKey) {
    var page = typeof pageOrKey === 'string' ? resolvePage(pageOrKey) : pageOrKey;
    var items = MENUS[page.module] || [];
    var sidebarKey = page.sidebarKey;
    return items.map(function (item) {
      if (item.type === 'leaf') return renderLeaf(item, sidebarKey);
      return renderGroup(item, sidebarKey);
    }).join('');
  }

  function renderSidebar(pageOrKey) {
    var page = typeof pageOrKey === 'string' ? resolvePage(pageOrKey) : pageOrKey;
    if (page.module === 'board') return '';
    return (
      '<aside class="sidebar" id="sidebar">' +
        '<nav class="sidebar-nav" aria-label="侧边栏导航">' + renderSidebarNav(page) + '</nav>' +
        '<div class="sidebar-footer">' +
          '<button class="sidebar-collapse-btn" id="sidebarToggle" type="button" title="折叠菜单" aria-label="折叠侧边栏">' +
            ICONS.collapse +
          '</button>' +
        '</div>' +
      '</aside>'
    );
  }

  function afterMount(page) {
    if (page.module === 'board') return;
    if (global.ProductUI && global.ProductUI.bindSidebar) {
      global.ProductUI.bindSidebar();
    }
    if (page.module === 'material' &&
        (page.sidebarKey === 'material-library' || page.sidebarKey === 'template-library')) {
      var sidebar = document.getElementById('sidebar');
      var toggle = document.getElementById('sidebarToggle');
      if (sidebar) sidebar.classList.add('is-collapsed');
      if (toggle) {
        toggle.setAttribute('title', '展开菜单');
        toggle.setAttribute('aria-label', '展开侧边栏');
      }
    }
  }

  function isBoardSidebar(el) {
    return !!(el && el.classList && el.classList.contains('board-sidebar'));
  }

  function mount(activeKey) {
    var page = resolvePage(activeKey);
    var root = document.getElementById('appShell');
    var existingHeader = document.querySelector('header.header');
    var existingSidebar = document.getElementById('sidebar');

    if (root && !existingHeader) {
      var main = root.querySelector('[data-main]') || root.querySelector('main');
      var mainHtml = main ? main.outerHTML : '<main class="main"></main>';
      root.innerHTML = renderHeader(page) + '<div class="body">' + renderSidebar(page) + mainHtml + '</div>';
      afterMount(page);
      return;
    }

    if (existingHeader) existingHeader.outerHTML = renderHeader(page);
    if (page.module !== 'board' && existingSidebar && !isBoardSidebar(existingSidebar)) {
      existingSidebar.outerHTML = renderSidebar(page);
    }
    afterMount(page);
  }

  global.AppMenu = {
    mount: mount,
    renderHeader: renderHeader,
    renderSidebar: renderSidebar,
    PAGES: PAGES,
    MENUS: MENUS
  };

  var bootScript = document.currentScript;
  var bootPage = bootScript && bootScript.getAttribute('data-page');
  if (bootPage) mount(bootPage);
})(window);
