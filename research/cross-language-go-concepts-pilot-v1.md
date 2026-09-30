# Research Record｜Cross-Language Go Concepts Pilot v1

- researchId: `cross-language-go-concepts-pilot-v1`
- question: 中文、日文、韓文與英文圍棋資料對「厚、勢、味、先手、定石」是否只是不同翻譯，還是存在穩定的概念邊界差異？
- decisionUse: 先服務既有 Core／Advanced 術語內容 QA，再判斷是否值得形成獨立 Explore 內容；目前不建立 `concepts.html`，不建立跨語 learning-effect claim。
- scope: 第一輪只做五個概念；優先棋院／棋協／專業教材與可追溯詞彙資料。語言數不是證據數。
- learner_runtime_authority: none
- accessDate: 2026-09-30
- snapshotVersion: 2
- promotion_status: `SOURCE_VERIFIED_PARTIAL / CONTENT_QA_APPLIED_PARTIAL / EXPLORE_NOT_YET_TEACHING_CANDIDATE`

## Method

先建立 Concept Anchor，再記錄各語言 term。不得把翻譯詞預設成 Equivalent；暫用：
- Equivalent
- Overlap
- Broader
- Narrower
- Non-equivalent
- Unknown

只有實際用法、棋形範圍與相鄰概念足夠時才判 relation。第一輪目標是找「會改變教學解釋的差異」，不是收集最多術語。

## Anchor 1｜厚／thickness

**操作定義候選：** 已經穩定、難以被直接攻擊，且能對周圍戰鬥或發展產生支持作用的棋形／力量。排除單純「棋子很多」或「已圍成實地」。

| language | term | relation | current evidence |
|---|---|---|---|
| 中文 | 厚／厚勢 | Unknown | 需要再補可操作定義的棋協／棋手教材；目前只確定常與薄、勢、地等對照 |
| 日本語 | 厚み（atsumi） | Anchor candidate | 日本棋院課程把「厚みと模様」「厚み、薄み」列為獨立技術主題 |
| 한국어 | 두터움／세력（候選） | Unknown | 尚未完成一對一概念邊界查核 |
| English | thickness / atsumi | Overlap candidate | BGA 將 atsumi 解釋為面向中央或邊線的強棋形；英語實戰文章直接使用 thickness |

**未知：** 中文「厚勢」是否把日文 厚み 與 勢力／模樣的一部分合併在同一常用表達中。

## Anchor 2｜勢／influence / framework

**操作定義候選：** 尚未完全兌現為實地、但能對較大區域的後續落子與戰鬥施加影響的空間性能力。排除已確定實地。

| language | term | relation | current evidence |
|---|---|---|---|
| 中文 | 勢／外勢／勢力 | Unknown | 需進一步區分三詞實際用法 |
| 日本語 | 勢力／模様 | Overlap candidate | 日本棋院課程明列「厚みと模様」；顯示厚與模樣不是同一概念 |
| 한국어 | 세력 | Unknown | 需補韓國棋院教學定義 |
| English | influence / moyo / framework | Non-equivalent set candidate | 英文既使用 influence，也直接借用 moyo；BGA 定義 moyo 為 potential territory |

**未知：** 「勢」是否其實需要拆成至少兩個 anchor：局面力量（influence）與尚未確定的圍地框架（moyo/framework）。

## Anchor 3｜味／aji

**操作定義候選：** 局面中尚未兌現、但之後可被利用的潛在威脅、手段或可能性；它可以存在於表面上已告一段落的局部。

| language | term | relation | current evidence |
|---|---|---|---|
| 中文 | 味／餘味／借用（候選） | Unknown | 尚未找到足以判斷是否共享同一概念範圍的主要來源 |
| 日本語 | 味（aji） | Anchor candidate | 日本棋院初段課程把「味、味消し」列為獨立技術 |
| 한국어 | 맛／뒷맛（候選） | Unknown | 待韓文原生教材查核 |
| English | aji | Strong overlap | BGA 直接保留日語 aji，定義為局面中 latent threats or possibilities |

**目前最強洞見：** 英文沒有完全英文化這個概念，而直接保留 aji；但這只能證明借詞與翻譯困難，不能證明英文棋手形成不同認知。

## Anchor 4｜先手／sente / initiative

**操作定義候選：** 一手或一段交換使對手必須／強烈需要回應，使自己能保有下一個較自由的行動機會。需區分「先下」「forcing move」「主導權」等不同語義。

| language | term | relation | current evidence |
|---|---|---|---|
| 中文 | 先手 | Unknown / possibly broader | 需要區分一般語義「搶先」與技術語義 |
| 日本語 | 先手（sente） | Anchor candidate | 日本棋院課程把「先手・後手の重要性」與更高階「先手・主導権」分開呈現 |
| 한국어 | 선수 | Unknown | 待韓國棋院技術教材查核 |
| English | sente / initiative | Overlap, not exact | BGA 明說 sente 沒有 exact English word，並以 gaining the initiative / move requiring reply 解釋 |

**重要邊界：** 不把 sente 直接等同經濟學 option value；若未來作決策類比，需另標 structural analogy。

## Anchor 5｜定石／joseki

**操作定義候選：** 在局部與特定前提下，經長期實戰形成、雙方大致可接受的標準手順；不是脫離全局條件的唯一最佳答案。

| language | term | relation | current evidence |
|---|---|---|---|
| 中文 | 定式 | Unknown / likely overlap | 待補中文專業教材對「全局條件」的直接說明 |
| 日本語 | 定石（joseki） | Anchor candidate | 日本棋院大量以定石作獨立學習分類；AI 時代又出現「定石革命」重新評價既有手順 |
| 한국어 | 정석 | Unknown | 待韓國棋院定義與教材使用 |
| English | joseki | Strong overlap | BGA glossary 定義為通常在角部的 standardised sequence，且西方歷史上直接借用日語 |

## Cross-language findings so far

### 可以說
- 日本棋院把「厚み、味、サバキ、先手／後手」等分成可獨立教學的概念。
- 韓國棋院把 `행마` 做成獨立、分階段的系統課程，顯示韓國教學確實存在自己的技術分類；但 `행마` 不在本輪五詞內，只作「語言／教材分類可能增加新概念邊界」的旁證。
- BGA 明確說西方圍棋因歷史原因使用大量日語術語，並列出多個沒有 exact English word 的常用詞；英文不是完全以本土詞彙重建圍棋概念系統。

### 不能說
- 不能從術語差異推出「中國人／日本人／韓國人天生以不同方式思考」。
- 不能把同一漢字詞在中日韓直接判為 Equivalent。
- 不能把英語借詞數量當成日本圍棋思想更「正確」或更有教學效果的證據。

## Counterevidence / alternative explanations

- 術語差異可能主要來自翻譯史與教材傳播，而不是認知差異。
- 現代職業圍棋高度國際化、又共同受到 AI 影響，歷史語彙差異不代表當代頂尖棋手的實際判斷仍有同等差距。
- 一個語言沒有單一對應詞，不代表使用者無法用短語或複合概念表達相同棋理。
- 同一詞在不同棋力層級、年代與棋手之間也可能漂移，不能只用單一詞典固定語義。

## Source records｜first pass

- 日本棋院｜コース別技術指導カリキュラム（厚み、薄み、先手・後手、味、味消し、サバキ）：https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html
- 韓國棋院｜김만수 ‘행마의 기본’：https://m.baduk.or.kr/news/B01_view.asp?news_no=5360
- British Go Association｜Meanings of some Japanese Go Terms：https://www.britgo.org/general/definitions.html
- British Go Journal glossary｜Aji / Gote / Joseki / Sente 等：https://www.britgo.org/files/bgj/bgj096-2.pdf

## Unknowns with highest decision value

1. 中文「厚／厚勢／勢／外勢」在專業教材中如何明確分界？
2. 韓文 `세력`、`선수`、`정석`、`맛/뒷맛` 是否與中／日概念邊界相同？
3. 中文「味／餘味／借用」是否真的能覆蓋日文 aji，還是只有部分重疊？
4. 五詞中若只有 1–2 個出現實質跨語差異，是否仍值得獨立成頁，或只做 history／advanced 的知識卡？

## 2026-09-30｜Targeted content QA decision

本輪停止擴張「語言是否改變圍棋認知」的一般研究，只處理已經直接影響現有教材的概念邊界。這是 Research → Teaching Promotion Gate 的小型內容查核，不新增 learner runtime authority，也不把來源差異升格成 learning effect。

### 已採用到現有教材的最小修正

1. **厚勢／外勢**：現有 Core 可保留兩個詞，但 learner-facing 定義改成「本課的操作性區分」：`厚勢` 側重本身較安定、可支援戰鬥的厚實棋形；`外勢` 側重棋形朝中央／外側產生的力量與影響。這是教學用 boundary，不宣稱中文、日文、韓文、英文已存在一對一 canonical mapping。
2. **先手**：撤回「必須回應」的過強字眼。Core 改成：若對手不回應會承受較大損失，通常需要回應；交換後己方仍有機會先到別處。這與 Advanced 已有「先讀清楚對方能不能不理，再談分類」的邊界一致。
3. **味／薄味**：中文概念邊界仍不足以升格成 Core 正式術語。學習者文案先改用「可利用的弱點／後續手段」；研究層保留 `味 / aji` anchor 與 Unknown，不因白話化假裝跨語問題已解決。
4. **定石**：現有「角上常見、在特定條件下合理的交換；不是不看全局就能照背的唯一答案」已足夠，沒有找到會改變目前 learner-facing 決策的缺口，因此本輪不擴寫。
5. **急場／大場**：現有操作性對照已足以支援 Core 的「急迫損失 vs 大但不急」判斷，本輪不新增格言頁或額外題庫。

### Promotion / stop decision

- `厚勢／外勢`、`先手`：**ACCEPTED AS VERSIONED COPY CLARIFICATION**；只改 learner-facing 說明，不改 KC、scoring、scheduler 或 evidence taxonomy。
- `味／薄味`：**UNKNOWN / NOT PROMOTED AS A FORMAL CORE TERM**；以白話 wording 避免把未核清的 lexical mapping 固定成教材真值。
- `定石`、`急場／大場`：**NO CHANGE / STOP**；現有內容足夠，繼續搜尋的邊際資訊增益不足以改變教材。
- broad cross-language cognition / proverb-effect research：**PAUSED**；除非未來要做正式 learning-effect study，否則不再為充實網站而擴張。

### Recheck triggers

只在以下情況重新開研究：
- Core／Advanced 要正式新增 `味／薄味` 定義；
- learner-facing 文案再次需要區分 `厚／厚勢／勢／外勢／模樣`；
- 新增自然語言版本，需要判斷 term relation；
- 準備獨立 `concepts.html`／跨語 Explore；
- 新的直接來源或人工內容審查對目前操作性定義提出實質反證。

## 2026-09-30 Content-directed verification

本輪依「現有教材是否會因此改寫」排序，不再擴張一般語言認知文獻。

### 厚勢／外勢

- 〔來源支持〕日本棋院課程把厚み、薄み、模様等分開教學；BGA 對 atsumi／moyo 等也使用不同術語範圍。這支持「不要把厚實棋形、向外影響與潛在圍地框架壓成同一概念」，但不能直接證明繁中「厚勢／外勢」存在唯一標準切法。
- 〔內容決策〕Core 不宣稱字典式唯一等價，而改用課內操作定義：**厚勢**著重「本身較安定、能支援附近戰鬥的厚實棋形」；**外勢**著重「棋形朝中央或外側產生的力量與影響」。兩者都不等於固定實地。
- 〔剩餘未知〕中文專業教材中的「厚／厚勢／勢／外勢」完整詞義邊界仍未完成，故 relation 保持 `Unknown / Overlap candidate`，不升格成跨語 exact map。

### 先手／sente／initiative

- 〔來源支持〕日本棋院課程把「先手・後手」與「先手・主導権」分層；BGA 亦指出 sente 沒有單一完全等價英文詞，常以需要回應／取得 initiative 說明。
- 〔內容決策〕Core／Advanced 撤掉「必須回應」的無條件措辭，改成：若不回應會承受較大損失，對手**通常需要回應**；交換後自己仍有機會先到別處。這保留「行棋權」重點，也允許完整局面出現可脫先的反例。
- 〔邊界〕這仍是教學操作定義，不把 sente、forcing move、initiative 或一般「先下」視為完全等價。

### 味／aji／薄味

- 〔來源支持〕日文 `味（aji）` 與英語借詞 `aji` 有可追溯定義；目前仍缺足以把繁中「味／餘味／薄味」穩定映射到同一概念範圍的主要來源。
- 〔內容決策〕不把未完成查核的「薄味」設成 Core 必學詞。既有 learner-facing 題目改用可觀察的「弱點」「尚未安定」「後續手段」；Research Record 保留 `aji` anchor，未來有直接內容需求再重查。
- 〔停止線〕在沒有具體 learner-facing 用途前，不再為了湊齊四語 term map 擴張搜尋。

### 定石、急場／大場

- 〔內容決策〕現有定石文案已明示「特定條件下合理的交換、不是脫離全局的唯一答案」，與目前來源邊界一致，暫不改寫。
- 〔內容決策〕現有急場／大場文案已把「延後會造成重大損失」與「價值大但未必立即危險」分開；只作低成本確認，不另建新術語系統。

### 本輪 Promotion Gate 結果

- `厚勢／外勢`：`SOURCE_VERIFIED` → scope-limited learner wording applied；完整中文 lexical relation 仍 `UNKNOWN`。
- `先手`：`SOURCE_VERIFIED` → conditional learner wording applied。
- `味／薄味`：跨語 relation 仍 `UNKNOWN`；未升格術語，改用白話 learner wording。
- `定石`、`急場／大場`：現有內容足夠 bounded，本輪 `NO_CHANGE`。
- 以上只改內容表述；不改 KC、scoring、scheduler、evidence taxonomy、formal evaluation 或 learning-effect status。

## Stop / continuation rule

目前**不得**建立「各語言思考模式」公開結論頁。廣泛的 language × cognition 搜尋在網站內容目的下暫停；之後只有當既有教材用詞、即將發布內容或外部審查提出具體歧義時，才做定向查核。若至少數個概念出現可重現、會改變教學解釋的邊界差異，再重新評估獨立 Explore 頁；否則沿用現有課程／名型館容器，不新增平行內容系統。

- stopReason: broad cross-language cognition research has low additional content decision value; current work switches to content-directed verification.
- recheckTriggers: Core／Advanced 新增相關術語；外部棋理審查指出概念歧義；目標讀者 formative observation 顯示詞義混淆；決定建立跨語 Explore／多語介面時。
