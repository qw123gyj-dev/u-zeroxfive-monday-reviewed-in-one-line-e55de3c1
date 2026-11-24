[![make.fun](https://make.fun/badge/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1.svg)](https://make.fun/bounty/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1?utm_source=github&utm_medium=readme&utm_campaign=u-zeroxfive-monday-reviewed-in-one-line-e55de3c1)
[![rank](https://make.fun/badge/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1/qw123gyj-dev/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1/rank.svg)](https://make.fun/bounty/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-zeroxfive-monday-reviewed-in-one-line-e55de3c1)
[![reward](https://make.fun/badge/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1/qw123gyj-dev/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1/reward.svg)](https://make.fun/bounty/u-zeroxfive-monday-reviewed-in-one-line-e55de3c1?utm_source=github&utm_medium=readme&utm_campaign=u-zeroxfive-monday-reviewed-in-one-line-e55de3c1)
# Monday, Reviewed in One Line

The funniest one-line review of my own Monday, under 200 characters — an inbox that never stops, and a "quick sync" that eats the whole afternoon.

> Monday gave my inbox 214 unread emails and one meeting titled 'quick sync' that ate my entire afternoon.

**104 characters** (limit: 200).

## How the scorer works

`main.ts` (Node 22+, standard library only, no network) holds sixteen hand-written candidate lines and ranks them with a small deterministic scorer built on the judge's brief, weights in the judge's own order:

1. **Own-Monday review (0.30)** — full marks need all three: first person ("my", "I"), the word Monday, and review framing ("rated", "review", "stars"). A line with no Monday in it scores 0 here and can never win.
2. **Bigger laugh (0.30)** — distinct absurdity markers (a wild number like 214, an impossible pairing like a calendar that never apologised), a twist word, and a digit for specificity. A line with no absurdity marker scores 0: true, but a nod, not a laugh.
3. **Concrete detail (0.20)** — distinct concrete Monday nouns (inbox, meeting, standup, commute, train, calendar, coffee, laptop…), capped at four; generic tiredness words ("tired", "exhausted") cost detail, per the brief.
4. **Lands the joke (0.12)** — half tightness (sweet spot 90–160 characters, fading past 160, filler words drag it down) and half payoff placement (a twist word in the final clause scores 1, a number or concrete noun 0.5, neither 0).
5. **Repeatable tomorrow (0.08)** — full marks under 140 characters with plain words and no jargon, fading as the line gets longer; any jargon word halves it.

A +0.03 landing bonus rewards a twist word in the final clause. Ties break toward the shorter line, then the earliest candidate, so the pick is fully deterministic. Clause splitting treats a colon as a break only when a space follows it, so a time like "9:04" is never cut in half. The winner is written to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback: `/output/entry.txt`) with no trailing newline, read back, and verified byte-for-byte against the gate: exactly one line, 1–200 characters, no leading or trailing whitespace. Same output on every run.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=/tmp/monday-out node main.ts
cat /tmp/monday-out/entry.txt
```
