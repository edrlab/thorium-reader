// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TFormEvent } from "readium-desktop/typings/react";
import { apiAction } from "../../apiAction";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    searchResultView: IApiappSearchResultView[];
    query: string;
}

class Apiapp extends React.Component<IProps, IState> {

    inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.inputRef = React.createRef<HTMLInputElement>();
        this.search = this.search.bind(this);
        this.login = this.login.bind(this);

        this.state = {
            searchResultView: [],
            query: "",
        };
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;

        const listItems = this.state.searchResultView.map((v, idx) => <li key={idx.toString()}><b><a onClick={() => this.login(v)}>{v.name}</a></b><p>{v.address}</p></li>);
        return (
            <LibraryLayout
                title={__("header.apiapp")}
            >
                <form onSubmit={this.search} role="search">
                    <input
                        ref={this.inputRef}
                        type="search"
                        id="apiapp_search"
                        aria-label={__("accessibility.searchBook")}
                        placeholder={__("header.searchPlaceholder")}
                    />
                    <button>
                        <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                    </button>
                    <ul>
                        {
                            listItems.length ? listItems : this.state.query ? __("apiapp.noLibraryFound", {name: this.state.query}) : <></>
                        }
                    </ul>
                </form>
            </LibraryLayout>
        );
    }

    private search(e: TFormEvent) {
        e.preventDefault();

        const value = this.inputRef?.current?.value;
        this.setState({ query: "" });

        if (value && typeof value === "string") {
            apiAction("apiapp/search", value)
                .then((searchResultView) => {
                    this.setState({ searchResultView });
                    this.setState({ query: value });
                })
                .catch((error) => console.error("Error to fetch api apiapp/search", error));

        }

    }

    private login(libView: IApiappSearchResultView) {
        apiAction("apiapp/login", libView)
            .catch((error) => console.error("Error to fetch api apiapp/login", error));

    }
}

export default withTranslator(Apiapp);
