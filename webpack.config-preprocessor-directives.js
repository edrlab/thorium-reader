const webpack = require("webpack");

const { version, build, name } = require("./package.json");
// var git = require("git-rev-sync");

const portApp = process.env.PORT_APP || "8090";
const portReader = process.env.PORT_READER || "8191";
const portPdfWebview = process.env.PORT_PDF_WEBVIEW || "8292";

// Get node environment
const nodeEnv = process.env.NODE_ENV || "development";
// const isDev = nodeEnv === "development";
const isDev = nodeEnv !== "production";
console.log(`PREPROCESSOR nodeEnv: ${nodeEnv} ${isDev}`);

const isContinuousIntegrationDeploy = process.env.RELEASE_TAG ? true : false;

// Firebase SDK needs to used https instead of a custom scheme
const rendererAppAssetsBaseUrl = "https://thorium-reader.localhost/";
// const rendererAppAssetsBaseUrl = "filex://0.0.0.0/";

const rendererLibraryBaseUrl = isDev ? "http://localhost:" + portApp + "/" : rendererAppAssetsBaseUrl;

const rendererReaderBaseUrl = isDev ? "http://localhost:" + portReader + "/" : rendererAppAssetsBaseUrl;

const rendererPdfWebviewBaseUrl = isDev ? "http://localhost:" + portPdfWebview + "/" : "filex://0.0.0.0/";

const envPackaging = process.env.PACKAGING || "0";
const isPackaged = envPackaging === "1";

const nodeModuleRelativeUrl = isPackaged ? "node_modules" : "../node_modules";

const distRelativeUrl = isPackaged ? "dist" : "../dist";

const customizationProfileIsProduction =
    !!process.env.THORIUM_TELEMETRY_SECRET && !!process.env.THORIUM_TELEMETRY_SECRET_DATA; // Environment variable set in GitHub Actions CI via Secrets ==> production build

const { privateKey, pubKey: pubKey_ } = require("./customization-profile-public-key-pair");
const pubKey = customizationProfileIsProduction
    ? `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBAJsqefp34Eph4jKQivj05YhhTJ1a
N+oNxGhhxNhrBg52wNbluJCUqz1cPn3tkz+5sZllYW2Eq+uqzbU4DNe1eZIBwlYV
eJmvw+BkaOWrxOmxT+65ymJTDcrsCGf6eCptEQeO0BUeFn2R3XgkO7A0fszLnZV9
Dho5CFpdtPPt4smIX2M=
-----END PUBLIC KEY-----
`
    : pubKey_;

// "http://localhost:8080/";
// MUST END WITH FORWARD SLASH!
const telemetryUrl = isPackaged
    ? process.env.THORIUM_TELEMETRY_URL ||
      (isContinuousIntegrationDeploy ? "https://telemetry-staging.edrlab.org/" : "https://telemetry.edrlab.org/")
    : "";
const telemetrySecret = process.env.THORIUM_TELEMETRY_SECRET || "";
const telemetrySecretData = process.env.THORIUM_TELEMETRY_SECRET_DATA || "";
const firebaseAnalyticsConfig = {
    apiKey: process.env.THORIUM_FIREBASE_API_KEY || "",
    appId: process.env.THORIUM_FIREBASE_APP_ID || "",
    authDomain: process.env.THORIUM_FIREBASE_AUTH_DOMAIN || "",
    measurementId: process.env.THORIUM_FIREBASE_MEASUREMENT_ID || "",
    messagingSenderId: process.env.THORIUM_FIREBASE_MESSAGING_SENDER_ID || "",
    projectId: process.env.THORIUM_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.THORIUM_FIREBASE_STORAGE_BUCKET || "",
};
const firebaseAnalyticsExplicitlyEnabled =
    ["1", "true"].includes((process.env.THORIUM_FIREBASE_ENABLED || "0").toLowerCase());
const firebaseAnalyticsEnabled =
    firebaseAnalyticsExplicitlyEnabled &&
    !!firebaseAnalyticsConfig.apiKey &&
    !!firebaseAnalyticsConfig.appId &&
    !!firebaseAnalyticsConfig.measurementId &&
    !!firebaseAnalyticsConfig.projectId;
const firebaseAnalyticsDebug =
    ["1", "true"].includes((process.env.THORIUM_FIREBASE_DEBUG || "0").toLowerCase());
const isURLRequireTldFalse =
    !["0", "false"].includes((process.env.THORIUM_ISURL_REQUIRE_TLD_FALSE || "0").toLowerCase());

// const USE_HTTP_STREAMER = false;

// !!! do not forget to edit scripts/package-customization-profile.sh !!!
const data = {
    // used for dead code removal (see typings.d.ts):
    __TH__IS_DEV__: JSON.stringify(isDev),
    __TH__IS_PACKAGED__: JSON.stringify(isPackaged),
    __TH__SKIP_LCP_LSD__: JSON.stringify(false && isDev),
    __TH__IS_VSCODE_LAUNCH__: JSON.stringify(process.env.VSCODE_LAUNCH === "true"),
    __TH__IS_CI__: JSON.stringify(isContinuousIntegrationDeploy),

    "process.env.NODE_ENV": JSON.stringify(nodeEnv),

    // used as constants (see preprocessor-directives.ts):
    __TH__APP_VERSION__: JSON.stringify(version),
    __TH__PACK_NAME__: JSON.stringify(name), // EDRLab.ThoriumReader
    __TH__APP_NAME__: JSON.stringify(build.productName), // Thorium
    __TH__ISURL_REQUIRE_TLD_FALSE__: JSON.stringify(isURLRequireTldFalse),
    __TH__NODE_MODULE_RELATIVE_URL__: JSON.stringify(nodeModuleRelativeUrl),
    __TH__DIST_RELATIVE_URL__: JSON.stringify(distRelativeUrl),
    __TH__RENDERER_LIBRARY_BASE_URL__: JSON.stringify(rendererLibraryBaseUrl),
    __TH__RENDERER_READER_BASE_URL__: JSON.stringify(rendererReaderBaseUrl),
    __TH__RENDERER_PDF_WEBVIEW_BASE_URL__: JSON.stringify(rendererPdfWebviewBaseUrl),
    __TH__TELEMETRY_URL__: JSON.stringify(telemetryUrl),
    __TH__TELEMETRY_SECRET__: JSON.stringify(telemetrySecret),
    __TH__TELEMETRY_SECRETDATA__: JSON.stringify(telemetrySecretData),
    __TH__FIREBASE_ANALYTICS_CONFIG__: JSON.stringify(firebaseAnalyticsConfig),
    __TH__FIREBASE_ANALYTICS_ENABLED__: JSON.stringify(firebaseAnalyticsEnabled),
    __TH__FIREBASE_ANALYTICS_DEBUG__: JSON.stringify(firebaseAnalyticsDebug),
    __TH__CUSTOMIZATION_PROFILE_PUB_KEY__: JSON.stringify(pubKey),
    __TH__CUSTOMIZATION_PROFILE_PRIVATE_KEY__: JSON.stringify(privateKey),

    // __PACKAGING__: JSON.stringify(envPackaging),
    // __NODE_ENV__: JSON.stringify(nodeEnv),
    // __GIT_BRANCH__: JSON.stringify(git.branch()),
    // __GIT_DATE__: JSON.stringify(git.date()),
    // __GIT_SHORT__: JSON.stringify(git.short()),
    // __USE_HTTP_STREAMER__: JSON.stringify(USE_HTTP_STREAMER),
};

// we do not replace "process.env.NODE_ENV" at build-time,
// because we check actual runtime env vars
// when __PACKAGING__ === "0" && __NODE_ENV__ === "PROD" (npm run start)
// if (envPackaging !== "1") {
//     // data["process.env.THORIUM_OPEN_DEVTOOLS"] = JSON.stringify("0");
//     // data["process.env.LCP_SKIP_LSD"] = JSON.stringify("0");
//     // data["process.env.DEBUG"] = "0"; // Terser crash, there is a delete process.env.DEBUG in third-party code
// }

const definePlugin = new webpack.DefinePlugin(data);
module.exports = {
    definePlugin,
    portApp,
    portReader,
    portPdfWebview,
    rendererLibraryBaseUrl,
    rendererReaderBaseUrl,
    rendererPdfWebviewBaseUrl,
};
