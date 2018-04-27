import { Font } from "readium-desktop/common/models/font";

const ID_PREFIX = "fontselect_";

const fontList: Font[] =
[{
    id: "DEFAULT",
    label: "Default font",
}, {
    id: "OLD",
    label: "Old Style",
    style: "font-family: \"Iowan Old Style\", \"Sitka Text\", Palatino, \"Book Antiqua\", serif;",
}, {
    id: "MODERN",
    label: "Modern",
    style: "font-family: Athelas, Constantia, Georgia, serif;",
}, {
    id: "SANS",
    label: "Sans",
    style: "font-family: -apple-system, system-ui, BlinkMacSystemFont," +
        " \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;",
}, {
    id: "HUMAN",
    label: "Humanist",
    style: "font-family: Seravek, Calibri, Roboto, Arial, sans-serif;",
}, {
    id: "DYS",
    label: "Readable (dys)",
    style: "font-family: AccessibleDfa;",
}, {
    id: "DUO",
    label: "Duospace",
    style: "font-family: \"IA Writer Duospace\", Consolas, monospace;",
}, {
    id: "MONO",
    label: "Monospace",
    style: "font-family: \"Andale Mono\", Consolas, monospace;",
}];

export default fontList;
