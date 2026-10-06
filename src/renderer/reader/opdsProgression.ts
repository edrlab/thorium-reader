// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";
import { IReadiumPositionList, mapLocatorToReadiumPosition } from "readium-desktop/common/readium/positions";

export interface ISpineLinkForProgression {
    Href?: string;
}

const LAST_RESOURCE_SAFE_PROGRESSION = 0.95;

/**
 * Converts publication-wide progression into Readium's resource locator.
 * Uses the reader's Readium position weights when available, retaining equal
 * spine weights for publications without a Readium position list.
 */
export const opdsProgressionToLocator = (
    progression: number,
    spine: readonly ISpineLinkForProgression[] | undefined,
    positionList?: IReadiumPositionList,
): Locator | undefined => {
    if (!Number.isFinite(progression) || progression < 0 || progression > 1) {
        return undefined;
    }

    if (positionList && positionList.total > 0 && positionList.resources.length) {
        const scaledProgression = progression * positionList.total;
        const resource = progression === 1
            ? positionList.resources[positionList.resources.length - 1]
            : positionList.resources.find((candidate) =>
                scaledProgression >= candidate.firstPosition - 1 &&
                scaledProgression < candidate.firstPosition - 1 + candidate.positionCount,
            );
        if (!resource?.href || resource.positionCount <= 0) {
            return undefined;
        }

        return mapLocatorToReadiumPosition({
            href: resource.href,
            title: resource.title,
            type: resource.type,
            locations: {
                progression: progression === 1 ? LAST_RESOURCE_SAFE_PROGRESSION :
                    (scaledProgression - (resource.firstPosition - 1)) / resource.positionCount,
            },
        }, positionList);
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
