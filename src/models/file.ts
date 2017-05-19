/**
 * file: epub, mobi, jpeg
 */
export interface File {
    url: string; // Remote or local url
    ext: string; // Extension without the starting dot character
    contentType: string;
    size?: number; // In bytes
}
