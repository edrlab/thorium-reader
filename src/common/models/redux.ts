export interface Action {
    type: string;
    payload?: any;
    meta?: any;
}

export interface ErrorAction extends Action {
    error?: boolean;
}
