# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep pages presentational and route all HTTP through one shared API client that uses relative `/api` paths (overridable with `VITE_API_BASE_URL`). Each page renders loading, data, and error states, with errors shown in an element with `role="alert"`. Implement one page at a time, driven by the frontend contract test.
- Logic tier decision: Express routes stay thin and delegate to small services. Routes validate input (well-formed IDs, required fields) and return deliberate 4xx responses, never 500s from Mongoose cast errors. No authentication in this exercise.
- Data tier decision: Mongoose models own validation through required fields: `Team` (`name`, `mascot`), `Activity` (`user`, `team`, `type`, `minutes`, `points`, `occurredAt`), and `Workout` (`title`, `focus`, `minutes`, `difficulty`). `src/scripts/seed.ts` provides the seed users, teams, activities, and workouts.
- Activity tracking approach: `POST /api/activities` accepts `userId`, `teamId`, `type`, and `minutes`. It rejects malformed IDs with `400` and non-existent users or teams with `404`. It stores `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. `GET` lists activities.
- Team management approach: `GET /api/teams` lists teams with members. `POST /api/teams` creates a team that keeps the submitted `name` and `mascot`, and returns `400` when `name` is missing.
- Leaderboard approach: Aggregate activity points per team, sort by total descending, and return `{ teamName, totalPoints, rank }` entries with a 1-based rank. Build it after activities so the aggregation has data.
- Workout suggestions approach: Look up the user by `userEmail` and return `404` if there is no match. Inspect recent activity types and the user's goal to pick a `focus`, then return matching workouts with the best match first, each with a `reason` that explains the choice.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Baseline: 4 of 5 fail. A failure means a model is missing required-field validation (`Team`, `Activity`, `Workout`).
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Baseline: 4 of 4 fail. A failure means a route is missing or returns the wrong shape (empty leaderboard, missing suggestion `reason`) or does not give a deliberate 4xx on bad input.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Baseline: 15 of 15 fail. A failure means a page still shows the "Implementation pending" placeholder or does not render the `role="alert"` error state.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - A failure means a TypeScript error in the backend.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - A failure means a TypeScript or Vite error in the frontend.

Run in this order: data, API, frontend, then both builds. Do not commit or push until the tier's tests pass.
