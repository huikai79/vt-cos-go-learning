const test = require("node:test");
const assert = require("node:assert/strict");
const { parseSgf, makeLocalExercise, sourceFingerprint } = require("../sgf.js");
const { sampleSgf, fixedApplicationProbes } = require("../phase4-content.js");

test("9 路 SGF 可重播並取出原局著手為局部複習題", () => {
  const game = parseSgf(sampleSgf);
  assert.equal(game.boardSize, 9);
  assert.equal(game.moves.length, 1);
  const exercise = makeLocalExercise(sampleSgf, 1, "測試棋譜");
  assert.deepEqual(exercise.answer, [4, 5]);
  assert.deepEqual(exercise.source.originalStones, [[4, 3, 1], [3, 4, 1], [4, 4, 2], [5, 4, 1]]);
  assert.equal(exercise.playerColor, 1);
  assert.equal(exercise.linkedSkillId, "capture-last-liberty-v1");
  assert.equal(exercise.source.sourceName, "測試棋譜");
  assert.equal(exercise.source.sourceId, sourceFingerprint(sampleSgf));
});

test("不同棋譜的相同手數與座標會產生不同局部復盤識別碼", () => {
  const first = "(;GM[1]SZ[9]AB[de][ed][fe]AW[ee];B[ef])";
  const second = "(;GM[1]SZ[9]AB[de][ed][fe]AW[ee]AB[aa];B[ef])";
  const firstExercise = makeLocalExercise(first, 1, "第一盤");
  const secondExercise = makeLocalExercise(second, 1, "第二盤");
  assert.notEqual(firstExercise.source.sourceId, secondExercise.source.sourceId);
  assert.notEqual(firstExercise.id, secondExercise.id);
});

test("多手 9 路 SGF 可選任意實際著手建立局部複習題", () => {
  const sgf = "(;GM[1]SZ[9];B[dd];W[ee];B[fd])";
  const game = parseSgf(sgf);
  assert.equal(game.moves.length, 3);
  const exercise = makeLocalExercise(sgf, 3, "三手棋譜");
  assert.equal(exercise.source.moveNumber, 3);
  assert.deepEqual(exercise.answer, [5, 3]);
  assert.equal(exercise.playerColor, 1);
  assert.equal(exercise.stones.length, 2);
  assert.match(exercise.prompt, /第 3 手/);
});

test("SGF 只接受目前棋盤可顯示的 9 路格式，固定應用探測含不適用對照且沒有技能線索", () => {
  assert.throws(() => parseSgf("(;GM[1]SZ[19];B[pd])"), /只支援 9 路/);
  assert.equal(fixedApplicationProbes.length, 5);
  assert.ok(fixedApplicationProbes.filter((problem) => problem.applicability === "not_applicable").length >= 2);
  assert.ok(fixedApplicationProbes.every((problem) => problem.purpose === "fixed_application_probe" && problem.skillCue === false && !problem.skillId));
  assert.ok(fixedApplicationProbes.every((problem) => problem.focus.length === 0 && problem.claimScope && problem.scoringClaim));
});

test("SGF 不會靜默忽略第二盤或分支", () => {
  assert.throws(() => parseSgf("(;GM[1]SZ[9];B[aa])(;GM[1]SZ[9];W[bb])"), /一次只能匯入一盤/);
  assert.throws(() => parseSgf("(;GM[1]SZ[9];B[aa](;W[bb])(;W[cc]))"), /分支變化/);
});

test("SGF 的停一手保留原局著手編號，後續落子仍可選取", () => {
  const sgf = "(;GM[1]SZ[9];B[aa];W[];B[bb])";
  const game = parseSgf(sgf);
  assert.deepEqual(game.moves.map((move) => move.number), [1, 3]);
  const exercise = makeLocalExercise(sgf, 3, "含停一手的棋譜");
  assert.equal(exercise.source.moveNumber, 3);
  assert.deepEqual(exercise.answer, [1, 1]);
});

test("SGF 重播拒絕簡單劫的立即回提", () => {
  const immediateKoRecapture = "(;GM[1]SZ[9]AW[dd][cc][ec][db]AB[cd][ed][de];B[dc];W[dd])";
  assert.throws(() => parseSgf(immediateKoRecapture), /簡單劫/);
});

test("SGF 對檔案大小、節點數與巢狀深度設限", () => {
  assert.throws(() => parseSgf(`(;GM[1]SZ[9]C[${"a".repeat(1_000_001)}])`), /檔案過大/);
  assert.throws(() => parseSgf(`(;GM[1]SZ[9]${";C[x]".repeat(10_001)})`), /節點過多/);
  assert.throws(() => parseSgf(`${"(".repeat(130)};GM[1]SZ[9]${")".repeat(130)}`), /巢狀過深/);
});
