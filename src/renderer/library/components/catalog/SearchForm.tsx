// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
// import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
// import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { dispatchHistoryPush, IRouterLocationState } from "readium-desktop/renderer/library/routing";
// import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
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

class SearchForm extends React.Component<IProps, undefined> {

    // private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        // this.inputRef = React.createRef<HTMLInputElement>();
        // this.search = this.search.bind(this);
    }

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

    public render(): React.ReactElement<{}> {
        return <></>;
        // const { __ } = this.props;
        // return (
        //     <form onSubmit={this.search} role="search">
        //         <input
        //             ref={this.inputRef}
        //             type="search"
        //             id="menu_search"
        //             aria-label={__("accessibility.searchBook")}
        //             placeholder={__("header.searchPlaceholder")}
        //         />
        //         <button>
        //             <SVG svg={SearchIcon} title={__("header.searchTitle")} />
        //         </button>
        //     </form>
        // );
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusSearch,
            this.onKeyboardFocusSearch);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFocusSearch);
    }

    private onKeyboardFocusSearch = () => {

        this.props.historyPush({
            ...this.props.location,
            pathname: "/library/search/all",
        }, this.props.location.state as IRouterLocationState);

        // if (!this.inputRef?.current) {
        //     return;
        // }
        // this.inputRef.current.focus();
        // // this.inputRef.current.select();
        // this.inputRef.current.setSelectionRange(0, this.inputRef.current.value.length);
    };

    // private search(e: TFormEvent) {
    //     e.preventDefault();

    //     const value = this.inputRef?.current?.value;

    //     const { historyPush } = this.props;

    //     if (!value) {
    //         historyPush({
    //             ...this.props.location,
    //             pathname: "/library/search/all",
    //         }, this.props.location.state as IRouterLocationState);
    //     } else {
    //         const target = "/library/search/text/" + value; // + this.props.location.search;
    //         historyPush({
    //             ...this.props.location,
    //             pathname: target,
    //         }, this.props.location.state as IRouterLocationState);
    //     }
    // }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    keyboardShortcuts: state.keyboard.shortcuts,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchForm));
