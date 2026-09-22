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

詳細計數與延後驗收依 [DESIGN_PLAN.md](DESIGN_PLAN.md) 第 1 節；[研究查核](RESEARCH_LEARNING_METRICS.md)區分文獻支持與設計假設。AI 只標異常線索，錯誤原因允許未知；實戰機會須同時記錄正確與錯誤決策。現版對一手提子、直接連接、直三做活／破眼及第二眼補／破共六個技能實作事件：呈現、提示、首答與重試、離題結果、首次曝光、題目／技能／事件政策版本、任務特徵與可比較機會；驗收效度仍待外部內容審查與真人資料。

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
- 若未來要把某類 live event 升格為 T3 或 KC opportunity，必須另有版本化 eligibility/scoring contract、正反例、人工／引擎核對與分母規則；不能直接重用本 v1 stream 的 unscored event。

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

## 目前限制

這是 15 單元的教材與資料原型。驗收畫面洩漏、首答被重試覆寫、固定應用分母缺漏，以及 storage／trial 版本責任已由測試驗證。Evidence Boundary 修正後，`personal-pilot-v3` 明確使用舊 R1 自我審查中已曝光的八題，`formalEligible=false`；v1／v2 保留為 legacy，一般匯出仍遮蔽公開保留組答案。R1a 已從學習者介面隔離，只供不同於學習者的外部審查者。擁有者已接受原始碼公開，因此 48 題均標記 `exposureStatus="public_source"`、`formalHoldoutEligible=false`，`formalHoldoutPoolStatus="retired_due_to_publication"`；`holdout` 只剩排程相容語意。正式評量必須建立從未公開的新題庫與角色分離流程。R1b 難度可比性未知。SCD 與再犯間隔的計算、介面和匯出已完成工程驗證，變形庫也已有非 holdout T2 流程題，但尚無真人延後資料。內容效度、完整死活課綱、固定應用與 SGF 可落子著手重建的任務效度、方案比較及實戰遷移仍未完成。完整狀態以 [完成矩陣](COMPLETION_MATRIX.md) 為準，正式成效判斷不得開始。
