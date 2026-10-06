[繁體中文完整說明](README.zh-Hant.md)

# VT-COS Go Learning — A Move of Insight

**Evidence-aware interactive Go learning prototype with explicit boundaries between practice, public evaluation, and formal learning-effect claims.**

Live version: https://huikai.com.kg/vt-cos-go-learning/

VT-COS Go Learning is a local-first learning prototype for Go. It combines a structured curriculum, board-based exercises, delayed checks, SGF decision review, evidence export, and rules-backed validation while keeping engineering completion separate from claims about learning effectiveness.

## What this project demonstrates

- A 15-unit, 19-lesson core curriculum with 106 learner-facing questions.
- Board-state and rules-backed checks for bounded Go tasks.
- Separation of first attempts, retries, exposure history, and delayed checks.
- Explicit distinction between practice data, public test material, and evidence that could qualify for formal evaluation.
- SGF-based decision review and bounded comparison workflows.
- Recomputable learner/evidence state instead of unsupported mastery percentages.
- Local storage, exportable evidence, and explicit versioning of learner-facing flows.
- Engineering gates that prevent public exercises or implementation completion from being treated as proof of retention, transfer, usability, or learning effect.

## Evidence status

**Validated:** the prototype and its engineering/evidence workflows are implemented and testable.

**Not established:** formal learning effectiveness, private-unseen generalization, independent content validity, usability, and accessibility outcomes.

Publicly exposed questions are not treated as a formal hidden holdout. Engineering completion does not automatically promote an educational claim.

## Evaluation philosophy

The project deliberately separates:

**Practice → immediate check → delayed check → new-position application → formal evaluation**

Those stages are not interchangeable. A successful public exercise can demonstrate that a workflow functions, but it does not by itself establish retention, transfer, or learning effectiveness.

## Key documentation

- [Completion Matrix](COMPLETION_MATRIX.md) — current implementation and evidence status
- [Teaching Gate](TEACHING_GATE.md) — conditions for stronger teaching claims
- [Publication Architecture](PUBLICATION_ARCHITECTURE.md) — public/private evidence boundaries
- [Design Plan](DESIGN_PLAN.md) — evaluation and curriculum design
- [Learning Metrics Research](RESEARCH_LEARNING_METRICS.md) — metric definitions and limitations
- [UI/UX Audit](UI_UX_AUDIT.md) — interface decisions and unresolved usability questions

## Why it is relevant to my AI evaluation work

The project applies the same discipline I use in AI evaluation: distinguish observable behavior from interpretation, isolate exposed material from stronger evaluation evidence, preserve provenance, keep retries separate from first attempts, and avoid promoting claims beyond the evidence.

For the full curriculum, release history, installation/use details, and source notes, see the [Traditional Chinese README](README.zh-Hant.md).
