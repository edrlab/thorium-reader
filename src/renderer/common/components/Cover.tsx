// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import * as React from "react";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesImages from "readium-desktop/renderer/assets/styles/components/images.css";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { TranslatorProps/* , withTranslator */ } from "./hoc/translator";
import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";
import { useTranslator } from "../hooks/useTranslator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: TPublication;
    coverType?: "cover" | "thumbnail" | undefined;
    onClick?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLImageElement>) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

const Cover =(props: IProps) => {

    const {
        publicationViewMaybeOpds:
        { cover, authors: publicationAuthors, publicationTitle, documentTitle, customCover },
        coverType,
        onKeyDown,
        onClick,
    } = props;

    const [__, translator] = useTranslator();


    const [url, setUrl] = React.useState(() => {
        if (!cover) return "";
        const coverUrl = cover.coverUrl || cover.coverLinks[0]?.url;
        const thumbnailUrl = cover.coverUrl || cover.thumbnailLinks[0]?.url;
        let defaultUrl: string;

        if (coverType === "cover") {
            defaultUrl = coverUrl || thumbnailUrl;
        } else {
            defaultUrl = thumbnailUrl || coverUrl;
        }

        return defaultUrl;
    });

    const [imgErroredOnce, setImgErroredOnce] = React.useState(false);

    const imageOnError = () => {
        if (imgErroredOnce) return;

        const b64 = Buffer.from(url).toString("base64");
        const newUrl = "opds-media://0.0.0.0/" + encodeURIComponent_RFC3986(b64);
        setUrl(newUrl);
        setImgErroredOnce(true);
    };

    return React.useMemo(() => {

        if (cover) {
            return (
                <img
                    tabIndex={onKeyDown ? 0 : -1}
                    className={stylesImages.cover_img}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    role="presentation"
                    alt={onKeyDown ? __("publication.cover.img") : ""}
                    aria-hidden={onKeyDown ? undefined : true}
                    src={url}
                    onError={imageOnError}
                />
            );
        }

        const authors = formatContributorToString(publicationAuthors, translator);

        let colors = customCover;
        if (!colors) {
            colors = RandomCustomCovers[0];
        }
        const backgroundStyle: React.CSSProperties = {
            backgroundImage: `linear-gradient(${colors.topColor}, ${colors.bottomColor})`,
        };

        const pubTitleLangStr = convertMultiLangStringToString(translator, publicationTitle || documentTitle);
        const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
        const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
        const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

        return (
            <div style={backgroundStyle} className={stylesPublications.no_img_wrapper}>
                <div className={stylesPublications.no_img}>
                    <p aria-hidden
                        dir={pubTitleIsRTL ? "rtl" : undefined}>
                        {pubTitleStr}
                    </p>
                    <p aria-hidden>{authors}</p>
                </div>
            </div>
        );
    }, [url]);

};

export default Cover;
