import { expect, test } from "@jest/globals";
import {
    Iw3cPublicationManifest, w3cPublicationManifestToReadiumPublicationManifest,
} from "readium-desktop/main/w3c/audiobooks/converter";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { initGlobalConverters_GENERIC } from "@r2-shared-js/init-globals";

const manifest = {
    "@context": "https://readium.org/webpub-manifest/context.jsonld",
    "metadata": {
        "accessibility": {
            "accessMode": "auditory",
            "accessModeSufficient": [["auditory"], ["test", "no trailing comma"]]
        },
        "accessMode": "auditory",
        "accessModeSufficient": [["auditory"], ["test", "no trailing comma"]],
        "@type": "https://schema.org/Audiobook",
        "title": {
            en: "Audiotest 2",
            fr: "Test Audio 2",
            und: "Audio test 2",
        },
        "identifier": "urn:uuid:6b1c1997-d8c9-43a5-9b4b-b9d8b9c7771a",
        "author": {
            name: "The Author",
            role: "Person",
            identifier: "http://authors.org/person/1",
        },
        "narrator": "Musical instruments",
        "publisher": {
            name: "Stanford",
            role: "Organization",
            identifier: "https://www.stanford.edu/",
        },
        "language": [
            "en",
            "fr",
        ],
        "modified": "2020-03-23T14:58:27.372Z",
        "published": "2020-03-23T10:00:00.000Z",
        "description": "All tracks taken from open-source synthetic samples found at https://ccrma.stanford.edu/~jos/waveguide/Sound_Examples.html",
        "duration": 150,
        "subject": [
            "Music",
            "Sounds",
        ],
        "abridged": "false",
        "copyrightYear": "2020",
        "copyrightHolder": "Stanford U",
    },
    "readingOrder": [
        {
            type: "audio/mp3",
            title: "Track 1",
            duration: 10,
            alternate: [
                {
                    type: "audio/aac",
                    href: "audio/gtr-jazz.mp3",
                },
            ],
            href: "audio/gtr-jazz.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 2",
            duration: 12,
            alternate: [
                {
                    type: "audio/mpeg",
                    href: "audio/gtr-jazz.mp3",
                },
            ],
            href: "audio/Latin.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 3",
            duration: 31,
            href: "audio/oboe-bassoon.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 4",
            duration: 24,
            href: "audio/shakuhachi.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 5",
            duration: 13,
            href: "audio/slideflute.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 6",
            duration: 8,
            href: "audio/sweeping_straw_broom-mike-koenig.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 7",
            duration: 39,
            href: "audio/tenor-sax.mp3",
        },
        {
            type: "audio/mpeg",
            title: "Track 8",
            duration: 13,
            href: "audio/vln-lin-cs.mp3",
        },
    ],
    "resources": [
        {
            type: "image/webp",
            title: "Cover",
            rel: "cover",
            href: "cover/audiobook-cover.webp",
        },
        {
            type: "text/html",
            title: "Table of Contents",
            rel: "contents",
            href: "index.html",
        },
    ],
};

interface Tw3cPublicationManifest extends Iw3cPublicationManifest {
    abridged: string;
    copyrightYear: string;
    copyrightHolder: string;
}

const publication: Tw3cPublicationManifest = {
    "@context": [
        "https://schema.org",
        "https://www.w3.org/ns/pub-context",
    ],
    "conformsTo": "https://www.w3.org/TR/audiobooks/",
    "type": "Audiobook",
    "dateModified": "2020-03-23T16:58:27.372+02:00",
    "id": "urn:uuid:6b1c1997-d8c9-43a5-9b4b-b9d8b9c7771a",
    "name": [{ value: "Audiotest 2", language: "en" }, { value: "Test Audio 2", language: "fr" }, "Audio test 2"],
    "author": { type: "Person", name: "The Author", id: "http://authors.org/person/1" },
    "readBy": "Musical instruments",
    "publisher": { type: "Organization", name: "Stanford", url: "https://www.stanford.edu/", identifier: "org:stanford-u" },
    "inLanguage": ["en", "fr"],
    "datePublished": "2020-03-23T12:00:00+02:00",
    "abridged": "false",
    "duration": "PT150S",
    "dcterms:description": "All tracks taken from open-source synthetic samples found at https://ccrma.stanford.edu/~jos/waveguide/Sound_Examples.html",
    "dcterms:subject": ["Music", "Sounds"],
    "copyrightYear": "2020",
    "copyrightHolder": "Stanford U",
    "accessMode": "auditory",
    "accessModeSufficient": [{
        type: "ItemList",
        itemListElement: ["auditory"],
        description: "Audio",
    }, {
        type: "ItemList",
        itemListElement: ["test", "no trailing comma"],
        description: "Audio",
    }],
    "resources": [
        {
            url: "cover/audiobook-cover.webp",
            name: "Cover",
            rel: "cover",
        },
        {
            url: "index.html",
            name: "Table of Contents",
            rel: "contents",
        },
    ],
    "readingOrder": [
        {
            url: "audio/gtr-jazz.mp3",
            encodingFormat: "audio/mp3",
            name: [{ value: "Track 1", language: "en" }, { value: "Piste 1", language: "fr" }],
            duration: "PT10S",
            description: "see https://ccrma.stanford.edu/~jos/mp3/gtr-jazz.mp3",
            alternate: [{
                url: "audio/gtr-jazz.mp3",
                encodingFormat: "audio/aac",
            }],
        },
        {
            url: "audio/Latin.mp3",
            name: "Track 2",
            duration: "PT12S",
            alternate: {
                url: "audio/gtr-jazz.mp3",
            },
        },
        {
            type: "LinkedResource",
            url: "audio/oboe-bassoon.mp3",
            name: "Track 3",
            duration: "PT31S",
        },
        {
            url: "audio/shakuhachi.mp3",
            name: "Track 4",
            duration: "PT24S",
        },
        {
            url: "audio/slideflute.mp3",
            name: "Track 5",
            duration: "PT13S",
        },
        {
            url: "audio/sweeping_straw_broom-mike-koenig.mp3",
            name: "Track 6",
            duration: "PT8S",
        },
        {
            url: "audio/tenor-sax.mp3",
            name: "Track 7",
            duration: "PT39S",
        },
        {
            url: "audio/vln-lin-cs.mp3",
            name: "Track 8",
            duration: "PT13S",
        },
    ],
};

// https://github.com/readium/r2-shared-js/blob/83c63065b93f52611664bef334b16e2fcd7251e4/src/init-globals.ts#L26
initGlobalConverters_GENERIC();

test("publication to manifest", async () => {

    const res = await w3cPublicationManifestToReadiumPublicationManifest(publication, (_uniqueResources) => {
        // console.log(uniqueResources);
        return undefined;
    });

    expect(JSON.stringify(TaJsonSerialize(res))).toStrictEqual(JSON.stringify(manifest));
});
