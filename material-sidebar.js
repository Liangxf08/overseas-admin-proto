/* 素材板块壳：Header / Sidebar 由 menu.js 注入，保持 MaterialShell.mount 调用不变 */
(function (global) {
  'use strict';

  function menu() {
    return global.AppMenu;
  }

  global.MaterialShell = {
    mount: function (activeKey) {
      menu().mount(activeKey);
    },
    renderSidebar: function (activeKey) {
      return menu().renderSidebar(activeKey);
    },
    renderHeader: function () {
      return menu().renderHeader('material-library');
    },
    get MENUS() {
      return menu().MENUS.material;
    }
  };
})(window);
