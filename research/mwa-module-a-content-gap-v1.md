# MWA Module A Content Gap Review v1

狀態：`SOURCE_VERIFIED / TEACHING_CANDIDATE_SCOPING`  
日期：2026-10-01  
用途：把 Malaysia Weiqi Association（MWA）Module A 當成外部教材線索，核對悟之一手目前的內容機制缺口；**不把原教材、原圖或原題直接搬入公開 repo**。

## 1. Research question

MWA Module A 是否暴露出目前悟之一手在「初學者 progression」中的真實機制缺口，而不是只有章節名稱或術語沒有一一對應？

決策用途：
- 找出會造成初學者錯誤泛化的內容斷層；
- 找出可用既有 rules engine 驗證的 Advanced Teaching Candidate；
- 排除其實已由 current runtime／content 涵蓋的假缺口；
- 不因外部教材出現某個名詞就新增 KC、scheduler、formal evaluation family。

## 2. Source record

- Source: Malaysia Weiqi Association, *Syllabus & Study Pack — Module A*
- Author note: Ho Hock Doong, 30 January 2009
- Source role: documentary / curriculum discovery source
- Access route: user-supplied PDF in the project conversation
- Rules context: source states that the material follows Japanese Rules
- Redistribution boundary: source states “Materials here are for non-commercial use only.”
- Image boundary: author notes identify some third-party picture credits and also state that other pictures came from the internet at large.
- Public-repo decision: **do not redistribute source pages, diagrams, screenshots, or copied problem positions.** Only preserve short provenance notes, concept-level summaries, and independently created synthetic positions.

This source can support “the source teaches this concept”, but cannot by itself prove that the concept is the best teaching sequence, that the terminology maps one-to-one across languages, or that adding it improves learner retention／transfer.

## 3. Coverage audit

| MWA concept | Current 悟之一手 coverage | v1 decision |
|---|---|---|
| Liberties / capture / escape | Core Unit 1 + rules-backed items | COVERED |
| Connecting / cutting | Core Unit 2 direct-string model | PARTIAL: missing explicit string-vs-functional-connection boundary |
| Double Atari | Advanced Teaching Candidate + comparable framework | COVERED |
| Ladder / Net / Snapback | Advanced choice + multi-step practice | COVERED |
| Throw-In | Snapback already teaches sacrificial insertion mechanism, but cross-context use is not explicit | PARTIAL: transfer candidate |
| Pushing / Crawling | Direction / thickness / atari-direction overlap exists | DEFER: no current bottleneck |
| Capturing race: outside/shared liberties | Advanced semeai concept + multi-step sequence | COVERED |
| Capturing race: one eye / no eye | eye shape exists elsewhere, but no explicit semeai mechanism contrast | PARTIAL: bounded mechanism candidate |
| Capturing race: increasing liberties | escape / liberty increase exists in Unit 1, but not contrasted inside semeai | PARTIAL: bounded mechanism candidate |
| How to end a game | live-game runtime already supports two passes → dead-stone confirmation → Chinese area scoring | COVERED; source procedure is not copied because rules context differs |
| Endgame tactics / Monkey Jump | general endgame track exists; named edge tesuji not yet central | DEFER |
| Ranking / handicap / etiquette / equipment | not core learning-loop content | DEFER to optional newcomer reference |

## 4. Highest-value correction found

### 4.1 Core Unit 2: string identity ≠ functional connection

Current rules truth:
- orthogonally adjacent same-color stones form one string;
- diagonal stones are not one string.

Potential learner overgeneralization:
- “not one string” → “no connection value / easy to cut”.

Teaching correction:
- keep string identity as the scored Core construct;
- explicitly state that non-string stones can still have a functional connection relationship;
- do **not** promote tiger mouth / bamboo joint / knight move etc. into a new taxonomy yet.

### 4.2 Semeai: replace proverb rule with liberty-structure mechanism

Do not promote “one eye beats no eye” into a universal scoring rule.

Teaching candidate:
- eye shape, outside liberties, shared liberties, move order, and liberty-increasing moves can change the effective race;
- validate only bounded synthetic positions;
- include a negative case where one eye does **not** automatically imply a winning race.

### 4.3 Throw-in: mechanism transfer, not name memorization

Concept anchor:
> intentional sacrificial insertion whose value depends on changing the next board state: liberties, eye shape, or capture order.

The existing snapback content already instantiates this mechanism. New work should test cross-context transfer (false-eye destruction / semeai liberty change) and include a negative case where the sacrifice changes nothing useful.

Term mapping remains research-only:
- English `throw-in`
- Japanese candidate term(s)
- Chinese learner-facing term candidate(s)

No one-to-one mapping is asserted in this record.

## 5. Promotion boundary

For any candidate promoted from this review:

1. use project-generated synthetic positions;
2. rules/scoring validation must be reproducible;
3. include at least one negative case that falsifies a tempting overgeneralization;
4. keep `candidateStatus=teaching_candidate`, `kcStatus=not_promoted` until learner evidence exists;
5. do not update scheduler, T2/T3 formal eligibility, mastery, or learner state;
6. do not use these public candidates as formal unseen holdout;
7. if Core learner-facing text changes, refreeze the formal teaching candidate and invalidate any old human evidence binding.

## 6. Deferred material (Phase E)

Not promoted in this cycle:
- Pushing / Crawling as a dedicated family;
- Monkey Jump / Open Skirt as dedicated endgame families;
- a full named connection-shape taxonomy;
- ranking / handicap / etiquette / equipment as Core content.

Recheck trigger: a concrete learner bottleneck, repeated misconception, or independently validated content need appears. Until then, adding these would increase surface area more than evidence value.

## 7. Evidence boundary

This review is **content governance evidence only**. It does not establish:
- learner comprehension;
- KC validity;
- equal item difficulty;
- retention;
- transfer;
- formal evaluation validity;
- learning effect.
