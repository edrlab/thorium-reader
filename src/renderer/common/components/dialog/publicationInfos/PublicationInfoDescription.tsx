// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { convertMultiLangStringToLangString } from "readium-desktop/common/language-string";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import { PublicationView } from "readium-desktop/common/views/publication";
import classNames from "classnames";
import debug_ from "debug";
import DOMPurify from "dompurify";
import * as React from "react";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import SVG from "../../SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";

// Logger
const debug = debug_("readium-desktop:renderer:publicationInfoDescription");
debug("_");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
    publicationViewMaybeOpds: TPublication;
    __: I18nFunction;
}

const PublicationInfoDescription: React.FC<IProps> = ({ publicationViewMaybeOpds, __ }) => {
    const descriptionWrapperRef = React.useRef<HTMLDivElement>(null);
    const descriptionRef = React.useRef<HTMLDivElement>(null);

    const [seeMore, setSeeMore] = React.useState(false);
    const [needSeeMore, setNeedSeeMore] = React.useState(false);

    const needSeeMoreButton = React.useCallback(() => {
        if (!descriptionWrapperRef.current || !descriptionRef.current) return;
        const need = descriptionWrapperRef.current.offsetHeight < descriptionRef.current.offsetHeight;
        setNeedSeeMore(need);
    }, []);

    React.useEffect(() => {
        const timeout = setTimeout(needSeeMoreButton, 500);
        return () => clearTimeout(timeout);
    }, [publicationViewMaybeOpds, needSeeMoreButton]);

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const textObj = (publicationViewMaybeOpds as PublicationView).description || publicationViewMaybeOpds.description;
    const pubLangs = (publicationViewMaybeOpds as PublicationView).languages || publicationViewMaybeOpds.languages;
    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
    const pubDescLangStr = convertMultiLangStringToLangString(textObj_, locale);
    const pubDescLang = pubDescLangStr && pubDescLangStr[0] ? pubDescLangStr[0].toLowerCase() : "";
    const pubDescIsRTL = langStringIsRTL(pubDescLang);
    const pubDescStr = pubDescLangStr && pubDescLangStr[1] ? pubDescLangStr[1] : "";

    // const { description } = publicationViewMaybeOpds;
    // String(pubDescLang) + " --- " + descStr + " ====== " +
    const description = pubDescStr;
    if (!description) return <></>;

    const dangerousInnerHTML_DescriptionSanitized = DOMPurify.sanitize(description).replace(/font-size:/g, "font-sizexx:");
    if (!dangerousInnerHTML_DescriptionSanitized) return <></>;

    return (
        <>
            <div className={stylePublication.publicationInfo_heading}>
                <h3>{__("catalog.description")}</h3>
            </div>
            <div className={stylePublication.publicationInfo_description_bloc}>
                <div
                    ref={descriptionWrapperRef}
                    className={classNames(
                        stylesBookDetailsDialog.descriptionWrapper,
                        needSeeMore && stylesBookDetailsDialog.hideEnd,
                        seeMore && stylesBookDetailsDialog.seeMore,
                    )}
                >
                    <div
                        ref={descriptionRef}
                        dir={pubDescIsRTL ? "rtl" : undefined}
                        lang={pubDescLang ? pubDescLang : undefined}
                        className={stylesBookDetailsDialog.allowUserSelect}
                        dangerouslySetInnerHTML={{ __html: dangerousInnerHTML_DescriptionSanitized }}
                    />
                </div>
                {needSeeMore &&
                    <button aria-hidden className={stylePublication.publicationInfo_description_bloc_seeMore} onClick={() => setSeeMore(v => !v)}>
                        <SVG ariaHidden svg={seeMore ? ChevronUp : ChevronDown} />
                        {seeMore ? __("publication.seeLess") : __("publication.seeMore")}
                    </button>
                }
            </div>
        </>
    );
};

export default PublicationInfoDescription;
