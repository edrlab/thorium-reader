const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = 'docs/accessibility';
const dir = 'evidence/reader-actual-spreads';
const read = name => JSON.parse(fs.readFileSync(path.join(root, dir, name + '.json'), 'utf8'));
// Space left the setting at87.5%; capture21 is the actual75% verification.
if (fs.existsSync(path.join(root, dir, '20-font75.json'))) {
    const record = read('20-font75');
    record.label = '20-space-attempt87';
    fs.writeFileSync(path.join(root, dir, '20-font75.json'), JSON.stringify(record, null, 2) + '\n');
    for (const ext of ['.json', '.jpg']) fs.renameSync(path.join(root, dir, '20-font75' + ext), path.join(root, dir, '20-space-attempt87' + ext));
}
const names = fs.readdirSync(path.join(root, dir));
const captures = names.filter(name => /^\d\d-.*\.json$/.test(name));
for (const name of captures) assert.equal(read(name.slice(0, -5)).window.id, 3345306);
const speech = name => read(name).speech.join('\n');
assert.ok(read('21-font75-confirmed').tree.includes('Font size Value: 75'));
assert.ok(read('26-font200-pointer').tree.includes('Font size Value: 200'));
assert.ok(speech('26-font200-pointer').includes("'200%'"));
assert.ok(speech('09-near-end100-focus').includes("'button', 'focused', 'current location'"));
assert.ok(!read('53-alert-cleanup-complete').tree.includes('alert ID: toast-message'));
const setup = read('zoom-setup'), restored = read('zoom-restored');
assert.equal(setup.before, 2); assert.equal(setup.after, 1);
assert.equal(restored.before, 1); assert.equal(restored.after, 2);
const allEvidence = ['native-reader-actual-spreads-validation.json', ...names.map(name => dir + '/' + name)];
const evidence = labels => labels.flatMap(label => ['.json', '.jpg'].filter(ext => fs.existsSync(path.join(root, dir, label + ext))).map(ext => dir + '/' + label + ext));
const scope = 'Accessible EPUB 3, English LTR, Reader3345306, restored-size window, Columns2, text75/100/200%. User explicitly authorized temporary Electron webview zoom2 to1 solely for setup; all reading/settings/navigation inputs used native sky with NVDA2026.2. Zoom2 restored. Speech inspected as diagnostic text, not acoustically.';
const limitations = 'Sampled chapter11 and adjacent chapter12 only. No application-wide WCAG, RTL, vertical-writing, other-format or every-page pass. No wholly blank spread observed; navigation alerts obstructed the left page during later samples. Current-resource pointer reset and alert obstruction remain open observations, with no new WCAG criterion verdict.';
const result = {
    date: '2026-10-20', sourceRevision: '360bea2cdba3baf2b9ba1b46ab517f5311272c04',
    status: 'sampled actual spreads evaluated; two follow-up observations open',
    readerWindow: 3345306, recordedCaptures: captures.length, scope,
    setup: { authorization: 'User approved temporary zoom reset through Electron diagnostic API, native tests, and restoration.', original: 'host-layout.json and publication-layout.json retain the pre-reset zoom2/910-CSS-pixel fallback.', applied: 'zoom-setup.json', restored: 'zoom-restored.json', note: 'Reader was at restored size when validation resumed; corrected zoom still allowed two visible pages. Only setup/restoration used diagnostic mutation.' },
    results: [
        { textSize: '100%', spread: 'Two populated pages visibly rendered. Cross-resource near-end jump into chapter11 retained content. Advancing reached a final spread with content on the left and an empty right page; the next action reached chapter12.', evidence: evidence(['07-actual-spread100', '10-long-resource-near-end100', '13-final-spread100', '14-forward-boundary100', '15-next-resource100']) },
        { textSize: '75%', spread: 'Two populated pages visibly rendered. Near-end jump reached the chapter ending across both pages; Go forward reached chapter12.', evidence: evidence(['21-font75-confirmed', '22-close75', '23-near-end75', '24-forward-boundary75']) },
        { textSize: '200%', spread: 'Two pages visibly rendered with enlarged text. Near-end jump and seven forward actions traversed the remaining spreads, including an odd final spread, then reached chapter12. Alerts increasingly obscured the left page; unobstructed reading is not passed.', evidence: evidence(['26-font200-pointer', '27-close200', '28-near-end200', '34-final-spread200', '35-next-resource200']) }
    ],
    findings: {
        RHF04: { status: 'open advisory; current-resource pointer navigation inconsistent', observation: 'Clicks near the end of the current progress segment returned chapter15 and chapter11 to their starts (08 and11). Cross-resource clicks into chapter11 at the same region reached near-end content (10 and13). Cause not established; same-resource locator handling and NVDA/React Aria activation need separate diagnosis.' },
        RHF05: { status: 'open; navigation alerts obscure publication text', observation: 'With native accessibility support active, repeated Go forward actions produced persistent alerts. Ten accumulated and covered the left publication column; NVDA repeatedly announced them. Reader.navLeftOrRight_ schedules toasty(str), and ToastManager accumulates entries until close. Captures31–35 show obstruction; cleanup44–53 dismissed all ten. No focus-specific WCAG failure asserted without further testing.' }
    },
    cleanup: 'Font size100%, Columns Default, Scrollable, custom formatting unchecked and right docking restored. Original webview zoom2 restored. All ten generated alerts dismissed; Reader remains open on chapter12. Original chapter/reading position not restored. NVDA left running with diagnostic logging disabled.',
    limitations,
    checks: [
        { id: 'reader-actual-spread-setup', complete: true, status: 'Authorized zoom setup and restoration verified', files: ['src/renderer/reader/components/ReaderFooter.tsx', 'src/renderer/reader/components/ReaderSettings/ReadingDisplayCol.tsx'], evidence: allEvidence, observation: 'Earlier actual-spread setup gap resolved for this controlled sample: temporary webview zoom1 produced two visible pages; original zoom2 restored. Historical pending statuses in earlier records describe those earlier runs.', limitations: scope + ' ' + limitations },
        { id: 'reader-actual-spread-endpoints', complete: true, status: 'Actual two-page endpoint samples evaluated at75/100/200%', files: ['src/renderer/reader/components/ReaderFooter.tsx', 'src/renderer/reader/components/ReaderSettings/FontSize.tsx'], evidence: allEvidence, observation: 'Actual two-column rendering verified at all three text sizes; near-end native navigation retained publication content and forward actions reached chapter12 from chapter11 ending. Odd final spreads contained content on the left with an empty right page. Later200% samples obstructed by alerts.', limitations: scope + ' ' + limitations },
        { id: 'RHF04', complete: true, status: 'Open navigation consistency advisory', files: ['src/renderer/reader/components/ReaderFooter.tsx'], evidence: evidence(['08-near-end100', '11-right-edge100', '10-long-resource-near-end100', '13-final-spread100']), observation: 'Repeated near-end clicks on the current progress segment returned to chapter start; a cross-resource near-end click worked. Diagnosis pending; no new WCAG failure established.', limitations: 'Observed with NVDA running in this sample. Pointer/virtual activation and same-resource locator causes remain unseparated.' },
        { id: 'RHF05', complete: true, status: 'Open navigation-alert obstruction', files: ['src/renderer/reader/components/Reader.tsx', 'src/renderer/common/components/toast/Toast.tsx', 'src/renderer/common/components/toast/ToastManager.tsx'], evidence: evidence(['31-forward200-c', '34-final-spread200', '35-next-resource200', '53-alert-cleanup-complete']), observation: 'Repeated forward navigation with accessibility support active accumulated ten Go forward alerts, announced by NVDA, obscuring the left reading column. All dismissed during cleanup. Source traces feedback to persistent toast entries.', limitations: 'Confirmed visual obstruction in sampled spreads. Focus obscuration, timing, other toast modes and appropriate WCAG criterion outcome need separate validation.' }
    ]
};
fs.writeFileSync(path.join(root, 'native-reader-actual-spreads-validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, recordedCaptures: captures.length }));
