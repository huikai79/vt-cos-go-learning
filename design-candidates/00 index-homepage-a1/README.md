# `index.html` Homepage Experience A1

> `NON_NORMATIVE_DESIGN_CANDIDATE` · 2026-10-04
>
> 本包直接以 production `index.html`、`styles.css`、`app.js`、current UI tests 與瀏覽器截圖為基準。它不修改 production，不寫 learner data，也不改 scoring、scheduler、evidence taxonomy、formal eligibility、candidate fingerprint 或 release manifest。

## 一句話判斷

現行首頁已有成熟品牌、完整入口與誠實邊界；需要的不是全面換皮，而是把靜態概念解說提升為可逆、無資料寫入的產品原生體驗，並收斂分流承諾與學習效果措辭。

## Production baseline：事實、推論、未知

### 事實

- 無 `#core` route 時，`#site-introduction` 是預設首頁；Core sidebar／topbar 隱藏。
- 首頁保有 `#site-introduction-assessment`、`#learning-entry`、`#all-courses`、`#faq`、`#explore-go`、`#intro-outcome` 等實際錨點。
- `data-site-intro-start` 依 `state.hasStarted` 顯示開始／繼續，進入 Core 並開啟 lesson intro；不直接製造答題成功。
- `data-site-intro-unit` 明確選擇單元，現行局部／全局入口分別使用 unit index 5／10；catalog 動態產生全部 15 單元。
- Advanced、自由棋盤、歷史、數學、全球觀察、九個來源連結均有真實 destination。
- 現行自動測試已覆蓋 fresh／returning CTA、catalog、不改 storage、unit route、375／320px 與 200% overflow。

### 推論

- Hero 已具品牌質感，但「提子是什麼」是靜態解說，訪客尚未經歷產品最獨特的 first-response／consequence mechanism。
- 三張學習入口的文案接近「系統替你判斷適合路徑」，實際行為只是直接選擇預設單元，應稱「選一個起點」而非個人化 placement。
- Hero、三入口、catalog、方法、理念／堅持、FAQ、研究、final CTA 都有價值，但節奏多次重新起頭，主要敘事容易被長頁面稀釋。
- method step 3 的「檢驗自己是否真正學會」超過現有證據層級；延後同題只能觀察重新作答，不自動證明 learning effect。

### 未知

- 首次訪客是否看懂靜態 Hero 棋形，或是否因此更願意開始課程。
- 使用者是否把三入口誤認為經過診斷的程度推薦。
- 可逆 Hero preview 是否提升理解或只是延長首屏停留。
- 真實裝置的 LCP／INP／CLS、實際輔助科技閱讀、目標新手完成率與外部獎項反應。

## 必要修正

- **修正前提：** 首頁主要缺口是視覺精緻度。
  - **修正原因：** production 截圖已具一致資產、排版與 responsive 品質；缺口是沒有展示核心產品行為。
  - **修正後判斷：** 保留品牌與資產系統，優先替換 Hero 的靜態解說機制。
- **修正前提：** 三張入口代表個人化學習路線。
  - **修正原因：** 實作只把使用者帶到 unit 0／5／10，沒有診斷或 placement evidence。
  - **修正後判斷：** 明示為「你可選擇的起點，可隨時更換」，不宣稱系統已判定程度。
- **修正前提：** 隔一段時間做對即可「檢驗真正學會」。
  - **修正原因：** 同題延後表現不能獨立證明 retention、transfer 或 learning effect。
  - **修正後判斷：** 改為「看看能否在沒有提示時重新判斷」，再由不同局面與外部驗證補強。

---

## Business Rules Registry

| ID | Homepage business rule | `index.html`／production authority | Candidate consequence |
|---|---|---|---|
| HBR-01 | 無 `#core` 時首頁是預設入口；進入 Core 後才顯示 workspace | `siteIntroductionOpen`、`#site-introduction` | 不建立第二個首頁 route |
| HBR-02 | 第一次品牌出現必須顯示 VT-COS 與悟之一手 | `BRAND.md` | Header 保留 `VT-COS｜悟之一手`；後續可簡稱 |
| HBR-03 | Fresh／returning CTA 由真實 `state.hasStarted` 決定 | `[data-site-intro-start]`、fresh／return labels | W1／W2 分開示範，不寫死 returning |
| HBR-04 | 點「開始／繼續」只進入 Core／lesson intro，不等於作答或成功 | `leaveSiteIntroductionForLearning()` | 不顯示分數、完成、evidence receipt |
| HBR-05 | Hero preview 是合成示範，與 production item／learner evidence 隔離 | 新候選規則；硬 invariants | 不使用 public item 作 formal evidence，不寫 storage／events |
| HBR-06 | Hero 首答前不得揭露 accepted move、correctness 或 takeaway | evidence／UI contract | Preview 先選擇，後顯示可觀察後果與理由 |
| HBR-07 | Preview 第一手在結果後仍可見 | first-response invariant | 金色環只表示「已發生」，不表示正確 |
| HBR-08 | 三張入口是可選起點，不是診斷或棋力判定 | unit 0／5／10 handlers | 文案明示「可隨時更換」與 prerequisite |
| HBR-09 | 單元瀏覽不改 course；明確 click 才切換 | `data-site-intro-unit`、current tests | W3／W4 保留 explicit selection |
| HBR-10 | Catalog 必須呈現全部 15 單元／19 課／106 題，數量不等於成效 | `#intro-core-course-list`、content.js | 動態 truth 不以候選寫死供 production 使用 |
| HBR-11 | Advanced、free play、history、math、global observatory destinations 保留 | 現有 href | Redesign 不得移除或留下空連結 |
| HBR-12 | 四項方法是靜態說明，不是 active／passed progress | v70 三層契約 | 無 current、done、序號連線式進度暗示 |
| HBR-13 | Practice、Process Check、Independent Evaluation 不互相冒充 | evidence taxonomy | 首頁只描述練習方向，不使用 formal evaluation 語氣 |
| HBR-14 | 延後同題只支持「重新作答」觀察，不自動證明真正學會 | evidence claim ladder | 修正文案；learning effect 維持未知 |
| HBR-15 | 完成課程不換算級位、段位、mastery 或 aggregate score | `#intro-outcome`、FAQ | 邊界保持首層可見，不只藏在 research details |
| HBR-16 | 真實 due／wrong 為 0 時不得顯示假入口 | current conditional actions | W2 的 Today card 只在真實 count > 0 顯示 |
| HBR-17 | Sources 與研究限制保留可達；外部連結保留安全 attributes | `.intro-research-details` | Progressive disclosure，不刪權威來源 |
| HBR-18 | Decorative assets 使用空 alt／`aria-hidden`；功能圖像需可讀名稱 | current asset policy | 互動棋盤有明確 role／label，背景仍 decorative |
| HBR-19 | Homepage interaction 不得意外更改 lesson、storage 或 hash | current catalog test | Preview toggle 完全 local to DOM；route CTA 才改 view |
| HBR-20 | 320／375px、200% zoom、keyboard、focus、reduced motion 可完成 | existing tests＋new candidate | Header 收斂、無橫向 overflow、動態可取消 |
| HBR-21 | 首屏 performance 以 production LCP／INP／CLS 驗證 | release gate | 保留尺寸屬性、避免新增 blocking font／runtime |
| HBR-22 | Production promotion 需更新 UI version／candidate fingerprint／manifest／current truth | change-control contract | 本候選不改任何 production binding |

### DOM／handler／destination preservation map

| Group | Must preserve | Acceptance |
|---|---|---|
| Home root | `#site-introduction`、`#site-introduction-title`、`.landing-header` | default focus、hidden/open 行為不變 |
| Primary CTA | 所有 `[data-site-intro-start]`、fresh／return labels | fresh／returning 都進 `#core` 並開 lesson intro |
| Route anchors | `#site-introduction-assessment`、`#learning-entry`、`#all-courses`、`#faq` | header links 與 scroll-margin 可用 |
| Start points | `[data-site-intro-unit="5"]`、`[data-site-intro-unit="10"]`、動態 0–14 buttons | explicit click 才變更 selected unit |
| Catalog | `#intro-core-course-list`、Advanced、`live-game.html` | 15 units 與兩個 external destinations 均可達 |
| Explore | `history.html`、`math.html`、`global-go-observatory.html` | 同一清楚群組，不重複 |
| Evidence copy | `.intro-assessment`、`.intro-task-type-note`、`#intro-outcome` | 不把方法、任務與能力混為一談 |
| Sources | `.intro-research-details` 與 9 個來源 | 保留 disclosure、rel 與 readable label |

---

## Sitemap

```text
index.html
├─ Homepage / #site-introduction
│  ├─ Header
│  │  ├─ VT-COS｜悟之一手
│  │  ├─ 課程特色 → #site-introduction-assessment
│  │  ├─ 選擇起點 → #learning-entry
│  │  ├─ 全站課程 → #all-courses
│  │  ├─ FAQ → #faq
│  │  └─ Fresh／Returning CTA
│  ├─ Hero signature preview（合成、不寫資料）
│  ├─ Returning summary（有真實進度才顯示）
│  ├─ Learning entry / #learning-entry
│  │  ├─ 從零開始 → Core unit 0
│  │  ├─ 局部閱讀起點 → Core unit 5
│  │  └─ 全局應用起點 → Core unit 10
│  ├─ Course catalog / #all-courses
│  │  ├─ Core 15 units／19 lessons／106 items
│  │  ├─ Advanced → advanced.html
│  │  └─ Free board → live-game.html
│  ├─ Learning method / #site-introduction-assessment
│  │  ├─ 未提示作答
│  │  ├─ 比較與修正
│  │  ├─ 延後無提示再判
│  │  └─ 不同局面應用
│  ├─ Principles and limits
│  │  ├─ Explore / #explore-go
│  │  └─ Capability boundary / #intro-outcome
│  ├─ FAQ / #faq
│  ├─ Sources and validation status
│  └─ Final CTA
└─ Core workspace / #core（既有，不在本候選重構）
```

---

## 5 條核心 User Flow

1. **首次訪客體驗產品再開始：** 開啟首頁 → Hero 合成棋盤先選一手 → 看見原選點、後果與理由 → 還原或按「從第一課開始」→ `#core` → lesson intro。Preview 不寫 storage／evidence。
2. **回訪並繼續：** 首頁讀取既有 state → CTA 改為「繼續核心課程」→ 顯示真實目前單元／課名；若真實 due count > 0 才顯示 Today → 進入原題或目前課程。首頁不重新計算 scheduler。
3. **自主選擇起點：** 到 `#learning-entry` → 比較 prerequisite 與內容 → 明白這是起點而非程度診斷 → click unit 0／5／10 → explicit unit selection → lesson intro。可回 catalog 更換。
4. **瀏覽全部課程與工具：** 展開 `#all-courses` → 不改 lesson／storage → 瀏覽 15 units → 明確 click 後才切 Core；或前往 Advanced／free board。返回首頁仍保留原 state。
5. **理解方法與限制再決定：** 到方法／能力邊界 → 區分 practice、delayed re-judgment、new position 與 formal evidence → 查看 FAQ／sources／explore links → final CTA 或離開。展開 disclosure 不產生學習紀錄。

---

## 第一批 6 張 Wireframe＋Award Intent

互動高擬真版本：[`prototype.html`](prototype.html)

| Wireframe | Production capability | Memorable Moment | Emotional Intent | Interaction Signature | Restraint／Award Risk |
|---|---|---|---|---|---|
| W1 Fresh Hero | 讓首次訪客實際經歷產品 | 第一手保留，後果在同一棋盤出現 | 好奇→頓悟 | 可逆 preview：選擇→後果→理由 | 不寫資料；風險是 preview 被當正式題目 |
| W2 Returning Home | 真實進度與 Today 條件入口 | 首頁記得「停在哪」，但不宣稱能力 | 被接住、可掌握 | continue 是主動作；due 只在 count > 0 | 不製造假個人化或假 due |
| W3 Choose a Start | 三入口誠實分流 | 每張卡說清 prerequisite 與可隨時更換 | 自主、不被分級 | 明確 unit selection，不是 placement test | 三卡不可變成同質行銷卡 |
| W4 Course Catalog | 15 units＋Advanced＋Free Board 完整可達 | 長課綱被整理成一張可掃描地圖 | 掌握全貌 | 展開不改 state；click 才切 unit | 不用 106 題數量製造成效印象 |
| W5 Method／Boundary | 同時說明方法、證據與限制 | 「我們知道什麼／還不知道什麼」同頁可見 | 信任、清醒 | 四方法無 active progress；sources 可展開 | 不能變成 research wall 或自我辯護 |
| W6 Mobile Home | Hero→preview→CTA 在窄螢幕仍連續 | 不需橫向滑動即可完成招牌體驗 | 輕、直接 | task-first 單欄，結果原位置展開 | 低高度、真機觸控與首屏 LCP 待驗 |

每張 prototype 均附完整七欄 Award Intent：Memorable Moment、Emotional Intent、Interaction Signature、Visual Opportunity、Restraint、Non-negotiables、Award Risk。它們只存在 review shell。

---

## Award Experience Brief

### Experience proposition

**首頁不是告訴你這是一套不同的學習引擎；它先讓你經歷一次：自己的選擇被保留、後果可見、理由可重建。**

### Audience／job

- 首次接觸圍棋、需要知道「我能不能開始」的人。
- 已有局部知識、希望自主選起點而不被虛假分級的人。
- 回訪者需要立即回到真實課程位置，而不是重讀整個品牌故事。

### Success conditions

1. 15 秒內能說出產品與一般題庫的差異。
2. Preview 前無答案暗示，後能指出原選擇仍在。
3. 三入口被理解為自主起點，不是程度診斷。
4. Fresh、returning、catalog、boundary 在同一 IA 下成立。
5. 所有既有 ID、handler、href 與 evidence claim 保留。

---

## Creative Direction

### 核心概念：**從一手，看見判斷如何形成**

保留 production 已建立的暖紙、墨綠、木色棋盤與桌面氣氛；移除「再增加更多裝飾資產」的方向，把唯一高張力留給 preview 的 causal reveal。首屏像一張有呼吸的編輯頁，路徑像清晰選擇，catalog 像地圖，方法與限制像可信的註腳。

- **Keep:** 現有 homepage assets、品牌色、Hero atmosphere、三階段圖、evidence illustrations、explore destinations。
- **Modify:** 靜態 Hero card → 合成可逆 preview；三入口文案 → 自主起點；延後文案 → 可觀察重新判斷。
- **Reduce:** section restart、同權 CTA、重複口號、過多同型卡片。
- **Never add:** 虛構 level quiz、假的 learner count、score animation、獎章、testimonial、未驗證成效。

---

## Visual System

| 類別 | Token／rule | Homepage role |
|---|---|---|
| Ink | `#102a26` | 標題、主要 CTA、可信度 |
| Forest | `#1e4b38`／`#0e3028` | Header、return state、final CTA |
| Ivory／Paper | `#f4f0e6`／`#fffdf8` | 長頁面背景與閱讀表面 |
| Wood | `#d7a45e` | Preview board；不表示正確 |
| Gold | `#c88e2c` | first response／current choice；不等於 correct |
| Clay | `#a84f32` | consequence／needs revision |
| Success／Info | `#236b45`／`#326b8c` | 只用於相應語義，不作 decoration |
| Display | 系統宋體 fallback | Hero 與 section thesis |
| UI | 系統無襯線 CJK | Nav、control、metadata、source copy |
| Space | 4／8／12／16／24／32／48／72 | Hero 長呼吸；catalog 高密度但可掃描 |
| Motion | 160ms causal sequence | choice→effect→reason；reduce 時即時 |

### Component contracts

- `Home CTA` 永遠由 fresh／returning state 決定。
- `Signature preview` 與 real item／learner state 隔離。
- `Start card` 只描述 prerequisite、內容與 destination。
- `Catalog` 展開不改 lesson；explicit unit button 才改。
- `Method step` 無 current／passed／done。
- `Boundary` 不藏到最底層；sources 可以 progressive disclosure。

---

## High-Fi Mockup

`prototype.html` 是六張首頁 wireframe 的單一高擬真來源，使用 production homepage 的資訊、課綱名稱與既有圖片資產；示範資料不連接 `app.js`，避免候選誤寫 state。

- W1：fresh Hero interactive signature。
- W2：returning state／conditional Today。
- W3：三個自主起點。
- W4：完整課程地圖。
- W5：方法、證據與限制。
- W6：mobile signature journey。

---

## Motion Prototype

1. W1／W6：選點環收斂 → 原選擇保留 → consequence stone／line 出現 → reason reveal；可逆。
2. W2：return summary 只做短 opacity reveal，不將數字 count-up。
3. W3：card selection 只改邊界與 destination confirmation，不做 carousel。
4. W4：catalog details 展開由原生 disclosure 管理；不以 scroll-jacking 換場。

`prefers-reduced-motion: reduce` 直接呈現 end state，不失去任何資訊，也不強制 focus 或 scroll。

---

## Frontend Craft Review

### Candidate automated gate

- 6 tabpanels、6 Award Intents、42 intent fields。
- W1／W6 preview 可逆，且不含 storage／cookie／network write。
- W2 fresh／returning、current location 與 conditional due 語義分開。
- W3 三個起點對應 Core unit 0／5／10；明示非程度診斷。
- W4 有 15 units、Advanced、free board；展開不改 state。
- W5 四方法無 active／passed／current；修正「真正學會」過度主張。
- 1440px、375px、320px、200% equivalent reflow 無橫向 overflow。
- reduced motion、focus-visible、JS syntax 與截圖目視 review。

### 實測結果（2026-10-04）

| 檢查 | 結果 | 實際證據 |
|---|---|---|
| JS／verifier syntax | **PASS** | `node --check prototype.js`、`node --check verify-prototype.cjs` |
| 結構與語義 | **PASS** | 6 views、6 Award Intents、42 intent fields、6 tabpanels、0 forms、0 external assets |
| W1 signature | **PASS** | pre-state 不顯示結果；互動後保留 first-response ring、顯示 consequence／reason；可逆 |
| W2 returning | **PASS** | location 與 conditional due 分離；demo 清楚標記；明示不顯示 mastery 分數 |
| W3 routes | **PASS** | 3 起點固定對應 unit `0／5／10`；只改候選 DOM 選擇，不導頁、不寫資料 |
| W4 catalog | **PASS** | unit `0–14` 共 15 個且不重複；Advanced／free board destination 齊全 |
| W5 evidence boundary | **PASS** | 4 方法無 progress state；「真正學會」過度主張已移除；can／cannot claim 同時可見 |
| Responsive／accessibility engineering | **PASS** | 1440／375／320px、200% equivalent 無 document overflow；44px target；reduced motion 分支成立 |
| 六張瀏覽器截圖目視檢查 | **PASS** | 無裁切、重疊、缺圖或非預期狀態；W6 mobile 保有 preview→reason→CTA 完整順序 |
| Production `index.html` 修改 | **NOT RUN** | 依 approval boundary 保持零修改 |
| 真人可用性／screen reader／CWV／得獎程度 | **UNVERIFIED** | 需要 promotion 後的真機與真人外部證據；不能由本候選自評推出 |

### 本輪自我修正紀錄

- 第一輪 Hero 擷取碰到淡入動畫尚未完成；改以 `opacity === 1` 的可觀察條件等待，避免把固定延遲當成完成證據。
- 375px 實測棋盤為 279px，低於候選的 280px 下限；左右內距各縮 2px 後重測通過。
- 320px 實測 review header 因不可斷字的 candidate label 產生 13px document overflow；加入可斷字與 `min-width: 0` 後重測通過。
- 六張最終截圖皆來自上述修正後版本；未把前兩輪 FAIL 隱藏成一次成功。

### Production promotion gate

- 建立現行 ID／href／handler before-after 自動對照。
- Fresh／returning／unit 5／unit 10／catalog 0–14 全路徑重跑。
- Preview DOM／accessible tree 在 pre-state 無 accepted answer／correctness／takeaway。
- Header、Hero 與圖片尺寸在真實網路量測 LCP／INP／CLS。
- VoiceOver／NVDA／TalkBack 與三名目標新手檢查理解、route expectation 與金色語義。
- 更新 `UI_UX_AUDIT.md` change note、UI version、cache key、formal candidate fingerprint、gate binding 與 release manifest。

### 仍未驗證

- 真人是否更快理解產品、開始率是否改善、三入口是否不再像 placement。
- 真機、screen reader、公開部署與 Core Web Vitals。
- learning effect、retention、transfer、generalization 或外部獎項結果。

## Rollback／approval boundary

本輪不改 `index.html`、`styles.css`、`app.js`。若不採用，只移除此資料夾；若批准 production promotion，需以最小 delta 保留所有既有 route／handler／historical semantics，失敗時回復 presentation 與 candidate binding，不改寫 learner events。
