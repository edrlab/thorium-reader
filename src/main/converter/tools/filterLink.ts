// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { trimNormaliseWhitespaceAndCollapse } from "readium-desktop/common/string";
import { TLinkMayBeOpds } from "../type/link.type";
import { ILinkFilter } from "../type/linkFilter.interface";

export function filterRelLink(
    ln: TLinkMayBeOpds,
    filter: ILinkFilter) {

    let relFlag = false;
    if (filter.rel) {
        if (ln.Rel?.length) {
            ln.Rel.forEach((rel) => {
                if (Array.isArray(filter.rel) && filter.rel.includes(rel)) {
                    relFlag = true;
                } else if (filter.rel instanceof RegExp && filter.rel.test(rel)) {
                    relFlag = true;
                } else if (trimNormaliseWhitespaceAndCollapse(rel) === filter.rel) {
                    relFlag = true;
                }
            });
        }
    }

    return relFlag;
}

export function filterTypeLink(
    ln: TLinkMayBeOpds,
    filter: ILinkFilter) {

    let typeFlag = false;
    if (ln.TypeLink) {

        const typeArray = [...new Set(trimNormaliseWhitespaceAndCollapse(ln.TypeLink).split(";"))];
        if (Array.isArray(filter.type) && typeArray.reduce((pv, cv) => pv && (filter.type as Array<string>).includes(cv), true)) {
            typeFlag = true;
        } else if (filter.type instanceof RegExp && typeArray.reduce((pv, cv) => pv && (filter.type as RegExp).test(cv), true)) {
            typeFlag = true;
        } else if (typeof filter.type === "string") {

            // compare typeSet and filterSet
            const filterSet = new Set(filter.type.split(";"));

            typeFlag = true;
            for (const i of filterSet) {
                if (!typeArray.includes(i)) {
                    typeFlag = false;
                    break;
                }
            }
        }
    } else {
        typeFlag = true; // no type provided so we bypass the test
    }

    return typeFlag;
}
