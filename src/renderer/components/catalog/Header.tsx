// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";

import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as DetachIcon from "readium-desktop/renderer/assets/icons/outline-flip_to_front-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import PublicationAddButton from "./PublicationAddButton";
import SearchForm from "./SearchForm";

import { ReaderMode } from "readium-desktop/common/models/reader";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { connect } from "react-redux";
import { RootState } from "readium-desktop/renderer/redux/states";

import { readerActions } from "readium-desktop/common/redux/actions";

import * as classnames from "classnames";

export enum DisplayType {
    Grid = "grid",
    List = "list",
}

interface Props extends TranslatorProps {
    displayType: DisplayType;
    readerMode?: ReaderMode;
    readerCount?: number;
    detachReader?: (mode: ReaderMode) => void;
}

export class Header extends React.Component<Props, undefined> {
    public constructor(props: Props) {
        super(props);

        this.toggleReaderMode = this.toggleReaderMode.bind(this);
    }
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <SecondaryHeader id={styles.catalog_header}>
                <Link
                    to={{search: "displayType=grid"}}
                    style={(this.props.displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                    title={__("header.gridTitle")}
                >
                    <SVG svg={GridIcon} ariaHidden/>
                </Link>
                <Link
                    to={{search: "displayType=list"}}
                    style={this.props.displayType !== DisplayType.List ? {fill: "grey"} : {}}
                    title={__("header.listTitle")}
                >
                    <SVG svg={ListIcon} ariaHidden/>
                </Link>
                <SearchForm />
                {this.AllBooksButton(window.location.hash)}
                <PublicationAddButton />
                <button
                    className={classnames(
                        styles.detachReaderButton,
                        this.props.readerMode === ReaderMode.Detached && styles.detached,
                    )}
                    onClick={this.toggleReaderMode}
                    disabled={this.props.readerCount > 0}
                >
                    <SVG
                        svg={DetachIcon}
                        title={
                            this.props.readerMode === ReaderMode.Detached ? __("reader.navigation.detachWindowTitle")
                            : __("reader.navigation.attachWindowTitle")
                        }
                    />
                </button>
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: string) {
        const search = hash.search("search");
        if (search === -1) {
            return (
                <Link
                    id={styles.all_link_button}
                    to={{
                        pathname: "/library/search/all",
                        state: {
                            displaytype: this.props.displayType as DisplayType,
                        },
                    }}
                >
                    {this.props.__("header.allBooks")}
                </Link>
            );
        }
        return (<></>);
    }

    private toggleReaderMode() {
        const mode = this.props.readerMode === ReaderMode.Attached ? ReaderMode.Detached : ReaderMode.Attached;
        this.props.detachReader(mode);
    }
}

const mapStateToProps = (state: RootState) => {
    return {
        readerMode: state.reader.mode,
        readerCount: state.reader.readerCount,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        detachReader: (mode: ReaderMode) => {
            dispatch(readerActions.detach(mode));
        },
    };
};

export default withTranslator(connect(mapStateToProps, mapDispatchToProps)(Header));
