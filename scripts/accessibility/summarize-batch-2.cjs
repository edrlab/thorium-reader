const fs = require('node:fs');
const path = require('node:path');
const root = 'docs/accessibility/';
const prefix = root + 'evidence/batch-2/';
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
const fixtureTests = JSON.parse(fs.readFileSync(prefix + 'fixture-checks.json')).tests;
const liveTests = JSON.parse(fs.readFileSync(prefix + 'application-checks.json')).tests;
if ([...fixtureTests, ...liveTests].some(t => t.status !== 'passed')) throw new Error('Batch 2 checks must all pass');
const states = fs.readdirSync(prefix).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/batch-2/' + n, data: JSON.parse(fs.readFileSync(prefix + n)) })).filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-2-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({ file, data }) => {
    const fixture = data.kind === 'component-fixture';
    const runtime = fixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = fixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Missing intended host: ' + file);
    return [fixture ? path.basename(file, '.json') : data.label, fixture ? 'component-fixture' : 'application', runtime, page.lang, page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'Post-fix sampled state; baseline and batch 1 evidence preserved. Fixture scaffold may affect landmark/heading rules; remaining app findings stay open.'];
})]));
for (const finding of Object.values(findings)) for (const item of finding.evidence) if (!fs.existsSync(root + item)) throw new Error('Missing evidence: ' + item);
const summary = {
    batch: 2, branch: 'codex/a11y-batch-2-keyboard-semantics', parentCommit: 'adb0838e7', implementationState: 'In progress; validated initial keyboard/semantics subset on top of pushed batch 1',
    inventory: 'docs/accessibility/evidence/batch-2/static-inventory.json', findings,
    remainingPlannedFindings: ['A12', 'A22', 'A23', 'A24'],
    validation: { fixtureScenarios: fixtureTests.length, applicationScenarios: liveTests.length, fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Synthetic service boundaries used for downloads, profile activation, OPDS pagination and APIAPP response. Live local-catalog refresh, carousel, profile inspection, skip headings and TTS preview tested. No native screen-reader listening or full conformance assertion. Remaining notification, list, panel and filter-disclosure work is open. This batch is uncommitted.',
};
fs.writeFileSync(root + 'remediation-batch-2.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ fixedFindings: Object.keys(findings), ...summary.validation }));
