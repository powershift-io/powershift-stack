#!/bin/sh
set -eu

overlay_dir=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
proof_root=$(mktemp -d "${TMPDIR:-/tmp}/powershift-governed-adapter.XXXXXX")
cleanup() { rm -rf "$proof_root"; }
trap cleanup EXIT INT TERM

cp -R "$overlay_dir/package" "$proof_root/package"
rm -rf "$proof_root/package/node_modules" "$proof_root/package/dist"
cd "$proof_root/package"
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test

"$overlay_dir/scripts/install-runtime.sh" "$proof_root/runtime-state"
test "$(stat -f '%Lp' "$proof_root/runtime-state" 2>/dev/null || stat -c '%a' "$proof_root/runtime-state")" = "700"
"$overlay_dir/scripts/remove-runtime.sh" "$proof_root/runtime-state"
test ! -e "$proof_root/runtime-state"
echo "clean install/removal proof: PASS"
