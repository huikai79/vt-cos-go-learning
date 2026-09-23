# 正式教學閘門

## 一句話判定

目前公開原始碼與網站部署已通過，但正式教學使用維持 `BLOCKED`：仍缺 R1a 外部棋理回條、至少三位目標初學者的關鍵任務觀察，以及真人鍵盤／螢幕閱讀器 spot check。正式評量另缺未公開的新 holdout 與 R1b 實際難度可比性；學習成效維持 `NOT_MEASURED`。

## 三層判定

| 層級 | 最低必要證據 | 現況 |
|---|---|---|
| 正式教學使用 | 工程發布通過、R1a 外部內容審查通過、至少三位目標初學者完成五項關鍵任務、真人無障礙 spot check、沒有未解 blocking issue | BLOCKED |
| 正式評量 | 正式教學使用通過、另建未公開的新 holdout、R1b 實際難度可比性成立 | BLOCKED |
| 學習成效 | 預先定義的 retention／transfer 研究與足夠資料 | NOT MEASURED；不屬 release verdict |

三位初學者是正式教學發布前的最低 usability smoke gate，不是統計樣本，也不能證明教學有效。任一參與者無法完成開始課程、棋盤作答、錯答後修正、重新載入續學或匯出資料，均須先記錄並處理阻擋問題。

## R1a 外部棋理審查

1. 審查者必須未參與編題、不是目前學習者，並在判斷前未查看既定答案、題庫原始碼或機器稽核結果。
2. 使用 [R1 審查頁](https://huikai.com.kg/vt-cos-go-learning/r1-review.html)。該頁只載入 `r1-review-bank.js` 的去答案資料；repository 本身仍公開，因此獨立性最終依審查者三項分開聲明與流程紀律成立。
3. 完成 77 題後匯出 `R1_獨立審題回條.json`，在專案根目錄執行 `node r1-review-verify.cjs R1_獨立審題回條.json`。
4. 回條只要有需修、歧義、多解或建議落子不同，就不能通過。先修內容、升版並重新審查，不得把異議平均掉。

## 真人證據與 gate 命令

複製 `formal-teaching-evidence.example.json` 為被 `.gitignore` 排除的 `formal-teaching-evidence.json`，只保存匿名彙整與證據引用，不提交參與者個資。

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
