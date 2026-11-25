#!/bin/sh

set -eu
node ./projects/customization-profile-cli/build.mjs
exec node ./scripts/thorium-profile.cjs "$@"
