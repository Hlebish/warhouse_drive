# Warehouse Drive — Firebase Spark setup (no Cloud Functions)

This version uses Firebase Authentication email/password and Cloud Firestore. It does not use Cloud Functions or require the Blaze plan.

## 1. Create the database

1. Open Firebase Console for project `warehousedrive-4fc42`.
2. Create Cloud Firestore in region **europe-west1 (Belgium)**. The database region cannot be changed later.
3. Open **Authentication → Sign-in method** and enable **Email/Password**.

## 2. Create only the approved accounts

In **Authentication → Users**, add the owner and driver accounts manually. Use strong, unique passwords. Do not add a public registration form to the site. Each account must verify its email address before it can access the database.

Send the exact email addresses for the owner and driver to whoever is editing `firestore.rules`; replace `OWNER_EMAIL_REPLACE_ME` and `DRIVER_EMAIL_REPLACE_ME` with those addresses before deploying the rules. Until replaced, the rules deliberately deny access.

## 3. Deploy Firestore rules (Spark-compatible)

Install Firebase CLI if needed, then from the repository folder run:

```powershell
firebase.cmd login
firebase.cmd use warehousedrive-4fc42
firebase.cmd deploy --only firestore:rules
```

No Functions, Cloud Build, or Blaze upgrade is required.

## 4. Publish the site and upload the client Excel

Merge the prepared pull request after the allowlist emails are set and the Authentication provider is enabled. Once GitHub Pages has updated, sign in using the account created in Firebase Console, then upload the Excel file through the site. Client records and driver comments are stored in Firestore and shared across authorized devices.

## Security notes

- Firestore rules allow only the exact verified email addresses in the allowlist.
- The site has sign-in only; it does not offer account creation.
- Never put the Excel data, passwords, or service-account keys in the public repository.
- The Firebase web config is public by design; access control is enforced by Authentication and Firestore rules.
- Keep the list of allowed emails short and remove an account from both the allowlist and Firebase Authentication if access should be revoked.
