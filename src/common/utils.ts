import * as request from "request";

export async function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            }

            resolve(body);
        });
    });
}
