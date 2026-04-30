# FreePathshala Backend

Express + Firebase Admin backend for FreePathshala. The API is mounted at `/api/v1` and is deployable as a Firebase Cloud Function named `api`.

## Stack

- Node.js 20
- Express.js
- Firebase Admin SDK
- Firestore
- Firebase Auth custom claims
- Firebase Storage signed URLs

## Setup

1. Install dependencies:

   ```bash
   cd Backend
   npm install
   ```

2. Create `Backend/.env` from `Backend/.env.example`.

3. Run locally:

   ```bash
   npm run dev
   ```

4. Check syntax:

   ```bash
   npm run check
   ```

## Authentication

Clients authenticate through the backend:

- `POST /api/v1/auth/login` with email/password
- `POST /api/v1/auth/refresh` with a refresh token
- Send `Authorization: Bearer <idToken>` to protected routes

Roles are stored as Firebase custom claims using `role: "admin" | "manager" | "executive"`.

## Main Routes

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/donors`
- `/api/v1/pickup-partners`
- `/api/v1/pickups`
- `/api/v1/payments`
- `/api/v1/sks`
- `/api/v1/dashboard`
- `/api/v1/uploads`
- `/api/v1/locations`
- `/api/v1/master-data`

Responses follow:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```

## Collections

- `users`
- `donors`
- `pickupPartners`
- `pickups`
- `pickups/{pickupId}/payments`
- `sksInflows`
- `sksOutflows`
- `cities`
- `sectors`
- `societies`
- `counters`

Pickup documents denormalize donor and pickup partner snapshots for faster dashboard/report reads.
Location documents are upserted automatically when donor, pickup, or pickup partner payloads include new city, sector, or society values.

## File Uploads

Use signed URLs for browser uploads without exposing Firebase SDK access:

- `POST /api/v1/uploads/signed-url`
- `PUT` the file to the returned signed URL with the returned `contentType`
- Save the returned `storagePath` on the relevant donor/payment/SKS document

For server-mediated upload, use multipart `POST /api/v1/uploads` with field name `file`.

The frontend uses direct signed URL uploads through `uploadFileViaSignedUrl`; uploaded file URLs/paths are sent back in donor, partner, payment, and SKS payloads.

## Firebase Deployment

From the repo root:

```bash
npm --prefix Frontend run build
firebase deploy
```

The root `firebase.json` rewrites `/api/**` to the `api` Cloud Function and serves the Vite build from `Frontend/dist`.
