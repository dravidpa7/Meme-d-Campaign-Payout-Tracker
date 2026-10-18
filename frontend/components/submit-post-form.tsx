"use client";

import { useActionState } from "react";
import type { ActionState, Campaign, FormAction } from "../lib/types";
import { Field } from "./field";

type SubmitPostFormProps = { campaigns: Campaign[]; action: FormAction };
const initialState: ActionState = {};

export function SubmitPostForm({ campaigns, action }: SubmitPostFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const eligibleCampaigns = campaigns.filter((campaign) => campaign.status === "live");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4" aria-busy={pending}>
      {state.error ? <div className="md-notice md-notice--error" role="alert"><span aria-hidden="true">!</span><span>{state.error}</span></div> : null}
      {state.message ? <div className="md-notice md-notice--success" role="status"><span aria-hidden="true">✓</span><span>{state.message}</span></div> : null}
      {eligibleCampaigns.length > 0 ? (
        <>
          <div className="md-field">
            <label htmlFor="submission-campaign" className="md-label">Campaign <span aria-hidden="true">*</span></label>
            <select id="submission-campaign" className="md-select" name="campaignId" required defaultValue="" aria-invalid={Boolean(errors.campaignId?.[0])} aria-describedby={errors.campaignId?.[0] ? "submission-campaign-error" : undefined}>
              <option value="" disabled>Choose a live campaign</option>
              {eligibleCampaigns.map((campaign) => (
                <option value={campaign.id} key={campaign.id}>{campaign.name} · {campaign.platform}</option>
              ))}
            </select>
            {errors.campaignId?.[0] ? <span className="md-error" id="submission-campaign-error">{errors.campaignId[0]}</span> : null}
          </div>
          <Field
            label="Link to your post"
            name="postUrl"
            type="url"
            placeholder="https://www.instagram.com/…"
            required
            error={errors.postUrl?.[0]}
            hint="Paste the public URL to the post you made for this campaign."
          />
          <button className="md-button md-button--lime w-full" type="submit" disabled={pending}>
            {pending ? "Sending your post…" : "Submit post"}
            {!pending ? <span aria-hidden="true">↗</span> : null}
          </button>
        </>
      ) : (
        <div className="md-notice md-notice--info" role="status">
          <span aria-hidden="true">i</span>
          <span>There are no live campaigns to submit to right now. Check back when a new brief goes live.</span>
        </div>
      )}
    </form>
  );
}
