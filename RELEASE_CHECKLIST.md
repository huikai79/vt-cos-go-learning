# GitHub 發布清單

## 發布方式

- [x] 已建立公開 GitHub repository：`https://github.com/huikai79/vt-cos-go-learning`；未把父層 `VT-Workflow` 當公開專案。
- [x] 已接受題庫、答案與 R1 審題工具公開；`holdout` 不再具受控盲測資格。
- [x] 題庫來源已拆成基礎技巧與基礎死活模組，原 ID、順序及內容指紋不變。
- [x] 母品牌採 `VT-COS`、產品名採「一手一懂」，公開顯示與 metadata 已對齊。
- [x] 加入 `LICENSE`：MIT，著作權標示為 `Copyright (c) 2026 huikai79`。
- [x] 首個 commit 只納入 manifest 的 56 個候選檔案，`gtp_logs/` 與個人資料均被排除。
- [x] 已從實際 GitHub repository fresh clone，確認 `edbf17d` 可通過全部 81 項 Node 測試與 file URL UI suite。
- [x] 公開證據硬化版把 48 題逐題標為公開曝光，並加入 `.nojekyll` 與 repository boundary audit；當時 manifest 增至 58 檔。
- [x] repository boundary audit 未發現 workflow、submodule、gitlink、symlink、junction 或 reparse point。
- [x] 已從 GitHub fresh clone `039cfc76c84984a92305dfca681e892b49ed3f87`，確認 58 檔、82 項 Node、boundary audit 與 file URL UI suite 全部通過。
- [x] GitHub Pages 已由 `main`／`/` 發布；`https://huikai79.github.io/vt-cos-go-learning/` 轉向 `https://huikai.com.kg/vt-cos-go-learning/`，正式網址完整 UI suite 通過。
- [x] R1a 已升為 v4 去答案審查頁，並加入可執行的正式教學／正式評量 gate；manifest 現為 69 檔。

## 候選公開檔案

`release-manifest.json` 是唯一機器可讀公開清單，目前共 69 個檔案。下列清單供人工核對：

```text
.github/workflows/verify.yml
.nojekyll
.gitignore
.gitattributes
AGENTS.md
app.js
ARCHITECTURE.md
BRAND.md
COMPLETION_MATRIX.md
content.js
CURRICULUM.md
DESIGN_PLAN.md
evidence-taxonomy.js
EXECUTION_PIPELINE.md
favicon.svg
formal-teaching-evidence.example.json
go.js
index.html
LEARNING_MODEL_REVIEW.md
LICENSE
learning-metrics.js
PHASE_1_5_JOHARI_REVIEW.md
phase2-content.js
phase2-foundation-bank.js
phase2-life-death-bank.js
phase4-content.js
PUBLICATION_ARCHITECTURE.md
R1_CONTENT_AUDIT.md
r1-review-bank.js
r1-review-verify.cjs
r1-review.html
r1-review.js
README.md
release-manifest.json
RESEARCH_LEARNING_METRICS.md
RELEASE_CHECKLIST.md
REVIEW_FINDINGS.md
REVIEW_PLAN.md
REVIEW_VERIFICATION.md
scheduler.js
scripts/build-r1-review-bank.cjs
sgf.js
styles.css
TEACHING_GATE.md
teaching-gate.json
teaching-gate-verify.cjs
trial.js
UI_UX_AUDIT.md
tests/app-state.test.cjs
tests/completion-matrix.test.cjs
tests/evidence-taxonomy.test.cjs
tests/fixtures/katrain-gpt-smoke-input.txt
tests/go.test.cjs
tests/learning-metrics.test.cjs
tests/lesson-content.test.cjs
tests/phase2-content.test.cjs
tests/r1-content-audit.test.cjs
tests/repository-boundary.ps1
tests/release-manifest.test.cjs
tests/scheduler.test.cjs
tests/sgf.test.cjs
tests/teaching-gate.test.cjs
tests/trial.test.cjs
tests/ui-smoke.ps1
tests/ui.test.cjs
ui-audit-screenshots/first-entry-desktop.png
ui-audit-screenshots/first-entry-mobile.png
ui-audit-screenshots/go-learning-desktop.png
ui-audit-screenshots/go-learning-mobile.png
```

## 必須排除

```text
gtp_logs/
個人圍棋原始事件.json
個人圍棋練習紀錄.md
局部復盤_*.sgf
R1_獨立審題草稿.json
R1_獨立審題回條.json
formal-teaching-evidence.json
```

理由：上述項目可能含本機帳號路徑、硬體資訊、個人學習事件、棋譜內容或外部審查者資料。

## 上傳前命令

在子專案資料夾執行：

```powershell
Get-ChildItem tests -Filter *.cjs | Where-Object Name -ne ui.test.cjs | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
node scripts/build-r1-review-bank.cjs
git diff --exit-code -- r1-review-bank.js
node teaching-gate-verify.cjs --report-only
node tests/ui.test.cjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/ui-smoke.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/repository-boundary.ps1
git status --short --untracked-files=all
```

## 放行停止線

- 任一 Node 或瀏覽器測試失敗：停止上傳。
- `gtp_logs/`、個人匯出或 R1 回條出現在 staged 清單：停止上傳。
- `release-manifest.json` 的公開決策、題庫用途或實際 staged 清單不一致：停止上傳。
- fresh clone 需要父目錄檔案、個人絕對路徑或被忽略資產才能啟動：停止上傳。
- workflow 權限過大、第三方 Action 未鎖定 commit，或出現 submodule、symlink、junction／reparse point：停止上傳。
- 正式 Pages URL 的完整瀏覽器流程失敗：停止宣稱網站部署可用。
- R1 審查頁載入完整題庫／答案資產、去答案資料無法重建，或回條 verifier 接受舊 protocol、重複題號及不完整聲明：停止 R1a。
- 沒有合格 R1 回條與真人 evidence，或 `teaching-gate-verify.cjs` 回傳非零：停止宣稱正式教學使用可用。
- 若把原型描述成已證明有效的正式教學系統：停止發布該宣稱。
