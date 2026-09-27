(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicShapeCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REVIEW = Object.freeze({
    VERIFIED: "verified",
    PARTIAL: "partial",
    NEEDS_REVIEW: "needs_review"
  });

  const ZH_NAME_STATUS = Object.freeze({
    ESTABLISHED: "established",
    ESTABLISHED_ALIAS: "established_alias",
    TEACHING_TRANSLATION: "teaching_translation",
    DESCRIPTIVE_TRANSLATION: "descriptive_translation",
    NO_ESTABLISHED_NAME_FOUND: "no_established_name_found",
    NEEDS_REVIEW: "needs_review"
  });

  const sources = Object.freeze({
    nihonkiinBentFour: { label: "日本棋院：隅の曲り四目", url: "https://www.nihonkiin.or.jp/match/kiyaku/shikatsu-07-1.html", sourceTier: "official" },
    nihonkiinCarpenter: { label: "日本棋院：新ポケット詰碁200", url: "https://www.nihonkiin.or.jp/publishing/books/newtsumego200.html", sourceTier: "official" },
    nihonkiinFive: { label: "日本棋院：五目中手實例", url: "https://www.nihonkiin.or.jp/news/docs/2024/spnintei2024springans.pdf", sourceTier: "official" },
    ntkrFlowerSix: { label: "日本囲碁連盟：花六", url: "https://www.ntkr.co.jp/igoyogo/yogo_801.html", sourceTier: "publisher" },
    cazenaveRabbitySix: { label: "Vilà & Cazenave：When One Eye is Sufficient", url: "https://www.lamsade.dauphine.fr/~cazenave/papers/eyeLabelling.pdf", sourceTier: "primary_research" },
    bgaTerms: { label: "British Go Association：Japanese Go terms", url: "https://www.britgo.org/general/definitions.html", sourceTier: "association" },
    bgaRules: { label: "British Go Association：rules comparison", url: "https://www.britgo.org/rules/compare.html", sourceTier: "association" },
    bgaIndex: { label: "British Go Journal：Life & Death index", url: "https://britgo.org/bgj/index/subj-inf.html", sourceTier: "association" },
    bgaTripod: { label: "British Go Journal：Tripod Group example", url: "https://www.britgo.org/files/bgj/bgj135.pdf", sourceTier: "association" },
    go4goChinese: { label: "Go4Go：Chinese Go Terms", url: "https://www.go4go.net/go/chinese_go_terms", sourceTier: "community_secondary" },
    goMagicGlossary: { label: "Go Magic：multilingual glossary", url: "https://gomagic.org/fr/glossary-of-go-terms/", sourceTier: "publisher_secondary" },
    chineseTermsPdf: { label: "Chinese Go Terms glossary", url: "https://www.hebsacker-verlag.de/download/Chinese_Go_Terms.pdf", sourceTier: "community_secondary" },
    takumiKyu: { label: "Takumi Go：kyu exercises", url: "https://en.1200igo.com/kyulevel", sourceTier: "specialist_secondary" },
    badukworldSeven: { label: "BadukWorld：사활7형제", url: "https://www.badukworld.co.kr/biz/7bros.html", sourceTier: "community_secondary" },
    badukworldDeath: { label: "BadukWorld：사활특강-사(死)", url: "https://www.badukworld.co.kr/biz/lesson2/special/death.html", sourceTier: "community_secondary" },
    bgaBulkyPractice: { label: "British Go Journal：Bulky Five / vital point examples", url: "https://britgo.org/files/bgj/bgj121.pdf", sourceTier: "association" },
    ogsBulkyVital: { label: "Online Go Forum：Bulky Five vital point discussion", url: "https://forums.online-go.com/t/is-it-impossible-to-save-a-3-x-2-territory/16356", sourceTier: "community_secondary" },
    yeefanBulkyAB: { label: "YeeFan：Multiple-Space Eyes, Bulky Five A/B sequence", url: "https://yeefan.sg/weiqi/howtoplaygo/howtoplaygo06.htm", sourceTier: "instructional_secondary" },
    malaysiaWeiqiBulky: { label: "Malaysia Weiqi Association：Multiple Eye Space", url: "https://www.weiqi.org.my/wp-content/uploads/2013/05/moduleav21.pdf", sourceTier: "association" },
    boardToBitsBulkyReduction: { label: "Board to Bits Go：Big Eyes / Bulky Five reduction", url: "https://boardtobitsgo.wordpress.com/2020/09/02/lesson-6-big-eyes/", sourceTier: "instructional_secondary" },
    meaningfulStonesCrossFive: { label: "Meaningful Stones：Cross Five", url: "https://jimseibert.github.io/Meaningful-Stones/sec-shapes.html", sourceTier: "instructional_secondary" },
    yikePlumFive: { label: "弈客圍棋：大眼（5）梅花五", url: "https://www.sohu.com/a/475377109_533159", sourceTier: "publisher_secondary" },
    hzSchoolVitalShapes: { label: "浙江工大附校：死活棋要點", url: "https://www.hzxhjy.cn/zgdfs/bfst/tylst/wq/201902/t20190226_26916.shtml", sourceTier: "educational_secondary" },
    senseisGoldenChicken: { label: "Sensei's Library：Golden Chicken Standing on One Leg", url: "https://senseis.xmp.net/?GoldenChickenStandingOnOneLeg=", sourceTier: "community_secondary" },
    centralGoGoldenChicken: { label: "中央棋院：金雞獨立", url: "https://vocus.cc/article/6698ae7ffd89780001ee7a83", sourceTier: "instructional_secondary" },
    boodBigPigsMouthConfig: { label: "bood/go-test：j_group_live2 regression config", url: "https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/config.yml", sourceTier: "oss_regression" },
    boodBigPigsMouthSgf: { label: "bood/go-test：大猪嘴.sgf", url: "https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/sgf/%E5%A4%A7%E7%8C%AA%E5%98%B4.sgf", sourceTier: "oss_regression" },
    tchanLifeDeathMonth: { label: "圍棋死活一月通目錄：大豬嘴型 / J-Group Pattern", url: "https://tchan001.wordpress.com/2010/05/05/weiqi-one-month-to-understand-series-7-books/", sourceTier: "bibliographic_secondary" }
  });

  const entries = [
    {
      id: "straight-three-v1",
      category: "nakade",
      preferredZhTW: "直三",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED,
      zhNameNote: "本專案沿用繁中圍棋常用名；跨語對照尚未完成。",
      teachingLabel: "三點眼空的中央急所",
      practiceStatus: "playable_existing_contract",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "zh-TW", name: "直三", relationType: "project-established-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "目前唯一直接接到本頁既有棋盤練習的名型。其他語言名稱尚未在本專案完成來源與幾何核對。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "five-point-nakade-v1",
      category: "nakade",
      preferredZhTW: null,
      zhAliases: [],
      teachingTranslation: "五目中手（分類）",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.DESCRIPTIVE_TRANSLATION,
      zhNameNote: "目前只確認日文分類名稱；繁中顯示用來解釋分類，不宣稱是華語圈固定專名。",
      teachingLabel: "五點大眼的中手分類",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "五目中手", relationType: "category-equivalent", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "這是分類層級，不等於任何單一中文俗稱。刀把五、梅花五等候選必須先以幾何逐一對照，不能直接全併成同義詞。",
      rulesetSensitive: false,
      sources: [sources.nihonkiinFive]
    },
    {
      id: "flower-six-v1",
      category: "nakade",
      preferredZhTW: null,
      zhAliases: [],
      teachingTranslation: "花六（日本名）／六目中手",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NEEDS_REVIEW,
      zhNameNote: "日本來源可確認「花六」；英文研究文獻稱同一六點 nakade 幾何為 Rabbity Six。本專案仍不把「葡萄六」直接升格為精確同義詞。",
      teachingLabel: "六點大眼唯一中手形的共同急所",
      practiceStatus: "playable_bounded_vital_point_contract",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "花六", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "en", name: "Rabbity Six", relationType: "geometry-equivalent", reviewStatus: REVIEW.VERIFIED },
        { locale: "ko-KR", name: "매화6궁", relationType: "candidate-shape-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "已建立 bounded 第一手 practice：六點眼空必須同構於 Rabbity Six／花六，並具有唯一 degree-4 急所。守方與攻方都只評第一手共同急所；完整長變化仍未建立。葡萄六保持獨立待核對。",
      rulesetSensitive: false,
      sources: [sources.ntkrFlowerSix, sources.cazenaveRabbitySix, sources.badukworldDeath]
    },
    {
      id: "bent-four-corner-v1",
      category: "rules_corner",
      preferredZhTW: "盤角曲四",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "華語術語表與現有教材常用此名；正式 scoring 仍須指定 ruleset。",
      teachingLabel: "角部曲四與規則處理",
      practiceStatus: "catalog_only_rules_contract_required",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "隅の曲り四目", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "en", name: "Bent Four in the Corner", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "ko-KR", name: "귀곡사", relationType: "terminology-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "這一型不能只做固定局部答案。日本規則有明確死活確認例；其他規則可能要求實際走完，因此未建立 ruleset-aware scoring 前只作圖鑑。",
      rulesetSensitive: true,
      sources: [sources.nihonkiinBentFour, sources.bgaRules, sources.badukworldSeven]
    },
    {
      id: "carpenters-square-v1",
      category: "complex_corner",
      preferredZhTW: "斗方",
      zhAliases: [
        { name: "金櫃角", reviewStatus: REVIEW.PARTIAL, relationType: "established-alias" }
      ],
      teachingTranslation: "木匠方",
      literalTranslation: "木匠的方尺／方形",
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "多個中文術語來源使用「斗方」對應 Carpenter's Square；另有「金櫃角」。本館以「斗方」作主要顯示，「木匠方」只保留為字面教學翻譯。",
      teachingLabel: "一合マス／Carpenter's Square",
      practiceStatus: "catalog_only_variation_contract_required",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "一合マス", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "en", name: "Carpenter's Square", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "日文與英文慣用名不是字面互譯，但來源明確指向同一經典死活 family。此型變化多，需 variation tree／branch oracle 後才能成為可評分練習。",
      rulesetSensitive: false,
      sources: [sources.nihonkiinCarpenter, sources.bgaTerms, sources.go4goChinese, sources.goMagicGlossary, sources.chineseTermsPdf]
    },
    {
      id: "knife-five-candidate-v1",
      category: "nakade",
      preferredZhTW: "刀把五",
      zhAliases: ["刀板五", "刀柄五", "刀五"].map((name) => ({ name, reviewStatus: REVIEW.PARTIAL, relationType: "established-alias-candidate" })),
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "多份華語術語表將刀把五及若干別名對應 Bulky Five；但本專案尚未完成 geometry/scoring contract，因此仍只作圖鑑。",
      teachingLabel: "五點大眼名型候選",
      practiceStatus: "playable_bounded_vital_point_short_read_and_sealed_reduction_contract",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "Bulky Five", relationType: "terminology-table-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "已建立三層 bounded practice：共同急所、A/B 三手 short-read、以及「零外氣＋守方局部手抜き」條件下的 sealed reduction。第三層驗證攻方填滿 2×2 核心後，守方被迫在突出點提四子，終局眼空收束為 square four。任何有外氣或未列應手仍不得套用。",
      rulesetSensitive: false,
      sources: [sources.go4goChinese, sources.chineseTermsPdf, sources.bgaBulkyPractice, sources.ogsBulkyVital, sources.yeefanBulkyAB, sources.malaysiaWeiqiBulky, sources.boardToBitsBulkyReduction]
    },
    {
      id: "plum-five-candidate-v1",
      category: "nakade",
      preferredZhTW: "梅花五",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "華語教材使用「梅花五／花五」描述十字形五點眼空；英語教材稱 Cross Five。兩者的中心共同急所有來源支持，但本專案目前只建立第一手 vital-point contract。",
      teachingLabel: "十字形五點眼空的中央急所",
      practiceStatus: "playable_bounded_center_vital_point_contract",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "zh-TW", name: "花五", relationType: "established-alias", reviewStatus: REVIEW.PARTIAL },
        { locale: "en", name: "Cross Five", relationType: "geometry-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "已建立 bounded 中央急所 practice：十字五點幾何必須有唯一 degree-4 中心；守方與攻方第一手都以該中心為共同急所。這不代表完整五目中手答案樹。",
      rulesetSensitive: false,
      sources: [sources.meaningfulStonesCrossFive, sources.yikePlumFive, sources.hzSchoolVitalShapes]
    },
    {
      id: "grape-six-candidate-v1",
      category: "nakade",
      preferredZhTW: "葡萄六",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NEEDS_REVIEW,
      zhNameNote: "保留華語候選名；目前不把 Rabbity Six 或 Flower Six 直接升格為精確同義詞。",
      teachingLabel: "六點大眼名型候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "必須先以棋形幾何確認各語言名稱是否為同一 family。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "big-pigs-mouth-candidate-v1",
      category: "corner_life_death",
      preferredZhTW: "大豬嘴",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "華語術語表、書目整理與 MIT regression 均把大豬嘴／J Group 聯繫在同一 family；本專案仍只把 external source-case 當 bounded oracle，不宣稱整個 family geometry 已完成。",
      teachingLabel: "角部經典死活候選",
      practiceStatus: "playable_source_case_first_move_contract",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "J Group", relationType: "terminology-table-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "已新增 bounded source-case practice：bood/go-test 的 MIT regression 將大猪嘴.sgf 在 loadsgf 52 前的局面標成 j_group_live2，白棋 expected move 為 R1。本館以完整 source position 作 scoring identity，另做四向旋轉避免座標背誦；這不代表 R1 是所有大豬嘴／J Group 的共同答案，也不代表標準 geometry 或 variation tree 已完成。",
      rulesetSensitive: false,
      sources: [sources.go4goChinese, sources.tchanLifeDeathMonth, sources.boodBigPigsMouthConfig, sources.boodBigPigsMouthSgf]
    },
    {
      id: "small-pigs-mouth-candidate-v1",
      category: "corner_life_death",
      preferredZhTW: "小豬嘴",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NEEDS_REVIEW,
      zhNameNote: "華語名稱存在，但與 Tripod Group 系列的精確 family 關係仍需幾何核對。",
      teachingLabel: "角部經典死活候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "不可因名稱相近就把大小豬嘴視為同一 scoring family。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "golden-chicken-candidate-v1",
      category: "tesuji",
      preferredZhTW: "金雞獨立",
      zhAliases: [],
      teachingTranslation: null,
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "華語術語表已有此手筋名稱；英文來源常以 double shortage of liberties 描述機制，名稱與機制說法須分開。",
      teachingLabel: "死活／攻殺手筋候選",
      practiceStatus: "playable_rules_backed_tesuji_mechanism_contract",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "Golden Chicken Standing on One Leg", relationType: "teaching-name-equivalent", reviewStatus: REVIEW.PARTIAL },
        { locale: "en", name: "double shortage of liberties", relationType: "concept-equivalent", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "已建立原創、rules-backed bounded practice：只驗「邊線立使己方由一氣變兩氣，對手兩側因氣緊都不能入子，而己方可從任一側反提」這個機制。棋形由本專案依機制定義自行編製，不複製外部題圖；外部來源只支持術語與機制。這是 tesuji contract，不與大眼中手 geometry 共用 scoring。",
      rulesetSensitive: false,
      sources: [sources.go4goChinese, sources.senseisGoldenChicken, sources.centralGoGoldenChicken]
    },
    {
      id: "l-group-v1",
      category: "complex_corner",
      preferredZhTW: null,
      zhAliases: [],
      teachingTranslation: "L 形角部死活",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,
      zhNameNote: "本輪覆蓋的華語術語來源未找到可確認的固定中文專名；因此保留英文原名，中文只作描述，不宣稱命名。",
      teachingLabel: "L Group",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "L Group", relationType: "source-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "英語死活教材長期把它作為獨立 corner-shape family；中文描述只幫助理解，不產生新的中文術語。",
      rulesetSensitive: false,
      sources: [sources.bgaIndex]
    },
    {
      id: "l-plus-one-group-v1",
      category: "complex_corner",
      preferredZhTW: null,
      zhAliases: [],
      teachingTranslation: "L+1 角部死活",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,
      zhNameNote: "本輪未找到可確認的固定中文專名；保留 L+1 Group 原名，中文只作結構描述。",
      teachingLabel: "L+1 Group",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "L+1 Group", relationType: "source-name", reviewStatus: REVIEW.PARTIAL }
      ],
      note: "英語教材把 L+1 作為 L Group 的相關 family；未建立標準幾何與答案樹前只作 reference。",
      rulesetSensitive: false,
      sources: [sources.takumiKyu]
    },
    {
      id: "tripod-group-v1",
      category: "complex_corner",
      preferredZhTW: null,
      zhAliases: [],
      teachingTranslation: "三腳形角部死活",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,
      zhNameNote: "本輪未找到可確認的固定中文專名；「三腳形角部死活」只是描述性翻譯。",
      teachingLabel: "Tripod Group",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "Tripod Group", relationType: "source-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "British Go Journal 有直接使用 Tripod Group。中文顯示不把描述性翻譯包裝成華語傳統名稱。",
      rulesetSensitive: false,
      sources: [sources.bgaTripod]
    },
    {
      id: "long-l-group-v1",
      category: "complex_corner",
      preferredZhTW: "帶鉤",
      zhAliases: [
        { name: "緊帶鉤", reviewStatus: REVIEW.PARTIAL, relationType: "condition-specific-alias" },
        { name: "寬帶鉤", reviewStatus: REVIEW.PARTIAL, relationType: "condition-specific-alias" }
      ],
      teachingTranslation: "長 L 形角部死活",
      literalTranslation: null,
      zhNameStatus: ZH_NAME_STATUS.ESTABLISHED_ALIAS,
      zhNameNote: "多個中文術語表使用「帶鉤」對應 Long L Group；並依外氣條件區分「緊帶鉤／寬帶鉤」。條件別名仍須和實際幾何一起使用。",
      teachingLabel: "Long L Group",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.PARTIAL,
      aliases: [
        { locale: "en", name: "Long L Group", relationType: "source-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "先保留英文原名與中文候選別名；需把外氣條件與幾何一起核對後才決定 preferred 中文名。",
      rulesetSensitive: false,
      sources: [sources.bgaIndex, sources.go4goChinese, sources.chineseTermsPdf]
    }
  ];

  const categories = Object.freeze({
    nakade: "大眼與中手",
    corner_life_death: "角部死活",
    rules_corner: "規則敏感型",
    complex_corner: "經典複雜型",
    tesuji: "死活手筋"
  });

  function validateZhAlias(alias) {
    return alias && typeof alias.name === "string" && alias.name && alias.relationType
      && Object.values(REVIEW).includes(alias.reviewStatus);
  }

  function validateEntry(entry) {
    if (!entry || typeof entry.id !== "string" || !entry.id) return false;
    if (!categories[entry.category]) return false;
    if (!Object.values(REVIEW).includes(entry.reviewStatus)) return false;
    if (!Object.values(ZH_NAME_STATUS).includes(entry.zhNameStatus)) return false;
    if (!Array.isArray(entry.aliases) || !Array.isArray(entry.sources) || !Array.isArray(entry.zhAliases)) return false;
    if (!entry.zhAliases.every(validateZhAlias)) return false;
    if (entry.practiceStatus.indexOf("playable_") !== 0 && entry.practiceStatus.indexOf("catalog_") !== 0) return false;
    if (entry.zhNameStatus === ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND && entry.preferredZhTW !== null) return false;
    if (entry.zhNameStatus === ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND && !entry.teachingTranslation) return false;
    if (entry.zhNameStatus === ZH_NAME_STATUS.TEACHING_TRANSLATION && !entry.teachingTranslation) return false;
    return entry.aliases.every((alias) => alias && alias.locale && alias.name && alias.relationType && Object.values(REVIEW).includes(alias.reviewStatus));
  }

  if (!entries.every(validateEntry)) throw new Error("Invalid classic shape catalog entry.");

  return Object.freeze({
    version: "world-classic-shapes-v9",
    REVIEW,
    ZH_NAME_STATUS,
    categories,
    entries,
    validateEntry
  });
});
