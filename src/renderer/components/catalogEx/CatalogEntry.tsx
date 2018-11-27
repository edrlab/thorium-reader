import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import { PublicationView } from "readium-desktop/common/views/publication";

interface CatalogEntryProps {
    entry: CatalogEntryView;
}

export default class CatalogEntry extends React.Component<CatalogEntryProps, undefined> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const catalogEntry = this.props.entry;

        return (
            <section>
                <h1>{ catalogEntry.title }</h1>
                <ul>
                    { catalogEntry.publications.map((pub: PublicationView, i: number) => {
                        return (
                            <li key={ i }>
                                <span>{ pub.title }</span>
                            </li>
                        );
                    })}
                </ul>
            </section>
        );
    }
}
