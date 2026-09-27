(function (root, factory) {
  const extraction = typeof module === "object" && module.exports
    ? require("./classic-geometry-extraction.js")
    : root.GoClassicGeometryExtraction;
  const api = factory(extraction);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicGeometryEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Extraction) {
  "use strict";

  if (!Extraction) throw new Error("Classic geometry extraction runtime missing.");

  const EVIDENCE_STATUS = Object.freeze({
    GEOMETRY_VERIFIED_FROM_CONTRACT: "geometry_verified_from_contract",
    TEXT_ONLY_GEOMETRY_UNAVAILABLE: "text_only_geometry_unavailable",
    DIAGRAM_REQUIRES_EXTRACTION: "diagram_requires_extraction"
  });

  const records = Object.freeze([
    Object.freeze({
      id:"curved-four-contract-geometry-v1",
      conceptId:"curved-four-v1",
      sourceType:"internal_contract",
      sourceId:"classic-curved-four-status-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[0,0],[1,0],[2,0],[2,1]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"sealed-eye-space",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"square-four-contract-geometry-v1",
      conceptId:"square-four-v1",
      sourceType:"internal_contract",
      sourceId:"classic-four-space-status-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[0,0],[1,0],[0,1],[1,1]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"sealed-eye-space",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"straight-four-contract-geometry-v1",
      conceptId:"straight-four-v1",
      sourceType:"internal_contract",
      sourceId:"classic-four-space-status-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[0,0],[1,0],[2,0],[3,0]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"sealed-eye-space",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"bent-three-contract-geometry-v1",
      conceptId:"bent-three-v1",
      sourceType:"internal_contract",
      sourceId:"classic-bent-three-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[0,0],[1,0],[0,1]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"pyramid-four-contract-geometry-v1",
      conceptId:"pyramid-four-v1",
      sourceType:"internal_contract",
      sourceId:"classic-pyramid-four-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[1,0],[0,1],[1,1],[2,1]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"bulky-five-contract-geometry-v1",
      conceptId:"knife-five-candidate-v1",
      sourceType:"internal_contract",
      sourceId:"classic-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[0,0],[1,0],[0,1],[1,1],[2,1]]),
      context:Object.freeze({boardContext:"local",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"cross-five-contract-geometry-v1",
      conceptId:"plum-five-candidate-v1",
      sourceType:"internal_contract",
      sourceId:"classic-cross-five-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[1,0],[0,1],[1,1],[2,1],[1,2]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"flower-six-contract-geometry-v1",
      conceptId:"flower-six-v1",
      sourceType:"internal_contract",
      sourceId:"classic-flower-six-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      licenseStatus:Extraction.LICENSE_STATUS.PROJECT_GENERATED,
      publicGeometryPromotion:"eligible_internal_contract",
      points:Object.freeze([[1,1],[2,1],[1,2],[2,2],[0,1],[1,0]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"small-ruler-legacy-name-only-v1",
      conceptId:null,
      ambiguityId:"zh-small-curved-ruler-ambiguity-v2",
      sourceType:"external_text",
      sourceId:"legacyEnglishChineseTerms",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"unknown",toPlay:"unspecified"}),
      note:"來源只建立名稱映射，沒有足以重建棋形的座標。"
    }),
    Object.freeze({
      id:"small-ruler-chinese-teaching-text-v1",
      conceptId:"small-curved-ruler-candidate-v1",
      ambiguityId:"zh-small-curved-ruler-ambiguity-v2",
      sourceType:"external_text",
      sourceId:"chineseSmallCarpenterDead",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"life_death_family",toPlay:"unspecified"}),
      note:"來源把「小曲尺」作為基本死活型並稱其為死棋，但可擷取文字不足以重建 canonical coordinates。"
    }),
    Object.freeze({
      id:"small-ruler-course-series-text-v1",
      conceptId:"small-curved-ruler-candidate-v1",
      ambiguityId:"zh-small-curved-ruler-ambiguity-v2",
      sourceType:"external_text",
      sourceId:"renrendocCurvedSquareCourse",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"life_death_family",toPlay:"unspecified"}),
      note:"搜尋可見文字把該系列描述為曲尺型並提到最小型；user-uploaded document 的權利與圖形 extraction 均未通過 public promotion gate。"
    }),
    Object.freeze({
      id:"small-ruler-growth-story-text-v1",
      conceptId:"small-curved-ruler-candidate-v1",
      ambiguityId:"zh-small-curved-ruler-ambiguity-v2",
      sourceType:"external_text",
      sourceId:"sohuTeachingSystemSmallRuler",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"life_death_family",toPlay:"unspecified"}),
      note:"教學文章以「小曲尺長大的故事」組織延伸局面；只支持 teaching-sequence/taxonomy 訊號，不提供可重用 canonical geometry。"
    }),
    Object.freeze({
      id:"badukworld-carpenter-diagram-pending-v1",
      conceptId:"carpenters-square-v1",
      sourceType:"external_diagram",
      sourceId:"badukworldCarpenterShape2",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"blocked_pending_rights_and_extraction",
      evidenceStatus:EVIDENCE_STATUS.DIAGRAM_REQUIRES_EXTRACTION,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"defender_group",toPlay:"white"}),
      note:"來源有 Diagram 2.1，但目前 registry 尚未保存可重算座標；不得從名稱或文字自行補點。"
    }),
    Object.freeze({
      id:"badukworld-l-group-text-only-v1",
      conceptId:"l-group-v1",
      sourceType:"external_text",
      sourceId:"badukworldProverbs",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"defender_group",toPlay:"unspecified"}),
      note:"來源直接說 L Group is dead，但未在可檢索文字中提供 canonical coordinates。"
    }),
    Object.freeze({
      id:"three-space-notcher-text-only-v1",
      conceptId:"three-space-notcher-v1",
      sourceType:"external_text",
      sourceId:"bgaThreeSpaceNotcher",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"local",boundary:[],role:"life_death_family",toPlay:"unspecified"}),
      note:"BGA 文字確認 Three-space notcher family 與實例，但本 registry 尚未保存經 rights/extraction gate 驗證的 canonical coordinates。"
    }),
    Object.freeze({
      id:"comb-formation-text-only-v1",
      conceptId:"comb-formation-v1",
      sourceType:"external_text",
      sourceId:"lifeIn19x19DaviesNotes",
      licenseStatus:Extraction.LICENSE_STATUS.UNKNOWN,
      publicGeometryPromotion:"reference_only_no_geometry",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"local",boundary:[],role:"life_death_family",toPlay:"unspecified"}),
      note:"二手筆記描述 Comb Formation 與 Three-space Notcher 的關係，但未提供可直接進 public registry 的已驗證座標；只保留 textual/reference evidence。"
    })
  ]);

  function recordsForConcept(conceptId) {
    return records.filter((record) => record.conceptId === conceptId);
  }

  function recordsForAmbiguity(ambiguityId) {
    return records.filter((record) => record.ambiguityId === ambiguityId);
  }

  function canStoreSourceDerivedGeometry(record) {
    if (!record) return false;
    return Extraction.licenseAllowsPublicEvidence(record.licenseStatus);
  }

  return Object.freeze({
    version:"classic-geometry-evidence-v4",
    EVIDENCE_STATUS,
    records,
    recordsForConcept,
    recordsForAmbiguity,
    canStoreSourceDerivedGeometry
  });
});
