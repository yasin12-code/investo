# Investo

Investo is a mobile-first agentic investment demo with a Vite + React frontend, an Express backend, and a Capacitor Android build. It is designed for hackathon-style demos where judges can install the APK and see the reasoning flow, live streaming analysis, and traceable outputs.

## Repository Layout

- [frontend](frontend) - React + Vite app and Capacitor Android/iOS wrapper.
- [backend](backend) - Express API, auth, scoring, traces, and demo workflows.
- [data](data) - Sample sources, traces, and generated feature snapshots.

## What the app does

- Login and registration with a demo-friendly session flow.
- Agentic analysis with trace output, scoring, and snapshots.
- Real-time analysis driven by a backend agent; no offline/demo fallbacks are used in production builds — the app requires a reachable backend configured via `VITE_API_BASE_URL`.
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

## Git Cleanup

If `node_modules` was ever committed, add the ignore rule and remove the tracked copies from Git once:

```powershell
git rm -r --cached backend/node_modules frontend/node_modules react-app/node_modules
git add .gitignore README.md
git commit -m "Remove node_modules from repository"
git push
```

If you have other nested `node_modules` folders, remove them from the `git rm` command as well.

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

## Architecture (brief)

- **Frontend**: Vite + React single-page app packaged with Capacitor for Android. Uses `VITE_API_BASE_URL` for all API calls and consumes server-sent events (SSE) for progressive results.
- **Backend**: Node.js + Express API under `/api/` that hosts the Antigravity agent. The agent orchestrates ingestion, scrapers, parsers, scoring and trace generation. It writes trace artifacts to disk under `data/traces/`.
- **Agents**: The Antigravity agent implements a pipeline: ingestion → normalization → scoring → simulation. Live scrapers (Graana, Zameen, RSS) run in controlled timeouts to avoid blocking.
- **Tracing**: Each analysis run produces a human- and machine-readable trace written to `traces/` (or `data/traces/`) documenting inputs, intermediate artifacts, and outputs for reproducibility.

## Models & AI components

- Early prototyping used an internal "Antigravity Opus" model for rapid PRD iteration and local experimentation.
- The full-model integration is targeted at Google Gemini 3 for core reasoning and retrieval workloads in production runs.
- Developer-facing debugging and assistance used GPT-series tooling during development to accelerate fixes and instrumentation.
- All model orchestration, calls, and fallbacks are managed by the Antigravity agent layer so model selection is pluggable and reproducible.

## Vercel Frontend Deploy

The frontend can be deployed to Vercel as a static SPA.

- The SPA rewrite is configured in [frontend/vercel.json](frontend/vercel.json).
- Set `VITE_API_BASE_URL` before building if you want the app to call a public backend.
 - The SPA rewrite is configured in [frontend/vercel.json](frontend/vercel.json); the rewrite excludes `/api/*` so API requests are routed to a backend service instead of returning `index.html`.
 - Set `VITE_API_BASE_URL` before building so the produced APK and static site call your deployed backend (example: `https://investo-05rb.onrender.com`).

## Backend Notes

The backend is an Express API with endpoints under `/api` for auth, scoring, traces, and demo runs.

Important note for deployment:

- The current backend uses in-memory session state and local file writes for traces and feature snapshots.
- That works locally and for APK demos, but it is not a drop-in Vercel serverless app without further changes.
- For a public production-style deployment, host the backend on a Node service that supports persistent processes and filesystem writes, or refactor the storage layer.

APIs (important endpoints)
- `GET /api/health` — health/status JSON.
- `POST /api/auth/login` — login (returns session token / cookie).
- `POST /api/analyze` — submit an analysis request (accepts URLs, uploaded docs, or predefined scenarios). Responds with an SSE stream of incremental results and a final trace id.
- `GET /api/traces/:id` — fetch stored trace metadata and artifacts (requires auth on some deployments).

Agent & implementation notes
- Scrapers are invoked from `backend/src/agent/antigravityCore.js` and wrapped in `runWithTimeout(...)` to prevent long-running hangs.
- SSE streaming is implemented in `backend/src/routes/api.js` with buffering disabled for the analyze route (`X-Accel-Buffering: no`) and explicit header flushes so mobile clients see progress in real time.
- Traces and feature snapshots are written under `data/traces/` and `data/features/` respectively. For reproducible demos, the `traces/` top-level folder contains assembled notes and the demo script.

Repro & build (quick)
1. Configure backend URL for production builds:
```powershell
cd frontend
$env:VITE_API_BASE_URL='https://investo-05rb.onrender.com'
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```
2. Install debug APK:
```powershell
adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

Trace artifacts
- See [traces/antigravity_trace_notes.md](traces/antigravity_trace_notes.md) and [traces/antigravity_trace_metadata.json](traces/antigravity_trace_metadata.json) for human-readable walkthrough and metadata.

Contact & credits
- Team: ghulam yasin, ayan bin zubair, muhammad sabih, muhammad muaaz
- Backend (deployed example): https://investo-05rb.onrender.com

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
