export interface Action {
    type: string;
    payload?: any;
}

export interface ErrorAction extends Action {
    error?: boolean;
}
