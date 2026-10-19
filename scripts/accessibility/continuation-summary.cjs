const fs = require('node:fs');
const path = require('node:path');
const root = 'docs/accessibility/';
const csv = rows => rows.map(row => row.map(value => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
const scope = JSON.parse(fs.readFileSync(root + 'evidence/continuation-scope.json')).files;
const captures = fs.readdirSync(root + 'evidence/continuation').filter(n => n.endsWith('.json') && !n.endsWith('-ax.json')).map(n => ({ file: 'evidence/continuation/' + n, ...JSON.parse(fs.readFileSync(root + 'evidence/continuation/' + n)) })).filter(r => r.kind === 'component-fixture');
const observations = {
    'ImportAnnotationsDialog.tsx': 'Conflict counts/creator context rendered; named confirmation; Cancel initial focus, Tab cycle and Escape abort action inspected. No set imported.',
    'Loader.tsx': 'Spinner rendered and excluded from accessibility tree; no independent status text. A15 remains contextual review, not a standalone 4.1.3 failure.',
    'LoaderMainLoad.tsx': 'Busy=true spinner rendered, no exposed status text; host announcement responsibility remains A15 review.',
    'LoaderSearch.tsx': 'Search busy spinner rendered, no exposed status text; full search-result announcement still needs integration/AT testing.',
    'customizationProfileDialog.tsx': 'Welcome HTML, image and do-not-show checkbox rendered. Image has no alternative: A17 confirmed. Profile lock/error variants untested.',
    'LcpInfo.tsx': 'Active license dates, remaining copy/print allowances and status rendered as text. Other license statuses untested.',
    'PublicationInfoDescription.tsx': 'Long text rendered; Tab reaches aria-hidden expander and Enter switches See more/See less. A29.',
    'tag/tagButton.tsx': 'Two tag edit buttons unnamed; 11x11 CSS px targets with 21px safe diameter; opened delete popover has empty Chromium AX name. A28/A31. Escape restores trigger.',
    'tag/tagList.tsx': 'Two tags rendered through real TagButton children; array wrapper adds no separate control. Child defects A28/A31 attributed to TagButton.',
    'toast/Toast.tsx': 'Alert and named Close rendered; focused alert does not expand on Enter/Space, pointer on container expands. A12 keyboard expansion confirmed; clipboard and expiry equivalence not certified.',
    'toast/ToastManager.tsx': 'Synthetic toast-state update creates Toast; real manager renders/filters via Redux. System notifications and publication-filter branches not fully tested.',
    'DownloadsPanel.tsx': '42% and indeterminate downloads rendered. Cancel anchors absent from Tab order (A05); both native progressbar AX names empty (A30). No download cancelled.',
    'NoPublicationInfo.tsx': 'Empty-library instructions and supported-extension disclosure rendered; Enter opens native details.',
    'customization/Customization.tsx': 'Real LibraryLayout and locally supplied profile HTML rendered; ready-state heading focus inspected. Wrapper adds a second main/h1; those fixture-only landmark/heading flags are excluded.',
    'ApiappAddForm.tsx': 'Dialog opens/closes with keyboard; search API response supplied at Redux result boundary. Unlabelled search and option lacking listbox reproduced: A04/A09. No catalog added.',
    'DeleteOpdsFeedConfirm.tsx': 'Named confirmation, Cancel initial focus, Tab containment and Escape restoration in fixture; also opened/cancelled in live app. No deletion.',
    'DeletePublicationConfirm.tsx': 'Named confirmation, Cancel initial focus, Tab containment and Escape restoration in fixture and live app. No deletion.',
    'DialogManager.tsx': 'Real manager mounted FileImport and LCP-authentication branches from synthetic dialog state; no independent visual surface.',
    'FileImport.tsx': 'Valid filename and invalid/empty input branches rendered; named confirmation, Cancel initial focus, Tab and Escape checked. No file imported.',
    'LcpAuthentication.tsx': 'Hint/error/password dialog rendered; password accessible name and autofocus inspected, Tab cycle and Escape checked. Unlock and password-manager/3.3.8 flow untested.',
    'OpdsFeedUpdateForm.tsx': 'Populated edit dialog rendered in fixture and live app; Tab and Escape restoration checked. No data saved.',
    'catalogLcpControls.tsx': 'Active license Read/Renew/Return/Delete/Save-as controls rendered; renew/return confirmations opened and cancelled with focus restoration. No license mutation.',
    'BorrowButton.tsx': 'Enter starts disabled pending state; synthetic unsuccessful API_RESULT restores button and renders role=alert. Real borrow/auth/success flow untested.',
    'CancelHold.tsx': 'Enter starts disabled pending state; synthetic failure restores button and exposes alert. Settled contrast retest clears transition-only axe flag. No hold changed.',
    'OpdsLinkProperties.tsx': 'Available/unavailable/ready/reserved metadata rendered with text alternatives for decorative icons; price/copy/hold sample fields included.',
    'opds/Entry.tsx': 'Category title/subtitle/count rendered through EntryList; native link exposed, keyboard navigation sampled. Synthetic router records navigation only.',
    'opds/EntryList.tsx': 'Real list and Entry child rendered; category navigation sampled. No extra wrapper-specific failure established.',
    'MessageOpdBrowserResult.tsx': 'Error title/message rendered as static heading/text. A15 live status-announcement concern needs actual asynchronous replacement/AT test.',
    'PageNavigation.tsx': 'Four page controls rendered; four nested-interactive and four link-name failures reproduced (A07); Tab reaches unnamed links.',
    'opds/SearchForm.tsx': 'Enabled named searchbox rendered; typing/Enter records navigation action. Visible label htmlFor mismatch remains, but aria-label supplies computed name.',
    'UserProfile.tsx': 'Loading status, populated profile/quotas/edit control, and unavailable branch rendered with local responses. External profile edit not activated.',
    'OpdsMenu.tsx': 'About-publication trigger and hydrated OPDS content rendered; no catalog/download actions activated. Hydration supplied at saga boundary.',
    'AuthSettings.tsx': 'Named Clear login data button rendered in fixture only. No active source import found; unreachable in current Settings composition; action not activated.',
    'SaveSessionSettings.tsx': 'Named ARIA checkbox responds to Space and changes checked false->true in fixture store. Current Settings reference is commented out; not claimed reachable in app.',
    'BookmarkLocatorInfo.tsx': 'Audio locator timestamp/progression branch rendered (00:02:00, 25%). PDF/Divina/caret fallback branches untested.',
    'ImageClickManagerViewerOnly.tsx': 'Image alternative and named Zoom In/Out/Reset/Close exposed. Enter changes zoom; reset, Tab cycle and Escape dismissal exercised. SVG-fragment and pan gestures untested.',
    'AnnotationCard.tsx': 'Populated card, metadata, tag action, inline editor rendered. Enter filter callback works; Chromium reports named link. Edit textbox still unnamed (A03); Escape returns Edit focus.',
    'BookmarkCard.tsx': 'Populated card/audio locator, tag action and inline editor rendered. Enter filter callback works; Chromium reports named link. A03 editor reproduced; Escape returns Edit focus.',
    'DivinaSetReadingMode.tsx': 'Three supported modes and disabled guided option rendered. ArrowRight moves selected single->double; native names/group/checked state exposed. Comic engine not exercised.',
    'reader/components/dialog/publicationInfos/PublicationInfo.tsx': 'Controlled Reader info dialog with real common metadata and Reader TagManager rendered; named Close and Escape dismissal checked. Full main/saga integration untested.',
    'reader/components/dialog/publicationInfos/TagManager.tsx': 'Existing tags and Add tag textbox/action rendered inside Reader info. Tag writes not submitted; mutation contract untested.',
};
const inactive = {
    'src/renderer/common/components/dialog/publicationInfos/publicationInfoA11y.tsx': 'Commented-out legacy component only; active implementation is publicationInfoA11y2.tsx. No runtime UI to exercise.',
    'src/renderer/library/components/withRouter.tsx': 'All code commented out; no runtime export or visual component.',
    'src/renderer/reader/components/ImageClickManager.tsx': 'License header only (361 bytes); viewer implementation lives in ImageClickManagerViewerOnly.tsx.',
};
const composed = {
    'src/renderer/common/components/hoc/translator.tsx': { evidence: 'evidence/continuation/library-lcp-information.json', observation: 'withTranslator wraps the actually rendered LcpInfo, FileImport and other connected components; English translated strings observed. Nonvisual HOC; no independent keyboard surface.' },
    'src/renderer/common/components/overlayHelpers.tsx': { evidence: 'evidence/continuation/library-tag-delete-popover.json', observation: 'PopoverArrow composed in the open tag popover; decorative aria-hidden SVG observed. CloseOnAnchorRemoval observer branch not independently triggered.' },
    'src/renderer/library/components/utils/GridView.tsx': { evidence: 'evidence/library-opds-local.json', observation: 'Composed application coverage: EntryPublicationList.tsx:13,52 imports/renders GridView for the already captured OPDS publication grid. Child PublicationCard UI observed; scrollToTop update branch not separately tested.' },
};
const live = {
    'DeleteOpdsFeedConfirm.tsx': 'evidence/library-continuation-feed-delete.json',
    'DeletePublicationConfirm.tsx': 'evidence/library-continuation-delete-confirm.json',
    'OpdsFeedUpdateForm.tsx': 'evidence/library-continuation-feed-update.json',
};
const coverage = {};
for (const file of scope) {
    const matches = captures.filter(c => c.files.includes(file));
    const observation = Object.entries(observations).filter(([suffix]) => file.endsWith(suffix)).at(-1)?.[1];
    if (inactive[file]) coverage[file] = { kind: 'inactive', evidence: [file], observation: inactive[file], limitations: 'No dynamic conformance conclusion applies to this inactive file.' };
    else if (composed[file]) coverage[file] = { kind: 'composed', evidence: [composed[file].evidence], observation: composed[file].observation, limitations: 'Composition/source tracing, not a separate standalone component run.' };
    else {
        if (!matches.length || !observation) throw new Error('Missing coverage/observation: ' + file);
        const application = Object.entries(live).find(([suffix]) => file.endsWith(suffix))?.[1];
        coverage[file] = { kind: application ? 'application+fixture' : 'component-fixture', evidence: [...(application ? [application] : []), ...matches.map(c => c.file)], observation, limitations: 'Sampled branches only. Fixture uses real component/styles/reducers; local inputs, no sagas/live services. Native AT, complete theme/zoom/spacing/target checks remain.' };
    }
}
fs.writeFileSync(root + 'evidence/continuation-coverage.json', JSON.stringify(coverage, null, 2) + '\n');
const runtimePath = root + 'evidence/runtime-component-coverage.json';
const runtime = JSON.parse(fs.readFileSync(runtimePath));
for (const [file, c] of Object.entries(coverage)) runtime[file] = `${c.kind}: ${c.evidence.join('; ')}. ${c.observation}`;
fs.writeFileSync(runtimePath, JSON.stringify(runtime, null, 2) + '\n');
fs.writeFileSync(root + 'continuation-47.csv', csv([['file', 'coverage_kind', 'evidence', 'observations', 'limitations'], ...Object.entries(coverage).map(([file, c]) => [file, c.kind, c.evidence.join('; '), c.observation, c.limitations])]));
const isWcag = rule => rule.tags.some(t => /^wcag(?:2|21|22)(?:a|aa)$/.test(t));
fs.writeFileSync(root + 'fixture-state-results.csv', csv([['state', 'window', 'coverage_kind', 'files', 'WCAG_tagged_axe_findings', 'best_practice_axe_findings', 'manual_review_rules', 'raw_evidence', 'screenshot', 'interpretation'], ...captures.map(c => [c.id + '/' + path.basename(c.file, '.json'), c.runtime, c.kind, c.files.join('; '), c.axe.violations.filter(isWcag).map(v => `${v.id} (${v.nodes.length})`).join('; '), c.axe.violations.filter(v => !isWcag(v)).map(v => `${v.id} (${v.nodes.length})`).join('; '), c.axe.incomplete.map(v => v.id).join('; '), c.file, `evidence/${c.evidencePrefix}.png`, 'Local component fixture; raw axe flags require report adjudication; not an application conformance pass'])]));
const counts = Object.fromEntries([...new Set(Object.values(coverage).map(c => c.kind))].map(kind => [kind, Object.values(coverage).filter(c => c.kind === kind).length]));
const summary = { filesRequested: scope.length, disposition: counts, filesRenderedInFixtures: Object.values(coverage).filter(c => c.kind.includes('fixture')).length, fixtureStates: captures.length, fixtureStatesByWindow: Object.fromEntries(['library', 'reader'].map(w => [w, captures.filter(c => c.runtime === w).length])), keyboardScenarios: JSON.parse(fs.readFileSync(root + 'evidence/continuation/keyboard-interactions.json')).length, newApplicationStates: 3, interpretation: '41 fixture-rendered files, of which three also tested in the running app; three traced composed helpers; three inactive files. No blanket WCAG pass.' };
fs.writeFileSync(root + 'evidence/continuation-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
