// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";
import { LayoutEnum } from "@r2-shared-js/models/metadata-properties";
import type { Publication } from "@r2-shared-js/models/publication";
import type { Link } from "@r2-shared-js/models/publication-link";

import { resolveReadiumAnnotationSourceHref } from "./annotation/sourceHref";

export const ReadiumPositionLength = 1024;
export const ReadiumEpubProfile = "https://readium.org/webpub-manifest/profiles/epub";

export interface IReadiumPositionResource {
    href: string;
    type?: string;
    title?: string;
    firstPosition: number;
    positionCount: number;
}

export interface IReadiumPositionList {
    total: number;
    positions: Locator[];
    resources: IReadiumPositionResource[];
}

function isFixedLayout(publication: Publication, link: Link): boolean {
    const resourceLayout = link.Properties?.Layout;
    const layout = resourceLayout || publication.Metadata?.Rendition?.Layout;
    return layout === LayoutEnum.Fixed;
}

function positionCount(publication: Publication, link: Link): number {
    if (isFixedLayout(publication, link)) {
        return 1;
    }

    const entryLength = link.Properties?.Archive?.EntryLength;
    if (typeof entryLength !== "number" || !Number.isFinite(entryLength) || entryLength < 0) {
        return 1;
    }

    return Math.max(1, Math.ceil(entryLength / ReadiumPositionLength));
}

export function isEpubPositionListPublication(publication: Publication): boolean {
    return publication.Metadata?.ConformsTo?.includes(ReadiumEpubProfile) || false;
}

export function publicationHasArchiveEntryLengths(publication: Publication): boolean {
    const spine = publication.Spine || [];
    return isEpubPositionListPublication(publication) && spine.length > 0 && spine.every((link) => {
        const entryLength = link.Properties?.Archive?.EntryLength;
        return typeof entryLength === "number" && Number.isFinite(entryLength) && entryLength >= 0;
    });
}

export function createReadiumPositionList(publication: Publication): IReadiumPositionList {
    let nextPosition = 1;
    const resources = (publication.Spine || []).map<IReadiumPositionResource>((link) => {
        const resource: IReadiumPositionResource = {
            firstPosition: nextPosition,
            href: link.Href,
            positionCount: positionCount(publication, link),
            title: link.Title,
            type: link.TypeLink,
        };
        nextPosition += resource.positionCount;
        return resource;
    });
    const total = nextPosition - 1;
    const positions: Locator[] = [];

    for (const resource of resources) {
        for (let localIndex = 0; localIndex < resource.positionCount; localIndex++) {
            const position = resource.firstPosition + localIndex;
            positions.push({
                href: resource.href,
                locations: {
                    position,
                    progression: localIndex / resource.positionCount,
                    totalProgression: total > 0 ? (position - 1) / total : 0,
                },
                title: resource.title,
                type: resource.type,
            });
        }
    }

    return { positions, resources, total };
}

function clampProgression(value: number | undefined): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return 0;
    }
    return Math.min(1, Math.max(0, value));
}

export function mapLocatorToReadiumPosition(
    locator: Locator,
    positionList: IReadiumPositionList,
): Locator {
    const matchedHref = resolveReadiumAnnotationSourceHref(
        locator.href,
        positionList.resources.map((resource) => resource.href),
    );
    const resource = positionList.resources.find((candidate) => candidate.href === matchedHref);
    if (!resource || positionList.total <= 0) {
        return locator;
    }

    const progression = clampProgression(locator.locations.progression);
    const localIndex = Math.min(
        resource.positionCount - 1,
        Math.floor(progression * resource.positionCount),
    );

    return {
        ...locator,
        locations: {
            ...locator.locations,
            position: resource.firstPosition + localIndex,
            totalProgression:
                (resource.firstPosition - 1 + progression * resource.positionCount) / positionList.total,
        },
        type: locator.type || resource.type,
    };
}
