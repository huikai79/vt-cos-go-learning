const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");
const Comparison = require("../decision-comparison.js");

const bridge = path.join(__dirname, "..", "katago-bridge.cjs");

function start(extraEnv = {}) {
  const child = spawn(process.execPath, [bridge], {
    env: {
      ...process.env,
      VTCOS_KATAGO_PORT: "18765",
      VTCOS_KATAGO_EXE: "",
      VTCOS_KATAGO_CONFIG: "",
      VTCOS_KATAGO_MODEL: "",
      ...extraEnv
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  return child;
}
function waitListening(child) {
  return new Promise((resolve, reject) => {
    let out = "", err = "";
    const timer = setTimeout(() => reject(new Error("bridge_start_timeout:" + err)), 3000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      if (out.includes("listening on")) { clearTimeout(timer); resolve(); }
    });
    child.stderr.on("data", (d) => err += d.toString());
    child.on("exit", (code) => { if (!out.includes("listening on")) { clearTimeout(timer); reject(new Error("bridge_exit_" + code + ":" + err)); } });
  });
}
function requestJson(route, body, origin) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname:"127.0.0.1", port:18765, path:route, method:"POST",
      headers: { "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload), ...(origin ? { Origin:origin } : {}) }
    }, (res) => {
      let text=""; res.on("data", d => text += d); res.on("end", () => resolve({ status:res.statusCode, headers:res.headers, body:text }));
    });
    req.on("error", reject); req.end(payload);
  });
}

function request(method, route, origin) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname:"127.0.0.1", port:18765, path:route, method, headers: origin ? { Origin: origin } : {} }, (res) => {
      let body=""; res.on("data", d => body += d); res.on("end", () => resolve({ status:res.statusCode, headers:res.headers, body }));
    });
    req.on("error", reject); req.end();
  });
}

test("hosted mode fails closed without an origin allowlist", async () => {
  const child = start({ VTCOS_KATAGO_ALLOW_REMOTE:"1", VTCOS_KATAGO_ALLOWED_ORIGINS:"" });
  let stderr="";
  child.stderr.on("data", d => stderr += d.toString());
  const code = await new Promise(resolve => child.on("exit", resolve));
  assert.equal(code, 2);
  assert.match(stderr, /requires VTCOS_KATAGO_ALLOWED_ORIGINS/);
});

test("hosted mode allows only configured browser origin and exposes bounded health", async () => {
  const child = start({ VTCOS_KATAGO_ALLOW_REMOTE:"1", VTCOS_KATAGO_HOST:"127.0.0.1", VTCOS_KATAGO_ALLOWED_ORIGINS:"https://huikai.com.kg" });
  try {
    await waitListening(child);
    const denied = await request("GET", "/health", "https://evil.example");
    assert.equal(denied.status, 403);
    assert.equal(denied.headers["access-control-allow-origin"], undefined);

    const allowed = await request("GET", "/health", "https://huikai.com.kg");
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers["access-control-allow-origin"], "https://huikai.com.kg");
    assert.equal(JSON.parse(allowed.body).status, "not_configured");
  } finally { child.kill(); }
});

test("comparison endpoint validates contract and never falls back when KataGo is unavailable", async () => {
  const child = start();
  try {
    await waitListening(child);
    const invalid = await requestJson("/v1/compare", { contractVersion:"wrong" });
    assert.equal(invalid.status, 400);
    assert.match(JSON.parse(invalid.body).error, /comparison_request_contract_invalid/);

    const request = {
      contractVersion: Comparison.REQUEST_VERSION,
      comparisonContractVersion: Comparison.COMPARISON_CONTRACT_VERSION,
      requestId: "hosted-comparison",
      sourceId: "sgf-test",
      positionFingerprint: "position-test",
      boardSize: 19,
      toPlay: 1,
      rules: "japanese",
      komi: 6.5,
      maxVisits: 100,
      analysisPVLen: 8,
      historyMode: "root_setup_plus_moves",
      initialStones: [],
      moves: [{ color:1, type:"play", point:[15,3] }, { color:2, type:"play", point:[3,3] }],
      candidates: [{ role:"learner_first", point:[4,4] }, { role:"original_game", point:[16,15] }],
      authority: "bounded_search_estimate_only",
      formalEligible: false
    };
    assert.equal(Comparison.validateRequest(request), null);
    const unavailable = await requestJson("/v1/compare", request);
    assert.equal(unavailable.status, 502);
    assert.equal(JSON.parse(unavailable.body).error, "katago_bridge_not_configured");
  } finally { child.kill(); }
});
