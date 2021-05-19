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
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

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
                <span>
                    {
                        `${__("publication.duration.title")}: `
                    }
                </span>
                <i className={styles.allowUserSelect}>
                    {
                        sentence
                    }
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

    if (locatorExt?.locator?.locations?.progression && locatorExt?.audioPlaybackInfo) {

        const percent = Math.round(locatorExt.locator.locations.position * 100);
        const time = Math.round(locatorExt.audioPlaybackInfo.globalTime);
        const duration = Math.round(locatorExt.audioPlaybackInfo.globalDuration);
        const sentence = `${percent}% (${formatTime(time)} / ${formatTime(duration)})`;

        return (
            <>
                <span>
                    {
                        `${__("publication.progression.title")}: `
                    }
                </span>
                <i className={styles.allowUserSelect}>
                    {
                        sentence
                    }
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
            <div className={styles.dialog_left}>
                <div className={styles.image_wrapper}>
                    <div>
                        <Cover
                            publicationViewMaybeOpds={publication}
                            onClick={
                                () => toggleCoverZoomCb(coverZoom)
                            }
                            onKeyPress={
                                (e: React.KeyboardEvent<HTMLImageElement>) =>
                                    e.key === "Enter" && toggleCoverZoomCb(coverZoom)
                            }
                        >
                        </Cover>
                    </div>
                </div>
                {
                    ControlComponent && <ControlComponent />
                }
            </div>

            <div className={styles.dialog_right}>
                <h2 className={styles.allowUserSelect}>
                    {publication.title}
                </h2>
                <div>
                    <p className={classNames(styles.allowUserSelect, styles.author)}>
                        <FormatContributorWithLink
                            contributors={publication.authors}
                            translator={translator}
                            onClickLinkCb={onClikLinkCb}
                        />
                    </p>
                    <FormatPublisherDate publication={publication} __={__} />
                    <div className={styles.tags}>
                        <div className={styles.tag_list}>
                            <span>
                                {__("catalog.tags")}
                            </span>
                            <TagManagerComponent />
                        </div>
                    </div>

                    <PublicationInfoDescription publication={publication} __={__} />

                    <h3>{__("catalog.moreInfo")}</h3>
                    <p>
                        {
                            publication.publishers?.length ?
                                <>
                                    <span>{`${__("catalog.publisher")}: `}</span>
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
                                    <span>
                                        {
                                            `${__("catalog.lang")}: `
                                        }
                                    </span>
                                    <FormatPublicationLanguage publication={publication} __={__} />
                                    <br />
                                </> : undefined
                        }
                        {
                            publication.numberOfPages ?
                                <>
                                    <span>
                                        {
                                            `${__("catalog.numberOfPages")}: `
                                        }
                                    </span>
                                    <i className={styles.allowUserSelect}>
                                        {
                                            publication.numberOfPages
                                        }
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
                                    <span>
                                        {
                                            `${__("publication.audio.tracks")}: `
                                        }
                                    </span>
                                    <i className={styles.allowUserSelect}>
                                        {
                                            publication.nbOfTracks
                                        }
                                    </i>
                                    <br />

                                </> : undefined
                        }
                    </p>

                    <LcpInfo publicationLcp={publication} />

                </div>
            </div>
        </>
    );
};
