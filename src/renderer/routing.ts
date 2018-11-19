import MyBooksCard from "readium-desktop/renderer/components/MyBooksCard";
import MyBooksList from "readium-desktop/renderer/components/MyBooksList";

interface Route {
    path: string;
    exact: boolean;
    title: string;
    component: any;
    customParams?: any;
}

interface RouteList {
    [path: string]: Route;
}

export const routes: RouteList = {
    "/myBooks/list": {
        path: "/myBooks/list",
        exact: false,
        title: "MyBooksList",
        component: MyBooksList,
    },
    "/": {
        path: "/",
        exact: false,
        title: "Home",
        component: MyBooksCard,
    },
};
