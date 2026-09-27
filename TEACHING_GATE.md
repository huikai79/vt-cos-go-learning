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
- `formal-teaching-evidence.example.json` 已改綁 current candidate `formal-teaching-candidate-2026-09-27-b` / `fnv1a32-js16-e9637bc0`，避免未來真人證據從模板開始就失效。
- 此 change 只代表 **READY_FOR_EXTERNAL_REVIEW**；目前仍沒有真人 R1a receipt，因此 `r1aExternalContentReview` 仍是 `awaiting_external_receipt`，正式教學仍 `BLOCKED`。
