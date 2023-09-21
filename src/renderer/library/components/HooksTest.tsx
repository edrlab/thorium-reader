import * as React from "react";
import { log } from "console";
import { ILibraryRootState } from "../redux/states";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionLocatorHrefChanged } from "readium-desktop/renderer/reader/redux/actions";
// import { v4 as uuidv4 } from "uuid";
// import { TApiMethod, TApiMethodName } from "readium-desktop/common/api/api.type";
// import { ReactReduxContext} from 'react-redux'
// import { TModuleApi } from "readium-desktop/common/api/moduleApi.type";
// import { TMethodApi } from "readium-desktop/common/api/methodApi.type";
// import { apiActions } from "readium-desktop/common/redux/actions";
// import { useSyncExternalStore } from "readium-desktop/renderer/common/hooks/useSyncExternalStore";

export function HooksTest(props: { name: string }) {

    const name = props.name;
    // useSelector from react-redux
    // const {locale} = useSelector((state: ILibraryRootState) => {

    //     log(Date.now().toString(), "useSelector Locale");
    //     return state.i18n;

    // }
    // ,
    // (a, b) => {

    //     log("cond: ", a, b, a === b);
    //     return a === b
    // }
    // );

    // const translator = React.useContext(TranslatorContext);
    // const { translate: _ } = translator;
    // // useSyncExternalStore(translator.subscribe, () => {console.log("a"); return translator.getLocale();});

    // const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    // React.useEffect(() => {
    //     const handleLocaleChange = () => {
    //         forceUpdate();
    //     }
    //     return translator.subscribe(handleLocaleChange);
    // }, [translator.subscribe]);
    const [__] = useTranslator();
    // let _ = (_a: any) => {};

    // const {store} = React.useContext<ReactReduxContextValue<ILibraryRootState>>(ReactReduxContext);
    // const id = useSyncExternalStore(store.subscribe, () => store.getState().win.identifier);
    // log(id);

    // useSelector custom with just useSyncExternalStore
    const id = useSelector((state: ILibraryRootState) => state.win.identifier);
    // let id = "";
    log(id);

    // const requestId = React.useMemo(() => uuidv4(), []);
    const requestId: string = null;
    log(requestId);
    // useApi
    // const [requestId] = React.useState('test');
    // useDispatchApi(requestId, "publication/findAll");

    // const { store } = React.useContext(ReactReduxContext);
    // React.useEffect(() => {
    //   const apiPath = "publication/findAll";
    //   const requestData: any[] = [];
    //   const splitPath = apiPath.split("/");
    //   const moduleId = splitPath[0] as TModuleApi;
    //   const methodId = splitPath[1] as TMethodApi;
    //   store.dispatch(apiActions.request.build(requestId, moduleId, methodId, requestData))
    // }, []);

    const action = useDispatch(readerLocalActionLocatorHrefChanged.build("", ""));
    log(action);

    // const allPubRes = useSyncExternalStore(store.subscribe, () => store.getState().api[requestId]);
    const allPubRes = useApi(requestId, "publication/findAll");
    log(allPubRes);
    log(Date.now().toString(), "rendered");
    return <h1 style={{ position: "absolute", top: 0, zIndex: 999 }}>Hello : {name} : id {id} : translate {__("header.books")}</h1>;
}
