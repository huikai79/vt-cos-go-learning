2026-09-29 KaTrain Smoke Autodiscovery v1：Real KataGo receipt gate 已 ready，但 Windows 使用者仍需人工提供 executable/config/model 三條路徑。KaTrain 1.20.0 官方設定以 `~/.katrain/config.json` 保存 engine 設定，bundled Windows engine 使用 `katrain/KataGo/katago.exe`、分析設定預設 `katrain/KataGo/analysis_config.cfg`、模型使用 `katrain/models/...` package resource。新增 `tests/katrain-katago-smoke.ps1`：優先讀 user config；自訂 absolute path 直接採用；bundled resource 只在明確 `-KaTrainRoot`、正在執行的 KaTrain 目錄或有限常見安裝根下尋找 exact suffix。找不到、相對 custom path 無法安全解析、或同一 root 出現多個 bundled KataGo 都 fail closed。wrapper 最終只呼叫既有 `katago-bridge-smoke.ps1`，不建立第二套 receipt/scoring/engine contract。Windows CI 用 synthetic KaTrain layout 的 `-ResolveOnly` 測試成功解析與 ambiguity rejection；這仍不是 real-engine evidence，狀態維持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。

2026-09-29 Real KataGo Smoke Receipt v1：Decision Point Comparison 的下一個 gate 不再用 CI adapter 測試冒充真引擎證據。Windows `tests/katago-bridge-smoke.ps1` 現在要求 clean checkout，先以官方 `katago version` 取得 engine identity，再實跑 `/v1/move` 與 `/v1/compare`；兩者都通過後才產生本機 `.local-evidence/katago-smoke-receipt.json`。receipt 綁 repository commit、四個 contract file SHA-256、KataGo executable/config/model SHA-256、engine/model identity、runtime、comparison request/result；不保存絕對檔案路徑。公開 repo 只保留 receipt schema/verifier/tests，實際 receipt 被 gitignore/release boundary 排除。任何 commit 或 contract file 改變都使舊 receipt stale；`correct`／`mastery`／`transferLevel` 污染會 fail closed。CI 只驗 receipt contract、verifier、PowerShell syntax，沒有真 KataGo binary/model 時狀態必須保持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`，不得升格為 real-engine PASS。

2026-09-29 Change note｜KataGo real-engine receipt v1

- **bottleneck：** Decision Point Comparison v1 的 contract／adapter／browser flow 已通過 CI，但 CI 沒有實際 KataGo executable、config 與 model；因此仍缺一份能證明「這組公開 contract 曾由真引擎完整跑通」的可重算本機證據。
- **實作：** `tests/katago-bridge-smoke.ps1` 成功跑完 `/v1/move` 與 `/v1/compare` 後，才產生 `.local-evidence/katago-smoke-receipt.json`。receipt 保存 repository commit、五個關鍵 contract file SHA-256、KataGo executable/config/model SHA-256、engine version、Windows/PowerShell/Node runtime、move result、完整 bounded comparison request/result。
- **驗證：** `katago-smoke-receipt.cjs` 與 `scripts/verify-katago-smoke-receipt.cjs` 檢查 receipt schema、engine/model identity、request/result identity、兩候選 bounded authority 與 current contract hashes；stale contract、unknown engine version、model mismatch、以及 result 內出現 correct/mastery/transfer inference 都 fail closed。
- **privacy／publication：** `.local-evidence/` 永不列入 public release；只公開 receipt contract、verifier 與 tests。receipt 只保存檔名與 SHA-256，不保存 executable/config/model 路徑或檔案內容。
- **目前狀態：** `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`。本輪執行環境沒有使用者 Windows KataGo executable/model，因此不得標真機 PASS。
- **下一個 gate：** 只有 local receipt 通過 verifier 後，才解除 real-engine smoke blocker；之後若要進 Comparison → Explanation，仍需另立 explanation authority／教學效度 contract，不由 engine receipt 自動升格。

2026-09-29 Decision Point Comparison v1：在 19×19 SGF Decision Review 已能保存第一候選與原著之後，新增選用的 KataGo 兩手比較層。只有原著已揭露、第一候選合法且與原著不同時才可送出；若 SGF 缺規則／貼目則要求使用者補上，不自行猜測。分析固定只允許「第一候選」與「原著」兩手進 root search，保存 rules、komi、visits、engine/model/provider version、PV 與兩手排序；結果固定標記為 bounded search estimate，只作複盤參考，不產生 correct／mastery／transfer，不更新 KC、scheduler、T2/T3 或 formal evaluation。provider／engine／storage failure 維持失敗，不回退 heuristic。learner-facing 文案只說「這次搜尋較偏向哪一手」，不把 engine ranking 寫成標準答案。

2026-09-28 SGF Decision Review v1：Advanced 已有局部 multi-step reading 與 19×19 自由 practice，但兩者之間缺少可回看的全盤 Response。新增 practice-only「19×19 棋譜決策點複盤」：匯入單一主線 19 路 SGF、選一個可落子手數、在原著隱藏時先保存第一候選與 retry，再揭露原著做歷史比較並可留復盤備註。每筆紀錄版本化 source position、item、candidate-set、scoring contract、rules contract、evidence taxonomy 與 exposure state。規則引擎只判候選是否合法；「與原著不同」不是錯手，原著也不是唯一最佳手。此事件流固定 `advanced_sgf_review_practice_only`，不更新 KC／scheduler／T2-T3／formal evaluation；KataGo 若日後加入，只能另作 bounded comparison。舊 9×9 `parseSgf()` 與 single-move historical recall 語義保留。

# 個人圍棋教學程式：架構草案

最新執行後稽核將「模組可運作」與「證據可解釋」分開；固定應用探測不等於完整全局應用，自然實戰另列。結果遮蔽、首答語義、應用分母、匯出遮蔽及資料遷移的 R0 工程閘門已通過；正式成效判斷仍需獨立審題與實際試行。詳見 [Phase 1–5 執行後稽核](PHASE_1_5_JOHARI_REVIEW.md)。

正式產品與教學實作順序見 `DESIGN_PLAN.md`；本檔記錄系統邊界與組件契約。

## 目標與順序

單一使用者、Windows 本機、離線使用。核心教學目標是：「讓每次失敗留下可用的回饋，以可比較機會中的長期表現，以及未見局面的保留與應用，判斷進步。」成果以獨立新題和應用資料驗收；修正距離與再犯間隔只作同條件下的診斷，不要求每次改善。主要工作是先學概念、在棋盤完成互動練習、辨認錯誤類型、收到能理解的回饋，再用變形題複習。AI 複盤放在實戰後段。首階段不設帳號、雲端同步、多人對弈或訂閱服務。

依 2026-09-18 查核的[日本棋院入門課程例](https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html)與[英國圍棋協會初學者教學建議](https://media-iframe.britgo.org/organisers/handbook/club4)，先用 9 路盤、短解釋與直接練習，再由局部提子走向完整對局。這是順序參考；題目、文字、圖形自行編製與核對。

| 階段 | 單元 | 題型重點 | 完成條件 |
|---|---|---|---|
| A | 初級五單元 | 氣與吃子、連與斷、禁著與劫、眼與基礎死活、9 路小局 | 46 題、棋盤與規則概念 |
| B | 中級五單元 | 佈局、地與厚勢、攻守、死活閱讀、官子 | 30 題、情境判斷 |
| C | 高級五單元 | 全局方向、戰鬥、劫材、定石、複盤 | 30 題、全局判斷 |

## 組件

目前原型包含初級、中級、高級共 15 單元、19 課、106 題，以及獨立的 148 題變形庫。變形庫保留 100 題吃子、連接與救棋，新增 48 題直三及第二眼缺口的做活／破眼；完整承諾與實作狀態見 `COMPLETION_MATRIX.md`。瀏覽器直接讀取本機檔案；沒有網路請求。`go.js` 管理規則，`content.js` 保存課程；Phase 2 題庫由 `phase2-foundation-bank.js` 的 100 題基礎技巧、`phase2-life-death-bank.js` 的 48 題基礎死活與 `phase2-content.js` 相容組裝層構成。`scheduler.js` 管理固定與候選自適應排程，`phase4-content.js` 與 `sgf.js` 管理固定應用探測及單一主線 9 路棋譜的可落子著手重建，`trial.js` 固定 Phase 5 的批次、延後、首答及摘要口徑，`app.js` 管理畫面、SGF 復盤資料、可攜 SGF 匯出與事件生命週期。進度以 schema 7 暫存 `localStorage`；內容目錄版本 3 會把前兩輪插題前的舊索引遷移到原題，並可匯出 Markdown 摘要、JSON 原始資料及交給 KaTrain 的局部復盤 SGF。

擴大題庫時，維持以下資料邊界：

- **課程內容**：單元、先備概念、短講解、題目、技能標籤、錯誤類型、變形題關係、提示與錯誤解釋。每題保留來源參考、編題者與檢核狀態；局面、task features、答案及評分規則綁定題目版本。特徵先保存棋盤大小、位置、氣數、先手方、干擾及作答方式等需要的內容，未知或不適用明示。
- **技能模型**：KC 是暫定假說；保存技能卡版本、題目對應、預測、修訂理由與新舊版關係。事件保留原版，另存新模型分析；不同曲線先查題目及情境差異，不自動拆分或合併。
- **棋局事實**：SGF 保存初始局面、落子與變化；答案樹另記目標條件與可接受變化。單一固定座標不足以判定所有死活題。
- **規則引擎**：處理相連、氣、提子、禁著與劫。題目評分先檢合法手，再檢教學目標。
- **學習進度**：自動保存題目、技能卡 ID／版本、任務模式、呈現與機會資格、結果、嘗試序號、提示、曝光及時間；可能原因和回饋前後判斷只抽樣或主動填寫。`learning-metrics.js` 只從合格、無提示的可比較機會重算可觀察任務錯誤、SCD 與同類錯誤再犯間隔；舊事件若缺資格欄位即排除。錯誤類型不是粗心、誤解等心理根因。延後再測採實際經過時間，不記錄睡眠健康資料。個人版目前維持 `localStorage`；只有在實際出現容量、查詢、交易一致性、遷移可靠性或資料耐久性 bottleneck 時，才評估本機 SQLite，並先保留匯入／匯出與回復路徑。
- **排程與驗收**：先提供固定間隔與已核對的回饋模板；有題目真正到期時，首頁顯示直接入口，仍須使用者主動開啟，不會自動打斷新課。自適應選題作可停用的候選方案，保存政策版本及理由。正式比較先建立包含 hard validity prerequisite、分散提取及合格題內簡單交錯／受限隨機的 P0 強基準，再依 DESIGN_PLAN 第 1.4 節逐層增加 repeated weakness、retention／transfer 與 decision-relevant diagnosis；沒有增量效益即回退。練習／流程檢核／獨立驗收以母題家族隔離，首次呈現即記曝光並退出未見池；Evidence Taxonomy v2 將無技能提示的應用統一標為 T3，再以 `evaluationContext=standardized|live` 分開固定應用探測與自然實戰。舊 taxonomy v1 的 `T3=live only` 與 `fixed_local_probe` 保留原語義，不回溯改寫。
- **AI 分析**：後期以本機 KataGo 處理實戰複盤。候選、勝率、目數及地盤歸屬是搜尋估計；規則合法性由規則引擎判定。LLM 如加入，依核對過的局面資料解說，與固定模板比較效益，不推定心理根因。
- **VT-COS**：承接使用者主動匯出的反思筆記，不把答題原始事件自動寫進治理知識庫。

進階 multi-step practice 另有獨立 evidence stream：`advanced-sequence-events-v3` 保存 family／variant、首答／retry、`presentationPolicyVersion` 與固定 policy position；`advanced-sequence-policy.js` 只實作 `advanced-fixed-interleave-v1` 的 deterministic baseline（四個 seed → 四個 variant），不讀 learner model、不寫核心 scheduler。v1／v2 sequence storage 只由 legacy reader 解讀原語義，不遷移成 v3。這個 runtime 分離避免把 practice interleaving 偷換成 Core adaptive sequencing 或 formal evaluation。\n\n詳細計數與延後驗收依 [DESIGN_PLAN.md](DESIGN_PLAN.md) 第 1 節；[研究查核](RESEARCH_LEARNING_METRICS.md)區分文獻支持與設計假設。AI 只標異常線索，錯誤原因允許未知；實戰機會須同時記錄正確與錯誤決策。現版對一手提子、直接連接、直三做活／破眼及第二眼補／破共六個技能實作事件：呈現、提示、首答與重試、離題結果、首次曝光、題目／技能／事件政策版本、任務特徵與可比較機會；驗收效度仍待外部內容審查與真人資料。

## Authority Boundary

各層權限固定如下；較高層不得把較低層未提供的事實補成確定結論：

| Layer | Authority | Must not |
|---|---|---|
| Rules engine | 合法手、棋串、氣、提子、禁著與目前支援的劫規則 | 依 KataGo／LLM 輸出改寫規則事實 |
| Item scoring | 依題目版本與 scoring contract 判定任務成功 | 把單一座標擴張成未定義的全局最佳手 |
| KataGo / KaTrain | 候選、PV、score、ownership 等搜尋估計 | 定義 canonical history、心理根因或唯一教學正解 |
| Learner events | 記錄實際呈現、首答、提示、重試、曝光與時間 | 以後來模型偷偷重寫當時發生的事件 |
| Learner model / KC | 對可觀察事件提出可修訂推論 | 輸出未校準 mastery 百分比或把假說升格成事實 |
| LLM | 根據已核對 evidence 解釋、比較、提問 | 生成棋局事實、合法性、引擎估計或已確認心理原因 |

Provider、parser、engine、storage 或 analysis failure 必須保持 failure／unknown，不能 fallback 成看似成功的推測結果。

## 5×5／7×7／9×9 Active Board Practice contract

2026-09-22 起，`live-game.html` 由單一 9×9 頁泛化為共用棋盤練習頁；規則 authority 仍只有 `go.js`，不為不同尺寸建立平行規則來源。

- `go.js` 保留 9×9 為預設值以相容既有課程題目，但棋串、氣、提子、自殺禁著與 simple ko 會依實際方形棋盤尺寸計算。`live-game.js` 的 runtime/legacy 相容仍接受 3、5、7、9 路，但 active learner practice 只開放 5、7、9 路；3×3 不再作可玩的學習階段。
- 5×5／7×7 分別定位為 basic／transitional practice；9×9 是第一個完整小棋盤對局。3×3 只保留 legacy/runtime compatibility 與 regression coverage。所有 live audit event 仍固定 `evaluationRole=practice`、`evaluationContext=live`、`formalEligible=false`，不得因完成或勝負自動升格為 T2、T3 或學習成效。
- 9×9 延續黑先、白貼 7.5；5×5／7×7 active practice 目前預設貼目 0；legacy 3×3 仍按舊契約貼目 0，只是本專案練習預設，不宣稱為通用正式棋規。四種尺寸都沿用 Chinese area scoring 流程、兩次 Pass、人工整串死子標記與 `cn-area-simple-ko-v1`；系統不自動判死活或終局爭議。
- 續局依尺寸隔離：9×9 繼續使用既有 `go-live-game-v1`，避免破壞歷史資料；3／5／7 路歷史資料仍使用各自的 `go-live-game-v1-size-N`；其中 3×3 不再建立新的 active learner session。hydrate 仍由初始盤面＋手順重播，不信任保存的衍生盤面；不合法或版本不符資料保留 recovery 副本後開新局。
- live-game SGF 使用共用 bounded node parser，runtime parser 仍支援單盤、單主線、根節點 setup、落子與 pass 的 3／5／7／9 路子集，以保留舊資料可讀性；新 active UI 只提供 5／7／9；匯入尺寸必須與目前練習頁一致。課程 `sgf.js::parseSgf` 仍維持 9×9 限制，因此只有 9×9 live SGF 可直接回到既有課程局部複盤；較小棋盤匯出只作保存或外部工具使用。
- 課程頁只做 Experience 層推薦：單元 1–3 → 5×5、單元 4 → 7×7、單元 5 起 → 9×9；自由練習頁可隨時切換。這個映射不是 mastery threshold，也不修改 scheduler。
## Local practice bot contract

2026-09-22 起，5×5／7×7／9×9 active practice 可選「雙人同機」或「和電腦下」。legacy 3×3 runtime 只保留相容，不再從學習者 UI 建立新局。第一版電腦對手由 `practice-bot.js` 提供 bounded heuristic policy：只枚舉 `live-game.js`／`go.js` 判定為合法的候選手，再依立即提子、接觸對手、己方連接、落子後氣數、中央偏好與避免明顯自填等簡單特徵排序；沒有合理候選時可 Pass。

- bot 不是 KataGo、不是棋力模型，也不輸出勝率、目數或「最佳手」主張。
- 三種 active 尺寸共用同一 bot 邏輯；legacy 3×3 仍可由底層測試覆蓋；規則 authority 仍只有 `go.js`／`live-game.js`。
- 對電腦模式的事件仍固定 `evaluationRole=practice`、`evaluationContext=live`、`formalEligible=false`；勝負不能升格成 T2／T3、mastery 或學習成效。
- 使用者可執黑或白；執白時 bot 先走。人機悔棋回到使用者上一個決策前。
- bot failure 必須保留 ERROR 並停止該次自動回合，不能 fallback 成不合法落子或看似成功的推測結果。

## Live practice event stream contract

2026-09-22 起，人機／自由棋盤把實際操作另存到 `practice-events.js` 的 append-only event stream（`go-live-practice-events-v1`）。此事件流只保存 Experience/Response 層觀察：session、棋盤尺寸、對手模式、actor、落子／Pass／認輸／悔棋等操作、座標、提子數與 bot 版本。

- 每筆事件固定 `formalEligible=false`、`qualifiedOpportunity=false`、`evidenceUse=practice_observation_only`、`scoringStatus=unscored`，且 `skillId=null`、`transferLevel=null`。
- 電腦手與學習者手分 actor 保存；summary 的「你的可觀察決策」只計人機模式下 human 的 move／pass／resign，不把 computer action 或 undo 當獨立學習機會。
- 課程首頁只能讀摘要；完整 JSON 備份可匯出原始 live practice events，但 `learning-metrics.js` 與 scheduler 仍只讀既有 `state.events`／scheduler responses。
- event store malformed、不可讀或不可寫時保持 ERROR；不回退成空陣列成功，也不把遺失資料補成成功紀錄。
- raw practice stream 永遠保留原本 unscored 語義；需要升格的自然實戰證據另走 `live-evidence.js`，不得回頭把舊 `practice-events.js` 事件改寫成 scored evidence。

## Versioned live T3 eligibility / scoring contract

2026-09-22 起，`live-evidence.js` 提供 `live-eligibility-v1` 與 `live-scoring-v1`。它不是從「AI 覺得這手不好」回頭找樣本，而是在每個 **9×9 人機局、輪到學習者的回合**，先掃描整盤、凍結 assessment，再接受學習者第一個操作。

v1 只允許兩類可由規則引擎客觀核對的局部機會：

1. `capture-last-liberty-v1`：整盤恰有一個本 contract 支援的一手提子機會；目標對方棋串恰一氣，唯一氣上的合法落子立即且只提掉該串。
2. `rescue-last-liberty-foundation-v1`：上一著的 actor 已確認為 computer，且它把既存己方棋串從至少兩氣降為一氣；唯一氣上的直接延長合法、不靠提子，並使原串回到至少兩氣。

共同不可變條件：

- eligibility 在看到本回合結果前決定；整盤若同時有多個支援機會，整回合標 `multiple_supported_opportunities` 並排除，不事後挑一個方便的技能。
- 5×5／7×7、SGF 匯入後 actor 不明、複雜劫／倒撲／征子、靠提子救棋、棄子補償與任何全局好壞判斷都維持 unscored。
- assessment、`first_response`、`retry_response` 分開保存。非法首答也是首答；重新載入會由 `go-live-evidence-v1` 恢復該 assessment 已有 response 數，不得把 retry 變成新的 first response。
- eligible assessment 一旦建立，即使學習者離開或未作答也留在 denominator；不得因結果不利而事後移除。
- 局部 task success 只表示符合該 scoring contract，不表示該手是全局最佳手；task failure 也不等於全局錯著。
- 每筆 scored event 保存 eligibility/scoring/taxonomy version。彙總只使用語義相容的目前版本，不相容歷史事件另列 `excludedContractVersionEvents`。
- 決策機會逐次計分；但「近期跨局一致」只以不同 `sessionId` 的棋局為單位，同局連續多手不能冒充獨立樣本。
- storage／parser／rules failure 必須保留 ERROR；不能回退成零機會、成功或推測分數。

## Learner evidence progress contract

`learner-progress.js` 的 `learner-evidence-progress-v2` 只做可重算的描述性 Evidence → Update 摘要：把既有課程／排程 T0–T2 診斷與上述 bounded live T3 **並列**，輸出「資料不足」「仍需更多證據」「已觀察延後 T2、live 待機會」「已觀察 live、T2 待驗」「已觀察延後 T2 與 live」等狀態。

v2 另外輸出 `collectionReadiness`，只描述資料管線目前落在哪個收集階段：尚未掃描、已掃描但尚無 eligible、eligible 尚未有 first response、單一棋局已有首答、或已跨不同 game session 收到首答。這些階段不設定「足夠樣本」門檻，也不代表能力高低。

- 不輸出未校準 mastery 百分比、段位、棋力或學習成效。
- `schedulerAuthority=false`：此狀態目前不直接改 scheduler；若未來要影響選題，需另證明 decision value 並升版 policy。
- `formalEvaluationAuthority=false`：practice/live evidence 不能取代 private holdout、R1b 或 formal evaluation。
- 首頁只顯示 evidence state 與下一個需要的證據；完整 JSON 匯出保存 raw events、contract 定義、summary 與 policy version，讓之後可重算而不覆寫歷史事件。

## Move Provider / KataGo bridge contract

2026-09-23 起，live practice 的電腦回合先經 `move-provider-v1`，provider 只可提出 `play`／`pass`／`resign` 候選；`live-game.js`／`go.js` 仍是唯一落子 legality authority。現有 heuristic bot 是 provider 之一；新增 `katago` 與 `remote` HTTP provider。

- 瀏覽器不能直接啟動 `katago.exe`；`katago-bridge.cjs` 只監聽 `127.0.0.1`，把 canonical game history 轉成 GTP，呼叫使用者本機既有 KataGo，再回傳一個候選 action。bridge 不保存 API key、不代理任意 shell command。
- Remote API 與 localhost bridge 共用 JSON contract。endpoint／timeout／HTTP／JSON／非法座標／KataGo failure 都保持 ERROR；不得 fallback 到 heuristic bot 或隨機手。
- provider 回傳的每一個 `play` 都再次送進 `Live.play`；若與目前 bounded simple-ko rules 不相容，該回合停止並留下 provider error，而不是接受引擎輸出改寫規則事實。
- provider／model version 隨 computer event 保存；KataGo 候選仍只是搜尋結果，不是 canonical 教學答案、learner diagnosis 或正式 T3 scoring authority。
- `katago-bridge.cjs` 是本機 optional integration，不改 Pages 的離線核心。Remote API 模式明示會產生網路請求；只有使用者主動選擇才啟用。

## 世界死活名型館 Ontology v3

名型館的 canonical source 是 `classic-shapes-ontology.js` 的 versioned concept ontology。v3 在 v2 的 terminology / identity / rules metadata 上，再分離名稱歧義、名稱關係、教材 taxonomy 與 concept-to-concept geometry relation；仍不改任何 practice item、scoring contract、learner event、KC、scheduler 或 formal evaluation。

每個 concept 分離保存：

- `entityType`：`nakade_shape`、`nakade_category`、`corner_life_death_family`、`tesuji_mechanism`、`rules_sensitive_position`。
- `names[]`：locale、nameStatus、semanticRole、relationToCanonical、usageScope、reviewStatus 與 sourceIds。名稱證據只證明名稱層，不自動升格 geometry。
- `geometryIdentity`：kind、reviewStatus、contractVersion、fingerprint、rotation/reflection normalization、boardContext 與 conditions。
- `rulesetBehavior[]`：ruleset、version、phase、adjudication mode、result 與 sourceIds；舊 `rulesetSensitive` 只由此衍生。
- `negativeMappings[]`：把「不得自動合併」作為一級知識，例如小豬嘴不得直接 alias 普通 Tripod Group、金雞獨立不得視為 static nakade。
- `nameResearch[]`：負面查核必須有 `reviewedAt` 與 `searchScope`；UI 只能說「截至日期尚未找到」，不能宣稱名稱不存在。
- `sources.*.evidenceChain`：網址數量不等於獨立證據數。Go4Go 明示其 Chinese Go Terms 為 YeeFan 資料的 copy，因此兩者在 ontology 中共用 evidence chain。
- `nameAmbiguities[]`：同一名稱可同時指向多個候選 concept；歧義本身是可版本化知識，不強迫提前消歧。
- `nameRelations[]`：只描述名稱層的跨語 mapping，不取得 geometry authority。
- `taxonomyMemberships[] / taxonomyRelations[]`：允許不同教材保留不同 family 邊界；source-specific taxonomy 不被壓成世界唯一 parent tree。
- `geometryRelations[]`：只記 concept-to-concept 的 same／variant／overlap／related_unresolved 等 geometry claim；taxonomy 關係不得自動升格 geometry relation。

`classic-shapes-catalog.js` 現在是 compatibility adapter：舊 UI 所需的 `preferredZhTW`、`zhNameStatus`、`aliases`、`rulesetSensitive` 與 `sources` 皆由 ontology 衍生。它不得再手寫第二套概念資料。新功能應優先讀 `Catalog.concepts`／ontology 欄位；舊欄位只為漸進 migration 保留。

### Geometry-first fingerprint layer

`classic-geometry-fingerprint.js` 提供與名稱無關的 geometry normalization。v1 對 point-set shape 做 translation + D4（旋轉／鏡射）canonicalization，另保存 board context（corner/side/center、boundary、toPlay、role、outside liberties、ko context）作第二層 signature。shape-only compare 與 context-sensitive compare 必須明確分開。

`classic-geometry-evidence.js` 是 geometry evidence registry，不是 scoring source。每筆 evidence 必須標記來源種類與 evidence status；沒有可重算座標時只能是 `text_only_geometry_unavailable` 或 `diagram_requires_extraction`，不得由名稱、圖說或死活結論自動補點。

目前正向 oracle 只來自既有已驗證 practice contracts：丁四、刀把五、梅花五、花六。`小曲尺`、L Group 與 Carpenter's Square 尚未有可重算 canonical coordinates，因此 fingerprint resolver 必須回傳 `INSUFFICIENT_GEOMETRY_EVIDENCE`。

### Geometry extraction gate

`classic-geometry-extraction.js` 管理「來源 → 結構化座標 → 可否進公開 registry」的生命週期。人工轉錄、SGF parse、source-native coordinates 與 internal contract 分開標記；來源權利狀態分為 `project_generated`、`verified_reusable`、`reference_only`、`unknown`。

- 單次人工轉錄不能 self-verify；至少需要兩個不同 `reviewKey` 的獨立轉錄，且 canonical payload 完全一致。
- 所有可升格 extraction 必須綁 immutable `sourceDigest`；兩份人工覆核只有在 sourceId、sourceLocator、sourceDigest 都相同時才可比較。
- `verified_reusable` 不能只靠狀態字串，必須保存非空 `rightsEvidence`。
- 兩次轉錄不一致時回 `CONFLICT`，不得投票選一個。
- deterministic SGF／source-native parse 只有在來源可重用權利已核實時，才可單筆升格公開 geometry evidence。
- `reference_only`／`unknown` 可作非 shipping reference/oracle，但來源衍生座標不得提交公開 registry。
- corner／side geometry 必須保存 board boundary；缺 boundary 不得進 strict comparison。
- extraction gate 不取得棋理、死活答案或 scoring authority。

### Reference-only geometry oracle

`classic-geometry-reference-oracle.js` 服務 rights=unknown／reference-only 但具研究價值的外部棋形。原始 observation 只在當次研究記憶中進入 fingerprint compare；可保存 report 必須剝除 points、stones、shapeSignature、contextSignature、fingerprint 與其他可重建 geometry 的 payload。

- report authority 固定為 `reference_oracle_only`，且 `canonicalPromotionAllowed=false`。
- sourceId／sourceLocator／sourceDigest 必須與當次 observation provenance 一致。
- evidence independence 依 `evidenceChain`，不是網址數或 digest 數；同一 chain 只算一個 evidence unit。
- 至少兩條獨立 evidence chain 一致，只能形成 `CONSISTENT_REFERENCE_SUPPORT`，不能自動寫回 canonical geometry。
- 獨立 oracle 衝突時保留 `CONFLICTING_REFERENCE_ORACLES`，不得選邊或平均。



Migration invariant：

1. practice/scoring contract ID 與答案語義不變；
2. geometry contract 仍由各 family contract 負責，ontology 只引用其 version/fingerprint；
3. 名稱／來源變更不得改 learner evidence；
4. compatibility adapter 的輸出必須可由 canonical ontology 決定；
5. rollback 可移除 ontology script 並恢復上一版 catalog，不需 learner/storage migration。

## External Adoption Policy

外部 OSS 的採用順序預設為：

```text
Reference -> Oracle -> Dependency -> Fork
```

只有觀察到 correctness、scope、maintainability 或 workflow bottleneck 時才升級採用層級。成熟度、star 數或功能較多本身不是 replacement 理由。

目前決策：

- `go.js`：維持 bounded rules implementation；需要 ruleset abstraction、superko、13×13／19×19 或實際 legality discrepancy 時，先以 Sabaki go-board／OGS goban 作 differential oracle。
- `sgf.js`：維持 9×9、single game、single mainline 與明確資源上限；CI 以 pinned `@sabaki/sgf@3.5.0` 作 differential oracle，只比較雙方共同支援的子集，branch／collection 等本專案刻意拒絕的功能列為 expected divergence。真實 corpus 出現 variation／collection／encoding／較大棋盤需求或 parser failure 時，才評估把 `@sabaki/sgf`／immutable-gametree 從 Oracle 升為 Dependency。若升級，必須把 bundler、Pages、dependency、offline 與 rollback 成本一起評估。
- Storage：目前維持 `localStorage` schema 7；沒有實際 bottleneck 不預建 SQLite abstraction。
- Scheduler：先完成 P0 strong baseline；沒有增量 outcome evidence 不導入 FSRS、bandit、RL 或 learned policy。
- LLM tooling：沒有固定模板對照與 LLM teaching experiment 前，不加入 Promptfoo 或多模型 orchestration。

事件層已為兩個試行技能補上呈現、未答／中斷、獨立呈現 ID、曝光、題目／政策版本及完整 JSON 原始匯出；Markdown 仍是摘要，不能當完整資料備份。`elapsedMs` 是從開題起的經過時間，包含閒置及重試，成本分析另定可核對口徑。原始事件、題目版本、模型修訂與政策分開保存的目的，是能修訂解釋而不覆寫當時發生的事；第一版不因此引入資料庫或統計套件。

## UI 原則

一個畫面只呈現一段概念與一題。畫面左側是棋盤，右側是問題、選擇或落子指示、提示、回饋與下一題。錯誤回饋要指出可再次觀察的線索；答對後再顯示理由。課程進度與錯題數永遠可見。中文正文與題幹用 16px、輔助資訊 14px，搭配本機繁中字體；手機以單元選單及目前單元的課程清單導覽，不以長距離橫向捲動選課。此排版參考 [Ant Design 字體規範](https://ant.design/docs/spec/font/?locale=en-US)、[W3C 中文排版需求](https://w3c.github.io/clreq/)及 [WCAG 2.2](https://www.w3.org/TR/wcag/)；後續 UI 可以更換，只要沿用題目資料與規則引擎的輸入輸出契約。

答錯後先給可觀察線索與適量補練；原因分類選填，解釋可用棋盤手順。進度畫面優先顯示獨立未提示新題與固定應用探測的分子、分母及資料不足狀態；自然實戰分開。側欄診斷及 Markdown／JSON 匯出已顯示可觀察錯誤數、SCD 階段、再犯間隔與被排除的不合格事件。完成題數列為活動資訊，診斷值不升格成成效證據。

能力狀態用「這批延後新題初步通過／仍需練習／資料不足」等帶條件描述，不顯示未經校準的掌握機率。學習成本、保留與應用各自列出，不合成單一分數。模型與排程版本留在診斷／匯出，五個功能問題留在設計檢查，不增加逐題填表。

## 品質門檻

每題在交付前需驗證：初始棋形無重疊；指定答案為合法手；提子題確實提掉指定棋串；救棋題確實增加氣；連接題確實成為同一串；斷點題確實佔住唯一共同空點；簡單劫不可立刻回到上一個棋形；選擇題有答案、提示與理由；題目文字與棋形一致；多解題不能只用單一座標評分。15 單元的機器檢查位於 `tests/go.test.cjs`，實際瀏覽器流程位於 `tests/ui.test.cjs`。

## 19×19 Advanced practice boundary

`live-game.js` 現支援 19×19 作為標準全盤 practice，沿用同一 rules engine、SGF round-trip、Pass／認輸與人工死子確認；`advanced.html` 的完整棋局 track 只路由到此 Experience，不另建平行棋盤 runtime。19×19 操作寫入 `live-practice-events-v2`，固定 `formalEligible=false`、`qualifiedOpportunity=false`；舊 `live-practice-events-v1` 保留 legacy reader。`live-eligibility-v1` 仍硬限定 9×9，因此 19×19 不取得 T3 authority。課程端 `sgf.js` 的單點重建仍只接受 9×9；19×19 SGF 可匯出供 KaTrain／其他工具，但不能被本站假裝已完成深度複盤。heuristic bot 只保證候選經 rules engine 合法，不代表 19 路合理棋力。

## 目前限制

這是 15 單元的教材與資料原型。驗收畫面洩漏、首答被重試覆寫、固定應用分母缺漏，以及 storage／trial 版本責任已由測試驗證。Evidence Boundary 修正後，`personal-pilot-v3` 明確使用舊 R1 自我審查中已曝光的八題，`formalEligible=false`；v1／v2 保留為 legacy，一般匯出仍遮蔽公開保留組答案。R1a 已從學習者介面隔離，只供不同於學習者的外部審查者。擁有者已接受原始碼公開，因此 48 題均標記 `exposureStatus="public_source"`、`formalHoldoutEligible=false`，`formalHoldoutPoolStatus="retired_due_to_publication"`；`holdout` 只剩排程相容語意。正式評量必須建立從未公開的新題庫與角色分離流程。R1b 難度可比性未知。SCD 與再犯間隔的計算、介面和匯出已完成工程驗證，變形庫也已有非 holdout T2 流程題，但尚無真人延後資料。內容效度、完整死活課綱、固定應用與 SGF 可落子著手重建的任務效度、方案比較及實戰遷移仍未完成。完整狀態以 [完成矩陣](COMPLETION_MATRIX.md) 為準，正式成效判斷不得開始。

## 2026-09-23 Change note｜初學者對弈入口與進階 provider 分層

- **目標行為：** learner-facing 主流程只要求選「練習電腦」或「雙人同機」及執黑／白；KataGo、Remote API、endpoint 與連線測試收進預設收合的進階設定。新使用者預設「練習電腦」，不要求理解引擎名稱、API 或安裝流程。
- **不可破壞 invariant：** provider 仍只有候選權；所有 play 再經規則引擎；KataGo／Remote failure 保持 ERROR，不 fallback；不在 learner UI 收集或保存 API key；既有 opponent 設定可繼續讀取。
- **主要 failure case：** progressive disclosure 只藏文字卻破壞既有 KataGo／Remote 使用者設定、provider endpoint、電腦回合或 evidence actor semantics；因此保留原 opponentMode 值並新增 UI contract／negative tests。
- **驗收：** 初學者 selector 不出現 KataGo／Remote/provider 術語；進階區可選引擎、看 KataGo 官方下載入口、設定 endpoint 與測試連線；API key input 不存在；既有 live-game、provider、Windows UI、repository boundary、Sabaki oracle 全部需 PASS。
- **證據邊界：** 這是 information architecture／usability risk reduction 的工程修改；是否真的讓初學者更容易理解仍需三位目標初學者短任務觀察，不能由 UI test 升格。
- **Rollback：** 恢復 v6 mode panel 與預設 local；不需棋局、practice event、KC、scheduler 或 formal evaluation migration。


## 2026-09-23 Change note｜公開 Pages 的 provider 可達性

- GitHub Pages 只負責靜態前端，不能在託管端執行 `katago.exe` 或 `katago-bridge.cjs`。
- `katago` provider 明確定義為 per-device localhost integration；網站訪客只有在自己的裝置已安裝 KataGo 並啟動 bridge 時才能使用。
- `remote` provider 是未來／自架的 HTTPS service seam，可承接雲端 KataGo；目前 repository 沒有託管 KataGo endpoint，不把 contract 存在升格為 service availability。
- 內建 heuristic provider 維持公開 Pages 的零安裝預設。若未來部署共用 KataGo API，需另處理 authentication、rate limit、resource isolation、timeout、CORS、TLS、成本與 failure observability，並保持 rules/scoring authority boundary。


## 2026-09-23 Change note｜Hosted KataGo transport boundary

- **目標：** 讓既有 localhost bridge 能在明確 opt-in 下作為 hosted KataGo service 的 transport seam，而不把 localhost 預設意外暴露到網路。
- **改動：** `katago-bridge.cjs` 預設仍只綁 `127.0.0.1`；只有 `VTCOS_KATAGO_ALLOW_REMOTE=1` 才可使用遠端 listen host，且必須同時設定 `VTCOS_KATAGO_ALLOWED_ORIGINS`。新增 `GET /health`、browser origin allowlist 與 bounded concurrent request gate；未允許 origin／未設定 allowlist 均 fail closed。
- **反證：** 新增 `tests/katago-hosted.test.cjs`，要求 remote mode 無 allowlist 必須拒絕啟動，非允許 browser origin 必須 403，允許 origin 才可取得 health response。
- **不變 invariant：** provider 仍不取得 rules/scoring authority；KataGo failure 不 fallback；沒有改 learner event、KC、scheduler、formal evaluation 或 storage semantics。
- **部署狀態：** 本 change 只建立可部署的安全 transport boundary，**沒有實際部署公共 KataGo runtime**；公開 HTTPS endpoint、runtime 成本／容量與真實 Pages→service→KataGo smoke 仍為 NOT_IMPLEMENTED／NOT_MEASURED。
- **Rollback：** 回復 bridge 與移除 hosted contract test 即可；不需資料 migration。

## 2026-09-24 Change note｜SGF recall authority boundary

SGF 局部功能的 authority 現在分成三層：

1. **SGF parser／rules engine：** 只負責重建棋譜中實際發生的歷史盤面與原著，及合法性檢查。
2. **single-move recall scoring：** 只判定使用者著手是否與 SGF 原著一致，claim 為 `historical_move_reconstruction`；不判最佳手，不產生 T2/T3 或 mastery。
3. **人工／external analysis：** 才能另行確認原著或其他候選是否可接受；KataGo／KaTrain 輸出仍是 bounded search estimate。

因此「原著一致」與「棋理正確／最佳」是兩個不同資料欄位與主張層級。連續棋譜重建若日後實作，必須沿用相同 authority boundary 與 first-response／retry 分離，不得把連續命中率升格為棋力。


## 2026-09-27｜History Explore surface authority boundary

`history.html` 是 repository-root 靜態、read-only 的文化／歷史閱讀入口，與 Core learner runtime 分離：

- 不載入 `app.js`、`scheduler.js`、`learner-progress.js` 或 evidence state modules。
- 不讀寫 learner localStorage，不產生 first-response、practice、T0–T3 或 formal-evaluation event。
- 「確證／高度可信／有爭議／傳說／研究假說／未知」是 historical claim presentation metadata，不是 `evidence-taxonomy.js` 的 learner evidence classification。
- 外部古籍、博物館、學術論文與研究機構只提供歷史主張 evidence；它們不取得 rules engine、item scoring、KC 或 scheduler authority。
- 若未來要把某段歷史材料轉成教學題或正式評量，必須另走 content/scoring/TEACHING_GATE 流程，不得由 Explore 頁直接升格。
