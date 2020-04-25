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

npx electron-osx-sign \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=distribution \
--platform=mas \
--entitlements="scripts/entitlements.mac.mas.plist" \
"./release/mas/Thorium.app"
