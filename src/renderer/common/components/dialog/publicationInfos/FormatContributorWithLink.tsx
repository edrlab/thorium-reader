// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Translator } from "readium-desktop/common/services/translator";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";

interface IProps {
    contributors: string[] | IOpdsContributorView[] | undefined;
    translator: Translator;
    onClickLinkCb?: (newContributor: IOpdsContributorView) => () => void;
}

export const FormatContributorWithLink: React.FC<IProps> = (props) => {

    const { contributors, translator, onClickLinkCb } = props;

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
                        className={stylesButtons.button_link} tabIndex={0}
                    >
                        {translator.translateContentField(newContributor.name)}
                    </a>,
                );
            } else if (typeof newContributor === "object") {
                retElement.push(
                    <span className={stylesBookDetailsDialog.allowUserSelect}>
                        {translator.translateContentField(newContributor.name)}
                    </span>,
                );
            } else {
                retElement.push(
                    <span className={stylesBookDetailsDialog.allowUserSelect}>
                        {translator.translateContentField(newContributor)}
                    </span>,
                );
            }
        }
    }

    return retElement.reduce(
        (_previousValue, currentValue, currentIndex, array) =>
            <>
                {
                    currentValue
                }
                {
                    currentIndex < (array.length - 1) ? ", " : ""
                }
            </>,
        <></>,
    );
};
