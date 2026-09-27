(function (root) {
  "use strict";

  const items=[
    {
      id:"rect-six-horizontal-top-attack-v1",
      familyId:"rectangular-six-v1",
      variantId:"horizontal-top-attack",
      catalogId:"rectangular-six-v1",
      boardSize:8,
      defenderColor:1,
      eyeSpace:[[2,3],[3,3],[4,3],[2,4],[3,4],[4,4]],
      attackPoint:[3,3],
      prompt:"白棋已先佔板六的一個中心。輪到黑棋守，miai 回應在哪裡？",
      hint:"2×3 rectangle 只有兩個 degree-3 中心；對方拿一個，就回另一個。",
      success:"對。板六的兩個中心互為 miai；白棋先佔上中心，黑棋回下中心。",
      revealName:"板六／Rectangular Six",
      variationAxes:["orientation:horizontal","attack:center-a","color:black"],
      scoringContractVersion:"classic-rectangular-six-miai-v1"
    },
    {
      id:"rect-six-horizontal-bottom-attack-v1",
      familyId:"rectangular-six-v1",
      variantId:"horizontal-bottom-attack",
      catalogId:"rectangular-six-v1",
      boardSize:8,
      defenderColor:1,
      eyeSpace:[[2,3],[3,3],[4,3],[2,4],[3,4],[4,4]],
      attackPoint:[3,4],
      prompt:"這次白棋改佔另一個中心。黑棋應回哪一點？",
      hint:"miai 是對稱關係；攻方換中心，守方回應也交換。",
      success:"對。白棋佔下中心，黑棋就回上中心。",
      revealName:"板六／Rectangular Six",
      variationAxes:["orientation:horizontal","attack:center-b","color:black"],
      scoringContractVersion:"classic-rectangular-six-miai-v1"
    },
    {
      id:"rect-six-vertical-white-v1",
      familyId:"rectangular-six-v1",
      variantId:"vertical-white",
      catalogId:"rectangular-six-v1",
      boardSize:8,
      defenderColor:2,
      eyeSpace:[[3,1],[4,1],[3,2],[4,2],[3,3],[4,3]],
      attackPoint:[3,2],
      prompt:"板六旋轉成直向，黑棋已先佔一個中心。白棋守方要回哪一點？",
      hint:"不要記橫向座標；重新找唯二 degree-3 中心。",
      success:"對。旋轉、換色後仍是同一 miai topology。",
      revealName:"板六／Rectangular Six",
      variationAxes:["orientation:vertical","attack:center-a","color:white","surface-coordinate-control"],
      scoringContractVersion:"classic-rectangular-six-miai-v1"
    },
    {
      id:"rect-six-vertical-white-shift-v1",
      familyId:"rectangular-six-v1",
      variantId:"vertical-white-shift",
      catalogId:"rectangular-six-v1",
      boardSize:9,
      defenderColor:2,
      eyeSpace:[[5,3],[6,3],[5,4],[6,4],[5,5],[6,5]],
      attackPoint:[6,4],
      prompt:"最後把直向板六移到右側，黑棋先佔另一中心。白棋的 miai 回應？",
      hint:"只看六點 rectangle 的 degree-3 中心，不看棋盤絕對位置。",
      success:"對。位置、方向、棋色都改變後，仍能由 geometry 找出另一個中心。",
      revealName:"板六／Rectangular Six",
      variationAxes:["orientation:vertical","attack:center-b","color:white","position:shifted","surface-coordinate-control"],
      scoringContractVersion:"classic-rectangular-six-miai-v1"
    }
  ];

  const api=Object.freeze({
    version:"rectangular-six-miai-practice-v1",
    scoringContractVersion:"classic-rectangular-six-miai-v1",
    familyId:"rectangular-six-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoRectangularSixMiaiPractice=api;
})(typeof window!=="undefined"?window:globalThis);
