// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router-dom";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { SEARCH_TERM } from "readium-desktop/renderer/library/redux/sagas/opds";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { dispatchHistoryPush, IOpdsBrowse, routes } from "readium-desktop/renderer/library/routing";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>,
    ReturnType<typeof mapDispatchToProps> {
}

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:opds");

class SearchForm extends React.Component<IProps, undefined> {
    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        this.inputRef = React.createRef<HTMLInputElement>();
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
        const { __ } = this.props;

        return (
            <form
                onSubmit={this.submitSearch}
                role="search"
            >
                <input
                    disabled={!this.props.search?.url}
                    ref={this.inputRef}
                    type="search"
                    id="menu_search"
                    aria-label={__("header.searchPlaceholder")}
                    placeholder={__("header.searchPlaceholder")}
                />
                <button
                    disabled={!this.props.search?.url}
                >
                    <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                </button>
            </form>
        );
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
        if (!this.inputRef?.current) {
            return;
        }
        this.inputRef.current.focus();
        // this.inputRef.current.select();
        this.inputRef.current.setSelectionRange(0, this.inputRef.current.value.length);
    };
    private submitSearch = (e: TFormEvent) => {
        e.preventDefault();
        if (!this.inputRef?.current || !this.props.search?.url) {
            return;
        }
        const searchWords = this.inputRef.current.value;
        const url = this.props.search.url.replace(SEARCH_TERM, encodeURIComponent_RFC3986(searchWords));
        debug("SubmitSearch 1", searchWords, url, this.props.search.url);

        if (searchWords && url) {
            debug("SubmitSearch 2", searchWords, url);

            const level = this.props.search.level
            || parseInt(
                matchPath<IOpdsBrowse>(
                    this.props.location.pathname, routes["/opds/browse"],
                ).params.level,
                10);

            this.props.historyPush({
                ...this.props.location,
                pathname: this.route(searchWords, url, level),
            });
        }
    };

    private route = (title: string, url: string, level: number) =>
        buildOpdsBrowserRoute(
            matchPath<IOpdsBrowse>(
                this.props.location.pathname, routes["/opds/browse"],
            ).params.opdsId,
            title,
            url,
            level,
        );
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    search: state.opds.browser.search,
    location: state.router.location,
    keyboardShortcuts: state.keyboard.shortcuts,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchForm));
