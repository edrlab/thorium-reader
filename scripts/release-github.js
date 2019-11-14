var fs = require("fs");
var path = require("path");

// https://github.com/octokit/rest.js
// https://octokit.github.io/rest.js/
const Octokit = require('@octokit/rest');

console.log("process.cwd():");
console.log(process.cwd());
console.log("path.resolve(\".\")");
console.log(path.resolve("."));

console.log("__dirname:");
console.log(__dirname);

const args = process.argv.slice(2);
console.log("args:");
console.log(args);

const envCommitSha = process.env.TRAVIS_COMMIT || process.env.APPVEYOR_REPO_COMMIT;

console.log("TRAVIS_COMMIT:");
console.log(envCommitSha);
if (!envCommitSha) {
    console.log("Missing TRAVIS_COMMIT! Abort.");
    process.exit(1);
    return;
}

console.log("TRAVIS_TAG:");
console.log(process.env.TRAVIS_TAG);
if (!process.env.TRAVIS_TAG) {
    console.log("Missing TRAVIS_TAG! Abort.");
    process.exit(1);
    return;
}

if (!process.env.GH_TOKEN) {
    console.log("Missing GH_TOKEN! Abort.");
    process.exit(1);
    return;
}

const octokit = new Octokit({
    auth: `token ${process.env.GH_TOKEN}`
});

// !!!!!!!!!!!!!!!!
// IMPORTANT !!!!
// Make sure DEBUG is *off* in TravisCI,
// as this potentially prints console messages that contain the HTTP header:
// authorization: 'token GH_TOKEN'
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

const owner_appveyor = "danielweck";
const owner = "readium";
const repo = "readium-desktop";
const tag = process.env.TRAVIS_TAG;

(async () => {

console.log("################################################");
console.log("################ getReleaseByTag:");
let getReleaseByTagRES = undefined;
try {
    getReleaseByTagRES = await octokit.repos.getReleaseByTag({owner, repo, tag})
} catch (err) {
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    if (DEBUG) console.log(err);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log("getReleaseByTag error! Continue.");
    // if (err.status !== 404) {
    //     console.log("getReleaseByTag error! Abort.");
    //     process.exit(1);
    //     return;
    // }
}

if (getReleaseByTagRES) {
    console.log("getReleaseByTagRES:");
    if (DEBUG) console.log(getReleaseByTagRES);

    const release_id = getReleaseByTagRES.data.id;

    console.log("################################################");
    console.log("################ deleteRelease:");
    let deleteReleaseRES = undefined;
    try {
        deleteReleaseRES = await octokit.repos.deleteRelease({owner, repo, release_id})
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log(err);
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("deleteReleaseRES error! Continue.");
        // console.log("deleteRelease error! Abort.");
        // process.exit(1);
        // return;
    }
    if (deleteReleaseRES) {
        console.log("deleteReleaseRES:");
        if (DEBUG) console.log(deleteReleaseRES);
    }
}

const ref = `tags/${process.env.TRAVIS_TAG}`;

console.log("################################################");
console.log("################ deleteRef:");
let deleteRefRES = undefined;
try {
    deleteRefRES = await octokit.git.deleteRef({owner, repo, ref})
} catch (err) {
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    if (DEBUG) console.log(err);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log("deleteRefRES error! Continue.");
    // console.log("deleteRef error! Abort.");
    // process.exit(1);
    // return;
}

if (deleteRefRES) {
    console.log("deleteRefRES:");
    if (DEBUG) console.log(deleteRefRES);
}

if (process.env.APPVEYOR_REPO_COMMIT) {
    console.log("Appveyor: skip create tag and release.");
    process.exit(0);
}

const message = process.env.TRAVIS_TAG;
const object = envCommitSha;
const type =  "commit";
const tagger = {
    name: "Daniel Weck",
    email: "daniel.weck@gmail.com",
    date: new Date().toISOString(),
};

console.log("################################################");
console.log("################ createTag:");
let createTagRES = undefined;
try {
    createTagRES = await octokit.git.createTag({owner, repo, tag, message, object, type, tagger, "tagger:name": tagger.name, "tagger:email": tagger.email, "tagger:date": tagger.date});
} catch (err) {
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    if (DEBUG) console.log(err);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log("createTag error! Continue.");
    // console.log("createTag error! Abort.");
    // process.exit(1);
    // return;
}
if (createTagRES) {
    console.log("createTagRES:");
    if (DEBUG) console.log(createTagRES);

    const ref2 = `refs/tags/${process.env.TRAVIS_TAG}`;
    const sha = createTagRES.data.sha;

    console.log("################################################");
    console.log("################ createRef:");
    let createRefRES = undefined;
    try {
        createRefRES = await octokit.git.createRef({owner, repo, ref: ref2, sha});
    } catch (err) {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        if (DEBUG) console.log(err);
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        console.log("createRef error! Continue.");
        // console.log("createRef error! Abort.");
        // process.exit(1);
        // return;
    }

    if (createRefRES) {
        console.log("createRefRES:");
        if (DEBUG) console.log(createRefRES);
    }
}

const travisURL = process.env.TRAVIS_JOB_WEB_URL || process.env.TRAVIS_BUILD_WEB_URL || `${process.env.APPVEYOR_URL}/project/${owner_appveyor}/${repo}/builds/${process.env.APPVEYOR_BUILD_ID}`;

const tag_name = process.env.TRAVIS_TAG;
const target_commitish = envCommitSha;
const name = `[${tag_name}] continuous test build (prerelease)`;
const body = `Travis build job: ${travisURL}`; // gets replaced by Appveyor script anyway
const draft = false;
const prerelease = true;

console.log("################################################");
console.log("################ createRelease:");
let createReleaseRES = undefined;
try {
    createReleaseRES = await octokit.repos.createRelease({owner, repo, tag_name, target_commitish, name, body, draft, prerelease});
} catch (err) {
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    if (DEBUG) console.log(err);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log("createRelease error! Continue.");
    // console.log("createRelease error! Abort.");
    // process.exit(1);
    // return;
}

if (createReleaseRES) {
    console.log("createReleaseRES:");
    if (DEBUG) console.log(createReleaseRES);
}

})();
