# Research Record｜Cross-Language Go Concepts Pilot v1

- researchId: `cross-language-go-concepts-pilot-v1`
- question: 中文、日文、韓文與英文圍棋資料對「厚、勢、味、先手、定石」是否只是不同翻譯，還是存在會改變教學解釋的穩定概念邊界差異？
- decisionUse: 先服務既有 Core／Advanced 術語內容 QA；只有通過本檔 Publication Gate 才重新評估是否值得形成獨立 Explore 內容。
- scope: 第一輪維持五個 concept anchors；優先棋院／棋協／專業教材與可追溯詞彙資料。語言數不是證據數，也不要求四語對稱補齊。
- learner_runtime_authority: none
- accessDate: 2026-09-30
- snapshotVersion: 3
- promotion_status: `SOURCE_VERIFIED_PARTIAL / NOT_YET_TEACHING_CANDIDATE`
- publication_status: `HOLD_NO_CONCEPTS_PAGE`

## 1. Method｜先固定現象，再找原語

先建立 Concept Anchor 的操作定義與排除邊界，再從實際原語來源發現 term。不得把翻譯詞預設成 Equivalent；暫用：

- Equivalent
- Overlap
- Broader
- Narrower
- Non-equivalent
- Unknown

只有實際用法、棋形範圍與相鄰概念足夠時才判 relation。第一輪目標是找**會改變教學解釋的差異**，不是收集最多術語。

### 1.1 不要求四語對稱

四種語言可以出現不同深度與不同結果：

- 某語有 established technical term，另一語只有描述性短語；
- 英文可直接借用日語 term，而不是先存在本土一對一概念；
- 某語資料只有 usage evidence，不足以形成 formal definition；
- 沒有足夠資料時保留 Unknown，不以低品質來源補齊表格。

「四欄都有詞」不是完成條件；概念關係可不對稱。

### 1.2 Evidence roles

每條來源先標其能提供哪一種 evidence role，避免把不同證據偷換：

| evidence role | 能支持 | 不能自動支持 |
|---|---|---|
| definition | 某來源如何明確界定術語 | 其他語言／機構也採相同邊界 |
| usage | 專業棋評或教材確實這樣使用 | 該詞的必要／充分條件 |
| curriculum classification | 某機構把概念作為獨立教學主題 | 整個語言社群或民族的固定思維 |
| borrowing / transmission | 某語直接保留外語術語或既有翻譯史 | 借入概念較正確或教學更有效 |
| historical change | 同一術語／定石在不同年代被重新評價 | 新說法是唯一棋理真理 |

### 1.3 Source ecosystem / locale

本研究比較的是**語言與來源生態**，不是四個單一國家：

- 中文至少區分 `zh-TW` 與 `zh-CN` 的來源角色；不得用單一中國大陸來源代表所有華語圍棋。
- 英文標為 Anglophone Go usage；BGA／AGA 等不是「美國／英國民族思維」代理。
- 日本棋院、韓國棋院、海峰棋院等資料只證明其自身公開教材／棋評如何分類或使用。
- 原語與借詞來源須另外記錄，不把相同詞形視為獨立概念生成。

## 2. Language–Source Map v3

| locale / ecosystem | source | evidence role | 本輪用途 | 不支持 |
|---|---|---|---|---|
| ja-JP | 日本棋院｜コース別技術指導カリキュラム | curriculum classification | 核對厚み／薄み、先手／後手、味／味消し、サバキ分階段教學 | 日本棋手普遍有固定認知風格 |
| ja-JP | 日本棋院｜囲碁の基本：対局のルール・流れ | definition / usage | 核對「先手」亦可指黑方先下的 turn-order 義 | 技術 sente 與 turn-order 完全同義 |
| en / BGA | Meanings of some Japanese Go Terms | borrowing + glossary definition | 核對 aji、atsumi、sente、joseki、tesuji 及大量日語借詞 | 英語無法理解未借詞的棋理 |
| en / BGA | British Go Journal No. 9 (1969) glossary | historical glossary / boundary | 核對 sente 的相對性、joseki 的局部性與全局條件 | 1969 用法永久固定現代英語 |
| ko-KR | 韓國棋院｜행마／맥점相關教材 | curriculum classification | 證明韓國教材存在自身技術分類；`맥` 暫不升為本輪第六 anchor | `맥 = 手筋 = tesuji` 的完全等價 |
| zh-TW | 海峰棋院職業棋評／教學內容 | professional usage | 核對「厚勢」「定石」「手筋」等為臺灣繁中實際棋語 | 形式化定義或所有華語圈的完整邊界 |
| zh-CN | 中國圍棋協會／專業出版與棋評候選 | targeted verification | 只在高價值未知需要時補厚／勢／味／定式的直接定義或用例 | 用搜尋摘要補成華語 canonical definition |

## 3. Anchor 1｜厚／thickness

**操作定義候選：** 已經較安定、難以被直接攻擊，且能對周圍戰鬥或發展提供支持作用的棋形／力量。排除單純「棋子很多」或「已圍成實地」。

| language / locale | term | relation | evidence role | current evidence |
|---|---|---|---|---|
| 中文 / zh-TW | 厚／厚勢 | Unknown / Overlap candidate | usage | 臺灣職業棋評自然使用「厚勢」；尚不足以固定與外勢／勢力的 formal boundary |
| 中文 / zh-CN | 厚／厚勢 | Unknown | targeted verification | 仍需直接、可操作的專業教材定義 |
| 日本語 | 厚み（atsumi） | Anchor candidate | curriculum classification | 日本棋院把「厚みと模様」「厚み、薄み」列為獨立技術主題 |
| 한국어 | 두터움／두터운（候選） | Unknown | usage / targeted verification | 可描述厚實棋形；不得與 `세력` 合併成同一 term |
| English | thickness / atsumi | Strong overlap with Japanese anchor | borrowing + glossary definition | BGA 將 atsumi 解釋為面向中央或邊線的強棋形 |

**已修正邊界：** `厚` 與 `勢` 相關但不能合併。能說「厚實的勢力」本身就表示「厚」可描述某種棋形／力量品質，而「勢」另描述其較廣域的作用或框架。

**未知：** 中文「厚勢」是否在部分語境把日文 `厚み` 與 `勢力／模様` 的部分範圍壓進同一常用表達；目前不建立 canonical cross-language equivalence。

## 4. Anchor 2｜勢／influence / framework

**操作定義候選：** 尚未完全兌現為實地，但能對較大區域的後續落子與戰鬥施加影響的空間性能力。排除已確定實地。

| language / locale | term | relation | evidence role | current evidence |
|---|---|---|---|---|
| 中文 | 勢／外勢／勢力 | Unknown set | usage / targeted verification | 三詞常相鄰使用，但目前不把它們視為單一精確 term |
| 日本語 | 勢力 | Overlap candidate | usage | 指向力量／影響，但仍需和厚み、模様分開 |
| 日本語 | 模様（moyo） | Non-equivalent adjacent concept | curriculum classification | 日本棋院「厚みと模様」並列，顯示兩者不是同一概念 |
| 한국어 | 세력 | Overlap candidate / Unknown boundary | targeted verification | 與實利常形成對照，但與厚／두터움的 exact relation 未定 |
| English | influence | Overlap candidate | translation / usage | 常描述較廣域力量 |
| English | moyo / framework | Non-equivalent adjacent concept | borrowing + glossary definition | BGA 定義 moyo 為 potential territory／large territorial framework |

**高決策價值問題：** 「勢」很可能不是一個足以覆蓋全部語境的單一 cross-language anchor；若後續來源穩定顯示 `influence` 與 `moyo/framework` 必須分離，拆成兩個 anchors，而不是把四語硬塞同一列。

## 5. Anchor 3｜味／aji

**操作定義候選：** 局面中尚未兌現、但之後可能被利用的潛在威脅、手段或可能性；它可以存在於表面上已告一段落的局部。

| language / locale | term | relation | evidence role | current evidence |
|---|---|---|---|---|
| 中文 | 味／餘味／借用（候選） | Unknown | usage / targeted verification | 尚未找到足以固定與日文 aji 同範圍的主要來源 |
| 日本語 | 味（aji） | Anchor candidate | curriculum classification | 日本棋院初段課程把「味、味消し」列為獨立技術 |
| 한국어 | 맛／뒷맛（候選） | Unknown | targeted verification | 不以字面相似推定 technical equivalence |
| English | aji | Strong overlap via borrowing | borrowing + glossary definition | BGA 直接保留日語 aji，定義為 latent threats / possibilities |

**目前最強洞見：** 英文直接保留 `aji` 能證明借詞與翻譯邊界，但不能證明英語棋手因此形成不同認知。

**Promotion decision：** Core 暫不把「味／薄味」當正式 learner-facing 核心術語；需要時先用「可利用的弱點／後續手段」等可觀察說法。中文／韓文 relation 保持 Unknown。

## 6. Anchor 4｜先手／sente / initiative

這個 anchor 必須先拆兩種語義，否則同一詞會造成概念偷換。

### 6.1 Turn-order sense

**操作定義：** 對局開始時誰先落子。

- 日本棋院入門規則把黑方先下稱為「先手」，白方後下稱「後手」。
- 中文規則／日常棋語亦可用「先手」表示先行，但本輪不把這個義項直接等同 technical sente。

### 6.2 Technical sente sense

**操作定義候選：** 一手或一段交換使對手若不回應會承受較大損失，因此通常需要應對；交換完成後，己方仍保有較自由地先到別處的機會。

| language / locale | term | relation | evidence role | current evidence |
|---|---|---|---|---|
| 中文 | 先手 | Unknown / possibly broader | usage | 可同時承擔「先下」與技術主動權語義，需依句境拆分 |
| 日本語 | 先手（sente） | Anchor candidate | curriculum classification + rule usage | 日本棋院把「先手・後手の重要性」與更高階「先手・主導権」分開呈現 |
| 한국어 | 선수 | Unknown | targeted verification | 待韓國棋院技術教材查核 turn-order 與 technical usage |
| English | sente / initiative | Overlap, not exact | borrowing + glossary definition | BGA 將 sente 解作取得 initiative／要求回應；舊 BGJ 同時明示 sente 是相對的 |

**反證／邊界：** 不再把 technical sente 寫成無條件「對方必須回應」。對手若 elsewhere 有更大 sente 或接受局部損失，可能選擇不回；因此 learner-facing 應先問「對方不理會會損失什麼」。

**重要邊界：** 不把 sente 直接等同經濟學 option value；若未來作決策類比，另走 `go-decision-models-v1` 並標 structural analogy。

## 7. Anchor 5｜定石／joseki

**操作定義候選：** 在局部與特定前提下，經長期實戰形成、雙方大致可接受的標準手順；不是脫離全局條件的唯一最佳答案。

| language / locale | term | relation | evidence role | current evidence |
|---|---|---|---|---|
| 中文 / zh-TW | 定石（usage） | Overlap candidate | professional usage | 臺灣棋評實際使用，但不據此固定 canonical definition |
| 中文 / zh-CN | 定式 | Overlap candidate / Unknown boundary | targeted verification | 待補全局條件的直接專業教材說明 |
| 日本語 | 定石（joseki） | Anchor candidate | curriculum / historical change | 日本棋院以定石作獨立學習分類；AI 時代可重新評價既有手順 |
| 한국어 | 정석 | Unknown / likely overlap | curriculum candidate | 待韓國棋院直接定義與教材使用邊界 |
| English | joseki | Strong overlap via borrowing | borrowing + glossary definition | BGA 定義為 near-equal local/corner sequence；舊 BGJ 明示局部 joseki 仍可能因全局條件而變得好或不好 |

**教學邊界：** `joseki` 是局部條件化的 standard pattern，不是棋規，也不是全局最佳手保證。若現有 Core 文案已能表達這點，停止擴寫。

## 8. Matched-example policy｜不要把「同主題」誤寫成「同一棋形」

前一輪曾把不同來源中的三三內容稱為「同一棋形比較」；這個說法過強，正式研究改成兩級：

### Level 1｜Theme-matched example

只要都是三三侵入、厚勢／實地等同一主題，但初始盤面、年代、手順或全局條件不同，只能稱：

> **同類局面／同一主題的跨語解說比較**

可用來發現 vocabulary / framing candidate，不能據此證明語言造成不同判斷。

### Level 2｜Exact-position comparison

只有同時固定下列條件，才稱「同一局面跨語比較」：

- 同一 board size 與完整 stones；
- 同一 side to move；
- 會影響判斷時固定 rules / komi / ko state；
- 有可重建的 SGF、position fingerprint 或等價 position record；
- 四語解說都確實指向該 exact position，而不是同類變化。

第一版只需要 **1 個** exact-position pilot；不要求五個 anchors 都有。若找不到，不用低品質材料補齊。

## 9. Cross-language findings｜目前可以說／不能說

### 可以說

- 日本棋院把「厚み、薄み、先手／後手、味、味消し、サバキ」等分成可獨立教學的概念。
- BGA 明確說西方圍棋因歷史原因使用大量日語術語；英文不是完全以本土詞彙重建圍棋概念系統。
- 韓國棋院把 `행마`、`맥점` 等做成獨立教材分類，證明韓國教材有自身技術分類；但這不自動建立與本輪五個 anchors 的一對一 relation。
- 臺灣職業棋評可證明「厚勢」「定石」「手筋」等在繁中圍棋語境中實際使用。
- 本 pilot 已直接改變 Core copy decision：厚勢／外勢需要操作性區分；先手不能寫成無條件必應；味／薄味目前不升格正式 Core 術語。

### 不能說

- 不能從術語差異推出「中國人／日本人／韓國人／英文使用者天生以不同方式思考」。
- 不能把 institution curriculum 當成整個語言社群的 cognition evidence。
- 不能把 usage evidence 當 formal definition。
- 不能把同一漢字詞在中日韓直接判為 Equivalent。
- 不能把英語借詞數量當成日本圍棋思想更正確或更有教學效果的證據。
- 不能把 theme-matched 三三資料稱為 exact same-position comparison。
- 不能由語言／教材差異推出 learner outcome、retention、transfer 或 learning effect。

## 10. Counterevidence / alternative explanations

- 術語差異可能主要來自翻譯史與教材傳播，而不是認知差異。
- 現代職業圍棋高度國際化、又共同受到 AI 影響，歷史語彙差異不代表當代頂尖棋手的實際判斷仍有同等差距。
- 一個語言沒有單一對應詞，不代表使用者無法用短語或複合概念表達相同棋理。
- 同一詞在不同棋力層級、年代與棋手之間可能漂移，不能只用單一詞典固定語義。
- 同一機構的 curriculum 分類可能是教學編排選擇，不一定等於語言自身的概念結構。
- 相同棋理可以用不同詞描述；不同詞也可能只是 register／教材層級差異。
- 若 exact-position 比較顯示四語解說在棋盤結論上高度收斂，會削弱「跨語概念差異值得獨立頁」的產品理由。

## 11. Publication Gate｜何時才重新討論 concepts.html

目前 `concepts.html` 維持不存在；研究完成不自動要求建立新頁。

只有同時滿足下列條件才重新評估 public Explore page：

1. 至少 **3 個 anchors** 出現可重現、且會改變教學解釋的 semantic boundary；普通翻譯差異不算。
2. 主要 headline claims 不依賴尚未處理的高風險 Unknown。
3. 至少完成 **1 個 exact-position comparison** 或同等受控的跨語案例。
4. 已區分 definition／usage／curriculum classification／borrowing／historical change evidence。
5. 高風險 mapping 至少經懂圍棋且具相關語言能力的人核對；模型自評不算人工審校。
6. public copy 必須明示「術語／教材差異 ≠ 民族認知差異」。
7. 公開棋形／圖片／外部文字已處理 license／redistribution；若需棋形，優先本站重建而非複製外部圖。
8. prototype 能提供現有 Core／history／Advanced 小型知識卡無法提供的實際理解增益；若只增加頁數或文字，維持 research-only。

**Fail path：** 任一核心條件未通過，不建立獨立頁；把已核對的內容用於現有課程文案、Advanced 解釋或小型知識卡即可。

**Index boundary：** 即使未來 Publication Gate 通過，也先完成獨立頁與驗證，再決定是否新增首頁入口；不要為尚未驗證價值的 Explore page 反覆改動 formal learner candidate critical surface。

## 12. Unknowns with highest decision value

1. 中文「厚／厚勢／勢／外勢」在專業教材中是否有可重現的操作邊界，或主要是語用重疊？
2. 「勢」是否應拆成至少兩個 anchors：力量／影響（influence）與尚未確定的圍地框架（moyo/framework）？
3. 韓文 `세력`、`선수`、`맛/뒷맛` 是否與中／日概念邊界相同，哪些只屬普通語義？
4. 中文「味／餘味／借用」是否真的能覆蓋日文 aji，還是只有部分重疊？
5. 受控 exact-position pilot 是否真的產生超過普通翻譯差異的 framing gain？
6. 就算研究上存在 3 個以上 semantic boundary，獨立 Explore page 是否比現有頁內知識卡更能幫助目標讀者理解？

## 13. Recheck backlog｜不是本輪 scope

- `手筋／tesuji／맥`：已有明顯 Overlap candidate，但目前沒有 Core 文案決策被它阻擋；只有獨立 Explore 重啟、正式新增相關 learner-facing definition，或人工審查提出衝突時再升為 anchor。
- `행마`、`수읽기`：保留為韓國教材分類資訊，不為湊四語建立中文／日文／英文假等價。
- broad cross-language cognition / proverb-effect：PAUSED。除非目標改為正式 cognition／learning study，否則不再擴張。

## 14. 2026-09-30｜Targeted content QA decision（沿用）

本輪停止擴張「語言是否改變圍棋認知」的一般研究，只處理已直接影響現有教材的概念邊界。這是 Research → Teaching Promotion Gate 的小型內容查核，不新增 learner runtime authority，也不把來源差異升格成 learning effect。

- **厚勢／外勢**：Core 保留兩詞，但明示為本課操作性區分；厚勢側重較安定、可支援戰鬥的厚實棋形，外勢側重朝中央／外側產生的力量與影響。跨語 canonical relation 仍保持 Unknown。
- **先手**：撤回絕對「必須回應」；改成不回應會承受較大損失時通常需要回應，交換後己方仍有機會先到別處。與 Advanced 既有「先讀清楚對方能不能不理，再談分類」一致。
- **味／薄味**：中文概念邊界仍不足以升格成 Core 正式術語；學習者文案先用「可利用的弱點／後續手段」，研究層保留 `味 / aji` anchor 與 Unknown。
- **定石、急場／大場**：現有操作性說明已足以支援當前教材，本輪不擴寫。

### Promotion / stop decision

- 厚勢／外勢、先手：`ACCEPTED` as versioned copy clarification；不改 KC、scoring、scheduler 或 evidence taxonomy。
- 味／薄味：`UNKNOWN / NOT PROMOTED AS A FORMAL CORE TERM`。
- 定石、急場／大場：`NO CHANGE / STOP`。
- broad cross-language cognition / proverb-effect research：`PAUSED`；除非日後目標改為正式 learning-effect study。

## 15. Source records｜verified / targeted first pass

- 日本棋院｜コース別技術指導カリキュラム（厚み、薄み、先手・後手、味、味消し、サバキ）：https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html
- 日本棋院｜囲碁の基本：対局のルール・流れ（先手／後手的 turn-order usage）：https://www.nihonkiin.or.jp/teach/lesson/school/start.html
- 韓國棋院｜김만수 ‘행마의 기본’：https://m.baduk.or.kr/news/B01_view.asp?news_no=5360
- 韓國棋院｜맥점教材／介紹候選：https://m.baduk.or.kr/news/B01_view.asp?news_no=2534
- British Go Association｜Meanings of some Japanese Go Terms（borrowed Japanese terms、aji、atsumi、sente、joseki、tesuji）：https://www.britgo.org/general/definitions.html
- British Go Journal No. 9 (1969) glossary（sente relative；joseki local-vs-global boundary）：https://www.britgo.org/files/bgj/bgj009.pdf
- 海峰棋院：https://www.haifong.org/ （本輪只作 zh-TW professional-usage source ecosystem；引用具體用例時必須保存精確文章 locator）

## 16. Stop / continuation rule

目前**不得**建立「各語言思考模式」公開結論頁，也不得因本 pilot 文件更完整就建立 `concepts.html`。

後續只在下列 recheck trigger 發生時重新開研究：

- Core／Advanced 要正式新增「味／薄味」或新的高風險跨語術語定義；
- 現有「厚／厚勢／勢／外勢／模樣」區分再次影響 learner-facing content；
- 準備獨立跨語 Explore prototype，且能先提供 exact-position candidate；
- 新的直接來源或懂圍棋／懂語言的人工審查提出實質反證；
- 發生可觀察的 translation / concept-drift bug。

若沒有 trigger，停止 broad search。研究治理的成功標準是**是否減少 concept drift、修正內容決策、提高可追溯性**，不是文件長度、語言數或來源數。