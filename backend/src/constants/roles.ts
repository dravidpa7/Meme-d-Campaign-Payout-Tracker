export const ROLES = { BRAND: 'brand', CREATOR: 'creator' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ROLE_VALUES = Object.values(ROLES) as [Role, ...Role[]];
