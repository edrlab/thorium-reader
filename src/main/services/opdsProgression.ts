// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import Ajv from "ajv";
import addFormats from "ajv-formats";
import debug_ from "debug";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";

import {
    IOpdsProgressionDocument,
    OPDS_PROGRESSION_MEDIA_TYPE,
} from "readium-desktop/common/models/opdsProgression";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { parseProblemDetails } from "readium-desktop/common/utils/http";
import { IProblemDetailsResultView } from "readium-desktop/common/views/problemDetails";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { httpGet, httpPutWithAuth } from "readium-desktop/main/network/http";
import { ContentType, contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

const debug = debug_("readium-desktop:main#services/opdsProgression");

const schema = {
    $id: "https://drafts.opds.io/schema/progression.schema.json",
    type: "object",
    properties: {
        title: { type: "string" },
        modified: { type: "string", format: "date-time" },
        device: {
            type: "object",
            properties: {
                id: { type: "string", format: "uri" },
                name: { type: "string", minLength: 1 },
            },
            required: ["id", "name"],
        },
        progression: { type: "number", minimum: 0, maximum: 1 },
        references: {
            type: "array",
            items: { type: "string", format: "uri-reference" },
        },
    },
    required: ["modified", "device", "progression"],
} as const;

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile<IOpdsProgressionDocument>(schema);

export const parseOpdsProgressionDocument = (value: unknown): IOpdsProgressionDocument | undefined =>
    validate(value) ? value : undefined;

export type TOpdsProgressionPutDocument = Pick<
    IOpdsProgressionDocument,
    "modified" | "device" | "progression"
>;

interface IOpdsProgressionPutProblemResult {
    problem?: IProblemDetailsResultView;
}

export type TOpdsProgressionPutResult =
    | {
        kind: "success";
        statusCode: 200 | 201;
        document: IOpdsProgressionDocument;
    }
    | { kind: "invalid-document" }
    | ({ kind: "bad-request"; statusCode: 400 } & IOpdsProgressionPutProblemResult)
    | ({ kind: "unauthorized"; statusCode: 401 } & IOpdsProgressionPutProblemResult)
    | { kind: "authentication-required"; statusCode: 401; authenticationUrl: string }
    | ({ kind: "forbidden"; statusCode: 403 } & IOpdsProgressionPutProblemResult)
    | ({ kind: "conflict"; statusCode: 409 } & IOpdsProgressionPutProblemResult)
    | ({ kind: "server-error"; statusCode: number } & IOpdsProgressionPutProblemResult)
    | { kind: "network-error"; isTimeout: boolean }
    | { kind: "invalid-response"; statusCode?: number };

const tryParseProblemDetails = async (
    response: Parameters<typeof parseProblemDetails>[0],
): Promise<IProblemDetailsResultView | undefined> => {
    try {
        return await parseProblemDetails(response);
    } catch {
        return undefined;
    }
};

const parseSerializedOpdsProgressionDocument = (
    value: string,
): IOpdsProgressionDocument | undefined => {
    try {
        return parseOpdsProgressionDocument(JSON.parse(value));
    } catch {
        return undefined;
    }
};

const forwardOpdsAuthenticationDocument = async (
    response: Parameters<typeof parseProblemDetails>[0],
    contentType: string | undefined,
    responseUrl: string,
): Promise<boolean> => {
    if (!contentTypeisOpdsAuth(parseContentType(contentType || "")) || !response) {
        return false;
    }

    try {
        const value = await response.json?.();
        if (!value) {
            return false;
        }
        const document = TaJsonDeserialize(value, OPDSAuthenticationDoc);
        getOpdsAuthenticationChannel().put([document, responseUrl, false]);
        return true;
    } catch (err) {
        debug("Invalid OPDS authentication document from progression PUT", err);
        return false;
    }
};

export const getOpdsProgression = async (
    url: string,
    locale?: keyof typeof availableLanguages,
): Promise<IOpdsProgressionDocument | undefined> => {
    try {
        const result = await httpGet(url, {
            headers: {
                Accept: OPDS_PROGRESSION_MEDIA_TYPE,
            },
            timeout: 6000,
        }, undefined, locale);

        if (!result.isSuccess || result.statusCode !== 200 || !result.response) {
            debug("Progression GET failed", result.statusCode, result.statusMessage);
            return undefined;
        }

        const contentType = parseContentType(result.contentType || "");
        if (contentType !== ContentType.OpdsProgression && contentType !== ContentType.Json) {
            debug("Progression GET returned an unsupported content type", result.contentType);
            return undefined;
        }

        const payload = await result.response.text?.();
        if (!payload?.trim()) {
            return undefined;
        }

        const progression = parseOpdsProgressionDocument(JSON.parse(payload));
        if (!progression) {
            debug("Progression GET returned an invalid document");
        }
        return progression;
    } catch (err) {
        // Progression retrieval is optional and must never prevent reading.
        debug("Progression GET error", err);
        return undefined;
    }
};

export const putOpdsProgression = async (
    url: string,
    document: TOpdsProgressionPutDocument,
    locale?: keyof typeof availableLanguages,
): Promise<TOpdsProgressionPutResult> => {
    // Deliberately reconstruct the payload: title and references are valid in a
    // received document, but the float-only MVP must never upload either one.
    const payload: TOpdsProgressionPutDocument = {
        modified: document.modified,
        device: {
            id: document.device?.id,
            name: document.device?.name,
        },
        progression: document.progression,
    };

    if (!parseOpdsProgressionDocument(payload)) {
        return { kind: "invalid-document" };
    }

    try {
        const result = await httpPutWithAuth(url, {
            body: JSON.stringify(payload),
            headers: {
                Accept: OPDS_PROGRESSION_MEDIA_TYPE,
                "Content-Type": OPDS_PROGRESSION_MEDIA_TYPE,
            },
            timeout: 6000,
        }, undefined, locale);

        if (result.statusCode === 200 || result.statusCode === 201) {
            const contentType = parseContentType(result.contentType || "");
            if (
                !result.response
                || (contentType !== ContentType.OpdsProgression && contentType !== ContentType.Json)
            ) {
                return { kind: "invalid-response", statusCode: result.statusCode };
            }

            const responsePayload = await result.response.text?.();
            if (!responsePayload?.trim()) {
                return { kind: "invalid-response", statusCode: result.statusCode };
            }

            const responseDocument = parseSerializedOpdsProgressionDocument(responsePayload);
            if (!responseDocument) {
                return { kind: "invalid-response", statusCode: result.statusCode };
            }

            return {
                kind: "success",
                statusCode: result.statusCode,
                document: responseDocument,
            };
        }

        if (
            result.statusCode === 400
            || result.statusCode === 401
            || result.statusCode === 403
            || result.statusCode === 409
        ) {
            if (
                result.statusCode === 401
                && await forwardOpdsAuthenticationDocument(
                    result.response,
                    result.contentType,
                    result.responseUrl || url,
                )
            ) {
                return {
                    kind: "authentication-required",
                    statusCode: 401,
                    authenticationUrl: result.responseUrl || url,
                };
            }
            const problem = await tryParseProblemDetails(result.response);
            switch (result.statusCode) {
                case 400:
                    return { kind: "bad-request", statusCode: 400, problem };
                case 401:
                    return { kind: "unauthorized", statusCode: 401, problem };
                case 403:
                    return { kind: "forbidden", statusCode: 403, problem };
                case 409:
                    return { kind: "conflict", statusCode: 409, problem };
            }
        }

        if (typeof result.statusCode === "number" && result.statusCode >= 500) {
            return {
                kind: "server-error",
                statusCode: result.statusCode,
                problem: await tryParseProblemDetails(result.response),
            };
        }

        if (result.isNetworkError || typeof result.statusCode !== "number") {
            return {
                kind: "network-error",
                isTimeout: result.isTimeout === true,
            };
        }

        return { kind: "invalid-response", statusCode: result.statusCode };
    } catch (err) {
        // Progression upload is best-effort and must never prevent reading.
        debug("Progression PUT error", err);
        return { kind: "network-error", isTimeout: false };
    }
};
