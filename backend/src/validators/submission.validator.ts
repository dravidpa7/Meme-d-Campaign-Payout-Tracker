import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const submitPostSchema = z.object({
  campaignId: objectId,
  postUrl: z.url({ protocol: /^https?$/ }).max(500),
});

export const updateViewsParamsSchema = z.object({ id: objectId });
export const updateViewsBodySchema = z.object({ views: z.number().int().min(0) });

export type SubmitPostBody = z.infer<typeof submitPostSchema>;
export type UpdateViewsBody = z.infer<typeof updateViewsBodySchema>;
