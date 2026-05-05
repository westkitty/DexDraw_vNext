#!/usr/bin/env bash
set -euo pipefail

echo "==> DexDraw vNext — local verification"
echo ""

echo "--- corepack enable"
corepack enable

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

echo ""
echo "==> All checks passed."
