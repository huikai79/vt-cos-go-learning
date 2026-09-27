(function (root) {
  "use strict";

  const items=[
    {
      id:"big-pigs-mouth-source-r1-v1",
      familyId:"big-pigs-mouth-v1",
      variantId:"source-rot0",
      catalogId:"big-pigs-mouth-candidate-v1",
      sourceCaseId:"bood-go-test-j-group-live2-before-move-52",
      boardSize:19,
      quarterTurns:0,
      prompt:"輪到白棋。這是外部 regression 標成 J Group／大豬嘴的固定實戰局面；第一手做活點在哪裡？",
      hint:"只判這個 source case。先看右下角一路附近，不要把「大豬嘴」口訣直接泛化成所有局面。",
      success:"符合 MIT regression 對這個固定局面的 expected move。這只證明 source-case first move，不代表完整大豬嘴答案樹。",
      revealName:"大豬嘴／J Group",
      variationAxes:["source-case:bood-j-group-live2","orientation:rot0"],
      scoringContractVersion:"classic-big-pigs-mouth-source-case-v1"
    },
    {
      id:"big-pigs-mouth-source-r90-v1",
      familyId:"big-pigs-mouth-v1",
      variantId:"source-rot90",
      catalogId:"big-pigs-mouth-candidate-v1",
      sourceCaseId:"bood-go-test-j-group-live2-before-move-52",
      boardSize:19,
      quarterTurns:1,
      prompt:"同一 source case 旋轉 90°。輪到白棋：重新定位等價第一手，不要沿用 R1 座標。",
      hint:"完整棋盤與 expected move 一起旋轉；只比較幾何對稱後的同一 source case。",
      success:"對。旋轉後仍找到 source-case 的等價第一手，排除了只背 R1 的表面座標策略。",
      revealName:"大豬嘴／J Group",
      variationAxes:["source-case:bood-j-group-live2","orientation:rot90","surface-coordinate-control"],
      scoringContractVersion:"classic-big-pigs-mouth-source-case-v1"
    },
    {
      id:"big-pigs-mouth-source-r180-v1",
      familyId:"big-pigs-mouth-v1",
      variantId:"source-rot180",
      catalogId:"big-pigs-mouth-candidate-v1",
      sourceCaseId:"bood-go-test-j-group-live2-before-move-52",
      boardSize:19,
      quarterTurns:2,
      prompt:"同一 source case 旋轉 180°。輪到白棋：找幾何等價的第一手。",
      hint:"不要靠右下角印象；先定位旋轉後的局部角部關係。",
      success:"對。這仍只是同一 source case 的旋轉等價，不是新的獨立大豬嘴證據。",
      revealName:"大豬嘴／J Group",
      variationAxes:["source-case:bood-j-group-live2","orientation:rot180","surface-coordinate-control"],
      scoringContractVersion:"classic-big-pigs-mouth-source-case-v1"
    },
    {
      id:"big-pigs-mouth-source-r270-v1",
      familyId:"big-pigs-mouth-v1",
      variantId:"source-rot270",
      catalogId:"big-pigs-mouth-candidate-v1",
      sourceCaseId:"bood-go-test-j-group-live2-before-move-52",
      boardSize:19,
      quarterTurns:3,
      prompt:"同一 source case 旋轉 270°。輪到白棋：最後一次重新定位第一手。",
      hint:"四題只改 orientation；如果只記原始座標，這題會失敗。",
      success:"對。四向旋轉完成；這只支持同一 MIT source-case 的 orientation robustness。",
      revealName:"大豬嘴／J Group",
      variationAxes:["source-case:bood-j-group-live2","orientation:rot270","surface-coordinate-control"],
      scoringContractVersion:"classic-big-pigs-mouth-source-case-v1"
    }
  ];

  const api=Object.freeze({
    version:"big-pigs-mouth-source-practice-v1",
    scoringContractVersion:"classic-big-pigs-mouth-source-case-v1",
    familyId:"big-pigs-mouth-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoBigPigsMouthSourcePractice=api;
})(typeof window!=="undefined"?window:globalThis);
