'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { api, errorMessage } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { campaignSchema, parseMilestones } from '@/lib/schemas';
import type { FormState } from './auth';

export async function createCampaign(_: FormState, fd: FormData): Promise<FormState> {
  await requireRole('brand');

  const parsed = campaignSchema.safeParse({
    name: fd.get('name'),
    platform: fd.get('platform'),
    totalBudget: fd.get('totalBudget'),
    milestones: parseMilestones(String(fd.get('milestones') ?? '')),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  try {
    await api('/campaigns', { method: 'POST', body: parsed.data });
  } catch (e) {
    return { error: errorMessage(e) }; // e.g. "Milestone payouts must strictly increase"
  }
  revalidatePath('/brand');
  return { success: 'Campaign created' };
}