import * as React from "react";

import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Publication } from "readium-desktop/common/models/publication";

interface ListViewProps {
    publications: Publication[];
}

export default class ListView extends React.Component<ListViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
            {
                <ul>
                    { this.props.publications.map((pub, i: number) => {
                        return (
                            <li className={styles.block_book_list} key={ i }>
                                <PublicationListElement
                                    publication={pub}
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
