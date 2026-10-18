"use client";

import { useActionState, useRef, useState } from "react";
import { Field } from "./field";
import type { ActionState, FormAction } from "../lib/types";

type CampaignFormProps = { action: FormAction };
type MilestoneDraft = { key: number; views: string; payout: string };
const initialState: ActionState = {};

export function CampaignForm({ action }: CampaignFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ key: 0, views: "", payout: "" }]);
  const nextKey = useRef(1);
  const errors = state.fieldErrors ?? {};
  const completeMilestones = milestones.every((row) => row.views !== "" && row.payout !== "");
  const milestoneOrderInvalid = completeMilestones && milestones.some((row, index) =>
    index > 0 && Number(row.views) <= Number(milestones[index - 1].views),
  );
  const serializedMilestones = JSON.stringify(
    milestones.map(({ views, payout }) => ({ views: Number(views), payout: Number(payout) })),
  );

  function updateMilestone(key: number, field: "views" | "payout", value: string) {
    setMilestones((current) => current.map((row) => row.key === key ? { ...row, [field]: value } : row));
  }

  function addMilestone() {
    if (milestones.length >= 20) return;
    const key = nextKey.current++;
    setMilestones((current) => [...current, { key, views: "", payout: "" }]);
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= milestones.length) return;
    setMilestones((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function removeMilestone(key: number) {
    if (milestones.length === 1) return;
    setMilestones((current) => current.filter((row) => row.key !== key));
  }

  return (
    <form action={formAction} className="grid gap-6" aria-busy={pending}>
      {state.error ? (
        <div className="md-notice md-notice--error" role="alert"><span aria-hidden="true">!</span><span>{state.error}</span></div>
      ) : null}
      {state.message ? (
        <div className="md-notice md-notice--success" role="status"><span aria-hidden="true">✓</span><span>{state.message}</span></div>
      ) : null}

      <Field
        label="Campaign name"
        name="name"
        placeholder="e.g. The little things, loudly"
        required
        error={errors.name?.[0]}
        hint="Give creators a clear, memorable brief title."
      />
      <div className="md-field">
        <label className="md-label" htmlFor="campaign-platform">Platform <span aria-hidden="true">*</span></label>
        <select id="campaign-platform" className="md-select" name="platform" required aria-invalid={Boolean(errors.platform?.[0])} aria-describedby={errors.platform?.[0] ? "campaign-platform-error" : undefined} defaultValue="">
          <option value="" disabled>Choose a platform</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
        </select>
        {errors.platform?.[0] ? <span className="md-error" id="campaign-platform-error">{errors.platform[0]}</span> : null}
      </div>
      <Field
        label="Total campaign budget"
        name="totalBudget"
        type="number"
        placeholder="e.g. 25000"
        required
        error={errors.totalBudget?.[0]}
        hint="In rupees (₹). This is the maximum amount allocated to this campaign."
      />

      <section className="grid gap-3" aria-labelledby="milestones-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 id="milestones-heading" className="md-section-heading">Milestone payouts</h3>
            <p className="md-hint mt-1">Set view thresholds and the rupee reward at each one.</p>
          </div>
          <span className="md-eyebrow">{milestones.length} / 20</span>
        </div>
        <input type="hidden" name="milestones" value={serializedMilestones} />
        {milestones.map((row, index) => {
          const rowError =
            errors[`milestones.${index}.views`]?.[0] ??
            errors[`milestones.${index}.payout`]?.[0];
          const rowErrorDescription = [
            rowError ? `milestone-${row.key}-error` : undefined,
            errors.milestones?.[0] ? "milestones-error" : undefined,
          ].filter(Boolean).join(" ") || undefined;
          return (
          <div className="md-milestone-row" key={row.key}>
            <div className="md-field">
              <label className="md-label" htmlFor={`milestone-views-${row.key}`}>Views at step {index + 1}</label>
              <input
                id={`milestone-views-${row.key}`}
                name={`milestones[${index}].views`}
                className="md-input"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="10,000"
                value={row.views}
                onChange={(event) => updateMilestone(row.key, "views", event.target.value)}
                required
                aria-invalid={Boolean(rowError || errors.milestones?.[0])}
                aria-describedby={rowErrorDescription}
              />
            </div>
            <div className="md-field">
              <label className="md-label" htmlFor={`milestone-payout-${row.key}`}>Reward (₹)</label>
              <input
                id={`milestone-payout-${row.key}`}
                name={`milestones[${index}].payout`}
                className="md-input"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="500"
                value={row.payout}
                onChange={(event) => updateMilestone(row.key, "payout", event.target.value)}
                required
                aria-invalid={Boolean(rowError || errors.milestones?.[0])}
                aria-describedby={rowErrorDescription}
              />
            </div>
            <div className="md-milestone-actions flex items-center gap-1">
              <button className="md-icon-button" type="button" onClick={() => moveMilestone(index, -1)} disabled={index === 0} aria-label={`Move milestone ${index + 1} up`} title="Move up">↑</button>
              <button className="md-icon-button" type="button" onClick={() => moveMilestone(index, 1)} disabled={index === milestones.length - 1} aria-label={`Move milestone ${index + 1} down`} title="Move down">↓</button>
              <button className="md-icon-button" type="button" onClick={() => removeMilestone(row.key)} disabled={milestones.length === 1} aria-label={`Remove milestone ${index + 1}`} title="Remove">×</button>
            </div>
            {rowError ? <span className="md-error col-span-full" id={`milestone-${row.key}-error`} role="alert">{rowError}</span> : null}
          </div>
          );
        })}
        {errors.milestones?.[0] ? <span className="md-error" id="milestones-error" role="alert">{errors.milestones[0]}</span> : null}
        {milestoneOrderInvalid ? (
          <span className="md-error" role="alert">View thresholds must increase from one milestone to the next.</span>
        ) : null}
        <button type="button" className="md-button md-button--subtle w-full" onClick={addMilestone} disabled={milestones.length >= 20}>
          <span aria-hidden="true">+</span> Add a milestone
        </button>
      </section>

      <div className="rounded-xl bg-[#f2f0e6] px-4 py-3 text-xs leading-relaxed text-[#77766d]">
        Milestones are submitted in the order shown. Keep view thresholds ascending so creators can see the path to each payout.
      </div>
      <button className="md-button md-button--lime w-full" type="submit" disabled={pending || milestoneOrderInvalid}>
        {pending ? "Publishing campaign…" : "Create campaign"}
        {!pending ? <span aria-hidden="true">↗</span> : null}
      </button>
    </form>
  );
}
