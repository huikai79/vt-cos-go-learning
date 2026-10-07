# 悟之一手 Award Experience A1

> `NON_NORMATIVE_DESIGN_CANDIDATE` — 本資料夾是審批用設計候選，不是 production learner UI，不改寫學習紀錄、排程、評分、正式評量資格或任何證據。

## 一句話判斷

真正有機會形成作品辨識度的不是更多動畫，而是把「第一次選擇不消失」做成可看見、可理解、可重建的產品原生體驗：選擇 → 後果 → 理由 → 修正。

## 本輪修正與新增洞見

### 修正前提

- **修正前提：** 不再使用跨 Awwwards、Webby Awards、FWA 的單一綜合分數。
  - **修正原因：** 三者評審制度、類別與評選語境不同；沒有同一把可校準量尺。
  - **修正後判斷：** 以作品級意圖、產品原生互動、工藝證據與可及性／效能邊界分開驗收。
- **修正前提：** 問題不是「動畫不足」。
  - **修正原因：** 動畫只會放大既有概念；若體驗核心仍像一般課程工具，增加動態只會增加噪音。
  - **修正後判斷：** 先固定招牌互動與資訊語義，再決定每段動態是否有助於因果理解。
- **修正前提：** 不沿用 v63 候選中的 S1–S5 作為現行狀態模型。
  - **修正原因：** production v70 已把「任務類型、單題狀態、靜態學習循環」拆成三層；混用會造成語義倒退。
  - **修正後判斷：** 本候選只使用現行語義，例如「目前任務：練習／本題：自己判斷」。

### Johari 缺口摘要

- **開放區：** 首答保存、已曝光不可回復為 unseen、Practice／Process Check／Independent Evaluation 分離、規則權威與失敗不可靜默成功，均已有規格與程式證據。
- **盲點區：** 工程穩健曾被過度接近地當成作品級品質；首頁、任務、回饋之間缺少一個能被記住的共同體驗語法。
- **隱藏區：** formal teaching gate 的未完成項目會限制學習效果主張，但不等於視覺或互動設計不能先形成候選；兩種資格不可互相代換。
- **未知區：** 真實新手是否理解這套因果顯示、實機輔助科技是否順暢、真實網路下的 LCP／INP／CLS，以及外部評審反應，皆需外部測試；模型自評不能填補。

## Business Rules Registry

| ID | 規則 | 設計結果／驗收點 |
|---|---|---|
| BR-01 | 第一次作答與最後修正分開保存 | 原選點持續可見；重試不改寫首答 |
| BR-02 | 已呈現／已曝光題目不得恢復成 unseen | 公開或已看過題目只可進 Practice／Process Check，不冒充正式未見評量 |
| BR-03 | 規則判定是棋盤真相；KataGo 只供受限估計；LLM 文案不是棋盤真相 | 回饋文字不得自行創造合法性或唯一答案 |
| BR-04 | 首頁互動預覽是合成示範 | 不寫 learner state、evidence、score、scheduler 或 storage |
| BR-05 | 首答前不洩漏 | 不以色彩、圖像、動線或預選狀態提示答案 |
| BR-06 | 產品招牌體驗為「選擇 → 後果 → 理由 → 修正」 | W1→W2、W3→W4、W6 必須共享同一語法 |
| BR-07 | 顯示回饋時維持空間穩定 | 棋盤不跳位，原選點與題目上下文仍可見 |
| BR-08 | 錯誤、非法落子、提示、結果遮蔽、儲存失敗分開表達 | 不以同一紅色 toast 混合不同事件 |
| BR-09 | 三層狀態語義不可混用 | 任務類型／單題狀態／靜態學習循環分開顯示 |
| BR-10 | 第一層只回答「在哪裡、做什麼、怎麼做、結果與下一步」 | 次要資料與工具不搶主流程 |
| BR-11 | 每個狀態只有一個主要動作 | 次要動作視覺降階且不造成競爭 |
| BR-12 | 課程切換是明確選擇，不靠推測 | 顯示單元與題次；不暗中改變課程 |
| BR-13 | 課程、練習、到期複習、延後再判、局面應用共享同一單題狀態語法 | 學習者不用重學介面 |
| BR-14 | 工具屬第二層，每一畫面最多兩個可見入口 | 避免 dashboard 化與孤立工具卡 |
| BR-15 | 完成不等於精熟 | 完成文案不宣稱 mastery 或 learning effect |
| BR-16 | 首頁與工作區共享品牌，但允許不同密度 | 首頁可敘事，任務區以專注為優先 |
| BR-17 | 動態只服務因果、方向與狀態 | 140–180ms；`prefers-reduced-motion` 即時呈現 |
| BR-18 | 滑鼠、觸控與鍵盤具等價完成路徑 | 焦點可見，控制項有可讀名稱 |
| BR-19 | 320px、375px、200% 縮放可重排 | 不產生頁面橫向捲動，不遮蔽主動作 |
| BR-20 | 效能以真實 LCP／INP／CLS 驗證 | 不用原始檔案大小代替現場指標 |
| BR-21 | 僅當候選升格到 production 才重凍結正式候選 | 本資料夾不更改 formal candidate fingerprint |
| BR-22 | 投稿或發布前 public 與 local 版本必須一致 | 未部署前不得使用 production-ready 或 award-ready 主張 |

## Sitemap

```text
首頁／Learning Entry
├─ 品牌主張
├─ 互動式合成預覽（不寫 learner state）
├─ 三條核心入口：開始課程／繼續任務／到期複習
├─ 學習循環（靜態說明）
├─ 證據與邊界
├─ 課程目錄
└─ FAQ

學習核心／Core
├─ 短講
├─ 目前任務
│  ├─ 任務類型
│  ├─ 單題狀態
│  ├─ 題目與棋盤／選項
│  ├─ 第一手與後果
│  ├─ 修正與下一步
│  └─ 完成（不等於精熟）
├─ 課程導覽
├─ 今日任務
└─ 工具入口

練習／Practice
├─ 自由棋盤
├─ SGF 匯入與複盤
├─ 經典棋形
└─ 進階工具

探索／Explore
├─ 圍棋歷史
├─ 數學與結構
└─ 全球文化

本機紀錄與資料／Local records
├─ 首答與修正紀錄
├─ 匯出／清除說明
└─ 儲存狀態與失敗處理
```

## 5 條核心 User Flow

1. **首次進站與招牌互動**：看見品牌主張 → 在合成棋盤做一手 → 看見後果與理由 → 明白「第一次選擇會被保留」→ 明確進入第一課。示範不寫入任何學習紀錄。
2. **新課獨立作答**：選定課程 → 短講 → 顯示「目前任務／本題狀態」→ 首答前無提示 → 鍵盤／觸控／滑鼠作答 → 保存首答 → 進入結果。
3. **後果、修正與恢復**：原選點留在棋盤 → 顯示可觀察後果 → 說明規則理由、不推測心理 → 學習者重算 → 保存修正但不覆蓋首答 → 下一題。
4. **回訪、到期與結果遮蔽**：回訪 → 顯示到期或延後任務 → 說明來源與遮蔽規則 → 保存首答 → 批次完成前不揭露正誤 → 系統錯誤獨立呈現。
5. **次要工具與回到主流程**：從全域或任務工具入口開啟 → 使用自由棋盤／SGF／進階資料 → 清楚標示其證據角色 → 回到原課程與題次，不改變單題證據語義。

## 6 張 Wireframe 與 Award Intent

互動版本見 [`prototype.html`](prototype.html)。每張畫面右側均包含下列七個意圖欄位，而不是把「award」當成風格形容詞。

| 畫面 | 任務 | Memorable Moment | Emotional Intent | Interaction Signature | Restraint／Award Risk |
|---|---|---|---|---|---|
| W1 | 首頁預覽：等待一手 | 一枚游標像呼吸般停在棋盤上 | 好奇、安定 | 先選擇，尚不給答案 | 不用浮誇 hero 動畫；風險是只像漂亮 landing page |
| W2 | 首頁預覽：後果揭露 | 原選點與後果被一條因果線連起 | 頓悟、願意繼續 | 選擇→後果→理由 | 示範不寫資料；風險是被誤認成正式評量 |
| W3 | 桌機練習：自己判斷 | 整個畫面安靜地讓位給一個局面 | 專注、自主 | 單一主要動作，答案不洩漏 | 工具降階；風險是留白像未完成 |
| W4 | 桌機練習：比較與修正 | 第一次落點沒有被「答錯」抹去 | 坦率、可恢復 | 棋盤固定，右欄展開因果 | 不全屏紅、不推測心理；風險是戲劇化拖慢節奏 |
| W5 | 到期複習：結果遮蔽 | 不揭露答案時，介面仍然可信 | 可掌握、不焦慮 | 首答收據與系統警告分層 | 不假成功、不暗示正誤；風險是中性色辨識不足 |
| W6 | 手機連續任務 | 讀題、落子、理解、重試保持同一上下文 | 流暢、平靜 | 行動後於原位置展開結果 | 不強制跳頁或移焦；風險是小螢幕高度不足 |

## Award Experience Brief

### Experience proposition

**每一次選擇都被保留；棋盤讓後果可見，解說讓理由可重建，修正不會抹掉第一次判斷。**

### Audience and job

- 主要受眾：需要建立可遷移判斷力、而不只是累積題量的初學者。
- 核心工作：在新局面中做出未提示的第一手，理解可觀察後果，再形成下一次可重做的判斷。
- 不做的事：不把視覺華麗、即時正確率、練習量或引擎估計包裝成學習效果。

### Desired jury-readable qualities

- **Concept:** 招牌互動直接來自產品規則，不是附加的 spectacle。
- **Experience:** 首頁、桌機任務、手機任務共享同一因果語法。
- **Craft:** 空間穩定、排版節奏、棋盤材質、狀態層級與微動態互相支持。
- **Responsibility:** 可及性、reduced motion、資料邊界與失敗狀態是體驗的一部分。

### Success conditions

1. 不看說明也能指出「第一次落點仍在」。
2. 首答前無答案暗示；結果後能把文字理由對回棋盤上的變化。
3. 320px、375px 與 200% 縮放仍可完成主要路徑。
4. reduced motion 下資訊完整且沒有時間依賴。
5. 原型不寫入任何 learner data；production 實作時保留既有證據語義。

## Creative Direction

### 核心概念：**留下來的一手**

視覺不模仿傳統棋院，也不走抽象科技藍。以「紙、墨、木、留白」建立觸感，再用一條細而精準的金色因果線表達：行動發生過，後果可被追索。首頁容許詩意；任務區只保留對理解有用的部分。

### Art direction

- **形態：** 大面積柔和紙色、非對稱編排、精準細線、少量圓角；避免整頁卡片牆。
- **材質：** 棋盤木色與微量紙張顆粒由 CSS／SVG 產生，不依賴外部圖片。
- **對比：** 墨綠承擔權威與閱讀，金色只標示「已發生的選擇／因果」，赤陶色只標示需要修正的結果。
- **語氣：** 冷靜、具體、不獎懲、不擬人化引擎、不推測學習者心理。
- **節奏：** 首頁長呼吸；工作區短節奏；結果只比作答狀態多一層訊息，不換場。

## Visual System

### Tokens

| 類型 | Token | 值／用途 |
|---|---|---|
| Color | Ink | `#102a26` 主文字、主按鈕 |
| Color | Forest | `#1e4b38` 品牌與結構 |
| Color | Ivory | `#f4f0e6` 頁面底 |
| Color | Paper | `#fffdf8` 閱讀表面 |
| Color | Wood | `#d7a45e` 棋盤 |
| Color | Gold | `#c88e2c` 已發生選擇／因果，不代表正確 |
| Color | Clay | `#a84f32` 需要修正／錯誤 |
| Color | Success | `#236b45` 成功狀態 |
| Color | Info | `#326b8c` 系統資訊 |
| Type | Display | 系統宋體 fallback；只用於品牌主張與大型章節標題 |
| Type | UI | 系統無襯線 CJK stack；16px 內文、14px metadata |
| Space | Base | 4／8／12／16／24／32／48／72 |
| Radius | Control／Surface | 10px／20px；避免每個區塊都是膠囊 |
| Motion | Causal | 160ms ease-out；先選點、再描線、後展開解說 |

### Component rules

- `Task context` 同時但分開顯示任務類型與本題狀態。
- `Board` 在前後狀態保持相同尺寸與座標。
- `First-response ring` 永遠是金色，不與正確／錯誤色混用。
- `Feedback` 分為 answer、masked receipt、system alert 三種語義與 live region。
- `Primary action` 每狀態一個；次要動作最多一個可見。
- `Award Intent` 只存在審查外殼，不得進 production learner UI。

## High-Fi Mockup

`prototype.html` 是六張 wireframe 的同一份高擬真來源，並非另做一套失去規則連結的靜態圖。審查外殼與 learner artboard 清楚分離；所有範例資料皆為 illustrative。

- W1–W2：首頁招牌體驗前後狀態。
- W3–W4：桌機核心任務前後狀態。
- W5：到期複習／遮蔽與系統失敗分層。
- W6：手機上同一任務由首答到修正的連續狀態。

## Motion Prototype

按「播放招牌互動」會依序展示：

1. 選點環收斂（不代表正確）。
2. 落子後棋盤座標與尺寸不變。
3. 因果線由原選點連向可觀察後果。
4. 理由面板在 160ms 內展開。
5. 原選點繼續存在，重試不抹除。

`prefers-reduced-motion: reduce` 時直接切換完整結果，不播放脈衝、描線或位移；資訊沒有損失。原型不自動移動焦點。

## Frontend Craft Review

### 自動驗收

執行 `node "design-candidates/01 award-experience-a1/verify-prototype.cjs"`：

- 6 views／6 Award Intent 完整。
- 審查原型沒有 `form`、production script、`fetch`、`sendBeacon`、local/session storage 或 cookie 寫入。
- W1→W2、W3→W4 與 W6 motion state 可操作。
- 1440px、375px、320px、200% 縮放無頁面橫向溢位。
- 焦點可見、tab 語義與 reduced-motion CSS 存在。
- 產生桌機與手機截圖供視覺檢查。

### 本輪實際結果（2026-10-04）

| 檢查 | 結果 | 證據 |
|---|---|---|
| JS 語法 | **PASS** | `prototype.js`、`verify-prototype.cjs` 均通過 `node --check` |
| 六畫面／六意圖 | **PASS** | 6 個 tabpanel、6 個 Award Intent、42 個必要意圖欄位 |
| 寫入邊界 | **PASS** | 無 form、production script、storage／cookie／network write |
| 招牌互動 | **PASS** | W1→W2 可操作；原選點、後果與理由同時存在 |
| 現行狀態語義 | **PASS** | W3／W4 分開顯示「目前任務」與「本題狀態」；未使用舊 S1–S5 active state |
| 遮蔽與失敗分層 | **PASS** | response receipt 與 system alert 使用分開結構／語義 |
| Responsive／zoom | **PASS** | 1440px、375px、320px、200% 等價重排無頁面橫向溢位 |
| Reduced motion | **PASS** | 媒體偏好生效，直接呈現完整結果 |
| 截圖目視檢查 | **PASS（內部）** | 六張輸出均檢查比例、斷行、層級、棋盤穩定與主要動作 |
| 人類可用性／輔助科技 | **UNVERIFIED** | 需要真實新手、VoiceOver／NVDA／TalkBack 與真機 |
| Production Core Web Vitals | **NOT APPLICABLE YET** | 候選未接入 production、未部署，不虛構 LCP／INP／CLS |
| 得獎能力 | **UNVERIFIED** | 只能證明候選達到內部工藝門檻，不能把自評當外部評審證據 |

第一次以 CDP pipe 啟動 Edge 時出現環境逾時；既有 v63 驗證器也同樣失敗。改採 repository 現行的 `remote-debugging-port` 方式後，完整驗收連續通過。此修正改變的是測試傳輸方式，不是放寬斷言。

### 必須人工驗證

- VoiceOver／NVDA／TalkBack 的實際閱讀順序與公告品質。
- 真實初學者是否理解「金色＝原選擇，不代表正確」。
- 真實裝置觸控命中、長頁面捲動與視窗高度邊界。
- production 接入後的 LCP／INP／CLS 與低速網路表現。
- 外部獎項評審反應；內部檢查不等於得獎證據。

### 升格條件

使用者批准方向後，才可把候選拆成 production 變更；屆時須重新讀取並遵守現行教學／證據規格、執行既有 UI 與 repository boundary tests、補人類可用性與可及性驗證，並在發布前確認 public/local 版本一致。

## 回復方式

本輪沒有修改 `index.html`、`styles.css`、`app.js`、教學資產、formal candidate、release manifest 或 learner data。若不採用，移除本資料夾即可，不影響 production 行為。
