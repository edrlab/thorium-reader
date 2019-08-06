// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";

import SVG from "readium-desktop/renderer/components/utils/SVG";
import Menu from "../utils/menu/Menu";
import { TranslatorProps, withTranslator } from "../utils/translator";

import GridTagButton from "./GridTagButton";

interface TagProps extends TranslatorProps {
        tags: string[];
        content?: any;
}

interface LayoutState {
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
                                    button={
                                        <div>
                                            { __("catalog.sort")}
                                            <SVG svg={ArrowIcon}/>
                                        </div>
                                    }
                                    content={
                                        <div>
                                            {this.props.content}
                                        </div>
                                    }
                                    open={this.state.showMenu}
                                    dir="left"
                                    toggle={this.togglemenu}
                                />
                            </div>
                            <section id={style.content}>
                                {this.props.tags.map((tag, i: number) => {
                                    return (
                                        <GridTagButton
                                            name={tag}
                                            key={i + 1000}
                                            tag={[]}
                                        />);
                                    })}
                            </section>
                        </>
                    }
                </section>
            );
        }

        private togglemenu() {
            this.setState({
                showMenu: !this.state.showMenu,
            });
        }
}

export default withTranslator(GridTagLayout);
