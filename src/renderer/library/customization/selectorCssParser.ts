// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { AstRule, createParser } from "css-selector-parser";

const PROFILE_SCREEN_SCOPE_CLASS = "custom-profile-screen";
const parseSelector = createParser({
    strict: true,
    syntax: "latest",
});

const isThemeAncestor = (rule: AstRule): boolean => {
    const [body, theme] = rule.items;
    return (
        rule.items.length === 2 &&
        body.type === "TagName" &&
        body.name === "body" &&
        !body.namespace &&
        theme.type === "Attribute" &&
        theme.name === "data-theme" &&
        !theme.namespace &&
        !theme.caseSensitivityModifier &&
        (!theme.operator || (theme.operator === "=" && theme.value?.type === "String"))
    );
};

const targetsProfileScreen = (rule: AstRule): boolean => {
    let profileRoot: AstRule | undefined = rule;

    if (isThemeAncestor(rule)) {
        profileRoot = rule.nestedRule;
        // A missing combinator represents descendant whitespace in this AST.
        if (!profileRoot || profileRoot.combinator !== undefined) {
            return false;
        }
    } else if (rule.combinator !== undefined) {
        return false;
    }

    const firstItem = profileRoot.items[0];
    if (firstItem?.type !== "ClassName" || firstItem.name !== PROFILE_SCREEN_SCOPE_CLASS) {
        return false;
    }

    const firstNestedCombinator = profileRoot.nestedRule?.combinator;
    return !profileRoot.nestedRule || firstNestedCombinator === undefined || firstNestedCombinator === ">";
};

export const profileSelectorListTargetsProfileScreen = (selectorText: string): boolean => {
    try {
        const selector = parseSelector(selectorText);
        return selector.rules.length > 0 && selector.rules.every(targetsProfileScreen);
    } catch {
        return false;
    }
};
