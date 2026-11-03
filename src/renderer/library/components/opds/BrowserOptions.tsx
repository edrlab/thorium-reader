// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as styles from "readium-desktop/renderer/assets/styles/components/opdsBrowserOptions.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import * as WishlistIcon from "readium-desktop/renderer/assets/icons/star-icon.svg";
import * as HistoryIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import * as ProfileIcon from "readium-desktop/renderer/assets/icons/person-fill.svg";
import * as RefreshIcon from "readium-desktop/renderer/assets/icons/refresh-icon.svg";
import * as LogoutIcon from "readium-desktop/renderer/assets/icons/export-icon.svg";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as React from "react";
import { shell } from "electron";
import { Button, Dialog, Heading, Menu, MenuItem, MenuTrigger, Modal, ModalOverlay, Popover, Separator } from "react-aria-components";
import { useLocation, useNavigate } from "react-router-dom";
import { historyActions } from "readium-desktop/common/redux/actions";
import { IOpdsBrowserOptions, OpdsBrowserLinks, opdsBrowserLinksFromView } from "readium-desktop/common/models/opdsBrowserOptions";
import { IOpdsUserProfile } from "readium-desktop/common/models/opdsUserProfile";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { apiState } from "readium-desktop/renderer/common/redux/api/api";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { OVERLAY_Z_INDEX, PopoverArrow } from "readium-desktop/renderer/common/components/overlayHelpers";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { BROWSE_OPDS_API_REQUEST_ID } from "readium-desktop/renderer/library/opds/constants";
import { buildOpdsBrowserRoute, parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";

export const BrowserOptions = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const route = parseOpdsBrowserRoute(location.pathname);
    const identifier = route?.rootFeedIdentifier;
    const result = useSelector((state: ILibraryRootState) => apiState(state)(BROWSE_OPDS_API_REQUEST_ID)("httpbrowser/browse")?.data?.result);
    const home = useSelector((state: ILibraryRootState) => state.opds.browser.header.start);
    const catalogTitle = useSelector((state: ILibraryRootState) => state.opds.browser.breadcrumb[1]?.name);
    const [open, setOpen] = React.useState(false);
    const [cached, setCached] = React.useState<{ identifier: string; links: OpdsBrowserLinks }>();
    const [custom, setCustom] = React.useState<{ identifier: string; links: Map<string, IOpdsLinkView> }>();
    const [checked, setChecked] = React.useState<{ result: typeof result; options: IOpdsBrowserOptions }>();
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const [profile, setProfile] = React.useState<IOpdsUserProfile>();
    const [profileLoading, setProfileLoading] = React.useState(false);
    const latestPath = React.useRef(location.pathname);
    latestPath.current = location.pathname;
    const matchesRoute = result?.url === route?.url || result?.responseUrl === route?.url || (route?.url.startsWith("apiapp://") && result?.url === "");
    const successful = matchesRoute && !!result?.isSuccess && !!result.data?.opds && !result.data.opds.auth;
    const currentUrl = (matchesRoute && result?.responseUrl) || route?.url;
    const links: OpdsBrowserLinks = { ...(cached?.identifier === identifier ? cached.links : {}),
        ...(successful ? opdsBrowserLinksFromView(result.data.opds.links) : {}) };

    const shelfUrl = links.shelf?.url;
    const customLinks = custom?.identifier === identifier ? custom?.links : undefined;

    React.useEffect(() => {
        setOpen(false); setChecked(undefined); setProfileOpen(false);
    }, [identifier, location.pathname]);
    React.useEffect(() => {
        if (!identifier || !successful) return;
        const observed = opdsBrowserLinksFromView(result.data.opds.links);
        setCached(previous => ({ identifier, links: { ...(previous?.identifier === identifier ? previous.links : {}), ...observed } }));
        const discovered = result.data.opds.links?.custom;
        if (discovered?.length) {
            setCustom(previous => {
                const links = new Map(previous?.identifier === identifier ? previous.links : undefined);
                for (const link of discovered) {
                    links.set(`custom:${link.url}`, link);
                }
                return { identifier, links };
            });
        }
    }, [identifier, result, successful]);
    React.useEffect(() => {
        if (!open || !identifier || !currentUrl) return undefined;
        let cancelled = false;
        setChecked(undefined);
        apiAction("opds/getBrowserOptions", identifier, currentUrl, shelfUrl).then(options => {
            if (cancelled) return;
            setCached(previous => ({ identifier, links: { ...(previous?.identifier === identifier ? previous.links : {}), ...options.links,
                ...(successful ? opdsBrowserLinksFromView(result.data.opds.links) : {}) } }));
            setChecked({ result, options });
        }).catch(() => { /* Refresh and already discovered links remain available. */ });
        return () => { cancelled = true; };
    }, [open, identifier, currentUrl, result, successful, shelfUrl]);
    const authenticated = successful && checked?.result === result && checked?.options.authenticated;
    const labels = { shelf: __("opds.shelf"), wishlist: __("opds.browserMenu.wishlist"),
        history: __("opds.browserMenu.history"), profile: __("opds.browserMenu.profile") };
    const showProfile = async () => {
        const path = location.pathname;
        setProfile(undefined); setProfileOpen(true); setProfileLoading(true);
        try {
            const value = await apiAction("opds/getUserProfile", identifier, links.profile.url);
            if (latestPath.current === path) setProfile(value);
        } catch { /* Show the existing unavailable-account message. */ }
        finally { setProfileLoading(false); }
    };
    const logout = async () => {
        const path = location.pathname;
        const catalogUrl = checked.options.catalogUrl;
        setLoggingOut(true);
        try {
            await apiAction("opds/logoutCatalog", identifier, currentUrl);
            if (latestPath.current !== path) return;
            setChecked(undefined); setCached(undefined); setCustom(undefined); setProfile(undefined); setProfileOpen(false);
            navigate(buildOpdsBrowserRoute(identifier, catalogTitle || "", catalogUrl), { state: location.state });
        } catch { /* The API supplies the translated failure notification. */ }
        finally { setLoggingOut(false); }
    };
    if (!route) return <></>;
    return <>
        <MenuTrigger isOpen={open} onOpenChange={setOpen}>
            <Button className={`${stylesDropDown.dropdown_trigger} ${open ? stylesDropDown.popover_open : ""}`} aria-label={__("opds.browserMenu.options")}>
                <SVG ariaHidden svg={MenuIcon} />
            </Button>
            <Popover placement="bottom end" offset={10} className={`${stylesDropDown.PopoverContent} ${styles.opds_options_popover}`} style={{ zIndex: OVERLAY_Z_INDEX }}>
                <Menu aria-label={__("opds.browserMenu.options")} className={`${stylesDropDown.dropdown_menu} ${styles.opds_options_menu} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`} onAction={key => {
                    if (key === "home" && home) { dispatchOpdsLink(dispatch)({ url: home, type: ContentType.Opds2 }, location, __("header.homeTitle")); return; }
                    if (key === "refresh") { dispatch(historyActions.refresh.build()); return; }
                    if (key === "logout") { void logout(); return; }
                    const customLink = customLinks?.get(String(key));
                    if (customLink) {
                        dispatchOpdsLink(dispatch)(customLink, location, customLink.title);
                        return;
                    }
                    const link = links[key as keyof OpdsBrowserLinks];
                    if (!link) return;
                    if (key === "profile" && parseContentType(link.type) === ContentType.OpdsProfile) { void showProfile(); return; }
                    dispatchOpdsLink(dispatch)({ ...link, type: link.type || (key === "profile" ? ContentType.Html : ContentType.Opds2) },
                        location, labels[key as keyof typeof labels]);
                }}>
                    {home && <MenuItem id="home" className={styles.opds_options_item}><SVG ariaHidden svg={HomeIcon} /><span>{__("header.homeTitle")}</span></MenuItem>}
                    {links.shelf && <MenuItem id="shelf" textValue={labels.shelf} className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={ShelfIcon} /><span>{labels.shelf}</span></MenuItem>}
                    {links.wishlist && <MenuItem id="wishlist" textValue={labels.wishlist} className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={WishlistIcon} /><span>{labels.wishlist}</span></MenuItem>}
                    {links.history && <MenuItem id="history" textValue={labels.history} className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={HistoryIcon} /><span>{labels.history}</span></MenuItem>}
                    {links.profile && <MenuItem id="profile" textValue={labels.profile} className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={ProfileIcon} /><span>{labels.profile}</span></MenuItem>}
                    {customLinks && Array.from(customLinks, ([id, link]) => (
                        <MenuItem key={id} id={id} textValue={link.title} className={styles.opds_options_item}>
                            <SVG ariaHidden svg={CatalogsIcon} /><span>{link.title}</span>
                        </MenuItem>
                    ))}
                    {(Object.keys(links).length > 0 || !!customLinks?.size) && <Separator className={styles.opds_options_separator} />}
                    <MenuItem id="refresh" className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={RefreshIcon} /><span>{__("header.refreshTitle")}</span></MenuItem>
                    {authenticated && <MenuItem id="logout" isDisabled={loggingOut} className={`${styles.opds_options_item} R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE`}><SVG ariaHidden svg={LogoutIcon} /><span>{__("catalog.logout")}</span></MenuItem>}
                </Menu>
                <PopoverArrow className={stylesDropDown.PopoverArrow} aria-hidden />
            </Popover>
        </MenuTrigger>
        <ModalOverlay isOpen={profileOpen} onOpenChange={setProfileOpen} isDismissable className={styles.opds_profile_overlay} style={{ zIndex: OVERLAY_Z_INDEX }}>
            <Modal className={styles.opds_profile_dialog}>
                <Dialog aria-label={__("catalog.userProfile.title")}>
                    <Heading slot="title">{__("catalog.userProfile.title")}</Heading>
                    {profileLoading ? <p role="status">{__("catalog.userProfile.loading")}</p> : !profile
                        ? <p role="status">{__("catalog.userProfile.unavailable")}</p> : <>
                            {profile.name && <h3>{profile.name}</h3>}
                            {profile.email && <p>{profile.email}</p>}
                            {profile.loans?.available !== undefined && <p>{__("catalog.userProfile.loans")}: {__("catalog.userProfile.available", { count: profile.loans.available })}</p>}
                            {profile.holds?.available !== undefined && <p>{__("catalog.userProfile.holds")}: {__("catalog.userProfile.available", { count: profile.holds.available })}</p>}
                            {profile.editUrl && <Button onPress={() => { void shell.openExternal(profile.editUrl).catch(() => {}); }}>{__("catalog.userProfile.edit")}</Button>}
                        </>}
                    <Button onPress={() => setProfileOpen(false)}>{__("accessibility.closeDialog")}</Button>
                </Dialog>
            </Modal>
        </ModalOverlay>
    </>;
};
