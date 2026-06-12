import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { FileBackedOAuthProvider } from './oauth-provider.js';
import type { LLMTool } from '../llm/types.js';

export interface ConnectedMcpClient {
  client: Client;
  tools: Array<{ name: string; description?: string; inputSchema: LLMTool['input_schema'] }>;
  serverName: string;
}

export const SERVER_CONFIG = {
  swiggy: { url: 'https://mcp.swiggy.com/food', port: 3491 },
  zomato: { url: 'https://mcp-server.zomato.com/mcp', port: 3492 },
} as const;

export type ServerName = keyof typeof SERVER_CONFIG;

export async function createMcpClient(serverName: ServerName): Promise<ConnectedMcpClient> {
  const { url, port } = SERVER_CONFIG[serverName];
  const authProvider = new FileBackedOAuthProvider(serverName, port);

  const transport = new StreamableHTTPClientTransport(new URL(url), { authProvider });
  const client = new Client({ name: 'kuch-bhi', version: '1.0.0' }, { capabilities: {} });

  try {
    await client.connect(transport);
  } catch (err) {
    const msg = String(err);
    if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('unauthorized')) {
      throw new Error(
        `Not authenticated with ${serverName}. Run: npx kuch-bhi connect ${serverName}`,
      );
    }
    throw err;
  }

  const { tools } = await client.listTools();

  return {
    client,
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as LLMTool['input_schema'],
    })),
    serverName,
  };
}
