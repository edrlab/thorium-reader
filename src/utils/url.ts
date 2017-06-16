export function encodeURIComponent_RFC3986(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c: string) => {
            return "%" + c.charCodeAt(0).toString(16);
        });
}
