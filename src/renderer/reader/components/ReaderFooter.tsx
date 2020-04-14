// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { formatTime } from "readium-desktop/common/utils/time";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    TKeyboardEventOnAnchor, TMouseEventOnAnchor, TMouseEventOnSpan,
} from "readium-desktop/typings/react";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    navLeftOrRight: (left: boolean) => void;
    fullscreen: boolean;
    currentLocation: LocatorExtended;
    r2Publication: R2Publication | undefined;
    goToLocator: (locator: R2Locator) => void;
    // tslint:disable-next-line: max-line-length
    handleLinkClick: (event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string) => void;
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

        const isAudioBook = r2Publication?.Metadata?.RDFType &&
            /http[s]?:\/\/schema\.org\/Audiobook$/.test(r2Publication.Metadata.RDFType);

        const { __ } = this.props;
        const { moreInfo } = this.state;

        const spineTitle = currentLocation.locator.title || currentLocation.locator.href;
        let afterCurrentLocation = false;

        return !this.props.fullscreen && (
            <div className={styles.reader_footer}>
                {!isAudioBook &&
                <div className={styles.arrows}>
                    <button onClick={() => this.props.navLeftOrRight(true)}>
                        <SVG svg={ArrowLeftIcon} title={__("reader.svg.left")} />
                    </button>
                    <button onClick={() => this.props.navLeftOrRight(false)}>
                        <SVG svg={ArrowRightIcon} title={__("reader.svg.right")} />
                    </button>
                </div>
                }
                <div className={classNames(styles.track_reading_wrapper,
                    isAudioBook ? styles.track_reading_wrapper_noArrows : undefined)}>

                    { // <div id={styles.current}></div>
                    <div id={styles.track_reading}>
                        <div id={styles.chapters_markers}
                            className={moreInfo ? styles.more_information : undefined}>
                            { r2Publication.Spine.map((link, index) => {
                                const atCurrentLocation = currentLocation.locator.href === link.Href;
                                if (atCurrentLocation) {
                                    afterCurrentLocation = true;
                                }
                                return (
                                    <span
                                        onClick={(e) => {
                                            const el = e.nativeEvent.target as HTMLElement;
                                            let left = el.offsetLeft;
                                            if (!left) {
                                                left = 0;
                                            }
                                            let p = el.offsetParent as HTMLElement;
                                            while (p) {
                                                const l = p.offsetLeft;
                                                left += (l ? l : 0);
                                                p = p.offsetParent as HTMLElement;
                                            }
                                            const deltaX = e.clientX - left;
                                            let element = el;
                                            let w: number | undefined;
                                            while (element && element.classList) {
                                                if (element.classList.contains("progressChunkSpineItem")) {
                                                    w = element.offsetWidth;
                                                    break;
                                                }
                                                element = element.parentNode as HTMLElement;
                                            }
                                            if (!w) {
                                                w = element.offsetWidth;
                                            }
                                            const percent = deltaX / w;

                                            const loc: R2Locator = {
                                                href: link.Href,
                                                locations: {
                                                    progression: percent,
                                                },
                                            };
                                            this.props.goToLocator(loc);
                                            // this.props.handleLinkClick(e, link.Href);
                                        }}
                                        key={index}
                                        className={
                                            classNames(
                                                "progressChunkSpineItem",
                                                atCurrentLocation ? styles.currentSpineItem : undefined)
                                        }
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
                            <span title={spineTitle}><em>{`(${(r2Publication.Spine.findIndex((value) => value.Href === currentLocation.locator.href)) + 1}/${r2Publication.Spine.length}) `}</em> {` ${spineTitle}`}</span>
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

    private getProgressionStyle(): React.CSSProperties {
        const { currentLocation } = this.props;
        if (!currentLocation) {
            return {};
        }

        let progression = currentLocation.locator.locations.progression;
        if (progression >= 0.9) {
            progression = 1;
        }
        return {
            width: `${progression * 100}%`,
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
        let progression = currentLocation.locator.locations.progression;
        if (progression >= 0.9) {
            progression = 1;
        }
        return ((onePourcent * spineItemId) + (onePourcent * progression));
    }

    private getProgression(): string {
        const { currentLocation } = this.props;
        if (!currentLocation) {
            return "";
        }

        const percent = Math.round(currentLocation.locator.locations.progression * 100);
        if (currentLocation.paginationInfo) {
            return `${percent}% (${currentLocation.paginationInfo.currentColumn + 1} / ${currentLocation.paginationInfo.totalColumns})`;
        } else if (currentLocation.audioPlaybackInfo) {
            return `${percent}% (${formatTime(currentLocation.audioPlaybackInfo.localTime)} / ${formatTime(currentLocation.audioPlaybackInfo.localDuration)})`;
        } else {
            return `${percent}%`;
        }
    }

    // Get the style of the differents element of the arrow box
    // Take a function returning the good left css property
    private getStyle(
        func: (arrowBoxPosition: number, multiplicator: number, rest: number) => string): React.CSSProperties {

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
        return `calc(${arrowBoxPosition}% + ${(multiplicator * (450 * (rest / 100) - 30 * rest / 100))}px)`;
    }

    private getArrowStyle(arrowBoxPosition: number, multiplicator: number, rest: number) {
        return `calc(${arrowBoxPosition}% + ${multiplicator * 30 * rest / 100}px)`;
    }

    private handleMoreInfoClick() {
        this.setState({ moreInfo: !this.state.moreInfo });
    }
}
export default withTranslator(ReaderFooter);
