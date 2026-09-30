2026-09-30 Comparable Framework v2 + Double Atari Full-board Family：上一版 Comparable／Delayed runtime 把 item、KC hypothesis 與 urgent-atari-rescue scorer 綁在單一 contract，若直接複製第二套會形成平行 evidence source of truth。新增 `advanced-comparable-framework-v2` family/scorer boundary：既有 `urgent_atari_rescue` 只提供 legacy read-only adapter，原 v1 item/event/analysis/storage 完全不 migration、不雙寫；新 writer 只服務 `double_atari`。Double Atari 使用既有 Research→Teaching Candidate（`capture-pattern-concept-anchors-v1`），建立 3 個本站原創 19×19 公開局面：practice → immediate process-check → ≥24h delayed process-check；三題分別改變 target group size、棋色、盤區、edge context 與 distractors。scoring contract `double-atari-two-targets-rules-v1` 只接受「落子前沒有對方棋已在一氣；落子合法且不立即提子；落子後恰好兩串彼此分離、落子前各兩氣的對方棋變成各一氣」；一串、三串、立即提子、既有 pre-atari、family/scorer mismatch 都 fail。item 禁止 answer/correctMove/targetGroups/sharedLiberty 等答案欄位；全盤枚舉必須只有一個成功點。surface descriptor 只作避免明顯重複的 negative filter，不證明 pair 難度可比或 KC validity。v2 immediate/delayed event streams 保留 first response／retry／denominator，固定 `kcStatus=not_promoted`、`constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`；24h 仍是固定 baseline，不是最佳間隔主張。Advanced Evidence Bundle 升 v3，同時保存 v1 urgent-atari 與 v2 Double Atari streams/analysis；任一 v2 store 壞掉只污染自身，不改寫 legacy。這一 stage 只支持「multi-family Comparable/Delayed engineering contract PASS」，不支持 Double Atari KC、retention、transfer、mastery 或 learning effect。

2026-09-30 Enclosure Capture Family v1：上一輪的最高決策價值未知是「門吃／抱吃能否由棋盤事實穩定分開」。本輪用四個本站原創、非單純鏡射 fixtures（中央／邊線 × 單子／兩子目標）做 rules-backed falsification：共同機制全部成立，且若不先切斷援兵，白棋可在連接點合併並取得至少兩氣；但沒有得到可重算的 door/hug label split。因此依停止線只新增較粗 `enclosure_capture` Teaching Candidate，learner-facing 用「包圍吃子」教共同機制；`sourceLabelCandidate` 全部保持 `unknown`，不新增兩個 KC、不改 sequence policy／scheduler／T2-T3／formal evaluation。\n\n2026-09-30 Capture Pattern Concept Anchors v1：在已完成的打吃方向後，只推進可由棋盤規則清楚操作化的 `double_atari`。跨語查核將中文「雙打吃」、日文 `両アタリ`、英文 `double atari` 對到同一 Concept Anchor；Advanced choice practice 新增一個原創 Teaching Candidate，rules test 驗證「兩串分離白棋各兩氣 → 黑同一手後各一氣，且不立即提子」。`門吃／抱吃` 雖有中文入門教材分類與「先切斷援兵、延長後仍一氣」描述，但本輪沒有足以支持日／英一對一術語映射或穩定 item-family 分岔的證據，因此停在 research term／item-family candidate，不進 learner item、KC、sequence policy、scheduler、T2/T3 或 formal evaluation。\n\n2026-09-30 Capture & Semeai Track v1：本輪屬新增 Experience／內容治理的小步更新。Advanced choice practice 新增兩個「打吃方向」Teaching Candidate，目的只是在不改 KC 的前提下測「預測逃路／阻止連接」是否值得形成獨立 task family；既有四個多手 sequence family、`advanced-fixed-interleave-v1`、`advanced-sequence-events-v3`、scheduler、T2/T3 與 formal evaluation 全部不變。使用者教材截圖來源與授權未確認，只作 DISCOVERED 研究線索，不把原圖／原文／完整棋形帶入 public assets。驗收看 content metadata、首答／retry 回歸與固定 policy 未漂移；工程 PASS 不等於 KC 或教學效果成立。

2026-09-30 AI-era concrete cases + Go decision-model research v1：依使用者順序，R1a／三位 target novice usability／真人 accessibility 繼續保留到最後階段；本輪只推進 research／authoring plane。新增 `research/go-ai-knowledge-cases-v1.md`，先鎖定直接三三、三三二路爬重新評價、AI 定石革命三個 case candidates；每案都要求可重建棋形、Go-specific validation、授權與反例，不能只寫成「AI 說這手較好」。另新增 `research/go-decision-models-v1.md`，把局部／全局、先手、捨石、厚勢、定石整理為 structural analogy candidates，明示 `NOT_TRANSFER_EVIDENCE`；不把 option value、sunk cost、heuristic 等現代術語當歷史等價，也不宣稱學圍棋會自動改善一般決策。尚未建立 `thinking.html`；只有至少三個模型具 validated board example、learner-facing explanation、contrast/failure case 與 analogy boundary，才重新評估獨立頁。這些 research records 不接 learner state、KC、scoring、scheduler、T2/T3 或 formal evaluation，也不重凍結 formal candidate。

2026-09-30 History Explore v6 served-content sync：`history.html` 已升為 v6 且來源查核日更新為 2026-09-29 後，push-to-main 的 served Pages verifier 仍檢查舊 `歷史探索 v5` 與 2026-09-28 marker；兩者均已同步。這只修部署驗證契約，不改頁面內容、learner runtime、formal candidate 或 evidence semantics。

2026-09-29 History Explore cosmology／AI + cross-language concepts pilot：依使用者優先序，R1a／三位 target novice usability／真人 accessibility 維持最後階段處理；本輪先做 research／authoring plane。`history.html` 新增「天地／陰陽／天文／象數」證據邊界與 2016 後 AI 知識轉折；前者只證明歷史詮釋存在，不把《易》或 361 升格成盤制起源因果，後者用日本棋院與大型棋譜研究描述布局／定石知識重組，不寫成所有傳統棋理失效。新增 `research/go-history-cosmology-ai-v1.md` 與 `research/cross-language-go-concepts-pilot-v1.md`；跨語 pilot 先鎖定厚／勢／味／先手／定石，使用 Equivalent／Overlap／Broader／Narrower／Non-equivalent／Unknown，不建立「民族思考模式」結論，也暫不新增 `concepts.html`。這些 Explore／Research 變更不接 learner state、KC、scoring、scheduler、T2/T3 或 formal evaluation；未改 `index.html` 或 Core critical candidate surface，因此不重凍結 formal candidate。

2026-09-29 Evidence Overview v1：本輪屬 Step 2 formative usability engineering，不是正式 usability gate。可觀察 bottleneck 是 v54 雖縮短文字，第一層仍同時展示 activity、sampling coverage、evidence state 與 diagnostic；v55 以「目前可知道什麼」作單一 overview，完整分母與錯誤診斷下沉到 details。驗收只看 learner-facing 狀態映射、ERROR fail-closed、詳細證據仍可取得、320px／鍵盤／ARIA 結構與既有回歸；不得把工程 PASS 寫成「初學者已看懂」。若 formative observation 沒再出現此 bottleneck，不再增加新的 dashboard 層級。

2026-09-29 Delayed Comparable Fixed Order addendum：若 delayed A／B 同時達到 24 小時條件，仍固定依 A → B 呈現；B 必須等 A completed 後才能建立 presentation event。event append、store validator 與 UI 三層共同 enforce，防止使用者自選先做哪題形成 presentation-order 偏差。B 的 actualDelayMs 仍按自己的 immediate target anchor 實際計算，因此延後超過 24 小時會被如實保存。這不是 adaptive sequencing。

2026-09-29 Delayed Comparable Retrieval v1：Comparable Position v1 只有 immediate public process-check，尚不能區分「剛練完仍記得」與「隔一段時間後仍能在不同全盤局面重新辨認同一種危險」。新增兩個 project-synthetic 19×19 delayed item；每個 item 都是與既有 practice/source、immediate target 不同 surface class 的第三局面，仍沿用 rules-backed「唯一己方一氣棋串 → 落子後原棋串存活且至少兩氣」scoring，不判全盤最佳手。固定 policy `advanced-delayed-fixed-24h-v1` 以 immediate process-check 的 completed event 為 anchor，至少實際經過 24 小時才允許 presentation；不到時間不建立呈現事件，系統時鐘早於 anchor、anchor 生命週期時間倒退、due relation 不一致均 fail closed。這是固定間隔 baseline，不是自適應 scheduler，也不宣稱 24 小時是最佳間隔。Delayed event stream 保存 anchor identity、anchor/due/actual time、first response、retry、completion；一旦呈現即進公開 process-check denominator，未答不得移除。所有 delayed evidence 固定為 public T2 process-check taxonomy，`constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`；analysis 只輸出描述性 first-response／actual-delay 摘要，`retentionConclusion=null`、`transferConclusion=null`。Advanced Evidence Bundle 升為 v2，新增 delayed stream 與 delayed analysis；舊 event stores 不 migration、不覆寫。private unseen formal evaluation 仍是獨立 gate。rollback 可移除 delayed runtime/policy/stream/items，既有 Comparable v1、Replay、Decision Review 不受影響。

2026-09-29 Backup Scope Clarity v1：Advanced Evidence Bundle v1 上線後，Core 工具仍把自己的 JSON 稱為「備份完整資料」，會讓使用者誤以為一次匯出涵蓋整個產品。現在 Core 入口改為「備份核心與實戰資料」，說明其範圍為 Core、固定應用探測、局部復盤與實戰；獨立 Advanced 事件由進階頁另行匯出。這是 evidence durability／資訊邊界修正，不把兩套 store 強行耦合，也不新增 restore/import。因 `index.html` 屬 formal candidate critical learner surface，candidate 重新凍結為 `formal-teaching-candidate-2026-09-29-v`／`fnv1a32-js16-45fb67e5`，並同步 teaching gate、example evidence 與 served Pages verifier。重新凍結只代表資產身分；R1a、正式 usability、accessibility 仍依 final-phase policy 保持 BLOCKED／NOT_TESTED，沒有新增真人證據。

2026-09-29 Advanced Evidence Bundle Export v1：Advanced 已累積 choice、multi-step sequence、19×19 Decision Review、KataGo comparison、Decision Replay、Comparable Position 等多條 localStorage 事件流，但 Core 的完整 JSON 備份不涵蓋這些 stream；瀏覽器資料被清除時會失去可回溯 Evidence。新增單向 `advanced-evidence-bundle-v1` 匯出：choice、sequence v1/v2/v3、decision review、comparison、replay、comparable events 分 stream 保留原 schema/event version，legacy sequence 不 migration；Comparable 另附 `advanced-comparable-analysis-v1` 描述性 summary。每條 stream 透過官方 reader 讀取，且有 validator 的 stream 匯出前再逐 event 驗 authority；malformed/unreadable/polluted store 不輸出 raw 壞資料，而標 stream error，其他健康資料仍可匯出，bundle `complete=false`。此功能只作本機備份與分析，不提供 restore/import，不改 learner state、KC、scheduler、formal evaluation、first-response 語義或歷史事件；formal teaching candidate 不重凍結，因 Advanced 不在目前 Core critical asset set。rollback 可移除 exporter/UI/tests，不修改任何既有 event store。


2026-09-29 Comparable Position Analysis v1：Comparable Position v1 已能產生 practice／process-check 事件，但原本只有 event count，尚不能安全重算 pair 層的 first-response 狀態。新增 `advanced-comparable-analysis-v1`：每個 item 固定以第一次 presentation 為分析單位，首答與 retry 分離；同 item 之後重新開始不能用較好的後一次首答覆蓋第一次。target 一旦呈現即進 process-check denominator，未答明示為 `TARGET_UNANSWERED`；尚未呈現則不進分母。analysis 重新驗 event authority 與固定 presentation order，跳過前置 item、completion_without_first、retry_without_first、multiple_first 等 lifecycle 異常全部 fail closed。pair transition 只輸出 `source_correct_target_correct` 等描述性組合，不產生 mastery、transfer success、KC update、scheduler eligibility、formal evaluation 或 construct validation。既有 Comparable Position 的 public T2 標籤仍只表示「different surface + same provisional KC hypothesis」的 process-check taxonomy；Analysis PASS 不把 provisional KC 變成已驗構念。rollback 可單獨移除 analysis module／tests，不修改既有事件流或歷史資料。

2026-09-29 Comparable Position v1：Decision Replay 已解決同一已曝光局面的 T0 重做，但 Advanced 仍缺「不同全盤表面、同一 provisional KC hypothesis」的公開 process-check。新增兩組 project-synthetic 19×19 pair，共 4 個 item；固定順序為 practice A → practice B → process-check A → process-check B，避免 source/target 相鄰造成短期 cue。v1 只處理 rules engine 可完全判定的 bounded target：盤上恰有一串己方棋只剩一氣，成功條件是落子後該原棋串仍存在且至少有兩氣；不判全盤最佳手、厚薄、攻擊收益或形勢。pair source/target 必須 position fingerprint 不同、group size/topology/edge/color/board-region 等至少多軸改變，且不得同 surface class。所有 item 為本站原創合成、公開資產，item 禁止內嵌 answer/correctMove；rules engine 枚舉全盤驗證成功點唯一。兩個 target 固定是 public process-check：呈現資格在 response 前決定，首答與 retry 分開保存；事件綁 provisional KC hypothesis `urgent-atari-rescue-kc-v1`，但 `constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`、`qualifiedOpportunity=false`。target 的 evidence taxonomy 標 T2 只表示「不同表面、同一 KC hypothesis」的公開 process-check 類型，不等於 formal transfer 已成立；private unseen formal evaluation 仍須另一個從未公開的 pool。rollback 可單獨移除 Comparable runtime/stream/items，不修改既有 Decision Review／Replay／Comparison 歷史事件。

2026-09-29 Decision Replay v1：Decision Review 已能形成「全盤局面 → first candidate → 原著揭露 → reflection／bounded comparison」的 Response/Evidence，但沒有一個不依賴原 SGF 檔案的 Next Experience。新增獨立 replay stream 與本機 queue：只有已存在 `original_revealed` event 的局面才能加入，snapshot 保存 source review/version/fingerprint、棋盤 stones、ko previous stones、player、move number 與 historical original move。重做時原著再次先隱藏，first response／retry 分開保存，揭露後只做 historical comparison。所有 replay event 固定 `sourceExposure=previously_exposed`、`transferLevel=T0`、`formalEligible=false`、`qualifiedOpportunity=false`、`skillId=null`；不得當 unseen retention、T1/T2/T3、KC、scheduler 或 formal evaluation。later comparable position 明確保留為另一份尚未建立的 contract，不由 replay 自動升格。舊 review/comparison event stream 不修改、不 migration；rollback 可單獨移除 replay UI／stream。

2026-09-29 Decision note｜Go × Mathematics Explore 保持 research-only

- 多語／跨來源研究確認圍棋有直接形式數學結構，但「Go training → general mathematics improvement」仍為 UNKNOWN。
- HKBU 2024 七人質性案例研究只支持感知到的策略連結，不作 transfer effect；一般 spatial-training 與 cognitive far-transfer 研究只作機制／邊界證據。
- `math.html` 是 Explore reading surface：不接 learner state、KC、scheduler、scoring、T2/T3 或 formal evaluation。
- 若未來真的測 transfer，先比較 Go-only、Go + explicit bridge、Math-only，在新的無提示、可比較且延後的數學 outcome 上驗收；未出現 learner bottleneck 前不把 Math Lens 升為 Core 功能。

2026-09-29 KaTrain Smoke Autodiscovery v1：Real KataGo receipt gate 已 ready，但 Windows 使用者仍需人工提供 executable/config/model 三條路徑。KaTrain 1.20.0 官方設定以 `~/.katrain/config.json` 保存 engine 設定，bundled Windows engine 使用 `katrain/KataGo/katago.exe`、分析設定預設 `katrain/KataGo/analysis_config.cfg`、模型使用 `katrain/models/...` package resource。新增 `tests/katrain-katago-smoke.ps1`：優先讀 user config；自訂 absolute path 直接採用；bundled resource 只在明確 `-KaTrainRoot`、正在執行的 KaTrain 目錄或有限常見安裝根下尋找 exact suffix。找不到、相對 custom path 無法安全解析、或同一 root 出現多個 bundled KataGo 都 fail closed。wrapper 最終只呼叫既有 `katago-bridge-smoke.ps1`，不建立第二套 receipt/scoring/engine contract。Windows CI 用 synthetic KaTrain layout 的 `-ResolveOnly` 測試成功解析與 ambiguity rejection；這仍不是 real-engine evidence，狀態維持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。

2026-09-29 Real KataGo Smoke Receipt v1：Decision Point Comparison 的下一個 gate 不再用 CI adapter 測試冒充真引擎證據。Windows `tests/katago-bridge-smoke.ps1` 現在要求 clean checkout，先以官方 `katago version` 取得 engine identity，再實跑 `/v1/move` 與 `/v1/compare`；兩者都通過後才產生本機 `.local-evidence/katago-smoke-receipt.json`。receipt 綁 repository commit、四個 contract file SHA-256、KataGo executable/config/model SHA-256、engine/model identity、runtime、comparison request/result；不保存絕對檔案路徑。公開 repo 只保留 receipt schema/verifier/tests，實際 receipt 被 gitignore/release boundary 排除。任何 commit 或 contract file 改變都使舊 receipt stale；`correct`／`mastery`／`transferLevel` 污染會 fail closed。CI 只驗 receipt contract、verifier、PowerShell syntax，沒有真 KataGo binary/model 時狀態必須保持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`，不得升格為 real-engine PASS。

2026-09-29 Change note｜KataGo real-engine receipt v1

- **bottleneck：** Decision Point Comparison v1 的 contract／adapter／browser flow 已通過 CI，但 CI 沒有實際 KataGo executable、config 與 model；因此仍缺一份能證明「這組公開 contract 曾由真引擎完整跑通」的可重算本機證據。
- **實作：** `tests/katago-bridge-smoke.ps1` 成功跑完 `/v1/move` 與 `/v1/compare` 後，才產生 `.local-evidence/katago-smoke-receipt.json`。receipt 保存 repository commit、五個關鍵 contract file SHA-256、KataGo executable/config/model SHA-256、engine version、Windows/PowerShell/Node runtime、move result、完整 bounded comparison request/result。
- **驗證：** `katago-smoke-receipt.cjs` 與 `scripts/verify-katago-smoke-receipt.cjs` 檢查 receipt schema、engine/model identity、request/result identity、兩候選 bounded authority 與 current contract hashes；stale contract、unknown engine version、model mismatch、以及 result 內出現 correct/mastery/transfer inference 都 fail closed。
- **privacy／publication：** `.local-evidence/` 永不列入 public release；只公開 receipt contract、verifier 與 tests。receipt 只保存檔名與 SHA-256，不保存 executable/config/model 路徑或檔案內容。
- **目前狀態：** `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。本輪執行環境沒有使用者 Windows KataGo executable/model，因此不得標真機 PASS。
- **下一個 gate：** 只有 local receipt 通過 verifier 後，才解除 real-engine smoke blocker；之後若要進 Comparison → Explanation，仍需另立 explanation authority／教學效度 contract，不由 engine receipt 自動升格。

2026-09-29 Decision Point Comparison v1：19×19 SGF Decision Review 在原著揭露後可選擇比較「第一候選」與「原著」。分析只在規則／貼目明確、第一候選合法且兩手不同時成立；KataGo root search 限制在兩手，結果是 bounded search estimate，不取得 scoring、KC、scheduler、T2/T3 或 formal evaluation authority。provider／engine failure 保持失敗，不以 heuristic 補結果。

2026-09-28 SGF Decision Review v1：Advanced 已有局部 multi-step reading 與 19×19 自由 practice，但兩者之間缺少可回看的全盤 Response。新增 practice-only「19×19 棋譜決策點複盤」：匯入單一主線 19 路 SGF、選一個可落子手數、在原著隱藏時先保存第一候選與 retry，再揭露原著做歷史比較並可留復盤備註。每筆紀錄版本化 source position、item、candidate-set、scoring contract、rules contract、evidence taxonomy 與 exposure state。規則引擎只判候選是否合法；「與原著不同」不是錯手，原著也不是唯一最佳手。此事件流固定 `advanced_sgf_review_practice_only`，不更新 KC／scheduler／T2-T3／formal evaluation；KataGo 若日後加入，只能另作 bounded comparison。舊 9×9 `parseSgf()` 與 single-move historical recall 語義保留。

# 產品開發與驗證流水線

更新日期：2026-09-24  
用途：把介面改善與學習量測分成兩條工程工作線，再以明確閘門決定先後。此檔管理產品開發與驗證順序，**不是學習者從不會到會的學習路徑**；學習者流水線見 [設計計畫第 3.1 節](DESIGN_PLAN.md#31-學習者從不會到會的介面流水線)。

## 一句話判斷

**先分開學習者、審查者與題目用途，再保住資料與作答意義；個人 pilot 可繼續，但不能被解讀為正式未見、保留、遷移或學習成效。**

## 目前位置

| 工作線 | 目前狀態 | 現在可做 | 現在不可做 |
|---|---|---|---|
| 證據與量測 | R0 已通過；`personal-pilot-v3` 使用舊 R1 已曝光題；正式評量停用 | 檢查資料完整性、七天返回、遮蔽、操作負擔與流程中斷 | 宣稱正式未見、題目效度、保留、遷移或學習改善；比較排程優劣 |
| live practice evidence intake | raw `live-practice-events-v1` 與 scored `live-eligibility-v1`／`live-scoring-v1` 已分層；9×9 每個學習者回合先掃描 eligibility，v1 只支援唯一一手提子與 computer-provoked 唯一直接救棋；`learner-evidence-progress-v2` 另顯示資料收集 readiness | 優先實際累積 assessed turns、eligible／unanswered、first response 與不同 game session；用 readiness 確認資料管線真的有收到可用事件，再決定是否存在需要新增 scoring contract 的觀察瓶頸 | 把不支援的全局決策、5×5／7×7、SGF actor 不明、單局勝負或 bot 選手升格成 T3；直接用 live state 改 scheduler 或宣稱 mastery |
| 日常使用介面 | P0、P1b、19 課逐步棋盤示範、第 5–14 單元的局部棋形點選及跨課短講自動銜接已完成；開發期間可持續以本人與零散使用者回饋作 formative observation | 邊使用邊記錄卡點、重複摩擦與修正結果；這些觀察可重排 P1／P2，但不阻擋後續工程 | 把開發中的零散觀察冒充正式 usability evidence；依單一主觀印象大改視覺風格或增加遊戲化功能 |

## 新增 Experience 工作線｜Core 後續進階訓練

進階訓練可在開發期與 formative observation 中迭代，但不改變正式 gate 順序。依使用者決策，R1a、三位 target novice usability 與真人 accessibility spot check 延後到最後階段；在此之前所有相關狀態維持 BLOCKED／NOT_TESTED，不以工程替代真人證據。v5 將倒撲／枷／對殺／征子各做成兩個 multi-step practice variant；每題必須有唯一 `familyId/variantId` 與明示 `variationAxes`，第二題至少改一個非單純旋轉的作答條件。棋盤 sequence 必須先由 rules engine 驗證合法性與提子，再由 `advanced-sequence-contract.js` 重播 canonical line；若題型存在明顯主要分支，至少加入 branch QA。這些 family 只用於 practice 與後續診斷。learner-facing 棋盤題在完成前不得顯示 family ID、完整題名、術語或「這是前題變形」等關係 cue。現行 `advanced-fixed-interleave-v1` 是固定 baseline：先依序完成四個 family seed，再依序完成四個 variant，一次只開放下一個 policy position；不得把這個固定交錯寫成 adaptive scheduler。`advanced-sequence-events-v3` 保存當時的 family／variant／variation axes、`presentationPolicyVersion`、`policyPosition` 與首答；v1／v2 歷史事件各由 legacy reader 保留，不補寫新 policy 語義。family transition 除 seed 早於 variant 與兩邊首答外，還須由 policy gate 確認其他三個 family 已介入，否則保持 `INSUFFICIENT_DATA`；任何情況都不產生 mastery 或 transfer claim。不得在缺少真人 first-response／難度資料時升格為 KC、transfer 證據或平行題等難。任何進階項目若要進 scheduler、T2/T3 或 formal evaluation，仍須回到 evidence-integrity 與內容效度 gate。

## 優先順序與閘門

### 0｜隨時優先：資料或答案可能失真的問題

**進入條件：** 發現答案洩漏、首答被重試覆寫、未答未入分母、題目答案或版本不一致。  
**動作：** 暫停新的 pilot 批次，先修復並以反證測試驗證。  
**通過條件：** 正答與錯答遮蔽狀態一致；首答、重試與中斷可分開重算；匯出不洩漏未見保留題。  
**目前狀態：** 已由 R0 通過，但每次改動作答、試行或匯出流程都必須重驗。

### 1｜已完成：鍵盤可完成一題（P1b）

**原因：** 修正前的棋盤把大量交叉點放進 Tab 順序，會直接阻礙鍵盤使用者完成核心任務；這是可由工程驗證的操作問題，不必等待成效資料。  
**動作：** 實作 roving tabindex：每次只有一個棋盤點可 Tab 聚焦，方向鍵移動，Enter／Space 落子，並朗讀目前行列。  
**通過條件：** 相鄰點只需一個方向鍵；Tab 不穿越全部交叉點；滑鼠、觸控、題目評分與原有瀏覽器測試都通過。  
**失敗處理：** 若方向鍵與螢幕閱讀器語意互相衝突，停止擴充其他 P1 功能，先決定可測試的鍵盤互動契約。

**工程結果：** 已實作單一 Tab 停駐點、方向鍵逐點移動、Enter／Space 落子，以及行列與棋子狀態朗讀標籤；19 課亦均有至少兩步棋盤示範，中高級縮圖明示為局部比較或階段示意。第 5–14 單元各有一題可用滑鼠、觸控或鍵盤選擇的局部觀察點，回饋不將其誤寫為全局唯一最佳手。實際理解與負擔仍需真人證據，但不再以「先完成三次觀察」阻擋開發迭代。

### 2｜開發期間持續：formative usability observation（非 gate）

**原因：** 「可操作」不等於「首次使用者能理解」，但目前產品仍在快速修正；若把不同版本的零散觀察合併成正式證據，會失去版本可比性。  
**動作：** 使用者可邊使用邊修改；持續記錄首次開始、跨單元、隔日返回、鍵盤／手機、經典眼形探索等卡點，以及修正後是否再犯。  
**用途：** 只用來發現 bottleneck、重排 P1／P2、增加反證測試或刪除多餘功能；不要求湊滿三次，也不作正式教學 gate 的 PASS 證據。  
**停止條件：** 若發現答案洩漏、首答／分母／版本／scoring 等 evidence-integrity 問題，立即回第 0 步；一般 UX 摩擦則依嚴重度修正並回歸測試。

### 3｜受限執行：個人 pilot v3

**前提：** 第 0 步持續通過；使用者理解八題已在舊 R1 自我審查中曝光，這不是正式未見或成效實驗。第 1 步工程檢查已通過；開發期 formative observation 可持續進行，但未取得正式三位初學者證據前，真人 usability／accessibility 仍標示未驗證。  
**動作：** 完成基線四題與七日後追蹤四題；只使用已知曝光的固定 pilot ID，保存未答、中斷、實際間隔與操作負擔。  
**通過條件：** 兩批資料可重算，沒有非預定回饋、答案洩漏或資料缺漏。輸出只描述各技能的觀察值與負擔。  
**停止線：** 任一批看過保留題、題目修訂、遮蔽失敗、時間異常或資料缺漏，該批標為失效，不用敘事補救。

### 4｜必要外部證據：R1a 獨立內容審題

**原因：** 題庫、答案與自動測試共享定義，不能自行證明內容效度。  
**動作：** 由未參與編題、且不是目前學習者的圍棋審查者填寫 77 題 reviewer-only 回條；每題必須有一致／需修／歧義／多解狀態。學習者介面不得連到審題頁。  
**通過條件：** 審查母體均有獨立狀態，歧義與多解題不作正式候選。通過只記為單一外部內容審查證據。  
**停止線：** 若答案或技能邊界被推翻，升題目／技能版本，保留歷史資料，不回溯升格任何 pilot 資料。

### 4b｜保持未知：R1b 平行題可比性

**現況：** 基線與追蹤只在棋串大小、氣數、讀棋深度、分支與作答方式等可觀察特徵上配對；實際難度未校準。  
**規則：** R1a 通過不得自動使 R1b 通過。沒有多批真人資料時，只能輸出「結構已配對、難度可比性未知」。

### 4c｜正式教學前最後閘門：凍結 candidate 後做三位初學者 usability

**進入條件：** learner-facing 核心流程已相對收斂，準備解除 `TEACHING_GATE`；先凍結同一個 candidate 的 UI version、content version、critical tasks 與 pass/fail criteria。  
**動作：** 依 `TEACHING_GATE.md` 由至少三位唯一 target novice 各自完成五項關鍵任務，另做真人鍵盤／螢幕閱讀器 spot check。  
**證據規則：** 開發期間的 formative observation 不得補進這三位正式分母。若正式觀察後因 blocking issue 修改了會影響 critical task 的 learner-facing 行為，受影響的正式觀察需在新 candidate 重做；不得把修改前後版本靜默合併。  
**通過條件：** `teaching-gate-verify.cjs` 在同一 candidate 的 R1a 與真人證據上回傳正式教學 `PASS`；這仍不代表正式評量或學習成效。

### 5｜最後才做：R3 實戰回流與 R4 方案比較

**R3 前提：** R1a 的相關內容已取得外部核對，且可從 SGF 指定任意手數、保存原本判斷、取得可追溯的教學答案。  
**R4 前提：** R1a 已取得外部核對、R1b 有足以比較的難度資料，並已有多批量測完整的資料；先建立 DESIGN_PLAN 第 1.4 節的 P0 強基準，固定 KC／題庫／回饋／時間／先備與分散提取條件，再一次只增加一層政策。固定與自適應使用完全相同的首答、遺漏與成本口徑。  
**R4 順序：** P0 強基準 → P1 repeated weakness → P2 retention／transfer → P3 decision-relevant diagnosis；各層以延後無提示 T2、固定應用探測及學習成本比較。未見穩定實用增益即停止，不進 P4 learned policy。  
**禁止跳級：** 沒有上述條件時，不把 SGF 原著手稱為修正答案，也不比較或宣稱某種排程較有效。

## 每輪執行格式

每一輪只推進一個編號步驟，依固定順序留下可核對結果：

1. **確認閘門：** 讀取上一級的通過條件與停止線。
2. **最小修改或任務：** 只改與本步直接相關的程式、資料或紀錄。
3. **驗證：** 執行受影響的自動測試，或保存明確的真人任務紀錄。
4. **判定：** 標示通過、待補、失效或停止；不可用「大致沒問題」跳關。
5. **決定下一步：** 僅在本步通過後進入下一號；發現第 0 步問題時一律回到第 0 步。

## 不可混用的結論

| 已有證據 | 可以說 | 不可以說 |
|---|---|---|
| 自動測試與瀏覽器流程 | 功能、資料格式與指定互動可運作 | 初學者覺得順手，或能學會圍棋 |
| 個人 pilot v3 | 此人在此裝置上的流程、返回、負擔與資料完整性 | 正式未見、題目有效、能力提升、保留或遷移 |
| R1a 單一外部內容審查 | 題目答案、歧義、多解與技能邊界取得一位外部審查者核對 | 平行題等難、完整內容效度或教學因果成效 |
| R1b 結構配對 | 已知題目特徵相近 | 實際難度已等值 |
| 多批條件一致的追蹤 | 個人範圍內的描述性趨勢 | 一般化到其他使用者 |

## 相關文件

- [介面改善細節與真人任務](UI_UX_AUDIT.md)
- [Phase 1–5 證據邊界與 R0–R4](PHASE_1_5_JOHARI_REVIEW.md)
- [R1 題庫審題範圍](R1_CONTENT_AUDIT.md)
- [整體教學與資料設計](DESIGN_PLAN.md)

## 2026-09-23 Change note｜真人 usability 證據改為逐位保存

- **問題：** 舊 formal-teaching-evidence-v1 只保存 participantCount 與五項任務的彙總布林值；理論上可能由不同參與者各完成不同任務，卻被彙總成「三位都完成五項」，造成 denominator／completion 語義無法稽核。
- **修正：** 保留既有彙總欄位以便閱讀，但正式 gate 現在額外要求至少三筆唯一匿名 participantCode；每位都必須是 target novice、逐項完成五個 critical tasks、沒有 blocking issue，且有非空 evidence reference。participantCount 必須與逐位紀錄數一致。
- **反證：** 任一參與者漏做一項、逐位紀錄少於宣稱人數、或 participant code 重複，都必須 BLOCKED；不得由 aggregate true 掩蓋。
- **隱私：** 只使用匿名 code 與證據引用，不在 repo 保存姓名、聯絡資料或其他個資。
- **證據邊界：** 此修改只提高真人證據的可稽核性，不產生任何真人證據；目前 usability／accessibility 狀態仍是 NOT_TESTED／BLOCKED。
- **Migration／rollback：** 尚無正式真人證據檔，因此沒有歷史真人資料需要升格；舊格式檔會 fail closed，需依原始觀察補成逐位紀錄，不能猜測補值。若 rollback，恢復舊 verifier，但會重新暴露彙總證據缺口。

## 2026-09-24 Decision note｜SGF 連續復盤不升級為目前工作線

現行 SGF 已提供「任意手數 → 顯示原著前局面 → 單手原著重建 → 反思／人工確認」的 bounded practice。此能力現在正式定義為 **single-move historical recall**，不是最佳手評分，也不是 T3。

連續猜手／整段棋譜重建只有在以下條件同時成立時才進入實作：
1. 真人任務中反覆出現「每次需重新選手數」造成復盤中斷；
2. Sabaki Guess mode 等 Reference 無法滿足實際工作流，或網站內整合能取得額外、可用的 Response／Evidence；
3. 最小 prototype 可沿用現有 SGF parser、原著資料與 first-response 語義，不建立第二套 source of truth；
4. 初期只作 `practice_only`，不直接更新 KC、scheduler、T2/T3 或 formal evaluation。

在上述 bottleneck 未出現前，優先順序仍依本檔既有 gate：開發期 formative observation 可持續，但不阻擋必要工程；R1a 外部內容審查與 candidate 凍結後的正式真人教學證據，仍先於把連續復盤升為正式能力。


## 2026-09-26 Decision note｜經典名型只作 P1/P2 教學 UX scaffold

第 4 單元新增的「經典眼形探索」只處理可觀察的教學 UX 缺口：避免題名前置洩漏名型、提供旋轉／攻守交換及相似反例。它不改 R0、R1a、R1b、formal holdout、scheduler 或 live evidence；開發期間可持續以 formative observation 檢查是否增加負擔，但不把這些零散觀察升格成正式 usability evidence。正式三位初學者驗證留到 candidate 凍結後的第 4c 步。


## 2026-09-26 Decision note｜開發期觀察與正式 usability gate 分離

- **改動：** 原「第 2 步三次短任務觀察」改為持續 formative observation，不設三次完成門檻，也不阻擋工程／內容迭代；正式至少三位 target novice 的 usability evidence 移到 candidate version 凍結後、正式教學前的第 4c gate。
- **理由：** 邊觀察邊修改會讓不同觀察對應不同 UI／content version；若直接合併，無法知道正式證據支持哪個 candidate。
- **不變項：** `TEACHING_GATE` 的三位初學者、五項 critical tasks、真人 accessibility spot check、R1a 與 blocking issue 要求完全不降低。
- **失效規則：** 正式觀察後若因 blocking issue 修改會影響 critical task 的 learner-facing 行為，受影響觀察須在新 candidate 重做；開發期 formative observation 不補進正式分母。


## 2026-09-27 Decision note｜世界死活名型館採 catalog-first，不以翻譯直接生題

多語名型目前是 Experience／reference 工作線，不是新 KC 或 formal evaluation。新增名型須依序通過：`名稱來源 → 棋形幾何 identity → 先後手／外氣／規則敏感性 → scoring/variation contract → negative oracle → practice`。若只有術語來源而沒有幾何對照，標 `needs_review`；若像盤角曲四受 ruleset 影響，先建立 ruleset-aware contract；若像木匠方有多分支，先建立 branch/variation oracle。任何一步缺失都不得用 LLM 翻譯或固定座標序列補成看似可評分的題目。


## 2026-09-27 Decision note｜中文命名與可評分資格分離

世界名型新增兩個獨立 gate：第一個是 nomenclature gate，確認來源語名稱、中文既有名／候選別名／描述性翻譯與來源層級；第二個才是 geometry/scoring gate。即使名稱已有多語對照，若標準幾何、先後手、外氣、ruleset 或主要 variation 尚未驗證，仍只能是 catalog-only。反之，沒有固定中文專名也不阻止圖鑑收錄：保留來源語原名，中文只提供明示為 descriptive translation 的解釋。任何 teaching translation 都不得回填成 established 中文名。


## 2026-09-27 Decision note｜名型館第一個 geometry-backed practice：刀把五

刀把五從 nomenclature gate 往 geometry/scoring gate 前進，但只建立 `classic-vital-point-v1`：五點眼空必須與 P-pentomino 同構，唯一 degree-3 眼空點才是 bounded vital point；rules engine 另驗 setup 與所有候選點合法。四個 variant 只測守／攻角色與方向改變後是否仍找到同一結構急所。這不是完整 life/death solver，也不允許把四題完成升格為 mastery、transfer、T2/T3 或 formal evaluation。完整做活／殺棋需下一層 variation/branch contract。


## 2026-09-27 Decision note｜刀把五從急所辨識進到三手 A/B short-read

在 `classic-vital-point-v1` 之上新增 `classic-bulky-five-short-read-v1`。只有來源明確支持的 A/B 互補主分支進 scoring：攻方先佔 vital point，守方若選 A/B 之一，攻方補另一點。A/B 由 geometry 推導而非 UI 座標；rules engine 必須重播三手合法。任何未列守方抵抗維持 UNKNOWN，不使用最近點、固定座標或 LLM 推測 fallback。若要再升格完整 life/death，下一步必須建立更完整 branch tree、終局／提子結果與外氣 negative oracle。


## 2026-09-27 Decision note｜刀把五 sealed reduction 只在零外氣成立

在 A/B short-read 之上新增 `classic-bulky-five-sealed-reduction-v1`，但不泛化到所有刀把五。只有 defender group 的 liberties 恰为五個眼空、沒有外氣時，才允許「攻方填滿 2×2 core → 守方被迫在突出點提四子 → terminal square four」這條分支進 scoring。測試必須同時證明有外氣時 forced capture 不成立。任何未列抵抗、角部條件或 ruleset 差異仍維持 UNKNOWN。


## 2026-09-27 Decision note｜第二個 geometry-backed family：梅花五 / Cross Five

刀把五已有多層 branch 後，下一個可觀察 bottleneck 是名型館缺跨 family 變異，因此新增梅花五第一層 bounded practice，而不是繼續加深單一 family。`classic-cross-five-vital-point-v1` 只接受十字五點 geometry，且唯一 degree-4 中心才是急所；variant 必須改變至少角色、棋色或位置之一。非十字形、錯中心或沿用舊座標一律 fail。這是 Experience 層擴充，不建立 KC mastery 或 transfer claim；若真人資料顯示無法區分 knife-five 與 cross-five，再決定是否需要更明確的 contrastive practice。


## 2026-09-27 Decision note｜先做 interleaved contrast，再增加第三個新 family

刀把五與梅花五已各有獨立 geometry/scoring contract，但分區 UI 仍可能洩漏 family cue。下一步先新增 6 題 interleaved contrast practice：首答前 family hidden，round 僅引用既有 item，評分委託原 contract，禁止複製答案欄位。這一層只改善 Experience 的比較條件；不寫 learner model，不影響 scheduler，不作 T2/T3 或 formal evaluation。若真人仍混淆兩 family，再評估 contrastive feedback 或第三 family；若沒有觀察到 bottleneck，不以 family 數量作進展代理。


## 2026-09-27 Decision note｜variation axes 不統一成固定四步

直三現有四段探索只是該 family 的 teaching sequence；刀把五、梅花五與後續名型不得為了 UI 一致性被迫套用同樣四步。每個 family 的 variation axes 仍由 geometry、role、orientation、ruleset、branch contract 與已驗來源決定。UI 若使用進度列，必須標明其 family scope，避免學習者把局部流程誤解為世界名型館共通規則。


## 2026-09-27 Decision note｜正式 usability 先凍結 candidate，再收三位證據

正式三位初學者與 accessibility spot check 必須使用 `formal-teaching-candidate.json` 指定的同一 candidate。`formal-teaching-candidate.cjs` 對五項 critical tasks 所依賴的 Core learner-facing assets 重算 deterministic fingerprint；CI 與 teaching gate 都 fail closed。若任何 critical flow／content／storage／export 依賴檔改動，先建立新 candidate fingerprint，再重新收集受影響的正式證據；不得把不同 candidate 的 participant 紀錄拼成同一分母。這只處理 evidence integrity，不降低 R1a、真人 usability 或 accessibility gate。


## 2026-09-27 Decision note｜R1a receipt 必須綁 reviewer-visible semantics

第 4 步 R1a 的 content fingerprint 已升 v5。審查身份不只取決於答案與棋盤；`prompt`／`focus`、family／skill identity 也屬於審查者所判斷的內容語義。任何這些欄位改動都必須使舊 receipt 失效並重新審查；不得只靠未 bump 的 contentVersion 延續舊證據。blinded bank 繼續不載入答案／goal／scoring identity，以維持 answer-blind 邊界。


## 2026-09-27 Decision note｜金雞獨立採 rules-backed mechanism，Tripod 因授權停止升格

- **候選盤點：** 盤角曲四仍需 ruleset-aware contract；斗方／Carpenter's Square 仍需 variation tree；Long L／帶鉤受外氣條件影響；大／小豬嘴與葡萄六的 geometry identity 尚不足；Tripod Group 有名稱來源與 GNU Go regression，但 GNU Go repository 明示預設 GPLv3，且相關 SGF 在該 repository 內未能辨明為 public domain。
- **授權停止線：** 不把 GNU Go `tripod2.sgf`、其完整 setup 或其他 GPL／授權不明題目資產複製到本 MIT repository。外部 engine／regression 可以作研究 reference，但不能因此取得 shipping authority。Tripod 本輪維持 catalog-only。
- **本輪選擇：** 金雞獨立的核心可操作化為規則機制，而非複製特定外部題圖：己方原串只有一氣；在邊線「立」後不立即提子且恰好變兩氣；對手若填任一側都因自身無氣且未提子而非法；己方反而可在任一側提兩子。
- **實作契約：** `classic-golden-chicken-mechanism-v1` 使用專案原創 7×7 setup，由 `go.js` 重算上述五個條件；practice variant 只保存 rotation／color-swap，不保存答案或 setup 副本。wrong geometry、wrong legal move 與旋轉後沿用舊座標都必須 fail。
- **證據邊界：** 這只支持一個 bounded tesuji Experience 的工程／規則契約。外部來源支持名稱與 double-shortage mechanism，不證明本站棋形是唯一標準形，不建立完整死活答案樹、KC、mastery、transfer、T2/T3、formal evaluation 或 learning effect。
- **Validation：** PR #28 initial verify run #445 全數 PASS，包含 Windows file-URL UI、Edge smoke 與 repository boundary；正式教學 gate 仍為 BLOCKED。


## 2026-09-27 Decision note｜大豬嘴只先升格 exact source-case，不把 J Group 寫成單一答案

- **來源分工：** Go4Go／華語術語表與《圍棋死活一月通》書目支持「大豬嘴 ↔ J Group」的名稱／family 關係；中文教學資料支持「大豬嘴，扳點死」是經典角部死活機制。另有 MIT `bood/go-test` regression 把 `大猪嘴.sgf` 標成 `j_group_live2`，並在 `loadsgf ... 52` 前要求白棋走 R1。
- **Authority boundary：** 前兩類來源不提供本專案可直接 shipping 的完整標準 geometry；MIT regression 則只提供一個 exact position 的 executable oracle。因此本輪 canonical identity 是該 19×19 source position，不是「J Group 的標準圖」。
- **實作：** `classic-big-pigs-mouth-source-case-v1` 保存 reconstructed exact board state、expected R1 與三個旋轉等價；UI 只裁角部 viewport。item 不保存 setup／answer，評分由 contract 重新 materialize。
- **反證：** 少一顆 source stone、合法但非 expected move、旋轉後沿用原 R1、item 偷塞 answer 都 fail closed。
- **授權：** 上游為 MIT；`THIRD_PARTY_NOTICES.md` 保存 repository、commit、使用檔案、copyright 與 license。這和先前 GNU Go Tripod 的 GPL／public-domain 不明案例不同。
- **停止線：** 此 PASS 不能推出「R1 是所有大豬嘴答案」、不能證明標準 family geometry、不能證明完整扳→點→立→撲 branch，也不產生 KC、mastery、transfer、formal evaluation 或 learning effect。


## 2026-09-27 Decision note｜J Group family 升級 BLOCKED，改補丁四 / Pyramid Four geometry contract

- **J Group 停止線：** 中文來源一致支持「大豬嘴，扳點死」及典型扳→點→立→撲；英語資料則另列 J Group with hane、Straight J、ko 等 family 變體。除已合併的 MIT exact source-case 外，本輪仍缺第二組可機讀、授權清楚且足以證明共享 geometry／branch 的 oracle，因此不得把 source-case 升格成整個 J Group。
- **替代 bottleneck：** 基礎 nakade playable set 尚缺四目 T 型。Go4Go／YeeFan 明確把「丁四」對應 Pyramid Four；YeeFan 定義它為 T-shaped four-space eye，中央為共同急所；BGA 文章亦把 pyramid four 作為既定 nakade。
- **Contract：** `classic-pyramid-four-vital-point-v1` 只接受 T tetromino canonical signature；答案由唯一 degree-3 center 推導，item 禁止保存 `vitalPoint`、`answer`、`correctMove`。
- **反證：** 直四 geometry、偷偷塞 vitalPoint、位移後沿用 seed coordinate 都必須 fail。
- **證據邊界：** 只支持丁四 bounded first-move Experience 的工程／geometry contract；完整 reduction sequence、內容效度、mastery、retention／transfer、formal evaluation 與 learning effect 均未建立。
- **Validation：** PR #30 initial verify run #450 全數 PASS，包含 Windows file-URL UI、Edge smoke 與 repository boundary；正式 teaching gate 仍為 BLOCKED。


## 2026-09-27 Decision note｜名型館從翻譯表升級為 versioned concept ontology

- **Bottleneck：** `zhNameStatus` 能阻止部分錯譯，但無法表達所有語言的 established／rare／descriptive 差異，也把 name evidence、geometry、ruleset 與 regional preference 混在同一 entry。
- **Source independence：** Go4Go 的 Chinese Go Terms 頁面明示其資料 copy 自 YeeFan；因此 `source URL != independent Evidence Unit`。Ontology source 增加 `evidenceChain`，同鏈來源不能因網址數量提升 evidence strength。
- **Canonical schema：** 新 `classic-shapes-ontology-v2` 使用 `entityType + names[] + nameResearch[] + geometryIdentity + rulesetBehavior[] + negativeMappings[] + sourceIds`。舊 `preferredZhTW / zhNameStatus / aliases / rulesetSensitive` 只由 adapter 衍生。
- **關鍵修正：** Carpenter's Square 的繁中 regional preference 保持 unresolved；小豬嘴 mapping 收斂到 Tripod Group with Extra Leg 並禁止自動 alias plain Tripod Group；金雞獨立固定為 `tesuji_mechanism`；Cross Five／Crossed Five 分開保存 provenance；Long L 的緊／寬帶鉤掛到 `outsideLiberties` condition。
- **負面主張：** L Group／L+1／Tripod 的中文名狀態改成 dated search result；UI 必須寫「截至日期尚未找到」，不得寫「沒有固定中文名」。
- **不可破壞 invariant：** 所有 existing practice/scoring contract、first response、learner events、KC、scheduler、T2/T3、formal evaluation 與 storage schema 不變。Ontology 不取得 board truth/scoring authority。
- **反證：** tests 必須證明 catalog entries 不是手寫第二套 source、Carpenter preferredZhTW 為 null、小豬嘴 plain Tripod 有 negative mapping、Bent Four ruleset flag 從 rulesetBehavior 衍生、同 evidence chain 不得當成多份獨立來源。
- **Rollback：** 恢復上一版 catalog 與移除 ontology script 即可，不需 learner data migration。
- **Validation：** PR #31 initial verify run #454 全數 PASS，包含 Windows file-URL UI、Edge smoke 與 repository boundary；正式 teaching gate 仍為 BLOCKED。

## 2026-09-27 Decision note｜Ontology v3：名稱歧義與多套 taxonomy 成為一級資料

- **Bottleneck：** v2 能分離 name／geometry／ruleset，但仍假設一個 name record 最終會指向單一 concept，且 concept 之間只靠隱含 family 文字關聯。`小曲尺` 顯示這個假設不成立。
- **外部 QA：** 日本專業教學使用「隅のL字型」；BadukWorld 將 `작은 됫박형` 直接譯為 L Group，並把 L+1、L+2、Long L、J、Straight J 列成延伸系列；2007 臺灣舊英中術語鏈則把 Carpenter's Square 對到「小曲尺」，另一中文教材稱「小曲尺是死棋」。
- **Canonical schema v3：** 新增 `nameAmbiguities[]`、`nameRelations[]`、每 concept 的 `taxonomyMemberships[]`、全域 `taxonomyRelations[]` 與 `geometryRelations[]`。名稱關係、taxonomy 關係與 geometry 關係不可互相自動升格。
- **第一個 ambiguity record：** `小曲尺` → candidates = `carpenters-square-v1`、`l-group-v1`；狀態 `ambiguous_historical_mapping`；resolution requirement = `geometry_required`。這不是宣告兩者同形。
- **Source-specific taxonomy：** BadukWorld 的 `small-carpenter-like-series` 只作該教材的 teaching taxonomy；L+1、Long L、J 可屬該系列，同時保留各自 canonical concept。
- **Geometry stop line：** L Group ↔ Carpenter's Square 只記 `related_unresolved`；taxonomy distinction／名稱相似都不能決定 parent／variant。
- **不可破壞 invariant：** practice/scoring contracts、first response、learner events、KC、scheduler、storage、T2/T3、formal evaluation 全部不變。
- **下一個研究方法：** 文字搜尋只繼續服務 names／taxonomy provenance；若要解除 `geometry_required`，必須轉成 geometry-first retrieval、座標 normalize 與獨立 fingerprint review。
- **Validation：** PR #32 verify run #459 全數 PASS，包含 Windows file-URL UI、Edge smoke 與 repository boundary；正式 teaching gate 仍為 BLOCKED。

## 2026-09-27 Decision note｜Geometry-first fingerprint v1

- **Bottleneck：** Ontology 已能正確保存名稱歧義，但仍沒有可重算的 geometry comparison path；繼續文字搜尋無法解除 `geometry_required`。
- **實作：** 新增 `classic-geometry-fingerprint.js`：point-set translation + D4 canonicalization、board-context signature、strict／shape-only compare、candidate resolver。
- **Evidence registry：** 新增 `classic-geometry-evidence.js`；來源必須明示 `geometry_verified_from_contract`、`diagram_requires_extraction` 或 `text_only_geometry_unavailable`。
- **Positive oracle：** 丁四、刀把五、梅花五、花六由既有 bounded contract geometry 產生 fingerprint；旋轉、鏡射、平移必須同形，不同 polyomino 必須不同。
- **Negative oracle：** 小曲尺舊術語、BadukWorld L Group 文字敘述、Carpenter Diagram 2.1 在未保存座標前都必須回 `INSUFFICIENT_GEOMETRY_EVIDENCE`；不得由名稱或生死結論補 geometry。
- **Authority boundary：** fingerprint 只能回答『這兩份已結構化 geometry 是否等價』；不能決定死活答案、family taxonomy、regional name、scoring、KC 或 mastery。
- **下一步：** 尋找可合法保存／人工轉錄且具 provenance 的 L Group／Carpenter geometry source，先完成座標提取 protocol，再嘗試解除小曲尺 ambiguity。
- **Validation：** PR #33 verify run #465 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。

## 2026-09-27 Decision note｜Geometry extraction gate v1

- **Bottleneck：** geometry fingerprint 只能保證 normalization 正確；若 diagram／SGF 的座標轉錄本身錯誤或來源權利不清，仍會把壞 evidence 穩定地 fingerprint。
- **實作：** 新增 `classic-geometry-extraction.js`，版本化 extraction method、rights status、review status、payload signature、independent review 與 public promotion gate。
- **人工轉錄：** 單份不能升格；兩個不同 reviewKey 的轉錄必須 canonical payload 完全相同。不同即 `CONFLICT`，不採多數決。
- **來源不可變性：** promotion batch 必須共用同一 `sourceDigest`；來源版本不同不得互相充當覆核。`verified_reusable` 必須帶 `rightsEvidence`，避免只改狀態字串繞過 gate。
- **Deterministic source：** SGF parse／source-native coordinates 可免第二份人工轉錄，但只在 `verified_reusable` 權利與 deterministic source flag 同時成立時。
- **Public boundary：** `unknown`／`reference_only` 來源衍生 geometry 不得進公開 registry；可作 non-shipping reference/oracle。現有 BadukWorld geometry source 暫標 `unknown`。
- **Context gate：** corner 需要兩個 board boundaries；side 需要至少一個 boundary。缺失即 INVALID，不能拿 shape-only match 冒充完整局面等價。
- **反證：** single manual、same reviewKey、independent conflict、unknown rights、corner missing boundary 全部必須 fail closed。
- **下一步：** 研究可合法重用的 L Group／Carpenter／Comb geometry source；若只有 reference-only source，建立 external oracle workflow 而非把其座標複製入 repo。
- **Validation：** PR #34 verify run #469 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。

## 2026-09-27 Decision note｜Reference-only geometry oracle v1

- **Bottleneck：** extraction gate 對 rights=unknown/reference-only 正確阻止 shipping，但若完全不能利用這些來源，geometry-first research 會失去大量候選／反證材料。
- **實作：** `classic-geometry-reference-oracle.js` 只在記憶中使用 observation geometry，比對後輸出 sanitized report。
- **持久化邊界：** report 禁止 points、stones、shape/context signature、fingerprint、raw observation；`authority=reference_oracle_only`、`canonicalPromotionAllowed=false`。
- **證據獨立性：** aggregation 以 `evidenceChain` 去重，不以 URL／sourceDigest 數量灌票。
- **一致結果：** 兩條以上獨立 decisive oracle 同方向可標 `CONSISTENT_REFERENCE_SUPPORT`，只作 research prioritization，不升格 canonical geometry。
- **衝突結果：** MATCH／DIFFERENT 跨獨立 chain 衝突時回 `CONFLICTING_REFERENCE_ORACLES`，不得選邊。
- **下一步：** 用此 workflow 研究 L Group／Carpenter／Comb／Notcher 候選來源；只有取得可重用權利或 project-generated independent geometry 後才進 public geometry registry。
- **Validation：** PR #35 verify run #473 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。


## 2026-09-27 Step 4 execution note｜R1a 已具可交付審查入口

- Step 4 的 machine contract 原本已存在，但外部 reviewer 缺一個不必先進 repository 的乾淨起點。現在以 `r1-review-start.html` 固定 reviewer-facing protocol/fingerprint、77 題母體、answer-blind 規則與停止線。
- handoff → `r1-review.html` → `R1_獨立審題回條.json` → `r1-review-verify.cjs` 構成完整可執行交接鏈。
- 本步目前狀態：**READY_FOR_EXTERNAL_REVIEW / BLOCKED_ON_HUMAN_RECEIPT**。自動測試與 handoff 完整性不能替代真人內容審查。
- 下一個真正的狀態轉換只接受外部 reviewer 回條；若任一題為需修／歧義／多解或建議落子不同，先修內容與升版，不能直接進 4c。

## 2026-09-28 Decision note｜L Group 保持 BLOCKED，曲三 / Bent Three 升格 bounded practice

- **L Group stop line：** 英／日／韓資料已足以支持 L Group 名稱與基礎教學概念，BGA／OGS 也描述六點角部死形；但目前仍缺 rights/provenance 清楚且可重算的 canonical geometry，因此不手寫答案、不從受限圖示抄座標。
- **替代 playable bottleneck：** 曲三的名稱、geometry 與共同急所更成熟。YeeFan／Go4Go 明列「曲三 = Bent Three」；日本棋院有三目中手基礎教材；英語教學資料直接描述 L 形三點與彎點急所。
- **Contract：** `classic-bent-three-vital-point-v1` 只接受 L triomino；唯一 degree-2 bend 是 scoring vital point，item 禁止 `vitalPoint`／`answer`／`correctMove`。
- **反證：** 直三 geometry 必須 fail、偷塞答案 fail、位移後使用 seed 座標判錯。
- **Variation axes：** attack/defense、black/white、rotation、position shift；表面座標改變後仍須依 geometry 找彎點。
- **證據邊界：** 只支持 bounded first-move geometry contract。完整 sequence、內容效度、真人 usability、retention／transfer、formal evaluation 與 learning effect 均未建立。
- **Validation：** PR #43 verify run #499 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。

## 2026-09-28 Decision note｜方四 / 直四改用 status proof，不套 vital-point 模板

- **Bottleneck：** playable families 增加後，若所有 UI 都是『找唯一急所』，會把不成立的策略教成固定規則。方四沒有做活急所；直四有兩個 miai 做眼點。
- **來源衝突：** 部分近期英語網站把 Square Four 寫成 always alive，但 Board to Bits、中文教材與其他死活資料一致指出 sealed 2×2 Square Four 是死形。因來源衝突，本輪不採多數投票，回到 rules-backed proof。
- **Contract：** `classic-four-space-status-v1` 支援 O-tetromino 方四與 I-tetromino 直四；item 禁止保存 `answer`／`expectedStatus`／`status`／`correctChoice`。
- **方四 proof：** 守方四種第一手逐一重播；每一支剩餘三空都必須同構曲三，且攻方唯一彎點回應合法。結果導出 `dead`。
- **直四 proof：** 攻方四種第一手逐一重播；每一支守方至少存在一手合法回應，使剩餘兩眼點互不相鄰。結果導出 `alive`。
- **Context gate：** 只接受完全包圍、無缺陷的 sealed eye-space；不把這個局部 proof 外推到外氣、斷點、角邊特殊條件或全局連接。
- **UX：** 此區使用『活／死』狀態判斷，棋盤只供觀察；正答後才揭名與 proof 摘要。
- **反證：** wrong geometry、錯 shapeKind、item 偷塞 expectedStatus、錯誤狀態回答均 fail closed。
- **真人 gate：** R1a、三位初學者 usability、真人 accessibility 依使用者決定延後到最後階段；本步不修改 teaching gate。
- **Validation：** PR #44 verify run #505 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。

## 2026-09-28 Decision note｜曲四加入四目眼 status contrast，與盤角曲四硬分離

- **Bottleneck：** 方四／直四已涵蓋死形與直線活形，但尚未驗證『彎折 topology 也能無條件活』；若缺此反例，學習者可能把直線外觀誤當成活形必要條件。
- **來源：** Chen & Chen (1999) 將 perfect Curved-Four 列為 2-eye region；中文教材亦把曲四與直四並列活形。Go4Go 的 `彎四 -> bent four` 僅作名稱鏈，不能與 `Bent Four in the Corner` 合併。
- **Contract：** 新增獨立 `classic-curved-four-status-v1`，只接受 sealed L-tetromino 四點 eye-space；不修改 `classic-four-space-status-v1` 歷史語義。
- **Proof：** 對攻方四種第一手逐一重播；每一支守方至少有一個合法回應，使剩餘兩個 eye points 互不相鄰。結果導出 `alive`。
- **Negative mapping：** Curved Four / Bent Four ≠ Bent Four in the Corner；後者保留 `rules_sensitive_position` 與 ruleset/adjudication contract。
- **UX：** 曲四作為既有 status contrast 第 5、6 題；前四題方四／直四不改。
- **反證：** 方四 geometry、直四 geometry、偷塞 expectedStatus 均不得通過曲四 contract。
- **真人 gate：** R1a、三位初學者 usability、真人 accessibility 延後到最後階段，不由本工程補成已驗。
- **Validation：** PR #49 verify run #510 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。


## 2026-09-28 Decision note｜Comb Formation / Notcher 只先完成 nomenclature + taxonomy gate

- **目前步驟：** 仍屬世界死活名型館的 catalog/reference 工作線，沒有跳到 scoring 或正式教學。Ontology v4 把 `Comb Formation` 與 `Three-Space Notcher` 建成兩個獨立 concept。
- **名稱 gate：** `梳形 ↔ Comb Formation`、`櫛形 ↔ Comb Formation` 可保存直接來源支持；韓文 `빗형` 與 `판륙` 同時保留其來源差異，不用翻譯投票消歧。
- **Taxonomy gate：** Comb 與 Three-Space Notcher 的相關性只保存為 source-specific、partial relation；不得因此生成 `SAME/VARIANT_OF` geometry relation。
- **停止線：** `鎖型 = Notcher` 保持未確認；Comb/Notcher 沒有通過 geometry extraction/fingerprint 前只可 catalog-only。任何後續 playable 工作都必須重新走 geometry identity → conditions/ruleset → scoring/variation contract → negative oracle。
- **下一個可推進條件：** 取得 rights/provenance 清楚的 geometry source，或建立可在 reference-only oracle 中比較、但不持久化來源座標的獨立 observation；否則不靠更多文字來源強行解除 geometry unknown。
- **不變：** 這一輪不影響 R0、R1a/R1b、正式 usability gate、learner state、scheduler、T2/T3 或 formal evaluation。


## 2026-09-28 Decision note｜小曲尺 geometry-first 研究的正確下一步改為『先獨立建模，再等 geometry』

- **研究結果：** 文字搜尋沒有解除 geometry unknown，反而揭露原先二選一問題定義過窄：中文「小曲尺」有自身教學用法與曲尺型系列脈絡，因此先建立中文 candidate concept。
- **目前 gate：** nomenclature/taxonomy 可更新；geometry/scoring 不更新。`小曲尺 ↔ L Group`、`小曲尺 ↔ Carpenter's Square` 都保持 `RELATED_UNRESOLVED`。
- **下一個可解除 UNKNOWN 的條件：** 取得同一來源版本、provenance 清楚的實際圖形 observation；若 rights 只允許 reference use，就走 reference-only oracle 並只持久化 sanitized report；若 rights 可重用，再走 extraction independent review → fingerprint。
- **停止線：** 不再用『都是死棋』『都像小曲尺』『名稱含 small』等語義線索代替 geometry。若未取得圖形，這一研究分支到此停止，不以更多同義搜尋灌高 confidence。
- **Formal boundary：** 不改 learner state、KC、scheduler、T0–T3、R1、formal teaching candidate 或 formal evaluation。


## 2026-09-28 Decision note｜Reference evidence aggregation 先鎖 representation

- external page capture → immutable source digest → embedded SGF parse → explicit representation contract → reference oracle → sanitized report。
- 任兩份 reference reports 聚合前必須同 candidate、同 `comparisonContractId`、同 context policy；否則 fail closed。
- `corner-defender-connected-group-v1` 只回答角部 defender connected stones 是否同構且 context 相符；不能替代 eye-space、full-position 或 mechanism comparison。
- 單一來源只算一條 evidence chain；至少兩條獨立 decisive reports 同方向才是 consistent reference support，而且仍不得 canonical promote。


## 2026-09-28 Decision note｜L Group source receipt gate

- **已通過：** public page identity → immutable digest → embedded SGF parse → setup parse → sanitized source receipt。
- **尚未通過：** source observation → representation assignment → candidate geometry comparison。`comparisonContractId` 未定時禁止呼叫成正式 L Group MATCH/DIFFERENT evidence。
- **不得灌票：** 同一 collection／同一 editorial source 的多題只算同一 evidence chain；鏡像、不同 URL、不同 digest 也不能提升 independence。
- **第二來源停止線：** suite-level 描述（例如『L groups covered』）不足以把未標名的 SGF 自動指定成 L Group；需要 direct locator 或可審查的 source-to-geometry mapping。


## 2026-09-28 Decision note｜BGA Figure 1 intake gate

- 已有 direct locator：British Go Journal 116〈Counting Liberties: The L group〉Figure 1；正文直接把該 Figure 稱為 L group。
- 尚缺 structured observation：未可靠取得 Figure 1 座標前，只能算 documentary source-to-concept evidence，不能產生 shape MATCH/DIFFERENT。
- 任何後續 extraction 必須 reference-only、不可把受權利限制的原圖直接 shipping；持久化仍只允許 sanitized receipt/report。
- 只有 BGA 與 Tsumego Hero 都被轉成相同 `comparisonContractId` 的 decisive reports 後，才允許進 `aggregatePersistableReports`。


## 2026-09-29 Decision note｜Candidate provenance gate

- reference candidate 必須記住其建立所依賴的 evidence chain；該 chain 在 aggregation 時排除，不得同時當 seed 與 independent confirmation。
- 角部 defender-group comparison 統一使用 `corner-defender-connected-group-normalized-v2`：先把來源角落正規化成 common local corner frame，再比較 shape + context。
- defender connected stones、eye-space、full-position、mechanism 是不同 representation；只有同一 `comparisonContractId` 的 reports 才可聚合。
- BGA Figure 1 可作 candidate seed／source-to-concept evidence；下一條 Tsumego Hero deterministic SGF observation 才能作第一條 independent geometry validation。
- 至少還需要另一條不依賴 BGA seed 的 independent decisive chain，才可能形成 `CONSISTENT_REFERENCE_SUPPORT`；即便形成，仍維持 `canonicalPromotionAllowed=false`。


## 2026-09-29 Decision note｜L Group defender-group hypothesis failed as family-wide invariant

- BGA Figure 1 seed → normalized defender-group hypothesis；Tsumego Hero 32 → deterministic SGF observation。
- 在 `corner-defender-connected-group-normalized-v3` 下結果為 `REFERENCE_DIFFERENT`。這是一個有效反證：不可把 exact defender connected stones 當成整個 L Group family 的已驗 identity。
- 不得用「同一 collection 再挑一題」作事後救援；若改用 base-shape、eye-space、enclosed-region 或 mechanism representation，必須先定義新 contract，再依事前 locator／selection rule 重新取證。
- embedded SGF digest 是 geometry provenance；整頁 HTML digest 只可作 page-level 診斷，不作 geometry source version。
- BGA seed chain 不算 independent confirmation；目前 aggregation 維持 `INSUFFICIENT`。下一步優先找第三條直接 diagram/SGF source，或建立有來源支持的新 representation hypothesis。


## 2026-09-29 Decision note｜L Group core hypothesis gate

- `lgroup-source-marked-l-tetromino-core-v1` 只處理 source-direct / source-native-marked 的四子 L core；不允許從較大未標記 group 推測 subset。
- BGA Figure 1 = seed，不算 independent vote；OGS 直接標示 arrangement = L group，作第一條 independent decisive MATCH。
- IGOcompany 圖雖有 source-native 四子方框 L pattern，但 mark semantics 尚未獨立覆核，只能 supporting / `NEEDS_HUMAN_REVIEW`。
- aggregate 仍 `INSUFFICIENT`；禁止 canonical promotion、playable scoring 或 learner-runtime wiring。
- 下一步只接受：人工覆核日本 mark semantics，或另一條 independent direct base-shape source；不再用 Tsumego 15362 的 unmarked larger group 湊 core match。

## 2026-09-29 Decision note｜Classic shapes IA gate

- 「棋形練習」與「世界名型對照」在同一入口下分成 sibling modes：`#practice` / `#atlas`。atlas 的可達性不再依賴 practice 區塊總高度。
- 名型 atlas 是 reference surface；practice 仍保留首答前的名稱線索控制。切換到 atlas 是使用者明確查詢行為，不回寫 learner state／scheduler，也不改該題 exposure／formal eligibility。
- 第一階段只改 IA，不把十多個已各自有 bounded scoring contract 的 practice 強行重構成單一 engine。若日後 practice 維護重複成為實際 bottleneck，再另做資料驅動共用舞台。
- UI 自動測試通過只證明 mode routing、隱藏／顯示與 existing reveal invariant；真人是否更容易找到目標仍標 NOT_TESTED。


## 2026-09-29 Decision note｜L Group mark-semantics human gate

- 任何「L Group／隅のL字型」來源先標 `labelScope`：`target_group`、`marked_subset` 或 `position_only`；不得從 position label 自動補成 group/core identity。
- 恩田烈彦專業講座加入 `position_only` boundary evidence：它能支持「這類較大角部局面被教材稱為 L 字型」，不能支持或反駁 4-stone core。
- IGOcompany 四個方框目前同樣維持 `position_only + NEEDS_HUMAN_REVIEW`；只有通過 `lgroup-mark-semantics-review-v1` 的獨立真人回條才能改成 `marked_subset` evidence。
- 回條若判 `marks_define_named_l_core`：可把該 source 升為第二條 independent decisive research support，但仍不得 canonical promote；若 `marks_have_other_semantics` 則拒絕此 source 的 core interpretation；若 `unclear_from_source` 則維持現況。
- 在 receipt 出現前，aggregate 固定 `INSUFFICIENT`。不要再以更多同義來源、collection 題目或 position-only 圖片湊 evidence count。


## 2026-09-29 Decision note｜Final-phase human review policy

- 開發／研究期間先完成：可自動重現的工程、rules/scoring contracts、negative tests、provenance、rights boundary、reference-only receipts、rollback 與 current-truth 同步。
- 所有需要真人判定的工作統一排入最後階段：R1a、R1b 真人難度、三位 target novice usability、真人 accessibility、mark-semantics review、人工棋理／內容覆核。
- 中途遇到人工缺口時：
  1. 先標記 `DEFERRED_TO_FINAL_REVIEW` 與既有證據狀態；
  2. 若後續工程不依賴該人工判定，可繼續；
  3. 若人工判定會改變正式 truth/scoring/eligibility，相關升格路徑保持 BLOCKED。
- final review 開始前不重複要求人工回條，也不把同一人工缺口當作每個工程步驟的停止點。

## 2026-09-29 Change note｜Private unseen formal evaluation verifier v1

- **bottleneck：** 公開 holdout 已因 publication 全部退役，但 formal evaluation gate 原先只靠 `privateUnexposedHoldoutEstablished=true` 加文字 evidence reference，無法 machine-verify private pool 是否真的存在、是否在 outcomes 前凍結、是否未公開／未呈現，以及是否與同輪 scheduler／教學調整分離。
- **公開 contract：** 新增 `formal-evaluation-verify.cjs`。未來只能在本機以 private manifest + private item files 驗證；逐檔 SHA-256、唯一 item ID、private-root path confinement、pool/version、scoring/evidence-taxonomy version 都需一致。
- **evidence-integrity declarations：** manifest 必須是 `never_public_never_presented`、`independent_evaluation`、`no_same_round_updates`、`locked_before_outcomes`，且 `frozenBeforeOutcomes=true`；缺一項即 fail closed。
- **Public/Private Hard Wall：** 真正 private 題目、答案與 manifest 只能放在 `.private-evaluation/`，該目錄同時加入 Git ignore 與 release exclusion；公開 repo 只保存 verifier 與 synthetic tests。
- **gate hardening：** `teaching-gate-verify.cjs` 不再接受單純手填 private-holdout boolean 作 formal evaluation 證據；必須另有同次本機 verifier 的有效結果。R1b 仍是獨立條件，不能由 private pool 存在自動升格。
- **目前狀態不變：** 本輪沒有建立任何真正 private evaluation item／manifest，也沒有真人資料；`replacementPrivateHoldout=not_established`、R1b=`not_established`、formal evaluation=`BLOCKED`、learning effect=`NOT_MEASURED`。formal teaching candidate 不需重凍結，因 learner-facing critical surface 未變。


## 2026-09-29 Decision note｜Private pool freeze gate

- 最後階段若建立 private unseen evaluation pool，固定流程為：private item files → draft manifest → `formal-evaluation-freeze.cjs` → immutable frozen manifest → `formal-evaluation-verify.cjs` → 才允許開始 outcome collection。
- draft 不得攜帶 item hash 或 evidence-integrity declarations；這些由 freeze builder 根據實際檔案與固定 contract 產生。
- `outcomes/` 只要已有任何檔案，就禁止首次／補寫 freeze；避免看結果後才宣稱 pool 事前鎖定。
- frozen manifest 不可覆寫；任何題目、scoring contract 或 evidence taxonomy 改變，都必須建立新 pool/version。
- private item／manifest／outcomes 持續位於 `.private-evaluation/` hard wall 內，不列入 public release。
- 這是 final-phase tooling readiness，不是 private holdout evidence；沒有真實 private pool 時 formal evaluation 繼續 `BLOCKED`。
