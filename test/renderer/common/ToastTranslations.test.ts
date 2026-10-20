import { afterAll, expect, jest, test } from "@jest/globals";
import { setLocale, translate } from "readium-desktop/common/services/translator";

jest.mock("readium-desktop/resources/locales/de.json", () => ({
    accessibility: {
        copyNotificationAndToggleDetails: "",
        notificationCopied: "",
        notificationCopyFailed: "",
        notification: "",
        closeNotification: "",
    },
}));

const keys = [
    "accessibility.copyNotificationAndToggleDetails",
    "accessibility.notificationCopied",
    "accessibility.notificationCopyFailed",
    "accessibility.notification",
    "accessibility.closeNotification",
] as const;

const english = ["Copy notification and toggle details", "Notification copied", "Could not copy notification", "Notification", "Close notification"];

test.each([
    ["en", "Unable to determine your reading position. Try again."],
    ["fr", "Impossible de déterminer votre position de lecture. Réessayez."],
    ["es", "Unable to determine your reading position. Try again."],
] as const)("reading-position errors are meaningful in %s", async (locale, expected) => {
    await setLocale(locale);
    expect(translate("message.notifications.readingPositionFailed")).toBe(expected);
});

afterAll(async () => { await setLocale("en"); });

test.each([
    ["en", "Another profile operation is in progress. Wait for it to finish, then try again."],
    ["fr", "Une autre opération sur un profil est en cours. Attendez qu’elle se termine, puis réessayez."],
    ["es", "Another profile operation is in progress. Wait for it to finish, then try again."],
] as const)("profile-busy warnings are meaningful in %s", async (locale, expected) => {
    await setLocale(locale);
    expect(translate("message.notifications.profileBusy")).toBe(expected);
});

test.each([
    ["en", english],
    ["fr", ["Copier la notification et afficher ou masquer les détails", "Notification copiée", "Impossible de copier la notification", "Notification", "Fermer la notification"]],
    ["es", english], // Missing keys fall back to English.
    ["de", english], // Empty translations also fall back to English.
] as const)("notification labels are meaningful in %s", async (locale, expected) => {
    await setLocale(locale);
    expect(keys.map((key) => translate(key))).toEqual(expected);
});
