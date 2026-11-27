import * as React from "react";
import { afterEach, beforeAll, expect, jest, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { setLocale, translate } from "readium-desktop/common/services/translator";

jest.mock("dompurify", () => ({ __esModule: true, default: { sanitize: (value: string) => value } }));
jest.mock("readium-desktop/renderer/assets/styles/bookDetailsDialog.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/global.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/publicationInfos.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/modals.scss", () => ({}));
jest.mock("readium-desktop/renderer/common/components/Cover", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/Dialog", () => ({
    Root: (): null => null, Trigger: (): null => null, Portal: (): null => null, Content: (): null => null, Title: (): null => null, Close: (): null => null,
}));
jest.mock("readium-desktop/renderer/common/hooks/useSelector", () => ({ useSelector: () => "en" }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [translate] }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/FormatContributorWithLink", () => ({ FormatContributorWithLink: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/formatPublicationLanguage", () => ({ FormatPublicationLanguage: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/FormatPublisherDate", () => ({ FormatPublisherDate: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/OpdsProgressionInfo", () => ({ OpdsProgressionInfo: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/LcpInfo", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/PublicationInfoDescription", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/dialog/publicationInfos/PublicationInfoA11y2", () => ({ PublicationInfoA11y2: (): null => null }));

import { PublicationInfoContent } from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";

beforeAll(async () => { await setLocale("en"); });
afterEach(async () => { await setLocale("en"); });

function renderAudioProgression(globalDuration?: number): string {
    const publication = new Publication();
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "https://schema.org/Audiobook";
    publication.Spine = ["track-1.mp3", "track-2.mp3"].map((href) => Object.assign(new Link(), { Href: href }));
    const props: React.ComponentProps<typeof PublicationInfoContent> = {
        publicationViewMaybeOpds: { documentTitle: "Audio" } as React.ComponentProps<typeof PublicationInfoContent>["publicationViewMaybeOpds"],
        r2Publication: publication,
        readerReadingLocation: {
            locator: { href: "track-2.mp3", locations: { progression: 0.5, position: 0.75 } },
            audioPlaybackInfo: {
                globalDuration,
                globalTime: 90,
                globalProgression: 0.75,
                localDuration: 60,
                localTime: 30,
                localProgression: 0.5,
                isPlaying: false,
            },
        } as React.ComponentProps<typeof PublicationInfoContent>["readerReadingLocation"],
        manifestUrlR2Protocol: undefined,
        handleLinkUrl: undefined,
        focusWhereAmI: false,
        pdfPlayerNumberOfPages: undefined,
        divinaNumberOfPages: undefined,
        divinaContinousEqualTrue: false,
        closeDialogCb: () => undefined,
        TagManagerComponent: (): null => null,
    };
    return renderToStaticMarkup(<PublicationInfoContent {...props} />);
}

test.each([undefined, 0])("retains track and local percentage when audiobook global duration is %p", (duration) => {
    const html = renderAudioProgression(duration);
    expect(html).toContain("2/2 [Chapter progression: 50%]");
    expect(html).not.toContain("Overall progression:");
    expect(html).not.toContain("Position:");
});

test("preserves the duration-based audiobook report when global duration is available", () => {
    const html = renderAudioProgression(120);
    expect(html).toContain("75%");
    expect(html).not.toContain("Chapter progression:");
});

test("translates the audiobook fallback into French", async () => {
    await setLocale("fr");
    expect(renderAudioProgression()).toContain("2/2 [Progression dans le chapitre : 50 %]");
});
