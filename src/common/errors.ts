export class CodeError extends Error {
    public static fromJson(json: any): CodeError {
        return new CodeError(
            json.code,
            json.message,
        );
    }

    public code: number | string;
    public message: string;

    constructor(code: number | string, message?: string) {
        super(message);
        this.code = code;
        this.message = message;
    }

    public toJson() {
        return {
            class: "CodeError",
            code: this.code,
            message: this.message,
        };
    }
}
