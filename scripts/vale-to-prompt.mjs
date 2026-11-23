// vale-to-prompt.mjs — convert Vale JSON alerts into a repair prompt.
// Reads Vale JSON on stdin (vale --output=JSON <file>), prints a prompt block
// with fix sentences grouped by rule, and an alert-count summary.
// Usage: vale --output=JSON <file> | node vale-to-prompt.mjs <file> [--max N] [--format md]
import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
const maxArg = argv.indexOf("--max");
const max = maxArg > -1 ? parseInt(argv[maxArg + 1], 10) : 15;
const asMarkdown = argv.includes("--format", "md") || argv.includes("--md");
const maxErrors = Number.isNaN(max) ? 15 : max;

const RULE_SKIP = new Set([
  "Readability.Polysyllables", // informational; not actionable
  "write-good.E-Prime", // niche style rule; passive check (write-good.Passive) is kept
]);

const raw = readFileSync(0, "utf8");
const data = JSON.parse(raw);
const alerts = Object.values(data).flat();

const counts = { error: 0, warning: 0, suggestion: 0 };
for (const a of alerts) counts[a.Severity] = (counts[a.Severity] || 0) + 1;

if (!alerts.some((a) => !RULE_SKIP.has(a.Check) && !a.Check.startsWith("Readability."))) {
  console.log(`The text is clean. ${alerts.length} informational alert(s); nothing to fix.`);
  process.exit(0);
}

// Readability grade metrics -> one summary instruction; everything else -> fix lines.
const grades = [];
const fixes = [];
const seen = new Set();
for (const a of alerts) {
  if (RULE_SKIP.has(a.Check)) continue;
  if (a.Check.startsWith("Readability.")) {
    grades.push(a.Message.replace(/^Try to keep the /, "").replace(/\.$/, ""));
    continue;
  }
  const key = `${a.Check}|${a.Message}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const where = a.Line ? `line ${a.Line}` : "document";
  fixes.push({ sev: a.Severity, msg: `(${where}) ${a.Message} [${a.Check}]` });
}

const order = { error: 0, warning: 1, suggestion: 2 };
fixes.sort((x, y) => order[x.sev] - order[y.sev]);
const shown = fixes.slice(0, maxErrors);
const dropped = fixes.length - shown.length;

const lines = [];
lines.push(`Rewrite the text below in plain, simple English. It currently has ${alerts.length} style alerts (${counts.error} errors, ${counts.warning} warnings, ${counts.suggestion} suggestions).`);
if (grades.length) {
  lines.push("");
  lines.push(`Reading-grade summary: ${grades.join("; ")}. Shorten sentences and prefer common words; target roughly grade 9 or lower.`);
}
lines.push("");
lines.push("Rules for the rewrite:");
lines.push("- Fix the listed problems. Do not add facts, examples, or claims that are not in the original.");
lines.push("- Keep every citation, number, name, quotation, and hedge exactly as written.");
lines.push("- Keep code, commands, file paths, and identifiers unchanged.");
lines.push("- Keep the document structure (headings, lists, paragraph order).");
lines.push("- Prefer the active voice; name who does what. One idea per sentence.");
lines.push("- Prefer short, common words. Cut filler instead of rephrasing it.");
lines.push("- Output the complete rewritten text and nothing else.");
if (fixes.length) {
  lines.push("");
  lines.push("Problems to fix:");
  for (const f of shown) lines.push(`- ${f.msg}`);
  if (dropped > 0) lines.push(`- ... and ${dropped} more`);
} else if (!grades.length) {
  lines.push("No actionable alerts. The text is clean.");
}

let out = lines.join("\n");
if (asMarkdown) out = "```\n" + out + "\n```";
console.log(out);
