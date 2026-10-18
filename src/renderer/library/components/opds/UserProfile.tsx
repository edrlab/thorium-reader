// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { shell } from "electron";
import type { IOpdsUserProfile } from "readium-desktop/common/models/opdsUserProfile";
import type { I18nFunction } from "readium-desktop/common/services/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

export const UserProfile = ({ identifier, __, onBookshelf }: { identifier: string; __: I18nFunction; onBookshelf?: (url: string | undefined) => void }) => {
    const [profile, setProfile] = React.useState<IOpdsUserProfile | undefined>();
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        let active = true;
        setProfile(undefined);
        setLoading(true);
        apiAction("opds/getUserProfile", identifier).then((value) => {
            if (active) {
                setProfile(value);
                onBookshelf?.(value?.bookshelfUrl);
            }
        }).catch(() => { /* Profile support is optional. */ }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [identifier, onBookshelf]);
    return loading ? <p role="status">{__("catalog.userProfile.loading")}</p> :
        profile ? <UserProfileDetails profile={profile} __={__} /> : <p>{__("catalog.userProfile.unavailable")}</p>;
};

export const UserProfileDetails = ({ profile, __ }: { profile: IOpdsUserProfile; __: I18nFunction }) => {
    return <section aria-label={__("catalog.userProfile.title")} style={{ paddingBottom: "20px", overflowWrap: "anywhere" }}>
        {profile.name && <p>{profile.name}</p>}
        {profile.email && <p>{profile.email}</p>}
        {(["loans", "holds"] as const).map((kind) => {
            const quota = profile[kind];
            return quota && (quota.available !== undefined || quota.total !== undefined) ? <div key={kind} style={{ margin: "16px 0" }}>
                <h4 style={{ margin: "0 0 8px" }}>{__(`catalog.userProfile.${kind}`)}</h4>
                {quota.available !== undefined && quota.total !== undefined && quota.available <= quota.total ?
                    <p>{__("catalog.userProfile.used", { used: quota.total - quota.available, total: quota.total })}</p> : <>
                {quota.available !== undefined && <p>{__("catalog.userProfile.available", { count: quota.available })}</p>}
                {quota.total !== undefined && <p>{__("catalog.userProfile.total", { count: quota.total })}</p>}
                </>}
            </div> : undefined;
        })}
        {profile.editUrl && <button className={stylesButtons.button_secondary_blue} onClick={() => { shell.openExternal(profile.editUrl).catch(() => { /* Browser unavailable. */ }); }}>
            {__("catalog.userProfile.edit")}
        </button>}
    </section>;
};
