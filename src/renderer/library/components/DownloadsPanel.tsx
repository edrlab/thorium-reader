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

<<<<<<< Updated upstream
const formatSpeed = (speed: number): string | undefined =>
    Number.isFinite(speed) && speed > 0 ? `${formatBytes(speed * 1024)}/s` : undefined;

const formatTransfer = (downloaded: number, total?: number): string =>
    total === undefined ? formatBytes(downloaded) : `${formatBytes(downloaded)} / ${formatBytes(total)}`;

const TransferProgress = ({ progress, label, unknown }: {
    progress?: number;
    label: string;
    unknown?: string;
}) => (
    <div className={stylesApp.downloadProgress}>
        <progress aria-label={label} aria-description={progress === undefined ? unknown : undefined}
            max={100} value={progress} />
        {progress !== undefined && <span aria-hidden="true">{Math.floor(progress)}%</span>}
    </div>
);

=======
>>>>>>> Stashed changes
export class DownloadsPanelView extends React.Component<DownloadsPanelProps> {

    public render(): React.ReactElement<{}> {
        const { downloads, onCancel, labels } = this.props;
        if (!downloads.length) {
            return <></>;
        }
<<<<<<< Updated upstream
        return (<section className={stylesApp.downloadsPanel}
            aria-labelledby="downloads-panel-heading"
            tabIndex={0}
            >
            <h2 id="downloads-panel-heading">{labels.heading} <span>({downloads.length})</span></h2>
            <ul role="list" className={stylesApp.downloadList}>
                {downloads.map((dl) => {
                    const { id, progress, subDownloads } = dl;
                    const label = dl.label || subDownloads[0]?.filename || dl.urls[0] || labels.heading;
                    const namedDownload = dl.label ? dl : { ...dl, label };
                    const cancelLabel = labels.cancel(namedDownload);
                    const progressLabel = labels.progress(namedDownload);
                    const downloaded = subDownloads.reduce((sum, file) => sum + file.downloadedBytes, 0);
                    const total = subDownloads.every((file) => file.totalBytes !== undefined) ?
                        subDownloads.reduce((sum, file) => sum + (file.totalBytes ?? 0), 0) : undefined;
                    const size = subDownloads.length ? formatTransfer(downloaded, total) : dl.sizeLabel;
                    const speed = formatSpeed(dl.speedKiBPerSecond);
                    return <li key={id} className={stylesApp.downloadItem}>
                        <div className={stylesApp.downloadTitle}>
                            <bdi title={label}>{label}</bdi>
                            <button type="button" aria-label={cancelLabel} title={cancelLabel} onClick={() => onCancel(id)}>
                                <SVG ariaHidden svg={CloseIcon} />
                            </button>
                        </div>
                        <TransferProgress progress={progress} label={progressLabel} unknown={labels.progressUnknown} />
                        {(size || speed) && <div className={stylesApp.downloadMetrics}>
                            <bdi>{size}</bdi>
                            {speed && <bdi>{speed}</bdi>}
                        </div>}
                        {subDownloads.length > 1 && <ul role="list" aria-label={progressLabel} className={stylesApp.subDownloads}>
                            {subDownloads.map((file) => {
=======
        return (<div className={stylesApp.downloadsPanel}
            role="region"
            aria-label={labels.heading}
            tabIndex={0}
            >
            <div>{ labels.heading}</div>
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
                                <progress aria-label={labels.progress(dl)} value={undefined}>{"..."}</progress>
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
>>>>>>> Stashed changes
                                const filename = file.filename || file.url;
                                const fileProgress = Number.isFinite(file.progress)
                                    ? Math.min(100, Math.max(0, file.progress)) : undefined;
                                return <li key={file.id}>
<<<<<<< Updated upstream
                                    <bdi className={stylesApp.downloadFilename} title={filename}>{filename}</bdi>
                                    <TransferProgress progress={fileProgress} label={`${progressLabel}: ${filename}`}
                                        unknown={labels.progressUnknown} />
                                    <div className={stylesApp.downloadMetrics}>
                                        <bdi>{formatTransfer(file.downloadedBytes, file.totalBytes)}</bdi>
                                        {file.speedKiBPerSecond > 0 && <bdi>{formatSpeed(file.speedKiBPerSecond)}</bdi>}
                                    </div>
=======
                                    <span className={stylesApp.filename} title={file.url}>{filename}</span>
                                    <span aria-hidden="true" className={stylesApp.percent}>{fileProgress === undefined ? "? %" : `${Math.trunc(fileProgress)}%`}</span>
                                    <progress aria-label={`${labels.progress(dl)}: ${filename}`} max="100" value={fileProgress} />
                                    <span className={stylesApp.transferSize}>
                                        {formatBytes(file.downloadedBytes)}
                                        {file.totalBytes !== undefined && ` / ${formatBytes(file.totalBytes)}`}
                                    </span>
                                    <span className={stylesApp.transferSpeed}>{Math.trunc(file.speedKiBPerSecond || 0)} KiB/s</span>
>>>>>>> Stashed changes
                                </li>;
                            })}
                        </ul>}
                    </li>;
                })}
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
