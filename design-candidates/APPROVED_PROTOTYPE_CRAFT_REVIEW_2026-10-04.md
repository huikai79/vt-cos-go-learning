# Approved Prototype Craft Review — 2026-10-04

## 一句話結論

五組已批准 prototype 已完成標題、同屏優先、自然捲動回退與操作距離修正；工程驗收可支持「候選稿在指定 viewport、互動與資料邊界下可用」，但不支持已達成外部獎項、真人可用性或學習成效。

## 本輪共用規則

1. 主標題以語意片語分行；每個 `.title-line` 不允許在容器內再次任意拆字。
2. 桌機主要判斷、回饋與下一步在 1440×1000 且內容完整時盡量落在同一 viewport；若視窗高度不足，先收斂非資訊性留白，再保留自然頁面捲動，不能縮藏證據、警示、狀態或下一步。大量清單保留篩選／分頁，不以無限長頁承載成長。
3. 下一步放在造成狀態變化的控制附近。Classic W3 的 Next 已由左欄移到棋盤下方；手機 Atlas 改為 list→detail 原地切換並提供返回搜尋。
4. Award Intent 保留為評審旁註，不取得產品資料、規則、評分或 learner evidence authority。
5. 截圖改為 `captureBeyondViewport: false`；長截圖不再掩蓋首屏裁切或需要額外捲動的問題。

## 五組結果

| Candidate | 主要修正 | 同屏結果 | 驗證 |
|---|---|---|---|
| `00 index-homepage-a1` | fresh／returning／起點／catalog／method／mobile 標題語意行；Hero、catalog 與手機棋盤密度 | Hero、回訪與主要 CTA 同屏；15 units 與兩個 destination 保持同一 product frame | `PASS` |
| `01 award-experience-a2-integrated` | 六張主標題語意行；最長文字題改為穩定三行；mobile review title 改為兩個完整片語 | 棋盤／判斷／修正、文字題、masked receipt 與 next action 同屏 | `PASS` |
| `02 explore-trilogy-a1` | 六張主標題語意行；Math 窄欄縮放；Global G5 前十列壓到同一 viewport | Evidence lens、transfer bridge 與 G5 十列完整可見 | `PASS` |
| `03 advanced-live-a1` | W3 改為「先留下候選。／再掀開原棋譜。」；六張標題鎖定語意行；workspace／SGF／setup／game 高度收斂 | W2 首答→修正與 W3 候選→揭譜不需離開工作視窗 | `PASS` |
| `04 classic-shapes-a1` | W3 改為「哪個空點，／接觸最多眼位？」；Next 移到棋盤；library 4 欄；mobile Atlas list→detail 原地切換 | W1 選路、W2 12 卡＋分頁、W3 作答→Next；W6 在 1440×1000 同屏，短視窗維持完整自然捲動 | `PASS` |

## 反證與修正紀錄

- 首輪 `00` W1／W2、`02` W3、`04` W6 被新 title-overflow assertion 判為 `FAIL`；縮短文案或調整局部字級後，以同一 assertion 重跑為 `PASS`。
- 首輪 `00` mobile board 為 255px、第二輪 279px，未達既有 280px gate；調整候選外層與手機內距後重跑為 `PASS`。
- 首輪 `01` mobile board 為 267px；恢復手機專用 6px 外層留白後重跑為 `PASS`。
- `03` 首次 sandbox 內執行為 `ERROR: CDP Runtime.enable timed out`；在允許 headless Edge 的環境以同一 verifier 重跑為 `PASS`。
- `04` 一次重跑遇到 Windows `EBUSY: DevToolsActivePort`；未改驗收條件，直接以同一 verifier 重跑為 `PASS`。
- 修正前提：零頁面捲動在所有桌機高度都較好。修正原因：1440×830 的 Atlas 含三層證據、警示與 CTA；強制固定舞台會以資訊完整性換取表面的同屏。修正後判斷：固定舞台只適用於高度足以呈現完整任務的視窗；短桌機先減少留白，必要時以自然頁面捲動保留全部資訊並驗證 CTA 可達。
- 把 1440×830 gate 擴到全部 30 個 view 後，找到首頁 W6、學習 W6、進階 W6 的語意標題行水平溢出；保留原文，只調整短桌機的展示欄寬與標題比例，其中進階 W6 由 `374px scroll / 372px client` 的 2px 溢出修正為同一 gate `PASS`。
- 驗證器原本只結束 Edge 主程序，長時間反覆執行後留下多組 headless 子程序，進而造成除錯埠與 `DevToolsActivePort` 啟動失敗。現改為共用、以每次唯一暫存 profile 精確收尾的清理器，並容忍 marker 建立期間的暫時 `EBUSY`；清除既有專案 verifier 殘留後，Unified、Classic Shapes 與首頁代表性重跑均為 `PASS`，對應專屬程序數皆為 `0`。

## 整站統一候選層（本輪續作）

- 五組 prototype 共用 [prototype-system.css](./prototype-system.css)：統一品牌列、跨區導覽、48px view tabs、墨綠／紙色／金色 token、焦點樣式與 Award Intent 欄。
- 高度至少 920px 的桌機固定為單一工作舞台；`verify-unified-prototypes.cjs` 以 1440×1000 逐頁檢查 5 個 section／30 個 view：body 無垂直捲動、無水平溢出、frame 與 Award Intent 同屏、主要可見控制不越界、跨區連結有效。1440×830 再逐一檢查同一批 30 個 view：body/root 不鎖捲動、frame 不裁內容、標題不溢出、所有可見控制可透過自然頁面或局部容器捲動抵達；Atlas 另深驗三層資料後的警示與 CTA。手機另檢查 375px 水平邊界與區域導覽可滑動。
- 統一 gate 期間找到並修正 00 W6 手機首頁、01 W6 手機體驗、02 W6 Global profiles、03 W5 完整對局、03 W6 終局確認、04 W6 Atlas 的標題／資訊可達性問題；另以「小曲尺」未知分支驗證三層資料、明確未知警示與停用 CTA 不會因預設可練項目而被掩蓋；最後 gate 為 `PASS`。
- 共享外框只影響候選稿；各頁原有五套 verifier 重新執行均為 `PASS`。這些 viewport／互動結果仍是工程證據，不推論真人可用性、學習效果或外部獎項結果。
- 五套 verifier 與整站 gate 共用 [browser-verifier-cleanup.cjs](./browser-verifier-cleanup.cjs)，只比對該次 `mkdtemp` profile 路徑，不終止一般 Edge／Chrome 視窗。

## Award benchmark 的操作化

本輪把「得獎意圖」轉成可檢查行為：概念一致、內容與互動互相支持、動態有因果功能、視覺節制、鍵盤／窄螢幕／reduced motion 不退化、production authority 不被候選覆寫。這是內部 craft benchmark，不是 Awwwards、Webby Awards 或 FWA 的入選／得獎證據。

## 已驗證與未驗證

已驗證：5 組共 30 張 1440×1000 viewport screenshots、30 個 view、30 組 Award Intent、主標題無容器 overflow、30 個 1440×830 view 的完整內容／控制可達性、Atlas 自然捲動下的警示／CTA 專項可達性、Atlas 未知分支的三層資料與停用 CTA、1440／375／320／200%-equivalent reflow、reduced motion、candidate no-write boundary，以及各候選既有互動契約。

未驗證：真人是否更快理解、真機／VoiceOver／NVDA／TalkBack、production Core Web Vitals、公開部署、外部評審結果、formal teaching／evaluation validity、retention、transfer、generalization 與 learning effect。

## 變更邊界

本輪只修改五個 `design-candidates` prototype、共享候選 stylesheet、整站 verifier／各候選 verifier／screenshots 與本報告。Production HTML、CSS、runtime、scoring、scheduler、KC、event、storage、formal eligibility 與歷史 learner evidence 均未修改。
