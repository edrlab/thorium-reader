// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as LoaderIcon from "readium-desktop/renderer/assets/icons/loader.svg";
import * as stylesLoader from "readium-desktop/renderer/assets/styles/loader.css";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { ILibraryRootState } from "../../../common/redux/states/renderer/libraryRootState";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class LoaderMainLoad extends React.Component<IProps, undefined> {

    public render() {
        const { mainProcessLoad } = this.props;

        if (!mainProcessLoad) {
            return (<></>);
        }
        return (
            <div className={stylesLoader.loader_small}>
                <SVG ariaHidden={true} svg={LoaderIcon} />
            </div>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    mainProcessLoad: state.load.state,
});

export default connect(mapStateToProps)(LoaderMainLoad);
