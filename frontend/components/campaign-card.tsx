import { memo } from 'react';
import { formatRupees } from '@/lib/format';
import type { Campaign } from '@/lib/types';

interface Props {
  campaign: Campaign;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const CampaignCard = memo(function CampaignCard({ campaign: c, selected, onSelect }: Props) {
  return (
    <li className={`rounded border p-3 ${selected ? 'border-black' : ''}`}>
      <div className="flex justify-between">
        <strong>{c.name}</strong>
        <span className="text-sm">{c.platform}</span>
      </div>
      <p className="text-sm">{formatRupees(c.remainingBudget)} left of {formatRupees(c.totalBudget)}</p>
      <p className="text-xs text-gray-600">
        {c.milestones.map((m) => `${m.views.toLocaleString('en-IN')} → ${formatRupees(m.payout)}`).join(' · ')}
      </p>
      <button onClick={() => onSelect(c.id)} className="mt-2 text-sm underline">
        {selected ? 'Selected' : 'Submit a post'}
      </button>
    </li>
  );
});