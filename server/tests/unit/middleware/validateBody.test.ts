import type { Request, Response } from "express";
import { validateBody } from "../../../src/middleware/validateBody";
import { InvalidInputError } from "../../../src/errors/applicationErrors";
import { CredentialsSchema } from "@app/shared";
import { describe, expect, it, vi } from "vitest";

describe('validateBody middleware', () => {
    const mockRequest = (body: unknown): Request => {
        return {
            body,
            headers: {},
            method: 'POST',
        } as Partial<Request> as Request;
    };

    it('allows a valid authentication body and calls next', () => {
        const req = mockRequest({ username: 'alice', password: 'supersecret123' });
        const next = vi.fn();

        validateBody(CredentialsSchema)(req, {} as Response, next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({ username: 'alice', password: 'supersecret123' });
    });

    it('throws an InvalidInputError for an invalid authentication body', () => {
        const req = mockRequest({ username: 'al', password: 'short' });
        const next = vi.fn();

        expect(() => validateBody(CredentialsSchema)(req, {} as Response, next))
            .toThrow(new InvalidInputError('Username must be at least 3 characters'));
        expect(next).not.toHaveBeenCalled();
    });
});