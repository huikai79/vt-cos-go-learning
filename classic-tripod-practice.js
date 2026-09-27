(function (root) {
  "use strict";

  const items=[
    {
      id:"tripod-attack-seed-v1",
      familyId:"tripod-group-v1",
      variantId:"attack-seed",
      catalogId:"tripod-group-v1",
      oracleCaseId:"gnugo-tripod2-r3-v1",
      boardSize:19,
      role:"attack",
      quarterTurns:0,
      prompt:"輪到白棋攻：這是來源固定的 Tripod corner case。第一手攻擊點在哪裡？",
      hint:"只處理這個固定 source position；先看右下角 Tripod group 與一線、二線的氣。",
      success:"符合外部 regression oracle 的第一手攻擊點。這只驗這個固定局面的第一手，不代表所有 Tripod 變化。",
      revealName:"Tripod Group",
      variationAxes:["role:attack","orientation:seed","source-case:tripod2-r3"],
      scoringContractVersion:"classic-tripod-oracle-first-move-v1"
    },
    {
      id:"tripod-defend-seed-v1",
      familyId:"tripod-group-v1",
      variantId:"defend-seed",
      catalogId:"tripod-group-v1",
      oracleCaseId:"gnugo-tripod2-r3-v1",
      boardSize:19,
      role:"defend",
      quarterTurns:0,
      prompt:"換成黑棋守：同一個固定 Tripod case，第一手防守點在哪裡？",
      hint:"攻守答案不是同一點；先看角上的剩餘空間與一線落點。",
      success:"符合外部 regression oracle 的第一手防守點。攻與守分開評分，不把其中一手當成整個 family 的唯一答案。",
      revealName:"Tripod Group",
      variationAxes:["role:defend","orientation:seed","source-case:tripod2-r3"],
      scoringContractVersion:"classic-tripod-oracle-first-move-v1"
    },
    {
      id:"tripod-attack-rot180-v1",
      familyId:"tripod-group-v1",
      variantId:"attack-rot180",
      catalogId:"tripod-group-v1",
      oracleCaseId:"gnugo-tripod2-r3-v1",
      boardSize:19,
      role:"attack",
      quarterTurns:2,
      prompt:"棋盤旋轉 180°。輪到白棋攻：不要沿用右下角座標，重新找對稱後的第一手。",
      hint:"旋轉只改表面位置；source case 的局部關係與 oracle move 一起旋轉。",
      success:"對。旋轉後仍能依局部關係找到攻擊第一手，避免只記原棋盤座標。",
      revealName:"Tripod Group",
      variationAxes:["role:attack","orientation:rot180","surface-coordinate-control"],
      scoringContractVersion:"classic-tripod-oracle-first-move-v1"
    },
    {
      id:"tripod-defend-rot90-v1",
      familyId:"tripod-group-v1",
      variantId:"defend-rot90",
      catalogId:"tripod-group-v1",
      oracleCaseId:"gnugo-tripod2-r3-v1",
      boardSize:19,
      role:"defend",
      quarterTurns:1,
      prompt:"棋盤旋轉 90°。輪到黑棋守：請找對稱後的防守第一手。",
      hint:"不要找原本的 T1；先定位旋轉後的角與 target group。",
      success:"對。這題用旋轉反證固定座標記憶；仍只代表同一 source case 的對稱等價第一手。",
      revealName:"Tripod Group",
      variationAxes:["role:defend","orientation:rot90","surface-coordinate-control"],
      scoringContractVersion:"classic-tripod-oracle-first-move-v1"
    }
  ];

  const api=Object.freeze({
    version:"tripod-practice-v1",
    scoringContractVersion:"classic-tripod-oracle-first-move-v1",
    familyId:"tripod-group-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoTripodPractice=api;
})(typeof window!=="undefined"?window:globalThis);
