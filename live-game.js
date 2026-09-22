(function (root) {
  "use strict";

  const Go = typeof require === "function" && typeof module !== "undefined" ? require("./go.js") : root.GoCore;
  const Sgf = typeof require === "function" && typeof module !== "undefined" ? require("./sgf.js") : root.GoSgf;
  const { EMPTY, BLACK, WHITE, emptyBoard, boardFromStones, groupAt, playMove, boardSize: getBoardSize } = Go;
  const SCHEMA_VERSION = 1;
  const RULES_VERSION = "cn-area-simple-ko-v1";
  const DEFAULT_SIZE = 9;
  const SUPPORTED_SIZES = [3, 5, 7, 9];
  const DEFAULT_KOMI = 7.5;

  function cloneBoard(board) { return board.map((row) => row.slice()); }
  function opposite(color) { return color === BLACK ? WHITE : BLACK; }
  function colorName(color) { return color === BLACK ? "黑" : "白"; }
  function stoneKey(x, y) { return `${x},${y}`; }
  function nowIso() { return new Date().toISOString(); }
  function normalizeBoardSize(value, fallback = DEFAULT_SIZE) {
    const size = value === undefined || value === null || value === "" ? fallback : Number(value);
    if (!SUPPORTED_SIZES.includes(size)) throw new Error(`目前只支援 ${SUPPORTED_SIZES.join("、")} 路棋盤。`);
    return size;
  }
  function defaultKomiForSize(size) { return normalizeBoardSize(size) === 9 ? DEFAULT_KOMI : 0; }
  function isBoard(board, expectedSize = null) {
    const size = typeof getBoardSize === "function" ? getBoardSize(board) : null;
    return Boolean(size && SUPPORTED_SIZES.includes(size) && (expectedSize === null || size === expectedSize));
  }
  function sanitizeKomi(value) {
    const komi = Number(value);
    if (!Number.isFinite(komi) || komi < -50 || komi > 50) throw new Error("貼目數值不合法。");
    return komi;
  }
  function pointToSgf(point) { return String.fromCharCode(97 + point[0]) + String.fromCharCode(97 + point[1]); }
  function sgfToPoint(value, size) {
    if (!/^[a-s]{2}$/.test(value || "")) return null;
    const point = [value.charCodeAt(0) - 97, value.charCodeAt(1) - 97];
    return point[0] < size && point[1] < size ? point : null;
  }
  function escapeSgf(value) { return String(value || "").replace(/\\/g, "\\\\").replace(/\]/g, "\\]"); }

  function createGame(options = {}) {
    const inferredSize = options.initialBoard && typeof getBoardSize === "function" ? getBoardSize(options.initialBoard) : null;
    const size = normalizeBoardSize(options.boardSize === undefined ? (inferredSize || DEFAULT_SIZE) : options.boardSize);
    const initialBoard = options.initialBoard ? cloneBoard(options.initialBoard) : emptyBoard(size);
    if (!isBoard(initialBoard, size)) throw new Error("初始棋盤資料不合法。");
    const initialToPlay = options.toPlay === WHITE ? WHITE : BLACK;
    const timestamp = options.startedAt || nowIso();
    return {
      schemaVersion: SCHEMA_VERSION,
      rulesVersion: RULES_VERSION,
      boardSize: size,
      komi: sanitizeKomi(options.komi === undefined ? defaultKomiForSize(size) : options.komi),
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

  function neighbors(x, y, size) {
    return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => nx >= 0 && nx < size && ny >= 0 && ny < size);
  }

  function scoringBoard(game) {
    const board = cloneBoard(game.board);
    const size = game.boardSize;
    for (const key of game.deadStones || []) {
      const [x, y] = key.split(",").map(Number);
      if (Number.isInteger(x) && Number.isInteger(y) && y >= 0 && y < size && x >= 0 && x < size) board[y][x] = EMPTY;
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
    const size = getBoardSize(board);
    let blackStones = 0, whiteStones = 0, blackTerritory = 0, whiteTerritory = 0, neutral = 0;
    const visited = new Set();
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      if (board[y][x] === BLACK) blackStones += 1;
      else if (board[y][x] === WHITE) whiteStones += 1;
    }
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      if (board[y][x] !== EMPTY || visited.has(stoneKey(x, y))) continue;
      const queue = [[x, y]], region = [], borderingColors = new Set();
      visited.add(stoneKey(x, y));
      for (let index = 0; index < queue.length; index += 1) {
        const [cx, cy] = queue[index];
        region.push([cx, cy]);
        for (const [nx, ny] of neighbors(cx, cy, size)) {
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
    return { boardSize: size, blackStones, whiteStones, blackTerritory, whiteTerritory, neutral, komi: effectiveKomi, blackTotal, whiteTotal, winner, difference };
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
    let game = createGame({ boardSize: baseGame.boardSize, initialBoard: baseGame.initialBoard, toPlay: baseGame.initialToPlay, komi: baseGame.komi, startedAt: baseGame.startedAt });
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
    const size = game.boardSize;
    const rootProps = ["GM[1]", "FF[4]", "CA[UTF-8]", `SZ[${size}]`, `KM[${game.komi}]`, "RU[Chinese]", "AP[VT-COS:multi-board-practice-v2]"];
    const blackSetup = [], whiteSetup = [];
    game.initialBoard.forEach((row, y) => row.forEach((color, x) => {
      if (color === BLACK) blackSetup.push(`[${pointToSgf([x, y])}]`);
      if (color === WHITE) whiteSetup.push(`[${pointToSgf([x, y])}]`);
    }));
    if (blackSetup.length) rootProps.push(`AB${blackSetup.join("")}`);
    if (whiteSetup.length) rootProps.push(`AW${whiteSetup.join("")}`);
    if (game.initialToPlay === WHITE) rootProps.push("PL[W]");
    if (game.result && game.result.resultCode) rootProps.push(`RE[${escapeSgf(game.result.resultCode)}]`);
    rootProps.push(`C[${escapeSgf(`VT-COS ${size}×${size} 棋盤練習；Chinese area scoring、simple ko。${size < 9 ? "此尺寸定位為微型練習盤，不作正式棋力評量。" : "9×9 可作完整小棋盤對局練習。"}人工死子標記只用於終局計分，不是引擎自動死活判定。`)}]`);
    const nodes = game.moves.map((move) => `;${move.color === BLACK ? "B" : "W"}[${move.type === "pass" ? "" : pointToSgf(move.point)}]`).join("");
    const deadNote = (game.deadStones || []).length ? `;C[${escapeSgf(`終局人工標記死子：${game.deadStones.join(" ")}`)}]` : "";
    return `(;${rootProps.join("")}${nodes}${deadNote})`;
  }

  function parseRootSetup(rootNode, size) {
    const stones = [];
    for (const value of rootNode.AB || []) {
      const point = sgfToPoint(value, size);
      if (!point) throw new Error("SGF 佈局黑棋座標不支援。");
      stones.push([point[0], point[1], BLACK]);
    }
    for (const value of rootNode.AW || []) {
      const point = sgfToPoint(value, size);
      if (!point) throw new Error("SGF 佈局白棋座標不支援。");
      stones.push([point[0], point[1], WHITE]);
    }
    return stones;
  }

  function fromSgf(text) {
    if (!Sgf || (typeof Sgf.parseSgfNodes !== "function" && typeof Sgf.parseSgf !== "function")) throw new Error("SGF 解析器不可用。");
    const parsed = typeof Sgf.parseSgfNodes === "function" ? { nodes: Sgf.parseSgfNodes(text) } : Sgf.parseSgf(text);
    const nodes = parsed.nodes || [];
    const rootNode = nodes[0] || {};
    const size = normalizeBoardSize(rootNode.SZ && rootNode.SZ.length ? rootNode.SZ[0] : DEFAULT_SIZE);
    for (let index = 1; index < nodes.length; index += 1) {
      if ((nodes[index].AB && nodes[index].AB.length) || (nodes[index].AW && nodes[index].AW.length)) throw new Error("完整對局續局目前只支援根節點佈局棋子；中途改盤請改用棋譜複盤功能。");
    }
    const initialBoard = boardFromStones(parseRootSetup(rootNode, size), size);
    const initialToPlay = rootNode.PL && rootNode.PL[0] === "W" ? WHITE : (rootNode.AB && rootNode.AB.length >= 2 ? WHITE : BLACK);
    const komi = rootNode.KM && rootNode.KM.length ? sanitizeKomi(rootNode.KM[0]) : defaultKomiForSize(size);
    let game = createGame({ boardSize: size, initialBoard, toPlay: initialToPlay, komi });
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
        const point = sgfToPoint(value, size);
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
    const size = normalizeBoardSize(value.boardSize || (Array.isArray(value.initialBoard) ? value.initialBoard.length : DEFAULT_SIZE));
    if (!isBoard(value.initialBoard, size) || !Array.isArray(value.moves)) throw new Error("保存的棋局缺少必要棋盤或手順。");
    const base = createGame({ boardSize: size, initialBoard: value.initialBoard, toPlay: value.initialToPlay, komi: value.komi, startedAt: value.startedAt });
    let game = replay(base, value.moves.map((move, index) => {
      if (!move || ![BLACK, WHITE].includes(move.color) || !["play", "pass"].includes(move.type)) throw new Error(`保存的第 ${index + 1} 手格式不合法。`);
      if (move.type === "play" && (!Array.isArray(move.point) || move.point.length !== 2 || !move.point.every(Number.isInteger) || move.point.some((coordinate) => coordinate < 0 || coordinate >= size))) throw new Error(`保存的第 ${index + 1} 手缺少合法座標。`);
      return { number: index + 1, color: move.color, type: move.type, point: move.point ? move.point.slice() : null };
    }));
    game.startedAt = value.startedAt || game.startedAt;
    if (value.status === "scoring") {
      if (game.status !== "scoring") throw new Error("保存的計分狀態與手順不一致。");
      game.deadStones = Array.isArray(value.deadStones) ? value.deadStones.filter((key) => {
        if (!/^\d+,\d+$/.test(key)) return false;
        const [x, y] = key.split(",").map(Number);
        return x >= 0 && x < size && y >= 0 && y < size;
      }) : [];
    } else if (value.status === "finished" && value.result && value.result.type === "score") {
      if (game.status !== "scoring") throw new Error("保存的終局計分與手順不一致。");
      game.deadStones = Array.isArray(value.deadStones) ? value.deadStones.filter((key) => {
        if (!/^\d+,\d+$/.test(key)) return false;
        const [x, y] = key.split(",").map(Number);
        return x >= 0 && x < size && y >= 0 && y < size;
      }) : [];
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
    SCHEMA_VERSION, RULES_VERSION, DEFAULT_SIZE, SUPPORTED_SIZES, DEFAULT_KOMI,
    normalizeBoardSize, defaultKomiForSize,
    createGame, play, pass, resign, undo, toggleDeadGroup, scoringBoard, areaScore, currentScore, finalizeScore, resumeFromScoring,
    toSgf, fromSgf, hydrate, resultText, colorName
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoLiveGame = api;
})(typeof window !== "undefined" ? window : globalThis);
