export class WebGLContext {
    constructor({ enable }: {
        enable?: boolean | undefined;
    });
    _enabled: boolean;
    get isEnabled(): any;
    composeSMask({ layer, mask, properties }: {
        layer: any;
        mask: any;
        properties: any;
    }): any;
    drawFigures({ width, height, backgroundColor, figures, context }: {
        width: any;
        height: any;
        backgroundColor: any;
        figures: any;
        context: any;
    }): any;
    clear(): void;
}
