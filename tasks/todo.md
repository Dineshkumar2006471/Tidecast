# TIDECAST repository setup

- [x] Inspect existing application, tests, and run commands.
- [x] Add focused backend and frontend test coverage with test tooling.
- [x] Add GitHub Actions CI for backend tests and frontend test/build.
- [x] Write the production README and repository `.gitignore`.
- [x] Run verification and initialize Git.
- [x] Start the frontend development server.
- [x] Start the backend development server from the isolated local environment.
- [x] Diagnose and correct local Firebase authentication and role-based login flows.
- [x] Verify the admin-to-fisherman advisory flow with dedicated Firebase test users.
- [x] Deploy Cloud Run, Firestore configuration, and Firebase Hosting after the manual acceptance gate passes.
- [x] Review automated release-gate results and record verification evidence.

## Review

Automated verification completed successfully on 2026-08-29:

- `pytest -q` in `backend/` — 5 passed.
- `npm run test` in `frontend/` — 1 passed.
- `npm run build` in `frontend/` — passed (Vite reports a non-blocking bundle-size warning).
- Frontend development server — running at `http://127.0.0.1:5173`.
- Backend development server — requires local Google Application Default Credentials before Firebase/Google Cloud SDK initialization can complete.
- Firebase Auth configuration probe — valid API key/provider confirmed (`INVALID_LOGIN_CREDENTIALS` for a fictional account).
- Auth and acknowledgment integration changes — frontend tests/build and backend tests passed; backend dependency installation is being completed in an isolated local virtual environment.

Production-readiness verification completed on 2026-08-29:

- The backend health endpoint returns healthy at `http://127.0.0.1:8000/api/health`; unauthenticated profile access correctly returns HTTP 401.
- Production frontend build completed with no `localhost:8000` references, so Firebase Hosting's `/api/**` rewrite will be used in production.
- `pytest -q` — 6 passed; `npm run test -- --run` — 1 passed; `npm run build` — passed (non-blocking chunk-size warning only).
- Production UI no longer renders invented zone warnings or fake dashboard, logs, and compose metrics.
- Firestore rules prevent client-side role self-promotion: new profiles must be `fisherman`, and profile owners cannot modify their role or uid.
- Ravi/Meena acceptance flow — Firebase authentication, Firestore role promotion, zone seeding, a real high-wave six-agent broadcast, three generated MP3 files, and Ravi's persisted acknowledgment all passed. Ravi receives HTTP 403 from admin endpoints; Meena receives live dashboard data.
- GitHub Actions CI run for commit `53b6308` passed both backend and frontend test/build jobs.
- Cloud Run `tidecast-backend` deployed in `asia-south1`; its direct and Firebase Hosting-rewritten `/api/health` endpoints return a healthy status for `tidecast-507006`.
- Firebase Hosting, Firestore rules, and Firestore indexes deployed successfully. The live site returns HTTP 200 and the public zone endpoint returns 10 seeded zones.
