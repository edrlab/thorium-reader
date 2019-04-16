// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const fontSize: string[] = [
    "75%",
    "87.5%",
    "100%",
    "112.5%",
    "137.5%",
    "150%",
    "162.5%",
    "175%",
    "200%",
    "225%",
    "250%",
];

export const pageMargins: string[] = [
    "0.5",
    "0.75",
    "1",
    "1.25",
    "1.5",
    "1.75",
    "2",
];

export const wordSpacing: string[] = [
    "0",
    "0.0675rem",
    "0.125rem",
    "0.1875rem",
    "0.25rem",
    "0.3125rem",
    "0.375rem",
    "0.4375rem",
    "0.5rem",
    "1rem",
];

export const letterSpacing: string[] = [
    "0",
    "0.0675rem",
    "0.125rem",
    "0.1875rem",
    "0.25rem",
    "0.3125rem",
    "0.375rem",
    "0.4375rem",
    "0.5rem",
];

export const paraSpacing: string[] = [
    "0",
    "0.5rem",
    "1rem",
    "1.25rem",
    "1.5rem",
    "2rem",
    "2.5rem",
    "3rem",
];

export const lineHeight: string[] = [
    "1",
    "1.125",
    "1.25",
    "1.35",
    "1.5",
    "1.65",
    "1.75",
    "2",
];

const optionsValues = {
    fontSize,
    pageMargins,
    wordSpacing,
    letterSpacing,
    paraSpacing,
    lineHeight,
};

export default optionsValues as {[name: string]: string[]};
