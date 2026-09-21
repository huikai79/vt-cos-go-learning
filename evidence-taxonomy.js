(function (root) {
  "use strict";

  const CURRENT_VERSION = 2;

  const descriptor = Object.freeze({
    currentVersion: CURRENT_VERSION,
    levels: Object.freeze({
      T0: "original_or_same_item_reconstruction",
      T1: "surface_equivalent_transformation",
      T2: "different_surface_same_kc",
      T3: "no_skill_cue_application"
    }),
    t3Contexts: Object.freeze(["standardized", "live"]),
    legacy: Object.freeze({
      1: Object.freeze({
        t3Meaning: "live_only",
        fixedLocalProbeMeaning: "separate_from_t3"
      })
    })
  });

  function classify(record = {}) {
    const version = Number(record.evidenceTaxonomyVersion) || 1;
    if (version >= CURRENT_VERSION) {
      const transferLevel = record.transferLevel || null;
      const evaluationContext = transferLevel === "T3" ? record.evaluationContext || null : null;
      return {
        version,
        transferLevel,
        evaluationContext,
        compatibleWithCurrentT3: transferLevel !== "T3" || descriptor.t3Contexts.includes(evaluationContext),
        legacyCategory: null
      };
    }

    if (record.transferLevel === "T3") {
      return {
        version: 1,
        transferLevel: "T3",
        evaluationContext: "live",
        compatibleWithCurrentT3: true,
        legacyCategory: "legacy_t3_live"
      };
    }

    if (record.transferLevel === "fixed_local_probe") {
      return {
        version: 1,
        transferLevel: null,
        evaluationContext: "standardized",
        compatibleWithCurrentT3: false,
        legacyCategory: "fixed_local_probe"
      };
    }

    return {
      version: 1,
      transferLevel: record.transferLevel || null,
      evaluationContext: null,
      compatibleWithCurrentT3: true,
      legacyCategory: null
    };
  }

  const api = { CURRENT_VERSION, descriptor, classify };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoEvidenceTaxonomy = api;
})(typeof window !== "undefined" ? window : globalThis);
