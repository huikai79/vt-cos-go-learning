# 完成矩陣：一手一懂

更新日期：2026-09-22  
用途：將產品承諾、現有實作、自動驗證與證據邊界分開記錄。此表的「工程通過」只表示指定程式行為可運作，不表示內容正確、初學者可理解或學習有效。

## Current Status

- `as_of`: 2026-09-22
- `claim_mode`: `personal_descriptive`
- `trial_protocol`: `personal-pilot-v3`
- `r1_protocol`: `go-r1-independent-content-review-v4`
- `ui_version`: `learner-flow-v30`；棋盤練習頁 `live-game-ui-v6`
- `storage_schema`: 7
- `content_catalog_version`: 3
- `formal_evaluation_available`: false
- `formal_holdout_pool_status`: `retired_due_to_publication`
- `public_source_exposure`: 48 題公開保留組全部已公開，均不得再作 formal holdout
- `known_current_learner_direct_exposure`: 舊 R1 自我審查草稿中的 22 題；現行 pilot 八題全包含在內
- `r1a_content_review`: 待不同於學習者、且未參與編題的外部審查者
- `r1b_parallel_form_comparability`: 未建立

## 使用規則

- 每次新增或完成一項工作，都必須更新本表的實作、驗證與狀態。
- 只有同時存在實作與相稱證據時，才能標示「已通過」。
- 內容審查、真人可用性與學習成效必須保留各自的待驗狀態，不能由自動測試升格。

| 承諾 | 現況與實作 | 已有驗證 | 證據等級 | 狀態 |
|---|---|---|---|---|
| 離線個人課程 | 15 單元、19 課、106 題；直接開啟 `index.html` | 課程與 Chrome 流程測試 | 工程 | 條件通過 |
| 全課程短講與示範 | 19 課都有文字短講及至少兩步棋盤示範；每課只在首次進入時自動開啟，之後可手動重看；中高級縮圖明示為局部比較或階段示意 | `lesson-content.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；棋理適切性與是否幫助理解仍待外部審查及真人觀察 |
| 多題互動練習 | 28 題為棋盤數氣／連接／落子、10 題為局部棋形點選、68 題為文字選擇 | 規則與內容結構測試 | 工程 | 條件通過；局部點選只檢查題幹指定的觀察點，後續全局判斷深度仍待外部審查與真人觀察 |
| 基礎吃子／死活變形庫 | 原有 100 題吃子、連接與救棋，加上 48 題兩類基礎死活，共 148 題、43 個母題家族 | `phase2-content.test.cjs`、一至三手規則與真眼區域驗證 | 工程 | 條件通過；兩類死活內容仍待獨立審題，不代表完整死活課綱 |
| 失敗後的同類修正 | 已依技能首答結果產生可觀察的任務錯誤類型；不推定粗心、誤解等心理根因 | `learning-metrics.test.cjs`、`app-state.test.cjs`、`scheduler.test.cjs` | 工程 | 條件通過；分類效度仍待內容與真人資料檢驗 |
| 穩定修正距離與再犯間隔 | 已由合格、無提示機會重算；SCD 須通過約 24 小時與 7 天的非 holdout T2，正式變形庫已有 T2 流程題；介面及兩種匯出均顯示資料不足或目前下限 | `learning-metrics.test.cjs`、`app-state.test.cjs`、UI 測試 | 工程 | 條件通過；尚無真人延後結果，指標效度未驗 |
| 延後與未見題 | 一般匯出仍遮蔽公開保留組答案；48 題原 formal holdout 已因公開原始碼全部退役 | 排程、狀態、試行、公開契約與 UI 測試 | 工程 | 流程條件通過；正式未見驗收須另建從未公開的新題庫 |
| standardized T3 固定應用探測 | 5 個減少技能線索的固定局面；Evidence Taxonomy v2 以 `evaluationContext=standardized` 與 live T3 分開 | SGF、試行、UI 與 evidence-taxonomy contract 測試 | 工程 | 條件通過；只支持既定局部 scoring contract，不代表全局判斷或 live 實戰遷移 |
| SGF 實戰回流 | 可選單一主線 9 路棋譜的任意可落子著手、保存原判斷並匯出 KaTrain 交接 SGF | `sgf.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；pass 不建立落子題，且未確認錯誤原因或最佳手 |
| KaTrain／KataGo 分析 | KaTrain 1.20.0 可啟動；封裝內含 KataGo 1.18.1、38 MB 模型與 OpenCL GPU；網頁可匯出交接 SGF | 同版本設定已補齊 KaTrain `analysis` 必填欄位；9 路固定局面經 GTP 回應 `E5`，並由 `analysis` 回傳 JSON；原版桌面程式已建立 `katago.exe analysis` 子程序 | 外部工具 | 工具層通過；輸出是搜尋估計，仍需使用者對實戰局面確認教學結論 |
| 首頁下一步清楚 | 可繼續課程、錯題與工具入口；只有確實有題目到期時顯示「今日到期」及數量 | `app-state.test.cjs`、UI 測試 | 工程 | 條件通過；是否容易理解仍待真人觀察 |
| 跨課短講銜接 | 同課前往下一題；跨課或跨單元時按鈕明示短講；未看過的課自動開啟短講視窗，已看過的課直接進題並保留重看入口 | 狀態與 UI 測試 | 工程 | 條件通過；真人是否感覺自然仍待最後觀察 |
| R1a 內容審題操作 | reviewer-only 77 題母體覆蓋完整 148 題題庫的 43 家族代表與全部 48 題公開保留組；學習頁不再提供入口，審查頁只載入去答案資料，三項獨立聲明分開 | `r1-content-audit.test.cjs`、UI 測試 | 工程 | v4 答案盲審流程條件通過；外部回條仍待不同於學習者的審查者完成，且結果不恢復 formal holdout 資格 |
| R1a 棋理與構念核對 | 核心 70 題有獨立規則窮舉，完整題庫有目標型規則驗證及 77 題審查母體 | 結構驗證 | 單一外部內容審查 | 待外部審查；通過也只代表單一審查證據 |
| R1b 平行題可比性 | 基線與追蹤在已知結構特徵上配對 | 結構比對 | 真人難度資料 | 未建立；不得由 R1a 自動升格 |
| 初學者使用順手 | 有導覽、鍵盤與窄版工程檢查 | UI 測試 | 真人可用性 | 待短任務觀察 |
| 正式教學使用閘門 | R1a、三位初學者關鍵任務及真人無障礙 spot check 分開驗證 | `teaching-gate.test.cjs`、`teaching-gate-verify.cjs` | 外部內容與真人證據 | BLOCKED；缺 R1a 外部回條、初學者觀察及真人無障礙證據 |
| 個人七天流程試行 | `personal-pilot-v3` 使用舊 R1 已曝光題，只檢查資料、返回與負擔；v1／v2 保留為 legacy | trial、狀態與 UI 測試 | 個人描述 | 工程通過；`formalEligible=false` |
| 學習成效與排程增益 | 有試行資料管線與 Minimal Sufficient Policy 設計 | 試行流程測試 | 學習成效 | 未量測；個人單機正式驗收停用 |

## 目前執行順序

1. Completion Truth P0–P3：已完成工程驗證。
2. Evidence Boundary P0：個人 pilot v3、22 題直接曝光、48 題公開來源曝光、formal holdout pool 退役及一般匯出遮蔽已完成。
3. Evidence Boundary P1：R1 已從學習者介面隔離；v4 審查頁只載入去答案資料，三項獨立聲明與回條驗證分開。
4. Evidence Boundary P2：同步現況文件與回歸測試。
5. Demonstration Coverage P0–P2：19 課逐步棋盤示範、內容結構檢查與介面回歸已完成。
6. Interaction Coverage P0–P2：第 5–14 單元局部棋形點選、內容邊界與介面回歸已完成。
7. 依 `TEACHING_GATE.md` 收集外部 R1a 回條、三位初學者關鍵任務及真人無障礙證據；R1b 與新 private holdout 另屬正式評量，不以工程測試代替。

## 新增工程項目

| 項目 | 現況 | 驗證 | 證據層級 | 判定 |
|---|---|---|---|---|
| 人機實戰原始事件回流 | `practice-events.js` 繼續以獨立 append-only store 保存全部 live practice 操作；這一層仍是 unscored observation，不因新增 live T3 contract 而回溯升格 | duplicate ID、actor 分離、malformed store fail-closed 與匯出 contract 持續由 board suite 覆蓋 | 工程 | 條件通過；原始事件與可評分 live evidence 分層保存 |
| 9×9 live eligibility + scoring | 新增 `live-evidence.js`：每個 9×9 人機學習者回合在落子前掃描整盤，先決定 eligibility，再保存 assessment／first response／retry。v1 只升格「整盤唯一一手提子」與「電腦上一手新造成打吃後的唯一直接延長救棋」；多候選、5×5／7×7、SGF actor 不明、全局取捨均不評分 | `tests/live-evidence.test.cjs` 11/11 PASS；包含多機會排除、actor provenance、未答分母、首答／retry、舊 contract 隔離與同局多手不冒充跨局樣本 | 工程／自然實戰 T3 管線 | 條件通過；`formalEligible=false`，只支持這兩個 bounded local contracts，不支持全局最佳手或棋力 |
| 整合學習證據狀態 | 新增 `learner-progress.js`，將既有 T0–T2 診斷與 bounded live T3 以版本化 policy 並列成「資料不足／待更多證據／已有延後 T2／已有 live 應用」等可重算狀態；不輸出 mastery %、不直接寫 scheduler | `tests/learner-progress.test.cjs` 5/5 PASS；board/UI contract suite 26/26 PASS | 工程／Learner Model 描述層 | 條件通過；尚未取得真人效度或學習成效證據 |
| 三尺寸本機電腦對手 | 5／7／9 路 active practice 可選雙人同機或和電腦下；可執黑／白。3×3 只保留 legacy/runtime 相容。電腦只從規則引擎合法候選中，用 bounded heuristic 選手，無合理手可 Pass；不是 KataGo | `tests/live-game.test.cjs` 持續驗證 active 尺寸合法 play／pass、bot 基本行為與 UI 接線；3×3 只保留 legacy regression | 工程 | 條件通過；bot 強度與教學價值未驗，不得宣稱棋力、最佳手或學習成效 |
| 5×5／7×7／9×9 active 棋盤練習 | 共用 `live-game.html` 與尺寸切換；5／7 路作基礎／過渡練習，9 路保留完整小棋盤對局。3×3 已退出學習者 UI，但底層與歷史資料相容保留。規則、Pass、人工終局、悔棋、續局與 SGF 共用 bounded runtime | `tests/live-game.test.cjs` 目前 targeted suite 26/26 PASS，含尺寸、3×3 legacy、SGF、bot、rendering、cache-bust 與 live evidence 靜態接線 | 工程 | 5×5／7×7 仍只作 practice；9×9 只有 `live-eligibility-v1` 明列的少數局部回合可成 bounded live T3，其餘仍 unscored；不代表學習成效 |


## 2026-09-22 Change note｜9×9 完整實戰

- **改動：** 新增 `live-game.js`／`live-game.html`／`live-game-page.js`／`live-game.css`，規則契約固定為 `cn-area-simple-ko-v1`，本機續局 envelope 為 `go-live-game-v1`。
- **為何現在改：** 現有底盤已能處理 9 路合法落子與 SGF 局部回流，但缺完整棋局生命週期；本次只補這個 learning-loop experience bottleneck。
- **歷史語義：** 不改既有課程事件、KC、scheduler、Evidence Taxonomy 或 `go-learning-prototype-v7`；live audit event 固定 `evaluationRole=practice`、`evaluationContext=live`、`formalEligible=false`。
- **Migration：** 舊使用者無需遷移；實戰棋局使用獨立 localStorage key。若保存資料版本或規則版本不符，保留 recovery 副本並開新局，不猜測修復。
- **Rollback：** 移除實戰入口與四個 live-game runtime 檔即可回到既有課程；既有學習資料不受影響。
- **Validation：** 核心 10 項 Node 測試通過；Chromium 驗證 81 點棋盤、落子輪替、兩次 Pass 計分、恢復下棋與重新載入續局。GitHub Actions run #12 全部 PASS：Node contracts、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均通過。

## 2026-09-22 Change note｜多尺寸棋盤練習

- **改動：** `go.js` 改為依實際棋盤尺寸計算邊界與氣；`live-game.js`／`live-game-page.js`／`live-game.html` 支援 3、5、7、9 路。課程推薦單元 1→3×3、單元 2–3→5×5、單元 4→7×7、單元 5 起→9×9，自由練習可隨時切換。
- **為何現在改：** 既有 9×9 完整對局已成立，但規則初學、連斷與死活仍可用較小棋盤降低非目標局面負擔；這次只擴充 Experience 層，不新增成效主張。
- **歷史語義：** 不改 KC、scheduler、Evidence Taxonomy、formal holdout 或既有課程事件。四尺寸 audit event 仍為 `evaluationRole=practice`、`formalEligible=false`；3／5／7 路不視為正式 T2／T3。
- **Migration：** 9×9 繼續使用 `go-live-game-v1`；3／5／7 路新增分尺寸 storage key。課程 SGF 復盤仍只支援 9 路，因此小棋盤 SGF 不會被誤導成可回課程複盤。
- **Rollback：** 移除課程階段入口與尺寸切換，將 live 頁固定回 9×9；既有課程資料與 9×9 保存鍵不需遷移。
- **Validation：** 新增反證測試確認 3×3 邊線提子不借用 9×9 外部空間、四尺寸 SGF 保留 `SZ`、舊 9×9 預設不變；直接讀取 main 原始碼後，以隔離 V8 harness 執行 `tests/live-game.test.cjs` 為 15/15 PASS，並回歸既有 106 題中的 count/connect/move 規則檢查，無失敗。由於現有 GitHub connector 無法取得 push-triggered workflow run，本輪完整 GitHub Actions／Windows file-URL UI 狀態仍記為 `UNKNOWN`，不得寫成已全部通過。


## 2026-09-22 Change note｜四尺寸本機電腦對手

- **改動：** 新增 `practice-bot.js`；`live-game.html`／`live-game-page.js` 加入雙人同機／和電腦下切換與執黑／白選項，四種棋盤皆可用。
- **為何現在改：** 多尺寸自由練習已能完整走規則流程，但單一使用者若沒有第二人操作，Experience 層仍缺可反覆實戰的對手。
- **權威邊界：** bot 只排序 `Live.play` 已驗證合法的候選手；不取得規則 authority，不冒充 KataGo，不輸出最佳手或人的認知診斷。
- **歷史語義：** 不改 KC、scheduler、Evidence Taxonomy、formal holdout 或既有課程事件；人機對局全部 `practice_only`、`formalEligible=false`。
- **Migration：** 既有各尺寸棋局保存 envelope 保持 schema 1；新增 opponent 設定可缺省，舊資料預設雙人同機。9×9 原保存 key 不變。
- **Rollback：** 移除 `practice-bot.js` 載入與對手控制即可回到雙人同機；棋局與課程資料不需 migration。
- **Validation：** 直接讀取 main 原始碼，以隔離 V8 harness 執行 `tests/live-game.test.cjs` 18/18 PASS；其中新增測試覆蓋四尺寸只產生合法 play／pass、3×3 立即提子與 UI practice-only 契約。`live-game-page.js` 與 bot 核心語法檢查通過。由於 connector 無法取得 push-triggered workflow run，完整 GitHub Actions／Windows file-URL UI 仍為 `UNKNOWN`。


## 2026-09-22 Change note｜人機實戰事件回流

- **改動：** 新增 `practice-events.js` 與 `go-live-practice-events-v1`；live 棋盤把 human／computer／system 操作分 actor 追加保存。課程首頁顯示人機練習局數與使用者可觀察決策，完整 JSON 備份新增 `livePracticeEvents` 與 descriptor。
- **為何現在改：** 棋盤已接到學習介面且能人機對局，但先前對局只留在各棋局保存 envelope，學習平臺無法觀察實際 Response；本次只補「Response → Evidence 的可追溯原始事件」，不做 Learner Model update。
- **歷史語義：** 既有 `state.events`、KC、SCD、scheduler、Evidence Taxonomy、formal holdout 完全不改。新 live event 固定 `formalEligible=false`、`qualifiedOpportunity=false`、`scoringStatus=unscored`。
- **Migration：** 使用新的獨立 localStorage key；舊棋局與課程資料不搬移。沒有舊事件時顯示零紀錄；損壞 store 保留失敗狀態，不覆寫成空 store。
- **Rollback：** 移除 `practice-events.js` 載入、首頁摘要與 raw export 欄位即可；既有課程與棋局資料仍可運作。
- **Validation：** targeted contract 以 main 原始碼隔離 V8 harness 執行 `tests/live-game.test.cjs` 21/21 PASS，涵蓋 duplicate ID、human/computer actor 分離、malformed store fail-closed 及課程端不餵入 Metrics/scheduler。已新增 `app-state.test.cjs` 的整合反證測試，但目前環境無法以真實 Node `vm`／完整 repo 執行；push-triggered GitHub Actions 與 Windows file-URL UI 也未能從 connector 取得，故維持 `UNKNOWN`。


## 2026-09-22 Change note｜空交叉點渲染修正

- **問題：** live 棋盤的 SVG `.point-focus` 未定義預設 fill，瀏覽器依 SVG 預設值以黑色填滿，造成空交叉點視覺上像整盤黑棋。
- **改動：** `live-game.css` 新增 `.live-board .point-focus{fill:none;stroke:transparent;pointer-events:none}`；鍵盤 focus 時仍只顯示既有綠色外框。棋子本身仍只由 `.stone-black`／`.stone-white` 繪製。
- **影響：** 只修 UI rendering，不修改盤面資料、規則、SGF、事件、KC、scheduler 或 scoring。
- **Validation：** targeted contract 新增空點 focus circle 必須透明的反回歸測試；main 原始碼隔離 V8 harness `tests/live-game.test.cjs` 22/22 PASS。完整 Windows／browser CI 本輪仍維持 UNKNOWN。


## 2026-09-22 Change note｜live CSS cache-bust

- **問題：** rendering fix 已在 main，但使用者刷新後仍看到舊棋盤樣式；相同資產 URL 可能讓瀏覽器／CDN 延用舊 `live-game.css`。
- **改動：** `live-game.html` 改以 `live-game.css?v=live-game-ui-v4` 載入，強制新 UI 版本使用不同資產 URL。
- **邊界：** 只影響靜態資產快取，不修改規則、棋局、事件或學習模型。
- **Validation：** 新增 HTML contract，要求 live CSS 帶 `live-game-ui-v4` 版本參數；完整線上 Pages propagation 仍需以實際站點重新載入確認。


## 2026-09-22 Change note｜3×3 active practice 退役

- **Johari 缺口檢查：** 開放區顯示 3×3 本來就是本專案自行加入的 scaffold，且目前單一使用者實際操作後認為空間過小；盲點是此觀察不能推廣成「3×3 對所有初學者無效」；隱藏風險是 repo 已有 3×3 存檔、SGF、bot 與 event 語義；未知則是 5×5 對其他學習者的相對效益仍未驗證。
- **改動：** active learner practice 簡化為 5×5 → 7×7 → 9×9；單元 1–3 推薦 5×5，單元 4 推薦 7×7，單元 5 起推薦 9×9。自由練習與人機入口不再顯示 3×3。
- **歷史相容：** `go.js` 與 `live-game.js` 仍可讀／重建 3×3 legacy game、SGF 與事件；既有 `go-live-game-v1-size-3` 不遷移、不覆寫。舊 `?size=3` 入口改開 5×5，並提示 3×3 已退出 active practice。
- **證據邊界：** 這是目前產品的 usability/complexity 決策，不是圍棋教學的一般化結論；不改 KC、scheduler、formal evaluation 或既有事件語義。
- **Rollback：** 恢復 3×3 selector 與課程 mapping 即可；legacy runtime 從未移除，因此不需資料 migration。
- **Validation：** 新增 active/legacy 分離契約；3×3 真實邊界提子 regression 繼續保留。main 原始碼隔離 V8 harness `tests/live-game.test.cjs` 25/25 PASS。完整 repo-wide CI／Windows browser 仍需另行確認。


## 2026-09-22 Change note｜9×9 live evidence 與整合進度

- **改動：** 新增 `live-evidence.js`、`learner-progress.js`、`tests/live-evidence.test.cjs`、`tests/learner-progress.test.cjs`。9×9 人機局每個學習者回合在第一個操作前先凍結整盤 assessment；eligible 與 scoring contract 分別版本化為 `live-eligibility-v1`／`live-scoring-v1`，整合狀態 policy 為 `learner-evidence-progress-v1`。
- **Eligibility v1：** 只接受兩類可由 rules engine 客觀核對的局部任務：整盤唯一的一手提子；以及 actor 已確認為 computer 的上一手新造成打吃後，唯一直接延長且不靠提子的救棋。整盤有多個支援機會時整回合排除；5×5／7×7、SGF 匯入 actor 不明與其他全局決策維持 unscored。
- **First-response invariant：** assessment、first response、retry 分開保存；非法首答後重載會從 event store 恢復 response count，不把 retry 改寫成新的 first response。eligible assessment 沒有 response 仍保留在 denominator。
- **Historical semantics：** summary 只聚合目前 eligibility/scoring/taxonomy 版本；不相容舊事件另計 `excludedContractVersionEvents`，不以新語義靜默重算。
- **Sample independence：** 決策機會照實列分子分母，但「最近一致」狀態以不同 game session 為單位；同一盤多個連續機會不冒充三個獨立樣本。
- **Learner progress：** 課程／排程 T0–T2 與 live T3 只在 `learner-progress.js` 並列成描述性 evidence state；`schedulerAuthority=false`、`formalEvaluationAuthority=false`，不輸出 mastery 百分比。
- **Migration：** 新增獨立 `go-live-evidence-v1` store；不搬移、不覆寫既有 `state.events`、scheduler、`go-live-practice-events-v1` 或棋局存檔。
- **Rollback：** 移除兩個新 runtime 檔與首頁兩個 evidence summary 即可；既有課程、棋局與 raw practice events 不需 migration。
- **Validation：** live evidence contract 11/11 PASS；integrated progress policy 5/5 PASS；既有 board/UI targeted suite 26/26 PASS。已補 `app-state.test.cjs` 整合反證，但本環境仍無真實 Node `vm`／Windows browser；repo-wide push CI 狀態維持 UNKNOWN。
