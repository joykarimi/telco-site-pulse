const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// It's recommended to initialize admin only once.
admin.initializeApp();
const db = getFirestore();

/**
 * Creates a new user in Firebase Authentication, sets their custom claims (role),
 * and stores their details in Firestore.
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

    // --- Return Success Message ---
    return {
      status: 'success',
      message: `Successfully created user ${fullName}.`
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

/**
 * Updates the status of an asset movement request.
 * Only callable by users with 'admin' or 'operations_manager' roles.
 */
exports.updateMovementStatus = functions.https.onCall(async (data, context) => {
  // --- Authentication and Permission Check ---
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to perform this action.');
  }

  const allowedRoles = ['admin', 'operations_manager'];
  const userRole = context.auth.token.role;

  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to approve or reject asset movements.');
  }

  // --- Input Validation ---
  const { movementId, status } = data;
  if (!movementId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: movementId and status.');
  }

  const validStatuses = ['Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', `'${status}' is not a valid status. Must be 'Approved' or 'Rejected'.`);
  }

  try {
    const movementRef = db.collection('movements').doc(movementId);
    const movementDoc = await movementRef.get();

    if (!movementDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Movement request not found.');
    }

    const movementData = movementDoc.data();
    const assetRef = db.collection('assets').doc(movementData.assetId);

    // --- Firestore Transaction ---
    await db.runTransaction(async (transaction) => {
      // 1. Update the movement request status
      transaction.update(movementRef, {
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        actionedBy: context.auth.uid,
      });

      // 2. If approved, update the asset's current site
      if (status === 'Approved') {
        transaction.update(assetRef, {
          currentSite: movementData.destinationSiteId,
          lastMovedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // --- Return Success Message ---
    return {
      status: 'success',
      message: `Movement request has been successfully ${status.toLowerCase()}.`
    };

  } catch (error) {
    console.error("Error updating movement status:", error);
    if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsError
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred while updating the movement status.');
  }
});

/**
 * Deletes an asset movement request.
 * Only callable by users with the 'admin' role.
 */
exports.deleteMovementRequest = functions.https.onCall(async (data, context) => {
  // --- Authentication and Permission Check ---
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to perform this action.');
  }

  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to delete asset movement requests.');
  }

  // --- Input Validation ---
  const { movementId } = data;
  if (!movementId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required field: movementId.');
  }

  try {
    const movementRef = db.collection('movements').doc(movementId);
    const movementDoc = await movementRef.get();

    if (!movementDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Movement request not found.');
    }

    // --- Deletion ---
    await movementRef.delete();

    // --- Return Success Message ---
    return {
      status: 'success',
      message: 'Movement request has been successfully deleted.'
    };

  } catch (error) {
    console.error("Error deleting movement request:", error);
    if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsError
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred while deleting the movement request.');
  }
});
