// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const PROFILE_SCREEN_SCOPE_SELECTOR = ".custom-profile-screen";
const PROFILE_SCREEN_THEME_ANCESTOR =
    /^body\[data-theme(?:\s*=\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\]\s]+))?\s*\]\s+/;

export type TProfileCssParser = (cssText: string) => CSSRuleList;
export type TProfileSelectorValidator = (selectorText: string) => boolean;

// This handwritten implementation remains Thorium's runtime policy. The AST
// adapters in selectorCssParser.ts and selectorParsel.ts implement the same
// policy for comparison in tests.
//
// A selector list cannot be split with String.split(",") because commas are
// also valid inside constructs such as :is(...), :not(...), and attribute
// selectors. Track bracket and parenthesis depth so only top-level commas
// separate selectors.
const splitSelectorList = (selectorText: string): string[] => {
    const selectors: string[] = [];
    let currentSelector = "";
    let nestingDepth = 0;

    for (const character of selectorText) {
        if (character === "(" || character === "[") {
            nestingDepth++;
        } else if (character === ")" || character === "]") {
            nestingDepth--;
        }

        if (character === "," && nestingDepth === 0) {
            selectors.push(currentSelector);
            currentSelector = "";
        } else {
            currentSelector += character;
        }
    }
    selectors.push(currentSelector);

    return selectors;
};

/**
 * Accepts a selector only when its subject is the profile root or one of its
 * descendants. The selector may start with one `body[data-theme]` condition,
 * may add compound conditions to the root, and may enter the root with a
 * descendant or child combinator. A sibling combinator before entering the
 * root would target Thorium-owned UI and is therefore rejected.
 *
 * The caller passes `CSSStyleRule.selectorText`, so Chromium has already
 * parsed and normalized the selector. The check then runs in linear time:
 *
 * 1. Strip the only permitted ancestor, `body[data-theme]`, when present.
 * 2. Require the remaining selector to begin with the exact scope class and
 *    reject lookalike class names at the character immediately after it.
 * 3. Scan the suffix until its first top-level combinator. A small state
 *    machine tracks quotes, escapes, brackets, and parentheses so combinator
 *    characters inside attribute selectors or pseudo-class arguments do not
 *    affect the decision.
 * 4. Accept descendant (` `) and child (`>`) combinators because their target
 *    is inside the root. Reject sibling (`+`, `~`) and column (`||`)
 *    combinators because their target may be outside it. If there is no
 *    combinator, the selector targets the root compound itself and is safe.
 *
 * Only the first top-level combinator matters: after a descendant or child
 * combinator enters the profile subtree, later sibling relationships remain
 * inside that subtree.
 */
const selectorTargetsProfileScreen = (selector: string): boolean => {
    // Remove the optional, narrowly-defined theme ancestor.
    // For example, `body[data-theme="dark"] .custom-profile-screen h1` becomes
    // `.custom-profile-screen h1`. This permits theme-qualified rules while the
    // check below still requires the actual style target to be the profile
    // container or one of its descendants.
    const normalizedSelector = selector.trim().replace(PROFILE_SCREEN_THEME_ANCESTOR, "");
    if (!normalizedSelector.startsWith(PROFILE_SCREEN_SCOPE_SELECTOR)) {
        return false;
    }

    const suffix = normalizedSelector.slice(PROFILE_SCREEN_SCOPE_SELECTOR.length);
    if (!suffix) {
        return true;
    }
    if (![".", "#", ":", "[", ">", "+", "~", "|"].includes(suffix[0]) && !/\s/.test(suffix[0])) {
        // Reject lookalike class names such as `.custom-profile-screen-other`.
        return false;
    }

    // Find the first combinator outside attribute selectors and pseudo-class
    // arguments. A descendant or child combinator keeps every styled element
    // inside the profile root. A sibling combinator immediately after the root
    // compound selector can instead reach Thorium-owned elements beside it.
    let nestingDepth = 0;
    let quote: string | undefined;
    let escaped = false;
    for (let index = 0; index < suffix.length; index++) {
        const character = suffix[index];

        if (escaped) {
            escaped = false;
            continue;
        }
        if (character === "\\") {
            escaped = true;
            continue;
        }
        if (quote) {
            if (character === quote) {
                quote = undefined;
            }
            continue;
        }
        if (character === "\"" || character === "'") {
            quote = character;
            continue;
        }
        if (character === "(" || character === "[") {
            nestingDepth++;
            continue;
        }
        if (character === ")" || character === "]") {
            nestingDepth--;
            continue;
        }
        if (nestingDepth > 0) {
            continue;
        }
        if (character === "+" || character === "~" || character === "|") {
            return false;
        }
        if (character === ">") {
            return true;
        }
        if (/\s/.test(character)) {
            const rest = suffix.slice(index).trimStart();
            return !rest.startsWith("+") && !rest.startsWith("~") && !rest.startsWith("|");
        }
    }

    // No combinator means the selector only adds a class, ID, attribute, or
    // pseudo-class condition to the profile root itself.
    return true;
};

export const profileSelectorListTargetsProfileScreenWithOriginalParser: TProfileSelectorValidator =
    (selectorText) => splitSelectorList(selectorText).every(selectorTargetsProfileScreen);

// Walk every parsed CSS rule, including rules nested in @media, @supports, or
// similar grouping rules. Each style selector must explicitly target the
// stable profile container. Keyframes are rejected because their names belong
// to the document-wide CSS namespace and could override a Thorium animation.
const profileCssRulesAreScoped = (
    rules: CSSRuleList,
    validateSelector: TProfileSelectorValidator,
): boolean =>
    Array.from(rules).every((rule) => {
        if ("selectorText" in rule && typeof rule.selectorText === "string") {
            return validateSelector(rule.selectorText);
        }
        if ("cssRules" in rule && rule.cssRules) {
            return profileCssRulesAreScoped(rule.cssRules as CSSRuleList, validateSelector);
        }
        return false;
    });

const parseProfileCss = (cssText: string): CSSRuleList => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return sheet.cssRules;
};

export const profileCssIsSafeAndScoped = (
    cssText: string,
    parseCss: TProfileCssParser = parseProfileCss,
    validateSelector: TProfileSelectorValidator = profileSelectorListTargetsProfileScreenWithOriginalParser,
): boolean => {
    // DOMPurify sanitizes markup and element attributes, but it does not
    // provide stylesheet isolation. Block CSS that can load another
    // stylesheet or font, plus legacy executable URL forms, before parsing.
    if (
        /@(?:font-face|import)\b/i.test(cssText) ||
        /expression\s*\(/i.test(cssText) ||
        /url\s*\(\s*["']?\s*javascript:/i.test(cssText)
    ) {
        return false;
    }

    try {
        // Let Chromium's CSS parser interpret the stylesheet instead of using
        // regular expressions for complete CSS syntax. Invalid stylesheets or
        // selectors that escape the profile root cause the document to be
        // rejected rather than risking changes to Thorium's Library UI.
        return profileCssRulesAreScoped(parseCss(cssText), validateSelector);
    } catch {
        return false;
    }
};
