# Research Record｜AI-era Go Knowledge Cases v1

- researchId: `go-ai-knowledge-cases-v1`
- question: 哪些具體棋形最適合用來說明「AI 如何重新評價人類既有圍棋知識」，而不是只停留在勝率或宏觀敘事？
- decisionUse: 建立未來 Explore／教學補充可用的案例候選；目前只進 research plane，不新增公開導覽頁、不改 Core curriculum／KC／scoring／scheduler／formal evaluation。
- scope: 先做 3 個候選案例；優先採棋院／棋協可追溯解說。AI 評價只作歷史知識轉折材料，不取得唯一教學答案 authority。
- accessDate: 2026-09-30
- snapshotVersion: 1
- promotion_status: `CASE_CANDIDATES / NOT_YET_TEACHING_ASSET`

## Case selection rule

一個案例只有同時滿足以下條件，才值得往公開教學資產升格：

1. 能指出 AI 前較穩定的人類慣例／判斷；
2. 能指出 AI 後具體改變的是哪個手順、時機或價值權衡；
3. 有可重建棋形，而不是只有文字口號；
4. 教學重點能用棋盤線索表達，不必依賴 win rate 才成立；
5. 能清楚說出「AI 改寫了什麼」與「沒有證明什麼」。

## Candidate A｜開局直接三三（ダイレクト三々）

### 觀察到的知識轉折

日本棋院 2019 年《ダイレクト三々　基本と応用》明確把它稱為「AI 時代的新定石」。頁面說明：過去星位三三侵入通常在局面進行一段時間、對方已有勢力後，作為侵入手段使用；圍棋 AI 則會在布石很早階段直接侵入三三，之後職業棋手重新檢討原有想法並大量採用。

### 適合教什麼

- 實地與外勢不是固定兌換率；
- 「時機」是棋理的一部分，同一手在不同全局條件下價值不同；
- 傳統上被視為太早的手，可能是價值權重或後續處理估計錯誤，而不只是「人類沒算到」。

### 不能教成什麼

- 不能寫成「AI 證明開局三三永遠最好」；
- 不能只用一個引擎當前 policy 把所有局面判成同一答案；
- 不能由職業棋手採用推論一般初學者照抄也一定較好。

### 目前缺口

- 尚未選定一個版權與盤面來源都可公開重建的代表 SGF／diagram；
- 尚未建立「傳統處理 vs AI-era 處理」同條件比較；
- 尚未由 rules engine／人工棋理審查確認未來教學圖中的每一著語義。

## Candidate B｜三三舊定石中的二路爬重新評價

### 觀察到的知識轉折

中國圍棋協會文章〈探索不止，棋士不死〉用一個三三定石案例說明 AlphaGo／Master 時代的新著：文中指出，一個維持數十年的標準變化原本因黑棋外勢厚而被認為黑方較好；AI 顯示白棋的一手二路爬可以省去後續交換，削弱黑棋外勢的完整性，進而改變局部評價。

### 適合教什麼

- 「厚」不是棋子數量，而要看是否留下缺陷與後續被迫補棋；
- 一手看似小的局部變化，可能改變整個交換的外勢品質；
- 定石評價可以因後續借用／形狀細節而被重估。

### 證據限制

這個來源是中國圍棋協會網站上的棋文化／評論文章，可支持作者如何描述案例與棋界共識轉折；目前不把它當成獨立的歷史統計證據，也不把「六十年」「一夜之間」等修辭直接升格為精確量化史實。

### 目前缺口

- 需要把文章圖形重建成可驗證座標／SGF；
- 需要第二條獨立專業來源核對該變化的技術判斷與時代範圍；
- 若未取得可公開重製的圖形授權，只重建局面，不複製來源圖片。

## Candidate C｜「定石」本身被重新定義為條件性知識

### 觀察到的知識轉折

日本棋院《定石革命》先把定石描述為「雙方走向互角結果的局部手順」，接著指出 AI 讓大量既有定石手順被重新評價與替換。韓國棋院 2020 年《AI 정석 100형》與 2025 年《AI 정석 이후》也把 AI 定石及定石後續變化整理為新的學習內容。

### 適合教什麼

- 定石不是脫離全局的唯一標準答案；
- 「標準手順」是一種可修訂的知識壓縮；
- AI 時代最值得學的未必是背更多新手順，而是理解何種局面條件使手順成立。

### 不能教成什麼

- 不把「AI 定石」寫成永久真理；
- 不以最新 AI 一次輸出覆寫歷史教材語義；
- 不把定石變更本身當成 AI 提升人類一般推理能力的證據。

## Case comparison

| case | 主要變化層級 | 教學候選主題 | 目前成熟度 |
|---|---|---|---|
| 直接三三 | 時機／全局價值權衡 | 實地 vs 外勢、時機 | 高：來源清楚；缺可重建教學圖 |
| 二路爬新著 | 局部形狀／外勢品質 | 厚、缺陷、交換品質 | 中：案例具體；需第二來源與圖形重建 |
| AI 定石革命 | 知識分類／手順庫 | 定石的條件性與可修訂性 | 高：多國棋界來源；需挑單一局面示範 |

## Source records

- 日本棋院｜ダイレクト三々　基本と応用：https://www.nihonkiin.or.jp/publishing/books/direct33.html
- 日本棋院｜定石革命：https://www.nihonkiin.or.jp/publishing/books/zhosekikakumei.html
- 日本棋院｜布石革命：https://www.nihonkiin.or.jp/publishing/books/husekikakumei.html
- 中國圍棋協會｜探索不止，棋士不死：https://wqwh.weiqi.org.cn/%E6%8E%A2%E7%B4%A2%E4%B8%8D%E6%AD%A2%EF%BC%8C%E6%A3%8B%E5%A3%AB%E4%B8%8D%E6%AD%BB/
- 韓國棋院｜AI 정석 100형：https://m.baduk.or.kr/news/B01_view.asp?news_no=3482
- 韓國棋院｜AI 정석 이후：https://www.baduk.or.kr/news/report_view.asp?news_no=5415

## Promotion gate

這份 record **不直接進 learner-facing teaching**。下一步只有在完成：

- representative board / SGF 重建；
- Go-specific technical validation；
- 圖形與文字授權確認；
- 每個案例至少一個能推翻錯誤敘事的對照／negative example；
- 不依賴 AI 數值也能說清楚的 learner-facing explanation；

之後，才能把單一案例升為 teaching asset candidate。

## Stop rule

若一個案例最後只能表達「AI 說這手比較好」，但不能指出可觀察的棋盤線索或條件，就不升格為教學內容；保留為歷史／研究註記即可。
