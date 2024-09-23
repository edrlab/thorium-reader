// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesLoader from "readium-desktop/renderer/assets/styles/loader.scss";

import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as LoaderIcon from "readium-desktop/renderer/assets/icons/loader.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

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

class LoaderSearch extends React.Component<IProps, undefined> {

    public render() {
        const { load } = this.props;

        if (!load) {
            return (<></>);
        }
        return (
            <div className={stylesLoader.loader_search_picker}>
                <SVG ariaHidden={true} svg={LoaderIcon} />
            </div>
        );
    }
}

const mapStateToProps = (state: IReaderRootState) => ({
    load: state.search.state === "busy",
});

export default connect(mapStateToProps)(LoaderSearch);
