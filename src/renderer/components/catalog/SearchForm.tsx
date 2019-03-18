// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { RouteComponentProps, withRouter } from "react-router-dom";
import { lazyInject } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

export class Search extends React.Component<RouteComponentProps, undefined> {
    private inputRef: any;

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: any) {
        super(props);

        this.inputRef = React.createRef();

        this.search = this.search.bind(this);
    }
    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        return (
            <form onSubmit={this.search} role="search">
                <input
                    ref={this.inputRef}
                    type="search"
                    id="menu_search"
                    aria-label="Rechercher un livre, un tag, ou un type de littérature"
                    placeholder={__("catalog.searchPlaceholder")}
                />
                <button>
                    <SVG svg={SearchIcon} title="Lancer la recherche"/>
                </button>
            </form>
        );
    }

    public search(e: any) {
        e.preventDefault();
        const value = this.inputRef.current.value;

        this.props.history.push("/library/search/text/" + value);
    }
}

export default withRouter(Search);
