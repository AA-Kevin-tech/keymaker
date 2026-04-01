# API Overview

Base path: **`/api`** (e.g. `http://localhost:3001/api`).

## Authentication

Protected routes require a JWT in the **Authorization** header:

```
Authorization: Bearer <token>
```

Tokens are returned from **POST /api/auth/register** and **POST /api/auth/login** in the response body as `token`. Use that value for subsequent requests. Missing or invalid tokens yield **401** with `{ "error": "Authentication required" }`.

---

## Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | `{ "status": "ok" }` |

### Auth

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/register | No | `{ "username", "password" }` | Register; returns `{ token, user: { id, username } }`. Username 2–32 chars; password min 8 chars. |
| POST | /api/auth/login | No | `{ "username", "password" }` | Login; returns `{ token, user: { id, username } }`. |
| GET | /api/auth/me | Yes | — | Current user: `{ user: { id, username } }`. |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/users/by-id/:id | No | User by ID. |
| GET | /api/users/:username | No | User by username. |

### Communities

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| GET | /api/communities | No | — | List communities. |
| GET | /api/communities/:slug | No | — | Community by slug. |
| GET | /api/communities/:slug/feed | No | — | Ranked feed for community (query params as implemented). |
| POST | /api/communities | Yes | `{ "name", "slug", "weightClarity?", "weightEvidence?", "weightNovelty?", "decayHalfLifeSeconds?" }` | Create community. Slug: alphanumeric and hyphens. |
| PATCH | /api/communities/:slug | Yes | `{ "weightClarity?", "weightEvidence?", "weightNovelty?", "decayHalfLifeSeconds?" }` | Update community settings. |

### Posts

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | /api/posts | Yes | `{ "title", "body?", "communityId" }` | Create post. Title max 500 chars. |
| GET | /api/posts/:id | No | — | Post by ID. |
| PATCH | /api/posts/:id | Yes | `{ "title?", "body?" }` | Update post. |
| DELETE | /api/posts/:id | Yes | — | Permanently delete post (author only). **204** on success. Removes comments (cascade), post/comment ratings, and moderation rows for this post and its comments. |
| POST | /api/posts/:id/hide | Yes | — | Soft-hide post. |
| POST | /api/posts/:id/restore | Yes | — | Restore hidden post. |

### Comments

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | /api/comments | Yes | `{ "body", "postId", "parentId?" }` | Create comment (optional parent for replies). |
| GET | /api/comments/by-post/:postId | No | — | Comments for a post. |
| POST | /api/comments/:id/hide | Yes | — | Soft-hide comment. |
| POST | /api/comments/:id/restore | Yes | — | Restore hidden comment. |

### Ratings

Three-axis scores: **clarity**, **evidence**, **novelty**. Each axis uses an integer in the range defined in `@keymaker/shared` (e.g. -2 to 2). See `packages/shared/src/constants.ts`.

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| PUT | /api/ratings | Yes | `{ "targetType": "post" \| "comment", "targetId", "clarity", "evidence", "novelty" }` | Create or update a rating for a post or comment. |

### Moderation

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | /api/moderation | Yes | `{ "actionType", "targetType", "targetId", "communityId?", "reason?" }` | Create moderation action. |
| GET | /api/moderation/by-community/:communityId | No | — | List actions for a community. |
| GET | /api/moderation/by-target/:targetType/:targetId | No | — | List actions for a target. |

---

## Errors

- **400** – Validation error (e.g. invalid body); response body usually includes an `error` or validation message.
- **401** – Missing or invalid auth token.
- **404** – Resource not found (as implemented per route).
- **500** – Server error.

Validation uses Zod; invalid request bodies return error details as returned by the API (see schemas in `apps/api/src/modules/*/*.schema.ts`).
