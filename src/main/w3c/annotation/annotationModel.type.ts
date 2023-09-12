// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IW3CAnnotationModel {
    "@context": string;
    id: string;
    created: string;
    modified: string;
    type: string;
    hash: string;
    body: {
        type: string;
        value: string;
        format: string;
        color: string;
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

interface About {
    "dc:identifier": string[];
    "dc:format": string;
    "dc:title": string;
    "dc:publisher": string;
    "dc:creator": string;
    "dc:date": string;
    "dc:source"?: string;
}

export interface IW3CAnnotationModelSet {
    "@context": string;
    id: string;
    type: string;
    generator: Generator;
    generated: string;
    label: string;
    about: About;
    total: number,
    items: IW3CAnnotationModel[];
}
