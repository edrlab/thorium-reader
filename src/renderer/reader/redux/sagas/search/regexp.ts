// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/julmot/mark.js/blob/master/src/lib/regexpcreator.js#L157
// https://github.com/lodash/lodash/blob/master/escapeRegExp.js
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
// const reRegExpChar = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);
export function escapeRegExp(str: string) {
    return (str && reHasRegExpChar.test(str))
        ? str.replace(reRegExpChar, "\\$&")
        : (str || "");
}
