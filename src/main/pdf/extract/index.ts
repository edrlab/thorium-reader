import { app, BrowserWindow } from "electron";
import { IInfo } from "readium-desktop/common/pdf/common/pdfReader.type";
import { _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL } from "readium-desktop/preprocessor-directives";
// import * as console.log_ from "debug";

// const console.log = debug_("src/main/pdf/extract/index.ts");

export const extractPDFData =
    async (pdfPath: string)
        : Promise<[data: IInfo, coverPNG: Buffer]> => {

        pdfPath = "pdfjs-extract://" + encodeURIComponent(pdfPath);

        let win: BrowserWindow;

        try {
            // let preloadPath = "index_pdf.js";
            // if (_PACKAGING === "1") {
            //     preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
            // } else {
            //     if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
            //         // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            //         preloadPath = "file://" +
            //             path.normalize(path.join((global as any).__dirname, _DIST_RELATIVE_URL, preloadPath));
            //     } else {
            //         // dev/console.log mode (with WebPack HMR Hot Module Reload HTTP server)
            //         preloadPath = "file://" + path.normalize(path.join(process.cwd(), "dist", preloadPath));
            //     }
            // }
            // preloadPath = preloadPath.replace(/\\/g, "/");

            win = new BrowserWindow({
                width: 800,
                height: 600,
                // show: false,
                webPreferences: {
                    nodeIntegration: true,
                },
            });

            // win.hide();
            await win.loadURL(`pdfjs://local/web/viewer.html?file=${pdfPath}`);

            const content = win.webContents;
            content.openDevTools({ activate: true, mode: "detach" });

            content.on("ipc-message", (e, c, ...arg) => {
                console.log("IPC");
                console.log(e, c, arg);

                if (c === "pdfjs-extract-data") {

                    const str = arg[0];

                    const data = JSON.parse(str);

                    // const metadata = {
                        // info: data.info,
                        // metadata: data.metadata,
                    // };

                    // console.log(metadata);
                    const info: IInfo = { ...(data.info || {}), numberOfPage: data.numberofpages };

                    console.log(info);

                    const imgbase64 = data.img?.split(",")[1];
                    const img = Buffer.from(imgbase64|| "", "base64");

                    console.log(typeof img);

                    return [info, img];
                }

            })

            await new Promise<void>((resolve) => setTimeout(resolve, 7000));


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

        return [undefined, undefined];
    }
