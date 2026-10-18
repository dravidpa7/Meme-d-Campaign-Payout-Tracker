'use client';
import { useActionState } from 'react';
import { createCampaign } from '@/actions/campaigns';
import { Field } from './field';

export function CampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, undefined);
  const fe = state?.fieldErrors;

  return (
    <form action={action} className="flex max-w-md flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">New campaign</h2>
      <Field label="Name" name="name" required minLength={2} maxLength={100} error={fe?.['name']} />
      <label className="flex flex-col gap-1 text-sm">
        Platform
        <select name="platform" className="rounded border px-3 py-2">
          <option>Instagram</option>
          <option>YouTube</option>
        </select>
      </label>
      <Field label="Total budget (₹)" name="totalBudget" type="number" min={1} step={1} required inputMode="numeric" error={fe?.['totalBudget']} />
      <label className="flex flex-col gap-1 text-sm">
        Milestones (one per line, views:payout)
        <textarea
          name="milestones" rows={4} required maxLength={600}
          defaultValue={'10000:500\n50000:2000\n100000:5000'}
          className="rounded border px-3 py-2 font-mono"
        />
        {fe?.['milestones']?.[0] && <span role="alert" className="text-red-600">{fe['milestones'][0]}</span>}
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
        {pending ? 'Creating…' : 'Create campaign'}
      </button>
    </form>
  );
}