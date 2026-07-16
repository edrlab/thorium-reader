// xcrun notarytool history --apple-id=$APPLEID --team-id=$APPLEIDTEAM --password=$APPLEIDPASS

// xcrun notarytool store-credentials "thorium-keychain" --apple-id $APPLEID --team-id $APPLEIDTEAM --password $APPLEIDPASS
// export APPLEIDKEYCHAIN="thorium-keychain"

// require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {

    // https://www.electron.build/docs/configuration/#aftersign
    // context: AfterPackContext
    // { outDir, appOutDir, packager, electronPlatformName, arch, targets }

    console.log("=-=-=-=-=- AFTER SIGN ...");

    console.log("context.electronPlatformName: " + context.electronPlatformName);

    // TypeError: Converting circular structure to JSON
    // console.log("context.targets: " + JSON.stringify(context.targets, null, 4));
    console.log("context.arch: " + context.arch);

    console.log("context.packager.appInfo.productFilename: " + context.packager.appInfo.productFilename);
    console.log("context.outDir: " + context.outDir);
    console.log("context.appOutDir: " + context.appOutDir);

    console.log("context.packager.executableName: " + context.packager.executableName);

    const { electronPlatformName, appOutDir } = context;

    if (electronPlatformName !== 'darwin' || process.env.SKIP_NOTARIZE) {
        console.log("=-=-=-=-=- AFTER SIGN [SKIP]");
        return;
    }

    const appName = context.packager.appInfo.productFilename;

    // https://github.com/electron/notarize/blob/main/README.md
    const res = await notarize(
        (!!process.env.APPLEIDKEYCHAIN)
        ?
        {
            appBundleId: 'org.edrlab.thorium',
            appPath: `${appOutDir}/${appName}.app`,

            keychainProfile: process.env.APPLEIDKEYCHAIN,
        }
        :
        {
            appBundleId: 'org.edrlab.thorium',
            appPath: `${appOutDir}/${appName}.app`,

            appleId: process.env.APPLEID,
            appleIdPassword: process.env.APPLEIDPASS,
            teamId: process.env.APPLEIDTEAM,
            ascProvider: process.env.APPLEIDTEAM, // legacy
        }
    );

    console.log("=-=-=-=-=- AFTER SIGN :)");

    return res;
};
