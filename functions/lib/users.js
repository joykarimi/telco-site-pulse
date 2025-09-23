"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserWithRole = void 0;
const functions = require("firebase-functions");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    const auth = (0, auth_1.getAuth)();
    const firestore = (0, firestore_1.getFirestore)();
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
    }
    const callerRole = context.auth.token.role;
    if (callerRole !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admins can create new users.");
    }
    const email = (_a = data === null || data === void 0 ? void 0 : data.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const role = (data === null || data === void 0 ? void 0 : data.role) || "viewer";
    const firstName = (_b = data === null || data === void 0 ? void 0 : data.firstName) === null || _b === void 0 ? void 0 : _b.trim();
    const lastName = (_c = data === null || data === void 0 ? void 0 : data.lastName) === null || _c === void 0 ? void 0 : _c.trim();
    if (!email || !role || !firstName || !lastName || !["admin", "operations_manager", "maintenance_manager", "viewer"].includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", "Valid 'email', 'role', 'firstName', and 'lastName' are required.");
    }
    const displayName = `${firstName} ${lastName}`;
    let userRecord;
    let temporaryPassword = null;
    try {
        userRecord = await auth.getUserByEmail(email);
        await auth.updateUser(userRecord.uid, { displayName });
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            temporaryPassword = (0, uuid_1.v4)().substring(0, 8);
            userRecord = await auth.createUser({
                email,
                emailVerified: false,
                password: temporaryPassword,
                displayName,
            });
        }
        else {
            throw new functions.https.HttpsError("internal", "Error creating or fetching user.", error);
        }
    }
    await auth.setCustomUserClaims(userRecord.uid, { role });
    await firestore.doc(`users/${userRecord.uid}`).set({
        email,
        role,
        firstName,
        lastName,
        displayName,
        createdBy: context.auth.uid,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    // Conditionally build the response
    const response = {
        uid: userRecord.uid,
        email,
        role,
        status: "success",
        message: `User ${email} created/updated successfully.`
    };
    if (temporaryPassword) {
        response.temporaryPassword = temporaryPassword;
        response.message = `User ${email} created successfully. Please share the temporary password.`;
    }
    else {
        response.message = `User ${email} already existed and has been updated.`;
    }
    return response;
});
//# sourceMappingURL=users.js.map