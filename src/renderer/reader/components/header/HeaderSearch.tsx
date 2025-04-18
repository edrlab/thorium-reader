// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";

import * as React from "react";
// import * as Popover from "@radix-ui/react-popover";
import { connect } from "react-redux";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionSearch } from "../../redux/actions";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import SearchPicker from "../picker/Search";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    shortcutEnable: boolean;
    showSearchResults: () => void;
    isPdf: boolean;
    isAudiobook: boolean;
    isDivina: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>,
    ReturnType<typeof mapDispatchToProps> {
}

class HeaderSearch extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);

        this.enableSearch = this.enableSearch.bind(this);
    }

    // public componentDidMount() {
    //     ensureKeyboardListenerIsInstalled();
    //     this.registerAllKeyboardListeners();
    // }

    // public componentWillUnmount() {
    //     this.unregisterAllKeyboardListeners();
    // }

    // public async componentDidUpdate(oldProps: IProps) {
    //     if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
    //         this.unregisterAllKeyboardListeners();
    //         this.registerAllKeyboardListeners();
    //     }
    // }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        if (!this.props.isOnSearch) {

            this.registerAllKeyboardListeners();
        }
    }

    public componentWillUnmount() {

        if (!this.props.isOnSearch) {

            this.unregisterAllKeyboardListeners();
        }
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (oldProps.isOnSearch !== this.props.isOnSearch && this.props.isOnSearch) {
            this.unregisterAllKeyboardListeners();
        } else if (oldProps.isOnSearch !== this.props.isOnSearch && this.props.isOnSearch === false) {
            this.registerAllKeyboardListeners();
        }

        // keyboard binding refresh
        if (
            !keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)
            && !this.props.isOnSearch
        ) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render() {
        const { __ } = this.props;
        return (
            <>
                <button
                    disabled={this.props.isAudiobook || this.props.isDivina}
                    aria-pressed={this.props.isOnSearch}
                    aria-label={__("reader.navigation.magnifyingGlassButton")}
                    className={stylesReader.menu_button}
                    onClick={() => { this.enableSearch(!this.props.isOnSearch); }}
                    // ref={this.settingsMenuButtonRef}
                    title={__("reader.navigation.magnifyingGlassButton")}
                    id="search-button-trigger"
                >
                    <SVG ariaHidden={true} svg={this.props.isOnSearch ? QuitIcon : magnifyingGlass} className={this.props.isOnSearch ? stylesReaderHeader.active_svg : ""} />
                </button>

                {
                    this.props.isOnSearch ?
                        <div className={stylesReaderHeader.picker_container}
                            onKeyDown={this.props.isOnSearch ? (e) => {
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    this.enableSearch(false);
                                    setTimeout(() => {
                                        const el = document.getElementById("search-button-trigger");
                                        el?.blur();
                                        el?.focus();
                                    }, 100);
                                }
                            } : undefined}
                        >
                            <div style={{ display: "flex", gap: "10%", alignItems: "center", height: "50px", width: "100vw", justifyContent: "end" }}>
                                <SearchPicker
                                    showSearchResults={this.props.showSearchResults}
                                    isPdf={this.props.isPdf}
                                />
                            </div>
                        </div>
                        : <></>
                }
            </>
        );
    }

    private registerAllKeyboardListeners = () => {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusSearch,
            this.enableSearch,
        );
    };

    private unregisterAllKeyboardListeners = () => {
        unregisterKeyboardListener(this.enableSearch);
    };

    private enableSearch = (v?: boolean) => {

        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (enableSearch)");
            }
            return;
        }
        this.props.enableSearch(v || !this.props.isOnSearch);
    };

}

const mapStateToProps = (state: IReaderRootState) => ({
    keyboardShortcuts: state.keyboard.shortcuts,
    isOnSearch: state.search.enable,
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    enableSearch: (enable: boolean) => {
        if (enable) {
            dispatch(readerLocalActionSearch.enable.build());
        } else {
            dispatch(readerLocalActionSearch.cancel.build());
        }
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(HeaderSearch));
