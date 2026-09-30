// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";

export interface ISpineLinkForProgression {
    Href?: string;
}

const LAST_RESOURCE_SAFE_PROGRESSION = 0.95;

/**
 * Converts publication-wide progression into Readium's resource locator.
 * Each spine item has equal weight because OPDS Progression 1.0 does not
 * provide a content-length model.
 */
export const opdsProgressionToLocator = (
    progression: number,
    spine: readonly ISpineLinkForProgression[] | undefined,
): Locator | undefined => {
    if (!Number.isFinite(progression) || progression < 0 || progression > 1) {
        return undefined;
    }

    const readableSpine = spine?.filter(
        (link): link is ISpineLinkForProgression & { Href: string } =>
            typeof link.Href === "string" && link.Href.length > 0,
    );
    if (!readableSpine?.length) {
        return undefined;
    }

    const scaledProgression = progression * readableSpine.length;
    const spineIndex = progression === 1
        ? readableSpine.length - 1
        : Math.floor(scaledProgression);
    const resourceProgression = progression === 1
        // Thorium's existing end-of-publication navigation uses 0.95 because
        // 1 can select trailing blank CSS columns in reflowable EPUBs.
        ? LAST_RESOURCE_SAFE_PROGRESSION
        : scaledProgression - spineIndex;

    return {
        href: readableSpine[spineIndex].Href,
        locations: {
            progression: resourceProgression,
        },
    };
};
