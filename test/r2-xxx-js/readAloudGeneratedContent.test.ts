import { afterAll, beforeAll, expect, test } from "@jest/globals";
import { JSDOM } from "jsdom";

let tts: typeof import("@r2-navigator-js/electron/renderer/common/dom-text-utils");
const dom = new JSDOM("<!DOCTYPE html><html lang='en'><body></body></html>");
const { document } = dom.window;

beforeAll(() => {
    Object.assign(globalThis, { Node: dom.window.Node, window: dom.window });
    Object.assign(dom.window, { READIUM2: { ttsSkippabilityEnabled: false } });

    // JSDOM computes regular element styles but has no pseudo-element styles.
    const computed = dom.window.getComputedStyle.bind(dom.window);
    dom.window.getComputedStyle = (element, pseudo) => {
        if (!pseudo) return computed(element);
        const key = pseudo.replace(/^:+/, "");
        const style = document.createElement("span").style;
        style.content = element.getAttribute(`data-${key}`) ?? "none";
        style.display = element.getAttribute(`data-${key}-display`) ?? "inline";
        style.visibility = "visible";
        style.opacity = "1";
        style.setProperty("speak", element.getAttribute(`data-${key}-speak`) ?? "normal");
        return style;
    };
    // The navigator captures its webview window when this module is loaded.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tts = require("@r2-navigator-js/electron/renderer/common/dom-text-utils");
});

afterAll(() => {
    dom.window.close();
    Reflect.deleteProperty(globalThis, "Node");
    Reflect.deleteProperty(globalThis, "window");
});

function spokenText(html: string, splitSentences: boolean) {
    document.body.innerHTML = html;
    const queue = tts.generateTtsQueue(document.body, splitSentences);
    const utterances = Array.from({ length: tts.getTtsQueueLength(queue) }, (_, i) =>
        tts.getTtsQueueItemRefText(tts.getTtsQueueItemRef(queue, i)),
    );
    return utterances.join(" ").replace(/\s+/g, " ").trim();
}

test.each([false, true])("reads the speaker cue and the paragraph with sentence splitting %s", (splitSentences) => {
    const paragraph = "We spend a lot of time just sitting on our couch, not talking much, relearning the rhythm of shared space.";
    expect(spokenText(`<p data-before='". therapist says. "'>${paragraph}</p>`, splitSentences))
        .toBe(`. therapist says. ${paragraph}`);
});

test("reads nested generated labels around inline text and on empty elements in document order", () => {
    expect(spokenText(
        `<p data-before='"Start "'>First <span data-before='"outer "' data-after='" end "'>` +
        `<em data-before='"inner "'>word</em></span>last.</p><p data-after='"End."'></p>`, false,
    )).toBe("Start First outer inner word end last. End.");
});

test("skips hidden elements, hidden pseudo-elements and decorative content with an empty alternative", () => {
    expect(spokenText(
        `<p data-before='"ornament" / ""' data-after='"invisible"' data-after-display="none">` +
        `Read <span aria-hidden="true" data-before='"hidden label"'>hidden text</span>` +
        `<span data-before='"silent"' data-before-speak="none"></span>this.</p>`, true,
    )).toBe("Read this.");
});

test("speaks the image's CSS alternative in the inherited language and omits unlabelled image URLs", () => {
    document.body.innerHTML = '<section lang="fr"><p> Bonjour.</p></section>';
    const paragraph = document.querySelector("p");
    paragraph.setAttribute("data-before", String.raw`url("https://example.org/fr/intro.svg") / "R\E9 sum\E9\A \"nord/sud\". "`);
    paragraph.setAttribute("data-after", 'url("https://example.org/fr/decoration.svg")');

    const queue = tts.generateTtsQueue(document.body, false);
    const utterances = Array.from({ length: tts.getTtsQueueLength(queue) }, (_, i) => {
        const ref = tts.getTtsQueueItemRef(queue, i);
        expect(ref.item.lang).toBe("fr");
        return tts.getTtsQueueItemRefText(ref);
    });
    expect(utterances.join(" ").replace(/\s+/g, " ").trim()).toBe('Résumé "nord/sud". Bonjour.');
});

const speaker = `data-before='"The speaker introduces the passage. "'`;
const sentences = "First sentence. Second sentence.";
test.each([
    ["a paragraph cue", `<p ${speaker}>${sentences}</p>`, "p"],
    ["a paragraph cue before indented inline text", `<p ${speaker}>\n  <em>${sentences}</em></p>`, "em"],
    ["an empty inline cue before the text", `<p><span ${speaker}></span>${sentences}</p>`, "p"],
])("includes %s at the first character but starts at the second sentence when clicked", (_name, html, selector) => {
    document.body.innerHTML = html;
    const element = document.querySelector(selector);
    const text = element.lastChild;
    const queue = tts.generateTtsQueue(document.body, true);
    const start = tts.findTtsQueueItemIndex(queue, element, text, 0, document.body);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(tts.getTtsQueueItemRefText(tts.getTtsQueueItemRef(queue, start)).trim())
        .toMatch(/^The speaker introduces the passage\./);
    const index = tts.findTtsQueueItemIndex(queue, element, text, text.nodeValue.indexOf("Second") + 2, document.body);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(tts.getTtsQueueItemRefText(tts.getTtsQueueItemRef(queue, index)).trim()).toBe("Second sentence.");
});
