import { createPdfAnnotationController } from "readium-desktop/renderer/reader/pdf/webview/annotations";

type TCallback = (...args: any[]) => void;

interface IAnnotationDraft {
    type: "pdf-text-highlight";
    page: number;
    rects: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>;
    quote?: string;
}

interface IAnnotation extends IAnnotationDraft {
    id: string;
}

interface IPdfJsApplicationWindow extends Window {
    PDFViewerApplication?: {
        eventBus?: any;
        pdfDocument?: any;
        pdfViewer?: any;
    };
    __thoriumPdfAnnotationHarness?: IHarnessApi;
}

interface IHarnessApi {
    annotations: () => IAnnotation[];
    clear: () => void;
    createHighlight: () => void;
    destroy: () => void;
    goToAnnotation: (id?: string) => void;
    sync: () => void;
}

const HARNESS_ID = "thorium-pdf-annotation-harness";
const STYLE_ID = "thorium-pdf-annotation-harness-style";
const STATUS_ID = "thorium-pdf-annotation-harness-status";
const LOG_ID = "thorium-pdf-annotation-harness-log";

const typedWindow = window as IPdfJsApplicationWindow;

class HarnessBus {

    private readonly handlers = new Map<string, Set<TCallback>>();

    public subscribe(key: string, fn: TCallback) {
        const handlers = this.handlers.get(key) || new Set<TCallback>();
        handlers.add(fn);
        this.handlers.set(key, handlers);
    }

    public dispatch(key: string, ...args: any[]) {
        const handlers = this.handlers.get(key);
        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            handler(...args);
        }
    }

    public remove(fn: TCallback, key?: string) {
        if (key) {
            this.handlers.get(key)?.delete(fn);
            return;
        }

        for (const handlers of this.handlers.values()) {
            handlers.delete(fn);
        }
    }

    public removeKey(key: string) {
        this.handlers.delete(key);
    }
}

function getApplication() {
    return typedWindow.PDFViewerApplication;
}

function hasUsablePdfJsApplication() {
    const application = getApplication();

    return !!application?.eventBus && !!application?.pdfViewer;
}

function waitForPdfJsApplication() {
    return new Promise<void>((resolve, reject) => {
        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            if (hasUsablePdfJsApplication()) {
                window.clearInterval(timer);
                resolve();
                return;
            }

            if (Date.now() - startedAt > 10000) {
                window.clearInterval(timer);
                reject(new Error("PDFViewerApplication was not ready after 10 seconds"));
            }
        }, 100);
    });
}

function makeId() {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `harness-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createPanel() {
    const existing = document.getElementById(HARNESS_ID);
    if (existing) {
        existing.remove();
    }
    document.getElementById(STYLE_ID)?.remove();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${HARNESS_ID} {
            background: #ffffff;
            border: 1px solid #9aa7b5;
            border-radius: 4px;
            box-shadow: 0 8px 24px rgb(15 23 42 / 20%);
            color: #111827;
            display: grid;
            font: 12px Arial, Helvetica, sans-serif;
            gap: 6px;
            max-width: 280px;
            padding: 8px;
            position: fixed;
            right: 16px;
            top: 58px;
            z-index: 10000;
        }

        #${HARNESS_ID} strong {
            font-size: 12px;
        }

        #${HARNESS_ID} .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        #${HARNESS_ID} button {
            background: #1f6feb;
            border: 1px solid #1f6feb;
            border-radius: 4px;
            color: #ffffff;
            cursor: pointer;
            font: inherit;
            min-height: 28px;
            padding: 4px 8px;
        }

        #${HARNESS_ID} button.secondary {
            background: #ffffff;
            border-color: #9aa7b5;
            color: #111827;
        }

        #${HARNESS_ID} button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
        }

        #${STATUS_ID} {
            color: #374151;
        }

        #${LOG_ID} {
            background: #f3f5f7;
            border: 1px solid #d8dee6;
            box-sizing: border-box;
            color: #1f2937;
            max-height: 120px;
            overflow: auto;
            padding: 6px;
            white-space: pre-wrap;
        }
    `;

    const panel = document.createElement("div");
    panel.id = HARNESS_ID;
    panel.innerHTML = `
        <strong>Thorium PDF annotations</strong>
        <div class="actions">
            <button id="thorium-pdf-annotation-create" type="button">Create highlight</button>
            <button class="secondary" id="thorium-pdf-annotation-go-to-latest" type="button">Go to latest</button>
            <button class="secondary" id="thorium-pdf-annotation-clear" type="button">Clear</button>
        </div>
        <div id="${STATUS_ID}">Starting</div>
        <pre id="${LOG_ID}"></pre>
    `;

    document.head.append(style);
    document.body.append(panel);

    return {
        clearButton: document.getElementById("thorium-pdf-annotation-clear") as HTMLButtonElement,
        createButton: document.getElementById("thorium-pdf-annotation-create") as HTMLButtonElement,
        goToButton: document.getElementById("thorium-pdf-annotation-go-to-latest") as HTMLButtonElement,
        log: document.getElementById(LOG_ID) as HTMLPreElement,
        panel,
        status: document.getElementById(STATUS_ID) as HTMLDivElement,
        style,
    };
}

async function init() {
    if (typedWindow.__thoriumPdfAnnotationHarness) {
        typedWindow.__thoriumPdfAnnotationHarness.destroy();
    }

    const panel = createPanel();
    const bus = new HarnessBus();
    const annotations: IAnnotation[] = [];
    const controller = createPdfAnnotationController(bus as any, getApplication);

    function updateGoToButton() {
        panel.goToButton.disabled = !annotations.length;
    }

    function setStatus(message: string) {
        updateGoToButton();
        panel.status.textContent = `${message} | annotations: ${annotations.length}`;
    }

    function appendLog(message: string, data?: unknown) {
        const detail = typeof data === "undefined" ? "" : ` ${JSON.stringify(data)}`;
        panel.log.textContent = `${new Date().toLocaleTimeString()} ${message}${detail}\n${panel.log.textContent}`.slice(0, 4000);
    }

    function sync() {
        bus.dispatch("annotations:sync", {
            annotations: [...annotations],
        });
        setStatus("Synced");
    }

    function createHighlight() {
        appendLog("dispatch highlight:create-from-selection");
        bus.dispatch("highlight:create-from-selection");
    }

    function clear() {
        annotations.splice(0, annotations.length);
        appendLog("clear annotations");
        sync();
    }

    function goToAnnotation(id?: string) {
        const annotation = id
            ? annotations.find((item) => item.id === id)
            : annotations[annotations.length - 1];
        if (!annotation) {
            appendLog("go-to ignored: missing annotation", { id });
            setStatus("Go-to ignored");
            return;
        }

        const rect = annotation.rects[0];
        if (!rect) {
            appendLog("go-to ignored: missing rect", { id: annotation.id });
            setStatus("Go-to ignored");
            return;
        }

        appendLog("dispatch viewer:go-to-annotation", {
            id: annotation.id,
            page: annotation.page,
        });
        bus.dispatch("viewer:go-to-annotation", {
            id: annotation.id,
            page: annotation.page,
            rect,
        });
        setStatus("Go-to dispatched");
    }

    bus.subscribe("annotations:ready", () => {
        appendLog("annotations:ready");
        sync();
    });

    bus.subscribe("annotation:create-requested", (payload: {
        draft?: IAnnotationDraft;
    }) => {
        if (!payload?.draft) {
            appendLog("create request ignored: missing draft");
            return;
        }

        const annotation = {
            ...payload.draft,
            id: makeId(),
        };
        annotations.push(annotation);
        appendLog("annotation stored", {
            id: annotation.id,
            page: annotation.page,
            rects: annotation.rects.length,
        });
        sync();
    });

    const goToLatestAnnotation = () => goToAnnotation();

    panel.createButton.addEventListener("click", createHighlight);
    panel.clearButton.addEventListener("click", clear);
    panel.goToButton.addEventListener("click", goToLatestAnnotation);
    updateGoToButton();

    typedWindow.__thoriumPdfAnnotationHarness = {
        annotations: () => [...annotations],
        clear,
        createHighlight,
        destroy: () => {
            controller.destroy();
            panel.createButton.removeEventListener("click", createHighlight);
            panel.clearButton.removeEventListener("click", clear);
            panel.goToButton.removeEventListener("click", goToLatestAnnotation);
            panel.panel.remove();
            panel.style.remove();
            delete typedWindow.__thoriumPdfAnnotationHarness;
        },
        goToAnnotation,
        sync,
    };

    setStatus("Waiting for PDF.js");
    await waitForPdfJsApplication();
    controller.init();
    setStatus("Ready");
    appendLog("harness ready");
}

init().catch((error) => {
    const panel = document.getElementById(STATUS_ID);
    if (panel) {
        panel.textContent = error instanceof Error ? error.message : String(error);
    }
    console.error("[Thorium PDF annotation harness]", error);
});
