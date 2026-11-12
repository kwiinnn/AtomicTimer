#!/usr/bin/env bash
# Fast local gate: typecheck + lint + unit tests. Stops at the first failure.
set -euo pipefail
npm run -s typecheck
npm run -s lint
npx vitest run "$@" 2>&1 | grep -E "Tests |Test Files|×"
