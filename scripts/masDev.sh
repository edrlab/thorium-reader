#!/bin/sh

rm -rf release
npm run package:mac:skip-notarize

plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (GPU).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Plugin).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Renderer).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper.app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Info.plist"

rm ./release/mas/Thorium.app/Contents/embedded.provisionprofile

DEBUG=* npx electron-osx-sign \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=development \
--platform=mas \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./dev.provisionprofile" \
"./release/mas/Thorium.app"

DEBUG=* node node_modules/electron-osx-sign/bin/electron-osx-flat.js \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=development \
--platform=mas \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./dev.provisionprofile" \
"./release/mas/Thorium.app"
