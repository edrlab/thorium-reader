const assert = require("node:assert/strict");
const { test } = require("node:test");
const { extractTranslationKeys } = require("../../scripts/translation-keys");

const scan = (source, locale = {}) => extractTranslationKeys(source, "fixture.tsx", locale);

test("extracts notification keys from multiline wrappers with nested operation arguments", () => {
    assert.deepEqual(scan(`withErrorNotification(
        makeOperation(first, second), /* operation owner */
        "message.notifications.exportFailed",
    );
    withErrorNotification(function* () { yield call(operation, 1); }, 'message.notifications.deleteFailed');`), [
        "message.notifications.exportFailed", "message.notifications.deleteFailed",
    ]);
});

test("ignores commented calls, unrelated strings, and nonliteral wrapper keys", () => {
    assert.deepEqual(scan(`// withErrorNotification(operation, "comment.key")
        const text = 'withErrorNotification(operation, "string.key")';
        other(operation, "other.key");
        withErrorNotification(operation, key);
        function withErrorNotification(operation, key) { return operation; }`), []);
});

test("preserves direct translation calls and literal template keys", () => {
    assert.deepEqual(scan('translator.translate("first"); __(\'second\'); translate(`third`);'), ["first", "second", "third"]);
});

test("preserves matching dynamic keys without including unrelated locale entries", () => {
    assert.deepEqual(scan('__(`catalog.userProfile.${kind}`)', {
        catalog: { userProfile: { loans: "Loans", holds: "Holds" }, other: "Other" },
        message: { unused: "Unused" },
    }), ["catalog.userProfile.loans", "catalog.userProfile.holds"]);
});

test("does not treat punctuation in dynamic key prefixes as a wildcard", () => {
    assert.deepEqual(scan('__(`catalog.${kind}`)', { catalog: { loans: "Loans" }, catalogXloans: "Other" }), ["catalog.loans"]);
});
