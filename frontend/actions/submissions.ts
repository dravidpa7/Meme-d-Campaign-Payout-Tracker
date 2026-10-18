'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { api, errorMessage } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { submitPostSchema } from '@/lib/schemas';
import type { FormState } from './auth';

export async function submitPost(_: FormState, fd: FormData): Promise<FormState> {
  await requireRole('creator');

  const parsed = submitPostSchema.safeParse({ campaignId: fd.get('campaignId'), postUrl: fd.get('postUrl') });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  try {
    await api('/submissions', { method: 'POST', body: parsed.data }); // backend re-checks host vs platform
  } catch (e) {
    return { error: errorMessage(e) };
  }
  revalidatePath('/creator');
  return { success: 'Post submitted' };
}