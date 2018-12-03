import * as React from "react";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import * as styles from "readium-desktop/renderer/assets/styles/searchResult.css";

import { RouteComponentProps} from "react-router-dom";

import { Publication } from "readium-desktop/common/models/publication";

interface GridViewProps extends RouteComponentProps {
    publications: Publication[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <div className={styles.card_wrapper}>
                {this.props.publications.map((pub) =>
                    <PublicationCard
                        key={pub.identifier}
                        publication={pub}
                    />,
                )}
                <div className={styles.card_substitute}></div>
                <div className={styles.card_substitute}></div>
                <div className={styles.card_substitute}></div>
                <div className={styles.card_substitute}></div>
                <div className={styles.card_substitute}></div>
                <div className={styles.card_substitute}></div>
            </div>
        );
    }
}
