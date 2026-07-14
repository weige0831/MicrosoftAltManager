/*
Copyright (C) 2023-2026 QuantumNous
*/
import { t } from 'i18next'

export const ROLE = {
  GUEST: 0,
  USER: 1,
  ADMIN: 10,
  SUPER_ADMIN: 100, // Root
} as const

export type RoleValue = (typeof ROLE)[keyof typeof ROLE]

const DEFAULT_ROLE = ROLE.GUEST

// new-api user list uses "Root" for 100; Super Admin kept as generic power label elsewhere
const ROLE_LABEL_KEYS: Record<RoleValue, string> = {
  [ROLE.SUPER_ADMIN]: 'Root',
  [ROLE.ADMIN]: 'Admin',
  [ROLE.USER]: 'User',
  [ROLE.GUEST]: 'Guest',
}

export function getRoleLabelKey(role?: number): string {
  return ROLE_LABEL_KEYS[role as RoleValue] ?? ROLE_LABEL_KEYS[DEFAULT_ROLE]
}

export function getRoleLabel(role?: number): string {
  return t(getRoleLabelKey(role))
}

export function isRoot(role?: number): boolean {
  return (role ?? 0) >= ROLE.SUPER_ADMIN
}

export function isAdmin(role?: number): boolean {
  return (role ?? 0) >= ROLE.ADMIN
}
