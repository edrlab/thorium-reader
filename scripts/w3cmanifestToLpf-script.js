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
const { inflate } = require("zlib");
const { publicEncrypt } = require("crypto");
const fs = require("fs");

const progName = process.argv[1] || "";
const argUrl = process.argv[2] || "";
const packageName = process.argv[3] || "package.lpf";

(async () => {


    let publicationData;
    let entryData;

    try {
        log(argUrl);
        new URL(argUrl);

    } catch (e) {
        error(progName, "<URL>");
        error(e.toString());

        return;
    }

    const url = argUrl;

    log("URL:", url);

    log("fetching...");

    let isJson = false;
    try {

        const response = await fetch(url);

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

        error("error to fetch", url);
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


                const publicationUrl = resolve(url, href);
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

                        error("error to fetch", url);
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
            zipfile.addBuffer(Buffer.from(entryData), "entry.html");
        }

        if (!entryData && !publicationData) {
            error("the lpf package will be empty");
        }
        // call end() after all the files have been added
        zipfile.end();
    } catch (e) {

        error("Error to create lpf package");
        error(e);
    }

})();
