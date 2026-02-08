import {EpubCfiErrorType} from './EpubCfiErrorType.js';

export class EpubCfiError extends Error {
    constructor(type: EpubCfiErrorType) {
        super(type);
    }
}
