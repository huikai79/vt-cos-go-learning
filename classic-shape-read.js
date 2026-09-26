(function (root) {
  "use strict";

  const Practice = root.GoClassicShapePractice || (typeof require === "function" ? require("./classic-shape-practice.js") : null);
  if (!Practice) throw new Error("Classic shape practice dependency missing.");

  const attackerSeed = Practice.items.find((item) => item.id === "bulky-five-attack-seed-v1");
  const attackerMirror = Practice.items.find((item) => item.id === "bulky-five-attack-mirror-v1");
  if (!attackerSeed || !attackerMirror) throw new Error("Bulky-five attacker base item missing.");

  const items = [
    {
      id: "bulky-five-short-read-seed-a-v1",
      familyId: "bulky-five-v1",
      variantId: "short-read-seed-a",
      baseItem: attackerSeed,
      defenderReply: [3,2],
      attackerFollowup: [2,3],
      prompt: "白棋已先搶共同急所。若黑棋接著走上方的 A 點，白棋下一手應佔哪裡？",
      hint: "A、B 是一對互補點：守方拿一個，攻方就拿另一個。",
      success: "對。守方走 A，攻方就走 B；這是刀把五急所之後最短的 A/B 互補讀法。",
      variationAxes: ["orientation:seed","defender-reply:A"],
      scoringContractVersion: "classic-bulky-five-short-read-v1"
    },
    {
      id: "bulky-five-short-read-seed-b-v1",
      familyId: "bulky-five-v1",
      variantId: "short-read-seed-b",
      baseItem: attackerSeed,
      defenderReply: [2,3],
      attackerFollowup: [3,2],
      prompt: "白棋已先搶共同急所。這次黑棋改走左側的 B 點，白棋下一手怎麼回？",
      hint: "不要背上題座標；找另一個還沒被佔的 A/B 對稱點。",
      success: "對。守方改走 B，攻方就補 A；兩條主要應手互為鏡像。",
      variationAxes: ["orientation:seed","defender-reply:B"],
      scoringContractVersion: "classic-bulky-five-short-read-v1"
    },
    {
      id: "bulky-five-short-read-mirror-v1",
      familyId: "bulky-five-v1",
      variantId: "short-read-mirror",
      baseItem: attackerMirror,
      defenderReply: [4,2],
      attackerFollowup: [3,3],
      prompt: "棋形鏡像後，白棋已佔急所；黑棋走其中一個 A/B 應手，白棋要怎麼補另一點？",
      hint: "先重新找 A/B pair，不要沿用 seed 的座標。",
      success: "對。方向改變後，A/B 的幾何互補關係仍然成立。",
      variationAxes: ["orientation:mirror","defender-reply:A"],
      scoringContractVersion: "classic-bulky-five-short-read-v1"
    }
  ];

  const api = Object.freeze({
    version: "classic-shape-read-v1",
    scoringContractVersion: "classic-bulky-five-short-read-v1",
    items
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoClassicShapeRead = api;
})(typeof window !== "undefined" ? window : globalThis);
