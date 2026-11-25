// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router-dom";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { buildOpdsBrowserRoute, parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { SEARCH_TERM } from "readium-desktop/renderer/library/redux/sagas/opds";
import { dispatchHistoryPush, IOpdsBrowse, IRouterLocationState, routes } from "readium-desktop/renderer/library/routing";
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
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>,
    ReturnType<typeof mapDispatchToProps> {
}

// Logger
const debug = debug_("readium-desktop:renderer:redux:saga:opds");

interface IState {
    // Only meaningful in narrow layouts, where the field is collapsed
    // behind a toggle button (see .catalog_search_toggle in catalogs.scss).
    open: boolean;
}

class SearchForm extends React.Component<IProps, IState> {
    private inputRef: React.RefObject<HTMLInputElement>;
    private toggleRef: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);

        this.state = { open: false };
        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        this.inputRef = React.createRef<HTMLInputElement>();
        this.toggleRef = React.createRef<HTMLButtonElement>();
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
        this.restoreSearchTerm();
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();
    }

    public componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
        // The search link state is reset on every OPDS navigation (see
        // browseWatcher in sagas/opds.ts), which unmounts the <input> until the
        // new feed's search link is resolved: re-sync the field when it is
        // recreated, and whenever the history entry changes.
        if (oldProps.location !== this.props.location
            || (!oldProps.search?.url && this.props.search?.url)) {
            this.restoreSearchTerm();
        }
    }

    private restoreSearchTerm() {
        const input = this.inputRef.current;
        if (!input) {
            return;
        }
        // Stored in the history entry by submitSearch(), so back/forward
        // and results pagination restore the matching term. The state is
        // forwarded as-is by other navigations: only trust it on a results
        // page, whose route title is the search term itself (see route()).
        const storedTerm = (this.props.location?.state as IRouterLocationState | undefined)?.opdsSearchTerm;
        const routeTitle = parseOpdsBrowserRoute(this.props.location?.pathname || "")?.title;
        const term = storedTerm && storedTerm === routeTitle ? storedTerm : "";
        input.value = term;
        if (term && !this.state.open) {
            // Narrow layouts: show the query the results come from.
            this.setState({ open: true });
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const { open } = this.state;

        if (!this.props.search?.url) {
            return <></>;
        }

        // Fragment: the toggle and the form are direct flex items of the
        // catalog header, so the form can wrap onto its own row when narrow.
        return (
            <>
                <button
                    ref={this.toggleRef}
                    type="button"
                    className={stylesCatalogs.catalog_search_toggle}
                    aria-expanded={open}
                    aria-controls="opdsSearchForm"
                    title={__("header.searchPlaceholder")}
                    onClick={this.onToggle}
                >
                    <SVG ariaHidden svg={SearchIcon} />
                    <span className={stylesCatalogs.catalog_search_srOnly}>{__("header.searchPlaceholder")}</span>
                </button>
                <form
                    id="opdsSearchForm"
                    className={stylesCatalogs.catalog_search}
                    data-open={open}
                    onSubmit={this.submitSearch}
                    role="search"
                >
                    <label
                        className={stylesCatalogs.catalog_search_srOnly}
                        htmlFor="opdsSearchInput">
                        {__("header.searchPlaceholder")}
                    </label>
                    <div className={stylesInput.form_group}>
                        <i><SVG ariaHidden svg={SearchIcon} /></i>
                        <input
                            ref={this.inputRef}
                            type="search"
                            id="opdsSearchInput"
                            placeholder={__("header.searchPlaceholder")}
                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                            onKeyDown={this.onInputKeyDown}
                        />
                    </div>
                </form>
            </>
        );
    }

    // The toggle is display:none in wide layouts.
    private isCollapsible = () => !!this.toggleRef.current?.offsetParent;

    private openAndFocus = () => {
        this.setState({ open: true }, () => {
            const input = this.inputRef.current;
            if (!input) {
                return;
            }
            input.focus();
            input.setSelectionRange(0, input.value.length);
        });
    };

    private onToggle = () => {
        if (this.state.open) {
            this.setState({ open: false });
        } else {
            this.openAndFocus();
        }
    };

    private onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // First Escape clears the text (native type="search" behaviour),
        // a second Escape on the empty field collapses it.
        if (e.key !== "Escape" || e.currentTarget.value || !this.isCollapsible()) {
            return;
        }
        e.preventDefault();
        this.setState({ open: false }, () => this.toggleRef.current?.focus());
    };

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
        // Also opens the field when it is collapsed behind the toggle.
        this.openAndFocus();
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
                    matchPath<keyof IOpdsBrowse, string>(
                        routes["/opds/browse"].path,
                        this.props.location.pathname,
                    ).params.level,
                    10);

            this.props.historyPush({
                ...this.props.location,
                pathname: this.route(searchWords, url, level),
            }, {
                ...(this.props.location.state as IRouterLocationState),
                opdsSearchTerm: searchWords,
            });
        }
    };

    private route = (title: string, url: string, level: number) =>
        buildOpdsBrowserRoute(
            matchPath<keyof IOpdsBrowse, string>(
                routes["/opds/browse"].path,
                this.props.location.pathname,
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
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchForm));
