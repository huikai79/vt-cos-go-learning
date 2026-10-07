# VT-COS｜悟之一手品牌使用

## 品牌層級

- 母品牌：`VT-COS`
- 母品牌全名：`Vibe Thinking – Cognitive Operating System`
- 產品名稱：`悟之一手`
- 英文產品名稱：`A Move of Insight`
- 產品描述：`個人圍棋互動課程`
- 公開中文顯示名稱：`VT-COS｜悟之一手`
- 公開英文顯示名稱：`VT-COS｜A Move of Insight`

## 顯示原則

介面第一次出現產品名稱時，同時顯示 `VT-COS`。後續操作文字可簡稱「悟之一手」，避免母品牌名稱干擾學習流程。英文產品名稱固定為 `A Move of Insight`；需要完整品牌時使用 `VT-COS｜A Move of Insight`。網址、repository 名稱與既有 runtime／資料契約不因品牌改名而變更。

現有黑白棋子圖示、墨綠與暖金配色保留為本產品識別。目前沒有可核實的 VT-COS 正式 logo、標準字、色票或註冊商標規範，因此不自行創造或宣稱這些資產。

## 2026-10-08｜前台 lockup 呈現契約

本節是目前產品前台的實作契約，不宣稱新增 VT-COS 的正式 logo、標準字或商標規範。

- 第一個可見的產品 lockup 必須同時出現文字 `VT-COS｜悟之一手`；`aria-label` 也使用完整名稱。後續按鈕、課程狀態與閱讀文案可簡稱「悟之一手」。
- 圖像採同一個「深色棋子與淺色棋子重疊」結構。淺色 header 使用墨綠／紙白；Core 深色側欄使用帶淺色邊界的深石／紙白；首頁與 Live Game 使用同一結構的 compact lockup。這些是為背景對比而設的明暗 variants，不再用不同幾何圖樣暗示不同產品。
- Explore 的上層 header 只負責全站入口（首頁、核心課程、進階訓練）；其下方深色 context nav 才負責歷史鏡片、數學關係與全球觀察，避免同一 Explore 目的地在兩層重複。

變更：以共用 `experience-mark`／`experience-topbar` 呈現三個 Explore 頁、Core 側欄、首頁與 Live Game lockup。為何現在：人工截圖顯示同一產品在相鄰頁面使用不同 mark 結構、色彩與名稱層級，會放大導航切換成本。歷史語意：不改 learner records、事件、內容、評分、課程路由或正式資格。遷移：純 HTML/CSS presentation；既有連結 destination 不變。rollback：還原這些 lockup class 與文字即可，無資料回寫。驗證：以瀏覽器檢查完整名稱、共享全站路由、唯一 context current 與不同背景下的可見性；這不構成商標、真人 usability 或 accessibility 成效證據。

## 學習者前台語言

主要學習介面的預設讀者為 16～20 歲一般學習者。文字應優先使用短句、日常動詞與具體結果，讓第一次看到的人不需要理解研究或工程背景也能知道「現在要做什麼、這代表什麼、下一步是什麼」。

- 圍棋本身需要學會的術語可以保留，例如氣、提子、死活、手筋、官子、急所、劫；第一次出現時依需要補最短說明。
- SGF、KataGo、KaTrain、API 等使用者可能實際接觸的外部名稱可以保留，必要時補中文用途。
- KC、scheduler、T0–T3、family、seed、variant、contract、mastery、eligibility、taxonomy 等內部資料模型、研究標記或工程詞，不直接作為一般學習者介面文案；應改寫成使用者能理解的功能或結果。
- 不因白話化刪除重要限制。若某項紀錄只供練習、不能代表棋力或不能納入正式評量，仍須清楚說明。
- 程式變數、事件欄位、schema、測試名稱、檔名與內部資料契約保持原名；前台自然化不得改變其語義或行為。

## 對外說法

可描述為「VT-COS 旗下的個人圍棋學習原型」或「A VT-COS learning prototype」。不得把工程測試、品牌歸屬或公開發布描述成已證明教學成效。

品牌歸屬與軟體授權是兩件事。本專案採 [MIT License](LICENSE)，它決定第三方可如何使用程式碼與文件；本檔只定義名稱與呈現方式，不建立額外商標權利或授權限制。
