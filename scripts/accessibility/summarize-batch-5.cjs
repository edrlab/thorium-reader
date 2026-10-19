const fs = require('node:fs');
const root = 'docs/accessibility/';
const dir = root + 'evidence/batch-5/';
const lib = p => 'src/renderer/library/components/' + p;
const reader = p => 'src/renderer/reader/components/' + p;
const common = p => 'src/renderer/common/components/' + p;
const fixture = JSON.parse(fs.readFileSync(dir + 'fixture-checks.json')).tests;
const application = JSON.parse(fs.readFileSync(dir + 'application-checks.json')).tests;
if (![...fixture, ...application].every(t => t.status === 'passed')) throw new Error('Batch 5 checks must pass before recording remediation');
const evidence = names => names.map(n => 'evidence/batch-5/' + n + '.json');
const findings = {
    A17: {
        status: 'fixed',
        files: [common('customizationProfileDialog.tsx'), lib('layout/LibraryHeader.tsx')],
        authoringFiles: ['test/customization/profile/thorium_university_press/manifest.json', 'docs/customization-profile-screens.md'],
        evidence: evidence(['library-default-navigation', ...['decorative-en', 'decorative-fr', 'informative-en', 'informative-fr', 'fallback-fr', 'no-art-en'].flatMap(id => ['library-welcome-' + id, 'library-header-' + id])]),
        observation: 'Profile logos now expose an authored image title or the profile title; an explicit empty title is honored. Informative welcome alternatives preserve the selected/fallback language. Missing welcome artwork is omitted instead of rendering an empty src. Bundled University Press artwork was visually reviewed as decorative alongside complete welcome text and now explicitly declares an empty title. The unused string navigation-icon branch was removed; all current navigation icon producers use hidden SVGs and visible labels. The welcome checkbox initializes to false and Space toggles true/false; this repairs the missing required state discovered in real profile activation. Seven actual-app scenarios verify decorative, informative, English/French, fallback, absent-art and logo behavior using signed isolated profiles and Chromium AX trees.',
        limitations: 'Fixed in the audited application contract and reviewed sample/variants. Legacy untitled welcome images retain empty alt for compatibility, which does not prove arbitrary images decorative. Third-party image meaning, authored HTML alternatives, every locale/theme and native screen-reader listening require separate review. A17 has current Library call sites only; no Reader welcome/header implementation is claimed.',
    },
};
const states = fs.readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/batch-5/' + n, data: JSON.parse(fs.readFileSync(dir + n)) })).filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-5-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({ file, data }) => {
    const isFixture = data.kind === 'component-fixture';
    const runtime = isFixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = isFixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Intended host missing: ' + file);
    if (page.axe.violations.some(v => ['image-alt', 'aria-required-attr'].includes(v.id))) throw new Error('Unresolved targeted image/control rule: ' + file);
    return [file.replace('evidence/', '').replace('.json', ''), isFixture ? 'component-fixture' : 'application', runtime, page.lang,
        page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'A17 real packaged-profile image/name/language validation; see content-authoring and native AT limitations. No full conformance assertion.'];
})]));
for (const finding of Object.values(findings)) for (const file of finding.evidence) if (!fs.existsSync(root + file)) throw new Error('Missing capture: ' + file);
const summary = {
    batch: 5, branch: 'codex/a11y-batch-5-profile-alternatives', parentCommit: '1501efa87e4b10ffac801ccb87fe39b0317e3787', implementationState: 'A17 implemented and dynamically validated on batch 5 branch',
    inventory: 'docs/accessibility/evidence/batch-5/static-inventory.json', findings,
    validation: { fixtureScenarios: fixture.length, applicationScenarios: application.length, fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Per-finding scopes apply. Original audit and earlier batch evidence preserved. Signed audit profiles activated only in workspace-local isolated user data. Existing default library retained five publications and English locale. No catalogs or publications in generated packages. Native screen-reader listening and comprehensive format/theme/locale conformance remain outside these checks.',
};
fs.writeFileSync(root + 'remediation-batch-5.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ findings: Object.keys(findings), ...summary.validation }));
