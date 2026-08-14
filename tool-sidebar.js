/* 工具板块壳：Header / Sidebar 由 menu.js 注入，保持 ToolShell.mount 调用不变 */
(function (global) {
  'use strict';

  function menu() {
    return global.AppMenu;
  }

  global.ToolShell = {
    mount: function (activeKey) {
      menu().mount(activeKey);
    },
    renderSidebar: function (activeKey) {
      return menu().renderSidebar(activeKey);
    },
    renderHeader: function () {
      return menu().renderHeader('download-tasks');
    }
  };
})(window);
