(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicGeometryExtraction = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const METHOD = Object.freeze({
    MANUAL_TRANSCRIPTION: "manual_transcription",
    SGF_PARSE: "sgf_parse",
    SOURCE_NATIVE_COORDINATES: "source_native_coordinates",
    INTERNAL_CONTRACT: "internal_contract"
  });

  const LICENSE_STATUS = Object.freeze({
    PROJECT_GENERATED: "project_generated",
    VERIFIED_REUSABLE: "verified_reusable",
    REFERENCE_ONLY: "reference_only",
    UNKNOWN: "unknown"
  });

  const REVIEW_STATUS = Object.freeze({
    DRAFT: "draft",
    VERIFIED: "verified",
    CONFLICT: "conflict",
    BLOCKED: "blocked"
  });

  const PROMOTION_STATUS = Object.freeze({
    ELIGIBLE: "ELIGIBLE",
    NEEDS_INDEPENDENT_REVIEW: "NEEDS_INDEPENDENT_REVIEW",
    CONFLICT: "CONFLICT",
    BLOCKED_LICENSE: "BLOCKED_LICENSE",
    BLOCKED_CONTEXT: "BLOCKED_CONTEXT",
    INVALID: "INVALID"
  });

  function pointKey([x,y]) { return x + "," + y; }

  function validPoint(point) {
    return Array.isArray(point) && point.length === 2 && point.every(Number.isInteger);
  }

  function validatePointArray(points, field, { allowEmpty=false }={}) {
    if (!Array.isArray(points)) return [field + " must be an array"];
    if (!allowEmpty && points.length === 0) return [field + " must not be empty"];
    if (!points.every(validPoint)) return [field + " must contain integer [x,y] points"];
    if (new Set(points.map(pointKey)).size !== points.length) return [field + " must contain unique points"];
    return [];
  }

  function canonicalPoints(points) {
    return (Array.isArray(points) ? points : [])
      .slice()
      .sort((a,b) => a[1]-b[1] || a[0]-b[0])
      .map(([x,y]) => x + "," + y)
      .join(";");
  }

  function canonicalStones(stones) {
    if (!Array.isArray(stones)) return "";
    return stones
      .slice()
      .sort((a,b) => String(a.color).localeCompare(String(b.color)) || a.point[1]-b.point[1] || a.point[0]-b.point[0])
      .map((stone) => String(stone.color) + "@" + pointKey(stone.point))
      .join(";");
  }

  function canonicalContext(context) {
    const c = context || {};
    return [
      "boardContext=" + (c.boardContext || "unknown"),
      "boundary=" + (Array.isArray(c.boundary) ? c.boundary.slice().sort().join("+") : "unspecified"),
      "toPlay=" + (c.toPlay || "unspecified"),
      "role=" + (c.role || "unspecified"),
      "outsideLiberties=" + (c.outsideLiberties === undefined ? "unspecified" : String(c.outsideLiberties)),
      "koContext=" + (c.koContext || "unspecified")
    ].join("|");
  }

  function validateExtraction(record) {
    const errors=[];
    if (!record || typeof record !== "object") return {ok:false,errors:["extraction record missing"]};
    if (!record.id || typeof record.id !== "string") errors.push("id missing");
    if (!record.sourceId || typeof record.sourceId !== "string") errors.push("sourceId missing");
    if (!record.sourceLocator || typeof record.sourceLocator !== "string") errors.push("sourceLocator missing");
    if (!Object.values(METHOD).includes(record.method)) errors.push("method invalid");
    if (!Object.values(LICENSE_STATUS).includes(record.licenseStatus)) errors.push("licenseStatus invalid");
    if (!record.reviewKey || typeof record.reviewKey !== "string") errors.push("reviewKey missing");
    if (!Number.isInteger(record.boardSize) || record.boardSize < 2 || record.boardSize > 52) errors.push("boardSize invalid");

    if (record.points !== null && record.points !== undefined) errors.push(...validatePointArray(record.points,"points"));
    if (record.stones !== null && record.stones !== undefined) {
      if (!Array.isArray(record.stones)) errors.push("stones must be an array");
      else {
        const stonePoints=[];
        for (const stone of record.stones) {
          if (!stone || !["black","white"].includes(stone.color) || !validPoint(stone.point)) {
            errors.push("stones must contain {color:black|white, point:[x,y]}");
            break;
          }
          stonePoints.push(stone.point);
        }
        if (stonePoints.length && new Set(stonePoints.map(pointKey)).size !== stonePoints.length) errors.push("stone points must be unique");
      }
    }

    if ((!Array.isArray(record.points) || record.points.length===0)
      && (!Array.isArray(record.stones) || record.stones.length===0)) {
      errors.push("at least one structured geometry payload is required");
    }

    const context=record.context || {};
    if (context.boardContext === "corner") {
      if (!Array.isArray(context.boundary) || context.boundary.length < 2) errors.push("corner extraction requires two explicit board boundaries");
    }
    if (context.boardContext === "side") {
      if (!Array.isArray(context.boundary) || context.boundary.length < 1) errors.push("side extraction requires an explicit board boundary");
    }

    if (record.method === METHOD.MANUAL_TRANSCRIPTION && record.reviewStatus === REVIEW_STATUS.VERIFIED) {
      errors.push("a single manual transcription cannot self-verify");
    }
    return {ok:errors.length===0,errors};
  }

  function payloadSignature(record) {
    const validation=validateExtraction(record);
    if (!validation.ok) return {ok:false,errors:validation.errors,signature:null};
    return {
      ok:true,
      errors:[],
      signature:[
        "boardSize="+record.boardSize,
        "points="+canonicalPoints(record.points),
        "stones="+canonicalStones(record.stones),
        canonicalContext(record.context)
      ].join("||")
    };
  }

  function compareIndependentExtractions(a,b) {
    const va=validateExtraction(a);
    const vb=validateExtraction(b);
    if (!va.ok || !vb.ok) return {ok:false,status:PROMOTION_STATUS.INVALID,errors:[...va.errors,...vb.errors]};
    if (a.sourceId !== b.sourceId || a.sourceLocator !== b.sourceLocator) {
      return {ok:false,status:PROMOTION_STATUS.INVALID,errors:["independent extractions must refer to the same source and locator"]};
    }
    if (a.reviewKey === b.reviewKey) {
      return {ok:false,status:PROMOTION_STATUS.NEEDS_INDEPENDENT_REVIEW,errors:["reviewKey must differ for independent review"]};
    }
    const sa=payloadSignature(a);
    const sb=payloadSignature(b);
    if (sa.signature !== sb.signature) {
      return {ok:false,status:PROMOTION_STATUS.CONFLICT,errors:["independent geometry transcriptions disagree"],left:sa.signature,right:sb.signature};
    }
    return {ok:true,status:PROMOTION_STATUS.ELIGIBLE,errors:[],signature:sa.signature};
  }

  function licenseAllowsPublicEvidence(status) {
    return status === LICENSE_STATUS.PROJECT_GENERATED || status === LICENSE_STATUS.VERIFIED_REUSABLE;
  }

  function assessPublicPromotion(records) {
    const list=Array.isArray(records) ? records : [];
    if (!list.length) return {ok:false,status:PROMOTION_STATUS.INVALID,errors:["no extraction records"]};
    const validations=list.map(validateExtraction);
    const invalid=validations.flatMap((result) => result.errors);
    if (invalid.length) return {ok:false,status:PROMOTION_STATUS.INVALID,errors:invalid};

    if (list.some((record) => !licenseAllowsPublicEvidence(record.licenseStatus))) {
      return {ok:false,status:PROMOTION_STATUS.BLOCKED_LICENSE,errors:["source-derived geometry cannot enter the public registry without verified reusable rights"]};
    }

    const sourceId=list[0].sourceId;
    const sourceLocator=list[0].sourceLocator;
    if (list.some((record) => record.sourceId!==sourceId || record.sourceLocator!==sourceLocator)) {
      return {ok:false,status:PROMOTION_STATUS.INVALID,errors:["promotion batch must describe one source observation"]};
    }

    const deterministic=list.find((record) =>
      [METHOD.INTERNAL_CONTRACT,METHOD.SOURCE_NATIVE_COORDINATES,METHOD.SGF_PARSE].includes(record.method)
      && record.deterministicSource === true
    );
    if (deterministic) {
      const sig=payloadSignature(deterministic);
      return {ok:true,status:PROMOTION_STATUS.ELIGIBLE,errors:[],signature:sig.signature,basis:"deterministic_source"};
    }

    const manual=list.filter((record) => record.method===METHOD.MANUAL_TRANSCRIPTION);
    if (manual.length<2) {
      return {ok:false,status:PROMOTION_STATUS.NEEDS_INDEPENDENT_REVIEW,errors:["manual transcription requires two independent matching extractions"]};
    }
    for (let i=0;i<manual.length;i+=1) {
      for (let j=i+1;j<manual.length;j+=1) {
        const compared=compareIndependentExtractions(manual[i],manual[j]);
        if (compared.status===PROMOTION_STATUS.ELIGIBLE) {
          return {ok:true,status:PROMOTION_STATUS.ELIGIBLE,errors:[],signature:compared.signature,basis:"independent_manual_pair"};
        }
        if (compared.status===PROMOTION_STATUS.CONFLICT) return compared;
      }
    }
    return {ok:false,status:PROMOTION_STATUS.NEEDS_INDEPENDENT_REVIEW,errors:["no matching independent manual pair"]};
  }

  function assessReferenceUse(record) {
    const validation=validateExtraction(record);
    if (!validation.ok) return {ok:false,status:PROMOTION_STATUS.INVALID,errors:validation.errors};
    const sig=payloadSignature(record);
    return {
      ok:true,
      status:"REFERENCE_ORACLE_ONLY",
      errors:[],
      signature:sig.signature,
      publicPromotionAllowed:licenseAllowsPublicEvidence(record.licenseStatus)
    };
  }

  return Object.freeze({
    version:"classic-geometry-extraction-v1",
    METHOD,
    LICENSE_STATUS,
    REVIEW_STATUS,
    PROMOTION_STATUS,
    validateExtraction,
    payloadSignature,
    compareIndependentExtractions,
    licenseAllowsPublicEvidence,
    assessPublicPromotion,
    assessReferenceUse
  });
});
