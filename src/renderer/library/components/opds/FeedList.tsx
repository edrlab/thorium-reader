// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";
import { authActions, customizationActions, opdsActions } from "readium-desktop/common/redux/actions";
import { subscribeToAction } from "readium-desktop/renderer/common/redux/middleware/actionSubscriber";
import { FeedCard } from "./FeedCard";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
     setFeedsResult: (feedsResult: any) => void;
}

interface IState {
    feedsResult: IOpdsFeedView[] | undefined;
}

class FeedList extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;
    private unsubscribeAction: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            feedsResult: [],
        };

        this.loadFeeds = this.loadFeeds.bind(this);
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "opds/addFeed",
            "opds/deleteFeed",
            "opds/updateFeed",
            "opds/setFeedFavorite",
        ], this.loadFeeds);

        this.unsubscribeAction = subscribeToAction(opdsActions.refresh.ID, (_action) => {
            // console.log("Refresh opds feed list requested by the action ID=", opdsActions.refresh.ID);

            this.loadFeeds().then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.unsubscribeAction) {
            this.unsubscribeAction();
        }
    }

    public render(): React.ReactElement<{}> {
        if (!this.state.feedsResult) {
            return <></>;
        }

        const { __ } = this.props;

        return (
            <section>
                <h2>{__("header.myCatalogs")}</h2>
                <ul className={stylesCatalogs.catalog_wrapper}>
                    {this.state.feedsResult.map((item) => {
                        return (
                            <FeedCard
                                key={"feed-" + item.identifier}
                                feed={item}
                                location={this.props.location}
                            />
                        );
                    })}
                    {[...Array(6).keys()].map((n, _index) => {
                        return <div key={"array-" + n}></div>;
                    })}
                </ul>
            </section>
        );
    }

    // private deleteFeed(event: TMouseEventOnButton, feed: IOpdsFeedView) {
    //     event.preventDefault();
    //     this.props.openDeleteDialog(feed);
    // }
    private async loadFeeds() {
        try {
            const feedsResult = await apiAction("opds/findAllFeeds");

            this.setState({ feedsResult });
            if (this.props.setFeedsResult) {
                this.props.setFeedsResult(feedsResult);
            }
        } catch (e) {
            console.error("Error to fetch api opds/findAllFeeds", e);
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // openDeleteDialog: (feed: IOpdsFeedView) => {
        //     dispatch(dialogActions.openRequest.build(DialogTypeName.DeleteOpdsFeedConfirm,
        //         {
        //             feed,
        //         },
        //     ));
        // },
        openUpdateDialog: (feed: IOpdsFeedView) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.OpdsFeedUpdateForm,
                {
                    feed,
                },
            ));
        },
        logout: (feedUrl: string) => {
            dispatch(authActions.logout.build(feedUrl));
        },
        triggerAuth: (feedUrl: string, authenticationUrl: string) => {
            dispatch(customizationActions.triggerOpdsAuth.build(feedUrl, authenticationUrl));
        },
    };
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    locale: state.i18n.locale, // refresh
    libraryView: state.settings.libraryView,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FeedList));
