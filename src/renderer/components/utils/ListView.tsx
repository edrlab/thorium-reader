import * as React from "react";

import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

import { Publication } from "readium-desktop/common/models/publication";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import OpdsMenu from "readium-desktop/renderer/components/publication/menu/OpdsMenu";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface ListViewProps {
    publications: Publication[];
    isOpdsView?: boolean;
}

export default class ListView extends React.Component<ListViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        let MenuContent = CatalogMenu;
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
