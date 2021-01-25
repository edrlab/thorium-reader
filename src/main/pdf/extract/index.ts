import { BrowserWindow, Menu, remote } from "electron";
import { IEventBusPdfPlayer, IInfo } from "readium-desktop/common/pdf/common/pdfReader.type";
import { IS_DEV, _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL } from "readium-desktop/preprocessor-directives";
import * as path from "path";
import { eventBus } from "readium-desktop/common/pdf/common/eventBus";

export const extractPDFData =
    async (pdfPath: string)
        : Promise<[data: IInfo, coverPNG: Buffer]> => {


        pdfPath = "file://" + encodeURIComponent(pdfPath);

        let win: BrowserWindow;

        try {
            let preloadPath = "index_pdf.js";
            if (_PACKAGING === "1") {
                preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
            } else {
                if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
                    // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                    preloadPath = "file://" +
                        path.normalize(path.join((global as any).__dirname, _DIST_RELATIVE_URL, preloadPath));
                } else {
                    // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                    preloadPath = "file://" + path.normalize(path.join(process.cwd(), "dist", preloadPath));
                }
            }
            preloadPath = preloadPath.replace(/\\/g, "/");

            win = new BrowserWindow({
                width: 800,
                height: 600,
                // show: false,
                webPreferences: {
                    preload: preloadPath,
                    nodeIntegration: true,
                    webSecurity: false,
                },
            });

            // win.hide();

            const content = win.webContents;

            if (IS_DEV) {
                const wc = content;
                wc.on("context-menu", (_ev, params) => {
                    const { x, y } = params;
                    const openDevToolsAndInspect = () => {
                        const devToolsOpened = () => {
                            wc.off("devtools-opened", devToolsOpened);
                            wc.inspectElement(x, y);

                            setTimeout(() => {
                                if (wc.isDevToolsOpened() && wc.devToolsWebContents) {
                                    wc.devToolsWebContents.focus();
                                }
                            }, 500);
                        };
                        wc.on("devtools-opened", devToolsOpened);
                        wc.openDevTools({ activate: true, mode: "detach" });
                    };
                    Menu.buildFromTemplate([{
                        click: () => {
                            const wasOpened = wc.isDevToolsOpened();
                            if (!wasOpened) {
                                openDevToolsAndInspect();
                            } else {
                                if (!wc.isDevToolsFocused()) {
                                    // wc.toggleDevTools();
                                    wc.closeDevTools();

                                    setImmediate(() => {
                                        openDevToolsAndInspect();
                                    });
                                } else {
                                    // right-click context menu normally occurs when focus
                                    // is in BrowserWindow / WebView's WebContents,
                                    // but some platforms (e.g. MacOS) allow mouse interaction
                                    // when the window is in the background.
                                    wc.inspectElement(x, y);
                                }
                            }
                        },
                        label: "Inspect element",
                    }]).popup({ window: win });
                });
            }

            content.on("console-message", (_, __, message) => {
                console.log("pdf-webview", message);
            });

            content.on("ipc-message", (_ev, channel, ...args) => {

                console.log("IPC MESSAGE");

                console.log("CHANNEL");
                console.log(channel);

                console.log(args);
            });



            const bus: IEventBusPdfPlayer = eventBus(
                (key, ...a) => {
                    const data = {
                        key: JSON.stringify(key),
                        payload: JSON.stringify(a),
                    };

                    // tslint:disable-next-line: no-floating-promises
                    content.send("pdf-eventbus", data);
                },
                (ev) => {
                    content.on("ipc-message", (_event, channel, ...args) => {

                        if (channel === "pdf-eventbus") {

                            const message = args[0];
                            try {

                                const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                                const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];
                                console.log("ipc-message pdf-eventbus received", key, data);

                                if (Array.isArray(data)) {
                                    ev(key, ...data);
                                }
                            } catch (e) {
                                console.log("ipc message pdf-eventbus received with parsing error", e);
                            }

                        }
                    });
                },
            );

            bus.subscribe("metadata", (m) => {
                console.log("META");
                console.log(m);


            })
            bus.subscribe("cover", (dataUrl) => {
                console.log("COVER");
                console.log(dataUrl);


            })

            content.on("did-finish-load", () => {
                console.log("did-finish-load bus.dispatch start pdfPath", pdfPath);
                bus.dispatch("start", pdfPath);

            })

            win.loadURL(`pdfjs://local/web/viewer.html?file=${pdfPath}`);

            await new Promise<void>((resolve) => setTimeout(() => resolve(), 70000));

            return [undefined, undefined];

        } catch (e) {

            console.log("####");
            console.log("####");
            console.log("####");

            console.log(e);

            console.log("####");
            console.log("####");



        } finally {

            if (win) {
                win.close();
            }

        }
    }
