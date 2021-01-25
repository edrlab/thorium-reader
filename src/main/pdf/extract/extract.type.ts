// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/ffalt/pdf.js-extract/blob/1df4d00a635ecaa53758fac4779496fcd2b8912a/lib/index.js
// https://github.com/ffalt/pdf.js-extract/blob/1df4d00a635ecaa53758fac4779496fcd2b8912a/lib/index.d.ts

export interface PDFExtractInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsCollectionPresent?: boolean;
    IsLinearized?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Subject?: string;
    Keywords?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
}

export interface PDFExtractResult {
    filename?: string;
    meta?: {
        info?: PDFExtractInfo
        metadata?: {
            _metadata: {
                [name: string]: string;
            }
        }
    };
    pages: Array<PDFExtractPage>;
    pdfInfo: {
        numPages: number;
        fingerprint: string;
    }
}

export interface PDFExtractPage {
    pageInfo: {
        num: number;
        scale: number;
        rotation: number;
        offsetX: number;
        offsetY: number;
        width: number;
        height: number;
    };
    links: Array<string>;
    content: Array<PDFExtractText>;
}

export interface PDFExtractText {
    x: number;
    y: number;
    str: string;
    dir: string;
    width: number;
    height: number;
    fontName: string;
}
