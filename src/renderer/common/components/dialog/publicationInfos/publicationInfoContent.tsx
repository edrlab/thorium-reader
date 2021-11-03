// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { formatTime } from "readium-desktop/common/utils/time";
import { IOpdsBaseLinkView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

import Cover from "../../Cover";
import { FormatContributorWithLink } from "./FormatContributorWithLink";
import { FormatPublicationLanguage } from "./formatPublicationLanguage";
import { FormatPublisherDate } from "./formatPublisherDate";
import LcpInfo from "./LcpInfo";
import PublicationInfoDescription from "./PublicationInfoDescription";

export interface IProps {
    publication: TPublication;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    ControlComponent?: React.ComponentType<any>;
    TagManagerComponent: React.ComponentType<any>;
    coverZoom: boolean;
    translator: Translator;
    onClikLinkCb?: (tag: IOpdsBaseLinkView) => () => void | undefined;
}

const Duration = (props: {
    duration: number;
    __: I18nTyped;
}) => {

    const { duration, __ } = props;

    if (!duration) {
        return <></>;
    }

    const sentence = formatTime(duration);

    return (
        sentence
            ? <>
                <strong>{`${__("publication.duration.title")}: `}</strong>
                <i className={styles.allowUserSelect}>
                    {sentence}
                </i>
                <br />
            </>
            : <></>);
};

const Progression = (props: {
    locatorExt: LocatorExtended,
    __: I18nTyped;
}) => {

    const { __, locatorExt } = props;

    if (locatorExt?.locator?.locations?.progression && locatorExt?.audioPlaybackInfo
        // total duration can be undefined with badly-constructed publications,
        // for example we found some LibriVox W3C LPF audiobooks missing duration property on reading order resources
        && locatorExt.audioPlaybackInfo.globalDuration) {

        const percent = Math.round(locatorExt.locator.locations.position * 100);
        const time = Math.round(locatorExt.audioPlaybackInfo.globalTime);
        const duration = Math.round(locatorExt.audioPlaybackInfo.globalDuration);
        const sentence = `${percent}% (${formatTime(time)} / ${formatTime(duration)})`;

        return (
            <>
                <strong>{`${__("publication.progression.title")}: `}</strong>
                <i className={styles.allowUserSelect}>
                    {sentence}
                </i>
                <br />
            </>
        );
    }
    return (<></>);
};

export const PublicationInfoContent: React.FC<IProps> = (props) => {

    // tslint:disable-next-line: max-line-length
    const { publication, toggleCoverZoomCb, ControlComponent, TagManagerComponent, coverZoom, translator, onClikLinkCb } = props;
    const __ = translator.translate;

    return (
        <>
            <div className={styles.row}>
                <div className={styles.col_book_img}>
                    <div className={styles.image_wrapper}>
                        <div>
                            <Cover
                                publicationViewMaybeOpds={publication}
                                onClick={() => toggleCoverZoomCb(coverZoom)}
                                onKeyPress={
                                    (e: React.KeyboardEvent<HTMLImageElement>) =>
                                        e.key === "Enter" && toggleCoverZoomCb(coverZoom)
                                }
                            ></Cover>
                        </div>
                    </div>
                </div>
                <div className={styles.col}>
                    <FormatContributorWithLink
                        contributors={publication.authors}
                        translator={translator}
                        onClickLinkCb={onClikLinkCb}
                    />
                    <h2 className={classNames(styles.allowUserSelect, styles.mt_10)}>
                        {publication.title}
                    </h2>
                    { ControlComponent && <ControlComponent /> }
                    <FormatPublisherDate publication={publication} __={__} />
                    <div className={styles.d_flex}>
                        <div className={styles.flex_none}>
                            <strong className={styles.mr_10}>
                                {__("catalog.tags")}
                            </strong>
                        </div>
                        <div className={styles.flex_1}>
                            <TagManagerComponent />
                        </div>
                    </div>
                </div>
            </div>

            <section>
                <PublicationInfoDescription publication={publication} __={__} />
            </section>
            <section>
                <h3>{__("catalog.moreInfo")}</h3>
                <p>
                    {
                        publication.publishers?.length ?
                            <>
                                <strong>{`${__("catalog.publisher")}: `}</strong>
                                <i className={styles.allowUserSelect}>
                                    <FormatContributorWithLink
                                        contributors={publication.publishers}
                                        translator={translator}
                                        onClickLinkCb={onClikLinkCb}
                                    />
                                </i>
                                <br />
                            </> : undefined
                    }
                    {
                        publication.languages?.length ?
                            <>
                                <strong>{`${__("catalog.lang")}: `}</strong>
                                <FormatPublicationLanguage publication={publication} __={__} />
                                <br />
                            </> : undefined
                    }
                    {
                        publication.numberOfPages ?
                            <>
                                <strong>{`${__("catalog.numberOfPages")}: `}</strong>
                                <i className={styles.allowUserSelect}>
                                    {publication.numberOfPages}
                                </i>
                                <br />

                            </> : undefined
                    }
                    <Duration
                        __={__}
                        duration={publication.duration}
                    />
                    <Progression
                        __={__}
                        locatorExt={publication.lastReadingLocation}
                    />
                    {
                        publication.nbOfTracks ?
                            <>
                                <strong>{`${__("publication.audio.tracks")}: `}</strong>
                                <i className={styles.allowUserSelect}>
                                    {publication.nbOfTracks}
                                </i>
                                <br />

                            </> : undefined
                    }
                </p>
                <LcpInfo publicationLcp={publication} />
            </section>
        </>
    );
};
