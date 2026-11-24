# agent-style adapter: context cost and runtime-read findings

Recorded 2026-11-23. Applies to the agent-style `agents-md` adapter as installed in
this repo (`AGENTS.md` + `.agent-style/RULES.md`, written by agent-style v0.9.0).

## Context cost (measured)

| File | Size | Words | Est. tokens | Loaded into context? |
|---|---|---|---|---|
| `AGENTS.md` (adapter) | 6,360 B | 950 | ~1,400-1,800 | Yes, once per session |
| `.agent-style/RULES.md` (full bodies) | 110,455 B | ~16,750 | ~25,000 | No - on-disk human reference |

Net standing cost per session in an agent-style project: roughly 1,500 tokens, under
1% of a 128K-200K window. One-time per session, not per message. In long sessions the
effect can fade after context compaction (nothing breaks; the rules just stop shaping
output until restated).

## Runtime-read triggers (found 2026-11-23)

The stock adapter contains two lines that can lead an instruction-following model to
read `RULES.md` (~25,000 tokens if loaded, roughly 12-20% of a typical window) or to
fetch the pinned upstream URL:

1. The "Full directive text" line at the end of the adapter, which names
   `.agent-style/RULES.md` and a raw.githubusercontent.com URL.
2. The House Style paragraph, which says "Read that section in `RULES.md` before
   drafting a paper or proposal section." This is the stronger trigger because it is
   keyed to a common task.

The adapter's own Load Statement says the compact directives are what reach context and
RULES.md is human reference; a well-behaved model treats the lines as such, and no
runtime read occurred in our sessions. The risk is real for more literal models.

## What House Style is

The ruleset author's personal writing habits, encoded from his own pre-AI ML papers:
how his abstract, introduction, results and conclusion sections move, that about one
sentence in four runs past 30 words carrying parenthetical glosses, and sparing
signposts. Where House Style conflicts with one of the 21 rules, the habit wins unless
a firm rule is involved. Its purpose is to make the pack write like its author; the
upstream README invites users to fork and replace it with habits measured from their
own writing. For anyone else it is irrelevant content, and its adapter paragraph is
the main runtime-read trigger.

## Recommended trim (recorded 2026-11-23, not applied)

Trim `AGENTS.md` between the BEGIN/END markers to:

- Keep: title/header lines, Self-Verification Handshake (backs the "Is agent-style
  active?" probe), the 21 rules, Escape Hatch.
- Trim the Load Statement to one line and add: "Do not read `.agent-style/RULES.md`
  or fetch any agent-style URL at runtime; the directives above are the complete
  payload."
- Delete: House Style paragraph, "Full directive text" line.

Result: roughly 6.4 KB down to ~4.5 KB with zero runtime-read invitations.
Caveat: a future `agent-style enable` or update re-run may restore the removed
sections; if applied, record a small trim script and re-run it after updates.

## Deployment cost options

| Setup | Standing cost | Effect |
|---|---|---|
| No enable; `npx agent-style review <file>` on demand | 0 | Audit/polish pass only |
| Per-project enable (this repo's setup) | ~1,500 tokens in that project | Shapes all output there |
| Global (`~/.config/opencode/AGENTS.md`) | ~1,500 tokens everywhere | Same, every session |

Secondary consideration: 21 standing directives share attention with the rest of the
system prompt (instruction dilution), and they shape all prose the agent writes in the
project, including commit messages and code comments. Mostly benign for technical
prose; only two rules are hard ("no invented citations", "no placeholders"). Disable
is clean: `npx agent-style@latest disable agents-md`.

## Decisions

- 2026-11-23: trim deferred; `AGENTS.md` left as stock in this repo. Trim plan
  recorded above for future application.
