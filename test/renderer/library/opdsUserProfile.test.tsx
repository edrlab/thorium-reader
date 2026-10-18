import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, jest, test } from "@jest/globals";
import type { I18nFunction } from "readium-desktop/common/services/translator";

jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("readium-desktop/renderer/library/apiAction", () => ({ apiAction: jest.fn() }));

import { UserProfileDetails } from "readium-desktop/renderer/library/components/opds/UserProfile";

const translate = ((key: string, values?: { count?: number; used?: number; total?: number }) => values ? `${key}: ${values.count ?? values.used}${values.total !== undefined ? "/" + values.total : ""}` : key) as I18nFunction;

test("shows identity as text and distinguishes zero availability from a missing limit", () => {
    const html = renderToStaticMarkup(<UserProfileDetails __={translate} profile={{
        name: "<script>Jane</script>", email: "jane@example.com",
        loans: { total: 10, available: 0 }, holds: { available: 2 }, editUrl: "https://example.com/edit",
    }} />);
    expect(html).toContain("&lt;script&gt;Jane&lt;/script&gt;");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("catalog.userProfile.used: 10/10");
    expect(html).toContain("catalog.userProfile.available: 2");
    expect(html).not.toContain("catalog.userProfile.total");
    expect(html).toContain("catalog.userProfile.edit");
});

test("an empty profile shows no quota or edit controls", () => {
    const html = renderToStaticMarkup(<UserProfileDetails __={translate} profile={{}} />);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("catalog.userProfile.loans");
    expect(html).not.toContain("catalog.userProfile.holds");
});
