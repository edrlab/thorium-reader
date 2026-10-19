const fs = require('node:fs');
const root = 'docs/accessibility/';
const dir = root + 'evidence/batch-3/';
const lib = p => 'src/renderer/library/components/' + p;
const reader = p => 'src/renderer/reader/components/' + p;
const common = p => 'src/renderer/common/components/' + p;
const fixture = JSON.parse(fs.readFileSync(dir + 'fixture-checks.json')).tests;
const application = JSON.parse(fs.readFileSync(dir + 'application-checks.json')).tests;
if (![...fixture, ...application].every(t => t.status === 'passed')) throw new Error('Batch 3 checks must pass before recording remediation');
const evidence = names => names.map(n => 'evidence/batch-3/' + n + '.json');
const findings = {
    A26: {
        status: 'fixed',
        files: [lib('settings/Settings.tsx'), lib('settings/KeyboardSettings.tsx'), lib('settings/SaveCreatorSettings.tsx'), lib('settings/ProfilesSettings.tsx'), lib('settings/StorageSettings.tsx'), reader('ReaderSettings/ReaderSettings.tsx'), reader('ReaderSettings/ReadingDisplayAlign.tsx'), reader('ReaderSettings/ReadingDisplayCol.tsx'), reader('ReaderSettings/SaveResetApplyPreset.tsx')],
        styles: ['src/renderer/assets/styles/components/settings.scss', 'src/renderer/assets/styles/components/modals.scss', 'src/renderer/assets/styles/components/popoverDialog.scss'],
        evidence: evidence(['library-320-general', 'library-320-keyboard-shortcuts', 'library-320-profiles', 'library-320-storage', 'library-320-advanced', 'reader-320-display', 'reader-320-text', 'reader-320-spacing', 'reader-320-preferences', 'library-fr-tab-general', 'library-fr-tab-keyboardShortcuts', 'library-fr-tab-profiles', 'library-fr-tab-storage', 'library-fr-tab-advanced', 'reader-live-200-display', 'reader-live-200-text', 'reader-live-200-spacing', 'reader-live-200-preferences', 'library-live-320-general', 'library-live-320-keyboard-shortcuts', 'library-live-320-profiles', 'library-live-320-storage', 'library-live-320-advanced']),
        observation: 'Settings no longer impose a minimum height larger than the viewport. Narrow modal settings use one vertical scroller, wrapped controls and a pinned Close/docking band. Shortcut actions, creator fields, radio choices and preset Reset content reflow. Positioned radio/profile cards anchor hidden native inputs so keyboard focus scrolls visible controls into view. All five Library tabs and four EPUB Reader tabs tested in 320x228 CSS fixtures, with French Library coverage, complete Tab cycles and point hit-testing. Live Reader uses actual Electron 200% zoom; live Library uses a 320x228 CSS viewport. No setting values, shortcuts or storage actions submitted.',
        limitations: 'Scope is modal Library/EPUB settings in sampled states. 320 CSS viewport uses CDP emulation rather than native window resizing. Other dialogs, custom profile branches, format-specific Reader tabs, all locales/themes and native screen-reader listening are not certified.',
    },
    A31: {
        status: 'fixed',
        files: [common('dialog/publicationInfos/tag/tagButton.tsx'), common('dialog/publicationInfos/tag/tagList.tsx'), lib('dialog/publicationInfos/TagManager.tsx')],
        styles: ['src/renderer/assets/styles/components/tags.scss'],
        evidence: evidence(['library-editable-tags', 'library-publication-tag-targets', 'library-live-tag-target', 'library-live-tag-popover']),
        observation: 'Tag pencil buttons have a real 24x24 CSS px target with a 12px icon; adjacent tag links have a 24px minimum height. Geometry and target-size checks pass in standalone and real TagManager fixtures. Existing Crime & mystery fiction tag in La Proie checked live; Enter opens the named popover, Delete receives focus, and Escape returns to the pencil without deleting a tag.',
        limitations: 'Addresses the audited tag pencils. It is not an application-wide minimum-target-size certification; unrelated small controls and the criterion exceptions require separate assessment.',
    },
};
const states = fs.readdirSync(dir).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/batch-3/' + n, data: JSON.parse(fs.readFileSync(dir + n)) })).filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-3-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({ file, data }) => {
    const isFixture = data.kind === 'component-fixture';
    const runtime = isFixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = isFixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Intended host missing: ' + file);
    return [file.replace('evidence/', '').replace('.json', ''), isFixture ? 'component-fixture' : 'application', runtime, page.lang,
        page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'Targeted modal-settings reflow and tag target validation; see layout/keyboard measurements and limitations. No full conformance assertion.'];
})]));
for (const finding of Object.values(findings)) for (const file of finding.evidence) if (!fs.existsSync(root + file)) throw new Error('Missing capture: ' + file);
const summary = {
    batch: 3, branch: 'codex/a11y-batch-3-reflow-targets', parentCommit: '937d9d5bc4656a8abd15c462c18d5bc48adc2383', implementationState: 'A26/A31 implemented and dynamically validated; uncommitted on batch 3 branch',
    inventory: 'docs/accessibility/evidence/batch-3/static-inventory.json', findings,
    validation: { fixtureScenarios: fixture.length, applicationScenarios: application.length, fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Per-finding scopes apply. Original audit and earlier batch evidence preserved. No publication metadata, notes, storage location, keyboard shortcut or preset was changed. Zoom, CSS viewport, text customization and docking were restored. Native screen-reader listening and comprehensive format/theme/locale conformance remain outside these checks.',
};
fs.writeFileSync(root + 'remediation-batch-3.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ findings: Object.keys(findings), ...summary.validation }));
