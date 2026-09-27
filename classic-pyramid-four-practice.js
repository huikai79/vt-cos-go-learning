(function (root) {
  "use strict";

  const items=[
    {
      id:"pyramid-four-defend-center-v1",
      familyId:"pyramid-four-v1",
      variantId:"defend-center",
      catalogId:"pyramid-four-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:1,
      eyeSpace:[[3,2],[2,3],[3,3],[4,3]],
      prompt:"輪到黑棋守：這四個眼空是 T 形。守方要先佔哪一點，才能掌握做活急所？",
      hint:"找唯一同時接觸另外三個眼空的點。",
      success:"對。丁四／Pyramid Four 的共同急所在 T 形中心；守方先佔中心可做活。",
      revealName:"丁四／Pyramid Four",
      variationAxes:["role:defender","orientation:down","color:black"],
      scoringContractVersion:"classic-pyramid-four-vital-point-v1"
    },
    {
      id:"pyramid-four-attack-center-v1",
      familyId:"pyramid-four-v1",
      variantId:"attack-center",
      catalogId:"pyramid-four-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:2,
      eyeSpace:[[3,2],[2,3],[3,3],[4,3]],
      prompt:"輪到白棋攻：同一個 T 形四點眼空，第一手要先點哪裡？",
      hint:"敵我共同急所相同；不要被棋色改變干擾。",
      success:"對。攻方同樣先點唯一 degree-3 中心；只評這個共同第一手，不宣稱完整吃淨答案樹。",
      revealName:"丁四／Pyramid Four",
      variationAxes:["role:attacker","orientation:down","color:white"],
      scoringContractVersion:"classic-pyramid-four-vital-point-v1"
    },
    {
      id:"pyramid-four-defend-rot90-v1",
      familyId:"pyramid-four-v1",
      variantId:"defend-rot90",
      catalogId:"pyramid-four-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:2,
      eyeSpace:[[3,2],[3,3],[4,3],[3,4]],
      prompt:"棋形旋轉到右向，並換成白棋守。請重新找 T 形中心，不要沿用上一題座標。",
      hint:"只看四個空點彼此的鄰接；唯一 degree-3 點就是急所。",
      success:"對。旋轉與換色後仍由幾何決定急所，排除固定座標記憶。",
      revealName:"丁四／Pyramid Four",
      variationAxes:["role:defender","orientation:right","color:white","surface-coordinate-control"],
      scoringContractVersion:"classic-pyramid-four-vital-point-v1"
    },
    {
      id:"pyramid-four-attack-shift-v1",
      familyId:"pyramid-four-v1",
      variantId:"attack-shift",
      catalogId:"pyramid-four-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:1,
      eyeSpace:[[2,1],[1,2],[2,2],[3,2]],
      prompt:"最後把 T 形移到左上，輪到黑棋攻。第一手共同急所在哪裡？",
      hint:"不要找棋盤中心；找棋形裡唯一連到三個鄰點的位置。",
      success:"對。位置、方向、棋色都改變後，仍能靠 geometry 找到急所。",
      revealName:"丁四／Pyramid Four",
      variationAxes:["role:attacker","orientation:down","position:upper-left","color:black","surface-coordinate-control"],
      scoringContractVersion:"classic-pyramid-four-vital-point-v1"
    }
  ];

  const api=Object.freeze({
    version:"pyramid-four-practice-v1",
    scoringContractVersion:"classic-pyramid-four-vital-point-v1",
    familyId:"pyramid-four-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoPyramidFourPractice=api;
})(typeof window!=="undefined"?window:globalThis);
