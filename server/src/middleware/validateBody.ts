import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { ApplicationError } from "../errors/applicationErrors";
import { InvalidInputError } from "../errors/applicationErrors";

type ValidationErrorFactory = (message?: string) => ApplicationError;

const createInvalidInputError: ValidationErrorFactory =
    (message) => new InvalidInputError(message);

export const validateBody = (
    schema: z.ZodType,
    createValidationError: ValidationErrorFactory = createInvalidInputError,
) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            throw createValidationError(result.error.issues[0]?.message);
        }

        req.body = result.data;
        next();
    };
};