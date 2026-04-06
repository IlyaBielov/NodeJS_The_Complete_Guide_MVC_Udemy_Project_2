# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend (run from /backend)
npm run start-api          # Start backend with nodemon (port 8080)

# Frontend (run from /frontend)
npm run start-fe           # Start React dev server (port 3000)
npm run build              # Production build
```

No test suite is configured yet (`npm test` exits with error).

## Environment

Backend requires a `.env` file with:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `PORT` — server port (defaults to 8080)

## Architecture

**Transitioning from REST to GraphQL.** The `graph-ql` branch is replacing REST routes (`routes/auth.js`, `routes/feed.js`) with a single GraphQL endpoint at `/graphql`. The REST controllers in `controllers/` and Socket.IO (`socket.js`) are being removed in favor of resolvers defined inline in `graphql/schema.js`.

### Backend (`/backend`)

- **Entry point**: `app.js` — Express 5 app with CORS, Multer for image uploads, and `graphql-http` handler
- **GraphQL schema**: `graphql/schema.js` — code-first schema (no SDL) using `graphql` library directly. Types, queries, and mutations with inline resolvers. Currently has `createUser` mutation and `login` query.
- **REST controllers** (being phased out): `controllers/auth.js` (signup, login, status) and `controllers/feed.js` (CRUD posts with image handling)
- **Models**: Mongoose models in `models/` — `User` (email, password, name, status, posts[]) and `Post` (title, imageUrl, content, creator ref, timestamps)
- **Auth middleware**: `middleware/auth.js` — JWT verification via `Authorization: Bearer <token>` header, sets `req.userId`
- **Image uploads**: Multer stores files to `images/` directory, served statically at `/images`

### Frontend (`/frontend`)

React 16 SPA. Pages in `src/pages/` (Feed, Auth), reusable components in `src/components/`. Communicates with backend API. Uses `socket.io-client` for real-time updates (will need updating as backend moves to GraphQL).

### Key patterns

- Error objects carry `statusCode`/`code` and optional `data` array for validation errors
- GraphQL error formatting in `app.js` extracts `originalError.data` and `originalError.code` for client consumption
- Controllers use async/await with try/catch, delegating to `utils/errorHandler.handleError`
- Posts are paginated (2 per page) and sorted by `createdAt` descending
