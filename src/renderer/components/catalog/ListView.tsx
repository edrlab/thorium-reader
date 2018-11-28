import * as React from "react";

import * as uuid from "uuid";

import { RootState } from "readium-desktop/renderer/redux/states";

import { readerActions } from "readium-desktop/common/redux/actions";

import { CatalogView } from "readium-desktop/common/views/catalog";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface ListViewProps {
    catalogEntries: CatalogEntryView[];
}

export default class ListView extends React.Component<ListViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
            {
                this.props.catalogEntries.map((entry) => {
                    return (
                        <section>
                            <h1>{ entry.title }</h1>
                            <ul>

                                { entry.publications.map((pub, i: number) => {
                                    return (
                                        <li key={ i }>
                                            <PublicationListElement
                                                publication={pub}
                                            />
                                        </li>
                                    );
                                })
                                }
                            </ul>
                        </section>
                    );
            })
            }
            </>
        );
    }
}
