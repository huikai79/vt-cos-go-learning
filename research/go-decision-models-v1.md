# Research Record｜Go Decision Models v1

- researchId: `go-decision-models-v1`
- question: 哪些圍棋棋理可以嚴謹地作為「決策結構」的教學類比，而不把圍棋經驗誤寫成一般人生／商業能力的已證實轉移？
- decisionUse: 為未來「棋盤之外」補充內容建立候選模型；目前不建立 `thinking.html`，不進 Core learner model。
- accessDate: 2026-09-30
- snapshotVersion: 1
- promotion_status: `STRUCTURAL_ANALOGY_CANDIDATES / NOT_TRANSFER_EVIDENCE`

## Core boundary

本 record 只做 **structural analogy**：

> 圍棋局面中存在某種可操作的決策結構，而其他領域可能出現形式相似的問題。

它**不支持**：

> 學會該圍棋概念後，學習者在商業、管理、數學或一般決策中就會自動變好。

若未來要主張 transfer，必須另有新的、無提示、跨情境且可比較的獨立評量。

## Candidate 1｜局部最佳 ≠ 全局最佳

### Go-side anchor

一塊棋局部活得很大，不代表整盤交換有利；局部得到目數，也可能讓對手取得更大的外勢、先手或全局攻擊利益。

### Structural analogy

- local optimization vs global objective；
- 子問題評分不能脫離整體目標函數；
- 局部「成功」可能只是換取另一處更大的成本。

### Teaching requirement

未來案例必須同時呈現：
1. 局部看似成功的候選；
2. 全局後果；
3. 至少一個反例：有時局部最大利益其實就是全局最好，不能把「不要貪局部」變成固定口號。

## Candidate 2｜先手：行動權與回應負擔

### Go-side anchor

日文 `sente`／中文「先手」在技術語境中不只是「先下」，而涉及一手棋是否迫使或強烈要求對手回應，使自己之後仍能轉向別處。日本棋院課程把「先手・後手」與更高階的「先手・主導権」列為獨立學習主題；BGA 也指出 sente 沒有完全精確的英文單字，常以 initiative／move requiring a reply 解釋。

### Structural analogy

- initiative；
- preserving future freedom of action；
- imposed response cost。

### Boundary

暫時**不要**直接寫成經濟學 `option value` 等價。兩者有結構相似，但 option value 有自己的機率、價值與不可逆投資模型；若未來使用，只標「類比」，不標翻譯。

## Candidate 3｜捨石：停止為既有投入追加成本

### Go-side anchor

圍棋的捨石不是「棋子不重要」，而是有些棋子在全局交換中可以被犧牲，以換取先手、外勢、封鎖、攻擊或其他更大的收益。日本棋院出版目錄把「捨て石」本身作為可獨立訓練的技術主題。

### Structural analogy

- sunk-cost-like trap；
- opportunity cost；
- strategic sacrifice。

### Boundary

- 圍棋石子沒有人的權益、法律與不可量化價值，不能把現實犧牲決策簡化成「棋子該棄就棄」；
- `sunk cost` 只適用於「已付出的成本不應單獨決定下一步」這個結構，不代表任何放棄都是理性。

### Teaching requirement

必須用同一棋形比較：
- 繼續救；
- 立即棄；
- 交換後全局差異；
並指出至少一個「其實不能棄」的對照例。

## Candidate 4｜厚勢：未立即兌現的能力

### Go-side anchor

日本棋院入門材料對星位的介紹明確區分：第四線較偏中央影響力、第三線較容易取得實地；較早的日本棋院布石資料也直接討論「厚みと実利のバランス」。中文職業賽解說則常把「厚勢／外勢」與實地對照使用。

### Structural analogy

- latent capability；
- option-generating position；
- capability that affects multiple future exchanges。

### Boundary

不要把厚勢直接稱為「資產」或用單一金錢估值。厚勢的價值高度依賴：
- 對手弱棋；
- 周圍空間；
- 先後手；
- 是否留下切斷／薄味；
- 能否在後續真正利用。

### Teaching requirement

至少需要一組「厚但沒有用好」的反例，避免學生把厚勢理解為自動產生目數。

## Candidate 5｜定石：條件式 heuristic，而不是 universal answer

### Go-side anchor

日本棋院《定石革命》把定石界定為局部上雙方走向互角結果的手順；日本棋院較早布石教材同時強調，定石選擇要配合整體局面。AI 時代大量舊定石被重新評價，更凸顯它是可修訂、受條件限制的知識。

### Structural analogy

- heuristic；
- conditional best practice；
- compressed prior experience。

### Boundary

- 定石不是「照做就對」；
- heuristic 也不表示「可以不計算」；
- AI 改定石不代表所有人類 heuristic 都沒有價值。

## Why these five belong together

五個候選其實共用一個底層問題：

> **不要只問「這一步現在得到什麼」，而要問「它如何改變後續可選行動、全局交換與未來風險」。**

但這只是一個 Go-side abstraction。未來公開內容若要跨到其他領域，每個模型都必須保留：
- 原棋形；
- 操作定義；
- 類比對象；
- 類比失效條件；
- 不具 transfer evidence 的明示標籤。

## Source records

- 日本棋院｜コース別技術指導カリキュラム：https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html
- British Go Association｜Meanings of some Japanese Go Terms：https://www.britgo.org/general/definitions.html
- 日本棋院｜対局のテクニック：序盤　一手目を打つ：https://www.nihonkiin.or.jp/teach/lesson/school/joban01.html
- 日本棋院｜新版 基本布石事典（下巻）：https://www.nihonkiin.or.jp/publishing/books/huseki_ge.html
- 日本棋院｜定石革命：https://www.nihonkiin.or.jp/publishing/books/zhosekikakumei.html
- 日本棋院｜張栩の捨て石詰碁（出版目錄入口）：https://www.nihonkiin.or.jp/publishing/books/kaisetsu.html
- 中國國家體育總局／中國體育報職業賽報導（厚勢／外勢與實地的實戰用法）：https://www.sport.gov.cn/n20001280/n20745751/n20767277/c21528419/content.html

## Highest-value unknowns

1. 哪些模型能找到一個對初學者足夠簡單、又不失真的棋形？
2. 「先手 ↔ initiative」與「厚勢 ↔ latent capability」是否能在不引入過多外部術語下自然解釋？
3. 捨石類比最容易被濫用；是否能設計明確的「不能棄」反例來限制過度泛化？
4. 這些內容放進現有 Advanced 的概念卡，是否比另開 `thinking.html` 更清楚？

## Promotion / page-split gate

暫不建立 `thinking.html`。

只有在至少 3 個候選模型各自具備：
- validated board example；
- learner-facing explanation；
- contrast / failure case；
- 明確的 analogy boundary；

而且它們共同回答一個獨立於 Core／Advanced 的使用者問題時，才重新評估獨立頁。否則保留為既有課程旁的延伸閱讀模組。

## Stop rule

如果增加現代管理／經濟學名詞只讓內容更漂亮，卻沒有幫助學習者更準確讀棋，就刪除該類比。棋盤理解優先於跨領域包裝。
