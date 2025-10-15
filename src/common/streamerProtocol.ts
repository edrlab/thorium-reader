// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { READIUM2_ELECTRON_HTTP_PROTOCOL } from "@r2-navigator-js/electron/common/sessions";

export const URL_HOST_COMMON = "0.0.0.0"; // this IP-address like syntactical convention is IMPORTANT for legacy reasons (RegExp parsing in convertHttpUrlToCustomScheme() and convertCustomSchemeToHttpUrl()), so DO NOT change to the old "host" naming convention

export const URL_PROTOCOL_THORIUMHTTPS = "thoriumhttps"; // ==> convertHttpUrlToCustomScheme
export const URL_PROTOCOL_HTTPSR2 = READIUM2_ELECTRON_HTTP_PROTOCOL; // "httpsr2" ==> convertCustomSchemeToHttpUrl
export const URL_PATH_PREFIX_PUB = "pub"; // hard-coded in r2-navigator convertHttpUrlToCustomScheme() and convertCustomSchemeToHttpUrl() regular expression parsing

export const URL_PROTOCOL_PDFJSEXTRACT = "pdfjs-extract";
export const URL_PROTOCOL_OPDS_MEDIA = "opds-media";
export const URL_PROTOCOL_FILEX = "filex";
export const URL_PROTOCOL_STORE = "store";

export const URL_PROTOCOL_OPDS = "opds"; // MUST be verbatim "opds"
export const URL_HOST_OPDS_AUTH = "authorize"; // MUST be verbatim "authorize"

export const URL_PROTOCOL_APP_HANDLER_OPDS = "opds";
export const URL_PROTOCOL_APP_HANDLER_THORIUM = "thorium";

export const URL_HOST_CUSTOMPROFILE = "customization-profile";

export const URL_PATH_PREFIX_CUSTOMPROFILEZIP = "custom-profile-zip";
export const URL_PATH_PREFIX_PUBNOTES = "publication-notes";
export const URL_PATH_PREFIX_MATHJAX = "math-jax";
export const URL_PATH_PREFIX_READIUMCSS = "readium-css";
export const URL_PATH_PREFIX_PDFJS = "pdfjs";
