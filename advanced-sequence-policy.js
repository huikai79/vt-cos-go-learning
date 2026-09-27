(function (root) {
  "use strict";

  const VERSION = "advanced-fixed-interleave-v1";

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  }

  function orderedExperiences(experiences) {
    const list = Array.isArray(experiences) ? experiences.slice() : [];
    const seeds = list.filter((item) => item && item.variantId === "seed");
    const variants = list.filter((item) => item && item.variantId !== "seed");
    return seeds.concat(variants);
  }

  function validateCatalog(experiences) {
    const ordered = orderedExperiences(experiences);
    const errors = [];
    const ids = new Set();
    const families = new Map();
    for (const item of ordered) {
      if (!item || typeof item.id !== "string" || !item.id) {
        errors.push("experience id missing");
        continue;
      }
      if (ids.has(item.id)) errors.push("duplicate experience id: " + item.id);
      ids.add(item.id);
      if (typeof item.familyId !== "string" || !item.familyId) errors.push(item.id + " familyId missing");
      if (typeof item.variantId !== "string" || !item.variantId) errors.push(item.id + " variantId missing");
      if (!families.has(item.familyId)) families.set(item.familyId, []);
      families.get(item.familyId).push(item);
    }
    for (const [familyId, items] of families.entries()) {
      if (items.filter((item) => item.variantId === "seed").length !== 1) errors.push(familyId + " must have exactly one seed");
      if (items.filter((item) => item.variantId !== "seed").length < 1) errors.push(familyId + " must have at least one variant");
    }
    const firstVariant = ordered.findIndex((item) => item.variantId !== "seed");
    if (firstVariant >= 0 && ordered.slice(firstVariant).some((item) => item.variantId === "seed")) errors.push("seed must not appear after variant phase");
    return { ok: errors.length === 0, errors, ordered };
  }

  function currentEvents(eventsOrStore) {
    const events = Array.isArray(eventsOrStore)
      ? eventsOrStore
      : record(eventsOrStore) && Array.isArray(eventsOrStore.events) ? eventsOrStore.events : [];
    return events.filter((event) => event && event.presentationPolicyVersion === VERSION);
  }

  function completedIds(eventsOrStore) {
    return new Set(currentEvents(eventsOrStore).filter((event) => event.type === "completed").map((event) => event.experienceId));
  }

  function stageState(experiences, eventsOrStore) {
    const validation = validateCatalog(experiences);
    if (!validation.ok) return { ok: false, errors: validation.errors, ordered: validation.ordered, completed: 0, nextIndex: -1, complete: false };
    const completed = completedIds(eventsOrStore);
    const nextIndex = validation.ordered.findIndex((item) => !completed.has(item.id));
    return {
      ok: true,
      errors: [],
      ordered: validation.ordered,
      completed: validation.ordered.filter((item) => completed.has(item.id)).length,
      nextIndex,
      complete: nextIndex === -1
    };
  }

  function transitionEligibility(experiences, eventsOrStore, familyId) {
    const validation = validateCatalog(experiences);
    if (!validation.ok) return { status: "INSUFFICIENT_DATA", familyId, reason: "policy_catalog_invalid" };
    const ordered = validation.ordered;
    const expectedPosition = new Map(ordered.map((item, index) => [item.id, index]));
    const events = currentEvents(eventsOrStore);
    const presented = events.filter((event) => event.type === "presented");
    const seedItem = ordered.find((item) => item.familyId === familyId && item.variantId === "seed");
    const variantItems = ordered.filter((item) => item.familyId === familyId && item.variantId !== "seed");
    if (!seedItem || !variantItems.length) return { status: "INSUFFICIENT_DATA", familyId, reason: "family_catalog_incomplete" };

    const seedEventIndex = presented.findIndex((event) => event.experienceId === seedItem.id);
    const variantEventIndex = presented.findIndex((event) => variantItems.some((item) => item.id === event.experienceId));
    if (seedEventIndex < 0 || variantEventIndex < 0) return { status: "INSUFFICIENT_DATA", familyId, reason: "seed_or_variant_not_presented" };
    if (seedEventIndex >= variantEventIndex) return { status: "INSUFFICIENT_DATA", familyId, reason: "seed_not_presented_before_variant" };

    for (const event of presented.slice(0, variantEventIndex + 1)) {
      if (!expectedPosition.has(event.experienceId) || event.policyPosition !== expectedPosition.get(event.experienceId)) {
        return { status: "INSUFFICIENT_DATA", familyId, reason: "policy_position_mismatch" };
      }
    }

    const allOtherFamilies = new Set(ordered.filter((item) => item.familyId !== familyId).map((item) => item.familyId));
    const interveningFamilies = new Set(presented.slice(seedEventIndex + 1, variantEventIndex).map((event) => event.familyId).filter((id) => id !== familyId));
    const missing = [...allOtherFamilies].filter((id) => !interveningFamilies.has(id));
    if (missing.length) {
      return { status: "INSUFFICIENT_DATA", familyId, reason: "fixed_interleave_incomplete", missingFamilies: missing };
    }
    return { status: "ELIGIBLE_DESCRIPTIVE", familyId, interveningFamilies: [...interveningFamilies].sort(), presentationPolicyVersion: VERSION };
  }

  const api = { VERSION, orderedExperiences, validateCatalog, currentEvents, completedIds, stageState, transitionEligibility };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GoAdvancedSequencePolicy = api;
})(typeof window !== "undefined" ? window : globalThis);
