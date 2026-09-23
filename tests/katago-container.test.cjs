const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
const start = fs.readFileSync(path.join(root, "docker", "start-katago.sh"), "utf8");

test("portable image pins KataGo source and uses CPU Eigen backend", () => {
  assert.match(dockerfile, /ARG KATAGO_VERSION=1\.17\.1/);
  assert.match(dockerfile, /--branch "v\$\{KATAGO_VERSION\}"/);
  assert.match(dockerfile, /-DUSE_BACKEND=EIGEN/);
  assert.doesNotMatch(dockerfile, /USE_BACKEND=(CUDA|OPENCL|TENSORRT)/);
});

test("portable image uses the bounded small transformer model", () => {
  assert.match(dockerfile, /b10c384h6nbttflrs\.bin\.gz/);
  assert.match(dockerfile, /curl --fail --location --retry 3/);
  assert.match(dockerfile, /test -s \/opt\/katago\/model\.bin\.gz/);
});

test("container start fails closed without an allowed browser origin", () => {
  assert.match(start, /VTCOS_KATAGO_ALLOWED_ORIGINS:\?/);
  assert.match(start, /VTCOS_KATAGO_HOST="0\.0\.0\.0"/);
  assert.match(start, /VTCOS_KATAGO_PORT="\$\{PORT:-10000\}"/);
  assert.match(start, /exec node \/app\/katago-bridge\.cjs/);
});

test("image does not bake deployment credentials or a production endpoint", () => {
  assert.doesNotMatch(dockerfile + start, /(API_KEY|TOKEN|SECRET)=/);
  assert.doesNotMatch(dockerfile + start, /onrender\.com|workers\.dev|oraclecloud\.com/);
});
