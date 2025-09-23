
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK.
admin.initializeApp();

// Import and export all the user management cloud functions.
// This acts as the main entry point for all functions in this project.
export {
    createUser,
    listUsers,
    manageUserRole,
    deleteUser
} from "./users";
