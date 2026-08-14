/* 产品板块壳：Header / Sidebar 由 menu.js 注入，保持 ProductShell.mount 调用不变 */
(function (global) {
  'use strict';

  function menu() {
    return global.AppMenu;
  }

  global.ProductShell = {
    mount: function (activeKey) {
      menu().mount(activeKey);
    },
    renderSidebar: function (activeKey) {
      return menu().renderSidebar(activeKey);
    },
    renderHeader: function () {
      return menu().renderHeader('platform-config');
    }
  };
})(window);
