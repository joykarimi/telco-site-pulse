
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const updateMovementStatus = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const { role } = request.auth.token;
  if (role !== "admin" && role !== "operations_manager") {
    throw new HttpsError("permission-denied", "You do not have permission to perform this action.");
  }

  const { movementId, status } = request.data;
  if (!movementId || (status !== "Approved" && status !== "Rejected")) {
    throw new HttpsError("invalid-argument", "Invalid data provided.");
  }

  try {
    await db.collection("asset_movements").doc(movementId).update({ status });
    return { success: true, message: "Movement status updated successfully." };
  } catch (error) {
    console.error("Error updating movement status:", error);
    throw new HttpsError("internal", "An error occurred while updating the movement status.");
  }
});

export const deleteMovementRequest = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  if (request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "You do not have permission to perform this action.");
  }

  const { movementId } = request.data;
  if (!movementId) {
    throw new HttpsError("invalid-argument", "Invalid data provided.");
  }

  try {
    await db.collection("asset_movements").doc(movementId).delete();
    return { success: true, message: "Movement request deleted successfully." };
  } catch (error) {
    console.error("Error deleting movement request:", error);
    throw new HttpsError("internal", "An error occurred while deleting the movement request.");
  }
});
