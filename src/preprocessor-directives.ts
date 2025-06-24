// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// build-time preprocessor directives
// (must be set by bundlers like WebPack / Browserify etc.)

declare const __RENDERER_LIBRARY_BASE_URL__: string;
export const _RENDERER_LIBRARY_BASE_URL = __RENDERER_LIBRARY_BASE_URL__;

declare const __RENDERER_READER_BASE_URL__: string;
export const _RENDERER_READER_BASE_URL = __RENDERER_READER_BASE_URL__;

declare const __RENDERER_PDF_WEBVIEW_BASE_URL__: string;
export const _RENDERER_PDF_WEBVIEW_BASE_URL = __RENDERER_PDF_WEBVIEW_BASE_URL__;

declare const __NODE_MODULE_RELATIVE_URL__: string;
export const _NODE_MODULE_RELATIVE_URL = __NODE_MODULE_RELATIVE_URL__;

declare const __DIST_RELATIVE_URL__: string;
export const _DIST_RELATIVE_URL = __DIST_RELATIVE_URL__;

declare const __PACKAGING__: string;
export const _PACKAGING = __PACKAGING__;

declare const __VSCODE_LAUNCH__: string;
export const _VSCODE_LAUNCH = __VSCODE_LAUNCH__;

// declare const __GIT_BRANCH__: string;
// export const _GIT_BRANCH = __GIT_BRANCH__;

// declare const __GIT_SHORT__: string;
// export const _GIT_SHORT = __GIT_SHORT__;

// declare const __GIT_DATE__: string;
// export const _GIT_DATE = __GIT_DATE__;

declare const __APP_VERSION__: string;
export const _APP_VERSION = __APP_VERSION__;

declare const __PACK_NAME__: string;
export const _PACK_NAME = __PACK_NAME__;

declare const __APP_NAME__: string;
export const _APP_NAME = __APP_NAME__;

// declare const __USE_HTTP_STREAMER__: boolean;
// export const _USE_HTTP_STREAMER = __USE_HTTP_STREAMER__;

declare const __TELEMETRY_URL__: string;
export const _TELEMETRY_URL = __TELEMETRY_URL__;

declare const __TELEMETRY_SECRET__: string;
export const _TELEMETRY_SECRET = __TELEMETRY_SECRET__;

declare const __NODE_ENV__: string;
export const _NODE_ENV = __NODE_ENV__;

// when not in packaged mode (i.e. prod or dev, but no app bundle),
// then check runtime process.env:
export const LCP_SKIP_LSD = __PACKAGING__ === "0" && process.env.LCP_SKIP_LSD === "1";

export const IS_DEV =

    // ... either build-time "var":
    __NODE_ENV__ === "DEV" ||

    // ... or when not packaging, check runtime process.env:
    __PACKAGING__ === "0" &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

export const OPEN_DEV_TOOLS = IS_DEV && process.env.THORIUM_OPEN_DEVTOOLS === "1";

declare const __CONTINUOUS_INTEGRATION_DEPLOY__: boolean;
export const _CONTINUOUS_INTEGRATION_DEPLOY = __CONTINUOUS_INTEGRATION_DEPLOY__;

declare const __AI_FEATURE__: boolean;
export const _AI_FEATURE = __AI_FEATURE__;
export const IS_AI_FEATURE = IS_DEV && _AI_FEATURE;
