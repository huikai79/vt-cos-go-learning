# VT-COS｜悟之一手：個人圍棋互動課程

**English name:** `A Move of Insight`

> VT-COS（Vibe Thinking – Cognitive Operating System）旗下的個人圍棋學習原型。

線上版本：[https://huikai.com.kg/vt-cos-go-learning/](https://huikai.com.kg/vt-cos-go-learning/)；GitHub 預設網址 [https://huikai79.github.io/vt-cos-go-learning/](https://huikai79.github.io/vt-cos-go-learning/) 會轉向同一網站。

目前是可運作的個人離線學習原型，尚不是可判定學習成效的正式驗收系統。2026-09-21 已將七天批次升為 `personal-pilot-v3`：八題皆來自使用者舊 R1 自我審查中已看過的 22 題，只檢查操作、七天返回、資料完整性與負擔，`formalEligible=false`。一般原始匯出仍遮蔽公開保留組的答案，但完整題庫與答案已隨 GitHub 原始碼公開；48 題均標記為 `public_source`、`formalHoldoutEligible=false`，整個舊 formal holdout pool 已退役。正式評量若要重啟，必須建立從未公開的新題庫與角色分離流程。現況以[完成矩陣](COMPLETION_MATRIX.md)為準；正式教學停止線見[正式教學閘門](TEACHING_GATE.md)，發布邊界見[公開發布架構](PUBLICATION_ARCHITECTURE.md)。

同日完成導覽、工具說明、首次使用、棋盤鍵盤操作與學習者流水線：側欄區分初級 1–5、中級 6–10、高級 11–15。為避免每題重複佔用版面，主畫面只保留目前行動與兩個入口；完整「先看懂 → 自己作答 → 修正重算 → 延後新題 → 局面應用」流程改由視窗按需查看，一般進課時，每課短講與棋盤示範只在第一次進入該課時自動顯示，關閉後仍可隨時重開。看過狀態與待看狀態都保存在本機，重新載入不會重複打擾或遺失未看短講；但正式完成前一單元並跨入下一單元時，即使曾預覽下一單元，仍會重新開啟該單元短講。完成一課或一個單元後，下一步按鈕仍會明示「進入下一課短講」或「進入第 N 單元短講」；同一課內直接前往下一題。19 課現都有至少兩步、可用「上一步／看下一步」播放的棋盤示範，第 4 單元的直三示範含三步做活／破眼短讀。另有 practice-only「經典眼形探索」，先讓學習者自行找急所，作答後才揭示「直三」，再做換方向、攻守交換與相似反例。探索頁重用既有題目 source of truth，不寫入 KC、scheduler、T2／T3 或 formal evaluation。第 9–19 課以 5×5 縮圖表達局部比較或階段順序，文字明示它們不是唯一全局答案。10 個後續單元另以 9×9 棋盤提供局部觀察點選題，題幹與解說都明示只判定指定局部，避免把教學要點誤當成全局唯一最佳手。匯入單一主線的 9 路 SGF 後可選任意可落子的原局著手重建局部，並保存候選手、預期應手、理由及人工確認紀錄；兩種匯出都帶有重建該手所需的原局面與來源指紋，局部復盤也可另匯出 SGF 交給 KaTrain。課程改為先選單元、再明確點選課程；棋盤每次只有一個 Tab 停駐點，可用方向鍵移動並以 Enter／Space 落子。側欄另顯示可觀察錯誤、SCD 階段、再犯間隔及資料不足原因；同一診斷寫入兩種匯出。有題目真正到期時，首頁才顯示「今日到期」直接入口。工具面板預設先顯示日常練習與棋譜複盤；七天流程試行、複習策略、學習摘要與完整備份則收在「進階設定與資料」，並明示完整 JSON 含本機原始事件與復盤資料。R1a 審查頁已從學習者工具選單移除，只供不同於學習者的外部審查者使用。此介面版號為 `learner-flow-v44`；內容目錄版本為 4；棋盤練習頁為 `live-game-ui-v11`。19 課短講新增按課關鍵詞定義與固定示意圖圖例；劫、真假眼、短讀、官子雙結果、棄／救比較與複盤標記改成更完整的逐步圖，自由棋盤也補上 Pass、死子、面積計分、貼目、簡單劫與 SGF 的白話說明。一般練習的正誤結果以圖示、明確標題與不同背景 banner 區分；題目卡收斂為「題型 · 重點 → 問題」，真正問題使用最高視覺權重並成為換題後焦點，作答說明移到選項下方，純文字選擇題不再保留大面積固定空白。「記住這句」首答前隱藏，非 evaluation 的第一次有效回答後才揭露；個人 pilot 的結果與記憶 cue 遮蔽不受影響。核心學習／操作文字維持 16px 級，並補上 `zh-Hant-TW`、繁中字型 fallback、20px 手機留白、44px 常用控制、visible focus 與安全 CJK 換行基線；metadata 仍保留較低視覺權重。這是工程調整，不代表真人可用性或學習成效已驗證。設計判斷與未解事項見 [前端操作與視覺稽核](UI_UX_AUDIT.md)。

2026-09-26 首頁進一步改成永久 reader-first 學習樞紐：根網址 `/` 不再只服務第一次到訪，也不會因已有進度就自動略過首頁。Hero 仍把完全零基礎的 Core 放在第一主路徑；下一區直接提供「核心課程／進階訓練」兩個入口。Core workspace 以 `#core` 表示，因此課程中重新整理可留在工作區；回到根網址則回首頁。已有 Core 進度時首頁 CTA 改為「繼續核心課程」並顯示上次課名。進階訓練直接連到 `advanced.html`，明示較適合已有規則與小棋盤基礎者、不是第 16 單元，而且目前只作 practice-only。研究來源與 formal teaching／formal evaluation／learning outcome 限制維持預設收合。此修改不碰題目、KC、scoring、scheduler、storage 或 evidence semantics。

這是單人、離線使用的圍棋學習程式；15 單元、19 課、106 題現在定位為 Core Curriculum，不宣稱完成後等同特定 K／段位。另有獨立 `advanced.html` 作 Core 後續進階訓練：保留讀棋／手筋、中盤攻防、官子／全局判斷三條 practice-only 訓練線與 8 個 choice Experience，v2 再加入一個由規則引擎驗證的兩段倒撲棋盤 Response；兩種模式都保存首答與重試但不更新 KC、scheduler、T2／T3 或正式評量，現有初級、中級、高級各五個單元，共 15 單元、19 課、106 題，另有 148 題／43 個母題家族的 Phase 2 變形庫。9×9 人機局另有 `live-eligibility-v1`／`live-scoring-v1`：每個學習者回合先掃描整盤，只把唯一一手提子與 computer-provoked 唯一直接救棋升為 bounded live T3；其餘回合仍保存為 unscored。`learner-evidence-progress-v2` 把課程／延後 T0–T2 與這些 live T3 並列為可重算 evidence state，並顯示資料收集 readiness（是否已掃描、出現 eligible、取得首答與跨局 session）；不輸出 mastery 百分比，也不直接改 scheduler。直接以瀏覽器開啟 `index.html`，不需伺服器。課程包含 28 題棋盤落子、10 題局部棋形點選與 68 題文字選擇；後續單元的點選題只判定題幹指定的局部觀察點，不宣稱為全局最佳手。固定應用探測、9 路 SGF 任意手數局部重建、排程及匯出均可操作；進度以第 7 版 schema 儲存在瀏覽器 `localStorage`。新增的 48 題涵蓋直三做活／破眼及第二眼缺口的補／破，並含非 holdout T2 流程題；錯誤分類只描述可觀察的技能任務結果，不推定心理根因。目前的「七天流程試行」使用已知曝光題，不能當成正式未見、保留、遷移或學習成效證據。

後續功能、基礎變形庫、初級死活題組、自適應複習與真人驗證安排，見 `DESIGN_PLAN.md`。目前保留原有 100 題吃子、連接與救棋，另新增 48 題兩類基礎死活；內容效度仍待獨立審題，這兩類也不等於完整死活課綱。完整承諾與狀態見 [完成矩陣](COMPLETION_MATRIX.md)。

2026-09-20 計畫補充：技能卡視為可依資料修訂的假說；保存題目特徵與歷史版本，以輪替未見題檢查保留與應用。先用兩個技能及固定間隔練習／已核對回饋試行，再比較自適應選題的額外效益。學習成本、保留、遷移分開觀察；市場功能只作參考，個人離線使用範圍照原計畫。詳見 [設計計畫](DESIGN_PLAN.md)與[附件查核](RESEARCH_LEARNING_METRICS.md)。

排序政策採 Minimal Sufficient Policy：正式比較先建立含必要先備、分散提取與簡單交錯選題的強基準，再逐層加入反覆弱點、保留／遷移與有決策價值的診斷。每層都須在相同學習預算下證明增量效益，否則回退；目前固定與候選自適應排程只屬工程方案，尚未取得學習效果證據。有題目到期時首頁會顯示入口，但仍由使用者主動開啟，不會自動打斷新課。

後續課程以「自行嘗試 → 具體回饋 → 關閉答案重建 → 日後新題」為最小流程，依辨識、讀棋與應用需要提供協助。原七階段循環是跨日教學願景；睡眠／休息是支持條件，不設鞏固完成狀態。原判斷只抽樣或主動記錄，先保存再揭露回饋。

## 教學目標

「讓每次失敗留下可用的回饋，以可比較機會中的長期表現，以及未見局面的保留與應用，判斷進步。」實作上把它拆成「需要幾次相關練習，才能在延後的無提示新棋形測驗達標」及「成功經歷多少次相關決策機會才再犯」；兩者作同條件下的流程診斷，不要求逐期改善，主要驗收仍是獨立新題與應用。完成題數只作輔助資訊。

目前「指定棋串的一手提子」與「指定兩串的一手直接連接」已有技能卡及事件資料；這證明資料能保存，不證明技能模型有效。排程已改為每次呈現只以首答更新，重試另記；固定應用探測已保存呈現、未答與中斷分母。SGF 可依原局手數重建可落子的著手並保存復盤資料，但原著仍不能當作經確認的錯誤修正。

「首次作答」指每次開題後的第一個已記錄作答；「首次曝光」另外由題目層級保存。離開未作答的試行題會記為 `unanswered`，下次載入仍未關閉的題目會記為 `interrupted`；兩者都不當成功。這仍只涵蓋兩個試行技能，現有數字不足以判定穩定掌握。

研究核對及計數限制見 [RESEARCH_LEARNING_METRICS.md](RESEARCH_LEARNING_METRICS.md)；正式指標、T0–T3 驗收與可調門檻見 [DESIGN_PLAN.md](DESIGN_PLAN.md)。這些是後續設計，尚未經圍棋學習成效研究驗證。

## 第一單元：氣與吃子

| 課次 | 內容 | 題數 |
|---|---|---:|
| 1 | 中央、邊、角、相連棋串的氣；斜對角不相連 | 5 |
| 2 | 中央、邊、角及兩顆相連棋的提子 | 4 |
| 3 | 被打吃時延長棋串、增加氣 | 1 |

## 第二單元：連與斷

| 課次 | 內容 | 題數 |
|---|---|---:|
| 4 | 辨認直連、斜接與被對方棋子隔開的棋串 | 4 |
| 5 | 找共同空點，落子把兩串棋直接接起來 | 3 |
| 6 | 佔住對方兩串棋的直接連接點 | 3 |

「斷點」題只判定能否阻止對方下一手**從該點直接連接**；對方可能另找路徑。答題以棋盤落子後的棋串關係與共同氣判定。

## 完整課程

| 等級 | 單元 | 每單元題數 |
|---|---|---:|
| 初級 | 氣與吃子、連與斷、禁著與劫、眼與基礎死活、9 路小局 | 10、10、6、14、6 |
| 中級 | 佈局基礎、地與厚勢、攻守與弱棋、死活閱讀、官子與數目 | 各 6 |
| 高級 | 全局方向、戰鬥與棄子、劫爭與劫材、定石與變化、棋譜複盤 | 各 6 |

各單元均有短講、立即作答、提示、答案理由、錯題複習與本機進度。前兩單元採棋盤狀態判定；「禁著與劫」採概念選擇題；簡單劫另有引擎測試，目前未接成連續劫題作答流程；需要連續變化、全局比較或棋譜判讀的內容採有明確理由的選擇題，避免把沒有唯一座標答案的局面誤標為單一正解。詳細對照在 `CURRICULUM.md`。

題目以原創棋形與文字編寫。教材編排參考以下棋協資料，於 2026-09-18 至 19 日查核：

- [日本棋院：入門至初級課程例](https://www.nihonkiin.or.jp/teach/school_teach/digest/11.html)：由 9 路入門、13 路初級到 19 路及初段，涵蓋提子、連斷、禁著、劫、死活、佈局、攻守、官子與詰碁。
- [日本棋院：打吃與救棋](https://www.nihonkiin.or.jp/teach/lesson/school/atari.html)：一口氣為打吃，直線連接可增加棋串的氣，斜對角不形成同一棋串。
- [日本棋院：切斷與連接](https://www.nihonkiin.or.jp/teach/lesson/school/kiritsunagi.html)：辨認沿線連接、斜接與切斷位置。
- [英國圍棋協會：教初學者](https://media-iframe.britgo.org/organisers/handbook/club4)：先教足以開始下棋的規則，初局使用 9 路盤，不宜一次塞入所有細節。
- [英國圍棋協會：先提子](https://britgo.org/capturego)：以先提到棋的一方獲勝，練習基本攻防。

## 字體與版面

使用系統已有的「Noto Sans TC／微軟正黑體」字體序列，不連線下載字體。中文教學與題幹為 16px、次要資訊為 14px、課程與題目標題為 32px／24px；以段落行高和較深文字色維持可讀性。桌面左欄固定於視窗內；手機以單元選單及該單元課程清單導覽，不以長距離橫向滑動選課。

尺度與檢查依據：[Ant Design 字體規範](https://ant.design/docs/spec/font/?locale=en-US)的有限字級、系統字體優先順序；[W3C 中文排版需求](https://w3c.github.io/clreq/)；[WCAG 2.2](https://www.w3.org/TR/wcag/)的文字縮放與窄視窗重排原則。這些是設計參考，尚未宣稱通過完整無障礙稽核。

## 設計邊界

- 原型具備短教學、點選棋盤、即時判定、錯題複習、固定應用探測、5×5／7×7 基礎與過渡棋盤、9×9 完整小棋盤對局，以及 9 路 SGF 可落子著手重建與復盤紀錄匯出。5／7 路只作 practice scaffold；3×3 已退出學習者可玩階段但保留底層相容，9×9 才定位為完整小棋盤對局；三種 active 尺寸都不自動成為正式 T2／T3。完成 9 路局部復盤後可另匯出標準 SGF 交給 KaTrain 開啟；5／7／9 路以 bounded heuristic 練習電腦作零安裝預設；進階 provider 另支援每台裝置自行啟動的 localhost KataGo bridge，以及使用者自架的 Remote HTTP(S) API。GitHub Pages 本身不能執行 KataGo，現行公開部署也沒有共用託管 KataGo endpoint，因此不能把 provider contract 的存在解讀成所有網站訪客都能直接使用 KataGo。
- 題目棋形為教學局面；答題引擎檢查氣、提子、自殺手、簡單劫，並對照題目指定目標。後續若擴充到實戰，需補規則集與棋譜格式。
- 本機瀏覽器可直接使用；沒有網路請求、外部字體或第三方程式庫。
- SGF 匯入只接受單一 9 路主線棋譜，不接受多盤 collection 或分支變化；檔案上限 1,000,000 bytes、10,000 個節點、128 層巢狀。格式錯誤、不合法落子與超限輸入會明確拒絕，不會靜默截斷。

## GitHub 公開邊界

- 公開品牌名稱為 `VT-COS｜悟之一手`；英文名稱為 `VT-COS｜A Move of Insight`。母品牌、產品名、對外說法與視覺使用邊界見 [BRAND.md](BRAND.md)。品牌歸屬不取代 `LICENSE`，也不代表已證明教學成效。

- 本資料夾已建立為獨立公開 repository：[huikai79/vt-cos-go-learning](https://github.com/huikai79/vt-cos-go-learning)。父層 `VT-Workflow` 不在這個 Git 邊界內。
- GitHub Pages 已從 `main`／`/` 發布。帳號層的 `huikai.com.kg` 自訂網域會自動套用到這個 project site；正式 HTTPS 網址與 `github.io` 轉址均已通過完整 Edge UI suite。
- `gtp_logs/` 含本機使用者路徑、硬體及 KataGo 執行資訊，已由本資料夾的 `.gitignore` 排除。個人事件匯出、學習摘要、局部復盤及 R1 審題草稿／回條也預設排除。
- 擁有者已於 2026-09-21 接受題庫、答案與 R1 審題工具公開。題庫來源拆成 `phase2-foundation-bank.js` 的 100 題基礎技巧與 `phase2-life-death-bank.js` 的 48 題基礎死活，再由 `phase2-content.js` 相容組裝。`pool: "holdout"` 僅保留排程與資料相容用途；48 題都帶有公開曝光時間與不得作 formal holdout 的機器可讀標記。
- 公開檔案的機器可讀真相來源是 `release-manifest.json`；完整資料流、發布單位與 fresh-clone 閘門見 [PUBLICATION_ARCHITECTURE.md](PUBLICATION_ARCHITECTURE.md)。

## 授權

本專案以 [MIT License](LICENSE) 發布。品牌名稱與呈現方式見 [BRAND.md](BRAND.md)；MIT 授權適用於程式與文件的重用，不額外建立商標權利。

## 驗證

在本資料夾執行 `node tests/go.test.cjs`，驗證 15 單元、106 題的資料完整性，及棋盤題的氣數、提子、救棋、連接、斷點、基礎死活急所、禁著和簡單劫；執行 `node tests/live-game.test.cjs` 驗證 5／7／9 路 active practice，以及 3×3 legacy 邊界 regression、提子、Pass、計分、續局、SGF round-trip、live evidence UI 接線與 9×9 相容；執行 `node tests/live-evidence.test.cjs` 驗證結果前 eligibility、first response／retry、未答分母、actor provenance、版本隔離與跨局 session；執行 `node tests/learner-progress.test.cjs` 驗證 T0–T2 與 bounded live T3 的描述性 evidence state；執行 `node tests/phase2-content.test.cjs` 驗證 148 題變形庫、公開曝光契約、直三的一至三手結果及第二眼真眼區域；執行 `node tests/sgf.test.cjs`，驗證課程端 9 路 SGF 解析、停一手編號、簡單劫、多盤／分支拒絕及資源上限。Windows 可執行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/repository-boundary.ps1`，檢查獨立 Git 根目錄、workflow、gitlink、symlink 與 reparse point；若有 Chrome 或 Edge，也可執行 `node tests/ui.test.cjs` 驗證主要使用流程與版面。

### Windows 本機 KataGo bridge smoke

Move Provider 的 CI contract 通過後，真正的 Windows KataGo executable 全鏈路仍需在有 KataGo、config 與 model 的本機執行一次：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/katago-bridge-smoke.ps1 `
  -KataGoExe "C:\path\to\katago.exe" `
  -KataGoConfig "C:\path\to\gtp_example.cfg" `
  -KataGoModel "C:\path\to\model.bin.gz"
```

只有腳本輸出 `PASS: Windows KataGo bridge returned ...` 才能把「本機 KataGo bridge 真機 smoke」記為 PASS。缺檔、bridge 未啟動、KataGo failure、HTTP/JSON failure 或超時都維持 FAIL／ERROR，不以 heuristic bot 代替。

2026-09-21 的規則、題庫、排程、SGF、trial、狀態與 Chrome 測試均通過。新增反證測試會比較驗收正答與錯答後的棋盤快照、驗證同題先錯後對仍保留首答錯誤、檢查固定應用呈現分母、v3 至 v6→v7 遷移、兩輪內容插題後的索引保存及保留題匯出遮蔽。這些結果只保留為工程證據。

## 下一步

R0 已通過。R1a 已完成第二套規則實作的 70 題核心唯一解窮舉，外部審查母體涵蓋完整 148 題題庫的 43 個家族代表與全部 48 題公開保留組，合併為 77 題；v4 審查頁只載入去答案資料並分開三項獨立聲明，但尚未取得合格外部回條。舊自我審查草稿使其中 22 題曾被目前使用者直接看過，`personal-pilot-v3` 只從這 22 題選八題作流程試行；GitHub 公開則使全部 48 題退出正式未見池。R1b 的基線／追蹤難度可比性仍未建立。KaTrain 已改用 KataGo 1.18.1 同版本官方設定並補齊桌面 `analysis` 模式所需欄位，GPU 校準快取已保存；固定 9 路局面（黑 D4、白 E4）已由 GTP 回應 `E5`，並由 `analysis` 回傳 JSON，原版桌面程式也已建立分析引擎子程序。這只證明分析工具可用，不證明候選手是唯一教學正解。詳細狀態見 [R1 內容核對](R1_CONTENT_AUDIT.md) 與 [正式教學閘門](TEACHING_GATE.md)。

## 2026-09-24｜SGF 單點復盤語義更新

網站的棋譜功能現明確定位為「單點原著重建」：選任意一手後，先在該手之前的盤面憑記憶下出原著。介面以「與原著一致／不同」描述結果，不再使用一般「答對／答錯」語言；原著只代表棋譜歷史事實，不代表唯一最佳手。此模式固定為 practice，不更新 T2／T3、KC、scheduler 或正式評量。

整盤／連續猜手目前未實作，也不是現階段開發優先項；若真人使用顯示單點操作造成可重複復盤瓶頸，才會以既有 SGF pipeline 做最小連續化實驗，而不是另建第二套棋譜系統。


## 2026-09-26｜經典眼形探索 v1

參考日本棋院基本詰碁的反覆／換色／換方向編排，以及 Go Magic 等網站「短講 → 急所 → 題目」的互動節奏，第 4 單元新增選修探索入口。v1 只使用本專案既有、已版本化的直三與第二眼缺口題，先測教學流程，不新增未經外部審題的名型。名稱在第一手後揭示，之後依序做旋轉、攻守交換與相似反例；此頁固定為 practice-only。這是工程與內容呈現更新，不代表 R1a、真人 usability 或學習成效通過。
