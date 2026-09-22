(function (root) {
  "use strict";

  const PROVIDER_CONTRACT_VERSION = "move-provider-v1";
  const DEFAULT_TIMEOUT_MS = 15000;

  function normalizeEndpoint(value) {
    const text = String(value || "").trim();
    if (!text) throw new Error("provider_endpoint_missing");
    let url;
    try { url = new URL(text); } catch (_) { throw new Error("provider_endpoint_invalid"); }
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("provider_endpoint_protocol_not_allowed");
    return url.toString();
  }

  function gamePayload(game) {
    if (!game || game.status !== "playing") throw new Error("provider_game_not_playing");
    return {
      contractVersion: PROVIDER_CONTRACT_VERSION,
      boardSize: game.boardSize,
      komi: game.komi,
      rulesVersion: game.rulesVersion,
      toPlay: game.toPlay,
      consecutivePasses: game.consecutivePasses,
      initialBoard: game.initialBoard.map((row) => row.slice()),
      moves: game.moves.map((move) => ({
        number: move.number,
        color: move.color,
        type: move.type,
        point: move.point ? move.point.slice() : null
      }))
    };
  }

  function validateAction(action, boardSize) {
    if (!action || typeof action !== "object") throw new Error("provider_response_invalid");
    if (action.type === "pass" || action.type === "resign") return { type: action.type, providerVersion: action.providerVersion || null, model: action.model || null };
    if (action.type !== "play" || !Array.isArray(action.point) || action.point.length !== 2) throw new Error("provider_action_invalid");
    const x = Number(action.point[0]), y = Number(action.point[1]);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= boardSize || y >= boardSize) throw new Error("provider_point_out_of_range");
    return { type: "play", point: [x, y], providerVersion: action.providerVersion || null, model: action.model || null };
  }

  async function requestRemote(game, options = {}) {
    const endpoint = normalizeEndpoint(options.endpoint);
    const controller = new AbortController();
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1000, options.timeoutMs) : DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(gamePayload(game)),
        signal: controller.signal
      });
    } catch (error) {
      if (error && error.name === "AbortError") throw new Error("provider_timeout");
      throw new Error("provider_network_error");
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    let body;
    try { body = await response.json(); } catch (_) { throw new Error("provider_json_invalid"); }
    return validateAction(body, game.boardSize);
  }

  function heuristic(game, bot) {
    if (!bot || typeof bot.chooseAction !== "function") throw new Error("heuristic_provider_unavailable");
    return Promise.resolve(validateAction(bot.chooseAction(game), game.boardSize));
  }

  function requestAction(game, options = {}) {
    if (options.kind === "heuristic") return heuristic(game, options.bot);
    if (options.kind === "katago" || options.kind === "remote") return requestRemote(game, options);
    return Promise.reject(new Error("provider_kind_unsupported"));
  }

  const api = { PROVIDER_CONTRACT_VERSION, DEFAULT_TIMEOUT_MS, gamePayload, validateAction, requestRemote, requestAction };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoMoveProvider = api;
})(typeof window !== "undefined" ? window : globalThis);
