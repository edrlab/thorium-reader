import {
    WINDOW_INIT,
    WindowAction,
} from "readium-desktop/renderer/actions/window";

export enum WindowStatus {
    Initializing, // Window is initializing
    Initialized, // Window has been initialized
}

export enum WindowView {
    Catalog, // Catalog view
    Book, // Book view
}

export interface WindowState {
    status: WindowStatus;
    view: WindowView;
}

const initialState: WindowState = {
    status: WindowStatus.Initializing,
    view: WindowView.Catalog,
};

export function windowReducer(
    state: WindowState = initialState,
    action: WindowAction,
    ): WindowState {
    switch (action.type) {
        case WINDOW_INIT:
            state.status = WindowStatus.Initialized;
            return state;
        default:
            return state;
    }
}
