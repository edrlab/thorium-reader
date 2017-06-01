import { createStore, Store } from "redux";

import { renderer, RendererState } from "readium-desktop/renderer/reducers";

export const store: Store<RendererState> =
    createStore(renderer) as (Store<RendererState>);
