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
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as styles from "readium-desktop/renderer/assets/styles/header.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { SEARCH_TERM } from "readium-desktop/renderer/library/redux/sagas/opds";
import { RootState } from "readium-desktop/renderer/library/redux/states";
import { dispatchHistoryPush, IOpdsBrowse, routes } from "readium-desktop/renderer/library/routing";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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

        this.inputRef = React.createRef<HTMLInputElement>();
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
                    aria-label={__("accessibility.searchBook")}
                    placeholder={__("header.searchPlaceholder")}
                />
                <button
                    id={styles.search_img}
                    disabled={!this.props.search?.url}
                >
                    <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                </button>
            </form>
        );
    }

    private submitSearch = (e: TFormEvent) => {
        e.preventDefault();
        if (!this.inputRef?.current) {
            return;
        }
        const searchWords = this.inputRef.current.value;
        const url = this.props.search?.url.replace(SEARCH_TERM, encodeURI(searchWords));
        const level = this.props.search?.level
            || parseInt(
                matchPath<IOpdsBrowse>(
                    this.props.location.pathname, routes["/opds/browse"],
                ).params.level,
                10);

        if (searchWords && url) {
            debug("SubmitSearch", searchWords, url);

            this.props.historyPush({
                ...this.props.location,
                pathname: this.route(searchWords, url, level),
            });
        }
    }

    private route = (title: string, url: string, level: number) =>
        buildOpdsBrowserRoute(
            matchPath<IOpdsBrowse>(
                this.props.location.pathname, routes["/opds/browse"],
            ).params.opdsId,
            title,
            url,
            level,
        )
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    search: state.opds.browser.search,
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SearchForm));
