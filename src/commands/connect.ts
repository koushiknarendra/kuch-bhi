import * as http from 'node:http';
import { auth } from '@modelcontextprotocol/sdk/client/auth.js';
import { FileBackedOAuthProvider } from '../mcp/oauth-provider.js';
import { SERVER_CONFIG, type ServerName } from '../mcp/client.js';

export async function connectCommand(serverName: ServerName): Promise<void> {
  const { url, port } = SERVER_CONFIG[serverName];
  const provider = new FileBackedOAuthProvider(serverName, port);

  console.log(`Connecting to ${serverName}...`);
  console.log(`Callback will be received on http://localhost:${port}/oauth/callback`);

  // Phase 1: discover, register client, generate PKCE, open browser
  const phase1 = await auth(provider, { serverUrl: url });

  if (phase1 === 'AUTHORIZED') {
    console.log(`Already authorized with ${serverName}.`);
    return;
  }

  // phase1 === 'REDIRECT' — browser is open, wait for callback
  const code = await waitForCallback(port);

  // Phase 2: exchange code + PKCE verifier for tokens
  const phase2 = await auth(provider, { serverUrl: url, authorizationCode: code });

  if (phase2 === 'AUTHORIZED') {
    console.log(`\nSuccessfully connected to ${serverName}!`);
    console.log(`Credentials saved to ~/.config/kuch-bhi/config.json`);
  } else {
    throw new Error('Token exchange did not complete. Try running connect again.');
  }
}

function waitForCallback(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url!, `http://localhost:${port}`);
      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html><body style="font-family:sans-serif;text-align:center;padding:60px">
            <h2>Authorization successful!</h2>
            <p>You can close this tab and return to your terminal.</p>
          </body></html>
        `);
        server.close();
        resolve(code);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h2>Authorization failed: ${error ?? 'unknown'}</h2></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${error ?? 'unknown'}`));
      }
    });

    server.listen(port, () => {
      console.log(`Waiting for authorization callback... (timeout: 5 minutes)`);
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth callback timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    server.once('close', () => clearTimeout(timeout));
  });
}
