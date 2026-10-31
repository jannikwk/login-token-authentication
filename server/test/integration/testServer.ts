import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../../src/app';

export type Credentials = {
    username: string;
    password: string;
};

type RunningServer = {
    server: Server;
    baseUrl: string;
};

export const startTestServer = async (): Promise<RunningServer> => {
    const app = createApp();
    const server = app.listen(0, '127.0.0.1');

    await new Promise<void>((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
        await stopTestServer(server);
        throw new Error('Test server did not expose a TCP address');
    }

    const { port } = address as AddressInfo;
    return { server, baseUrl: `http://127.0.0.1:${port}` };
};

export const stopTestServer = async (server: Server): Promise<void> => {
    if (!server.listening) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
};

export const uniqueCredentials = (): Credentials => ({
    username: `user-${crypto.randomUUID().slice(0, 12)}`,
    password: 'secure-password-123',
});

export const jsonRequest = (
    baseUrl: string,
    path: string,
    init: RequestInit = {},
) => fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
        'content-type': 'application/json',
        ...init.headers,
    },
});

export const cookieFrom = (response: Response): string => {
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
        throw new Error('Expected response to set a cookie');
    }

    const [cookie] = setCookie.split(';');
    if (!cookie) {
        throw new Error('Expected a valid cookie');
    }

    return cookie;
};

export const cookieHeader = (cookie: string): Record<string, string> => ({
    cookie,
});
