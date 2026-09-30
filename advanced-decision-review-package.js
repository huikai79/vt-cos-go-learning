(function (root, factory) {
  "use strict";
  const Sgf = typeof require === "function" && typeof module !== "undefined" ? require("./sgf.js") : root.GoSgf;
  const Tools = typeof require === "function" && typeof module !== "undefined" ? require("./advanced-decision-review-tools.js") : root.GoAdvancedDecisionReviewTools;
  const api = factory(Sgf, Tools);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedDecisionReviewPackage = api;
})(typeof window !== "undefined" ? window : globalThis, function (Sgf, Tools) {
  "use strict";

  const PACKAGE_VERSION = "advanced-decision-review-package-v1";
  const SCHEMA_VERSION = 1;
  const AUTHORITY = "review_artifact_only";
  const MAX_PACKAGE_CHARS = 1_250_000;

  function fail(code) {
    throw new Error(code);
  }

  function validatePerspective(value) {
    if (!Tools || !Tools.PERSPECTIVES.includes(value)) fail("review_package_perspective_invalid");
    return value;
  }

  function inspectSgf(sgfText) {
    if (!Sgf || typeof Sgf.parseDecisionReviewSgf !== "function") fail("review_package_sgf_module_unavailable");
    const game = Sgf.parseDecisionReviewSgf(sgfText);
    if (!game || game.boardSize !== 19) fail("review_package_board_size_invalid");
    return game;
  }

  function selectedMove(game, moveNumber) {
    if (moveNumber === null || moveNumber === undefined || moveNumber === "") return null;
    if (!Number.isInteger(moveNumber) || !game.moves.some((move) => move.number === moveNumber)) {
      fail("review_package_selected_move_invalid");
    }
    return moveNumber;
  }

  function buildPackage(input) {
    if (!input || typeof input.sgfText !== "string" || !input.sgfText.trim()) fail("review_package_sgf_missing");
    const game = inspectSgf(input.sgfText);
    const perspective = Tools.normalizePerspective(input.perspective);
    const sourceId = Sgf.sourceFingerprint(input.sgfText);
    const sourceName = typeof input.sourceName === "string" && input.sourceName.trim() ? input.sourceName.trim() : "匯入的 19 路棋譜";
    const exportedAt = typeof input.exportedAt === "string" && input.exportedAt ? input.exportedAt : new Date().toISOString();

    return {
      schemaVersion: SCHEMA_VERSION,
      packageVersion: PACKAGE_VERSION,
      authority: AUTHORITY,
      formalEligible: false,
      evidenceImport: false,
      exportedAt,
      perspective,
      selectedMoveNumber: selectedMove(game, input.selectedMoveNumber),
      source: {
        type: "sgf",
        sourceName,
        sourceId,
        boardSize: 19
      },
      sgfText: input.sgfText
    };
  }

  function parsePackage(text) {
    if (typeof text !== "string" || !text.trim() || text.length > MAX_PACKAGE_CHARS) fail("review_package_invalid");
    let value;
    try {
      value = JSON.parse(text);
    } catch (_) {
      fail("review_package_json_invalid");
    }
    if (!value || value.schemaVersion !== SCHEMA_VERSION || value.packageVersion !== PACKAGE_VERSION) fail("review_package_version_invalid");
    if (value.authority !== AUTHORITY || value.formalEligible !== false || value.evidenceImport !== false) fail("review_package_authority_invalid");
    if (Object.prototype.hasOwnProperty.call(value, "events") || Object.prototype.hasOwnProperty.call(value, "eventStore") || Object.prototype.hasOwnProperty.call(value, "evidence")) {
      fail("review_package_evidence_not_allowed");
    }
    const perspective = validatePerspective(value.perspective);
    if (typeof value.sgfText !== "string" || !value.sgfText.trim()) fail("review_package_sgf_missing");
    const game = inspectSgf(value.sgfText);
    const expectedSourceId = Sgf.sourceFingerprint(value.sgfText);
    if (!value.source || value.source.type !== "sgf" || value.source.boardSize !== 19 || value.source.sourceId !== expectedSourceId) {
      fail("review_package_source_mismatch");
    }
    const moveNumber = selectedMove(game, value.selectedMoveNumber);
    return {
      ...value,
      perspective,
      selectedMoveNumber: moveNumber,
      source: {
        ...value.source,
        sourceName: typeof value.source.sourceName === "string" && value.source.sourceName.trim() ? value.source.sourceName.trim() : "匯入的 19 路棋譜"
      }
    };
  }

  function stringifyPackage(input) {
    return JSON.stringify(buildPackage(input), null, 2);
  }

  return Object.freeze({
    PACKAGE_VERSION,
    SCHEMA_VERSION,
    AUTHORITY,
    MAX_PACKAGE_CHARS,
    buildPackage,
    parsePackage,
    stringifyPackage
  });
});
