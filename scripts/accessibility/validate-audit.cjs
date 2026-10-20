const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve('docs/accessibility');
function csv(file) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const rows = []; let row = [], value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
        else if (c === ',' && !quoted) { row.push(value); value = ''; }
        else if (c === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
        else value += c;
    }
    if (value || row.length) { row.push(value); rows.push(row); }
    assert.equal(quoted, false, file + ' has unclosed quotes');
    const header = rows.shift();
    return rows.filter(r => r.length > 1).map(r => { assert.equal(r.length, header.length, file + ' column count'); return Object.fromEntries(header.map((h, i) => [h, r[i]])); });
}
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]); }
const files = walk(path.join(root, 'evidence'));
assert.equal(files.filter(f => /[\\/]failure-/.test(f)).length, 0, 'Unresolved fixture capture failure');
for (const file of files.filter(f => f.endsWith('.json'))) JSON.parse(fs.readFileSync(file));
const matrix = csv('component-matrix.csv');
const remediations = fs.readdirSync(root).filter(n => /^remediation-batch-\d+\.json$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map(n => JSON.parse(fs.readFileSync(path.join(root, n))));
const inventoryCount = JSON.parse(fs.readFileSync(remediations.at(-1)?.inventory || path.join(root, 'evidence/static-inventory.json'))).files.length;
assert.equal(matrix.length, inventoryCount);
assert.equal(new Set(matrix.map(r => r.file)).size, inventoryCount);
assert.equal(matrix.filter(r => r.coverage_kind === 'inactive').length, 3);
assert.equal(matrix.filter(r => r.coverage_kind === 'untested' || r.runtime_evidence === 'Not exercised').length, 0);
for (const row of matrix) assert.ok(fs.existsSync(row.file), row.file);
const nativeFile = path.join(root, 'native-nvda-validation.json');
if (fs.existsSync(nativeFile)) {
    const native = JSON.parse(fs.readFileSync(nativeFile, 'utf8'));
    assert.equal(native.recordedNativeChecks, native.checks.length);
    assert.equal(native.completedNativeScenarios, native.checks.filter(check => check.complete).length);
    assert.ok(fs.existsSync(path.join(root, native.environmentEvidence)));
    const catalogFile = path.join(root, 'native-banq-validation.json');
    if (fs.existsSync(catalogFile)) {
        const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
        assert.equal(catalog.screenReader.started, true);
        assert.equal(catalog.recordedNativeChecks, catalog.checks.length);
        assert.equal(catalog.completedNativeScenarios, catalog.checks.filter(check => check.complete).length);
        const repairFile = path.join(root, 'native-banq-remediation.json');
        const repair = fs.existsSync(repairFile) ? JSON.parse(fs.readFileSync(repairFile, 'utf8')) : undefined;
        for (const check of catalog.checks) {
            const fix = repair?.findings[check.id];
            const expected = fix ? { ...check, baselineStatus: check.status, baselineObservation: check.observation,
                status: fix.status, observation: fix.observation, limitations: fix.limitations,
                evidence: [...check.evidence, ...fix.evidence] } : check;
            assert.deepEqual(native.checks.find(item => item.id === check.id), expected, check.id);
        }
        if (repair) {
            const readFix = name => JSON.parse(fs.readFileSync(path.join(root, 'evidence/native-nvda/banq-fix', name + '.json'), 'utf8'));
            const speech = name => {
                const record = readFix(name);
                assert.ok(!record.actionError, name + ' must have an unambiguous native action result');
                return record.speech.join('\n');
            };
            assert.ok(speech('15-cover-trigger-tab').includes("'Enlarge cover image', 'button', 'collapsed'"));
            for (const name of ['16-cover-enter-open', '19-cover-space-open']) {
                assert.ok(speech(name).includes("'cover image'"));
                assert.ok(readFix(name).accessibility.tree.includes('dialogue cover image'));
                assert.ok(readFix(name).accessibility.tree.includes('button Close'));
            }
            for (const name of ['18-cover-close-enter', '20-cover-escape']) assert.ok(speech(name).includes("'Enlarge cover image', 'button', 'collapsed'"));
            assert.ok(speech('21-cover-return-focus-query').includes("'Enlarge cover image', 'button', 'focused', 'collapsed'"));
            for (const [inputName, settledName] of [['26-empty-query-submit', '27-empty-query-settled'], ['28-empty-reload', '29-empty-reload-settled']]) {
                const input = readFix(inputName), settled = readFix(settledName);
                assert.equal(settled.logStart, input.logEnd);
                assert.ok([...input.speech, ...settled.speech].some(line => line.includes('No publication found')), settledName);
                assert.match(settled.accessibility.tree, /status\n\t+\d+ text No publication found/, settledName);
            }
            assert.deepEqual(native.catalogOpenFindingIds, []);
        }
        for (const id of catalog.openFindingIds) assert.ok(catalog.checks.some(check => check.id === id && check.status.startsWith('Open:')), id);
        const readCatalog = name => JSON.parse(fs.readFileSync(path.join(root, 'evidence/native-nvda/banq', name + '.json'), 'utf8'));
        const coverFocus = readCatalog('18-cover-trigger-focus-query').speech.join('\n');
        assert.ok(coverFocus.includes("'cover image', 'graphic', 'focused'"), 'N02 native control-role evidence');
        for (const [trigger, settled] of [
            ['29-empty-search-submit', '30-empty-search-settled'],
            ['31-empty-search-reload', '32-empty-reload-settled'],
        ]) {
            const input = readCatalog(trigger), result = readCatalog(settled);
            assert.ok(input.speech.some(line => line.includes('Loading')), trigger);
            assert.equal(result.logStart, input.logEnd, settled + ' continues input speech interval');
            assert.ok(new Date(result.at) - new Date(input.at) >= 1000, settled + ' requires a later observation');
            assert.ok(result.accessibility.tree.includes('text No publication found'), settled + ' visible result');
            assert.ok(![...input.speech, ...result.speech].some(line => line.includes('No publication found')), settled + ' missing native status');
        }
        assert.ok(readCatalog('23-result-tab-first').speech.join('\n').includes('Astronomie en 30 secondes - François Fressin'));
        assert.ok(readCatalog('39-paging-next-focus').speech.join('\n').includes("'Next', 'button'"));
        const pageTwo = readCatalog('43-public-page-two-links');
        assert.equal(pageTwo.metadata.currentPage, 2);
        assert.ok(!pageTwo.links.some(link => ['first', 'previous', 'prev'].includes(link.rel)), 'Disabled reverse controls are a feed limitation');
    }
    const progressFile = path.join(root, 'native-reader-progress-track-remediation.json');
    if (fs.existsSync(progressFile)) {
        const repair = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        assert.equal(repair.status, 'fixed in sampled scope');
        for (const check of repair.checks) {
            assert.deepEqual(native.checks.find(item => item.id === check.id), check);
        }
        for (const [file, hash] of Object.entries(repair.sourceHashes)) {
            assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex'), hash, file + ' must match recorded repair source');
        }
        const captures = fs.readdirSync(path.join(root, 'evidence/reader-progress-track-fix')).filter(file => file.endsWith('.json'));
        assert.equal(captures.length, repair.recordedCaptures);
        for (const file of captures) {
            const capture = JSON.parse(fs.readFileSync(path.join(root, 'evidence/reader-progress-track-fix', file), 'utf8'));
            assert.equal(capture.window.id, 7343082, 'Reader-only repair scope');
        }
    }
    for (const check of native.checks) {
        assert.equal(native.screenReader.started, true, 'NVDA checks require an actual NVDA session');
        assert.ok(check.files.length && check.evidence.length && check.observation && check.limitations, check.id);
        for (const file of check.files) assert.ok(matrix.some(row => row.file === file), file);
        for (const evidence of check.evidence) assert.ok(fs.existsSync(path.join(root, evidence)), evidence);
    }
    for (const row of matrix) {
        const checks = native.checks.filter(check => check.files.includes(row.file));
        assert.equal(row.native_finding_IDs, checks.filter(check => /^(?:N\d+|RHF\d+)$/.test(check.id)).map(check => check.id).join(' '), row.file);
        assert.equal(row.native_NVDA_status, checks.length ? [...new Set(checks.map(check => check.status))].join('; ') : 'Not evaluated in native NVDA', row.file);
        for (const evidence of row.native_NVDA_evidence.split('; ').filter(Boolean)) assert.ok(fs.existsSync(path.join(root, evidence)), evidence);
    }
}
const continuation = csv('continuation-47.csv');
assert.equal(continuation.length, 47);
for (const row of continuation) for (const evidence of row.evidence.split('; ')) assert.ok(fs.existsSync(evidence.startsWith('src/') ? evidence : path.join(root, evidence)), evidence);
const application = csv('state-results.csv'), fixtures = csv('fixture-state-results.csv');
assert.equal(application.length, 55); assert.equal(fixtures.length, 54);
for (const row of [...application, ...fixtures]) {
    assert.ok(fs.existsSync(path.join(root, row.raw_evidence)), row.raw_evidence);
    const png = fs.readFileSync(path.join(root, row.screenshot));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', row.screenshot);
}
const coverage = JSON.parse(fs.readFileSync(path.join(root, 'evidence/continuation-coverage.json')));
const scope = JSON.parse(fs.readFileSync(path.join(root, 'evidence/continuation-scope.json'))).files;
assert.deepEqual(Object.keys(coverage).sort(), [...scope].sort());
for (const row of fixtures) {
    const state = JSON.parse(fs.readFileSync(path.join(root, row.raw_evidence)));
    assert.equal(state.errors.length, 0, row.state + ' renderer errors');
    for (const file of state.files) assert.ok(scope.includes(file), file);
}
const keyboard = JSON.parse(fs.readFileSync(path.join(root, 'evidence/continuation/keyboard-interactions.json')));
assert.equal(keyboard.length, 25); assert.equal(keyboard.filter(r => r.error).length, 0);
assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'evidence/continuation/additional-checks.json'))).errors.length, 0);
assert.equal(csv('wcag-criteria.csv').length, 55);
for (const remediation of remediations) {
    for (const finding of Object.values(remediation.findings)) {
        for (const file of finding.files) assert.ok(matrix.some(r => r.file === file), file);
        for (const evidence of finding.evidence) assert.ok(fs.existsSync(path.join(root, evidence)), evidence);
    }
    const batchStates = csv(`batch-${remediation.batch}-state-results.csv`);
    assert.equal(batchStates.length, remediation.validation.fixtureStates + remediation.validation.applicationStates);
    for (const row of batchStates) {
        const data = JSON.parse(fs.readFileSync(path.join(root, row.raw_evidence)));
        assert.ok(fs.existsSync(path.join(root, row.screenshot)), row.screenshot);
        if (data.kind === 'component-fixture') assert.equal(data.errors.length, 0, row.state);
    }
    assert.equal(batchStates.filter(r => r.coverage_kind === 'component-fixture').length, remediation.validation.fixtureStates);
    assert.equal(batchStates.filter(r => r.coverage_kind === 'application').length, remediation.validation.applicationStates);
    const runs = remediation.validationRuns || [{ directory: `evidence/batch-${remediation.batch}`, fixtureScenarios: remediation.validation.fixtureScenarios, applicationScenarios: remediation.validation.applicationScenarios }];
    for (const run of runs) for (const name of ['fixture-checks', 'application-checks']) {
        const expected = name === 'fixture-checks' ? run.fixtureScenarios : run.applicationScenarios;
        if (!expected) continue;
        const checks = JSON.parse(fs.readFileSync(path.join(root, run.directory, name + '.json')));
        assert.ok(checks.tests.every(test => test.status === 'passed'), run.directory + '/' + name);
        assert.equal(checks.tests.length, expected);
    }
    assert.equal(runs.reduce((n, r) => n + r.fixtureScenarios, 0), remediation.validation.fixtureScenarios);
    assert.equal(runs.reduce((n, r) => n + r.applicationScenarios, 0), remediation.validation.applicationScenarios);
}
const latestFindings = Object.assign({}, ...remediations.map(r => r.findings));
for (const row of matrix) {
    for (const id of row.remaining_finding_IDs.match(/\bA\d{2}\b/g) || []) assert.notEqual(latestFindings[id]?.status, 'fixed', `${row.file}: ${id} still marked remaining`);
}
const report = fs.readFileSync(path.join(root, 'audit-2026-10-19.md'), 'utf8');
for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.resolve(root, match[1].split('#')[0])), 'Report link: ' + match[1]);
}
console.log(JSON.stringify({ matrixRows: matrix.length, originalContinuationFiles: continuation.length, applicationStates: application.length, fixtureStates: fixtures.length, keyboardScenarios: keyboard.length, jsonParsed: files.filter(f => f.endsWith('.json')).length, status: 'passed' }));
