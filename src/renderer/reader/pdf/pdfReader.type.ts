import { IEventBus } from "readium-desktop/utils/eventBus";

export type IPdfPlayerScale = "fit" | "width" | "50" | "100" | "200";
export type IPdfPlayerView = "scrollable" | "paginated";
export type IPdfPlayerColumn = 1 | 2;

export interface IPdfPlayerEvent {
    "page": (pageNumber: number) => any;
    "scale": (scale: IPdfPlayerScale) => any;
    "view": (view: IPdfPlayerView) => any;
    "column": (column: IPdfPlayerColumn) => any;
    "search": (searchWord: string) => any;
    "search-next": () => any;
    "search-previous": () => any;
    "page-next": () => any;
    "page-previous": () => any;
}

export interface IEventBusPdfPlayerSlave extends IEventBus {

    subscribe: <TKey extends keyof IPdfPlayerEvent, TFn extends IPdfPlayerEvent[TKey]>(key: TKey, fn: TFn) => void;
    dispatch: <TKey extends keyof IPdfPlayerEvent>(key: TKey, ...arg: Parameters<IPdfPlayerEvent[TKey]>) => void;
    remove: <TKey extends keyof IPdfPlayerEvent>(fn: IPdfPlayerEvent[TKey], key?: TKey) => void;
    removeKey: <TKey extends keyof IPdfPlayerEvent>(key: TKey) => void;
}

export interface IEventBusPdfPlayerMaster extends IEventBus {

    subscribe: <TKey extends keyof IPdfPlayerEvent, TFn extends IPdfPlayerEvent[TKey]>(key: TKey, fn: TFn) => void;
    dispatch: <TKey extends keyof IPdfPlayerEvent>(key: TKey, ...arg: Parameters<IPdfPlayerEvent[TKey]>) => void;
    remove: <TKey extends keyof IPdfPlayerEvent>(fn: IPdfPlayerEvent[TKey], key?: TKey) => void;
    removeKey: <TKey extends keyof IPdfPlayerEvent>(key: TKey) => void;
}
