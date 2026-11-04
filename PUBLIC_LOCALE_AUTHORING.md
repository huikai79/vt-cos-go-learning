# Locale-specific authoring and narrative contract

Status: EDITORIAL GUIDANCE ONLY; no non-Chinese locale is publishable.
Every learner-facing sentence must be authored against a concrete source item, board state and the audience's existing vocabulary. A literal Chinese→English→other-language translation chain is not acceptable evidence of semantic equivalence.

## Source and semantic anchor
- Source of truth: versioned `GoContent` problem, rules engine, and scorer, not translated copy.
- Preserve player to move, liberties, legal moves, approved answers, hint reveal timing, retry state, item ID, exposure and first response.
- Write a **new local explanation** using the learner's most observable board cue. The order, tone, sentence structure and analogies can differ; an analogy must not change the problem's solvability or reveal new information.
- Contrast four learner states separately: pre-answer (no solution location), after hint (hint already shown), after incorrect answer (no first-answer overwrite), after success (the explanation may disclose why).
- For an unsupported or stale locale, show language availability in that language, rather than a mixed-language lesson presented as complete. This is a versioned blocker, not permission to use machine translation at runtime.

## English — `en` (draft)
- Audience: general Go newcomer aged roughly 16–20; short board-first prompts using "Black to play" / "White to play".
- Use `liberty` for an adjacent empty intersection; explain before assuming the learner knows it. Explain `atari` as "only one liberty left" on first relevant use. A `capture` removes opposing stones after their last liberty is filled.
- Distinguish a correct **move on this teaching task** from a unique optimal move or validated learning.
- Example for the already-public `u1-06`: pre-answer "Black to play. Find White’s last remaining liberty and play there." Before an answer, do **not** say "below" unless the canonical hint has actually been opened. The later result can explain that Black occupied the last liberty and removed White.
- Do not copy internal labels like `qualifiedOpportunity`, `scoring`, `T3` into ordinary lessons.
- Review required: independently verify the authored English against Go board geometry, then seek English-language human proofreading and task comprehension testing.

## Korean — `ko-KR` (not authored)
Write as natural Korean beginner instruction, using locally validated 바둑 teaching terms and an age-appropriate level of politeness. Do not transliterate Chinese technical words mechanically or adopt English/Japanese aliases automatically. Verify every move explanation on the board; review via native Korean teaching materials and speaker.

## Malaysian Malay — `ms-MY` (not authored)
Use the Malay used in Malaysia, not Indonesian sentence patterns; first describe what learners can see on the board. When a Go term lacks an established and verified local equivalent, retain the recognizable game term and briefly explain it in Malay. Check register, spelling and short mobile labels with Malaysian readers.

## Thai — `th-TH` (not authored)
Author fluent Thai instructions, check local Go terminology and Thai line breaking at 320px / 200% zoom. Do not mechanically import Chinese word order or translate proper names without checking a Thai use case. Introduce any borrowed Go term naturally.

## Indonesian — `id-ID` (not authored)
Author in Indonesian for Indonesian beginners. Review independently from Malay even where cognates overlap; check instructions, error states and polite register with native readers.

## German — `de-DE` (not authored)
Use concise German with Go terminology grounded in German-language teaching conventions. Check compounds, inflections, numerals and narrow-screen labels instead of translating Chinese phrases word by word.

## Review record per locale and page
Track: source page/item ID and content version; original intent and current board/scorer facts; localized narrative draft; missing/overdue strings; normal, hint, wrong, retry, success and failure/unknown branches; locale-aware formats and ARIA; Go-specific reviewer; native-language reviewer; reader comprehension outcome; promotion decision/version/rollback.

No external website or association is evidence that the exact sentences above have been reviewed. No locale is released until the full-site review and engineering gates pass.
