import type { Role } from "@/types/api";

export function canViewDashboard(role: string): boolean {
  return role === "viewer" || role === "analyst" || role === "admin";
}

export function canReadRecords(role: string): boolean {
  return role === "analyst" || role === "admin";
}

export function canWriteRecords(role: string): boolean {
  return role === "admin";
}

export function canViewInsights(role: string): boolean {
  return role === "analyst" || role === "admin";
}

export function canManageUsers(role: string): boolean {
  return role === "admin";
}

export function isRole(r: string): r is Role {
  return r === "viewer" || r === "analyst" || r === "admin";
}
