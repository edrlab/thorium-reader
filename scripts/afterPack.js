const path = require("path");
const builder = require("electron-builder");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");

// https://github.com/mattermost/desktop/blob/master/scripts/afterpack.js
// const { spawnSync } = require("child_process");
// const SETUID_PERMISSIONS = '4755';
// function fixSetuid(context) {
//     return async (target) => {
//         if (!['appimage', 'snap'].includes(target.name.toLowerCase())) {
//             const result = await spawnSync('chmod', [SETUID_PERMISSIONS, path.join(context.appOutDir, 'chrome-sandbox')]);
//             if (result.error) {
//                 throw new Error(
//                     `Failed to set proper permissions for linux arch on ${target.name}: ${result.error} ${result.stderr} ${result.stdout}`,
//                 );
//             }
//         }
//     };
// }

// https://github.com/electron-userland/electron-builder/issues/6365

module.exports = async function afterPack(context) {
    console.log("=-=-=-=-=- AFTER PACK ...");

    console.log("context.electronPlatformName: " + context.electronPlatformName);
    console.log("builder.Platform.MAC: " + builder.Platform.MAC); // 'darwin'
    console.log("builder.Platform.LINUX: " + builder.Platform.LINUX); // 'linux'
    console.log("builder.Platform.WINDOWS: " + builder.Platform.WINDOWS); // 'win32'

    console.log("context.arch: " + context.arch);
    console.log("builder.Arch.universal: " + builder.Arch.universal);
    console.log("builder.Arch.arm64: " + builder.Arch.arm64);
    console.log("builder.Arch.x64: " + builder.Arch.x64);

    console.log("context.packager.appInfo.productFilename: " + context.packager.appInfo.productFilename);
    console.log("context.appOutDir: " + context.appOutDir);

    console.log("context.packager instanceof builder.LinuxPackager: " + (context.packager instanceof builder.LinuxPackager));
    console.log("context.packager.executableName: " + context.packager.executableName);

    console.log("context.packager.addElectronFuses(): " + !!context.packager.addElectronFuses);

    /* @type require("@electron/fuses").FuseConfig */
    const fuseConfig = {
        version: FuseVersion.V1,
        strictlyRequireAllFuses: true,

        // https://github.com/electron/fuses?tab=readme-ov-file#apple-silicon
        resetAdHocDarwinSignature: context.electronPlatformName === "darwin" && context.arch === builder.Arch.arm64,

        // RunAsNode = 0,
        [FuseV1Options.RunAsNode]: false, // ELECTRON_RUN_AS_NODE

        // EnableCookieEncryption = 1,
        [FuseV1Options.EnableCookieEncryption]: false, // TODO: make this TRUE

        // EnableNodeOptionsEnvironmentVariable = 2,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, // NODE_OPTIONS + NODE_EXTRA_CA_CERTS

        // EnableNodeCliInspectArguments = 3,
        [FuseV1Options.EnableNodeCliInspectArguments]: false, // --inspect

        // EnableEmbeddedAsarIntegrityValidation = 4,
        // https://github.com/electron/fuses/issues/7
        // https://github.com/electron-userland/electron-builder/pull/8245
        // https://github.com/electron-userland/electron-builder/issues/6930
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,

        // OnlyLoadAppFromAsar = 5,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,

        // LoadBrowserProcessSpecificV8Snapshot = 6,
        [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,

        // GrantFileProtocolExtraPrivileges = 7,
        [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    };

    // Electron Builder v26
    // https://github.com/electron-userland/electron-builder/pull/8588
    if (context.packager.addElectronFuses) {
        await context.packager.addElectronFuses(context, fuseConfig);
    } else {

        const ext = {
            darwin: ".app",
            win32: ".exe",
            linux: [""],
        }[context.electronPlatformName];

        const executableName = (context.packager instanceof builder.LinuxPackager) ? context.packager.executableName : context.packager.appInfo.productFilename;
        // const executableName =
        //     context.electronPlatformName === "linux"
        //         ? context.packager.appInfo.productFilename.toLowerCase() // context.packager.executableName
        //         : context.packager.appInfo.productFilename;

        const electronBinaryPath = path.join(context.appOutDir, `${executableName}${ext}`);

        await flipFuses(electronBinaryPath, fuseConfig);
    }

    // if (context.electronPlatformName === 'linux') {
    //     context.targets.forEach(fixSetuid(context));
    // }

    console.log("=-=-=-=-=- AFTER PACK :)");
};
