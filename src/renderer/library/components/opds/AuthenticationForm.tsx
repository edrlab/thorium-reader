// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as styles from "readium-desktop/renderer/assets/styles/components/opdsAuthentication.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import { shell } from "electron";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { handOffBrowseResponse } from "readium-desktop/renderer/library/opds/browseResponse";
import { useDispatch } from "react-redux";
import { authActions } from "readium-desktop/common/redux/actions";
import { IOpdsAuthView } from "readium-desktop/common/views/opds";
import { TranslatorProps } from "readium-desktop/renderer/common/components/hoc/translator";
import { subscribeToAction } from "readium-desktop/renderer/common/redux/middleware/actionSubscriber";

export const AuthenticationForm = ({ auth, __ }: { auth: IOpdsAuthView } & TranslatorProps) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const [pending, setPending] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => {
        setPending(false);
    }, [auth]);
    React.useEffect(() => subscribeToAction(authActions.submitted.ID, action => {
        const { payload } = action as authActions.submitted.TAction;
        if (payload.credentialsUrl === auth.credentialsUrl) {
            if (payload.result) {
                handOffBrowseResponse(location.pathname, payload.result);
            }
            setPending(false);
            setFailed(payload.failed);
        }
    }), [auth.credentialsUrl, location.pathname]);
    const openExternal = (url: string) => {
        if (/^https?:\/\//i.test(url)) {
            shell.openExternal(url).catch(() => { /* Browser unavailable. */ });
        }
    };
    return <form className={styles.authentication} aria-busy={pending} onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const values = new FormData(form);
        setPending(true);
        setFailed(false);
        dispatch(authActions.submit.build(auth.credentialsUrl, String(values.get("login")), String(values.get("password")), {
            authenticationType: auth.authenticationType, authenticationId: auth.authenticationId,
            oauthUrl: auth.oauthUrl, oauthRefreshUrl: auth.oauthRefreshUrl,
        }));
        form.reset();
    }}>
        {failed && <p className={styles.error} role="alert">{__("message.notifications.authenticationFailed")}</p>}
        <header className={styles.header}>
            {auth.logoImageUrl && <img src={auth.logoImageUrl} alt="" />}
            <h2>{__("catalog.opds.auth.login")}</h2>
        </header>

        <p className={styles.field}><label>{auth.labelLogin || __("catalog.opds.auth.login")}
            <input name="login" type="text" autoComplete="username" required disabled={pending} />
        </label></p>
        <p className={styles.field}><label>{auth.labelPassword || __("catalog.opds.auth.password")}
            <input name="password" type="password" autoComplete="current-password" required disabled={pending} />
        </label></p>
        <button className={stylesButtons.button_primary_blue} type="submit" disabled={pending}>{__("catalog.opds.auth.login")}</button>
        {(auth.registerUrl || auth.helpUrls?.length > 0) && <footer className={styles.links}>
            {auth.registerUrl && <button type="button" onClick={() => openExternal(auth.registerUrl)}>{__("catalog.opds.auth.register")}</button>}
            {auth.helpUrls?.map(url => <button key={url} type="button" onClick={() => openExternal(url)}>{url}</button>)}
        </footer>}
    </form>;
};
