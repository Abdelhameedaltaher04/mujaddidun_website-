# Al-Mujaddidun Laravel API

Laravel 12 backend architecture for the Al-Mujaddidun platform.

## Runtime

- PHP 8.3+
- Laravel 12
- MySQL
- Laravel Sanctum, installed and configured for future authentication work

## API foundation

- API routes are served under `/api/v1`.
- `GET /api/v1/health` is the architecture health endpoint.
- Successful JSON responses use:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

- Validation failures use `success`, `message`, and `errors`.
- API exceptions are rendered as JSON with consistent status codes.
- CORS and Sanctum stateful domains are controlled through environment variables.

## Environment

Copy `.env.example` to `.env` in a local or deployment environment, generate an
application key, and provide the MySQL connection values there. Credentials are
never committed to this repository.

The committed environment template uses MySQL, file-backed sessions/cache,
and synchronous local queues so the architecture does not require database
tables during setup.

## Current scope

This phase only establishes the backend architecture. It intentionally contains:

- No database migrations or tables
- No authentication routes or token issuance
- No domain endpoints
- No frontend integration

The domain folders under `app/Http/Controllers/Api/V1`, `app/Http/Requests`,
`app/Http/Resources`, `app/Models`, `app/Repositories`, and `app/Services`
are ready for incremental feature work.