
import * as React from "react";
import { log } from "console";
import { ILibraryRootState } from "../redux/states";
import { useTranslator } from "readium-desktop/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/common/hooks/useSelector";

export function HooksTest(props: {name:string}) {

    let name = props.name;
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
    const _ = useTranslator();

    // const {store} = React.useContext<ReactReduxContextValue<ILibraryRootState>>(ReactReduxContext);
    // const id = useSyncExternalStore(store.subscribe, () => store.getState().win.identifier);
    // log(id);

    // useSelector custom with just useSyncExternalStore
    const id = useSelector((state: ILibraryRootState) => state.win.identifier);
    log(id);


    log(Date.now().toString(), "rendered");
    return <h1 style={{position: "absolute", top: 0, zIndex: 999}}>Hello : {name} : id {id} : translate {_("header.books")}</h1>;
  }