// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { parseDOM, serializeDOM } from "./dom";
import { IEventPayload_R2_EVENT_READIUMCSS } from "./events";
import { IwidthHeight } from "./fxl";
import { READIUM_CSS_URL_PATH } from "./readium-css-settings";
import { READIUM2_ELECTRON_HTTP_PROTOCOL, convertCustomSchemeToHttpUrl } from "./sessions";
import {
    CLASS_VWM,
    CLASS_PAGINATED, ROOT_CLASS_FIXED_LAYOUT, ROOT_CLASS_INVISIBLE_MASK,
    ROOT_CLASS_INVISIBLE_MASK_REMOVED, ROOT_CLASS_MATHJAX, ROOT_CLASS_NO_FOOTNOTES, ROOT_CLASS_NO_RUBY,
    ROOT_CLASS_REDUCE_MOTION, WebViewSlotEnum, audioCssStyles, focusCssStyles, footnotesCssStyles,
    mediaOverlaysCssStyles, readPosCssStyles, scrollBarCssStyles, selectionCssStyles,
    targetCssStyles, ttsCssStyles, visibilityMaskCssStyles,
    ENABLE_VISIBILITY_MASK,
    DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS,
} from "./styles";

export const READIUM2_BASEURL_ID = "r2_BASEURL_ID";

// now match with :root[style*="readium-night-on"]
// const CSS_CLASS_DARK_THEME = "mdc-theme--dark";

// tslint:disable-next-line:max-line-length
// https://github.com/readium/readium-css/blob/develop/docs/CSS16-internationalization.md
// tslint:disable-next-line:max-line-length
// https://github.com/readium/readium-css/blob/develop/docs/CSS12-user_prefs.md#user-settings-can-be-language-specific

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const debug = debug_("r2:navigator#electron/common/readium-css-inject");

// import { ReadiumElectronWebviewWindow } from "../renderer/webview/state";
// (global.window as ReadiumElectronWebviewWindow).READIUM2.DEBUG_VISUALS
function isDEBUG_VISUALS(documant: Document): boolean {
    if (!IS_DEV) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (documant.defaultView && (documant.defaultView as any).READIUM2 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (documant.defaultView as any).READIUM2.DEBUG_VISUALS) {
        return true;
    }
    return false;
}

export function isDocVertical(documant: Document): boolean {
    if (!documant || !documant.documentElement) {
        return false;
    }

    // let vertical = false;

    // let langAttr = documant.documentElement.getAttribute("lang");
    // if (!langAttr) {
    //     langAttr = documant.documentElement.getAttribute("xml:lang");
    // }
    // if (!langAttr) {
    //     langAttr = documant.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
    // }
    // if (langAttr &&
    //     (langAttr === "zh" || langAttr.startsWith("zh-") ||
    //     langAttr === "ja" || langAttr.startsWith("ja-") ||
    //     langAttr === "ko" || langAttr.startsWith("ko-"))) {
    //     // foundLang = true;
    //     vertical = true;
    // }

    // return vertical;

    return false;
}

export function isDocRTL(documant: Document): boolean {
    if (!documant || !documant.documentElement) {
        return false;
    }

    let rtl = false;

    let foundDir = false;

    let dirAttr = documant.documentElement.getAttribute("dir");
    if (dirAttr === "rtl") {
        foundDir = true;
        rtl = true;
    }
    if (!rtl && documant.body) {
        dirAttr = documant.body.getAttribute("dir");
        if (dirAttr === "rtl") {
            foundDir = true;
            rtl = true;
        }
    }

    // let foundLang = false;

    if (!rtl) {
        let langAttr = documant.documentElement.getAttribute("lang");
        if (!langAttr) {
            langAttr = documant.documentElement.getAttribute("xml:lang");
        }
        if (!langAttr) {
            langAttr = documant.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
        }
        if (langAttr &&
            (langAttr === "ar" || langAttr.startsWith("ar-") ||
            langAttr === "he" || langAttr.startsWith("he-") ||
            langAttr === "fa" || langAttr.startsWith("fa-"))

            // https://github.com/edrlab/thorium-reader/pull/3027
            // langAttr === "zh-Hant" || langAttr === "zh-TW"
            ) {
            // foundLang = true;
            rtl = true;
        }
    }
    if (rtl) {
        if (!foundDir) {
            documant.documentElement.setAttribute("dir", "rtl");
        }
        // really?
        // if (!foundLang) {
        //     documant.documentElement.setAttribute("lang", "ar");
        //     // documant.documentElement.setAttributeNS("http://www.w3.org/XML/1998/", "lang", "ar");
        //     documant.documentElement.setAttribute("xml:lang", "ar");
        // }
    }
    return rtl;
}

const isDocJapanese = (documant: Document) => {

    let isJA = false;
    let langAttr = documant.documentElement.getAttribute("lang");
    if (!langAttr) {
        langAttr = documant.documentElement.getAttribute("xml:lang");
    }
    if (!langAttr) {
        langAttr = documant.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
    }
    if (langAttr &&
        (langAttr === "ja" || langAttr.startsWith("ja-"))
    ) {
        isJA = true;
    }
    return isJA;
};

export const isDocCJK = (documant: Document) => {

    let isCJK = false;
    let langAttr = documant.documentElement.getAttribute("lang");
    if (!langAttr) {
        langAttr = documant.documentElement.getAttribute("xml:lang");
    }
    if (!langAttr) {
        langAttr = documant.documentElement.getAttributeNS("http://www.w3.org/XML/1998/", "lang");
    }
    if (langAttr &&
        (langAttr === "ja" || langAttr.startsWith("ja-") ||
        langAttr === "zh" || langAttr.startsWith("zh-") ||
        langAttr === "ko" || langAttr.startsWith("ko-"))
    ) {
        isCJK = true;
    }
    return isCJK;
};

export function isPaginated(documant: Document): boolean {
    return documant && documant.documentElement &&
        documant.documentElement.classList.contains(CLASS_PAGINATED);
}

// see comments below for readiumCSSSet() isVerticalWritingMode and isRTL arguments
// export function isVerticalWritingMode(documant: Document): boolean {
//     return documant && documant.documentElement &&
//         documant.documentElement.classList.contains(CLASS_VWM);
// }

// tslint:disable-next-line:max-line-length
// https://github.com/readium/readium-css/blob/develop/docs/CSS12-user_prefs.md
// tslint:disable-next-line:max-line-length
// https://github.com/readium/readium-css/blob/develop/docs/ReadiumCSS-user_variables.css
// tslint:disable-next-line:max-line-length
// https://github.com/readium/readium-css/blob/develop/docs/CSS19-api.md#user-settings
export function readiumCSSSet(
    documant: Document,
    messageJson: IEventPayload_R2_EVENT_READIUMCSS,
    isVerticalWritingMode: boolean, isRTL: boolean, // obtained from live DOM getComputedStyle() see readium-css.ts (preload.ts computeVerticalRTL() / isVerticalWritingMode() and re-call to readiumCSS() ), otherwise from statically from dir and land in readiumCssTransformHtml() see here
) {

    if (!messageJson) {
        return;
    }

    if (!documant || !documant.documentElement) {
        return;
    }

    if (!messageJson.urlRoot) {
        // can be "null" with data: URL (such as audiobooks HTML template)
        // let origin = win.location.origin;
        // let href = win.location.href;
        const baseEl = documant.getElementById(READIUM2_BASEURL_ID);
        if (baseEl) {
            const baseUrl = baseEl.getAttribute("href");
            if (baseUrl) {
                let u = baseUrl;
                if (baseUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                    u = convertCustomSchemeToHttpUrl(baseUrl);
                }
                u = u.replace(/\/pub\/.*/, "");
                messageJson.urlRoot = u;
            }
        }
    }
    if (!messageJson.urlRoot) {
        const elBefore = documant.getElementById("ReadiumCSS-before");
        if (elBefore) {
            const elHref = elBefore.getAttribute("href");
            if (elHref) {
                const iHref = elHref.indexOf("/" + READIUM_CSS_URL_PATH);
                if (iHref >= 0) {
                    messageJson.urlRoot = elHref.substring(0, iHref);
                }
            }
        }
    }
    if (IS_DEV) {
        debug("_____ readiumCssJson.urlRoot (readiumCSSSet()): ", messageJson.urlRoot);
    }

    const docElement = documant.documentElement;

    if (messageJson.isFixedLayout) {
        // see visibilityMaskCssStyles
        docElement.classList.add(ROOT_CLASS_FIXED_LAYOUT);
        return; // exit early
    }

    const setCSS = messageJson.setCSS;
    if (!setCSS) {

        docElement.classList.remove(ROOT_CLASS_NO_FOOTNOTES);
        docElement.classList.remove(ROOT_CLASS_NO_RUBY);

        docElement.removeAttribute("data-readiumcss");
        removeAllCSS(documant);
        // removeAllCSSInline(documant);

        // This is always false, see 'if (messageJson.isFixedLayout)' returned code branch, above
        // if (messageJson.isFixedLayout) {
        //     docElement.style.overflow = "hidden";
        // } else {
        //     docElement.style.overflow = "auto";
        // }
        // see https://github.com/edrlab/thorium-reader/issues/1535
        // "auto" fails! ("revert", "inherit", etc. work)
        // docElement.style.overflow = "visible";

        const toRemove: string[] = [];
        for (let i = 0; i < docElement.style.length; i++) {
            const item = docElement.style.item(i);
            if (item.indexOf("--USER__") === 0) {
                toRemove.push(item);
            }
        }
        toRemove.forEach((item) => {
            docElement.style.removeProperty(item);
        });

        // docElement.classList.remove(CSS_CLASS_DARK_THEME);

        return;
    }

    if (isVerticalWritingMode) {
        docElement.classList.add(CLASS_VWM);
        setCSS.paged = false; // force disabled column pagination (too many issues)
    }

    if (docElement.hasAttribute("data-readiumcss")) {
        let reset = false;

        const isVWM = docElement.hasAttribute("data-rss-isVWM");
        if (isVWM !== isVerticalWritingMode) {
            reset = true;
            if (isVWM) {
                docElement.removeAttribute("data-rss-isVWM");
            }
            // else {
            //     docElement.setAttribute("data-rss-isVWM", "true");
            // }
        }

        const isR = docElement.hasAttribute("data-rss-isRTL");
        if (isR !== isRTL) {
            reset = true;
            if (isR) {
                docElement.removeAttribute("data-rss-isRTL");
            }
            // else {
            //     docElement.setAttribute("data-rss-isRTL", "true");
            // }
        }

        if (reset) {
            docElement.removeAttribute("data-readiumcss");
            removeAllCSS(documant);
        }
    }

    if (!docElement.hasAttribute("data-readiumcss")) {
        docElement.setAttribute("data-readiumcss", "yes");

        if (isVerticalWritingMode) {
            docElement.setAttribute("data-rss-isVWM", "true");
        }
        // else {
        //     docElement.removeAttribute("data-rss-isVWM");
        // }

        if (isRTL) {
            docElement.setAttribute("data-rss-isRTL", "true");
        }
        // else {
        //     docElement.removeAttribute("data-rss-isRTL");
        // }

        let needsDefaultCSS = true;

        // Not in XMLDOM :(
        // if (documant.head && documant.head.childElementCount) {
        //     let elem = documant.head.firstElementChild;
        //     while (elem) {
        //         // ...
        //         elem = elem.nextElementSibling;
        //     }
        // }
        if (documant.head && documant.head.childNodes && documant.head.childNodes.length) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < documant.head.childNodes.length; i++) {
                const child = documant.head.childNodes[i];
                if (child.nodeType === 1) { // Node.ELEMENT_NODE
                    const element = child as Element;
                    if ((element.localName && element.localName.toLowerCase() === "style") ||
                        (element.getAttribute &&
                            (element.getAttribute("rel") === "stylesheet" ||
                                element.getAttribute("type") === "text/css" ||
                                (element.getAttribute("src") &&
                                    /\.css$/i.test(element.getAttribute("src") as string))))) {
                        needsDefaultCSS = false;
                        break;
                    }
                }
            }
        }

        if (needsDefaultCSS && documant.body) {
            // Not in XMLDOM :(
            // querySelector("*[style]");
            const styleAttr = documant.body.getAttribute("style");
            if (styleAttr) {
                needsDefaultCSS = false;
            }
        }

        const isCJK = isDocCJK(documant);
        const custom = isVerticalWritingMode && isCJK ?
            "cjk-vertical/" : (isCJK ?
                "cjk-horizontal/" : (isRTL ?
                    "rtl/" : ""));
        const urlRoot = messageJson.urlRoot + "/" + READIUM_CSS_URL_PATH + "/" + custom;

        appendCSS(documant, "before", urlRoot);
        if (needsDefaultCSS) {
            appendCSS(documant, "default", urlRoot);
        }
        appendCSS(documant, "after", urlRoot);
    }

    if (isDEBUG_VISUALS(documant)) {
        debug("---- setCSS -----");
        debug(setCSS);
        debug("-----");
    }

    if (setCSS.noRuby) {
        docElement.classList.add(ROOT_CLASS_NO_RUBY);
    } else {
        docElement.classList.remove(ROOT_CLASS_NO_RUBY);
    }

    if (setCSS.noFootnotes) {
        docElement.classList.add(ROOT_CLASS_NO_FOOTNOTES);
    } else {
        docElement.classList.remove(ROOT_CLASS_NO_FOOTNOTES);
    }

    if (setCSS.noTemporaryNavTargetOutline) {
        docElement.classList.add(DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS);
    } else {
        docElement.classList.remove(DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS);
    }

    if (setCSS.mathJax) {
        docElement.classList.add(ROOT_CLASS_MATHJAX);
    } else {
        docElement.classList.remove(ROOT_CLASS_MATHJAX);
    }

    if (setCSS.reduceMotion) {
        docElement.classList.add(ROOT_CLASS_REDUCE_MOTION);
    } else {
        docElement.classList.remove(ROOT_CLASS_REDUCE_MOTION);
    }

    // if (setCSS.night) {
    //     // documant.body
    //     docElement.classList.add(CSS_CLASS_DARK_THEME);
    // } else {
    //     // documant.body
    //     docElement.classList.remove(CSS_CLASS_DARK_THEME);
    // }

    const needsAdvanced = true; // textAlign, bodyHyphens, fontSize, etc.

    // readium-advanced-on | readium-advanced-off
    docElement.style.setProperty("--USER__advancedSettings",
        needsAdvanced ? "readium-advanced-on" : "readium-advanced-off");

    // readium-darken-on | readium-darken-off
    if (typeof setCSS.darken === "undefined") {
        docElement.style.removeProperty("--USER__darkenFilter");
    } else {
        docElement.style.setProperty("--USER__darkenFilter",
            setCSS.darken ? "readium-darken-on" : "readium-darken-off");
    }

    // readium-invert-on | readium-invert-off
    if (typeof setCSS.invert === "undefined") {
        docElement.style.removeProperty("--USER__invertFilter");
    } else {
        docElement.style.setProperty("--USER__invertFilter",
            setCSS.invert ? "readium-invert-on" : "readium-invert-off");
    }

    // readium-default-on | readium-sepia-on | readium-night-on
    docElement.style.setProperty("--USER__appearance",
        setCSS.sepia ? "readium-sepia-on" :
        (setCSS.night ? "readium-night-on" : "readium-default-on"));

    // readium-paged-on | readium-scroll-on
    docElement.style.setProperty("--USER__view",
        setCSS.paged ? "readium-paged-on" : "readium-scroll-on");

    // see visibilityMaskCssStyles
    if (setCSS.paged) {
        // see https://github.com/edrlab/thorium-reader/issues/1535
        // docElement.style.overflow = "hidden";
        // "auto" fails! ("revert", "inherit", etc. work)
        // docElement.style.overflow = "visible";
        // docElement.style.overflowX = "hidden";
        // docElement.style.overflowY = "visible";
        docElement.classList.add(CLASS_PAGINATED);
    } else {
        // docElement.style.overflow = "auto";
        // docElement.style.overflowX = "auto";
        // docElement.style.overflowY = "auto";
        docElement.classList.remove(CLASS_PAGINATED);
    }

    const defaultPublisherFont = !setCSS.font || setCSS.font === "DEFAULT";

    const a11yNormalize = ((typeof setCSS.a11yNormalize !== "undefined") ?
        (setCSS.a11yNormalize ? "readium-a11y-on" : "readium-a11y-off") :
        "readium-a11y-off" // will remove, because undefined
        );

    const needsFontOverride = a11yNormalize === "readium-a11y-on" || !defaultPublisherFont;

    // readium-font-on | readium-font-off
    docElement.style.setProperty("--USER__fontOverride",
        needsFontOverride ? "readium-font-on" : "readium-font-off");

    // readium-a11y-on | readium-a11y-off
    if (typeof setCSS.a11yNormalize === "undefined") {
        docElement.style.removeProperty("--USER__a11yNormalize");
    } else {
        docElement.style.setProperty("--USER__a11yNormalize", a11yNormalize);
    }

    if (defaultPublisherFont) {
        docElement.style.removeProperty("--USER__fontFamily");
    } else {
        const font = setCSS.font;
        let fontValue = "";
        if (font === "DUO" || font === "IA Writer Duospace") {
            fontValue = "IA Writer Duospace";
        } else if (font === "DYS" || font === "AccessibleDfa" || font === "AccessibleDfA") {
            fontValue = "AccessibleDfA";
        } else if (font === "OLD" || font === "oldStyleTf") {
            fontValue = "var(--RS__oldStyleTf)";
        } else if (font === "MODERN" || font === "modernTf") {
            fontValue = "var(--RS__modernTf)";
        } else if (font === "SANS" || font === "sansTf") {
            fontValue = "var(--RS__sansTf)";
        } else if (font === "HUMAN" || font === "humanistTf") {
            fontValue = "var(--RS__humanistTf)";
        } else if (font === "MONO" || font === "monospaceTf") {
            fontValue = "var(--RS__monospaceTf)";
        } else if (font === "JA" || font === "serif-ja") {
            fontValue = "var(--RS__serif-ja)";
        } else if (font === "JA-SANS" || font === "sans-serif-ja") {
            fontValue = "var(--RS__sans-serif-ja)";
        } else if (font === "JA-V" || font === "serif-ja-v") {
            fontValue = "var(--RS__serif-ja-v)";
        } else if (font === "JA-V-SANS" || font === "sans-serif-ja-v") {
            fontValue = "var(--RS__sans-serif-ja-v)";
        } else if (typeof font === "string") {
            fontValue = font;
        }
        if (fontValue) {
            docElement.style.setProperty("--USER__fontFamily", fontValue);
        } else {
            docElement.style.removeProperty("--USER__fontFamily");
        }
    }
    const fontSizeTrimmed = setCSS.fontSize?.trim();
    if (fontSizeTrimmed && fontSizeTrimmed !== "0" && fontSizeTrimmed !== "100%") {
        docElement.style.setProperty("--USER__fontSize", fontSizeTrimmed);
        try {
            docElement.style.setProperty("--USER__fontXSizeX", `${fontSizeTrimmed.endsWith("%") ? (parseFloat(fontSizeTrimmed.replace("%", "")) / 100) : parseFloat(fontSizeTrimmed)}`);
        } catch (_e) {
            // ignore
            docElement.style.setProperty("--USER__fontXSizeX", "1.0");
        }
    } else {
        docElement.style.removeProperty("--USER__fontSize");
        docElement.style.setProperty("--USER__fontXSizeX", "1.0");
    }

    if (setCSS.lineHeight && setCSS.lineHeight.trim() !== "0") {
        docElement.style.setProperty("--USER__lineHeight", setCSS.lineHeight);
    } else {
        docElement.style.removeProperty("--USER__lineHeight");
    }

    if (setCSS.typeScale && setCSS.typeScale.trim() !== "0") {
        docElement.style.setProperty("--USER__typeScale", setCSS.typeScale);
    } else {
        docElement.style.removeProperty("--USER__typeScale");
    }

    if (setCSS.paraSpacing && setCSS.paraSpacing.trim() !== "0") {
        docElement.style.setProperty("--USER__paraSpacing", setCSS.paraSpacing);
    } else {
        docElement.style.removeProperty("--USER__paraSpacing");
    }

    const isCJK = isDocCJK(documant);
    if (isVerticalWritingMode || (isRTL || isCJK)) {

        docElement.style.removeProperty("--USER__bodyHyphens");

        if (isDocJapanese(documant)) {
            if (setCSS.wordSpacing && setCSS.wordSpacing.trim() !== "0") {
                docElement.style.setProperty("--USER__wordSpacing", setCSS.wordSpacing);
            } else {
                docElement.style.removeProperty("--USER__wordSpacing");
            }
            if (setCSS.letterSpacing && setCSS.letterSpacing.trim() !== "0") {
                docElement.style.setProperty("--USER__letterSpacing", setCSS.letterSpacing);
            } else {
                docElement.style.removeProperty("--USER__letterSpacing");
            }
        } else {
            docElement.style.removeProperty("--USER__wordSpacing");
            docElement.style.removeProperty("--USER__letterSpacing");
        }

        if (isVerticalWritingMode || isCJK) {
            if (isVerticalWritingMode) {
                // docElement.style.removeProperty("--USER__colCount");
                docElement.style.setProperty("--USER__colCount", "1"); // force single page solves layout issues
            }

            docElement.style.removeProperty("--USER__paraIndent");

            docElement.style.removeProperty("--USER__textAlign");

        } else if (isRTL) {
            if (setCSS.ligatures) {
                docElement.style.setProperty("--USER__ligatures", setCSS.ligatures);
            } else {
                docElement.style.removeProperty("--USER__ligatures");
            }
        }
    } else {
        if (setCSS.bodyHyphens) {
            docElement.style.setProperty("--USER__bodyHyphens", setCSS.bodyHyphens);
        } else {
            docElement.style.removeProperty("--USER__bodyHyphens");
        }

        if (setCSS.wordSpacing && setCSS.wordSpacing.trim() !== "0") {
            docElement.style.setProperty("--USER__wordSpacing", setCSS.wordSpacing);
        } else {
            docElement.style.removeProperty("--USER__wordSpacing");
        }

        if (setCSS.letterSpacing && setCSS.letterSpacing.trim() !== "0") {
            docElement.style.setProperty("--USER__letterSpacing", setCSS.letterSpacing);
        } else {
            docElement.style.removeProperty("--USER__letterSpacing");
        }
    }

    if (!isVerticalWritingMode) {
        if (setCSS.colCount) {
            docElement.style.setProperty("--USER__colCount", setCSS.colCount);
        } else {
            docElement.style.removeProperty("--USER__colCount");
        }

        if (setCSS.paraIndent && setCSS.paraIndent.trim() !== "0") {
            docElement.style.setProperty("--USER__paraIndent", setCSS.paraIndent);
        } else {
            docElement.style.removeProperty("--USER__paraIndent");
        }

        if (setCSS.textAlign) {
            docElement.style.setProperty("--USER__textAlign", setCSS.textAlign);
        } else {
            docElement.style.removeProperty("--USER__textAlign");
        }
    } else if (!isRTL) {
        docElement.style.removeProperty("--USER__ligatures");
    }

    if (setCSS.pageMargins && setCSS.pageMargins.trim() !== "0") {
        docElement.style.setProperty("--USER__pageMargins", setCSS.pageMargins);
    } else {
        docElement.style.removeProperty("--USER__pageMargins");
    }

    if (setCSS.backgroundColor) {
        docElement.style.setProperty(setCSS.sepia || setCSS.night ? "--RS__backgroundColor" : "--USER__backgroundColor", setCSS.backgroundColor);
    } else {
        docElement.style.removeProperty("--USER__backgroundColor");
        docElement.style.removeProperty("--RS__backgroundColor");
    }
    if (setCSS.textColor) {
        docElement.style.setProperty(setCSS.sepia || setCSS.night ? "--RS__textColor" : "--USER__textColor", setCSS.textColor);
    } else {
        docElement.style.removeProperty("--USER__textColor");
        docElement.style.removeProperty("--RS__textColor");
    }

    if (setCSS.selectionBackgroundColor) {
        docElement.style.setProperty("--RS__selectionBackgroundColor", setCSS.selectionBackgroundColor);
    } else {
        docElement.style.removeProperty("--RS__selectionBackgroundColor");
    }
    if (setCSS.selectionTextColor) {
        docElement.style.setProperty("--RS__selectionTextColor", setCSS.selectionTextColor);
    } else {
        docElement.style.removeProperty("--RS__selectionTextColor");
    }

    if (setCSS.linkColor) {
        docElement.style.setProperty("--RS__linkColor", setCSS.linkColor);
    } else {
        docElement.style.removeProperty("--RS__linkColor");
    }
    if (setCSS.linkVisitedColor) {
        docElement.style.setProperty("--RS__visitedColor", setCSS.linkVisitedColor);
    } else {
        docElement.style.removeProperty("--RS__visitedColor");
    }
}

export function configureFixedLayout(
        documant: Document,
        isFixedLayout: boolean,
        fxlViewportWidth: number, fxlViewportHeight: number,
        innerWidth: number, innerHeight: number,
        wvSlot: WebViewSlotEnum,
        // 0 => use innerWidth/innerHeight to fit within viewport
        // 100 => original document dimensions, 50 => half, etc.
        zoomPercent: number,
    ): IwidthHeight | undefined {

    if (!documant || !documant.head || !documant.body) {
        return undefined;
    }
    debug("configureFixedLayout zoomPercent ", zoomPercent);

    let wh: IwidthHeight | undefined;

    let width: number = fxlViewportWidth;
    let height: number = fxlViewportHeight;

    if (!width || !height) {
        let metaViewport: Element | null = null;
        // Not in XMLDOM :(
        if (documant.head.querySelector) {
            metaViewport = documant.head.querySelector("meta[name=viewport]");
        } else {
            if (documant.head.childNodes && documant.head.childNodes.length) {
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < documant.head.childNodes.length; i++) {
                    const child = documant.head.childNodes[i];
                    if (child.nodeType === 1) { // Node.ELEMENT_NODE
                        const element = child as Element;
                        if (element.localName && element.localName.toLowerCase() === "meta") {
                            if (element.getAttribute("name") === "viewport") {
                                metaViewport = element;
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (!metaViewport) {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport]");
            }
            return undefined;
        }
        const attr = metaViewport.getAttribute("content");
        if (!attr) {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content]");
            }
            return undefined;
        }
        const wMatch = attr.match(/\s*width\s*=\s*([0-9]+)(\.([0-9]+))?/);
        if (wMatch && wMatch.length >= 2) {
            if (wMatch.length >= 4) {
                try {
                    width = parseFloat(wMatch[1] + "." + wMatch[3]);
                } catch (err) {
                    debug(err);
                    // ignore
                }
            } else {
                try {
                    width = parseInt(wMatch[1], 10);
                } catch (err) {
                    debug(err);
                    // ignore
                }
            }
        } else {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content WIDTH]");
            }
        }
        const hMatch = attr.match(/\s*height\s*=\s*([0-9]+)(\.([0-9]+))?/);
        if (hMatch && hMatch.length >= 2) {
            if (hMatch.length >= 4) {
                try {
                    height = parseFloat(hMatch[1] + "." + hMatch[3]);
                } catch (err) {
                    debug(err);
                    // ignore
                }
            } else {
                try {
                    height = parseInt(hMatch[1], 10);
                } catch (err) {
                    debug(err);
                    // ignore
                }
            }
        } else {
            if (isDEBUG_VISUALS(documant)) {
                debug("configureFixedLayout NO meta[name=viewport && content HEIGHT]");
            }
        }

        if (width && height) {
            if (isDEBUG_VISUALS(documant)) {
                debug("READIUM_FXL_VIEWPORT_WIDTH: " + width);
                debug("READIUM_FXL_VIEWPORT_HEIGHT: " + height);
            }

            wh = {
                height,
                scale: 1,
                tx: 0,
                ty: 0,
                width,
            };
        }
    } else {
        wh = {
            height,
            scale: 1,
            tx: 0,
            ty: 0,
            width,
        };
    }
    if (innerWidth && innerHeight && width && height && isFixedLayout
        && documant && documant.documentElement && documant.body) {

        // see visibilityMaskCssStyles
        documant.documentElement.classList.add(ROOT_CLASS_FIXED_LAYOUT);
        // documant.documentElement.style.overflow = "hidden";
        // documant.body.style.overflow = "hidden";
        // documant.body.style.margin = "0"; // 8px by default!

        // Many FXL EPUBs lack the body dimensions (only viewport meta)
        documant.body.style.width = width + "px";
        documant.body.style.height = height + "px";

        // consistency with body because transform applies correctly but scroll offset is incorrect in some cases (observed with RTL FXL docs, where only the X or Y axis is correctly zoomed ... can be checked by forcing overflow:scroll on HTML to observe the scroll bars)
        documant.documentElement.style.width = width + "px";
        documant.documentElement.style.height = height + "px";

        if (isDEBUG_VISUALS(documant)) {
            debug("FXL width: " + width);
            debug("FXL height: " + height);
        }

        const visibleWidth = innerWidth;
        const visibleHeight = innerHeight;
        if (isDEBUG_VISUALS(documant)) {
            debug("FXL visible width: " + visibleWidth);
            debug("FXL visible height: " + visibleHeight);
        }

        const ratioX = visibleWidth / width;
        const ratioY = visibleHeight / height;
        const ratio = zoomPercent === 0 ? Math.min(ratioX, ratioY) : (zoomPercent / 100);

        const tx = (visibleWidth - (width * ratio)) *
            (wvSlot === WebViewSlotEnum.center ? 0.5 : (wvSlot === WebViewSlotEnum.right ? 0 : 1));
        const ty = (visibleHeight - (height * ratio)) / 2;
        if (isDEBUG_VISUALS(documant)) {
            debug("FXL trans X: " + tx);
            debug("FXL trans Y: " + ty);
            debug("FXL scale XY: " + ratio);
        }

        if (wh) {
            wh.scale = ratio;
            wh.tx = tx;
            wh.ty = ty;
        }

        documant.documentElement.style.zoom = `${ratio}`;
        // documant.documentElement.style.transformOrigin = "0 0";
        // // tslint:disable-next-line:max-line-length
        // // documant.documentElement.style.transform = `translateX(${tx}px) translateY(${ty}px) scale3d(${ratio}, ${ratio}, 0)`;
        // // documant.documentElement.style.transform = `translate(${tx}px, ${ty}px) scale(${ratio})`;
        // documant.documentElement.style.transform = `scale(${ratio})`;
        // // documant.documentElement.style.setProperty("--r2_fxl_scale", `${ratio}`);
    }
    return wh;
}

export function ensureHead(documant: Document) {

    if (!documant || !documant.documentElement) {
        return;
    }

    const docElement = documant.documentElement;

    if (!documant.head) {
        const headElement = documant.createElement("head");
        if (documant.body) {
            docElement.insertBefore(headElement, documant.body);
        } else {
            docElement.appendChild(headElement);
        }
    }
}

export function appendCSSInline(documant: Document, id: string, css: string) {
    ensureHead(documant);

    if (!documant || !documant.head) {
        return;
    }

    const idz = "Readium2-" + id;
    const s = documant.getElementById(idz);
    if (s) {
        return; // already injected via streamer?
    }
    const styleElement = documant.createElement("style");
    styleElement.setAttribute("id", idz);
    styleElement.setAttribute("type", "text/css");
    styleElement.appendChild(documant.createTextNode(css));
    documant.head.appendChild(styleElement);
}

// unused (for now)
// export function removeCSSInline(documant: Document, id: string) {
//     const styleElement = documant.getElementById("Readium2-" + id);
//     if (styleElement && styleElement.parentNode) {
//         styleElement.parentNode.removeChild(styleElement);
//     }
// }

export function appendCSS(documant: Document, mod: string, urlRoot: string) {
    ensureHead(documant);

    if (!documant || !documant.head) {
        return;
    }

    const idz = "ReadiumCSS-" + mod;
    const s = documant.getElementById(idz);
    if (s) {
        return; // already injected via streamer?
    }
    const linkElement = documant.createElement("link");
    linkElement.setAttribute("id", idz);
    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", urlRoot + "ReadiumCSS-" + mod + ".css");

    // Not in XMLDOM :(
    let childElementCount = 0;
    let firstElementChild: Element | null = null;
    if (typeof documant.head.childElementCount !== "undefined") {
        childElementCount = documant.head.childElementCount;
        firstElementChild = documant.head.firstElementChild;
    } else {
        if (documant.head && documant.head.childNodes && documant.head.childNodes.length) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < documant.head.childNodes.length; i++) {
                const child = documant.head.childNodes[i];
                if (child.nodeType === 1) { // Node.ELEMENT_NODE
                    childElementCount++;
                    if (!firstElementChild) {
                        firstElementChild = child as Element;
                    }
                }
            }
        }
    }

    if (mod === "before" && childElementCount && firstElementChild) {
        documant.head.insertBefore(linkElement, firstElementChild);

        // https://github.com/readium/readium-css/issues/94
        const styleElement = documant.createElement("style");
        styleElement.setAttribute("id", idz + "-PATCH");
        styleElement.setAttribute("type", "text/css");
        styleElement.appendChild(documant.createTextNode(`
audio[controls] {
    width: revert !important; height: revert !important;
}

/* exception for Japanese, ReadiumCSS normally recommends disabling CSS letter/word-spacing for CJK in general */

:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h1,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h2,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h3,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h4,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h5,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) h6,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) p,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) li,
:root[style*="readium-advanced-on"][style*="--USER__letterSpacing"]:lang(ja) div {
    letter-spacing: var(--USER__letterSpacing);
    font-variant: none;
}

:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h1,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h2,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h3,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h4,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h5,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) h6,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) p,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) li,
:root[style*="readium-advanced-on"][style*="--USER__wordSpacing"]:lang(ja) div {
    word-spacing: var(--USER__wordSpacing);
}
`));
        documant.head.insertBefore(styleElement, firstElementChild);
    } else {
        documant.head.appendChild(linkElement);
    }
}

export function removeCSS(documant: Document, mod: string) {
    const linkElement = documant.getElementById("ReadiumCSS-" + mod);
    if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
    }
    const styleElement = documant.getElementById("ReadiumCSS-" + mod + "-PATCH");
    if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
    }
}

// export function removeAllCSSInline(_documant: Document) {
//     // removeCSSInline("electron-selection");
//     // removeCSSInline("electron-focus");
//     // removeCSSInline("electron-scrollbars");
// }

export function removeAllCSS(documant: Document) {
    removeCSS(documant, "before");
    removeCSS(documant, "after");
    // removeCSS("base");
    // removeCSS("html5patch");
    // removeCSS("safeguards");
    removeCSS(documant, "default");
    // removeCSS("highlights");
    // removeCSS("scroll");
    // removeCSS("pagination");
    // removeCSS("night_mode");
    // removeCSS("pagination");
    // removeCSS("os_a11y");
    // removeCSS("user_settings");
    // removeCSS("fs_normalize");
}

export function injectDefaultCSS(documant: Document) {
    appendCSSInline(documant, "electron-mo", mediaOverlaysCssStyles);
    appendCSSInline(documant, "electron-tts", ttsCssStyles);
    appendCSSInline(documant, "electron-footnotes", footnotesCssStyles);
    appendCSSInline(documant, "electron-selection", selectionCssStyles);
    appendCSSInline(documant, "electron-focus", focusCssStyles);
    appendCSSInline(documant, "electron-target", targetCssStyles);
    appendCSSInline(documant, "electron-scrollbars", scrollBarCssStyles);
    appendCSSInline(documant, "electron-visibility-mask", visibilityMaskCssStyles);
    appendCSSInline(documant, "electron-audiobook", audioCssStyles);
}

export function injectReadPosCSS(documant: Document) {
    // if (!isDEBUG_VISUALS(documant)) {
    //     return;
    // }
    appendCSSInline(documant, "electron-readPos", readPosCssStyles);
}

export function readiumCssTransformHtml(
    htmlStr: string,
    readiumcssJson: IEventPayload_R2_EVENT_READIUMCSS | undefined,
    mediaType: string | undefined): string {

    // debug(mediaType);
    // debug(htmlStr);

    // let's remove the DOCTYPE (which can contain entities)
    // let's replace the body with empty txt (we only need the body start tag, not the element contents)

    const iHtmlStart = htmlStr.indexOf("<html");
    if (iHtmlStart < 0) {
        return htmlStr;
    }
    const iBodyStart = htmlStr.indexOf("<body");
    if (iBodyStart < 0) {
        return htmlStr;
    }
    const iBodyEnd = htmlStr.indexOf(">", iBodyStart);
    if (iBodyEnd <= 0) {
        return htmlStr;
    }

    const parseableChunk = htmlStr.substr(iHtmlStart, iBodyEnd - iHtmlStart + 1);
    // debug(parseableChunk);
    const htmlStrToParse = `<?xml version="1.0" encoding="utf-8"?>${parseableChunk}TXT</body></html>`;
    // debug(htmlStrToParse);

    const documantFromXmlDom = parseDOM(htmlStrToParse, mediaType);

    documantFromXmlDom.documentElement.setAttribute("data-readiumcss-injected", "yes");

    if (ENABLE_VISIBILITY_MASK) {
        documantFromXmlDom.documentElement.classList.add(ROOT_CLASS_INVISIBLE_MASK);
        documantFromXmlDom.documentElement.classList.remove(ROOT_CLASS_INVISIBLE_MASK_REMOVED);
    }

    // const wh = configureFixedLayout(doc, win.READIUM2.isFixedLayout,
    //     win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight,
    //     win.innerWidth, win.innerHeight);
    // if (wh) {
    //     win.READIUM2.fxlViewportWidth = wh.width;
    //     win.READIUM2.fxlViewportHeight = wh.height;
    // }

    const rtl = isDocRTL(documantFromXmlDom);
    const vertical = isDocVertical(documantFromXmlDom);
    if (readiumcssJson) {
        if (IS_DEV) {
            debug("_____ readiumCssJson.urlRoot (readiumCssTransformHtml()): ", readiumcssJson.urlRoot);
        }

        readiumCSSSet(
            documantFromXmlDom,
            readiumcssJson,
            vertical,
            rtl);
    }

    injectDefaultCSS(documantFromXmlDom);
    if (IS_DEV) { // isDEBUG_VISUALS(documant)
        injectReadPosCSS(documantFromXmlDom);
    }

    const serialized = serializeDOM(documantFromXmlDom);
    // debug("serialized:");
    // debug(serialized);

    const prefix = htmlStr.substr(0, iHtmlStart);
    // debug("prefix:");
    // debug(prefix);
    const suffix = htmlStr.substr(iBodyEnd + 1);
    // debug("suffix:");
    // debug(suffix);

    const iHtmlStart_ = serialized.indexOf("<html");
    if (iHtmlStart_ < 0) {
        return htmlStr;
    }
    const iBodyStart_ = serialized.indexOf("<body");
    if (iBodyStart_ < 0) {
        return htmlStr;
    }
    const iBodyEnd_ = serialized.indexOf(">", iBodyStart_);
    if (iBodyEnd_ <= 0) {
        return htmlStr;
    }

    const middle = serialized.substr(iHtmlStart_, iBodyEnd_ - iHtmlStart_ + 1);
    // debug("middle:");
    // debug(middle);
    const newStr = `${prefix}${middle}${suffix}`;
    // debug("newStr:");
    // debug(newStr);
    return newStr;
}
