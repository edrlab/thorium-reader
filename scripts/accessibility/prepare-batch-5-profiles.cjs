const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const source = path.resolve('test/customization/profile/thorium_university_press');
const out = path.resolve('dist/accessibility-batch5-packages');
const original = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json')));
const variants = [
    { id: 'decorative-en', locale: 'en', hero: '', logo: undefined },
    { id: 'decorative-fr', locale: 'fr', hero: '', logo: undefined },
    { id: 'informative-en', locale: 'en', hero: { en: 'Two people choosing books from a shelf', fr: 'Deux personnes choisissent des livres dans une bibliothèque' }, logo: { en: 'Thorium University Press logo', fr: 'Logo de Thorium University Press' } },
    { id: 'informative-fr', locale: 'fr', hero: { en: 'Two people choosing books from a shelf', fr: 'Deux personnes choisissent des livres dans une bibliothèque' }, logo: { en: 'Thorium University Press logo', fr: 'Logo de Thorium University Press' } },
    { id: 'fallback-fr', locale: 'fr', hero: { en: 'Two people choosing books from a shelf' }, logo: { en: 'Thorium University Press logo' } },
    { id: 'no-art-en', locale: 'en', noArt: true, logo: '' },
];
const results = [];
const revision = new Date().toISOString();
for (const variant of variants) {
    const dir = path.join(out, variant.id, 'source'); const packages = path.join(out, variant.id, 'package');
    fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(packages, { recursive: true });
    // A fresh identity avoids intentionally skipped welcome screens from prior runs.
    const manifest = { ...original, identifier: 'thorium-manifest://org.edrlab.audit.a17.' + variant.id + '.' + revision.replace(/[^0-9]/g, ''),
        modified: revision, publications: [],
        links: original.links.filter(l => l.rel === 'welcome-screen' || l.rel === 'screen'),
        images: original.images.filter(i => i.rel === 'logo' || i.rel === 'welcome-screen').filter(i => !variant.noArt || i.rel !== 'welcome-screen').map(i => ({ ...i, title: i.rel === 'logo' ? variant.logo : variant.hero })),
    };
    for (const file of [...manifest.images, ...manifest.links].map(l => l.href)) {
        const dest = path.join(dir, file); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(source, file), dest);
    }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const output = execFileSync(process.execPath, ['customization-dist/main/customization/cli.js', '--signed=true', dir, packages], { stdio: 'pipe' }).toString();
    const file = output.match(/^OUTPUT=\s*(.+)$/m)?.[1]?.trim();
    if (!file || !fs.existsSync(file)) throw new Error('Profile package missing: ' + variant.id);
    results.push({ ...variant, package: file, manifest: path.join(dir, 'manifest.json') });
}
fs.writeFileSync(path.join(out, 'profiles.json'), JSON.stringify(results, null, 2) + '\n');
console.log('Prepared ' + results.length + ' profiles with no publications or catalog links.');
