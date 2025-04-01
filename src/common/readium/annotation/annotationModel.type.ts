// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import Ajv from "ajv";
import addFormats from "ajv-formats";

export interface IReadiumAnnotationSet {
    "@context": "http://www.w3.org/ns/anno.jsonld";
    id: string;
    type: "AnnotationSet";
    generator?: Generator;
    generated?: string;
    title?: string;
    about: About;
    items: IReadiumAnnotation[];
}

export interface IReadiumAnnotation {
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
        highlight?: "solid" | "underline" | "strikethrough" | "outline" | "bookmark";
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
            ISelector
            // ITextQuoteSelector
            // | ITextPositionSelector
            // | IFragmentSelector
        )>;
    };
}

export interface ISelector<T extends ISelector = undefined> {
    type: string;
    refinedBy?: T;
}

/**
{
    "type": "TextPositionSelector",
    "start": 50,
    "end": 55
} 
*/
export interface ITextPositionSelector extends ISelector {
    type: "TextPositionSelector",
    start: number,
    end: number,
}
export function isTextPositionSelector(a: any): a is ITextPositionSelector {
    return typeof a === "object" && a.type === "TextPositionSelector"
    && typeof a.start === "number"
    && typeof a.end === "number";
}

export interface ITextQuoteSelector extends ISelector {
    type: "TextQuoteSelector";
    exact: string;
    prefix: string;
    suffix: string;
}
export function isTextQuoteSelector(a: any): a is ITextQuoteSelector {
    return typeof a === "object" && a.type === "TextQuoteSelector"
    && typeof a.exact === "string"
    && typeof a.prefix === "string"
    && typeof a.suffix === "string";
}

export interface IProgressionSelector extends ISelector {
    type: "ProgressionSelector";
    value: number;
}
export function isProgressionSelector(a: any): a is IProgressionSelector {
    return typeof a === "object" && a.type === "ProgressionSelector"
    && typeof a.value === "number";
}

export interface ICssSelector<T extends ISelector = any> extends ISelector<T> {
    type: "CssSelector";
    value: string;
}
export function isCssSelector(a: any): a is ICssSelector<undefined> {
    return typeof a === "object" && a.type === "CssSelector"
    && typeof a.value === "string";
}

// not used anymore
// internal DOMRange selector not shared across annotation selector
// We prefer EPUB-CFI nowadays when official library will be choosen
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
//     return typeof a === "object"
//         && a.type === "DomRangeSelector"
//         && typeof a.startContainerElementCssSelector === "string"
//         && typeof a.startContainerChildTextNodeIndex === "number"
//         && typeof a.startOffset === "number"
//         && typeof a.endContainerElementCssSelector === "string"
//         && typeof a.endContainerChildTextNodeIndex === "number"
//         && typeof a.endOffset === "number";
// }

export interface IFragmentSelector extends ISelector {
    type: "FragmentSelector";
    conformsTo: string;
    value: string;
}
export function isFragmentSelector(a: any): a is IFragmentSelector {
    return typeof a === "object"
        && a.type === "FragmentSelector"
        && typeof a.conformsTo === "string"
        && typeof a.value === "string";
}

export interface ICFIFragmentSelector extends IFragmentSelector {
    conformsTo: "http://www.idpf.org/epub/linking/cfi/epub-cfi.html",
}
export function isCFIFragmentSelector(a: any): a is ICFIFragmentSelector {
    return isFragmentSelector(a)
        && a.conformsTo === "http://www.idpf.org/epub/linking/cfi/epub-cfi.html";
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

export const readiumAnnotationSetSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "IReadiumAnnotationSet",
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
                "$ref": "#/definitions/IReadiumAnnotation",
            },
        },
    },
    "required": ["@context", "id", "type", "about", "items"],
    "definitions": {
        "IReadiumAnnotation": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "IReadiumAnnotationSet",
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
                                        "$ref": "#/definitions/Selector",
                                    },
                                    // {
                                    //     "$ref": "#/definitions/ITextPositionSelector",
                                    // },
                                    // {
                                    //     "$ref": "#/definitions/IFragmentSelector",
                                    // },
                                ],
                            },
                        },
                    },
                    "required": ["source", "selector"],
                },
            },
            "required": ["@context", "id", "created", "type", "target"],
        },
        "Selector": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                },
            },
            "required": ["type"],
        },
        // "ITextQuoteSelector": {
        //     "type": "object",
        //     "properties": {
        //         "type": {
        //             "const": "TextQuoteSelector",
        //         },
        //         "exact": {
        //             "type": "string",
        //         },
        //         "prefix": {
        //             "type": "string",
        //         },
        //         "suffix": {
        //             "type": "string",
        //         },
        //     },
        //     "required": ["type", "exact", "prefix", "suffix"],
        // },
        // "ITextPositionSelector": {
        //     "type": "object",
        //     "properties": {
        //         "type": {
        //             "const": "TextPositionSelector",
        //         },
        //         "start": {
        //             "type": "number",
        //         },
        //         "end": {
        //             "type": "number",
        //         },
        //     },
        //     "required": ["type", "start", "end"],
        // },
        // "IFragmentSelector": {
        //     "type": "object",
        //     "properties": {
        //         "type": {
        //             "const": "FragmentSelector",
        //         },
        //         "conformsTo": {
        //             "type": "string",
        //         },
        //         "value": {
        //             "type": "string",
        //         },
        //     },
        //     "required": ["type", "conformsTo", "value"],
        // },
    },
};


export let __READIUM_ANNOTATION_AJV_ERRORS = "";
export function isIReadiumAnnotationSet(data: any): data is IReadiumAnnotationSet {

    const ajv = new Ajv();
    addFormats(ajv);

    const valid = ajv.validate(readiumAnnotationSetSchema, data);

    __READIUM_ANNOTATION_AJV_ERRORS = ajv.errors?.length ? JSON.stringify(ajv.errors, null, 2) : "";

    return valid;
}

