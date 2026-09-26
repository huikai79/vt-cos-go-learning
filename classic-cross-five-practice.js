(function (root) {
  "use strict";

  const items=[
    {
      id:"cross-five-defend-center-v1",
      familyId:"cross-five-v1",
      variantId:"defend-center",
      catalogId:"plum-five-candidate-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:1,
      eyeSpace:[[3,2],[2,3],[3,3],[4,3],[3,4]],
      vitalPoint:[3,3],
      prompt:"輪到黑棋：這五個眼空呈十字形。守方要先佔哪一點，才能掌握做活要點？",
      hint:"找唯一同時接觸上下左右四個眼空的點。",
      success:"對。十字形五點眼空的共同急所在中央；守方先走中央可掌握做活方向。",
      revealName:"梅花五／Cross Five",
      variationAxes:["role:defender","position:center"],
      scoringContractVersion:"classic-cross-five-vital-point-v1"
    },
    {
      id:"cross-five-attack-center-v1",
      familyId:"cross-five-v1",
      variantId:"attack-center",
      catalogId:"plum-five-candidate-v1",
      boardSize:7,
      defenderColor:1,
      playerColor:2,
      eyeSpace:[[3,2],[2,3],[3,3],[4,3],[3,4]],
      vitalPoint:[3,3],
      prompt:"輪到白棋：同一個十字五點眼空，攻方要先點哪裡？",
      hint:"守方的做活急所，也是攻方最先要搶的破眼急所。",
      success:"對。攻方同樣先點中央；這一題測角色交換，不是記住黑棋答案。",
      revealName:"梅花五／Cross Five",
      variationAxes:["role:attacker","position:center"],
      scoringContractVersion:"classic-cross-five-vital-point-v1"
    },
    {
      id:"cross-five-defend-left-v1",
      familyId:"cross-five-v1",
      variantId:"defend-left-shift",
      catalogId:"plum-five-candidate-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:2,
      eyeSpace:[[2,2],[1,3],[2,3],[3,3],[2,4]],
      vitalPoint:[2,3],
      prompt:"換成白棋守方，而且整個十字形移到左側。不要找棋盤中央，請找棋形中央。",
      hint:"比較眼空彼此的連接；唯一 degree-4 點才是急所。",
      success:"對。位置改變後，急所仍由棋形結構決定，不是棋盤中心。",
      revealName:"梅花五／Cross Five",
      variationAxes:["role:defender","position:left-shift","color:white"],
      scoringContractVersion:"classic-cross-five-vital-point-v1"
    },
    {
      id:"cross-five-attack-up-v1",
      familyId:"cross-five-v1",
      variantId:"attack-up-shift",
      catalogId:"plum-five-candidate-v1",
      boardSize:7,
      defenderColor:2,
      playerColor:1,
      eyeSpace:[[3,1],[2,2],[3,2],[4,2],[3,3]],
      vitalPoint:[3,2],
      prompt:"最後一題把十字形上移並交換棋色。輪到黑棋攻，第一手共同急所在哪裡？",
      hint:"不要沿用上一題座標；重新找唯一接觸四個眼空的中心。",
      success:"對。跨位置與棋色後仍能找中央，才是在辨識 family，而不是記座標。",
      revealName:"梅花五／Cross Five",
      variationAxes:["role:attacker","position:up-shift","color:black"],
      scoringContractVersion:"classic-cross-five-vital-point-v1"
    }
  ];

  const api=Object.freeze({
    version:"cross-five-practice-v1",
    scoringContractVersion:"classic-cross-five-vital-point-v1",
    familyId:"cross-five-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoCrossFivePractice=api;
})(typeof window!=="undefined"?window:globalThis);
