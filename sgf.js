(function (root) {
  "use strict";
  const Go = typeof require === "function" && typeof module !== "undefined" ? require("./go.js") : root.GoCore;
  const { BLACK, WHITE, boardFromStones, playMove, groupAt } = Go;
  const MAX_SGF_FILE_BYTES = 1_000_000;
  const MAX_SGF_NODES = 10_000;
  const MAX_SGF_DEPTH = 128;

  function fail(message) { throw new Error(`SGF 無法匯入：${message}`); }
  function skip(text, state) { while (/\s/.test(text[state.i] || "")) state.i += 1; }
  function parseNode(text, state) {
    state.nodes += 1;
    if (state.nodes > MAX_SGF_NODES) fail(`節點過多（上限 ${MAX_SGF_NODES}）`);
    state.i += 1;
    const node = {};
    while (true) {
      skip(text, state);
      const match = /^[A-Z]+/.exec(text.slice(state.i));
      if (!match) return node;
      const name = match[0]; state.i += name.length; node[name] = [];
      skip(text, state);
      while (text[state.i] === "[") {
        state.i += 1; let value = "";
        while (state.i < text.length && text[state.i] !== "]") {
          if (text[state.i] === "\\" && state.i + 1 < text.length) state.i += 1;
          value += text[state.i++];
        }
        if (text[state.i] !== "]") fail("屬性值缺少 ]");
        state.i += 1; node[name].push(value); skip(text, state);
      }
    }
  }
  function parseTree(text, state, depth = 1) {
    if (depth > MAX_SGF_DEPTH) fail(`巢狀過深（上限 ${MAX_SGF_DEPTH} 層）`);
    if (text[state.i] !== "(") fail("缺少 ( ");
    state.i += 1; const nodes = []; const children = [];
    while (state.i < text.length) {
      skip(text, state);
      if (text[state.i] === ";") nodes.push(parseNode(text, state));
      else if (text[state.i] === "(") children.push(parseTree(text, state, depth + 1));
      else if (text[state.i] === ")") { state.i += 1; return { nodes, children }; }
      else fail(`無法辨識字元 ${text[state.i]}`);
    }
    fail("缺少 )");
  }
  function mainline(tree) {
    if (tree.children.length > 1) fail("目前不支援含分支變化的棋譜");
    return [...tree.nodes, ...(tree.children.length ? mainline(tree.children[0]) : [])];
  }
  function point(value) {
    if (!/^[a-i]{2}$/.test(value || "")) return null;
    return [value.charCodeAt(0) - 97, value.charCodeAt(1) - 97];
  }
  function setup(board, node, name, color) {
    for (const value of node[name] || []) {
      const p = point(value); if (!p) fail(`${name} 的座標不支援`);
      if (board[p[1]][p[0]] !== 0) fail("佈局棋子重疊");
      board[p[1]][p[0]] = color;
    }
  }
  function parseSgfNodes(text) {
    if (typeof text !== "string" || !text.trim()) fail("檔案是空的");
    if (text.length > MAX_SGF_FILE_BYTES) fail(`檔案過大（上限 ${MAX_SGF_FILE_BYTES} bytes）`);
    const state = { i: 0, nodes: 0 }; skip(text, state);
    const tree = parseTree(text, state);
    skip(text, state);
    if (state.i !== text.length) {
      if (text[state.i] === "(") fail("一次只能匯入一盤棋");
      fail(`結尾含無法辨識的字元 ${text[state.i]}`);
    }
    return mainline(tree);
  }
  function parseSgf(text) {
    const nodes = parseSgfNodes(text);
    const size = (nodes[0] && nodes[0].SZ && nodes[0].SZ[0]) || "19";
    if (size !== "9") fail("目前只支援 9 路棋譜");
    let board = boardFromStones([]); let previousBoard = null; let moveNumber = 0; const moves = [];
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
      const node = nodes[nodeIndex]; setup(board, node, "AB", BLACK); setup(board, node, "AW", WHITE);
      if (node.B && node.W) fail("同一節點不能同時包含黑棋與白棋著手");
      const property = node.B ? "B" : node.W ? "W" : null;
      if (!property) continue;
      moveNumber += 1;
      if (node[property].length !== 1) fail(`第 ${moveNumber} 手的著手資料不完整`);
      const value = node[property][0];
      const move = point(value);
      if (!move) {
        if (value !== "") fail(`第 ${moveNumber} 手的座標不支援`);
        previousBoard = board.map((row) => row.slice());
        continue; // pass 無法建立局部落子題，但仍保留原局手數。
      }
      const color = property === "B" ? BLACK : WHITE;
      const before = board.map((row) => row.slice());
      const result = playMove(board, move[0], move[1], color, { previousBoard });
      if (!result.legal) fail(`第 ${moveNumber} 手不合法：${result.reason}`);
      moves.push({ number: moveNumber, nodeIndex, color, point: move, before, result });
      previousBoard = before;
      board = result.board;
    }
    return { boardSize: 9, nodes, moves };
  }
  function stonesFromBoard(board) {
    const stones = [];
    board.forEach((row, y) => row.forEach((color, x) => { if (color) stones.push([x, y, color]); }));
    return stones;
  }
  function sourceFingerprint(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `sgf-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function connectedGroups(board, move, color) {
    const keys = new Set();
    for (const [x, y] of [[move[0] - 1, move[1]], [move[0] + 1, move[1]], [move[0], move[1] - 1], [move[0], move[1] + 1]]) {
      const group = groupAt(board, x, y);
      if (group && group.color === color) keys.add(group.stones.map((p) => p.join(",")).sort().join("|"));
    }
    return keys.size;
  }
  function makeLocalExercise(text, moveNumber = 1, sourceName = "匯入的棋譜") {
    const game = parseSgf(text); const move = game.moves.find((item) => item.number === moveNumber);
    if (!move) fail(`找不到第 ${moveNumber} 手可建立局部題`);
    const isCapture = move.result.captured.length > 0;
    const joined = connectedGroups(move.before, move.point, move.color) >= 2;
    const linkedSkillId = isCapture ? "capture-last-liberty-v1" : joined ? "direct-join-v1" : null;
    const linkedSkill = isCapture ? "一手提子" : joined ? "直接連接" : "待人工確認";
    const sourceId = sourceFingerprint(text);
    return {
      id: `local-sgf-${sourceId}-${move.nodeIndex}-${move.point.join("-")}`, purpose: "local_sgf_review", taskMode: "實戰局部", boardSize: 9,
      type: "move", playerColor: move.color, stones: stonesFromBoard(move.before), answer: move.point, goal: { type: "exact", answer: move.point }, focus: [],
      title: `棋譜局部複習｜第 ${move.number} 手`, prompt: `原局第 ${move.number} 手輪到${move.color === BLACK ? "黑" : "白"}棋。先重讀局面，再下出原局的著手。`,
      hint: "這是原局著手重建，不代表原著是唯一最佳手。需要時回到棋譜或外部分析工具核對。",
      explanation: `原局第 ${move.number} 手落在此處；規則辨識連結：${linkedSkill}。請在匯出後寫下當時漏看的棋形或候選手。`,
      feedbackPolicy: "manual_review", skillCue: false, linkedSkillId, linkedSkill, transferLevel: "T3_candidate",
      source: {
        type: "sgf", sourceId, sourceName, moveNumber: move.number, nodeIndex: move.nodeIndex,
        originalMove: move.point, playerColor: move.color, boardSize: 9,
        originalStones: stonesFromBoard(move.before)
      }
    };
  }
  const api = { MAX_SGF_FILE_BYTES, parseSgfNodes, parseSgf, makeLocalExercise, sourceFingerprint };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoSgf = api;
})(typeof window !== "undefined" ? window : globalThis);
