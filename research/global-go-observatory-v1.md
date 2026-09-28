# Global Go Observatory v0.1｜Research Record

- record_version: `global-go-observatory-v1`
- checked_at: `2026-09-28`
- publication_target: `global-go-observatory.html`
- authority: Research / public context only
- learner_runtime_authority: none
- promotion_status: public research page only; not promoted into KC, item, scoring, scheduler, mastery, T2/T3, or formal evaluation

## 問題與成功條件

目的不是建立一個「世界圍棋總排名」，而是把各國可公開查核的圍棋人口與活動資料依統計口徑分開，讓讀者知道：
1. 哪些資料可以直接跨國比較；
2. 哪些只能作國家內部或量級參考；
3. 哪些國家目前仍應保留 UNKNOWN。

## Metric anchors

- G2 Learning Flow：一年內新學／正在接受系統訓練的人。
- G3 Annual Participation：一年內至少實際參與一次圍棋。
- G4 Organized Players：協會會員、段級位、持證棋手等行政人口。
- G5 Competitive Active：同一正式賽事資料庫中的年度活躍棋手。

不同 metric 不進同一排行榜。只有 EGD 的 G5 使用同源同口徑排名。

## Research records

| ID | 地區 | 類型 | 時期 | 來源／locator | 支持 | 不支持 |
|---|---|---|---|---|---|---|
| GGO-01 | Europe | 賽事資料庫 | 2025 | https://europeangodatabase.eu/EGD/Stats_Country.php | 各國 EGD 年度 active players 的同源比較 | 全國玩家人口、學棋人口 |
| GGO-02 | China | 協會主席公開估算 | 2024 | https://www.news.cn/sports/20241109/41d478433bfd45e6a94628d8f3f3002c/c.html | 約 200 萬／年學棋、歷史高峰約 300 萬／年 | 全國概率抽樣、精確年度註冊人口 |
| GGO-03 | Korea | 委託全國調查摘要 | 2023 | https://kbaduk.or.kr/bbs/view/basic/press_release/28/www.kbaduk.or.kr | 約 883 萬會下棋、約 20%；60+ 約 31.2% | 當年正在學棋、固定參賽人口 |
| GGO-04 | Japan | 全國 leisure survey | 2025 | https://www.jpc-net.jp/research/detail/008138.html | 15–79 歲年度圍棋參與率；有效樣本 3,279 | 15 歲以下、80 歲以上全人口 |
| GGO-05 | Taiwan | 協會行政紀錄 | 2023-11-11 | https://www.weiqi.org.tw/Weiqi/AssGuide/AssGuideView | 28,800 名業餘段位棋士 | 目前活躍人口、所有學棋者 |
| GGO-06 | Taiwan / HJJ GO | 單一教育系統案例 | 2025 report | https://www.nihonkiin.or.jp/news/release/7_1.html | 35 教室、約 8,000 名學生、>25,000 付費會員 | 全臺灣學棋人口 |
| GGO-07 | Singapore | 國家協會自報 | current page checked 2026-09-28 | https://weiqi.org.sg/about-us/ | 每年訓練 >3,000 學生；協會稱社群 >200,000 | 獨立人口抽樣 |
| GGO-08 | Thailand | 國家協會估計 | 2024-09-04 | https://www.thaigo.org/เปิดงานวิจัยหมากล้อม-สู/ | 協會稱玩家 >2,000,000 | 可直接與韓國全國調查相比的精確人口 |
| GGO-09 | France | 協會行政紀錄 | 2025 | https://ffg.jeudego.org/ | 1,457 持證會員、280 青年棋手 | 法國所有玩家人口 |
| GGO-10 | Malaysia | 協會現況頁 | checked 2026-09-28 | https://www.weiqi.org.my/en | 協會與近期活動仍存在 | 現行全國玩家／學員人口；本輪維持 UNKNOWN |

## Source independence / duplicate control

- 同一協會的不同語言鏡像、新聞轉載或由同一底層調查產生的頁面，不重複計為獨立證據。
- EGD 各國頁是同一資料庫的不同 country slice；其價值在統一口徑，不因頁面數增加而提高「獨立來源數」。
- HJJ GO 數字只作單一教育系統案例，不和中華民國圍棋協會段位人口合併成全臺人口。

## License / redistribution

本頁只發布短篇事實摘要、數值、來源名稱與連結，不複製外部報告、文章、圖表或題庫。若後續要匯入外部圖表、原始資料檔或可重製資產，必須另做 license gate；目前 v0.1 不包含這類資產。

## Research → Teaching Promotion decision

**不升格。** 這些資料回答全球圍棋生態與市場／文化背景，不直接回答本站某題棋理是否正確、學習者是否掌握技能、哪個 scheduler 較好，亦不應改 learner state。頁面必須保持與 Learner Evidence 分離。

## Known unknowns

- 各國「圍棋人口」缺乏統一國際年度調查。
- 馬來西亞現行全國人口未找到可比數字，保持 UNKNOWN。
- 泰國、新加坡的廣義玩家／社群數為協會自報，方法透明度低於概率抽樣。
- 日本 1.0% 是 15–79 歲年度參與率，不應擴成全人口估計。
- 第一版不建立加權總分、國家 tier 或「圍棋生命力」綜合排名。

## Rollback

若任一核心數字被來源修正、定義不符或無法重現：
1. 先將該卡標為 UNKNOWN／待核對，不以其他來源猜值；
2. 更新此 Research Record 與公開頁；
3. 若整頁需要撤回，只需移除 `global-go-observatory.html`、其 CSS、首頁入口與 release manifest 項目；不涉及任何 learner storage migration。
