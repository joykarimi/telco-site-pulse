
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Creates a new user in Firebase Authentication and a corresponding profile
 * document in Firestore. This function can only be called by an authenticated admin.
 * It does not set a password, intending for the user to set their own via a
 * password reset email flow.
 */
export const createUser = onCall(async (request) => {
  const auth = getAuth();
  const firestore = getFirestore();

  // 1. Authentication check: Ensure the user is signed in.
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to perform this action.");
  }

  // 2. Authorization check: Ensure the caller is an admin.
  const callerRole = request.auth.token.role;
  if (callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can create new users.");
  }

  // 3. Validate input data from the client.
  const { email, role, firstName, lastName } = request.data;
  if (!email || !role || !firstName || !lastName) {
    throw new HttpsError("invalid-argument", "The function must be called with 'email', 'role', 'firstName', and 'lastName' arguments.");
  }
  const displayName = `${firstName} ${lastName}`;

  try {
    // 4. Create the user in Firebase Auth without a password.
    const userRecord = await auth.createUser({
      email,
      displayName,
    });

    // 5. Set a custom claim for the user's role for access control.
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 6. Create a user profile document in the 'profiles' collection in Firestore.
    await firestore.collection("profiles").doc(userRecord.uid).set({
      user_id: userRecord.uid,
      email,
      role,
      firstName,
      lastName,
      displayName,
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 7. Return the new user's UID on success.
    return { uid: userRecord.uid };

  } catch (err: any) {
    console.error("Error creating user:", err);

    // Provide a specific error message if the email is already in use.
    if (err.code === 'auth/email-already-exists') {
        throw new HttpsError("already-exists", "A user with this email address already exists.");
    }

    // Throw a generic internal error for other issues.
    throw new HttpsError("internal", err.message || "An unexpected error occurred while creating the user.");
  }
});
