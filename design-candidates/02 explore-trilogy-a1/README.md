# Explore Trilogy A1：History × Math × Global Go Observatory

> `NON_NORMATIVE_DESIGN_CANDIDATE` · 2026-10-04
>
> 本包以 production `history.html`、`math.html`、`global-go-observatory.html`、兩份現行 CSS、三份頁面契約測試、`UI_UX_AUDIT.md`、`BRAND.md` 與 research authority boundary 為基準。它不修改 production、不連接 learner runtime、不讀寫 learner data，也不改 research evidence、teaching assets、scoring、scheduler、formal eligibility 或 release manifest。

## 一句話判斷

三頁的內容治理已比視覺表現成熟；真正的升級不是加更多卡片，而是把 History 的證據強度、Math 的推論距離、Observatory 的統計口徑變成三種可操作、可記憶、又不會升格主張的閱讀機制。

## 最新判斷：Johari 缺口與必要認知操作

### 開放區：現有證據已共同支持

- 三頁都是獨立、read-only Explore surface，不載入 learner runtime，不改學習進度、能力紀錄、排程、評分或正式評量。
- History 已有六種歷史主張標籤、五個問題、claim-near sources、明確未知與 scoped negative claim。
- Math 已分開「形式數學關係／圍棋認知實驗／教育線索／尚未驗證」，且拒絕把結構相似升格為一般數學成效。
- Observatory 已分開 G2–G5；只有同資料庫、同年度、同定義的 EGD G5 進排名，其他國家卡不互排名，Malaysia 維持 unknown。
- 現行 54 項 relevant Node contracts 全數通過；這只支持 engineering／content-boundary contract。

### 盲點區：實際檔案對照後才顯現

- `history.html` 與 `math.html` 共用 `history.css`，有助一致性，卻也讓兩頁看起來像同一份長文章；Math 的「推論距離」沒有形成自己的空間模型。
- `global-go-observatory.html` 使用另一套 dashboard-like CSS，卻缺少完整 Explore sibling navigation，第一個公開品牌露出也沒有明示 `VT-COS`。
- 三頁都把重要限制寫得很完整，但主要靠讀者讀完段落後自行整合；「看證據狀態／看關係層級／看統計口徑」尚未成為進頁第一個可操作行為。
- History 的 source density、Math 的多層推論、Observatory 的異質數字都可能讓讀者只記得醒目數字或故事，而忘記限制；自動測試不能排除此誤讀。

### 隱藏區：現有文件知道、一般讀者未必先看到

- 歷史標籤不是 learner evidence taxonomy；數學研究不是本站 learner outcome；Observatory research data 沒有 teaching／scoring authority。
- Explore 在首頁原本是低優先閱讀支線，Core 仍應是主要學習 CTA；候選不可把三頁升格成與 Core 等權的主產品入口。
- History 的 132／595、Math 的 A／B／C、Observatory 的 G2–G5 都是「如何判讀」的結構，不是成效進度或個人化推薦。

### 未知區：目前不能由自評補完

- 16–20 歲一般讀者是否能在 30 秒內說出三頁各自的關鍵限制。
- 標籤顏色、關係圖與數字條是否會被真人螢幕閱讀器使用者正確理解。
- 外部來源在 production promotion 當下是否仍可達、內容是否更新或定義是否改變。
- 新的互動鏡片是否改善理解、來源查閱率或回到 Core 的意圖。
- Awwwards、Webby 或 FWA 評審是否認為此種 restraint 足以構成獎項級體驗。

### 最可能出錯的位置

最可能的錯誤不是「畫面不夠炫」，而是讀者把視覺強度誤當證據強度：例如把 19²−17²=72 當改盤原因、把圍棋可數學化當數學成效、把不同國家的最大數字排成世界榜。

### 只採用三個高資訊增益操作

1. **對照（contrast）：** 把三頁共同的 read-only／source boundary 與各自不同的判讀機制並列，決定哪些可共享、哪些必須分開。
2. **反證（falsification）：** 每個 signature interaction 都加入一個會推翻直覺外推的停止線；若拿掉仍得到同一理解，該互動便沒有價值。
3. **逆推（backward reasoning）：** 從「讀者離頁時應能說出的正確限制」反推 Hero、CTA、detail 與 source 的順序，而不是從可用的 UI component 往下拼頁面。

未使用更多模型，因為再增加類比或抽象層不會改變目前核心判斷，只會增加文件長度。

## 必要修正與新增洞見

- **修正前提：** 三頁主要問題是視覺不一致。
  - **修正原因：** 共用視覺只是表面；真正差異是每頁要求讀者採用不同的證據判讀規則。
  - **修正後判斷：** 共用 shell 與 typography，保留三個專屬 signature：Evidence Lens、Transfer Bridge、Metric Tracks。
- **修正前提：** 互動越多越接近 award quality。
  - **修正原因：** 這三頁的可信度依賴 restraint；不必要的 animation、filter 與 personalization 會使研究內容看起來像遊戲化結論。
  - **修正後判斷：** 每頁只保留一個會改變理解的互動，其餘用 progressive disclosure。
- **修正前提：** 所有顯眼數字都適合視覺化成相同比例。
  - **修正原因：** Observatory 的 G2–G5 分母與定義不同；共同 bar chart 會製造假比較。
  - **修正後判斷：** 只替同源 EGD G5 畫可比較 bars；異質國家數字只在各自 profile 顯示，且口徑標籤與數字同層。
- **新增洞見：** 三頁可以形成「如何知道」的三部曲：History 問材料支持到哪裡，Math 問推論能走多遠，Observatory 問分母能否相互比較。這是比「歷史／數學／全球」更可遷移的資訊架構。

---

## Business Rules Registry

### Shared Explore rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| EX-01 | 三頁維持 repository-root、read-only Explore surface | Architecture authority boundary | 候選零 runtime／storage／network write |
| EX-02 | Research／history evidence 不取得 learner scoring、KC、scheduler 或 formal authority | hard invariant | 所有互動只改 presentation DOM |
| EX-03 | Core 是主要學習 CTA；Explore sibling 是閱讀導覽，不形成第四條課程路徑 | Design Plan | Header／footer 均保留「回核心課程」最高操作權重 |
| EX-04 | 第一個公開產品名稱同時顯示 `VT-COS` 與「悟之一手」 | `BRAND.md` | 共用 brand lockup 固定顯示 `VT-COS｜悟之一手` |
| EX-05 | 三頁可共享 shell、type、spacing、focus 與 source disclosure；不可共享證據語義 | evidence claim discipline | History／Math／Global 使用不同 label group 與 signature |
| EX-06 | 現行 canonical、route、主要 anchor 與 external locator 在 promotion 時不得失效 | production contract | registry 保留 route map；prototype 不改 production |
| EX-07 | External new-tab links 必須保留 `noreferrer` | existing tests | promotion gate 做逐 link contract test |
| EX-08 | 資料版本／最後查核日與限制要和主數字同一閱讀層級 | traceability | Hero meta 與 data card 都可見 |
| EX-09 | 不建立 streak、score、quiz result、personal recommendation 或 Explore completion | read-only boundary | UI 無進度環、成就或使用者模型 |
| EX-10 | Color 不得單獨承載 evidence status／metric type | accessibility | label 同時有文字、代碼與形狀／線型 |
| EX-11 | Disclosure 開關不得隱藏結論所需的最低限制 | claim safety | 可以／不可以、口徑與 unknown 永遠在折疊外 |
| EX-12 | 320／375px、200% zoom、keyboard、reduced motion 與 no-overflow 是 promotion 最低工程門檻 | existing UI discipline | verifier 自動測試 |

### History rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| HI-01 | 固定保留六種 presentation label：確證、高度可信、有爭議、傳說、研究假說、未知 | `history.test.cjs` | Evidence Lens 六項齊全，不映射百分比 |
| HI-02 | 五個問題與既有 `origin／board-size／cosmology／rules／stories` destination 保持可達 | actual HTML | question index 明示五入口 |
| HI-03 | 132 年 17 路與 595 年 19 路是不同物質錨點，不補寫單一改制因果 | current content contract | W2 timeline 中間保留 corpus gap |
| HI-04 | `19²−17²=72` 與外周七十二不可合成因果證據 | negative test | W2 interaction 顯示「數字相同 ≠ 歷史因果」阻斷線 |
| HI-05 | 傳說保留文化史價值，但不得升格事件史實 | history evidence model | claim card 固定「能說／不能說」 |
| HI-06 | 未知與 scoped negative claim 必須保留，不得用動畫補完缺口 | open-world evidence | unknown 使用空白節點與範圍說明，不用問號謎底化 |

### Math rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| MA-01 | 形式數學關係、圍棋認知實驗、教育線索、尚未驗證必須分層 | `math.test.cjs` | W3 四層 Relation Lens |
| MA-02 | 「圍棋可數學化」不推出「學圍棋提升一般數學」 | claim ladder | Transfer Bridge 中間有不可自動跨越的 gap |
| MA-03 | 四個問題 `formal-math／cognition／transfer／bridge` 保持可達 | actual HTML | W3 index＋W4 bridge |
| MA-04 | A／B／C 是待驗證研究設計，不是本站已執行實驗 | existing copy | W4 固定顯示 PROPOSED／NOT RUN |
| MA-05 | 真正 transfer 判定需全新、無提示、可比較題與延後測量 | current content | W4 outcome criteria 永遠可見 |
| MA-06 | HKBU 七人研究維持質性線索，不呈現為 effect size | current test | 候選不畫效果量 bar |

### Global Observatory rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| GO-01 | G2 每年學棋、G3 年度參與、G4 登記人口、G5 賽事活躍不得互換 | `global-go-observatory.test.cjs` | W5 Metric Tracks selector |
| GO-02 | 只有同來源、同年度、同定義的資料可直接排序 | current method | 只替 EGD 2025 G5 畫 ranking bars |
| GO-03 | EGD 榜是歐洲正式賽事活躍棋手，不是世界圍棋人口榜 | negative contract | chart title／caption 同層顯示 scope |
| GO-04 | 異質國家卡「以下不是排名」 | current content | W6 cards 不用共同比例軸 |
| GO-05 | Unknown 不等於 0；Malaysia 不以舊估計補空缺 | current negative test | unknown card 不畫零值 bar |
| GO-06 | estimate／survey／admin／unknown 與年份、分母、限制同層 | traceability | Profile card 固定四欄 metadata |
| GO-07 | 頁面為可更新研究頁；只有新資料足以改變判讀才擴充 | actual source section | Update note 保留版本與 recheck gate |

### Production route preservation map

| Page | Must-preserve destinations／anchors | Candidate change scope |
|---|---|---|
| `history.html` | `index.html`、`index.html#core`、`advanced.html`、`classic-shapes.html`、`#evidence`、`#questions` 與五 question IDs | presentation／navigation hierarchy only |
| `math.html` | `index.html`、`index.html#core`、`history.html`、`advanced.html`、`#boundary`、`#questions`、`#mapping`、`#sources` 與四 question IDs | presentation／relation lens only |
| `global-go-observatory.html` | `index.html`、`index.html#core`、`history.html`、all external source locators | presentation；若新增 section IDs 需 additive，不替換 route |

---

## Sitemap

```text
VT-COS｜悟之一手
├─ 學習首頁 index.html
│  └─ Core #core（主要學習 CTA）
└─ Explore／如何知道（read-only sibling navigation）
   ├─ History history.html
   │  ├─ Hero：我們知道什麼／怎麼知道／仍不知道什麼
   │  ├─ Evidence Lens #evidence：6 labels
   │  ├─ Five Questions #questions
   │  │  ├─ #origin
   │  │  ├─ #board-size
   │  │  ├─ #cosmology
   │  │  ├─ #rules
   │  │  └─ #stories
   │  ├─ Evidence transitions
   │  ├─ Research frontier
   │  ├─ Sources
   │  └─ Core／Advanced／classic shapes
   ├─ Math math.html
   │  ├─ Hero：三種關係不可混同
   │  ├─ Relation Lens #boundary
   │  ├─ Four Questions #questions
   │  │  ├─ #formal-math
   │  │  ├─ #cognition
   │  │  ├─ #transfer
   │  │  └─ #bridge
   │  ├─ Structure Map #mapping
   │  ├─ Sources #sources
   │  └─ Core／History／Advanced
   └─ Global Observatory global-go-observatory.html
      ├─ Hero：先看定義，再看數字
      ├─ Metric Tracks：G2／G3／G4／G5
      ├─ Comparable View：EGD 2025 G5
      ├─ Country Profiles：not a ranking
      ├─ Method／Unknown boundary
      ├─ Sources／update gate
      └─ Core／History／Math
```

不新增獨立 `explore.html`；共享 sibling navigation 足以解決三頁迷航，避免建立沒有內容 authority 的第四個 source of truth。

---

## 5 條核心 User Flow

1. **首頁延伸閱讀 → 選主題 → 回 Core**：Home Explore link → History／Math／Global → 先看該頁閱讀規則 → 閱讀一個主題 → 回核心課程。成功條件：不建立 learner event、不改進度，且 Core CTA 比 sibling navigation 明確。
2. **歷史主張查核**：History → Evidence Lens 選一種 label → 五問題 → 讀「可以說／不能說」→ 展開 claim-near source → external source。成功條件：讀者在開來源前已看見最低限制。
3. **數學推論距離判讀**：Math → Relation Lens → 數學結構／圍棋實驗／教育線索／尚未驗證 → Transfer question → A／B／C proposed design → 全新無提示延後題 criterion。成功條件：不能從第一層一鍵跳成成效結論。
4. **全球可比較排名**：Global → 選 G5 → EGD 2025 同源榜 → 查看定義／年份／source → 切換 G2–G4 時榜表退出比較語境。成功條件：只有 G5 顯示同源 ranking。
5. **異質國家數字／未知**：Global → country profile → 先讀 source type 與 metric → 看數字與 caveat → Malaysia unknown → method／source。成功條件：unknown 不顯示 0，異質數字沒有共同排名軸。

---

## 第一批 6 張 Wireframe＋Award Intent

| Wireframe | Page／job | Information hierarchy | Signature | Award Intent summary |
|---|---|---|---|---|
| W1 | History Landing | Hero → Evidence Lens → 5 questions → Core | 點選六種 label，示例主張與限制同步換鏡 | 讓「不知道」與「知道」同樣有形，不做古風佈景主題樂園 |
| W2 | History 17→19 | 132 anchor → corpus gap → 595 anchor → 72 anti-causal check | 同數字兩條路徑靠近後被 evidence barrier 阻斷 | 把「巧合不是因果」做成一個可記憶瞬間 |
| W3 | Math Landing | Hero → 4 relation layers → 4 questions | Relation Lens 只允許逐層看支持範圍，不自動連線 | 讓推論距離成為視覺空間，而非免責小字 |
| W4 | Math Transfer Bridge | Proposed A／B／C → new task → delay → interpretation | 選三組只高亮角色；Reveal 顯示成功判準，不產生結果 | 用最少機制揭示「好研究問題」比神奇成效更有張力 |
| W5 | Global Metric Tracks | G2–G5 selector → scope → EGD G5 ranking → source | 切換 metric 時 ranking context 明確收起／恢復 | 讓定義先於數字，數字仍保有 editorial impact |
| W6 | Global Profiles Mobile | source type → number → denominator → caveat → unknown | Source-type filter 只改可見卡；unknown 保持非數值 | 在窄螢幕上阻止大數字吞掉口徑與限制 |

每張完整 Award Intent 的七個欄位（Memorable Moment、Emotional Intent、Interaction Signature、Visual Opportunity、Restraint、Non-negotiables、Award Risk）都直接附在 `prototype.html` 對應畫面旁，不只存在本表摘要。

---

## Award Experience Brief

### Experience thesis

`How We Know`：把證據判讀本身做成 Explore 體驗。不是把研究頁包裝成獎項式 spectacle，而是讓讀者在一次短互動裡親手遇到推論停止線。

### Audience

- Primary：16–20 歲、對圍棋有好奇但沒有研究方法背景的一般讀者。
- Secondary：家長、教師、棋友與希望追來源的技術讀者。
- Not assumed：熟悉 evidence taxonomy、統計口徑、歷史學或實驗設計。

### Desired leave-behind

- History：「材料支持到哪裡，故事就說到哪裡。」
- Math：「結構相似不等於學習成效。」
- Global：「先看分母與定義，再看數字。」

### Success criteria

- 30 秒 orientation：能辨認目前是哪一種判讀任務及頁面不會改學習紀錄。
- 90 秒 comprehension：能正確說出至少一個不可外推的邊界。
- Source path：最低限制在 source click 前可見。
- Navigation：任一頁可到兩個 sibling Explore 與 Core，不迷失。
- Engineering：320／375／200%、keyboard、reduced motion、no-write PASS。

自動測試只能驗最後一項與部分資訊存在；前四項需要真人 task test。

---

## Creative Direction

### `The Evidentiary Atlas／證據圖譜`

- **History／Strata：** 像考古剖面與編目卡；線不是裝飾，而是材料時間與缺口。
- **Math／Bridge：** 像研究者的推論圖；節點之間的空隙是尚未驗證，不用發光箭頭假裝因果成立。
- **Global／Tracks：** 像觀測站儀表與資料軌；每條軌有自己的分母，只有同軌能比較。

共用紙張、墨綠、暖金與宋體 editorial scale；History 加入赭土，Math 加入靛藍，Global 加入冷青。三種 accent 只標示頁面領域，不代表 evidence strength。

### Deliberate restraint

- 不使用古卷材質、算式粒子、旋轉地球、世界地圖熱區或 AI 生成歷史人物。
- 不用 parallax、scroll-jacking、autoplay chart race、count-up、3D globe。
- 不把外部來源 logo 當可信度捷徑。
- 不新增假資料、個人化推薦或自動結論。

---

## Visual System

### Tokens

| Role | Token | Use |
|---|---|---|
| Canvas | `#e9e5da` | review／outside |
| Paper | `#f8f4ea` | article surface |
| Ink | `#102c25` | primary text |
| Forest | `#123f33` | shared brand／Core action |
| Gold | `#c89a3d` | focus／current lens；不代表 truth |
| History clay | `#a34f35` | historical domain cue |
| Math indigo | `#46577d` | mathematical relation cue |
| Global teal | `#20716a` | observatory domain cue |
| Unknown | outline + hatch | non-numeric absence；不使用灰化成 disabled |

### Type

- Display：`Iowan Old Style／Noto Serif TC／PMingLiU`，承載問題與主張。
- UI／data：system sans，承載 label、metric、source metadata。
- Numeric：tabular numerals；同源榜可對齊，異質 cards 不共享 visual axis。

### Components

- `Explore family bar`：Home／History／Math／Global／Core。
- `Boundary chip`：文字＋符號＋邊框，不只靠顏色。
- `Claim pair`：可以說／不能直接說同層。
- `Source drawer`：最低限制外露，locator 按需展開。
- `Unknown card`：明示查核範圍與 recheck trigger，不用 0 或空白破折號。

### Responsive behavior

- Desktop：內容 1fr＋Award Intent 320px review rail；頁內視覺不超過 1180px。
- Tablet：Award Intent 下移；figure 由雙欄轉單欄。
- Mobile：signature interaction、結論、限制、CTA 為單一垂直順序；tab bar 可水平捲動但 document 不 overflow。
- 200%：資料 bars 轉 list；source metadata 自然換行；不縮小字維持桌面排列。

---

## High-Fi Mockup

`prototype.html` 是六張 wireframe 的單一高擬真來源；所有數字與主張只重用 production 當前內容，不宣稱已重新完成外部學術查核。Candidate controls 只改記憶體中的 presentation class／text：

- W1：History Evidence Lens。
- W2：17→19 evidence gap 與 72 falsification。
- W3：Math Relation Lens。
- W4：proposed Transfer Bridge。
- W5：Global Metric Tracks＋EGD G5。
- W6：mobile country profile／unknown。

---

## Motion Prototype

1. **Lens shift（W1／W3）：** 120–180ms border／copy crossfade；切換 label 不讓數值 count-up，不自動捲動。
2. **Causal barrier（W2）：** 兩條線在 240ms 內靠近 barrier，但不連接；reduced motion 直接顯示兩端與「不能推出」。
3. **Bridge criteria（W4）：** A／B／C 只改選取邊框；criteria 由下方原位展開，不產生 success score。
4. **Metric track（W5）：** G5 顯示同源 bars；切到 G2–G4 時 bars 淡出並顯示「不可用同榜回答」，不 morph 數字。
5. **Profile filter（W6）：** 卡片 opacity／position 短距離調整；unknown 永遠可由 All／Unknown 抵達。

`prefers-reduced-motion: reduce` 移除 transition／animation，保留每個 end state、keyboard 操作與文字結論。

---

## Frontend Craft Review

### Candidate automated gate

- 6 tabpanels、6 Award Intents、42 intent fields。
- 3 production pages／3 page-specific signatures／5 core flows 對應完整。
- History 6 labels＋5 questions；Math 4 layers＋4 questions；Global G2–G5＋EGD 10 rows＋unknown。
- 無 form submit、storage、cookie、network write 或 learner runtime。
- Keyboard tabs、pressed state、focus-visible、reduced motion。
- 1440px、375px、320px、200% equivalent document no-overflow。
- 六張瀏覽器 screenshot 目視 review。

### 實測結果（2026-10-04）

| 檢查 | 結果 | 實際證據 |
|---|---|---|
| Production relevant contracts | **PASS** | `history.test.cjs`、`math.test.cjs`、`global-go-observatory.test.cjs`、`learner-language-boundary.test.cjs` 共 54／54 tests PASS |
| Candidate JS／verifier syntax | **PASS** | `node --check prototype.js`、`node --check verify-prototype.cjs` |
| Structure／Award Intent | **PASS** | 3 pages、6 views、6 Award Intents、42 intent fields、6 tabpanels、0 forms、0 external assets |
| History mechanism | **PASS** | 6 evidence labels、單一 pressed state、132／595 anchors、corpus gap、兩個 72 causal barrier |
| Math mechanism | **PASS** | 4 relation layers、4 panels、3 proposed study arms、4 transfer criteria、無假 effect size |
| Global mechanism | **PASS** | G2–G5、EGD 10 rows 與 exact values、G2–G4 拒絕共享榜、unknown≠0 |
| No-write boundary | **PASS** | Candidate HTML／JS 無 learner storage、cookie、beacon、XHR 或 network request |
| Responsive／motion | **PASS** | 1440／375／320px、200% equivalent 無 document overflow；44px targets；reduced-motion end state 可達 |
| 六張最終 browser screenshots | **PASS** | 第二輪目視未見裁切、重疊、缺圖、假進度、unknown disabled 或 scope 遺失 |
| Production pages／CSS 修改 | **NOT RUN** | 依 approval boundary 保持零修改 |
| 真人／AT／專家／CWV／獎項結果 | **UNVERIFIED** | 需要外部人類與 production 證據，不能由候選自評推出 |

### 本輪自我修正紀錄

- Production tests 在受限 sandbox 第一次執行為 **ERROR：`spawn EPERM`**；取得允許後以相同指令重跑，54／54 PASS。未把 sandbox error 寫成產品失敗。
- Candidate verifier 第一輪為 **FAIL**：selector 把 relation stage container 也算成 control；收窄為 `button[data-relation]` 後重跑 PASS。這是 test defect，未放寬四層成功條件。
- 第一輪目視發現 W2／W5 kicker 與標題被 grid 拆散、W3 outer marker 裁切、W6 單卡 filter 留下過量空白且缺 view scope；全部修正後重新執行完整 verifier。
- 第二輪再發現 W3 文案宣稱四層、visual 只有三個 orbit；補成四層並確認 01–04 全可見後，完整 verifier 再次 PASS。
- 所有最終 screenshots 都由最後一次 PASS 版本重新產生；沒有把舊圖當成修正後證據。

### Production promotion gate

- 先在 relevant spec 寫 change note；三頁是公開 entrypoints，需更新對應 cache marker、tests、release manifest／served-content contract。
- 逐頁 before／after contract：canonical、meta description、所有 internal href、anchor、external locator、`noreferrer`、source date、version marker。
- History：六 labels、五 IDs、negative claims、all source hosts、AA contrast tests 全跑。
- Math：四 layers、四 IDs、no-transfer-overclaim 與 learner-language tests 全跑。
- Global：G2–G5、EGD 10 rows、not-world-ranking、unknown-not-zero、wide-title／mobile-wrap tests 全跑。
- Windows Edge 320／375／760／1440／1920、200%、keyboard、reduced-motion、screen reader spot check。
- 真實網路量測 LCP／INP／CLS，並確認外部來源的新狀態；來源更新屬 research change，不由 presentation patch 偷改。
- 若 production bytes 改變，依既有 publication流程更新版本與 served-content marker；這三頁目前不在 Core critical asset set，不應自行改 formal candidate，除非首頁 critical navigation 同時改動。

### 仍未驗證

- 真人能否正確區分 historical evidence label、math relation layer、global metric track。
- VoiceOver／NVDA／TalkBack 實際閱讀順序與 chart comprehension。
- 外部領域專家對 history、math education、statistics 的內容審查。
- production Core Web Vitals、公開部署與 source availability。
- learning effect、retention、transfer、generalization 或任何獎項結果。

## Rollback／approval boundary

本輪不改 `history.html`、`math.html`、`global-go-observatory.html`、`history.css`、`global-go-observatory.css` 或任何研究／release 文件。若不採用，只移除此 candidate folder；若批准 production promotion，採逐頁最小 delta，可獨立 rollback，且不得 migration 或改寫任何 learner event。
