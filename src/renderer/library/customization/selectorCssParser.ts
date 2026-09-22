// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { AstRule, createParser } from "css-selector-parser";

import {
    profileSelectorListTargetsProfileScreen,
    TProfileSelectorCompound,
    TProfileSelectorItem,
} from "./selectorPolicy";

const parseSelector = createParser({
    strict: true,
    syntax: "latest",
});

const normalizeItem = (item: AstRule["items"][number]): TProfileSelectorItem => {
    switch (item.type) {
        case "Attribute":
            return { type: "attribute", name: item.name, operator: item.operator };
        case "ClassName":
            return { type: "class", name: item.name };
        case "TagName":
            return { type: "tag", name: item.name };
        default:
            return { type: "other" };
    }
};

const normalizeRule = (rule: AstRule): TProfileSelectorCompound[] => {
    const chain: TProfileSelectorCompound[] = [];
    let currentRule: AstRule | undefined = rule;

    while (currentRule) {
        chain.push({
            items: currentRule.items.map(normalizeItem),
            // This parser stores the combinator on the nested (right-hand)
            // rule and represents a descendant combinator as `undefined`.
            combinator: currentRule.nestedRule ? currentRule.nestedRule.combinator || " " : undefined,
        });
        currentRule = currentRule.nestedRule;
    }

    return chain;
};

export const profileSelectorListTargetsProfileScreenWithCssSelectorParser = (selectorText: string): boolean => {
    try {
        const selector = parseSelector(selectorText);
        return profileSelectorListTargetsProfileScreen(selector.rules.map(normalizeRule));
    } catch {
        return false;
    }
};

