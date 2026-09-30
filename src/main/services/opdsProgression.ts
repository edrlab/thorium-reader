// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import Ajv from "ajv";
import addFormats from "ajv-formats";
import debug_ from "debug";

import {
    IOpdsProgressionDocument,
    OPDS_PROGRESSION_MEDIA_TYPE,
} from "readium-desktop/common/models/opdsProgression";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { httpGet } from "readium-desktop/main/network/http";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";

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
