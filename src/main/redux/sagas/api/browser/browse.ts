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
import { contentTypeisApiProblem, parseContentType } from "readium-desktop/utils/contentType";
import { call, SagaGenerator } from "typed-redux-saga";

const debug = debug_("readium-desktop:main#redux/saga/api/browser");

const checkUrl = (url: string) => {
    try {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }
    } catch (e) {
        throw new Error(`Not a valid URL ${e.message || e}`);
    }
    return url;
};

export function* browse(urlRaw: string): SagaGenerator<THttpGetBrowserResultView>  {

    const url = checkUrl(urlRaw);

    const opdsService = diMainGet("opds-service");

    const result = yield* call(() => httpGet<IBrowserResultView>(
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

            ok(data.isSuccess, `message: ${statusMessage} | url: ${baseUrl} | type: ${_contentType} | code: ${+isFailure}${+isNetworkError}${+isAbort}${+isTimeout}`);

            debug(`unknown url content-type : ${baseUrl} - ${contentType}`);
            throw new Error(
                `Not a valid OPDS HTTP Content-Type for ${baseUrl} (${contentType})`,
            );
        },
    ));
    return result;
}
