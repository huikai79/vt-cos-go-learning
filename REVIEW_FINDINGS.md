# GitHub 上傳前工程審核結果

審核日期：2026-09-21  
受測版本：父 repository `a2147ea01b43e4376d30e36cb3eb600175035df8` 上的未追蹤子專案，加上本輪修補。  
範圍：只審核 `Go_Learning_Prototype`，不把父知識庫視為發布內容。

## 一句話結論

程式已達可重現的個人離線原型品質；擁有者已接受 holdout 題與答案公開，GitHub 發布只剩獨立 repository 與 fresh-clone 閘門，正式教學服務仍阻擋。

## 架構與資料流

- 執行型態：純靜態 HTML／CSS／JavaScript，沒有後端、套件管理器、第三方 runtime 或正式部署設定。
- 主流程：選單元／課程 → 短講與棋盤示範 → 作答 → 即時回饋 → 重試／複習 → localStorage schema 7 → Markdown／JSON 匯出。
- 棋譜流程：本機 SGF → 有界解析 → 選擇可落子的原局手數 → 重建局面 → 保存原判斷／人工確認 → SGF／Markdown／JSON 匯出。
- 評量流程：一般課程、間隔複習、固定應用探測、個人 pilot 與 R1 外部審題分開；`formalEligible=false` 未被工程測試升格。
- 信任邊界：SGF、localStorage 及文字輸入是本機不可信資料；題庫與教學內容是隨原始碼公開的靜態資產；R1 頁面隱藏入口不構成授權控制。

## 十二類覆蓋矩陣

| 類別 | 對象與方法 | 結果 | 判定 |
|---|---|---|---|
| A 產品範圍與架構 | 全檔案、載入順序、文件對照、乾淨副本 | 純前端邊界清楚；父層無 runtime 依賴 | PASS |
| B 前端與互動狀態 | 主頁、選課、答題、重試、跨課、工具、R1 | 直接開檔及 HTTP 瀏覽器旅程通過 | PASS |
| C 後端／外部服務 | 搜尋 request／CDN／遙測／worker | 沒有後端與外部 runtime 請求；帳號、伺服器授權與 CORS 不適用 | N/A |
| D 棋規與答案判定 | `go.js`、106 題、148 題、70 題窮舉 | 氣、提子、自殺、簡單劫、指定目標與唯一成功手測試通過 | PASS |
| E 教材與學習流程 | 課程、示範、成效聲明、R1 邊界 | 工程與聲明邊界一致；獨立真人審題與難度可比性未完成 | BLOCKED |
| F 本機資料與指標 | localStorage、遷移、排程、trial、metrics | 壞 JSON／壞欄位、寫入失敗、首答與重試已測並修補 | PASS |
| G SGF／匯入匯出 | parser、局部題、三種匯出 | 多盤、分支、pass、劫、非法落子及資源上限已測 | PASS |
| H 安全、隱私與公開暴露 | DOM sinks、外連、log、截圖、保留題 | 公開題庫風險已由擁有者接受並落成不可盲測契約；Deep Scan 未啟動 | BLOCKED |
| I 使用者體驗與無障礙 | 鍵盤、焦點、320px、200%、手機 | 自動工程檢查通過；真人鍵盤／螢幕閱讀器與理解度未測 | NOT TESTED |
| J 效能、穩定性與相容性 | 最大 SGF、直接開檔、根／子路徑 | 10,001 節點與 1 MB 上限測試、三種載入方式通過；非 Chromium 未測 | PASS |
| K 測試與可維護性 | 全部測試、退出碼、語法、PowerShell smoke | 修正 smoke test 假失敗；79 項 Node 測試及三種瀏覽器載入方式通過 | PASS |
| L GitHub 發布與重現性 | Git 邊界、manifest、ignore、乾淨副本 | 公開範圍與題庫決策已固定；仍需建立獨立 repository 並從 fresh clone 驗證 | BLOCKED |

## 已確認問題

### GLR-001｜公開範圍尚未形成獨立 Git 邊界

- 分類／嚴重度／信心：L／P1／高。
- 證據：Git root 是父層 `VT-Workflow`；本子專案全部為未追蹤檔，`git log --all -- <path>` 無既有歷史。
- 影響：若在父 repository 直接操作，可能把無關知識庫或歷史一起公開。
- 處置：建立候選公開清單、乾淨副本驗證及 README 邊界；未代使用者建立 repository、commit 或 push。
- 狀態：未完全修復。上傳時必須以本資料夾建立獨立 repository 或精確 stage 清單。

### GLR-002｜公開原始碼會暴露 holdout 題與答案

- 分類／嚴重度／信心：E／H／L；P1；高。
- 證據：`phase2-content.js` 包含完整題目、棋形、答案與 goal；R1 工具直接載入同一靜態資產。
- 影響：一般匯出雖遮蔽答案，GitHub 原始碼讀者仍可取得；相關題目不能再靠 UI 隱藏保證未見。
- 處置：擁有者於 2026-09-21 接受公開；題庫來源拆成 100 題基礎技巧與 48 題基礎死活，組裝層保留原 ID、順序、答案與內容指紋。另加入 `publicationPolicy.blindAssessmentEligible=false`、機器可讀發布 manifest 與公開發布架構。
- 狀態：風險已接受並完成契約化。這批題仍可供練習、透明審查及個人流程試行，但不得再作受控盲測證據。

### GLR-003｜本機 GTP log 會洩露裝置與路徑資訊

- 分類／嚴重度／信心：H／L；P2；高。
- 證據：三個 log 含 Windows 使用者名稱、KataGo 設定路徑、GPU／CPU 型號、模型與執行環境。
- 影響：公開後形成不必要的環境指紋與個人路徑暴露。
- 修補：新增 `.gitignore` 排除 `gtp_logs/`、個人匯出與 R1 回條；log 原檔保留在本機。
- 回歸：`git check-ignore -v` 命中；54 檔乾淨 manifest 副本不含 `gtp_logs/` 且測試通過。
- 狀態：已修復。

### GLR-004｜SGF 會靜默部分匯入、pass 編號錯位且缺少資源上限

- 分類／嚴重度／信心：D／G／J；P1；高。
- 重現：多盤 collection 只取第一盤；多分支只取第一支；`B[aa];W[];B[bb]` 無法用原局第 3 手建立題目；超大輸入無上限。
- 影響：使用者以為完整棋譜已載入，局部題卻來自錯誤手數；深巢狀／大量節點可阻塞頁面。
- 修補：拒絕多盤與多分支；pass 保留原局編號；以原局編號查找著手；重播簡單劫；限制 1,000,000 bytes、10,000 節點、128 層。
- 回歸：`tests/sgf.test.cjs` 8／8 通過，包含失敗前先紅、修補後轉綠的案例。
- 狀態：已修復。

### GLR-005｜損壞狀態可中止啟動，儲存失敗仍顯示已保存

- 分類／嚴重度／信心：B／F；P1；高。
- 重現：`completed: {}` 使初始化呼叫 `.filter` 中止；localStorage `setItem` 拋錯時，SGF 反思仍顯示「已保存」。壞 JSON 也會在初始化時被空狀態覆寫。
- 影響：課程無法啟動、進度可能被靜默取代、使用者誤以為資料已落盤。
- 修補：驗證儲存欄位型別；壞資料覆寫前保存 `go-learning-prototype-recovery-v1`；寫入失敗顯示明確錯誤並取消假的 savedAt／review 狀態；R1 草稿失敗也提示立即匯出。
- 回歸：`tests/app-state.test.cjs` 19／19 通過，含損壞 JSON、異常欄位及拒絕寫入情境。
- 狀態：已修復。

### GLR-006｜PowerShell UI smoke test 產生假失敗

- 分類／嚴重度／信心：K；P2；高。
- 根因：WebSocket task 結果污染 pipeline、JavaScript 引號轉義錯誤、導覽與重新載入斷言仍依舊版 UI，集合計數語意不穩定。
- 修補：抑制 task 輸出、修正 PowerShell 引號、同步 15 單元／當前單元導覽、加入載入等待與穩定陣列計數。
- 回歸：`tests/ui-smoke.ps1` 通過。
- 狀態：已修復。

### GLR-007｜靜態託管產生 favicon 404

- 分類／嚴重度／信心：J／L；P3；高。
- 修補：新增本機 `favicon.svg` 並由兩頁引用。
- 回歸：子路徑 HTTP 記錄顯示 favicon 200，其他 runtime 資產均為 200／304。
- 狀態：已修復。

## 未解事項

- Codex Security Deep Scan 沒有執行。穩定錯誤為：指定 Codex executable 在唯讀 worker 權限驗證完成前以 code 1 結束；沒有 manifest、finding 或 token measurement。本輪依技能規則未重試或改開替代掃描。
- 沒有獨立真人 R1a 完成回條、R1b 難度可比性、真人首訪／螢幕閱讀器測試或學習成效資料。
- Firefox、Safari、Android Chrome、iOS Safari 與實際 GitHub Pages 尚未測；已測環境為 Windows 10.0.19045、Node 24.14.1、Edge 153.0.4234.48、Python 3.14.4 本機 loopback。
- 已採 MIT License；品牌名稱與程式／文件重用條款分離，未額外宣稱商標權利。

## 放行判定

| 目標 | 判定 | 條件／原因 |
|---|---|---|
| 公開原始碼 | CONDITIONAL | 題庫公開已接受；須依 manifest 建立獨立 repository，並從 fresh clone 重跑驗證。 |
| 網站部署 | CONDITIONAL | 根／子路徑工程通過；仍須在實際託管 URL 重跑 smoke test。 |
| 正式教學使用 | BLOCKED | 缺獨立內容審查、真人可用性／無障礙及學習成效證據。 |

## 邏輯檢修附注

測試全綠只支持「已測工程行為可重現」，不能支持「沒有漏洞」「題目皆正確」「教學有效」或「所有瀏覽器皆相容」。修正後結論維持條件式，避免把大量自動測試誤當成正式內容與成效驗證。
