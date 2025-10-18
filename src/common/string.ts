// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const trimNormaliseWhitespaceAndCollapse = (str: string, doTrim: boolean = true) => {
    if (!str) {
        return str;
    }

    // no need for the multiline "m" RegExp modifier
    // node -e "const str='\n    \ra \t\t \n \t  b    x\ry   c  \t\n\n   \t\t d   w\nz1 2  3  \n Q\r'; const EDGE = '|'.repeat(4); const LINE = '#'.repeat(10); console.log(LINE); console.log(EDGE + str + EDGE); console.log(LINE); console.log(LINE); console.log(EDGE + str.replace(/[\t ]/g, '.') + EDGE); console.log(LINE); console.log(EDGE + str.trim().replace(/\s+/g, ' ') + EDGE); console.log(LINE); console.log(LINE); console.log(EDGE + str.trim().replace(/\s/g, '') + EDGE); console.log(LINE);"

    // .replace(/\t/g, " ")
    // .replace(/\n/gm, " ")

    // .replace(/\s*\n\s*/gm, "\0")
    // .replace(/\s\s*/g, " ")
    // .replace(/\0/g, "\n");

    return (doTrim ? str.trim() : str).replace(/\s+/g, " "); // replaces one-or-more whitespaces like tabs, line returns, etc. (including space themselves) to single space character
};
