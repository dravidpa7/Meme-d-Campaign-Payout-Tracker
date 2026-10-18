import { DomainError } from './domain-error';

export interface ViewSnapshot {
  views: number;
  at: Date;
}

export interface SpikeConfig {
  /** Ignore tiny jumps: gain must be at least this many views to be suspicious. */
  minViewGain: number;
  /** Flag when growth rate is strictly above this many views per hour. */
  maxViewsPerHour: number;
  /** Floor for elapsed time (hours) so near-simultaneous updates don't divide by ~0. */
  minElapsedHours: number;
}

export const DEFAULT_SPIKE_CONFIG: SpikeConfig = {
  minViewGain: 5_000,
  maxViewsPerHour: 20_000,
  minElapsedHours: 1 / 60, // one minute
};

export interface SpikeResult {
  flagged: boolean;
  viewGain: number;
  viewsPerHour: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Flags a view-count update that grew unusually fast between two snapshots.
 * Flagged only when BOTH the absolute gain and the hourly rate are high,
 * which avoids false positives on small posts. Views going down never flag.
 */
export function detectViewSpike(
  previous: ViewSnapshot,
  current: ViewSnapshot,
  config: SpikeConfig = DEFAULT_SPIKE_CONFIG,
): SpikeResult {
  if (current.at.getTime() < previous.at.getTime()) {
    throw new DomainError('INVALID_TIMESTAMPS', 'Current snapshot cannot be older than the previous one');
  }

  const viewGain = current.views - previous.views;
  if (viewGain <= 0) {
    return { flagged: false, viewGain, viewsPerHour: 0 };
  }

  const elapsedHours = Math.max(
    (current.at.getTime() - previous.at.getTime()) / MS_PER_HOUR,
    config.minElapsedHours,
  );
  const viewsPerHour = viewGain / elapsedHours;

  return {
    flagged: viewGain >= config.minViewGain && viewsPerHour > config.maxViewsPerHour,
    viewGain,
    viewsPerHour,
  };
}
