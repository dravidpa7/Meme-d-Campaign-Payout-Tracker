import { CreatorDashboard } from '@/components/creator-dashboard';
import { api } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import type { Campaign, Earnings, Submission } from '@/lib/types';

export default async function CreatorPage() {
  await requireRole('creator');
  const [campaigns, submissions, earnings] = await Promise.all([
    api<Campaign[]>('/campaigns'),
    api<Submission[]>('/submissions/mine'),
    api<Earnings>('/earnings/me'),
  ]);
  return <CreatorDashboard campaigns={campaigns} submissions={submissions} earnings={earnings} />;
}