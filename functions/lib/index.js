"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.manageUserRole = exports.listUsers = exports.createUser = void 0;
const admin = require("firebase-admin");
// Initialize the Firebase Admin SDK.
admin.initializeApp();
// Import and export all the user management cloud functions.
// This acts as the main entry point for all functions in this project.
var users_1 = require("./users");
Object.defineProperty(exports, "createUser", { enumerable: true, get: function () { return users_1.createUser; } });
Object.defineProperty(exports, "listUsers", { enumerable: true, get: function () { return users_1.listUsers; } });
Object.defineProperty(exports, "manageUserRole", { enumerable: true, get: function () { return users_1.manageUserRole; } });
Object.defineProperty(exports, "deleteUser", { enumerable: true, get: function () { return users_1.deleteUser; } });
//# sourceMappingURL=index.js.map