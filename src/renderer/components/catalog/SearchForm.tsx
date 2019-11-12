// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as styles from "readium-desktop/renderer/assets/styles/header.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TFormEvent } from "readium-desktop/typings/react";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

class Search extends React.Component<IProps, undefined> {

    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.inputRef = React.createRef();
        this.search = this.search.bind(this);
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
                    placeholder={__("header.searchPlaceholder")}
                />
                <button id={styles.search_img}>
                    <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                </button>
            </form>
        );
    }

    public search(e: TFormEvent) {
        e.preventDefault();
        const value = this.inputRef.current.value;
        if (!value) {
            this.props.history.push("/library/search/all");
        } else {
            this.props.history.push("/library/search/text/" + value + this.props.location.search);
        }
    }
}

export default withTranslator(withRouter(Search));
