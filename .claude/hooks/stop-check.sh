#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
errors=""
has_errors=false

# Check for uncommitted changes in each directory
extension_changed=$(git -C "$PROJECT_DIR" status --porcelain -- extension/ 2>/dev/null)
website_changed=$(git -C "$PROJECT_DIR" status --porcelain -- website/ 2>/dev/null)

# Exit silently if nothing changed
if [ -z "$extension_changed" ] && [ -z "$website_changed" ]; then
  exit 0
fi

# --- Extension checks ---
if [ -n "$extension_changed" ]; then
  # TypeScript check
  tsc_output=$(cd "$PROJECT_DIR/extension" && npx tsc --noEmit 2>&1) || {
    has_errors=true
    errors+="EXTENSION TypeScript errors:
$tsc_output

"
  }

  # Build check
  build_output=$(cd "$PROJECT_DIR/extension" && npm run build 2>&1) || {
    has_errors=true
    errors+="EXTENSION build errors:
$build_output

"
  }
fi

# --- Website checks ---
if [ -n "$website_changed" ]; then
  # TypeScript check
  tsc_output=$(cd "$PROJECT_DIR/website" && npx astro check 2>&1) || {
    has_errors=true
    errors+="WEBSITE TypeScript errors:
$tsc_output

"
  }

  # Build check
  build_output=$(cd "$PROJECT_DIR/website" && npm run build 2>&1) || {
    has_errors=true
    errors+="WEBSITE build errors:
$build_output

"
  }
fi

if [ "$has_errors" = true ]; then
  echo "$errors"
  echo "Please fix the above errors."
  exit 2
fi

exit 0
