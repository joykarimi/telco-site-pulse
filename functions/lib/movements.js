"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMovementRequest = exports.updateMovementStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const db = (0, firestore_1.getFirestore)();
exports.updateMovementStatus = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    const { role } = request.auth.token;
    if (role !== "admin" && role !== "operations_manager") {
        throw new https_1.HttpsError("permission-denied", "You do not have permission to perform this action.");
    }
    const { movementId, status } = request.data;
    if (!movementId || (status !== "Approved" && status !== "Rejected")) {
        throw new https_1.HttpsError("invalid-argument", "Invalid data provided.");
    }
    try {
        const updateData = { status };
        if (status === "Approved") {
            updateData.dateOfApproval = admin.firestore.Timestamp.now();
        }
        await db.collection("asset_movements").doc(movementId).update(updateData);
        return { success: true, message: "Movement status updated successfully." };
    }
    catch (error) {
        console.error("Error updating movement status:", error);
        throw new https_1.HttpsError("internal", "An error occurred while updating the movement status.");
    }
});
exports.deleteMovementRequest = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication is required.");
    }
    if (request.auth.token.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "You do not have permission to perform this action.");
    }
    const { movementId } = request.data;
    if (!movementId) {
        throw new https_1.HttpsError("invalid-argument", "Invalid data provided.");
    }
    try {
        await db.collection("asset_movements").doc(movementId).delete();
        return { success: true, message: "Movement request deleted successfully." };
    }
    catch (error) {
        console.error("Error deleting movement request:", error);
        throw new https_1.HttpsError("internal", "An error occurred while deleting the movement request.");
    }
});
//# sourceMappingURL=movements.js.map