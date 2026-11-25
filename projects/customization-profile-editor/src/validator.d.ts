declare module "#profile-editor/validator" {
    import type { ValidateFunction } from "ajv";
    const validate: ValidateFunction<Record<string, unknown>>;
    export default validate;
}
