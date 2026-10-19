const fs = require("node:fs");
const axeSource = fs.readFileSync(require.resolve("axe-core"), "utf8");
async function connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
    let nextId = 0;
    const pending = new Map();
    socket.addEventListener("message", event => {
        const msg = JSON.parse(event.data);
        if (!msg.id || !pending.has(msg.id)) return;
        const { resolve, reject, timer } = pending.get(msg.id);
        clearTimeout(timer); pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    });
    return { socket, send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++nextId;
            const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 25000);
            pending.set(id, { resolve, reject, timer });
            socket.send(JSON.stringify({ id, method, params }));
        });
    } };
}
(async () => {
    const label = (process.argv[2] || "webviews").replace(/[^a-z0-9_-]/gi, "-");
    const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
    const results = [];
    for (const [i, target] of targets.filter(t => t.type === "webview").entries()) {
        const cdp = await connect(target.webSocketDebuggerUrl);
        try {
            if (["select", "clear-selection"].includes(process.argv[3])) {
                const expression = process.argv[3] === "clear-selection" ? "getSelection().removeAllRanges()" : `(() => {
                    const p = [...document.querySelectorAll('p')].find(p => { const r = p.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && p.textContent.trim().length > 40; });
                    if (!p) throw new Error('No visible paragraph available for annotation selection');
                    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
                    let text; while ((text = walker.nextNode())) { if (text.textContent.trim().length > 20) break; }
                    if (!text) throw new Error('No suitable text node');
                    const range = document.createRange(); range.setStart(text, 0); range.setEnd(text, Math.min(40, text.length));
                    getSelection().removeAllRanges(); getSelection().addRange(range); document.body.focus();
                    return { selectedCharacters: getSelection().toString().length };
                })()`;
                const value = await cdp.send("Runtime.evaluate", { expression, returnByValue: true });
                if (value.exceptionDetails) throw new Error(JSON.stringify(value.exceptionDetails));
                results.push({ title: target.title, action: process.argv[3], result: value.result });
                console.log(JSON.stringify(results.at(-1)));
                continue;
            }
            await cdp.send("Runtime.evaluate", { expression: axeSource });
            const evaluated = await cdp.send("Runtime.evaluate", {
                expression: `(async()=>({title:document.title,lang:document.documentElement.lang,url:location.href,axe:await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}})}))()`,
                awaitPromise: true, returnByValue: true,
            });
            if (evaluated.exceptionDetails) throw new Error(JSON.stringify(evaluated.exceptionDetails));
            const result = evaluated.result.value;
            const ax = await cdp.send("Accessibility.getFullAXTree");
            fs.writeFileSync(`docs/accessibility/evidence/${label}-${i}-ax.json`, JSON.stringify(ax, null, 2));
            const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
            fs.writeFileSync(`docs/accessibility/evidence/${label}-${i}.png`, Buffer.from(screenshot.data, "base64"));
            results.push(result);
            console.log(JSON.stringify({ label, title: result.title, lang: result.lang, violations: result.axe.violations.map(v => ({ id: v.id, nodes: v.nodes.length })), incomplete: result.axe.incomplete.map(v => v.id) }));
        } finally { cdp.socket.close(); }
    }
    fs.writeFileSync(`docs/accessibility/evidence/${label}.json`, JSON.stringify(results, null, 2));
    if (!results.length) throw new Error("No active publication webview targets");
})().catch(error => { console.error(error); process.exitCode = 1; });
