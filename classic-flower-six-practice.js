(function (root) {
  "use strict";

  const items=[
    {
      id:"flower-six-defend-seed-v1",
      familyId:"flower-six-v1",
      variantId:"defend-seed",
      catalogId:"flower-six-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:1,
      eyeSpace:[[2,2],[3,2],[2,3],[3,3],[1,2],[2,1]],
      vitalPoint:[2,2],
      prompt:"輪到黑棋守方：六個眼空像 2×2 方塊在同一角伸出兩個『耳朵』。第一手要先佔哪個共同急所？",
      hint:"不要找整體幾何中心；找唯一直接相鄰四個眼空、位在兩個『耳朵』根部的點。",
      success:"對。六點眼空的共同急所在兩個突出點的根部，也是唯一 degree-4 點。",
      revealName:"花六／Rabbity Six",
      variationAxes:["role:defender","orientation:seed","color:black"],
      scoringContractVersion:"classic-flower-six-vital-point-v1"
    },
    {
      id:"flower-six-attack-seed-v1",
      familyId:"flower-six-v1",
      variantId:"attack-seed",
      catalogId:"flower-six-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:2,
      eyeSpace:[[2,2],[3,2],[2,3],[3,3],[1,2],[2,1]],
      vitalPoint:[2,2],
      prompt:"輪到白棋攻方：同一個六點眼空，若要搶守方的共同急所，第一手在哪裡？",
      hint:"敵之急所也是我之急所；仍找唯一 degree-4 點。",
      success:"對。攻方同樣先搶兩個突出點的根部；角色交換不改變幾何急所。",
      revealName:"花六／Rabbity Six",
      variationAxes:["role:attacker","orientation:seed","color:white"],
      scoringContractVersion:"classic-flower-six-vital-point-v1"
    },
    {
      id:"flower-six-defend-rot90-v1",
      familyId:"flower-six-v1",
      variantId:"defend-rot90",
      catalogId:"flower-six-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:2,
      eyeSpace:[[2,2],[3,2],[2,3],[3,3],[4,2],[3,1]],
      vitalPoint:[3,2],
      prompt:"棋形旋轉、守方換成白棋。不要沿用上一題座標，重新找兩個『耳朵』的根部。",
      hint:"數 adjacency；唯一 degree-4 點就是本題共同急所。",
      success:"對。旋轉與換色後，急所仍由六點眼空的 adjacency 決定。",
      revealName:"花六／Rabbity Six",
      variationAxes:["role:defender","orientation:rot90","color:white"],
      scoringContractVersion:"classic-flower-six-vital-point-v1"
    },
    {
      id:"flower-six-attack-shift-v1",
      familyId:"flower-six-v1",
      variantId:"attack-shift",
      catalogId:"flower-six-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:1,
      eyeSpace:[[3,3],[4,3],[3,4],[4,4],[5,3],[4,2]],
      vitalPoint:[4,3],
      prompt:"最後把整個 family 移位並換成黑棋攻。請只看棋形結構，找共同急所。",
      hint:"不要找棋盤中央；找同時接觸四個眼空的『耳根』。",
      success:"對。位置、棋色與角色都變了，唯一 degree-4 急所仍保持不變。",
      revealName:"花六／Rabbity Six",
      variationAxes:["role:attacker","orientation:rot90","position:right-down","color:black"],
      scoringContractVersion:"classic-flower-six-vital-point-v1"
    }
  ];

  const api=Object.freeze({
    version:"flower-six-practice-v1",
    scoringContractVersion:"classic-flower-six-vital-point-v1",
    familyId:"flower-six-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoFlowerSixPractice=api;
})(typeof window!=="undefined"?window:globalThis);
