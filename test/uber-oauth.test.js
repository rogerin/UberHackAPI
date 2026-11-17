const test = require('node:test');
const assert = require('node:assert/strict');
const UberOAuth = require('../uber-oauth');

const options = {
    client_id: 'test-client',
    client_secret: 'test-secret',
    redirect_uri: 'http://localhost:3000/api/callback'
};

test('authorization URL preserves the Uber OAuth scopes and redirect', () => {
    const uber = new UberOAuth(options);
    const state = 'a'.repeat(43);
    const url = new URL(uber.getAuthorizeUrl(['history', 'profile', 'request', 'places'], state));

    assert.equal(url.origin, 'https://login.uber.com');
    assert.equal(url.pathname, '/oauth/v2/authorize');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('client_id'), options.client_id);
    assert.equal(url.searchParams.get('redirect_uri'), options.redirect_uri);
    assert.equal(url.searchParams.get('scope'), 'history profile request places');
    assert.equal(url.searchParams.get('state'), state);
    assert.throws(() => uber.getAuthorizeUrl(['profile']), /state/);
    assert.throws(() => uber.getAuthorizeUrl(['profile'], 'short'), /state/);
});

test('authorization code exchange uses form data and preserves the token tuple', async () => {
    const requests = [];
    const client = {
        async post(url, body, config) {
            requests.push({ url, body, config });
            return { data: {
                access_token: 'test-access',
                refresh_token: 'test-refresh',
                scope: 'history profile',
                expires_in: 3600
            } };
        }
    };
    const uber = new UberOAuth(options, client);
    const before = Date.now();
    const [access, refresh, scope, expiry] = await uber.authorizationAsync({ authorization_code: 'test-code' });

    assert.equal(requests[0].url, 'https://login.uber.com/oauth/v2/token');
    assert.equal(requests[0].config.headers['Content-Type'], 'application/x-www-form-urlencoded');
    const body = new URLSearchParams(requests[0].body);
    assert.equal(body.get('grant_type'), 'authorization_code');
    assert.equal(body.get('code'), 'test-code');
    assert.equal(body.get('client_id'), options.client_id);
    assert.equal(body.get('client_secret'), options.client_secret);
    assert.equal(body.get('redirect_uri'), options.redirect_uri);
    assert.equal(access, 'test-access');
    assert.equal(refresh, 'test-refresh');
    assert.equal(scope, 'history profile');
    assert.ok(expiry.getTime() >= before + 3600_000);
});

test('refresh grant uses refresh_token and rejects missing credentials before HTTP', async () => {
    let calls = 0;
    const uber = new UberOAuth(options, {
        async post(_url, body) {
            calls++;
            assert.equal(new URLSearchParams(body).get('grant_type'), 'refresh_token');
            assert.equal(new URLSearchParams(body).get('refresh_token'), 'test-refresh');
            return { data: { access_token: 'renewed', expires_in: 60 } };
        }
    });

    await uber.authorizationAsync({ refresh_token: 'test-refresh' });
    await assert.rejects(uber.authorizationAsync({ authorization_code: '' }), /valid authorization_code/);
    await assert.rejects(uber.authorizationAsync({}), /valid refresh_token/);
    assert.equal(calls, 1);
});

test('missing OAuth configuration or access token fails closed', async () => {
    assert.throws(() => new UberOAuth({ ...options, client_secret: '' }), /UBER_CLIENT_SECRET/);
    const uber = new UberOAuth(options, { async post() { return { data: { scope: 'profile' } }; } });
    await assert.rejects(uber.authorizationAsync({ authorization_code: 'test-code' }), /access token/);
});
