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
    product: "悟之一手",
    publicName: "VT-COS｜悟之一手",
    productEn: "A Move of Insight",
    publicNameEn: "VT-COS｜A Move of Insight"
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
    assert.match(fs.readFileSync(path.join(root, file), "utf8"), /VT-COS｜悟之一手/, file);
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
    entrypoints: ["index.html", "advanced.html", "classic-shapes.html", "history.html", "live-game.html", "r1-review-start.html", "r1-review.html"]
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


test("曲四 status proof 資產列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  assert.ok(manifest.publicFiles.includes("classic-curved-four-status-contract.js"));
  assert.ok(manifest.publicFiles.includes("classic-curved-four-status-practice.js"));
});

test("四目眼 status proof 資產列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  assert.ok(manifest.publicFiles.includes("classic-four-space-status-contract.js"));
  assert.ok(manifest.publicFiles.includes("classic-four-space-status-practice.js"));
});

test("曲三 bounded practice 資產列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  assert.ok(manifest.publicFiles.includes("classic-bent-three-contract.js"));
  assert.ok(manifest.publicFiles.includes("classic-bent-three-practice.js"));
});

test("丁四 bounded practice 資產列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  assert.ok(manifest.publicFiles.includes("classic-pyramid-four-contract.js"));
  assert.ok(manifest.publicFiles.includes("classic-pyramid-four-practice.js"));
});

test("大豬嘴 source-case 與第三方 notice 一併列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  for (const file of ["classic-big-pigs-mouth-contract.js","classic-big-pigs-mouth-practice.js","THIRD_PARTY_NOTICES.md"]) {
    assert.ok(manifest.publicFiles.includes(file), file);
  }
});

test("世界名型 ontology、geometry registry 與 compatibility catalog 都列入公開發佈清單", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "release-manifest.json"), "utf8"));
  assert.ok(manifest.publicFiles.includes("classic-shapes-ontology.js"));
  assert.ok(manifest.publicFiles.includes("classic-geometry-fingerprint.js"));
  assert.ok(manifest.publicFiles.includes("classic-geometry-extraction.js"));
  assert.ok(manifest.publicFiles.includes("classic-geometry-reference-oracle.js"));
  assert.ok(manifest.publicFiles.includes("classic-geometry-evidence.js"));
  assert.ok(manifest.publicFiles.includes("tests/classic-geometry-extraction.test.cjs"));
  assert.ok(manifest.publicFiles.includes("tests/classic-geometry-reference-oracle.test.cjs"));
  assert.ok(manifest.publicFiles.includes("classic-shapes-catalog.js"));
  assert.ok(manifest.hosting.entrypoints.includes("classic-shapes.html"));
});


test("歷史探索頁與樣式列入公開靜態入口，但不進 learner runtime", () => {
  assert.ok(manifest.hosting.entrypoints.includes("history.html"));
  for (const file of [
    "history.html",
    "history.css",
    "assets/history/hero-board-evolution.jpg",
    "assets/history/board-size-17-to-19.jpg",
    "assets/history/opening-stones-to-empty-board.jpg",
    "assets/history/komi-first-move.jpg",
    "assets/history/ai-go-reassessment.jpg",
    "tests/history.test.cjs"
  ]) {
    assert.ok(manifest.publicFiles.includes(file), file);
  }
});


test("main push verify 內建 served-content gate，不把 deploy success 當成內容已更新", () => {
  const workflowPath = path.join(root, ".github", "workflows", "verify.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.equal(manifest.publicFiles.includes(".github/workflows/pages-smoke.yml"), false);
  assert.match(workflow, /served-pages-content:/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /needs:\s*[\s\S]*node-contracts[\s\S]*sabaki-sgf-oracle[\s\S]*windows-ui-and-boundary/);
  assert.match(workflow, /history\.css\?v=history-explore-v6/);
  assert.match(workflow, /兩個 72 不能當成同一條歷史因果證據/);
  assert.match(workflow, /132｜東漢望都/);
  assert.match(workflow, /1949 → 1989｜規則到近現代仍在成文化與修訂/);
  assert.match(workflow, /本頁來源最後查核：2026-09-28/);
  assert.match(workflow, /href="advanced\.html">回進階訓練<\/a>/);
  assert.match(workflow, /attempt <= 12/);
});


test("R1a reviewer handoff 是公開 reviewer-only entrypoint", () => {
  assert.ok(manifest.hosting.entrypoints.includes("r1-review-start.html"));
  assert.ok(manifest.publicFiles.includes("r1-review-start.html"));
  const html = fs.readFileSync(path.join(root, "r1-review-start.html"), "utf8");
  assert.match(html, /R1a 外部獨立內容審查交接/);
  assert.match(html, /go-r1-independent-content-review-v5/);
  assert.match(html, /fnv1a32-c34ef6a4/);
  assert.match(html, /href="r1-review\.html"/);
});
