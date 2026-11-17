const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

process.env.UBER_CLIENT_ID = 'test-client';
process.env.UBER_CLIENT_SECRET = 'test-secret';
process.env.UBER_REDIRECT_URI = 'http://localhost:3000/api/callback';

const axios = require('axios');
const app = require('../app');

test('Express 5 login and callback keep the OAuth route contract', async () => {
    const originalPost = axios.post;
    const server = app.listen(0);
    try {
        await once(server, 'listening');
        const base = `http://127.0.0.1:${server.address().port}`;
        const login = await fetch(`${base}/api/login`, { redirect: 'manual' });
        assert.equal(login.status, 302);
        const authorizeUrl = new URL(login.headers.get('location'));
        assert.equal(authorizeUrl.origin, 'https://login.uber.com');
        assert.equal(authorizeUrl.searchParams.get('scope'), 'history profile request places');

        axios.post = async (_url, body) => {
            assert.equal(new URLSearchParams(body).get('code'), 'test-code');
            return { data: {
                access_token: 'test-access',
                refresh_token: 'test-refresh',
                scope: 'history profile',
                expires_in: 3600
            } };
        };
        const callback = await fetch(`${base}/api/callback?code=test-code`);
        assert.equal(callback.status, 200);
        const data = await callback.json();
        assert.equal(data.access_token, 'test-access');
        assert.equal(data.refresh_token, 'test-refresh');
        assert.equal(data.authorizedScopes, 'history profile');

        const missingCode = await fetch(`${base}/api/callback`);
        assert.equal(missingCode.status, 502);
        assert.deepEqual(await missingCode.json(), { error: 'Uber authorization failed' });
    } finally {
        axios.post = originalPost;
        server.close();
        await once(server, 'close');
    }
});
