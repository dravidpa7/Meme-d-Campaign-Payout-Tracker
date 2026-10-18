import {
  DEFAULT_SPIKE_CONFIG,
  detectViewSpike,
  SpikeConfig,
} from '../../../src/domain/spike-detector';
import { DomainError } from '../../../src/domain/domain-error';

const t0 = new Date('2026-10-14T10:00:00.000Z');
const minutesLater = (m: number) => new Date(t0.getTime() + m * 60_000);

describe('detectViewSpike', () => {
  it('flags a huge gain in a short time', () => {
    const r = detectViewSpike({ views: 1_000, at: t0 }, { views: 101_000, at: minutesLater(60) });
    expect(r.flagged).toBe(true);
    expect(r.viewGain).toBe(100_000);
    expect(r.viewsPerHour).toBeCloseTo(100_000);
  });

  it('does not flag organic growth over a long period', () => {
    // 100k views over 48 hours is ~2083/hour
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 100_000, at: minutesLater(48 * 60) });
    expect(r.flagged).toBe(false);
  });

  it('does not flag a small gain even if the rate is high', () => {
    // 1000 views in 1 minute = 60k/hour, but gain is below minViewGain
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 1_000, at: minutesLater(1) });
    expect(r.viewsPerHour).toBeGreaterThan(DEFAULT_SPIKE_CONFIG.maxViewsPerHour);
    expect(r.flagged).toBe(false);
  });

  it('does not flag when the rate equals the threshold exactly (strict >)', () => {
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 20_000, at: minutesLater(60) });
    expect(r.viewsPerHour).toBe(20_000);
    expect(r.flagged).toBe(false);
  });

  it('flags just above the threshold', () => {
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 20_001, at: minutesLater(60) });
    expect(r.flagged).toBe(true);
  });

  it('flags when the gain equals minViewGain and the rate is high', () => {
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 5_000, at: minutesLater(5) });
    expect(r.viewGain).toBe(5_000);
    expect(r.flagged).toBe(true);
  });

  it('does not flag when views stay the same', () => {
    const r = detectViewSpike({ views: 500, at: t0 }, { views: 500, at: minutesLater(10) });
    expect(r).toEqual({ flagged: false, viewGain: 0, viewsPerHour: 0 });
  });

  it('does not flag when views decrease', () => {
    const r = detectViewSpike({ views: 90_000, at: t0 }, { views: 10_000, at: minutesLater(10) });
    expect(r.flagged).toBe(false);
    expect(r.viewGain).toBe(-80_000);
    expect(r.viewsPerHour).toBe(0);
  });

  it('applies the elapsed-time floor for identical timestamps (no divide by zero)', () => {
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 50_000, at: t0 });
    expect(Number.isFinite(r.viewsPerHour)).toBe(true);
    expect(r.flagged).toBe(true);
  });

  it('throws when the current snapshot is older than the previous one', () => {
    expect(() =>
      detectViewSpike({ views: 0, at: minutesLater(10) }, { views: 100, at: t0 }),
    ).toThrow(DomainError);
  });

  it('respects a custom config', () => {
    const strict: SpikeConfig = { minViewGain: 100, maxViewsPerHour: 1_000, minElapsedHours: 1 / 60 };
    const r = detectViewSpike({ views: 0, at: t0 }, { views: 3_000, at: minutesLater(60) }, strict);
    expect(r.flagged).toBe(true);
  });
});
