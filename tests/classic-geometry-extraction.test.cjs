const test = require("node:test");
const assert = require("node:assert/strict");
const Extraction = require("../classic-geometry-extraction.js");
const Evidence = require("../classic-geometry-evidence.js");

function manual(id, reviewKey, points, extra={}) {
  return {
    id,
    sourceId:"licensed-source",
    sourceLocator:"Diagram 1",
    method:Extraction.METHOD.MANUAL_TRANSCRIPTION,
    licenseStatus:Extraction.LICENSE_STATUS.VERIFIED_REUSABLE,
    reviewStatus:Extraction.REVIEW_STATUS.DRAFT,
    reviewKey,
    sourceDigest:"sha256:diagram-v1",
    rightsEvidence:"source-license-record-v1",
    boardSize:9,
    points,
    stones:[],
    context:{boardContext:"corner",boundary:["top","left"],toPlay:"black",role:"defender_group"},
    ...extra
  };
}

test("單次人工轉錄不能自行升格公開 geometry evidence", () => {
  const record=manual("a","review-a",[[0,0],[1,0],[0,1]]);
  const result=Extraction.assessPublicPromotion([record]);
  assert.equal(result.ok,false);
  assert.equal(result.status,Extraction.PROMOTION_STATUS.NEEDS_INDEPENDENT_REVIEW);
});

test("兩次獨立且一致的人工轉錄才可升格", () => {
  const a=manual("a","review-a",[[0,0],[1,0],[0,1]]);
  const b=manual("b","review-b",[[1,0],[0,1],[0,0]]);
  const compared=Extraction.compareIndependentExtractions(a,b);
  assert.equal(compared.ok,true);
  assert.equal(compared.status,Extraction.PROMOTION_STATUS.ELIGIBLE);
  const promoted=Extraction.assessPublicPromotion([a,b]);
  assert.equal(promoted.ok,true);
  assert.equal(promoted.basis,"independent_manual_pair");
});

test("兩次獨立轉錄不一致時必須 CONFLICT", () => {
  const a=manual("a","review-a",[[0,0],[1,0],[0,1]]);
  const b=manual("b","review-b",[[0,0],[1,0],[1,1]]);
  const result=Extraction.assessPublicPromotion([a,b]);
  assert.equal(result.ok,false);
  assert.equal(result.status,Extraction.PROMOTION_STATUS.CONFLICT);
});

test("不同 sourceDigest 的兩份轉錄不得被當成同一份來源覆核", () => {
  const a=manual("a","review-a",[[0,0],[1,0],[0,1]]);
  const b=manual("b","review-b",[[0,0],[1,0],[0,1]],{sourceDigest:"sha256:diagram-v2"});
  const result=Extraction.compareIndependentExtractions(a,b);
  assert.equal(result.ok,false);
  assert.equal(result.status,Extraction.PROMOTION_STATUS.INVALID);
  assert.ok(result.errors.some((error)=>/sourceDigest/.test(error)));
});

test("同一 reviewKey 不得假裝成獨立覆核", () => {
  const a=manual("a","same-review",[[0,0],[1,0],[0,1]]);
  const b=manual("b","same-review",[[0,0],[1,0],[0,1]]);
  const result=Extraction.compareIndependentExtractions(a,b);
  assert.equal(result.ok,false);
  assert.equal(result.status,Extraction.PROMOTION_STATUS.NEEDS_INDEPENDENT_REVIEW);
});

test("verified_reusable 沒有 rightsEvidence 必須 INVALID", () => {
  const record=manual("a","review-a",[[0,0],[1,0]],{rightsEvidence:null});
  const result=Extraction.validateExtraction(record);
  assert.equal(result.ok,false);
  assert.ok(result.errors.some((error)=>/rightsEvidence/.test(error)));
});

test("授權 UNKNOWN 或 reference-only 不得把來源衍生座標提交公開 registry", () => {
  for (const licenseStatus of [Extraction.LICENSE_STATUS.UNKNOWN,Extraction.LICENSE_STATUS.REFERENCE_ONLY]) {
    const a=manual("a","review-a",[[0,0],[1,0],[0,1]],{licenseStatus});
    const b=manual("b","review-b",[[0,0],[1,0],[0,1]],{licenseStatus});
    const result=Extraction.assessPublicPromotion([a,b]);
    assert.equal(result.ok,false,licenseStatus);
    assert.equal(result.status,Extraction.PROMOTION_STATUS.BLOCKED_LICENSE,licenseStatus);
    const reference=Extraction.assessReferenceUse(a);
    assert.equal(reference.ok,true);
    assert.equal(reference.publicPromotionAllowed,false);
  }
});

test("具可重用授權的 deterministic SGF/source-native parse 可單筆升格", () => {
  const record={
    id:"sgf-a",
    sourceId:"licensed-sgf",
    sourceLocator:"game-root",
    method:Extraction.METHOD.SGF_PARSE,
    deterministicSource:true,
    licenseStatus:Extraction.LICENSE_STATUS.VERIFIED_REUSABLE,
    reviewStatus:Extraction.REVIEW_STATUS.VERIFIED,
    reviewKey:"parser-v1",
    sourceDigest:"sha256:licensed-sgf-v1",
    rightsEvidence:"LICENSE:CC-BY-compatible-example",
    boardSize:9,
    points:[[0,0],[1,0],[0,1]],
    stones:[{color:"black",point:[2,2]}],
    context:{boardContext:"corner",boundary:["top","left"],toPlay:"white",role:"defender_group"}
  };
  const result=Extraction.assessPublicPromotion([record]);
  assert.equal(result.ok,true);
  assert.equal(result.basis,"deterministic_source");
});

test("corner/side 缺 board boundary 必須 fail closed", () => {
  const corner=manual("a","review-a",[[0,0],[1,0]],{context:{boardContext:"corner",boundary:["top"],toPlay:"black",role:"shape"}});
  assert.equal(Extraction.validateExtraction(corner).ok,false);
  const side=manual("b","review-b",[[0,0],[1,0]],{context:{boardContext:"side",boundary:[],toPlay:"black",role:"shape"}});
  assert.equal(Extraction.validateExtraction(side).ok,false);
});

test("單次 manual record 即使標 verified 也不能 self-verify", () => {
  const record=manual("a","review-a",[[0,0],[1,0]],{reviewStatus:Extraction.REVIEW_STATUS.VERIFIED});
  const result=Extraction.validateExtraction(record);
  assert.equal(result.ok,false);
  assert.ok(result.errors.some((error)=>/cannot self-verify/.test(error)));
});

test("現有授權未確認的外部 geometry records 不得偷帶座標", () => {
  for (const record of Evidence.records.filter((item)=>item.sourceType.startsWith("external"))) {
    if (!Evidence.canStoreSourceDerivedGeometry(record)) {
      assert.equal(record.points,null,record.id);
    }
  }
});
