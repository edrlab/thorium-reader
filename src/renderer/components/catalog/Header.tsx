// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import {
    DisplayType, RouterLocationState,
} from "readium-desktop/renderer/components/utils/displayType";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import PublicationAddButton from "./PublicationAddButton";
import SearchForm from "./SearchForm";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        let displayType = DisplayType.Grid;
        if (this.props.location?.state?.displayType) {
            displayType = this.props.location.state.displayType as DisplayType;
        }

        return (
            <SecondaryHeader id={styles.catalog_header}>
                <Link
                    to={{
                        pathname: this.props.location.pathname,
                        search: this.props.location.search,
                        hash: this.props.location.hash,
                        state: {
                            displayType: DisplayType.Grid,
                        } as RouterLocationState,
                    }}
                    replace={true}
                    style={(displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                    title={__("header.gridTitle")}
                >
                    <SVG svg={GridIcon} ariaHidden/>
                </Link>
                <Link
                    to={{
                        pathname: this.props.location.pathname,
                        search: this.props.location.search,
                        hash: this.props.location.hash,
                        state: {
                            displayType: DisplayType.List,
                        } as RouterLocationState,
                    }}
                    replace={true}
                    style={displayType !== DisplayType.List ? {fill: "grey"} : {}}
                    title={__("header.listTitle")}
                >
                    <SVG svg={ListIcon} ariaHidden/>
                </Link>
                <SearchForm />
                {this.AllBooksButton(window.location.hash, displayType)}
                <PublicationAddButton />
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: string, displayType: DisplayType) {
        const search = hash.indexOf("search");
        if (search === -1) {
            return (
                <Link
                    id={styles.all_link_button}
                    to={{
                        pathname: "/library/search/all",
                        search: undefined,
                        hash: undefined,
                        state: {
                            displayType,
                        } as RouterLocationState,
                    }}
                >
                    {this.props.__("header.allBooks")}
                </Link>
            );
        }
        return (<></>);
    }
}

export default withTranslator(withRouter(Header)) ;
