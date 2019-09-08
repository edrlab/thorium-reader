// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { OpdsFeedView } from "readium-desktop/common/views/opds";
import { TOpdsFindAllFeedApi_result } from "readium-desktop/main/api/opds";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

interface IFeedListProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    feeds?: TOpdsFindAllFeedApi_result;
    deleteFeed?: any;
    openToast?: any;
}

export class FeedList extends React.Component<IFeedListProps, null> {
    public render(): React.ReactElement<{}>  {
        if (!this.props.feeds) {
            return <></>;
        }

        return (
            <section className={styles.opds_list}>
                <ul>
                    { this.props.feeds.map((item, index) => {
                        return (
                            <li key={"feed-" + index}>
                                <Link
                                    to={{
                                        pathname: buildOpdsBrowserRoute(
                                            item.identifier,
                                            item.title,
                                            item.url,
                                        ),
                                    }}
                                >
                                    <p>{ item.title }</p>
                                </Link>
                                <button
                                    onClick={(e) => this.deleteFeed(e, item)}
                                >
                                    <SVG svg={DeleteIcon} />
                                </button>
                            </li>
                        );
                    })}
                    {[...Array(6).keys()].map((__, _index) => {
                        return <div key={"array-" + __}></div>;
                    })}
                </ul>
            </section>
        );
    }

    private deleteFeed(event: any, feed: OpdsFeedView) {
        event.preventDefault();
        this.props.openDeleteDialog(feed);
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        openDeleteDialog: (feed: string) => {
            dispatch(dialogActions.open(
                DialogType.DeleteOpdsFeedConfirm,
                {
                    feed,
                },
            ));
        },
    };
};

export default withApi<IFeedListProps>(
    FeedList,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "findAllFeeds",
                resultProp: "feeds",
                onLoad: true,
            },
        ],
        refreshTriggers: [
            {
                moduleId: "opds",
                methodId: "addFeed",
            },
            {
                moduleId: "opds",
                methodId: "deleteFeed",
            },
        ],
        mapDispatchToProps,
    },
);
