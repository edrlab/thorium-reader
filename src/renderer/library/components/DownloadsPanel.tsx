// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesApp from "readium-desktop/renderer/assets/styles/app.scss";

import * as React from "react";
import { connect } from "react-redux";
import { downloadActions } from "readium-desktop/common/redux/actions";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import * as CloseIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class DownloadsPanel extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, downloadState, abortDownload } = this.props;
        if (!downloadState || !downloadState.length) {
            return <></>;
        }
        return (<div className={stylesApp.downloadsPanel}
            aria-live="polite"
            role="alert"
            >
            <div>{ __("header.downloads")}</div>
            <ul>
                {
                downloadState.map(([dl, id]) => {
                    // console.log(JSON.stringify(dl, null, 4));
                    let progress = dl.progress;
                    if (isNaN(progress)) {
                        progress = 0;
                    }
                    return <li key={id}>
                        <span className={stylesApp.title}><a onClick={() => abortDownload(id)}><SVG ariaHidden svg={CloseIcon} /></a></span>
                        {
                            progress === 0 ? // indeterminate
                            (<>
                                <span className={stylesApp.percent}>? %</span>
                                <progress value={undefined}>{"..."}</progress>
                            </>)
                            :
                            (<>
                                <span className={stylesApp.percent}>{progress}%</span>
                                <progress max="100" value={progress}>{progress}</progress>
                            </>)
                        }
                        <span className={stylesApp.title}>{dl.downloadLabel}</span>
                        <span className={stylesApp.title}>{dl.contentLengthHumanReadable}</span>
                        <span className={stylesApp.title}>{Math.trunc(dl.speed || 0) + " Kb/s"}</span>

                    </li>;
                })
                }
            </ul>
        </div>);
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        downloadState: state.download,
        locale: state.i18n.locale, // refresh
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // doStuff: (arg: any) => dispatch(downloadActions.doStuff.build(arg)),
        abortDownload: (id: number) => dispatch(downloadActions.abort.build(id)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(DownloadsPanel));
