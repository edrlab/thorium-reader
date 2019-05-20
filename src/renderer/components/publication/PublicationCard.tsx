// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";
import { LsdStatus, LsdStatusType } from "readium-desktop/common/models/lcp";

import { PublicationView } from "readium-desktop/common/views/publication";

import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import Cover from "readium-desktop/renderer/components/publication/Cover";
import { withApi } from "readium-desktop/renderer/components/utils/api";
import Menu from "readium-desktop/renderer/components/utils/menu/Menu";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";

import { lcpReadable } from "readium-desktop/utils/publication";

import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

interface PublicationCardProps extends TranslatorProps {
    publication: PublicationView;
    menuContent: any;
    isOpds?: boolean;
    openInfosDialog?: (data: any) => void;
    openReader?: (data: any) => void;
    lsdStatus?: LsdStatus;
    getLsdStatus?: (data: any) => void;
}

interface PublicationCardState {
    menuOpen: boolean;
}

class PublicationCard extends React.Component<PublicationCardProps, PublicationCardState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.toggleMenu = this.toggleMenu.bind(this);
        this.openCloseMenu = this.openCloseMenu.bind(this);
        this.truncateTitle = this.truncateTitle.bind(this);
    }

    public componentDidMount() {
        const { publication, getLsdStatus } = this.props;
        if (publication.lcp) {
            getLsdStatus({publication});
        }
    }

    public render(): React.ReactElement<{}>  {
        const authors = this.props.publication.authors.join(", ");
        const MenuContent = this.props.menuContent;
        return (
            <div className={styles.block_book}
                aria-haspopup="dialog"
                aria-controls="dialog"
            >
                <div className={styles.image_wrapper}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <Cover publication={ this.props.publication } />
                    </a>
                </div>
                <div className={styles.legend}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <p className={styles.book_title} aria-label="Titre du livre">
                            { this.truncateTitle(this.props.publication.title) }
                        </p>
                        <p className={styles.book_author} aria-label="Auteur du livre">
                            {authors}
                        </p>
                    </a>
                    <Menu
                        button={(<SVG svg={MenuIcon}/>)}
                        content={(
                            <div className={styles.menu}>
                                <MenuContent toggleMenu={this.toggleMenu} publication={this.props.publication}/>
                            </div>
                        )}
                        open={this.state.menuOpen}
                        dir="right"
                        toggle={this.openCloseMenu}
                    />
                </div>
            </div>
        );
    }

    private openCloseMenu() {
        this.setState({menuOpen: !this.state.menuOpen});
    }

    private toggleMenu() {
        this.setState({menuOpen: !this.state.menuOpen});
    }

    private handleBookClick(e: any) {
        e.preventDefault();
        const { publication, lsdStatus } = this.props;
        if (this.props.isOpds || !lcpReadable(publication, lsdStatus)) {
            this.props.openInfosDialog(publication);
        } else {
            this.props.openReader(publication);
        }
    }

    /* function Truncate very long titles at 60 characters */
    private truncateTitle(title: string): string {
        let newTitle = title;
        const truncate = 60;

        if (newTitle && newTitle.length > truncate) {
            newTitle = title.substr(0, truncate);
            newTitle += "...";
        }
        return (newTitle);
    }
}

const mapDispatchToProps = (dispatch: any, props: PublicationCardProps) => {
    return {
        openReader: (publication: PublicationView) => {
            dispatch({
                type: readerActions.ActionType.OpenRequest,
                payload: {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            });
        },
        openInfosDialog: (publication: PublicationView) => {
            if (props.isOpds) {
                dispatch(dialogActions.open(
                    DialogType.PublicationInfo,
                    {
                        publication,
                        isOpds: props.isOpds,
                    },
                ));
            } else {
                dispatch(dialogActions.open(
                    DialogType.PublicationInfo,
                    {
                        publicationIdentifier: publication.identifier,
                    },
                ));
            }
        },
    };
};

export default withApi(
    withTranslator(PublicationCard),
    {
        mapDispatchToProps,
        operations: [
            {
                moduleId: "lcp",
                methodId: "getLsdStatus",
                callProp: "getLsdStatus",
                resultProp: "lsdStatus",
            },
        ],
    },
);
