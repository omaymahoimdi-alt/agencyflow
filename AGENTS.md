<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## MongoDB / Mock DB Consistency
This app has two data layers: MongoDB and mock-db (JSON files in `data/`). When MongoDB is available, writes go to MongoDB; when it fails, they fall back to mock-db. This creates inconsistency: `resolveWorkspaceId` (in `lib/auth.ts`) and other readers may attempt mock-db after MongoDB fails and find stale/missing data.

**Rule**: Any write that creates data read later by fallback logic must write to **both** DBs unconditionally. The `POST /api/invitations/accept` route already does this (WorkspaceMember + Invitation update). Follow this pattern in all routes that create entities visible to `resolveWorkspaceId` or other MongoDB-then-mock-db readers.
