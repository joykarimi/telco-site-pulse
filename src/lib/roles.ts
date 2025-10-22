export type UserRole = "admin" | "maintenance_manager" | "operations_manager" | "user" | "viewer";

export const ROLES = {
  ADMIN: "admin",
  OPERATIONS_MANAGER: "operations_manager",
  MAINTENANCE_MANAGER: "maintenance_manager",
  USER: "user",
  VIEWER: "viewer",
};

export const PERMISSIONS = {
  // Site Permissions
  SITE_CREATE: "site:create",
  SITE_READ: "site:read",
  SITE_UPDATE: "site:update",
  SITE_DELETE: "site:delete",

  // Asset Permissions
  ASSET_CREATE: "asset:create",
  ASSET_READ: "asset:read",
  ASSET_UPDATE: "asset:update",
  ASSET_DELETE: "asset:delete",

  // Asset Movement Permissions
  MOVEMENT_APPROVE: "movement:approve",
  MOVEMENT_READ: "movement:read",
  MOVEMENT_UPDATE: "movement:update",

  // User Management
  USER_MANAGEMENT_READ: "user_management:read",
  USER_MANAGEMENT_CREATE: "user_management:create",
  USER_MANAGEMENT_UPDATE: "user_management:update",
  USER_MANAGEMENT_DELETE: "user_management:delete",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [ROLES.ADMIN]: [
    PERMISSIONS.SITE_CREATE,
    PERMISSIONS.SITE_READ,
    PERMISSIONS.SITE_UPDATE,
    PERMISSIONS.SITE_DELETE,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.MOVEMENT_APPROVE,
    PERMISSIONS.MOVEMENT_READ,
    PERMISSIONS.MOVEMENT_UPDATE,
    PERMISSIONS.USER_MANAGEMENT_CREATE,
    PERMISSIONS.USER_MANAGEMENT_READ,
    PERMISSIONS.USER_MANAGEMENT_UPDATE,
    PERMISSIONS.USER_MANAGEMENT_DELETE,
  ],
  [ROLES.OPERATIONS_MANAGER]: [
    PERMISSIONS.SITE_CREATE,
    PERMISSIONS.SITE_READ,
    PERMISSIONS.SITE_UPDATE,
    PERMISSIONS.SITE_DELETE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.MOVEMENT_APPROVE, // Added this permission
    PERMISSIONS.MOVEMENT_READ,
    PERMISSIONS.MOVEMENT_UPDATE,
    PERMISSIONS.USER_MANAGEMENT_READ,
  ],
  [ROLES.MAINTENANCE_MANAGER]: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.MOVEMENT_APPROVE, // Added this permission
    PERMISSIONS.MOVEMENT_READ,
    PERMISSIONS.USER_MANAGEMENT_READ,
  ],
  [ROLES.USER]: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.MOVEMENT_READ,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.SITE_READ,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.MOVEMENT_READ,
  ],
};

/**
 * Checks if a user with a given role has a specific permission.
 * @param role The role of the user.
 * @param permission The permission to check for.
 * @returns True if the user has the permission, false otherwise.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
