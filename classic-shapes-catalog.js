(function (root, factory) {
  const ontology = typeof module === "object" && module.exports
    ? require("./classic-shapes-ontology.js")
    : root.GoClassicShapeOntology;
  const geometryEvidence = typeof module === "object" && module.exports
    ? require("./classic-geometry-evidence.js")
    : root.GoClassicGeometryEvidence;
  const api = factory(ontology, geometryEvidence);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GoClassicShapeCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Ontology, GeometryEvidence) {
  "use strict";

  if (!Ontology || !Array.isArray(Ontology.concepts)) throw new Error("Classic shape ontology runtime missing.");
  if (!GeometryEvidence || !Array.isArray(GeometryEvidence.records)) throw new Error("Classic geometry evidence runtime missing.");

  const REVIEW = Ontology.REVIEW;
  const ZH_NAME_STATUS = Object.freeze({
    ESTABLISHED: "established",
    ESTABLISHED_ALIAS: "established_alias",
    TEACHING_TRANSLATION: "teaching_translation",
    DESCRIPTIVE_TRANSLATION: "descriptive_translation",
    NO_ESTABLISHED_NAME_FOUND: "no_established_name_found",
    NEEDS_REVIEW: "needs_review"
  });

  const categories = Object.freeze({
    nakade: "大眼與中手",
    corner_life_death: "角部死活",
    rules_corner: "規則敏感型",
    complex_corner: "經典複雜型",
    tesuji: "死活手筋"
  });

  function isChineseLocale(locale) {
    return typeof locale === "string" && locale.startsWith("zh");
  }

  function legacyRelationType(concept, item) {
    if (item.semanticRole === Ontology.SEMANTIC_ROLE.CATEGORY_NAME) return "category-equivalent";
    if (item.semanticRole === Ontology.SEMANTIC_ROLE.DESCRIPTIVE_LABEL) return "project-descriptive-label";
    if (item.relationToCanonical === Ontology.RELATION.MECHANISM_EQUIVALENT) return "concept-equivalent";
    if (concept.id === "knife-five-candidate-v1" && item.name === "Bulky Five") return "terminology-table-equivalent";
    if (concept.id === "big-pigs-mouth-candidate-v1" && item.name === "J Group") return "terminology-table-equivalent";
    if (concept.id === "plum-five-candidate-v1" && (item.name === "Cross Five" || item.name === "Crossed Five")) return "geometry-equivalent";
    if (concept.id === "flower-six-v1" && item.name === "Rabbity Six") return "geometry-equivalent";
    if (concept.id === "flower-six-v1" && item.name === "花六") return "exact-established-name";
    if (concept.id === "bent-four-corner-v1") return item.reviewStatus === REVIEW.VERIFIED ? "exact-established-name" : "terminology-equivalent";
    if (concept.id === "carpenters-square-v1" && (item.name === "一合マス" || item.name === "Carpenter's Square")) return "exact-established-name";
    if (concept.id === "pyramid-four-v1" && item.name === "Pyramid Four") return "geometry-equivalent";
    if (concept.id === "golden-chicken-candidate-v1" && item.name === "Golden Chicken Standing on One Leg") return "teaching-name-equivalent";
    if (concept.id === "long-l-group-v1" || concept.id === "l-group-v1" || concept.id === "l-plus-one-group-v1" || concept.id === "tripod-group-v1") return "source-name";
    if (item.relationToCanonical === Ontology.RELATION.NARROWER) return "condition-specific-alias";
    if (item.nameStatus === Ontology.NAME_STATUS.ESTABLISHED_ALIAS) return "established-alias";
    return item.relationToCanonical === Ontology.RELATION.EXACT ? "exact-established-name" : item.relationToCanonical;
  }

  function preferredChineseName(concept) {
    const preferred = concept.names.find((item) => isChineseLocale(item.locale) && item.displayPreference === "project");
    if (!preferred) return null;
    if (preferred.nameStatus === Ontology.NAME_STATUS.DESCRIPTIVE_TRANSLATION || preferred.nameStatus === Ontology.NAME_STATUS.TEACHING_TRANSLATION) return null;
    return preferred;
  }

  function teachingTranslation(concept) {
    const item = concept.names.find((name) =>
      isChineseLocale(name.locale)
      && (name.nameStatus === Ontology.NAME_STATUS.DESCRIPTIVE_TRANSLATION || name.nameStatus === Ontology.NAME_STATUS.TEACHING_TRANSLATION)
    );
    return item ? item.name : null;
  }

  function deriveZhNameStatus(concept, preferred, translation) {
    const noNameResearch = concept.nameResearch.find((item) => item.locale === "zh" && item.status === Ontology.NAME_STATUS.NO_ESTABLISHED_NAME_FOUND);
    if (noNameResearch) return ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND;
    if (preferred) {
      if (preferred.nameStatus === Ontology.NAME_STATUS.ESTABLISHED) return ZH_NAME_STATUS.ESTABLISHED;
      if (preferred.nameStatus === Ontology.NAME_STATUS.ESTABLISHED_ALIAS) return ZH_NAME_STATUS.ESTABLISHED_ALIAS;
      if (preferred.nameStatus === Ontology.NAME_STATUS.NEEDS_REVIEW) return ZH_NAME_STATUS.NEEDS_REVIEW;
    }
    const chineseEstablished = concept.names.some((item) => isChineseLocale(item.locale)
      && [Ontology.NAME_STATUS.ESTABLISHED, Ontology.NAME_STATUS.ESTABLISHED_ALIAS, Ontology.NAME_STATUS.RARE_OR_LEXICOGRAPHIC].includes(item.nameStatus));
    if (chineseEstablished) return ZH_NAME_STATUS.ESTABLISHED_ALIAS;
    if (translation) return ZH_NAME_STATUS.DESCRIPTIVE_TRANSLATION;
    return ZH_NAME_STATUS.NEEDS_REVIEW;
  }

  function deriveZhNote(concept) {
    const noNameResearch = concept.nameResearch.find((item) => item.locale === "zh" && item.status === Ontology.NAME_STATUS.NO_ESTABLISHED_NAME_FOUND);
    if (noNameResearch) {
      return "截至 " + noNameResearch.reviewedAt + "，在 " + noNameResearch.searchScope.join("、") + " 的查核範圍內，尚未找到可確認的固定中文名稱；這不是不存在的證明。";
    }
    const regional = concept.nameResearch.find((item) => item.locale === "zh-TW" && item.status === "regional_preference_unresolved");
    if (regional) {
      return "已有中文名稱證據，但截至 " + regional.reviewedAt + " 尚未判定臺灣繁中首選名稱；字形轉換不等於 regional usage。";
    }
    return concept.note;
  }

  function sourceObjects(concept) {
    const ids = new Set(concept.sourceIds);
    for (const item of concept.names) for (const id of item.sourceIds) ids.add(id);
    for (const membership of concept.taxonomyMemberships || []) for (const id of membership.sourceIds || []) ids.add(id);
    for (const behavior of concept.rulesetBehavior) for (const id of behavior.sourceIds || []) ids.add(id);
    for (const mapping of concept.negativeMappings) for (const id of mapping.sourceIds || []) ids.add(id);
    for (const ambiguity of Ontology.nameAmbiguities || []) {
      if ((ambiguity.candidateConceptIds || []).includes(concept.id)) for (const id of ambiguity.sourceIds || []) ids.add(id);
    }
    for (const relation of Ontology.taxonomyRelations || []) {
      if (relation.subjectConceptId === concept.id || relation.objectConceptId === concept.id) for (const id of relation.sourceIds || []) ids.add(id);
    }
    for (const relation of Ontology.geometryRelations || []) {
      if (relation.subjectConceptId === concept.id || relation.objectConceptId === concept.id) for (const id of relation.sourceIds || []) ids.add(id);
    }
    return [...ids].map((id) => Ontology.sources[id]).filter(Boolean);
  }

  function toLegacyEntry(concept) {
    const preferred = preferredChineseName(concept);
    const translation = teachingTranslation(concept);
    const zhAliases = concept.names
      .filter((item) => isChineseLocale(item.locale)
        && item !== preferred
        && item.semanticRole !== Ontology.SEMANTIC_ROLE.DESCRIPTIVE_LABEL
        && item.semanticRole !== Ontology.SEMANTIC_ROLE.LITERAL_TRANSLATION)
      .map((item) => ({
        name:item.name,
        reviewStatus:item.reviewStatus,
        relationType:legacyRelationType(concept,item)
      }));

    const aliases = concept.names
      .filter((item) => item !== preferred && item.semanticRole !== Ontology.SEMANTIC_ROLE.DESCRIPTIVE_LABEL && item.semanticRole !== Ontology.SEMANTIC_ROLE.LITERAL_TRANSLATION)
      .map((item) => ({
        locale:item.locale,
        name:item.name,
        relationType:legacyRelationType(concept,item),
        reviewStatus:item.reviewStatus
      }));

    const literal = concept.names.find((item) => item.semanticRole === Ontology.SEMANTIC_ROLE.LITERAL_TRANSLATION);
    const zhNameStatus = deriveZhNameStatus(concept,preferred,translation);
    const noNameResearch = concept.nameResearch.some((item) => item.locale === "zh" && item.status === Ontology.NAME_STATUS.NO_ESTABLISHED_NAME_FOUND);
    const regionalUnresolved = concept.nameResearch.some((item) => item.locale === "zh-TW" && item.status === "regional_preference_unresolved");
    const displayName = preferred
      ? preferred.name
      : (noNameResearch || regionalUnresolved)
        ? concept.teachingLabel
        : (translation || concept.teachingLabel);

    return Object.freeze({
      id:concept.id,
      entityType:concept.entityType,
      category:concept.catalogCategory,
      preferredZhTW:preferred ? preferred.name : null,
      preferenceBasis:preferred ? (preferred.usageScope === Ontology.USAGE_SCOPE.OFFICIAL ? "source_supported" : "project_ui") : "unresolved",
      displayName,
      zhAliases,
      teachingTranslation:translation,
      literalTranslation:literal ? literal.name : null,
      zhNameStatus,
      zhNameNote:deriveZhNote(concept),
      teachingLabel:concept.teachingLabel,
      practiceStatus:concept.practiceStatus,
      reviewStatus:concept.reviewStatus,
      aliases,
      note:concept.note,
      geometryIdentity:concept.geometryIdentity,
      nameResearch:concept.nameResearch,
      nameAmbiguities:(Ontology.nameAmbiguities || []).filter((item) => (item.candidateConceptIds || []).includes(concept.id)),
      taxonomyMemberships:concept.taxonomyMemberships || [],
      taxonomyRelations:(Ontology.taxonomyRelations || []).filter((item) => item.subjectConceptId === concept.id || item.objectConceptId === concept.id),
      geometryRelations:(Ontology.geometryRelations || []).filter((item) => item.subjectConceptId === concept.id || item.objectConceptId === concept.id),
      geometryEvidence:GeometryEvidence.recordsForConcept(concept.id),
      rulesetBehavior:concept.rulesetBehavior,
      negativeMappings:concept.negativeMappings,
      rulesetSensitive:concept.rulesetBehavior.length > 0,
      sources:sourceObjects(concept)
    });
  }

  function validateZhAlias(alias) {
    return alias && typeof alias.name === "string" && alias.name && alias.relationType
      && Object.values(REVIEW).includes(alias.reviewStatus);
  }

  function validateEntry(entry) {
    if (!entry || typeof entry.id !== "string" || !entry.id) return false;
    if (!categories[entry.category]) return false;
    if (!Object.values(REVIEW).includes(entry.reviewStatus)) return false;
    if (!Object.values(ZH_NAME_STATUS).includes(entry.zhNameStatus)) return false;
    if (!Array.isArray(entry.aliases) || !Array.isArray(entry.sources) || !Array.isArray(entry.zhAliases)) return false;
    if (!entry.zhAliases.every(validateZhAlias)) return false;
    if (entry.practiceStatus.indexOf("playable_") !== 0 && entry.practiceStatus.indexOf("catalog_") !== 0) return false;
    if (entry.zhNameStatus === ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND && entry.preferredZhTW !== null) return false;
    if (entry.zhNameStatus === ZH_NAME_STATUS.NO_ESTABLISHED_NAME_FOUND && !entry.teachingTranslation) return false;
    return entry.aliases.every((alias) => alias && alias.locale && alias.name && alias.relationType && Object.values(REVIEW).includes(alias.reviewStatus));
  }

  const entries = Object.freeze(Ontology.concepts.map(toLegacyEntry));
  if (!entries.every(validateEntry)) throw new Error("Invalid classic shape catalog compatibility entry.");

  return Object.freeze({
    version:"world-classic-shapes-v12",
    ontologyVersion:Ontology.version,
    REVIEW,
    ZH_NAME_STATUS,
    ENTITY_TYPE:Ontology.ENTITY_TYPE,
    NAME_STATUS:Ontology.NAME_STATUS,
    SEMANTIC_ROLE:Ontology.SEMANTIC_ROLE,
    RELATION:Ontology.RELATION,
    TAXONOMY_RELATION:Ontology.TAXONOMY_RELATION,
    GEOMETRY_RELATION:Ontology.GEOMETRY_RELATION,
    AMBIGUITY_STATUS:Ontology.AMBIGUITY_STATUS,
    USAGE_SCOPE:Ontology.USAGE_SCOPE,
    sources:Ontology.sources,
    concepts:Ontology.concepts,
    nameAmbiguities:Ontology.nameAmbiguities,
    nameRelations:Ontology.nameRelations,
    taxonomyRelations:Ontology.taxonomyRelations,
    geometryRelations:Ontology.geometryRelations,
    geometryEvidenceVersion:GeometryEvidence.version,
    geometryEvidenceRecords:GeometryEvidence.records,
    categories,
    entries,
    validateEntry,
    toLegacyEntry
  });
});
