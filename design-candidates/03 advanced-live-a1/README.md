# Practice Lab A1：Advanced × Live Board

> `NON_NORMATIVE_DESIGN_CANDIDATE` · 2026-10-04
>
> 本包以 production `advanced.html`、`live-game.html`、現行 JS/CSS、16 份相關契約測試、`COMPLETION_MATRIX.md`、`TEACHING_GATE.md`、`EXECUTION_PIPELINE.md`、`DESIGN_PLAN.md`、`ARCHITECTURE.md`、`RESEARCH_LEARNING_METRICS.md`、`UI_UX_AUDIT.md` 與 `BRAND.md` 為基準。它不修改 production，不讀寫 localStorage／sessionStorage／cookie，不呼叫 provider，不保存棋局或 learner event，也不改規則、首答、曝光、scoring、scheduler、KC、storage schema 或 formal eligibility。

## 一句話判斷

兩頁最值得共用的不是一套卡片外觀，而是「每個判斷留下可回看、不可偷換權限的痕跡」；Advanced 保護首答／曝光／延後語義，Live 保護規則／actor／終局確認，兩者可共享 Practice Lab 品牌與 craft，不能共享證據分數。

## 三點要點

1. **現行行為契約強、資訊架構弱：** 173 項相關契約全數通過；主要問題是 `advanced.html` 把多種生命週期堆成一條長頁，`live-game.html` 則把開局設定、對局與終局放在同一密度層。
2. **候選以 decision lifecycle 作招牌：** Advanced 的第一反應墨跡、原著遮罩與 return queue；Live 的尺寸 aperture、落子回饋波與人工終局確認，都是由真實規則長出的互動，不是裝飾。
3. **目前只可批准方向：** 瀏覽器、reflow、no-write 與互動狀態為 `PASS`；真人 comprehension、screen reader、真實 provider、production performance、獎項評審與學習成效仍未驗證。

---

## 最新判斷：Johari 缺口與必要認知操作

### 開放區：檔案與測試共同支持

- `advanced.html` 不是 Core 第 16 單元；三條 choice track、八個 rules-backed sequence、19×19 SGF decision review、多組 immediate／24h／7d public comparable practice 與 evidence export 已存在。
- Advanced 的 first response、retry、hint、exposure、same-position replay、immediate different position、24h 與 7d 是不同事件語義；公開／已曝光題全部不能冒充 formal unseen。
- `live-game.html` 支援 5／7／9／19 路、local／computer、human color、Pass、undo、resign、人工死子、中國式面積、SGF round-trip、local persistence 與 optional provider。
- Live 的規則 authority 是 `go.js`／`live-game.js`；provider 只能提出候選，失敗必須保持失敗。19×19 不取得既有 9×9 live T3 authority。
- 16 份相關測試檔共 173 項 `PASS`；只支持現行工程／內容邊界 contract。

### 盲點區：把兩頁與實際生命週期並排後才顯現

- 上一組 Explore 頁面的 `read-only` 方法不可直接搬來：Advanced 與 Live 都會寫本機事件／棋局，並有 import／export；候選本身應 no-write，但 Business Rules 必須忠實建模 production writes。
- `advanced.html` 的長頁並不是單純「內容很多」，而是 choice practice、multi-step response、masked review、same-position replay、immediate comparison、delayed comparison 與 export 都被排成相近層級，讀者必須自己辨識生命週期。
- Live 的 5／7／9／19 看似清楚，但尺寸本身很容易被視覺做成能力階梯；現行文案已阻止此推論，視覺系統也必須阻止。
- Award 式 motion 若只強化揭幕、勝負或 19×19 尺度，反而會把原著、結果或大棋盤誤升格成權威。

### 隱藏區：repository 已具備、但畫面尚未把價值放到第一層

- Advanced 最有辨識度的產品資產不是題量，而是「首答不可被 retry 覆寫」與「不同 return type 不可互相冒充」。
- Live 最有辨識度的產品資產不是 AI 對手，而是「rules decide legality、provider only proposes」與「系統不自動判死活」。
- 兩頁可以用同一品牌敘事串起：Advanced 練一個決策的結構，Live 承接一盤棋裡的連續決策；但資料 store、eligibility 與 authority 必須保持分離。

### 未知區：目前不能靠模型自評補完

- 16–20 歲目標讀者能否在 30 秒內分清 Core、Advanced、自由棋盤與局面應用。
- 第一反應墨跡、原著遮罩、return queue 與尺寸 aperture 是否被真人正確理解，而非看成分數、答案或等級。
- 真人鍵盤／螢幕閱讀器使用者是否能掌握棋盤焦點、status 更新、死子切換與錯誤恢復。
- production runtime 接上候選 shell 後的載入成本、低階裝置棋盤流暢度、provider 失敗可見性與 local persistence 恢復。
- Awwwards、Webby、FWA 評審是否認為此種 evidence-aware restraint 足以構成得獎體驗。

### 最可能出錯的位置

最可能的錯誤不是「視覺不夠華麗」，而是把一個狀態的視覺高潮誤寫成另一種權限：把 retry 答對變成首答正確、把原著手變成標準答案、把同局重做變成未見遷移、把 19×19 變成 T3、把人工終局結果變成棋力或學習成效。

### 只採用四個高資訊增益操作

1. **對照（contrast）：** Advanced 與 Live 共享 Practice Lab shell，但逐項對照 response、authority、storage、failure 與 outcome，決定哪些不可共用。
2. **反證（falsification）：** 實際先錯後對、先候選後揭露、未到期、provider failure、兩次 Pass／爭議續局；如果 UI 仍能保持語義，方向才成立。
3. **逆推（backward reasoning）：** 從「離開畫面時必須知道的下一個合法動作」反推每張畫面的主 CTA、status 與 disclosure，而不是先堆 component。
4. **邊界測試（boundary testing）：** 320／375px、200% equivalent、reduced motion、no-write、5／7／9／19、首答／retry 與 marked／unmarked score 均納入 verifier。

沒有再加入更多模型；抽象化已由「decision lifecycle」完成，再增加類比或流程不會改變核心結論。

## 必要修正與新增洞見

- **修正前提：** Advanced 與 Live 都是「Practice」，可直接合成一種畫面與一種紀錄。
  - **修正原因：** 兩者只有 task label 相同；Advanced 有 choice／sequence／review／comparable streams，Live 有 game／practice／bounded 9×9 assessment，authority 不同。
  - **修正後判斷：** 共用品牌、type、focus、motion grammar 與「判斷留痕」元件；保留 route、store、event、scoring 與 failure boundary。
- **修正前提：** 進階頁的主要問題是題目太多、需要更多分類卡。
  - **修正原因：** 真正摩擦是不同生命週期視覺等權；再加卡只會增加長度。
  - **修正後判斷：** 入口先選瓶頸；作答時只呈現當前 decision；replay／immediate／delayed 集中成 Return Queue。
- **修正前提：** 19×19 越有舞台感，越能代表進階。
  - **修正原因：** 19×19 只擴大局面範圍；現行 contract 明確不自動取得 T3、mastery 或 formal authority。
  - **修正後判斷：** 尺寸是 practice aperture，不是 ladder；每次切換都同步顯示用途與停止線。
- **修正前提：** Award quality 需要常駐分析、華麗勝利與大量 motion。
  - **修正原因：** Webby 官方把 content、structure/navigation、visual design、functionality、interactivity、innovation 與 overall experience並列；互動必須讓使用者 give/receive，且技術應退到體驗後方。
  - **修正後判斷：** 每張只保留一個會改變理解或決策的 signature interaction；motion 服務 state transition，不能服務權威膨脹。
- **新增洞見：** 「判斷留痕」是一個可以同時處理品牌辨識、學習完整性、錯誤恢復與 motion restraint 的較少機制方案：首答是墨環、原著是解除遮罩、Live move 是回饋波、死子是可撤回叉記。

---

## Business Rules Registry

### Shared Practice Lab rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| PL-01 | `advanced.html` 與 `live-game.html` 保持兩個 root route；不新增第三個 runtime authority | existing IA／stores | 共用 visual family，不合併 runtime |
| PL-02 | 公開第一次品牌露出同時顯示 `VT-COS｜悟之一手` | `BRAND.md` | W1／W4 完整 lockup；後續可簡稱 |
| PL-03 | 前台使用「首答、重試、練習、延後再判」等白話，不暴露 KC／taxonomy／eligibility 內部詞 | `BRAND.md` | user copy 白話；review rail 可保留稽核詞 |
| PL-04 | 任務類型與本題／本局狀態分開；普通正答不把 task type 改成另一層證據 | Task Context v70 | task ribbon／status ribbon 各司其職 |
| PL-05 | Engineering behavior 不升格 content validity、human usability、formal validity 或 learning effect | evidence ladder | 所有結果卡保留停止線 |
| PL-06 | Parser、provider、engine、storage、analysis failure 保持 ERROR／unknown | hard invariant | promotion 不得用空狀態或 fallback 偽裝成功 |
| PL-07 | Color 不單獨表示正誤、authority、dead／alive 或 due | accessibility | icon、文字、border、aria state 同步 |
| PL-08 | Keyboard、touch、320／375px、200%、reduced motion、no horizontal overflow 是 promotion 最低工程門檻 | UI audit | verifier 覆蓋候選條件 |
| PL-09 | Motion 只可說明狀態改變，不可提供 scoring／rules authority | claim discipline | animation end-state 由同一文字與 DOM state 表示 |
| PL-10 | Core 仍是零基礎主要路徑；Advanced／Live 是 sibling practice，不重寫 Core progress | existing IA | header 返回關係固定可達 |

### Advanced rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| AD-01 | Advanced 不是第 16 單元，不顯示級位、mastery 或能力等級 | current HTML／tests | W1 network，不用 ladder／XP |
| AD-02 | Choice、sequence、decision review、replay、comparable、delayed 與 export 保持分流 | event authority | W1／W2／W3 不合成總分 |
| AD-03 | 第一次有效 response 永遠與 retry 分開；eventual correction 不覆寫首答 | hard invariant | W2 ledger 固定第一座標 |
| AD-04 | 首答前不顯示正確點、family 名稱、takeaway 或 Next | cue-control／UI audit | W2 初始 verifier 反證 |
| AD-05 | 合法但不符 task contract 的 sequence move 不推進盤面，可留在同一步重試 | sequence contract | W2 錯誤候選只留下 trace |
| AD-06 | 內建 sequence 任一步 rules／capture／branch 驗證失敗時整區停用 | fail closed | promotion 保留既有 validator |
| AD-07 | Family cue 在完成前隱藏；variant 不可靠單純旋轉或名稱作提示 | v5 cue control | W2 完成後才顯示「枷」 |
| AD-08 | 匯入 19×19 SGF 後，原著手在第一候選前保持遮蔽 | decision review | W3 veil gate |
| AD-09 | 「與原著不同」不是錯手；原著不是唯一最佳手 | review boundary | W3 並置標記，不用紅綠 |
| AD-10 | Learner perspective 必須由使用者明示；未知保持 neutral | R1 review hardening | promotion 保留 perspective selector |
| AD-11 | 棋盤事件候選只描述 rules replay 可確認的事件，不推測錯手、因果或心理 | review tools | W3 不顯示 inferred cause |
| AD-12 | Review package 只攜帶 SGF／視角／選定手數，不匯入歷史 evidence | package contract | package 保持 context-only |
| AD-13 | Same-position replay 必須先證明原著已曝光，且永遠標為已看過／T0 practice | replay contract | W3 queue 第一列 |
| AD-14 | Immediate different-position practice 與 24h／7d delayed practice 分開 | comparable policies | W3 四列 return types |
| AD-15 | Delayed item 到 dueAt 前不得呈現；clock rollback／forged event fail closed | delayed contract | W3 locked／remaining time |
| AD-16 | 24h／7d 是固定 baseline，不是最佳間隔或 retention claim | research limit | queue copy 固定限制 |
| AD-17 | KataGo comparison 只在候選與原著揭露後、兩手不同且 rules／komi 明確時可送出 | comparison contract | W3 optional disclosure |
| AD-18 | KataGo 結果是 bounded search estimate，不產 correct／mastery／transfer | authority boundary | estimate 文案與 action 分離 |
| AD-19 | 19×19 full game track 直接路由 `live-game.html?size=19`，不另建棋盤 runtime | architecture | W1 第四軌是 link |
| AD-20 | Advanced raw event export 與 Core backup 分開；任何壞 store 只污染自身 stream | evidence export | promotion 保留 scoped export／partial health |

### Live Board rules

| ID | Business rule | Source／reason | Candidate enforcement |
|---|---|---|---|
| LV-01 | Active learner sizes 固定 5／7／9／19；3×3 只保留底層 legacy／regression | architecture | W4 只有四尺寸 |
| LV-02 | 5×5=basic、7×7=transitional、9×9=complete small board、19×19=full-board practice；不是能力階梯 | current contract | W4 size aperture＋boundary |
| LV-03 | 9×9 貼目 7.5；5／7 預設 0；19×19 沿用完整棋盤 contract | rules contract | promotion 不由 CSS 猜值 |
| LV-04 | `go.js`／`live-game.js` 是 legality authority；provider 只有候選權 | hard invariant | W5 footer 固定說明 |
| LV-05 | 初學者第一層只選練習電腦／雙人同機與執黑／白 | provider IA | W4 setup 兩個主要決策 |
| LV-06 | 內建電腦是 bounded heuristic，不是 KataGo、棋力模型或最佳手來源 | bot contract | W4 computer boundary |
| LV-07 | KataGo／Remote／endpoint／test 放進預設收合的進階設定 | progressive disclosure | W4 details |
| LV-08 | 不在 learner UI 收集或保存 API key | security／architecture | 候選無 key input |
| LV-09 | Provider timeout／HTTP／JSON／illegal action 保持 ERROR，不 fallback heuristic | provider contract | disclosure 明示；promotion 需 regression |
| LV-10 | 人機時 human／computer actor 分開；雙人同機不猜 learner identity | practice events | W4 mode copy |
| LV-11 | 續局按尺寸隔離；hydrate 由初始盤面＋手順重播，不信任衍生盤面 | persistence contract | W4 local note／promotion invariant |
| LV-12 | Pass、undo、resign 都保存其原操作語義；人機 undo 回到上一個 human decision | runtime contract | W5 三個 action 保留 |
| LV-13 | 兩次連續 Pass 才進人工計分 | scoring lifecycle | W5→W6 transition |
| LV-14 | 死子由使用者以整串標記／取消；系統不自動判死活 | hard invariant | W6 marked/unmarked toggle |
| LV-15 | 終局有爭議時可恢復下棋；確認後才形成結果 | scoring lifecycle | W6 confirm／resume 同層 |
| LV-16 | 中國式面積分開棋子、地、中立點與貼目；認輸結果不得冒充計分結果 | rules contract | W6 score sheet／result scope |
| LV-17 | SGF 匯入尺寸必須與目前尺寸相同；未結束棋局仍可匯出 | SGF contract | W5 tools copy |
| LV-18 | 5／7／19 只寫 unscored practice observation；既有 live T3 只接受 bounded 9×9 opportunity | evidence boundary | W4 尺寸文字分開 |
| LV-19 | 9×9 qualified assessment 必須先決定 eligibility 再看結果；未答仍留 denominator | live evidence contract | promotion 不以 outcome 倒推 |
| LV-20 | 9×9 first response 包含非法首答；retry 不覆寫；局部 success 不等於全局最佳手 | live evidence contract | W5 decision copy不顯示全局分數 |
| LV-21 | 19×19 heuristic bot 只保證合法候選，不代表合理棋力 | architecture | W4 19×19 boundary |
| LV-22 | 棋局勝負、完成局數與 SGF 不產生 mastery／formal evaluation／learning effect | evidence ladder | W5／W6 固定 footer |

### Candidate／promotion rules

| ID | Business rule | Candidate status |
|---|---|---|
| CA-01 | 候選本身不得讀寫 learner state、network、cookie 或 storage | `PASS` static scan |
| CA-02 | Candidate control 只模擬 presentation state，不宣稱 rules engine 已執行 | `PASS` review banner／README |
| CA-03 | Promotion 必須保留 production IDs／handlers 或建立明確 mapping，不可重寫 authority | `REQUIRED AFTER APPROVAL` |
| CA-04 | Production critical surface 變更後需更新既有 UI version／change note／tests；是否 refreeze 依 actual asset boundary 判定 | `REQUIRED AFTER APPROVAL` |
| CA-05 | 任何實作都需重跑 Advanced／Live contracts、UI、repository boundary 與相關 release checks | `REQUIRED AFTER APPROVAL` |

### Production route preservation map

| Page | Must preserve | Candidate change scope |
|---|---|---|
| `advanced.html` | Home／Core／9×9／19×19 links；track list；choice workbench；sequence IDs；decision review／package／comparison／replay；all comparable/delayed sections；raw export | IA、presentation、disclosure、motion；不改 event／policy／scorer |
| `live-game.html` | `?size=5/7/9/19`；new game；opponent／color／provider；board／keyboard；Pass／undo／resign；scoring／resume／result；SGF import/export；move log | setup／playing／endgame hierarchy；不改 rules／storage／provider contract |

---

## Sitemap

```text
VT-COS｜悟之一手
├─ Home index.html
│  ├─ Core #core（零基礎主要路徑）
│  ├─ Advanced advanced.html（獨立 practice）
│  └─ Live Board live-game.html?size=N（獨立 practice）
├─ Advanced Practice Lab advanced.html
│  ├─ Orientation／證據邊界
│  ├─ Capability Map
│  │  ├─ 讀棋與手筋
│  │  ├─ 中盤攻防
│  │  ├─ 官子與全局判斷
│  │  └─ 19×19 完整棋局 → live-game.html?size=19
│  ├─ Choice Workbench
│  ├─ Multi-step Board Response
│  ├─ Decision Studio
│  │  ├─ SGF import／perspective／decision point
│  │  ├─ masked candidate → reveal → reflection
│  │  ├─ optional KataGo comparison
│  │  └─ context-only review package
│  ├─ Practice Return Queue
│  │  ├─ same exposed position replay
│  │  ├─ immediate different-position practice
│  │  ├─ ≥24h delayed new position
│  │  └─ ≥7d delayed new position
│  └─ Advanced raw evidence export
└─ Live Board Practice live-game.html?size=5|7|9|19
   ├─ New Game Setup
   │  ├─ board size／purpose
   │  ├─ computer／local
   │  ├─ human color
   │  └─ optional provider disclosure
   ├─ Active Game
   │  ├─ status ribbon
   │  ├─ board／keyboard
   │  ├─ Pass／undo／resign
   │  ├─ move log
   │  └─ SGF／local continuation
   └─ Endgame
      ├─ two-pass transition
      ├─ human dead-group marking
      ├─ area score／komi
      ├─ confirm result or resume play
      └─ SGF export／return to Core
```

不新增 `practice-lab.html`；品牌家族不需要第三個 route 或第三套 runtime。

---

## 5 條核心 User Flow

1. **選擇進階瓶頸 → choice first response → correction**：Home／Core → Advanced → capability map → 題幹／選項 → 保存第一反應 → 正確時比較理由；錯誤時保留 first response、在同題 retry → 完成後 Next。成功條件：首答前無答案／takeaway；retry 不覆寫首答。
2. **Multi-step board response**：Advanced → 棋盤練習 → family cue 隱藏 → learner move → rules＋task contract → 固定 opponent response → learner next move → 完成才揭 family／takeaway。成功條件：每一步 rules-backed；錯誤合法手不推進；validator failure 停題。
3. **19×19 decision review → return queue**：匯入 SGF → 明示視角 → 選決策點 → 原著遮蔽 → 放第一候選／retry → 主動揭露原著 → 留反思／optional bounded engine comparison → 可選 same-position replay；immediate／24h／7d 另按 policy 開放。成功條件：原著不同不等於錯；replay 不等於 unseen；due 前不可呈現。
4. **Live new game → active play**：從 Core／Advanced 進 Live → 選 5／7／9／19 用途 → 選電腦／雙人與顏色 → 可選進階 provider → 新局 → rules-validated move／Pass／undo／resign → local continuation／move log／SGF。成功條件：第一層無 provider 術語；provider failure 不 fallback；尺寸不升格能力。
5. **Two passes → human-confirmed result → recover or export**：Active game → 雙方連續 Pass → 點整串標記死子 → 重算中國式面積／貼目 → 有爭議則恢復下棋；同意才確認結果 → 匯出 SGF／回 Core。成功條件：系統不自動判死活；結果不是學習分數；resume 可達。

---

## 第一批 6 張 Wireframe＋Award Intent

| Wireframe | Page／job | Information hierarchy | Signature interaction | Award Intent summary |
|---|---|---|---|---|
| W1 | Advanced Landing | boundary → capability map → route strip | 選軌只改用途／題型／邊界，不改等級 | 把非線性做成第一個記憶點 |
| W2 | Multi-step Response | task state → question → board → response ledger → feedback | wrong→retry correct 後，first response 墨環仍保留 | 讓第一反應留下不可覆寫的墨跡 |
| W3 | Decision Studio | masked SGF → candidate → reveal → optional estimate → return queue | Veil 解除後並置兩手；四種 return type 不混用 | 把遮蔽—比較—回來再判做成儀式 |
| W4 | Live Setup | purpose → size → opponent／color → optional provider → start | 棋盤尺度像 aperture 展開；用途與停止線同步 | 尺寸不是等級階梯 |
| W5 | Active Game | command/status → board → actions／feedback → log／SGF | 落子只產生低調回饋波、回合與 log 更新 | 讓每一手安靜成為下一個決定 |
| W6 | Mobile Endgame | two passes → mark dead → recount → confirm／resume → result | 人工叉記驅動 recount；爭議永遠可回棋盤 | 把終局做成可撤回的共同確認 |

每張完整 Award Intent 的七個欄位（Memorable Moment、Emotional Intent、Interaction Signature、Visual Opportunity、Restraint、Non-negotiables、Award Risk）已放在 `prototype.html` 對應 review rail，共 42 個欄位。

---

## Award Experience Brief

### Experience thesis

`Every Decision Leaves a Trace／每個判斷都留下痕跡`。

產品不是靠「教更多」或「AI 更強」建立高級感，而是把決策生命週期做得精準、可回看、可撤回：我第一次怎麼想、什麼是後來修正、何時看見原著、何時真的到期、這一手是否合法、誰確認終局。

### Audience

- Primary：完成部分 Core、想練局部讀棋或完整對局的 16–20 歲一般學習者。
- Secondary：有既有 SGF、想做單點複盤的棋友；希望使用 local KataGo／remote service 的進階使用者。
- Not assumed：理解 KC、T0–T3、evidence taxonomy、provider、scoring contract 或 formal evaluation。

### Desired leave-behind

- Advanced：「第一次怎麼想，比最後有沒有改對更值得保留。」
- SGF Review：「原著是比較，不是標準答案。」
- Live：「規則決定能不能下；勝負不等於學會。」
- Endgame：「死子與結果需要確認，有爭議就繼續下。」

### Success criteria

- 30 秒 orientation：能辨認目前是 Advanced choice／board response／SGF review／Live setup／active game／endgame。
- 90 秒 comprehension：能說出當前畫面至少一個不可外推的邊界。
- Decision integrity：wrong→retry correct 後首答不變；原著揭露前不可見；due 前不可開；死子未確認不形成 final result。
- Recovery：provider／storage／parser／analysis failure、爭議終局都有可理解的停止或回復路徑。
- Engineering：320／375px、200%、keyboard、reduced motion、no overflow、no candidate write。

前三項需要真人 task test；自動化不能證明 comprehension。

### Official award calibration

- Webby 2026/2027 Websites & Mobile Sites 公開維度：Content、Structure and Navigation、Visual Design、Functionality、Interactivity、Innovation、Overall Experience。
- Awwwards／FWA 在本報告只作 creative craft 與 memorable interaction 目標；沒有把候選自評成官方得獎門檻通過。
- Sources：<https://www.webbyawards.com/judging-criteria/>、<https://www.awwwards.com/mobile-excellence-guidelines.pdf>、<https://thefwa.com/>。

---

## Creative Direction

### `The Practice Atelier／判斷工房`

- **Advanced／Cobalt Ink：** 像研究手稿與棋譜批註；重點不是答案，而是 first response、retry、reveal 與 return 的層次。
- **Live／Vermilion Wood：** 像現代棋室與記分簿；棋盤有材質與空間重量，控制介面保持安靜。
- **Shared／Forest Authority：** 墨綠只承載品牌、合法流程與 confirmed state；不能被當成「棋理正確」的萬用色。

### Signature grammar

- Ink ring：第一次反應，實心、不覆寫。
- Echo ring：retry，外圈、附著於原 trace 旁。
- Veil：尚不可見的原著資訊；只能由合法生命週期解除。
- Aperture：棋盤尺寸改變可容納的局面範圍，不改能力等級。
- Move pulse：真實 action 完成後的一次回饋，不持續閃爍。
- Human mark：人工死子確認；可以撤回，並驅動 score recount。

### Deliberate restraint

- 不做技能樹、XP、段位、streak、假 mastery percentage。
- 不常駐勝率、AI 熱區、推薦點、聊天導師或「最佳手」標章。
- 不用 scroll-jacking、3D board、石子物理碰撞、勝利彩帶或音效依賴。
- 不把被鎖 delayed item 做成 FOMO；只說何時、為何尚未開放。
- 不用 motion 取代 status text、rules validation 或 aria state。

---

## Visual System

### Tokens

| Role | Token | Use |
|---|---|---|
| Review canvas | `#d8d5cc` | candidate review 外框，不進 production brand |
| Paper | `#f6f1e6`／`#fcfaf4` | question、setup、score surface |
| Ink | `#102a24` | primary text／brand authority |
| Forest | `#123f33` | confirmed workflow／navigation |
| Gold | `#c79b48` | focus／current comparison，不代表 truth |
| Advanced cobalt | `#3b4e80` | Advanced domain、first-response system |
| Live vermilion | `#a94832` | Live action、human confirmation |
| Board wood | `#d5ae68` | board surface；line／stone geometry 仍由 runtime contract 決定 |
| Error／failure | text + icon + border | 不只靠紅色，不與「候選」同義 |

### Type

- Display：`Iowan Old Style／Noto Serif TC／PMingLiU`；承載問題、判斷與結論。
- UI／status：system sans；承載 task type、actor、rules、time、source 與 action。
- Numeric／coordinates：tabular-capable UI face；move、score、due time 對齊。

### Core components

- `Task ribbon`：任務類型＋本題狀態，不畫成線性進度。
- `First-response ledger`：首答座標／狀態／retry boundary。
- `Board stage`：題幹與 response 同 viewport；board geometry 不由裝飾縮放猜測。
- `Decision veil`：原著揭露 gate。
- `Practice return queue`：same exposed／immediate different／24h／7d。
- `Size aperture`：尺寸＋用途＋evidence boundary。
- `Status ribbon`：turn／moves／captures／rules。
- `Consentful score sheet`：dead-group state＋score＋confirm／resume。

### Responsive behavior

- Desktop：board 為主要空間；題幹／response 或 move log 在同一 viewport；Award Intent 只在 candidate review rail。
- Tablet：board 與 task 改單欄，task 先於 board；return queue 由 side rail 轉 2×2。
- Mobile：Question／instruction → board → response／feedback → next；Advanced provider 不展開在主行動前；endgame confirm／resume 保持 44px 級目標。
- 200%：雙欄改單欄；labels wrap；不以縮字保存桌面構圖。
- Reduced motion：直接進 end state；不延遲 status、feedback 或 control enablement。

---

## High-Fi Mockup

單一高擬真來源：[prototype.html](prototype.html)。候選內所有控制只改記憶體 DOM state：

- W1 capability map 選軌。
- W2 wrong→retry correct 並保留 first response。
- W3 first candidate→original reveal→optional estimate gate。
- W4 5／7／9／19 size aperture、opponent／color／provider disclosure。
- W5 落子→turn／move count／log／feedback。
- W6 dead-group mark→score recount→confirm／resume。

實際瀏覽器截圖：

- [desktop-w1.png](desktop-w1.png)
- [desktop-w2.png](desktop-w2.png)
- [desktop-w3.png](desktop-w3.png)
- [desktop-w4.png](desktop-w4.png)
- [desktop-w5.png](desktop-w5.png)
- [mobile-w6.png](mobile-w6.png)

---

## Motion Prototype

| State transition | Motion | Timing | Reduced-motion end state | Meaning boundary |
|---|---|---|---|---|
| W1 track switch | selected card inward 4px、center copy crossfade | 180–240ms | instant replacement | 只改 route description，不是 recommendation score |
| W2 first response | ink ring 0.84→1、ledger appears | 180ms | ring／ledger immediate | ring=first，不等於 correct |
| W2 retry | thinner echo ring、no erasure | 140ms | both rings immediate | retry 不覆寫 first |
| W3 reveal | veil opacity＋scale out、two markers in | 280–360ms | veil gone／markers visible | reveal 不把原著升格答案 |
| W4 size aperture | board frame scale between true sizes | 280ms | selected frame instant | size≠level |
| W5 move | one radial pulse、status/log update | 220–360ms | stone＋last-move ring immediate | pulse 只表示 action accepted |
| W6 dead mark | X strokes appear、score numbers crossfade | 180–240ms | X＋new numbers immediate | user mark drives recount；可撤回 |
| Global failure | no celebratory motion；alert region enters without displacement | ≤120ms | alert immediate | failure 不可被 transition 掩蓋 |

Candidate footer 的「播放目前畫面招牌互動」只播放 focus pulse，避免把模擬 demo 誤當 production rules execution。

---

## Frontend Craft Review

### Production current state

| Dimension | Current assessment | Evidence | Risk |
|---|---|---|---|
| Content／voice | `PASS_WITH_DENSITY_RISK` | 邊界文案精確、術語有解釋 | Advanced 生命週期文字量過長 |
| Structure／navigation | `NEEDS_REFRAME` | routes 完整、功能可達 | Advanced 長頁使 role／due／replay 自行辨識；Live 三階段未分鏡 |
| Visual design | `FUNCTIONAL_NOT_SIGNATURE` | current CSS readable、responsive discipline 已有 | 大量白卡／相近邊框，核心 integrity 資產未成為視覺識別 |
| Functionality | `PASS_ENGINEERING_CONTRACT` | 173 related tests pass | 真實 provider、真人 AT、production performance 尚未由本輪跑 |
| Interactivity | `STRONG_LOGIC_WEAK_STAGING` | first／retry、masked reveal、rules、scoring 都真實 | 互動價值被長頁與設定密度稀釋 |
| Innovation | `CREDIBLE_DIRECTION` | evidence-aware lifecycle 可形成獨特體驗 | 尚未由外部評審或使用者證明有辨識度 |
| Overall experience | `CANDIDATE_READY_FOR_APPROVAL` | 6-view prototype＋browser verifier | 不能宣稱 award-ready／usable until production＋human evidence |

### Candidate gains

- 一個高資訊增益概念同時處理品牌、資訊架構、motion 與 evidence integrity。
- Advanced 從「完整功能列表」改成「現在這個決策＋何時回來」；Live 從「設定＋棋盤＋側欄」改成 Setup／Play／Endgame 三個清楚場景。
- 每張 signature interaction 都能被反證：first 是否保留、veil 是否先開、due 是否偷開、provider 是否 fallback、死子是否自動判、result 是否升格。
- 純 CSS／DOM，沒有外部字型、圖片或 runtime dependency；候選本身無 network／storage write。

### Remaining craft risks before promotion

- Advanced actual DOM 極長；若只套 CSS 而不建立 mode／anchor state，候選層級不會真正成立。
- W2 高擬真棋形只用來展示 lifecycle，不是 production item；promotion 必須由 `advanced-content.js`／rules renderer 提供真棋盤，禁止複製 mock stones 當題目。
- W3 Return Queue 目前是設計聚合層；production 要從各既有 policy/store 純衍生，不能另寫第二套 due state。
- W4 provider disclosure 必須保留既有 setting migration；不可因簡化第一層而遺失 old opponentMode／endpoint。
- W5／W6 的 status 與 score 必須只來自 live runtime；CSS animation 不可提早切 state。
- Candidate 沒有測 Web Vitals、low-bandwidth、真實 screen reader、browser matrix 或 production storage corruption。

### Suggested implementation sequence after approval

1. **Phase A／presentation-only shell：** 建立 Advanced capability modes／anchors、Live Setup／Play／Endgame state wrappers；保留所有 IDs／handlers，先不改事件與資料。
2. **Phase B／decision integrity components：** 將既有 first response、masked review、due policies、provider／score state 映射到 ledger／veil／queue／ribbon；逐 branch 做 negative test。
3. **Phase C／motion＋craft：** 加入 CSS state transitions、reduced-motion、focus／aria-live；跑 full related tests、Edge UI、320–1920、200%、performance budget 與人工視覺檢查。

任一 phase 若需要改 event schema、scheduler、scorer、storage 或 authority，停止並先按 repo change-control 寫規格 change note；本候選不授權這些變更。

---

## 驗證與品質報告

### Automated／browser evidence

| Check | Result | Scope |
|---|---|---|
| Related production contracts | `PASS` · 16 files／173 tests | Advanced lifecycle、comparison、delayed、export、Live rules／geometry／provider |
| Candidate JS syntax | `PASS` | `prototype.js`、`verify-prototype.cjs` |
| Candidate structure | `PASS` | 6 views、6 Award Intents、42 intent fields、0 forms、0 external assets |
| Candidate no-write static guard | `PASS` | no learner/network/storage write tokens in HTML/JS |
| W1 capability map | `PASS` | 4 routes、not Unit 16、track copy switch |
| W2 decision integrity | `PASS` | pre-answer masking、wrong→correct、first=C4 retained、Next gate |
| W3 decision review | `PASS` | original masked、candidate gate、reveal、estimate gate、4 return types |
| W4 setup | `PASS` | 5／7／9／19、19×19 non-T3 boundary、provider progressive disclosure |
| W5 active game | `PASS` | move 18→19、log 4→5、rules／local state visible |
| W6 endgame | `PASS` | dead mark、score recount、confirm、result-not-learning-score |
| Desktop 1440×1000 | `PASS` | W1–W5 no horizontal overflow |
| Mobile 375×900 | `PASS` | W6 phone ≤359px、no overflow |
| Narrow 320×812 | `PASS` | no document overflow；interactive targets ≥44px in candidate review |
| 200% equivalent | `PASS` | 640 CSS px、W2 first-response ledger visible、no overflow |
| Reduced motion | `PASS` | media query active；end state available |
| Screenshot visual review | `PASS_AFTER_CORRECTION` | 6 images inspected；W2 occupied candidate＋programmatic title focus corrected |

Run:

`node "design-candidates/03 advanced-live-a1/verify-prototype.cjs"`

### Visual correction log

1. 首輪 W2 的 C4 錯誤候選環落在既有白棋，和「合法但不符合本題 contract」衝突；移除該示意棋子，讓候選確實為空點。
2. 切換 Wireframe 後主標題因程式 focus 留下橙框，和 production「programmatic focus 不畫裝飾框」不一致；保留 focus target、移除 title visual outline。
3. 重新跑完整 verifier，結果仍 `PASS`，並重產 6 張截圖。
4. 將 320px target gate 從暫時的 40px 收緊為 44px 時，首輪得到 `FAIL: minTarget=42`；追到「匯出 SGF／回課程」次要按鈕的晚載入規則後修成 44px，最終 verifier `PASS`。

### Execution incidents（不隱藏環境錯誤）

- Production Node tests 在 sandbox 內首次為 `ERROR: spawn EPERM`；相同命令在允許 child process 的環境重跑後 173／173 `PASS`。這不是把測試失敗改名，而是先確認錯誤發生在 test runner 建立子行程，之後以相同 test files 完整重跑。
- Candidate browser verifier 在 sandbox 內首次為 `ERROR: CDP Runtime.enable timed out`；改在允許 headless Edge 的環境重跑後 `PASS`。
- 44px 收緊檢查曾有一筆真實 candidate `FAIL`（42px），已修正並以相同 assertion 重跑為 `PASS`。

### External／human evidence still required

| Evidence | Status |
|---|---|
| Target-novice route／status comprehension | `NOT_TESTED` |
| Human keyboard／screen-reader spot check | `NOT_TESTED` |
| Real KataGo bridge／remote provider under candidate UI | `NOT_TESTED` |
| Production Web Vitals／browser matrix／low bandwidth | `NOT_TESTED` |
| Formal teaching／formal evaluation | `BLOCKED` by existing repo gates |
| Learning effect／retention／transfer | `NOT_MEASURED` |
| Awwwards／Webby／FWA jury outcome | `UNKNOWN` |

## 最終驗收

- 新增內容改善的是 decision integrity 與 scene hierarchy，不只是變長。
- 主要反證已顯性化：first/ retry、original/correct、replay/unseen、size/T3、provider/fallback、dead/result。
- 會改變結論的重大未知仍保留在 human comprehension、assistive technology、real provider、production performance 與 external jury。
- 自動測試只被描述為工程證據，沒有升格真人可用性、正式效度、學習成效或 award 證據。
- 沒有為填滿 Johari 或認知操作清單產生額外流程。
- 原任務在「提交可審批的 Registry→Sitemap→Flows→6 Wireframes→Award stack→quality report，且不改 production」範圍內已完成；production 修改等待使用者批准。
