// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useDispatch } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

export const CancelHold: React.FC<{ url: string }> = ({ url }) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const [response, cancel] = useApi(undefined, "httpbrowser/browse");
    const [pending, setPending] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    const submitted = React.useRef(false);
    React.useEffect(() => {
        if (!submitted.current || !response?.data) return;
        submitted.current = false;
        setPending(false);
        const result = response.data.result;
        const publication = result?.data?.opds?.publications?.[0];
        if (!response.data.error && result?.isSuccess && publication) {
            dispatch(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>({ publication }));
        } else {
            setFailed(true);
        }
    }, [response, dispatch]);
    return <>
        <button className={stylesButtons.button_secondary} disabled={pending} onClick={() => {
            if (submitted.current) return;
            submitted.current = true;
            setPending(true);
            setFailed(false);
            cancel(url, "DELETE");
        }}>{__("opds.menu.cancelHold")}</button>
        {failed ? <p role="alert">{__("opds.menu.cancelHoldError")}</p> : undefined}
    </>;
};
