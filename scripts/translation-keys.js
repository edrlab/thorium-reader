const ts = require("typescript");

const localeKeys = (locale, prefix = "") => Object.entries(locale).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" ? localeKeys(value, path) : [path];
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Parse calls so comments, nested arguments, and multiline wrappers cannot
// change which argument supplies the translation key.
function extractTranslationKeys(source, fileName, referenceLocale) {
    const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const keys = [];
    const referenceKeys = localeKeys(referenceLocale);
    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            const callee = node.expression;
            const name = ts.isIdentifier(callee) ? callee.text :
                ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
            const argument = name === "withErrorNotification" ? node.arguments[1] :
                name === "translate" || name === "__" ? node.arguments[0] : undefined;
            if (argument && ts.isStringLiteralLike(argument)) {
                keys.push(argument.text);
            } else if (argument && ts.isTemplateExpression(argument) && name !== "withErrorNotification") {
                // Dynamic translation keys already present in the reference locale
                // must survive scanning (for example user-profile loans/holds).
                const pattern = "^" + escapeRegex(argument.head.text) + argument.templateSpans
                    .map((span) => "[^.]+" + escapeRegex(span.literal.text)).join("") + "$";
                keys.push(...referenceKeys.filter((key) => new RegExp(pattern).test(key)));
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return keys;
}

module.exports = { extractTranslationKeys };
