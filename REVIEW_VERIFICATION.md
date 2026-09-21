# GitHub 上傳前驗證履歷

## 2026-09-21 題庫公開決策與發布架構

- 擁有者選擇接受題庫與答案公開；相容用 `holdout` 欄位不再具受控盲測資格。
- Phase 2 來源拆成 100 題基礎技巧與 48 題基礎死活，組裝後仍為 148 題。
- 題目 ID 順序 SHA-256 維持 `4de9567ad6c481b0c8fc721e9f5d2cc03388243ab88a2cd661b0fc70212930ad`。
- R1 內容指紋維持 `fnv1a32-1afc0a13`，既有審題回條契約未因拆檔失效。
- 新增 `release-manifest.json` 與發布契約測試；GitHub Pages 採 repository root 靜態發布，無建置步驟。
- 加入 `VT-COS｜一手一懂` 母品牌／產品品牌契約、MIT License 與 Markdown whitespace 屬性後，manifest 共 56 個公開檔案；乾淨暫存副本已通過 81 項 Node 測試與 file URL UI suite，驗證後安全清除。

驗證日期：2026-09-21

## 基準與環境

- 父 Git root：`E:\00 Vibe Coding project\VT-Workflow`
- 分支／HEAD：`master`／`a2147ea01b43e4376d30e36cb3eb600175035df8`
- 子專案狀態：全部未追蹤，沒有自身 Git 歷史。
- runtime：Windows 10.0.19045、Node 24.14.1、Edge 153.0.4234.48、Python 3.14.4。
- 測試使用隔離的瀏覽器暫存 profile；沒有讀寫真實瀏覽器 profile。

## 驗證結果

| 驗證 | 結果 | 覆蓋 |
|---|---|---|
| 所有非瀏覽器 `.cjs` | 81 pass、0 fail、0 skip | 狀態 19、完成矩陣 4、棋規 11、指標 5、課程 5、Phase 2 7、R1 4、發布契約 6、排程 4、SGF 8、trial 8 |
| `node tests/ui.test.cjs`（file URL） | PASS | 主流程、選課、鍵盤、localStorage、匯出、320px、200%、R1 |
| `tests/ui-smoke.ps1` | PASS | Edge 動態載入、作答、重新載入、事件匯出 |
| loopback 網域根目錄 | PASS | `http://127.0.0.1:8765/` 的完整 UI suite |
| loopback 子路徑 | PASS | `/Go_Learning_Prototype/` 的完整 UI suite；所有 runtime 資產 200／304 |
| JavaScript 語法 | PASS | 全部 `.js`／`.cjs` 通過 `node --check` |
| 外部 runtime 請求搜尋 | PASS | 非文件程式只有 UI smoke 連本機 DevTools；無 CDN、API、遙測 |
| 敏感檔案盤點 | PASS with exclusion | `gtp_logs/` 確認含本機資訊並由 `.gitignore` 排除；截圖無可見個資 |
| 乾淨 manifest 副本 | PASS | 精確複製 56 個公開檔案；81 項 Node 測試與 file URL UI suite 通過 |
| Codex Security Deep Scan | BLOCKED | worker permission-profile 驗證前 Codex executable code 1；未產生 finding 或 manifest |

## 失敗後修復紀錄

1. SGF 新增測試先出現 3 個預期失敗：多盤／分支未拒絕、pass 編號錯、資源無上限；修補後 8／8 通過。
2. storage 新增測試先因 `completed.filter` TypeError 失敗；型別正規化與復原副本後 19／19 通過。
3. storage 寫入拒絕測試先顯示「已在作答前保存」；修補後顯示未保存並保留錯誤提示。
4. PowerShell UI smoke 依序暴露 pipeline 污染、舊導覽斷言、JavaScript 引號、固定等待與集合計數問題；逐項修正後通過。

## 未測與限制

- 未做真人螢幕閱讀器、真人首次任務、觸控誤觸與理解度測試。
- 未測 Firefox、Safari、Android、iOS 或實際 GitHub Pages response headers。
- 沒有外部依賴資料庫，因此沒有 CVE 套件掃描；Codex Security Deep Scan 另因工具啟動錯誤未執行。
- 安全掃描 token 測量不可用；不得填 0 或估算。
- 乾淨副本是本機複製驗證，尚不是從 GitHub fresh clone，因為 repository 尚未建立。
