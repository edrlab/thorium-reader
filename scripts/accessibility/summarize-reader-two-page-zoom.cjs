const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = 'docs/accessibility';
const dir = 'evidence/reader-two-page-zoom';
const names = fs.readdirSync(path.join(root, dir));
const captures = names.filter(name => /^\d\d-.*\.json$/.test(name));
const read = name => JSON.parse(fs.readFileSync(path.join(root, dir, name + '.json'), 'utf8'));
const speech = name => read(name).speech.join('\n');
for (const name of captures) assert.equal(read(name.slice(0, -5)).window.id, 11602068, 'Reader-only scope');
assert.ok(speech('03-two-columns-keyboard').includes("'2 cols', 'radio button'"));
assert.ok(speech('03-two-columns-keyboard').includes("'checked'"));
assert.ok(speech('09-font-minimum').includes("'75%'"));
assert.ok(speech('22-font200').includes("'200%'"));
assert.ok(read('28-font100-reset').tree.includes('Font size Value: 100'));
assert.ok(speech('25-font200-focus').includes("'button', 'focused', 'current location'"));
assert.ok(speech('35-custom-formatting-restored').includes("'not checked'"));
const layout = JSON.parse(fs.readFileSync(path.join(root, dir, 'layout-font75.json'), 'utf8'));
assert.equal(layout.html.columnCount, '1');
assert.equal(layout.html.clientWidth, 910);
const evidence = names.map(name => dir + '/' + name);
const limitations = 'Sampled Accessible EPUB 3 resource only. Requested 2 cols rendered one column: no actual two-page, odd-spread, RTL, vertical-writing or other-format native pass. Text percentages are publication body scaling, not Electron window zoom or OS magnification. Speech inspected as text, without acoustic assessment. No full WCAG conformance claim.';
const result = {
    date: '2026-10-20', sourceRevision: 'b1f0f8a2c',
    status: 'partial: text-scale endpoints evaluated; actual two-page layout pending',
    method: 'Native sky inputs and NVDA 2026.2 portable diagnostic speech; screenshots manually reviewed. CDP used only for read-only numeric layout inspection at 75%.',
    readerWindow: 11602068, recordedCaptures: captures.length,
    settings: { initial: 'Customize text formatting unchecked; Columns Default; font size 100%; 1092x828 screenshot.', tested: 'Custom formatting checked; Columns 2 cols; font size 75%, 100%, 200%; maximized 1920x1200 screenshot.', restored: 'Font size 100%; Columns Default; custom formatting unchecked; settings closed; original window size; Talk to Me resource. Exact reading position not restored.' },
    results: [
        { scale: '75%', nearEnd: 'Visible complete short resource after x538/y1178 near-end click.', forward: 'Go forward reaches Safari Books Online with visible content.', captures: ['12-font75-near-end', '13-font75-current-page', '15-font75-next-resource'] },
        { scale: '100%', nearEnd: 'Visible complete short resource after same near-end click; settings heading and slider verify100%.', captures: ['28-font100-reset', '30-font100-near-end'] },
        { scale: '200%', nearEnd: 'Visible last content page after same near-end click; NVDA reports current named destination.', forward: 'Go forward reaches Safari Books Online directly, with visible content.', captures: ['22-font200', '24-font200-near-end', '25-font200-focus', '26-font200-forward-boundary'] }
    ],
    twoPage: { status: 'not evaluated as an actual spread', observation: 'ArrowRight selects 2 cols and NVDA announces checked. Original, maximized and Zen views remain single-column. At maximized75% the publication viewport measures910 CSS pixels; computed columnCount1 and columnWidth720px. ReadiumCSS-after.css applies the explicit count at min-width60em (960 CSS pixels at16px).', nextStep: 'Repeat on a Reader publication viewport at least960 CSS pixels wide, verify two visible columns, then sample even/odd final spreads and near-end clicks at the same text scales.' },
    advisories: ['Docked settings visually clip the third Columns radio at the panel right edge. ArrowRight selects it and horizontally shifts panel content. This is retained as a reflow follow-up, not a newly established WCAG failure.', 'Ctrl+- did not visibly change the Reader window zoom. No window-zoom percentage was verified.', 'Native UIA set_value changed the exposed slider value without changing its heading/content; it was excluded from scale results. Subsequent actual pointer/ArrowLeft inputs produced matching heading, content and NVDA200%.'],
    cleanup: 'Reader-only inputs throughout; original settings/window size restored; NVDA left running with diagnostic logging disabled. Raw logs ignored under dist.',
    limitations,
    checks: [
        { id: 'reader-text-scale-endpoints', complete: true, status: 'Sampled 75/100/200% text-scale endpoints evaluated', files: ['src/renderer/reader/components/ReaderFooter.tsx', 'src/renderer/reader/components/ReaderSettings/FontSize.tsx'], evidence, observation: 'Near-end clicks retained visible content at75%,100%,200%; forward boundary reached the next resource at75% and200%. NVDA named the focused current destination at75% and200%, and announced keyboard slider values. Scale verification excludes the unsuccessful UIA-only value assignment.', limitations },
        { id: 'reader-two-page-layout', complete: false, status: 'Two-column selection verified; actual spread validation pending', files: ['src/renderer/reader/components/ReaderFooter.tsx', 'src/renderer/reader/components/ReaderSettings/ReadingDisplayCol.tsx', 'src/renderer/reader/components/ReaderSettings/ReaderSettings.tsx'], evidence, observation: 'NVDA announced 2 cols checked after ArrowRight, but the viewport retained one column below the stylesheet breakpoint. Docked panel clipped the third radio until keyboard selection horizontally shifted it. A wider logical viewport is required for the requested spread checks.', limitations }
    ]
};
fs.writeFileSync(path.join(root, 'native-reader-two-page-zoom-validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ recordedCaptures: captures.length, status: result.status }));
