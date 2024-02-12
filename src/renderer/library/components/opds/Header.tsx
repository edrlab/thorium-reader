// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import * as GridIcon from "readium-desktop/renderer/assets/icons/grid-icon.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list-icon.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import SecondaryHeader from "readium-desktop/renderer/library/components/SecondaryHeader";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import ApiappAddFormDialog from "readium-desktop/renderer/library/components/dialog/ApiappAddForm";
import OpdsFeedAddForm from "../dialog/OpdsFeedAddForm";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, location } = this.props;

        const displayType = (location?.state && (location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        // FIXME : css in code
        return (
            <SecondaryHeader>
                <div>
                    <h3>{__("header.viewMode")}</h3>
                    <div style={{display: "flex", gap: "10px"}}>
                        <Link
                            to={this.props.location}
                            state = {{displayType: DisplayType.Grid}}
                            replace={true}
                            className={(displayType === DisplayType.Grid) ?
                                stylesButtons.button_nav_primary :
                                stylesButtons.button_nav_secondary
                            }
                            title={__("header.gridTitle")}
                            aria-pressed={displayType === DisplayType.Grid}
                            role={"button"}
                        >
                            {(displayType === DisplayType.Grid) ?
                                <SVG svg={CheckIcon} ariaHidden/> :
                                <SVG svg={GridIcon} ariaHidden/>
                            }
                            <h3>{__("header.gridTitle")}</h3>
                        </Link>
                        <Link
                            to={this.props.location}
                            state = {{displayType: DisplayType.List}}
                            replace={true}
                            className={(displayType === DisplayType.List) ?
                                stylesButtons.button_nav_primary :
                                stylesButtons.button_nav_secondary
                            }
                            title={__("header.listTitle")}
                            aria-pressed={displayType === DisplayType.List}
                            role={"button"}
                        >
                            {(displayType === DisplayType.List) ?
                                <SVG svg={CheckIcon} ariaHidden/> :
                                <SVG svg={ListIcon} ariaHidden/>
                            }
                            <h3>{__("header.listTitle")}</h3>
                        </Link>
                    </div>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                    <OpdsFeedAddForm />
                    <ApiappAddFormDialog />
                </div>
            </SecondaryHeader>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    headerLinks: state.opds.browser.header,
    breadcrumb: state.opds.browser.breadcrumb,
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(Header));
