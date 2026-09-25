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

/**
 * Verifies that one selector from the comma-separated selector list targets
 * the profile root or something contained by it.
 *
 * `css-selector-parser` represents a selector from left to right as linked
 * `AstRule` nodes. The next compound is stored in `nestedRule`, and the
 * relationship to it is stored on that nested node. For example:
 *
 * `.custom-profile-screen > section`
 *     profile rule -> nested section rule with `combinator: ">"`
 *
 * Descendant whitespace is represented by an undefined combinator. This is
 * different from an absent `nestedRule`: both have an undefined combinator,
 * but the former targets a descendant and the latter targets the root itself.
 */
const targetsProfileScreen = (rule: AstRule): boolean => {
    let profileRoot: AstRule | undefined = rule;

    if (isThemeAncestor(rule)) {
        // `body[data-theme]` is only a permitted ancestor qualifier. Require
        // an actual following profile-root compound connected by descendant
        // whitespace; explicit child or sibling relationships are rejected.
        profileRoot = rule.nestedRule;
        if (!profileRoot || profileRoot.combinator !== undefined) {
            return false;
        }
    } else if (rule.combinator !== undefined) {
        // The first rule in a parsed selector should not itself have a
        // combinator. Fail closed if the AST does not have that shape.
        return false;
    }

    // The profile class must be the first condition in its compound. This
    // rejects ancestors, universal selectors, and lookalike class names.
    const firstItem = profileRoot.items[0];
    if (firstItem?.type !== "ClassName" || firstItem.name !== PROFILE_SCREEN_SCOPE_CLASS) {
        return false;
    }

    // With no nested rule, the selector targets the profile root itself.
    if (!profileRoot.nestedRule) {
        return true;
    }

    // The first relationship after the root may enter its subtree using
    // descendant whitespace (undefined in this AST) or a child combinator.
    // Sibling and column combinators could escape the root and are rejected.
    const combinator = profileRoot.nestedRule.combinator;
    return combinator === undefined || combinator === ">";
};

export const profileSelectorListTargetsProfileScreen = (selectorText: string): boolean => {
    try {
        const selector = parseSelector(selectorText);
        return selector.rules.length > 0 && selector.rules.every(targetsProfileScreen);
    } catch {
        return false;
    }
};
