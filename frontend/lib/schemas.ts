import { z } from 'zod';
import { cleanText, sanitizePostUrl } from './sanitize';

const text = (min: number, max: number) =>
  z.string().transform(cleanText).pipe(z.string().min(min).max(max));

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const positiveInt = z.coerce.number().int().positive().max(1_000_000_000);

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

export const signupSchema = z.object({
  name: text(2, 60),
  email,
  password: z.string().min(8).max(72), // bcrypt ignores bytes past 72
  role: z.enum(['brand', 'creator']),
});

export const campaignSchema = z.object({
  name: text(2, 100),
  platform: z.enum(['Instagram', 'YouTube']),
  totalBudget: positiveInt,
  milestones: z.array(z.object({ views: positiveInt, payout: positiveInt })).min(1).max(20),
});

export const submitPostSchema = z.object({
  campaignId: objectId,
  postUrl: z.string().max(500).transform((v, ctx) => {
    const safe = sanitizePostUrl(v);
    if (!safe) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid https Instagram or YouTube link' });
      return z.NEVER;
    }
    return safe;
  }),
});

/** Textarea lines like "10000:500" -> [{views, payout}] (validated by campaignSchema). */
export function parseMilestones(raw: string) {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const [views, payout] = line.split(/[:,\s]+/);
      return { views: Number(views), payout: Number(payout) };
    });
}