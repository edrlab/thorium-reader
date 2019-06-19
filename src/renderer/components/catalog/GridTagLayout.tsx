// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import SVG from "readium-desktop/renderer/components/utils/SVG";
import Menu from "../utils/menu/Menu";
import { TranslatorProps, withTranslator } from "../utils/translator";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { Publication } from "readium-desktop/common/models/publication";
import { PublicationView } from "readium-desktop/common/views/publication";

interface TagProps extends TranslatorProps, RouteComponentProps {
    tags: string[];
    content?: any;
    findByTag?: (data: any) => PublicationView[];
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
        this.searchData = this.searchData.bind(this);
        this.togglemenu = this.togglemenu.bind(this);
    }

    /*public componentDidUpdate(oldprops: TagProps, oldstate: LayoutState) {
        const {findByTag} = this.props;
        const {showMenu} = this.state;
        const {value} = this.state;

        if (showMenu !== oldstate.showMenu || value !== oldstate.value) {
            console.log("update state");
        }
        if (findByTag !== oldprops.findByTag) {
            console.log("update props");
        }
    }*/
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <section id={style.myTags}>
                <h1> {__("catalog.tags")} </h1>
                {this.props.tags.length === 0 ?
                    <> {__("catalog.emptyTagList")} </>
                    :
                    <>
                        <div id={style.sortMenu}>
                            <Menu
                                button={(<div> {__("catalog.sort")}
                                    <SVG svg={ArrowIcon} />
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
        // console.log(`${Object.values(this.props)}`);
        return (
            <Link key={i}
                to={{ pathname: `/library/search/tag/${tag}` }}
            >
                {tag}
                {/*<div id={style.count}> {this.searchData(tag)} </div>*/}
            </Link>
        );
    }

    private togglemenu() {
        this.setState({
            showMenu: !this.state.showMenu,
        });
    }

    /*private async searchData(mytag: string) {
        let nb_books = 0;
        // console.log(`${Object.values(this.props)}`);
        /*const tab = await this.props.findByTag({tag: mytag});
        console.log("tab:", tab);*/
        /*nb_books = tab.length()*/
        /*if (tab) {
            console.log(`${tab}`);
        } else {
            console.log("null");
        }
    }*/
}

/*const buildSearchRequestData = (props: TagProps): any => {
    return {
        tag: (props.tags as any).value,
    };
};*/

export default withApi(
    withTranslator(withRouter(GridTagLayout)),
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findByTag",
                callProp: "findByTag",
            },
        ],
    },
);
