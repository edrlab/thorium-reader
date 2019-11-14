// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class DownloadsList extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, downloadState } = this.props;
        return (
            <LibraryLayout title={__("header.downloads")}>
                { (downloadState && downloadState.downloads && downloadState.downloads.length) ?
                <ul>
                    {
                    downloadState.downloads.map((dl, i) => {
                        return <li key={i}>
                            <span>[{dl.progress}%]</span> <span>{dl.title ? dl.title : dl.url}</span>
                        </li>;
                    })
                    }
                </ul> :
                <></>
                }
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {
    return {
        downloadState: state.download,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // doStuff: (arg: any) => dispatch(downloadActions.doStuff.build(arg)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(DownloadsList));
