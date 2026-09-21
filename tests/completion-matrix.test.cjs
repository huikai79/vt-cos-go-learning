const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { units, lessons, problems } = require("../content.js");
const { phase2Problems } = require("../phase2-content.js");

const matrix = fs.readFileSync(path.join(__dirname, "..", "COMPLETION_MATRIX.md"), "utf8");

test("完成矩陣的題庫與示範計數可由目前內容重算", () => {
  assert.equal(units.length, 15);
  assert.equal(lessons.length, 19);
  assert.equal(problems.length, 106);
  assert.equal(lessons.filter((lesson) => lesson.demoSteps?.length >= 2).length, 19);
  assert.equal(phase2Problems.length, 148);
  assert.match(matrix, /15 單元、19 課、106 題/);
  assert.match(matrix, /19 課都有文字短講及至少兩步棋盤示範/);
  assert.match(matrix, /100 題吃子、連接與救棋，加上 48 題兩類基礎死活/);
});

test("完成矩陣區分已實作診斷與尚未取得的正式資料或外部證據", () => {
  assert.match(matrix, /穩定修正距離與再犯間隔[\s\S]*?尚無真人延後結果，指標效度未驗/);
  assert.match(matrix, /不推定粗心、誤解等心理根因/);
  assert.match(matrix, /兩類死活內容仍待獨立審題/);
  assert.match(matrix, /R1a 棋理與構念核對[\s\S]*?待外部審查/);
  assert.match(matrix, /R1b 平行題可比性[\s\S]*?未建立/);
  assert.match(matrix, /待短任務觀察/);
  assert.match(matrix, /未量測/);
});

test("完成矩陣記錄 Phase 3 導覽工程完成但保留真人閘門", () => {
  assert.match(matrix, /只有確實有題目到期時顯示「今日到期」及數量[\s\S]*?條件通過；是否容易理解仍待真人觀察/);
  assert.match(matrix, /reviewer-only 77 題母體覆蓋完整 148 題題庫的 43 家族代表與全部 48 題公開保留組/);
  assert.match(matrix, /學習頁不再提供入口[\s\S]*?外部回條仍待不同於學習者的審查者完成/);
});

test("完成矩陣明示個人 pilot、已知曝光及正式評量停用", () => {
  assert.match(matrix, /`claim_mode`: `personal_descriptive`/);
  assert.match(matrix, /`trial_protocol`: `personal-pilot-v3`/);
  assert.match(matrix, /`formal_evaluation_available`: false/);
  assert.match(matrix, /舊 R1 自我審查草稿中的 22 題/);
  assert.match(matrix, /`formalEligible=false`/);
});
