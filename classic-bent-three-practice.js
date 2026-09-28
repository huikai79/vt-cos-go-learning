(function (root) {
  "use strict";

  const items=[
    {
      id:"bent-three-defend-center-v1",
      familyId:"bent-three-v1",
      variantId:"defend-center",
      catalogId:"bent-three-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:1,
      eyeSpace:[[3,2],[3,3],[4,3]],
      prompt:"輪到黑棋守：這三個眼空彎成 L 形。守方要先佔哪一點才能做活？",
      hint:"找唯一同時接觸另外兩個眼空的彎點。",
      success:"對。曲三／Bent Three 的共同急所在 L 形彎點；守方先佔可做活。",
      revealName:"曲三／Bent Three",
      variationAxes:["role:defender","orientation:down-right","color:black"],
      scoringContractVersion:"classic-bent-three-vital-point-v1"
    },
    {
      id:"bent-three-attack-center-v1",
      familyId:"bent-three-v1",
      variantId:"attack-center",
      catalogId:"bent-three-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:2,
      eyeSpace:[[3,2],[3,3],[4,3]],
      prompt:"輪到白棋攻：同一個 L 形三點眼空，第一手要先點哪裡？",
      hint:"敵我共同急所相同；先找 L 形唯一的彎角。",
      success:"對。攻方同樣先點唯一的彎角；本區只評第一手共同急所。",
      revealName:"曲三／Bent Three",
      variationAxes:["role:attacker","orientation:down-right","color:white"],
      scoringContractVersion:"classic-bent-three-vital-point-v1"
    },
    {
      id:"bent-three-defend-rot90-v1",
      familyId:"bent-three-v1",
      variantId:"defend-rot90",
      catalogId:"bent-three-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:2,
      eyeSpace:[[2,3],[3,3],[3,4]],
      prompt:"棋形旋轉並換成白棋守。請重新找 L 形彎點，不要沿用上一題座標。",
      hint:"看三個眼位彼此怎麼連接；只有彎角同時連著另外兩點。",
      success:"對。旋轉與換色後，仍能從棋形結構找到同一個急所。",
      revealName:"曲三／Bent Three",
      variationAxes:["role:defender","orientation:down-left","color:white","surface-coordinate-control"],
      scoringContractVersion:"classic-bent-three-vital-point-v1"
    },
    {
      id:"bent-three-attack-shift-v1",
      familyId:"bent-three-v1",
      variantId:"attack-shift",
      catalogId:"bent-three-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:1,
      eyeSpace:[[1,2],[2,2],[2,1]],
      prompt:"最後把曲三移到左上，輪到黑棋攻。第一手共同急所在哪裡？",
      hint:"不要找棋盤中心；找眼空裡唯一連到另外兩點的位置。",
      success:"對。位置、方向、棋色都改變後，仍能從棋形結構找到彎角。",
      revealName:"曲三／Bent Three",
      variationAxes:["role:attacker","orientation:up-left","position:upper-left","color:black","surface-coordinate-control"],
      scoringContractVersion:"classic-bent-three-vital-point-v1"
    }
  ];

  const api=Object.freeze({
    version:"bent-three-practice-v1",
    scoringContractVersion:"classic-bent-three-vital-point-v1",
    familyId:"bent-three-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoBentThreePractice=api;
})(typeof window!=="undefined"?window:globalThis);
