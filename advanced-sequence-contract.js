(function (root) {
  "use strict";

  function point(value) {
    return Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) ? value : null;
  }

  function samePoint(first, second) {
    return Boolean(point(first) && point(second) && first[0] === second[0] && first[1] === second[1]);
  }

  function sortedPoints(points) {
    return points.map(([x, y]) => [x, y]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  }

  function trackedLiberties(board, trackedPoint, trackedColor, Go) {
    if (!point(trackedPoint)) return null;
    const [x, y] = trackedPoint;
    if (!board[y] || board[y][x] !== trackedColor) return 0;
    const group = Go.groupAt(board, x, y);
    return group ? group.liberties.length : 0;
  }

  function setupGroupsHaveLiberties(board, Go) {
    const seen = new Set();
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board.length; x += 1) {
        if (!board[y][x] || seen.has(x + "," + y)) continue;
        const group = Go.groupAt(board, x, y);
        if (!group || group.liberties.length === 0) return false;
        for (const [gx, gy] of group.stones) seen.add(gx + "," + gy);
      }
    }
    return true;
  }

  function validateExpectedCount(actual, expected, label, errors) {
    if (expected === undefined) return;
    if (!Number.isInteger(expected) || expected < 0) {
      errors.push(label + " expected capture count invalid");
      return;
    }
    if (actual !== expected) errors.push(label + " captured " + actual + " but expected " + expected);
  }

  function validateExpectedLiberties(board, item, expected, label, Go, errors) {
    if (expected === undefined) return;
    if (!Number.isInteger(expected) || expected < 0) {
      errors.push(label + " expected tracked liberties invalid");
      return;
    }
    if (!point(item.trackedPoint) || ![Go.BLACK, Go.WHITE].includes(item.trackedColor)) {
      errors.push(label + " trackedPoint/trackedColor missing");
      return;
    }
    const actual = trackedLiberties(board, item.trackedPoint, item.trackedColor, Go);
    if (actual !== expected) errors.push(label + " tracked liberties " + actual + " but expected " + expected);
  }

  function replayCanonical(item, Go) {
    const errors = [];
    let board;
    try {
      board = Go.boardFromStones(item.setupStones || [], item.boardSize);
    } catch (error) {
      return { ok: false, errors: [item.id + " setup invalid: " + error.message], finalBoard: null };
    }
    if (!setupGroupsHaveLiberties(board, Go)) errors.push(item.id + " setup contains a zero-liberty group");
    let previousBoard = null;
    const snapshots = [];

    for (let index = 0; index < item.decisions.length; index += 1) {
      const decision = item.decisions[index];
      const label = item.id + "/" + decision.id;
      if (!Array.isArray(decision.acceptedMoves) || decision.acceptedMoves.length !== 1 || !point(decision.acceptedMoves[0])) {
        errors.push(label + " must have exactly one canonical accepted move in advanced-sequence-v1");
        break;
      }
      const learnerMove = decision.acceptedMoves[0];
      validateExpectedLiberties(board, item, decision.expectedTrackedLibertiesBeforeLearner, label + " before learner", Go, errors);
      const beforeLearner = board.map((row) => row.slice());
      const learner = Go.playMove(board, learnerMove[0], learnerMove[1], item.playerColor, previousBoard ? { previousBoard } : {});
      if (!learner.legal) {
        errors.push(label + " canonical learner move is illegal: " + learner.reason);
        break;
      }
      validateExpectedCount(learner.captured.length, decision.expectedLearnerCapturedCount, label + " learner", errors);
      board = learner.board;
      validateExpectedLiberties(board, item, decision.expectedTrackedLibertiesAfterLearner, label + " after learner", Go, errors);
      snapshots.push({ decisionIndex: index, afterLearnerBoard: board.map((row) => row.slice()), previousBoard: beforeLearner });
      previousBoard = beforeLearner;

      if (decision.opponentMoveMustBeUniqueLiberty) {
        if (!point(item.trackedPoint) || ![Go.BLACK, Go.WHITE].includes(item.trackedColor)) {
          errors.push(label + " unique-liberty check needs trackedPoint/trackedColor");
        } else {
          const [tx, ty] = item.trackedPoint;
          const trackedGroup = board[ty] && board[ty][tx] === item.trackedColor ? Go.groupAt(board, tx, ty) : null;
          if (!trackedGroup || trackedGroup.liberties.length !== 1) {
            errors.push(label + " expected exactly one forced target liberty");
          } else if (!samePoint(trackedGroup.liberties[0], decision.opponentMove)) {
            errors.push(label + " opponentMove is not the tracked group's unique liberty");
          }
        }
      }

      if (decision.opponentMove) {
        if (!point(decision.opponentMove)) {
          errors.push(label + " opponentMove invalid");
          break;
        }
        if (index === item.decisions.length - 1) errors.push(label + " final decision cannot have an opponentMove without a following learner decision");
        const beforeOpponent = board.map((row) => row.slice());
        const opponentColor = item.playerColor === Go.BLACK ? Go.WHITE : Go.BLACK;
        const opponent = Go.playMove(board, decision.opponentMove[0], decision.opponentMove[1], opponentColor, { previousBoard });
        if (!opponent.legal) {
          errors.push(label + " canonical opponent move is illegal: " + opponent.reason);
          break;
        }
        validateExpectedCount(opponent.captured.length, decision.expectedOpponentCapturedCount, label + " opponent", errors);
        board = opponent.board;
        validateExpectedLiberties(board, item, decision.expectedTrackedLibertiesAfterOpponent, label + " after opponent", Go, errors);
        previousBoard = beforeOpponent;
      } else if (index !== item.decisions.length - 1) {
        errors.push(label + " has no opponentMove before the final decision");
        break;
      }
    }

    for (const check of item.verificationBranches || []) {
      const label = item.id + "/branch";
      if (!Number.isInteger(check.afterDecisionIndex) || check.afterDecisionIndex < 0 || check.afterDecisionIndex >= snapshots.length) {
        errors.push(label + " afterDecisionIndex invalid");
        continue;
      }
      if (!point(check.opponentMove) || !point(check.learnerReply)) {
        errors.push(label + " branch point invalid");
        continue;
      }
      const snapshot = snapshots[check.afterDecisionIndex];
      const opponentColor = item.playerColor === Go.BLACK ? Go.WHITE : Go.BLACK;
      const opponent = Go.playMove(snapshot.afterLearnerBoard, check.opponentMove[0], check.opponentMove[1], opponentColor, { previousBoard: snapshot.previousBoard });
      if (!opponent.legal) {
        errors.push(label + " alternate opponent move illegal: " + opponent.reason);
        continue;
      }
      validateExpectedCount(opponent.captured.length, check.expectedOpponentCapturedCount, label + " alternate opponent", errors);
      const reply = Go.playMove(opponent.board, check.learnerReply[0], check.learnerReply[1], item.playerColor, { previousBoard: snapshot.afterLearnerBoard });
      if (!reply.legal) {
        errors.push(label + " alternate learner reply illegal: " + reply.reason);
        continue;
      }
      validateExpectedCount(reply.captured.length, check.expectedLearnerCapturedCount, label + " alternate learner", errors);
      if (point(item.trackedPoint) && [Go.BLACK, Go.WHITE].includes(item.trackedColor) && check.expectedTrackedLibertiesAfterReply !== undefined) {
        validateExpectedLiberties(reply.board, item, check.expectedTrackedLibertiesAfterReply, label + " alternate reply", Go, errors);
      }
    }

    if (Array.isArray(item.expectedFinalStones)) {
      for (const [x, y, color] of item.expectedFinalStones) {
        if (!board[y] || board[y][x] !== color) errors.push(item.id + " final stone mismatch at " + x + "," + y);
      }
    }
    if (Array.isArray(item.expectedFinalEmpty)) {
      for (const value of item.expectedFinalEmpty) {
        if (!point(value)) {
          errors.push(item.id + " final empty point invalid");
          continue;
        }
        const [x, y] = value;
        if (!board[y] || board[y][x] !== Go.EMPTY) errors.push(item.id + " expected final empty at " + x + "," + y);
      }
    }

    return { ok: errors.length === 0, errors, finalBoard: board };
  }

  function validateExperience(item, Go) {
    const errors = [];
    if (!item || typeof item !== "object") return { ok: false, errors: ["experience missing"], finalBoard: null };
    if (typeof item.id !== "string" || !item.id) errors.push("experience id missing");
    if (!Number.isInteger(item.version) || item.version < 1) errors.push((item.id || "experience") + " version invalid");
    if (!Number.isInteger(item.boardSize) || item.boardSize < Go.MIN_SIZE || item.boardSize > Go.MAX_SIZE) errors.push((item.id || "experience") + " boardSize invalid");
    if (![Go.BLACK, Go.WHITE].includes(item.playerColor)) errors.push((item.id || "experience") + " playerColor invalid");
    if (typeof item.familyId !== "string" || !item.familyId) errors.push((item.id || "experience") + " familyId missing");
    if (typeof item.variantId !== "string" || !item.variantId) errors.push((item.id || "experience") + " variantId missing");
    if (!Array.isArray(item.variationAxes) || !item.variationAxes.length || item.variationAxes.some((axis) => typeof axis !== "string" || !axis)) errors.push((item.id || "experience") + " variationAxes invalid");
    if (!Array.isArray(item.decisions) || !item.decisions.length) errors.push((item.id || "experience") + " decisions missing");
    if (errors.length) return { ok: false, errors, finalBoard: null };
    const replay = replayCanonical(item, Go);
    return { ok: replay.ok, errors: [...errors, ...replay.errors], finalBoard: replay.finalBoard };
  }

  function validateAll(experiences, Go) {
    const source = Array.isArray(experiences) ? experiences : [];
    const results = source.map((item) => ({ id: item && item.id || "", ...validateExperience(item, Go) }));
    const errors = results.flatMap((result) => result.errors);
    const ids = new Set();
    const variants = new Set();
    for (const item of source) {
      if (!item || typeof item !== "object") continue;
      if (ids.has(item.id)) errors.push("duplicate experience id " + item.id);
      ids.add(item.id);
      const key = item.familyId + "/" + item.variantId;
      if (variants.has(key)) errors.push("duplicate family variant " + key);
      variants.add(key);
    }
    return { ok: results.length > 0 && errors.length === 0, results, errors };
  }

  function summarizeFamilies(experiences) {
    const families = new Map();
    for (const item of Array.isArray(experiences) ? experiences : []) {
      if (!item || typeof item.familyId !== "string") continue;
      if (!families.has(item.familyId)) families.set(item.familyId, []);
      families.get(item.familyId).push(item);
    }
    return Array.from(families.entries()).map(([familyId, items]) => ({
      familyId,
      variants: items.length,
      axes: Array.from(new Set(items.flatMap((item) => item.variationAxes || []))).sort()
    }));
  }

  const api = { samePoint, sortedPoints, trackedLiberties, setupGroupsHaveLiberties, validateExperience, validateAll, summarizeFamilies };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedSequenceContract = api;
})(typeof window !== "undefined" ? window : globalThis);
