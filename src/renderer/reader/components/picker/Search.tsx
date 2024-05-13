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
import SearchFormPicker from "./SearchFormPicker";
import * as stylesReaderHeader from "readium-desktop/renderer/assets/styles/components/readerHeader.scss";

import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    showSearchResults: () => void;
    isPdf: boolean;
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    foundNumber: number;
    notFound: boolean;
    load: boolean;
}

class SearchPicker extends React.Component<IProps, IState> {

    private loadSeq: number;

    constructor(props: any) {
        super(props);

        this.state = {
            foundNumber: 0,
            notFound: false,
            load: false,
        };
    }

    public componentDidMount() {

        createOrGetPdfEventBus().subscribe("search-found", this.setFoundNumber);

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
    }

    public componentDidUpdate(oldProps: IProps) {


        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public componentWillUnmount() {

        createOrGetPdfEventBus().remove(this.setFoundNumber, "search-found");

        this.unregisterAllKeyboardListeners();
    }

    public render() {

        const { next, previous, __ } = this.props;

        const { notFound, foundNumber, load } = this.props.isPdf
            ? this.state
            : this.props;

        const found = foundNumber === 0 ?
            __("reader.picker.search.notFound") :
            __("reader.picker.search.founds", {nResults: foundNumber});

        this.loadSeq = this.props.isPdf ? 999 : (this.loadSeq || 0) + 1;

        return (
            <div
                className={stylesReaderHeader.searchHeader_container}>
                <SearchFormPicker
                    isPdf={this.props.isPdf}
                    reset={() => this.setState({ foundNumber: 0, notFound: true })}
                    load={load}
                ></SearchFormPicker>

                {
                    (this.loadSeq > 2 && found) &&
                    (
                        <div className={stylesReaderHeader.searchActions}>
                            <span style={{ width: "1px", height: "30px", backgroundColor: "var(--color-verylight-grey)", margin: "auto 10px auto 20px" }}></span>
                            <button
                                disabled={notFound}
                                onClick={() => {
                                    if (!this.props.isPdf) {
                                        this.props.showSearchResults();
                                    }
                                }}
                                aria-label={found}
                                title={found}
                                 style={{
                                    width: "auto",
                                //     padding: "4px",
                                //     margin: "0",
                                    fontSize: "1em",
                                //     // color: notFound ? "grey" : "black",
                                //     fill: notFound ? "grey" : "black",
                                //     background: "var(--color-light-blue)",
                                //     border: "1px solid var(--color-blue)",
                                //     borderRadius: "6px",
                                //     color: "var(--color-blue)",
                                    textWrap: "nowrap",
                                 }}
                                className={stylesButtons.button_nav_primary}
                            >
                                <span aria-live="polite">
                                    {found}
                                </span>
                            </button>
                            <button
                                disabled={notFound}
                                onClick={previous}
                                aria-label={__("reader.picker.search.previous")}
                                title={__("opds.previous")}
                                style={{
                                    width: "30px",
                                    padding: "4px",
                                    margin: 0,
                                    color: notFound ? "grey" : "var(--color-blue)",
                                    fill: notFound ? "grey" : "var(--color-blue)",
                                }}
                            >
                                <SVG ariaHidden={true} svg={ArrowLeftIcon} />
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
                                    color: notFound ? "grey" : "var(--color-blue)",
                                    fill: notFound ? "grey" : "var(--color-blue)",
                                }}
                            >
                                <SVG ariaHidden={true} svg={ArrowRightIcon} />
                            </button>
                        </div>
                    )
                }
            </div>
        );

    }

    private setFoundNumber = (foundNumber: number) => {

        this.setState({foundNumber, notFound: !foundNumber});
    };

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
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.SearchPreviousAlt,
            this.onKeyboardSearchPrevious,
        );
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.SearchNextAlt,
            this.onKeyboardSearchNext,
        );
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardSearchPrevious);
        unregisterKeyboardListener(this.onKeyboardSearchNext);
    }

    private onKeyboardSearchPrevious = () => {
        this.props.previous();
    };
    private onKeyboardSearchNext = () => {
        this.props.next();
    };
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

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => ({
    next: () => {
        if (props.isPdf) {
            console.log("PDF");

            createOrGetPdfEventBus().dispatch("search-next");
        } else {
            dispatch(readerLocalActionSearch.next.build());
        }
    },
    previous: () => {
        if (props.isPdf) {
            createOrGetPdfEventBus().dispatch("search-previous");
        } else {
            dispatch(readerLocalActionSearch.previous.build());
        }
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchPicker));
