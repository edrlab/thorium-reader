// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";

export interface IProps {
    publication: TPublication;
    __: I18nTyped;
}

export const FormatPublisherDate: React.FC<IProps> = (props) => {

    const { publication, __ } = props;

    let formatedPublishedDateComponent = (<></>);

    if (publication.publishedAt) {
        const date = moment(publication.publishedAt).format("L");
        if (date) {
            formatedPublishedDateComponent = (
                <p>
                    <strong>{__("catalog.released")}</strong> <i className={styles.allowUserSelect}>{date}</i>
                </p>
            );
        }
    }

    return formatedPublishedDateComponent;
};
