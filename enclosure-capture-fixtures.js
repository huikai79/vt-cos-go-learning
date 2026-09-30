(function (root) {
  "use strict";

  const B = 1;
  const W = 2;

  const fixtures = [
    {
      id: "enclosure-center-single-v1",
      version: 1,
      boardSize: 5,
      variationAxes: ["center", "single-stone-target", "orthogonal-escape"],
      sourceLabelCandidate: "unknown",
      setupStones: [[1,2,B],[2,1,B],[1,3,B],[2,4,B],[2,2,W],[4,2,W]],
      targetPoint: [2,2],
      supportPoint: [4,2],
      cutMove: [3,2],
      forcedExtension: [2,3],
      finishMove: [3,3],
      expectedTargetSizeBefore: 1,
      expectedCapturedCount: 2
    },
    {
      id: "enclosure-center-chain-v1",
      version: 1,
      boardSize: 6,
      variationAxes: ["center", "two-stone-target", "orthogonal-escape"],
      sourceLabelCandidate: "unknown",
      setupStones: [[1,2,B],[2,1,B],[3,1,B],[3,3,B],[1,3,B],[2,2,W],[3,2,W],[5,2,W]],
      targetPoint: [2,2],
      supportPoint: [5,2],
      cutMove: [4,2],
      forcedExtension: [2,3],
      finishMove: [2,4],
      expectedTargetSizeBefore: 2,
      expectedCapturedCount: 3
    },
    {
      id: "enclosure-edge-single-v1",
      version: 1,
      boardSize: 5,
      variationAxes: ["edge", "single-stone-target", "edge-limited-escape"],
      sourceLabelCandidate: "unknown",
      setupStones: [[0,0,B],[0,1,B],[1,2,B],[1,0,W],[3,0,W]],
      targetPoint: [1,0],
      supportPoint: [3,0],
      cutMove: [2,0],
      forcedExtension: [1,1],
      finishMove: [2,1],
      expectedTargetSizeBefore: 1,
      expectedCapturedCount: 2
    },
    {
      id: "enclosure-edge-chain-v1",
      version: 1,
      boardSize: 6,
      variationAxes: ["edge", "two-stone-target", "edge-limited-escape"],
      sourceLabelCandidate: "unknown",
      setupStones: [[0,1,B],[1,2,B],[2,0,B],[2,2,B],[1,1,W],[2,1,W],[4,1,W]],
      targetPoint: [1,1],
      supportPoint: [4,1],
      cutMove: [3,1],
      forcedExtension: [1,0],
      finishMove: [0,0],
      expectedTargetSizeBefore: 2,
      expectedCapturedCount: 3
    }
  ];

  const api = { version: 1, familyId: "enclosure_capture", fixtures, BLACK: B, WHITE: W };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoEnclosureCaptureFixtures = api;
})(typeof window !== "undefined" ? window : globalThis);
