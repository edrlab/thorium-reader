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
import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { parseQueryString } from "readium-desktop/utils/url";

import SearchForm from "./SearchForm";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    displayType: DisplayType;
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
        const search = parseQueryString(this.props.location.search.replace("?", ""));
        const displayType = search.displayType || DisplayType.Grid;
        delete(search.displayType);

        /**
         * Why css style is apply in code and not imported from css ressource ?
         * FIXME : css in code
         */
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
