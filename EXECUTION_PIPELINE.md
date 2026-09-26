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
