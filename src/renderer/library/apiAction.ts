import { apiActionFactory } from "../common/apiAction";
import { diLibraryGet } from "./di";

export const apiAction = apiActionFactory(() => diLibraryGet("store"));
