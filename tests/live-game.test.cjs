const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Go = require("../go.js");
const Live = require("../live-game.js");
const Bot = require("../practice-bot.js");
const PracticeEvents = require("../practice-events.js");

function playOk(game, x, y) {
  const result = Live.play(game, x, y);
  assert.equal(result.ok, true, result.error);
  return result.game;
}

test("完整對局會輪流落子、保存前後盤面並計提子", () => {
  const initial = Go.boardFromStones([[1,1,Go.WHITE],[0,1,Go.BLACK],[1,0,Go.BLACK],[2,1,Go.BLACK]]);
  let game = Live.createGame({ initialBoard: initial, toPlay: Go.BLACK });
  game = playOk(game, 1, 2);
  assert.equal(game.toPlay, Go.WHITE);
  assert.equal(game.board[1][1], Go.EMPTY);
  assert.equal(game.captures.black, 1);
  assert.equal(game.moves[0].captured.length, 1);
  assert.equal(game.moves[0].boardBefore[1][1], Go.WHITE);
  assert.equal(game.moves[0].boardAfter[1][1], Go.EMPTY);
});

test("非法手不改變棋局狀態", () => {
  let game = Live.createGame();
  game = playOk(game, 4, 4);
  const before = JSON.stringify(game);
  const illegal = Live.play(game, 4, 4);
  assert.equal(illegal.ok, false);
  assert.equal(JSON.stringify(game), before);
});

test("兩次 pass 進入人工計分，恢復下棋後可繼續", () => {
  let game = Live.createGame();
  game = Live.pass(game).game;
  assert.equal(game.status, "playing");
  game = Live.pass(game).game;
  assert.equal(game.status, "scoring");
  assert.equal(game.consecutivePasses, 2);
  game = Live.resumeFromScoring(game).game;
  assert.equal(game.status, "playing");
  assert.equal(game.consecutivePasses, 0);
  game = playOk(game, 4, 4);
  assert.equal(game.moves.length, 3);
});

test("簡單劫禁止立即回提；隔手後可依法再提", () => {
  const beforeCapture = Go.boardFromStones([[3,3,Go.WHITE],[2,2,Go.WHITE],[4,2,Go.WHITE],[3,1,Go.WHITE],[2,3,Go.BLACK],[4,3,Go.BLACK],[3,4,Go.BLACK]]);
  let game = Live.createGame({ initialBoard: beforeCapture, toPlay: Go.BLACK });
  game = playOk(game, 3, 2);
  const immediate = Live.play(game, 3, 3);
  assert.equal(immediate.ok, false);
  assert.match(immediate.error, /簡單劫/);
  game = Live.pass(game).game;
  game = playOk(game, 8, 8);
  game = playOk(game, 3, 3);
  assert.equal(game.board[3][3], Go.WHITE);
});

test("中國式面積計分分開棋子、地、雙方相鄰中立點與貼目", () => {
  const board = Go.boardFromStones([[0,0,Go.BLACK],[0,1,Go.BLACK],[8,7,Go.WHITE],[8,8,Go.WHITE]]);
  const score = Live.areaScore(board, 7.5);
  assert.equal(score.blackStones, 2);
  assert.equal(score.whiteStones, 2);
  assert.equal(score.neutral, 77);
  assert.equal(score.blackTerritory, 0);
  assert.equal(score.whiteTerritory, 0);
  assert.equal(score.whiteTotal, 9.5);
  assert.equal(score.winner, Go.WHITE);
});

test("人工死子以整串切換，確認計分後結果不可直接悔棋", () => {
  const initial = Go.boardFromStones([[1,1,Go.WHITE],[0,1,Go.BLACK],[1,0,Go.BLACK],[2,1,Go.BLACK],[1,2,Go.BLACK]]);
  let game = Live.createGame({ initialBoard: initial });
  game = Live.pass(game).game;
  game = Live.pass(game).game;
  game = Live.toggleDeadGroup(game, 1, 1).game;
  assert.deepEqual(game.deadStones, ["1,1"]);
  assert.equal(Live.scoringBoard(game)[1][1], Go.EMPTY);
  game = Live.finalizeScore(game).game;
  assert.equal(game.status, "finished");
  assert.equal(Live.undo(game).ok, false);
});

test("悔棋以重播重建輪次、pass 與劫歷史", () => {
  let game = Live.createGame();
  game = playOk(game, 0, 0);
  game = Live.pass(game).game;
  game = playOk(game, 1, 0);
  game = Live.undo(game).game;
  assert.equal(game.moves.length, 2);
  assert.equal(game.toPlay, Go.BLACK);
  assert.equal(game.board[0][1], Go.EMPTY);
  assert.equal(game.consecutivePasses, 1);
});

test("SGF 匯出再匯入保留 9 路手順、pass、貼目與輪到誰", () => {
  let game = Live.createGame({ komi: 7.5 });
  game = playOk(game, 2, 2);
  game = Live.pass(game).game;
  game = playOk(game, 4, 4);
  const sgf = Live.toSgf(game);
  assert.match(sgf, /SZ\[9\]/);
  assert.match(sgf, /KM\[7.5\]/);
  assert.match(sgf, /;W\[\]/);
  const imported = Live.fromSgf(sgf);
  assert.equal(imported.moves.length, 3);
  assert.equal(imported.moves[1].type, "pass");
  assert.equal(imported.toPlay, Go.WHITE);
  assert.equal(imported.board[2][2], Go.BLACK);
  assert.equal(imported.board[4][4], Go.BLACK);
});

test("hydrate 不信任保存的盤面，依手順重新重建", () => {
  let game = Live.createGame();
  game = playOk(game, 3, 3);
  const saved = JSON.parse(JSON.stringify(game));
  saved.board[3][3] = Go.WHITE;
  const restored = Live.hydrate(saved);
  assert.equal(restored.board[3][3], Go.BLACK);
  assert.equal(restored.toPlay, Go.WHITE);
});

test("認輸留下明確結果碼，SGF 帶 RE 但不假裝是計分結果", () => {
  let game = Live.createGame();
  game = playOk(game, 4, 4);
  game = Live.resign(game).game;
  assert.equal(game.status, "finished");
  assert.equal(game.result.resultCode, "B+R");
  assert.match(Live.toSgf(game), /RE\[B\+R\]/);
});


test("3、5、7、9 路都使用實際棋盤邊界，預設貼目依尺寸分開", () => {
  for (const size of [3, 5, 7, 9]) {
    const board = Go.boardFromStones([[0, 0, Go.BLACK]], size);
    assert.equal(board.length, size);
    assert.equal(Go.groupAt(board, 0, 0).liberties.length, 2, `${size} 路角上單子應只有兩口氣`);
    const game = Live.createGame({ boardSize: size });
    assert.equal(game.boardSize, size);
    assert.equal(game.board.length, size);
    assert.equal(game.komi, size === 9 ? 7.5 : 0);
  }
});

test("3 路邊線提子依 3 路真實邊界判定，不借用 9 路外部空間", () => {
  const initial = Go.boardFromStones([[1, 0, Go.WHITE], [0, 0, Go.BLACK], [2, 0, Go.BLACK]], 3);
  let game = Live.createGame({ boardSize: 3, initialBoard: initial, toPlay: Go.BLACK });
  game = playOk(game, 1, 1);
  assert.equal(game.captures.black, 1);
  assert.equal(game.board[0][1], Go.EMPTY);
});

test("3、5、7、9 路 SGF 都保留 SZ、手順、Pass 與棋盤尺寸", () => {
  for (const size of [3, 5, 7, 9]) {
    let game = Live.createGame({ boardSize: size });
    game = playOk(game, 0, 0);
    game = Live.pass(game).game;
    game = playOk(game, size - 1, size - 1);
    const sgf = Live.toSgf(game);
    assert.match(sgf, new RegExp(`SZ\\[${size}\\]`));
    const imported = Live.fromSgf(sgf);
    assert.equal(imported.boardSize, size);
    assert.equal(imported.moves.length, 3);
    assert.equal(imported.moves[1].type, "pass");
    assert.equal(imported.board[0][0], Go.BLACK);
    assert.equal(imported.board[size - 1][size - 1], Go.BLACK);
  }
});

test("舊 9 路預設建立方式維持相容", () => {
  const game = Live.createGame();
  assert.equal(game.boardSize, 9);
  assert.equal(game.komi, 7.5);
  assert.equal(game.board.length, 9);
});


test("棋盤練習頁明示四種尺寸，課程頁提供階段推薦入口", () => {
  const liveHtml = fs.readFileSync(path.join(__dirname, "..", "live-game.html"), "utf8");
  const indexHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const appJs = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  for (const size of [3, 5, 7, 9]) assert.match(liveHtml, new RegExp(`live-game\\.html\\?size=${size}`));
  assert.match(indexHtml, /id="stage-board-practice-link"/);
  assert.match(indexHtml, /3×3、5×5、7×7、9×9/);
  assert.match(appJs, /courseUnit === 0 \? 3 : courseUnit <= 2 \? 5 : courseUnit === 3 \? 7 : 9/);
});


test("本機練習電腦在四種棋盤都只選合法手", () => {
  for (const size of [3, 5, 7, 9]) {
    const game = Live.createGame({ boardSize: size });
    const action = Bot.chooseAction(game);
    assert.ok(["play", "pass"].includes(action.type));
    if (action.type === "play") {
      const result = Live.play(game, action.point[0], action.point[1]);
      assert.equal(result.ok, true, size + " 路電腦手必須經規則引擎判定合法");
    }
  }
});

test("練習電腦優先吃立即可吃的棋串", () => {
  const initial = Go.boardFromStones([[1, 0, Go.WHITE], [0, 0, Go.BLACK], [2, 0, Go.BLACK]], 3);
  const game = Live.createGame({ boardSize: 3, initialBoard: initial, toPlay: Go.BLACK });
  const action = Bot.chooseAction(game);
  assert.equal(action.type, "play");
  assert.deepEqual(action.point, [1, 1]);
});

test("棋盤頁提供雙人同機與和電腦下模式，並載入 bounded bot", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "live-game.html"), "utf8");
  const page = fs.readFileSync(path.join(__dirname, "..", "live-game-page.js"), "utf8");
  assert.match(html, /practice-bot\.js/);
  assert.match(html, /和電腦下/);
  assert.match(html, /id="human-color"/);
  assert.match(page, /evaluationRole: "practice"/);
  assert.match(page, /formalEligible: false/);
  assert.match(page, /GoPracticeBot/);
});


test("practice event stream 只把人類人機操作計入可觀察決策，且重複 ID 不加倍", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const base = { sessionId: "s1", occurredAt: "2026-09-22T12:00:00.000Z", boardSize: 5, opponentMode: "computer", humanColor: Go.BLACK, formalEligible: false, qualifiedOpportunity: false };
  const human = PracticeEvents.append(storage, { ...base, eventId: "e1", type: "move", actor: "human", moveCount: 1, point: [2,2], actionColor: Go.BLACK });
  assert.equal(human.ok, true);
  const duplicate = PracticeEvents.append(storage, { ...base, eventId: "e1", type: "move", actor: "human", moveCount: 1, point: [2,2], actionColor: Go.BLACK });
  assert.equal(duplicate.duplicate, true);
  const computer = PracticeEvents.append(storage, { ...base, eventId: "e2", type: "computer_move", actor: "computer", moveCount: 2, point: [1,1], actionColor: Go.WHITE, botVersion: "local-practice-bot-v1" });
  assert.equal(computer.ok, true);
  const undo = PracticeEvents.append(storage, { ...base, eventId: "e3", type: "undo", actor: "human", moveCount: 0 });
  assert.equal(undo.ok, true);
  const summary = PracticeEvents.summarize(PracticeEvents.read(storage).store);
  assert.equal(summary.totalEvents, 3);
  assert.equal(summary.humanDecisions, 1);
  assert.equal(summary.computerActions, 1);
  assert.equal(summary.computerSessions, 1);
  assert.equal(summary.formalEligible, false);
});

test("損壞的 practice event store 保持失敗，不回退成空白成功", () => {
  const storage = { getItem: () => "{broken", setItem() {} };
  const result = PracticeEvents.read(storage);
  assert.equal(result.ok, false);
  assert.equal(result.error, "practice_event_store_malformed");
  assert.equal(result.store, null);
});
