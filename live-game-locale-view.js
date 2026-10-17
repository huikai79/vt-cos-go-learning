(function (root) {
  "use strict";
  // Candidate presentation-only mapping. The production locale gate remains closed.
  // This module never calls Go rules, KataGo, storage, learner events or scoring.
  const messages = Object.freeze({
    computerTurn: "The computer is choosing a move. If its provider fails, the turn stops.",
    humanTurn: "{color} to play. Select an empty intersection. Use arrow keys to move; press Enter or Space to play.",
    occupied: "There is already a stone at {coord}. Choose an empty intersection.",
    illegal: "This move is not legal here. The board has not changed.",
    unknownMove: "The move could not be verified. No move was recorded as successful.",
    providerFailure: "The computer opponent could not supply a valid move. Its turn has stopped; no substitute move was played.",
    providerTestFailure: "The opponent connection or response check failed. No move was played.",
    providerTestSuccess: "The service returned {action}. This check does not guarantee that a full game will work.",
    pass: "{color} passes.",
    bothPass: "Both players passed. Check the dead-stone marks and score before confirming the result.",
    resign: "{color} resigned. The game is over.",
    resignConfirm: "Resign as {color}? This will end the game.",
    undo: "Undid the previous move and rebuilt the position from the remaining move record.",
    undoComputer: "Returned to the position before your previous decision.",
    cannotUndo: "There are no moves you can undo in the current game state.",
    markDead: "Marked this group as dead for the score preview. The players must agree before confirming.",
    unmarkDead: "Removed the dead-stone mark from this group.",
    scorePreview: "Score preview only: {color} leads by {points} points under the current dead-stone marks.",
    scoreTied: "Score preview only: the players are tied under the current marks.",
    scoreConfirm: "Do both players agree with the marked dead stones and this score? Confirming ends the game.",
    scoreUnknown: "The score could not be verified. Do not confirm the game result.",
    resume: "Play resumed after the scoring disagreement. {color} to play.",
    storageFailure: "The browser could not save this game. Export SGF before leaving; do not assume the current position can be resumed.",
    eventFailure: "The game may continue, but the practice evidence was not saved. Progress has not been confirmed as updated.",
    recoveryCopy: "The previous game could not be loaded safely. Its original data was kept in a recovery copy on this device; a new game opened.",
    recoveryFailed: "The previous game could not be loaded and no recovery copy could be saved. A new game opened.",
    sgfImport: "Imported {filename}. This replaces the resumable game for the selected board size.",
    sgfWrongSize: "This SGF uses a {size}×{size} board. Select the matching board size before importing.",
    sgfReadFailure: "The SGF file could not be read. The current game was not replaced.",
    sgfParseFailure: "The SGF record could not be parsed or verified. Do not treat the import as successful.",
    sgfExport: "An SGF file has been prepared for download. Check that your browser saved it.",
    sgfExportFailure: "An SGF file could not be prepared. Do not assume you have a copy.",
    boardPlaying: "{size}×{size} Go board; {color} to play.",
    boardScoring: "{size}×{size} Go board; select stone groups to mark dead stones.",
    boardFinished: "{size}×{size} Go board; game finished.",
    emptyPoint: "{coord}: empty intersection, available for a move.",
    stonePoint: "{coord}: {color} stone.",
    scoringPoint: "{coord}: {color} stone; select to change its dead-stone mark.",
    importedResult: "Result recorded in SGF: {code}. This is imported data, not an independently verified score.",
    unknown: "The action could not be verified. No successful outcome should be assumed."
  });
  function blocked(reason) {
    const error = new Error("English Live Game copy blocked: " + reason);
    error.code = "LOCALE_COPY_BLOCKED";
    throw error;
  }
  function createView(options = {}) {
    // Preview is for isolated authoring/tests only; never accepted for a live page.
    if (options.preview !== true) blocked("not approved for runtime or full-site release");
    return Object.freeze({
      locale: "en",
      status: "candidate-preview",
      text(key, values = {}) {
        if (!Object.hasOwn(messages, key)) blocked("unknown message " + String(key));
        if (!values || typeof values !== "object" || Array.isArray(values)) blocked("invalid placeholders");
        return messages[key].replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, name) => {
          if (!Object.hasOwn(values, name)) blocked("missing placeholder " + name);
          const value = values[name];
          if (!(typeof value === "string" || (typeof value === "number" && Number.isFinite(value)))) blocked("invalid placeholder " + name);
          return String(value);
        });
      }
    });
  }
  const api = Object.freeze({ createView, messages });
  root.GoLiveLocaleView = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
