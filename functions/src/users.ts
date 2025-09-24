
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const corsOptions = { cors: true };

export const createUser = onCall(corsOptions, async (request) => {
  const auth = getAuth();
  const firestore = getFirestore();

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  if (request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can create users.");
  }

  const { email, role, firstName, lastName } = request.data;
  if (!email || !role || !firstName || !lastName) {
    throw new HttpsError("invalid-argument", "Required fields: email, role, firstName, lastName.");
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
      createdAt: FieldValue.serverTimestamp(),
    });

    return { uid: userRecord.uid };
  } catch (err: any) {
    console.error("Error creating user:", err);
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError("already-exists", "A user with this email address already exists.");
    }
    throw new HttpsError("internal", "An unexpected error occurred.");
  }
});

export const listUsers = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to perform this action.");
  }

  if (request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can view user data.");
  }

  const firestore = getFirestore();

  try {
    const usersSnapshot = await firestore.collection("users").orderBy("createdAt", "desc").get();
    
    const usersList = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      
      return {
        uid: doc.id,
        displayName: data.displayName || "N/A",
        email: data.email || "N/A",
        role: data.role || "N/A",
        createdAt: createdAt,
      };
    });

    return { users: usersList };

  } catch (err: any) {
    console.error("Error listing users:", err);
    throw new HttpsError("internal", "An unexpected error occurred while fetching the user list.");
  }
});

export const manageUserRole = onCall(corsOptions, async (request) => {
    const auth = getAuth();
    const firestore = getFirestore();

    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only administrators can manage user roles.');
    }

    const { uid, role } = request.data;
    if (!uid || !role) {
        throw new HttpsError('invalid-argument', 'The function must be called with "uid" and "role" arguments.');
    }

    try {
        await auth.setCustomUserClaims(uid, { role });
        await firestore.collection('users').doc(uid).update({ role });

        return { success: true, message: `Successfully updated role to ${role} for user ${uid}.` };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        throw new HttpsError('internal', 'An unexpected error occurred while updating the user role.', error.message);
    }
});

export const deleteUser = onCall(corsOptions, async (request) => {
    const auth = getAuth();
    const firestore = getFirestore();

    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only administrators can delete users.');
    }

    const { uid } = request.data;
    if (!uid) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "uid" argument.');
    }

    try {
        await auth.deleteUser(uid);
        await firestore.collection('users').doc(uid).delete();

        return { success: true, message: `Successfully deleted user ${uid}.` };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        throw new HttpsError('internal', 'An unexpected error occurred while deleting the user.', error.message);
    }
});
