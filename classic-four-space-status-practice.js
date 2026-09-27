(function (root) {
  "use strict";

  const items=[
    {
      id:"square-four-defender-first-v1",
      familyId:"four-space-status-v1",
      variantId:"square-defender-first",
      catalogId:"square-four-v1",
      shapeKind:"square-four",
      boardSize:7,
      defenderColor:1,
      eyeSpace:[[2,2],[3,2],[2,3],[3,3]],
      prompt:"輪到黑棋守方先走。這個 2×2 方形四目眼最後能做活嗎？",
      hint:"不要找中心。試想守方補任一點後，剩下三個空點會變成什麼形？",
      success:"對。方四沒有做活急所；守方任一補點都留下曲三，攻方仍能搶彎點，所以仍死。",
      revealName:"方四／Square Four",
      variationAxes:["shape:square-four","role:defender-first","color:black"],
      scoringContractVersion:"classic-four-space-status-v1"
    },
    {
      id:"straight-four-attacker-first-v1",
      familyId:"four-space-status-v1",
      variantId:"straight-attacker-first",
      catalogId:"straight-four-v1",
      shapeKind:"straight-four",
      boardSize:8,
      defenderColor:1,
      eyeSpace:[[2,3],[3,3],[4,3],[5,3]],
      prompt:"輪到白棋攻方先走。這個直線四目眼能被一手殺死嗎？",
      hint:"直四有兩個互為 miai 的做眼點；攻方佔一處，守方還能佔另一處。",
      success:"對。直四是無條件活形；攻方先侵入，守方仍有回應留下兩個分離眼點。",
      revealName:"直四／Straight Four",
      variationAxes:["shape:straight-four","role:attacker-first","color:black"],
      scoringContractVersion:"classic-four-space-status-v1"
    },
    {
      id:"square-four-shift-white-v1",
      familyId:"four-space-status-v1",
      variantId:"square-shift-white",
      catalogId:"square-four-v1",
      shapeKind:"square-four",
      boardSize:8,
      defenderColor:2,
      eyeSpace:[[4,2],[5,2],[4,3],[5,3]],
      prompt:"換位置、換成白棋守方先走。這個方形四目眼最後是活還是死？",
      hint:"顏色與位置不改變 topology；任一守方補點都會留下曲三。",
      success:"對。平移與換色後仍是方四：沒有做活急所，守方先走仍死。",
      revealName:"方四／Square Four",
      variationAxes:["shape:square-four","role:defender-first","color:white","position:shifted"],
      scoringContractVersion:"classic-four-space-status-v1"
    },
    {
      id:"straight-four-shift-white-v1",
      familyId:"four-space-status-v1",
      variantId:"straight-shift-white",
      catalogId:"straight-four-v1",
      shapeKind:"straight-four",
      boardSize:8,
      defenderColor:2,
      eyeSpace:[[1,4],[2,4],[3,4],[4,4]],
      prompt:"換成白棋守、黑棋先侵入。這個直四最後是活還是死？",
      hint:"攻方只能先佔一點；守方仍可選另一個分眼回應。",
      success:"對。直四換色、換位置後仍無條件活；這是 topology，而不是固定座標答案。",
      revealName:"直四／Straight Four",
      variationAxes:["shape:straight-four","role:attacker-first","color:white","position:shifted"],
      scoringContractVersion:"classic-four-space-status-v1"
    }
  ];

  const api=Object.freeze({
    version:"four-space-status-practice-v1",
    scoringContractVersion:"classic-four-space-status-v1",
    familyId:"four-space-status-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoFourSpaceStatusPractice=api;
})(typeof window!=="undefined"?window:globalThis);
