export const CAMPAIGN_STATUS = { LIVE: 'live', CLOSED: 'closed' } as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];
export const CAMPAIGN_STATUS_VALUES = Object.values(CAMPAIGN_STATUS) as [CampaignStatus, ...CampaignStatus[]];
