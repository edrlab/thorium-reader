// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";

import SVG from "readium-desktop/renderer/components/utils/SVG";
import Menu from "../utils/menu/Menu";
import { TranslatorProps, withTranslator } from "../utils/translator";

export interface TagProps extends TranslatorProps {
            tags: string[];
            content?: any;
}

export interface LayoutState {
            showMenu: boolean;
            value: string;
}

export class GridTagLayout extends React.Component<TagProps, LayoutState> {
        public constructor(props: any) {
            super(props);
            this.state = {
                    showMenu: false,
                    value: "",
            };
            this.togglemenu = this.togglemenu.bind(this);
        }
        public render(): React.ReactElement<{}> {
            const { __ } = this.props;
            return (
                <section id={style.myTags}>
                        <h1> { __("catalog.tags")} </h1>
                        {this.props.tags.length === 0 ?
                                <> {__("catalog.emptyTagList")} </>
                                :
                                <>
                                    <div id={style.sortMenu}>
                                    <Menu
                                    button={(<div> { __("catalog.sort")}
                                            <SVG svg={ArrowIcon}/>
                                            </div>
                                            )}
                                    content={(<div>
                                                {this.props.content}
                                            </div>)}
                                    open={this.state.showMenu}
                                    dir="left"
                                    toggle={this.togglemenu}
                                    />
                                    </div>
                                    <section id={style.content}>
                                            {this.props.tags.map((tag, i: number) => {
                                                return (
                                                    this.checkEntryTotalCount(tag, i)
                                                );
                                            })}
                                    </section>
                                </>
                        }
                </section>
            );
        }

        private checkEntryTotalCount(tag: string, i: number) {
            return (
                    <div key={i}>
                        {tag}
                        <div id={style.count}> {0} </div>
                    </div>
            );
        }

        private togglemenu() {
            this.setState({
                showMenu: !this.state.showMenu,
            });
        }
}

export default withTranslator(GridTagLayout);
