const fs = require('node:fs');
const root = 'docs/accessibility/';
const dir = root + 'evidence/batch-4/';
const lib = p => 'src/renderer/library/components/' + p;
const reader = p => 'src/renderer/reader/components/' + p;
const common = p => 'src/renderer/common/components/' + p;
const fixture = JSON.parse(fs.readFileSync(dir + 'fixture-checks.json')).tests;
const application = JSON.parse(fs.readFileSync(dir + 'application-checks.json')).tests;
if (![...fixture, ...application].every(t => t.status === 'passed')) throw new Error('Batch 4 checks must pass before recording remediation');
const evidence = names => names.map(n => 'evidence/batch-4/' + n + '.json');
const findings = {
    A15: {
        status: 'fixed',
        files: [common('Loader.tsx'), lib('LoaderMainLoad.tsx'), lib('opds/BrowserResult.tsx'), lib('opds/MessageOpdBrowserResult.tsx'), reader('picker/Search.tsx'), reader('picker/SearchFormPicker.tsx'), reader('picker/LoaderSearch.tsx')],
        evidence: evidence(['library-main-load-busy-en', 'library-main-load-idle-en', 'library-main-load-busy-fr', 'library-main-load-idle-fr', 'library-opds-loading-en', 'library-opds-error-en', 'library-opds-empty-en', 'library-opds-timeout-en', 'library-opds-loading-fr', 'library-opds-error-fr', 'library-opds-empty-fr', 'library-opds-timeout-fr', 'reader-search-busy-en', 'reader-search-results-en', 'reader-search-empty-en', 'reader-search-busy-fr', 'reader-search-results-fr', 'reader-search-empty-fr', 'reader-search-results-live', 'reader-search-empty-live', 'library-opds-loading-live', 'library-opds-empty-live', 'library-opds-error-live']),
        observation: 'Shared loading indicators expose localized status text. Main loading, OPDS response feedback and Reader search use persistent polite status nodes; decorative search spinners are covered at operation level. Actual EPUB search reports Searching, 95 matches and no matches with input focus retained. Existing loopback OPDS loading and HTTP 503 response verified live. Removed the search field blur handler that immediately reclaimed focus; Tab can leave the input. English/French fixture transitions pass.',
        limitations: 'DOM mutations and Chromium accessibility semantics verified, without native screen-reader listening. Covers these loader/OPDS/EPUB search operations, not every asynchronous process or native notification. PDF search status and other locale/theme states need further coverage.',
    },
    A16: {
        status: 'fixed',
        files: [reader('ReaderFooter.tsx'), reader('ReaderMenu/ReaderMenu.tsx'), reader('ReaderMenu/GoToPageSection.tsx')],
        evidence: evidence(['reader-pdf-contents-change-1', 'reader-pdf-contents-change-2', 'reader-pdf-contents-change-3', 'reader-epub-chapter-next', 'reader-epub-chapter-previous', 'reader-epub-toc-keyboard', 'reader-pdf-goto-page-101']),
        observation: 'The visual progress track remains redundant in the tested EPUB/PDF: next/previous spine shortcuts, Tab/Enter TOC activation and PDF page-combobox navigation work. Assessment exposed a PDF Reader crash when asynchronous TOC data changed recursive hook count. Each recursive tree now renders as a separate stable React component. Empty/nested/changed/empty TOC fixture transitions and live PDF navigation pass without that crash.',
        limitations: 'EPUB and PDF equivalents are verified in sampled publications. Divina and audiobook navigation, exact arbitrary pointer offsets and end-to-end native AT remain untested. EPUB resource/selector restored via Readium IPC; PDF page restored. Programmatic restoration is not counted as keyboard evidence.',
    },
    A27: {
        status: 'fixed',
        files: [reader('Print.tsx')],
        styles: ['src/renderer/assets/styles/components/print.scss'],
        runtimeFiles: ['src/renderer/reader/pdf/webview/index_pdf.ts'],
        evidence: evidence(['reader-print-101-start', 'reader-print-101-end', 'reader-print-1-start', 'reader-pdf-print-start-live', 'reader-pdf-print-end-live', 'reader-pdf-print-fallback-start-live', 'reader-pdf-print-fallback-end-live']),
        observation: 'Print preview is a named focusable region with a visible focus outline. Tab reaches it after Pages; arrows scroll and explicit Home/End/PageUp/PageDown support horizontal virtualized preview navigation. Fully loaded visible endpoint thumbnails in the actual 101-page PDF verified, plus 101 preloaded synthetic thumbnails and the one-page boundary. A serial page-rendering fallback supplies thumbnails when PDF.js has no sidebar thumbnail viewer. Page labels now identify preview images; the visible Pages label targets its unique input ID. Cancel restores Print focus and no print action is submitted.',
        limitations: 'Live PDF virtualization loads visible windows rather than all 101 thumbnails simultaneously. Native-thumbnail-viewer absence also tested separately by temporarily hiding/restoring the viewer with a fresh real PDF cache. This checks preview keyboard access, not PDF document alternatives, native print dialogs, print jobs or full dialog reflow. No native screen-reader listening.',
    },
};
const states = fs.readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/batch-4/' + n, data: JSON.parse(fs.readFileSync(dir + n)) })).filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-4-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({ file, data }) => {
    const isFixture = data.kind === 'component-fixture';
    const runtime = isFixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = isFixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Intended host missing: ' + file);
    return [file.replace('evidence/', '').replace('.json', ''), isFixture ? 'component-fixture' : 'application', runtime, page.lang,
        page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'Targeted status feedback, equivalent navigation and long-print-preview validation; see assertions and scope limitations. No full conformance assertion.'];
})]));
for (const finding of Object.values(findings)) for (const file of finding.evidence) if (!fs.existsSync(root + file)) throw new Error('Missing capture: ' + file);
const summary = {
    batch: 4, branch: 'codex/a11y-batch-4-status-navigation-print', parentCommit: '1515e70058bfdbbf25dbe3f3125c883d2f42cab6', publishedCommit: '1501efa87e4b10ffac801ccb87fe39b0317e3787', implementationState: 'A15/A16/A27 committed and pushed to origin/codex/a11y-batch-4-status-navigation-print',
    inventory: 'docs/accessibility/evidence/batch-4/static-inventory.json', findings,
    validation: { fixtureScenarios: fixture.length, applicationScenarios: application.length, fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Per-finding scopes apply. Original audit and earlier batch evidence preserved. No publication tags, notes, storage location, keyboard shortcut or preset was changed and no print job was submitted. EPUB resource/selector and PDF page restored; audit panels closed. Native screen-reader listening and comprehensive format/theme/locale conformance remain outside these checks.',
};
fs.writeFileSync(root + 'remediation-batch-4.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ findings: Object.keys(findings), ...summary.validation }));
