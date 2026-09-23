const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

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
