#!/usr/bin/env node
"use strict";

const http = require("node:http");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = Number(process.env.VTCOS_KATAGO_PORT || 8765);
const KATAGO = process.env.VTCOS_KATAGO_EXE;
const CONFIG = process.env.VTCOS_KATAGO_CONFIG;
const MODEL = process.env.VTCOS_KATAGO_MODEL;
const MAX_BODY = 1024 * 1024;
const ENGINE_TIMEOUT_MS = Number(process.env.VTCOS_KATAGO_TIMEOUT_MS || 20000);
const PROVIDER_VERSION = "katago-gtp-bridge-v1";

function fail(res, status, code) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ error: code, providerVersion: PROVIDER_VERSION }));
}
function ok(res, body) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}
function colorName(color) { return color === 1 ? "B" : color === 2 ? "W" : null; }
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
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" });
    return res.end();
  }
  if (req.method !== "POST" || req.url !== "/v1/move") return fail(res, 404, "not_found");
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > MAX_BODY) req.destroy(); });
  req.on("end", async () => {
    let body;
    try { body = validateRequest(JSON.parse(raw)); } catch (error) { return fail(res, 400, error.message); }
    try {
      const action = await runKatago(body);
      ok(res, { ...action, providerVersion: PROVIDER_VERSION, model: MODEL ? MODEL.split(/[\\/]/).pop() : null });
    } catch (error) { fail(res, 502, error.message || "katago_failure"); }
  });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`VT-COS KataGo bridge listening on http://${HOST}:${PORT}/v1/move\n`);
  if (!KATAGO || !CONFIG || !MODEL) process.stdout.write("Set VTCOS_KATAGO_EXE, VTCOS_KATAGO_CONFIG and VTCOS_KATAGO_MODEL before requesting a move.\n");
});
