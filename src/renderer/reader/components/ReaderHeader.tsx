// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import { debug } from "console";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReaderMode } from "readium-desktop/common/models/reader";
import * as viewMode from "readium-desktop/renderer/assets/icons/aspect_ratio-black-18dp.svg";
import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
import * as MuteIcon from "readium-desktop/renderer/assets/icons/baseline-mute-24px.svg";
import * as PauseIcon from "readium-desktop/renderer/assets/icons/baseline-pause-24px.svg";
import * as PlayIcon from "readium-desktop/renderer/assets/icons/baseline-play_arrow-24px.svg";
import * as SkipNext from "readium-desktop/renderer/assets/icons/baseline-skip_next-24px.svg";
import * as SkipPrevious from "readium-desktop/renderer/assets/icons/baseline-skip_previous-24px.svg";
import * as StopIcon from "readium-desktop/renderer/assets/icons/baseline-stop-24px.svg";
import * as AudioIcon from "readium-desktop/renderer/assets/icons/baseline-volume_up-24px.svg";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/font-size.svg";
import * as TOCIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/outline-bookmark_border-24px.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-crop_free-24px.svg";
import * as QuitFullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-uncrop_free-24px.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { fixedLayoutZoomPercent } from "@r2-navigator-js/electron/renderer/dom";
import {
    LocatorExtended, MediaOverlaysStateEnum, TTSStateEnum,
} from "@r2-navigator-js/electron/renderer/index";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { IEventBusPdfPlayer, IPdfPlayerScale } from "../pdf/common/pdfReader.type";
import HeaderSearch from "./header/HeaderSearch";
import { IReaderMenuProps, IReaderOptionsProps } from "./options-values";
import ReaderMenu from "./ReaderMenu";
import ReaderOptions from "./ReaderOptions";

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
    menuOpen: boolean;
    infoOpen: boolean;
    shortcutEnable: boolean;
    mode?: ReaderMode;
    settingsOpen: boolean;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
    fullscreen: boolean;
    handleFullscreenClick: () => void;

    handleTTSPlay: () => void;
    handleTTSPause: () => void;
    handleTTSStop: () => void;
    handleTTSResume: () => void;
    handleTTSPrevious: (skipSentences?: boolean) => void;
    handleTTSNext: (skipSentences?: boolean) => void;
    handleTTSPlaybackRate: (speed: string) => void;
    handleTTSVoice: (voice: SpeechSynthesisVoice | null) => void;
    ttsState: TTSStateEnum;
    ttsPlaybackRate: string;
    ttsVoice: SpeechSynthesisVoice | null;

    publicationHasMediaOverlays: boolean;
    handleMediaOverlaysPlay: () => void;
    handleMediaOverlaysPause: () => void;
    handleMediaOverlaysStop: () => void;
    handleMediaOverlaysResume: () => void;
    handleMediaOverlaysPrevious: () => void;
    handleMediaOverlaysNext: () => void;
    handleMediaOverlaysPlaybackRate: (speed: string) => void;
    mediaOverlaysState: MediaOverlaysStateEnum;
    mediaOverlaysPlaybackRate: string;

    handleReaderClose: () => void;
    handleReaderDetach: () => void;
    toggleBookmark: () => void;
    isOnBookmark: boolean;
    isOnSearch: boolean;
    displayPublicationInfo: () => void;
    readerMenuProps: IReaderMenuProps;
    readerOptionsProps: IReaderOptionsProps;
    currentLocation: LocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    pdfEventBus: IEventBusPdfPlayer;
    divinaSoundPlay: (play: boolean) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
    r2Publication: R2Publication;
}

interface IState {
    pdfScaleMode: IPdfPlayerScale | undefined;
    divinaSoundEnabled: boolean;
    fxlZoomPercent: number;
}

export class ReaderHeader extends React.Component<IProps, IState> {

    private enableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private disableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private settingsMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private navigationMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private infoMenuButtonRef: React.RefObject<HTMLButtonElement>;

    private onwheel: React.WheelEventHandler<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);
        this.enableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.disableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.settingsMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.navigationMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.infoMenuButtonRef = React.createRef<HTMLButtonElement>();

        this.focusSettingMenuButton = this.focusSettingMenuButton.bind(this);
        this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);

        this.state = {
            pdfScaleMode: undefined,
            divinaSoundEnabled: false,
            fxlZoomPercent: 0,
        };

        let _timerWheel: number | undefined;
        this.onwheel = throttle((ev) => {
            const step = 10;
            if (ev.deltaY < 0) { // "natural" gesture on MacOS :(
                if (this.state.fxlZoomPercent >= step) {
                    this.setState({ fxlZoomPercent: this.state.fxlZoomPercent - step });
                }
            } else if (ev.deltaY > 0) {
                if (this.state.fxlZoomPercent <= 390) {
                    this.setState({ fxlZoomPercent: this.state.fxlZoomPercent + step });
                }
            }
            if (_timerWheel) {
                clearTimeout(_timerWheel);
            }
            _timerWheel = window.setTimeout(() => {
                _timerWheel = undefined;
                fixedLayoutZoomPercent(this.state.fxlZoomPercent);
            }, 600);
        }, 200).bind(this);
    }

    public componentDidMount() {

        this.props.pdfEventBus?.subscribe("scale", this.setScaleMode);
    }

    public componentWillUnmount() {

        if (this.props.pdfEventBus) {
            this.props.pdfEventBus.remove(this.setScaleMode, "scale");
        }
    }

    public componentDidUpdate(oldProps: IProps, oldState: IState) {

        if (oldState.divinaSoundEnabled !== this.state.divinaSoundEnabled) {
            this.props.divinaSoundPlay(this.state.divinaSoundEnabled);
        }

        if (oldProps.pdfEventBus !== this.props.pdfEventBus) {

            this.props.pdfEventBus.subscribe("scale", this.setScaleMode);
        }

        if (this.props.fullscreen !== oldProps.fullscreen) {
            if (this.props.fullscreen && this.disableFullscreenRef?.current) {
                this.disableFullscreenRef.current.focus();
            } else if (!this.props.fullscreen && this.enableFullscreenRef?.current) {
                this.enableFullscreenRef.current.focus();
            }
        }

        if (this.props.infoOpen !== oldProps.infoOpen &&
            this.props.infoOpen === false &&
            this.infoMenuButtonRef?.current) {
            this.infoMenuButtonRef.current.focus();
        }

        if (this.props.menuOpen !== oldProps.menuOpen &&
            this.props.menuOpen === true) {
            this.focusNaviguationMenuButton();
        }

        if (this.props.settingsOpen !== oldProps.settingsOpen &&
            this.props.settingsOpen === true) {
            this.focusSettingMenuButton();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const LANG_DIVIDER_PREFIX = "------------";
        let prevLang: string | undefined;
        const _orderedVoices = speechSynthesis.getVoices().sort((a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) => {
            if(a.lang < b.lang) { return -1; }
            if(a.lang > b.lang) { return 1; }
            // a.lang === b.lang ...
            if(a.name < b.name) { return -1; }
            if(a.name > b.name) { return 1; }
            return 0;
        }).reduce((acc, curr) => {
            if (!prevLang || prevLang !== curr.lang) {
                acc.push({
                    default: false,
                    lang: curr.lang,
                    localService: false,
                    name: LANG_DIVIDER_PREFIX,
                    voiceURI: "",
                });
            }
            prevLang = curr.lang;
            acc.push(curr);
            return acc;
        }, [] as SpeechSynthesisVoice[]);

        const showAudioTTSToolbar = (this.props.currentLocation && !this.props.currentLocation.audioPlaybackInfo) &&
            !this.props.isDivina && !this.props.isPdf;
        return (
            <nav
                className={classNames(stylesReader.main_navigation,
                    this.props.fullscreen ? stylesReader.main_navigation_fullscreen : undefined,
                    showAudioTTSToolbar || this.props.isDivina ? stylesReader.hasTtsAudio : undefined,
                    (this.props.publicationHasMediaOverlays &&
                        this.props.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
                        || !this.props.publicationHasMediaOverlays &&
                        this.props.ttsState !== TTSStateEnum.STOPPED) ?
                        stylesReader.ttsAudioActivated : undefined,
                )}
                role="navigation"
                aria-label={__("accessibility.toolbar")}
            >
                <ul>

                    {(this.props.mode === ReaderMode.Attached) ? (
                        <li className={classNames(stylesReader.showInFullScreen)}>
                            <button
                                className={stylesReader.menu_button}
                                onClick={this.props.handleReaderClose}
                            >
                                <SVG svg={BackIcon} title={__("reader.navigation.backHomeTitle")} />
                            </button>
                        </li>
                    ) : (<></>)
                    }
                    <li>
                        <button
                            className={stylesReader.menu_button}
                            onClick={() => this.props.displayPublicationInfo()}
                            ref={this.infoMenuButtonRef}
                        >
                            <SVG svg={InfosIcon} title={__("reader.navigation.infoTitle")} />
                        </button>
                    </li>
                    {(this.props.mode === ReaderMode.Attached) ? (
                        <li>
                            <button
                                className={stylesReader.menu_button}
                                onClick={this.props.handleReaderDetach}
                            >
                                <SVG svg={DetachIcon} title={__("reader.navigation.detachWindowTitle")} />
                            </button>
                        </li>
                    ) : (<></>)
                    }

                    <ul className={classNames(stylesReader.tts_toolbar, stylesReader.showInFullScreen)}>
                        {
                            this.props.isDivina
                                ?
                                this.state.divinaSoundEnabled
                                ? <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: false})}
                                                >
                                                    <SVG svg={MuteIcon} title={
                                                            __("reader.divina.mute")
                                                    } />
                                                </button>
                                            </li>
                                : <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: true})}
                                                >
                                                    <SVG svg={AudioIcon} title={
                                                            __("reader.divina.unmute")
                                                    } />
                                                </button>
                                            </li>
                                : (this.props.publicationHasMediaOverlays &&
                                    this.props.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED ||
                                    !this.props.publicationHasMediaOverlays &&
                                    this.props.ttsState === TTSStateEnum.STOPPED) ?
                                    <li className={stylesReader.button_audio}>
                                        <button
                                            className={stylesReader.menu_button}
                                            onClick={
                                                this.props.publicationHasMediaOverlays ?
                                                    this.props.handleMediaOverlaysPlay :
                                                    this.props.handleTTSPlay
                                            }
                                        >
                                            <SVG svg={AudioIcon} title={
                                                this.props.publicationHasMediaOverlays ?
                                                    __("reader.media-overlays.activate") :
                                                    __("reader.tts.activate")
                                            } />
                                        </button>
                                    </li>
                                    : <>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={
                                                    this.props.publicationHasMediaOverlays ?
                                                        this.props.handleMediaOverlaysStop :
                                                        this.props.handleTTSStop
                                                }
                                            >
                                                <SVG svg={StopIcon} title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.stop") :
                                                        __("reader.tts.stop")
                                                } />
                                            </button>
                                        </li>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={(e) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysPrevious();
                                                    } else {
                                                        this.props.handleTTSPrevious(e.shiftKey && e.altKey);
                                                    }
                                                }}
                                            >
                                                <SVG svg={SkipPrevious} title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.previous") :
                                                        __("reader.tts.previous")
                                                } />
                                            </button>
                                        </li>
                                        {(this.props.publicationHasMediaOverlays &&
                                            this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING ||
                                            !this.props.publicationHasMediaOverlays &&
                                            this.props.ttsState === TTSStateEnum.PLAYING) ?
                                            <li >
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={
                                                        this.props.publicationHasMediaOverlays ?
                                                            this.props.handleMediaOverlaysPause :
                                                            this.props.handleTTSPause
                                                    }
                                                >
                                                    <SVG svg={PauseIcon} title={
                                                        this.props.publicationHasMediaOverlays ?
                                                            __("reader.media-overlays.pause") :
                                                            __("reader.tts.pause")
                                                    } />
                                                </button>
                                            </li>
                                            :
                                            <li >
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={
                                                        this.props.publicationHasMediaOverlays ?
                                                            this.props.handleMediaOverlaysResume :
                                                            this.props.handleTTSResume
                                                    }
                                                >
                                                    <SVG svg={PlayIcon} title={
                                                        this.props.publicationHasMediaOverlays ?
                                                            __("reader.media-overlays.play") :
                                                            __("reader.tts.play")
                                                    } />
                                                </button>
                                            </li>
                                        }
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}

                                                onClick={(e) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysNext();
                                                    } else {
                                                        this.props.handleTTSNext(e.shiftKey && e.altKey);
                                                    }
                                                }}
                                            >
                                                <SVG svg={SkipNext} title={
                                                    this.props.publicationHasMediaOverlays ?
                                                        __("reader.media-overlays.next") :
                                                        __("reader.tts.next")
                                                } />
                                            </button>
                                        </li>
                                        <li className={stylesReader.ttsSelectRate}>
                                            <select title={
                                                this.props.publicationHasMediaOverlays ?
                                                    __("reader.media-overlays.speed") :
                                                    __("reader.tts.speed")
                                            }
                                                onChange={(ev) => {
                                                    if (this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysPlaybackRate(
                                                            ev.target.value.toString(),
                                                        );
                                                    } else {
                                                        this.props.handleTTSPlaybackRate(
                                                            ev.target.value.toString(),
                                                        );
                                                    }
                                                }}
                                                value={
                                                    this.props.publicationHasMediaOverlays ?
                                                        this.props.mediaOverlaysPlaybackRate :
                                                        this.props.ttsPlaybackRate
                                                }
                                            >
                                                <option value="3">3x</option>
                                                <option value="2.75">2.75x</option>
                                                <option value="2.5">2.5x</option>
                                                <option value="2.25">2.25x</option>
                                                <option value="2">2x</option>
                                                <option value="1.75">1.75x</option>
                                                <option value="1.5">1.5x</option>
                                                <option value="1.25">1.25x</option>
                                                <option value="1">1x</option>
                                                <option value="0.75">0.75x</option>
                                                <option value="0.5">0.5x</option>
                                            </select>
                                        </li>
                                        {!this.props.publicationHasMediaOverlays && (
                                            <li className={stylesReader.ttsSelectVoice}>
                                                <select title={__("reader.tts.voice")}
                                                    onChange={(ev) => {
                                                        const i = parseInt(ev.target.value.toString(), 10);
                                                        let voice = i === 0 ? null : _orderedVoices[i - 1];
                                                        // alert(`${i} ${voice.name} ${voice.lang} ${voice.default} ${voice.voiceURI} ${voice.localService}`);
                                                        if (voice && voice.name === LANG_DIVIDER_PREFIX) {
                                                            // voice = null;
                                                            voice = _orderedVoices[i];
                                                        }
                                                        this.props.handleTTSVoice(voice ? voice : null);
                                                    }}
                                                    value={
                                                        this.props.ttsVoice ?
                                                            _orderedVoices.findIndex((voice) => {
                                                                // exact match
                                                                return voice.name === this.props.ttsVoice.name && voice.lang === this.props.ttsVoice.lang && voice.voiceURI === this.props.ttsVoice.voiceURI && voice.default === this.props.ttsVoice.default && voice.localService === this.props.ttsVoice.localService;
                                                            }) + 1 : 0
                                                    }
                                                >
                                                    {
                                                        [].concat((<option key={"tts0"} value="{i}">{`${__("reader.tts.default")}`}</option>),
                                                            _orderedVoices.map((voice, i) => {
                                                                // SpeechSynthesisVoice
                                                                return (<option key={`tts${i + 1}`} value={i + 1}>{`${voice.name}${voice.name === LANG_DIVIDER_PREFIX ? ` [${voice.lang}]` : ""}${voice.default ? " *" : ""}`}</option>);
                                                            }))
                                                    }
                                                </select>
                                            </li>
                                        )}
                                    </>
                        }
                    </ul>
                    <ul className={stylesReader.menu_option}>
                        {
                            this.props.isPdf
                                ? <li
                                    {...(this.state.pdfScaleMode === "page-width" &&
                                        { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                                >
                                    <input
                                        id="pdfScaleButton"
                                        className={stylesReader.bookmarkButton}
                                        type="checkbox"
                                        checked={this.state.pdfScaleMode === "page-width"}
                                        // tslint:disable-next-line: max-line-length
                                        onChange={() => this.props.pdfEventBus.dispatch("scale", this.state.pdfScaleMode === "page-fit" ? "page-width" : "page-fit")}
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                    />
                                    <label
                                        htmlFor="pdfScaleButton"
                                        className={stylesReader.menu_button}
                                    >
                                        <SVG svg={viewMode} title={__("reader.navigation.pdfscalemode")} />
                                    </label>
                                </li>
                                : (this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed"
                                    ? <li
                                        {...(this.state.fxlZoomPercent !== 0 &&
                                            { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                                    >
                                        <label
                                            htmlFor="buttonFXLZoom"
                                            style={{ pointerEvents: "none", position: "absolute", paddingLeft: "12px", paddingTop: "4px", fontSize: "80%", color: "#333333" }}>{this.state.fxlZoomPercent > 0 ? `${this.state.fxlZoomPercent}%` : " "}</label>
                                        <button
                                            id="buttonFXLZoom"
                                            className={classNames(stylesReader.menu_button)}
                                            onWheel={this.onwheel}
                                            onClick={() => {
                                                // toggle
                                                debug("FXL this.state.fxlZoomPercent TOGGLE: " + this.state.fxlZoomPercent);
                                                if (this.state.fxlZoomPercent === 0) {
                                                    this.setState({ fxlZoomPercent: 200 });
                                                    fixedLayoutZoomPercent(200); // twice (zoom in)
                                                } else if (this.state.fxlZoomPercent === 200) {
                                                    this.setState({ fxlZoomPercent: 100 });
                                                    fixedLayoutZoomPercent(100); // content natural dimensions (usually larger, so equivalent to zoom in)
                                                } else if (this.state.fxlZoomPercent === 100) {
                                                    this.setState({ fxlZoomPercent: 50 });
                                                    fixedLayoutZoomPercent(50); // half (zoom out, but if the content is massive then it may still be perceived as zoom in)
                                                } else {
                                                    this.setState({ fxlZoomPercent: 0 });
                                                    fixedLayoutZoomPercent(0); // special value: fit inside available viewport dimensions (default)
                                                }
                                            }}
                                            aria-label={__("reader.navigation.pdfscalemode")}
                                        >
                                            <SVG svg={viewMode} title={__("reader.navigation.pdfscalemode")} />
                                        </button>
                                    </li>
                                    : <></>)
                        }
                        <li
                            {...(this.props.isOnSearch && { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <HeaderSearch shortcutEnable={this.props.shortcutEnable}></HeaderSearch>
                        </li>
                        <li
                            {...(this.props.isOnBookmark &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <input
                                id="bookmarkButton"
                                className={stylesReader.bookmarkButton}
                                type="checkbox"
                                checked={this.props.isOnBookmark}
                                onChange={this.props.toggleBookmark}
                                aria-label={__("reader.navigation.bookmarkTitle")}
                            />
                            <label
                                htmlFor="bookmarkButton"
                                className={stylesReader.menu_button}
                            >
                                <SVG svg={MarkIcon} title={__("reader.navigation.bookmarkTitle")} />
                            </label>
                        </li>
                        <li
                            {...(this.props.settingsOpen &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <button
                                aria-pressed={this.props.settingsOpen}
                                aria-label={__("reader.navigation.settingsTitle")}
                                className={stylesReader.menu_button}
                                onClick={this.props.handleSettingsClick.bind(this)}
                                ref={this.settingsMenuButtonRef}
                            >
                                <SVG svg={SettingsIcon} title={__("reader.navigation.settingsTitle")} />
                            </button>
                            <ReaderOptions {...this.props.readerOptionsProps}
                                isDivina={this.props.isDivina}
                                isPdf={this.props.isPdf}
                                focusSettingMenuButton={this.focusSettingMenuButton} />
                        </li>
                        <li
                            {...(this.props.menuOpen &&
                                { style: { backgroundColor: "rgb(193, 193, 193)" } })}
                        >
                            <button
                                aria-pressed={this.props.menuOpen}
                                aria-label={__("reader.navigation.openTableOfContentsTitle")}
                                className={stylesReader.menu_button}
                                onClick={this.props.handleMenuClick.bind(this)}
                                ref={this.navigationMenuButtonRef}
                            >
                                <SVG svg={TOCIcon}
                                    title={__("reader.navigation.openTableOfContentsTitle")} />
                            </button>
                            <ReaderMenu {...this.props.readerMenuProps}
                                isDivina={this.props.isDivina}
                                isPdf={this.props.isPdf}
                                currentLocation={this.props.currentLocation}
                                focusNaviguationMenu={this.focusNaviguationMenuButton} />
                        </li>

                        {this.props.fullscreen ?
                            <li className={classNames(stylesReader.showInFullScreen)}>
                                <button
                                    className={classNames(stylesReader.menu_button)}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.disableFullscreenRef}
                                    aria-pressed={this.props.fullscreen}
                                    aria-label={__("reader.navigation.quitFullscreenTitle")}
                                >
                                    <SVG svg={QuitFullscreenIcon}
                                        title={__("reader.navigation.quitFullscreenTitle")} />
                                </button>
                            </li>
                            :
                            <li className={classNames(stylesReader.showInFullScreen, stylesReader.blue)}>
                                <button
                                    className={classNames(stylesReader.menu_button)}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.enableFullscreenRef}
                                    aria-pressed={this.props.fullscreen}
                                    aria-label={__("reader.navigation.fullscreenTitle")}
                                >
                                    <SVG svg={FullscreenIcon}
                                        title={__("reader.navigation.fullscreenTitle")} />
                                </button>
                            </li>
                        }
                    </ul>
                    {/*<li className={stylesReader.right}>
                            <button
                                className={stylesReader.menu_button}
                            >
                                <SVG svg={AudioIcon} title={ __("reader.navigation.readBookTitle")}/>
                            </button>
                        </li>

                        { this.props.fullscreen ? <></> : () }
                        */}

                </ul>
            </nav>
        );
    }

    private setScaleMode = (mode: IPdfPlayerScale) => {
        this.setState({ pdfScaleMode: mode });
    };

    private focusSettingMenuButton() {
        if (!this.settingsMenuButtonRef?.current) {
            return;
        }
        const button = ReactDOM.findDOMNode(this.settingsMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }

    private focusNaviguationMenuButton() {
        if (!this.navigationMenuButtonRef?.current) {
            return;
        }
        const button = ReactDOM.findDOMNode(this.navigationMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }
}

export default withTranslator(ReaderHeader);
