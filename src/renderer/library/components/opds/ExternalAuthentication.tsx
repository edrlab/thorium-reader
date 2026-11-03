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
import { useDispatch } from "react-redux";
import { authActions } from "readium-desktop/common/redux/actions";
import { IOpdsAuthView } from "readium-desktop/common/views/opds";
import { TranslatorProps } from "readium-desktop/renderer/common/components/hoc/translator";
import { subscribeToAction } from "readium-desktop/renderer/common/redux/middleware/actionSubscriber";

export const ExternalAuthentication = ({ auth, catalogIdentifier, __ }: { auth: IOpdsAuthView; catalogIdentifier?: string } & TranslatorProps) => {
    const dispatch = useDispatch();
    const requestId = React.useId();
    const [status, setStatus] = React.useState<authActions.externalStatus.Status>("preparing");
    const [authorizationUrl, setAuthorizationUrl] = React.useState<string>();
    React.useEffect(() => {
        const unsubscribe = subscribeToAction(authActions.externalStatus.ID, action => {
            const { payload } = action as authActions.externalStatus.TAction;
            if (payload.requestId !== requestId) return;
            setStatus(payload.status);
            setAuthorizationUrl(payload.authorizationUrl);
        });
        setStatus("preparing");
        setAuthorizationUrl(undefined);
        dispatch(authActions.externalRequest.build(auth.credentialsUrl, requestId, "start", catalogIdentifier));
        return () => {
            unsubscribe();
            dispatch(authActions.externalRequest.build(auth.credentialsUrl, requestId, "cancel"));
        };
    }, [auth.credentialsUrl, catalogIdentifier, dispatch, requestId]);
    const openExternal = () => {
        if (authorizationUrl && /^https?:\/\//i.test(authorizationUrl)) {
            shell.openExternal(authorizationUrl).catch(() => setStatus("failed"));
        }
    };
    return <section className={styles.authentication} aria-busy={status === "preparing"}>
        <header className={styles.header}>
            {auth.logoImageUrl && <img src={auth.logoImageUrl} alt="" />}
            <h2>{__("catalog.opds.auth.login")}</h2>
        </header>
        <div role="status" aria-live="polite" className={styles.message}>
            {status === "failed" ? <p className={styles.error}>{__("message.notifications.authenticationFailed")}</p>
                : status === "expired" ? <p className={styles.error}>{__("opds.network.timeout")}</p>
                : <p>{__("catalog.opds.auth.external")}</p>}
        </div>
        <hr className={styles.separator} />
        <p className={styles.message}>{__("catalog.opds.auth.externalBrowserInstructions")}</p>
        <button className={stylesButtons.button_primary_blue} type="button" title={authorizationUrl}
            disabled={!authorizationUrl || status === "preparing" || status === "complete"}
            onClick={openExternal}>{__("catalog.opds.auth.openExternalBrowser")}</button>
        <hr className={styles.separator} />
        <p className={styles.message}>{__("catalog.opds.auth.fallback")}</p>
        <button className={stylesButtons.button_secondary_blue} type="button"
            disabled={status === "preparing" || status === "complete"} onClick={() => {
                setStatus("preparing");
                dispatch(authActions.externalRequest.build(auth.credentialsUrl, requestId, "retry", catalogIdentifier));
            }}>{__("catalog.opds.auth.alternativeLogin")}</button>
        <hr className={styles.separator} />
        <footer className={styles.links}>
            <button type="button" onClick={() => {
                dispatch(authActions.externalRequest.build(auth.credentialsUrl, requestId, "cancel"));
                dispatch(authActions.cancel.build());
            }}>{__("catalog.opds.auth.cancel")}</button>
        </footer>
    </section>;
};
