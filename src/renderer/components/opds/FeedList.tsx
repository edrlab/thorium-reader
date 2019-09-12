// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { OpdsFeedView } from "readium-desktop/common/views/opds";
import { TOpdsApiFindAllFeed_result } from "readium-desktop/main/api/opds";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    feedsResult: TOpdsApiFindAllFeed_result | undefined;
}

class FeedList extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            feedsResult: undefined,
        };
    }

    public async componentDidMount() {
        try {
            const feedsResult = await apiFetch("opds/findAllFeeds");
            this.setState({feedsResult});
        } catch (e) {
            console.error("Error to fetch api opds/findAllFeeds", e);
        }
    }

    public render(): React.ReactElement<{}>  {
        if (!this.state.feedsResult) {
            return <></>;
        }

        return (
            <section className={styles.opds_list}>
                <ul>
                    { this.state.feedsResult.map((item, index) => {
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

    private deleteFeed(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, feed: OpdsFeedView) {
        event.preventDefault();
        this.props.openDeleteDialog(feed);
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        // feed was typed to string, it appears that the right type is OpdsFeedView
        // Redux state isn't typed
        openDeleteDialog: (feed: OpdsFeedView) => {
            dispatch(dialogActions.open(
                DialogType.DeleteOpdsFeedConfirm,
                {
                    feed,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(FeedList);

    /*withApi(
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
*/
