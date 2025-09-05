const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// It's recommended to initialize admin only once.
admin.initializeApp();
const db = getFirestore();

/**
 * Creates a new user in Firebase Authentication, sets their custom claims (role),
 * stores their details in Firestore, and triggers an email for them to set their password.
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // --- Authentication and Permission Check ---
  // Ensure the request is made by an authenticated user.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to create a user.');
  }
  // Ensure the authenticated user has the 'admin' role.
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators are allowed to create new users.');
  }

  const { email, fullName, role } = data;

  // --- Input Validation ---
  if (!email || !fullName || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: email, fullName, and role.');
  }

  // A list of valid roles to prevent arbitrary role creation.
  const validRoles = ['admin', 'operations_manager', 'maintenance_manager', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `"${role}" is not a valid role.`);
  }

  try {
    // --- User Creation in Firebase Auth ---
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: fullName,
      emailVerified: false, // The user will become verified when they set their password.
    });

    // --- Set Custom Claims (Role) ---
    // This is crucial for securing your app with Firebase Security Rules and on the frontend.
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    // --- Store User Data in Firestore ---
    // This creates a public profile for the user that can be read by the app.
    await db.collection('users').doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Generate Password Reset Link ---
    // This is the secure way to let users set their own password.
    const link = await admin.auth().generatePasswordResetLink(email);

    // --- Return Success Message ---
    // The frontend will now receive this message.
    // **NOTE:** The email sending is handled by the "Trigger Email" extension.
    return {
      status: 'success',
      message: `Successfully invited ${fullName}. An email to set their password has been sent to ${email}.`,
      link: link // IMPORTANT: For testing, you can see the link in the function logs.
    };

  } catch (error) {
    console.error("Error creating user:", error);

    // Provide more specific error messages to the client.
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'A user with this email address already exists.');
    }
    if (error.code === 'auth/invalid-email') {
        throw new functions.https.HttpsError('invalid-argument', 'The email address is not valid.');
    }

    // Generic fallback error.
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the user.');
  }
});
