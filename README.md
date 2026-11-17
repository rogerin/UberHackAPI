# UberHackAPI

Experimental Express API for Uber OAuth and ride endpoints, plus `horadeir.js`, a price polling script. OAuth sessions are held in process memory; this remains a development example rather than a multi-instance production session service.

## Requirements and setup

Use Node.js 18 or newer and npm. Install from the lockfile:

```sh
npm ci
npm test
```

Configure credentials as environment variables. Copy `.env.example` to a local `.env`, replace its sample values, and keep that file out of Git. With a shell such as bash or zsh:

```sh
set -a
. ./.env
set +a
node app.js
```

`UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`, and `UBER_REDIRECT_URI` are required for OAuth. The redirect URI defaults to `http://localhost:3000/api/callback` when omitted; it must match the Uber developer application's registered callback URL. Both servers listen on `127.0.0.1` by default; set `HOST` only when placing them behind a properly configured HTTPS proxy. In production (`NODE_ENV=production`), the session cookie has the `Secure` attribute and requires HTTPS to work in a browser.

`horadeir.js` uses `UBER_ACCESS_TOKEN` only for its background price polling and `GOOGLE_MAPS_API_KEY` for its geocoding helper. Its polling mode starts without OAuth client credentials; without `UBER_ACCESS_TOKEN` it does not poll. The environment token is never used for HTTP API routes. Start the monitor with `node horadeir.js "Origin" "Destination"` after exporting the variables. The current polling request still uses fixed coordinates; the command-line addresses are not wired into that request.

## API

Run `node app.js` and use these routes on port 3000:

| Route | Purpose |
| --- | --- |
| `/api/login` | Redirects to Uber OAuth authorization for history, profile, request, and places scopes. |
| `/api/callback` | Validates the one-time OAuth state, exchanges the code, and returns scopes and expiry without exposing tokens. |
| `/api/me` | Retrieves the authenticated user's profile. |
| `/api/payment-methods` | Retrieves payment methods. |
| `/api/history` | Retrieves ride history. |
| `/api/requests/current` | Retrieves the current sandbox ride request. |

`/api/login` creates an unpredictable state bound to an `HttpOnly`, `SameSite=Lax` browser cookie. The state expires after 10 minutes and is consumed before the token exchange. A successful callback rotates the cookie and keeps the access token only in that browser's server-side session. All Uber proxy routes require that session; anonymous or expired sessions receive HTTP 401. Callback and protected responses use `Cache-Control: no-store`.

Sessions are lost on process restart. Pending logins have a bounded in-memory queue; when it fills, the oldest pending login must be restarted, while already authorized sessions remain intact. A deployment with multiple workers needs shared server-side session storage, rate limiting, and an HTTPS proxy before serving remote users. The callback no longer returns access or refresh tokens, so callers must keep the browser cookie when using the API.

## Security remediation

The old `node-uber` package has no maintained release that removes its vulnerable `request`, `proxy-agent`, `geocoder`, and related dependency chain. The two application files only used its OAuth URL and token exchange methods, so `uber-oauth.js` now implements those calls with the already used Axios client. Axios and Express have been updated, and the previously committed `node_modules` tree is removed from version control. Run `npm ci` to install dependencies locally.

Credentials are now read from the environment instead of source files. Historical commits contain an Uber client secret, Uber access token, and Google Maps API key. Their owners should revoke and replace them in the respective provider consoles; changing source files does not invalidate historical credentials. The Uber client ID is an identifier rather than a secret. Do not reuse former secret values.
