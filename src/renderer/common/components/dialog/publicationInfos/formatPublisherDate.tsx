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
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";

export interface IProps {
    publicationViewMaybeOpds: TPublication;
    __: I18nTyped;
}

export const FormatPublisherDate: React.FC<IProps> = (props) => {

    const { publicationViewMaybeOpds, __ } = props;

    let formatedPublishedDateComponent = (<></>);

    if (publicationViewMaybeOpds.publishedAt) {
        const date = moment(publicationViewMaybeOpds.publishedAt).format("L");
        if (date) {
            formatedPublishedDateComponent = (
                <div>
                    <strong>{__("catalog.released")}: </strong> <span className={stylesBookDetailsDialog.allowUserSelect}>{date}</span>
                </div>
            );
        }
    }

    return formatedPublishedDateComponent;
};
