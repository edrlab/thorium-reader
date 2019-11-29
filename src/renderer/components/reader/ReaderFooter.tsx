// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    navLeftOrRight: (left: boolean) => void;
    fullscreen: boolean;
    currentLocation: LocatorExtended;
    r2Publication: R2Publication | undefined;
    handleLinkClick: (event: any, url: string) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    moreInfo: boolean;
}

export class ReaderFooter extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state =  {
            moreInfo: false,
        };

        this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { currentLocation, r2Publication } = this.props;

        if (!r2Publication || !currentLocation) {
            return (<></>);
        }

        const { __ } = this.props;
        const { moreInfo } = this.state;

        const spineTitle = currentLocation.locator.title;
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
                                <div id={styles.chapters_markers}
                                    className={moreInfo ? styles.more_information : undefined}>
                                    { r2Publication.Spine.map((value, index) => {
                                        const atCurrentLocation = currentLocation.locator.href === value.Href;
                                        if (atCurrentLocation) {
                                            afterCurrentLocation = true;
                                        }
                                        return (
                                            <span
                                                onClick={(e) => this.props.handleLinkClick(e, value.Href)}
                                                key={index}
                                            >
                                                { atCurrentLocation ? <span style={this.getProgressionStyle()}></span>
                                                : !afterCurrentLocation && <span></span>}
                                            </span>
                                        );
                                    })}
                                </div>
                                { moreInfo &&
                                    <div
                                        id={styles.arrow_box}
                                        style={this.getStyle(this.getArrowBoxStyle)}
                                    >
                                        <span>{ spineTitle }</span>
                                        <p>
                                            { this.getProgression() }
                                        </p>
                                        <span
                                            style={this.getStyle(this.getArrowStyle)}
                                            className={styles.after}
                                        />
                                    </div>
                                }
                        </div>
                    }

                    <span
                        onClick={this.handleMoreInfoClick}
                        id={styles.more_info_chapters}
                    >
                        {moreInfo ? __("reader.footerInfo.lessInfo") : __("reader.footerInfo.moreInfo")}
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

    private getArrowBoxPosition() {
        const { currentLocation, r2Publication } = this.props;
        if (!r2Publication || !currentLocation) {
            return undefined;
        }

        let spineItemId = 0;
        if (currentLocation) {
            spineItemId = r2Publication.Spine.findIndex((value) => value.Href === currentLocation.locator.href);
        }
        const onePourcent = 100 / r2Publication.Spine.length;
        const progression = currentLocation.locator.locations.progression;
        return ((onePourcent * spineItemId) + (onePourcent * progression));
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

    // Get the style of the differents element of the arrow box
    // Take a function returning the good left css property
    private getStyle(func: any) {
        const arrowBoxPosition = this.getArrowBoxPosition();
        let multiplicator = 1;
        const rest = Math.abs(arrowBoxPosition - 50);

        if (arrowBoxPosition > 50) {
            multiplicator = -1;
        }
        const style = {
            left: func(arrowBoxPosition, multiplicator, rest),
        };
        return style;
    }

    private getArrowBoxStyle(arrowBoxPosition: number, multiplicator: number, rest: number) {
        return `calc(${arrowBoxPosition}% + ${(multiplicator * (190 * (rest / 100) - 30 * rest / 100))}px)`;
    }

    private getArrowStyle(arrowBoxPosition: number, multiplicator: number, rest: number) {
        return `calc(${arrowBoxPosition}% + ${multiplicator * 30 * rest / 100}px)`;
    }

    private handleMoreInfoClick() {
        this.setState({ moreInfo: !this.state.moreInfo });
    }
}
export default withTranslator(ReaderFooter);
