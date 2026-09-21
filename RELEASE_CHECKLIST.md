# GitHub 發布清單

## 發布方式

- [ ] 以 `Go_Learning_Prototype` 建立獨立 repository；不要把父層 `VT-Workflow` 當公開專案。
- [x] 已接受題庫、答案與 R1 審題工具公開；`holdout` 不再具受控盲測資格。
- [x] 題庫來源已拆成基礎技巧與基礎死活模組，原 ID、順序及內容指紋不變。
- [x] 母品牌採 `VT-COS`、產品名採「一手一懂」，公開顯示與 metadata 已對齊。
- [x] 加入 `LICENSE`：MIT，著作權標示為 `Copyright (c) 2026 huikai79`。
- [ ] 只 stage 下方候選檔案；先以 `git status --short --untracked-files=all` 人工核對。
- [ ] commit 後從實際 repository fresh clone，再執行全部測試。
- [ ] 若啟用 GitHub Pages，在實際 URL 重跑 `GO_UI_BASE_URL=<url> node tests/ui.test.cjs`。
- [ ] 不在本輪自動 commit、push、開 Pages 或部署。

## 候選公開檔案

`release-manifest.json` 是唯一機器可讀公開清單，目前共 56 個檔案。下列清單供人工核對：

```text
.gitignore
.gitattributes
app.js
ARCHITECTURE.md
BRAND.md
COMPLETION_MATRIX.md
content.js
CURRICULUM.md
DESIGN_PLAN.md
EXECUTION_PIPELINE.md
favicon.svg
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
sgf.js
styles.css
trial.js
UI_UX_AUDIT.md
tests/app-state.test.cjs
tests/completion-matrix.test.cjs
tests/fixtures/katrain-gpt-smoke-input.txt
tests/go.test.cjs
tests/learning-metrics.test.cjs
tests/lesson-content.test.cjs
tests/phase2-content.test.cjs
tests/r1-content-audit.test.cjs
tests/release-manifest.test.cjs
tests/scheduler.test.cjs
tests/sgf.test.cjs
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
```

理由：上述項目可能含本機帳號路徑、硬體資訊、個人學習事件、棋譜內容或外部審查者資料。

## 上傳前命令

在子專案資料夾執行：

```powershell
Get-ChildItem tests -Filter *.cjs | Where-Object Name -ne ui.test.cjs | Sort-Object Name | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
node tests/ui.test.cjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/ui-smoke.ps1
git status --short --untracked-files=all
```

## 放行停止線

- 任一 Node 或瀏覽器測試失敗：停止上傳。
- `gtp_logs/`、個人匯出或 R1 回條出現在 staged 清單：停止上傳。
- `release-manifest.json` 的公開決策、題庫用途或實際 staged 清單不一致：停止上傳。
- fresh clone 需要父目錄檔案、個人絕對路徑或被忽略資產才能啟動：停止上傳。
- 若把原型描述成已證明有效的正式教學系統：停止發布該宣稱。
