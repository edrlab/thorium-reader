// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";

import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import SearchForm from "./SearchForm";

import SVG from "readium-desktop/renderer/components/utils/SVG";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface HeaderProps extends RouteComponentProps {
    displayType?: DisplayType;
}

export class Header extends React.Component<HeaderProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <SecondaryHeader>
                { this.props.displayType &&
                    <>
                        <Link
                            to={{search: "displayType=grid"}}
                            style={(this.props.displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                        >
                            <SVG svg={GridIcon} title="Présenter les couvertures de livres en grille"/>
                        </Link>
                        <Link
                            to={{search: "displayType=list"}}
                            style={this.props.displayType !== DisplayType.List ?
                                {fill: "grey", marginLeft: "16px"} : {}}
                        >
                            <SVG svg={ListIcon} title="Présenter les livres sous forme de liste"/>
                        </Link>
                    </>
                }
                <SearchForm />
            </SecondaryHeader>
        );
    }
}

export default withRouter(Header);
