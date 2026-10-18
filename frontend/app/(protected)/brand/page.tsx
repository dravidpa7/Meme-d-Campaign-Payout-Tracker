import { CampaignForm } from '@/components/campaign-form';
import { api } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { formatRupees } from '@/lib/format';
import type { Campaign } from '@/lib/types';

export default async function BrandPage() {
  await requireRole('brand');
  const campaigns = await api<Campaign[]>('/campaigns/mine');

  return (
    <div className="flex flex-col gap-8">
      <CampaignForm />
      <table className="w-full text-left text-sm">
        <thead>
          <tr><th>Campaign</th><th>Platform</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-t">
              <td>{c.name}</td><td>{c.platform}</td>
              <td>{formatRupees(c.totalBudget)}</td><td>{formatRupees(c.spent)}</td>
              <td>{formatRupees(c.remainingBudget)}</td><td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}