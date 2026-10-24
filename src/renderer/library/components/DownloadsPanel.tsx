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

/** Individual file transfer, identified by its stable index within its parent batch. */
export type SubDownloadPanelItem = downloadActions.progress.SubDownloadProgress;

/** One active batch with aggregate progress and individual file transfers. */
export interface DownloadPanelItem {
    id: number;
    label: string;
    urls: readonly string[];
    /** Percentage in [0, 100]; undefined means indeterminate. */
    progress: number | undefined;
    /** Transfer rate in KiB/s. */
    speedKiBPerSecond: number;
    sizeLabel: string;
    subDownloads: readonly SubDownloadPanelItem[];
}

/** Presentation API for replacement download UIs; no Redux or translator context required. */
export interface DownloadsPanelProps {
    downloads: readonly DownloadPanelItem[];
    onCancel: (id: number) => void;
    labels: {
        heading: string;
        cancel: (download: DownloadPanelItem) => string;
        progress: (download: DownloadPanelItem) => string;
        progressUnknown?: string;
    };
}

export class DownloadsPanelView extends React.Component<DownloadsPanelProps> {

    public render(): React.ReactElement<{}> {
        const { downloads, onCancel, labels } = this.props;
        if (!downloads.length) {
            return <></>;
        }
        return (<section className={stylesApp.downloadsPanel}
            aria-labelledby="downloads-panel-heading"
            >
            <h2 id="downloads-panel-heading">{labels.heading}</h2>
            <ul>
                {
                downloads.map((dl) => {
                    const { id, progress } = dl;
                    return <li key={id}>
                        <span className={stylesApp.title}><button type="button" aria-label={labels.cancel(dl)} onClick={() => onCancel(id)}><SVG ariaHidden svg={CloseIcon} /></button></span>
                        {
                            progress === undefined ? // indeterminate
                            (<>
                                <span aria-hidden="true" className={stylesApp.percent}>? %</span>
                                <progress aria-label={labels.progress(dl)} aria-description={labels.progressUnknown} value={undefined}>{"..."}</progress>
                            </>)
                            :
                            (<>
                                <span aria-hidden="true" className={stylesApp.percent}>{progress}%</span>
                                <progress aria-label={labels.progress(dl)} max="100" value={progress}>{progress}</progress>
                            </>)
                        }
                        <span className={stylesApp.title}>{dl.label}</span>
                        <span className={stylesApp.title}>{dl.sizeLabel}</span>
                        <span className={stylesApp.title}>{Math.trunc(dl.speedKiBPerSecond || 0) + " Kb/s"}</span>

                    </li>;
                })
                }
            </ul>
        </section>);
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    downloads: state.download.map(([download, id]): DownloadPanelItem => ({
        id,
        label: download.downloadLabel,
        urls: download.downloadUrls,
        progress: Number.isFinite(download.progress)
            ? Math.min(100, Math.max(0, download.progress)) : undefined,
        speedKiBPerSecond: download.speed,
        sizeLabel: download.contentLengthHumanReadable,
        subDownloads: download.subDownloads || [],
    })),
    locale: state.i18n.locale, // refresh translated labels when the locale changes
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    onCancel: (id: number) => dispatch(downloadActions.abort.build(id)),
});

type ConnectedProps = TranslatorProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const DownloadsPanel = ({ __, downloads, onCancel }: ConnectedProps) => (
    <DownloadsPanelView downloads={downloads} onCancel={onCancel} labels={{
        heading: __("header.downloads"),
        progressUnknown: __("accessibility.downloadProgressUnknown"),
        cancel: (download) => __("accessibility.cancelDownload", { title: download.label }),
        progress: (download) => __("accessibility.downloadProgress", { title: download.label }),
    }} />
);

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(DownloadsPanel));
