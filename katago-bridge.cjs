#!/usr/bin/env node
"use strict";

const http = require("node:http");
const { spawn } = require("node:child_process");

const REMOTE_MODE = process.env.VTCOS_KATAGO_ALLOW_REMOTE === "1";
const HOST = REMOTE_MODE ? (process.env.VTCOS_KATAGO_HOST || "0.0.0.0") : "127.0.0.1";
const ALLOWED_ORIGINS = new Set(String(process.env.VTCOS_KATAGO_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));
const MAX_CONCURRENT = Math.max(1, Number(process.env.VTCOS_KATAGO_MAX_CONCURRENT || 1));
let activeRequests = 0;
const PORT = Number(process.env.VTCOS_KATAGO_PORT || 8765);
const KATAGO = process.env.VTCOS_KATAGO_EXE;
const CONFIG = process.env.VTCOS_KATAGO_CONFIG;
const MODEL = process.env.VTCOS_KATAGO_MODEL;
const MAX_BODY = 1024 * 1024;
const ENGINE_TIMEOUT_MS = Number(process.env.VTCOS_KATAGO_TIMEOUT_MS || 20000);
const PROVIDER_VERSION = "katago-gtp-bridge-v1";
const COMPARISON_PROVIDER_VERSION = "katago-analysis-comparison-v1";
const ENGINE_VERSION = process.env.VTCOS_KATAGO_ENGINE_VERSION || "unknown";
const Comparison = require("./decision-comparison.js");

function corsOrigin(req) {
  if (!REMOTE_MODE) return "*";
  const origin = String(req.headers.origin || "");
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}
function responseHeaders(req) {
  const origin = corsOrigin(req);
  return origin ? { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : { "Content-Type": "application/json; charset=utf-8" };
}
function fail(req, res, status, code) {
  res.writeHead(status, responseHeaders(req));
  res.end(JSON.stringify({ error: code, providerVersion: PROVIDER_VERSION }));
}
function ok(req, res, body) {
  res.writeHead(200, responseHeaders(req));
  res.end(JSON.stringify(body));
}
function colorName(color) { return color === 1 ? "B" : color === 2 ? "W" : null; }
function modelName() { return MODEL ? MODEL.split(/[\\/]/).pop() : null; }
function comparisonQuery(body) {
  const error = Comparison.validateRequest(body);
  if (error) throw new Error(error);
  const player = colorName(body.toPlay);
  const allowed = body.candidates.map((candidate) => Comparison.pointToGtp(candidate.point, body.boardSize));
  return {
    id: body.requestId,
    initialStones: body.initialStones.map(([color, point]) => [colorName(color), Comparison.pointToGtp(point, body.boardSize)]),
    moves: body.moves.map((move) => [colorName(move.color), move.type === "pass" ? "pass" : Comparison.pointToGtp(move.point, body.boardSize)]),
    rules: body.rules,
    komi: body.komi,
    boardXSize: body.boardSize,
    boardYSize: body.boardSize,
    maxVisits: body.maxVisits,
    analysisPVLen: body.analysisPVLen,
    allowMoves: [{ player, moves: allowed, untilDepth: 1 }]
  };
}
function parseComparisonOutput(body, output) {
  let parsed;
  try { parsed = JSON.parse(String(output || "").trim()); } catch (_) { throw new Error("comparison_engine_json_invalid"); }
  if (!parsed || parsed.id !== body.requestId || parsed.isDuringSearch === true || !Array.isArray(parsed.moveInfos)) throw new Error("comparison_engine_response_invalid");
  if (!parsed.rootInfo || parsed.rootInfo.currentPlayer !== colorName(body.toPlay)) throw new Error("comparison_engine_player_mismatch");
  const infoByMove = new Map(parsed.moveInfos.map((info) => [String(info.move || "").toUpperCase(), info]));
  const candidates = body.candidates.map((candidate) => {
    const move = Comparison.pointToGtp(candidate.point, body.boardSize);
    const info = infoByMove.get(move.toUpperCase());
    if (!info) throw new Error("comparison_candidate_missing_from_engine");
    return {
      role: candidate.role,
      point: candidate.point.slice(),
      order: Number(info.order),
      visits: Number(info.visits),
      scoreLead: Number.isFinite(Number(info.scoreLead)) ? Number(info.scoreLead) : null,
      winrate: Number.isFinite(Number(info.winrate)) ? Number(info.winrate) : null,
      pv: Array.isArray(info.pv) ? info.pv.slice(0, body.analysisPVLen).map(String) : []
    };
  });
  const result = {
    resultVersion: Comparison.RESULT_VERSION,
    comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
    requestId: body.requestId,
    sourceId: body.sourceId,
    positionFingerprint: body.positionFingerprint,
    boardSize: body.boardSize,
    rules: body.rules,
    komi: body.komi,
    maxVisits: body.maxVisits,
    analysisPVLen: body.analysisPVLen,
    searchScope: "root_allow_moves_only",
    authority: "bounded_search_estimate_only",
    formalEligible: false,
    providerVersion: COMPARISON_PROVIDER_VERSION,
    engineVersion: ENGINE_VERSION,
    model: modelName() || "unknown",
    candidates
  };
  const error = Comparison.validateResult(result, body);
  if (error) throw new Error(error);
  return result;
}
function runAnalysisComparison(body) {
  if (!KATAGO || !CONFIG || !MODEL) return Promise.reject(new Error("katago_bridge_not_configured"));
  const query = comparisonQuery(body);
  return new Promise((resolve, reject) => {
    const child = spawn(KATAGO, ["analysis", "-config", CONFIG, "-model", MODEL], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; child.kill(); reject(new Error("katago_timeout")); } }, ENGINE_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } });
    child.on("close", (code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (code !== 0) return reject(new Error("katago_analysis_exit_" + code + ":" + stderr.slice(-300)));
      const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return reject(new Error("katago_analysis_empty"));
      try { resolve(parseComparisonOutput(body, lines[lines.length - 1])); } catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify(query) + "\n");
  });
}
function gtpCoord(point, size) {
  const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
  return letters[point[0]] + String(size - point[1]);
}
function parseGtpMove(text, size) {
  const token = String(text || "").trim().split(/\s+/)[0];
  if (!token) throw new Error("katago_empty_move");
  if (/^pass$/i.test(token)) return { type: "pass" };
  if (/^resign$/i.test(token)) return { type: "resign" };
  const match = /^([A-HJ-Z])(\d+)$/i.exec(token);
  if (!match) throw new Error("katago_move_invalid");
  const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
  const x = letters.indexOf(match[1].toUpperCase());
  const row = Number(match[2]);
  const y = size - row;
  if (x < 0 || x >= size || y < 0 || y >= size) throw new Error("katago_move_out_of_range");
  return { type: "play", point: [x, y] };
}
function validateRequest(body) {
  if (!body || body.contractVersion !== "move-provider-v1") throw new Error("contract_version_unsupported");
  if (![5, 7, 9].includes(body.boardSize)) throw new Error("board_size_unsupported");
  if (![1, 2].includes(body.toPlay)) throw new Error("to_play_invalid");
  if (!Array.isArray(body.moves)) throw new Error("moves_invalid");
  return body;
}
function commandLines(body) {
  const lines = [`boardsize ${body.boardSize}`, "clear_board", `komi ${Number(body.komi) || 0}`];
  if (Array.isArray(body.initialBoard)) {
    for (let y = 0; y < body.initialBoard.length; y += 1) for (let x = 0; x < body.initialBoard[y].length; x += 1) {
      const color = colorName(body.initialBoard[y][x]);
      if (color) lines.push(`play ${color} ${gtpCoord([x, y], body.boardSize)}`);
    }
  }
  for (const move of body.moves) {
    const color = colorName(move.color);
    if (!color) throw new Error("move_color_invalid");
    lines.push(move.type === "pass" ? `play ${color} pass` : `play ${color} ${gtpCoord(move.point, body.boardSize)}`);
  }
  lines.push(`genmove ${colorName(body.toPlay)}`);
  lines.push("quit");
  return lines;
}
function runKatago(body) {
  if (!KATAGO || !CONFIG || !MODEL) return Promise.reject(new Error("katago_bridge_not_configured"));
  return new Promise((resolve, reject) => {
    const child = spawn(KATAGO, ["gtp", "-config", CONFIG, "-model", MODEL], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; child.kill(); reject(new Error("katago_timeout")); } }, ENGINE_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => { if (!settled) { settled = true; clearTimeout(timer); reject(error); } });
    child.on("close", (code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (code !== 0) return reject(new Error("katago_exit_" + code + ":" + stderr.slice(-300)));
      const replies = stdout.split(/\r?\n/).filter((line) => line.startsWith("=") || line.startsWith("?"));
      if (replies.some((line) => line.startsWith("?"))) return reject(new Error("katago_gtp_error"));
      const genmoveReply = replies[replies.length - 2] || replies[replies.length - 1];
      try { resolve(parseGtpMove(genmoveReply.replace(/^=\s*/, ""), body.boardSize)); } catch (error) { reject(error); }
    });
    child.stdin.end(commandLines(body).join("\n") + "\n");
  });
}

const server = http.createServer((req, res) => {
  const origin = corsOrigin(req);
  if (REMOTE_MODE && req.headers.origin && !origin) return fail(req, res, 403, "origin_not_allowed");
  if (req.method === "GET" && req.url === "/health") return ok(req, res, { status: KATAGO && CONFIG && MODEL ? "ready" : "not_configured", providerVersion: PROVIDER_VERSION, comparisonProviderVersion: COMPARISON_PROVIDER_VERSION });
  if (req.method === "OPTIONS") {
    if (!origin) return fail(req, res, 403, "origin_not_allowed");
    res.writeHead(204, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Vary": "Origin" });
    return res.end();
  }
  const isMoveRequest = req.method === "POST" && req.url === "/v1/move";
  const isComparisonRequest = req.method === "POST" && req.url === "/v1/compare";
  if (!isMoveRequest && !isComparisonRequest) return fail(req, res, 404, "not_found");
  if (activeRequests >= MAX_CONCURRENT) return fail(req, res, 429, "busy");
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > MAX_BODY) req.destroy(); });
  req.on("end", async () => {
    let body;
    try {
      const parsed = JSON.parse(raw);
      body = isComparisonRequest ? parsed : validateRequest(parsed);
      if (isComparisonRequest) {
        const error = Comparison.validateRequest(body);
        if (error) throw new Error(error);
      }
    } catch (error) { return fail(req, res, 400, error.message); }
    activeRequests += 1;
    try {
      if (isComparisonRequest) {
        ok(req, res, await runAnalysisComparison(body));
      } else {
        const action = await runKatago(body);
        ok(req, res, { ...action, providerVersion: PROVIDER_VERSION, model: modelName() });
      }
    } catch (error) { fail(req, res, 502, error.message || "katago_failure"); }
    finally { activeRequests -= 1; }
  });
});

if (REMOTE_MODE && ALLOWED_ORIGINS.size === 0) {
  process.stderr.write("VTCOS_KATAGO_ALLOW_REMOTE=1 requires VTCOS_KATAGO_ALLOWED_ORIGINS.\n");
  process.exitCode = 2;
} else server.listen(PORT, HOST, () => {
  process.stdout.write(`VT-COS KataGo bridge listening on http://${HOST}:${PORT}/v1/move and /v1/compare\n`);
  if (!KATAGO || !CONFIG || !MODEL) process.stdout.write("Set VTCOS_KATAGO_EXE, VTCOS_KATAGO_CONFIG and VTCOS_KATAGO_MODEL before requesting a move.\n");
});
