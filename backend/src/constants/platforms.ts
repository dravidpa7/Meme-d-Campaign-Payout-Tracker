export const PLATFORMS = { INSTAGRAM: 'Instagram', YOUTUBE: 'YouTube' } as const;
export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];
export const PLATFORM_VALUES = Object.values(PLATFORMS) as [Platform, ...Platform[]];

/** Hostnames a post URL may use for each platform. */
export const PLATFORM_HOSTS: Record<Platform, readonly string[]> = {
  Instagram: ['instagram.com', 'www.instagram.com'],
  YouTube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
};
