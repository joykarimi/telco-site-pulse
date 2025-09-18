
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const manageUserRole = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can manage user roles.');
    }

    const { userId, role } = data;

    try {
        await admin.auth().setCustomUserClaims(userId, { role });
        await admin.firestore().collection('profiles').doc(userId).update({ role });
        return { message: 'User role updated successfully.' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Error updating user role.');
    }
});


export const deleteUser = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
    }

    const { userId } = data;

    try {
        await admin.auth().deleteUser(userId);
        await admin.firestore().collection('profiles').doc(userId).delete();
        return { message: 'User deleted successfully.' };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Error deleting user.');
    }
});
