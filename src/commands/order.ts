import { createMcpClient, type ServerName } from '../mcp/client.js';
import { buildProvider } from '../llm/index.js';
import { runAgent, type AgentMode } from '../agent/loop.js';

export async function orderCommand(mode: AgentMode = 'interactive'): Promise<void> {
  const provider = buildProvider();
  const serverNames: ServerName[] = ['swiggy', 'zomato'];
  const connectedClients = [];

  for (const name of serverNames) {
    try {
      const client = await createMcpClient(name);
      connectedClients.push(client);
    } catch (err) {
      if (mode === 'interactive') console.warn(`[skip] ${name}: ${String(err)}`);
    }
  }

  if (connectedClients.length === 0) {
    process.stderr.write('\nNo MCP servers connected. Run:\n  kuch-bhi connect swiggy\n  kuch-bhi connect zomato\n\n');
    process.exit(1);
  }

  await runAgent(provider, connectedClients, mode);
}
