(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicGeometryFingerprint = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATUS = Object.freeze({
    MATCH: "MATCH",
    DIFFERENT: "DIFFERENT",
    INSUFFICIENT_GEOMETRY_EVIDENCE: "INSUFFICIENT_GEOMETRY_EVIDENCE",
    INVALID_GEOMETRY: "INVALID_GEOMETRY"
  });

  function isPoint(point) {
    return Array.isArray(point) && point.length === 2 && point.every(Number.isInteger);
  }

  function validatePointSet(points) {
    if (!Array.isArray(points) || points.length === 0 || !points.every(isPoint)) {
      return { ok:false, errors:["points must be a non-empty array of integer [x,y] coordinates"] };
    }
    const keys = points.map(([x,y]) => x + "," + y);
    if (new Set(keys).size !== keys.length) return { ok:false, errors:["points must be unique"] };
    return { ok:true, errors:[] };
  }

  function translateToOrigin(points) {
    const minX = Math.min(...points.map((p) => p[0]));
    const minY = Math.min(...points.map((p) => p[1]));
    return points.map(([x,y]) => [x-minX,y-minY]);
  }

  function transformPoint([x,y], index) {
    switch (index) {
      case 0: return [ x, y];
      case 1: return [-y, x];
      case 2: return [-x,-y];
      case 3: return [ y,-x];
      case 4: return [-x, y];
      case 5: return [ x,-y];
      case 6: return [ y, x];
      case 7: return [-y,-x];
      default: throw new Error("unknown D4 transform");
    }
  }

  function encode(points) {
    return points
      .slice()
      .sort((a,b) => a[1]-b[1] || a[0]-b[0])
      .map(([x,y]) => x + "," + y)
      .join(";");
  }

  function canonicalShapeSignature(points) {
    const validation = validatePointSet(points);
    if (!validation.ok) return { ok:false, status:STATUS.INVALID_GEOMETRY, errors:validation.errors, signature:null };
    const signatures = [];
    for (let i=0;i<8;i+=1) {
      const transformed = points.map((point) => transformPoint(point,i));
      signatures.push(encode(translateToOrigin(transformed)));
    }
    signatures.sort();
    return {
      ok:true,
      status:STATUS.MATCH,
      errors:[],
      signature:signatures[0],
      pointCount:points.length
    };
  }

  function canonicalBoardContext(context) {
    if (!context || typeof context !== "object") return "context:unknown";
    const boardContext = typeof context.boardContext === "string" ? context.boardContext : "unknown";
    const boundary = Array.isArray(context.boundary) ? context.boundary.slice().sort().join("+") : "unspecified";
    const toPlay = context.toPlay || "unspecified";
    const role = context.role || "unspecified";
    const outsideLiberties = context.outsideLiberties === undefined ? "unspecified" : String(context.outsideLiberties);
    const koContext = context.koContext || "unspecified";
    return ["board="+boardContext,"boundary="+boundary,"toPlay="+toPlay,"role="+role,"outside="+outsideLiberties,"ko="+koContext].join("|");
  }

  function fingerprint(record) {
    if (!record || typeof record !== "object") return { ok:false, status:STATUS.INVALID_GEOMETRY, errors:["geometry record missing"] };
    if (!Array.isArray(record.points)) {
      return {
        ok:false,
        status:STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE,
        errors:["geometry points unavailable"],
        sourceId:record.sourceId || null,
        fingerprint:null
      };
    }
    const shape = canonicalShapeSignature(record.points);
    if (!shape.ok) return shape;
    const context = canonicalBoardContext(record.context || {});
    return {
      ok:true,
      status:STATUS.MATCH,
      errors:[],
      sourceId:record.sourceId || null,
      shapeSignature:shape.signature,
      contextSignature:context,
      fingerprint:"shape:"+shape.signature+"||"+context
    };
  }

  function compare(a,b,{requireContext=true}={}) {
    const fa = fingerprint(a);
    const fb = fingerprint(b);
    if (!fa.ok || !fb.ok) {
      const insufficient = fa.status === STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE || fb.status === STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE;
      return {
        ok:false,
        status:insufficient ? STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE : STATUS.INVALID_GEOMETRY,
        left:fa,
        right:fb,
        sameShape:false,
        sameContext:false,
        equivalent:false
      };
    }
    const sameShape = fa.shapeSignature === fb.shapeSignature;
    const sameContext = fa.contextSignature === fb.contextSignature;
    return {
      ok:true,
      status:sameShape && (!requireContext || sameContext) ? STATUS.MATCH : STATUS.DIFFERENT,
      left:fa,
      right:fb,
      sameShape,
      sameContext,
      equivalent:sameShape && (!requireContext || sameContext)
    };
  }

  function resolveCandidates(observation,candidates,{requireContext=true}={}) {
    const observed = fingerprint(observation);
    if (!observed.ok) {
      return {
        ok:false,
        status:observed.status,
        observation:observed,
        matches:[],
        nonMatches:[],
        unresolved:Array.isArray(candidates) ? candidates.map((item) => item.conceptId) : []
      };
    }
    const matches=[];
    const nonMatches=[];
    const unresolved=[];
    for (const candidate of Array.isArray(candidates) ? candidates : []) {
      if (!candidate || !candidate.conceptId || !candidate.geometry) continue;
      const result = compare(observation,candidate.geometry,{requireContext});
      if (result.status === STATUS.MATCH) matches.push(candidate.conceptId);
      else if (result.status === STATUS.DIFFERENT) nonMatches.push(candidate.conceptId);
      else unresolved.push(candidate.conceptId);
    }
    return {
      ok:matches.length === 1 && unresolved.length === 0,
      status:matches.length === 1 && unresolved.length === 0 ? STATUS.MATCH : STATUS.INSUFFICIENT_GEOMETRY_EVIDENCE,
      observation:observed,
      matches,
      nonMatches,
      unresolved
    };
  }

  return Object.freeze({
    version:"classic-geometry-fingerprint-v1",
    STATUS,
    validatePointSet,
    translateToOrigin,
    canonicalShapeSignature,
    canonicalBoardContext,
    fingerprint,
    compare,
    resolveCandidates
  });
});
