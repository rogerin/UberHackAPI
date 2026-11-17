const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { format } = require('node:util');

process.env.UBER_CLIENT_ID = 'synthetic-client';
process.env.UBER_CLIENT_SECRET = 'synthetic-secret';
process.env.UBER_REDIRECT_URI = 'http://localhost:3000/api/callback';
process.env.UBER_ACCESS_TOKEN = 'synthetic-monitor-only';
process.env.GOOGLE_MAPS_API_KEY = 'synthetic-maps-key';

const axios = require('axios');
const servers = [
    ['app.js', require('../app')],
    ['horadeir.js', require('../horadeir')]
];

function cookie(response) {
    return response.headers.get('set-cookie').split(';')[0];
}

async function login(base, priorCookie) {
    const response = await fetch(`${base}/api/login`, {
        redirect: 'manual',
        headers: priorCookie ? { Cookie: priorCookie } : {}
    });
    assert.equal(response.status, 302);
    assert.match(response.headers.get('cache-control'), /no-store/);
    const setCookie = response.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Path=\//i);
    const authorize = new URL(response.headers.get('location'));
    assert.equal(authorize.origin, 'https://login.uber.com');
    assert.equal(authorize.searchParams.get('scope'), 'history profile request places');
    assert.ok(authorize.searchParams.get('state').length >= 32);
    return { cookie: cookie(response), state: authorize.searchParams.get('state') };
}

async function request(base, path, sessionCookie) {
    return fetch(base + path, { headers: sessionCookie ? { Cookie: sessionCookie } : {} });
}

for (const [name, app] of servers) {
    test(`${name} binds OAuth state and bearer tokens to one browser session`, async () => {
        const originalPost = axios.post;
        const originalGet = axios.get;
        const originalLog = console.log;
        const originalError = console.error;
        const logs = [];
        const upstream = [];
        let tokenPosts = 0;
        let resolveDeferred;
        let deferredReady;
        const deferredStarted = new Promise(resolve => { deferredReady = resolve; });

        axios.post = async (url, body, config) => {
            upstream.push({ url, authorization: config?.headers?.Authorization });
            if (url === 'https://login.uber.com/oauth/v2/token') {
                tokenPosts++;
                const code = new URLSearchParams(body).get('code');
                if (code === 'failure') throw new Error('Synthetic token exchange failure');
                if (code === 'deferred') {
                    await new Promise(resolve => {
                        resolveDeferred = resolve;
                        deferredReady();
                    });
                }
                return { data: {
                    access_token: `synthetic-access-${code}`,
                    refresh_token: `synthetic-refresh-${code}`,
                    scope: 'history profile',
                    expires_in: 3600
                } };
            }
            if (url.includes('/requests/estimate')) {
                return { data: { fare: { value: 42, fare_id: 'synthetic-fare', display: '$42' } } };
            }
            throw new Error('Unexpected upstream POST');
        };
        axios.get = async (url, config) => {
            upstream.push({ url, authorization: config?.headers?.Authorization });
            return { data: { syntheticPrivateData: true } };
        };
        console.log = (...args) => logs.push(format(...args));
        console.error = (...args) => logs.push(format(...args));

        const server = app.listen(0, '127.0.0.1');
        try {
            await once(server, 'listening');
            const base = `http://127.0.0.1:${server.address().port}`;
            const bearerPaths = name === 'horadeir.js'
                ? ['/api/me', '/api/products', '/api/payment-methods', '/api/history',
                    '/api/requests/current', '/api/estimates/price', '/api/requests/estimate']
                : ['/api/me', '/api/payment-methods', '/api/history', '/api/requests/current'];
            for (const path of bearerPaths) {
                assert.equal((await request(base, path)).status, 401, path);
            }
            assert.equal(upstream.length, 0);

            const a = await login(base);
            const b = await login(base);
            assert.notEqual(a.cookie, b.cookie);
            assert.notEqual(a.state, b.state);

            for (const path of [
                '/api/callback?code=a',
                '/api/callback?code=a&state=wrong',
                `/api/callback?code=a&state=${encodeURIComponent('é'.repeat(43))}`,
                `/api/callback?code=a&state=${encodeURIComponent(b.state)}`
            ]) {
                assert.equal((await request(base, path, a.cookie)).status, 400);
            }
            assert.equal((await request(base,
                `/api/callback?code=a&state=${encodeURIComponent(a.state)}`, b.cookie)).status, 400);
            assert.equal(tokenPosts, 0);

            const callbackA = await request(base,
                `/api/callback?code=a&state=${encodeURIComponent(a.state)}`, a.cookie);
            assert.equal(callbackA.status, 200);
            assert.match(callbackA.headers.get('cache-control'), /no-store/);
            const bodyA = await callbackA.json();
            assert.equal(bodyA.authorizedScopes, 'history profile');
            assert.equal('access_token' in bodyA, false);
            assert.equal('refresh_token' in bodyA, false);
            const authorizedA = cookie(callbackA);
            assert.notEqual(authorizedA, a.cookie);
            assert.equal((await request(base,
                `/api/callback?code=a&state=${encodeURIComponent(a.state)}`, a.cookie)).status, 400);
            assert.equal(tokenPosts, 1);

            const otherBeforeLogin = await request(base, '/api/me', b.cookie);
            assert.equal(otherBeforeLogin.status, 401);
            const meA = await request(base, '/api/me', authorizedA);
            assert.equal(meA.status, 200);
            assert.match(meA.headers.get('cache-control'), /no-store/);
            assert.equal(upstream.at(-1).authorization, 'Bearer synthetic-access-a');

            const callbackB = await request(base,
                `/api/callback?code=b&state=${encodeURIComponent(b.state)}`, b.cookie);
            assert.equal(callbackB.status, 200);
            const authorizedB = cookie(callbackB);
            const meB = await request(base, '/api/me', authorizedB);
            assert.equal(meB.status, 200);
            assert.equal(upstream.at(-1).authorization, 'Bearer synthetic-access-b');
            await request(base, '/api/history', authorizedA);
            assert.equal(upstream.at(-1).authorization, 'Bearer synthetic-access-a');

            if (name === 'horadeir.js') {
                const before = upstream.length;
                assert.equal((await request(base, '/api/requests/estimate')).status, 401);
                assert.equal(upstream.length, before);
                assert.equal((await request(base, '/api/requests/estimate', authorizedB)).status, 200);
                assert.equal(upstream.at(-1).authorization, 'Bearer synthetic-access-b');
                assert.equal(upstream.some(call => call.authorization === 'Bearer synthetic-monitor-only'), false);
            }

            const expired = await login(base);
            const originalNow = Date.now;
            try {
                Date.now = () => originalNow() + 11 * 60 * 1000;
                assert.equal((await request(base,
                    `/api/callback?code=expired&state=${encodeURIComponent(expired.state)}`,
                    expired.cookie)).status, 400);
            } finally {
                Date.now = originalNow;
            }
            assert.equal(tokenPosts, 2);

            const noCode = await login(base);
            const missingCode = await request(base,
                `/api/callback?state=${encodeURIComponent(noCode.state)}`, noCode.cookie);
            assert.equal(missingCode.status, 400);
            assert.match(missingCode.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
            assert.equal((await request(base,
                `/api/callback?code=late&state=${encodeURIComponent(noCode.state)}`,
                noCode.cookie)).status, 400);
            assert.equal(tokenPosts, 2);

            const failed = await login(base);
            const failedCallback = await request(base,
                `/api/callback?code=failure&state=${encodeURIComponent(failed.state)}`,
                failed.cookie);
            assert.equal(failedCallback.status, 502);
            assert.match(failedCallback.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
            assert.equal((await request(base,
                `/api/callback?code=failure&state=${encodeURIComponent(failed.state)}`,
                failed.cookie)).status, 400);
            assert.equal(tokenPosts, 3);

            const deferred = await login(base);
            const firstExchange = request(base,
                `/api/callback?code=deferred&state=${encodeURIComponent(deferred.state)}`,
                deferred.cookie);
            await deferredStarted;
            assert.equal((await request(base,
                `/api/callback?code=deferred&state=${encodeURIComponent(deferred.state)}`,
                deferred.cookie)).status, 400);
            resolveDeferred();
            assert.equal((await firstExchange).status, 200);
            assert.equal(tokenPosts, 4);

            if (name === 'app.js') {
                let firstPending;
                for (let i = 0; i < 1025; i++) {
                    const pending = await login(base);
                    if (i === 0) firstPending = pending;
                }
                assert.equal((await request(base,
                    `/api/callback?code=evicted&state=${encodeURIComponent(firstPending.state)}`,
                    firstPending.cookie)).status, 400);
                assert.equal(tokenPosts, 4);
                assert.equal((await request(base, '/api/me', authorizedA)).status, 200);
                assert.equal(upstream.at(-1).authorization, 'Bearer synthetic-access-a');
            }

            assert.equal(logs.some(line => /synthetic-access|synthetic-refresh|syntheticPrivateData/.test(line)), false);

            const beforeExpiry = upstream.length;
            try {
                Date.now = () => originalNow() + 61 * 60 * 1000;
                assert.equal((await request(base, '/api/me', authorizedA)).status, 401);
            } finally {
                Date.now = originalNow;
            }
            assert.equal(upstream.length, beforeExpiry);

            const priorEnvironment = process.env.NODE_ENV;
            try {
                process.env.NODE_ENV = 'production';
                const secureLogin = await fetch(`${base}/api/login`, { redirect: 'manual' });
                assert.match(secureLogin.headers.get('set-cookie'), /Secure/i);
            } finally {
                if (priorEnvironment === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = priorEnvironment;
            }
        } finally {
            axios.post = originalPost;
            axios.get = originalGet;
            console.log = originalLog;
            console.error = originalError;
            server.close();
            await once(server, 'close');
        }
    });
}
