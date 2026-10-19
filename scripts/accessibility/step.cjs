// Local Electron audit driver. Actions must be selected from inspected source/DOM.
const fs = require("node:fs");
const { chromium } = require("@playwright/test");
(async () => {
    const [window = "library", operation = "inspect", ...args] = process.argv.slice(2);
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9223");
    try {
        const pages = browser.contexts().flatMap(c => c.pages());
        const page = pages.find(p => p.url().includes(`index_${window}.html`));
        if (!page) throw new Error(`No ${window} host; targets: ${pages.map(p => p.url()).join(", ")}`);
        const focus = () => page.evaluate(() => {
            const e = document.activeElement;
            const style = getComputedStyle(e);
            const rect = e.getBoundingClientRect();
            return { html: e.outerHTML.slice(0, 1000), x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                outline: style.outline, outlineOffset: style.outlineOffset, background: style.backgroundColor,
                color: style.color, border: style.border, boxShadow: style.boxShadow,
                hiddenAncestor: !!e.closest('[aria-hidden="true"]'), inDialog: !!e.closest('[role="dialog"],[role="alertdialog"]') };
        });
        if (operation === "role-click") await page.getByRole(args[0], { name: args[1], exact: true }).click({ timeout: 8000 });
        else if (operation === "close-window") {
            await page.evaluate(() => window.close()).catch(() => {});
            console.log(`${window} close requested`);
            return;
        }
        else if (operation === "role-focus") await page.getByRole(args[0], { name: args[1], exact: true }).focus({ timeout: 8000 });
        else if (operation === "click") await page.locator(args[0]).click({ timeout: 8000 });
        else if (operation === "ax") {
            const session = await page.context().newCDPSession(page);
            const doc = await session.send("DOM.getDocument");
            const { nodeId } = await session.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: args[0] });
            const result = await session.send("Accessibility.getPartialAXTree", { nodeId });
            fs.writeFileSync(`docs/accessibility/evidence/${args[1]}.json`, JSON.stringify(result, null, 2));
            console.log(JSON.stringify({ nodes: result.nodes.slice(0, 1) }));
        }
        else if (operation === "key") { await page.keyboard.press(args[0]); await page.waitForTimeout(250); }
        else if (operation === "fill") await page.locator(args[0]).fill(args[1]);
        else if (operation === "trace") {
            const trace = [{ initial: true, ...await focus() }];
            for (let i = 0; i < Math.min(Number(args[0]) || 10, 100); i++) {
                await page.keyboard.press(args[1] || "Tab");
                await page.waitForTimeout(220);
                trace.push({ step: i + 1, ...await focus() });
            }
            const file = `docs/accessibility/evidence/${window}-focus-${args[2] || Date.now()}.json`;
            fs.writeFileSync(file, JSON.stringify(trace, null, 2));
            console.log(JSON.stringify({ file, trace: trace.map(t => ({ ...t, html: t.html.slice(0, 230) })) }));
        } else if (operation === "focus-appearance") {
            const result = await page.evaluate(() => {
                const result = [];
                for (let e = document.activeElement; e && result.length < 5; e = e.parentElement) {
                    const s = getComputedStyle(e);
                    result.push({ html: e.outerHTML.slice(0, 350), outline: s.outline, border: s.border, background: s.backgroundColor, shadow: s.boxShadow, rect: e.getBoundingClientRect().toJSON() });
                }
                return result;
            });
            fs.writeFileSync(`docs/accessibility/evidence/${args[0]}.json`, JSON.stringify(result, null, 2));
            await page.screenshot({ path: `docs/accessibility/evidence/${args[0]}.png` });
            console.log(JSON.stringify(result));
        } else if (operation === "inspect-selector") {
            console.log(JSON.stringify(await page.locator(args[0]).evaluateAll(elements => elements.map(e => ({
                html: e.outerHTML.slice(0, 2000), rect: e.getBoundingClientRect().toJSON(),
                outline: getComputedStyle(e).outline, color: getComputedStyle(e).color,
                background: getComputedStyle(e).backgroundColor,
            })))));
        } else if (operation === "screenshot") {
            await page.screenshot({ path: `docs/accessibility/evidence/${args[0]}.png` });
        } else if (operation === "zoom") {
            // Electron zoom is a real host zoom, unlike CSS zoom emulation.
            await page.evaluate(value => require("electron").webFrame.setZoomFactor(value), Number(args[0]));
        } else if (operation !== "inspect") throw new Error(`Unknown operation ${operation}`);
        if (operation !== "trace" && operation !== "inspect-selector") {
            if (page.isClosed()) { console.log(`${window} window closed`); return; }
            console.log((await page.locator("body").ariaSnapshot()).slice(0, 6500));
            console.log("FOCUS", JSON.stringify(await focus()));
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
