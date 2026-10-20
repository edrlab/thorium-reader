// Summarize recorded native evidence. This does not launch NVDA or rerun UI tests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve('docs/accessibility');
const evidenceDir = path.join(root, 'evidence/native-nvda');
const read = name => JSON.parse(fs.readFileSync(path.join(evidenceDir, name + '.json'), 'utf8'));
const evidence = names => names.map(name => 'evidence/native-nvda/' + name + '.json');
function speechIncludes(name, ...phrases) {
    const speech = read(name).speech.filter(line => line.startsWith('Speaking ')).join('\n');
    for (const phrase of phrases) assert.ok(speech.includes(phrase), `${name}: missing ${phrase}`);
}
speechIncludes('library-tab-01', 'Home', 'checked');
speechIncludes('library-tab-02', 'All publications', 'button');
speechIncludes('library-settings-profiles-tab', 'Profiles', 'selected', '3 of 5');
speechIncludes('library-profile-radio', 'Thorium vanilla', 'radio button', 'checked');
speechIncludes('library-settings-dismiss-repeat', 'Application Settings', 'collapsed');
speechIncludes('library-book-menu-open', 'Menu (Untitled)', 'dialog', 'About publication');
speechIncludes('library-book-menu-dismiss', 'Menu (Untitled)', 'collapsed');
speechIncludes('library-epub-link-focus', 'Accessible EPUB 3 - Matt Garrish', 'link');
speechIncludes('library-pdf-link-focus', 'To get missing image descriptions, open the context menu.', 'link');
assert.ok(!read('library-pdf-link-focus').speech.some(line => line.startsWith('Speaking ') && line.includes('Untitled')));
speechIncludes('reader-report-focus', 'Thorium - Accessible EPUB 3', 'document', 'focused');

// Retain control structure and speech, rather than copying a whole publication chapter.
const reader = read('reader-report-focus');
reader.accessibility.tree = reader.accessibility.tree.split('\nDocument text:')[0];
reader.accessibility.document_text = '[Publication chapter text omitted; see control tree and scoped NVDA speech.]';
reader.contentHandling = 'Whole-chapter document_text omitted from audit evidence.';
fs.writeFileSync(path.join(evidenceDir, 'reader-report-focus.json'), JSON.stringify(reader, null, 2) + '\n');

for (const name of fs.readdirSync(evidenceDir).filter(name => name.endsWith('.json'))) {
    const file = path.join(evidenceDir, name);
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (record.key) {
        record.snapshotTiming = 'UIA/screenshot captured immediately after input; asynchronous layout can lag. Speech collected separately after 850 ms; focus claims rely on NVDA speech, not the helper window-level focus field.';
        fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
    }
}

const nativeFile = path.join(root, 'native-nvda-validation.json');
const optimization = read('library-enable-screen-reader-optimization');
optimization.outcome = 'Shortcut sent, but subsequent UIA still showed Optimize for screen reader (No). Enabling optimization was not validated; no setting change is claimed.';
fs.writeFileSync(path.join(evidenceDir, 'library-enable-screen-reader-optimization.json'), JSON.stringify(optimization, null, 2) + '\n');
const startupSpeech = fs.readFileSync('dist/accessibility-nvda/native-session.log', 'utf8').split(/\r?\n/)
    .filter(line => line.startsWith('Speaking ') && (line.includes('Failed to initialize the reader') || line.includes("'OK', 'button'")));
fs.writeFileSync(path.join(evidenceDir, 'reader-startup-speech.json'), JSON.stringify({ method: 'Actual NVDA speech diagnostic output; startup-error utterances only', speech: startupSpeech }, null, 2) + '\n');
const native = JSON.parse(fs.readFileSync(nativeFile, 'utf8'));
native.status = 'partial native validation; further Reader input blocked by automatic approval review timeouts';
native.screenReader = { name: 'NVDA', version: '2026.2 AMD64', distribution: 'Official portable copy', started: true, synthesizer: 'Windows OneCore', speechLanguage: 'en_GB', addons: 'Disabled', configuration: 'Separate workspace-local audit config' };
native.method = 'Native SendInput through the computer-use skill, with real NVDA speech.speech.speak diagnostic records. Speech output was inspected as text; acoustic listening, pronunciation and timing intelligibility were not assessed. No simulated screen-reader output or fixture controls are counted.';
native.limitations = 'Partial native NVDA coverage. Only referenced controls/states were exercised; other component branches, EPUB/PDF browse/focus reading, sliders, search/status announcements, profile artwork and full format/theme/locale coverage remain unverified. Two Reader initialization timeouts preceded a successful application restart. Repeated automatic approval-review timeouts then blocked further Reader input. No application-wide WCAG pass.';
native.checks = [
    {
        id: 'library-navigation', complete: true, status: 'Passed for sampled navigation controls',
        files: ['src/renderer/library/components/layout/LibraryHeader.tsx', 'src/renderer/library/components/layout/LibraryLayout.tsx'],
        evidence: evidence(['library-tab-01', 'library-tab-02', 'library-report-focus', 'library-tab-catalogs', 'library-tab-settings', 'library-import-focus']),
        observation: 'Tab reaches Home, All publications, Catalogs, Application Settings and Import publication. NVDA announces the navigation/list context, control names and Home checked state. NVDA+Tab confirms All publications is focused.',
        limitations: 'Sampled default-English Home navigation only. Skip-link activation, heading/landmark quick navigation, route changes, all navigation branches and full focus order are not established.'
    },
    {
        id: 'library-settings-profiles', complete: true, status: 'Passed for sampled Settings/profile controls',
        files: ['src/renderer/library/components/settings/Settings.tsx', 'src/renderer/library/components/settings/ProfilesSettings.tsx'],
        evidence: evidence(['library-settings-open', 'library-settings-tab', 'library-settings-keyboard-tab', 'library-settings-profiles-tab', 'library-profile-radio', 'library-settings-dismiss', 'library-settings-dismiss-repeat']),
        observation: 'Enter opens Settings; NVDA reads its title, General/Keyboard shortcuts/Profiles tabs and language combo. Tab and Right Arrow announce selected tab positions. Thorium vanilla is announced as a checked radio, 1 of 1. Two Escapes were issued before the Settings trigger was announced collapsed again.',
        limitations: 'Only existing vanilla profile checked; no profile change. First Escape alone did not produce dismissal evidence; possible NVDA focus-mode interaction was not independently proven. Duplicate selected-tab speech was observed. No acoustic assessment or blanket pass for all Settings controls.'
    },
    {
        id: 'library-publication-menu', complete: true, status: 'Passed for sampled publication-menu behavior',
        files: ['src/renderer/library/components/publication/PublicationCard.tsx', 'src/renderer/common/components/menu/Menu.tsx'],
        evidence: evidence(['library-pdf-menu-focus', 'library-book-menu-open', 'library-book-menu-dismiss', 'library-epub-link-focus']),
        observation: 'NVDA announces Menu (Untitled) as a collapsed button, Enter opens its named dialog and reads its actions, and Escape returns to the named collapsed trigger. The Accessible EPUB 3 link includes title and author.',
        limitations: 'Menu actions were read without invoking deletion, loan changes or export. One existing PDF menu and one EPUB link sampled; does not establish every menu or dialog branch.'
    },
    {
        id: 'N01', complete: true, status: 'Naming defect reproduced in sampled PDF link',
        files: ['src/renderer/library/components/publication/PublicationCard.tsx', 'src/renderer/common/components/Cover.tsx'],
        evidence: evidence(['library-pdf-link-focus', 'library-tab-02', 'library-pdf-menu-focus']),
        observation: 'The visible PDF title is Untitled, but native NVDA focus and browse speech call its opening link To get missing image descriptions, open the context menu. UIA exposes Untitled as its description, not its name. PublicationCard hides its visible title with aria-hidden and relies on title fallback; the decorative cover is exposed with empty alt and presentation role. The adjacent menu remains correctly named.',
        criteria: ['2.5.3 Label in Name'],
        limitations: 'Reproduced in this one actual PDF card, not every cover or publication. The exact Chromium image-description substitution mechanism is not proven. No fix implemented in this audit; preserve the visible title in an explicit link name and retest.'
    },
    {
        id: 'reader-document-identification', complete: false, status: 'Limited native observation; further Reader checks blocked',
        files: ['src/renderer/reader/components/Reader.tsx'],
        evidence: evidence(['reader-report-focus', 'reader-initialization-timeout', 'reader-retry-timeout', 'reader-startup-speech']),
        observation: 'After a full npm run start:dev:quick restart, Accessible EPUB 3 loads in the Reader and the EPUB webview is present. NVDA+Tab announces Thorium - Accessible EPUB 3, document, focused, read only. Before restart, two fresh Reader attempts timed out and NVDA announced the native error dialog and OK button.',
        limitations: 'Document identification only. No EPUB/PDF reading navigation, Settings sliders, search/status, TOC, editors, print or webview focus transition is passed. Subsequent native input and recovery captures timed out in automatic approval review.'
    }
];
const repairFile = path.join(root, 'native-n01-remediation.json');
if (fs.existsSync(repairFile)) {
    const repair = JSON.parse(fs.readFileSync(repairFile, 'utf8'));
    assert.equal(repair.status, 'fixed');
    const fixed = native.checks.find(check => check.id === 'N01');
    const repairedSpeech = name => JSON.parse(fs.readFileSync(path.join(evidenceDir, 'n01-fix', name + '.json'), 'utf8')).speech
        .filter(line => line.startsWith('Speaking ')).join('\n');
    assert.ok(repairedSpeech('pdf-native-tab').includes("'Untitled', 'link'"));
    assert.ok(repairedSpeech('pdf-native-focus-query').includes("'Untitled', 'link', 'focused'"));
    assert.ok(!repairedSpeech('pdf-native-tab').includes('missing image descriptions'));
    assert.ok(repairedSpeech('epub-native-tab').includes('Accessible EPUB 3 - Matt Garrish'));
    const actual = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'n01-fix/library-card-names.json'), 'utf8'));
    assert.equal(actual.status, 'passed');
    assert.equal(actual.cards.length, repair.validation.actualLibraryCardNames);
    for (const item of repair.evidence) assert.ok(fs.existsSync(path.join(root, item)), item);
    fixed.baselineStatus = fixed.status;
    fixed.baselineObservation = fixed.observation;
    fixed.status = 'Fixed in sampled local cards; native NVDA verified';
    fixed.observation = repair.observation;
    fixed.limitations = repair.limitations;
    fixed.evidence = [...fixed.evidence, ...repair.evidence];
    native.status = 'partial native validation; N01 repaired and verified; remaining Reader scenarios pending';
}
const catalogFile = path.join(root, 'native-banq-validation.json');
const catalogRepairFile = path.join(root, 'native-banq-remediation.json');
const catalogRepair = fs.existsSync(catalogRepairFile) ? JSON.parse(fs.readFileSync(catalogRepairFile, 'utf8')) : undefined;
if (fs.existsSync(catalogFile)) {
    const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
    assert.equal(catalog.screenReader.started, true);
    assert.equal(catalog.recordedNativeChecks, catalog.checks.length);
    for (const check of catalog.checks) {
        assert.ok(!native.checks.some(existing => existing.id === check.id), check.id);
        for (const item of check.evidence) assert.ok(fs.existsSync(path.join(root, item)), item);
        const repair = catalogRepair?.findings[check.id];
        native.checks.push(repair ? { ...check, baselineStatus: check.status, baselineObservation: check.observation,
            status: repair.status, observation: repair.observation, limitations: repair.limitations,
            evidence: [...check.evidence, ...repair.evidence] } : check);
    }
    native.catalogAudit = 'native-banq-validation.json';
    native.catalogOpenFindingIds = catalog.openFindingIds.filter(id => !catalogRepair?.findings[id]?.status.startsWith('Fixed'));
    native.status = 'partial native validation; N01 verified; BAnQ ' + (native.catalogOpenFindingIds.length ? native.catalogOpenFindingIds.join('/') + ' open' : 'N02/N03 repaired and verified in sampled states') + '; remaining Reader scenarios pending';
    native.limitations = 'Partial native NVDA coverage. Original Library controls and subsequent public BAnQ search, details, cover and Next paging are sampled only. Broader Reader scenarios remain pending after earlier initialization/review timeouts. Account/authentication, acquisitions, other component branches and full format/theme/locale coverage remain unverified. Speech was inspected as text without acoustic assessment. See native-banq-validation.json and native-banq-remediation.json for catalog baseline and repair scope; no application-wide WCAG pass.';
    if (catalogRepair) native.catalogRemediation = 'native-banq-remediation.json';
}
const progressRepairFile = path.join(root, 'native-reader-progress-track-remediation.json');
if (fs.existsSync(progressRepairFile)) {
    const repair = JSON.parse(fs.readFileSync(progressRepairFile, 'utf8'));
    assert.equal(repair.status, 'fixed in sampled scope');
    native.checks.push(...repair.checks);
    native.readerProgressTrackRemediation = 'native-reader-progress-track-remediation.json';
    native.status += '; sampled Reader header evaluated and RHF01 progress-track repair natively verified';
    native.limitations += ' Reader header and progress-track samples are now recorded separately; broader Reader scenarios remain pending. See native-reader-progress-track-remediation.json for mode, pointer-position and format limitations.';
}
native.recordedNativeChecks = native.checks.length;
native.completedNativeScenarios = native.checks.filter(check => check.complete).length;
native.startupHistory = ['Initial launcher execution blocked by approval timeouts and sandbox DLL relocation.', 'User started the temporary standalone runner.', 'Portable copy creation later succeeded (exit 0); isolated logging session started.', 'Two EPUB Reader windows timed out before a full development-app restart.', 'Restarted Reader loaded EPUB successfully; NVDA document identification captured.', 'Repeated approval-review timeouts prevented the remaining native checks.'];
fs.writeFileSync(nativeFile, JSON.stringify(native, null, 2) + '\n');
const envFile = path.join(evidenceDir, 'environment.json');
const environment = JSON.parse(fs.readFileSync(envFile, 'utf8'));
environment.previousSetupStatus = environment.previousSetupStatus || environment.setupStatus;
environment.setupStatus = 'Resolved: official portable copy created successfully; actual NVDA speech recorded with isolated configuration. Further Reader input blocked by automatic approval review timeouts.';
if (fs.existsSync(repairFile)) environment.setupStatus = 'Resolved: native NVDA available. N01 naming repair verified; broader Reader audit remains pending after earlier review timeouts.';
environment.nativeValidationCompleted = false;
environment.nativeValidationStatus = fs.existsSync(repairFile)
    ? 'Partial: N01 repaired and verified with native NVDA and five actual local card names; broader Reader scenarios remain pending.'
    : 'Partial: 4 Library scenarios evaluated (3 scoped passes, 1 naming defect), plus 1 limited Reader document-focus observation.';
environment.portableCreated = true;
environment.screenReaderStarted = true;
environment.operatingSystem = 'Windows 11 25H2 (10.0.26200.9711) AMD64; reported by NVDA startup log';
environment.synthesizer = 'Windows OneCore; en_GB speech';
if (fs.existsSync(catalogFile)) {
    environment.setupStatus = 'Resolved: native NVDA available. BAnQ public-catalog follow-up recorded; broader Reader validation remains pending.';
    environment.nativeValidationStatus = 'Partial: original 4 Library checks plus 5 BAnQ checks evaluated; N01 verified, N02/N03 ' + (catalogRepair ? 'repaired and verified in sampled Library states' : 'open') + ', 1 Reader identification observation partial.';
    environment.catalogSourceRevision = JSON.parse(fs.readFileSync(catalogFile, 'utf8')).sourceRevision;
    environment.diagnosticLoggingCleanup = 'Verified portable NVDA running with --no-logging after the BAnQ remediation session. Only scoped speech records retained; full logs remain ignored under dist/.';
}
if (fs.existsSync(progressRepairFile)) {
    environment.setupStatus = 'Resolved: native NVDA available; sampled Reader header and progress-track validation completed. Broader Reader/format coverage remains pending.';
    environment.nativeValidationStatus = `Partial: ${native.recordedNativeChecks} checks recorded, ${native.completedNativeScenarios} evaluated; N01/N02/N03 and RHF01 repaired in sampled scopes.`;
    environment.readerProgressTrackRemediation = 'native-reader-progress-track-remediation.json';
    environment.diagnosticLoggingCleanup = 'Verified NVDA left running with --no-logging after the Reader progress-track session; full logs ignored under dist/.';
}
fs.writeFileSync(envFile, JSON.stringify(environment, null, 2) + '\n');
console.log(JSON.stringify({ recordedNativeChecks: native.recordedNativeChecks, completedNativeScenarios: native.completedNativeScenarios, status: 'recorded evidence assertions passed; not a new UI run' }));
