import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, jest, test } from "@jest/globals";
import { OPDSAvailabilityEnum } from "@r2-opds-js/opds/opds2/opds2-availability";
import type { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";

jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/global.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/cart-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/borrow-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/import.svg", () => ({}));
jest.mock("react-redux", () => ({
    ...jest.requireActual<typeof import("react-redux")>("react-redux"),
    useDispatch: () => jest.fn(),
}));
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({ useApi: () => [undefined, jest.fn()] }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock(
    "readium-desktop/renderer/common/components/SVG",
    () =>
        function MockSVG() {
            return <span />;
        },
);
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: unknown) => component,
}));
jest.mock("readium-desktop/renderer/library/opds/handleLink", () => ({ dispatchOpdsLink: jest.fn() }));
jest.mock("readium-desktop/renderer/library/opds/route", () => ({ parseOpdsBrowserRoute: (): undefined => undefined }));
jest.mock(
    "readium-desktop/renderer/library/components/dialog/publicationInfos/opdsControls/OpdsLinkProperties",
    () =>
        function MockLinkProperties() {
            return <span>link properties</span>;
        },
);

import { OpdsControls } from "readium-desktop/renderer/library/components/dialog/publicationInfos/opdsControls/OpdsControls";

const link = (state?: OPDSAvailabilityEnum): IOpdsLinkView => ({
    url: "https://example.com/borrow",
    properties: { availabilityState: state },
});

function render(publication: Partial<IOpdsPublicationView>) {
    return renderToStaticMarkup(
        <OpdsControls
            {...({
                opdsPublicationView: { documentTitle: "Book", ...publication },
                location: { pathname: "/" },
                __: (key: string) => key,
                openAccessButtonIsDisabled: () => false,
                sampleButtonIsDisabled: () => false,
            } as unknown as React.ComponentProps<typeof OpdsControls>)}
        />,
    );
}

test.each([OPDSAvailabilityEnum.Unavailable, OPDSAvailabilityEnum.Reserved])(
    "hides Borrow for %s while retaining link properties and other actions",
    (state) => {
        const html = render({
            borrowLinks: [link(state)],
            openAccessLinks: [link(state)],
            revokeLoanLinks: [link(state)],
        });
        expect(html).not.toContain("opds.menu.goLoanBook");
        expect(html.includes("opds.menu.placeHold")).toBe(state === OPDSAvailabilityEnum.Unavailable);
        expect(html).toContain("link properties");
        expect(html).toContain("opds.menu.goRevokeLoanBook");
        expect(html).toContain("catalog.addBookToLib");
    },
);

test.each([OPDSAvailabilityEnum.Available, OPDSAvailabilityEnum.Ready, undefined])(
    "keeps Borrow for %s independently of unavailable and reserved links",
    (state) => {
        const html = render({
            borrowLinks: [link(OPDSAvailabilityEnum.Unavailable), link(state), link(OPDSAvailabilityEnum.Reserved)],
        });
        expect(html.match(/opds.menu.goLoanBook/g)).toHaveLength(1);
    },
);

test("keeps Borrow when properties are absent", () => {
    expect(render({ borrowLinks: [{ url: "https://example.com/borrow" }] })).toContain("opds.menu.goLoanBook");
});

test("keeps cancellation available for a reserved hold while hiding Borrow", () => {
    const html = render({ borrowLinks: [{
        ...link(OPDSAvailabilityEnum.Reserved),
        properties: { availabilityState: OPDSAvailabilityEnum.Reserved, cancellable: true },
    }] });
    expect(html).not.toContain("opds.menu.goLoanBook");
    expect(html).not.toContain("opds.menu.placeHold");
    expect(html).toContain("opds.menu.cancelHold");
});
