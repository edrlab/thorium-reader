// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";

import { Publication } from "r2-shared-js/dist/es6-es2015/src/models/publication";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as classnames from "classnames";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

interface Props {
    navLeftOrRight: (left: boolean) => void;
    fullscreen: boolean;
    currentLocation: any;
    publication: Publication;
}

interface States {
    moreInfo: boolean;
}

export default class ReaderFooter extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: Props) {
        super(props);

        this.state =  {
            moreInfo: false,
        };

        this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const { currentLocation, publication } = this.props;
        const { moreInfo } = this.state;

        let spineItemId: number;
        if (currentLocation) {
            spineItemId = publication.TOC.findIndex((value) => value.Href === currentLocation.locator.href);
        }

        let afterCurrentLocation = false;

        return !this.props.fullscreen && (
            <div className={styles.reader_footer}>
                <div className={styles.arrows}>
                    <button onClick={() => this.props.navLeftOrRight(true)}>
                        <SVG svg={ArrowLeftIcon} title={__("reader.svg.left")} />
                    </button>
                    <button onClick={() => this.props.navLeftOrRight(false)}>
                        <SVG svg={ArrowRightIcon} title={__("reader.svg.right")} />
                    </button>
                </div>
                <div className={styles.track_reading_wrapper}>
                    { currentLocation &&
                        <div id={styles.track_reading}>
                            <div id={styles.current}></div>
                                <div id={styles.chapters_markers} className={moreInfo && styles.more_information}>
                                    { publication && publication.TOC.map((value, index) => {
                                        const atCurrentLocation = currentLocation.locator.href === value.Href;
                                        if (atCurrentLocation) {
                                            afterCurrentLocation = true;
                                        }
                                        return <span key={index}>
                                            { atCurrentLocation ? <span style={this.getProgressionStyle()}></span>
                                            : !afterCurrentLocation && <span></span>}
                                        </span>;
                                    })}
                                </div>
                                { moreInfo &&
                                    <div id={styles.arrow_box} style={this.getArrowBoxStyle()}>
                                        <span>{ spineItemId !== undefined && publication.TOC[spineItemId].Title}</span>
                                        <p>
                                            { this.getProgression() }
                                        </p>
                                    </div>
                                }
                        </div>
                    }

                    <span
                        onClick={this.handleMoreInfoClick}
                        id={styles.more_info_chapters}
                    >
                        {moreInfo ? "Moins d'informations" : "Plus d'informations"}
                    </span>
                </div>
            </div>
        );
    }

    private getProgressionStyle() {
        const { currentLocation } = this.props;
        if (!currentLocation) {
            return {};
        }

        return {
            width: currentLocation.locator.locations.progression * 100 + "%",
        };
    }

    private getArrowBoxStyle() {
        const { currentLocation, publication } = this.props;
        if (!currentLocation) {
            return {};
        }

        let spineItemId = 0;
        if (currentLocation) {
            spineItemId = publication.TOC.findIndex((value) => value.Href === currentLocation.locator.href);
        }
        const onePourcent = 100 / publication.TOC.length;
        const progression = currentLocation.locator.locations.progression;
        const passedItemWidth = onePourcent * spineItemId;
        return {
            left: ((passedItemWidth) + (onePourcent * progression)) + "%",
        };
    }

    private getProgression(): string {
        const { currentLocation } = this.props;
        const { paginationInfo } = currentLocation;

        if (paginationInfo) {
            return `Page ${paginationInfo.currentColumn + 1} / ${paginationInfo.totalColumns}`;
        } else {
            return `${Math.round(currentLocation.locator.locations.progression * 100)}%`;
        }
    }

    private handleMoreInfoClick() {
        this.setState({ moreInfo: !this.state.moreInfo });
    }
}
