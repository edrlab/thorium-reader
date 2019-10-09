"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _bluebirdLst() {
  const data = _interopRequireDefault(require("bluebird-lst"));

  _bluebirdLst = function () {
    return data;
  };

  return data;
}

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("builder-util/out/fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = require("fs-extra");

  _fsExtra = function () {
    return data;
  };

  return data;
}

var path = _interopRequireWildcard(require("path"));

function _windowsCodeSign() {
  const data = require("../codeSign/windowsCodeSign");

  _windowsCodeSign = function () {
    return data;
  };

  return data;
}

function _core() {
  const data = require("../core");

  _core = function () {
    return data;
  };

  return data;
}

function _pathManager() {
  const data = require("../util/pathManager");

  _pathManager = function () {
    return data;
  };

  return data;
}

function _targetUtil() {
  const data = require("./targetUtil");

  _targetUtil = function () {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const APPX_ASSETS_DIR_NAME = "appx";
const vendorAssetsForDefaultAssets = {
  "StoreLogo.png": "SampleAppx.50x50.png",
  "Square150x150Logo.png": "SampleAppx.150x150.png",
  "Square44x44Logo.png": "SampleAppx.44x44.png",
  "Wide310x150Logo.png": "SampleAppx.310x150.png"
};
const DEFAULT_RESOURCE_LANG = "en-US";

class AppXTarget extends _core().Target {
  constructor(packager, outDir) {
    super("appx");
    this.packager = packager;
    this.outDir = outDir;
    this.options = (0, _builderUtil().deepAssign)({}, this.packager.platformSpecificBuildOptions, this.packager.config.appx);

    if (process.platform !== "darwin" && (process.platform !== "win32" || (0, _windowsCodeSign().isOldWin6)())) {
      throw new Error("AppX is supported only on Windows 10 or Windows Server 2012 R2 (version number 6.3+)");
    }
  } // https://docs.microsoft.com/en-us/windows/uwp/packaging/create-app-package-with-makeappx-tool#mapping-files


  async build(appOutDir, arch) {
    const packager = this.packager;
    const artifactName = packager.expandArtifactBeautyNamePattern(this.options, "appx", arch);
    const artifactPath = path.join(this.outDir, artifactName);
    await packager.info.callArtifactBuildStarted({
      targetPresentableName: "AppX",
      file: artifactPath,
      arch
    });
    const vendorPath = await (0, _windowsCodeSign().getSignVendorPath)();
    const vm = await packager.vm.value;
    const stageDir = await (0, _targetUtil().createStageDir)(this, packager, arch);
    const mappingFile = stageDir.getTempFile("mapping.txt");
    const makeAppXArgs = ["pack", "/o"
    /* overwrite the output file if it exists */
    , "/f", vm.toVmFile(mappingFile), "/p", vm.toVmFile(artifactPath)];

    if (packager.compression === "store") {
      makeAppXArgs.push("/nc");
    }

    const mappingList = [];
    mappingList.push((await _bluebirdLst().default.map((0, _fs().walk)(appOutDir), file => {
      let appxPath = file.substring(appOutDir.length + 1);

      if (path.sep !== "\\") {
        appxPath = appxPath.replace(/\//g, "\\");
      }

      return `"${vm.toVmFile(file)}" "app\\${appxPath}"`;
    })));
    const userAssetDir = await this.packager.getResource(undefined, APPX_ASSETS_DIR_NAME);
    const assetInfo = await AppXTarget.computeUserAssets(vm, vendorPath, userAssetDir);
    const userAssets = assetInfo.userAssets;
    const manifestFile = stageDir.getTempFile("AppxManifest.xml");
    await this.writeManifest(manifestFile, arch, (await this.computePublisherName()), userAssets);
    mappingList.push(assetInfo.mappings);
    mappingList.push([`"${vm.toVmFile(manifestFile)}" "AppxManifest.xml"`]);

    if (isScaledAssetsProvided(userAssets)) {
      const outFile = vm.toVmFile(stageDir.getTempFile("resources.pri"));
      const makePriPath = vm.toVmFile(path.join(vendorPath, "windows-10", _builderUtil().Arch[arch], "makepri.exe"));
      const assetRoot = stageDir.getTempFile("appx/assets");
      await (0, _fsExtra().emptyDir)(assetRoot);
      await _bluebirdLst().default.map(assetInfo.allAssets, it => (0, _fs().copyOrLinkFile)(it, path.join(assetRoot, path.basename(it))));
      await vm.exec(makePriPath, ["new", "/Overwrite", "/Manifest", vm.toVmFile(manifestFile), "/ProjectRoot", vm.toVmFile(path.dirname(assetRoot)), "/ConfigXml", vm.toVmFile(path.join((0, _pathManager().getTemplatePath)("appx"), "priconfig.xml")), "/OutputFile", outFile]); // in addition to resources.pri, resources.scale-140.pri and other such files will be generated

      for (const resourceFile of (await (0, _fsExtra().readdir)(stageDir.dir)).filter(it => it.startsWith("resources.")).sort()) {
        mappingList.push([`"${vm.toVmFile(stageDir.getTempFile(resourceFile))}" "${resourceFile}"`]);
      }

      makeAppXArgs.push("/l");
    }

    let mapping = "[Files]";

    for (const list of mappingList) {
      mapping += "\r\n" + list.join("\r\n");
    }

    await (0, _fsExtra().writeFile)(mappingFile, mapping);
    packager.debugLogger.add("appx.mapping", mapping);

    if (this.options.makeappxArgs != null) {
      makeAppXArgs.push(...this.options.makeappxArgs);
    }

    await vm.exec(vm.toVmFile(path.join(vendorPath, "windows-10", _builderUtil().Arch[arch], "makeappx.exe")), makeAppXArgs);
    await packager.sign(artifactPath);
    await stageDir.cleanup();
    await packager.info.callArtifactBuildCompleted({
      file: artifactPath,
      packager,
      arch,
      safeArtifactName: packager.computeSafeArtifactName(artifactName, "appx"),
      target: this,
      isWriteUpdateInfo: this.options.electronUpdaterAware
    });
  }

  static async computeUserAssets(vm, vendorPath, userAssetDir) {
    const mappings = [];
    let userAssets;
    const allAssets = [];

    if (userAssetDir == null) {
      userAssets = [];
    } else {
      userAssets = (await (0, _fsExtra().readdir)(userAssetDir)).filter(it => !it.startsWith(".") && !it.endsWith(".db") && it.includes("."));

      for (const name of userAssets) {
        mappings.push(`"${vm.toVmFile(userAssetDir)}${vm.pathSep}${name}" "assets\\${name}"`);
        allAssets.push(path.join(userAssetDir, name));
      }
    }

    for (const defaultAsset of Object.keys(vendorAssetsForDefaultAssets)) {
      if (userAssets.length === 0 || !isDefaultAssetIncluded(userAssets, defaultAsset)) {
        const file = path.join(vendorPath, "appxAssets", vendorAssetsForDefaultAssets[defaultAsset]);
        mappings.push(`"${vm.toVmFile(file)}" "assets\\${defaultAsset}"`);
        allAssets.push(file);
      }
    } // we do not use process.arch to build path to tools, because even if you are on x64, ia32 appx tool must be used if you build appx for ia32


    return {
      userAssets,
      mappings,
      allAssets
    };
  } // https://github.com/electron-userland/electron-builder/issues/2108#issuecomment-333200711


  async computePublisherName() {
    if ((await this.packager.cscInfo.value) == null) {
      _builderUtil().log.info({
        reason: "Windows Store only build"
      }, "AppX is not signed");

      return this.options.publisher || "CN=ms";
    }

    const certInfo = await this.packager.lazyCertInfo.value;
    const publisher = certInfo == null ? null : certInfo.bloodyMicrosoftSubjectDn;

    if (publisher == null) {
      throw new Error("Internal error: cannot compute subject using certificate info");
    }

    return publisher;
  }

  async writeManifest(outFile, arch, publisher, userAssets) {
    const appInfo = this.packager.appInfo;
    const options = this.options;
    const executable = `app\\${appInfo.productFilename}.exe`;
    const displayName = options.displayName || appInfo.productName;
    const manifest = (await (0, _fsExtra().readFile)(path.join((0, _pathManager().getTemplatePath)("appx"), "appxmanifest.xml"), "utf8")).replace(/\${([a-zA-Z0-9]+)}/g, (match, p1) => {
      switch (p1) {
        case "publisher":
          return publisher;

        case "publisherDisplayName":
          const name = options.publisherDisplayName || appInfo.companyName;

          if (name == null) {
            throw new (_builderUtil().InvalidConfigurationError)(`Please specify "author" in the application package.json — it is required because "appx.publisherDisplayName" is not set.`);
          }

          return name;

        case "version":
          return appInfo.getVersionInWeirdWindowsForm(options.setBuildNumber === true);

        case "applicationId":
          const result = options.applicationId || options.identityName || appInfo.name;

          if (!isNaN(parseInt(result[0], 10))) {
            let message = `AppX Application.Id can’t start with numbers: "${result}"`;

            if (options.applicationId == null) {
              message += `\nPlease set appx.applicationId (or correct appx.identityName or name)`;
            }

            throw new (_builderUtil().InvalidConfigurationError)(message);
          }

          return result;

        case "identityName":
          return options.identityName || appInfo.name;

        case "executable":
          return executable;

        case "displayName":
          return displayName;

        case "description":
          return appInfo.description || appInfo.productName;

        case "backgroundColor":
          return options.backgroundColor || "#464646";

        case "logo":
          return "assets\\StoreLogo.png";

        case "square150x150Logo":
          return "assets\\Square150x150Logo.png";

        case "square44x44Logo":
          return "assets\\Square44x44Logo.png";

        case "lockScreen":
          return lockScreenTag(userAssets);

        case "defaultTile":
          return defaultTileTag(userAssets, options.showNameOnTiles || false);

        case "splashScreen":
          return splashScreenTag(userAssets);

        case "arch":
          return arch === _builderUtil().Arch.ia32 ? "x86" : "x64";

        case "resourceLanguages":
          return resourceLanguageTag((0, _builderUtil().asArray)(options.languages));

        case "extensions":
          return this.getExtensions(executable, displayName);

        default:
          throw new Error(`Macro ${p1} is not defined`);
      }
    });
    await (0, _fsExtra().writeFile)(outFile, manifest);
  }

  getExtensions(executable, displayName) {
    const uriSchemes = (0, _builderUtil().asArray)(this.packager.config.protocols).concat((0, _builderUtil().asArray)(this.packager.platformSpecificBuildOptions.protocols));
    const fileAssociations = (0, _builderUtil().asArray)(this.packager.config.fileAssociations).concat((0, _builderUtil().asArray)(this.packager.platformSpecificBuildOptions.fileAssociations));
    let isAddAutoLaunchExtension = this.options.addAutoLaunchExtension;

    if (isAddAutoLaunchExtension === undefined) {
      const deps = this.packager.info.metadata.dependencies;
      isAddAutoLaunchExtension = deps != null && deps["electron-winstore-auto-launch"] != null;
    }

    if (!isAddAutoLaunchExtension && uriSchemes.length === 0 && fileAssociations.length === 0) {
      return "";
    }

    let extensions = "<Extensions>";

    if (isAddAutoLaunchExtension) {
      extensions += `
        <desktop:Extension Category="windows.startupTask" Executable="${executable}" EntryPoint="Windows.FullTrustApplication">
          <desktop:StartupTask TaskId="SlackStartup" Enabled="true" DisplayName="${displayName}" />
        </desktop:Extension>`;
    }

    for (const protocol of uriSchemes) {
      for (const scheme of (0, _builderUtil().asArray)(protocol.schemes)) {
        extensions += `
          <uap:Extension Category="windows.protocol">
            <uap:Protocol Name="${scheme}">
               <uap:DisplayName>${protocol.name}</uap:DisplayName>
             </uap:Protocol>
          </uap:Extension>`;
      }
    }

    for (const fileAssociation of fileAssociations) {
      for (const ext of (0, _builderUtil().asArray)(fileAssociation.ext)) {
        extensions += `
          <uap:Extension Category="windows.fileTypeAssociation">
            <uap:FileTypeAssociation Name="${ext}">
              <uap:SupportedFileTypes>
                <uap:FileType>.${ext}</uap:FileType>
              </uap:SupportedFileTypes>
            </uap:FileTypeAssociation>
          </uap:Extension>`;
      }
    }

    extensions += "</Extensions>";
    return extensions;
  }

} // get the resource - language tag, see https://docs.microsoft.com/en-us/windows/uwp/globalizing/manage-language-and-region#specify-the-supported-languages-in-the-apps-manifest


exports.default = AppXTarget;

function resourceLanguageTag(userLanguages) {
  if (userLanguages == null || userLanguages.length === 0) {
    userLanguages = [DEFAULT_RESOURCE_LANG];
  }

  return userLanguages.map(it => `<Resource Language="${it.replace(/_/g, "-")}" />`).join("\n");
}

function lockScreenTag(userAssets) {
  if (isDefaultAssetIncluded(userAssets, "BadgeLogo.png")) {
    return '<uap:LockScreen Notification="badgeAndTileText" BadgeLogo="assets\\BadgeLogo.png" />';
  } else {
    return "";
  }
}

function defaultTileTag(userAssets, showNameOnTiles) {
  const defaultTiles = ["<uap:DefaultTile", 'Wide310x150Logo="assets\\Wide310x150Logo.png"'];

  if (isDefaultAssetIncluded(userAssets, "LargeTile.png")) {
    defaultTiles.push('Square310x310Logo="assets\\LargeTile.png"');
  }

  if (isDefaultAssetIncluded(userAssets, "SmallTile.png")) {
    defaultTiles.push('Square71x71Logo="assets\\SmallTile.png"');
  }

  if (showNameOnTiles) {
    defaultTiles.push(">");
    defaultTiles.push("<uap:ShowNameOnTiles>");
    defaultTiles.push("<uap:ShowOn", 'Tile="wide310x150Logo"', "/>");
    defaultTiles.push("<uap:ShowOn", 'Tile="square150x150Logo"', "/>");
    defaultTiles.push("</uap:ShowNameOnTiles>");
    defaultTiles.push("</uap:DefaultTile>");
  } else {
    defaultTiles.push("/>");
  }

  return defaultTiles.join(" ");
}

function splashScreenTag(userAssets) {
  if (isDefaultAssetIncluded(userAssets, "SplashScreen.png")) {
    return '<uap:SplashScreen Image="assets\\SplashScreen.png" />';
  } else {
    return "";
  }
}

function isDefaultAssetIncluded(userAssets, defaultAsset) {
  const defaultAssetName = defaultAsset.substring(0, defaultAsset.indexOf("."));
  return userAssets.some(it => it.includes(defaultAssetName));
}

function isScaledAssetsProvided(userAssets) {
  return userAssets.some(it => it.includes(".scale-") || it.includes(".targetsize-"));
} 
// __ts-babel@6.0.4
//# sourceMappingURL=AppxTarget.js.map