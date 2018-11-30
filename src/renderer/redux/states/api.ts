import { ApiAction } from "readium-desktop/common/redux/actions/api";

interface PageState<T> {
    totalCount: number;
    page: number;
    items: T[];
}

export interface ApiDataResponse<T> {
    result: (T | PageState<T>);
    date: number;
    requestId: string;
    module: string;
    methodId: string;
}

export interface ApiDataState {
    [id: string]: ApiDataResponse<any>;
}

export interface ApiLastSuccess {
    action: ApiAction;
    date: number;
}

export interface ApiState {
    lastSuccess: ApiLastSuccess;
    data: ApiDataState;
}
