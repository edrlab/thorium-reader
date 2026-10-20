// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesLoader from "readium-desktop/renderer/assets/styles/loader.scss";

import * as React from "react";
import { connect } from "react-redux";
import Loader from "readium-desktop/renderer/common/components/Loader";

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

        return <Loader active={mainProcessLoad} className={stylesLoader.loader_small} />;
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    mainProcessLoad: state.load.state,
});

export default connect(mapStateToProps)(LoaderMainLoad);
