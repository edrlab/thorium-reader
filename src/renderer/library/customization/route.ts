// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeB64, decodeB64 } from "../../common/logics/base64";
import {
    ICustomizationLink,
    ICustomizationManifest,
    ICustomizationManifestLinkPropertiesExtension,
} from "readium-desktop/common/readium/customization/manifest";

export type TProfileScreenLink = ICustomizationLink & {
    properties: ICustomizationManifestLinkPropertiesExtension;
};

/**
 * formating customization screen route to react-router route
 * @param href href of the customization "screen" link (manifest.json)
 */
export function buildProfileRoute(href: string) {
    return `/profile/${encodeB64(href)}`;
}

export function decodeProfileRouteParam(hrefEncoded: string): string | undefined {
    try {
        return decodeB64(hrefEncoded);
    } catch {
        return undefined;
    }
}

export function getLocalizedProfileScreenLinks(
    manifest: ICustomizationManifest | undefined,
    locale: string,
): TProfileScreenLink[] {
    const screenLinks = manifest?.links?.filter(
        (link): link is TProfileScreenLink =>
            link.rel === "screen" &&
            !!link.href &&
            (!link.type || link.type === "text/html"),
    ) || [];

    const localizedLinks = screenLinks.filter((link) => link.language === locale);
    if (localizedLinks.length) {
        return localizedLinks;
    }

    return screenLinks.filter((link) => link.language === "en" || !link.language);
}

export function resolveProfileScreenLink(
    manifest: ICustomizationManifest | undefined,
    locale: string,
    screenId: string,
): TProfileScreenLink | undefined {
    const href = decodeProfileRouteParam(screenId);
    if (!href) {
        return undefined;
    }

    return getLocalizedProfileScreenLinks(manifest, locale).find((link) => link.href === href);
}

export function buildProfileCatalogRootIdentifier(href: string): string | undefined {
    try {
        const { host } = new URL(href);
        return host
            ? Buffer.from(encodeURIComponent(host), "utf8").toString("base64")
            : undefined;
    } catch {
        return undefined;
    }
}

export function isProfileCatalogPathname(
    pathname: string,
    manifest: ICustomizationManifest | undefined,
): boolean {
    const routeRootIdentifier = pathname.match(/^\/opds\/([^/]+)\/browse\//)?.[1];
    if (!routeRootIdentifier) {
        return false;
    }

    return manifest?.links?.some((link) =>
        link.rel === "catalog" &&
        buildProfileCatalogRootIdentifier(link.href) === routeRootIdentifier,
    ) || false;
}
