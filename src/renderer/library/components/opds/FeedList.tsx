// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as GlobeIcon from "readium-desktop/renderer/assets/icons/globe-icon.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { Unsubscribe } from "redux";
import { DisplayType, IRouterLocationState } from "../../routing";
import DeleteOpdsFeedConfirm from "../dialog/DeleteOpdsFeedConfirm";
import OpdsFeedUpdateForm from "../dialog/OpdsFeedUpdateForm";

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
                <h2>{__("header.myCatalogs")}</h2>
                <ul className={stylesCatalogs.catalog_wrapper}>
                    {this.state.feedsResult.map((item, index) => {
                        return (
                            <li key={"feed-" + index} className={stylesCatalogs.catalog_container}>
                                <Link
                                    to={{
                                        ...this.props.location,
                                        pathname: buildOpdsBrowserRoute(
                                            item.identifier,
                                            item.title,
                                            item.url,
                                        ),
                                    }}
                                    state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                                    className={stylesCatalogs.catalog_content}
                                    onClick={(e) => {
                                        if (e.altKey || e.shiftKey || e.ctrlKey) {
                                            e.preventDefault();
                                            e.currentTarget.click();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        // if (e.code === "Space") {
                                        if (e.key === " " || e.altKey || e.ctrlKey) {
                                            e.preventDefault(); // prevent scroll
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Includes screen reader tests:
                                        // if (e.code === "Space") { WORKS
                                        // if (e.key === "Space") { DOES NOT WORK
                                        // if (e.key === "Enter") { WORKS
                                        if (e.key === " ") { // WORKS
                                            e.preventDefault();
                                            e.currentTarget.click();
                                        }
                                    }}
                                >
                                    <div style={{ width: "100%", height: "50px", backgroundColor: "var(--color-extralight-grey)", borderBottom: "1px solid var(--color-light-grey)", position: "absolute", top: "2px" }}></div>
                                    <div className={stylesCatalogs.catalog_title}>
                                        <SVG ariaHidden svg={GlobeIcon} />
                                        <p title={`${item.title} --- ${item.url}`}>{item.title}</p>
                                    </div>
                                </Link>
                                <OpdsFeedUpdateForm trigger={(
                                    <button
                                        className={stylesCatalogs.button_edit}
                                        title={__("catalog.update")}
                                    >
                                        <SVG ariaHidden={true} svg={EditIcon} />
                                    </button>
                                )}
                                    feed={item}
                                />
                                <DeleteOpdsFeedConfirm trigger={(
                                    <button
                                        // onClick={(e) => this.deleteFeed(e, item)}
                                        className={stylesCatalogs.button_delete}
                                        title={__("catalog.delete")}
                                    >
                                        <SVG ariaHidden={true} svg={DeleteIcon} />
                                    </button>
                                )} feed={item} />
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

    // private deleteFeed(event: TMouseEventOnButton, feed: IOpdsFeedView) {
    //     event.preventDefault();
    //     this.props.openDeleteDialog(feed);
    // }

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
    };
};

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FeedList));
