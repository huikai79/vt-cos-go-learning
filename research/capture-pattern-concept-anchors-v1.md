# Research Record｜Capture Pattern Concept Anchors v1

- researchId: `capture-pattern-concept-anchors-v1`
- question: 如何把中文初學教材中的「雙打吃、門吃、抱吃」轉成可驗證的教學候選，而不把教材章節名稱直接升格為 KC，也不強迫建立錯誤的跨語一對一翻譯？
- decisionUse: 決定下一批 Capture & Semeai Track 內容；先建立 Concept Anchor／term relation，再只升格可由棋盤事實驗證的 Teaching Candidate。
- scope: beginner capture patterns；中文來源為主，只在跨語資料能改變概念邊界時查日文／英文；不處理正式 KC 效度、正式評量或學習成效。
- accessDate: 2026-09-30
- snapshotVersion: 2
- promotionStatus: `MIXED / DOUBLE_ATARI_TEACHING_CANDIDATE / ENCLOSURE_CAPTURE_TEACHING_CANDIDATE / DOOR_AND_HUG_LABEL_SPLIT_UNKNOWN`
- stopReason: 「雙打吃」已可獨立操作化；「門吃／抱吃」的共同機制也已由四個本站原創、非單純鏡射的 rules-backed fixtures 重建，但目前沒有一個可由棋盤事實穩定判斷的分岔條件把四個 fixtures 分成「門吃」與「抱吃」。因此只升較粗的 `enclosure_capture` Teaching Candidate，兩個中文名稱的 label split 保持 UNKNOWN，不建立兩個 KC。

## Concept Anchor A｜同一手同時打吃兩串彼此分離的對方棋

### 操作定義

一手合法落子後，兩串彼此分離的對方棋同時各自只剩一口氣；這個局部事實可由 rules engine 對落子前後棋串與氣數重算。本輪 `double_atari` Teaching Candidate 固定驗證兩串，不把三串以上的極端局面偷算成同一題型。

### Term relations

| language | term | relationToConcept | usageScope | note |
|---|---|---|---|---|
| zh | 雙打吃／双打吃 | Equivalent | 中文初學吃子術語 | 中國圍棋協會介紹的入門題典將其列為獨立吃子方法；野狐入門材料以「一手同時打吃兩邊」解釋 |
| ja | 両アタリ | Equivalent | 日本棋院入門課程 | 日本棋院把両アタリ列入 9 路入門課程 |
| en | double atari | Equivalent | English beginner exercises | British Go Association 的 Level 2 練習直接使用 “double atari” |

### 能支持什麼

- 這是一個可由棋盤局部事實操作化的 capture pattern；
- 可用原創合成棋形建立 practice-only Teaching Candidate；
- 可把「同時兩串剩一氣」當 task feature。

### 不能支持什麼

- 不代表每次出現 double atari 都必然「吃到一邊」；劫、反提、連接、全局交換或更大反擊可能改變實戰選擇；
- 不證明「雙打吃」應是獨立 KC；
- 不支持由一個 choice practice 推論 retention／transfer。

## Concept Anchor B｜門吃：切斷接應後，對方沿開口延長仍持續只有一口氣

### 操作定義候選

中文入門材料把「門吃／關門吃」描述為：先佔住對方與援兵之間的關鍵點，使目標棋串被迫沿剩餘開口延長；延長後仍只有一口氣，因而不能真正逃脫。

### Term relations

| language | term | relationToConcept | usageScope | note |
|---|---|---|---|---|
| zh | 門吃／关门吃 | Equivalent | 中文初學教材／平台教學 | 中國圍棋協會介紹的題典與野狐入門系列都把它作為獨立初學名稱 |
| ja | — | Unknown | — | 本輪未找到足以證明與單一日文術語一對一等價的來源 |
| en | — | Unknown | — | 本輪未找到足以證明與單一英文術語一對一等價的來源 |

### 尚未升格原因

目前來源足以說明「中文教學中存在這個分類」，也足以提出棋盤驗證方向，但沒有必要把它硬對應成 `geta/net` 或其他單一外語詞。下一步應先用原創棋形驗證「切斷接應 → 唯一延長 → 仍一氣」是否能形成穩定 item family。

## Concept Anchor C｜抱吃：切斷接應後，以另一種局部包圍形讓延長仍不能脫離一氣

### 操作定義候選

野狐入門材料把「抱吃」和門吃列為相近但不同的基本圖，兩者共同要領都是先切斷目標棋與援兵的聯絡；目標棋延長後仍維持只有一口氣。中國圍棋協會介紹的題典也把「抱吃」與「門吃」分開列項。

### Term relations

| language | term | relationToConcept | usageScope | note |
|---|---|---|---|---|
| zh | 抱吃 | Equivalent | 中文初學教材／平台教學 | 可確認是獨立教學名稱 |
| ja | — | Unknown | — | 未驗證單一對應術語 |
| en | — | Unknown | — | 未驗證單一對應術語 |

### 尚未升格原因

現有 documentary evidence 還不足以給出不依賴特定教材圖形的精確形狀邊界。若只因名稱不同就拆成獨立 KC，會造成 taxonomy inflation。先保留 term candidate；若未來原創題組顯示可穩定區分且對 prediction／selection／intervention 有價值，再考慮 model change。

## Source Records

### S1｜中國圍棋協會：入門題典介紹

- locator: https://wqwh.weiqi.org.cn/%E5%9B%B4%E6%A3%8B%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E4%B9%9D%E6%AE%B51-%E5%88%9D%E8%AF%86%EF%BC%9A%E5%85%A5%E9%97%A8%E5%88%B010%E7%BA%A71000%E9%A2%98/
- sourceType: documentary / association site
- supports: 出版物把提吃、抱吃、門吃、倒撲、雙打吃、枷吃、向邊線叫吃、接不歸等列為入門吃子分類；可支持「這些是中文入門教學中實際使用的分類」。
- doesNotSupport: 不提供本專案可直接重製的棋形授權；不能證明每個分類都是獨立 KC。
- licenseRedistribution: UNKNOWN；本專案只保存 locator 與摘要，不複製來源圖文。

### S2｜野狐圍棋：圍棋快速入門（一）雙叫吃

- locator: https://www.foxwq.com/news/listid/id/11325.html
- sourceType: documentary / platform beginner lesson
- supports: 把雙打吃描述為一手同時形成兩個打吃；把雙打吃、門吃／抱吃／枷吃、征子／接不歸、倒撲分成不同策略群。
- doesNotSupport: 不是跨語標準術語權威；不能單獨決定正式 item scoring。
- licenseRedistribution: UNKNOWN；不複製圖形。

### S3｜野狐圍棋：圍棋快速入門（二）關門吃、抱吃和枷吃

- locator: https://foxwq.com/news/listid/id/11326.html
- sourceType: documentary / platform beginner lesson
- supports: 門吃與抱吃都以「切斷目標棋和援兵的聯絡」為核心；兩種示例都呈現目標延長後仍只有一口氣；枷吃被描述為更進階的相關包圍型。
- doesNotSupport: 不足以證明門吃／抱吃與單一日文或英文術語完全等價，也不證明兩者是獨立 KC。
- licenseRedistribution: UNKNOWN；不複製來源圖形。

### S4｜日本棋院：コース別技術指導カリキュラム（例）

- locator: https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html
- sourceType: documentary / national Go association
- supports: 9 路入門課程明列 `両アタリ`、`シチョウ`、`ゲタ` 等；支持両アタリ是日本入門教學中的正式術語。
- doesNotSupport: 不支持把中文門吃／抱吃直接翻成ゲタ或其他單一術語。
- licenseRedistribution: linked/paraphrased only.

### S5｜British Go Association：Certificate Level 2 - Sheet 6

- locator: https://www.britgo.org/files/junior/PuzzleL02S06.pdf
- sourceType: documentary / national Go association exercise sheet
- supports: English beginner material uses “double atari” as the named task.
- doesNotSupport: 不支持門吃／抱吃的英文映射。
- licenseRedistribution: linked/paraphrased only.

## Promotion decision

### ACCEPT AS TEACHING CANDIDATE NOW

`double_atari`：建立一個 Advanced choice practice，使用本站原創合成棋形；規則測試必須證明：
1. 黑棋候選手合法；
2. 落子前兩串白棋彼此分離且各有兩氣；
3. 落子後兩串白棋仍彼此分離且各只剩一氣；
4. 該手不立即提子，避免把「雙打吃」誤做成「一手提兩串」。

learner-facing 文案只說明本題局部結構，不寫成「任何雙打吃都必得其一」。

### KEEP AS TERM / ITEM-FAMILY CANDIDATE

`door_capture`（門吃）與 `hug_capture`（抱吃）的**名稱分岔仍不升格**。本輪新增四個原創 rules-backed fixtures（center／edge × single-stone／two-stone target），全部都驗證同一個較粗機制：

1. 目標棋串落子前有兩口氣；
2. 其中一口氣同時是目標與援兵的連接點；
3. 攻方先佔連接點後，目標只剩唯一延長；
4. 目標延長後仍只有一口氣；
5. 攻方下一手能局部提掉整串。

這四個 fixtures 跨中央／邊線、單子／兩子目標，不只是旋轉或鏡射；但它們的 `sourceLabelCandidate` 全部固定為 `unknown`。目前可安全升格的是共同的 `enclosure_capture` Teaching Candidate，而不是把四題硬分成門吃／抱吃。若之後外部棋理審查能提供可重建、可反證的分岔規則，再另開 versioned label split。

## Counterevidence / failure cases

- 一手同時讓兩串棋只剩一氣，但其中一串可反提、打劫或連接成更大交換：只能叫 double-atari pattern，不能直接寫「必吃」；
- 門吃與抱吃若無法在多個不同原創棋形中穩定區分，兩者應合併為較粗的 enclosure-capture teaching family，而不是硬拆 KC；
- 若跨語只找到近似大類而沒有一對一來源，保留中文原詞與棋形操作定義，不補造翻譯。

## Unknowns / recheck triggers

- 是否能以至少兩個非鏡射原創母題穩定區分門吃與抱吃；
- 中文教學社群以外是否存在對兩者穩定的一對一術語；
- learner data 是否顯示「雙打吃」錯誤能和單純數氣／連斷不足分開；
- 若未來 Teaching Candidate 進 Core、scheduler 或正式 assessment，需重新走 item/scoring/KC Promotion Gate。

## Evidence boundary

這份 record 是 Research / Content Evidence，不更新 learner state、KC、scheduler、正式評量或 mastery。所有公開題目一旦加入 repo 即視為 exposed，只能作 practice／process evidence；formal unseen evaluation 必須另有未公開池。
## v2｜四個原創 fixtures 的 rules-backed 結果

公開驗證資料放在 `enclosure-capture-fixtures.js`，測試在 `tests/enclosure-capture-fixtures.test.cjs`。fixtures 不複製任何外部教材棋形，只用本專案自行設計的座標。共同規則結果如下：

| fixture | 盤面變化軸 | target size | cut 前 | cut 後 | 延長後 | finish | source label |
|---|---|---:|---|---|---|---|---|
| enclosure-center-single-v1 | center / single target | 1 | 2 氣 | 1 氣 | 1 氣 | 提 2 子 | UNKNOWN |
| enclosure-center-chain-v1 | center / two-stone target | 2 | 2 氣 | 1 氣 | 1 氣 | 提 3 子 | UNKNOWN |
| enclosure-edge-single-v1 | edge / single target | 1 | 2 氣 | 1 氣 | 1 氣 | 提 2 子 | UNKNOWN |
| enclosure-edge-chain-v1 | edge / two-stone target | 2 | 2 氣 | 1 氣 | 1 氣 | 提 3 子 | UNKNOWN |

反證也通過：若攻方不是先佔「同時也是連接點」的那口氣，白棋仍可在該點和援兵連成一串並取得至少兩口氣；因此「先切斷援兵」不是裝飾性描述，而是這批 fixtures 的共同必要條件。

### v2 promotion decision

- `double_atari`：維持 Teaching Candidate。
- `enclosure_capture`：新增 Teaching Candidate；learner-facing 先用「包圍吃子」這個中性名稱，教共同機制，不要求背門吃／抱吃名稱。
- `door_capture` / `hug_capture` label split：`UNKNOWN / NOT_PROMOTED`。
- KC：全部維持 `not_promoted`。
- formal unseen：所有公開 fixtures 與 learner item 都已 exposed，不具 formal holdout 資格。

