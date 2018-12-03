import * as React from "react";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link } from "react-router-dom";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface Props {
    displayType: DisplayType;
}

export default class Header extends React.Component<Props, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <SecondaryHeader>
                <Link
                    to={{search: "displayType=grid"}}
                    style={(this.props.displayType != DisplayType.Grid) ? {fill: "grey"} : {}}
                >
                    <SVG svg={GridIcon} title="Présenter les couvertures de livres en grille"/>
                </Link>
                <Link
                    to={{search: "displayType=list"}}
                    style={this.props.displayType != DisplayType.List ? {fill: "grey"} : {}}
                >
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

}
