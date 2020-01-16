// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import { TPublication } from "readium-desktop/renderer/common/type/publication.type";

export interface IProps {
    publication: TPublication;
    __: I18nTyped;
}

export const FormatPublicationLanguage: React.FC<IProps> = (props) => {

    const { publication, __ } = props;

    if (publication.languages) {

        let publicationLanguageArray: React.ReactElement[] = [];

        publicationLanguageArray = publication.languages.map(
            (lang: string, index: number) => {

                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = __ as (str: string) => string;

                const ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);
                const note = (lang !== ll) ? ` (${lang})` : "";
                const suffix = ((index < (publication.languages.length - 1)) ? ", " : "");

                return (<i
                    key={"lang-" + index}
                    title={lang}
                    className={styles.allowUserSelect}
                >
                    {ll + note + suffix}
                </i>);

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
