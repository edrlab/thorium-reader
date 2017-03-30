import { injectable} from "inversify";
import { createStore, Store } from "redux";

import { app, IAppState } from "./../reducers/app";

export const store: Store<IAppState> = createStore(app) as (Store<IAppState>);
