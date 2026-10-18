import { z } from 'zod';
import { ROLE_VALUES } from '../constants/roles';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password: z.string().min(8).max(72), // bcrypt ignores bytes beyond 72
  role: z.enum(ROLE_VALUES),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export type SignupBody = z.infer<typeof signupSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
