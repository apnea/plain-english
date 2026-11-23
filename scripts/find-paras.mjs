import { readFileSync } from "node:fs";
import { splitSentences } from "./ste-checker.js";

const text = readFileSync(process.argv[2] || "/home/pete/src/ok/lesson-structures-before.md", "utf8");
const lines = text.split("\n");

// paragraph blocks: consecutive non-blank, non-heading, non-list lines
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

console.log("total blocks:", blocks.length);
const sizes = blocks
  .map((b) => ({ b, n: splitSentences(b.lines.join(" ")).length }))
  .sort((x, y) => y.n - x.n);
for (const { b, n } of sizes.slice(0, 12)) {
  console.log(n + " sents | L" + b.start + " | " + b.lines[0].trim().slice(0, 60));
}
const dist = {};
for (const { n } of sizes) dist[n] = (dist[n] || 0) + 1;
console.log("distribution:", JSON.stringify(dist));

console.log("\n== real sentences over 25 words:");
let totalWords = 0, totalSents = 0, maxLen = 0;
for (const { b } of sizes) {
  const joined = b.lines.join(" ");
  for (const s of splitSentences(joined)) {
    const w = s.split(/\s+/).filter(Boolean).length;
    totalWords += w; totalSents++; maxLen = Math.max(maxLen, w);
    if (w > 25) {
      const firstLine = b.lines.find((l) => s.slice(0, 30).split(/\s+/)[0] && l.includes(s.trim().slice(0, 25).split(" ")[0]));
      console.log(w + "w | L" + b.start + " | " + s.trim().slice(0, 75));
    }
  }
}
console.log("\ntrue avg words/sentence:", (totalWords / totalSents).toFixed(1), "| max:", maxLen, "| sentences:", totalSents);
