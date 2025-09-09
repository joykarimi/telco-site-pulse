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
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to create a user.');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators are allowed to create new users.');
  }

  const { email, fullName, role } = data;

  // --- Input Validation ---
  if (!email || !fullName || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: email, fullName, and role.');
  }

  const validRoles = ['admin', 'operations_manager', 'maintenance_manager', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `"${role}" is not a valid role.`);
  }

  try {
    // --- User Creation in Firebase Auth ---
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: fullName,
      emailVerified: false, 
    });

    // --- Set Custom Claims (Role) ---
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    // --- Store User Data in Firestore ---
    await db.collection('users').doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // --- Generate Password Reset Link ---
    const link = await admin.auth().generatePasswordResetLink(email);

    // --- Trigger Invitation Email via Firestore Extension ---
    // This adds a document to the 'mail' collection, which the Trigger Email extension listens to.
    await db.collection("mail").add({
        to: email,
        message: {
            subject: "Welcome! Your Account is Ready",
            html: `<p>Hello ${fullName}!</p><p>An administrator has created an account for you with the role '<b>${role.replace(/_/g, " ")}</b>'.</p><p><a href="${link}">Click here to set your secure password</a>.</p><p>If you did not request this, please ignore this email.</p>`,
        },
    });

    // --- Return Success Message ---
    return {
      status: 'success',
      message: `Successfully invited ${fullName}. An email to set their password has been sent to ${email}.`
    };

  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'A user with this email address already exists.');
    }
    if (error.code === 'auth/invalid-email') {
        throw new functions.https.HttpsError('invalid-argument', 'The email address is not valid.');
    }

    throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the user.');
  }
});