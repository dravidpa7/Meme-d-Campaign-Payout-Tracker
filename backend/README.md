# Memed Backend API

REST API for brand campaigns, creator submissions, and creator earnings.

## Run locally

Requirements: Node.js 20 or later, MongoDB, and optionally Redis.

Configure the following environment variables before starting the server:

| Variable         | Required | Default / example                           |
| ---------------- | -------- | ------------------------------------------- |
| `MONGO_URI`      | Yes      | `mongodb://localhost:27017/memed`           |
| `JWT_SECRET`     | Yes      | A secret string at least 16 characters long |
| `PORT`           | No       | `4000`                                      |
| `JWT_EXPIRES_IN` | No       | `1d`                                        |
| `REDIS_URL`      | No       | Omit to run without Redis caching           |
| `CORS_ORIGIN`    | No       | `http://localhost:3000`                     |

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API base URL is `http://localhost:4000/api`. To load local sample records, run `npm run seed`. **Seeding deletes existing users, campaigns, submissions, and payouts before recreating the samples.** All seeded users have the password `Password123!`:

| Role    | Email                 |
| ------- | --------------------- |
| Brand   | `brand@example.com`   |
| Brand   | `hype@example.com`    |
| Creator | `arjun@example.com`   |
| Creator | `priya@example.com`   |
| Creator | `karthik@example.com` |

## Conventions

- All endpoints are under `/api` and accept/return JSON.
- Protected routes use `Authorization: Bearer <token>`. Obtain a token from signup or login.
- Roles are `brand` and `creator`. Campaign creation and brand campaign listing require `brand`; submission and earnings routes require `creator`.
- Budgets and payouts are integer amounts in rupees.
- Successful resource responses use `{ "data": ... }`, except `/api/health`.
- IDs in the examples are mock 24-character MongoDB ObjectIds. Use IDs returned by your running API or seed script in actual requests.

## Endpoints

### Health

`GET /api/health` — no authentication.

Response `200`:

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### Authentication

#### Sign up

`POST /api/auth/signup` — creates an account and returns a bearer token.

Request:

```json
{
  "name": "Mina Creator",
  "email": "mina@example.com",
  "password": "Password123!",
  "role": "creator"
}
```

`name` must be 2-60 characters, `email` must be valid, `password` must be 8-72 characters, and `role` must be `brand` or `creator`.

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "66f100000000000000000001",
      "name": "Mina Creator",
      "email": "mina@example.com",
      "role": "creator"
    },
    "token": "<jwt-token>"
  }
}
```

#### Log in

`POST /api/auth/login` — returns a bearer token for an existing account.

Request:

```json
{
  "email": "arjun@example.com",
  "password": "Password123!"
}
```

Response `200` has the same shape as signup. Invalid credentials return `401`.

### Campaigns

#### Browse live campaigns

`GET /api/campaigns` — any authenticated user.

Response `200`:

```json
{
  "data": [
    {
      "id": "66f100000000000000000010",
      "brandId": "66f100000000000000000002",
      "name": "YouTube Shorts Push",
      "platform": "YouTube",
      "totalBudget": 10000,
      "remainingBudget": 8200,
      "spent": 1800,
      "milestones": [
        { "views": 5000, "payout": 300 },
        { "views": 25000, "payout": 1500 },
        { "views": 100000, "payout": 6000 }
      ],
      "status": "live",
      "createdAt": "2026-10-01T10:00:00.000Z"
    }
  ]
}
```

#### List your brand's campaigns

`GET /api/campaigns/mine` — authenticated `brand`.

Response `200`: `{ "data": [<campaign>, ...] }`, using the campaign object shown above. This list includes the brand's campaigns regardless of status.

#### Create a campaign

`POST /api/campaigns` — authenticated `brand`.

Request:

```json
{
  "name": "Summer Meme Promo",
  "platform": "Instagram",
  "totalBudget": 5000,
  "milestones": [
    { "views": 10000, "payout": 500 },
    { "views": 50000, "payout": 2000 },
    { "views": 100000, "payout": 5000 }
  ]
}
```

`name` must be 2-100 characters; `platform` must be `Instagram` or `YouTube`; `totalBudget`, milestone `views`, and milestone `payout` must be positive integers. Supply 1-20 milestones in valid ascending order.

Response `201`: `{ "data": <created campaign> }` with the campaign object shape shown above.

### Submissions

#### Submit a post

`POST /api/submissions` — authenticated `creator`.

Request:

```json
{
  "campaignId": "66f100000000000000000010",
  "postUrl": "https://youtube.com/shorts/my-post"
}
```

`campaignId` must be a 24-character ObjectId. `postUrl` must be an HTTP(S) URL hosted on the campaign's platform (Instagram or YouTube).

Response `201`:

```json
{
  "data": {
    "id": "66f100000000000000000020",
    "campaignId": "66f100000000000000000010",
    "campaignName": "YouTube Shorts Push",
    "postUrl": "https://youtube.com/shorts/my-post",
    "views": 0,
    "eligiblePayout": 0,
    "allocatedPayout": 0,
    "flagged": false,
    "viewsUpdatedAt": "2026-10-14T10:00:00.000Z"
  }
}
```

#### List your submissions

`GET /api/submissions/mine` — authenticated `creator`.

Response `200`:

```json
{
  "data": [
    {
      "id": "66f100000000000000000021",
      "campaignId": "66f100000000000000000010",
      "campaignName": "YouTube Shorts Push",
      "postUrl": "https://youtube.com/shorts/exampleC",
      "views": 30000,
      "eligiblePayout": 1500,
      "allocatedPayout": 1500,
      "flagged": false,
      "viewsUpdatedAt": "2026-10-11T10:00:00.000Z"
    }
  ]
}
```

#### Update a submission's views

`PATCH /api/submissions/:id/views` — no authentication; intended to simulate platform view updates. Replace `:id` with a submission ObjectId.

Request:

```json
{
  "views": 8000
}
```

`views` must be a non-negative integer.

Response `200`:

```json
{
  "data": {
    "submissionId": "66f100000000000000000020",
    "views": 8000,
    "eligiblePayout": 300,
    "allocatedPayout": 300,
    "paidNow": 300,
    "isPartial": false,
    "flagged": false
  }
}
```

The payout is based on the highest crossed campaign milestone and the remaining campaign budget. Repeating an update does not pay the same milestone twice; `paidNow` reports the amount paid by this update.

### Earnings

#### Get your earnings

`GET /api/earnings/me` — authenticated `creator`.

Response `200`:

```json
{
  "data": {
    "totalEarnings": 2300,
    "payoutCount": 3
  }
}
```

`totalEarnings` is in rupees; `payoutCount` is the number of payout ledger entries.

## Errors

Errors use this shape; `details` is omitted when there is no additional information:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

Common HTTP statuses are `400` for invalid input or malformed JSON, `401` for missing/invalid credentials, `403` for a role that cannot access the route, `404` for a missing resource or route, `409` for conflicts such as duplicate accounts/submissions, `429` for rate limiting, and `500` for unexpected server errors. Error codes include `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, and `INTERNAL_ERROR`.
