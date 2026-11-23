#!/usr/bin/env node
// score.js — score text files against ASD-STE100-style plain English rules.
// Uses the deterministic linter vendored from vishalmysore/webSTE100 (MIT).
//
// Usage:
//   node score.js <file> [more-files...]     score one or more files
//   cat file.txt | node score.js             score stdin
//   node score.js --compare a.txt b.txt      side-by-side metric delta (a = baseline)
//   node score.js --fixes <file>             print fix sentences to feed back to a model
import { readFileSync } from "node:fs";
import { lint, repairInstructions } from "./ste-checker.js";

const args = process.argv.slice(2);

function readInput() {
  if (args.length === 0) return readFileSync(0, "utf8"); // stdin
  return args.map((f) => ({ name: f, text: readFileSync(f, "utf8") }));
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function metricsTable(a, b) {
  const rows = [
    ["STE score", a.score, b.score],
    ["words", a.metrics.words, b.metrics.words],
    ["avg words/sentence", a.metrics.avgWords, b.metrics.avgWords],
    ["sentences over limit", a.metrics.overLimit, b.metrics.overLimit],
    ["multi-action", a.metrics.multiAction, b.metrics.multiAction],
    ["complex words", a.metrics.unapproved, b.metrics.unapproved],
    ["synonym drift", a.metrics.drift, b.metrics.drift],
    ["passive", a.metrics.passive, b.metrics.passive],
    ["filler", a.metrics.fluff, b.metrics.fluff],
    ["long paragraphs", a.metrics.longParas, b.metrics.longParas],
  ];
  const w = Math.max(...rows.map((r) => r[0].length)) + 2;
  console.log(`  ${pad("metric", w)}${pad("before", 8)}${pad("after", 8)}delta`);
  for (const [k, x, y] of rows) {
    const d = Math.round((y - x) * 10) / 10;
    const mark = d === 0 ? " " : d > 0 ? "+" : "";
    console.log(`  ${pad(k, w)}${pad(x, 8)}${pad(y, 8)}${mark}${d}`);
  }
}

function report(name, text, { fixes = false } = {}) {
  const r = lint(text);
  const m = r.metrics;
  console.log(`\n== ${name}`);
  console.log(`  STE score: ${r.score}/100 (${r.grade})`);
  console.log(
    `  words ${m.words} | avg ${m.avgWords} w/sent (max ${m.maxWords}) | ` +
      `over-limit ${m.overLimit} | multi-action ${m.multiAction} | ` +
      `complex ${m.unapproved} | drift ${m.drift} | passive ${m.passive} | ` +
      `filler ${m.fluff} | long-para ${m.longParas}`
  );
  const all = [
    ...r.docIssues.map((i) => ({ where: "doc", msg: i.msg })),
    ...r.units.flatMap((u) => u.issues.map((i) => ({ where: `S${u.id + 1}`, msg: i.msg }))),
  ];
  for (const i of all.slice(0, 15)) console.log(`  - [${i.where}] ${i.msg}`);
  if (all.length > 15) console.log(`  ... and ${all.length - 15} more findings`);
  if (fixes) {
    const list = repairInstructions(r);
    console.log("\n  Fix instructions (feed back to the model):");
    for (const f of list) console.log(`  - ${f}`);
  }
  return r;
}

if (args[0] === "--compare") {
  const [a, b] = args.slice(1).map((f) => lint(readFileSync(f, "utf8")));
  console.log(`\ncompare: ${args[1]} -> ${args[2]}`);
  metricsTable(a, b);
} else if (args[0] === "--fixes") {
  report(args[1], readFileSync(args[1], "utf8"), { fixes: true });
} else {
  const inputs = readInput();
  for (const { name, text } of Array.isArray(inputs) ? inputs : [{ name: "stdin", text: inputs }]) {
    report(name, text);
  }
}
