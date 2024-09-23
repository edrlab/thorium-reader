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
        selector: (
            | {
                type: "TextQuoteSelector";
                exact: string;
                prefix: string;
                suffix: string;
                clean?: string;
            }
            | {
                type: "ProgressionSelector";
                value: number;
            }
            | {
                type: "DomRangeSelector";
                startContainerElementCssSelector: string;
                startContainerChildTextNodeIndex: number;
                startOffset: number;
                endContainerElementCssSelector: string;
                endContainerChildTextNodeIndex: number;
                endOffset: number;
            }
            | {
                type: "FragmentSelector";
                conformsTo: string;
                value: string;
            }
        )[];
    };
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
