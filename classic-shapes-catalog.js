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

  const entries = [
    {
      id: "straight-three-v1",
      category: "nakade",
      zhTW: "直三",
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
      zhTW: "五目中手（分類）",
      teachingLabel: "五點大眼的中手分類",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "五目中手", relationType: "category-equivalent", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "這是分類層級，不等於任何單一中文俗稱。刀把五、梅花五等候選必須先以幾何逐一對照，不能直接全併成同義詞。",
      rulesetSensitive: false,
      sources: [
        { label: "日本棋院：五目中手實例", url: "https://www.nihonkiin.or.jp/news/docs/2024/spnintei2024springans.pdf" }
      ]
    },
    {
      id: "flower-six-v1",
      category: "nakade",
      zhTW: "花六／六目中手",
      teachingLabel: "六點大眼的花形中手",
      practiceStatus: "catalog_only",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "花六", relationType: "shape-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "日本圍棋連盟將花六定義為花形的六目中手。繁中頁面可用「花六／六目中手」解釋，但不把其他六點俗稱自動視為同形。",
      rulesetSensitive: false,
      sources: [
        { label: "日本囲碁連盟：花六", url: "https://www.ntkr.co.jp/igoyogo/yogo_801.html" }
      ]
    },
    {
      id: "bent-four-corner-v1",
      category: "rules_corner",
      zhTW: "盤角曲四",
      teachingLabel: "角部曲四與規則處理",
      practiceStatus: "catalog_only_rules_contract_required",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "隅の曲り四目", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "en", name: "Bent Four in the Corner", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "這一型不能只做固定局部答案。日本規則有明確死活確認例；其他規則可能要求實際走完，因此未建立 ruleset-aware scoring 前只作圖鑑。",
      rulesetSensitive: true,
      sources: [
        { label: "日本棋院：隅の曲り四目", url: "https://www.nihonkiin.or.jp/match/kiyaku/shikatsu-07-1.html" },
        { label: "British Go Association：rules comparison", url: "https://www.britgo.org/rules/compare.html" }
      ]
    },
    {
      id: "carpenters-square-v1",
      category: "complex_corner",
      zhTW: "木匠方（繁中教學譯名）",
      teachingLabel: "一合マス／Carpenter's Square",
      practiceStatus: "catalog_only_variation_contract_required",
      reviewStatus: REVIEW.VERIFIED,
      aliases: [
        { locale: "ja-JP", name: "一合マス", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED },
        { locale: "en", name: "Carpenter's Square", relationType: "exact-established-name", reviewStatus: REVIEW.VERIFIED }
      ],
      note: "日文與英文慣用名不是字面互譯，但來源明確指向同一經典死活 family。此型變化多，需 variation tree／branch oracle 後才能成為可評分練習。",
      rulesetSensitive: false,
      sources: [
        { label: "日本棋院：新ポケット詰碁200", url: "https://www.nihonkiin.or.jp/publishing/books/newtsumego200.html" },
        { label: "British Go Association：Japanese Go terms", url: "https://www.britgo.org/general/definitions.html" }
      ]
    },
    {
      id: "knife-five-candidate-v1",
      category: "nakade",
      zhTW: "刀把五",
      teachingLabel: "五點大眼名型候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "保留繁中常用名稱，但目前不把 Bulky Five 或任何日／韓名稱直接標成精確同義詞；需先完成棋形幾何＋來源對照。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "plum-five-candidate-v1",
      category: "nakade",
      zhTW: "梅花五",
      teachingLabel: "五點大眼名型候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "目前只收錄為待核對名型，不與所有五目中手或英文俗稱自動合併。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "grape-six-candidate-v1",
      category: "nakade",
      zhTW: "葡萄六",
      teachingLabel: "六點大眼名型候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "目前不把 Rabbity Six 直接翻成葡萄六；必須先以棋形幾何確認是否為同一 family。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "big-pigs-mouth-candidate-v1",
      category: "corner_life_death",
      zhTW: "大豬嘴",
      teachingLabel: "角部經典死活候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "先保留繁中名型入口；跨語名稱、標準幾何、先後手與主要分支尚待獨立核對。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "small-pigs-mouth-candidate-v1",
      category: "corner_life_death",
      zhTW: "小豬嘴",
      teachingLabel: "角部經典死活候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "先保留繁中名型入口；不可因名稱相近就把大小豬嘴視為同一 scoring family。",
      rulesetSensitive: false,
      sources: []
    },
    {
      id: "golden-chicken-candidate-v1",
      category: "tesuji",
      zhTW: "金雞獨立",
      teachingLabel: "死活／攻殺手筋候選",
      practiceStatus: "catalog_candidate_only",
      reviewStatus: REVIEW.NEEDS_REVIEW,
      aliases: [],
      note: "這是手筋型，不應與大眼中手共用同一 KC。日／韓／英文名稱需逐一查核，不以字面直譯當既定術語。",
      rulesetSensitive: false,
      sources: []
    }
  ];

  const categories = Object.freeze({
    nakade: "大眼與中手",
    corner_life_death: "角部死活",
    rules_corner: "規則敏感型",
    complex_corner: "經典複雜型",
    tesuji: "死活手筋"
  });

  function validateEntry(entry) {
    if (!entry || typeof entry.id !== "string" || !entry.id) return false;
    if (!categories[entry.category]) return false;
    if (!Object.values(REVIEW).includes(entry.reviewStatus)) return false;
    if (!Array.isArray(entry.aliases) || !Array.isArray(entry.sources)) return false;
    if (entry.practiceStatus !== "playable_existing_contract" && entry.practiceStatus.indexOf("catalog_") !== 0) return false;
    return entry.aliases.every((alias) => alias && alias.locale && alias.name && alias.relationType && Object.values(REVIEW).includes(alias.reviewStatus));
  }

  if (!entries.every(validateEntry)) throw new Error("Invalid classic shape catalog entry.");

  return Object.freeze({ version: "world-classic-shapes-v1", REVIEW, categories, entries, validateEntry });
});
