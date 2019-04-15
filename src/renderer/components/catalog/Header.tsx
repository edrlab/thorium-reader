// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import SearchForm from "./SearchForm";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

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
            <SecondaryHeader id={styles.catalog_header}>
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
                    {this.AllBooksButton(window.location.hash)}
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: any) {
        if (hash === "#/library" || hash === "#/" ||
        hash === "#/library?displayType=grid" ||
        hash === "#/library?displayType=list") {
            return (
                <Link
                id={styles.all_link_button}
                to={{pathname: "/library/search/all"}}
                >
                    Tous les livres <SVG svg={ArrowIcon} />
                </Link>
            );
        }
        return (<></>);
    }
}

export default withRouter(Header);
