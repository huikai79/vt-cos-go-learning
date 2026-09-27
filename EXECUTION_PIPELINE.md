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

進階訓練可在開發期與 formative observation 中迭代，但不改變正式 gate 順序。v5 將倒撲／枷／對殺／征子各做成兩個 multi-step practice variant；每題必須有唯一 `familyId/variantId` 與明示 `variationAxes`，第二題至少改一個非單純旋轉的作答條件。棋盤 sequence 必須先由 rules engine 驗證合法性與提子，再由 `advanced-sequence-contract.js` 重播 canonical line；若題型存在明顯主要分支，至少加入 branch QA。這些 family 只用於 practice 與後續診斷。learner-facing 棋盤題在完成前不得顯示 family ID、完整題名、術語或「這是前題變形」等關係 cue；同 family variant 需在 seed 完成後才開放。`advanced-sequence-events-v2` 會把當時的 family／variant／variation axes 與首答一起保存，v1 歷史事件不補寫新語義；只有 seed `presented` 早於 variant 且兩邊都有實際首答時，family transition 才可輸出 `DESCRIPTIVE_ONLY`，否則保持 `INSUFFICIENT_DATA`；任何情況都不產生 mastery 或 transfer claim。不得在缺少真人 first-response／難度資料時升格為 KC、transfer 證據或平行題等難。任何進階項目若要進 scheduler、T2/T3 或 formal evaluation，仍須回到 evidence-integrity 與內容效度 gate。

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
\n## 2026-09-27 Decision note｜Geometry extraction gate v1\n\n- **Bottleneck：** geometry fingerprint 只能保證 normalization 正確；若 diagram／SGF 的座標轉錄本身錯誤或來源權利不清，仍會把壞 evidence 穩定地 fingerprint。\n- **實作：** 新增 `classic-geometry-extraction.js`，版本化 extraction method、rights status、review status、payload signature、independent review 與 public promotion gate。\n- **人工轉錄：** 單份不能升格；兩個不同 reviewKey 的轉錄必須 canonical payload 完全相同。不同即 `CONFLICT`，不採多數決。
- **來源不可變性：** promotion batch 必須共用同一 `sourceDigest`；來源版本不同不得互相充當覆核。`verified_reusable` 必須帶 `rightsEvidence`，避免只改狀態字串繞過 gate。\n- **Deterministic source：** SGF parse／source-native coordinates 可免第二份人工轉錄，但只在 `verified_reusable` 權利與 deterministic source flag 同時成立時。\n- **Public boundary：** `unknown`／`reference_only` 來源衍生 geometry 不得進公開 registry；可作 non-shipping reference/oracle。現有 BadukWorld geometry source 暫標 `unknown`。\n- **Context gate：** corner 需要兩個 board boundaries；side 需要至少一個 boundary。缺失即 INVALID，不能拿 shape-only match 冒充完整局面等價。\n- **反證：** single manual、same reviewKey、independent conflict、unknown rights、corner missing boundary 全部必須 fail closed。\n- **下一步：** 研究可合法重用的 L Group／Carpenter／Comb geometry source；若只有 reference-only source，建立 external oracle workflow 而非把其座標複製入 repo。
- **Validation：** PR #34 verify run #469 全數 PASS，包含 Node、Sabaki、Windows file-URL UI、Edge smoke 與 repository boundary。\n
## 2026-09-27 Decision note｜Reference-only geometry oracle v1

- **Bottleneck：** extraction gate 對 rights=unknown/reference-only 正確阻止 shipping，但若完全不能利用這些來源，geometry-first research 會失去大量候選／反證材料。
- **實作：** `classic-geometry-reference-oracle.js` 只在記憶中使用 observation geometry，比對後輸出 sanitized report。
- **持久化邊界：** report 禁止 points、stones、shape/context signature、fingerprint、raw observation；`authority=reference_oracle_only`、`canonicalPromotionAllowed=false`。
- **證據獨立性：** aggregation 以 `evidenceChain` 去重，不以 URL／sourceDigest 數量灌票。
- **一致結果：** 兩條以上獨立 decisive oracle 同方向可標 `CONSISTENT_REFERENCE_SUPPORT`，只作 research prioritization，不升格 canonical geometry。
- **衝突結果：** MATCH／DIFFERENT 跨獨立 chain 衝突時回 `CONFLICTING_REFERENCE_ORACLES`，不得選邊。
- **下一步：** 用此 workflow 研究 L Group／Carpenter／Comb／Notcher 候選來源；只有取得可重用權利或 project-generated independent geometry 後才進 public geometry registry。
