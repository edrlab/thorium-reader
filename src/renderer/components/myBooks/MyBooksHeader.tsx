import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link } from "react-router-dom";

interface Props {
    dialogOpen: boolean;
    list?: boolean;
}

export default class MyBooksHeader extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <SecondaryHeader style={this.getDialogBlur()}>
                <Link to="/" style={this.props.list ? {fill: "grey"} : {}}>
                    <SVG svg={GridIcon} title="Présenter les couvertures de livres en grille"/>
                </Link>
                <Link to="/myBooks/list" style={!this.props.list ? {fill: "grey"} : {}}>
                    <SVG svg={ListIcon} title="Présenter les livres sous forme de liste"/>
                </Link>
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
        );
    }

    private getDialogBlur() {
        return this.props.dialogOpen ? {filter: "blur(2px)"} : {};
    }
}
