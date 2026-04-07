/**
 * Cliente Zentto Auth para zentto-tickets.
 *
 * Expone DOS instancias del SDK @zentto/auth-client:
 *   - authClient (browser, withCredentials=true) — para componentes
 *   - getServerAuthClient() (server, lazy) — para NextAuth provider, Route Handlers
 */
import { createAuthClient, AuthClientError, type AuthClient } from '@zentto/auth-client';

const APP_ID = 'zentto-tickets';

const clientBaseUrl =
  process.env.NEXT_PUBLIC_AUTH_URL ?? 'https://authdev.zentto.net';

export const authClient = createAuthClient({
  baseUrl: clientBaseUrl,
  appId: APP_ID,
});

let _serverClient: AuthClient | null = null;

export function getServerAuthClient(): AuthClient {
  if (!_serverClient) {
    const baseUrl =
      process.env.AUTH_SERVICE_URL ||
      process.env.NEXT_PUBLIC_AUTH_URL ||
      'https://authdev.zentto.net';
    _serverClient = createAuthClient({
      baseUrl,
      appId: APP_ID,
      withCredentials: false,
    });
  }
  return _serverClient;
}

export { AuthClientError };
