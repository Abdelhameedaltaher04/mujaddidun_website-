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
- Laravel's API middleware stack is configured through `statefulApi()`, with
  Sanctum available for future `auth:sanctum` route protection.
- CORS allows configured frontend origins through `CORS_ALLOWED_ORIGINS` and
  supports credentialed Sanctum requests.
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

## Clean architecture

Domain boundaries are prepared under:

- `app/Http/Controllers/Api/V1`
- `app/Http/Requests/Api/V1`
- `app/Http/Resources/Api/V1`
- `app/Models`
- `app/Repositories`
- `app/Services`

Each boundary contains folders for `Auth`, `News`, `Events`, `Programs`,
`Gallery`, `Volunteers`, `Donations`, `Contact`, `Dashboard`, `Users`, `Roles`,
and `Settings`. Empty folders are retained with `.gitkeep` files until their
business capabilities are implemented.

`BaseController`, `ApiResponse`, `ApiFormRequest`, and the exception
configuration in `bootstrap/app.php` form the shared API foundation. Domain
controllers, services, repositories, models, migrations, and business routes
are intentionally not implemented in this phase.

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

## Deployment preparation

Before deployment, copy `.env.example` to the environment's protected `.env`
file and provide:

- `APP_KEY`, `APP_URL`, and production environment settings;
- MySQL connection values (`DB_HOST`, `DB_PORT`, `DB_DATABASE`,
  `DB_USERNAME`, and `DB_PASSWORD`);
- production frontend origins in `CORS_ALLOWED_ORIGINS`;
- matching `SANCTUM_STATEFUL_DOMAINS` values for cookie-based authentication.

Run Laravel's normal production optimization commands only in the deployment
environment. Secrets and environment-specific credentials must not be
committed.