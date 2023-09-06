// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// module typing
type TCatalogApi = "catalog";
type TPublicationApi = "publication";
type TOpdsApi = "opds";
type TApiappApi = "apiapp";
type THttpBrowserApi = "httpbrowser";
type TKeyboardApi = "keyboardShortcuts";
type TLcpApi = "lcp";
type TSessionApi = "session";
export type TModuleApi =
    TCatalogApi |
    TPublicationApi |
    TOpdsApi |
    TApiappApi |
    THttpBrowserApi |
    TKeyboardApi |
    TLcpApi |
    TSessionApi;
