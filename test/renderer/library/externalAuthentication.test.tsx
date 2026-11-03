import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, jest, test } from "@jest/globals";
import { ExternalAuthentication } from "readium-desktop/renderer/library/components/opds/ExternalAuthentication";
import type { IOpdsAuthView } from "readium-desktop/common/views/opds";
import { setLocale, translate } from "readium-desktop/common/services/translator";
import en from "readium-desktop/resources/locales/en.json";
import fr from "readium-desktop/resources/locales/fr.json";

jest.mock("readium-desktop/renderer/assets/styles/components/opdsAuthentication.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));
jest.mock("readium-desktop/resources/locales/es.json", () => {
    const locale = jest.requireActual<typeof en>("readium-desktop/resources/locales/es.json");
    const auth = { ...locale.catalog.opds.auth, openExternalBrowser: "" };
    delete auth.alternateLogin;
    return { ...locale, catalog: { ...locale.catalog, opds: { ...locale.catalog.opds, auth } } };
});

test.each([en, fr])("shows the external and alternate login actions without credential inputs", locale => {
    const auth = { external: true, credentialsUrl: "https://example.org/auth", logoImageUrl: "https://example.org/logo.png" } as IOpdsAuthView;
    const html = renderToStaticMarkup(<ExternalAuthentication auth={auth}
        __={key => key.split(".").reduce((value: unknown, part) => (value as Record<string, unknown>)[part], locale) as string} />);
    const { alternateLogin, cancel, externalBrowserInstructions, fallback, openExternalBrowser } = locale.catalog.opds.auth;
    const sections = html.split(/<hr[^>]*\/>/);
    expect(sections).toHaveLength(4);
    expect(sections[0]).toContain(auth.logoImageUrl);
    expect(sections[1]).toContain(renderToStaticMarkup(<p>{externalBrowserInstructions}</p>));
    expect(sections[1]).toContain(openExternalBrowser);
    expect(sections[2]).toContain(renderToStaticMarkup(<p>{fallback}</p>));
    expect(sections[2]).toContain(alternateLogin);
    expect(sections[3]).toContain(cancel);
    expect(html).toContain(renderToStaticMarkup(<p>{locale.catalog.opds.auth.external}</p>));
    expect(html).toContain(locale.catalog.opds.auth.cancel);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<input");
});

test("falls back to English for empty and missing external login translations", async () => {
    await setLocale("es");
    try {
        expect(translate("catalog.opds.auth.openExternalBrowser")).toBe(en.catalog.opds.auth.openExternalBrowser);
        expect(translate("catalog.opds.auth.alternateLogin")).toBe(en.catalog.opds.auth.alternateLogin);
    } finally {
        await setLocale("en");
    }
});
