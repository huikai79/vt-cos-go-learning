const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const Live = require("../live-game.js");
const Provider = require("../move-provider.js");

test("move-provider v1 payload only exposes canonical game facts", () => {
  let game = Live.createGame({ boardSize: 9 });
  game = Live.play(game, 4, 4).game;
  const payload = Provider.gamePayload(game);
  assert.equal(payload.contractVersion, "move-provider-v1");
  assert.equal(payload.boardSize, 9);
  assert.equal(payload.moves.length, 1);
  assert.deepEqual(payload.moves[0].point, [4,4]);
  assert.equal("score" in payload, false);
});

test("provider action rejects malformed and out-of-range moves", () => {
  assert.throws(() => Provider.validateAction({ type: "play", point: [9, 0] }, 9), /out_of_range/);
  assert.throws(() => Provider.validateAction({ type: "guess", point: [0, 0] }, 9), /action_invalid/);
  assert.deepEqual(Provider.validateAction({ type: "pass" }, 9).type, "pass");
});

test("remote provider accepts a versioned play response", async () => {
  const server = http.createServer((req, res) => {
    let raw = ""; req.on("data", (chunk) => raw += chunk); req.on("end", () => {
      const body = JSON.parse(raw);
      assert.equal(body.contractVersion, "move-provider-v1");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ type: "play", point: [2, 3], providerVersion: "fixture-v1", model: "fixture" }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    const action = await Provider.requestRemote(Live.createGame({ boardSize: 9 }), { endpoint: `http://127.0.0.1:${port}/v1/move`, timeoutMs: 2000 });
    assert.deepEqual(action.point, [2,3]);
    assert.equal(action.providerVersion, "fixture-v1");
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("remote provider failure remains failure and never invents fallback action", async () => {
  const server = http.createServer((req, res) => { res.writeHead(503); res.end("down"); });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    await assert.rejects(() => Provider.requestRemote(Live.createGame({ boardSize: 9 }), { endpoint: `http://127.0.0.1:${port}/v1/move`, timeoutMs: 2000 }), /provider_http_503/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
