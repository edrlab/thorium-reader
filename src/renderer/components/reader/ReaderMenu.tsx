// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as queryString from "query-string";

import { LocatorView } from "readium-desktop/common/views/locator";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import classnames from "classnames";

import UpdateBookmarkForm from "./UpdateBookmarkForm";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

interface Props extends TranslatorProps {
    open: boolean;
    publication: R2Publication;
    handleLinkClick: (event: any, url: string) => void;
    bookmarks: LocatorView[];
    handleBookmarkClick: (locator: any) => void;
    deleteBookmark?: any;
}

interface State {
    openedSection: number;
    bookmarkToUpdate: number;
}

export class ReaderMenu extends React.Component<Props, State> {
    private sectionRefList: any = [];
    private clickableList: boolean[] = [];

    public constructor(props: Props) {
        super(props);

        this.state = {
            openedSection: undefined,
            bookmarkToUpdate: undefined,
        };

        this.sectionRefList = [
            React.createRef(),
            React.createRef(),
            React.createRef(),
            React.createRef(),
        ];

        this.closeBookarkEditForm = this.closeBookarkEditForm.bind(this);
    }

    public componentWillReceiveProps(newProps: Props) {
        if (!this.props.publication && newProps.publication) {
            const pub: R2Publication = newProps.publication;
            // this.tocRendererList = this.createTOCRenderList(pub.TOC);

            this.clickableList = [
                pub.TOC && pub.TOC.length > 0,
                pub.LOI && pub.LOI.length > 0,
                newProps.bookmarks && newProps.bookmarks.length > 0,
                false,
            ];
        }
    }
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        this.clickableList[2] = this.props.bookmarks && this.props.bookmarks.length > 0;

        return (
            <div style={{visibility: this.props.open ? "visible" : "hidden"}} className={styles.chapters_settings}>
                <ul id={styles.chapter_settings_list}>
                    <li
                        onClick={this.handleClickSection.bind(this, 0)}
                        className={this.getSectionClassName(0)}
                    >
                        <span>{__("reader.marks.toc")}</span>
                        <SVG svg={ArrowIcon} />
                    </li>
                    <div style={this.getSectionStyle(0)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[0]} className={styles.line_tab_content}>
                            <ul className={styles.chapters_content}>
                                {this.props.publication && this.createTOCRenderList(this.props.publication.TOC)}
                            </ul>
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 1)}
                        className={this.getSectionClassName(1)}
                    >
                        <span>{__("reader.marks.illustrations")}</span>
                        <SVG svg={ArrowIcon} />
                    </li>
                    <div style={this.getSectionStyle(1)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[1]} className={styles.line_tab_content}>
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 2)}
                        className={this.getSectionClassName(2)}
                    >
                        <span>{__("reader.marks.landmarks")}</span>
                        <SVG svg={ArrowIcon} />
                    </li>
                    <div
                        style={this.getSectionStyle(2, this.props.bookmarks && this.props.bookmarks.length > 0)}
                        className={styles.tab_content}
                    >
                        <div ref={this.sectionRefList[2]} className={styles.line_tab_content}>
                            {this.createLandmarkList()}
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 3)}
                        className={this.getSectionClassName(3)}
                    >
                        <span>{__("reader.marks.annotations")}</span>
                        <SVG svg={ArrowIcon} />
                    </li>
                    <div style={this.getSectionStyle(3)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[3]} className={styles.line_tab_content}>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/baseline-edit-24px-grey.svg" alt=""/>
                                <div className={styles.chapter_marker}>
                                    Chapitre 1
                                    <div className={styles.gauge}>
                                        <div className={styles.fill}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/baseline-add-24px.svg"/>
                                <span>Nouvelle annotation</span>
                            </div>
                        </div>
                    </div>
                </ul>
                {/*<form id={styles.insidebook_search} role="search">
                    <input
                        type="search"
                        id={styles.book_search}
                        placeholder="Rechercher dans le livre"
                        title="rechercher dans le livre"
                    />
                    <input
                        type="image"
                        id={styles.launch}
                        src="src/renderer/assets/icons/baseline-search-24px-grey.svg"
                        value=""
                        alt="lancer la recherche"
                    />
                </form>

                <div className={styles.go_to_page}>Aller à la page <input type="number" placeholder="13"/></div>
                */}
            </div>
        );
    }

    private handleClickSection(id: number) {
        if (this.clickableList[id]) {
            let { openedSection } = this.state;
            if (openedSection === id) {
                openedSection = undefined;
            } else {
                openedSection = id;
            }

            this.setState({ openedSection });
        }
    }

    private getSectionStyle(id: number, bool?: boolean): any {
        if (bool === false) {
            return {maxHeight: 0};
        }

        const el = this.sectionRefList[id];
        let height = 0;
        if (el.current) {
            height = el.current.offsetHeight;
        }
        return {maxHeight: this.state.openedSection === id ? height : 0};
    }

    private getSectionClassName(id: number): any {
        return classnames([
            this.state.openedSection === id && styles.active,
            !this.clickableList[id] && styles.tab_not_clickable,
        ]);
    }

    private createTOCRenderList(TOC: any[]): JSX.Element[] {
        return TOC.map((content, i: number) => {
            return (
                <li key={i}>
                    {content.Children ? (
                        <>
                            <a
                                className={styles.subheading}
                                onClick={(e) => this.props.handleLinkClick(e, content.Href)}
                            >
                                {content.Title}
                            </a>
                            {content.Children &&
                                <ul className={styles.chapters_content}>
                                    {this.createTOCRenderList(content.Children)}
                                </ul>
                            }
                        </>
                    ) : (
                        <a
                            className={styles.line + " " + styles.active}
                            onClick={(e) => this.props.handleLinkClick(e, content.Href)}
                        >
                            {content.Title}
                        </a>
                    )}
                </li>
            );
        });
    }

    private createLandmarkList(): JSX.Element[] {
        if (this.props.publication && this.props.bookmarks) {
            const { bookmarkToUpdate } = this.state;
            return this.props.bookmarks.map((bookmark, i) => {
                return (
                    <div
                        className={styles.bookmarks_line}
                        key={i}
                    >
                        <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                        <div
                            className={styles.chapter_marker}
                            onClick={() => this.props.handleBookmarkClick(bookmark.locator)}
                        >
                            { bookmarkToUpdate === i ?
                                <UpdateBookmarkForm
                                    close={ this.closeBookarkEditForm }
                                    bookmark={ bookmark }
                                />
                            :
                                bookmark.name ? bookmark.name : <>Bookmark {i}</>
                            }
                            <div className={styles.gauge}>
                                <div className={styles.fill}></div>
                            </div>
                        </div>
                        <button onClick={() => this.setState({bookmarkToUpdate: i})}>
                            <SVG svg={ EditIcon }/>
                        </button>
                        <button onClick={() => this.props.deleteBookmark({
                            identifier: bookmark.identifier,
                        })}>
                            <SVG svg={ DeleteIcon }/>
                        </button>
                    </div>
                );
            });
        }
    }

    private closeBookarkEditForm() {
        this.setState({ bookmarkToUpdate: undefined });
    }
}

const buildBookmarkRequestData = () => {
    return { publication: { identifier: queryString.parse(location.search).pubId as string } };
};

export default withApi(
    withTranslator(ReaderMenu),
    {
        operations: [
            {
                moduleId: "reader",
                methodId: "findBookmarks",
                resultProp: "bookmarks",
                buildRequestData: buildBookmarkRequestData,
                onLoad: true,
            },
            {
                moduleId: "reader",
                methodId: "deleteBookmark",
                callProp: "deleteBookmark",
            },
        ],
        refreshTriggers: [
            {
                moduleId: "reader",
                methodId: "addBookmark",
            },
            {
                moduleId: "reader",
                methodId: "deleteBookmark",
            },
            {
                moduleId: "reader",
                methodId: "updateBookmark",
            },
        ],
    },
);
