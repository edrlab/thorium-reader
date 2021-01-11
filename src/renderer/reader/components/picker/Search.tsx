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
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { TDispatch } from "readium-desktop/typings/redux";

import { readerLocalActionSearch } from "../../redux/actions";
import LoaderSearch from "./LoaderSearch";
import SearchFormPicker from "./SearchFormPicker";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    showSearchResults: () => void;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable: no-empty-interface
// tslint:disable: max-line-length
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>,
    ReturnType<typeof mapDispatchToProps>,
    TranslatorProps {
}

// tslint:disable-next-line: no-empty-interface
interface IState {
}

class SearchPicker extends React.Component<IProps, IState> {

    private loadSeq: number;

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
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

    public render() {

        const { load, notFound, next, previous, __ } = this.props;

        const found = this.props.foundNumber === 0 ?
            __("reader.picker.search.notFound") :
            __("reader.picker.search.founds", {nResults: this.props.foundNumber});

        this.loadSeq = (this.loadSeq || 0) + 1;

        return (
            <div style={{
                // margin: "10px",
                display: "flex",
                // flexDirection: "row",
                // width: "300px",

                // paddingBlock: "20px",
            }}>
                <SearchFormPicker></SearchFormPicker>
                <button
                    disabled={notFound}
                    onClick={previous}
                    aria-label={__("reader.picker.search.previous")}
                    title={__("opds.previous")}
                    style={{
                        width: "30px",
                        padding: "4px",
                        margin: 0,
                        color: notFound ? "grey" : "black",
                        fill: notFound ? "grey" : "black",
                    }}
                >
                    <SVG svg={ArrowLeftIcon} />
                </button>
                <button
                    disabled={notFound}
                    onClick={next}
                    aria-label={__("reader.picker.search.next")}
                    title={__("opds.next")}
                    style={{
                        width: "30px",
                        padding: "4px",
                        margin: 0,
                        color: notFound ? "grey" : "black",
                        fill: notFound ? "grey" : "black",
                    }}
                >
                    <SVG svg={ArrowRightIcon} />
                </button>
                {
                    load &&
                    <LoaderSearch></LoaderSearch>
                }
                {
                (this.loadSeq > 2 && found) &&
                (
                <button
                    disabled={notFound}
                    onClick={() => {
                        this.props.showSearchResults();
                    }}
                    aria-label={found}
                    title={found}
                    style={{
                        width: "auto",
                        padding: "4px",
                        margin: 0,
                        fontSize: "1em",
                        color: notFound ? "grey" : "black",
                        fill: notFound ? "grey" : "black",
                    }}
                >
                    <span aria-live="polite">
                        {found}
                    </span>
                </button>
                )
                }
            </div>
        );

    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.SearchPrevious,
            this.onKeyboardSearchPrevious,
        );
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.SearchNext,
            this.onKeyboardSearchNext,
        );
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardSearchPrevious);
        unregisterKeyboardListener(this.onKeyboardSearchNext);
    }

    private onKeyboardSearchPrevious = () => {
        this.props.previous();
    }
    private onKeyboardSearchNext = () => {
        this.props.next();
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    return {
        keyboardShortcuts: state.keyboard.shortcuts,
        picker: state.picker,
        load: state.search.state === "busy",
        notFound: !state.search.foundArray?.length,
        foundNumber: state.search.foundArray?.length || 0,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => ({
    next: () => {
        dispatch(readerLocalActionSearch.next.build());
    },
    previous: () => {
        dispatch(readerLocalActionSearch.previous.build());
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchPicker));
