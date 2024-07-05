// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as React from "react";
import { connect } from "react-redux";
// import { Link } from "react-router-dom";

// import * as GridIcon from "readium-desktop/renderer/assets/icons/grid-icon.svg";
// import * as ListIcon from "readium-desktop/renderer/assets/icons/list-icon.svg";
// import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
// import SVG from "readium-desktop/renderer/common/components/SVG";
import SecondaryHeader from "readium-desktop/renderer/library/components/SecondaryHeader";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
// import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
// import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
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
        // const { __, location } = this.props;

        // const displayType = (location?.state && (location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        // FIXME : css in code
        return (
            <SecondaryHeader style={{display: "flex", gap: "10px", alignItems: "end", height: "65px", justifyContent: "end", margin: "0px"}}>
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
