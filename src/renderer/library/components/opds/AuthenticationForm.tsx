// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import { shell } from "electron";
import * as React from "react";
import { useDispatch } from "react-redux";
import { authActions } from "readium-desktop/common/redux/actions";
import { IOpdsAuthView } from "readium-desktop/common/views/opds";
import { TranslatorProps } from "readium-desktop/renderer/common/components/hoc/translator";

export const AuthenticationForm = ({ auth, __ }: { auth: IOpdsAuthView } & TranslatorProps) => {
    const dispatch = useDispatch();
    const [pending, setPending] = React.useState(false);
    React.useEffect(() => setPending(false), [auth]);
    const openExternal = (url: string) => {
        if (/^https?:\/\//.test(url)) shell.openExternal(url).catch(() => { /* Browser unavailable. */ });
    };
    return <form onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        dispatch(authActions.submit.build(auth.credentialsUrl, String(values.get("login")), String(values.get("password"))));
        form.reset();
        setPending(true);
    }}>
        {auth.logoImageUrl && <img src={auth.logoImageUrl} alt="" />}
        {auth.helpUrls?.map(url => <p key={url}><button type="button" onClick={() => openExternal(url)}>{url}</button></p>)}
        <p><label>{auth.labelLogin || __("catalog.opds.auth.login")}
            <input name="login" type="text" autoComplete="username" required disabled={pending} />
        </label></p>
        <p><label>{auth.labelPassword || __("catalog.opds.auth.password")}
            <input name="password" type="password" autoComplete="current-password" required disabled={pending} />
        </label></p>
        {auth.registerUrl && <p><button type="button" onClick={() => openExternal(auth.registerUrl)}>{__("catalog.opds.auth.register")}</button></p>}
        <button className={stylesButtons.button_primary_blue} type="submit" disabled={pending}>{__("catalog.opds.auth.login")}</button>
    </form>;
};

