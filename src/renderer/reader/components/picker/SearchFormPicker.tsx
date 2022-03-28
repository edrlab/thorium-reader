// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { IEventBusPdfPlayer } from "../../pdf/common/pdfReader.type";

import { readerLocalActionSearch } from "../../redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    pdfEventBus: IEventBusPdfPlayer;
    isPdf: boolean;
    reset: () => void;
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

interface IState {
    inputValue: string;
}

class SearchFormPicker extends React.Component<IProps, IState> {

    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        // this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        this.inputRef = React.createRef<HTMLInputElement>();
        this.search = this.search.bind(this);

        this.state = {
            inputValue: "",
        };
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        // focus on input
        this.inputRef?.current?.focus();
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <form onSubmit={this.search} role="search">
                <input
                    ref={this.inputRef}
                    type="search"
                    id="menu_search"
                    aria-label={__("reader.navigation.magnifyingGlassButton")}
                    placeholder={__("reader.picker.search.input")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({inputValue: e.target.value})}
                    style={{
                        fontSize: "1em",
                        verticalAlign: "text-bottom",
                    }}
                />

                <button
                    disabled={!this.state.inputValue}
                    style={{
                        width: "30px",
                        padding: "4px",
                        marginLeft: "0.4em",
                        color: this.state.inputValue ? "black" : "grey",
                        fill: this.state.inputValue ? "black" : "grey" }}
                    title={__("reader.picker.search.submit")}
                >

                    <SVG ariaHidden={true} svg={magnifyingGlass} />
                </button>
            </form>
        );
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusSearch,
            this.onKeyboardFocusSearch,
        );
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFocusSearch);
    }

    private onKeyboardFocusSearch = () => {
        if (!this.inputRef?.current) {
            return;
        }
        this.inputRef.current.focus();
        // this.inputRef.current.select();
        this.inputRef.current.setSelectionRange(0, this.inputRef.current.value.length);
    };

    private search(e: TFormEvent) {
        e.preventDefault();

        this.props.reset();

        this.props.searchRequest(this.state.inputValue);
    }
}

const mapStateToProps = (state: IReaderRootState) => ({
    keyboardShortcuts: state.keyboard.shortcuts,
    textSearch: state.search.textSearch,
});

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => ({
    searchRequest: (text: string) => {
        if (props.isPdf) {
            props.pdfEventBus?.dispatch("search", text);
        } else {
            dispatch(readerLocalActionSearch.request.build(text));
        }
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchFormPicker));
