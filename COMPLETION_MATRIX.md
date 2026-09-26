# 完成矩陣：悟之一手

更新日期：2026-09-27  
用途：將產品承諾、現有實作、自動驗證與證據邊界分開記錄。此表的「工程通過」只表示指定程式行為可運作，不表示內容正確、初學者可理解或學習有效。

## Current Status

- `as_of`: 2026-09-27
- `claim_mode`: `personal_descriptive`
- `trial_protocol`: `personal-pilot-v3`
- `r1_protocol`: `go-r1-independent-content-review-v4`
- `ui_version`: `learner-flow-v45`；棋盤練習頁 `live-game-ui-v11`
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
| Core 後續進階訓練 v5 | 獨立 `advanced.html`；不是第 16 單元。保留 8 個 choice-based practice Experience；棋盤 Response 由 4 個 seed 擴成 8 題、4 個 family，每族兩題：倒撲第二題改為回提三子；枷第二題改出口幾何且仍驗雙逃路；對殺第二題交換 learner 棋色；征子第二題改 8×8、更長路線並最終提十一子。每題帶 `familyId`／`variantId`／`variationAxes` 並由 rules-backed sequence contract 重播 | `advanced.test.cjs`、`advanced-sequence-contract.js`、Go rules oracle、browser UI、發布邊界、完整 CI | 工程／教學 UX | 條件通過僅限小型 practice family seed；不更新 KC／scheduler／T2-T3／formal evaluation。第二題不是單純旋轉複製，但尚未證明 family 內難度可比、真人 transfer 或構念邊界 |
| 全課程短講與示範 | 19 課都有文字短講及至少兩步棋盤示範；一般進課只在首次進入時自動開啟，之後可手動重看；但正式完成前一單元並跨入下一單元時，即使曾預覽下一單元，仍會再次開啟該單元短講；中高級縮圖明示為局部比較或階段示意 | `lesson-content.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；棋理適切性與是否幫助理解仍待外部審查及真人觀察 |
| 多題互動練習 | 28 題為棋盤數氣／連接／落子、10 題為局部棋形點選、68 題為文字選擇 | 規則與內容結構測試 | 工程 | 條件通過；局部點選只檢查題幹指定的觀察點，後續全局判斷深度仍待外部審查與真人觀察 |
| 經典眼形探索 v1 | 第 4 單元新增 practice-only 選修入口；重用既有直三／第二眼題，流程為先找急所、作答後揭名、換方向、攻守交換、相似反例；不寫 KC／scheduler／T2-T3／formal evaluation | `classic-shapes.test.cjs`＋既有內容／UI 回歸；完整 browser CI 以分支 workflow 為準 | 工程／教學 UX | 條件通過僅限工程契約；直三文案 contentVersion 2，棋理適切性、真人理解與學習效益仍待 R1a／真人觀察 |
| 基礎吃子／死活變形庫 | 原有 100 題吃子、連接與救棋，加上 48 題兩類基礎死活，共 148 題、43 個母題家族 | `phase2-content.test.cjs`、一至三手規則與真眼區域驗證 | 工程 | 條件通過；兩類死活內容仍待獨立審題，不代表完整死活課綱 |
| 失敗後的同類修正 | 已依技能首答結果產生可觀察的任務錯誤類型；不推定粗心、誤解等心理根因 | `learning-metrics.test.cjs`、`app-state.test.cjs`、`scheduler.test.cjs` | 工程 | 條件通過；分類效度仍待內容與真人資料檢驗 |
| 穩定修正距離與再犯間隔 | 已由合格、無提示機會重算；SCD 須通過約 24 小時與 7 天的非 holdout T2，正式變形庫已有 T2 流程題；介面及兩種匯出均顯示資料不足或目前下限 | `learning-metrics.test.cjs`、`app-state.test.cjs`、UI 測試 | 工程 | 條件通過；尚無真人延後結果，指標效度未驗 |
| 延後與未見題 | 一般匯出仍遮蔽公開保留組答案；48 題原 formal holdout 已因公開原始碼全部退役 | 排程、狀態、試行、公開契約與 UI 測試 | 工程 | 流程條件通過；正式未見驗收須另建從未公開的新題庫 |
| standardized T3 固定應用探測 | 5 個減少技能線索的固定局面；Evidence Taxonomy v2 以 `evaluationContext=standardized` 與 live T3 分開 | SGF、試行、UI 與 evidence-taxonomy contract 測試 | 工程 | 條件通過；只支持既定局部 scoring contract，不代表全局判斷或 live 實戰遷移 |
| SGF 實戰回流 | 可選單一主線 9 路棋譜的任意可落子著手、保存原判斷並匯出 KaTrain 交接 SGF | `sgf.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；pass 不建立落子題，且未確認錯誤原因或最佳手 |
| KaTrain／KataGo 分析 | KaTrain 1.20.0 可啟動；封裝內含 KataGo 1.18.1、38 MB 模型與 OpenCL GPU；網頁可匯出交接 SGF | 同版本設定已補齊 KaTrain `analysis` 必填欄位；9 路固定局面經 GTP 回應 `E5`，並由 `analysis` 回傳 JSON；原版桌面程式已建立 `katago.exe analysis` 子程序 | 外部工具 | 工具層通過；輸出是搜尋估計，仍需使用者對實戰局面確認教學結論 |
| 首頁下一步清楚 | 根網址固定作為悟之一手學習樞紐：先以零基礎 Core 為主要路徑，再在首屏後直接提供核心課程與獨立進階訓練兩個入口；Core workspace 使用 `#core`，重新載入可留在課程，回到根網址則回首頁。回訪者首頁顯示「繼續核心課程」與上次課名，不再自動略過首頁；只有確實有題目到期時 Core workspace 才顯示「今日到期」及數量 | `app-state.test.cjs`、UI 測試；375px 單欄、root-vs-#core route、回訪 CTA、進階入口與無橫向溢出反證 | 工程 | `learner-flow-v44` 條件通過；首頁是否讓不同程度使用者更快選對入口仍待真人觀察 |
| 跨課短講銜接 | 同課前往下一題；跨課或跨單元時按鈕明示短講；同單元跨課仍以是否看過決定自動開啟，正式跨單元則一律再次開啟下一單元短講，避免先前預覽跳過教學銜接 | 狀態與 UI 測試；`tests/ui.test.cjs` 逐一覆蓋全部 14 個跨單元邊界，另覆蓋「已預覽第 8 單元後正式完成第 7 單元」反證案例 | 工程 | 條件通過；14/14 跨單元 browser regression 與已預覽下一單元案例已通過，真人是否感覺自然仍待最後觀察 |
| R1a 內容審題操作 | reviewer-only 77 題母體覆蓋完整 148 題題庫的 43 家族代表與全部 48 題公開保留組；學習頁不再提供入口，審查頁只載入去答案資料，三項獨立聲明分開 | `r1-content-audit.test.cjs`、UI 測試 | 工程 | v4 答案盲審流程條件通過；外部回條仍待不同於學習者的審查者完成，且結果不恢復 formal holdout 資格 |
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

