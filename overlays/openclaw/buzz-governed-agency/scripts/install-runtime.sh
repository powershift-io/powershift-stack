#!/bin/sh
set -eu

target=${1:-}
case "$target" in
  /*/*/*) ;;
  *) echo "refusing: supply a bounded absolute runtime directory" >&2; exit 2 ;;
esac
if [ "$target" = "/" ] || [ -e "$target" ]; then
  echo "refusing: target must not already exist" >&2
  exit 2
fi
mkdir -m 0700 "$target"
(umask 077 && printf '%s\n' 'powershift-governed-adapter-runtime-v0.1' > "$target/.powershift-governed-adapter")
echo "created empty governed-adapter runtime directory: $target"
