"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.manageUserRole = exports.listUsers = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
// Define CORS options to allow requests from any origin.
// This is safe for onCall functions because they are protected by authentication checks.
const corsOptions = { cors: true };
/**
 * Creates a new user in Firebase Authentication and a corresponding user
 * document in Firestore.
 */
exports.createUser = (0, https_1.onCall)(corsOptions, async (request) => {
    const auth = (0, auth_1.getAuth)();
    const firestore = (0, firestore_1.getFirestore)();
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    if (request.auth.token.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only administrators can create users.");
    }
    const { email, role, firstName, lastName } = request.data;
    if (!email || !role || !firstName || !lastName) {
        throw new https_1.HttpsError("invalid-argument", "Required fields: email, role, firstName, lastName.");
    }
    const displayName = `${firstName} ${lastName}`;
    try {
        const userRecord = await auth.createUser({ email, displayName });
        await auth.setCustomUserClaims(userRecord.uid, { role });
        await firestore.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            role,
            firstName,
            lastName,
            displayName,
            createdBy: request.auth.uid,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { uid: userRecord.uid };
    }
    catch (err) {
        console.error("Error creating user:", err);
        if (err.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError("already-exists", "A user with this email address already exists.");
        }
        throw new https_1.HttpsError("internal", "An unexpected error occurred.");
    }
});
/**
 * Retrieves a list of all users from the Firestore 'users' collection.
 * This function is restricted to admin users only.
 */
exports.listUsers = (0, https_1.onCall)(corsOptions, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required to perform this action.");
    }
    if (request.auth.token.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only administrators can view user data.");
    }
    const firestore = (0, firestore_1.getFirestore)();
    try {
        const usersSnapshot = await firestore.collection("users").orderBy("createdAt", "desc").get();
        const usersList = usersSnapshot.docs.map((doc) => {
            var _a;
            const data = doc.data();
            const createdAt = ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.createdAt.toDate().toISOString() : new Date().toISOString();
            return {
                uid: doc.id,
                displayName: data.displayName || "N/A",
                email: data.email || "N/A",
                role: data.role || "N/A",
                createdAt: createdAt,
            };
        });
        return { users: usersList };
    }
    catch (err) {
        console.error("Error listing users:", err);
        throw new https_1.HttpsError("internal", "An unexpected error occurred while fetching the user list.");
    }
});
/**
 * Updates a user's role (custom claim) in Firebase Auth and their user document in Firestore.
 * This function is restricted to admin users only.
 */
exports.manageUserRole = (0, https_1.onCall)(corsOptions, async (request) => {
    const auth = (0, auth_1.getAuth)();
    const firestore = (0, firestore_1.getFirestore)();
    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only administrators can manage user roles.');
    }
    const { uid, role } = request.data;
    if (!uid || !role) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with "uid" and "role" arguments.');
    }
    try {
        // Set the custom claim for the user's role
        await auth.setCustomUserClaims(uid, { role });
        // Update the role in the user's Firestore document
        await firestore.collection('users').doc(uid).update({ role });
        return { success: true, message: `Successfully updated role to ${role} for user ${uid}.` };
    }
    catch (error) {
        console.error("Error updating user role:", error);
        throw new https_1.HttpsError('internal', 'An unexpected error occurred while updating the user role.', error.message);
    }
});
/**
 * Deletes a user from Firebase Authentication and their corresponding document from Firestore.
 * This function is restricted to admin users only.
 */
exports.deleteUser = (0, https_1.onCall)(corsOptions, async (request) => {
    const auth = (0, auth_1.getAuth)();
    const firestore = (0, firestore_1.getFirestore)();
    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only administrators can delete users.');
    }
    const { uid } = request.data;
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a "uid" argument.');
    }
    try {
        // Delete the user from Firebase Authentication
        await auth.deleteUser(uid);
        // Delete the user's document from Firestore
        await firestore.collection('users').doc(uid).delete();
        return { success: true, message: `Successfully deleted user ${uid}.` };
    }
    catch (error) {
        console.error("Error deleting user:", error);
        throw new https_1.HttpsError('internal', 'An unexpected error occurred while deleting the user.', error.message);
    }
});
//# sourceMappingURL=users.js.map