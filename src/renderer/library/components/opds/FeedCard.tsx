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
import { OVERLAY_Z_INDEX, PopoverArrow } from "readium-desktop/renderer/common/components/overlayHelpers";
import { FocusScope } from "react-aria";
import { DialogTrigger, Pressable, Popover, Dialog as PopoverDialog, Button } from "react-aria-components";
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
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { authActions, customizationActions } from "readium-desktop/common/redux/actions";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { Link, useNavigate } from "react-router-dom";
import * as AccountDialog from "readium-desktop/renderer/common/components/Dialog";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import { UserProfile } from "./UserProfile";

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
    const [iconHasError, setIconHasError] = React.useState(false);
    const catalogIcon = feed.icon && !iconHasError ? feed.icon : undefined;

    React.useEffect(() => {
        setIconHasError(false);
    }, [feed.icon]);

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
                className={stylesCatalogs.button_favorites}>
                <SVG svg={StarIcon} ariaHidden className={feed.favorite ? stylesCatalogs.catalog_favorite_icon_true : stylesCatalogs.catalog_favorite_icon_false} />
            </button>
            {feed.authentified ? <FeedAuthentified feed={feed} logout={logout} __={__} />
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

const FeedAuthentified = ({ feed, logout, __ }: { feed: IOpdsFeedView, logout: (url: string) => void, __: I18nFunction }) => {
    const navigate = useNavigate();
    const [bookshelf, setBookshelf] = React.useState<string | undefined>();
    return <AccountDialog.Root>
        <AccountDialog.Trigger asChild>
            <button className={stylesCatalogs.button_login} title={__("catalog.userProfile.title")} aria-label={__("catalog.userProfile.title")}>
                <SVG ariaHidden={true} svg={AvatarIcon} />
            </button>
        </AccountDialog.Trigger>
        <AccountDialog.Portal className={stylesModals.modal_dialog_overlay}>
            <AccountDialog.Content className={stylesModals.modal_dialog} aria-describedby={undefined} style={{ width: "560px", minHeight: "unset" }}>
                <div className={stylesModals.modal_dialog_header}>
                    <AccountDialog.Title>{__("catalog.userProfile.title")}</AccountDialog.Title>
                    <AccountDialog.Close asChild>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </AccountDialog.Close>
                </div>
                <div className={stylesModals.modal_dialog_body} style={{ justifyContent: "flex-start" }}>
                    <h3 style={{ overflowWrap: "anywhere" }}>{feed.title}</h3>
                    <UserProfile identifier={feed.identifier} __={__} onBookshelf={setBookshelf} />
                </div>
                <div className={stylesModals.modal_dialog_footer} style={{ gap: "12px" }}>
                    {bookshelf && <AccountDialog.Close asChild>
                        <button className={stylesButtons.button_primary_blue} onClick={() => navigate(buildOpdsBrowserRoute(feed.identifier, __("opds.shelf"), bookshelf))}>
                            {__("catalog.userProfile.bookshelf")}
                        </button>
                    </AccountDialog.Close>}
                    <AccountDialog.Close asChild>
                        <button className={stylesButtons.button_secondary_blue} onClick={() => logout(feed.url)}>{__("catalog.logout")}</button>
                    </AccountDialog.Close>
                </div>
            </AccountDialog.Content>
        </AccountDialog.Portal>
    </AccountDialog.Root>;
};

const FeedAuthentification = ({ feed, triggerAuth, __ }: { feed: IOpdsFeedView, triggerAuth: (feedUrl: string, authenticationUrl: string) => void, __: I18nFunction }) => {
    return (
        <DialogTrigger>
            <Pressable>
                <button className={stylesCatalogs.button_login} title={__("catalog.login")}>
                    <SVG ariaHidden={true} svg={AvatarIcon} />
                </button>
            </Pressable>
            <Popover
                placement="bottom"
                offset={5}
                crossOffset={-10}
                className={stylesPopoverDialog.delete_item}
                style={{ zIndex: OVERLAY_Z_INDEX }}
            >
                <PopoverDialog>
                    <FocusScope autoFocus>
                        <Button
                            slot="close"
                            onPress={() => {
                                triggerAuth(feed.url, feed.authenticationUrl);
                            }}
                            render={(buttonProps) => <button {...buttonProps} title={__("catalog.login")} />}
                        >
                            <SVG ariaHidden={true} svg={AvatarIcon} />
                            {__("catalog.login")}
                        </Button>
                        <PopoverArrow className={stylesDropDown.PopoverArrow} aria-hidden />
                    </FocusScope>
                </PopoverDialog>
            </Popover>
        </DialogTrigger>
    );
};
