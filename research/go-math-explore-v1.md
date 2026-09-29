# Research Record｜Go × Mathematics Explore v1

- researchId: `go-math-explore-v1`
- question: 圍棋與數學是否有直接關係；哪些關係屬形式數學、認知共通機制、教育 transfer 假說？
- decisionUse: 公開 Explore 閱讀頁；不進 Core curriculum，不改 learner runtime。
- scope: 截至 2026-09-29；優先原始論文、學位論文、期刊摘要與可追溯研究紀錄；中、英、日、韓查詢用於降低單一語言框架偏差。
- learner_runtime_authority: none
- promotion_decision: do_not_promote_to_core
- accessDate: 2026-09-29
- snapshotVersion: 1

## Concept anchors

1. **Formal mathematical relation**：圍棋問題本身可用圖論、組合博弈論、計算複雜度等形式化。
2. **Cognitive overlap**：圍棋任務與空間處理、邏輯推理、模式／分支搜尋等認知操作有實驗或結構線索。
3. **Educational transfer**：圍棋訓練造成數學表現改善；必須以獨立數學 outcome 直接驗證，不能由前兩層推得。
4. **Explicit bridge hypothesis**：把圍棋中的面積、陣列、連通、局部價值等結構顯性轉成數學表示，再測新的無提示數學題；目前是待驗研究設計，不是產品成效。

## Claim records

| claim | status | evidence fit | 不支持 |
|---|---|---|---|
| 一類無條件活棋可用圖論式靜態分析處理 | SOURCE_VERIFIED | Benson 1976 | 不支持「做死活題會提升圖論能力」 |
| 官子可用 combinatorial game theory 的 mean / temperature 分析 | SOURCE_VERIFIED | Kao 2000 | 不支持「練官子會提升一般數學」 |
| 廣義 n×n 圍棋勝負判定為 PSPACE-hard | SOURCE_VERIFIED | Lichtenstein & Sipser 1980 | 不代表普通 19×19 每盤都不可計算 |
| 圍棋布局、中盤、官子在空間／邏輯干擾下呈現不同表現 | SOURCE_VERIFIED | 陳德祐等 2019 | 不支持一般數學能力因果 |
| 圍棋課堂可自然承載計數、數感、乘法、空間活動 | SOURCE_VERIFIED / exploratory | Yu；Wu & Guo | 不等於廣泛數學 transfer |
| 空間訓練平均可對數學產生小幅、條件式 transfer | SOURCE_VERIFIED / non-Go evidence | Hawes et al. meta-analysis | 不能自行補成「Go→spatial→math」 |
| 一般 cognitive training 的 far transfer 很有限 | SOURCE_VERIFIED / boundary evidence | Sala et al. second-order meta-analysis | 不等於證明圍棋完全沒有任何數學教育價值 |
| 學圍棋會提高一般數學能力 | UNKNOWN | 缺直接、足夠的 Go-specific causal learner evidence | 不作產品主張 |

## Johari correction｜2026-09-29

### 開放區
- 圍棋具有可正式數學化的結構。
- 圍棋認知研究支持空間與邏輯推理在特定棋局任務中的作用。
- 一般 far-transfer 文獻要求把近距離與遠距離轉移分開。

### 盲點區（本輪修正）
上一輪把 Chan (2024) 的 `feeble to moderate` 描述得太接近「已觀察到跨域 transfer 強度」。該論文是 **7 位同時熟悉數學與圍棋者的 narrative multiple case study**，核心資料包含參與者對 problem-solving strategies 與 knowledge transfer 的感知／預期。它可支持「雙領域熟手感知到某些策略連結」，不能當成 learner outcome 的 transfer effect size，也不能證明訓練因果。

### 隱藏區
專案 current truth 已要求 Research/Content Evidence 與 Learner Evidence 分離；正式教學仍 BLOCKED、學習成效 NOT_MEASURED。因此此研究若公開，最適合保持 Explore-only，而不是新增 Core 成效承諾。

### 未知區
- Go-only 與 Go + explicit math bridge 相比，是否能提高新的無提示數學題表現？
- 若有增益，是否超過同時間的直接 Math-only 強基準？
- 效果是否能延後保留、跨表徵轉移？

## Counterevidence / boundary

- cognitive-training 文獻顯示 near transfer 與 far transfer 不能混用；控制偏誤後遠距轉移通常很弱。
- spatial-training 統合分析不是 Go-specific evidence。
- Go 課堂中「使用了數學」是活動內容證據，不等於學習後一般數學能力改變。
- 棋手橫斷差異不能自動判為多年圍棋訓練造成。

## Source records

- Benson, D. B. (1976). *Life in the Game of Go*. Information Sciences. https://www.sciencedirect.com/science/article/pii/0020025576900591
- Lichtenstein, D., & Sipser, M. (1980). *GO Is Polynomial-Space Hard*. Journal of the ACM. https://doi.org/10.1145/322186.322201
- Kao, K.-Y. (2000). *Mean and Temperature Search for Go Endgames*. Information Sciences. https://www.sciencedirect.com/science/article/pii/S0020025599000948
- 陳德祐等（2019）。〈圍棋布局、中盤、官子階段之認知能力：當實驗心理學遇上人工智慧〉。https://www.cjpsy.com/academicjournaldetail_tw.php?id=2600
- Yu, Y. *Spatial Thinking and the Learning of Mathematics in the Game of Go*. ERIC record: https://eric.ed.gov/?id=ED669148
- Wu, X., & Guo, X. (2024). *Go Game and Mathematics Learning in Third-Grade Elementary Classrooms: An Explorative Study*. Journal of Go Studies.
- Chan (2024). *Connection between mathematics and Go game problem-solving: a knowledge transfer study*. Hong Kong Baptist University. https://scholars.hkbu.edu.hk/en/studentTheses/connection-between-mathematics-and-go-game-problem-solving-a-know/
- Hawes et al. Spatial training → mathematics meta-analysis, PubMed 35073120. https://pubmed.ncbi.nlm.nih.gov/35073120/
- Sala et al. (2019). *Near and Far Transfer in Cognitive Training*. https://doi.org/10.1525/collabra.203

## Stop reason

目前已有足夠證據回答「直接數學關係」與「不能升格成一般數學成效」；再增加同類來源不太可能改變公開 Explore 頁的邊界。停止擴張，保留 learner outcome 為 UNKNOWN。

## Recheck triggers

- 出現具 active control、pre-registered 或等價嚴謹設計的 Go→mathematics learner study；
- 專案真的實作 Go + Bridge pilot 並取得獨立、無提示、延後數學 outcome；
- 現有核心來源有撤稿、重大更正或版本更新。
