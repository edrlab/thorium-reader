import { expect, test } from "@jest/globals";

import {
    createReadiumPositionIndex,
    createReadiumPositionList,
    getReadiumPositionProgression,
    isEpubPositionListPublication,
    mapLocatorToReadiumPosition,
    publicationHasArchiveEntryLengths,
    ReadiumEpubProfile,
} from "readium-desktop/common/readium/positions";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Metadata } from "@r2-shared-js/models/metadata";
import { ArchiveProperties, ArchiveProperty, LayoutEnum, Properties } from "@r2-shared-js/models/metadata-properties";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

function createLink(href: string, entryLength?: number, layout?: LayoutEnum): Link {
    const link = new Link();
    link.Href = href;
    link.TypeLink = "application/xhtml+xml";
    link.Properties = new Properties();
    link.Properties.Layout = layout;

    if (typeof entryLength !== "undefined") {
        const archive = new ArchiveProperties();
        archive.EntryLength = entryLength;
        archive.IsEntryCompressed = true;
        link.Properties.Archive = archive;
    }

    return link;
}

function createPublication(spine: Link[], layout?: LayoutEnum): Publication {
    const publication = new Publication();
    publication.Metadata = new Metadata();
    publication.Metadata.ConformsTo = [ReadiumEpubProfile];
    publication.Metadata.Title = "Test publication";
    publication.Metadata.Rendition = new Properties();
    publication.Metadata.Rendition.Layout = layout;
    publication.Spine = spine;
    return publication;
}

test("generates one-based Readium positions from archive entry lengths", () => {
    const publication = createPublication([
        createLink("chapter-1.xhtml", 0),
        createLink("chapter-2.xhtml", 1024),
        createLink("chapter-3.xhtml", 1025),
    ]);

    const result = createReadiumPositionList(publication);

    expect(result.total).toBe(4);
    expect(result.resources.map(({ firstPosition, positionCount }) => ({ firstPosition, positionCount }))).toEqual([
        { firstPosition: 1, positionCount: 1 },
        { firstPosition: 2, positionCount: 1 },
        { firstPosition: 3, positionCount: 2 },
    ]);
    expect(result.positions.map((locator) => locator.locations)).toEqual([
        { position: 1, progression: 0, totalProgression: 0 },
        { position: 2, progression: 0, totalProgression: 0.25 },
        { position: 3, progression: 0, totalProgression: 0.5 },
        { position: 4, progression: 0.5, totalProgression: 0.75 },
    ]);
});

test("builds a lightweight position index without generating locators", () => {
    const publication = createPublication([createLink("chapter-1.xhtml", 1024), createLink("chapter-2.xhtml", 2048)]);

    const result = createReadiumPositionIndex(publication);

    expect(result).toEqual({
        resources: [
            expect.objectContaining({ firstPosition: 1, href: "chapter-1.xhtml", positionCount: 1 }),
            expect.objectContaining({ firstPosition: 2, href: "chapter-2.xhtml", positionCount: 2 }),
        ],
        total: 3,
    });
});

test("uses effective fixed layout and falls back to one position without metadata", () => {
    const publication = createPublication(
        [
            createLink("fixed.xhtml", 8192),
            createLink("reflowable.xhtml", 2049, LayoutEnum.Reflowable),
            createLink("missing.xhtml"),
        ],
        LayoutEnum.Fixed,
    );

    const result = createReadiumPositionList(publication);

    expect(result.resources.map((resource) => resource.positionCount)).toEqual([1, 3, 1]);
});

test("maps a current locator to its discrete position and continuous total progression", () => {
    const publication = createPublication([
        createLink("OPS/chapter-1.xhtml", 1024),
        createLink("OPS/chapter-2.xhtml", 3072),
    ]);
    const positionList = createReadiumPositionList(publication);

    const mapped = mapLocatorToReadiumPosition(
        {
            href: "https://epub.example.org/OPS/chapter-2.xhtml#paragraph",
            locations: { cssSelector: "#paragraph", progression: 0.5 },
        },
        positionList,
    );

    expect(mapped.locations).toEqual({
        cssSelector: "#paragraph",
        position: 3,
        progression: 0.5,
        totalProgression: 0.625,
    });
    expect(mapped.type).toBe("application/xhtml+xml");

    const atEnd = mapLocatorToReadiumPosition(
        {
            href: "OPS/chapter-2.xhtml",
            locations: { progression: 1 },
        },
        positionList,
    );
    expect(atEnd.locations.position).toBe(4);
    expect(atEnd.locations.totalProgression).toBe(1);
});

test("resolves progression data from the continuous locator value with a discrete fallback", () => {
    const publication = createPublication([createLink("chapter-1.xhtml", 1024), createLink("chapter-2.xhtml", 3072)]);
    const positionIndex = createReadiumPositionIndex(publication);

    expect(
        getReadiumPositionProgression(
            {
                href: "https://epub.example.org/chapter-2.xhtml#paragraph",
                locations: { position: 3, totalProgression: 0.625 },
            },
            positionIndex,
        ),
    ).toEqual({
        firstPosition: 2,
        lastPosition: 4,
        position: 3,
        totalPositions: 4,
        totalProgression: 0.625,
    });

    expect(
        getReadiumPositionProgression(
            {
                href: "chapter-2.xhtml",
                locations: { position: 3 },
            },
            positionIndex,
        )?.totalProgression,
    ).toBe(0.5);
});

test("detects EPUB archive metadata completeness", () => {
    const complete = createPublication([createLink("chapter.xhtml", 1024)]);
    const incomplete = createPublication([createLink("chapter.xhtml")]);

    expect(isEpubPositionListPublication(complete)).toBe(true);
    expect(publicationHasArchiveEntryLengths(complete)).toBe(true);
    expect(publicationHasArchiveEntryLengths(incomplete)).toBe(false);
});

test("round-trips archive metadata under the Readium property URI", () => {
    const publication = createPublication([createLink("chapter.xhtml", 2048)]);

    const json = TaJsonSerialize(publication) as Record<string, any>;
    expect(json.readingOrder[0].properties[ArchiveProperty]).toEqual({
        entryLength: 2048,
        isEntryCompressed: true,
    });

    const restored = TaJsonDeserialize(json, Publication);
    expect(restored.Spine?.[0].Properties.Archive.EntryLength).toBe(2048);
    expect(restored.Spine?.[0].Properties.Archive.IsEntryCompressed).toBe(true);
});
