(function (root) {
  "use strict";

  const items=[
    {
      id:"curved-four-black-v1",
      familyId:"curved-four-status-v1",
      variantId:"curved-black",
      catalogId:"curved-four-v1",
      boardSize:8,
      defenderColor:1,
      eyeSpace:[[2,3],[3,3],[4,3],[4,4]],
      prompt:"輪到白棋攻方先走。這個折彎的四目眼最後是活還是死？",
      hint:"曲四和直四一樣，都有兩個互補的做眼點（見合）；攻方只能先佔其中一處。",
      success:"對。曲四是無條件活形；攻方任一第一手後，守方都有回應留下兩個分離眼點。",
      revealName:"曲四／Curved Four",
      variationAxes:["shape:curved-four","role:attacker-first","color:black"],
      scoringContractVersion:"classic-curved-four-status-v1"
    },
    {
      id:"curved-four-white-shift-v1",
      familyId:"curved-four-status-v1",
      variantId:"curved-white-shift",
      catalogId:"curved-four-v1",
      boardSize:8,
      defenderColor:2,
      eyeSpace:[[1,2],[1,3],[1,4],[2,4]],
      prompt:"曲四旋轉、平移並換成白棋守。黑棋先侵入，最後是活還是死？",
      hint:"不要靠方向記憶；檢查攻方任一侵入後，守方是否仍能留下兩個分離眼點。",
      success:"對。旋轉、平移、換色後，棋形的連接關係沒有改變；完全包圍的曲四仍然是活棋。",
      revealName:"曲四／Curved Four",
      variationAxes:["shape:curved-four","role:attacker-first","color:white","rotation","position:shifted"],
      scoringContractVersion:"classic-curved-four-status-v1"
    }
  ];

  const api=Object.freeze({
    version:"curved-four-status-practice-v1",
    scoringContractVersion:"classic-curved-four-status-v1",
    familyId:"curved-four-status-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoCurvedFourStatusPractice=api;
})(typeof window!=="undefined"?window:globalThis);
