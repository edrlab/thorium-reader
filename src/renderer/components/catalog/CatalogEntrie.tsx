import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import { PublicationView } from "readium-desktop/common/views/publication";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css"

import PublicationCard from "readium-desktop/renderer/components/Publication/PublicationCard";
import Slider from "readium-desktop/renderer/components/utils/Slider";
import PublicationListElement from "readium-desktop/renderer/components/Publication/PublicationListElement";

interface CatalogEntryProps {
    entry: CatalogEntryView;
    handleRead: any;
    handleMenuClick: any;
    openDialog: any;
    list?: boolean;
}

export default class CatalogEntry extends React.Component<CatalogEntryProps, undefined> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const catalogEntry = this.props.entry;

        return !this.props.list ?
        (
            <section>
                <h1>{ catalogEntry.title }</h1>
                    <Slider
                        className={styles.slider}
                        displayQty={6}
                        content={this.props.entry.publications.map((pub) =>
                            <PublicationCard
                                key={pub.identifier}
                                publication={pub}
                                handleRead={this.props.handleRead}
                                handleMenuClick={this.props.handleMenuClick}
                                openDialog={this.props.openDialog}
                            />,
                        )}
                    />
            </section>
        ) : (
            <section>
                        <h1>Reprendre la lecture</h1>
                        <ul>
                            { this.props.entry && this.props.entry.publications.map((pub, i: number) => {
                                return (
                                    <PublicationListElement
                                        key={i}
                                        publication={pub}
                                        id={i}
                                        openDialog={this.props.openDialog}
                                    />
                                );
                            })}
                        </ul>
                    </section>
        );
    }
}
