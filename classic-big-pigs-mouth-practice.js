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
      prompt:"輪到白棋。這是外部測試資料標成 J Group／大豬嘴的固定實戰局面；第一手做活點在哪裡？",
      hint:"只判這個來源局面。先看右下角一路附近，不要把「大豬嘴」口訣直接套用到所有局面。",
      success:"符合 MIT 測試資料對這個固定局面記錄的第一手。這只確認這個來源局面的第一手，不代表完整的大豬嘴後續變化。",
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
      prompt:"同一來源局面旋轉 90°。輪到白棋：重新找出對應的第一手，不要沿用 R1 座標。",
      hint:"完整棋盤與預期著手一起旋轉；只比較旋轉後的同一來源局面。",
      success:"對。旋轉後仍找到來源局面的對應第一手，表示不是只背 R1 的固定座標。",
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
      prompt:"同一來源局面旋轉 180°。輪到白棋：找出旋轉後對應的第一手。",
      hint:"不要靠右下角印象；先定位旋轉後的局部角部關係。",
      success:"對。這仍只是同一來源局面的旋轉版本，不是另一個獨立的大豬嘴局面。",
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
      prompt:"同一來源局面旋轉 270°。輪到白棋：最後一次重新找出第一手。",
      hint:"四題只改方向；如果只記原始座標，這題就會答錯。",
      success:"對。四個方向都完成了；這只表示同一個 MIT 來源局面換方向後，仍能找出對應的第一手。",
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
