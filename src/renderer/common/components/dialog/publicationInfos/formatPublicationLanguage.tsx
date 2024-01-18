// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { AvailableLanguages, I18nTyped } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";

export interface IProps {
    publicationViewMaybeOpds: TPublication;
    __: I18nTyped;
}

export const FormatPublicationLanguage: React.FC<IProps> = (props) => {

    const { publicationViewMaybeOpds, __ } = props;

    if (publicationViewMaybeOpds.languages) {

        let publicationLanguageArray: React.ReactElement[] = [];

        publicationLanguageArray = publicationViewMaybeOpds.languages.map(
            (lang: string, index: number) => {

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = __ as (str: string) => string;

                // The backticks is not captured by the i18n scan script (automatic detection of translate("...") calls)
                let ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);

                const lg = AvailableLanguages[l as keyof typeof AvailableLanguages];
                if (lg && lang == ll) {
                    ll = lg;
                }

                const note = (lang !== ll) ? ` (${lang})` : "";
                const suffix = ((index < (publicationViewMaybeOpds.languages.length - 1)) ? ", " : "");

                return (<span
                    key={"lang-" + index}
                    className={stylesBookDetailsDialog.allowUserSelect}
                >
                    {ll + note + suffix}
                </span>);

            });

        return (
            <>
                {
                    publicationLanguageArray
                }
            </>
        );
    }

    return (<></>);
};
