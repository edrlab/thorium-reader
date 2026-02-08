// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

const debug = debug_("r2:streamer#utils/json-schema-validate");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _cachedJsonSchemas: Record<string, any> = {};

export interface JsonSchemaValidationError {
    ajvSchemaPath: string;
    ajvDataPath?: string;
    ajvMessage: string;
    jsonPath?: string;
}

export function jsonSchemaValidate(
    jsonSchemasRootpath: string,
    jsonSchemasNames: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonToValidate: any): JsonSchemaValidationError[] | undefined {

    try {
        // tslint:disable-next-line:max-line-length
        // "^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?<extension>[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?<privateUse>x(-[A-Za-z0-9]{1,8})+))?)|(?<privateUse2>x(-[A-Za-z0-9]{1,8})+))$"
        // https://github.com/sebinsua/ietf-language-tag-regex
        // tslint:disable-next-line:max-line-length
        // https://stackoverflow.com/questions/7035825/regular-expression-for-a-language-tag-as-defined-by-bcp47/7036171#7036171
        //
        // https://regex101.com
        // PCRE PHP okay, but fail with others (JAVASCRIPT, PYTHON, GO)
        // because of named capturing groups (e.g. ?<grandfathered>)
        // => simply remove for Javascript RegExp,
        // or optionally call ajv.addFormat() with https://github.com/slevithan/xregexp "regexp" replacement?
        //
        // const regular = "(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang)";
        // tslint:disable-next-line:max-line-length
        // const irregular = "(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)";
        // const grandfathered = "(?<grandfathered>" + irregular + "|" + regular + ")";
        // const privateUse = "(?<privateUse>x(-[A-Za-z0-9]{1,8})+)";
        // const privateUse2 = "(?<privateUse2>x(-[A-Za-z0-9]{1,8})+)";
        // const singleton = "[0-9A-WY-Za-wy-z]";
        // const extension = "(?<extension>" + singleton + "(-[A-Za-z0-9]{2,8})+)";
        // const variant = "(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3})";
        // const region = "(?<region>[A-Za-z]{2}|[0-9]{3})";
        // const script = "(?<script>[A-Za-z]{4})";
        // const extlang = "(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2})";
        // const language = "(?<language>([A-Za-z]{2,3}(-" + extlang + ")?)|[A-Za-z]{4}|[A-Za-z]{5,8})";
        // tslint:disable-next-line:max-line-length
        // const langtag = "(" + language + "(-" + script + ")?" + "(-" + region + ")?" + "(-" + variant + ")*" + "(-" + extension + ")*" + "(-" + privateUse + ")?" + ")";
        // const languageTag = "(" + grandfathered + "|" + langtag + "|" + privateUse2 + ")";
        // // const bcp47RegEx = languageTag + "g";
        // const bcp47RegEx = "^" + languageTag + "$";
        // debug(bcp47RegEx);

        for (const jsonSchemaName of jsonSchemasNames) {
            const jsonSchemaName_ = jsonSchemaName.replace(/\//g, path.sep);
            const jsonSchemaPath = path.join(jsonSchemasRootpath, jsonSchemaName_ + ".schema.json");

            if (_cachedJsonSchemas[jsonSchemaPath]) {
                continue;
            }

            if (!fs.existsSync(jsonSchemaPath)) {
                debug("Skipping JSON SCHEMAS (not found): " + jsonSchemaPath);
                // _jsonSchemas = []; // to skip future attempts?
                return undefined;
            }
            let jsonSchemaStr = fs.readFileSync(jsonSchemaPath, { encoding: "utf8" });
            if (!jsonSchemaStr) {
                debug("File load fail: " + jsonSchemaPath);
                return undefined;
            }
            // Javascript named capturing groups (syntax works in PCRE PHP regular expressions)
            jsonSchemaStr = jsonSchemaStr.replace(/\?<grandfathered>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<privateUse>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<privateUse2>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<extension>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<variant>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<script>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<extlang>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<language>/g, "");
            jsonSchemaStr = jsonSchemaStr.replace(/\?<region>/g, "");
            // debug(jsonSchemaStr);
            if (jsonSchemaStr.indexOf("?<") >= 0) {
                debug("REGEX WARNING!!");
                // process.exit(-1);
                return undefined;
            }
            const jsonSchema = global.JSON.parse(jsonSchemaStr);

            // tslint:disable-next-line:no-string-literal
            debug(`JSON SCHEMA is now cached: ${jsonSchema["$id"]} (${jsonSchemaPath})`);

            _cachedJsonSchemas[jsonSchemaPath] = jsonSchema;
        }

        const ajv = new Ajv({
            allErrors: true,
            allowUnionTypes: true,
            coerceTypes: false,
            strict: true,
            strictRequired: "log",
            validateFormats: true,
            verbose: true,
        });
        addFormats(ajv);

        // const ajvValidate = ajv.compile({});
        // const ajvValid = ajvValidate(jsonObj);
        // if (!ajvValid) {
        //     debug(ajvValidate.errors);
        // }

        let idRoot: string | undefined;
        for (const jsonSchemaName of jsonSchemasNames) {
            const jsonSchemaPath = path.join(jsonSchemasRootpath, jsonSchemaName + ".schema.json");

            const jsonSchema = _cachedJsonSchemas[jsonSchemaPath];
            if (!jsonSchema) {
                debug("!jsonSchema?? " + jsonSchemaPath);
                return undefined;
            }

            if (!idRoot) {
                // tslint:disable-next-line:no-string-literal
                idRoot = jsonSchema["$id"];
            }
            // debug(jsonSchema);
            // tslint:disable-next-line:no-string-literal
            ajv.addSchema(jsonSchema, jsonSchema["$id"]); // returns 'ajv' for chaining
        }

        if (!idRoot) {
            debug("!idRoot?? ");
            return undefined;
        }

        // tslint:disable-next-line:no-string-literal
        const ajvValid = ajv.validate(idRoot, jsonToValidate);
        if (!ajvValid) {
            // const errorsText = ajv.errorsText();
            // if (errorsText) {
            //     debug(errorsText.split(", ").join("\n\n"));
            // }
            const errors = ajv.errors;
            if (errors) {
                const errs: JsonSchemaValidationError[] = [];

                for (const err of errors) {
                    const jsonPath = err.instancePath?.replace(/^\./, "").replace(/\[([0-9]+)\]/g, ".$1");
                    errs.push({
                        ajvDataPath: err.instancePath,
                        ajvMessage: err.message ? err.message : "",
                        ajvSchemaPath: err.schemaPath,
                        jsonPath,
                    });
                }

                return errs;
            }
        }
    } catch (err) {
        debug("JSON Schema VALIDATION PROBLEM.");
        debug(err);

        const errs: JsonSchemaValidationError[] = [];
        errs.push({
            ajvDataPath: typeof err?.toString === "function" ? err.toString() : "ajvDataPath",
            ajvMessage: typeof err?.message === "string" ? err.message : "ajvMessage",
            ajvSchemaPath: "ajvSchemaPath",
            jsonPath: "jsonPath",
        });
        return errs;
    }

    return undefined;
}
