
import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp();


/**
 * Grants admin role to the first user whose email matches the one in
 * Firebase config. This is a one-time bootstrap function.
 */
export const grantAdminOnCreate = functions.auth.user().onCreate(async (user) => {
  // This is a special configuration variable you can set in Firebase.
  // `firebase functions:config:set admin.email="your-admin-email@example.com"`
  const adminEmail = functions.config().admin?.email as string | undefined;

  // Check if the new user's email matches the configured admin email
  if (adminEmail && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.setCustomUserClaims(user.uid, { role: "admin" });
    await firestore.doc(`profiles/${user.uid}`).set({
      user_id: user.uid,
      email: user.email,
      full_name: user.displayName || "Admin User",
      role: "admin",
      created_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Successfully granted admin role to: ${user.email}`);
  }
});

/**
 * A callable function for admins to create new users with a specific role.
 * It creates the user, sets their role, and triggers an email for them to
 * set their own password.
 */
export const createUser = functions.runWith({ secrets: ["SENDGRID_API_KEY"]}).https.onCall(async (data, context) => {
  const auth = getAuth();
  const firestore = getFirestore();

  // 1. Authentication & Authorization Check
  if (!context.auth || context.auth.token.role !== "admin") {
    functions.logger.warn("Unauthorized user creation attempt", {
      uid: context.auth?.uid,
    });
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators are allowed to create new users.",
    );
  }

  // 2. Input Validation
  const { email, fullName, role } = data;
  if (!email || !fullName || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, fullName, and role.",
    );
  }
  const validRoles = ["admin", "operations_manager", "maintenance_manager", "user"];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `"${role}" is not a valid role.`,
    );
  }

  try {
    // 3. Create User in Firebase Authentication
    functions.logger.info(`Attempting to create user: ${email}`);
    const userRecord = await auth.createUser({
      email: email,
      displayName: fullName,
      emailVerified: false, // Will be true once they set password
    });
    functions.logger.info(`Successfully created user in Auth: ${userRecord.uid}`);

    // 4. Set Custom Role & Firestore Profile
    await auth.setCustomUserClaims(userRecord.uid, { role });
    await firestore.doc(`profiles/${userRecord.uid}`).set({
      user_id: userRecord.uid,
      full_name: fullName,
      email: email,
      role: role,
      createdBy: context.auth.uid,
      created_at: FieldValue.serverTimestamp(),
    });
    functions.logger.info(`Set custom claims and created user profile for ${userRecord.uid}`);

    // 5. Generate Password Reset Link
    const actionCodeSettings = {
        url: 'https://telco-c0b89.web.app/auth/action',
        handleCodeInApp: true,
    };
    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
    functions.logger.info(`Generated password reset link for ${email}: ${resetLink}`);

    // 6. Trigger Invitation Email via Firestore Extension
    functions.logger.info(`Preparing to add invitation email to 'mail' collection for ${email}`);
    const mailDoc = {
        to: [email],
        message: {
            subject: "Welcome! Your Account is Ready",
            html: `<p>Hello ${fullName}!</p><p>An administrator has created an account for you with the role '<b>${role.replace(/_/g, " ")}</b>'.</p><p><a href="${resetLink}">Click here to set your secure password</a>.</p><p>If you did not request this, please ignore this email.</p>`,
        },
    };
    const result = await firestore.collection("mail").add(mailDoc);
    functions.logger.info(`Successfully added invitation email to 'mail' collection for ${email} with doc ID: ${result.id}`);


    return { status: "success", message: `Successfully invited ${fullName}.` };
  } catch (error: any) {
    functions.logger.error("Error creating user:", error);
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError(
        "already-exists",
        "A user with this email address already exists.",
      );
    }
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while creating the user.",
    );
  }
});


export const manageUserRole = functions.https.onCall(async (data, context) => {
    const auth = getAuth();
    const firestore = getFirestore();

    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can manage user roles.');
    }

    const { userId, role } = data;
    if (!userId || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID and role must be provided.');
    }

    try {
        await auth.setCustomUserClaims(userId, { role });
        const querySnapshot = await firestore.collection('profiles').where('user_id', '==', userId).get();
        if (querySnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        const docId = querySnapshot.docs[0].id;
        await firestore.doc(`profiles/${docId}`).update({ role });

        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        throw new functions.https.HttpsError('internal', 'Failed to update user role.');
    }
});

export const deleteUser = functions.https.onCall(async (data, context) => {
    const auth = getAuth();
    const firestore = getFirestore();

    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
    }

    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID must be provided.');
    }

    try {
        await auth.deleteUser(userId);
        const querySnapshot = await firestore.collection('profiles').where('user_id', '==', userId).get();
        if (!querySnapshot.empty) {
            const docId = querySnapshot.docs[0].id;
            await firestore.doc(`profiles/${docId}`).delete();
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new functions.https.HttpsError('internal', 'Failed to delete user.');
    }
});
