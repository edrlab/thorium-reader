// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/publicationInfos.scss";

import classNames from "classnames";
import * as React from "react";
import { translateContentFieldHelper } from "readium-desktop/common/services/translator";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

interface IProps {
    contributors: string[] | IOpdsContributorView[] | undefined;
    onClickLinkCb?: (newContributor: IOpdsContributorView) => () => void;
    className?: string;
}

export const FormatContributorWithLink: React.FC<IProps> = (props) => {

    const { contributors, onClickLinkCb, className } = props;

    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);

    const retElement: JSX.Element[] = [];

    if (Array.isArray(contributors)) {

        for (const contributor of contributors) {
            const newContributor = contributor;

            if (
                typeof newContributor === "object"
                && newContributor.link?.length
                && onClickLinkCb
            ) {

                // FIXME : add pointer hover on 'a' links
                retElement.push(
                    <a onClick={onClickLinkCb(newContributor)}
                        onKeyUp={(e) => { // necessary because no href (with href, preventDefault() inside onClick would be necessary to avoid SHIT and OPT/ALT key mods on the hyperlink, and CSS visited styles would need to be added)
                            if (e.key === "Enter") {
                               onClickLinkCb(newContributor)();
                               e.preventDefault();
                            }
                        }}
                        className={classNames(stylesButtons.button_link, className ? stylesPublications.authors : "")}
                        tabIndex={0}
                    >
                        {translateContentFieldHelper(newContributor.name, locale)}
                    </a>,
                );
            } else if (typeof newContributor === "object") {
                retElement.push(
                    <span className={classNames(stylesBookDetailsDialog.allowUserSelect, className  ? stylesPublications.authors : "")}>
                        {translateContentFieldHelper(newContributor.name, locale)}
                    </span>,
                );
            } else {
                retElement.push(
                    <span className={classNames(stylesBookDetailsDialog.allowUserSelect, className  ? stylesPublications.authors : "")}>
                        {translateContentFieldHelper(newContributor, locale)}
                    </span>,
                );
            }
        }
    }

    return retElement.reduce((pv, cv) => pv ? <>{pv}, {cv}</> : <>{cv}</>, undefined) || <></>;
};
