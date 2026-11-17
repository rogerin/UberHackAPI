# UberHackAPI

Experimental Express API for Uber OAuth and ride endpoints, plus `horadeir.js`, a price polling script. This repository is a development example and does not include production session storage.

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

`UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`, and `UBER_REDIRECT_URI` are required for OAuth. The redirect URI defaults to `http://localhost:3000/api/callback` when omitted; it must match the Uber developer application's registered callback URL. `horadeir.js` uses `UBER_ACCESS_TOKEN` for its polling requests and `GOOGLE_MAPS_API_KEY` for its geocoding helper; its polling mode can start without the OAuth client credentials. Start it with `node horadeir.js "Origin" "Destination"` after exporting the variables. The current polling request still uses fixed coordinates; the command-line addresses are not wired into that request.

## API

Run `node app.js` and use these routes on port 3000:

| Route | Purpose |
| --- | --- |
| `/api/login` | Redirects to Uber OAuth authorization for history, profile, request, and places scopes. |
| `/api/callback` | Exchanges the authorization code and returns the access token, refresh token, scopes, and expiry. |
| `/api/me` | Retrieves the authenticated user's profile. |
| `/api/payment-methods` | Retrieves payment methods. |
| `/api/history` | Retrieves ride history. |
| `/api/requests/current` | Retrieves the current sandbox ride request. |

The sample keeps the most recently issued access token in process memory. Protect the callback response and configure real session handling before using this code in a deployed service.

## Security remediation

The old `node-uber` package has no maintained release that removes its vulnerable `request`, `proxy-agent`, `geocoder`, and related dependency chain. The two application files only used its OAuth URL and token exchange methods, so `uber-oauth.js` now implements those calls with the already used Axios client. Axios and Express have been updated, and the previously committed `node_modules` tree is removed from version control. Run `npm ci` to install dependencies locally.

Credentials are now read from the environment instead of source files. Any Uber or Google credentials that were previously committed remain in Git history and should be revoked and replaced in their respective developer consoles. Do not reuse the former values.
