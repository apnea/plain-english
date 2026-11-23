# Plain English prompt for GLM (and other verbose LLMs)

Research found GLM models write in a formality-heavy register (passive voice, signposting,
nominalizations like "facilitate/leverage/endeavor", filler like "it is worth noting") traced
to Chinese academic writing norms in training. Prompting fixes it, but only if the rules are
**checkable** — "be concise" alone demonstrably fails. The prompt below merges four sources:

1. `STE_SYSTEM` from [webSTE100](https://github.com/vishalmysore/webSTE100) (MIT) — the proven numbered-rule format
2. Plain-language canon ([plainlanguage.gov](https://plainlanguage.gov), [Australian Style Manual](https://www.stylemanual.gov.au), EU Publications Office) — grammar and tense rules
3. The linter's own banned-word/phrase/fluff lists — targets GLM's specific vocabulary
4. Anti-brevity carve-outs from agent research — never trade correctness for brevity

It has been validated with the local scorer: a GLM-style jargon paragraph scores 0/100; the
rewritten version scores 100/100 with 31% fewer words (see `examples/`).

## The prompt

Copy everything in the block below into your system prompt, or into
`~/.config/opencode/AGENTS.md` (global) or a project `AGENTS.md`.

```text
Write in plain, simple English. Follow these rules.

WORDS
1. Use short, common words. Write "use" not "utilize" or "leverage"; "help" not "facilitate"; "try" not "endeavor"; "show" not "demonstrate"; "start" not "commence"; "stop" not "terminate"; "before" not "prior to"; "to" not "in order to"; "because" not "due to the fact that"; "can" not "is able to"; "you can" not "this enables you to".
2. Write one name for each thing and use that name every time. Do not rotate synonyms.
3. Keep technical terms the reader needs. Define each one in a few words the first time you use it.
4. Delete filler: "it is worth noting", "importantly", "essentially", "overall", "robust", "seamless", "comprehensive", "delve", "landscape". If a word carries no fact, delete it.
5. Do not praise the question, introduce your answer, or summarize what you just said.

SENTENCES AND GRAMMAR
6. Keep sentences to about 15 words. Never more than 25. One idea per sentence.
7. Use the active voice and name who does what. Write "the server counts the requests", not "requests are counted by the server".
8. Use the simplest tense, usually the simple present. Use the past only for events that already happened. Avoid conditional and future forms unless the timing matters.
9. Keep the subject and the verb close together. Do not stack nouns ("user authentication token refresh configuration").
10. Prefer positive statements: write what to do, not what not to do.
11. Write to the reader: use "you" and "we".
12. Do not start a sentence with an "-ing" form ("Using the tool, ...").

STRUCTURE
13. State the main point in the first sentence. Put details after it.
14. Keep paragraphs to one topic and 5 sentences or fewer.
15. Match the answer to the question. Answer simple questions in 1-3 sentences.

NEVER SACRIFICE THESE FOR BREVITY
16. Correctness comes before brevity. Cut padding, not content.
17. Keep every condition, caveat, uncertainty, and risk. Keep every "if", "unless", and "not verified".
18. Keep code, file paths, commands, identifiers, and error strings exactly as written.
19. Give full detail for errors, failing tests, security warnings, and anything destructive.

Example of the target style.
Before: "It is worth noting that the caching methodology leverages a sophisticated invalidation strategy to facilitate the elimination of redundant requests."
After: "The cache drops stored responses when the data changes, so clients do not repeat work."
```

### Optional strict mode

For procedures, runbooks, and step-by-step answers, add this line (Karpathy's shortcut —
models know the ASD-STE100 aerospace standard, so one line encodes its whole rule book):

```text
For step-by-step answers, write in ASD-STE100 Simplified Technical English, about 80% of the way.
```

## Scoring your GLM output

The vendored linter (`scripts/ste-checker.js`, from webSTE100, MIT) scores text 0–100 on
sentence length, passive voice, jargon words, synonym drift, filler, and paragraph length.
All 10 upstream tests pass locally (`cd scripts && npm test`).

```sh
cd scripts
node score.js ../examples/slop.txt          # score a file
cat answer.txt | node score.js              # score stdin
node score.js --compare slop.txt plain.txt  # before/after delta table
node score.js --fixes answer.txt            # fix sentences to feed back for a repair pass
```

Workflow: save a typical GLM answer to a file, score it, apply the prompt, score the new
answer, and compare. If the score misses, feed `--fixes` output back to the model as a
repair instruction, as webSTE100's lint-and-repair loop does.

## Caveats from the research

- Style rules in AGENTS.md can fade over long sessions; restate them or use a rewrite pass
  on long tasks.
- "80% STE" can sound flat in nuanced discussion — use full strict mode only for procedures.
- Linter scores are approximate (it is not the official ASD-STE100 dictionary); use the
  score to compare variants, not as a compliance certificate.
