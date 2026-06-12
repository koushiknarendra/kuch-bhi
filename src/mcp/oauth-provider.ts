import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientMetadata, OAuthTokens, OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { readConfig, writeConfig } from '../config.js';

export class FileBackedOAuthProvider implements OAuthClientProvider {
  constructor(
    private readonly serverName: string,
    private readonly port: number,
  ) {}

  get redirectUrl(): string {
    return `http://localhost:${this.port}/oauth/callback`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: 'kuch-bhi',
      redirect_uris: [this.redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
  }

  clientInformation(): OAuthClientInformationFull | undefined {
    const info = readConfig().servers?.[this.serverName]?.clientInfo;
    return info as OAuthClientInformationFull | undefined;
  }

  async saveClientInformation(info: OAuthClientInformationFull): Promise<void> {
    const cfg = readConfig();
    cfg.servers ??= {};
    cfg.servers[this.serverName] = {
      ...(cfg.servers[this.serverName] ?? {}),
      clientInfo: info as Record<string, unknown>,
    };
    writeConfig(cfg);
  }

  tokens(): OAuthTokens | undefined {
    const tokens = readConfig().servers?.[this.serverName]?.tokens;
    return tokens as OAuthTokens | undefined;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    const cfg = readConfig();
    cfg.servers ??= {};
    cfg.servers[this.serverName] = {
      ...(cfg.servers[this.serverName] ?? {}),
      tokens: tokens as Record<string, unknown>,
    };
    writeConfig(cfg);
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // Some providers (e.g. Zomato) require a `state` param that the MCP SDK omits.
    // Inject one and store it so the callback server can verify it.
    if (!authorizationUrl.searchParams.has('state')) {
      const state = crypto.randomUUID();
      authorizationUrl.searchParams.set('state', state);
      const cfg = readConfig();
      cfg.servers ??= {};
      cfg.servers[this.serverName] = { ...(cfg.servers[this.serverName] ?? {}), oauthState: state };
      writeConfig(cfg);
    }

    const { default: open } = await import('open');
    console.log(`\nOpening ${this.serverName} in browser for authorization...`);
    console.log(`If the browser doesn't open, visit:\n  ${authorizationUrl.toString()}\n`);
    await open(authorizationUrl.toString());
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    const cfg = readConfig();
    cfg.servers ??= {};
    cfg.servers[this.serverName] = {
      ...(cfg.servers[this.serverName] ?? {}),
      codeVerifier,
    };
    writeConfig(cfg);
  }

  codeVerifier(): string {
    const v = readConfig().servers?.[this.serverName]?.codeVerifier;
    if (!v) throw new Error(
      `No PKCE code verifier for ${this.serverName}. Run: kuch-bhi connect ${this.serverName}`,
    );
    return v;
  }
}
