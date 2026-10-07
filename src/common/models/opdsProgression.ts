// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";
import type { Link } from "@r2-shared-js/models/publication-link";

import { IReadiumPositionList, mapLocatorToReadiumPosition } from "readium-desktop/common/readium/positions";

export const OPDS_PROGRESSION_REL = "http://opds-spec.org/progression";
export const OPDS_PROGRESSION_MEDIA_TYPE = "application/opds-progression+json";

export interface IOpdsProgressionDevice {
    id: string;
    name: string;
}

export interface IOpdsProgressionDocument {
    title?: string;
    modified: string;
    device: IOpdsProgressionDevice;
    progression: number;
    references?: string[];
}

const LAST_RESOURCE_SAFE_PROGRESSION = 0.95;

const getReadableSpine = (
    spine: readonly Partial<Pick<Link, "Href">>[] | undefined,
): Array<Pick<Link, "Href">> | undefined => {
    const readableSpine = spine?.filter(
        (link): link is Pick<Link, "Href"> =>
            typeof link.Href === "string" && link.Href.length > 0,
    );

    return readableSpine?.length ? readableSpine : undefined;
};

/**
 * Converts publication-wide progression using Readium position weights when
 * available, otherwise using equal resource weights.
 */
export const opdsProgressionToLocator = (
    progression: number,
    spine: readonly Partial<Pick<Link, "Href">>[] | undefined,
    positionList?: IReadiumPositionList,
): R2Locator | undefined => {
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

        const resourceProgression = progression === 1 ? LAST_RESOURCE_SAFE_PROGRESSION :
            (scaledProgression - (resource.firstPosition - 1)) / resource.positionCount;
        const mappedLocator = mapLocatorToReadiumPosition({
            href: resource.href,
            title: resource.title,
            type: resource.type,
            locations: {
                progression: resourceProgression,
            },
        }, positionList);
        return { ...mappedLocator, locations: { ...mappedLocator.locations, progression: resourceProgression } };
    }

    const readableSpine = getReadableSpine(spine);
    if (!readableSpine) {
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

export const opdsProgressionIsNewer = (
    remoteModified: string,
    localModifiedTime: number | undefined,
): boolean => {
    const remoteModifiedTime = Date.parse(remoteModified);
    return Number.isFinite(remoteModifiedTime) &&
        (typeof localModifiedTime !== "number" || remoteModifiedTime > localModifiedTime);
};
