# Third-Party Notices

## User-supplied homepage mockup — decorative artwork

The original homepage assets under `assets/homepage/` were adapted from the user-supplied
「悟之一手：從氣與提子開始」mockup on 2026-10-01, as requested for website reproduction.
They are decorative presentation assets, not curriculum items, board-state data,
rules, scoring answers, or independent evaluation evidence. Original artwork
retains its own rights; the repository's MIT code license does not establish the
original artwork's licensing.

## Generated homepage card illustrations v59

`assets/homepage/philosophy-growth-v59.webp` and
`assets/homepage/philosophy-capability-v59.webp` were newly generated with OpenAI's
built-in image generation on 2026-10-01, as requested for the taller homepage
cards. They depict misty sage-green mountains and a stack of three charcoal
stones with leaves. Web encoding preserves the transparent background and
dimensions. They are decorative metaphors, not validated board positions,
curriculum content, skill measurements, or evidence of learning.

## bood/go-test — source-case oracle for 大豬嘴 / J Group

This project uses factual board-state and expected-move information reconstructed from the following MIT-licensed regression source as a bounded external oracle:

- Repository: https://github.com/bood/go-test
- Commit inspected: `2f3db241dc26a5ab59c86cf1293b3b005283c288`
- Files used for research/reconstruction: `config.yml`, `sgf/大猪嘴.sgf`
- Upstream copyright: Copyright (c) 2018 Bood Qian
- Upstream license: MIT License

The project does **not** claim that the reconstructed source case is the canonical geometry for every 大豬嘴 / J Group position. The source is used only to support a versioned, exact-position first-move oracle.
