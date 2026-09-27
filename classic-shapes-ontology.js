(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicShapeOntology = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const REVIEW = Object.freeze({
    VERIFIED: "verified",
    PARTIAL: "partial",
    NEEDS_REVIEW: "needs_review"
  });

  const ENTITY_TYPE = Object.freeze({
    NAKADE_SHAPE: "nakade_shape",
    CORNER_LIFE_DEATH_FAMILY: "corner_life_death_family",
    TESUJI_MECHANISM: "tesuji_mechanism",
    RULES_SENSITIVE_POSITION: "rules_sensitive_position",
    NAKADE_CATEGORY: "nakade_category"
  });

  const NAME_STATUS = Object.freeze({
    ESTABLISHED: "established",
    ESTABLISHED_ALIAS: "established_alias",
    RARE_OR_LEXICOGRAPHIC: "rare_or_lexicographic",
    TEACHING_TRANSLATION: "teaching_translation",
    DESCRIPTIVE_TRANSLATION: "descriptive_translation",
    NO_ESTABLISHED_NAME_FOUND: "no_established_name_found",
    NEEDS_REVIEW: "needs_review"
  });

  const SEMANTIC_ROLE = Object.freeze({
    EXACT_SHAPE_NAME: "exact_shape_name",
    CATEGORY_NAME: "category_name",
    FAMILY_NAME: "family_name",
    MECHANISM_NAME: "mechanism_name",
    DESCRIPTIVE_LABEL: "descriptive_label",
    LITERAL_TRANSLATION: "literal_translation"
  });

  const RELATION = Object.freeze({
    EXACT: "exact",
    BROADER: "broader",
    NARROWER: "narrower",
    OVERLAP: "overlap",
    MECHANISM_EQUIVALENT: "mechanism_equivalent",
    UNKNOWN: "unknown"
  });

  const USAGE_SCOPE = Object.freeze({
    OFFICIAL: "official",
    ASSOCIATION: "association",
    PROFESSIONAL_TEXTBOOK: "professional_textbook",
    FEDERATION_DICTIONARY: "federation_dictionary",
    INSTRUCTIONAL: "instructional",
    COMMUNITY: "community",
    LEXICOGRAPHIC: "lexicographic",
    PROJECT_ONLY: "project_only",
    SCRIPT_CONVERSION: "script_conversion",
    REGIONAL_USAGE_UNRESOLVED: "regional_usage_unresolved"
  });

  function source(id, label, url, sourceTier, evidenceChain) {
    return Object.freeze({ id, label, url, sourceTier, evidenceChain });
  }

  const sources = Object.freeze({
    nihonkiinBentFour: source("nihonkiinBentFour","日本棋院：隅の曲り四目","https://www.nihonkiin.or.jp/match/kiyaku/shikatsu-07-1.html","official","nihonkiin-bent-four"),
    nihonkiinCarpenter: source("nihonkiinCarpenter","日本棋院：新ポケット詰碁200","https://www.nihonkiin.or.jp/publishing/books/newtsumego200.html","official","nihonkiin-carpenter"),
    nihonkiinFive: source("nihonkiinFive","日本棋院：五目中手實例","https://www.nihonkiin.or.jp/news/docs/2024/spnintei2024springans.pdf","official","nihonkiin-five-nakade"),
    ntkrFlowerSix: source("ntkrFlowerSix","日本囲碁連盟：花六","https://www.ntkr.co.jp/igoyogo/yogo_801.html","publisher","ntkr-flower-six"),
    cazenaveRabbitySix: source("cazenaveRabbitySix","Vilà & Cazenave：When One Eye is Sufficient","https://www.lamsade.dauphine.fr/~cazenave/papers/eyeLabelling.pdf","primary_research","cazenave-rabbity-six"),
    bgaTerms: source("bgaTerms","British Go Association：Japanese Go terms","https://www.britgo.org/general/definitions.html","association","bga-terms"),
    bgaRules: source("bgaRules","British Go Association：rules comparison","https://www.britgo.org/rules/compare.html","association","bga-rules"),
    bgaIndex: source("bgaIndex","British Go Journal：Life & Death index","https://britgo.org/bgj/index/subj-inf.html","association","bga-ld-index"),
    bgaTripod: source("bgaTripod","British Go Journal：Tripod Group example","https://www.britgo.org/files/bgj/bgj135.pdf","association","bga-tripod"),
    go4goChinese: source("go4goChinese","Go4Go：Chinese Go Terms","https://www.go4go.net/go/chinese_go_terms","community_secondary","yeefan-chinese-terms"),
    yeefanChineseTerms: source("yeefanChineseTerms","YeeFan：Chinese Go Terms","https://yeefan.sg/weiqi/chinesegoterms/","instructional_secondary","yeefan-chinese-terms"),
    ffgDictionary: source("ffgDictionary","Fédération Française de Go：Dictionnaire multilingue","https://jeudego.org/_php/dico_grand_tableau.php","federation_dictionary","ffg-multilingual-dictionary"),
    goMagicGlossary: source("goMagicGlossary","Go Magic：multilingual glossary","https://gomagic.org/fr/glossary-of-go-terms/","publisher_secondary","gomagic-glossary"),
    chineseTermsPdf: source("chineseTermsPdf","Chinese Go Terms glossary","https://www.hebsacker-verlag.de/download/Chinese_Go_Terms.pdf","community_secondary","yeefan-derived-glossary"),
    takumiKyu: source("takumiKyu","Takumi Go：kyu exercises","https://en.1200igo.com/kyulevel","specialist_secondary","takumi-kyu"),
    badukworldSeven: source("badukworldSeven","BadukWorld：사활7형제","https://www.badukworld.co.kr/biz/7bros.html","community_secondary","badukworld-seven"),
    badukworldDeath: source("badukworldDeath","BadukWorld：사활특강-사(死)","https://www.badukworld.co.kr/biz/lesson2/special/death.html","community_secondary","badukworld-death"),
    bgaBulkyPractice: source("bgaBulkyPractice","British Go Journal：Bulky Five / vital point examples","https://britgo.org/files/bgj/bgj121.pdf","association","bga-bulky"),
    ogsBulkyVital: source("ogsBulkyVital","Online Go Forum：Bulky Five vital point discussion","https://forums.online-go.com/t/is-it-impossible-to-save-a-3-x-2-territory/16356","community_secondary","ogs-bulky"),
    yeefanBulkyAB: source("yeefanBulkyAB","YeeFan：Multiple-Space Eyes, Bulky Five A/B sequence","https://yeefan.sg/weiqi/howtoplaygo/howtoplaygo06.htm","instructional_secondary","yeefan-multiple-space-eyes"),
    malaysiaWeiqiBulky: source("malaysiaWeiqiBulky","Malaysia Weiqi Association：Multiple Eye Space","https://www.weiqi.org.my/wp-content/uploads/2013/05/moduleav21.pdf","association","mwa-multiple-eye-space"),
    boardToBitsBulkyReduction: source("boardToBitsBulkyReduction","Board to Bits Go：Big Eyes / Bulky Five reduction","https://boardtobitsgo.wordpress.com/2020/09/02/lesson-6-big-eyes/","instructional_secondary","board-to-bits-bulky"),
    meaningfulStonesCrossFive: source("meaningfulStonesCrossFive","Meaningful Stones：Cross Five","https://jimseibert.github.io/Meaningful-Stones/sec-shapes.html","instructional_secondary","meaningful-stones-cross-five"),
    yikePlumFive: source("yikePlumFive","弈客圍棋：大眼（5）梅花五","https://www.sohu.com/a/475377109_533159","publisher_secondary","yike-plum-five"),
    hzSchoolVitalShapes: source("hzSchoolVitalShapes","浙江工大附校：死活棋要點","https://www.hzxhjy.cn/zgdfs/bfst/tylst/wq/201902/t20190226_26916.shtml","educational_secondary","hz-school-vital-shapes"),
    senseisGoldenChicken: source("senseisGoldenChicken","Sensei's Library：Golden Chicken Standing on One Leg","https://senseis.xmp.net/?GoldenChickenStandingOnOneLeg=","community_secondary","senseis-golden-chicken"),
    centralGoGoldenChicken: source("centralGoGoldenChicken","中央棋院：金雞獨立","https://vocus.cc/article/6698ae7ffd89780001ee7a83","instructional_secondary","central-go-golden-chicken"),
    yeefanPyramidFour: source("yeefanPyramidFour","YeeFan：Multiple-Space Eyes / Pyramid Four","https://yeefan.sg/weiqi/howtoplaygo/howtoplaygo06.htm","instructional_secondary","yeefan-multiple-space-eyes"),
    bgaPyramidFour: source("bgaPyramidFour","British Go Journal：Nakade / Pyramid Four examples","https://www.britgo.org/files/bgj/bgj123.pdf","association","bga-pyramid-four"),
    boodBigPigsMouthConfig: source("boodBigPigsMouthConfig","bood/go-test：j_group_live2 regression config","https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/config.yml","oss_regression","bood-go-test-j-group"),
    boodBigPigsMouthSgf: source("boodBigPigsMouthSgf","bood/go-test：大猪嘴.sgf","https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/sgf/%E5%A4%A7%E7%8C%AA%E5%98%B4.sgf","oss_regression","bood-go-test-j-group"),
    tchanLifeDeathMonth: source("tchanLifeDeathMonth","圍棋死活一月通目錄：大豬嘴型 / J-Group Pattern","https://tchan001.wordpress.com/2010/05/05/weiqi-one-month-to-understand-series-7-books/","bibliographic_secondary","life-death-month-index")
  });

  function name(locale, value, nameStatus, semanticRole, relationToCanonical, usageScope, reviewStatus, sourceIds, extra) {
    return Object.freeze({
      locale,
      name: value,
      nameStatus,
      semanticRole,
      relationToCanonical,
      usageScope,
      reviewStatus,
      sourceIds: Object.freeze((sourceIds || []).slice()),
      ...(extra || {})
    });
  }

  function geometry(kind, reviewStatus, contractVersion, fingerprint, boardContext, conditions) {
    return Object.freeze({
      kind,
      reviewStatus,
      contractVersion: contractVersion || null,
      fingerprint: fingerprint || null,
      normalizedForRotation: true,
      normalizedForReflection: true,
      boardContext: boardContext || "local",
      conditions: Object.freeze({ ...(conditions || {}) })
    });
  }

  const chineseSearchScope = Object.freeze([
    "zh-CN",
    "zh-TW",
    "professional books",
    "terminology dictionaries",
    "go teaching sites"
  ]);

  const concepts = [
    {
      id:"straight-three-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"三點眼空的中央急所", practiceStatus:"playable_existing_contract", reviewStatus:REVIEW.PARTIAL,
      names:[name("zh-Hant","直三",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[],{displayPreference:"project"})],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.PARTIAL,"existing-content-u4",null,"center",{}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:[], note:"名稱是記憶支架；正式能力仍看無提示新棋形。"
    },
    {
      id:"five-point-nakade-v1", entityType:ENTITY_TYPE.NAKADE_CATEGORY, catalogCategory:"nakade",
      teachingLabel:"五點大眼的中手分類", practiceStatus:"catalog_only", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("ja-JP","五目中手",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.CATEGORY_NAME,RELATION.EXACT,USAGE_SCOPE.OFFICIAL,REVIEW.VERIFIED,["nihonkiinFive"]),
        name("zh-Hant","五目中手（分類）",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[], geometryIdentity:geometry("category",REVIEW.VERIFIED,null,null,"local",{}),
      rulesetBehavior:[],
      negativeMappings:[{locale:"zh-Hant",name:"刀把五",relation:"unique_name_for_category",status:"blocked",reason:"五目中手是上位分類，不是刀把五的唯一專名",sourceIds:["nihonkiinFive"]}],
      sourceIds:["nihonkiinFive"], note:"分類層級不可自動等同任何單一五點名型。"
    },
    {
      id:"pyramid-four-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"T 形四點眼空的唯一共同急所", practiceStatus:"playable_bounded_geometry_derived_vital_point_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","丁四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("zh-Hant","草帽四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["yeefanChineseTerms"]),
        name("en","Pyramid Four",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["yeefanPyramidFour","bgaPyramidFour"]),
        name("en","Farmer's Hat",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese"]),
        name("ko-KR","삿갓4궁",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["ffgDictionary"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-pyramid-four-vital-point-v1","T-tetromino","center",{}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","yeefanPyramidFour","bgaPyramidFour","ffgDictionary"],
      note:"canonical identity 是 T tetromino；答案由唯一 degree-3 center 即時計算。"
    },
    {
      id:"flower-six-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"六點大眼唯一中手形的共同急所", practiceStatus:"playable_bounded_vital_point_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("ja-JP","花六",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["ntkrFlowerSix"]),
        name("en","Rabbity Six",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.PROFESSIONAL_TEXTBOOK,REVIEW.VERIFIED,["cazenaveRabbitySix"]),
        name("ko-KR","매화6궁",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.COMMUNITY,REVIEW.PARTIAL,["badukworldDeath"]),
        name("zh-Hant","花六（日本名）／六目中手",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-flower-six-vital-point-v1","rabbity-six-six-point-graph","center",{}),
      rulesetBehavior:[],
      negativeMappings:[{locale:"zh-Hant",name:"葡萄六",relation:"exact_alias",status:"blocked_pending_geometry",reason:"目前只支持候選術語鏈，不足以自動合併",sourceIds:["go4goChinese","yeefanChineseTerms"]}],
      sourceIds:["ntkrFlowerSix","cazenaveRabbitySix","badukworldDeath","ffgDictionary"], note:"花六 family mapping 信心高；葡萄六仍分離。"
    },
    {
      id:"bent-four-corner-v1", entityType:ENTITY_TYPE.RULES_SENSITIVE_POSITION, catalogCategory:"rules_corner",
      teachingLabel:"角部曲四與規則處理", practiceStatus:"catalog_only_rules_contract_required", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","盤角曲四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese"],{displayPreference:"project"}),
        name("ja-JP","隅の曲り四目",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.OFFICIAL,REVIEW.VERIFIED,["nihonkiinBentFour"]),
        name("en","Bent Four in the Corner",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaRules"]),
        name("ko-KR","귀곡사",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.COMMUNITY,REVIEW.PARTIAL,["badukworldSeven"])
      ],
      nameResearch:[], geometryIdentity:geometry("rules_sensitive_position",REVIEW.PARTIAL,null,null,"corner",{koContext:"ruleset-dependent"}),
      rulesetBehavior:[
        {ruleset:"Japanese",rulesetVersion:"Japanese Rules of Go 1989",phase:"adjudication",adjudicationMode:"special_life_death_confirmation",result:"source-specific dead determination",reviewStatus:REVIEW.VERIFIED,sourceIds:["nihonkiinBentFour"]},
        {ruleset:"AGA/Chinese/SST/NZ comparison",rulesetVersion:null,phase:"play_or_adjudication",adjudicationMode:"not_same_as_japanese_special_contract",result:"requires ruleset-specific treatment",reviewStatus:REVIEW.PARTIAL,sourceIds:["bgaRules"]}
      ],
      negativeMappings:[], sourceIds:["nihonkiinBentFour","bgaRules","badukworldSeven"], note:"rulesetSensitive 必須由 rulesetBehavior 衍生。"
    },
    {
      id:"carpenters-square-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"一合マス／Carpenter's Square", practiceStatus:"catalog_only_variation_contract_required", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("ja-JP","一合マス",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.OFFICIAL,REVIEW.VERIFIED,["nihonkiinCarpenter","bgaTerms"]),
        name("en","Carpenter's Square",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaTerms","ffgDictionary"]),
        name("zh-CN","金柜角",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("zh-Hant","金櫃角",NAME_STATUS.RARE_OR_LEXICOGRAPHIC,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.SCRIPT_CONVERSION,REVIEW.PARTIAL,["ffgDictionary"]),
        name("zh-CN","斗方",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"]),
        name("zh-Hant","木匠方",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh-TW",status:"regional_preference_unresolved",reviewedAt:"2026-09-27",searchScope:["Taiwan professional material","Taiwan go associations","Taiwan teaching usage"]}],
      geometryIdentity:geometry("corner_family",REVIEW.PARTIAL,null,null,"corner",{}), rulesetBehavior:[],
      negativeMappings:[{locale:"zh-TW",name:"金櫃角",relation:"regional_preferred_name",status:"blocked_pending_regional_usage",reason:"簡繁字形轉換不等於臺灣慣用名稱",sourceIds:["ffgDictionary"]}],
      sourceIds:["nihonkiinCarpenter","bgaTerms","ffgDictionary","go4goChinese","yeefanChineseTerms"], note:"日英 mapping 穩固；繁中首選名稱未判定。"
    },
    {
      id:"knife-five-candidate-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"五點大眼名型", practiceStatus:"playable_bounded_vital_point_short_read_and_sealed_reduction_contract", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","刀把五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("zh-Hant","刀板五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["chineseTermsPdf"]),
        name("zh-Hant","刀柄五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["chineseTermsPdf"]),
        name("zh-Hant","刀五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("en","Bulky Five",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.PARTIAL,["bgaBulkyPractice","ffgDictionary"]),
        name("ko-KR","도화오궁",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-vital-point-v1","P-pentomino","local",{outsideLiberties:"contract-dependent"}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","chineseTermsPdf","ffgDictionary","bgaBulkyPractice","ogsBulkyVital","yeefanBulkyAB","malaysiaWeiqiBulky","boardToBitsBulkyReduction"],
      note:"名稱 mapping 已支持；geometry 與 bounded scoring 由獨立 contract 驗收。"
    },
    {
      id:"plum-five-candidate-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"十字形五點眼空的中央急所", practiceStatus:"playable_bounded_center_vital_point_contract", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","梅花五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["yikePlumFive"],{displayPreference:"project"}),
        name("zh-Hant","花五",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("en","Cross Five",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["meaningfulStonesCrossFive"]),
        name("en","Crossed Five",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("ja-JP","花五目",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("ko-KR","오궁도화",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-cross-five-vital-point-v1","cross-five","center",{}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["meaningfulStonesCrossFive","yikePlumFive","hzSchoolVitalShapes","ffgDictionary"], note:"Cross Five / Crossed Five 分別保存 provenance，不自行正規化成單一英文拼法。"
    },
    {
      id:"grape-six-candidate-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"六點大眼名型候選", practiceStatus:"catalog_candidate_only", reviewStatus:REVIEW.NEEDS_REVIEW,
      names:[name("zh-Hant","葡萄六",NAME_STATUS.NEEDS_REVIEW,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.UNKNOWN,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.NEEDS_REVIEW,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"})],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.NEEDS_REVIEW,null,null,"local",{}), rulesetBehavior:[],
      negativeMappings:[{locale:"en",name:"Rabbity Six",relation:"exact_alias",status:"blocked_pending_geometry",reason:"目前主要來自同一術語 Evidence Chain，不能當獨立 geometry 驗證",sourceIds:["go4goChinese","yeefanChineseTerms"]}],
      sourceIds:["go4goChinese","yeefanChineseTerms"], note:"葡萄六保留 established alias candidate；需獨立 geometry confirmation。"
    },
    {
      id:"big-pigs-mouth-candidate-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"corner_life_death",
      teachingLabel:"角部經典死活 family", practiceStatus:"playable_source_case_first_move_contract", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","大豬嘴",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms","tchanLifeDeathMonth"],{displayPreference:"project"}),
        name("en","J Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.PARTIAL,["bgaIndex","tchanLifeDeathMonth"])
      ],
      nameResearch:[], geometryIdentity:geometry("source_position_plus_unresolved_family",REVIEW.PARTIAL,"classic-big-pigs-mouth-source-case-v1","bood-j-group-live2-pre52","corner",{familyGeometry:"pending"}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","tchanLifeDeathMonth","boodBigPigsMouthConfig","boodBigPigsMouthSgf"], note:"name mapping 支持；只有 exact source-case geometry 已可執行驗證。"
    },
    {
      id:"small-pigs-mouth-candidate-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"corner_life_death",
      teachingLabel:"角部經典死活候選", practiceStatus:"catalog_candidate_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","小豬嘴",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("en","Tripod Group with Extra Leg",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.OVERLAP,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"])
      ],
      nameResearch:[], geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), rulesetBehavior:[],
      negativeMappings:[{locale:"en",name:"Tripod Group",relation:"exact_alias",status:"blocked_pending_geometry",reason:"目前術語鏈指向 Tripod Group with Extra Leg，而不是普通 Tripod Group",sourceIds:["go4goChinese","yeefanChineseTerms"]}],
      sourceIds:["go4goChinese","yeefanChineseTerms"], note:"mapping unknown 已縮小；plain Tripod Group 明確列為 negative mapping。"
    },
    {
      id:"golden-chicken-candidate-v1", entityType:ENTITY_TYPE.TESUJI_MECHANISM, catalogCategory:"tesuji",
      teachingLabel:"雙重氣緊手筋", practiceStatus:"playable_rules_backed_tesuji_mechanism_contract", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","金雞獨立",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.MECHANISM_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["centralGoGoldenChicken","go4goChinese"],{displayPreference:"project"}),
        name("en","Golden Chicken Standing on One Leg",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.MECHANISM_NAME,RELATION.MECHANISM_EQUIVALENT,USAGE_SCOPE.COMMUNITY,REVIEW.PARTIAL,["senseisGoldenChicken"]),
        name("en","double shortage of liberties",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.MECHANISM_NAME,RELATION.MECHANISM_EQUIVALENT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary","senseisGoldenChicken"]),
        name("ja-JP","押す手なし",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.MECHANISM_NAME,RELATION.MECHANISM_EQUIVALENT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"]),
        name("ko-KR","양자충",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.MECHANISM_NAME,RELATION.MECHANISM_EQUIVALENT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"])
      ],
      nameResearch:[], geometryIdentity:geometry("mechanism",REVIEW.VERIFIED,"classic-golden-chicken-mechanism-v1",null,"edge",{outsideLiberties:"mechanism-specific"}),
      rulesetBehavior:[],
      negativeMappings:[{locale:null,name:"static nakade shape",relation:"entity_type",status:"blocked",reason:"金雞獨立是 tesuji mechanism，不是固定中手 geometry",sourceIds:["senseisGoldenChicken","centralGoGoldenChicken"]}],
      sourceIds:["centralGoGoldenChicken","senseisGoldenChicken","ffgDictionary","go4goChinese"], note:"跨語對應採 mechanism-equivalent，不假裝成同一靜態棋形名稱。"
    },
    {
      id:"l-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"L Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","L Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaIndex"]),
        name("zh-Hant","L 形角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaIndex"], note:"UI 應顯示『截至查核日尚未找到可確認固定中文名』，不是宣稱中文不存在名稱。"
    },
    {
      id:"l-plus-one-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"L+1 Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","L+1 Group",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["takumiKyu"]),
        name("zh-Hant","L+1 角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), rulesetBehavior:[], negativeMappings:[],
      sourceIds:["takumiKyu"], note:"英語 family 名保留；中文只作描述。"
    },
    {
      id:"tripod-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"Tripod Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","Tripod Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaTripod"]),
        name("zh-Hant","三腳形角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaTripod"], note:"GNU Go oracle 授權邊界另由工程文件管理；本 ontology 不從名稱推導 shipping authority。"
    },
    {
      id:"long-l-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"Long L Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","Long L Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaIndex"]),
        name("zh-Hant","帶鉤",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("zh-Hant","緊帶鉤",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.NARROWER,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{condition:{outsideLiberties:"without"}}),
        name("zh-Hant","寬帶鉤",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.NARROWER,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{condition:{outsideLiberties:"with"}}),
        name("zh-Hant","長 L 形角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[], geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{outsideLiberties:"variation_axis_required"}),
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaIndex","go4goChinese","yeefanChineseTerms","chineseTermsPdf"], note:"緊／寬帶鉤是條件化名稱，直接掛在 outsideLiberties variation axis，不拆成三個無關 concept。"
    }
  ];

  const ENTITY_VALUES = new Set(Object.values(ENTITY_TYPE));
  const NAME_VALUES = new Set(Object.values(NAME_STATUS));
  const ROLE_VALUES = new Set(Object.values(SEMANTIC_ROLE));
  const RELATION_VALUES = new Set(Object.values(RELATION));
  const SCOPE_VALUES = new Set(Object.values(USAGE_SCOPE));

  function validateName(item) {
    return item && typeof item.locale === "string" && item.locale && typeof item.name === "string" && item.name
      && NAME_VALUES.has(item.nameStatus) && ROLE_VALUES.has(item.semanticRole)
      && RELATION_VALUES.has(item.relationToCanonical) && SCOPE_VALUES.has(item.usageScope)
      && Object.values(REVIEW).includes(item.reviewStatus) && Array.isArray(item.sourceIds)
      && item.sourceIds.every((id) => Boolean(sources[id]));
  }

  function validateConcept(concept) {
    if (!concept || typeof concept.id !== "string" || !concept.id) return false;
    if (!ENTITY_VALUES.has(concept.entityType)) return false;
    if (!Object.values(REVIEW).includes(concept.reviewStatus)) return false;
    if (!Array.isArray(concept.names) || !concept.names.every(validateName)) return false;
    if (!Array.isArray(concept.nameResearch) || !Array.isArray(concept.rulesetBehavior) || !Array.isArray(concept.negativeMappings)) return false;
    if (!concept.geometryIdentity || !Object.values(REVIEW).includes(concept.geometryIdentity.reviewStatus)) return false;
    if (!Array.isArray(concept.sourceIds) || !concept.sourceIds.every((id) => Boolean(sources[id]))) return false;
    for (const research of concept.nameResearch) {
      if (!research.reviewedAt || !Array.isArray(research.searchScope) || !research.searchScope.length) return false;
    }
    return true;
  }

  if (!concepts.every(validateConcept)) throw new Error("Invalid classic-shape ontology concept.");

  return Object.freeze({
    version:"classic-shape-ontology-v2",
    REVIEW,
    ENTITY_TYPE,
    NAME_STATUS,
    SEMANTIC_ROLE,
    RELATION,
    USAGE_SCOPE,
    sources,
    concepts:Object.freeze(concepts.map((concept) => Object.freeze(concept))),
    validateName,
    validateConcept
  });
});
