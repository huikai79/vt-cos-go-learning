const test = require("node:test");
const assert = require("node:assert/strict");
const SabakiSgf = require("@sabaki/sgf");
const { parseSgf } = require("../sgf.js");
const { sampleSgf } = require("../phase4-content.js");

function sabakiMainline(text) {
  const roots = SabakiSgf.parse(text);
  assert.equal(roots.length, 1, "oracle corpus must contain exactly one game tree");
  const nodes = [];
  let node = roots[0];
  while (node) {
    nodes.push(node);
    assert.ok(node.children.length <= 1, "oracle common-subset corpus must not contain branches");
    node = node.children[0] || null;
  }
  return nodes;
}

function movesFromSabaki(text) {
  const nodes = sabakiMainline(text);
  let moveNumber = 0;
  const moves = [];
  for (const [nodeIndex, node] of nodes.entries()) {
    const hasB = Array.isArray(node.data.B);
    const hasW = Array.isArray(node.data.W);
    assert.equal(hasB && hasW, false, "common subset forbids B and W in one node");
    if (!hasB && !hasW) continue;
    moveNumber += 1;
    const property = hasB ? "B" : "W";
    assert.equal(node.data[property].length, 1);
    const value = node.data[property][0];
    if (value === "") continue;
    const point = SabakiSgf.parseVertex(value);
    assert.notDeepEqual(point, [-1, -1]);
    moves.push({
      number: moveNumber,
      nodeIndex,
      color: property === "B" ? 1 : 2,
      point
    });
  }
  return moves;
}

const commonSubsetCases = [
  ["sample", sampleSgf],
  ["setup-and-capture", "(;GM[1]FF[4]SZ[9]AB[de][ed][fe]AW[ee];B[ef])"],
  ["multi-move", "(;GM[1]FF[4]SZ[9];B[dd];W[ee];B[fd])"],
  ["pass-preserves-numbering", "(;GM[1]FF[4]SZ[9];B[aa];W[];B[bb])"],
  ["escaped-comment", "(;GM[1]FF[4]SZ[9]C[hello\\]world];B[cc])"]
];

for (const [name, sgf] of commonSubsetCases) {
  test(`SabakiHQ/sgf oracle agrees on supported subset: ${name}`, () => {
    const ours = parseSgf(sgf);
    const oracleMoves = movesFromSabaki(sgf);
    assert.deepEqual(
      ours.moves.map(({ number, nodeIndex, color, point }) => ({ number, nodeIndex, color, point })),
      oracleMoves
    );
  });
}

test("SabakiHQ/sgf intentionally supports branches that bounded parser rejects", () => {
  const branched = "(;GM[1]FF[4]SZ[9];B[aa](;W[bb])(;W[cc]))";
  const roots = SabakiSgf.parse(branched);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].children[0].children.length, 2);
  assert.throws(() => parseSgf(branched), /分支變化/);
});

test("SabakiHQ/sgf intentionally supports collections that bounded parser rejects", () => {
  const collection = "(;GM[1]FF[4]SZ[9];B[aa])(;GM[1]FF[4]SZ[9];W[bb])";
  assert.equal(SabakiSgf.parse(collection).length, 2);
  assert.throws(() => parseSgf(collection), /一次只能匯入一盤/);
});
