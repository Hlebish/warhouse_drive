# Warehouse Drive — Firebase setup

The client list and driver comments are stored in Cloud Firestore. The browser does not contain the shared PIN. The callable Cloud Function validates the PIN server-side and returns a Firebase custom token; Firestore rules reject unauthenticated access.

## One-time setup (Windows PowerShell)

1. In Firebase Console for project `warehousedrive-4fc42`, create a **Cloud Firestore** database. Choose a location close to your users. Do not enable public/test access.
2. In **Build → Authentication**, click **Get started** if Authentication has not been initialized for this project. The app uses Firebase custom-token sign-in, so no email/password account is required.
3. Install Node.js 20 or later and Firebase CLI: `npm install -g firebase-tools`.
4. In the repository folder run:

   ```powershell
   firebase login
   firebase use warehousedrive-4fc42
   firebase functions:secrets:set DRIVER_PIN
   ```

   Enter a 4–8 digit PIN when prompted. Do not put the PIN in GitHub, source code, or this file. Prefer 6–8 digits.

5. Deploy the server function and Firestore rules:

   ```powershell
   cd functions
   npm install
   cd ..
   firebase deploy --only functions:loginWithPin,firestore:rules
   ```

   Cloud Functions deployment may require the Firebase project to use the Blaze (pay-as-you-go) plan and billing to be enabled. Set a budget alert in Google Cloud Billing before deployment.

6. Open the GitHub Pages site, enter the PIN, then use **Загрузить базу Excel** to upload the client export. The upload goes directly to Firestore after PIN login; comments for clients that remain in the updated list are preserved.

## Important

- Never publish the Excel file, a service-account key, or the PIN in this public repository.
- The Firebase web config in `index.html` is intended to be public. The Firestore rules and server-side function are what protect the client data.
- The site requires the Cloud Function and Firestore rules to be deployed before PIN login can work.
- Firebase CLI can be launched in PowerShell with `firebase.cmd` if PowerShell blocks `firebase.ps1`.
