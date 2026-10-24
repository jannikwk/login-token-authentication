import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { InvalidTokenError } from "../errors/applicationErrors";
import { PublicUser } from "@app/shared";

export type JWTPayload = {
    sub: string;
    username: string;
};

export const signToken = (user: PublicUser) => {
    return jwt.sign(
        { username: user.username },
        env.jwtSecret,
        { subject: user.id, expiresIn: env.jwtExpiresIn }
    );
};

export const verifyToken = (token: string): JWTPayload => {
    try {
        const payload = jwt.verify(token, env.jwtSecret);

        if (typeof payload === "string" || typeof payload.sub !== "string" || payload.sub.trim() === "" ||
            typeof payload.username !== 'string' || payload.username.trim() === '') {
            throw new InvalidTokenError();
        }

        return payload as JWTPayload;
    } catch {
        throw new InvalidTokenError();
    }
}