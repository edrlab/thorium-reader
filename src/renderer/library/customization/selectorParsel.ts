// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { AST, parse, Token } from "parsel-js";

import {
    profileSelectorListTargetsProfileScreen,
    TProfileSelectorCompound,
    TProfileSelectorItem,
    TProfileSelectorList,
} from "./selectorPolicy";

const normalizeItem = (item: Token): TProfileSelectorItem => {
    switch (item.type) {
        case "attribute":
            return { type: "attribute", name: item.name, operator: item.operator };
        case "class":
            return { type: "class", name: item.name };
        case "type":
            return { type: "tag", name: item.name };
        default:
            return { type: "other" };
    }
};

const normalizeChain = (node: AST): TProfileSelectorCompound[] | undefined => {
    if (node.type === "list" || node.type === "relative") {
        return undefined;
    }

    if (node.type === "complex") {
        const left = normalizeChain(node.left);
        const right = normalizeChain(node.right);
        if (!left?.length || !right?.length || left[left.length - 1].combinator) {
            return undefined;
        }

        left[left.length - 1] = {
            ...left[left.length - 1],
            combinator: node.combinator,
        };
        return [...left, ...right];
    }

    const items = node.type === "compound" ? node.list : [node as Token];
    return [{ items: items.map(normalizeItem) }];
};

const normalizeSelectorList = (selector: AST): TProfileSelectorList | undefined => {
    const selectors = selector.type === "list" ? selector.list : [selector];
    const normalized = selectors.map(normalizeChain);

    return normalized.every((chain): chain is TProfileSelectorCompound[] => !!chain) ? normalized : undefined;
};

export const profileSelectorListTargetsProfileScreenWithParsel = (selectorText: string): boolean => {
    try {
        const selector = parse(selectorText);
        if (!selector) {
            return false;
        }

        const normalized = normalizeSelectorList(selector);
        return !!normalized && profileSelectorListTargetsProfileScreen(normalized);
    } catch {
        return false;
    }
};

