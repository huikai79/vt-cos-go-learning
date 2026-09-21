# GitHub 上傳前工程審核計畫

審核日期：2026-09-21  
目標：`Go_Learning_Prototype` 子專案  
發布範圍：公開獨立 repository `huikai79/vt-cos-go-learning`，並由 `main` 分支根目錄發布 GitHub Pages；父知識庫不在發布範圍。

## 執行路徑

`凍結基準 -> 架構與資料流 -> 十二類掃描 -> 缺陷重現與最小修補 -> 全量回歸 -> 乾淨公開副本 -> 放行判定`

## 基準與可追溯性

本輪「公開證據硬化與 Pages」修改以前的不可變基準是獨立 repository commit `5602ed3e807959b93e79eb2ba48f48e96a9a4ca0`；當時 `HEAD` 與 `origin/main` 相同、working tree 乾淨，manifest 為 56 檔，已記錄 81 項 Node 測試與 file URL UI suite 通過。關鍵 Git blob 為 `app.js`＝`5c84bb9d70bb71cfe15b5804ae81251b38c4716f`、`phase2-content.js`＝`6eca13d7312ff0a42b050ffd3e559e9e78fe6dc7`、`release-manifest.json`＝`26dfe630f054ba2f1836be5fbc39e1dfe11b30ad`。本輪所有變更由該 commit 的 diff 回溯。

最初工程審核開始前，子專案仍是父 repository `a2147ea01b43e4376d30e36cb3eb600175035df8` 下的未追蹤目錄；當時沒有在第一次修改前凍結完整逐檔 hash 清單。這是歷史 provenance 限制，不能用修補後結果回寫成原始基準。往後每輪審核都必須在首次修改前記錄 Git 狀態、候選發布清單、關鍵 hash、既有測試、已觀察缺陷與未測項目，且不得用批次格式化、重排或 rename 淹沒缺陷 diff。

## 完成狀態

- [x] P0：確認 Git／發布邊界、現有修改、工具與測試副作用
- [x] P1：建立架構、資料流、信任邊界與公開資產盤點
- [x] P2：完成十二類工程與手動安全審核
- [x] P3：重現並修補授權範圍內已確認的 P0／P1／P2 缺陷
- [x] P4：執行針對性、整合、瀏覽器及乾淨副本驗證
- [x] P5：交付問題、驗證、發布清單與三項放行判定
- [ ] P6：啟用 GitHub Pages，於正式 HTTPS URL 重跑完整瀏覽器流程

## 分類覆蓋矩陣

狀態只使用 `PASS`、`FAIL`、`BLOCKED`、`NOT TESTED`、`N/A`；審核進行中先列為 `NOT TESTED`。

| 類別 | 檢查對象／入口 | 主要風險 | 驗證方法 | 狀態 |
|---|---|---|---|---|
| A 產品範圍與架構 | HTML、JS、文件、載入順序 | 宣稱漂移、父層依賴、死入口 | 靜態盤點、文件對照、乾淨副本 | PASS |
| B 前端與互動狀態 | `index.html`、`app.js` | 狀態錯位、競態、焦點遺失 | 程式審閱、瀏覽器旅程 | PASS |
| C 後端／外部服務 | 全專案 | 隱藏網路請求、錯誤信任邊界 | 搜尋外連與 runtime 呼叫 | N/A |
| D 棋規與答案判定 | `go.js`、題庫 | 錯誤規則、非法操作污染 | 單元測試、有界窮舉、資料掃描 | PASS |
| E 教材與學習流程 | 內容檔、課程文件 | 歧義答案、越界成效聲明 | 結構測試、內容對照、人工缺口標示 | BLOCKED |
| F 本機資料與指標 | localStorage、排程、trial、metrics | 遷移損壞、重複計數、日期錯誤 | 合成狀態、單元與瀏覽器測試 | PASS |
| G SGF 與匯入匯出 | `sgf.js`、匯入匯出 UI | 畸形輸入、資源耗盡、資料外洩 | 邊界測試、語義 round-trip | PASS |
| H 安全、隱私與公開暴露 | DOM sinks、資料檔、log、截圖 | XSS、秘密／個資、保留題曝光 | 資料流審閱、敏感資產盤點 | BLOCKED |
| I 使用者體驗與無障礙 | 主頁、棋盤、審題頁 | 鍵盤不可用、重排失敗、通知缺失 | 320px、200%、鍵盤瀏覽器流程 | NOT TESTED |
| J 效能、穩定性與相容性 | 載入、長 SGF、大量事件 | 阻塞、記憶體累積、路徑不相容 | 有界壓力、file 與 loopback 驗證 | PASS |
| K 測試品質與可維護性 | `tests/`、驗證腳本 | 假 PASS、吞例外、順序依賴 | 腳本審閱、全量執行、失敗碼核對 | PASS |
| L GitHub 發布與重現性 | Git 邊界、候選公開檔案 | 混入父庫／私人資料、授權不清 | tracked 清單、歷史範圍、乾淨副本 | BLOCKED |

## 跨分類硬閘門

1. 衝突優先順序固定為：資料與隱私完整性 → 棋規／答案正確性 → 證據資格 → 核心流程可用性 → 發布可重現性 → 效能／相容性 → UX／維護改善。上游問題使下游結論失效時，下游仍可唯讀檢查，但不得升格為 `PASS`。
2. 公開內容若足以重建題目、答案或評分規則，公開當下即視為 exposed。現有 48 題公開保留組全部退出 formal holdout pool；正式評量必須建立從未公開的新題庫與角色分離流程。
3. 工程測試不得替代獨立棋理審查、真人可用性或學習成效證據。最終判定分為公開原始碼、網站部署、正式教學使用；學習成效另列證據狀態，不作 release verdict。
4. 治理文件若衝突，先列作用域與權威來源；無法判定寫入權限時，該寫入列為 `BLOCKED`，不得自行採用較方便的版本。
5. 棋規與答案測試要標示 oracle 來源。production code、題庫答案與測試共用定義時只能稱 consistency test；目前第二套 R1 規則實作提供較強工程反證，但仍不等於外部真人內容審查。
6. fuzz、長 SGF、效能與窮舉必須有 deterministic 輸入、最大尺寸與合理時間界線。現行 SGF 上限為 1,000,000 bytes、10,000 節點、128 層；超出範圍列 `NOT TESTED`，不得無界執行。
7. GitHub public 與 open-source 授權分開判定。本專案已有 MIT License；第三方素材相容性與品牌使用邊界仍分別依來源及 `BRAND.md` 判定。
8. L 類另查 `.github/workflows`、Dependabot、Pages source、submodule／gitlink、symlink、junction／reparse point，以及任何可引用專案外檔案的建置步驟。若有 workflow，必查觸發事件、最小權限、secret 使用與第三方 Action commit pin。

## 已知限制

- Codex Security Deep Scan 未執行：掃描協調器的唯讀 worker 權限驗證前，指定 Codex 執行檔以代碼 1 結束。依該工作流規則，本輪不可重試或改開替代掃描。H 類在此外掛證據缺口解除前維持 `BLOCKED`；本輪仍進行離線手動安全資料流檢查。
- 真人圍棋內容審查、真人可用性觀察與學習成效驗證，不由工程測試替代。
