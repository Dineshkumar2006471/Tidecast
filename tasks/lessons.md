# Lessons

- Keep demo-only privilege shortcuts behind explicit ignored local environment flags. Do not commit or deploy them with the production application.
- After changing a Vite environment variable, restart the local Vite server and verify the rendered role-control state; hot reload does not reload `.env` values.
