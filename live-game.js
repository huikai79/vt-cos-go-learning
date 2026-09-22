(function (root) {
  "use strict";

  const Go = typeof require === "function" && typeof module !== "undefined" ? require("./go.js") : root.GoCore;
  const Sgf = typeof require === "function" && typeof module !== "undefined" ? require("./sgf.js") : root.GoSgf;
  const { SIZE, EMPTY, BLACK, WHITE, emptyBoard, boardFromStones, groupAt, playMove } = Go;
  const SCHEMA_VERSION = 1;
  const RULES_VERSION = "cn-area-simple-ko-v1";
  const DEFAULT_KOMI = 7.5;

  function cloneBoard(board) { return board.map((row) => row.slice()); }
  function opposite(color) { return color === BLACK ? WHITE : BLACK; }
  function colorName(color) { return color === BLACK ? "黑" : "白"; }
  function stoneKey(x, y) { return `${x},${y}`; }
  function nowIso() { return new Date().toISOString(); }
  function isBoard(board) {
    return Array.isArray(board) && board.length === SIZE && board.every((row) => Array.isArray(row) && row.length === SIZE && row.every((v) => [EMPTY, BLACK, WHITE].includes(v)));
  }
  function sanitizeKomi(value) {
    const komi = Number(value);
    if (!Number.isFinite(komi) || komi < -50 || komi > 50) throw new Error("貼目數值不合法。");
    return komi;
  }
  function pointToSgf(point) { return String.fromCharCode(97 + point[0]) + String.fromCharCode(97 + point[1]); }
  function sgfToPoint(value) {
    if (!/^[a-i]{2}$/.test(value || "")) return null;
    return [value.charCodeAt(0) - 97, value.charCodeAt(1) - 97];
  }
  function escapeSgf(value) { return String(value || "").replace(/\\/g, "\\\\").replace(/\]/g, "\\]"); }

  function createGame(options = {}) {
    const initialBoard = options.initialBoard ? cloneBoard(options.initialBoard) : emptyBoard();
    if (!isBoard(initialBoard)) throw new Error("初始棋盤資料不合法。");
    const initialToPlay = options.toPlay === WHITE ? WHITE : BLACK;
    const timestamp = options.startedAt || nowIso();
    return {
      schemaVersion: SCHEMA_VERSION,
      rulesVersion: RULES_VERSION,
      boardSize: SIZE,
      komi: sanitizeKomi(options.komi === undefined ? DEFAULT_KOMI : options.komi),
      initialBoard,
      initialToPlay,
      board: cloneBoard(initialBoard),
      toPlay: initialToPlay,
      previousBoard: null,
      captures: { black: 0, white: 0 },
      consecutivePasses: 0,
      moves: [],
      status: "playing",
      deadStones: [],
      score: null,
      result: null,
      startedAt: timestamp,
      updatedAt: timestamp
    };
  }

  function moveRecord(number, color, type, point, before, after, captured) {
    return {
      number,
      color,
      type,
      point: point ? point.slice() : null,
      captured: (captured || []).map((p) => p.slice()),
      boardBefore: cloneBoard(before),
      boardAfter: cloneBoard(after),
      occurredAt: nowIso()
    };
  }

  function assertPlaying(game) {
    if (!game || game.status !== "playing") return "棋局目前不是落子狀態。";
    return null;
  }

  function play(game, x, y) {
    const stateError = assertPlaying(game);
    if (stateError) return { ok: false, error: stateError, game };
    const before = cloneBoard(game.board);
    const result = playMove(game.board, x, y, game.toPlay, { previousBoard: game.previousBoard });
    if (!result.legal) return { ok: false, error: result.reason, game };
    const next = {
      ...game,
      board: cloneBoard(result.board),
      previousBoard: before,
      toPlay: opposite(game.toPlay),
      captures: { ...game.captures },
      consecutivePasses: 0,
      deadStones: [],
      score: null,
      result: null,
      updatedAt: nowIso(),
      moves: [...game.moves, moveRecord(game.moves.length + 1, game.toPlay, "play", [x, y], before, result.board, result.captured)]
    };
    if (game.toPlay === BLACK) next.captures.black += result.captured.length;
    else next.captures.white += result.captured.length;
    return { ok: true, game: next, captured: result.captured.map((p) => p.slice()) };
  }

  function pass(game) {
    const stateError = assertPlaying(game);
    if (stateError) return { ok: false, error: stateError, game };
    const before = cloneBoard(game.board);
    const consecutivePasses = game.consecutivePasses + 1;
    const next = {
      ...game,
      previousBoard: before,
      toPlay: opposite(game.toPlay),
      consecutivePasses,
      status: consecutivePasses >= 2 ? "scoring" : "playing",
      deadStones: [],
      score: null,
      result: null,
      updatedAt: nowIso(),
      moves: [...game.moves, moveRecord(game.moves.length + 1, game.toPlay, "pass", null, before, before, [])]
    };
    return { ok: true, game: next };
  }

  function resign(game) {
    const stateError = assertPlaying(game);
    if (stateError) return { ok: false, error: stateError, game };
    const winner = opposite(game.toPlay);
    return {
      ok: true,
      game: {
        ...game,
        status: "finished",
        result: { type: "resign", winner, loser: game.toPlay, resultCode: `${winner === BLACK ? "B" : "W"}+R` },
        updatedAt: nowIso()
      }
    };
  }

  function neighbors(x, y) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE);
  }

  function scoringBoard(game) {
    const board = cloneBoard(game.board);
    for (const key of game.deadStones || []) {
      const [x, y] = key.split(",").map(Number);
      if (Number.isInteger(x) && Number.isInteger(y) && y >= 0 && y < SIZE && x >= 0 && x < SIZE) board[y][x] = EMPTY;
    }
    return board;
  }

  function toggleDeadGroup(game, x, y) {
    if (!game || game.status !== "scoring") return { ok: false, error: "只有終局計分階段可以標記死子。", game };
    const group = groupAt(game.board, x, y);
    if (!group) return { ok: false, error: "請點選要標記的棋串。", game };
    const keys = group.stones.map(([gx, gy]) => stoneKey(gx, gy));
    const dead = new Set(game.deadStones || []);
    const alreadyDead = keys.every((key) => dead.has(key));
    for (const key of keys) {
      if (alreadyDead) dead.delete(key);
      else dead.add(key);
    }
    return { ok: true, game: { ...game, deadStones: [...dead].sort(), score: null, updatedAt: nowIso() }, markedDead: !alreadyDead };
  }

  function areaScore(board, komi = DEFAULT_KOMI) {
    if (!isBoard(board)) throw new Error("計分棋盤資料不合法。");
    let blackStones = 0, whiteStones = 0, blackTerritory = 0, whiteTerritory = 0, neutral = 0;
    const visited = new Set();
    for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
      if (board[y][x] === BLACK) blackStones += 1;
      else if (board[y][x] === WHITE) whiteStones += 1;
    }
    for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
      if (board[y][x] !== EMPTY || visited.has(stoneKey(x, y))) continue;
      const queue = [[x, y]], region = [], borderingColors = new Set();
      visited.add(stoneKey(x, y));
      for (let index = 0; index < queue.length; index += 1) {
        const [cx, cy] = queue[index];
        region.push([cx, cy]);
        for (const [nx, ny] of neighbors(cx, cy)) {
          const value = board[ny][nx];
          if (value === EMPTY) {
            const key = stoneKey(nx, ny);
            if (!visited.has(key)) { visited.add(key); queue.push([nx, ny]); }
          } else borderingColors.add(value);
        }
      }
      if (borderingColors.size === 1 && borderingColors.has(BLACK)) blackTerritory += region.length;
      else if (borderingColors.size === 1 && borderingColors.has(WHITE)) whiteTerritory += region.length;
      else neutral += region.length;
    }
    const effectiveKomi = sanitizeKomi(komi);
    const blackTotal = blackStones + blackTerritory;
    const whiteTotal = whiteStones + whiteTerritory + effectiveKomi;
    const difference = Math.abs(blackTotal - whiteTotal);
    const winner = blackTotal === whiteTotal ? null : blackTotal > whiteTotal ? BLACK : WHITE;
    return { blackStones, whiteStones, blackTerritory, whiteTerritory, neutral, komi: effectiveKomi, blackTotal, whiteTotal, winner, difference };
  }

  function currentScore(game) {
    if (!game || !["scoring", "finished"].includes(game.status)) return null;
    return areaScore(scoringBoard(game), game.komi);
  }

  function finalizeScore(game) {
    if (!game || game.status !== "scoring") return { ok: false, error: "棋局尚未進入計分階段。", game };
    const score = currentScore(game);
    const resultCode = score.winner === null ? "0" : `${score.winner === BLACK ? "B" : "W"}+${score.difference}`;
    return {
      ok: true,
      game: { ...game, score, result: { type: "score", winner: score.winner, difference: score.difference, resultCode }, status: "finished", updatedAt: nowIso() }
    };
  }

  function resumeFromScoring(game) {
    if (!game || game.status !== "scoring") return { ok: false, error: "目前不在計分階段。", game };
    return {
      ok: true,
      game: { ...game, status: "playing", consecutivePasses: 0, deadStones: [], score: null, result: null, previousBoard: cloneBoard(game.board), updatedAt: nowIso() }
    };
  }

  function replay(baseGame, moves) {
    let game = createGame({ initialBoard: baseGame.initialBoard, toPlay: baseGame.initialToPlay, komi: baseGame.komi, startedAt: baseGame.startedAt });
    for (const move of moves) {
      if (game.status === "scoring") game = resumeFromScoring(game).game;
      if (move.color !== game.toPlay) throw new Error(`第 ${move.number} 手顏色順序不一致。`);
      const result = move.type === "pass" ? pass(game) : play(game, move.point[0], move.point[1]);
      if (!result.ok) throw new Error(`第 ${move.number} 手無法重播：${result.error}`);
      game = result.game;
    }
    return game;
  }

  function undo(game) {
    if (!game || game.status === "finished") return { ok: false, error: "已確認的終局結果不直接悔棋；請開新局或重新匯入棋譜。", game };
    if (!game.moves.length) return { ok: false, error: "目前沒有可悔的著手。", game };
    try {
      const rebuilt = replay(game, game.moves.slice(0, -1));
      rebuilt.updatedAt = nowIso();
      return { ok: true, game: rebuilt };
    } catch (error) {
      return { ok: false, error: error.message, game };
    }
  }

  function resultText(game) {
    if (!game || !game.result) return "";
    if (game.result.type === "resign") return `${colorName(game.result.winner)}勝（對手認輸）`;
    if (game.result.type === "imported") return `棋譜結果：${game.result.resultCode || "已結束"}`;
    if (game.result.winner === null) return "和棋";
    return `${colorName(game.result.winner)}勝 ${game.result.difference} 目`;
  }

  function toSgf(game) {
    if (!game || !isBoard(game.initialBoard)) throw new Error("棋局資料不完整，無法匯出 SGF。");
    const rootProps = ["GM[1]", "FF[4]", "CA[UTF-8]", `SZ[${SIZE}]`, `KM[${game.komi}]`, "RU[Chinese]", "AP[VT-COS:live-game-v1]"];
    const blackSetup = [], whiteSetup = [];
    game.initialBoard.forEach((row, y) => row.forEach((color, x) => {
      if (color === BLACK) blackSetup.push(`[${pointToSgf([x, y])}]`);
      if (color === WHITE) whiteSetup.push(`[${pointToSgf([x, y])}]`);
    }));
    if (blackSetup.length) rootProps.push(`AB${blackSetup.join("")}`);
    if (whiteSetup.length) rootProps.push(`AW${whiteSetup.join("")}`);
    if (game.initialToPlay === WHITE) rootProps.push("PL[W]");
    if (game.result && game.result.resultCode) rootProps.push(`RE[${escapeSgf(game.result.resultCode)}]`);
    rootProps.push(`C[${escapeSgf("VT-COS 9×9 實戰練習；Chinese area scoring、simple ko。人工死子標記只用於終局計分，不是引擎自動死活判定。")}]`);
    const nodes = game.moves.map((move) => `;${move.color === BLACK ? "B" : "W"}[${move.type === "pass" ? "" : pointToSgf(move.point)}]`).join("");
    const deadNote = (game.deadStones || []).length ? `;C[${escapeSgf(`終局人工標記死子：${game.deadStones.join(" ")}`)}]` : "";
    return `(;${rootProps.join("")}${nodes}${deadNote})`;
  }

  function parseRootSetup(rootNode) {
    const stones = [];
    for (const value of rootNode.AB || []) {
      const point = sgfToPoint(value);
      if (!point) throw new Error("SGF 佈局黑棋座標不支援。");
      stones.push([point[0], point[1], BLACK]);
    }
    for (const value of rootNode.AW || []) {
      const point = sgfToPoint(value);
      if (!point) throw new Error("SGF 佈局白棋座標不支援。");
      stones.push([point[0], point[1], WHITE]);
    }
    return stones;
  }

  function fromSgf(text) {
    if (!Sgf || typeof Sgf.parseSgf !== "function") throw new Error("SGF 解析器不可用。");
    const parsed = Sgf.parseSgf(text);
    const nodes = parsed.nodes || [];
    const rootNode = nodes[0] || {};
    for (let index = 1; index < nodes.length; index += 1) {
      if ((nodes[index].AB && nodes[index].AB.length) || (nodes[index].AW && nodes[index].AW.length)) throw new Error("完整對局續局目前只支援根節點佈局棋子；中途改盤請改用棋譜複盤功能。");
    }
    const initialBoard = boardFromStones(parseRootSetup(rootNode));
    const initialToPlay = rootNode.PL && rootNode.PL[0] === "W" ? WHITE : (rootNode.AB && rootNode.AB.length >= 2 ? WHITE : BLACK);
    const komi = rootNode.KM && rootNode.KM.length ? sanitizeKomi(rootNode.KM[0]) : DEFAULT_KOMI;
    let game = createGame({ initialBoard, toPlay: initialToPlay, komi });
    let moveNumber = 0;
    for (const node of nodes) {
      if (node.B && node.W) throw new Error("SGF 同一節點不能同時包含黑白著手。");
      const prop = node.B ? "B" : node.W ? "W" : null;
      if (!prop) continue;
      moveNumber += 1;
      if (node[prop].length !== 1) throw new Error(`SGF 第 ${moveNumber} 手資料不完整。`);
      if (game.status === "scoring") game = resumeFromScoring(game).game;
      const color = prop === "B" ? BLACK : WHITE;
      if (color !== game.toPlay) throw new Error(`SGF 第 ${moveNumber} 手不是輪到${colorName(color)}棋。`);
      const value = node[prop][0];
      const result = value === "" ? pass(game) : (() => {
        const point = sgfToPoint(value);
        if (!point) return { ok: false, error: `第 ${moveNumber} 手座標不支援。`, game };
        return play(game, point[0], point[1]);
      })();
      if (!result.ok) throw new Error(`SGF 第 ${moveNumber} 手不合法：${result.error}`);
      game = result.game;
    }
    if (rootNode.RE && rootNode.RE[0]) {
      game = { ...game, status: "finished", result: { type: "imported", winner: null, difference: null, resultCode: rootNode.RE[0] }, updatedAt: nowIso() };
    }
    return game;
  }

  function hydrate(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("保存的棋局格式不合法。");
    if (value.schemaVersion !== SCHEMA_VERSION) throw new Error("保存的棋局版本不支援。");
    if (value.rulesVersion !== RULES_VERSION) throw new Error("保存的棋局規則版本不同，請先匯出 SGF 再開始新局。");
    if (!isBoard(value.initialBoard) || !Array.isArray(value.moves)) throw new Error("保存的棋局缺少必要棋盤或手順。");
    const base = createGame({ initialBoard: value.initialBoard, toPlay: value.initialToPlay, komi: value.komi, startedAt: value.startedAt });
    let game = replay(base, value.moves.map((move, index) => {
      if (!move || ![BLACK, WHITE].includes(move.color) || !["play", "pass"].includes(move.type)) throw new Error(`保存的第 ${index + 1} 手格式不合法。`);
      if (move.type === "play" && (!Array.isArray(move.point) || move.point.length !== 2)) throw new Error(`保存的第 ${index + 1} 手缺少座標。`);
      return { number: index + 1, color: move.color, type: move.type, point: move.point ? move.point.slice() : null };
    }));
    game.startedAt = value.startedAt || game.startedAt;
    if (value.status === "scoring") {
      if (game.status !== "scoring") throw new Error("保存的計分狀態與手順不一致。");
      game.deadStones = Array.isArray(value.deadStones) ? value.deadStones.filter((key) => /^\d,\d$/.test(key)) : [];
    } else if (value.status === "finished" && value.result && value.result.type === "score") {
      if (game.status !== "scoring") throw new Error("保存的終局計分與手順不一致。");
      game.deadStones = Array.isArray(value.deadStones) ? value.deadStones.filter((key) => /^\d,\d$/.test(key)) : [];
      game = finalizeScore(game).game;
    } else if (value.status === "finished" && value.result && value.result.type === "resign") {
      if (game.status === "scoring") game = resumeFromScoring(game).game;
      game.toPlay = value.result.loser;
      game = resign(game).game;
    } else if (value.status === "playing" && game.status === "scoring") {
      game = resumeFromScoring(game).game;
    }
    game.updatedAt = value.updatedAt || nowIso();
    return game;
  }

  const api = {
    SCHEMA_VERSION, RULES_VERSION, DEFAULT_KOMI,
    createGame, play, pass, resign, undo, toggleDeadGroup, scoringBoard, areaScore, currentScore, finalizeScore, resumeFromScoring,
    toSgf, fromSgf, hydrate, resultText, colorName
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoLiveGame = api;
})(typeof window !== "undefined" ? window : globalThis);
