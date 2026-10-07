import { z } from 'zod';

export const authSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must not exceed 30 characters'),
    
    password: z
        .string()
        .min(10, 'Password must be at least 10 characters')
        .max(72, 'Password must not exceed 72 characters')
        .refine(password => password.trim().length > 0, 'Password cannot be blank')

});

export type AuthRequest = z.infer<typeof authSchema>;
