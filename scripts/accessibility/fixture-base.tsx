import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TranslatorContext } from 'readium-desktop/renderer/common/translator.context';
import { translator } from 'readium-desktop/common/services/translator';
import 'readium-desktop/renderer/assets/styles/global.scss';

export const __ = translator.translate;
export const record = (...value: any[]) => (window as any).auditActions.push(value);
export const publication: any = {
    identifier: 'audit-publication', publicationTitle: 'Audit publication', documentTitle: 'Audit publication',
    authors: ['Audit author'], authorsLangString: [{ en: 'Audit author' }], languages: ['en'], tags: ['Research', 'To read'],
    description: '<p>' + 'A long publication description for testing expansion and keyboard access. '.repeat(100) + '</p>',
    lcp: { rights: { copy: 1000, print: 20, start: '2026-01-01', end: '2027-01-01' }, lsd: { lsdStatus: { status: 'active', links: [{ rel: 'renew', href: 'https://audit.invalid/renew' }, { rel: 'return', href: 'https://audit.invalid/return' }] } } },
    lcpRightsCopies: 100, lcpRightsPrints: [1, 2],
};
export const feed: any = { identifier: 'audit-feed', title: 'Audit catalog', url: 'https://audit.invalid/catalog', favorite: false, color: '#123456', icon: '' };
export const locator: any = { locator: { href: 'chapter.xhtml', locations: { progression: 0.25 }, text: { highlight: 'Selected passage' } }, selectionInfo: { cleanText: 'Selected passage', rawText: 'Selected passage' }, audioPlaybackInfo: { globalProgression: 0.25, globalTime: 120, localProgression: 0.5, localTime: 60 } };
export const note: any = { uuid: 'audit-note', textualValue: 'Audit note **with emphasis**', group: 'annotation', tags: ['Research'], color: { red: 254, green: 243, blue: 189 }, drawType: 0, locatorExtended: locator, created: Date.now(), modified: Date.now(), creator: { id: 'audit-creator', name: 'Audit creator' }, index: 1 };
export interface AuditCase { render: () => React.ReactNode; state?: (state: any) => void; after?: () => void; files: string[]; }
export function install(runtime: string, reducer: any, cases: Record<string, AuditCase>) {
    const root = createRoot(document.getElementById('audit-root'));
    const errors: string[] = [];
    window.addEventListener('error', e => errors.push(String(e.error?.stack || e.message)));
    (window as any).auditErrors = errors;
    (window as any).auditActions = [];
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input: any, init: any) => {
        const url = String(input);
        if (url.startsWith('thoriumhttps:')) {
            if (url.includes('pubnotes')) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
            return new Response('<h1>Audit profile</h1><p>Welcome to the audit profile.</p><a href="#help">Help</a>');
        }
        if (/^https?:/.test(url)) throw new Error('External fetch disabled in audit fixture');
        return realFetch(input, init);
    };
    (window as any).auditService = async (method: string, ...args: any[]) => {
        record('service', method, ...args);
        await new Promise(resolve => setTimeout(resolve, 150));
        if (method === 'opds/getUserProfile') return { name: 'Audit patron', email: 'patron@example.invalid', loans: { total: 4, available: 2 }, holds: { total: 3, available: 1 }, editUrl: 'https://audit.invalid/profile' };
        if (method.includes('getTags')) return ['Research', 'To read'];
        return [];
    };
    (window as any).auditCases = Object.entries(cases).map(([id, c]) => ({ id, files: c.files }));
    (window as any).auditMount = async (id: string) => {
        const c = cases[id];
        if (!c) throw new Error(`Unknown audit case ${id}`);
        root.render(null);
        await new Promise(resolve => setTimeout(resolve, 30));
        // Reducers reuse leaf defaults; clone before seeding to prevent case-to-case state leakage.
        const initial = structuredClone(reducer(undefined, { type: '@@INIT' }));
        initial.i18n.locale = 'en';
        c.state?.(initial);
        const wrapped = (state = initial, action: any) => {
            if (action.type === 'AUDIT_SET') return { ...state, ...action.payload };
            return reducer(state, action);
        };
        const store = createStore(wrapped, initial);
        const dispatch = store.dispatch;
        store.dispatch = (action: any) => {
            record('dispatch', action);
            return dispatch(action);
        };
        (window as any).auditStore = store;
        (window as any).auditActions.length = 0;
        errors.length = 0;
        (window as any).auditCurrent = { id, runtime, files: c.files, kind: 'component-fixture', services: 'synthetic; no sagas or live API' };
        root.render(<Provider store={store}><TranslatorContext.Provider value={translator}><MemoryRouter initialEntries={[id === 'customization-screen' ? '/audit/' + btoa('screen.html').replace(/=/g, '') : '/']}><main><h1>Component fixture: {id}</h1>{id === 'customization-screen' ? <Routes><Route path="/audit/:screenId" element={c.render()} /></Routes> : c.render()}</main></MemoryRouter></TranslatorContext.Provider></Provider>);
        await new Promise(resolve => setTimeout(resolve, 80));
        c.after?.();
    };
    document.body.style.setProperty('font-family', 'Arial, sans-serif');
    document.body.style.setProperty('background', 'var(--color-background, white)');
    document.body.style.setProperty('color', 'var(--color-content, black)');
    document.body.dataset.auditRuntime = runtime;
}
