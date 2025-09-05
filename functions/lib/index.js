"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserWithRole = exports.grantAdminOnCreate = void 0;
const functions = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
/**
 * Helper to create a random temporary password.
 * @param length The desired password length.
 * @returns A random string.
 */
function generateTempPassword(length = 12) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}
/**
 * Grants admin role to the first user whose email matches the one in
 * Firebase config. This is a one-time bootstrap function.
 */
exports.grantAdminOnCreate = functions.auth.user().onCreate(async (user) => {
    var _a;
    const adminEmail = (_a = functions.config().admin) === null || _a === void 0 ? void 0 : _a.email;
    // Check if the new user's email matches the configured admin email
    if (adminEmail && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
        const auth = (0, auth_1.getAuth)();
        const firestore = (0, firestore_1.getFirestore)();
        await auth.setCustomUserClaims(user.uid, { role: "admin" });
        await firestore.doc(`users/${user.uid}`).set({
            email: user.email,
            role: "admin",
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Successfully granted admin role to: ${user.email}`);
    }
});
/**
 * A callable function for admins to create new users with a specific role.
 * It creates the user, sets their role, and triggers an email with a
 * password reset link.
 */
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const auth = (0, auth_1.getAuth)();
    const firestore = (0, firestore_1.getFirestore)();
    // 1. Authentication & Authorization
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
    }
    const callerRole = context.auth.token.role;
    if (callerRole !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admins can create new users.");
    }
    // 2. Validate Input
    const email = (_a = data === null || data === void 0 ? void 0 : data.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const role = (data === null || data === void 0 ? void 0 : data.role) || "viewer";
    if (!email || !["admin", "operations_manager", "maintenance_manager", "viewer"].includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", "Valid 'email' and 'role' are required.");
    }
    // 3. Create or Retrieve User
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(email);
    }
    catch (error) {
        if (error.code === "auth/user-not-found") {
            userRecord = await auth.createUser({
                email,
                emailVerified: false,
                password: generateTempPassword(),
            });
        }
        else {
            throw new functions.https.HttpsError("internal", "Error retrieving user.", error);
        }
    }
    // 4. Set Custom Role & Profile
    await auth.setCustomUserClaims(userRecord.uid, { role });
    await firestore.doc(`users/${userRecord.uid}`).set({
        email,
        role,
        createdBy: context.auth.uid,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    // 5. Send Password Setup Email
    const continueUrl = ((_b = functions.config().app) === null || _b === void 0 ? void 0 : _b.url) || "http://localhost:5173";
    const resetLink = await auth.generatePasswordResetLink(email, { url: continueUrl });
    // This relies on the "Trigger Email" extension
    await firestore.collection("mail").add({
        to: [email],
        message: {
            subject: "Your Account is Ready",
            text: `Hello! Your account with the role '${role}' has been created. Please set your password here: ${resetLink}`,
            html: `<p>Hello!</p><p>Your account with the role '<b>${role}</b>' has been created.</p><p><a href="${resetLink}">Click here to set your secure password</a>.</p>`,
        },
    });
    return { uid: userRecord.uid, email, role, status: "success" };
});
//# sourceMappingURL=index.js.map