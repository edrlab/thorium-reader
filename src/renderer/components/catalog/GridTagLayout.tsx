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

export interface TagProps {
            entries: CatalogEntryView[];
            content?: any;
}

export interface LayoutState {
            showMenu: boolean;
            value: string;
}

export default class GridTagLayout extends React.Component<TagProps, LayoutState> {
        public constructor(props: any) {
            super(props);
            this.state = {
                    showMenu: false,
                    value: "",
            };
        }
        public render(): React.ReactElement<{}> {

            return (
                    <div id={style.myTags}>
                        Mes Tags
                        <div id={style.sortMenu}>
                        <Menu
                                button={(<div> sort by
                                    <SVG svg={ArrowIcon}/>
                                </div>
                                    )}
                                content={(<div>
                                    {this.props.content}
                                </div>)}
                                open={false}
                                dir="left"
                        />
                        </div>
                        <section id={style.content}>
                                {this.props.entries.map((entry, i: number) => {
                                        return (
                                            this.checkEntryTotalCount(entry, i)
                                    );
                                })}
                        </section>
                    </div>
            );
        }

        private checkEntryTotalCount(entry: CatalogEntryView, i: number) {
            if (entry.totalCount < 2) {
                    return;
            }
            return (
                    <div key={i}>
                        {entry.title}
                        <div id={style.count}> {entry.totalCount} </div>
                    </div>
            );
        }
}
