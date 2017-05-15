declare module "*.json" {
    const value: any;
    export default value;
}

// support NodeJS modules without type definitions
declare module "*";
