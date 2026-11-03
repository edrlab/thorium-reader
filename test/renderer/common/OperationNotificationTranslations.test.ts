import { afterAll, expect, test } from "@jest/globals";
import { setLocale, translate } from "readium-desktop/common/services/translator";

afterAll(async () => { await setLocale("en"); });

test.each([
    ["en", "Unable to determine your reading position. Try again."],
    ["fr", "Impossible de déterminer votre position de lecture. Réessayez."],
    ["es", "Unable to determine your reading position. Try again."],
] as const)("reading-position errors are meaningful in %s", async (locale, expected) => {
    await setLocale(locale);
    expect(translate("message.notifications.readingPositionFailed")).toBe(expected);
});

test.each([
    ["en", "Another profile operation is in progress. Wait for it to finish, then try again."],
    ["fr", "Une autre opération sur un profil est en cours. Attendez qu’elle se termine, puis réessayez."],
    ["es", "Another profile operation is in progress. Wait for it to finish, then try again."],
] as const)("profile-busy warnings are meaningful in %s", async (locale, expected) => {
    await setLocale(locale);
    expect(translate("message.notifications.profileBusy")).toBe(expected);
});
