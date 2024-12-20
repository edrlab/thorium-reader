// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";
// import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";

import classNames from "classnames";
import * as debug_ from "debug";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// import * as ReactDOM from "react-dom";
import { ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import * as BackIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import * as viewMode from "readium-desktop/renderer/assets/icons/fullscreen-corners-icon.svg";
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
import * as AnnotationsIcon from "readium-desktop/renderer/assets/icons/annotations-icon.svg";
import * as RemoveBookMarkIcon from "readium-desktop/renderer/assets/icons/BookmarkRemove-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
// import * as BookmarkFullIcon from "readium-desktop/renderer/assets/icons/.unused-icons/outline-bookmark-24px.svg";
// import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/fullscreen-icon.svg";
import * as ExitFullscreenIcon from "readium-desktop/renderer/assets/icons/fullscreenExit-icon.svg";
// import * as FloppyDiskIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
// import * as ChevronUpIcon from "readium-desktop/renderer/assets/icons/chevron-up.svg";
// import * as ChevronDownIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { fixedLayoutZoomPercent,
    // stealFocusDisable
} from "@r2-navigator-js/electron/renderer/dom";
import {
    MediaOverlaysStateEnum, TTSStateEnum,
} from "@r2-navigator-js/electron/renderer/index";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { IPdfPlayerScale } from "../pdf/common/pdfReader.type";
import HeaderSearch from "./header/HeaderSearch";
import { IReaderMenuProps, IReaderSettingsProps } from "./options-values";
import { ReaderMenu } from "./ReaderMenu";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { PublicationInfoReaderWithRadix, PublicationInfoReaderWithRadixContent, PublicationInfoReaderWithRadixTrigger } from "./dialog/publicationInfos/PublicationInfo";
import { ReaderSettings, ReadingAudio } from "./ReaderSettings";
import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { readerLocalActionAnnotations, readerLocalActionSetConfig } from "../redux/actions";
import { IColor, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";
import { AnnotationEdit } from "./AnnotationEdit";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";
import { VoiceSelection } from "./header/voiceSelection";
// import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { filterOnLanguage, getVoices, groupByRegions, IVoices } from "readium-speech";
import { ttsVoice as r2navigatorSetTTSVoice } from "@r2-navigator-js/electron/renderer/index";

const debug = debug_("readium-desktop:renderer:reader:components:ReaderHeader");

type IVoicesWithIndex = IVoices & { id: number };

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
    handleTTSPrevious: (skipSentences: boolean, escape: boolean) => void;
    handleTTSNext: (skipSentences: boolean, escape: boolean) => void;
    handleTTSPlaybackRate: (speed: string) => void;
    handleTTSVoice: (voice: SpeechSynthesisVoice | null) => void;

    handleMediaOverlaysPlay: () => void;
    handleMediaOverlaysPause: () => void;
    handleMediaOverlaysStop: () => void;
    handleMediaOverlaysResume: () => void;
    handleMediaOverlaysPrevious: () => void;
    handleMediaOverlaysNext: () => void;
    handleMediaOverlaysPlaybackRate: (speed: string) => void;

    handleReaderClose: () => void;
    handleReaderDetach: () => void;
    toggleBookmark: () => void;
    // isOnBookmark: boolean;
    numberOfVisibleBookmarks: number;
    isOnSearch: boolean;
    handlePublicationInfo: () => void;
    readerMenuProps: IReaderMenuProps;
    ReaderSettingsProps: IReaderSettingsProps;
    currentLocation: MiniLocatorExtended;
    isDivina: boolean;
    isPdf: boolean;
    divinaSoundPlay: (play: boolean) => void;

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
}

interface IState {
    pdfScaleMode: IPdfPlayerScale | undefined;
    divinaSoundEnabled: boolean;
    fxlZoomPercent: number;
    forceTTS: boolean;
    ttsPopoverOpen: boolean;
    tabValue: string;
    voices: IVoicesWithIndex[];
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

        // this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);

        this.onKeyboardFixedLayoutZoomReset = this.onKeyboardFixedLayoutZoomReset.bind(this);
        this.onKeyboardFixedLayoutZoomIn = this.onKeyboardFixedLayoutZoomIn.bind(this);
        this.onKeyboardFixedLayoutZoomOut = this.onKeyboardFixedLayoutZoomOut.bind(this);

        this.state = {
            pdfScaleMode: undefined,
            divinaSoundEnabled: false,
            fxlZoomPercent: 0,
            forceTTS: false,
            ttsPopoverOpen: false,
            tabValue: this.props.ReaderSettingsProps.isDivina ? "tab-divina" : this.props.ReaderSettingsProps.isPdf ? "tab-pdfzoom" : "tab-display",
            voices: [],
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

    private handleTTSVoice = (voice: IVoices) => {
        const v = voice ? {
            default: false,
            lang: voice.language,
            localService: voice.offlineAvailability,
            name: voice.name,
            voiceURI: voice.voiceURI,
        } : null;
        r2navigatorSetTTSVoice(v);
        this.props.setConfig({ ttsVoice: v });
    };

    public componentDidMount() {

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        createOrGetPdfEventBus().subscribe("scale", this.setScaleMode);

        getVoices().then((_voices) => {
            if (Array.isArray(_voices)) {
                this.setState({
                    voices: _voices.map((v, i) => ({...v, id: i+1})),
                });

                const voicesFilteredOnLanguage = filterOnLanguage(_voices, this.props.r2Publication.Metadata?.Language || []) as IVoicesWithIndex[];
                const voicesGroupedByRegions = groupByRegions(voicesFilteredOnLanguage, this.props.r2Publication.Metadata?.Language || [], this.props.locale) as Map<string, IVoicesWithIndex[]>;

                // const firstVoice = ((Array.from(voicesGroupedByRegions)[0] || [])[1] || [])[0];
                const firstVoiceArrayFromMap = Array.from(voicesGroupedByRegions);
                const firstVoiceArrayFirst = firstVoiceArrayFromMap[0];
                const firstVoiceArraySecondVoicesListItems = (firstVoiceArrayFirst || [])[1];
                const firstVoiceFirstItemFromVoicesList = (firstVoiceArraySecondVoicesListItems || [])[0];
                if (firstVoiceFirstItemFromVoicesList) {
                    const firstVoice = firstVoiceFirstItemFromVoicesList;
                    if (this.props.ttsVoice) {
                        if (firstVoice.voiceURI && firstVoice.voiceURI === this.props.ttsVoice.voiceURI &&
                            firstVoice.name && firstVoice.name === this.props.ttsVoice.name &&
                            firstVoice.language && firstVoice.language === this.props.ttsVoice.lang
                        ) {
                            // nothing
                        } else {
                            if (firstVoice.language?.split("-")[0] === this.props.ttsVoice.lang?.split("-")[0]) {
                                // nothing
                            } else {
                                // when language code switch, change the default ttsVoice
                                this.handleTTSVoice(firstVoice);
                            }
                        }
                    } else {
                        // if there is no default TTSVoice, set the first voice returned par getVoices
                        this.handleTTSVoice(firstVoice);
                    }
                }
            }
        });

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
            // TODO: why steal focus here? (for example if the fullscreen/zenmode feature is activated via keyboard shortcut instead of button click!)
            if (this.props.fullscreen && this.disableFullscreenRef?.current) {
                this.disableFullscreenRef.current.focus();
            } else if (!this.props.fullscreen && this.enableFullscreenRef?.current) {
                this.enableFullscreenRef.current.focus();
            }
        }

        if (this.props.infoOpen !== oldProps.infoOpen &&
            this.props.infoOpen === false &&
            this.infoMenuButtonRef?.current) {
            // TODO: why steal focus here? (for example if the dialog was activated via keyboard shortcut instead of button click!)
            this.infoMenuButtonRef.current.focus();
        }

        // if (this.props.menuOpen !== oldProps.menuOpen &&
        //     this.props.menuOpen === true) {
        //     this.focusNaviguationMenuButton();
        // }

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


    private __closeNavPanel = false;

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        // TODO change this
        const readerSettingsHeaderProps = {

            tabValue: this.state.tabValue,
            setTabValue: (value: string) => this.setState({ tabValue: value}),
        };

        const playbackRate = [
            { id: 0, value: 0.5, name: "0.5x" },
            { id: 1, value: 0.75, name: "0.75x" },
            { id: 2, value: 1, name: "1x" },
            { id: 3, value: 1.25, name: "1.25x" },
            { id: 4, value: 1.5, name: "1.5x" },
            { id: 5, value: 1.75, name: "1.75x" },
            { id: 6, value: 2, name: "2x" },
            { id: 7, value: 2.25, name: "2.25x" },
            { id: 8, value: 2.5, name: "2.5x" },
            { id: 9, value: 2.75, name: "2.75x" },
            { id: 10, value: 3, name: "3x" },
        ];

        const isRTL = this.props.isRTLFlip();

        const showAudioTTSToolbar = (this.props.currentLocation && !this.props.currentLocation.audioPlaybackInfo) &&
            !this.props.isDivina && !this.props.isPdf;

        const useMO = !this.state.forceTTS && this.props.publicationHasMediaOverlays;

        const SelectTts = React.forwardRef<HTMLButtonElement, MySelectProps<{ default: boolean, lang: string, localService: boolean, name: string, voiceURI: string}>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
        SelectTts.displayName = "ComboBox";

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

        const isDockedMode = this.props.readerConfig.readerDockingMode !== "full";
        const isOnSearch = this.props.isOnSearch;
        const isNightMode = this.props.readerConfig.night || this.props.readerConfig.theme === "night";
        const isSepiaMode = this.props.readerConfig.sepia || this.props.readerConfig.theme === "sepia";

        const containerClassName = classNames(
            isDockedMode && isOnSearch && stylesReader.isOnSearch,
            isDockedMode && isOnSearch && stylesPopoverDialog.popover_dialog_reader,
            isDockedMode && !isOnSearch && stylesPopoverDialog.popover_dialog_reader,
            !isDockedMode && !isOnSearch && stylesPopoverDialog.modal_dialog_reader,
            !isDockedMode && isOnSearch && stylesPopoverDialog.modal_dialog_reader,
            isNightMode && stylesReader.nightMode,
            isSepiaMode && stylesReader.sepiaMode,
          );

          const isAudioBook = isAudiobookFn(this.props.r2Publication);



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
                        <li >
                            <button
                                className={stylesReader.menu_button}
                                onClick={this.props.handleReaderClose}
                                title={__("reader.navigation.backHomeTitle")}
                            >
                                <SVG ariaHidden={true} svg={BackIcon} />
                            </button>
                        </li>
                        <li>
                            <PublicationInfoReaderWithRadix handlePublicationInfo={this.props.handlePublicationInfo}>
                                <PublicationInfoReaderWithRadixTrigger asChild>
                                    <button
                                        className={stylesReader.menu_button}
                                        ref={this.infoMenuButtonRef}
                                        title={__("reader.navigation.infoTitle")}
                                        disabled={(this.props.settingsOpen || this.props.menuOpen) && !isDockedMode}
                                    >
                                        <SVG ariaHidden={true} svg={InfosIcon} />
                                    </button>
                                </PublicationInfoReaderWithRadixTrigger>
                                <PublicationInfoReaderWithRadixContent />
                            </PublicationInfoReaderWithRadix>
                        </li>
                        {/* {(this.props.mode === ReaderMode.Attached) ? (
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
                        } */}
                    </ul>
                    {
                    this.props.isPdf ? <></> :
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
                                                          this.props.handleTTSNext(e.shiftKey && e.altKey && e.metaKey, e.shiftKey && e.altKey);
                                                        } else {
                                                          this.props.handleTTSPrevious(e.shiftKey && e.altKey && e.metaKey, e.shiftKey && e.altKey);
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
                                            <li  style={{backgroundColor: "var(--color-blue)" }}>
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
                                                        this.props.handleTTSPrevious(e.shiftKey && e.altKey && e.metaKey, e.shiftKey && e.altKey);
                                                    }
                                                  } else {
                                                      if (useMO) {
                                                          this.props.handleMediaOverlaysNext();
                                                      } else {
                                                          this.props.handleTTSNext(e.shiftKey && e.altKey && e.metaKey, e.shiftKey && e.altKey);
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
                                            <Popover.Root open={this.state.ttsPopoverOpen} onOpenChange={() => this.setState({ ttsPopoverOpen : !this.state.ttsPopoverOpen})}>
                                                <Popover.Trigger asChild>
                                                    <button className={stylesReader.menu_button} style={{backgroundColor: this.state.ttsPopoverOpen ? "var(--color-blue)" : ""}}>
                                                        <SVG ariaHidden svg={HeadphoneIcon} className={this.state.ttsPopoverOpen ? stylesReaderHeader.active_svg : ""} />
                                                    </button>
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content style={{zIndex: 100}}>
                                                        <div className={stylesReaderHeader.Tts_popover_container}>
                                                            <div style={{paddingRight: "25px", borderRight: "1px solid var(--color-verylight-grey-alt)"}}>
                                                            <div className={stylesReader.ttsSelectRate}>
                                                                            <ComboBox label={useMO ?
                                                                                __("reader.media-overlays.speed")
                                                                                : __("reader.tts.speed")}
                                                                                defaultItems={playbackRate}
                                                                                // defaultSelectedKey={2}
                                                                                selectedKey={
                                                                                    this.props.ttsPlaybackRate ?
                                                                                    playbackRate.find((rate) => rate.value.toString() === (useMO ? this.props.mediaOverlaysPlaybackRate : this.props.ttsPlaybackRate)).id :
                                                                                        2
                                                                                }
                                                                                onSelectionChange={(ev) => {
                                                                                    const v = playbackRate.find((option) => option.id === ev).value;
                                                                                    if (useMO) {
                                                                                        this.props.handleMediaOverlaysPlaybackRate(
                                                                                            v.toString(),
                                                                                        );
                                                                                    } else {
                                                                                        this.props.handleTTSPlaybackRate(
                                                                                            v.toString(),
                                                                                        );
                                                                                    }
                                                                                }}>
                                                                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                                                                            </ComboBox>
                                                                        </div>
                                                                        {!useMO && (
                                                                            <VoiceSelection handleTTSVoice={this.handleTTSVoice} voices={this.state.voices}/>
                                                                        )}
                                                                    </div>
                                                                    <ReadingAudio useMO={useMO}/>
                                                                </div>
                                                                <Popover.Arrow className={stylesReaderHeader.popover_arrow} />
                                                            </Popover.Content>
                                                        </Popover.Portal>
                                                    </Popover.Root>
                                                </li>
                                    </>
                        }
                    </ul>

                    }

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
                               <HeaderSearch shortcutEnable={this.props.shortcutEnable} isPdf={this.props.isPdf} showSearchResults={this.props.showSearchResults} isAudiobook={isAudioBook} isDivina={this.props.isDivina}></HeaderSearch>
                        </li>
                        <li
                            {...(this.props.numberOfVisibleBookmarks > 0 &&
                                { style: { backgroundColor: "var(--color-blue" } })}
                        >
                            <input
                                id="bookmarkButton"
                                className={stylesReader.bookmarkButton}
                                type="checkbox"
                                checked={this.props.numberOfVisibleBookmarks > 0}
                                onKeyUp={(e) => {
                                    if (e.key === "Enter") { this.props.toggleBookmark(); }
                                }}
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

                                aria-label={`${__("reader.navigation.bookmarkTitle")} (${
                                    (this.props.numberOfVisibleBookmarks === 1 && !this.props.selectionIsNew) ? __("catalog.delete") : __("catalog.addTagsButton")
                                })`}
                                title={`${__("reader.navigation.bookmarkTitle")} (${
                                    (this.props.numberOfVisibleBookmarks === 1 && !this.props.selectionIsNew) ? __("catalog.delete") : __("catalog.addTagsButton")
                                })`}
                            >
                                <SVG ariaHidden={true} svg={MarkIcon} className={classNames(stylesReaderHeader.bookmarkIcon,
                                    this.props.numberOfVisibleBookmarks > 0
                                    ? stylesReaderHeader.active_svg : "")} />
                                <SVG ariaHidden={true} svg={RemoveBookMarkIcon} className={classNames(stylesReaderHeader.bookmarkRemove,
                                    (this.props.numberOfVisibleBookmarks === 1 && !this.props.selectionIsNew)
                                    ? stylesReaderHeader.active_svg : "")} />
                                <SVG ariaHidden={true} svg={PlusIcon} className={classNames(stylesReaderHeader.bookmarkRemove,
                                    this.props.numberOfVisibleBookmarks > 1 || (this.props.numberOfVisibleBookmarks === 1 && this.props.selectionIsNew)
                                    ? stylesReaderHeader.active_svg : "")} />
                            </label>
                        </li>

                        <Popover.Root open={this.props.isAnnotationModeEnabled} onOpenChange={(open) => {
                            if (open === false) {
                                setTimeout(() => this.props.closeAnnotationEditionMode(), 1); // trigger input onChange before the popover trigger
                            }
                        }}>
                            <Popover.Trigger asChild>
                                <li
                                    {...(this.props.isAnnotationModeEnabled &&
                                        { style: { backgroundColor: "var(--color-blue" } })}
                                >
                                    <input
                                    disabled={this.props.isPdf || this.props.isDivina || isAudioBook}
                                        id="annotationButton"
                                        className={stylesReader.bookmarkButton}
                                        type="checkbox"
                                        checked={this.props.isAnnotationModeEnabled}
                                        onKeyUp={(e) => {
                                            if (e.key === "Enter") {
                                                this.props.triggerAnnotationBtn();
                                            }
                                        }}
                                        onChange={() => {
                                            this.props.triggerAnnotationBtn();
                                        }}
                                    // aria-label={__("reader.navigation.bookmarkTitle")}
                                    // title={__("reader.navigation.bookmarkTitle")}
                                    />
                                    {
                                        // "htmlFor" is necessary as input is NOT located suitably for mouse hit testing
                                    }
                                    <label
                                        htmlFor="annotationButton"
                                        aria-hidden="true"
                                        className={stylesReader.menu_button}
                                        id="annotationLabel"
                                        aria-label={__("reader.navigation.annotationTitle")}
                                        title={__("reader.navigation.annotationTitle")}
                                    >
                                        <SVG ariaHidden svg={AnnotationsIcon} className={classNames(stylesReaderHeader.annotationsIcon, this.props.isAnnotationModeEnabled ? stylesReaderHeader.active_svg : "")} />
                                    </label>
                                </li>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content sideOffset={this.props.isOnSearch ? 50 : 18} align="end" style={{ zIndex: 101 }}
                                        // onPointerDownOutside={(e) => { e.preventDefault(); console.log("annotationPopover onPointerDownOutside"); }}
                                        // onInteractOutside={(e) => { e.preventDefault(); console.log("annotationPopover onInteractOutside"); }}
                                        >
                                            <AnnotationEdit save={this.props.saveAnnotation} cancel={this.props.closeAnnotationEditionMode} dockedMode={isDockedMode}/>
                                    <Popover.Arrow style={{ fill: "var(--color-extralight-grey)"}} width={15} height={10} />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>


                        <li
                            {...(this.props.menuOpen &&
                                { style: { backgroundColor: "var(--color-blue)" } })}
                        >

                            {/* { this.props.menuOpen ? */}

                            <Dialog.Root
                                open={this.props.menuOpen}
                                onOpenChange={(open) => {
                                    console.log("MENU DialogOnOpenChange", open);
                                    this.props.handleMenuClick(open);
                                    if (open) {
                                        // if (!this.props.isDivina  && !this.props.isPdf) {
                                        //     stealFocusDisable(true);
                                        // }
                                        this.__closeNavPanel = false;
                                    } else {
                                        // if (!this.props.isDivina  && !this.props.isPdf) {
                                        //     stealFocusDisable(false);
                                        // }
                                    }
                                }}
                                modal={!isDockedMode}
                            >
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
                                    {
                                        isDockedMode ?
                                            <div
                                                className={containerClassName}
                                                style={{
                                                    borderLeft: this.props.readerConfig.readerDockingMode === "right" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                    borderRight: this.props.readerConfig.readerDockingMode === "left" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                    right: this.props.readerConfig.readerDockingMode === "right" ? "0" : "unset",
                                                    left: (this.props.readerConfig.readerDockingMode === "left") ? "0" : "",
                                                    height: (isOnSearch) ? "calc(100dvh - 159px)" : "",
                                                    marginTop: (!isOnSearch) ? "70px" : "20px",
                                                }}
                                            >
                                                <ReaderMenu
                                                    {...this.props.readerMenuProps}
                                                    isDivina={this.props.isDivina}
                                                    isPdf={this.props.isPdf}
                                                    currentLocation={this.props.currentLocation}
                                                    // focusNaviguationMenu={this.focusNaviguationMenuButton}
                                                    handleMenuClick={this.props.handleMenuClick} />
                                            </div>
                                        :
                                            <Dialog.Content
                                                // onFocusOutside={(e) => {
                                                // console.log(e);
                                                // }}
                                                // onPointerDownOutside={(e) => {
                                                //     if (this.props.readerPopoverDialogContext.dockedMode) {
                                                //         e.preventDefault();
                                                //     }
                                                //     console.log("MenuModal onPointerDownOutside");
                                                // }}
                                                // onInteractOutside={(e) => {
                                                //     if (this.props.readerPopoverDialogContext.dockedMode) {
                                                //         e.preventDefault();
                                                //     }
                                                //     console.log("MenuModal onInteractOutside");
                                                // }}
                                                onCloseAutoFocus={(e) => {
                                                    if (this.__closeNavPanel) {
                                                        e.preventDefault();
                                                    }
                                                    console.log("MenuModal onCloseAutoFocus");
                                                }}
                                                className={containerClassName}
                                                style={{
                                                    borderLeft: this.props.readerConfig.readerDockingMode === "right" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                    borderRight: this.props.readerConfig.readerDockingMode === "left" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                    right: this.props.readerConfig.readerDockingMode === "right" ? "0" : "unset",
                                                    left: /*(isDockedMode && this.props.readerConfig.readerDockingMode === "left") ? "0" :*/ "",
                                                    height: /*(isDockedMode && isOnSearch) ? "calc(100dvh - 159px)" :*/ "",
                                                    marginTop: /*(isDockedMode && !isOnSearch) ? "70px" :*/ "20px",
                                                }}
                                                aria-describedby={undefined}
                                            >
                                                <VisuallyHidden.Root>
                                                    <Dialog.Title>{__("reader.navigation.openTableOfContentsTitle")}</Dialog.Title>
                                                </VisuallyHidden.Root>
                                                <ReaderMenu
                                                    {...this.props.readerMenuProps}
                                                    handleLinkClick={(event, url, closeNavPanel) => {
                                                        this.props.readerMenuProps.handleLinkClick(event, url, closeNavPanel);
                                                        if (closeNavPanel) {
                                                            this.__closeNavPanel = true;
                                                        }
                                                    }}
                                                    isDivina={this.props.isDivina}
                                                    isPdf={this.props.isPdf}
                                                    currentLocation={this.props.currentLocation}
                                                    // focusNaviguationMenu={this.focusNaviguationMenuButton}
                                                    handleMenuClick={this.props.handleMenuClick} />
                                            </Dialog.Content>
                                    }
                                </Dialog.Portal>
                            </Dialog.Root>
                        </li>
                        <li
                            {...(this.props.settingsOpen &&
                                { style: { backgroundColor: "var(--color-blue" } })}
                        >
                            <Dialog.Root
                                open={this.props.settingsOpen}
                                onOpenChange={(open) => {
                                    console.log("SETTINGS DialogOnOpenChange", open);
                                    this.props.handleSettingsClick(open);
                                    // if (open) {
                                    //     if (!this.props.isDivina  && !this.props.isPdf) {
                                    //         stealFocusDisable(true);
                                    //     }
                                    //     // this.__closeNavPanel = false;
                                    // } else {
                                    //     if (!this.props.isDivina  && !this.props.isPdf) {
                                    //         stealFocusDisable(false);
                                    //     }
                                    // }
                                }}
                                modal={!isDockedMode}
                            >
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

                                    {isDockedMode ?
                                        <div
                                            className={containerClassName}
                                            style={{
                                                borderLeft: this.props.readerConfig.readerDockingMode === "right" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                borderRight: this.props.readerConfig.readerDockingMode === "left" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                right: this.props.readerConfig.readerDockingMode === "right" ? "0" : "unset",
                                                left: this.props.readerConfig.readerDockingMode === "left" ? "0" : "",
                                                height: isOnSearch ? "calc(100dvh - 159px)" : "",
                                                marginTop: !isOnSearch ? "70px" : "20px",
                                            }}
                                        >
                                            {/* TODO remove readerSettingsHeaderProps */}
                                            <ReaderSettings
                                                {...readerSettingsHeaderProps}
                                                {...this.props.ReaderSettingsProps}
                                                handleSettingsClick={this.props.handleSettingsClick} />
                                        </div>
                                    :
                                        <Dialog.Content
                                            // onPointerDownOutside={(e) => { e.preventDefault(); console.log("settingsModal onPointerDownOutside"); }}
                                            // onInteractOutside={(e) => { e.preventDefault(); console.log("SettingsModal onInteractOutside"); }}
                                            className={containerClassName}
                                            style={{
                                                borderLeft: this.props.readerConfig.readerDockingMode === "right" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                borderRight: this.props.readerConfig.readerDockingMode === "left" ? "2px solid var(--color-extralight-grey-alt)" : "",
                                                right: this.props.readerConfig.readerDockingMode === "right" ? "0" : "unset",
                                                left: /*isDockedMode && this.props.readerConfig.readerDockingMode === "left" ? "0" :*/ "",
                                                height: /*isDockedMode && isOnSearch ? "calc(100dvh - 159px)" :*/ "",
                                                marginTop: /*isDockedMode && !isOnSearch ? "70px" :*/ "20px",
                                            }}
                                            aria-describedby={undefined}
                                        >
                                            <VisuallyHidden.Root>
                                                <Dialog.Title>{__("reader.navigation.settingsTitle")}</Dialog.Title>
                                            </VisuallyHidden.Root>
                                            {/* TODO remove readerSettingsHeaderProps */}
                                            <ReaderSettings
                                                {...readerSettingsHeaderProps}
                                                {...this.props.ReaderSettingsProps}
                                                handleSettingsClick={this.props.handleSettingsClick} />
                                        </Dialog.Content>

                                    }
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
                                            this.setState({ fxlZoomPercent: parseInt(e.target.value, 10) });
                                            fixedLayoutZoomPercent(parseInt(e.target.value, 10))
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
                        <span style={{width: "1px", height: "30px", backgroundColor: "var(--color-verylight-grey)", margin: "auto 5px"}}></span>
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

    // private focusNaviguationMenuButton() {
    //     if (!this.navigationMenuButtonRef?.current) {
    //         return;
    //     }
    //     const button = ReactDOM.findDOMNode(this.navigationMenuButtonRef.current) as HTMLButtonElement;

    //     button.focus();
    // }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {
    return {
        keyboardShortcuts: state.keyboard.shortcuts,
        annotationsDataArray: state.reader.annotation,
        isAnnotationModeEnabled: state.annotation.enable,
        publicationHasMediaOverlays: state.reader.info.navigator.r2PublicationHasMediaOverlays,
        mediaOverlaysState: state.reader.mediaOverlay.state,
        ttsState: state.reader.tts.state,
        ttsVoice: state.reader.config.ttsVoice,
        mediaOverlaysPlaybackRate: state.reader.config.mediaOverlaysPlaybackRate,
        ttsPlaybackRate: state.reader.config.ttsPlaybackRate,
        readerConfig: state.reader.config,
        r2Publication: state.reader.info.r2Publication,
        selectionIsNew: state.reader.locator.selectionIsNew,
        locale: state.i18n.locale, // refresh
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setConfig: (state: Partial<ReaderConfig>) => {
            dispatch(readerLocalActionSetConfig.build(state));
        },
        triggerAnnotationBtn: () => {
            dispatch(readerLocalActionAnnotations.trigger.build());
        },
        closeAnnotationEditionMode: () => {
            dispatch(readerLocalActionAnnotations.enableMode.build(false, undefined));
        },
        saveAnnotation: (color: IColor, comment: string, drawType: TDrawType, tags: string[]) => {
            dispatch(readerLocalActionAnnotations.createNote.build(color, comment, drawType, tags));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderHeader));
