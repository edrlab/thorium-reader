const fs = require('fs');
for (const filePath of [
    "node_modules/r2-navigator-js/dist/es8-es2017/src/electron/renderer/webview/preload.js"
]) {
    let txt = fs.readFileSync(filePath, { encoding: 'utf8' });
    txt = txt.replace(/win\.document\.addEventListener\(\"mouseup\"/, `
    let __enableCheckSelectionIntervalOnTouchendEvent = false;
    let __lastSelectedText = "";
    let __lastTouchendX = undefined;
    let __lastTouchendY = undefined;
    setInterval(() => {
        if (__enableCheckSelectionIntervalOnTouchendEvent) {
            const currentSelection = window.getSelection().toString();
            if (currentSelection !== __lastSelectedText) {
                __lastSelectedText = currentSelection;
                handleTouchEvent({clientX: __lastTouchendX, clientY: __lastTouchendY});
            }
        }
    }, 100);
    win.document.documentElement.addEventListener("mouseup", () => {
        __enableCheckSelectionIntervalOnTouchendEvent = false;
    });
    function handleTouchEvent(ev) {
        if ((0, popup_dialog_1.isPopupDialogOpen)(win.document)) {
            return;
        }
        if (win.document.activeElement &&
            win.document.activeElement === win.document.getElementById(styles_1.SKIP_LINK_ID)) {
            debug(".hashElement = 5 => SKIP_LINK_ID mouse click event - screen reader VoiceOver generates mouse click / non-keyboard event");
            return;
        }
        const x = ev.clientX;
        __lastTouchendX = x;
        const y = ev.clientY;
        __lastTouchendY = y;
        processXYDebouncedImmediate(x, y, false, true);
    }
    win.document.documentElement.addEventListener("touchend", (ev) => {
        console.log("#### touchend", ev);
        __enableCheckSelectionIntervalOnTouchendEvent = true;
        handleTouchEvent(ev);
    });
    win.document.documentElement.addEventListener("touchstart", (ev) => {
        console.log("#### touchstart", ev);
    });
    // win.document.documentElement.addEventListener("touchmove", (ev) => {
    //     console.log("#### touchmove", ev);
    // });
    // win.document.documentElement.addEventListener("pointerdown", (ev) => {
    //     console.log("#### pointerdown", ev);
    // });
    // win.document.documentElement.addEventListener("pointerup", (ev) => {
    //     console.log("#### pointerup", ev);
    // });
    // win.document.documentElement.addEventListener("pointermove", (ev) => {
    //     console.log("#### pointermove", ev);
    // });
    // win.document.documentElement.addEventListener("select", (ev) => {
    //     console.log("#### select", ev);
    // });
    // win.document.documentElement.addEventListener("selectstart", (ev) => {
    //     console.log("#### selectstart", ev);
    // });
    // selectionchange not fired with touch event !
    win.document.documentElement.addEventListener("selectionchange", (ev) => {
        console.log("#### selectionchange", ev);
    });
    win.document.addEventListener("mouseup"`);
    fs.writeFileSync(filePath, txt, { encoding: 'utf8' });
}
