"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.ROLES = void 0;
exports.hasPermission = hasPermission;
exports.ROLES = {
    ADMIN: "admin",
    OPERATIONS_MANAGER: "operations_manager",
    MAINTENANCE_MANAGER: "maintenance_manager",
    USER: "user",
    VIEWER: "viewer",
};
exports.PERMISSIONS = {
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
    MOVEMENT_DELETE: "movement:delete", // Added new permission
    // User Management
    USER_MANAGEMENT_READ: "user_management:read",
    USER_MANAGEMENT_CREATE: "user_management:create",
    USER_MANAGEMENT_UPDATE: "user_management:update",
    USER_MANAGEMENT_DELETE: "user_management:delete",
};
exports.ROLE_PERMISSIONS = {
    [exports.ROLES.ADMIN]: [
        exports.PERMISSIONS.SITE_CREATE,
        exports.PERMISSIONS.SITE_READ,
        exports.PERMISSIONS.SITE_UPDATE,
        exports.PERMISSIONS.SITE_DELETE,
        exports.PERMISSIONS.ASSET_CREATE,
        exports.PERMISSIONS.ASSET_READ,
        exports.PERMISSIONS.ASSET_UPDATE,
        exports.PERMISSIONS.ASSET_DELETE,
        exports.PERMISSIONS.MOVEMENT_APPROVE,
        exports.PERMISSIONS.MOVEMENT_READ,
        exports.PERMISSIONS.MOVEMENT_UPDATE,
        exports.PERMISSIONS.MOVEMENT_DELETE, // Admin can delete movement requests
        exports.PERMISSIONS.USER_MANAGEMENT_CREATE,
        exports.PERMISSIONS.USER_MANAGEMENT_READ,
        exports.PERMISSIONS.USER_MANAGEMENT_UPDATE,
        exports.PERMISSIONS.USER_MANAGEMENT_DELETE,
    ],
    [exports.ROLES.OPERATIONS_MANAGER]: [
        exports.PERMISSIONS.SITE_CREATE,
        exports.PERMISSIONS.SITE_READ,
        exports.PERMISSIONS.SITE_UPDATE,
        exports.PERMISSIONS.SITE_DELETE,
        exports.PERMISSIONS.ASSET_READ,
        exports.PERMISSIONS.MOVEMENT_APPROVE,
        exports.PERMISSIONS.MOVEMENT_READ,
        exports.PERMISSIONS.MOVEMENT_UPDATE,
        exports.PERMISSIONS.MOVEMENT_DELETE, // Operations Manager can delete movement requests
        exports.PERMISSIONS.USER_MANAGEMENT_READ,
    ],
    [exports.ROLES.MAINTENANCE_MANAGER]: [
        exports.PERMISSIONS.SITE_READ,
        exports.PERMISSIONS.ASSET_CREATE,
        exports.PERMISSIONS.ASSET_READ,
        exports.PERMISSIONS.ASSET_UPDATE,
        exports.PERMISSIONS.ASSET_DELETE,
        exports.PERMISSIONS.MOVEMENT_APPROVE,
        exports.PERMISSIONS.MOVEMENT_READ,
        exports.PERMISSIONS.MOVEMENT_DELETE, // Maintenance Manager can delete movement requests
        exports.PERMISSIONS.USER_MANAGEMENT_READ,
    ],
    [exports.ROLES.USER]: [
        exports.PERMISSIONS.SITE_READ,
        exports.PERMISSIONS.ASSET_READ,
        exports.PERMISSIONS.MOVEMENT_READ,
    ],
    [exports.ROLES.VIEWER]: [
        exports.PERMISSIONS.SITE_READ,
        exports.PERMISSIONS.ASSET_READ,
        exports.PERMISSIONS.MOVEMENT_READ,
    ],
};
/**
 * Checks if a user with a given role has a specific permission.
 * @param role The role of the user.
 * @param permission The permission to check for.
 * @returns True if the user has the permission, false otherwise.
 */
function hasPermission(role, permission) {
    var _a, _b;
    return (_b = (_a = exports.ROLE_PERMISSIONS[role]) === null || _a === void 0 ? void 0 : _a.includes(permission)) !== null && _b !== void 0 ? _b : false;
}
//# sourceMappingURL=roles.js.map