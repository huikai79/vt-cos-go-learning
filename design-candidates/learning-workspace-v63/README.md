# Learning Workspace v63 Design Candidate

> `NON_NORMATIVE_DESIGN_CANDIDATE`  
> Review date: 2026-10-01  
> Baseline: `main` / local `HEAD` `ed4066f`, plus the uncommitted v62 working-tree candidate  
> Scope: Core Learning Workspace presentation and interaction hierarchy only  
> Status: `REVIEW_CANDIDATE` — no production implementation approval implied

This package follows the sequence:

`Business Rules Registry → Sitemap / IA → 5 Core User Flows → UI State Matrix → 6 Wireframes + Award Intent → Award Experience Brief → Creative Direction → Visual System → High-Fi Mockup → Motion Prototype → Frontend Craft Review`

It is a temporary review artifact. Stable accepted interaction rules belong in `UI_UX_AUDIT.md`; engine, scoring, evidence, scheduler, and formal-evaluation authority remain in their existing current-truth files and code.

## F1

The Learning Workspace should be a compact, calm decision surface whose visual climax is the learner's move and its evidence-grounded consequence—not a dashboard and not a showcase of every available tool.

## F2

1. The desktop task surface uses one shared vertical datum: context, question, board/response, feedback, and next action align into a visible reading pipeline without an orphaned lower-right tools card.
2. Functional visuals are state-dependent: the board is the primary visual for board tasks; text tasks receive a diagram only when it clarifies the task without leaking the answer, usually after first response in S3.
3. Award ambition comes from restraint, continuity, material detail, and a memorable response moment; it may never obscure correctness, error, focus, or evidence semantics.

---

## 1. Authority and evidence boundary

### Facts

- `COMPLETION_MATRIX.md`, `TEACHING_GATE.md`, `EXECUTION_PIPELINE.md`, `DESIGN_PLAN.md`, `ARCHITECTURE.md`, `RESEARCH_LEARNING_METRICS.md`, current code, and tests were rechecked before this package.
- Local `HEAD` and `origin/main` resolve to the same commit. The working tree includes uncommitted v62 changes.
- Current formal teaching candidate: `formal-teaching-candidate-2026-10-01-j`, fingerprint `fnv1a32-js16-cc64381a`.
- Formal novice usability and human accessibility remain `NOT_TESTED`; formal teaching/evaluation remains `BLOCKED`; learning effect remains `NOT_MEASURED`.

### Inference

- v62 is a useful engineering baseline but not a validated final design.
- The text-only task layout exposes an IA defect: a 760px task column and a separate 340px lower-right disclosure create false asymmetry and unused space.
- A consistent brand does not require identical page density. The homepage can remain expressive while the workspace uses the same materials and tokens with lower visual noise.

### Unknown

- Whether persistent S1–S5 orientation measurably helps novices.
- Whether the compact desktop composition improves human completion or comprehension.
- Whether the proposed motion feels supportive to keyboard and screen-reader users.
- Whether functional post-answer diagrams improve reconstruction on text-only tasks.

---

## 2. Business Rules Registry

This registry is a traceability index, not a new source of truth.

| Rule | Business rule | Authority / current implementation | UI consequence | Wireframe coverage | Status |
|---|---|---|---|---|---|
| BR-01 | Preserve first response separately from retry and eventual correction. | Project hard invariant; `app.js`; tests | S3 may add retry, but never visually or semantically replace first response. | W2, W4, W6 | `PASS` baseline |
| BR-02 | An exposed item never becomes unseen again. | Project hard invariant; evidence taxonomy | Do not label public or repeated tasks as unseen. | W4 | `PASS` baseline |
| BR-03 | Practice, Process Check, and Independent Evaluation remain distinct. | `DESIGN_PLAN.md`; evaluation contracts | Mode label and feedback policy remain explicit; masked evaluation is not ordinary practice. | W4 | `PASS` baseline |
| BR-04 | UI consumes legality and scoring authority; it does not invent them. | `go.js`, content/scoring contracts | Illegal is separate from wrong; board decoration is not answer authority. | W1, W2, W4, W5, W6 | `PASS` baseline |
| BR-05 | S2 must not reveal correctness, accepted move, original move, takeaway, or solution tree before valid first response. | `UI_UX_AUDIT.md`; tests | Pre-answer layout stays visually quiet; answer-revealing diagram is forbidden. | W1, W5 | `PASS` baseline |
| BR-06 | Hint is an explicit action and independent event; it does not become first response. | `app.js`; event contract | Hint feedback has its own region; first answer after hint is marked hinted. | W1, W4, W5 | `PASS` baseline |
| BR-07 | Masked evaluation hides correctness until its policy allows disclosure. | `trial.js`; tests | No correct/wrong color, result board delta, takeaway, or hint during masking. | W4 | `PASS` baseline |
| BR-08 | Due and wrong-review entry points appear only when their real counts are non-zero. | `app.js`; UI tests | No placeholder tasks or zero-count badges. | W4 | `PASS` baseline |
| BR-09 | Storage, parser, provider, engine, or analysis failure cannot appear as success. | Project hard invariant | System warning remains separate from answer feedback and is announced. | W4 | `PASS` baseline |
| BR-10 | S1–S5 is learner-facing interaction grammar, not KC, mastery, or the Phase 1–5 research roadmap. | `UI_UX_AUDIT.md`; `DESIGN_PLAN.md` | State indicator never reports mastery or a percentage. | W1–W6 | `PASS` baseline |
| BR-11 | S4 wording must distinguish delayed same-item review, delayed new comparable shape, immediate variation, and first pilot batch. | v60 audit/current code | Context chip uses the real selection reason; never overclaims retention. | W4 | `PASS` baseline |
| BR-12 | S5 fixed application, natural play, and SGF review are separate activities. | events and evidence contracts | Secondary tools preserve separate labels and destinations. | W4 | `PASS` baseline |
| BR-13 | Course navigation does not silently change the current lesson when only browsing a unit. | Current navigation contract/tests | Unit selector filters; explicit lesson selection changes the task. | W1–W6 | `PASS` baseline |
| BR-14 | All current task types remain completable: count, connect, choice, move, and spot. | `content.js`; UI tests | Response region supports board and non-board tasks without a second learner state. | W1–W6 | `PASS` baseline |
| BR-15 | Keyboard board interaction, roving tabindex, visible focus, Enter/Space, and arrows remain available. | UI tests/accessibility contract | Board retains one tab stop and strong focus; motion never moves focus unexpectedly. | W1, W2, W5, W6 | `PASS` automated / human `NOT_TESTED` |
| BR-16 | 320px and 200% reflow require no horizontal scroll and preserve core completion. | UI tests | Mobile is a reordered composition, not a squeezed desktop grid. | W5, W6 | `PASS` automated / human `NOT_TESTED` |
| BR-17 | Advanced, SGF, diagnostics, research provenance, raw export, and engine settings are second-layer capabilities. | Current IA boundary | One compact “Tools & data” entry; no orphan card in the task canvas. | W1–W6 | Candidate `MODIFY` |
| BR-18 | Existing destinations and operations must remain reachable. | Actual DOM/handlers/tests | Redesign may move or progressively disclose controls but not remove them. | All flows | Candidate `PASS` traceability |
| BR-19 | Completion is not mastery; no uncalibrated mastery percentage or aggregate learning score. | Evidence invariants | Progress may show location/completion only, with interpretation boundary. | W1–W6 | `PASS` candidate |
| BR-20 | Candidate-critical presentation changes require deterministic refreeze and invalidate old human receipts. | candidate/gate contract | Prototype is isolated; production adoption requires new ID/version/fingerprint. | Implementation gate | `BLOCKED` pending approval |

### Function and link preservation map

| Group | Existing capability / destination | Candidate placement | Preservation acceptance |
|---|---|---|---|
| Orientation | course home, Core context, current unit/lesson, S-state, skip link | compact top context + course drawer + semantic main target | All reachable by keyboard; skip link lands on current task. |
| Course navigation | unit selector, 19 lessons, previous/next unit, lesson talk, learning-flow dialog | course drawer + contextual text links | Browsing a unit does not switch the current task; explicit lesson click does. |
| Core action | five response types, hint, feedback, next | task canvas | First response, retry, illegal, and hint remain separate. |
| Today | due review, wrong review, resume | compact conditional top actions / course drawer | Hidden when count is zero; count and accessible label remain accurate. |
| Stage extension | 5×5/7×7/9×9 board practice; conditional classic shapes | context row after lesson identity | Size parameter and conditional visibility remain intact. |
| Practice tools | interval practice, application practice, 9×9 free play, Advanced | single top-level tools drawer | Each action remains explicit with its current limitation copy. |
| SGF | sample SGF, file import, reflection, answer comparison, review, portable export | tools drawer → SGF workspace | File errors remain errors; original move is not shown before learner reconstruction. |
| Trial/settings | seven-day trial, fixed/adaptive candidate scheduler | tools drawer → experiments/settings | Masking and policy labels remain explicit; not presented as formal evaluation. |
| Export | Markdown learning summary; Core/live JSON backup; Advanced export on Advanced page | tools drawer → records/export | Scope and failure state stay visible; no false saved state. |
| Records/diagnostics | completion, evidence, live opportunities, integrated evidence, corrections | records drawer, after core task | Missing/failed data remains UNKNOWN/ERROR, not a capability score. |
| Landing destinations | Advanced, free play, history, math, global observatory, FAQ, sources, current-truth links | unchanged; out of this prototype | Existing href targets and same-page anchors must survive production work. |

---

## 3. Sitemap / Information Architecture

```text
悟之一手
├─ 首頁 / Learning entry (out of current implementation scope)
├─ Core Learning Workspace
│  ├─ Current task
│  │  ├─ Location + real task source
│  │  ├─ S-state + Question
│  │  ├─ Board or functional task visual
│  │  ├─ Response
│  │  ├─ Feedback / reconstruction
│  │  └─ Next action
│  ├─ Course drawer
│  │  ├─ Unit selector
│  │  ├─ Lesson list
│  │  ├─ Previous / next unit
│  │  ├─ Lesson talk
│  │  └─ Learning-flow explanation
│  ├─ Today (conditional)
│  │  ├─ Due review
│  │  └─ Wrong-answer review
│  ├─ Tools & data (second layer)
│  │  ├─ Interval practice
│  │  ├─ Application practice
│  │  ├─ Free board
│  │  ├─ Advanced training
│  │  ├─ SGF review
│  │  ├─ Seven-day process trial
│  │  ├─ Scheduler candidate setting
│  │  ├─ Records / diagnostics
│  │  └─ Exports / backup
│  └─ System status (only when needed)
├─ Advanced training (existing destination; no redesign here)
├─ Free play / review (existing destination; no redesign here)
└─ Explore pages (existing destinations; no redesign here)
```

### Hierarchy rule

At any moment, the first layer answers only four questions:

1. Where am I?
2. What must I decide now?
3. How do I respond?
4. What happened and what is next?

Everything else is reachable but does not occupy permanent task-canvas space.

---

## 4. Five Core User Flows

### UF-01 — Enter, orient, and begin

`Homepage / resume → Core workspace → optional S1 lesson talk → S2 task question → response surface`

- Success: learner can name the current task and begin without opening tools.
- Branches: resume existing task; select a different lesson explicitly; close/reopen lesson talk.
- Failure protections: entering does not imply answering; opening S1 does not create scored success.
- Links preserved: home, course drawer, lesson talk, learning-flow explanation, stage practice.

### UF-02 — Standard response cycle

`S2 question → board/choice/count/connect/spot response → first response saved → S3 feedback → retry if allowed → eventual correction → next`

- Success: question, response, immediate result, and next action remain in one visual field on desktop.
- Branches: correct; wrong; illegal move; hint before first response; hint after wrong.
- Failure protections: illegal does not become wrong; retry does not rewrite first response; correct hides hint.

### UF-03 — Recovery and reconstruction

`Wrong first response → observable consequence → optional hint → retry → corrected result / unresolved → next when allowed`

- Success: learner can compare the board state and explanation without losing the original task context.
- Branches: no hint available; storage warning; interrupted and resumed task.
- Failure protections: feedback does not diagnose “careless” or “misunderstood” without independent evidence.

### UF-04 — Review and masked process check

`Real due/wrong entry → task-source label → S4 same-item or changed-shape task → first response → normal feedback OR masked acknowledgement → queue continuation / exit`

- Success: learner understands whether this is due review, wrong review, immediate variation, or a masked process trial.
- Branches: no due items; no wrong items; batch completion; data unavailable.
- Failure protections: no fake task; no premature correctness; no public/exposed task called unseen.

### UF-05 — Apply and use secondary tools

`Core task → Tools & data → application / free play / Advanced / SGF / records / export → scoped secondary experience → explicit return`

- Success: all existing capabilities remain discoverable without competing with S2.
- Branches: SGF file failure; export failure; diagnostics unavailable; fixed application vs natural play.
- Failure protections: second-layer data never overrides scoring, legality, or formal eligibility.

---

## 5. UI State Matrix

### S1–S5 contract

| State | Purpose / entry | Visible | Hidden / forbidden | Primary / next | Evidence and authority | Focus / announcement | Mobile |
|---|---|---|---|---|---|---|---|
| S1 看懂 | New lesson instruction or manual replay | worked example, teaching board, key idea, start | scored correctness, formal claim, unseen label | Start task → S2 | intro-seen only; not a scored response | dialog heading → start → question | single-column stepper; no large sidebar |
| S2 自己判斷 | item presented; no valid first response | location, neutral task, board/response, optional hint | answer, correctness, original move, takeaway, solution tree | Answer → S3; illegal stays S2 | legality/scoring consumed from lower authority; exposure retained | question first; board roving focus; neutral instruction live text | state chip → question → board/response; tools below fold |
| S3 修正重算 | valid first response exists | outcome allowed by policy, observable result, retry/hint/next | psychological diagnosis; rewritten first response | retry or next | first response and later correction stored separately | feedback announced; focus remains task-local | feedback immediately follows response; next is unmistakable |
| S4 隔時再判 | real due interval; same item or comparable new shape | accurate source/reason and elapsed context; task | formal unseen claim unless eligible; generic “new shape” when false | answer → policy-governed feedback/queue | scheduler and evaluation role remain authoritative | question announces real review context | compact review context; no five-step rail |
| S5 局面應用 | fixed probe, natural game, or SGF mode explicitly opened | reduced cue and mode boundary | automatic transfer/mastery claim | complete scoped activity / return | streams remain separate | main heading announces mode and limitation | dedicated task page/order; secondary tools remain collapsed |

### Negative and cross-state contract

| State | Visible / enabled | Hidden / disabled | Primary / secondary | Feedback authority / data effect | Focus / screen reader | Candidate result |
|---|---|---|---|---|---|---|
| unanswered | neutral instruction, response, optional hint | result, takeaway, next disabled | answer / hint | presentation/exposure only | question then response | `PASS` |
| correct | success type + explanation + next | hint; retry unless contract allows | next | scorer determines correctness; first response retained | announce feedback; next visible | `PASS` |
| wrong | error type + observable clue + retry | success language; next until allowed | retry / hint | scorer determines wrong; first response retained | announce result, not diagnosis | `PASS` |
| retry | original feedback and active response surface | first-response overwrite | retry / hint | retry event separate | return to board/option without surprise scroll | `PASS` |
| eventual correction | corrected outcome plus original-attempt continuity | “first try correct” implication | next | correction is later evidence only | announce correction accurately | `PASS` |
| illegal move | interaction warning; board remains enabled | answer result; wrong state | choose another point | rules engine only; no answer event | focus stays on selected board point; announce warning | `PASS` |
| hint requested/shown | hint region and “shown” state | hint as answer; repeated hint action | answer/retry | hint event separate; unhinted false | announce hint region | `PASS` |
| no hint available | reason and usable response surface | empty fake hint | answer | no hint event | announce unavailability | `UNKNOWN` existing Core reachability |
| evaluation masked | neutral receipt “first response recorded” | correctness, result board delta, takeaway, hint | continue batch / exit per policy | masking policy authority; not formal by UI label | announce receipt only | `PASS` baseline |
| due review | real count/source and task | fake unseen claim | answer | scheduler selects | focus question | `PASS` |
| wrong-answer review | real missed queue/source | retention implication | answer | missed queue selects | focus question | `PASS` |
| no due / no wrong | no corresponding primary entry | zero-count placeholder | continue course / optional new practice | no synthetic queue | no announcement needed | `PASS` |
| storage warning | separate persistent system alert | replacement of answer feedback | export/retry if available | persistence remains failed/unknown | alert announced; answer context retained | `PASS` baseline |
| data/error | cause/boundary and unaffected actions | fabricated data/result | retry/return | source component reports ERROR/UNKNOWN | error heading/region | `PASS` baseline |
| loading/unavailable | progress/reason and safe cancel/return | blank task or success | wait/cancel/return | no invented evidence | status announced | `UNKNOWN` Core loading branch |

---

## 6. Six Wireframes with Award Intent

Reviewable render: `wireframes.html`.

### W1 — Desktop Board Task / S2

```text
┌ compact context: Core · Unit · Lesson · S2 · task count ───── tools ┐
│ Question: one decisive sentence                                 │
├─────────────────────────┬─────────────────────────────────────────┤
│                         │ neutral response instruction            │
│      440px board        │ [response controls / board instruction] │
│                         │ [hint]                 [next disabled]   │
└─────────────────────────┴─────────────────────────────────────────┘
```

- Memorable moment: the board arrives as a quiet field of attention, with no answer-colored noise.
- Emotional intent: composed concentration.
- Interaction signature: cursor/focus ring behaves like a precise “breath” around one intersection.
- Visual opportunity: warm wood against restrained ivory and ink green.
- Restraint: no ambient animation, dashboard statistics, permanent tool card, or decorative illustration.
- Non-negotiables: BR-01, BR-04–06, BR-15, BR-18.
- Award risk: excessive emptiness can look unfinished; solve with proportion, typography, and material detail, not more cards.

### W2 — Desktop Board Task / S3

```text
┌ same context and unchanged question ──────────────────────────────┐
├─────────────────────────┬─────────────────────────────────────────┤
│ board + consequence     │ first-response result                   │
│ original selection kept │ observable explanation                 │
│ visually identifiable   │ [retry / hint] or [next]               │
└─────────────────────────┴─────────────────────────────────────────┘
```

- Memorable moment: the learner's move becomes a visible consequence, not a generic toast.
- Emotional intent: candid but recoverable.
- Interaction signature: feedback unfolds from the response region while the board remains spatially stable.
- Visual opportunity: a narrow consequence trace connects selected point, board change, and explanation.
- Restraint: no confetti, red full-screen error, invented cause, or focus jump.
- Non-negotiables: original first response persists; wrong, hint, illegal, storage remain separate.
- Award risk: cinematic feedback can become slow or patronizing; motion must finish quickly and disappear under reduced motion.

### W3 — Desktop Text / Choice Task

```text
┌ compact context ──────────────────────────────────────────────────┐
│ Question and essential premise                                    │
├───────────────────────────────────────────────────────────────────┤
│ [choice] [choice] [choice]          optional functional diagram* │
│ neutral policy copy                     *only when non-leaking    │
│ [hint]                                              [next]        │
└───────────────────────────────────────────────────────────────────┘
```

- Memorable moment: the prompt reads like a crafted editorial exercise, not a database form.
- Emotional intent: clarity and agency.
- Interaction signature: choices form one coherent response sentence/cluster.
- Visual opportunity: typographic rhythm and, only where valid, a small neutral schema or post-answer reconstruction diagram.
- Restraint: no decorative stock art and no pre-answer illustration that implies the answer.
- Non-negotiables: the advanced-tools rectangle is absent; tools remain in the global drawer.
- Award risk: over-designed choice buttons may obscure selection semantics or keyboard focus.

### W4 — Review / Masked / Negative State

```text
┌ source chip: Due same item / Wrong review / Masked trial ─────────┐
│ exact boundary copy                                               │
├─────────────────────────┬─────────────────────────────────────────┤
│ task visual            │ feedback policy                         │
│                         │ separate answer / hint / system regions │
│                         │ real continuation or exit               │
└─────────────────────────┴─────────────────────────────────────────┘
```

- Memorable moment: the interface remains trustworthy when it cannot or must not reveal an answer.
- Emotional intent: confidence under uncertainty.
- Interaction signature: status changes use language and structure before color.
- Visual opportunity: a restrained provenance ribbon names the real task source.
- Restraint: no fake success, no empty review queue, no masked correctness color.
- Non-negotiables: BR-02, BR-03, BR-07–09, BR-11–12.
- Award risk: a visually beautiful state can accidentally signal correctness; neutral states require contrast testing.

### W5 — Mobile Board Task / S2

```text
┌ top: back · S2 · task count · course/tools ┐
│ Question                                   │
│ square board                               │
│ response instruction                       │
│ hint                         next disabled  │
└────────────────────────────────────────────┘
```

- Memorable moment: one-handed continuity from reading to board without losing the question.
- Emotional intent: calm momentum.
- Interaction signature: compact sticky context, never a large permanent sidebar.
- Visual opportunity: edge-to-edge board framing with safe touch targets.
- Restraint: no desktop rail stack, no horizontal carousel, no tool content in first viewport.
- Non-negotiables: 320px, 375px, 200% reflow, keyboard/switch operation, no horizontal overflow.
- Award risk: an oversized board can push response and feedback below the fold; use viewport-aware sizing with a minimum usable intersection target.

### W6 — Mobile Board Task / S3

```text
┌ top: S3 · same task context ────────────────┐
│ compact board / consequence                 │
│ result type                                 │
│ explanation or reconstruction               │
│ retry / hint / next                         │
└─────────────────────────────────────────────┘
```

- Memorable moment: feedback enters without ejecting the learner from the board context.
- Emotional intent: recognition, not reward spectacle.
- Interaction signature: result region reveals immediately after the board and scrolls only enough to expose its heading when required.
- Visual opportunity: selected move remains visually anchored while explanation appears.
- Restraint: no automatic jump past the board; no motion that hides the original response.
- Non-negotiables: separated live regions, retained first response, reduced motion, clear next action.
- Award risk: automatic scrolling can disorient assistive technology; use focus only when the action contract requires it.

---

## 7. Award Experience Brief

### Experience proposition

“A Go lesson that feels as deliberate as placing one stone: quiet before the move, exact at the moment of consequence, and generous during reconstruction.”

### Signature experience

The signature is not a decorative hero inside the workspace. It is a three-beat learning moment:

1. **Stillness** — the interface removes answer cues and makes the current decision unmistakable.
2. **Placement** — pointer, touch, or keyboard selection has tactile clarity without pretending to be a physical board.
3. **Consequence** — the board and explanation reveal only what the current authority permits, while preserving the learner's first move.

### Audience and value

- Primary: novice learners who need orientation, low ambiguity, and recoverable errors.
- Secondary: returning learners completing due or wrong-answer review.
- Operational: researchers/reviewers need evidence boundaries, but these remain second-layer and do not become the learner's main aesthetic.

### Experience success criteria

- The task and response method are understood before interaction.
- Desktop Question → Board → Response → Feedback → Next is visible without avoidable navigation or scroll at the target reference viewport.
- Mobile preserves semantic order and a usable board without horizontal overflow.
- Learners can distinguish wrong, illegal, hint, masked, and system warning states.
- All existing destinations remain reachable.
- No unverified claim is made about delight, usability, learning, retention, or transfer.

### Award-quality bar

- Distinctive through interaction choreography and material restraint, not novelty controls.
- Coherent across desktop/mobile and S2/S3 rather than polished only in a hero screenshot.
- Accessible states are part of the visual idea, not a compliance layer added later.
- Every visual flourish can be removed without changing scoring/evidence semantics.

---

## 8. Creative Direction

### Direction: “Quiet board, living consequence”

The homepage establishes landscape, wood, growth, and cultural calm. The workspace translates those ideas into concentration:

- **Quiet board:** ivory field, warm wood, ink-like text, generous but controlled whitespace.
- **Living consequence:** subtle state transitions emerge from the selected point and response region.
- **Evidence restraint:** provenance and diagnostic information is accessible, never ornamentalized into pseudo-scientific dashboards.

### Composition

- One max-width shell and one left datum for task context.
- Board tasks: board column + reasoning/action column; both align at the top and bottom where feasible.
- Text tasks: one unified task slab; never a detached lower-right tools card.
- Tools: compact global entry that opens a drawer/popover; not a permanent rectangular occupant.
- S1–S5: compact state locator in the task context; full explanation lives in a dialog/drawer.

### Functional imagery policy

| Situation | Image decision | Reason |
|---|---|---|
| Board task | Board is the visual; do not add an illustration. | A second image competes with the task surface. |
| Text task where a diagram is required to answer | Use a neutral, contract-owned diagram. | It is task content, not decoration. |
| Text task where a diagram would imply the answer | Do not show it in S2; consider an S3 reconstruction diagram. | Prevent answer leakage. |
| S1 lesson talk | Worked-example board or short step sequence allowed. | Instruction, not unseen measurement. |
| Empty / unavailable tools | Use clear copy and action; no decorative mascot required. | Trust is more important than filling space. |

---

## 9. Visual System

### Foundation tokens

| Token role | Candidate | Relationship to current product |
|---|---|---|
| canvas | `#F7F5EF` warm ivory | Moves workspace closer to homepage warmth. |
| surface | `#FFFDF8` | Existing off-white card language. |
| ink | `#102F3B` / `#173326` | Existing deep ink-green/blue family. |
| action | `#244C35` | Existing primary green. |
| sage | `#E4F1E8` | Existing calm orientation state. |
| gold | `#D59A3A` | Existing focus/accent; not correctness. |
| success | `#1F6A3B` + text/icon | Existing outcome family; never color-only. |
| error | `#A94F2D` + text/icon | Existing outcome family; illegal remains separate. |
| warning | `#8A5A15` on pale amber | Storage/system warnings. |
| radius | 10–14px task surfaces | Shared with current UI; no excessive card nesting. |
| shadow | one low-opacity elevation level | Hierarchy without dashboard tiles. |

### Typography

- Learner/task UI: current CJK-capable sans stack for clarity and consistent controls.
- Brand/editorial moments: the existing homepage display treatment may appear in the wordmark or S1 title, not in dense feedback.
- Question: 24–28px desktop, 21–24px mobile; response and feedback remain at least 16px equivalent.
- Use weight, spacing, and rule lines before adding more containers.

### Spacing and alignment

- 8px base rhythm; major task gaps 16/24/32px.
- Desktop board target: 400–440px, constrained by viewport height so response and next remain visible.
- Text task uses the same shell width as board composition, with content measure 58–72 characters.
- Top metadata, question, and task grid share one left edge.
- Collapsed secondary tools render as a compact control in the global header, never a 340px empty card.

### State language

- Neutral: structure + text; no correctness color.
- Correct/wrong: icon + title + explanation + color.
- Illegal: interaction warning near board, not answer feedback styling.
- Hint: separate calm information region.
- Masked: neutral receipt with explicit policy language.
- Storage/system: persistent alert separated from learning result.

---

## 10. High-Fi Mockup Decision

The reviewable high-fi candidate is implemented as a standalone prototype in `wireframes.html` with the following deliberate choices:

- No permanent left navigation in the high-fi task canvas; course navigation is a compact drawer entry. This is a candidate, not a production decision.
- No lower-right “Advanced tools & data” rectangle. A global tools control preserves discoverability without occupying task space.
- Desktop uses a 420px board and a matched response column at the reference viewport.
- Text/choice tasks become a single aligned task slab; functional diagrams are optional and state-controlled.
- S2 and S3 are separate views rather than one screenshot with changed copy.
- Review-only Award Intent annotations sit outside the learner canvas and would not ship.

Status: `REVIEW_CANDIDATE`; human preference, comprehension, and accessibility remain `NOT_TESTED`.

---

## 11. Motion Prototype Contract

The standalone prototype includes a review toggle between S2 and S3. Production motion, if approved, must follow:

| Transition | Candidate motion | Reduced motion | Focus rule |
|---|---|---|---|
| S2 response → S3 feedback | 140–180ms opacity + 6px reveal in response column; board stays fixed | instant | do not move focus automatically for board retry; announce feedback region |
| Correct → Next enabled | button color/contrast transition under 140ms | instant | next remains in DOM and becomes enabled; no forced focus |
| Wrong → Retry | consequence marker appears with feedback | instant | board cursor remains at prior logical point or approved retry start |
| Open course/tools drawer | 160ms opacity/translate, no background parallax | instant | focus moves to drawer heading/first action; return focus on close |
| Mobile feedback reveal | minimal scroll only if feedback heading is fully outside viewport | no animated scroll | screen-reader announcement does not depend on visual scrolling |

No confetti, bouncing stones, autoplay tutorial motion, or continuous ambient animation.

---

## 12. Existing DOM / CSS / JS Reuse Analysis

| Layer | Reuse | Candidate delta if approved |
|---|---|---|
| DOM | Keep all existing IDs, live regions, dialogs, inputs, and button/link targets. | Reorder wrappers and presentation containers only where semantic reading order remains correct. |
| Board | Reuse current renderer, coordinates, occupied-state handling, cursor, keyboard, and click handlers. | Presentation sizing and surrounding frame only. |
| State | Reuse existing learner state, scheduler, exposures, missed queue, and external modes. | No second UI state machine; derive visible presentation from current state. |
| Feedback | Reuse `feedback`, hint, interaction, and system-status regions. | Align their placement and visual language; preserve separation. |
| Navigation | Reuse unit/lesson handlers and due/wrong buttons. | Present through compact drawer/conditional actions without changing selection semantics. |
| Tools | Reuse current `tools-menu`, SGF dialogs, settings, exports, and destinations. | Remove duplicate workspace disclosure from the task grid; retain one discoverable global entry. |
| CSS | Reuse color family, type stack, focus treatment, breakpoints, and reduced-motion rule. | Consolidate workspace tokens, shared datum, text-task layout, and viewport-aware board sizing. |
| Tests | Reuse complete browser flow, 320/375/200%, keyboard, evaluation masking, exports, and link checks. | Add no-orphan-tools, text-task alignment, S2/S3 geometry, and all-controls-reachable assertions. |

---

## 13. Implementation Delta — not yet authorized

If approved, the minimum production delta would be:

1. Remove the duplicate lower workspace `進階工具與資料` presentation while preserving the topbar/sidebar tools entry and every nested action.
2. Normalize context/question/task alignment under one content shell.
3. Give text/choice tasks a full-width unified response composition rather than a narrow centered column plus detached aside.
4. Refine board sizing with viewport-height constraints so response/feedback/next remain visible at the target desktop viewport.
5. Introduce explicit presentation variants for S2, S3, masked, review, and text task without creating new learner state.
6. Add state-safe motion classes and reduced-motion equivalents.
7. Extend tests and refreeze the formal teaching candidate through the deterministic verifier.

No production learner-facing file is modified by this design package.

---

## 14. Frontend Craft Review

### Review gate

| Dimension | Acceptance | Current status |
|---|---|---|
| Semantic pipeline | DOM/read order is Location → Question → Board/visual → Response → Feedback → Next. | Prototype `PASS`; production `NOT_TESTED` |
| Alignment | Context, question, and task shell share datums; no orphaned tool rectangle. | Prototype `PASS`; production v62 text task `FAIL` |
| Functional preservation | Every preservation-map entry is reachable and correctly scoped. | Registry `PASS`; prototype links illustrative; production change `NOT_TESTED` |
| S2 leakage | No answer-revealing copy, marker, diagram, or color before valid first response. | Prototype `PASS`; production regression required |
| S3 continuity | First response remains visible/traceable while feedback and retry appear. | Prototype `PASS`; production regression required |
| Negative states | Wrong, illegal, hint, masked, storage, and unavailable are distinguishable without color alone. | Prototype samples `PASS`; complete production set `NOT_TESTED` |
| Desktop viewport | At 1440×900, question, complete board, response, feedback/next target remain available without avoidable navigation. | Prototype target `PASS`; human `NOT_TESTED` |
| Mobile/reflow | 320px, 375px, and 200% can complete core flow without horizontal overflow. | Prototype CSS review `PASS`; browser automation `NOT_TESTED` |
| Keyboard/focus | Logical Tab order, visible focus, board roving tabindex, drawer return focus. | Visual prototype focus `PARTIAL`; board behavior not implemented in prototype |
| Motion | State transition is calm, under 180ms, and eliminated under reduced motion. | Prototype `PASS`; assistive-tech human check `NOT_TESTED` |
| Brand continuity | Shares ink, ivory, green, gold, radii, and material warmth without copying homepage density. | Prototype `PASS`; human brand review `NOT_TESTED` |
| Performance | No required bitmap illustration or heavy runtime added to core task. | Prototype `PASS` |

### Negative tests required before production acceptance

- Pre-answer DOM and accessible tree do not contain accepted answer, correctness, takeaway, original move, or solution tree.
- Retry does not mutate stored first response.
- Wrong + hint remain visible in separate regions.
- Correct hides/disables hint and leaves one primary next action.
- Illegal remains an interaction warning and does not create wrong-answer evidence.
- Storage warning does not overwrite answer feedback.
- Masked mode exposes no correctness signal in copy, class, icon, accessible name, or board delta.
- No-due/no-wrong creates no fake entry or placeholder task.
- Text task has no detached lower-right disclosure or unexplained empty column.
- Every preserved control and href remains reachable on desktop and mobile.
- Keyboard, 320px, 375px, and 200% reflow complete the flow with no horizontal overflow.

---

## 15. Candidate / Refreeze Impact

- `index.html`, `styles.css`, and `app.js` are critical candidate assets.
- Reviewing this isolated prototype does not change the current candidate or historical events.
- Production adoption requires a new candidate ID/version and deterministic fingerprint from `formal-teaching-candidate.cjs`; it must be synchronized with `teaching-gate.json`, current-truth notes, examples, workflows, and tests.
- Human receipts from candidate `2026-10-01-j` must not be silently applied to a new learner-facing candidate.
- Formal teaching/evaluation remains `BLOCKED`; human usability/accessibility remains `NOT_TESTED`; learning effect remains `NOT_MEASURED`.

---

## 16. Rollback

If implementation is approved and later fails functional, evidence, accessibility, or layout acceptance:

1. Revert only the approved workspace presentation delta and related cache/version references.
2. Restore the prior candidate presentation without rewriting v62 or later historical event records.
3. Refreeze again through the deterministic process; do not manually reuse a prior fingerprint.
4. Keep all newly collected events tied to the UI/candidate version under which they occurred.
5. Record the failed acceptance condition in `UI_UX_AUDIT.md`.

---

## 17. Acceptance and Unverified Items

### Design package acceptance

- Business Rules Registry: `PASS`
- Sitemap / IA: `PASS`
- Five Core User Flows: `PASS`
- S1–S5 and negative-state matrix: `PASS`
- Six wireframes with Award Intent: `PASS`
- Award Experience Brief: `PASS`
- Creative Direction: `PASS`
- Visual System: `PASS`
- Reviewable high-fi/motion prototype: `PASS` — Edge verified 6 views/6 Award Intents, desktop, text task, 375px, 320px, and 200% reflow
- Production implementation approval: `BLOCKED` until explicit user approval after review

### Unverified

- Target novice comprehension/usability: `NOT_TESTED`
- Human screen-reader/accessibility: `NOT_TESTED`
- Formal content review: `BLOCKED` / awaiting external receipts
- Formal evaluation validity: `BLOCKED`
- Learning effect, retention, transfer, generalization: `NOT_MEASURED`
- External-link HTTP availability: `NOT_TESTED`
