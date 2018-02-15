export interface Settings {
    [key: string]: any;
    identifier?: string;
    align: "center"|"left"|"right";
    colCount: string;
    dark: false;
    font: string;
    fontSize: any;
    invert: boolean;
    lineHeight: string;
    night: boolean;
    paged: boolean;
    readiumcss: boolean;
    sepia: boolean;
}
