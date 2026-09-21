const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = require("../release-manifest.json");
const phase2 = require("../phase2-content.js");
const foundationBank = require("../phase2-foundation-bank.js");
const lifeAndDeathBank = require("../phase2-life-death-bank.js");

test("公開發布決策與題庫用途為機器可讀契約", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseName, "vt-cos-go-learning-prototype-public");
  assert.deepEqual(manifest.brand, {
    parent: "VT-COS",
    parentExpanded: "Vibe Thinking – Cognitive Operating System",
    product: "一手一懂",
    publicName: "VT-COS｜一手一懂"
  });
  assert.deepEqual(manifest.publicationDecision, {
    questionBankVisibility: "public",
    acceptedOn: "2026-09-21",
    blindAssessmentEligible: false,
    formalHoldoutPoolStatus: "retired_due_to_publication",
    replacementRequiredForFormalEvaluation: true
  });
  assert.deepEqual(phase2.publicationPolicy, {
    sourceVisibility: "public",
    confidential: false,
    blindAssessmentEligible: false,
    formalHoldoutPoolStatus: "retired_due_to_publication",
    replacementRequiredForFormalEvaluation: true,
    decision: "accepted_public",
    acceptedOn: "2026-09-21"
  });
});

test("公開 repository 附帶標準 MIT 授權", () => {
  const license = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
  assert.match(license, /^MIT License\r?\n/);
  assert.match(license, /Copyright \(c\) 2026 huikai79/);
  assert.ok(manifest.publicFiles.includes("LICENSE"));
});

test("兩個公開入口與 README 使用同一品牌名稱", () => {
  for (const file of ["index.html", "r1-review.html", "README.md"]) {
    assert.match(fs.readFileSync(path.join(root, file), "utf8"), /VT-COS｜一手一懂/, file);
  }
});

test("Pages 採無 Jekyll 的 repository root 靜態發布", () => {
  assert.deepEqual(manifest.hosting, {
    kind: "static",
    buildRequired: false,
    pagesSource: "repository-root",
    pagesBranch: "main",
    pagesPath: "/",
    pagesUrl: "https://huikai.com.kg/vt-cos-go-learning/",
    defaultProjectUrl: "https://huikai79.github.io/vt-cos-go-learning/",
    accountCustomDomainInherited: true,
    jekyllDisabled: true,
    entrypoints: ["index.html", "r1-review.html"]
  });
  assert.equal(fs.statSync(path.join(root, ".nojekyll")).isFile(), true);
});

test("公開清單沒有重複、絕對路徑或排除項目，且每個檔案都存在", () => {
  assert.equal(new Set(manifest.publicFiles).size, manifest.publicFiles.length);
  for (const relativePath of manifest.publicFiles) {
    assert.equal(path.isAbsolute(relativePath), false, `${relativePath} must be relative`);
    assert.equal(relativePath.includes(".."), false, `${relativePath} must stay inside repository`);
    assert.equal(fs.statSync(path.join(root, relativePath)).isFile(), true, `${relativePath} must exist`);
  }
  for (const excluded of manifest.excludedPatterns) {
    const prefix = excluded.replace(/[*].*$/, "");
    assert.equal(manifest.publicFiles.some((file) => file.startsWith(prefix)), false, `${excluded} must stay excluded`);
  }
});

test("兩個題庫來源模組組回原有 148 題契約", () => {
  const foundationCount = foundationBank.captureFamilies.reduce((sum, family) => sum + family.positions.length, 0)
    + foundationBank.joinFamilies.reduce((sum, family) => sum + family.positions.length, 0)
    + foundationBank.rescueFamilies.reduce((sum, family) => sum + family.positions.length, 0);
  const lifeAndDeathCount = lifeAndDeathBank.straightThreeFamilies.reduce((sum, family) => sum + family.centers.length, 0) * 4;
  assert.equal(foundationCount, 100);
  assert.equal(lifeAndDeathCount, 48);
  assert.equal(phase2.phase2Problems.length, 148);
  assert.equal(new Set(phase2.phase2Problems.map((problem) => problem.id)).size, 148);
});

test("學習入口載入完整題庫，R1 入口只載入去答案審查資料", () => {
  const learningHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const foundationIndex = learningHtml.indexOf('src="phase2-foundation-bank.js"');
  const lifeAndDeathIndex = learningHtml.indexOf('src="phase2-life-death-bank.js"');
  const assemblerIndex = learningHtml.indexOf('src="phase2-content.js"');
  assert.ok(foundationIndex >= 0 && foundationIndex < assemblerIndex);
  assert.ok(lifeAndDeathIndex >= 0 && lifeAndDeathIndex < assemblerIndex);

  const reviewHtml = fs.readFileSync(path.join(root, "r1-review.html"), "utf8");
  assert.match(reviewHtml, /src="r1-review-bank\.js"/);
  assert.doesNotMatch(reviewHtml, /phase2-(foundation-bank|life-death-bank|content)\.js/);
  assert.ok(reviewHtml.indexOf('src="r1-review-bank.js"') < reviewHtml.indexOf('src="r1-review.js"'));
});
