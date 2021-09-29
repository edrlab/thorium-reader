// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionPicker, readerLocalActionSearch } from "../../redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    shortcutEnable: boolean;
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

class HeaderSearch extends React.Component<IProps, undefined> {

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
            <button
                aria-pressed={this.props.isOnSearch}
                aria-label={__("reader.navigation.magnifyingGlassButton")}
                className={styles.menu_button}
                onClick={this.enableSearch}
            // ref={this.settingsMenuButtonRef}
            >
                <SVG svg={magnifyingGlass} title={__("reader.navigation.magnifyingGlassButton")} />
            </button>
        );
    }

    private registerAllKeyboardListeners = () => {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusSearch,
            this.enableSearch,
        );
    }

    private unregisterAllKeyboardListeners = () => {
        unregisterKeyboardListener(this.enableSearch);
    }

    private enableSearch = () => {

        if (!this.props.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (enableSearch)");
            }
            return;
        }
        this.props.enableSearch(!this.props.isOnSearch);
    }

}

const mapStateToProps = (state: IReaderRootState) => ({
    keyboardShortcuts: state.keyboard.shortcuts,
    isOnSearch: state.search.enable,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    enableSearch: (enable: boolean) => {
        if (enable) {
            dispatch(readerLocalActionSearch.enable.build());
            dispatch(readerLocalActionPicker.manager.build(true, "search"));
        } else {
            dispatch(readerLocalActionSearch.cancel.build());
            dispatch(readerLocalActionPicker.manager.build(false));
        }
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(HeaderSearch));
