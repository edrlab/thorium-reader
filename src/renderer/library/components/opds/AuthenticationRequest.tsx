// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { authActions } from "readium-desktop/common/redux/actions";
import { TranslatorProps } from "readium-desktop/renderer/common/components/hoc/translator";
import { AuthenticationForm } from "./AuthenticationForm";
import { ExternalAuthentication } from "./ExternalAuthentication";

export const AuthenticationRequest = ({ request, children, __ }: {
    request?: authActions.prompt.TAction["payload"];
    children?: React.ReactNode;
} & TranslatorProps) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const heading = React.useRef<HTMLHeadingElement>(null);
    const requestId = request?.requestId;
    React.useEffect(() => {
        if (!requestId) return undefined;
        const previousFocus = document.activeElement as HTMLElement;
        heading.current?.focus();
        return () => {
            if (previousFocus?.isConnected) previousFocus.focus();
            dispatch(authActions.promptResult.build(requestId, false));
        };
    }, [dispatch, requestId, location.key]);
    return <>
        {request && <section key={request.requestId}>
            <h1 ref={heading} tabIndex={-1}>{request.view.title || __("catalog.opds.auth.login")}</h1>
            {request.view.auth.external
                ? <ExternalAuthentication auth={request.view.auth} promptId={request.requestId} __={__} />
                : <AuthenticationForm auth={request.view.auth} promptId={request.requestId} __={__} />}
        </section>}
        <div hidden={!!request} style={request ? undefined : { display: "contents" }}>{children}</div>
    </>;
};
