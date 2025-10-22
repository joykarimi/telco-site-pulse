
import * as admin from "firebase-admin";

admin.initializeApp();

// Directly export all onCall functions from their respective files.
export * from "./users";
export * from "./movements";
