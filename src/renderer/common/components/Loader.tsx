// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesLoader from "readium-desktop/renderer/assets/styles/loader.scss";

import * as React from "react";
import * as LoaderIcon from "readium-desktop/renderer/assets/icons/loader.svg";
import { VisuallyHidden } from "react-aria-components";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

import SVG from "./SVG";

export default function Loader({ active = true, announce = true, className = stylesLoader.loader }: {
    active?: boolean;
    announce?: boolean;
    className?: string;
}) {
    const [__] = useTranslator();
    return (
        <div className={active ? className : undefined} role={announce ? "status" : undefined} aria-atomic={announce ? true : undefined}>
            {active && <SVG ariaHidden={true} svg={LoaderIcon} />}
            {announce && <VisuallyHidden>{active ? __("accessibility.loading") : ""}</VisuallyHidden>}
        </div>
    );
}
