const fs = require('node:fs');
const path = require('node:path');
const root = 'docs/accessibility/';
const prefix = root + 'evidence/batch-1/';
const common = p => 'src/renderer/common/components/' + p;
const reader = p => 'src/renderer/reader/components/' + p;
const lib = p => 'src/renderer/library/components/' + p;
const evidence = (...names) => names.map(n => 'evidence/batch-1/' + n + '.json');
const findings = {};
function add(id, files, captures, observation, status = 'fixed') { findings[id] = { status, files, evidence: evidence(...captures), observation }; }
const sliders = [reader('ReaderSettings/FontSize.tsx'), reader('ReaderSettings/Slider.tsx'), reader('ReaderSettings/ReadingSpacing.tsx')];
add('A01', sliders, ['reader-font-settings', 'reader-spacing-settings', 'reader-settings-text', 'reader-settings-spacing'], 'Unique React IDs connect all six range inputs to visible setting names; verified in fixtures and live modal settings.');
add('A02', sliders.slice(1), ['reader-spacing-settings', 'reader-spacing-settings-fr', 'reader-settings-spacing'], 'All ten spacing adjustment buttons have localized action/setting names. Repeated keyboard activation keeps index and displayed value synchronized.');
add('A03', [reader('AnnotationEdit.tsx'), reader('BookmarkEdit.tsx'), reader('ReaderMenu/AnnotationCard.tsx'), reader('ReaderMenu/BookmarkCard.tsx')], ['reader-annotation-card-editing', 'reader-bookmark-card-editing', 'reader-bookmark-editor'], 'Visible labels name both inline textareas; live bookmark creation popup is labelled and cancelled without saving. Escape returns Edit focus in inline fixtures. Annotation popup uses the same labelled textarea but was not separately exercised live.');
add('A04', [lib('dialog/ApiappAddForm.tsx')], ['library-apiapp-add'], 'Visible search label now targets the actual input ID; computed Search name verified. A09 option ownership remains.');
add('A08', [lib('settings/OverloadNoteExportToHtml.tsx')], ['library-template-editor'], 'Template textarea references the visible heading with a unique ID; no label rule failure in enabled-editor fixture.');
add('A13', sliders, ['reader-font-settings', 'reader-spacing-settings', 'reader-settings-text', 'reader-settings-spacing'], 'Font uses native 75..400 limits and percentage valuetext; spacing exposes actual configured values/units and localized Default instead of announcing bare option indices.');
add('A17', [common('customizationProfileDialog.tsx'), lib('layout/LibraryHeader.tsx')], ['library-welcome-profile-decorative', 'library-welcome-profile-titled-fr'], 'Welcome images use localized manifest image.title as alt, or empty alt for decorative untitled images. Decorative navigation icons now have empty alt and aria-hidden; that string-icon branch was not reached live. Profile owners must supply titles for informative images; alternative quality is not certified.', 'partial');
add('A18', [common('DocumentLanguage.tsx'), lib('App.tsx'), reader('App.tsx'), 'src/renderer/library/index_library.ejs', 'src/renderer/reader/index_reader.ejs'], ['reader-baseline', 'reader-locale-fr', 'reader-spacing-settings-fr'], 'Both host templates start with lang=en. Shared Redux locale observer follows live English->French->English changes in Library and Reader. PDF viewer/document-language assessment remains outside this batch.');
add('A19', [lib('opds/FeedCard.tsx')], ['library-catalog-favorites', 'library-catalogs'], 'Favorite buttons have stable localized catalog-specific names and aria-pressed. True/false states verified in fixtures and existing catalog states inspected live without mutation.');
add('A20', [lib('searchResult/AllPublicationPage.tsx')], ['library-table-description-popover', 'library-table-descriptions'], 'Description/accessibility expanders and their popovers are named with column heading and publication title. Live Enter opens the named dialog; Escape restores trigger focus.');
add('A28', [common('dialog/publicationInfos/tag/tagButton.tsx')], ['library-tag-delete-popover', 'library-editable-tags'], 'Tag pencil buttons and dialogs have localized tag-specific names. Chromium AX confirms Edit tag: Research; Escape restores trigger. A31 target size remains.');
add('A30', [lib('DownloadsPanel.tsx')], ['library-downloads'], 'Both determinate and indeterminate native progressbars expose their download title as the computed Chromium AX name. A05 cancel keyboard access remains.');
const fixtureTests = JSON.parse(fs.readFileSync(prefix + 'fixture-checks.json')).tests;
const liveTests = JSON.parse(fs.readFileSync(prefix + 'application-checks.json')).tests;
if ([...fixtureTests, ...liveTests].some(t => t.status !== 'passed')) throw new Error('Post-fix checks did not all pass');
const states = fs.readdirSync(prefix).filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/batch-1/' + n, data: JSON.parse(fs.readFileSync(prefix + n)) })).filter(r => r.data.kind === 'component-fixture' || r.data.pages);
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const isWcag = r => r.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'batch-1-state-results.csv', csv([['state', 'coverage_kind', 'window', 'document_language', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'raw_evidence', 'screenshot', 'interpretation'], ...states.map(({file, data}) => {
    const fixture = data.kind === 'component-fixture';
    const runtime = fixture ? data.runtime : data.label.startsWith('reader') ? 'reader' : 'library';
    const page = fixture ? data : data.pages.find(p => p.url.includes(`index_${runtime}.html`));
    if (!page) throw new Error('Missing intended host: ' + file);
    return [fixture ? path.basename(file, '.json') : data.label, fixture ? 'component-fixture' : 'application', runtime, page.lang, page.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), page.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), file, `evidence/${page.evidencePrefix}.png`, 'Post-fix sampled state; unchanged findings still present; no application conformance assertion'];
})]));
const summary = {
    batch: 1, branch: 'codex/a11y-batch-1-names-labels', auditBaseline: '1fcc4fa782cf0b24441128903f40b48fd476bba5', implementationState: 'Batch 1 source changes relative to auditBaseline; see branch history',
    inventory: 'docs/accessibility/evidence/batch-1/static-inventory.json',
    findings, validation: { fixtureScenarios: fixtureTests.length, applicationScenarios: liveTests.length, fixtureStates: states.filter(s => s.data.kind === 'component-fixture').length, applicationStates: states.filter(s => s.data.pages).length, allScenariosPassed: true },
    limitations: 'Scopes recorded per finding. Native screen-reader listening, full locale coverage, remaining keyboard/semantics/layout/status findings and real authenticated lending flows are not certified. Original audit evidence is retained unchanged.',
};
for (const f of Object.values(findings)) for (const item of f.evidence) if (!fs.existsSync(root + item)) throw new Error('Missing evidence: ' + item);
fs.writeFileSync(root + 'remediation-batch-1.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ fixedFindings: Object.entries(findings).filter(([,f]) => f.status === 'fixed').map(([id]) => id), partialFindings: Object.entries(findings).filter(([,f]) => f.status === 'partial').map(([id]) => id), ...summary.validation }));
