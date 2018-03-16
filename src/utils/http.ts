import * as request from "request";

export function requestGet(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestOptions = Object.assign(
            {},
            { url },
            { headers: {
                "User-Agent": "readium-desktop",
                },
            },
            options,
        );

        request(requestOptions, (error: any, response: any, body: any) => {
            if (error) {
                return reject(error);
            }

            return resolve({
                response,
                body,
            });
        });
    });
}
