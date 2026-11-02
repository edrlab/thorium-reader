import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, jest, test } from "@jest/globals";
import { ExternalAuthentication } from "readium-desktop/renderer/library/components/opds/ExternalAuthentication";
import type { IOpdsAuthView } from "readium-desktop/common/views/opds";
import en from "readium-desktop/resources/locales/en.json";
import fr from "readium-desktop/resources/locales/fr.json";

jest.mock("readium-desktop/renderer/assets/styles/components/opdsAuthentication.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));

test.each([en, fr])("shows external instructions and Try again without credential inputs", locale => {
    const auth = { external: true, credentialsUrl: "https://example.org/auth", logoImageUrl: "https://example.org/logo.png" } as IOpdsAuthView;
    const html = renderToStaticMarkup(<ExternalAuthentication auth={auth}
        __={key => key.split(".").reduce((value: unknown, part) => (value as Record<string, unknown>)[part], locale) as string} />);
    expect(html).toContain(locale.catalog.opds.auth.retry);
    expect(html).toContain(renderToStaticMarkup(<p>{locale.catalog.opds.auth.external}</p>));
    expect(html).toContain(locale.catalog.opds.auth.cancel);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<input");
});
