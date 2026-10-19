const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function layout(page) {
    return page.getByRole('dialog').last().evaluate(dialog => {
        const rect = e => e.getBoundingClientRect().toJSON();
        const scroller = dialog.querySelector('.settings_container');
        return { viewport: { width: innerWidth, height: innerHeight }, zoom: require('electron').webFrame.getZoomFactor(),
            dialog: rect(dialog), close: rect(dialog.querySelector('button[aria-label="Close"],button[aria-label="Fermer"]')),
            scroller: { rect: rect(scroller), width: scroller.clientWidth, scrollWidth: scroller.scrollWidth, height: scroller.clientHeight, scrollHeight: scroller.scrollHeight },
            wide: [...scroller.querySelectorAll('*')].filter(e => e.getBoundingClientRect().width > scroller.clientWidth + 1 && !e.closest('.close_button_div')).map(e => ({ tag: e.tagName, class: String(e.className), width: e.getBoundingClientRect().width, text: e.textContent.slice(0, 100) })).slice(0, 12) };
    });
}
function bounded(metrics) {
    for (const [name, r] of [['dialog', metrics.dialog], ['Close', metrics.close]]) {
        assert.ok(r.top >= -1 && r.left >= -1 && r.right <= metrics.viewport.width + 1 && r.bottom <= metrics.viewport.height + 1, name + ' clipped: ' + JSON.stringify(metrics));
    }
    assert.ok(metrics.scroller.scrollWidth <= metrics.scroller.width + 1, 'Horizontal scrolling required: ' + JSON.stringify(metrics));
}
async function focusTrace(page, start) {
    await start.focus();
    const first = await start.elementHandle();
    const trace = [];
    for (let i = 0; i < 160; i++) {
        await page.keyboard.press('Tab');
        const item = await page.evaluate(first => {
            const active = document.activeElement;
            const representative = active.matches('input[type="radio"],input[type="checkbox"]') ? active.closest('label') || active.labels?.[0] || active : active;
            const dialog = active.closest('[role="dialog"]');
            let r = representative.getBoundingClientRect();
            let left = Math.max(0, r.left), right = Math.min(innerWidth, r.right), top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
            if (dialog) { const p = dialog.getBoundingClientRect(); left = Math.max(left, p.left); right = Math.min(right, p.right); top = Math.max(top, p.top); bottom = Math.min(bottom, p.bottom); }
            const point = { x: (left + right) / 2, y: (top + bottom) / 2 };
            const hit = document.elementFromPoint(point.x, point.y);
            return { html: active.outerHTML.slice(0, 600), atStart: active === first,
                withinDialog: !!dialog, box: r.toJSON(), visible: right > left && bottom > top && !!hit && (representative.contains(hit) || hit.contains(representative)), hit: hit?.outerHTML.slice(0, 180), point };
        }, first);
        trace.push(item);
        assert.ok(item.withinDialog, 'Focus left modal: ' + JSON.stringify(item));
        assert.ok(item.visible, 'Focused item obscured/clipped: ' + JSON.stringify(item));
        if (item.atStart) { await first.dispose(); return trace; }
    }
    throw new Error('Focus did not complete a cycle within 160 Tab presses');
}
function save(out, label, metrics, trace = []) {
    fs.writeFileSync(path.join(out, label + '-layout.json'), JSON.stringify({ kind: 'layout-measurement', metrics, trace }, null, 2) + '\n');
}
module.exports = { layout, bounded, focusTrace, save };
