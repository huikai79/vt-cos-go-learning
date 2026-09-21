# 公開發布架構

決策日期：2026-09-21  
發布決策：接受題庫、答案與審題工具隨原始碼公開。

## 品牌架構

公開名稱為 `VT-COS｜一手一懂`：VT-COS 是母品牌，「一手一懂」是產品名稱。介面沿用既有黑白棋子圖示、墨綠與暖金配色；目前沒有另行宣稱正式 logo、註冊商標或品牌專屬色票。可公開使用的名稱、說法與限制以 `BRAND.md` 為準。

## 發布單位

`Go_Learning_Prototype` 是唯一公開 repository 根目錄。父層 `VT-Workflow`、`gtp_logs/`、個人匯出、局部復盤與 R1 回條不屬於公開產品。公開檔案的唯一機器可讀清單是 `release-manifest.json`；人工操作清單是 `RELEASE_CHECKLIST.md`。

網站採無建置步驟的靜態發布：GitHub Pages 從 repository 根目錄提供 `index.html`，所有 runtime 路徑維持相對路徑，因此可同時支援直接開檔、網域根目錄與 `/repository-name/` 子路徑。

## 題庫邊界

- `phase2-foundation-bank.js`：100 題基礎技巧來源資料，涵蓋提子、直接連接與救棋。
- `phase2-life-death-bank.js`：48 題基礎死活來源資料，涵蓋直三與第二眼缺口。
- `phase2-content.js`：相容組裝層，保留原有 148 題順序、ID、答案、內容指紋與 `pool` 契約。

`pool: "holdout"` 只保留為排程、延後回饋及既有資料相容欄位。由於原始碼公開，這 48 題是「公開保留組」，不得用來證明受控盲測或保密未見。`publicationPolicy.blindAssessmentEligible` 固定為 `false`。若未來需要正式盲測，必須另建不進公開 repository 的私人題庫與獨立評測服務，不能把 UI 隱藏或匯出遮蔽當成保密措施。

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

本專案採 [MIT License](LICENSE)，第三方可依其條款重用程式碼與文件；品牌名稱與呈現方式仍以 `BRAND.md` 為準。
