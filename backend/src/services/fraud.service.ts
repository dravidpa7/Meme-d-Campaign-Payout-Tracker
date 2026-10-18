import {
  DEFAULT_SPIKE_CONFIG,
  SpikeResult,
  ViewSnapshot,
  detectViewSpike,
} from '../domain/spike-detector';

export const fraudService = {
  /** Wraps the pure spike detector with the app's configured thresholds. */
  evaluate(previous: ViewSnapshot, current: ViewSnapshot): SpikeResult {
    return detectViewSpike(previous, current, DEFAULT_SPIKE_CONFIG);
  },
};
