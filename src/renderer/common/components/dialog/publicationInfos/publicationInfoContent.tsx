// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { Translator } from "readium-desktop/common/services/translator";
import { IOpdsBaseLinkView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import { TPublication } from "readium-desktop/renderer/common/type/publication.type";

import Cover from "../../Cover";
import { FormatContributorWithLink } from "./FormatContributorWithLink";
import { FormatPublicationLanguage } from "./formatPublicationLanguage";
import { FormatPublisherDate } from "./formatPublisherDate";
import LcpInfo from "./LcpInfo";
import PublicationInfoDescription from "./PublicationInfoDescription";

export interface IProps {
    publication: TPublication;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    ControlComponent?: React.ComponentType;
    TagManagerComponent: React.ComponentType;
    coverZoom: boolean;
    translator: Translator;
    onClikLinkCb?: (tag: IOpdsBaseLinkView) => () => void | undefined;
}

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
                            publication.publishers?.length &&
                            <>
                                <span>{`${__("catalog.publisher")} : `}</span>
                                <i className={styles.allowUserSelect}>
                                    <FormatContributorWithLink
                                        contributors={publication.publishers}
                                        translator={translator}
                                        onClickLinkCb={onClikLinkCb}
                                    />
                                </i>
                                <br />
                            </>
                        }
                        {
                            publication.languages?.length &&
                            <>
                                <span>
                                    {
                                        `${__("catalog.lang")} : `
                                    }
                                </span>
                                <FormatPublicationLanguage publication={publication} __={__} />
                                <br />
                            </>
                        }
                        {
                            publication.numberOfPages &&
                            <>
                                <span>
                                    {
                                        `${__("catalog.numberOfPages")} : `
                                    }
                                </span>
                                <i className={styles.allowUserSelect}>
                                    {
                                        publication.numberOfPages
                                    }
                                </i>
                                <br />

                            </>
                        }
                    </p>

                    <LcpInfo publicationLcp={publication} />

                </div>
            </div>
        </>
    );
};
