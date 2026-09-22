# 錯誤修正、保留與遷移：研究查核

查核日期：2026-09-19 至 20；2026-09-20 補查排序政策。用途：修訂個人離線圍棋課程的 [設計計畫](DESIGN_PLAN.md)，本輪未修改程式或資料庫。

本文件保留先前來源與計數紀錄；現行規格以 [設計計畫](DESIGN_PLAN.md)為準，[缺口審查與整合版](LEARNING_MODEL_REVIEW.md)記錄修正理由。已加入獨立驗收分池、技能卡與事前機會資格，修正無限重置間隔；距離指標為診斷資料，固定應用探測與自然 T3 分開。最新附件的採納與查核見文末。

## 結論與證據範圍

採納「按機會校正、延後再測、不同棋形與實戰遷移」；穩定修正距離 SCD 為本專案自訂指標。沒有查得本次引用文獻直接驗證這整套圍棋量測模型，不能把一般記憶研究寫成棋力提升保證。

查核方法：讀取附件，逐一核對論文摘要、補查原始實驗，以及官方工具文件；下表研究內容以可讀摘要為界，未宣稱已完整審讀付費全文。工具以官方主庫取代附件中的分支庫，線上能力不代表本機已裝妥或已接入。

## 研究與設計決策

| 來源 | 可支持的內容 | 限制與採用決策 |
|---|---|---|
| [Roediger 與 Karpicke，2006：Test-enhanced learning](https://pubmed.ncbi.nlm.nih.gov/16507066/) | 兩個文章學習實驗中，即時測驗與延後測驗呈現不同優勢；提取有利於延後保留 | 不是圍棋。立即答對只記練習表現，穩定判定需延後測驗 |
| [Butler，2010：Repeated testing produces superior transfer](https://pubmed.ncbi.nlm.nih.gov/20804289/) | 四個實驗檢驗事實與概念，包含一週後的新推論題；反覆測驗優於反覆閱讀 | 支持測新問題；不能直接證明實戰遷移，T3 必須另外量 |
| [Butler 等：Retrieving and applying knowledge to different examples](https://pubmed.ncbi.nlm.nih.gov/29265856/) | 四個實驗中，不同例子的提取練習有利於兩天後新例子的應用 | 支持加入不同棋形的 T2；旋轉同一張圖的效益不能視為相同 |
| [Pan 與 Rickard，2018：Transfer of test-enhanced learning](https://pubmed.ncbi.nlm.nih.gov/29733621/) | 122 個實驗、192 個 transfer effect sizes 的統合分析得到平均正向遷移，d=0.40，95% CI [0.31, 0.50]，效果受練習與測驗關係等條件調節 | 支持把未見題遷移列為獨立成果；不能把平均效果量搬成圍棋預期值或假定任何提取練習都同樣有效 |
| [Cepeda 等，2008：Spacing effects in learning](https://pubmed.ncbi.nlm.nih.gov/19076480/) | 超過 1,350 人的事實學習，適宜的複習間隔隨目標保留時間改變 | 固定 1、3、7、14 天只作起始排程，不是普遍最佳值 |
| [Mawson 與 Kang，2025：Distributed practice 課堂統合分析](https://pubmed.ncbi.nlm.nih.gov/40564553/) | 22 篇報告、31 個效果量、超過 3,000 名參與者；d=0.54，95% CI [0.31, 0.77]，整體有利分散練習 | 是課堂平均效果，不是提高 54% 或圍棋預期效果；研究數限制調節分析 |
| [Brunmair 與 Richter，2019：Similarity matters](https://pubmed.ncbi.nlm.nih.gov/31556629/) | 59 項研究的交錯學習整體有優勢，但材料差異大；字詞材料甚至偏向集中練習 | 不採「永遠亂序最好」。先教再混合相近手筋，是待個人驗證的課程假設 |
| [Tailoring interleaved practice，2025](https://www.sciencedirect.com/science/article/pii/S1041608025001803) | 259 人學習六位畫家的視覺分類；random 與 adaptive interleaving 均優於 blocked practice，但 adaptive 沒有再優於 random | 是「更個人化不必然更好」的直接反例，不是圍棋證據，也不能單獨證明動態排序沒有價值 |
| [A Comparison of Adaptive and Fixed Schedules of Practice，2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6028005/) | 非洲國家位置學習中，自適應間隔在即時與延後測驗優於部分固定及 yoked 排程 | 顯示自適應可能有效，與 2025 反例共同支持「結果混合、須用強基準直接測試」；不是圍棋或複雜戰術遷移 |
| [Adaptive versus static practicing，2017](https://www.sciencedirect.com/science/article/pii/S0272775716303387) | 荷蘭中學的大型隨機實地研究平均未見自適應練習的測驗優勢，高能力學生在固定方案略好 | 再次否定自適應必然勝出；不同系統、強度與學生條件可能改變結果 |
| [Unraveling the benefits of experiencing errors，2022](https://pubmed.ncbi.nlm.nih.gov/34820785/) | 回顧指出，產生錯誤後得到修正回饋可促進學習，效果受條件影響 | 不刻意追求大量犯錯、不因一次未改善責備學習者；需保留回饋與重新提取 |
| [A Practical Review of Mastery Learning](https://pubmed.ncbi.nlm.nih.gov/35027359/) | 提供精熟學習的回顧背景 | 教育／藥學脈絡，不能驗證本專案的 SCD 或兩次過關門檻；只作結構參考 |
| [How Much Mastery is Enough Mastery?，2025](https://files.eric.ed.gov/fulltext/ED675652.pdf) | Rori 數學微課資料中，前一課較高的 BKT mastery 與下一課表現及估計知識較高相關 | 是特定系統的觀察關係，不證明 0.95／0.98 是圍棋門檻，也不能由相關推成提高門檻造成後續改善 |
| [Representational Competencies by KC Model，2022](https://educationaldatamining.org/edm2022/proceedings/2022.EDM-short-papers.31/index.html) | 電機工程課程資料中，隨學習進展，整合表徵能力與內容知識的 KC 模型擬合較好 | 支持 KC 結構可能隨學習改變；圍棋 chunking 仍是待驗類比，不據此自動拆分或合併技能 |
| [Reinforcement Learning in Education：系統性回顧，2025](https://link.springer.com/article/10.1007/s40593-025-00494-6) | 回顧 89 篇研究；54 篇未做顯著性分析，只有 14 篇包含非自適應控制，並指出長期研究不足 | 支持強基準、長期成果與統計驗證優先；不能由方法學缺口推成 RL 無效，也不支持個人少量資料直接導入 learned policy |
| [Learning-performance distinction，2012](https://pubmed.ncbi.nlm.nih.gov/22142953/) | 討論動作技能的學習與當下表現區別 | 領域不同；本計畫另外使用上列文章提取原始實驗支持延後評量 |

## 圍棋教材與工具核對

- [日本棋院死活題 006](https://www.nihonkiin.or.jp/teach/lesson/test/life-death1/ld006f.html)是教材實例，不是成效實驗，不能證明 SCD 或固定間隔有效。
- [KaTrain 官方 README](https://github.com/sanderland/katrain/blob/main/README.md)列有掉目檢視、錯著重試、聚焦錯誤的 SGF 複盤、人類風格模型設定。這些支持找題與分析，不等於已具備整套錯誤分類與間隔教學引擎。2026-09-20 已確認本機 KaTrain 桌面程式可啟動；版本、KataGo 引擎／模型、分析輸出與效能仍未核對。
- [KataGo 官方 Analysis Engine](https://github.com/lightvector/KataGo/blob/master/docs/Analysis_Engine.md)支援多局面分析、候選手、目數估計及可選的形勢／策略資料；human SL 設定包含 rank_20k 至 rank_9d，需相應模型。官方記載支援始於 2024 年 7 月的 1.15.0，不能寫成 2026 才有。人類著法分布不等於個人的錯誤原因或可靠的段位診斷；官方也提醒人類模型的分數／勝率可能有偏差。

上述工具能力屬文件查核；SGF 到題目、分類確認、T2 題庫及排程接線仍是本專案後續工作。

## 指標計數契約與例子

以可觀察的技能結果建立基本修正紀錄，另依固定難度、T 層級、提示狀態與用途分層。原因分類有一致依據時才另列根因週期；原因未知不抹除已知錯答。

1. **SCD 練習成本**：觸發錯誤後每次相關題目呈現算一次，同次多次點選算一次；有提示也計成本，但不能通過穩定門檻。只看解說未作判斷另記時間，不算決策機會。結束點採 DESIGN_PLAN 第 1.1 節，未結束顯示待驗證，不刪掉慢學週期。
2. **再犯間隔**：相鄰兩次確認錯誤之間的合格成功機會，不含兩端錯誤。有提示與結果未知另列，不能混入成功；根因未知仍保留已知的技能正誤。未再犯只報已觀察的下限。
3. **同類錯誤率**：錯誤數／可判定的無提示相關機會，顯示樣本數。只抓 AI 壞手會漏掉成功機會，無法作此分母；須對已選的局面或棋局以一致方法檢查正確與錯誤決策。

附件例子有七列練習卻估為「約五次」，缺乏排除口徑。若七列均為獨立相關練習、且最後達標，依本契約 SCD 是 **7**；若只是同次答題的點選就不能獨立計數。亦須核對最後兩題是否未見 T2、無提示、實際間隔符合門檻，否則仍待驗證。

再犯例子：錯 → 正 → 正 → 錯，共四次合格機會，錯誤率 2/4，再犯間隔 2。之後正 → 正但未再犯，只能說「目前至少 2 次成功機會」；30 天完全沒遇到該技能則不能說改善。

T0/T1/T2/T3 分開呈現；T2 流程檢核初步通過不能代替獨立驗收或 T3，也不宣稱永久掌握。沒有自然 T3 機會可安排無技能標題的混合局面練習，但仍應標為模擬，不能冒充實戰。

### 9×9 live T3 計數契約 v1

2026-09-22 起，`live-eligibility-v1`／`live-scoring-v1` 只為少數能在結果前定義、且由 rules engine 客觀核對的自然實戰局部決策提供分子分母。這是專案內的計數契約，不是外部研究證明的圍棋 mastery 尺度。

1. **先決定 eligibility，再看結果**：每個 9×9 人機局的學習者回合先掃描整盤並保存 assessment。若整盤沒有支援機會、同時有多個支援機會、上一著 actor 不可證明、或局面屬 5×5／7×7，該回合仍保存為 assessed/unscored，不得在看到著手後補選。
2. **v1 只支援兩種局部技能**：整盤唯一的一手提子；以及 computer 上一手新造成打吃後的唯一直接延長救棋。其他局部技巧、棄子、方向、定石、官子、勝負與 bot 偏好手維持 UNKNOWN／unscored。
3. **分母不因未答或不利結果消失**：一旦 assessment 標 `qualifiedOpportunity=true`，即進 eligible denominator。離開、重新整理或未作答仍計 eligible opportunity，只是 `firstResponses=0`／`unansweredOpportunities>0`。
4. **首答不可被修正覆寫**：第一個使用者操作單獨存 `first_response`；非法點擊也是首答。後續操作存 `retry_response`，可標 eventual correction，但 `qualifiedOpportunity=false`。重載後由既有 event store 恢復 response count。
5. **局部 scoring 不等於全局好壞**：task success 只表示符合該局部 contract；未達成不等於全局錯著，也不因棋局勝負回頭改分。
6. **機會與獨立樣本分開**：每個 eligible 決策點都進機會分母；但描述「近期跨局一致」時只以不同 game `sessionId` 為單位，同一盤連續多手不能當三個獨立棋局樣本。
7. **版本不靜默重算**：每筆 event 保存 eligibility、scoring 與 evidence-taxonomy version；當前 summary 只讀語義相容版本，不相容舊事件另列 excluded count。
8. **進度只作 evidence state**：`learner-evidence-progress-v2` 把既有 T0–T2 與 bounded live T3 並列成「資料不足／待更多證據／已有延後 T2／已有 live 應用」等狀態，不輸出 mastery 百分比、不直接寫 scheduler，也不取得 formal evaluation authority。
9. **資料收集 readiness**：只報 assessed turns、eligible opportunities、first response、unanswered 與跨局 session 是否開始累積；`collecting_multi_session` 只表示已跨至少兩個 session 收到首答，不表示樣本量充分、穩定學會或可作正式推論。

這套 contract 的工程驗證只能證明計數與生命週期符合規格；是否能預測之後的新局面、是否值得影響選題、以及是否對真人學習有效，仍需獨立 retention／transfer 與跨批次真人資料。

## 邏輯檢修附注與個人驗證

- **確認偏誤**：納入交錯練習效果不一致的結果，不只挑正面研究。
- **基準率與選題偏差**：少犯可能因題變簡單、沒遇到或只記成功；按機會與難度報告，未知、未完成及提示事件保留。
- **因果與過度推論**：個人進步可能同時受其他對局、時間、提示及題目熟悉度影響；前後趨勢不證明此方法造成改進，也不直接顯示「大腦重塑」。睡眠不在本工具中作因果量測。

試用前固定一組可比較的技能與難度、測驗政策及保留題，先收基線，再按多次練習週期觀察延後 T2 與自然 T3。同時記錄練習成本、提示依賴、分類未知率及未完成週期；不以追求最短 SCD 犧牲有意義的難題。政策改版需保存版本，避免新舊數值直接相比。

驗證分層：上列指標算式與邊界曾作文件對照，並非真人效度驗證。兩個試行技能的事件層已實作呈現、未答／中斷、曝光、版本及原始匯出；固定與候選自適應的排程工程可運作，但強基準、方案比較、獨立驗收與真人學習效果尚未完成。現況以 DESIGN_PLAN 第 10 節及 README 的實作／驗證紀錄為準，不宣稱療效、升段保證或神經科學最佳處方。

## KC／機會定義補充查核

本輪新增來源及取得限制詳見 LEARNING_MODEL_REVIEW 第 5 節。KLI 的 KC 是由相關任務表現推知的單位；技能卡仍屬假說。BKT 原文指出不同參數可能對應同樣表現，支持先記可觀察事件、保留模型不確定性，不支持由少量個人曲線推定掌握機率。2025 expertise reversal 的研究數核到，但全文未完成審讀，不用來斷言圍棋口述必然妨礙自動化。

計數口徑補充：先定題目是否適用，再觀察作答。合格題答錯不因事後推測缺先備而移出；呈現、嘗試、合格機會、無提示可判定數分開報。指定棋串與無線索全局探測不能直接合併；多技能題無可分別觀察的步驟時不把整題錯誤分派給每個 KC。

## 2026-09-20｜可修訂技能模型與簡單對照方案

輸入為使用者提供附件（`source_id: bd4f085f-c940-4c75-8a48-85167ff47278`；類型：user-provided attachment；題名：「前三輪的核心方向仍成立」）。SHA-256：`C5FC9EDEABF327E966F3FAF710134595576618FFC7D2CD606698F9A2F14AF28C`。附件是待評估主張集合；以下依外部來源及本機程式查核調整，並非將附件自評當證據。

| 來源與取得範圍 | 核對結果 | 納入界線 |
|---|---|---|
| [CMU DataLab：Key Concepts](https://www.cmu.edu/datalab/getting-started/key-concepts.html)，讀取 Modeling Skills and Knowledge 與 Learning Curve | KC 可採不同粒度，官方不建議無限拆成最小原子 | 支持暫定模型與按資料修訂；不能證明本專案兩個技能的效度 |
| [Cen、Koedinger、Junker，2006，LFA 原論文](https://pact.cs.cmu.edu/koedinger/pubs/Cen%2C%20Koedinger%20%26%20Junker06.pdf)及[作者書目](https://pact.cs.cmu.edu/koedinger/publications.htm) | 核到書目、索引擷取的摘要與導論：使用統計模型、專家知識及搜尋評估替代認知模型。PDF 直接開啟逾時，DOI 頁未取得 | 僅引用方法方向，未全文審讀，不據此宣稱單人少量資料適合 LFA 或立即新增演算法 |
| [Roediger 與 Karpicke，2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)，重讀原始研究摘要 | 無回饋的提取測驗亦可改變之後保留 | 支持把驗收曝光視為後續介入；輪替題池與配對方式是本專案設計，非此研究驗證的圍棋方案 |
| [Go Magic 官方首頁](https://gomagic.org/)，Key Principles and Features | 列有 Skill Tree、Personalized Dashboard 及 tailored recommendations | 功能自述足以推翻泛稱「沒有人做個人化學習」；不採其行銷成效為本專案證據 |
| [AI Sensei Challenge Mode 公告](https://ai-sensei.com/news/oSTjv)，2025-01-09 | 說明問題來自同意提供棋局的使用者，並依表現調整難度 | 核對功能，不推定其未公開的技能模型或驗收方法 |
| [AI Sensei Training Mode 說明](https://ai-sensei.com/news/9aN5r)，2026-03-02；[較早教學公告](https://ai-sensei.com/news/XZuRt)，2020-12-22 | 前者描述從棋局標記練習位置及依表現複習；後者已提及 Training Mode | 2026 是說明文章日期，不能當首次推出日期；官方「唯一」及長期效果主張未獨立核實，不採用 |

附件另列 101 圍棋、HJJ GO、GoReview、BadukPop；本輪未逐一查核其版本、功能、價格或下載數，保留為未來有需要時的比較候選，不納入已確認的產品功能清單。兩個官方產品例子已足以否定廣泛空白主張；本輪未完成市場或教育成效文獻普查，不能宣稱「沒有任何成熟產品公開完整效果證據」，亦不能由產品存在證明個人需求或付費需求。

### 採納與修正

- **直接採納**：五個功能問題的設計檢查、可修訂 KC 與題目特徵、保留原始事件及版本、輪替未見驗收池、成本／保留／遷移並看、固定間隔與固定回饋的對照、額外機制的停用條件。均已融入 DESIGN_PLAN 相應章節，沒有另外建立一套課程。
- **保留個人範圍**：兩個技能先試；三至五個、完整平台與商業差異化留作有需要時再評。first-principles-inspired 是方法描述，五個功能條件也不是已被證明不可約的原理。
- **修正推論**：曲線相似／不同是查模型的線索，先核對難度、曝光、提示及資料量；T2 到固定應用探測的關係待驗，T3 沿用自然實戰。成本、保留、遷移不相乘；KataGo 搜尋估計與規則引擎的合法性判定分開。
- **保留不確定性**：對照未見優勢可能是樣本不足，不能直接宣判無效；觀察預算及實用改善門檻在試用前固定。可在不確定時選較簡單方案，但那是工程選擇。

邏輯檢修附注：避免由漂亮曲線確認技能本體、由產品功能推出需求或成效、由未搜尋到資料推出市場不存在，以及由未顯優勢推出兩法等效。仍未知的是技能粒度、配對題可比性、記錄負擔與自適應的增量效益；取得可核對真人事件與未參與調整的新批次結果後再評。

本機核對曾發現 Phase 1 缺呈現／未答、獨立機會 ID、曝光、題目／政策版本及完整原始匯出；後續已在兩個試行技能補上。`elapsedMs` 含閒置與重試，不能當有效學習成本。正式比較仍須補齊 P0 強基準、獨立審題、母題隔離的多批驗收與可重算真人資料。

## 2026-09-20｜動態排序與 Minimal Sufficient Policy 補查

最新研究問題收斂為：在高品質內容、回饋、hard validity prerequisite、分散提取與相同學習預算都成立後，動態排序是否仍能增加延後保留、未見棋形遷移與按機會校正的實戰改善。現有研究同時存在「自適應優於固定」及「自適應未優於簡單交錯／固定」結果，故只能支持直接比較與停止條件，不能支持預設勝負。

採納以下邊界：

- Expected Learning Value 是質性決策框架，不把未校準的 retention、transfer、engagement 等欄位任意相乘。
- 先備分為 hard validity 與 soft pedagogical；前者保護任務是否可解釋，後者只影響是否值得現在練。
- Diagnostic Value 只有在取得資訊會改變下一步時才值得占用學習時間；exploration 不設成固定佇列。
- engagement、frustration、完成率與自主選擇作為負擔及持續使用約束，與學習成果分開呈現。
- 先比較 P0 強基準，再逐層加入 repeated weakness、retention／transfer、decision-relevant diagnosis；資料量與增量效益不足時不導入 bandit／RL。
- 個人版每批凍結 KC 與題目版本，以延後無提示 T2 及固定應用探測為主要成果；自然 T3 依合格機會報分子分母，不能只數錯誤。

停止條件：若額外層在預定觀察預算內沒有穩定達到事前定義的實用改善，或其記錄、調參、除錯及使用負擔超過收益，保留較簡單方案。這是工程選擇，不改寫成證明複雜政策普遍無效。
