# Telecommunication Asset Management System

This is a web application designed to manage telecommunication assets, sites, and related movements. It provides a comprehensive dashboard for monitoring revenue, managing users, and tracking asset movements within different sites.

## Features

*   **Asset Management**: Add, edit, and track various telecommunication assets.
*   **Site Management**: Create, update, and monitor different operational sites.
*   **Asset Movement Tracking**: Record and manage the movement of assets between sites.
*   **User Management**: Create and manage user accounts with different roles and permissions.
*   **Dashboard & Reporting**: Overview of assets, revenue breakdown, and site profitability.
*   **Authentication & Authorization**: Secure user login and role-based access control using Firebase Authentication.
*   **Notifications**: Real-time notifications for important events.
*   **Responsive Design**: A modern, responsive user interface built with React and Tailwind CSS.

## Technologies Used

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Shadcn/ui
*   **State Management/Data Fetching**: React Query
*   **Backend & Database**: Firebase (Firestore, Authentication, Hosting, Cloud Functions)
*   **Package Manager**: Bun

## Setup and Installation

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies**:
    This project uses `bun` as a package manager. If you don't have bun installed, you can install it from [bun.sh](https://bun.sh/docs/installation).
    ```bash
    bun install
    ```

## Firebase Configuration

This application heavily relies on Firebase services. You will need to set up a Firebase project and configure it for this application.

1.  **Create a Firebase Project**:
    Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

2.  **Enable Firebase Services**:
    Enable Firestore, Firebase Authentication (Email/Password provider), and Firebase Hosting for your project.

3.  **Update `firebase.ts`**:
    Update `src/firebase.ts` with your Firebase project configuration. You can find this information in your Firebase project settings under "Project settings" -> "Your apps".

    ```typescript
    // src/firebase.ts
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    export const db = getFirestore(app);
    ```

4.  **`auth_config.json`**:
    This file specifies the password policy action code settings for Firebase Authentication. Ensure the `url` matches your deployed Firebase Hosting URL for handling authentication actions like password resets.

    ```json
    {
        "passwordPolicy": {
            "actionCodeSettings": {
                "url": "https://telco-c0b89.web.app/auth/action",
                "handleCodeInApp": true
            }
        }
    }
    ```
    *Note: The `url` in `auth_config.json` should be updated to your actual deployed domain.*

5.  **`firebase.json`**:
    This file contains your Firebase project's hosting and functions configuration.

    ```json
    {
      "hosting": {
        "public": "dist",
        "ignore": [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ],
        "rewrites": [
          {
            "source": "**",
            "destination": "/index.html"
          }
        ]
      },
      "functions": {
        "source": "functions"
      },
      "firestore": {
        "rules": "firestore.rules"
      }
    }
    ```

6.  **Firestore Rules**:
    The `firestore.rules` file defines the security rules for your Firestore database. Review and adjust them according to your application's security requirements.

## Running the Application

To run the application in development mode:

```bash
bun run dev
```

This will start the Vite development server, and you can access the application in your browser, usually at `http://localhost:5173`.

## Project Structure

*   `public/`: Static assets like images and `index.html`.
*   `src/`: Main application source code.
    *   `src/App.tsx`: Main application component.
    *   `src/Routes.tsx`: Defines application routes.
    *   `src/auth/`: Authentication context, provider, and protected routes.
    *   `src/components/`: Reusable UI components.
    *   `src/context/`: React context providers (e.g., `NotificationContext`).
    *   `src/hooks/`: Custom React hooks.
    *   `src/lib/`: Utility functions and Firebase interaction logic.
    *   `src/pages/`: Page-level components for different views.
    *   `src/assets/`: Application assets like CSS and images.
    *   `src/types/`: TypeScript type definitions.
    *   `src/firebase.ts`: Firebase initialization and exports.
*   `functions/`: Firebase Cloud Functions source code.
*   `firestore.rules`: Firestore security rules.
*   `firebase.json`: Firebase project configuration.
*   `auth_config.json`: Firebase authentication configuration.

## Deployment

To deploy the application to Firebase Hosting:

1.  **Build the application**:
    ```bash
    bun run build
    ```
    This will create a `dist` folder containing the production-ready static assets.

2.  **Deploy to Firebase**:
    ```bash
    firebase deploy --only hosting
    ```
    If you also have Firebase Functions, you might use:
    ```bash
    firebase deploy
    ```

    *Ensure you have the Firebase CLI installed and are logged in to your Firebase account (`firebase login`).*
