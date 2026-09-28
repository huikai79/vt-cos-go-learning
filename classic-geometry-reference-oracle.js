(function (root, factory) {
  const geometry = typeof module === "object" && module.exports
    ? require("./classic-geometry-fingerprint.js")
    : root.GoClassicGeometryFingerprint;
  const extraction = typeof module === "object" && module.exports
    ? require("./classic-geometry-extraction.js")
    : root.GoClassicGeometryExtraction;
  const api = factory(geometry, extraction);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicGeometryReferenceOracle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Geometry, Extraction) {
  "use strict";

  if (!Geometry || !Extraction) throw new Error("Geometry fingerprint and extraction runtimes are required.");

  const STATUS = Object.freeze({
    REFERENCE_MATCH: "REFERENCE_MATCH",
    REFERENCE_DIFFERENT: "REFERENCE_DIFFERENT",
    INSUFFICIENT: "INSUFFICIENT",
    INVALID: "INVALID",
    CONFLICTING_REFERENCE_ORACLES: "CONFLICTING_REFERENCE_ORACLES",
    CONSISTENT_REFERENCE_SUPPORT: "CONSISTENT_REFERENCE_SUPPORT"
  });

  const FORBIDDEN_PERSISTED_KEYS = Object.freeze([
    "points",
    "stones",
    "shapeSignature",
    "contextSignature",
    "fingerprint",
    "signature",
    "rawGeometry",
    "rawObservation"
  ]);

  function statusFromComparison(result) {
    if (!result) return STATUS.INVALID;
    if (result.status === Geometry.STATUS.MATCH) return STATUS.REFERENCE_MATCH;
    if (result.status === Geometry.STATUS.DIFFERENT) return STATUS.REFERENCE_DIFFERENT;
    if (result.status === Geometry.STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE) return STATUS.INSUFFICIENT;
    return STATUS.INVALID;
  }

  function validateMetadata(metadata) {
    const errors=[];
    if (!metadata || typeof metadata !== "object") return {ok:false,errors:["oracle metadata missing"]};
    for (const field of ["sourceId","sourceLocator","sourceDigest","evidenceChain","candidateConceptId","comparisonContractId"]) {
      if (!metadata[field] || typeof metadata[field] !== "string") errors.push(field+" missing");
    }
    return {ok:errors.length===0,errors};
  }

  function runReferenceOracle({observation,candidate,metadata,requireContext=true}={}) {
    const vm=validateMetadata(metadata);
    const vo=Extraction.validateExtraction(observation);
    if (!vm.ok || !vo.ok) {
      return {
        ok:false,
        status:STATUS.INVALID,
        errors:[...vm.errors,...vo.errors],
        canonicalPromotionAllowed:false,
        persistable:null,
        privateComparison:null
      };
    }

    if (observation.sourceId !== metadata.sourceId
      || observation.sourceLocator !== metadata.sourceLocator
      || observation.sourceDigest !== metadata.sourceDigest) {
      return {
        ok:false,
        status:STATUS.INVALID,
        errors:["observation provenance does not match oracle metadata"],
        canonicalPromotionAllowed:false,
        persistable:null,
        privateComparison:null
      };
    }

    const comparison=Geometry.compare(observation,candidate,{requireContext});
    const status=statusFromComparison(comparison);
    const report={
      schemaVersion:"classic-reference-oracle-report-v1",
      authority:"reference_oracle_only",
      status,
      sourceId:metadata.sourceId,
      sourceLocator:metadata.sourceLocator,
      sourceDigest:metadata.sourceDigest,
      evidenceChain:metadata.evidenceChain,
      candidateConceptId:metadata.candidateConceptId,
      comparisonContractId:metadata.comparisonContractId,
      requireContext:Boolean(requireContext),
      sameShape:comparison.sameShape === true,
      sameContext:comparison.sameContext === true,
      canonicalPromotionAllowed:false
    };
    return {
      ok:status===STATUS.REFERENCE_MATCH || status===STATUS.REFERENCE_DIFFERENT,
      status,
      errors:comparison.ok ? [] : (comparison.left?.errors || comparison.right?.errors || ["oracle comparison unavailable"]),
      canonicalPromotionAllowed:false,
      persistable:Object.freeze(report),
      privateComparison:comparison
    };
  }

  function hasForbiddenKey(value) {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(hasForbiddenKey);
    for (const [key,child] of Object.entries(value)) {
      if (FORBIDDEN_PERSISTED_KEYS.includes(key)) return true;
      if (hasForbiddenKey(child)) return true;
    }
    return false;
  }

  function validatePersistableReport(report) {
    const errors=[];
    if (!report || typeof report !== "object") return {ok:false,errors:["report missing"]};
    if (report.schemaVersion !== "classic-reference-oracle-report-v1") errors.push("schemaVersion invalid");
    if (report.authority !== "reference_oracle_only") errors.push("authority invalid");
    if (report.canonicalPromotionAllowed !== false) errors.push("canonical promotion must remain false");
    if (![STATUS.REFERENCE_MATCH,STATUS.REFERENCE_DIFFERENT,STATUS.INSUFFICIENT,STATUS.INVALID].includes(report.status)) errors.push("status invalid");
    for (const field of ["sourceId","sourceLocator","sourceDigest","evidenceChain","candidateConceptId","comparisonContractId"]) {
      if (!report[field] || typeof report[field] !== "string") errors.push(field+" missing");
    }
    if (hasForbiddenKey(report)) errors.push("report contains source-derived geometry or fingerprint material");
    return {ok:errors.length===0,errors};
  }

  function evidenceUnitKey(report) {
    return report.evidenceChain;
  }

  function aggregatePersistableReports(reports,{candidateDependentEvidenceChains=[]}={}) {
    const dependentChains = new Set(
      Array.isArray(candidateDependentEvidenceChains)
        ? candidateDependentEvidenceChains.filter((value)=>typeof value==="string" && value)
        : []
    );
    const list=Array.isArray(reports) ? reports : [];
    const valid=[];
    const errors=[];
    for (const report of list) {
      const checked=validatePersistableReport(report);
      if (!checked.ok) errors.push(...checked.errors);
      else valid.push(report);
    }
    if (errors.length) return {ok:false,status:STATUS.INVALID,errors,independentEvidenceUnits:0,canonicalPromotionAllowed:false};

    const comparisonKeys=new Set(valid.map((report)=>[
      report.candidateConceptId,
      report.comparisonContractId,
      String(Boolean(report.requireContext))
    ].join("|")));
    if (comparisonKeys.size>1) {
      return {
        ok:false,
        status:STATUS.INVALID,
        errors:["reference reports use incompatible candidate or comparison contracts"],
        independentEvidenceUnits:0,
        canonicalPromotionAllowed:false
      };
    }

    const unique=new Map();
    for (const report of valid) {
      const key=evidenceUnitKey(report);
      if (!unique.has(key)) unique.set(key,report);
    }
    const units=[...unique.values()];
    const independentUnits=units.filter((report)=>!dependentChains.has(report.evidenceChain));
    const decisive=independentUnits.filter((report)=>[STATUS.REFERENCE_MATCH,STATUS.REFERENCE_DIFFERENT].includes(report.status));
    const statuses=new Set(decisive.map((report)=>report.status));
    if (statuses.size>1) {
      return {
        ok:false,
        status:STATUS.CONFLICTING_REFERENCE_ORACLES,
        errors:["independent reference oracles disagree"],
        independentEvidenceUnits:independentUnits.length,
        decisiveEvidenceUnits:decisive.length,
        excludedCandidateDependentEvidenceUnits:units.length-independentUnits.length,
        canonicalPromotionAllowed:false
      };
    }
    if (decisive.length>=2 && statuses.size===1) {
      return {
        ok:true,
        status:STATUS.CONSISTENT_REFERENCE_SUPPORT,
        direction:decisive[0].status,
        errors:[],
        independentEvidenceUnits:independentUnits.length,
        decisiveEvidenceUnits:decisive.length,
        excludedCandidateDependentEvidenceUnits:units.length-independentUnits.length,
        canonicalPromotionAllowed:false
      };
    }
    return {
      ok:false,
      status:STATUS.INSUFFICIENT,
      errors:["fewer than two independent decisive reference evidence units"],
      independentEvidenceUnits:independentUnits.length,
      decisiveEvidenceUnits:decisive.length,
      excludedCandidateDependentEvidenceUnits:units.length-independentUnits.length,
      canonicalPromotionAllowed:false
    };
  }

  return Object.freeze({
    version:"classic-geometry-reference-oracle-v3",
    STATUS,
    FORBIDDEN_PERSISTED_KEYS,
    validateMetadata,
    runReferenceOracle,
    validatePersistableReport,
    aggregatePersistableReports,
    evidenceUnitKey
  });
});
