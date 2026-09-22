// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import DOMPurify from "dompurify";
import * as React from "react";
import { Navigate, useParams } from "react-router-dom";

import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import {
    URL_HOST_COMMON,
    URL_PATH_PREFIX_CUSTOMPROFILEZIP,
    URL_PROTOCOL_THORIUMHTTPS,
} from "readium-desktop/common/streamerProtocol";
import * as styles from "readium-desktop/renderer/assets/styles/components/profileScreen.scss";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { decodeProfileRouteParam, resolveProfileScreenLink } from "../../customization/route";
import PublicationAddButton from "../catalog/PublicationAddButton";
import LibraryLayout from "../layout/LibraryLayout";

const secondaryHeader = <span style={{ display: "flex", justifyContent: "end", alignItems: "end", height: "53px", borderBottom: "1px solid var(--color-gray-250)", paddingBottom: "30px" }}><PublicationAddButton /></span>;

type TProfileScreenState =
    | { status: "loading" }
    | { status: "ready"; html: string }
    | { status: "error" };

const PROFILE_SCREEN_SCOPE_SELECTOR = ".custom-profile-screen";

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

const selectorTargetsProfileScreen = (selector: string): boolean => {
    // Remove an optional `body` or `body[...]` ancestor followed by whitespace.
    // For example, `body[data-theme="dark"] .custom-profile-screen h1` becomes
    // `.custom-profile-screen h1`. This permits theme-qualified rules while the
    // check below still requires the actual style target to be the profile
    // container or one of its descendants.
    const normalizedSelector = selector.trim().replace(/^body(?:\[[^\]]+\])?\s+/, "");
    return normalizedSelector === PROFILE_SCREEN_SCOPE_SELECTOR ||
        [" ", ".", "#", ":", "[", ">", "+", "~"].some(
            (separator) => normalizedSelector.startsWith(PROFILE_SCREEN_SCOPE_SELECTOR + separator),
        );
};

// Walk every parsed CSS rule, including rules nested in @media, @supports, or
// similar grouping rules. Each style selector must explicitly target the
// stable profile container. Keyframe declarations are accepted because they
// do not select DOM nodes and can only take effect when referenced by an
// already-scoped style rule.
const profileCssRulesAreScoped = (rules: CSSRuleList): boolean =>
    Array.from(rules).every((rule) => {
        if ("selectorText" in rule && typeof rule.selectorText === "string") {
            return splitSelectorList(rule.selectorText).every(selectorTargetsProfileScreen);
        }
        if ("cssRules" in rule && rule.cssRules instanceof CSSRuleList) {
            return profileCssRulesAreScoped(rule.cssRules);
        }
        // Keyframe declarations have no selector of their own and can only be
        // applied from an already-scoped style rule.
        return "keyText" in rule;
    });

const profileCssIsSafeAndScoped = (cssText: string): boolean => {
    // DOMPurify sanitizes markup and element attributes, but it does not
    // provide stylesheet isolation. Block CSS that can load another
    // stylesheet or font, plus legacy executable URL forms, before parsing.
    if (/@(?:font-face|import)\b/i.test(cssText) || /(?:expression|url)\s*\(\s*["']?\s*javascript:/i.test(cssText)) {
        return false;
    }

    try {
        // Let Chromium's CSS parser interpret the stylesheet instead of using
        // regular expressions for complete CSS syntax. Invalid stylesheets or
        // selectors that escape the profile root cause the document to be
        // rejected rather than risking changes to Thorium's Library UI.
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        return profileCssRulesAreScoped(sheet.cssRules);
    } catch {
        return false;
    }
};

export function prepareProfileScreenHtml(rawHtmlContent: string): string | undefined {
    // Profile packages are controlled and signed, so the page remains in the
    // regular DOM instead of a Shadow DOM. This preserves Thorium's theme,
    // focus management, accessibility landmarks, and link handling. Isolation
    // is enforced by sanitizing the HTML and requiring retained stylesheet
    // selectors to remain below .custom-profile-screen. Inline style
    // attributes are local to their element, while Thorium's !important rules
    // still enforce the application font and standard text sizes.
    const sanitizedHtml = DOMPurify.sanitize(rawHtmlContent, {
        FORCE_BODY: true,
        FORBID_ATTR: ["srcdoc"],
        FORBID_TAGS: ["base", "embed", "iframe", "link", "object", "script"],
    });
    const parsedDocument = new DOMParser().parseFromString(sanitizedHtml, "text/html");

    if (Array.from(parsedDocument.body.querySelectorAll("style")).some(
        (style) => !profileCssIsSafeAndScoped(style.textContent || ""),
    )) {
        return undefined;
    }

    // LibraryLayout already owns the page's main landmark.
    for (const nestedMain of Array.from(parsedDocument.body.querySelectorAll("main"))) {
        const section = parsedDocument.createElement("section");
        for (const attribute of Array.from(nestedMain.attributes)) {
            section.setAttribute(attribute.name, attribute.value);
        }
        section.classList.add("profile-content");
        while (nestedMain.firstChild) {
            section.appendChild(nestedMain.firstChild);
        }
        nestedMain.replaceWith(section);
    }

    if (parsedDocument.body.querySelectorAll("h1").length !== 1) {
        return undefined;
    }

    return parsedDocument.body.innerHTML;
}

const CustomizationPage = () => {
    const [__] = useTranslator();
    const { screenId } = useParams<{ screenId: string }>();
    const contentRef = React.useRef<HTMLDivElement>(null);

    const customization = useSelector((state: ILibraryRootState) => state.customization);
    const locale = useSelector((state: ILibraryRootState) => state.i18n.locale);
    const customizationManifest = customization.manifest;
    const decodedHref = screenId ? decodeProfileRouteParam(screenId) : undefined;
    const screenLink = screenId
        ? resolveProfileScreenLink(customizationManifest, locale, screenId)
        : undefined;
    const title = convertMultiLangStringToString(screenLink?.title, locale) || __("catalog.customization.fallback.screen");
    const customizationId = customizationManifest?.identifier;
    const customizationBaseUrl = customizationId
        ? `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_CUSTOMPROFILEZIP}/${encodeURIComponent_RFC3986(Buffer.from(customizationId).toString("base64"))}/`
        : undefined;

    const [screenState, setScreenState] = React.useState<TProfileScreenState>({ status: "loading" });

    React.useEffect(() => {
        if (!screenLink || !customizationBaseUrl) {
            setScreenState({ status: "loading" });
            return undefined;
        }

        const controller = new AbortController();
        setScreenState({ status: "loading" });

        // URL is handled by Thorium's custom-profile-zip protocol.
        const url = customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(screenLink.href).toString("base64"));
        fetch(url, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(response.statusText || `${response.status}`);
                }
                return response.text();
            })
            .then((rawHtmlContent) => {
                if (controller.signal.aborted) {
                    return;
                }
                const html = rawHtmlContent && prepareProfileScreenHtml(rawHtmlContent);
                setScreenState(html ? { status: "ready", html } : { status: "error" });
            })
            .catch((error) => {
                if (controller.signal.aborted || error?.name === "AbortError") {
                    return;
                }
                console.error("Error loading profile screen:", error);
                setScreenState({ status: "error" });
            });

        return () => controller.abort();
    }, [customizationBaseUrl, screenLink]);

    React.useEffect(() => {
        if (screenState.status !== "ready") {
            return;
        }
        const heading = contentRef.current?.querySelector<HTMLElement>("h1");
        if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
    }, [screenState]);

    if (!decodedHref || !customization.activate.id) {
        return <Navigate to="/home" replace />;
    }
    if (customizationManifest && !screenLink) {
        return <Navigate to="/home" replace />;
    }

    return (
        <LibraryLayout
            page={title}
            secondaryHeader={secondaryHeader}
        >
            <div
                aria-busy={screenState.status === "loading"}
                className={`custom-profile-screen ${styles.profile_screen}`}
                lang={screenLink?.language || locale}
                ref={contentRef}
            >
                {screenState.status === "loading" ? <div aria-hidden="true" className={styles.loading} /> : <></>}
                {screenState.status === "error" ? <p role="alert">{__("opds.network.error")}</p> : <></>}
                {screenState.status === "ready" ? <div dangerouslySetInnerHTML={{ __html: screenState.html }} /> : <></>}
            </div>
        </LibraryLayout>
    );
};

export default CustomizationPage;
