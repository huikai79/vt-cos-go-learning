# AGENTS.md

## Mission

Build and maintain an Evidence-Grounded Adaptive Go Learning Engine, not a generic KataGo GUI, chat tutor, question bank, or SRS.

The learning loop is:

```text
Target -> Experience -> Response -> Evidence -> Update -> Next Experience
```

Primary outcome evidence comes from independent, unprompted, comparable new positions, with retention and transfer weighted above practice volume or immediate performance.

## Read first

Before material changes, read the smallest relevant set in this order:

1. `COMPLETION_MATRIX.md` — current implementation/evidence truth.
2. `TEACHING_GATE.md` — formal teaching/evaluation eligibility.
3. `EXECUTION_PIPELINE.md` — current sequence, gates, and stop conditions.
4. `DESIGN_PLAN.md` — learning/evaluation semantics.
5. `ARCHITECTURE.md` — component and authority boundaries.
6. `RESEARCH_LEARNING_METRICS.md` — research support and evidence limits.

For curriculum/content changes also read `CURRICULUM.md` and `R1_CONTENT_AUDIT.md`.

For publication/release changes also read `PUBLICATION_ARCHITECTURE.md`, `RELEASE_CHECKLIST.md`, and `release-manifest.json`.

For learner-facing UI, copy, or accessibility changes also read `UI_UX_AUDIT.md` and `BRAND.md`.

## Evidence claim discipline

- Keep claims on this ladder: engineering behavior -> content/Go validity -> human usability -> formal evaluation validity -> learning effect -> generalization. Evidence from one layer does not automatically support a higher layer.
- Keep Research/Content Evidence separate from Learner Evidence. Research may change a versioned teaching asset, KC, or item candidate through the existing promotion path; it must not directly change learner state, scoring, scheduling, or formal eligibility.
- Browser and automated accessibility checks are engineering evidence. They do not by themselves establish human usability, accessibility conformance, formal evaluation validity, or learning effect.

## Hard invariants

- Preserve first response separately from eventual correction.
- A presented/exposed item never becomes unseen again.
- Public-source items cannot become formal holdout evidence.
- Keep Practice, Process Check, and Independent Evaluation roles separate.
- Independent evaluation data must not tune the same-round scheduler, teaching, KC model, item, or scoring rule.
- Historical events retain the item/KC/policy/scoring/evidence-taxonomy semantics that applied when recorded.
- Caller metadata cannot upgrade `formalEligible=false`.
- Rules determine legality; KataGo supplies bounded search estimates; LLM prose is never board truth.
- KataGo estimates are not proofs of a unique teaching answer.
- Learner self-report or LLM explanation cannot be promoted to an objective psychological cause.
- Parser, provider, engine, persistence, or analysis failure must not silently become success.

## Change control

Before changing any of the following, write a short change note in the relevant existing specification instead of creating a parallel source of truth:

- KC boundary or prerequisite
- item/scoring schema
- evidence taxonomy or evaluation role
- scheduler semantics
- formal evaluation protocol
- storage schema
- rules scope
- SGF supported scope
- KataGo integration contract

Record: change, why now, affected historical semantics, migration, rollback, and validation.

## External adoption rule

Do not replace a working bounded component merely because a larger OSS implementation exists.

Use the lightest mode that solves an observed bottleneck:

```text
Reference -> Oracle -> Dependency -> Fork
```

Escalate only when measured correctness, scope, maintainability, or workflow needs justify the migration cost.

## Definition of done

A task is done only when:

- requested code/docs are actually changed;
- affected tests/checks are run;
- exact PASS/FAIL/ERROR and unverified items are reported;
- historical evidence semantics are preserved or explicitly version-migrated;
- engineering success is not promoted into content validity or learning-effect evidence.
