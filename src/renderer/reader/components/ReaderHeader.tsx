// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as React from "react";
import { ReaderMode } from "readium-desktop/common/models/reader";
import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
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
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import {
    LocatorExtended, MediaOverlaysStateEnum, TTSStateEnum,
} from "@r2-navigator-js/electron/renderer/index";

import { IReaderMenuProps, IReaderOptionsProps } from "./options-values";
import ReaderMenu from "./ReaderMenu";
import ReaderOptions from "./ReaderOptions";

import ReactDOM = require("react-dom");

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    menuOpen: boolean;
    infoOpen: boolean;
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
    handleTTSPrevious: () => void;
    handleTTSNext: () => void;
    handleTTSPlaybackRate: (speed: string) => void;
    ttsState: TTSStateEnum;
    ttsPlaybackRate: string;

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
    displayPublicationInfo: () => void;
    readerMenuProps: IReaderMenuProps;
    readerOptionsProps: IReaderOptionsProps;
    currentLocation: LocatorExtended;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export class ReaderHeader extends React.Component<IProps, undefined> {

    private enableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private disableFullscreenRef: React.RefObject<HTMLButtonElement>;
    private settingsMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private navigationMenuButtonRef: React.RefObject<HTMLButtonElement>;
    private infoMenuButtonRef: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);
        this.enableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.disableFullscreenRef = React.createRef<HTMLButtonElement>();
        this.settingsMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.navigationMenuButtonRef = React.createRef<HTMLButtonElement>();
        this.infoMenuButtonRef = React.createRef<HTMLButtonElement>();

        this.focusSettingMenuButton = this.focusSettingMenuButton.bind(this);
        this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
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

        const showAudioTTSToolbar = this.props.currentLocation && !this.props.currentLocation.audioPlaybackInfo;
        return (
            <nav
                className={classNames(styles.main_navigation,
                    this.props.fullscreen ? styles.main_navigation_fullscreen : undefined,
                    showAudioTTSToolbar ? styles.hasTtsAudio : undefined,
                    (this.props.publicationHasMediaOverlays &&
                    this.props.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED
                    || !this.props.publicationHasMediaOverlays &&
                    this.props.ttsState !== TTSStateEnum.STOPPED) ?
                        styles.ttsAudioActivated : undefined,
                    )}
                role="navigation"
                aria-label={ __("accessibility.homeMenu")}
            >
                <ul>

                        { (this.props.mode === ReaderMode.Attached) ? (
                            <li>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleReaderClose}
                                >
                                    <SVG svg={BackIcon} title={ __("reader.navigation.backHomeTitle")}/>
                                </button>
                            </li>
                            ) : (<></>)
                        }
                        <li>
                            <button
                                className={styles.menu_button}
                                onClick={() => this.props.displayPublicationInfo()}
                                ref={this.infoMenuButtonRef}
                            >
                                <SVG svg={InfosIcon} title={ __("reader.navigation.infoTitle")}/>
                            </button>
                        </li>
                        { (this.props.mode === ReaderMode.Attached) ? (
                            <li>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleReaderDetach}
                                >
                                    <SVG svg={DetachIcon} title={ __("reader.navigation.detachWindowTitle")}/>
                                </button>
                            </li>
                            ) : (<></>)
                        }

                        <ul className={styles.tts_toolbar}>
                            {(this.props.publicationHasMediaOverlays &&
                            this.props.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED ||
                            !this.props.publicationHasMediaOverlays &&
                            this.props.ttsState === TTSStateEnum.STOPPED) ?
                            <li className={styles.button_audio}>
                                <button
                                    className={styles.menu_button}
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
                                    }/>
                                </button>
                            </li>
                            : <>
                            <li >
                                <button
                                    className={styles.menu_button}
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
                                    }/>
                                </button>
                            </li>
                            <li >
                                <button
                                    className={styles.menu_button}
                                    onClick={
                                        this.props.publicationHasMediaOverlays ?
                                        this.props.handleMediaOverlaysPrevious :
                                        this.props.handleTTSPrevious
                                    }
                                >
                                    <SVG svg={SkipPrevious} title={
                                    this.props.publicationHasMediaOverlays ?
                                    __("reader.media-overlays.previous") :
                                    __("reader.tts.previous")
                                    }/>
                                </button>
                            </li>
                            {(this.props.publicationHasMediaOverlays &&
                            this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING ||
                            !this.props.publicationHasMediaOverlays &&
                            this.props.ttsState === TTSStateEnum.PLAYING) ?
                            <li >
                                <button
                                    className={styles.menu_button}
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
                                    }/>
                                </button>
                            </li>
                            :
                            <li >
                                <button
                                    className={styles.menu_button}
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
                                    }/>
                                </button>
                            </li>
                            }
                            <li >
                                <button
                                    className={styles.menu_button}
                                    onClick={
                                        this.props.publicationHasMediaOverlays ?
                                        this.props.handleMediaOverlaysNext :
                                        this.props.handleTTSNext
                                    }
                                >
                                    <SVG svg={SkipNext} title={
                                    this.props.publicationHasMediaOverlays ?
                                    __("reader.media-overlays.next") :
                                    __("reader.tts.next")
                                    }/>
                                </button>
                            </li>
                            <li className={styles.ttsSelectRate}>
                                <select title={
                                    this.props.publicationHasMediaOverlays ?
                                    __("reader.media-overlays.speed") :
                                    __("reader.tts.speed")
                                    }
                                    onChange={(ev) => {
                                        if (this.props.publicationHasMediaOverlays) {
                                            this.props.handleMediaOverlaysPlaybackRate(ev.target.value.toString());
                                        } else {
                                            this.props.handleTTSPlaybackRate(ev.target.value.toString());
                                        }
                                    }}
                                    value={
                                        this.props.publicationHasMediaOverlays ?
                                        this.props.mediaOverlaysPlaybackRate :
                                        this.props.ttsPlaybackRate
                                    }
                                    >
                                    <option value="2">2x</option>
                                    <option value="1.75">1.75x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="1.25">1.25x</option>
                                    <option value="1">1x</option>
                                    <option value="0.75">0.75x</option>
                                    <option value="0.5">0.5x</option>
                                </select>
                            </li>
                            </>
                            }
                        </ul>

                        <ul className={styles.menu_option}>
                            <li
                                {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <input
                                    id="bookmarkButton"
                                    className={styles.bookmarkButton}
                                    type="checkbox"
                                    checked={this.props.isOnBookmark}
                                    onChange={this.props.toggleBookmark}
                                    aria-label={ __("reader.navigation.bookmarkTitle")}
                                />
                                <label
                                    htmlFor="bookmarkButton"
                                    className={styles.menu_button}
                                >
                                    <SVG svg={MarkIcon} title={ __("reader.navigation.bookmarkTitle")}/>
                                </label>
                            </li>
                            <li
                            {...(this.props.settingsOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <button
                                    aria-pressed={this.props.settingsOpen}
                                    className={styles.menu_button}
                                    onClick={this.props.handleSettingsClick.bind(this)}
                                    ref={this.settingsMenuButtonRef}
                                >
                                    <SVG svg={SettingsIcon} title={ __("reader.navigation.settingsTitle")}/>
                                </button>
                                <ReaderOptions {...this.props.readerOptionsProps}
                                    focusSettingMenuButton={this.focusSettingMenuButton}/>
                            </li>
                            <li
                            {...(this.props.menuOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <button
                                    aria-pressed={this.props.menuOpen}
                                    className={styles.menu_button}
                                    onClick={this.props.handleMenuClick.bind(this)}
                                    ref={this.navigationMenuButtonRef}
                                >
                                <SVG svg={TOCIcon} title={ __("reader.navigation.openTableOfContentsTitle")}/>
                            </button>
                            <ReaderMenu {...this.props.readerMenuProps}
                                currentLocation={this.props.currentLocation}
                                focusNaviguationMenu={this.focusNaviguationMenuButton}/>
                            </li>

                            { this.props.fullscreen ?
                            <li>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.disableFullscreenRef}
                                >
                                    <SVG svg={QuitFullscreenIcon}
                                        title={ __("reader.navigation.quitFullscreenTitle")}/>
                                </button>
                            </li>
                            :
                            <li  className={styles.blue}>
                                <button
                                    className={styles.menu_button}
                                    onClick={this.props.handleFullscreenClick}
                                    ref={this.enableFullscreenRef}
                                    aria-pressed={this.props.fullscreen}
                                >
                                <SVG svg={FullscreenIcon} title={ __("reader.navigation.fullscreenTitle")}/>
                                </button>
                            </li>
                            }
                        </ul>
                        {/*<li className={styles.right}>
                            <button
                                className={styles.menu_button}
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
