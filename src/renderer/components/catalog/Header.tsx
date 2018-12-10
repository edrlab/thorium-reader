import * as React from "react";

import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import SearchForm from "./SearchForm";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface Props extends RouteComponentProps {
    displayType: DisplayType;
}

export class Header extends React.Component<Props, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <SecondaryHeader>
                <Link
                    to={{search: "displayType=grid"}}
                    style={(this.props.displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                >
                    <SVG svg={GridIcon} title="Présenter les couvertures de livres en grille"/>
                </Link>
                <Link
                    to={{search: "displayType=list"}}
                    style={this.props.displayType !== DisplayType.List ? {fill: "grey"} : {}}
                >
                    <SVG svg={ListIcon} title="Présenter les livres sous forme de liste"/>
                </Link>
                <SearchForm />
            </SecondaryHeader>
        );
    }
}

export default withRouter(Header);
