import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../errors/applicationErrors";

export const validateBody = (schema: z.ZodType) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const firstError = result.error.issues[0]?.message;
            throw new ValidationError(firstError);
        }

        req.body = result.data;
        next();
    }
}