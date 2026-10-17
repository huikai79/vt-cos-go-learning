# Public Full-Site Localization Contract (implementation gate)

Status: SPECIFICATION / NOT IMPLEMENTED / NOT RELEASED
Frozen public base: `7f06005d8c887aa52055ef6f6651d2aa64a89d5e`
Branch: `feat/public-full-site-localization`
Scope: Public `huikai79/vt-cos-go-learning` only; never import private Prototype code or assets.

## User acceptance target (2026-10-13)

This is **sitewide language switching**, not a single-item translated pilot. A user selecting a released locale must see all reachable learner-facing content consistently in that locale. Locale must persist across internal navigation, refresh, learning sessions, and direct page links without changing persisted learning-event semantics.

Source locale: `zh-Hant-TW`.
Target locales: `en`, `ko-KR`, `ms-MY`, `th-TH`, `id-ID`, `de-DE`.
A locale is **UNAVAILABLE** until its full-site translation coverage and locale-specific gates pass. Do not show a partly translated locale as complete; do not silently render Chinese/English fallback inside a supposedly localized lesson.

## Page inventory (learner, reviewer, and public support surfaces)

- `index.html`: landing + all Core lessons/items + course catalog + site introduction + learner feedback and export.
- `advanced.html`: all training tracks, game review, hints, stages and dynamic outcomes.
- `classic-shapes.html`: Atlas/catalog and practice, names with provenance caveats, status/progress/error content.
- `live-game.html`: 5/7/9-line board, optional KataGo/provider failure, practice feedback, export and resume.
- `history.html`, `math.html`, `global-go-observatory.html`: complete reading/navigation content, tables, captions, cross-page links and accessible labels.
- `r1-review-start.html`, `r1-review.html`, `lesson-content-review.html`, `formal-teaching-evidence.html`: reviewer-facing interfaces must be inventoried and localized or explicitly labeled unavailable in the target locale; reviewer/export machine keys unchanged.

## Runtime string inventory

Audit *every* visible branch in top-level HTML and JS, including `app.js`, `content.js`, `advanced*.js`, `classic*.js`, `live-game*.js`, `learner-progress.js`, `learning-metrics.js`, `scheduler.js`, `trial.js`, feedback/error helpers, and Markdown/SGF/readable export generators. Capture static labels, lesson demonstrations, prompts, answer options, hint/retry/correct/incorrect, ERROR/FAIL/UNKNOWN, empty and persistence-recovery states, accessibility/ARIA/keyboard names, date/number/plurals and content injected after user actions.

Use shared language-neutral identifiers for items and UI keys; target copy is versioned with source/version/review status. Do not create translated duplicate answer keys, item records, storage stores or scorers. Keep prompt placeholders and dynamic state faithful. Missing/stale string => explicit unavailable indication / locale gate BLOCKED, never silent fallback.

## Language routes and state

- Use stable locale-specific URLs or routable locale query with direct links for every released equivalent page, same-site language switcher and `html lang` matching rendered surface.
- Navigation/deep links continue to user's requested published locale; no language changes based on IP/browser assumptions.
- Do not change user progress, first answer, hints, retry, exposure, item version, evaluation role, scheduler or scoring when switching locale.
- Previously public/exposed items never regain formal unseen eligibility by translation.
- Local storage backup/export/import and public/private Prototype origins/data must remain isolated.

## Validation gates per locale

1. Automated inventory shows 100% reachable learner-facing pages and strings accounted for: approved translation or deliberate gated unavailable surface. For a locale advertised as full-site, no learner-facing page can be gated unavailable.
2. Same canonical board positions, player, answer, acceptable alternatives, bounded scoring, hint timing, reveal timing, first-answer/event/exposure semantics in all languages.
3. Browser tests in Windows Edge/Chrome: direct links, page-to-page navigation, locale change during unanswered/hinted/wrong/retry/completed state, reload, storage failure, ERROR/UNKNOWN, keyboard/ARIA and 320px/mobile/200% zoom.
4. Readable exports localized without modifying machine-readable records or identifiers; date/number/placeholder/plural branches tested.
5. Go term accuracy and teaching-content check independent from machine translation; fluent human language review and target-reader usability/accessibility recorded separately.
6. Rebind frozen presentation asset fingerprint after critical changes; old human receipts are not transferable. Update current-truth, release manifest, version/rollback, CI, secret/license/dependency/VT-COS denylist and human diff.
7. Open Draft PR first. No merge to `main`, Pages deployment or release without explicit approval. Learning-effect outcome stays NOT_MEASURED; formal teaching/evaluation gates stay independently BLOCKED until their own evidence is satisfied.

## Delivery sequencing

1. Inventory and localization framework for **all** public surfaces, using common source data and scoring.
2. Complete English **across the entire website** and independent engineering/Go/human language gates before calling English available.
3. Extend complete-site releases to Korean, Malaysian Malay, Thai, Indonesian and German, with separate reviews and gates.
4. Only after approved public full-site release and explicit user confirmation resume the separate private Prototype work.

## Historical pilot

Draft PR #159 `feat/public-i18n-english-core-pilot-20261012` is **scoped proof only**, superseded as a release path. Passing its `u1-06` CI does not satisfy full-site English acceptance and its presentation strings must not leak into a 'complete English' claim. Reuse any safely verified technique selectively after boundary review; do not merge the pilot wholesale.

## Rollback

Until reviewed: delete/revert this branch only; public `main` unchanged. For any future approved release, roll back the versioned locale bundle and route entry together, preserve event storage and original scoring semantics; never destroy event data to make language switching work.
