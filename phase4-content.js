(function (root) {
  "use strict";
  const B = 1;
  const W = 2;

  // These probes deliberately omit skill labels and focus rings. They only
  // test cue-reduced local recognition, not whole-board best-move judgment.
  const fixedApplicationProbes = [
    {
      id: "p4-app-capture", purpose: "fixed_application_probe", taskMode: "應用", boardSize: 9, contentVersion: 2,
      type: "move", playerColor: B, stones: [[3, 4, B], [4, 3, B], [5, 4, B], [4, 4, W], [1, 1, B], [7, 7, W]],
      answer: [4, 5], goal: { type: "capture", target: [4, 4], count: 1 }, focus: [],
      title: "沒有技能提示時找出局部強制手", prompt: "輪到黑棋。找出一手可由局部氣數直接判定的棋。",
      hint: "逐串確認氣數；顯示提示後不算無提示首答。", explanation: "這手讓中央白棋沒有氣。這個結果只支持局部一手提子的自行發現。",
      feedbackPolicy: "after_batch", skillCue: false, transferLevel: "fixed_local_probe", applicability: "applicable",
      claimScope: "cue_reduced_local_skill_detection", scoringClaim: "檢查未顯示技能名稱時，能否自行找到局部一手提子；不評分全局最佳手。"
    },
    {
      id: "p4-app-join", purpose: "fixed_application_probe", taskMode: "應用", boardSize: 9, contentVersion: 2,
      type: "move", playerColor: B, stones: [[3, 4, B], [5, 4, B], [1, 6, W], [7, 2, W]],
      answer: [4, 4], goal: { type: "join", targets: [[3, 4], [5, 4]] }, focus: [],
      title: "沒有技能提示時找出直接連接點", prompt: "輪到黑棋。找出一手可由局部連接關係直接判定的棋。",
      hint: "檢查哪些空點同時接觸自己的兩串棋。", explanation: "補上共同相鄰點後，兩串黑棋沿線成為同一串。",
      feedbackPolicy: "after_batch", skillCue: false, transferLevel: "fixed_local_probe", applicability: "applicable",
      claimScope: "cue_reduced_local_skill_detection", scoringClaim: "檢查未顯示技能名稱時，能否自行找到一手直接連接；不評分全局最佳手。"
    },
    {
      id: "p4-app-no-forced-local", purpose: "fixed_application_probe", taskMode: "應用", boardSize: 9, contentVersion: 2,
      type: "choice", stones: [[2, 2, B], [6, 6, W]], focus: [], options: ["立刻在中央補一手", "先找其他有明確急迫性的地方", "把兩顆斜對角棋當成同一串"], answer: 1,
      title: "沒有強制局部手時，先保留判斷", prompt: "這個局部沒有可可靠判定的立即危機。下一步較合適的處理是？",
      hint: "題目沒有提供足夠全局資訊時，不要硬編唯一座標。", explanation: "這是「不適用」對照：局部沒有立即可評分的強制手，應回到全局尋找急處。",
      feedbackPolicy: "after_batch", skillCue: false, transferLevel: "fixed_local_probe", applicability: "not_applicable",
      claimScope: "reject_unsupported_local_application", scoringClaim: "檢查資訊不足時是否避免硬套局部技能；不指定全局落子。"
    },
    {
      id: "p4-app-capture-not-ready", purpose: "fixed_application_probe", taskMode: "應用", boardSize: 9, contentVersion: 1,
      type: "choice", stones: [[3, 4, B], [5, 4, B], [4, 4, W]], focus: [], options: ["白棋已只剩一口氣，可以立刻提掉", "白棋仍有兩口氣，不能判成一手提子", "中央三顆棋已連成同一串"], answer: 1,
      title: "相似棋形不一定已經可以提子", prompt: "只依目前局部氣數，哪個判斷成立？",
      hint: "逐一數白棋上下左右仍相鄰的空點。", explanation: "中央白棋上下仍有兩口氣；這不是一手提子的適用局面。",
      feedbackPolicy: "after_batch", skillCue: false, transferLevel: "fixed_local_probe", applicability: "not_applicable",
      claimScope: "reject_unsupported_local_application", scoringClaim: "檢查是否會在目標棋串仍有兩口氣時誤用一手提子。"
    },
    {
      id: "p4-app-join-not-unique", purpose: "fixed_application_probe", taskMode: "應用", boardSize: 9, contentVersion: 1,
      type: "choice", stones: [[3, 3, B], [4, 4, B]], focus: [], options: ["只有一個唯一連接點", "有兩個一手可直接連接的空點，不能指定唯一答案", "兩顆黑棋已沿線相連"], answer: 1,
      title: "先檢查是否真的只有一個連接點", prompt: "只依目前局部連接關係，哪個判斷成立？",
      hint: "找同時與兩顆黑棋沿線相鄰的空點。", explanation: "兩顆斜對角黑棋有兩個共同相鄰空點；若題目要求唯一座標，資訊不足。",
      feedbackPolicy: "after_batch", skillCue: false, transferLevel: "fixed_local_probe", applicability: "not_applicable",
      claimScope: "reject_unsupported_local_application", scoringClaim: "檢查是否會把具有兩個直接連接點的局面誤判成唯一答案。"
    }
  ];

  // A local, auditable sample: Black's first move captures the white stone.
  const sampleSgf = "(;GM[1]FF[4]CA[UTF-8]SZ[9]AB[de][ed][fe]AW[ee];B[ef])";
  const api = { fixedApplicationProbes, sampleSgf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoPhase4Content = api;
})(typeof window !== "undefined" ? window : globalThis);
