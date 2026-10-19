const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
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
const remediationPath = path.join(root, 'remediation-batch-1.json');
const remediation = fs.existsSync(remediationPath) ? JSON.parse(fs.readFileSync(remediationPath)) : undefined;
const inventoryCount = JSON.parse(fs.readFileSync(remediation?.inventory || path.join(root, 'evidence/static-inventory.json'))).files.length;
assert.equal(matrix.length, inventoryCount);
assert.equal(new Set(matrix.map(r => r.file)).size, inventoryCount);
assert.equal(matrix.filter(r => r.coverage_kind === 'inactive').length, 3);
assert.equal(matrix.filter(r => r.coverage_kind === 'untested' || r.runtime_evidence === 'Not exercised').length, 0);
for (const row of matrix) assert.ok(fs.existsSync(row.file), row.file);
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
if (remediation) {
    for (const finding of Object.values(remediation.findings)) {
        for (const file of finding.files) assert.ok(matrix.some(r => r.file === file), file);
        for (const evidence of finding.evidence) assert.ok(fs.existsSync(path.join(root, evidence)), evidence);
    }
    const batchStates = csv('batch-1-state-results.csv');
    assert.equal(batchStates.length, remediation.validation.fixtureStates + remediation.validation.applicationStates);
    for (const row of batchStates) {
        const data = JSON.parse(fs.readFileSync(path.join(root, row.raw_evidence)));
        assert.ok(fs.existsSync(path.join(root, row.screenshot)), row.screenshot);
        if (data.kind === 'component-fixture') assert.equal(data.errors.length, 0, row.state);
    }
    for (const name of ['fixture-checks', 'application-checks']) {
        const checks = JSON.parse(fs.readFileSync(path.join(root, `evidence/batch-1/${name}.json`)));
        assert.ok(checks.tests.every(test => test.status === 'passed'), name);
    }
}
const report = fs.readFileSync(path.join(root, 'audit-2026-10-19.md'), 'utf8');
for (const match of report.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.resolve(root, match[1].split('#')[0])), 'Report link: ' + match[1]);
}
console.log(JSON.stringify({ matrixRows: matrix.length, originalContinuationFiles: continuation.length, applicationStates: application.length, fixtureStates: fixtures.length, keyboardScenarios: keyboard.length, jsonParsed: files.filter(f => f.endsWith('.json')).length, status: 'passed' }));
