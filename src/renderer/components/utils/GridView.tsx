// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as styles from "readium-desktop/renderer/assets/styles/publicationView.css";
import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import OpdsMenu from "readium-desktop/renderer/components/publication/menu/OpdsMenu";
import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

interface IProps {
    publications: PublicationView[];
    isOpdsView?: boolean;
}

export default class GridView extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const { isOpdsView } = this.props;

        return (
            <div className={styles.card_wrapper}>
                {this.props.publications.map((pub, index) =>
                    <PublicationCard
                        key={-index}
                        publication={pub}
                        MenuContent={isOpdsView ? OpdsMenu : CatalogMenu}
                        isOpds={isOpdsView}
                    />,
                )}
                {[...Array(6).keys()].map((__, index) => {
                    return <div key={index} className={styles.card_substitute}></div>;
                })}
            </div>
        );
    }
}
