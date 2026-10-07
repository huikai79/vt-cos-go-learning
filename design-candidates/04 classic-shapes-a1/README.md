# 形之間 A1：Classic Shapes 可擴充設計候選

> `NON_NORMATIVE_DESIGN_CANDIDATE` · 2026-10-04
>
> 本包以 production `classic-shapes.html`、`classic-shapes.css`、`classic-shapes.js`、mode／ontology／catalog／geometry modules、各題族 practice／scoring contracts、相關 tests，以及 repository 的完成矩陣、教學閘門、執行流程、設計、架構、學習量測、UI/UX 與品牌文件為基準。正式頁、題目、答案、規則、事件、排程、KC、正式資格與 learner state 均未修改。

## 一句話結論

`classic-shapes.html` 最該升級的不是畫面華麗度，而是把「新增一個題族就再長一段 HTML／專用 renderer」改成「ontology 管名稱、contract 管可玩性、單一 collection UI 管找題、單一 player 管作答」；Award 級體驗以「先見其形，再聞其名」作記憶點，但不犧牲 cue-control 與證據邊界。

## 三點要點

1. **現況內容強、擴充模型弱：** production 已有 23 個 ontology concepts、49 個現行可操作局面／rounds，以及練習／圖鑑 sibling modes；但 `classic-shapes.html` 488 行、`classic-shapes.js` 1,851 行，11 個題族／活動各自建立 UI state、board renderer 與 initializer，繼續複製會線性膨脹。
2. **真正可結合的優勢：** 保留現有「先作答後揭名、practice-only、未知 fail closed、Atlas 不評分、原 scorer 委派」；加入 task-first collection、固定每頁 12 筆、單一播放器、answer scope reveal 與三層 Atlas detail。不是用新 catalog 取代現有 authority。
3. **候選已可操作但未升格：** 6 張 High-Fi Wireframe、6 組 Award Intent、互動與 240 筆目錄壓力測試已完成；真人理解、螢幕閱讀器、production contract integration、效能與獎項結果仍未驗證。

---

## 最新判斷：Johari 缺口評估

### 開放區：production 與文件共同支持

- 練習與多語圖鑑已用 `#practice`／`#atlas` 分流；直接把圖鑑搬到練習前方會洩漏名稱線索，因此 sibling mode 是正確方向。
- 練習是 practice-only，不寫 `localStorage`、scheduler、KC、T2/T3、formal evaluation 或 mastery；一次答對不能被描述為已學會。
- 名稱揭示不是一致模板：直三與混合辨形明確先藏名；某些題族現行 section heading 已揭名。未來若要嚴格 cue-control，必須由每個 activity 的 reveal policy 明示，而不是由卡片文案猜。
- Ontology v5 是 concept／names／ambiguity／taxonomy／geometry relation 的 canonical source；`classic-shapes-catalog.js` 只是 compatibility adapter，不能回頭成為第二套概念資料。
- Practice contract／rules engine 才能決定某題是否可玩與怎麼判定。名稱、來源數量、geometry research registry 都不能自動取得 scoring authority。
- 現有活動至少包含四種 response contract：落一手、判斷狀態、三手短讀／條件縮眼、跨題族混合辨形；不能假設所有名型都套同一個直三四階段流程。

### 盲點區：把現況與「題目會持續增加」並排後才顯現

- 現行頁面用描述性 quick links 暫時降低捲動成本，但每加題族仍要加 section、IDs、DOM、state、事件 handler、render function、初始化與 responsive CSS；導航只是包住長頁，沒有消除長頁。
- `classic-shapes.js` 現有 `renderContrast／Cross／BentThree／FourStatus／PyramidFour／FlowerSix／GoldenChicken／BigPigsMouth／Bulky／Read／Reduction／Board` 等專用 renderer。這使新題的工程成本與 regression surface 隨題族增加。
- 「依名稱找題」會重新引入答案 cue；「完全不讓人知道內容」又會讓目錄無法掃描。真正分岔條件不是顯示／不顯示名稱，而是 **Practice 用中性結構描述選路，Atlas 才提供名稱檢索；每個活動另保存 reveal policy**。
- 題族數量與 round 數量是兩種規模：目前 23 concept 並不等於 23 個可玩 family，49 rounds 也不等於 49 個獨立有效內容單位。若 UI 把數字做成完成率，會製造內容與學習主張膨脹。
- 未來大量題目最危險的不是單純 DOM 變多，而是有人為了方便，讓 presentation registry 偷放 `answer／correctMove／vitalPoint`，逐漸形成第二套 scorer。
- Atlas 的 unknown／partial／rules-sensitive 是核心品質，不是待美化掉的資料缺陷；設計若只突出 verified cards，會把「不知道」藏起來。

### 隱藏區：repository 已具備但 production 未放到第一層的價值

- Geometry-first、D4 normalization、board context、evidence-chain 去重、negative mapping 與 unknown-preserving gates，已足以形成獨特的「Living Atlas」敘事。
- 多數可玩題已能以結構機制說明答案：例如 degree-3／degree-4、miai、double shortage、zero outside liberties。這些可形成 reveal motion，而不需要用假的 AI 分析或勝率熱圖。
- Interleaved contrast 已經證明可以引用 source item 而不複製 answer；這正是未來 collection／queue 也應採用的模式。
- 現有 practice 不保存 learner state，讓 collection redesign 可以先做純 presentation migration，不必同時引入題庫進度、資料 migration 或 scheduler。

### 未知區：不能用自我反思補完

- 目標使用者是否能在 30 秒內理解「練習」與「多語圖鑑」的用途差異。
- 「三點／四點／五點」與「找急所／判狀態／短讀」哪一種分類較符合 16–20 歲初學者的自然找題方式。
- 練習入口採中性描述後，是否仍會因 silhouette、題序、卡片色或 section 位置洩漏 family cue。
- 真實新增量會是 50、500 或 5,000 rounds；是否需要 client-side virtualization、build-time pagination 或 server search，要等可觀察規模與效能瓶頸。
- 真人鍵盤／螢幕閱讀器能否理解 board focus、第一反應、retry、reveal 與 Atlas 三層狀態。
- Awwwards、Webby 或 FWA 評審是否認為 evidence-aware restraint 足以形成獎項級體驗；只能以官方維度與 craft checks 校準，不能由候選自評證明。

### 最可能出錯的位置

最可能出錯的地方不是色盤或動態，而是 **presentation metadata 與 scoring authority 概念偷換**：為了讓大量題目容易搜尋，把名稱、正解、幾何、可玩資格與顯示資訊塞進同一份 catalog；最後目錄能顯示答案、未知題能被開啟、名字能冒充棋形、或新 renderer 自己判分。

### 只採用四個真正改變結論的認知操作

1. **重新框架：** 問題從「如何美化一張越來越長的頁面」改成「如何讓內容量增加時，authority、找題成本與 DOM 複雜度不一起增加」。因此結論從 anchor nav 改為 collection＋player。
2. **對照：** 對照 Practice 與 Atlas、presentation metadata 與 scoring contract、concept count 與 playable round count，找出不可合併的分岔條件。
3. **反證：** 用 240 筆匿名 scale fixture 驗證目錄仍只渲染 12 筆；用 unknown concept 驗證 CTA 保持不可玩；用 wrong→retry correct 驗證 first response 不被視覺覆寫。
4. **逆推：** 從「每新增一題只需要註冊 item、contract、descriptor、reveal policy 與 tests」反推共用 player slot、route、filter、error state 與 promotion gate。

沒有使用更多模型：類比更多博物館網站不會回答 scorer authority，抽象化已由 collection engine 完成，再加流程只會變長。

## 必要修正與新增洞見

- **修正前提：** 現有 quick navigation 已足以支援未來題量。
  - **修正原因：** quick links 只減少尋找距離，沒有消除每題族一個 DOM section／renderer／initializer 的線性成本。
  - **修正後判斷：** quick links 可作短期 fallback；正式擴充方向應是固定高度 collection＋單一 player，並保留 legacy anchors 作 deep-link alias。
- **修正前提：** 23 個 ontology concepts 就是 23 組可玩內容。
  - **修正原因：** 多個 concept 是 catalog-only、candidate-only、rules contract required 或 geometry evidence insufficient；ontology status 不等於 practice eligibility。
  - **修正後判斷：** Atlas 可以顯示 23 concepts；Practice 只列明確綁定、啟動時 contract validation 通過的 activity descriptors。
- **修正前提：** 為了避免洩題，Practice 入口什麼都不能描述。
  - **修正原因：** 完全匿名會破壞找題與心智模型；真正的 cue 是 family／答案／位置關係，不是所有任務資訊。
  - **修正後判斷：** 作答前可顯示 response type、眼空點數、bounded scope 與中性結構描述；正式名稱、takeaway、degree rationale 依 reveal policy 延後。
- **修正前提：** Award quality 需要更多動態與圖像。
  - **修正原因：** Webby 官方同時評 Content、Structure and Navigation、Visual Design、Functionality、Interactivity、Innovation 與 Overall Experience；Awwwards mobile guidelines 也把 usability、performance 與 best practices 列為基礎。華麗但洩題、不可鍵盤操作或長頁失控會降低品質。
  - **修正後判斷：** signature interaction 只保留三個：shape-before-name、first-response ink、scope reveal；其餘 motion 退到狀態轉場。
- **新增洞見：** 「未知可見」可同時處理研究誠信、品牌辨識與 award innovation。Atlas 不用把待核對項目藏起來；以三層狀態把 uncertainty 變成產品語言，但前台不暴露 repository 內部術語。
- **新增洞見：** 未來題庫的最小可恢復單位不是整頁，而是一個 activity descriptor。若新題出錯，可停用單一 descriptor／contract binding，不需刪整段 UI 或 migration learner state。

---

## Business Rules Registry

### A. Product、evidence 與品牌邊界

| ID | Business rule | Authority／reason | Candidate enforcement |
|---|---|---|---|
| CS-01 | 公開第一次產品名稱顯示 `VT-COS｜悟之一手`；後續可簡稱 | `BRAND.md` | W1／W6 lockup |
| CS-02 | 預設讀者是 16–20 歲一般學習者；前台不顯示 KC、taxonomy、contract、eligibility 等內部詞 | `BRAND.md` | learner copy 改寫為「判定範圍／可玩／待核對」 |
| CS-03 | `classic-shapes.html` 永遠是 practice／reference experience，不影響 Core progress、複習安排、formal evaluation 或 mastery | 現行 HTML／tests | 每個主要入口都有 practice-only boundary |
| CS-04 | Engineering behavior、內容有效性、真人可用性、formal validity、learning effect 保持證據階梯 | repo hard invariant | report 與結果卡分層，不用「證明學會」 |
| CS-05 | parser、rules、contract、registry 或 renderer failure 不可變成成功或可玩 | repo hard invariant | promotion fail closed；candidate unknown CTA disabled |
| CS-06 | 名稱是 scaffold，不是答案、KC 或 scoring authority | current design／ontology | shape-first reveal；Atlas 與 Practice authority 分離 |
| CS-07 | 一個已呈現／已曝光 item 不可被稱為 unseen；公開練習不可成為 formal holdout | repo hard invariant | mixed practice 明示不是 transfer／formal evidence |
| CS-08 | 不顯示級位、能力百分比、mastery、streak 或「完成題庫」 | evidence discipline | 只顯示 content availability 與當題 state |

### B. Source-of-truth 與未來新增題目

| ID | Business rule | Authority／reason | Candidate enforcement |
|---|---|---|---|
| REG-01 | `classic-shapes-ontology.js` 是 concept／name／ambiguity／taxonomy／geometry relation 的 canonical source | `ARCHITECTURE.md` | Atlas detail 只映射 ontology；不另建 names table |
| REG-02 | `classic-shapes-catalog.js` 保持 compatibility adapter，不得手寫第二套概念資料 | architecture invariant | 新 UI 優先以 ontology projection 產生資料 |
| REG-03 | 每個可玩 item 必須綁 versioned practice data 與 scorer／rules contract；presentation registry 不可保存 answer／correctMove／vitalPoint | current contrast pattern | Activity descriptor 只含 ID、route、renderer、response type、reveal policy、scope copy |
| REG-04 | Geometry evidence registry、reference oracle 與 name source 都不取得 scoring authority | architecture invariant | Atlas status 不自動開啟 Practice CTA |
| REG-05 | `practiceStatus` 只有在 UI adapter 有明確 allowlist mapping 且 runtime contract validation PASS 時才產生 playable route | fail-closed eligibility | unknown／catalog-only CTA disabled |
| REG-06 | 新題 onboarding 最少需：stable item ID、concept/family reference、response type、renderer descriptor、reveal policy、scope boundary、versioned scorer、positive/negative tests | future scale | promotion checklist 固定欄位 |
| REG-07 | 新增同 family item 應增加資料，不新增一套 renderer；只有新 response contract 才允許新增 adapter | complexity control | W2 collection＋W3 shared player |
| REG-08 | 一個活動驗證失敗只停用該 activity；不可讓整館 silent success，也不可讓壞題污染其他 scorer | recoverability | activity-level unavailable state |
| REG-09 | 歷史 item／concept／scorer 語義以事件發生版本保存；若日後新增 persistence，不能用最新 ontology 回填舊 response | hard invariant | 本候選不新增 storage；promotion 前需 change note |
| REG-10 | 同一 external Evidence Chain 的鏡像、複製網址或版本不增加獨立來源數 | ontology v5 | Atlas 不顯示誤導性的 source-count prestige |
| REG-11 | reference-only／rights unknown 的外部 geometry 不可被 candidate 資產或公開 registry 重建 | extraction gate | 原型只用抽象 self-authored silhouettes |
| REG-12 | 未知、conflict、rules-sensitive、geometry-required 必須可見且不可被 filter 默認排除為「不存在」 | uncertainty discipline | W6 有待核對 filter 與 disabled action |

### C. Practice collection、route 與 cue control

| ID | Business rule | Authority／reason | Candidate enforcement |
|---|---|---|---|
| UX-01 | `#practice` 與 `#atlas` 維持 sibling modes；不把 Atlas names 放到 Practice 首屏上方 | current mode IA | W1 header mode switch |
| UX-02 | Practice collection 以「要做什麼」為第一 filter：找急所、判狀態、短讀、混合辨形 | response contract diversity | W1 task routes／W2 filters |
| UX-03 | Practice 卡片可顯示中性結構描述、點數、response type、題數與 bounded scope；不得在 reveal policy 禁止時顯示 family name、answer rationale 或正確位置 | cue-control | W2 cards 使用中性描述 |
| UX-04 | Collection 每頁最多 12 筆；增加內容不增加頁面主體高度 | future scale | candidate 240-item test 仍 render 12 |
| UX-05 | Filter、search、page 與目前 activity 應可編碼為 deep-link state；legacy section anchors 保留 alias | route stability | promotion requirement；candidate 不改 URL |
| UX-06 | 返回 collection 時應回到相同 filter／page／scroll，不迫使重新找題 | task continuity | candidate in-memory model；production integration 待做 |
| UX-07 | concept 數、family 數、round 數、可玩數分開；不合成「完成百分比」 | false progress prevention | W2 分別標 49 rounds／23 concepts／12 page size |
| UX-08 | 載入、空結果、activity unavailable、validation error 都需有可復原狀態 | functionality | promotion blocker；candidate 有 empty／disabled states |

### D. Shared practice player

| ID | Business rule | Authority／reason | Candidate enforcement |
|---|---|---|---|
| PL-01 | Question／instruction 先於 board；目前任務與當題狀態分開 | current UI task context | W3 prompt-first mobile ordering |
| PL-02 | 名稱、family、takeaway 與 answer rationale 依 activity reveal policy；首答前不得由 heading、aria label、card class 或 asset filename洩漏 | cue-control | W3 learner-facing label 中性化 |
| PL-03 | first response 與 retry 分開；修正不能覆寫第一反應 | repo hard invariant（未來若存事件） | W3 ledger 模擬 wrong→retry correct |
| PL-04 | 本候選不新增 learner storage；production 若未保存 classic first response，不得因 redesign 偷加 evidence claim | scope control | DOM-memory only |
| PL-05 | Response adapter 只處理呈現／輸入 normalization；成功與否委託原 family contract | current contrast source delegation | W3／W5 文案與 promotion rule |
| PL-06 | 合法落子不必然是 task answer；wrong-but-legal 必須有 feedback 且留在同題 | scoring boundary | W3 wrong branch |
| PL-07 | 答對後顯示「本題可確認／沒有確認／不能推論」三層 scope | evidence ladder | W4 scope panel |
| PL-08 | 直三四階段是 family-specific sequence，不成為所有題族的全域模板 | `DESIGN_PLAN.md` | registry 可讓 activity 自訂 stage model |
| PL-09 | 混合辨形 round 只引用 source item ID，不能複製 answer；題序與位置不應穩定洩漏 family | contrast contract | W5 source delegation／neutral round |
| PL-10 | 完成混合練習只代表 exposure to contrastive practice，不建立 transfer 或 mastery | evidence boundary | W5 permanent stop line |
| PL-11 | board 必須保留 touch hit target、occupied／wrong／correct feedback、keyboard directions＋Enter／Space 與 live status | current regression contract | candidate visualizes; production integration must preserve handlers |
| PL-12 | Motion 不可延遲 feedback、啟用 Next 或改變 scorer end state；reduced motion 直接到同一狀態 | accessibility／authority | CSS reduced-motion rule |

### E. Atlas rules

| ID | Business rule | Authority／reason | Candidate enforcement |
|---|---|---|---|
| AT-01 | Atlas 不評分、不寫 learner evidence、不改 scheduler | current mode contract | W6 non-scoring header |
| AT-02 | Detail 永遠分開 Name、Geometry、Practice eligibility 三層 | ontology v5 | W6 three-layer detail |
| AT-03 | `needs_review`／negative name research 只能說「截至日期與搜尋範圍尚未找到」，不能說不存在 | ontology invariant | L Group copy 保留不確定性 |
| AT-04 | rules-sensitive position 必須同時呈現 rules／phase boundary，不給通用固定答案 | current bent-four boundary | 盤角曲四 detail disabled |
| AT-05 | ambiguity 與 negative mappings 必須讓人知道哪些不能直接視為同一棋形 | ontology invariant | 小曲尺／斗方／L Group warning |
| AT-06 | 只有可玩且 contract validation PASS 的 concept 才顯示 Practice CTA | eligibility gate | W6 button disabled for reference／unknown |
| AT-07 | Atlas search 可跨 locale／alias；搜尋命中不改 canonical identity | multilingual usability | W6 search sample |
| AT-08 | 大量 Atlas result 同樣需要 pagination／virtualization threshold；不能一次 render 全庫 | future scale | production requirement；本批樣本 6 筆 |

### F. Candidate 與 promotion control

| ID | Business rule | Status |
|---|---|---|
| CA-01 | 候選不得讀寫 localStorage／sessionStorage／cookie、不得 network request | `PASS` static＋browser verification |
| CA-02 | 候選 interaction 只示範 presentation state，不宣稱真正執行 production scorer | `PASS` candidate footer／README |
| CA-03 | production integration 必須建立舊 section ID → activity route 的 mapping，避免既有 deep links 失效 | `REQUIRED AFTER APPROVAL` |
| CA-04 | production integration 優先抽 adapter，不改 family contract；不得大爆炸重寫 11 個 scorer | `REQUIRED AFTER APPROVAL` |
| CA-05 | 若引入新的 presentation registry，需在 `ARCHITECTURE.md` 寫 change note：角色、非 authority、migration、rollback、validation | `REQUIRED AFTER APPROVAL` |
| CA-06 | production 變更後重跑所有 classic／geometry／UI／repository boundary tests，另加 registry uniqueness、unknown disabled、cue leak、240-item scale 與 deep-link regression | `REQUIRED AFTER APPROVAL` |
| CA-07 | Candidate promotion 要能以單一 feature flag／asset revert 回復現行 long page；不刪除原 contract 或 learner data | `REQUIRED AFTER APPROVAL` |

### Activity descriptor（概念性欄位，不是新答案來源）

| Field | Allowed | Forbidden |
|---|---|---|
| identity | activity ID、source module、family／concept reference、version | 以顯示名稱當唯一 identity |
| routing | mode、route key、legacy anchor alias | 由卡片 index 推導 family |
| presentation | neutral title、response type、point-count band、scope copy、renderer adapter | answer、correct move、vital point、固定 family cue |
| lifecycle | reveal policy、stage model、retry policy、availability state | 由 DOM 存答題真值 |
| authority binding | scorer／rules contract ID、validation hook | catalog 自行判分或 fallback success |
| accessibility | board label factory、keyboard instruction、status target | aria label 先洩漏答案／family |

---

## Sitemap

```text
VT-COS｜悟之一手
└─ 世界死活名型館 classic-shapes.html
   ├─ Orientation／practice-only boundary
   ├─ 棋形練習 #practice
   │  ├─ Task Gateway
   │  │  ├─ 找第一個急所
   │  │  ├─ 判斷活與死
   │  │  ├─ 讀一小段變化
   │  │  └─ 混合辨形
   │  ├─ Practice Collection
   │  │  ├─ response／point-count／scope filters
   │  │  ├─ fixed-size paged results
   │  │  └─ unavailable／empty／validation error states
   │  ├─ Shared Practice Player
   │  │  ├─ question／instruction
   │  │  ├─ board or status response adapter
   │  │  ├─ first response／retry feedback
   │  │  └─ reveal: name＋mechanism＋claim scope
   │  └─ Contrast Deck
   │     ├─ neutral round identity
   │     ├─ source scorer delegation
   │     └─ post-response comparison
   └─ 多語圖鑑 #atlas
      ├─ locale／alias search
      ├─ category／status filters
      ├─ paged concept results
      └─ Concept detail
         ├─ name evidence／ambiguity
         ├─ geometry identity／unknown
         ├─ ruleset behavior／negative mapping
         └─ practice eligibility → route only if validated
```

不新增 `classic-library.html` 或第二個 catalog。URL root 與 `#practice／#atlas` 保留；更細 activity state 可在 production approval 後用 additive route 參數設計，並提供 legacy anchor aliases。

---

## 5 條核心 User Flow

1. **首次進館 → 依任務找題 → 開始第一手**  
   Home／Core → `classic-shapes.html#practice` → 看 practice-only boundary → 選「找急所」→ collection 顯示中性結構卡 → 選一組 → player。成功條件：30 秒內知道這是練習；入口不洩漏 reveal policy 禁止的名稱；不需要滑過其他題族。
2. **Filter 大量題庫 → 深連結 → 返回原位置**  
   Practice collection → 選 response type／點數 → 固定 12 筆結果 → 下一頁 → 開 activity → 返回相同 filter／page。成功條件：240-item fixture 仍只 render 12；新增 item 不新增頁面 section；空結果可復原。
3. **作答 → 錯答 → 修正 → 揭名與 scope**  
   中性題號 → Question → board response → first response lock → wrong feedback → retry → correct → reveal name／mechanism → 顯示本題可確認、沒有確認、不能推論。成功條件：retry 不抹去 first response；首答前無名稱／答案 rationale；Next 在完成前不可用。
4. **混合辨形 → 委託原 scorer → 作答後對照**  
   選「混合辨形」→ family name hidden → source item response → source scorer → response 後揭 family＋degree rationale → 下一個不同 family。成功條件：contrast item 無答案欄位；section／round 不成為 cue；完成不顯示 transfer／mastery。
5. **圖鑑搜尋 → 比較名稱／棋形／資格 → 有條件進練習**  
   `#atlas` → 跨語搜尋 → 選 concept → 查看 Name／Geometry／Practice 三層 → playable 且 validation PASS 才能進 Practice；unknown／rules-sensitive 保持只讀。成功條件：名稱命中不自動合併 concept；unknown CTA disabled；來源與判分權限不混淆。

---

## 第一批 6 張 Wireframe＋Award Intent

| Wireframe | Job | Hierarchy | Signature interaction | Award Intent summary |
|---|---|---|---|---|
| W1 · Shape-first Gateway | 說明邊界、選任務 | brand → practice boundary → task routes | 漂浮 silhouette 保持匿名；選路只改 task／scope | 先看見形，再知道名字 |
| W2 · Scalable Collection | 在大量內容中找題 | count separation → filters → 12-card page → pagination | 抽屜牆重排但頁面不變長 | 把規模感變成秩序，不是壓力 |
| W3 · Shared Player | 作答、保留第一反應 | task → question → ledger → board → feedback → next | first-response ink 與 retry echo 共存 | 錯誤可修正，但不被擦掉 |
| W4 · Scope Reveal | 揭名、解釋機制與停止線 | shape → name → graph mechanism → claim scope | 名稱與 degree graph 同步浮現 | 「原來如此」勝過「答對了」 |
| W5 · Contrast Deck | 跨題族辨形 | neutral round → two shapes → response → comparison | degree-3／degree-4 在回答後分岔 | 對照真正的分岔條件 |
| W6 · Living Atlas | 查名稱、來源、未知與資格 | search → result → name／geometry／practice layers | unknown 以留白與 disabled action 被看見 | 把誠實的不確定性做成信任 |

每張 Wireframe 的完整 Award Intent 七欄——Memorable Moment、Emotional Intent、Interaction Signature、Visual Opportunity、Restraint、Non-negotiables、Award Risk——均在 `prototype.html` 對應 review rail，共 42 個欄位。

---

## Award Experience Brief

### Experience thesis

**`Shape Before Name／先見其形，再聞其名`**。

這不是一本把術語卡片排整齊的百科，也不是用得分把死活題遊戲化。體驗的核心是：先讓使用者面對負空間與關係，做一個 bounded response；名字、文化脈絡與來源在適當時機出現；系統同時誠實說明這個答案沒有證明什麼。

### Audience

- Primary：16–20 歲、完成基本氣／眼概念後，想建立經典棋形辨識的學習者。
- Secondary：需要查中／日／韓／英名稱與來源狀態的棋友或內容 reviewer。
- Not assumed：理解 graph degree、ontology、Evidence Chain、D4 normalization、contract、KC、T0–T3 或 formal evaluation。

### Desired leave-behind

- Practice：「我可以先看結構，不必先背名字。」
- Correction：「第一反應值得保留，修正不等於從沒答錯。」
- Reveal：「名稱是理解後的鉤子，不是答案。」
- Contrast：「相似棋形真正差在連接關係，不是卡片位置。」
- Atlas：「不知道可以被清楚標示；有名字也不一定能出題。」

### Success criteria

- Orientation：30 秒內分辨 Practice 與 Atlas；知道本頁不判棋力。
- Findability：從任一 activity 返回後，最多三次操作找到另一 response type；240 筆時頁面不靠長距離捲動。
- Cue integrity：首答前不能從 title、aria label、route label、card color、asset name或題序推回 family／answer。
- Authority integrity：只有 validation PASS 的 activity 可開；unknown／catalog-only／rules-sensitive 不被 presentation 升格。
- Response integrity：wrong→retry correct 後，first response 視覺與資料語義皆不變。
- Accessibility／craft：320px reflow、200% equivalent、44px controls、keyboard、visible focus、reduced motion、no horizontal overflow、無網路與無 candidate storage write。

前三項的「真人是否理解」仍需 target-user observation；瀏覽器檢查只能支持工程前提。

### Award calibration

- Webby 2026/2027 Websites & Mobile Sites 的公開維度包含 Content、Structure and Navigation、Visual Design、Functionality、Interactivity、Innovation、Overall Experience。本候選將可擴充 IA、authority clarity 與 participatory reveal 視為同等重要，不把視覺單獨當成總分。來源：<https://www.webbyawards.com/judging-criteria/>。
- Awwwards 公開 Mobile Excellence Guidelines 把 usability、performance 與 best practices 納入基本品質；本候選因此把 reflow、focus、touch target、reduced motion 與固定 DOM budget 列入 promotion gate。來源：<https://www.awwwards.com/mobile-excellence-guidelines.pdf>。
- FWA 只作 memorable digital experience 的 aspiration；沒有找到足以把本候選量化成「達到 FWA 門檻」的官方 scoring rubric，因此不製造分數。來源：<https://thefwa.com/>。

---

## Creative Direction

### `The Museum of Negative Space／形之間`

- **Primary metaphor：** 名型不是棋子圖案，而是由被圍住的空間、連接與邊界形成；視覺主角因此是 eye-space silhouette 與 adjacency constellation。
- **Narrative arc：** Anonymous shape → response trace → mechanism constellation → name／source label。
- **Brand fit：** 延續墨綠、暖金、黑白棋子與紙本質感；不創造不存在的 VT-COS logo 或官方色票。
- **Information character：** Practice 像安靜的觀察桌；Atlas 像持續修訂的標本櫃。兩者同館但權限不同。

### Signature grammar

- `Veiled label`：作答前只有中性題號與結構描述。
- `First-response ink`：第一次選擇是實線墨環；retry 是較細的 echo ring，不能覆蓋。
- `Adjacency constellation`：回答後把 eye-space 關係抽象成節點與連線，說明 degree／miai 等 bounded mechanism。
- `Scope triptych`：可確認／未確認／不可推論三張並置，取代單一成功卡。
- `Museum drawer`：collection 固定每頁 12 筆；filter 只重排當頁，不無限堆 DOM。
- `Honest void`：未知 concept 用留白、虛線與不可用 CTA，不用假棋盤填空。

### Deliberate restraint

- 不做 XP、streak、level、mastery percentage、leaderboard、每日連續或「全部完成」。
- 不用 family 名稱當 Practice filter；不以卡片顏色固定對應答案族。
- 不顯示 AI heatmap、勝率、最佳手或聊天導師。
- 不做 scroll-jacking、無限橫滑、3D 棋子物理、背景音效或 celebration confetti。
- 不把 Atlas 的 verified badge轉成「可評分」；不把來源網址數轉成可信度分數。

---

## Visual System

### Tokens

| Role | Token | Use boundary |
|---|---|---|
| Ink | `#102923` | 文字、棋子、primary structure；不等於正確 |
| Forest | `#17483b` | 品牌、穩定 workflow、Atlas detail |
| Warm paper | `#f5f0e4`／`#fffdf7` | 題幹、館藏、review surface |
| Warm gold | `#bd8e3f` | focus、current relation、reveal accent；不單獨表示 truth |
| Cobalt | `#405f7a` | first-response trace／task ribbon |
| Vermilion | `#a84d3d` | 高風險 boundary 文案；不能只靠顏色傳達 |
| Board wood | `#d4a95d` | board surface；幾何與座標仍由 runtime renderer 決定 |
| Candidate canvas | `#d7d2c7` | review chrome；不進 production brand token |

### Typography

- Display／reveal：`Iowan Old Style / Noto Serif TC / PMingLiU`，承載問題、結構與名字。
- UI／status：system sans，承載 task、scope、filter、response 與 source state。
- Coordinates／counts：tabular-capable sans；round、page 與 point count 對齊。
- 不用超細體或全大寫長句；英文 eyebrow 只作 secondary rhythm。

### Components

- `Mode header`：Practice／Atlas sibling modes。
- `Task gateway`：用 response intent 選路，不用名型答案選路。
- `Collection drawer`：12-card page＋filters＋pagination＋empty／error state。
- `Activity shell`：question、board／choice adapter、ledger、feedback、next。
- `Response ledger`：first／retry 分離；若 production 不保存事件，只做當次 DOM state。
- `Mechanism reveal`：name＋graph rationale＋scope triptych。
- `Contrast deck`：中性 round、source delegation、post-response family reveal。
- `Atlas specimen`：search result＋三層 detail＋conditional Practice CTA。

### Responsive behavior

- Desktop：collection 3 欄；player 題幹左、board 右；reveal mechanism 左、scope 右。
- Tablet：collection 2 欄；player／reveal 改單欄；Question 永遠先於 board。
- Mobile：collection 1 欄；W6 result list 在 detail 上方；filter 自然換行；主要動作至少 44px。
- 200% equivalent：不縮字保存雙欄；所有雙欄轉單欄，board 不超出 viewport。
- Reduced motion：立即進入同一 end state；status、feedback 與 Next 不等待 animation。

---

## High-Fi Mockup

單一可操作高擬真來源：[prototype.html](prototype.html)。它包含：

- W1 task route 切換與 boundary copy。
- W2 12 筆固定 DOM collection、filter、pagination 與 240-item scale fixture API。
- W3 wrong→retry correct、first-response ledger 與 delayed Next。
- W4 name＋mechanism＋scope reveal。
- W5 interleaved contrast post-response reveal。
- W6跨語 search、status filters、三層 detail 與 conditional Practice CTA。

瀏覽器驗證會輸出以下實際截圖：

- [desktop-w1.png](desktop-w1.png)
- [desktop-w2.png](desktop-w2.png)
- [desktop-w3.png](desktop-w3.png)
- [desktop-w4.png](desktop-w4.png)
- [desktop-w5.png](desktop-w5.png)
- [mobile-w6.png](mobile-w6.png)

---

## Motion Prototype

| Transition | Motion | Timing | Reduced-motion end state | Meaning boundary |
|---|---|---|---|---|
| W1 path selection | selected drawer inward 2px＋copy replace | 160–220ms | instant state | 只改找題意圖，不是推薦分數 |
| W2 filter／page | current cards fade／reorder，不持續 animated layout | 140–200ms | instant replacement | 不改 eligibility／answer |
| W3 first response | solid ink ring＋ledger lock | 160–200ms | ring／ledger immediate | ring=first，不等於 correct |
| W3 retry | dashed echo ring，first ring 保留 | 120–160ms | both visible | eventual correction 不覆寫 first |
| W4 reveal | label mask recedes＋core node pulse once | 280–420ms | name／graph／scope immediate | motion 不提供 scorer authority |
| W5 contrast complete | center divider splits；degree labels appear | 240–320ms | final labels immediate | completion 不是 transfer |
| W6 specimen switch | detail layers crossfade in order | 180–260ms | detail immediate | unknown 不被 transition 遮蔽 |
| failure／unavailable | no celebration；inline error enters without layout jump | ≤120ms | message immediate | error 不能 silent success |

全域「播放招牌動態」只播放 focus pulse，不觸發正式 rules 或 scoring。

---

## Frontend Craft Review

### Production current state

| Dimension | Current assessment | Evidence | Main risk |
|---|---|---|---|
| Content／claim discipline | `STRONG` | practice-only、first-move boundary、unknown、rules-sensitive 與 source-case 限制清楚 | 大量限制散落在各 section，難形成一致心智模型 |
| Ontology／provenance | `STRONG` | v5 分離 name、geometry、rules、ambiguity、taxonomy、negative mapping、Evidence Chain | Atlas adapter若被新 UI 當 scoring source，會概念偷換 |
| Practice correctness | `STRONG_BOUNDED` | 多個 rules／geometry contracts、negative tests、source scorer delegation | 每題族專用 renderer 使 presentation regression surface 持續增加 |
| Information architecture | `PASS_WITH_SCALE_RISK` | Practice／Atlas 分流與 descriptive quick links 已解決第一層發現性 | 長頁與專用 section 仍線性增加 |
| Cue control | `MIXED_BY_DESIGN` | 直三／contrast 有先答後揭名 | 部分 family section title 先揭名；未來需 per-activity policy，不可假裝全站一致 |
| Runtime structure | `HIGH_GROWTH_RISK` | 1,851-line JS，多組平行 state／render／initializer | 新 family 容易複製、遺漏、ID 衝突與不一致 keyboard behavior |
| Accessibility engineering | `PARTIAL_PASS` | 現有 board keyboard、focus、live feedback tests | 新 collection／shared player integration 尚未由 screen reader 真人測試 |
| Performance／scale | `UNVERIFIED_IN_PRODUCTION` | 現況規模可載入；candidate 240-item presentation fixture PASS | production 仍一次初始化所有 practice modules／sections；低階裝置未量測 |
| Award-level craft | `DIRECTIONALLY_READY` | concept、visual thesis、signature interactions、responsive candidate 已建立 | 未做 production integration、真人驗證或 external jury evaluation |

### Candidate review against award dimensions

| Dimension | Candidate evidence | Status |
|---|---|---|
| Content | 白話 task、三層 scope、unknown-preserving Atlas | `PASS_ENGINEERING` |
| Structure／Navigation | sibling modes、task gateway、paged collection、返回關係 | `PASS_ENGINEERING`; human findability unknown |
| Visual Design | coherent negative-space／museum system、six distinct but related screens | `PASS_VISUAL_CANDIDATE`; subjective quality unverified |
| Functionality | filters、pagination、response states、conditional CTA、no-write | `PASS_CANDIDATE` |
| Interactivity | give／receive loop across answer、reveal、contrast、search | `PASS_CANDIDATE` |
| Innovation | uncertainty and authority separation expressed as interaction | `HYPOTHESIS`; jury value unknown |
| Accessibility | focus, 44px, reflow, reduced motion, semantic tabs/status | `PASS_AUTOMATED_PRECONDITIONS`; human AT unknown |
| Performance | local assets、bounded current-page DOM、no network | `PASS_CANDIDATE`; production bundle/runtime unknown |

### Promotion sequence after approval

1. Add a short architecture change note defining `classic activity registry` as presentation-only adapter and documenting rollback.
2. Build a registry from existing modules without moving answers or changing contracts; validate unique IDs, routes, reveal policies and legacy aliases.
3. Introduce collection UI behind a feature flag while retaining current long-page route as fallback.
4. Extract one shared player adapter at a time: first-move → status → short-read／reduction → contrast. Run family contract regressions after each adapter.
5. Migrate Atlas UI to ontology-first detail without changing `classic-shapes-catalog.js` authority.
6. Add browser tests for cue leaks, wrong→retry, keyboard, unknown disabled, deep links, 240-item scale, 320px／200%／reduced motion.
7. Only after engineering PASS, run target-user findability／comprehension and real screen-reader spot checks; revise candidate fingerprint if production critical surface changes.

### Rollback

- Keep existing modules and section markup available until shared adapters pass parity tests.
- Feature flag can return `#practice` to current long-page render without data migration because this candidate adds no storage.
- Registry failure disables only the candidate shell and returns to existing renderer; it must not fallback to fake success or change scorer results.
- No ontology、item、scorer、event or learner-state migration is required for presentation-only phase.

---

## 驗證狀態

### 2026-10-04 實際結果

| Check | Exact result | Meaning |
|---|---|---|
| Candidate／verifier JavaScript syntax | `PASS` · 2 files | 只證明可解析 |
| Existing classic／ontology／geometry contracts | `PASS` · 10 files／133 tests／0 fail | 支持現有 23 concepts、49 rounds 與 authority boundaries 未被候選改動 |
| Headless Edge candidate verification | `PASS` · 6 views／42 Award Intent fields | 支持互動、no-write、no-network、scale fixture、reflow 與 reduced motion |
| 240-item collection stress fixture | `PASS` · 240 total／20 pages／12 rendered nodes | 支持 presentation DOM budget；不代表有 240 題有效內容 |
| Screenshot visual review | `PASS_WITH_UNVERIFIED_HUMAN_JUDGMENT` · 5 desktop＋1 mobile | 未見水平溢位、主要層級碰撞或控制裁切；審美與理解仍待真人 |
| Production file diff | `PASS` · no diff in classic production files | 正式頁未修改 |
| Initial sandbox runs | `ERROR_ENVIRONMENT` · Node `spawn EPERM`；CDP timeout | 以核准的沙箱外相同 commands 重跑後全數 PASS；不是產品 test failure |

`verify-prototype.cjs` 會檢查：

- 6 個 views、6 組 Award Intent、42 個 Award Intent fields。
- 無 external asset、無 storage／cookie／network write。
- W1 task route、W2 filters／pagination／240-item scale（rendered DOM ≤ 12）。
- W3 first response retained across wrong→retry correct。
- W4 name／scope reveal、W5 post-response family reveal、W6 unknown disabled／search。
- 1440px desktop、375px mobile、320px narrow、200% equivalent、no horizontal overflow、44px controls、reduced motion。
- production 靜態邊界：Practice／Atlas modes、practice-only copy、ontology canonical adapter、no `localStorage` in classic runtime、主要 renderer 數量與相關 tests。

### 證據停止線

- Browser PASS 只能證明候選 DOM、互動、reflow、no-write 與 scale fixture 的工程行為。
- Production tests PASS 只能證明現有契約沒有失敗，不證明候選已整合。
- 自動 accessibility checks 不證明完整 WCAG conformance 或真人 screen-reader usability。
- 自我比較與 Award Intent 不證明 Awwwards／Webby／FWA 得獎水準或評審偏好。
- 沒有真人 learner evidence，不宣稱辨形、保留、遷移、棋力或學習成效改善。

## 最終驗收

- 新增內容是否只是變長：否；核心新增是 authority separation、固定 DOM collection、shared player 與可回復 promotion path。
- 關鍵結論是否仍有反證：有；若未來只有少量題或各題 interaction 真正高度異質，shared player 的收益會降低，因此採 adapter-by-adapter migration，不一次重寫。
- 是否仍有重大未知：有；真人分類偏好、cue leakage、screen-reader 理解、production performance 與外部評審價值。
- 是否錯把自我反思當外部驗證：否；候選與測試只標 engineering evidence。
- 是否使用不必要認知操作：否；只用 reframing、contrast、falsification、backward reasoning。
- 是否達成原任務成功條件：完成 Business Rules Registry、Sitemap、5 flows、6 wireframes＋Award Intent、Award Experience Brief、Creative Direction、Visual System、High-Fi Mockup、Motion Prototype、Frontend Craft Review；正式頁未修改，等待批准。
