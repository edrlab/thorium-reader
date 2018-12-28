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

import * as BackIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
import * as AudioIcon from "readium-desktop/renderer/assets/icons/baseline-volume_up-24px.svg";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/font-size.svg";
import * as TOCIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as MarkIcon from "readium-desktop/renderer/assets/icons/outline-bookmark_border-24px.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as FullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-crop_free-24px.svg";
import * as QuitFullscreenIcon from "readium-desktop/renderer/assets/icons/sharp-uncrop_free-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    menuOpen: boolean;
    settingsOpen: boolean;
    handleMenuClick: () => void;
    handleSettingsClick: () => void;
    fullscreen: boolean;
    handleFullscreenClick: () => void;
    toggleBookmark: any;
    isOnBookmark: boolean;
}

export default class ReaderHeader extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <nav
                className={styles.main_navigation}
                role="navigation"
                aria-label="Menu principal"
                {...(this.props.fullscreen && {style: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                }})}
            >
                <ul>
                    { !this.props.fullscreen ? <>
                        <li>
                            <button
                                className={styles.menu_button}
                            >
                                <SVG svg={BackIcon} title="Retour à la bibliotheque"/>
                            </button>
                        </li>
                        <li>
                            <button
                                className={styles.menu_button}
                            >
                                <SVG svg={InfosIcon} title="Informations"/>
                            </button>
                        </li>
                        <li>
                            <button
                                className={styles.menu_button}
                            >
                                <SVG svg={DetachIcon} title="Détacher la fenêtre"/>
                            </button>
                        </li>
                        <li  className={styles.right + " " + styles.blue}>
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleFullscreenClick}
                            >
                                <SVG svg={FullscreenIcon} title="Mode plein écran"/>
                            </button>
                        </li>
                        <li
                            className={styles.right}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.toggleBookmark}
                                {...(this.props.isOnBookmark && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                            >
                                <SVG svg={MarkIcon} title="Marquer la page"/>
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
                                <SVG svg={TOCIcon} title="Ouvrir table des matieres"/>
                            </button>
                        </li>
                        <li
                            className={styles.right}
                            {...(this.props.settingsOpen && {style: {backgroundColor: "rgb(193, 193, 193)"}})}
                        >
                            <button
                                className={styles.menu_button}
                                onClick={this.props.handleSettingsClick.bind(this)}
                            >
                                <SVG svg={SettingsIcon} title="Settings"/>
                            </button>
                        </li>
                        <li className={styles.right}>
                            <button
                                className={styles.menu_button}
                            >
                                <SVG svg={AudioIcon} title="Lancer la lecture du livre"/>
                            </button>
                        </li>
                    </> :
                    <li  className={styles.right}>
                        <button
                            className={styles.menu_button}
                            onClick={this.props.handleFullscreenClick}
                        >
                            <SVG svg={QuitFullscreenIcon} title="Quitter le mode plein écran"/>
                        </button>
                    </li>
                }
                </ul>
            </nav>
        );
    }
}
