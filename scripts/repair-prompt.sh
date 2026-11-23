#!/usr/bin/env bash
# repair-prompt.sh — turn Vale findings for a file into a repair prompt for an LLM.
#
# Usage:
#   scripts/repair-prompt.sh <file>                  print the repair prompt
#   scripts/repair-prompt.sh --max 20 <file>         show up to 20 fix lines (default 15)
#   scripts/repair-prompt.sh --format md <file>      wrap the prompt in a fenced code block
#   scripts/repair-prompt.sh --config <path> <file>  use a different .vale.ini
#   scripts/repair-prompt.sh --help                  show this help
#
# By default the script uses the .vale.ini bundled next to it, so it works on
# any file from any directory (styles resolve relative to that config).
# Override with --config <path> or the VALE_CONFIG environment variable.
# Requires: vale (on PATH) and node.
set -euo pipefail

usage() { sed -n '2,13p' "$0"; }

file=""
max=15
md=0
while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --max) shift; max="${1:?--max needs a number}" ;;
    --format) shift; case "${1:?--format needs md or text}" in md) md=1 ;; text) md=0 ;; *) echo "unknown format: $1" >&2; exit 1 ;; esac ;;
    --config) shift; VALE_CONFIG="${1:?--config needs a path}" ;;
    -*) echo "unknown option: $1 (see --help)" >&2; exit 1 ;;
    *) if [ -n "$file" ]; then echo "only one input file allowed (got: $file and $1)" >&2; exit 1; fi; file="$1" ;;
  esac; shift
done

if [ -z "$file" ]; then echo "no input file (see --help)" >&2; exit 1; fi
[ -f "$file" ] || { echo "not a file: $file" >&2; exit 1; }
command -v vale >/dev/null || { echo "vale not found on PATH" >&2; exit 1; }
command -v node >/dev/null || { echo "node not found on PATH" >&2; exit 1; }

here="$(cd "$(dirname "$0")" && pwd)"
config="${VALE_CONFIG:-$here/../.vale.ini}"
[ -f "$config" ] || { echo "vale config not found: $config (use --config or VALE_CONFIG)" >&2; exit 1; }

# Vale exit codes: 0 = clean, 1 = findings (JSON is still valid), 2+ = real failure.
vale_json="$(vale --config="$config" --output=JSON "$file" 2>/dev/null)" && rc=0 || rc=$?
if [ "$rc" -ge 2 ]; then
  echo "vale failed on $file with config $config (exit $rc)" >&2; exit 2;
fi
printf '%s' "$vale_json" | node "$here/vale-to-prompt.mjs" "$file" --max "$max" \
  $( [ "$md" -eq 1 ] && echo --format md )
