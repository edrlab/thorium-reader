// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar.svg";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as RefreshIcon from "readium-desktop/renderer/assets/icons/refresh.svg";
import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { RootState } from "readium-desktop/renderer/redux/states";
import { IOpdsBrowse } from "readium-desktop/renderer/routing";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

import SearchForm from "./SearchForm";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps>, RouteComponentProps<IOpdsBrowse> {
}

class Header extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const displayType = qs.parse(this.props.location.search).displayType || DisplayType.Grid;

        // FIXME : css in code
        return (
            <SecondaryHeader>
                <Link
                    to={{ search: "displayType=grid" }}
                    style={(displayType !== DisplayType.Grid) ? { fill: "#767676" } : {}}
                >
                    <SVG svg={GridIcon} title={__("header.gridTitle")} />
                </Link>
                <Link
                    to={{ search: "displayType=list" }}
                    style={displayType !== DisplayType.List ?
                        { fill: "#757575", marginLeft: "16px" } : { marginLeft: "16px" }}
                >
                    <SVG svg={ListIcon} title={__("header.listTitle")} />
                </Link>
                {this.home()}
                {this.refresh()}
                <SearchForm />
                {this.bookshelf()}
            </SecondaryHeader>
        );
    }

    private bookshelf = () => {
        const { bookshelf } = this.props.headerLinks;
        if (bookshelf) {

            const { __ } = this.props;

            return (
                <a
                    style={{ marginLeft: "16px" }}
                    href={bookshelf}
                >
                    <SVG svg={AvatarIcon} title={__("header.listTitle")} />
                </a>
            );
        }

        return undefined;
    }

    private home = () => {
        const { start } = this.props.headerLinks;
        if (start) {

            const { __ } = this.props;
            const param = this.props.match.params;
            const route = buildOpdsBrowserRoute(
                param.opdsId,
                __("header.listTitle"),
                start,
                1,
            );

            return (
                <Link
                    style={{ marginLeft: "16px" }}
                    to={route}
                >
                    <SVG svg={HomeIcon} title={__("header.listTitle")} />
                </Link>
            );
        }

        return undefined;
    }

    private refresh = () => {
        const { self } = this.props.headerLinks;
        if (self) {

            const { __ } = this.props;
            const param = this.props.match.params;
            const route = buildOpdsBrowserRoute(
                param.opdsId,
                __("header.listTitle"),
                self,
                parseInt(param.level, 10),
            );

            return (
                <Link
                    style={{ marginLeft: "16px" }}
                    to={route}
                >
                    <SVG svg={RefreshIcon} title={__("header.listTitle")} />
                </Link>
            );
        }

        return undefined;
    }
}

const mapStateToProps = (state: RootState) => ({
    headerLinks: state.opds.browser.header,
});

export default connect(mapStateToProps)(withTranslator(withRouter(Header)));
