// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { profileSelectorListTargetsProfileScreenWithCustomParser } from "./selectorCustom";

export type TProfileCssParser = (cssText: string) => CSSRuleList;
export type TProfileSelectorValidator = (selectorText: string) => boolean;

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
    validateSelector: TProfileSelectorValidator = profileSelectorListTargetsProfileScreenWithCustomParser,
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
