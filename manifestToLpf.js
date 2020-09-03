#! node

/** Media type for JSON */
const json_content_type = 'application/json';
/** Media type for JSON-LD */
const jsonld_content_type = 'application/ld+json';
/** Media type for HTML */
const html_content_type = 'text/html';

const fetch = require('node-fetch');
const { log, error } = require("console");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { resolve } = require("url");
const yazl = require("yazl");
const fs = require("fs");
const { promises } = require("dns");

const progName = process.argv[1] || "";
const argUrl = process.argv[2] || "";
const packageName = process.argv[3] || "package.lpf";

(async () => {


    let publicationData;
    let entryData;
    let downloadStream;

    try {
        log(argUrl);
        new URL(argUrl);

    } catch (e) {
        error(progName, "<URL>");
        error(e.toString());

        return;
    }

    const masterUrl = argUrl;

    log("URL:", masterUrl);

    log("fetching...");

    let isJson = false;
    try {

        const response = await fetch(masterUrl);

        log(response.ok);
        log(response.status);
        log(response.statusText);

        const contentType = response.headers.get('content-type');
        log(contentType);

        const contentTypeArray = contentType.replace(/\s/g, '').split(';');
        if (contentTypeArray.find((v) => v === json_content_type || v === jsonld_content_type)) {
            isJson = true;

            publicationData = await response.text();
        } else if (contentTypeArray.includes(html_content_type)) {

            isJson = false;
            entryData = await response.text();
        } else {
            error("bad content-type");

            return ;
        }


    } catch (e) {

        error("error to fetch", masterUrl);
        error(e);
    }

    log(publicationData || entryData);

    // html parsing
    if (!isJson) {
        log("parse html file");

        try {
            const { window } = new JSDOM(entryData);

            const elem = window.document.querySelector("link[rel=\"publication\"]");
            if (elem) {
                const href = elem.href;
                log(href);

                log("download the pubication linked in the html");


                const publicationUrl = resolve(masterUrl, href);
                log("publicationUrl", publicationUrl);

                if (!publicationUrl.startsWith("about:blank")) {

                    try {

                        const response = await fetch(publicationUrl);

                        log(response.ok);
                        log(response.status);
                        log(response.statusText);

                        const contentType = response.headers.get('content-type');
                        log(contentType);

                        const contentTypeArray = contentType.replace(/\s/g, '').split(';');
                        if (contentTypeArray.find((v) => v === json_content_type || v === jsonld_content_type)) {
                            publicationData = await response.text();
                        } else {
                            error("bad content-type");

                            return;
                        }


                    } catch (e) {

                        error("error to fetch", masterUrl);
                        error(e);
                    }

                    log(publicationData);
                } else {
                    error("bad publication link");
                }
            } else {
                error("no publication link element found");
            }

        } catch (e) {

            error("error to parsing html");
            error(e);
        }

    }

    //zip creation

    const ressourcesArray = [];

    if (publicationData) {

        let json;
        try {

            json = JSON.parse(publicationData);
        } catch (e) {
            error("error to parse publication json");
        }

        const fn = (v) => {

            let href;
            if (typeof v === "string") {
                href = v;
            } else if (typeof v === "object") {
                if (typeof v.url === "string") {
                    href = v.url;
                }
            }

            if (href) {

                try {
                    if (!href.startsWith("http")) {

                        const resolvedUrl = resolve(masterUrl, href);
                        const pathname = href;
                        const pathnameAbsolute = pathname[0] === "/" ? pathname.slice(1) : pathname;

                        log(pathnameAbsolute, resolvedUrl);
                        ressourcesArray.push([pathnameAbsolute, resolvedUrl]);
                    }

                } catch (e) {
                    error(v, ": bad url");
                }
            }
        }

        let readingOrder = Array.isArray(json.readingOrder) ? json.readingOrder : [json.readingOrder];
        let ressources = Array.isArray(json.resources) ? json.resources : [json.resources];

        if (ressources) {
            ressources.forEach(fn);
        } else {
            log("no ressources");
        }
        if (readingOrder) {
            readingOrder.forEach(fn);
        } else {
            log("no readingOrders");
        }

        // downloads all ressources

        downloadStream = ressourcesArray.map(async ([pathName, href]) => {

            if (pathName && href) {

                try {

                    const response = await fetch(href);

                    if (response.ok) {

                        return [pathName, response.body];

                    } else {
                        throw new Error("not ok", response.statusText);
                    }
                } catch (e) {
                    error("error to fetch ", href, "from ressources");
                    error(e);
                }
            }

            return [];
        });

    } else {
        error("no publication.json");
    }

    try {

        const zipfile = new yazl.ZipFile();
        zipfile.outputStream.pipe(fs.createWriteStream(packageName)).on("close", function () {
            log("lpf package created");
        });
        // alternate apis for adding files:
        if (publicationData) {
            zipfile.addBuffer(Buffer.from(publicationData), "publication.json");
        }

        if (entryData) {
            zipfile.addBuffer(Buffer.from(entryData), "index.html");
        }

        if (downloadStream) {

            let streamArray;
            try {
                streamArray = await Promise.all(downloadStream);
            } catch (e) {
                error(e);
            }

            streamArray.forEach(([pathName, stream]) => {
                if (pathName && stream) {

                    zipfile.addReadStream(stream, pathName);
                }
            })
        }

        // if (!entryData && !publicationData) {
        //     error("the lpf package will be empty");
        // }
        // call end() after all the files have been added
        zipfile.end();
    } catch (e) {

        error("Error to create lpf package");
        error(e);
    }

})();
