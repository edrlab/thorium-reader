#!/bin/sh

npm run package:mac:skip-notarize

#mkdir ./release/mas
#cp -R ./release/mac ./release/mas

plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (GPU).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Plugin).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Renderer).app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper.app/Contents/Info.plist"
plutil -convert xml1 "./release/mas/Thorium.app/Contents/Info.plist"

# code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (GPU).app/Contents/Info.plist"
# code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Plugin).app/Contents/Info.plist"
# code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper (Renderer).app/Contents/Info.plist"
# code "./release/mas/Thorium.app/Contents/Frameworks/Thorium Helper.app/Contents/Info.plist"
# code "./release/mas/Thorium.app/Contents/Info.plist"

# cat ./release/mas/Thorium.app/Contents/_CodeSignature/CodeResources

# ls -l@ ./release/mas/
# sudo xattr -d com.apple.quarantine ./release/mas/Thorium.app

ls -als ./release/mas/Thorium.app/Contents/
rm ./release/mas/Thorium.app/Contents/embedded.provisionprofile

# DEBUG=* npx electron-osx-sign \
# --gatekeeper-assess=false \
# --hardened-runtime=false \
# --type=development \
# --platform=darwin \
# --identity="Mac Developer: Daniel Weck (BP324G48P6)" \
# --entitlements="./scripts/entitlements.mac.mas.plist" \
# --entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
# --provisioning-profile="./dev.provisionprofile" \
# "./release/mas/Thorium.app"

# DEBUG=* npx electron-osx-sign \
# --gatekeeper-assess=false \
# --hardened-runtime=false \
# --type=distribution \
# --platform=darwin \
# --identity="Developer ID Application: European Digital Reading Lab (327YA3JNGT)" \
# --entitlements="./scripts/entitlements.mac.mas.plist" \
# --entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
# --provisioning-profile="./prod.provisionprofile" \
# "./release/mas/Thorium.app"


# --identity="Mac Developer: Daniel Weck (BP324G48P6)" \
DEBUG=* npx electron-osx-sign \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=development \
--platform=mas \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./dev.provisionprofile" \
"./release/mas/Thorium.app"

# productbuild --component ./release/mas/Thorium.app /Applications --sign "3rd Party Mac Developer Installer:" ./release/mas/Thorium.pkg

DEBUG=* node node_modules/electron-osx-sign/bin/electron-osx-flat.js \
--gatekeeper-assess=false \
--hardened-runtime=false \
--type=distribution \
--platform=mas \
--entitlements="./scripts/entitlements.mac.mas.plist" \
--entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
--provisioning-profile="./dev.provisionprofile" \
"./release/mas/Thorium.app"

# --identity="3rd Party Mac Developer Application: European Digital Reading Lab (327YA3JNGT)" \
# DEBUG=* npx electron-osx-sign \
# --gatekeeper-assess=false \
# --hardened-runtime=false \
# --type=distribution \
# --platform=mas \
# --entitlements="./scripts/entitlements.mac.mas.plist" \
# --entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
# --provisioning-profile="./prod.provisionprofile" \
# "./release/mas/Thorium.app"

# DEBUG=* node node_modules/electron-osx-sign/bin/electron-osx-flat.js \
# --gatekeeper-assess=false \
# --hardened-runtime=false \
# --type=distribution \
# --platform=mas \
# --entitlements="./scripts/entitlements.mac.mas.plist" \
# --entitlements-inherit="./scripts/entitlements.mac.mas.inherit.plist" \
# --provisioning-profile="./prod.provisionprofile" \
# "./release/mas/Thorium.app"

#spctl -a -vvv ./release/mas/Thorium.app
spctl -vvv --assess --type exec --raw ./release/mas/Thorium.app
codesign -dvvv --verbose=4 ./release/mas/Thorium.app
codesign --verify --deep --strict --verbose=2 ./release/mas/Thorium.app
#codesign -vvv --deep --strict ./release/mas/Thorium.app
codesign --display --entitlements :- ./release/mas/Thorium.app

security cms -D -i ./release/mas/Thorium.app/Contents/embedded.provisionprofile

open ./release/mas/Thorium.app

sudo installer -store -pkg ./release/mas/Thorium.pkg -target /
open /Applications/Thorium.app

codesign --deep --force --verbose --sign - ./release/mas/Thorium.app
