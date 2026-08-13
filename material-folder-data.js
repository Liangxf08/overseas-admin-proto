/* 本地素材文件夹树 · 采集任务等共用 */
(function (global) {
  'use strict';

  var SYSTEM_FOLDER = {
    id: 'system_all',
    name: '全部素材',
    system: true,
    children: []
  };

  var CUSTOM_FOLDERS = [
    { id: 'tt_collected', name: 'TT采集素材', children: [] },
    {
      id: 'ttminigame',
      name: 'TT原创素材',
      children: [
        {
          id: 'tt_orig',
          name: '原创',
          children: [
            { id: 'tt_orig_match', name: '匹配类', children: [] },
            { id: 'tt_orig_puzzle', name: '益智类', children: [] },
            { id: 'tt_orig_line', name: '划线合集', children: [] },
            { id: 'tt_orig_pack', name: '合集包', children: [] },
            { id: 'tt_orig_diff', name: '找茬类', children: [] },
            { id: 'tt_orig_water', name: '水排序', children: [] },
            { id: 'tt_orig_clean', name: '清洁类', children: [] },
            { id: 'tt_orig_mgmt', name: '经营类', children: [] },
            { id: 'tt_orig_mower', name: '转刀割草类', children: [] },
            { id: 'tt_orig_racing', name: '飞车类', children: [] }
          ]
        },
        {
          id: 'tt_diff',
          name: '找茬',
          children: [
            { id: 'tt_diff_ja', name: '日语', children: [] },
            { id: 'tt_diff_en', name: '英语', children: [] }
          ]
        },
        {
          id: 'tt_puzzle',
          name: '益智',
          children: [
            { id: 'tt_puzzle_ja', name: '日语', children: [] },
            { id: 'tt_puzzle_en', name: '英语', children: [] },
            { id: 'tt_puzzle_ms', name: '马来语', children: [] }
          ]
        },
        { id: 'tt_drama', name: '短剧', children: [] },
        { id: 'tt_scale', name: '跑量素材', children: [] },
        { id: 'tt_scale_iter', name: '跑量迭代', children: [] },
        { id: 'tt_creator', name: '达人视频', children: [] },
        { id: 'tt_rise', name: '逆袭', children: [] }
      ]
    },
    {
      id: 'cube_out',
      name: 'Cube Out 3D :Jam Puzzle',
      children: [
        { id: 'cube_orig', name: '原创', children: [] },
        { id: 'cube_comp', name: '竞品', children: [] },
        { id: 'cube_quality', name: '优质', children: [] },
        { id: 'cube_derived', name: '衍生', children: [] },
        {
          id: 'cube_i18n',
          name: '多语言',
          children: [
            { id: 'cube_i18n_cn', name: 'CN', children: [] },
            { id: 'cube_i18n_de', name: 'DE', children: [] },
            { id: 'cube_i18n_jp', name: 'JP', children: [] },
            { id: 'cube_i18n_kr', name: 'KR', children: [] }
          ]
        },
        {
          id: 'cube_iter',
          name: '迭代',
          children: [
            { id: 'cube_iter_260815', name: '260815改', children: [] },
            { id: 'cube_iter_260710', name: '260710改', children: [] },
            { id: 'cube_iter_260608', name: '260608改', children: [] },
            { id: 'cube_iter_260524', name: '260524改', children: [] }
          ]
        }
      ]
    },
    {
      id: 'girl_rescue',
      name: 'Girl Rescue: Dragon Out!',
      children: [
        { id: 'girl_orig', name: '原创', children: [] },
        { id: 'girl_comp', name: '竞品', children: [] },
        {
          id: 'girl_new',
          name: '新玩法',
          children: [
            { id: 'girl_new_td', name: '塔防', children: [] },
            { id: 'girl_new_yarn', name: '毛线打龙', children: [] },
            { id: 'girl_new_water', name: '水排序', children: [] }
          ]
        },
        { id: 'girl_trial', name: '试玩', children: [] }
      ]
    },
    {
      id: 'gems_flow',
      name: 'Gems Flow Color Puzzle',
      children: [
        { id: 'gems_orig', name: '原创', children: [] },
        { id: 'gems_wc', name: '世界杯', children: [] },
        { id: 'gems_3d', name: '类3D', children: [] },
        { id: 'gems_micro', name: '微片头', children: [] },
        { id: 'gems_story', name: '剧情片头', children: [] },
        { id: 'gems_short', name: 'Short', children: [] }
      ]
    },
    { id: 'pin_ci_wang', name: '天天拼詞王', children: [] },
    { id: 'dragon_fever_td', name: 'Dragon Fever TD', children: [] },
    { id: 'screw_pin_jam', name: 'Screw Pin Jam Puzzle', children: [] },
    { id: 'screw_away', name: 'Screw Away: 3D Pin Puzzle', children: [] },
    { id: 'moji_naka_moji', name: '文字の中に文字!', children: [] },
    { id: 'wo_yao_xueba', name: '我要當學霸', children: [] },
    { id: 'unravel_yarn_3d', name: 'Unravel Yarn 3D', children: [] },
    { id: 'chao_wan_mei', name: '超玩美派对', children: [] },
    { id: 'nao_dong_xieyin', name: '腦洞諧音梗', children: [] },
    { id: 'zhao_dao_suan_ni_ying', name: '找到算你赢', children: [] }
  ];

  function walkFolders(nodes, prefix, fn) {
    (nodes || []).forEach(function (node) {
      var path = prefix ? (prefix + ' / ' + node.name) : node.name;
      fn(node, path);
      if (node.children && node.children.length) walkFolders(node.children, path, fn);
    });
  }

  function findFolderNode(id, nodes) {
    if (!id) return null;
    if (id === SYSTEM_FOLDER.id) return SYSTEM_FOLDER;
    var list = nodes || CUSTOM_FOLDERS;
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
      if (list[i].children && list[i].children.length) {
        var found = findFolderNode(id, list[i].children);
        if (found) return found;
      }
    }
    return null;
  }

  function getFolderPath(id) {
    if (!id) return '';
    if (id === SYSTEM_FOLDER.id) return SYSTEM_FOLDER.name;
    var found = '';
    walkFolders(CUSTOM_FOLDERS, '', function (node, path) {
      if (node.id === id) found = path;
    });
    return found;
  }

  global.MaterialFolderData = {
    SYSTEM_FOLDER: SYSTEM_FOLDER,
    CUSTOM_FOLDERS: CUSTOM_FOLDERS,
    walkFolders: walkFolders,
    findFolderNode: findFolderNode,
    getFolderPath: getFolderPath
  };
})(window);
