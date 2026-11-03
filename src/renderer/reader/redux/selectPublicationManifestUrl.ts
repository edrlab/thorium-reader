// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { URL_HOST_COMMON, URL_PATH_PREFIX_PUB, URL_PROTOCOL_THORIUMHTTPS } from "readium-desktop/common/streamerProtocol";
import { convertHttpUrlToCustomScheme } from "readium-desktop/r2-xxx-js/r2-navigator-js/electron/common/sessions";
import { encodeURIComponent_RFC3986 } from "readium-desktop/r2-xxx-js/r2-utils-js/_utils/http/UrlUtils";

export const selectPublicationManifestUrl = (state: IReaderRootState): string => {
    const { publicationIdentifier, publicationView } = state.reader.info;
    const identifier = publicationIdentifier || publicationView.identifier;
    const encodedIdentifier = encodeURIComponent_RFC3986(Buffer.from(identifier, "utf8").toString("base64"));

    return convertHttpUrlToCustomScheme(
        `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_PUB}/${encodedIdentifier}/manifest.json`,
    );
};
