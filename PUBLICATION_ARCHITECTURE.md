# 公開發布架構

決策日期：2026-09-21  
發布決策：接受題庫、答案與審題工具隨原始碼公開。

## 品牌架構

公開名稱為 `VT-COS｜一手一懂`：VT-COS 是母品牌，「一手一懂」是產品名稱。介面沿用既有黑白棋子圖示、墨綠與暖金配色；目前沒有另行宣稱正式 logo、註冊商標或品牌專屬色票。可公開使用的名稱、說法與限制以 `BRAND.md` 為準。

## 發布單位

`Go_Learning_Prototype` 是獨立 repository `huikai79/vt-cos-go-learning` 的根目錄。父層 `VT-Workflow`、`gtp_logs/`、個人匯出、局部復盤與 R1 回條不屬於公開產品。公開檔案的唯一機器可讀清單是 `release-manifest.json`；人工操作清單是 `RELEASE_CHECKLIST.md`。

網站採無建置步驟的靜態發布：GitHub Pages 從 `main` 分支的 repository root 提供 `index.html`，`.nojekyll` 關閉 Jekyll 處理。所有 runtime 路徑維持相對路徑，因此可同時支援直接開檔、網域根目錄與 `/repository-name/` 子路徑。專案不加入自訂 GitHub Actions workflow，減少不必要的 token、secret 與第三方 Action 攻擊面。

GitHub 帳號的 user site 已設定 `huikai.com.kg`，所以 GitHub 會把相同自訂網域套用到本 project site。正式入口是 `https://huikai.com.kg/vt-cos-go-learning/`；預設入口 `https://huikai79.github.io/vt-cos-go-learning/` 會以 301 轉向正式入口。2026-09-21 已確認前者 HTTPS 200、後者轉址成功，且由預設入口啟動的完整 Edge UI suite 通過。repository Pages API 的 `https_enforced` 旗標仍為 `false`，手動開啟時回覆 `The certificate does not exist yet`；目前實際 HTTP 入口已轉向 HTTPS，但不能把 API 旗標記成已啟用。

## 題庫邊界

- `phase2-foundation-bank.js`：100 題基礎技巧來源資料，涵蓋提子、直接連接與救棋。
- `phase2-life-death-bank.js`：48 題基礎死活來源資料，涵蓋直三與第二眼缺口。
- `phase2-content.js`：相容組裝層，保留原有 148 題順序、ID、答案、內容指紋與 `pool` 契約。

`pool: "holdout"` 只保留為排程、延後回饋及既有資料相容欄位。由於原始碼公開，這 48 題是「公開保留組」，每題都固定 `exposureStatus="public_source"`、`exposedAt="2026-09-21"`、`formalHoldoutEligible=false`；整體政策固定 `formalHoldoutPoolStatus="retired_due_to_publication"`。若未來需要正式盲測，必須另建不進公開 repository、從未公開的新題庫與角色分離評測流程，不能把 UI 隱藏或匯出遮蔽當成保密措施。

## GitHub 邊界

發布前執行 `tests/repository-boundary.ps1`。它要求 Git root 等於專案根目錄，拒絕 `.gitmodules`、gitlink、tracked symlink 與 Windows reparse point，並在 workflow 存在時拒絕 `pull_request_target`、`write-all` 與未鎖定 40 位 commit 的第三方 Action。現版沒有 repository workflow、Dependabot 設定、submodule、symlink、junction 或建置步驟。

## 信任與資料流

公開 repository 只提供教材、題庫、前端程式、測試、文件及審核截圖。學習進度留在瀏覽器 `localStorage`；匯出由使用者下載到本機；沒有帳號、後端、遙測或外部 runtime 請求。

```text
公開題庫模組 ─┐
               ├─ phase2-content.js ─ app.js／r1-review.js
公開死活模組 ─┘                         │
                                        └─ localStorage／本機匯出
```

## 發布閘門

1. `release-manifest.json` 的公開檔案必須全部存在，且不得包含排除項目。
2. 題庫總數、ID 順序與 R1 內容指紋必須維持既有契約，除非另行升版。
3. Node、直接開檔 UI、HTTP 根路徑與 HTTP 子路徑測試必須通過。
4. 必須從獨立 repository 的 fresh clone 再驗證一次。
5. README 不得把公開保留組描述成受控盲測，也不得宣稱已證明教學成效。
6. Pages 啟用後，必須在正式 HTTPS URL 重跑完整瀏覽器流程。

本專案採 [MIT License](LICENSE)，第三方可依其條款重用程式碼與文件；品牌名稱與呈現方式仍以 `BRAND.md` 為準。
