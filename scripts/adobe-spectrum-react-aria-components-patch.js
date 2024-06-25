const fs = require('fs');
for (const filePath of [
    "node_modules/@react-aria/overlays/dist/useCloseOnScroll.main.js",
    "node_modules/@react-aria/overlays/dist/useCloseOnScroll.mjs",
    "node_modules/@react-aria/overlays/dist/useCloseOnScroll.module.js",
]) {
    let txt = fs.readFileSync(filePath, { encoding: 'utf8' });
    txt = txt.replace(/let onScroll = \(e\)=>{/, `let onScroll = (e) =>/* https://github.com/adobe/react-spectrum/pull/6461 */{if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {return;}`);
    fs.writeFileSync(filePath, txt, { encoding: 'utf8' });
}
