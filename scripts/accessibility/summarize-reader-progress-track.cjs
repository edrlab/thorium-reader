// Assert and summarize recorded native evidence; this does not run UI tests.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'docs/accessibility';
const relativeDir = 'evidence/reader-progress-track-fix';
const dir = path.join(root, relativeDir);
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
const evidence = names => names.map(name => relativeDir + '/' + name + '.json');
const names = fs.readdirSync(dir).filter(name => name.endsWith('.json'));
for (const name of names) {
    const record = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    assert.equal(record.window.id, 7343082, 'repair input must stay in the reopened Reader');
    assert.ok(!record.tree.includes('httpsr2://'), 'omit publication webview context');
}
function speech(name, ...parts) {
    const actual = read(name).speech.join('\n');
    for (const part of parts) assert.ok(actual.includes(part), name + ': ' + part);
}
speech('04-track-first-tab', 'Progression', 'Go to 1 / 21', 'button');
speech('05-track-second-tab', 'Go to 2 / 21', 'button');
speech('07-track-preface-tab', 'Go to 4 / 21: Preface');
speech('08-track-code-tab', 'Go to 5 / 21: Using Code Examples');
speech('10-track-enter-focus-query', 'Go to 5 / 21: Using Code Examples', 'focused', 'current location');
speech('25-final-tab-mode-check', 'Go to 6 / 21: Safari');
speech('26-final-space-activate', 'current location');
speech('27-final-reverse-tab', 'Go to 5 / 21: Using Code Examples');
speech('28-final-enter-activate', 'current location');
speech('30-final-virtual-enter', 'Using Code Examples');
speech('39-restore-focus-query', 'Go to 15 / 21: Talk to Me: Media Overlays', 'focused', 'current location');
speech('41-final-original-section', 'Talk to Me: Media Overlays');
const baseline = read('00-fixed-reader-baseline').tree;
assert.equal((baseline.match(/button Go to \d+ \/ 21/g) || []).length, 21);
assert.ok(baseline.includes('group Progression'));
assert.ok(!/\d+ button\s*$/m.test(baseline), 'no unnamed baseline buttons');
const original = JSON.parse(fs.readFileSync(path.join(root,
    'evidence/reader-header-footer-nvda/47-progress-track-focus-query.json'), 'utf8'));
assert.ok(original.speech.some(line => line.includes("'button', 'focused'")));
assert.ok(!original.speech.some(line => line.includes('Go to')));
const record = {
    date: '2026-10-20', status: 'fixed in sampled scope', findingId: 'RHF01',
    branch: 'codex/a11y-reader-progress-track',
    baseBranch: 'codex/a11y-native-n01-n03',
    baseRevision: '700398b8103c5770d0234bd3abdf0d5fa0bc8b08',
    basePullRequest: 'https://github.com/edrlab/thorium-reader/pull/4020',
    sourceHashes: Object.fromEntries([
        'src/renderer/reader/components/ReaderFooter.tsx',
        'src/renderer/assets/styles/components/readerFooter.scss',
    ].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex')])),
    baseline: 'reader-header-footer-native-validation.json',
    environment: {
        screenReader: 'NVDA 2026.2 portable AMD64, OneCore en_GB, add-ons disabled, isolated audit config',
        application: 'Thorium 3.5.2-beta.1, npm run start:dev:quick',
        sample: 'Accessible EPUB 3', locale: 'English', screenReaderOptimization: 'No',
        method: 'Native computer-use keyboard/mouse and real NVDA diagnostic speech inspected as text; no DOM/CDP input or acoustic listening.',
        logging: 'Temporary diagnostic logging disabled after tests; NVDA left running.',
    },
    implementation: [
        'Expose the track as a named Progression group and replace hidden clickable spans with React Aria native Button controls.',
        'Name destinations with localized Go to, reading-order position/total and authored title when available, including nested TOC titles. Unnamed resources retain ordinal destinations.',
        'Expose aria-current=location for the current section. Support Tab/Shift+Tab, Enter, Space and AT virtual press activation.',
        'Keyboard/virtual press requests section progression0; physical pointer press uses the clamped relative x offset. Preserve existing PDF/Divina routes.',
        'Reset native button styles to retain the track appearance and provide a contrasting inset keyboard-focus outline.',
    ],
    recordedCaptures: names.length,
    checks: [
        {
            id: 'reader-header-native-sample', complete: true,
            status: 'Evaluated sampled native Reader header on spacing branch; scope remains historical',
            files: ['src/renderer/reader/components/ReaderHeader.tsx', 'src/renderer/reader/components/Reader.tsx'],
            evidence: [
                'reader-header-footer-native-validation.json',
                'evidence/reader-header-footer-nvda/07-information-focus-return.json',
                'evidence/reader-header-footer-nvda/59-skip-activate.json',
            ],
            observation: 'Historical dbb8a136f native header sample names controls, verifies Information dismissal/focus return, panel toggle states, Zen exit and Skip to content. TTS initial-rate display and mode/shortcut observations remain qualified in the baseline record.',
            limitations: 'Historical spacing-branch sample, not a retest of every header repair on this stacked branch. No bookmark/annotation mutation, TTS playback, all dialog actions, formats/locales or acoustic assessment.',
        },
        {
            id: 'RHF01', complete: true, status: 'Fixed and native NVDA verified in sampled EPUB progress track',
            criteria: ['4.1.2 Name Role Value'],
            files: ['src/renderer/reader/components/ReaderFooter.tsx'],
            evidence: ['native-reader-progress-track-remediation.json', ...evidence([
                '00-fixed-reader-baseline', '04-track-first-tab', '08-track-code-tab',
                '10-track-enter-focus-query', '25-final-tab-mode-check', '26-final-space-activate',
                '27-final-reverse-tab', '28-final-enter-activate', '30-final-virtual-enter',
                '33-pointer-middle', '39-restore-focus-query', '41-final-original-section',
                '42-final-focus-style',
            ])],
            observation: 'All21 rendered destinations are named in UIA. Native Tab enters Progression after history, announces ordinal/title/button, and Shift+Tab reverses destination order. Enter/Space navigate and announce current location; NVDA+Tab confirms named focus/current state. Final Enter and virtual Enter display the section start; representative middle pointer click displays a later page. Focus styling is screenshot-reviewed. Original Talk to Me section restored.',
            limitations: 'One English EPUB/default paginated view. No PDF/Divina/audio, RTL, all locales, collapsed marker sets in long spines, ending mark-as-read action, full contrast/reflow/target-size assessment or acoustic assessment. Mode-dependent preparation is retained; no global keyboard/conformance pass.',
        },
    ],
    observations: [
        'Initial hot-update module was stale; Reader reload became blank. User authorized one Library reopen. All repair records target only the newly opened Reader7343082.',
        'Captures00-14 exercise the initial native-button implementation.15-17 remount footer content through Reader-only Zen after the press-handler refinement; final activation evidence is25-30 and39-41.',
        'Some Tab/Enter attempts after pointer focus were ineffective in the observed NVDA mode. Mode toggle24 precedes the final successful Tab, Space and reverse-Tab sequence. No unconditional all-mode pass is claimed.',
        'Near-end physical click31 and settled32 showed a blank publication page; middle click33 displayed a later page. This is an unresolved position/rendering observation, not part of the missing-name closure. No all-position pointer pass is claimed.',
        'Ctrl+End attempts34-35 did not establish track-exit behavior; do not count them as an end-to-end focus-order pass.',
        'Capture42 checks final focus styling after speech logging was disabled, so it contains no speech claim.',
    ],
    verification: {
        evidenceAssertions: 'Passed; validates recorded evidence, not a fresh UI run',
        buildEvidence: 'evidence/reader-progress-track-fix/build-summary.txt',
        static: 'Full TypeScript, changed-file ESLint/stylelint and Reader Webpack/runtime scope check passed. Final stylesheet compiled in the running development server.',
    },
    finalState: 'Reader open at Talk to Me: Media Overlays; Zen off; no publication menu, annotation, bookmark, mark-as-read, acquisition or external communication action invoked. Test history entries remain.',
};
fs.writeFileSync(path.join(root, 'native-reader-progress-track-remediation.json'), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ recordedCaptures: names.length, fixed: 'RHF01', status: 'recorded native assertions passed' }));
