(function (root) {
  "use strict";
  const B = 1;
  const W = 2;
  const boardSize = 9;
  const foundationBank = typeof module !== "undefined" && module.exports ? require("./phase2-foundation-bank.js") : root.GoPhase2FoundationBank;
  const lifeAndDeathBank = typeof module !== "undefined" && module.exports ? require("./phase2-life-death-bank.js") : root.GoPhase2LifeAndDeathBank;
  if (!foundationBank || !lifeAndDeathBank) throw new Error("Phase 2 題庫模組載入不完整");

  function point(x, y) { return [x, y]; }
  function key([x, y]) { return `${x},${y}`; }
  function unique(points) { return [...new Map(points.map((item) => [key(item), item])).values()]; }
  function usageFor(familyIndex, variantIndex, familyCount) {
    const practiceCutoff = Math.max(1, Math.floor(familyCount * 0.5));
    const bucket = familyIndex < practiceCutoff ? "practice" : familyIndex >= familyCount - 2 ? "holdout" : "process_check";
    return {
      pool: bucket,
      transferLevel: bucket === "practice" ? "T0" : "T2",
      evaluationBatch: bucket === "holdout" ? (variantIndex % 2 ? "rotation-b" : "rotation-a") : null,
      feedbackPolicy: bucket === "holdout" ? "after_batch" : "immediate"
    };
  }

  function makeCapture({ id, familyId, familyIndex, variantIndex, familyCount, x, y, group = "single", open }) {
    const targets = group === "single" ? [point(x, y)] : group === "horizontal" ? [point(x, y), point(x + 1, y)] : [point(x, y), point(x, y + 1)];
    const neighbors = unique(targets.flatMap(([tx, ty]) => [point(tx - 1, ty), point(tx + 1, ty), point(tx, ty - 1), point(tx, ty + 1)])).filter((item) => !targets.some((target) => key(target) === key(item)));
    const stones = [...targets.map(([tx, ty]) => [tx, ty, W]), ...neighbors.filter((item) => key(item) !== key(open)).map(([nx, ny]) => [nx, ny, B])];
    return {
      id, familyId, variantFamily: familyId, skillId: "capture-last-liberty-v1", contentVersion: 1, itemVersion: 1, boardSize, stones,
      type: "move", answer: open, goal: { type: "capture", target: targets[0], count: targets.length },
      title: "找出最後一口氣", prompt: "輪到黑棋。提掉金色圈出的白棋串。", hint: "先找這串白棋唯一沒有被堵住的相鄰空點。",
      explanation: "落在最後一口氣上，白棋串立刻沒有氣而被提走。", focus: targets,
      taskFeatures: { targetGroupSize: targets.length, targetLiberties: 1, responseType: "落子", readingDepth: 1, branchCount: 1, ko: false },
      ...usageFor(familyIndex, variantIndex, familyCount)
    };
  }

  function makeJoin({ id, familyId, familyIndex, variantIndex, familyCount, x, y, axis, leftSize }) {
    const left = axis === "horizontal" ? Array.from({ length: leftSize }, (_, index) => point(x - 1 - index, y)) : Array.from({ length: leftSize }, (_, index) => point(x, y - 1 - index));
    const right = axis === "horizontal" ? [point(x + 1, y)] : [point(x, y + 1)];
    const stones = [...left, ...right].map(([sx, sy]) => [sx, sy, B]);
    return {
      id, familyId, variantFamily: familyId, skillId: "direct-join-v1", contentVersion: 1, itemVersion: 1, boardSize, stones,
      type: "move", answer: point(x, y), goal: { type: "join", targets: [left[0], right[0]] },
      title: "補上直接連接點", prompt: "輪到黑棋。把金色圈出的兩串黑棋直接連成一串。", hint: "找兩串黑棋共同相鄰、而且仍是空的交叉點。",
      explanation: "落在共同空點後，兩串黑棋沿線相連，成為同一串。", focus: [left[0], right[0]],
      taskFeatures: { targetGroupSize: left.length + right.length, sharedLiberties: 1, connectionAxis: axis === "horizontal" ? "水平" : "垂直", responseType: "落子", readingDepth: 1, branchCount: 1, ko: false },
      ...usageFor(familyIndex, variantIndex, familyCount)
    };
  }

  function makeRescue({ id, familyId, familyIndex, variantIndex, familyCount, x, y, open }) {
    const target = point(x, y);
    const neighbors = [point(x - 1, y), point(x + 1, y), point(x, y - 1), point(x, y + 1)];
    const stones = [[x, y, B], ...neighbors.filter((item) => key(item) !== key(open)).map(([nx, ny]) => [nx, ny, W])];
    return {
      id, familyId, variantFamily: familyId, skillId: "rescue-last-liberty-foundation-v1", contentVersion: 1, itemVersion: 1, boardSize, stones,
      type: "move", answer: open, goal: { type: "rescue", target },
      title: "延長並救出被打吃的棋", prompt: "輪到黑棋。讓金色圈出的黑棋不再只剩一口氣。", hint: "先找黑棋唯一的氣；落下後再看整串棋有幾口氣。",
      explanation: "延長到最後一口氣後，黑棋串的氣增加，暫時逃出打吃。", focus: [target],
      taskFeatures: { targetGroupSize: 1, targetLiberties: 1, responseType: "落子", readingDepth: 1, branchCount: 1, ko: false },
      ...usageFor(familyIndex, variantIndex, familyCount)
    };
  }

  function straightThreeShape(cx, cy, axis, color) {
    const horizontal = axis === "horizontal";
    const interior = [-1, 0, 1].map((offset) => horizontal ? point(cx + offset, cy) : point(cx, cy + offset));
    const border = [];
    for (let offset = -2; offset <= 2; offset += 1) {
      border.push(horizontal ? point(cx + offset, cy - 1) : point(cx - 1, cy + offset));
      border.push(horizontal ? point(cx + offset, cy + 1) : point(cx + 1, cy + offset));
    }
    border.push(horizontal ? point(cx - 2, cy) : point(cx, cy - 2));
    border.push(horizontal ? point(cx + 2, cy) : point(cx, cy + 2));
    const borderKeys = new Set(border.map(key));
    const interiorKeys = new Set(interior.map(key));
    const opponent = color === B ? W : B;
    const outside = unique(border.flatMap(([x, y]) => [point(x - 1, y), point(x + 1, y), point(x, y - 1), point(x, y + 1)]))
      .filter(([x, y]) => x >= 0 && x < boardSize && y >= 0 && y < boardSize && !borderKeys.has(`${x},${y}`) && !interiorKeys.has(`${x},${y}`));
    return { interior, boundary: unique(border), stones: [...unique(border).map(([x, y]) => [x, y, color]), ...outside.map(([x, y]) => [x, y, opponent])] };
  }

  function makeStraightThree({ id, familyId, familyIndex, variantIndex, familyCount, cx, cy, axis, mode }) {
    const color = mode === "live" ? B : W;
    const shape = straightThreeShape(cx, cy, axis, color);
    const answer = point(cx, cy);
    const live = mode === "live";
    return {
      id, familyId, variantFamily: familyId,
      skillId: live ? "make-two-eyes-straight-three-v1" : "kill-straight-three-v1",
      contentVersion: 1, itemVersion: 1, boardSize, stones: shape.stones,
      type: "move", answer, goal: { type: "exact", answer, pattern: "straight-three-vital-point" },
      title: live ? "直三一手做活" : "直三一手破眼",
      prompt: live ? "輪到黑棋。佔住急所，把三個相連空點分成兩個真眼。" : "輪到黑棋。佔住急所，阻止白棋把直三做成兩眼。",
      hint: "先看三個相連空點的正中央；再想對方若先佔中央會發生什麼。",
      explanation: live ? "黑棋下在直三中央，把左右兩個空點分開；每個空點都被黑棋包住，形成兩個真眼。" : "黑棋先佔直三中央，白棋就不能用同一個急所把兩端分成兩個真眼。這題只評第一手急所。",
      focus: shape.boundary,
      taskFeatures: { eyeSpace: "straight-three", objective: live ? "make_two_eyes" : "deny_two_eyes", orientation: axis, responseType: "落子", readingDepth: live ? 1 : 3, branchCount: live ? 1 : 2, ko: false },
      ...usageFor(familyIndex, variantIndex, familyCount)
    };
  }

  function secondEyeShape(cx, cy, axis, color) {
    const horizontal = axis === "horizontal";
    const cavities = horizontal ? [point(cx - 1, cy), point(cx + 1, cy)] : [point(cx, cy - 1), point(cx, cy + 1)];
    const gap = horizontal ? point(cx + 1, cy - 1) : point(cx - 1, cy + 1);
    const boundary = [];
    for (let offset = -2; offset <= 2; offset += 1) {
      boundary.push(horizontal ? point(cx + offset, cy - 1) : point(cx - 1, cy + offset));
      boundary.push(horizontal ? point(cx + offset, cy + 1) : point(cx + 1, cy + offset));
    }
    boundary.push(horizontal ? point(cx - 2, cy) : point(cx, cy - 2));
    boundary.push(point(cx, cy));
    boundary.push(horizontal ? point(cx + 2, cy) : point(cx, cy + 2));
    const gapKey = key(gap);
    const actualBoundary = unique(boundary).filter((item) => key(item) !== gapKey);
    const reserved = new Set([...cavities, gap].map(key));
    const boundaryKeys = new Set(actualBoundary.map(key));
    const opponent = color === B ? W : B;
    const outside = unique(actualBoundary.flatMap(([x, y]) => [point(x - 1, y), point(x + 1, y), point(x, y - 1), point(x, y + 1)]))
      .filter(([x, y]) => x >= 0 && x < boardSize && y >= 0 && y < boardSize && !boundaryKeys.has(`${x},${y}`) && !reserved.has(`${x},${y}`));
    return { cavities, gap, boundary: actualBoundary, stones: [...actualBoundary.map(([x, y]) => [x, y, color]), ...outside.map(([x, y]) => [x, y, opponent])] };
  }

  function makeSecondEye({ id, familyId, familyIndex, variantIndex, familyCount, cx, cy, axis, mode }) {
    const live = mode === "live";
    const shape = secondEyeShape(cx, cy, axis, live ? B : W);
    return {
      id, familyId, variantFamily: familyId,
      skillId: live ? "complete-second-eye-v1" : "block-second-eye-v1",
      contentVersion: 1, itemVersion: 1, boardSize, stones: shape.stones,
      type: "move", answer: shape.gap, goal: { type: "exact", answer: shape.gap, pattern: "second-eye-boundary-gap" },
      title: live ? "補完整第二眼" : "搶先破壞第二眼",
      prompt: live ? "輪到黑棋。補住眼形邊界的缺口，讓兩個空點都成為真眼。" : "輪到黑棋。搶先佔住白棋眼形邊界的缺口，阻止它做出第二眼。",
      hint: "左邊已有一眼；再看右邊空點周圍少了哪一顆棋。",
      explanation: live ? "黑棋補上邊界缺口後，兩個分開空點都由同一串黑棋包住，形成兩個真眼。" : "黑棋從外側佔住缺口後，右邊空點與黑棋相鄰，不能成為白棋的第二個真眼。",
      focus: shape.boundary,
      taskFeatures: { eyeSpace: "two-chambers-one-gap", objective: live ? "complete_second_eye" : "block_second_eye", orientation: axis, responseType: "落子", readingDepth: live ? 1 : 2, branchCount: 1, ko: false, cavities: shape.cavities },
      ...usageFor(familyIndex, variantIndex, familyCount)
    };
  }

  const phase2Problems = [];
  const { captureFamilies, joinFamilies, rescueFamilies } = foundationBank;
  captureFamilies.forEach((family, familyIndex) => family.positions.forEach(([x, y], variantIndex) => {
    phase2Problems.push(makeCapture({ id: `p2-c-${familyIndex + 1}-${variantIndex + 1}`, familyId: family.familyId, familyIndex, variantIndex, familyCount: captureFamilies.length, x, y, group: family.group, open: family.opens[variantIndex] }));
  }));

  joinFamilies.forEach((family, familyIndex) => family.positions.forEach(([x, y], variantIndex) => {
    phase2Problems.push(makeJoin({ id: `p2-j-${familyIndex + 1}-${variantIndex + 1}`, familyId: `p2-join-${family.axis}-${family.leftSize}-${familyIndex + 1}`, familyIndex, variantIndex, familyCount: joinFamilies.length, x, y, axis: family.axis, leftSize: family.leftSize }));
  }));

  rescueFamilies.forEach((family, familyIndex) => family.positions.forEach(([x, y], variantIndex) => {
    const [dx, dy] = family.opens[variantIndex];
    phase2Problems.push(makeRescue({ id: `p2-r-${familyIndex + 1}-${variantIndex + 1}`, familyId: `p2-rescue-${familyIndex + 1}`, familyIndex, variantIndex, familyCount: rescueFamilies.length, x, y, open: point(x + dx, y + dy) }));
  }));

  const { straightThreeFamilies } = lifeAndDeathBank;
  for (const mode of ["live", "kill"]) straightThreeFamilies.forEach((family, familyIndex) => family.centers.forEach(([cx, cy], variantIndex) => {
    phase2Problems.push(makeStraightThree({
      id: `p2-${mode === "live" ? "life" : "kill"}-${familyIndex + 1}-${variantIndex + 1}`,
      familyId: `p2-${mode === "live" ? "life" : "kill"}-straight-three-${familyIndex + 1}`,
      familyIndex,
      variantIndex,
      familyCount: straightThreeFamilies.length,
      cx,
      cy,
      axis: family.axis,
      mode
    }));
  }));

  for (const mode of ["live", "block"]) straightThreeFamilies.forEach((family, familyIndex) => family.centers.forEach(([cx, cy], variantIndex) => {
    phase2Problems.push(makeSecondEye({
      id: `p2-${mode === "live" ? "second-eye" : "block-eye"}-${familyIndex + 1}-${variantIndex + 1}`,
      familyId: `p2-${mode === "live" ? "second-eye" : "block-eye"}-${family.axis}-${familyIndex + 1}`,
      familyIndex,
      variantIndex,
      familyCount: straightThreeFamilies.length,
      cx,
      cy,
      axis: family.axis,
      mode
    }));
  }));

  const applicationSources = [
    ...phase2Problems.filter((problem) => problem.pool === "holdout" && problem.skillId === "capture-last-liberty-v1").slice(0, 2),
    ...phase2Problems.filter((problem) => problem.pool === "holdout" && problem.skillId === "direct-join-v1").slice(0, 2)
  ];
  const applicationProbes = applicationSources.map((problem, index) => ({
    ...problem,
    id: `p2-app-${index + 1}`,
    purpose: "legacy_holdout_copy_not_for_application",
    prompt: "輪到黑棋。先自行找出最急的局部問題，再落子。",
    skillCue: false,
    feedbackPolicy: "after_batch"
  }));

  const publicationPolicy = Object.freeze({
    sourceVisibility: "public",
    confidential: false,
    blindAssessmentEligible: false,
    decision: "accepted_public",
    acceptedOn: "2026-09-21"
  });
  const api = { phase2Problems, applicationProbes, publicationPolicy };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoPhase2Content = api;
})(typeof window !== "undefined" ? window : globalThis);
