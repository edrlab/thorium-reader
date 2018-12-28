// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import * as styles from "readium-desktop/renderer/assets/styles/publicationView.css";

import { RouteComponentProps} from "react-router-dom";

import { Publication } from "readium-desktop/common/models/publication";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import OpdsMenu from "readium-desktop/renderer/components/publication/menu/OpdsMenu";

interface GridViewProps extends RouteComponentProps {
    publications: Publication[];
    isOpdsView?: boolean;
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        let MenuContent = CatalogMenu;
        if ( this.props.isOpdsView ) {
            MenuContent = OpdsMenu;
        }

        return (
            <div className={styles.card_wrapper}>
                {this.props.publications.map((pub, index) =>
                    <PublicationCard
                        key={-index }
                        publication={pub}
                        menuContent={<MenuContent publication={pub}/>}
                        isOpds={this.props.isOpdsView}
                    />,
                )}
                {[...Array(6).keys()].map((__, index) => {
                    return <div key={index} className={styles.card_substitute}></div>;
                })}
            </div>
        );
    }
}
