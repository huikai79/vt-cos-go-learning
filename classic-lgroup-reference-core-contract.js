(function (root, factory) {
  const geometry = typeof module === "object" && module.exports
    ? require("./classic-geometry-fingerprint.js")
    : root.GoClassicGeometryFingerprint;
  const api = factory(geometry);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoLGroupReferenceCoreContract = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Geometry) {
  "use strict";

  if (!Geometry) throw new Error("Geometry fingerprint runtime is required.");

  const VERSION="lgroup-reference-core-contract-v1";
  const COMPARISON_CONTRACT_ID="lgroup-source-marked-l-tetromino-core-v1";
  const AUTHORITY="research_hypothesis_only";

  const STATUS=Object.freeze({
    MATCH:"REFERENCE_CORE_MATCH",
    DIFFERENT:"REFERENCE_CORE_DIFFERENT",
    NEEDS_HUMAN_REVIEW:"NEEDS_HUMAN_REVIEW",
    INVALID:"INVALID"
  });

  const SELECTION_BASIS=Object.freeze({
    ENTIRE_TARGET_GROUP:"entire_target_group",
    SOURCE_NATIVE_MARKED_SUBSET:"source_native_marked_subset"
  });

  // Project-generated abstract L tetromino hypothesis. This is not source geometry.
  const CANDIDATE_POINTS=Object.freeze([[0,0],[1,0],[2,0],[2,1]].map(Object.freeze));
  const CANDIDATE_SIGNATURE=Geometry.canonicalShapeSignature(CANDIDATE_POINTS).signature;

  function evaluate({
    points,
    selectionBasis,
    sourceDirectlyLabelsLGroup=false,
    markedSubsetSemanticsReviewed=false
  }={}) {
    const errors=[];
    if (!sourceDirectlyLabelsLGroup) errors.push("source does not directly label the observed arrangement as L Group");
    if (!Object.values(SELECTION_BASIS).includes(selectionBasis)) errors.push("selection basis invalid");
    const validation=Geometry.validatePointSet(points);
    if (!validation.ok) errors.push(...validation.errors);
    if (errors.length) {
      return {ok:false,status:STATUS.INVALID,errors,decisive:false,canonicalPromotionAllowed:false};
    }

    if (selectionBasis===SELECTION_BASIS.SOURCE_NATIVE_MARKED_SUBSET && markedSubsetSemanticsReviewed!==true) {
      return {
        ok:false,
        status:STATUS.NEEDS_HUMAN_REVIEW,
        errors:["source-native marks are visible but their semantic role has not been independently reviewed"],
        decisive:false,
        canonicalPromotionAllowed:false
      };
    }

    if (points.length!==4) {
      return {
        ok:true,
        status:STATUS.DIFFERENT,
        errors:[],
        decisive:true,
        sameCoreShape:false,
        canonicalPromotionAllowed:false
      };
    }

    const shape=Geometry.canonicalShapeSignature(points);
    if (!shape.ok) return {ok:false,status:STATUS.INVALID,errors:shape.errors,decisive:false,canonicalPromotionAllowed:false};
    const sameCoreShape=shape.signature===CANDIDATE_SIGNATURE;
    return {
      ok:true,
      status:sameCoreShape ? STATUS.MATCH : STATUS.DIFFERENT,
      errors:[],
      decisive:true,
      sameCoreShape,
      canonicalPromotionAllowed:false
    };
  }

  return Object.freeze({
    version:VERSION,
    authority:AUTHORITY,
    COMPARISON_CONTRACT_ID,
    STATUS,
    SELECTION_BASIS,
    evaluate
  });
});
