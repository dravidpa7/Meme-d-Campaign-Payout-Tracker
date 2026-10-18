import 'server-only';
import { z } from 'zod';

export const env = z.object({ API_URL: z.url() }).parse({ API_URL: process.env.API_URL });