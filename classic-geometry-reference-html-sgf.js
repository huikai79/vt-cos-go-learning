"use strict";

const crypto = require("node:crypto");
const Extraction = require("./classic-geometry-extraction.js");
const Oracle = require("./classic-geometry-reference-oracle.js");

const VERSION = "classic-reference-html-sgf-v1";
const MAX_HTML_BYTES = 2_000_000;
const MAX_SGF_BYTES = 1_000_000;

const CORNER_BOUNDARIES = Object.freeze({
  "top-left": Object.freeze(["top","left"]),
  "top-right": Object.freeze(["top","right"]),
  "bottom-left": Object.freeze(["bottom","left"]),
  "bottom-right": Object.freeze(["bottom","right"])
});

function ok(value) { return {ok:true,errors:[],...value}; }
function fail(...errors) { return {ok:false,errors:errors.flat().filter(Boolean)}; }

function sha256(text) {
  return "sha256:" + crypto.createHash("sha256").update(text,"utf8").digest("hex");
}

function parseJsonStringLiteral(source) {
  try {
    const value = JSON.parse(source);
    if (typeof value !== "string") return fail("embedded SGF literal is not a string");
    return ok({value});
  } catch (_) {
    return fail("embedded SGF literal is not valid JSON string syntax");
  }
}

function extractEmbeddedSgf(html) {
  if (typeof html !== "string" || !html.trim()) return fail("html is empty");
  if (Buffer.byteLength(html,"utf8") > MAX_HTML_BYTES) return fail("html exceeds size limit");

  const literals = [];
  const patterns = [
    /options\.sgf2\s*=\s*("(?:\\.|[^"\\])*")\s*;/g,
    /new\s+Blob\s*\(\s*\[\s*("(?:\\.|[^"\\])*")\s*\]/g
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const parsed = parseJsonStringLiteral(match[1]);
      if (!parsed.ok) return parsed;
      literals.push(parsed.value);
    }
  }

  if (!literals.length) return fail("no embedded SGF literal found");
  const unique = [...new Set(literals)];
  if (unique.length !== 1) return fail("multiple conflicting embedded SGF literals found");
  const sgf = unique[0];
  if (Buffer.byteLength(sgf,"utf8") > MAX_SGF_BYTES) return fail("embedded SGF exceeds size limit");
  return ok({sgf,occurrences:literals.length});
}

function skipWhitespace(text,state) {
  while (/\s/.test(text[state.i] || "")) state.i += 1;
}

function readPropertyValue(text,state) {
  if (text[state.i] !== "[") return fail("property value must start with [");
  state.i += 1;
  let value = "";
  while (state.i < text.length) {
    const ch = text[state.i++];
    if (ch === "]") return ok({value});
    if (ch === "\\") {
      if (state.i >= text.length) return fail("dangling SGF escape");
      const escaped = text[state.i++];
      if (escaped === "\r" && text[state.i] === "\n") state.i += 1;
      else if (escaped === "\n" || escaped === "\r") continue;
      else value += escaped;
    } else value += ch;
  }
  return fail("unterminated SGF property value");
}

function parseRootNode(sgf) {
  if (typeof sgf !== "string" || !sgf.trim()) return fail("sgf is empty");
  if (Buffer.byteLength(sgf,"utf8") > MAX_SGF_BYTES) return fail("sgf exceeds size limit");
  const text = sgf.replace(/^\uFEFF/,"");
  const state = {i:0};
  skipWhitespace(text,state);
  if (text[state.i] !== "(") return fail("SGF must start with (");
  state.i += 1;
  skipWhitespace(text,state);
  if (text[state.i] !== ";") return fail("SGF root node missing ;");
  state.i += 1;

  const properties = {};
  while (state.i < text.length) {
    skipWhitespace(text,state);
    const ch = text[state.i];
    if (ch === ";" || ch === "(" || ch === ")") break;
    const match = /^[A-Z]+/.exec(text.slice(state.i));
    if (!match) return fail("invalid SGF property in root node");
    const name = match[0];
    state.i += name.length;
    skipWhitespace(text,state);
    const values = [];
    while (text[state.i] === "[") {
      const parsed = readPropertyValue(text,state);
      if (!parsed.ok) return parsed;
      values.push(parsed.value);
      skipWhitespace(text,state);
    }
    if (!values.length) return fail(name+" property has no values");
    properties[name] = (properties[name] || []).concat(values);
  }
  return ok({properties});
}

function coordIndex(char) {
  if (/^[a-z]$/.test(char)) return char.charCodeAt(0)-97;
  if (/^[A-Z]$/.test(char)) return char.charCodeAt(0)-65+26;
  return null;
}

function parsePoint(value,boardSize) {
  if (typeof value !== "string" || value.length !== 2 || value.includes(":")) return fail("compressed or invalid SGF coordinates are unsupported");
  const x=coordIndex(value[0]), y=coordIndex(value[1]);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x<0 || y<0 || x>=boardSize || y>=boardSize) return fail("SGF coordinate outside board");
  return ok({point:[x,y]});
}

function parseSquareBoardSize(properties) {
  const raw = properties.SZ && properties.SZ[0] ? properties.SZ[0] : "19";
  if (!/^\d{1,2}$/.test(raw)) return fail("only square SGF board sizes are supported");
  const size = Number(raw);
  if (!Number.isInteger(size) || size<2 || size>52) return fail("SGF board size invalid");
  return ok({boardSize:size});
}

function parseSetupGeometry(sgf) {
  const root = parseRootNode(sgf);
  if (!root.ok) return root;
  const size = parseSquareBoardSize(root.properties);
  if (!size.ok) return size;
  const stones = [];
  const occupied = new Set();
  for (const [property,color] of [["AB","black"],["AW","white"]]) {
    for (const value of root.properties[property] || []) {
      const parsed = parsePoint(value,size.boardSize);
      if (!parsed.ok) return parsed;
      const key = parsed.point.join(",");
      if (occupied.has(key)) return fail("setup stones overlap");
      occupied.add(key);
      stones.push({color,point:parsed.point});
    }
  }
  if (!stones.length) return fail("root node has no AB/AW setup stones");
  const toPlay = root.properties.PL && root.properties.PL[0]
    ? (root.properties.PL[0] === "B" ? "black" : root.properties.PL[0] === "W" ? "white" : null)
    : "unspecified";
  if (toPlay === null) return fail("PL must be B or W when present");
  return ok({boardSize:size.boardSize,stones,toPlay});
}

function pointKey(point) { return point[0]+","+point[1]; }

function connectedComponents(points) {
  const remaining = new Map(points.map((point)=>[pointKey(point),point]));
  const components = [];
  while (remaining.size) {
    const seed = remaining.values().next().value;
    const queue=[seed];
    const component=[];
    remaining.delete(pointKey(seed));
    while (queue.length) {
      const point=queue.pop();
      component.push(point);
      for (const next of [[point[0]-1,point[1]],[point[0]+1,point[1]],[point[0],point[1]-1],[point[0],point[1]+1]]) {
        const key=pointKey(next);
        if (remaining.has(key)) {
          queue.push(remaining.get(key));
          remaining.delete(key);
        }
      }
    }
    components.push(component);
  }
  return components;
}

function cornerCoordinate(corner,boardSize) {
  if (corner === "top-left") return [0,0];
  if (corner === "top-right") return [boardSize-1,0];
  if (corner === "bottom-left") return [0,boardSize-1];
  if (corner === "bottom-right") return [boardSize-1,boardSize-1];
  return null;
}

function selectCornerGroup(stones,{targetColor,corner,boardSize}) {
  if (!["black","white"].includes(targetColor)) return fail("targetColor must be black or white");
  const anchor=cornerCoordinate(corner,boardSize);
  if (!anchor) return fail("corner invalid");
  const points=stones.filter((stone)=>stone.color===targetColor).map((stone)=>stone.point);
  if (!points.length) return fail("target color has no setup stones");
  const components=connectedComponents(points);
  const scored=components.map((component)=>({
    component,
    distance:Math.min(...component.map(([x,y])=>Math.abs(x-anchor[0])+Math.abs(y-anchor[1])))
  })).sort((a,b)=>a.distance-b.distance || b.component.length-a.component.length);

  if (scored.length>1 && scored[0].distance===scored[1].distance && scored[0].component.length===scored[1].component.length) {
    return fail("corner group selection is ambiguous");
  }
  return ok({points:scored[0].component});
}

function buildObservationFromHtml({
  html,sourceId,sourceLocator,evidenceChain,candidateConceptId,targetColor,corner,toPlay
}={}) {
  for (const [field,value] of Object.entries({sourceId,sourceLocator,evidenceChain,candidateConceptId,targetColor,corner})) {
    if (!value || typeof value !== "string") return fail(field+" missing");
  }
  const embedded=extractEmbeddedSgf(html);
  if (!embedded.ok) return embedded;
  const setup=parseSetupGeometry(embedded.sgf);
  if (!setup.ok) return setup;
  const selected=selectCornerGroup(setup.stones,{targetColor,corner,boardSize:setup.boardSize});
  if (!selected.ok) return selected;
  const resolvedToPlay = toPlay || setup.toPlay || "unspecified";
  if (!["black","white","unspecified"].includes(resolvedToPlay)) return fail("toPlay invalid");

  const sourceDigest=sha256(html);
  const observation={
    id:"reference-html-sgf-observation",
    sourceId,
    sourceLocator,
    sourceDigest,
    method:Extraction.METHOD.SGF_PARSE,
    licenseStatus:Extraction.LICENSE_STATUS.REFERENCE_ONLY,
    reviewStatus:Extraction.REVIEW_STATUS.DRAFT,
    reviewKey:VERSION,
    deterministicSource:true,
    boardSize:setup.boardSize,
    points:selected.points,
    stones:[],
    context:{
      boardContext:"corner",
      boundary:[...CORNER_BOUNDARIES[corner]],
      toPlay:resolvedToPlay,
      role:"defender_group"
    }
  };
  const metadata={sourceId,sourceLocator,sourceDigest,evidenceChain,candidateConceptId};
  const validation=Extraction.validateExtraction(observation);
  if (!validation.ok) return fail(validation.errors);
  return ok({observation,metadata,embeddedOccurrences:embedded.occurrences});
}

function runSanitizedReferenceOracle({candidate,requireContext=true,...input}={}) {
  if (!candidate || typeof candidate !== "object") return fail("candidate missing");
  const built=buildObservationFromHtml(input);
  if (!built.ok) return built;
  const result=Oracle.runReferenceOracle({
    observation:built.observation,
    candidate,
    metadata:built.metadata,
    requireContext
  });
  if (!result.persistable) return fail(result.errors || ["oracle did not produce persistable report"]);
  const checked=Oracle.validatePersistableReport(result.persistable);
  if (!checked.ok) return fail(checked.errors);
  return ok({status:result.status,report:result.persistable});
}

module.exports=Object.freeze({
  version:VERSION,
  MAX_HTML_BYTES,
  MAX_SGF_BYTES,
  extractEmbeddedSgf,
  parseRootNode,
  parseSetupGeometry,
  connectedComponents,
  selectCornerGroup,
  buildObservationFromHtml,
  runSanitizedReferenceOracle
});
