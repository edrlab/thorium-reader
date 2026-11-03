import { describe, expect, it } from "@jest/globals";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication } from "@r2-shared-js/models/publication";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";
import { normalizeAudiobookManifestType } from "readium-desktop/main/redux/sagas/api/publication/packager/normalizeAudiobookManifestType";

function manifest(type: string | undefined = "http://schema.org/book", mediaTypes = ["audio/mp4", "audio/ogg"], selfType = "application/audiobook+json") {
    return TaJsonDeserialize({
        "@context": "http://readium.org/webpub/default.jsonld",
        metadata: { "@type": type, title: "Audiobook" },
        links: [{ rel: "self", href: "https://example.org/manifest.json", type: selfType }],
        spine: mediaTypes.map((mediaType, index) => ({ href: `track-${index}`, type: mediaType })),
    }, Publication);
}

describe("normalizeAudiobookManifestType", () => {
    it("recognizes the legacy Cantook manifest as an audiobook after serialization", () => {
        const publication = manifest();
        normalizeAudiobookManifestType(publication);
        const packaged = TaJsonDeserialize(TaJsonSerialize(publication), Publication);
        expect(isAudiobookFn(packaged)).toBe(true);
        expect(packaged.Context).toEqual(["http://readium.org/webpub/default.jsonld"]);
        expect(packaged.Spine?.map((link) => link.TypeLink)).toEqual(["audio/mp4", "audio/ogg"]);
    });

    it.each(["http://schema.org/Book", "https://schema.org/Book/"])("accepts a generic book type: %s", (type) => {
        const publication = manifest(type);
        normalizeAudiobookManifestType(publication);
        expect(isAudiobookFn(publication)).toBe(true);
    });

    it("uses the acquisition media type when the manifest lacks a self link", () => {
        const publication = manifest();
        publication.Links = [];
        publication.Metadata.RDFType = undefined;
        normalizeAudiobookManifestType(publication, true);
        expect(isAudiobookFn(publication)).toBe(true);
    });

    it.each([
        ["http://schema.org/book", ["audio/mp4", "application/xhtml+xml"], "application/audiobook+json"],
        ["http://schema.org/book", [], "application/audiobook+json"],
        ["http://schema.org/book", [""], "application/audiobook+json"],
        ["http://schema.org/book", ["audio/mp4"], "application/webpub+json"],
        ["http://schema.org/VisualNarrative", ["audio/mp4"], "application/audiobook+json"],
        ["https://schema.org/Audiobook", ["audio/mp4"], "application/audiobook+json"],
    ])("preserves type %s with reading order %j and media type %s", (type, mediaTypes, selfType) => {
        const publication = manifest(type, mediaTypes, selfType);
        normalizeAudiobookManifestType(publication);
        expect(publication.Metadata.RDFType).toBe(type);
    });
});
