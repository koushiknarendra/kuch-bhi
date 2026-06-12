import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { LLMTool } from '../llm/types.js';
import type { ConnectedMcpClient } from '../mcp/client.js';

export interface Suggestion {
  platform: string;
  restaurant: string;
  item: string;
  price: string;
  discount: string;
  rating: string;
  delivery_time: string;
  reason: string;
}

// Virtual tool injected into the LLM's tool list but handled locally (no MCP call).
const PRESENT_SUGGESTIONS_TOOL: LLMTool = {
  name: 'present_suggestions',
  description: 'Show the user a ranked list of food suggestions and ask them to pick one. Call this after researching both platforms — do NOT place any order before calling this first.',
  input_schema: {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        description: 'Ranked list of suggestions (best first). Include at least 3, max 6.',
        items: {
          type: 'object',
          properties: {
            platform:      { type: 'string', description: 'swiggy or zomato' },
            restaurant:    { type: 'string' },
            item:          { type: 'string', description: 'Specific dish to order' },
            price:         { type: 'string', description: 'e.g. ₹399' },
            discount:      { type: 'string', description: 'e.g. 20% off or "none"' },
            rating:        { type: 'string', description: 'e.g. 4.3★' },
            delivery_time: { type: 'string', description: 'e.g. 30 min' },
            reason:        { type: 'string', description: 'One-line reason why this suits the user' },
          },
          required: ['platform', 'restaurant', 'item', 'price', 'discount', 'rating', 'delivery_time', 'reason'],
        },
      },
    },
    required: ['suggestions'],
  },
};

export type SuggestionsHandler = (suggestions: Suggestion[]) => Promise<string>;

export function buildToolList(clients: ConnectedMcpClient[]): LLMTool[] {
  const mcpTools = clients.flatMap(({ serverName, tools }) =>
    tools.map(t => ({
      name: `${serverName}__${t.name}`,
      description: `[${serverName}] ${t.description ?? t.name}`,
      input_schema: t.inputSchema,
    })),
  );
  return [PRESENT_SUGGESTIONS_TOOL, ...mcpTools];
}

export async function executeTool(
  clients: ConnectedMcpClient[],
  namespacedName: string,
  args: Record<string, unknown>,
  onSuggestions: SuggestionsHandler,
): Promise<string> {
  // Handle virtual tools before namespace routing
  if (namespacedName === 'present_suggestions') {
    return onSuggestions(args.suggestions as Suggestion[]);
  }

  const sepIdx = namespacedName.indexOf('__');
  if (sepIdx === -1) throw new Error(`Tool name missing namespace separator: ${namespacedName}`);

  const serverName = namespacedName.slice(0, sepIdx);
  const toolName = namespacedName.slice(sepIdx + 2);

  const mcpClient = clients.find(c => c.serverName === serverName);
  if (!mcpClient) throw new Error(`No connected MCP client for server: ${serverName}`);

  if (toolName === 'place_food_order') {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question('\nConfirm order? [y/N] ');
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      throw new Error('Order cancelled by user.');
    }
  }

  const result = await mcpClient.client.callTool({ name: toolName, arguments: args });

  const contentBlocks = (result.content ?? []) as Array<{ type: string; text?: string }>;
  const textContent = contentBlocks
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('\n');

  return textContent || JSON.stringify(result);
}

// Interactive handler — shows suggestions, prompts user to pick via readline
export async function interactiveSuggestionsHandler(suggestions: Suggestion[]): Promise<string> {
  console.log('\n┌─────────────────────────────────────────────────────┐');
  console.log('│              Here\'s what I found for you             │');
  console.log('└─────────────────────────────────────────────────────┘\n');

  suggestions.forEach((s, i) => {
    const discount = s.discount && s.discount !== 'none' ? ` 🏷 ${s.discount}` : '';
    console.log(`  ${i + 1}. [${s.platform.toUpperCase()}] ${s.restaurant}`);
    console.log(`     ${s.item} — ${s.price}${discount}`);
    console.log(`     ${s.rating}  ·  ${s.delivery_time}`);
    console.log(`     ${s.reason}`);
    console.log();
  });

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(`Pick a number (1–${suggestions.length}), or press Enter to cancel: `);
  rl.close();

  const choice = parseInt(answer.trim(), 10);
  if (isNaN(choice) || choice < 1 || choice > suggestions.length) {
    throw new Error('No selection made.');
  }

  const picked = suggestions[choice - 1];
  console.log(`\nGoing with option ${choice}: ${picked.item} from ${picked.restaurant} on ${picked.platform}.\n`);
  return JSON.stringify({ selected: picked, choiceIndex: choice - 1 });
}

// Suggest-only handler — emits JSON sentinel to stdout and stops the agent
export async function suggestOnlyHandler(suggestions: Suggestion[]): Promise<never> {
  // Print to stderr so Claude Code can parse stdout cleanly
  process.stderr.write('\n');
  suggestions.forEach((s, i) => {
    const discount = s.discount && s.discount !== 'none' ? ` 🏷 ${s.discount}` : '';
    process.stderr.write(`  ${i + 1}. [${s.platform.toUpperCase()}] ${s.restaurant} — ${s.item} ${s.price}${discount} · ${s.rating} · ${s.delivery_time}\n`);
    process.stderr.write(`     ${s.reason}\n\n`);
  });

  // Emit machine-readable JSON on stdout for the slash command to parse
  process.stdout.write(`KUCH_BHI_SUGGESTIONS:${JSON.stringify(suggestions)}\n`);
  process.exit(0);
}
