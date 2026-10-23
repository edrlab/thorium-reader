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

function DownloadStatus({ events, __ }: { events: ILibraryRootState["downloadLifecycle"]; __: TranslatorProps["__"] }) {
    const lastSequence = React.useRef(events[events.length - 1]?.sequence ?? 0);
    const [message, setMessage] = React.useState("");
    React.useEffect(() => {
        const pending = events.filter((event) => event.sequence > lastSequence.current);
        if (!pending.length) return;
        lastSequence.current = pending[pending.length - 1].sequence;
        setMessage(pending.map((event) => {
            const args = { title: event.label };
            switch (event.status) {
                case "started": return __("accessibility.downloadStarted", args);
                case "completed": return __("accessibility.downloadCompleted", args);
                case "failed": return __("accessibility.downloadFailed", args);
                case "cancelled": return __("accessibility.downloadCancelled", args);
            }
        }).join(" "));
    }, [events, __]);
    return <div className={stylesApp.downloadStatus} role="status" aria-live="polite" aria-atomic="true">{message}</div>;
}

class DownloadsPanel extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, downloadState, downloadLifecycle, abortDownload } = this.props;
        return (<>
            <DownloadStatus events={downloadLifecycle} __={__} />
            {!!downloadState?.length && <section className={stylesApp.downloadsPanel}
            aria-labelledby="downloads-panel-heading"
            >
            <h2 id="downloads-panel-heading">{ __("header.downloads")}</h2>
            <ul>
                {
                downloadState.map(([dl, id]) => {
                    // console.log(JSON.stringify(dl, null, 4));
                    let progress = dl.progress;
                    if (isNaN(progress)) {
                        progress = 0;
                    }
                    return <li key={id}>
                        <span className={stylesApp.title}><button type="button" aria-label={__("accessibility.cancelDownload", { title: dl.downloadLabel })} onClick={() => abortDownload(id)}><SVG ariaHidden svg={CloseIcon} /></button></span>
                        {
                            progress === 0 ? // indeterminate
                            (<>
                                <span className={stylesApp.percent}>? %</span>
                                <progress aria-label={__("accessibility.downloadProgress", { title: dl.downloadLabel })} value={undefined}>{"..."}</progress>
                            </>)
                            :
                            (<>
                                <span className={stylesApp.percent}>{progress}%</span>
                                <progress aria-label={__("accessibility.downloadProgress", { title: dl.downloadLabel })} max="100" value={progress}>{progress}</progress>
                            </>)
                        }
                        <span className={stylesApp.title}>{dl.downloadLabel}</span>
                        <span className={stylesApp.title}>{dl.contentLengthHumanReadable}</span>
                        <span className={stylesApp.title}>{Math.trunc(dl.speed || 0) + " Kb/s"}</span>

                    </li>;
                })
                }
            </ul>
        </section>}
        </>);
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        downloadState: state.download,
        downloadLifecycle: state.downloadLifecycle,
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
