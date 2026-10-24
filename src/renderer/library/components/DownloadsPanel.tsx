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

const formatBytes = (bytes: number): string => bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    : `${(bytes / 1024).toFixed(1)} KiB`;

export class DownloadsPanelView extends React.Component<DownloadsPanelProps> {

    public render(): React.ReactElement<{}> {
        const { downloads, onCancel, labels } = this.props;
        if (!downloads.length) {
            return <></>;
        }
        return (<section className={stylesApp.downloadsPanel}
            aria-labelledby="downloads-panel-heading"
            tabIndex={0}
            >
            <h2 id="downloads-panel-heading">{labels.heading}</h2>
            <ul role="list">
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
                        <span className={stylesApp.title}>{Math.trunc(dl.speedKiBPerSecond || 0) + " KiB/s"}</span>
                        {dl.subDownloads.length > 0 && <ul role="list" aria-label={labels.progress(dl)} className={stylesApp.subDownloads}>
                            {dl.subDownloads.map((file) => {
                                const filename = file.filename || file.url;
                                const fileProgress = Number.isFinite(file.progress)
                                    ? Math.min(100, Math.max(0, file.progress)) : undefined;
                                return <li key={file.id}>
                                    <span className={stylesApp.filename} title={file.url}>{filename}</span>
                                    <span aria-hidden="true" className={stylesApp.percent}>{fileProgress === undefined ? "? %" : `${Math.trunc(fileProgress)}%`}</span>
                                    <progress aria-label={`${labels.progress(dl)}: ${filename}`} aria-description={fileProgress === undefined ? labels.progressUnknown : undefined} max="100" value={fileProgress} />
                                    <span className={stylesApp.transferSize}>
                                        {formatBytes(file.downloadedBytes)}
                                        {file.totalBytes !== undefined && ` / ${formatBytes(file.totalBytes)}`}
                                    </span>
                                    <span className={stylesApp.transferSpeed}>{Math.trunc(file.speedKiBPerSecond || 0)} KiB/s</span>
                                </li>;
                            })}
                        </ul>}
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
