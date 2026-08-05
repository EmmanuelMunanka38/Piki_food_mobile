import * as AuthSession from 'expo-auth-session';

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
const GOOGLE_CONNECTION = process.env.EXPO_PUBLIC_AUTH0_GOOGLE_CONNECTION || 'google-oauth2';
const APPLE_CONNECTION = process.env.EXPO_PUBLIC_AUTH0_APPLE_CONNECTION || 'apple';

export const AUTH0_REDIRECT_URI = AuthSession.makeRedirectUri({ path: 'callback' });

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
};

export function auth0RedirectUri(): string {
  return AUTH0_REDIRECT_URI;
}

export async function loginWithProvider(provider: 'google' | 'apple'): Promise<string> {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    throw new Error('Auth0 is not configured. Check EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID.');
  }

  const connection = provider === 'google' ? GOOGLE_CONNECTION : APPLE_CONNECTION;

  const request = new AuthSession.AuthRequest({
    clientId: AUTH0_CLIENT_ID,
    redirectUri: AUTH0_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
    usePKCE: true,
    extraParams: { connection },
  });

  await request.makeAuthUrlAsync(discovery);
  if (__DEV__) {
    console.log(`[Auth0] ${provider} authorize URL:`, request.url);
  }

  const result = await request.promptAsync(discovery);

  if (result.type === 'success') {
    const idToken = result.params?.id_token;

    if (idToken) {
      return idToken as string;
    }

    if (result.params?.code && request.codeVerifier) {
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: AUTH0_CLIENT_ID,
          code: result.params.code,
          redirectUri: AUTH0_REDIRECT_URI,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        },
        discovery,
      );
      if (tokenResponse.idToken) {
        return tokenResponse.idToken;
      }
      throw new Error('Auth0 returned no ID token after exchanging the code.');
    }

    throw new Error('No ID token was returned by Auth0.');
  }

  if (result.type === 'error') {
    const message = result.params?.error_description || result.params?.error || 'Authentication failed.';
    throw new Error(`${message} (callback: ${AUTH0_REDIRECT_URI})`);
  }

  throw new Error(
    `Authentication was cancelled. Make sure ${AUTH0_REDIRECT_URI} is added to the Auth0 app's Allowed Callback URLs.`,
  );
}
