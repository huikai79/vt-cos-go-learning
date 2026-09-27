(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicGeometryEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EVIDENCE_STATUS = Object.freeze({
    GEOMETRY_VERIFIED_FROM_CONTRACT: "geometry_verified_from_contract",
    TEXT_ONLY_GEOMETRY_UNAVAILABLE: "text_only_geometry_unavailable",
    DIAGRAM_REQUIRES_EXTRACTION: "diagram_requires_extraction"
  });

  const records = Object.freeze([
    Object.freeze({
      id:"pyramid-four-contract-geometry-v1",
      conceptId:"pyramid-four-v1",
      sourceType:"internal_contract",
      sourceId:"classic-pyramid-four-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      points:Object.freeze([[1,0],[0,1],[1,1],[2,1]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"bulky-five-contract-geometry-v1",
      conceptId:"knife-five-candidate-v1",
      sourceType:"internal_contract",
      sourceId:"classic-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      points:Object.freeze([[0,0],[1,0],[0,1],[1,1],[2,1]]),
      context:Object.freeze({boardContext:"local",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"cross-five-contract-geometry-v1",
      conceptId:"plum-five-candidate-v1",
      sourceType:"internal_contract",
      sourceId:"classic-cross-five-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      points:Object.freeze([[1,0],[0,1],[1,1],[2,1],[1,2]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"flower-six-contract-geometry-v1",
      conceptId:"flower-six-v1",
      sourceType:"internal_contract",
      sourceId:"classic-flower-six-vital-point-v1",
      evidenceStatus:EVIDENCE_STATUS.GEOMETRY_VERIFIED_FROM_CONTRACT,
      points:Object.freeze([[1,1],[2,1],[1,2],[2,2],[0,1],[1,0]]),
      context:Object.freeze({boardContext:"center",boundary:[],role:"shape",toPlay:"unspecified"})
    }),
    Object.freeze({
      id:"small-ruler-legacy-name-only-v1",
      conceptId:null,
      ambiguityId:"zh-small-carpenters-square-ambiguity-v1",
      sourceType:"external_text",
      sourceId:"legacyEnglishChineseTerms",
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"unknown",toPlay:"unspecified"}),
      note:"來源只建立名稱映射，沒有足以重建棋形的座標。"
    }),
    Object.freeze({
      id:"badukworld-carpenter-diagram-pending-v1",
      conceptId:"carpenters-square-v1",
      sourceType:"external_diagram",
      sourceId:"badukworldCarpenterShape2",
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
      evidenceStatus:EVIDENCE_STATUS.TEXT_ONLY_GEOMETRY_UNAVAILABLE,
      points:null,
      context:Object.freeze({boardContext:"corner",boundary:["top","left"],role:"defender_group",toPlay:"unspecified"}),
      note:"來源直接說 L Group is dead，但未在可檢索文字中提供 canonical coordinates。"
    })
  ]);

  function recordsForConcept(conceptId) {
    return records.filter((record) => record.conceptId === conceptId);
  }

  function recordsForAmbiguity(ambiguityId) {
    return records.filter((record) => record.ambiguityId === ambiguityId);
  }

  return Object.freeze({
    version:"classic-geometry-evidence-v1",
    EVIDENCE_STATUS,
    records,
    recordsForConcept,
    recordsForAmbiguity
  });
});
