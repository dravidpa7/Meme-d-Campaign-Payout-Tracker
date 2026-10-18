import type { Campaign } from "../lib/types";

type CampaignCardProps = { campaign: Campaign };
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

function statusClass(status: Campaign["status"]) {
  return `md-status md-status--${status}`;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const budget = Math.max(0, campaign.totalBudget);
  const remaining = Math.max(0, campaign.remainingBudget);
  const spent = Math.max(0, campaign.spent);
  const percentSpent = budget > 0 ? Math.min(100, Math.max(0, (spent / budget) * 100)) : 0;

  return (
    <article className="md-campaign-card">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={statusClass(campaign.status)}>{campaign.status}</span>
            <span className="md-status">{campaign.platform}</span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-[-.04em] sm:text-[22px]">{campaign.name}</h3>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d8ff63] font-mono text-xs font-bold" aria-hidden="true">
          {campaign.platform === "Instagram" ? "IG" : "YT"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-5 px-5 pb-5 sm:grid-cols-4 sm:px-6">
        <div className="md-stat">
          <div className="md-stat-value">{inr.format(budget)}</div>
          <div className="md-stat-label">Total budget</div>
        </div>
        <div className="md-stat">
          <div className="md-stat-value">{inr.format(remaining)}</div>
          <div className="md-stat-label">Remaining</div>
        </div>
        <div className="md-stat">
          <div className="md-stat-value">{inr.format(spent)}</div>
          <div className="md-stat-label">Allocated</div>
        </div>
        <div className="md-stat">
          <div className="md-stat-value">{campaign.milestones.length}</div>
          <div className="md-stat-label">Milestones</div>
        </div>
      </div>

      <div className="border-t border-[#e7e4d8] bg-[#faf9f3] px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold">Budget allocated</span>
          <span className="md-mono text-[#77766d]">{percentSpent.toFixed(0)}%</span>
        </div>
        <div className="md-progress" role="progressbar" aria-label="Budget allocated" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentSpent)}>
          <span style={{ width: `${percentSpent}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="md-eyebrow mr-1">Reward steps</span>
          {campaign.milestones.map((milestone, index) => (
            <span key={`${campaign.id}-${milestone.views}-${index}`} className="rounded-lg border border-[#e7e4d8] bg-[#fffef8] px-2.5 py-1.5 text-[11px] text-[#57564e]">
              <span className="md-mono">{count.format(milestone.views)}</span> views <span className="text-[#aaa89d]">→</span> <strong className="md-mono text-[#28251f]">{inr.format(milestone.payout)}</strong>
            </span>
          ))}
          {campaign.milestones.length === 0 ? <span className="md-hint">No milestones configured.</span> : null}
        </div>
      </div>
    </article>
  );
}
