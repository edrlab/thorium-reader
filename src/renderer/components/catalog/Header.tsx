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

import PublicationAddButton from "./PublicationAddButton";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { TranslatorProps, withTranslator } from "../utils/translator";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface Props extends RouteComponentProps, TranslatorProps {
    displayType: DisplayType;
}

export class Header extends React.Component<Props, undefined> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <SecondaryHeader id={styles.catalog_header}>
                <Link
                    to={{search: "displayType=grid"}}
                    style={(this.props.displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                    title={__("header.gridTitle")}
                >
                    <SVG svg={GridIcon} ariaHidden/>
                </Link>
                <Link
                    to={{search: "displayType=list"}}
                    style={this.props.displayType !== DisplayType.List ? {fill: "grey"} : {}}
                    title={__("header.listTitle")}
                >
                    <SVG svg={ListIcon} ariaHidden/>
                </Link>
                <SearchForm />
                {this.AllBooksButton(window.location.hash, __)}
                <PublicationAddButton />
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: any, __: any) {
        if (hash === "#/library" || hash === "#/" ||
        hash === "#/library?displayType=grid" || hash === "#/?displayType=grid" ||
        hash === "#/library?displayType=list" || hash === "#/?displayType=list") {
            return (
                <Link
                id={styles.all_link_button}
                to={{pathname: "/library/search/all",
                state: {
                    displaytype: this.props.displayType as DisplayType,
                },
                }}
                >
                    {__("header.allBooks")}
                </Link>
            );
        }
        return (<></>);
    }
}

export default withTranslator(withRouter(Header)) ;
