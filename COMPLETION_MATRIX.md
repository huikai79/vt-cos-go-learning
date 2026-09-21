# 完成矩陣：一手一懂

更新日期：2026-09-21  
用途：將產品承諾、現有實作、自動驗證與證據邊界分開記錄。此表的「工程通過」只表示指定程式行為可運作，不表示內容正確、初學者可理解或學習有效。

## Current Status

- `as_of`: 2026-09-21
- `claim_mode`: `personal_descriptive`
- `trial_protocol`: `personal-pilot-v3`
- `r1_protocol`: `go-r1-independent-content-review-v4`
- `ui_version`: `learner-flow-v29`
- `storage_schema`: 7
- `content_catalog_version`: 3
- `formal_evaluation_available`: false
- `formal_holdout_pool_status`: `retired_due_to_publication`
- `public_source_exposure`: 48 題公開保留組全部已公開，均不得再作 formal holdout
- `known_current_learner_direct_exposure`: 舊 R1 自我審查草稿中的 22 題；現行 pilot 八題全包含在內
- `r1a_content_review`: 待不同於學習者、且未參與編題的外部審查者
- `r1b_parallel_form_comparability`: 未建立

## 使用規則

- 每次新增或完成一項工作，都必須更新本表的實作、驗證與狀態。
- 只有同時存在實作與相稱證據時，才能標示「已通過」。
- 內容審查、真人可用性與學習成效必須保留各自的待驗狀態，不能由自動測試升格。

| 承諾 | 現況與實作 | 已有驗證 | 證據等級 | 狀態 |
|---|---|---|---|---|
| 離線個人課程 | 15 單元、19 課、106 題；直接開啟 `index.html` | 課程與 Chrome 流程測試 | 工程 | 條件通過 |
| 全課程短講與示範 | 19 課都有文字短講及至少兩步棋盤示範；每課只在首次進入時自動開啟，之後可手動重看；中高級縮圖明示為局部比較或階段示意 | `lesson-content.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；棋理適切性與是否幫助理解仍待外部審查及真人觀察 |
| 多題互動練習 | 28 題為棋盤數氣／連接／落子、10 題為局部棋形點選、68 題為文字選擇 | 規則與內容結構測試 | 工程 | 條件通過；局部點選只檢查題幹指定的觀察點，後續全局判斷深度仍待外部審查與真人觀察 |
| 基礎吃子／死活變形庫 | 原有 100 題吃子、連接與救棋，加上 48 題兩類基礎死活，共 148 題、43 個母題家族 | `phase2-content.test.cjs`、一至三手規則與真眼區域驗證 | 工程 | 條件通過；兩類死活內容仍待獨立審題，不代表完整死活課綱 |
| 失敗後的同類修正 | 已依技能首答結果產生可觀察的任務錯誤類型；不推定粗心、誤解等心理根因 | `learning-metrics.test.cjs`、`app-state.test.cjs`、`scheduler.test.cjs` | 工程 | 條件通過；分類效度仍待內容與真人資料檢驗 |
| 穩定修正距離與再犯間隔 | 已由合格、無提示機會重算；SCD 須通過約 24 小時與 7 天的非 holdout T2，正式變形庫已有 T2 流程題；介面及兩種匯出均顯示資料不足或目前下限 | `learning-metrics.test.cjs`、`app-state.test.cjs`、UI 測試 | 工程 | 條件通過；尚無真人延後結果，指標效度未驗 |
| 延後與未見題 | 一般匯出仍遮蔽公開保留組答案；48 題原 formal holdout 已因公開原始碼全部退役 | 排程、狀態、試行、公開契約與 UI 測試 | 工程 | 流程條件通過；正式未見驗收須另建從未公開的新題庫 |
| standardized T3 固定應用探測 | 5 個減少技能線索的固定局面；Evidence Taxonomy v2 以 `evaluationContext=standardized` 與 live T3 分開 | SGF、試行、UI 與 evidence-taxonomy contract 測試 | 工程 | 條件通過；只支持既定局部 scoring contract，不代表全局判斷或 live 實戰遷移 |
| SGF 實戰回流 | 可選單一主線 9 路棋譜的任意可落子著手、保存原判斷並匯出 KaTrain 交接 SGF | `sgf.test.cjs`、狀態與 UI 測試 | 工程 | 條件通過；pass 不建立落子題，且未確認錯誤原因或最佳手 |
| KaTrain／KataGo 分析 | KaTrain 1.20.0 可啟動；封裝內含 KataGo 1.18.1、38 MB 模型與 OpenCL GPU；網頁可匯出交接 SGF | 同版本設定已補齊 KaTrain `analysis` 必填欄位；9 路固定局面經 GTP 回應 `E5`，並由 `analysis` 回傳 JSON；原版桌面程式已建立 `katago.exe analysis` 子程序 | 外部工具 | 工具層通過；輸出是搜尋估計，仍需使用者對實戰局面確認教學結論 |
| 首頁下一步清楚 | 可繼續課程、錯題與工具入口；只有確實有題目到期時顯示「今日到期」及數量 | `app-state.test.cjs`、UI 測試 | 工程 | 條件通過；是否容易理解仍待真人觀察 |
| 跨課短講銜接 | 同課前往下一題；跨課或跨單元時按鈕明示短講；未看過的課自動開啟短講視窗，已看過的課直接進題並保留重看入口 | 狀態與 UI 測試 | 工程 | 條件通過；真人是否感覺自然仍待最後觀察 |
| R1a 內容審題操作 | reviewer-only 77 題母體覆蓋完整 148 題題庫的 43 家族代表與全部 48 題公開保留組；學習頁不再提供入口，審查頁只載入去答案資料，三項獨立聲明分開 | `r1-content-audit.test.cjs`、UI 測試 | 工程 | v4 答案盲審流程條件通過；外部回條仍待不同於學習者的審查者完成，且結果不恢復 formal holdout 資格 |
| R1a 棋理與構念核對 | 核心 70 題有獨立規則窮舉，完整題庫有目標型規則驗證及 77 題審查母體 | 結構驗證 | 單一外部內容審查 | 待外部審查；通過也只代表單一審查證據 |
| R1b 平行題可比性 | 基線與追蹤在已知結構特徵上配對 | 結構比對 | 真人難度資料 | 未建立；不得由 R1a 自動升格 |
| 初學者使用順手 | 有導覽、鍵盤與窄版工程檢查 | UI 測試 | 真人可用性 | 待短任務觀察 |
| 正式教學使用閘門 | R1a、三位初學者關鍵任務及真人無障礙 spot check 分開驗證 | `teaching-gate.test.cjs`、`teaching-gate-verify.cjs` | 外部內容與真人證據 | BLOCKED；缺 R1a 外部回條、初學者觀察及真人無障礙證據 |
| 個人七天流程試行 | `personal-pilot-v3` 使用舊 R1 已曝光題，只檢查資料、返回與負擔；v1／v2 保留為 legacy | trial、狀態與 UI 測試 | 個人描述 | 工程通過；`formalEligible=false` |
| 學習成效與排程增益 | 有試行資料管線與 Minimal Sufficient Policy 設計 | 試行流程測試 | 學習成效 | 未量測；個人單機正式驗收停用 |

## 目前執行順序

1. Completion Truth P0–P3：已完成工程驗證。
2. Evidence Boundary P0：個人 pilot v3、22 題直接曝光、48 題公開來源曝光、formal holdout pool 退役及一般匯出遮蔽已完成。
3. Evidence Boundary P1：R1 已從學習者介面隔離；v4 審查頁只載入去答案資料，三項獨立聲明與回條驗證分開。
4. Evidence Boundary P2：同步現況文件與回歸測試。
5. Demonstration Coverage P0–P2：19 課逐步棋盤示範、內容結構檢查與介面回歸已完成。
6. Interaction Coverage P0–P2：第 5–14 單元局部棋形點選、內容邊界與介面回歸已完成。
7. 依 `TEACHING_GATE.md` 收集外部 R1a 回條、三位初學者關鍵任務及真人無障礙證據；R1b 與新 private holdout 另屬正式評量，不以工程測試代替。
