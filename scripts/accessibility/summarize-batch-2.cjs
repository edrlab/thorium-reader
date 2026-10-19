const fs = require('node:fs');
const root = 'docs/accessibility/';
const common = p => 'src/renderer/common/components/' + p;
const reader = p => 'src/renderer/reader/components/' + p;
const lib = p => 'src/renderer/library/components/' + p;
const findings = {};
function add(id, files, captures, observation) {
    findings[id] = { status: 'fixed', files, evidence: captures.map(n => 'evidence/batch-2/' + n + '.json'), observation };
}
add('A05', [lib('DownloadsPanel.tsx')], ['library-downloads', 'library-downloads-fr'], 'Native cancel buttons have localized download-specific names. Enter/Space each dispatch one abort for the intended synthetic ID; native progressbar names retained. No live download aborted.');
add('A06', [lib('utils/Slider.tsx')], ['library-carousel-scrolled', 'library-carousel-start', 'library-home-carousel'], 'Carousel buttons are exposed in the accessibility tree. Enter moves right and enables Left; Space moves back and disables Left at start. Verified in fixture and live Home.');
add('A07', [lib('layout/LibraryLayout.tsx'), lib('opds/PageNavigation.tsx')], ['library-library-refresh', 'library-opds-navigation', 'library-opds-navigation-disabled', 'library-opds-refresh'], 'Refresh and pagination use one named native button per action. Four pagination controls follow DOM tab order and dispatch distinct navigation routes. Missing links/page-boundary buttons are disabled and cannot dispatch on click. Both refresh keyboard activations verified against existing loopback OPDS catalog; no remote transaction.');
add('A09', [lib('dialog/ApiappAddForm.tsx')], ['library-apiapp-results'], 'APIAPP results are ordinary named buttons with aria-pressed. Enter/Space select one result without submitting or closing the dialog; Add remains the explicit submission control. Synthetic API response only. Full-height result buttons preserve two-line labels.');
add('A10', [lib('settings/ProfilesSettings.tsx')], ['library-profiles', 'library-live-profiles'], 'One native radio per profile, shared group name, localized named radiogroup, unique DOM IDs and visible-title accessible names. Arrow keys update checked state/focus and Space selects once using real reducer; vanilla inspected live without activating a profile.');
add('A21', [lib('layout/LibraryLayout.tsx'), reader('Reader.tsx')], ['library-library-refresh', 'reader-host-headings'], 'Existing toolbar/content skip headings now declare aria-level=2 in both windows. Programmatic focus remains available on both targets. Native screen-reader heading navigation not exercised.');
add('A25', [reader('ReadingAudio.tsx')], ['reader-tts-preview-expanded', 'reader-tts-preview'], 'TTS preview details no longer hides its focusable summary. Enter/Space opens/closes preview in fixture and live TTS options; Chromium AX exposes the expanded disclosure. Escape restores TTS options trigger. No audio played.');
add('A29', [common('dialog/publicationInfos/PublicationInfoDescription.tsx')], ['library-description-expanded', 'library-description-collapsed', 'reader-description-expanded', 'reader-description-collapsed'], 'Description disclosure is exposed, reports aria-expanded and controls the unique description wrapper ID. Enter/Space expands/collapses in both runtime fixtures.');
function addContinuation(id, files, captures, observation) {
    findings[id] = { status: 'fixed', files, evidence: captures.map(n => 'evidence/batch-2-continuation/' + n + '.json'), observation };
}
addContinuation('A12', [common('toast/Toast.tsx'), common('toast/ToastManager.tsx')], ['library-notification-collapsed', 'library-notification-expanded-copied', 'library-notification-copy-failed', 'library-notification-fr', 'library-notification-stack', 'reader-notification-expanded-copied', 'reader-notification-copy-failed', 'library-live-notification'], 'Notifications have native Details, Copy notification and Close buttons. Details exposes expanded/controls state; copy success/failure is a polite status. Visible messages persist until dismissed, including beyond the old five-second timeout with no focus and after blur. Keyboard copy tests record the complete message through a temporary clipboard stub; OS clipboard preserved. Both renderer fixtures and a real Library notification tested. Native screen-reader listening remains unverified.');
addContinuation('A22', [lib('layout/LibraryHeader.tsx'), reader('ReaderHeader.tsx')], ['library-library-navigation', 'library-live-valid-navigation', 'reader-epub-valid-navigation', 'reader-pdf-valid-navigation'], 'Library navigation list now directly contains list items, with Settings kept at the bottom. Reader toolbar uses a div for the group layout and valid ul/li groups; its decorative separator is a hidden presentation list item. Static structure and live EPUB/PDF/Library checks pass. Audiobook and Divina conditional branches source-reviewed only.');
addContinuation('A23', [common('Dialog.tsx'), reader('ReaderHeader.tsx'), reader('ReaderSettings/ReaderSettings.tsx'), reader('ReaderMenu/ReaderMenu.tsx'), reader('DockedHeader.tsx')], ['reader-panel-left', 'reader-panel-right', 'reader-panel-modal', 'reader-panel-mode-switch', 'reader-live-navigation-left', 'reader-live-navigation-right', 'reader-live-navigation-modal', 'reader-live-settings-left', 'reader-live-settings-right', 'reader-live-settings-modal'], 'Docked roots have their own overlay state, stable panel ID and named region. Trigger aria-controls resolves to the displayed region; closed triggers omit controls and report expanded=false. Modal composition retains React Aria behavior. Both Navigation and Reader settings verified live on both dock sides and as modal; reopened modal retains Tab focus and Escape restores the header trigger.');
addContinuation('A24', [reader('ReaderMenu/FilterPopover.tsx')], ['reader-filters-selected', 'reader-filters-empty', 'reader-live-filter-actions'], 'All/None native buttons are siblings of summary inside each details, with filter-specific accessible names. Enter/Space disclosure and bulk selection are independent for tag/color/type/creator in populated fixtures. Empty tag/creator actions are disabled. Live color filter actions tested on empty annotation list and initial selection restored; no note saved or deleted.');
const directories = ['batch-2', 'batch-2-continuation', 'batch-2-regression'];
const validationRuns = directories.map(directory => {
    const read = name => {
        const file = root + 'evidence/' + directory + '/' + name + '.json';
        return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)).tests : [];
    };
    const fixtures = read('fixture-checks'), application = read('application-checks');
    if (!fixtures.length || [...fixtures, ...application].some(t => t.status !== 'passed')) throw new Error('Batch 2 checks must all pass: ' + directory);
    return { directory: 'evidence/' + directory, fixtureScenarios: fixtures.length, applicationScenarios: application.length };
});
const states = directories.flatMap(directory => fs.readdirSync(root + 'evidence/' + directory).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json'))
    .map(n => ({ file: 'evidence/' + directory + '/' + n, data: JSON.parse(fs.readFileSync(root + 'evidence/' + directory + '/' + n)) })))
    .filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-2-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({ file, data }) => {
    const fixture = data.kind === 'component-fixture';
    const runtime = fixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = fixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Missing intended host: ' + file);
    return [file.replace('evidence/', '').replace('.json', ''), fixture ? 'component-fixture' : 'application', runtime, page.lang, page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'Sampled post-fix state; initial batch 2 captures preserved. Fixture scaffold affects landmark/heading rules and synthetic panel-button target sizes; see report. Remaining reviews stay open.'];
})]));
for (const finding of Object.values(findings)) for (const item of finding.evidence) if (!fs.existsSync(root + item)) throw new Error('Missing evidence: ' + item);
const summary = {
    batch: 2, branch: 'codex/a11y-batch-2-keyboard-semantics', parentCommit: 'adb0838e7', publishedInitialCommit: '0ed29902babf4238d366e9d846f06d4bfe72e354', implementationState: 'Initial eight findings committed and pushed; remaining four findings implemented and dynamically validated as an uncommitted continuation',
    inventory: 'docs/accessibility/evidence/batch-2-continuation/static-inventory.json', findings,
    remainingPlannedFindings: [], validationRuns,
    validation: { fixtureScenarios: validationRuns.reduce((n, r) => n + r.fixtureScenarios, 0), applicationScenarios: validationRuns.reduce((n, r) => n + r.applicationScenarios, 0), fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Service-boundary stubs documented per finding; no OS clipboard mutation or real lending/loan/download transaction. No native screen-reader listening or full conformance assertion. A17 content review, A15/A16/A27 risks, A26 reflow/zoom, A31 target size and other format-specific assessments remain. Continuation is uncommitted; original and published evidence preserved.',
};
fs.writeFileSync(root + 'remediation-batch-2.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ fixedFindings: Object.keys(findings), ...summary.validation }));
