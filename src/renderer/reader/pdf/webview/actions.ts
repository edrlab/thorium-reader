import { IPdfBus } from "./index_pdf";
import { IPdfStore } from "./index_pdf";

export const pageNumberCheck = (pageNumber: number) => {
    return pageNumber < 1 ? 1 : pageNumber;
};

export const goToPageAction =
    ({ store, bus }: { store: IPdfStore, bus: IPdfBus }) =>
        async (pageNumber: number) => {

            const { displayPage } = store.getState();
            try {
                const pageNb = pageNumberCheck(pageNumber);
                await displayPage(pageNb);
                store.setState({ lastPageNumber: pageNb });
            } catch (e) {
                console.error("pageNextAction", e);
            }

            bus.dispatch("page", store.getState().lastPageNumber);
        };

export const searchAction = (search: string) => {

    console.log("search", search);
};
