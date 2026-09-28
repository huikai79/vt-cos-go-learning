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

  const VERSION="lgroup-reference-core-contract-v2";
  const COMPARISON_CONTRACT_ID="lgroup-source-marked-l-tetromino-core-v2";
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

  const LABEL_SCOPE=Object.freeze({
    TARGET_GROUP:"target_group",
    MARKED_SUBSET:"marked_subset",
    POSITION_ONLY:"position_only"
  });

  // Project-generated abstract L tetromino hypothesis. This is not source geometry.
  const CANDIDATE_POINTS=Object.freeze([[0,0],[1,0],[2,0],[2,1]].map(Object.freeze));
  const CANDIDATE_SIGNATURE=Geometry.canonicalShapeSignature(CANDIDATE_POINTS).signature;

  function evaluate({
    points,
    selectionBasis,
    labelScope,
    sourceDirectlyLabelsLGroup=false,
    markedSubsetSemanticsReviewed=false
  }={}) {
    const errors=[];
    if (!sourceDirectlyLabelsLGroup) errors.push("source does not directly label the observed material as L Group");
    if (!Object.values(SELECTION_BASIS).includes(selectionBasis)) errors.push("selection basis invalid");
    if (!Object.values(LABEL_SCOPE).includes(labelScope)) errors.push("label scope invalid");
    const validation=Geometry.validatePointSet(points);
    if (!validation.ok) errors.push(...validation.errors);
    if (errors.length) {
      return {ok:false,status:STATUS.INVALID,errors,decisive:false,canonicalPromotionAllowed:false};
    }

    if (labelScope===LABEL_SCOPE.POSITION_ONLY) {
      return {
        ok:false,
        status:STATUS.NEEDS_HUMAN_REVIEW,
        errors:["source labels the position, not a specific target group or marked core"],
        decisive:false,
        canonicalPromotionAllowed:false
      };
    }

    if (selectionBasis===SELECTION_BASIS.ENTIRE_TARGET_GROUP && labelScope!==LABEL_SCOPE.TARGET_GROUP) {
      return {
        ok:false,
        status:STATUS.INVALID,
        errors:["entire target group requires target_group label scope"],
        decisive:false,
        canonicalPromotionAllowed:false
      };
    }

    if (selectionBasis===SELECTION_BASIS.SOURCE_NATIVE_MARKED_SUBSET && labelScope!==LABEL_SCOPE.MARKED_SUBSET) {
      return {
        ok:false,
        status:STATUS.INVALID,
        errors:["source-native marked subset requires marked_subset label scope"],
        decisive:false,
        canonicalPromotionAllowed:false
      };
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
    LABEL_SCOPE,
    evaluate
  });
});
