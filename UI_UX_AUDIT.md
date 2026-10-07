## 2026-10-07｜Full-site production geometry audit v1（進行中）

〔已確認〕使用者 1924×967 實際畫面顯示首頁 Hero 標題侵入右側互動預覽。現有 responsive test 雖覆蓋 1920px，但主要以 document scrollWidth 判斷；兩個元素都留在 viewport 內時仍可能彼此碰撞，因此舊 PASS 不能證明無重疊。

〔根因候選已實作修正〕正式 `experience-system.css` 同時存在 1240px 內容封頂、首頁雙欄 Hero、viewport-based 大標字級，以及共用 `.title-line { white-space: nowrap; }`。本分支將共用 title-line 改回自然換行，首頁 Hero 字級最大值由 5.35rem 收斂至 4.6rem 並讓 heading 使用自身欄寬；不使用 margin／z-index 掩蓋碰撞。

〔反回歸〕`tests/ui.test.cjs` 新增 production geometry matrix：首頁、Advanced、Classic、History、Math、Global Observatory、Live 分別在 375／760／1280／1440／1600／1920／2560 及 200% text 檢查 heading clipping、水平 overflow，以及指定 Hero 左右 sibling 的實際 bounding-box collision。這項 gate 專門補足 scrollWidth 無法證明 sibling separation 的盲點。

〔狀態〕JavaScript syntax 靜態解析 PASS；完整 Edge／Windows browser suite 尚待實際執行，因此本輪仍是 `IMPLEMENTED / PENDING_BROWSER_REVALIDATION`，不能宣稱全站重疊問題已修復。正式 candidate 暫不重凍；若任一頁新 gate FAIL，回到該 page-scoped selector 做最小修正，不用全域隱藏或固定高度換取 PASS。

## 2026-10-05｜Award Presentation v1（local formal promotion）

修正前提：使用者的「盡量不捲動」不等於可裁掉資訊，也不能用 global nowrap 製造新的溢位。新增 `experience-system.css` 作 page-scoped presentation layer：短首頁 Hero 只在寬螢幕保留作者指定行；動態題目、多語名型與 Explore 長標題採 `text-wrap: balance`、`line-break: strict`、合理欄寬與自然換行。Explore／Advanced／Live／Classic 用同一套紙色、深綠、金色、焦點與 reduced-motion 規則，仍保留各頁現有 DOM、控制與 runtime authority。短桌機只收斂無資訊空白，保持 natural document flow；不新增固定高度、第二個 detail scroll 或內容隱藏。首頁的「三入口」與「四步方法」改為對流程與可比較紀錄的描述，移除未被證實的個人學習成效承諾。Core candidate 重凍為 `formal-teaching-candidate-2026-10-05-a`／`fnv1a32-js16-82443b6a`，asset set v11；舊真人回條不得沿用，歷史事件／`uiVersion` 不變。rollback 是本機 pre-promotion snapshot 的指定正式檔還原；本輪工程／視覺檢查不能取代 target novice、screen-reader、formal teaching/evaluation 或 learning-effect evidence。

## 2026-10-03｜Learning Task Context v70 三層語意修復

v69 正確拆開「目前任務」與「本題狀態」，但漏接仍會標示 active／passed 的五步學習流程：首答正確時即時狀態為「比較理由」，對話框卻仍把「修正重算」標成目前步驟；手機又隱藏唯一帶 `aria-live` 的側欄卡。v70 因此把介面定義成三層：任務類型、本題狀態、靜態學習循環說明。只有題目上方 badge 是跨桌機與手機的即時 status 權威；側欄是視覺摘要；五步只說明可反覆使用的方法，不再表示目前或完成進度。

以下 P0–P5 是 v70 三層語意修復工作包；v69 同名項目保留為歷史紀錄：

| 優先級 | 完成條件 | 狀態 |
|---|---|---|
| P0 | 固定三層契約：任務類型、本題狀態與學習循環說明不得互相冒充。 | COMPLETE |
| P1 | Core 五步移除 active／passed／`aria-current`，改為靜態「理解概念／獨立作答／比較與修正／間隔再判／局面應用」。 | COMPLETE |
| P2 | 題目上方 badge 成為桌機／手機唯一任務狀態 live region；側欄移除重複 status 語意。 | COMPLETE |
| P3 | Advanced、經典棋形與自由棋盤重新稽核；無 Core 單題生命週期者維持既有 task-context，記為無須修改。 | COMPLETE |
| P4 | 反證首答正確、錯答、重試、到期、延後、application、local SGF 與手機 status；五步不得出現目前／完成狀態。 | COMPLETE |
| P5 | 更新 current truth、快取、candidate、gate 與 evidence binding；真人與公開環境證據維持分開。 | COMPLETE |

| 顯示層 | 權威內容 | 變更時機 | 禁止事項 |
|---|---|---|---|
| 目前任務 | 課程／練習／到期複習／延後再判／局面應用 | mode 或題目來源改變 | 不隨普通正答、錯答或提示移動 |
| 本題狀態 | 先看懂／自己判斷／提示後待作答／比較理由／修正重算／完成修正等 | 本題互動改變 | 不冒充跨題能力或證據結論 |
| 學習循環說明 | 理解、作答、比較與修正、間隔、應用五種方法 | 靜態 | 不使用 active、passed、`aria-current` 或目前進度外觀 |

Accessibility contract：`#learning-stage-badge` 使用 `role=status`、`aria-live=polite`、`aria-atomic=true` 並在桌機／手機都存在；側欄卡不再是 live region，避免桌機重複公告。自動化只能證明 DOM、CSS 與 accessibility-tree 前提，不等同 NVDA／Narrator／VoiceOver 真人公告品質。

UI version `learner-workspace-v70`；candidate `formal-teaching-candidate-2026-10-03-e`／`fnv1a32-js16-347e1cb4`。不新增 storage 或 migration，不改首答、重試、提示、曝光、scoring、scheduler、KC、event schema 或 formal eligibility；歷史事件保留原 `uiVersion`。rollback 為還原 v70 presentation 與 candidate binding，不改寫 learner events。本機 57 份非瀏覽器測試／612 項、Sabaki oracle 7 項、完整 Edge UI（含桌機／手機 accessibility tree status）、Edge smoke、KaTrain autodiscovery、repository boundary 282／282、candidate fingerprint、teaching gate report、deterministic R1 bank、181 份 JavaScript／5 份 PowerShell syntax 與 diff check 全數 `PASS`；正答／錯答／修正完成與手機截圖已人工檢視。PR CI、公開部署、真人 comprehension／實際 screen-reader 公告、formal teaching／evaluation 與 learning effect 不由本輪工程修復建立。

## 2026-10-03｜Learning Task Context v69 兩軸修復

v68 修正了 Core 從短講「課程」進入題目後仍停在課程的映射錯誤，但作答後實際畫面證明五列任務仍停在「練習」；這符合任務分類語義，卻與垂直圓點列的進度暗示衝突。v69 因此不再要求任務分類隨每題作答移動，而是把「任務類型」與「本題狀態」拆成兩個同時可見、各有單一責任的顯示軸。

以下 P0–P5 是 v69 兩軸修復工作包；v68 同名項目保留為歷史紀錄：

| 優先級 | 完成條件 | 狀態 |
|---|---|---|
| P0 | 固定兩軸契約：任務類型只在 mode／來源改變時切換；本題狀態才隨提示、正答、錯答與重試改變。 | COMPLETE |
| P1 | Core 移除五列假進度圓點，改為單一目前任務卡＋本題狀態；其他任務類型退到按需說明。 | COMPLETE |
| P2 | 由既有 runtime state 純衍生本題狀態；正答、錯答、錯後答對分別顯示比較理由、修正重算、完成修正。 | COMPLETE |
| P3 | 稽核 Advanced、經典棋形與自由棋盤；沒有 Core 單題生命週期者只保留既有 task-context chip，不強造本題進度。 | COMPLETE |
| P4 | 單元與 Edge 反證覆蓋課程→練習、提示、正答、錯答、重試成功、新練習、到期原題、延後 pilot、application 與 local SGF。 | COMPLETE |
| P5 | 更新 current-truth／發布快取／candidate／gate／evidence binding，並分開回報工程、真人與公開部署狀態。 | COMPLETE |

| 任務／互動 | 目前任務 | 本題狀態 |
|---|---|---|
| 本課短講尚未結束 | 課程 | 先看懂 |
| 正常新題／立即換形／首次 pilot | 練習 | 自己判斷 |
| 首答前查看提示 | 練習 | 提示後待作答 |
| 首答正確 | 練習 | 比較理由 |
| 首答錯誤、尚未答對 | 練習 | 修正重算 |
| 錯後答對，或錯題複習完成 | 練習 | 完成修正 |
| `scheduled_review_due` 尚未作答 | 到期複習 | 重新判斷 |
| follow-up pilot 尚未作答 | 延後再判 | 自己判斷 |
| 固定 application probe 尚未作答 | 局面應用 | 自己判斷 |
| local SGF 尚未作答／完成 | 練習 | 回想候選手／比對原棋譜 |
| masked pilot 已作答 | 練習或延後再判 | 首答已記錄 |

顯示契約：桌面側欄只突出一個目前任務，並在同一卡片顯示本題狀態；五種分類的完整清單放入「認識其他任務類型」收合說明，不使用空心圓、序號、連線、passed 或待辦外觀。手機不展開桌面卡，但題目上方 badge 必須同時顯示「目前任務：類型 · 本題：狀態」。`role=status`／`aria-live=polite` 只包住側欄兩軸狀態，不新增第二套資料來源。所有值皆由現有 state 即時計算，不持久化、不 migration；歷史事件保留其原 `uiVersion`。rollback 為還原 v69 presentation 與 candidate binding，不改寫事件。

UI version `learner-workspace-v69`；candidate `formal-teaching-candidate-2026-10-03-d`／`fnv1a32-js16-e8420a1a`。本機狀態測試與完整 Edge 已確認開始題目為「練習／自己判斷」、正答為「練習／比較理由」、錯答為「練習／修正重算」、錯後答對為「練習／完成修正」；桌機四張狀態截圖及手機 badge 已人工檢視。57 份非瀏覽器測試／612 項、Sabaki oracle 7 項、完整 Edge UI、Edge smoke、KaTrain autodiscovery、repository boundary、candidate fingerprint、teaching gate report、deterministic R1 bank、181 份 JavaScript／3 份 PowerShell syntax 與 diff check 全數 `PASS`。這些仍只支持工程行為與顯示一致性；真人是否不再誤解為五步進度、screen reader 實際公告品質、PR CI、公開部署與 served-content 尚未由本輪建立證據。

## 2026-10-03｜Learning Task Context v68 顯示契約與映射矩陣

本輪把全域「任務類型」與題內「目前狀態」分開；不是把 S1–S5 換成另一套 evidence taxonomy，也不建立五個可任意跳轉的新路由。Core 側欄使用「課程／練習／到期複習／延後再判／局面應用」標示目前任務來源，題目上方另保留「先看懂／自己判斷／提示後待作答／修正重算／隔時原題再判／首次或七天後流程試行」等精確狀態。「查看學習流程」仍說明看懂、作答、修正、隔時與應用的證據順序。

以下 P0–P5 是本次 Learning Task Context 工作包，不沿用其他研究或 Advanced roadmap 的同名 P0–P5：

| 優先級 | 完成條件 | 狀態 |
|---|---|---|
| P0 | 固定五個任務名稱、顯示契約、權威條件與映射矩陣；區分任務類型和題內流程。 | COMPLETE |
| P1 | Core 側欄與 badge 由既有 runtime state 衍生：短講／課程導入顯示課程，按「開始本課練習」後立即切到練習；只有一個目前任務，不新增持久化狀態。 | COMPLETE |
| P2 | 反證分岔完整：課程→練習、新題／錯題、到期原題、七天後 follow-up、application、local SGF 不得互相冒充。 | COMPLETE |
| P3 | 分批同步首頁說明、Advanced、經典棋形館與自由棋盤；清除 Advanced learner-facing「流程檢查」舊稱，立即項目稱練習／換形再判，實際延後項目才稱延後再判。 | COMPLETE |
| P4 | 靜態契約、狀態反證、完整 Edge UI、Edge smoke、桌機／手機／作答後截圖及無 overflow 檢查。 | COMPLETE |
| P5 | 更新 current-truth 文件、發布快取契約、formal candidate／gate／evidence 綁定並精確回報 PASS／FAIL／ERROR／未驗證項目。 | COMPLETE |

| 權威條件 | 任務類型 | 題內狀態／邊界 |
|---|---|---|
| 正常 Core，`lessonIntroPending=true` | 課程 | 正在看本課短講／示範；尚未進入題目作答。 |
| 正常 Core，短講結束且 `lessonIntroPending=false` | 練習 | 按「開始本課練習」後切換；首答、提示、重試與完成當題均維持練習。 |
| `reviewMode`、`new_practice_item`、`immediate_unseen_variant_after_error`、baseline pilot | 練習 | 錯題重算、新練習、立即換形與首次流程試行均不得冒充到期或延後。 |
| `externalMode=scheduled` 且 selection reason=`scheduled_review_due` | 到期複習 | 同一已曝光原題到期後重新判斷；不因有時間間隔就冒充不同局面的延後檢查。 |
| evaluation batch role=`followup`，或 Advanced delayed policy 已達實際 due | 延後再判 | 保存實際間隔；公開流程仍非 formal unseen／Independent Evaluation。 |
| `externalMode=application` 的固定低線索 probe | 局面應用 | 固定應用與自然實戰、SGF 分流；局部成功不等於完整棋力。 |
| `externalMode=local_sgf`、`live-game.html` | 練習／各自明確名稱 | SGF 稱棋譜單點復盤；自由棋盤稱練習。不能按 9×9／19×19 尺寸自動升格局面應用。 |

顯示契約：任務列表只有一個 `aria-current`，不使用序號、連線或前項完成勾勾；題目 badge 採「目前任務：類型 · 題內狀態」。短講／課程導入顯示課程，按「開始本課練習」後側欄與 badge 同步切到練習。獨立頁只顯示精簡 task-context chip，不寫 Core 進度。沒有 due／未達 delay 時不得製造可執行任務。任務類型為既有狀態的 pure presentation mapping，不持久化、不 migration；rollback 還原 v67 顯示層即可。UI version `learner-workspace-v68`；candidate `formal-teaching-candidate-2026-10-03-c`／`fnv1a32-js16-f4a5abb7`。真人是否理解五詞差異仍為 `NOT_TESTED`。

v68 工程驗證：反證涵蓋正常課程、錯題／新練習／立即換形、到期原題、七天後 pilot、固定低線索 application、local SGF、Advanced 立即／延後項目與自由棋盤；Edge 確認按「開始本課練習」後，側欄 active task 由課程切為練習、badge 顯示「目前任務：練習 · 自己判斷」，且同時間只有一個任務類型 `aria-current=true`；Advanced learner-facing 頁面不再出現「流程檢查」。57 份非瀏覽器測試／611 項、Sabaki oracle 7 項、完整 Edge UI、Edge smoke、KaTrain autodiscovery、repository boundary、candidate fingerprint、teaching gate report、181 份 JavaScript／3 份 PowerShell syntax 與 diff check 全數 `PASS`。桌機、手機與作答後截圖已人工檢視，未見裁切、重疊或目前狀態失焦。這些仍只支持工程行為與顯示一致性；正式 target-novice comprehension、screen reader spot check、PR CI、公開部署與 served-content 均未由本輪建立證據。

2026-10-02 Learning Workspace v67 Johari color review：公開區保留新版淺側欄降低導航競爭；盲點區修正舊／新版共同沿用的低對比金色 focus（白底約 2.43:1）及 active／passed 同用綠色；隱藏區把「統一色調」重新定義為「統一色彩職責」，避免整頁同色反而抹平 Question→Response→Feedback→Next；未知區保留真人是否更快辨識任務與下一步。實作後主畫布 `#f4f5ef`、Question 白、Response 淡綠；暖金 current/focus、綠 complete/success/next、橙 error/recalculate。焦點與 option control boundary static contrast ≥3:1，正誤另有圖示及文字。UI version `learner-workspace-v67`；candidate `formal-teaching-candidate-2026-10-02-e`／`fnv1a32-js16-a369954a`。Rollback 為移除 v67 semantic-tone override 並另立 candidate；真人 usability／accessibility `NOT_TESTED`，learning effect `NOT_MEASURED`。

v67 工程驗證：57 份非瀏覽器測試檔／607 項、完整 Edge UI、Edge smoke、320px／375px／200% reflow、candidate、gate report、repository boundary、syntax 與 diff check `PASS`；更新後桌面棋盤題、純文字題、作答後與手機截圖已人工檢視。main Verify #939 與 Pages #516 已 `PASS`，served-content gate 已讀回公開 v67；初次 Verify #938 暴露的 9 個審查資產 manifest 漏列已以 282／282 exact-match 修正。這只確認角色色、層級、發布內容與操作未回歸；真人能否更快找到問題、結果與下一步仍 `NOT_TESTED`。

2026-10-02 Learning Workspace v66 production rhythm／Next correction：公開舊版桌面節奏為 content top 30px、title margin 10／20px、context padding 12／15px、context bottom 20px；v66 恢復上述值，mobile 仍用既有 13px／5／2px／8px 緊湊規則。首答前 disabled Next 沒有操作價值且形成右下假主動作，因此 hidden；正答或 masked evaluation 首答記錄完成後才顯示，固定與 feedback 左對齊。錯答 retry 時不顯示 Next，避免跳過修正。Question 題卡內容、sidebar、hint lifecycle 與 evidence semantics 不變。UI version `learner-workspace-v66`；candidate `formal-teaching-candidate-2026-10-02-d`／`fnv1a32-js16-3db9e78a`。Rollback 為還原 v65 spacing／Next visibility 並另立 candidate；真人 usability／accessibility仍 `NOT_TESTED`。

2026-10-02 Learning Workspace v63 design pipeline：依使用者要求，先停止 production UI 微調，建立 `design-candidates/learning-workspace-v63/` 暫時審查包，依序完成 Business Rules Registry、Sitemap／IA、5 條核心 User Flow、S1–S5 與負面狀態矩陣、6 張各附 Award Intent 的 Wireframe、Award Experience Brief、Creative Direction、Visual System、High-Fi Mockup、Motion Prototype 與 Frontend Craft Review。候選移除文字題右下孤立的 Advanced 長方格，將工具保留為全域第二層入口；配圖採功能必要且不洩題原則，桌機採共享對齊基準，手機採 task-first 單欄。Edge 審查原型 6 views／6 Award Intents、桌機、文字題、375px、320px 與 200% reflow `PASS`；首次渲染發現 `.review-view` 覆蓋原生 `hidden` 導致六稿串接，已修正並重驗。此包是 `NON_NORMATIVE_DESIGN_CANDIDATE`，沒有載入或寫入 learner state，不改 production `index.html`／`styles.css`／`app.js`，不需重凍 candidate；真人 usability／accessibility `NOT_TESTED`，正式教學／評量仍 `BLOCKED`，learning effect `NOT_MEASURED`。下一 gate 是使用者審查與明確 implementation approval；未批准前不得把候選版面 promotion 到 production。

2026-10-01 Learning Workspace v62 corrective implementation：使用者以 v61 實際畫面要求喬哈里視窗嚴格檢討；結果為桌面核心流水線 `FAIL`：Question→Board→Response 的單欄排列使首答與首答後資訊需要額外捲動，而右側 guidance 占用可承載操作的欄位。修正後桌機採 board 左、Question／Response／Feedback／Next 右，board 上限 440px；metadata 集中靠左、S rail 保留但縮短，`learning-now-summary` 進題目卡，重複 `workspace-next-summary` 保留資料節點但不再顯示，Advanced／紀錄入口仍在後段收合層。1079px 以下維持 Question→Board→Response，不要求 mobile 單屏。Edge 以 1440×900 驗證首答前題目／完整棋盤／作答／提示／Next 均在 viewport，首答後棋盤／Feedback／Next 仍在 viewport 且 `scrollY=0`；這只支持工程版面，不是 usability 或 learning-effect evidence。UI version `learner-workspace-v62`；candidate `formal-teaching-candidate-2026-10-01-j`／`fnv1a32-js16-cc64381a`。Rollback 為還原 v61 grid／guidance 呈現並另立 candidate，不改寫已產生的 v62 事件。未 commit／push／merge；正式真人觀察仍 `NOT_TESTED`。

2026-10-01 Learning Workspace v61 implementation：使用者明確改為要求直接實作附圖方向，故下方 `REVIEW_CANDIDATE` 的「等待批准」只保留為先前審查紀錄，不再代表目前工作狀態。已保留題目／棋盤／回饋與原入口，桌機用左側 S rail、中央 task、右側按需指引；手機不永久展開 rail，進階紀錄由後段入口開啟。提示前仍 S2，立即變形 S2，首次 pilot S2，到期同題 S4 改稱原題再判。原圖藍色答案點與底部四塊 annotation 未採納。新 UI version `learner-workspace-v61`；candidate `formal-teaching-candidate-2026-10-01-i`／`fnv1a32-js16-9cea90da`；舊回條不沿用，正式真人觀察仍 `NOT_TESTED`。

2026-10-01 Core S1–S5 terminology v60：以下 latest-main audit 完成後只實作 S4 的 `REFINE`。畫面改用「隔時新棋形／到期時換形再做」，公開／已曝光流程不再稱 formal unseen；新增 learner-language negative test 與 Edge 動態斷言。57 份非瀏覽器測試、Edge UI／smoke、375px、320px、200% text、candidate fingerprint、teaching gate report、repository boundary、syntax 與 diff-check PASS；真人可用性與無障礙證據仍 `NOT_TESTED`，PR CI／部署／served-content 尚未驗證。

2026-10-01 Homepage Visual Fidelity v57：使用者並排比較實際首頁與核准 Mockup 後，確認 v56 的主要缺口不是色盤，而是 asset system／visual anchoring：Hero 手寫句失去場景錨點，理念／堅持以 CSS 幾何與簡化石頭代替語義圖像，另有第二套四步方法造成重複。v57 改用四張正式 decorative SVG，將 Hero note 錨定在桌面場景，移除重複方法 section，三入口 CTA 同權；新增 desktop/tablet/mobile CSS 規則。自動測試只能驗結構、overflow、焦點與資產存在，不能證明讀者覺得畫面自然；正式 target-novice observation 仍待後續 gate。\n\n2026-10-01 Homepage Mockup Fidelity v56：本輪依已核准 Mockup 進行高擬真 UI 對齊，保留 VT-COS 底盤品牌，收斂 Header、Hero、入口卡、四步循環、雙欄理念與 FAQ 的視覺節奏；不改 learner/evidence semantics。已新增 desktop／mobile CSS breakpoint 與可見 focus 既有基線，仍需 PR browser regression 與真人 target-novice observation 才能判斷實際理解、操作與可讀性。\n\n# 前端操作與視覺稽核

## 2026-10-01｜Mockup v1 功能與連結保全盤點

狀態：`REVIEW_CANDIDATE`，尚未批准實作。遠端 `main` 與本機 HEAD 均為 `ed4066f`（`learner-flow-v59`、candidate `2026-10-01-f`）；本機未提交工作樹另有 v59.2 Hero 修正與 `learner-flow-v60`／candidate `2026-10-01-h`。本節以實際 `index.html`、`app.js`、測試與 v60 截圖核對；使用者附圖「悟之一手：眼與死活課程」只作 `NON_NORMATIVE_REFERENCE`。既有工作樹保持原狀。

修正前提：原 v60 gap audit 把 S1–S5 的動態 mapping 評為 `KEEP`；逐條檢查 `renderLearningFlow()` 與 `Scheduler.chooseNext()` 後，發現「首答前先看提示」會顯示 S3，立即變形與七天流程試行的第一次批次會顯示 S4；到期複習又會重出同一 `problem.id`，卻被 S4「隔時新棋形」概括。這些是 `FAIL` 的 learner-facing state-label 邊界，不表示 first-response、scheduler 或 trial event 本身已改寫；後續設計須先釐清各分支的顯示名稱與入口條件。

### 附圖逐項判定

| 附圖元素 | 判定 | 現行功能與保全條件 |
|---|---|---|
| 品牌、首頁、核心課程、目前單元／課目 | `MODIFY` | 保留 `VT-COS` 首次品牌歸屬、課程首頁回到 root、Core `#core` 與動態目前課目；附圖文字不能寫死。 |
| 左側完整 S1–S5 rail | `MODIFY` | 現行由狀態 badge、短講與「查看學習流程」對話框表達；五步不是可任意跳轉的路由。手機宜用 compact indicator。 |
| 「今天到期 2」與「繼續學習」 | `MODIFY` | due／wrong 只在真實非零時顯示；無到期題時另可開始新間隔練習。沿用目前課程的繼續／返回行為。 |
| 「單元一覽」「我的紀錄」「設定」 | `DEFER` | 目前沒有這三個獨立頁面；功能分別位於單元 selector＋19 課目錄、目前紀錄與證據、進階設定與資料。若另開頁面需另立需求與路由，不能留下空連結。 |
| 題目、棋盤、作答、提示、回饋、下一題 | `KEEP` | 題目與棋盤由當前 item 產生；保留選項、數氣、連斷、落子、找點等作答方式，以及首答、重試、短講銜接與鍵盤操作。 |
| 附圖 C4 藍點／落點框 | `REMOVE` | 若標示正確落點，S2 首答前會洩漏答案；只有 item 契約已核准的中性 focus marker 可呈現。附圖棋形不能成為 scoring 來源。 |
| 右側「這一步要做什麼」「接下來」 | `MODIFY` | 沿用現有目前狀態摘要、作答後回饋與 next；S2 不預告正誤，非法操作仍留 S2，不能無條件宣稱進 S3。 |
| S2／S3／S4 動態標籤 | `MODIFY` | 首答前提示、立即變形、到期原題重出、個人流程試行首次批次都是已確認的反例；Mockup v2 需分別呈現「提示後仍待首答」「立即換形練習」「隔時原題再判」「第一次流程試行」，不得一概寫成答後修正或隔時新棋形。 |
| 「進階工具與資料」 | `KEEP` | 可收合為第二層，但必須保留下面列出的每一項操作與連結，不能只留說明文字。 |
| 底部四個編號說明 | `ANNOTATION_ONLY` | 這是設計註解，不放入 learner-facing 頁面。 |

### 不得遺漏的現有入口與目的地

| 範圍 | 實際入口／連結 | 後續驗收 |
|---|---|---|
| 課程位置與返回 | 課程首頁 root、Core `#core`、skip link `#learning-main`、目前題目、單元 selector、上一／下一單元、19 課動態目錄、短講重看、學習流程對話框 | 桌機與手機都可到達；選單元只查看目錄，明確點課名才切換目前課程；跨課短講與焦點返回保留。 |
| 今日任務與作答 | 到期複習、錯題重做、繼續課程、題幹／棋盤／答案選項、提示、分區回饋、下一題 | due／wrong 為 0 時隱藏相應入口；`count`／`connect`／`choice`／`move`／`spot` 各自仍可完成。 |
| 本階段延伸 | `stage-board-practice-link` 依單元指向 `live-game.html?size=5/7/9`；第 4 單元且非 external mode 才顯示 `classic-shapes.html` | 保留盤面尺寸參數與條件顯示；名型館及自由棋盤不升格正式評量。 |
| 工具第一層 | 間隔練習、局面應用、`live-game.html?size=9` 自由練習、`advanced.html` 進階訓練、示範 SGF、自有 9 路 SGF 匯入 | topbar 與 sidebar disclosure 仍可抵達工具；Advanced 的獨立匯出仍留在進階頁。 |
| 工具第二層 | 七天流程試行、固定／候選自適應排程選項、Markdown 學習摘要、Core＋實戰 JSON 備份；SGF 復盤內另有原判斷、確認紀錄與可攜 SGF 匯出 | 保留遮蔽、資料用途、失敗提示及匯出範圍；簡化卡片不能移除功能。 |
| 紀錄與診斷 | 課程完成量、目前紀錄與證據、實戰紀錄、可分析的 9×9 實戰機會、整合學習證據、錯誤修正 | 可維持收合；資料不足與讀取失敗不能顯示成能力結論。 |
| 首頁延伸（本輪不改 Landing） | 三個 Core 起點與 15 單元目錄、`advanced.html`、`live-game.html`、`history.html`、`math.html`、`global-go-observatory.html`、FAQ／研究來源／GitHub current-truth 連結 | Core 版面變動不得改斷首頁；learner 頁不新增 reviewer-only R1a 入口。 |

本機檢查 `index.html` 中 11 個非 HTTP、非 hash 的靜態 `href`，目標檔均存在；`app.js` 的 5／7／9 路動態連結仍須由後續瀏覽器回歸逐一檢查。路徑存在只證明本機檔案，不能替代點擊流程、外部網址可達性或真人理解。

首頁同頁錨點還有 `#site-introduction`、`#site-introduction-assessment`、`#learning-entry`、`#all-courses`、`#faq`；研究 disclosure 內另有 12 個外部連結：日本棋院兩處、British Go Association、Roediger／Butler／Cepeda 三篇研究、Online Go Server、Go Magic、Brilliant，以及 GitHub 的完成矩陣／正式教學閘門／研究查核。它們不是 Core 首答操作，但後續改版不得因搬動 Landing 容器而失聯；本輪未對外部站點做 HTTP 可達性驗證。

### 候選版面與實作邊界

`NON_NORMATIVE_DESIGN_CANDIDATE`：桌機順序為位置／課程導航（含條件式今日入口）→題目→棋盤→作答→回饋→下一題；右側只在需要時顯示簡短「現在」與答後重算指引，工具與紀錄收合。手機 375／320px 與 200% reflow 改成 compact 位置與 S-state→題目→棋盤→作答→分區回饋→下一步；課程目錄、今日任務、紀錄與工具仍有明確開啟入口。S2 首答前不顯示正確落點；S3 才顯示結果與修正。現行 375px 截圖的首屏導覽高度使題目接近折線，是候選版面要降低的摩擦，但尚無真人完成率證據。

S1 短講仍可重看；S2 保留未提示首答與曝光，首答前看提示應另顯示「提示後待作答」；S3 承接有效首答後的 correct／wrong／retry／eventual correction；S4 不得固定叫「隔時新棋形」：排程到期的同一題應叫「隔時原題再判」，實際有時間間隔且換了可比較局面才可叫「隔時換形再判」，立即變形與第一次流程試行另用較弱、準確的標籤；公開已曝光題也不變 formal unseen。S5 固定應用、自然實戰與 SGF 各保留獨立用途。非法落子、無到期／無錯題、儲存警告、資料 ERROR 與 masked evaluation 均沿用既有分區和資格，不能因版面乾淨而消失。

### S1–S5 顯示契約候選（不是新的 KC／證據分類）

| 狀態 | 用途與進入條件 | 可見／隱藏及可操作控制 | 主要動作、下一狀態與回饋權限 | 證據、焦點、朗讀與手機 |
|---|---|---|---|---|
| S1 看懂 | 新課短講與可手動重看的示範 | 只顯示教學棋盤、短講、關鍵詞及開始；未作答結果、正式資格隱藏 | 看完進 S2；示範不作題目評分 | `seenLessonIntros` 只抑制重開；dialog 標題取得焦點，關閉到題幹；手機示範單欄、步進控制可達。 |
| S2 自己判斷 | 一張題目已呈現，尚無有效首答；提示前與提示後需分別顯示 | 題幹、棋盤、作答、可請求提示可見；正確點、takeaway、正誤與下一題禁用或隱藏；masked 題禁用提示 | 第一個有效答案才進 S3；非法手仍留 S2；提示由 item 的 hint 提供，不能代替答案 | 保留 exposure、first response、`unhinted` 與 qualified 差異；題幹先聚焦，棋盤單一 Tab 停駐點；輔助技術朗讀任務與提示；手機題目在棋盤前。 |
| S3 修正重算 | 有效首答後的 correct／wrong；重試後仍屬此狀態 | 顯示 task contract 允許的結果及觀察線索；correct 隱藏 hint、啟用 next；wrong 保留 retry 與可用 hint | wrong 由規則／scoring 給具體結果，再試或看提示；correct 比較理由後進下一題；不推測心理根因 | first response 與 retry／eventual correction 分開；結果 `feedback` 朗讀，hint／illegal／storage 各用原區域；手機回饋緊接作答，next 隨後。 |
| S4 隔時再判（視題型補充原題／換形） | 確有時間間隔的到期原題，或可比較的延後換形；立即變形及首次 pilot 不具此條件 | 顯示具體任務、原題或換形、已知的實際間隔；pilot 整批完成前仍遮蔽正誤，不能展示 formal unseen 標記 | 作答後按當前 scheduled 或 pilot policy 繼續；UI 不改排程或 eligibility | 保留 selection reason、presentedAt、首答及版本；題幹聚焦，masked 只朗讀「首答已記錄」；手機先交代任務再到棋盤。 |
| S5 局面應用 | 明確啟動固定局面、自由對弈或 SGF 單點復盤 | 降低技能 cue，顯示各模式範圍；引擎估計與原棋譜著手不能預先當答案 | 固定應用依其題目契約回饋；實戰與 SGF 各維持自己的操作與說明 | practice／live／SGF stream 分開；焦點到題幹或各頁主標題；朗讀目前模式及限制；手機不把進階工具攤在作答前。 |

### 例外與負面狀態矩陣候選

| 狀態 | 顯示／隱藏、啟用／停用 | 主要／次要動作；權威與資料效果 | 焦點、朗讀與手機 |
|---|---|---|---|
| 未答、離題、中斷 | 保留任務；沒有正誤或虛構下一步成功 | 繼續或離開；呈現／中斷由現有 event policy 記錄，不刪分母 | 返回題幹；狀態可讀，手機不讓收合導覽遮題。 |
| 正確 | 顯示結果與理由，啟用 next，隱藏 hint | 下一題為主動作；score 由題目契約決定，首答獨立 | `feedback` 宣讀，next 可見且可達。 |
| 錯誤、重試、最終修正 | 顯示結果與可觀察線索，保留 retry 與必要時 hint；未完成前 next 停用 | 重試／看提示；重試不改寫第一次結果或 qualified opportunity | 結果與提示不同區域朗讀；手機保留原錯誤訊息。 |
| 非法落子 | 只顯示獨立互動訊息，正誤與 takeaway 隱藏 | 回棋盤重新選點；合法性由 rules 決定，不建立答錯事件 | 棋盤焦點不失，`interaction-feedback` 宣讀。 |
| 提示請求／已顯示 | 明確點擊才顯示 hint；顯示後按鈕停用，原 wrong 保留 | 再作答；提示事件獨立，首答若在提示後仍標 first response 但 `unhinted=false` | `hint-feedback` 宣讀，手機不覆蓋結果。 |
| 無可用提示 | 若未來 item 缺 hint，顯示不可用或停用按鈕；目前 Core 題庫是否存在此分支待實測 | 不建立虛假的 hint event；不得從空字串推測線索 | 保留題幹／棋盤操作，宣讀不可用原因。 |
| 流程試行遮蔽 | 先顯示用途說明，禁用 hint；整批結束前隱藏 correctness、takeaway 與結果棋盤差異 | 記首答後續批次；`Trial` 決定 masking，UI 不升 formal eligibility | 只朗讀「首答已記錄」，手機同等遮蔽。 |
| 到期複習／錯題重做 | 真實非零才顯示入口；兩者都可能是同一原題，但前者有到期間隔、後者是修正練習 | 依現有 scheduler／missed queue 選題；不以按鈕名稱改 evidence role | 進題後題幹聚焦；手機入口可由明確導覽開啟。 |
| 無到期／無錯題 | 對應入口隱藏；間隔練習仍可選新 practice 題 | 保持目前課程或開新練習；不製造零件數任務 | 不建立空按鈕；手機不占首屏。 |
| 儲存警告／資料 ERROR | `system-status` 或相應資料區顯示失敗；已產生的 answer feedback 保留 | 匯出可用資料或重試；storage／parser failure 不回報保存成功 | `role=alert` 或既有狀態區朗讀；手機仍能看到警告。 |
| 載入中／不可用 | Core 本機靜態啟動無獨立 loading 畫面；若資產／外部工具不可用，停用受影響動作並顯示原因 | 不把 provider／資料讀取失敗降成成功；不影響未受阻的 No-AI Core | 焦點留在可用控制或錯誤標題，手機不得只剩空白區塊。 |

上述是候選顯示契約；表中「無可用提示」及「載入中」未由本輪證實為既有可觸發 Core 狀態，標為 `UNKNOWN`，不能宣稱已有相應 UI。S3／S4 的四類已知錯標則是 `FAIL`，需要在實作時修正並加反證測試。

後續實作優先沿用 `index.html` DOM／ID、`styles.css` reflow、`app.js` handler、board renderer、feedback regions、course navigation、scheduler 與 storage。實作前記錄受影響 ID／`href`／handler 對照；完成後逐項驗上表、鍵盤、320／375px、200% reflow、首答遮蔽、no-due／no-wrong、hint／wrong／illegal／storage 分區，並加入首答前提示、立即變形、到期原題與首次流程試行的 S-state 反證。`index.html`、`styles.css`、`app.js` 是 formal candidate critical assets；實際改動時須由 `formal-teaching-candidate.cjs` 重算指紋、更新 candidate／gate／current-truth／served-content，舊真人證據不得沿用。若入口失聯或證據狀態誤報，回復該版面差異及 candidate 引用，保留歷史事件。本節稽核不改 critical assets、不重凍 candidate。

驗證：`app-state.test.cjs` 38／38 PASS、`release-manifest.test.cjs` 36／36 PASS、Edge `ui.test.cjs` PASS、靜態本機目標存在 PASS。真人可用性／真人無障礙 `NOT_TESTED`，正式教學／正式評量 `BLOCKED`，學習效果 `NOT_MEASURED`。

## 2026-10-01｜S1–S5 Learning Workspace gap audit（latest main `ed4066f`）

基準：遠端 `main`、本機 `HEAD` 與 `origin/main` 均為 `ed4066f`；handoff 的 `884b70b`／`learner-flow-v55` snapshot 已過期。稽核使用目前 `learner-flow-v59`、Edge file-URL runtime、1440×960、375×812、320 CSS px 與 200% text。工作樹另有尚未提交的 Hero 背景淡出 v59.2，只改 Landing decorative presentation，不改下列 Core 判定。

### Desktop

| 檢查 | 判定 | 實際依據與處理 |
|---|---|---|
| Landing → Core workspace | `KEEP` | Core CTA 進入 `#core` 並先開 S1 短講；Landing 與 workspace 仍分離。 |
| 目前課程與瀏覽單元 | `KEEP` | sidebar 保存目前課程；unit selector 只篩目錄，只有明確點 lesson 才切換內容。 |
| topbar／sidebar 位置資訊 | `UNKNOWN_REQUIRES_HUMAN` | sidebar、section header 各自提供持續位置與目前題目；尚無真人證據證明重複造成找題成本，不先刪除。 |
| 真正問題的層級 | `KEEP` | 題型／topic 降為 context；「問題」與實際 question 是題卡最高層級，且進題後 focus 到 question。 |
| Board 操作空間 | `KEEP` | 1440px 下棋盤是主要視覺物件，沒有被 evidence／tools 壓縮；工具與診斷預設收合。 |
| Response 與題目／棋盤關係 | `KEEP` | desktop 以 board 左、question＋answer 右呈現；回饋與下一步留在同一 answer card。 |
| 首答前 answer／takeaway leakage | `KEEP` | takeaway 在有效作答前 hidden；hint 需明確點擊；evaluation 禁用 hint 並遮蔽結果。 |
| Wrong／Hint／Illegal／Storage | `KEEP` | answer result、hint、interaction、system status 使用不同 live region；hint 不覆寫 wrong，非法操作不冒充內容錯答。 |
| Correct 後 CTA competition | `KEEP` | correct 後 hint 隱藏，主要下一步只留「下一題」。 |
| Advanced／evidence disclosure | `KEEP` | 第一層只有「目前紀錄與證據」摘要；診斷、課程層次與工具按需展開。 |
| due／wrong entry | `KEEP` | 只有非零時才顯示；due=0 不製造今日任務。 |

### Mobile / reflow

| 檢查 | 判定 | 實際依據與處理 |
|---|---|---|
| 375×812 主流程順序 | `KEEP` | CSS 與 runtime 都是目前位置 → question → board → answer／feedback → next；不是 desktop 欄位直接 stack。 |
| 320 CSS px / 200% text | `KEEP` | Edge regression 無 page／dialog horizontal overflow；Short Talk CTA 可到達。 |
| 棋盤操作空間 | `KEEP` | ≤760px card padding 收斂，board 保留方向鍵等效操作；roving tabindex 只有一個 Tab stop。 |
| focus 可見且不被遮住 | `KEEP` | mobile sidebar 改為非 sticky；開始、換題、due review 都把 focus 帶到 question，現有檢查未見 author-created overlay 完全遮蔽。 |
| 常用控制 target | `KEEP` | 主要按鈕、選項與課程控制維持約 44px；棋盤交叉點保留 keyboard equivalent。 |
| 工具展開位置 | `KEEP` | 工具從 topbar 明確開啟，啟動任務後自動關閉，沒有把 tools 留在主作答上方。 |
| 重複位置資訊負擔 | `UNKNOWN_REQUIRES_HUMAN` | mobile 首屏同時含 sidebar current lesson 與內容 header；目前沒有目標初學者資料可判定應刪哪一層。 |

### S1–S5 與動態狀態

| 狀態／契約 | 判定 | 實際依據與處理 |
|---|---|---|
| S1 看懂 | `KEEP` | 每課短講、board demo、最短 check 與術語 disclosure 已存在；看過不寫成 mastery。 |
| S2 自己判斷 | `KEEP` | question → board → response；首答前不顯示 answer／takeaway；first response 與 retry 分開。 |
| S3 修正重算 | `KEEP` | correct／wrong 後都進理由比較或重算；retry 不覆寫 first response。 |
| S4 隔時新棋形 | `REFINE` | 實際 label 仍寫「延後新題／隔日換形再測」，但 scheduler 有多個間隔；公開／已曝光流程另使用「未見」字樣。改為不承諾固定隔日、也不暗示 formal unseen 的自然語言。 |
| S5 局面應用 | `KEEP` | fixed application 與 SGF reconstruction 分開說明，不更新 mastery／scheduler／formal evaluation。 |
| fresh / returning / no due / due / wrong review | `KEEP` | runtime 與 regression 已分開處理，沒有 due=0 假任務，原題重做不冒充延後新棋形。 |
| wrong / correct / illegal / hint / storage warning | `KEEP` | 各自 region 與事件語義分離；storage failure 不偽裝保存成功。 |
| evaluation masking | `KEEP` | 提示禁用，整批完成前只顯示首答已記錄，不揭露正誤。 |
| malformed / UNKNOWN / ERROR | `KEEP` | storage、event、analysis 等失敗維持可辨識失敗，沒有 fallback 成成功。 |

### 本輪最小實作決定

只處理 S4 的已確認語義落差：把「隔日」改為不綁死間隔的「隔時／到期時」，把 learner-facing「未見」改為「不同／尚未練過／這批延後棋形」。內部 selection reason、scoring、scheduler、item、KC、event、storage、evidence taxonomy 與 formal evaluation 均不變。由於 `index.html`／`app.js` 屬 frozen critical learner surface，完成後必須 refreeze candidate，舊真人證據不得沿用。

審核日期：2026-09-20  
範圍：`index.html`、`styles.css`、`app.js` 的學習頁，以及 `r1-review.html` 的獨立審題頁。  
定位：此文件是個人離線版的設計稽核與下一輪修改規格；它不是使用者研究或無障礙合規宣告。

> 當前補遺：介面版本為 `learner-flow-v57`、棋盤練習頁為 `live-game-ui-v11`、儲存 schema 為 7、內容目錄版本為 5。主畫面只保留目前行動及「查看本課短講／查看學習流程」入口；每課短講只在第一次進入時自動開啟，之後仍可手動重看。`seenLessonIntros` 只控制 auto-display suppression，不是短講完成或 learner evidence；狀態會跨重新載入保存。Short Talk UX v2 以 `demoSteps` 作唯一棋盤示範來源，每課至少一個有效 state，多步只在相鄰棋盤／marker 有可見差異時成立；第 1 課先聚焦角上黑棋，再揭示兩口氣。step caption 單一來源、legend 只顯示該課使用的 marker，最後一步可「從頭再看」。320px 開啟 Modal 與 200% text 由 browser regression 檢查單欄、無水平 overflow 與 CTA 可到達；manual Close／Esc 回短講按鈕，manual Start／auto Esc 回問題。工具面板、跨課短講銜接、9×9 局部觀察、首頁今日到期、R1a reviewer-only 與 `personal-pilot-v3` 既有契約不變。R1a 77 題不再被當作短講內容審查；19 課另有獨立外部棋理回條。R1b 難度可比性仍未知。下段歷史快照與本補遺衝突時以本補遺及 `COMPLETION_MATRIX.md` 為準。

2026-09-29 證據概覽收斂（v55）：重新檢討 v54 後，保留 progressive disclosure，但修正「四張 compact cards 就等於 learner-centered」的前提。第一層改為單一「目前紀錄與證據」，只呈現資料不足、已有練習紀錄、資料累積中、仍需繼續觀察、已有延後與實戰紀錄或讀取失敗；activity 分母、可分析機會、首答錯誤與技能診斷統一下沉到「查看資料來源與診斷」。這是 presentation mapping，不改 evidence semantics；真人能否更快理解仍需目標讀者任務，不能由 DOM／CI 自證。

2026-09-29 進階設定資訊階層修正（v54）：依手機實際畫面與喬哈里視窗檢討，「進階設定與資料」原本把課程層次、實戰紀錄、實戰證據、整合證據、錯誤診斷與工具入口放在近似權重，形成長文字牆。v54 改為 **目前狀態 → 詳細資料（按需展開）→ 課程層次參考 → 工具與資料**。四張診斷卡在收合時只顯示可掃讀的狀態／數字，展開後仍保留完整分母、限制與未知狀態；沒有把診斷指標升格成 mastery。這是 learner-facing information hierarchy 的工程修正；真人是否更快找到重點、理解狀態與下一步仍待正式 usability gate。


2026-09-28 首頁配圖修正（v48）：實機截圖顯示 v47 把「配圖」做成了新的資訊架構，造成 Hero 右欄高度增加、步驟與棋盤被拆成兩張卡，且「怎樣才算真的學會」由 3 項擴成 4 項。v48 回到 v46 原本結構，只把棋盤圖嵌入既有 Hero 面板，三張課程階段卡各加一張小圖；學習證據恢復 3 項。這輪的成功條件是「圖有進來、結構沒被改寫」，不是重新設計首頁。正式 usability 仍待真人 gate。

2026-09-28 首頁棋盤視覺整合（v47）：依目前一頁式 reader-first 首頁與使用者明示需求，新增的不是裝飾照片，而是與教學內容直接相關的棋盤視覺。先前 AI 生成整頁 mockup 與棋盤圖只作視覺探索；正式版改用 inline SVG，避免把文字 rasterize，也避免生成模型把交叉點、棋子位置或關鍵手畫錯。Hero 以可核對的「中央白棋只剩最後一口氣」局面示意看懂→落子→回饋→換形；三個課程階段各加入一致縮圖；學習證據區由三格擴成四格，補上「仍能自己判斷」。桌面保留編輯式留白，≤900px Hero 圖與步驟並列，≤760px 回到單欄。這是 learner-facing visual hierarchy 改善，不改題目、scoring、scheduler、event 或 evaluation semantics；真人是否更快理解仍待 usability evidence。

2026-09-27 工具面板喬哈里複核（v45）：上一輪正確抓到字面量 `\n`、技術文案過重與操作層級可再收斂，但有三項需糾正。第一，`BRAND.md` 明定公開第一次出現產品名稱時要同時顯示 VT-COS，所以不是全面移除母品牌，而是保留第一次品牌歸屬、移除後續操作列的重複英文品牌字串。第二，「今日複習」不是單純 due-only action：現行 `Scheduler.chooseNext` 在沒有到期題時會選尚未呈現的新練習；因此工具按鈕改依 `dueCount` 動態顯示「複習今日到期（N）」／「開始間隔練習」，頂端 due CTA 仍只在真的到期時出現。第三，不採把「棋譜單點復盤」改成泛稱「棋譜復盤」，也不改掉「進階訓練」既有路徑名稱，避免 UI 文案超出已實作能力或和 v44 首頁資訊架構衝突。另將「局面小測驗」改為較中性的「局面應用練習」，並縮短自由棋盤、進階訓練與 SGF 說明；沒有更動 scoring、scheduler、Evidence Taxonomy、事件生命週期或 formal evaluation。這些仍只屬 learner-facing engineering correction，真人可用性待 candidate 凍結後的正式 gate。


2026-09-26 永久首頁學習樞紐補充（v44）：喬哈里複核上兩輪後，保留「一頁式、Core 主 CTA、研究透明度後移」；修正「回訪者應自動略過首頁」這個單課程假設。現在 main 已有獨立 `advanced.html`，若仍自動進 Core，回訪者會失去看見其他訓練路徑的穩定入口。v44 因此讓 root 永遠是悟之一手首頁；Core workspace 改用 `#core` 保留直接／重新載入路徑。首頁在 Hero 後新增 Core／Advanced 兩張學習入口卡：Core 仍是完全零基礎的主要路徑；Advanced 是次要入口，明示適用基礎與 practice-only 邊界。回訪 Core 使用者在首頁看見「繼續核心課程」與上次課名。依 W3C cognitive accessibility 的 clear purpose、site hierarchy、consistent navigation 原則，首頁／Core／Advanced 都提供清楚且角色一致的返回關係；這仍只是 engineering hypothesis，需真人任務確認是否降低選路與返回成本。

2026-09-26 一頁式首頁補充（v42）：依實際手機截圖與 reader-first review，v41 的文案方向已正確，但 landing 仍被 sidebar／topbar 的 Learning Workspace 框架包住，產品資訊架構搶在讀者任務之前。v42 因此把介紹狀態變成真正的單頁 Landing：sidebar、學習 topbar、題目與工具全部隱藏；頂端只留品牌與主 CTA。Hero 由抽象的「先會下」改為具體的「從 0 開始，先學氣與提子，再走進 9 路棋局」，首屏只保留 5→7→9 路與免帳號／本機進度；15／19／106 後移。評量收斂成首答、延後、未見新棋形三項，research／gate 狀態收進預設關閉的 details。此設計假說是降低首訪注意力競爭，不是 usability 已驗證；375px、sidebar/topbar 隱藏、單欄與無橫向溢出納入 browser regression。

2026-09-26 首頁敘事補充（v41）：以中／英／日／韓來源做第一輪 framing check。日本棋院與 BGA 的共同訊號是少講規則、盡快進小棋盤；OGS 直接把規則與技能拆成互動步驟；Go Magic 先回答適用程度與立即開始；韓國棋院近年的入門教材與教育遊戲重視降低初始門檻、活動／故事與可完成的對局；繁中課程頁常把目標對象、課程目標與從小棋盤到完整對局寫在同一頁；Brilliant 則把 learn-by-doing、feedback、撤除支架與 unfamiliar problem 的能力描述和「非正式診斷」界線並列。Johari 檢查上一輪草稿後，保留「設置用意／0 起步／評量／能力範圍／來源」五個問題，但修正兩個盲點：一是不把完整研究論述放在 hero 前阻塞開始；二是不再讓 learner-facing「初／中／高級」看起來像棋力認證。首頁因此採 progressive disclosure，第一次到訪顯示 orientation、回訪預設不重播；course layer 改成能力名稱並保留原課綱括註。競品與教育網站只支援資訊架構判斷，不支援本專案的棋理效度、usability 或 learning outcome。

2026-09-20 實作更新：P0 課程導覽、功能說明與首次使用流程，以及 P1 棋盤鍵盤操作與學習者流水線已完成。介面版本為 `learner-flow-v20`；原始匯出與閱讀版紀錄都帶有目前版號，新寫入的核心事件、固定應用結果與試行呈現／答案也帶有版號。既有資料沒有版號時標為改版前未知，跨版本的操作負擔不可合併判讀；題目、答案、評分和事件政策均未變更。2026-09-20 補充：流水線在新課、錯題、延後複習、固定局面與棋譜局部題都顯示「為什麼現在做」，避免把排程當成任意跳題；候選自適應明確標為試行，固定間隔為日常建議。後續檢核修正：重做原錯題只屬修正重算，無到期題的今日練習只屬獨立作答；兩者不能冒充延後新棋形證據。首次進頁與每課短講補上概念、示範、解題前檢查點；從氣、吃子、連接、斷點、禁著到兩眼的八個先備課，另可用「上一步／看下一步」逐步查看棋形變化與解說。其餘十一課目前仍只有文字概念示範，不能宣稱所有課都具相同視覺教學品質。側欄診斷卡與兩種匯出顯示可觀察任務錯誤、SCD 階段、再犯間隔及資料不足原因；它們不推定心理根因，也不把尚缺非 holdout T2 正式題的狀態誤寫為學習完成。匯入單一主線 9 路 SGF 後可在建立題目前選擇任意可落子的原局著手，保存候選手、預期應手、理由與不確定點；完成後才選填人工確認紀錄，預設不判定答案；閱讀版與原始匯出均含原局面座標與來源指紋，並可另匯出標準 SGF 交給 KaTrain 開啟。匯出功能只保留局面與復盤資料，不預先提供分析結論。產品工程順序見[開發與驗證流水線](EXECUTION_PIPELINE.md)，學習者路徑見[設計計畫第 3.1 節](DESIGN_PLAN.md#31-學習者從不會到會的介面流水線)。

2026-09-26 補充：依實際手機／桌面截圖，原本正誤只靠段落文字與文字色，結果狀態容易被解說與「下一題」按鈕淹沒。`learner-flow-v37` 將一般練習的作答結果改成獨立 banner：正確使用 ✓＋「答對了」，錯誤使用 ×＋「答錯，再看一次」，並配合邊框、背景與較大標題；不只依賴紅綠色。錯答仍直接在原棋盤重試，提示仍可用；個人 pilot／formal evaluation 的結果遮蔽邏輯不改。這是 feedback hierarchy 的工程修正，是否真的更快辨識仍待真人短任務觀察。

2026-09-26 題目卡補充：實際使用又發現「題目標題／真正問題／作答說明」雖然功能不同，但原版的標題最大，容易讓人誤以為標題才是要回答的句子。`learner-flow-v38` 因此固定為「本題重點 → 問題 → 作答方式」三層，並讓真正問題使用最大字級、最高字重與鍵盤焦點；本題重點降為 16px 的 context。這不改題目內容、scoring 或 evidence semantics；若未來進入真正的無提示 independent evaluation，仍需另外檢查「本題重點」是否洩漏技能線索。

2026-09-26 全頁權重補充：第二輪實際截圖顯示，v38 已解決「哪一句才是問題」，但仍有四層題卡 metadata、文字選擇題的大面積空白、輔助入口與選項相近的框線重量，以及首答前就出現「記住這句」。v39 因此再收斂：題型與重點併成一行、只保留「問題」標籤；作答方式移到選項下方；text-only choice 取消固定高度；輔助入口改成較低權重的文字連結；程式性 focus 不畫橙框，鍵盤 focus-visible 保留；「記住這句」只在非 evaluation 的第一次有效回答後揭露。一般課程右上位置改為「本課第 N / M 題」，與左側「課程完成 X / 106」分開語義。這些仍是 formative engineering correction，不構成正式 usability evidence。\n\n2026-09-26 術語／示意圖補充：依逐課稽核與外部教學頁面比較，learner-facing 短講加入按課折疊的關鍵詞定義，不另做一頁必背百科；示意圖固定四種標記語義，並把劫、真假眼、短讀、官子雙結果、棄／救比較、複盤原著位置補成多步對照。自由棋盤另直接解釋 Pass、死子、中國式面積、貼目、簡單劫與 SGF。這些改動處理「看圖／看到術語仍需猜」的可觀察 bottleneck，但是否真的提升理解仍待真人任務觀察。\n\n2026-09-26 進階路徑補充：Core 15 單元之後不再用「第 16 單元」延長同一線性導覽；新增獨立進階訓練入口，避免把核心完成誤讀為完成高級棋力，也避免進階多能力瓶頸被強迫排成單一路徑。進階頁三條 active track 皆明示 practice-only 與 evidence boundary；完整棋局／複盤仍標 planned。這是產品資訊架構與 Experience 擴充，尚未證明使用者會選對訓練線或因此進步。

2026-09-26 進階棋盤 Response 補充：進階頁新增獨立「多手讀棋實走」區，不以更多 choice 取代棋盤操作。第一版只放一個 5×5 倒撲 sequence；學習者每一步點棋盤，合法但不符合 contract 的落子會保留首答、盤面不推進，正確後才顯示固定對手應手並要求第二次落子。鍵盤可用方向鍵移動、Enter／Space 落子。這只證明多手 interaction 可操作，真人是否更能理解讀棋仍待觀察。

2026-09-26 進階多手讀棋 v3 補充：多手區從單一倒撲擴成三個可切換棋盤題（倒撲／枷／對殺），加入 sequence tab、下一題、重設與 responsive 修正。所有題先由 `advanced-sequence-contract.js` 在載入時完整重播；若任何內建手順、提子數、tracked-group 氣數或 branch QA 不一致，多手區直接停用。枷另驗另一個主要逃路；征子仍不顯示，因尚缺 forced-line／引征分支 oracle。這些改善的是內容維護與互動可信度，不等同真人理解或學習效果。

2026-09-26 進階多手讀棋 v4 補充：sequence selector 增加第 4 題征子。這不是把固定手順標成「征子已會」：內容 contract 逐手驗 tracked group 在黑手前／後的氣數，前六個白方自動應手都必須恰好等於唯一 liberty，最後黑手必須實際提八子；另用引征路線上的白色干擾子做 negative oracle，確認原 forced line 會失效。UI 仍只呈現 practice-only，完成後不顯示 mastery 或級位。\n\n2026-09-27 進階 sequence family v5 補充：多手 selector 從 4 題增為 8 題，每個手筋 family 兩題；tab 顯示 family 與分段數，桌面四欄、窄版單欄。第二題不是只換方向：倒撲改回提三子、枷改出口幾何、對殺改白方作答、征子改 8×8 與更長路線。這可降低單一座標／棋色／終點記憶對 practice 的支配，但「是否真的降低記題」仍需真人 first-response 比較。\n\n## 結論

目前可判定課程、單題回饋與首次作答流程可正常使用，**還不能判定整體操作舒服或順手**。已修正的首訪阻礙包括：按鈕沒有明確結果、手機先看到棋盤才看到題幹、換題後停在舊位置、選單直接跳課，以及七天檢查沒有事前說明。真人首次任務測試仍是可用性結論的必要證據。

修正前提：上一版把「沒有溢出、控制項可以操作」寫成「足以舒服地做初級題」。  
修正原因：技術可操作性沒有涵蓋尋找課程、理解功能及操作後回到題目的成本。  
修正後判斷：工程上已提供明確的首訪、選課、作答、換題與工具進出路徑；跨裝置的真人理解、誤觸與負擔仍未通過可用性驗證。

## 已核對的基線

| 項目 | 結果 | 證據或限制 |
|---|---|---|
| 桌面閱讀性 | 工程通過 | 題幹與核心學習／操作文字維持 16px 級；主要學習說明採約 1.6–1.7 行高，metadata 仍可使用 14px 級；棋盤與題幹並排。這是閱讀階層與重排契約，不代表真人閱讀負擔已驗證。 |
| 手機重排 | 通過 | Chrome 於 320px 寬度無頁面橫向溢出；版面改為單欄。 |
| 放大文字 | 通過 | Chrome 於 1280px 視窗把根字級放大至 32px 時，無頁面橫向溢出。這是重排檢查，不等於真人易讀性結論。 |
| 一般按鈕 | 通過 | 主要按鈕與選項按鈕最小高度為 44px／48px。 |
| 桌面課程導覽 | 工程通過 | 左欄固定於視窗，先選單元再選課程；選課後焦點與畫面移至課程標題。真人找課成本仍待觀察。 |
| 手機課程導覽 | 工程通過 | 以單元選單與目前單元的課程清單導覽，沒有長距離橫向課程列。真人找課成本仍待觀察。 |
| 功能可理解性 | 工程通過 | 頂端保留日常入口，工具面板為各功能提供用途、使用時機及結果說明。真人是否能正確理解仍待測。 |
| 棋盤輸入 | 工程通過 | 每次只有一個交叉點進入 Tab 順序；方向鍵逐點移動，Enter／Space 作答，並朗讀行列、空點或黑白棋狀態。真人鍵盤負擔仍待短任務觀察。 |
| 作答回饋 | 通過 | 回饋區為 `aria-live="polite"`；個人 pilot 不以棋盤樣式洩漏正誤，且明示題目已曝光、不能作正式成效證據。 |
| R1 審題草稿 | 通過 | 草稿可自動保存在本機並可匯出；正式回條與草稿明確分開。 |

上述瀏覽器驗證由 `node tests\\ui.test.cjs` 完成；桌面與 375px 手機截圖存於 `ui-audit-screenshots/`。測試可證明流程和版面沒有已知破損，不能單獨證明「所有人都順手」。

## 參考依據與採用方式

1. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) 將可感知、可操作、可理解與穩健列為可驗證的介面原則。此專案已採用可見焦點、狀態宣告、文字重排與棋盤方向鍵操作；尚未宣稱通過完整無障礙合規稽核。
2. [W3C 的最小目標尺寸說明](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) 以 24 × 24 CSS px 作為最低基準，並說明密集圖像目標應提供等效操作。手機窄版的棋盤落點接近這個下限，因此不應再縮小，且應以方向鍵作等效輸入。
3. [W3C 的重排說明](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) 要求 320 CSS px 寬度不因內容而需要雙向捲動。本頁已通過頁面重排檢查，但課程列仍需用任務測試確認後段單元是否容易找到；「允許橫向捲動」不能直接推成「容易使用」。
4. [Go Magic 的公開課程頁](https://gomagic.org/new-landing/) 採用「互動課程＋實作題＋技能樹／進度」的結構。此處只借鏡短教學後立刻練習、顯示進度的資訊架構；它不構成該產品的可用性或成效證明。

## 必要修改，依影響排序

### P0｜重做課程目錄的選擇路徑（已完成）

**發現：** 桌面版把 15 單元、19 課全部向下展開。到後段課程要把整頁滑到底，點選後頁面仍停在原本的垂直位置。手機版改成單一橫向列，只解決版面溢出，沒有解決如何快速找到第 10–15 單元。

**修改：**

- 桌面：左欄固定在視窗內；先顯示 15 個單元，僅展開目前單元的課程。提供上一單元／下一單元與「繼續上次課程」。
- 手機：以「選擇單元」控制項選 1–15 單元，下方只顯示該單元的課程；不以長距離橫向滑動作為主要選課方式。
- 共同：選擇單元只更新可選課程；明確點選課程後才把主內容捲到課程標題並移動焦點。不要把選單變更當成開課動作。

**成功條件：** 從任一課程前往第 15 單元，桌面與手機都不超過三次明確操作；選定後立刻看見課程標題與第一個可做動作；鍵盤與螢幕閱讀器能知道目前位置。

**驗證：** 目前有 15 項單元選項；畫面一次只顯示目前單元課程；Chrome 測試直接選第 15 單元並確認至少一課出現，且目前題目不變。明確選課後程式將主內容捲到課程標題並移動焦點；重開頁面保留上次課程。

### P0｜讓每個頂端功能說明用途與使用時機（已完成）

**歷史發現：** 「固定應用探測」「個人暫行試行」「固定間隔」「匯出原始事件」曾使用系統或研究語言。介面沒有回答「什麼時候用、按下後會發生什麼、是否影響學習進度」。目前已將暫行試行改為「七天流程試行」並補上已曝光與非正式驗收說明。

**修改：** 頂端只保留日常入口；其餘放入「工具與資料」面板。每個功能用白話標題加一行常駐說明，不把說明只藏在滑鼠提示中：

| 現有名稱 | 顯示名稱 | 必須說清楚的內容 |
|---|---|---|
| 開始間隔練習 | 今日複習 | 根據到期題目安排，不會跳過新課進度。 |
| 固定應用探測 | 局面小測驗 | 檢查能否在少提示局面找到學過的技巧；結果與正式實戰分開。 |
| 開始個人 pilot | 七天流程試行 | 使用舊 R1 已曝光題；無提示、完成整批才揭露答案，只供操作、返回與負擔檢查。 |
| 示範棋譜局部題／匯入 SGF | 棋譜練習 | 從內建或自己的 9 路棋譜重看局部落子。完成復盤後可下載含局面與筆記的 SGF，手動交給 KaTrain 分析；匯出不會自行判定好壞。 |
| 固定間隔 | 複習安排 | 目前採用的排程設定；切換前說明會影響之後選題。 |
| 匯出學習紀錄 | 閱讀版紀錄 | 產生人可閱讀的學習摘要。 |
| 匯出原始事件 | 備份完整資料 | 產生供檢查與重算的 JSON，通常不必每天使用。 |

**成功條件：** 第一次使用者能在不試按的情況下，分辨「日常學習、測驗、棋譜、設定、備份」五類用途；任何功能最多兩次操作可到達；觸控、鍵盤與滑鼠都能讀到相同說明。

**驗證：** 頂端保留「開始／繼續」「複習錯題」「工具與資料」三個入口；工具面板有七個功能的可見說明，Chrome 測試確認說明均存在。真人首次任務測試仍是此成功條件的必要證據。

### P0｜讓第一次作答形成完整循環（已完成工程修正）

**發現：** 首頁已經顯示第一課，但「開始第一課」沒有明顯內容變化；手機先呈現棋盤、再呈現題幹；作答一按即提交；換題後焦點仍停在舊按鈕位置。進階工具啟動後，展開的工具面板也會遮住結果。

**修改：**

- 第一次使用顯示「先完成第一題」說明，交代短講、作答、錯題複習與本機保存；不把尚未量測的完成時間寫成事實。
- 題幹與「立即作答」規則先於棋盤，棋盤後才顯示作答與回饋；桌面仍以棋盤左、題幹與作答右側排列。
- 開始、換題、錯題複習與進入外部工具題後，都將焦點與畫面帶到新題名稱；題目標題可供程式聚焦。
- 單元選單只篩選課程，不自動改變目前題目；使用者必須明確點選課名。
- 工具題啟動後關閉工具面板；七天檢查改為先顯示 4 題、首答、回饋延後與證據限制，再由使用者確認開始。
- 首訪時隱藏「複習錯題 0」，並補停用控制項外觀與減少動態效果支援。

**驗證：** Chrome UI 測試確認首次說明可見、題幹位於棋盤前、開始後題名取得焦點、選擇第 15 單元不改變目前題目、工具啟動後面板關閉、七天檢查先開啟確認視窗、換題後焦點移到新題名；原有題庫、匯出、排程、試行與 R1 頁面測試也通過。這些是工程證據，不代表初學者已覺得順手。

### P1｜建立單一「今天練習」入口

**歷史發現：** 頂端曾同時有複習錯題、間隔練習、固定應用探測、個人試行、示範棋譜、匯入、策略切換與兩種匯出。它們的風險和使用頻率不同，卻被放在同一層；目前 R1a 已移出學習者工具選單，七天流程試行維持次要入口。

**修改：** 首頁主動顯示「繼續上次課程」；有到期題時另顯示「今日複習」，有錯題時顯示數量。個人 pilot 永久顯示已曝光與非正式驗收邊界；R1a 不進入學習者工具選單。

**成功條件：** 初次進頁時，不看說明也能在 10 秒內辨識下一個應按的按鈕；試行與匯出仍可在兩次操作內找到。

### P1｜顯示從不會到會的學習流水線（已完成工程修正）

**發現：** 原介面只顯示完成題數與課程目錄，沒有區分「看過、當下答對、修正、延後保留、局面應用」，容易把做完題目理解成已學會。

**修改：** 側欄顯示初級 1–5、中級 6–10、高級 11–15；題目前顯示五步學習流程，並依作答狀態動態顯示現在與下一步。「學習進度」改稱「課程完成」，介面明示一次答對不等於學會。

**驗證：** Chrome 測試確認首次進入位於「先看懂」、開始後進入「自己作答」、作答後進入「修正重算」、錯題原題重做仍標為「修正重算」、到期／未見變形與七天檢查才進入「延後新題」、無到期題的今日練習保留為「自己作答」、局面與棋譜練習進入「局面應用」；320px 與放大文字仍無橫向溢出。真人能否理解五步差異仍待短任務觀察。

### P1｜把棋盤改為 roving tabindex（游標式焦點，已完成工程修正）

**修正前發現：** 每一個空交叉點都是 Tab 停駐點。鍵盤使用者若想從左上移到中間，可能需要按數十次 Tab。

**修改：** 棋盤每次只保留一個 `tabindex="0"` 落點；方向鍵在相鄰交叉點移動焦點，Enter／Space 落子。畫面顯示焦點位置，並提供「目前第 X 行、第 Y 列」的朗讀標籤。滑鼠與觸控行為不變。

**成功條件：** 從任一落點到相鄰點只需一個方向鍵；不需要穿越 81 個 Tab 點；所有既有滑鼠操作和題目評分測試仍通過。

**驗證：** 棋盤固定產生 81 個可導覽交叉點，但只有目前位置為 `tabindex="0"`；Chrome 測試從中央白棋向右、向下各移動一格，確認焦點、行列與棋子狀態朗讀標籤更新，再以 Enter 送出作答。原有滑鼠、觸控等效點選、題目評分與驗收遮蔽測試一併保留。

### P2｜將策略切換改成可理解的設定

**發現：** 「固定間隔」看起來像一個開始按鈕，實際上會切換策略；切換後才變成「候選自適應」，意圖不夠明確。

**修改：** 移進「工具與資料」，寫為「複習安排（試行）：固定間隔／候選自適應」，以單選控制項與一行影響說明呈現；固定間隔列為日常建議，明說兩者尚未證明較能提升棋力，並保留目前策略版本到匯出資料。

**成功條件：** 使用者在切換前能看見目前方案、切換後的方案與資料可比性的提示。

### P2｜保留手機棋盤操作空間

**發現：** 375px 畫面可以閱讀，但棋盤被卡片內距壓縮；最窄時單一落點接近最小點擊尺寸。

**修改：** 在 380px 以下減少棋盤卡片內距，讓棋盤佔滿內容寬度；不可把棋盤本體再縮小。完成後以 320px 寬度量測可點擊落點與相鄰間距。

**成功條件：** 320px 寬度下，落點實體目標至少符合 W3C 24px 基準或具備方向鍵等效操作；無橫向溢出。

### P3｜R1 審題頁補可回到目前卡片的定位

**發現：** 完整題庫需要 77 張審查卡；離開後回來若只靠瀏覽器捲動找位置，負擔更高，黏性工具列也需要避免遮住鍵盤焦點。

**修改：** 顯示「已完成／待審」篩選與目前卡片導覽；為卡片控制項加入適當 `scroll-margin-top`。

**成功條件：** 重新開頁後能一鍵跳到第一張待審卡；以鍵盤聚焦的欄位不會被工具列遮住。

**實作結果：** 篩選提供全部、待審與已完成三種檢視；完成數採正式回條規則，只有選妥結果、必要落子與必要理由才算完成。「下一張待審」會切至待審檢視、捲到下一張未完成卡並聚焦結果欄位。Chrome 回歸已驗證 1 題完成時顯示 76 題待審、兩種篩選數量正確、焦點不留在已完成卡。

### P3｜首頁只在需要時提高到期複習優先級

**發現：** 「今日複習」原本只藏在工具選單；使用者無法在首頁判斷今天是否真的有到期題，也可能把沒有到期題時安排的新練習誤認成延後複習。

**修改：** 只有非 holdout 題的 `dueAt` 已到時，頂端才顯示「今日到期」與題數；點擊後仍使用原排程器並保存 `scheduled_review_due`。沒有到期題時入口隱藏，工具選單仍保留可主動開啟的新練習。

**驗證：** 狀態測試核對無到期題時隱藏、有一題到期時顯示並可進入間隔練習；Chrome 回歸核對按鈕標籤、數量、焦點、選題理由，以及 320px 與 200% 字體放大無橫向溢出。這些是工程證據，不能替代真人對優先順序的理解測試。

## 不建議現在做的事

- 不把介面改成大型遊戲化儀表板。這會增加注意力競爭，沒有直接支持初級讀棋練習的必要。
- 不根據單一人的直覺評價更換色系或字體。現有視覺問題不在風格，而在操作優先順序與鍵盤路徑。
- 不把 R2 暫行試行資料拿來證明 UI 有效。它目前只能觀察個人操作、資料完整性與負擔。

## 最小真人檢核

在 R2 的基線與七天追蹤完成後，用三次短時段檢查，不增加額外個資蒐集：

1. **首次進入：** 從首頁開始一題；請使用者說明各頂端功能可能做什麼，再記錄實際誤解，不先教答案。
2. **跨單元選課：** 從第 1 單元前往第 15 單元，再回第 3 單元；記錄操作次數、捲動距離、是否選錯，以及選後是否立刻看見題目。
3. **隔天返回：** 找到應做的間隔題或錯題；記錄完成時間與是否需要翻找。
4. **鍵盤／手機：** 在一題棋盤上用鍵盤或手機完成一次落子；記錄誤觸、焦點迷失或需要放大的情形。

每次只寫「卡在哪、如何自行解決、下次是否還會卡」三項。三次都無卡點只能支持這位使用者在這台裝置上的可用性；若反覆出現同類卡點，才實作對應的 P1／P2 修改並重跑 UI 測試。

## 重新評估條件

以下任一情況發生後，重排優先順序：

- 個人試行顯示使用者常直接開啟試行或匯出而非日常練習；
- 手機或鍵盤出現誤觸、焦點迷失、放大後看不到關鍵操作；
- 增加真人使用者時，首次任務成功率不穩定；
- 若未來建立獨立保管的新題、外部 R1a 與 R1b 資料，另建正式評量流程；現行個人 pilot 不得原地升格。

## 2026-09-23 Change note｜真人 usability 證據改為逐位保存

- **問題：** 舊 formal-teaching-evidence-v1 只保存 participantCount 與五項任務的彙總布林值；理論上可能由不同參與者各完成不同任務，卻被彙總成「三位都完成五項」，造成 denominator／completion 語義無法稽核。
- **修正：** 保留既有彙總欄位以便閱讀，但正式 gate 現在額外要求至少三筆唯一匿名 participantCode；每位都必須是 target novice、逐項完成五個 critical tasks、沒有 blocking issue，且有非空 evidence reference。participantCount 必須與逐位紀錄數一致。
- **反證：** 任一參與者漏做一項、逐位紀錄少於宣稱人數、或 participant code 重複，都必須 BLOCKED；不得由 aggregate true 掩蓋。
- **隱私：** 只使用匿名 code 與證據引用，不在 repo 保存姓名、聯絡資料或其他個資。
- **證據邊界：** 此修改只提高真人證據的可稽核性，不產生任何真人證據；目前 usability／accessibility 狀態仍是 NOT_TESTED／BLOCKED。
- **Migration／rollback：** 尚無正式真人證據檔，因此沒有歷史真人資料需要升格；舊格式檔會 fail closed，需依原始觀察補成逐位紀錄，不能猜測補值。若 rollback，恢復舊 verifier，但會重新暴露彙總證據缺口。


### 2026-09-24 閱讀階層補充

本輪沒有把長文網站的 680px 單欄規則直接套到圍棋作答介面，也沒有將整站統一放大到 18px。保留「棋盤＋題目／回饋」的任務布局，只針對會改變學習者下一步行動的文字提高可讀性；版本、metadata、進階診斷仍維持較次要的視覺層級。這是 engineering hypothesis：預期降低閱讀負擔，但是否真的減少誤讀、誤觸或焦點流失，仍須依 `EXECUTION_PIPELINE.md` 的三位初學者短任務與真人無障礙 spot check 驗證。


### 2026-09-24 CJK 互動介面補充

本輪將長文設計規範拆成「可直接採用」與「需轉譯」兩類。直接採用：繁中語系與字型 fallback、visible keyboard focus、20px 手機內容留白、44px 常用控制、清楚連結樣式、安全換行。需轉譯：長文 680px／17px 模型不直接覆蓋棋盤＋題目介面，而是把教學說明限制在約 42em，保留桌面棋盤與題目並排、手機單欄重排。Dark Mode、TOC、Hero、Newsletter 等內容網站元件目前沒有已觀察 learning-loop bottleneck，因此不加入。


## 2026-09-27｜History Explore v2 accessibility / browser audit

- 初版 `history.html` 雖有 static contract，但未被 `tests/ui.test.cjs` 實際載入；主站 Windows UI 全綠不能證明歷史頁在真實瀏覽器無 overflow。
- 審核發現四組小字對比不足一般文字 4.5:1：品牌副標約 3.87、題號約 4.06、比較表頭約 4.41、頁尾約 3.78。
- v2 將上述文字改為較深綠色，並加入 browser regression：桌面 1280px 與 mobile 375px 都要求 `scrollWidth <= innerWidth + 1`，mobile 的來源、研究前沿改為單欄，CTA 改 column。
- `prefers-reduced-motion: reduce` 時取消 smooth scrolling；static contract 直接驗證此 fallback，避免把捲動動畫強加給要求減少動效的使用者。
- 歷史頁維持零 JavaScript runtime；browser test 同時檢查四個 question block、六種 evidence label 與來源最後查核日期。
- 這些自動檢查只能證明指定 reflow／contrast contract；screen reader 實際閱讀順序、認知負荷與歷史標籤是否易懂仍需真人 observation。


## 2026-09-27｜History Explore v3 Johari accessibility follow-up

- v2「四組 contrast 修正」是必要但不充分：它只證明已知失敗點，沒有覆蓋其他小字與 evidence badge。v3 browser regression 會計算 computed color 與祖先背景合成後的實際 contrast，所有指定 helper／badge 均需 ≥ 4.5。
- 接近門檻的 kicker／source helper 再提高 safety margin；static contract 同時覆蓋 19 組前景／背景組合。
- 375px 除了 reflow／overflow，現在另外要求 History CTA 的 `advanced.html` 返回入口實際可見，避免 ≤420px header 隱藏 Advanced 後只剩間接回首頁。
- `prefers-reduced-motion` 不只檢查 CSS 字串，browser 會模擬 reduce media feature 並驗 computed `scrollBehavior === "auto"`。
- 這些仍不是 WCAG 全站合規聲明；focus order、screen reader 語意與認知負荷仍需真人 spot check。


### 2026-09-27｜History v3 deployment-validation correction

獨立 `workflow_run` 版本的 Pages smoke 在 deployment #380 後未觸發，因此不算可運作的驗收。served-content check 改由既有 `verify.yml` 在 main push、且本地 Node／Sabaki／Windows UI 全部 PASS 後執行；它直接輪詢正式 Pages URL。這只修正 delivery verification，不改任何 accessibility／usability 結論。


2026-09-28 v49 回溯修正：本輪先回看前面設計決策與實際生成素材，確認錯誤不在 CSS 微調，而在「使用了不同素材」。v49 因此不再重畫棋盤，而是直接使用已確認的原生成圖：Hero 保留完整棋盤＋四步流程構圖，三階段各用原縮圖，三項 assessment 各用首次／延後／新棋形圖；不新增第四項。為避免生成圖越權成棋理真值，Hero 的未驗證手寫提子句裁除，其他圖以 illustration 身分呈現。真人是否更易理解仍待 usability evidence。


2026-09-28 v50 mockup alignment：使用者明確指定先前整頁 mockup 為首頁版面基準。此次不再把 mockup 當「風格參考」而保留另一套 IA，而是對齊其 desktop hierarchy：header 導覽、Hero 大圖、三階段入口、四格 learning cycle、四張研究動作卡與下方雙欄。為保持 evidence authority，第 4 格只標示 outcome summary；實際 learner evidence 仍是 first response、delayed retrieval 與 new-shape/transfer 三條既有鏈。375px 仍須保持單欄與無水平溢出；是否更容易讓真人選對入口仍待 usability evidence。


## 2026-09-28｜M1 作答閉環修正（v52）

M1 不重畫整個 workspace；保留桌面棋盤左／問題與作答右，以及窄版問題→棋盤→作答的既有骨架。修正可觀察的 feedback collision：答案結果、提示、棋盤非法操作與本機儲存警告改為不同 region。Wrong 後 Hint 不再抹掉結果；Correct 後 Hint 不再與 Next 競爭；非法操作不冒充 answer incorrect；storage warning 不覆蓋答案結果。這些只屬工程與資訊層級修正，是否讓 375px 初學者更快察覺結果仍需真人 formative observation／正式 usability gate。


## 2026-09-28｜M2 Learning Workspace / Course Navigation

- `learner-flow-v53` 將目前課程位置、單元瀏覽、今日入口與進階工具分層；桌面保留 sidebar，375px 將課程目錄收合到「課程與單元」。
- 選擇 Unit 只改變瀏覽中的課程目錄，不改目前 lesson、題目或 learner event；只有點選實際 lesson 才切換學習內容。
- 到期複習／錯題只有非零時才出現在 sidebar 的「今天」區塊；不以 0 題製造假的今日任務。
- 此變更不修改 scoring、first-response/retry、scheduler policy、storage/event schema、evidence taxonomy 或 formal evaluation masking。工程測試不等於真人 usability 證據。


## 2026-09-28｜M3 Return / Review / Progress conformance

- M3 不新增「我的學習」頁、不建立第二套進度 source of truth；沿用 Core workspace 的活動完成量、到期複習與錯題入口。
- 最新 conformance audit 確認：375px 下即使「課程與單元」保持收合，真正到期的 `今日到期` 仍在 topbar 第一層可見；Core 繼續入口也仍可見，且頁面不得產生水平溢出。
- 無到期／無錯題時維持既有 fail-closed 行為，不顯示假的「今天」任務；活動完成量只表示完成題數，不升格為 mastery。
- 本輪只增加 regression coverage 與文件；不修改 learner-facing critical asset、scoring、scheduler、first-response/retry、event schema、evidence taxonomy 或 formal evaluation，因此不重新凍結 formal candidate。
- 證據邊界：這只證明既有 Return / Review / Progress 介面契約在 desktop/mobile 可被自動驗證；真人是否更容易決定「今天先做什麼」仍為 NOT_TESTED。


## 2026-09-28｜M4 Landing / Homepage conformance

- 首頁 Hero 恢復引用已指定且實際存在的 `assets/homepage/hero.png`；先前 DOM 指向不存在的 `hero.webp`，同時 candidate 卻追蹤 PNG，造成 learner-facing surface 與 fingerprint authority 不一致，現已修正。
- 「怎樣才算真的學會」只保留三種 learner evidence：第一次自己作答、延後再做、未見新棋形；「仍能自己判斷」改為三項之後的非編號總結句，不再視覺上形成第四 evidence。
- 刪除不再使用的 `assets/homepage/evidence-still-judge.webp`，formal candidate asset set 升至 v6，candidate 更新為 `formal-teaching-candidate-2026-09-28-n`，fingerprint `fnv1a32-js16-8479d7d0`。
- Core 主 CTA、Core 1–15 三階段入口、Advanced 獨立 practice-only 路線、研究來源預設收合等既有 IA 不變；不修改 scoring、scheduler、first response／retry、event schema、KC、evidence taxonomy、learner state 或 formal evaluation。
- 證據邊界：M4 只修正首頁語義／資產一致性與工程契約；真人 usability 仍 `NOT_TESTED`，正式教學仍 `BLOCKED`，學習成效仍 `NOT_MEASURED`。

## 2026-09-30｜Short Talk UX v2 refresh

- **P0 已修：** short-talk mobile override 放在 base rule 後面，避免 CSS cascade 把單欄重新覆蓋成 desktop 兩欄；320px Modal-open 與 200% text 都有 browser negative regression。
- **視覺層級：** 「核心概念 → 棋盤＋目前 step → 進題前一句 → 關鍵詞 → primary CTA」是主路徑。240px 級棋盤是可回復 presentation hypothesis，不是已驗證最佳尺寸。
- **語義：** auto intro 的「先跳過」與 manual rewatch 的「關閉」分開；`seenLessonIntros` 只表示自動顯示已處理。重看由 step 1 開始，one-step demo 不顯示無意義導航。
- **證據邊界：** 自動測試只能證明 layout、focus、state 與 visual delta contract。短講棋理另需 19 課外部 review；初學者理解、accessibility 與 learning effect 仍需真人證據。

### 2026-09-30｜200% text post-merge regression

- main run #868 的真實 Windows browser regression 發現 Short Talk Modal 在 200% text 下有水平 overflow。
- 原因是 `.lesson-intro-dialog .teaching-card>div{width:100%}` 與同一 flex row 的 icon／gap 疊加，內層實際寬度超過容器；不是 responsive media-query 本身回歸。
- 修正只把該內容 wrapper 改成可收縮 flex item：`min-width:0; flex:1 1 auto; width:auto`。既有 320px one-column 與 200% text browser assertion 保留，不降低驗收條件。
- 因 `styles.css` 屬 formal candidate critical asset，candidate 重新凍結為 `formal-teaching-candidate-2026-09-30-c`／`fnv1a32-js16-15b4184a`；19 課 lesson-content fingerprint 不變。

## 2026-10-05｜Award Presentation v2（full formal-root integration）

修正前提：prototype 品質不能由候選資料夾的存在推定；必須在使用者實際打開的正式根目錄頁面呈現並接受瀏覽器檢查。本輪把首頁、History、Math、Global、Advanced、Live 與 Classic 視為一個網站：統一導覽、色彩、字體角色、focus、44px 控制、reduced-motion 與 CJK 換行，同時保留各任務的資訊架構。首頁用合成棋盤預覽示範「先作答、再比較」，不寫入 learner state；Explore 同屏呈現主張與證據邊界；Advanced／Live／Classic 保留原功能 authority。桌機優先減少不必要移動，但內容放不下時使用自然頁面捲動，不隱藏資訊、不建立狹窄巢狀捲軸。正式 candidate 為 `formal-teaching-candidate-2026-10-05-b`／`fnv1a32-js16-a4f99e81`（asset set v12）。「Award Intent」只代表 craft benchmark；未經外部評審不得聲稱獲獎，工程截圖亦不等於真人 usability、accessibility conformance 或 learning effect。
