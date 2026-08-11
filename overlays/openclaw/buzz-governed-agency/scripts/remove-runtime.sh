#!/bin/sh
set -eu

target=${1:-}
case "$target" in
  /*/*/*) ;;
  *) echo "refusing: supply a bounded absolute runtime directory" >&2; exit 2 ;;
esac
marker="$target/.powershift-governed-adapter"
if [ ! -f "$marker" ]; then
  echo "refusing: adapter marker is absent" >&2
  exit 2
fi
if [ -e "$target/supervisor.lock" ]; then
  echo "refusing: supervisor lock exists" >&2
  exit 2
fi
for state in root-dispatch.json operator-control.json operational-telemetry.json; do
  if [ -e "$target/$state" ]; then
    echo "refusing: operational state exists: $state" >&2
    exit 2
  fi
done
rm "$marker"
if ! rmdir "$target"; then
  echo "refusing: runtime directory contains unrecognized files; marker was removed" >&2
  exit 2
fi
echo "removed empty governed-adapter runtime directory: $target"
