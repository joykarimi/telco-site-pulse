
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Updates a user's role via custom claims and in their Firestore profile.
 * This function can only be called by an authenticated admin.
 */
export const manageUserRole = onCall(async (request) => {
    // 1. Authorization check: Ensure the caller is an admin.
    if (request.auth?.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can manage user roles.');
    }

    // 2. Validate input data.
    const { userId, role } = request.data;
    if (!userId || !role) {
        throw new HttpsError('invalid-argument', 'The function must be called with 'userId' and 'role' arguments.');
    }

    try {
        // 3. Set the custom claim and update the Firestore document.
        await getAuth().setCustomUserClaims(userId, { role });
        await getFirestore().collection('profiles').doc(userId).update({ role });
        return { message: 'User role updated successfully.' };
    } catch (error) {
        console.error("Error updating user role:", error);
        throw new HttpsError('internal', 'An unexpected error occurred while updating the user role.');
    }
});

/**
 * Deletes a user from Firebase Authentication and their profile from Firestore.
 * This function can only be called by an authenticated admin.
 */
export const deleteUser = onCall(async (request) => {
    // 1. Authorization check: Ensure the caller is an admin.
    if (request.auth?.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can delete users.');
    }

    // 2. Validate input data.
    const { userId } = request.data;
    if (!userId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a 'userId' argument.');
    }

    try {
        // 3. Delete the user from Auth and Firestore.
        await getAuth().deleteUser(userId);
        await getFirestore().collection('profiles').doc(userId).delete();
        return { message: 'User deleted successfully.' };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new HttpsError('internal', 'An unexpected error occurred while deleting the user.');
    }
});
