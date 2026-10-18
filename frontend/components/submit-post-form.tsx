'use client';
import { useActionState, useState } from 'react';
import { submitPost } from '@/actions/submissions';
import { sanitizePostUrl } from '@/lib/sanitize';
import type { Campaign } from '@/lib/types';
import { Field } from './field';

export function SubmitPostForm({ campaign }: { campaign: Campaign }) {
  const [state, action, pending] = useActionState(submitPost, undefined);
  const [url, setUrl] = useState('');
  // Instant UX hint only; the server action and backend re-validate. Cheap, so not memoised.
  const hint = url && !sanitizePostUrl(url, campaign.platform) ? `Must be an https ${campaign.platform} link` : undefined;

  return (
    <form action={action} className="flex max-w-md flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">Submit to “{campaign.name}”</h2>
      <input type="hidden" name="campaignId" value={campaign.id} />
      <Field
        label={`${campaign.platform} post URL`} name="postUrl" type="url" required maxLength={500}
        value={url} onChange={(e) => setUrl(e.target.value)}
        error={hint ? [hint] : state?.fieldErrors?.['postUrl']}
      />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button disabled={pending || !!hint} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
        {pending ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}