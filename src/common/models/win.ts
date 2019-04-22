import { Identifiable } from "./identifiable";

export enum AppWindowType {
    Library = "library",
    Reader = "reader",
}

export interface AppWindow extends Identifiable {
    type: AppWindowType;
    win: any;
}
