"use client";

import { useMemo } from "react";
import type { Campaign, Earnings, Submission } from "../lib/types";
import { CampaignCard } from "./campaign-card";
import { SubmitPostForm } from "./submit-post-form";
import type { FormAction } from "../lib/types";

type CreatorDashboardProps = {
  campaigns: Campaign[];
  submissions: Submission[];
  earnings: Earnings;
  action?: FormAction;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-IN");

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "date unavailable"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function CreatorDashboard({ campaigns, submissions, earnings, action }: CreatorDashboardProps) {
  const summary = useMemo(() => {
    const liveCampaigns = campaigns.filter((campaign) => campaign.status === "live");
    const allocated = submissions.reduce((total, submission) => total + submission.allocatedPayout, 0);
    const flaggedCount = submissions.reduce((total, submission) => total + Number(submission.flagged), 0);
    return {
      liveCampaigns,
      allocated,
      flaggedCount,
      submissionCount: submissions.length,
    };
  }, [campaigns, submissions]);

  const submissionCampaigns = useMemo(
    () => new Map(campaigns.map((campaign) => [campaign.id, campaign.name])),
    [campaigns],
  );

  return (
    <main className="md-shell">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
        <div>
          <span className="md-eyebrow">Creator studio / Overview</span>
          <h1 className="md-page-title">Your next big<br className="sm:hidden" /> moment.</h1>
          <p className="md-page-intro">Browse live briefs, share your posts, and keep an eye on what you’ve earned.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e7e4d8] bg-[#fffef8] px-3 py-2 text-xs font-bold text-[#57564e]">
          <span className="h-2 w-2 rounded-full bg-[#9ec647]" aria-hidden="true" /> Creator account
        </span>
      </header>

      <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Your performance">
        <div className="md-panel col-span-2 flex min-h-[142px] flex-col justify-between bg-[#d8ff63] p-5 sm:p-6">
          <span className="md-eyebrow text-[#52642c]">Lifetime earnings</span>
          <div className="font-display text-[34px] font-bold tracking-[-.06em] sm:text-[42px]">{inr.format(earnings.totalEarnings)}</div>
          <span className="text-xs font-semibold text-[#52642c]">Rupees earned from your posts</span>
        </div>
        <div className="md-panel flex min-h-[142px] flex-col justify-between p-5 sm:p-6">
          <span className="md-eyebrow">Payouts</span>
          <div className="font-display text-3xl font-bold tracking-[-.05em]">{count.format(earnings.payoutCount)}</div>
          <span className="text-xs text-[#77766d]">Milestones reached</span>
        </div>
        <div className="md-panel flex min-h-[142px] flex-col justify-between p-5 sm:p-6">
          <span className="md-eyebrow">Allocated</span>
          <div className="font-display text-3xl font-bold tracking-[-.05em]">{inr.format(summary.allocated)}</div>
          <span className="text-xs text-[#77766d]">Across {summary.submissionCount} submitted {summary.submissionCount === 1 ? "post" : "posts"}</span>
        </div>
      </section>

      <section className="mb-11" aria-labelledby="live-campaigns-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="md-eyebrow">Pick a brief. Make it yours.</span>
            <h2 id="live-campaigns-title" className="md-section-heading mt-1">Live campaigns</h2>
          </div>
          <span className="md-status md-status--live">{summary.liveCampaigns.length} open</span>
        </div>
        {campaigns.length === 0 ? (
          <div className="md-panel md-empty">
            <span className="md-empty-mark" aria-hidden="true">…</span>
            <h3 className="mt-4 font-display text-lg font-bold tracking-[-.03em]">The feed is taking a breath.</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#77766d]">There aren’t any campaigns here yet. New briefs will show up here when they’re ready for creators.</p>
          </div>
        ) : summary.liveCampaigns.length === 0 ? (
          <div className="md-panel md-empty">
            <span className="md-empty-mark" aria-hidden="true">↻</span>
            <h3 className="mt-4 font-display text-lg font-bold tracking-[-.03em]">No live briefs at the moment.</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#77766d]">These campaigns have closed or paused. Check back for the next opportunity.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {summary.liveCampaigns.map((campaign) => <CampaignCard campaign={campaign} key={campaign.id} />)}
          </div>
        )}
      </section>

      <section className="mb-11 grid gap-6 lg:grid-cols-[1fr_.78fr]">
        <div>
          <div className="mb-4">
            <span className="md-eyebrow">Your posts, in one place</span>
            <h2 className="md-section-heading mt-1">Submissions</h2>
          </div>
          <div className="md-panel px-5 py-1 sm:px-6">
            {submissions.length === 0 ? (
              <div className="md-empty px-0">
                <span className="md-empty-mark" aria-hidden="true">↗</span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-[-.03em]">Your first post is waiting.</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#77766d]">Submit a public post link after joining a live campaign. Your view count and allocated payout will appear here.</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <article className="md-submission-row" key={submission.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-bold">{submission.campaignName ?? submissionCampaigns.get(submission.campaignId) ?? "Campaign post"}</p>
                      <a className="md-link block max-w-[360px]" href={submission.postUrl} target="_blank" rel="noreferrer" aria-label={`Open submitted post for ${submission.campaignName ?? "campaign"} in a new tab`}>
                        {submission.postUrl}
                      </a>
                    </div>
                    <span className={submission.flagged ? "md-status md-status--paused" : "md-status md-status--live"}>
                      {submission.flagged ? "Needs review" : "Tracking"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <div className="md-mono text-sm font-medium">{count.format(submission.views)}</div>
                      <div className="mt-1 text-[11px] text-[#77766d]">Views</div>
                    </div>
                    <div>
                      <div className="md-mono text-sm font-medium">{inr.format(submission.eligiblePayout)}</div>
                      <div className="mt-1 text-[11px] text-[#77766d]">Eligible</div>
                    </div>
                    <div>
                      <div className="md-mono text-sm font-bold">{inr.format(submission.allocatedPayout)}</div>
                      <div className="mt-1 text-[11px] text-[#77766d]">Allocated</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-[#8a887e]">
                    Views updated {formatUpdatedAt(submission.viewsUpdatedAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="md-panel h-fit p-5 sm:p-6" aria-labelledby="submit-post-title">
          <span className="md-eyebrow">Made something good?</span>
          <h2 id="submit-post-title" className="md-section-heading mt-1 mb-2">Submit a post</h2>
          <p className="mb-5 text-sm leading-relaxed text-[#77766d]">Share the public link to your campaign post. We’ll track the views against its milestones.</p>
          {action ? (
            <SubmitPostForm campaigns={campaigns} action={action} />
          ) : (
            <div className="md-notice md-notice--info" role="status">
              <span aria-hidden="true">i</span>
              <span>Post submission is unavailable in this view.</span>
            </div>
          )}
          {summary.flaggedCount > 0 ? (
            <p className="mt-4 text-xs leading-relaxed text-[#77766d]">
              {summary.flaggedCount} {summary.flaggedCount === 1 ? "post needs" : "posts need"} a review. Its allocated reward stays visible in your submission list.
            </p>
          ) : null}
        </aside>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e4d8] pt-5 text-[11px] text-[#89877d]">
        <span>MemeD · Make culture count.</span>
        <span className="md-mono">Rupees are shown in INR</span>
      </footer>
    </main>
  );
}
