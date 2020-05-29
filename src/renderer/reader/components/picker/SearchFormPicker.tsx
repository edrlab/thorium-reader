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
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionSearch } from "../../redux/actions";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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
                    aria-label={__("accessibility.searchBook")}
                    placeholder={__("reader.picker.search.input")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({inputValue: e.target.value})}
                    style={{ fontSize: "2ex" }}
                />
                <button disabled={!this.state.inputValue} style={{ fontSize: "2ex" }}>
                    {
                        __("reader.picker.search.submit")
                    }
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
    }

    private search(e: TFormEvent) {
        e.preventDefault();

        this.props.searchRequest(this.state.inputValue);
    }
}

const mapStateToProps = (state: IReaderRootState) => ({
    keyboardShortcuts: state.keyboard.shortcuts,
    textSearch: state.search.textSearch,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    searchRequest: (text: string) => {
        dispatch(readerLocalActionSearch.request.build(text));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchFormPicker));
