# Backend Setup Guide

This document outlines the steps required to set up the backend for this project. The backend is powered by [Firebase](https://firebase.google.com/).

## 1. Firebase Project

You will need a Firebase project to connect the application to. If you don't have one, you can create a new project for free on the [Firebase website](https://console.firebase.google.com/).

## 2. Environment Variables

The frontend application needs to connect to your Firebase backend. To do this, you must create a `.env` file in the root of the project.

1.  Create a file named `.env` in the project's root directory.
2.  Add the following lines to the file:

    ```
    VITE_FIREBASE_API_KEY=YOUR_API_KEY
    VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    VITE_FIREBASE_APP_ID=YOUR_APP_ID
    ```

3.  **Replace the placeholder values:**
    *   Log in to your Firebase dashboard.
    *   Navigate to your project's **Settings**.
    *   Under **Your apps**, select your web app.
    *   Under **SDK setup and configuration**, you will find the configuration object with your project's credentials.

## 3. Firestore Database

This project uses Firestore as its database. You will need to create a Firestore database in your Firebase project.

### Steps to Create Firestore Database:

1.  Go to the **Firestore Database** page in your Firebase console.
2.  Click on **Create database**.
3.  Choose **Start in production mode**.
4.  Select a location for your database.
5.  Click **Enable**.

## 4. Firestore Rules

To allow users to read and write to the database, you need to set up Firestore rules. For this project, you can use the following rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This will allow any authenticated user to read and write to the database. You can customize these rules to fit your needs.
