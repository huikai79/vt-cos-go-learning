(function (root) {
  "use strict";

  const rounds=[
    {
      id:"contrast-01-bulky-rot90",
      sourceType:"bulky-five",
      sourceItemId:"bulky-five-defend-rot90-v1",
      prompt:"名型名稱先隱藏。輪到守方：只看五個眼空的連接關係，請找共同急所。",
      revealNote:"這題是刀把五；關鍵不是方向，而是唯一 degree-3 急所。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    },
    {
      id:"contrast-02-cross-up",
      sourceType:"cross-five",
      sourceItemId:"cross-five-attack-up-v1",
      prompt:"換了一個五點 family。輪到攻方：不要猜名稱，直接從幾何找第一手共同急所。",
      revealNote:"這題是梅花五／Cross Five；急所是十字形唯一 degree-4 中心。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    },
    {
      id:"contrast-03-bulky-mirror",
      sourceType:"bulky-five",
      sourceItemId:"bulky-five-attack-mirror-v1",
      prompt:"再換 family 與方向。輪到攻方：找出真正的共同急所，不要沿用上一題中心規則。",
      revealNote:"刀把五不是 degree-4 十字中心；它的共同急所是唯一 degree-3 點。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    },
    {
      id:"contrast-04-cross-left",
      sourceType:"cross-five",
      sourceItemId:"cross-five-defend-left-v1",
      prompt:"輪到守方。整個棋形移到左側；請找棋形中央，而不是棋盤中央。",
      revealNote:"梅花五／Cross Five 的中心隨棋形平移；唯一 degree-4 點仍是急所。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    },
    {
      id:"contrast-05-bulky-seed",
      sourceType:"bulky-five",
      sourceItemId:"bulky-five-defend-seed-v1",
      prompt:"最後兩題繼續交錯。輪到守方：這次五點形不是十字，請重新判斷 adjacency。",
      revealNote:"這題回到刀把五；不能因為都是五點眼空就套用梅花五中心規則。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    },
    {
      id:"contrast-06-cross-center",
      sourceType:"cross-five",
      sourceItemId:"cross-five-attack-center-v1",
      prompt:"最後一題。輪到攻方：名稱仍隱藏，請只靠眼空連接找到第一手。",
      revealNote:"這題是梅花五／Cross Five；唯一 degree-4 中心就是共同急所。",
      scoringContractVersion:"classic-contrast-vital-point-v1"
    }
  ];

  const api=Object.freeze({
    version:"classic-contrast-practice-v1",
    scoringContractVersion:"classic-contrast-vital-point-v1",
    rounds
  });
  if (typeof module!=="undefined" && module.exports) module.exports=api;
  root.GoClassicContrastPractice=api;
})(typeof window!=="undefined"?window:globalThis);
