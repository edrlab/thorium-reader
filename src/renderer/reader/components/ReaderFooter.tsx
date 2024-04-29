// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-skip_previous-24px.svg";
// import * as ForwardIcon from "readium-desktop/renderer/assets/icons/baseline-skip_next-24px.svg";
// import * as BackIcon from "readium-desktop/renderer/assets/icons/double_arrow_left_black_24dp.svg";
// import * as ForwardIcon from "readium-desktop/renderer/assets/icons/double_arrow_right_black_24dp.svg";
import * as BackIcon from "readium-desktop/renderer/assets/icons/backward-icon.svg";
import * as ForwardIcon from "readium-desktop/renderer/assets/icons/forward-icon.svg";

import classNames from "classnames";
import * as React from "react";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";
import { formatTime } from "readium-desktop/common/utils/time";
import * as stylesReaderFooter from "readium-desktop/renderer/assets/styles/components/readerFooter.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    TKeyboardEventOnAnchor, TMouseEventOnAnchor, TMouseEventOnSpan,
} from "readium-desktop/typings/react";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";
import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as ValidatedIcon from "readium-desktop/renderer/assets/icons/validated-icon.svg";
import { TDispatch } from "readium-desktop/typings/redux";
import { publicationActions, readerActions } from "readium-desktop/common/redux/actions";
import { connect } from "react-redux";
import { PublicationView } from "readium-desktop/common/views/publication";

function throttle(callback: (...args: any) => void, limit: number) {
    let waiting = false;
    return function(this: any) {
        if (!waiting) {
            // eslint-disable-next-line prefer-rest-params
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    navLeftOrRight: (left: boolean) => void;
    gotoBegin: () => void;
    gotoEnd: () => void;
    fullscreen: boolean;
    historyCanGoBack: boolean;
    historyCanGoForward: boolean;
    currentLocation: LocatorExtended;
    r2Publication: R2Publication | undefined;
    goToLocator: (locator: R2Locator) => void;
    // tslint:disable-next-line: max-line-length
    handleLinkClick: (event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string) => void;
    isDivina: boolean;
    divinaNumberOfPages: number;
    divinaContinousEqualTrue: boolean;

    disableRTLFlip: boolean;
    isRTLFlip: () => boolean;

    isPdf: boolean;
    publicationView: PublicationView;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    moreInfo: boolean;
}

export class ReaderFooter extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            moreInfo: false,
        };

        this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this);

        this.navLeftOrRightThrottled = throttle(this.navLeftOrRightThrottled, 500).bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { currentLocation, r2Publication, isDivina, isPdf } = this.props;

        // console.log(r2Publication, currentLocation);

        if (!r2Publication || !currentLocation) {
            return (<></>);
        }

        const isAudioBook = isAudiobookFn(r2Publication);

        const { __ } = this.props;
        const { moreInfo } = this.state;

        let spineTitle = currentLocation.locator?.title || currentLocation.locator.href;

        const isEnding = (isDivina
            ? parseInt(spineTitle)
            : isPdf ?
                parseInt(currentLocation.locator?.href, 10).toString()
                :
                ((r2Publication.Spine.findIndex((spineLink) => spineLink.Href === currentLocation.locator?.href)) + 1).toString()
        ) ==
            (isPdf ? (r2Publication.Metadata?.NumberOfPages ? r2Publication.Metadata.NumberOfPages : 0) :
                (isDivina
                    ? (this.props.divinaContinousEqualTrue ? r2Publication.Spine.length : this.props.divinaNumberOfPages)
                    : r2Publication.Spine.length)
            );

        if (isDivina) {
            try {
                spineTitle = this.props.divinaContinousEqualTrue
                    ? `${Math.floor((currentLocation.locator.locations as any).totalProgression * r2Publication.Spine.length)}`
                    : `${(currentLocation.locator?.locations.position || 0) + 1}`;
            } catch (_e) {
                // ignore
            }
        }

        let afterCurrentLocation = false;

        const isRTL = this.props.isRTLFlip();

        return (
            <div className={classNames(stylesReaderFooter.reader_footer,
                this.props.fullscreen ? stylesReaderFooter.reader_footer_fullscreen : undefined)}
                onWheel={(ev) => {
                    if (ev.deltaY < 0 || ev.deltaX < 0) {
                        this.navLeftOrRightThrottled(true);
                    } else if (ev.deltaY > 0 || ev.deltaX > 0) {
                        this.navLeftOrRightThrottled(false);
                    }
                }}>
                {
                // !this.props.fullscreen &&
                <div className={stylesReaderFooter.history}>
                            <button
                                className={(isRTL ? this.props.historyCanGoForward : this.props.historyCanGoBack) ? undefined : stylesReaderFooter.disabled}
                                onClick={() => {

                                    // console.log("#+$%".repeat(5)  + " history back()", JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length);
                                    if (isRTL) {
                                      window.history.forward();
                                    } else {
                                      window.history.back();
                                    }
                                    // window.history.go(-1);

                                }}
                                title={isRTL ? __("reader.navigation.historyNext") : __("reader.navigation.historyPrevious")}
                            >
                                <SVG ariaHidden={true} svg={BackIcon} />
                            </button>
                            <button
                                className={(isRTL ? this.props.historyCanGoBack : this.props.historyCanGoForward) ? undefined : stylesReaderFooter.disabled}
                                onClick={() => {

                                    // console.log("#+$%".repeat(5)  + " history forward()", JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length);
                                    if (isRTL) {
                                      window.history.back();
                                    } else {
                                      window.history.forward();
                                    }
                                    // window.history.go(1);

                                }}
                                title={isRTL ? __("reader.navigation.historyPrevious") : __("reader.navigation.historyNext")}
                            >
                                <SVG ariaHidden={true} svg={ForwardIcon} />
                            </button>
                        </div>
                }
                {/* {!isAudioBook &&
                    <div className={stylesReaderFooter.arrows}>
                        <button onClick={(ev) => {
                            if (ev.shiftKey) {
                                if (isRTL) {
                                    this.props.gotoEnd();
                                } else {
                                    this.props.gotoBegin();
                                }
                            } else {
                                this.props.navLeftOrRight(true);
                            }
                        }}
                        title={__("reader.svg.left")}
                        >
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <button onClick={(ev) => {
                            if (ev.shiftKey) {
                                if (isRTL) {
                                    this.props.gotoBegin();
                                } else {
                                    this.props.gotoEnd();
                                }
                            } else {
                                this.props.navLeftOrRight(false);
                            }
                        }}
                        title={__("reader.svg.right")}
                        >
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>
                    </div>
                } */}
                {!this.props.fullscreen &&
                    <div aria-hidden="true" className={classNames(stylesReaderFooter.track_reading_wrapper,
                        isAudioBook ? stylesReaderFooter.track_reading_wrapper_noArrows : undefined)}>

                        { // <div id={stylesReader.current}></div>
                            <div id={stylesReaderFooter.track_reading}>
                                <div id={stylesReaderFooter.chapters_markers}
                                    className={classNames(isRTL ? stylesReaderFooter.RTL_FLIP : undefined, moreInfo ? stylesReaderFooter.more_information : undefined)}>
                                    {
                                        (isPdf
                                            // tslint:disable-next-line: max-line-length
                                            ? Array.from({ length: r2Publication.Metadata?.NumberOfPages || 1 }, (_v, i) => {
                                                const link = new Link();
                                                link.Href = i.toString();
                                                return link;
                                            })
                                            : r2Publication.Spine
                                        ).map((link, index) => {

                                            let atCurrentLocation = false;
                                            if (isDivina) {
                                                atCurrentLocation = this.props.divinaContinousEqualTrue
                                                    ? Math.floor((currentLocation.locator.locations as any).totalProgression * r2Publication.Spine.length) === index
                                                    : (currentLocation.locator?.locations.position || 0) === index; // see divinaNumberOfPages
                                            } else {
                                                atCurrentLocation = currentLocation.locator?.href === link.Href;
                                            }
                                            if (atCurrentLocation) {
                                                afterCurrentLocation = true;
                                            }
                                            return (
                                                <Tooltip.Provider key={index}>
                                                    <Tooltip.Root>
                                                        <Tooltip.Trigger asChild>
                                                            <span
                                                                onClick={(e) => {

                                                                    if (isDivina) {
                                                                        // const loc = {
                                                                        //     href: index.toString(),
                                                                        //     // progression generate in divina pagechange event
                                                                        // };
                                                                        // this.props.goToLocator(loc as any);
                                                                        if (link?.Href) {
                                                                            this.props.handleLinkClick(e, link.Href);

                                                                        }
                                                                    } else {

                                                                        const el = e.nativeEvent.target as HTMLElement;
                                                                        const deltaX = e.nativeEvent.offsetX;
                                                                        let element = el;
                                                                        let w: number | undefined;
                                                                        while (element && element.classList) {
                                                                            if (
                                                                                // tslint:disable-next-line: max-line-length
                                                                                element.classList.contains("progressChunkSpineItem")
                                                                            ) {
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
                                                                    }
                                                                }}
                                                                key={index}
                                                                className={
                                                                    classNames(
                                                                        "progressChunkSpineItem",
                                                                        atCurrentLocation ? stylesReaderFooter.currentSpineItem : undefined)
                                                                }
                                                            >
                                                            {
                                                                atCurrentLocation
                                                                    ? <span style={this.getProgressionStyle()}></span>
                                                                    : !afterCurrentLocation && <span></span>
                                                            }
                                                        </span>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Portal>
                                                            <Tooltip.Content className={stylesReaderFooter.tooltip_content}>
                                                                <div
                                                                    id={stylesReaderFooter.arrow_box}
                                                                    style={this.getStyle(this.getArrowBoxStyle)}
                                                                >
                                                                    <span title={spineTitle}><em>{`(${(isDivina)
                                                                        ? spineTitle
                                                                        : isPdf ?
                                                                            parseInt(link.Href, 10).toString()
                                                                            :
                                                                            ((r2Publication.Spine.findIndex((spineLink) => spineLink.Href === link.Href)) + 1).toString()
                                                                        }/${isPdf ? (r2Publication.Metadata?.NumberOfPages ? r2Publication.Metadata.NumberOfPages : 0) :
                                                                            (isDivina
                                                                                ? (this.props.divinaContinousEqualTrue ? r2Publication.Spine.length : this.props.divinaNumberOfPages)
                                                                                : r2Publication.Spine.length)
                                                                        }) `}</em> {` ${link.Title !== undefined ? link.Title : spineTitle}`}</span>
                                                                    <p>
                                                                        {this.getProgression()}
                                                                    </p>
                                                                    {/* <span
                                                                        style={this.getStyle(this.getArrowStyle)}
                                                                        className={stylesReaderFooter.after}
                                                                    /> */}
                                                                </div>
                                                                <Tooltip.Arrow width={15} height={10} />
                                                            </Tooltip.Content>
                                                        </Tooltip.Portal>
                                                    </Tooltip.Root>
                                                </Tooltip.Provider>
                                            );
                                        })}
                                </div>

                                {/* {moreInfo &&
                                    <div
                                        id={stylesReaderFooter.arrow_box}
                                        style={this.getStyle(this.getArrowBoxStyle)}
                                    >
                                        <span title={spineTitle}><em>{`(${(isDivina)
                                            ? spineTitle
                                            : isPdf ?
                                                parseInt(currentLocation.locator?.href, 10).toString()
                                                :
                                                ((r2Publication.Spine.findIndex((spineLink) => spineLink.Href === currentLocation.locator?.href)) + 1).toString()
                                            }/${isPdf ? (r2Publication.Metadata?.NumberOfPages ? r2Publication.Metadata.NumberOfPages : 0) :
                                            (isDivina
                                            ? (this.props.divinaContinousEqualTrue ? r2Publication.Spine.length : this.props.divinaNumberOfPages)
                                            : r2Publication.Spine.length)
                                            }) `}</em> {` ${spineTitle}`}</span>
                                        <p>
                                            {this.getProgression()}
                                        </p>
                                        <span
                                            style={this.getStyle(this.getArrowStyle)}
                                            className={stylesReaderFooter.after}
                                        />
                                    </div>
                                } */}
                            </div>
                        }
                        {isEnding ? <button className={stylesReaderFooter.finishedIcon}
                             onClick={() => this.props.finishReading(this.props.publicationView.identifier)}
                             title="Mark as finished"
                             ><SVG ariaHidden svg={ValidatedIcon} /></button> : <></>}
                    </div>
                }
            </div>
        );
    }

    private navLeftOrRightThrottled(left: boolean) {
        this.props.navLeftOrRight(left);
    }

    private getProgressionStyle(): React.CSSProperties {
        const { currentLocation } = this.props;
        if (!currentLocation) {
            return {};
        }

        let progression = currentLocation.locator.locations?.progression;
        if (progression >= 0.97) {
            progression = 1;
        }
        return {
            width: `${progression * 100}%`,
        };
    }

    private getArrowBoxPosition() {
        const { currentLocation, r2Publication, isPdf } = this.props;
        if (!r2Publication || !currentLocation) {
            return undefined;
        }

        let spineItemId = 0;
        if (currentLocation) {
            if (isPdf) {
                spineItemId = parseInt(currentLocation.locator?.href, 10) || 1;
            } else {
                spineItemId = r2Publication.Spine.findIndex((value) => value.Href === currentLocation.locator?.href);
            }
        }
        const onePourcent = 100 / (isPdf ? r2Publication.Metadata?.NumberOfPages || 1 : r2Publication.Spine?.length);
        let progression = currentLocation.locator?.locations?.progression;
        if (progression >= 0.97) {
            progression = 1;
        }
        return ((onePourcent * spineItemId) + (onePourcent * progression));
    }

    private getProgression(): string {
        const { currentLocation } = this.props;

        if (!currentLocation) {
            return "";
        }

        const percent = Math.round((currentLocation.locator.locations?.progression || 0) * 100);

        if (currentLocation.paginationInfo) {
            return `${percent}% (${(currentLocation.paginationInfo.currentColumn || 0) + 1} / ${currentLocation.paginationInfo.totalColumns || 0})`;
        } else if (currentLocation.audioPlaybackInfo) {
            return `${percent}% (${formatTime(currentLocation.audioPlaybackInfo.localTime || 0)} / ${formatTime(currentLocation.audioPlaybackInfo.localDuration || 0)})`;
        } else {
            return `${percent}%`;
        }
    }

    // Get the style of the differents element of the arrow box
    // Take a function returning the good left css property
    private getStyle(
        func: (arrowBoxPosition: number, multiplicator: number, rest: number) => string): React.CSSProperties {

        const isRTL = this.props.isRTLFlip();

        let arrowBoxPosition = this.getArrowBoxPosition();
        if (isRTL) {
          arrowBoxPosition = 100 - arrowBoxPosition;
        }
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

    // private getArrowStyle(arrowBoxPosition: number, multiplicator: number, rest: number) {
    //     return `calc(${arrowBoxPosition}% + ${multiplicator * 30 * rest / 100}px)`;
    // }

    private handleMoreInfoClick() {
        this.setState({ moreInfo: !this.state.moreInfo });
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        finishReading: (pubId: string) => {
            dispatch(publicationActions.readingFinished.build(pubId));
            dispatch(readerActions.closeRequest.build());
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(ReaderFooter));
