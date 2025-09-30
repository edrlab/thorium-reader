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

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { Headers } from "node-fetch";

import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";
import isURL from "validator/lib/isURL";

const filename_ = "readium-desktop:main:saga:apiapp";
const debug = debug_(filename_);
debug("_");

interface IAuthentication {
    infos: {
        mail: string;
        company: string;
    },
    authentication: {
        get_token: string;
        refresh_token: string;
    },
    resources: [
        {
            code: string;
            endpoint: string;
            version: string;
        }
    ]
}

const userAgent = "ThoriumReader/windows-mac-linux/1.1";
const userAgentId = "296";
const appVersion = "1.1";
const applicationName = "Thorium";
const key = "puEdVKFkog";
const librarySearchUrl = "https://pnb-app.centprod.com/v1/pnb-app/json/librarySearch?pagination.sortBy=NAME&pagination.sortOrder=DESCENDING&quickSearch=";
const initClientSecretUrl = "https://pnb-app.centprod.com/v1/pnb-app/json/getInitialisationToken?library=";

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
                    .filter(({libraryGLN, libraryName, libraryWebServiceOperator, libraryWebServiceURL}) => typeof libraryGLN === "string" && typeof libraryName === "string" && libraryWebServiceOperator === "PROVIDER" &&
                        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                        isURL(libraryWebServiceURL))
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

export const authenticationRequestFromLibraryWebServiceURL = async (url: string): Promise<IAuthentication | undefined> => {

    // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
    if(!isURL(url)) {
        throw new Error("not a valid url " + url);
    }

    const result = await httpGet(url);

    if (result.isSuccess && parseContentType(result.contentType) === ContentType.Json) {
        const json: any = await result.response.json();

        const authenticationJson: IAuthentication = json;

        if (typeof authenticationJson.authentication.get_token === "string" &&
            typeof authenticationJson.authentication.refresh_token === "string" &&
            Array.isArray(authenticationJson.resources) &&
            typeof authenticationJson.resources[0] === "object" &&
            typeof authenticationJson.resources[0].endpoint === "string") {
            return authenticationJson;
        }

    }

    return undefined;
};

export const getEndpointFromAuthenticationRequest = (auth: IAuthentication | undefined): string | undefined => {

    if (!auth) return undefined;

    const endpoint = Array.isArray(auth.resources) ? auth.resources[0].endpoint : undefined;
    // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
    if (endpoint && isURL(endpoint)) {
        return endpoint;
    }
    return undefined;
};

export const initClientSecretToken = async (idGnl: string) => {
    if (!idGnl) {
        throw new Error("no id gnl");
    }

    const result = await httpDilicomGet(initClientSecretUrl + idGnl);
    if (result.isSuccess && parseContentType(result.contentType) === ContentType.Json) {

        const json: any = await result.response.json();

        const token = json.tokenValue;

        if (token && typeof token === "string") {
            return token;
        }
    }

    return undefined;
};

interface IApiAppLoansPublication { loanhLink: string, beginDate: string; endDate: string; standardTitle: string; description: string; frontCoverMedium: string; publicationDate: string; language: string; imprintName: string; collection: string; categoryClil: string; }

export const getLoansPublicationFromLibrary = async (url: string): Promise<Array<IApiAppLoansPublication> | undefined> => {
    // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
    if (!url || !isURL(url)) {
        throw new Error("not a loans URL " + url);
    }

    const result = await httpGet(url);

    if (result.isSuccess && parseContentType(result.contentType) === ContentType.Json) {

        const json: any = await result.response.json();

        debug("LOANS", JSON.stringify(json, null, 4));
        if (json.loans && Array.isArray(json.loans)) {

            const loans: any[] = json.loans;
            const loansArray: Array<IApiAppLoansPublication> = loans.filter(
                (v) =>
                typeof v === "object" &&
                typeof v.loanhLink === "string" &&
                // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
                isURL(v.loanhLink) &&
                // typeof v.beginDate === "string" &&
                // typeof v.endDate === "string" &&
                typeof v.standardTitle === "string",
                // typeof v.description === "string" &&
                // typeof v.frontCoverMedium === "string" &&
                // typeof v.publicationDate === "string" &&
                // typeof v.language === "string" &&
                // typeof v.imprintName === "string" &&
                // typeof v.collection === "string" &&
                // typeof v.categoryClil === "string"
                );
            const loansPub = loansArray.map((v) => {

                const url = new URL(v.loanhLink);
                url.searchParams.set("userAgentId", userAgentId);

                v.loanhLink = url.toString();

                return v;
            });

            return loansPub;
        }
    } else if (result.isFailure) {
        return undefined;
    }

    return [];
};

export const convertLoansPublicationToOpdsPublicationsRawJson = (loansPub: IApiAppLoansPublication[]): any => {
    const ret = loansPub.map((v) => {

        return {
            "metadata": {
                "title": v.standardTitle,
                "description": v.description,
                "publisher": v.imprintName,
                "collection": v.collection,
                "language": v.language.slice(0, 2),
            },
            "links": [
                {"rel": "http://opds-spec.org/acquisition/open-access", "href": v.loanhLink, "type": ContentType.Lcp},
            ],
            "images": [
                {"href": v.frontCoverMedium, "type": "image/jpeg"},
            ],
        };
    });
    return ret;
};
