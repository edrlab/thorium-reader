import * as React from "react";

import * as uuid from "uuid";

import { RootState } from "readium-desktop/renderer/redux/states";

import { readerActions } from "readium-desktop/common/redux/actions";

import { CatalogView } from "readium-desktop/common/views/catalog";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import AddEntryForm from "./AddEntryForm";

interface GridViewProps {
    catalogEntries: CatalogEntryView[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                {
                    this.props.catalogEntries.map((entry, i: number) => {
                        return (
                            <section key={ i }>
                                <h1>{ entry.title }</h1>
                                <Slider
                                    className={styles.slider}
                                    content={entry.publications.map((pub) =>
                                        <PublicationCard
                                            key={pub.identifier}
                                            publication={pub}
                                        />,
                                    )}
                                />
                            </section>
                        );
                })
                }
                <AddEntryForm/>
            </>
        );
    }
}
