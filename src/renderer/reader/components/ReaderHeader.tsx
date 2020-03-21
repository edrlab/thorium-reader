// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { TTSStateEnum } from "@r2-navigator-js/electron/renderer/index";

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
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-crop_free-24px.svg";
import * as QuitFullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-uncrop_free-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer/index";

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
    handleAudioClick: () => void;
    handlePauseClick: () => void;
    handleStopClick: () => void;
    handleSkipPreviousClick: () => void;
    handleSkipNextClick: () => void;
    handlePlayClick: () => void;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
    fullscreen: boolean;
    handleFullscreenClick: () => void;
    ttsState: TTSStateEnum;
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

        return (
            <nav
                className={styles.main_navigation}
                role="navigation"
                aria-label={ __("accessibility.homeMenu")}
                {...(this.props.fullscreen && {style: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                }})}
            >
                <ul>
                    { !this.props.fullscreen ? <>
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
                            <li  className={styles.blue}>
                                <button
                                className={styles.menu_button}
                                onClick={this.props.handleFullscreenClick}
                                ref={this.enableFullscreenRef}
                                >
                                <SVG svg={FullscreenIcon} title={ __("reader.navigation.fullscreenTitle")}/>
                                </button>
                            </li>
                            { this.props.ttsState !== TTSStateEnum.STOPPED ? <>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handleSkipNextClick.bind(this)}
                                    >
                                        <SVG svg={SkipNext} title="Passer au precedent"/>
                                    </button>
                                </li>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handleStopClick.bind(this)}
                                    >
                                        <SVG svg={StopIcon} title="Arrete la lecture du livre"/>
                                    </button>
                                </li>
                                { this.props.ttsState === TTSStateEnum.PLAYING  ?
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handlePauseClick.bind(this)}
                                    >
                                        <SVG svg={PauseIcon} title="Arrete la lecture du livre"/>
                                    </button>
                                </li>
                                :
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handlePlayClick.bind(this)}
                                    >
                                        <SVG svg={PlayIcon} title="Commence la lecture du livre"/>
                                    </button>
                                </li>
                                }
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handleSkipPreviousClick.bind(this)}
                                    >
                                        <SVG svg={SkipPrevious} title="Passer au precedent"/>
                                    </button>
                                </li>
                                </> :
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.props.handleAudioClick.bind(this)}
                                    >
                                        <SVG svg={AudioIcon} title="Lancer la lecture du livre"/>
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
                        </li>*/}
                    </> :
                    <li  className={styles.right}>
                        <button
                            className={styles.menu_button}
                            onClick={this.props.handleFullscreenClick}
                            ref={this.disableFullscreenRef}
                        >
                            <SVG svg={QuitFullscreenIcon} title={ __("reader.navigation.quitFullscreenTitle")}/>
                        </button>
                    </li>
                }
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
