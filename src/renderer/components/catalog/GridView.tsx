import * as React from "react";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import { Link, RouteComponentProps } from "react-router-dom";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface GridViewProps extends RouteComponentProps {
    catalogEntries: CatalogEntryView[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                { this.props.catalogEntries.map((entry, i: number) => {
                        return (
                            <section key={ i }>
                                <div className={styles.title}>
                                    <h1>{ entry.title }</h1>
                                    <Link to={{
                                        pathname: "/library/search",
                                        search: entry.tag ? "?tag=" + entry.tag : "",
                                    }}>
                                        Tous les livres <SVG svg={ArrowIcon} />
                                    </Link>
                                </div>
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
                })}
            </>
        );
    }
}
