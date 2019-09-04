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
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";
import { withApi } from "readium-desktop/renderer/components/utils/api";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/translator";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import SideMenu from "./sideMenu/SideMenu";
import { SectionData } from "./sideMenu/sideMenuData";
import UpdateBookmarkForm from "./UpdateBookmarkForm";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

interface Props extends TranslatorProps {
    open: boolean;
    publication: R2Publication;
    handleLinkClick: (event: any, url: string) => void;
    bookmarks: LocatorView[];
    handleBookmarkClick: (locator: any) => void;
    deleteBookmark?: any;
    toggleMenu: any;
    focusNaviguationMenu: () => void;
}

interface State {
    openedSection: number;
    bookmarkToUpdate: number;
    pageError: boolean;
    refreshError: boolean;
}

export class ReaderMenu extends React.Component<Props, State> {
    private goToRef: any;
    public constructor(props: Props) {
        super(props);

        this.state = {
            openedSection: undefined,
            bookmarkToUpdate: undefined,
            pageError: false,
            refreshError: false,
        };

        this.closeBookarkEditForm = this.closeBookarkEditForm.bind(this);
        this.handleSubmitPage = this.handleSubmitPage.bind(this);
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

    public render(): React.ReactElement<{}> {
        const { __, publication, bookmarks, toggleMenu } = this.props;
        if (!publication) {
            return <></>;
        }

        const sections: SectionData[] = [
            {
                title: __("reader.marks.toc"),
                content: publication && this.createTOCRenderList(publication.TOC),
                disabled: !publication.TOC || publication.TOC.length === 0,
            },
            {
                title: __("reader.marks.landmarks"),
                content: this.createTOCRenderList(publication.Landmarks),
                disabled: !publication.Landmarks || publication.Landmarks.length === 0,
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

    private createTOCRenderList(TOC: Link[]): JSX.Element {
        return <ul className={styles.chapters_content}>
            { TOC.map((content, i: number) => {
                return (
                    <li key={i}>
                        {content.Children ? (
                            <>
                                <a
                                    className={
                                        content.Href ? styles.subheading : classnames(styles.subheading, styles.inert)
                                    }
                                    onClick=
                                        {content.Href ? (e) => this.props.handleLinkClick(e, content.Href) : undefined}
                                    tabIndex={0}
                                    onKeyPress=
                                        {
                                            (e) => {
                                                if (content.Href && e.charCode === 13) {
                                                    this.props.handleLinkClick(e, content.Href);
                                                }
                                            }
                                        }
                                    data-href={content.Href}
                                >
                                    <span>{content.Title}</span>
                                </a>
                                {content.Children &&
                                    <ul className={styles.chapters_content}>
                                        {this.createTOCRenderList(content.Children)}
                                    </ul>
                                }
                            </>
                        ) : (
                            <a
                                className={
                                    content.Href ?
                                        classnames(styles.line, styles.active) :
                                        classnames(styles.line, styles.active, styles.inert)
                                }
                                onClick=
                                    {content.Href ? (e) => this.props.handleLinkClick(e, content.Href) : undefined}
                                tabIndex={0}
                                onKeyPress=
                                    {
                                        (e) => {
                                            if (content.Href && e.charCode === 13) {
                                                this.props.handleLinkClick(e, content.Href);
                                            }
                                        }
                                    }
                                data-href={content.Href}
                            >
                                {content.Title}
                            </a>
                        )}
                    </li>
                );
            })}
        </ul>;
    }

    private createBookmarkList(): JSX.Element[] {
        if (this.props.publication && this.props.bookmarks) {
            const { bookmarkToUpdate } = this.state;
            return this.props.bookmarks.map((bookmark, i) =>
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
                </div>,
            );
        }
        return undefined;
    }

    private buildGoToPageSection() {
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
                    disabled={!this.props.publication.PageList}
                    placeholder={__("reader.navigation.goToPlaceHolder")}
                    alt={__("reader.navigation.goToPlaceHolder")}
                />
                <button
                    type="submit"
                    disabled={!this.props.publication.PageList}
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

    private handleSubmitPage(e: any) {
        e.preventDefault();
        const pageNbr = this.goToRef.value;
        const foundPage = this.props.publication.PageList.find((page) => page.Title === pageNbr);
        if (foundPage) {
            this.setState({pageError: false});
            this.props.handleLinkClick(undefined, foundPage.Href);
        } else {
            this.setState({refreshError: true});
        }
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
