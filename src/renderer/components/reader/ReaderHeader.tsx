// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { TTSStateEnum } from "@r2-navigator-js/electron/renderer/index";

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

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as readerActions from "readium-desktop/common/redux/actions/reader";
import { PublicationView } from "readium-desktop/common/views/publication";

import { withApi } from "../utils/api";

import { Publication } from "readium-desktop/common/models/publication";

import * as qs from "query-string";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import ReaderMenu from "./ReaderMenu";
import ReaderOptions from "./ReaderOptions";

interface Props extends TranslatorProps {
    menuOpen: boolean;
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
    toggleBookmark: any;
    isOnBookmark: boolean;
    displayPublicationInfo?: any;
    publication?: Publication;
    readerMenuProps: any;
    readerOptionsProps: any;
}

export class ReaderHeader extends React.Component<Props, undefined> {
    private enableFullscreenRef: any;
    private disableFullscreenRef: any;

    public constructor(props: Props) {
        super(props);

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public componentDidUpdate(oldProps: Props) {
        if (this.props.fullscreen !== oldProps.fullscreen) {
            if (this.props.fullscreen) {
                this.disableFullscreenRef.focus();
            } else {
                this.enableFullscreenRef.focus();
            }
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
                                onClick={() => this.displayPublicationInfo()}
                            >
                                <SVG svg={InfosIcon} title={ __("reader.navigation.infoTitle")}/>
                            </button>
                        </li>
                        <li  className={styles.right + " " + styles.blue}>
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleFullscreenClick}
                                ref={(ref) => this.enableFullscreenRef = ref}
                            >
                                <SVG svg={FullscreenIcon} title={ __("reader.navigation.fullscreenTitle")}/>
                            </button>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.menuOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleMenuClick.bind(this)}
                            >
                                <SVG svg={TOCIcon} title={ __("reader.navigation.openTableOfContentsTitle")}/>
                            </button>
                            <ReaderMenu {...this.props.readerMenuProps}/>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.settingsOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleSettingsClick.bind(this)}
                            >
                                <SVG svg={SettingsIcon} title={ __("reader.navigation.settingsTitle")}/>
                            </button>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.toggleBookmark}
                                {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <SVG svg={MarkIcon} title={ __("reader.navigation.bookmarkTitle")}/>
                            </button>
                            <ReaderOptions {...this.props.readerOptionsProps}/>
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
                            ref={(ref) => this.disableFullscreenRef = ref}
                        >
                            <SVG svg={QuitFullscreenIcon} title={ __("reader.navigation.quitFullscreenTitle")}/>
                        </button>
                    </li>
                }
                </ul>
            </nav>
        );
    }

    private displayPublicationInfo() {
        if (this.props.publication) {
            this.props.displayPublicationInfo(this.props.publication);
        }
    }
}

const mapDispatchToProps = (dispatch: any, props: Props) => {
    return {
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfoReader,
                {
                    publication,
                },
            ));
        },
    };
};

const buildRequestData = (props: Props) => {
    const parsedResult = qs.parse(document.location.href);
    return {
        identifier: parsedResult.pubId,
    };
};

export default withTranslator(withApi(
    ReaderHeader,
    {
        mapDispatchToProps,
        operations: [
            {
                moduleId: "publication",
                methodId: "get",
                buildRequestData,
                resultProp: "publication",
                onLoad: true,
            },
        ],
    },
));
