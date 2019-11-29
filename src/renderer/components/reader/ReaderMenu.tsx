// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classnames from "classnames";
import * as queryString from "query-string";
import * as React from "react";
import { LocatorView } from "readium-desktop/common/views/locator";
import { TReaderApiFindBookmarks_result } from "readium-desktop/main/api/reader";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TFormEvent } from "readium-desktop/typings/react";
import { Unsubscribe } from "redux";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import SideMenu from "./sideMenu/SideMenu";
import { SectionData } from "./sideMenu/sideMenuData";
import UpdateBookmarkForm from "./UpdateBookmarkForm";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    open: boolean;
    r2Publication: R2Publication;
    handleLinkClick: (event: any, url: string) => void;
    handleBookmarkClick: (locator: any) => void;
    toggleMenu: any;
    focusNaviguationMenu: () => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    openedSection: number;
    bookmarkToUpdate: number;
    pageError: boolean;
    refreshError: boolean;
    bookmarks: TReaderApiFindBookmarks_result | undefined;
}

export class ReaderMenu extends React.Component<IProps, IState> {
    private goToRef: any;
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.state = {
            openedSection: undefined,
            bookmarkToUpdate: undefined,
            pageError: false,
            refreshError: false,
            bookmarks: undefined,
        };

        this.closeBookarkEditForm = this.closeBookarkEditForm.bind(this);
        this.handleSubmitPage = this.handleSubmitPage.bind(this);
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "reader/addBookmark",
            "reader/deleteBookmark",
            "reader/updateBookmark",
        ], () => {
            apiAction("reader/findBookmarks", queryString.parse(location.search).pubId as string)
            .then((bookmarks) => this.setState({bookmarks}))
            .catch((error) => console.error("Error to fetch api reader/findBookmark", error));
        });
    }

    public componentDidUpdate() {
        if (this.state.refreshError) {
            if (this.state.pageError) {
                this.setState({pageError: false});
            } else {
                this.setState({
                    pageError: true,
                    refreshError: false,
                });
            }
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __, r2Publication, toggleMenu } = this.props;
        const { bookmarks } = this.state;
        if (!r2Publication) {
            return <></>;
        }

        const sections: SectionData[] = [
            {
                title: __("reader.marks.toc"),
                content: r2Publication && this.renderLinkTree(__("reader.marks.toc"), r2Publication.TOC, 1),
                disabled: !r2Publication.TOC || r2Publication.TOC.length === 0,
            },
            {
                title: __("reader.marks.landmarks"),
                content: r2Publication && r2Publication.Landmarks &&
                    this.renderLinkList(__("reader.marks.landmarks"), r2Publication.Landmarks),
                disabled: !r2Publication.Landmarks || r2Publication.Landmarks.length === 0,
            },
            {
                title: __("reader.marks.bookmarks"),
                content: this.createBookmarkList(),
                disabled: !bookmarks || bookmarks.length === 0,
            },
            {
                title: __("reader.marks.annotations"),
                content: <></>,
                disabled: true,
            },
            {
                content: this.buildGoToPageSection(),
                disabled: false,
                notExtendable: true,
            },
        ];

        return (
            <SideMenu
                className={styles.chapters_settings}
                listClassName={styles.chapter_settings_list}
                open={this.props.open}
                sections={sections}
                toggleMenu={toggleMenu}
                focusMenuButton={this.props.focusNaviguationMenu}
            />
        );
    }

    private renderLinkList(label: string, links: Link[]): JSX.Element {
        return <ul
            aria-label={label}
            className={styles.chapters_content}
            role={"list"}
        >
            { links.map((link, i: number) => {
                return (
                    <li
                        key={i}
                        aria-level={1}
                        role={"listitem"}
                    >
                        <a
                            className={
                                link.Href ?
                                    classnames(styles.line, styles.active) :
                                    classnames(styles.line, styles.active, styles.inert)
                            }
                            onClick=
                                {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                            tabIndex={0}
                            onKeyPress=
                                {
                                    (e) => {
                                        if (link.Href && e.key === "Enter") {
                                            this.props.handleLinkClick(e, link.Href);
                                        }
                                    }
                                }
                            data-href={link.Href}
                        >
                            <span>{link.Title}</span>
                        </a>
                    </li>
                );
            })}
        </ul>;
    }

    private renderLinkTree(label: string | undefined, links: Link[], level: number): JSX.Element {
        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        return <ul
                    role={useTree ? (level <= 1 ? "tree" : "group") : undefined}
                    aria-label={label}
                    className={styles.chapters_content}
                >
            { links.map((link, i: number) => {
                return (
                    <li key={`${level}-${i}`}
                        role={useTree ? "treeitem" : undefined}
                        aria-expanded={useTree ? "true" : undefined}
                    >
                        {link.Children ? (
                            <>
                            <div role={"heading"} aria-level={level}>
                                <a
                                    className={
                                        link.Href ? styles.subheading : classnames(styles.subheading, styles.inert)
                                    }
                                    onClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    this.props.handleLinkClick(e, link.Href);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span>{link.Title}</span>
                                </a>
                            </div>

                            {this.renderLinkTree(undefined, link.Children, level + 1)}
                            </>
                        ) : (
                            <div role={"heading"} aria-level={level}>
                                <a
                                    className={
                                        link.Href ?
                                            classnames(styles.line, styles.active) :
                                            classnames(styles.line, styles.active, styles.inert)
                                    }
                                    onClick=
                                        {link.Href ? (e) => this.props.handleLinkClick(e, link.Href) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (link.Href && e.key === "Enter") {
                                                    this.props.handleLinkClick(e, link.Href);
                                                }
                                            }
                                        }
                                    data-href={link.Href}
                                >
                                    <span>{link.Title}</span>
                                </a>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>;
    }

    private createBookmarkList(): JSX.Element[] {
        const { __ } = this.props;
        if (this.props.r2Publication && this.state.bookmarks) {
            const { bookmarkToUpdate } = this.state;
            return this.state.bookmarks.map((bookmark, i) =>
                <div
                    className={styles.bookmarks_line}
                    key={i}
                >
                    { bookmarkToUpdate === i &&
                        <UpdateBookmarkForm
                            close={ this.closeBookarkEditForm }
                            bookmark={ bookmark }
                        />
                    }
                    <button
                        className={styles.bookmark_infos}
                        tabIndex={0}
                        onClick={(e) => this.handleBookmarkClick(e, bookmark)}
                    >
                        <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                        <div className={styles.chapter_marker}>
                            <p className={styles.bookmark_name}>
                                {bookmark.name ? bookmark.name : `Bookmark ${i}`}
                            </p>
                            <div className={styles.gauge}>
                                <div className={styles.fill}></div>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => this.setState({bookmarkToUpdate: i})}>
                        <SVG title={ __("reader.marks.edit")} svg={ EditIcon }/>
                    </button>
                    <button onClick={() => this.deleteBookmark(bookmark.identifier)}>
                        <SVG title={ __("reader.marks.delete")} svg={ DeleteIcon }/>
                    </button>
                </div>,
            );
        }
        return undefined;
    }

    private deleteBookmark = (bookmarkId: string) => {
        apiAction("reader/deleteBookmark", bookmarkId)
            .catch((error) => console.error("Error to fetch api reader/deleteBookmark", error));
    }

    private buildGoToPageSection() {
        if (!this.props.r2Publication) {
            return <></>;
        }
        const { __ } = this.props;
        const error = this.state.pageError;
        return <div className={styles.goToPage}>
            <p className={styles.title}>{__("reader.navigation.goToTitle")}</p>
            <form onSubmit={this.handleSubmitPage}>
                <input
                    ref={(ref) => this.goToRef = ref}
                    type="text"
                    aria-invalid={error}
                    onChange={() => this.setState({pageError: false})}
                    disabled={!this.props.r2Publication.PageList}
                    placeholder={__("reader.navigation.goToPlaceHolder")}
                    alt={__("reader.navigation.goToPlaceHolder")}
                />
                <button
                    type="submit"
                    disabled={!this.props.r2Publication.PageList}
                >
                    { __("reader.navigation.goTo") }
                </button>
            </form>
            {error &&
                <p
                    className={styles.goToErrorMessage}
                    aria-live="assertive"
                    aria-relevant="all"
                    role="alert"
                >
                    { __("reader.navigation.goToError") }
                </p>
            }
        </div>;
    }

    private closeBookarkEditForm() {
        this.setState({ bookmarkToUpdate: undefined });
    }

    private handleSubmitPage(e: TFormEvent) {
        e.preventDefault();
        const pageNbr = (this.goToRef.value as string).trim().replace(/\s\s+/g, " ");
        const foundPage = this.props.r2Publication.PageList.find((page) => page.Title === pageNbr);
        if (foundPage) {
            this.setState({pageError: false});
            this.props.handleLinkClick(undefined, foundPage.Href);
        } else {
            this.setState({refreshError: true});
        }
    }

    private handleBookmarkClick(e: any, bookmark: LocatorView) {
        e.preventDefault();
        this.props.handleBookmarkClick(bookmark.locator);
    }
}

export default withTranslator(ReaderMenu);
