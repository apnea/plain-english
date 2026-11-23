import { readFileSync } from "node:fs";
import { splitSentences, FLUFF, countWords } from "./ste-checker.js";

const text = readFileSync(process.argv[2] || "/home/pete/src/ok/lesson-structures-before.md", "utf8");
const lines = text.split("\n");

const blocks = [];
let cur = null;
lines.forEach((l, i) => {
  const t = l.trim();
  const isText = t && !/^#/.test(t) && !/^[-*+]\s/.test(t) && !/^\d+[.)]\s/.test(t) && !/^>/.test(t);
  if (isText) {
    if (!cur) cur = { start: i + 1, lines: [] };
    cur.lines.push(l);
  } else {
    if (cur) blocks.push(cur);
    cur = null;
  }
});
if (cur) blocks.push(cur);

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PASSIVE_RE = /\b(am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?([a-z]+)\b/gi;
const IRREG = "known done made given taken shown seen written built set put kept found held run sent told left lost paid sold brought bought caught thought taught driven broken chosen frozen spoken stolen worn torn shaken hidden forgotten gotten begun drawn grown thrown blown flown cut hit let shut split spread fed led meant understood".split(" ");
const ED_NOT = "interested excited tired concerned supposed complicated sophisticated detailed limited advanced".split(" ");

for (const b of blocks) {
  const joined = b.lines.join(" ");
  for (const s of splitSentences(joined)) {
    const w = countWords(s);
    const tags = [];
    if (w > 25) tags.push(w + "w");
    for (const f of FLUFF) {
      const re = new RegExp("(^|[^a-zA-Z'])" + escRe(f) + "(?![a-z])", "i");
      if (re.test(s)) tags.push("FILLER:" + f);
    }
    for (const m of s.matchAll(PASSIVE_RE)) {
      const pp = m[2].toLowerCase();
      if ((pp.endsWith("ed") && !ED_NOT.includes(pp)) || IRREG.includes(pp)) { tags.push("PASSIVE:" + m[0]); break; }
    }
    if (tags.length) console.log("L" + b.start, "[" + tags.join(" ") + "]", s.trim().slice(0, 100));
  }
}
