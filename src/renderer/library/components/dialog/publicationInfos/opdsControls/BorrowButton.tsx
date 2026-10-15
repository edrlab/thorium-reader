// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useDispatch } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";

export const BorrowButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    link: IOpdsLinkView;
    navigate: () => void;
}> = ({ link, navigate, disabled, ...props }) => {
    const dispatch = useDispatch();
    const [__] = useTranslator();
    const [response, browse] = useApi(undefined, "httpbrowser/browse");
    const [pending, setPending] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    const submitted = React.useRef(false);
    const previousResponse = React.useRef(response?.data);
    React.useEffect(() => {
        if (!submitted.current || !response?.data || response.data === previousResponse.current) return;
        submitted.current = false;
        setPending(false);
        const result = response.data.result;
        const contentType = parseContentType(result?.contentType);
        // Authentication documents must still reach the OPDS browser, including on HTTP 401.
        if (!response.data.error && result?.data?.opds?.auth) {
            navigate();
        } else if (!response.data.error && result?.isSuccess) {
            const publication = result.data?.opds?.publications?.[0];
            if (contentType === ContentType.Opds2Pub && publication) {
                dispatch(dialogActions.updateRequest.build<DialogTypeName.PublicationInfoOpds>({ publication }));
            } else if (contentType !== ContentType.Opds2Pub &&
                (result.data?.opds || contentType === ContentType.Html)) {
                navigate();
            } else {
                setFailed(true);
            }
        } else {
            setFailed(true);
        }
    }, [response, dispatch, navigate]);
    return <>
        <button {...props} disabled={disabled || pending} onClick={() => {
            if (submitted.current) return;
            if (parseContentType(link.type) !== ContentType.Opds2Pub) {
                navigate();
                return;
            }
            submitted.current = true;
            previousResponse.current = response?.data;
            setPending(true);
            setFailed(false);
            browse(link.url);
        }} />
        {failed ? <p role="alert">{__("opds.network.error")}</p> : undefined}
    </>;
};
