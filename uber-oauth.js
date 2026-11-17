const axios = require('axios');

const AUTHORIZE_URL = 'https://login.uber.com/oauth/v2/authorize';
const TOKEN_URL = 'https://login.uber.com/oauth/v2/token';

class UberOAuth {
    constructor(options, httpClient = axios) {
        this.clientId = options.client_id;
        this.clientSecret = options.client_secret;
        this.redirectUri = options.redirect_uri;
        this.httpClient = httpClient;

        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            throw new Error('UBER_CLIENT_ID, UBER_CLIENT_SECRET and UBER_REDIRECT_URI are required');
        }
    }

    getAuthorizeUrl(scopes) {
        if (!Array.isArray(scopes) || scopes.length === 0) {
            throw new Error('At least one Uber scope is required');
        }

        const url = new URL(AUTHORIZE_URL);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('redirect_uri', this.redirectUri);
        url.searchParams.set('scope', scopes.join(' '));
        return url.toString();
    }

    async authorizationAsync(options) {
        const grantType = options && Object.hasOwn(options, 'authorization_code')
            ? 'authorization_code'
            : 'refresh_token';
        const credential = options && options[grantType];
        if (typeof credential !== 'string' || !credential) {
            throw new Error(`A valid ${grantType} is required`);
        }

        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: grantType,
            [grantType === 'authorization_code' ? 'code' : 'refresh_token']: credential
        });
        const response = await this.httpClient.post(TOKEN_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const data = typeof response.data === 'string'
            ? Object.fromEntries(new URLSearchParams(response.data))
            : response.data;
        if (!data || typeof data.access_token !== 'string' || !data.access_token) {
            throw new Error('Uber token response did not contain an access token');
        }

        const tokenExpiration = new Date(Date.now() + Number(data.expires_in) * 1000);
        return [data.access_token, data.refresh_token, data.scope, tokenExpiration];
    }
}

module.exports = UberOAuth;
