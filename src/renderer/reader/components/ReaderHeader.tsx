// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import { GithubPicker } from "react-color";
import * as debug_ from "debug";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as ReactDOM from "react-dom";
import { ReaderMode } from "readium-desktop/common/models/reader";
import * as BackIcon from "readium-desktop/renderer/assets/icons/outline-exit_to_app-24px.svg";
import * as viewMode from "readium-desktop/renderer/assets/icons/aspect_ratio-black-18dp.svg";
import * as MuteIcon from "readium-desktop/renderer/assets/icons/baseline-mute-24px.svg";
import * as PauseIcon from "readium-desktop/renderer/assets/icons/audio-pause-icon.svg";
import * as PlayIcon from "readium-desktop/renderer/assets/icons/audio-play-icon.svg";
import * as SkipNext from "readium-desktop/renderer/assets/icons/audio-next-icon.svg";
import * as SkipPrevious from "readium-desktop/renderer/assets/icons/audio-previous-icon.svg";
import * as StopIcon from "readium-desktop/renderer/assets/icons/audio-stop-icon.svg";
import * as AudioIcon from "readium-desktop/renderer/assets/icons/speaker-icon.svg";
import * as HeadphoneIcon from "readium-desktop/renderer/assets/icons/headphone-icon.svg";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as TOCIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/bookmarkSingle-icon.svg";
import * as AnnotationsIcon from "readium-desktop/renderer/assets/icons/comment-icon.svg";
import * as RemoveBookMarkIcon from "readium-desktop/renderer/assets/icons/BookmarkRemove-icon.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/fullscreen-icon.svg";
import * as ExitFullscreenIcon from "readium-desktop/renderer/assets/icons/fullscreenExit-icon.svg";
import * as FloppyDiskIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
// import * as ChevronUpIcon from "readium-desktop/renderer/assets/icons/chevron-up.svg";
// import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { fixedLayoutZoomPercent } from "@r2-navigator-js/electron/renderer/dom";
import {
    LocatorExtended, MediaOverlaysStateEnum, TTSStateEnum,
} from "@r2-navigator-js/electron/renderer/index";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { IPdfPlayerScale } from "../pdf/common/pdfReader.type";
import HeaderSearch from "./header/HeaderSearch";
import { IPopoverDialogProps, IReaderMenuProps, IReaderSettingsProps } from "./options-values";
import { ReaderMenu } from "./ReaderMenu";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { PublicationInfoReaderWithRadix, PublicationInfoReaderWithRadixContent, PublicationInfoReaderWithRadixTrigger } from "./dialog/publicationInfos/PublicationInfo";
import { ReaderSettings } from "./ReaderSettings";
import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";
import { ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";

const debug = debug_("readium-desktop:renderer:reader:components:ReaderHeader");

// function throttle(callback: (...args: any) => void, limit: number) {
//     let waiting = false;
//     return function(this: any) {
//         if (!waiting) {
//             // eslint-disable-next-line prefer-rest-params
//             callback.apply(this, arguments);
//             waiting = true;
//             setTimeout(() => {
//                 waiting = false;
//             }, limit);
//         }
//     };
// }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    menuOpen: boolean;
    infoOpen: boolean;
    shortcutEnable: boolean;
    mode?: ReaderMode;
    settingsOpen: boolean;
    handleMenuClick: (open?: boolean) => void;
    handleSettingsClick: (open?: boolean) => void;
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
    handlePublicationInfo: () => void;
    readerMenuProps: IReaderMenuProps;
    ReaderSettingsProps: IReaderSettingsProps;
    currentLocation: LocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    divinaSoundPlay: (play: boolean) => void;

    readerPopoverDialogContext: IPopoverDialogProps;

    showSearchResults: () => void;
    disableRTLFlip: boolean;
    isRTLFlip: () => boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
    r2Publication: R2Publication;
}

interface IState {
    pdfScaleMode: IPdfPlayerScale | undefined;
    divinaSoundEnabled: boolean;
    fxlZoomPercent: number;
    forceTTS: boolean;
    annotationColor: string;
}

export class ReaderHeader extends React.Component<IProps, IState> {

    private enableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private disableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private navigationMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private infoMenuButtonRef: React.RefObject<HTMLButtonElement>;

    // private onwheel: React.WheelEventHandler<HTMLSelectElement>;
    private timerFXLZoomDebounce: number | undefined;

    constructor(props: IProps) {
        super(props);
        this.enableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.disableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.navigationMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.infoMenuButtonRef = React.createRef<HTMLButtonElement>();

        this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);

        this.onKeyboardFixedLayoutZoomReset = this.onKeyboardFixedLayoutZoomReset.bind(this);
        this.onKeyboardFixedLayoutZoomIn = this.onKeyboardFixedLayoutZoomIn.bind(this);
        this.onKeyboardFixedLayoutZoomOut = this.onKeyboardFixedLayoutZoomOut.bind(this);

        this.state = {
            pdfScaleMode: undefined,
            divinaSoundEnabled: false,
            fxlZoomPercent: 0,
            forceTTS: false,
            annotationColor: "#008b02",
        };

        this.timerFXLZoomDebounce = undefined;

        // this.onwheel = throttle((ev) => {
        //     const step = 10;
        //     if (ev.deltaY < 0) { // "natural" gesture on MacOS :(
        //         if (this.state.fxlZoomPercent >= step) {
        //             this.setState({ fxlZoomPercent: this.state.fxlZoomPercent - step });
        //         }
        //     } else if (ev.deltaY > 0) {
        //         if (this.state.fxlZoomPercent <= 390) {
        //             this.setState({ fxlZoomPercent: this.state.fxlZoomPercent + step });
        //         }
        //     }
        //     if (this.timerFXLZoomDebounce) {
        //         clearTimeout(this.timerFXLZoomDebounce);
        //     }
        //     this.timerFXLZoomDebounce = window.setTimeout(() => {
        //         this.timerFXLZoomDebounce = undefined;
        //         fixedLayoutZoomPercent(this.state.fxlZoomPercent);
        //     }, 600);
        // }, 200).bind(this);
    }

    public componentDidMount() {

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        createOrGetPdfEventBus().subscribe("scale", this.setScaleMode);
    }

    public componentWillUnmount() {

        this.unregisterAllKeyboardListeners();

        createOrGetPdfEventBus().remove(this.setScaleMode, "scale");
    }

    public componentDidUpdate(oldProps: IProps, oldState: IState) {

        if (oldState.divinaSoundEnabled !== this.state.divinaSoundEnabled) {
            this.props.divinaSoundPlay(this.state.divinaSoundEnabled);
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

        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            console.log("READER HEADER RELOAD KEYBOARD SHORTCUTS");
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomReset,
            this.onKeyboardFixedLayoutZoomReset);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomIn,
            this.onKeyboardFixedLayoutZoomIn);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.FXLZoomOut,
            this.onKeyboardFixedLayoutZoomOut);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomReset);
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomIn);
        unregisterKeyboardListener(this.onKeyboardFixedLayoutZoomOut);
    }

    private onKeyboardFixedLayoutZoomReset() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomReset)");
            }
            return;
        }
        this.setState({ fxlZoomPercent: 0 });
        fixedLayoutZoomPercent(0);
    }
    private onKeyboardFixedLayoutZoomIn() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomIn)");
            }
            return;
        }
        const step = 10;
        let z = this.state.fxlZoomPercent === 0 ? 100 : (this.state.fxlZoomPercent + step);
        if (z >= 400) {
            z = 400;
        }

        this.setState({ fxlZoomPercent: z });

        if (this.timerFXLZoomDebounce) {
            clearTimeout(this.timerFXLZoomDebounce);
        }
        this.timerFXLZoomDebounce = window.setTimeout(() => {
            this.timerFXLZoomDebounce = undefined;
            fixedLayoutZoomPercent(z);
        }, 600);
    }
    private onKeyboardFixedLayoutZoomOut() {
        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFixedLayoutZoomOut)");
            }
            return;
        }
        const step = -10;
        let z = this.state.fxlZoomPercent === 0 ? 100 : (this.state.fxlZoomPercent + step);
        if (z <= -step) {
            z = -step;
        }

        this.setState({ fxlZoomPercent: z });

        if (this.timerFXLZoomDebounce) {
            clearTimeout(this.timerFXLZoomDebounce);
        }
        this.timerFXLZoomDebounce = window.setTimeout(() => {
            this.timerFXLZoomDebounce = undefined;
            fixedLayoutZoomPercent(z);
        }, 600);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const LANG_DIVIDER_PREFIX = "------------";
        let prevLang: string | undefined;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
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

        const isRTL = this.props.isRTLFlip();

        const showAudioTTSToolbar = (this.props.currentLocation && !this.props.currentLocation.audioPlaybackInfo) &&
            !this.props.isDivina && !this.props.isPdf;

        const useMO = !this.state.forceTTS && this.props.publicationHasMediaOverlays;

        const handleColorChangeComplete = (color: any) => {
            this.setState({ annotationColor: color.hex });
          };

        const handleFormSubmit = (event: any) => {
            event.preventDefault();
            const formData = {
                addNote: event.target.addNote.value,
                newColor: this.state.annotationColor,
            };
            console.log(formData);
        };

        const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: number, name: string }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
        SelectRef.displayName = "ComboBox";

        const fxlOptions = [
            {
                id: 0,
                value: 0,
                name: __("reader.fxl.fit"),
            },
            {
                id: 1,
                value: 50,
                name: "50%",
            },
            {
                id: 2,
                value: 100,
                name: "100%",
            },
            {
                id: 3,
                value: 200,
                name: "200%",
            },
        ];

        return (
            <nav
                className={classNames(stylesReaderHeader.toolbar_navigation,
                    // this.props.fullscreen ? stylesReader.main_navigation_fullscreen : undefined,
                    showAudioTTSToolbar || this.props.isDivina ? stylesReader.hasTtsAudio : undefined,
                    (useMO &&
                        this.props.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
                        || !useMO &&
                        this.props.ttsState !== TTSStateEnum.STOPPED) ?
                        stylesReaderHeader.ttsAudioActivated : undefined,
                )}
                role="navigation"
                aria-label={__("accessibility.toolbar")}
            >
                <ul>
                    <ul>
                        {(this.props.mode === ReaderMode.Attached) ? (
                            <li >
                                <button
                                    className={stylesReader.menu_button}
                                    style={{transform:"rotate(-90deg)"}}
                                    onClick={this.props.handleReaderClose}
                                    title={__("reader.navigation.backHomeTitle")}
                                >
                                    <SVG ariaHidden={true} svg={BackIcon} />
                                </button>
                            </li>
                        ) : (<></>)
                        }
                        <li>
                            <PublicationInfoReaderWithRadix handlePublicationInfo={this.props.handlePublicationInfo}>
                                <PublicationInfoReaderWithRadixTrigger asChild>
                                    <button
                                        className={stylesReader.menu_button}
                                        ref={this.infoMenuButtonRef}
                                        title={__("reader.navigation.infoTitle")}
                                        disabled={this.props.settingsOpen || this.props.menuOpen}
                                    >
                                        <SVG ariaHidden={true} svg={InfosIcon} />
                                    </button>
                                </PublicationInfoReaderWithRadixTrigger>
                                <PublicationInfoReaderWithRadixContent />
                            </PublicationInfoReaderWithRadix>
                        </li>
                        {(this.props.mode === ReaderMode.Attached) ? (
                            <li>
                                <button
                                    className={stylesReader.menu_button}
                                    onClick={this.props.handleReaderDetach}
                                    title={__("reader.navigation.detachWindowTitle")}
                                >
                                    <SVG ariaHidden={true} svg={DetachIcon} />
                                </button>
                            </li>
                        ) : (<></>)
                        }
                    </ul>

                    <ul className={classNames(stylesReader.tts_toolbar)}>
                        {
                            this.props.isDivina
                                ?
                                this.state.divinaSoundEnabled
                                ? <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: false})}
                                                    title={__("reader.divina.mute")}
                                                >
                                                    <SVG ariaHidden={true} svg={MuteIcon} />
                                                </button>
                                            </li>
                                : <li className={stylesReader.button_audio}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={() => this.setState({divinaSoundEnabled: true})}
                                                    title={__("reader.divina.unmute")}
                                                >
                                                    <SVG ariaHidden={true} svg={AudioIcon} />
                                                </button>
                                            </li>
                                : (useMO &&
                                    this.props.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED ||
                                    !useMO &&
                                    this.props.ttsState === TTSStateEnum.STOPPED) ?
                                    <li className={stylesReader.button_audio}>
                                        <button
                                            className={stylesReader.menu_button}
                                            onClick={(e) => {
                                                const forceTTS = e.shiftKey && e.altKey;
                                                this.setState({forceTTS});
                                                if (!forceTTS && this.props.publicationHasMediaOverlays) {
                                                    this.props.handleMediaOverlaysPlay();
                                                } else {
                                                    this.props.handleTTSPlay();
                                                }
                                            }
                                            }
                                            title={
                                                this.props.publicationHasMediaOverlays ?
                                                    __("reader.media-overlays.activate") :
                                                    __("reader.tts.activate")
                                            }
                                        >
                                            <SVG ariaHidden={true} svg={AudioIcon} />
                                        </button>
                                    </li>
                                    : <>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={(_e) => {
                                                  const forceTTS = this.state.forceTTS;
                                                  this.setState({forceTTS: false});
                                                    if (!forceTTS && this.props.publicationHasMediaOverlays) {
                                                        this.props.handleMediaOverlaysStop();
                                                    } else {
                                                        this.props.handleTTSStop();
                                                    }
                                                }
                                                }
                                                title={
                                                    useMO ?
                                                        __("reader.media-overlays.stop") :
                                                        __("reader.tts.stop")
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={StopIcon} />
                                            </button>
                                        </li>
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}
                                                onClick={(e) => {
                                                    if (useMO) {
                                                        if (isRTL) {
                                                          this.props.handleMediaOverlaysNext();
                                                        } else {
                                                          this.props.handleMediaOverlaysPrevious();
                                                        }
                                                    } else {
                                                        if (isRTL) {
                                                          this.props.handleTTSNext(e.shiftKey && e.altKey);
                                                        } else {
                                                          this.props.handleTTSPrevious(e.shiftKey && e.altKey);
                                                        }
                                                    }
                                                }}
                                                title={
                                                  isRTL ?
                                                  (useMO ?
                                                      __("reader.media-overlays.next") :
                                                      __("reader.tts.next"))
                                                  :
                                                  (useMO ?
                                                      __("reader.media-overlays.previous") :
                                                      __("reader.tts.previous"))
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={SkipPrevious} />
                                            </button>
                                        </li>
                                        {(useMO &&
                                            this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING ||
                                            !useMO &&
                                            this.props.ttsState === TTSStateEnum.PLAYING) ?
                                            <li  style={{backgroundColor: "var(--color-blue" }}>
                                                <button
                                                    className={stylesReader.menu_button}
                                                    onClick={
                                                        useMO ?
                                                            this.props.handleMediaOverlaysPause :
                                                            this.props.handleTTSPause
                                                    }
                                                    title={
                                                        useMO ?
                                                            __("reader.media-overlays.pause") :
                                                            __("reader.tts.pause")
                                                    }
                                                >
                                                    <SVG ariaHidden={true} svg={PauseIcon} className={stylesReaderHeader.active_svg} />
                                                </button>
                                            </li>
                                            :
                                            <li>
                                                <button
                                                    className={classNames(isRTL ? stylesReader.RTL_FLIP : undefined, stylesReader.menu_button)}
                                                    onClick={(_e) => {
                                                        if (useMO) {
                                                            this.props.handleMediaOverlaysResume();
                                                        } else {
                                                            this.props.handleTTSResume();
                                                        }
                                                    }
                                                    }
                                                    title={
                                                        useMO ?
                                                            __("reader.media-overlays.play") :
                                                            __("reader.tts.play")
                                                    }
                                                >
                                                    <SVG ariaHidden={true} svg={PlayIcon} />
                                                </button>
                                            </li>
                                        }
                                        <li >
                                            <button
                                                className={stylesReader.menu_button}

                                                onClick={(e) => {
                                                  if (isRTL) {
                                                    if (useMO) {
                                                        this.props.handleMediaOverlaysPrevious();
                                                    } else {
                                                        this.props.handleTTSPrevious(e.shiftKey && e.altKey);
                                                    }
                                                  } else {
                                                      if (useMO) {
                                                          this.props.handleMediaOverlaysNext();
                                                      } else {
                                                          this.props.handleTTSNext(e.shiftKey && e.altKey);
                                                      }
                                                  }
                                                }}
                                                title={
                                                  isRTL ?
                                                  (useMO ?
                                                      __("reader.media-overlays.previous") :
                                                      __("reader.tts.previous"))
                                                  :
                                                  (useMO ?
                                                      __("reader.media-overlays.next") :
                                                      __("reader.tts.next"))
                                                }
                                            >
                                                <SVG ariaHidden={true} svg={SkipNext} />
                                            </button>
                                        </li>
                                        <li>
                                            <Popover.Root>
                                                <Popover.Trigger asChild>
                                                    <button className={stylesReader.menu_button}>
                                                        <SVG ariaHidden svg={HeadphoneIcon} className={this.props.menuOpen ? stylesReaderHeader.active_svg : ""} />
                                                    </button>
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content sideOffset={10}>
                                                        <ul className={stylesReaderHeader.Tts_popover_container}>
                                                            <li className={stylesReader.ttsSelectRate}>
                                                                <label>
                                                                    {
                                                                        this.props.publicationHasMediaOverlays ?
                                                                            __("reader.media-overlays.speed") :
                                                                            __("reader.tts.speed")
                                                                    }
                                                                </label>
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
                                                            {!useMO && (
                                                                <li className={stylesReader.ttsSelectVoice}>
                                                                    <label>{__("reader.tts.voice")}</label>
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
                                                        </ul>
                                                        <Popover.Arrow className={stylesReaderHeader.popover_arrow} />
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                        </li>
                                    </>
                        }
                    </ul>

                    {/* {
                            this.props.isPdf || this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed" ?
                    <ul className={classNames(stylesReader.menu_option, stylesReaderHeader.pdf_options)}>
                        {
                            this.props.isPdf
                                ? <li
                                    {...(this.state.pdfScaleMode === "page-width" &&
                                        { style: { backgroundColor: "var(--color-blue" } })}
                                >
                                    <input
                                        id="pdfScaleButton"
                                        className={stylesReader.bookmarkButton}
                                        type="checkbox"
                                        checked={this.state.pdfScaleMode === "page-width"}
                                        // tslint:disable-next-line: max-line-length
                                        onChange={() => createOrGetPdfEventBus().dispatch("scale", this.state.pdfScaleMode === "page-fit" ? "page-width" : "page-fit")}
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                    />
                                    <label
                                        htmlFor="pdfScaleButton"
                                        className={stylesReader.menu_button}
                                    >
                                        { this.state.pdfScaleMode === "page-width" ? 
                                        <SVG ariaHidden svg={FullscreenIcon} title={__("reader.navigation.pdfscalemode")} />
                                        :
                                        <SVG ariaHidden svg={ExitFullscreenIcon} title={__("reader.navigation.pdfscalemode")}className={stylesReaderHeader.active_svg} />
                                        }
                                    </label>
                                </li>
                                : (this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed"
                                    ? <li>
                                        <button
                                         {...(this.state.fxlZoomPercent !== 0 &&
                                            { style: { border: "2px solid var(--color-blue)", borderRadius: "6px" } })}
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
                                                    title={__("reader.navigation.pdfscalemode")}
                                                >
                                                    {this.state.fxlZoomPercent > 0 ?
                                                        <label
                                                            htmlFor="buttonFXLZoom"
                                                            style={{ pointerEvents: "none", color: "var(--color-blue)", fontSize: "80%" }}>{this.state.fxlZoomPercent > 0 ? `${this.state.fxlZoomPercent}%` : " "}</label>
                                                        :
                                                        <SVG ariaHidden={true} svg={viewMode} />
                                                    }
                                                </button>
                                            </li>
                                            : <></>)
                        }
                    </ul>
                    : <></>
                    } */}

                    <ul className={stylesReader.menu_option}>
                        <li
                            {...(this.props.isOnSearch && { style: { backgroundColor: "var(--color-blue" } })}
                        >
                            <HeaderSearch shortcutEnable={this.props.shortcutEnable} isPdf={this.props.isPdf} showSearchResults={this.props.showSearchResults}></HeaderSearch>
                        </li>
                        <li
                            {...(this.props.isOnBookmark &&
                                { style: { backgroundColor: "var(--color-blue" } })}
                        >
                            <input
                                id="bookmarkButton"
                                className={stylesReader.bookmarkButton}
                                type="checkbox"
                                checked={this.props.isOnBookmark}
                                onChange={this.props.toggleBookmark}
                                aria-label={__("reader.navigation.bookmarkTitle")}
                                title={__("reader.navigation.bookmarkTitle")}
                            />
                            {
                                // "htmlFor" is necessary as input is NOT located suitably for mouse hit testing
                            }
                            <label
                                htmlFor="bookmarkButton"
                                aria-hidden="true"
                                className={stylesReader.menu_button}
                                id="bookmarkLabel"
                            >
                                <SVG ariaHidden={true} svg={MarkIcon} className={classNames(stylesReaderHeader.bookmarkIcon, this.props.isOnBookmark ? stylesReaderHeader.active_svg : "")} />
                                <SVG ariaHidden={true} svg={RemoveBookMarkIcon} className={classNames(stylesReaderHeader.bookmarkRemove, this.props.isOnBookmark ? stylesReaderHeader.active_svg : "")} />
                            </label>
                        </li>
                        <li>

                            <Popover.Root>
                                <Popover.Trigger asChild>
                                    <button className={classNames(stylesReader.menu_button, stylesReaderHeader.annotationsIcon)}>
                                        <SVG ariaHidden svg={AnnotationsIcon} />
                                    </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                    <Popover.Content sideOffset={this.props.isOnSearch ? 50 : 5} align="end" >
                                        <form
                                            className={stylesReader.annotation_form}
                                            onSubmit={handleFormSubmit}
                                        >
                                            <div>
                                                <label>{__("reader.annotations.highlight")}</label>
                                                <GithubPicker
                                                    colors={["#B80000", "#DB3E00", "#FCCB00", "#008B02", "#006B76", "#1273DE", "#004DCF", "#5300EB"]}
                                                    onChangeComplete={handleColorChangeComplete}
                                                    triangle="hide"
                                                />
                                            </div>
                                            <div className={stylesReader.annotation_form_textarea_container}>
                                                <label htmlFor="addNote">{__("reader.annotations.addNote")}</label>
                                                <textarea id="addNote" name="addNote" className={stylesReader.annotation_form_textarea}></textarea>
                                                <div className={stylesReader.annotation_form_textarea_buttons}>
                                                    <Popover.Close className={stylesButtons.button_secondary_blue} aria-label="Cancel">Cancel</Popover.Close>
                                                    <button type="submit" className={stylesButtons.button_primary_blue}>
                                                        <SVG ariaHidden svg={FloppyDiskIcon} />
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                        <Popover.Arrow style={{ fill: "var(--color-light-grey)" }} width={15} height={10} />
                                    </Popover.Content>
                                </Popover.Portal>
                            </Popover.Root>

                        </li>

                        <li
                            {...(this.props.menuOpen &&
                                { style: { backgroundColor: "var(--color-blue)" } })}
                        >

                            {/* { this.props.menuOpen ? */}

                            <Dialog.Root open={this.props.menuOpen} onOpenChange={(v) => { console.log("MENU DialogOnOpenChange", v); this.props.handleMenuClick(v); }} modal={false}>
                                <Dialog.Trigger asChild>
                                    <button
                                        aria-pressed={this.props.menuOpen}
                                        aria-label={__("reader.navigation.openTableOfContentsTitle")}
                                        className={stylesReader.menu_button}
                                        // onClick={this.props.handleMenuClick.bind(this)}
                                        ref={this.navigationMenuButtonRef}
                                        title={__("reader.navigation.openTableOfContentsTitle")}
                                    >
                                        <SVG ariaHidden={true} svg={TOCIcon} className={this.props.menuOpen ? stylesReaderHeader.active_svg : ""} />
                                    </button>
                                </Dialog.Trigger>
                                <Dialog.Portal>
                                    <Dialog.Content
                                        onPointerDownOutside={(e) => { e.preventDefault(); console.log("MenuModal onPointerDownOutside"); }}
                                        onInteractOutside={(e) => { e.preventDefault(); console.log("MenuModal onInteractOutside"); }}
                                        className={classNames(this.props.readerPopoverDialogContext.dockedMode ? stylesPopoverDialog.popover_dialog_reader : stylesPopoverDialog.modal_dialog_reader,
                                            this.props.ReaderSettingsProps.readerConfig.night ? stylesReader.nightMode : this.props.ReaderSettingsProps.readerConfig.sepia ? stylesReader.sepiaMode : "")}
                                        style={{
                                            borderLeft: this.props.readerPopoverDialogContext.dockingMode === "right" ? "1px solid var(--color-medium-grey)" : "",
                                            borderRight: this.props.readerPopoverDialogContext.dockingMode === "left" ? "1px solid var(--color-medium-grey)" : "",
                                            right: this.props.readerPopoverDialogContext.dockingMode === "right" ? "0" : "unset",
                                            left: this.props.readerPopoverDialogContext.dockedMode && this.props.readerPopoverDialogContext.dockingMode === "left" ? "0" : "",
                                        }}
                                    >
                                        <ReaderMenu {...this.props.readerMenuProps}
                                            {...this.props.readerPopoverDialogContext}
                                            isDivina={this.props.isDivina}
                                            isPdf={this.props.isPdf}
                                            currentLocation={this.props.currentLocation}
                                            focusNaviguationMenu={this.focusNaviguationMenuButton}
                                            handleMenuClick={this.props.handleMenuClick} />
                                    </Dialog.Content>
                                </Dialog.Portal>
                            </Dialog.Root>
                        </li>
                        <li
                            {...(this.props.settingsOpen &&
                                { style: { backgroundColor: "var(--color-blue" } })}
                        >
                            <Dialog.Root open={this.props.settingsOpen} onOpenChange={(v) => { console.log("SETTINGS DialogOnOpenChange", v); this.props.handleSettingsClick(v); }} modal={false}>
                                <Dialog.Trigger asChild>
                                    <button
                                        aria-pressed={this.props.settingsOpen}
                                        aria-label={__("reader.navigation.settingsTitle")}
                                        className={stylesReader.menu_button}
                                        // onClick={() => this.props.handleSettingsClick()}
                                        // ref={this.settingsMenuButtonRef}
                                        title={__("reader.navigation.settingsTitle")}
                                    >
                                        <SVG ariaHidden={true} svg={SettingsIcon} className={this.props.settingsOpen ? stylesReaderHeader.active_svg : ""} />
                                    </button>
                                </Dialog.Trigger>
                                <Dialog.Portal>
                                    <Dialog.Content
                                        onPointerDownOutside={(e) => { e.preventDefault(); console.log("settingsModal onPointerDownOutside"); }}
                                        onInteractOutside={(e) => { e.preventDefault(); console.log("SettingsModal onInteractOutside"); }}
                                        className={classNames(this.props.readerPopoverDialogContext.dockedMode ? stylesPopoverDialog.popover_dialog_reader : stylesPopoverDialog.modal_dialog_reader,
                                            this.props.ReaderSettingsProps.readerConfig.night ? stylesReader.nightMode : this.props.ReaderSettingsProps.readerConfig.sepia ? stylesReader.sepiaMode : "")}
                                        style={{
                                            borderLeft: this.props.readerPopoverDialogContext.dockingMode === "right" ? "1px solid var(--color-medium-grey)" : "",
                                            borderRight: this.props.readerPopoverDialogContext.dockingMode === "left" ? "1px solid var(--color-medium-grey)" : "",
                                            right: this.props.readerPopoverDialogContext.dockingMode === "right" ? "0" : "unset",
                                            left: this.props.readerPopoverDialogContext.dockedMode && this.props.readerPopoverDialogContext.dockingMode === "left" ? "0" : "",
                                        }}
                                    >
                                        <ReaderSettings {...this.props.ReaderSettingsProps} {...this.props.readerPopoverDialogContext} handleSettingsClick={this.props.handleSettingsClick} />
                                    </Dialog.Content>
                                </Dialog.Portal>
                            </Dialog.Root>
                        </li>
                        {
                            this.props.isPdf
                                ? <li
                                    {...(this.state.pdfScaleMode === "page-width" &&
                                        { style: { backgroundColor: "var(--color-blue" } })}
                                >
                                    <input
                                        id="pdfScaleButton"
                                        className={stylesReader.bookmarkButton}
                                        type="checkbox"
                                        checked={this.state.pdfScaleMode === "page-width"}
                                        // tslint:disable-next-line: max-line-length
                                        onChange={() => createOrGetPdfEventBus().dispatch("scale", this.state.pdfScaleMode === "page-fit" ? "page-width" : "page-fit")}
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                    />
                                    <label
                                        htmlFor="pdfScaleButton"
                                        className={stylesReader.menu_button}
                                    >
                                        {this.state.pdfScaleMode === "page-width" ?
                                            <SVG ariaHidden svg={ExitFullscreenIcon} title={__("reader.navigation.pdfscalemode")} className={stylesReaderHeader.active_svg} /> :
                                            <SVG ariaHidden svg={FullscreenIcon} title={__("reader.navigation.pdfscalemode")} />

                                        }
                                    </label>
                                </li>
                                : <></>
                        }
                        {
                            this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed"
                                ? <li className={stylesReader.select_fxl}>
                                    {/* <button
                                        {...(this.state.fxlZoomPercent !== 0 &&
                                            { style: { border: "2px solid var(--color-blue)", borderRadius: "6px" } })}
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
                                        title={__("reader.navigation.pdfscalemode")}
                                    >
                                        {this.state.fxlZoomPercent > 0 ?
                                            <label
                                                htmlFor="buttonFXLZoom"
                                                style={{ pointerEvents: "none", color: "var(--color-blue)", fontSize: "80%" }}>{this.state.fxlZoomPercent > 0 ? `${this.state.fxlZoomPercent}%` : " "}</label>
                                            :
                                            <SVG ariaHidden={true} svg={viewMode} />
                                        }
                                    </button> */}
                                    {/* <select
                                        onWheel={this.onwheel}
                                        id="buttonFXLZoom"
                                        className={classNames(stylesReader.fxl_select)}
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                        title={__("reader.navigation.pdfscalemode")}
                                        onChange={(e) => {
                                            debug("FXL this.state.fxlZoomPercent TOGGLE: " + this.state.fxlZoomPercent);
                                            this.setState({ fxlZoomPercent: parseInt(e.target.value) });
                                            fixedLayoutZoomPercent(parseInt(e.target.value))
                                        }}>
                                        <option value="">Fit</option>
                                        <option value={0}>Auto</option>
                                        <option value={50}>50%</option>
                                        <option value={100}>100%</option>
                                        <option value={200}>200%</option>
                                    </select> */}

                                    <SelectRef
                                        id="buttonFXLZoom"
                                        aria-label={__("reader.navigation.pdfscalemode")}
                                        items={fxlOptions}
                                        selectedKey={fxlOptions.find(({ value }) => this.state.fxlZoomPercent === value)?.id || 0}
                                        defaultSelectedKey={0}
                                        onSelectionChange={(id) => {
                                            const value = fxlOptions.find(({ id: _id }) => _id === id)?.value;
                                            debug("FXL this.state.fxlZoomPercent TOGGLE: " + this.state.fxlZoomPercent);
                                            console.log(value);
                                            this.setState({ fxlZoomPercent: value as number });
                                            fixedLayoutZoomPercent(value as number);
                                        }}
                                    >
                                        {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                                    </SelectRef>
                                </li>
                                : <></>
                        }
                        <li className={classNames(stylesReader.blue)}>
                            <button
                                className={classNames(stylesReader.menu_button)}
                                onClick={() => this.props.ReaderSettingsProps.setZenMode(!this.props.ReaderSettingsProps.zenMode)}
                                ref={this.enableFullscreenRef}
                                aria-pressed={this.props.fullscreen}
                                aria-label={__("reader.navigation.fullscreenTitle")}
                                title={__("reader.navigation.fullscreenTitle")}
                            >
                                <SVG ariaHidden={true} svg={viewMode} />
                            </button>
                        </li>
                    </ul>
                </ul>
            </nav>
        );
    }

    private setScaleMode = (mode: IPdfPlayerScale) => {
        this.setState({ pdfScaleMode: mode });
    };

    private focusNaviguationMenuButton() {
        if (!this.navigationMenuButtonRef?.current) {
            return;
        }
        const button = ReactDOM.findDOMNode(this.navigationMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        keyboardShortcuts: state.keyboard.shortcuts,
    };
};

const mapDispatchToProps = (_dispatch: TDispatch, _props: IBaseProps) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderHeader));
