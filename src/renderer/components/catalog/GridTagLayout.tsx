// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";


import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import {Theme} from "@material-ui/core/styles/createMuiTheme";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";

import { createStyles, WithStyles, withStyles} from "@material-ui/core/styles";

export interface TagProps {
            entries: CatalogEntryView[];
}

export default class GridTagLayout extends React.Component<TagProps> {

        public render(): React.ReactElement<{}> {

            return (
                    <section id={style.content}>
                        {this.props.entries.sort()}
                        {this.props.entries.map((entry, i: number) => {
                                return (
                                    this.checkEntryTotalCount(entry, i)
                                );
                        })}
                    </section>
            );
        }

        private checkEntryTotalCount(entry: CatalogEntryView, i: number) {
            if (entry.totalCount < 2) {
                    return (<></>);
            }
            return (
                    <div>
                        {entry.title}
                        <p id={style.count}> {entry.totalCount} </p>
                    </div>
            );
        }
}
