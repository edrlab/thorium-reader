// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import Ajv from "ajv";
import addFormats from "ajv-formats";

export interface IReadiumAnnotationModel {
    "@context": "http://www.w3.org/ns/anno.jsonld";
    id: string;
    created: string;
    modified?: string;
    type: "Annotation";
    creator: {
        id: string;
        type: "Person" | "Organization"
        name?: string;
    }
    body: {
        type: string;
        value: string;
        tag?: string;
        highlight?: "solid" | "underline" | "strikethrough" | "outline";
        color?: string;
        textDirection?: "ltr" | "rtl";
        language?: string;
        format?: string;
    };
    target: {
        source: string;
        meta?: {
            headings?: {
                level: number;
                txt: string;
            }[];
            page?: string;
        };
        selector: Array<(
            ITextQuoteSelector
            | IProgressionSelector
            // | IDomRangeSelector
            | IFragmentSelector
        )>;
    };
}

export interface ISelector<T> {
    type: string;
    refinedBy?: T;
}

export interface ITextQuoteSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "TextQuoteSelector";
    exact: string;
    prefix: string;
    suffix: string;
}
export function isTextQuoteSelector(a: any): a is ITextQuoteSelector {
    return a?.type === "TextQuoteSelector"
    && typeof a.exact === "string"
    && typeof a.prefix === "string"
    && typeof a.suffix === "string";
}

export interface ITextPositionSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "TextPositionSelector";
    start: number;
    end: number;
}
export function isTextPositionSelector(a: any): a is ITextPositionSelector {
    return a?.type === "TextPositionSelector"
    && typeof a.start === "number"
    && typeof a.end === "number";
}

export interface ICssSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "CssSelector",
    value: string,
}
export function isCssSelector(a: any): a is ICssSelector {
    return a?.type === "CssSelector"
    && typeof a.value === "string";
}

export interface IXPathSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "XPathSelector",
    value: string,
}
export function isXPathSelector(a: any): a is IXPathSelector {
    return a?.type === "XPathSelector"
    && typeof a.value === "string";
}

export interface IProgressionSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "ProgressionSelector";
    value: number;
}
export function isProgressionSelector(a: any): a is IProgressionSelector {
    return a?.type === "ProgressionSelector"
    && typeof a.value === "number";
}

export interface IRangeSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector | IXPathSelector | ICssSelector> {
    type: "RangeSelector",
    startSelector:  ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector | IXPathSelector | ICssSelector>,
    endSelector:  ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector | IXPathSelector | ICssSelector>,
}
export function isRangeSelector(a: any): a is IRangeSelector {
    return a?.type === "RangeSelector"
    && typeof a.startSelector?.type === "string"
    && typeof a.endSelector?.type === "string";
}

// export interface IDomRangeSelector {
//     type: "DomRangeSelector";
//     startContainerElementCssSelector: string;
//     startContainerChildTextNodeIndex: number;
//     startOffset: number;
//     endContainerElementCssSelector: string;
//     endContainerChildTextNodeIndex: number;
//     endOffset: number;
// }
// export function isDomRangeSelector(a: any): a is IDomRangeSelector {
//     return a?.type === "DomRangeSelector"
//         && typeof a.startContainerElementCssSelector === "string"
//         && typeof a.startContainerChildTextNodeIndex === "number"
//         && typeof a.startOffset === "number"
//         && typeof a.endContainerElementCssSelector === "string"
//         && typeof a.endContainerChildTextNodeIndex === "number"
//         && typeof a.endOffset === "number";
// }

export interface IFragmentSelector extends ISelector<ITextQuoteSelector | ITextPositionSelector | IFragmentSelector> {
    type: "FragmentSelector";
    conformsTo: string;
    value: string;
}
export function isFragmentSelector(a: any): a is IFragmentSelector {
    return a?.type === "FragmentSelector"
        && typeof a.conformsTo === "string"
        && typeof a.value === "string";
}

interface Generator {
    id: string;
    type: string;
    name: string;
    homepage?: string;
}

interface About {
    "dc:identifier"?: string[];
    "dc:format"?: string;
    "dc:title"?: string;
    "dc:publisher"?: string[];
    "dc:creator"?: string[];
    "dc:date"?: string;
}

export interface IReadiumAnnotationModelSet {
    "@context": "http://www.w3.org/ns/anno.jsonld";
    id: string;
    type: "AnnotationSet";
    generator?: Generator;
    generated?: string;
    title?: string;
    about: About;
    items: IReadiumAnnotationModel[];
}

export const readiumAnnotationModelSetJSONSchema3 = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "IReadiumAnnotationModelSet",
    "type": "object",
    "properties": {
        "@context": {
            "type": "string",
            "const": "http://www.w3.org/ns/anno.jsonld",
        },
        "id": {
            "type": "string",
            "format": "uri",
        },
        "type": {
            "type": "string",
            "const": "AnnotationSet",
        },
        "generator": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                },
                "type": {
                    "type": "string",
                },
                "name": {
                    "type": "string",
                },
                "homepage": {
                    "type": "string",
                    "nullable": true,
                },
            },
            "required": ["id", "type", "name"],
        },
        "generated": {
            "type": "string",
            "format": "date-time",
            "nullable": true,
        },
        "title": {
            "type": "string",
            "nullable": true,
        },
        "about": {
            "type": "object",
            "properties": {
                "dc:identifier": {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                    "nullable": true,
                },
                "dc:format": {
                    "type": "string",
                    "nullable": true,
                },
                "dc:title": {
                    "type": "string",
                    "nullable": true,
                },
                "dc:publisher": {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                    "nullable": true,
                },
                "dc:creator": {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                    "nullable": true,
                },
                "dc:date": {
                    "type": "string",
                    "nullable": true,
                },
            },
        },
        "items": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/IReadiumAnnotationModel",
            },
        },
    },
    "required": ["@context", "id", "type", "about", "items"],
    "definitions": {
        "IReadiumAnnotationModel": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "IReadiumAnnotationModelSet",
            "type": "object",
            "properties": {
                "@context": {
                    "type": "string",
                    "const": "http://www.w3.org/ns/anno.jsonld",
                },
                "id": {
                    "type": "string",
                    "format": "uri",
                },
                "created": {
                    "type": "string",
                    "format": "date-time",
                },
                "modified": {
                    "type": "string",
                    "nullable": true,
                    "format": "date-time",
                },
                "type": {
                    "type": "string",
                    "const": "Annotation",
                },
                "creator": {
                    "type": "object",
                    "nullable": true,
                    "properties": {
                        "id": {
                            "type": "string",
                            "format": "uri",
                        },
                        "type": {
                            "type": "string",
                            "enum": ["Person", "Organization"],
                        },
                        "name": {
                            "type": "string",
                            "nullable": true,
                        },
                    },
                    "required": ["id", "type"],
                },
                "body": {
                    "type": "object",
                    "nullable": true,
                    "properties": {
                        "type": {
                            "type": "string",
                            "const": "TextualBody",
                        },
                        "value": {
                            "type": "string",
                        },
                        "tag": {
                            "type": "string",
                            "nullable": true,
                        },
                        "highlight": {
                            "type": "string",
                            "enum": ["solid", "underline", "strikethrough", "outline"],
                            "nullable": true,
                        },
                        "format": {
                            "type": "string",
                            "nullable": true,
                        },
                        "color": {
                            "type": "string",
                            "nullable": true,
                        },
                        "textDirection": {
                            "type": "string",
                            "enum": ["ltr", "rtl"],
                            "nullable": true,
                        },
                        "language": {
                            "type": "string",
                            "nullable": true,
                        },
                    },
                    "required": ["type", "value"],
                },
                "target": {
                    "type": "object",
                    "properties": {
                        "source": {
                            "type": "string",
                        },
                        "meta": {
                            "type": "object",
                            "properties": {
                                "headings": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "level": {
                                                "type": "number",
                                            },
                                            "txt": {
                                                "type": "string",
                                            },
                                        },
                                        "required": ["level", "txt"],
                                    },
                                },
                                "page": {
                                    "type": "string",
                                    "nullable": true,
                                },
                            },
                        },
                        "selector": {
                            "type": "array",
                            "items": {
                                "oneOf": [
                                    {
                                        "$ref": "#/definitions/ITextQuoteSelector",
                                    },
                                    {
                                        "$ref": "#/definitions/IProgressionSelector",
                                    },
                                    {
                                        "$ref": "#/definitions/IDomRangeSelector",
                                    },
                                    {
                                        "$ref": "#/definitions/IFragmentSelector",
                                    },
                                ],
                            },
                        },
                    },
                    "required": ["source", "selector"],
                },
            },
            "required": ["@context", "id", "created", "type", "target"],
        },
        "ITextQuoteSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "TextQuoteSelector",
                },
                "exact": {
                    "type": "string",
                },
                "prefix": {
                    "type": "string",
                },
                "suffix": {
                    "type": "string",
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                    ],
                },
            },
            "required": ["type", "exact", "prefix", "suffix"],
        },
        "ITextPositionSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "TextQuoteSelector",
                },
                "start": {
                    "type": "number",
                },
                "end": {
                    "type": "number",
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                    ],
                },
            },
            "required": ["type", "start", "end"],
        },
        "IXpathSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "XPathSelector",
                },
                "value": {
                    "type": "string",
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                    ],
                },
            },
            "required": ["type", "value"],
        },
        "ICssSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "CssSelector",
                },
                "value": {
                    "type": "string",
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                    ],
                },
            },
            "required": ["type", "value"],
        },
        "IProgressionSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "ProgressionSelector",
                },
                "value": {
                    "type": "number",
                },
            },
            "required": ["type", "value"],
        },
        "IRangeSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "RangeSelector",
                },
                "startSelector": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                        {
                            "$ref": "#/definitions/IXPathSelector",
                        },
                        {
                            "$ref": "#/definitions/ICssSelector",
                        },
                    ],
                },
                "endSelector": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                        {
                            "$ref": "#/definitions/IXPathSelector",
                        },
                        {
                            "$ref": "#/definitions/ICssSelector",
                        },
                    ],
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                        {
                            "$ref": "#/definitions/IXPathSelector",
                        },
                        {
                            "$ref": "#/definitions/ICssSelector",
                        },
                    ],
                },
            },
            "required": [
                "type",
                "startSelector",
                "endSelector",
            ],
        },
        "IFragmentSelector": {
            "type": "object",
            "properties": {
                "type": {
                    "const": "FragmentSelector",
                },
                "conformsTo": {
                    "type": "string",
                },
                "value": {
                    "type": "string",
                },
                "refinedBy": {
                    "oneOf": [
                        {
                            "$ref": "#/definitions/ITextQuoteSelector",
                        },
                        {
                            "$ref": "#/definitions/ITextPositionSelector",
                        },
                        {
                            "$ref": "#/definitions/IFragmentSelector",
                        },
                        {
                            "$ref": "#/definitions/IXPathSelector",
                        },
                        {
                            "$ref": "#/definitions/ICssSelector",
                        },
                    ],
                },
            },
            "required": ["type", "conformsTo", "value"],
        },
    },
};


export let __READIUM_ANNOTATION_AJV_ERRORS = "";
export function isIReadiumAnnotationModelSet(data: any): data is IReadiumAnnotationModelSet {

    const ajv = new Ajv();
    addFormats(ajv);

    const valid = ajv.validate(readiumAnnotationModelSetJSONSchema3, data);

    __READIUM_ANNOTATION_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

