import { z } from 'zod';

export const CredentialsSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must not exceed 30 characters'),
    
    password: z
        .string()
        .min(10, 'Password must be at least 10 characters')
        .max(72, 'Password must not exceed 72 characters')
        .refine((password: string) => password.trim().length > 0, 'Password cannot be blank')

});

export const StoredUserSchema = CredentialsSchema
    .omit({ password: true })
    .extend({
        id: z.uuid({ version: 'v7'}),
        passwordHash: z.string()
    });

export const PublicUserSchema = StoredUserSchema.omit({ passwordHash: true });

export type Credentials = z.infer<typeof CredentialsSchema>;
export type StoredUser = z.infer<typeof StoredUserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;