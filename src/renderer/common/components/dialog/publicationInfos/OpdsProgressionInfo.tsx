// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

// Mounted with the service URL as key so a late response cannot describe another publication.
export const OpdsProgressionInfo: React.FC<{ url?: string }> = ({ url }) => {
    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const [response, check] = useApi(undefined, "opds/getProgressionServiceStatus");
    React.useEffect(() => {
        if (url) check(url, locale);
    }, [url, locale, check]);

    const result = response?.data;
    const status = result?.result;
    const document = status?.status === "ready" ? status.document : undefined;
    const message = !url ? __("publication.remoteProgression.disabled")
        : !result ? __("publication.remoteProgression.checking")
        : result.error || status?.status !== "ready" ? __("publication.remoteProgression.unavailable")
        : __("publication.remoteProgression.ready");

    return <p role="status">
        <strong>{__("publication.remoteProgression.title")} </strong>
        {message}
        {document ? <> {__("publication.remoteProgression.position", {
            percent: Math.round(document.progression * 100),
            device: document.device.name,
        })}</> : status?.status === "ready" ? <> {__("publication.remoteProgression.empty")}</> : undefined}
    </p>;
};
