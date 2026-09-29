2026-09-29 Evidence Overview v1：上一版 v54 已把「進階設定與資料」由長文字牆改成四張 compact cards，但四張仍把 activity、可分析機會、整合 evidence 與錯誤診斷放在第一層，容易讓 backend taxonomy 繼續支配學習者閱讀。v55 改成單一「目前紀錄與證據」overview，再以一個「查看資料來源與診斷」details 保留完整分母、首答、技能診斷與限制。overview 只消費既有 validated summary，不重算 scoring、不改 learner state／KC／scheduler／formal evaluation；ERROR 明示「部分資料暫時無法讀取」，高分母或錯誤數不會被翻成 mastery。candidate 重新凍結為 `formal-teaching-candidate-2026-09-29-w`／`fnv1a32-js16-30995be7`。這是 learner-facing information hierarchy 的工程修正；正式 usability 仍 NOT_TESTED，正式教學仍 BLOCKED，學習成效仍 NOT_MEASURED。

2026-09-29 Change note｜Global Go Observatory title wrap fix

- **問題：** 寬版 Hero 主標「全球圍棋觀察」受 `max-width: 9ch` 限制，最後一字「察」可能單獨掉到第二行。
- **修正：** research page v2 在寬版移除標題寬度上限並使用 `white-space: nowrap`；Hero 左右欄比例微調為 1.7fr / 0.6fr；560px 以下恢復 `white-space: normal`，避免窄螢幕橫向溢出。
- **邊界：** 只改 `global-go-observatory.css` 與該頁 stylesheet cache-busting；不改首頁、learner runtime、KC、scoring、scheduler、formal candidate 或 research data。
- **驗證：** `tests/global-go-observatory.test.cjs` 鎖定寬版單行／手機可換行；served-content gate 檢查 v2 stylesheet marker。

2026-09-29 Delayed Comparable Fixed Order addendum：若 delayed A／B 同時達到 24 小時條件，仍固定依 A → B 呈現；B 必須等 A completed 後才能建立 presentation event。event append、store validator 與 UI 三層共同 enforce，防止使用者自選先做哪題形成 presentation-order 偏差。B 的 actualDelayMs 仍按自己的 immediate target anchor 實際計算，因此延後超過 24 小時會被如實保存。這不是 adaptive sequencing。

2026-09-29 Delayed Comparable Retrieval v1：Comparable Position v1 只有 immediate public process-check，尚不能區分「剛練完仍記得」與「隔一段時間後仍能在不同全盤局面重新辨認同一種危險」。新增兩個 project-synthetic 19×19 delayed item；每個 item 都是與既有 practice/source、immediate target 不同 surface class 的第三局面，仍沿用 rules-backed「唯一己方一氣棋串 → 落子後原棋串存活且至少兩氣」scoring，不判全盤最佳手。固定 policy `advanced-delayed-fixed-24h-v1` 以 immediate process-check 的 completed event 為 anchor，至少實際經過 24 小時才允許 presentation；不到時間不建立呈現事件，系統時鐘早於 anchor、anchor 生命週期時間倒退、due relation 不一致均 fail closed。這是固定間隔 baseline，不是自適應 scheduler，也不宣稱 24 小時是最佳間隔。Delayed event stream 保存 anchor identity、anchor/due/actual time、first response、retry、completion；一旦呈現即進公開 process-check denominator，未答不得移除。所有 delayed evidence 固定為 public T2 process-check taxonomy，`constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`；analysis 只輸出描述性 first-response／actual-delay 摘要，`retentionConclusion=null`、`transferConclusion=null`。Advanced Evidence Bundle 升為 v2，新增 delayed stream 與 delayed analysis；舊 event stores 不 migration、不覆寫。private unseen formal evaluation 仍是獨立 gate。rollback 可移除 delayed runtime/policy/stream/items，既有 Comparable v1、Replay、Decision Review 不受影響。

2026-09-29 Backup Scope Clarity v1：Advanced Evidence Bundle v1 上線後，Core 工具仍把自己的 JSON 稱為「備份完整資料」，會讓使用者誤以為一次匯出涵蓋整個產品。現在 Core 入口改為「備份核心與實戰資料」，說明其範圍為 Core、固定應用探測、局部復盤與實戰；獨立 Advanced 事件由進階頁另行匯出。這是 evidence durability／資訊邊界修正，不把兩套 store 強行耦合，也不新增 restore/import。因 `index.html` 屬 formal candidate critical learner surface，candidate 重新凍結為 `formal-teaching-candidate-2026-09-29-v`／`fnv1a32-js16-45fb67e5`，並同步 teaching gate、example evidence 與 served Pages verifier。重新凍結只代表資產身分；R1a、正式 usability、accessibility 仍依 final-phase policy 保持 BLOCKED／NOT_TESTED，沒有新增真人證據。

2026-09-29 Advanced Evidence Bundle Export v1：Advanced 已累積 choice、multi-step sequence、19×19 Decision Review、KataGo comparison、Decision Replay、Comparable Position 等多條 localStorage 事件流，但 Core 的完整 JSON 備份不涵蓋這些 stream；瀏覽器資料被清除時會失去可回溯 Evidence。新增單向 `advanced-evidence-bundle-v1` 匯出：choice、sequence v1/v2/v3、decision review、comparison、replay、comparable events 分 stream 保留原 schema/event version，legacy sequence 不 migration；Comparable 另附 `advanced-comparable-analysis-v1` 描述性 summary。每條 stream 透過官方 reader 讀取，且有 validator 的 stream 匯出前再逐 event 驗 authority；malformed/unreadable/polluted store 不輸出 raw 壞資料，而標 stream error，其他健康資料仍可匯出，bundle `complete=false`。此功能只作本機備份與分析，不提供 restore/import，不改 learner state、KC、scheduler、formal evaluation、first-response 語義或歷史事件；formal teaching candidate 不重凍結，因 Advanced 不在目前 Core critical asset set。rollback 可移除 exporter/UI/tests，不修改任何既有 event store。


2026-09-29 Comparable Position Analysis v1：Comparable Position v1 已能產生 practice／process-check 事件，但原本只有 event count，尚不能安全重算 pair 層的 first-response 狀態。新增 `advanced-comparable-analysis-v1`：每個 item 固定以第一次 presentation 為分析單位，首答與 retry 分離；同 item 之後重新開始不能用較好的後一次首答覆蓋第一次。target 一旦呈現即進 process-check denominator，未答明示為 `TARGET_UNANSWERED`；尚未呈現則不進分母。analysis 重新驗 event authority 與固定 presentation order，跳過前置 item、completion_without_first、retry_without_first、multiple_first 等 lifecycle 異常全部 fail closed。pair transition 只輸出 `source_correct_target_correct` 等描述性組合，不產生 mastery、transfer success、KC update、scheduler eligibility、formal evaluation 或 construct validation。既有 Comparable Position 的 public T2 標籤仍只表示「different surface + same provisional KC hypothesis」的 process-check taxonomy；Analysis PASS 不把 provisional KC 變成已驗構念。rollback 可單獨移除 analysis module／tests，不修改既有事件流或歷史資料。

2026-09-29 Comparable Position v1：Decision Replay 已解決同一已曝光局面的 T0 重做，但 Advanced 仍缺「不同全盤表面、同一 provisional KC hypothesis」的公開 process-check。新增兩組 project-synthetic 19×19 pair，共 4 個 item；固定順序為 practice A → practice B → process-check A → process-check B，避免 source/target 相鄰造成短期 cue。v1 只處理 rules engine 可完全判定的 bounded target：盤上恰有一串己方棋只剩一氣，成功條件是落子後該原棋串仍存在且至少有兩氣；不判全盤最佳手、厚薄、攻擊收益或形勢。pair source/target 必須 position fingerprint 不同、group size/topology/edge/color/board-region 等至少多軸改變，且不得同 surface class。所有 item 為本站原創合成、公開資產，item 禁止內嵌 answer/correctMove；rules engine 枚舉全盤驗證成功點唯一。兩個 target 固定是 public process-check：呈現資格在 response 前決定，首答與 retry 分開保存；事件綁 provisional KC hypothesis `urgent-atari-rescue-kc-v1`，但 `constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`、`qualifiedOpportunity=false`。target 的 evidence taxonomy 標 T2 只表示「不同表面、同一 KC hypothesis」的公開 process-check 類型，不等於 formal transfer 已成立；private unseen formal evaluation 仍須另一個從未公開的 pool。rollback 可單獨移除 Comparable runtime/stream/items，不修改既有 Decision Review／Replay／Comparison 歷史事件。

2026-09-29 Decision Replay v1：Decision Review 已能形成「全盤局面 → first candidate → 原著揭露 → reflection／bounded comparison」的 Response/Evidence，但沒有一個不依賴原 SGF 檔案的 Next Experience。新增獨立 replay stream 與本機 queue：只有已存在 `original_revealed` event 的局面才能加入，snapshot 保存 source review/version/fingerprint、棋盤 stones、ko previous stones、player、move number 與 historical original move。重做時原著再次先隱藏，first response／retry 分開保存，揭露後只做 historical comparison。所有 replay event 固定 `sourceExposure=previously_exposed`、`transferLevel=T0`、`formalEligible=false`、`qualifiedOpportunity=false`、`skillId=null`；不得當 unseen retention、T1/T2/T3、KC、scheduler 或 formal evaluation。later comparable position 明確保留為另一份尚未建立的 contract，不由 replay 自動升格。舊 review/comparison event stream 不修改、不 migration；rollback 可單獨移除 replay UI／stream。

2026-09-29 Change note｜Math Explore learner-language sweep

- **問題：** `math.html` 雖屬一般讀者 Explore 頁，仍散落 `spatial training`、`far transfer`、`transfer effect`、`Go-only` 等研究英文與翻譯腔；不符合 learner-facing 中文語境。
- **修正：** 一般讀者敘述改為自然繁體中文；文獻作者姓名與 `PSPACE-hard` 等必要專名保留。研究方法改寫為「統合分析」「具對照組的前後測研究」「近距離／遠距轉移」等中文表達。
- **不可破壞：** 沒有改來源、數字、研究邊界、頁面路由、learner runtime、KC、scoring、scheduler 或 formal evaluation。研究紀錄仍保留原始英文術語供稽核。
- **驗證：** `math.test.cjs` 新增英文研究術語回歸掃描；`math.html` 納入 `learner-language-boundary.test.cjs`。
- **未驗證：** 機器與 AI 文案審查不能證明目標讀者實際理解；正式教學與學習成效狀態不變。

2026-09-29 Change note｜Go × Mathematics Explore v1

- **Johari correction：** 上一輪把 HKBU 2024 七人 narrative multiple case study 的「feeble to moderate」連結描述得太接近已量測 transfer；現已降格為雙領域熟手的感知策略連結／預期轉移線索，不作 learner outcome effect。
- **實作：** 新增獨立 `math.html` 與 `research/go-math-explore-v1.md`；首頁只在既有低優先 Explore 區增加入口。頁面區分 formal mathematical relation、Go cognition 與 educational transfer，不載入 learner runtime。
- **不可破壞：** 不改 Core 題目／KC／scoring／first response／retry／scheduler／T2-T3／formal evaluation；不宣稱本站提升一般數學能力。
- **candidate：** 因 `index.html` 屬 critical learner surface，重新凍結為 `formal-teaching-candidate-2026-09-29-s`／`fnv1a32-js16-14856586`。
- **狀態：** 正式教學仍 `BLOCKED`、正式評量仍 `BLOCKED`、學習成效仍 `NOT_MEASURED`。Explore engineering PASS 不升格成數學學習成效。

2026-09-29 KaTrain Smoke Autodiscovery v1：Real KataGo receipt gate 已 ready，但 Windows 使用者仍需人工提供 executable/config/model 三條路徑。KaTrain 1.20.0 官方設定以 `~/.katrain/config.json` 保存 engine 設定，bundled Windows engine 使用 `katrain/KataGo/katago.exe`、分析設定預設 `katrain/KataGo/analysis_config.cfg`、模型使用 `katrain/models/...` package resource。新增 `tests/katrain-katago-smoke.ps1`：優先讀 user config；自訂 absolute path 直接採用；bundled resource 只在明確 `-KaTrainRoot`、正在執行的 KaTrain 目錄或有限常見安裝根下尋找 exact suffix。找不到、相對 custom path 無法安全解析、或同一 root 出現多個 bundled KataGo 都 fail closed。wrapper 最終只呼叫既有 `katago-bridge-smoke.ps1`，不建立第二套 receipt/scoring/engine contract。Windows CI 用 synthetic KaTrain layout 的 `-ResolveOnly` 測試成功解析與 ambiguity rejection；這仍不是 real-engine evidence，狀態維持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。

2026-09-29 Change note｜Real KataGo Smoke Receipt v1

- **bottleneck：** `/v1/compare` 的 contract、adapter、browser flow 與 fail-closed 行為已由 CI 驗證，但 CI 沒有實際 KataGo executable/config/model，因此仍缺「真引擎照目前 contract 回兩個候選」的可重算證據。
- **實作：** Windows smoke 現要求 clean checkout，真跑 `/v1/move` 與 `/v1/compare`；全部通過後才寫 `.local-evidence/katago-smoke-receipt.json`。
- **receipt identity：** 綁 repo HEAD、contract file hashes、KataGo version、executable/config/model hashes、model filename、runtime 與兩端點結果；不保存絕對 engine path。
- **verifier：** receipt commit 或任一 contract file 不等於目前 repo 即 stale；unknown engine、model mismatch、comparison identity mismatch、`correct/mastery/transferLevel` 污染全部 fail closed。
- **public/private boundary：** receipt contract／verifier／tests 可公開；實際本機 receipt 排除於 Git 與 release。
- **目前狀態：** `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。CI PASS 只能證明驗證流程可執行，不能證明真 KataGo 已通過。
- **升格條件：** 在 clean Windows checkout 實際執行 smoke，並由 `scripts/verify-katago-smoke-receipt.cjs` 對同一 HEAD 回 PASS。
- **rollback：** 移除 receipt module/verifier 與 smoke 的 receipt 段，原本 `/v1/move`、`/v1/compare` runtime 不受影響。

2026-09-29 Change note｜KataGo real-engine receipt v1

- **bottleneck：** Decision Point Comparison v1 的 contract／adapter／browser flow 已通過 CI，但 CI 沒有實際 KataGo executable、config 與 model；因此仍缺一份能證明「這組公開 contract 曾由真引擎完整跑通」的可重算本機證據。
- **實作：** `tests/katago-bridge-smoke.ps1` 成功跑完 `/v1/move` 與 `/v1/compare` 後，才產生 `.local-evidence/katago-smoke-receipt.json`。receipt 保存 repository commit、五個關鍵 contract file SHA-256、KataGo executable/config/model SHA-256、engine version、Windows/PowerShell/Node runtime、move result、完整 bounded comparison request/result。
- **驗證：** `katago-smoke-receipt.cjs` 與 `scripts/verify-katago-smoke-receipt.cjs` 檢查 receipt schema、engine/model identity、request/result identity、兩候選 bounded authority 與 current contract hashes；stale contract、unknown engine version、model mismatch、以及 result 內出現 correct/mastery/transfer inference 都 fail closed。
- **privacy／publication：** `.local-evidence/` 永不列入 public release；只公開 receipt contract、verifier 與 tests。receipt 只保存檔名與 SHA-256，不保存 executable/config/model 路徑或檔案內容。
- **目前狀態：** `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。本輪執行環境沒有使用者 Windows KataGo executable/model，因此不得標真機 PASS。
- **下一個 gate：** 只有 local receipt 通過 verifier 後，才解除 real-engine smoke blocker；之後若要進 Comparison → Explanation，仍需另立 explanation authority／教學效度 contract，不由 engine receipt 自動升格。

2026-09-29 Change note｜SGF Decision Review v1

- **formal candidate refreeze：** `formal-teaching-candidate-2026-09-29-p`／`fnv1a32-js16-16855e4f`；只因共享 `sgf.js` critical asset bytes 改變，不代表真人證據增加。
- **learning-loop bottleneck：** Advanced 已有局部多手 reading 與 19×19 自由 practice，但缺「全盤局面 → learner candidate → 可回看 artifact → 後續外部比較」的 Response/Evidence 橋接。
- **實作：** 19×19 單一主線 SGF 可選任意可落子手數；原著揭露前保存 first candidate 與 retry，揭露後只比較 historical move；可保存 post-reveal reflection。
- **不可破壞：** Core 9×9 SGF API／語義保留；原著不同不等於錯手；不產生 mastery／transfer／T3／formal evaluation；KataGo 無 scoring authority。
- **negative tests／browser regression：** 候選事件若提前帶 original move／comparison 必須 fail；comparison event 不得產生 correct／mastery；malformed store fail closed；Windows browser suite 實際匯入 19×19 SGF、提出不同候選、揭露原著，確認不同原著不產生 `correct=false`。
- **rollback：** 移除新的 advanced decision-review UI／event stream，回復 SGF 共用 parser 擴充；既有事件 key 不需 migration。

# 完成矩陣：悟之一手

更新日期：2026-09-29  
用途：將產品承諾、現有實作、自動驗證與證據邊界分開記錄。此表的「工程通過」只表示指定程式行為可運作，不表示內容正確、初學者可理解或學習有效。

## Current Status

- `as_of`: 2026-09-29
- `claim_mode`: `personal_descriptive`
- `trial_protocol`: `personal-pilot-v3`
- `r1_protocol`: `go-r1-independent-content-review-v5`
- `ui_version`: `learner-flow-v55`；棋盤練習頁 `live-game-ui-v11`
- `storage_schema`: 7
- `content_catalog_version`: 4
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
| Core 後續進階訓練 v7 | 獨立 `advanced.html`；不是第 16 單元。保留 8 個 choice-based practice Experience；棋盤 Response 由 4 個 seed 擴成 8 題、4 個 family，每族兩題：倒撲第二題改為回提三子；枷第二題改出口幾何且仍驗雙逃路；對殺第二題交換 learner 棋色；征子第二題改 8×8、更長路線並最終提十一子。每題帶 `familyId`／`variantId`／`variationAxes` 並由 rules-backed sequence contract 重播 | `advanced.test.cjs`、`advanced-sequence-contract.js`、Go rules oracle、browser UI、發布邊界、完整 CI | 工程／教學 UX | 條件通過僅限小型 practice family seed；不更新 KC／scheduler／T2-T3／formal evaluation。第二題不是單純旋轉複製，但尚未證明 family 內難度可比、真人 transfer 或構念邊界 |
| 全課程短講與示範 | 19 課都有文字短講及至少兩步棋盤示範；一般進課只在首次進入時自動開啟，之後可手動重看；但正式完成前一單元並跨入下一單元時，即使曾預覽下一單元，仍會再次開啟該單元短講；中高級縮圖明示為局部比較或階段示意 | `lesson-content.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；棋理適切性與是否幫助理解仍待外部審查及真人觀察 |
| 多題互動練習 | 28 題為棋盤數氣／連接／落子、10 題為局部棋形點選、68 題為文字選擇 | 規則與內容結構測試 | 工程 | 條件通過；局部點選只檢查題幹指定的觀察點，後續全局判斷深度仍待外部審查與真人觀察 |
| 世界死活名型館 v21 / Ontology v5 小曲尺 candidate | playable practice 不變；本輪只修正 research ontology：新增 `small-curved-ruler-candidate-v1`，把中文「小曲尺」先視為自身 candidate concept，而不是強迫等同 `L Group` 或 `Carpenter's Square`。Carpenter's Square 另補中文 `曲尺` 既有術語鏈；`小曲尺` ambiguity 改為三候選（中文 candidate / Carpenter / L Group）。新增中文曲尺型系列與「小曲尺長大」教學 taxonomy 訊號，但所有新增 geometry evidence 仍是 text-only/no coordinates | ontology negative tests、geometry evidence no-coordinate tests、catalog/UI version；完整 CI 以 PR workflow 為準 | 工程／research governance | 工程 PASS 只支持「名稱歧義不應被二選一壓平」；小曲尺 canonical geometry、與 L/Carpenter 的 exact relation、playable scoring、內容效度與 learning effect 仍 UNKNOWN/BLOCKED |
| 基礎吃子／死活變形庫 | 原有 100 題吃子、連接與救棋，加上 48 題兩類基礎死活，共 148 題、43 個母題家族 | `phase2-content.test.cjs`、一至三手規則與真眼區域驗證 | 工程 | 條件通過；兩類死活內容仍待獨立審題，不代表完整死活課綱 |
| 失敗後的同類修正 | 已依技能首答結果產生可觀察的任務錯誤類型；不推定粗心、誤解等心理根因 | `learning-metrics.test.cjs`、`app-state.test.cjs`、`scheduler.test.cjs` | 工程 | 條件通過；分類效度仍待內容與真人資料檢驗 |
| 穩定修正距離與再犯間隔 | 已由合格、無提示機會重算；SCD 須通過約 24 小時與 7 天的非 holdout T2，正式變形庫已有 T2 流程題；介面及兩種匯出均顯示資料不足或目前下限 | `learning-metrics.test.cjs`、`app-state.test.cjs`、UI 測試 | 工程 | 條件通過；尚無真人延後結果，指標效度未驗 |
| 延後與未見題 | 一般匯出仍遮蔽公開保留組答案；48 題原 formal holdout 已因公開原始碼全部退役 | 排程、狀態、試行、公開契約與 UI 測試 | 工程 | 流程條件通過；正式未見驗收須另建從未公開的新題庫 |
| standardized T3 固定應用探測 | 5 個減少技能線索的固定局面；Evidence Taxonomy v2 以 `evaluationContext=standardized` 與 live T3 分開 | SGF、試行、UI 與 evidence-taxonomy contract 測試 | 工程 | 條件通過；只支持既定局部 scoring contract，不代表全局判斷或 live 實戰遷移 |
| SGF 實戰回流／決策點複盤／兩手比較 | Core 保留單一主線 9 路 historical recall；Advanced 的 19×19 SGF Decision Review v1 保存 first candidate／retry／原著揭露，Decision Point Comparison v1 只在原著已揭露、第一候選合法且兩手不同時，允許選用 KataGo 以固定 rules／komi／visits 比較第一候選與原著 | `sgf.test.cjs`、`advanced-decision-review.test.cjs`、`decision-comparison.test.cjs`、KataGo bridge fail-closed、Windows browser UI、發布邊界與 CI | 工程／practice reference | 條件通過只表示 bounded comparison workflow 可追溯；engine 排序不是標準答案，不產生 correct／mastery／transfer，不更新 KC／scheduler／T2-T3／formal evaluation |
| KaTrain／KataGo 分析 | KaTrain 1.20.0 可啟動；封裝內含 KataGo 1.18.1、38 MB 模型與 OpenCL GPU；網頁可匯出交接 SGF | 同版本設定已補齊 KaTrain `analysis` 必填欄位；9 路固定局面經 GTP 回應 `E5`，並由 `analysis` 回傳 JSON；原版桌面程式已建立 `katago.exe analysis` 子程序 | 外部工具 | 工具層通過；輸出是搜尋估計，仍需使用者對實戰局面確認教學結論 |
| 首頁下一步清楚 | 根網址固定作為悟之一手學習樞紐：Hero 仍以零基礎 Core 為主要 CTA，首屏後由「基礎建立／局部與棋局判斷／全局與綜合應用」三階段直接承擔核心課程入口；基礎進 Core、局部直達 Core 第 6 單元、全局直達 Core 第 11 單元。Advanced 維持獨立路線，不屬於單元 1–15，也不再冒充三階段中的局部入口。Core workspace 使用 `#core`，重新載入可留在課程，回到根網址則回首頁。回訪者首頁顯示「繼續核心課程」與上次課名，不再自動略過首頁；只有確實有題目到期時 Core workspace 才顯示「今日到期」及數量 | `app-state.test.cjs`、UI 測試；375px 單欄、root-vs-#core route、回訪 CTA、Core 第 6／11 單元直達與無橫向溢出反證 | 工程 | `learner-flow-v55` 條件通過；三張階段卡只代表 Core 1–15，Advanced 另列為獨立進階訓練。首頁是否讓不同程度使用者更快選對入口仍待真人觀察 |
| 跨課短講銜接 | 同課前往下一題；跨課或跨單元時按鈕明示短講；同單元跨課仍以是否看過決定自動開啟，正式跨單元則一律再次開啟下一單元短講，避免先前預覽跳過教學銜接 | 狀態與 UI 測試；`tests/ui.test.cjs` 逐一覆蓋全部 14 個跨單元邊界，另覆蓋「已預覽第 8 單元後正式完成第 7 單元」反證案例 | 工程 | 條件通過；14/14 跨單元 browser regression 與已預覽下一單元案例已通過，真人是否感覺自然仍待最後觀察 |
| R1a 內容審題操作 | reviewer-only 77 題母體覆蓋完整 148 題題庫的 43 家族代表與全部 48 題公開保留組；學習頁不再提供入口，審查頁只載入去答案資料，三項獨立聲明分開 | `r1-content-audit.test.cjs`、UI 測試 | 工程 | v5 答案盲審流程條件通過；fingerprint 同時綁定 reviewer-visible `prompt`／`focus` 與 family／skill／scoring identity；外部回條仍待不同於學習者的審查者完成，且結果不恢復 formal holdout 資格 |
| R1a 棋理與構念核對 | 核心 70 題有獨立規則窮舉，完整題庫有目標型規則驗證及 77 題審查母體 | 結構驗證 | 單一外部內容審查 | 待外部審查；通過也只代表單一審查證據 |
| R1b 平行題可比性 | 基線與追蹤在已知結構特徵上配對 | 結構比對 | 真人難度資料 | 未建立；不得由 R1a 自動升格 |
| 初學者使用順手 | 有導覽、鍵盤與窄版工程檢查；一般練習的正確／錯誤回饋以圖示、明確標題與不同背景 banner 區分，錯答仍留在原題重試，formal evaluation 仍不揭露正誤；開發期間可持續 formative observation | UI 測試＋開發期觀察僅作診斷 | 真人可用性 | 工程條件通過；正式 usability 仍 NOT_TESTED，待 candidate 凍結後三位 target novice 關鍵任務 |
| 正式教學使用閘門 | R1a、三位初學者關鍵任務及真人無障礙 spot check 分開驗證 | `teaching-gate.test.cjs`、`teaching-gate-verify.cjs` | 外部內容與真人證據 | BLOCKED；缺 R1a 外部回條、初學者觀察及真人無障礙證據 |
| 個人七天流程試行 | `personal-pilot-v3` 使用舊 R1 已曝光題，只檢查資料、返回與負擔；v1／v2 保留為 legacy | trial、狀態與 UI 測試 | 個人描述 | 工程通過；`formalEligible=false` |
| 學習成效與排程增益 | 有試行資料管線與 Minimal Sufficient Policy 設計 | 試行流程測試 | 學習成效 | 未量測；個人單機正式驗收停用 |

## 2026-09-26 Change note｜永久首頁學習樞紐與 Core／Advanced 分流

- **Johari 缺口：** 上兩輪的開放區是 reader-first 一頁式首頁與主 CTA 已成立；盲點是「回訪者自動略過首頁」只適合單課程產品，和目前已有獨立 `advanced.html` 的多路徑架構衝突。隱藏區是進階頁已經在 main 可用，但首頁仍沒有入口，只藏在 Core 工具面板。未知區是不同程度真人是否能更快選對入口，仍需 usability 觀察。
- **最新判斷：** `/` 長期作為整個悟之一手的學習樞紐，不再只作首次 onboarding。Core 仍是零基礎的單一主 CTA；進階訓練在 Hero 後的「選擇學習入口」出現為第二層選項，不和第一課搶主視覺。Core workspace 以 `#core` 表示，重新載入／書籤可直接回工作區；回根網址則回首頁。
- **實作：** `learner-flow-v44` 新增 Core／Advanced 兩張入口卡；Core 顯示 15 單元／19 課／106 題與動態「上次停在」；Advanced 直接連 `advanced.html`，明示較適合已有基礎者、不是第 16 單元、目前 practice-only。進階頁同時提供「悟之一手首頁」與「核心課程」兩個一致導航。
- **不可破壞 invariant：** 不改題目、KC、scoring、first response／retry、scheduler、storage schema、formal evaluation、live evidence 或 advanced event contract；Core／Advanced 原始資料仍分開保存。
- **反證／驗收：** fresh root 必須顯示首頁；Core CTA 後 URL 為 `#core` 且才開第一課短講；已有 Core 進度後重新進 root 仍顯示首頁並改為「繼續核心課程」＋上次課名；375px 仍單欄且無橫向溢出；Advanced 必須可由首頁直接到達。這些只證明路由／資訊架構契約，不證明使用者已選對課程或學得更好。
- **證據邊界：** 正式教學仍 `BLOCKED`；正式評量不可用；Core 完課對 K／段位與 Advanced 學習效益仍 `NOT_MEASURED`。

## 2026-09-26 Change note｜一頁式 reader-first 首頁

- **問題：** v41 已把設置用意、路徑、評量與來源帶到首訪，但首頁仍嵌在學習 workspace 的 sidebar／topbar 框架裡；實際手機截圖顯示讀者先看到產品導覽與工具架構，而不是單一路徑的「我會學什麼／怎麼開始」。Hero 的 15／19／106 也比較像產品產量，而不是首次決策所需資訊。
- **改動：** `learner-flow-v42` 將首訪／主動重開的介紹狀態改成獨立一頁式 Landing Page：隱藏 sidebar、學習 topbar、題目工作區與原 skip-link；加入只含品牌＋主 CTA 的 landing header。Hero 改為「從 0 開始，先學氣與提子，再走進 9 路棋局」，只保留 5→7→9 路與免帳號／本機進度兩個直接使用資訊；15 單元／19 課／106 題後移到課程路徑下方。評量主閱讀流收斂為首答、延後、未見新棋形三項；研究來源、formal teaching／evaluation／learning outcome 狀態改為預設收合的透明度區塊。
- **不變 invariant：** 不改 item／KC／scoring、first response／retry、scheduler、storage schema、holdout 曝光、formal evaluation、live eligibility／scoring、evidence taxonomy 或第一課短講；只是重新切分 Landing 與 Learning Workspace 的資訊架構。
- **反證／驗收：** 首訪時 sidebar 與 topbar 必須 `display:none`；375px 必須單欄、無橫向溢出，課程路徑為一欄；研究來源預設收合；按主 CTA 後才進第一課短講。回訪者重開首頁不得修改學習事件或進度。自動測試只證明介面契約，不能證明真人理解或轉換率。
- **證據邊界：** 正式教學仍 `BLOCKED`；正式評量不可用；學習成效與完成課程對 K／段位換算仍 `NOT_MEASURED`。

## 2026-09-26 Change note｜首次到訪首頁與課程層級去歧義

- **問題：** v40 直接把首次到訪者放進第一課；雖然課內已有五步流程，使用者仍無法先知道網站設置用意、如何從零前進、評量依據、內容來源與「高級」是否等同高棋力。上一輪長篇首頁草稿反向產生另一個風險：把研究方法與證據聲明全部放在最前面，會讓新手先讀系統自證，而不是先知道下一步。
- **跨語言參考：** 日本棋院與 British Go Association 強調短規則後盡快進小棋盤；OGS 將入門拆成可直接操作的逐步路徑；Go Magic 以「適合誰／課程層次／立即開始」建立首頁方向；Brilliant 的現行教學敘事把 learn-by-doing、feedback、spacing／retrieval 與「不是正式診斷」放在同一證據邊界內。這些只作資訊架構或教學順序參考，不作本專案成效證據。
- **改動：** `learner-flow-v41` 新增首次到訪 orientation：hero 先回答「這是什麼／現在能做什麼」，再以能力路徑、日常評量、認知與學習科學、完成後能力範圍、來源與 current-truth 狀態逐層展開。側欄把 learner-facing「初／中／高級」改為「基礎建立／局部與棋局判斷／全局與綜合應用」，仍保留原課綱名稱，並明示不等同 K／段位。回訪者不強制重看，頂端可手動重開。
- **不可破壞 invariant：** 不改 item／KC／scoring、首答／retry、scheduler、storage schema、holdout 曝光、formal evaluation、live eligibility／scoring 或 evidence taxonomy；第一課短講仍是開始學習前的教學入口。
- **反證與驗證：** 首次載入時 orientation 可見且第一課 modal 不得同時彈出；按「開始第一課」後才進短講；375px 不得產生橫向溢出；回訪／手動重開不改學習資料。自動測試只能證明上述工程契約，不能證明首頁敘事真的被初學者理解。
- **證據邊界：** 正式教學仍依 `TEACHING_GATE.md` 維持 `BLOCKED`；formal evaluation 仍不可用，學習成效仍 `NOT_MEASURED`。首頁不得把日本棋院的級位課程對照直接換算成本站完成後棋力。

## 2026-09-26 Change note｜題目卡資訊層級

- **問題：** 同一題卡原本依序顯示題型、題目標題、真正問題與作答說明，但「題目標題」字級最大，使用者實際回饋指出不易一眼判斷哪一句才需要回答。
- **改動：** `learner-flow-v38` 將題卡角色明示為「本題重點 → 問題 → 作答方式」；真正問題改為最大字級與最高字重，換題／回到題目時鍵盤焦點移到真正問題。題目標題降為輔助性的本題重點。
- **不可破壞 invariant：** 不改 item/scoring、答案、首答／retry、提示資格、scheduler、formal evaluation 遮蔽或事件欄位；只改 learner-facing information hierarchy。
- **反證／驗收：** UI 測試要求題卡 `aria-labelledby` 指向真正問題、焦點落在真正問題，且桌面樣式保持「重點 16px／問題 24px／作答方式 16px」的層級；320px 重排與既有作答生命週期回歸仍需全套 CI 通過。
- **證據邊界：** 這只證明介面契約改正；是否真的降低初學者困惑仍需真人觀察。

## 2026-09-26 Change note｜作答頁內容權重收斂

- **問題：** `learner-flow-v38` 雖已讓真正問題取得最高文字權重，但實際頁面仍同時出現「觀察題／本題重點／問題／作答方式」四層 metadata；文字選擇題的 question／answer cards 亦保留過高 min-height，造成「問題 → 選項」距離過大。「記住這句」又在首答前顯示，會與當下作答競爭注意力，部分題型還可能形成額外線索。
- **改動：** `learner-flow-v39` 將題型與題目 context 合併為單行「題型 · 重點」，只保留「問題」一個明確標籤；作答說明移到選項下方。text-only choice 題取消固定最小高度，讓問題與選項緊接。程式性聚焦不再顯示橙色框，只在 `:focus-visible` 時顯示鍵盤焦點。`記住這句` 首答前隱藏，一般 practice／scheduled／application／SGF 在第一次有效回答後才揭露；evaluation 模式整批完成前仍不顯示正誤或記憶 cue。
- **位置資訊：** 一般課程右上由全域「題目 N / 106」改為「本課第 N / M 題」；左側「課程完成 X / 106」保留為完成量，避免兩種不同語義共用同一分母。單元 kicker 簡化為「第 N 單元 · 等級」。
- **不可破壞 invariant：** 不改題目答案、scoring、first response／retry、提示資格、scheduler、formal evaluation 遮蔽、KC、event schema 或 storage schema。
- **反證／驗收：** UI contract 檢查首答前 takeaway 隱藏、作答後揭露、evaluation 不揭露；真正問題仍為 24px 高權重、程式 focus 無 outline 而 keyboard focus-visible 保留；320px 與 200% text reflow、Windows file-URL UI、Edge smoke 與 evidence lifecycle 回歸必須通過。
- **證據邊界：** 這是依 formative observation 收斂注意力競爭的工程假說，不等於真人 usability 已通過。

## 2026-09-26 Change note｜關鍵術語與示意圖自足性

- **問題：** formative 使用與逐課稽核發現，前六課大致能由文字＋圖直接理解，但第 7 課「劫」只文字提到未完整畫出；第 8 課缺真假眼對照；第 13 課要求讀最強應手但圖未走完短變化；第 14 課講官子差額卻未做雙結果比較；第 16 課棄子只畫結果未比較救／棄成本；第 19 課曾以紅叉表示原著位置，和「禁著」語義衝突。中高級另有目、先手、外勢、候選手、原著手等術語需靠上下文猜；live-game 頁的 Pass、死子、中國式面積、貼目、簡單劫與 SGF 也缺白話入口。
- **外部參考後的改動：** `learner-flow-v40`／content catalog 4 為 19 課各加可折疊「本課關鍵詞」；所有逐步圖新增固定 legend。金色小圈只代表觀察／候選空點，金色大圈強調目前棋子，紅叉只代表不能下，藍色虛線框只代表比較／前一步位置。第 7、8、13、14、16、19 課擴充為真正的前後對照或短序列；live-game 將 Pass 改寫為「停一手（Pass）」並補六個規則／檔案術語。
- **版本與 migration：** 教學文字與示意圖改動使 `contentCatalogVersion` 由 3 升 4；題目 ID、答案、scoring 與 KC 不變。因 `u4-06` 題名及 `u9-06` 作答文案有 learner-facing 語義修訂，兩題 `contentVersion` 由 1 升 2；歷史曝光／事件仍保留當時版本，不回寫。v3→v4 只更新教學內容版本，不移動既有題目索引；v1／v2 的舊索引 migration 維持原規則。自由棋盤 learner-facing 文案與 CSS 改動另將 `live-game-ui-v10` 升為 `live-game-ui-v11`。
- **不可破壞 invariant：** 不改 first response／retry、scheduler、formal evaluation 遮蔽、曝光、題目答案或 evidence taxonomy。關鍵詞與短講仍屬教學支架；formal evaluation 不以此作答案來源。
- **驗收：** 新增 negative tests，要求紅叉不得再被複盤圖拿來表示原著位置、關鍵抽象課必須有足夠步驟，且 19 課都至少有一個可顯示的關鍵詞定義；live-game learner-facing 規則術語亦有靜態契約。
- **證據邊界：** 外部網站只能證明其公開教學做法與術語安排，不證明本改法對本專案初學者一定更有效；棋理適切性仍待 R1a，真人理解仍待 usability。

## 2026-09-28 Change note｜19×19 全盤 practice v1

- **Bottleneck：** Advanced 已有局部讀棋／攻防／官子與 rules-backed multi-step practice，但『完整棋局與複盤』仍是 planned；局部能力缺一個標準全盤整合 Experience。
- **實作：** `live-game` active practice 從 5／7／9 擴為 5／7／9／19；19 路使用同一 rules engine、Pass／認輸、人工死子確認、中國式面積、SGF round-trip、本機續局與 provider seam。進階頁第四 track 直接進 19×19，而不是再增加線性單元。
- **Evidence：** 19×19 只寫 `live-practice-events-v2` 的 unscored practice observation；既有 `live-eligibility-v1` 明確只接受 9×9，因此 19 路不會被升為 T3。v1 practice events 保留 legacy reader，不回填 19 路新語義。
- **Negative tests：** 19×19 SGF round-trip、19 路 practice event 可保存、19 路 live T3 必須 `not_eligible`、v1 legacy event 保留原 schema。
- **停止線：** heuristic bot 在 19 路只保證合法 bounded practice，不代表合理棋力；simple ko／人工死子也不是完整規則裁判。19 路勝負、完成局數與 SGF 都不產生 mastery／formal evaluation／learning-effect claim。R1a／三位初學者／真人 accessibility 依使用者決策延後到最後，狀態仍 BLOCKED／NOT_TESTED。

## 2026-09-26 Change note｜Core 後續進階訓練 v1

- **重新框架：** 喬哈里視窗複核後，不把目前 15 單元誤寫成「完成高級棋力」，也不把後續內容線性接成第 16 單元。現有 15 單元固定為 Core Curriculum；進階改用多條可回跳訓練線，因為同一學習者在讀棋、手筋、中盤、官子、全局判斷的 bottleneck 可能不同。
- **外部參考：** 日本棋院 19 路中高級課綱會繼續深化三手閱讀、打入／侵消、厚薄、手抜き、輕重、先後手與逆官子；British Go Association 保存的 Takemiya syllabus 亦把中盤、tesuji、yose、life-and-death 分成長期技術線。這只支持「仍有可深化的內容」與非單一路線結構，不證明本站的排序或題目有效。
- **實作：** 新增 `advanced.html`／`advanced-content.js`／`advanced-events.js`／`advanced.js`／`advanced.css`。v1 有三條 active track：讀棋與手筋（征子前檢查引征、枷、倒撲、對殺）、中盤攻防（打入／侵消、輕重／手抜き）、官子與全局判斷（先後手／逆先手、形勢判斷）；完整棋局與複盤先標 planned，不以功能數冒充完成度。
- **Evidence boundary：** 本頁所有項目固定 `advanced_practice_only`、`formalEligible=false`、`qualifiedOpportunity=false`、`transferLevel=null`、`skillId=null`。首答與 retry 以 append-only event 分開保存；答錯後重試答對不得覆寫首答。損壞 store fail closed。
- **內容邊界：** v1 多數項目是概念／候選比較的 choice scoring contract；逐步棋盤只作教學示意，不把單一座標或 AI estimate 升格為全局唯一最佳手。正式 KC、scoring contract、retention／transfer 只有在獨立內容核對與可接受答案充分後才另行建立。
- **UI/version：** Core 首頁與工具增加獨立「進階訓練」入口，側欄改稱「15 單元核心課程」，最後一題改稱「完成核心課程」；learner-facing `uiVersion` 升為 `learner-flow-v43`。既有核心事件不回寫。
- **停止條件：** 若 R1a／formative observation 發現棋理錯誤、圖解暗示唯一答案、首答語義被破壞或進階頁造成 Core 路徑混淆，先停擴內容並修正；不得用更多題目掩蓋。

## 2026-09-26 Change note｜進階多手棋盤 Response v1

- **bottleneck：** 進階 v1 仍以 choice response 為主，雖能教候選條件，卻沒有讓學習者真的走完「我一手 → 對手應手 → 我再一手」。這會把讀棋停留在敘述理解，而不是棋盤上的連續 Response。
- **最小實作：** v2 只新增一個可由規則引擎完整驗證的兩段倒撲 sequence。起始局面、學習者兩次可接受落點與固定對手應手皆版本化在 `advanced-content.js`；每一步先由 `go.js` 驗證合法性、提子與簡單劫，再由 `advanced-sequence-v1` 判定是否符合本題 contract。錯誤合法手不改變盤面，留在同一步重試。
- **Evidence：** 新增獨立 append-only `advanced-sequence-events-v1`，以 presentation／decision 為單位保存 `decision_presented`、`move_first`、`move_retry`、`opponent_move`、`completed`。每個 decision 的 first response 與 retry 分開，最後答對不能覆寫首答；固定 `formalEligible=false`、`qualifiedOpportunity=false`、`transferLevel=null`、`skillId=null`。
- **Failure handling：** 規則引擎判非法時保存為實際 move response 並留在原局面；若內建對手應手與規則引擎衝突，UI 直接停題並顯示工程錯誤；event storage 損壞或寫入失敗 fail closed，不繼續假裝完成。
- **反證／oracle：** `advanced.test.cjs` 直接以 `Go.playMove` 重建 sequence，驗證第一手合法且不提子、白應手提掉送子、第二手再提兩子；另驗證 first／retry event 不被覆寫與 malformed store fail closed。
- **證據邊界：** 一個規則可驗證 sequence 只證明 interaction/scoring contract 可行，不證明「倒撲能力」已量測，也不代表進階讀棋已達中高級棋力。

## 2026-09-26 Change note｜進階多手讀棋 v3：倒撲／枷／對殺

- **上一輪盲點：** 只有一個倒撲 sequence 雖能證明 multi-step interaction 可行，但尚不能證明 sequence data 本身不會因內容維護而悄悄漂移；而且 runtime 只支援第一題，沒有題間切換。
- **rules-backed contract：** 新增 `advanced-sequence-contract.js`。頁面載入前會重播所有 canonical sequence，驗 setup 合法、學習者手、固定對手應手、預期提子數、可選的 tracked-group 氣數、終局空點，以及額外 verification branch。任一項不一致時整個多手區 fail closed，不開始寫入練習事件。
- **內容擴充：** 棋盤 Response 由 1 題增至 3 題：倒撲保留「送一子→被提→提回兩子」；枷要求第一手本身不打吃，並驗證白棋兩個主要逃路都能被下一手收住；對殺從雙方各兩口關鍵氣開始，實走「黑壓一氣→白延長→黑先提三子」，明示結果依賴行棋次序。
- **分支邊界：** 枷除了 learner-facing canonical 白左逃路，contract 另重播白下方逃路；兩條分支都必須得到同樣可提結果。這是最低限度的 branch QA，不表示已窮舉所有實戰應手。
- **UI：** 新增三個棋盤 sequence 切換按鈕、下一個棋盤題、重設、鍵盤操作與 375px responsive contract。切換或重設會建立新的 presentation；舊 presentation 事件保留，不覆寫。
- **征子停止線：** 暫不加入 learner-facing 征子 sequence。原因不是缺教材名稱，而是目前尚未建立能驗證「每一步最強逃路／打吃選擇與引征干擾」的 forced-line oracle；不用一條看似梯形的固定手順冒充完整征子判定。
- **Evidence boundary：** 三題仍全部為 `advanced_practice_only`、`formalEligible=false`、`qualifiedOpportunity=false`。rules oracle 只證明規則與已定 sequence contract 一致，不證明手筋構念效度、難度可比或學習成效。

## 2026-09-26 Change note｜進階多手讀棋 v4：bounded 征子 forced line\n\n- **為何現在加入：** v3 把征子留在停止線，因為單靠合法手／提子不足以證明「對手被迫沿唯一路線逃」。v4 先擴 `advanced-sequence-contract.js`，讓每個 decision 可宣告並驗證 `expectedTrackedLibertiesBeforeLearner` 與 `opponentMoveMustBeUniqueLiberty`；只有能逐手重算「兩口氣→打吃後一口→對手唯一延長」的局面才可進 learner-facing sequence。\n- **bounded sequence：** 新增 7×7 征子局部。白方被追串起始兩口氣；黑連續六次把它壓成一口氣，每次白的固定應手都必須等於 tracked group 當下唯一 liberty；最後白在邊線只剩一口，黑第七手提掉八顆。所有中間氣數與最終提子數由 rules engine 重播。\n- **引征 negative oracle：** 測試另在征子路線上加入一顆白色接應／干擾子；原 canonical forced line 必須失效。這只證明「有干擾時不能沿原手順硬追」，不表示已窮舉所有引征形狀或能一般化判斷全盤征子。\n- **UI：** 多手棋盤題由 3 題增為 4 題；sequence selector、下一題、重設、鍵盤與 mobile reflow 共用同一 runtime。每次切題／重設都產生新的 presentation；舊首答與 retry append-only 保留。\n- **停止線仍在：** 不把這個 bounded ladder sequence 升為 KC 或正式征子能力；若要建立 transferable ladder skill，下一步需至少有多個不同方向／距離／引征位置的平行變形，且需外部棋理審查與真人難度資料。\n- **證據邊界：** rules-backed forced-line oracle 是工程／局部棋理一致性檢查；它不能證明教材最佳、學習者已會征子、或學習成效。\n\n## 2026-09-27 Change note｜進階 sequence family v5：非單純旋轉的第二變形

- **learning-loop bottleneck：** v4 每種手筋只有一個 learner-facing seed。即使單題 rules oracle 完整，學習者仍可能記座標、棋色、固定提子數或固定征子終點；這不足以觀察同一能力在新局部條件下是否保留。
- **family schema：** 每個棋盤 Experience 新增 `familyId`、`variantId`、`variationAxes`；contract 缺欄位、重複 family/variant 或重複 experience id 都 fail closed。這些欄位只描述內容家族，不建立 KC 或 mastery。
- **四個第二變形：** 倒撲由回提兩子改為三子且局部棋串改形；枷改變支援與兩個出口的幾何，canonical 逃路與 alternate branch 都需可提；對殺交換黑白角色，learner 由黑改白但仍按氣與先後手提三子；征子由 7×7 七段改為 8×8 十段，路線更長、終點不同，最後提十一子。
- **不是旋轉題庫：** 第二變形至少改一個會改變作答條件的 axis，而不是只做平移／旋轉／鏡射。旋轉仍可作低成本 UI 或規則回歸，但不計入本輪 family evidence。
- **Evidence boundary：** 目前只是 2 variants/family 的 practice seed。不能由此聲稱平行題等難、transfer 已建立或 KC 已被驗證；要進下一級至少需要真人 first-response 資料與 family 內差異檢查。
- **歷史語義：** v4 四題 ID 與 version 不變；新增四個新 ID。舊事件不回寫 family metadata，也不把過去曝光重新標成 unseen。

## 2026-09-28 Change note｜進階固定交錯階段 v1

- **Bottleneck：** cue-control 已避免題名前洩漏 family，但舊流程仍讓同 family variant 可在 seed 完成後立刻作答，短期記憶與相鄰題型線索仍會污染 family transition 的解讀。
- **固定 baseline：** 新增 `advanced-fixed-interleave-v1`，順序固定為四個 seed（倒撲→枷→對殺→征子）後，再進四個 variant；一次只開放下一個位置，不做 learner-model 自適應選題。這是 fixed mixed-practice baseline，不是 scheduler 增益主張。
- **Evidence version：** 新事件流為 `advanced-sequence-events-v3`／schema 3，保存 `presentationPolicyVersion` 與 `policyPosition`；v2 與 v1 各自保留 legacy reader，不回填新 policy 語義。對殺／征子第一題因 seed metadata 語義修正升 experience version 2。
- **Negative gate：** family 描述資格除 seed→variant 首答外，還要求其他三個 family 在兩者之間都實際呈現；缺任一 family、policy position 不符、legacy event 或 storage failure 都不得升格。
- **證據邊界：** 只改善 practice family 的可解釋性；仍不證明 spacing 最佳、題目等難、retention、transfer、KC mastery 或 learning effect。若沒有真人新資料，不再增加更複雜 adaptive policy。

## 2026-09-27 Change note｜進階 family cue-control flow

- **Bottleneck：** v2 已能保存 family／variant 首答，但舊 UI 在作答前直接顯示「倒撲／枷／對殺／征子」、family ID 與「變形」名稱，且可任意先點 variant；這會讓 seed→variant 的描述資料混入明顯的題型 cue 與順序污染。
- **改動：** multi-step 棋盤題在完成前只顯示中性「棋盤練習 N」與當前 prompt；完整題名、target、術語、takeaway 於完成後才揭露。variant 在同 family 的 seed 尚未完成前 disabled；完成 seed 後才開放。事件分析另要求 seed 的 `presented` 必須早於 variant，否則 family transition 保持 `INSUFFICIENT_DATA`。
- **不變 invariant：** prompt 本身仍保留完成該局部任務所需的棋理條件；不隱藏輪到誰走、棋盤狀態或合法性資訊。首答／retry 分離、practice-only、formalEligible=false、mastery=null、transferClaim=false 均不變。
- **驗收：** Node negative test 驗 variant-first 必須資料不足；browser test 驗完成前名稱／術語隱藏、variant disabled，完成 seed 後名稱揭露且 variant 才可點。這只降低已知 cue leakage，不證明兩題等難或真人 transfer。

## 2026-09-27 Change note｜進階 family first-response evidence v2

- **目標：** v5 已有每族兩個非單純旋轉變形，下一個 bottleneck 是事件流仍只保存 experience ID，無法在不回查當前內容定義的情況下重建「當時屬於哪個 family／variant／variation axes」。
- **事件版本：** 新事件流升為 `advanced-sequence-events-v2`／schema 2，寫入新的 `go-advanced-sequence-events-v2` storage；每個事件不可變地保存當時的 `familyId`、`variantId`、`variationAxes`。v1 storage 保留原樣，只能由 legacy reader 讀取，不猜測補 family metadata、不覆寫舊事件。
- **診斷輸出：** 新增 family summary 與 seed→variant first-response transition。輸出只允許 `DESCRIPTIVE_ONLY` 或 `INSUFFICIENT_DATA`；明示 `mastery:null`、`transferClaim:false`，不由 retry 或 eventual correction 覆寫首答。
- **分母／提示：** family summary 以 presentation 與實際 `move_first` 為基礎；hint 與 completed 另計。沒有 seed 或 variant 首答時保持資料不足，不把未答自動算成答對／答錯，也不從現有資料推估 mastery。
- **證據邊界：** 這建立的是 practice-only 可重算資料管線，不證明兩 variant 等難、同一 KC、retention、transfer 或學習成效。

## 目前執行順序

1. Completion Truth P0–P3：已完成工程驗證。
2. Evidence Boundary P0：個人 pilot v3、22 題直接曝光、48 題公開來源曝光、formal holdout pool 退役及一般匯出遮蔽已完成。
3. Evidence Boundary P1：R1 已從學習者介面隔離；v4 審查頁只載入去答案資料，三項獨立聲明與回條驗證分開。
4. Evidence Boundary P2：同步現況文件與回歸測試。
5. Demonstration Coverage P0–P2：19 課逐步棋盤示範、內容結構檢查與介面回歸已完成。
6. Interaction Coverage P0–P2：第 5–14 單元局部棋形點選、內容邊界與介面回歸已完成。
7. 開發期間持續 formative usability observation，不作 gate；learner-facing candidate 相對收斂後，再依 `TEACHING_GATE.md` 收集外部 R1a 回條、三位初學者關鍵任務及真人無障礙證據。R1b 與新 private holdout 另屬正式評量，不以工程測試代替。

## 新增工程項目

| 項目 | 現況 | 驗證 | 證據層級 | 判定 |
|---|---|---|---|---|
| 人機實戰原始事件回流 | `practice-events.js` 繼續以獨立 append-only store 保存全部 live practice 操作；這一層仍是 unscored observation，不因新增 live T3 contract 而回溯升格 | duplicate ID、actor 分離、malformed store fail-closed 與匯出 contract 持續由 board suite 覆蓋 | 工程 | 條件通過；原始事件與可評分 live evidence 分層保存 |
| 9×9 live eligibility + scoring | 新增 `live-evidence.js`：每個 9×9 人機學習者回合在落子前掃描整盤，先決定 eligibility，再保存 assessment／first response／retry。v1 只升格「整盤唯一一手提子」與「電腦上一手新造成打吃後的唯一直接延長救棋」；多候選、5×5／7×7、SGF actor 不明、全局取捨均不評分 | `tests/live-evidence.test.cjs` 11/11 PASS；包含多機會排除、actor provenance、未答分母、首答／retry、舊 contract 隔離與同局多手不冒充跨局樣本 | 工程／自然實戰 T3 管線 | 條件通過；`formalEligible=false`，只支持這兩個 bounded local contracts，不支持全局最佳手或棋力 |
| 整合學習證據狀態 | `learner-progress.js` v2 將既有 T0–T2 診斷與 bounded live T3 並列成可重算 evidence state，另加入 live 資料收集 readiness（未開始／只掃描／eligible 未答／單局收集／跨局收集）；不輸出 mastery %、不直接寫 scheduler | `tests/learner-progress.test.cjs` 6/6 PASS；board/UI contract suite 26/26 PASS | 工程／Learner Model 描述層 | 條件通過；readiness 只描述資料是否開始累積，不代表樣本量充分、真人效度或學習成效 |
| 三尺寸本機電腦對手 | 5／7／9 路 active practice 可選雙人同機或和電腦下；可執黑／白。3×3 只保留 legacy/runtime 相容。電腦只從規則引擎合法候選中，用 bounded heuristic 選手，無合理手可 Pass；不是 KataGo | `tests/live-game.test.cjs` 持續驗證 active 尺寸合法 play／pass、bot 基本行為與 UI 接線；3×3 只保留 legacy regression | 工程 | 條件通過；bot 強度與教學價值未驗，不得宣稱棋力、最佳手或學習成效 |
| 5×5／7×7／9×9 active 棋盤練習 | 共用 `live-game.html` 與尺寸切換；5／7 路作基礎／過渡練習，9 路保留完整小棋盤對局。3×3 已退出學習者 UI，但底層與歷史資料相容保留。規則、Pass、人工終局、悔棋、續局與 SGF 共用 bounded runtime | `tests/live-game.test.cjs` 目前 targeted suite 26/26 PASS，含尺寸、3×3 legacy、SGF、bot、rendering、cache-bust 與 live evidence 靜態接線 | 工程 | 5×5／7×7 仍只作 practice；9×9 只有 `live-eligibility-v1` 明列的少數局部回合可成 bounded live T3，其餘仍 unscored；不代表學習成效 |


| 可替換對弈 provider | `move-provider-v1` 統一 heuristic／本機 KataGo bridge／Remote HTTP API；provider 只提候選，規則引擎再次驗證 | `tests/move-provider.test.cjs` 覆蓋 canonical payload、malformed/out-of-range、HTTP success 與 fail-closed；完整 CI 待分支 workflow | 工程 | 候選實作完成；KataGo 真機路徑仍需 Windows bridge 實測，不代表棋力或教學效度 |\n\n## 2026-09-22 Change note｜9×9 完整實戰

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

- **改動：** 新增 `live-evidence.js`、`learner-progress.js`、`tests/live-evidence.test.cjs`、`tests/learner-progress.test.cjs`。9×9 人機局每個學習者回合在第一個操作前先凍結整盤 assessment；eligible 與 scoring contract 分別版本化為 `live-eligibility-v1`／`live-scoring-v1`，整合狀態 policy 為 `learner-evidence-progress-v2`。
- **Eligibility v1：** 只接受兩類可由 rules engine 客觀核對的局部任務：整盤唯一的一手提子；以及 actor 已確認為 computer 的上一手新造成打吃後，唯一直接延長且不靠提子的救棋。整盤有多個支援機會時整回合排除；5×5／7×7、SGF 匯入 actor 不明與其他全局決策維持 unscored。
- **First-response invariant：** assessment、first response、retry 分開保存；非法首答後重載會從 event store 恢復 response count，不把 retry 改寫成新的 first response。eligible assessment 沒有 response 仍保留在 denominator。
- **Historical semantics：** summary 只聚合目前 eligibility/scoring/taxonomy 版本；不相容舊事件另計 `excludedContractVersionEvents`，不以新語義靜默重算。
- **Sample independence：** 決策機會照實列分子分母，但「最近一致」狀態以不同 game session 為單位；同一盤多個連續機會不冒充三個獨立樣本。
- **Learner progress：** 課程／排程 T0–T2 與 live T3 只在 `learner-progress.js` 並列成描述性 evidence state；`schedulerAuthority=false`、`formalEvaluationAuthority=false`，不輸出 mastery 百分比。
- **Migration：** 新增獨立 `go-live-evidence-v1` store；不搬移、不覆寫既有 `state.events`、scheduler、`go-live-practice-events-v1` 或棋局存檔。
- **Rollback：** 移除兩個新 runtime 檔與首頁兩個 evidence summary 即可；既有課程、棋局與 raw practice events 不需 migration。
- **Validation：** live evidence contract 11/11 PASS；integrated progress policy 5/5 PASS；既有 board/UI targeted suite 26/26 PASS。已補 `app-state.test.cjs` 整合反證，但本環境仍無真實 Node `vm`／Windows browser；repo-wide push CI 狀態維持 UNKNOWN。


## 2026-09-22 Change note｜悟之一手改名

- **改動：** 現行產品名稱由「一手一懂」改為「悟之一手」；公開名稱改為 `VT-COS｜悟之一手`。同步首頁、棋盤頁、R1 reviewer 頁、SGF 匯出註記、README、`BRAND.md`、release manifest、release checklist、品牌測試與 current-truth 標題。
- **歷史語義：** 明確屬於歷史 review／舊證據快照的文字不因品牌改名而重寫；storage key、event schema、KC、item/scoring policy、holdout exposure、trial protocol 與歷史事件均不 migration。
- **英文 metadata：** 不硬譯新中文產品名；品牌規格改用中性 `VT-COS · Go Learning` 作英文 metadata 用語。
- **Rollback：** 只需恢復 display/metadata 品牌字串；學習資料與 evidence store 不受影響。

## 2026-09-22 Change note｜課程 save envelope P0 修復

- **問題：** `app.js::save()` 曾誤插 `livePracticeEvents`／descriptor／read error 三個 raw-export 欄位，但該作用域不存在 `livePractice`，可能導致主課程 localStorage 寫入失敗。
- **修正：** 從主課程 `go-learning-prototype-v7` envelope 移除這三個欄位；raw practice events 與 scored live evidence 繼續各自使用獨立 store，只有完整 JSON 匯出時才聚合。
- **Invariant：** 主課程 save 不得複製 `livePractice`／`liveEvidence` source of truth；stream failure 也不得污染課程保存。
- **Validation：** 新增 `app-state.test.cjs` negative contract；targeted board/UI harness 26/26 PASS，且直接檢查 `save()` block 不含 `livePractice`。完整 Node vm／Windows browser 本輪仍需 repo-wide CI／實機驗證。

## 2026-09-22 Change note｜live evidence collection readiness v2

- **改動：** `learner-evidence-progress-v2` 新增 `collectionReadiness`，只描述 9×9 live evidence 是否已開始掃描、是否出現 eligible、是否有 first response，以及是否跨不同 game session 累積。
- **階段：** `not_started`、`scanning_no_eligible`、`eligible_waiting_response`、`collecting_single_session`、`collecting_multi_session`。
- **證據邊界：** readiness 不是「樣本量已足夠」、mastery、棋力、學習成效或 formal evaluation；沒有 eligible 機會不代表退步。
- **Validation：** `tests/learner-progress.test.cjs` 6/6 PASS；現行 live evidence contract 11/11 PASS；board/UI targeted suite 26/26 PASS。
\n## 2026-09-23 Change note｜Move Provider + KataGo／Remote API\n\n- **改動：** 新增 `move-provider.js`、`katago-bridge.cjs` 與 provider UI；既有 heuristic bot、localhost KataGo 與 Remote API 共用 `move-provider-v1` action contract。\n- **不可破壞 invariant：** provider 不取得 rules/scoring authority；任何候選 play 都再次經 `Live.play`。timeout、HTTP、JSON、KataGo process 或非法手維持 ERROR，不 fallback。\n- **歷史語義：** 不修改既有 practice event、live T3 eligibility/scoring、KC、scheduler 或 formal evaluation；provider/model metadata 只附加在 computer practice event。\n- **Migration／rollback：** 舊 opponent 設定仍可讀；移除 provider script／UI 與 bridge 即回到 heuristic/local mode，棋局與 evidence store 不需 migration。\n- **Validation：** PR #5 的 GitHub Actions `verify` run #151 已 PASS：`node-contracts`、`windows-ui-and-boundary`、`sabaki-sgf-oracle` 全部成功；其中 provider contract tests 已納入 Node contracts。**本機 Windows KataGo 真機 bridge smoke 仍為 NOT_MEASURED**。已新增 `tests/katago-bridge-smoke.ps1`，以實際 `katago.exe`、config、model 啟動 localhost bridge 並送出 `move-provider-v1` 9×9 請求；只有腳本取得有效 provider action 才可升為 PASS。因此目前只可宣稱 provider/API 與既有工程契約通過，不可宣稱 KataGo 全鏈路已驗證。\n
## 2026-09-23 Change note｜初學者對弈入口與進階 provider 分層

- **目標行為：** learner-facing 主流程只要求選「練習電腦」或「雙人同機」及執黑／白；KataGo、Remote API、endpoint 與連線測試收進預設收合的進階設定。新使用者預設「練習電腦」，不要求理解引擎名稱、API 或安裝流程。
- **不可破壞 invariant：** provider 仍只有候選權；所有 play 再經規則引擎；KataGo／Remote failure 保持 ERROR，不 fallback；不在 learner UI 收集或保存 API key；既有 opponent 設定可繼續讀取。
- **主要 failure case：** progressive disclosure 只藏文字卻破壞既有 KataGo／Remote 使用者設定、provider endpoint、電腦回合或 evidence actor semantics；因此保留原 opponentMode 值並新增 UI contract／negative tests。
- **驗收：** 初學者 selector 不出現 KataGo／Remote/provider 術語；進階區可選引擎、看 KataGo 官方下載入口、設定 endpoint 與測試連線；API key input 不存在；既有 live-game、provider、Windows UI、repository boundary、Sabaki oracle 全部需 PASS。
- **證據邊界：** 這是 information architecture／usability risk reduction 的工程修改；是否真的讓初學者更容易理解仍需三位目標初學者短任務觀察，不能由 UI test 升格。
- **Rollback：** 恢復 v6 mode panel 與預設 local；不需棋局、practice event、KC、scheduler 或 formal evaluation migration。

## 2026-09-23 Change note｜真人 usability 證據改為逐位保存

- **問題：** 舊 formal-teaching-evidence-v1 只保存 participantCount 與五項任務的彙總布林值；理論上可能由不同參與者各完成不同任務，卻被彙總成「三位都完成五項」，造成 denominator／completion 語義無法稽核。
- **修正：** 保留既有彙總欄位以便閱讀，但正式 gate 現在額外要求至少三筆唯一匿名 participantCode；每位都必須是 target novice、逐項完成五個 critical tasks、沒有 blocking issue，且有非空 evidence reference。participantCount 必須與逐位紀錄數一致。
- **反證：** 任一參與者漏做一項、逐位紀錄少於宣稱人數、或 participant code 重複，都必須 BLOCKED；不得由 aggregate true 掩蓋。
- **隱私：** 只使用匿名 code 與證據引用，不在 repo 保存姓名、聯絡資料或其他個資。
- **證據邊界：** 此修改只提高真人證據的可稽核性，不產生任何真人證據；目前 usability／accessibility 狀態仍是 NOT_TESTED／BLOCKED。
- **Migration／rollback：** 尚無正式真人證據檔，因此沒有歷史真人資料需要升格；舊格式檔會 fail closed，需依原始觀察補成逐位紀錄，不能猜測補值。若 rollback，恢復舊 verifier，但會重新暴露彙總證據缺口。


## 2026-09-23 Change note｜Pages provider 可達性修正

- **工程事實：** GitHub Pages 為靜態前端，不能代替 localhost bridge 或執行 KataGo。公開頁面的內建 heuristic 仍可零安裝使用。
- **本機 KataGo：** provider contract／bridge 已實作；本輪已取得使用者裝置上的 `KataGo v1.17.1 + OpenCL + b10c384` 9×9 GTP `genmove B = E5` 操作證據，但 repository 的 `tests/katago-bridge-smoke.ps1` 尚未取得可保存的 PASS receipt，因此「bridge HTTP 全鏈路 smoke」仍維持 NOT_MEASURED，不以聊天截圖升格。
- **共用雲端 KataGo：** `remote` seam 已存在，但目前沒有部署共用 HTTPS KataGo endpoint，狀態為 NOT_IMPLEMENTED／NOT_MEASURED；不能宣稱所有 Pages 訪客可直接使用 KataGo。
- **UI 修正：** `live-game-ui-v8` 明示本機模式需每台裝置自行啟動 bridge，Remote 模式需另有 HTTPS service，並在失敗訊息中保留相應診斷；不 fallback 成 heuristic。
- **證據邊界：** 此修改只修正部署／能力呈現與 provider failure semantics，不改棋力、內容效度、formal evaluation 或學習成效狀態。


## 2026-09-23 Change note｜Hosted KataGo transport boundary

- **目標：** 讓既有 localhost bridge 能在明確 opt-in 下作為 hosted KataGo service 的 transport seam，而不把 localhost 預設意外暴露到網路。
- **改動：** `katago-bridge.cjs` 預設仍只綁 `127.0.0.1`；只有 `VTCOS_KATAGO_ALLOW_REMOTE=1` 才可使用遠端 listen host，且必須同時設定 `VTCOS_KATAGO_ALLOWED_ORIGINS`。新增 `GET /health`、browser origin allowlist 與 bounded concurrent request gate；未允許 origin／未設定 allowlist 均 fail closed。
- **反證：** 新增 `tests/katago-hosted.test.cjs`，要求 remote mode 無 allowlist 必須拒絕啟動，非允許 browser origin 必須 403，允許 origin 才可取得 health response。
- **不變 invariant：** provider 仍不取得 rules/scoring authority；KataGo failure 不 fallback；沒有改 learner event、KC、scheduler、formal evaluation 或 storage semantics。
- **部署狀態：** 本 change 只建立可部署的安全 transport boundary，**沒有實際部署公共 KataGo runtime**；公開 HTTPS endpoint、runtime 成本／容量與真實 Pages→service→KataGo smoke 仍為 NOT_IMPLEMENTED／NOT_MEASURED。
- **Rollback：** 回復 bridge 與移除 hosted contract test 即可；不需資料 migration。


## 2026-09-23 Change note｜全部跨單元短講邊界回歸

- **改動：** `tests/ui.test.cjs` 新增 table-driven browser regression，逐一走過 15 單元之間全部 14 個邊界；每個案例從該單元最後一題正答開始，驗證「進入第 N 單元短講」按鈕、下一單元第一題、短講標題、Modal 自動開啟、focus、`lessonIntroPending` 與單元 selector。
- **反證：** 任一邊界若題序改錯、按鈕退回「下一題」、下一單元短講未開啟、pending 未保存或焦點未進短講標題，Windows file-URL UI suite 必須 FAIL。
- **不變範圍：** 沒有修改課程內容、作答／首答語義、KC、scheduler、storage schema、scoring 或 formal evaluation；本輪只提高既有 UI 行為的回歸覆蓋。
- **Validation：** commit `e5d119c` 的 GitHub Actions verify run #175 全部 PASS：node-contracts、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；14/14 跨單元案例因此有實際 browser 執行證據。

## 2026-09-24 Change note｜正式跨單元必重新開啟短講

- **問題：** `seenLessonIntros` 同時被用來表示「曾預覽過短講」與「正式完成前一單元後已走過銜接」。因此使用者若先前曾瀏覽第 8 單元，之後完成第 7 單元時，`lessonIntroPending` 會被壓成 `false`，跳過正式的單元銜接短講。
- **修正：** `startProblem` 新增只供正式跨單元導覽使用的 `forceLessonIntro`；`nextProblem` 以 lesson 的 unit 是否改變判斷 `entersNewUnit`。同單元跨課仍尊重 `seenLessonIntros`，跨單元則即使已預覽也重新開啟下一單元短講。
- **反證：** `tests/ui.test.cjs` 新增真實案例：先把第 8 單元 lesson 設為已看過，再從 `u7-06` 正答進入第 8 單元；仍必須顯示「進入第 8 單元短講」、開啟「現在先學：先照顧弱棋」、保存 `lessonIntroPending=true` 並把焦點移到短講標題。
- **歷史語義／migration：** 不改 storage schema，也不清除既有 `seenLessonIntros`；舊資料可直接使用。此修改只改正式跨單元 navigation 的 UI 狀態，不改 first response、scoring、KC、scheduler、formal evaluation 或 learner evidence。
- **Rollback：** 移除 `forceLessonIntro` 與 `entersNewUnit` 分支即可恢復舊行為；不需資料 migration。
- **UI version：** 因正式跨單元 navigation 語義已改，learner-facing `uiVersion` 升為 `learner-flow-v33`；舊事件保留原本的 `learner-flow-v32`，不回寫歷史事件。`index.html` 同步使用 v33 query string，避免 Pages／瀏覽器沿用舊 `app.js`。
- **Validation：** commit `7eec751` 的 verify run #177：node-contracts、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 全部 PASS。

## 2026-09-24 Change note｜核心學習文字閱讀階層

- **改動：** `learner-flow-v34` 將課程頁中會直接影響作答／下一步判斷的學習指引、回答政策、短講導語、示範與檢查點提升到 16px 級並放寬行距；`live-game-ui-v9` 將棋盤操作提示、即時回饋與主要說明提升到 16px 級，並將主要 select／input 控制維持至少 44px 高。metadata、版本／狀態等非核心資訊仍保留較小字級，沒有把整站一律放大。
- **為何現在改：** 重新掃描現行 learner-facing CSS 後，發現少數必讀操作文字仍落在約 13–15px；本次只修正閱讀階層，不改雙欄棋盤／題目結構、手機單欄重排或漸進揭露。
- **歷史語義：** UI version 升級，既有事件保留原版本；不改 item、KC、scoring、scheduler、Evidence Taxonomy、first-response／retry 或 formal-evaluation 語義。
- **Rollback：** 回復 `styles.css`／`live-game.css` 的字級與控制高度，並將資產 query string／UI version 回到 v33／v8；資料 schema 無需 migration。
- **Validation：** 新增靜態反回歸契約，要求核心學習文字維持 16px 級、live 主要輸入控制維持 44px，且 metadata 不被誤升格。完整 browser／Windows regression 以分支 CI 為準。這項工程調整不能單獨證明真人更容易讀、操作更順或學習成效提升；三位初學者與真人無障礙觀察仍維持待驗。


## 2026-09-24 Change note｜CJK 互動介面基線

- **改動：** `learner-flow-v35`／`live-game-ui-v10` 將 learner-facing 頁面語系標記明確化為 `zh-Hant-TW`，繁中字型 fallback 加入 PingFang TC；共用鍵盤 focus 以 `:focus-visible` 明示。手機主要內容左右留白調為 20px，常用課程／工具／live 控制維持至少 44px，核心教學文字以約 42em 上限控制行長；外部說明連結使用底線，不全站使用 `word-break: break-all`。
- **來源轉譯：** 參考 CJK 長文設計規範的語言字型、mobile padding、touch target、focus、links 與安全換行原則；沒有把文章 680px 單欄、TOC、Hero、Newsletter 或 Dark Mode 直接搬入互動作答介面。
- **歷史語義：** 只改 UI presentation 與 UI version；既有事件保留原版號。不改 item、KC、scoring、scheduler、Evidence Taxonomy、storage schema、first-response／retry 或 formal-evaluation 語義。
- **Rollback：** 回復 `styles.css`、`live-game.css` 與 HTML 語系／asset query strings，並將 UI version 回到 v34／v9；無資料 migration。
- **Validation：** 靜態反回歸新增：`zh-Hant-TW`、CJK font fallback、20px mobile padding、44px controls、visible focus、link underline，以及禁止全站 `word-break: break-all`。完整 Windows/browser regression 以分支 CI 為準。這些工程契約不能單獨證明真人可讀性、可用性或學習成效。

## 2026-09-24 Change note｜SGF 單點復盤語義收斂

- **修正前提：** 既有 SGF 功能不只是一般棋譜檢視；它已能在任意可落子手數前重建盤面，要求使用者憑記憶下出原著，並保存候選手、理由、預期應手與人工確認。
- **改動：** learner UI 統一稱為「棋譜單點復盤／單手原著重建」。`sgf.js` 將此活動固定為 `evaluationRole=practice`、`evaluationContext=sgf_recall`、`formalEligible=false`、`claimScope=historical_move_reconstruction`、`scoringClaim=matches_original_sgf_move_not_best_move`；原 `T3_candidate` 已移除。
- **反證／語義門檻：** 與原著一致只表示重建了棋譜中的歷史著手；與原著不同也不能推定該手較差。只有人工或 bounded external analysis 另行確認後，才可記錄「可接受答案」。
- **UI：** SGF 模式不再顯示一般「答對／答錯」，改為「與原著一致／與棋譜原著不同」，並明示這不是整盤連續猜手。
- **證據邊界：** 單點復盤不更新 T2／T3、KC、scheduler 或 formal evaluation，不作棋力或最佳手證據。
- **連續復盤：** 整盤／連續猜手目前維持 `BACKLOG / EXPERIMENTAL / NOT_CURRENT_BOTTLENECK`。先以 Sabaki Guess mode 作 Reference；只有真人使用顯示「反覆選手數」成為可觀察 bottleneck，才考慮把既有單點流程最小連續化。
- **Rollback：** 可回復本輪四個 learner/runtime 檔案；不涉及 storage migration，歷史復盤紀錄保持可讀。
- **Validation：** `tests/sgf.test.cjs` 已新增 claim-boundary 與 learner wording 反回歸；完整 repo CI 狀態需由實際 workflow 執行確認，未執行前不宣稱 PASS。


## 2026-09-26 Change note｜經典眼形探索 v1

- **改動：** `learner-flow-v36` 在第 4 單元加入 `classic-shapes.html`；主課四題直三 learner-facing 文案改為先不揭名，作答回饋才說明「直三」。探索頁重用 `content.js` 的既有題目，不建立第二套答案。
- **版本：** `u4-m01`～`u4-m04` 的 contentVersion 由 1 升為 2；歷史事件保留原 contentVersion。storage schema、content catalog、KC／scoring contract 不變。
- **證據邊界：** 探索頁為 practice-only，不產生 formal evidence；正式教學仍受 `TEACHING_GATE.md` 阻擋，學習成效仍 NOT_MEASURED。
- **Rollback：** 移除第 4 單元入口與三個 classic-shapes 資產，回復四題文案及 UI version；既有 storage 不需 migration。
- **Validation：** PR #14 的 verify run #197 全數通過：node-contracts、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均 PASS；PR 已於 2026-09-26 squash merge 至 `main`（merge commit `1f89f79f8969d7d81cd682b4e2ef44c447df841d`）。這些仍只屬工程驗證。


## 2026-09-26 Decision note｜真人觀察時序調整

- **開發期間：** formative observation 可持續，目的是找 bottleneck、修 UX、補反證測試；不要求三次完成、不阻擋工程迭代，也不計入正式 usability 分母。
- **正式教學前：** learner-facing candidate 凍結後，才執行至少三位唯一 target novice 的五項 critical tasks 與真人 accessibility spot check。
- **狀態不變：** 正式 usability 仍 `NOT_TESTED`，正式教學仍 `BLOCKED`；這次只調整證據收集時序，不降低 gate。


## 2026-09-26 Change note｜社群分享圖 v2 候選

- **問題：** WhatsApp／Facebook 分享預覽原先缺乏可辨識的品牌大圖；舊 `og-wu-zhi-yi-shou.jpg` 僅保留為既有公開資產，不再作目前分享入口。
- **改動：** 新增 `og-wu-zhi-yi-shou-v2.jpg`（1200×630，JPEG），首頁 `og:image` 與 `twitter:image` 改指向 v2；`release-manifest.json` 同步納入兩個已追蹤 OG 圖檔，維持 repository boundary 的 exact-match 契約。
- **驗證邊界：** 檔案尺寸、metadata 與 CI 只證明發布契約；WhatsApp／Facebook 是否實際抓到新版、中文字在手機縮圖是否清楚、平台裁切是否正常，仍需平台實際預覽驗收後才能把 v2 升為正式分享資產。
- **WhatsApp 舊快取診斷：** 若分享卡仍顯示舊 `<title>`／一般 `description` 而不是現行 `og:title`／`og:description`，視為舊 URL 預覽快取的強訊號；正式驗收優先使用 canonical 根網址並以 Meta Sharing Debugger 重新抓取，不把重複貼同一個 `index.html` URL 當成已重新抓取。
- **Rollback：** 將 `og:image`／`twitter:image` 指回舊圖即可；不影響課程、題目、事件、scoring、scheduler 或任何學習證據語義。

## 2026-09-27 Change note｜工具面板語意與品牌邊界複核（v45）

- **Johari 開放區：** 「工具與資料」的分層本身成立：日常練習／複盤留第一層，流程試行、排程政策與匯出留在預設收合區；頂端「今日到期」仍只在確實有到期題時顯示。
- **盲點修正：** 原 HTML 真的含有兩段字面量 `\n`，瀏覽器因此把 `\n` 當文字顯示；已改成真正換行並加反回歸。原工具按鈕「今日複習」也不精確，因 scheduler 在沒有到期題時會選尚未呈現的新 practice item；v45 改為依既有 `dueCount` 動態顯示「複習今日到期（N）」或「開始間隔練習」，但沒有改 scheduler 規則。
- **前輪判斷糾正：** 不採「公開介面移除 VT-COS」的全面做法。依 `BRAND.md`，第一次出現產品名稱仍保留母品牌 `VT-COS｜悟之一手`；後續操作列可只顯示「悟之一手」，避免重複品牌與英文狀態字串干擾任務。亦不把「棋譜單點復盤」泛化成「棋譜復盤」，因現行能力仍是 bounded single-move historical recall；「進階訓練」也保留既有產品路徑名稱。
- **learner-facing 文案：** 「局面小測驗」改為「局面應用練習」；自由棋盤、進階訓練與 SGF 說明縮短並改成使用者可理解的功能／邊界，不再直接顯示 raw `practice`、KC／T2-T3 等不必要內部語言。SGF 仍明示單手重建不是最佳手評分。
- **不可破壞 invariant：** 不改 item／KC、scoring、first response／retry、scheduler policy、storage schema、Evidence Taxonomy、formal evaluation、live evidence 或 advanced event contract。v45 只改 learner-facing HTML、顯示文案、現有 due state 的呈現與 UI version。
- **未知與證據邊界：** 這些修正可由靜態／狀態／browser regression 驗證其工程契約，但「是否更快看懂工具用途、是否降低誤點」仍是 formative hypothesis；正式 usability、正式教學、正式評量與學習成效狀態不因此升格。



## 2026-09-27 Change note｜世界死活名型館 v1

- **Johari 開放區：** 經典名型可作記憶與文化支架；既有直三頁已證明「先作答、後揭名」的互動契約可運作。
- **Johari 盲點修正：** 上一輪把部分跨語名稱講得過度一對一；本版改以 geometry/family identity 為主，alias 必須帶 relation type 與 review status。Bulky Five ↔ 刀把五、Rabbity Six ↔ 葡萄六等未完成幾何與來源雙重核對前不得標成 exact alias。
- **Johari 隱藏區：** repo 已有 advanced family／variant／cue-control 與 practice-only 邊界，可沿用「名稱是 scaffold、不是能力」原則，而不另建 KC 或 mastery。
- **Johari 未知區：** 中／日／韓／英是否存在穩定一對一名型、各地教材分類差異、真人是否因多語資訊增加負擔仍待外部內容審查與 formative observation。
- **實作：** 新增 `classic-shapes-catalog.js` 與圖鑑 UI。已核實項目含「五目中手」「花六」「隅の曲り四目 / Bent Four in the Corner」「一合マス / Carpenter's Square」。其餘指定中文名型先標 `needs_review`。
- **不變項：** 只有既有直三練習使用既有 scoring source of truth；圖鑑不寫 learner evidence、KC、scheduler、T2/T3 或 formal evaluation。盤角曲四在 ruleset-aware contract 前不得成為單一固定答案題。


## 2026-09-27 Change note｜中文名稱身分 v2

- **問題：** v1 雖有 `reviewStatus` 與「繁中教學譯名」備註，但「沒有固定中文名」仍不是機器可讀狀態，容易把描述性翻譯日後誤當既定華語術語。
- **修正：** `world-classic-shapes-v2` 新增 `zhNameStatus`、`preferredZhTW`、`zhAliases`、`teachingTranslation`、`literalTranslation`、`zhNameNote`。UI 明示「中文既有名／中文既有或常用別名／專案教學翻譯／中文描述不是專名／本輪未找到固定中文名／中文名稱待核實」。
- **新增 reference family：** L Group、L+1 Group、Tripod Group、Long L Group。前三者在目前覆蓋來源中未確認固定中文專名，因此只保留英文原名＋繁中描述；Long L Group 由多個中文術語來源支持「帶鉤」，並依外氣條件區分「緊帶鉤／寬帶鉤」；中文命名可標 established alias，但條件別名仍不得脫離實際幾何使用。
- **中文名稱修正：** Carpenter's Square 不再以「木匠方」當既定中文名；多個中文術語來源支持「斗方」，另有「金櫃角」，因此 preferred 中文名改為「斗方」，「木匠方」只保留為 teaching translation。
- **韓文補充：** `귀곡사`、`매화6궁` 由韓文次級圍棋來源支持，標 `PARTIAL`，不與日本棋院官方來源同級。
- **證據邊界：** 名稱／翻譯核對仍不是棋理或 scoring 效度；只有既有直三可玩，其餘仍需 geometry、ruleset／variation contract 與 negative oracle 才能成為 practice。
- **Validation：** PR #17 最新 verify run #403 全數 PASS：Node contracts、teaching gate verifier、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `01b202768ee7962a022d7859d8a224e23324cba3`）。這只支持工程／資料契約，不升格內容效度或學習成效。


## 2026-09-27 Change note｜刀把五 bounded practice v1

- **目標行為：** 將「刀把五 / Bulky Five」從 catalog-only 升為第一個新可玩名型 family，但只評分「共同急所」第一手，不宣稱完整死活答案樹。
- **幾何契約：** `classic-vital-point-v1` 要求五點眼空與 P-pentomino 同構；急所由眼空 adjacency graph 中唯一 degree-3 點推導，不由 UI 固定座標硬寫。
- **規則契約：** `go.js` 必須證明包圍棋串 setup 合法、五個候選點皆可合法落子；wrong geometry、wrong vital point 或非急所首答不得成功。
- **Experience：** 四個 practice variant：守方 seed、攻方 seed、旋轉守方、鏡像攻方；皆 `practice-only`，不寫 KC／scheduler／T2-T3／mastery／formal evaluation。
- **外部支持：** British Go Journal 與 Online Go Forum 的教學資料都把 Bulky Five 視為具有 vital point 的基本死活形；這只支持 bounded vital-point teaching contract，不替代本專案完整答案樹審題。
- **停止線：** 若之後要把「找到急所」升成「完整做活／殺棋」，必須另建 variation tree、主要抵抗 branch 與外氣／角部條件 negative oracle。
- **Validation：** PR #18 verify run #407 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `aadc6cc2d95d4c85f3f9b97926fe29336b125584`）。這只支持 bounded vital-point 工程／內容契約，不升格完整死活效度或學習成效。


## 2026-09-27 Change note｜刀把五 A/B short-read v1

- **新增行為：** 在既有 vital-point practice 後加入三個第 3 手短讀 variant；棋盤先由 rules engine 重播攻方急所與守方 A/B 應手，學習者只下攻方第 3 手。
- **branch contract：** `classic-bulky-five-short-read-v1` 從 Bulky Five geometry 推導兩個 A/B 點：兩者都與 vital point 相鄰、且在 eye-space adjacency graph 中 degree=2。守方佔其中一點後，攻方正答必須是另一點。
- **來源：** YeeFan / How To Play Go 明確描述「守方 A → 攻方 B；守方 B → 攻方 A」；Malaysia Weiqi Association 另支持 Bulky Five 先手與 key point 的基本死活語義。這些來源支持本 bounded 主分支，不宣稱覆蓋所有抵抗。
- **反證：** 非 A/B 守方回應、錯誤 complement、鏡像後沿用 seed 舊座標都必須 fail；未列分支保持 `UNKNOWN`，不 fallback 成固定答案。
- **證據邊界：** 只支持三手主分支 reading practice；不支持完整做活／殺棋答案樹、所有外氣／角部條件、mastery、transfer、T2/T3 或 formal evaluation。
- **Validation：** PR #19 verify run #411 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `15cc9e482a594fa7452cf53f2fe481fd5a8d7bc5`）。這只支持 bounded A/B 三手主分支工程／內容契約，不升格完整死活效度或學習成效。


## 2026-09-27 Change note｜刀把五 sealed reduction v1

- **進入條件：** 守方整串在局部 setup 中只有五個眼空作 liberties，沒有任何外氣；攻方已先佔共同急所，守方之後的外部著手不改變此局部。
- **contract：** `classic-bulky-five-sealed-reduction-v1` 推導唯一 2×2 square core 與突出 capture point。攻方可用任意次序補完其餘三個 core 點；完成後守方只剩突出點一口氣，規則引擎必須證明該手合法且正好提四子，終局眼空等於 2×2 square four。
- **negative oracle：** 移除外圍封閉層、讓守方存在外氣時，`forcedCapture=false` 且 `squareFourReached=false`；不得把 sealed 分支套到一般刀把五局面。
- **來源：** Board to Bits Go 描述 Bulky Five 內部逐步填入、迫使提四子並縮成 square four 的路徑；Malaysia Weiqi Association 教材另把完全包圍的 square four 列為 dead shape。來源只支持此條件分支，不代表完整答案樹。
- **證據邊界：** 仍為 practice-only；不寫 KC／scheduler／T2-T3／mastery／formal evaluation。未列守方應手、有外氣、角部差異或其他 ruleset 條件維持 UNKNOWN。
- **Validation：** PR #20 verify run #414 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `cfe147bc002b4b39e91fe7e42f8e2110ec813792`）。這只支持「零外氣＋局部手抜き」sealed reduction 工程／內容契約，不升格完整刀把五答案樹或學習成效。


## 2026-09-27 Change note｜梅花五 / Cross Five bounded practice v1

- **Learning-loop bottleneck：** 名型館先前只有刀把五一個新 family 可玩，容易把進步退化成同 family 記憶；本輪增加第二個幾何不同的五點 family，目標是建立跨 family 的急所辨識經驗。
- **contract：** `classic-cross-five-vital-point-v1` 要求五點眼空與十字形同構；唯一與四個眼空相鄰的 `degree=4` 中心就是 bounded vital point。rules engine 另驗包圍 setup 與五個候選點的合法落子。
- **Experience：** 四個 variant：黑守、白攻、白守＋左移、黑攻＋上移；刻意改變角色、棋色與棋盤位置，避免把「棋盤中央」誤當「棋形中央」。
- **來源：** 中文教材直接說梅花五／花五的做活、殺棋共同要點都是中央；英語 Cross Five 教材同樣把 vital point 放在中心。來源支持第一手急所，不自動支持完整後續變化。
- **反證：** 非十字五點 geometry、錯誤 vital point、平移後沿用 seed 舊座標都必須失敗。
- **證據邊界：** 只支持 bounded vital-point practice；不寫 KC／scheduler／T2-T3／mastery／formal evaluation，也不宣稱真人已產生跨 family transfer。
- **Validation：** PR #21 verify run #418 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `ccc4191ee1eae8bb3be308a19fe3037cd8bc4907`）。這只支持梅花五／Cross Five 第一手中央急所的工程／內容契約，不升格完整五目中手答案樹或學習成效。


## 2026-09-27 Change note｜刀把五 × 梅花五 interleaved contrast v1

- **Learning-loop bottleneck：** 兩個 family 雖都可玩，但仍分區呈現，頁面區塊本身可能成為 family cue；因此新增 6 題交錯 practice，順序固定為 bulky/cross/bulky/cross/bulky/cross。
- **source-of-truth：** `classic-contrast-vital-point-v1` 的 round 只保存 `sourceType` 與 `sourceItemId`，禁止 `eyeSpace`、`vitalPoint`、`answer`、`correctMove`、`setupStones`；評分一律委託既有刀把五或梅花五 contract。
- **cue control：** 首答前 UI 不顯示 family 名稱；正答後才顯示「刀把五／Bulky Five」或「梅花五／Cross Five」及 degree-3／degree-4 幾何依據。
- **反證：** 連續同 family、缺 source item、contrast round 偷塞答案欄位都 fail closed；contrast 正答結果必須與直接呼叫 source contract 完全一致。
- **證據邊界：** 這是 practice-only 的 interleaving / contrast Experience，不是 transfer assessment。完成 6 題不能升格為跨 family transfer、mastery、T2/T3 或 formal evaluation。
- **Validation：** PR #22 verify run #422 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `62d38c18bf688ac67fd6ac309150fe421e31b645`）。這只支持 interleaved contrast 的工程／Experience contract，不升格跨 family transfer 或學習成效。


## 2026-09-27 Change note｜直三首屏題幹／點擊回饋 regression fix

- **使用者可見問題：** 世界名型館直三首屏可能只看見右側棋盤，左側題幹卡被共享 `styles.css` 的 named `grid-area` 放進隱式欄位；畫面因此看似「沒有題目／答案」。
- **第二個互動問題：** 初始游標固定在 `[4,4]`，可能壓在已有棋子；已有棋子未帶 click 座標，且 cursor ring 會攔截 pointer event，因此使用者點綠圈可能完全沒有 feedback。
- **修正：** `classic-grid` 與名型 practice grid 明確宣告 `grid-template-areas:"question board"`；直三初始游標選可落子的非答案空點；已有棋子也帶座標 hit target；cursor ring 設 `pointer-events:none`；首屏明示「單題落子練習，不是自由對局」。
- **反證：** browser regression 必須實際開 `classic-shapes.html`，驗題幹與棋盤同時可見、點已有棋子立即顯示提示、錯答保留未揭名狀態、正答顯示成功 feedback 並揭示「直三」。
- **證據邊界：** 這是 learner-facing engineering／usability regression fix，不改 scoring、KC、scheduler、formal evaluation 或學習成效狀態。
- **Validation：** PR #23 verify run #425 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；新增 browser regression 已實際驗證題幹與棋盤同時可見、occupied click 有回饋、錯答不揭名、正答揭示「直三」。PR 已於 2026-09-27 squash merge 至 `main`（merge commit `66c48bc44dd41c1cdfa9280711d382f225d122d2`）。


## 2026-09-27 Change note｜直三四段探索 scope clarification

- **問題：** 世界名型館首段的「自己找急所／換個方向／換成攻方／相似但不同」視覺上像全域流程，但實際只由直三 `classic-stage-list` 驅動；刀把五、梅花五與混合辨形各有不同 variation contract。
- **修正：** 首段改標「直三專用 · 4 段探索」，四個 tab 都加上「直三」前綴，並在區塊說明「其他名型依各自 geometry／scoring contract 安排，不固定套用這四步」。
- **反證：** browser regression 讀取 `classic-stage-list`，必須得到四個帶「直三」前綴的 stage；靜態 contract 同時檢查 scope 文案與 aria label。
- **證據邊界：** 只修 learner-facing scope 與資訊架構，不改任何名型 scoring、variation semantics、learner evidence 或學習成效狀態。
- **Validation：** PR #24 verify run #429 全數 PASS：Node contracts、teaching gate verifier、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；browser regression 已實際讀取四個 stage，確認全部帶「直三」前綴。PR 已於 2026-09-27 squash merge 至 `main`（merge commit `cb42fb03051cc6a33430dc114ea898f80939c18a`）。


## 2026-09-27 Change note｜formal usability candidate fingerprint v1

- **Learning-loop / evidence bottleneck：** `TEACHING_GATE` 已要求正式三位 usability 在 frozen learner-facing candidate 上完成，但舊 verifier 只綁 R1 內容 fingerprint，無法阻止三位觀察跨 UI／runtime 版本彙總。
- **實作：** 新增 `formal-teaching-candidate.json`／`.cjs`，凍結五項 critical tasks 所依賴的 Core learner-facing asset set；目前 candidate `formal-teaching-candidate-2026-09-27-a` 的 fingerprint 為 `fnv1a32-js16-db5cff20`。CI 每次從工作樹重算，critical surface 改動後未重新凍結即 FAIL。
- **gate v2：** `go-formal-teaching-gate-v2` 與 `go-formal-teaching-evidence-v2` 要求 evidence root、usability summary、每位 participant、accessibility spot check 全部綁同一 candidate ID/fingerprint。
- **反證：** 舊 v1 evidence、任一 participant mismatch、accessibility mismatch、manifest stale fingerprint 均 fail closed；既有 participant denominator／critical-task negative tests 保留。
- **Migration：** 目前沒有正式真人證據，因此不做自動 migration；舊 evidence 必須回到原始觀察確認版本，不能只改 schema 字串。
- **證據邊界：** 這只證明 gate 能辨識 candidate 一致性；沒有因此取得 R1a、真人 usability、accessibility、formal evaluation 或 learning-effect 證據。目前正式教學仍 BLOCKED，真人 usability／accessibility 仍 NOT_TESTED。
- **Validation：** PR #25 verify run #433 全數 PASS：Node contracts、frozen formal teaching candidate 動態指紋、teaching gate v2、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。第一輪 negative test 曾抓到舊 v1 evidence 雖記錄 schema error 卻仍可能讓 usability/accessibility PASS 的 fail-open；verifier 已改為 evidence envelope 不合法即直接 fail closed。PR 已於 2026-09-27 squash merge 至 `main`（merge commit `8d9a3a4dbdcdc2e91fded8539ccc768165bc5d44`）。


## 2026-09-27 Change note｜R1 reviewer-visible fingerprint v5

- **Evidence-integrity bottleneck：** v4 fingerprint 綁定題號、版本、棋子、答案與 goal，但未包含 reviewer 實際看到的 `prompt`／`focus`，也未包含 `familyId`／`skillId`；若文字或圈選焦點改動但忘記 bump contentVersion，舊 receipt 仍可能被誤認為同一審查內容。
- **v5 contract：** fingerprint 現在涵蓋 `id/familyId/skillId/contentVersion/itemVersion/boardSize/type/pool/prompt/focus/stones/answer/goal`。blinded browser bank 仍只暴露 `id/prompt/focus/stones`，不洩漏答案、goal 或 scoring identity。
- **Protocol migration：** R1 protocol 升為 `go-r1-independent-content-review-v5`，目前 fingerprint 為 `fnv1a32-c34ef6a4`；review draft storage 隔離為 v5。舊 v4 receipt 必須 fail closed。
- **反證：** 單獨修改 prompt、focus、familyId、skillId、answer 或 goal 都必須改變 fingerprint；generated blinded bank 必須與 builder byte-for-byte 一致。
- **證據邊界：** 此修改只提高外部內容審查的版本可追溯性；R1a 仍待外部 reviewer 完成，R1b／真人 usability／learning effect 均沒有因此前進。
- **Validation：** PR #26 verify run #438 全數 PASS：Node contracts、deterministic R1 review bank rebuild、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；PR 已於 2026-09-27 squash merge 至 `main`（merge commit `5c5b9bced6b852d0051b234ba34e1b7fc6e6026e`）。


## 2026-09-27 Change note｜花六 / Rabbity Six bounded practice v1

- **Coverage bottleneck：** 世界名型館已有多語 catalog，但可實際落子作答的 family 仍過少；本輪不再增加 gate plumbing，改把一個來源與幾何較成熟、且不需 ruleset 特判的六點中手 family 升格為 practice。
- **幾何契約：** 新增 `classic-flower-six-vital-point-v1`。六個眼空必須與 Rabbity Six／花六幾何同構；共同急所由 eye-space adjacency graph 唯一 `degree=4` 點推導，不能靠固定座標。
- **Experience：** 四個 practice variant 涵蓋守方、攻方、旋轉、換色與位移；首答前不靠名稱提示，答對後才揭示「花六／Rabbity Six」。
- **名稱邊界：** catalog 將英文 `Rabbity Six` 與日文 `花六` 綁到同一已驗幾何 family；「葡萄六」仍保持獨立 `needs_review` candidate，不因中文俗稱相似而自動合併。
- **反證：** 非同構六點矩形、錯誤 vital point、位移後沿用舊座標都必須 fail；browser regression 實際驗錯答不揭名、正答才揭名。
- **證據邊界：** 只支持第一手共同急所 recognition。完整六目中手長變化、傳統「12 手」吃淨序列、mastery、transfer、T2/T3 與 formal evaluation 均未建立。
- **Validation：** PR #27 verify run #442 全數 PASS：Node contracts、deterministic R1 review bank rebuild、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；browser regression 已實際驗錯答不揭名、正答後揭示「花六／Rabbity Six」。PR 已於 2026-09-27 squash merge 至 `main`（merge commit `99a85cd3008bd5e86ad6f53302eb8602d1c70674`）。


## 2026-09-27 Change note｜金雞獨立 rules-backed tesuji practice v1

- **Coverage bottleneck：** 四個既有 playable family 仍以眼形／nakade 為主；下一步需要增加機制不同、又能由現有 rules engine 獨立驗證的 family，而不是繼續堆同類 geometry。
- **候選淘汰：** Tripod Group 的 GNU Go regression 可提供明確 oracle，但 GNU Go 明示 repository 檔案預設 GPLv3，且相關 SGF 無法在本輪確認為 public domain；因此撤回「把 tripod2 setup 搬進 MIT repo」的方向。盤角曲四／斗方／Long L／豬嘴／葡萄六仍各自卡在 ruleset、variation、外氣或 geometry gate。
- **新 contract：** `classic-golden-chicken-mechanism-v1` 不使用外部題圖。專案原創 setup 必須由 `go.js` 證明：著手前己串只有一路立這一氣；立後不提子且恰成兩氣；對手在兩側都因自殺禁著不能入；己方在任一側都能合法提兩子。
- **變形與反證：** 四題涵蓋黑／白、下／右／上邊；wrong geometry、合法但非正解的 first move、旋轉後沿用 seed 座標、item 偷塞 answer 都 fail closed。
- **來源用途：** Sensei's Library、中央棋院及既有華語術語來源只支持「金雞獨立」名稱與 double-shortage／不入機制；不把其圖片、題目座標或解答樹複製進 repository。
- **證據邊界：** 工程 PASS 只代表此原創 bounded mechanism contract 可重算；不代表外部內容審查、真人 usability、正式評量或學習成效通過。正式教學 gate 仍維持 `BLOCKED`。
- **Validation：** PR #28 initial verify run #445 全數 PASS：Node contracts、deterministic R1 review bank、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；此結果只支持工程／規則契約。


## 2026-09-27 Change note｜大豬嘴 / J Group exact source-case v1

- **選擇理由：** catalog-only 候選中，大豬嘴已有華語名稱、J Group 對照與經典「扳點死」多來源背景；更重要的是找到 MIT regression 可作 exact-position oracle，因此比需 ruleset-aware 的盤角曲四、需完整 variation tree 的斗方、受外氣影響的 Long L 更適合先增加 playable coverage。
- **不可升格部分：** MIT regression 只證明 `j_group_live2` 一個 source case 的 expected first move，不證明所有 J Group 都有相同第一手，也不能自行定義整個 family 的 canonical geometry。
- **Contract：** `classic-big-pigs-mouth-source-case-v1` 固定 19×19 board state；seed expected move 為 R1，三個 variant 只作 90°／180°／270° rotation。UI crop 不改 scoring identity。
- **Negative oracle：** wrong geometry、legal wrong answer、stale seed coordinate、answer injection 全部 fail closed。
- **Provenance／license：** `THIRD_PARTY_NOTICES.md` 記錄 `bood/go-test` commit、`config.yml`、`sgf/大猪嘴.sgf`、Copyright (c) 2018 Bood Qian 與 MIT License。
- **未驗：** 尚未建立標準大豬嘴 geometry、扳→點→立→撲 variation tree、獨立內容審查、真人 usability、formal assessment 或 learning effect。正式 teaching gate 不變。


## 2026-09-27 Change note｜丁四 / Pyramid Four bounded geometry practice v1

- **來源一致性：** Go4Go／YeeFan 對「丁四 ↔ Pyramid Four」一致；YeeFan 明確描述 T-shaped four-space eye 與中央急所；BGA nakade 系列把 pyramid four 當既定結構。
- **Canonical identity：** 四個空點的 T tetromino geometry，而非中文／英文名稱。跨語名稱只作 alias。
- **Scoring：** contract 由 degree map 推導唯一 degree-3 center；item 禁止攜帶 `vitalPoint`／`answer`／`correctMove`，避免題目與 scorer 共享答案副本。
- **變形：** 守／攻、黑／白、旋轉、位移；表面座標改變後必須重新依 geometry 找急所。
- **反證：** 直四 geometry fail、偷塞答案 fail、shifted variant 使用 seed coordinate 判錯。
- **未驗：** 完整吃淨 sequence、外部獨立審題、真人 usability、formal assessment、retention／transfer、learning effect。
- **Validation：** PR #30 initial verify run #450 全數 PASS：Node contracts、deterministic R1 review bank、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；此結果只支持工程／geometry contract。


## 2026-09-27 Change note｜世界死活名型館 ontology v2

- **改了什麼：** `classic-shapes-ontology.js` 成為 canonical data；`classic-shapes-catalog.js` 只負責舊 UI compatibility。新增 entity type、language-agnostic names ontology、geometry identity、ruleset behavior、negative mappings、dated negative name research 與 evidence chain。
- **為何現在改：** playable family 已增加到多種 ontology 類型，現行「中文主欄位＋aliases」開始把棋形、family、tesuji 與規則局面混成同一種 entry；繼續新增候選會放大錯誤 alias 與 regional preference 假設。
- **歷史語義：** existing practice/scoring item IDs、contract versions、答案、event semantics、KC、scheduler、formal evaluation 與 storage 都不 migration。舊 catalog UI 欄位暫時由 adapter 產生，因此歷史頁面與測試可漸進遷移。
- **負面 oracle：** 小豬嘴不得直接 alias Tripod Group；金雞獨立不得視為 static nakade；五目中手不得當刀把五唯一專名；Carpenter 簡繁轉字不得推成臺灣 regional preference。
- **Evidence Chain：** Go4Go 明示 Chinese Go Terms copy 自 YeeFan；兩者共用 evidence chain，不因兩個 URL 當成兩份獨立驗證。
- **Rollback：** 回復 ontology 前 catalog + HTML script ordering；無 learner/storage migration。
- **未驗：** regional usage、未完成 geometry、完整 ruleset scoring、外部內容審查、真人 usability、formal assessment、retention／transfer、learning effect。
- **Validation：** PR #31 initial verify run #454 全數 PASS：Node contracts、deterministic R1 review bank、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；此結果只支持 ontology migration／compatibility 工程契約。

## 2026-09-27 Change note｜世界死活名型館 ontology v3 relations

- **新增：** `nameAmbiguities[]`、`nameRelations[]`、`taxonomyMemberships[]`、`taxonomyRelations[]`、`geometryRelations[]`。
- **小曲尺：** 2007 臺灣英中術語鏈支持 Carpenter's Square → 小曲尺；另一中文教材把小曲尺描述為死棋；韓文 BadukWorld 則明確區分 Carpenter's Square 為劫、L Group 為死。故保留 `ambiguous_historical_mapping / geometry_required`，不把任一假說升格。
- **L Group：** 新增日文「隅のL字型」與韓文 `작은 됫박형` name records；仍沒有確認固定中文專名。
- **多 taxonomy：** BadukWorld 的 L／L+1／Long L／J 延伸系列只屬該教材 taxonomy；不取代英文／其他教材分類。
- **Geometry boundary：** L Group ↔ Carpenter's Square = `related_unresolved`。名稱或 taxonomy relation 不取得 geometry/scoring authority。
- **Migration／rollback：** practice/scoring/storage/evidence semantics 不變；回復 v2 ontology 檔與 asset version 即可，不需 learner data migration。
- **未驗：** 小曲尺 canonical geometry、L+1 的多 geometry 細分、Notcher／鎖型、Comb／Notcher taxonomy 的原始教材關係、真人 usability、formal assessment、learning effect。
- **Validation：** PR #32 verify run #459 全數 PASS：Node contracts、deterministic R1 review bank、frozen formal teaching candidate、teaching gate、JavaScript syntax、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功；此結果只支持 ontology v3 relation schema／compatibility UI 工程契約。


### 2026-09-27 Geometry fingerprint v1 validation

PR #33 verify run #465 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持 geometry normalization／evidence-state／compatibility UI 工程契約；小曲尺、L Group、Carpenter's Square 的 canonical geometry 仍未解。

### 2026-09-27 Geometry extraction gate v1 validation

PR #34 verify run #469 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持 extraction／rights／provenance gate 的工程契約；沒有因此取得任何外部 diagram／SGF 的重用權，也沒有解除小曲尺 geometry ambiguity。

### 2026-09-27 Reference-only geometry oracle v1 validation

PR #35 verify run #473 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持 non-shipping oracle／report sanitization／evidence-chain aggregation 契約；不代表任何 reference source 已成為 canonical geometry 或取得重用授權。

## 2026-09-27 Change note｜歷史探索採 read-only Explore surface

- **Johari 開放區：** 圍棋史研究能直接回答「為什麼是 19×19」「古人玩的是否和今天相同」「典故哪些是史實」等學習者自然會問的問題；目前首頁已是 Core 主 CTA＋Advanced 第二層入口。
- **Johari 盲點修正：** 不把前兩輪提出的 Learn／Understand／Explore 三分法做成三個等權首頁入口，也不把研究對話原文直接搬成教材。這會稀釋 Core 的零基礎主路徑，並把研究密度誤當教學密度。
- **最新判斷：** 新增獨立 `history.html`／`history.css`，以問題導向呈現「起源、19 路、規則演化、典故」四個 MVP 主題；證據標籤固定為確證、高度可信、有爭議、傳說、研究假說、未知。首頁只在主學習與教學方法之後提供低優先級 Explore 入口。
- **Authority boundary：** 歷史頁不載入 `app.js`、`scheduler.js`、`learner-progress.js`，不讀寫 localStorage，不建立 KC、mastery、T0–T3、formal evaluation 或 learner event；歷史證據標籤也不是 learner evidence taxonomy。
- **Formal usability candidate：** 因首頁 `index.html` 新增 History Explore 低優先級入口，舊 `formal-teaching-candidate-2026-09-27-a` fingerprint 不再適用；已重新凍結為 `formal-teaching-candidate-2026-09-28-a`。目前尚無正式三位 usability 證據，因此沒有舊證據可遷移或沿用。
- **反證／測試：** `tests/history.test.cjs` 驗證傳說與未知不被升格、孫策—呂範棋譜不被寫成三國 19 路硬證據、首頁仍只有兩張 Core／Advanced 主入口卡、歷史頁不接 learner runtime。release manifest 另把 `history.html` 列為靜態 entrypoint。
- **證據邊界：** 這是內容架構與歷史敘事工程 PASS 候選；不代表歷史內容已完成獨立學術同行審查，也不改正式教學 `BLOCKED`、formal evaluation unavailable、learning outcome `NOT_MEASURED`。


## 2026-09-27 Change note｜History Explore v2 內容證據與 accessibility 獨立審核

- **內容修正：** 將「19²−17²=72」與《棋經十三篇》的「外周七十二路」明確拆開；後者是 19 路外周交叉點數的宇宙論式解釋，前者只是現代算術差值，不得用來推論 17→19 路改盤原因。
- **claim-near evidence：** 17 路改接到《文選》李善注所引邯鄲淳《藝經》；規則史加入《敦煌棋經》公開轉錄的「子多為勝」並與 IDP 手稿身份分工；巡將棋以 KCI 制度史＋British Go Association 起始配置分開支撐；孫策／呂範改用《太平御覽》所引《江表傳》支撐對弈敘事；原爆棋改用日本棋院 100 週年專頁支撐再開與終局時間。
- **來源邊界：** 古籍 URL 只證明現存傳世文本／引文如何記載，不自動證明故事是事件同期紀錄；手稿目錄、現代轉錄、制度史與實際規則復現各自只在其 evidence scope 內使用。移除未實質支撐頁面主張的唐代棋子材料來源。
- **Accessibility：** 修正品牌副標、題號、比較表頭、頁尾四組小字低對比配色；新的配色在其實際背景上均高於一般文字 4.5:1 門檻。
- **Browser regression：** Windows browser UI suite 現在直接導航 `history.html`，驗證四個主題、六種 evidence label、來源查核日期、零 runtime script，以及桌面／375px 行動版無水平溢出與單欄重排。
- **Candidate boundary：** 本輪只改 `history.html`／`history.css` 與測試／文件；這些不在 `formal-teaching-candidate.json` 的 Core critical asset set，因此 `formal-teaching-candidate-2026-09-28-a` 不需重凍結。
- **狀態：** 歷史內容工程、claim-near source fit、自動 accessibility contract 與 browser regression 為 **PASS**。PR #37 final verify run #487 全數 PASS；squash merge `afe2e39b855beb9bc680523ae34c1de20dac8e1c` 後 main verify run #488 亦全數 PASS，GitHub Pages deployment run #378 成功。外部歷史學術同行審查、正式 novice usability、真人 accessibility 與 learning effect 仍分別保持 NOT_REVIEWED／NOT_TESTED／NOT_TESTED／NOT_MEASURED。由於本執行環境對公開 Pages 網域 DNS／web fetch 不可達，部署後的獨立 HTTP 內容抽查標為 UNKNOWN；不以工具網路限制覆寫 GitHub Pages deployment PASS。


## 2026-09-27 Change note｜History Explore v3 Johari blind-spot audit

- **Johari 開放區：** v2 已正確把歷史閱讀層與 learner state／正式評量分離，也已把 17→19 路、典故與來源層級收斂到 claim-near evidence；formal teaching 仍維持 `BLOCKED`。
- **Johari 盲點區：** v2 contrast regression 只抽查四個已知 selector，不能代表其餘小字／badge；≤420px header 會隱藏 Advanced 連結，而頁底原本也沒有 Advanced CTA；Pages workflow success 只能證明部署工作完成，不能證明公開 URL 已供應本次內容。
- **Johari 隱藏區：** 來源清單仍有一個泛用 CText 首頁入口，和「只保留實際支撐 learner-facing claim 的來源」規則不完全一致；已改為《孟子》《博物志》傳說鏈與《世說新語》直達頁。
- **實作：** History Explore 升 v3；helper text 增加 contrast safety margin；browser UI 直接以 computed style 掃描歷史頁小字與六類 evidence badge 的實際前景／背景，要求 contrast ratio ≥ 4.5；375px 驗證頁底 Advanced CTA 可見；`prefers-reduced-motion: reduce` 以 browser emulation 驗證 `scroll-behavior:auto`。
- **部署驗證：** 新增 `.github/workflows/pages-smoke.yml`。Pages deployment 成功後，對 manifest 的正式 Pages URL 讀取 `index.html` 與 `history.html`，以 cache-bust＋retry 驗 History v3、72 因果修正、來源查核日期與 Advanced CTA。此 gate 只驗 served artifact，不升格為 usability、內容效度或學習成效。
- **Candidate boundary：** `history.html`／`history.css`／release workflow 不在 formal candidate critical asset set，首頁 learner-facing critical assets 未變，因此 candidate `formal-teaching-candidate-2026-09-28-a` 不重凍結。
- **未知區保留：** 外部歷史專業審查與真人鍵盤／螢幕閱讀器 accessibility 仍為 NOT_REVIEWED／NOT_TESTED；新增自動檢查不替代真人證據。


### 2026-09-27 Correction｜post-deploy trigger implementation

- 初版 v3 嘗試用獨立 `workflow_run` 監聽 GitHub 動態 `pages build and deployment`。實際 main deployment #380 成功後沒有觸發該 workflow，因此此路徑判定 **FAIL**，不能把「workflow 檔存在」當作 served-content gate 已成立。
- 修正：刪除獨立 `pages-smoke.yml`，把 `served-pages-content` job 併入既有 `verify.yml`；只在 `main push` 執行，且需等 Node／Sabaki／Windows UI jobs 成功後再輪詢正式 Pages URL。
- gate 最多 12 次、每 10 秒重試，使用 cache-bust query，驗首頁 History 入口與 History v3／72 修正／來源日期／Advanced CTA。
- 此修正只建立 deploy artifact → served content 的工程證據鏈；若公開 URL 因外部網路或 DNS 長期不可達，job 必須 FAIL，不得自動降級為成功。


### 2026-09-27 Final validation｜History Explore v3 Johari audit

- PR #39 verify run #491：Node contracts、formal candidate、teaching gate、Sabaki oracle、Windows file-URL UI（含 rendered small-text contrast／375px Advanced CTA／reduced-motion）、Edge smoke、repository boundary 全數 PASS。
- PR #39 squash merge：`83baa65e57c00c7f5879c30dcb15fade530fb2ee`；main verify #492 PASS；Pages deployment #380 PASS。
- 初版獨立 `workflow_run` served-content smoke 未被 deployment #380 觸發，已明確記為 FAIL 並撤回；不能把 workflow 檔存在當成功證據。
- PR #40 verify #493：既有 jobs 全 PASS、served-pages-content 在 PR 上依設計 SKIPPED。PR #40 squash merge：`07649651263b785af319e14902d6baeb74e07586`。
- main verify #494：Node、Sabaki、Windows UI／Edge／boundary 以及新的 `served-pages-content` 全數 PASS；Pages deployment #381 亦 PASS。
- `served-pages-content` 的 GitHub-hosted runner 實際讀回 `https://huikai.com.kg/vt-cos-go-learning/index.html` 與 `history.html`，確認首頁 History 入口、History v3、72 因果修正、來源查核日期與 Advanced CTA 均已公開供應。因此「served content 已更新」在工程部署層由 UNKNOWN 升為 **PASS**。
- **仍未升格：** 外部歷史專業審查 NOT_REVIEWED；formal novice usability NOT_TESTED；真人鍵盤／螢幕閱讀器 accessibility NOT_TESTED；formal teaching BLOCKED；formal evaluation BLOCKED／unavailable；learning effect NOT_MEASURED。


## 2026-09-27 Change note｜R1a external reviewer handoff

- **Bottleneck：** Step 4 verifier／blinded bank 已完成，但外部 reviewer 原本只能直接進 77 題頁或 repository 文件，增加先看到答案／機器結果而破壞 answer-blind 的操作風險。
- **實作：** 新增 `r1-review-start.html`，固定 `go-r1-independent-content-review-v5`、content fingerprint `fnv1a32-c34ef6a4`、77 題母體與三項獨立性前提；只連到去答案 `r1-review.html`。
- **反證：** test 會要求 handoff protocol/fingerprint 與 verifier 同步，且不得載入 Phase 2 答案模組或出現 answer/scoring 欄位；served-content gate 也會直接讀公開 handoff。
- **真人模板修正：** `formal-teaching-evidence.example.json` 從 stale candidate `-a` 修到 current `-b` / `fnv1a32-js16-2d1aa93b`，並新增同步測試。
- **狀態：** R1a 執行條件 = **READY_FOR_EXTERNAL_REVIEW**；R1a 證據本身仍 **AWAITING_EXTERNAL_RECEIPT**。沒有外部回條前，不升格內容效度、正式教學或正式評量。


### 2026-09-28 Bent Three bounded practice validation

PR #43 verify run #499 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持曲三 geometry-derived first-move contract；不建立完整答案樹、內容效度、formal assessment 或 learning effect。

### 2026-09-28 Four-space status proof validation

PR #44 verify run #505 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持 sealed eye-space 的方四 dead／直四 alive 有限規則 proof 與狀態 UI；不外推所有實戰四點眼空。

### 2026-09-28 Curved Four status proof validation

PR #49 verify run #510 全數 PASS：Node contracts、JavaScript syntax、deterministic R1 review bank、formal teaching candidate、teaching gate、Sabaki SGF oracle、Windows file-URL UI、Edge smoke、repository boundary 均成功。此結果只支持 sealed interior Curved Four 的 rules-backed alive proof 與 status contrast；不涵蓋盤角曲四或其他 ruleset-sensitive corner positions。

## 2026-09-28 Change note｜History Explore v4 精準證據升級

- **Bottleneck：** v3 的 17→19 主線仍以後世文字錨點開場，漏掉河北望都一號漢墓 132 年 17 路石棋盤；南朝棋手品評、棋書編纂與 corpus loss 未進 learner-facing 主線；「找不到早期 17 路實戰局面」若寫成無限定負面主張會違反 open-world evidence 原則。
- **實作：** `history.html` 升 v4。望都改作 P0 物質錨點，措辭固定為「有明確墓葬年代與考古出土脈絡」，不寫「原位」或「已知最早」；南朝改寫為「相當成熟的宮廷棋手品評與棋書編纂活動」，以《南齊書》圍棋州邑、柳惲品定 278 人與《隋書·經籍志》棋書／亡佚三點支撐；《讀曲歌》降為 details 補充，不將「方局十七道」精確綁定 440 年。
- **Continuity：** 新增敦煌「角旁曲四，局竟乃亡」與後世《棋經十三篇》「角盤曲四，局終乃亡」對照，並保留征／劫／持術語再現；只支持技術分類／術語在後世再次出現，不建立不中斷 transmission chain。
- **Unknown boundary：** 新卡固定寫「目前查核範圍內，尚未確認可可靠重建的早期 17 路實戰局面」，並明示這是資料缺口、不代表證據不存在；失傳棋書只支持 corpus loss，不補寫 17→19 因果答案。
- **Synthesis：** 主線改成「先秦成熟弈文化 → 132 年 17 路實物 → 5～6 世紀品評／編纂＋文獻亡佚 → 595 年 19 路實物 → 盤制逐漸收斂但其他規則未同步統一 → 若干棋形判定／技術術語後世再現」。此排列是 Claim Ladder 的 evidence sequence，不是單一因果鏈。
- **Authority／candidate：** History Explore 仍是 read-only Explore surface，不接 learner state、KC、scheduler、T0–T3 或 formal evaluation；未修改首頁與 Core critical asset set，因此 `formal-teaching-candidate-2026-09-28-a` 不重凍結。正式教學維持 `BLOCKED`、formal evaluation unavailable、learning effect `NOT_MEASURED`。
- **Validation target：** `tests/history.test.cjs` 新增望都、制度化措辭、Lost Corpus、角曲四 continuity、scoped negative 與《讀曲歌》斷代反證；browser UI 與 served Pages marker 同步到 History v4／2026-09-28。工程測試通過只支持內容契約與部署一致性，不等於外部歷史學術同行審查。


## 2026-09-28 Decision note｜Comb Formation / Notcher 分離建模

- **Bottleneck：** Ontology v3 已能保存名稱歧義與多套 taxonomy，但 `Comb Formation / 梳形 / 櫛形` 與 `Three-Space Notcher` 尚未成為可機讀的獨立 concept；若只把它們塞進 aliases，會把名稱映射、教材 taxonomy 與 geometry 關係混成同一件事。
- **本輪改動：** ontology 升為 `classic-shape-ontology-v4`，新增 `comb-formation-v1` 與 `three-space-notcher-v1`。Comb 保存繁中「梳形」、日文「櫛形」、韓文 `빗형` 與詞典型 `판륙`；韓文不同術語並存，不用單一 canonical 翻譯覆蓋來源差異。
- **Taxonomy 邊界：** `Comb → Three-Space Notcher` 只以二手 Davies 讀書筆記保存為 `SPECIALIZED_RELATED_SHAPE` 的 source-specific relation；不新增 geometry relation，不宣稱 global parent/variant。
- **負面映射：** `鎖型 = Three-Space Notcher` 目前缺直接跨語或 geometry evidence，因此列為 blocked pending evidence；不得由名稱直覺自動 alias。
- **Geometry stop line：** Comb 與 Notcher 只新增 `text_only_geometry_unavailable` evidence。未經 rights/extraction/fingerprint gate 前，不保存來源衍生座標、不開 playable scoring。
- **Evidence independence：** BadukWorld 的 YeeFan 術語鏡像與 YeeFan 本體共用同一 `evidenceChain`，不得因不同 URL 灌成兩份獨立支持。
- **不可破壞 invariant：** learner events、first response、KC、scheduler、storage schema、T0–T3、formal evaluation 與既有 scoring contracts 全部不變。
- **Rollback：** 回復 ontology v3／geometry evidence v2／catalog v17 與對應 cache version 即可；不需 learner data migration。
- **驗收：** 反證測試必須證明 Comb/Notcher 不互為 alias、`鎖型` 不進 Notcher names、taxonomy relation 不產生 geometry relation、text-only evidence 沒有座標；正式 teaching/evaluation 狀態不得因此升格。


## 2026-09-28 Decision note｜Ontology v5：小曲尺先升為中文 candidate concept，不假裝跨語 exact

- **新證據訊號：** 中文來源不只存在舊詞表 `Carpenter's Square → 小曲尺`；另有教材把「小曲尺」直接當基本死活型並稱其為死棋、以「曲尺型」系列描述最小型，以及用「小曲尺長大的故事」組織延伸教學。這些來源支持『中文自身存在小曲尺教學概念』，但不提供足以重建 canonical coordinates 的可重用 geometry。
- **Schema 修正：** 新增 `small-curved-ruler-candidate-v1`，entity type 為 corner life/death family candidate。`小曲尺` 在此 concept 內是中文 established teaching name；舊詞表在 Carpenter concept 上仍保留 `UNKNOWN` historical mapping，避免抹除歷史來源。
- **Ambiguity v2：** `小曲尺` 候選從二選一改成三方：中文 candidate / `Carpenter's Square` / `L Group`。這是更保守的 open-world modeling，不宣稱三者同形或 parent/variant。
- **中文 `曲尺`：** Go4Go/YeeFan 既有術語鏈把不帶『小』的 `曲尺` 對應 Carpenter's Square；v5 將其補入 Carpenter concept，與 `小曲尺` 分開保存。
- **Geometry stop line：** 新增來源一律 `text_only_geometry_unavailable`，`points=null`、`publicGeometryPromotion=reference_only_no_geometry`。未通過 rights/extraction/fingerprint gate 前，不產生 geometry fingerprint、不開 scoring。
- **Taxonomy ≠ identity：** `曲尺型系列` 與 `小曲尺延伸教學` 只作 source-specific taxonomy membership。『最小型』『長大的故事』不能自動證明 L Group variant 或 Carpenter subset。
- **Rollback：** 回復 ontology v4／geometry evidence v3／catalog v18 與 asset query versions；無 learner data migration。
- **Validation：** tests 必須證明小曲尺不含 L/Carpenter exact alias、三候選 ambiguity 存在、所有新增 evidence 無座標、沒有 scoring/mastery/formal authority。

## 2026-09-28 Change note｜History Explore v5 證據型態與近現代轉折

- **Bottleneck：** v4 已補齊早期盤制、Lost Corpus 與技術術語再現，但主線仍容易讓讀者把「留下更多材料」「規則正式成文化」「棋理／戰略觀念改變」視為同一種歷史進程。
- **實作：** `history.html` 升 v5，但仍維持四個核心問題不變；新增一個三卡片的「證據與觀念的轉折」區塊，只納入三個高壓縮節點：北宋《忘憂清樂集》作棋譜／棋書 corpus 的證據型態轉折、1949→1989 日本圍棋規約作近現代規則成文化與修訂錨點、1933→1934 新布石作戰略理解快速變化案例。
- **Evidence boundary：** 《忘憂清樂集》只支持可研究棋譜／局面材料的存在，不替書中每盤古局 attribution 背書；1949／1989 只描述日本規則史，不推成全球規則統一；新布石只描述戰略觀念變化，不寫成規則改制。
- **Compression gate：** 不新增御城碁、名人年表、世界冠軍史、AI 時代等素材；它們可留待 details／專題頁，避免 History Explore 退化成一般編年史。
- **Authority／candidate：** History Explore 仍是 read-only Explore surface，不接 learner state、KC、scheduler、T0–T3 或 formal evaluation；未修改 Core critical asset set，因此 formal teaching candidate 不重凍結。正式教學維持 `BLOCKED`、formal evaluation unavailable、learning effect `NOT_MEASURED`。
- **Validation target：** 新增 History v5 regression，分別反證 corpus attribution 過度推論、1949／1989 全球化誤讀、新布石＝規則改制等錯誤；browser 與 served Pages marker 同步 v5。工程通過只支持內容契約與部署一致性，不等於外部歷史學術同行審查。


## 2026-09-28 Change note｜首頁棋盤視覺改為 deterministic SVG

- **問題：** 首頁原本以文字與卡片為主，視覺節奏弱；先前生成的整頁 mockup 與棋盤 PNG 只能作設計參考，直接上線會把文字與棋形一起 rasterize，也無法可靠保證棋盤位置、落子與響應式重排。
- **改動：** `learner-flow-v47` 不再把生成式棋盤 PNG 當正式首頁資產。Hero 以 inline SVG 精確呈現「中央白棋最後一口氣」局面；核心課程三階段各有一致的小棋盤視覺；學習證據區由三格擴成「第一次自己作答 → 隔一段時間再做 → 換新棋形 → 仍能自己判斷」四格。
- **Authority：** 棋盤交叉點、棋子與標記由 deterministic HTML/SVG 明確定義；生成圖只保留為視覺探索，不取得 rules/scoring authority，也不進正式題庫或 formal evaluation。
- **不可破壞 invariant：** 不改 item／KC／scoring、first response／retry、scheduler、storage schema、holdout 曝光、formal evaluation、live eligibility／scoring 或 evidence taxonomy。
- **反證／驗收：** 需要檢查首頁 root 與 `#core` routing 不變、375px 無橫向溢出、SVG 不攔截鍵盤與 CTA、四格學習證據文字仍可讀。自動測試只證明介面契約，不證明圖片讓真人更容易理解。
- **證據邊界：** 正式教學仍 `BLOCKED`；formal evaluation 仍不可用；learning effect 仍 `NOT_MEASURED`。


## 2026-09-28 Correction note｜v47 首頁視覺過度改版回復為最小配圖

- **修正前提：** v47 把「加入既定圖片」誤做成新的首頁資訊架構：Hero 右側被拆成棋盤卡＋步驟卡，學習證據由三項擴成四項，超出原任務範圍。
- **修正：** `learner-flow-v48` 回到 v46 的首頁結構與文案。Hero 保留原本四步 `看懂 → 落子 → 回饋 → 換新棋形`；「怎樣才算真的學會」恢復三項；核心課程仍是原本三張卡。只在 Hero 右側同一面板上方加入一張棋盤插畫，並在三張課程卡各加入一張小棋盤插畫。
- **資產：** 四張插畫拆成 `assets/homepage/*.svg` 獨立檔案，沒有把整頁 mockup 當圖片，也沒有把圖片當 rules/scoring 真值。四個資產已納入 formal candidate fingerprint，避免未來只換圖片卻繞過 candidate 版本。
- **不可破壞 invariant：** 不改 item／KC／scoring、first response／retry、scheduler、storage schema、holdout 曝光、formal evaluation、live eligibility／scoring 或 evidence taxonomy。
- **驗收：** 回歸測試必須確認首頁仍有 4 個 Hero 步驟、3 個 learning-evidence card、3 個課程階段、375px 無橫向溢出，以及 root／`#core` routing 不變。
- **證據邊界：** 這是視覺與資訊架構修正；正式教學仍 `BLOCKED`，formal evaluation 仍 `BLOCKED`，learning effect 仍 `NOT_MEASURED`。


## 2026-09-28 Correction note｜v49 使用前面已確認的原生成配圖

- **掃描結果：** 前面已確定的視覺方向是「現代棋譜編輯插畫」：暖米白、墨綠、暖金、木質棋盤、少量有教學功能的棋盤視覺；Hero 使用完整「棋盤＋四步流程」插畫，三個課程階段各一張棋盤縮圖，「怎樣才算真的學會」維持既有三項並各配首次作答／延後再做／新棋形插畫。整頁 mockup 只作方向稿，不直接嵌入。
- **v48 缺口：** 雖已恢復原資訊架構，但仍使用另外重畫的簡化 SVG，因此質感、比例、棋盤表現與已確認生成稿不一致。
- **v49 修正：** 正式改用前面實際生成的獨立圖，轉為壓縮 WebP。Hero 圖保留棋盤與「看懂／落子／回饋／換新棋形」流程，並裁掉未經 rules-backed 驗證的手寫棋理句；三階段與三項學習證據圖只作 learner-facing illustration，不取得 rules／scoring authority。
- **結構 invariant：** Hero 主文、CTA、Core／Advanced 入口、三張課程階段卡、三張 assessment card、root／`#core` routing 均不改；不得新增第四個 assessment card。
- **candidate：** `formal-teaching-candidate-2026-09-28-e`；asset set version 3；7 個 WebP 納入 binary-safe candidate fingerprint。
- **證據邊界：** 正式教學仍 `BLOCKED`；formal evaluation 仍 `BLOCKED`；learning effect 仍 `NOT_MEASURED`。


## 2026-09-28 Decision note｜Reference oracle v2：comparison contract 成為聚合前提

- **發現的盲點：** 同一名型可用 defender stones、eye-space、全局部 stones 等不同 representation 描述。若 report 只記 candidateConceptId，兩條來源即使比較不同 representation，也可能被 aggregation 錯算成一致。
- **修正：** `classic-geometry-reference-oracle-v2` 要求 metadata/report 必含 `comparisonContractId`。聚合前必須同時一致：`candidateConceptId`、`comparisonContractId`、`requireContext`；任一不同直接 `INVALID`，不計 independent support。
- **HTML→SGF adapter：** `classic-reference-html-sgf-v1` 只解析已取得 HTML 中的 JSON-string embedded SGF，不 eval JavaScript；目前固定 `corner-defender-connected-group-v1`，只表示比較角部 defender connected group，不表示這就是 L Group canonical identity。
- **Rights boundary：** 外部 HTML/SGF 只作 `reference_only` memory observation；不把第三方 SGF、points、fingerprint 或 raw observation 寫入 public repo，`canonicalPromotionAllowed=false`。
- **停止線：** 若後續研究發現應用 eye-space 或其他 representation，必須建立新的 comparison contract；不得與既有 defender-group reports 混合聚合。


## 2026-09-28 Decision note｜第一份真實 L Group source receipt 已取得，但 geometry comparison 仍 BLOCKED

- **實際 source capture：** 一次性 research workflow 在 GitHub Actions 取得 Tsumego Hero `The L Group 32/46` 題目頁，頁面主張為 `Black to kill`；embedded SGF 出現兩次且內容一致，root setup 可 deterministic parse。來源 HTML digest 固定為 `sha256:157f93c970c1c38fe18faa06c90c8814700d87e0710e93e5c96467065efbe398`。
- **持久化邊界：** main 只保存 `classic-reference-source-receipt-v1`；不保存第三方 HTML、SGF、stones、points、shape/context signature、fingerprint 或 raw observation。rights 維持 `unknown_reference_only`，`canonicalPromotionAllowed=false`。
- **重要 BLOCKED：** receipt 的 `comparisonContractId=null`、`geometryRepresentation=unassigned`。原因不是 parser 缺功能，而是 `l-group-v1` 尚無經驗證的 canonical geometry representation；不得為了得到 MATCH 而先假定 defender stones、eye-space 或 full-position 哪一種就是 L Group identity。
- **Evidence independence：** 同一 Tsumego Hero collection 252 的其他 45 題仍屬同一 evidence chain，不可拿另一題湊成第二條獨立 evidence unit。
- **第二來源查核：** GNU Go 的公開文件只在 suite 層說 L groups 有相當 regression coverage；目前查到的 `ld*.sgf` 沒有足以把特定檔案直接標成 L Group 的 provenance，因此暫不計為第二條 geometry evidence chain。
- **下一個解除條件：** 找到一個來源直接把具體 diagram/SGF 與 L Group identity 綁定，且 representation 可明確定義；或先建立經獨立來源支持的 L Group comparison contract。未達成前不產生 MATCH/DIFFERENT report。


## 2026-09-28 Decision note｜BGA Figure 1 直接 source-to-concept 鏈已找到，geometry extraction 仍 BLOCKED

- **第二條獨立 documentary chain：** British Go Journal 116 的 Richard Hunter〈Counting Liberties: The L group〉正文直接指出 Figure 1 是 L group，並明述該角部黑棋即使先手也不能活。這比索引層級更強，因為名稱與具體 Figure locator 已直接綁定。
- **尚未升格成 geometry evidence：** 本輪 PDF screenshot 讀取因工具 cache miss 失敗，因此沒有從 Figure 1 擷取或猜測任何座標；也沒有建立 `comparisonContractId`。不得用文字描述取代 diagram geometry。
- **Evidence separation：** Tsumego Hero receipt 與 BGA Figure 1 現在是兩條獨立 source-to-concept 鏈，但只有前者已 deterministic parse embedded SGF；兩者仍不是兩份可聚合的 decisive reference-oracle reports。
- **下一個解除條件：** 對 BGA Figure 1 做 rights-safe reference-only structured observation，並先確認與第一來源採同一 geometry representation contract；若 representation 不同，禁止聚合。


## 2026-09-28 Change note｜v50 以已確認 mockup 作首頁版面基準

- **目標行為：** 第一張 mockup 正式成為首頁 desktop information architecture / visual hierarchy 基準；文字、路由與產品能力仍以目前 repo current truth 為準。
- **改動：** Hero 左文右圖比例拉回 mockup；桌面 header 新增「課程特色／學習路徑／常見問題」錨點導覽；移除重複的 Core／Advanced 兩張入口區，改由「基礎建立／局部與棋局判斷／全局與綜合應用」三張卡直接承擔入口；學習循環改成 mockup 的四格；研究設計保留四張動作卡；歷史與完成後能力改成雙欄；新增由既有內容整理的 FAQ。
- **路由：** 基礎建立沿用核心課程 CTA；局部判斷連到既有 `advanced.html` practice-only 頁；全局綜合入口可直接開核心第 11 單元，仍走既有 Core workspace 與 lesson-intro lifecycle。
- **Evidence invariant：** 第 4 格「仍能自己判斷」標記為 `data-evidence-role="summary"`，只總結首答／延後／新棋形三條既有證據，不建立第四種 evidence、mastery、KC 或 scoring 語義。
- **反證／驗收：** 首頁不得再出現重複 `.course-entry-grid`；桌面三入口、四格循環、375px 單欄無橫向溢出；`data-site-intro-unit="10"` 必須進 `#core` 並選中第 11 單元；Advanced 仍保持獨立 practice-only。
- **candidate：** `formal-teaching-candidate-2026-09-28-f`，fingerprint `fnv1a32-js16-bbbe09bc`，asset set version 4；第四張 learning-cycle WebP 納入 frozen surface。
- **證據邊界：** 正式教學仍 `BLOCKED`、formal evaluation 仍 `BLOCKED`、learning effect 仍 `NOT_MEASURED`；mockup 對齊與 CI PASS 只支持 learner-facing 工程契約。

## 2026-09-28 Change note｜首頁 Hero 無字棋盤主視覺

- **變更：** 保留既有首頁資訊架構、主標題、CTA、四步學習流程與三階段入口，只替換 `assets/homepage/hero.webp` 為無內嵌文字的棋盤編輯式插畫；`index.html` 同步修正圖片尺寸與中性替代文字。
- **目的：** 讓首頁標題與按鈕仍由 HTML 承擔語意與響應式排版，圖片只負責建立「先觀察棋形，再落子」的視覺情境，避免圖片文字與頁面主標題重複。
- **Authority boundary：** 圖中的棋盤與金色標記是概念視覺，不作 rules engine、scoring contract、答案、KC、scheduler、learner state 或 formal evaluation 真值。
- **Formal candidate：** critical learner surface 因 Hero 資產與其 HTML metadata 改變，重新凍結為 `formal-teaching-candidate-2026-09-28-h`，fingerprint `fnv1a32-js16-1e54e467`；事件 `ui_version` 維持 `learner-flow-v50`，因本輪沒有改作答、事件或排程語義。
- **證據邊界：** 此變更只支持首頁視覺資產已更新；是否更容易理解、是否提高開始課程率或學習成效均尚未由真人證據驗證。正式教學仍 `BLOCKED`，學習成效仍 `NOT_MEASURED`。

## 2026-09-28 Change note｜Hero 圖片 cache-busting

- **問題：** 新 Hero 已部署，但部分手機瀏覽器仍沿用舊的 `assets/homepage/hero.webp` 快取，因此使用者看到的仍是舊版四步文字 Hero。
- **最小修正：** 不改圖片內容與首頁資訊架構，只把 Hero URL 改為 `assets/homepage/hero.webp?v=hero-textfree-v1`，讓瀏覽器視為新資源請求；同步更新 UI regression 對該 URL 的斷言。
- **Formal candidate：** `index.html` 屬 critical learner surface，因此重新凍結為 `formal-teaching-candidate-2026-09-28-i`，fingerprint `fnv1a32-js16-04a05a28`；事件 `ui_version` 保持 `learner-flow-v50`，因作答、事件與排程語義未變。
- **證據邊界：** 此修正只處理前端資產快取一致性，不證明真人理解、可用性或學習成效；正式教學仍 `BLOCKED`，學習成效仍 `NOT_MEASURED`。

## 2026-09-28 Change note｜首頁 Hero 改用使用者提供 PNG

- **變更：** 依當輪使用者明示要求，首頁 Hero 從 `assets/homepage/hero.webp` 改為 `assets/homepage/hero.png`；正式資產使用其提供圖片的 960×720 PNG 版本，HTML 維持 4:3 顯示比例，並同步更新 UI regression 與 formal candidate critical asset 清單。
- **Authority boundary：** PNG 內含「看懂／落子／回饋／換新棋形」以及手寫「這步提子，因為已經沒有氣了」。這些是 learner-facing 插畫文字；本輪沒有用 rules engine 重建該圖片棋形，也沒有把手寫句升格為 scoring、答案、KC 或 formal evaluation 真值。若日後要把該棋形當正式教學答案，需另走內容／棋理驗證。
- **Formal candidate：** asset set 升至 v5，重新凍結為 `formal-teaching-candidate-2026-09-28-j`，fingerprint `fnv1a32-js16-59c14d2e`；事件 `ui_version` 維持 `learner-flow-v50`，因作答生命週期、事件與排程語義未改。
- **證據邊界：** 此變更只支持指定 PNG 已成為首頁 Hero；是否更易理解、內容棋理是否完全正確、是否改善開始課程率或學習成效均未由本輪證據驗證。正式教學仍 `BLOCKED`，學習成效仍 `NOT_MEASURED`。


## 2026-09-28 Change note｜Global Go Observatory v0.1

- **Johari 修正：** 上一輪「研究資料適合上網站」方向成立，但原判斷沒有先處理兩個盲點：首頁已屬 frozen formal-usability critical surface；Research Evidence 也不能因公開展示而取得 learner runtime authority。故不把大量研究資料塞入首頁，也不新建 Research DB。
- **實作：** 新增獨立 `global-go-observatory.html`／`global-go-observatory.css` 與 `research/global-go-observatory-v1.md`。首頁只新增「全球觀察」導覽入口，UI 升至 `learner-flow-v51`。第一版以 EGD 2025 annual active players 作同源排名；不同定義的中國、韓國、日本、臺灣、新加坡、泰國、法國與馬來西亞改用資料卡，逐筆保留來源類型、年份與限制。
- **不可破壞 invariant：** 研究頁不載入 learner runtime；不改 learner state、KC、scoring、scheduler、first response／retry、event schema、evidence taxonomy、formal evaluation 或題目資格。馬來西亞現行全國人口維持 `UNKNOWN`，不以 2016 舊估計冒充 2026。
- **驗證契約：** `tests/global-go-observatory.test.cjs` 檢查口徑分離、UNKNOWN fail-closed、來源 locator 與 Research→Teaching 不升格；release manifest／served-content gate 同步覆蓋新入口。首頁 critical surface 因導覽改動重新凍結為 `formal-teaching-candidate-2026-09-28-i`（`fnv1a32-js16-54e6c884`）。
- **證據邊界：** 網站公開只代表研究資料已按目前來源整理與可追溯，不證明全球人口統計完整，也不改正式教學 `BLOCKED`、正式評量 `BLOCKED`、學習成效 `NOT_MEASURED`。


## 2026-09-28 Change note｜M2 Learning Workspace / Course Navigation

- `learner-flow-v53` 將目前課程位置、單元瀏覽、今日入口與進階工具分層；桌面保留 sidebar，375px 將課程目錄收合到「課程與單元」。
- 選擇 Unit 只改變瀏覽中的課程目錄，不改目前 lesson、題目或 learner event；只有點選實際 lesson 才切換學習內容。
- 到期複習／錯題只有非零時才出現在 sidebar 的「今天」區塊；不以 0 題製造假的今日任務。
- 此變更不修改 scoring、first-response/retry、scheduler policy、storage/event schema、evidence taxonomy 或 formal evaluation masking。正式 usability 仍 NOT_TESTED；正式教學仍 `BLOCKED`；學習成效未量測。

## 2026-09-28 Correction note｜三階段入口重新對齊 Core 1–15

- **問題：** 首頁「局部與棋局判斷」卡標示為原課綱單元 6–10，實際按鈕卻導向獨立的 `advanced.html`。這把 Core 課程階段與 Core 後續進階路線混成同一入口，與「Advanced 不屬於單元 1–15」的既有契約衝突。
- **修正：** 三張卡全部只導向 Core：基礎建立 → Core 起點；局部與棋局判斷 → 第 6 單元（`data-site-intro-unit="5"`）；全局與綜合應用 → 第 11 單元（`data-site-intro-unit="10"`）。Advanced 保留為獨立 practice-only 路線，首頁改由課程數量說明中的次要連結提供。
- **反證／驗收：** UI regression 實際點擊第 6 與第 11 單元入口，確認都進入 `#core`、選中正確單元並開啟該單元短講；另確認首頁仍可到達 `advanced.html`，但該連結不在三階段卡內。
- **不變範圍：** 題目、scoring、scheduler、first response／retry、event schema、KC、evidence taxonomy、learner state 與 formal evaluation 語義不變。這只修正資訊架構，不證明真人更容易選對入口。
- **Formal candidate：** learner-facing critical surface 改變，重新凍結為 `formal-teaching-candidate-2026-09-28-m`，fingerprint `fnv1a32-js16-0314dd59`；UI version 維持 `learner-flow-v53`，因本輪未改 learner event schema 或 scoring 語義。


## 2026-09-28 Change note｜M3 Return / Review / Progress conformance

- M3 不新增「我的學習」頁、不建立第二套進度 source of truth；沿用 Core workspace 的活動完成量、到期複習與錯題入口。
- 最新 conformance audit 確認：375px 下即使「課程與單元」保持收合，真正到期的 `今日到期` 仍在 topbar 第一層可見；Core 繼續入口也仍可見，且頁面不得產生水平溢出。
- 無到期／無錯題時維持既有 fail-closed 行為，不顯示假的「今天」任務；活動完成量只表示完成題數，不升格為 mastery。
- 本輪只增加 regression coverage 與文件；不修改 learner-facing critical asset、scoring、scheduler、first-response/retry、event schema、evidence taxonomy 或 formal evaluation，因此不重新凍結 formal candidate。
- 證據邊界：這只證明既有 Return / Review / Progress 介面契約在 desktop/mobile 可被自動驗證；真人是否更容易決定「今天先做什麼」仍為 NOT_TESTED。


## 2026-09-28 Change note｜M4 Landing / Homepage conformance

- 首頁 Hero 恢復引用已指定且實際存在的 `assets/homepage/hero.png`；先前 DOM 指向不存在的 `hero.webp`，同時 candidate 卻追蹤 PNG，造成 learner-facing surface 與 fingerprint authority 不一致，現已修正。
- 「怎樣才算真的學會」只保留三種 learner evidence：第一次自己作答、延後再做、未見新棋形；「仍能自己判斷」改為三項之後的非編號總結句，不再視覺上形成第四 evidence。
- 刪除不再使用的 `assets/homepage/evidence-still-judge.webp`，formal candidate asset set 升至 v6，candidate 更新為 `formal-teaching-candidate-2026-09-28-n`，fingerprint `fnv1a32-js16-8479d7d0`。
- Core 主 CTA、Core 1–15 三階段入口、Advanced 獨立 practice-only 路線、研究來源預設收合等既有 IA 不變；不修改 scoring、scheduler、first response／retry、event schema、KC、evidence taxonomy、learner state 或 formal evaluation。
- 證據邊界：M4 只修正首頁語義／資產一致性與工程契約；真人 usability 仍 `NOT_TESTED`，正式教學仍 `BLOCKED`，學習成效仍 `NOT_MEASURED`。


## 2026-09-29 Decision note｜Candidate-dependent evidence guard + normalized corner contract

- **BGA Figure 1 structured observation：** 官方 British Go Journal 116 PDF（SHA-256 `338acca065e4d88bad737c65f0914e14865f3b6adf85f87eb06502a6f1bd12a8`）已在 temporary research workflow 中 render-first 人工核對；Figure 1 的 defender connected group 可可靠辨認為四子 L-tetromino。來源圖、PDF 與來源座標均不進 main/public repo，rights 仍只作 `reference_only`。
- **修正前提：** 先前「六點」類描述可能是 eye-space／其他 representation；不能與 defender connected stones 混用。新 `corner-defender-connected-group-normalized-v2` 只比較 defender connected group，不代表 eye-space、full-position、死活機制或 canonical family identity。
- **角落正規化：** external SGF 的 top-left／top-right／bottom-left／bottom-right 都先映射到同一 local corner frame，再以 `boundary=["bottom","left"]` 做 strict context compare；避免同形只因棋盤角落不同被誤判 DIFFERENT。
- **循環證據防護：** 若 candidate geometry 是由某 evidence chain 種出，該 chain 必須列入 `candidateDependentEvidenceChains`，不得回頭計為獨立 validation vote。aggregation 只對剩餘 independent units 計算 decisive support。
- **停止線：** 即使下一個 Tsumego Hero reference 與 BGA-seeded L-tetromino MATCH，也只形成一條獨立 validation；BGA seed 本身被排除，因此 aggregate 仍應 `INSUFFICIENT`，不得寫成兩條獨立一致證據，更不得 canonical promote。
- **不變：** learner state、KC、scheduler、scoring、T0–T3、R1、formal evaluation 與 playable catalog 均不變。
- **Rollback：** 回復 oracle v2 與 HTML-SGF adapter v1 即可；無 learner data migration。


## 2026-09-29 Decision note｜Tsumego 15362 對 BGA Figure 1：defender-group contract 得到 DIFFERENT

- **真實 observation：** Tsumego Hero `The L Group 32/46` 再次以 deterministic embedded SGF probe 取得；來源題面為 `Black to kill`，唯一最近角部白方 defender connected component 可穩定選出。原始 SGF、stones、points 與 fingerprint 只存在 1-day research artifact，不進 main。
- **Source digest 修正：** 同一題連續抓取時整頁 HTML digest 會變，但 embedded SGF digest 連續兩次固定為 `sha256:301320106eb00da20cb4f7447faa568db2853a1a1ddd4911d5efa0d13b910ce6`。因此 HTML-SGF adapter v3 改以 embedded SGF bytes 作 geometry `sourceDigest`；無關 HTML 變化不得製造假版本。
- **Contract v3：** `corner-defender-connected-group-normalized-v3` 只比較角落正規化後的 defender connected shape + board role/context；absolute `toPlay` 不屬 geometry identity，固定為 `unspecified`。
- **實際結果：** Tsumego 15362 與 BGA BGJ116 Figure 1 的 BGA-seeded defender geometry 在此 contract 下為 `REFERENCE_DIFFERENT`，`sameShape=false`、`sameContext=true`。這只否定「兩個 source case 的 defender connected stones 完全同形」，**不否定兩個來源都把其案例放在 L Group 教學脈絡**。
- **重要修正：** exact defender connected stones 目前不能視為 L Group family-wide identity invariant；Tsumego 題庫可能包含 L Group 的變形／衍生局面。不得把這個 DIFFERENT 偷換成來源衝突，也不得挑另一題只為得到 MATCH。
- **Aggregation：** BGA chain 是 candidate seed，依 oracle v3 排除；目前只剩 Tsumego 一條 independent decisive unit，因此 aggregate = `INSUFFICIENT`、`canonicalPromotionAllowed=false`。
- **下一步：** 研究更適合 family identity 的 representation（例如來源明示的 base shape／eye-space／enclosed region／mechanism），或取得第三條直接、可結構化且不依賴 BGA seed 的來源；任何新 representation 必須另建 `comparisonContractId`，不得與 defender-group v3 混聚合。
- **不變：** playable content、scoring、learner state、KC、scheduler、T0–T3、R1、formal evaluation 全部不變。


## 2026-09-29 Decision note｜L-tetromino core hypothesis v1：一條獨立 decisive support，仍不足升格

- **重新框架：** Tsumego 15362 已反證 exact defender connected group 不是 family-wide invariant。下一個候選改成更窄的「來源直接標示／原生標記的 4-stone L-tetromino core」，不把較大 group 任意裁四子。
- **Contract：** `lgroup-source-marked-l-tetromino-core-v1` 是 `research_hypothesis_only`。只接受：(1) source 直接把整個 target group 綁到 L Group，且 group 恰為四子；或 (2) source-native marked subset 恰為四子，但後者若標記語義未經獨立人工覆核，只回 `NEEDS_HUMAN_REVIEW`。
- **BGA seed：** BGJ116 Figure 1 作 candidate seed；其 evidence chain 必須排除，不能同時當 independent validation。
- **第一條獨立支持：** OGS 2022 帖文正文直接寫「This arrangement of white stones is called the L group」，其 source image 的整個白方 target group 是四子 L-tetromino；reference-only receipt = `REFERENCE_CORE_MATCH`。
- **日本 supporting observation：** IGOcompany 2024 文章直接把右上局面稱「隅のL字型」且「白先白死」；原圖有四顆 source-native 方框白子呈 L-tetromino，但文章沒有說明方框語義，因此只記 `NEEDS_HUMAN_REVIEW`，不算第二張 decisive vote。
- **Aggregation：** BGA seed 排除後目前只有 OGS 一條 independent decisive MATCH；日本 observation 只 supporting，因此 aggregate = `INSUFFICIENT`、`canonicalPromotionAllowed=false`。
- **Tsumego stop line：** 15362 的較大未標記 defender group 不符合 core contract eligibility；不得從中搜尋任何四子 L subset 來事後製造 MATCH。
- **下一個解除條件：** 對日本 source-native 方框語義取得獨立人工覆核，或找到另一條直接標示 base L Group 且整個 target group 為四子的獨立來源。達成前不把 core hypothesis 寫入 canonical geometry registry／playable content。
- **不變：** learner state、KC、scheduler、scoring、T0–T3、R1、formal evaluation 全部不變。

## 2026-09-29 Change note｜世界死活名型館 UI IA v1

- **Johari 開放區：** 經典棋形練習與「世界名型對照」已是兩種不同使用意圖；現行長頁把 atlas 放在所有 practice 後方，練習越多，查名型的捲動成本必然上升。
- **Johari 盲點：** 直接把 atlas 完整搬到練習上方會提前暴露名稱／術語，可能破壞既有「先看棋形與首答，再揭名」支架；直接把所有練習重寫成共用引擎則改動 scoring/keyboard/event surface 過大。
- **Johari 隱藏區：** 不需重寫練習 contract 即可先解決主要 IA bottleneck：把同頁切成 `#practice` 與 `#atlas` sibling modes，atlas 不再受練習長度推擠。
- **Johari 未知區：** 真人是否偏好預設 practice、切換命名與快速導覽粒度仍未測；本輪不把模式偏好寫入 learner state，也不宣稱 usability 已驗證。
- **實作：** 頁首新增「棋形練習／世界名型對照」雙模式；`#atlas` 可直接深連結，其他 hash 預設留在 practice；練習區新增描述性快速導覽，避免在作答前用正式名型名稱充當額外提示。窄版模式與導覽可降為單欄。
- **不可破壞 invariant：** 題庫、scoring、首答／retry、提示、揭名時機、scheduler、learner events、formal evaluation 全部不變；模式只存在 URL hash／DOM state，不寫 localStorage。
- **negative test：** `#atlas` 必須只顯示 atlas；練習深連結仍判作 practice；mode script 禁止 learner/storage/scoring authority；既有 `classic-reveal` 作答後揭名腳本仍存在。
- **rollback：** 移除 `classic-shapes-mode.js`、mode nav/panel wrapper 與新增 CSS，即回復原長頁；無資料 migration。
- **證據邊界：** 這是資訊架構工程修正；只可支持可直接抵達 atlas 與頁面不再因 practice 增長而推遠，不證明真人查找更快、理解更好或學習效果提升。


## 2026-09-29 Decision note｜L Group core label-scope v2 + human review gate

- **新反證邊界：** 日本職業棋士恩田烈彦的「隅のL字型をマスターしよう」講座縮圖直接標示「隅のL字型／白から打っても活きられません」，但顯示的是整體角部局面，沒有 source-native 四子 core 標記。這證明「position 被稱為 L 字型」不能自動當成「某四子 group／subset 就是 L core」。
- **Contract v2：** `lgroup-source-marked-l-tetromino-core-v2` 新增 `labelScope = target_group | marked_subset | position_only`。只有 `target_group` 或經獨立覆核的 `marked_subset` 可 decisive；`position_only` 一律 `NEEDS_HUMAN_REVIEW`，不得算 MATCH／DIFFERENT。
- **既有 evidence 重綁：** BGA 與 OGS = `target_group`；IGOcompany 由先前 implicit marked-subset 假設修正為 `position_only`，其四個方框語義仍未知，不能算第二張 decisive vote。
- **人工覆核入口：** 新增 `lgroup-mark-semantics-review-v1` protocol、回條範本與 `lgroup-mark-review-verify.cjs`。回條綁定 IGOcompany source image digest，要求真人、獨立於先前 extraction、直接開原始來源並檢查全文脈絡。
- **允許判斷：** `marks_define_named_l_core`／`marks_have_other_semantics`／`unclear_from_source`。只有前兩者且 receipt 驗證通過才是 decisive human content review；`unclear` 維持非 decisive。
- **Aggregation：** BGA seed 排除；OGS 仍是唯一 independent decisive MATCH；IGOcompany 與 Onda 都只 supporting non-decisive，因此 aggregate 仍 `INSUFFICIENT`、`canonicalPromotionAllowed=false`。
- **搜尋停止線：** 本輪多語搜尋沒有找到第二條同等直接、可結構化且獨立的 4-stone core 來源；繼續加同義搜尋的資訊增益已低於人工釐清既有 source-native marks。下一步改等 verified human receipt，不再靠搜尋數量推高信心。
- **不變：** canonical geometry、playable content、scoring、KC、scheduler、learner state、T0–T3、R1、formal evaluation 全部不變。


## 2026-09-29 Change note｜Homepage responsive-density candidate refreeze

- 首頁「怎樣才算真的學會」三項 evidence 在既有 mobile breakpoint（760px）以上維持單列；「為什麼這樣設計」圖示與標題改為同列，減少無效垂直空間。
- learner-facing critical surface 因 styles.css 改動，formal candidate 重新凍結為 `formal-teaching-candidate-2026-09-29-q`，fingerprint `fnv1a32-js16-681f5de6`；此值來自 PR #94 首輪 CI 對精確 candidate surface 的 fail-closed 重算。
- 不修改題目、scoring、scheduler、KC、first response/retry、learner events、evidence taxonomy、learner state 或 formal evaluation 語義；example evidence 僅更新 candidate binding，所有真人 evidence 仍為 false/null，未偽造完成紀錄。
- 正式教學仍 `BLOCKED`（R1a 外部回條、target novice usability、真人 accessibility 尚未完成）；正式評量仍 `BLOCKED`；學習成效仍 `NOT_MEASURED`。本次 CI 只能驗證工程與 candidate binding 一致性。


## 2026-09-29 Change note｜Homepage outcome decoration clean refreeze

- 從當時最新 main 乾淨重建，只移除「完成核心課程，大約會到哪裡」卡片右上角純裝飾黑白棋子 pseudo-elements；不補替代圖示，不改文字或 DOM 結構。
- PR #103 首輪 CI fail-closed 重算 critical learner surface fingerprint 為 `fnv1a32-js16-4db8fb88`；formal candidate 重新凍結為 `formal-teaching-candidate-2026-09-29-t`。
- example evidence 僅同步 candidate binding；真人 usability/accessibility 仍保持 false/null，未建立或偽造真人證據。
- 題目、scoring、scheduler、KC、first response/retry、learner events、evidence taxonomy、learner state 與 formal evaluation 語義不變。正式教學仍 `BLOCKED`、正式評量仍 `BLOCKED`、學習成效仍 `NOT_MEASURED`。


## 2026-09-29 Decision note｜Human review timing policy｜all manual review deferred to final phase

- **使用者工作方式：** 開發過程會持續邊修改邊自行檢視，因此正式人工工作不在中途反覆啟動；R1a、R1b 真人難度資料、target-novice usability、accessibility spot check、L Group mark-semantics review 與其他 human content review 一律集中到工程／自動研究收斂後的最後階段。
- **狀態語義不變：** 延後不等於通過。所有尚未完成的人工證據維持原本的 `BLOCKED`／`NOT_TESTED`／`NEEDS_HUMAN_REVIEW`／`INSUFFICIENT`；自動測試、搜尋、engine、LLM 或開發者自己的臨時觀察都不得代填正式真人證據。
- **執行規則：** 若某自動工程只因「缺人工回條」而被卡住，但該人工結果不是安全／正確執行該工程的前置條件，則繼續完成可逆、可測試的工程與 research tooling；把人工缺口記入 final-review backlog，不在中途停止。
- **例外：** 若缺少人工判定會直接改變不可逆操作、正式內容真值、scoring、公開宣稱、formal evaluation eligibility 或其他高風險結論，仍必須 fail closed，不得以「最後再看」為理由先升格。

## 2026-09-29 Change note｜Private unseen formal evaluation verifier v1

- **bottleneck：** 公開 holdout 已因 publication 全部退役，但 formal evaluation gate 原先只靠 `privateUnexposedHoldoutEstablished=true` 加文字 evidence reference，無法 machine-verify private pool 是否真的存在、是否在 outcomes 前凍結、是否未公開／未呈現，以及是否與同輪 scheduler／教學調整分離。
- **公開 contract：** 新增 `formal-evaluation-verify.cjs`。未來只能在本機以 private manifest + private item files 驗證；逐檔 SHA-256、唯一 item ID、private-root path confinement、pool/version、scoring/evidence-taxonomy version 都需一致。
- **evidence-integrity declarations：** manifest 必須是 `never_public_never_presented`、`independent_evaluation`、`no_same_round_updates`、`locked_before_outcomes`，且 `frozenBeforeOutcomes=true`；缺一項即 fail closed。
- **Public/Private Hard Wall：** 真正 private 題目、答案與 manifest 只能放在 `.private-evaluation/`，該目錄同時加入 Git ignore 與 release exclusion；公開 repo 只保存 verifier 與 synthetic tests。
- **gate hardening：** `teaching-gate-verify.cjs` 不再接受單純手填 private-holdout boolean 作 formal evaluation 證據；必須另有同次本機 verifier 的有效結果。R1b 仍是獨立條件，不能由 private pool 存在自動升格。
- **目前狀態不變：** 本輪沒有建立任何真正 private evaluation item／manifest，也沒有真人資料；`replacementPrivateHoldout=not_established`、R1b=`not_established`、formal evaluation=`BLOCKED`、learning effect=`NOT_MEASURED`。formal teaching candidate 不需重凍結，因 learner-facing critical surface 未變。


## 2026-09-29 Change note｜Advanced settings information priority v54

- **可觀察問題：** 375px 側欄的「進階設定與資料」把課程層次、四種診斷與工具入口放在近似視覺權重；長段落使目前狀態、完整證據與參考資訊互相競爭。
- **修正：** `learner-flow-v54` 固定為「目前學習狀態摘要 → 按需展開完整診斷 → 課程層次參考 → 工具與資料」。實戰紀錄、可分析實戰機會、學習證據與錯誤修正各有 compact brief；完整分母、限制、錯誤／資料不足狀態仍留在 details。
- **不可破壞 invariant：** 不改題目、KC、scoring、scheduler、first response/retry、learner event、evidence taxonomy、formal evaluation 或 learner-state authority；ERROR／資料不足維持 fail closed，不改成成功狀態。
- **回歸：** `tests/app-state.test.cjs` 增加 brief 值檢查；`tests/ui.test.cjs` 固定狀態 → 診斷 → 課程參考 → 工具的 DOM 順序與 compact-status CSS 契約。
- **Formal candidate：** critical learner surface 已重新凍結為 `formal-teaching-candidate-2026-09-29-u`／`fnv1a32-js16-86699408`。這只證明候選資產身分；正式 usability 仍 `NOT_TESTED`、正式教學仍 `BLOCKED`、正式評量仍 `BLOCKED`、學習成效仍 `NOT_MEASURED`。


## 2026-09-29 Change note｜v54 served-content observability hardening

- **bottleneck：** PR #110 的 pre-merge regression 已通過，但現有 GitHub connector 只能直接讀取 commit status，push-triggered workflow run 本身無法由目前工具完整查核；而既有 served-content probe 尚未檢查 learner-flow-v54 的側欄摘要與 formal candidate binding。
- **修正：** main push 的 `served-pages-content` 現在另外檢查 `styles.css?v=learner-flow-v54`、`app.js?v=learner-flow-v54`、四個 compact brief DOM marker、15 單元參考標題，以及 `formal-teaching-candidate.json`／`teaching-gate.json` 的 candidate ID + fingerprint。另新增 `served-pages-status`，把 push 後 served-content 結果以 commit status context `verify/served-pages-content` 寫回該 main SHA。
- **目的：** 讓 Definition of Done 的 post-merge served-content gate 可由機器直接查詢，不再只能推測 GitHub Pages 是否已更新。
- **不可破壞 invariant：** 不改 learner-facing UI、題目、scoring、scheduler、first response/retry、event schema、KC、evidence taxonomy、formal candidate asset bytes 或正式評量語義；因此 candidate `formal-teaching-candidate-2026-09-29-u`／`fnv1a32-js16-86699408` 不需重凍結。
- **Validation：** PR #111 pre-merge verify 全數 PASS；squash merge 至 `main` commit `0b1411c1f4c2780adb1245c477478b76532695a6` 後，push workflow run `36541346363` 的 `verify/served-pages-content` commit status = `success`，表示公開 Pages 已實際提供 v54 marker、candidate 與 teaching-gate binding。\n- **狀態：** release/deployment gate 工程 PASS。正式 usability 仍 `NOT_TESTED`、正式教學仍 `BLOCKED`、正式評量仍 `BLOCKED`、學習成效仍 `NOT_MEASURED`。
