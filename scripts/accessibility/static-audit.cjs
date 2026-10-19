// Structural evidence only: these heuristics do not establish WCAG conformance.
const fs = require("node:fs");
const path = require("node:path");
const ts = require(require.resolve("typescript", { paths: [process.cwd(), process.env.AUDIT_DEPENDENCY_ROOT || process.cwd()] }));
const roots = ["src/renderer/common", "src/renderer/library", "src/renderer/reader"];
const files = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.(tsx|html|ejs)$/.test(file)) files.push(file.replaceAll("\\", "/"));
    }
}
roots.forEach(walk);
const inventory = files.sort().map(file => {
    const source = fs.readFileSync(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const nodes = [];
    function visit(node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const tag = node.tagName.getText(ast);
            const attrs = Object.fromEntries(node.attributes.properties.map(a => ts.isJsxAttribute(a)
                ? [a.name.getText(ast), a.initializer ? a.initializer.getText(ast).slice(0, 240) : "true"]
                : ["...spread", a.getText(ast).slice(0, 240)]));
            if (/^(button|input|textarea|select|img|webview|iframe|canvas|a|div|span|section|nav|main|h[1-6]|label)$/.test(tag)
                || /Dialog|Tab|Select|ComboBox|Radio|Menu|TextArea|Slider|Popover/.test(tag)) {
                if (!/^(div|span|section)$/.test(tag) || Object.keys(attrs).some(k => /aria|role|onClick|onKey|tabIndex/.test(k))) {
                    const parent = ts.isJsxOpeningElement(node) ? node.parent : undefined;
                    const children = parent?.children?.map(c => c.getText(ast)).join(" ").replace(/\s+/g, " ").slice(0, 180);
                    nodes.push({ line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, tag, attrs, ...(children ? { children } : {}) });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(ast);
    return { file, lines: source.split("\n").length, nodes };
});
const output = process.argv[2];
const json = JSON.stringify({ method: "TypeScript JSX AST inventory; includes no runtime accessibility computation", files: inventory }, null, 2);
if (output) fs.writeFileSync(output, json + "\n");
else console.log(json);
