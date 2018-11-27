export class BaseError {
    public message: string;

    constructor(message: string) {
        this.message = message;
    }
}

export class NotFoundError extends BaseError { }
