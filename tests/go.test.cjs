const test = require("node:test");
const assert = require("node:assert/strict");
const Go = require("../go.js");
const { units, lessons, problems, skills } = require("../content.js");

test("中央、邊、角與相連棋串的氣數符合教材答案", () => {
  for (const problem of problems.filter((item) => item.type === "count")) {
    const board = Go.boardFromStones(problem.stones);
    const [x, y] = problem.focus[0];
    assert.equal(Go.groupAt(board, x, y).liberties.length, problem.answer, problem.id);
  }
});

function sameGroup(board, first, second) {
  const group = Go.groupAt(board, first[0], first[1]);
  return group.stones.some(([x, y]) => x === second[0] && y === second[1]);
}

test("所有棋串辨認題的答案符合沿線相連規則", () => {
  for (const problem of problems.filter((item) => item.type === "connect")) {
    const board = Go.boardFromStones(problem.stones);
    assert.equal(sameGroup(board, ...problem.targets), problem.answer, problem.id);
  }
});

test("每題指定落子合法，且達成提子、救棋、連接或阻斷直接連接的目標", () => {
  for (const problem of problems.filter((item) => item.type === "move")) {
    const board = Go.boardFromStones(problem.stones);
    const [x, y] = problem.answer;
    const result = Go.playMove(board, x, y, Go.BLACK);
    assert.equal(result.legal, true, problem.id);
    const goal = problem.goal;
    if (goal.type === "capture") {
      assert.equal(result.captured.length, goal.count, problem.id);
      assert.ok(result.captured.some(([cx, cy]) => cx === goal.target[0] && cy === goal.target[1]), problem.id);
    } else if (goal.type === "rescue") {
      const [tx, ty] = goal.target;
      assert.equal(Go.groupAt(board, tx, ty).liberties.length, 1, problem.id);
      assert.ok(Go.groupAt(result.board, tx, ty).liberties.length > 1, problem.id);
    } else if (goal.type === "join") {
      assert.equal(sameGroup(board, ...goal.targets), false, problem.id);
      assert.equal(sameGroup(result.board, ...goal.targets), true, problem.id);
    } else if (goal.type === "block") {
      const [first, second] = goal.targets;
      const firstLiberties = Go.groupAt(board, first[0], first[1]).liberties;
      const secondLiberties = new Set(Go.groupAt(board, second[0], second[1]).liberties.map((point) => point.join(",")));
      assert.deepEqual(firstLiberties.filter((point) => secondLiberties.has(point.join(","))), [problem.answer], problem.id);
      assert.equal(sameGroup(result.board, first, second), false, problem.id);
    } else if (goal.type === "exact") {
      assert.deepEqual(problem.answer, goal.answer, problem.id);
    } else {
      assert.fail(`Unknown goal for ${problem.id}`);
    }
  }
});

test("課程含 15 個單元、初中高各五個，且所有題號唯一", () => {
  assert.equal(units.length, 15);
  assert.deepEqual(units.reduce((counts, unit) => ({ ...counts, [unit.level]: (counts[unit.level] || 0) + 1 }), {}), { 初級: 5, 中級: 5, 高級: 5 });
  assert.equal(new Set(problems.map((item) => item.id)).size, problems.length);
  assert.ok(units.every((_, unitIndex) => lessons.some((lesson) => lesson.unit === unitIndex)), "every unit needs a lesson");
});

test("後續十個單元各有一題局部視覺點選，且不把它們當成全局最佳手", () => {
  const spots = problems.filter((item) => item.type === "spot");
  assert.equal(spots.length, 10);
  assert.deepEqual(spots.map((item) => item.lesson), [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  for (const problem of spots) {
    assert.ok(Array.isArray(problem.answer) && problem.answer.length === 2, `${problem.id} 缺少選擇位置`);
    assert.ok(problem.answer.every((value) => Number.isInteger(value) && value >= 0 && value < 9), `${problem.id} 的位置超出棋盤`);
    assert.match(problem.prompt, /局部.*示意|局部直三眼形|縮小全盤示意|假設劫在別處/, `${problem.id} 缺少局部範圍說明`);
    assert.match(problem.explanation, /全盤|唯一|局部|死活變化|實際官子|劫本身|定石/, `${problem.id} 缺少全局結論邊界`);
  }
});

test("新增連與斷題組有 10 題、三課，且題號唯一", () => {
  const unit = problems.filter((item) => item.id.startsWith("u2-"));
  assert.equal(unit.length, 10);
  assert.deepEqual([...new Set(unit.map((item) => item.lesson))], [3, 4, 5]);
});

test("試行技能有版本、邊界與對應的指定棋形練習題", () => {
  assert.deepEqual(skills.map((skill) => skill.id), ["capture-last-liberty-v1", "direct-join-v1", "make-two-eyes-straight-three-v1", "kill-straight-three-v1", "complete-second-eye-v1", "block-second-eye-v1"]);
  assert.ok(skills.every((skill) => skill.version === 1 && skill.application && skill.success && skill.opportunityRule && skill.prerequisites.length && skill.exclusions.length));
  assert.ok(skills.every((skill) => skill.classificationExamples.positive.length && skill.classificationExamples.negative.length && skill.classificationExamples.boundary.length));
  const capture = skills.find((skill) => skill.id === "capture-last-liberty-v1");
  const join = skills.find((skill) => skill.id === "direct-join-v1");
  assert.deepEqual(capture.problemIds, ["u1-06", "u1-07", "u1-08", "u1-09"]);
  assert.deepEqual(join.problemIds, ["u2-05", "u2-06", "u2-07"]);
  for (const problemId of capture.problemIds) assert.equal(problems.find((problem) => problem.id === problemId).goal.type, "capture", problemId);
  for (const problemId of join.problemIds) assert.equal(problems.find((problem) => problem.id === problemId).goal.type, "join", problemId);
  for (const problem of problems.filter((problem) => problem.skillId)) {
    assert.ok(["辨識", "辨識與短讀"].includes(problem.taskMode), problem.id);
    assert.equal(problem.pool, "練習", problem.id);
    assert.equal(problem.contentVersion, 1, problem.id);
    assert.equal(problem.taskFeatureVersion, 1, problem.id);
    assert.ok(problem.taskFeatures && problem.motherFamilyId, problem.id);
  }
  assert.ok(capture.classificationExamples.negative.every((problemId) => problems.find((problem) => problem.id === problemId).goal.type !== "capture"));
  assert.ok(join.classificationExamples.negative.every((problemId) => problems.find((problem) => problem.id === problemId).goal.type !== "join"));
  assert.equal(new Set(problems.filter((problem) => problem.skillId).map((problem) => problem.id)).size, 15);
});

test("眼與基礎死活單元含八題棋盤急所及六題概念練習", () => {
  const questions = problems.filter((problem) => problem.id.startsWith("u4-"));
  assert.equal(questions.length, 14);
  assert.equal(questions.filter((problem) => problem.type === "move").length, 8);
  assert.equal(questions.filter((problem) => problem.type === "choice").length, 6);
});

test("其餘後續單元都有六題可判定練習，局部點選與文字判斷分開標示", () => {
  for (let unit = 5; unit <= 15; unit += 1) {
    const questions = problems.filter((problem) => problem.id.startsWith(`u${unit}-`));
    assert.equal(questions.length, 6, `unit ${unit}`);
    assert.ok(questions.every((problem) => {
      if (problem.type === "choice") return problem.options[problem.answer] && problem.explanation && problem.hint;
      return problem.type === "spot" && Array.isArray(problem.answer) && problem.explanation && problem.hint;
    }), `unit ${unit}`);
  }
});

test("已佔點和未提子的自殺手被拒絕，原盤不變", () => {
  const board = Go.boardFromStones([[4, 4, Go.WHITE], [3, 4, Go.BLACK], [4, 3, Go.BLACK], [5, 4, Go.BLACK], [4, 5, Go.BLACK]]);
  assert.equal(Go.playMove(board, 4, 4, Go.BLACK).legal, false);
  const surrounded = Go.boardFromStones([[3, 4, Go.WHITE], [4, 3, Go.WHITE], [5, 4, Go.WHITE], [4, 5, Go.WHITE]]);
  const result = Go.playMove(surrounded, 4, 4, Go.BLACK);
  assert.equal(result.legal, false);
  assert.equal(surrounded[4][4], Go.EMPTY);
});

test("簡單劫禁止立刻回到上一個棋形", () => {
  const beforeCapture = Go.boardFromStones([[3, 3, Go.WHITE], [2, 2, Go.WHITE], [4, 2, Go.WHITE], [3, 1, Go.WHITE], [2, 3, Go.BLACK], [4, 3, Go.BLACK], [3, 4, Go.BLACK]]);
  const capture = Go.playMove(beforeCapture, 3, 2, Go.BLACK);
  assert.equal(capture.legal, true);
  assert.equal(capture.captured.length, 1);
  const immediateRecapture = Go.playMove(capture.board, 3, 3, Go.WHITE, { previousBoard: beforeCapture });
  assert.equal(immediateRecapture.legal, false);
  assert.match(immediateRecapture.reason, /簡單劫/);
  const unrestrictedRecapture = Go.playMove(capture.board, 3, 3, Go.WHITE);
  assert.equal(unrestrictedRecapture.legal, true);
  assert.equal(Go.sameBoard(unrestrictedRecapture.board, beforeCapture), true);
});
