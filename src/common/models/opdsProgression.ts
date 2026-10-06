// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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

export interface ISpineLinkForProgression {
    Href?: string;
}

export interface ILocatorForProgression {
    href?: string;
    locations?: {
        progression?: number;
        totalProgression?: number;
    };
}

export interface IProgressionLocator {
    href: string;
    title?: string;
    type?: string;
    locations: {
        progression: number;
        totalProgression?: number;
        position?: number;
    };
}

const LAST_RESOURCE_SAFE_PROGRESSION = 0.95;
export const OPDS_PROGRESSION_EPSILON = 1e-9;

const getReadableSpine = (
    spine: readonly ISpineLinkForProgression[] | undefined,
): Array<ISpineLinkForProgression & { Href: string }> | undefined => {
    const readableSpine = spine?.filter(
        (link): link is ISpineLinkForProgression & { Href: string } =>
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
    spine: readonly ISpineLinkForProgression[] | undefined,
    positionList?: IReadiumPositionList,
): IProgressionLocator | undefined => {
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

/**
 * Converts a resource locator into publication-wide progression using the same
 * resource weight model as {@link opdsProgressionToLocator}.
 */
export const locatorToOpdsProgression = (
    locator: ILocatorForProgression | undefined,
    spine: readonly ISpineLinkForProgression[] | undefined,
    positionList?: IReadiumPositionList,
): number | undefined => {
    const href = locator?.href;
    const resourceProgression = locator?.locations?.progression;
    if (typeof href !== "string" || !href ||
        typeof resourceProgression !== "number" ||
        !Number.isFinite(resourceProgression) ||
        resourceProgression < 0 || resourceProgression > 1) {
        return undefined;
    }

    if (positionList && positionList.total > 0 && positionList.resources.length) {
        if (!positionList.resources.some((resource) => resource.href === href)) {
            return undefined;
        }
        return mapLocatorToReadiumPosition({ href, locations: { progression: resourceProgression } }, positionList)
            .locations.totalProgression;
    }

    const readableSpine = getReadableSpine(spine);
    if (!readableSpine) {
        return undefined;
    }

    const spineIndex = readableSpine.findIndex((link) => link.Href === href);
    if (spineIndex < 0) {
        return undefined;
    }

    return (spineIndex + resourceProgression) / readableSpine.length;
};

/**
 * Compares a local scalar with the position Thorium actually applies for a
 * remote progression. This accounts for the safe 0.95 locator used when a
 * remote document points exactly to the end of the publication.
 */
export const opdsProgressionMatchesAppliedProgression = (
    remoteProgression: number,
    localProgression: number | undefined,
    spine: readonly ISpineLinkForProgression[] | undefined,
    positionList?: IReadiumPositionList,
): boolean => {
    if (!Number.isFinite(remoteProgression) || remoteProgression < 0 || remoteProgression > 1 ||
        typeof localProgression !== "number" || !Number.isFinite(localProgression)) {
        return false;
    }
    if (Math.abs(remoteProgression - localProgression) <= OPDS_PROGRESSION_EPSILON) {
        return true;
    }

    const appliedProgression = locatorToOpdsProgression(
        opdsProgressionToLocator(remoteProgression, spine, positionList),
        spine,
        positionList,
    );
    return typeof appliedProgression === "number" &&
        Math.abs(appliedProgression - localProgression) <= OPDS_PROGRESSION_EPSILON;
};

export const opdsProgressionIsNewer = (
    remoteModified: string,
    localModifiedTime: number | undefined,
): boolean => {
    const remoteModifiedTime = Date.parse(remoteModified);
    return Number.isFinite(remoteModifiedTime) &&
        (typeof localModifiedTime !== "number" || remoteModifiedTime > localModifiedTime);
};
