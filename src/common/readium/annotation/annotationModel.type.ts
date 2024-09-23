// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IReadiumAnnotationModel {
    "@context": string;
    id: string;
    created: string;
    modified: string;
    type: string;
    hash: string;
    body: {
        type: string;
        value: string;
        tag?: string;
        highlight?: "solid" | "underline" | "strikethrough" | "outline";
        format?: string;
        color?: string;
        textDirection?: string;
        language?: string;
    };
    target: {
        source: string;
        meta: {
            headings: {
                level: number;
                txt: string;
            }[];
            page: string;
        };
        selector: Array<(
            ITextQuoteSelector
            | IProgressionSelector
            | IDomRangeSelector
            | IFragmentSelector
        )>;
    };
}

export interface ITextQuoteSelector {
    type: "TextQuoteSelector";
    exact: string;
    prefix: string;
    suffix: string;
    clean ?: string;
}
export function isTextQuoteSelector(a: any): a is ITextQuoteSelector {
    return typeof a === "object" && a.type === "TextQuoteSelector"
    && typeof a.exact === "string"
    && typeof a.prefix === "string"
    && typeof a.suffix === "string";
}

export interface IProgressionSelector {
    type: "ProgressionSelector";
    value: number;
}
export function isProgressionSelector(a: any): a is IProgressionSelector {
    return typeof a === "object" && a.type === "ProgressionSelector"
    && typeof a.value === "number";
}

export interface IDomRangeSelector {
    type: "DomRangeSelector";
    startContainerElementCssSelector: string;
    startContainerChildTextNodeIndex: number;
    startOffset: number;
    endContainerElementCssSelector: string;
    endContainerChildTextNodeIndex: number;
    endOffset: number;
}
export function isDomRangeSelector(a: any): a is IDomRangeSelector {
    return typeof a === "object"
        && a.type === "DomRangeSelector"
        && typeof a.startContainerElementCssSelector === "string"
        && typeof a.startContainerChildTextNodeIndex === "number"
        && typeof a.startOffset === "number"
        && typeof a.endContainerElementCssSelector === "string"
        && typeof a.endContainerChildTextNodeIndex === "number"
        && typeof a.endOffset === "number";
}

export interface IFragmentSelector {
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



interface Generator {
    id: string;
    type: string;
    name: string;
    homepage: string;
}

export interface IReadiumAnnotationSetAboutView {
    identiferArrayString: string[];
    mimeType: string;
    title: string;
    publisher: string[];
    creator: string[];
    publishedAt: string;
    source: string;
}

interface About {
    "dc:identifier": string[];
    "dc:format": string;
    "dc:title": string;
    "dc:publisher": string[];
    "dc:creator": string[];
    "dc:date": string;
    "dc:source"?: string;
}

export interface IReadiumAnnotationModelSet {
    "@context": string;
    id: string;
    type: string;
    generator: Generator;
    generated: string;
    label: string;
    about: About;
    total: number,
    items: IReadiumAnnotationModel[];
}


export function isIReadiumAnnotationModelSet(a: any): a is IReadiumAnnotationModelSet {

    return typeof a === "object";
}

