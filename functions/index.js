const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PERMISSIONS, ROLES } = require("./src/roles"); // Corrected path to roles.ts in functions/src

admin.initializeApp();
const db = admin.firestore();

// Update Asset Movement Status Cloud Function
exports.updateMovementStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can update movement status.'
    );
  }

  const { movementId, status } = data;
  const userId = context.auth.uid;

  // Validate status
  if (!['Approved', 'Rejected'].includes(status)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid status provided. Must be "Approved" or "Rejected".'
    );
  }

  const movementRef = db.collection('asset_movements').doc(movementId);
  const movementDoc = await movementRef.get();

  if (!movementDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Asset movement request not found.'
    );
  }

  const movementData = movementDoc.data();

  // Check if the current user is an assigned approver
  if (movementData.approver1 !== userId && movementData.approver2 !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized to approve or reject this request.'
    );
  }

  try {
    await movementRef.update({ status: status });

    // Optional: If approved, update the asset's site
    if (status === 'Approved') {
        const assetRef = db.collection('assets').doc(movementData.assetId);
        await assetRef.update({ site: movementData.toSite });
    }

    return { success: true, message: `Movement request ${status.toLowerCase()} successfully.` };
  } catch (error) {
    console.error("Error updating movement status:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update movement status.',
      error.message
    );
  }
});

// Delete Asset Movement Request Cloud Function
exports.deleteMovementRequest = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can delete movement requests.'
    );
  }

  const requesterRole = context.auth.token.role;
  const movementId = data.movementId;

  // UPDATED PERMISSION CHECK: Now correctly using imported PERMISSIONS and ROLES constants
  if (requesterRole !== ROLES.ADMIN && !(context.auth.token.permissions && context.auth.token.permissions.includes(PERMISSIONS.MOVEMENT_DELETE))) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to delete movement requests.'
    );
  }

  const movementRef = db.collection('asset_movements').doc(movementId);

  try {
    await movementRef.delete();
    return { success: true, message: `Movement request ${movementId} deleted successfully.` };
  } catch (error) {
    console.error("Error deleting movement request:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete movement request.',
      error.message
    );
  }
});

// Cloud function to create a new site definition along with its initial monthly data.
exports.createSiteWithMonthlyData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { name, type, month, year, initialMonthlyData } = data;

    if (!name || !type || !month || !year || !initialMonthlyData) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
    }

    try {
        // Add site definition
        const siteRef = await db.collection('siteDefinitions').add({ name, type });
        const siteId = siteRef.id;

        // Add initial monthly data, linking it to the new site
        await db.collection('siteMonthlyData').add({
            ...initialMonthlyData,
            siteId: siteId,
            month: month,
            year: year,
        });

        return { siteId: siteId, message: 'Site and initial monthly data added successfully.' };
    } catch (error) {
        console.error('Error creating site with monthly data:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create site with monthly data.', error.message);
    }
});

// Cloud Function to delete a site definition and its associated data
exports.deleteSite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { siteId } = data;

    if (!siteId) {
        throw new functions.https.HttpsError('invalid-argument', 'Site ID is required.');
    }

    try {
        const batch = db.batch();

        // Get site name to find associated assets
        const siteDoc = await db.collection('siteDefinitions').doc(siteId).get();
        if (!siteDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Site not found.');
        }
        const siteName = siteDoc.data().name;

        // Delete the site definition
        batch.delete(db.collection('siteDefinitions').doc(siteId));

        // Delete all associated monthly data
        const monthlyDataQuery = await db.collection('siteMonthlyData').where('siteId', '==', siteId).get();
        monthlyDataQuery.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete all associated assets (assuming 'site' field in assets collection stores site name)
        const assetsQuery = await db.collection('assets').where('site', '==', siteName).get();
        assetsQuery.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return { success: true, message: 'Site and all associated data deleted successfully.' };
    } catch (error) {
        console.error('Error deleting site and associated data:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete site and associated data.', error.message);
    }
});
