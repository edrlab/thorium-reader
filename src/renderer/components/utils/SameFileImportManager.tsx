// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { RootState } from "readium-desktop/renderer/redux/states";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class SameFileImportManager extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public componentDidUpdate(oldProps: IProps) {
        const { lastImport, downloads } = this.props;

        if (lastImport !== oldProps.lastImport) {
            if (downloads.findIndex((value) => value.url === lastImport.opdsPublicationView.url) < 0) {
                apiAction("publication/importOpdsEntry",
                    lastImport.opdsPublicationView.url,
                    lastImport.opdsPublicationView.r2OpdsPublicationBase64,
                    lastImport.opdsPublicationView.title,
                    lastImport.opdsPublicationView.tags,
                    lastImport.downloadSample,
                ).catch((error) => {
                    console.error(`Error to fetch api publication/importOpdsEntry`, error);
                });
            }
        }
    }

    public render(): React.ReactElement<{}> {
        return (<></>);
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {
    return {
        lastImport: state.import,
        downloads: state.download.downloads,
    };
};

export default connect(mapStateToProps)(SameFileImportManager);
