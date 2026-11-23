# Research notes: plain-English prompts and toolsets for LLM output

Recorded 2026-11-23. Context: GLM models produce formal, jargon-heavy English traced to
Chinese academic training norms; goal is a general-purpose prompt + toolset to make any
LLM write plain clear English (Economist/Orwell flavor, not aircraft STE).

## Style guides

- Orwell, "Politics and the English Language" (1946) - the six rules most style guides borrow.
  https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/
- The Economist Style Guide (free online). https://www.economist.com/style-guide/
- Microsoft Writing Style Guide. https://learn.microsoft.com/en-us/style-guide/welcome/
- Google Developer Documentation Style Guide. https://developers.google.com/style
- GOV.UK content design guidance. https://www.gov.uk/guidance/content-design
- GOV.UK official AI prompt for style review. https://ai.gov.uk/knowledge-hub/prompts/review-your-content-against-gov-uk-style-and-standards
- US plainlanguage.gov guidelines. https://plainlanguage.gov/guidelines/
- Australian Style Manual. https://www.stylemanual.gov.au
- ASD-STE100 Simplified Technical English (the "aircraft style"; the Karpathy shortcut is
  "answer in ASD-STE100, about 80% of the way"). https://asd-ste100.org

## Linting / scoring tools (scored 2026-11-23, see README table)

- Vale. https://vale.sh - docs https://docs.vale.sh - packages https://vale.sh/explorer -
  source https://github.com/vale-cli/vale. Packages used here: write-good, proselint, Readability.
  Notable extras: AiTells (AI-prose tells) https://github.com/krishnasunkam/vale-ai-tells,
  Voices (Simple/Direct/Human voices as rules) https://github.com/jdkato/voices
- proselint. https://codeberg.org/amperser/proselint (GitHub mirror https://github.com/amperser/proselint)
- write-good. https://github.com/btford/write-good (stale since 2025-03; still functional via Vale)
- textlint. https://github.com/textlint/textlint
- Harper. https://github.com/Automattic/harper
- LanguageTool. https://languagetool.org / https://github.com/languagetool-org/languagetool
- webSTE100 (STE linter + lint-and-repair demo). https://github.com/vishalmysore/webSTE100

## Generation-time rulesets / prompts / skills for LLMs

- agent-style: 21 rules (12 canonical from Strunk & White, Orwell, Pinker, Gopen & Swan;
  9 observed LLM failure modes). AGENTS.md adapter, review CLI, published bench.
  https://github.com/yzhao062/agent-style
- economist-style skill (applies Economist guide; preserves dialect and quotes).
  https://vluz.eu/en/skills/economist-style
- rewrite-as-thomas skill (fidelity-first house rewrite: "a prettier sentence that changes
  a claim is a failure"). https://github.com/hgto/dots/blob/main/default/skills/rewrite-as-thomas/SKILL.md
- Hermes "Copyedit to a style guide" prompt (change log + author queries + style sheet).
  https://hermes-ide.com/prompts/copyedit-to-style-guide
- Hermes "Build an editorial style sheet" prompt. https://hermes-ide.com/prompts/build-style-sheet
- Every.to guide to AI style guides. https://every.to/guides/ai-style-guide
- Building a few-shot style prompt from exemplars.
  https://blog.ninapanickssery.com/p/how-to-make-an-llm-write-like-someone

## Key prompting findings (from the research pass)

- "Be concise" alone fails; checkable constraints (word caps, named banned words, target
  examples) work. GLM's own docs recommend positive example output over vague instructions.
- GLM register fixes: active voice, delete signposting ("In summary", "It is worth noting"),
  vocabulary swaps (leverage/utilize -> use, facilitate -> help, endeavor -> try, ascertain
  -> find out, "prior to" -> before, "in order to" -> to).
- Plain-language canon: active voice, simple present where possible, subject and verb close,
  "you/we", positive statements, ~15-20 words per sentence, paragraphs of one topic.
- Never trade correctness for brevity: keep caveats, conditions, uncertainty, code
  identifiers, and error strings exact.
- Document-level text simplification research: constraint prompts + staged passes beat
  instructions alone. Example-Guided Prompting: https://arxiv.org/html/2608.05447
  SIMPLE benchmark: https://aclanthology.org/2026.emnlp-main.2306
  ProgDS (progressive document simplification): https://link.springer.com/article/10.1007/s00354-025-00309-1

## Findings from the local testbed

1. The webSTE100 ste-checker assumes one sentence per physical line. On hard-wrapped prose
   it counted wrapped lines as sentences: a 6-sentence paragraph measured as 22 "sentences",
   and average sentence length understated (6.8 measured vs 16.5 true). Corrected
   measurement scripts: scripts/find-paras.mjs, scripts/find-issues.mjs.
2. Vale is markup-aware and lints paragraphs as scopes; no such artifact.
3. Complementarity: on a synthetic GLM jargon paragraph, Vale's write-good package catches
   passive/wordy/adverb issues that proselint misses, and proselint catches usage issues
   (utilize, "very unique") that write-good misses. agent-style review catches structural
   LLM tells both miss (additive openers, summary closers, sentence length).
4. Validation pair: examples/slop.txt (synthetic GLM-style) vs examples/plain.txt (rewrite).
   Vale: 25 warnings + 55 suggestions vs 2 warnings + 12 informational. agent-style review:
   6 violations vs 0.
5. A hand-merged prompt was evaluated and rejected: agent-style covers the canon and the
   LLM-tell rules; proselint covers the jargon swaps; the fidelity rules (never change
   facts/citations) are RULE-H in agent-style. prompts/PROMPT.md is kept as a standalone
   fallback for chatbots without AGENTS.md support.

## Scoring methodology

Criteria: fit to task 30%, adoption/proof 20%, evidence of effectiveness 20%,
maintenance 15%, maturity 15%. Fit and evidence scored by inspection of each project's
docs and benchmarks; adoption = stars + downloads + adopters; maintenance = last push and
release cadence; maturity = age, tests/CI, docs. Scores are judgment, not measurement.
