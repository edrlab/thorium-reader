// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface IState {
    feedsResult: IOpdsFeedView[] | undefined;
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
            // "opds/updateFeed",
        ], this.loadFeeds);
    }

    public componentWillUnmount() {
        this.unsubscribe();
    }

    public render(): React.ReactElement<{}> {
        if (!this.state.feedsResult) {
            return <></>;
        }
        const { __ } = this.props;
        return (
            <section>
                <ul className={classNames(stylesGlobal.flex_wrap, stylesGlobal.p_0)}>
                    {this.state.feedsResult.map((item, index) => {
                        return (
                            <li key={"feed-" + index} className={stylesBlocks.block_full_wrapper}>
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: buildOpdsBrowserRoute(
                                            item.identifier,
                                            item.title,
                                            item.url,
                                        ),
                                    }}
                                    className={stylesBlocks.block_full}
                                >
                                    <p>{item.title}</p>
                                </Link>
                                <button
                                    onClick={(e) => this.deleteFeed(e, item)}
                                    className={classNames(stylesButtons.button_transparency_icon, stylesBlocks.block_full_close)}
                                >
                                    <SVG svg={DeleteIcon} title={__("catalog.delete")} />
                                </button>
                            </li>
                        );
                    })}
                    {[...Array(6).keys()].map((n, _index) => {
                        return <div key={"array-" + n}></div>;
                    })}
                </ul>
            </section>
        );
    }

    private deleteFeed(event: TMouseEventOnButton, feed: IOpdsFeedView) {
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
        openDeleteDialog: (feed: IOpdsFeedView) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.DeleteOpdsFeedConfirm,
                {
                    feed,
                },
            ));
        },
    };
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FeedList));
