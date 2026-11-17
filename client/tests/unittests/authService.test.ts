import type { Credentials, PublicUser } from "@app/shared";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();
const create = vi.fn(() => ({ post, get }));

vi.mock("axios", () => ({
    default: { create },
}));

const credentials: Credentials = {
    username: "alice",
    password: "a-secure-password",
};

const publicUser: PublicUser = {
    id: "0192c9f4-0000-7000-8000-000000000000",
    username: credentials.username,
};

describe("authService", () => {
    let authService: typeof import("../../app/services/authService");

    beforeAll(async () => {
        vi.stubEnv("VITE_API_URL", "http://localhost:3000");
        authService = await import("../../app/services/authService");
    });

    beforeEach(() => {
        post.mockClear();
        get.mockClear();
    });

    it("creates an Axios client with the API URL and credentials enabled", () => {
        expect(create).toHaveBeenCalledWith({
            baseURL: "http://localhost:3000",
            withCredentials: true,
        });
    });

    it("logs in and returns the public user", async () => {
        post.mockResolvedValueOnce({ data: publicUser });

        await expect(authService.login(credentials)).resolves.toEqual(publicUser);

        expect(post).toHaveBeenCalledWith(
            "http://localhost:3000/api/auth/login",
            credentials,
        );
    });

    it("does not send extra runtime fields to the API", async () => {
        post.mockResolvedValueOnce({ data: publicUser });

        await authService.login({
            ...credentials,
            unexpected: "must not be sent",
        } as Credentials & { unexpected: string });

        expect(post).toHaveBeenCalledWith(
            "http://localhost:3000/api/auth/login",
            credentials,
        );
    });

    it("registers and returns the public user", async () => {
        post.mockResolvedValueOnce({ data: publicUser });

        await expect(authService.register(credentials)).resolves.toEqual(publicUser);

        expect(post).toHaveBeenCalledWith(
            "http://localhost:3000/api/auth/register",
            credentials,
        );
    });

    it("gets the current user", async () => {
        get.mockResolvedValueOnce({ data: publicUser });

        await expect(authService.getCurrentUser()).resolves.toEqual(publicUser);

        expect(get).toHaveBeenCalledWith("http://localhost:3000/api/auth/me");
    });

    it("propagates API errors from login", async () => {
        const apiError = new Error("Request failed");
        post.mockRejectedValueOnce(apiError);

        await expect(authService.login(credentials)).rejects.toBe(apiError);
    });

    it("logs out without returning a value", async () => {
        post.mockResolvedValueOnce({ data: undefined });

        await expect(authService.logout()).resolves.toBeUndefined();

        expect(post).toHaveBeenCalledWith("http://localhost:3000/api/auth/logout");
    });

    it("propagates API errors from logout", async () => {
        const apiError = new Error("Request failed");
        post.mockRejectedValueOnce(apiError);

        await expect(authService.logout()).rejects.toBe(apiError);
    });
});