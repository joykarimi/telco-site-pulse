import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from 'uuid';

interface CreateUserResponse {
  uid: string;
  email: string;
  role: string;
  status: string;
  message: string;
  temporaryPassword?: string;
}

export const createUserWithRole = onCall(async (request) => {
  const auth = getAuth();
  const firestore = getFirestore();

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const callerRole = request.auth.token.role;
  if (callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can create new users.");
  }

  const { email: rawEmail, role, firstName, lastName } = request.data;

  const email = rawEmail?.trim().toLowerCase();

  if (!email || !role || !firstName || !lastName || !["admin", "operations_manager", "maintenance_manager", "viewer"].includes(role)) {
    throw new HttpsError("invalid-argument", "Valid 'email', 'role', 'firstName', and 'lastName' are required.");
  }

  const displayName = `${firstName} ${lastName}`;
  let userRecord;
  let temporaryPassword: string | null = null;

  try {
    userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { displayName });
  } catch (e: unknown) {
    const error = e as { code: string };
    if (error.code === "auth/user-not-found") {
      temporaryPassword = uuidv4().substring(0, 8);
      userRecord = await auth.createUser({
        email,
        emailVerified: false,
        password: temporaryPassword,
        displayName,
      });
    } else {
      throw new HttpsError("internal", "Error creating or fetching user.", e);
    }
  }

  await auth.setCustomUserClaims(userRecord.uid, { role });

  await firestore.doc(`profiles/${userRecord.uid}`).set({
    user_id: userRecord.uid,
    email,
    role,
    firstName,
    lastName,
    displayName,
    createdBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const response: CreateUserResponse = {
    uid: userRecord.uid,
    email,
    role,
    status: "success",
    message: `User ${email} created/updated successfully.`
  };

  if (temporaryPassword) {
    response.temporaryPassword = temporaryPassword;
    response.message = `User ${email} created successfully. Please share the temporary password.`;
  } else {
    response.message = `User ${email} already existed and has been updated.`;
  }

  return response;
});
