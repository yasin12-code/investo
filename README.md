# Investo

Investo is a mobile-first agentic investment demo with a Vite + React frontend, an Express backend, and a Capacitor Android build. It is designed for hackathon-style demos where judges can install the APK and see the reasoning flow, demo mode, and result screens.

## Repository Layout

- [frontend](frontend) - React + Vite app and Capacitor Android/iOS wrapper.
- [backend](backend) - Express API, auth, scoring, traces, and demo workflows.
- [data](data) - Sample sources, traces, and generated feature snapshots.

## What the app does

- Login and registration with a demo-friendly session flow.
- Agentic analysis with trace output, scoring, and snapshots.
- Demo scenarios that work even if the backend is unavailable.
- Android APK packaging for phone testing or hackathon submission.

## Local Development

Start the backend:

```powershell
cd backend
npm install
npm start
```

Start the frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## Mobile App Build

The Android build lives under [frontend/android](frontend/android).

Build a debug APK:

```powershell
cd frontend\android
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:ANDROID_SDK_ROOT='C:\Users\Yaseen\Android\Sdk'
$env:ANDROID_HOME='C:\Users\Yaseen\Android\Sdk'
.\gradlew --no-daemon assembleDebug
```

Build a release APK:

```powershell
cd frontend
npm run build
npx cap sync android
cd android
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:ANDROID_SDK_ROOT='C:\Users\Yaseen\Android\Sdk'
$env:ANDROID_HOME='C:\Users\Yaseen\Android\Sdk'
.\gradlew --no-daemon assembleRelease
```

APK outputs:

- Debug: [frontend/android/app/build/outputs/apk/debug/app-debug.apk](frontend/android/app/build/outputs/apk/debug/app-debug.apk)
- Release unsigned: [frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk](frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk)
- Signed release copy used in this workspace: [frontend/app-release-signed.apk](frontend/app-release-signed.apk)

## Vercel Frontend Deploy

The frontend can be deployed to Vercel as a static SPA.

- The SPA rewrite is configured in [frontend/vercel.json](frontend/vercel.json).
- Set `VITE_API_BASE_URL` before building if you want the app to call a public backend.
- If the backend is unreachable, the app now falls back to offline/demo mode for login and demo flows.

## Backend Notes

The backend is an Express API with endpoints under `/api` for auth, scoring, traces, and demo runs.

Important note for deployment:

- The current backend uses in-memory session state and local file writes for traces and feature snapshots.
- That works locally and for APK demos, but it is not a drop-in Vercel serverless app without further changes.
- For a public production-style deployment, host the backend on a Node service that supports persistent processes and filesystem writes, or refactor the storage layer.

## Hackathon Submission Flow

1. Deploy the frontend to Vercel.
2. Provide a reachable backend URL, or use the app's offline/demo mode.
3. Install the APK on an Android phone.
4. Use the demo login or register a local account.
5. Run the demo scenarios or quick score flow.

## Demo Credentials

Default demo credentials are defined in the backend environment, with a fallback of:

- Email: `admin@investo.ai`
- Password: `demo123`

## Troubleshooting

- If Android build fails, confirm Java 21 and the writable SDK path in `frontend/android/local.properties`.
- If the phone shows a fetch error, make sure `VITE_API_BASE_URL` points to a reachable backend, or use the offline/demo path.
- If deep links fail on Vercel, confirm the rewrite in [frontend/vercel.json](frontend/vercel.json).
