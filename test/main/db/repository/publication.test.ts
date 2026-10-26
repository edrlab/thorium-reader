// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

jest.mock("inversify", () => ({
    injectable: () => (target: unknown) => target,
}));
jest.mock("readium-desktop/main/tools/filter", () => ({
    aboutFilteredDocs: (documents: unknown[]) => documents,
}));

const importedPublication = {
    identifier: "local-publication-id",
    opdsPublication: {
        url: "https://example.com/publication.epub",
        type: "application/epub+zip",
        identifier: "work-id",
        selfLinkUrl: "https://example.com/publication.json",
    },
} as PublicationDocument;

describe("PublicationRepository.findByOpdsPublication", () => {
    const createRepository = () => {
        const repository = new PublicationRepository();
        jest.spyOn(repository, "findAll").mockReturnValue([importedPublication]);
        return repository;
    };

    it("finds the imported acquisition link by URL and media type", () => {
        const repository = createRepository();

        expect(
            repository.findByOpdsPublication(
                importedPublication.opdsPublication.url,
                importedPublication.opdsPublication.type,
                importedPublication.opdsPublication.identifier,
                importedPublication.opdsPublication.selfLinkUrl,
            ),
        ).toEqual([importedPublication]);
    });

    it("does not attach the publication to another format with the same URL", () => {
        const repository = createRepository();

        expect(
            repository.findByOpdsPublication(
                importedPublication.opdsPublication.url,
                "application/pdf",
                importedPublication.opdsPublication.identifier,
                importedPublication.opdsPublication.selfLinkUrl,
            ),
        ).toEqual([]);
    });

    it("does not attach the publication to another acquisition with the same media type", () => {
        const repository = createRepository();

        expect(
            repository.findByOpdsPublication(
                "https://example.com/publication.pdf",
                importedPublication.opdsPublication.type,
                importedPublication.opdsPublication.identifier,
                importedPublication.opdsPublication.selfLinkUrl,
            ),
        ).toEqual([]);
    });
});
