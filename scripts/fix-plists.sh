#!/bin/sh

plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (GPU).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Plugin).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Renderer).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper.app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Info.plist"

code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (GPU).app/Contents/Info.plist"
code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Plugin).app/Contents/Info.plist"
code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Renderer).app/Contents/Info.plist"
code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper.app/Contents/Info.plist"
code "./release/mas/Thorium.app/Contents/Info.plist"

DEBUG=* npx electron-osx-sign \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=development \
--platform=darwin \
--identity="Mac Developer: Daniel Weck (BP324G48P6)" \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./dev.provisionprofile" \
"./release/mas/Thorium.app"

DEBUG=* npx electron-osx-sign \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=distribution \
--platform=mas \
--identity="3rd Party Mac Developer Installer: European Digital Reading Lab (327YA3JNGT)" \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./prod.provisionprofile" \
"./release/mas/Thorium.app"
