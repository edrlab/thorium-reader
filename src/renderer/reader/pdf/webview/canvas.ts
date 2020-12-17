
export function createCanvas(rootElement: HTMLElement): HTMLCanvasElement {

    const canvas = document.createElement("canvas");
    rootElement.appendChild(canvas);

    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;
    canvas.setAttribute("style", "display: block; position: absolute; left: 0; top: 0;");

    return canvas;
}
