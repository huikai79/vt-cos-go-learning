2026-09-29 Advanced Evidence Bundle Export v1：Advanced 已累積 choice、multi-step sequence、19×19 Decision Review、KataGo comparison、Decision Replay、Comparable Position 等多條 localStorage 事件流，但 Core 的完整 JSON 備份不涵蓋這些 stream；瀏覽器資料被清除時會失去可回溯 Evidence。新增單向 `advanced-evidence-bundle-v1` 匯出：choice、sequence v1/v2/v3、decision review、comparison、replay、comparable events 分 stream 保留原 schema/event version，legacy sequence 不 migration；Comparable 另附 `advanced-comparable-analysis-v1` 描述性 summary。每條 stream 透過官方 reader 讀取，且有 validator 的 stream 匯出前再逐 event 驗 authority；malformed/unreadable/polluted store 不輸出 raw 壞資料，而標 stream error，其他健康資料仍可匯出，bundle `complete=false`。此功能只作本機備份與分析，不提供 restore/import，不改 learner state、KC、scheduler、formal evaluation、first-response 語義或歷史事件；formal teaching candidate 不重凍結，因 Advanced 不在目前 Core critical asset set。rollback 可移除 exporter/UI/tests，不修改任何既有 event store。


2026-09-29 Comparable Position Analysis v1：Comparable Position v1 已能產生 practice／process-check 事件，但原本只有 event count，尚不能安全重算 pair 層的 first-response 狀態。新增 `advanced-comparable-analysis-v1`：每個 item 固定以第一次 presentation 為分析單位，首答與 retry 分離；同 item 之後重新開始不能用較好的後一次首答覆蓋第一次。target 一旦呈現即進 process-check denominator，未答明示為 `TARGET_UNANSWERED`；尚未呈現則不進分母。analysis 重新驗 event authority 與固定 presentation order，跳過前置 item、completion_without_first、retry_without_first、multiple_first 等 lifecycle 異常全部 fail closed。pair transition 只輸出 `source_correct_target_correct` 等描述性組合，不產生 mastery、transfer success、KC update、scheduler eligibility、formal evaluation 或 construct validation。既有 Comparable Position 的 public T2 標籤仍只表示「different surface + same provisional KC hypothesis」的 process-check taxonomy；Analysis PASS 不把 provisional KC 變成已驗構念。rollback 可單獨移除 analysis module／tests，不修改既有事件流或歷史資料。

2026-09-29 Comparable Position v1：Decision Replay 已解決同一已曝光局面的 T0 重做，但 Advanced 仍缺「不同全盤表面、同一 provisional KC hypothesis」的公開 process-check。新增兩組 project-synthetic 19×19 pair，共 4 個 item；固定順序為 practice A → practice B → process-check A → process-check B，避免 source/target 相鄰造成短期 cue。v1 只處理 rules engine 可完全判定的 bounded target：盤上恰有一串己方棋只剩一氣，成功條件是落子後該原棋串仍存在且至少有兩氣；不判全盤最佳手、厚薄、攻擊收益或形勢。pair source/target 必須 position fingerprint 不同、group size/topology/edge/color/board-region 等至少多軸改變，且不得同 surface class。所有 item 為本站原創合成、公開資產，item 禁止內嵌 answer/correctMove；rules engine 枚舉全盤驗證成功點唯一。兩個 target 固定是 public process-check：呈現資格在 response 前決定，首答與 retry 分開保存；事件綁 provisional KC hypothesis `urgent-atari-rescue-kc-v1`，但 `constructValidated=false`、`skillUpdateEligible=false`、`schedulerEligible=false`、`formalEligible=false`、`independentEvaluation=false`、`qualifiedOpportunity=false`。target 的 evidence taxonomy 標 T2 只表示「不同表面、同一 KC hypothesis」的公開 process-check 類型，不等於 formal transfer 已成立；private unseen formal evaluation 仍須另一個從未公開的 pool。rollback 可單獨移除 Comparable runtime/stream/items，不修改既有 Decision Review／Replay／Comparison 歷史事件。

2026-09-29 Decision Replay v1：Decision Review 已能形成「全盤局面 → first candidate → 原著揭露 → reflection／bounded comparison」的 Response/Evidence，但沒有一個不依賴原 SGF 檔案的 Next Experience。新增獨立 replay stream 與本機 queue：只有已存在 `original_revealed` event 的局面才能加入，snapshot 保存 source review/version/fingerprint、棋盤 stones、ko previous stones、player、move number 與 historical original move。重做時原著再次先隱藏，first response／retry 分開保存，揭露後只做 historical comparison。所有 replay event 固定 `sourceExposure=previously_exposed`、`transferLevel=T0`、`formalEligible=false`、`qualifiedOpportunity=false`、`skillId=null`；不得當 unseen retention、T1/T2/T3、KC、scheduler 或 formal evaluation。later comparable position 明確保留為另一份尚未建立的 contract，不由 replay 自動升格。舊 review/comparison event stream 不修改、不 migration；rollback 可單獨移除 replay UI／stream。

2026-09-29 Real KataGo Smoke Receipt v1：Decision Point Comparison 的下一個 gate 不再用 CI adapter 測試冒充真引擎證據。Windows `tests/katago-bridge-smoke.ps1` 現在要求 clean checkout，先以官方 `katago version` 取得 engine identity，再實跑 `/v1/move` 與 `/v1/compare`；兩者都通過後才產生本機 `.local-evidence/katago-smoke-receipt.json`。receipt 綁 repository commit、四個 contract file SHA-256、KataGo executable/config/model SHA-256、engine/model identity、runtime、comparison request/result；不保存絕對檔案路徑。公開 repo 只保留 receipt schema/verifier/tests，實際 receipt 被 gitignore/release boundary 排除。任何 commit 或 contract file 改變都使舊 receipt stale；`correct`／`mastery`／`transferLevel` 污染會 fail closed。CI 只驗 receipt contract、verifier、PowerShell syntax，沒有真 KataGo binary/model 時狀態必須保持 `READY_FOR_LOCAL_RUN / BLOCKED_ON_LOCAL_RECEIPT`，不得升格為 real-engine PASS。

2026-09-29 Decision Point Comparison v1：在 19×19 SGF Decision Review 已能保存第一候選與原著之後，新增選用的 KataGo 兩手比較層。只有原著已揭露、第一候選合法且與原著不同時才可送出；若 SGF 缺規則／貼目則要求使用者補上，不自行猜測。分析固定只允許「第一候選」與「原著」兩手進 root search，保存 rules、komi、visits、engine/model/provider version、PV 與兩手排序；結果固定標記為 bounded search estimate，只作複盤參考，不產生 correct／mastery／transfer，不更新 KC、scheduler、T2/T3 或 formal evaluation。provider／engine／storage failure 維持失敗，不回退 heuristic。learner-facing 文案只說「這次搜尋較偏向哪一手」，不把 engine ranking 寫成標準答案。

2026-09-29 SGF Decision Review v1：Advanced 已有局部 multi-step reading 與 19×19 自由 practice，但缺少可回看的全盤 Response。新增 practice-only「19×19 棋譜決策點複盤」：單一主線 SGF、可落子手數選取、原著隱藏、first candidate／retry、原著揭露後 historical comparison 與可選復盤備註。source position、item、candidate-set、scoring、rules、evidence taxonomy 與 exposure state 皆版本化。規則引擎只判合法性；原著不同不是錯手，原著也不是唯一最佳手。此事件流不更新 KC／scheduler／T2-T3／formal evaluation；KataGo 若日後加入，只作 bounded comparison。舊 9×9 SGF historical recall API 與語義保留。

2026-09-28 19×19 full-board practice v1：Advanced 的可觀察 Experience gap 是局部練習後缺標準全盤整合，而不是缺更多 scheduler。第四 track 改為路由既有 `live-game` runtime 的 19×19 模式，避免建立第二套棋盤 source of truth。新 `live-practice-events-v2` 允許 19 路但仍是 unscored practice；v1 保留 legacy reader。`live-eligibility-v1` 繼續只接受 9×9，故 19 路勝負、著手與完成局數都不更新 T3／KC／scheduler。19 路 SGF 可 round-trip 與交給外部棋譜工具；本站課程端 9 路單點重建 scope 不擴張。若未來要做 19 路轉折重建，先觀察真人復盤 bottleneck，再建立獨立 scoring／provenance contract，不用 KataGo estimate 直接當唯一答案。\n\n2026-09-28 advanced fixed-interleave v1：cue-control 後的下一個可觀察污染是同 family seed 與 variant 仍可能相鄰，讓短期記憶而非重新讀棋支撐表現。現行 practice 改用固定兩輪：四個 seed 全部完成後才進四個 variant；一次只開下一個 policy position。事件流升 `advanced-sequence-events-v3`，新增 `presentationPolicyVersion=advanced-fixed-interleave-v1` 與 `policyPosition`；v1／v2 各自保留 legacy reader。family 描述資格另要求 seed 與 variant 之間實際出現其他三個 family，缺任一即 `INSUFFICIENT_DATA`。這是強 baseline 的 mixed-practice 工程假說，不是 adaptive scheduler；沒有真人 retention／transfer 資料前停止增加更複雜 interleaving／spacing 演算法。\n\n2026-09-28 曲四 / Curved Four status proof v1：方四／直四合併後，四目眼 status contrast 還缺『彎折但仍活』的 topology，否則學習者可能把 straightness 誤學成活形必要條件。Go4Go 將「彎四」對應 Bent Four；Chen & Chen (1999) 將 perfect four-point curved line 明確稱 Curved-Four，並列為 2-eye region。另有中文教材把曲四與直四並列為活形。
新增獨立 `classic-curved-four-status-v1`，不修改已驗證的 `classic-four-space-status-v1`。曲四使用 L-tetromino geometry；對攻方四種第一手逐一重播，守方每一支都必須至少找到一手合法回應，使剩餘兩個眼點互不相鄰。兩個 variant 覆蓋換色、旋轉與位移。Ontology 明確加入 negative mapping：Curved Four／Bent Four 不得自動 alias `Bent Four in the Corner`，因後者是 corner/rules-sensitive concept。
UI 將曲四追加到同一四目眼 status contrast 的第 5、6 題，前四題方四／直四順序與 contract 完全不變。此 proof 同樣只適用 sealed、無缺陷的局部 eye-space，不外推盤角曲四、外氣、斷點或全局連接。

2026-09-28 方四／直四 status proof v1：曲三合併後，下一個 bottleneck 不是再加一個『找唯一急所』題，而是避免學習者形成『所有眼形都找中心』的錯誤規則。外部教學來源對 Square Four 甚至有明顯衝突：Board to Bits 與多份傳統教材指出完全包圍的 2×2 Square Four 即使守方先走仍死；另有近期網站反向寫成 always alive。因此本輪不做來源投票，而用 rules-backed finite proof 建立 `classic-four-space-status-v1`。
方四 proof：逐一重播守方四種第一手，剩餘三空必須全部同構於曲三，且攻方彎點回應合法。直四 proof：逐一重播攻方四種第一手，守方每一支都必須至少有一手合法回應，使剩餘兩個眼點互不相鄰。題目不保存 expectedStatus／answer。前提限定 sealed、完全包圍、無缺陷的局部眼空；不外推全局含缺陷、外氣或連接的局面。

2026-09-28 曲三 / Bent Three bounded geometry practice v1：在 ontology／fingerprint／extraction／reference-oracle 底盤完成後，重新盤點 catalog-only family。L Group 已有更穩定的英／日／韓名稱與『六點角部死形』教學描述，但仍缺可合法 shipping、可重算的 canonical coordinates，因此保持 BLOCKED，不以名稱或受限圖示手寫 geometry。
為持續提高 playable coverage，轉向曲三。YeeFan／Go4Go 直接把「曲三」對應 Bent Three；日本棋院將三目中手列為基礎生死主題；英語教學資料明確描述三點 L 形的彎點為共同急所。新增 `classic-bent-three-vital-point-v1`：只接受 L triomino，同時接觸另外兩點的唯一 degree-2 彎點由 geometry 即時計算；item 禁止保存 vitalPoint／answer／correctMove。四個 variant 覆蓋攻守、換色、旋轉與位移。這只建立 bounded first-move practice，不建立完整吃淨答案樹、KC、mastery、transfer、T2/T3 或 formal evaluation。

2026-09-27 reference-only geometry oracle v1：extraction gate 解決 public shipping，但研究上仍需要安全使用 rights=unknown/reference-only 的外部棋形作比對。本輪新增 `classic-geometry-reference-oracle.js`：原始座標只存在當次 compare；persistable report 僅保存 source provenance、candidate、MATCH/DIFFERENT 與 context flags，強制移除 points/stones/signatures/fingerprint，且 `canonicalPromotionAllowed=false`。
多來源 aggregation 依 evidenceChain 去重；同一 Evidence Chain 的網址、鏡像或版本不增加獨立證據數。兩條獨立 oracle 一致只形成 reference support，衝突則保留 conflict，不直接修改 ontology geometry。

2026-09-27 geometry extraction v1：fingerprint engine 已能比較結構化 geometry，但若外部 diagram／SGF 的座標取得過程不可稽核，仍可能把轉錄錯誤或授權不明資料變成 canonical evidence。本輪新增 `classic-geometry-extraction.js`，把 manual transcription、SGF parse、source-native coordinates、internal contract 分開；公開升格要求 verified reusable rights，人工轉錄另要求兩次獨立一致覆核；所有可升格 extraction 綁 immutable `sourceDigest`，verified reusable 另需 `rightsEvidence`。衝突回 `CONFLICT`；unknown/reference-only 只可作 reference/oracle，不能把來源衍生座標 shipping 到公開 registry。\n現有 BadukWorld Carpenter Diagram 與 L Group 來源權利狀態保守標 `unknown`；因此即使之後人工讀出棋形，也不能在權利未核實前把該來源衍生座標提交 public repo。小曲尺 ambiguity 仍保持未解。\n\n2026-09-27 geometry-first fingerprint v1：Ontology v3 已能表示 ambiguity／taxonomy relation，但還缺真正能解 geometry-required unknown 的可重算 comparison layer。本輪新增 `classic-geometry-fingerprint.js` 與 `classic-geometry-evidence.js`。Fingerprint v1 對 shape point-set 做 translation + D4 normalization，另把 board context 分開編碼；來源只有文字或圖說而沒有座標時 fail closed 為 `INSUFFICIENT_GEOMETRY_EVIDENCE`。
已驗證的丁四、刀把五、梅花五、花六 practice geometry 作正向 oracle；Carpenter's Square 的 BadukWorld Diagram 2.1 目前只記 `diagram_requires_extraction`，L Group proverb 只記 `text_only_geometry_unavailable`，小曲尺舊術語資料也只屬名稱層。這一輪建立的是研究基礎設施，不宣稱已解決小曲尺 canonical geometry。

2026-09-27 世界死活名型館 ontology v3：v2 已把 names、geometry、ruleset 與 negative mapping 分離，但「小曲尺」暴露另一個 bottleneck：同一名稱可能歷史上指向不同概念層級，而不同語言／教材也可能使用不同 taxonomy。
外部 QA 顯示：日本專業教學使用「隅のL字型」；BadukWorld 直接寫「작은 됫박형 = The L group」，並把 L+1、L+2、Long L、J、Straight J 列在同一延伸教學脈絡；2007 臺灣舊英中術語資料則把 Carpenter's Square 對到「小曲尺」，另有中文教材把「小曲尺」描述為死棋。
這些來源足以證明 ambiguity 與 source-specific taxonomy 的存在，但不足以把「小曲尺 = L Group」或「L Group 是 Carpenter variant」升格。v3 新增 `nameAmbiguities[]`、`nameRelations[]`、`taxonomyMemberships[]`、`taxonomyRelations[]`、`geometryRelations[]`；「小曲尺」以 `ambiguous_historical_mapping + geometry_required` 保存，L Group／Carpenter 只記 `related_unresolved` geometry relation。
此 schema change 不新增任何 scoring authority；真正 geometry resolution 仍需 geometry-first retrieval／fingerprint review。

2026-09-27 世界死活名型館 ontology v2：在丁四合併後，現有 `zhNameStatus / preferredZhTW / aliases / rulesetSensitive:boolean` 已成為下一個 schema bottleneck。多語查核再次證明網址不是獨立 Evidence Unit：Go4Go 明示其 Chinese Go Terms copy 自 YeeFan，因此 source URL 與 evidence chain 必須分開。本輪新增 canonical `classic-shapes-ontology.js`，把 entity type、names、geometry identity、ruleset behavior、negative mappings、dated name research 與 evidence chain 分層；`classic-shapes-catalog.js` 降為 compatibility adapter。Carpenter's Square 不再把「斗方」硬指定為臺灣首選；小豬嘴新增 Tripod Group with Extra Leg mapping 與對 plain Tripod Group 的 negative mapping；金雞獨立定義為 tesuji mechanism；盤角曲四的 boolean ruleset flag 改由 versioned `rulesetBehavior[]` 衍生；L Group／L+1／Tripod 的「未找到中文名」改成有日期與搜尋範圍的負面查核。此 migration 不改任何 practice/scoring、KC、scheduler、learner state、formal evaluation 或 learning claim。

2026-09-27 丁四 / Pyramid Four bounded geometry practice v1：大豬嘴 source-case 合併後，嘗試升級 J Group family geometry，但多語來源只足以確認「扳→點→立→撲」與多個 family 變體，未找到第二組有清楚授權、可機讀且能建立共享 canonical geometry 的 oracle，因此 J Group family 升級維持 BLOCKED。為繼續補 playable coverage，轉向基礎 nakade 缺口。Go4Go 與 YeeFan 都把「丁四」對應 Pyramid Four，YeeFan 明確定義為 T-shaped four-space eye 並指出中央為共同急所，British Go Journal 亦把 pyramid four 作為既定 nakade 結構。本輪新增 `classic-pyramid-four-vital-point-v1`：只接受 T tetromino 同構，唯一 degree-3 點由 geometry 即時計算；item 明確禁止 `vitalPoint`／`answer`／`correctMove` 欄位。四個 variant 覆蓋攻守、換色、旋轉與位移。這只建立 bounded first-move practice，不建立完整吃淨答案樹、KC、mastery、transfer、T2/T3 或 formal evaluation。

2026-09-27 大豬嘴 / J Group source-case practice v1：金雞獨立之後，下一個 playable-coverage bottleneck 轉向角部 complex family。多語查核顯示 Go4Go 等術語表穩定把「大豬嘴」對到 J Group；《圍棋死活一月通》書目整理亦把 Day 12「大豬嘴型」對應 J-Group Pattern。另找到 MIT 授權 `bood/go-test` regression：`config.yml` 將 `大猪嘴.sgf` 標成 `j_group_live2`，在 `loadsgf ... 52` 前輪白走時 expected move 為 R1。為避免把單一實戰 case 誤升格成整個 family geometry，本版只建立 `classic-big-pigs-mouth-source-case-v1`：canonical identity 是 exact 19×19 source position；四題只做旋轉等價，scoring 只接受 source expected move 及其旋轉點。UI 只裁角部 viewport，但 contract 保留完整 position。wrong geometry、wrong legal move、旋轉後沿用 R1 與 item answer injection 必須 fail closed。上游 MIT provenance 另寫入 `THIRD_PARTY_NOTICES.md`。這不建立標準 J Group geometry、完整「扳點死」variation tree、KC、mastery、transfer、T2/T3 或 formal evaluation。

2026-09-27 金雞獨立 rules-backed tesuji practice v1：重新盤點 catalog-only family 後，Tripod Group 雖有 BGA 名稱來源與 GNU Go regression oracle，但 GNU Go 明示預設 GPLv3，且 tripod SGF 未能在該 repository 內辨明為 public domain；因此不把外部 SGF／完整局面搬入 MIT repo，Tripod 維持 catalog-only。本輪改選金雞獨立：Sensei's Library、中央棋院與華語術語來源一致支持「邊線立＋對手兩側氣緊不入」的 double-shortage mechanism；實際 7×7 棋形由本專案自行編製。新增 `classic-golden-chicken-mechanism-v1`，由 rules engine 驗原串僅一氣、一路立後恰兩氣、對手兩側落子皆為自殺禁著、己方任一側可提兩子；四個 variant 改變棋色與邊線方向。此 contract 是 tesuji mechanism，不與 nakade geometry 共用 scoring，也不建立 KC、scheduler、T2/T3、formal evaluation、mastery 或 learning-effect claim。

2026-09-27 花六 / Rabbity Six bounded practice v1：名型館下一個 bottleneck 從 evidence gate plumbing 回到 learner-facing practice coverage。新增六點 nakade geometry contract：family 必須同構於 Rabbity Six／花六，第一手共同急所由唯一 degree-4 eye-space node 推導；四個 variant 改變 role、color、orientation、position。英文 Rabbity Six 與日文花六可綁同一 geometry identity；中文「葡萄六」仍未完成幾何對照，因此維持獨立 needs_review，不把名稱相似升格成 scoring equivalence。此版本只判第一手急所，不建立完整六目中手長變化、KC、mastery、scheduler、T2/T3 或 formal evaluation。

2026-09-27 R1 reviewer-visible fingerprint v5：外部內容審查的版本身份擴充到 reviewer 實際看到的 prompt／focus，以及 familyId／skillId／boardSize／type／pool 等構念身份；仍同時涵蓋 stones／answer／goal。目的不是增加更多自動內容證據，而是防止 reviewer-facing 文案或焦點變更後舊 receipt 被誤用。blinded bank 仍只輸出 id／prompt／focus／stones。舊 v4 receipt fail closed；目前無正式外部 receipt，因此不做自動 migration。

2026-09-27 formal usability candidate fingerprint v1：正式三位 usability smoke gate 的 learner-facing candidate 不再只靠人工宣稱凍結。新增 deterministic candidate manifest，覆蓋五項 critical tasks 的 Core runtime；gate 每次動態重算 fingerprint。human evidence root、usability summary、每位 participant 與 accessibility spot check 必須綁同一 candidate ID/fingerprint。任何 critical surface 改動會使舊 candidate manifest stale 並 fail closed，直到明確建立新 candidate；這不會把開發期 formative observation 回溯升格為正式證據。

2026-09-27 直三四段探索 scope clarification：四階段「找急所→換方向→換攻方→相似反例」是直三目前的專用 teaching sequence，不是所有名型的固定模板。UI 必須把 stage list 視覺與語意綁在直三區塊；其他 family 應依自身可驗證 variation axes 決定 practice 結構。這避免把某一 family 的 pedagogy 誤升格成全域 curriculum invariant。

2026-09-27 直三首屏互動修復：共享 Core `styles.css` 後段對 `.question-card` 使用 named grid-area，但 `classic-shapes.html` 原本的 `.classic-grid` 沒有對應 grid-template-areas，造成題幹卡可被配置到隱式欄位；另有 SVG cursor ring 攔截 click 與初始游標壓在已有棋子的風險。修正原則是 classic page 明確隔離自己的 grid areas、所有交叉點點擊都產生可見 feedback、游標 overlay 不取得 pointer authority。browser test 直接重播 occupied→wrong→correct 三種作答，不以靜態字串取代互動驗證。

2026-09-27 刀把五 × 梅花五 interleaved contrast v1：兩個 geometry-backed family 分區可玩後，下一個 bottleneck 是 section cue 可能替代 family discrimination。新增 6 題交錯 mixed practice，首答前隱藏名稱；round 只引用既有 source item，不複製 geometry／vitalPoint／answer，scoring 委託原 family contract。完成混合題只代表 exposure to contrastive Experience，不是 transfer measurement；若要測 transfer，需另用新的無提示、可比較、未直接練過的局面。

2026-09-27 梅花五 / Cross Five bounded practice v1：在刀把五已有三層深度後，下一個 bottleneck 改為名型館缺跨 family 變異。新增十字五點 family，只評第一手共同急所；geometry 必須與十字五點同構，且唯一 degree-4 中心才是 vital point。四個 variant 改變攻守、棋色與整體位置，專門防止把棋盤中心座標當答案。這只建立第二個可玩 family，不宣稱完整五目中手變化或 transfer 已成立。

2026-09-27 刀把五 sealed reduction v1：新增第三層 bounded branch，只處理「守方零外氣＋局部連續手抜き」條件。contract 從五點眼空推導唯一 2×2 square core 與突出 capture point；攻方已佔 vital point 後，可任意次序補滿其餘三個 core 點，之後守方必須只剩 capture point 一口氣，並由 rules engine 證明提四子後 terminal eye-space 恰為 2×2 square four。另以有外氣 setup 作 negative oracle，要求 forced capture 與 square-four terminal 都失敗。這不是完整刀把五答案樹。

2026-09-27 刀把五 A/B short-read v1：在 vital-point recognition 之上增加一個 3 手 bounded branch：攻方先佔共同急所，守方若走 geometry 推導出的 A/B 任一點，攻方需立即補另一點。A/B 不是手寫座標，而是 eye-space adjacency graph 中「與 vital point 相鄰且 degree=2」的兩個點；seed、反向應手與鏡像共三個 variant。rules engine 必須重播三手合法性。這個 branch 由外部教材支持，但未列抵抗保持 UNKNOWN；仍不宣稱完整刀把五答案樹、mastery 或 transfer。

2026-09-27 刀把五 bounded practice v1：世界名型館第一個從 catalog 升成可玩 family 的新名型只評「共同急所」第一手。geometry contract 以五點 P-pentomino 同構＋唯一 degree-3 眼空節點推導急所，rules engine 再驗 setup 與五個候選落子合法；守／攻、旋轉、鏡像共四個 variant。這個 contract 只支持 vital-point recognition，不支持完整生死、所有外氣／角部條件、mastery、transfer 或 formal evaluation。若要升格完整死活 practice，先補 variation tree、主要抵抗與 negative oracle。

2026-09-27 世界名型館中文命名 v2：名稱來源、中文命名地位與棋形可評分資格分三層保存。新增 zhNameStatus 六態：established、established_alias、teaching_translation、descriptive_translation、no_established_name_found、needs_review。沒有確認固定中文專名的 L Group／L+1 Group／Tripod Group 保留英文 source name，中文只作描述；Long L Group 由多個中文術語來源支持「帶鉤」，並依外氣分「緊帶鉤／寬帶鉤」；Carpenter's Square 由多個中文術語來源支持「斗方」，另保留「金櫃角」別名。「木匠方」降為教學翻譯。這些命名升格不改變 catalog-only 的棋理／scoring 狀態。名稱核對不得自動建立 scoring、KC 或 practice eligibility。

2026-09-27 世界名型館 v1：Johari review 後修正「多語名稱可直接一對一翻譯」的盲點。名型資料改以 geometry/family 為 canonical identity，locale name 只作 alias，必須保存 relationType、reviewStatus、來源與 ruleset sensitivity。已核實的跨語對應可進圖鑑；未完成幾何＋來源核對的刀把五、梅花五、葡萄六、大／小豬嘴、金雞獨立先標 needs_review。只有既有直三維持可玩；圖鑑不建立第二套答案，不寫 learner evidence。盤角曲四在 ruleset-aware scoring 前保持 catalog-only；木匠方在 branch/variation contract 前保持 catalog-only。\n\n2026-09-27 family cue-control：為避免進階 family 診斷被介面直接提示題型，multi-step practice 在完成前以中性編號呈現，不顯示 family ID、完整題名、術語或 variant 關係；同 family 的 variant 只有在 seed 完成後才可進入。完成後才揭露教學名稱與 takeaway。分析端另要求 seed presentation 早於 variant；若使用者以舊版或其他方式先看 variant，transition 必須標 `INSUFFICIENT_DATA`。這是降低 cue leakage 的工程控制，不把 sequence 變成 formal unseen evaluation，也不宣稱真人 transfer。

2026-09-27 family evidence v2：進階 multi-step practice 的事件流升版，事件在發生當下保存 `familyId`／`variantId`／`variationAxes`，避免未來內容定義改變後用新語義回填舊事件。v1 storage 保留為 legacy；v2 family transition 只比較實際保存的 `move_first`，retry／eventual correction 不改首答，缺 seed 或 variant 首答時輸出 `INSUFFICIENT_DATA`。這個診斷不輸出 mastery、不宣稱 transfer，也不餵 scheduler；它的用途是先確認 family 假說是否值得日後用真人資料繼續檢驗。\n\n2026-09-27 進階 sequence family v5：下一個 bottleneck 從「單題是否規則正確」移到「學習者是否只記單題表面特徵」。四個 seed 各新增一個非單純旋轉變形，並用 `familyId`／`variantId`／`variationAxes` 把「哪些任務共享能力」先當內容層可檢驗假說，不直接建立 KC。倒撲改提子數與棋串；枷改出口幾何並保留雙 branch oracle；對殺交換 learner 棋色；征子改為 8×8 十段 forced line。這些變形只能支援後續 family-level first-response 比較，不能在沒有真人資料時宣稱 transfer 或平行等難。\n\n2026-09-26 進階多手讀棋 v4：征子從 BLOCKED 轉為 bounded practice-only sequence，前提是 contract 能逐手驗證 forcedness，而不是只驗固定座標合法。`advanced-sequence-contract.js` 新增 tracked-group「學習者手前氣數」與「對手應手必須等於唯一 liberty」檢查；7×7 征子例從兩口氣開始，六次打吃後每次都只留唯一延長，最後在邊線提八子。另用一顆路線上的白色引征干擾子做 negative oracle，要求原 canonical line 失效。這仍只是一個 bounded ladder family seed；未建立多方向／多引征位置的答案樹、難度可比或真人 transfer 前，不得新增征子 KC、mastery 或正式評量主張。\n\n2026-09-26 進階多手讀棋 v3：在倒撲 sequence 之上增加 rules-backed sequence contract，並只擴兩個能用現有 rules engine 建立明確 oracle 的題型：枷與對殺。枷 canonical line 之外另驗第二主要逃路；對殺驗起始雙方兩口氣、固定應手後各一口氣與最終提三子。runtime 只有在全部 sequence contract 重播通過時才啟動，否則 fail closed。征子刻意不做：現有 `go.js` 能驗合法手與提子，卻還不能證明某一路徑是完整 forced ladder、也不能判引征後所有合理逃路；在建立 forced-line search／branch oracle 前，禁止用固定座標序列升格成「征子已驗證」。

2026-09-26 進階棋盤 Response v1：在 `advanced.html` 的 choice scaffold 之外，只新增一個 bounded multi-step sequence，讓學習者實際走「我一手 → 對手應手 → 我再一手」。第一個案例選倒撲，因為合法性、提子結果與固定應手可由現有 rules engine 獨立驗證；wrong-but-legal move 不推進棋盤，retry 與 first response 分開保存。sequence 使用獨立 `advanced-sequence-events-v1`／`advanced-sequence-v1`，仍固定 practice-only，不寫 KC、scheduler、T2/T3。這是先驗證 interaction contract 的小步實作，不以一個 sequence 代表已建立完整手筋課綱；若後續要擴征子、枷、對殺，必須先為每個 sequence 建立可重算答案樹或規則 oracle，不能靠教學文案直接評分。

2026-09-26 Core 後續進階訓練決策：15 單元保留為 Core Curriculum，不再以「第 16 單元」線性擴充。新增獨立 `advanced.html`，v1 只建立三條 practice-only 訓練線：讀棋／手筋、中盤攻防、官子／全局判斷；完整棋局／複盤先標 planned。這個頁面保存 first response、hint 與 retry，但使用獨立 append-only `advanced-practice-events-v1`，固定 `formalEligible=false`、`qualifiedOpportunity=false`，不寫 KC／scheduler／T2-T3。目的是先補「Core 之後仍需深化」的 Experience gap，而不是在沒有 R1a／真人資料時提早建立更多自適應演算法。若某一進階任務未來要成為量測能力，必須另定 item/KC/scoring/evidence version、可接受答案與 negative test，不能把本頁 choice completion 直接升格。

# 悟之一手：產品與教學設計計畫

2026-09-26 經典名型教學修正：第 4 單元先以既有直三題試行「自主觀察 → 作答後揭名 → 換方向 → 攻守交換 → 相似反例」；名型名稱只作 retrieval cue，不作 KC 或 Evidence。獨立探索頁重用既有 item/scoring source of truth、固定 practice-only，不寫 scheduler、T2/T3 或 formal evaluation。直三 learner-facing 文案實質變更的四題升 contentVersion 2；歷史事件保留舊版本。其餘刀把五、梅花五、大豬嘴等名型須先完成內容核對／外部審題，再考慮加入，不因「經典」直接跨過 R1a。

2026-09-20 修訂：納入技能模型假說、題目特徵、輪替驗收池與簡單對照方案。這次是規格更新；程式完成範圍見第 10 節，來源與附件取捨見 [研究查核](RESEARCH_LEARNING_METRICS.md)。

2026-09-20 執行後稽核：Phase 1–5 的模組與自動測試存在，不等於五階段已取得學習證據。結果遮蔽、首答／重試分離、應用分母、保留題匯出遮蔽、按技能摘要、命名降級及資料遷移已完成 R0；正式成效判斷仍暫停，下一閘門是 R1 獨立審題。最新狀態、反證與執行順序見 [Phase 1–5 喬哈里視窗稽核](PHASE_1_5_JOHARI_REVIEW.md)。

2026-09-21 證據邊界修正：舊 R1 自我審查草稿已使 22 題對目前學習者成為直接曝光題，現行八題七天批次全部包含在內；GitHub 公開則使原 48 題 formal holdout 全部成為公開來源曝光題並退役。因此管線已改為 `personal-pilot-v3`／`personal_descriptive`，只檢查操作、七天返回、資料完整性與負擔，`formalEligible=false`；v1／v2 保留為 legacy。R1a 工具從學習者介面移除，只供不同於學習者的外部審查者進行答案盲內容核對；R1b 難度可比性維持未知。正式未見驗收若未來需要，必須另建角色分離且從未公開的新題流程，現行 pilot 與公開保留組不得原地升格。當前事實以 [完成矩陣](COMPLETION_MATRIX.md) 為準。

2026-09-21 示範覆蓋修正（已由 2026-09-29 Short Talk UX v2 收窄）：19 課均具備棋盤示範；舊「至少兩步」不再作為品質門檻，只有存在可觀察狀態轉移時才使用多步。第 9–19 課使用 5×5 縮圖呈現階段順序、局部比較或候選方向，說明文字明示不是唯一全局答案。這只補齊「先看懂」的視覺教學表徵；棋理適切性、初學者是否看得懂及學習效益仍分別等待外部審查與真人觀察。

2026-09-21 互動覆蓋修正：第 5–14 單元各保留一題既有練習，改為 9×9 局部棋形的直接點選；題幹、提示與回饋均限定為「題幹指定的局部觀察點」，不宣稱找到全局唯一最佳手。這補上後續單元由文字判斷轉入棋盤辨識的練習動作；題目棋理、全局取捨能力與真人可理解性仍待外部審查及真人觀察。

2026-09-21 跨課銜接修正：完成同課題目時維持「下一題」；完成一課或一個單元時，按鈕明示將進入下一課／下一單元短講，操作後自動聚焦新課標題並回到「先看懂」。短講待看狀態寫入本機進度，重新載入不會誤跳回練習。這只驗證操作連續性；實際舒適度仍待最後真人觀察。

2026-09-22 棋盤支架更新：active learner practice 簡化為 5×5、7×7、9×9。課程依單元推薦 5×5（單元 1–3）、7×7（單元 4）、9×9（單元 5 起），自由練習頁可在三種尺寸切換。3×3 曾作試行 scaffold，但依目前單一使用者實際操作觀察空間過小、額外價值不足，因此退出 active Experience；底層相容與 regression test 保留。這不代表已證明 3×3 對所有初學者無效。

2026-09-22 本機電腦對手更新：四種棋盤皆可選雙人同機或和電腦下，使用者可執黑或白。第一版對手是 bounded heuristic bot，只從規則引擎確認合法的候選手中排序，優先立即提子並避免明顯自填；它不是 KataGo、不是棋力模型，也不把勝負、落子選擇或完成局數寫入 KC／scheduler／formal evaluation。其目的只是在單人離線情境補足可反覆操作的 Experience；若真人觀察顯示 bot 行為誤導學習，應降低權重或改以 KataGo bounded integration，而不是把 heuristic 包裝成教學權威。

2026-09-22 人機實戰事件回流更新：`live-practice-events-v1` 繼續保存全部自由／人機操作，維持 unscored practice observation；另新增 `live-eligibility-v1`／`live-scoring-v1`，只把 9×9 人機局中**在學習者落子前已整盤掃描並唯一符合 contract** 的一手提子、以及 computer 上一手新造成打吃後的唯一直接延長救棋，升為 bounded live T3。assessment、first response、retry、未答分母與 contract version 分開保存；多候選、5×5／7×7、actor 不明與全局取捨均不評分。`learner-evidence-progress-v2` 再把既有 T0–T2 與 bounded live T3 並列為描述性 evidence state，並只描述 live 資料是否已掃描、出現 eligible、取得 first response 與跨局 session 的 collection readiness；不輸出 mastery 百分比，不判定樣本量充分，也不直接改 scheduler。

## 1. 北極星

> 讓每次失敗留下可用的回饋，以可比較機會中的長期表現，以及未見局面的保留與應用，判斷進步。

操作目標：**同類錯誤更快被穩定修正，在更多次相關決策機會後才再犯。** 以下為待實作、待個人試用驗證的設計，不是已驗證的圍棋心理量表。研究查核見 [證據與指標規格](RESEARCH_LEARNING_METRICS.md)（2026-09-19 至 20）。

產品目標是**在可承受的練習與紀錄成本下，提高延後保留及未見局面的應用表現**。學習成本、保留、遷移分別呈現，不相乘成總分；不能藉由只出容易題、放棄重要難題或縮減驗收來追求最短修正距離。

範圍維持單人、Windows 本機、可離線、繁體中文與初級互動練習優先；保留十五單元導覽。先試既有兩個技能，再依題目品質與使用負擔考慮擴至三至五個。商業差異化、公開研究成果與完整平台均非個人版完成條件。開源盤點用來找可重用組件，產品盤點用來理解既有做法；任何一種盤點都不能單獨證明市場需求或教學有效性。

首要驗收是獨立新題及減少技能線索的固定應用探測；現有探測尚不能代表完整全局判斷。自然實戰另提供應用證據，缺少機會則待驗。兩個距離指標作為修正流程的診斷資料，不要求同時或逐次改善。原先「每次失敗都縮短修正距離」保留為方向，不作逐次保證。最新缺口審查見 [整合審查](LEARNING_MODEL_REVIEW.md)及[執行後稽核](PHASE_1_5_JOHARI_REVIEW.md)。

實作上保留兩個可選診斷指標：

- **穩定修正距離（SCD，專案自訂）**：首次確認錯誤後，到達延後、無提示、新棋形驗收門檻，累計的相關練習機會；包含有提示練習成本，但有提示答對不能通過驗收。同條件下縮短可作成本改善線索，仍須對照獨立成果。
- **同類錯誤再犯間隔**：相鄰兩次確認的同類錯誤之間，無提示、可判定且成功的相關決策機會數。同條件下拉長可作穩定性線索；時間另列，不能代替接觸機會。

技能作答錯誤比例＝該技能錯答數／可判定的無提示相關決策機會。先以可觀察的技能結果為主，根因未知仍保留在技能結果中；只在具備一致診斷機會時另列根因分類比例。顯示分子與分母，依技能、固定題目難度、遷移層級及練習／實戰分開比較。沒有接觸機會顯示「資料不足」；尚未再犯顯示「至少 N 次，持續觀察」，不表示永不再犯。結果無法判定與使用提示的事件另列，不偷偷算成成功。此比例不是統計學的 hazard；第一版不做存活分析。

### 1.1 穩定與遷移驗收

| 層級 | 任務 | 可支持的判斷 |
|---|---|---|
| T0 | 重做原題 | 重建答案；不能單獨證明保留 |
| T1 | 旋轉、鏡射、同步換色 | 跨表面方向辨識 |
| T2 | 不同棋形、相同原理 | 概念遷移；保留未練過的測驗題 |
| T3 | 沒有技能提示、需要自行辨識是否應用的局面 | 自行辨識與運用；另以 `evaluationContext=standardized|live` 區分標準化應用與自然實戰 |

**Evidence Taxonomy v2：**自 2026-09-21 之後的新事件，T3 統一表示「無技能提示的應用」，再以 `evaluationContext="standardized"` 表示受控固定應用探測、`evaluationContext="live"` 表示自然實戰。歷史 taxonomy v1 保持原語義：舊 `T3` 只表示 live，自有的 `fixed_local_probe` 仍是獨立舊類別，不回溯升格成 T3。彙總跨版本資料時必須先依 `evidenceTaxonomyVersion` 解讀，禁止直接把不相容欄位合併。

〔假設〕初始流程門檻：修正練習結束後約 24 小時與 7 天，各以不同、未練過的 T2 題測無提示首答與關鍵變化；兩次通過只標「延後新題初步通過」，不足以證明可靠或永久精熟。這是 SCD 的暫定結束點。期間可繼續學習，須記錄同技能練習、回饋及實際間隔；不因練習而無限重置排程。有介入練習的結果稱「持續練習下表現」，不能稱無複習保留。24 小時、7 天及兩次通過均為可調設定。

題庫分成練習題、流程檢核題、獨立保留驗收題（holdout）。T2 是遷移層級，holdout 是用途，兩者不能混用。用來結束 SCD 的 T2 檢核題不再當獨立成效證據；保留驗收題不供排程調參，首次呈現即退出未見題池，回饋時機依下段規則。每批用難度相近、不同母題的保留題；若看過其結果再修改方法，下一輪必須換新批驗收。T3 證據另列，不必等待自然局面才允許繼續學習。

輪替驗收池為正式規則：題目首次呈現即記曝光，即使未作答也退出未見池；之後仍可教學，但不能再次計為未見測驗。編題時以母題家族隔離練習與驗收，並在看結果前按技能、固定題目特徵、提示及間隔配對批次。這是設計配對，不代表難度已經統計校準。首答先保存，同批預定評量完成後才顯示答案，避免回饋提示後面的題；中斷與提前看答案須留紀錄。各方案維持相近測驗頻率、題量與回饋時機，因測驗本身也會影響後續表現。

一次機會指一題呈現到回饋結束，或實戰一個已確認的相關決策點；同次反覆點選不增加機會數。SCD 不含觸發錯誤本身，包含最後通過的測驗，未達標時顯示「已練 N 次，待驗證」。每次重開原題可記為 T0 練習成本，不能當新測驗。間隔、題目版本及測驗政策須保存，只有相同口徑才能比較。

完成題數、連續答對與單局勝負只作輔助資訊。

### 1.2 技能與機會的最小定義

借用 Knowledge Component（KC，知識／技能元件）的概念，先為一至兩個技能寫可修訂的任務定義。KC 是由表現推論的能力單位，名稱或欄位填齊不代表它已被驗證。[KLI 原文](https://doi.org/10.1111/j.1551-6709.2012.01245.x)

每張技能卡只固定六項：ID／版本；適用局面與教學目標；成功及可接受答案；先備與排除條件；變形與難度；機會計數及正反例。文案改名不改 ID；實質邊界變更升版本，舊事件保留原版，不為了讓曲線下降而重分技能。

| 試行技能 | 適用與成功 | 排除及邊界 |
|---|---|---|
| capture-last-liberty-v1：指定棋串的一手提子 | 已指定對方棋串，恰有一口氣；合法落子後立即提掉該串 | 不含征子、倒撲、劫、全局是否值得提；u1-06～09 可作待核對練習候選，不能因此宣稱會自行找出全盤提子 |
| direct-join-v1：指定兩串的一手直接連接 | 指定己方兩串，唯一共同相鄰空點可合法連成一串；此題不需靠提子形成連接 | 不含虛連、斷後重連、多手安定或全局取捨；u2-05～07 可作待核對候選，尚非獨立驗收題 |

旋轉與換色仍需規則檢查；邊角、棋串大小等保留為難度條件。每卡至少核對「典型符合、表面相似但不符合、邊界或多解」案例，先固定歸類再看作答。若不同時間無法一致歸類，保留題目層級紀錄，暫停彙總該 KC；不必等所有技能分類完成才開始學習。

機會是一次明確決策，與答題點擊數分開：同次重點只增加嘗試數。先記適用資格，再記首答、提示、結果與缺漏原因。題目合格但學習者答錯，仍算該技能錯答；不能看見錯誤後以「缺先備」移出分母。有提示、未作答、操作中斷或題目歧義分開列；報所有呈現數及無提示可判定數，防止只保留成功樣本。

多技能題先記整題結果；只有可分別觀察的決策才更新個別 KC，不把整題答對／答錯複製給全部標籤。KC 相同只代表待檢驗的共同技能，不能代替相同難度、提示或情境。

技能卡是 provisional model（暫定模型），用來提出「哪些任務可能共享能力」的假說，粒度依教學用途決定，不追求不可再分的原子。[CMU DataLab 說明](https://www.cmu.edu/datalab/getting-started/key-concepts.html)

模型修訂流程為：**提出技能假說與可觀察預測 → 收集題目層級事件 → 檢查替代解釋 → 用新批次檢驗 → 保留、拆分、合併或停用彙總**。例如，同技能下中央與角部題的改善不同，先查難度、提示、先備、熟悉度、介面及樣本量，再考慮拆分；曲線相似也不足以合併。T2 通過不必然預測全局應用成功，辨識時機與全局取捨可能仍未學會。

每次修訂保存原因、舊版與新版對應、所用資料批次及下一批預測。原事件保留原題目／技能版本；新模型的重算結果另存，不能覆寫歷史或拿模型選擇用過的資料作獨立驗收。資料不足時保留題目層級紀錄，不自動拆分、合併或估計「掌握百分比」。

### 1.3 應用探測與線索控制

增加減少技能線索的固定局面作應用探測，保留 T3 為自然實戰，不把模擬結果升格或併入舊 T3。固定探測只能支持其評分契約涵蓋的局部自行發現；具備完整全局條件與可接受候選手評分前，不稱全局應用。以情境欄位記錄局部題／固定應用探測／自然實戰，並與 T0–T3、資料用途分開。

「無技能提示」不只是不顯示題名；還要檢查單元標題、目標棋串標記、上一題回饋與固定題序。可先給中性的「輪你下」，保留足夠全局條件。混入不宜使用該手筋的局面，分開記「該用時有使用」與「不該用時誤用」；不把不適用局面算成目標技能的成功機會。只看找到局部手段，不等於證明該手是全局最佳；全局判斷另需可靠的可接受答案與評分。

### 1.4 排序政策的研究問題與停止條件

Priority Policy（選題政策）是待驗證的工程假說，不是目前的核心答案。先確認題目、答案、回饋、事件語義與獨立驗收足以使用，再研究：**在相同題庫、回饋、練習時間、分散提取與必要先備條件下，增加動態排序能否進一步改善延後無提示 T2、固定應用探測與按機會校正的自然 T3？** 若基本內容或量測仍失真，排序器只會更精準地安排不可靠的活動，故不得先升級演算法。

Expected Learning Value 只作決策檢查表，不轉成未校準的連續總分。Instructional Value 指活動本身可能帶來的學習；Diagnostic Value 指活動能否減少足以改變下一步決策的不確定性。只有「知道這個答案後會改變接下來的教學選擇」時，才付出額外診斷成本；不因存在未知就固定插入探索題。

先備分成兩類：

| 類型 | 用途 | 處理方式 |
|---|---|---|
| Hard validity prerequisite | 缺失時，後續題目的錯誤來源無法有效判讀，例如尚不懂氣、提子、合法落子或劫，卻直接評複雜死活 | 暫停該任務，先補最低必要概念；它是有效量測的底線，不是未達 100% 就鎖住整章 |
| Soft pedagogical prerequisite | 已足以開始下一項學習，但熟練度仍可在後續練習中深化，例如會基本連接後開始簡單切斷與死活 | 作為選題建議與負擔訊號，不要求固定百分比或完全精熟 |

第一版尋找 Minimal Sufficient Policy（足以取得實用收益的最簡政策），採以下 Policy Ladder；每增加一層都須相對前一層取得預定的增量效益，否則停止升級並回退：

| 層級 | 新增內容 | 定位 |
|---|---|---|
| P0｜Strong Baseline | 已核對題目與回饋、hard validity prerequisite、合理固定課程、分散提取，並在合格題內作可重現的簡單交錯／受限隨機 | 排除內容品質、先備缺失、集中練習與固定題序等替代解釋；現有 `fixed-spacing-v1` 只是工程基礎方案，尚未完整達到此實驗基準 |
| P1｜Repeated Weakness | 優先處理跨不同棋形反覆出現的首答錯誤 | 不因一次錯誤或重試答對就推定 mastery |
| P2｜Retention／Transfer | 納入延後未見題與固定應用證據 | 到期只提高優先度；不自動中斷使用者正在進行的課程或整盤棋 |
| P3｜Diagnostic Value | 只有決策相關的不確定性達到會改變選題的程度時，安排低成本診斷題 | 記錄要回答的未知及可能改變的後續動作 |
| P4｜Learned Policy | 在前幾層已顯示排序具有穩定價值、資料量與量測品質足夠後，才考慮 bandit、RL 或其他 learned policy | 不以模型複雜度或個人化程度本身作產品成果 |

engagement、frustration、boredom、session completion 與 learner agency 分開保存，作為負擔、退出風險及自主選擇的約束，不和學習結果加總成單一分數。學習者可主動選擇完整對局或稍後複習；若延後造成的實際成本尚未建立，不把「到期」設成無條件 interrupt。現行介面只有使用者主動按「今日複習」才進入排程，尚未自動打斷新課。

介面必須把目前活動放回學習流水線，明確顯示「現在」、「為什麼現在做」與「下一步」。選題理由要使用可檢查的白話描述，例如「到期複習」、「首答錯後的未見變形」或「固定局面小測驗」；不對學習者展示 P0–P4、ELV 分數或暗示候選自適應已優於固定間隔。策略切換僅影響使用者主動開啟的「今日複習」，並須標示為試行設定與可回復的固定方案。

個人版比較時凍結該批 KC、題庫、回饋及評分版本，於批次之間才修訂模型。主要結果為延後、無提示、不同母題家族的 T2 首答與固定應用探測；live T3 只在有合格自然機會時，報錯誤數／相關決策機會。耗時、完成率、提示依賴與主觀負擔另列。個人多批結果只支持此人的條件式工程選擇；若需要一般因果主張，另設足夠樣本與可行對照。

## 2. 核心能力模型

圍棋的底層戰術能力是讀棋。死活題是標準化訓練工具之一，但課程不把死活等同全部棋力，也不按固定級位硬切閱讀深度。

讀棋題練以下思考鏈；辨識題與應用題依任務取用，不要求每題完整口述：

> 產生候選手 → 預測對手最佳應手 → 選擇下一手 → 檢查反擊 → 讀到可判定結果

| 練習模式 | 作答要求 | 支架與驗收 |
|---|---|---|
| 辨識 | 先直接回答或落子；時間僅輔助，不強制搶快 | 錯誤、疑惑或抽樣時補解釋，不要求每題評信心 |
| 讀棋 | 候選手、主要抵抗與終局 | 可用棋盤手順呈現；不把文筆好壞當讀棋能力 |
| 應用 | 自行選值得處理的位置與行動 | 區分發現局部機會和全局取捨；標準化與自然實戰分開 |

三種是可切換模式，不是互斥能力。撤除冗餘提示屬可調設計；目前沒有直接證據能斷言圍棋逐題解釋必然妨礙自動化。

教學流程以「辨識 ↔ 候選手 ↔ 讀棋 ↔ 評估 ↔ 全局選擇」作可回跳的檢查表，不宣稱是已驗證的大腦串行模型。錯誤採雙軸：內容技能（如斷點、死活）與可能失誤環節；是否答錯和為何答錯分開保存。回饋前自述也可能遺漏或事後重建，人工確認只能提供依據，不能直接證明心理根因。

系統回饋需指出可觀察線索；原因允許「未知」或多個假說，不能只憑掉目數下結論。主分類為棋形辨識、候選生成、計算、評估、全局決策；時間壓力、注意力與知識缺口另作輔助標籤。先抽樣比較不同時間或不同評分者的分類是否一致，不穩定的類別先合併，不為未知強配練習。下表是可用的細分類：

| 錯誤類型 | 判定問題 | 對應補練 |
|---|---|---|
| 候選手遺漏 | 是否沒有找到要點或關鍵手筋？ | 同要點的旋轉、鏡射與換色題 |
| 最強應手遺漏 | 是否只算對手配合的變化？ | 對手有兩種以上抵抗的短分支題 |
| 讀棋中斷 | 是否未讀到提子、做眼或連接結果？ | 限定 3–5 手的短讀題 |
| 終局誤判 | 是否算完變化卻判錯活、死、劫或雙活？ | 相似終局的辨認題 |
| 規則錯誤 | 是否誤解氣、禁著、提子或劫？ | 回到規則棋形並立即重算 |
| 只記座標 | 棋形旋轉或換色後是否失去答案？ | 幾何變形與黑白互換題 |

## 3. 學習循環與支持條件

設計方法採 first-principles-inspired learning engineering（從預期能力與可觀察證據逆推教學機制）。這是本專案的方法描述，沒有宣稱找到不可約的教學原子；既有課程章節繼續作為導覽。用五個功能問題檢查每項功能是否有用：

| 功能條件 | 操作定義與本專案對應 |
|---|---|
| Target／目標 | 學習者未來要在哪種局面完成什麼行為；KC 是暫定建模方式 |
| Experience／經驗 | 提供題目、範例、對局、提示或回饋 |
| Response／反應 | 保存答案揭露前的落子、選擇、手順與求助 |
| Evidence／證據 | 以延後新題、固定應用探測及另列的自然實戰檢查預測 |
| Update／更新 | 根據資料調整下一次練習，必要時修訂技能模型 |

此循環是 **Target → Experience → Response → Evidence → Update → 下一次經驗**。SRS 是排程選項；規則引擎與 KataGo 提供不同性質的局面資料；LLM 是可選解說工具。五個問題供設計及驗收使用，不增加學習者每題必填的步驟。

課程跨多次練習涵蓋原定循環；它是教學安排，不是每題必走的產品狀態機：

> 辨識 → 用力計算 → 實戰 → 自己回想 → 外部回饋 → 間隔 → 睡眠鞏固

| 階段 | 學習者行為 | 產品責任 | 主要證據 |
|---|---|---|---|
| 辨識 | 快速完成簡單吃子、眼形與死活題 | 提供高成功率、短時間、可變形的熟悉棋形 | 首答正確率、反應時間、換形後保留率 |
| 用力計算 | 不動棋、不看提示，讀候選手與最強抵抗 | 提供稍難短讀題，要求讀到活、死、劫或提子結果 | 候選手覆蓋、分支準確率、終局判斷 |
| 實戰 | 在沒有「黑先殺」提示的局面自行發現問題 | 串接 9／13／19 路對局或匯入棋譜 | 是否找到值得計算的局部、是否遷移所學 |
| 自己回想 | 關閉 AI，從記憶重建當時候選手、判斷與疑點 | 在顯示答案前保存自我復盤 | 自述候選手、不確定點與原始判斷 |
| 外部回饋 | 比較自己的模型與答案、老師或 AI | 顯示差異並分類候選、閱讀或評估錯誤 | 錯誤類型與修正後解釋 |
| 間隔 | 在之後的時段重新提取，不直接回放答案 | 排定立即變形、隔日與數日後複習 | 延後首答正確率、再犯間隔 |
| 休息／睡眠支持（非產品狀態） | 結束當日密集輸入，之後再測 | 只安排實際間隔，不設定「睡眠鞏固完成」 | 記再測表現，無法由此驗證睡眠或鞏固是否發生 |

最小循環是「自行嘗試 → 具體回饋 → 關閉答案重建 → 日後新題」。重建可直接落子、走變化或簡短說明，不要求長文。快速辨識的回饋重建可抽樣；不能用是否填完反思判定棋力。

### 3.1 學習者從不會到會的介面流水線

2026-09-20 來源複核後，介面採用以下五步。它是學習導航與證據順序，不是保證每位學習者按相同步速進步的心理階段：

> **看懂一個概念 → 無提示自己作答 → 依具體回饋修正並重算 → 間隔後做未見新棋形 → 在 9 路或棋譜局面自行發現並應用**

失敗不重設整條路線；系統回到最早未穩定的環節，安排較簡單示範、同原理變形或稍後再測。一次答對只代表完成當下題目，不自動標示「學會」或解鎖永久精熟狀態。

| 介面步驟 | 學習者看見的動作 | 系統可保存的證據 | 不得推出的結論 |
|---|---|---|---|
| 1｜先看懂 | 讀一個概念與一個示範；初級八個先備課可逐步看棋形變化，知道本題要觀察什麼 | 已呈現教材、示範步驟與題目 | 看過即理解 |
| 2｜自己作答 | 不看答案先數氣、找候選手或落子 | 首答、提示使用與作答時間 | 當下答對即精熟 |
| 3｜修正重算 | 比較具體理由，回到棋盤重新算一次 | 重試、最終完成與錯題 | 重試答對等同首次會做 |
| 4｜延後新題 | 隔日或數日後做不同棋形的無提示首答 | 實際間隔、未見資格與 T1／T2 首答 | 一次延後答對代表永久保留 |
| 5｜局面應用 | 在 9 路或棋譜局面沒有技能名稱提示時自行發現 | 固定應用探測或另列 T3 | 局部探測等同完整棋力 |

介面必須同時回答四件事：目前位於哪一步、現在要做什麼、做完後去哪裡、怎樣的證據才比「完成題數」更接近學會。首頁顯示初級 1–5、中級 6–10、高級 11–15 的課程方向；題目上方顯示上述五步與動態下一步。側欄原「學習進度」改稱「課程完成」，避免把完成題數偷換成能力進步。重做同一張錯題只能標為第 3 步的修正練習；只有不同未見棋形的延後首答才可標為第 4 步。若今日複習沒有到期題而提供新練習，仍是第 2 步的獨立作答，不偷換成延後證據。

晉級採建議而非鎖課：學習者可以自由選課；系統只在有資料時分別呈現「當下作答、延後新題、局面應用」。缺少延後或應用資料時顯示待驗證，不以猜測補成通過。正式掌握門檻仍依第 1.1 節的 T0–T3 與獨立題規則，介面五步不另創一套分數。

研究依據與限制：

- 日本棋院的公開入門順序由氣、打吃／救棋、切斷與連接、禁著、劫，延伸至序中終盤與死活，並提供基礎題、死活題與 9 路對局入口；這支持技能先備順序與「講解後立即練習」，不證明本產品的五步介面有效。[日本棋院圍棋入門](https://www.nihonkiin.or.jp/teach/lesson/school/)
- 英國圍棋協會建議只先教足以開始對局的規則，避免一次塞入過多資訊，並把 Capture Go 視為學完規則後的早期戰術練習；這支持短講、一步題與 9 路早期應用。[Teaching Beginners](https://media-iframe.britgo.org/organisers/handbook/club4)／[Capture Go](https://britgo.org/capturego)
- 初學者研究顯示範例搭配問題練習可降低學習負荷並改善學習結果，但研究領域不是圍棋，故此處只採「先示範再撤除支架」的保守設計。[Van Gog et al., 2011](https://doi.org/10.1016/j.cedpsych.2010.10.004)
- 提取練習相較只重讀通常有利延後保留；分散效果會隨再測時間而變，沒有一組間隔適合所有目標。[Rowland, 2014](https://pubmed.ncbi.nlm.nih.gov/25150680/)／[Cepeda et al., 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/)
- 教育回饋的效果高度異質，資訊內容比單純稱讚或只報正誤更重要。因此回饋需指出棋形線索、理由與下一步，不能把任何形式的回饋都當作同樣有效。[Wisniewski et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/)

實作驗收：首次進入不用閱讀研究文件，也能辨認「先看懂、自己作答、修正、延後新題、局面應用」；作答前後、錯題複習、間隔練習與局面小測驗會顯示不同的目前步驟及下一動作；320px 寬度無橫向溢出；鍵盤與螢幕閱讀器可讀到目前步驟。真人是否覺得清楚仍依短任務觀察，不由自動測試代替。

簡單題與困難題分工如下：

- **簡單題**練棋形辨識與熟練度，觀察跨方向是否認出，速度與題量僅輔助。
- **稍難題**練候選手與分支閱讀，要求先自行計算，再取得外部回饋；不據此宣稱提升一般工作記憶容量。

依先備能力搭配兩者，不設人人適用的週配額。零基礎可先用範例、棋盤操作與一步題，再撤除協助；不能把缺乏知識誤判為不夠努力。

## 4. 初學階梯

死活不延後到特定級位。學習者理解氣、提子與兩眼後，立即加入極簡死活。

| 層級 | 能力 | 代表練習 |
|---|---|---|
| Level 0 | 規則、氣、提子 | 數氣、一手提子、禁著；active 練習以 5×5 降低局面負擔 |
| Level 1 | 吃子、連接、切斷 | 一步吃子、補斷點、直接連接；可用 5×5 練連斷 |
| Level 2 | 眼、真眼與假眼 | 辨認眼形、找眼形缺陷；可用 7×7 作局部過渡 |
| Level 3 | 最簡單死活 | 一手做活、一手殺棋、三目空間要點；7×7 可作過渡練習 |
| Level 4 | 死活、手筋與對殺 | 兩三步吃子、征子、枷、倒撲、接不歸、短對殺；逐步轉入 9×9 |
| Level 5 | 實戰局部讀棋 | 從 9 路／13 路／19 路實戰擷取局部重算 |

自然練習順序為：

> 一步吃子 → 兩三步吃子 → 基礎手筋 → 一手做活／殺棋 → 簡單死活 → 分支死活 → 實戰局部

目前 15 單元主架構保留；第 4 單元「眼與基礎死活」負責 Level 2–3，第 9 單元「死活閱讀」承接 Level 4–5。下一版先擴充這兩個單元及第 1、2 單元的變形題，不等待學習者完成全部佈局課程。

## 5. 題目難度不用棋力標籤硬切

死活題依認知負荷分類，不以 15K、10K、5K、1K 當作固定門檻：

| 類型 | 任務 | 主要變數 |
|---|---|---|
| A｜辨認題 | 找到要點 | 候選手品質 |
| B｜短讀題 | 正確讀完 2–4 手 | 深度與終局判斷 |
| C｜分支題 | 處理對手 2–3 種抵抗 | 分支數與剪枝 |
| D｜手筋死活 | 運用撲、倒撲、接不歸、挖、扳等 | 棋形辨識與次序 |
| E｜複雜死活 | 處理劫、雙活、外氣、先後手及多分支 | 規則、深度、分支與評估 |

第一版用手數、分支、劫／外氣與先備知識作固定題目描述；easy／standard／stretch 只代表當時對個人的挑戰程度，不能隨人變動後拿來校正歷史成績。未經校準的難度標籤只能粗略分層，不能聲稱已消除難度偏差。

讀棋能力以四個維度觀察：

> 深度、分支數、候選手品質、準確率（分別呈現，不相乘成未經驗證的總分）

初學者從一開始就練「我下一手 → 對手最佳應手 → 我再下一手」。進步時增加的是候選手、抵抗與分支，不只是線性增加手數。

## 6. 基礎題庫擴充計畫

保留新增 100 題吃子與死活題的目標，先以其中少量母題與獨立驗收題試行一至兩個技能，確認答案、回饋及紀錄可用後分批擴充：

| 題組 | 題數目標 | 內容 |
|---|---:|---|
| 一步與短步吃子 | 30 | 一手提子、兩三步吃子、雙打吃、征子與枷的起點 |
| 眼形與一手死活 | 40 | 真眼／假眼、一手做活、一手殺棋、三目空間要點 |
| 短讀與基礎手筋 | 30 | 2–4 手、少量分支、撲、倒撲、接不歸與短對殺 |

每個母題依適用條件選擇以下變形，不強制每種都生成：

- 旋轉 90／180／270 度。
- 水平或垂直鏡射。
- 黑白互換並同步改變先手方。
- 保持教學目標不變，調整外圍無關棋子或位置。

變形題必須重新經規則與答案樹驗證；合法手驗證不足以證明死活答案正確。改變外氣、征子引征、劫材或先後手可能改變答案，不能直接當等價 T1。T1 通過只記棋形辨識證據，流程結束依第 1.1 節 T2 延後檢核，成效另用獨立保留題與 T3 驗收。

先用少量同類題學會工具，再混入倒撲、接不歸、征子、枷、普通連接及「局部不必應手」的辨別題。脫先題須保留足夠全局條件。此順序是待試驗設計，不把全部亂序視為普遍最佳。100 題應包含獨立母題與保留測驗題，旋轉副本不能冒充 100 個不同概念。

## 7. 答案與提示政策

〔假設〕簡單題可先試幾秒至一兩分鐘的建議思考時間；卡住時檢查先備知識、題目歧義及介面操作，再提供提示。此時間不是判定能力或注意力的診斷門檻。

需修正的題目依模式安排下列閉環，辨識重建可抽樣；不要求每題全部完成：

> 看答案 → 關閉答案 → 從頭重算 → 立即做變形題 → 隔日複習 → 數日後再驗證

提示分三層：

1. **觀察提示**：指出要看氣、眼、連接或對手最強抵抗，不透露落點。
2. **候選提示**：縮小到兩三個候選點。
3. **變化提示**：顯示第一個關鍵應手，但保留終局判斷。

系統需記錄提示層級。看過答案後答對不能與無提示首答正確視為相同證據。

## 8. 每日練習循環

練習分為兩種長度，不要求每天都完成長版：

| 模式 | 約略時間 | 內容 |
|---|---:|---|
| 短版 | 20–30 分鐘 | 簡單辨識 5–10 分鐘、短讀 10–15 分鐘、自我回想與回饋 5 分鐘；使用先前實戰局部或既有題目 |
| 完整版 | 60–100+ 分鐘 | 簡單辨識、深度計算、一盤適合盤面的實戰、自我復盤、外部回饋與關閉答案重建 |

完整版參考順序如下，時間與題量可依負擔調整：

1. 5–10 分鐘簡單死活／手筋，建立棋形組塊。
2. 15–20 分鐘稍難死活，不動棋、不看答案，記錄候選手與主要分支。
3. 進行 9 路、13 路或 19 路實戰；盤面依目前程度選擇。
4. 不開 AI，從記憶挑出最不確定或影響最大的 3–5 手。
5. 再看題解、老師或 KataGo，比較自己的候選手與判斷。
6. 關閉答案，重新走完關鍵變化並說明錯誤類型。
7. 結束當日密集練習；隔日與數日後由系統重新出題。

形成固定循環：

> 模式辨識 → 深度計算 → 實戰找題 → 自我提取 → 外部修正 → 分散再測 → 跨時段／跨日再測

本程式現已提供 9×9 完整小棋盤對局，以及 5×5／7×7 基礎與過渡練習；3×3 只保留 legacy/runtime compatibility 與 regression coverage；13×13、19×19 與外部 AI 分析仍由 KaTrain、實體棋盤或其他棋譜工具承接。內建小棋盤練習屬 practice experience，不自動成為正式 retention／transfer 證據。

## 9. 產品資料需求

每道題增加：

- `skillTags`：內容標籤供導覽；量測另連技能卡 ID／版本及該題的適用資格，不能只靠「死活」等大標籤計算。
- `errorTypes`：允許出現的錯誤分類。
- `variantFamily`：母題與變形題家族。
- `readingDepth`、`branchCount`：題目最低閱讀深度與主要抵抗分支。
- `terminalResult`：活、死、劫、雙活、提子或連接完成。
- `sourceReview`：來源、編題者、規則驗證與人工審核狀態。

題目另保存可追溯的 task features（任務特徵），避免把局面資訊全部壓進技能標籤：棋盤尺寸、邊／角／中央、目標棋串大小與氣數、閱讀深度與分支、劫與外氣條件、干擾棋子、先備棋形、先手方及作答方式。局面、題目特徵、可接受答案及評分規則綁定題目版本，保留舊版可讀內容。第一批只填兩個技能實際需要的欄位；未知與不適用明示，不憑空填深度、分支或心理標籤。規則可算出的事實自動核對，其餘保留編題及查核依據。

每次作答增加：

- 題目、技能與變形家族。
- 正誤、選擇的候選手與錯誤類型。
- 使用的提示層級、是否看過答案。
- 實際任務模式：辨識、讀棋或應用；不記睡眠鞏固狀態。
- 顯示外部回饋前的候選手、自我判斷與不確定點。
- 外部回饋來源、回饋顯示時間與關閉答案後的重建結果。
- 首答時間、總嘗試次數與完成時間；呈現、合格機會、無提示可判定樣本分開。
- 修正距離、再犯間隔與下次複習日。

另保存：決策機會 ID、T0–T3、題目是否已曝光、練習／流程檢核／獨立驗收用途、固定難度與個人挑戰程度、錯誤分類依據與確認狀態、上次相關練習／回饋時間、實際間隔及排程政策版本。錯誤卡連到 SGF 手數、原局面、原判斷、候選手及修正理由。AI 分析需另記引擎／模型、規則、貼目、搜尋預算與評估視角。

模型修訂與驗收另連到技能模型版本、評分版本、驗收批次、母題家族、首次曝光及退休時間、選題方案與理由。每次呈現有獨立機會 ID，包含未答與中斷；匯出原始事件與其版本依據，才能重算並稽核漏樣本。兩個試行技能現已提供 JSON 原始事件匯出；Markdown 事件表仍是閱讀摘要。`elapsedMs` 是題目開啟後經過時間，包含閒置及重試，不能直接當有效學習時間或每次作答耗時相加。

自動記錄機會、提示、時間與首答；自述與分類只抽樣或對關鍵錯誤填寫，另記填寫時間與略過率。一次圍繞同一死活的連續著手可記為一個局部事件，保留各手明細，避免把同一事件當多筆獨立證據。對結果未知報覆蓋率；即使根因未知，已知錯答仍保留於技能錯誤比例。

系統不要求記錄睡眠時數、品質或健康資料。延後驗證依實際經過時間；23:59 到 00:01 不算一天。跨夜只作排程邊界，不能把次日答題結果直接歸因於睡眠。

## 10. 實作階段與完成門檻

### Phase 1｜少量技能定義、答案與事件

2026-09-20 實作狀態：已建立 `capture-last-liberty-v1` 與 `direct-join-v1` 的版本化技能卡，保存正例、反例與邊界資料；為七題指定棋形保存初始母題家族、題目特徵、呈現、首答、重試、提示、未答／中斷、首次曝光、題目／政策版本與 JSON 原始匯出。內容／規則、狀態及 Chrome 流程測試通過。**Phase 1 的事件工程條件式通過；技能模型效度與真人學習未通過。**

- 先為第 1.2 節兩個技能定義正例、反例、邊界與計數，並核對答案；再補試行題的技能卡連結、可選原因與母題關係。技能定義與題目品質同時檢查，確認有用後才擴至 98 題。
- 已保存每次作答、提示與時間事件，以及呈現、未答／中斷與首次曝光。
- 已保存試行題的實際任務模式、題目特徵、題目版本與事件政策版本；回饋前後判斷仍只在抽樣或使用者主動選擇時記錄，不收睡眠狀態。
- 已能匯出合格機會、首答、提示與原始事件，並由 `learning-metrics.js` 重算可觀察任務錯誤、SCD 與再犯間隔。錯誤類型只描述技能任務結果，不推定粗心、誤解或其他心理根因；缺少 `qualifiedOpportunity`／`unhinted` 的舊事件不納入診斷。SCD 必須通過約 24 小時與 7 天的非 holdout T2 首答；變形庫已提供這類流程檢核題，但目前仍沒有真人完成樣本。
- 後續以手動、可留痕方式補母題關係並修訂技能假說，不實作自動模型發現。

完成門檻：實際瀏覽器重開後資料仍在；呈現、首答、提示及機會資格可由完整匯出與版本規則重算。涵蓋零機會、分類未知、有提示、同題重點、未作答及中斷；兩個技能的正反例、邊界與答案可核對。SCD／再犯計算器須驗證未達標、兩段延後 T2、holdout 隔離、缺失資格的舊事件及尚未再犯下限。live T3 另須驗證 eligibility 在結果前凍結、未答不消失、first response 不被 retry／reload 覆寫、不同 contract version 不混算、同局多手不冒充跨局獨立樣本；工程完成不偽造正式題庫或真人學習結果。

### Phase 2｜基礎吃子／死活變形庫

2026-09-21 實作狀態：已建立獨立 `phase2-content.js` 題庫，保留 30 題一手提子、40 題直接連接及 30 題救被打吃棋，另加入 24 題直三做活／破眼與 24 題第二眼缺口補／破，共 148 題、43 個母題家族；每題有版本、母題家族、用途、回饋政策與題目特徵。原兩個核心技能共 70 題、13 個家族，第二套規則實作的唯一解窮舉及 31 題盲審工具維持不變。直三題以規則引擎驗證守方中央做出兩眼，以及攻方中央後的三手提取線；第二眼題驗證落子後的兩個真眼區域或只剩一眼；六個診斷技能均有練習、非 holdout T2 流程檢核及家族隔離 holdout。**題數仍不是獨立概念數或獨立樣本數；兩類題不等於完整死活課綱，位置難度與教學效度仍待外部審題。** 舊 `applicationProbes` 直接複製 holdout 棋形，不再作獨立應用證據。詳見 [R1 內容核對](R1_CONTENT_AUDIT.md)。

- 先為兩個技能準備少量獨立母題、T1／T2、輪替驗收批次與可可靠評分的固定應用探測；按母題隔離用途，再進行固定間隔試用。此小批試用無需等全數 100 題或 SGF 功能完成。
- 新增 30＋40＋30 題組。
- 每個母題至少有一個未見變形。
- 所有落子與終局由規則或答案樹驗證。

完成門檻：題目結構、規則與變形等價測試通過；驗收批次的用途、母題及曝光可查。少量題驗收與百題擴充各自記完成狀態，未完成百題不妨礙試用，結構通過也不代表真人有效。

### Phase 3｜固定間隔對照與可選自適應複習

2026-09-20 實作狀態：已建立 `scheduler.js` 與頁面上的「今日複習」，固定方案可保存 1、3、7、14 天到期日。R0 已把同一次呈現改為只用首答更新排程，另存最終答對與嘗試數；同題先錯後對會保留首答錯誤，候選自適應的下一題由測試確認為同母題未見變形。排程只在使用者主動進入今日複習時執行，不會自動打斷新課。現有固定與候選自適應都只是工程方案，尚未構成第 1.4 節的完整強基準或有效政策比較。**Phase 3 工程流程通過；方案效果比較仍暫停。**

- 先提供可固定版本、可重現的間隔練習與高品質回饋模板，作為正常可用的基本方案。第一批少量題可先接此方案；正式比較前另補 hard validity prerequisite 與合格題內的簡單交錯／受限隨機，形成 P0 強基準。
- 自適應方案依第 1.4 節逐層試驗；目前只實作「首答錯後安排同母題未見變形」，不能把它描述為已完成 repeated weakness、transfer-aware 或 uncertainty-driven policy。原因未知時不強制根因分類，也不只依題目 ID 重播。
- 基本方案與自適應方案均保留預定技能覆蓋及適量挑戰；選題記錄政策版本與理由，資料不足時沿用基本方案。隔日與數日後的實際再測按第 1.1 節記錄。
- 依第 1.1 節安排流程檢核；獨立保留驗收另排，不以其結果調整當輪排程。快速再犯縮短練習間隔，穩定通過才延長；T0 會而 T2 不會則補遷移題，實戰再犯則重開週期。排程改動必須記錄，避免把題目變簡單誤當進步。

完成門檻：可重現「犯錯 → 回饋／變形 → 延後複習 → 獨立批次驗收」及固定方案回復路徑；不把測試通過當成自適應較好。先建立 P0 強基準，再逐層檢查增量效益；沒有穩定實用增益、量測仍不足或額外負擔超過收益時停止升級。

### Phase 4｜固定應用探測與實戰局部回流

2026-09-22 實作狀態：五個減少技能線索的固定應用探測仍與自然實戰分開；9 路 SGF 任意手數重建與反思資料留存維持原邊界。自然實戰另已建立 bounded live T3 管線：每個 9×9 人機學習者回合先整盤判 eligibility，v1 只支援唯一一手提子與 computer-provoked 唯一直接救棋，並保存未答、首答、retry 與版本。**這只完成兩個局部 scoring contracts 的自然實戰資料管線；其他技能、策略選擇、全局方向與棋局勝負仍不可自動評成學習進度。**

- 先用減少技能線索的固定局面，檢查局部技能的自行發現；混入不適用局面。只有具備足夠全局條件及經核對的可接受候選手時，才另報全局評分。此成績與 live T3 自然實戰分開，不能換名稱後宣稱實戰已驗證。

- 支援 SGF 匯入或手動建立局部棋形。
- 從實戰標記一個局部問題並連到技能家族。
- 可把 KaTrain 候選手當分析線索，仍由使用者確認教學結論。

流程：SGF → 背景分析但隱藏結果 → 保存自己的復盤 → 顯示 AI 異常線索 → 確認原因／保留未知 → 錯誤卡 → 經驗證的 T1／T2 題 → 間隔複習 → T3。live T3 必須也抽查正確的相關決策，不能只收 AI 找到的壞手作分母。AI 顯示錯誤位置本身就是提示，該次復盤不當作無提示 T3 成功。

KaTrain／KataGo 已有分析與重試能力，但自動根因分類、題目生成、間隔佇列及本程式接線仍需實作驗證。2026-09-20 已在此環境確認 KaTrain 1.20.0 桌面程式可啟動並回應；其目前設定的 KataGo backend、執行檔與模型欄位均為空白。依 KaTrain 的預設行為，空白欄位可回退至內建資源，不能單從設定推定引擎缺失。2026-09-21 實機驗證進一步確認封裝內含 KataGo 1.18.1、38 MB 模型與分析設定；模型可載入，且 OpenCL 可辨識 GeForce 840M 並開始自動調校。可是，該分析設定缺少 KataGo 1.18.1 啟動時必填的 `logAllGTPCommunication`、`logSearchInfo` 與規則欄位，GTP 測試沒有取得回應。故目前只能說硬體與模型可載入，**不能說 KaTrain 分析可用**；修正後必須以一份已知 9 路 SGF 取得可重現的候選手或評估輸出，才可把外部工具列為可用。人類風格模型只供候選與難度參考，不是個人的認知診斷器；下載模型後可本機執行，實際安裝版本與效能須另測。

2026-09-21 更新：已備份 KaTrain 的原使用者設定，改以 KataGo 1.18.1 同版本官方 GTP 設定檔啟動，並補回 KaTrain `analysis` 模式必需的 `numAnalysisThreads`、`numSearchThreads` 與 `nnMaxBatchSize`。GeForce 840M 的 OpenCL 校準已完成並保存到固定資料夾。固定 9 路局面（黑 D4、白 E4）經 GTP 回應 `E5`；同一局面也經 KaTrain 實際使用的 `analysis` 模式回傳 JSON 分析結果。原版 KaTrain 桌面程式隨後成功載入並建立 `katago.exe analysis` 子程序，先前看到的 Kivy 繪製例外不再作為目前的阻塞判斷。這只是工具層驗證；候選手仍是有限搜尋估計，不可當作唯一教學正解或人類學習診斷。

規則引擎在指定規則及局面下檢查合法手、棋串與氣；KataGo 的候選、目數、勝率及地盤歸屬是搜尋估計，不能當作有限搜尋已證明唯一答案。LLM 如日後加入，只根據已核對的局面與答案資料解說、比較及提問；需要連續變化時仍核對答案樹。解說錯誤或沒有實際效益時可回到固定模板。

完成門檻：至少一盤使用者自己的本機棋譜能選擇任意手數，先保存原判斷與候選手，區分原著手及經確認的可接受答案，完成複習並匯出可追溯反思。內建 setup SGF 只完成解析與重建示範，不算此門檻通過。

### Phase 5｜個人縱向試行與驗收

2026-09-21 現行狀態：舊 R1 自我審查草稿已使 22 題對目前學習者成為直接曝光，其中包含七天流程使用的八題；GitHub 原始碼已使原 48 題 formal holdout 全部公開曝光並退役。管線維持 `personal-pilot-v3`／`personal_descriptive`，只檢查操作、七天返回、資料完整性與負擔；狀態、批次、呈現與作答均強制 `formalEligible=false`，一般原始匯出仍遮蔽公開保留組答案。R1a 只保留答案盲內容核對用途；R1b 平行批次可比性尚未建立。**正式未見、題目效度、保留、遷移、學習成效與方案比較全部暫停；若要重啟正式評量，必須另建從未公開的新題庫。**

歷史狀態（2026-09-20，已由上段取代）：當時為 `personal-longitudinal-v2` 管線，基線與追蹤各四題、使用不同母題家族並鎖定七個實際日。R0 已遮蔽正誤造成的棋盤差異、補齊固定應用探測呈現分母、遮蔽未完成批次的保留題匯出、改為按技能描述方向，並把 v1 資料保留為不納入證據的舊資料。使用者已授權略過 R1 的獨立審題，故批次曾記為 `personal_provisional_without_independent_review`；此狀態不得再作現況依據。

先做一至兩個技能的個人前後觀察，不把 1–2 週基線當成足夠樣本或因果實驗。預先指定題目與評分規則、固定難度、無提示條件、觀察期間與可承受的紀錄負擔。基線也用不同未見題；測驗本身可能促進學習，需保持前後測驗方式一致。

〔待驗假說〕在 P0 強基準已成立後，P1–P3 的動態排序仍能在相同練習成本下增加延後新題與應用表現。先比較**相同可用題庫、相同 KC／題目版本、相同時間預算、相同教學／提示、立即回饋品質、分散提取及必要先備條件**，差異只在排程及選題政策；實際耗時、題量、難度覆蓋與介入練習另記。輪替驗收用預先配對、不同母題的批次，不在兩個條件下重用同一張已見驗收題。若未來另試 LLM 解說，與已核對的固定回饋模板比較，先固定選題政策，避免同時改兩件事而無法判斷來源。

開始對照前，寫下主要成果、延後時間點、批次與評分規則、可承受的觀察預算、足以影響使用決策的最小改善及判斷方式；收完預定批次再檢視，不因某週變好便提前宣稱成功。個人資料可能受先後順序、技能間遷移與測驗練習影響；分批前後觀察只作個人決策參考，需要因果主張時另設可行對照，不假裝已有隨機實驗。觀察預算用完但不確定性仍大時，標資料不足並沿用成本較低方案，不能將「未見優勢」改寫為「證明無效」。

主要結果為獨立保留 T2 的首答／關鍵變化，以及獨立固定應用探測；可比較 live T3 自然實戰另列，並以錯誤數／合格相關決策機會報告。SCD、再犯間隔與提示依賴為診斷資料；完成率、主觀負擔及主動續用分開呈現，不當作學習成效。依技能卡版本、難度、線索與情境報每批分子分母、結果未知、獨立母題數及棋局數。不把旋轉副本或同局連續手當獨立樣本，不設未經校準的全民通過率。

機會序號只作時間順序，不能單獨當第三條成效曲線。第一版用事件表與分批錯誤比例／延後探測結果；不強制平滑下降，不先導入 BKT、AFM 或 IRT。不同模型能解釋同一表現時保留不確定性；SCD 是否值得保留，先看它是否改變補練決策或節省學習成本，預測段位並非個人版第一門檻。

| 結果 | 判斷與處理 |
|---|---|
| 獨立 T2 在不同批次改善，T3 也有可比較改善 | 有限的個人保留／遷移證據；仍不能只靠前後差異確定因果 |
| 獨立 T2 改善，T3 缺機會 | 局部能力有證據，實戰待驗；不中止學習 |
| SCD 等改善，獨立驗收未改善 | 尚無遷移證據；查題目難度、資料量、評分與題庫洩漏，再考慮過度記題 |
| 獨立驗收改善，SCD 不變或變長 | 不否定學習；檢查練習難度與 SCD 門檻是否有診斷價值 |
| 紀錄不穩定或填寫擠壓練習 | 先減欄位、合併原因分類，暫停複雜排程 |
| 同等預算下自適應在新批次持續改善預定成果，成本可接受 | 支持此人的條件式工程效益；跨人與因果主張仍待驗證 |
| 足夠可比較資料未達預定實用增益，或額外負擔超過收益 | 簡化模型並回到固定間隔方案；保留原始紀錄以便重評 |
| 對照題量少、難度不配對或兩方案互相影響 | 資料不足；不判勝負、不宣稱兩者等效 |

若排除明顯量測問題且累積多批可比較資料後，流程指標仍無法對應獨立成果，削弱或撤下它作為進步代理的地位；不直接宣告整套學習科學失效。SCD 不改善選題或成本判斷可停用；LLM 未較模板提供可觀察效益則不設成核心依賴；KC 歸類長期不穩，先回到較粗且可解釋的技能或題目紀錄。若之後需要因果推論，再考慮不同技能錯開介入的多基線設計，並檢查技能間相互遷移；不假設學會的能力能洗掉以做 ABAB。

完成門檻：先通過 R0 證據完整性閘門，再取得可重算、無非預定線索、按技能分列的多批真人資料；第一對四題批次只能顯示追蹤觀察值較高／相同／較低，總結仍為資料不足。只有預定多批且量測條件可比時，才據此保留或簡化流程。真人資料尚未取得，本階段未通過。

## 11. 證據與限制

本輪新增的研究核對、附件修正與精確計數範例，見 [RESEARCH_LEARNING_METRICS.md](RESEARCH_LEARNING_METRICS.md)。一般學習研究支持設計方向；SCD、T0–T3、驗收次數與自適應規則均是專案設計，尚未取得圍棋專用效度證據。

市場僅作背景：Go Magic 官方列有技能樹與個人化建議；AI Sensei 官方列有依表現調難度的 Challenge Mode，並描述 Training Mode 的棋局位置練習。這些足以排除籠統的「個人化學習尚無人做」，不能證明本專案有效、具有商業優勢，或其他產品缺少公開驗證。功能存在與成效研究分別查核；本輪沒有做完整市場／成效研究普查。[Go Magic](https://gomagic.org/) [AI Sensei Challenge Mode](https://ai-sensei.com/news/oSTjv) [AI Sensei Training Mode](https://ai-sensei.com/news/9aN5r)

- 日本棋院公開課程支持在入門階段教授提子、連斷、征子、枷、劫、禁著、眼與簡單死活，並從 9 路逐步進入較大棋盤。[日本棋院課程例](https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html)
- 英國圍棋協會建議初學者用 9 路與吃子棋開始，並在早期引入眼與簡單死活。[英國圍棋協會初學教學](https://britgo.org/organisers/handbook/club4)
- 中國圍棋協會網站收錄的《入門到 10 級 1000 題》書介已核對，列有吃子方法、簡單死活與中盤題；它是教材內容證據，不是官方統一課綱或成效實驗。日本棋院《はじめての詰碁》書介亦明載基本題反覆、換色與轉向；韓國棋院教材涵蓋佈局、行棋、死活及官子等領域。完整來源見 [整合審查](LEARNING_MODEL_REVIEW.md)。
- 100 題新增目標是本專案的設計決策，不宣稱是唯一有效題量。是否有效要以真人練習事件驗證。
- 記憶研究支持提取練習、分散練習及睡眠參與記憶鞏固，但本計畫是把一般學習科學轉成圍棋產品設計，並非已由臨床試驗證明的最佳圍棋處方。[提取與分散練習綜述](https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/) [分散練習統合分析](https://pubmed.ncbi.nlm.nih.gov/40564553/) [睡眠與記憶綜述](https://pubmed.ncbi.nlm.nih.gov/40875205/)
- 1、3、7、14 天等間隔只能作為可調啟發式；實際排程要依延後答題結果修正。
- 本產品不把「次日答對」直接解釋成睡眠效果，也不宣稱圍棋訓練能提升一般智力。
- 不採左右腦課表、PFC 題量、固定復盤窗口或多巴胺最佳勝率處方。職業棋手 AI 研究與腦影像結果不直接驗證成人初學者的本產品流程；AI 推薦相似度也不是完整棋力定義。

## 2026-09-23 Change note｜初學者對弈入口與進階 provider 分層

- **目標行為：** learner-facing 主流程只要求選「練習電腦」或「雙人同機」及執黑／白；KataGo、Remote API、endpoint 與連線測試收進預設收合的進階設定。新使用者預設「練習電腦」，不要求理解引擎名稱、API 或安裝流程。
- **不可破壞 invariant：** provider 仍只有候選權；所有 play 再經規則引擎；KataGo／Remote failure 保持 ERROR，不 fallback；不在 learner UI 收集或保存 API key；既有 opponent 設定可繼續讀取。
- **主要 failure case：** progressive disclosure 只藏文字卻破壞既有 KataGo／Remote 使用者設定、provider endpoint、電腦回合或 evidence actor semantics；因此保留原 opponentMode 值並新增 UI contract／negative tests。
- **驗收：** 初學者 selector 不出現 KataGo／Remote/provider 術語；進階區可選引擎、看 KataGo 官方下載入口、設定 endpoint 與測試連線；API key input 不存在；既有 live-game、provider、Windows UI、repository boundary、Sabaki oracle 全部需 PASS。
- **證據邊界：** 這是 information architecture／usability risk reduction 的工程修改；是否真的讓初學者更容易理解仍需三位目標初學者短任務觀察，不能由 UI test 升格。
- **Rollback：** 恢復 v6 mode panel 與預設 local；不需棋局、practice event、KC、scheduler 或 formal evaluation migration。

## 2026-09-24 Change note｜單點原著重建與連續復盤候選

現有 SGF 流程重新命名為「單點原著重建＋反思」：
`匯入單一主線 9 路 SGF → 選任意可落子手數 → 顯示該手之前盤面 → 先保存候選／理由／預期應手 → 下出記憶中的原著 → 比較是否與歷史原著一致 → 人工或 external analysis 另行確認可接受答案`。

設計邊界：
- 原著是歷史事實，不是唯一最佳手。
- 與原著不同不能自動標成壞手。
- 此活動是 retrieval／reflection practice，不更新 KC、scheduler、T2/T3 或正式評量。
- 原著重建表現若日後要作診斷，只能回答「是否記得／重建該歷史著手」，不能直接代表理解、讀棋或遷移。

**連續猜手／整段重建**暫列 experimental backlog。只有現有單點流程在真人使用中出現可重複 bottleneck，且 Reference 工具不足時，才做最小 sequential prototype。驗收先看工程完整性與操作負擔；只有在額外資料能改善 prediction、selection 或 intervention 時才保留。即使連續重建率提高，也必須另看獨立新局面 retention／transfer，避免把「記得原棋譜」偷換成「會在新局面用」。


## 2026-09-27｜Explore Go：歷史內容先做獨立閱讀層，不併入 Core curriculum

### Bottleneck

目前 Core／Advanced 的學習入口已清楚，但「圍棋為什麼是 19 路、古代規則為何不同、典故哪些可信」沒有適合的 learner-facing 知識出口。直接把深度研究塞進 Core 會提高認知負荷，也會把文化史內容誤作必要 prerequisite。

### 決策

- 歷史與典故先以獨立 `history.html` 發布，定位為 optional Explore experience。
- MVP 只做四個問題：起源、19×19、規則演化、典故史實分層。
- 每個主張可使用「確證／高度可信／有爭議／傳說／研究假說／未知」標籤；不使用虛假百分比。
- 首頁 Core 仍是唯一零基礎主 CTA；三張課程階段卡只代表 Core 1–15。Advanced 維持獨立的第二層進階入口，不佔用 Core 單元 6–10 或 11–15 的入口；History 只在較低資訊層提供閱讀入口。
- 歷史頁不得寫 learner state、不得更新 scheduler／KC／T2-T3，也不得把閱讀完成視為學習證據。

### 驗收與停止線

- 能從首頁進入、能回 Core／Advanced／名型館。
- 手機單欄、來源可展開閱讀；MVP 不依賴 JavaScript。
- 任何「發明者、首次年份、單一路徑傳播」若證據不足，一律保留 UNKNOWN／DEBATED。
- 若後續沒有觀察到讀者需求或不改善理解，不擴張成大型歷史百科；新增主題以前先問是否解決實際 learner question。


## 2026-09-27｜Historical claim evidence chain v2

History Explore 的證據呈現遵守「claim → evidence unit → source record」而不是「頁面底部有很多來源」：

- 起源傳說：先秦「弈」的存在與「堯作圍棋」後世傳說分成不同 claim；傳說來源只能證明傳說流傳。
- 棋盤尺寸：17 路傳世引文、19 路算書文字、595 年墓葬實物與後世棋論分開；不得以數字巧合補成改盤原因。
- 規則史：IDP 手稿身份與現代文字轉錄分工；「子多為勝」只支持傳世規則語句，作品年代與完整 scoring reconstruction 仍可爭議。
- 韓國巡將棋：KCI 支持制度變遷，BGA 支持可復現的固定起始配置；兩者不是同一 Evidence Unit。
- 典故：孫策／呂範的對弈傳文與《忘憂清樂集》後世 19 路棋譜分開；關羽刮骨原始傳記與後世文學棋局分開；原爆棋的再開／終局時間只使用可直接支撐該時間線的日本棋院資料。
- 歷史頁來源需有查核日期；裝飾性或未實質支撐 learner-facing claim 的來源應刪除，不以來源數量作可信度代理。

若後續擴充任一歷史主題，先建立 claim-level source fit；無法直接支撐的細節標 DEBATED／UNKNOWN，而不是靠一般背景來源補齊。


## 2026-09-27｜Historical evidence / delivery contract v3

- learner-facing source list 不保留泛用 portal 當裝飾性來源；若某 claim 已有直接文本／館藏／制度研究入口，來源表應指到該 Evidence Unit。
- 「頁面可由 local browser 正常載入」與「公開 Pages 已供應同一版本」是不同工程主張；前者由 `tests/ui.test.cjs`，後者由 `verify.yml` 的 main-push `served-pages-content` job 輪詢正式 Pages URL 驗證。曾嘗試以獨立 `workflow_run` 監聽動態 Pages workflow，但 deployment #380 後未觸發，已撤回。
- accessibility 自動驗證不可只鎖幾個曾經失敗的 selector；History Explore 的小字／badge 由 browser computed style 做整體掃描，static test 另保留明示 palette contract。
- mobile header 為了降資訊密度可以隱藏次要導覽，但頁面本身必須仍有可達的 Core／Advanced／名型館返回路徑。
- 以上只提高 evidence fit、delivery integrity 與 accessibility engineering；歷史學術外審與真人可用性仍是不同 gate。

## 2026-09-28｜Correction：首頁三階段卡只對應 Core Curriculum

- 「基礎建立／局部與棋局判斷／全局與綜合應用」分別對應 Core 單元 1–5、6–10、11–15；三張卡的操作入口必須回到同一 Core runtime。
- 局部階段入口固定到第 6 單元；全局階段入口固定到第 11 單元。這是導覽 shortcut，不表示前置能力已自動滿足，也不改課程完成或評分資料。
- `advanced.html` 是 Core 後續的獨立 practice-only Experience，不屬於 1–15，也不得再以「單元 6–10」卡片作入口；是否另設首頁獨立入口，與 Core 三階段導覽分開處理。

### 2026-09-29 Short Talk UX v2 設計契約

短講的最小單位不再是「兩步」，而是「一個有意義的 observable state」。多步只在下一步會改變棋子或教學標記時成立；相鄰完全相同畫面屬 regression。資料來源收斂為 `lesson.text → demoSteps[] → takeaway → terms[]`，不再維護 `lesson.demo`／`demoBoard` 平行真值。學習者主流程採「核心概念 → 棋盤變化 → 單一 caption → 進題前一句 → 練習」，圖例與關鍵詞降為輔助層。自動短講與手動重看只在顯示／焦點語義上區分，不新增 learner mastery 或觀看進度。這個 contract 的成功條件是減少無資訊增量步驟與重複表達；是否真正降低認知負荷仍由 final candidate 真人 usability 驗證。
### 2026-09-29 Short Talk UX v2 post-audit hardening

- Responsive contract 必須以「短講 Modal 開啟」為實際改動面驗證；不能只以整頁 320px 無 overflow 代替。mobile override 放在 base short-talk rule 之後，避免相同 specificity 的 cascade 回歸。
- `seenLessonIntros` 只表示 auto-display suppression，不是觀看完成、理解或 learner evidence。content catalog 升版不自動清除此狀態；新版短講始終可手動重看。
- focus authority 收斂到 dismiss action：manual Close／Esc 回短講入口，manual Start／auto skip／auto Esc 進題目；不由 dialog close event 再做第二次焦點決策。
- 題庫 R1a 與 19 課短講 human content review 分離。short-talk learner-facing semantics 由 `go-independent-lesson-content-review-v1` fingerprint 綁定；它只支持內容正確性，不支持 comprehension／usability／learning effect。
- final learner-facing candidate 為 `learner-flow-v55`／`formal-teaching-candidate-2026-09-29-x`；若後續再改 critical surface，須 refreeze 後再收正式真人證據。
