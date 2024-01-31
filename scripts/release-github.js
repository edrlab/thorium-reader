const fs = require("fs").promises;
const path = require("path");

// https://github.com/octokit/rest.js
// https://octokit.github.io/rest.js/
const { Octokit } = require("@octokit/rest");

console.log("process.cwd():");
console.log(process.cwd());
console.log('path.resolve(".")');
console.log(path.resolve("."));

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

console.log("COMMIT_SHA:");
console.log(process.env.GITHUB_SHA);
if (!process.env.GITHUB_SHA) {
    console.log("Missing COMMIT_SHA! Abort.");
    process.exit(1);
    return;
}

console.log("RELEASE_TAG:");
console.log(process.env.RELEASE_TAG);
if (!process.env.RELEASE_TAG) {
    console.log("Missing RELEASE_TAG! Abort.");
    process.exit(1);
    return;
}

const ghtoken = process.env.GITHUB_TOKEN_RELEASE_PUBLISH || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!ghtoken) {
    console.log("Missing GITHUB_TOKEN! Abort.");
    process.exit(1);
    return;
}

const octokit = new Octokit({
    auth: `token ${ghtoken}`,
});

// !!!!!!!!!!!!!!!!
// IMPORTANT !!!!
// Make sure DEBUG is *off* in CI,
// as this potentially prints console messages that contain the HTTP header:
// authorization: 'token GITHUB_TOKEN'
// It that happens, revoke the token immediately!
// https://github.com/settings/tokens
// Example: when getReleaseByTag() return 404
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
const DEBUG = false;
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
const SAFE_DEBUG = false;

(async () => {
    // top-level ASYNC

    const owner = "edrlab";
    const repo = "thorium-reader";
    const tag = process.env.RELEASE_TAG;

    console.log("################################################");
    console.log("################ getReleaseByTag: " + tag);
    let getReleaseByTagRES = undefined;
    try {
        getReleaseByTagRES = await octokit.repos.getReleaseByTag({ owner, repo, tag });
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("getReleaseByTag error! Continue ... " + tag);
        // if (err.status !== 404) {
        //     console.log("getReleaseByTag error! Abort.");
        //     process.exit(1);
        //     return;
        // }
    }

    if (getReleaseByTagRES) {
        const release_id = getReleaseByTagRES.data.id;

        console.log("getReleaseByTag OK: " + tag + " ==> " + release_id);
        if (DEBUG) console.log(getReleaseByTagRES);

        if (SAFE_DEBUG) console.log(JSON.stringify(getReleaseByTagRES.data, null, 4));

        console.log("################################################");
        console.log("################ listReleaseAssets: " + release_id);
        let listReleaseAssetsRES = undefined;
        try {
            listReleaseAssetsRES = await octokit.repos.listReleaseAssets({ owner, repo, release_id });
        } catch (err) {
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            console.log("listReleaseAssets error! Continue ... " + release_id);
            // console.log("listReleaseAssets error! Abort.");
            // process.exit(1);
            // return;
        }
        if (listReleaseAssetsRES) {
            console.log("listReleaseAssets OK: " + release_id);
            if (DEBUG) console.log(listReleaseAssetsRES);

            if (SAFE_DEBUG) console.log(JSON.stringify(listReleaseAssetsRES.data, null, 4));

            for (const asset of listReleaseAssetsRES.data) {
                const asset_id = asset.id;

                console.log("################################################");
                console.log("################ deleteReleaseAsset: " + release_id + " ==> " + asset_id);
                let deleteReleaseAssetRES = undefined;
                try {
                    deleteReleaseAssetRES = await octokit.repos.deleteReleaseAsset({ owner, repo, asset_id });
                } catch (err) {
                    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                    if (DEBUG)
                        console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
                    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                    console.log("deleteReleaseAsset error! Continue ... " + release_id + " ==> " + asset_id);
                    // console.log("deleteReleaseAsset error! Abort.");
                    // process.exit(1);
                    // return;
                }
                if (deleteReleaseAssetRES) {
                    console.log("deleteReleaseAsset OK: " + release_id + " ==> " + asset_id);
                    if (DEBUG) console.log(deleteReleaseAssetRES);

                    if (SAFE_DEBUG) console.log(JSON.stringify(deleteReleaseAssetRES.data, null, 4));
                }
            }
        }

        console.log("################################################");
        console.log("################ deleteRelease: " + release_id);
        let deleteReleaseRES = undefined;
        try {
            deleteReleaseRES = await octokit.repos.deleteRelease({ owner, repo, release_id });
        } catch (err) {
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            console.log("deleteRelease error! Continue ... " + release_id);
            // console.log("deleteRelease error! Abort.");
            // process.exit(1);
            // return;
        }
        if (deleteReleaseRES) {
            console.log("deleteRelease OK: " + release_id);
            if (DEBUG) console.log(deleteReleaseRES);

            if (SAFE_DEBUG) console.log(JSON.stringify(deleteReleaseRES.data, null, 4));
        }
    }

    const ref = `tags/${process.env.RELEASE_TAG}`;

    console.log("################################################");
    console.log("################ deleteRef: " + ref);
    let deleteRefRES = undefined;
    try {
        deleteRefRES = await octokit.git.deleteRef({ owner, repo, ref });
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("deleteRef error! Continue ... " + ref);
        // console.log("deleteRef error! Abort.");
        // process.exit(1);
        // return;
    }

    if (deleteRefRES) {
        console.log("deleteRef OK: " + ref);
        if (DEBUG) console.log(deleteRefRES);

        if (SAFE_DEBUG) console.log(JSON.stringify(deleteRefRES.data, null, 4));
    }

    const message = process.env.RELEASE_TAG;
    const object = process.env.GITHUB_SHA;
    const type = "commit";
    const tagger = {
        name: "Daniel Weck",
        email: "daniel.weck@gmail.com",
        date: new Date().toISOString(),
    };

    console.log("################################################");
    console.log("################ createTag: " + message + " -- " + object);
    let createTagRES = undefined;
    try {
        createTagRES = await octokit.git.createTag({
            owner,
            repo,
            tag,
            message,
            object,
            type,
            tagger,
            "tagger:name": tagger.name,
            "tagger:email": tagger.email,
            "tagger:date": tagger.date,
        });
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("createTag error! Continue ... " + message + " -- " + object);
        // console.log("createTag error! Abort.");
        // process.exit(1);
        // return;
    }
    if (createTagRES) {
        console.log("createTag OK: " + message + " -- " + object);
        if (DEBUG) console.log(createTagRES);

        if (SAFE_DEBUG) console.log(JSON.stringify(createTagRES.data, null, 4));

        const ref2 = `refs/tags/${process.env.RELEASE_TAG}`;
        const sha = createTagRES.data.sha;

        console.log("################################################");
        console.log("################ createRef: " + ref2 + " -- " + sha);
        let createRefRES = undefined;
        try {
            createRefRES = await octokit.git.createRef({ owner, repo, ref: ref2, sha });
        } catch (err) {
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            console.log("createRef error! Continue ... " + ref2 + " -- " + sha);
            // console.log("createRef error! Abort.");
            // process.exit(1);
            // return;
        }

        if (createRefRES) {
            console.log("createRef OK: " + ref2 + " -- " + sha);
            if (DEBUG) console.log(createRefRES);

            if (SAFE_DEBUG) console.log(JSON.stringify(createRefRES.data, null, 4));
        }
    }

    const ciURL = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;

    const tag_name = process.env.RELEASE_TAG;
    const target_commitish = process.env.GITHUB_SHA;
    const name = `[${tag_name}] automated test build (beta)`;
    const body = `CI build job: ${ciURL}`;
    const draft = true;
    const prerelease = true;

    console.log("################################################");
    console.log("################ createRelease: " + tag_name + " -- " + target_commitish);
    let createReleaseRES = undefined;
    try {
        createReleaseRES = await octokit.repos.createRelease({
            owner,
            repo,
            tag_name,
            target_commitish,
            name,
            body,
            draft,
            prerelease,
        });
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("createRelease error! Continue ... " + tag_name + " -- " + target_commitish);
        // console.log("createRelease error! Abort.");
        // process.exit(1);
        // return;
    }

    if (createReleaseRES) {
        console.log("createRelease OK: " + tag_name + " -- " + target_commitish);
        // console.log(JSON.stringify(createReleaseRES, null, 4));
        if (DEBUG) console.log(createReleaseRES);

        if (SAFE_DEBUG) console.log(JSON.stringify(createReleaseRES.data, null, 4));
    }

    if (createReleaseRES && createReleaseRES.data && createReleaseRES.data.id) {
        const release_id2 = createReleaseRES.data.id;

        const upload = async (filename, filepath) => {
            console.log("################################################");
            console.log("################ uploadReleaseAsset: " + release_id2 + " ==> " + filename);
            let uploadReleaseAssetRES = undefined;
            try {
                uploadReleaseAssetRES = await octokit.repos.uploadReleaseAsset({
                    owner,
                    repo,
                    release_id: release_id2,
                    name: filename,
                    data: await fs.readFile(filepath),
                });
            } catch (err) {
                console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
                console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                console.log("uploadReleaseAsset error! Continue ... " + release_id2 + " ==> " + filename);
                // console.log("uploadReleaseAsset error! Abort.");
                // process.exit(1);
                // return;
            }

            if (uploadReleaseAssetRES) {
                console.log("uploadReleaseAsset OK: " + release_id2 + " ==> " + filename);
                if (DEBUG) console.log(uploadReleaseAssetRES);

                if (SAFE_DEBUG) console.log(JSON.stringify(uploadReleaseAssetRES.data, null, 4));
            }
        };

        async function* getFiles(dirpath) {
            const ents = await fs.readdir(dirpath, { withFileTypes: true });
            for (const ent of ents) {
                const fullPath = path.resolve(dirpath, ent.name);
                if (fullPath.indexOf("node_modules") >= 0) {
                    continue;
                }
                if (ent.isDirectory()) {
                    yield* getFiles(fullPath);
                } else {
                    if (
                        fullPath.endsWith(".exe") ||
                        fullPath.endsWith(".AppImage") ||
                        fullPath.endsWith(".deb") ||
                        fullPath.endsWith(".dmg")
                    ) {
                        yield fullPath;
                    }
                }
            }
        }

        let doneEXE = false;
        let doneAPPIMAGE = false;
        let doneDEB = false;
        let doneDMG = false;
        for await (const f of getFiles("release")) {
            if (f.endsWith(".exe")) {
                if (doneEXE) {
                    continue;
                } else {
                    doneEXE = true;
                }
            }
            if (f.endsWith(".AppImage")) {
                if (doneAPPIMAGE) {
                    continue;
                } else {
                    doneAPPIMAGE = true;
                }
            }
            if (f.endsWith(".deb")) {
                if (doneDEB) {
                    continue;
                } else {
                    doneDEB = true;
                }
            }
            if (f.endsWith(".dmg")) {
                if (doneDMG) {
                    continue;
                } else {
                    doneDMG = true;
                }
            }
            await upload(path.basename(f), f);
        }

        console.log("################################################");
        console.log("################ listReleaseAssets2: " + release_id2);
        let listReleaseAssetsRES2 = undefined;
        try {
            listReleaseAssetsRES2 = await octokit.repos.listReleaseAssets({ owner, repo, release_id: release_id2 });
        } catch (err) {
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            console.log("listReleaseAssets2 error! Continue ... " + release_id2);
            // console.log("listReleaseAssets2 error! Abort.");
            // process.exit(1);
            // return;
        }

        const assets = [];
        if (listReleaseAssetsRES2) {
            console.log("listReleaseAssets2 OK: " + release_id2);
            if (DEBUG) console.log(listReleaseAssetsRES2);

            if (SAFE_DEBUG) console.log(JSON.stringify(listReleaseAssetsRES2.data, null, 4));

            for (const asset of listReleaseAssetsRES2.data) {
                assets.push({
                    filename: asset.name,
                    url: asset.browser_download_url.replace(/\/untagged-[^\/]+\//, `/${process.env.RELEASE_TAG}/`),
                });
            }
        }

        // `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/releases/download/${process.env.RELEASE_TAG}/${asset.filename}`
        const updatedBody = `## Download links:\n\n${assets
            .map((asset) => {
                return `* __[${asset.filename}](${encodeURI(asset.url)})__`;
            })
            .join("\n")}\n\n\n\n_(build job: ${ciURL})_`;

        console.log("################################################");
        console.log("################ updateRelease: " + release_id2);
        let updateReleaseRES = undefined;
        try {
            updateReleaseRES = await octokit.repos.updateRelease({
                owner,
                repo,
                release_id: release_id2,
                body: updatedBody,
                draft: false,
            });
        } catch (err) {
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            if (DEBUG) console.log((err?.toString ? err.toString() : String(err)).replace(ghtoken, "GH_TOKEN_XX"));
            console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
            console.log("updateRelease error! Continue ... " + release_id2);
            // console.log("updateRelease error! Abort.");
            // process.exit(1);
            // return;
        }

        if (updateReleaseRES) {
            console.log("updateRelease OK: " + release_id2);
            if (DEBUG) console.log(updateReleaseRES);

            if (SAFE_DEBUG) console.log(JSON.stringify(updateReleaseRES.data, null, 4));
        }
    }
})(); // top-level ASYNC
