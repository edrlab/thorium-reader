// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { OpdsFeedView } from "readium-desktop/common/views/opds";
import { TOpdsApiFindAllFeed_result } from "readium-desktop/main/api/opds";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    feedsResult: TOpdsApiFindAllFeed_result | undefined;
}

class FeedList extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            feedsResult: undefined,
        };

        this.loadFeeds = this.loadFeeds.bind(this);
    }

    public async componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "opds/addFeed",
            "opds/deleteFeed",
            "opds/updateFeed",
        ], this.loadFeeds);
    }

    public componentWillUnmount() {
        this.unsubscribe();
    }

    public render(): React.ReactElement<{}> {
        if (!this.state.feedsResult) {
            return <></>;
        }
        return (
            <section className={styles.opds_list}>
                <ul>
                    {this.state.feedsResult.map((item, index) => {
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
                                    <p>{item.title}</p>
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

    private deleteFeed(event: TMouseEvent, feed: OpdsFeedView) {
        event.preventDefault();
        this.props.openDeleteDialog(feed);
    }

    private async loadFeeds() {
        try {
            const feedsResult = await apiAction("opds/findAllFeeds");
            this.setState({ feedsResult });
        } catch (e) {
            console.error("Error to fetch api opds/findAllFeeds", e);
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // feed was typed to string, it appears that the right type is OpdsFeedView
        // Redux state isn't typed
        openDeleteDialog: (feed: OpdsFeedView) => {
            dispatch(dialogActions.openRequest.build("delete-opds-feed-confirm",
                {
                    feed,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(FeedList);
