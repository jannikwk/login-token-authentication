import type { Request, Response } from "express";
import { validateBody } from "../../../src/middleware/validateBody";
import { ValidationError } from "../../../src/errors/AppError";
import { authSchema } from "../../../src/schemas/auth.schema";
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

        validateBody(authSchema)(req, {} as Response, next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({ username: 'alice', password: 'supersecret123' });
    });

    it('throws a ValidationError for an invalid authentication body', () => {
        const req = mockRequest({ username: 'al', password: 'short' });
        const next = vi.fn();

        expect(() => validateBody(authSchema)(req, {} as Response, next))
            .toThrow(new ValidationError('Username must be at least 3 characters'));
        expect(next).not.toHaveBeenCalled();
    });
});