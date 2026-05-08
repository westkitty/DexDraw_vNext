#!/usr/bin/env bash
set -euo pipefail

echo "==> DexDraw — local verification"
echo ""

if command -v corepack &>/dev/null; then
  echo "--- corepack enable"
  corepack enable
fi

echo "--- pnpm install"
pnpm install

echo "--- typecheck"
pnpm typecheck

echo "--- test"
pnpm test

echo "--- build"
pnpm build

echo "--- lint"
pnpm lint

if [[ "${1:-}" == "--e2e" ]]; then
  echo "--- e2e (--workers=1 for stable presence timing)"
  pnpm test:e2e --workers=1
fi

echo ""
echo "==> All checks passed."
