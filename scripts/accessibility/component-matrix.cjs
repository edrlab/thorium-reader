const fs = require("node:fs");
const batches = fs.readdirSync("docs/accessibility").filter(n => /^remediation-batch-\d+\.json$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map(n => JSON.parse(fs.readFileSync("docs/accessibility/" + n, "utf8")));
const remediation = batches.length ? {
    inventory: batches.at(-1).inventory,
    findings: Object.assign({}, ...batches.map(batch => Object.fromEntries(Object.entries(batch.findings).map(([id, finding]) => [id, { ...finding, batch: batch.batch }])))),
} : undefined;
const inventory = JSON.parse(fs.readFileSync(remediation?.inventory || "docs/accessibility/evidence/static-inventory.json", "utf8"));
const issues = {
    "FontSize.tsx": "A01 A13", "ReaderSettings/Slider.tsx": "A01 A02 A13", "ReadingSpacing.tsx": "A01 A02 A13",
    "AnnotationEdit.tsx": "A03", "BookmarkEdit.tsx": "A03", "ApiappAddForm.tsx": "A04 A09",
    "DownloadsPanel.tsx": "A05 A30", "utils/Slider.tsx": "A06", "LibraryLayout.tsx": "A07 A21",
    "opds/PageNavigation.tsx": "A07", "OverloadNoteExportToHtml.tsx": "A08",
    "ProfilesSettings.tsx": "A10 A11", "menu/Menu.tsx": "A11", "AllPublicationPage.tsx": "A11 A20",
    "tag/tagButton.tsx": "A28 A31", "ReaderMenu/AnnotationCard.tsx": "A03 A11", "ReaderMenu/BookmarkCard.tsx": "A03 A11",
    "ReaderMenu/AnnotationList.tsx": "A11", "ReaderMenu/BookmarkList.tsx": "A11", "ReaderMenu/FilterPopover.tsx": "A11",
    "ReaderHeader.tsx": "A11 A22 A23", "KeyboardSettings.tsx": "A11", "toast/Toast.tsx": "A12",
    "Select.tsx": "A14", "Loader.tsx": "A15", "LoaderMainLoad.tsx": "A15", "LoaderSearch.tsx": "A15",
    "MessageOpdBrowserResult.tsx": "A15", "ReaderFooter.tsx": "A16", "customizationProfileDialog.tsx": "A17",
    "LibraryHeader.tsx": "A17 A22", "index_library.ejs": "A18", "index_reader.ejs": "A18",
    "opds/FeedCard.tsx": "A19", "Reader.tsx": "A21", "ReaderMenu/FilterPopover.tsx": "A11 A24",
    "ReadingAudio.tsx": "A25", "Print.tsx": "A27 (review); print label advisory",
    "ReaderSettings/ReaderSettings.tsx": "A23 A26", "settings/Settings.tsx": "A26", "DockedHeader.tsx": "A23",
    "PublicationInfoDescription.tsx": "A29",
};
const coverageFile = "docs/accessibility/evidence/runtime-component-coverage.json";
const runtime = fs.existsSync(coverageFile) ? JSON.parse(fs.readFileSync(coverageFile, "utf8")) : {};
const continuationFile = "docs/accessibility/evidence/continuation-coverage.json";
const continuation = fs.existsSync(continuationFile) ? JSON.parse(fs.readFileSync(continuationFile, "utf8")) : {};
const header = ["file", "static_review", "interesting_JSX_nodes", "finding_IDs", "runtime_evidence", "conformance", "coverage_kind", "runtime_observations", "runtime_limitations", "remediation_status", "remediation_evidence", "remaining_finding_IDs"];
const rows = inventory.files.map(file => {
    const fixes = Object.entries(remediation?.findings || {}).filter(([, finding]) => finding.files.includes(file.file));
    const ids = [...new Set([...Object.entries(issues).filter(([suffix]) => file.file.endsWith(suffix)).flatMap(([,ids]) => ids.match(/\bA\d{2}\b/g) || []), ...fixes.map(([id]) => id)])];
    const fixEvidence = [...new Set(fixes.flatMap(([,finding]) => finding.evidence))];
    const remaining = ids.filter(id => !["A11", "A14"].includes(id) && remediation?.findings[id]?.status !== "fixed");
    return [
    file.file, "Structural control review; no full conformance assertion", file.nodes.length,
    ids.join(" "),
    [runtime[file.file] || (fixes.length ? "Post-fix coverage" : "Not exercised"), ...(fixes.length ? ["Remediation: " + fixEvidence.join("; ")] : [])].join(". "), continuation[file.file]?.kind === "inactive" ? "Inactive source; no visual runtime surface" : "Not determined; sampled states do not establish conformance",
    continuation[file.file]?.kind || (runtime[file.file] ? "application" : fixes.length ? "application+fixture" : "untested"),
    continuation[file.file]?.observation ? "Baseline audit: " + continuation[file.file].observation : "See referenced application captures and report findings",
    continuation[file.file]?.limitations || "Representative application states only; all branches and native AT not verified",
    fixes.length ? fixes.map(([id, finding]) => `${id}: ${finding.status} (batch ${finding.batch}); ${finding.observation}`).join(" | ") : "No remediation yet; historical evidence retained",
    fixEvidence.join("; "), remaining.join(" "),
    ];
});
fs.writeFileSync("docs/accessibility/component-matrix.csv", [header, ...rows].map(row =>
    row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(","),
).join("\n") + "\n");
console.log(`${rows.length} matrix rows written`);
