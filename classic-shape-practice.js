(function (root) {
  "use strict";

  const items = [
    {
      id: "bulky-five-defend-seed-v1",
      familyId: "bulky-five-v1",
      variantId: "defend-seed",
      catalogId: "knife-five-candidate-v1",
      boardSize: 7,
      defenderColor: 1,
      playerColor: 1,
      eyeSpace: [[2,2],[3,2],[2,3],[3,3],[4,3]],
      vitalPoint: [3,3],
      prompt: "輪到黑棋：先不要猜名型。五個眼空裡，哪一點是守方最重要的共同急所？",
      hint: "只看五個空點彼此怎麼相連：找唯一同時接觸三個眼空的位置。",
      success: "找到共同急所。守方先佔這一點，能掌握這個五點眼形的生死方向。",
      revealName: "刀把五／Bulky Five",
      variationAxes: ["role:defender","orientation:seed"],
      scoringContractVersion: "classic-vital-point-v1"
    },
    {
      id: "bulky-five-attack-seed-v1",
      familyId: "bulky-five-v1",
      variantId: "attack-seed",
      catalogId: "knife-five-candidate-v1",
      boardSize: 7,
      defenderColor: 1,
      playerColor: 2,
      eyeSpace: [[2,2],[3,2],[2,3],[3,3],[4,3]],
      vitalPoint: [3,3],
      prompt: "輪到白棋：同一個五點眼空，攻方要先搶哪個共同急所？",
      hint: "守方想先佔的地方，也往往是攻方要先搶的地方。",
      success: "同一點也是攻方急所。這就是「敵之急所，我之急所」在大眼死活中的典型例子。",
      revealName: "刀把五／Bulky Five",
      variationAxes: ["role:attacker","orientation:seed"],
      scoringContractVersion: "classic-vital-point-v1"
    },
    {
      id: "bulky-five-defend-rot90-v1",
      familyId: "bulky-five-v1",
      variantId: "defend-rot90",
      catalogId: "knife-five-candidate-v1",
      boardSize: 7,
      defenderColor: 1,
      playerColor: 1,
      eyeSpace: [[2,2],[2,3],[3,2],[3,3],[3,4]],
      vitalPoint: [3,3],
      prompt: "輪到黑棋：棋形轉了方向，不看名稱，還找得到共同急所嗎？",
      hint: "不要記座標；找那個在眼空圖上接觸三個鄰點的位置。",
      success: "方向改變後，幾何關係沒有變；共同急所仍是唯一接觸三個眼空的點。",
      revealName: "刀把五／Bulky Five",
      variationAxes: ["role:defender","orientation:rot90"],
      scoringContractVersion: "classic-vital-point-v1"
    },
    {
      id: "bulky-five-attack-mirror-v1",
      familyId: "bulky-five-v1",
      variantId: "attack-mirror",
      catalogId: "knife-five-candidate-v1",
      boardSize: 7,
      defenderColor: 1,
      playerColor: 2,
      eyeSpace: [[2,3],[3,3],[4,3],[3,2],[4,2]],
      vitalPoint: [3,3],
      prompt: "輪到白棋：換成鏡像後，攻方第一手應搶哪裡？",
      hint: "比較每個空點的相鄰關係；共同急所仍有唯一的三個眼空鄰點。",
      success: "鏡像不改變名型的共同急所結構。這一層測的是幾何辨識，不是記住前一題座標。",
      revealName: "刀把五／Bulky Five",
      variationAxes: ["role:attacker","orientation:mirror"],
      scoringContractVersion: "classic-vital-point-v1"
    }
  ];

  const api = Object.freeze({
    version: "classic-shape-practice-v1",
    scoringContractVersion: "classic-vital-point-v1",
    familyId: "bulky-five-v1",
    items
  });

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoClassicShapePractice = api;
})(typeof window !== "undefined" ? window : globalThis);
