import z from "zod";

const MIN_JWT_SECRET_LENGTH = 32;

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    SALT_ROUNDS: z.coerce.number().int().positive().default(12),
    CLIENT_URL: z.url(),
    JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    isProduction: parsedEnv.NODE_ENV === "production",
    port: parsedEnv.PORT,
    saltRounds: parsedEnv.SALT_ROUNDS,
    clientUrl: parsedEnv.CLIENT_URL,
    jwtSecret: parsedEnv.JWT_SECRET,
    jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN_SECONDS,
};