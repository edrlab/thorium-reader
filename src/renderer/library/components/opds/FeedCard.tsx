// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

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
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { Link, useNavigate } from "react-router-dom";

interface IFeedCardProps {
    feed: IOpdsFeedView;
    onClick?: (feed: IOpdsFeedView) => void;
    location: any;
    setFeedsResult?: (feedsResult: IOpdsFeedView[]) => void;
}

export const FeedCard: React.FC<IFeedCardProps> = (props) => {
    const { feed, setFeedsResult, location } = props;
    const [__] = useTranslator();
    const [iconHasError, setIconHasError] = React.useState(false);
    const catalogIcon = feed.icon && !iconHasError ? feed.icon : undefined;

    React.useEffect(() => {
        setIconHasError(false);
    }, [feed.icon]);

    const loadFeeds = React.useCallback(() => {
        apiAction("opds/findAllFeeds").then((feedsResult) => {
            if (setFeedsResult) {
                setFeedsResult(feedsResult);
            }
        }).catch((err) => {
            console.error("Error to fetch api opds/findAllFeeds", err);
        });
    }, [setFeedsResult]);

    const navigate = useNavigate();
    const [openingBookshelf, setOpeningBookshelf] = React.useState(false);
    const openBookshelf = async () => {
        setOpeningBookshelf(true);
        try {
            const url = await apiAction("opds/getBookshelfUrl", feed.identifier);
            navigate(buildOpdsBrowserRoute(feed.identifier, __("opds.shelf"), url), {
                state: { displayType: location.state?.displayType || DisplayType.Grid },
            });
        } catch (err) {
            console.error("Error opening OPDS bookshelf", err);
        } finally {
            setOpeningBookshelf(false);
        }
    };

    const setFeedFavoriteButton = () => {
        apiAction("opds/setFeedFavorite", feed.identifier, !feed.favorite).then(() => {
            loadFeeds();
        }).catch((err) => {
            console.error("Error to fetch api opds/setFeedFavorite", err);
        });
    };

    return (
        <li
            key={"feed-" + feed.identifier}
            className={stylesCatalogs.catalog_container}
            data-color={feed.color}
        >
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
                <div className={stylesCatalogs.catalog_color_band} />
                <div className={stylesCatalogs.catalog_title}>
                    {catalogIcon ?
                        <img
                            aria-hidden={true}
                            alt=""
                            className={stylesCatalogs.catalog_icon_image}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            src={catalogIcon}
                            onError={() => setIconHasError(true)}
                        />
                        : <SVG ariaHidden svg={GlobeIcon} />
                    }
                    <p title={`${feed.title} --- ${feed.url}`}>{feed.title}</p>
                </div>
            </Link>
            <button onClick={setFeedFavoriteButton}
                aria-label={__("accessibility.favoriteCatalog", { title: feed.title })}
                aria-pressed={!!feed.favorite}
                className={stylesCatalogs.button_favorites}>
                <SVG svg={StarIcon} ariaHidden className={feed.favorite ? stylesCatalogs.catalog_favorite_icon_true : stylesCatalogs.catalog_favorite_icon_false} />
            </button>
            {feed.authenticationUrl &&
                <button className={stylesCatalogs.button_login} title={__("opds.shelf")} aria-label={__("opds.shelf")}
                    disabled={openingBookshelf} onClick={() => { void openBookshelf(); }}>
                    <SVG ariaHidden={true} svg={AvatarIcon} />
                </button>}
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
