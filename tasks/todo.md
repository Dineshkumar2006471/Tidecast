# TIDECAST repository setup

- [x] Inspect existing application, tests, and run commands.
- [x] Add focused backend and frontend test coverage with test tooling.
- [x] Add GitHub Actions CI for backend tests and frontend test/build.
- [x] Write the production README and repository `.gitignore`.
- [x] Run verification and initialize Git.
- [x] Start the frontend development server.
- [ ] Start the backend development server after local Google Application Default Credentials are configured.
- [ ] Review results and record verification evidence.

## Review

Automated verification completed successfully on 2026-08-29:

- `pytest -q` in `backend/` — 5 passed.
- `npm run test` in `frontend/` — 1 passed.
- `npm run build` in `frontend/` — passed (Vite reports a non-blocking bundle-size warning).
- Frontend development server — running at `http://127.0.0.1:5173`.
- Backend development server — requires local Google Application Default Credentials before Firebase/Google Cloud SDK initialization can complete.
