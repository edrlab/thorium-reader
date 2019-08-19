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

import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import { parseQueryString } from "readium-desktop/utils/url";
import SearchForm from "./SearchForm";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface HeaderProps extends RouteComponentProps, TranslatorProps {
    displayType?: DisplayType;
}

export class Header extends React.Component<HeaderProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const search = parseQueryString(this.props.location.search.replace("?", ""));
        const displayType = search.displayType || DisplayType.Grid;
        delete(search.displayType);

        return (
            <SecondaryHeader>
                { displayType &&
                    <>
                        <Link
                            to={{search: "displayType=grid"}}
                            style={(displayType !== DisplayType.Grid) ? {fill: "#767676"} : {}}
                        >
                            <SVG svg={GridIcon} title={__("header.gridTitle")}/>
                        </Link>
                        <Link
                            to={{search: "displayType=list"}}
                            style={ displayType !== DisplayType.List ?
                                {fill: "#757575", marginLeft: "16px"} : {marginLeft: "16px"}}
                        >
                            <SVG svg={ListIcon} title={__("header.listTitle")}/>
                        </Link>
                    </>
                }
                <SearchForm />
            </SecondaryHeader>
        );
    }
}

export default withTranslator(withRouter(Header));
