// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ok } from "readium-desktop/common/utils/assert";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { IBrowserResultView, THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { IOpdsResultView } from "readium-desktop/common/views/opds";
import { IProblemDetailsResultView } from "readium-desktop/common/views/problemDetails";
import { diMainGet } from "readium-desktop/main/di";
import { httpGet } from "readium-desktop/main/network/http";
import { OpdsService } from "readium-desktop/main/services/opds";
import { ContentType, contentTypeisApiProblem, parseContentType } from "readium-desktop/utils/contentType";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";
import { authenticationRequestFromLibraryWebServiceURL, convertLoansPublicationToOpdsPublicationsRawJson, getEndpointFromAuthenticationRequest, getLoansPublicationFromLibrary } from "../../apiapp";
import isURL from "validator/lib/isURL";
import { URL_PROTOCOL_APP_HANDLER_OPDS } from "readium-desktop/common/streamerProtocol";

const debug = debug_("readium-desktop:main#redux/saga/api/browser");

const checkUrl = (url: string) => {
    try {
        // OR: if (url.startsWith(`${URL_PROTOCOL_APP_HANDLER_OPDS}://`))
        if (new URL(url).protocol === `${URL_PROTOCOL_APP_HANDLER_OPDS}:`) {
            url = url.replace(`${URL_PROTOCOL_APP_HANDLER_OPDS}://`, "http://"); // HTTP to HTTPS redirect should be handled by the server
        }
    } catch (e) {
        throw new Error(`Not a valid URL ${e.message || e}`);
    }
    return url;
};

export function* browse(urlRaw: string): SagaGenerator<THttpGetBrowserResultView>  {

    debug("BROWSE=", urlRaw);
    const opdsService = diMainGet("opds-service") as OpdsService;

    if (urlRaw.startsWith("apiapp://")) {
        const urlApiapp = urlRaw.slice("apiapp://".length);
        const [idGln, urlLib] = urlApiapp.split(":apiapp:");

        debug("APIAPP");
        debug("ID_GNL=", idGln);
        debug("URL_LIB=", urlLib);

        const res = yield* callTyped(authenticationRequestFromLibraryWebServiceURL, urlLib);

        debug("authentication Result from dilicom :" + idGln + ":", res);
        const endpoint = getEndpointFromAuthenticationRequest(res);
        if (!endpoint) {
            return {
                url: "",
                isFailure: true,
                isSuccess: false,
            };
        }

        const endpointURL = new URL(endpoint);
        endpointURL.host = `apiapploans.org.edrlab.thoriumreader.break.${idGln}.break.${endpointURL.host}`;
        const endpointFormated = endpointURL.toString();
        const loansPubArray = yield* callTyped(getLoansPublicationFromLibrary, endpointFormated);

        // this does not work, because auth flow leaves blank JSX comp until refreshed with correct credentials
        // if (!loansPubArray) { // note: empty array is not falsy
        //     const translator = getTranslator();
        //     return {
        //         url: "",
        //         isFailure: true,
        //         isSuccess: false,
        //         statusCode: 403,
        //         statusMessage: translator.trans__late("apiapp.incorrectCredentials"),
        //     };
        // }

        if (Array.isArray(loansPubArray)) {
            // return opdsauthentication
            return {
                url: "",
                responseUrl: "",
                contentType: ContentType.Opds2,
                isFailure: false,
                isSuccess: true,
                data: {
                    opds: yield* callTyped(() => opdsService.opdsRequestTransformer({
                        url: "",
                        responseUrl: "",
                        contentType: ContentType.Opds2,
                        isFailure: false,
                        isSuccess: true,
                        response: {
                            json: async () => {
                                return {
                                    "metadata": {
                                        "title": "loans",
                                    },
                                    "publications": convertLoansPublicationToOpdsPublicationsRawJson(loansPubArray),
                                };
                            },
                        },
                    })),
                },
            };
        } else {
            // return opds feed

            return {
                url: "",
                responseUrl: "",
                contentType: ContentType.Opds2,
                isFailure: false,
                isSuccess: true,
                data: {
                    opds: yield* callTyped(() => opdsService.opdsRequestTransformer({
                        url: "",
                        responseUrl: endpointFormated, // check base url in auth
                        contentType: ContentType.Opds2Auth,
                        isFailure: false,
                        isSuccess: true,
                        response: {
                            json: async () => {
                                return {
                                    "id": idGln,
                                    "title": "auth",
                                    "authentication": [
                                        {
                                            "type": "http://opds-spec.org/auth/oauth/password/apiapp",
                                            "links": [
                                                { "rel": "authenticate", "href": res.authentication.get_token},
                                                { "rel": "refresh", "href": res.authentication.refresh_token},
                                            ],
                                        },
                                    ],
                                };
                            },
                        },
                    })),
                },
            };
        }
    }

    const url = checkUrl(urlRaw);
    // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
    if (!url || !isURL(url)) {
        debug("isURL() NOK", url);
        return {
            url: "",
            isFailure: true,
            isSuccess: false,
        };
    }
    const result = yield* callTyped(() => httpGet<IBrowserResultView>(
        url,
        undefined,
        async (data) => {
            const {
                url: _baseUrl,
                contentType: _contentType,
                statusMessage, isFailure,
                isNetworkError,
                isAbort,
                isTimeout,
            } = data;

            const baseUrl = `${_baseUrl}`;
            const contentType = parseContentType(_contentType);

            // parse Problem details and return
            if (contentTypeisApiProblem(contentType)) {
                const json = await data.response.json();
                const {
                    type,
                    title,
                    status,
                    detail,
                    instance,
                } = json as IProblemDetailsResultView;
                data.data = {
                    problemDetails: {
                        type: typeof type === "string" ? type : undefined,
                        title: typeof title === "string" ? title : undefined,
                        status: typeof status === "number" ? status : undefined,
                        detail: typeof detail === "string" ? detail : undefined,
                        instance: typeof instance === "string" ? instance : undefined,
                    },
                };
                return data;
            }

            // parse OPDS and return
            const dataFromOpdsParser = await opdsService.opdsRequestTransformer(data as IHttpGetResult<IOpdsResultView>);
            if (dataFromOpdsParser) {
                data.data = {
                    opds: dataFromOpdsParser,
                };
                return data;
            }

            // Failed :

            if (!data.isSuccess) {
                // example:
                // 'Bearer error="insufficient_access", error_description="The user represented by the token is not allowed to perform the requested action.", error_uri="https://documentation.openiddict.com/errors/ID2095"'
                data.response?.headers.forEach((value, key) => {
                    debug(`HTTP RESPONSE HEADER '${key}' ==> '${value}'`);
                });
                const wwwAuthenticate = data.response?.headers.get("WWW-Authenticate");
                if (wwwAuthenticate) {
                    console.log("www-authenticate:", data.response?.headers.get("WWW-Authenticate")); // case-insensitve (actual "www-authenticate")
                    if (wwwAuthenticate.startsWith("Bearer") && wwwAuthenticate.includes("error=")) {
                        throw new Error(`www-authenticate ERROR: ${data.statusCode}/${statusMessage} -- ${wwwAuthenticate} (${baseUrl})`);
                    }
                }
            }

            ok(data.isSuccess, `message: ${data.statusCode}/${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);

            debug(`unknown url content-type : ${baseUrl} - ${contentType}`);
            throw new Error(
                `Not a valid OPDS HTTP Content-Type for ${baseUrl} (${contentType})`,
            );
        },
    ));
    return result;
}
