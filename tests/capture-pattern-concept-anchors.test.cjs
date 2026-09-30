const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const record = fs.readFileSync(path.join(root, "research", "capture-pattern-concept-anchors-v1.md"), "utf8");

test("capture pattern research 保留 Research→Teaching 邊界，不把教材術語直接升格 KC", () => {
  assert.match(record, /researchId: `capture-pattern-concept-anchors-v1`/);
  assert.match(record, /DOUBLE_ATARI_TEACHING_CANDIDATE/);
  assert.match(record, /ENCLOSURE_CAPTURE_TEACHING_CANDIDATE/);
  assert.match(record, /DOOR_AND_HUG_LABEL_SPLIT_UNKNOWN/);
  assert.match(record, /不代表每次出現 double atari 都必然「吃到一邊」/);
  assert.match(record, /不證明「雙打吃」應是獨立 KC/);
  assert.match(record, /門吃.*Unknown/s);
  assert.match(record, /抱吃.*Unknown/s);
  assert.match(record, /公開題目.*exposed.*formal unseen evaluation/s);
});

test("跨語 term map 只把已核對的雙打吃標 Equivalent，不替門吃抱吃造外語同義詞", () => {
  assert.match(record, /zh \| 雙打吃／双打吃 \| Equivalent/);
  assert.match(record, /ja \| 両アタリ \| Equivalent/);
  assert.match(record, /en \| double atari \| Equivalent/);
  assert.match(record, /門吃／关门吃 \| Equivalent/);
  assert.match(record, /抱吃 \| Equivalent/);
  assert.match(record, /ja \| — \| Unknown/);
  assert.match(record, /en \| — \| Unknown/);
  assert.doesNotMatch(record, /門吃.*\| (?:ゲタ|net) \| Equivalent/s);
  assert.doesNotMatch(record, /抱吃.*\| (?:ゲタ|net) \| Equivalent/s);
});

test("v2 只升共同 enclosure_capture 機制，門吃／抱吃 label split 維持 UNKNOWN", () => {
  assert.match(record, /snapshotVersion: 2/);
  assert.match(record, /四個本站原創、非單純鏡射/);
  assert.match(record, /sourceLabelCandidate=unknown/);
  assert.match(record, /enclosure_capture.*Teaching Candidate/s);
  assert.match(record, /door_capture.*hug_capture.*UNKNOWN \/ NOT_PROMOTED/s);
  assert.doesNotMatch(record, /door_capture[^\n]*TEACHING_CANDIDATE/);
  assert.doesNotMatch(record, /hug_capture[^\n]*TEACHING_CANDIDATE/);
});

test("雙打吃 promotion decision 要求 rules-backed 四項棋盤條件", () => {
  for (const required of [
    "黑棋候選手合法",
    "落子前兩串白棋彼此分離且各有兩氣",
    "落子後兩串白棋仍彼此分離且各只剩一氣",
    "該手不立即提子"
  ]) assert.ok(record.includes(required), required);
});
