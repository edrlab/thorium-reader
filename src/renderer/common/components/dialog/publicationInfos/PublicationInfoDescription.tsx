// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

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

    React.useEffect(() => {
        const lang = publicationViewMaybeOpds.languages?.[0];
        if (!lang || !descriptionRef.current) return;

        descriptionRef.current.setAttribute("lang", lang);
    }, [publicationViewMaybeOpds]);

    const { description } = publicationViewMaybeOpds;
    if (!description) return <></>;

    const descriptionSanitized = DOMPurify.sanitize(description).replace(/font-size:/g, "font-sizexx:");
    if (!descriptionSanitized) return <></>;

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
                        className={stylesBookDetailsDialog.allowUserSelect}
                        dangerouslySetInnerHTML={{ __html: descriptionSanitized }}
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
