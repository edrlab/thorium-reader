// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
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
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

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
    handleReaderClose: () => void;
    handleReaderDetach: () => void;
    toggleBookmark: any;
    isOnBookmark: boolean;
    displayPublicationInfo: any;
    readerMenuProps: {
        open: boolean,
        r2Publication: R2Publication,
        handleLinkClick: (event: any, url: string) => void;
        handleBookmarkClick: (locator: any) => void;
        toggleMenu: () => void;
    };
    readerOptionsProps: {
        open: boolean,
        // tslint:disable-next-line: max-line-length
        indexes: {fontSize: number, pageMargins: number, wordSpacing: number, letterSpacing: number, lineHeight: number};
        settings: ReaderConfig,
        handleSettingChange: (event: any, name: string, value?: any) => void;
        handleIndexChange: (event: any, name: string, value?: any) => void;
        setSettings: (settings: ReaderConfig) => void;
        toggleMenu: () => void;
    };
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export class ReaderHeader extends React.Component<IProps, undefined> {
    private enableFullscreenRef = React.createRef<HTMLButtonElement>();
    private disableFullscreenRef = React.createRef<HTMLButtonElement>();
    private settingsMenuButtonRef = React.createRef<HTMLButtonElement>();
    private navigationMenuButtonRef = React.createRef<HTMLButtonElement>();
    private infoMenuButtonRef = React.createRef<HTMLButtonElement>();

    constructor(props: IProps) {
        super(props);

        this.focusSettingMenuButton = this.focusSettingMenuButton.bind(this);
        this.focusNaviguationMenuButton = this.focusNaviguationMenuButton.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.fullscreen !== oldProps.fullscreen) {
            if (this.props.fullscreen && this.disableFullscreenRef.current) {
                this.disableFullscreenRef.current.focus();
            } else if (!this.props.fullscreen && this.enableFullscreenRef.current) {
                this.enableFullscreenRef.current.focus();
            }
        }

        if (this.props.infoOpen !== oldProps.infoOpen &&
            this.props.infoOpen === false) {
                this.infoMenuButtonRef.current.focus();
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
        const button = ReactDOM.findDOMNode(this.settingsMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }

    private focusNaviguationMenuButton() {
        const button = ReactDOM.findDOMNode(this.navigationMenuButtonRef.current) as HTMLButtonElement;

        button.focus();
    }
}

export default withTranslator(ReaderHeader);
