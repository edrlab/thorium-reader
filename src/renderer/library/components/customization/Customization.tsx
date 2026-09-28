// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import DOMPurify from "dompurify";
import { useParams } from "react-router-dom";

import LibraryLayout from "../layout/LibraryLayout";
import PublicationAddButton from "../catalog/PublicationAddButton";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { decodeCustomizationRouteParam } from "../../customization/route";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { URL_PROTOCOL_THORIUMHTTPS, URL_HOST_COMMON, URL_PATH_PREFIX_CUSTOMPROFILEZIP } from "readium-desktop/common/streamerProtocol";

const secondaryHeader = <span style={{ display: "flex", justifyContent: "end", alignItems: "end", height: "53px", borderBottom: "1px solid var(--color-gray-250)", paddingBottom: "30px" }}><PublicationAddButton /></span>;

const CustomizationPage = () => {
    const [__] = useTranslator();
    const { hrefEncoded } = useParams<{ hrefEncoded: string }>();

    const customizationManifest = useSelector((state: ILibraryRootState) => state.customization.manifest);
    const locale = useSelector((state: ILibraryRootState) => state.i18n.locale);
    const customizationId = customizationManifest?.identifier;
    const customizationBaseUrl = customizationId ? `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_CUSTOMPROFILEZIP}/${encodeURIComponent_RFC3986(Buffer.from(customizationId).toString("base64"))}/` : "";

    const href = hrefEncoded ? decodeCustomizationRouteParam(hrefEncoded) : undefined;
    const screenLink = customizationManifest?.links?.find((ln) => ln.rel === "screen" && ln.href === href);
    const title = convertMultiLangStringToString(screenLink?.title, locale) || __("catalog.customization.fallback.screen");

    const [dangerousInnerHTML_CustomProfileScreenSanitized, setDangerousInnerHtml] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        let cancelled = false;
        setDangerousInnerHtml(undefined);

        if (href && customizationBaseUrl) {
            // URL is thoriumhttps:// "custom-profile-zip" protocol handler, so no use of isURL(url) and /^https?:\/\//.test(url) checks here
            const url = customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(href).toString("base64"));

            fetch(url)
                .then((response) => {
                    if (response.ok) {
                        return response.text();
                    }
                    return Promise.reject(response.statusText);
                })
                .then((rawHtmlContent) => {
                    if (cancelled || !rawHtmlContent) {
                        return;
                    }

                    const htmlSanitized = DOMPurify.sanitize(rawHtmlContent, { FORBID_TAGS: [/*"style"*/], FORBID_ATTR: [/*"style"*/] /* TODO: handle external https links */ });
                    // NOTE that <a href="yyy">xxx</a> is fine, caught by webContents.on("will-navigate", ...) with event.preventDefault() and shell.openExternal(...) on normalized/escaped URL and filtered on HTTP(S)://
                    // NOTE that the attribute target="_blank" (etc) is automatically removed by DOMPurify but would be caught by webContents.setWindowOpenHandler(...) with { action: "deny" }, although no shell.openExternal(...) in this case
                    setDangerousInnerHtml(htmlSanitized);
                })
                .catch((e) => {
                    console.error("Error fetching data:", e);
                });
        }

        return () => {
            cancelled = true;
        };
    }, [href, customizationBaseUrl]);

    return (
        <LibraryLayout
            title={title}
            secondaryHeader={secondaryHeader}
        >
            {
                dangerousInnerHTML_CustomProfileScreenSanitized ?
                    <div dangerouslySetInnerHTML={{ __html: dangerousInnerHTML_CustomProfileScreenSanitized }} /> : <></>
            }
        </LibraryLayout>
    );
};

export default CustomizationPage;
