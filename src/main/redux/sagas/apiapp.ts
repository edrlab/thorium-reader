// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { createHmac } from "node:crypto";
import { THttpGetCallback } from "readium-desktop/common/utils/http";
import { httpGet } from "readium-desktop/main/network/http";
import { Headers } from "node-fetch";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";
import isURL from "validator/lib/isURL";

const filename_ = "readium-desktop:main:saga:apiapp";
const debug = debug_(filename_);
debug("_");

const userAgent = "ThoriumReader/windows-mac-linux/1.1";
const appVersion = "1.1";
const applicationName = "Thorium";
const key = "puEdVKFkog";
const librarySearchUrl = "https://pnb-app.centprod.com/v1/pnb-app/json/librarySearch?pagination.sortBy=NAME&pagination.sortOrder=DESCENDING&quickSearch=";

const httpDilicomGet = async <T>(url: string, callback?: THttpGetCallback<T>) => {

    const date = Date.now().toString();
    const toEncode = date + applicationName;

    const encoded = createHmac("sha256", key)
        .update(toEncode)
        .digest("hex");

    const headers = new Headers();
    headers.append("X-Authorization", date);
    headers.append("X-Authorization-Content", encoded);
    headers.append("Application-Name", applicationName);
    headers.append("Application-User-Agent", userAgent);
    headers.append("Application-Version", appVersion);

    const options = {
        headers,
    };

    const result = await httpGet<T>(url, options, callback);

    return result;
};

export const librarySearch = async (query: string): Promise<IApiappSearchResultView[]> => {

    const url = librarySearchUrl + query;
    const result = await httpDilicomGet<IApiappSearchResultView>(url);

    if (result.isSuccess && parseContentType(result.contentType) === ContentType.Json) {

        const json: any = await result.response.json();

        debug(json);

        if (typeof json === "object") {
            if (typeof json.begin === "object") {
                if (Array.isArray(json.begin)) {

                    const libs: any[] = json.begin;

                    debug(libs);

                    const libView: IApiappSearchResultView[] = libs
                    .filter((v) => typeof v === "object")
                    .filter(({libraryGLN, libraryName, libraryWebServiceOperator, libraryWebServiceURL}) => typeof libraryGLN === "string" && typeof libraryName === "string" && libraryWebServiceOperator === "PROVIDER" && isURL(libraryWebServiceURL))
                    .map(({libraryGLN, libraryName, libraryAddress, libraryTown, libraryPostalCode, libraryWebServiceURL}) => {
                        return {
                            id: libraryGLN,
                            name: libraryName,
                            address: `${libraryAddress} ${libraryPostalCode} ${libraryTown}`,
                            url: libraryWebServiceURL,
                        };
                    });

                    return libView;
                }
            }
        }
    }

    return [];
};
