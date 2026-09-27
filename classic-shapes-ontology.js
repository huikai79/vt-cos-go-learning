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
    LIFE_DEATH_FAMILY: "life_death_family",
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

  const TAXONOMY_RELATION = Object.freeze({
    ROOT_OF_SERIES: "root_of_series",
    EXTENSION_OF: "extension_of",
    RELATED_SERIES_MEMBER: "related_series_member",
    SPECIALIZED_RELATED_SHAPE: "specialized_related_shape",
    UNRESOLVED: "unresolved"
  });

  const GEOMETRY_RELATION = Object.freeze({
    SAME: "same",
    VARIANT_OF: "variant_of",
    OVERLAPS: "overlaps",
    RELATED_UNRESOLVED: "related_unresolved",
    DISTINCT: "distinct"
  });

  const AMBIGUITY_STATUS = Object.freeze({
    AMBIGUOUS_HISTORICAL_MAPPING: "ambiguous_historical_mapping",
    GEOMETRY_REQUIRED: "geometry_required"
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
    nihonkiinThreeNakade: source("nihonkiinThreeNakade","日本棋院：三目中手の活用","https://www.nihonkiin.or.jp/publishing/books/igo_drill4.html","official","nihonkiin-three-nakade"),
    playgoBentThree: source("playgoBentThree","PlayGo：Bent Three vital point","https://playgogame.org/blog/tsumego-trainer-launch","instructional_secondary","playgo-bent-three"),
    ntkrFlowerSix: source("ntkrFlowerSix","日本囲碁連盟：花六","https://www.ntkr.co.jp/igoyogo/yogo_801.html","publisher","ntkr-flower-six"),
    cazenaveRabbitySix: source("cazenaveRabbitySix","Vilà & Cazenave：When One Eye is Sufficient","https://www.lamsade.dauphine.fr/~cazenave/papers/eyeLabelling.pdf","primary_research","cazenave-rabbity-six"),
    bgaTerms: source("bgaTerms","British Go Association：Japanese Go terms","https://www.britgo.org/general/definitions.html","association","bga-terms"),
    bgaRules: source("bgaRules","British Go Association：rules comparison","https://www.britgo.org/rules/compare.html","association","bga-rules"),
    bgaIndex: source("bgaIndex","British Go Journal：Life & Death index","https://britgo.org/bgj/index/subj-inf.html","association","bga-ld-index"),
    bgaTripod: source("bgaTripod","British Go Journal：Tripod Group example","https://www.britgo.org/files/bgj/bgj135.pdf","association","bga-tripod"),
    bgaThreeSpaceNotcher: source("bgaThreeSpaceNotcher","British Go Journal：Three-space notcher family","https://www.britgo.org/files/bgj/bgj123.pdf","association","bga-three-space-notcher"),
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
    boardToBitsBulkyReduction: source("boardToBitsBulkyReduction","Board to Bits Go：Big Eyes","https://boardtobitsgo.wordpress.com/2020/09/02/lesson-6-big-eyes/","instructional_secondary","board-to-bits-big-eyes"),
    chenStaticLifeDeath: source("chenStaticLifeDeath","Chen & Chen (1999)：Static analysis of life and death in Go","https://www.sciencedirect.com/science/article/pii/S0020025599000833","primary_research","chen-chen-static-life-death"),
    meaningfulStonesCrossFive: source("meaningfulStonesCrossFive","Meaningful Stones：Cross Five","https://jimseibert.github.io/Meaningful-Stones/sec-shapes.html","instructional_secondary","meaningful-stones-cross-five"),
    yikePlumFive: source("yikePlumFive","弈客圍棋：大眼（5）梅花五","https://www.sohu.com/a/475377109_533159","publisher_secondary","yike-plum-five"),
    hzSchoolVitalShapes: source("hzSchoolVitalShapes","浙江工大附校：死活棋要點","https://www.hzxhjy.cn/zgdfs/bfst/tylst/wq/201902/t20190226_26916.shtml","educational_secondary","hz-school-vital-shapes"),
    senseisGoldenChicken: source("senseisGoldenChicken","Sensei's Library：Golden Chicken Standing on One Leg","https://senseis.xmp.net/?GoldenChickenStandingOnOneLeg=","community_secondary","senseis-golden-chicken"),
    centralGoGoldenChicken: source("centralGoGoldenChicken","中央棋院：金雞獨立","https://vocus.cc/article/6698ae7ffd89780001ee7a83","instructional_secondary","central-go-golden-chicken"),
    yeefanPyramidFour: source("yeefanPyramidFour","YeeFan：Multiple-Space Eyes / Pyramid Four","https://yeefan.sg/weiqi/howtoplaygo/howtoplaygo06.htm","instructional_secondary","yeefan-multiple-space-eyes"),
    bgaPyramidFour: source("bgaPyramidFour","British Go Journal：Nakade / Pyramid Four examples","https://www.britgo.org/files/bgj/bgj123.pdf","association","bga-pyramid-four"),
    boodBigPigsMouthConfig: source("boodBigPigsMouthConfig","bood/go-test：j_group_live2 regression config","https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/config.yml","oss_regression","bood-go-test-j-group"),
    boodBigPigsMouthSgf: source("boodBigPigsMouthSgf","bood/go-test：大猪嘴.sgf","https://github.com/bood/go-test/blob/2f3db241dc26a5ab59c86cf1293b3b005283c288/sgf/%E5%A4%A7%E7%8C%AA%E5%98%B4.sgf","oss_regression","bood-go-test-j-group"),
    tchanLifeDeathMonth: source("tchanLifeDeathMonth","圍棋死活一月通目錄：大豬嘴型 / J-Group Pattern","https://tchan001.wordpress.com/2010/05/05/weiqi-one-month-to-understand-series-7-books/","bibliographic_secondary","life-death-month-index"),
    badukworldProverbs: source("badukworldProverbs","BadukWorld：사활격언 / L Group related series","https://badukworld.co.kr/biz/terms3.html","community_secondary","badukworld-life-death-proverbs"),
    badukworldCarpenterShape2: source("badukworldCarpenterShape2","BadukWorld：Carpenter's Square Diagram 2.1","https://www.badukworld.co.kr/biz/lesson2/csqare/csq2.html","instructional_secondary","badukworld-carpenter-series"),
    ondaCornerL: source("ondaCornerL","恩田烈彦：隅のL字型をマスターしよう","https://note.com/go_pro275_denen/n/n299c0c730c08","professional_instruction","onda-corner-l"),
    legacyEnglishChineseTerms: source("legacyEnglishChineseTerms","2007 臺灣網路流傳英文圍棋術語：Carpenter's Square → 小曲尺","https://www.ptt.cc/bbs/NCCUGO/M.1191493050.A.A65.html","historical_community","legacy-en-zh-terms-2007"),
    chineseSmallCarpenterDead: source("chineseSmallCarpenterDead","中文教學：小曲尺是死棋","https://read01.com/BngJNdM.html","instructional_secondary","chinese-small-carpenter-dead"),
    badukworldYeeFanTerms: source("badukworldYeeFanTerms","BadukWorld：YeeFan 中韓英術語鏡像","https://badukworld.co.kr/biz/YeeFan.html","community_secondary","yeefan-chinese-terms"),
    koreanWikibooksLifeDeath: source("koreanWikibooksLifeDeath","韓文 Wikibooks：바둑 입문/사활（빗형）","https://ko.wikibooks.org/wiki/%EB%B0%94%EB%91%91_%EC%9E%85%EB%AC%B8/%EC%82%AC%ED%99%9C","community_secondary","korean-wikibooks-life-death"),
    lifeIn19x19DaviesNotes: source("lifeIn19x19DaviesNotes","LifeIn19x19：James Davies《Life and Death》讀書筆記","https://www.lifein19x19.com/viewtopic.php?t=4820","community_secondary","davies-life-death-community-notes")
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
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
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
      taxonomyMemberships:[], rulesetBehavior:[],
      negativeMappings:[{locale:"zh-Hant",name:"刀把五",relation:"unique_name_for_category",status:"blocked",reason:"五目中手是上位分類，不是刀把五的唯一專名",sourceIds:["nihonkiinFive"]}],
      sourceIds:["nihonkiinFive"], note:"分類層級不可自動等同任何單一五點名型。"
    },
    {
      id:"curved-four-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"折線四目眼有兩個互為 miai 的做眼回應", practiceStatus:"playable_rules_backed_status_proof_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","曲四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese"],{displayPreference:"project"}),
        name("zh-Hant","彎四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese"]),
        name("en","Curved Four",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.PROFESSIONAL_TEXTBOOK,REVIEW.VERIFIED,["chenStaticLifeDeath"]),
        name("en","Bent Four",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-curved-four-status-v1","L-tetromino","center",{surroundingDefects:"sealed"}),
      taxonomyMemberships:[], rulesetBehavior:[],
      negativeMappings:[{locale:"en",name:"Bent Four in the Corner",relation:"exact_alias",status:"blocked",reason:"盤角曲四是 corner/rules-sensitive concept，不等同 sealed interior Curved Four",sourceIds:["nihonkiinBentFour","bgaRules"]}],
      sourceIds:["go4goChinese","chenStaticLifeDeath"],
      note:"限定完全包圍、無缺陷的折線四點 eye-region；攻方任一第一手後，守方都有回應留下兩個分離眼點。不得與盤角曲四自動合併。"
    },
    {
      id:"square-four-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"2×2 四目眼沒有做活急所", practiceStatus:"playable_rules_backed_status_proof_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","方四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("en","Square Four",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["boardToBitsBulkyReduction"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-four-space-status-v1","O-tetromino","center",{surroundingDefects:"sealed"}),
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","boardToBitsBulkyReduction"],
      note:"限定完全包圍、無缺陷的四點 2×2 眼空。守方任一第一手都留下曲三，攻方仍可搶彎點，因此局部狀態為死；不外推含缺陷或外部連接的全局棋塊。"
    },
    {
      id:"straight-four-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"直線四目眼有兩個互為 miai 的做眼點", practiceStatus:"playable_rules_backed_status_proof_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","直四",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("en","Straight Four",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["boardToBitsBulkyReduction"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-four-space-status-v1","I-tetromino","center",{surroundingDefects:"sealed"}),
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","boardToBitsBulkyReduction"],
      note:"限定完全包圍、無缺陷的直線四點眼空。攻方任一第一手後，守方總有回應留下兩個分離眼點，因此局部狀態為活；不外推含缺陷或邊角特殊條件的局面。"
    },
    {
      id:"bent-three-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"L 形三點眼空的彎點急所", practiceStatus:"playable_bounded_geometry_derived_vital_point_contract", reviewStatus:REVIEW.VERIFIED,
      names:[
        name("zh-Hant","曲三",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("zh-Hant","彎三",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.COMMUNITY,REVIEW.PARTIAL,["go4goChinese"]),
        name("en","Bent Three",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.VERIFIED,["playgoBentThree"]),
        name("ja-JP","三目中手",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.CATEGORY_NAME,RELATION.BROADER,USAGE_SCOPE.OFFICIAL,REVIEW.VERIFIED,["nihonkiinThreeNakade"])
      ],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.VERIFIED,"classic-bent-three-vital-point-v1","L-triomino","center",{}),
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","nihonkiinThreeNakade","playgoBentThree"],
      note:"canonical identity 是 L triomino；急所由唯一 degree-2 彎點即時計算。日文三目中手是較廣分類，不當成 Bent Three 的唯一 exact 名稱。"
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
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
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
      taxonomyMemberships:[], rulesetBehavior:[],
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
      taxonomyMemberships:[], rulesetBehavior:[
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
        name("zh-Hant","小曲尺",NAME_STATUS.NEEDS_REVIEW,SEMANTIC_ROLE.FAMILY_NAME,RELATION.UNKNOWN,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.NEEDS_REVIEW,["legacyEnglishChineseTerms"]),
        name("zh-Hant","木匠方",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh-TW",status:"regional_preference_unresolved",reviewedAt:"2026-09-27",searchScope:["Taiwan professional material","Taiwan go associations","Taiwan teaching usage"]}],
      geometryIdentity:geometry("corner_family",REVIEW.PARTIAL,null,null,"corner",{}), taxonomyMemberships:[], rulesetBehavior:[],
      negativeMappings:[{locale:"zh-TW",name:"金櫃角",relation:"regional_preferred_name",status:"blocked_pending_regional_usage",reason:"簡繁字形轉換不等於臺灣慣用名稱",sourceIds:["ffgDictionary"]}],
      sourceIds:["nihonkiinCarpenter","bgaTerms","ffgDictionary","go4goChinese","yeefanChineseTerms","legacyEnglishChineseTerms"], note:"日英 mapping 穩固；繁中首選名稱未判定；「小曲尺」存在歷史映射歧義，不得視為 exact alias。"
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
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
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
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
      sourceIds:["meaningfulStonesCrossFive","yikePlumFive","hzSchoolVitalShapes","ffgDictionary"], note:"Cross Five / Crossed Five 分別保存 provenance，不自行正規化成單一英文拼法。"
    },
    {
      id:"grape-six-candidate-v1", entityType:ENTITY_TYPE.NAKADE_SHAPE, catalogCategory:"nakade",
      teachingLabel:"六點大眼名型候選", practiceStatus:"catalog_candidate_only", reviewStatus:REVIEW.NEEDS_REVIEW,
      names:[name("zh-Hant","葡萄六",NAME_STATUS.NEEDS_REVIEW,SEMANTIC_ROLE.EXACT_SHAPE_NAME,RELATION.UNKNOWN,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.NEEDS_REVIEW,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"})],
      nameResearch:[], geometryIdentity:geometry("shape_family",REVIEW.NEEDS_REVIEW,null,null,"local",{}), taxonomyMemberships:[], rulesetBehavior:[],
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
      taxonomyMemberships:[
        {taxonomyId:"badukworld-life-death-proverbs",familyId:"small-carpenter-like-series",role:"extension_member",reviewStatus:REVIEW.PARTIAL,sourceIds:["badukworldProverbs"]}
      ],
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["go4goChinese","yeefanChineseTerms","tchanLifeDeathMonth","boodBigPigsMouthConfig","boodBigPigsMouthSgf","badukworldProverbs"], note:"name mapping 支持；只有 exact source-case geometry 已可執行驗證。"
    },
    {
      id:"small-pigs-mouth-candidate-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"corner_life_death",
      teachingLabel:"角部經典死活候選", practiceStatus:"catalog_candidate_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("zh-Hant","小豬嘴",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"],{displayPreference:"project"}),
        name("en","Tripod Group with Extra Leg",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.OVERLAP,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["go4goChinese","yeefanChineseTerms"])
      ],
      nameResearch:[], geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), taxonomyMemberships:[], rulesetBehavior:[],
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
      taxonomyMemberships:[], rulesetBehavior:[],
      negativeMappings:[{locale:null,name:"static nakade shape",relation:"entity_type",status:"blocked",reason:"金雞獨立是 tesuji mechanism，不是固定中手 geometry",sourceIds:["senseisGoldenChicken","centralGoGoldenChicken"]}],
      sourceIds:["centralGoGoldenChicken","senseisGoldenChicken","ffgDictionary","go4goChinese"], note:"跨語對應採 mechanism-equivalent，不假裝成同一靜態棋形名稱。"
    },
    {
      id:"three-space-notcher-v1", entityType:ENTITY_TYPE.LIFE_DEATH_FAMILY, catalogCategory:"complex_life_death",
      teachingLabel:"Three-Space Notcher", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","Three-Space Notcher",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.PARTIAL,["bgaThreeSpaceNotcher"])
      ],
      nameResearch:[{locale:"zh",status:"exact_mapping_unverified",reviewedAt:"2026-09-28",searchScope:["zh-CN","zh-TW","鎖型","Three-Space Notcher","Chinese Go terminology sources"]}],
      geometryIdentity:geometry("life_death_family",REVIEW.NEEDS_REVIEW,null,null,"local",{}),
      taxonomyMemberships:[], rulesetBehavior:[],
      negativeMappings:[{locale:"zh-Hant",name:"鎖型",relation:"exact_alias",status:"blocked_pending_direct_or_geometry_evidence",reason:"截至 2026-09-28 尚未找到可直接支持「鎖型 = Three-Space Notcher」的跨語來源；目前只保留待 geometry/source review 的候選關係。",sourceIds:[]}],
      sourceIds:["bgaThreeSpaceNotcher"],
      note:"BGA 可確認 Three-space notcher 是既有死活 family；中文「鎖型」目前不得升格為 alias。geometry 尚未以可重算座標建立。"
    },
    {
      id:"comb-formation-v1", entityType:ENTITY_TYPE.LIFE_DEATH_FAMILY, catalogCategory:"complex_life_death",
      teachingLabel:"梳形／Comb Formation", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","Comb Formation",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaIndex"]),
        name("zh-Hant","梳形",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.VERIFIED,["ffgDictionary","yeefanChineseTerms"],{displayPreference:"project"}),
        name("zh-Hant","梳形板六",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.NARROWER,USAGE_SCOPE.LEXICOGRAPHIC,REVIEW.PARTIAL,["yeefanChineseTerms"],{condition:{eyeSpaceSize:6}}),
        name("ja-JP","櫛形",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.VERIFIED,["ffgDictionary"]),
        name("ko-KR","빗형",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["badukworldYeeFanTerms","koreanWikibooksLifeDeath"]),
        name("ko-KR","판륙",NAME_STATUS.RARE_OR_LEXICOGRAPHIC,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.FEDERATION_DICTIONARY,REVIEW.PARTIAL,["ffgDictionary"])
      ],
      nameResearch:[],
      geometryIdentity:geometry("life_death_family",REVIEW.NEEDS_REVIEW,null,null,"local",{location:"variant_axis_required"}),
      taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaIndex","ffgDictionary","yeefanChineseTerms","badukworldYeeFanTerms","koreanWikibooksLifeDeath","lifeIn19x19DaviesNotes"],
      note:"梳形／櫛形／Comb Formation 的名稱鏈已有直接跨語來源；韓文同時保留 빗형 與詞典型 판륙。名稱成立不等於 geometry 已驗證；角部／邊部變化仍須 geometry-first extraction。"
    },
    {
      id:"l-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"L Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","L Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaIndex"]),
        name("ja-JP","隅のL字型",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.PROFESSIONAL_TEXTBOOK,REVIEW.PARTIAL,["ondaCornerL"]),
        name("ko-KR","작은 됫박형",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.COMMUNITY,REVIEW.PARTIAL,["badukworldProverbs"]),
        name("zh-Hant","L 形角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}),
      taxonomyMemberships:[
        {taxonomyId:"badukworld-life-death-proverbs",familyId:"small-carpenter-like-series",role:"root_example",reviewStatus:REVIEW.PARTIAL,sourceIds:["badukworldProverbs"]}
      ],
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaIndex","ondaCornerL","badukworldProverbs"], note:"英／日／韓教學鏈已明確支持 L Group 對應；中文「小曲尺」仍是 geometry-required ambiguity，不能升格。"
    },
    {
      id:"l-plus-one-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"L+1 Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","L+1 Group",NAME_STATUS.ESTABLISHED_ALIAS,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.INSTRUCTIONAL,REVIEW.PARTIAL,["takumiKyu"]),
        name("zh-Hant","L+1 角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}),
      taxonomyMemberships:[
        {taxonomyId:"badukworld-life-death-proverbs",familyId:"small-carpenter-like-series",role:"extension_member",reviewStatus:REVIEW.PARTIAL,sourceIds:["badukworldProverbs"]}
      ],
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["takumiKyu","badukworldProverbs"], note:"英語 family 名保留；BadukWorld 將 L+1 列入 L Group 延伸系列，但這不等於已證明 geometry variant 關係。"
    },
    {
      id:"tripod-group-v1", entityType:ENTITY_TYPE.CORNER_LIFE_DEATH_FAMILY, catalogCategory:"complex_corner",
      teachingLabel:"Tripod Group", practiceStatus:"catalog_only", reviewStatus:REVIEW.PARTIAL,
      names:[
        name("en","Tripod Group",NAME_STATUS.ESTABLISHED,SEMANTIC_ROLE.FAMILY_NAME,RELATION.EXACT,USAGE_SCOPE.ASSOCIATION,REVIEW.VERIFIED,["bgaTripod"]),
        name("zh-Hant","三腳形角部死活",NAME_STATUS.DESCRIPTIVE_TRANSLATION,SEMANTIC_ROLE.DESCRIPTIVE_LABEL,RELATION.EXACT,USAGE_SCOPE.PROJECT_ONLY,REVIEW.PARTIAL,[])
      ],
      nameResearch:[{locale:"zh",status:NAME_STATUS.NO_ESTABLISHED_NAME_FOUND,reviewedAt:"2026-09-27",searchScope:chineseSearchScope}],
      geometryIdentity:geometry("corner_family",REVIEW.NEEDS_REVIEW,null,null,"corner",{}), taxonomyMemberships:[], rulesetBehavior:[], negativeMappings:[],
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
      taxonomyMemberships:[
        {taxonomyId:"badukworld-life-death-proverbs",familyId:"small-carpenter-like-series",role:"extension_member",reviewStatus:REVIEW.PARTIAL,sourceIds:["badukworldProverbs"]}
      ],
      rulesetBehavior:[], negativeMappings:[],
      sourceIds:["bgaIndex","go4goChinese","yeefanChineseTerms","chineseTermsPdf","badukworldProverbs"], note:"緊／寬帶鉤是條件化名稱，直接掛在 outsideLiberties variation axis，不拆成三個無關 concept。"
    }
  ];

  const nameAmbiguities = Object.freeze([
    Object.freeze({
      id:"zh-small-carpenters-square-ambiguity-v1",
      locale:"zh-Hant",
      name:"小曲尺",
      status:AMBIGUITY_STATUS.AMBIGUOUS_HISTORICAL_MAPPING,
      resolutionRequirement:AMBIGUITY_STATUS.GEOMETRY_REQUIRED,
      candidateConceptIds:Object.freeze(["carpenters-square-v1","l-group-v1"]),
      reviewStatus:REVIEW.NEEDS_REVIEW,
      sourceIds:Object.freeze(["legacyEnglishChineseTerms","chineseSmallCarpenterDead","badukworldProverbs"]),
      note:"舊英中術語鏈直接把 Carpenter's Square 寫成小曲尺；另一中文教學把小曲尺描述為死棋，而韓文教材明確區分 Carpenter's Square 為劫、L Group 為死。衝突只能靠 geometry-first retrieval 解決。"
    })
  ]);

  const nameRelations = Object.freeze([
    Object.freeze({id:"l-group-en-ja-v1",subject:{conceptId:"l-group-v1",locale:"en",name:"L Group"},relation:"cross_language_mapping",object:{conceptId:"l-group-v1",locale:"ja-JP",name:"隅のL字型"},reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["ondaCornerL","bgaIndex"])}),
    Object.freeze({id:"l-group-en-ko-v1",subject:{conceptId:"l-group-v1",locale:"en",name:"L Group"},relation:"cross_language_mapping",object:{conceptId:"l-group-v1",locale:"ko-KR",name:"작은 됫박형"},reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["badukworldProverbs","bgaIndex"])}),
    Object.freeze({id:"comb-en-zh-v1",subject:{conceptId:"comb-formation-v1",locale:"en",name:"Comb Formation"},relation:"cross_language_mapping",object:{conceptId:"comb-formation-v1",locale:"zh-Hant",name:"梳形"},reviewStatus:REVIEW.VERIFIED,sourceIds:Object.freeze(["ffgDictionary","yeefanChineseTerms"])}),
    Object.freeze({id:"comb-en-ja-v1",subject:{conceptId:"comb-formation-v1",locale:"en",name:"Comb Formation"},relation:"cross_language_mapping",object:{conceptId:"comb-formation-v1",locale:"ja-JP",name:"櫛形"},reviewStatus:REVIEW.VERIFIED,sourceIds:Object.freeze(["ffgDictionary"])}),
    Object.freeze({id:"comb-en-ko-bit-v1",subject:{conceptId:"comb-formation-v1",locale:"en",name:"Comb Formation"},relation:"cross_language_mapping",object:{conceptId:"comb-formation-v1",locale:"ko-KR",name:"빗형"},reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["badukworldYeeFanTerms","koreanWikibooksLifeDeath"])}),
    Object.freeze({id:"comb-en-ko-panryuk-v1",subject:{conceptId:"comb-formation-v1",locale:"en",name:"Comb Formation"},relation:"cross_language_mapping",object:{conceptId:"comb-formation-v1",locale:"ko-KR",name:"판륙"},reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["ffgDictionary"])})
  ]);

  const taxonomyRelations = Object.freeze([
    Object.freeze({id:"badukworld-l-plus-one-extension-v1",taxonomyId:"badukworld-life-death-proverbs",subjectConceptId:"l-plus-one-group-v1",relation:TAXONOMY_RELATION.EXTENSION_OF,objectConceptId:"l-group-v1",reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["badukworldProverbs"]),note:"教學系列關係；不是 geometry variant 的證明。"}),
    Object.freeze({id:"badukworld-long-l-extension-v1",taxonomyId:"badukworld-life-death-proverbs",subjectConceptId:"long-l-group-v1",relation:TAXONOMY_RELATION.RELATED_SERIES_MEMBER,objectConceptId:"l-group-v1",reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["badukworldProverbs"]),note:"同一韓文教學延伸系列。"}),
    Object.freeze({id:"badukworld-j-extension-v1",taxonomyId:"badukworld-life-death-proverbs",subjectConceptId:"big-pigs-mouth-candidate-v1",relation:TAXONOMY_RELATION.RELATED_SERIES_MEMBER,objectConceptId:"l-group-v1",reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["badukworldProverbs"]),note:"J Group 被列在 L Group 延伸系列中；不改 J Group 自身 canonical family。"}),
    Object.freeze({id:"davies-comb-related-notcher-v1",taxonomyId:"davies-life-death-secondary-notes",subjectConceptId:"comb-formation-v1",relation:TAXONOMY_RELATION.SPECIALIZED_RELATED_SHAPE,objectConceptId:"three-space-notcher-v1",reviewStatus:REVIEW.PARTIAL,sourceIds:Object.freeze(["lifeIn19x19DaviesNotes"]),note:"來源是對 James Davies《Life and Death》的二手讀書筆記；只保存 source-specific taxonomy relation，不升格為 geometry alias 或 canonical parent。"})
  ]);

  const geometryRelations = Object.freeze([
    Object.freeze({id:"l-vs-carpenter-unresolved-v1",subjectConceptId:"l-group-v1",relation:GEOMETRY_RELATION.RELATED_UNRESOLVED,objectConceptId:"carpenters-square-v1",reviewStatus:REVIEW.NEEDS_REVIEW,sourceIds:Object.freeze(["badukworldProverbs","legacyEnglishChineseTerms"]),note:"韓文 taxonomy 明確區分兩者；中文小曲尺映射衝突。這只證明需要 geometry review，不證明 parent/variant。"})
  ]);

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
    if (!Array.isArray(concept.nameResearch) || !Array.isArray(concept.taxonomyMemberships) || !Array.isArray(concept.rulesetBehavior) || !Array.isArray(concept.negativeMappings)) return false;
    if (!concept.geometryIdentity || !Object.values(REVIEW).includes(concept.geometryIdentity.reviewStatus)) return false;
    if (!Array.isArray(concept.sourceIds) || !concept.sourceIds.every((id) => Boolean(sources[id]))) return false;
    for (const research of concept.nameResearch) {
      if (!research.reviewedAt || !Array.isArray(research.searchScope) || !research.searchScope.length) return false;
    }
    for (const membership of concept.taxonomyMemberships) {
      if (!membership.taxonomyId || !membership.familyId || !membership.role || !Object.values(REVIEW).includes(membership.reviewStatus)) return false;
      if (!Array.isArray(membership.sourceIds) || !membership.sourceIds.every((id) => Boolean(sources[id]))) return false;
    }
    return true;
  }

  const conceptIds = new Set(concepts.map((concept) => concept.id));

  function validSourceIds(ids) {
    return Array.isArray(ids) && ids.every((id) => Boolean(sources[id]));
  }

  function validateAmbiguity(item) {
    return item && item.id && item.locale && item.name
      && Object.values(AMBIGUITY_STATUS).includes(item.status)
      && Object.values(AMBIGUITY_STATUS).includes(item.resolutionRequirement)
      && Array.isArray(item.candidateConceptIds) && item.candidateConceptIds.length >= 2
      && item.candidateConceptIds.every((id) => conceptIds.has(id))
      && Object.values(REVIEW).includes(item.reviewStatus)
      && validSourceIds(item.sourceIds);
  }

  function validateNameRelation(item) {
    return item && item.id && item.subject && item.object && item.relation
      && conceptIds.has(item.subject.conceptId) && conceptIds.has(item.object.conceptId)
      && Object.values(REVIEW).includes(item.reviewStatus)
      && validSourceIds(item.sourceIds);
  }

  function validateTaxonomyRelation(item) {
    return item && item.id && item.taxonomyId
      && conceptIds.has(item.subjectConceptId) && conceptIds.has(item.objectConceptId)
      && Object.values(TAXONOMY_RELATION).includes(item.relation)
      && Object.values(REVIEW).includes(item.reviewStatus)
      && validSourceIds(item.sourceIds);
  }

  function validateGeometryRelation(item) {
    return item && item.id
      && conceptIds.has(item.subjectConceptId) && conceptIds.has(item.objectConceptId)
      && Object.values(GEOMETRY_RELATION).includes(item.relation)
      && Object.values(REVIEW).includes(item.reviewStatus)
      && validSourceIds(item.sourceIds);
  }

  if (!concepts.every(validateConcept)) throw new Error("Invalid classic-shape ontology concept.");
  if (!nameAmbiguities.every(validateAmbiguity)) throw new Error("Invalid classic-shape name ambiguity.");
  if (!nameRelations.every(validateNameRelation)) throw new Error("Invalid classic-shape name relation.");
  if (!taxonomyRelations.every(validateTaxonomyRelation)) throw new Error("Invalid classic-shape taxonomy relation.");
  if (!geometryRelations.every(validateGeometryRelation)) throw new Error("Invalid classic-shape geometry relation.");

  return Object.freeze({
    version:"classic-shape-ontology-v4",
    REVIEW,
    ENTITY_TYPE,
    NAME_STATUS,
    SEMANTIC_ROLE,
    RELATION,
    TAXONOMY_RELATION,
    GEOMETRY_RELATION,
    AMBIGUITY_STATUS,
    USAGE_SCOPE,
    sources,
    concepts:Object.freeze(concepts.map((concept) => Object.freeze(concept))),
    nameAmbiguities,
    nameRelations,
    taxonomyRelations,
    geometryRelations,
    validateName,
    validateConcept,
    validateAmbiguity,
    validateNameRelation,
    validateTaxonomyRelation,
    validateGeometryRelation
  });
});
