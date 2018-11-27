import * as uuid from "uuid";

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import BookDetailsDialog from "readium-desktop/renderer/components/BookDetailsDialog";
import Header from "readium-desktop/renderer/components/Header";
import MyBooksHeader from "readium-desktop/renderer/components/myBooks/MyBooksHeader";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import { PublicationView } from "readium-desktop/common/views/publication";

import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationListElement } from "readium-desktop/renderer/components/Publication";

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
