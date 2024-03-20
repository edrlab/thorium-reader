// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import GridTagButton from "readium-desktop/renderer/library/components/catalog/GridTagButton";
import { connect } from "react-redux";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    content?: React.ReactElement<{}>;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    tabTags: string[];
    status: SortStatus;
}

enum SortStatus {
    Count,
    Alpha,
}

class GridTagLayout extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            tabTags: this.props.tags ? this.props.tags.slice() : [],
            status: SortStatus.Count,
        };
        this.sortByAlpha = this.sortByAlpha.bind(this);
        this.sortbyCount = this.sortbyCount.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.tags !== oldProps.tags) {
            const { status } = this.state;
            switch (status) {
                case SortStatus.Count:
                    this.sortbyCount();
                    break;
                case SortStatus.Alpha:
                    this.sortByAlpha();
                    break;
            }
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <section>
                <div className={stylesGlobal.heading}>
                    <h2>{__("catalog.tags")}</h2>
                    {this.props.tags.length === 0 ?
                        <></>
                        :
                        <Menu
                            button={
                                <>
                                    {__("catalog.sort")}
                                    <SVG ariaHidden={true} svg={ArrowIcon} />
                                </>
                            }
                            content={
                                <div className={classNames(stylesDropDown.dropdown_menu, stylesDropDown.dropdown_right)}>
                                    <button
                                        role="menuitem"
                                        onClick={this.sortByAlpha}
                                    >
                                        A-Z
                                    </button>
                                    <button
                                        role="menuitem"
                                        onClick={this.sortbyCount}
                                    >
                                        {__("catalog.tagCount")}
                                    </button>
                                </div>
                            }
                            dir="right"
                        />
                    }
                </div>
                {this.props.tags.length === 0 ?
                    <> {__("catalog.emptyTagList")} </>
                    :
                    <div className={stylesTags.tags_wrapper}>
                        {this.props.tags.map((tag, i: number) => {
                            return (
                                <GridTagButton
                                    name={tag}
                                    key={i + 1000}
                                    /*tag={[]}*/
                                />
                            );
                        })}
                    </div>
                }
            </section>
        );
    }

    private sortbyCount() {
        const { tags } = this.props;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        const tabTags = tags.sort((a, b) => {
            if (a < b) {
                return (1);
            } else if (a > b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Count,
            tabTags,
        });
    }

    private sortByAlpha() {
        const { tags } = this.props;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        const tabTags = tags.sort((a, b) => {
            if (a > b) {
                return (1);
            } else if (a < b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Alpha,
            tabTags,
        });
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    tags: state.publication.tag,
});


export default connect(mapStateToProps)(withTranslator(GridTagLayout));
