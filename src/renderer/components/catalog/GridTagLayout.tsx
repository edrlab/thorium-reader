// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import {Theme} from "@material-ui/core/styles/createMuiTheme";

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
           /* this.showMenu = this.showMenu.bind(this);
            this.closeMenu = this.closeMenu.bind(this);
            this.sortByAlpha = this.sortByAlpha.bind(this);
            this.sortbyCount = this.sortbyCount.bind(this);*/
        }
        public render(): React.ReactElement<{}> {

            return (

                  <div id={style.myTags}>
                        {this.props.entries.map((entry, i: number) => {
                                console.log(entry.title);
                              })}
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
                              dir="right"
                        />
                              {/*<button
                              onClick={this.showMenu}>Sort by
                              <SVG svg={ArrowIcon}/>
                              </button>
                              {/*
                                    this.state.showMenu ? (
                                          <div>
                                                <table>
                                                      <tbody>
                                                            <tr>
                                                                  <td>
                                                                        <button
                                                                        onClick={this.sortByAlpha}> A-Z </button>
                                                                  </td>
                                                            </tr>
                                                            <tr>
                                                                  <td>
                                                                        <button
                                                                        onClick={this.sortbyCount}> tag count
                                                                        </button>
                                                                  </td>
                                                            </tr>
                                                      </tbody>
                                                </table>
                                          </div>
                                    )
                                    : (
                                          <div id={style.value}>
                                          {this.state.value} </div>
                                                )*/
                              }
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

       // private componentDidUpdate()

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
/*
        private sortbyCount() {
              this.setState({
                    value: "tag's count",
              });
              this.props.entries.sort((a, b) => {
                  if (a.totalCount < b.totalCount) {
                        return (1);
                  } else if (a.totalCount > b.totalCount) {
                        return (-1);
                  }
                  return (0);

            });
        }

        private sortByAlpha() {
            this.setState({
                  value: "A to Z",
            });
            this.props.entries.sort((a, b) => {
                  if (a.title > b.title) {
                        return (1);
                  } else if (a.title < b.title) {
                        return (-1);
                  }
                  return (0);
            });
        }

        private showMenu(event: any) {
            this.setState({
                  showMenu: true,
            }, () => document.addEventListener("click", this.closeMenu));
        }

        private closeMenu() {
              this.setState({
                  showMenu: false,
              }, () => document.removeEventListener("click", this.closeMenu));
        }*/
}
