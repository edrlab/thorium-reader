const fs = require("node:fs");
const root = "docs/accessibility/evidence/";
const csv = rows => rows.map(row => row.map(value => '"' + String(value ?? "").replaceAll('"', '""') + '"').join(",")).join("\n") + "\n";
const states = fs.readdirSync(root).filter(f => f.endsWith(".json")).map(file => ({ file, data: JSON.parse(fs.readFileSync(root + file, "utf8")) })).filter(x => x.data.pages);
const rows = states.map(({ file, data }) => {
    const window = data.label.startsWith("reader") ? "reader" : "library";
    const page = data.pages.find(p => p.url.includes(`index_${window}.html`));
    if (!page) throw new Error(`Missing intended ${window} page in ${file}`);
    const isWcag = rule => rule.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
    return [data.label, window, page.title, page.lang || "MISSING", `${page.dimensions.width} x ${page.dimensions.height}`,
        page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join("; "),
        page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join("; "),
        page.axe.incomplete.map(v => v.id).join("; "), `evidence/${file}`, `evidence/${page.evidencePrefix}.png`, "Sampled state only; not a conformance pass"];
});
fs.writeFileSync("docs/accessibility/state-results.csv", csv([
    ["state", "window", "title", "document_language", "CSS_viewport", "WCAG_tagged_axe_findings", "best_practice_axe_findings", "manual_review_rules", "raw_evidence", "screenshot", "interpretation"], ...rows,
]));
const count = Object.fromEntries(["library", "reader"].map(w => [w, rows.filter(r => r[1] === w).length]));
const continuationPath = root + "continuation-summary.json";
const continuation = fs.existsSync(continuationPath) ? JSON.parse(fs.readFileSync(continuationPath, "utf8")) : undefined;
fs.writeFileSync(root + "summary.json", JSON.stringify({ sourceRevision: "0cd77ab84e5033f51b446e55c8ef03af00884930", hostStates: rows.length, perWindow: count, separateWebviewScans: ["epub-webview.json", "pdf-webview.json"], continuation, limitations: "Named sampled application states; fixture states counted separately. Chromium CDP evidence is not a native screen-reader listening test. All branches, services and criterion applicability are not certified." }, null, 2) + "\n");
console.log(JSON.stringify({ states: rows.length, ...count }));
