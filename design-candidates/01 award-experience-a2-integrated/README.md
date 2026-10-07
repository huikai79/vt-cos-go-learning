# 悟之一手 Award Experience A2 — Integrated Candidate

> `NON_NORMATIVE_DESIGN_CANDIDATE` · 2026-10-04
>
> 比較來源：`learning-workspace-v63` 與上一輪 `award-experience-a1`。本包只供審批，不修改 production、learner state、evidence、scheduler、scoring、formal eligibility、candidate fingerprint 或 release manifest。

## 一句話結論

A2 應保留 A1 的產品原生招牌體驗與作品級視覺，吸收 v63 的功能保全、文字題覆蓋、負面狀態與實作可追溯性，同時刪除兩者共同遺留的「把五步學習循環畫成當前進度」錯誤。

## Johari Window 比較與評估

Johari Window 在此只用於找出已知、未察覺、未外顯與尚未知的資訊缺口；區域本身不是證據。

### 開放區｜兩者已共同知道且可保留

| 共識 | v63 | A1 | A2 決定 |
|---|---|---|---|
| 首答與修正分開 | 規則、狀態矩陣與負面測試完整 | 轉為金色首答環與因果線 | 保留規則＋視覺符號 |
| 首答前不洩漏 | 對 board／text task 有明確限制 | W1／W3 實際呈現安靜 pre-answer | 保留並加入 DOM／accessible copy 反證 |
| 工具屬第二層 | 有完整功能與連結保全表 | 視覺上移出主 task canvas | 保留單一入口與回返契約 |
| 錯誤、非法、提示、遮蔽、儲存失敗分離 | 負面狀態矩陣最完整 | answer／receipt／system alert 有不同視覺語言 | 以 v63 規則約束 A1 視覺 |
| 響應式與可及性 | 覆蓋 text、desktop、mobile、320／375／200% | 有可操作 high-fi、reduced motion 與 Edge 驗證 | 合併為同一驗證器 |

### 盲點區｜比較後才顯性的錯誤

1. **A1 文件與畫面互相矛盾。** 文件正確說明五步只能是靜態方法，但 W3／W4 左欄仍以 `done`、`current`、序號連線表示「獨立作答正在進行」。這會讓任務類型、本題狀態與學習循環再次概念偷換。
2. **v63 的 S1–S5 learner-facing active grammar 已被 v70 推翻。** v63 的資訊架構、負面狀態與功能保全仍有價值，但 S1–S5 state matrix 不能原樣遷移。
3. **A1 六張畫面的樣本覆蓋失衡。** 兩張首頁建立了 award 敘事，卻排除了 v63 已驗證的文字／選擇題，容易把「棋盤體驗」過度泛化成所有任務都適用。
4. **兩者都用內部工程檢查接近地描述作品品質。** 自動化可證明結構與邊界，不能證明初學者理解、輔助科技品質、Core Web Vitals 或外部獎項反應。

### 隱藏區｜已存在但未被上一輪充分帶入成果

- v63 的 function/link preservation map 能防止漂亮重構刪掉課程、SGF、匯出、紀錄、到期與錯題入口。
- v63 的 text／choice task 顯示「產品不是只有棋盤落子」，能反證視覺系統是否真正可泛化。
- v63 的 negative-state contract 比 A1 的三個示例更完整，適合成為 production acceptance gate。
- A1 的首頁→工作區→手機共同因果語法、材質系統與 no-write prototype 是 v63 沒有的作品級優勢。

### 未知區｜仍需外部資料

- 初學者能否理解金色首答環表示「已發生」而非「正確」。
- 課程位置側欄是否比靜態學習循環更快建立方向感。
- 文字題與棋盤題共用相同狀態語法後，是否仍被理解為同一產品。
- VoiceOver／NVDA／TalkBack 實際公告、真機觸控、低高度裝置與 production LCP／INP／CLS。
- 外部評審是否認為招牌體驗具原創性；自我檢查不能替代。

## 最小高資訊增益操作

本輪只採四項會改變設計的操作：

1. **反證：** 用 v70 current truth 檢查 A1 的 rail，證實視覺仍暗示 active／passed。
2. **重新框架：** 六張 wireframe 從「六個畫面狀態」改成「六種必須被證明的體驗能力」。
3. **對照：** 將 v63 的 text task 與 A1 的 board task 並置，測試視覺規則能否遷移。
4. **逆推：** 從 production promotion 的失敗條件回推功能保全、狀態分區、no-write 與 refreeze gate。

未採用抽象類比或更多模型，因為不會再改變核心結論。

## 必要修正

- **修正前提：** A1 已完全遵守 v70 三層語義。
  - **修正原因：** W3／W4 的五步 rail 仍使用 current／done 視覺。
  - **修正後判斷：** A2 左欄改為真實課程位置；五步只出現在沒有 active、passed、序號連線或 `aria-current` 的「方法說明」。
- **修正前提：** 首頁前後狀態需要占兩張 wireframe。
  - **修正原因：** 同一畫面可用內部 motion state 清楚展示前後，兩張造成樣本覆蓋機會成本。
  - **修正後判斷：** W1 內部切換 pre／post；釋出的 W4 用於 text／choice task。
- **修正前提：** A1 的簡化 registry 足以支援 promotion。
  - **修正原因：** 缺少 v63 的功能／連結保全與完整負面分岔，實作時可能「視覺成功、功能失聯」。
  - **修正後判斷：** A2 registry 增加 preservation、negative-state 與 promotion gate。

---

## Business Rules Registry

| ID | Business rule | UI／驗收結果 | 覆蓋 |
|---|---|---|---|
| BR-01 | 第一次有效作答與 retry／eventual correction 分開保存 | 金色首答環持續存在；重試不得覆寫 | W1、W3、W6 |
| BR-02 | 已呈現／已曝光題目永不恢復為 unseen | 公開與重做題只標 Practice／Process Check | W5 |
| BR-03 | Practice、Process Check、Independent Evaluation 分離 | 任務來源與 feedback policy 明示 | W5 |
| BR-04 | Rules 決定合法性；scoring contract 決定結果；KataGo 只供受限估計；LLM 不是棋盤真相 | 裝飾、顏色與解說不得創造答案權威 | 全部 |
| BR-05 | 首答前不得在 DOM、accessible name、圖像或動線洩漏 accepted answer、correctness、takeaway、solution tree | Pre-answer 保持中性 | W1、W2、W4、W6 |
| BR-06 | 首頁互動預覽是合成示範 | 不寫 storage、learner state、evidence、score 或 scheduler | W1 |
| BR-07 | 招牌互動為「選擇 → 後果 → 理由 → 修正」 | 首答留在原位，因果可回指 | W1、W3、W6 |
| BR-08 | 回饋時維持題目與棋盤空間穩定 | board 尺寸與座標不跳動；文字題選項不消失 | W3、W4、W6 |
| BR-09 | illegal、wrong、hint、masked receipt、storage／provider／parser failure 分區 | 不共用同一 toast 或 live region | W5＋驗收矩陣 |
| BR-10 | 任務類型、本題狀態、靜態學習循環是三層語義 | 只有 badge 是即時狀態權威；方法說明無 active／passed | W2–W6 |
| BR-11 | 第一層只回答位置、任務、回應方式、結果與下一步 | 工具、紀錄、研究資料不永久占用 task canvas | W2–W6 |
| BR-12 | 每個狀態只有一個主要動作 | 次要動作最多一個，disabled next 不製造假 CTA | W1–W6 |
| BR-13 | 瀏覽單元不等於切換課程 | 只有明確 lesson selection 改變 task | W2–W4 |
| BR-14 | board、choice、count、connect、spot 共用狀態契約但保留不同 response semantics | 不把 board interaction 泛化成所有題型 | W2–W4 |
| BR-15 | due／wrong entry 只有真實非零時出現 | 無 placeholder、零數 badge 或合成任務 | promotion gate |
| BR-16 | 完成不等於精熟；工程成功不等於 learning effect | 不顯示未校準 mastery percentage | 全部 |
| BR-17 | 首頁與 workspace 共用品牌，密度可以不同 | 首頁敘事、workspace 專注、masked 信任 | 全部 |
| BR-18 | 動態只服務因果、方向與狀態 | 140–180ms；reduced motion 直接顯示結果 | W1、W3、W6 |
| BR-19 | 滑鼠、觸控、鍵盤具等價完成路徑 | 可見 focus；board roving tabindex 由 production 保留 | W2–W6 |
| BR-20 | 320px、375px、200% zoom 可重排 | 無頁面橫向溢位，主動作不被遮蔽 | W6＋驗證 |
| BR-21 | 既有課程、Today、SGF、Advanced、records、export、settings 與首頁 anchors 不得因 redesign 失聯 | promotion 前逐項 ID／href／handler 對照 | preservation gate |
| BR-22 | 候選升格才重凍 formal candidate；舊 human receipts 不自動沿用 | A2 本身不改 fingerprint | promotion gate |
| BR-23 | 投稿／發布前 public/local 版本一致，效能以真實 LCP／INP／CLS 驗證 | 不以原始大小或本機截圖替代 | release gate |

### Function and link preservation map

| 能力群 | 必須保留 | A2 placement |
|---|---|---|
| Orientation | 首頁、Core、current unit／lesson、task type、question state、skip link | top context＋course rail＋live badge |
| Course | unit selector、19 lessons、prev／next、lesson talk、learning-method explanation | course drawer／rail；方法說明為靜態 details |
| Core response | choice、count、connect、move、spot、hint、feedback、next | task canvas；W2–W4 sample |
| Today | due review、wrong review、resume | 條件式入口；W5 sample |
| Practice | interval、application、free board、Advanced | Tools & data 第二層 |
| SGF | import、reflection、comparison、review、portable export | Tools & data → SGF workspace |
| Data | Markdown summary、JSON backup、raw events、records、diagnostics | Records／Export 第二層；失敗不偽裝成功 |
| Landing | introduction、assessment、learning entry、courses、FAQ、sources、existing destinations | promotion 時逐 href 驗證 |

---

## Sitemap

```text
首頁／Learning Entry
├─ 品牌主張
├─ 合成招牌互動：選擇 ↔ 後果（不寫 learner state）
├─ 開始課程／繼續任務／條件式到期複習
├─ 靜態學習方法說明（不顯示目前／完成）
├─ 證據與限制
├─ 課程目錄
└─ FAQ／Sources

Core Learning Workspace
├─ 目前任務
│  ├─ 真實課程位置
│  ├─ 任務類型＋本題狀態
│  ├─ Question
│  ├─ Board／Choice／Count／Connect／Spot response
│  ├─ First response＋observable consequence
│  ├─ Feedback／reconstruction
│  └─ Next
├─ Course drawer
│  ├─ Unit／lesson selection
│  ├─ Lesson talk
│  └─ 靜態學習方法
├─ Today（有真實項目才出現）
│  ├─ Due review
│  └─ Wrong review
└─ Tools & data
   ├─ Interval／Application／Free board／Advanced
   ├─ SGF review
   ├─ Records／Diagnostics
   ├─ Export／Backup
   └─ Settings／Process trial

Explore／existing destinations
├─ History
├─ Math
└─ Global observatory
```

層級規則：第一層永遠只回答「我在哪裡、現在要判斷什麼、怎麼回應、發生什麼、下一步是什麼」。

---

## 5 條核心 User Flow

1. **首次進站與招牌體驗**：品牌主張 → 合成棋盤先做一手 → 原選點保留 → 揭露後果與規則理由 → 切回 pre-state 或開始第一課。任何互動都不寫 learner data。
2. **新課與未提示首答**：明確選課 → lesson talk → 開始練習 → 顯示課程位置／任務類型／本題狀態 → board 或非 board response → 保存第一個有效答案。非法與 hint 不冒充首答。
3. **後果、修正與完成**：首答 → 保留原回應 → 顯示 scorer／rules 允許的後果 → 具體理由、不推測心理 → retry／correction 分存 → next。correct、wrong、illegal、hint 各走自己的 branch。
4. **回訪、到期與遮蔽**：真實 due／wrong count → 顯示 task source → same-item 或 comparable shape → 正常 feedback 或 masked receipt → system failure 另區顯示 → queue continuation／exit。公開題不稱 unseen。
5. **次要工具與回返**：Core → Tools & data → SGF／free board／application／Advanced／records／export → 明示角色與限制 → 回到原課程及題次；次要資料不升級 scoring 或 eligibility。

---

## 第一批 6 張 Wireframe＋Award Intent

互動高擬真版本：[`prototype.html`](prototype.html)

| Wireframe | 必須證明的能力 | Memorable Moment | Emotional Intent | Interaction Signature | Restraint／Award Risk |
|---|---|---|---|---|---|
| W1 Landing Signature（內含 pre／post） | 首頁能在一張畫面完成產品解釋 | 第一次落點不消失，後果沿因果線出現 | 好奇→頓悟 | 點一下切換選擇／後果，可還原 | 不寫資料；金色不可被誤解為正確 |
| W2 Board／自己判斷 | 即時狀態與課程位置正確，首答前不洩漏 | 所有視覺都讓位給一個局面 | 專注、自主 | 一個主要動作；棋盤穩定 | 不再用五步 active rail；留白需精準 |
| W3 Board／修正重算 | 首答、後果、理由、retry 可共存 | 原選點成為重算錨點 | 坦率、可恢復 | board 不換場，右欄展開因果 | 不全屏紅；動態不可拖慢高頻任務 |
| W4 Text／Choice | 規則可遷移到非棋盤題 | 題目像精心編輯的推理頁而非表單 | 清楚、有自主感 | 選項群組共享相同 status／next grammar | 不放答案暗示插圖；風險是視覺過度樸素 |
| W5 Masked／System | 不揭露正誤時仍能建立信任 | receipt 與 system failure 同時清楚 | 可掌握、不焦慮 | 結構先於色彩表達語義 | 不假成功；中性色仍需 AT 驗證 |
| W6 Mobile Continuity（內含 pre／post） | 小螢幕維持完整思考上下文 | 結果出現時仍看見原題、board、首答 | 流暢、平靜 | 原位置展開，不強移 focus | 低 viewport height 與真機觸控未知 |

每張 prototype 右側均呈現完整七欄 Award Intent：Memorable Moment、Emotional Intent、Interaction Signature、Visual Opportunity、Restraint、Non-negotiables、Award Risk。這些只存在 review shell，不進 learner UI。

---

## Award Experience Brief

### Experience proposition

**每一次選擇都被保留；棋盤或選項讓後果可見，解說讓理由可重建，修正不會抹掉第一次判斷。**

### Audience／job

- 主要受眾：需要建立可遷移判斷，而不是只累積題量的初學者。
- 核心工作：在新位置先做未提示判斷，觀察後果，形成下一次能重做的規則。
- 不做：不以即時正確率、練習量、引擎估計或視覺華麗冒充 learning effect。

### Jury-readable success

1. 不看說明也能指出第一個回應仍在。
2. 首頁、board、text、masked 與 mobile 共享一套狀態語法，而非同一套版型。
3. 視覺高潮來自產品行為，不是 loading animation 或 decorative spectacle。
4. 可及性、資料邊界與錯誤分區是 concept 的一部分。

### 可驗收成功條件

- Pre-answer 無答案暗示；post-answer 能把文字理由對回原回應與後果。
- 靜態 learning cycle 不呈現 active／passed／current。
- 320／375px、200% zoom、reduced motion 仍完成主要路徑。
- Prototype 不寫 learner／network data；promotion 保留所有既有入口。

---

## Creative Direction

### 核心概念：**留下來的一手／A move that remains**

以紙、墨、木、留白表達推理的安靜；以金色記錄「已發生但不代表正確」；以赤陶色描出需要重新理解的因果。首頁有長呼吸與非對稱敘事，workspace 收斂為精準決策面，masked state 用結構建立信任。

- **Keep from A1:** 大型 editorial typography、材質感、金色首答環、因果線、跨裝置 signature。
- **Keep from v63:** 任務優先、board/text 分流、negative-state honesty、功能保全。
- **Remove:** active 五步 rail、卡片牆、孤立工具 rectangle、裝飾性答題圖、score spectacle。
- **Tone:** 具體、不獎懲、不推測心理、不擬人化引擎。

---

## Visual System

| 類別 | Token／規則 | 用途 |
|---|---|---|
| Ink | `#102a26` | 主文字、主動作、品牌權威 |
| Forest | `#1e4b38`／`#0e3028` | workspace 結構與 review shell |
| Ivory／Paper | `#f4f0e6`／`#fffdf8` | 長閱讀與 task surface |
| Wood | `#d7a45e` | board；不承擔正誤 |
| Gold | `#c88e2c` | first response／已發生；永不單獨表示 correct |
| Clay | `#a84f32` | observable correction consequence |
| Success／Info | `#236b45`／`#326b8c` | success 與 system status 分流 |
| Display type | 系統宋體 fallback | hero、question、chapter headings |
| UI type | 系統無襯線 CJK | control、metadata、long copy |
| Space | 4／8／12／16／24／32／48／72 | 保持首頁長節奏、workspace 短節奏 |
| Radius | control 10px、surface 20px | 避免全頁膠囊化 |
| Motion | 160ms ease-out causal sequence | selection → effect → reason；reduce 時即時 |

### Component contracts

- `Live task badge` 是唯一即時本題狀態權威。
- `Course rail` 顯示位置，不冒充能力或方法進度。
- `Learning method` 若出現，只是無 current／done 的靜態說明。
- `First-response ring`、`answer feedback`、`masked receipt`、`system alert` 各有單一語義。
- `Award Intent` 永遠在 review shell 外層。

---

## High-Fi Mockup

`prototype.html` 是六張 wireframe 的唯一高擬真來源。A2 刻意繼承 A1 的 visual foundation，再以 A2 override 改正 IA 與語義，讓「可保留的視覺」和「必須修正的狀態」在程式上也可追溯。

- W1：單一首頁中的 signature pre／post。
- W2–W3：相同 board geometry 的判斷／修正。
- W4：同狀態語法下的文字選擇題。
- W5：masked receipt 與 system failure。
- W6：手機 pre／post continuity。

---

## Motion Prototype

三條可操作 motion path：

1. **W1 internal:** 選點環收斂 → stone／effect 出現 → 因果線描出 → reason reveal；可切回原狀態。
2. **W2→W3:** 第一個有效作答後切換本題 status，board 座標不變，原選點保留。
3. **W6 internal:** mobile 原位置展開 feedback，不自動 scroll 或移動 focus。

所有動態只使用 opacity／transform／stroke reveal；`prefers-reduced-motion: reduce` 直接呈現 end state，資訊完整。

---

## Frontend Craft Review

### Automated acceptance

- 6 tabpanels、6 Award Intents、42 intent fields。
- W1、W2→W3、W6 motion path 可操作。
- W4 有完整 choice group，pre-answer 無 result／reason leak。
- W4 radio group 支援單一 roving tab stop、方向鍵選擇與確認動作解鎖。
- `learning-method` 不含 active、passed、done 或 `aria-current`。
- W5 receipt 與 system alert 分開；不聲稱 formal unseen。
- 無 form、production script、storage／cookie／network write。
- 1440px、375px、320px、200% equivalent reflow 無頁面橫向溢位。
- reduced motion 生效；JS syntax 與文字空白檢查通過。

### 本輪實際結果（2026-10-04）

| Gate | 結果 | 證據／限制 |
|---|---|---|
| Johari 比較 | **PASS** | 開放／盲點／隱藏／未知均由兩份候選與 v70 current truth 對照；未為填滿四區製造內容 |
| 六張／六份 Award Intent | **PASS** | 6 tabpanels、6 intent panels、42 個必要欄位 |
| v70 三層語義修正 | **PASS** | learning-method 內 0 個 active／passed／done／`aria-current`；course location 可獨立標示 current lesson |
| Board pre／post | **PASS** | 首答環、可觀察後果、理由與 retry 同時存在，動畫完成後 computed opacity=`1` |
| Text／choice | **PASS** | 3 radios、單一 roving tab stop、選擇後解鎖 confirm；未顯示 result leak |
| Masked／system | **PASS** | response receipt 與 system alert 分區，明示不作正式未見評量 |
| Prototype write boundary | **PASS** | 無 form、production script、storage／cookie／network write |
| Responsive／zoom | **PASS** | 1440px、375px、320px、200% equivalent reflow 無頁面橫向溢位 |
| Reduced motion | **PASS** | 媒體偏好生效，直接切換完整結果 |
| JS syntax／文字檢查 | **PASS** | `node --check` 通過；文字檔 trailing whitespace 無命中 |
| 六張截圖目視 craft review | **PASS（內部）** | 第一輪發現 reveal 中途截圖使 W1／W3 內容近似消失；將動畫完成後可見性納入 gate，重產後通過 |
| 真人可用性／AT | **UNVERIFIED** | 需要 target novices、VoiceOver／NVDA／TalkBack 與真機 |
| Production performance／外部獎項 | **UNVERIFIED** | 候選未接 production 或部署；不虛構 Core Web Vitals／得獎能力 |

### Promotion negative tests

- Pre-answer DOM／accessible tree 不含 accepted answer、correctness、takeaway、original move 或 solution tree。
- Retry 不改寫 first response；illegal 不產生 wrong-answer evidence。
- Wrong、hint、masked receipt、storage warning 各自保留。
- Correct 隱藏 hint，且只有一個 next primary action。
- No-due／no-wrong 不產生假入口。
- 每個既有 ID／href／handler 在桌機與手機仍可達。
- Production 接入後重新量測 LCP／INP／CLS 並重凍 candidate。

### External validation still required

- 目標初學者對金色首答環、task badge、course rail 與文字題的一致性理解。
- VoiceOver／NVDA／TalkBack、真機觸控與低高度 viewport。
- public served-content、真實 Core Web Vitals、外部評審。
- formal teaching／evaluation validity、retention、transfer、generalization；不得由設計驗收升格。

## Rollback／approval boundary

A2 不修改 production。若不採用，只移除此資料夾；若批准升格，必須另立 implementation change note、逐項保全入口、重跑完整 UI／repository boundary／candidate／gate checks、重凍 fingerprint，舊 human receipts 不沿用。
