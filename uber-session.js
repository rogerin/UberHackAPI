const { randomBytes, timingSafeEqual } = require('node:crypto');

const COOKIE_NAME = 'uber_session';
const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PENDING_SESSIONS = 1024;
const MAX_AUTHORIZED_SESSIONS = 1024;
const SCOPES = ['history', 'profile', 'request', 'places'];

function nonce() {
    return randomBytes(32).toString('base64url');
}

function sessionId(req) {
    const cookies = (req.headers.cookie || '').split(';');
    const matches = cookies
        .map(cookie => cookie.trim())
        .filter(cookie => cookie.startsWith(`${COOKIE_NAME}=`));

    if (matches.length !== 1) return null;
    const id = matches[0].slice(COOKIE_NAME.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(id) ? id : null;
}

function matchesState(actual, expected) {
    if (typeof actual !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(actual)) return false;
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function cookieOptions(req, maxAge) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' || req.secure,
        path: '/',
        maxAge
    };
}

function clearCookie(req, res) {
    const { maxAge, ...options } = cookieOptions(req);
    res.clearCookie(COOKIE_NAME, options);
}

function createUberSession(getUber) {
    const pendingSessions = new Map();
    const authorizedSessions = new Map();

    function findSession(req, store) {
        const id = sessionId(req);
        const session = id && store.get(id);
        if (!session) return null;
        if (session.expiresAt <= Date.now()) {
            store.delete(id);
            return null;
        }
        return { id, session };
    }

    function login(req, res) {
        res.set('Cache-Control', 'no-store');
        for (const store of [pendingSessions, authorizedSessions]) {
            for (const [id, session] of store) {
                if (session.expiresAt <= Date.now()) store.delete(id);
            }
        }

        const state = nonce();
        let url;
        try {
            url = getUber().getAuthorizeUrl(SCOPES, state);
        } catch (_) {
            return res.status(503).json({ error: 'Uber authorization unavailable' });
        }

        const previous = sessionId(req);
        if (previous) {
            pendingSessions.delete(previous);
            authorizedSessions.delete(previous);
        }
        if (pendingSessions.size >= MAX_PENDING_SESSIONS) {
            pendingSessions.delete(pendingSessions.keys().next().value);
        }
        const id = nonce();
        pendingSessions.set(id, { pendingState: state, expiresAt: Date.now() + STATE_TTL_MS });
        res.cookie(COOKIE_NAME, id, cookieOptions(req, STATE_TTL_MS));
        return res.redirect(url);
    }

    async function callback(req, res) {
        res.set('Cache-Control', 'no-store');
        const pending = findSession(req, pendingSessions);
        if (!pending || !pending.session.pendingState ||
            !matchesState(req.query.state, pending.session.pendingState)) {
            return res.status(400).json({ error: 'Invalid or expired Uber OAuth state' });
        }

        // Consume the state before any asynchronous token exchange, including failures.
        pendingSessions.delete(pending.id);
        if (typeof req.query.code !== 'string' || !req.query.code) {
            clearCookie(req, res);
            return res.status(400).json({ error: 'Missing Uber authorization code' });
        }

        try {
            const [accessToken, , authorizedScopes, tokenExpiration] =
                await getUber().authorizationAsync({ authorization_code: req.query.code });
            const expiry = new Date(tokenExpiration).getTime();
            const now = Date.now();
            if (!accessToken || !Number.isFinite(expiry) || expiry <= now) {
                throw new Error('Invalid Uber token expiry');
            }

            const maxAge = Math.min(expiry - now, MAX_TOKEN_TTL_MS);
            for (const [id, session] of authorizedSessions) {
                if (session.expiresAt <= now) authorizedSessions.delete(id);
            }
            if (authorizedSessions.size >= MAX_AUTHORIZED_SESSIONS) {
                clearCookie(req, res);
                return res.status(503).json({ error: 'Uber authorization temporarily unavailable' });
            }
            const id = nonce();
            authorizedSessions.set(id, { accessToken, expiresAt: now + maxAge });
            res.cookie(COOKIE_NAME, id, cookieOptions(req, maxAge));
            return res.json({ authorizedScopes, tokenExpiration });
        } catch (_) {
            clearCookie(req, res);
            return res.status(502).json({ error: 'Uber authorization failed' });
        }
    }

    function requireToken(req, res, next) {
        res.set('Cache-Control', 'no-store');
        const active = findSession(req, authorizedSessions);
        if (!active || !active.session.accessToken) {
            return res.status(401).json({ error: 'Uber authorization required' });
        }
        res.locals.uberAccessToken = active.session.accessToken;
        return next();
    }

    return { login, callback, requireToken };
}

module.exports = createUberSession;
