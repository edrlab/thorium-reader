import { beforeAll, expect, test } from "@jest/globals";
import type { Locator } from "@r2-navigator-js/electron/common/locator";
import { Metadata } from "@r2-shared-js/models/metadata";
import { ArchiveProperties, LayoutEnum, Properties } from "@r2-shared-js/models/metadata-properties";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { createReadiumPositionIndex, mapLocatorToReadiumPosition, ReadiumEpubProfile } from "readium-desktop/common/readium/positions";
import { setLocale, translate } from "readium-desktop/common/services/translator";
import { getReadingProgression } from "readium-desktop/renderer/common/readingProgression";

const publication = new Publication();
publication.Metadata = new Metadata();
publication.Metadata.ConformsTo = [ReadiumEpubProfile];
publication.Spine = [1, 7, 2].map((count, index) => {
    const link = new Link();
    link.Href = `OPS/chapter-${index + 1}.xhtml`;
    link.Properties = new Properties();
    link.Properties.Archive = new ArchiveProperties();
    link.Properties.Archive.EntryLength = count * 1024;
    return link;
});
const positionIndex = createReadiumPositionIndex(publication);

beforeAll(async () => { await setLocale("en"); });

test("reports chapter progression separately from the weighted book progression and position", () => {
    const locator: Locator = {
        href: "https://publication.test/OPS/chapter-2.xhtml#paragraph",
        locations: { progression: 0.5, totalProgression: 0.45, position: 5 },
    };
    const before = JSON.stringify(locator);
    expect(getReadingProgression(locator, publication, positionIndex, translate)).toEqual({
        spineIndex: 1,
        isFixedLayout: false,
        local: "Chapter progression: 50%",
        global: "Overall progression: 45% (Position: 5/10)",
    });
    expect(JSON.stringify(locator)).toBe(before);
});

test("maps a legacy chapter-only locator with the same weights as a live locator", () => {
    expect(getReadingProgression({
        href: "OPS/chapter-2.xhtml", locations: { progression: 0.5 },
    }, publication, positionIndex, translate)?.global).toBe("Overall progression: 45% (Position: 5/10)");
});

test("reconstructs chapter and book progression from a saved discrete position", () => {
    expect(getReadingProgression({
        href: "OPS/chapter-2.xhtml", locations: { position: 5 },
    }, publication, positionIndex, translate)).toEqual({
        spineIndex: 1,
        isFixedLayout: false,
        local: "Chapter progression: 43%",
        global: "Overall progression: 40% (Position: 5/10)",
    });
});

test("reports audiobook track progression without treating its fractional position as a Readium position", () => {
    const audio = new Publication();
    audio.Metadata = new Metadata();
    audio.Metadata.RDFType = "https://schema.org/Audiobook";
    audio.Spine = publication.Spine;
    expect(getReadingProgression({
        href: "OPS/chapter-2.xhtml", locations: { progression: 0.5, position: 0.45 },
    }, audio, positionIndex, translate)).toEqual({
        spineIndex: 1,
        isFixedLayout: false,
        local: "Chapter progression: 50%",
        global: "",
    });
});

test.each([
    [0, "Overall progression: 0% (Position: 1/10)"],
    [1, "Overall progression: 100% (Position: 10/10)"],
    [2, "Overall progression: 100% (Position: 10/10)"],
])("keeps position numbering one-based at progression %p", (progression, expected) => {
    const href = progression === 0 ? "OPS/chapter-1.xhtml" : "OPS/chapter-3.xhtml";
    expect(getReadingProgression({ href, locations: { progression } }, publication, positionIndex, translate)?.global)
        .toBe(expected);
});

test("uses locator total progression without position metadata, then an equal-chapter fallback", () => {
    const locator = { href: "OPS/chapter-2.xhtml", locations: { progression: 0.5, totalProgression: 0.45 } };
    expect(getReadingProgression(locator, publication, undefined, translate)?.global).toBe("Overall progression: 45%");
    expect(getReadingProgression({ ...locator, locations: { progression: 0.5 } }, publication, undefined, translate)?.global)
        .toBe("Overall progression: 50%");
});

test("uses page-based percentages and respects resource layout overrides", () => {
    const fixed = new Publication();
    fixed.Metadata = new Metadata();
    fixed.Metadata.Rendition = new Properties();
    fixed.Metadata.Rendition.Layout = LayoutEnum.Fixed;
    fixed.Spine = publication.Spine.map((link) => Object.assign(new Link(), link));
    expect(getReadingProgression({ href: fixed.Spine[0].Href, locations: { progression: 0, totalProgression: 0 } },
        fixed, createReadiumPositionIndex(fixed), translate)).toMatchObject({ isFixedLayout: true, global: "Overall progression: 33%" });
    fixed.Spine[1].Properties = new Properties();
    fixed.Spine[1].Properties.Layout = LayoutEnum.Reflowable;
    const fixedIndex = createReadiumPositionIndex(fixed);
    expect(getReadingProgression({ href: fixed.Spine[0].Href, locations: { progression: 0, totalProgression: 0 } },
        fixed, fixedIndex, translate)).toMatchObject({ isFixedLayout: true, global: "Overall progression: 0%" });
    expect(getReadingProgression({ href: fixed.Spine[1].Href, locations: { progression: 0.5 } },
        fixed, fixedIndex, translate)).toMatchObject({ isFixedLayout: false, local: "Chapter progression: 50%" });
});

test.each([undefined, LayoutEnum.Fixed])("keeps mixed-layout resource boundaries continuous with publication layout %p", (layout) => {
    const mixed = new Publication();
    mixed.Metadata = new Metadata();
    mixed.Metadata.Rendition = new Properties();
    mixed.Metadata.Rendition.Layout = layout;
    mixed.Spine = [7, 1, 2].map((count, index) => {
        const link = new Link();
        link.Href = `mixed-${index}.xhtml`;
        link.Properties = new Properties();
        link.Properties.Layout = index === 1 ? LayoutEnum.Fixed : LayoutEnum.Reflowable;
        link.Properties.Archive = new ArchiveProperties();
        link.Properties.Archive.EntryLength = count * 1024;
        return link;
    });
    const mixedIndex = createReadiumPositionIndex(mixed);
    for (const [href, progression, percent] of [
        ["mixed-0.xhtml", 1, 70],
        ["mixed-1.xhtml", 0, 70],
        ["mixed-1.xhtml", 1, 80],
        ["mixed-2.xhtml", 0, 80],
    ] as const) {
        const locator = mapLocatorToReadiumPosition({ href, locations: { progression } }, mixedIndex);
        expect(getReadingProgression(locator, mixed, mixedIndex, translate)?.global).toContain(`${percent}%`);
        // Legacy locators have no publication-wide percentage, so the position index supplies it.
        expect(getReadingProgression({ href, locations: { progression } }, mixed, mixedIndex, translate)?.global)
            .toContain(`${percent}%`);
    }
    expect(getReadingProgression({ href: "mixed-1.xhtml", locations: { progression: 0 } }, mixed, undefined, translate)?.global)
        .toBe("Overall progression: 33%");
});

test.each([
    { href: "unknown.xhtml", locations: { progression: 0.5 } },
    { href: "OPS/chapter-2.xhtml", locations: { position: 99 } },
    { href: "OPS/chapter-2.xhtml", locations: { progression: NaN, totalProgression: Infinity } },
])("does not invent progression for an unresolved or invalid locator: %p", (locator) => {
    expect(getReadingProgression(locator, publication, positionIndex, translate)).toBeUndefined();
});
