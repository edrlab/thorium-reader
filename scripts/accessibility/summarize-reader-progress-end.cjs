const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = 'docs/accessibility';
const file = path.join(root, 'native-reader-progress-end-remediation.json');
const repair = JSON.parse(fs.readFileSync(file, 'utf8'));
const directory = path.join(root, 'evidence/reader-progress-end');
const names = fs.readdirSync(directory).filter(name => name.endsWith('.json'));
const capture = name => JSON.parse(fs.readFileSync(path.join(directory, name + '.json'), 'utf8'));
assert.ok(capture('05-near-end-focus').speech.join('\n').includes("'button', 'focused', 'current location'"));
assert.ok(capture('09-keyboard-previous-destination').speech.join('\n').includes('Current page: 2/2'));
assert.ok(capture('10-keyboard-activate-start').speech.join('\n').includes("'heading', 'level 2', 'Using Code Examples'"));
for (const name of names.filter(name => /^0[3-9]|^1[0-3]/.test(name))) {
    assert.equal(capture(name.slice(0, -5)).window.id, 11602068, 'Reader-only repair scope');
}
repair.status = 'fixed in sampled scope';
repair.sourceHashes = Object.fromEntries(repair.files.map(source => [source,
    crypto.createHash('sha256').update(fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n')).digest('hex')]));
repair.nativeRepairValidation = {
    status: 'passed in sampled reflowable EPUB scope',
    recovery: 'User foregrounded a fresh Reader; selected returned window 11602068. Adjacent resource navigation loaded the rebuilt preload.',
    scope: 'Accessible EPUB 3, Using Code Examples; Windows portable NVDA 2026.2; all repair inputs in Reader 11602068 via sky.',
    results: [
        'Original x337/y806 near-end click, x342/y806 right-edge click and x323/y806 middle click show publication content in retained screenshots.',
        'NVDA+Tab reports Go to 5 / 21: Using Code Examples, button, focused, current location.',
        'Go forward from the last content page reaches Safari Books Online with visible content, without a padding-only page.',
        'Tab and Shift+Tab reach adjacent named destinations; NVDA reports Current page: 2/2. Enter returns Using Code Examples to its visible heading.',
        'Returned to Talk to Me: Media Overlays and remained in Reader. Final Enter announced its heading, but screenshot retained later content; visual start-position restoration is not claimed.'
    ],
    limitations: 'Speech inspected as diagnostic text, without acoustic assessment. Exact numeric progression 1, zoom, RTL, vertical writing, odd spreads and other formats have unit coverage where applicable but no native repair pass. No application-wide WCAG assertion.'
};
repair.cleanup = 'NVDA left running with --no-logging; full diagnostic logs remain ignored under dist.';
repair.recordedCaptures = names.length;
repair.checks = [{
    id: 'RHF02', complete: true, status: 'Fixed in sampled EPUB; native NVDA verified',
    files: ['src/renderer/reader/components/ReaderFooter.tsx'],
    runtimeDependencies: repair.files,
    evidence: ['native-reader-progress-end-remediation.json', ...fs.readdirSync(directory).map(name => 'evidence/reader-progress-end/' + name)],
    observation: 'Near-end progress clicks no longer navigate to a padding-only page. Screenshots show content, forward navigation reaches the next resource, and NVDA reports the named current destination and page 2/2. The fix is in shared navigator preload pagination math used by the Reader footer.',
    limitations: repair.nativeRepairValidation.limitations
}];
fs.writeFileSync(file, JSON.stringify(repair, null, 2) + '\n');
console.log(JSON.stringify({ status: repair.status, recordedCaptures: names.length }));
