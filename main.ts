// Monday, Reviewed in One Line
// ==============================
//
// make.fun bounty: u-zeroxfive-monday-reviewed-in-one-line-e55de3c1
// "Monday, Reviewed in One Line" — write the funniest one-line review of
// your own Monday, under 200 characters, and nothing else.
//
// The program below holds sixteen hand-written candidate lines and ranks
// them with a small deterministic scorer built on the judge's brief, in
// the judge's own order:
//
//   1. Is a one-line review of the entrant's own Monday, not a joke about
//      something else (a Monday review that lands a laugh beats a funnier
//      line about anything else).
//   2. Gets the bigger laugh: the line a reader would laugh at rather
//      than merely nod at.
//   3. Names a concrete detail of the Monday — a meeting, a commute, an
//      inbox — over generic tiredness.
//   4. Lands the joke inside the line with no wasted words, so the turn
//      arrives before the reader gives up.
//   5. Is the line a reader would repeat to a coworker the next morning.
//
// A line may be deadpan, absurd or quietly furious, as long as it reads as
// a review of a real Monday. Length for its own sake does not count.
//
// Rules of this program:
//   - Node 22+, standard library only, no network, fully deterministic.
//   - The winner is written to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback:
//     /output/entry.txt) with no trailing newline, read back, and verified
//     byte-for-byte against the gate: exactly one line, 1-200 characters,
//     no leading or trailing whitespace, not only whitespace.
//   - Ties break toward the shorter line, then the earliest candidate, so
//     the pick is the same on every run.
//
// How the scorer is built:
//   Each criterion is a small function that reads only the candidate text
//   and counts concrete, named markers — first-person words, Monday words,
//   absurd numbers, concrete Monday nouns, twist words in the final clause.
//   Nothing is random, nothing reads the clock, nothing reads the network,
//   and iteration order is the fixed order of the candidate array, so two
//   runs on the same machine always produce the same file.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Limits and output
// ---------------------------------------------------------------------------

/** The gate: an entry must be 1 to 200 characters, one line, no padding. */
const MIN_CHARS = 1;
const MAX_CHARS = 200;

/** Where the entry goes. The grader sets MAKEFUN_OUTPUT_DIR; /output is
 *  the fallback the competition rules name. */
const OUTPUT_DIR =
  process.env.MAKEFUN_OUTPUT_DIR && process.env.MAKEFUN_OUTPUT_DIR.length > 0
    ? process.env.MAKEFUN_OUTPUT_DIR
    : "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------
//
// Sixteen one-line reviews of a Monday, each hand-written for this bounty.
// Every line is first person, names Monday (or the Monday morning it
// belongs to), and carries one concrete Monday detail — an inbox, a
// standup, a commute, a calendar invite, a coffee machine — with the joke
// landing in the final clause. Tones rotate: deadpan, absurd, quietly
// furious. No line addresses the judge, quotes another entry, or leans on
// a meme the reader would need explained; each joke is self-contained so
// it survives being read aloud to a coworker.
//
// Character counts are checked by the program at run time; every line was
// drafted to sit well inside the 200-character gate.

interface Candidate {
  /** The review line itself, exactly as it would be submitted. */
  text: string;
}

const CANDIDATES: Candidate[] = [
  {
    text: "Monday gave my inbox 214 unread emails and one meeting titled 'quick sync' that ate my entire afternoon.",
  },
  {
    text: "My Monday standup lasted nine minutes; the follow-up meeting about the standup lasted two hours.",
  },
  {
    text: "I rated my Monday one star: the coffee was cold, the Wi-Fi left at noon, and my calendar never apologised.",
  },
  {
    text: "Monday's commute took 47 minutes, and the only thing on time was the email saying my train was delayed.",
  },
  {
    text: "My alarm went off, my laptop updated, my boss scheduled a meeting, and somehow it was still only 9:04 on Monday.",
  },
  {
    text: "I opened my inbox on Monday and found 38 emails, 37 of them starting with 'just circling back'.",
  },
  {
    text: "Monday asked for one quick call; it brought four people, no agenda, and a slide deck titled 'Final_v7_FINAL'.",
  },
  {
    text: "My Monday review: the printer jammed, the lift broke, and the office plant looked more productive than me.",
  },
  {
    text: "I survived Monday by muting three group chats, declining two meetings, and pretending the fourth was a typo.",
  },
  {
    text: "Monday's highlight was the 4 p.m. meeting being cancelled; its lowlight was the 4:05 p.m. email rescheduling it.",
  },
  {
    text: "My Monday commute: one delayed train, two missed connections, and a stranger eating a full breakfast beside me.",
  },
  {
    text: "I gave Monday two stars because the coffee machine worked; everything after 9 a.m. filed a complaint.",
  },
  {
    text: "Monday sent me a calendar invite for 7 a.m. titled 'brainstorm', which is just a meeting with worse lighting.",
  },
  {
    text: "My laptop crashed twice before lunch on Monday, and IT replied with a ticket number and a prayer emoji.",
  },
  {
    text: "Monday's standup: I said 'no blockers' while my inbox quietly added seventeen.",
  },
  {
    text: "I reviewed my Monday the way it reviewed me: one star, no comment, and a meeting booked for Tuesday.",
  },
];

// ---------------------------------------------------------------------------
// Marker lists
// ---------------------------------------------------------------------------
//
// The scorer never guesses at funniness in the abstract. It counts named
// markers in the text, grouped by what the judge weighs. Each list below
// is the vocabulary the sixteen candidates were written from, so a marker
// only counts when the line really carries it.

/** First-person words: the review must be of the entrant's OWN Monday. */
const FIRST_PERSON = ["my", "i", "me", "i'm", "i've", "we", "our"];

/** Monday words: the day itself must be named, not implied. */
const MONDAY_WORDS = ["monday", "monday's", "mondays"];

/** Review framing: the line must read as a review, not a diary entry. */
const REVIEW_WORDS = [
  "rated",
  "review",
  "reviewed",
  "stars",
  "star",
  "highlight",
  "lowlight",
  "survived",
  "gave",
];

/** Concrete Monday nouns: meetings, commutes, inboxes — the judge's own
 *  examples — plus the small objects a real Monday is made of. A line
 *  that names one of these beats a line that only says it is tired. */
const CONCRETE_NOUNS = [
  "inbox",
  "meeting",
  "standup",
  "commute",
  "train",
  "calendar",
  "coffee",
  "laptop",
  "printer",
  "lift",
  "wi-fi",
  "slide deck",
  "ticket",
  "alarm",
  "email",
  "emails",
  "group chat",
  "group chats",
  "agenda",
  "invite",
  "plant",
  "breakfast",
  "connections",
];

/** Absurdity markers: specific numbers, impossible pairings, and the
 *  small exaggerations that make a reader laugh instead of nod. */
const ABSURD_WORDS = [
  "214",
  "47",
  "9:04",
  "4:05",
  "final_v7_final",
  "prayer emoji",
  "never apologised",
  "filed a complaint",
  "more productive than me",
  "pretending",
  "typo",
  "worse lighting",
  "quietly",
  "somehow",
  "still only",
  "entire afternoon",
  "full breakfast",
  "two hours",
  "two stars",
  "one star",
];

/** Twist words: the turn the joke lands on. When one of these sits in the
 *  final clause, the punchline arrives at the end of the line, where the
 *  judge's fourth criterion wants it. */
const TWIST_WORDS = [
  "somehow",
  "quietly",
  "never",
  "still",
  "pretending",
  "typo",
  "worse lighting",
  "filed a complaint",
  "more productive than me",
  "rescheduling it",
  "prayer emoji",
  "booked for tuesday",
  "no comment",
  "ate my entire afternoon",
  "two hours",
];

/** Filler words: wasted words that slow the line down. A line carrying
 *  many of these scores lower on tightness, the judge's fourth criterion. */
const FILLER_WORDS = [
  "very",
  "really",
  "just",
  "actually",
  "basically",
  "literally",
  "quite",
  "somewhat",
  "rather",
];

/** Generic tiredness words: the judge explicitly prefers a concrete
 *  detail over generic tiredness, so these count against a line. */
const GENERIC_TIRED_WORDS = [
  "tired",
  "exhausted",
  "sleepy",
  "drained",
  "so tired",
  "long day",
  "rough day",
  "bad day",
];

/** Jargon a coworker would not repeat: repeatability, the judge's fifth
 *  criterion, needs plain words a reader can say out loud next morning. */
const JARGON_WORDS = ["synergy", "bandwidth", "leverage", "paradigm", "kpi", "okr"];

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Character count in Unicode code points, so an emoji counts as one. */
function charCount(text: string): number {
  return [...text].length;
}

/** Lower-cased text, used for every marker lookup so case never matters. */
function lower(text: string): string {
  return text.toLowerCase();
}

/**
 * Count how many entries of a marker list appear in the text as whole
 * words (or whole phrases). A marker counts once even if it repeats, so a
 * line cannot farm points by saying "meeting meeting meeting".
 */
function countMarkers(text: string, markers: string[]): number {
  const hay = ` ${lower(text)} `;
  let found = 0;
  for (const marker of markers) {
    // Escape regex specials, then require a non-letter on both sides so
    // "star" does not match inside "start" and "i" does not match inside
    // "inbox".
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`, "i");
    if (pattern.test(hay)) found += 1;
  }
  return found;
}

/** True when the text contains at least one marker from the list. */
function hasMarker(text: string, markers: string[]): boolean {
  return countMarkers(text, markers) > 0;
}

/**
 * Split a line into clauses on the punctuation that ends a thought:
 * semicolons, colons, commas followed by a conjunction, and em-dash-like
 * breaks. The final clause is where the punchline must sit.
 * A colon only splits when a space follows it, so a time like "9:04" is
 * never cut in half: splitting there once made the final clause of the
 * 9:04 line read "04 on Monday." and hid its twist word from the scorer.
 */
function splitClauses(text: string): string[] {
  return text
    .split(/;|:(?=\s)/)
    .flatMap((part) => part.split(/,\s+(and|but|while|which)\s+/i))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** The final clause of the line, where the joke should land. */
function finalClause(text: string): string {
  const clauses = splitClauses(text);
  return clauses.length > 0 ? clauses[clauses.length - 1] : text;
}

/** True when the text contains a digit: a specific number is a concrete,
 *  funny detail ("214 unread emails" beats "lots of unread emails"). */
function hasNumber(text: string): boolean {
  return /[0-9]/.test(text);
}

/** Clamp a value into the 0..1 range. */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

// ---------------------------------------------------------------------------
// The scorer
// ---------------------------------------------------------------------------
//
// Five criterion scores, one per item of the judge's brief, in the judge's
// own order. The weights follow that order too: the first criterion is
// worth the most, because a line that is not a review of the entrant's own
// Monday loses to any Monday review that lands a laugh, however funny it
// is about something else. Weights sum to 1.00 before the landing bonus.
//
//   1. own-Monday review ......... 0.30
//   2. bigger laugh .............. 0.30
//   3. concrete detail ........... 0.20
//   4. lands the joke, no waste .. 0.12
//   5. repeatable tomorrow ....... 0.08
//
// A +0.03 landing bonus rewards a twist word in the final clause, capped
// so the total never exceeds 1.03. Every score is a pure function of the
// candidate text: no randomness, no clock, no network.

const WEIGHTS = {
  ownMonday: 0.3,
  laugh: 0.3,
  concrete: 0.2,
  landing: 0.12,
  repeatable: 0.08,
} as const;

const LANDING_BONUS = 0.03;

interface Scores {
  ownMonday: number;
  laugh: number;
  concrete: number;
  landing: number;
  repeatable: number;
  bonus: number;
  total: number;
}

/**
 * Criterion 1 — a one-line review of the entrant's own Monday.
 * Full marks need all three: first person (it is MY Monday), the word
 * Monday (it is MONDAY), and review framing (it is a REVIEW). A line
 * missing Monday entirely scores 0 here and can never win, however funny
 * it is: the judge's first criterion is a gate, not a preference.
 */
function scoreOwnMonday(text: string): number {
  const firstPerson = hasMarker(text, FIRST_PERSON) ? 1 : 0;
  const monday = hasMarker(text, MONDAY_WORDS) ? 1 : 0;
  const review = hasMarker(text, REVIEW_WORDS) ? 1 : 0;
  if (monday === 0) return 0;
  // First person and Monday are the load-bearing parts; review framing is
  // the third leg that turns a complaint into a review.
  return clamp01(0.4 * firstPerson + 0.35 * monday + 0.25 * review);
}

/**
 * Criterion 2 — the bigger laugh.
 * A laugh comes from a specific absurdity, not from saying the day was
 * bad. Points for: distinct absurdity markers (a wild number, an
 * impossible pairing, a quiet exaggeration), a digit (specificity is
 * funny: "214 emails" lands harder than "so many emails"), and a twist
 * word anywhere in the line. A line with no absurdity marker at all
 * scores 0 here: it may be true, but it is a nod, not a laugh.
 */
function scoreLaugh(text: string): number {
  const absurd = countMarkers(text, ABSURD_WORDS);
  const twist = countMarkers(text, TWIST_WORDS);
  const number = hasNumber(text) ? 1 : 0;
  if (absurd === 0 && twist === 0) return 0;
  // Two absurdity markers is plenty; a third adds nothing, so the score
  // saturates instead of rewarding a line that piles jokes on jokes.
  const absurdPart = Math.min(absurd, 2) / 2;
  const twistPart = Math.min(twist, 2) / 2;
  return clamp01(0.55 * absurdPart + 0.25 * twistPart + 0.2 * number);
}

/**
 * Criterion 3 — a concrete detail of the Monday over generic tiredness.
 * Points for each distinct concrete Monday noun (meeting, inbox, commute,
 * train, calendar...), capped at four, because a line naming four real
 * things is a scene and a line naming one is a mention. Generic tiredness
 * words cost half a point of detail each: the judge says so explicitly.
 */
function scoreConcrete(text: string): number {
  const nouns = countMarkers(text, CONCRETE_NOUNS);
  const generic = countMarkers(text, GENERIC_TIRED_WORDS);
  const detail = Math.min(nouns, 4) / 4;
  return clamp01(detail - 0.15 * generic);
}

/**
 * Criterion 4 — the joke lands inside the line with no wasted words.
 * Half tightness, half payoff placement. Tightness prefers lines in the
 * 90-160 character sweet spot: long enough for a setup and a turn, short
 * enough that the reader never gives up; lines past 170 characters fade
 * toward 0.5, and filler words drag it down further. Payoff placement is
 * 1 when a twist word sits in the final clause, 0.5 when the final clause
 * carries a number or a concrete noun, and 0 when it carries neither —
 * a joke that ends on throat-clearing never lands.
 */
function scoreLanding(text: string): number {
  const chars = charCount(text);
  let tightness: number;
  if (chars >= 90 && chars <= 160) {
    tightness = 1;
  } else if (chars < 90) {
    // Short is fine, but a very short line has no room for a setup.
    tightness = 0.6 + 0.4 * (chars / 90);
  } else {
    // Over 160 the reader starts to give up; fade to 0.5 at 200.
    tightness = 1 - 0.5 * ((chars - 160) / 40);
  }
  const filler = countMarkers(text, FILLER_WORDS);
  tightness = clamp01(tightness - 0.1 * filler);

  const tail = finalClause(text);
  let payoff: number;
  if (hasMarker(tail, TWIST_WORDS)) {
    payoff = 1;
  } else if (hasNumber(tail) || hasMarker(tail, CONCRETE_NOUNS)) {
    payoff = 0.5;
  } else {
    payoff = 0;
  }
  return clamp01(0.5 * tightness + 0.5 * payoff);
}

/**
 * Criterion 5 — the line a reader would repeat to a coworker tomorrow.
 * Repeatability wants a short, plain, quotable line: full marks under 140
 * characters with no jargon and a twist word to quote; it fades as the
 * line gets longer, and any jargon word halves it, because nobody repeats
 * a line they have to explain first.
 */
function scoreRepeatable(text: string): number {
  const chars = charCount(text);
  const jargon = countMarkers(text, JARGON_WORDS);
  if (jargon > 0) return 0.5 * clamp01(1 - (chars - 100) / 100);
  if (chars <= 140) return 1;
  return clamp01(1 - (chars - 140) / 60);
}

/** Score one candidate on all five criteria, in the judge's order. */
function scoreCandidate(text: string): Scores {
  const ownMonday = scoreOwnMonday(text);
  const laugh = scoreLaugh(text);
  const concrete = scoreConcrete(text);
  const landing = scoreLanding(text);
  const repeatable = scoreRepeatable(text);
  const bonus = hasMarker(finalClause(text), TWIST_WORDS) ? LANDING_BONUS : 0;
  const total =
    WEIGHTS.ownMonday * ownMonday +
    WEIGHTS.laugh * laugh +
    WEIGHTS.concrete * concrete +
    WEIGHTS.landing * landing +
    WEIGHTS.repeatable * repeatable +
    bonus;
  return { ownMonday, laugh, concrete, landing, repeatable, bonus, total };
}

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------
//
// The sealed scorer admits only UTF-8 text of 1 to 200 characters, not
// only whitespace. This program applies the same gate to every candidate
// before it can win, and then again to the winner after it is read back
// from disk, so a bad line can never be submitted by accident.

/**
 * Check a line against the gate. Returns a list of failures; an empty
 * list means the line is valid. The checks, in order:
 *   - 1 to 200 characters (Unicode code points, not bytes, not UTF-16
 *     units: an emoji is one character either way the reader counts it);
 *   - exactly one line (no newline, no carriage return);
 *   - no leading or trailing whitespace (the file must hold the line and
 *     nothing else);
 *   - not only whitespace;
 *   - valid UTF-8 (enforced by re-encoding the string and comparing).
 */
function gateFailures(text: string): string[] {
  const failures: string[] = [];
  const chars = charCount(text);
  if (chars < MIN_CHARS) failures.push(`too short: ${chars} characters`);
  if (chars > MAX_CHARS) failures.push(`too long: ${chars} characters`);
  if (text.includes("\n") || text.includes("\r")) {
    failures.push("more than one line");
  }
  if (text !== text.trim()) failures.push("leading or trailing whitespace");
  if (text.trim().length === 0) failures.push("only whitespace");
  const roundTrip = Buffer.from(text, "utf8").toString("utf8");
  if (roundTrip !== text) failures.push("not valid UTF-8 text");
  return failures;
}

// ---------------------------------------------------------------------------
// Ranking and output
// ---------------------------------------------------------------------------

interface RankedCandidate {
  index: number;
  text: string;
  chars: number;
  scores: Scores;
}

/**
 * Rank all candidates. The winner is the highest total score; ties break
 * toward the shorter line, then the earliest candidate, so the pick is
 * fully deterministic. Candidates that fail the gate are reported and
 * excluded — they can never win, however high they score.
 */
function rankCandidates(): { ranked: RankedCandidate[]; rejected: string[] } {
  const ranked: RankedCandidate[] = [];
  const rejected: string[] = [];
  for (let i = 0; i < CANDIDATES.length; i += 1) {
    const candidate = CANDIDATES[i];
    const failures = gateFailures(candidate.text);
    if (failures.length > 0) {
      rejected.push(`candidate ${i + 1}: ${failures.join("; ")}`);
      continue;
    }
    ranked.push({
      index: i,
      text: candidate.text,
      chars: charCount(candidate.text),
      scores: scoreCandidate(candidate.text),
    });
  }
  ranked.sort((a, b) => {
    if (b.scores.total !== a.scores.total) return b.scores.total - a.scores.total;
    if (a.chars !== b.chars) return a.chars - b.chars;
    return a.index - b.index;
  });
  return { ranked, rejected };
}

/** Format one score to three decimals for the report. */
function fmt(value: number): string {
  return value.toFixed(3);
}

/** Print the full ranking table to stdout, so a run shows its work. */
function printReport(ranked: RankedCandidate[], rejected: string[]): void {
  console.log("Monday, Reviewed in One Line — candidate ranking");
  console.log("==================================================");
  console.log("Weights (judge's order): own-Monday 0.30, laugh 0.30,");
  console.log("concrete 0.20, landing 0.12, repeatable 0.08, +0.03 bonus");
  console.log("");
  for (const entry of ranked) {
    const s = entry.scores;
    console.log(
      `#${entry.index + 1} [${fmt(s.total)}] ${entry.chars} chars ` +
        `(own ${fmt(s.ownMonday)} laugh ${fmt(s.laugh)} ` +
        `concrete ${fmt(s.concrete)} landing ${fmt(s.landing)} ` +
        `repeat ${fmt(s.repeatable)} bonus ${fmt(s.bonus)})`,
    );
    console.log(`   ${entry.text}`);
  }
  if (rejected.length > 0) {
    console.log("");
    console.log("Rejected by the gate:");
    for (const line of rejected) console.log(`   ${line}`);
  }
  console.log("");
}

/**
 * Write the winner to entry.txt with no trailing newline, read it back,
 * and verify it byte-for-byte against the gate. A mismatch is a hard
 * failure: the program exits non-zero and writes nothing usable.
 */
function writeAndVerify(winner: RankedCandidate): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, winner.text, "utf8");
  const readBack = readFileSync(OUTPUT_FILE, "utf8");
  if (readBack !== winner.text) {
    throw new Error("read-back mismatch: entry.txt does not match the winner");
  }
  const failures = gateFailures(readBack);
  if (failures.length > 0) {
    throw new Error(`winner fails the gate: ${failures.join("; ")}`);
  }
  console.log(`Winner: candidate #${winner.index + 1}, ${winner.chars} characters`);
  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(winner.text);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { ranked, rejected } = rankCandidates();
  if (ranked.length === 0) {
    throw new Error("no valid candidate: every line failed the gate");
  }
  printReport(ranked, rejected);
  writeAndVerify(ranked[0]);
}

main();
