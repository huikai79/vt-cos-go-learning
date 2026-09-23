# 公開發布架構

決策日期：2026-09-21  
發布決策：接受題庫、答案與審題工具隨原始碼公開。

## 品牌架構

公開中文名稱為 `VT-COS｜悟之一手`，公開英文名稱為 `VT-COS｜A Move of Insight`：VT-COS 是母品牌，「悟之一手」／`A Move of Insight` 是同一產品的中英文名稱。介面沿用既有黑白棋子圖示、墨綠與暖金配色；目前沒有另行宣稱正式 logo、註冊商標或品牌專屬色票。網址與 repository 名稱保持不變；可公開使用的名稱、說法與限制以 `BRAND.md` 為準。

## 發布單位

`Go_Learning_Prototype` 是獨立 repository `huikai79/vt-cos-go-learning` 的根目錄。父層 `VT-Workflow`、`gtp_logs/`、個人匯出、局部復盤與 R1 回條不屬於公開產品。公開檔案的唯一機器可讀清單是 `release-manifest.json`；人工操作清單是 `RELEASE_CHECKLIST.md`。

網站採無建置步驟的靜態發布：GitHub Pages 從 `main` 分支的 repository root 提供 `index.html`、`live-game.html` 與 reviewer-only `r1-review.html`，`.nojekyll` 關閉 Jekyll 處理。所有 runtime 路徑維持相對路徑，因此可同時支援直接開檔、網域根目錄與 `/repository-name/` 子路徑。專案不加入自訂 GitHub Actions workflow，減少不必要的 token、secret 與第三方 Action 攻擊面。

GitHub 帳號的 user site 已設定 `CNAME=huikai.com.kg` 與 `https_enforced=true`，所以 GitHub 會把相同自訂網域與 HTTPS 行為套用到本 project site。正式入口是 `https://huikai.com.kg/vt-cos-go-learning/`；預設入口 `https://huikai79.github.io/vt-cos-go-learning/` 會以 301 轉向正式入口。2026-09-21 已確認前者 HTTPS 200、兩個 HTTP 入口轉向 HTTPS，且由預設入口啟動的完整 Edge UI suite 通過。project repository 本身沒有 CNAME，其 Pages API 的 `https_enforced` 因而仍為 `false`；手動在 project 層開啟時會回覆 `The certificate does not exist yet`。HTTPS 的實際控制層在帳號 user site，不得把 project 層旗標誤記成已啟用。

## 題庫邊界

- `phase2-foundation-bank.js`：100 題基礎技巧來源資料，涵蓋提子、直接連接與救棋。
- `phase2-life-death-bank.js`：48 題基礎死活來源資料，涵蓋直三與第二眼缺口。
- `phase2-content.js`：相容組裝層，保留原有 148 題順序、ID、答案、內容指紋與 `pool` 契約。

`pool: "holdout"` 只保留為排程、延後回饋及既有資料相容欄位。由於原始碼公開，這 48 題是「公開保留組」，每題都固定 `exposureStatus="public_source"`、`exposedAt="2026-09-21"`、`formalHoldoutEligible=false`；整體政策固定 `formalHoldoutPoolStatus="retired_due_to_publication"`。若未來需要正式盲測，必須另建不進公開 repository、從未公開的新題庫與角色分離評測流程，不能把 UI 隱藏或匯出遮蔽當成保密措施。

## GitHub 邊界

發布前執行 `tests/repository-boundary.ps1`。它要求 Git root 等於專案根目錄，拒絕 `.gitmodules`、gitlink、tracked symlink 與 Windows reparse point，並在 workflow 存在時拒絕 `pull_request_target`、`write-all` 與未鎖定 40 位 commit 的第三方 Action。現版有一條唯讀驗證 workflow（`.github/workflows/verify.yml`），用於 Node contracts、SGF oracle、Windows file-URL UI、Edge smoke 與 repository boundary；沒有 Dependabot 設定、submodule、symlink、junction 或建置步驟。

## 信任與資料流

公開 repository 只提供教材、題庫、前端程式、測試、文件及審核截圖。學習進度、棋局續局、raw practice events 與 bounded live evidence 都留在瀏覽器 `localStorage`，使用分開的 key；匯出由使用者下載到本機；沒有帳號、內建後端或遙測。一般內建練習電腦不發網路請求；只有使用者主動選擇本機 KataGo／Remote API provider 時才會發出 provider request。GitHub Pages 本身不能執行 `katago.exe` 或 Node bridge：本機 KataGo 需要每台使用裝置自行啟動 localhost bridge；若要讓網站訪客共用 KataGo，必須另部署 HTTPS KataGo API。現行公開部署尚未提供共用託管 KataGo endpoint。`practice-events.js` 的 raw audit event 永遠維持 practice-only；`live-evidence.js` 另依版本化 eligibility/scoring contract 保存少數 9×9 局部 live T3，且 `formalEligible=false`，不進正式評量分母。

```text
公開題庫模組 ─┐
               ├─ phase2-content.js ─ app.js／r1-review.js
公開死活模組 ─┘                         │
                                        ├─ 課程／scheduler localStorage
                                        ├─ raw practice event localStorage
                                        ├─ bounded live evidence localStorage
                                        └─ 本機匯出
```

## 發布閘門

1. `release-manifest.json` 的公開檔案必須全部存在，且不得包含排除項目。
2. 題庫總數、ID 順序與 R1 內容指紋必須維持既有契約，除非另行升版。
3. Node、直接開檔 UI、HTTP 根路徑與 HTTP 子路徑測試必須通過。
4. 必須從獨立 repository 的 fresh clone 再驗證一次。
5. README 不得把公開保留組描述成受控盲測，也不得宣稱已證明教學成效。
6. Pages 啟用後，必須在正式 HTTPS URL 重跑完整瀏覽器流程。

本專案採 [MIT License](LICENSE)，第三方可依其條款重用程式碼與文件；品牌名稱與呈現方式仍以 `BRAND.md` 為準。


## 2026-09-23 Change note｜Pages 與 KataGo provider 邊界

- **問題：** provider contract 已支援 localhost KataGo 與 Remote API，但 GitHub Pages 是靜態託管；把「本機 KataGo」呈現在公開網站上，不能推導成所有訪客都能直接使用 KataGo。
- **修正：** learner UI 明示 GitHub Pages 不能執行 KataGo、本機模式需要每台裝置自行啟動 bridge；Remote 模式明示目前沒有共用託管 KataGo 服務，並以 HTTPS hosted endpoint 作輸入提示。
- **不變 invariant：** 內建 heuristic 仍是零安裝預設；provider 只提候選，play 仍經 rules engine；任何 provider failure 保持 ERROR、不 fallback；不在前端保存 API key。
- **部署邊界：** 本次沒有建立雲端 KataGo service，因此不能宣稱「所有 Pages 訪客已有 KataGo」。要達成該能力，仍需另部署、驗證及維運 HTTPS KataGo API。
- **Rollback：** 回復 UI copy／placeholder 即可；不涉及 storage、event、KC、scheduler、scoring 或 formal evaluation migration。
