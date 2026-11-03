import { afterAll, expect, test } from "@jest/globals";
import { setLocale, translate } from "readium-desktop/common/services/translator";

afterAll(async () => { await setLocale("en"); });
test.each([
    ["en", ["Catalog options", "Wishlist", "History", "User profile"]],
    ["fr", ["Options du catalogue", "Liste de souhaits", "Historique", "Profil utilisateur"]],
    ["es", ["Catalog options", "Wishlist", "History", "User profile"]],
] as const)("OPDS options labels are meaningful in %s, including untranslated labels", async (locale, expected) => {
    await setLocale(locale);
    expect([translate("opds.browserMenu.options"), translate("opds.browserMenu.wishlist"),
        translate("opds.browserMenu.history"), translate("opds.browserMenu.profile")]).toEqual(expected);
});
