// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";

import * as React from "react";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as GlobeIcon from "readium-desktop/renderer/assets/icons/globe-icon.svg";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar-icon.svg";
import * as StarIcon from "readium-desktop/renderer/assets/icons/star-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { DisplayType, IRouterLocationState } from "../../routing";
import DeleteOpdsFeedConfirm from "../dialog/DeleteOpdsFeedConfirm";
import OpdsFeedUpdateForm from "../dialog/OpdsFeedUpdateForm";
import * as Popover from "@radix-ui/react-popover";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { authActions, customizationActions } from "readium-desktop/common/redux/actions";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { Link } from "react-router-dom";

interface IFeedCardProps {
    feed: IOpdsFeedView;
    onClick?: (feed: IOpdsFeedView) => void;
    location: any;
    setFeedsResult?: (feedsResult: IOpdsFeedView[]) => void;
}

export const FeedCard: React.FC<IFeedCardProps> = (props) => {
    const { feed, setFeedsResult, location } = props;
    const dispatch = useDispatch();
    const [__] = useTranslator();

    const logout: (feedUrl: string) => void = (feedUrl) => {
        dispatch(authActions.logout.build(feedUrl));
    };

    const loadFeeds = React.useCallback(() => {
        apiAction("opds/findAllFeeds").then((feedsResult) => {
            if (setFeedsResult) {
                setFeedsResult(feedsResult);
            }
        }).catch((err) => {
            console.error("Error to fetch api opds/findAllFeeds", err);
        });
    }, [setFeedsResult]);

    const triggerAuth: (feedUrl: string, authenticationUrl: string) => void = (feedUrl, authenticationUrl) => {
        dispatch(customizationActions.triggerOpdsAuth.build(feedUrl, authenticationUrl));
    };

    const addFeedButton = () => {
        apiAction("opds/deleteFeed", feed.identifier).then(() => {
            apiAction("opds/addFeed", {
                title: feed.title,
                url: feed.url,
                favorite: !feed.favorite,
            }).catch((err) => {
                console.error("Error to fetch api opds/addFeed", err);
            });
        }).catch((err) => {
            console.error("Error to fetch api opds/deleteFeed", err);
        });
    };

    return (
        <li key={"feed-" + feed.identifier} className={stylesCatalogs.catalog_container}>
            <Link
                to={{
                    ...location,
                    pathname: buildOpdsBrowserRoute(
                        feed.identifier,
                        feed.title,
                        feed.url,
                    ),
                }}
                state={{ displayType: (location.state && (location.state as IRouterLocationState).displayType) ? (location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                className={stylesCatalogs.catalog_content}
                onClick={(e) => {
                    if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
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
                <div style={{ width: "100%", height: "50px", backgroundColor: "var(--color-gray-50", borderBottom: "1px solid var(--color-gray-300)", position: "absolute", top: "2px" }}>
                </div>
                <div className={stylesCatalogs.catalog_title}>
                    <SVG ariaHidden svg={GlobeIcon} className={stylesCatalogs.catalog_globe_icon} />
                    <p title={`${feed.title} --- ${feed.url}`}>{feed.title}</p>
                </div>
            </Link>
            <button onClick={addFeedButton}
                className={stylesCatalogs.button_favorites}>
                <SVG svg={StarIcon} ariaHidden className={feed.favorite ? stylesCatalogs.catalog_favorite_icon_true : stylesCatalogs.catalog_favorite_icon_false} />
            </button>
            {feed.authentified ? <FeedAuthentified feed={feed} logout={logout} loadFeeds={loadFeeds} __={__} />
                : feed.authenticationUrl ? <FeedAuthentification feed={feed} triggerAuth={triggerAuth} __={__} /> : <></>}
            <OpdsFeedUpdateForm trigger={(
                <button
                    className={stylesCatalogs.button_edit}
                    title={__("catalog.update")}
                >
                    <SVG ariaHidden={true} svg={EditIcon} />
                </button>
            )}
                feed={feed}
            />
            <DeleteOpdsFeedConfirm trigger={(
                <button
                    // onClick={(e) => this.deleteFeed(e, feed)}
                    className={stylesCatalogs.button_delete}
                    title={__("catalog.delete")}
                >
                    <SVG ariaHidden={true} svg={DeleteIcon} />
                </button>
            )} feed={feed} />
        </li >
    );
};

const FeedAuthentified = ({ feed, logout, loadFeeds, __ }: { feed: IOpdsFeedView, logout: (url: string) => void, loadFeeds: () => void, __: I18nFunction }) => {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    className={stylesCatalogs.button_login}
                    title={__("catalog.logout")}
                >
                    <SVG ariaHidden={true} svg={AvatarIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content /*collisionPadding={{ top: 180, bottom: 100 }}*/ avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                    <Popover.Close
                        onClick={() => {
                            logout(feed.url);
                            setTimeout(() => loadFeeds(), 100);
                        }}
                        title={__("catalog.logout")}
                    >
                        <SVG ariaHidden={true} svg={AvatarIcon} />
                        {__("catalog.logout")}
                    </Popover.Close>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

const FeedAuthentification = ({ feed, triggerAuth, __ }: { feed: IOpdsFeedView, triggerAuth: (feedUrl: string, authenticationUrl: string) => void, __: I18nFunction }) => {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    className={stylesCatalogs.button_login}
                    title={__("catalog.login")}
                >
                    <SVG ariaHidden={true} svg={AvatarIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content /*collisionPadding={{ top: 180, bottom: 100 }}*/ avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                    <Popover.Close
                        onClick={() => {
                            triggerAuth(feed.url, feed.authenticationUrl);
                            // setTimeout(() => loadFeeds(), 100);
                        }}
                        title={__("catalog.login")}
                    >
                        <SVG ariaHidden={true} svg={AvatarIcon} />
                        {__("catalog.login")}
                    </Popover.Close>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
