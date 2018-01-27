/**
 * Synchronization of redux actions
 */

export enum EventType {
    RendererAction = "RENDERER_ACTION",
    MainAction = "MAIN_ACTION",
}

export const CHANNEL = "SYNC";
