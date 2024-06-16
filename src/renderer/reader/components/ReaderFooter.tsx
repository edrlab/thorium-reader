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
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
// import { I18nTyped } from "readium-desktop/common/services/translator";

const isFixedLayout = (link: Link, publication: R2Publication): boolean => {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }

    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
};

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
interface IBaseProps extends TranslatorProps {
    navLeftOrRight: (left: boolean) => void;
    gotoBegin: () => void;
    gotoEnd: () => void;
    fullscreen: boolean;
    historyCanGoBack: boolean;
    historyCanGoForward: boolean;
    currentLocation: LocatorExtended;
    goToLocator: (locator: R2Locator, closeNavPanel?: boolean, isFromOnPopState?: boolean) => void;
    // tslint:disable-next-line: max-line-length
    handleLinkClick: (event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor, url: string, closeNavPanel?: boolean, isFromOnPopState?: boolean) => void;
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
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    // moreInfo: boolean;
}

export class ReaderFooter extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        // this.state = {
        //     moreInfo: false,
        // };

        // this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this);

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
        // const { moreInfo } = this.state;

        let spineTitle = currentLocation.locator?.title || currentLocation.locator.href;

        if (isDivina) {
            try {
                spineTitle = this.props.divinaContinousEqualTrue
                    ? `${Math.floor((currentLocation.locator.locations as any).totalProgression * r2Publication.Spine.length)}`
                    : `${(currentLocation.locator?.locations.position || 0) + 1}`;
            } catch (_e) {
                // ignore
            }
        }

        const isEnding = (isDivina
            ? parseInt(spineTitle, 10)
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
                                    className={classNames(isRTL ? stylesReaderFooter.RTL_FLIP : undefined /* , moreInfo ? stylesReaderFooter.more_information : undefined */)}>
                                    {
                                        (isPdf
                                            // tslint:disable-next-line: max-line-length
                                            ? Array.from({ length: r2Publication.Metadata?.NumberOfPages || 1 }, (_v, i) => {
                                                const link = new Link();
                                                link.Href = String(i+1);
                                                return link;
                                            })
                                            : r2Publication.Spine
                                        ).map((link, index) => {

                                            let atCurrentLocation = false;
                                            if (isDivina) {
                                                atCurrentLocation = this.props.divinaContinousEqualTrue
                                                    ? (Math.floor((currentLocation.locator.locations as any).totalProgression * r2Publication.Spine.length)-1) === index
                                                    : (currentLocation.locator?.locations.position || 0) === index; // see divinaNumberOfPages
                                            } else if (isPdf) {
                                                // let href = link.Href;
                                                // try {
                                                //     const n = parseInt(href, 10);
                                                //     href = Number.isInteger(n) ? String(n) : "1"; // NaN
                                                // } catch (_e) {
                                                //     href = "1";
                                                // }
                                                // console.log(link.Href, href, currentLocation.locator?.href);
                                                // atCurrentLocation = currentLocation.locator?.href === href;
                                                // console.log(link.Href, currentLocation.locator?.href);
                                                atCurrentLocation = currentLocation.locator?.href === link.Href;
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
                                                                    // e.preventDefault();
                                                                    // e.stopPropagation();
                                                                    const isDockedMode = this.props.readerConfig.readerDockingMode !== "full";
                                                                    if (isDivina) {
                                                                        // alert(link?.Href);
                                                                        // alert(this.props.divinaContinousEqualTrue);
                                                                        if (this.props.divinaContinousEqualTrue) {
                                                                            this.props.handleLinkClick(e, link.Href, !isDockedMode);
                                                                        } else {
                                                                            this.props.handleLinkClick(e, link.Href, !isDockedMode);

                                                                            // const loc = {
                                                                            //     // href: index.toString(),
                                                                            //     href: String(this.props.r2Publication?.Spine?.findIndex((lnk) => lnk.Href === link?.Href)),
                                                                            //     // progression generate in divina pagechange event
                                                                            // };
                                                                            // // alert(loc.href);
                                                                            // this.props.goToLocator(loc as any, !isDockedMode);
                                                                        }
                                                                    } else if (isPdf) {
                                                                        // let href = link.Href;
                                                                        // try {
                                                                        //     const n = parseInt(href, 10);
                                                                        //     href = Number.isInteger(n) ? String(n) : "1"; // NaN
                                                                        // } catch (_e) {
                                                                        //     href = "1";
                                                                        // }
                                                                        // alert(`${link.Href} - ${href}`);
                                                                        // alert(link.Href);
                                                                        const loc: R2Locator = {
                                                                            href: link.Href,
                                                                            locations: {
                                                                                progression: 0,
                                                                            },
                                                                        };
                                                                        this.props.goToLocator(loc, !isDockedMode);
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
                                                                        this.props.goToLocator(loc, !isDockedMode);
                                                                        // this.props.handleLinkClick(e, link.Href);
                                                                    }
                                                                }}
                                                                key={index}
                                                                className={
                                                                    classNames(
                                                                        stylesReaderFooter.progressChunkSpineItem,
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
                                                                    <span>{`[${this.getCurrentChapter(link)+1} / ${this.getTotalChapters()}] `} {
                                                                        isPdf ? "" :
                                                                        ` ${link.Title ? `${link.Title}${atCurrentLocation && spineTitle ? ` (${spineTitle})` : ""}` : (atCurrentLocation && spineTitle ? spineTitle : "")}`}</span>
                                                                    {atCurrentLocation ?
                                                                        this.getProgression(link, isAudioBook).map((str, i) => {
                                                                            return !str ? <></> :
                                                                            i === 0 ?
                                                                            <p key={`p${i}`}>{str}</p>
                                                                            :
                                                                            <p style={{fontSize:"revert"}} key={`p${i}`}>{str}</p>;
                                                                        })
                                                                        : <></>
                                                                    }
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
                            </div>
                        }
                        {isEnding ? <button className={stylesReaderFooter.finishedIcon}
                             onClick={() => this.props.finishReading(this.props.publicationView.identifier)}
                             title={__("publication.markAsRead")}
                             ><SVG ariaHidden svg={ValidatedIcon} /></button> : <></>}
                    </div>
                }
            </div>
        );
    }

    // 0-based
    private getCurrentChapter(link: Link): number {
        const { r2Publication, isDivina, isPdf } = this.props;

        // let spineTitle = currentLocation.locator?.title || currentLocation.locator.href;
        // if (isDivina) {
        //     try {
        //         spineTitle = this.props.divinaContinousEqualTrue
        //             ? `${Math.floor((currentLocation.locator.locations as any).totalProgression * r2Publication.Spine.length)}`
        //             : `${(currentLocation.locator?.locations.position || 0) + 1}`;
        //     } catch (_e) {
        //         // ignore
        //     }
        // }
        // console.log(this.props.divinaContinousEqualTrue, this.props.r2Publication?.Spine?.length, link.Href, link.Title);
        try {
            const n = isDivina // 1-based
                ? // this.props.divinaContinousEqualTrue ? (parseInt(link.Href, 10) - 1) :
                r2Publication?.Spine?.length ? r2Publication.Spine.findIndex((lnk) => lnk.Href === link.Href) : 0
                : isPdf ? // 1-based
                    parseInt(link.Href, 10) - 1
                    : // audiobook, EPUB reflow / FXL, etc. => 0-based
                    r2Publication.Spine.findIndex((spineLink) => spineLink.Href === link.Href);
            return Number.isInteger(n) ? n : 0; // NaN
        } catch (_e) {
            return 0;
        }
    }

    // [0-N]
    private getTotalChapters(): number {
        const { r2Publication, isDivina, isPdf } = this.props;

        const totalChapters = 
        isPdf ?
        (r2Publication.Metadata?.NumberOfPages ? r2Publication.Metadata.NumberOfPages : 0) :
        isDivina
            ? (this.props.divinaContinousEqualTrue ? r2Publication.Spine.length : this.props.divinaNumberOfPages)
            : r2Publication.Spine.length;
        return totalChapters;
    }

    private navLeftOrRightThrottled(left: boolean) {
        this.props.navLeftOrRight(left);
    }

    private getProgressionStyle(): React.CSSProperties {
        const { currentLocation } = this.props;
        if (!currentLocation) {
            return {};
        }

        let progression = this.props.isPdf ?  1 : currentLocation.locator.locations?.progression || 0;
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

    private getProgression(link: Link, isAudioBook: boolean): string[] {
        const { currentLocation, isDivina, isPdf, __, r2Publication } = this.props;

        if (!currentLocation) {
            return ["", ""];
        }

        // can return -1 (not found)
        const currentChapter = this.getCurrentChapter(link);
        // can return 0!
        const totalChapters =  this.getTotalChapters();

        const globalPercent =
            totalChapters > 0 // division by zero
            ?
            Math.round(
                (((isPdf ? 1 : (currentLocation.locator.locations?.progression || 0)) + (currentChapter >= 0 ? currentChapter : 0)) / totalChapters)
                * 100,
            )
            :
            0;

        if (currentLocation.paginationInfo) {
            return [
                `${__("reader.navigation.currentPageTotal", { current: `${(currentLocation.paginationInfo.currentColumn || 0) + 1}`, total: `${currentLocation.paginationInfo.totalColumns || 0} (${Math.round(100 * (currentLocation.locator.locations?.progression || 0))}%)` })}`,
                `${__("publication.progression.title")} ${globalPercent}%`,
            ];
        } else if (isAudioBook && currentLocation.audioPlaybackInfo) {
            return [
                `${formatTime(currentLocation.audioPlaybackInfo.localTime || 0)} / ${formatTime(currentLocation.audioPlaybackInfo.localDuration || 0)} (${Math.round(currentLocation.audioPlaybackInfo.localProgression * 100)}%)`,
                `${formatTime(currentLocation.audioPlaybackInfo.globalTime || 0)} / ${formatTime(currentLocation.audioPlaybackInfo.globalDuration || 0)} (${Math.round(currentLocation.audioPlaybackInfo.globalProgression * 100)}%)`,
            ];
        } else {
            return [!isPdf && !isDivina && !isFixedLayout(link, r2Publication) && typeof currentLocation.locator.locations?.progression !== "undefined" ? `${Math.round(currentLocation.locator.locations.progression * 100)}%${!isAudioBook && !isDivina ? ` (${__("reader.settings.scrolled")})` : ""}` : "", `${__("publication.progression.title")} ${globalPercent}%`];
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

    // private handleMoreInfoClick() {
    //     this.setState({ moreInfo: !this.state.moreInfo });
    // }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        readerConfig: state.reader.config,
        r2Publication: state.reader.info.r2Publication,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        finishReading: (pubId: string) => {
            dispatch(publicationActions.readingFinished.build(pubId));
            dispatch(readerActions.closeRequest.build());

            // just to refresh allPublicationPage.tsx
            apiDispatch(dispatch)()("publication/readingFinishedRefresh")();
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderFooter));
