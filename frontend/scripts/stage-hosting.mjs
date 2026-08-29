import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dist = new URL('../dist/', import.meta.url);
const hostingPublic = new URL('../../infra/public/', import.meta.url);

await rm(hostingPublic, { recursive: true, force: true });
await mkdir(hostingPublic, { recursive: true });
await cp(dist, hostingPublic, { recursive: true });

console.log(`Staged frontend build for Firebase Hosting at ${fileURLToPath(hostingPublic)}`);
