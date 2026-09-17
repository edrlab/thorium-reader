// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsLinkView, IOpdsPublicationView, IOpdsResultView } from "readium-desktop/common/views/opds";

const updateLinks = (
    links: IOpdsLinkView[] | undefined,
    importedLink: IOpdsLinkView,
    publicationIdentifier: string,
): IOpdsLinkView[] | undefined => {
    if (!Array.isArray(links)) {
        return links;
    }

    let hasChanged = false;
    const updatedLinks = links.map((link) => {
        if (link.url !== importedLink.url || link.type !== importedLink.type) {
            return link;
        }
        if (link.localBookshelfPublicationId === publicationIdentifier) {
            return link;
        }

        hasChanged = true;
        return {
            ...link,
            localBookshelfPublicationId: publicationIdentifier,
        };
    });

    return hasChanged ? updatedLinks : links;
};

export const attachLocalBookshelfPublication = (
    publication: IOpdsPublicationView,
    importedLink: IOpdsLinkView,
    publicationIdentifier: string,
): IOpdsPublicationView => {
    const openAccessLinks = updateLinks(
        publication.openAccessLinks,
        importedLink,
        publicationIdentifier,
    );
    const sampleOrPreviewLinks = updateLinks(
        publication.sampleOrPreviewLinks,
        importedLink,
        publicationIdentifier,
    );
    const buyLinks = updateLinks(
        publication.buyLinks,
        importedLink,
        publicationIdentifier,
    );
    const borrowLinks = updateLinks(
        publication.borrowLinks,
        importedLink,
        publicationIdentifier,
    );

    if (
        openAccessLinks === publication.openAccessLinks
        && sampleOrPreviewLinks === publication.sampleOrPreviewLinks
        && buyLinks === publication.buyLinks
        && borrowLinks === publication.borrowLinks
    ) {
        return publication;
    }

    return {
        ...publication,
        openAccessLinks,
        sampleOrPreviewLinks,
        buyLinks,
        borrowLinks,
    };
};

const updatePublications = (
    publications: IOpdsPublicationView[] | undefined,
    importedLink: IOpdsLinkView,
    publicationIdentifier: string,
): IOpdsPublicationView[] | undefined => {
    if (!Array.isArray(publications)) {
        return publications;
    }

    let hasChanged = false;
    const updatedPublications = publications.map((publication) => {
        const updatedPublication = attachLocalBookshelfPublication(
            publication,
            importedLink,
            publicationIdentifier,
        );
        hasChanged ||= updatedPublication !== publication;
        return updatedPublication;
    });

    return hasChanged ? updatedPublications : publications;
};

export const attachLocalBookshelfPublicationToResult = (
    result: IOpdsResultView,
    importedLink: IOpdsLinkView,
    publicationIdentifier: string,
): IOpdsResultView => {
    const publications = updatePublications(result.publications, importedLink, publicationIdentifier);
    const catalogs = updatePublications(result.catalogs, importedLink, publicationIdentifier);

    let groupsHaveChanged = false;
    const groups = result.groups?.map((group) => {
        const groupPublications = updatePublications(
            group.publications,
            importedLink,
            publicationIdentifier,
        );
        if (groupPublications === group.publications) {
            return group;
        }

        groupsHaveChanged = true;
        return {
            ...group,
            publications: groupPublications,
        };
    });

    if (
        publications === result.publications
        && catalogs === result.catalogs
        && !groupsHaveChanged
    ) {
        return result;
    }

    return {
        ...result,
        publications,
        catalogs,
        groups,
    };
};
