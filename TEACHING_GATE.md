# 正式教學閘門

## 一句話判定

目前公開原始碼與網站部署已通過，但正式教學使用維持 `BLOCKED`：仍缺 R1a 外部棋理回條、至少三位目標初學者的關鍵任務觀察，以及真人鍵盤／螢幕閱讀器 spot check。正式評量另缺未公開的新 holdout 與 R1b 實際難度可比性；學習成效維持 `NOT_MEASURED`。

## 三層判定

| 層級 | 最低必要證據 | 現況 |
|---|---|---|
| 正式教學使用 | 工程發布通過、R1a 外部內容審查通過、至少三位目標初學者完成五項關鍵任務、真人無障礙 spot check、沒有未解 blocking issue | BLOCKED |
| 正式評量 | 正式教學使用通過、另建未公開的新 holdout、R1b 實際難度可比性成立 | BLOCKED |
| 學習成效 | 預先定義的 retention／transfer 研究與足夠資料 | NOT MEASURED；不屬 release verdict |

三位初學者是正式教學發布前的最低 usability smoke gate，不是統計樣本，也不能證明教學有效。這三位正式證據應在 learner-facing 核心流程相對收斂、candidate 的 UI／content version 與 critical tasks 已凍結後收集；目前凍結 candidate 由 `formal-teaching-candidate.json` 定義，verifier 每次會重新計算 critical learner surface fingerprint。開發期間邊使用邊修改的 formative observation 只作產品診斷，不補入正式三位分母。任一參與者無法完成開始課程、棋盤作答、錯答後修正、重新載入續學或匯出資料，均須先記錄並處理阻擋問題；若因此修改會影響 critical task 的 learner-facing 行為，受影響的正式觀察須在新 candidate 重做。

## R1a 外部棋理審查

1. 審查者必須未參與編題、不是目前學習者，並在判斷前未查看既定答案、題庫原始碼或機器稽核結果。
2. 先把外部審查者送到 [R1a 審查交接頁](https://huikai.com.kg/vt-cos-go-learning/r1-review-start.html)，由該頁確認 current protocol／fingerprint、獨立性條件與停止線，再進入 77 題審查頁。審查者在完成判斷前不得瀏覽 repository、題庫原始碼、答案或機器稽核結果。審查頁只載入 `r1-review-bank.js` 的去答案資料；repository 本身仍公開，因此 answer-blind 最終仍依審查者聲明與流程紀律成立。
3. 完成 77 題後匯出 `R1_獨立審題回條.json`，在專案根目錄執行 `node r1-review-verify.cjs R1_獨立審題回條.json`。
4. 回條只要有需修、歧義、多解或建議落子不同，就不能通過。先修內容、升版並重新審查，不得把異議平均掉。

## 真人證據與 gate 命令

複製 `formal-teaching-evidence.example.json` 為被 `.gitignore` 排除的 `formal-teaching-evidence.json`，只保存匿名彙整與證據引用，不提交參與者個資。v2 證據必須在總表、每位 participant 與 accessibility spot check 都保存同一 `candidateId`／`candidateFingerprint`；不同 candidate 的觀察不得合併。

- 檢視目前狀態：`node teaching-gate-verify.cjs --report-only`
- 驗證正式教學閘門：`node teaching-gate-verify.cjs --r1 R1_獨立審題回條.json --human formal-teaching-evidence.json`

第二個命令只有正式教學使用達到 `PASS` 才回傳成功退出碼。R1a 即使通過，也不會自動使 R1b、正式評量或學習成效升格。

## 2026-09-23 Change note｜真人 usability 證據改為逐位保存

- **問題：** 舊 formal-teaching-evidence-v1 只保存 participantCount 與五項任務的彙總布林值；理論上可能由不同參與者各完成不同任務，卻被彙總成「三位都完成五項」，造成 denominator／completion 語義無法稽核。
- **修正：** 保留既有彙總欄位以便閱讀，但正式 gate 現在額外要求至少三筆唯一匿名 participantCode；每位都必須是 target novice、逐項完成五個 critical tasks、沒有 blocking issue，且有非空 evidence reference。participantCount 必須與逐位紀錄數一致。
- **反證：** 任一參與者漏做一項、逐位紀錄少於宣稱人數、或 participant code 重複，都必須 BLOCKED；不得由 aggregate true 掩蓋。
- **隱私：** 只使用匿名 code 與證據引用，不在 repo 保存姓名、聯絡資料或其他個資。
- **證據邊界：** 此修改只提高真人證據的可稽核性，不產生任何真人證據；目前 usability／accessibility 狀態仍是 NOT_TESTED／BLOCKED。
- **Migration／rollback：** 尚無正式真人證據檔，因此沒有歷史真人資料需要升格；舊格式檔會 fail closed，需依原始觀察補成逐位紀錄，不能猜測補值。若 rollback，恢復舊 verifier，但會重新暴露彙總證據缺口。


## 2026-09-26 Clarification｜formative observation 不等於正式三位 usability evidence

開發期間可以持續由產品作者／目前使用者與零散使用者回饋發現卡點並修改，不要求先完成三次觀察。這些資料標記為 formative／development observation；正式教學 gate 仍要求 candidate 凍結後至少三位唯一 target novice 的逐位證據與真人 accessibility spot check。此澄清不改 verifier schema、不降低既有 gate，也不把歷史零散觀察回溯升格。


## 2026-09-27 Change note｜formal usability candidate fingerprint v1

- **問題：** 舊 gate 雖要求 learner-facing candidate 凍結，但 verifier 只把真人證據綁到 R1 內容指紋；理論上三位初學者可在不同 UI／runtime 版本完成，卻被彙總成同一份正式 usability PASS。
- **修正：** 新增 `formal-teaching-candidate.json` 與 `formal-teaching-candidate.cjs`。candidate manifest 固定 critical asset 清單與 `candidateId`／`assetFingerprint`；gate v2 每次從工作樹動態重算 fingerprint，與 manifest／gate／human evidence 四方比對。
- **證據 v2：** `go-formal-teaching-evidence-v2` 要求 evidence root、usability summary、每位 participant、accessibility spot check 都綁同一 candidate ID/fingerprint。
- **反證：** 舊 v1 evidence、任一 participant fingerprint 不同、accessibility candidate 不同、manifest 與 critical surface 指紋失配，全部 fail closed。
- **Migration：** 尚無正式真人證據，因此不做歷史推測 migration；舊 v1 evidence 必須重新依原始觀察確認是否確實在同一 frozen candidate 上完成，不能只改版本字串。
- **證據邊界：** 本修改只提高正式 usability evidence integrity；不產生 R1a、真人 usability、accessibility、formal evaluation 或 learning-effect 證據。目前狀態仍為 BLOCKED／NOT_TESTED。


## 2026-09-27 Change note｜R1 receipt 綁定 reviewer-visible content v5

R1a verifier 升至 `go-r1-independent-content-review-v5`，目前內容 fingerprint 為 `fnv1a32-c34ef6a4`。v5 fingerprint 不只涵蓋答案／goal／棋盤，也涵蓋審查者實際看到的 `prompt`、`focus` 與 family／skill identity。若任何 reviewer-visible semantics 改變，舊 receipt 不得沿用。由於目前尚無正式外部 R1a 回條，沒有可遷移的正式證據；v4 草稿／回條不能只改 protocol 或 fingerprint 字串來升級，必須以 v5 bank 重新完成審查。這不降低三位初學者 usability、accessibility 或正式評量 gate。


## 2026-09-27 Change note｜R1a reviewer handoff ready

- 新增 `r1-review-start.html` 作為外部 reviewer 的唯一建議起點；頁面明示 v5 protocol、`fnv1a32-c34ef6a4`、77 題母體、answer-blind 條件與異議停止線。
- handoff 不載入題庫答案／scoring modules，只連到去答案的 `r1-review.html`；CI 會檢查 handoff protocol/fingerprint 必須與 verifier 同步。
- `formal-teaching-evidence.example.json` 會綁定當前 frozen candidate；若 critical learner surface 改變，candidate 必須重新凍結，舊真人證據不得跨 candidate 沿用。
- 此 change 只代表 **READY_FOR_EXTERNAL_REVIEW**；目前仍沒有真人 R1a receipt，因此 `r1aExternalContentReview` 仍是 `awaiting_external_receipt`，正式教學仍 `BLOCKED`。


## 2026-09-28 Change note｜16～20 歲 learner-facing 語言清理後重新凍結 candidate

- **變更：** Core learner-facing 文案完成一輪白話化，`index.html`、`learner-progress.js` 與 `app.js` 因此發生 critical surface 變更；底層 scoring、scheduler、event schema、evidence taxonomy 與正式評量語義未改。
- **新 candidate：** `formal-teaching-candidate-2026-09-28-b`，fingerprint 為 `fnv1a32-js16-5adc703c`。
- **理由：** formal usability candidate fingerprint 會把五項 critical tasks 依賴的 learner-facing surface 一起凍結。即使只是前台語言改善，只要這些 critical assets 改變，就不能沿用舊 candidate 指紋。
- **證據邊界：** 目前仍沒有正式三位 target novice usability evidence 或真人 accessibility spot check，因此沒有既有正式真人證據可遷移；正式教學狀態仍為 `BLOCKED`，正式評量仍為 `BLOCKED`，學習成效仍為 `NOT_MEASURED`。


## 2026-09-28 Change note｜首頁棋盤視覺整合後重新凍結 candidate

- **變更：** 首頁 Hero 新增精確的 9 路「氣與提子」SVG 示意；核心課程三階段加入一致的小棋盤縮圖；「怎樣才算真的學會」加入首次作答、延後再做、新棋形、仍能自行判斷四格視覺。所有棋形直接由 HTML/SVG 定義，不把生成式圖片當棋盤真值。
- **新 candidate：** `formal-teaching-candidate-2026-09-28-c`，fingerprint 為 `fnv1a32-js16-714c8365`；UI version 為 `learner-flow-v47`。
- **理由：** `index.html`、`styles.css` 與 `app.js` 都屬 formal usability critical learner surface；即使底層 scoring 與事件語義不變，視覺與閱讀順序改動後仍必須重新凍結。
- **不變範圍：** 題目、答案、KC、scoring、scheduler、first response／retry、event schema、evidence taxonomy、formal evaluation 與 learner state 語義未改。
- **證據邊界：** 這次只能支持 learner-facing 視覺已更新並可由回歸測試檢查；目前仍沒有正式三位 target novice usability evidence 或真人 accessibility spot check，因此正式教學維持 `BLOCKED`、正式評量維持 `BLOCKED`、學習成效維持 `NOT_MEASURED`。


## 2026-09-28 Correction note｜v48 恢復首頁既有資訊架構後重新凍結

- **變更：** 撤回 v47 超出授權的 learner-facing 結構改動；恢復原本 Hero 四步、三個課程階段與三項學習證據，只保留四個獨立棋盤插畫資產。
- **新 candidate：** `formal-teaching-candidate-2026-09-28-d`，fingerprint 為 `fnv1a32-js16-b35e6d23`，asset set version = 2，UI version = `learner-flow-v48`。
- **asset-set 修正：** 首頁四個外部 SVG 現納入 `formal-teaching-candidate.cjs` 的 critical asset 清單；之後若圖片本身改變，也會使 fingerprint 失配並 fail closed。
- **不變範圍：** scoring、scheduler、event schema、evidence taxonomy、題目答案、learner state 與 formal evaluation 語義未改。
- **證據邊界：** 尚無正式三位 target novice usability evidence 或真人 accessibility spot check；正式教學維持 `BLOCKED`、正式評量維持 `BLOCKED`、學習成效維持 `NOT_MEASURED`。


## 2026-09-28 Correction note｜v49 原生成配圖資產納入 frozen candidate

- **新 candidate：** `formal-teaching-candidate-2026-09-28-e`，fingerprint `fnv1a32-js16-cef89aa8`，asset set version = 3，UI version = `learner-flow-v49`。
- **資產變更：** 移除 v48 自製的四個簡化 SVG，改用前面已確認風格的 Hero、三階段與三項 assessment 共 7 個 WebP。binary asset fingerprint 改以 Git blob content hash 納入 FNV material，避免二進位圖檔被 UTF-8 解碼破壞指紋語義。
- **Authority boundary：** 生成圖只作視覺／概念提示；不作 rules engine、scoring contract、答案或 formal evaluation 真值。Hero 中未經規則驗證的手寫「提子」句已從正式資產裁除。
- **證據邊界：** 尚無正式三位 target novice usability evidence 或真人 accessibility spot check；正式教學維持 `BLOCKED`、正式評量維持 `BLOCKED`、學習成效維持 `NOT_MEASURED`。


## 2026-09-28 Change note｜v50 mockup-aligned homepage candidate

- **新 candidate：** `formal-teaching-candidate-2026-09-28-f`，fingerprint `fnv1a32-js16-bbbe09bc`，asset set version = 4，UI version = `learner-flow-v50`。
- **learner-facing change：** 首頁依已確認 mockup 重排資訊層級與入口；新增第 11 單元直接入口與第四張 learning-cycle 圖，因此 critical surface 重新凍結。
- **語義邊界：** 第四格「仍能自己判斷」只是前三項 evidence 的 learner-facing summary；沒有改 evidence taxonomy、qualified opportunity、scoring、scheduler、mastery 或 formal evaluation。
- **現況：** 尚無此 candidate 的三位 target novice usability evidence 或真人 accessibility spot check；正式教學維持 `BLOCKED`，正式評量維持 `BLOCKED`，學習成效維持 `NOT_MEASURED`。


## 2026-09-28 Change note｜full-site learner-facing language sweep

- **變更：** 完成第二輪全站 learner-facing language sweep，清理首頁、進階訓練、名型館、歷史探索、實戰棋盤、可閱讀 Markdown 匯出與 R1 審查介面的中英混寫與工程語言外洩。
- **新 candidate：** `formal-teaching-candidate-2026-09-28-g`，fingerprint 為 `fnv1a32-js16-18e9e191`；此值由 repository 自己的 `formal-teaching-candidate.cjs` 在 CI 中重算取得。
- **邊界：** Core critical surface 的變更限於顯示文字與人可閱讀匯出；題目答案、KC、scheduler、scoring、事件 schema、evidence taxonomy、ontology 與 formal evaluation 語義未改。
- **證據狀態：** 重新凍結 candidate 不會產生真人證據；正式教學仍依 R1a、至少三位 target novice usability 與真人 accessibility spot check 判定，正式評量與學習成效也不因本次語言清理升格。

## 2026-09-28 Change note｜Hero 視覺更新後重新凍結 candidate

- 首頁 Hero 換成無內嵌文字的棋盤編輯式插畫，並同步 `index.html` 的圖片尺寸與中性替代文字；題目、答案、scoring、scheduler、事件 schema、evidence taxonomy 與 formal evaluation 語義未改。
- 新 candidate：`formal-teaching-candidate-2026-09-28-h`；fingerprint：`fnv1a32-js16-1e54e467`。
- 生成圖只作 learner-facing 視覺／概念提示，不取得棋盤真值 authority。
- 目前仍沒有此 candidate 的三位 target novice usability evidence 或真人 accessibility spot check；R1a 外部回條也仍待完成，因此正式教學維持 `BLOCKED`，正式評量維持 `BLOCKED`，學習成效維持 `NOT_MEASURED`。

## 2026-09-28 Change note｜Hero cache-busting 後重新凍結 candidate

- Hero 圖片網址加入 `?v=hero-textfree-v1`，避免瀏覽器沿用舊 Hero 快取；圖片本體與 learner-facing 語意未改。
- 新 candidate：`formal-teaching-candidate-2026-09-28-i`；fingerprint：`fnv1a32-js16-04a05a28`。
- 題目、答案、scoring、scheduler、事件 schema、evidence taxonomy 與 formal evaluation 語義未改。
- 目前仍缺 R1a 外部回條、三位 target novice usability 與真人 accessibility spot check；正式教學維持 `BLOCKED`，正式評量維持 `BLOCKED`，學習成效維持 `NOT_MEASURED`。

## 2026-09-28 Change note｜Hero 改為 PNG 後重新凍結 candidate

- 依使用者明示要求，首頁 Hero 改為 `assets/homepage/hero.png`；formal candidate critical asset set 因路徑與圖片內容改變而升至 v5。
- 新 candidate：`formal-teaching-candidate-2026-09-28-j`；fingerprint：`fnv1a32-js16-59c14d2e`。
- 圖內四步文案與手寫「這步提子，因為已經沒有氣了」只作 learner-facing 插畫文字；本輪未以 rules engine／scoring contract 驗證該圖片棋形，因此不得作正式答案或棋盤真值證據。
- 題目、scoring、scheduler、first response／retry、事件 schema、evidence taxonomy 與 formal evaluation 語義未改；目前仍缺 R1a 外部回條、三位 target novice usability 與真人 accessibility spot check，正式教學維持 `BLOCKED`，正式評量維持 `BLOCKED`，學習成效維持 `NOT_MEASURED`。


## 2026-09-28 Change note｜M2 Learning Workspace / Course Navigation

- `learner-flow-v53` 將目前課程位置、單元瀏覽、今日入口與進階工具分層；桌面保留 sidebar，375px 將課程目錄收合到「課程與單元」。
- 選擇 Unit 只改變瀏覽中的課程目錄，不改目前 lesson、題目或 learner event；只有點選實際 lesson 才切換學習內容。
- 到期複習／錯題只有非零時才出現在 sidebar 的「今天」區塊；不以 0 題製造假的今日任務。
- 此變更不修改 scoring、first-response/retry、scheduler policy、storage/event schema、evidence taxonomy 或 formal evaluation masking。工程測試不等於真人 usability 證據。

## 2026-09-28 Change note｜Core 三階段入口修正後重新凍結 candidate

- **變更：** 首頁「局部與棋局判斷」由獨立 `advanced.html` 改為 Core 第 6 單元；「全局與綜合應用」明示由 Core 第 11 單元開始。三張階段卡因此與單元 1–5／6–10／11–15 標示一致。
- **新 candidate：** `formal-teaching-candidate-2026-09-28-m`；fingerprint：`fnv1a32-js16-0314dd59`；asset set version 維持 5，UI version 維持 `learner-flow-v53`.
- **不變範圍：** Advanced 仍是獨立 practice-only 路線；題目、答案、KC、scoring、scheduler、first response／retry、event schema、evidence taxonomy、learner state 與 formal evaluation 語義未改。
- **證據邊界：** 此修正不產生 R1a、真人 usability、accessibility 或 learning-effect 證據；正式教學仍 `BLOCKED`、正式評量仍 `BLOCKED`、學習成效仍 `NOT_MEASURED`。
