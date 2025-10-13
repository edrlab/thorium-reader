// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


// see this
// import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/common/streamerProtocol";

export const urlPathResolve = (base: string, href: string): string =>
    (
        href
        && !/^https?:\/\//.test(href)
        && !/^data:\/\//.test(href)
        && !/^thoriumhttps:\/\//.test(href) // THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL
    )
        ? (new URL(href, base)).toString()
        : href;
