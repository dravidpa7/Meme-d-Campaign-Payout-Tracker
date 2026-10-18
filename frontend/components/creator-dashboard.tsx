'use client';
import { useMemo, useState } from 'react';
import { formatRupees } from '@/lib/format';
import { safeHref } from '@/lib/sanitize';
import type { Campaign, Earnings, Submission } from '@/lib/types';
import { CampaignCard } from './campaign-card';
import { SubmitPostForm } from './submit-post-form';

interface Props { campaigns: Campaign[]; submissions: Submission[]; earnings: Earnings }

export function CreatorDashboard({ campaigns, submissions, earnings }: Props) {
  const [selectedId, setSelectedId] = useState<string>();

  // Sorting a list on every keystroke-triggered render is what useMemo is for.
  const sorted = useMemo(() => [...campaigns].sort((a, b) => b.remainingBudget - a.remainingBudget), [campaigns]);
  const selected = useMemo(() => sorted.find((c) => c.id === selectedId), [sorted, selectedId]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Live campaigns</h2>
        <ul className="flex flex-col gap-2">
          {sorted.map((c) => (
            // setSelectedId is referentially stable, so memo on the card actually works.
            <CampaignCard key={c.id} campaign={c} selected={c.id === selectedId} onSelect={setSelectedId} />
          ))}
        </ul>
        {selected && <SubmitPostForm key={selected.id} campaign={selected} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Earnings: {formatRupees(earnings.totalEarnings)} ({earnings.payoutCount} payouts)
        </h2>
        <ul className="flex flex-col gap-2">
          {submissions.map((s) => {
            const href = safeHref(s.postUrl);
            return (
              <li key={s.id} className="rounded border p-3 text-sm">
                <strong>{s.campaignName}</strong>{s.flagged && ' ⚠'}
                <div className="truncate">
                  {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.postUrl}</a> : s.postUrl}
                </div>
                <div>
                  {s.views.toLocaleString('en-IN')} views · paid {formatRupees(s.allocatedPayout)} of {formatRupees(s.eligiblePayout)}
                  {s.allocatedPayout < s.eligiblePayout && ' (partial, budget ran out)'}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}