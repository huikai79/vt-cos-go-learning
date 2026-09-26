(function (root) {
  "use strict";

  const items=[
    {
      id:"bulky-five-sealed-reduction-seed-v1",
      familyId:"bulky-five-v1",
      variantId:"sealed-reduction-seed",
      boardSize:7,
      defenderColor:1,
      attackerColor:2,
      eyeSpace:[[2,2],[3,2],[2,3],[3,3],[4,3]],
      prompt:"白棋已搶到刀把五急所；黑棋連續在局部手抜き。請把白棋的三顆縮眼子下進正確的 2×2 核心，逼黑棋最後只能提四子。",
      hint:"不要下突出來的那一格。目標是把包含急所的 2×2 方形四格全部佔滿。",
      success:"完成。黑棋只剩突出點一口氣，只能在那裡提掉四顆白子；提完後眼空正好留下 2×2 方四。",
      variationAxes:["orientation:seed","outside-liberties:zero","local-response:tenuki"],
      terminalReference:"square-four",
      scoringContractVersion:"classic-bulky-five-sealed-reduction-v1"
    },
    {
      id:"bulky-five-sealed-reduction-mirror-v1",
      familyId:"bulky-five-v1",
      variantId:"sealed-reduction-mirror",
      boardSize:7,
      defenderColor:1,
      attackerColor:2,
      eyeSpace:[[2,3],[3,3],[4,3],[3,2],[4,2]],
      prompt:"同樣是無外氣的刀把五，但棋形鏡像。黑棋不在局部應手時，白棋要連續填哪三點，才能逼黑棋提四子後留下方四？",
      hint:"先找這個鏡像裡唯一的 2×2 核心；突出點要留給黑棋最後提子。",
      success:"完成。鏡像不改變機制：三顆縮眼子補滿 2×2 核心，突出點成為黑棋唯一一口氣與被迫提子點。",
      variationAxes:["orientation:mirror","outside-liberties:zero","local-response:tenuki"],
      terminalReference:"square-four",
      scoringContractVersion:"classic-bulky-five-sealed-reduction-v1"
    }
  ];

  const api=Object.freeze({
    version:"classic-shape-reduction-v1",
    scoringContractVersion:"classic-bulky-five-sealed-reduction-v1",
    items
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoClassicShapeReduction=api;
})(typeof window!=="undefined"?window:globalThis);
