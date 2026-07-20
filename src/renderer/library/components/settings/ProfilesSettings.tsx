// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { customizationActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as Popover from "@radix-ui/react-popover";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import moment from "moment";
import * as ThoriumIcon from "readium-desktop/renderer/assets/icons/thorium.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";

const Profiles = () => {

    const { provision: packageProfileProvisioned, activate: { id: profileActivatedId } } = useSelector((s: ICommonRootState) => s.customization);
    const selectedProfile = packageProfileProvisioned.find(({id}) => id && id === profileActivatedId);
    const dispatch = useDispatch();
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);

    return (
        <>
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.profiles.info")}</p>
            </div>
            <div
                className={stylesSettings.profile_selection_form}
                role="radiogroup"
            >
                {
                    packageProfileProvisioned.map((profile, index) => {
                        const profileTitle = convertMultiLangStringToString(profile.title, locale) || __("catalog.customization.fallback.title");
                        const profileDescription = convertMultiLangStringToString(profile.description, locale) || __("catalog.customization.fallback.description");

                        return (
                            <div
                                key={`customization-thorium-${index}`}
                                className={classNames(stylesSettings.profile_selection_input, selectedProfile?.id === profile.id ? stylesSettings.profile_selection_input_checked : "")}
                            >
                                <input
                                    type="radio"
                                    id={profile.id}
                                    value={profile.fileName}
                                    name={profileTitle}
                                    checked={selectedProfile?.id === profile.id}
                                    onChange={(e) => {
                                        console.log("PROFILE Input change", e);
                                        dispatch(customizationActions.activating.build(profile.id));
                                    }}
                                    aria-label={profile.id}
                                />
                                <label htmlFor={profile.id} className={stylesSettings.profile_selection_label}>
                                    { profile.logoUrl ? <img src={profile.logoUrl} alt="" /> : <></> }
                                    <div
                                        className={stylesSettings.profile_selection_description}
                                        role="radio"
                                        onKeyDown={(e) => {
                                            if (e.key === " ") {
                                                console.log("PROFILE Input change", e);
                                                dispatch(customizationActions.activating.build(profile.id));
                                            }
                                        }}
                                        onKeyUp={(e) => {
                                            if (e.key === " ") {
                                                e.preventDefault();
                                                console.log("PROFILE Input change", e);
                                                dispatch(customizationActions.activating.build(profile.id));
                                            }
                                        }}
                                    >
                                        <div>
                                            <h5>{profileTitle}</h5>
                                            <p>{profileDescription}</p>
                                            <div style={{ fontSize: "12px" }}>
                                                {/* <span>Filename: {profile.fileName}</span><br/>
                                            <span>Identifier: {profile.id}</span><br/> */}
                                                <span>{__("settings.profiles.version", { version: moment(profile.version).toISOString() })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                                <div className={stylesSettings.delete_profile_button} style={{ display: "flex", flexDirection: "row-reverse", width: "100%", margin: "-5px", zIndex: "10" }}>
                                    <Popover.Root>
                                        <Popover.Trigger asChild>
                                            <button
                                                style={{ width: "16px", height: "16px" }}
                                                title={__("catalog.delete")}
                                            >
                                                <SVG ariaHidden={true} svg={DeleteIcon} />
                                            </button>
                                        </Popover.Trigger>
                                        <Popover.Portal>
                                            <Popover.Content /* collisionPadding={{ top: 180, bottom: 100 }} */ avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesPopoverDialog.delete_item}>
                                                <Popover.Close dir={isRTL ? "rtl" : "ltr"}
                                                    onClick={() => {
                                                        dispatch(customizationActions.deleteProfile.build(profile.fileName));
                                                    }}
                                                    title={__("catalog.delete")}
                                                >
                                                    <SVG ariaHidden={true} svg={DeleteIcon} />
                                                    {__("reader.marks.delete")}
                                                </Popover.Close>
                                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                </div>
                            </div>
                        );
                    })
                }

                <div
                    key={"customization-thorium_vanilla"}
                    className={classNames(stylesSettings.profile_selection_input,  selectedProfile?.id ? "" : stylesSettings.profile_selection_input_checked)}
                >
                    <input
                        type="radio"
                        id="customization-thorium-vanilla"
                        value={__("settings.profiles.thorium.title")}
                        name={__("settings.profiles.thorium.title")}
                        checked={!selectedProfile}
                        onChange={(e) => {
                            console.log("PROFILE Input change", e);
                            dispatch(customizationActions.activating.build(""));
                        }}
                        aria-label={__("settings.profiles.thorium.title")}
                    />
                    <label htmlFor="customization-thorium-vanilla" className={stylesSettings.profile_selection_label}>
                        <SVG ariaHidden svg={ThoriumIcon} />
                        <div
                            className={stylesSettings.profile_selection_description}
                            role="radio"
                            onKeyDown={(e) => {
                                if (e.key === " ") {
                                    console.log("PROFILE Input change", e);
                                    dispatch(customizationActions.activating.build(""));
                                }
                            }}
                            onKeyUp={(e) => {
                                if (e.key === " ") {
                                    e.preventDefault();
                                    console.log("PROFILE Input change", e);
                                    dispatch(customizationActions.activating.build(""));
                                }
                            }}
                        >
                            <div>
                                <h5 dir={isRTL ? "rtl" : "ltr"}>{__("settings.profiles.thorium.title")}</h5>
                                <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.profiles.thorium.description")}</p>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </>
    );
};

export default Profiles;
