/**
 * Role slug constants
 */
export const ROLES = {
  ADMIN: 'Admin',
  USER: 'Employee',
  CLIENT: 'Employer',
  SUPPORT: 'Support',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];
