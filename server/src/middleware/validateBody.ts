import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { InvalidInputError } from "../errors/applicationErrors";

export const validateBody = (schema: z.ZodType) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            throw new InvalidInputError(result.error.issues[0]?.message);
        }

        req.body = result.data;
        next();
    }
}