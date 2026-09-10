#!/bin/sh
# Launch the already-built checkout without sharing the installed app's library.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
PROFILE="$HOME/Library/Caches/lipu-thorium-cover-test"
umask 077
mkdir -p "$PROFILE"
# Verbose upstream logging can include credentials and environment variables.
unset DEBUG
cd "$ROOT"
exec "$ROOT/node_modules/.bin/electron" "$ROOT" --user-data-dir="$PROFILE"
