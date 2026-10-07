import jwt from "jsonwebtoken";
import { User } from "../types/user.types";
import { env } from "../config/env";
import { AuthenticationError } from "../errors/AppError";

export type JWTPayload = {
    sub: string;
    username: string;
};

export const signToken = (user: User) => {
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
            throw new AuthenticationError("Invalid token payload");
        }

        return payload as JWTPayload;
    } catch {
        throw new AuthenticationError("Invalid or expired token");
    }
}