// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import OpdsMenu from "readium-desktop/renderer/components/publication/menu/OpdsMenu";
import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

interface IProps {
    publications: PublicationView[];
    isOpdsView?: boolean;
}

export default class ListView extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        let MenuContent: any = CatalogMenu;
        if ( this.props.isOpdsView ) {
            MenuContent = OpdsMenu;
        }

        return (
            <>
            {
                <ul>
                    { this.props.publications.map((pub, i: number) => {
                        return (
                            <li className={styles.block_book_list} key={ i }>
                                <PublicationListElement
                                    publication={pub}
                                    menuContent={<MenuContent publication={pub}/>}
                                    isOpds={this.props.isOpdsView}
                                />
                            </li>
                        );
                    })}
                </ul>
            }
            </>
        );
    }
}
