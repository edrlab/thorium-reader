import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import Slider from "readium-desktop/renderer/components/utils/Slider";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Catalog } from "readium-desktop/common/models/catalog";
import { PublicationCard } from "readium-desktop/renderer/components/Publication";

import { Publication } from "readium-desktop/common/models/publication";

import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";

interface Props {
    catalog: Catalog;

}

export class MyBooks extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RootState>;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        return (
            <>
                <SecondaryHeader>
                    <a>
                        <SVG svg={GridIcon} title="Présenter les couvertures de livres en grille"/>
                    </a>
                    <a>
                        <SVG svg={ListIcon} title="Présenter les livres sous forme de liste"/>
                    </a>
                    <form role="search">
                        <input
                            type="search"
                            id="menu_search"
                            aria-label="Rechercher un livre, un tag, ou un type de littérature"
                            placeholder="Rechercher"
                        />
                        <button>
                            <SVG svg={SearchIcon} title="Lancer la recherche"/>
                        </button>
                    </form>
                </SecondaryHeader>
                <main id={styles.main} role="main">
                    <a id="contenu" tabIndex={-1}></a>
                    <section>
                        <h1>Derniers ajouts</h1>
                        { this.props.catalog && this.props.catalog.publications &&
                            <Slider
                                className={styles.slider}
                                displayQty={6}
                                content={this.props.catalog.publications.map((pub, index: number) =>
                                    <PublicationCard
                                        key={index}
                                        publication={pub}
                                        handleRead={this.handleRead.bind(this)}
                                    />,
                                )}
                            />
                        }
                    </section>
                </main>
            </>
        );
    }

    private handleRead(publication: Publication) {
        this.store.dispatch(readerActions.open(publication));
    }
}

const mapStateToProps = (state: any) => {
    return {
        catalog: {
            title: "My Books",
            publications: state.catalog.publications,
        },
    };
};

export default connect(mapStateToProps)(MyBooks);
